import { useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@heroiclabs/nakama-js'
import { getAdminWhoAmI } from '../api/auth'
import type { AdminIdentity } from '../types/auth'
import {
  authenticateWithEmail,
  authenticateWithGoogleIdToken,
  clearNakamaSession,
  requestGoogleIdToken,
  restoreStoredNakamaSession,
} from './nakama'
import { SessionContext } from './sessionContext'

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message
  }

  return fallback
}

function normalizeAuthError(error: unknown) {
  const message = getErrorMessage(error, 'Unable to verify admin access.')
  const normalized = message.toLowerCase()

  if (
    normalized.includes('unauthorized') ||
    normalized.includes('role required') ||
    normalized.includes('admin verification failed')
  ) {
    return 'This account is signed in, but it does not have ur-internals admin access.'
  }

  return message
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [adminIdentity, setAdminIdentity] = useState<AdminIdentity | null>(null)
  const [isBootstrapping, setIsBootstrapping] = useState(true)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  async function verifyAdminSession(session: Session) {
    const admin = await getAdminWhoAmI(session.token)
    setSessionToken(session.token)
    setAdminIdentity(admin)
    setAuthError(null)
    return admin
  }

  async function resetSessionWithError(error: unknown) {
    await clearNakamaSession()
    setSessionToken(null)
    setAdminIdentity(null)
    const message = normalizeAuthError(error)
    setAuthError(message)
    return message
  }

  useEffect(() => {
    let active = true

    async function bootstrap() {
      setIsBootstrapping(true)

      try {
        const session = await restoreStoredNakamaSession()

        if (!active) {
          return
        }

        if (!session) {
          setSessionToken(null)
          setAdminIdentity(null)
          return
        }

        try {
          await verifyAdminSession(session)
        } catch (error) {
          if (!active) {
            return
          }

          await resetSessionWithError(error)
        }
      } finally {
        if (active) {
          setIsBootstrapping(false)
        }
      }
    }

    void bootstrap()

    return () => {
      active = false
    }
  }, [])

  async function loginWithEmail(email: string, password: string) {
    setIsAuthenticating(true)
    setAuthError(null)

    try {
      const session = await authenticateWithEmail(email, password)
      return await verifyAdminSession(session)
    } catch (error) {
      const message = await resetSessionWithError(error)
      throw new Error(message)
    } finally {
      setIsAuthenticating(false)
    }
  }

  async function loginWithGoogle() {
    setIsAuthenticating(true)
    setAuthError(null)

    try {
      const idToken = await requestGoogleIdToken()
      if (!idToken) {
        return null
      }

      const session = await authenticateWithGoogleIdToken(idToken)
      return await verifyAdminSession(session)
    } catch (error) {
      const message = await resetSessionWithError(error)
      throw new Error(message)
    } finally {
      setIsAuthenticating(false)
    }
  }

  async function logout() {
    await clearNakamaSession()
    setSessionToken(null)
    setAdminIdentity(null)
    setAuthError(null)
  }

  function clearAuthError() {
    setAuthError(null)
  }

  return (
    <SessionContext.Provider
      value={{
        sessionToken,
        hasSession: Boolean(sessionToken),
        isBootstrapping,
        isAuthenticating,
        isAuthenticated: Boolean(sessionToken && adminIdentity),
        adminIdentity,
        authError,
        loginWithEmail,
        loginWithGoogle,
        logout,
        clearAuthError,
      }}
    >
      {children}
    </SessionContext.Provider>
  )
}
