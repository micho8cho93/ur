import { asRecord } from "../progression";
import { readNumberField, readStringField } from "./definitions";

export type TournamentBracketParticipantState =
  | "lobby"
  | "in_match"
  | "waiting_next_round"
  | "eliminated"
  | "runner_up"
  | "champion";

export type TournamentRunRegistration = {
  userId: string;
  displayName: string;
  joinedAt: string;
  seed: number;
};

export type TournamentBracketParticipant = {
  userId: string;
  displayName: string;
  joinedAt: string;
  seed: number;
  state: TournamentBracketParticipantState;
  currentRound: number | null;
  currentEntryId: string | null;
  activeMatchId: string | null;
  finalPlacement: number | null;
  lastResult: "win" | "loss" | null;
  updatedAt: string;
};

export type TournamentBracketEntryStatus = "pending" | "ready" | "in_match" | "completed";

export type TournamentBracketEntry = {
  entryId: string;
  round: number;
  slot: number;
  sourceEntryIds: string[];
  playerAUserId: string | null;
  playerBUserId: string | null;
  matchId: string | null;
  status: TournamentBracketEntryStatus;
  winnerUserId: string | null;
  loserUserId: string | null;
  createdAt: string;
  updatedAt: string;
  readyAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
};

export type TournamentBracketState = {
  format: "single_elimination";
  size: number;
  totalRounds: number;
  startedAt: string;
  lockedAt: string;
  finalizedAt: string | null;
  winnerUserId: string | null;
  runnerUpUserId: string | null;
  participants: TournamentBracketParticipant[];
  entries: TournamentBracketEntry[];
};

const readBooleanField = (value: unknown, keys: string[]): boolean | null => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  for (const key of keys) {
    const field = record[key];
    if (typeof field === "boolean") {
      return field;
    }
  }

  return null;
};

const normalizeParticipantState = (value: unknown): TournamentBracketParticipantState => {
  if (
    value === "lobby" ||
    value === "in_match" ||
    value === "waiting_next_round" ||
    value === "eliminated" ||
    value === "runner_up" ||
    value === "champion"
  ) {
    return value;
  }

  return "lobby";
};

const normalizeEntryStatus = (value: unknown): TournamentBracketEntryStatus => {
  if (value === "pending" || value === "ready" || value === "in_match" || value === "completed") {
    return value;
  }

  return "pending";
};

const sortRegistrations = (registrations: TournamentRunRegistration[]): TournamentRunRegistration[] =>
  registrations.slice().sort((left, right) => {
    if (left.seed !== right.seed) {
      return left.seed - right.seed;
    }

    const joinedCompare = left.joinedAt.localeCompare(right.joinedAt);
    if (joinedCompare !== 0) {
      return joinedCompare;
    }

    return left.userId.localeCompare(right.userId);
  });

export const normalizeTournamentRunRegistration = (value: unknown): TournamentRunRegistration | null => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const userId = readStringField(record, ["userId", "user_id"]);
  const displayName = readStringField(record, ["displayName", "display_name"]);
  const joinedAt = readStringField(record, ["joinedAt", "joined_at"]);
  const seed = readNumberField(record, ["seed"]);

  if (!userId || !displayName || !joinedAt || typeof seed !== "number" || !Number.isFinite(seed)) {
    return null;
  }

  return {
    userId,
    displayName,
    joinedAt,
    seed: Math.max(1, Math.floor(seed)),
  };
};

