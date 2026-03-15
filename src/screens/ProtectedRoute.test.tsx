import { render } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';

const mockUseAuth = jest.fn();

jest.mock('@/src/auth/useAuth', () => ({
  useAuth: (...args: unknown[]) => mockUseAuth(...args),
}));

jest.mock('expo-router', () => ({
  Redirect: ({ href }: { href: string }) => {
    const { Text } = require('react-native');
    return <Text>{`REDIRECT:${href}`}</Text>;
  },
}));

import ProtectedRoute from './ProtectedRoute';

describe('ProtectedRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows a loading state while auth is pending', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: true,
    });

    const view = render(
      <ProtectedRoute>
        <Text>Protected Content</Text>
      </ProtectedRoute>
    );

    expect(view.getByText('Checking your session...')).toBeTruthy();
  });

  it('redirects logged-out users back to the root route', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
    });

    const view = render(
      <ProtectedRoute>
        <Text>Protected Content</Text>
      </ProtectedRoute>
    );

    expect(view.getByText('REDIRECT:/')).toBeTruthy();
  });

  it('renders children for authenticated users', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-1' },
      isLoading: false,
    });

    const view = render(
      <ProtectedRoute>
        <Text>Protected Content</Text>
      </ProtectedRoute>
    );

    expect(view.getByText('Protected Content')).toBeTruthy();
  });
});
