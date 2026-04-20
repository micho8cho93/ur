import { useEffect, useState } from 'react'
import { useSession } from '../auth/useSession'
import { listAuditLog } from '../api/auditLog'
import { DataTable, type DataTableColumn } from '../components/DataTable'
import { EmptyState } from '../components/EmptyState'
import { SkeletonTable } from '../components/Skeleton'
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
  const columns: DataTableColumn<AuditLogEntry>[] = [
    {
      key: 'action',
      header: 'Action',
      render: (entry) => (
        <div className="stack stack--compact">
          <strong className="mono">{entry.action}</strong>
          <span className="muted mono">{entry.id}</span>
        </div>
      ),
    },
    {
      key: 'actor',
      header: 'Actor',
      render: (entry) => (
        <div className="stack stack--compact">
          <strong>{entry.actor}</strong>
          <span className="muted mono">{entry.actorUserId}</span>
        </div>
      ),
    },
    {
      key: 'target',
      header: 'Tournament',
      render: (entry) => (
        <div className="stack stack--compact">
          <strong>{entry.target}</strong>
          <span className="muted mono">{entry.tournamentId}</span>
        </div>
      ),
    },
    {
      key: 'summary',
      header: 'Summary',
      render: (entry) => (
        <div className="stack stack--compact">
          <span>{entry.summary}</span>
          <span className="muted">
            {Object.keys(entry.metadata).length} metadata field
            {Object.keys(entry.metadata).length === 1 ? '' : 's'}
          </span>
        </div>
      ),
    },
    {
      key: 'when',
      header: 'When',
      render: (entry) => (
        <div className="stack stack--compact">
          <strong>{formatDateTime(entry.createdAt)}</strong>
        </div>
      ),
    },
  ]

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
        description="Aggregated operator trail built from the per-run Nakama admin audit RPC."
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
          <SkeletonTable columns={5} rows={6} />
        ) : auditLog.length === 0 ? (
          <EmptyState
            title="No audit events found"
            description="No audit entries were returned for this admin session."
            compact
          />
        ) : (
          <DataTable
            columns={columns}
            rows={auditLog}
            rowKey={(entry) => entry.id}
            rowClassName={() => 'table__row'}
          />
        )}
      </SectionPanel>
    </>
  )
}
