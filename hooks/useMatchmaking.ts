import { hasNakamaConfig, isNakamaEnabled } from '@/config/nakama';
import { BotDifficulty, DEFAULT_BOT_DIFFICULTY } from '@/logic/bot/types';
import { DEFAULT_MATCH_CONFIG, MatchModeId, getMatchConfig, type MatchConfig } from '@/logic/matchConfigs';
import {
  cancelMatchmaking,
  createPrivateMatch,
  findMatch,
  getPrivateMatchStatus,
  joinPrivateMatch,
  type PrivateMatchResult,
} from '@/services/matchmaking';
import { getSitePlayerCount } from '@/services/presence';
import { useGameStore } from '@/store/useGameStore';
import { useScreenTransition } from '@/src/transitions/ScreenTransitionContext';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

export type LobbyMode = 'bot' | 'online';

type MatchmakingStatus = 'idle' | 'connecting' | 'searching' | 'matched' | 'error';
type ActiveLobbyAction = 'find_opponent' | 'create_private' | 'join_private' | null;

type CreatedPrivateMatch = PrivateMatchResult & {
  hasGuestJoined: boolean;
};

const PRIVATE_STATUS_POLL_INTERVAL_MS = 3_000;
const ONLINE_COUNT_POLL_INTERVAL_MS = 5_000;
const MATCH_ENTRY_PRE_DELAY_MS = 980;
const MATCH_ENTRY_POST_DELAY_MS = 260;

