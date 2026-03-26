import { Client, Session } from '@heroiclabs/nakama-js'
import env from '../config/env'
import { clearStoredAdminSession, readStoredAdminSession, writeStoredAdminSession } from './sessionStorage'

type GISCredentialResponse = {
  credential: string
}

type GISPromptNotification = {
  isNotDisplayed: () => boolean
  isSkippedMoment: () => boolean
  isDismissedMoment: () => boolean
  getNotDisplayedReason: () => string
}

type GISWindow = Window & {
  google?: {
    accounts: {
      id: {
        initialize: (config: Record<string, unknown>) => void
        prompt: (callback?: (notification: GISPromptNotification) => void) => void
      }
    }
  }
}

let client: Client | null = null
let gisScriptPromise: Promise<void> | null = null

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

export async function authenticateWithEmail(email: string, password: string): Promise<Session> {
  const session = await getClient().authenticateEmail(email.trim(), password, false)
  persistSession(session)
  return session
}

export async function authenticateWithGoogleIdToken(idToken: string): Promise<Session> {
  const session = await getClient().authenticateGoogle(idToken, true)
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

export function isGoogleSsoConfigured() {
  return env.googleWebClientId.length > 0
}

function loadGoogleScript(): Promise<void> {
  if (gisScriptPromise) {
    return gisScriptPromise
  }

  gisScriptPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Google SSO is only available in the browser.'))
      return
    }

    const win = window as GISWindow
    if (win.google?.accounts?.id) {
      resolve()
      return
    }

    const scriptId = 'google-gis-script'
    const existing = document.getElementById(scriptId)

    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener(
        'error',
        () => reject(new Error('Failed to load Google Identity Services.')),
        { once: true },
      )
      return
    }

    const script = document.createElement('script')
    script.id = scriptId
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Google Identity Services.'))
    document.head.appendChild(script)
  })

  return gisScriptPromise
}

function promptGoogleCredential(clientId: string): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const win = window as GISWindow
    const googleIdentity = win.google?.accounts?.id

    if (!googleIdentity) {
      reject(new Error('Google Identity Services did not initialize.'))
      return
    }

    let settled = false
    const settle = (callback: () => void) => {
      if (settled) {
        return
      }

      settled = true
      callback()
    }

    googleIdentity.initialize({
      client_id: clientId,
      callback: (response: GISCredentialResponse) => {
        settle(() => {
          if (!response.credential) {
            reject(new Error('Google sign-in did not return a credential.'))
            return
          }

          resolve(response.credential)
        })
      },
      cancel_on_tap_outside: true,
    })

    googleIdentity.prompt((notification) => {
      if (notification.isNotDisplayed()) {
        settle(() =>
          reject(
            new Error(
              `Google sign-in could not be displayed (${notification.getNotDisplayedReason()}).`,
            ),
          ),
        )
        return
      }

      if (notification.isDismissedMoment() || notification.isSkippedMoment()) {
        settle(() => resolve(null))
      }
    })
  })
}

export async function requestGoogleIdToken(): Promise<string | null> {
  if (!isGoogleSsoConfigured()) {
    throw new Error('Google SSO is not configured for this dashboard.')
  }

  await loadGoogleScript()
  return promptGoogleCredential(env.googleWebClientId)
}
