import { getPublicTournamentStatus, launchTournamentMatch } from '@/services/tournaments';
import { useTournamentMatchLauncher } from '@/src/tournaments/useTournamentMatchLauncher';
import type { PublicTournamentDetail, PublicTournamentStanding } from '@/src/tournaments/types';
import { useEffect, useRef, useState } from 'react';

const TOURNAMENT_WAIT_POLL_INTERVAL_MS = 4_000;
const TOURNAMENT_LAUNCH_RETRY_BACKOFF_MS = 6_000;
const TOURNAMENT_LAUNCH_RETRY_BACKOFF_MAX_MS = 12_000;
const READY_CUE_OPPONENT_FOUND_MS = 260;
const READY_CUE_JOINING_MS = 720;

export type TournamentAdvanceFlowPhase =
  | 'waiting'
  | 'refreshing'
  | 'ready'
  | 'launching'
  | 'retrying'
  | 'finalized'
  | 'eliminated';

type UseTournamentAdvanceFlowOptions = {
  enabled: boolean;
  runId: string | null;
  tournamentId: string | null;
  tournamentName: string;
  gameMode: string;
  didPlayerWin: boolean;
  playerUserId: string | null;
  finishedMatchId: string | null;
  initialRound?: number | null;
};

export type UseTournamentAdvanceFlowResult = {
  isActive: boolean;
  phase: TournamentAdvanceFlowPhase;
  tournament: PublicTournamentDetail | null;
  standings: PublicTournamentStanding[];
  currentStanding: PublicTournamentStanding | null;
  derivedRound: number | null;
  statusText: string;
  subtleStatusText: string | null;
  retryMessage: string | null;
  finalPlacement: number | null;
  isChampion: boolean;
};

const isSoftLaunchFailure = (error: unknown): { message: string; soft: boolean } => {
  const message = error instanceof Error ? error.message : 'The next match was not ready yet.';

  return {
    message,
    soft:
      /ready|wait|progress|pending|queue|opponent|match|launch|bracket/i.test(message) ||
      /empty/i.test(message),
  };
};

const buildFinalizedStatusText = (isChampion: boolean, finalPlacement: number | null): string => {
  if (isChampion) {
    return 'You claimed the tournament crown.';
  }

  if (typeof finalPlacement === 'number') {
    return `Tournament complete. You finished at rank ${finalPlacement}.`;
  }

  return 'Tournament complete.';
};

const getCurrentStanding = (
  standings: PublicTournamentStanding[],
  playerUserId: string | null,
): PublicTournamentStanding | null => standings.find((entry) => entry.ownerId === playerUserId) ?? null;

