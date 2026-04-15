import { Play, QrCode, RefreshCw, Settings2, X } from 'lucide-react'

import type { BrowserCaptureSessionState } from '../../types'

interface CaptureSideRailProps {
  layout: 'portrait' | 'landscape'
  captureModeLabel: string
  browserSession: BrowserCaptureSessionState
  shutterDisabled: boolean
  onOpenSettings: () => void
  onShutter: () => void
  onStartBrowserSession: () => void
  onFinalizeBrowserSession: () => void
  onCancelBrowserSession: () => void
  onResetBrowserSession: () => void
}

export function CaptureSideRail({
  layout,
  captureModeLabel,
  browserSession,
  shutterDisabled,
  onOpenSettings,
  onShutter,
  onStartBrowserSession,
  onFinalizeBrowserSession,
  onCancelBrowserSession,
  onResetBrowserSession,
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
      <div
        className="capture-session-summary"
        data-state={browserSession.status}
      >
        <div className="capture-session-summary-head">
          <div className="capture-session-summary-copy">
            <p className="capture-session-summary-kicker">🎞 Session</p>
            <p className="capture-session-summary-title">
              {getSessionTitle(browserSession)}
            </p>
          </div>
          <span
            className="capture-session-status-pill"
            data-state={browserSession.status}
          >
            {getSessionStatusLabel(browserSession.status)}
          </span>
        </div>
        <p className="capture-session-summary-note">
          {getSessionStatusCopy(browserSession)}
        </p>

        <div className="capture-session-action-row">
          {browserSession.status === 'idle' ? (
            <button
              type="button"
              className="button primary capture-session-action"
              onClick={onStartBrowserSession}
              aria-label="Bắt đầu session"
            >
              <Play size={16} />
              Bắt đầu
            </button>
          ) : null}

          {browserSession.status === 'active' ? (
            <>
              <button
                type="button"
                className="button primary capture-session-action"
                onClick={onFinalizeBrowserSession}
                disabled={browserSession.items.length === 0}
                aria-label="Kết thúc session và tạo QR"
              >
                <QrCode size={16} />
                Tạo QR
              </button>
              <button
                type="button"
                className="button secondary capture-session-action"
                onClick={onCancelBrowserSession}
                aria-label="Hủy session hiện tại"
              >
                <X size={16} />
                Hủy
              </button>
            </>
          ) : null}

          {browserSession.status === 'ready' || browserSession.status === 'error' ? (
            <button
              type="button"
              className="button primary capture-session-action"
              onClick={onResetBrowserSession}
              aria-label="Bắt đầu session mới"
            >
              <RefreshCw size={16} />
              Session mới
            </button>
          ) : null}
        </div>
      </div>

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

function getSessionStatusCopy(session: BrowserCaptureSessionState): string {
  const remainingSlots = Math.max(session.maxItems - session.items.length, 0)

  switch (session.status) {
    case 'ready':
      return 'Khách quét 1 mã để mở toàn bộ gallery.'
    case 'error':
      return 'Tạo QR chưa xong. Có thể thử lại ngay.'
    case 'finalizing':
      return `Đang đẩy ${session.items.length} media lên gallery.`
    case 'reviewing-shot':
      return 'Duyệt shot mới trước khi thêm vào session.'
    default:
      return remainingSlots === 0
        ? 'Đã đủ 4 slot, có thể tạo QR.'
        : `Còn ${remainingSlots} slot để tiếp tục.`
  }
}

function getSessionTitle(session: BrowserCaptureSessionState): string {
  switch (session.status) {
    case 'idle':
      return 'Mở session để bắt đầu'
    case 'active':
      return 'Chụp thêm hoặc tạo QR'
    case 'reviewing-shot':
      return 'Duyệt shot vừa chụp'
    case 'finalizing':
      return 'Đang chuẩn bị gallery'
    case 'ready':
      return 'QR đã sẵn sàng'
    case 'error':
      return 'Cần thử lại phiên này'
    default:
      return 'Session'
  }
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
