import { findMatch } from '@/services/matchmaking';
import { useGameStore } from '@/store/useGameStore';
import { useRouter } from 'expo-router';
import { useState } from 'react';

export const useMatchmaking = () => {
    const [isSearching, setIsSearching] = useState(false);
    const initGame = useGameStore(state => state.initGame);
    const router = useRouter();

    const startMatch = async () => {
        setIsSearching(true);
        try {
            const matchId = await findMatch();
            initGame(matchId);
            router.push(`/match/${matchId}`);
        } catch (e) {
            console.error(e);
        } finally {
            setIsSearching(false);
        }
    };

    return { startMatch, isSearching };
};
