export interface InstallScriptSnippet {
  id: string
  label: string
  platform: string
  summary: string
  script: string
}

export interface LatestReleaseStatus {
  state: 'ready' | 'missing' | 'error'
  tagName?: string
  htmlUrl?: string
}

const REPO_OWNER = 'thaikpham'
const REPO_NAME = 'colorlabv2-photokiosk'
const LATEST_RELEASE_API_URL =
  `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/latest`
export const RELEASES_PAGE_URL =
  `https://github.com/${REPO_OWNER}/${REPO_NAME}/releases`

function buildBashAssetResolver(pattern: string, description: string): string {
  return String.raw`LATEST_RELEASE_API_URL="${LATEST_RELEASE_API_URL}"

resolve_asset_url() {
  local pattern="$1"
  local description="$2"
  local release_payload
  local asset_url

  release_payload="$(curl -fsSL -H 'Accept: application/vnd.github+json' "$LATEST_RELEASE_API_URL")"
  asset_url="$(printf '%s' "$release_payload" \
    | grep -oE '"browser_download_url":"[^"]+"' \
    | sed -E 's/^"browser_download_url":"//; s/"$//; s#\\/#/#g' \
    | grep -E "$pattern" \
    | head -n 1)"

  if [ -z "$asset_url" ]; then
    echo "Không tìm thấy asset $description trong latest release." >&2
    exit 1
  fi

  printf '%s\n' "$asset_url"
}

URL="$(resolve_asset_url '${pattern}' '${description}')"
ASSET="$(basename "$URL")"`
}

function buildPowerShellAssetResolver(pattern: string, description: string): string {
  return String.raw`$latestReleaseApiUrl = "${LATEST_RELEASE_API_URL}"
$assetPattern = '${pattern}'
$assetDescription = "${description}"

$release = Invoke-RestMethod -Headers @{ Accept = "application/vnd.github+json" } -Uri $latestReleaseApiUrl
$asset = $release.assets | Where-Object { $_.browser_download_url -match $assetPattern } | Select-Object -First 1

if (-not $asset) {
  throw "Không tìm thấy asset $assetDescription trong latest release."
}

$assetName = $asset.name
$url = $asset.browser_download_url`
}

