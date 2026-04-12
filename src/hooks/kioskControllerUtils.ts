import type {
  OperatorSettings,
  SourceDescriptor,
  TransformSettings,
} from '../types'

export function getMediaErrorMessage(error: unknown): string {
  if (error instanceof Error && error.name === 'NotAllowedError') {
    return 'Bạn đã từ chối quyền truy cập camera.'
  }

  if (error instanceof Error && error.name === 'NotFoundError') {
    return 'Không tìm thấy nguồn camera phù hợp.'
  }

  if (error instanceof Error && error.name === 'NotReadableError') {
    return 'Nguồn camera đang bị ứng dụng khác chiếm dụng.'
  }

  if (error instanceof Error && error.message) {
    return error.message
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
