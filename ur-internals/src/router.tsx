import { createBrowserRouter } from 'react-router-dom'
import { PublicOnlyRoute, RequireAdminAuth } from './auth/RouteGuards'
import { DashboardLayout } from './layout/DashboardLayout'
import { AuditLogPage } from './pages/AuditLog'
import { AnalyticsPage } from './pages/Analytics'
import { CreateTournamentPage } from './pages/CreateTournament'
import { LoginPage } from './pages/Login'
import { OverviewPage } from './pages/Overview'
import { TournamentDetailPage } from './pages/TournamentDetail'
import { TournamentsPage } from './pages/Tournaments'

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
        path: '/',
        element: <DashboardLayout />,
        children: [
          {
            index: true,
            element: <OverviewPage />,
          },
          {
            path: 'tournaments',
            element: <TournamentsPage />,
          },
          {
            path: 'tournaments/new',
            element: <CreateTournamentPage />,
          },
          {
            path: 'tournaments/:tournamentId',
            element: <TournamentDetailPage />,
          },
          {
            path: 'audit-log',
            element: <AuditLogPage />,
          },
          {
            path: 'analytics',
            element: <AnalyticsPage />,
          },
        ],
      },
    ],
  },
])
