import { analyticsSectionNavItems, appRoutes, primaryNavItems } from './routes'

describe('console routes', () => {
  it('keeps existing primary paths stable while adding settings and analytics sections', () => {
    expect(appRoutes.chooser).toBe('/')
    expect(appRoutes.tournaments.home).toBe('/tournaments')
    expect(appRoutes.tournaments.runs).toBe('/tournaments/runs')
    expect(appRoutes.tournaments.create).toBe('/tournaments/runs/new')
    expect(appRoutes.analytics.home).toBe('/analytics')
    expect(appRoutes.analytics.section('players')).toBe('/analytics/players')
    expect(appRoutes.settings).toBe('/settings')
  })

  it('preserves legacy redirects for old bookmarks', () => {
    expect(appRoutes.legacy.auditLog).toBe('/audit-log')
    expect(appRoutes.legacy.tournaments.create).toBe('/tournaments/new')
    expect(appRoutes.legacy.tournaments.detail('spring-open')).toBe('/tournaments/spring-open')
  })

  it('defines a compact admin primary navigation', () => {
    expect(primaryNavItems.map((item) => item.label)).toEqual([
      'Overview',
      'Tournaments',
      'Runs',
      'Matches',
      'Players',
      'Analytics',
      'Audit Log',
      'Settings',
    ])
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
