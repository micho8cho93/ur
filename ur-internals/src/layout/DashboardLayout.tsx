import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useSession } from '../auth/useSession'
import env from '../config/env'
import { Sidebar } from '../components/Sidebar'

const SIDEBAR_COLLAPSED_STORAGE_KEY = 'ur-internals.sidebar-collapsed'

function getAdminStatusLabel(role: string | null | undefined) {
  if (!role) {
    return 'Session required'
  }

  return `${role} access verified`
}

export function DashboardLayout() {
  const { adminIdentity } = useSession()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window === 'undefined') {
      return false
    }

    return window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === 'true'
  })
  const statusLabel = env.useMockData ? 'Mock mode active' : getAdminStatusLabel(adminIdentity?.role)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, String(isSidebarCollapsed))
  }, [isSidebarCollapsed])

  return (
    <div className={isSidebarCollapsed ? 'shell shell--sidebar-collapsed' : 'shell'}>
      <Sidebar
        collapsed={isSidebarCollapsed}
        onToggle={() => {
          setIsSidebarCollapsed((current) => !current)
        }}
      />

      <div className="shell__content">
        <header className="topbar">
          <div className="topbar__workspace">
            <p className="topbar__eyebrow">Operations dashboard</p>
            <h1>Tournament control center</h1>
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
        </header>

        <main className="page">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
