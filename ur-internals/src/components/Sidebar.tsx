import { NavLink, type NavLinkRenderProps } from 'react-router-dom'
import { useSession } from '../auth/useSession'
import env from '../config/env'

const navItems = [
  { label: 'Overview', to: '/' },
  { label: 'Tournaments', to: '/tournaments' },
  { label: 'Create Tournament', to: '/tournaments/new' },
  { label: 'Audit Log', to: '/audit-log' },
]

function getLinkClassName({ isActive }: NavLinkRenderProps) {
  return isActive ? 'sidebar__link sidebar__link--active' : 'sidebar__link'
}

function getTargetLabel() {
  try {
    return new URL(env.nakamaBaseUrl).host
  } catch {
    return env.nakamaBaseUrl
  }
}

function getAdminLabel(
  adminIdentity: NonNullable<ReturnType<typeof useSession>['adminIdentity']>,
) {
  return (
    adminIdentity.displayName ??
    adminIdentity.username ??
    adminIdentity.email ??
    adminIdentity.userId
  )
}

export function Sidebar() {
  const { adminIdentity, logout, isAuthenticating } = useSession()

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <p className="sidebar__eyebrow">Ur Game</p>
        <h1 className="sidebar__title">Internals</h1>
        <p className="sidebar__subtitle">
          Tournament operations, auditability, and direct Nakama admin RPC access.
        </p>
      </div>

      {adminIdentity ? (
        <div className="sidebar__admin">
          <div className="sidebar__admin-header">
            <p className="meta-label">Signed in</p>
            <span className="session-pill session-pill--ready">{adminIdentity.role}</span>
          </div>
          <strong>{getAdminLabel(adminIdentity)}</strong>
          <span className="muted">{adminIdentity.email ?? adminIdentity.userId}</span>
          <button className="button" type="button" onClick={() => void logout()} disabled={isAuthenticating}>
            Sign out
          </button>
        </div>
      ) : null}

      <nav className="sidebar__nav" aria-label="Primary navigation">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={getLinkClassName}
          >
            <span>{item.label}</span>
            <span aria-hidden="true">+</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar__footer">
        <p className="meta-label">API target</p>
        <strong>{getTargetLabel()}</strong>
        <span>{env.useMockData ? 'Mock mode enabled for development.' : 'Live RPC requests enabled.'}</span>
      </div>
    </aside>
  )
}
