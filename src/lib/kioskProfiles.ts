import type { KioskProfile, OperatorSettings } from '../types'
import {
  DEFAULT_LANDSCAPE_OPERATOR_SETTINGS,
  DEFAULT_PORTRAIT_OPERATOR_SETTINGS,
} from '../types'

export const DEFAULT_KIOSK_PROFILE: KioskProfile = 'portrait'

export function isKioskProfile(value: string | null | undefined): value is KioskProfile {
  return value === 'portrait' || value === 'landscape'
}

export function getKioskProfileLabel(profile: KioskProfile): string {
  return profile === 'portrait' ? 'Portrait' : 'Landscape'
}

export function getKioskProfileAspectLabel(profile: KioskProfile): string {
  return profile === 'portrait' ? '3:4' : '4:3'
}

export function getKioskProfileAspectRatio(profile: KioskProfile): number {
  return profile === 'portrait' ? 3 / 4 : 4 / 3
}

export function getKioskPreviewAspect(profile: KioskProfile): string {
  return profile === 'portrait' ? '3 / 4' : '4 / 3'
}

export function getKioskRotationOptions(
  profile: KioskProfile,
): OperatorSettings['rotationQuarter'][] {
  return profile === 'portrait' ? [1] : [0, 1, 2, 3]
}

export function sanitizeRotationQuarterForProfile(
  profile: KioskProfile,
  rotationQuarter: number,
): OperatorSettings['rotationQuarter'] {
  const normalized = (((rotationQuarter % 4) + 4) % 4) as 0 | 1 | 2 | 3

  if (profile === 'portrait') {
    return 1
  }

  return normalized
}

export function normalizeOperatorSettingsForProfile(
  profile: KioskProfile,
  settings: OperatorSettings,
): OperatorSettings {
  return {
    ...settings,
    rotationQuarter: sanitizeRotationQuarterForProfile(
      profile,
      settings.rotationQuarter,
    ),
  }
}

export function getDefaultOperatorSettings(profile: KioskProfile): OperatorSettings {
  return profile === 'portrait'
    ? { ...DEFAULT_PORTRAIT_OPERATOR_SETTINGS }
    : { ...DEFAULT_LANDSCAPE_OPERATOR_SETTINGS }
}

export function getCaptureRoute(profile: KioskProfile): string {
  return `/capture/${profile}`
}

export function getSettingsRoute(profile: KioskProfile): string {
  return `/settings/${profile}`
}
