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

export async function authenticateWithUsername(username: string, password: string): Promise<Session> {
  const normalizedUsername = username.trim()

  if (normalizedUsername !== TEST_ADMIN_USERNAME || password !== TEST_ADMIN_PASSWORD) {
    throw new Error('Invalid username or password.')
  }

  const session = await getClient().authenticateCustom(
    TEST_ADMIN_CUSTOM_ID,
    true,
    TEST_ADMIN_USERNAME,
  )
  persistSession(session)
  return session
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
