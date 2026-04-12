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
const RELEASE_BASE_URL =
  `https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/latest/download`
const LATEST_RELEASE_API_URL =
  `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/latest`
export const RELEASES_PAGE_URL =
  `https://github.com/${REPO_OWNER}/${REPO_NAME}/releases`

function releaseAssetUrl(assetName: string): string {
  return `${RELEASE_BASE_URL}/${assetName}`
}

export const INSTALL_SCRIPT_SNIPPETS: InstallScriptSnippet[] = [
  {
    id: 'macos-apple-silicon',
    label: 'Sao chép script',
    platform: 'macOS Apple Silicon',
    summary: 'Tải bản DMG ARM64 mới nhất, cài vào Applications và mở app ngay.',
    script: String.raw`#!/usr/bin/env bash
set -euo pipefail

# ColorLab V2 Photo Kiosk — macOS Apple Silicon
ASSET="colorlabv2-photokiosk-macos-aarch64.dmg"
URL="${releaseAssetUrl('colorlabv2-photokiosk-macos-aarch64.dmg')}"
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
    summary: 'Tải bản DMG x86_64 mới nhất, cài vào Applications và mở app ngay.',
    script: String.raw`#!/usr/bin/env bash
set -euo pipefail

# ColorLab V2 Photo Kiosk — macOS Intel
ASSET="colorlabv2-photokiosk-macos-x86_64.dmg"
URL="${releaseAssetUrl('colorlabv2-photokiosk-macos-x86_64.dmg')}"
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
    summary: 'Tải bộ cài MSI x64 mới nhất và cài silent bằng quyền quản trị.',
    script: String.raw`# ColorLab V2 Photo Kiosk — Windows 11 x64
$ErrorActionPreference = "Stop"

$asset = "colorlabv2-photokiosk-windows-x86_64.msi"
$url = "${releaseAssetUrl('colorlabv2-photokiosk-windows-x86_64.msi')}"
$tempDir = Join-Path $env:TEMP "colorlabv2-photokiosk"
$installerPath = Join-Path $tempDir $asset

Write-Host "Đang tạo thư mục tạm..."
New-Item -ItemType Directory -Force -Path $tempDir | Out-Null

Write-Host "Đang tải bộ cài $asset..."
Invoke-WebRequest -Uri $url -OutFile $installerPath

Write-Host "Đang cài đặt ứng dụng..."
Start-Process -FilePath "msiexec.exe" -ArgumentList @("/i", $installerPath, "/qn", "/norestart") -Verb RunAs -Wait

Write-Host "Hoàn tất cài đặt."`,
  },
  {
    id: 'windows-arm64',
    label: 'Sao chép script',
    platform: 'Windows 11 ARM64',
    summary: 'Tải bộ cài MSI ARM64 mới nhất và cài silent bằng quyền quản trị.',
    script: String.raw`# ColorLab V2 Photo Kiosk — Windows 11 ARM64
$ErrorActionPreference = "Stop"

$asset = "colorlabv2-photokiosk-windows-aarch64.msi"
$url = "${releaseAssetUrl('colorlabv2-photokiosk-windows-aarch64.msi')}"
$tempDir = Join-Path $env:TEMP "colorlabv2-photokiosk"
$installerPath = Join-Path $tempDir $asset

Write-Host "Đang tạo thư mục tạm..."
New-Item -ItemType Directory -Force -Path $tempDir | Out-Null

Write-Host "Đang tải bộ cài $asset..."
Invoke-WebRequest -Uri $url -OutFile $installerPath

Write-Host "Đang cài đặt ứng dụng..."
Start-Process -FilePath "msiexec.exe" -ArgumentList @("/i", $installerPath, "/qn", "/norestart") -Verb RunAs -Wait

Write-Host "Hoàn tất cài đặt."`,
  },
  {
    id: 'ubuntu-x64',
    label: 'Sao chép script',
    platform: 'Ubuntu x64',
    summary: 'Tải gói DEB mới nhất và cài trực tiếp bằng apt trên máy kiosk Ubuntu.',
    script: String.raw`#!/usr/bin/env bash
set -euo pipefail

# ColorLab V2 Photo Kiosk — Ubuntu x64
ASSET="colorlabv2-photokiosk-linux-x86_64.deb"
URL="${releaseAssetUrl('colorlabv2-photokiosk-linux-x86_64.deb')}"
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
    summary: 'Tải gói RPM mới nhất và cài trực tiếp bằng dnf trên máy kiosk Fedora.',
    script: String.raw`#!/usr/bin/env bash
set -euo pipefail

# ColorLab V2 Photo Kiosk — Fedora x64
ASSET="colorlabv2-photokiosk-linux-x86_64.rpm"
URL="${releaseAssetUrl('colorlabv2-photokiosk-linux-x86_64.rpm')}"
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
