import type { ReactNode } from 'react'
import { PageHeader } from '../PageHeader'

interface AnalyticsPageShellProps {
  actions?: ReactNode
  filters: ReactNode
  generatedAt: string | null
  rangeLabel: string
  focusLabel: string
  notices: string[]
  children: ReactNode
}

function formatGeneratedAt(value: string | null) {
  if (!value) {
    return 'Waiting for analytics response'
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function AnalyticsPageShell({
  actions,
  filters,
  generatedAt,
  rangeLabel,
  focusLabel,
  notices,
  children,
}: AnalyticsPageShellProps) {
  return (
    <div className="analytics-page">
      <PageHeader
        eyebrow="Analytics Control Center"
        title="Analytics control center"
        description="Operational and product intelligence from live data only. Optimized for quick executive scanning first and drill-down diagnosis second."
        actions={actions}
      />

      <div className="analytics-page__meta">
        <div className="analytics-page__generated-at">
          <span className="meta-label">Generated</span>
          <strong>{formatGeneratedAt(generatedAt)}</strong>
          <span>Latest successful analytics bundle timestamp.</span>
        </div>

        <div className="analytics-page__generated-at">
          <span className="meta-label">Window</span>
          <strong>{rangeLabel}</strong>
          <span>Current reporting range across the active filter set.</span>
        </div>

        <div className="analytics-page__generated-at">
          <span className="meta-label">Focus</span>
          <strong>{focusLabel}</strong>
          <span>Current tournament and mode scope for this view.</span>
        </div>
      </div>

      {filters}

      {notices.length > 0 ? (
        <div className="analytics-page__notices">
          {notices.map((notice) => (
            <div key={notice} className="alert alert--warning">
              {notice}
            </div>
          ))}
        </div>
      ) : null}

      {children}
    </div>
  )
}
