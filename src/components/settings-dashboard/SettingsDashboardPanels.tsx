import {
  Camera,
  Clock3,
  ExternalLink,
  FlipHorizontal2,
  FlipVertical2,
  RefreshCw,
  RotateCw,
  Settings2,
  Video,
} from 'lucide-react'

import type {
  CaptureMode,
  CountdownSec,
  KioskProfile,
  OperatorSettings,
  PermissionState,
  SourceDescriptor,
} from '../../types'
import { DESKTOP_RELEASE_ARCHIVE_URL } from '../../lib/externalLinks'
import type { RuntimeEnvironment } from '../../lib/runtime'
import {
  COUNTDOWN_OPTIONS,
  type DashboardStatusSummary,
} from './settingsDashboardUtils'

interface SettingsDashboardOverviewPanelProps {
  settings: OperatorSettings
  captureModeLabel: string
  currentSourceLabel: string
  runtime: RuntimeEnvironment
  permissionSummary: DashboardStatusSummary
  streamSummary: DashboardStatusSummary
  orientationLabel: string
  profileAspectLabel: string
  isBusy: boolean
  lastError: string | null
}

export function SettingsDashboardOverviewPanel({
  settings,
  captureModeLabel,
  currentSourceLabel,
  runtime,
  permissionSummary,
  streamSummary,
  orientationLabel,
  profileAspectLabel,
  isBusy,
  lastError,
}: SettingsDashboardOverviewPanelProps) {
  return (
    <div className="sd-panel">
      <header className="sd-panel-header">
        <h2>Tổng quan</h2>
        <p className="sd-panel-sub">Trạng thái browser kiosk hiện tại</p>
      </header>

      <div className="sd-kv-grid">
        <div className="sd-kv">
          <span className="sd-kv-label">Chế độ chụp</span>
          <span className="sd-kv-value">{captureModeLabel}</span>
        </div>
        <div className="sd-kv">
          <span className="sd-kv-label">Đếm ngược</span>
          <span className="sd-kv-value">{settings.countdownSec}s</span>
        </div>
        <div className="sd-kv">
          <span className="sd-kv-label">Camera</span>
          <span className="sd-kv-value">{currentSourceLabel}</span>
        </div>
        <div className="sd-kv">
          <span className="sd-kv-label">Runtime</span>
          <span className="sd-kv-value">
            <span className="sd-status-dot" data-tone={runtime.tone} />
            {runtime.label}
          </span>
        </div>
        <div className="sd-kv">
          <span className="sd-kv-label">Hướng</span>
          <span className="sd-kv-value">
            {orientationLabel} · {profileAspectLabel}
          </span>
        </div>
        <div className="sd-kv">
          <span className="sd-kv-label">Share</span>
          <span className="sd-kv-value">
            <span className="sd-status-dot" data-tone={runtime.tone} />
            {runtime.storageSummary}
          </span>
        </div>
        <div className="sd-kv">
          <span className="sd-kv-label">Flip</span>
          <span className="sd-kv-value">
            H: {settings.flipHorizontal ? 'Bật' : 'Tắt'} · V:{' '}
            {settings.flipVertical ? 'Bật' : 'Tắt'}
          </span>
        </div>
        <div className="sd-kv">
          <span className="sd-kv-label">Đích gallery</span>
          <span className="sd-kv-value">{runtime.storageTargetLabel}</span>
        </div>
      </div>

      <div className="sd-status-strip">
        <div className="sd-status-item">
          <span className="sd-status-dot" data-tone={permissionSummary.tone} />
          <span className="sd-status-text">Quyền: {permissionSummary.label}</span>
        </div>
        <div className="sd-status-item">
          <span className="sd-status-dot" data-tone={streamSummary.tone} />
          <span className="sd-status-text">Stream: {streamSummary.label}</span>
        </div>
        <div className="sd-status-item">
          <span className="sd-status-dot" data-tone={isBusy ? 'warn' : 'good'} />
          <span className="sd-status-text">{isBusy ? 'Đang xử lý' : 'Sẵn sàng'}</span>
        </div>
      </div>

      {lastError ? (
        <div className="sd-error-banner">
          <p>{lastError}</p>
        </div>
      ) : null}
    </div>
  )
}

