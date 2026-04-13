import type { RefObject } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import cheeseLogo from '../../cheese_icon_transparent.svg'

import type {
  BoomerangRecordingIndicator,
  CaptureOutcome,
  OperatorSettings,
  PermissionState,
  SourceDescriptor,
  StreamState,
} from '../types'
import { APP_NAME, APP_SUBTITLE } from '../lib/branding'
import { getRuntimeEnvironment } from '../lib/runtime'
import { CaptureOutcomeModal } from './capture/CaptureOutcomeModal'
import { CapturePreview } from './capture/CapturePreview'
import { CapturePreviewTelemetry } from './capture/CapturePreviewTelemetry'
import { CaptureSideRail } from './capture/CaptureSideRail'

const SETTINGS_ROUTE = '/settings'

interface CaptureScreenProps {
  settings: OperatorSettings
  sources: SourceDescriptor[]
  permissionState: PermissionState
  streamState: StreamState
  lastError: string | null
  isBusy: boolean
  countdownValue: number | null
  boomerangRecording: BoomerangRecordingIndicator | null
  captureOutcome: CaptureOutcome | null
  previewFrameRef: RefObject<HTMLDivElement | null>
  previewCanvasRef: RefObject<HTMLCanvasElement | null>
  onRetryPermission: () => void
  onRefreshSources: () => void
  onShutter: () => void
  onModeChange: (mode: OperatorSettings['captureMode']) => void
  onCountdownChange: (countdownSec: OperatorSettings['countdownSec']) => void
  onSetRotationQuarter: (
    rotationQuarter: OperatorSettings['rotationQuarter'],
  ) => void
  onFlipHorizontal: () => void
  onFlipVertical: () => void
  onDismissCaptureOutcome: () => void
  onRetryCaptureOutcomeShare: () => void
}

export function CaptureScreen({
  settings,
  sources,
  permissionState,
  streamState,
  lastError,
  isBusy,
  countdownValue,
  boomerangRecording,
  captureOutcome,
  previewFrameRef,
  previewCanvasRef,
  onRetryPermission,
  onRefreshSources,
  onShutter,
  onModeChange,
  onCountdownChange,
  onSetRotationQuarter,
  onFlipHorizontal,
  onFlipVertical,
  onDismissCaptureOutcome,
  onRetryCaptureOutcomeShare,
}: CaptureScreenProps) {
  const navigate = useNavigate()
  const runtime = getRuntimeEnvironment(settings.outputDir)

  const isPortrait = settings.rotationQuarter % 2 === 1
  const previewAspect = isPortrait ? '3 / 4' : '4 / 3'
  const captureModeLabel =
    settings.captureMode === 'photo' ? 'Photo' : 'Boomerang'
  const sourceUnavailable = streamState === 'missing-device' || sources.length === 0
  const shutterDisabled =
    isBusy ||
    !runtime.autoSaveReady ||
    permissionState !== 'granted' ||
    streamState !== 'live'

  return (
    <section className="capture-screen">
      <div className="capture-panel">
        <div className="capture-layout">
          <div className="capture-preview-column">
            <div
              className="capture-preview-wrapper"
              style={{ '--aspect-ratio': isPortrait ? 3 / 4 : 4 / 3 } as React.CSSProperties}
            >
              <div className="capture-preview-meta">
                <div className="capture-settings-marquee capture-preview-brand">
                  <Link to="/" className="capture-preview-brand-link">
                    <img 
                      src={cheeseLogo} 
                      alt="" 
                      className="capture-preview-brand-logo" 
                      width={24} 
                      height={18} 
                    />
                    <span className="capture-preview-brand-name">
                      {APP_NAME.toUpperCase()}
                    </span>
                    <span className="capture-preview-brand-separator"> · </span>
                    <span className="capture-preview-brand-subtitle">
                      {APP_SUBTITLE.toUpperCase()}
                    </span>
                  </Link>
                </div>
                <CapturePreviewTelemetry
                  settings={settings}
                  runtimeTelemetryLabel={runtime.telemetryLabel}
                  autoSaveReady={runtime.autoSaveReady}
                  disabled={isBusy || countdownValue !== null}
                  onModeChange={onModeChange}
                  onCountdownChange={onCountdownChange}
                  onSetRotationQuarter={onSetRotationQuarter}
                  onFlipHorizontal={onFlipHorizontal}
                  onFlipVertical={onFlipVertical}
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

          <CaptureSideRail
            captureModeLabel={captureModeLabel}
            shutterDisabled={shutterDisabled}
            onOpenSettings={() => navigate(SETTINGS_ROUTE)}
            onShutter={onShutter}
          />
        </div>
      </div>

      {captureOutcome ? (
        <CaptureOutcomeModal
          outcome={captureOutcome}
          onClose={onDismissCaptureOutcome}
          onRetryShare={onRetryCaptureOutcomeShare}
        />
      ) : null}
    </section>
  )
}
