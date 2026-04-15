import { ArrowLeft } from 'lucide-react'
import { useState, type RefObject } from 'react'
import { Link } from 'react-router-dom'

import cheeseLogo from '../../cheese_icon_transparent.svg'
import {
  getCaptureRoute,
  getKioskPreviewAspect,
  getKioskProfileAspectLabel,
  getKioskProfileLabel,
} from '../lib/kioskProfiles'
import type {
  CaptureMode,
  CountdownSec,
  KioskProfile,
  OperatorSettings,
  PermissionState,
  SourceDescriptor,
  StreamState,
} from '../types'
import { APP_NAME, APP_SUBTITLE } from '../lib/branding'
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
  getPermissionSummary,
  getStreamSummary,
  type SectionId,
} from './settings-dashboard/settingsDashboardUtils'

interface SettingsDashboardProps {
  profile: KioskProfile
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
  onRetryPermission: () => void
  onRefreshSources: () => void
}

export function SettingsDashboard({
  profile,
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
  onRetryPermission,
  onRefreshSources,
}: SettingsDashboardProps) {
  const [activeSection, setActiveSection] = useState<SectionId>('overview')

  const isPortrait = profile === 'portrait'
  const previewAspect = getKioskPreviewAspect(profile)
  const profileAspectLabel = getKioskProfileAspectLabel(profile)
  const captureModeLabel = settings.captureMode === 'photo' ? 'Photo' : 'Boomerang'
  const currentSourceLabel =
    sources.find((source) => source.deviceId === settings.deviceId)?.label ?? 'Chưa chọn'
  const permissionSummary = getPermissionSummary(permissionState)
  const streamSummary = getStreamSummary(streamState)
  const orientationLabel = getKioskProfileLabel(profile)
  const runtime = getRuntimeEnvironment()

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
            profileAspectLabel={profileAspectLabel}
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
            orientationLabel={orientationLabel}
            runtime={runtime}
          />
        )

      case 'transform':
        return (
          <SettingsDashboardTransformPanel
            profile={profile}
            settings={settings}
            orientationLabel={orientationLabel}
            isBusy={isBusy}
            onRotate={onRotate}
            onFlipHorizontal={onFlipHorizontal}
            onFlipVertical={onFlipVertical}
          />
        )

      case 'download':
        return <SettingsDashboardDownloadPanel />
    }
  }

  return (
    <section className={`settings-dashboard settings-dashboard--${profile}`}>
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

      {isPortrait ? (
        <div className="sd-portrait-stack">
          <SettingsDashboardPreview
            settings={settings}
            sources={sources}
            permissionState={permissionState}
            streamState={streamState}
            lastError={lastError}
            previewFrameRef={previewFrameRef}
            previewCanvasRef={previewCanvasRef}
            previewAspect={previewAspect}
            profile={profile}
            isPortrait={isPortrait}
            currentSourceLabel={currentSourceLabel}
            streamSummary={streamSummary}
            captureModeLabel={captureModeLabel}
            onRetryPermission={onRetryPermission}
            onRefreshSources={onRefreshSources}
          />

          <main className="sd-controls sd-controls--portrait">
            {renderContent()}
          </main>
        </div>
      ) : (
        <>
          <main className="sd-controls">
            {renderContent()}
          </main>

          <SettingsDashboardPreview
            settings={settings}
            sources={sources}
            permissionState={permissionState}
            streamState={streamState}
            lastError={lastError}
            previewFrameRef={previewFrameRef}
            previewCanvasRef={previewCanvasRef}
            previewAspect={previewAspect}
            profile={profile}
            isPortrait={isPortrait}
            currentSourceLabel={currentSourceLabel}
            streamSummary={streamSummary}
            captureModeLabel={captureModeLabel}
            onRetryPermission={onRetryPermission}
            onRefreshSources={onRefreshSources}
          />
        </>
      )}

      <Link
        className="sd-floating-back"
        to={getCaptureRoute(profile)}
        title="Quay lại chụp"
      >
        <ArrowLeft size={24} />
      </Link>
    </section>
  )
}
