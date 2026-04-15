import { useEffect, useState } from 'react'
import type { CSSProperties, RefObject } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import cheeseLogo from '../../cheese_icon_transparent.svg'

import {
  getCaptureRoute,
  getKioskPreviewAspect,
  getSettingsRoute,
} from '../lib/kioskProfiles'
import type {
  BrowserCaptureSessionState,
  BoomerangRecordingIndicator,
  CaptureOutcome,
  KioskProfile,
  OperatorSettings,
  PermissionState,
  SourceDescriptor,
  StreamState,
} from '../types'
import { APP_NAME } from '../lib/branding'
import { resolveBrowserDeviceKind } from '../lib/browserDevice'
import { BrowserSessionFilmStripRail } from './capture/BrowserSessionFilmStripRail'
import { BrowserSessionOverlay } from './capture/BrowserSessionOverlay'
import { CapturePreview } from './capture/CapturePreview'
import { CapturePreviewTelemetry } from './capture/CapturePreviewTelemetry'
import { CaptureSideRail } from './capture/CaptureSideRail'

interface CaptureScreenProps {
  profile: KioskProfile
  settings: OperatorSettings
  sources: SourceDescriptor[]
  permissionState: PermissionState
  streamState: StreamState
  lastError: string | null
  isBusy: boolean
  countdownValue: number | null
  boomerangRecording: BoomerangRecordingIndicator | null
  captureOutcome: CaptureOutcome | null
  browserSession: BrowserCaptureSessionState
  previewFrameRef: RefObject<HTMLDivElement | null>
  previewCanvasRef: RefObject<HTMLCanvasElement | null>
  onRetryPermission: () => void
  onRefreshSources: () => void
  onShutter: () => void
  onStartBrowserSession: () => void
  onFinalizeBrowserSession: () => void
  onRetryBrowserSessionShare: () => void
  onCancelBrowserSession: () => void
  onResetBrowserSession: () => void
  onModeChange: (mode: OperatorSettings['captureMode']) => void
  onCountdownChange: (countdownSec: OperatorSettings['countdownSec']) => void
  onSetRotationQuarter: (
    rotationQuarter: OperatorSettings['rotationQuarter'],
  ) => void
  onFlipHorizontal: () => void
  onFlipVertical: () => void
  onApproveCaptureOutcome: () => void
  onRejectCaptureOutcome: () => void
}

type UiDensity = 'roomy' | 'compact' | 'dense'
type BrowserDeviceKind = 'desktop' | 'mobile'

