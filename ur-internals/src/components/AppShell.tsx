import { useEffect, useState, type ReactNode } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { useSession } from '../auth/useSession'
import env from '../config/env'
import { TopbarActionsContext } from '../layout/TopbarActionsContext'
import { ToastProvider } from '../layout/ToastContext'
import { getTargetLabel } from '../layout/workspaceMeta'
import { internalsSections, sectionNavItems, type InternalsSectionId } from '../routes'
import { KeyboardShortcutsModal } from './KeyboardShortcutsModal'
import { SidebarNav } from './SidebarNav'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'

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

function AppShellInner({ section }: AppShellProps) {
  const location = useLocation()
  const { adminIdentity } = useSession()
  const sectionMeta = internalsSections[section]
  const items = sectionNavItems[section]
  const [topbarActions, setTopbarActions] = useState<ReactNode>(null)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') {
      return false
    }

    return window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === 'true'
  })

  useKeyboardShortcuts({ onShowHelp: () => setShowShortcuts(true) })

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

  const isLive = !env.useMockData

  return (
    <TopbarActionsContext.Provider value={{ setActions: setTopbarActions }}>
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
          {isLive ? (
            <div className="env-banner" role="status" aria-label="Live environment active">
              <span className="env-banner__dot" aria-hidden="true" />
              Live environment — changes affect real data
            </div>
          ) : null}

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
              {topbarActions}
              <button
                className="button button--secondary"
                type="button"
                onClick={() => setShowShortcuts(true)}
                title="Keyboard shortcuts (?)"
                aria-label="Show keyboard shortcuts"
              >
                ?
              </button>
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

      {showShortcuts ? (
        <KeyboardShortcutsModal onClose={() => setShowShortcuts(false)} />
      ) : null}
    </TopbarActionsContext.Provider>
  )
}

export function AppShell({ section }: AppShellProps) {
  return (
    <ToastProvider>
      <AppShellInner section={section} />
    </ToastProvider>
  )
}
