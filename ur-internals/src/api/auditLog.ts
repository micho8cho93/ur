import env from '../config/env'
import { mockAuditLog } from '../data/mockData'
import type { AuditLogEntry } from '../types/audit'
import { callRpc } from './client'
import { asRecord, readArrayField, readStringField } from './runtime'
import { listTournaments } from './tournaments'

const RPC_ADMIN_GET_TOURNAMENT_AUDIT_LOG = 'rpc_admin_get_tournament_audit_log'

async function wait(ms: number) {
  await new Promise((resolve) => window.setTimeout(resolve, ms))
}

function humanizeKey(key: string) {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .trim()
}

function formatMetadataValue(value: unknown) {
  if (typeof value === 'string') {
    return value
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }

  if (Array.isArray(value)) {
    return value.join(', ')
  }

  return JSON.stringify(value)
}

function buildAuditSummary(metadata: Record<string, unknown>) {
  const entries = Object.entries(metadata)

  if (entries.length === 0) {
    return 'No metadata provided.'
  }

  return entries
    .slice(0, 3)
    .map(([key, value]) => `${humanizeKey(key)}: ${formatMetadataValue(value)}`)
    .join(' · ')
}

function normalizeAuditEntry(value: unknown): AuditLogEntry {
  const record = asRecord(value) ?? {}
  const metadata = asRecord(record.metadata) ?? {}

  return {
    id: readStringField(record, ['id']) ?? `audit-${Math.random().toString(36).slice(2, 10)}`,
    action: readStringField(record, ['action']) ?? 'unknown.action',
    actor: readStringField(record, ['actorLabel', 'actor_label']) ?? 'Unknown actor',
    actorUserId: readStringField(record, ['actorUserId', 'actor_user_id']) ?? 'unknown-user',
    target:
      readStringField(record, ['tournamentName', 'tournament_name']) ??
      readStringField(record, ['tournamentId', 'tournament_id']) ??
      'Unknown target',
    tournamentId: readStringField(record, ['tournamentId', 'tournament_id']) ?? 'unknown-tournament',
    createdAt: readStringField(record, ['createdAt', 'created_at']) ?? new Date(0).toISOString(),
    summary: buildAuditSummary(metadata),
    metadata,
  }
}

export async function getTournamentAuditLog(runId: string, limit = 50): Promise<AuditLogEntry[]> {
  if (env.useMockData) {
    await wait(160)
    return mockAuditLog
      .filter((entry) => entry.tournamentId === runId)
      .map((entry) => ({ ...entry, metadata: { ...entry.metadata } }))
  }

  const response = await callRpc<{ entries?: unknown[] }>(RPC_ADMIN_GET_TOURNAMENT_AUDIT_LOG, {
    runId,
    limit,
  })

  return readArrayField(response, ['entries']).map((entry) => normalizeAuditEntry(entry))
}

export async function listAuditLog(limit = 60): Promise<AuditLogEntry[]> {
  if (env.useMockData) {
    await wait(160)
    return mockAuditLog.map((entry) => ({ ...entry, metadata: { ...entry.metadata } }))
  }

  const tournaments = await listTournaments(Math.min(limit, 12))
  const groups = await Promise.all(
    tournaments.slice(0, 12).map(async (tournament) => {
      try {
        return await getTournamentAuditLog(tournament.id, Math.min(limit, 12))
      } catch {
        return []
      }
    }),
  )

  return groups
    .flat()
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .slice(0, limit)
}
