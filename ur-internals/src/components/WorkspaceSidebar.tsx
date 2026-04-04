import { Link, NavLink, type NavLinkRenderProps } from 'react-router-dom'
import { useSession } from '../auth/useSession'
import { appRoutes, type WorkspaceNavItem } from '../routes'
import { getAdminLabel, getMonogram, getTargetLabel } from '../layout/workspaceMeta'

function getLinkClassName({ isActive }: NavLinkRenderProps) {
  return isActive ? 'sidebar__link sidebar__link--active' : 'sidebar__link'
}

interface WorkspaceSidebarProps {
  collapsed: boolean
  onToggle: () => void
  workspaceLabel: string
  workspaceTitle: string
  workspaceSubtitle: string
  navItems: WorkspaceNavItem[]
  footerLabel: string
  footerValue: string
  footerCopy: string
  theme?: 'tournaments' | 'analytics'
}

export function WorkspaceSidebar({
  collapsed,
  onToggle,
  workspaceLabel,
  workspaceTitle,
  workspaceSubtitle,
  navItems,
  footerLabel,
  footerValue,
  footerCopy,
  theme = 'tournaments',
}: WorkspaceSidebarProps) {
  const { adminIdentity, logout, isAuthenticating } = useSession()
  const adminLabel = getAdminLabel(adminIdentity)
  const adminSectionClassName = collapsed ? 'sidebar__admin sidebar__admin--collapsed' : 'sidebar__admin'
  const signOutButtonClassName = collapsed
    ? 'button button--secondary sidebar__admin-action'
    : 'button button--secondary button--block'
  const sidebarClassName =
    theme === 'analytics' ? 'sidebar sidebar--analytics' : 'sidebar'

  return (
    <aside className={sidebarClassName}>
      <div className="sidebar__brand">
        <div className="sidebar__brand-header">
          <div className="sidebar__brand-copy">
            <p className="sidebar__eyebrow">{workspaceLabel}</p>
            <h1 className="sidebar__title">{collapsed ? workspaceTitle.slice(0, 2).toUpperCase() : workspaceTitle}</h1>
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
        <p className="sidebar__subtitle">{workspaceSubtitle}</p>
      </div>

      {adminIdentity ? (
        <div
          className={adminSectionClassName}
          title={collapsed ? `${adminLabel} · ${adminIdentity.role}` : undefined}
        >
          {!collapsed ? (
            <div className="sidebar__admin-header">
              <p className="meta-label">Signed in</p>
              <span className="session-pill session-pill--ready">{adminIdentity.role}</span>
            </div>
          ) : null}
          <div className="sidebar__admin-avatar" aria-hidden="true">
            {getMonogram(adminLabel)}
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
            onClick={() => {
              void logout()
            }}
            disabled={isAuthenticating}
            aria-label="Sign out"
            title={collapsed ? 'Sign out' : undefined}
          >
            {collapsed ? 'Out' : 'Sign out'}
          </button>
        </div>
      ) : null}

      <nav className="sidebar__nav" aria-label={`${workspaceTitle} navigation`}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={getLinkClassName}
            aria-label={item.label}
            title={collapsed ? item.label : undefined}
          >
            <span className="sidebar__link-index" aria-hidden="true">
              {item.short}
            </span>
            <span className="sidebar__link-label">{item.label}</span>
            <span className="sidebar__link-indicator" aria-hidden="true">
              GO
            </span>
          </NavLink>
        ))}
      </nav>

      {!collapsed ? (
        <div className="sidebar__footer">
          <p className="meta-label">{footerLabel}</p>
          <strong>{footerValue}</strong>
          <span>{footerCopy}</span>
          <div className="sidebar__footer-actions">
            <Link className="button button--secondary button--block" to={appRoutes.chooser}>
              Switch workspace
            </Link>
            <div className="sidebar__footer-target">
              <p className="meta-label">API target</p>
              <strong>{getTargetLabel()}</strong>
            </div>
          </div>
        </div>
      ) : null}
    </aside>
  )
}