export const normalizeTournamentBracketParticipant = (value: unknown): TournamentBracketParticipant | null => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const userId = readStringField(record, ["userId", "user_id"]);
  const displayName = readStringField(record, ["displayName", "display_name"]);
  const joinedAt = readStringField(record, ["joinedAt", "joined_at"]);
  const updatedAt = readStringField(record, ["updatedAt", "updated_at"]);
  const seed = readNumberField(record, ["seed"]);

  if (!userId || !displayName || !joinedAt || !updatedAt || typeof seed !== "number" || !Number.isFinite(seed)) {
    return null;
  }

  return {
    userId,
    displayName,
    joinedAt,
    seed: Math.max(1, Math.floor(seed)),
    state: normalizeParticipantState(readStringField(record, ["state"])),
    currentRound: (() => {
      const round = readNumberField(record, ["currentRound", "current_round"]);
      return typeof round === "number" && Number.isFinite(round) ? Math.max(1, Math.floor(round)) : null;
    })(),
    currentEntryId: readStringField(record, ["currentEntryId", "current_entry_id"]),
    activeMatchId: readStringField(record, ["activeMatchId", "active_match_id"]),
    finalPlacement: (() => {
      const placement = readNumberField(record, ["finalPlacement", "final_placement"]);
      return typeof placement === "number" && Number.isFinite(placement) ? Math.max(1, Math.floor(placement)) : null;
    })(),
    lastResult: (() => {
      const result = readStringField(record, ["lastResult", "last_result"]);
      return result === "win" || result === "loss" ? result : null;
    })(),
    updatedAt,
  };
};

export const normalizeTournamentBracketEntry = (value: unknown): TournamentBracketEntry | null => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const entryId = readStringField(record, ["entryId", "entry_id"]);
  const round = readNumberField(record, ["round"]);
  const slot = readNumberField(record, ["slot"]);
  const createdAt = readStringField(record, ["createdAt", "created_at"]);
  const updatedAt = readStringField(record, ["updatedAt", "updated_at"]);
  const sourceEntryIds = Array.isArray(record.sourceEntryIds)
    ? record.sourceEntryIds.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
    : [];

  if (
    !entryId ||
    typeof round !== "number" ||
    !Number.isFinite(round) ||
    typeof slot !== "number" ||
    !Number.isFinite(slot) ||
    !createdAt ||
    !updatedAt
  ) {
    return null;
  }

  return {
    entryId,
    round: Math.max(1, Math.floor(round)),
    slot: Math.max(1, Math.floor(slot)),
    sourceEntryIds,
    playerAUserId: readStringField(record, ["playerAUserId", "player_a_user_id"]),
    playerBUserId: readStringField(record, ["playerBUserId", "player_b_user_id"]),
    matchId: readStringField(record, ["matchId", "match_id"]),
    status: normalizeEntryStatus(readStringField(record, ["status"])),
    winnerUserId: readStringField(record, ["winnerUserId", "winner_user_id"]),
    loserUserId: readStringField(record, ["loserUserId", "loser_user_id"]),
    createdAt,
    updatedAt,
    readyAt: readStringField(record, ["readyAt", "ready_at"]),
    startedAt: readStringField(record, ["startedAt", "started_at"]),
    completedAt: readStringField(record, ["completedAt", "completed_at"]),
  };
};

export const normalizeTournamentBracketState = (value: unknown): TournamentBracketState | null => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const startedAt = readStringField(record, ["startedAt", "started_at"]);
  const lockedAt = readStringField(record, ["lockedAt", "locked_at"]);
  const size = readNumberField(record, ["size"]);
  const totalRounds = readNumberField(record, ["totalRounds", "total_rounds"]);

  if (
    readStringField(record, ["format"]) !== "single_elimination" ||
    !startedAt ||
    !lockedAt ||
    typeof size !== "number" ||
    !Number.isFinite(size) ||
    typeof totalRounds !== "number" ||
    !Number.isFinite(totalRounds)
  ) {
    return null;
  }

  const participants = Array.isArray(record.participants)
    ? record.participants
        .map((entry) => normalizeTournamentBracketParticipant(entry))
        .filter((entry): entry is TournamentBracketParticipant => Boolean(entry))
    : [];
  const entries = Array.isArray(record.entries)
    ? record.entries
        .map((entry) => normalizeTournamentBracketEntry(entry))
        .filter((entry): entry is TournamentBracketEntry => Boolean(entry))
    : [];

  return {
    format: "single_elimination",
    size: Math.max(2, Math.floor(size)),
    totalRounds: Math.max(1, Math.floor(totalRounds)),
    startedAt,
    lockedAt,
    finalizedAt: readStringField(record, ["finalizedAt", "finalized_at"]),
    winnerUserId: readStringField(record, ["winnerUserId", "winner_user_id"]),
    runnerUpUserId: readStringField(record, ["runnerUpUserId", "runner_up_user_id"]),
    participants,
    entries,
  };
};

