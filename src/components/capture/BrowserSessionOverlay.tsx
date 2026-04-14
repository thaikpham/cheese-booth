import { LoaderCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import * as QRCode from 'qrcode'

import type { BrowserCaptureSessionState, CaptureOutcome } from '../../types'

interface BrowserSessionOverlayProps {
  session: BrowserCaptureSessionState
  outcome: CaptureOutcome | null
  onApproveOutcome: () => void
  onRejectOutcome: () => void
  onRetrySessionShare: () => void
  onResetBrowserSession: () => void
}

export function BrowserSessionOverlay({
  session,
  outcome,
  onApproveOutcome,
  onRejectOutcome,
  onRetrySessionShare,
  onResetBrowserSession,
}: BrowserSessionOverlayProps) {
  const [qrCodeState, setQrCodeState] = useState<{
    source: string | null
    dataUrl: string | null
  }>({
    source: null,
    dataUrl: null,
  })
  const galleryUrl =
    session.share.status === 'ready' ? session.share.galleryUrl ?? null : null

  useEffect(() => {
    if (!galleryUrl) {
      return
    }

    let cancelled = false

    void QRCode.toDataURL(galleryUrl, {
      margin: 1,
      width: 280,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#051018',
        light: '#ffffff',
      },
    })
      .then((dataUrl) => {
        if (!cancelled) {
          setQrCodeState({
            source: galleryUrl,
            dataUrl,
          })
        }
      })
      .catch(() => {
        if (!cancelled) {
          setQrCodeState({
            source: galleryUrl,
            dataUrl: null,
          })
        }
      })

    return () => {
      cancelled = true
    }
  }, [galleryUrl])

  const qrCodeUrl =
    galleryUrl && qrCodeState.source === galleryUrl ? qrCodeState.dataUrl : null

  if (session.status === 'reviewing-shot' && outcome) {
    const isPhoto = outcome.kind === 'photo'

    return (
      <div className="browser-capture-outcome-backdrop">
        <section
          className="browser-capture-outcome-shell"
          data-state="review"
          role="dialog"
          aria-modal="true"
        >
          <div className="browser-capture-outcome-copy">
            <h2 className="browser-capture-outcome-title">Xem lại shot vừa chụp</h2>
            <p className="browser-capture-outcome-description">
              Nếu ổn, thêm shot này vào session hiện tại. Bạn còn{' '}
              {Math.max(0, session.maxItems - session.items.length - 1)} slot sau shot này.
            </p>
          </div>

          <div className="browser-capture-outcome-stage">
            <div className="browser-capture-outcome-preview-panel">
              <div className="browser-capture-outcome-preview-shell">
                <div
                  className="browser-capture-outcome-preview-frame"
                  style={{
                    aspectRatio:
                      outcome.width > 0 && outcome.height > 0
                        ? `${outcome.width} / ${outcome.height}`
                        : isPhoto
                          ? '4 / 3'
                          : '3 / 4',
                  }}
                >
                  {isPhoto ? (
                    <img
                      src={outcome.previewUrl}
                      alt="Preview shot vừa chụp"
                      className="browser-capture-outcome-image"
                    />
                  ) : (
                    <video
                      src={outcome.previewUrl}
                      className="browser-capture-outcome-video"
                      autoPlay
                      loop
                      muted
                      playsInline
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="browser-capture-outcome-actions">
              <button
                type="button"
                className="button secondary browser-capture-outcome-action"
                onClick={onRejectOutcome}
              >
                Chụp lại
              </button>
              <button
                type="button"
                className="button primary browser-capture-outcome-action browser-capture-outcome-action-primary"
                onClick={onApproveOutcome}
              >
                Thêm vào session
              </button>
            </div>
          </div>
        </section>
      </div>
    )
  }

  if (session.status === 'finalizing') {
    return (
      <div className="browser-capture-outcome-backdrop">
        <section className="browser-capture-outcome-shell" data-state="uploading">
          <div className="browser-capture-outcome-copy">
            <h2 className="browser-capture-outcome-title">Đang tạo QR duy nhất</h2>
            <p className="browser-capture-outcome-description">
              Upload {session.items.length} media lên cloud và chuẩn bị gallery cho khách…
            </p>
          </div>

          <div className="browser-capture-outcome-stage browser-capture-outcome-stage--status">
            <div className="browser-capture-outcome-status-card">
              <LoaderCircle className="browser-capture-outcome-spinner" size={28} />
              <p className="browser-capture-outcome-status-copy">
                Kiosk sẽ giữ nguyên session hiện tại cho đến khi QR sẵn sàng.
              </p>
            </div>
          </div>
        </section>
      </div>
    )
  }

  if (session.status === 'ready' && session.share.galleryUrl) {
    const galleryLabel = session.share.galleryUrl.replace(/^https?:\/\//, '')

    return (
      <div className="browser-capture-outcome-backdrop">
        <section className="browser-capture-outcome-shell" data-state="ready">
          <div className="browser-capture-outcome-copy">
            <h2 className="browser-capture-outcome-title">QR session đã sẵn sàng</h2>
            <p className="browser-capture-outcome-description">
              Khách chỉ cần quét một mã để mở gallery của toàn bộ session này.
            </p>
          </div>

          <div className="browser-capture-outcome-stage browser-capture-outcome-stage--ready">
            <div className="browser-capture-outcome-share-card">
              <div className="browser-capture-outcome-qr-shell">
                {qrCodeUrl ? (
                  <img
                    src={qrCodeUrl}
                    alt="QR tải gallery session"
                    className="browser-capture-outcome-qr"
                  />
                ) : (
                  <LoaderCircle className="browser-capture-outcome-spinner" size={28} />
                )}
              </div>

              <div className="browser-capture-outcome-share-copy">
                <p className="browser-capture-outcome-share-title">
                  1 QR cho {session.items.length} media
                </p>
                <a
                  className="browser-capture-outcome-share-link"
                  href={session.share.galleryUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  {galleryLabel}
                </a>
                <span className="browser-capture-outcome-share-expiry">
                  Hết hạn {formatDateTime(session.share.expiresAt)}
                </span>
              </div>
            </div>

            <div className="browser-capture-outcome-actions">
              <button
                type="button"
                className="button primary browser-capture-outcome-action browser-capture-outcome-action-primary"
                onClick={onResetBrowserSession}
              >
                Session mới
              </button>
            </div>
          </div>
        </section>
      </div>
    )
  }

  if (session.status === 'error') {
    return (
      <div className="browser-capture-outcome-backdrop">
        <section className="browser-capture-outcome-shell" data-state="error">
          <div className="browser-capture-outcome-copy">
            <h2 className="browser-capture-outcome-title">Chưa tạo được QR session</h2>
            <p className="browser-capture-outcome-description">
              {session.share.errorMessage ??
                'Có lỗi khi upload hoặc tạo gallery cho session này.'}
            </p>
          </div>

          <div className="browser-capture-outcome-actions">
            <button
              type="button"
              className="button secondary browser-capture-outcome-action"
              onClick={onRetrySessionShare}
            >
              Thử lại upload
            </button>
            <button
              type="button"
              className="button primary browser-capture-outcome-action browser-capture-outcome-action-primary"
              onClick={onResetBrowserSession}
            >
              Session mới
            </button>
          </div>
        </section>
      </div>
    )
  }

  return null
}

function formatDateTime(value?: string): string {
  if (!value) {
    return 'sau 24h'
  }

  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return 'sau 24h'
  }

  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
  }).format(parsed)
}
