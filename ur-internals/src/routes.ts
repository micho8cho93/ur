import type { AnalyticsSectionId } from './types/analytics'

export type InternalsSectionId = 'tournaments' | 'analytics' | 'store' | 'settings'

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

export interface InternalsSection {
  id: InternalsSectionId
  label: string
  short: string
  eyebrow: string
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
    home: '/store',
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

export const internalsSections: Record<InternalsSectionId, InternalsSection> = {
  tournaments: {
    id: 'tournaments',
    label: 'Tournaments',
    short: 'TN',
    eyebrow: 'Tournament Internals',
    description: 'Run creation, bracket operations, live tournament pressure, and audit review.',
    to: appRoutes.tournaments.home,
  },
  analytics: {
    id: 'analytics',
    label: 'Analytics',
    short: 'AN',
    eyebrow: 'Analytics Internals',
    description: 'Player, match, progression, tournament, and realtime telemetry views.',
    to: appRoutes.analytics.home,
  },
  store: {
    id: 'store',
    label: 'Store',
    short: 'ST',
    eyebrow: 'Store Internals',
    description: 'Catalog control, rotation management, events, and purchase reporting.',
    to: appRoutes.store.home,
  },
  settings: {
    id: 'settings',
    label: 'Settings',
    short: 'SE',
    eyebrow: 'Settings Internals',
    description: 'Session, environment, operator identity, and console access controls.',
    to: appRoutes.settings,
  },
}

export const sectionEntryItems = [
  internalsSections.tournaments,
  internalsSections.analytics,
  internalsSections.store,
  internalsSections.settings,
]

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

export const tournamentNavItems: SidebarNavItem[] = [
  {
    label: 'Overview',
    to: appRoutes.tournaments.home,
    short: 'OV',
    section: 'Tournaments',
    end: true,
  },
  {
    label: 'Create',
    to: appRoutes.tournaments.create,
    short: 'CR',
    section: 'Tournaments',
    end: true,
  },
  {
    label: 'Runs',
    to: appRoutes.tournaments.runs,
    short: 'RN',
    section: 'Tournaments',
    matchPrefixes: [appRoutes.tournaments.runs],
    excludePrefixes: [appRoutes.tournaments.create],
  },
  {
    label: 'Audit Log',
    to: appRoutes.tournaments.auditLog,
    short: 'AL',
    section: 'Governance',
    end: true,
  },
]

export const analyticsNavItems: SidebarNavItem[] = [
  {
    label: 'Overview',
    to: appRoutes.analytics.section('overview'),
    short: 'OV',
    section: 'Analytics',
    end: true,
  },
  {
    label: 'Matches',
    to: appRoutes.analytics.section('gameplay'),
    short: 'MT',
    section: 'Analytics',
    end: true,
  },
  {
    label: 'Players',
    to: appRoutes.analytics.section('players'),
    short: 'PL',
    section: 'Analytics',
    end: true,
  },
  {
    label: 'Tournaments',
    to: appRoutes.analytics.section('tournaments'),
    short: 'TN',
    section: 'Analytics',
    end: true,
  },
  {
    label: 'Progression',
    to: appRoutes.analytics.section('progression'),
    short: 'XP',
    section: 'Analytics',
    end: true,
  },
  {
    label: 'Realtime',
    to: appRoutes.analytics.section('realtime'),
    short: 'RT',
    section: 'Analytics',
    end: true,
  },
]

export const storeNavItems: SidebarNavItem[] = [
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
]

export const settingsNavItems: SidebarNavItem[] = [
  {
    label: 'Console Settings',
    to: appRoutes.settings,
    short: 'ST',
    section: 'Settings',
    end: true,
  },
]

export const sectionNavItems: Record<InternalsSectionId, SidebarNavItem[]> = {
  tournaments: tournamentNavItems,
  analytics: analyticsNavItems,
  store: storeNavItems,
  settings: settingsNavItems,
}

export const primaryNavItems: SidebarNavItem[] = [
  ...tournamentNavItems,
  ...analyticsNavItems,
  ...storeNavItems,
  ...settingsNavItems,
]
