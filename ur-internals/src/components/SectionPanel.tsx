import type { ReactNode } from 'react'

interface SectionPanelProps {
  title: string
  subtitle?: ReactNode
  eyebrow?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
  contentClassName?: string
  collapsible?: boolean
  defaultOpen?: boolean
}

export function SectionPanel({
  title,
  subtitle,
  eyebrow,
  actions,
  children,
  className,
  contentClassName,
  collapsible = false,
  defaultOpen = true,
}: SectionPanelProps) {
  const panelClassName = ['panel', className].filter(Boolean).join(' ')
  const bodyClassName = ['panel__body', contentClassName].filter(Boolean).join(' ')

  if (collapsible) {
    return (
      <details className={[panelClassName, 'panel--collapsible'].filter(Boolean).join(' ')} open={defaultOpen}>
        <summary className="panel__summary">
          <div className="panel__header">
            <div className="panel__header-copy">
              {eyebrow ? <p className="panel__eyebrow">{eyebrow}</p> : null}
              <h3 className="panel__title">{title}</h3>
              {subtitle ? <span className="panel__subtitle">{subtitle}</span> : null}
            </div>
            <div className="panel__summary-meta">
              {actions ? <div className="panel__actions">{actions}</div> : null}
              <span className="panel__toggle" aria-hidden="true" />
            </div>
          </div>
        </summary>
        <div className={bodyClassName}>{children}</div>
      </details>
    )
  }

  return (
    <section className={panelClassName}>
      <div className="panel__header">
        <div className="panel__header-copy">
          {eyebrow ? <p className="panel__eyebrow">{eyebrow}</p> : null}
          <h3 className="panel__title">{title}</h3>
          {subtitle ? <span className="panel__subtitle">{subtitle}</span> : null}
        </div>
        {actions ? <div className="panel__actions">{actions}</div> : null}
      </div>
      <div className={bodyClassName}>{children}</div>
    </section>
  )
}
