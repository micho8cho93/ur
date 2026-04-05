import type { ReactNode } from 'react'
import { MetaStrip, MetaStripItem } from '../MetaStrip'
import { PageHeader } from '../PageHeader'

interface AnalyticsPageShellProps {
  title: string
  description: string
  actions?: ReactNode
  filters: ReactNode
  subnav: ReactNode
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
  title,
  description,
  actions,
  filters,
  subnav,
  generatedAt,
  rangeLabel,
  focusLabel,
  notices,
  children,
}: AnalyticsPageShellProps) {
  return (
    <div className="analytics-page">
      <PageHeader
        eyebrow="Analytics"
        title={title}
        description={description}
        actions={actions}
        meta={
          <MetaStrip className="meta-strip--compact">
            <MetaStripItem
              label="Generated"
              value={formatGeneratedAt(generatedAt)}
              hint="Latest successful analytics bundle timestamp."
            />
            <MetaStripItem
              label="Window"
              value={rangeLabel}
              hint="Current reporting range across the active filter set."
              tone="accent"
            />
            <MetaStripItem
              label="Focus"
              value={focusLabel}
              hint="Tournament and mode scope for the current view."
            />
          </MetaStrip>
        }
        filters={
          <>
            {subnav}
            {filters}
          </>
        }
      />

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
