import { findCaptureByToken } from './_lib/db'
import { gone, handleApiError, notFound } from './_lib/http'
import { createSignedDownloadUrl } from './_lib/r2'

export const runtime = 'nodejs'

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{32}$/

export async function GET(request: Request): Promise<Response> {
  try {
    const token = new URL(request.url).searchParams.get('token')?.trim()

    if (!token || !TOKEN_PATTERN.test(token)) {
      notFound('Link tải không hợp lệ.')
    }

    const capture = await findCaptureByToken(token)

    if (!capture) {
      notFound('Link tải không tồn tại.')
    }

    if (
      capture.status === 'deleted' ||
      new Date(capture.expires_at).getTime() <= Date.now()
    ) {
      gone('Link tải đã hết hạn.')
    }

    if (capture.status !== 'ready') {
      notFound('Link tải chưa sẵn sàng.')
    }

    const downloadUrl = await createSignedDownloadUrl({
      storageKey: capture.storage_key,
      mimeType: capture.mime_type,
      downloadFileName: `${capture.kind}-${capture.capture_id}.${capture.extension}`,
    })

    return Response.redirect(downloadUrl, 302)
  } catch (error) {
    return handleApiError(error, 'Không thể tạo download link tạm thời.')
  }
}
