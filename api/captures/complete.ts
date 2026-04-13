import { randomBytes } from 'crypto'

import {
  type CaptureDownloadRecord,
  findCaptureById,
  markCaptureReady,
} from '../_lib/db.js'
import { getAppEnv } from '../_lib/env.js'
import {
  badRequest,
  conflict,
  handleApiError,
  notFound,
  parseJsonBody,
} from '../_lib/http.js'
import { verifyObjectExists } from '../_lib/r2.js'

export const runtime = 'nodejs'

interface CompleteCaptureRequestBody {
  captureId?: string
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await parseJsonBody<CompleteCaptureRequestBody>(request)
    const captureId = body.captureId?.trim()

    if (!captureId) {
      badRequest('Thiếu captureId để hoàn tất upload.')
    }

    const capture = await findCaptureById(captureId)

    if (!capture) {
      notFound('Capture không tồn tại.')
    }

    if (capture.status === 'deleted') {
      notFound('Capture đã bị xóa hoặc hết hạn.')
    }

    if (capture.status === 'ready' && capture.download_token) {
      return Response.json(toCompleteResponse(capture))
    }

    if (capture.status !== 'pending_upload') {
      conflict('Capture hiện không ở trạng thái chờ upload.')
    }

    const uploaded = await verifyObjectExists(capture.storage_key)

    if (!uploaded) {
      conflict('Upload chưa hoàn tất trên object storage.')
    }

    const readyCapture = await markCaptureReady(
      captureId,
      randomBytes(24).toString('base64url'),
    )

    if (!readyCapture) {
      const latestCapture = await findCaptureById(captureId)

      if (latestCapture?.status === 'ready' && latestCapture.download_token) {
        return Response.json(toCompleteResponse(latestCapture))
      }

      conflict('Không thể hoàn tất phiên upload hiện tại.')
    }

    return Response.json(toCompleteResponse(readyCapture))
  } catch (error) {
    return handleApiError(error, 'Không thể hoàn tất upload cloud.')
  }
}

function toCompleteResponse(capture: CaptureDownloadRecord): {
  downloadToken: string
  downloadUrl: string
  expiresAt: string
} {
  if (!capture.download_token) {
    conflict('Capture chưa có download token hợp lệ.')
  }

  const expiresAt =
    capture.expires_at instanceof Date
      ? capture.expires_at.toISOString()
      : new Date(capture.expires_at).toISOString()

  return {
    downloadToken: capture.download_token,
    downloadUrl: `${getAppEnv().appBaseUrl}/${capture.download_token}`,
    expiresAt,
  }
}
