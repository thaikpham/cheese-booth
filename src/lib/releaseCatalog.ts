export const REPO_OWNER = 'thaikpham'
export const REPO_NAME = 'colorlabv2-photokiosk'
export const LATEST_RELEASE_API_URL =
  `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/latest`
export const RELEASES_PAGE_URL =
  `https://github.com/${REPO_OWNER}/${REPO_NAME}/releases`

export type ReleaseCatalogState = 'ready' | 'missing' | 'error'
export type PlatformFamily = 'macos' | 'windows' | 'linux'
export type DownloadGroupId = 'macos' | 'windows' | 'linux-deb' | 'linux-rpm'
export type ClientPlatformId = PlatformFamily | 'unknown'
export type PackageKind = 'dmg' | 'msi' | 'deb' | 'rpm'
export type AssetAvailability = 'ready' | 'missing'

interface ReleaseApiAsset {
  name?: string
  browser_download_url?: string
}

interface ReleaseApiPayload {
  tag_name?: string
  html_url?: string
  assets?: ReleaseApiAsset[]
}

interface DownloadGroupSpec {
  id: DownloadGroupId
  family: PlatformFamily
  platformLabel: string
  heroLabel: string
  summary: string
  installHint: string
  warning?: string
  sectionId: string
}

interface ReleaseAssetSpec {
  id: string
  groupId: DownloadGroupId
  label: string
  shortLabel: string
  architecture: string
  packageKind: PackageKind
  fileExtension: string
  pattern: string
}

export interface ReleaseAsset {
  id: string
  groupId: DownloadGroupId
  family: PlatformFamily
  label: string
  shortLabel: string
  architecture: string
  packageKind: PackageKind
  fileExtension: string
  status: AssetAvailability
  fileName?: string
  browserDownloadUrl?: string
}

export interface PlatformDownloadGroup {
  id: DownloadGroupId
  family: PlatformFamily
  platformLabel: string
  heroLabel: string
  summary: string
  installHint: string
  warning?: string
  sectionId: string
  isAvailable: boolean
  missingVariants: string[]
  variants: ReleaseAsset[]
}

export interface LatestReleaseCatalog {
  state: ReleaseCatalogState
  tagName?: string
  htmlUrl?: string
  groups: PlatformDownloadGroup[]
}

export interface ReleaseStatusDescriptor {
  tone: 'ready' | 'warn' | 'neutral'
  title: string
  message: string
}

export const RELEASE_ASSET_PATTERNS = {
  macosArm64Dmg: `${REPO_NAME}-(darwin|macos).*(aarch64|arm64).*\\.dmg$`,
  macosX64Dmg: `${REPO_NAME}-(darwin|macos).*(x64|x86_64).*\\.dmg$`,
  windowsX64Msi: `${REPO_NAME}-windows.*(x64|x86_64).*\\.msi$`,
  windowsArm64Msi: `${REPO_NAME}-windows.*(arm64|aarch64).*\\.msi$`,
  linuxDeb: `${REPO_NAME}-linux.*(amd64|x86_64|x64).*\\.deb$`,
  linuxRpm: `${REPO_NAME}-linux.*(amd64|x86_64|x64).*\\.rpm$`,
} as const

const DOWNLOAD_GROUP_SPECS: DownloadGroupSpec[] = [
  {
    id: 'macos',
    family: 'macos',
    platformLabel: 'macOS',
    heroLabel: 'Tải xuống cho macOS',
    summary:
      'Bản desktop cho Mac với hai lựa chọn Apple Silicon và Intel, phát hành trực tiếp từ GitHub Releases.',
    installHint: 'Mở file .dmg rồi kéo Cheese Booth vào thư mục Applications.',
    warning:
      'Nếu bản phát hành chưa notarize, macOS có thể yêu cầu Open Anyway hoặc chuột phải > Open lần đầu.',
    sectionId: 'download-macos',
  },
  {
    id: 'windows',
    family: 'windows',
    platformLabel: 'Windows 11',
    heroLabel: 'Tải xuống cho Windows',
    summary:
      'Installer MSI cho Windows x64 và ARM64, phù hợp với flow cài đặt tiêu chuẩn của hệ điều hành.',
    installHint: 'Chạy file .msi và chấp nhận hộp thoại UAC nếu Windows yêu cầu.',
    warning:
      'Nếu installer chưa ký số, Windows SmartScreen có thể hiển thị cảnh báo trước khi cho phép mở.',
    sectionId: 'download-windows',
  },
  {
    id: 'linux-deb',
    family: 'linux',
    platformLabel: 'Ubuntu / Debian',
    heroLabel: 'Tải xuống cho Ubuntu/Debian',
    summary:
      'Gói .deb x64 để cài qua Software Center hoặc package manager trên Ubuntu và Debian.',
    installHint: 'Mở file .deb bằng Software Center hoặc cài trực tiếp qua package manager.',
    sectionId: 'download-linux-deb',
  },
  {
    id: 'linux-rpm',
    family: 'linux',
    platformLabel: 'Fedora / RHEL',
    heroLabel: 'Tải xuống cho Fedora/RHEL',
    summary:
      'Gói .rpm x64 để cài qua Software Center hoặc package manager trên Fedora và các distro tương thích.',
    installHint: 'Mở file .rpm bằng Software Center hoặc cài trực tiếp qua package manager.',
    sectionId: 'download-linux-rpm',
  },
]

