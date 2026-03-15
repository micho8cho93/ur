import { render } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';
import { ProtectedRoute } from './ProtectedRoute';

const mockUseAuth = jest.fn();

jest.mock('@/src/auth/useAuth', () => ({
  useAuth: (...args: unknown[]) => mockUseAuth(...args),
}));

jest.mock('expo-router', () => ({
  Redirect: (() => {
    const React = jest.requireActual('react');
    const { Text } = jest.requireActual('react-native');
    const MockRedirect = ({ href }: { href: string }) => <Text>{`REDIRECT:${href}`}</Text>;

    MockRedirect.displayName = 'MockRedirect';

    return MockRedirect;
  })(),
}));

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
