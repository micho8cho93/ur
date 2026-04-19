import { NavLink, type NavLinkRenderProps } from 'react-router-dom'
import { useSession } from '../auth/useSession'
import env from '../config/env'

const navItems = [
  { label: 'Overview', to: '/', short: '01' },
  { label: 'Tournaments', to: '/tournaments', short: '02' },
  { label: 'Create Tournament', to: '/tournaments/new', short: '03' },
  { label: 'Audit Log', to: '/audit-log', short: '04' },
  { label: 'Analytics', to: '/analytics', short: '05' },
  { label: 'Game Modes', to: '/game-modes', short: '06' },
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

function getMonogram(value: string) {
  const parts = value
    .split(/[\s_.-]+/)
    .filter(Boolean)
    .slice(0, 2)

  if (parts.length === 0) {
    return 'AD'
  }

  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('')
}

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { adminIdentity, logout, isAuthenticating } = useSession()
  const adminLabel = adminIdentity ? getAdminLabel(adminIdentity) : null
  const adminSectionClassName = collapsed ? 'sidebar__admin sidebar__admin--collapsed' : 'sidebar__admin'
  const signOutButtonClassName = collapsed
    ? 'button button--secondary sidebar__admin-action'
    : 'button button--secondary button--block'

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <div className="sidebar__brand-header">
          <div className="sidebar__brand-copy">
            <p className="sidebar__eyebrow">Ur Game</p>
            <h1 className="sidebar__title">{collapsed ? 'UR' : 'Internals'}</h1>
          </div>
          <button
            className="sidebar__collapse-button"
            type="button"
            onClick={onToggle}
            aria-label={collapsed ? 'Expand navigation panel' : 'Collapse navigation panel'}
            aria-pressed={collapsed}
            title={collapsed ? 'Expand navigation panel' : 'Collapse navigation panel'}
          >
            {collapsed ? '>>' : '<<'}
          </button>
        </div>
        <p className="sidebar__subtitle">
          Tournament operations, analytics, and direct Nakama admin control.
        </p>
      </div>

      {adminIdentity ? (
        <div
          className={adminSectionClassName}
          title={collapsed && adminLabel ? `${adminLabel} · ${adminIdentity.role}` : undefined}
        >
          {!collapsed ? (
            <div className="sidebar__admin-header">
              <p className="meta-label">Signed in</p>
              <span className="session-pill session-pill--ready">{adminIdentity.role}</span>
            </div>
          ) : null}
          <div className="sidebar__admin-avatar" aria-hidden="true">
            {getMonogram(adminLabel ?? 'Admin')}
          </div>
          {!collapsed ? (
            <div className="sidebar__admin-copy">
              <strong>{adminLabel}</strong>
              <span className="muted">{adminIdentity.email ?? adminIdentity.userId}</span>
            </div>
          ) : null}
          <button
            className={signOutButtonClassName}
            type="button"
            onClick={() => void logout()}
            disabled={isAuthenticating}
            aria-label="Sign out"
            title={collapsed ? 'Sign out' : undefined}
          >
            {collapsed ? 'Out' : 'Sign out'}
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
            aria-label={item.label}
            title={collapsed ? item.label : undefined}
          >
            <span className="sidebar__link-index" aria-hidden="true">
              {item.short}
            </span>
            <span className="sidebar__link-label">{item.label}</span>
            <span className="sidebar__link-indicator" aria-hidden="true">
              {item.to === '/' ? 'OV' : 'GO'}
            </span>
          </NavLink>
        ))}
      </nav>

      {!collapsed ? (
        <div className="sidebar__footer">
          <p className="meta-label">API target</p>
          <strong>{getTargetLabel()}</strong>
          <span>{env.useMockData ? 'Mock mode enabled for development.' : 'Live RPC requests enabled.'}</span>
        </div>
      ) : null}
    </aside>
  )
}
