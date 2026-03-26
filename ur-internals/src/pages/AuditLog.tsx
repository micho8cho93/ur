import { useEffect, useState } from 'react'
import { useSession } from '../auth/useSession'
import { listAuditLog } from '../api/auditLog'
import { PageHeader } from '../components/PageHeader'
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
        eyebrow="AuditLog"
        title="Admin activity log"
        description="Aggregated audit trail built from the per-run Nakama admin audit RPC."
      />

      {error ? <div className="alert alert--error">{error}</div> : null}

      <section className="panel">
        <div className="panel__header">
          <div>
            <h3 className="panel__title">Recent events</h3>
            <span className="panel__subtitle">Flattened and sorted across visible tournament runs.</span>
          </div>
        </div>

        {isLoading ? (
          <div className="empty-state">Loading audit log...</div>
        ) : auditLog.length === 0 ? (
          <div className="empty-state">No audit entries returned for this admin session.</div>
        ) : (
          <div className="table-wrap">
            <table className="table">
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
                  <tr key={entry.id}>
                    <td className="mono">{entry.action}</td>
                    <td>{entry.actor}</td>
                    <td>{entry.target}</td>
                    <td>{entry.summary}</td>
                    <td>{formatDateTime(entry.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  )
}
