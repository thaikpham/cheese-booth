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

export interface SessionState {
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

export const DEFAULT_OPERATOR_SETTINGS: OperatorSettings = {
  captureMode: 'photo',
  deviceId: null,
  countdownSec: 3,
  rotationQuarter: 0,
  flipHorizontal: true,
  flipVertical: false,
  outputDir: null,
}

export const DEFAULT_SESSION_STATE: SessionState = {
  permissionState: 'unknown',
  streamState: 'idle',
  lastError: null,
}
