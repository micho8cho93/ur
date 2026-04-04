import { WorkspaceLayout } from './WorkspaceLayout'
import { analyticsNavItems } from '../routes'

const SIDEBAR_COLLAPSED_STORAGE_KEY = 'ur-internals.analytics-sidebar-collapsed'

export function AnalyticsLayout() {
  return (
    <WorkspaceLayout
      storageKey={SIDEBAR_COLLAPSED_STORAGE_KEY}
      workspaceEyebrow="Ur internals"
      workspaceTitle="Analytics control center"
      workspaceDescription="Read live product, player, tournament, progression, and realtime intelligence through an analytics-first workspace designed for diagnosis instead of operations."
      sidebarLabel="Ur Game"
      sidebarTitle="Analytics"
      sidebarSubtitle="Executive KPIs, player health, gameplay trends, tournament performance, and realtime signals."
      footerLabel="Workspace focus"
      footerValue="Live analytics only"
      footerCopy="This workspace stays dedicated to interpretation, trend reading, and operational diagnosis."
      navItems={analyticsNavItems}
      theme="analytics"
    />
  )
}
