import { create } from 'zustand';
import { GameState, MoveAction, PlayerColor } from '@/logic/types';
import { createInitialState, getValidMoves, applyMove, rollDice } from '@/logic/engine';
import { MatchPresenceEvent } from '@heroiclabs/nakama-js';

interface GameStore {
    gameState: GameState;
    playerId: string; // 'light'
    matchId: string | null;
    validMoves: MoveAction[];
    matchPresences: string[];
    connectionStatus: 'connected' | 'disconnected';
    matchMoveSender: ((move: MoveAction) => void) | null;

    // Actions
    initGame: (matchId: string) => void;
    setMatchId: (matchId: string) => void;
    setGameStateFromServer: (state: GameState) => void;
    updateMatchPresences: (event: MatchPresenceEvent) => void;
    setConnectionStatus: (status: 'connected' | 'disconnected') => void;
    setMatchMoveSender: (sender: ((move: MoveAction) => void) | null) => void;
    roll: () => void;
    makeMove: (move: MoveAction) => void;
    reset: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
    gameState: createInitialState(),
    playerId: 'light',
    matchId: null,
    validMoves: [],
    matchPresences: [],
    connectionStatus: 'disconnected',
    matchMoveSender: null,

    initGame: (matchId) => {
        set({
            matchId,
            gameState: createInitialState(),
            validMoves: [],
            matchPresences: [],
            connectionStatus: 'disconnected'
        });
    },

    setMatchId: (matchId) => {
        set({ matchId });
    },

    setGameStateFromServer: (state) => {
        const validMoves = state.rollValue !== null && state.phase === 'moving'
            ? getValidMoves(state, state.rollValue)
            : [];
        set({ gameState: state, validMoves });
    },

    updateMatchPresences: (event) => {
        set((current) => {
            const presences = new Set(current.matchPresences);
            event.joins?.forEach((presence) => presences.add(presence.user_id));
            event.leaves?.forEach((presence) => presences.delete(presence.user_id));
            return { matchPresences: Array.from(presences) };
        });
    },

    setConnectionStatus: (status) => {
        set({ connectionStatus: status });
    },

    setMatchMoveSender: (sender) => {
        set({ matchMoveSender: sender });
    },

    reset: () => {
        set({
            matchId: null,
            gameState: createInitialState(),
            validMoves: [],
            matchPresences: [],
            connectionStatus: 'disconnected',
            matchMoveSender: null
        });
    },

    roll: () => {
        const { gameState } = get();
        if (gameState.phase !== 'rolling') return;

        const rollValue = rollDice();
        // Force type casting or ensure types match. 
        // Types: rollValue: number. gameState.rollValue: number | null.
        // phase: 'moving'.
        const nextState: GameState = {
            ...gameState,
            rollValue,
            phase: 'moving'
        };

        const validMoves = getValidMoves(nextState, rollValue);

        if (validMoves.length === 0) {
            setTimeout(() => {
                const skippedState: GameState = { ...nextState };
                skippedState.currentTurn = skippedState.currentTurn === 'light' ? 'dark' : 'light';
                skippedState.phase = 'rolling';
                skippedState.rollValue = null;
                skippedState.history.push(`${gameState.currentTurn} rolled ${rollValue} but had no moves.`);

                set({ gameState: skippedState, validMoves: [] });

                // Bot trigger handled by hook or here? 
                // If we rely on hook, we just switch state.
            }, 1000);

            set({ gameState: nextState, validMoves: [] });
            return;
        }

        set({ gameState: nextState, validMoves });
    },

    makeMove: (move) => {
        const { gameState } = get();
        if (gameState.phase !== 'moving') return;

        const sender = get().matchMoveSender;
        if (sender) {
            sender(move);
        }

        const newState = applyMove(gameState, move);
        set({ gameState: newState, validMoves: [] });
    }
}));
