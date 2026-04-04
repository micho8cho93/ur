import type { ReactNode } from 'react'

interface EmptyStateProps {
  title: string
  description: ReactNode
  action?: ReactNode
  className?: string
  compact?: boolean
  tone?: 'default' | 'info' | 'success' | 'warning' | 'danger'
}

export function EmptyState({
  title,
  description,
  action,
  className,
  compact = false,
  tone = 'default',
}: EmptyStateProps) {
  const classes = [
    'empty-state',
    compact ? 'empty-state--compact' : null,
    tone !== 'default' ? `empty-state--${tone}` : null,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classes}>
      <span className="empty-state__icon" aria-hidden="true">
        <span className="empty-state__icon-core" />
      </span>

      <div className="empty-state__copy">
        <strong>{title}</strong>
        <p>{description}</p>
      </div>

      {action ? <div className="empty-state__action">{action}</div> : null}
    </div>
  )
}
