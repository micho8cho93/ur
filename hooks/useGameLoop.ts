import { getBotMove } from '@/logic/bot/bot';
import { useGameStore } from '@/store/useGameStore';
import { useEffect } from 'react';

type UseGameLoopOptions = {
    enabled?: boolean;
    onBotSelectPiece?: (pieceId: string | null) => void;
};

export const useGameLoop = ({ enabled = true, onBotSelectPiece }: UseGameLoopOptions = {}) => {
    const gameState = useGameStore(state => state.gameState);
    const botDifficulty = useGameStore(state => state.botDifficulty);
    const roll = useGameStore(state => state.roll);
    const makeMove = useGameStore(state => state.makeMove);

    useEffect(() => {
        if (!enabled) {
            onBotSelectPiece?.(null);
            return;
        }

        const { currentTurn, phase, winner, rollValue } = gameState;

        if (winner) {
            onBotSelectPiece?.(null);
            return;
        }

        if (currentTurn === 'dark') {
            // Bot Turn
            if (phase === 'rolling') {
                // Bot needs to roll the dice
                const timer = setTimeout(() => {
                    roll();
                }, 800);
                return () => clearTimeout(timer);
            } else if (phase === 'moving') {
                // Bot needs to move
                // Delay for visual effect
                const move = getBotMove(gameState, rollValue!, botDifficulty);
                onBotSelectPiece?.(move?.pieceId ?? null);
                const timer = setTimeout(() => {
                    if (move) {
                        makeMove(move);
                    } else {
                        // If no moves, store handles auto-skip in roll()?
                        // `roll()` in store calculates moves. If 0, it auto-skips.
                        // So if we are in 'moving' phase, validMoves > 0.
                        // So move should exist.
                    }
                }, 1500);
                return () => {
                    clearTimeout(timer);
                    onBotSelectPiece?.(null);
                };
            }
        }
        onBotSelectPiece?.(null);
    }, [botDifficulty, enabled, gameState, makeMove, onBotSelectPiece, roll]);
};
