import { Blend, Settings } from 'lucide-react'

import type { BrowserCaptureSessionState } from '../../types'

interface CaptureSideRailProps {
  captureModeLabel: string
  runtimeKind: 'desktop' | 'browser'
  browserSession?: BrowserCaptureSessionState
  shutterDisabled: boolean
  onOpenSettings: () => void
  onShutter: () => void
  onStartBrowserSession?: () => void
  onFinalizeBrowserSession?: () => void
  onCancelBrowserSession?: () => void
  onResetBrowserSession?: () => void
}

export function CaptureSideRail({
  captureModeLabel,
  runtimeKind,
  browserSession,
  shutterDisabled,
  onOpenSettings,
  onShutter,
  onStartBrowserSession,
  onFinalizeBrowserSession,
  onCancelBrowserSession,
  onResetBrowserSession,
}: CaptureSideRailProps) {
  return (
    <aside className="capture-side-rail" aria-label="Capture controls">
      <button
        className="capture-settings-button"
        type="button"
        onClick={onOpenSettings}
        aria-label="Mở cài đặt"
      >
        <Settings size={28} />
      </button>

      {runtimeKind === 'browser' && browserSession ? (
        <div className="capture-session-dock">
          <div className="capture-session-status-card">
            <p className="capture-session-status-title">Session</p>
            <p className="capture-session-status-copy">
              {browserSession.items.length}/{browserSession.maxItems} media
            </p>
            <span
              className="capture-session-status-pill"
              data-state={browserSession.status}
            >
              {getSessionStatusLabel(browserSession.status)}
            </span>
          </div>

          <div className="capture-session-actions">
            {browserSession.status === 'idle' ? (
              <button
                type="button"
                className="button primary capture-session-action"
                onClick={onStartBrowserSession}
              >
                Bắt đầu session
              </button>
            ) : null}

            {browserSession.status === 'active' ? (
              <>
                <button
                  type="button"
                  className="button primary capture-session-action"
                  onClick={onFinalizeBrowserSession}
                  disabled={browserSession.items.length === 0}
                >
                  Kết thúc session
                </button>
                <button
                  type="button"
                  className="button secondary capture-session-action"
                  onClick={onCancelBrowserSession}
                >
                  Hủy session
                </button>
              </>
            ) : null}

            {browserSession.status === 'ready' || browserSession.status === 'error' ? (
              <button
                type="button"
                className="button primary capture-session-action"
                onClick={onResetBrowserSession}
              >
                Session mới
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="shutter-dock camera-shutter-dock">
        <button
          className="shutter-button"
          onClick={onShutter}
          disabled={shutterDisabled}
          aria-label={`Chụp ${captureModeLabel}`}
        >
          <span className="shutter-ring" />
          <span className="shutter-core" />
        </button>
      </div>

      <div className="capture-blend-slot">
        <button
          className="capture-blend-button"
          type="button"
          aria-label="Blending modes"
          disabled
        >
          <Blend size={28} />
        </button>
        <p className="capture-blend-tooltip" aria-hidden="true">
          blending for cheese booth coming soon
        </p>
      </div>
    </aside>
  )
}

function getSessionStatusLabel(
  status: BrowserCaptureSessionState['status'],
): string {
  switch (status) {
    case 'idle':
      return 'CHỜ START'
    case 'active':
      return 'ĐANG CHỤP'
    case 'reviewing-shot':
      return 'XEM LẠI'
    case 'finalizing':
      return 'ĐANG TẠO QR'
    case 'ready':
      return 'READY'
    case 'error':
      return 'LỖI'
    default:
      return 'SESSION'
  }
}
