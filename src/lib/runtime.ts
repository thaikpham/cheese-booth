import { isTauri as detectTauriRuntime } from '@tauri-apps/api/core'
export const BROWSER_CLOUD_SHARE_LABEL = 'Cloud QR 24h'

export interface RuntimeEnvironment {
  kind: 'desktop' | 'browser'
  label: string
  telemetryLabel: 'DESKTOP' | 'BROWSER'
  storageTargetLabel: string
  storageReady: boolean
  storageSummary: string
  supportsOutputDirectorySelection: boolean
  tone: 'good' | 'neutral'
}

export function isTauriRuntime(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  return detectTauriRuntime()
}

export function getRuntimeEnvironment(
  outputDir?: string | null,
): RuntimeEnvironment {
  const desktopRuntime = isTauriRuntime()

  if (!desktopRuntime) {
    return {
      kind: 'browser',
      label: 'Browser + Cloud Share',
      telemetryLabel: 'BROWSER',
      storageTargetLabel: BROWSER_CLOUD_SHARE_LABEL,
      storageReady: true,
      storageSummary: 'Upload riêng tư + QR 24h',
      supportsOutputDirectorySelection: false,
      tone: 'good',
    }
  }

  return {
    kind: 'desktop',
    label: 'Desktop Tauri',
    telemetryLabel: 'DESKTOP',
    storageTargetLabel: outputDir || 'Chưa cấu hình',
    storageReady: Boolean(outputDir),
    storageSummary: outputDir ? 'Đã sẵn sàng' : 'Chờ chọn thư mục local',
    supportsOutputDirectorySelection: true,
    tone: outputDir ? 'good' : 'neutral',
  }
}
