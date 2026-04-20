import { useMemo, useState } from 'react'
import { useSession } from '../auth/useSession'
import env from '../config/env'
import { useTopbarActions } from '../layout/TopbarActionsContext'
import { MetaStrip, MetaStripItem } from '../components/MetaStrip'
import { PageHeader } from '../components/PageHeader'
import { SectionPanel } from '../components/SectionPanel'
import { getTargetLabel } from '../layout/workspaceMeta'

interface SettingsRow {
  key: string
  label: string
  value: string
  group: 'session' | 'environment'
}

function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>

  const lq = query.toLowerCase()
  const lt = text.toLowerCase()
  const idx = lt.indexOf(lq)
  if (idx === -1) return <>{text}</>

  return (
    <>
      {text.slice(0, idx)}
      <mark className="settings-highlight">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  )
}

export function SettingsPage() {
  const { adminIdentity, isAuthenticating, logout } = useSession()
  const [search, setSearch] = useState('')

  useTopbarActions(
    <button
      className="button button--secondary"
      type="button"
      onClick={() => { void logout() }}
      disabled={isAuthenticating}
    >
      Sign out
    </button>,
    [isAuthenticating, logout],
  )

  const sessionRows: SettingsRow[] = [
    { key: 'displayName', label: 'Display name', value: adminIdentity?.displayName ?? 'Unavailable', group: 'session' },
    { key: 'username', label: 'Username', value: adminIdentity?.username ?? 'Unavailable', group: 'session' },
    { key: 'email', label: 'Email', value: adminIdentity?.email ?? 'Unavailable', group: 'session' },
    { key: 'userId', label: 'User ID', value: adminIdentity?.userId ?? 'Unavailable', group: 'session' },
  ]

  const envRows: SettingsRow[] = [
    { key: 'baseUrl', label: 'Base URL', value: env.nakamaBaseUrl, group: 'environment' },
    { key: 'mockData', label: 'Mock data', value: env.useMockData ? 'Enabled' : 'Disabled', group: 'environment' },
    { key: 'analyticsTransport', label: 'Analytics transport', value: 'Live backend data only', group: 'environment' },
    { key: 'consoleFocus', label: 'Console focus', value: 'Operational monitoring and low-volume analytics', group: 'environment' },
  ]

  const allRows = [...sessionRows, ...envRows]

  const filteredSession = useMemo(() => {
    if (!search) return sessionRows
    const q = search.toLowerCase()
    return sessionRows.filter(
      (r) => r.label.toLowerCase().includes(q) || r.value.toLowerCase().includes(q),
    )
  }, [search, sessionRows])

  const filteredEnv = useMemo(() => {
    if (!search) return envRows
    const q = search.toLowerCase()
    return envRows.filter(
      (r) => r.label.toLowerCase().includes(q) || r.value.toLowerCase().includes(q),
    )
  }, [search, envRows])

  const hasResults = filteredSession.length > 0 || filteredEnv.length > 0

  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title="Console settings"
        description="Session, environment, and operator controls for UR Internals."
      />

      <MetaStrip>
        <MetaStripItem
          label="Transport"
          value={env.useMockData ? 'Mock' : 'Live'}
          hint={env.useMockData ? 'Using mock transport responses.' : 'Using live admin RPC transport.'}
          tone={env.useMockData ? 'warning' : 'success'}
        />
        <MetaStripItem label="API target" value={getTargetLabel()} hint="Current Nakama admin host." />
        <MetaStripItem
          label="Access role"
          value={adminIdentity?.role ?? 'Unavailable'}
          hint="Role detected from the authenticated admin identity."
          tone="accent"
        />
        <MetaStripItem
          label="User"
          value={adminIdentity?.displayName ?? adminIdentity?.username ?? 'Admin'}
          hint={adminIdentity?.email ?? adminIdentity?.userId ?? 'No additional identity metadata.'}
        />
      </MetaStrip>

      <div className="settings-search" role="search">
        <span className="settings-search__icon" aria-hidden="true">⌕</span>
        <input
          className="settings-search__input"
          type="search"
          placeholder="Search settings…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search settings"
        />
        {search ? (
          <span style={{ fontSize: '0.76rem', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
            {filteredSession.length + filteredEnv.length} of {allRows.length}
          </span>
        ) : null}
      </div>

      {!hasResults ? (
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          No settings match "{search}".
        </p>
      ) : (
        <section className="settings-grid">
          {filteredSession.length > 0 ? (
            <SectionPanel title="Session details" subtitle="Current authenticated operator context.">
              <dl className="key-value-list">
                {filteredSession.map((row) => (
                  <div key={row.key} className="key-value-list__row">
                    <dt><HighlightedText text={row.label} query={search} /></dt>
                    <dd className={row.key === 'userId' ? 'mono' : undefined}>
                      <HighlightedText text={row.value} query={search} />
                    </dd>
                  </div>
                ))}
              </dl>
            </SectionPanel>
          ) : null}

          {filteredEnv.length > 0 ? (
            <SectionPanel title="Environment" subtitle="Runtime details relevant to admin operations.">
              <dl className="key-value-list">
                {filteredEnv.map((row) => (
                  <div key={row.key} className="key-value-list__row">
                    <dt><HighlightedText text={row.label} query={search} /></dt>
                    <dd><HighlightedText text={row.value} query={search} /></dd>
                  </div>
                ))}
              </dl>
            </SectionPanel>
          ) : null}
        </section>
      )}

      <SectionPanel
        title="Operator notes"
        subtitle="Constraints and expectations for this console."
      >
        <ul className="list list--dense">
          <li className="list__item">
            <strong>Low-volume safe surfaces</strong>
            <span className="muted">Dashboards and analytics should clearly show when there is no data or not enough data in the selected range.</span>
          </li>
          <li className="list__item">
            <strong>Routes stay stable</strong>
            <span className="muted">Existing tournament and analytics URLs remain valid, with analytics now segmented into focused subviews.</span>
          </li>
          <li className="list__item">
            <strong>Operational priority</strong>
            <span className="muted">Tables, queue visibility, and current state should stay above decorative presentation elements.</span>
          </li>
        </ul>
      </SectionPanel>
    </>
  )
}
