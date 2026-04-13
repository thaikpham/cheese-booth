export class HttpError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'HttpError'
    this.status = status
  }
}

export async function parseJsonBody<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T
  } catch {
    throw new HttpError(400, 'Payload JSON không hợp lệ.')
  }
}

export function badRequest(message: string): never {
  throw new HttpError(400, message)
}

export function unauthorized(message: string): never {
  throw new HttpError(401, message)
}

export function notFound(message: string): never {
  throw new HttpError(404, message)
}

export function conflict(message: string): never {
  throw new HttpError(409, message)
}

export function gone(message: string): never {
  throw new HttpError(410, message)
}

export function errorResponse(message: string, status: number): Response {
  return Response.json({ error: message }, { status })
}

function isDatabaseConnectivityError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false
  }

  const maybeCode = (error as Error & { code?: string }).code
  const normalizedMessage = error.message.toLowerCase()

  return (
    maybeCode === 'CONNECT_TIMEOUT' ||
    maybeCode === 'ECONNREFUSED' ||
    maybeCode === 'ENOTFOUND' ||
    maybeCode === 'EHOSTUNREACH' ||
    maybeCode === 'ETIMEDOUT' ||
    normalizedMessage.includes('connect_timeout') ||
    normalizedMessage.includes('econnrefused') ||
    normalizedMessage.includes('connection terminated unexpectedly')
  )
}

export function handleApiError(
  error: unknown,
  fallbackMessage: string,
): Response {
  if (error instanceof HttpError) {
    return errorResponse(error.message, error.status)
  }

  console.error(fallbackMessage, error)

  if (isDatabaseConnectivityError(error)) {
    return errorResponse(
      'Cloud share backend chưa kết nối được database. Hãy kiểm tra `POSTGRES_URL` hoặc `DATABASE_URL` và kết nối Postgres từ môi trường hiện tại.',
      500,
    )
  }

  return errorResponse(
    error instanceof Error && error.message ? error.message : fallbackMessage,
    500,
  )
}
