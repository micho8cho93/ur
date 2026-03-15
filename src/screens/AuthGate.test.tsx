import { render } from '@testing-library/react-native';
import React from 'react';

const mockUseAuth = jest.fn();

jest.mock('@/src/auth/useAuth', () => ({
  useAuth: (...args: unknown[]) => mockUseAuth(...args),
}));

jest.mock('./LoginScreen', () => {
  const { Text } = require('react-native');
  return () => <Text>LOGIN_SCREEN</Text>;
});

jest.mock('./AuthenticatedHome', () => {
  const { Text } = require('react-native');
  return () => <Text>AUTH_HOME</Text>;
});

import AuthGate from './AuthGate';

describe('AuthGate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows a loading state while the session is hydrating', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: true,
    });

    const view = render(<AuthGate />);

    expect(view.getByText('Restoring your session...')).toBeTruthy();
  });

  it('shows the login screen when no user exists', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
    });

    const view = render(<AuthGate />);

    expect(view.getByText('LOGIN_SCREEN')).toBeTruthy();
  });

  it('shows the authenticated home when a user exists', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-1' },
      isLoading: false,
    });

    const view = render(<AuthGate />);

    expect(view.getByText('AUTH_HOME')).toBeTruthy();
  });
});
