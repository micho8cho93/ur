interface AnalyticsEmptyStateProps {
  title: string
  description: string
}

export function AnalyticsEmptyState({ title, description }: AnalyticsEmptyStateProps) {
  return (
    <div className="analytics-empty-state">
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  )
}
