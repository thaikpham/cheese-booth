import { GalleryVerticalEnd } from 'lucide-react'

import type { BrowserCaptureSessionState } from '../../types'

interface BrowserSessionFilmStripRailProps {
  session: BrowserCaptureSessionState
  layout: 'portrait' | 'landscape'
}

export function BrowserSessionFilmStripRail({
  session,
  layout,
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

            <div className="capture-session-card-copy">
              <span className="capture-session-card-sequence">
                #{String(slot.sequence).padStart(2, '0')}
              </span>
              <span className="capture-session-card-kind">
                {slot.item
                  ? slot.item.kind === 'photo'
                    ? '📷 Photo'
                    : '🎞 Boomerang'
                  : '○ Trống'}
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
