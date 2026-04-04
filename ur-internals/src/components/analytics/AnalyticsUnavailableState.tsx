import { getAvailabilityLabel } from '../../analytics/utils'
import type { AnalyticsAvailability } from '../../types/analytics'
import { AnalyticsEmptyState } from './AnalyticsEmptyState'

interface AnalyticsUnavailableStateProps {
  availability: AnalyticsAvailability
  title?: string
}

export function AnalyticsUnavailableState({
  availability,
  title,
}: AnalyticsUnavailableStateProps) {
  const defaultTitle =
    availability.status === 'tracking_missing'
      ? 'Tracking not implemented'
      : availability.status === 'not_enough_data'
        ? 'Not enough data yet'
        : 'No data available'
  const description =
    availability.notes[0] ??
    `${getAvailabilityLabel(availability.status)} for the selected filters.`

  return <AnalyticsEmptyState title={title ?? defaultTitle} description={description} />
}
