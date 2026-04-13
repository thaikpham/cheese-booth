import { useCallback, useEffect, useRef, type Dispatch, type SetStateAction } from 'react'

import type { CaptureMode, CaptureOutcome } from '../types'
import {
  completeCloudCaptureShare,
  initCloudCaptureShare,
  uploadCaptureToSignedUrl,
} from '../lib/cloudShare'
import type { RenderedCapture } from '../lib/media'

export const BROWSER_CLOUD_STORAGE_LABEL = 'Cloudflare R2 private bucket'
export const BROWSER_CLOUD_STORAGE_PENDING_LABEL =
  `${BROWSER_CLOUD_STORAGE_LABEL} · link QR 24h đang được tạo`

export interface PendingCloudShareUpload extends RenderedCapture {
  kind: CaptureMode
}

interface UseCaptureCloudShareOptions {
  setCaptureOutcome: Dispatch<SetStateAction<CaptureOutcome | null>>
}

interface UseCaptureCloudShareResult {
  resetCaptureOutcomeShare: () => void
  startBrowserCloudShare: (payload: PendingCloudShareUpload) => void
  retryCaptureOutcomeShare: () => void
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError'
}

export function useCaptureCloudShare({
  setCaptureOutcome,
}: UseCaptureCloudShareOptions): UseCaptureCloudShareResult {
  const shareAbortRef = useRef<AbortController | null>(null)
  const shareJobIdRef = useRef(0)
  const latestBrowserShareRef = useRef<PendingCloudShareUpload | null>(null)

  useEffect(() => {
    return () => {
      shareAbortRef.current?.abort()
    }
  }, [])

  const resetCaptureOutcomeShare = useCallback(() => {
    shareJobIdRef.current += 1
    shareAbortRef.current?.abort()
    shareAbortRef.current = null
    latestBrowserShareRef.current = null
  }, [])

  const beginBrowserCloudShare = useCallback(
    async (jobId: number, payload: PendingCloudShareUpload): Promise<void> => {
      const controller = new AbortController()

      shareAbortRef.current?.abort()
      shareAbortRef.current = controller

      try {
        const init = await initCloudCaptureShare(
          {
            kind: payload.kind,
            mimeType: payload.mimeType,
            extension: payload.extension,
            byteSize: payload.blob.size,
            width: payload.width,
            height: payload.height,
          },
          controller.signal,
        )

        await uploadCaptureToSignedUrl(init.upload, payload.blob, controller.signal)

        const complete = await completeCloudCaptureShare(init.captureId, controller.signal)

        if (shareJobIdRef.current !== jobId) {
          return
        }

        setCaptureOutcome((current) => {
          if (!current) {
            return current
          }

          return {
            ...current,
            savedPath: BROWSER_CLOUD_STORAGE_LABEL,
            share: {
              status: 'ready',
              downloadToken: complete.downloadToken,
              downloadUrl: complete.downloadUrl,
              expiresAt: complete.expiresAt,
            },
          }
        })
      } catch (error) {
        if (shareJobIdRef.current !== jobId || isAbortError(error)) {
          return
        }

        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Không thể tạo link tải QR lúc này.'

        setCaptureOutcome((current) => {
          if (!current) {
            return current
          }

          return {
            ...current,
            share: {
              status: 'error',
              errorMessage,
            },
          }
        })
      } finally {
        if (shareAbortRef.current === controller) {
          shareAbortRef.current = null
        }
      }
    },
    [setCaptureOutcome],
  )

  const startBrowserCloudShare = useCallback(
    (payload: PendingCloudShareUpload) => {
      latestBrowserShareRef.current = payload
      shareJobIdRef.current += 1
      const jobId = shareJobIdRef.current

      void beginBrowserCloudShare(jobId, payload)
    },
    [beginBrowserCloudShare],
  )

  const retryCaptureOutcomeShare = useCallback(() => {
    const payload = latestBrowserShareRef.current

    if (!payload) {
      return
    }

    setCaptureOutcome((current) => {
      if (!current) {
        return current
      }

      return {
        ...current,
        savedPath: BROWSER_CLOUD_STORAGE_PENDING_LABEL,
        share: {
          status: 'uploading',
        },
      }
    })

    startBrowserCloudShare(payload)
  }, [setCaptureOutcome, startBrowserCloudShare])

  return {
    resetCaptureOutcomeShare,
    startBrowserCloudShare,
    retryCaptureOutcomeShare,
  }
}
