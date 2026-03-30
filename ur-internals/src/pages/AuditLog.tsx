import { useEffect, useState } from 'react'
import { useSession } from '../auth/useSession'
import { listAuditLog } from '../api/auditLog'
import { MetaStrip, MetaStripItem } from '../components/MetaStrip'
import { PageHeader } from '../components/PageHeader'
import { SectionPanel } from '../components/SectionPanel'
import type { AuditLogEntry } from '../types/audit'

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function AuditLogPage() {
  const { sessionToken } = useSession()
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const uniqueActors = new Set(auditLog.map((entry) => entry.actorUserId)).size
  const uniqueTargets = new Set(auditLog.map((entry) => entry.tournamentId)).size
  const latestTimestamp = auditLog[0]?.createdAt ?? null

  useEffect(() => {
    let active = true

    async function loadAuditLog() {
      setIsLoading(true)
      setError(null)

      try {
        const nextAuditLog = await listAuditLog(80)

        if (!active) {
          return
        }

        setAuditLog(nextAuditLog)
      } catch (loadError) {
        if (!active) {
          return
        }

        const message = loadError instanceof Error ? loadError.message : 'Unable to load audit log.'
        setError(message)
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    void loadAuditLog()

    return () => {
      active = false
    }
  }, [sessionToken])

  return (
    <>
      <PageHeader
        eyebrow="Audit Log"
        title="Admin activity log"
        description="Aggregated audit trail built from the per-run Nakama admin audit RPC."
      />

      {error ? <div className="alert alert--error">{error}</div> : null}

      <MetaStrip>
        <MetaStripItem
          label="Events loaded"
          value={isLoading ? '...' : auditLog.length}
          hint="Most recent admin events across visible runs."
          tone="accent"
        />
        <MetaStripItem
          label="Operators"
          value={isLoading ? '...' : uniqueActors}
          hint="Unique actors represented in this view."
        />
        <MetaStripItem
          label="Targets"
          value={isLoading ? '...' : uniqueTargets}
          hint="Unique tournament runs referenced."
        />
        <MetaStripItem
          label="Latest event"
          value={isLoading ? '...' : latestTimestamp ? formatDateTime(latestTimestamp) : 'No events'}
          hint="Newest row in the current response."
          tone="warning"
        />
      </MetaStrip>

      <SectionPanel
        title="Recent events"
        subtitle="Flattened and sorted across visible tournament runs."
      >
        {isLoading ? (
          <div className="empty-state">Loading audit log...</div>
        ) : auditLog.length === 0 ? (
          <div className="empty-state">No audit entries returned for this admin session.</div>
        ) : (
          <div className="table-wrap table-wrap--edge">
            <table className="table table--dense table--logs">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Actor</th>
                  <th>Tournament</th>
                  <th>Summary</th>
                  <th>When</th>
                </tr>
              </thead>
              <tbody>
                {auditLog.map((entry) => (
                  <tr key={entry.id} className="table__row">
                    <td>
                      <div className="stack stack--compact">
                        <strong className="mono">{entry.action}</strong>
                        <span className="muted mono">{entry.id}</span>
                      </div>
                    </td>
                    <td>
                      <div className="stack stack--compact">
                        <strong>{entry.actor}</strong>
                        <span className="muted mono">{entry.actorUserId}</span>
                      </div>
                    </td>
                    <td>
                      <div className="stack stack--compact">
                        <strong>{entry.target}</strong>
                        <span className="muted mono">{entry.tournamentId}</span>
                      </div>
                    </td>
                    <td>
                      <div className="stack stack--compact">
                        <span>{entry.summary}</span>
                        <span className="muted">
                          {Object.keys(entry.metadata).length} metadata field
                          {Object.keys(entry.metadata).length === 1 ? '' : 's'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="stack stack--compact">
                        <strong>{formatDateTime(entry.createdAt)}</strong>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionPanel>
    </>
  )
}
