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
  const { authError, clearAuthError, isAuthenticating, loginWithEmail, loginWithGoogle } =
    useSession()
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

  async function handleGoogleLogin() {
    setLocalError(null)
    clearAuthError()

    try {
      const admin = await loginWithGoogle()
      if (admin) {
        void navigate(redirectTo, { replace: true })
      }
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : 'Unable to sign in with Google.')
    }
  }

  return (
    <div className="auth-shell">
      <section className="auth-panel">
        <div className="auth-hero">
          <p className="meta-label">Ur Game Internals</p>
          <h1>Admin sign-in</h1>
          <p className="auth-copy">
            Authenticate with Nakama, verify admin access through <code>rpc_admin_whoami</code>,
            and only then enter the dashboard.
          </p>
        </div>

        <div className="auth-meta">
          <div className="metric-card">
            <span className="meta-label">Target</span>
            <strong>{getTargetLabel()}</strong>
          </div>
          <div className="metric-card">
            <span className="meta-label">Access</span>
            <strong>Viewer, operator, or admin</strong>
          </div>
        </div>

        {errorMessage ? <div className="alert alert--error">{errorMessage}</div> : null}

        <form className="form auth-form" onSubmit={handleEmailLogin}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
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
            {isAuthenticating ? 'Signing in...' : 'Sign in with email'}
          </button>
        </form>

        <div className="auth-divider" role="separator" aria-label="Alternative sign-in methods">
          <span>or</span>
        </div>

        <button
          className="button auth-button"
          type="button"
          onClick={handleGoogleLogin}
          disabled={isAuthenticating || env.googleWebClientId.length === 0}
        >
          {env.googleWebClientId.length === 0 ? 'Google SSO not configured' : 'Continue with Google'}
        </button>

        <p className="muted auth-footnote">
          Successful sign-in stores the Nakama session token locally and refreshes it on reload when
          possible.
        </p>
      </section>
    </div>
  )
}
