import { Navigate, useParams } from 'react-router-dom'
import { appRoutes } from '../routes'

export function LegacyTournamentDetailRedirect() {
  const { tournamentId } = useParams<{ tournamentId: string }>()
  return <Navigate to={appRoutes.tournaments.detail(tournamentId ?? '')} replace />
}