interface SettingsDashboardCapturePanelProps {
  settings: OperatorSettings
  captureModeLabel: string
  isBusy: boolean
  onModeChange: (mode: CaptureMode) => void
  onCountdownChange: (countdown: CountdownSec) => void
}

export function SettingsDashboardCapturePanel({
  settings,
  captureModeLabel,
  isBusy,
  onModeChange,
  onCountdownChange,
}: SettingsDashboardCapturePanelProps) {
  return (
    <div className="sd-panel">
      <header className="sd-panel-header">
        <h2>Chế độ chụp</h2>
        <p className="sd-panel-sub">Chọn chế độ và thời gian đếm ngược</p>
      </header>

      <div className="sd-field">
        <label className="sd-field-label">Chế độ</label>
        <div className="sd-segmented">
          <button
            className={`sd-seg-btn ${settings.captureMode === 'photo' ? 'active' : ''}`}
            type="button"
            onClick={() => onModeChange('photo')}
            disabled={isBusy}
          >
            <Camera size={16} />
            Photo
          </button>
          <button
            className={`sd-seg-btn ${settings.captureMode === 'boomerang' ? 'active' : ''}`}
            type="button"
            onClick={() => onModeChange('boomerang')}
            disabled={isBusy}
          >
            <Video size={16} />
            Boomerang
          </button>
        </div>
      </div>

      <div className="sd-field">
        <label className="sd-field-label">Đếm ngược</label>
        <div className="sd-chip-row">
          {COUNTDOWN_OPTIONS.map((option) => (
            <button
              key={option}
              className={`sd-chip ${settings.countdownSec === option ? 'active' : ''}`}
              type="button"
              onClick={() => onCountdownChange(option)}
              disabled={isBusy}
            >
              <Clock3 size={14} />
              {option}s
            </button>
          ))}
        </div>
      </div>

      <div className="sd-field-hint">
        Chế độ <strong>{captureModeLabel}</strong> với đếm ngược{' '}
        <strong>{settings.countdownSec}s</strong> đang được sử dụng.
      </div>
    </div>
  )
}

interface SettingsDashboardCameraPanelProps {
  settings: OperatorSettings
  sources: SourceDescriptor[]
  permissionState: PermissionState
  isBusy: boolean
  permissionSummary: DashboardStatusSummary
  streamSummary: DashboardStatusSummary
  currentSourceLabel: string
  onDeviceChange: (deviceId: string) => void
  onRetryPermission: () => void
  onRefreshSources: () => void
}

export function SettingsDashboardCameraPanel({
  settings,
  sources,
  permissionState,
  isBusy,
  permissionSummary,
  streamSummary,
  currentSourceLabel,
  onDeviceChange,
  onRetryPermission,
  onRefreshSources,
}: SettingsDashboardCameraPanelProps) {
  return (
    <div className="sd-panel">
      <header className="sd-panel-header">
        <h2>Camera</h2>
        <p className="sd-panel-sub">Chọn nguồn camera và quản lý quyền</p>
      </header>

      <div className="sd-field">
        <label className="sd-field-label">Nguồn camera</label>
        <select
          className="sd-input"
          value={settings.deviceId ?? ''}
          onChange={(event) => onDeviceChange(event.target.value)}
          disabled={permissionState !== 'granted' || isBusy || sources.length === 0}
        >
          <option value="">Chọn nguồn camera</option>
          {sources.map((source) => (
            <option key={source.deviceId} value={source.deviceId}>
              {source.isSonyPreferred ? '★ ' : ''}
              {source.label}
            </option>
          ))}
        </select>
      </div>

      <div className="sd-btn-row">
        {permissionState !== 'granted' ? (
          <button className="sd-action-btn" type="button" onClick={onRetryPermission}>
            <Settings2 size={16} />
            Xin quyền camera
          </button>
        ) : null}
        <button className="sd-action-btn" type="button" onClick={onRefreshSources}>
          <RefreshCw size={16} />
          Làm mới
        </button>
      </div>

      <div className="sd-kv-grid sd-kv-grid--compact">
        <div className="sd-kv">
          <span className="sd-kv-label">Quyền</span>
          <span className="sd-kv-value">
            <span className="sd-status-dot" data-tone={permissionSummary.tone} />
            {permissionSummary.label}
          </span>
        </div>
        <div className="sd-kv">
          <span className="sd-kv-label">Stream</span>
          <span className="sd-kv-value">
            <span className="sd-status-dot" data-tone={streamSummary.tone} />
            {streamSummary.label}
          </span>
        </div>
        <div className="sd-kv">
          <span className="sd-kv-label">Số nguồn</span>
          <span className="sd-kv-value">{sources.length}</span>
        </div>
        <div className="sd-kv">
          <span className="sd-kv-label">Đang dùng</span>
          <span className="sd-kv-value">{currentSourceLabel}</span>
        </div>
      </div>
    </div>
  )
}

