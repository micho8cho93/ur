import type { ReactNode } from 'react'
import { KpiStatCard } from './KpiStatCard'

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
  return (
    <KpiStatCard
      label={label}
      value={value}
      helper={helper}
      tone={tone}
    />
  )
}
