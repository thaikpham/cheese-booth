import { useState, type Dispatch, type RefObject, type SetStateAction } from 'react'

import { renderBoomerangFromVideo, renderPhotoFromVideo } from '../lib/media'
import { pickOutputDirectory, saveCaptureToOutputDir } from '../lib/storage'
import type {
  CaptureMode,
  CountdownSec,
  OperatorSettings,
  SessionState,
} from '../types'
import { getMediaErrorMessage, transformFromSettings } from './kioskControllerUtils'

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
  chooseOutputDir: () => Promise<string | null>
  setOutputDirPath: (outputDir: string) => void
  handleShutter: () => Promise<boolean>
  setMode: (captureMode: CaptureMode) => void
  setCountdown: (countdownSec: CountdownSec) => void
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

  function setOutputDirPath(outputDir: string): void {
    const normalized = outputDir.trim()

    setSettings((current) => ({
      ...current,
      outputDir: normalized || null,
    }))
    setSession((current) => ({
      ...current,
      lastError: null,
    }))
  }

  async function runCountdown(): Promise<void> {
    for (let tick = Number(settings.countdownSec); tick >= 0; tick -= 1) {
      setCountdownValue(tick)
      await new Promise((resolve) => {
        window.setTimeout(resolve, tick === 0 ? 350 : 1000)
      })
    }

    setCountdownValue(null)
  }

  async function persistCapture(
    kind: CaptureMode,
    blob: Blob,
    extension: string,
    createdAt: number,
  ): Promise<string> {
    if (!settings.outputDir) {
      throw new Error('Chưa chọn thư mục lưu media.')
    }

    return saveCaptureToOutputDir(settings.outputDir, kind, blob, extension, createdAt)
  }

  async function captureAndPersist(kind: CaptureMode): Promise<void> {
    const video = videoRef.current

    if (!video || video.readyState < 2) {
      throw new Error('Preview chưa sẵn sàng để capture.')
    }

    const rendered =
      kind === 'photo'
        ? await renderPhotoFromVideo(video, transformFromSettings(settings))
        : await renderBoomerangFromVideo(video, transformFromSettings(settings))

    await persistCapture(kind, rendered.blob, rendered.extension, Date.now())
  }

  async function handleShutter(): Promise<boolean> {
    if (isBusy) return false

    setIsBusy(true)
    setSession((current) => ({ ...current, lastError: null }))

    try {
      await runCountdown()
      await captureAndPersist(settings.captureMode)
      return true
    } catch (error) {
      setSession((current) => ({
        ...current,
        lastError: getMediaErrorMessage(error),
      }))
    } finally {
      setCountdownValue(null)
      setIsBusy(false)
    }

    return false
  }

  return {
    isBusy,
    countdownValue,
    chooseOutputDir,
    setOutputDirPath,
    handleShutter,
    setMode: (captureMode: CaptureMode) => updateSettings({ captureMode }),
    setCountdown: (countdownSec: CountdownSec) => updateSettings({ countdownSec }),
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
