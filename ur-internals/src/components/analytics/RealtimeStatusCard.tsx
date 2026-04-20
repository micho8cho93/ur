import { formatMetricValue, type MetricFormat } from '../../analytics/utils'
import type { AnalyticsMetric } from '../../types/analytics'

interface RealtimeStatusCardProps {
  label: string
  helper: string
  metric: AnalyticsMetric
  format?: MetricFormat
  updatedAt?: Date | null
  live?: boolean
}

function formatUpdatedAt(date: Date): string {
  const diffMs = Date.now() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  if (diffSec < 60) return `${diffSec}s ago`
  return `${Math.floor(diffSec / 60)}m ago`
}

export function RealtimeStatusCard({
  label,
  helper,
  metric,
  format = 'count',
  updatedAt,
  live = false,
}: RealtimeStatusCardProps) {
  return (
    <article className="realtime-status-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <span className="meta-label">{label}</span>
        {live ? (
          <span className="realtime-live-indicator" aria-label="Live data">
            <span className="realtime-live-dot" aria-hidden="true" />
            Live
          </span>
        ) : null}
      </div>
      <strong>{formatMetricValue(metric, format)}</strong>
      <span>{helper}</span>
      {updatedAt ? (
        <span className="realtime-updated" aria-label={`Last updated ${formatUpdatedAt(updatedAt)}`}>
          Updated {formatUpdatedAt(updatedAt)}
        </span>
      ) : null}
    </article>
  )
}
