import { render } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';

const mockUseAuth = jest.fn();
const mockPush = jest.fn();

jest.mock('@/src/auth/useAuth', () => ({
  useAuth: (...args: unknown[]) => mockUseAuth(...args),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock('@/components/HowToPlayModal', () => ({
  HowToPlayModal: () => null,
}));

jest.mock('@/components/ui/Button', () => ({
  Button: ({ title, onPress }: { title: string; onPress?: () => void }) => {
    const { Text, TouchableOpacity } = require('react-native');
    return (
      <TouchableOpacity onPress={onPress}>
        <Text>{title}</Text>
      </TouchableOpacity>
    );
  },
}));

import AuthenticatedHome from './AuthenticatedHome';

describe('AuthenticatedHome', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not render a logout button for guest users', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: 'guest_1',
        username: 'Guest',
        email: null,
        avatarUrl: null,
        provider: 'guest',
        createdAt: '2026-03-15T12:00:00.000Z',
      },
      logout: jest.fn(),
    });

    const view = render(<AuthenticatedHome />);

    expect(view.queryByText('Logout')).toBeNull();
  });

  it('renders a logout button for authenticated providers', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: 'google_1',
        username: 'Michel',
        email: 'michel@example.com',
        avatarUrl: null,
        provider: 'google',
        createdAt: '2026-03-15T12:00:00.000Z',
      },
      logout: jest.fn(),
    });

    const view = render(<AuthenticatedHome />);

    expect(view.getByText('Logout')).toBeTruthy();
  });
});
