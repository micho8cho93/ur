import { readStoredSessionToken } from '../auth/sessionStorage'
import env from '../config/env'
import { asRecord } from './runtime'

export const SESSION_REQUIRED_MESSAGE = 'Admin login required.'

export class ApiError extends Error {
  status: number
  details?: unknown

  constructor(message: string, status: number, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

async function parseResponse(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return null
  }

  const contentType = response.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    return response.json()
  }

  return response.text()
}

function tryParseJsonString<T>(value: string): T | string {
  const trimmed = value.trim()
  if (trimmed.length === 0) {
    return value
  }

  if (!['{', '[', '"'].includes(trimmed[0])) {
    return value
  }

  try {
    return JSON.parse(trimmed) as T
  } catch {
    return value
  }
}

function unwrapRpcPayload<T>(payload: unknown): T {
  if (typeof payload === 'string') {
    return tryParseJsonString<T>(payload) as T
  }

  const record = asRecord(payload)
  if (record && typeof record.payload === 'string') {
    return tryParseJsonString<T>(record.payload) as T
  }

  return payload as T
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), env.requestTimeoutMs)

  try {
    const response = await fetch(new URL(path, env.nakamaBaseUrl), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init.headers ?? {}),
      },
      signal: controller.signal,
    })

    const payload = await parseResponse(response)

    if (!response.ok) {
      const payloadRecord = asRecord(payload)
      const message =
        typeof payloadRecord?.message === 'string'
          ? payloadRecord.message
          : `Request failed with status ${response.status}`
      throw new ApiError(message, response.status, payload)
    }

    return payload as T
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError('Request timed out', 408)
    }

    throw new ApiError('Network request failed', 500, error)
  } finally {
    window.clearTimeout(timeoutId)
  }
}

export async function callRpc<T>(
  endpoint: string,
  payload: Record<string, unknown> = {},
  sessionToken = readStoredSessionToken(),
): Promise<T> {
  if (!sessionToken) {
    throw new ApiError(SESSION_REQUIRED_MESSAGE, 401)
  }

  const response = await apiRequest<unknown>(
    `/v2/rpc/${encodeURIComponent(endpoint)}?unwrap=true`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${sessionToken}`,
      },
      body: JSON.stringify(payload),
    },
  )

  return unwrapRpcPayload<T>(response)
}
