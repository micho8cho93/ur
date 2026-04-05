import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { useSession } from '../auth/useSession'
import env from '../config/env'
import { getTargetLabel } from '../layout/workspaceMeta'
import { primaryNavItems } from '../routes'
import { SidebarNav } from './SidebarNav'

const SIDEBAR_COLLAPSED_STORAGE_KEY = 'ur-internals.console-sidebar-collapsed'

export function AppShell() {
  const location = useLocation()
  const { adminIdentity } = useSession()
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

  const shellClassName = collapsed ? 'console-shell console-shell--collapsed' : 'console-shell'
  const locationLabel =
    [...primaryNavItems]
      .sort((left, right) => right.to.length - left.to.length)
      .find(
        (item) =>
          location.pathname === item.to || location.pathname.startsWith(`${item.to}/`),
      )?.label ?? 'Console'

  return (
    <div className={shellClassName}>
      <SidebarNav
        collapsed={collapsed}
        onToggle={() => {
          setCollapsed((current) => !current)
        }}
        items={primaryNavItems}
      />

      <div className="console-main">
        <header className="console-topbar">
          <div className="console-topbar__chips" aria-label="Console context">
            <span className={env.useMockData ? 'console-chip console-chip--warning' : 'console-chip console-chip--success'}>
              {env.useMockData ? 'Mock mode' : 'Live session'}
            </span>
            <span className="console-chip">{getTargetLabel()}</span>
            <span className="console-chip">{adminIdentity?.role ?? 'Session required'}</span>
            <span className="console-chip console-chip--muted">{locationLabel}</span>
          </div>

          <div className="console-topbar__actions">
            <Link className="button button--secondary" to="/">
              Switch section
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
