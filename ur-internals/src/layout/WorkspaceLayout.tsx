import { useEffect, useState } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { useSession } from '../auth/useSession'
import env from '../config/env'
import { WorkspaceSidebar } from '../components/WorkspaceSidebar'
import { getTargetLabel } from './workspaceMeta'
import type { WorkspaceNavItem } from '../routes'

function getAdminStatusLabel(role: string | null | undefined) {
  if (!role) {
    return 'Session required'
  }

  return `${role} access verified`
}

interface WorkspaceLayoutProps {
  storageKey: string
  workspaceEyebrow: string
  workspaceTitle: string
  workspaceDescription: string
  sidebarLabel: string
  sidebarTitle: string
  sidebarSubtitle: string
  footerLabel: string
  footerValue: string
  footerCopy: string
  navItems: WorkspaceNavItem[]
  theme?: 'tournaments' | 'analytics'
}

export function WorkspaceLayout({
  storageKey,
  workspaceEyebrow,
  workspaceTitle,
  workspaceDescription,
  sidebarLabel,
  sidebarTitle,
  sidebarSubtitle,
  footerLabel,
  footerValue,
  footerCopy,
  navItems,
  theme = 'tournaments',
}: WorkspaceLayoutProps) {
  const { adminIdentity } = useSession()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window === 'undefined') {
      return false
    }

    return window.localStorage.getItem(storageKey) === 'true'
  })
  const statusLabel = env.useMockData ? 'Mock mode active' : getAdminStatusLabel(adminIdentity?.role)
  const shellClassName = [
    isSidebarCollapsed ? 'shell shell--sidebar-collapsed' : 'shell',
    theme === 'analytics' ? 'shell--analytics' : 'shell--tournaments',
  ]
    .filter(Boolean)
    .join(' ')

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(storageKey, String(isSidebarCollapsed))
  }, [isSidebarCollapsed, storageKey])

  return (
    <div className={shellClassName}>
      <WorkspaceSidebar
        collapsed={isSidebarCollapsed}
        onToggle={() => {
          setIsSidebarCollapsed((current) => !current)
        }}
        workspaceLabel={sidebarLabel}
        workspaceTitle={sidebarTitle}
        workspaceSubtitle={sidebarSubtitle}
        navItems={navItems}
        footerLabel={footerLabel}
        footerValue={footerValue}
        footerCopy={footerCopy}
        theme={theme}
      />

      <div className="shell__content">
        <header className="topbar">
          <div className="topbar__workspace">
            <p className="topbar__eyebrow">{workspaceEyebrow}</p>
            <h1>{workspaceTitle}</h1>
            <p className="topbar__workspace-copy">{workspaceDescription}</p>
          </div>

          <div className="topbar__meta">
            <div className="topbar__meta-card">
              <span className="meta-label">API target</span>
              <strong>{getTargetLabel()}</strong>
              <span>{env.useMockData ? 'Simulation transport enabled' : 'Live admin transport'}</span>
            </div>

            <div className="topbar__status">
              <span
                className={
                  env.useMockData || adminIdentity
                    ? 'topbar__dot topbar__dot--ready'
                    : 'topbar__dot topbar__dot--warning'
                }
                aria-hidden="true"
              />
              <div className="topbar__status-copy">
                <strong>{env.useMockData ? 'Simulation' : 'Live admin session'}</strong>
                <span>{statusLabel}</span>
              </div>
            </div>

            <Link className="button button--secondary" to="/">
              Switch workspace
            </Link>
          </div>
        </header>

        <main className="page">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
