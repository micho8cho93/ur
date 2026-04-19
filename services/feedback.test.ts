import { nakamaService } from './nakama'
import { listFeedback, submitFeedback } from './feedback'

jest.mock('./nakama', () => ({
  nakamaService: {
    loadSession: jest.fn(),
    getClient: jest.fn(),
  },
}))

const mockedNakamaService = nakamaService as jest.Mocked<typeof nakamaService>

describe('feedback service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedNakamaService.loadSession.mockResolvedValue({ token: 'session' } as never)
  })

  it('submits feedback through the submit_feedback RPC', async () => {
    const rpc = jest.fn().mockResolvedValue({
      payload: JSON.stringify({
        submission: {
          id: 'feedback-1',
          type: 'bug',
          message: 'Something broke',
          sourcePage: 'home',
          submitter: {
            userId: 'player-1',
            username: 'Player One',
            provider: 'google',
            nakamaUserId: 'nakama-1',
          },
          matchContext: null,
          reportedUser: null,
          createdAt: '2026-04-18T10:00:00.000Z',
        },
      }),
    })
    mockedNakamaService.getClient.mockReturnValue({ rpc } as never)

    await expect(
      submitFeedback({
        type: 'bug',
        message: 'Something broke',
        sourcePage: 'home',
        submitter: {
          userId: 'player-1',
          username: 'Player One',
          provider: 'google',
          nakamaUserId: 'nakama-1',
        },
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        id: 'feedback-1',
        type: 'bug',
        message: 'Something broke',
      }),
    )

    expect(rpc).toHaveBeenCalledWith({ token: 'session' }, 'submit_feedback', expect.any(Object))
  })

  it('lists feedback through the admin_list_feedback RPC', async () => {
    const rpc = jest.fn().mockResolvedValue({
      payload: {
        submissions: [
          {
            id: 'feedback-1',
            type: 'bug',
            message: 'Something broke',
            sourcePage: 'home',
            submitter: {
              userId: 'player-1',
              username: 'Player One',
              provider: 'google',
              nakamaUserId: 'nakama-1',
            },
            matchContext: null,
            reportedUser: null,
            createdAt: '2026-04-18T10:00:00.000Z',
          },
        ],
      },
    })
    mockedNakamaService.getClient.mockReturnValue({ rpc } as never)

    await expect(listFeedback(25)).resolves.toHaveLength(1)
    expect(rpc).toHaveBeenCalledWith({ token: 'session' }, 'admin_list_feedback', { limit: 25 })
  })

  it('requires an active Nakama session', async () => {
    mockedNakamaService.loadSession.mockResolvedValue(null)

    await expect(listFeedback()).rejects.toThrow(
      'No active Nakama session. Authenticate before requesting feedback data.',
    )
  })
})
