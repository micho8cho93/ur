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
        element: <AppShell />,
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
          {
            path: appRoutes.analytics.home,
            element: <Navigate to={appRoutes.analytics.section('overview')} replace />,
          },
          {
            path: appRoutes.analytics.section(':sectionId'),
            element: <AnalyticsPage />,
          },
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
