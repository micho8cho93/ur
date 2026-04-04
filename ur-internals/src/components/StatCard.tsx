import type { ReactNode } from 'react'

interface StatCardProps {
  label: string
  value: ReactNode
  helper: ReactNode
  tone?: 'default' | 'accent' | 'success' | 'warning'
}

export function StatCard({
  label,
  value,
  helper,
  tone = 'default',
}: StatCardProps) {
  const className = tone === 'default' ? 'stat-card' : `stat-card stat-card--${tone}`

  return (
    <article className={className}>
      <p className="stat-card__label">{label}</p>
      <p className="stat-card__value">{value}</p>
      <p className="stat-card__helper">{helper}</p>
    </article>
  )
}
