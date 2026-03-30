import type { TournamentStatus } from '../types/tournament'

interface StatusBadgeProps {
  status: TournamentStatus
}

const classNameByStatus: Record<TournamentStatus, string> = {
  Draft: 'status-badge status-badge--draft',
  Open: 'status-badge status-badge--open',
  Closed: 'status-badge status-badge--closed',
  Finalized: 'status-badge status-badge--finalized',
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={classNameByStatus[status]}>
      <span className="status-badge__dot" aria-hidden="true" />
      <span>{status}</span>
    </span>
  )
}
