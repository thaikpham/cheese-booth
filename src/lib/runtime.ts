import { isTauri as detectTauriRuntime } from '@tauri-apps/api/core'

export function isTauriRuntime(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  return detectTauriRuntime()
}
