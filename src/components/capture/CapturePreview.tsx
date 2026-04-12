import { RefreshCw } from 'lucide-react'
import type { RefObject } from 'react'

import cheeseIcon from '../../../cheese_icon_transparent.svg'
import type { PermissionState, StreamState } from '../../types'

interface CapturePreviewProps {
  previewAspect: string
  previewFrameRef: RefObject<HTMLDivElement | null>
  previewCanvasRef: RefObject<HTMLCanvasElement | null>
  permissionState: PermissionState
  streamState: StreamState
  sourceUnavailable: boolean
  lastError: string | null
  countdownValue: number | null
  onRetryPermission: () => void
  onRefreshSources: () => void
}

export function CapturePreview({
  previewAspect,
  previewFrameRef,
  previewCanvasRef,
  permissionState,
  streamState,
  sourceUnavailable,
  lastError,
  countdownValue,
  onRetryPermission,
  onRefreshSources,
}: CapturePreviewProps) {
  return (
    <div
      ref={previewFrameRef}
      className="preview-frame capture-preview-frame"
      style={{ aspectRatio: previewAspect }}
    >
      <canvas
        ref={previewCanvasRef}
        className="preview-canvas"
        aria-label="Live preview"
      />

      {streamState === 'error' && permissionState === 'granted' ? (
        <div className="preview-overlay">
          <p className="preview-title">Camera chưa sẵn sàng</p>
          <p className="preview-copy">
            {lastError ?? 'Không thể khởi động camera. Hãy thử làm mới lại source.'}
          </p>
          <button
            className="button secondary capture-overlay-button"
            onClick={onRefreshSources}
          >
            <RefreshCw size={18} />
            Làm mới sources
          </button>
        </div>
      ) : null}

      {permissionState !== 'granted' && streamState !== 'error' ? (
        <div className="preview-overlay">
          <p className="preview-title">Cần quyền truy cập camera</p>
          <p className="preview-copy">
            {lastError ??
              'Hãy cho phép camera để liệt kê nguồn Sony USB Streaming hoặc Imaging Edge Webcam.'}
          </p>
          <button
            className="button secondary capture-overlay-button"
            onClick={onRetryPermission}
          >
            Thử lại
          </button>
        </div>
      ) : null}

      {permissionState === 'granted' && sourceUnavailable ? (
        <div className="preview-overlay">
          <p className="preview-title">Chưa có nguồn camera khả dụng</p>
          <p className="preview-copy">
            {lastError ?? 'Kiểm tra lại kết nối USB, sau đó làm mới danh sách nguồn.'}
          </p>
          <button
            className="button secondary capture-overlay-button"
            onClick={onRefreshSources}
          >
            <RefreshCw size={18} />
            Làm mới sources
          </button>
        </div>
      ) : null}

      {countdownValue !== null ? (
        <div
          className={`countdown-overlay ${
            countdownValue === 0 ? 'countdown-overlay-cheese' : ''
          }`}
        >
          {countdownValue === 0 ? (
            <>
              <img
                key="cheese"
                src={cheeseIcon}
                alt="Cheese"
                className="countdown-cheese"
              />
              <span className="countdown-flash" aria-hidden="true" />
            </>
          ) : (
            <span key={countdownValue} className="countdown-number">
              {countdownValue}
            </span>
          )}
        </div>
      ) : null}
    </div>
  )
}
