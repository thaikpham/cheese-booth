import {
  ArrowLeft,
  Camera,
  Check,
  Clock3,
  CodeXml,
  Copy,
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
  buildCombinedInstallScripts,
  fetchLatestReleaseStatus,
  INSTALL_SCRIPT_SNIPPETS,
  RELEASES_PAGE_URL,
  type LatestReleaseStatus,
} from '../lib/installScripts'
import { isTauriRuntime } from '../lib/runtime'
import { CapturePreview } from './capture/CapturePreview'

const COUNTDOWN_OPTIONS: CountdownSec[] = [3, 5, 10]
const CAPTURE_ROUTE = '/capture'
const COPY_ALL_SCRIPTS_ID = '__all__'

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
  const outputDirValue = isEditingOutputDir ? outputDirDraft : persistedOutputDir
  const desktopSaveEnabled = isTauriRuntime()
  const combinedInstallScripts = buildCombinedInstallScripts()
  const runtimeModeLabel = desktopSaveEnabled ? 'Desktop Tauri' : 'Browser Preview'
  const autoSaveSummary = !desktopSaveEnabled
    ? 'Chỉ hỗ trợ trên desktop'
    : settings.outputDir
      ? 'Đã sẵn sàng'
      : 'Chưa chọn thư mục'

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

  function renderRuntimeBanner() {
    if (desktopSaveEnabled) {
      return (
        <div className="sd-runtime-banner sd-runtime-banner--ready" role="status">
          <div>
            <h4>Đang mở app desktop Tauri</h4>
            <p>
              {settings.outputDir
                ? 'Auto-save local đang hoạt động. Ảnh và boomerang mới sẽ được ghi vào thư mục đã chọn sau mỗi lần chụp.'
                : 'Auto-save local đã khả dụng. Chỉ cần chọn thư mục lưu trong mục "Thư mục lưu" để bật ghi file sau mỗi lần chụp.'}
            </p>
          </div>
        </div>
      )
    }

    return (
      <div className="sd-runtime-banner sd-runtime-banner--warn" role="alert">
        <div>
          <h4>Bạn đang ở bản browser preview</h4>
          <p>
            Bản này chỉ để preview giao diện và camera. Auto-save local, chọn thư mục lưu, và kiểm tra kiosk thực tế chỉ hoạt động khi mở app desktop Tauri đã cài từ GitHub Releases.
          </p>
        </div>
        <a
          className="sd-runtime-link"
          href={RELEASES_PAGE_URL}
          target="_blank"
          rel="noreferrer"
        >
          Mở desktop release
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

            {renderRuntimeBanner()}

            <section className="sd-install-section" aria-label="Install scripts">
              <div className="sd-install-section-head">
                <div>
                  <p className="sd-install-kicker">Phân phối nội bộ</p>
                  <h3>Script cài đặt từ GitHub Releases</h3>
                </div>
                <div className="sd-install-section-actions">
                  <p className="sd-install-section-copy">
                    Sao chép đúng script cho từng máy kiosk để tải và cài bản desktop mới nhất.
                  </p>
                  <button
                    className={`sd-install-copy-btn sd-install-copy-btn--all ${copiedScriptId === COPY_ALL_SCRIPTS_ID ? 'copied' : ''}`}
                    type="button"
                    onClick={() => {
                      void handleCopyInstallScript(
                        COPY_ALL_SCRIPTS_ID,
                        combinedInstallScripts,
                      )
                    }}
                  >
                    {copiedScriptId === COPY_ALL_SCRIPTS_ID ? <Check size={15} /> : <Copy size={15} />}
                    {copiedScriptId === COPY_ALL_SCRIPTS_ID ? 'Đã sao chép' : 'Sao chép tất cả'}
                  </button>
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
                        <div>
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
                    data-tone={desktopSaveEnabled ? 'good' : 'warn'}
                  />
                  {runtimeModeLabel}
                </span>
              </div>
              <div className="sd-kv">
                <span className="sd-kv-label">Hướng</span>
                <span className="sd-kv-value">{orientationLabel} · {settings.rotationQuarter * 90}°</span>
              </div>
              <div className="sd-kv">
                <span className="sd-kv-label">Auto-save local</span>
                <span className="sd-kv-value">
                  <span
                    className="sd-status-dot"
                    data-tone={
                      !desktopSaveEnabled
                        ? 'warn'
                        : settings.outputDir
                          ? 'good'
                          : 'neutral'
                    }
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
                <span className="sd-kv-value">{settings.outputDir || 'Chưa cấu hình'}</span>
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

            {renderRuntimeBanner()}

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
              <div className="sd-field-hint warn">
                Bản browser chỉ hỗ trợ preview. Muốn lưu trực tiếp vào thư mục local, hãy mở ứng dụng desktop Tauri.
              </div>
            ) : null}

            <div className="sd-btn-row">
              <button
                className="sd-action-btn primary"
                type="button"
                onClick={commitOutputDirDraft}
                disabled={isBusy || !desktopSaveEnabled}
              >
                Lưu đường dẫn
              </button>
            </div>

            {settings.outputDir ? (
              <div className="sd-kv-grid sd-kv-grid--compact">
                <div className="sd-kv sd-kv--full">
                  <span className="sd-kv-label">Thư mục hiện tại</span>
                  <span className="sd-kv-value sd-kv-value--mono">{settings.outputDir}</span>
                </div>
              </div>
            ) : (
              <div className="sd-field-hint warn">
                Chưa cấu hình thư mục lưu. Ảnh sẽ không được auto-save.
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
          <div className="sd-rail-logo">PB</div>
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
