import { create } from 'zustand';
import { BotDifficulty, DEFAULT_BOT_DIFFICULTY } from '@/logic/bot/types';
import { DEFAULT_MATCH_CONFIG, type MatchConfig } from '@/logic/matchConfigs';
import { GameState, MoveAction, PlayerColor } from '@/logic/types';
import { UserChallengeProgressRpcResponse } from '@/shared/challenges';
import { EloRatingChangeNotificationPayload, EloRatingProfileRpcResponse } from '@/shared/elo';
import { ProgressionAwardResponse, ProgressionSnapshot } from '@/shared/progression';
import { MatchEndPayload, StateSnapshotPayload, StateSnapshotPlayers } from '@/shared/urMatchProtocol';
import { createInitialState, getValidMoves, applyMove, rollDice } from '@/logic/engine';
import { MatchPresenceEvent, Session } from '@heroiclabs/nakama-js';

type OnlineMode = 'offline' | 'nakama';

type RollCommandOptions = {
  autoTriggered?: boolean;
};

type RollCommandSender = ((options?: RollCommandOptions) => void | Promise<void>) | null;
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
  authoritativeServerTimeMs: number | null;
  authoritativeTurnDurationMs: number | null;
  authoritativeTurnStartedAtMs: number | null;
  authoritativeTurnDeadlineMs: number | null;
  authoritativeTurnRemainingMs: number | null;
  authoritativeActiveTimedPlayer: string | null;
  authoritativeActiveTimedPlayerColor: PlayerColor | null;
  authoritativeActiveTimedPhase: GameState['phase'] | null;
  authoritativePlayers: StateSnapshotPlayers | null;
  authoritativeHistoryCount: number;
  authoritativeAfkAccumulatedMs: Record<PlayerColor, number> | null;
  authoritativeAfkRemainingMs: number | null;
  authoritativeMatchEnd: MatchEndPayload | null;
  authoritativeSnapshotReceivedAtMs: number | null;
  lastProgressionAward: ProgressionAwardResponse | null;
  lastEloRatingChange: EloRatingChangeNotificationPayload | null;
  lastProgressionSnapshot: { matchId: string; progression: ProgressionSnapshot } | null;
  lastEloRatingProfileSnapshot: { matchId: string; profile: EloRatingProfileRpcResponse } | null;
  lastChallengeProgressSnapshot: { matchId: string; progress: UserChallengeProgressRpcResponse } | null;
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
  applyServerSnapshot: (snapshot: StateSnapshotPayload) => void;
  setMatchPresences: (presences: string[]) => void;
  updateMatchPresences: (event: MatchPresenceEvent) => void;
  setLastProgressionAward: (award: ProgressionAwardResponse | null) => void;
  setLastEloRatingChange: (change: EloRatingChangeNotificationPayload | null) => void;
  setLastProgressionSnapshot: (snapshot: { matchId: string; progression: ProgressionSnapshot } | null) => void;
  setLastEloRatingProfileSnapshot: (
    snapshot: { matchId: string; profile: EloRatingProfileRpcResponse } | null,
  ) => void;
  setLastChallengeProgressSnapshot: (
    snapshot: { matchId: string; progress: UserChallengeProgressRpcResponse } | null,
  ) => void;
  setSocketState: (status: 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error') => void;
  setRollCommandSender: (sender: RollCommandSender) => void;
  setMoveCommandSender: (sender: MoveCommandSender) => void;
  roll: (options?: RollCommandOptions) => void;
  makeMove: (move: MoveAction) => void;
  reset: () => void;
}

