import type { CaptureOutcome } from '../../types'

interface BrowserCaptureOutcomeFlowProps {
  outcome: CaptureOutcome
  onApproveShare: () => void
  onRejectOutcome: () => void
}

export function BrowserCaptureOutcomeFlow({
  outcome,
  onApproveShare,
  onRejectOutcome,
}: BrowserCaptureOutcomeFlowProps) {
  const isPhoto = outcome.kind === 'photo'
  const subject = isPhoto ? 'ảnh' : 'boomerang'
  const previewAspectRatio =
    outcome.width > 0 && outcome.height > 0
      ? `${outcome.width} / ${outcome.height}`
      : isPhoto
        ? '4 / 3'
        : '3 / 4'
  const previewMaxWidth =
    outcome.width > 0 && outcome.height > outcome.width
      ? 'min(100%, 560px)'
      : 'min(100%, 940px)'

  return (
    <div className="browser-capture-outcome-backdrop">
      <section
        className="browser-capture-outcome-shell"
        data-state="review"
        role="dialog"
        aria-modal="true"
        aria-labelledby="browser-capture-outcome-title"
        aria-describedby="browser-capture-outcome-description"
      >
        <div className="browser-capture-outcome-copy">
          <h2
            id="browser-capture-outcome-title"
            className="browser-capture-outcome-title"
          >
            Xem lại {subject} vừa chụp
          </h2>
          <p
            id="browser-capture-outcome-description"
            className="browser-capture-outcome-description"
          >
            Nếu ổn, bấm lấy ảnh để đưa QR sang cột bên trái. Kiosk sẽ quay về
            camera ngay để khách tiếp theo tiếp tục chụp.
          </p>
        </div>

        <div className="browser-capture-outcome-stage">
          <div className="browser-capture-outcome-preview-panel">
            <div className="browser-capture-outcome-preview-shell">
              <div
                className="browser-capture-outcome-preview-frame"
                style={{
                  aspectRatio: previewAspectRatio,
                  width: previewMaxWidth,
                }}
              >
                {isPhoto ? (
                  <img
                    src={outcome.previewUrl}
                    alt="Ảnh vừa chụp"
                    className="browser-capture-outcome-image"
                  />
                ) : (
                  <video
                    src={outcome.previewUrl}
                    className="browser-capture-outcome-video"
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                )}
              </div>
            </div>
          </div>

          <div className="browser-capture-outcome-actions">
            <button
              type="button"
              className="button secondary browser-capture-outcome-action"
              onClick={onRejectOutcome}
            >
              Không đẹp, chụp lại
            </button>
            <button
              type="button"
              className="button primary browser-capture-outcome-action browser-capture-outcome-action-primary"
              onClick={onApproveShare}
            >
              Đẹp, lấy ảnh
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
