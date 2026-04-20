import { useEffect } from 'react'

interface KeyboardShortcutsModalProps {
  onClose: () => void
}

const shortcuts = [
  { keys: ['g', 't'], label: 'Go to Tournaments' },
  { keys: ['g', 'a'], label: 'Go to Analytics' },
  { keys: ['g', 's'], label: 'Go to Store' },
  { keys: ['g', 'g'], label: 'Go to Game Modes' },
  { keys: ['g', 'f'], label: 'Go to Feedback' },
  { keys: ['g', 'e'], label: 'Go to Settings' },
  { keys: ['?'], label: 'Show this help' },
  { keys: ['Esc'], label: 'Close dialogs / dismiss' },
]

export function KeyboardShortcutsModal({ onClose }: KeyboardShortcutsModalProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div className="confirm-overlay" role="presentation" onClick={onClose}>
      <div
        className="confirm-dialog shortcuts-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard shortcuts"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="confirm-dialog__header">
          <strong className="confirm-dialog__title">Keyboard shortcuts</strong>
          <button className="button button--secondary" type="button" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="confirm-dialog__body">
          <ul className="shortcuts-list">
            {shortcuts.map((shortcut) => (
              <li key={shortcut.label} className="shortcuts-list__item">
                <span className="shortcuts-list__keys">
                  {shortcut.keys.map((k, i) => (
                    <span key={i}>
                      <kbd className="kbd">{k}</kbd>
                      {i < shortcut.keys.length - 1 ? <span className="shortcuts-list__then">then</span> : null}
                    </span>
                  ))}
                </span>
                <span className="shortcuts-list__label">{shortcut.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
