# State And Flow Map

## Purpose

Explain which hooks own which state, how the capture/session flows move through states, and where side effects and cleanup happen.

## When To Read This

Read this before changing camera access, capture flow, review behavior, session lifecycle, QR/share logic, or anything that allocates blobs/streams.

## Canonical Modules

- `src/hooks/useKioskController.ts`
- `src/hooks/useOperatorSettings.ts`
- `src/hooks/useCameraSession.ts`
- `src/hooks/usePreviewCanvas.ts`
- `src/hooks/useCaptureActions.ts`
- `src/hooks/useBrowserCaptureSession.ts`
- `src/hooks/useKioskBootstrap.ts`
- `src/hooks/useKioskFullscreen.ts`
- `src/lib/cloudShare.ts`
- `src/lib/settingsStore.ts`
- `src/types.ts`

## Hook Ownership

## `useKioskController(profile)`

Purpose:
- main orchestration hook for kiosk routes

Owns:
- creation of preview refs
- composition of settings, camera, preview, and capture hooks
- outward-facing action API for `CaptureScreen` and `SettingsDashboard`

Read this first when:
- a page prop suddenly has unclear ownership
- you need to move behavior between page and hook layers

## `useOperatorSettings(profile)`

Purpose:
- load and persist profile-scoped operator settings

Owns:

- `settings`
- `settingsReady`
- `setSettings`
- `updateSettings`

Persistence:

- localStorage key:
  `kiosk.v2.operatorSettings.{profile}`

Important rule:

- `updateSettings()` normalizes settings through `normalizeOperatorSettingsForProfile()`, so portrait rotation constraints stay valid.

## `useCameraSession()`

Purpose:
- permission probe, source discovery, stream startup, stream recovery

Owns:

- `sources`
- `cameraSession.permissionState`
- `cameraSession.streamState`
- `cameraSession.lastError`
- stream attachment to the hidden `<video>`

Side effects:

- calls `navigator.mediaDevices.getUserMedia()`
- enumerates devices
- selects a best device if needed
- listens to `devicechange`
- maximizes track resolution when possible

Cleanup:

- stops the current `MediaStream`
- clears `video.srcObject`
- removes `devicechange` listener

Important behavior:

- if permission is granted but no selected device exists, state becomes `missing-device`
- if the selected device disappears, the hook clears `settings.deviceId` and moves into recovery

## `usePreviewCanvas()`

Purpose:
- convert the hidden `<video>` stream into the visible preview canvas with kiosk transforms

Owns:

- canvas sizing
- aspect-ratio fitting
- rotation and flip transforms
- requestAnimationFrame draw loop

Side effects:

- `ResizeObserver` on preview frame
- video metadata listeners
- continuous draw loop

Cleanup:

- disconnect observer
- remove video listeners
- cancel animation frame

## `useCaptureActions()`

Purpose:
- high-level capture and browser session flow

Owns:

- `isBusy`
- `countdownValue`
- `boomerangRecording`
- `captureOutcome`
- staged browser item before commit
- cloud-share finalization calls

Depends on:

- `useBrowserCaptureSession()` for session state
- `src/lib/media.ts` for render/capture
- `src/lib/cloudShare.ts` for backend calls

Blob lifecycle:

- creates blob URLs for preview/poster assets
- revokes URLs when outcomes or staged items are cleared
- revokes all remaining URLs on hook unmount

## `useBrowserCaptureSession()`

Purpose:
- small in-memory domain store for the session lifecycle

Owns:

- `browserSession.status`
- `browserSession.startedAt`
- `browserSession.items`
- `browserSession.share`

Cleanup:

- revokes item blob URLs on reset and unmount

Important rule:

- this hook owns domain session status
- `CaptureSideRail` owns extra UI-only session-button sub-states such as long-press confirm
- removing a committed session item resequences the remaining items to keep slot numbering contiguous

## `useKioskBootstrap()`

Purpose:
- one-time bridge from `settingsReady` to initial `openCapture()`

## `useKioskFullscreen()`

Purpose:
- keeps kiosk routes trying for fullscreen with fallback on user interaction and visibility/focus recovery

## Flow Maps

## 1. Permission + Source Discovery

1. `settingsReady` becomes true
2. `useKioskBootstrap()` calls `openCapture()`
3. `useCameraSession.ensurePermission()` probes camera access
4. if granted, `refreshSourcesInternal()` enumerates devices
5. best device is selected if current `deviceId` is missing or invalid
6. stream-start effect reacts to `permissionState === granted` and a valid `settings.deviceId`
7. hidden video receives the live stream
8. preview canvas starts drawing frames