export const isPowerOfTwo = (value: number): boolean => {
  if (!Number.isFinite(value)) {
    return false;
  }

  const normalized = Math.floor(value);
  return normalized >= 2 && (normalized & (normalized - 1)) === 0;
};

export const assertPowerOfTwoTournamentSize = (value: number): void => {
  if (!isPowerOfTwo(value)) {
    throw new Error("Single-elimination tournaments require a power-of-two maxSize.");
  }
};

export const getSingleEliminationRoundCount = (value: number): number => {
  assertPowerOfTwoTournamentSize(value);
  return Math.log2(Math.floor(value));
};

export const getTournamentBracketEntryId = (round: number, slot: number): string =>
  `round-${round}-match-${slot}`;

export const sortTournamentRegistrations = sortRegistrations;

export const upsertTournamentRegistration = (
  registrations: TournamentRunRegistration[],
  userId: string,
  displayName: string,
  joinedAt: string,
): { registrations: TournamentRunRegistration[]; registration: TournamentRunRegistration; added: boolean } => {
  const existing = sortRegistrations(registrations).find((entry) => entry.userId === userId) ?? null;

  if (existing) {
    const nextRegistration: TournamentRunRegistration = {
      ...existing,
      displayName,
    };

    return {
      registrations: sortRegistrations(
        registrations.map((entry) => (entry.userId === userId ? nextRegistration : entry)),
      ),
      registration: nextRegistration,
      added: false,
    };
  }

  const nextRegistration: TournamentRunRegistration = {
    userId,
    displayName,
    joinedAt,
    seed: registrations.length + 1,
  };

  return {
    registrations: sortRegistrations(registrations.concat(nextRegistration)),
    registration: nextRegistration,
    added: true,
  };
};

export const createSingleEliminationBracket = (
  registrations: TournamentRunRegistration[],
  startedAt: string,
): TournamentBracketState => {
  const seededRegistrations = sortRegistrations(registrations);
  assertPowerOfTwoTournamentSize(seededRegistrations.length);

  const size = seededRegistrations.length;
  const totalRounds = Math.log2(size);
  let previousRoundEntries: TournamentBracketEntry[] = [];
  const entries: TournamentBracketEntry[] = [];

  for (let round = 1; round <= totalRounds; round += 1) {
    const roundEntries: TournamentBracketEntry[] = [];
    const matchCount = size / (2 ** round);

    for (let slot = 1; slot <= matchCount; slot += 1) {
      const entryId = getTournamentBracketEntryId(round, slot);
      const sourceEntryIds =
        round === 1
          ? []
          : [
              previousRoundEntries[(slot - 1) * 2].entryId,
              previousRoundEntries[(slot - 1) * 2 + 1].entryId,
            ];
      const playerAUserId = round === 1 ? seededRegistrations[(slot - 1) * 2]?.userId ?? null : null;
      const playerBUserId = round === 1 ? seededRegistrations[(slot - 1) * 2 + 1]?.userId ?? null : null;
      const ready = round === 1 && Boolean(playerAUserId) && Boolean(playerBUserId);

      roundEntries.push({
        entryId,
        round,
        slot,
        sourceEntryIds,
        playerAUserId,
        playerBUserId,
        matchId: null,
        status: ready ? "ready" : "pending",
        winnerUserId: null,
        loserUserId: null,
        createdAt: startedAt,
        updatedAt: startedAt,
        readyAt: ready ? startedAt : null,
        startedAt: null,
        completedAt: null,
      });
    }

    entries.push(...roundEntries);
    previousRoundEntries = roundEntries;
  }

  const participants: TournamentBracketParticipant[] = seededRegistrations.map((registration, index) => ({
    userId: registration.userId,
    displayName: registration.displayName,
    joinedAt: registration.joinedAt,
    seed: registration.seed,
    state: "waiting_next_round",
    currentRound: 1,
    currentEntryId: getTournamentBracketEntryId(1, Math.floor(index / 2) + 1),
    activeMatchId: null,
    finalPlacement: null,
    lastResult: null,
    updatedAt: startedAt,
  }));

  return {
    format: "single_elimination",
    size,
    totalRounds,
    startedAt,
    lockedAt: startedAt,
    finalizedAt: null,
    winnerUserId: null,
    runnerUpUserId: null,
    participants,
    entries,
  };
};

