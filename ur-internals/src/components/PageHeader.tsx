import type { ReactNode } from 'react'

interface PageHeaderProps {
  eyebrow: string
  title: string
  description: string
  actions?: ReactNode
}

export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <header className="page-header">
      <div>
        <p className="page-header__eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        <p className="page-header__description">{description}</p>
      </div>
      {actions ? <div>{actions}</div> : null}
    </header>
  )
}
