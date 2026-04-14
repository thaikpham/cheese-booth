export type CaptureMode = 'photo' | 'boomerang'

export type CountdownSec = 3 | 5 | 10

export type PermissionState = 'unknown' | 'granted' | 'denied'

export type StreamState = 'idle' | 'starting' | 'live' | 'missing-device' | 'error'

export interface OperatorSettings {
  captureMode: CaptureMode
  deviceId: string | null
  countdownSec: CountdownSec
  rotationQuarter: 0 | 1 | 2 | 3
  flipHorizontal: boolean
  flipVertical: boolean
  outputDir: string | null
}

export interface SourceDescriptor {
  deviceId: string
  label: string
  isSonyPreferred: boolean
}

export interface CameraSessionState {
  permissionState: PermissionState
  streamState: StreamState
  lastError: string | null
}

export interface TransformSettings {
  rotationQuarter: number
  flipHorizontal: boolean
  flipVertical: boolean
}

export interface BoomerangRecordingIndicator {
  elapsedMs: number
  totalMs: number
  remainingMs: number
  progress: number
}

export type CaptureShareStatus = 'idle' | 'uploading' | 'ready' | 'error'

export interface CaptureCloudShare {
  status: CaptureShareStatus
  downloadToken?: string
  downloadUrl?: string
  expiresAt?: string
  errorMessage?: string
}

export type BrowserQrQueueStatus = 'generating' | 'ready' | 'error'

export interface BrowserQrQueueItem {
  id: string
  kind: CaptureMode
  createdAt: number
  accentColor: string
  status: BrowserQrQueueStatus
  downloadUrl?: string
  expiresAt?: string
  errorMessage?: string
}

export interface CaptureOutcome {
  kind: CaptureMode
  previewUrl: string
  mimeType: string
  width: number
  height: number
  savedPath: string
  share: CaptureCloudShare
}

export type BrowserCaptureSessionStatus =
  | 'idle'
  | 'active'
  | 'reviewing-shot'
  | 'finalizing'
  | 'ready'
  | 'error'

export interface BrowserSessionItem {
  id: string
  kind: CaptureMode
  sequence: number
  createdAt: number
  previewUrl: string
  posterUrl: string
  mimeType: string
  extension: string
  width: number
  height: number
  blob: Blob
}

export interface BrowserSessionShareState {
  status: 'idle' | 'finalizing' | 'ready' | 'error'
  sessionId?: string
  downloadToken?: string
  galleryUrl?: string
  expiresAt?: string
  errorMessage?: string
}

export interface BrowserCaptureSessionState {
  status: BrowserCaptureSessionStatus
  startedAt: number | null
  maxItems: number
  items: BrowserSessionItem[]
  share: BrowserSessionShareState
}

export const DEFAULT_OPERATOR_SETTINGS: OperatorSettings = {
  captureMode: 'photo',
  deviceId: null,
  countdownSec: 3,
  rotationQuarter: 0,
  flipHorizontal: true,
  flipVertical: false,
  outputDir: null,
}

export const DEFAULT_CAMERA_SESSION_STATE: CameraSessionState = {
  permissionState: 'unknown',
  streamState: 'idle',
  lastError: null,
}

export const DEFAULT_BROWSER_CAPTURE_SESSION_STATE: BrowserCaptureSessionState = {
  status: 'idle',
  startedAt: null,
  maxItems: 4,
  items: [],
  share: {
    status: 'idle',
  },
}
