import type { StoredAdminSession } from '../types/auth'

const SESSION_STORAGE_KEY = 'ur-internals.admin-session'

function normalizeToken(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function normalizeStoredSession(value: unknown): StoredAdminSession | null {
  if (typeof value !== 'object' || value === null) {
    return null
  }

  const record = value as Record<string, unknown>
  const token = normalizeToken(record.token)
  const refreshToken = normalizeToken(record.refreshToken)

  if (!token || !refreshToken) {
    return null
  }

  return {
    token,
    refreshToken,
  }
}

export function readStoredAdminSession(): StoredAdminSession | null {
  if (typeof window === 'undefined') {
    return null
  }

  const rawValue = window.localStorage.getItem(SESSION_STORAGE_KEY)
  if (!rawValue) {
    return null
  }

  try {
    return normalizeStoredSession(JSON.parse(rawValue))
  } catch {
    window.localStorage.removeItem(SESSION_STORAGE_KEY)
    return null
  }
}

export function writeStoredAdminSession(value: StoredAdminSession | null): StoredAdminSession | null {
  const session = normalizeStoredSession(value)

  if (typeof window !== 'undefined') {
    if (session) {
      window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
    } else {
      window.localStorage.removeItem(SESSION_STORAGE_KEY)
    }
  }

  return session
}

export function clearStoredAdminSession() {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(SESSION_STORAGE_KEY)
}

export function readStoredSessionToken(): string | null {
  return readStoredAdminSession()?.token ?? null
}
