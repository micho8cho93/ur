import type { ReactNode } from 'react'

interface KpiStatCardProps {
  label: string
  value: ReactNode
  helper?: ReactNode
  detail?: ReactNode
  tone?: 'default' | 'accent' | 'success' | 'warning'
  className?: string
  valueClassName?: string
  delta?: number
  deltaLabel?: string
}

function DeltaIndicator({ delta, label }: { delta: number; label?: string }) {
  const tone = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat'
  const arrow = delta > 0 ? '▲' : delta < 0 ? '▼' : '–'
  const display = label ?? `${Math.abs(delta).toFixed(1)}%`

  return (
    <span className={`kpi-card__delta kpi-card__delta--${tone}`} aria-label={`${delta > 0 ? 'Up' : delta < 0 ? 'Down' : 'No change'} ${display}`}>
      {arrow} {display}
    </span>
  )
}

export function KpiStatCard({
  label,
  value,
  helper,
  detail,
  tone = 'default',
  className,
  valueClassName,
  delta,
  deltaLabel,
}: KpiStatCardProps) {
  const classes = [
    'stat-card',
    'kpi-card',
    tone !== 'default' ? `stat-card--${tone}` : null,
    tone !== 'default' ? `kpi-card--${tone}` : null,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <article className={classes}>
      <p className="stat-card__label kpi-card__label">{label}</p>
      <p className={['stat-card__value', 'kpi-card__value', valueClassName].filter(Boolean).join(' ')}>
        {value}
      </p>
      {delta !== undefined ? <DeltaIndicator delta={delta} label={deltaLabel} /> : null}
      {helper ? <p className="stat-card__helper kpi-card__helper">{helper}</p> : null}
      {detail ? <p className="kpi-card__detail">{detail}</p> : null}
    </article>
  )
}
