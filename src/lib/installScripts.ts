export interface InstallScriptSnippet {
  id: string
  label: string
  platform: string
  summary: string
  script: string
}

const RELEASE_BASE_URL =
  'https://github.com/thaikpham/colorlabv2-photokiosk/releases/latest/download'

function releaseAssetUrl(assetName: string): string {
  return `${RELEASE_BASE_URL}/${assetName}`
}

export const INSTALL_SCRIPT_SNIPPETS: InstallScriptSnippet[] = [
  {
    id: 'macos-apple-silicon',
    label: 'Copy Script',
    platform: 'macOS Apple Silicon',
    summary: 'Tai va cai ban .dmg moi nhat cho Mac ARM64 vao /Applications.',
    script: String.raw`#!/usr/bin/env bash
set -euo pipefail

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

curl -fL "$URL" -o "$TMP_DIR/$ASSET"
mkdir -p "$MOUNT_DIR"
hdiutil attach "$TMP_DIR/$ASSET" -mountpoint "$MOUNT_DIR" -nobrowse -quiet
sudo rm -rf "/Applications/$APP_NAME"
sudo ditto "$MOUNT_DIR/$APP_NAME" "/Applications/$APP_NAME"
xattr -dr com.apple.quarantine "/Applications/$APP_NAME" >/dev/null 2>&1 || true
open "/Applications/$APP_NAME"`,
  },
  {
    id: 'macos-intel',
    label: 'Copy Script',
    platform: 'macOS Intel',
    summary: 'Tai va cai ban .dmg moi nhat cho Mac x86_64 vao /Applications.',
    script: String.raw`#!/usr/bin/env bash
set -euo pipefail

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

curl -fL "$URL" -o "$TMP_DIR/$ASSET"
mkdir -p "$MOUNT_DIR"
hdiutil attach "$TMP_DIR/$ASSET" -mountpoint "$MOUNT_DIR" -nobrowse -quiet
sudo rm -rf "/Applications/$APP_NAME"
sudo ditto "$MOUNT_DIR/$APP_NAME" "/Applications/$APP_NAME"
xattr -dr com.apple.quarantine "/Applications/$APP_NAME" >/dev/null 2>&1 || true
open "/Applications/$APP_NAME"`,
  },
  {
    id: 'windows-x64',
    label: 'Copy Script',
    platform: 'Windows 11 x64',
    summary: 'Tai va chay silent installer moi nhat cho Windows x86_64.',
    script: String.raw`$ErrorActionPreference = "Stop"
$asset = "colorlabv2-photokiosk-windows-x86_64.exe"
$url = "${releaseAssetUrl('colorlabv2-photokiosk-windows-x86_64.exe')}"
$tempDir = Join-Path $env:TEMP "colorlabv2-photokiosk"
$installerPath = Join-Path $tempDir $asset

New-Item -ItemType Directory -Force -Path $tempDir | Out-Null
Invoke-WebRequest -Uri $url -OutFile $installerPath
Start-Process -FilePath $installerPath -ArgumentList "/S" -Verb RunAs -Wait`,
  },
  {
    id: 'windows-arm64',
    label: 'Copy Script',
    platform: 'Windows 11 ARM64',
    summary: 'Tai va chay silent installer moi nhat cho Windows ARM64.',
    script: String.raw`$ErrorActionPreference = "Stop"
$asset = "colorlabv2-photokiosk-windows-aarch64.exe"
$url = "${releaseAssetUrl('colorlabv2-photokiosk-windows-aarch64.exe')}"
$tempDir = Join-Path $env:TEMP "colorlabv2-photokiosk"
$installerPath = Join-Path $tempDir $asset

New-Item -ItemType Directory -Force -Path $tempDir | Out-Null
Invoke-WebRequest -Uri $url -OutFile $installerPath
Start-Process -FilePath $installerPath -ArgumentList "/S" -Verb RunAs -Wait`,
  },
  {
    id: 'ubuntu-x64',
    label: 'Copy Script',
    platform: 'Ubuntu x64',
    summary: 'Tai va cai goi .deb moi nhat tren Ubuntu kiosk.',
    script: String.raw`#!/usr/bin/env bash
set -euo pipefail

ASSET="colorlabv2-photokiosk-linux-x86_64.deb"
URL="${releaseAssetUrl('colorlabv2-photokiosk-linux-x86_64.deb')}"
TMP_DIR="$(mktemp -d)"
PACKAGE_PATH="$TMP_DIR/$ASSET"

trap 'rm -rf "$TMP_DIR"' EXIT

curl -fL "$URL" -o "$PACKAGE_PATH"
sudo apt-get update
sudo apt-get install -y "$PACKAGE_PATH"`,
  },
  {
    id: 'fedora-x64',
    label: 'Copy Script',
    platform: 'Fedora x64',
    summary: 'Tai va cai goi .rpm moi nhat tren Fedora kiosk.',
    script: String.raw`#!/usr/bin/env bash
set -euo pipefail

ASSET="colorlabv2-photokiosk-linux-x86_64.rpm"
URL="${releaseAssetUrl('colorlabv2-photokiosk-linux-x86_64.rpm')}"
TMP_DIR="$(mktemp -d)"
PACKAGE_PATH="$TMP_DIR/$ASSET"

trap 'rm -rf "$TMP_DIR"' EXIT

curl -fL "$URL" -o "$PACKAGE_PATH"
sudo dnf install -y "$PACKAGE_PATH"`,
  },
]
