import type { ReactNode } from 'react'
import { PageHeader } from '../PageHeader'

interface AnalyticsPageShellProps {
  actions?: ReactNode
  filters: ReactNode
  generatedAt: string | null
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
  notices,
  children,
}: AnalyticsPageShellProps) {
  return (
    <div className="analytics-page">
      <PageHeader
        eyebrow="Analytics"
        title="Analytics"
        description="Operational and product intelligence from live data only. Built to answer whether people are playing, returning, completing matches, and successfully using tournaments."
        actions={actions}
      />

      <div className="analytics-page__meta">
        <div className="analytics-page__generated-at">
          <span className="meta-label">Generated</span>
          <strong>{formatGeneratedAt(generatedAt)}</strong>
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
