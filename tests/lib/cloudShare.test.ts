import { afterEach, describe, expect, it, vi } from 'vitest'

describe('cloudShare client error parsing', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    delete (globalThis as typeof globalThis & { window?: unknown }).window
  })

  it('surfaces plain-text backend errors without reading the body twice', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response('Backend exploded', {
          status: 500,
          headers: {
            'content-type': 'text/plain',
          },
        }),
      ),
    )

    const { initCloudCaptureSession } = await import('../../src/lib/cloudShare')

    await expect(
      initCloudCaptureSession([
        {
          sequence: 1,
          kind: 'photo',
          mimeType: 'image/jpeg',
          extension: 'jpg',
          byteSize: 1200,
          width: 1600,
          height: 1200,
        },
      ]),
    ).rejects.toThrow('Backend exploded')
  })

  it('shows a localhost guidance message when using Vite-only runtime', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response('Cannot POST /api/capture-sessions/init', {
          status: 404,
          headers: {
            'content-type': 'text/plain',
          },
        }),
      ),
    )

    ;(globalThis as typeof globalThis & {
      window?: {
        location: {
          hostname: string
          port: string
          origin: string
        }
      }
    }).window = {
      location: {
        hostname: 'localhost',
        port: '5173',
        origin: 'http://localhost:5173',
      },
    }

    const { initCloudCaptureSession } = await import('../../src/lib/cloudShare')

    await expect(
      initCloudCaptureSession([
        {
          sequence: 1,
          kind: 'photo',
          mimeType: 'image/jpeg',
          extension: 'jpg',
          byteSize: 1200,
          width: 1600,
          height: 1200,
        },
      ]),
    ).rejects.toThrow(/vercel dev|VITE_CLOUD_SHARE_API_BASE/i)
  })
})

