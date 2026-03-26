import { Outlet } from 'react-router-dom'
import { useSession } from '../auth/useSession'
import env from '../config/env'
import { Sidebar } from '../components/Sidebar'

function getAdminStatusLabel(role: string | null | undefined) {
  if (!role) {
    return 'Session required'
  }

  return `${role} access verified`
}

export function DashboardLayout() {
  const { adminIdentity } = useSession()
  const statusLabel = env.useMockData ? 'Mock mode active' : getAdminStatusLabel(adminIdentity?.role)

  return (
    <div className="shell">
      <Sidebar />

      <div className="shell__content">
        <header className="topbar">
          <div>
            <p className="topbar__eyebrow">Operations dashboard</p>
            <h1>Backend control room</h1>
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
            <span>{statusLabel}</span>
          </div>
        </header>

        <main className="page">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