const cloneBracket = (bracket: TournamentBracketState): TournamentBracketState => ({
  ...bracket,
  participants: bracket.participants.map((participant) => ({ ...participant })),
  entries: bracket.entries.map((entry) => ({
    ...entry,
    sourceEntryIds: entry.sourceEntryIds.slice(),
  })),
});

export const getTournamentBracketParticipant = (
  bracket: TournamentBracketState | null,
  userId: string,
): TournamentBracketParticipant | null =>
  bracket?.participants.find((participant) => participant.userId === userId) ?? null;

export const getTournamentBracketEntry = (
  bracket: TournamentBracketState | null,
  entryId: string,
): TournamentBracketEntry | null => bracket?.entries.find((entry) => entry.entryId === entryId) ?? null;

export const getTournamentBracketEntryByMatchId = (
  bracket: TournamentBracketState | null,
  matchId: string,
): TournamentBracketEntry | null => bracket?.entries.find((entry) => entry.matchId === matchId) ?? null;

export const getTournamentParticipantCanLaunch = (
  bracket: TournamentBracketState | null,
  userId: string,
): boolean => {
  if (!bracket) {
    return false;
  }

  const participant = getTournamentBracketParticipant(bracket, userId);
  if (!participant) {
    return false;
  }

  if (participant.state === "in_match" && participant.activeMatchId) {
    return true;
  }

  if (participant.state !== "waiting_next_round" || !participant.currentEntryId) {
    return false;
  }

  const entry = getTournamentBracketEntry(bracket, participant.currentEntryId);
  if (!entry) {
    return false;
  }

  return entry.status === "ready" || entry.status === "in_match";
};

export const getTournamentBracketCurrentRound = (
  bracket: TournamentBracketState | null,
): number | null => {
  if (!bracket) {
    return null;
  }

  const activeEntry = bracket.entries
    .filter((entry) => entry.status !== "completed")
    .sort((left, right) => {
      if (left.round !== right.round) {
        return left.round - right.round;
      }

      return left.slot - right.slot;
    })[0];

  return activeEntry?.round ?? null;
};

export const startTournamentBracketMatch = (
  bracket: TournamentBracketState,
  userId: string,
  matchId: string,
  startedAt: string,
): TournamentBracketState => {
  const nextBracket = cloneBracket(bracket);
  const participantIndex = nextBracket.participants.findIndex((participant) => participant.userId === userId);

  if (participantIndex < 0) {
    throw new Error("Tournament participant was not found.");
  }

  const participant = nextBracket.participants[participantIndex];
  if (!participant.currentEntryId) {
    throw new Error("Tournament participant does not have an active bracket entry.");
  }

  const entryIndex = nextBracket.entries.findIndex((entry) => entry.entryId === participant.currentEntryId);
  if (entryIndex < 0) {
    throw new Error(`Tournament bracket entry '${participant.currentEntryId}' was not found.`);
  }

  const entry = nextBracket.entries[entryIndex];
  if (
    entry.playerAUserId !== userId &&
    entry.playerBUserId !== userId
  ) {
    throw new Error("Tournament participant is not assigned to this bracket entry.");
  }

  if (!entry.playerAUserId || !entry.playerBUserId) {
    throw new Error("The next tournament match is not ready yet.");
  }

  entry.matchId = matchId;
  entry.status = "in_match";
  entry.startedAt = entry.startedAt ?? startedAt;
  entry.updatedAt = startedAt;

  nextBracket.participants.forEach((candidate) => {
    if (candidate.userId === entry.playerAUserId || candidate.userId === entry.playerBUserId) {
      candidate.state = "in_match";
      candidate.currentRound = entry.round;
      candidate.currentEntryId = entry.entryId;
      candidate.activeMatchId = matchId;
      candidate.updatedAt = startedAt;
    }
  });

  return nextBracket;
};

export const calculateTournamentPlacement = (
  bracketSize: number,
  round: number,
): number => Math.floor(bracketSize / (2 ** round)) + 1;

