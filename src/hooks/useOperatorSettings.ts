import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'

import { loadOperatorSettings, saveOperatorSettings } from '../lib/settingsStore'
import { DEFAULT_OPERATOR_SETTINGS, type OperatorSettings } from '../types'

interface UseOperatorSettingsResult {
  settings: OperatorSettings
  settingsReady: boolean
  setSettings: Dispatch<SetStateAction<OperatorSettings>>
  updateSettings: (next: Partial<OperatorSettings>) => void
}

export function useOperatorSettings(): UseOperatorSettingsResult {
  const [settings, setSettings] = useState(DEFAULT_OPERATOR_SETTINGS)
  const [settingsReady, setSettingsReady] = useState(false)

  useEffect(() => {
    let active = true

    void loadOperatorSettings().then((loaded) => {
      if (!active) return
      setSettings(loaded)
      setSettingsReady(true)
    })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!settingsReady) return

    void saveOperatorSettings(settings)
  }, [settings, settingsReady])

  function updateSettings(next: Partial<OperatorSettings>): void {
    setSettings((current) => ({
      ...current,
      ...next,
    }))
  }

  return {
    settings,
    settingsReady,
    setSettings,
    updateSettings,
  }
}
