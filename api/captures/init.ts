import { randomUUID } from 'crypto'

import { createPendingCapture } from '../_lib/db.js'
import { CLOUD_SHARE_TTL_MS } from '../_lib/env.js'
import { badRequest, handleApiError, parseJsonBody } from '../_lib/http.js'
import { createSignedUploadUrl } from '../_lib/r2.js'

export const runtime = 'nodejs'

interface InitCaptureRequestBody {
  kind?: string
  mimeType?: string
  extension?: string
  byteSize?: number
  width?: number
  height?: number
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await parseJsonBody<InitCaptureRequestBody>(request)
    const kind = parseCaptureKind(body.kind)
    const mimeType = parseMimeType(body.mimeType)
    const extension = parseExtension(body.extension)
    const byteSize = parsePositiveInteger(body.byteSize, 'Kích thước file')
    const width = parsePositiveInteger(body.width, 'Chiều rộng')
    const height = parsePositiveInteger(body.height, 'Chiều cao')

    const captureId = randomUUID()
    const expiresAt = new Date(Date.now() + CLOUD_SHARE_TTL_MS)
    const storageKey = buildStorageKey(kind, captureId, extension)

    await createPendingCapture({
      captureId,
      kind,
      storageKey,
      mimeType,
      extension,
      byteSize,
      width,
      height,
      expiresAt,
    })

    const upload = await createSignedUploadUrl(storageKey, mimeType)

    return Response.json({
      captureId,
      storageKey,
      upload,
      expiresAt: expiresAt.toISOString(),
    })
  } catch (error) {
    return handleApiError(error, 'Không thể khởi tạo phiên upload cloud.')
  }
}

function parseCaptureKind(value?: string): 'photo' | 'boomerang' {
  if (value === 'photo' || value === 'boomerang') {
    return value
  }

  badRequest('Loại capture không hợp lệ.')
}

function parseMimeType(value?: string): string {
  const normalized = value?.trim()

  if (!normalized) {
    badRequest('Thiếu MIME type của file capture.')
  }

  return normalized
}

function parseExtension(value?: string): string {
  const normalized = value?.trim().toLowerCase().replace(/^\./, '') ?? ''
  const sanitized = normalized.replace(/[^a-z0-9]+/g, '')

  if (!sanitized) {
    badRequest('Thiếu phần mở rộng file capture.')
  }

  return sanitized
}

function parsePositiveInteger(value: number | undefined, label: string): number {
  if (!Number.isFinite(value) || !value || value <= 0) {
    badRequest(`${label} không hợp lệ.`)
  }

  return Math.max(1, Math.round(value))
}

function buildStorageKey(
  kind: 'photo' | 'boomerang',
  captureId: string,
  extension: string,
): string {
  const dateFolder = new Date().toISOString().slice(0, 10)

  return `captures/${kind}/${dateFolder}/${captureId}.${extension}`
}
