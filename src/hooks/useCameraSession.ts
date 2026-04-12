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
  DEFAULT_SESSION_STATE,
  type OperatorSettings,
  type SessionState,
  type SourceDescriptor,
} from '../types'
import {
  getMediaErrorMessage,
  pickBestDeviceId,
  safeStopStream,
  toSourceDescriptor,
} from './kioskControllerUtils'

interface UseCameraSessionOptions {
  settings: OperatorSettings
  setSettings: Dispatch<SetStateAction<OperatorSettings>>
  videoRef: RefObject<HTMLVideoElement | null>
}

interface UseCameraSessionResult {
  sources: SourceDescriptor[]
  session: SessionState
  setSession: Dispatch<SetStateAction<SessionState>>
  openCapture: () => Promise<void>
  refreshSources: () => Promise<void>
  retryPermission: () => Promise<boolean>
}

export function useCameraSession({
  settings,
  setSettings,
  videoRef,
}: UseCameraSessionOptions): UseCameraSessionResult {
  const [sources, setSources] = useState<SourceDescriptor[]>([])
  const [session, setSession] = useState(DEFAULT_SESSION_STATE)
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

  useEffect(() => {
    let cancelled = false

    if (session.permissionState !== 'granted') {
      void releaseStream(streamRef.current)
      setSession((current) => ({
        ...current,
        streamState: 'idle',
      }))
      return
    }

    if (!settings.deviceId) {
      void releaseStream(streamRef.current)
      setSession((current) => ({
        ...current,
        streamState: sources.length > 0 ? 'missing-device' : 'idle',
      }))
      return
    }

    const deviceId = settings.deviceId

    async function startStream(): Promise<void> {
      setSession((current) => ({ ...current, streamState: 'starting' }))
      await releaseStream(streamRef.current)

      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            deviceId: { exact: deviceId },
          },
        })

        if (cancelled) {
          await safeStopStream(mediaStream)
          return
        }

        streamRef.current = mediaStream

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream
          await videoRef.current.play().catch(() => undefined)
        }

        setSession((current) => ({
          ...current,
          streamState: 'live',
          lastError: null,
        }))
      } catch (error) {
        if (cancelled) return

        setSession((current) => ({
          ...current,
          streamState: 'error',
          lastError: getMediaErrorMessage(error),
        }))
      }
    }

    void startStream()

    return () => {
      cancelled = true
    }
  }, [releaseStream, session.permissionState, settings.deviceId, sources.length, videoRef])

  useEffect(() => {
    return () => {
      void releaseStream(streamRef.current)
    }
  }, [releaseStream, videoRef])

  async function ensurePermission(): Promise<boolean> {
    try {
      const probe = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: true,
      })

      probe.getTracks().forEach((track) => track.stop())

      setSession((current) => ({
        ...current,
        permissionState: 'granted',
        lastError: null,
      }))

      return true
    } catch (error) {
      setSession((current) => ({
        ...current,
        permissionState: 'denied',
        streamState: 'idle',
        lastError: getMediaErrorMessage(error),
      }))

      return false
    }
  }

  async function refreshSourcesInternal(
    isDeviceChange = false,
    hasPermission = session.permissionState === 'granted',
  ): Promise<void> {
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
          setSession((current) => ({
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
        setSession((current) => ({
          ...current,
          streamState: 'missing-device',
          lastError: isDeviceChange
            ? 'Nguồn camera đang dùng đã bị ngắt. Hãy chọn lại source.'
            : null,
        }))
      }
    } catch (error) {
      setSession((current) => ({
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
    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange)

    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange)
    }
  }, [])

  async function openCapture(): Promise<void> {
    setSession((current) => ({
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
    session,
    setSession,
    openCapture,
    refreshSources: () => refreshSourcesInternal(false),
    retryPermission,
  }
}
