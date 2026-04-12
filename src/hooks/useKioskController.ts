import { useRef } from 'react'

import { useCameraSession } from './useCameraSession'
import { useCaptureActions } from './useCaptureActions'
import { useOperatorSettings } from './useOperatorSettings'
import { usePreviewCanvas } from './usePreviewCanvas'

export function useKioskController() {
  const previewFrameRef = useRef<HTMLDivElement | null>(null)
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  const { settings, settingsReady, setSettings, updateSettings } =
    useOperatorSettings()

  usePreviewCanvas({
    previewFrameRef,
    previewCanvasRef,
    videoRef,
    settings,
  })

  const { sources, session, setSession, openCapture, refreshSources, retryPermission } =
    useCameraSession({
      settings,
      setSettings,
      videoRef,
    })

  const {
    isBusy,
    countdownValue,
    chooseOutputDir,
    setOutputDirPath,
    handleShutter,
    setMode,
    setCountdown,
    rotate,
    toggleFlipHorizontal,
    toggleFlipVertical,
    setDevice,
  } = useCaptureActions({
    settings,
    setSettings,
    setSession,
    updateSettings,
    videoRef,
  })

  return {
    settings,
    settingsReady,
    sources,
    session,
    isBusy,
    countdownValue,
    previewFrameRef,
    previewCanvasRef,
    videoRef,
    chooseOutputDir,
    setOutputDirPath,
    openCapture,
    refreshSources,
    retryPermission,
    handleShutter,
    setMode,
    setCountdown,
    rotate,
    toggleFlipHorizontal,
    toggleFlipVertical,
    setDevice,
  }
}
