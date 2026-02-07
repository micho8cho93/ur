import { hasNakamaConfig } from '@/config/nakama';
import { findMatch } from '@/services/matchmaking';
import { useGameStore } from '@/store/useGameStore';
import { useRouter } from 'expo-router';
import { useState } from 'react';

export const useMatchmaking = () => {
    const [status, setStatus] = useState<'idle' | 'connecting' | 'searching' | 'matched' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const initGame = useGameStore(state => state.initGame);
    const setMatchId = useGameStore(state => state.setMatchId);
    const setNakamaSession = useGameStore(state => state.setNakamaSession);
    const setUserId = useGameStore(state => state.setUserId);
    const setSocketState = useGameStore(state => state.setSocketState);
    const router = useRouter();

    const startMatch = async () => {
        setErrorMessage(null);
        setStatus('connecting');
        setSocketState('connecting');
        try {
            if (!hasNakamaConfig()) {
                const localMatchId = `local-${Date.now()}`;
                setMatchId(localMatchId);
                initGame(localMatchId);
                setSocketState('connected');
                setStatus('matched');
                router.push(`/match/${localMatchId}?offline=1`);
                return;
            }

            const result = await findMatch({
                onSearching: () => setStatus('searching')
            });
            setNakamaSession(result.session);
            setUserId(result.userId);
            setMatchId(result.matchId);
            initGame(result.matchId);
            setSocketState('connected');
            setStatus('matched');
            router.push(`/match/${result.matchId}`);
        } catch (e) {
            const message = e instanceof Error ? e.message : 'Unable to find a match.';
            setErrorMessage(message);
            setStatus('error');
            setSocketState('error');
        }
    };

    return { startMatch, status, errorMessage };
};
