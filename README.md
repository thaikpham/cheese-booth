# Cheese Booth

project of colorlabv2

Desktop photobooth kiosk built with React, Vite, and Tauri.

## Development

Requirements:

- Node.js 20+
- Rust stable
- Tauri system dependencies for your OS

Install dependencies:

```bash
npm ci
```

Run the web UI only:

```bash
npm run dev
```

Run the desktop app:

```bash
npm run tauri:dev
```

Create a local production build:

```bash
npm run tauri:build
```

## GitHub Releases

This repository is configured to publish desktop builds through GitHub Actions when a version tag is pushed.

Release flow:

1. Update the app version in `package.json`.
2. Commit the change to `main`.
3. Create a tag like `v0.1.0`.
4. Push `main` and the tag to GitHub.
5. GitHub Actions creates a draft release and uploads the desktop installers/bundles.

Example:

```bash
git add .
git commit -m "release: v0.1.0"
git push origin main
git tag v0.1.0
git push origin v0.1.0
```

The workflow file lives at `.github/workflows/release.yml`.

Internal distribution now uses one installer script per OS:

- `macOS`: auto-detects Apple Silicon or Intel and installs the matching `.dmg`
- `Windows 11`: auto-detects x64 or ARM64 and installs the matching `.msi`
- `Linux`: auto-detects `apt-get` or `dnf` on supported x64 distributions and installs the matching `.deb` or `.rpm`

### Release Checklist For `v0.1.4`

1. Verify the release version is aligned in:
   - `package.json`
   - `package-lock.json`
   - `src-tauri/Cargo.toml`
   - `src-tauri/Cargo.lock`
2. Verify installer script patterns still match the workflow asset naming:
   - Workflow asset pattern: `colorlabv2-photokiosk-[platform]-[arch][ext]`
   - Installer snippets source: `src/lib/installScripts.ts`
3. Run validation before tagging:

```bash
npm run lint
npm run build
```

4. Review the working tree:

```bash
git status --short
```

5. Commit the release prep:

```bash
git add package.json package-lock.json src-tauri/Cargo.toml src-tauri/Cargo.lock src/lib/installScripts.ts src/components/CaptureScreen.tsx src/components/SettingsDashboard.tsx src/styles/capture.css src/styles/settings-dashboard.css README.md
git commit -m "release: v0.1.4"
```

6. Push `main`, create the tag, and publish the trigger:

```bash
git push origin main
git tag v0.1.4
git push origin v0.1.4
```

7. Confirm GitHub Actions completed and the release contains the expected installers:
   - macOS Apple Silicon: `.dmg`
   - macOS Intel: `.dmg`
   - Windows x64: `.msi`
   - Windows ARM64: `.msi`
   - Ubuntu x64: `.deb`
   - Fedora x64: `.rpm`

## Downloading The App

End users should download the installer from the repository's `Releases` page, not run the project from source.

Recommended distribution path:

- Windows: `.msi` or `.exe`
- macOS: `.dmg` or `.app.tar.gz`
- Linux: `.AppImage`, `.deb`, or `.rpm`
