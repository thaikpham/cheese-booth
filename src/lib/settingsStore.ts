import { LazyStore } from '@tauri-apps/plugin-store'

import { DEFAULT_OPERATOR_SETTINGS, type OperatorSettings } from '../types'
import { isTauriRuntime } from './runtime'

const SETTINGS_PATH = 'settings-v1.json'
const SETTINGS_KEY = 'kiosk.v1.operatorSettings'

let store: LazyStore | null = null

function getStore(): LazyStore {
  store ??= new LazyStore(SETTINGS_PATH, {
    autoSave: 150,
    defaults: {
      [SETTINGS_KEY]: DEFAULT_OPERATOR_SETTINGS,
    },
  })

  return store
}

function mergeOperatorSettings(
  loaded: Partial<OperatorSettings> | null | undefined,
): OperatorSettings {
  return {
    ...DEFAULT_OPERATOR_SETTINGS,
    ...loaded,
  }
}

function isOperatorSettingsRecord(
  value: unknown,
): value is Partial<OperatorSettings> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readBrowserSettings(): Partial<OperatorSettings> | null {
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY)

    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw) as unknown

    if (!isOperatorSettingsRecord(parsed)) {
      window.localStorage.removeItem(SETTINGS_KEY)
      return null
    }

    return parsed
  } catch (error) {
    console.warn('Khong the doc kiosk settings tu localStorage, se dung mac dinh.', error)
    window.localStorage.removeItem(SETTINGS_KEY)
    return null
  }
}

export async function loadOperatorSettings(): Promise<OperatorSettings> {
  if (!isTauriRuntime()) {
    return mergeOperatorSettings(readBrowserSettings())
  }

  try {
    const loaded = await getStore().get<OperatorSettings>(SETTINGS_KEY)

    return mergeOperatorSettings(loaded)
  } catch (error) {
    console.warn('Khong the tai kiosk settings tu Tauri store, se dung mac dinh.', error)
    return mergeOperatorSettings(null)
  }
}

export async function saveOperatorSettings(
  settings: OperatorSettings,
): Promise<void> {
  if (!isTauriRuntime()) {
    try {
      window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
    } catch (error) {
      console.warn('Khong the luu kiosk settings vao localStorage.', error)
    }

    return
  }

  try {
    await getStore().set(SETTINGS_KEY, settings)
  } catch (error) {
    console.warn('Khong the luu kiosk settings vao Tauri store.', error)
  }
}
