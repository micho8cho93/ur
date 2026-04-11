import type { StoredAdminSession } from '../types/auth'

const SESSION_STORAGE_KEY = 'ur-internals.admin-session'
let inMemorySession: StoredAdminSession | null = null

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

function getSessionStorage(): Storage | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

function clearLegacyLocalStorageSession() {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.removeItem(SESSION_STORAGE_KEY)
  } catch {
    // Ignore storage exceptions in restricted browser contexts.
  }
}

export function readStoredAdminSession(): StoredAdminSession | null {
  if (inMemorySession) {
    return inMemorySession
  }

  const sessionStorage = getSessionStorage()
  if (!sessionStorage) {
    return null
  }

  const readFromStorage = (rawValue: string | null): StoredAdminSession | null => {
    if (!rawValue) {
      return null
    }

    try {
      return normalizeStoredSession(JSON.parse(rawValue))
    } catch {
      return null
    }
  }

  const sessionStorageValue = readFromStorage(sessionStorage.getItem(SESSION_STORAGE_KEY))
  if (sessionStorageValue) {
    inMemorySession = sessionStorageValue
    clearLegacyLocalStorageSession()
    return sessionStorageValue
  }

  sessionStorage.removeItem(SESSION_STORAGE_KEY)

  // One-time migration/cleanup for legacy sessions that used localStorage.
  let migratedValue: StoredAdminSession | null = null
  try {
    migratedValue = readFromStorage(window.localStorage.getItem(SESSION_STORAGE_KEY))
  } catch {
    migratedValue = null
  }
  clearLegacyLocalStorageSession()

  if (!migratedValue) {
    return null
  }

  inMemorySession = migratedValue
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(migratedValue))
  return migratedValue
}

export function writeStoredAdminSession(value: StoredAdminSession | null): StoredAdminSession | null {
  const session = normalizeStoredSession(value)
  inMemorySession = session

  const sessionStorage = getSessionStorage()
  if (sessionStorage) {
    if (session) {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
    } else {
      sessionStorage.removeItem(SESSION_STORAGE_KEY)
    }
  }

  clearLegacyLocalStorageSession()
  return session
}

export function clearStoredAdminSession() {
  inMemorySession = null
  const sessionStorage = getSessionStorage()
  if (sessionStorage) {
    sessionStorage.removeItem(SESSION_STORAGE_KEY)
  }
  clearLegacyLocalStorageSession()
}

export function readStoredSessionToken(): string | null {
  return readStoredAdminSession()?.token ?? null
}
