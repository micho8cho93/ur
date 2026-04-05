import { formatMetricChange, formatMetricValue, getMetricTone, type MetricFormat } from '../../analytics/utils'
import type { AnalyticsMetric } from '../../types/analytics'
import { KpiStatCard } from '../KpiStatCard'

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
  const detailText =
    detail ??
    (metric.availability.status === 'available'
      ? formatMetricChange(metric, format)
      : metric.availability.notes[0] ?? formatMetricChange(metric, format))

  return (
    <KpiStatCard
      className={tone === 'default' ? 'analytics-stat-card' : `analytics-stat-card analytics-stat-card--${tone}`}
      label={label}
      value={formatMetricValue(metric, format)}
      helper={helper}
      detail={detailText}
      tone={tone}
      valueClassName="analytics-stat-card__value"
    />
  )
}
