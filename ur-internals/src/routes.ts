import type { AnalyticsSectionId } from './types/analytics'

export interface SidebarNavItem {
  label: string
  to: string
  short: string
  section: string
  end?: boolean
  matchPrefixes?: string[]
  excludePrefixes?: string[]
}

export interface AnalyticsSectionNavItem {
  id: AnalyticsSectionId
  label: string
  description: string
  to: string
}

export const appRoutes = {
  chooser: '/',
  login: '/login',
  settings: '/settings',
  tournaments: {
    home: '/tournaments',
    runs: '/tournaments/runs',
    create: '/tournaments/runs/new',
    detail: (tournamentId: string) => `/tournaments/runs/${tournamentId}`,
    auditLog: '/tournaments/audit-log',
  },
  analytics: {
    home: '/analytics',
    section: (sectionId: AnalyticsSectionId | string) => `/analytics/${sectionId}`,
  },
  store: {
    catalog: '/store/catalog',
    rotation: '/store/rotation',
    stats: '/store/stats',
  },
  legacy: {
    auditLog: '/audit-log',
    tournaments: {
      create: '/tournaments/new',
      detail: (tournamentId: string) => `/tournaments/${tournamentId}`,
    },
  },
} as const

export const analyticsSectionNavItems: AnalyticsSectionNavItem[] = [
  {
    id: 'overview',
    label: 'Executive Summary',
    description: 'Top-line player, match, and tournament signals for quick operator scanning.',
    to: appRoutes.analytics.section('overview'),
  },
  {
    id: 'players',
    label: 'Player Growth',
    description: 'Acquisition, return behavior, and retention snapshots for a low-volume live product.',
    to: appRoutes.analytics.section('players'),
  },
  {
    id: 'gameplay',
    label: 'Match Health',
    description: 'Completion, reliability, and recent match outcomes with compact diagnostic charts.',
    to: appRoutes.analytics.section('gameplay'),
  },
  {
    id: 'tournaments',
    label: 'Tournament Performance',
    description: 'Run creation, participation, fill pressure, and tournament completion health.',
    to: appRoutes.analytics.section('tournaments'),
  },
  {
    id: 'progression',
    label: 'Progression',
    description: 'XP, rating spread, and rank movement only where live data can support it.',
    to: appRoutes.analytics.section('progression'),
  },
  {
    id: 'realtime',
    label: 'Realtime Ops',
    description: 'Current sessions, active matches, and recent operational events from live telemetry.',
    to: appRoutes.analytics.section('realtime'),
  },
]

export const primaryNavItems: SidebarNavItem[] = [
  {
    label: 'Overview',
    to: appRoutes.tournaments.home,
    short: 'OV',
    section: 'Operate',
    end: true,
  },
  {
    label: 'Tournaments',
    to: appRoutes.tournaments.create,
    short: 'TN',
    section: 'Operate',
    end: true,
  },
  {
    label: 'Runs',
    to: appRoutes.tournaments.runs,
    short: 'RN',
    section: 'Operate',
    matchPrefixes: [appRoutes.tournaments.runs],
    excludePrefixes: [appRoutes.tournaments.create],
  },
  {
    label: 'Matches',
    to: appRoutes.analytics.section('gameplay'),
    short: 'MT',
    section: 'Monitor',
    end: true,
  },
  {
    label: 'Players',
    to: appRoutes.analytics.section('players'),
    short: 'PL',
    section: 'Monitor',
    end: true,
  },
  {
    label: 'Analytics',
    to: appRoutes.analytics.section('overview'),
    short: 'AN',
    section: 'Monitor',
    end: true,
  },
  {
    label: 'Catalog',
    to: appRoutes.store.catalog,
    short: 'CT',
    section: 'Store',
    end: true,
  },
  {
    label: 'Rotation',
    to: appRoutes.store.rotation,
    short: 'RT',
    section: 'Store',
    end: true,
  },
  {
    label: 'Store Stats',
    to: appRoutes.store.stats,
    short: 'SS',
    section: 'Store',
    end: true,
  },
  {
    label: 'Audit Log',
    to: appRoutes.tournaments.auditLog,
    short: 'AL',
    section: 'Governance',
    end: true,
  },
  {
    label: 'Settings',
    to: appRoutes.settings,
    short: 'ST',
    section: 'System',
    end: true,
  },
]
