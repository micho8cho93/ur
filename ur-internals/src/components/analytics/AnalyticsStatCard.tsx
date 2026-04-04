import { formatMetricChange, formatMetricValue, getMetricTone, type MetricFormat } from '../../analytics/utils'
import type { AnalyticsMetric } from '../../types/analytics'

interface AnalyticsStatCardProps {
  label: string
  helper: string
  metric: AnalyticsMetric
  format?: MetricFormat
  detail?: string | null
}

export function AnalyticsStatCard({
  label,
  helper,
  metric,
  format = 'count',
  detail,
}: AnalyticsStatCardProps) {
  const tone = getMetricTone(metric)
  const className =
    tone === 'default' ? 'analytics-stat-card' : `analytics-stat-card analytics-stat-card--${tone}`
  const detailText =
    detail ??
    (metric.availability.status === 'available'
      ? formatMetricChange(metric, format)
      : metric.availability.notes[0] ?? formatMetricChange(metric, format))

  return (
    <article className={className}>
      <p className="stat-card__label">{label}</p>
      <p className="analytics-stat-card__value">{formatMetricValue(metric, format)}</p>
      <p className="analytics-stat-card__helper">{helper}</p>
      <p className="analytics-stat-card__detail">{detailText}</p>
    </article>
  )
}
