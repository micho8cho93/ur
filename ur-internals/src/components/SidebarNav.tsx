import { useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useSession } from '../auth/useSession'
import env from '../config/env'
import { getAdminLabel, getMonogram, getTargetLabel } from '../layout/workspaceMeta'
import { appRoutes, type InternalsSection, type SidebarNavItem } from '../routes'

interface SidebarNavProps {
  collapsed: boolean
  onToggle: () => void
  items: SidebarNavItem[]
  section: InternalsSection
}

function isPrefixMatch(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`)
}

function isItemActive(pathname: string, item: SidebarNavItem) {
  if (item.excludePrefixes?.some((prefix) => isPrefixMatch(pathname, prefix))) {
    return false
  }

  if (item.end) {
    return pathname === item.to
  }

  const prefixes = item.matchPrefixes ?? [item.to]
  return prefixes.some((prefix) => isPrefixMatch(pathname, prefix))
}

export function SidebarNav({ collapsed, onToggle, items, section }: SidebarNavProps) {
  const location = useLocation()
  const { adminIdentity, logout, isAuthenticating } = useSession()
  const adminLabel = getAdminLabel(adminIdentity)
  const groupedItems = useMemo(() => {
    const sections = new Map<string, SidebarNavItem[]>()

    items.forEach((item) => {
      const current = sections.get(item.section) ?? []
      current.push(item)
      sections.set(item.section, current)
    })

    return Array.from(sections.entries())
  }, [items])

  return (
    <aside className={collapsed ? 'console-sidebar console-sidebar--collapsed' : 'console-sidebar'}>
      <div className="console-sidebar__brand">
        <div className="console-sidebar__brand-row">
          <div>
            {!collapsed ? <p className="sidebar__eyebrow">{section.eyebrow}</p> : null}
            <h1 className="console-sidebar__title">{collapsed ? section.short : section.label}</h1>
          </div>
          <button
            className="console-sidebar__toggle"
            type="button"
            onClick={onToggle}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-pressed={collapsed}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <span
              className={
                collapsed
                  ? 'console-sidebar__toggle-icon console-sidebar__toggle-icon--expand'
                  : 'console-sidebar__toggle-icon console-sidebar__toggle-icon--collapse'
              }
              aria-hidden="true"
            />
          </button>
        </div>
        {!collapsed ? (
          <p className="console-sidebar__subtitle">
            {section.description}
          </p>
        ) : null}
      </div>

      <nav className="console-sidebar__nav" aria-label="Primary console navigation">
        {groupedItems.map(([section, sectionItems]) => (
          <div key={section} className="console-sidebar__group">
            {!collapsed ? <p className="console-sidebar__section">{section}</p> : null}
            <div className="console-sidebar__links">
              {sectionItems.map((item) => {
                const active = isItemActive(location.pathname, item)
                return (
                  <Link
                    key={item.to}
                    className={active ? 'console-sidebar__link console-sidebar__link--active' : 'console-sidebar__link'}
                    to={item.to}
                    aria-current={active ? 'page' : undefined}
                    title={collapsed ? item.label : undefined}
                  >
                    <span className="console-sidebar__link-mark" aria-hidden="true">
                      {item.short}
                    </span>
                    {!collapsed ? <span className="console-sidebar__link-label">{item.label}</span> : null}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="console-sidebar__footer">
        <div
          className={collapsed ? 'console-sidebar__session console-sidebar__session--collapsed' : 'console-sidebar__session'}
          title={collapsed ? adminLabel : undefined}
        >
          <div className="console-sidebar__avatar" aria-hidden="true">
            {getMonogram(adminLabel)}
          </div>
          {!collapsed ? (
            <div className="console-sidebar__session-copy">
              <strong>{adminLabel}</strong>
              <span>{adminIdentity?.role ?? 'Admin session'}</span>
            </div>
          ) : null}
        </div>

        {!collapsed ? (
          <div className="console-sidebar__meta">
            <span className="console-sidebar__meta-pill">
              {env.useMockData ? 'Mock transport' : 'Live transport'}
            </span>
            <span className="console-sidebar__meta-copy">{getTargetLabel()}</span>
          </div>
        ) : null}

        <div className={collapsed ? 'console-sidebar__actions console-sidebar__actions--collapsed' : 'console-sidebar__actions'}>
          <Link className="button button--secondary" to={appRoutes.chooser} title={collapsed ? 'Console home' : undefined}>
            {collapsed ? 'Home' : 'Console home'}
          </Link>
          <button
            className="button button--secondary"
            type="button"
            onClick={() => {
              void logout()
            }}
            disabled={isAuthenticating}
            title={collapsed ? 'Sign out' : undefined}
          >
            {collapsed ? 'Out' : 'Sign out'}
          </button>
        </div>
      </div>
    </aside>
  )
}
