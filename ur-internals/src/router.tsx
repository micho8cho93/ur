import { Navigate, createBrowserRouter } from 'react-router-dom'
import { PublicOnlyRoute, RequireAdminAuth } from './auth/RouteGuards'
import { AnalyticsLayout } from './layout/AnalyticsLayout'
import { TournamentsLayout } from './layout/TournamentsLayout'
import { AuditLogPage } from './pages/AuditLog'
import { AnalyticsPage } from './pages/Analytics'
import { CreateTournamentPage } from './pages/CreateTournament'
import { LegacyTournamentDetailRedirect } from './pages/LegacyTournamentDetailRedirect'
import { LoginPage } from './pages/Login'
import { OverviewPage } from './pages/Overview'
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
        path: appRoutes.tournaments.home,
        element: <TournamentsLayout />,
        children: [
          {
            index: true,
            element: <OverviewPage />,
          },
          {
            path: 'runs',
            element: <TournamentsPage />,
          },
          {
            path: 'runs/new',
            element: <CreateTournamentPage />,
          },
          {
            path: 'runs/:tournamentId',
            element: <TournamentDetailPage />,
          },
          {
            path: 'audit-log',
            element: <AuditLogPage />,
          },
        ],
      },
      {
        path: appRoutes.analytics.home,
        element: <AnalyticsLayout />,
        children: [
          {
            index: true,
            element: <AnalyticsPage />,
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