export const useTournamentAdvanceFlow = ({
  enabled,
  runId,
  tournamentId,
  tournamentName,
  gameMode,
  didPlayerWin,
  playerUserId,
  finishedMatchId,
  initialRound = null,
}: UseTournamentAdvanceFlowOptions): UseTournamentAdvanceFlowResult => {
  const { finalizeMatchLaunch } = useTournamentMatchLauncher();
  const [phase, setPhase] = useState<TournamentAdvanceFlowPhase>('waiting');
  const [tournament, setTournament] = useState<PublicTournamentDetail | null>(null);
  const [standings, setStandings] = useState<PublicTournamentStanding[]>([]);
  const [currentStanding, setCurrentStanding] = useState<PublicTournamentStanding | null>(null);
  const [derivedRound, setDerivedRound] = useState<number | null>(initialRound);
  const [statusText, setStatusText] = useState('Waiting for the next round to settle.');
  const [subtleStatusText, setSubtleStatusText] = useState<string | null>('Refreshing tournament status.');
  const [retryMessage, setRetryMessage] = useState<string | null>(null);
  const [finalPlacement, setFinalPlacement] = useState<number | null>(null);
  const [isChampion, setIsChampion] = useState(false);
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const readyTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const isMountedRef = useRef(false);
  const stoppedRef = useRef(false);
  const flowTokenRef = useRef(0);
  const refreshSequenceRef = useRef(0);
  const launchSequenceRef = useRef(0);
  const launchInFlightRef = useRef(false);
  const retryBackoffMsRef = useRef(TOURNAMENT_LAUNCH_RETRY_BACKOFF_MS);

  const clearPollTimeout = () => {
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
  };

  const clearReadyTimeouts = () => {
    readyTimeoutsRef.current.forEach((timer) => clearTimeout(timer));
    readyTimeoutsRef.current = [];
  };

  const scheduleRefresh = (refresh: () => void, delayMs = TOURNAMENT_WAIT_POLL_INTERVAL_MS) => {
    clearPollTimeout();

    if (!isMountedRef.current || stoppedRef.current) {
      return;
    }

    pollTimeoutRef.current = setTimeout(() => {
      pollTimeoutRef.current = null;
      refresh();
    }, delayMs);
  };

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      stoppedRef.current = true;
      clearPollTimeout();
      clearReadyTimeouts();
    };
  }, []);

  useEffect(() => {
    const flowToken = flowTokenRef.current + 1;
    flowTokenRef.current = flowToken;
    clearPollTimeout();
    clearReadyTimeouts();
    stoppedRef.current = false;
    launchInFlightRef.current = false;
    retryBackoffMsRef.current = TOURNAMENT_LAUNCH_RETRY_BACKOFF_MS;

    if (!enabled || !runId || !tournamentId || !playerUserId || !finishedMatchId) {
      setPhase('waiting');
      setTournament(null);
      setStandings([]);
      setCurrentStanding(null);
      setDerivedRound(initialRound);
      setStatusText(didPlayerWin ? 'Waiting for the next round to settle.' : 'Waiting for the tournament result to settle.');
      setSubtleStatusText(null);
      setRetryMessage(null);
      setFinalPlacement(null);
      setIsChampion(false);
      return;
    }

    const refreshStatus = () => {
      if (stoppedRef.current || !isMountedRef.current || flowTokenRef.current !== flowToken) {
        return;
      }

      const sequence = refreshSequenceRef.current + 1;
      refreshSequenceRef.current = sequence;
      setPhase((current) => (current === 'retrying' ? current : 'refreshing'));
      setSubtleStatusText((current) => current ?? 'Refreshing tournament status.');

      void getPublicTournamentStatus(runId)
        .then((snapshot) => {
          if (
            !isMountedRef.current ||
            stoppedRef.current ||
            flowTokenRef.current !== flowToken ||
            refreshSequenceRef.current !== sequence
          ) {
            return;
          }

          const nextStanding = getCurrentStanding(snapshot.standings, playerUserId);
          const participation = snapshot.tournament.participation;
          const nextRound = participation.currentRound ?? nextStanding?.round ?? initialRound ?? null;
          const nextPlacement = participation.finalPlacement ?? nextStanding?.rank ?? null;
          const nextChampion =
            participation.state === 'champion' ||
            (snapshot.tournament.lifecycle === 'finalized' && nextPlacement === 1);

          setTournament(snapshot.tournament);
          setStandings(snapshot.standings);
          setCurrentStanding(nextStanding);
          setDerivedRound(nextRound);
          setFinalPlacement(nextPlacement);
          setIsChampion(nextChampion);

          if (
            snapshot.tournament.lifecycle === 'finalized' ||
            snapshot.tournament.lifecycle === 'closed' ||
            participation.state === 'champion' ||
            participation.state === 'runner_up'
          ) {
            stoppedRef.current = true;
            clearPollTimeout();
            clearReadyTimeouts();
            setPhase('finalized');
            setStatusText(buildFinalizedStatusText(nextChampion, nextPlacement));
            setSubtleStatusText(
              nextChampion
                ? 'Your run is complete and the final standings are locked.'
                : 'Final standings are now locked.',
            );
            setRetryMessage(null);
            return;
          }

          if (participation.state === 'eliminated') {
            stoppedRef.current = true;
            clearPollTimeout();
            clearReadyTimeouts();
            setPhase('eliminated');
            setStatusText('Your tournament run has ended.');
            setSubtleStatusText('Your final result is locked in.');
            setRetryMessage(null);
            return;
          }

          if (!didPlayerWin) {
            setPhase('waiting');
            setStatusText('Recording the final tournament result...');
            setSubtleStatusText('Waiting for the bracket to confirm your placement.');
            setRetryMessage(null);
            scheduleRefresh(refreshStatus);
            return;
          }

          if (participation.lastResult !== 'win') {
            setPhase('waiting');
            setStatusText('Recording your victory in the bracket...');
            setSubtleStatusText('Waiting for the completed match to publish its tournament result.');
            setRetryMessage(null);
            scheduleRefresh(refreshStatus);
            return;
          }

          if (!participation.canLaunch) {
            launchInFlightRef.current = false;
            setPhase('waiting');
            setStatusText('Another match is still in progress.');
            setSubtleStatusText('The next bracket slot will open automatically when both winners arrive.');
            setRetryMessage(null);
            scheduleRefresh(refreshStatus);
            return;
          }

          if (launchInFlightRef.current) {
            return;
          }

          launchInFlightRef.current = true;
          clearPollTimeout();
          clearReadyTimeouts();
          setPhase('ready');
          setStatusText('Next round ready');
          setSubtleStatusText('Opponent found.');
          setRetryMessage(null);

          const launchAttemptSequence = launchSequenceRef.current + 1;
          launchSequenceRef.current = launchAttemptSequence;

          const continueReadyCue = (delayMs: number, callback: () => void) => {
            const timer = setTimeout(() => {
              if (
                !isMountedRef.current ||
                stoppedRef.current ||
                flowTokenRef.current !== flowToken ||
                launchSequenceRef.current !== launchAttemptSequence
              ) {
                return;
              }

              callback();
            }, delayMs);

            readyTimeoutsRef.current.push(timer);
          };

          continueReadyCue(READY_CUE_OPPONENT_FOUND_MS, () => {
            setStatusText('Opponent found');
            setSubtleStatusText('Joining the next board.');
          });

          continueReadyCue(READY_CUE_JOINING_MS, () => {
            setPhase('launching');
            setStatusText('Joining next match...');
            setSubtleStatusText('Carrying your tournament session into the next round.');

            void launchTournamentMatch(runId)
              .then((result) => {
                if (
                  !isMountedRef.current ||
                  stoppedRef.current ||
                  flowTokenRef.current !== flowToken ||
                  launchSequenceRef.current !== launchAttemptSequence
                ) {
                  return;
                }

                if (!result.matchId || result.matchId === finishedMatchId) {
                  throw new Error(result.statusMessage ?? 'The next match is not ready yet.');
                }

                stoppedRef.current = true;
                clearPollTimeout();
                clearReadyTimeouts();

                finalizeMatchLaunch(
                  {
                    runId,
                    tournamentId,
                    gameMode,
                    name: snapshot.tournament.name ?? tournamentName,
                  },
                  result,
                  {
                    navigationMode: 'replace',
                    returnTarget: 'detail',
                  },
                );
              })
              .catch((error) => {
                if (
                  !isMountedRef.current ||
                  stoppedRef.current ||
                  flowTokenRef.current !== flowToken ||
                  launchSequenceRef.current !== launchAttemptSequence
                ) {
                  return;
                }

                const failure = isSoftLaunchFailure(error);
                launchInFlightRef.current = false;
                retryBackoffMsRef.current = Math.min(
                  retryBackoffMsRef.current * 2,
                  TOURNAMENT_LAUNCH_RETRY_BACKOFF_MAX_MS,
                );
                clearReadyTimeouts();
                setPhase(failure.soft ? 'retrying' : 'waiting');
                setStatusText('Rechecking for the next round...');
                setSubtleStatusText('The launch was not ready yet, so tournament polling has resumed.');
                setRetryMessage(failure.message);
                scheduleRefresh(refreshStatus, retryBackoffMsRef.current);
              });
          });
        })
        .catch((error) => {
          if (
            !isMountedRef.current ||
            stoppedRef.current ||
            flowTokenRef.current !== flowToken ||
            refreshSequenceRef.current !== sequence
          ) {
            return;
          }

          const message = error instanceof Error ? error.message : 'Unable to refresh tournament status.';
          setPhase('retrying');
          setStatusText('Reconnecting to tournament status...');
          setSubtleStatusText('Keeping the current board visible while the refresh retries.');
          setRetryMessage(message);
          scheduleRefresh(refreshStatus, retryBackoffMsRef.current);
        });
    };

    setPhase('waiting');
    setStatusText(
      didPlayerWin ? 'Recording your victory in the bracket...' : 'Recording the final tournament result...',
    );
    setSubtleStatusText(
      didPlayerWin
        ? 'Waiting for the tournament bracket to refresh.'
        : 'Waiting for the tournament bracket to confirm your placement.',
    );
    setRetryMessage(null);
    setFinalPlacement(null);
    setIsChampion(false);

    refreshStatus();

    return () => {
      if (flowTokenRef.current === flowToken) {
        clearPollTimeout();
        clearReadyTimeouts();
        launchInFlightRef.current = false;
      }
    };
  }, [
    didPlayerWin,
    enabled,
    finalizeMatchLaunch,
    finishedMatchId,
    gameMode,
    initialRound,
    playerUserId,
    runId,
    tournamentId,
    tournamentName,
  ]);

  return {
    isActive: enabled && Boolean(runId && tournamentId && playerUserId && finishedMatchId),
    phase,
    tournament,
    standings,
    currentStanding,
    derivedRound,
    statusText,
    subtleStatusText,
    retryMessage,
    finalPlacement,
    isChampion,
  };
};
