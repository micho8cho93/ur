import "./index";

describe("InitModule tournament RPC registration", () => {
  it("registers tournament admin RPCs through the runtime entrypoint, including export and live status", () => {
    const initModule = (globalThis as Record<string, unknown>).InitModule as
      | ((
          ctx: unknown,
          logger: { info: jest.Mock; warn: jest.Mock; error: jest.Mock },
          nk: Record<string, unknown>,
          initializer: {
            registerRpc: jest.Mock;
            registerMatch: jest.Mock;
            registerMatchmakerMatched: jest.Mock;
          },
        ) => void)
      | undefined;

    expect(typeof initModule).toBe("function");

    const initializer = {
      registerRpc: jest.fn(),
      registerMatch: jest.fn(),
      registerMatchmakerMatched: jest.fn(),
    };
    const logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };
    const nk = {
      leaderboardCreate: jest.fn(),
      storageRead: jest.fn(() => []),
      storageWrite: jest.fn(),
    };

    initModule?.({}, logger, nk, initializer);

    const registeredRpcNames = initializer.registerRpc.mock.calls.map(([name]) => name);

    expect(registeredRpcNames).toEqual(
      expect.arrayContaining([
        "rpc_admin_export_tournament",
        "rpc_admin_get_tournament_live_status",
        "rpc_admin_get_tournament_run",
        "rpc_admin_list_tournaments",
      ]),
    );
  });
});
