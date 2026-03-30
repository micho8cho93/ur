import type { ReactNode } from 'react'

interface ActionToolbarProps {
  children: ReactNode
  className?: string
}

export function ActionToolbar({ children, className }: ActionToolbarProps) {
  const classes = ['action-toolbar', className].filter(Boolean).join(' ')

  return <div className={classes}>{children}</div>
}
