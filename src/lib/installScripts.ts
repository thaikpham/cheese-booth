import {
  LATEST_RELEASE_API_URL,
  RELEASE_ASSET_PATTERNS,
} from './releaseCatalog'

export interface InstallScriptSnippet {
  id: string
  label: string
  platform: string
  summary: string
  script: string
}

function buildBashReleaseResolver(): string {
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
}`
}

function buildPowerShellReleaseResolver(): string {
  return String.raw`$latestReleaseApiUrl = "${LATEST_RELEASE_API_URL}"

function Resolve-Asset {
  param(
    [Parameter(Mandatory = $true)][string]$AssetPattern,
    [Parameter(Mandatory = $true)][string]$AssetDescription
  )

  $release = Invoke-RestMethod -Headers @{ Accept = "application/vnd.github+json" } -Uri $latestReleaseApiUrl
  $asset = $release.assets | Where-Object { $_.browser_download_url -match $AssetPattern } | Select-Object -First 1

  if (-not $asset) {
    throw "Không tìm thấy asset $AssetDescription trong latest release."
  }

  return $asset
}`
}

export const INSTALL_SCRIPT_SNIPPETS: InstallScriptSnippet[] = [
  {
    id: 'macos-universal',
    label: 'Sao chép script',
    platform: 'macOS',
    summary: 'Một script duy nhất cho macOS, tự nhận diện Apple Silicon hoặc Intel rồi tải đúng bản DMG mới nhất.',
    script: String.raw`#!/usr/bin/env bash
set -euo pipefail

# Cheese Booth — macOS Universal
${buildBashReleaseResolver()}
APP_NAME="Cheese Booth.app"
ARCH="$(uname -m)"

case "$ARCH" in
  arm64|aarch64)
    ASSET_PATTERN="${RELEASE_ASSET_PATTERNS.macosArm64Dmg}"
    ASSET_DESCRIPTION="DMG macOS Apple Silicon"
    ;;
  x86_64|amd64)
    ASSET_PATTERN="${RELEASE_ASSET_PATTERNS.macosX64Dmg}"
    ASSET_DESCRIPTION="DMG macOS Intel"
    ;;
  *)
    echo "Kiến trúc macOS chưa được hỗ trợ: $ARCH" >&2
    exit 1
    ;;
esac

URL="$(resolve_asset_url "$ASSET_PATTERN" "$ASSET_DESCRIPTION")"
ASSET="$(basename "$URL")"
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
    id: 'windows-universal',
    label: 'Sao chép script',
    platform: 'Windows 11',
    summary: 'Một script PowerShell duy nhất cho Windows, tự nhận diện x64 hoặc ARM64 rồi cài đúng bản MSI mới nhất.',
    script: String.raw`# Cheese Booth — Windows Universal
$ErrorActionPreference = "Stop"

${buildPowerShellReleaseResolver()}

$rawArch = if ($env:PROCESSOR_ARCHITEW6432) {
  $env:PROCESSOR_ARCHITEW6432
} else {
  $env:PROCESSOR_ARCHITECTURE
}

switch -Regex ($rawArch.ToUpperInvariant()) {
  "^(ARM64|AARCH64)$" {
    $assetPattern = "${RELEASE_ASSET_PATTERNS.windowsArm64Msi}"
    $assetDescription = "MSI Windows ARM64"
    break
  }
  "^(AMD64|X86_64)$" {
    $assetPattern = "${RELEASE_ASSET_PATTERNS.windowsX64Msi}"
    $assetDescription = "MSI Windows x64"
    break
  }
  default {
    throw "Kiến trúc Windows chưa được hỗ trợ: $rawArch"
  }
}

$asset = Resolve-Asset -AssetPattern $assetPattern -AssetDescription $assetDescription
$assetName = $asset.name
$url = $asset.browser_download_url
$tempDir = Join-Path $env:TEMP "cheese-booth"
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
    id: 'linux-universal',
    label: 'Sao chép script',
    platform: 'Linux',
    summary: 'Một script duy nhất cho Linux x64, tự nhận diện Ubuntu/Debian hoặc Fedora/RHEL rồi tải đúng gói `.deb` hoặc `.rpm`.',
    script: String.raw`#!/usr/bin/env bash
set -euo pipefail

# Cheese Booth — Linux Universal
${buildBashReleaseResolver()}
ARCH="$(uname -m)"

case "$ARCH" in
  x86_64|amd64)
    ;;
  *)
    echo "Hiện tại script Linux chỉ hỗ trợ x64. Kiến trúc đang dùng: $ARCH" >&2
    exit 1
    ;;
esac

if command -v apt-get >/dev/null 2>&1; then
  ASSET_PATTERN="${RELEASE_ASSET_PATTERNS.linuxDeb}"
  ASSET_DESCRIPTION="DEB Ubuntu/Debian x64"
  PACKAGE_EXT="deb"
elif command -v dnf >/dev/null 2>&1; then
  ASSET_PATTERN="${RELEASE_ASSET_PATTERNS.linuxRpm}"
  ASSET_DESCRIPTION="RPM Fedora/RHEL x64"
  PACKAGE_EXT="rpm"
else
  echo "Không nhận diện được package manager hỗ trợ. Script này hiện hỗ trợ apt-get và dnf." >&2
  exit 1
fi

URL="$(resolve_asset_url "$ASSET_PATTERN" "$ASSET_DESCRIPTION")"
ASSET="$(basename "$URL")"
TMP_DIR="$(mktemp -d)"
PACKAGE_PATH="$TMP_DIR/$ASSET"

trap 'rm -rf "$TMP_DIR"' EXIT

echo "Đang tải gói $ASSET..."
curl -fL "$URL" -o "$PACKAGE_PATH"

if [ "$PACKAGE_EXT" = "deb" ]; then
  echo "Đang cập nhật metadata gói..."
  sudo apt-get update
  echo "Đang cài đặt ứng dụng..."
  sudo apt-get install -y "$PACKAGE_PATH"
else
  echo "Đang cài đặt ứng dụng..."
  sudo dnf install -y "$PACKAGE_PATH"
fi

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
