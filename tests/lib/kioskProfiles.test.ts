import { describe, expect, it } from 'vitest'

import {
  DEFAULT_KIOSK_PROFILE,
  getKioskPreviewAspect,
  getKioskProfileAspectLabel,
  getKioskRotationOptions,
  normalizeOperatorSettingsForProfile,
  sanitizeRotationQuarterForProfile,
} from '../../src/lib/kioskProfiles'
import { getDefaultOperatorSettings } from '../../src/lib/kioskProfiles'

describe('kioskProfiles portrait policy', () => {
  it('uses portrait as the default kiosk profile', () => {
    expect(DEFAULT_KIOSK_PROFILE).toBe('portrait')
  })

  it('keeps portrait preview/output on a 3:4 profile contract', () => {
    expect(getKioskPreviewAspect('portrait')).toBe('3 / 4')
    expect(getKioskProfileAspectLabel('portrait')).toBe('3:4')
  })

  it('locks portrait rotation to the portrait-safe preset', () => {
    expect(getKioskRotationOptions('portrait')).toEqual([1])
    expect(sanitizeRotationQuarterForProfile('portrait', 0)).toBe(1)
    expect(sanitizeRotationQuarterForProfile('portrait', 2)).toBe(1)
    expect(sanitizeRotationQuarterForProfile('portrait', 3)).toBe(1)
  })

  it('preserves landscape rotation freedom', () => {
    expect(getKioskRotationOptions('landscape')).toEqual([0, 1, 2, 3])
    expect(sanitizeRotationQuarterForProfile('landscape', 3)).toBe(3)
  })

  it('normalizes portrait settings without mutating the rest of the profile', () => {
    expect(
      normalizeOperatorSettingsForProfile('portrait', {
        ...getDefaultOperatorSettings('portrait'),
        deviceId: 'portrait-cam',
        rotationQuarter: 3,
        flipHorizontal: false,
      }),
    ).toEqual({
      ...getDefaultOperatorSettings('portrait'),
      deviceId: 'portrait-cam',
      rotationQuarter: 1,
      flipHorizontal: false,
    })
  })
})
