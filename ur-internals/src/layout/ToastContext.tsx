import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'

export type ToastTone = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  message: string
  tone: ToastTone
}

interface ToastContextValue {
  showToast: (message: string, tone?: ToastTone, duration?: number) => void
}

export const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
})

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const counterRef = useRef(0)

  const showToast = useCallback((message: string, tone: ToastTone = 'info', duration = 4500) => {
    const id = String(++counterRef.current)
    setToasts((current) => [...current, { id, message, tone }])
    setTimeout(() => {
      setToasts((current) => current.filter((t) => t.id !== id))
    }, duration)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={(id) => setToasts((c) => c.filter((t) => t.id !== id))} />
    </ToastContext.Provider>
  )
}

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  if (toasts.length === 0) return null

  return (
    <div className="toast-container" role="region" aria-label="Notifications" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast--${toast.tone}`}>
          <span className="toast__dot" aria-hidden="true" />
          <span className="toast__message">{toast.message}</span>
          <button
            className="toast__dismiss"
            type="button"
            aria-label="Dismiss notification"
            onClick={() => onDismiss(toast.id)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
