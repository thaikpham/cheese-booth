import {
  ArrowLeft,
} from 'lucide-react'
import { useEffect, useRef, useState, type RefObject } from 'react'
import { Link } from 'react-router-dom'

import type {
  CaptureMode,
  CountdownSec,
  OperatorSettings,
  PermissionState,
  SourceDescriptor,
  StreamState,
} from '../types'
import cheeseLogo from '../../cheese_icon_transparent.svg'
import { useLatestReleaseCatalog } from '../hooks/useLatestReleaseCatalog'
import { APP_NAME, APP_SUBTITLE } from '../lib/branding'
import {
  detectClientPlatform,
  getReleaseStatusDescriptor,
} from '../lib/releaseCatalog'
import { getRuntimeEnvironment } from '../lib/runtime'
import {
  SettingsDashboardCameraPanel,
  SettingsDashboardCapturePanel,
  SettingsDashboardDownloadPanel,
  SettingsDashboardOutputPanel,
  SettingsDashboardOverviewPanel,
  SettingsDashboardTransformPanel,
} from './settings-dashboard/SettingsDashboardPanels'
import { SettingsDashboardNav } from './settings-dashboard/SettingsDashboardNav'
import { SettingsDashboardPreview } from './settings-dashboard/SettingsDashboardPreview'
import {
  copyTextToClipboard,
  getPermissionSummary,
  getStreamSummary,
  type SectionId,
  type DownloadTab,
} from './settings-dashboard/settingsDashboardUtils'

const CAPTURE_ROUTE = '/capture'

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
  onRetryPermission,
  onRefreshSources,
}: SettingsDashboardProps) {
  const [activeSection, setActiveSection] = useState<SectionId>('overview')
  const [downloadTab, setDownloadTab] = useState<DownloadTab>('end-user')
  const [copiedScriptId, setCopiedScriptId] = useState<string | null>(null)
  const copiedResetTimerRef = useRef<number | null>(null)
  const releaseCatalog = useLatestReleaseCatalog()

  useEffect(() => {
    return () => {
      if (copiedResetTimerRef.current !== null) {
        window.clearTimeout(copiedResetTimerRef.current)
      }
    }
  }, [])

  const isPortrait = settings.rotationQuarter % 2 === 1
  const previewAspect = isPortrait ? '3 / 4' : '4 / 3'
  const captureModeLabel = settings.captureMode === 'photo' ? 'Photo' : 'Boomerang'
  const currentSourceLabel =
    sources.find((s) => s.deviceId === settings.deviceId)?.label ?? 'Chưa chọn'
  const permissionSummary = getPermissionSummary(permissionState)
  const streamSummary = getStreamSummary(streamState)
  const orientationLabel = isPortrait ? 'Portrait' : 'Landscape'
  const runtime = getRuntimeEnvironment(settings.outputDir)
  const currentPlatform = detectClientPlatform()
  const releaseStatus = getReleaseStatusDescriptor(releaseCatalog)

  async function handleCopyInstallScript(
    scriptId: string,
    script: string,
  ): Promise<void> {
    try {
      await copyTextToClipboard(script)
      setCopiedScriptId(scriptId)

      if (copiedResetTimerRef.current !== null) {
        window.clearTimeout(copiedResetTimerRef.current)
      }

      copiedResetTimerRef.current = window.setTimeout(() => {
        setCopiedScriptId((current) => (current === scriptId ? null : current))
        copiedResetTimerRef.current = null
      }, 1600)
    } catch (error) {
      console.error('Không thể sao chép script cài đặt.', error)
    }
  }

  function renderContent() {
    switch (activeSection) {
      case 'overview':
        return (
          <SettingsDashboardOverviewPanel
            settings={settings}
            captureModeLabel={captureModeLabel}
            currentSourceLabel={currentSourceLabel}
            runtime={runtime}
            permissionSummary={permissionSummary}
            streamSummary={streamSummary}
            orientationLabel={orientationLabel}
            isBusy={isBusy}
            lastError={lastError}
          />
        )

      case 'capture':
        return (
          <SettingsDashboardCapturePanel
            settings={settings}
            captureModeLabel={captureModeLabel}
            isBusy={isBusy}
            onModeChange={onModeChange}
            onCountdownChange={onCountdownChange}
          />
        )

      case 'camera':
        return (
          <SettingsDashboardCameraPanel
            settings={settings}
            sources={sources}
            permissionState={permissionState}
            isBusy={isBusy}
            permissionSummary={permissionSummary}
            streamSummary={streamSummary}
            currentSourceLabel={currentSourceLabel}
            onDeviceChange={onDeviceChange}
            onRetryPermission={onRetryPermission}
            onRefreshSources={onRefreshSources}
          />
        )

      case 'output':
        return (
          <SettingsDashboardOutputPanel
            settings={settings}
            runtime={runtime}
            isBusy={isBusy}
            onPickOutputDir={onPickOutputDir}
          />
        )

      case 'transform':
        return (
          <SettingsDashboardTransformPanel
            settings={settings}
            orientationLabel={orientationLabel}
            isBusy={isBusy}
            onRotate={onRotate}
            onFlipHorizontal={onFlipHorizontal}
            onFlipVertical={onFlipVertical}
          />
        )

      case 'download':
        return (
          <SettingsDashboardDownloadPanel
            downloadTab={downloadTab}
            copiedScriptId={copiedScriptId}
            releaseCatalog={releaseCatalog}
            releaseStatus={releaseStatus}
            currentPlatform={currentPlatform}
            onToggleDownloadTab={() =>
              setDownloadTab((current) =>
                current === 'end-user' ? 'scripts' : 'end-user',
              )
            }
            onCopyInstallScript={(scriptId, script) => {
              void handleCopyInstallScript(scriptId, script)
            }}
          />
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

        <SettingsDashboardNav
          activeSection={activeSection}
          onSelectSection={setActiveSection}
        />
      </aside>

      {/* ── Controls panel ── */}
      <main className="sd-controls">
        {renderContent()}
      </main>

      {/* ── Always-visible preview ── */}
      <SettingsDashboardPreview
        settings={settings}
        sources={sources}
        permissionState={permissionState}
        streamState={streamState}
        lastError={lastError}
        previewFrameRef={previewFrameRef}
        previewCanvasRef={previewCanvasRef}
        previewAspect={previewAspect}
        isPortrait={isPortrait}
        currentSourceLabel={currentSourceLabel}
        streamSummary={streamSummary}
        captureModeLabel={captureModeLabel}
        onRetryPermission={onRetryPermission}
        onRefreshSources={onRefreshSources}
      />

      {/* ── Floating Back Button ── */}
      <Link className="sd-floating-back" to={CAPTURE_ROUTE} title="Quay lại chụp">
        <ArrowLeft size={24} />
      </Link>
    </section>
  )
}
