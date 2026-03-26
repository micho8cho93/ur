import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useSession } from './useSession'

function AuthPendingState() {
  return (
    <div className="auth-shell">
      <section className="auth-panel auth-panel--compact">
        <p className="meta-label">Ur Game</p>
        <h1>Checking admin access</h1>
        <p className="auth-copy">
          Restoring your Nakama session and verifying the dashboard role before loading internals.
        </p>
      </section>
    </div>
  )
}

export function RequireAdminAuth() {
  const location = useLocation()
  const { isBootstrapping, isAuthenticated } = useSession()

  if (isBootstrapping) {
    return <AuthPendingState />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}

export function PublicOnlyRoute() {
  const { isBootstrapping, isAuthenticated } = useSession()

  if (isBootstrapping) {
    return <AuthPendingState />
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
