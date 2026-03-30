import type { ReactNode } from 'react'

interface MetaStripProps {
  children: ReactNode
  className?: string
}

interface MetaStripItemProps {
  label: string
  value: ReactNode
  hint?: ReactNode
  tone?: 'default' | 'accent' | 'success' | 'warning' | 'danger'
}

export function MetaStrip({ children, className }: MetaStripProps) {
  const classes = ['meta-strip', className].filter(Boolean).join(' ')

  return <div className={classes}>{children}</div>
}

export function MetaStripItem({
  label,
  value,
  hint,
  tone = 'default',
}: MetaStripItemProps) {
  const className =
    tone === 'default' ? 'meta-strip__item' : `meta-strip__item meta-strip__item--${tone}`

  return (
    <div className={className}>
      <span className="meta-strip__label">{label}</span>
      <strong className="meta-strip__value">{value}</strong>
      {hint ? <span className="meta-strip__hint">{hint}</span> : null}
    </div>
  )
}
