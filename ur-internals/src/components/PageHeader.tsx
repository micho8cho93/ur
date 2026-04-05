import type { ReactNode } from 'react'

interface PageHeaderProps {
  eyebrow?: string
  title: string
  description?: ReactNode
  meta?: ReactNode
  filters?: ReactNode
  actions?: ReactNode
}

export function PageHeader({
  eyebrow,
  title,
  description,
  meta,
  filters,
  actions,
}: PageHeaderProps) {
  return (
    <header className="page-header">
      <div className="page-header__main">
        <div className="page-header__copy">
          {eyebrow ? <p className="page-header__eyebrow">{eyebrow}</p> : null}
          <div className="page-header__headline">
            <h2>{title}</h2>
            {description ? <p className="page-header__description">{description}</p> : null}
          </div>
        </div>
        {actions ? <div className="page-header__actions">{actions}</div> : null}
      </div>
      {meta ? <div className="page-header__meta">{meta}</div> : null}
      {filters ? <div className="page-header__filters">{filters}</div> : null}
    </header>
  )
}