Failure states:

- permission denied -> `permissionState = denied`, stream idle
- missing hardware -> `streamState = missing-device`
- other media errors -> `streamState = error`

## 2. Live Camera Stream Lifecycle

Trigger:
- `settings.deviceId` or permission state changes

Transitions:

- `idle` -> `starting` -> `live`
- `starting` -> `missing-device`
- `starting` -> `error`

Recovery actions:

- retry permission
- refresh sources
- change selected device

## 3. Shot Capture + Review

Preconditions:

- `browserSession.status === active`
- item count is below `maxItems`
- stream is live
- app is not busy

Sequence:

1. `handleShutter()` sets busy state
2. countdown runs and plays countdown/shutter cues
3. `renderPhotoFromVideo()` or `renderBoomerangFromVideo()` creates media
4. preview outcome is created from the rendered blob
5. a staged `BrowserSessionItem` is created but not yet committed
6. `enterReviewingShot()` switches session to `reviewing-shot`
7. `BrowserSessionOverlay` shows review UI

Branching:

- approve:
  `addSessionItem()` commits the staged item and returns to `active`
- reject:
  staged blobs are disposed and session returns to `active`

## 4. Browser Session Lifecycle

Domain statuses from `src/types.ts`:

- `idle`
- `active`
- `reviewing-shot`
- `finalizing`
- `ready`
- `error`

Main transitions:

- `idle` -> `active`
  start session
- `active` -> `reviewing-shot`
  shutter captured a new staged shot
- `reviewing-shot` -> `active`
  approve or reject review
- `active` -> `active`
  remove a committed item from the tray and resequence the remaining items
- `active` -> `finalizing`
  finalize/upload requested
- `finalizing` -> `ready`
  all items uploaded and completion succeeded
- `finalizing` -> `error`
  upload or completion failed
- `ready` -> `idle`
  reset/new session
- `error` -> `finalizing`
  retry upload
- `active|reviewing-shot|error` -> `idle`
  cancel/reset flow

Important UI note:

- `CaptureSideRail` keeps a fixed session-flow button slot and maps the domain state into UI states such as:
  `start`, `active-empty`, `finalize`, `finalizing`, `ready`, `retry`, `cancel-confirm`, `reset-confirm`
- long-press threshold: `450ms`
- confirm timeout: `3000ms`

## 5. QR / Share Finalization Flow

1. `finalizeBrowserSession()` validates that the session has items and is not busy
2. `startFinalizing()` moves session to `finalizing`
3. `initCloudCaptureSession()` requests a server-side session and presigned upload targets
4. browser uploads each local blob directly to R2 using the signed `PUT` URLs
5. `completeCloudCaptureSession()` asks the backend to verify uploads and mint the gallery token
6. success -> `completeSessionShare()` -> `ready`
7. failure -> `failSessionShare()` -> `error`

Output contract on success:

- `sessionId`
- `downloadToken`
- `galleryUrl`
- `expiresAt`

## 6. Session Gallery Fetch Flow

1. `SessionGalleryPage` reads `:token`
2. `fetchCloudCaptureSessionGallery()` calls `GET /api/capture-sessions/gallery`
3. backend validates token and expiry
4. frontend renders a media grid
5. each item uses `/api/capture-sessions/media?...` URLs for preview/download redirects

## Side Effects And Cleanup

## localStorage

Owned by:
- `src/lib/settingsStore.ts`

Stored data:
- operator settings per profile

## Blob URLs

Created by:

- `useCaptureActions()` for review preview URLs
- `useCaptureActions()` for poster URLs

Revoked by:

- `disposeBrowserSessionItem()`
- `disposeCaptureOutcome()`
- `useBrowserCaptureSession()` reset/unmount cleanup
- `useBrowserCaptureSession()` item deletion cleanup for committed tray items

## MediaStream cleanup

Owned by:
- `useCameraSession()`

What gets cleaned:

- video tracks are stopped
- hidden video is paused
- `srcObject` is cleared

## Preview render loop cleanup

Owned by:
- `usePreviewCanvas()`

What gets cleaned:

- animation frame
- resize observer
- video metadata listeners

## Edit Guide

If you are changing:

- camera permission/device logic:
  edit `useCameraSession.ts`
- session domain statuses or transitions:
  edit `useBrowserCaptureSession.ts`
- countdown/capture/review/finalize behavior:
  edit `useCaptureActions.ts`
- canvas transform or preview rendering:
  edit `usePreviewCanvas.ts`
- dock-specific long-press confirm UX:
  edit `CaptureSideRail.tsx`
