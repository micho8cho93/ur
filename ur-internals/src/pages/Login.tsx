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
  const { authError, clearAuthError, isAuthenticating, loginWithUsername } = useSession()
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)
  const redirectTo = resolveRedirectTo(location.state)
  const errorMessage = localError ?? authError

  async function handleUsernameLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLocalError(null)
    clearAuthError()

    try {
      await loginWithUsername(username, password)
      void navigate(redirectTo, { replace: true })
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : 'Unable to sign in.')
    }
  }

  return (
    <div className="auth-shell">
      <section className="auth-panel">
        <div className="auth-hero">
          <p className="meta-label">Ur Game Internals</p>
          <h1>Admin sign-in</h1>
          <p className="auth-copy">
            Sign in with the admin test account, verify access through{' '}
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
            <strong>Test admin account</strong>
          </div>
        </div>

        {errorMessage ? <div className="alert alert--error">{errorMessage}</div> : null}

        <form className="form auth-form" onSubmit={handleUsernameLogin}>
          <div className="field">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="admin"
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

        <p className="muted auth-footnote">
          Quick test credentials: <code>admin</code> / <code>password</code>. Successful sign-in
          stores the Nakama session token locally and refreshes it on reload when possible.
        </p>
      </section>
    </div>
  )
}
