import { WorkspaceLayout } from './WorkspaceLayout'
import { tournamentsNavItems } from '../routes'

const SIDEBAR_COLLAPSED_STORAGE_KEY = 'ur-internals.tournaments-sidebar-collapsed'

export function TournamentsLayout() {
  return (
    <WorkspaceLayout
      storageKey={SIDEBAR_COLLAPSED_STORAGE_KEY}
      workspaceEyebrow="Ur internals"
      workspaceTitle="Tournaments control center"
      workspaceDescription="Operate live tournaments, manage draft runs, inspect bracket health, and review operator activity from a dedicated operations workspace."
      sidebarLabel="Ur Game"
      sidebarTitle="Tournaments"
      sidebarSubtitle="Runs, brackets, launch state, draft setup, and audit visibility."
      footerLabel="Workspace focus"
      footerValue="Tournament operations"
      footerCopy="Use this workspace for creation, monitoring, intervention, and closeout."
      navItems={tournamentsNavItems}
      theme="tournaments"
    />
  )
}
