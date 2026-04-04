import { formatMetricValue, type MetricFormat } from '../../analytics/utils'
import type { AnalyticsMetric } from '../../types/analytics'

interface RealtimeStatusCardProps {
  label: string
  helper: string
  metric: AnalyticsMetric
  format?: MetricFormat
}

export function RealtimeStatusCard({
  label,
  helper,
  metric,
  format = 'count',
}: RealtimeStatusCardProps) {
  return (
    <article className="realtime-status-card">
      <span className="meta-label">{label}</span>
      <strong>{formatMetricValue(metric, format)}</strong>
      <span>{helper}</span>
    </article>
  )
}
