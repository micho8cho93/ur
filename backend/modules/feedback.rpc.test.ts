import { GLOBAL_STORAGE_USER_ID } from './progression';
import { rpcAdminListFeedback, rpcSubmitFeedback } from './feedback';

type StoredObject = {
  collection: string;
  key: string;
  userId?: string;
  value: unknown;
  version: string;
};

const createLogger = () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
});

const createNakama = (objects: StoredObject[] = []) => {
  const storage = new Map<string, StoredObject>(
    objects.map((object) => [`${object.collection}:${object.key}:${object.userId ?? ''}`, object]),
  );

  return {
    storage,
    storageRead: jest.fn((requests: Array<{ collection: string; key: string; userId?: string }>) =>
      requests
        .map((request) => storage.get(`${request.collection}:${request.key}:${request.userId ?? ''}`))
        .filter((entry): entry is StoredObject => Boolean(entry)),
    ),
    storageWrite: jest.fn((writes: Array<StoredObject>) => {
      writes.forEach((write) => {
        storage.set(`${write.collection}:${write.key}:${write.userId ?? ''}`, write);
      });
    }),
    storageList: jest.fn((userId: string, collection: string, _limit: number, cursor?: string) => {
      const entries = Array.from(storage.values()).filter(
        (entry) => entry.userId === userId && entry.collection === collection,
      );

      if (cursor === 'page-2') {
        return {
          objects: entries.slice(1, 2),
          cursor: null,
        };
      }

      return {
        objects: entries.slice(0, 1),
        cursor: entries.length > 1 ? 'page-2' : null,
      };
    }),
  };
};

describe('feedback RPCs', () => {
  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-04-18T10:00:00.000Z'));
    jest.spyOn(Math, 'random').mockReturnValue(0.123456789);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('stores feedback with submitter identity and server-owned storage metadata', () => {
    const logger = createLogger();
    const nk = createNakama();

    const response = JSON.parse(
      rpcSubmitFeedback(
        { userId: 'player-1', username: 'Player One' },
        logger,
        nk,
        JSON.stringify({
          type: 'bug',
          message: '  Something broke on the home screen.  ',
          sourcePage: 'home',
        }),
      ),
    ) as {
      submission: {
        id: string;
        message: string;
        createdAt: string;
        submitter: { userId: string; username: string; nakamaUserId: string | null };
      };
    };

    expect(response.submission.message).toBe('Something broke on the home screen.');
    expect(response.submission.submitter).toEqual({
      userId: 'player-1',
      username: 'Player One',
      provider: 'unknown',
      nakamaUserId: 'player-1',
    });

    const storedWrite = (nk.storageWrite as jest.Mock).mock.calls[0][0][0];
    const expectedPrefix = String(9_999_999_999_999 - Date.parse(response.submission.createdAt)).padStart(13, '0');

    expect(storedWrite).toEqual(
      expect.objectContaining({
        collection: 'user_feedback_submissions',
        key: expect.stringMatching(new RegExp(`^${expectedPrefix}-feedback-`)),
        userId: GLOBAL_STORAGE_USER_ID,
        permissionRead: 0,
        permissionWrite: 0,
        value: expect.objectContaining({
          id: response.submission.id,
          message: 'Something broke on the home screen.',
          sourcePage: 'home',
          submitter: {
            userId: 'player-1',
            username: 'Player One',
            provider: 'unknown',
            nakamaUserId: 'player-1',
          },
          createdAt: response.submission.createdAt,
        }),
      }),
    );
  });

  it('returns the newest feedback entries first across paginated storage results', () => {
    const logger = createLogger();
    const nk = createNakama([
      {
        collection: 'admins',
        key: 'role',
        userId: 'admin-1',
        version: 'v0',
        value: { role: 'admin' },
      },
      {
        collection: 'user_feedback_submissions',
        key: '9999999999999-old',
        userId: GLOBAL_STORAGE_USER_ID,
        version: 'v1',
        value: {
          submission_id: 'old',
          type: 'feature_request',
          message: 'Old suggestion',
          source_page: 'play_online',
          created_at: '2026-04-18T09:00:00.000Z',
          submitter: {
            user_id: 'player-2',
            username: 'Second Player',
            provider: 'guest',
            nakama_user_id: 'player-2',
          },
        },
      },
      {
        collection: 'user_feedback_submissions',
        key: '9999999999998-new',
        userId: GLOBAL_STORAGE_USER_ID,
        version: 'v2',
        value: {
          id: 'new',
          type: 'player_report',
          message: 'New report',
          sourcePage: 'match',
          createdAt: '2026-04-18T10:00:00.000Z',
          submitter: {
            userId: 'player-1',
            username: 'Player One',
            provider: 'google',
            nakamaUserId: 'player-1',
          },
          match_context: {
            match_id: 'match-9',
          },
          reported_user: {
            user_id: 'opponent-1',
            username: 'Opponent',
          },
        },
      },
    ]);

    const response = JSON.parse(
      rpcAdminListFeedback(
        { userId: 'admin-1' },
        logger,
        nk,
        JSON.stringify({ limit: 50 }),
      ),
    ) as {
      submissions: Array<{
        id: string;
        createdAt: string;
        sourcePage: string;
        matchContext: { matchId: string } | null;
        reportedUser: { userId: string; username: string } | null;
      }>;
    };

    expect(response.submissions.map((submission) => submission.id)).toEqual(['new', 'old']);
    expect(response.submissions[0]).toEqual(
      expect.objectContaining({
        createdAt: '2026-04-18T10:00:00.000Z',
        sourcePage: 'match',
        matchContext: { matchId: 'match-9' },
        reportedUser: { userId: 'opponent-1', username: 'Opponent' },
      }),
    );
  });
});
