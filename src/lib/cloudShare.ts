import type { CaptureMode } from '../types'

export interface CloudShareUploadDescriptor {
  url: string
  method: 'PUT'
  headers: Record<string, string>
}

export interface InitCloudCaptureShareInput {
  kind: CaptureMode
  mimeType: string
  extension: string
  byteSize: number
  width: number
  height: number
}

export interface InitCloudCaptureShareResponse {
  captureId: string
  storageKey: string
  upload: CloudShareUploadDescriptor
  expiresAt: string
}

export interface CompleteCloudCaptureShareResponse {
  downloadToken: string
  downloadUrl: string
  expiresAt: string
}

export interface InitCloudCaptureSessionItemInput {
  kind: CaptureMode
  mimeType: string
  extension: string
  byteSize: number
  width: number
  height: number
  sequence: number
}

export interface InitCloudCaptureSessionResponse {
  sessionId: string
  expiresAt: string
  items: Array<{
    captureId: string
    sequence: number
    upload: CloudShareUploadDescriptor
  }>
}

export interface CompleteCloudCaptureSessionResponse {
  downloadToken: string
  galleryUrl: string
  expiresAt: string
}

export interface CloudCaptureSessionGalleryItem {
  captureId: string
  sequence: number
  kind: CaptureMode
  mimeType: string
  extension: string
  width: number
  height: number
  previewUrl: string
  downloadUrl: string
}

export interface CloudCaptureSessionGalleryResponse {
  sessionId: string
  downloadToken: string
  expiresAt: string
  createdAt: string
  items: CloudCaptureSessionGalleryItem[]
}

type CloudShareRequestStage = 'init' | 'upload' | 'complete'

function getCloudShareApiBase(): string {
  const configuredBase = import.meta.env.VITE_CLOUD_SHARE_API_BASE?.trim()

  if (configuredBase) {
    return configuredBase.replace(/\/+$/, '')
  }

  if (typeof window === 'undefined') {
    return ''
  }

  return window.location.origin.replace(/\/+$/, '')
}

function resolveApiUrl(path: string): string {
  const base = getCloudShareApiBase()

  return base ? `${base}${path}` : path
}

export function resolveCloudShareApiUrl(path: string): string {
  return resolveApiUrl(path)
}

function isLocalhostBrowserRuntime(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  const { hostname } = window.location

  return hostname === 'localhost' || hostname === '127.0.0.1'
}

function isLikelyViteOnlyLocalRuntime(): boolean {
  if (!isLocalhostBrowserRuntime() || typeof window === 'undefined') {
    return false
  }

  const configuredBase = import.meta.env.VITE_CLOUD_SHARE_API_BASE?.trim()

  if (configuredBase) {
    return false
  }

  return window.location.port === '5173'
}

function isFetchNetworkError(error: unknown): boolean {
  return (
    error instanceof TypeError ||
    (error instanceof Error &&
      /failed to fetch|fetch failed|networkerror/i.test(error.message))
  )
}

function toCloudShareNetworkError(
  stage: CloudShareRequestStage,
  error: unknown,
): Error {
  if (!isFetchNetworkError(error)) {
    return error instanceof Error
      ? error
      : new Error('Cloud share gặp lỗi mạng không xác định.')
  }

  if (stage === 'upload') {
    return new Error(
      isLocalhostBrowserRuntime()
        ? 'Upload lên Cloudflare R2 bị chặn ở mức mạng. Hãy kiểm tra CORS của bucket cho origin hiện tại, method `PUT`, header `Content-Type`, đồng thời xác nhận `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` thật sự có quyền ghi vào bucket.'
        : 'Upload lên Cloudflare R2 bị chặn ở mức mạng. Hãy kiểm tra CORS của bucket, method `PUT`, header `Content-Type`, và quyền ghi của access key vào bucket.',
    )
  }

  if (isLikelyViteOnlyLocalRuntime()) {
    return new Error(
      'Cloud share API chưa sẵn sàng trên localhost Vite hiện tại. Với flow QR, hãy chạy `vercel dev` tại `http://localhost:3000` hoặc cấu hình `VITE_CLOUD_SHARE_API_BASE` trỏ tới một origin đang có Vercel Functions.',
    )
  }

  return new Error(
    stage === 'init'
      ? 'Không thể kết nối cloud share API để khởi tạo upload. Hãy kiểm tra `vercel dev` hoặc backend Vercel Functions.'
      : 'Không thể kết nối cloud share API để hoàn tất upload. Hãy kiểm tra `vercel dev`, database, và backend Vercel Functions.',
  )
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  if (response.ok) {
    return (await response.json()) as T
  }

  let message = 'Không thể kết nối cloud share API.'
  const contentType = response.headers.get('content-type') ?? ''

  if (contentType.includes('text/html')) {
    throw new Error(
      'Cloud share API chưa sẵn sàng trên runtime hiện tại. Hãy dùng Vercel deployment hoặc vercel dev.',
    )
  }

   if (
    isLikelyViteOnlyLocalRuntime() &&
    (response.status === 404 || response.status === 405)
  ) {
    throw new Error(
      'Bạn đang chạy UI bằng `npm run dev` trên Vite localhost nên browser session không có Vercel Functions `/api/*` để upload cloud và tạo QR. Hãy chạy `vercel dev` tại `http://localhost:3000` hoặc cấu hình `VITE_CLOUD_SHARE_API_BASE` trỏ tới backend đang có cloud-share API.',
    )
  }

  const responseText = await response.text()

  if (responseText.trim()) {
    try {
      const payload = JSON.parse(responseText) as { error?: string }

      if (payload.error?.trim()) {
        message = payload.error
      } else {
        message = responseText
      }
    } catch {
      message = responseText
    }
  }

  throw new Error(message)
}

