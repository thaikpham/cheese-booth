import { Settings2 } from 'lucide-react'

import type { BrowserCaptureSessionState } from '../../types'

interface CaptureSideRailProps {
  layout: 'portrait' | 'landscape'
  captureModeLabel: string
  browserSession: BrowserCaptureSessionState
  shutterDisabled: boolean
  onOpenSettings: () => void
  onShutter: () => void
}

export function CaptureSideRail({
  layout,
  captureModeLabel,
  browserSession,
  shutterDisabled,
  onOpenSettings,
  onShutter,
}: CaptureSideRailProps) {
  const sessionCountLabel = `${browserSession.items.length}/${browserSession.maxItems}`
  const dockBadge = getDockBadge(browserSession)

  return (
    <aside
      className={[
        'capture-control-dock',
        `capture-control-dock--${layout}`,
      ].join(' ')}
      aria-label="Capture controls"
    >
      <div className="capture-bottom-controls">
        <button
          className="capture-dock-button"
          type="button"
          onClick={onOpenSettings}
          aria-label="Mở cài đặt"
        >
          <Settings2 size={24} />
          <span className="capture-dock-button-label">Cài đặt</span>
        </button>

        <div className="capture-shutter-stack">
          <button
            className="capture-shutter-button"
            onClick={onShutter}
            disabled={shutterDisabled}
            aria-label={`Chụp ${captureModeLabel}`}
          >
            <span className="capture-shutter-ring" />
            <span className="capture-shutter-core" />
          </button>
          <p className="capture-shutter-label">
            {captureModeLabel === 'Photo' ? '📸 Photo' : '🎞 Boomerang'}
          </p>
        </div>

        <div
          className="capture-dock-status"
          data-state={browserSession.status}
          aria-label={`Session ${sessionCountLabel}`}
        >
          <span className="capture-dock-status-count">{sessionCountLabel}</span>
          <span className="capture-dock-status-label">
            {dockBadge.emoji} {dockBadge.label}
          </span>
        </div>
      </div>
    </aside>
  )
}

function getDockBadge(
  session: BrowserCaptureSessionState,
): {
  emoji: string
  label: string
} {
  switch (session.status) {
    case 'idle':
      return { emoji: '🟡', label: 'Start' }
    case 'active':
      return { emoji: '🟢', label: 'Live' }
    case 'reviewing-shot':
      return { emoji: '✨', label: 'Review' }
    case 'finalizing':
      return { emoji: '☁️', label: 'Upload' }
    case 'ready':
      return { emoji: '📲', label: 'QR Ready' }
    case 'error':
      return { emoji: '⚠️', label: 'Retry' }
    default:
      return { emoji: '🎯', label: 'Session' }
  }
}
