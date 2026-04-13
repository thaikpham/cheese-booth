import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  applyCloudShareEnv,
  createJsonRequest,
  readJson,
  resetCloudShareEnv,
} from './test-helpers'

describe('api/cron/cleanup-expired', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.doUnmock('../../api/_lib/db.js')
    vi.doUnmock('../../api/_lib/r2.js')
    resetCloudShareEnv()
  })

  it('fails closed when CRON_SECRET is missing', async () => {
    applyCloudShareEnv({
      CRON_SECRET: '',
    })

    vi.doMock('../../api/_lib/db.js', () => ({
      listExpiredCaptures: vi.fn(async () => []),
      markCaptureDeleted: vi.fn(async () => undefined),
    }))
    vi.doMock('../../api/_lib/r2.js', () => ({
      deleteObjectIfExists: vi.fn(async () => undefined),
    }))

    const { GET } = await import('../../api/cron/cleanup-expired.ts')
    const response = await GET(
      createJsonRequest('https://cheesebooth.vercel.app/api/cron/cleanup-expired', {
        method: 'GET',
      }),
    )

    const payload = await readJson<{ code: string }>(response)

    expect(response.status).toBe(503)
    expect(payload.code).toBe('cron_secret_missing')
  })

  it('rejects an invalid cleanup secret', async () => {
    applyCloudShareEnv()

    vi.doMock('../../api/_lib/db.js', () => ({
      listExpiredCaptures: vi.fn(async () => []),
      markCaptureDeleted: vi.fn(async () => undefined),
    }))
    vi.doMock('../../api/_lib/r2.js', () => ({
      deleteObjectIfExists: vi.fn(async () => undefined),
    }))

    const { GET } = await import('../../api/cron/cleanup-expired.ts')
    const response = await GET(
      createJsonRequest('https://cheesebooth.vercel.app/api/cron/cleanup-expired', {
        method: 'GET',
        headers: {
          authorization: 'Bearer wrong-secret',
        },
      }),
    )

    const payload = await readJson<{ code: string }>(response)

    expect(response.status).toBe(401)
    expect(payload.code).toBe('invalid_cron_secret')
  })
})
