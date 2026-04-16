import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { useSession } from '../auth/useSession'
import env from '../config/env'
import { getTargetLabel } from '../layout/workspaceMeta'
import { internalsSections, sectionNavItems, type InternalsSectionId } from '../routes'
import { SidebarNav } from './SidebarNav'

const SIDEBAR_COLLAPSED_STORAGE_KEY = 'ur-internals.console-sidebar-collapsed'

interface AppShellProps {
  section: InternalsSectionId
}

function getShellClassName(section: InternalsSectionId, collapsed: boolean) {
  return [
    'console-shell',
    `console-shell--section-${section}`,
    collapsed ? 'console-shell--collapsed' : null,
  ]
    .filter(Boolean)
    .join(' ')
}

export function AppShell({ section }: AppShellProps) {
  const location = useLocation()
  const { adminIdentity } = useSession()
  const sectionMeta = internalsSections[section]
  const items = sectionNavItems[section]
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') {
      return false
    }

    return window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === 'true'
  })

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, String(collapsed))
  }, [collapsed])

  const shellClassName = getShellClassName(section, collapsed)
  const locationLabel =
    [...items]
      .sort((left, right) => right.to.length - left.to.length)
      .find(
        (item) =>
          location.pathname === item.to || location.pathname.startsWith(`${item.to}/`),
      )?.label ?? sectionMeta.label

  return (
    <div className={shellClassName}>
      <SidebarNav
        collapsed={collapsed}
        onToggle={() => {
          setCollapsed((current) => !current)
        }}
        items={items}
        section={sectionMeta}
      />

      <div className="console-main">
        <header className="console-topbar">
          <div className="console-topbar__chips" aria-label="Console context">
            <span className={env.useMockData ? 'console-chip console-chip--warning' : 'console-chip console-chip--success'}>
              {env.useMockData ? 'Mock mode' : 'Live session'}
            </span>
            <span className="console-chip">{getTargetLabel()}</span>
            <span className="console-chip">{adminIdentity?.role ?? 'Session required'}</span>
            <span className="console-chip console-chip--muted">{sectionMeta.label}</span>
            <span className="console-chip console-chip--muted">{locationLabel}</span>
          </div>

          <div className="console-topbar__actions">
            <Link className="button button--secondary" to="/">
              Switch internals section
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
