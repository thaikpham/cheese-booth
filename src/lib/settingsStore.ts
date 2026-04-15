import {
  getDefaultOperatorSettings,
  normalizeOperatorSettingsForProfile,
} from './kioskProfiles'
import type { KioskProfile, OperatorSettings } from '../types'

const SETTINGS_KEY_PREFIX = 'kiosk.v2.operatorSettings'

function getSettingsKey(profile: KioskProfile): string {
  return `${SETTINGS_KEY_PREFIX}.${profile}`
}

function mergeOperatorSettings(
  profile: KioskProfile,
  loaded: Partial<OperatorSettings> | null | undefined,
): OperatorSettings {
  const defaults = getDefaultOperatorSettings(profile)

  return {
    captureMode: defaults.captureMode,
    deviceId:
      typeof loaded?.deviceId === 'string' || loaded?.deviceId === null
        ? loaded.deviceId
        : defaults.deviceId,
    countdownSec: defaults.countdownSec,
    rotationQuarter: defaults.rotationQuarter,
    flipHorizontal: defaults.flipHorizontal,
    flipVertical: defaults.flipVertical,
  }
}

function isOperatorSettingsRecord(
  value: unknown,
): value is Partial<OperatorSettings> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readBrowserSettings(profile: KioskProfile): Partial<OperatorSettings> | null {
  try {
    const raw = window.localStorage.getItem(getSettingsKey(profile))

    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw) as unknown

    if (!isOperatorSettingsRecord(parsed)) {
      window.localStorage.removeItem(getSettingsKey(profile))
      return null
    }

    return parsed
  } catch (error) {
    console.warn('Khong the doc kiosk settings tu localStorage, se dung mac dinh.', error)
    window.localStorage.removeItem(getSettingsKey(profile))
    return null
  }
}

export async function loadOperatorSettings(
  profile: KioskProfile,
): Promise<OperatorSettings> {
  return normalizeOperatorSettingsForProfile(
    profile,
    mergeOperatorSettings(profile, readBrowserSettings(profile)),
  )
}

export async function saveOperatorSettings(
  profile: KioskProfile,
  settings: OperatorSettings,
): Promise<void> {
  try {
    window.localStorage.setItem(
      getSettingsKey(profile),
      JSON.stringify(normalizeOperatorSettingsForProfile(profile, settings)),
    )
  } catch (error) {
    console.warn('Khong the luu kiosk settings vao localStorage.', error)
  }
}
