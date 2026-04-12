import './index.css'

import cheeseLogo from '../cheese_icon_transparent.svg'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'

import { CaptureScreen } from './components/CaptureScreen'
import { DownloadPage } from './components/DownloadPage'
import { LandingPage } from './components/LandingPage'
import { SettingsDashboard } from './components/SettingsDashboard'
import { useKioskBootstrap } from './hooks/useKioskBootstrap'
import { useKioskController } from './hooks/useKioskController'
import { useKioskFullscreen } from './hooks/useKioskFullscreen'
import { APP_NAME, APP_SUBTITLE } from './lib/branding'

const CAPTURE_ROUTE = '/capture'
const SETTINGS_ROUTE = '/settings'
const DOWNLOAD_ROUTE = '/download'

function KioskShell() {
  const {
    settings,
    settingsReady,
    sources,
    session,
    isBusy,
    countdownValue,
    previewFrameRef,
    previewCanvasRef,
    videoRef,
    chooseOutputDir,
    openCapture,
    refreshSources,
    retryPermission,
    handleShutter,
    setMode,
    setCountdown,
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

  return (
    <main className="app-shell">
      {location.pathname === DOWNLOAD_ROUTE ? <DownloadPage /> : <KioskShell />}
    </main>
  )
}

export default App
