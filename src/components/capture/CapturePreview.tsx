import { RefreshCw } from 'lucide-react'
import type { RefObject } from 'react'

import cheeseIcon from '../../../cheese_icon_transparent.svg'
import type {
  BoomerangRecordingIndicator,
  PermissionState,
  StreamState,
} from '../../types'

interface CapturePreviewProps {
  previewAspect: string
  previewFrameRef: RefObject<HTMLDivElement | null>
  previewCanvasRef: RefObject<HTMLCanvasElement | null>
  permissionState: PermissionState
  streamState: StreamState
  sourceUnavailable: boolean
  lastError: string | null
  countdownValue: number | null
  boomerangRecording?: BoomerangRecordingIndicator | null
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
  boomerangRecording,
  onRetryPermission,
  onRefreshSources,
}: CapturePreviewProps) {
  const elapsedSeconds = boomerangRecording
    ? formatSeconds(boomerangRecording.elapsedMs)
    : null
  const remainingSeconds = boomerangRecording
    ? formatSeconds(boomerangRecording.remainingMs)
    : null

  return (
    <div
      ref={previewFrameRef}
      className="preview-frame capture-stage-frame"
      style={{ aspectRatio: previewAspect }}
    >
      <canvas
        ref={previewCanvasRef}
        className="preview-canvas capture-stage-canvas"
        aria-label="Live preview"
      />

      {boomerangRecording ? (
        <div className="capture-stage-recording">
          <div className="capture-stage-recording-head">
            <span className="capture-stage-recording-dot" aria-hidden="true" />
            <span>🎞 Đang quay</span>
          </div>
          <div className="capture-stage-recording-meta">
            <span>{elapsedSeconds}s / {formatSeconds(boomerangRecording.totalMs)}s</span>
            <span>Còn {remainingSeconds}s</span>
          </div>
          <div
            className="capture-stage-recording-bar"
            aria-hidden="true"
          >
            <span
              style={{ transform: `scaleX(${boomerangRecording.progress})` }}
            />
          </div>
        </div>
      ) : null}

      {streamState === 'error' && permissionState === 'granted' ? (
        <div className="capture-stage-overlay">
          <p className="capture-stage-overlay-title">⚠️ Camera chưa sẵn sàng</p>
          <p className="capture-stage-overlay-copy">
            {lastError ?? 'Làm mới nguồn camera để quay lại live preview.'}
          </p>
          <button
            className="button secondary capture-stage-overlay-button"
            onClick={onRefreshSources}
          >
            <RefreshCw size={18} />
            Làm mới nguồn
          </button>
        </div>
      ) : null}

      {permissionState !== 'granted' && streamState !== 'error' ? (
        <div className="capture-stage-overlay">
          <p className="capture-stage-overlay-title">🔒 Bật quyền camera</p>
          <p className="capture-stage-overlay-copy">
            {lastError ??
              'Cho phép camera để vào live preview.'}
          </p>
          <button
            className="button secondary capture-stage-overlay-button"
            onClick={onRetryPermission}
          >
            Thử lại
          </button>
        </div>
      ) : null}

      {permissionState === 'granted' && sourceUnavailable ? (
        <div className="capture-stage-overlay">
          <p className="capture-stage-overlay-title">📡 Chưa thấy camera</p>
          <p className="capture-stage-overlay-copy">
            {lastError ?? 'Kiểm tra USB rồi làm mới nguồn.'}
          </p>
          <button
            className="button secondary capture-stage-overlay-button"
            onClick={onRefreshSources}
          >
            <RefreshCw size={18} />
            Làm mới nguồn
          </button>
        </div>
      ) : null}

      {countdownValue !== null ? (
        <div
          className={`capture-stage-countdown ${
            countdownValue === 0 ? 'capture-stage-countdown--flash' : ''
          }`}
        >
          {countdownValue === 0 ? (
            <>
              <img
                key="cheese"
                src={cheeseIcon}
                alt="Cheese"
                className="capture-stage-countdown-cheese"
              />
              <span className="capture-stage-countdown-flash" aria-hidden="true" />
            </>
          ) : (
            <span key={countdownValue} className="capture-stage-countdown-number">
              {countdownValue}
            </span>
          )}
        </div>
      ) : null}
    </div>
  )
}

function formatSeconds(valueMs: number): string {
  return (Math.max(0, valueMs) / 1000).toFixed(1)
}
