import { create } from 'zustand';
import { GameState, MoveAction, PlayerColor } from '@/logic/types';
import { createInitialState, getValidMoves, applyMove, rollDice } from '@/logic/engine';
import { MatchPresenceEvent, Session } from '@heroiclabs/nakama-js';

interface GameStore {
    gameState: GameState;
    playerId: string; // 'light'
    nakamaSession: Session | null;
    userId: string | null;
    matchId: string | null;
    validMoves: MoveAction[];
    matchPresences: string[];
    socketState: 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';
    matchMoveSender: ((move: MoveAction) => void) | null;

    // Actions
    initGame: (matchId: string) => void;
    setMatchId: (matchId: string) => void;
    setNakamaSession: (session: Session | null) => void;
    setUserId: (userId: string | null) => void;
    setGameStateFromServer: (state: GameState) => void;
    updateMatchPresences: (event: MatchPresenceEvent) => void;
    setSocketState: (status: 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error') => void;
    setMatchMoveSender: (sender: ((move: MoveAction) => void) | null) => void;
    roll: () => void;
    makeMove: (move: MoveAction) => void;
    reset: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
    gameState: createInitialState(),
    playerId: 'light',
    nakamaSession: null,
    userId: null,
    matchId: null,
    validMoves: [],
    matchPresences: [],
    socketState: 'idle',
    matchMoveSender: null,

    initGame: (matchId) => {
        set({
            matchId,
            gameState: createInitialState(),
            validMoves: [],
            matchPresences: [],
            socketState: 'idle'
        });
    },

    setMatchId: (matchId) => {
        set({ matchId });
    },

    setNakamaSession: (session) => {
        set({ nakamaSession: session });
    },

    setUserId: (userId) => {
        set({ userId });
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

    setSocketState: (status) => {
        set({ socketState: status });
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
            socketState: 'idle',
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
