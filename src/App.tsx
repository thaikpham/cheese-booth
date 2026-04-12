import './index.css'

import { Navigate, Route, Routes } from 'react-router-dom'

import { CaptureScreen } from './components/CaptureScreen'
import { SettingsDashboard } from './components/SettingsDashboard'
import { useKioskBootstrap } from './hooks/useKioskBootstrap'
import { useKioskController } from './hooks/useKioskController'
import { useKioskFullscreen } from './hooks/useKioskFullscreen'

const CAPTURE_ROUTE = '/capture'
const SETTINGS_ROUTE = '/settings'

function App() {
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
    setOutputDirPath,
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
          <p className="eyebrow">Sony USB Webcam Kiosk</p>
          <h1>Đang khởi tạo kiosk…</h1>
        </div>
      </main>
    )
  }

  return (
    <main className="app-shell">
      <Routes>
        <Route
          path={CAPTURE_ROUTE}
          element={
            <CaptureScreen
              settings={settings}
              sources={sources}
              permissionState={session.permissionState}
              streamState={session.streamState}
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
              onOutputDirChange={setOutputDirPath}
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
    </main>
  )
}

export default App
