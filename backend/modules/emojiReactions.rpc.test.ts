import { MatchOpCode } from '../../shared/urMatchProtocol';
import './index';

type RuntimeGlobals = typeof globalThis & {
  matchInit: (
    ctx: Record<string, unknown>,
    logger: { info: jest.Mock; warn: jest.Mock; debug: jest.Mock; error: jest.Mock },
    nk: { storageRead: jest.Mock; storageWrite: jest.Mock },
    params: Record<string, unknown>
  ) => { state: any; tickRate: number; label: string };
  matchJoinAttempt: (
    ctx: Record<string, unknown>,
    logger: { info: jest.Mock; warn: jest.Mock; debug: jest.Mock; error: jest.Mock },
    nk: { storageRead: jest.Mock; storageWrite: jest.Mock },
    dispatcher: { broadcastMessage: jest.Mock },
    tick: number,
    state: any,
    presence: Record<string, unknown>
  ) => { state: any; accept: boolean; rejectMessage?: string };
  matchJoin: (
    ctx: Record<string, unknown>,
    logger: { info: jest.Mock; warn: jest.Mock; debug: jest.Mock; error: jest.Mock },
    nk: { storageRead: jest.Mock; storageWrite: jest.Mock },
    dispatcher: { broadcastMessage: jest.Mock },
    tick: number,
    state: any,
    presences: Record<string, unknown>[]
  ) => { state: any };
  matchLoop: (
    ctx: Record<string, unknown>,
    logger: { info: jest.Mock; warn: jest.Mock; debug: jest.Mock; error: jest.Mock },
    nk: { storageRead: jest.Mock; storageWrite: jest.Mock },
    dispatcher: { broadcastMessage: jest.Mock },
    tick: number,
    state: any,
    messages: Record<string, unknown>[]
  ) => { state: any };
};

const createLogger = () => ({
  info: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  error: jest.fn(),
});

const createNakama = () => ({
  storageRead: jest.fn(() => []),
  storageWrite: jest.fn(),
});

const createDispatcher = () => ({
  broadcastMessage: jest.fn(),
});

const createPresence = (userId: string, sessionId: string) => ({
  userId,
  sessionId,
  node: 'node-1',
});

const joinPresence = ({
  runtime,
  ctx,
  logger,
  nk,
  dispatcher,
  state,
  presence,
}: {
  runtime: RuntimeGlobals;
  ctx: Record<string, unknown>;
  logger: ReturnType<typeof createLogger>;
  nk: ReturnType<typeof createNakama>;
  dispatcher: ReturnType<typeof createDispatcher>;
  state: any;
  presence: ReturnType<typeof createPresence>;
}) => {
  const attempted = runtime.matchJoinAttempt(ctx, logger, nk, dispatcher, 0, state, presence);
  expect(attempted.accept).toBe(true);
  return runtime.matchJoin(ctx, logger, nk, dispatcher, 0, attempted.state, [presence]).state;
};

const decodeLastPayloadForOpCode = (
  dispatcher: ReturnType<typeof createDispatcher>,
  opCode: number,
) => {
  const call = [...dispatcher.broadcastMessage.mock.calls]
    .reverse()
    .find(([candidateOpCode]) => candidateOpCode === opCode);
  expect(call).toBeDefined();
  return JSON.parse(call?.[1] as string);
};

