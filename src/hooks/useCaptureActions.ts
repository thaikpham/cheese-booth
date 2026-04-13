import {
  startTransition,
  useEffect,
  useState,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from 'react'

import { playCountdownCue, playShutterCue } from '../lib/captureSounds'
import {
  BOOMERANG_DURATION_MS,
  renderBoomerangFromVideo,
  renderPhotoFromVideo,
} from '../lib/media'
import { pickOutputDirectory, saveCaptureToOutputDir } from '../lib/storage'
import { getRuntimeEnvironment } from '../lib/runtime'
import type {
  BrowserQrQueueItem,
  BoomerangRecordingIndicator,
  CaptureMode,
  CaptureCloudShare,
  CaptureOutcome,
  CountdownSec,
  OperatorSettings,
  SessionState,
} from '../types'
import { getMediaErrorMessage, transformFromSettings } from './kioskControllerUtils'
import {
  BROWSER_CLOUD_STORAGE_REVIEW_LABEL,
  type PendingCloudShareUpload,
  useCaptureCloudShare,
} from './useCaptureCloudShare'

const SHUTTER_CAPTURE_DELAY_MS = 180

interface UseCaptureActionsOptions {
  settings: OperatorSettings
  setSettings: Dispatch<SetStateAction<OperatorSettings>>
  setSession: Dispatch<SetStateAction<SessionState>>
  updateSettings: (next: Partial<OperatorSettings>) => void
  videoRef: RefObject<HTMLVideoElement | null>
}

interface UseCaptureActionsResult {
  isBusy: boolean
  countdownValue: number | null
  boomerangRecording: BoomerangRecordingIndicator | null
  captureOutcome: CaptureOutcome | null
  browserQrQueue: BrowserQrQueueItem[]
  chooseOutputDir: () => Promise<string | null>
  handleShutter: () => Promise<boolean>
  approveCaptureOutcomeShare: () => void
  rejectCaptureOutcome: () => void
  dismissCaptureOutcome: () => void
  retryBrowserQrQueueItem: (id: string) => void
  setMode: (captureMode: CaptureMode) => void
  setCountdown: (countdownSec: CountdownSec) => void
  setRotationQuarter: (rotationQuarter: OperatorSettings['rotationQuarter']) => void
  rotate: () => void
  toggleFlipHorizontal: () => void
  toggleFlipVertical: () => void
  setDevice: (deviceId: string) => void
}

export function useCaptureActions({
  settings,
  setSettings,
  setSession,
  updateSettings,
  videoRef,
}: UseCaptureActionsOptions): UseCaptureActionsResult {
  const [isBusy, setIsBusy] = useState(false)
  const [countdownValue, setCountdownValue] = useState<number | null>(null)
  const [boomerangRecording, setBoomerangRecording] =
    useState<BoomerangRecordingIndicator | null>(null)
  const [captureOutcome, setCaptureOutcome] = useState<CaptureOutcome | null>(null)
  const {
    browserQrQueue,
    resetStagedBrowserCloudShare,
    stageBrowserCloudShare,
    approveBrowserCloudShare,
    retryBrowserQrQueueItem,
  } = useCaptureCloudShare()
  const previewUrl = captureOutcome?.previewUrl

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith('blob:')) {
        window.URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  async function chooseOutputDir(): Promise<string | null> {
    try {
      const selected = await pickOutputDirectory(settings.outputDir)

      if (!selected) {
        return null
      }

      setSettings((current) => ({
        ...current,
        outputDir: selected,
      }))
      setSession((current) => ({
        ...current,
        lastError: null,
      }))

      return selected
    } catch (error) {
      setSession((current) => ({
        ...current,
        lastError: getMediaErrorMessage(error),
      }))

      return null
    }
  }

  async function runCountdown(): Promise<void> {
    for (let tick = Number(settings.countdownSec); tick >= 0; tick -= 1) {
      setCountdownValue(tick)
      if (tick === 0) {
        void playShutterCue()
      } else {
        void playCountdownCue(tick)
      }
      await new Promise((resolve) => {
        window.setTimeout(resolve, tick === 0 ? SHUTTER_CAPTURE_DELAY_MS : 1000)
      })
    }

    setCountdownValue(null)
  }

  async function persistDesktopCapture(
    kind: CaptureMode,
    blob: Blob,
    extension: string,
    createdAt: number,
  ): Promise<string> {
    if (!settings.outputDir) {
      throw new Error('Chưa chọn thư mục lưu media.')
    }

    return saveCaptureToOutputDir(
      settings.outputDir,
      kind,
      blob,
      extension,
      createdAt,
    )
  }

  async function captureAndPersist(kind: CaptureMode): Promise<{
    outcome: CaptureOutcome
    runtimeKind: ReturnType<typeof getRuntimeEnvironment>['kind']
    rendered: PendingCloudShareUpload
  }> {
    const video = videoRef.current

    if (!video || video.readyState < 2) {
      throw new Error('Preview chưa sẵn sàng để capture.')
    }

    const rendered =
      kind === 'photo'
        ? await renderPhotoFromVideo(video, transformFromSettings(settings))
        : await renderBoomerangFromVideo(video, transformFromSettings(settings), {
            onProgress: (progress) => {
              startTransition(() => {
                setBoomerangRecording(progress)
              })
            },
          })

    const runtime = getRuntimeEnvironment(settings.outputDir)
    const share: CaptureCloudShare = { status: 'idle' }
    let savedPath = settings.outputDir ?? runtime.storageTargetLabel

    if (runtime.kind === 'desktop') {
      if (!runtime.storageReady) {
        throw new Error('Chưa chọn thư mục lưu media.')
      }

      savedPath = await persistDesktopCapture(
        kind,
        rendered.blob,
        rendered.extension,
        Date.now(),
      )
    } else {
      savedPath = BROWSER_CLOUD_STORAGE_REVIEW_LABEL
    }

    return {
      outcome: {
        kind,
        previewUrl: window.URL.createObjectURL(rendered.blob),
        mimeType: rendered.mimeType,
        width: rendered.width,
        height: rendered.height,
        savedPath,
        share,
      },
      runtimeKind: runtime.kind,
      rendered: {
        ...rendered,
        kind,
      },
    }
  }

  function dismissCaptureOutcome(): void {
    resetStagedBrowserCloudShare()
    setCaptureOutcome(null)
  }

  function rejectCaptureOutcome(): void {
    dismissCaptureOutcome()
  }

  function approveCaptureOutcomeShare(): void {
    if (captureOutcome?.share.status !== 'idle') {
      return
    }

    if (!approveBrowserCloudShare()) {
      return
    }

    setCaptureOutcome(null)
  }

  async function handleShutter(): Promise<boolean> {
    if (isBusy) return false

    setIsBusy(true)
    setBoomerangRecording(null)
    dismissCaptureOutcome()
    setSession((current) => ({ ...current, lastError: null }))

    try {
      await runCountdown()

      if (settings.captureMode === 'boomerang') {
        setBoomerangRecording({
          elapsedMs: 0,
          totalMs: BOOMERANG_DURATION_MS,
          remainingMs: BOOMERANG_DURATION_MS,
          progress: 0,
        })
      }

      const { outcome, runtimeKind, rendered } = await captureAndPersist(
        settings.captureMode,
      )

      setCaptureOutcome(outcome)

      if (runtimeKind === 'browser') {
        stageBrowserCloudShare(rendered)
      }

      return true
    } catch (error) {
      setSession((current) => ({
        ...current,
        lastError: getMediaErrorMessage(error),
      }))
    } finally {
      setCountdownValue(null)
      setBoomerangRecording(null)
      setIsBusy(false)
    }

    return false
  }

  return {
    isBusy,
    countdownValue,
    boomerangRecording,
    captureOutcome,
    browserQrQueue,
    chooseOutputDir,
    handleShutter,
    approveCaptureOutcomeShare,
    rejectCaptureOutcome,
    dismissCaptureOutcome,
    retryBrowserQrQueueItem,
    setMode: (captureMode: CaptureMode) => updateSettings({ captureMode }),
    setCountdown: (countdownSec: CountdownSec) => updateSettings({ countdownSec }),
    setRotationQuarter: (rotationQuarter: OperatorSettings['rotationQuarter']) =>
      updateSettings({ rotationQuarter }),
    rotate: () =>
      setSettings((current) => ({
        ...current,
        rotationQuarter: (((current.rotationQuarter + 1) % 4) as 0 | 1 | 2 | 3),
      })),
    toggleFlipHorizontal: () =>
      setSettings((current) => ({
        ...current,
        flipHorizontal: !current.flipHorizontal,
      })),
    toggleFlipVertical: () =>
      setSettings((current) => ({
        ...current,
        flipVertical: !current.flipVertical,
      })),
    setDevice: (deviceId: string) => updateSettings({ deviceId: deviceId || null }),
  }
}
