import { listExpiredCaptures, markCaptureDeleted } from '../_lib/db.js'
import { getAppEnv } from '../_lib/env.js'
import { handleApiError, unauthorized } from '../_lib/http.js'
import { deleteObjectIfExists } from '../_lib/r2.js'

export const runtime = 'nodejs'

const CLEANUP_BATCH_SIZE = 200
const MAX_BATCH_PASSES = 10

export async function GET(request: Request): Promise<Response> {
  try {
    authorizeCronRequest(request)

    let processed = 0
    let deleted = 0
    const failedCaptureIds: string[] = []

    for (let batchIndex = 0; batchIndex < MAX_BATCH_PASSES; batchIndex += 1) {
      const expiredCaptures = await listExpiredCaptures(CLEANUP_BATCH_SIZE)

      if (expiredCaptures.length === 0) {
        break
      }

      processed += expiredCaptures.length

      for (const capture of expiredCaptures) {
        try {
          await deleteObjectIfExists(capture.storage_key)
          await markCaptureDeleted(capture.capture_id)
          deleted += 1
        } catch (error) {
          console.error('Không thể cleanup capture hết hạn.', capture.capture_id, error)
          failedCaptureIds.push(capture.capture_id)
        }
      }
    }

    return Response.json({
      processed,
      deleted,
      failed: failedCaptureIds.length,
      failedCaptureIds: failedCaptureIds.slice(0, 20),
    })
  } catch (error) {
    return handleApiError(error, 'Không thể dọn capture hết hạn.')
  }
}

function authorizeCronRequest(request: Request): void {
  const cronSecret = getAppEnv().cronSecret

  if (!cronSecret) {
    return
  }

  if (request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    unauthorized('Unauthorized cron request.')
  }
}
