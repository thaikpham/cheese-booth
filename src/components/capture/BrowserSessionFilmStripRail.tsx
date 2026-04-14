import type { BrowserCaptureSessionState } from '../../types'

interface BrowserSessionFilmStripRailProps {
  session: BrowserCaptureSessionState
}

export function BrowserSessionFilmStripRail({
  session,
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
    <aside className="capture-film-strip-rail" aria-label="Session film strip">
      <div className="capture-film-strip-header">
        <p className="capture-film-strip-title">Session Strip</p>
        <span className="capture-film-strip-count">
          {session.items.length}/{session.maxItems}
        </span>
      </div>

      <div className="capture-film-strip-scroll">
        {slots.map((slot) => (
          <article
            key={slot.sequence}
            className="capture-film-strip-card"
            data-filled={slot.item ? 'true' : 'false'}
            data-newest={slot.isNewest ? 'true' : 'false'}
          >
            <div className="capture-film-strip-media">
              {slot.item ? (
                <img
                  src={slot.item.posterUrl}
                  alt={`Session item ${slot.sequence}`}
                  className="capture-film-strip-image"
                />
              ) : (
                <div className="capture-film-strip-placeholder">
                  <span>Slot {String(slot.sequence).padStart(2, '0')}</span>
                </div>
              )}
            </div>

            <div className="capture-film-strip-copy">
              <span className="capture-film-strip-sequence">
                #{String(slot.sequence).padStart(2, '0')}
              </span>
              <span className="capture-film-strip-kind">
                {slot.item
                  ? slot.item.kind === 'photo'
                    ? 'PHOTO'
                    : 'BOOMERANG'
                  : 'TRỐNG'}
              </span>
            </div>
          </article>
        ))}
      </div>
    </aside>
  )
}

