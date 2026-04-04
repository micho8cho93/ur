import { EmptyState } from '../EmptyState'

interface AnalyticsEmptyStateProps {
  title: string
  description: string
}

export function AnalyticsEmptyState({ title, description }: AnalyticsEmptyStateProps) {
  return (
    <EmptyState
      title={title}
      description={description}
      className="analytics-empty-state"
      compact
      tone="info"
    />
  )
}
