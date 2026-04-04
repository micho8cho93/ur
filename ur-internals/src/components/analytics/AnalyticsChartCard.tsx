import type { ReactNode } from 'react'
import {
  canRenderAvailability,
  getAvailabilityLabel,
  getAvailabilityTone,
  summarizeAvailabilityNotes,
} from '../../analytics/utils'
import type { AnalyticsAvailability } from '../../types/analytics'
import { AnalyticsUnavailableState } from './AnalyticsUnavailableState'

interface AnalyticsChartCardProps {
  title: string
  subtitle: string
  availability: AnalyticsAvailability
  children: ReactNode
  footer?: ReactNode
}

export function AnalyticsChartCard({
  title,
  subtitle,
  availability,
  children,
  footer,
}: AnalyticsChartCardProps) {
  const note = summarizeAvailabilityNotes(availability)
  const badgeTone = getAvailabilityTone(availability.status)
  const badgeClassName =
    badgeTone === 'default'
      ? 'analytics-card__badge'
      : `analytics-card__badge analytics-card__badge--${badgeTone}`

  return (
    <article className="analytics-card">
      <header className="analytics-card__header">
        <div className="analytics-card__copy">
          <strong>{title}</strong>
          <p>{subtitle}</p>
        </div>
        <span className={badgeClassName}>{getAvailabilityLabel(availability.status)}</span>
      </header>

      <div className="analytics-card__body">
        {canRenderAvailability(availability) ? children : <AnalyticsUnavailableState availability={availability} />}
      </div>

      {note || footer ? (
        <footer className="analytics-card__footer">
          {note ? <span>{note}</span> : null}
          {footer}
        </footer>
      ) : null}
    </article>
  )
}
