import type { AdminIdentity } from '../types/auth'
import env from '../config/env'

export function getTargetLabel() {
  try {
    return new URL(env.nakamaBaseUrl).host
  } catch {
    return env.nakamaBaseUrl
  }
}

export function getAdminLabel(adminIdentity: AdminIdentity | null) {
  if (!adminIdentity) {
    return 'Admin'
  }

  return (
    adminIdentity.displayName ??
    adminIdentity.username ??
    adminIdentity.email ??
    adminIdentity.userId
  )
}

export function getMonogram(value: string) {
  const parts = value
    .split(/[\s_.-]+/)
    .filter(Boolean)
    .slice(0, 2)

  if (parts.length === 0) {
    return 'AD'
  }

  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('')
}