describe('authoritative emoji reactions', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('broadcasts valid emoji reactions and tracks the sender remaining count', () => {
    const runtime = globalThis as RuntimeGlobals;
    const nowSpy = jest.spyOn(Date, 'now');
    const ctx = { matchId: 'match-1' };
    const logger = createLogger();
    const nk = createNakama();
    const dispatcher = createDispatcher();
    const initialized = runtime.matchInit(ctx, logger, nk, {
      playerIds: ['light-user', 'dark-user'],
      modeId: 'standard',
      rankedMatch: true,
    });
    const lightPresence = createPresence('light-user', 'light-session');
    const darkPresence = createPresence('dark-user', 'dark-session');

    let state = joinPresence({ runtime, ctx, logger, nk, dispatcher, state: initialized.state, presence: lightPresence });
    state = joinPresence({ runtime, ctx, logger, nk, dispatcher, state, presence: darkPresence });
    dispatcher.broadcastMessage.mockClear();

    nowSpy.mockReturnValue(1_234);
    state = runtime.matchLoop(ctx, logger, nk, dispatcher, 1, state, [
      {
        sender: lightPresence,
        opCode: MatchOpCode.EMOJI_REACTION,
        data: JSON.stringify({ type: 'emoji_reaction', emoji: 'fire' }),
      },
    ]).state;

    expect(state.reactionCounts['light-user']).toBe(1);
    expect(decodeLastPayloadForOpCode(dispatcher, MatchOpCode.REACTION_BROADCAST)).toEqual({
      type: 'reaction_broadcast',
      emoji: 'fire',
      senderUserId: 'light-user',
      senderColor: 'light',
      remainingForSender: 4,
      createdAtMs: 1_234,
    });
    expect(
      dispatcher.broadcastMessage.mock.calls.find(([opCode]) => opCode === MatchOpCode.REACTION_BROADCAST)?.[2],
    ).toHaveLength(2);
  });

  it('enforces the five-reaction limit server-side', () => {
    const runtime = globalThis as RuntimeGlobals;
    const nowSpy = jest.spyOn(Date, 'now');
    const ctx = { matchId: 'match-1' };
    const logger = createLogger();
    const nk = createNakama();
    const dispatcher = createDispatcher();
    const initialized = runtime.matchInit(ctx, logger, nk, {
      playerIds: ['light-user', 'dark-user'],
      modeId: 'standard',
      rankedMatch: true,
    });
    const lightPresence = createPresence('light-user', 'light-session');
    const darkPresence = createPresence('dark-user', 'dark-session');

    let state = joinPresence({ runtime, ctx, logger, nk, dispatcher, state: initialized.state, presence: lightPresence });
    state = joinPresence({ runtime, ctx, logger, nk, dispatcher, state, presence: darkPresence });
    dispatcher.broadcastMessage.mockClear();

    for (let index = 0; index < 5; index += 1) {
      nowSpy.mockReturnValue(2_000 + index);
      state = runtime.matchLoop(ctx, logger, nk, dispatcher, index + 1, state, [
        {
          sender: lightPresence,
          opCode: MatchOpCode.EMOJI_REACTION,
          data: JSON.stringify({ type: 'emoji_reaction', emoji: 'laughing' }),
        },
      ]).state;
    }

    expect(state.reactionCounts['light-user']).toBe(5);
    dispatcher.broadcastMessage.mockClear();

    state = runtime.matchLoop(ctx, logger, nk, dispatcher, 99, state, [
      {
        sender: lightPresence,
        opCode: MatchOpCode.EMOJI_REACTION,
        data: JSON.stringify({ type: 'emoji_reaction', emoji: 'laughing' }),
      },
    ]).state;

    expect(state.reactionCounts['light-user']).toBe(5);
    expect(dispatcher.broadcastMessage.mock.calls.some(([opCode]) => opCode === MatchOpCode.REACTION_BROADCAST)).toBe(false);
    expect(decodeLastPayloadForOpCode(dispatcher, MatchOpCode.SERVER_ERROR)).toEqual(
      expect.objectContaining({
        type: 'server_error',
        code: 'INVALID_PAYLOAD',
        message: 'Reaction limit reached for this match.',
      }),
    );
  });

  it('rejects emoji reactions in authoritative bot matches', () => {
    const runtime = globalThis as RuntimeGlobals;
    const ctx = { matchId: 'match-1' };
    const logger = createLogger();
    const nk = createNakama();
    const dispatcher = createDispatcher();
    const initialized = runtime.matchInit(ctx, logger, nk, {
      playerIds: ['light-user', 'bot-user'],
      modeId: 'standard',
      botMatch: true,
      botUserId: 'bot-user',
    });
    const lightPresence = createPresence('light-user', 'light-session');

    const state = joinPresence({ runtime, ctx, logger, nk, dispatcher, state: initialized.state, presence: lightPresence });
    dispatcher.broadcastMessage.mockClear();

    runtime.matchLoop(ctx, logger, nk, dispatcher, 1, state, [
      {
        sender: lightPresence,
        opCode: MatchOpCode.EMOJI_REACTION,
        data: JSON.stringify({ type: 'emoji_reaction', emoji: 'cool' }),
      },
    ]);

    expect(dispatcher.broadcastMessage.mock.calls.some(([opCode]) => opCode === MatchOpCode.REACTION_BROADCAST)).toBe(false);
    expect(decodeLastPayloadForOpCode(dispatcher, MatchOpCode.SERVER_ERROR)).toEqual(
      expect.objectContaining({
        type: 'server_error',
        code: 'INVALID_PAYLOAD',
        message: 'Emoji reactions are only available in online human matches.',
      }),
    );
  });
});
