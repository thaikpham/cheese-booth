import { ArrowLeft, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'

import cheeseLogo from '../../cheese_icon_transparent.svg'
import { useLatestReleaseCatalog } from '../hooks/useLatestReleaseCatalog'
import {
  RELEASES_PAGE_URL,
  detectClientPlatform,
  getReleaseStatusDescriptor,
} from '../lib/releaseCatalog'
import { APP_NAME, APP_SUBTITLE } from '../lib/branding'
import { ReleaseDownloadCard } from './download/ReleaseDownloadCard'

const CURRENT_PLATFORM_COPY = {
  macos: 'macOS được nhận diện trên trình duyệt hiện tại.',
  windows: 'Windows được nhận diện trên trình duyệt hiện tại.',
  linux:
    'Linux được nhận diện trên trình duyệt hiện tại. Hãy chọn .deb cho Ubuntu/Debian hoặc .rpm cho Fedora/RHEL.',
  unknown: 'Không nhận diện được hệ điều hành hiện tại. Bạn vẫn có thể chọn thủ công đúng installer.',
} as const

export function DownloadPage() {
  const catalog = useLatestReleaseCatalog()
  const currentPlatform = detectClientPlatform()
  const releaseStatus = getReleaseStatusDescriptor(catalog)
  const groups = catalog?.groups ?? []

  function scrollToGroup(sectionId: string): void {
    document.getElementById(sectionId)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  return (
    <section className="download-page">
      <div className="download-page-shell">
        <header className="download-page-nav">
          <Link className="download-page-nav-brand" to="/capture">
            <img
              src={cheeseLogo}
              alt={APP_NAME}
              width={54}
              height={40}
            />
            <span>
              <strong>{APP_NAME}</strong>
              <small>{APP_SUBTITLE}</small>
            </span>
          </Link>

          <div className="download-page-nav-actions">
            <Link className="download-page-nav-link" to="/settings">
              <ArrowLeft size={16} />
              <span>Settings nội bộ</span>
            </Link>
            <a
              className="download-page-nav-link"
              href={RELEASES_PAGE_URL}
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink size={16} />
              <span>GitHub Releases</span>
            </a>
          </div>
        </header>

        <main className="download-page-content">
          <section className="download-hero">
            <p className="download-hero-kicker">Desktop distribution</p>
            <h1>Tải Cheese Booth như một ứng dụng desktop thực thụ</h1>
            <p className="download-hero-copy">
              Chọn đúng installer cho hệ điều hành của bạn. Tất cả file cài đặt
              được phát trực tiếp từ GitHub Releases mới nhất của dự án.
            </p>

            <div className={`download-hero-banner ${releaseStatus.tone}`}>
              <div>
                <h2>{releaseStatus.title}</h2>
                <p>{releaseStatus.message}</p>
              </div>
              <a
                className="download-hero-banner-link"
                href={catalog?.htmlUrl ?? RELEASES_PAGE_URL}
                target="_blank"
                rel="noreferrer"
              >
                Xem release
              </a>
            </div>

            <div className="download-hero-actions">
              {groups.map((group) => {
                const directVariant = group.variants.filter(
                  (variant) =>
                    variant.status === 'ready' && variant.browserDownloadUrl,
                )
                const hasSingleDirectAsset = directVariant.length === 1

                if (hasSingleDirectAsset && directVariant[0].browserDownloadUrl) {
                  return (
                    <a
                      key={group.id}
                      className={`download-hero-action ${group.family === currentPlatform ? 'highlighted' : ''}`}
                      href={directVariant[0].browserDownloadUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {group.heroLabel}
                    </a>
                  )
                }

                return (
                  <button
                    key={group.id}
                    className={`download-hero-action ${group.family === currentPlatform ? 'highlighted' : ''}`}
                    type="button"
                    onClick={() => scrollToGroup(group.sectionId)}
                    disabled={!group.isAvailable}
                  >
                    {group.heroLabel}
                  </button>
                )
              })}
            </div>

            <div className="download-hero-current-platform">
              <span className="download-hero-current-platform-label">
                Gợi ý cho máy hiện tại
              </span>
              <p>{CURRENT_PLATFORM_COPY[currentPlatform]}</p>
            </div>
          </section>

          <section className="download-groups" aria-label="Desktop installers">
            <div className="download-groups-head">
              <div>
                <p className="download-groups-kicker">Direct download</p>
                <h2>Chọn đúng installer theo hệ điều hành</h2>
              </div>
              <a
                className="download-groups-link"
                href={catalog?.htmlUrl ?? RELEASES_PAGE_URL}
                target="_blank"
                rel="noreferrer"
              >
                Xem tất cả installer trên GitHub Releases
              </a>
            </div>

            <div className="download-groups-grid">
              {groups.map((group) => (
                <ReleaseDownloadCard
                  key={group.id}
                  group={group}
                  highlighted={group.family === currentPlatform}
                />
              ))}
            </div>
          </section>
        </main>
      </div>
    </section>
  )
}
