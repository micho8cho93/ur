export interface AuditLogEntry {
  id: string
  action: string
  actor: string
  actorUserId: string
  target: string
  tournamentId: string
  createdAt: string
  summary: string
  metadata: Record<string, unknown>
}
