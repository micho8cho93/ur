import { analyticsNavItems, appRoutes, tournamentsNavItems } from './routes'

describe('workspace routes', () => {
  it('keeps tournaments and analytics on separate primary paths', () => {
    expect(appRoutes.chooser).toBe('/')
    expect(appRoutes.tournaments.home).toBe('/tournaments')
    expect(appRoutes.tournaments.runs).toBe('/tournaments/runs')
    expect(appRoutes.tournaments.create).toBe('/tournaments/runs/new')
    expect(appRoutes.analytics.home).toBe('/analytics')
  })

  it('preserves legacy redirects for old bookmarks', () => {
    expect(appRoutes.legacy.auditLog).toBe('/audit-log')
    expect(appRoutes.legacy.tournaments.create).toBe('/tournaments/new')
    expect(appRoutes.legacy.tournaments.detail('spring-open')).toBe('/tournaments/spring-open')
  })

  it('removes analytics from the tournaments workspace navigation', () => {
    expect(tournamentsNavItems.map((item) => item.label)).toEqual([
      'Overview',
      'Runs',
      'Create Tournament',
      'Audit Log',
    ])
    expect(tournamentsNavItems.some((item) => item.to === appRoutes.analytics.home)).toBe(false)
  })

  it('keeps analytics on its own workspace navigation', () => {
    expect(analyticsNavItems).toEqual([
      {
        label: 'Executive view',
        to: '/analytics',
        short: 'AN',
        end: true,
      },
    ])
  })
})
