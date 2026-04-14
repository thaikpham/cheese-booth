import {
  startTransition,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from 'react'

import { playCountdownCue, playShutterCue } from '../lib/captureSounds'
import {
  completeCloudCaptureSession,
  initCloudCaptureSession,
  uploadCaptureToSignedUrl,
} from '../lib/cloudShare'
import {
  BOOMERANG_DURATION_MS,
  type RenderedCapture,
  renderBoomerangFromVideo,
  renderPhotoFromVideo,
} from '../lib/media'
import { getRuntimeEnvironment } from '../lib/runtime'
import { pickOutputDirectory, saveCaptureToOutputDir } from '../lib/storage'
import type {
  BoomerangRecordingIndicator,
  BrowserCaptureSessionState,
  BrowserSessionItem,
  CameraSessionState,
  CaptureMode,
  CaptureCloudShare,
  CaptureOutcome,
  CountdownSec,
  OperatorSettings,
} from '../types'
import { useBrowserCaptureSession } from './useBrowserCaptureSession'
import { getMediaErrorMessage, transformFromSettings } from './kioskControllerUtils'

const SHUTTER_CAPTURE_DELAY_MS = 180
const BROWSER_SESSION_REVIEW_LABEL = 'Cloud session · chờ chốt QR'

interface UseCaptureActionsOptions {
  settings: OperatorSettings
  setSettings: Dispatch<SetStateAction<OperatorSettings>>
  setCameraSession: Dispatch<SetStateAction<CameraSessionState>>
  updateSettings: (next: Partial<OperatorSettings>) => void
  videoRef: RefObject<HTMLVideoElement | null>
}

interface UseCaptureActionsResult {
  isBusy: boolean
  countdownValue: number | null
  boomerangRecording: BoomerangRecordingIndicator | null
  captureOutcome: CaptureOutcome | null
  browserSession: BrowserCaptureSessionState
  chooseOutputDir: () => Promise<string | null>
  handleShutter: () => Promise<boolean>
  startBrowserSession: () => void
  finalizeBrowserSession: () => Promise<boolean>
  retryBrowserSessionShare: () => Promise<boolean>
  cancelBrowserSession: () => void
  resetBrowserSession: () => void
  approveCaptureOutcome: () => void
  rejectCaptureOutcome: () => void
  dismissCaptureOutcome: () => void
  setMode: (captureMode: CaptureMode) => void
  setCountdown: (countdownSec: CountdownSec) => void
  setRotationQuarter: (rotationQuarter: OperatorSettings['rotationQuarter']) => void
  rotate: () => void
  toggleFlipHorizontal: () => void
  toggleFlipVertical: () => void
  setDevice: (deviceId: string) => void
}

function revokeUrl(url?: string): void {
  if (url?.startsWith('blob:')) {
    window.URL.revokeObjectURL(url)
  }
}

function disposeBrowserSessionItem(item: BrowserSessionItem | null): void {
  if (!item) {
    return
  }

  revokeUrl(item.previewUrl)

  if (item.posterUrl !== item.previewUrl) {
    revokeUrl(item.posterUrl)
  }
}

function disposeCaptureOutcome(outcome: CaptureOutcome | null): void {
  if (!outcome) {
    return
  }

  revokeUrl(outcome.previewUrl)
}

export function useCaptureActions({
  settings,
  setSettings,
  setCameraSession,
  updateSettings,
  videoRef,
}: UseCaptureActionsOptions): UseCaptureActionsResult {
  const [isBusy, setIsBusy] = useState(false)
  const [countdownValue, setCountdownValue] = useState<number | null>(null)
  const [boomerangRecording, setBoomerangRecording] =
    useState<BoomerangRecordingIndicator | null>(null)
  const [captureOutcome, setCaptureOutcome] = useState<CaptureOutcome | null>(null)
  const [stagedBrowserItem, setStagedBrowserItem] = useState<BrowserSessionItem | null>(
    null,
  )
  const {
    browserSession,
    startBrowserSession: openBrowserSession,
    resetBrowserSession: clearBrowserSession,
    cancelBrowserSession: abortBrowserSession,
    enterReviewingShot,
    rejectReviewedShot,
    addSessionItem,
    startFinalizing,
    completeSessionShare,
    failSessionShare,
  } = useBrowserCaptureSession()
  const stagedBrowserItemRef = useRef<BrowserSessionItem | null>(null)
  const captureOutcomeRef = useRef<CaptureOutcome | null>(null)

  stagedBrowserItemRef.current = stagedBrowserItem
  captureOutcomeRef.current = captureOutcome

  useEffect(() => {
    return () => {
      disposeBrowserSessionItem(stagedBrowserItemRef.current)
      disposeCaptureOutcome(captureOutcomeRef.current)
    }
  }, [])

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
      setCameraSession((current) => ({
        ...current,
        lastError: null,
      }))

      return selected
    } catch (error) {
      setCameraSession((current) => ({
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

  async function renderCapture(kind: CaptureMode): Promise<RenderedCapture> {
    const video = videoRef.current

    if (!video || video.readyState < 2) {
      throw new Error('Preview chưa sẵn sàng để capture.')
    }

    return kind === 'photo'
      ? renderPhotoFromVideo(video, transformFromSettings(settings))
      : renderBoomerangFromVideo(video, transformFromSettings(settings), {
          onProgress: (progress) => {
            startTransition(() => {
              setBoomerangRecording(progress)
            })
          },
        })
  }

  async function captureAndPersist(kind: CaptureMode): Promise<{
    outcome: CaptureOutcome
    runtimeKind: ReturnType<typeof getRuntimeEnvironment>['kind']
    rendered: RenderedCapture
  }> {
    const rendered = await renderCapture(kind)
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
      savedPath = BROWSER_SESSION_REVIEW_LABEL
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
      rendered,
    }
  }

  function clearStagedBrowserShot(): void {
    disposeBrowserSessionItem(stagedBrowserItemRef.current)
    stagedBrowserItemRef.current = null
    setStagedBrowserItem(null)
  }

  function clearCaptureOutcome(): void {
    disposeCaptureOutcome(captureOutcomeRef.current)
    captureOutcomeRef.current = null
    setCaptureOutcome(null)
  }

  function dismissCaptureOutcome(): void {
    const runtime = getRuntimeEnvironment(settings.outputDir)

    if (runtime.kind === 'browser') {
      rejectCaptureOutcome()
      return
    }

    clearCaptureOutcome()
  }

  function rejectCaptureOutcome(): void {
    const runtime = getRuntimeEnvironment(settings.outputDir)

    if (runtime.kind === 'browser') {
      clearCaptureOutcome()
      clearStagedBrowserShot()
      rejectReviewedShot()
      return
    }

    clearCaptureOutcome()
  }

  function approveCaptureOutcome(): void {
    const runtime = getRuntimeEnvironment(settings.outputDir)

    if (runtime.kind !== 'browser') {
      return
    }

    const stagedItem = stagedBrowserItemRef.current

    if (!stagedItem) {
      return
    }

    addSessionItem(stagedItem)
    stagedBrowserItemRef.current = null
    setStagedBrowserItem(null)
    setCaptureOutcome(null)
    captureOutcomeRef.current = null
  }

  function resetBrowserSessionFlow(): void {
    clearCaptureOutcome()
    clearStagedBrowserShot()
    clearBrowserSession()
  }

  function startBrowserSession(): void {
    resetBrowserSessionFlow()
    openBrowserSession()
  }

  function cancelBrowserSession(): void {
    clearCaptureOutcome()
    clearStagedBrowserShot()
    abortBrowserSession()
  }

  async function finalizeBrowserSession(): Promise<boolean> {
    const runtime = getRuntimeEnvironment(settings.outputDir)

    if (runtime.kind !== 'browser' || isBusy) {
      return false
    }

    if (browserSession.items.length === 0) {
      return false
    }

    setIsBusy(true)
    setCameraSession((current) => ({
      ...current,
      lastError: null,
    }))
    startFinalizing()

    try {
      const init = await initCloudCaptureSession(
        browserSession.items.map((item) => ({
          kind: item.kind,
          mimeType: item.mimeType,
          extension: item.extension,
          byteSize: item.blob.size,
          width: item.width,
          height: item.height,
          sequence: item.sequence,
        })),
      )

      await Promise.all(
        init.items.map(async (remoteItem) => {
          const localItem = browserSession.items.find(
            (item) => item.sequence === remoteItem.sequence,
          )

          if (!localItem) {
            throw new Error(
              `Không tìm thấy item local cho sequence ${remoteItem.sequence}.`,
            )
          }

          await uploadCaptureToSignedUrl(remoteItem.upload, localItem.blob)
        }),
      )

      const complete = await completeCloudCaptureSession(init.sessionId)

      completeSessionShare({
        sessionId: init.sessionId,
        downloadToken: complete.downloadToken,
        galleryUrl: complete.galleryUrl,
        expiresAt: complete.expiresAt,
      })

      return true
    } catch (error) {
      failSessionShare(
        error instanceof Error
          ? error.message
          : 'Không thể hoàn tất cloud session hiện tại.',
      )
    } finally {
      setIsBusy(false)
    }

    return false
  }

  async function handleShutter(): Promise<boolean> {
    if (isBusy) return false

    const runtime = getRuntimeEnvironment(settings.outputDir)

    if (
      runtime.kind === 'browser' &&
      (browserSession.status !== 'active' ||
        browserSession.items.length >= browserSession.maxItems)
    ) {
      return false
    }

    setIsBusy(true)
    setBoomerangRecording(null)
    setCameraSession((current) => ({ ...current, lastError: null }))

    if (runtime.kind === 'desktop') {
      clearCaptureOutcome()
    }

    if (runtime.kind === 'browser') {
      clearCaptureOutcome()
      clearStagedBrowserShot()
    }

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
      captureOutcomeRef.current = outcome

      if (runtimeKind === 'browser') {
        const previewUrl = outcome.previewUrl
        const posterUrl = rendered.posterBlob
          ? window.URL.createObjectURL(rendered.posterBlob)
          : previewUrl
        const nextItem: BrowserSessionItem = {
          id: crypto.randomUUID(),
          kind: settings.captureMode,
          sequence: browserSession.items.length + 1,
          createdAt: Date.now(),
          previewUrl,
          posterUrl,
          mimeType: rendered.mimeType,
          extension: rendered.extension,
          width: rendered.width,
          height: rendered.height,
          blob: rendered.blob,
        }

        stagedBrowserItemRef.current = nextItem
        setStagedBrowserItem(nextItem)
        enterReviewingShot()
      }

      return true
    } catch (error) {
      setCameraSession((current) => ({
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
    browserSession,
    chooseOutputDir,
    handleShutter,
    startBrowserSession,
    finalizeBrowserSession,
    retryBrowserSessionShare: finalizeBrowserSession,
    cancelBrowserSession,
    resetBrowserSession: resetBrowserSessionFlow,
    approveCaptureOutcome,
    rejectCaptureOutcome,
    dismissCaptureOutcome,
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

