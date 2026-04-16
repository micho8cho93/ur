import { Navigate, createBrowserRouter } from 'react-router-dom'
import { PublicOnlyRoute, RequireAdminAuth } from './auth/RouteGuards'
import { AppShell } from './components/AppShell'
import { AuditLogPage } from './pages/AuditLog'
import { AnalyticsPage } from './pages/Analytics'
import { CreateTournamentPage } from './pages/CreateTournament'
import { LegacyTournamentDetailRedirect } from './pages/LegacyTournamentDetailRedirect'
import { LoginPage } from './pages/Login'
import { OverviewPage } from './pages/Overview'
import { SettingsPage } from './pages/Settings'
import { StoreCatalogPage } from './pages/StoreCatalog'
import { StoreRotationPage } from './pages/StoreRotation'
import { StoreStatsPage } from './pages/StoreStats'
import { TournamentDetailPage } from './pages/TournamentDetail'
import { TournamentsPage } from './pages/Tournaments'
import { WorkspaceChooserPage } from './pages/WorkspaceChooser'
import { appRoutes } from './routes'

export const router = createBrowserRouter([
  {
    element: <PublicOnlyRoute />,
    children: [
      {
        path: '/login',
        element: <LoginPage />,
      },
    ],
  },
  {
    element: <RequireAdminAuth />,
    children: [
      {
        path: appRoutes.chooser,
        element: <WorkspaceChooserPage />,
      },
      {
        element: <AppShell section="tournaments" />,
        children: [
          {
            path: appRoutes.tournaments.home,
            element: <OverviewPage />,
          },
          {
            path: appRoutes.tournaments.runs,
            element: <TournamentsPage />,
          },
          {
            path: appRoutes.tournaments.create,
            element: <CreateTournamentPage />,
          },
          {
            path: appRoutes.tournaments.detail(':tournamentId'),
            element: <TournamentDetailPage />,
          },
          {
            path: appRoutes.tournaments.auditLog,
            element: <AuditLogPage />,
          },
        ],
      },
      {
        element: <AppShell section="analytics" />,
        children: [
          {
            path: appRoutes.analytics.home,
            element: <Navigate to={appRoutes.analytics.section('overview')} replace />,
          },
          {
            path: appRoutes.analytics.section(':sectionId'),
            element: <AnalyticsPage />,
          },
        ],
      },
      {
        element: <AppShell section="store" />,
        children: [
          {
            path: appRoutes.store.home,
            element: <Navigate to={appRoutes.store.catalog} replace />,
          },
          {
            path: appRoutes.store.catalog,
            element: <StoreCatalogPage />,
          },
          {
            path: appRoutes.store.rotation,
            element: <StoreRotationPage />,
          },
          {
            path: appRoutes.store.stats,
            element: <StoreStatsPage />,
          },
        ],
      },
      {
        element: <AppShell section="settings" />,
        children: [
          {
            path: appRoutes.settings,
            element: <SettingsPage />,
          },
        ],
      },
      {
        path: appRoutes.legacy.auditLog,
        element: <Navigate to={appRoutes.tournaments.auditLog} replace />,
      },
      {
        path: appRoutes.legacy.tournaments.create,
        element: <Navigate to={appRoutes.tournaments.create} replace />,
      },
      {
        path: '/tournaments/:tournamentId',
        element: <LegacyTournamentDetailRedirect />,
      },
    ],
  },
])
