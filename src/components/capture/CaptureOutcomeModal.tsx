import { useEffect, useState } from 'react'
import * as QRCode from 'qrcode'

import type { CaptureOutcome } from '../../types'

interface CaptureOutcomeModalProps {
  outcome: CaptureOutcome
  onClose: () => void
  onRetryShare?: () => void
}

export function CaptureOutcomeModal({
  outcome,
  onClose,
  onRetryShare,
}: CaptureOutcomeModalProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  useEffect(() => {
    if (outcome.share.status !== 'ready' || !outcome.share.downloadUrl) {
      return
    }

    let cancelled = false

    void QRCode.toDataURL(outcome.share.downloadUrl, {
      margin: 1,
      width: 240,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#0b1724',
        light: '#ffffff',
      },
    })
      .then((dataUrl) => {
        if (!cancelled) {
          setQrCodeUrl(dataUrl)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setQrCodeUrl(null)
        }
      })

    return () => {
      cancelled = true
    }
  }, [outcome.share.downloadUrl, outcome.share.status])

  const isPhoto = outcome.kind === 'photo'
  const hasCloudShare = outcome.share.status !== 'idle'
  const heading = isPhoto ? 'Ảnh đã chụp xong' : 'Boomerang đã sẵn sàng'
  const savedLabel = isPhoto ? 'Ảnh Kết Quả' : 'Boomerang Kết Quả'
  const kindLabel = isPhoto ? 'Ảnh' : 'Boomerang'
  const formatLabel = isPhoto
    ? 'JPG'
    : outcome.mimeType === 'video/mp4'
      ? 'MP4'
      : outcome.mimeType.replace('video/', '').toUpperCase()
  const resolutionLabel = `${outcome.width} × ${outcome.height} px`
  const shareStatusLabel = getShareStatusLabel(outcome.share.status)
  const summaryCopy = getSummaryCopy(outcome.share.status)
  const shareLinkLabel = outcome.share.downloadUrl?.replace(/^https?:\/\//, '')
  const shareExpiryLabel = formatExpiryLabel(outcome.share.expiresAt)
  const activeQrCodeUrl =
    outcome.share.status === 'ready' ? qrCodeUrl : null

  return (
    <div
      className="capture-outcome-backdrop"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="capture-outcome-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="capture-outcome-title"
        aria-describedby="capture-outcome-summary"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="capture-outcome-header">
          <div className="capture-outcome-heading-block">
            <div className="capture-outcome-kicker-row">
              <div className="capture-outcome-kicker">{savedLabel}</div>
              <div className="capture-outcome-status">{shareStatusLabel}</div>
            </div>

            <h2 id="capture-outcome-title" className="capture-outcome-title">
              {heading}
            </h2>
            <p id="capture-outcome-summary" className="capture-outcome-meta-copy">
              {summaryCopy}
            </p>
          </div>

          <button
            type="button"
            className="button secondary capture-outcome-close"
            onClick={onClose}
          >
            Đóng
          </button>
        </div>

        <div className="capture-outcome-body">
          <aside className="capture-outcome-info-rail" aria-label="Thông số outcome">
            <div className="capture-outcome-info-card">
              <p className="capture-outcome-section-label">Thông số</p>

              <dl className="capture-outcome-info-list">
                <div className="capture-outcome-info-row">
                  <dt>Loại media</dt>
                  <dd>{kindLabel}</dd>
                </div>

                <div className="capture-outcome-info-row">
                  <dt>Độ phân giải</dt>
                  <dd>{resolutionLabel}</dd>
                </div>

                <div className="capture-outcome-info-row">
                  <dt>Định dạng</dt>
                  <dd>{formatLabel}</dd>
                </div>

                <div className="capture-outcome-info-row">
                  <dt>Lưu trữ</dt>
                  <dd className="capture-outcome-info-path">{outcome.savedPath}</dd>
                </div>
              </dl>
            </div>

            {hasCloudShare ? (
              <div className="capture-outcome-share-card">
                <p className="capture-outcome-section-label">Share / QR</p>

                {outcome.share.status === 'uploading' ? (
                  <div className="capture-outcome-share-loading">
                    <span
                      className="capture-outcome-share-spinner"
                      aria-hidden="true"
                    />
                    <div className="capture-outcome-share-copy-block">
                      <p className="capture-outcome-share-title">
                        Đang tạo link tải…
                      </p>
                      <p className="capture-outcome-share-copy">
                        Preview local đã sẵn sàng. QR sẽ xuất hiện ngay sau khi file
                        upload xong lên cloud riêng.
                      </p>
                    </div>
                  </div>
                ) : null}

                {outcome.share.status === 'ready' ? (
                  <div className="capture-outcome-share-ready">
                    <div className="capture-outcome-share-qr-shell">
                      {activeQrCodeUrl ? (
                        <img
                          src={activeQrCodeUrl}
                          alt="QR tải media"
                          className="capture-outcome-share-qr"
                        />
                      ) : (
                        <span
                          className="capture-outcome-share-spinner"
                          aria-hidden="true"
                        />
                      )}
                    </div>

                    <div className="capture-outcome-share-copy-block">
                      <p className="capture-outcome-share-title">
                        Quét QR để tải ngay
                      </p>

                      {shareLinkLabel ? (
                        <a
                          className="capture-outcome-share-link"
                          href={outcome.share.downloadUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {shareLinkLabel}
                        </a>
                      ) : null}

                      <span className="capture-outcome-share-expiry-badge">
                        {shareExpiryLabel}
                      </span>
                    </div>
                  </div>
                ) : null}

                {outcome.share.status === 'error' ? (
                  <div className="capture-outcome-share-error-block">
                    <p className="capture-outcome-share-title">
                      Không thể tạo link tải
                    </p>
                    <p className="capture-outcome-share-error">
                      {outcome.share.errorMessage ??
                        'Upload cloud không thành công. Bạn có thể thử lại.'}
                    </p>
                    {onRetryShare ? (
                      <button
                        type="button"
                        className="button secondary capture-outcome-share-retry"
                        onClick={onRetryShare}
                      >
                        Retry upload
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}
          </aside>

          <section className="capture-outcome-preview-panel" aria-label="Preview outcome">
            <div className="capture-outcome-preview-shell">
              <div className="capture-outcome-preview-frame">
                {isPhoto ? (
                  <img
                    src={outcome.previewUrl}
                    alt="Ảnh vừa chụp"
                    className="capture-outcome-image"
                  />
                ) : (
                  <video
                    src={outcome.previewUrl}
                    className="capture-outcome-video"
                    autoPlay
                    loop
                    muted
                    playsInline
                    controls
                  />
                )}
              </div>
            </div>
          </section>
        </div>

        <div className="capture-outcome-footer">
          <span className="capture-outcome-hint">Esc để đóng nhanh</span>

          <button
            type="button"
            className="button primary capture-outcome-primary"
            onClick={onClose}
          >
            Chụp tiếp
          </button>
        </div>
      </div>
    </div>
  )
}

function getShareStatusLabel(status: CaptureOutcome['share']['status']): string {
  switch (status) {
    case 'uploading':
      return 'Đang tạo QR'
    case 'ready':
      return 'QR 24h sẵn sàng'
    case 'error':
      return 'Upload cloud lỗi'
    default:
      return 'Đã lưu local'
  }
}

function getSummaryCopy(status: CaptureOutcome['share']['status']): string {
  switch (status) {
    case 'uploading':
      return 'Preview local đã sẵn sàng. Link tải cloud sẽ hiện ngay khi upload hoàn tất.'
    case 'ready':
      return 'Preview local đã sẵn sàng. Người dùng có thể quét QR để tải media trong vòng 24 giờ.'
    case 'error':
      return 'Preview local vẫn sẵn sàng. Bạn có thể thử tạo lại link tải cloud ngay trong modal này.'
    default:
      return 'Xem nhanh kết quả trước khi chụp lượt tiếp theo.'
  }
}

function formatExpiryLabel(expiresAt?: string): string {
  if (!expiresAt) {
    return 'Hết hạn sau 24h'
  }

  const parsed = new Date(expiresAt)

  if (Number.isNaN(parsed.getTime())) {
    return 'Hết hạn sau 24h'
  }

  return `Hết hạn ${new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
  }).format(parsed)}`
}
