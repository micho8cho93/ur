import { render } from '@testing-library/react-native';
import React from 'react';
import AuthenticatedHome from './AuthenticatedHome';

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

jest.mock('@expo/vector-icons/MaterialIcons', () => {
  const React = jest.requireActual('react');
  const { Text } = jest.requireActual('react-native');

  return function MockMaterialIcons(props: { name: string }) {
    return <Text>{props.name}</Text>;
  };
});

jest.mock('@/components/progression/ProgressionSummaryCard', () => ({
  ProgressionSummaryCard: () => null,
}));

jest.mock('@/components/elo/EloRatingSummaryCard', () => ({
  EloRatingSummaryCard: () => null,
}));

jest.mock('@/components/challenges/ChallengeSummaryCard', () => ({
  ChallengeSummaryCard: () => null,
}));

jest.mock('@/components/ui/MobileBackground', () => ({
  MobileBackground: () => null,
  useMobileBackground: () => false,
}));

jest.mock('@/components/ui/WideScreenBackground', () => ({
  MIN_WIDE_WEB_BACKGROUND_WIDTH: 768,
  WideScreenBackground: () => null,
}));

jest.mock('@/components/ui/Button', () => ({
  Button: ({ title, onPress }: { title: string; onPress?: () => void }) => {
    const React = jest.requireActual('react');
    const { Text, TouchableOpacity } = jest.requireActual('react-native');
    return (
      <TouchableOpacity onPress={onPress}>
        <Text>{title}</Text>
      </TouchableOpacity>
    );
  },
}));

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

  it('shows the new single play tutorial entry point', () => {
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

    expect(view.getByText('Play Tutorial')).toBeTruthy();
    expect(view.getByText('Game Modes')).toBeTruthy();
    expect(view.queryByText('Watch Extended Tutorial')).toBeNull();
    expect(view.queryByText('5 Step Tutorial')).toBeNull();
  });
});
