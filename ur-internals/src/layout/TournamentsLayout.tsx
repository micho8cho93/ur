import { WorkspaceLayout } from './WorkspaceLayout'
import { tournamentsNavItems } from '../routes'

const SIDEBAR_COLLAPSED_STORAGE_KEY = 'ur-internals.tournaments-sidebar-collapsed'

export function TournamentsLayout() {
  return (
    <WorkspaceLayout
      storageKey={SIDEBAR_COLLAPSED_STORAGE_KEY}
      workspaceEyebrow="Ur internals"
      workspaceTitle="Tournaments control center"
      workspaceDescription="Manage live tournament operations, bracket health, run creation, and operator audit activity without analytics mixed into the navigation."
      sidebarLabel="Ur Game"
      sidebarTitle="Tournaments"
      sidebarSubtitle="Live tournament operations, bracket control, draft setup, and audit visibility."
      footerLabel="Workspace focus"
      footerValue="Tournament operations"
      footerCopy="Use this workspace for day-to-day run management, operator workflows, and bracket control."
      navItems={tournamentsNavItems}
      theme="tournaments"
    />
  )
}
