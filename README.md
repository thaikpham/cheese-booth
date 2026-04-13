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

Cloud share + QR browser flow needs Vercel Functions, so for full end-to-end local testing prefer:

```bash
vercel dev
```

Run the desktop app:

```bash
npm run tauri:dev
```

Create a local production build:

```bash
npm run tauri:build
```

## Cloud Share + QR

Browser capture can now:

- preview the result immediately in the modal from a local blob URL
- upload the file to a private Cloudflare R2 bucket
- show a QR code for a 24-hour tokenized download link
- expire and clean up files through DB-backed app logic

Setup and deploy guide:

- Checklist: [docs/vercel-r2-cloud-share-checklist.md](./docs/vercel-r2-cloud-share-checklist.md)
- Local quickstart: [docs/vercel-dev-cloud-share-quickstart.md](./docs/vercel-dev-cloud-share-quickstart.md)
- Go-live checklist: [docs/internal-event-ops-go-live-checklist.md](./docs/internal-event-ops-go-live-checklist.md)
- Operator runbook: [docs/cloud-share-operator-runbook.md](./docs/cloud-share-operator-runbook.md)
- Env template: [.env.example](./.env.example)

Operational endpoint:

- Health check: `/api/health/cloud-share`

## GitHub Releases

This repository is configured to publish desktop builds through GitHub Actions when a version tag is pushed.

Release flow:

1. Update the app version in `package.json`.
2. Commit the change to `main`.
3. Create a tag like `v0.1.0`.
4. Push `main` and the tag to GitHub.
5. GitHub Actions publishes the release and uploads the desktop installers/bundles.

Example:

```bash
git add .
git commit -m "release: v0.1.0"
git push origin main
git tag v0.1.0
git push origin v0.1.0
```

The workflow file lives at `.github/workflows/release.yml`.

End-user distribution now has two surfaces that read from the same latest release metadata:

- Public download page: `/#/download`
- Internal settings route: `/#/settings`

Internal distribution also keeps one installer script per OS:

- `macOS`: auto-detects Apple Silicon or Intel and installs the matching `.dmg`
- `Windows 11`: auto-detects x64 or ARM64 and installs the matching `.msi`
- `Linux`: auto-detects `apt-get` or `dnf` on supported x64 distributions and installs the matching `.deb` or `.rpm`

### Release Trust Modes

The release workflow is intentionally staged:

- Phase 1: publish direct-download installers from GitHub Releases, with honest UI copy that unsigned builds may trigger OS warnings.
- Phase 2: enable macOS signing/notarization and Windows signing by adding the required CI secrets and variables.

The repo is already wired for optional signing:

- macOS signing/notarization is activated when the Apple secrets are present.
- Windows signing is activated when the Windows certificate secrets and thumbprint variable are present.
- If those credentials are missing, the workflow still builds and publishes unsigned installers.

Ready-to-fill setup docs:

- Checklist: [docs/github-actions-trusted-release-checklist.md](./docs/github-actions-trusted-release-checklist.md)
- Secrets template: [docs/github-actions-secrets.template.env](./docs/github-actions-secrets.template.env)
- Variables template: [docs/github-actions-variables.template.env](./docs/github-actions-variables.template.env)

### Secrets And Variables For Trusted Desktop Releases

macOS secrets:

- `APPLE_CERTIFICATE`: base64-encoded `.p12` signing certificate
- `APPLE_CERTIFICATE_PASSWORD`: password for the exported `.p12`
- `KEYCHAIN_PASSWORD`: temporary keychain password used in GitHub Actions
- `APPLE_ID`: Apple account email used for notarization
- `APPLE_PASSWORD`: app-specific password for notarization
- `APPLE_TEAM_ID`: Apple team identifier

Windows secrets:

- `WINDOWS_CERTIFICATE`: base64-encoded `.pfx` certificate
- `WINDOWS_CERTIFICATE_PASSWORD`: password for the exported `.pfx`

Windows repository variables:

- `WINDOWS_CERTIFICATE_THUMBPRINT`: thumbprint of the imported certificate
- `WINDOWS_DIGEST_ALGORITHM`: usually `sha256`
- `WINDOWS_TIMESTAMP_URL`: timestamp server URL, for example `http://timestamp.digicert.com`

Windows signing is performed by the custom command in `src-tauri/tauri.windows.conf.json`, which calls `src-tauri/scripts/sign-windows.ps1`.

### Release Checklist For `v0.1.4`

1. Verify the release version is aligned in:
   - `package.json`
   - `package-lock.json`
   - `src-tauri/Cargo.toml`
   - `src-tauri/Cargo.lock`
2. Verify installer script patterns still match the workflow asset naming:
   - Workflow asset pattern: `colorlabv2-photokiosk-[platform]-[arch][ext]`
   - Installer snippets source: `src/lib/installScripts.ts`
   - Release catalog source: `src/lib/releaseCatalog.ts`
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
8. Confirm end-user download route resolves the latest release correctly:
   - `/#/download`
   - each card links to the expected asset
   - macOS / Windows warning copy still matches the actual signing state

## Downloading The App

End users should download the installer from the public download page or the repository's `Releases` page, not run the project from source.

Primary download surface:

- Public page: `/#/download`

Recommended distribution path:

- Windows: `.msi`
- macOS: `.dmg`
- Linux Ubuntu/Debian: `.deb`
- Linux Fedora/RHEL: `.rpm`
