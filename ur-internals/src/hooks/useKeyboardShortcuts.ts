import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { appRoutes } from '../routes'

const SHORTCUT_MAP: Record<string, string> = {
  t: appRoutes.tournaments.home,
  a: appRoutes.analytics.home,
  s: appRoutes.store.home,
  g: appRoutes.gameModes.home,
  f: appRoutes.feedback.home,
  e: appRoutes.settings,
}

interface UseKeyboardShortcutsOptions {
  onShowHelp: () => void
}

export function useKeyboardShortcuts({ onShowHelp }: UseKeyboardShortcutsOptions) {
  const navigate = useNavigate()
  const pendingRef = useRef<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const tag = (event.target as Element).tagName
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return
      if (event.metaKey || event.ctrlKey || event.altKey) return

      const key = event.key.toLowerCase()

      if (key === '?') {
        onShowHelp()
        return
      }

      if (pendingRef.current === 'g') {
        if (timerRef.current) clearTimeout(timerRef.current)
        pendingRef.current = null
        const route = SHORTCUT_MAP[key]
        if (route) {
          event.preventDefault()
          navigate(route)
        }
        return
      }

      if (key === 'g') {
        pendingRef.current = 'g'
        timerRef.current = setTimeout(() => {
          pendingRef.current = null
        }, 1000)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [navigate, onShowHelp])
}