export const useMatchmaking = (mode: LobbyMode = 'bot') => {
  const [status, setStatus] = useState<MatchmakingStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [onlineCount, setOnlineCount] = useState<number | null>(null);
  const [activeAction, setActiveAction] = useState<ActiveLobbyAction>(null);
  const [pendingPrivateMode, setPendingPrivateMode] = useState<MatchModeId | null>(null);
  const [createdPrivateMatch, setCreatedPrivateMatch] = useState<CreatedPrivateMatch | null>(null);
  const initGame = useGameStore((state) => state.initGame);
  const setNakamaSession = useGameStore((state) => state.setNakamaSession);
  const setUserId = useGameStore((state) => state.setUserId);
  const setMatchToken = useGameStore((state) => state.setMatchToken);
  const setSocketState = useGameStore((state) => state.setSocketState);
  const setOnlineMode = useGameStore((state) => state.setOnlineMode);
  const setPlayerColor = useGameStore((state) => state.setPlayerColor);
  const router = useRouter();
  const runScreenTransition = useScreenTransition();
  const onlineCountPollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const privateStatusPollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const runMatchEntryTransition = useCallback(
    async (
      request: {
        title: string;
        message: string;
        variant?: 'neutral' | 'success' | 'warning';
      },
      action: () => void | Promise<void>,
    ) => {
      const didStart = await runScreenTransition({
        ...request,
        preActionDelayMs: MATCH_ENTRY_PRE_DELAY_MS,
        postActionDelayMs: MATCH_ENTRY_POST_DELAY_MS,
        action,
      });

      if (!didStart) {
        await action();
      }
    },
    [runScreenTransition],
  );

  useEffect(() => {
    if (mode !== 'online' || !isNakamaEnabled() || !hasNakamaConfig()) {
      return;
    }

    let cancelled = false;

    const fetchOnlineCount = async () => {
      try {
        const count = await getSitePlayerCount();
        if (!cancelled) {
          setOnlineCount(count);
        }
      } catch {
        if (!cancelled) {
          setOnlineCount(null);
        }
      }
    };

    void fetchOnlineCount();
    onlineCountPollingRef.current = setInterval(fetchOnlineCount, ONLINE_COUNT_POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (onlineCountPollingRef.current) {
        clearInterval(onlineCountPollingRef.current);
        onlineCountPollingRef.current = null;
      }
    };
  }, [mode]);

  useEffect(() => {
    return () => {
      void cancelMatchmaking();
    };
  }, []);

  useEffect(() => {
    if (mode !== 'online' || !createdPrivateMatch) {
      if (privateStatusPollingRef.current) {
        clearInterval(privateStatusPollingRef.current);
        privateStatusPollingRef.current = null;
      }
      return;
    }

    let cancelled = false;

    const refreshStatus = async () => {
      try {
        const nextStatus = await getPrivateMatchStatus(createdPrivateMatch.code);
        if (cancelled) {
          return;
        }

        setCreatedPrivateMatch((current) => {
          if (!current || current.code !== nextStatus.code) {
            return current;
          }

          return current.hasGuestJoined === nextStatus.hasGuestJoined
            ? current
            : {
                ...current,
                hasGuestJoined: nextStatus.hasGuestJoined,
              };
        });

        if (nextStatus.hasGuestJoined && privateStatusPollingRef.current) {
          clearInterval(privateStatusPollingRef.current);
          privateStatusPollingRef.current = null;
        }
      } catch {
        // Keep the last known lobby status if polling fails.
      }
    };

    void refreshStatus();
    privateStatusPollingRef.current = setInterval(refreshStatus, PRIVATE_STATUS_POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (privateStatusPollingRef.current) {
        clearInterval(privateStatusPollingRef.current);
        privateStatusPollingRef.current = null;
      }
    };
  }, [createdPrivateMatch, mode]);

  const openPrivateMatch = useCallback(
    async (
      result: Pick<PrivateMatchResult, 'matchId' | 'modeId' | 'code'>,
      isHost: boolean,
    ) => {
      await runMatchEntryTransition(
        {
          title: isHost ? 'Opening Private Table' : 'Joining Private Table',
          message: isHost
            ? 'Laying out the private board and seating both players.'
            : 'Connecting your code and opening the private board.',
          variant: 'success',
        },
        () => {
          setMatchToken(null);
          setPlayerColor(null);
          initGame(result.matchId, { matchConfig: getMatchConfig(result.modeId) });
          setSocketState('idle');
          setStatus('matched');
          setActiveAction(null);
          router.push({
            pathname: '/match/[id]',
            params: {
              id: result.matchId,
              modeId: result.modeId,
              privateMatch: '1',
              privateCode: result.code,
              ...(isHost ? { privateHost: '1' } : {}),
            },
          });
        },
      );
    },
    [initGame, router, runMatchEntryTransition, setMatchToken, setPlayerColor, setSocketState]
  );

  const startOfflineMatch = useCallback(
    async (
      matchConfig: MatchConfig = DEFAULT_MATCH_CONFIG,
      difficulty: BotDifficulty = DEFAULT_BOT_DIFFICULTY,
    ) => {
      const localMatchId = `local-${Date.now()}`;
      const isOfflineBotMatch = matchConfig.opponentType === 'bot';

      await runMatchEntryTransition(
        {
          title: isOfflineBotMatch ? 'Preparing Board' : 'Preparing Local PvP',
          message: isOfflineBotMatch
            ? 'Setting the pieces and seating the local match.'
            : 'Setting the pieces and seating both local players.',
        },
        () => {
          setOnlineMode('offline');
          setMatchToken(null);
          initGame(localMatchId, {
            matchConfig,
            ...(isOfflineBotMatch ? { botDifficulty: difficulty } : {}),
          });
          setSocketState('connected');
          setStatus('matched');
          router.push(
            isOfflineBotMatch
              ? `/match/${localMatchId}?offline=1&botDifficulty=${difficulty}&modeId=${matchConfig.modeId}`
              : `/match/${localMatchId}?offline=1&modeId=${matchConfig.modeId}`,
          );
        },
      );
    },
    [initGame, router, runMatchEntryTransition, setMatchToken, setOnlineMode, setSocketState]
  );

  const startBotGame = useCallback(
    async (difficulty: BotDifficulty = DEFAULT_BOT_DIFFICULTY, matchConfig: MatchConfig = DEFAULT_MATCH_CONFIG) => {
      await startOfflineMatch(matchConfig, difficulty);
    },
    [startOfflineMatch]
  );

  const startOnlineMatch = useCallback(async () => {
    setErrorMessage(null);
    setCreatedPrivateMatch(null);
    setActiveAction('find_opponent');
    setPendingPrivateMode(null);
    setStatus('connecting');
    setSocketState('connecting');
    setPlayerColor(null);

    try {
      await cancelMatchmaking();

      if (!isNakamaEnabled() || !hasNakamaConfig()) {
        setErrorMessage('Online multiplayer is not configured. Please check your Nakama settings.');
        setStatus('error');
        setSocketState('error');
        setActiveAction(null);
        return;
      }

      setOnlineMode('nakama');
      const result = await findMatch({
        onSearching: () => setStatus('searching'),
      });
      await runMatchEntryTransition(
        {
          title: 'Match Found',
          message: 'Seating both players and preparing the board.',
          variant: 'success',
        },
        () => {
          setNakamaSession(result.session);
          setUserId(result.userId);
          setMatchToken(result.matchToken);
          initGame(result.matchId);
          setPlayerColor(result.playerColor);
          setSocketState('connected');
          setStatus('matched');
          setActiveAction(null);
          router.push(`/match/${result.matchId}`);
        },
      );
    } catch (error) {
      await cancelMatchmaking();
      const message = error instanceof Error ? error.message : 'No opponents found. Try again later.';
      setErrorMessage(message);
      setStatus('error');
      setSocketState('error');
      setActiveAction(null);
    }
  }, [
    initGame,
    router,
    setMatchToken,
    setNakamaSession,
    setOnlineMode,
    setPlayerColor,
    setSocketState,
    setUserId,
  ]);

  const startPrivateMatch = useCallback(
    async (modeId: MatchModeId = 'standard') => {
      setErrorMessage(null);
      setActiveAction('create_private');
      setPendingPrivateMode(modeId);
      setStatus('connecting');
      setSocketState('connecting');
      setPlayerColor(null);

      try {
        await cancelMatchmaking();

        if (!isNakamaEnabled() || !hasNakamaConfig()) {
          setErrorMessage('Online multiplayer is not configured. Please check your Nakama settings.');
          setStatus('error');
          setSocketState('error');
          setActiveAction(null);
          setPendingPrivateMode(null);
          return;
        }

        setOnlineMode('nakama');
        const result = await createPrivateMatch(modeId);
        setNakamaSession(result.session);
        setUserId(result.userId);
        setMatchToken(null);
        setSocketState('idle');
        setCreatedPrivateMatch({
          ...result,
          hasGuestJoined: false,
        });
        setStatus('idle');
        setActiveAction(null);
        setPendingPrivateMode(null);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to create a private game right now.';
        setErrorMessage(message);
        setStatus('error');
        setSocketState('error');
        setActiveAction(null);
        setPendingPrivateMode(null);
      }
    },
    [setMatchToken, setNakamaSession, setOnlineMode, setPlayerColor, setSocketState, setUserId]
  );

  const joinPrivateMatchByCode = useCallback(
    async (code: string) => {
      setErrorMessage(null);
      setActiveAction('join_private');
      setPendingPrivateMode(null);
      setStatus('connecting');
      setSocketState('connecting');
      setPlayerColor(null);

      try {
        await cancelMatchmaking();

        if (!isNakamaEnabled() || !hasNakamaConfig()) {
          setErrorMessage('Online multiplayer is not configured. Please check your Nakama settings.');
          setStatus('error');
          setSocketState('error');
          setActiveAction(null);
          return;
        }

        setOnlineMode('nakama');
        const result = await joinPrivateMatch(code);
        setNakamaSession(result.session);
        setUserId(result.userId);
        setMatchToken(null);
        setCreatedPrivateMatch(null);
        openPrivateMatch(result, false);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to join that private game right now.';
        setErrorMessage(message);
        setStatus('error');
        setSocketState('error');
        setActiveAction(null);
      }
    },
    [openPrivateMatch, setMatchToken, setNakamaSession, setOnlineMode, setPlayerColor, setSocketState, setUserId]
  );

  const clearCreatedPrivateMatch = useCallback(() => {
    setCreatedPrivateMatch(null);
    setPendingPrivateMode(null);
    setStatus('idle');
    setActiveAction(null);
    setErrorMessage(null);
  }, []);

  const startCreatedPrivateMatch = useCallback(() => {
    if (!createdPrivateMatch) {
      return;
    }

    void openPrivateMatch(createdPrivateMatch, true);
  }, [createdPrivateMatch, openPrivateMatch]);

  const startMatch = useCallback(
    async (difficulty: BotDifficulty = DEFAULT_BOT_DIFFICULTY) => {
      if (mode === 'bot') {
        await startOfflineMatch(DEFAULT_MATCH_CONFIG, difficulty);
      } else {
        await startOnlineMatch();
      }
    },
    [mode, startOfflineMatch, startOnlineMatch]
  );

  return {
    startMatch,
    startOfflineMatch,
    startBotGame,
    startPrivateMatch,
    startCreatedPrivateMatch,
    joinPrivateMatchByCode,
    clearCreatedPrivateMatch,
    status,
    errorMessage,
    onlineCount,
    mode,
    activeAction,
    pendingPrivateMode,
    createdPrivateMatch,
  };
};
