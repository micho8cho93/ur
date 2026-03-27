import { Client, Session } from '@heroiclabs/nakama-js'
import env from '../config/env'
import { clearStoredAdminSession, readStoredAdminSession, writeStoredAdminSession } from './sessionStorage'

let client: Client | null = null

const TEST_ADMIN_USERNAME = 'admin'
const TEST_ADMIN_PASSWORD = 'password'
const TEST_ADMIN_CUSTOM_ID = 'ur-internals-admin'

function getClient() {
  if (!client) {
    client = new Client(
      env.nakamaServerKey,
      env.nakamaHost,
      String(env.nakamaPort),
      env.nakamaUseSSL,
      env.requestTimeoutMs,
    )
  }

  return client
}

function persistSession(session: Session) {
  writeStoredAdminSession({
    token: session.token,
    refreshToken: session.refresh_token,
  })
}

function isResponseLike(error: unknown): error is Response {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    typeof error.status === 'number' &&
    'headers' in error &&
    typeof error.headers === 'object' &&
    error.headers !== null &&
    'clone' in error &&
    typeof error.clone === 'function'
  )
}

async function readResponsePayload(response: Response): Promise<unknown> {
  const cloned = response.clone()
  const contentType = cloned.headers.get('content-type') ?? ''

  try {
    if (contentType.includes('application/json')) {
      return await cloned.json()
    }

    return await cloned.text()
  } catch {
    return null
  }
}

function readPayloadMessage(payload: unknown): string | null {
  if (typeof payload === 'string' && payload.trim().length > 0) {
    return payload.trim()
  }

  if (typeof payload !== 'object' || payload === null) {
    return null
  }

  const record = payload as Record<string, unknown>
  const message = record.message
  return typeof message === 'string' && message.trim().length > 0 ? message.trim() : null
}

function buildInvalidServerKeyMessage() {
  return (
    `The configured Nakama server key is invalid for ${env.nakamaBaseUrl}. ` +
    'Set `VITE_NAKAMA_SERVER_KEY`, `VITE_NAKAMA_SOCKET_SERVER_KEY`, or ' +
    '`EXPO_PUBLIC_NAKAMA_SOCKET_SERVER_KEY` to the same value as `NAKAMA_SOCKET_SERVER_KEY` on the backend.'
  )
}

async function normalizeAuthenticationError(error: unknown): Promise<Error> {
  if (error instanceof Error) {
    return error
  }

  if (isResponseLike(error)) {
    const payload = await readResponsePayload(error)
    const payloadMessage = readPayloadMessage(payload)
    const authHeader = error.headers.get('www-authenticate')?.trim() ?? ''
    const combinedMessage = `${authHeader} ${payloadMessage ?? ''}`.trim().toLowerCase()

    if (combinedMessage.includes('server key invalid')) {
      return new Error(buildInvalidServerKeyMessage())
    }

    if (payloadMessage) {
      return new Error(payloadMessage)
    }

    if (authHeader) {
      return new Error(authHeader)
    }

    return new Error(`Nakama authentication failed with status ${error.status}.`)
  }

  return new Error('Unable to sign in to Nakama.')
}

export async function authenticateWithUsername(username: string, password: string): Promise<Session> {
  const normalizedUsername = username.trim()

  if (normalizedUsername !== TEST_ADMIN_USERNAME || password !== TEST_ADMIN_PASSWORD) {
    throw new Error('Invalid username or password.')
  }

  try {
    const session = await getClient().authenticateCustom(
      TEST_ADMIN_CUSTOM_ID,
      true,
      TEST_ADMIN_USERNAME,
    )
    persistSession(session)
    return session
  } catch (error) {
    throw await normalizeAuthenticationError(error)
  }
}

export async function restoreStoredNakamaSession(): Promise<Session | null> {
  const storedSession = readStoredAdminSession()
  if (!storedSession) {
    return null
  }

  try {
    const restored = Session.restore(storedSession.token, storedSession.refreshToken)

    if (restored.isexpired(Date.now() / 1000) && restored.refresh_token) {
      const refreshed = await getClient().sessionRefresh(restored)
      persistSession(refreshed)
      return refreshed
    }

    persistSession(restored)
    return restored
  } catch {
    clearStoredAdminSession()
    return null
  }
}

export async function clearNakamaSession() {
  clearStoredAdminSession()
}
