import {
  Camera,
  Check,
  Clock3,
  CodeXml,
  FlipHorizontal2,
  FlipVertical2,
  FolderOpen,
  RefreshCw,
  RotateCw,
  Settings2,
  Video,
} from 'lucide-react'

import type {
  CaptureMode,
  CountdownSec,
  OperatorSettings,
  PermissionState,
  SourceDescriptor,
} from '../../types'
import type { RuntimeEnvironment } from '../../lib/runtime'
import {
  type ClientPlatformId,
  type LatestReleaseCatalog,
  RELEASES_PAGE_URL,
  type ReleaseStatusDescriptor,
} from '../../lib/releaseCatalog'
import { INSTALL_SCRIPT_SNIPPETS } from '../../lib/installScripts'
import { PlatformIcon } from '../download/PlatformIcon'
import { ReleaseDownloadCard } from '../download/ReleaseDownloadCard'
import {
  COUNTDOWN_OPTIONS,
  platformForInstallScript,
  type DashboardStatusSummary,
  type DownloadTab,
} from './settingsDashboardUtils'

interface SettingsDashboardOverviewPanelProps {
  settings: OperatorSettings
  captureModeLabel: string
  currentSourceLabel: string
  runtime: RuntimeEnvironment
  permissionSummary: DashboardStatusSummary
  streamSummary: DashboardStatusSummary
  orientationLabel: string
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
  isBusy,
  lastError,
}: SettingsDashboardOverviewPanelProps) {
  return (
    <div className="sd-panel">
      <header className="sd-panel-header">
        <h2>Tổng quan</h2>
        <p className="sd-panel-sub">Trạng thái hệ thống hiện tại</p>
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
            {orientationLabel} · {settings.rotationQuarter * 90}°
          </span>
        </div>
        <div className="sd-kv">
          <span className="sd-kv-label">Cơ chế lưu</span>
          <span className="sd-kv-value">
            <span className="sd-status-dot" data-tone={runtime.tone} />
            {runtime.autoSaveSummary}
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
          <span className="sd-kv-label">Lưu trữ</span>
          <span className="sd-kv-value">{runtime.outputTargetLabel}</span>
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
  settings: OperatorSettings
  runtime: RuntimeEnvironment
  isBusy: boolean
  onPickOutputDir: () => Promise<string | null>
}

export function SettingsDashboardOutputPanel({
  settings,
  runtime,
  isBusy,
  onPickOutputDir,
}: SettingsDashboardOutputPanelProps) {
  const desktopSaveEnabled = runtime.supportsOutputDirectorySelection
  const outputDirValue = desktopSaveEnabled
    ? settings.outputDir ?? ''
    : runtime.outputTargetLabel

  return (
    <div className="sd-panel">
      <header className="sd-panel-header">
        <h2>Thư mục lưu</h2>
        <p className="sd-panel-sub">Cấu hình đường dẫn lưu ảnh và video</p>
      </header>

      <div className="sd-field">
        <label className="sd-field-label">Đường dẫn</label>
        <div className="sd-input-group">
          <input
            className="sd-input"
            type="text"
            value={outputDirValue}
            placeholder={
              desktopSaveEnabled
                ? 'Chọn thư mục bằng nút bên phải'
                : runtime.outputTargetLabel
            }
            spellCheck={false}
            autoComplete="off"
            readOnly
            disabled={isBusy || !desktopSaveEnabled}
          />
          <button
            className="sd-input-addon"
            type="button"
            onClick={() => {
              void onPickOutputDir()
            }}
            title="Chọn thư mục"
            disabled={isBusy || !desktopSaveEnabled}
          >
            <FolderOpen size={16} />
          </button>
        </div>
      </div>

      {!desktopSaveEnabled ? (
        <div className="sd-field-hint">
          Browser mode dùng thư mục download mặc định của trình duyệt. Vị trí thực
          tế có thể thay đổi theo cài đặt browser trên từng máy.
        </div>
      ) : null}

      {desktopSaveEnabled ? (
        <div className="sd-field-hint warn">
          Bản desktop chỉ cho chọn thư mục qua hộp thoại hệ thống để Tauri giữ
          quyền ghi file ổn định sau khi app khởi động lại. Không nhập tay đường
          dẫn.
        </div>
      ) : (
        <div className="sd-kv-grid sd-kv-grid--compact">
          <div className="sd-kv sd-kv--full">
            <span className="sd-kv-label">Thư mục hiện tại</span>
            <span className="sd-kv-value sd-kv-value--mono">
              {runtime.outputTargetLabel}
            </span>
          </div>
        </div>
      )}

      {desktopSaveEnabled ? (
        settings.outputDir ? (
          <div className="sd-kv-grid sd-kv-grid--compact">
            <div className="sd-kv sd-kv--full">
              <span className="sd-kv-label">Thư mục hiện tại</span>
              <span className="sd-kv-value sd-kv-value--mono">
                {settings.outputDir}
              </span>
            </div>
          </div>
        ) : (
          <div className="sd-field-hint">
            Desktop mode cần một thư mục local để ghi file sau mỗi lần chụp.
          </div>
        )
      ) : null}
    </div>
  )
}

interface SettingsDashboardTransformPanelProps {
  settings: OperatorSettings
  orientationLabel: string
  isBusy: boolean
  onRotate: () => void
  onFlipHorizontal: () => void
  onFlipVertical: () => void
}

export function SettingsDashboardTransformPanel({
  settings,
  orientationLabel,
  isBusy,
  onRotate,
  onFlipHorizontal,
  onFlipVertical,
}: SettingsDashboardTransformPanelProps) {
  return (
    <div className="sd-panel">
      <header className="sd-panel-header">
        <h2>Xoay / Lật</h2>
        <p className="sd-panel-sub">Điều chỉnh hướng và phản chiếu preview</p>
      </header>

      <div className="sd-field">
        <label className="sd-field-label">Xoay</label>
        <button
          className="sd-transform-btn"
          type="button"
          onClick={onRotate}
          disabled={isBusy}
        >
          <RotateCw size={16} />
          {settings.rotationQuarter * 90}°
        </button>
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
          <span className="sd-kv-value">{settings.rotationQuarter * 90}°</span>
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

interface SettingsDashboardDownloadPanelProps {
  downloadTab: DownloadTab
  copiedScriptId: string | null
  releaseCatalog: LatestReleaseCatalog | null
  releaseStatus: ReleaseStatusDescriptor
  currentPlatform: ClientPlatformId
  onToggleDownloadTab: () => void
  onCopyInstallScript: (scriptId: string, script: string) => void
}

export function SettingsDashboardDownloadPanel({
  downloadTab,
  copiedScriptId,
  releaseCatalog,
  releaseStatus,
  currentPlatform,
  onToggleDownloadTab,
  onCopyInstallScript,
}: SettingsDashboardDownloadPanelProps) {
  const releaseGroups = releaseCatalog?.groups ?? []

  return (
    <div className="sd-panel sd-download-panel">
      <header className="sd-panel-header">
        <h2>Tải ứng dụng</h2>
        <p className="sd-panel-sub">Bản cài cho người dùng cuối và script nội bộ</p>
      </header>

      <div className="sd-download-toggle">
        <span className="sd-download-toggle-label">Phân phối end-user</span>
        <button
          className={`sd-download-toggle-switch ${downloadTab === 'scripts' ? 'active' : ''}`}
          type="button"
          onClick={onToggleDownloadTab}
          aria-label="Toggle between end-user and scripts"
        >
          <span className="sd-toggle-slider" />
        </button>
        <span className="sd-download-toggle-label">Nội bộ / nâng cao</span>
      </div>

      {downloadTab === 'end-user' ? (
        <section className="sd-install-section" aria-label="Desktop downloads">
          <div className="sd-install-section-head">
            <div>
              <p className="sd-install-kicker">Phân phối end-user</p>
              <h3>Tải desktop app</h3>
              <p className="sd-install-section-copy">
                Hiển thị đúng installer theo từng hệ điều hành, lấy trực tiếp từ
                GitHub Releases mới nhất của dự án.
              </p>
            </div>
          </div>

          <ReleaseStatusBanner
            releaseStatus={releaseStatus}
            releaseUrl={releaseCatalog?.htmlUrl ?? RELEASES_PAGE_URL}
          />

          {releaseGroups.length > 0 ? (
            <div className="sd-install-grid">
              {releaseGroups.map((group) => (
                <ReleaseDownloadCard
                  key={group.id}
                  group={group}
                  highlighted={group.family === currentPlatform}
                  compact
                />
              ))}
            </div>
          ) : (
            <div className="sd-field-hint">
              Chưa lấy được danh sách installer từ release hiện tại.
            </div>
          )}
        </section>
      ) : (
        <section className="sd-install-section" aria-label="Install scripts">
          <div className="sd-install-section-head">
            <div>
              <p className="sd-install-kicker">Nội bộ / nâng cao</p>
              <h3>Script cài đặt từ GitHub Releases</h3>
              <p className="sd-install-section-copy">
                Giữ lại cho vận hành nội bộ hoặc các tình huống cần script cài đặt
                có sẵn quyền quản trị.
              </p>
            </div>
          </div>

          <div className="sd-install-grid">
            {INSTALL_SCRIPT_SNIPPETS.map((installScript) => {
              const isCopied = copiedScriptId === installScript.id

              return (
                <button
                  key={installScript.id}
                  className={`sd-install-card sd-install-card-btn ${isCopied ? 'copied' : ''}`}
                  type="button"
                  onClick={() => {
                    onCopyInstallScript(installScript.id, installScript.script)
                  }}
                  aria-label={`Sao chép script cài đặt cho ${installScript.platform}`}
                >
                  <div className="sd-install-card-head">
                    <div className="sd-install-card-title">
                      <span className="sd-install-os-icon" aria-hidden="true">
                        <PlatformIcon
                          platform={platformForInstallScript(installScript.platform)}
                        />
                      </span>
                      <h4>{installScript.platform}</h4>
                      <p>{installScript.summary}</p>
                    </div>
                    <span className="sd-install-card-icon" aria-hidden="true">
                      {isCopied ? <Check size={20} /> : <CodeXml size={20} />}
                    </span>
                  </div>
                  <span className="sd-install-card-hint">
                    {isCopied ? 'Đã sao chép vào clipboard' : 'Nhấn để sao chép script'}
                  </span>
                </button>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}

interface ReleaseStatusBannerProps {
  releaseStatus: ReleaseStatusDescriptor
  releaseUrl: string
}

function ReleaseStatusBanner({
  releaseStatus,
  releaseUrl,
}: ReleaseStatusBannerProps) {
  return (
    <div className={`sd-release-banner sd-release-banner--${releaseStatus.tone}`}>
      <div>
        <h4>{releaseStatus.title}</h4>
        <p>{releaseStatus.message}</p>
      </div>
      <a
        className="sd-release-link"
        href={releaseUrl}
        target="_blank"
        rel="noreferrer"
      >
        {releaseStatus.tone === 'ready' ? 'Xem release' : 'Mở trang Releases'}
      </a>
    </div>
  )
}
