import {
  ArrowLeft,
  Camera,
  Check,
  Clock3,
  CodeXml,
  FlipHorizontal2,
  FlipVertical2,
  FolderOpen,
  HardDrive,
  LayoutDashboard,
  Monitor,
  RefreshCw,
  RotateCw,
  Settings2,
  Video,
} from 'lucide-react'
import { useEffect, useState, type KeyboardEvent, type RefObject } from 'react'
import { Link } from 'react-router-dom'

import type {
  CaptureMode,
  CountdownSec,
  OperatorSettings,
  PermissionState,
  SourceDescriptor,
  StreamState,
} from '../types'
import {
  fetchLatestReleaseStatus,
  INSTALL_SCRIPT_SNIPPETS,
  RELEASES_PAGE_URL,
  type LatestReleaseStatus,
} from '../lib/installScripts'
import cheeseLogo from '../../cheese_icon_transparent.svg'
import { APP_NAME, APP_SUBTITLE } from '../lib/branding'
import { getRuntimeEnvironment } from '../lib/runtime'
import { CapturePreview } from './capture/CapturePreview'

const COUNTDOWN_OPTIONS: CountdownSec[] = [3, 5, 10]
const CAPTURE_ROUTE = '/capture'

type SectionId = 'overview' | 'capture' | 'camera' | 'output' | 'transform'

const SECTION_LINKS: { id: SectionId; label: string; icon: typeof Camera }[] = [
  { id: 'overview', label: 'Tổng quan', icon: LayoutDashboard },
  { id: 'capture', label: 'Chế độ chụp', icon: Camera },
  { id: 'camera', label: 'Camera', icon: Monitor },
  { id: 'output', label: 'Thư mục lưu', icon: HardDrive },
  { id: 'transform', label: 'Xoay / Lật', icon: RotateCw },
]

interface SettingsDashboardProps {
  settings: OperatorSettings
  sources: SourceDescriptor[]
  permissionState: PermissionState
  streamState: StreamState
  lastError: string | null
  isBusy: boolean
  previewFrameRef: RefObject<HTMLDivElement | null>
  previewCanvasRef: RefObject<HTMLCanvasElement | null>
  onModeChange: (mode: CaptureMode) => void
  onDeviceChange: (deviceId: string) => void
  onCountdownChange: (countdown: CountdownSec) => void
  onRotate: () => void
  onFlipHorizontal: () => void
  onFlipVertical: () => void
  onPickOutputDir: () => Promise<string | null>
  onOutputDirChange: (outputDir: string) => void
  onRetryPermission: () => void
  onRefreshSources: () => void
}

