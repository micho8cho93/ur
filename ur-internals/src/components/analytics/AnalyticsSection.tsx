import type { ReactNode } from 'react'
import { SectionPanel } from '../SectionPanel'

interface AnalyticsSectionProps {
  id: string
  eyebrow?: string
  title: string
  subtitle?: ReactNode
  actions?: ReactNode
  children: ReactNode
}

export function AnalyticsSection({
  id,
  eyebrow,
  title,
  subtitle,
  actions,
  children,
}: AnalyticsSectionProps) {
  return (
    <div id={id} className="analytics-section-anchor">
      <SectionPanel
        eyebrow={eyebrow}
        title={title}
        subtitle={subtitle}
        actions={actions}
        className="analytics-section"
        contentClassName="analytics-section__body"
      >
        {children}
      </SectionPanel>
    </div>
  )
}
