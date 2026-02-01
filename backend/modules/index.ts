/*
  Nakama runtime entrypoint.
  Implement server logic here (RPCs, authoritative matches, matchmaking hooks).

  Build output should be compiled to index.js for Nakama to load.
  See README in backend/ for local build instructions.
*/

type MatchState = {
  presences: Record<string, nkruntime.Presence>;
  playerIds: string[];
  tick: number;
};

const TICK_RATE = 10;
const MAX_PLAYERS = 8;

const RPC_AUTH_LINK_CUSTOM = "auth_link_custom";
const RPC_MATCHMAKER_ADD = "matchmaker_add";
const MATCH_HANDLER = "authoritative_match";

export function InitModule(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  initializer: nkruntime.Initializer
) {
  initializer.registerRpc(RPC_AUTH_LINK_CUSTOM, rpcAuthLinkCustom);
  initializer.registerRpc(RPC_MATCHMAKER_ADD, rpcMatchmakerAdd);
  initializer.registerMatch(MATCH_HANDLER, {
    matchInit,
    matchJoinAttempt,
    matchJoin,
    matchLeave,
    matchLoop,
    matchTerminate,
    matchSignal,
  });
  initializer.registerMatchmakerMatched(matchmakerMatched);

  logger.info("Nakama runtime module loaded.");
}

function rpcAuthLinkCustom(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  payload: string
): string {
  if (!ctx.userId) {
    throw new Error("Authentication required.");
  }

  const data = payload ? JSON.parse(payload) : {};
  const customId = data.customId as string | undefined;
  const username = data.username as string | undefined;

  if (!customId) {
    throw new Error("customId is required.");
  }

  nk.linkCustom(ctx.userId, customId, username);
  logger.info("Linked custom ID to user %s", ctx.userId);

  return JSON.stringify({
    userId: ctx.userId,
    customId,
  });
}

function rpcMatchmakerAdd(
  ctx: nkruntime.Context,
  _logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  payload: string
): string {
  if (!ctx.userId || !ctx.sessionId) {
    throw new Error("Authentication required.");
  }

  const data = payload ? JSON.parse(payload) : {};
  const minCount = Number.isInteger(data.minCount) ? data.minCount : 2;
  const maxCount = Number.isInteger(data.maxCount) ? data.maxCount : 2;
  const query = typeof data.query === "string" ? data.query : "*";
  const stringProperties = typeof data.stringProperties === "object" ? data.stringProperties : {};
  const numericProperties = typeof data.numericProperties === "object" ? data.numericProperties : {};

  const ticket = nk.matchmakerAdd(
    ctx.userId,
    ctx.sessionId,
    query,
    minCount,
    maxCount,
    stringProperties,
    numericProperties
  );

  return JSON.stringify({ ticket });
}

function matchmakerMatched(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  matched: nkruntime.MatchmakerMatched
): string {
  const playerIds = matched.users.map((user) => user.presence.userId);
  logger.info("Matchmaker matched %s players", playerIds.length);

  return nk.matchCreate(MATCH_HANDLER, { playerIds });
}

function matchInit(
  _ctx: nkruntime.Context,
  _logger: nkruntime.Logger,
  _nk: nkruntime.Nakama,
  params: Record<string, unknown>
): { state: MatchState; tickRate: number; label: string } {
  const state: MatchState = {
    presences: {},
    playerIds: Array.isArray(params.playerIds) ? (params.playerIds as string[]) : [],
    tick: 0,
  };

  return { state, tickRate: TICK_RATE, label: "authoritative_match" };
}

function matchJoinAttempt(
  _ctx: nkruntime.Context,
  _logger: nkruntime.Logger,
  _nk: nkruntime.Nakama,
  _dispatcher: nkruntime.MatchDispatcher,
  _tick: number,
  state: MatchState,
  presence: nkruntime.Presence
): { state: MatchState; accept: boolean; rejectMessage?: string } {
  const isFull = Object.keys(state.presences).length >= MAX_PLAYERS;
  if (isFull) {
    return { state, accept: false, rejectMessage: "Match is full." };
  }

  state.presences[presence.userId] = presence;
  if (!state.playerIds.includes(presence.userId)) {
    state.playerIds.push(presence.userId);
  }

  return { state, accept: true };
}

function matchJoin(
  _ctx: nkruntime.Context,
  _logger: nkruntime.Logger,
  _nk: nkruntime.Nakama,
  dispatcher: nkruntime.MatchDispatcher,
  _tick: number,
  state: MatchState,
  presences: nkruntime.Presence[]
): { state: MatchState } {
  presences.forEach((presence) => {
    state.presences[presence.userId] = presence;
    if (!state.playerIds.includes(presence.userId)) {
      state.playerIds.push(presence.userId);
    }
  });

  dispatcher.broadcastMessage(1, JSON.stringify({ event: "join", users: state.playerIds }));

  return { state };
}

function matchLeave(
  _ctx: nkruntime.Context,
  _logger: nkruntime.Logger,
  _nk: nkruntime.Nakama,
  dispatcher: nkruntime.MatchDispatcher,
  _tick: number,
  state: MatchState,
  presences: nkruntime.Presence[]
): { state: MatchState } {
  presences.forEach((presence) => {
    delete state.presences[presence.userId];
    state.playerIds = state.playerIds.filter((id) => id !== presence.userId);
  });

  dispatcher.broadcastMessage(2, JSON.stringify({ event: "leave", users: state.playerIds }));

  return { state };
}

function matchLoop(
  _ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  _nk: nkruntime.Nakama,
  dispatcher: nkruntime.MatchDispatcher,
  tick: number,
  state: MatchState,
  messages: nkruntime.MatchMessage[]
): { state: MatchState } {
  state.tick = tick;

  messages.forEach((message) => {
    logger.debug("Received opCode %d from %s", message.opCode, message.sender.userId);
    dispatcher.broadcastMessage(message.opCode, message.data, undefined, message.sender);
  });

  return { state };
}

function matchTerminate(
  _ctx: nkruntime.Context,
  _logger: nkruntime.Logger,
  _nk: nkruntime.Nakama,
  _dispatcher: nkruntime.MatchDispatcher,
  _tick: number,
  state: MatchState,
  _graceSeconds: number
): { state: MatchState } {
  return { state };
}

function matchSignal(
  _ctx: nkruntime.Context,
  _logger: nkruntime.Logger,
  _nk: nkruntime.Nakama,
  _dispatcher: nkruntime.MatchDispatcher,
  _tick: number,
  state: MatchState,
  _data: string
): { state: MatchState } | string {
  return { state };
}
