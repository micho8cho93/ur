import { hasNakamaConfig, isNakamaEnabled } from '@/config/nakama';
import { BotDifficulty, DEFAULT_BOT_DIFFICULTY } from '@/logic/bot/types';
import { DEFAULT_MATCH_CONFIG, MatchModeId, getMatchConfig, type MatchConfig } from '@/logic/matchConfigs';
import { cancelMatchmaking, createPrivateMatch, findMatch } from '@/services/matchmaking';
import { getSitePlayerCount } from '@/services/presence';
import { useGameStore } from '@/store/useGameStore';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

export type LobbyMode = 'bot' | 'online';

export const useMatchmaking = (mode: LobbyMode = 'bot') => {
    const [status, setStatus] = useState<'idle' | 'connecting' | 'searching' | 'matched' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [onlineCount, setOnlineCount] = useState<number | null>(null);
    const [activeAction, setActiveAction] = useState<'find_opponent' | 'create_private' | null>(null);
    const [pendingPrivateMode, setPendingPrivateMode] = useState<MatchModeId | null>(null);
    const initGame = useGameStore(state => state.initGame);
    const setNakamaSession = useGameStore(state => state.setNakamaSession);
    const setUserId = useGameStore(state => state.setUserId);
    const setMatchToken = useGameStore(state => state.setMatchToken);
    const setSocketState = useGameStore(state => state.setSocketState);
    const setOnlineMode = useGameStore(state => state.setOnlineMode);
    const setPlayerColor = useGameStore(state => state.setPlayerColor);
    const router = useRouter();
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Poll for online player count when in online mode
    useEffect(() => {
        if (mode !== 'online' || !isNakamaEnabled() || !hasNakamaConfig()) return;

        let cancelled = false;

        const fetchOnlineCount = async () => {
            try {
                const count = await getSitePlayerCount();
                if (!cancelled) setOnlineCount(count);
            } catch {
                // Silently fail — count is cosmetic
                if (!cancelled) setOnlineCount(null);
            }
        };

        void fetchOnlineCount();
        pollingRef.current = setInterval(fetchOnlineCount, 5000);

        return () => {
            cancelled = true;
            if (pollingRef.current) {
                clearInterval(pollingRef.current);
                pollingRef.current = null;
            }
        };
    }, [mode]);

    useEffect(() => {
        return () => {
            void cancelMatchmaking();
        };
    }, []);

    const startBotGame = useCallback((
        difficulty: BotDifficulty = DEFAULT_BOT_DIFFICULTY,
        matchConfig: MatchConfig = DEFAULT_MATCH_CONFIG,
    ) => {
        setOnlineMode('offline');
        const localMatchId = `local-${Date.now()}`;
        setMatchToken(null);
        initGame(localMatchId, { botDifficulty: difficulty, matchConfig });
        setSocketState('connected');
        setStatus('matched');
        router.push(`/match/${localMatchId}?offline=1&botDifficulty=${difficulty}&modeId=${matchConfig.modeId}`);
    }, [initGame, router, setMatchToken, setOnlineMode, setSocketState]);

    const startOnlineMatch = useCallback(async () => {
        setErrorMessage(null);
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
                onSearching: () => setStatus('searching')
            });
            setNakamaSession(result.session);
            setUserId(result.userId);
            setMatchToken(result.matchToken);
            initGame(result.matchId);
            setPlayerColor(result.playerColor);
            setSocketState('connected');
            setStatus('matched');
            setActiveAction(null);
            router.push(`/match/${result.matchId}`);
        } catch (e) {
            await cancelMatchmaking();
            const message = e instanceof Error ? e.message : 'No opponents found. Try again later.';
            setErrorMessage(message);
            setStatus('error');
            setSocketState('error');
            setActiveAction(null);
        }
    }, [initGame, router, setMatchToken, setNakamaSession, setOnlineMode, setPlayerColor, setSocketState, setUserId]);

    const startPrivateMatch = useCallback(async (modeId: MatchModeId = 'standard') => {
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
            initGame(result.matchId, { matchConfig: getMatchConfig(result.modeId) });
            setStatus('matched');
            setActiveAction(null);
            setPendingPrivateMode(null);
            router.push(`/match/${result.matchId}?modeId=${result.modeId}&privateMatch=1&privateHost=1`);
        } catch (e) {
            const message = e instanceof Error ? e.message : 'Unable to create a private game right now.';
            setErrorMessage(message);
            setStatus('error');
            setSocketState('error');
            setActiveAction(null);
            setPendingPrivateMode(null);
        }
    }, [initGame, router, setMatchToken, setNakamaSession, setOnlineMode, setPlayerColor, setSocketState, setUserId]);

    const startMatch = useCallback(async (difficulty: BotDifficulty = DEFAULT_BOT_DIFFICULTY) => {
        if (mode === 'bot') {
            startBotGame(difficulty);
        } else {
            await startOnlineMatch();
        }
    }, [mode, startBotGame, startOnlineMatch]);

    return {
        startMatch,
        startBotGame,
        startPrivateMatch,
        status,
        errorMessage,
        onlineCount,
        mode,
        activeAction,
        pendingPrivateMode,
    };
};
