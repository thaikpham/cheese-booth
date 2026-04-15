import { Play, QrCode, RefreshCw, X, GalleryVerticalEnd } from 'lucide-react'

import type { BrowserCaptureSessionState } from '../../types'

interface BrowserSessionFilmStripRailProps {
  session: BrowserCaptureSessionState
  layout: 'portrait' | 'landscape'
  onStartBrowserSession?: () => void
  onFinalizeBrowserSession?: () => void
  onCancelBrowserSession?: () => void
  onResetBrowserSession?: () => void
}

export function BrowserSessionFilmStripRail({
  session,
  layout,
  onStartBrowserSession,
  onFinalizeBrowserSession,
  onCancelBrowserSession,
  onResetBrowserSession,
}: BrowserSessionFilmStripRailProps) {
  const slots = Array.from({ length: session.maxItems }, (_, index) => {
    const sequence = index + 1
    const item = session.items.find((currentItem) => currentItem.sequence === sequence)

    return {
      sequence,
      item,
      isNewest: item ? item.sequence === session.items.length : false,
    }
  })

  return (
    <section
      className={[
        'capture-session-tray',
        `capture-session-tray--${layout}`,
      ].join(' ')}
      data-orientation={layout}
      aria-label="Session tray"
    >
      <div className="capture-session-tray-header">
        <div className="capture-session-tray-heading">
          <GalleryVerticalEnd size={18} />
          <p className="capture-session-tray-title">Session Tray</p>
        </div>
        <span className="capture-session-tray-count">
          {session.items.length}/{session.maxItems}
        </span>
      </div>

      <div className="capture-session-tray-list">
        {slots.map((slot) => (
          <article
            key={slot.sequence}
            className="capture-session-card"
            data-filled={slot.item ? 'true' : 'false'}
            data-newest={slot.isNewest ? 'true' : 'false'}
          >
            <div className="capture-session-card-media">
              {slot.item ? (
                <img
                  src={slot.item.posterUrl}
                  alt={`Session item ${slot.sequence}`}
                  className="capture-session-card-image"
                />
              ) : (
                <div className="capture-session-card-placeholder">
                  <span>Slot {String(slot.sequence).padStart(2, '0')}</span>
                </div>
              )}
            </div>
          </article>
        ))}
      </div>

      <div className="capture-session-tray-controls">
        {session.status === 'idle' && onStartBrowserSession ? (
          <button
            type="button"
            className="button primary capture-session-tray-button"
            onClick={onStartBrowserSession}
            aria-label="Bắt đầu session"
          >
            <Play size={16} />
            Bắt đầu
          </button>
        ) : null}

        {session.status === 'active' ? (
          <>
            {onFinalizeBrowserSession && (
              <button
                type="button"
                className="button primary capture-session-tray-button"
                onClick={onFinalizeBrowserSession}
                disabled={session.items.length === 0}
                aria-label="Kết thúc session và tạo QR"
              >
                <QrCode size={16} />
                Tạo QR
              </button>
            )}
            {onCancelBrowserSession && (
              <button
                type="button"
                className="button secondary capture-session-tray-button"
                onClick={onCancelBrowserSession}
                aria-label="Hủy session hiện tại"
              >
                <X size={16} />
                Hủy
              </button>
            )}
          </>
        ) : null}

        {(session.status === 'ready' || session.status === 'error') && onResetBrowserSession ? (
          <button
            type="button"
            className="button primary capture-session-tray-button"
            onClick={onResetBrowserSession}
            aria-label="Bắt đầu session mới"
          >
            <RefreshCw size={16} />
            Session mới
          </button>
        ) : null}
      </div>
    </section>
  )
}