export const INSTALL_SCRIPT_SNIPPETS: InstallScriptSnippet[] = [
  {
    id: 'macos-apple-silicon',
    label: 'Sao chép script',
    platform: 'macOS Apple Silicon',
    summary: 'Tự tìm bản DMG Apple Silicon mới nhất, cài vào Applications và mở app ngay.',
    script: String.raw`#!/usr/bin/env bash
set -euo pipefail

# ColorLab V2 Photo Kiosk — macOS Apple Silicon
${buildBashAssetResolver('darwin.*(aarch64|arm64).*\\.dmg$', 'DMG macOS Apple Silicon')}
APP_NAME="Sony USB Webcam Kiosk.app"
TMP_DIR="$(mktemp -d)"
MOUNT_DIR="$TMP_DIR/mount"

cleanup() {
  hdiutil detach "$MOUNT_DIR" -quiet >/dev/null 2>&1 || true
  rm -rf "$TMP_DIR"
}

trap cleanup EXIT

echo "Đang tải bộ cài $ASSET..."
curl -fL "$URL" -o "$TMP_DIR/$ASSET"

echo "Đang mount bộ cài..."
mkdir -p "$MOUNT_DIR"
hdiutil attach "$TMP_DIR/$ASSET" -mountpoint "$MOUNT_DIR" -nobrowse -quiet

echo "Đang chép ứng dụng vào /Applications..."
sudo rm -rf "/Applications/$APP_NAME"
sudo ditto "$MOUNT_DIR/$APP_NAME" "/Applications/$APP_NAME"
xattr -dr com.apple.quarantine "/Applications/$APP_NAME" >/dev/null 2>&1 || true

echo "Hoàn tất. Đang mở ứng dụng..."
open "/Applications/$APP_NAME"`,
  },
  {
    id: 'macos-intel',
    label: 'Sao chép script',
    platform: 'macOS Intel',
    summary: 'Tự tìm bản DMG Intel mới nhất, cài vào Applications và mở app ngay.',
    script: String.raw`#!/usr/bin/env bash
set -euo pipefail

# ColorLab V2 Photo Kiosk — macOS Intel
${buildBashAssetResolver('darwin.*(x64|x86_64).*\\.dmg$', 'DMG macOS Intel')}
APP_NAME="Sony USB Webcam Kiosk.app"
TMP_DIR="$(mktemp -d)"
MOUNT_DIR="$TMP_DIR/mount"

cleanup() {
  hdiutil detach "$MOUNT_DIR" -quiet >/dev/null 2>&1 || true
  rm -rf "$TMP_DIR"
}

trap cleanup EXIT

echo "Đang tải bộ cài $ASSET..."
curl -fL "$URL" -o "$TMP_DIR/$ASSET"

echo "Đang mount bộ cài..."
mkdir -p "$MOUNT_DIR"
hdiutil attach "$TMP_DIR/$ASSET" -mountpoint "$MOUNT_DIR" -nobrowse -quiet

echo "Đang chép ứng dụng vào /Applications..."
sudo rm -rf "/Applications/$APP_NAME"
sudo ditto "$MOUNT_DIR/$APP_NAME" "/Applications/$APP_NAME"
xattr -dr com.apple.quarantine "/Applications/$APP_NAME" >/dev/null 2>&1 || true

echo "Hoàn tất. Đang mở ứng dụng..."
open "/Applications/$APP_NAME"`,
  },
  {
    id: 'windows-x64',
    label: 'Sao chép script',
    platform: 'Windows 11 x64',
    summary: 'Tự tìm bộ cài MSI x64 mới nhất và cài silent bằng quyền quản trị.',
    script: String.raw`# ColorLab V2 Photo Kiosk — Windows 11 x64
$ErrorActionPreference = "Stop"

${buildPowerShellAssetResolver('windows.*(x64|x86_64).*\\.msi$', 'MSI Windows x64')}
$tempDir = Join-Path $env:TEMP "colorlabv2-photokiosk"
$installerPath = Join-Path $tempDir $assetName

Write-Host "Đang tạo thư mục tạm..."
New-Item -ItemType Directory -Force -Path $tempDir | Out-Null

Write-Host "Đang tải bộ cài $assetName..."
Invoke-WebRequest -Uri $url -OutFile $installerPath

Write-Host "Đang cài đặt ứng dụng..."
Start-Process -FilePath "msiexec.exe" -ArgumentList @("/i", $installerPath, "/qn", "/norestart") -Verb RunAs -Wait

Write-Host "Hoàn tất cài đặt."`,
  },
  {
    id: 'windows-arm64',
    label: 'Sao chép script',
    platform: 'Windows 11 ARM64',
    summary: 'Tự tìm bộ cài MSI ARM64 mới nhất và cài silent bằng quyền quản trị.',
    script: String.raw`# ColorLab V2 Photo Kiosk — Windows 11 ARM64
$ErrorActionPreference = "Stop"

${buildPowerShellAssetResolver('windows.*(arm64|aarch64).*\\.msi$', 'MSI Windows ARM64')}
$tempDir = Join-Path $env:TEMP "colorlabv2-photokiosk"
$installerPath = Join-Path $tempDir $assetName

Write-Host "Đang tạo thư mục tạm..."
New-Item -ItemType Directory -Force -Path $tempDir | Out-Null

Write-Host "Đang tải bộ cài $assetName..."
Invoke-WebRequest -Uri $url -OutFile $installerPath

Write-Host "Đang cài đặt ứng dụng..."
Start-Process -FilePath "msiexec.exe" -ArgumentList @("/i", $installerPath, "/qn", "/norestart") -Verb RunAs -Wait

Write-Host "Hoàn tất cài đặt."`,
  },
  {
    id: 'ubuntu-x64',
    label: 'Sao chép script',
    platform: 'Ubuntu x64',
    summary: 'Tự tìm gói DEB x64 mới nhất và cài đặt bằng apt trên Ubuntu.',
    script: String.raw`#!/usr/bin/env bash
set -euo pipefail

# ColorLab V2 Photo Kiosk — Ubuntu x64
${buildBashAssetResolver('linux.*(amd64|x86_64|x64).*\\.deb$', 'DEB Ubuntu x64')}
TMP_DIR="$(mktemp -d)"
PACKAGE_PATH="$TMP_DIR/$ASSET"

trap 'rm -rf "$TMP_DIR"' EXIT

echo "Đang tải gói $ASSET..."
curl -fL "$URL" -o "$PACKAGE_PATH"

echo "Đang cập nhật metadata gói..."
sudo apt-get update

echo "Đang cài đặt ứng dụng..."
sudo apt-get install -y "$PACKAGE_PATH"

echo "Hoàn tất cài đặt."`,
  },
  {
    id: 'fedora-x64',
    label: 'Sao chép script',
    platform: 'Fedora x64',
    summary: 'Tự tìm gói RPM x64 mới nhất và cài đặt bằng dnf trên Fedora.',
    script: String.raw`#!/usr/bin/env bash
set -euo pipefail

# ColorLab V2 Photo Kiosk — Fedora x64
${buildBashAssetResolver('linux.*(amd64|x86_64|x64).*\\.rpm$', 'RPM Fedora x64')}
TMP_DIR="$(mktemp -d)"
PACKAGE_PATH="$TMP_DIR/$ASSET"

trap 'rm -rf "$TMP_DIR"' EXIT

echo "Đang tải gói $ASSET..."
curl -fL "$URL" -o "$PACKAGE_PATH"

echo "Đang cài đặt ứng dụng..."
sudo dnf install -y "$PACKAGE_PATH"

echo "Hoàn tất cài đặt."`,
  },
]

export function buildCombinedInstallScripts(
  snippets: InstallScriptSnippet[] = INSTALL_SCRIPT_SNIPPETS,
): string {
  return snippets
    .map((snippet) => [`### ${snippet.platform}`, snippet.script].join('\n\n'))
    .join('\n\n' + '='.repeat(72) + '\n\n')
}

export async function fetchLatestReleaseStatus(): Promise<LatestReleaseStatus> {
  try {
    const response = await fetch(LATEST_RELEASE_API_URL, {
      headers: {
        Accept: 'application/vnd.github+json',
      },
    })

    if (response.ok) {
      const payload = (await response.json()) as {
        tag_name?: string
        html_url?: string
      }

      return {
        state: 'ready',
        tagName: payload.tag_name,
        htmlUrl: payload.html_url ?? RELEASES_PAGE_URL,
      }
    }

    if (response.status === 404) {
      return { state: 'missing' }
    }

    return { state: 'error' }
  } catch {
    return { state: 'error' }
  }
}
