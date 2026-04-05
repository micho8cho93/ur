import { Link } from 'react-router-dom'
import { useSession } from '../auth/useSession'
import { appRoutes } from '../routes'
import { getAdminLabel, getMonogram, getTargetLabel } from '../layout/workspaceMeta'

export function WorkspaceChooserPage() {
  const { adminIdentity, logout, isAuthenticating } = useSession()
  const adminLabel = getAdminLabel(adminIdentity)

  return (
    <div className="chooser-shell">
      <section className="chooser-hero">
        <div className="chooser-hero__copy">
          <p className="meta-label">Ur Game Internals</p>
          <h1>Open the console</h1>
          <p className="chooser-hero__description">
            UR Internals now runs as one compact admin console with focused sections for operations, analytics, governance, and system controls.
          </p>
        </div>

        <div className="chooser-hero__meta">
          <div className="chooser-session-card">
            <div className="chooser-session-card__avatar" aria-hidden="true">
              {getMonogram(adminLabel)}
            </div>
            <div className="chooser-session-card__copy">
              <p className="meta-label">Signed in</p>
              <strong>{adminLabel}</strong>
              <span>{adminIdentity?.role ?? 'Admin access required'}</span>
            </div>
          </div>

          <div className="chooser-session-card chooser-session-card--compact">
            <p className="meta-label">API target</p>
            <strong>{getTargetLabel()}</strong>
            <span>Same-origin admin RPC and live analytics transport.</span>
          </div>
        </div>
      </section>

      <section className="chooser-grid" aria-label="Workspace choices">
        <Link className="chooser-card chooser-card--tournaments" to={appRoutes.tournaments.home}>
          <span className="chooser-card__eyebrow">Section 01</span>
          <strong>Overview</strong>
          <p>
            Live tournament pressure, queue health, finalize readiness, and the most urgent operational surfaces above the fold.
          </p>
          <span className="chooser-card__cta">Open operations overview</span>
        </Link>

        <Link className="chooser-card chooser-card--analytics" to={appRoutes.tournaments.runs}>
          <span className="chooser-card__eyebrow">Section 02</span>
          <strong>Runs</strong>
          <p>
            Compact run queue, lifecycle status, entrant pressure, and control-room access for currently managed tournaments.
          </p>
          <span className="chooser-card__cta">Open run queue</span>
        </Link>

        <Link className="chooser-card chooser-card--analytics" to={appRoutes.analytics.section('overview')}>
          <span className="chooser-card__eyebrow">Section 03</span>
          <strong>Analytics</strong>
          <p>
            Executive summary, player growth, match health, tournament performance, progression, and realtime operations in focused tab views.
          </p>
          <span className="chooser-card__cta">Open analytics</span>
        </Link>

        <Link className="chooser-card chooser-card--tournaments" to={appRoutes.settings}>
          <span className="chooser-card__eyebrow">Section 04</span>
          <strong>Settings</strong>
          <p>
            Session, environment, and operator context for the live admin console.
          </p>
          <span className="chooser-card__cta">Open settings</span>
        </Link>
      </section>

      <section className="chooser-footer">
        <div className="chooser-footer__note">
          <p className="meta-label">Why this split</p>
          <strong>Sharper operational scanning</strong>
          <span>
            Each section stays narrow, dense, and easier to scan, while still sharing the same compact admin shell.
          </span>
        </div>

        <button
          className="button button--secondary"
          type="button"
          onClick={() => {
            void logout()
          }}
          disabled={isAuthenticating}
        >
          Sign out
        </button>
      </section>
    </div>
  )
}
