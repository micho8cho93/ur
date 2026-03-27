import { createContext } from 'react'
import type { AdminIdentity } from '../types/auth'

export interface SessionContextValue {
  sessionToken: string | null
  hasSession: boolean
  isBootstrapping: boolean
  isAuthenticating: boolean
  isAuthenticated: boolean
  adminIdentity: AdminIdentity | null
  authError: string | null
  loginWithUsername: (username: string, password: string) => Promise<AdminIdentity>
  logout: () => Promise<void>
  clearAuthError: () => void
}

export const SessionContext = createContext<SessionContextValue | null>(null)