export function SettingsDashboard({
  settings,
  sources,
  permissionState,
  streamState,
  lastError,
  isBusy,
  previewFrameRef,
  previewCanvasRef,
  onModeChange,
  onDeviceChange,
  onCountdownChange,
  onRotate,
  onFlipHorizontal,
  onFlipVertical,
  onPickOutputDir,
  onOutputDirChange,
  onRetryPermission,
  onRefreshSources,
}: SettingsDashboardProps) {
  const [activeSection, setActiveSection] = useState<SectionId>('overview')
  const persistedOutputDir = settings.outputDir ?? ''
  const [outputDirDraft, setOutputDirDraft] = useState(persistedOutputDir)
  const [isEditingOutputDir, setIsEditingOutputDir] = useState(false)
  const [copiedScriptId, setCopiedScriptId] = useState<string | null>(null)
  const [latestReleaseStatus, setLatestReleaseStatus] =
    useState<LatestReleaseStatus | null>(null)

  const isPortrait = settings.rotationQuarter % 2 === 1
  const previewAspect = isPortrait ? '3 / 4' : '4 / 3'
  const captureModeLabel = settings.captureMode === 'photo' ? 'Photo' : 'Boomerang'
  const currentSourceLabel =
    sources.find((s) => s.deviceId === settings.deviceId)?.label ?? 'Chưa chọn'
  const permissionSummary = getPermissionSummary(permissionState)
  const streamSummary = getStreamSummary(streamState)
  const orientationLabel = isPortrait ? 'Portrait' : 'Landscape'
  const runtime = getRuntimeEnvironment(settings.outputDir)
  const desktopSaveEnabled = runtime.supportsOutputDirectorySelection
  const currentOutputLabel = runtime.outputTargetLabel
  const outputDirValue = isEditingOutputDir
    ? outputDirDraft
    : desktopSaveEnabled
      ? persistedOutputDir
      : runtime.outputTargetLabel
  const runtimeModeLabel = runtime.label
  const autoSaveSummary = runtime.autoSaveSummary

  useEffect(() => {
    let cancelled = false

    void fetchLatestReleaseStatus().then((status) => {
      if (!cancelled) {
        setLatestReleaseStatus(status)
      }
    })

    return () => {
      cancelled = true
    }
  }, [])

  function commitOutputDirDraft(): void {
    const nextOutputDir = outputDirValue.trim()

    onOutputDirChange(nextOutputDir)
    setOutputDirDraft(nextOutputDir)
    setIsEditingOutputDir(false)
  }

  function handleOutputDirKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (event.key !== 'Enter') return
    event.preventDefault()
    commitOutputDirDraft()
  }

  function handleOutputDirChange(nextOutputDir: string): void {
    setOutputDirDraft(nextOutputDir)
    setIsEditingOutputDir(true)
  }

  async function handlePickOutputDir(): Promise<void> {
    const selected = await onPickOutputDir()

    if (selected !== null) {
      setOutputDirDraft(selected)
      setIsEditingOutputDir(false)
    }
  }

  async function handleCopyInstallScript(
    scriptId: string,
    script: string,
  ): Promise<void> {
    await copyTextToClipboard(script)
    setCopiedScriptId(scriptId)

    window.setTimeout(() => {
      setCopiedScriptId((current) => (current === scriptId ? null : current))
    }, 1600)
  }

  function renderReleaseStatusBanner() {
    if (latestReleaseStatus === null) {
      return (
        <div className="sd-release-banner sd-release-banner--neutral">
          <p>Đang kiểm tra latest release trên GitHub...</p>
        </div>
      )
    }

    if (latestReleaseStatus.state === 'missing') {
      return (
        <div className="sd-release-banner sd-release-banner--warn">
          <div>
            <h4>Release chưa sẵn sàng</h4>
            <p>
              Repo hiện chưa có latest release để các script cài đặt tải asset.
              Hãy tạo tag phiên bản mới rồi đợi workflow release hoàn tất.
            </p>
          </div>
          <a
            className="sd-release-link"
            href={RELEASES_PAGE_URL}
            target="_blank"
            rel="noreferrer"
          >
            Mở trang Releases
          </a>
        </div>
      )
    }

    if (latestReleaseStatus.state === 'ready') {
      return (
        <div className="sd-release-banner sd-release-banner--ready">
          <div>
            <h4>Latest release sẵn sàng</h4>
            <p>
              Có thể dùng ngay các script bên dưới.
              {latestReleaseStatus.tagName ? ` Phiên bản mới nhất: ${latestReleaseStatus.tagName}.` : ''}
            </p>
          </div>
          <a
            className="sd-release-link"
            href={latestReleaseStatus.htmlUrl ?? RELEASES_PAGE_URL}
            target="_blank"
            rel="noreferrer"
          >
            Xem release
          </a>
        </div>
      )
    }

    return (
      <div className="sd-release-banner sd-release-banner--neutral">
        <div>
          <h4>Không kiểm tra được release</h4>
          <p>
            Không xác minh được latest release từ GitHub lúc này. Bạn vẫn có thể sao chép script hoặc mở trang Releases để kiểm tra thủ công.
          </p>
        </div>
        <a
          className="sd-release-link"
          href={RELEASES_PAGE_URL}
          target="_blank"
          rel="noreferrer"
        >
          Mở trang Releases
        </a>
      </div>
    )
  }

  /* ── Section renderers ── */

  function renderContent() {
    switch (activeSection) {
      case 'overview':
        return (
          <div className="sd-panel">
            <header className="sd-panel-header">
              <h2>Tổng quan</h2>
              <p className="sd-panel-sub">Trạng thái hệ thống hiện tại</p>
            </header>

            <section className="sd-install-section" aria-label="Install scripts">
              <div className="sd-install-section-head">
                <div>
                  <p className="sd-install-kicker">Phân phối nội bộ</p>
                  <h3>Script cài đặt từ GitHub Releases</h3>
                </div>
              </div>

              {renderReleaseStatusBanner()}

              <div className="sd-install-grid">
                {INSTALL_SCRIPT_SNIPPETS.map((installScript) => {
                  const isCopied = copiedScriptId === installScript.id

                  return (
                    <button
                      key={installScript.id}
                      className={`sd-install-card sd-install-card-btn ${isCopied ? 'copied' : ''}`}
                      type="button"
                      onClick={() => {
                        void handleCopyInstallScript(
                          installScript.id,
                          installScript.script,
                        )
                      }}
                      aria-label={`Sao chép script cài đặt cho ${installScript.platform}`}
                    >
                      <div className="sd-install-card-head">
                        <div className="sd-install-card-title">
                          <span className="sd-install-os-icon" aria-hidden="true">
                            <InstallPlatformIcon platform={installScript.platform} />
                          </span>
                          <h4>{installScript.platform}</h4>
                          <p>{installScript.summary}</p>
                        </div>
                        <span className="sd-install-card-icon" aria-hidden="true">
                          {isCopied ? <Check size={20} /> : <CodeXml size={20} />}
                        </span>
                      </div>
                      <span className="sd-install-card-hint">
                        {isCopied ? 'Đã sao chép vào clipboard' : 'Nhấn để sao chép script cài đặt'}
                      </span>
                    </button>
                  )
                })}
              </div>
            </section>

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
                  <span
                    className="sd-status-dot"
                    data-tone={runtime.tone}
                  />
                  {runtimeModeLabel}
                </span>
              </div>
              <div className="sd-kv">
                <span className="sd-kv-label">Hướng</span>
                <span className="sd-kv-value">{orientationLabel} · {settings.rotationQuarter * 90}°</span>
              </div>
              <div className="sd-kv">
                <span className="sd-kv-label">Cơ chế lưu</span>
                <span className="sd-kv-value">
                  <span
                    className="sd-status-dot"
                    data-tone={runtime.tone}
                  />
                  {autoSaveSummary}
                </span>
              </div>
              <div className="sd-kv">
                <span className="sd-kv-label">Flip</span>
                <span className="sd-kv-value">
                  H: {settings.flipHorizontal ? 'Bật' : 'Tắt'} · V: {settings.flipVertical ? 'Bật' : 'Tắt'}
                </span>
              </div>
              <div className="sd-kv">
                <span className="sd-kv-label">Lưu trữ</span>
                <span className="sd-kv-value">{currentOutputLabel}</span>
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

      case 'capture':
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
                {COUNTDOWN_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    className={`sd-chip ${settings.countdownSec === opt ? 'active' : ''}`}
                    type="button"
                    onClick={() => onCountdownChange(opt)}
                    disabled={isBusy}
                  >
                    <Clock3 size={14} />
                    {opt}s
                  </button>
                ))}
              </div>
            </div>

            <div className="sd-field-hint">
              Chế độ <strong>{captureModeLabel}</strong> với đếm ngược <strong>{settings.countdownSec}s</strong> đang được sử dụng.
            </div>
          </div>
        )

      case 'camera':
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
                onChange={(e) => onDeviceChange(e.target.value)}
                disabled={permissionState !== 'granted' || isBusy || sources.length === 0}
              >
                <option value="">Chọn nguồn camera</option>
                {sources.map((s) => (
                  <option key={s.deviceId} value={s.deviceId}>
                    {s.isSonyPreferred ? '★ ' : ''}{s.label}
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

      case 'output':
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
                  onChange={(e) => handleOutputDirChange(e.target.value)}
                  onBlur={commitOutputDirDraft}
                  onKeyDown={handleOutputDirKeyDown}
                  placeholder="Nhập đường dẫn thư mục"
                  spellCheck={false}
                  autoComplete="off"
                  disabled={isBusy || !desktopSaveEnabled}
                />
                <button
                  className="sd-input-addon"
                  type="button"
                  onClick={() => { void handlePickOutputDir() }}
                  title="Chọn thư mục"
                  disabled={isBusy || !desktopSaveEnabled}
                >
                  <FolderOpen size={16} />
                </button>
              </div>
            </div>

            {!desktopSaveEnabled ? (
              <div className="sd-field-hint">
                Browser mode dùng thư mục download mặc định của trình duyệt. Vị trí thực tế có thể thay đổi theo cài đặt browser trên từng máy.
              </div>
            ) : null}

            {desktopSaveEnabled ? (
              <div className="sd-btn-row">
                <button
                  className="sd-action-btn primary"
                  type="button"
                  onClick={commitOutputDirDraft}
                  disabled={isBusy}
                >
                  Lưu đường dẫn
                </button>
              </div>
            ) : null}

            {desktopSaveEnabled ? (
              settings.outputDir ? (
                <div className="sd-kv-grid sd-kv-grid--compact">
                  <div className="sd-kv sd-kv--full">
                    <span className="sd-kv-label">Thư mục hiện tại</span>
                    <span className="sd-kv-value sd-kv-value--mono">{settings.outputDir}</span>
                  </div>
                </div>
              ) : (
                <div className="sd-field-hint">
                  Desktop mode cần một thư mục local để ghi file sau mỗi lần chụp.
                </div>
              )
            ) : (
              <div className="sd-kv-grid sd-kv-grid--compact">
                <div className="sd-kv sd-kv--full">
                  <span className="sd-kv-label">Thư mục hiện tại</span>
                  <span className="sd-kv-value sd-kv-value--mono">{runtime.outputTargetLabel}</span>
                </div>
              </div>
            )}
          </div>
        )

      case 'transform':
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
                  <span className="sd-status-dot" data-tone={settings.flipHorizontal ? 'good' : 'neutral'} />
                  {settings.flipHorizontal ? 'Bật' : 'Tắt'}
                </span>
              </div>
              <div className="sd-kv">
                <span className="sd-kv-label">Flip dọc</span>
                <span className="sd-kv-value">
                  <span className="sd-status-dot" data-tone={settings.flipVertical ? 'good' : 'neutral'} />
                  {settings.flipVertical ? 'Bật' : 'Tắt'}
                </span>
              </div>
            </div>
          </div>
        )
    }
  }

  return (
    <section className="settings-dashboard">
      {/* ── Compact nav rail ── */}
      <aside className="sd-rail">
        <div className="sd-rail-brand">
          <img
            className="sd-rail-logo"
            src={cheeseLogo}
            alt={APP_NAME}
            title={`${APP_NAME} — ${APP_SUBTITLE}`}
            width={52}
            height={39}
          />
        </div>

        <nav className="sd-rail-nav" aria-label="Settings">
          {SECTION_LINKS.map((section) => {
            const Icon = section.icon
            return (
              <button
                key={section.id}
                className={`sd-rail-item ${activeSection === section.id ? 'active' : ''}`}
                type="button"
                onClick={() => setActiveSection(section.id)}
                title={section.label}
              >
                <Icon size={20} />
                <span>{section.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="sd-rail-footer">
          <Link className="sd-rail-back" to={CAPTURE_ROUTE} title="Quay lại chụp">
            <ArrowLeft size={20} />
            <span>Quay lại</span>
          </Link>
        </div>
      </aside>

      {/* ── Controls panel ── */}
      <main className="sd-controls">
        {renderContent()}
      </main>

      {/* ── Always-visible preview ── */}
      <aside className="sd-preview">
        <div className="sd-preview-label">Live Preview</div>
        <div className="sd-preview-stage">
          <div className={`sd-preview-square ${isPortrait ? 'is-portrait' : 'is-landscape'}`}>
            <CapturePreview
              previewAspect={previewAspect}
              previewFrameRef={previewFrameRef}
              previewCanvasRef={previewCanvasRef}
              permissionState={permissionState}
              sourceUnavailable={streamState === 'missing-device' || sources.length === 0}
              countdownValue={null}
              onRetryPermission={onRetryPermission}
              onRefreshSources={onRefreshSources}
            />
          </div>
        </div>
        <div className="sd-preview-meta">
          <div className="sd-preview-meta-row">
            <span>Stream</span>
            <span className="sd-status-dot" data-tone={streamSummary.tone} />
            <span>{streamSummary.label}</span>
          </div>
          <div className="sd-preview-meta-row">
            <span>Nguồn</span>
            <span className="sd-preview-meta-val">{currentSourceLabel}</span>
          </div>
          <div className="sd-preview-meta-row">
            <span>Transform</span>
            <span className="sd-preview-meta-val">{settings.rotationQuarter * 90}° · H{settings.flipHorizontal ? '1' : '0'} V{settings.flipVertical ? '1' : '0'}</span>
          </div>
          <div className="sd-preview-meta-row">
            <span>Mode</span>
            <span className="sd-preview-meta-val">{captureModeLabel} · {settings.countdownSec}s</span>
          </div>
        </div>
      </aside>
    </section>
  )
}

/* ── Helpers ── */

function getPermissionSummary(p: PermissionState) {
  switch (p) {
    case 'granted':  return { label: 'Đã cấp',      tone: 'good'    as const }
    case 'denied':   return { label: 'Bị từ chối',   tone: 'warn'    as const }
    default:         return { label: 'Chờ',           tone: 'neutral' as const }
  }
}

function getStreamSummary(s: StreamState) {
  switch (s) {
    case 'live':           return { label: 'Đang phát',    tone: 'good'    as const }
    case 'starting':       return { label: 'Khởi động',    tone: 'neutral' as const }
    case 'missing-device': return { label: 'Mất thiết bị', tone: 'warn'    as const }
    case 'error':          return { label: 'Lỗi',          tone: 'warn'    as const }
    default:               return { label: 'Chờ',          tone: 'neutral' as const }
  }
}

async function copyTextToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }

  const textarea = document.createElement('textarea')

  textarea.value = text
  textarea.setAttribute('readonly', 'true')
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand('copy')
  textarea.remove()
}

function InstallPlatformIcon({ platform }: { platform: string }) {
  switch (platform) {
    case 'Windows 11':
      return (
        <svg viewBox="0 0 640 640" fill="currentColor">
          <path d="M.2 298.669L0 90.615l256.007-34.76v242.814H.201zM298.658 49.654L639.905-.012v298.681H298.657V49.654zM640 341.331l-.071 298.681L298.669 592V341.332h341.33zM255.983 586.543L.189 551.463v-210.18h255.794v245.26z" />
        </svg>
      )
    case 'macOS':
      return (
        <svg viewBox="0 0 640 640" fill="currentColor">
          <path d="M494.782 340.02c-.803-81.025 66.084-119.907 69.072-121.832-37.595-54.993-96.167-62.552-117.037-63.402-49.843-5.032-97.242 29.362-122.565 29.362-25.253 0-64.277-28.607-105.604-27.85-54.32.803-104.4 31.594-132.403 80.245C29.81 334.457 71.81 479.58 126.816 558.976c26.87 38.882 58.914 82.56 100.997 81 40.512-1.594 55.843-26.244 104.848-26.244 48.993 0 62.753 26.245 105.64 25.406 43.606-.803 71.232-39.638 97.925-78.65 30.887-45.12 43.548-88.75 44.316-90.994-.969-.437-85.029-32.634-85.879-129.439l.118-.035zM414.23 102.178C436.553 75.095 451.636 37.5 447.514-.024c-32.162 1.311-71.163 21.437-94.253 48.485-20.729 24.012-38.836 62.28-33.993 99.036 35.918 2.8 72.591-18.248 94.926-45.272l.036-.047z" />
        </svg>
      )
    default:
      return (
        <svg viewBox="0 0 640 640" fill="currentColor">
          <path d="M354.796 460.541c-51.201 23.847-98.848 23.552-130.856 21.284-38.15-2.764-68.835-13.193-82.312-22.312-8.315-5.634-19.595-3.448-25.252 4.89-5.658 8.327-3.45 19.583 4.89 25.24 21.673 14.682 60.024 25.596 100.123 28.49 6.803.483 14.244.802 22.287.802 34.879 0 79.159-3.33 126.521-25.358 9.118-4.229 13.052-15.048 8.8-24.154-4.24-9.118-15.036-13.051-24.154-8.8l-.048-.082zm202.042-26.906c1.76-157.927 17.965-456.372-284.366-432.253C-26.055 25.418 53.103 340.742 48.674 446.344 44.717 502.223 26.197 570.515 0 639.988l80.67.012c8.28-29.433 14.41-58.572 16.985-86.351a190.202 190.202 0 0 0 15.65 9.791c9.047 5.327 16.795 12.402 25.04 19.878 19.204 17.528 40.996 37.359 83.563 39.84 2.835.165 5.705.247 8.552.247 43.087 0 72.52-18.838 96.166-34.004 11.327-7.24 21.119-13.524 30.367-16.524 26.197-8.197 49.075-21.437 66.201-38.28a124.86 124.86 0 0 0 7.477-8.079c9.531 34.926 22.56 74.245 37.04 113.446l172.29-.012c-41.363-63.874-84.037-126.474-83.163-206.365v.048zM77.553 347.71v-.036c-2.965-51.532 21.685-94.89 55.075-96.851 33.402-1.973 62.848 38.28 65.8 89.8v.047c.166 2.764.237 5.516.237 8.233-10.571 2.645-20.115 6.52-28.678 11.008-.047-.39-.047-.756-.07-1.158-2.847-29.244-18.485-51.355-34.926-49.359-16.453 1.985-27.438 27.355-24.567 56.6 1.24 12.756 4.913 24.153 10.04 32.764-1.288.992-4.89 3.638-9.001 6.638-3.118 2.28-6.874 5.031-11.445 8.397-12.437-16.323-20.953-39.709-22.477-66.201l.012.118zm338.248 127.407c-1.193 27.248-36.804 52.89-69.733 63.166l-.19.07c-13.688 4.454-25.89 12.25-38.799 20.517-21.72 13.878-44.162 28.24-76.56 28.24-2.114 0-4.323-.07-6.437-.189-29.681-1.724-43.607-14.41-61.158-30.437-9.284-8.433-18.874-17.197-31.229-24.45l-.295-.164c-26.681-15.072-43.229-33.804-44.327-50.115-.508-8.115 3.094-15.119 10.724-20.882 16.642-12.485 27.804-20.634 35.162-26.032 8.197-6 10.677-7.796 12.52-9.555a183.84 183.84 0 0 0 4.24-4.123c15.284-14.846 40.831-39.72 80.08-39.72 24 0 50.551 9.236 78.84 27.437 13.322 8.681 24.92 12.685 39.59 17.764 10.087 3.484 21.567 7.44 36.875 14.008l.248.118c14.28 5.882 31.205 16.595 30.402 34.323l.047.024zm-7.878-64.017a102.134 102.134 0 0 0-8.599-3.91c-13.807-5.928-24.886-9.92-34.087-13.121 5.091-9.922 8.245-22.312 8.528-35.753.732-32.717-15.791-59.327-36.874-59.363-21.072-.023-38.717 26.446-39.438 59.162a36.16 36.16 0 0 0 0 3.201c-12.957-5.953-25.713-10.323-38.233-12.957-.047-1.24-.13-2.433-.165-3.673v-.035c-1.205-59.647 35.363-109.005 81.71-110.245 46.358-1.24 84.875 46.075 86.115 105.675v.047c.555 26.953-6.685 51.792-19.004 71.044l.047-.07z" />
        </svg>
      )
  }
}
