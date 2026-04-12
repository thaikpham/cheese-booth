# ColorLab V2 Photo Kiosk

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

## Downloading The App

End users should download the installer from the repository's `Releases` page, not run the project from source.

Recommended distribution path:

- Windows: `.msi` or `.exe`
- macOS: `.dmg` or `.app.tar.gz`
- Linux: `.AppImage`, `.deb`, or `.rpm`