interface SettingsDashboardOutputPanelProps {
  orientationLabel: string
  runtime: RuntimeEnvironment
}

export function SettingsDashboardOutputPanel({
  orientationLabel,
  runtime,
}: SettingsDashboardOutputPanelProps) {
  return (
    <div className="sd-panel">
      <header className="sd-panel-header">
        <h2>Cloud share</h2>
        <p className="sd-panel-sub">Browser kiosk luôn upload session lên cloud share</p>
      </header>

      <div className="sd-kv-grid">
        <div className="sd-kv">
          <span className="sd-kv-label">Đích lưu</span>
          <span className="sd-kv-value">{runtime.storageTargetLabel}</span>
        </div>
        <div className="sd-kv">
          <span className="sd-kv-label">Chế độ</span>
          <span className="sd-kv-value">{runtime.label}</span>
        </div>
        <div className="sd-kv">
          <span className="sd-kv-label">Session max</span>
          <span className="sd-kv-value">4 media / QR</span>
        </div>
        <div className="sd-kv">
          <span className="sd-kv-label">Orientation mặc định</span>
          <span className="sd-kv-value">{orientationLabel}</span>
        </div>
      </div>

      <div className="sd-field-hint">
        Repo browser-only này không còn hỗ trợ local-save hay chọn thư mục trên máy
        kiosk. Mọi shot đã chốt sẽ được upload khi kết thúc session và sinh một QR
        gallery duy nhất cho khách.
      </div>
    </div>
  )
}

interface SettingsDashboardTransformPanelProps {
  profile: KioskProfile
  settings: OperatorSettings
  orientationLabel: string
  isBusy: boolean
  onRotate: () => void
  onFlipHorizontal: () => void
  onFlipVertical: () => void
}

