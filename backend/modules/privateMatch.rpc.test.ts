import './index';

type RuntimeGlobals = typeof globalThis & {
  rpcCreatePrivateMatch: (
    ctx: { userId?: string | null },
    logger: { info: jest.Mock; warn: jest.Mock; error?: jest.Mock },
    nk: {
      storageRead: jest.Mock;
      storageWrite: jest.Mock;
      matchCreate: jest.Mock;
    },
    payload: string
  ) => string;
};

describe('private match RPC payloads', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns both code and privateCode when creating a private match', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0);

    const runtime = globalThis as RuntimeGlobals;
    const logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };
    const nk = {
      storageRead: jest.fn(() => []),
      storageWrite: jest.fn(),
      matchCreate: jest.fn(() => 'match-1'),
    };

    const response = runtime.rpcCreatePrivateMatch(
      { userId: 'user-1' },
      logger,
      nk,
      JSON.stringify({ modeId: 'standard' })
    );

    expect(JSON.parse(response)).toEqual({
      matchId: 'match-1',
      modeId: 'standard',
      code: 'AAAAAAAA',
      privateCode: 'AAAAAAAA',
    });
  });
});