const EMPTY_AUTHORITATIVE_ONLINE_STATE = {
  authoritativeServerTimeMs: null,
  authoritativeTurnDurationMs: null,
  authoritativeTurnStartedAtMs: null,
  authoritativeTurnDeadlineMs: null,
  authoritativeTurnRemainingMs: null,
  authoritativeActiveTimedPlayer: null,
  authoritativeActiveTimedPlayerColor: null,
  authoritativeActiveTimedPhase: null,
  authoritativePlayers: null,
  authoritativeHistoryCount: 0,
  authoritativeAfkAccumulatedMs: null,
  authoritativeAfkRemainingMs: null,
  authoritativeMatchEnd: null,
  authoritativeSnapshotReceivedAtMs: null,
} as const;

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
  ...EMPTY_AUTHORITATIVE_ONLINE_STATE,
  lastProgressionAward: null,
  lastEloRatingChange: null,
  lastProgressionSnapshot: null,
  lastEloRatingProfileSnapshot: null,
  lastChallengeProgressSnapshot: null,
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
      ...EMPTY_AUTHORITATIVE_ONLINE_STATE,
      lastProgressionAward: null,
      lastEloRatingChange: null,
      lastProgressionSnapshot: null,
      lastEloRatingProfileSnapshot: null,
      lastChallengeProgressSnapshot: null,
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

  applyServerSnapshot: (snapshot) => {
    set((current) => {
      if (snapshot.revision < current.serverRevision) {
        return {};
      }

      const validMoves = snapshot.gameState.rollValue !== null && snapshot.gameState.phase === 'moving'
        ? getValidMoves(snapshot.gameState, snapshot.gameState.rollValue)
        : [];
      const receivedAtMs = Date.now();

      return {
        gameState: snapshot.gameState,
        validMoves,
        serverRevision: snapshot.revision,
        matchId: snapshot.matchId,
        authoritativeServerTimeMs: snapshot.serverTimeMs ?? null,
        authoritativeTurnDurationMs: snapshot.turnDurationMs ?? null,
        authoritativeTurnStartedAtMs: snapshot.turnStartedAtMs ?? null,
        authoritativeTurnDeadlineMs: snapshot.turnDeadlineMs ?? null,
        authoritativeTurnRemainingMs: snapshot.turnRemainingMs ?? null,
        authoritativeActiveTimedPlayer: snapshot.activeTimedPlayer ?? null,
        authoritativeActiveTimedPlayerColor: snapshot.activeTimedPlayerColor ?? null,
        authoritativeActiveTimedPhase: snapshot.activeTimedPhase ?? null,
        authoritativePlayers: snapshot.players,
        authoritativeHistoryCount: snapshot.historyCount ?? snapshot.gameState.history.length,
        authoritativeAfkAccumulatedMs: snapshot.afkAccumulatedMs
          ? { light: snapshot.afkAccumulatedMs.light, dark: snapshot.afkAccumulatedMs.dark }
          : null,
        authoritativeAfkRemainingMs: snapshot.afkRemainingMs ?? null,
        authoritativeMatchEnd: snapshot.matchEnd ?? null,
        authoritativeSnapshotReceivedAtMs: receivedAtMs,
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

  setLastEloRatingChange: (change) => {
    set({ lastEloRatingChange: change });
  },

  setLastProgressionSnapshot: (snapshot) => {
    set({ lastProgressionSnapshot: snapshot });
  },

  setLastEloRatingProfileSnapshot: (snapshot) => {
    set({ lastEloRatingProfileSnapshot: snapshot });
  },

  setLastChallengeProgressSnapshot: (snapshot) => {
    set({ lastChallengeProgressSnapshot: snapshot });
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
      ...EMPTY_AUTHORITATIVE_ONLINE_STATE,
      lastProgressionAward: null,
      lastEloRatingChange: null,
      lastProgressionSnapshot: null,
      lastEloRatingProfileSnapshot: null,
      lastChallengeProgressSnapshot: null,
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

  roll: (options) => {
    const { gameState, onlineMode, rollCommandSender, playerColor } = get();
    if (gameState.phase !== 'rolling') return;

    if (onlineMode === 'nakama') {
      if (!playerColor || gameState.currentTurn !== playerColor) {
        return;
      }
      if (rollCommandSender) {
        void rollCommandSender(options);
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
