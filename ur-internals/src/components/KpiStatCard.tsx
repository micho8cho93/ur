import type { ReactNode } from 'react'

interface KpiStatCardProps {
  label: string
  value: ReactNode
  helper?: ReactNode
  detail?: ReactNode
  tone?: 'default' | 'accent' | 'success' | 'warning'
  className?: string
  valueClassName?: string
}

export function KpiStatCard({
  label,
  value,
  helper,
  detail,
  tone = 'default',
  className,
  valueClassName,
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
      {helper ? <p className="stat-card__helper kpi-card__helper">{helper}</p> : null}
      {detail ? <p className="kpi-card__detail">{detail}</p> : null}
    </article>
  )
}
