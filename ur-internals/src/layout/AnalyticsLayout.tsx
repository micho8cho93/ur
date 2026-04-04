import { WorkspaceLayout } from './WorkspaceLayout'
import { analyticsNavItems } from '../routes'

const SIDEBAR_COLLAPSED_STORAGE_KEY = 'ur-internals.analytics-sidebar-collapsed'

export function AnalyticsLayout() {
  return (
    <WorkspaceLayout
      storageKey={SIDEBAR_COLLAPSED_STORAGE_KEY}
      workspaceEyebrow="Ur internals"
      workspaceTitle="Analytics control center"
      workspaceDescription="Inspect product health, player behavior, tournament performance, progression, and realtime telemetry from a single operator-facing analytics workspace."
      sidebarLabel="Ur Game"
      sidebarTitle="Analytics"
      sidebarSubtitle="Executive KPIs, retention, gameplay health, progression, and realtime telemetry."
      footerLabel="Workspace focus"
      footerValue="Analytics and diagnosis"
      footerCopy="Use this workspace to monitor trends, validate changes, and investigate live issues."
      navItems={analyticsNavItems}
      theme="analytics"
    />
  )
}