const RELEASE_ASSET_SPECS: ReleaseAssetSpec[] = [
  {
    id: 'macos-arm64-dmg',
    groupId: 'macos',
    label: 'Apple Silicon (.dmg)',
    shortLabel: 'Apple Silicon',
    architecture: 'arm64',
    packageKind: 'dmg',
    fileExtension: '.dmg',
    pattern: RELEASE_ASSET_PATTERNS.macosArm64Dmg,
  },
  {
    id: 'macos-x64-dmg',
    groupId: 'macos',
    label: 'Intel (.dmg)',
    shortLabel: 'Intel',
    architecture: 'x64',
    packageKind: 'dmg',
    fileExtension: '.dmg',
    pattern: RELEASE_ASSET_PATTERNS.macosX64Dmg,
  },
  {
    id: 'windows-x64-msi',
    groupId: 'windows',
    label: 'Windows x64 (.msi)',
    shortLabel: 'Windows x64',
    architecture: 'x64',
    packageKind: 'msi',
    fileExtension: '.msi',
    pattern: RELEASE_ASSET_PATTERNS.windowsX64Msi,
  },
  {
    id: 'windows-arm64-msi',
    groupId: 'windows',
    label: 'Windows ARM64 (.msi)',
    shortLabel: 'Windows ARM64',
    architecture: 'arm64',
    packageKind: 'msi',
    fileExtension: '.msi',
    pattern: RELEASE_ASSET_PATTERNS.windowsArm64Msi,
  },
  {
    id: 'linux-deb-x64',
    groupId: 'linux-deb',
    label: 'Ubuntu/Debian x64 (.deb)',
    shortLabel: '.deb x64',
    architecture: 'x64',
    packageKind: 'deb',
    fileExtension: '.deb',
    pattern: RELEASE_ASSET_PATTERNS.linuxDeb,
  },
  {
    id: 'linux-rpm-x64',
    groupId: 'linux-rpm',
    label: 'Fedora/RHEL x64 (.rpm)',
    shortLabel: '.rpm x64',
    architecture: 'x64',
    packageKind: 'rpm',
    fileExtension: '.rpm',
    pattern: RELEASE_ASSET_PATTERNS.linuxRpm,
  },
]

function matchReleaseAsset(
  assets: ReleaseApiAsset[],
  assetSpec: ReleaseAssetSpec,
): ReleaseApiAsset | undefined {
  const matcher = new RegExp(assetSpec.pattern, 'i')

  return assets.find((asset) => {
    const url = asset.browser_download_url

    return typeof url === 'string' && matcher.test(url)
  })
}

