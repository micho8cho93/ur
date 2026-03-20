import { create } from 'zustand';
import { BotDifficulty, DEFAULT_BOT_DIFFICULTY } from '@/logic/bot/types';
import { DEFAULT_MATCH_CONFIG, type MatchConfig } from '@/logic/matchConfigs';
import { GameState, MoveAction, PlayerColor } from '@/logic/types';
import { ProgressionAwardResponse } from '@/shared/progression';
import { createInitialState, getValidMoves, applyMove, rollDice } from '@/logic/engine';
import { MatchPresenceEvent, Session } from '@heroiclabs/nakama-js';

type OnlineMode = 'offline' | 'nakama';

type RollCommandSender = (() => void | Promise<void>) | null;
type MoveCommandSender = ((move: MoveAction) => void | Promise<void>) | null;

interface GameStore {
  gameState: GameState;
  playerId: string;
  playerColor: PlayerColor | null;
  botDifficulty: BotDifficulty;
  onlineMode: OnlineMode;
  serverRevision: number;
  nakamaSession: Session | null;
  userId: string | null;
  matchId: string | null;
  matchToken: string | null;
  validMoves: MoveAction[];
  matchPresences: string[];
  lastProgressionAward: ProgressionAwardResponse | null;
  socketState: 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';
  rollCommandSender: RollCommandSender;
  moveCommandSender: MoveCommandSender;

  initGame: (matchId: string, options?: { botDifficulty?: BotDifficulty; matchConfig?: MatchConfig }) => void;
  setMatchId: (matchId: string) => void;
  setBotDifficulty: (difficulty: BotDifficulty) => void;
  setNakamaSession: (session: Session | null) => void;
  setUserId: (userId: string | null) => void;
  setMatchToken: (matchToken: string | null) => void;
  setOnlineMode: (mode: OnlineMode) => void;
  setPlayerColor: (color: PlayerColor | null) => void;
  setServerRevision: (revision: number) => void;
  setGameStateFromServer: (state: GameState) => void;
  applyServerSnapshot: (state: GameState, revision: number, matchId?: string) => void;
  setMatchPresences: (presences: string[]) => void;
  updateMatchPresences: (event: MatchPresenceEvent) => void;
  setLastProgressionAward: (award: ProgressionAwardResponse | null) => void;
  setSocketState: (status: 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error') => void;
  setRollCommandSender: (sender: RollCommandSender) => void;
  setMoveCommandSender: (sender: MoveCommandSender) => void;
  roll: () => void;
  makeMove: (move: MoveAction) => void;
  reset: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: createInitialState(),
  playerId: 'light',
  playerColor: null,
  botDifficulty: DEFAULT_BOT_DIFFICULTY,
  onlineMode: 'offline',
  serverRevision: 0,
  nakamaSession: null,
  userId: null,
  matchId: null,
  matchToken: null,
  validMoves: [],
  matchPresences: [],
  lastProgressionAward: null,
  socketState: 'idle',
  rollCommandSender: null,
  moveCommandSender: null,

  initGame: (matchId, options) => {
    const matchConfig = options?.matchConfig ?? DEFAULT_MATCH_CONFIG;

    set({
      matchId,
      gameState: createInitialState(matchConfig),
      validMoves: [],
      matchPresences: [],
      lastProgressionAward: null,
      socketState: 'idle',
      serverRevision: 0,
      playerColor: null,
      botDifficulty: options?.botDifficulty ?? DEFAULT_BOT_DIFFICULTY,
      rollCommandSender: null,
      moveCommandSender: null,
    });
  },

  setMatchId: (matchId) => {
    set({ matchId });
  },

  setBotDifficulty: (botDifficulty) => {
    set({ botDifficulty });
  },

  setNakamaSession: (session) => {
    set({ nakamaSession: session });
  },

  setUserId: (userId) => {
    set({ userId });
  },

  setMatchToken: (matchToken) => {
    set({ matchToken });
  },

  setOnlineMode: (mode) => {
    set({ onlineMode: mode });
  },

  setPlayerColor: (color) => {
    set({ playerColor: color });
  },

  setServerRevision: (revision) => {
    set({ serverRevision: revision });
  },

  setGameStateFromServer: (state) => {
    const validMoves = state.rollValue !== null && state.phase === 'moving'
      ? getValidMoves(state, state.rollValue)
      : [];
    set({ gameState: state, validMoves });
  },

  applyServerSnapshot: (state, revision, matchId) => {
    set((current) => {
      if (revision < current.serverRevision) {
        return {};
      }

      const validMoves = state.rollValue !== null && state.phase === 'moving'
        ? getValidMoves(state, state.rollValue)
        : [];

      return {
        gameState: state,
        validMoves,
        serverRevision: revision,
        ...(matchId ? { matchId } : {}),
      };
    });
  },

  setMatchPresences: (matchPresences) => {
    set({ matchPresences: Array.from(new Set(matchPresences)) });
  },

  updateMatchPresences: (event) => {
    set((current) => {
      const presences = new Set(current.matchPresences);
      event.joins?.forEach((presence) => presences.add(presence.user_id));
      event.leaves?.forEach((presence) => presences.delete(presence.user_id));
      return { matchPresences: Array.from(presences) };
    });
  },

  setLastProgressionAward: (award) => {
    set({ lastProgressionAward: award });
  },

  setSocketState: (status) => {
    set({ socketState: status });
  },

  setRollCommandSender: (sender) => {
    set({ rollCommandSender: sender });
  },

  setMoveCommandSender: (sender) => {
    set({ moveCommandSender: sender });
  },

  reset: () => {
    set({
      matchId: null,
      matchToken: null,
      gameState: createInitialState(),
      validMoves: [],
      matchPresences: [],
      lastProgressionAward: null,
      socketState: 'idle',
      rollCommandSender: null,
      moveCommandSender: null,
      playerColor: null,
      botDifficulty: DEFAULT_BOT_DIFFICULTY,
      onlineMode: 'offline',
      serverRevision: 0,
      nakamaSession: null,
      userId: null,
    });
  },

  roll: () => {
    const { gameState, onlineMode, rollCommandSender, playerColor } = get();
    if (gameState.phase !== 'rolling') return;

    if (onlineMode === 'nakama') {
      if (!playerColor || gameState.currentTurn !== playerColor) {
        return;
      }
      if (rollCommandSender) {
        void rollCommandSender();
      }
      return;
    }

    const rollValue = rollDice();
    const nextState: GameState = {
      ...gameState,
      rollValue,
      phase: 'moving'
    };

    const validMoves = getValidMoves(nextState, rollValue);

    if (validMoves.length === 0) {
      setTimeout(() => {
        const skippedState: GameState = {
          ...nextState,
          currentTurn: nextState.currentTurn === 'light' ? 'dark' : 'light',
          phase: 'rolling',
          rollValue: null,
          history: [...nextState.history, `${gameState.currentTurn} rolled ${rollValue} but had no moves.`],
        };

        set({ gameState: skippedState, validMoves: [] });
      }, 1000);

      set({ gameState: nextState, validMoves: [] });
      return;
    }

    set({ gameState: nextState, validMoves });
  },

  makeMove: (move) => {
    const { gameState, onlineMode, moveCommandSender, playerColor } = get();
    if (gameState.phase !== 'moving') return;

    if (onlineMode === 'nakama') {
      if (!playerColor || gameState.currentTurn !== playerColor) {
        return;
      }
      if (moveCommandSender) {
        void moveCommandSender(move);
      }
      return;
    }

    const newState = applyMove(gameState, move);
    set({ gameState: newState, validMoves: [] });
  }
}));
