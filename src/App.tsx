import './index.css'

import cheeseLogo from '../cheese_icon_transparent.svg'
import { Navigate, Route, Routes } from 'react-router-dom'

import { CaptureScreen } from './components/CaptureScreen'
import { LandingPage } from './components/LandingPage'
import { SessionGalleryPage } from './components/SessionGalleryPage'
import { SettingsDashboard } from './components/SettingsDashboard'
import { useKioskBootstrap } from './hooks/useKioskBootstrap'
import { useKioskController } from './hooks/useKioskController'
import { useKioskFullscreen } from './hooks/useKioskFullscreen'
import { APP_NAME, APP_SUBTITLE } from './lib/branding'

const CAPTURE_ROUTE = '/capture'
const SESSION_GALLERY_ROUTE = '/session/:token'
const SETTINGS_ROUTE = '/settings'

function KioskShell() {
  const {
    settings,
    settingsReady,
    sources,
    cameraSession,
    isBusy,
    countdownValue,
    boomerangRecording,
    captureOutcome,
    browserSession,
    previewFrameRef,
    previewCanvasRef,
    videoRef,
    chooseOutputDir,
    openCapture,
    refreshSources,
    retryPermission,
    handleShutter,
    startBrowserSession,
    finalizeBrowserSession,
    retryBrowserSessionShare,
    cancelBrowserSession,
    resetBrowserSession,
    approveCaptureOutcome,
    rejectCaptureOutcome,
    dismissCaptureOutcome,
    setMode,
    setCountdown,
    setRotationQuarter,
    rotate,
    toggleFlipHorizontal,
    toggleFlipVertical,
    setDevice,
  } = useKioskController()

  useKioskBootstrap(settingsReady, openCapture)
  useKioskFullscreen(settingsReady)

  if (!settingsReady) {
    return (
      <main className="app-shell loading-shell">
        <div className="loading-card">
          <img
            src={cheeseLogo}
            alt={APP_NAME}
            className="loading-logo"
            width={92}
            height={69}
          />
          <p className="eyebrow">{APP_SUBTITLE}</p>
          <h1>{APP_NAME}</h1>
          <p className="lede">Đang khởi tạo kiosk…</p>
        </div>
      </main>
    )
  }

  return (
    <>
      <Routes>
        <Route
          path={CAPTURE_ROUTE}
          element={
            <CaptureScreen
              settings={settings}
              sources={sources}
              permissionState={cameraSession.permissionState}
              streamState={cameraSession.streamState}
              lastError={cameraSession.lastError}
              isBusy={isBusy}
              countdownValue={countdownValue}
              boomerangRecording={boomerangRecording}
              captureOutcome={captureOutcome}
              browserSession={browserSession}
              previewFrameRef={previewFrameRef}
              previewCanvasRef={previewCanvasRef}
              onRetryPermission={() => {
                void retryPermission()
              }}
              onRefreshSources={() => {
                void refreshSources()
              }}
              onShutter={() => {
                void handleShutter()
              }}
              onStartBrowserSession={startBrowserSession}
              onFinalizeBrowserSession={() => {
                void finalizeBrowserSession()
              }}
              onRetryBrowserSessionShare={() => {
                void retryBrowserSessionShare()
              }}
              onCancelBrowserSession={cancelBrowserSession}
              onResetBrowserSession={resetBrowserSession}
              onModeChange={setMode}
              onCountdownChange={setCountdown}
              onSetRotationQuarter={setRotationQuarter}
              onFlipHorizontal={toggleFlipHorizontal}
              onFlipVertical={toggleFlipVertical}
              onApproveCaptureOutcome={approveCaptureOutcome}
              onRejectCaptureOutcome={rejectCaptureOutcome}
              onDismissCaptureOutcome={dismissCaptureOutcome}
            />
          }
        />
        <Route
          path={SETTINGS_ROUTE}
          element={
            <SettingsDashboard
              settings={settings}
              sources={sources}
              permissionState={cameraSession.permissionState}
              streamState={cameraSession.streamState}
              lastError={cameraSession.lastError}
              isBusy={isBusy}
              previewFrameRef={previewFrameRef}
              previewCanvasRef={previewCanvasRef}
              onModeChange={setMode}
              onDeviceChange={setDevice}
              onCountdownChange={setCountdown}
              onRotate={rotate}
              onFlipHorizontal={toggleFlipHorizontal}
              onFlipVertical={toggleFlipVertical}
              onPickOutputDir={chooseOutputDir}
              onRetryPermission={() => {
                void retryPermission()
              }}
              onRefreshSources={() => {
                void refreshSources()
              }}
            />
          }
        />
        <Route path="*" element={<Navigate to={CAPTURE_ROUTE} replace />} />
      </Routes>

      <video ref={videoRef} className="hidden-video" autoPlay muted playsInline />
    </>
  )
}

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <div className="route-shell route-shell--public-scroll">
            <LandingPage />
          </div>
        }
      />
      <Route
        path={SESSION_GALLERY_ROUTE}
        element={
          <div className="route-shell route-shell--public-scroll">
            <SessionGalleryPage />
          </div>
        }
      />
      <Route
        path="*"
        element={
          <main className="route-shell route-shell--kiosk-fit app-shell">
            <KioskShell />
          </main>
        }
      />
    </Routes>
  )
}

export default App
