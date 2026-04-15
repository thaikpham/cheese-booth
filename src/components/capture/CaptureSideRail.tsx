import { useEffect, useRef, useState } from 'react'
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from 'react'
import {
  Camera,
  LoaderCircle,
  Play,
  QrCode,
  RefreshCw,
  Settings2,
  X,
  type LucideIcon,
} from 'lucide-react'

import type { BrowserCaptureSessionState } from '../../types'

const SESSION_LONG_PRESS_MS = 450
const SESSION_CONFIRM_TIMEOUT_MS = 3000

type SessionButtonUiState =
  | 'start'
  | 'active-empty'
  | 'reviewing'
  | 'finalize'
  | 'finalizing'
  | 'ready'
  | 'retry'
  | 'cancel-confirm'
  | 'reset-confirm'

type SessionConfirmState = Extract<
  SessionButtonUiState,
  'cancel-confirm' | 'reset-confirm'
> | null

interface SessionButtonModel {
  uiState: SessionButtonUiState
  label: string
  Icon: LucideIcon
  disabled: boolean
  canLongPress: boolean
  nextConfirmState: SessionConfirmState
  onPress?: () => void
  ariaLabel: string
  title: string
  iconClassName?: string
}

interface CaptureSideRailProps {
  layout: 'portrait' | 'landscape'
  uiDensity: 'roomy' | 'compact' | 'dense'
  captureModeLabel: string
  browserSession: BrowserCaptureSessionState
  shutterDisabled: boolean
  onOpenSettings: () => void
  onShutter: () => void
  onStartBrowserSession?: () => void
  onFinalizeBrowserSession?: () => void
  onRetryBrowserSessionShare?: () => void
  onCancelBrowserSession?: () => void
  onResetBrowserSession?: () => void
}

export function CaptureSideRail({
  layout,
  uiDensity,
  captureModeLabel,
  browserSession,
  shutterDisabled,
  onOpenSettings,
  onShutter,
  onStartBrowserSession,
  onFinalizeBrowserSession,
  onRetryBrowserSessionShare,
  onCancelBrowserSession,
  onResetBrowserSession,
}: CaptureSideRailProps) {
  const [confirmState, setConfirmState] = useState<SessionConfirmState>(null)
  const longPressTimerRef = useRef<number | null>(null)
  const longPressTriggeredRef = useRef(false)
  const sessionCountLabel = `${browserSession.items.length}/${browserSession.maxItems}`

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }

  useEffect(() => {
    clearLongPressTimer()
    longPressTriggeredRef.current = false
    setConfirmState(null)
  }, [browserSession.status, browserSession.items.length])

  useEffect(() => {
    if (!confirmState) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setConfirmState(null)
    }, SESSION_CONFIRM_TIMEOUT_MS)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [confirmState])

  useEffect(() => {
    return () => {
      clearLongPressTimer()
    }
  }, [])

  const sessionButton = resolveSessionButtonModel({
    session: browserSession,
    confirmState,
    onStartBrowserSession,
    onFinalizeBrowserSession,
    onRetryBrowserSessionShare,
    onCancelBrowserSession,
    onResetBrowserSession,
  })

  const handleSessionPointerDown = (
    event: ReactPointerEvent<HTMLButtonElement>,
  ): void => {
    if (
      event.pointerType === 'mouse' &&
      event.button !== 0
    ) {
      return
    }

    if (
      sessionButton.disabled ||
      !sessionButton.canLongPress ||
      sessionButton.nextConfirmState === null ||
      confirmState !== null
    ) {
      return
    }

    longPressTriggeredRef.current = false
    clearLongPressTimer()
    longPressTimerRef.current = window.setTimeout(() => {
      longPressTriggeredRef.current = true
      setConfirmState(sessionButton.nextConfirmState)
    }, SESSION_LONG_PRESS_MS)
  }

  const handleSessionPointerEnd = (): void => {
    clearLongPressTimer()
  }

  const handleSessionClick = (event: ReactMouseEvent<HTMLButtonElement>): void => {
    if (longPressTriggeredRef.current) {
      longPressTriggeredRef.current = false
      event.preventDefault()
      return
    }

    sessionButton.onPress?.()
  }

  return (
    <aside
      className={[
        'capture-control-dock',
        `capture-control-dock--${layout}`,
        `capture-control-dock--${uiDensity}`,
      ].join(' ')}
      data-density={uiDensity}
      aria-label="Capture controls"
    >
      <div className="capture-bottom-controls">
        <button
          className="capture-dock-button"
          type="button"
          onClick={onOpenSettings}
          aria-label="Mở cài đặt"
        >
          <Settings2 size={24} />
          <span className="capture-dock-button-label">Cài đặt</span>
        </button>

        <div className="capture-shutter-stack">
          <button
            className="capture-shutter-button"
            onClick={onShutter}
            disabled={shutterDisabled}
            aria-label={`Chụp ${captureModeLabel}`}
          >
            <span className="capture-shutter-ring" />
            <span className="capture-shutter-core" />
          </button>
          <p className="capture-shutter-label">
            {captureModeLabel === 'Photo' ? '📸 Photo' : '🎞 Boomerang'}
          </p>
        </div>

        <button
          className="capture-dock-button capture-dock-button--session-flow"
          data-session-ui={sessionButton.uiState}
          type="button"
          onClick={handleSessionClick}
          onPointerDown={handleSessionPointerDown}
          onPointerUp={handleSessionPointerEnd}
          onPointerLeave={handleSessionPointerEnd}
          onPointerCancel={handleSessionPointerEnd}
          onBlur={() => {
            clearLongPressTimer()
            setConfirmState(null)
          }}
          onContextMenu={(event) => {
            if (sessionButton.canLongPress) {
              event.preventDefault()
            }
          }}
          disabled={sessionButton.disabled}
          aria-label={sessionButton.ariaLabel}
          title={sessionButton.title}
        >
          <span className="capture-dock-status-count">{sessionCountLabel}</span>
          <span className="capture-dock-button-label">
            <sessionButton.Icon size={16} className={sessionButton.iconClassName} />
            {sessionButton.label}
          </span>
        </button>
      </div>
    </aside>
  )
}