export function SettingsDashboardTransformPanel({
  profile,
  settings,
  orientationLabel,
  isBusy,
  onRotate,
  onFlipHorizontal,
  onFlipVertical,
}: SettingsDashboardTransformPanelProps) {
  const portraitLocked = profile === 'portrait'

  return (
    <div className="sd-panel">
      <header className="sd-panel-header">
        <h2>{portraitLocked ? 'Căn khung dọc' : 'Xoay / Lật'}</h2>
        <p className="sd-panel-sub">
          {portraitLocked
            ? 'Profile portrait được khóa theo khung 3:4 dọc để framing ổn định.'
            : 'Điều chỉnh hướng và phản chiếu preview'}
        </p>
      </header>

      <div className="sd-field">
        <label className="sd-field-label">Xoay</label>
        {portraitLocked ? (
          <div className="sd-transform-lock">
            <RotateCw size={16} />
            <span>Portrait lock · 90°</span>
          </div>
        ) : (
          <button
            className="sd-transform-btn"
            type="button"
            onClick={onRotate}
            disabled={isBusy}
          >
            <RotateCw size={16} />
            {settings.rotationQuarter * 90}°
          </button>
        )}
      </div>

      <div className="sd-field">
        <label className="sd-field-label">Lật hình</label>
        <div className="sd-btn-row">
          <button
            className={`sd-transform-btn ${settings.flipHorizontal ? 'active' : ''}`}
            type="button"
            onClick={onFlipHorizontal}
            disabled={isBusy}
          >
            <FlipHorizontal2 size={16} />
            Ngang
          </button>
          <button
            className={`sd-transform-btn ${settings.flipVertical ? 'active' : ''}`}
            type="button"
            onClick={onFlipVertical}
            disabled={isBusy}
          >
            <FlipVertical2 size={16} />
            Dọc
          </button>
        </div>
      </div>

      <div className="sd-kv-grid sd-kv-grid--compact">
        <div className="sd-kv">
          <span className="sd-kv-label">Hướng</span>
          <span className="sd-kv-value">{orientationLabel}</span>
        </div>
        <div className="sd-kv">
          <span className="sd-kv-label">Góc xoay</span>
          <span className="sd-kv-value">
            {portraitLocked ? '90° · Lock' : `${settings.rotationQuarter * 90}°`}
          </span>
        </div>
        <div className="sd-kv">
          <span className="sd-kv-label">Flip ngang</span>
          <span className="sd-kv-value">
            <span
              className="sd-status-dot"
              data-tone={settings.flipHorizontal ? 'good' : 'neutral'}
            />
            {settings.flipHorizontal ? 'Bật' : 'Tắt'}
          </span>
        </div>
        <div className="sd-kv">
          <span className="sd-kv-label">Flip dọc</span>
          <span className="sd-kv-value">
            <span
              className="sd-status-dot"
              data-tone={settings.flipVertical ? 'good' : 'neutral'}
            />
            {settings.flipVertical ? 'Bật' : 'Tắt'}
          </span>
        </div>
      </div>
    </div>
  )
}

export function SettingsDashboardDownloadPanel() {
  return (
    <div className="sd-panel sd-download-panel">
      <header className="sd-panel-header">
        <h2>Desktop app</h2>
        <p className="sd-panel-sub">Desktop mode đã được tách khỏi browser project này</p>
      </header>

      <section className="sd-install-section" aria-label="Desktop handoff">
        <div className="sd-install-section-head">
          <div>
            <p className="sd-install-kicker">Archive + handoff</p>
            <h3>Mở release archive desktop</h3>
            <p className="sd-install-section-copy">
              Browser webapp này không còn build hay catalog installer inline nữa.
              Phần desktop được snapshot sang codebase riêng để tiếp tục phát triển,
              còn release public hiện tại vẫn được giữ như archive trên GitHub.
            </p>
          </div>
        </div>

        <div className="sd-release-banner sd-release-banner--neutral">
          <div>
            <h4>Desktop đã tách khỏi kiosk-app</h4>
            <p>
              Những gì đã được tách ra: Tauri runtime, local-save flow, desktop
              release pipeline, và toàn bộ source desktop baseline trong thư mục
              riêng `kiosk-desktop`.
            </p>
          </div>
          <a
            className="sd-release-link"
            href={DESKTOP_RELEASE_ARCHIVE_URL}
            target="_blank"
            rel="noreferrer"
          >
            Mở archive
          </a>
        </div>

        <div className="sd-field-hint">
          Nếu cần phân phối installer ngay lúc này, hãy dùng trang Releases archive.
          Những release desktop mới nên được phát hành từ codebase `kiosk-desktop`
          sau khi gắn remote riêng.
        </div>

        <a
          className="sd-action-btn"
          href={DESKTOP_RELEASE_ARCHIVE_URL}
          target="_blank"
          rel="noreferrer"
        >
          <ExternalLink size={16} />
          Mở GitHub Releases
        </a>
      </section>
    </div>
  )
}
