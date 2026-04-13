import { useEffect, useState, type CSSProperties } from 'react'
import * as QRCode from 'qrcode'

import type { BrowserQrQueueItem } from '../../types'

interface CaptureQrQueueRailProps {
  items: BrowserQrQueueItem[]
  onRetryItem: (id: string) => void
}

export function CaptureQrQueueRail({
  items,
  onRetryItem,
}: CaptureQrQueueRailProps) {
  return (
    <aside className="capture-qr-queue-rail" aria-label="QR queue">
      <div className="capture-qr-queue-header">
        <p className="capture-qr-queue-title">QR Queue</p>
        <span className="capture-qr-queue-count">{items.length}/100</span>
      </div>

      <div className="capture-qr-queue-scroll">
        {items.length === 0 ? (
          <div className="capture-qr-queue-empty">
            <p className="capture-qr-queue-empty-title">Chưa có QR nào</p>
            <p className="capture-qr-queue-empty-copy">
              Sau khi khách bấm lấy ảnh, QR sẽ xuất hiện tại đây để quét bất cứ lúc
              nào.
            </p>
          </div>
        ) : (
          items.map((item) => (
            <CaptureQrQueueCard
              key={item.id}
              item={item}
              onRetryItem={onRetryItem}
            />
          ))
        )}
      </div>
    </aside>
  )
}

interface CaptureQrQueueCardProps {
  item: BrowserQrQueueItem
  onRetryItem: (id: string) => void
}

function CaptureQrQueueCard({
  item,
  onRetryItem,
}: CaptureQrQueueCardProps) {
  const qrCodeUrl = useQrCodeDataUrl(item.downloadUrl)
  const statusLabel = getStatusLabel(item.status)
  const createdAtLabel = formatQueueTimestamp(item.createdAt)
  const expiryLabel = formatExpiryLabel(item.expiresAt)
  const mediaLabel = item.kind === 'photo' ? 'PHOTO' : 'BOOMERANG'

  return (
    <article
      className="capture-qr-queue-card"
      data-status={item.status}
      style={{ '--queue-accent-color': item.accentColor } as CSSProperties}
    >
      <div className="capture-qr-queue-card-meta">
        <span className="capture-qr-queue-card-status">{statusLabel}</span>
        <span className="capture-qr-queue-card-time">{createdAtLabel}</span>
      </div>

      <div className="capture-qr-queue-card-qr-shell">
        {item.status === 'ready' && qrCodeUrl ? (
          <img
            src={qrCodeUrl}
            alt={`QR ${mediaLabel}`}
            className="capture-qr-queue-card-qr"
          />
        ) : item.status === 'ready' ? (
          <span className="capture-qr-queue-spinner" aria-hidden="true" />
        ) : (
          <div className="capture-qr-queue-placeholder" aria-hidden="true">
            <span className="capture-qr-queue-placeholder-grid" />
            <span className="capture-qr-queue-placeholder-grid" />
            <span className="capture-qr-queue-placeholder-grid" />
            <span className="capture-qr-queue-placeholder-grid" />
            {item.status === 'generating' ? (
              <span className="capture-qr-queue-spinner" />
            ) : null}
          </div>
        )}
      </div>

      <div className="capture-qr-queue-card-copy">
        <p className="capture-qr-queue-card-kind">{mediaLabel}</p>

        {item.status === 'generating' ? (
          <p className="capture-qr-queue-card-description">
            Đang upload lên cloud và tạo QR tải về.
          </p>
        ) : null}

        {item.status === 'ready' ? (
          <p className="capture-qr-queue-card-description">{expiryLabel}</p>
        ) : null}

        {item.status === 'error' ? (
          <>
            <p className="capture-qr-queue-card-error">
              {item.errorMessage ?? 'Không thể tạo QR lúc này.'}
            </p>
            <button
              type="button"
              className="button secondary capture-qr-queue-retry"
              onClick={() => onRetryItem(item.id)}
            >
              Thử lại
            </button>
          </>
        ) : null}
      </div>
    </article>
  )
}

function useQrCodeDataUrl(downloadUrl?: string): string | null {
  const [qrCodeState, setQrCodeState] = useState<{
    source: string | null
    dataUrl: string | null
  }>({
    source: null,
    dataUrl: null,
  })

  useEffect(() => {
    if (!downloadUrl) {
      return
    }

    let cancelled = false

    void QRCode.toDataURL(downloadUrl, {
      margin: 1,
      width: 208,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#041018',
        light: '#ffffff',
      },
    })
      .then((dataUrl) => {
        if (!cancelled) {
          setQrCodeState({
            source: downloadUrl,
            dataUrl,
          })
        }
      })
      .catch(() => {
        if (!cancelled) {
          setQrCodeState({
            source: downloadUrl,
            dataUrl: null,
          })
        }
      })

    return () => {
      cancelled = true
    }
  }, [downloadUrl])

  if (!downloadUrl || qrCodeState.source !== downloadUrl) {
    return null
  }

  return qrCodeState.dataUrl
}

function getStatusLabel(status: BrowserQrQueueItem['status']): string {
  switch (status) {
    case 'generating':
      return 'GENERATING'
    case 'ready':
      return 'READY'
    case 'error':
      return 'ERROR'
    default:
      return 'QUEUE'
  }
}

function formatQueueTimestamp(createdAt: number): string {
  const createdDate = new Date(createdAt)

  if (Number.isNaN(createdDate.getTime())) {
    return '--:--:--'
  }

  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    day: '2-digit',
    month: '2-digit',
  }).format(createdDate)
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
