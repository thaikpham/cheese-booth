import type {
  OperatorSettings,
  SourceDescriptor,
  TransformSettings,
} from '../types'

const PERMISSION_DENIED_ERROR_NAMES = new Set([
  'NotAllowedError',
  'PermissionDeniedError',
  'SecurityError',
])

const MISSING_DEVICE_ERROR_NAMES = new Set([
  'DevicesNotFoundError',
  'NotFoundError',
  'OverconstrainedError',
])

const RECOVERABLE_STREAM_ERROR_NAMES = new Set([
  'AbortError',
  'NotReadableError',
  'TrackStartError',
])

function getErrorName(error: unknown): string {
  return error instanceof Error ? error.name : ''
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : ''
}

export function supportsCameraAccess(): boolean {
  if (typeof navigator === 'undefined') {
    return false
  }

  return (
    typeof navigator.mediaDevices?.getUserMedia === 'function' &&
    typeof navigator.mediaDevices?.enumerateDevices === 'function'
  )
}

export function isPermissionDeniedMediaError(error: unknown): boolean {
  return PERMISSION_DENIED_ERROR_NAMES.has(getErrorName(error))
}

export function isMissingDeviceMediaError(error: unknown): boolean {
  return MISSING_DEVICE_ERROR_NAMES.has(getErrorName(error))
}

export function isRecoverableMediaStreamError(error: unknown): boolean {
  return RECOVERABLE_STREAM_ERROR_NAMES.has(getErrorName(error))
}

export function getMediaErrorMessage(error: unknown): string {
  if (isPermissionDeniedMediaError(error)) {
    return 'Bạn đã từ chối quyền truy cập camera.'
  }

  if (isMissingDeviceMediaError(error)) {
    return 'Không tìm thấy nguồn camera phù hợp.'
  }

  if (getErrorName(error) === 'NotReadableError') {
    return 'Nguồn camera đang bị ứng dụng khác chiếm dụng.'
  }

  const message = getErrorMessage(error)

  if (/scope|not allowed/i.test(message)) {
    return 'Thư mục lưu không còn quyền truy cập. Hãy chọn lại thư mục.'
  }

  if (/permission denied|read-only|readonly/i.test(message)) {
    return 'Không thể ghi vào thư mục đã chọn. Hãy chọn thư mục khác.'
  }

  if (message) {
    return message
  }

  return 'Không thể truy cập camera.'
}

function scoreSonyPreference(label: string): number {
  const normalized = label.toLowerCase()

  // 1. TOP PRIORITY: Capture Cards (Highest Quality/Stability)
  if (
    normalized.includes('cam link') ||
    normalized.includes('video capture') ||
    normalized.includes('capture card') ||
    normalized.includes('magewell')
  ) {
    return 0
  }

  // 2. HIGH PRIORITY: Native USB Streaming (UVC/UAC 4K/FHD)
  if (normalized.includes('usb streaming') || normalized.includes('usb livestream')) {
    return 1
  }

  // 3. STANDARD SONY: General Sony UVC Devices
  if (normalized.includes('sony')) {
    // If it's Imaging Edge, it's a fallback (low priority)
    if (normalized.includes('imaging edge')) return 5
    return 2
  }

  return 10
}

export function toSourceDescriptor(
  device: MediaDeviceInfo,
  index: number,
): SourceDescriptor {
  return {
    deviceId: device.deviceId,
    label: device.label || `Camera ${index + 1}`,
    isSonyPreferred: scoreSonyPreference(device.label) < 10,
  }
}

export function pickBestDeviceId(
  sources: SourceDescriptor[],
  currentDeviceId: string | null,
): string | null {
  if (currentDeviceId && sources.some((source) => source.deviceId === currentDeviceId)) {
    return currentDeviceId
  }

  const ranked = [...sources].sort((left, right) => {
    const scoreDiff =
      scoreSonyPreference(left.label) - scoreSonyPreference(right.label)

    if (scoreDiff !== 0) {
      return scoreDiff
    }

    return left.label.localeCompare(right.label)
  })

  return ranked[0]?.deviceId ?? null
}

export function transformFromSettings(
  settings: OperatorSettings,
): TransformSettings {
  return {
    rotationQuarter: settings.rotationQuarter,
    flipHorizontal: settings.flipHorizontal,
    flipVertical: settings.flipVertical,
  }
}

export async function safeStopStream(stream: MediaStream | null): Promise<void> {
  if (!stream) return

  stream.getTracks().forEach((track) => track.stop())
}
