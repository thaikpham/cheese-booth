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

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

async function enforceDesktopFullscreen(): Promise<boolean> {
  try {
    const { getCurrentWindow } = await import('@tauri-apps/api/window')
    const currentWindow = getCurrentWindow()

    for (let attempt = 0; attempt < 4; attempt += 1) {
      await currentWindow.show()
      await currentWindow.setDecorations(false)
      await currentWindow.setResizable(false)
      await currentWindow.maximize()
      await currentWindow.setFullscreen(true)
      await currentWindow.setFocus()

      const [isFullscreen, isMaximized] = await Promise.all([
        currentWindow.isFullscreen(),
        currentWindow.isMaximized(),
      ])

      if (isFullscreen || isMaximized) {
        return true
      }

      await wait(180 * (attempt + 1))
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
        const enteredDesktopFullscreen = await enforceDesktopFullscreen()

        if (enteredDesktopFullscreen) {
          return
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