export function CaptureScreen({
  profile,
  settings,
  sources,
  permissionState,
  streamState,
  lastError,
  isBusy,
  countdownValue,
  boomerangRecording,
  captureOutcome,
  browserSession,
  previewFrameRef,
  previewCanvasRef,
  onRetryPermission,
  onRefreshSources,
  onShutter,
  onStartBrowserSession,
  onFinalizeBrowserSession,
  onRetryBrowserSessionShare,
  onCancelBrowserSession,
  onResetBrowserSession,
  onModeChange,
  onCountdownChange,
  onSetRotationQuarter,
  onFlipHorizontal,
  onFlipVertical,
  onApproveCaptureOutcome,
  onRejectCaptureOutcome,
}: CaptureScreenProps) {
  const navigate = useNavigate()
  const [uiDensity, setUiDensity] = useState<UiDensity>('roomy')
  const [deviceKind, setDeviceKind] = useState<BrowserDeviceKind>('desktop')

  const layout = profile
  const isPortrait = profile === 'portrait'
  const previewAspect = getKioskPreviewAspect(profile)
  const captureModeLabel =
    settings.captureMode === 'photo' ? 'Photo' : 'Boomerang'
  const sourceUnavailable = streamState === 'missing-device' || sources.length === 0
  const sessionShutterLocked =
    browserSession.status !== 'active' ||
    browserSession.items.length >= browserSession.maxItems
  const shutterDisabled =
    isBusy ||
    permissionState !== 'granted' ||
    streamState !== 'live' ||
    sessionShutterLocked
  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const updateViewportContext = () => {
      setUiDensity(resolveUiDensity(layout, window.innerWidth, window.innerHeight))
      setDeviceKind(resolveBrowserDeviceKind(window, navigator))
    }

    updateViewportContext()
    window.addEventListener('resize', updateViewportContext)

    return () => {
      window.removeEventListener('resize', updateViewportContext)
    }
  }, [layout])

  const handleOrientationToggle = () => {
    const newProfile: KioskProfile = profile === 'portrait' ? 'landscape' : 'portrait'
    navigate(getCaptureRoute(newProfile))
  }

  const header = (
    <header className="capture-shell-header">
      <Link to="/" className="capture-brand-link">
        <span className="capture-brand-mark">
          <img
            src={cheeseLogo}
            alt=""
            className="capture-brand-logo"
            width={28}
            height={22}
          />
        </span>
        <span className="capture-brand-stack">
          <span className="capture-brand-name">{APP_NAME}</span>
          <span className="capture-brand-note">Capture Console</span>
        </span>
      </Link>
    </header>
  )

  const stage = (
    <div className="capture-stage">
      <div
        className={`capture-stage-wrapper capture-stage-wrapper--${layout}`}
        style={{ '--aspect-ratio': isPortrait ? 3 / 4 : 4 / 3 } as CSSProperties}
      >
        <div className="capture-stage-meta">
          <CapturePreviewTelemetry
            profile={profile}
            settings={settings}
            disabled={isBusy || countdownValue !== null}
            onModeChange={onModeChange}
            onCountdownChange={onCountdownChange}
            onSetRotationQuarter={onSetRotationQuarter}
            onFlipHorizontal={onFlipHorizontal}
            onFlipVertical={onFlipVertical}
            onToggleOrientation={handleOrientationToggle}
          />
        </div>

        <CapturePreview
          previewAspect={previewAspect}
          previewFrameRef={previewFrameRef}
          previewCanvasRef={previewCanvasRef}
          permissionState={permissionState}
          streamState={streamState}
          sourceUnavailable={sourceUnavailable}
          lastError={lastError}
          countdownValue={countdownValue}
          boomerangRecording={boomerangRecording}
          onRetryPermission={onRetryPermission}
          onRefreshSources={onRefreshSources}
        />
      </div>
    </div>
  )

  const portraitTelemetry = (
    <div className="capture-stage-meta capture-stage-meta--portrait">
      <CapturePreviewTelemetry
        profile={profile}
        settings={settings}
        disabled={isBusy || countdownValue !== null}
        onModeChange={onModeChange}
        onCountdownChange={onCountdownChange}
        onSetRotationQuarter={onSetRotationQuarter}
        onFlipHorizontal={onFlipHorizontal}
        onFlipVertical={onFlipVertical}
        onToggleOrientation={handleOrientationToggle}
      />
    </div>
  )

  const portraitStage = (
    <div className="capture-stage capture-stage--portrait">
      <div
        className="capture-stage-wrapper capture-stage-wrapper--portrait-only"
        style={{ '--aspect-ratio': 3 / 4 } as CSSProperties}
      >
        <CapturePreview
          previewAspect={previewAspect}
          previewFrameRef={previewFrameRef}
          previewCanvasRef={previewCanvasRef}
          permissionState={permissionState}
          streamState={streamState}
          sourceUnavailable={sourceUnavailable}
          lastError={lastError}
          countdownValue={countdownValue}
          boomerangRecording={boomerangRecording}
          onRetryPermission={onRetryPermission}
          onRefreshSources={onRefreshSources}
        />
      </div>
    </div>
  )

  const controlDock = (
    <CaptureSideRail
      layout={layout}
      uiDensity={uiDensity}
      captureModeLabel={captureModeLabel}
      browserSession={browserSession}
      shutterDisabled={shutterDisabled}
      onOpenSettings={() => navigate(getSettingsRoute(profile))}
      onShutter={onShutter}
      onStartBrowserSession={onStartBrowserSession}
      onFinalizeBrowserSession={onFinalizeBrowserSession}
      onRetryBrowserSessionShare={onRetryBrowserSessionShare}
      onCancelBrowserSession={onCancelBrowserSession}
      onResetBrowserSession={onResetBrowserSession}
    />
  )

  const sessionTray = (
    <BrowserSessionFilmStripRail
      session={browserSession}
      layout={layout}
      uiDensity={uiDensity}
    />
  )

  return (
    <section className="capture-screen capture-screen--enterprise">
      <div
        className={[
          'capture-panel',
          'capture-panel--enterprise',
          `capture-panel--${layout}`,
        ].join(' ')}
      >
        {profile === 'portrait' ? (
          <div
            className={`capture-shell capture-shell--portrait is-${uiDensity} device-${deviceKind}`}
            data-device={deviceKind}
          >
            {header}
            {portraitTelemetry}
            {portraitStage}
            {controlDock}
            {sessionTray}
          </div>
        ) : (
          <div
            className={`capture-shell capture-shell--landscape is-${uiDensity} device-${deviceKind}`}
            data-device={deviceKind}
          >
            {stage}
            <div className="capture-support-region capture-support-region--landscape">
              {header}
              {sessionTray}
              {controlDock}
            </div>
          </div>
        )}
      </div>

      <BrowserSessionOverlay
        session={browserSession}
        outcome={captureOutcome}
        onApproveOutcome={onApproveCaptureOutcome}
        onRejectOutcome={onRejectCaptureOutcome}
        onRetrySessionShare={onRetryBrowserSessionShare}
        onResetBrowserSession={onResetBrowserSession}
      />
    </section>
  )
}

function resolveUiDensity(
  layout: KioskProfile,
  viewportWidth: number,
  viewportHeight: number,
): UiDensity {
  if (layout === 'portrait') {
    if (viewportHeight < 760 || viewportWidth < 420) {
      return 'dense'
    }

    if (
      viewportHeight < 980 ||
      viewportWidth < 560 ||
      viewportHeight / viewportWidth > 2.18
    ) {
      return 'compact'
    }

    return 'roomy'
  }

  if (viewportHeight < 560 || viewportWidth < 900) {
    return 'dense'
  }

  if (viewportHeight < 760 || viewportWidth < 1180) {
    return 'compact'
  }

  return 'roomy'
}
