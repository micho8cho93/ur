import * as Crypto from 'expo-crypto';

import { createGuestUser } from './guestAuth';

jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(),
}));

const mockedCrypto = Crypto as jest.Mocked<typeof Crypto>;

describe('createGuestUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a guest identity with the expected shape', () => {
    mockedCrypto.randomUUID.mockReturnValue('abc123');

    const guestUser = createGuestUser();

    expect(guestUser).toMatchObject({
      id: 'guest_abc123',
      username: 'Guest',
      email: null,
      avatarUrl: null,
      provider: 'guest',
    });
    expect(Date.parse(guestUser.createdAt)).not.toBeNaN();
  });
});
