import './index.css'

import cheeseLogo from '../cheese_icon_transparent.svg'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'

import { CaptureScreen } from './components/CaptureScreen'
import { LandingPage } from './components/LandingPage'
import { SettingsDashboard } from './components/SettingsDashboard'
import { useKioskBootstrap } from './hooks/useKioskBootstrap'
import { useKioskController } from './hooks/useKioskController'
import { useKioskFullscreen } from './hooks/useKioskFullscreen'
import { APP_NAME, APP_SUBTITLE } from './lib/branding'

const CAPTURE_ROUTE = '/capture'
const SETTINGS_ROUTE = '/settings'

function KioskShell() {
  const {
    settings,
    settingsReady,
    sources,
    session,
    isBusy,
    countdownValue,
    boomerangRecording,
    captureOutcome,
    previewFrameRef,
    previewCanvasRef,
    videoRef,
    chooseOutputDir,
    openCapture,
    refreshSources,
    retryPermission,
    handleShutter,
    dismissCaptureOutcome,
    retryCaptureOutcomeShare,
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
              permissionState={session.permissionState}
              streamState={session.streamState}
              lastError={session.lastError}
              isBusy={isBusy}
              countdownValue={countdownValue}
              boomerangRecording={boomerangRecording}
              captureOutcome={captureOutcome}
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
              onModeChange={setMode}
              onCountdownChange={setCountdown}
              onSetRotationQuarter={setRotationQuarter}
              onFlipHorizontal={toggleFlipHorizontal}
              onFlipVertical={toggleFlipVertical}
              onDismissCaptureOutcome={dismissCaptureOutcome}
              onRetryCaptureOutcomeShare={retryCaptureOutcomeShare}
            />
          }
        />
        <Route
          path={SETTINGS_ROUTE}
          element={
            <SettingsDashboard
              settings={settings}
              sources={sources}
              permissionState={session.permissionState}
              streamState={session.streamState}
              lastError={session.lastError}
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
  const location = useLocation()

  if (location.pathname === '/') {
    return <LandingPage />
  }

  return <main className="app-shell"><KioskShell /></main>
}

export default App
