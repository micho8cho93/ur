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
          <h1>Choose your control center</h1>
          <p className="chooser-hero__description">
            Tournament operations and analytics now live as separate workspaces so each job can stay focused.
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
          <span className="chooser-card__eyebrow">Workspace 01</span>
          <strong>Tournaments</strong>
          <p>
            Open runs, create tournaments, manage control rooms, and review audit activity without analytics in the sidebar.
          </p>
          <span className="chooser-card__cta">Open tournaments control center</span>
        </Link>

        <Link className="chooser-card chooser-card--analytics" to={appRoutes.analytics.home}>
          <span className="chooser-card__eyebrow">Workspace 02</span>
          <strong>Analytics</strong>
          <p>
            Read executive KPIs, growth, gameplay health, tournament performance, progression, and realtime telemetry in a dedicated analytics experience.
          </p>
          <span className="chooser-card__cta">Open analytics control center</span>
        </Link>
      </section>

      <section className="chooser-footer">
        <div className="chooser-footer__note">
          <p className="meta-label">Why this split</p>
          <strong>Cleaner separation of concerns</strong>
          <span>
            Operations stays focused on running tournaments, while analytics stays focused on reading the state of the game.
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