function resolveSessionButtonModel({
  session,
  confirmState,
  onStartBrowserSession,
  onFinalizeBrowserSession,
  onRetryBrowserSessionShare,
  onCancelBrowserSession,
  onResetBrowserSession,
}: {
  session: BrowserCaptureSessionState
  confirmState: SessionConfirmState
  onStartBrowserSession?: () => void
  onFinalizeBrowserSession?: () => void
  onRetryBrowserSessionShare?: () => void
  onCancelBrowserSession?: () => void
  onResetBrowserSession?: () => void
}): SessionButtonModel {
  if (confirmState === 'cancel-confirm') {
    return {
      uiState: 'cancel-confirm',
      label: 'Xác nhận hủy',
      Icon: X,
      disabled: !onCancelBrowserSession,
      canLongPress: false,
      nextConfirmState: null,
      onPress: onCancelBrowserSession,
      ariaLabel: 'Xác nhận hủy session',
      title: 'Nhấn lần nữa để hủy session hiện tại',
    }
  }

  if (confirmState === 'reset-confirm') {
    return {
      uiState: 'reset-confirm',
      label: 'Bỏ session',
      Icon: X,
      disabled: !onResetBrowserSession && !onCancelBrowserSession,
      canLongPress: false,
      nextConfirmState: null,
      onPress: onResetBrowserSession ?? onCancelBrowserSession,
      ariaLabel: 'Bỏ session lỗi và tạo session mới',
      title: 'Nhấn lần nữa để bỏ session lỗi',
    }
  }

  switch (session.status) {
    case 'idle':
      return {
        uiState: 'start',
        label: 'Bắt đầu',
        Icon: Play,
        disabled: !onStartBrowserSession,
        canLongPress: false,
        nextConfirmState: null,
        onPress: onStartBrowserSession,
        ariaLabel: 'Bắt đầu session',
        title: 'Bắt đầu session mới',
      }
    case 'active':
      if (session.items.length > 0) {
        return {
          uiState: 'finalize',
          label: 'Tạo QR',
          Icon: QrCode,
          disabled: !onFinalizeBrowserSession,
          canLongPress: Boolean(onCancelBrowserSession),
          nextConfirmState: onCancelBrowserSession ? 'cancel-confirm' : null,
          onPress: onFinalizeBrowserSession,
          ariaLabel: 'Tạo QR cho session. Giữ để hủy session',
          title: 'Nhấn để tạo QR. Giữ để hủy session.',
        }
      }

      return {
        uiState: 'active-empty',
        label: 'Đang chụp',
        Icon: Camera,
        disabled: false,
        canLongPress: Boolean(onCancelBrowserSession),
        nextConfirmState: onCancelBrowserSession ? 'cancel-confirm' : null,
        ariaLabel: 'Session đang chụp. Giữ để hủy session',
        title: 'Session đang chụp. Giữ để hủy session.',
      }
    case 'reviewing-shot':
      return {
        uiState: 'reviewing',
        label: 'Duyệt ảnh',
        Icon: Camera,
        disabled: false,
        canLongPress: Boolean(onCancelBrowserSession),
        nextConfirmState: onCancelBrowserSession ? 'cancel-confirm' : null,
        ariaLabel: 'Đang duyệt ảnh. Giữ để hủy session',
        title: 'Đang duyệt ảnh. Giữ để hủy session.',
      }
    case 'finalizing':
      return {
        uiState: 'finalizing',
        label: 'Đang tạo QR',
        Icon: LoaderCircle,
        disabled: true,
        canLongPress: false,
        nextConfirmState: null,
        ariaLabel: 'Đang tạo QR cho session',
        title: 'Đang tạo QR cho session',
        iconClassName: 'capture-session-flow-icon-spinner',
      }
    case 'ready':
      return {
        uiState: 'ready',
        label: 'Session mới',
        Icon: RefreshCw,
        disabled: !onResetBrowserSession,
        canLongPress: false,
        nextConfirmState: null,
        onPress: onResetBrowserSession,
        ariaLabel: 'Bắt đầu session mới',
        title: 'Xóa session hiện tại và bắt đầu session mới',
      }
    case 'error':
      return {
        uiState: 'retry',
        label: 'Thử lại',
        Icon: RefreshCw,
        disabled: !onRetryBrowserSessionShare,
        canLongPress: Boolean(onResetBrowserSession ?? onCancelBrowserSession),
        nextConfirmState:
          onResetBrowserSession || onCancelBrowserSession ? 'reset-confirm' : null,
        onPress: onRetryBrowserSessionShare,
        ariaLabel: 'Thử lại upload. Giữ để bỏ session hiện tại',
        title: 'Nhấn để thử lại upload. Giữ để bỏ session hiện tại.',
      }
    default:
      return {
        uiState: 'active-empty',
        label: 'Session',
        Icon: Camera,
        disabled: true,
        canLongPress: false,
        nextConfirmState: null,
        ariaLabel: 'Session',
        title: 'Session',
      }
  }
}
