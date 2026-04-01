import { useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useSession } from '../auth/useSession'
import env from '../config/env'

type LoginLocationState = {
  from?: {
    pathname?: string
  }
}

function resolveRedirectTo(state: unknown) {
  const locationState = state as LoginLocationState | null
  return locationState?.from?.pathname || '/'
}

function getTargetLabel() {
  try {
    return new URL(env.nakamaBaseUrl).host
  } catch {
    return env.nakamaBaseUrl
  }
}

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { authError, clearAuthError, isAuthenticating, loginWithEmail } = useSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)
  const redirectTo = resolveRedirectTo(location.state)
  const errorMessage = localError ?? authError

  async function handleEmailLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLocalError(null)
    clearAuthError()

    try {
      await loginWithEmail(email, password)
      void navigate(redirectTo, { replace: true })
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : 'Unable to sign in.')
    }
  }

  return (
    <div className="auth-shell">
      <section className="auth-panel auth-panel--wide">
        <div className="auth-panel__intro">
          <div className="auth-hero">
            <p className="meta-label">Ur Game Internals</p>
            <h1>Operator access</h1>
            <p className="auth-copy">
              Sign in with a real Nakama admin account, verify access through{' '}
              <code>rpc_admin_whoami</code>, and then enter the dashboard.
            </p>
          </div>

          <div className="auth-meta">
            <div className="metric-card">
              <span className="meta-label">Target</span>
              <strong>{getTargetLabel()}</strong>
            </div>
            <div className="metric-card">
              <span className="meta-label">Access</span>
              <strong>Nakama admin account</strong>
            </div>
          </div>

          <ul className="list list--dense auth-notes">
            <li className="list__item">
              <strong>Session verification</strong>
              <span className="muted">Successful auth stores the Nakama session token locally and restores it on reload when possible.</span>
            </li>
            <li className="list__item">
              <strong>Role-gated access</strong>
              <span className="muted">
                The signed-in Nakama account must also have an admin role before the dashboard will unlock.
              </span>
            </li>
          </ul>
        </div>

        <div className="auth-panel__form-block">
          <div className="auth-panel__form-copy">
            <p className="meta-label">Secure access</p>
            <h2>Admin sign-in</h2>
            <p className="auth-footnote">Use the email and password for your Nakama admin account to enter the operations workspace.</p>
          </div>

          {errorMessage ? <div className="alert alert--error">{errorMessage}</div> : null}

          <form className="form auth-form" onSubmit={handleEmailLogin}>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@urgame.live"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Your Nakama password"
                required
              />
            </div>

            <button className="button button--primary auth-button" type="submit" disabled={isAuthenticating}>
              {isAuthenticating ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}
