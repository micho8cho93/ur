import {
  analyticsSectionNavItems,
  appRoutes,
  primaryNavItems,
  sectionEntryItems,
  sectionNavItems,
} from './routes'

describe('console routes', () => {
  it('keeps existing primary paths stable while adding settings and analytics sections', () => {
    expect(appRoutes.chooser).toBe('/')
    expect(appRoutes.tournaments.home).toBe('/tournaments')
    expect(appRoutes.tournaments.runs).toBe('/tournaments/runs')
    expect(appRoutes.tournaments.create).toBe('/tournaments/runs/new')
    expect(appRoutes.analytics.home).toBe('/analytics')
    expect(appRoutes.analytics.section('players')).toBe('/analytics/players')
    expect(appRoutes.store.home).toBe('/store')
    expect(appRoutes.store.overview).toBe('/store/overview')
    expect(appRoutes.store.catalog).toBe('/store/catalog')
    expect(appRoutes.store.rotation).toBe('/store/rotation')
    expect(appRoutes.store.stats).toBe('/store/stats')
    expect(appRoutes.gameModes.home).toBe('/game-modes')
    expect(appRoutes.gameModes.new).toBe('/game-modes/new')
    expect(appRoutes.gameModes.edit('moonlight')).toBe('/game-modes/moonlight')
    expect(appRoutes.settings).toBe('/settings')
  })

  it('preserves legacy redirects for old bookmarks', () => {
    expect(appRoutes.legacy.auditLog).toBe('/audit-log')
    expect(appRoutes.legacy.tournaments.create).toBe('/tournaments/new')
    expect(appRoutes.legacy.tournaments.detail('spring-open')).toBe('/tournaments/spring-open')
  })

  it('defines top-level internals section entries', () => {
    expect(sectionEntryItems.map((item) => item.label)).toEqual([
      'Tournaments',
      'Analytics',
      'Store',
      'Game Modes',
      'Settings',
      'User Feedback',
    ])
  })

  it('keeps sidebar navigation scoped to the selected section', () => {
    expect(sectionNavItems.tournaments.map((item) => item.label)).toEqual([
      'Overview',
      'Create',
      'Runs',
      'Audit Log',
    ])
    expect(sectionNavItems.analytics.map((item) => item.label)).toEqual([
      'Overview',
      'Matches',
      'Players',
      'Tournaments',
      'Progression',
      'Realtime',
    ])
    expect(sectionNavItems.store.map((item) => item.label)).toEqual([
      'Overview',
      'Catalog',
      'Rotation',
      'Store Stats',
    ])
    expect(sectionNavItems.gameModes.map((item) => item.label)).toEqual([
      'Saved Modes',
      'Create Mode',
    ])
    expect(sectionNavItems.settings.map((item) => item.label)).toEqual([
      'Console Settings',
    ])
    expect(sectionNavItems.feedback.map((item) => item.label)).toEqual([
      'Inbox',
    ])
    expect(primaryNavItems).toHaveLength(18)
  })

  it('splits analytics into focused subviews', () => {
    expect(analyticsSectionNavItems.map((item) => item.label)).toEqual([
      'Executive Summary',
      'Player Growth',
      'Match Health',
      'Tournament Performance',
      'Progression',
      'Realtime Ops',
    ])
  })
})
