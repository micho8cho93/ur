import { useSession } from '../auth/useSession'
import env from '../config/env'
import { useTopbarActions } from '../layout/TopbarActionsContext'
import { MetaStrip, MetaStripItem } from '../components/MetaStrip'
import { PageHeader } from '../components/PageHeader'
import { SectionPanel } from '../components/SectionPanel'
import { getTargetLabel } from '../layout/workspaceMeta'

export function SettingsPage() {
  const { adminIdentity, isAuthenticating, logout } = useSession()

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

      <section className="settings-grid">
        <SectionPanel
          title="Session details"
          subtitle="Current authenticated operator context."
        >
          <dl className="key-value-list">
            <div className="key-value-list__row">
              <dt>Display name</dt>
              <dd>{adminIdentity?.displayName ?? 'Unavailable'}</dd>
            </div>
            <div className="key-value-list__row">
              <dt>Username</dt>
              <dd>{adminIdentity?.username ?? 'Unavailable'}</dd>
            </div>
            <div className="key-value-list__row">
              <dt>Email</dt>
              <dd>{adminIdentity?.email ?? 'Unavailable'}</dd>
            </div>
            <div className="key-value-list__row">
              <dt>User id</dt>
              <dd className="mono">{adminIdentity?.userId ?? 'Unavailable'}</dd>
            </div>
          </dl>
        </SectionPanel>

        <SectionPanel
          title="Environment"
          subtitle="Runtime details relevant to admin operations."
        >
          <dl className="key-value-list">
            <div className="key-value-list__row">
              <dt>Base URL</dt>
              <dd>{env.nakamaBaseUrl}</dd>
            </div>
            <div className="key-value-list__row">
              <dt>Mock data</dt>
              <dd>{env.useMockData ? 'Enabled' : 'Disabled'}</dd>
            </div>
            <div className="key-value-list__row">
              <dt>Analytics transport</dt>
              <dd>Live backend data only</dd>
            </div>
            <div className="key-value-list__row">
              <dt>Console focus</dt>
              <dd>Operational monitoring and low-volume analytics</dd>
            </div>
          </dl>
        </SectionPanel>
      </section>

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
