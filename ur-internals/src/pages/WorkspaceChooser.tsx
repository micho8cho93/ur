import { Link } from 'react-router-dom'
import { useSession } from '../auth/useSession'
import { sectionEntryItems } from '../routes'
import { getAdminLabel, getMonogram, getTargetLabel } from '../layout/workspaceMeta'

export function WorkspaceChooserPage() {
  const { adminIdentity, logout, isAuthenticating } = useSession()
  const adminLabel = getAdminLabel(adminIdentity)

  return (
    <div className="chooser-shell">
      <section className="chooser-hero">
        <div className="chooser-hero__copy">
          <p className="meta-label">Ur Game Internals</p>
          <h1>Choose an internals section</h1>
          <p className="chooser-hero__description">
            Pick the area you want to work in. Each section keeps its own pages and sidebar so tournament, analytics, store, and settings work stay separated.
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
            <span>Same-origin admin RPC, live analytics, store, and settings transport.</span>
          </div>
        </div>
      </section>

      <section className="chooser-grid" aria-label="Workspace choices">
        {sectionEntryItems.map((section, index) => (
          <Link
            key={section.id}
            className={`chooser-card chooser-card--${section.id}`}
            to={section.to}
          >
            <span className="chooser-card__eyebrow">Section {String(index + 1).padStart(2, '0')}</span>
            <strong>{section.label}</strong>
            <p>{section.description}</p>
            <span className="chooser-card__cta">Open {section.label.toLowerCase()}</span>
          </Link>
        ))}
      </section>

      <section className="chooser-footer">
        <div className="chooser-footer__note">
          <p className="meta-label">Why this split</p>
          <strong>Clearer ownership boundaries</strong>
          <span>
            Section entry keeps operators in one work context at a time while preserving a quick return to this chooser.
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
