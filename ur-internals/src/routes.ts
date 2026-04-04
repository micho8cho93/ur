export interface WorkspaceNavItem {
  label: string
  to: string
  short: string
  end?: boolean
}

export const appRoutes = {
  chooser: '/',
  login: '/login',
  tournaments: {
    home: '/tournaments',
    runs: '/tournaments/runs',
    create: '/tournaments/runs/new',
    detail: (tournamentId: string) => `/tournaments/runs/${tournamentId}`,
    auditLog: '/tournaments/audit-log',
  },
  analytics: {
    home: '/analytics',
  },
  legacy: {
    auditLog: '/audit-log',
    tournaments: {
      create: '/tournaments/new',
      detail: (tournamentId: string) => `/tournaments/${tournamentId}`,
    },
  },
} as const

export const tournamentsNavItems: WorkspaceNavItem[] = [
  { label: 'Overview', to: appRoutes.tournaments.home, short: '01', end: true },
  { label: 'Runs', to: appRoutes.tournaments.runs, short: '02' },
  { label: 'Create Tournament', to: appRoutes.tournaments.create, short: '03' },
  { label: 'Audit Log', to: appRoutes.tournaments.auditLog, short: '04' },
]

export const analyticsNavItems: WorkspaceNavItem[] = [
  { label: 'Executive view', to: appRoutes.analytics.home, short: 'AN', end: true },
]
