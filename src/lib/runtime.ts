import { isTauri as detectTauriRuntime } from '@tauri-apps/api/core'

export const BROWSER_DOWNLOADS_LABEL = 'Browser Downloads'
export const BROWSER_CLOUD_SHARE_LABEL = 'Cloud QR 24h'

export interface RuntimeEnvironment {
  kind: 'desktop' | 'browser'
  label: string
  telemetryLabel: 'DESKTOP' | 'BROWSER'
  outputTargetLabel: string
  autoSaveReady: boolean
  autoSaveSummary: string
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
      outputTargetLabel: BROWSER_CLOUD_SHARE_LABEL,
      autoSaveReady: true,
      autoSaveSummary: 'Upload riêng tư + QR 24h',
      supportsOutputDirectorySelection: false,
      tone: 'good',
    }
  }

  return {
    kind: 'desktop',
    label: 'Desktop Tauri',
    telemetryLabel: 'DESKTOP',
    outputTargetLabel: outputDir || 'Chưa cấu hình',
    autoSaveReady: Boolean(outputDir),
    autoSaveSummary: outputDir ? 'Đã sẵn sàng' : 'Chờ chọn thư mục local',
    supportsOutputDirectorySelection: true,
    tone: outputDir ? 'good' : 'neutral',
  }
}