export const completeTournamentBracketMatch = (
  bracket: TournamentBracketState,
  params: {
    entryId?: string | null;
    matchId: string;
    winnerUserId: string;
    loserUserId: string;
    completedAt: string;
  },
): TournamentBracketState => {
  const nextBracket = cloneBracket(bracket);
  const entryIndex = nextBracket.entries.findIndex((entry) =>
    params.entryId ? entry.entryId === params.entryId : entry.matchId === params.matchId,
  );

  if (entryIndex < 0) {
    throw new Error("Tournament bracket entry was not found for the completed match.");
  }

  const entry = nextBracket.entries[entryIndex];
  if (
    entry.playerAUserId !== params.winnerUserId &&
    entry.playerBUserId !== params.winnerUserId
  ) {
    throw new Error("Winner is not assigned to the completed tournament bracket entry.");
  }

  if (
    entry.playerAUserId !== params.loserUserId &&
    entry.playerBUserId !== params.loserUserId
  ) {
    throw new Error("Loser is not assigned to the completed tournament bracket entry.");
  }

  entry.matchId = entry.matchId ?? params.matchId;
  entry.status = "completed";
  entry.winnerUserId = params.winnerUserId;
  entry.loserUserId = params.loserUserId;
  entry.completedAt = params.completedAt;
  entry.updatedAt = params.completedAt;
  entry.startedAt = entry.startedAt ?? params.completedAt;

  const winner = getTournamentBracketParticipant(nextBracket, params.winnerUserId);
  const loser = getTournamentBracketParticipant(nextBracket, params.loserUserId);

  if (!winner || !loser) {
    throw new Error("Tournament bracket participants were not found for the completed match.");
  }

  loser.state = entry.round === nextBracket.totalRounds ? "runner_up" : "eliminated";
  loser.currentRound = entry.round;
  loser.currentEntryId = entry.entryId;
  loser.activeMatchId = null;
  loser.finalPlacement = calculateTournamentPlacement(nextBracket.size, entry.round);
  loser.lastResult = "loss";
  loser.updatedAt = params.completedAt;

  if (entry.round === nextBracket.totalRounds) {
    winner.state = "champion";
    winner.currentRound = entry.round;
    winner.currentEntryId = entry.entryId;
    winner.activeMatchId = null;
    winner.finalPlacement = 1;
    winner.lastResult = "win";
    winner.updatedAt = params.completedAt;
    nextBracket.winnerUserId = winner.userId;
    nextBracket.runnerUpUserId = loser.userId;
    nextBracket.finalizedAt = params.completedAt;
    return nextBracket;
  }

  const nextEntry = nextBracket.entries.find((candidate) => candidate.sourceEntryIds.includes(entry.entryId));
  if (!nextEntry) {
    throw new Error("The next tournament bracket entry could not be resolved.");
  }

  if (nextEntry.sourceEntryIds[0] === entry.entryId) {
    nextEntry.playerAUserId = winner.userId;
  } else if (nextEntry.sourceEntryIds[1] === entry.entryId) {
    nextEntry.playerBUserId = winner.userId;
  }

  if (nextEntry.playerAUserId && nextEntry.playerBUserId) {
    nextEntry.status = nextEntry.status === "completed" ? "completed" : "ready";
    nextEntry.readyAt = nextEntry.readyAt ?? params.completedAt;
  }

  nextEntry.updatedAt = params.completedAt;

  winner.state = "waiting_next_round";
  winner.currentRound = nextEntry.round;
  winner.currentEntryId = nextEntry.entryId;
  winner.activeMatchId = null;
  winner.finalPlacement = null;
  winner.lastResult = "win";
  winner.updatedAt = params.completedAt;

  return nextBracket;
};

export const isTournamentBracketLocked = (bracket: TournamentBracketState | null): boolean =>
  Boolean(bracket?.lockedAt);

export const isTournamentBracketFinalized = (bracket: TournamentBracketState | null): boolean =>
  Boolean(bracket?.finalizedAt);

export const hasTournamentBracketStarted = (bracket: TournamentBracketState | null): boolean =>
  Boolean(bracket?.startedAt);
