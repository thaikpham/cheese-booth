import type { RefObject } from 'react'

import type {
  OperatorSettings,
  PermissionState,
  SourceDescriptor,
  StreamState,
} from '../../types'
import { CapturePreview } from '../capture/CapturePreview'
import type { DashboardStatusSummary } from './settingsDashboardUtils'

interface SettingsDashboardPreviewProps {
  settings: OperatorSettings
  sources: SourceDescriptor[]
  permissionState: PermissionState
  streamState: StreamState
  lastError: string | null
  previewFrameRef: RefObject<HTMLDivElement | null>
  previewCanvasRef: RefObject<HTMLCanvasElement | null>
  previewAspect: string
  isPortrait: boolean
  currentSourceLabel: string
  streamSummary: DashboardStatusSummary
  captureModeLabel: string
  onRetryPermission: () => void
  onRefreshSources: () => void
}

export function SettingsDashboardPreview({
  settings,
  sources,
  permissionState,
  streamState,
  lastError,
  previewFrameRef,
  previewCanvasRef,
  previewAspect,
  isPortrait,
  currentSourceLabel,
  streamSummary,
  captureModeLabel,
  onRetryPermission,
  onRefreshSources,
}: SettingsDashboardPreviewProps) {
  return (
    <aside className="sd-preview">
      <div className="sd-preview-label">Live Preview</div>
      <div className="sd-preview-stage">
        <div className={`sd-preview-square ${isPortrait ? 'is-portrait' : 'is-landscape'}`}>
          <CapturePreview
            previewAspect={previewAspect}
            previewFrameRef={previewFrameRef}
            previewCanvasRef={previewCanvasRef}
            permissionState={permissionState}
            streamState={streamState}
            sourceUnavailable={streamState === 'missing-device' || sources.length === 0}
            lastError={lastError}
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
          <span className="sd-preview-meta-val">
            {settings.rotationQuarter * 90}° · H{settings.flipHorizontal ? '1' : '0'} V
            {settings.flipVertical ? '1' : '0'}
          </span>
        </div>
        <div className="sd-preview-meta-row">
          <span>Mode</span>
          <span className="sd-preview-meta-val">
            {captureModeLabel} · {settings.countdownSec}s
          </span>
        </div>
      </div>
    </aside>
  )
}