function buildCatalog(
  state: ReleaseCatalogState,
  assets: ReleaseApiAsset[],
  tagName?: string,
  htmlUrl?: string,
): LatestReleaseCatalog {
  const groups = DOWNLOAD_GROUP_SPECS.map((groupSpec) => {
    const variants = RELEASE_ASSET_SPECS
      .filter((assetSpec) => assetSpec.groupId === groupSpec.id)
      .map<ReleaseAsset>((assetSpec) => {
        const matchedAsset = matchReleaseAsset(assets, assetSpec)

        if (!matchedAsset?.browser_download_url) {
          return {
            id: assetSpec.id,
            groupId: groupSpec.id,
            family: groupSpec.family,
            label: assetSpec.label,
            shortLabel: assetSpec.shortLabel,
            architecture: assetSpec.architecture,
            packageKind: assetSpec.packageKind,
            fileExtension: assetSpec.fileExtension,
            status: 'missing',
          }
        }

        return {
          id: assetSpec.id,
          groupId: groupSpec.id,
          family: groupSpec.family,
          label: assetSpec.label,
          shortLabel: assetSpec.shortLabel,
          architecture: assetSpec.architecture,
          packageKind: assetSpec.packageKind,
          fileExtension: assetSpec.fileExtension,
          status: 'ready',
          fileName: matchedAsset.name,
          browserDownloadUrl: matchedAsset.browser_download_url,
        }
      })

    return {
      ...groupSpec,
      isAvailable: variants.some((variant) => variant.status === 'ready'),
      missingVariants: variants
        .filter((variant) => variant.status === 'missing')
        .map((variant) => variant.shortLabel),
      variants,
    } satisfies PlatformDownloadGroup
  })

  return {
    state,
    tagName,
    htmlUrl: htmlUrl ?? RELEASES_PAGE_URL,
    groups,
  }
}

export async function fetchLatestReleaseCatalog(): Promise<LatestReleaseCatalog> {
  try {
    const response = await fetch(LATEST_RELEASE_API_URL, {
      headers: {
        Accept: 'application/vnd.github+json',
      },
    })

    if (response.ok) {
      const payload = (await response.json()) as ReleaseApiPayload

      return buildCatalog(
        'ready',
        payload.assets ?? [],
        payload.tag_name,
        payload.html_url ?? RELEASES_PAGE_URL,
      )
    }

    if (response.status === 404) {
      return buildCatalog('missing', [], undefined, RELEASES_PAGE_URL)
    }

    return buildCatalog('error', [], undefined, RELEASES_PAGE_URL)
  } catch {
    return buildCatalog('error', [], undefined, RELEASES_PAGE_URL)
  }
}

export function detectClientPlatform(): ClientPlatformId {
  if (typeof navigator === 'undefined') {
    return 'unknown'
  }

  const userAgentData = (
    navigator as Navigator & {
      userAgentData?: {
        platform?: string
      }
    }
  ).userAgentData

  const fingerprint = [
    userAgentData?.platform,
    navigator.platform,
    navigator.userAgent,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  if (fingerprint.includes('mac') || fingerprint.includes('darwin')) {
    return 'macos'
  }

  if (fingerprint.includes('win')) {
    return 'windows'
  }

  if (fingerprint.includes('linux') || fingerprint.includes('x11')) {
    return 'linux'
  }

  return 'unknown'
}

export function getReleaseStatusDescriptor(
  catalog: LatestReleaseCatalog | null,
): ReleaseStatusDescriptor {
  if (catalog === null) {
    return {
      tone: 'neutral',
      title: 'Đang kiểm tra latest release',
      message: 'Đang tải metadata installer mới nhất từ GitHub Releases...',
    }
  }

  if (catalog.state === 'missing') {
    return {
      tone: 'warn',
      title: 'Release chưa sẵn sàng',
      message:
        'Repo hiện chưa có latest release để người dùng tải installer trực tiếp. Hãy tạo tag phiên bản mới rồi đợi workflow release hoàn tất.',
    }
  }

  if (catalog.state === 'error') {
    return {
      tone: 'neutral',
      title: 'Không kiểm tra được release',
      message:
        'Không xác minh được latest release từ GitHub lúc này. Bạn vẫn có thể mở trang Releases để kiểm tra thủ công.',
    }
  }

  const fullyAvailableGroups = catalog.groups.filter((group) => group.isAvailable)

  if (fullyAvailableGroups.length === catalog.groups.length) {
    return {
      tone: 'ready',
      title: 'Latest release sẵn sàng',
      message: catalog.tagName
        ? `Có thể dùng ngay các link tải xuống bên dưới. Phiên bản mới nhất: ${catalog.tagName}.`
        : 'Có thể dùng ngay các link tải xuống bên dưới.',
    }
  }

  return {
    tone: 'warn',
    title: 'Latest release mới chỉ sẵn sàng một phần',
    message:
      'Một số installer chưa xuất hiện trong latest release. Các card thiếu asset sẽ được khóa để tránh tải nhầm.',
  }
}
