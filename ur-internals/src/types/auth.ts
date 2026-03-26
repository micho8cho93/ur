export type AdminRole = 'viewer' | 'operator' | 'admin'

export interface AdminIdentity {
  userId: string
  role: AdminRole
  username: string | null
  displayName: string | null
  email: string | null
}

export interface StoredAdminSession {
  token: string
  refreshToken: string
}
