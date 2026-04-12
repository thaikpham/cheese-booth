import { Blend, Settings } from 'lucide-react'

interface CaptureSideRailProps {
  captureModeLabel: string
  shutterDisabled: boolean
  onOpenSettings: () => void
  onShutter: () => void
}

export function CaptureSideRail({
  captureModeLabel,
  shutterDisabled,
  onOpenSettings,
  onShutter,
}: CaptureSideRailProps) {
  return (
    <aside className="capture-side-rail" aria-label="Capture controls">
      <button
        className="capture-settings-button"
        type="button"
        onClick={onOpenSettings}
        aria-label="Mở cài đặt"
      >
        <Settings size={28} />
      </button>

      <div className="shutter-dock camera-shutter-dock">
        <button
          className="shutter-button"
          onClick={onShutter}
          disabled={shutterDisabled}
          aria-label={`Chụp ${captureModeLabel}`}
        >
          <span className="shutter-ring" />
          <span className="shutter-core" />
        </button>
      </div>

      <div className="capture-blend-slot">
        <button
          className="capture-blend-button"
          type="button"
          aria-label="Blending modes"
          disabled
        >
          <Blend size={28} />
        </button>
        <p className="capture-blend-tooltip" aria-hidden="true">
          blending for cheese booth coming soon
        </p>
      </div>
    </aside>
  )
}
