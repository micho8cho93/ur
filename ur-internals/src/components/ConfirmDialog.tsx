import { useEffect, type ReactNode } from 'react'

interface ConfirmDialogProps {
  title: string
  message: ReactNode
  consequence?: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'danger' | 'warning' | 'default'
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  title,
  message,
  consequence,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onCancel()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onCancel])

  return (
    <div className="confirm-overlay" role="presentation" onClick={onCancel}>
      <div
        className="confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="confirm-dialog__header">
          <strong id="confirm-title" className="confirm-dialog__title">{title}</strong>
        </div>

        <div className="confirm-dialog__body">
          <p id="confirm-message" className="confirm-dialog__message">{message}</p>
          {consequence ? (
            <div className={`confirm-dialog__consequence confirm-dialog__consequence--${tone}`}>
              {consequence}
            </div>
          ) : null}
        </div>

        <div className="confirm-dialog__actions">
          <button className="button button--secondary" type="button" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            className={tone === 'danger' ? 'button button--danger' : 'button button--primary'}
            type="button"
            onClick={onConfirm}
            autoFocus
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
