import { Fragment, useEffect, useRef, useState } from 'react'

import type { CaptureMode, CountdownSec, OperatorSettings } from '../../types'

type InteractiveTokenId =
  | 'mode'
  | 'countdown'
  | 'rotation'
  | 'flip-horizontal'
  | 'flip-vertical'

interface TelemetryOption {
  label: string
  selected: boolean
  onSelect: () => void
}

interface InteractiveTelemetryToken {
  id: InteractiveTokenId
  label: string
  interactive: true
  accent: boolean
  menuLabel: string
  options: TelemetryOption[]
}

interface PassiveTelemetryToken {
  id: 'aspect' | 'runtime' | 'save'
  label: string
  interactive: false
  accent: boolean
}

type TelemetryToken = InteractiveTelemetryToken | PassiveTelemetryToken

interface CapturePreviewTelemetryProps {
  settings: Pick<
    OperatorSettings,
    'captureMode' | 'countdownSec' | 'rotationQuarter' | 'flipHorizontal' | 'flipVertical'
  >
  runtimeTelemetryLabel: string
  autoSaveReady: boolean
  disabled?: boolean
  onModeChange: (mode: CaptureMode) => void
  onCountdownChange: (countdownSec: CountdownSec) => void
  onSetRotationQuarter: (
    rotationQuarter: OperatorSettings['rotationQuarter'],
  ) => void
  onFlipHorizontal: () => void
  onFlipVertical: () => void
}

const COUNTDOWN_OPTIONS: CountdownSec[] = [3, 5, 10]
const ROTATION_OPTIONS: OperatorSettings['rotationQuarter'][] = [0, 1, 2, 3]

export function CapturePreviewTelemetry({
  settings,
  runtimeTelemetryLabel,
  autoSaveReady,
  disabled = false,
  onModeChange,
  onCountdownChange,
  onSetRotationQuarter,
  onFlipHorizontal,
  onFlipVertical,
}: CapturePreviewTelemetryProps) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const [openTokenId, setOpenTokenId] = useState<InteractiveTokenId | null>(null)

  useEffect(() => {
    if (!openTokenId) return

    function handlePointerDown(event: PointerEvent): void {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpenTokenId(null)
      }
    }

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        setOpenTokenId(null)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [openTokenId])

  useEffect(() => {
    if (disabled) {
      const frame = window.requestAnimationFrame(() => {
        setOpenTokenId(null)
      })

      return () => {
        window.cancelAnimationFrame(frame)
      }
    }
  }, [disabled])

  const isPortrait = settings.rotationQuarter % 2 === 1

  const tokens: TelemetryToken[] = [
    {
      id: 'mode',
      label: settings.captureMode === 'photo' ? 'PHOTO' : 'BOOMERANG',
      interactive: true,
      accent: true,
      menuLabel: 'Chọn chế độ capture',
      options: [
        {
          label: 'PHOTO',
          selected: settings.captureMode === 'photo',
          onSelect: () => {
            if (settings.captureMode !== 'photo') {
              onModeChange('photo')
            }
          },
        },
        {
          label: 'BOOMERANG',
          selected: settings.captureMode === 'boomerang',
          onSelect: () => {
            if (settings.captureMode !== 'boomerang') {
              onModeChange('boomerang')
            }
          },
        },
      ],
    },
    {
      id: 'countdown',
      label: `${settings.countdownSec}S`,
      interactive: true,
      accent: true,
      menuLabel: 'Chọn thời gian đếm ngược',
      options: COUNTDOWN_OPTIONS.map((value) => ({
        label: `${value}S`,
        selected: settings.countdownSec === value,
        onSelect: () => {
          if (settings.countdownSec !== value) {
            onCountdownChange(value)
          }
        },
      })),
    },
    {
      id: 'aspect',
      label: isPortrait ? '3:4' : '4:3',
      interactive: false,
      accent: false,
    },
    {
      id: 'rotation',
      label: `R${settings.rotationQuarter * 90}`,
      interactive: true,
      accent: true,
      menuLabel: 'Chọn góc xoay preview',
      options: ROTATION_OPTIONS.map((value) => ({
        label: `R${value * 90}`,
        selected: settings.rotationQuarter === value,
        onSelect: () => {
          if (settings.rotationQuarter !== value) {
            onSetRotationQuarter(value)
          }
        },
      })),
    },
    {
      id: 'flip-horizontal',
      label: `H${settings.flipHorizontal ? '1' : '0'}`,
      interactive: true,
      accent: true,
      menuLabel: 'Lật ngang preview',
      options: [
        {
          label: 'H0',
          selected: !settings.flipHorizontal,
          onSelect: () => {
            if (settings.flipHorizontal) {
              onFlipHorizontal()
            }
          },
        },
        {
          label: 'H1',
          selected: settings.flipHorizontal,
          onSelect: () => {
            if (!settings.flipHorizontal) {
              onFlipHorizontal()
            }
          },
        },
      ],
    },
    {
      id: 'flip-vertical',
      label: `V${settings.flipVertical ? '1' : '0'}`,
      interactive: true,
      accent: true,
      menuLabel: 'Lật dọc preview',
      options: [
        {
          label: 'V0',
          selected: !settings.flipVertical,
          onSelect: () => {
            if (settings.flipVertical) {
              onFlipVertical()
            }
          },
        },
        {
          label: 'V1',
          selected: settings.flipVertical,
          onSelect: () => {
            if (!settings.flipVertical) {
              onFlipVertical()
            }
          },
        },
      ],
    },
    {
      id: 'runtime',
      label: runtimeTelemetryLabel,
      interactive: false,
      accent: false,
    },
    {
      id: 'save',
      label: autoSaveReady ? 'SAVE' : 'NO-SAVE',
      interactive: false,
      accent: false,
    },
  ]

  function toggleToken(tokenId: InteractiveTokenId): void {
    if (disabled) return

    setOpenTokenId((current) => (current === tokenId ? null : tokenId))
  }

  function handleSelectOption(option: TelemetryOption): void {
    option.onSelect()
    setOpenTokenId(null)
  }

  return (
    <div
      ref={rootRef}
      className="capture-settings-marquee capture-preview-marquee capture-preview-telemetry"
      role="group"
      aria-label="Capture quick settings"
    >
      {tokens.map((token, index) => {
        const isOpen = token.interactive && openTokenId === token.id

        return (
          <Fragment key={token.id}>
            <span className="capture-preview-token-wrap">
              {token.interactive ? (
                <button
                  type="button"
                  className={[
                    'capture-preview-token',
                    'capture-preview-token--interactive',
                    token.accent ? 'capture-preview-token--accent' : '',
                    isOpen ? 'capture-preview-token--open' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => toggleToken(token.id)}
                  disabled={disabled}
                  aria-haspopup="menu"
                  aria-expanded={isOpen}
                >
                  {token.label}
                </button>
              ) : (
                <span className="capture-preview-token capture-preview-token--passive">
                  {token.label}
                </span>
              )}

              {token.interactive && isOpen && token.options?.length ? (
                <div
                  className="capture-preview-token-menu"
                  role="menu"
                  aria-label={token.menuLabel}
                >
                  {token.options.map((option) => (
                    <button
                      key={option.label}
                      type="button"
                      className={[
                        'capture-preview-token-option',
                        option.selected ? 'is-active' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      onClick={() => handleSelectOption(option)}
                      role="menuitemradio"
                      aria-checked={option.selected}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </span>

            {index < tokens.length - 1 ? (
              <span className="capture-preview-token-separator" aria-hidden="true">
                ·
              </span>
            ) : null}
          </Fragment>
        )
      })}
    </div>
  )
}
