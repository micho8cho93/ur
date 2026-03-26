import type { AdminIdentity, AdminRole } from '../types/auth'
import { callRpc } from './client'
import { asRecord, readStringField } from './runtime'

const RPC_ADMIN_WHOAMI = 'rpc_admin_whoami'

function isAdminRole(value: string | null): value is AdminRole {
  return value === 'viewer' || value === 'operator' || value === 'admin'
}

export async function getAdminWhoAmI(sessionToken?: string | null): Promise<AdminIdentity> {
  const response = await callRpc<unknown>(RPC_ADMIN_WHOAMI, {}, sessionToken ?? undefined)
  const record = asRecord(response) ?? {}
  const role = readStringField(record, ['role'])
  const userId = readStringField(record, ['userId', 'user_id'])

  if (!userId || !isAdminRole(role)) {
    throw new Error('Admin verification failed.')
  }

  return {
    userId,
    role,
    username: readStringField(record, ['username']),
    displayName: readStringField(record, ['displayName', 'display_name']),
    email: readStringField(record, ['email']),
  }
}
