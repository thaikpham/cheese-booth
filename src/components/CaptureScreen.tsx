import type { RefObject } from 'react'
import { useNavigate } from 'react-router-dom'

import type {
  OperatorSettings,
  PermissionState,
  SourceDescriptor,
  StreamState,
} from '../types'
import { APP_NAME, APP_SUBTITLE } from '../lib/branding'
import { getRuntimeEnvironment } from '../lib/runtime'
import { CapturePreview } from './capture/CapturePreview'
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
  previewFrameRef: RefObject<HTMLDivElement | null>
  previewCanvasRef: RefObject<HTMLCanvasElement | null>
  onRetryPermission: () => void
  onRefreshSources: () => void
  onShutter: () => void
}

export function CaptureScreen({
  settings,
  sources,
  permissionState,
  streamState,
  lastError,
  isBusy,
  countdownValue,
  previewFrameRef,
  previewCanvasRef,
  onRetryPermission,
  onRefreshSources,
  onShutter,
}: CaptureScreenProps) {
  const navigate = useNavigate()
  const runtime = getRuntimeEnvironment(settings.outputDir)

  const isPortrait = settings.rotationQuarter % 2 === 1
  const previewAspect = isPortrait ? '3 / 4' : '4 / 3'
  const captureModeLabel =
    settings.captureMode === 'photo' ? 'Photo' : 'Boomerang'
  const settingsTelemetryLine = [
    captureModeLabel.toUpperCase(),
    `${settings.countdownSec}S`,
    isPortrait ? '3:4' : '4:3',
    `R${settings.rotationQuarter * 90}`,
    `H${settings.flipHorizontal ? '1' : '0'}`,
    `V${settings.flipVertical ? '1' : '0'}`,
    runtime.telemetryLabel,
    runtime.autoSaveReady ? 'SAVE' : 'NO-SAVE',
  ].join('  ·  ')
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
              <div className="capture-preview-meta" aria-hidden="true">
                <p className="capture-settings-marquee capture-preview-brand">
                  <span className="capture-preview-brand-name">
                    {APP_NAME.toUpperCase()}
                  </span>
                  <span className="capture-preview-brand-separator"> · </span>
                  <span className="capture-preview-brand-subtitle">
                    {APP_SUBTITLE.toUpperCase()}
                  </span>
                </p>
                <p className="capture-settings-marquee capture-preview-marquee">
                  {settingsTelemetryLine}
                </p>
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
    </section>
  )
}