export async function initCloudCaptureShare(
  payload: InitCloudCaptureShareInput,
  signal?: AbortSignal,
): Promise<InitCloudCaptureShareResponse> {
  let response: Response

  try {
    response = await fetch(resolveApiUrl('/api/captures/init'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal,
    })
  } catch (error) {
    throw toCloudShareNetworkError('init', error)
  }

  return parseJsonResponse<InitCloudCaptureShareResponse>(response)
}

export async function uploadCaptureToSignedUrl(
  upload: CloudShareUploadDescriptor,
  blob: Blob,
  signal?: AbortSignal,
): Promise<void> {
  let response: Response

  try {
    response = await fetch(upload.url, {
      method: upload.method,
      headers: upload.headers,
      body: blob,
      signal,
    })
  } catch (error) {
    throw toCloudShareNetworkError('upload', error)
  }

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error(
        'Cloudflare R2 từ chối upload (HTTP 403). Hãy kiểm tra quyền `PutObject` của access key hiện tại, bucket đích, và CORS cho origin đang dùng.',
      )
    }

    throw new Error(`Upload file lên cloud thất bại (HTTP ${response.status}).`)
  }
}

export async function completeCloudCaptureShare(
  captureId: string,
  signal?: AbortSignal,
): Promise<CompleteCloudCaptureShareResponse> {
  let response: Response

  try {
    response = await fetch(resolveApiUrl('/api/captures/complete'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ captureId }),
      signal,
    })
  } catch (error) {
    throw toCloudShareNetworkError('complete', error)
  }

  return parseJsonResponse<CompleteCloudCaptureShareResponse>(response)
}

export async function initCloudCaptureSession(
  items: InitCloudCaptureSessionItemInput[],
  signal?: AbortSignal,
): Promise<InitCloudCaptureSessionResponse> {
  let response: Response

  try {
    response = await fetch(resolveApiUrl('/api/capture-sessions/init'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ items }),
      signal,
    })
  } catch (error) {
    throw toCloudShareNetworkError('init', error)
  }

  return parseJsonResponse<InitCloudCaptureSessionResponse>(response)
}

export async function completeCloudCaptureSession(
  sessionId: string,
  signal?: AbortSignal,
): Promise<CompleteCloudCaptureSessionResponse> {
  let response: Response

  try {
    response = await fetch(resolveApiUrl('/api/capture-sessions/complete'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionId }),
      signal,
    })
  } catch (error) {
    throw toCloudShareNetworkError('complete', error)
  }

  return parseJsonResponse<CompleteCloudCaptureSessionResponse>(response)
}

export async function fetchCloudCaptureSessionGallery(
  token: string,
  signal?: AbortSignal,
): Promise<CloudCaptureSessionGalleryResponse> {
  let response: Response

  try {
    response = await fetch(
      resolveApiUrl(
        `/api/capture-sessions/gallery?token=${encodeURIComponent(token)}`,
      ),
      {
        method: 'GET',
        signal,
      },
    )
  } catch (error) {
    throw toCloudShareNetworkError('complete', error)
  }

  return parseJsonResponse<CloudCaptureSessionGalleryResponse>(response)
}
