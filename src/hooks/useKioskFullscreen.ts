import { useEffect } from 'react'

import { isTauriRuntime } from '../lib/runtime'

type FullscreenCapableElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void
}

async function requestBrowserFullscreen(): Promise<boolean> {
  if (typeof document === 'undefined') {
    return false
  }

  if (document.fullscreenElement) {
    return true
  }

  const root = document.documentElement as FullscreenCapableElement

  try {
    if (root.requestFullscreen) {
      await root.requestFullscreen()
      return true
    }

    if (root.webkitRequestFullscreen) {
      await root.webkitRequestFullscreen()
      return true
    }
  } catch {
    return false
  }

  return false
}

export function useKioskFullscreen(settingsReady: boolean): void {
  useEffect(() => {
    if (!settingsReady) return

    let disposed = false

    const requestOnce = () => {
      void requestBrowserFullscreen()
      window.removeEventListener('pointerdown', requestOnce)
      window.removeEventListener('keydown', requestOnce)
    }

    async function enterFullscreen(): Promise<void> {
      if (isTauriRuntime()) {
        try {
          const { getCurrentWindow } = await import('@tauri-apps/api/window')
          await getCurrentWindow().setFullscreen(true)
          return
        } catch {
          // Fall back to the web fullscreen API below.
        }
      }

      const entered = await requestBrowserFullscreen()

      if (entered || disposed) {
        return
      }

      window.addEventListener('pointerdown', requestOnce, { once: true })
      window.addEventListener('keydown', requestOnce, { once: true })
    }

    void enterFullscreen()

    return () => {
      disposed = true
      window.removeEventListener('pointerdown', requestOnce)
      window.removeEventListener('keydown', requestOnce)
    }
  }, [settingsReady])
}
