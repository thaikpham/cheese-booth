import './index.css'

import cheeseLogo from '../cheese_icon_transparent.svg'
import { matchPath, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'

import { CaptureScreen } from './components/CaptureScreen'
import { LandingPage } from './components/LandingPage'
import { SessionGalleryPage } from './components/SessionGalleryPage'
import { SettingsDashboard } from './components/SettingsDashboard'
import { useKioskBootstrap } from './hooks/useKioskBootstrap'
import { useKioskController } from './hooks/useKioskController'
import { useKioskFullscreen } from './hooks/useKioskFullscreen'
import { APP_NAME, APP_SUBTITLE } from './lib/branding'
import { resolveDefaultKioskProfile } from './lib/browserDevice'
import {
  DEFAULT_KIOSK_PROFILE,
  getCaptureRoute,
  getSettingsRoute,
  isKioskProfile,
} from './lib/kioskProfiles'
import type { KioskProfile } from './types'

function useDeviceBasedProfile(): KioskProfile {
  const [profile, setProfile] = useState<KioskProfile>(() => {
    if (typeof window === 'undefined') {
      return DEFAULT_KIOSK_PROFILE
    }

    return resolveDefaultKioskProfile(window, navigator)
  })

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const detectDevice = () => {
      setProfile(resolveDefaultKioskProfile(window, navigator))
    }

    detectDevice()
    window.addEventListener('resize', detectDevice)
    return () => window.removeEventListener('resize', detectDevice)
  }, [])

  return profile
}

const SESSION_GALLERY_ROUTE = '/session/:token'

function ProfiledKioskExperience({
  profile,
  defaultProfile,
}: {
  profile: KioskProfile
  defaultProfile: KioskProfile
}) {
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
    setMode,
    setCountdown,
    setRotationQuarter,
    rotate,
    toggleFlipHorizontal,
    toggleFlipVertical,
    setDevice,
  } = useKioskController(profile)

  useKioskBootstrap(settingsReady, openCapture)
  useKioskFullscreen()

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
          path="/capture/:profile"
          element={
            <CaptureScreen
              profile={profile}
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
            />
          }
        />
        <Route
          path="/settings/:profile"
          element={
            <SettingsDashboard
              profile={profile}
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
              onRetryPermission={() => {
                void retryPermission()
              }}
              onRefreshSources={() => {
                void refreshSources()
              }}
            />
          }
        />
        <Route
          path="/capture"
          element={<Navigate to={getCaptureRoute(defaultProfile)} replace />}
        />
        <Route
          path="/settings"
          element={<Navigate to={getSettingsRoute(defaultProfile)} replace />}
        />
        <Route
          path="*"
          element={<Navigate to={getCaptureRoute(defaultProfile)} replace />}
        />
      </Routes>

      <video ref={videoRef} className="hidden-video" autoPlay muted playsInline />
    </>
  )
}

function KioskShell({ defaultProfile }: { defaultProfile: KioskProfile }) {
  const location = useLocation()
  const captureMatch = matchPath('/capture/:profile', location.pathname)
  const settingsMatch = matchPath('/settings/:profile', location.pathname)
  const profileParam =
    captureMatch?.params.profile ?? settingsMatch?.params.profile ?? null

  if (profileParam && !isKioskProfile(profileParam)) {
    return <Navigate to={getCaptureRoute(defaultProfile)} replace />
  }

  const profile: KioskProfile = isKioskProfile(profileParam)
    ? profileParam
    : defaultProfile

  return (
    <ProfiledKioskExperience
      key={profile}
      profile={profile}
      defaultProfile={defaultProfile}
    />
  )
}

function App() {
  const deviceProfile = useDeviceBasedProfile()

  return (
    <Routes>
      <Route
        path="/"
        element={
          <div className="route-shell route-shell--public-scroll">
            <LandingPage defaultProfile={deviceProfile} />
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
            <KioskShell defaultProfile={deviceProfile} />
          </main>
        }
      />
    </Routes>
  )
}

export default App
