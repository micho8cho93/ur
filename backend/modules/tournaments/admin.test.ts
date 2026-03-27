import {
  rpcAdminCreateTournamentRun,
  rpcAdminGetTournamentRun,
  RUNS_COLLECTION,
  RUNS_INDEX_KEY,
} from "./admin";
import { ADMIN_COLLECTION, ADMIN_ROLE_KEY } from "./auth";

type StoredObject = {
  collection: string;
  key: string;
  userId?: string;
  value: unknown;
  version: string;
};

type StorageReadRequest = {
  collection: string;
  key: string;
  userId?: string;
};

type StorageWriteRequest = {
  collection: string;
  key: string;
  userId?: string;
  value: unknown;
  version?: string;
};

const buildStorageKey = (collection: string, key: string, userId = ""): string =>
  `${collection}:${key}:${userId}`;

const createLogger = () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
});

const createNakama = () => {
  const storage = new Map<string, StoredObject>();
  let versionCounter = 1;

  const storageRead = jest.fn((requests: StorageReadRequest[]) =>
    requests
      .map((request) => storage.get(buildStorageKey(request.collection, request.key, request.userId ?? "")))
      .filter((entry): entry is StoredObject => Boolean(entry)),
  );

  const storageWrite = jest.fn((writes: StorageWriteRequest[]) => {
    writes.forEach((write) => {
      if ("version" in write && write.version === "") {
        throw new TypeError("expects 'version' value to be a non-empty string");
      }

      const storageKey = buildStorageKey(write.collection, write.key, write.userId ?? "");
      const existing = storage.get(storageKey);

      if (typeof write.version === "string" && write.version.length > 0 && write.version !== "*") {
        if (!existing || existing.version !== write.version) {
          throw new Error(`Storage version mismatch for ${storageKey}`);
        }
      }

      storage.set(storageKey, {
        collection: write.collection,
        key: write.key,
        userId: write.userId,
        value: write.value,
        version: `v${versionCounter++}`,
      });
    });
  });

  return {
    storage,
    storageRead,
    storageWrite,
    tournamentsGetId: jest.fn(() => []),
  };
};

const seedAdminRole = (nk: ReturnType<typeof createNakama>, userId: string, role = "operator") => {
  nk.storage.set(buildStorageKey(ADMIN_COLLECTION, ADMIN_ROLE_KEY, userId), {
    collection: ADMIN_COLLECTION,
    key: ADMIN_ROLE_KEY,
    userId,
    value: { role },
    version: "admin-role-v1",
  });
};

describe("admin tournament run creation", () => {
  it("creates a run without sending empty-string storage versions", () => {
    const nk = createNakama();
    const logger = createLogger();
    seedAdminRole(nk, "admin-1");

    const response = JSON.parse(
      rpcAdminCreateTournamentRun(
        {
          userId: "admin-1",
          username: "Operator",
        },
        logger,
        nk,
        JSON.stringify({
          runId: "spring-crown-2026",
          title: "Spring Crown 2026",
          description: "Season opener",
          metadata: {
            gameMode: "Classic ladder",
            region: "Global",
            buyIn: "Free",
          },
          startTime: 1_774_572_800,
          endTime: 1_774_580_000,
          duration: 7_200,
          maxSize: 32,
          maxNumScore: 7,
          joinRequired: true,
          enableRanks: true,
        }),
      ),
    ) as {
      run: {
        runId: string;
        title: string;
      };
    };

    expect(response.run).toEqual(
      expect.objectContaining({
        runId: "spring-crown-2026",
        title: "Spring Crown 2026",
      }),
    );

    const writes = nk.storageWrite.mock.calls.flatMap(([batch]) => batch as StorageWriteRequest[]);
    const runWrite = writes.find((write) => write.collection === RUNS_COLLECTION && write.key === "spring-crown-2026");
    const indexWrite = writes.find((write) => write.collection === RUNS_COLLECTION && write.key === RUNS_INDEX_KEY);

    expect(runWrite).toBeDefined();
    expect(runWrite).not.toHaveProperty("version");
    expect(indexWrite).toBeDefined();
    expect(indexWrite).not.toHaveProperty("version");

    expect(nk.storage.get(buildStorageKey(RUNS_COLLECTION, "spring-crown-2026"))?.value).toEqual(
      expect.objectContaining({
        runId: "spring-crown-2026",
        tournamentId: "spring-crown-2026",
        title: "Spring Crown 2026",
      }),
    );

    expect(nk.storage.get(buildStorageKey(RUNS_COLLECTION, RUNS_INDEX_KEY))?.value).toEqual(
      expect.objectContaining({
        runIds: ["spring-crown-2026"],
      }),
    );
  });

  it("returns a null run instead of throwing when the requested run does not exist", () => {
    const nk = createNakama();
    const logger = createLogger();
    seedAdminRole(nk, "admin-1", "viewer");

    const response = JSON.parse(
      rpcAdminGetTournamentRun(
        {
          userId: "admin-1",
          username: "Viewer",
        },
        logger,
        nk,
        JSON.stringify({
          runId: "test-tournament",
        }),
      ),
    ) as {
      ok: boolean;
      run: null;
      nakamaTournament: null;
    };

    expect(response).toEqual({
      ok: true,
      run: null,
      nakamaTournament: null,
    });
  });
});
