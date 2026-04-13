import { randomUUID } from 'crypto'

import { createPendingCapture } from '../_lib/db.js'
import { CLOUD_SHARE_TTL_MS, getAppEnv } from '../_lib/env.js'
import {
  assertAllowedAppOrigin,
  badRequest,
  createRequestContext,
  handleApiError,
  jsonResponse,
  parseJsonBody,
} from '../_lib/http.js'
import { createSignedUploadUrl } from '../_lib/r2.js'

export const runtime = 'nodejs'

const MIN_CAPTURE_EDGE = 240
const CAPTURE_CONSTRAINTS = {
  photo: {
    mimeTypes: ['image/jpeg'],
    extensions: ['jpg', 'jpeg'],
    maxByteSize: 12 * 1024 * 1024,
    maxWidth: 4096,
    maxHeight: 4096,
  },
  boomerang: {
    mimeTypes: ['video/mp4'],
    extensions: ['mp4'],
    maxByteSize: 25 * 1024 * 1024,
    maxWidth: 2048,
    maxHeight: 2048,
  },
} as const

interface InitCaptureRequestBody {
  kind?: string
  mimeType?: string
  extension?: string
  byteSize?: number
  width?: number
  height?: number
}

export async function POST(request: Request): Promise<Response> {
  const requestContext = createRequestContext(request)

  try {
    const env = getAppEnv()
    assertAllowedAppOrigin(request, env.appBaseUrl)

    const body = await parseJsonBody<InitCaptureRequestBody>(request)
    const kind = parseCaptureKind(body.kind)
    const mimeType = parseMimeType(body.mimeType)
    const extension = parseExtension(body.extension)
    const byteSize = parsePositiveInteger(body.byteSize, 'Kích thước file')
    const width = parsePositiveInteger(body.width, 'Chiều rộng')
    const height = parsePositiveInteger(body.height, 'Chiều cao')

    validateCapturePayload(kind, mimeType, extension, byteSize, width, height)

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

    return jsonResponse(
      {
        captureId,
        storageKey,
        upload,
        expiresAt: expiresAt.toISOString(),
      },
      requestContext.requestId,
    )
  } catch (error) {
    return handleApiError(
      error,
      'Không thể khởi tạo phiên upload cloud.',
      requestContext,
    )
  }
}

function parseCaptureKind(value?: string): 'photo' | 'boomerang' {
  if (value === 'photo' || value === 'boomerang') {
    return value
  }

  badRequest('Loại capture không hợp lệ.', 'invalid_capture_kind')
}

function parseMimeType(value?: string): string {
  const normalized = value?.trim().toLowerCase()

  if (!normalized) {
    badRequest(
      'Thiếu MIME type của file capture.',
      'missing_capture_mime_type',
    )
  }

  return normalized
}

function parseExtension(value?: string): string {
  const normalized = value?.trim().toLowerCase().replace(/^\./, '') ?? ''
  const sanitized = normalized.replace(/[^a-z0-9]+/g, '')

  if (!sanitized) {
    badRequest(
      'Thiếu phần mở rộng file capture.',
      'missing_capture_extension',
    )
  }

  return sanitized
}

function parsePositiveInteger(value: number | undefined, label: string): number {
  if (!Number.isFinite(value) || !value || value <= 0) {
    badRequest(`${label} không hợp lệ.`, 'invalid_capture_dimension')
  }

  return Math.max(1, Math.round(value))
}

function validateCapturePayload(
  kind: 'photo' | 'boomerang',
  mimeType: string,
  extension: string,
  byteSize: number,
  width: number,
  height: number,
): void {
  const constraints = CAPTURE_CONSTRAINTS[kind]

  if (!constraints.mimeTypes.some((allowedMimeType) => allowedMimeType === mimeType)) {
    badRequest(
      `MIME type ${mimeType} không hỗ trợ cho ${kind}.`,
      'invalid_capture_mime_type',
    )
  }

  if (!constraints.extensions.some((allowedExtension) => allowedExtension === extension)) {
    badRequest(
      `Phần mở rộng .${extension} không hỗ trợ cho ${kind}.`,
      'invalid_capture_extension',
    )
  }

  if (byteSize > constraints.maxByteSize) {
    badRequest(
      `File capture vượt quá giới hạn ${Math.round(
        constraints.maxByteSize / (1024 * 1024),
      )} MB cho ${kind}.`,
      'capture_payload_too_large',
    )
  }

  if (width < MIN_CAPTURE_EDGE || height < MIN_CAPTURE_EDGE) {
    badRequest(
      'Kích thước capture quá nhỏ cho booth hiện tại.',
      'capture_dimensions_too_small',
    )
  }

  if (width > constraints.maxWidth || height > constraints.maxHeight) {
    badRequest(
      `Kích thước capture vượt ngưỡng cho ${kind}.`,
      'capture_dimensions_exceeded',
    )
  }
}

function buildStorageKey(
  kind: 'photo' | 'boomerang',
  captureId: string,
  extension: string,
): string {
  const dateFolder = new Date().toISOString().slice(0, 10)

  return `captures/${kind}/${dateFolder}/${captureId}.${extension}`
}
