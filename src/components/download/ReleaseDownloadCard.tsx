import { AlertTriangle, CheckCircle2, Download, ExternalLink } from 'lucide-react'

import type { PlatformDownloadGroup } from '../../lib/releaseCatalog'
import { PlatformIcon } from './PlatformIcon'

interface ReleaseDownloadCardProps {
  group: PlatformDownloadGroup
  highlighted?: boolean
  compact?: boolean
}

export function ReleaseDownloadCard({
  group,
  highlighted = false,
  compact = false,
}: ReleaseDownloadCardProps) {
  const missingVariantSummary =
    group.missingVariants.length > 0
      ? `Thiếu bản ${group.missingVariants.join(', ')} trong latest release hiện tại.`
      : null

  return (
    <article
      id={group.sectionId}
      className={[
        'release-download-card',
        compact ? 'compact' : '',
        highlighted ? 'highlighted' : '',
        group.isAvailable ? '' : 'disabled',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="release-download-card-head">
        <div className="release-download-card-title">
          <span className="release-download-card-icon" aria-hidden="true">
            <PlatformIcon platform={group.id} />
          </span>
          <div>
            <h3>{group.platformLabel}</h3>
            <p>{group.summary}</p>
          </div>
        </div>

        {highlighted ? (
          <span className="release-download-card-badge">Thiết bị hiện tại</span>
        ) : null}
      </div>

      <p className="release-download-card-hint">{group.installHint}</p>

      {group.warning ? (
        <div className="release-download-card-note warn">
          <AlertTriangle size={16} />
          <span>{group.warning}</span>
        </div>
      ) : null}

      {missingVariantSummary ? (
        <div className="release-download-card-note neutral">
          <ExternalLink size={16} />
          <span>{missingVariantSummary}</span>
        </div>
      ) : null}

      {!group.isAvailable ? (
        <div className="release-download-card-note disabled">
          <AlertTriangle size={16} />
          <span>Latest release hiện chưa có installer này. Card được khóa để tránh tải nhầm.</span>
        </div>
      ) : null}

      <div className="release-download-card-variants">
        {group.variants.map((variant) =>
          variant.status === 'ready' && variant.browserDownloadUrl ? (
            <a
              key={variant.id}
              className="release-download-variant ready"
              href={variant.browserDownloadUrl}
              target="_blank"
              rel="noreferrer"
            >
              <span>{variant.label}</span>
              <Download size={16} />
            </a>
          ) : (
            <span
              key={variant.id}
              className="release-download-variant missing"
              aria-disabled="true"
            >
              <span>{variant.label}</span>
              <span>Chưa sẵn sàng</span>
            </span>
          ),
        )}
      </div>

      {group.isAvailable ? (
        <div className="release-download-card-foot">
          <span className="release-download-card-foot-status">
            <CheckCircle2 size={16} />
            Direct download từ GitHub Releases
          </span>
        </div>
      ) : null}
    </article>
  )
}
