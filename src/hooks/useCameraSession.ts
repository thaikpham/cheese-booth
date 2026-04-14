import {
  useCallback,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from 'react'

import {
  DEFAULT_CAMERA_SESSION_STATE,
  type CameraSessionState,
  type OperatorSettings,
  type SourceDescriptor,
} from '../types'
import {
  getMediaErrorMessage,
  isMissingDeviceMediaError,
  isPermissionDeniedMediaError,
  isRecoverableMediaStreamError,
  pickBestDeviceId,
  safeStopStream,
  supportsCameraAccess,
  toSourceDescriptor,
} from './kioskControllerUtils'

interface UseCameraSessionOptions {
  settings: OperatorSettings
  setSettings: Dispatch<SetStateAction<OperatorSettings>>
  videoRef: RefObject<HTMLVideoElement | null>
}

interface UseCameraSessionResult {
  sources: SourceDescriptor[]
  cameraSession: CameraSessionState
  setCameraSession: Dispatch<SetStateAction<CameraSessionState>>
  openCapture: () => Promise<void>
  refreshSources: () => Promise<void>
  retryPermission: () => Promise<boolean>
}

async function maximizeVideoTrackResolution(
  mediaStream: MediaStream,
): Promise<void> {
  const [videoTrack] = mediaStream.getVideoTracks()

  if (
    !videoTrack ||
    typeof videoTrack.getCapabilities !== 'function' ||
    typeof videoTrack.applyConstraints !== 'function'
  ) {
    return
  }

  const capabilities = videoTrack.getCapabilities()
  const nextConstraints: MediaTrackConstraints = {}

  if (typeof capabilities.width?.max === 'number' && capabilities.width.max > 0) {
    nextConstraints.width = { ideal: capabilities.width.max }
  }

  if (typeof capabilities.height?.max === 'number' && capabilities.height.max > 0) {
    nextConstraints.height = { ideal: capabilities.height.max }
  }

  if (Object.keys(nextConstraints).length === 0) {
    return
  }

  await videoTrack.applyConstraints(nextConstraints).catch(() => undefined)
}

export function useCameraSession({
  settings,
  setSettings,
  videoRef,
}: UseCameraSessionOptions): UseCameraSessionResult {
  const [sources, setSources] = useState<SourceDescriptor[]>([])
  const [cameraSession, setCameraSession] = useState(DEFAULT_CAMERA_SESSION_STATE)
  const streamRef = useRef<MediaStream | null>(null)

  const releaseStream = useCallback(async (stream: MediaStream | null): Promise<void> => {
    await safeStopStream(stream)

    if (stream && streamRef.current === stream) {
      streamRef.current = null
    }

    const video = videoRef.current

    if (video && (!stream || video.srcObject === stream)) {
      video.pause()
      video.srcObject = null
    }
  }, [videoRef])

  const syncMissingDeviceState = useEffectEvent(() => {
    void refreshSourcesInternal(true, true)
  })

  useEffect(() => {
    let cancelled = false

    if (cameraSession.permissionState !== 'granted') {
      void releaseStream(streamRef.current)
      setCameraSession((current) => ({
        ...current,
        streamState:
          current.streamState === 'error' || current.streamState === 'missing-device'
            ? current.streamState
            : 'idle',
      }))
      return
    }

    if (!settings.deviceId) {
      void releaseStream(streamRef.current)
      setCameraSession((current) => ({
        ...current,
        streamState: sources.length > 0 ? 'missing-device' : 'idle',
      }))
      return
    }

    const deviceId = settings.deviceId

    async function startStream(): Promise<void> {
      if (!supportsCameraAccess()) {
        setCameraSession((current) => ({
          ...current,
          permissionState: 'unknown',
          streamState: 'error',
          lastError: 'Runtime hiện tại không hỗ trợ camera.',
        }))
        return
      }

      setCameraSession((current) => ({ ...current, streamState: 'starting' }))
      await releaseStream(streamRef.current)

      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            deviceId: { exact: deviceId },
            width: { ideal: 4096 },
            height: { ideal: 3072 },
            facingMode: 'user',
          },
        })

        await maximizeVideoTrackResolution(mediaStream)

        if (cancelled) {
          await safeStopStream(mediaStream)
          return
        }

        streamRef.current = mediaStream

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream
          await videoRef.current.play().catch(() => undefined)
        }

        setCameraSession((current) => ({
          ...current,
          streamState: 'live',
          lastError: null,
        }))
      } catch (error) {
        if (cancelled) return

        const lastError = getMediaErrorMessage(error)

        if (isPermissionDeniedMediaError(error)) {
          setCameraSession((current) => ({
            ...current,
            permissionState: 'denied',
            streamState: 'idle',
            lastError,
          }))
          return
        }

        if (isMissingDeviceMediaError(error)) {
          setCameraSession((current) => ({
            ...current,
            permissionState: 'granted',
            streamState: 'missing-device',
            lastError,
          }))
          syncMissingDeviceState()
          return
        }

        setCameraSession((current) => ({
          ...current,
          permissionState:
            isRecoverableMediaStreamError(error) ? 'granted' : current.permissionState,
          streamState: 'error',
          lastError,
        }))
      }
    }

    void startStream()

    return () => {
      cancelled = true
    }
  }, [cameraSession.permissionState, releaseStream, settings.deviceId, sources.length, videoRef])

  useEffect(() => {
    return () => {
      void releaseStream(streamRef.current)
    }
  }, [releaseStream, videoRef])

  async function ensurePermission(): Promise<boolean> {
    if (!supportsCameraAccess()) {
      setCameraSession((current) => ({
        ...current,
        permissionState: 'unknown',
        streamState: 'error',
        lastError: 'Runtime hiện tại không hỗ trợ camera.',
      }))

      return false
    }

    try {
      const probe = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: true,
      })

      probe.getTracks().forEach((track) => track.stop())

      setCameraSession((current) => ({
        ...current,
        permissionState: 'granted',
        lastError: null,
      }))

      return true
    } catch (error) {
      const lastError = getMediaErrorMessage(error)

      if (isPermissionDeniedMediaError(error)) {
        setCameraSession((current) => ({
          ...current,
          permissionState: 'denied',
          streamState: 'idle',
          lastError,
        }))

        return false
      }

      setCameraSession((current) => ({
        ...current,
        permissionState:
          isMissingDeviceMediaError(error) || isRecoverableMediaStreamError(error)
            ? 'granted'
            : 'unknown',
        streamState: isMissingDeviceMediaError(error) ? 'missing-device' : 'error',
        lastError,
      }))

      return false
    }
  }

  async function refreshSourcesInternal(
    isDeviceChange = false,
    hasPermission = cameraSession.permissionState === 'granted',
  ): Promise<void> {
    if (!supportsCameraAccess()) {
      setCameraSession((current) => ({
        ...current,
        streamState: 'error',
        lastError: 'Runtime hiện tại không hỗ trợ camera.',
      }))
      return
    }

    if (!hasPermission) {
      return
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoSources = devices
        .filter((device) => device.kind === 'videoinput')
        .map(toSourceDescriptor)
      const nextDeviceId = pickBestDeviceId(videoSources, settings.deviceId)
      const currentStillExists =
        !!settings.deviceId &&
        videoSources.some((source) => source.deviceId === settings.deviceId)
      const shouldSwitchDevice =
        !!nextDeviceId && (!settings.deviceId || !currentStillExists)

      setSources(videoSources)

      if (shouldSwitchDevice && nextDeviceId) {
        setSettings((current) =>
          current.deviceId === nextDeviceId
            ? current
            : { ...current, deviceId: nextDeviceId },
        )

        if (isDeviceChange) {
          setCameraSession((current) => ({
            ...current,
            lastError: null,
          }))
        }

        return
      }

      if (settings.deviceId && !currentStillExists && !nextDeviceId) {
        await releaseStream(streamRef.current)

        setSettings((current) => ({
          ...current,
          deviceId: null,
        }))
        setCameraSession((current) => ({
          ...current,
          streamState: 'missing-device',
          lastError: isDeviceChange
            ? 'Nguồn camera đang dùng đã bị ngắt. Hãy chọn lại source.'
            : null,
        }))
      }
    } catch (error) {
      setCameraSession((current) => ({
        ...current,
        streamState: 'error',
        lastError: getMediaErrorMessage(error),
      }))
    }
  }

  const handleDeviceChange = useEffectEvent(() => {
    void refreshSourcesInternal(true)
  })

  useEffect(() => {
    if (!supportsCameraAccess() || typeof navigator.mediaDevices.addEventListener !== 'function') {
      return
    }

    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange)

    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange)
    }
  }, [])

  async function openCapture(): Promise<void> {
    setCameraSession((current) => ({
      ...current,
      lastError: null,
    }))

    const hasPermission = await ensurePermission()

    if (!hasPermission) {
      return
    }

    await refreshSourcesInternal(false, true)
  }

  async function retryPermission(): Promise<boolean> {
    const granted = await ensurePermission()

    if (granted) {
      await refreshSourcesInternal(false, true)
    }

    return granted
  }

  return {
    sources,
    cameraSession,
    setCameraSession,
    openCapture,
    refreshSources: () => refreshSourcesInternal(false),
    retryPermission,
  }
}
