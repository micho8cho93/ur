import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { ProgressionSummaryCard } from './ProgressionSummaryCard';
import { buildProgressionSnapshot } from '@/shared/progression';

const mockUseAuth = jest.fn();
const mockUseProgression = jest.fn();

jest.mock('@/src/auth/useAuth', () => ({
  useAuth: (...args: unknown[]) => mockUseAuth(...args),
}));

jest.mock('@/src/progression/useProgression', () => ({
  useProgression: (...args: unknown[]) => mockUseProgression(...args),
}));

describe('ProgressionSummaryCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: {
        id: 'google_1',
        username: 'Michel',
        email: 'michel@example.com',
        avatarUrl: null,
        provider: 'google',
        createdAt: '2026-03-15T12:00:00.000Z',
      },
    });
  });

  it('shows the titled progression card with live rank, XP, and status CTA', () => {
    const onOpenRank = jest.fn();

    mockUseProgression.mockReturnValue({
      progression: buildProgressionSnapshot(300),
      errorMessage: null,
      isLoading: false,
    });

    render(<ProgressionSummaryCard fontLoaded onOpenRank={onOpenRank} />);

    expect(screen.getByText('XP & Rank')).toBeTruthy();
    expect(screen.getByText('Apprentice Scribe')).toBeTruthy();
    expect(screen.getByLabelText('Current progression rank badge: Apprentice Scribe')).toBeTruthy();
    expect(screen.getByText('300 XP')).toBeTruthy();
    expect(screen.getByLabelText('XP progress 22 percent, rank Apprentice Scribe')).toBeTruthy();

    expect(screen.getByText('Status')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Open status details'));

    expect(onOpenRank).toHaveBeenCalled();
  });

  it('shows a loading state while progression data is still loading', () => {
    mockUseProgression.mockReturnValue({
      progression: null,
      errorMessage: null,
      isLoading: true,
    });

    render(<ProgressionSummaryCard layoutVariant="compact" fontLoaded />);

    expect(screen.getByText('XP & Rank')).toBeTruthy();
    expect(screen.getByText('Loading progression')).toBeTruthy();
    expect(screen.getByText('Status')).toBeTruthy();
  });

  it('shows the laborer rank badge for guest players in the summary card', () => {
    mockUseProgression.mockReturnValue({
      progression: buildProgressionSnapshot(300),
      errorMessage: null,
      isLoading: false,
    });

    mockUseAuth.mockReturnValue({
      user: {
        id: 'guest_1',
        username: 'Guest',
        email: null,
        avatarUrl: null,
        provider: 'guest',
        createdAt: '2026-03-15T12:00:00.000Z',
      },
    });

    render(<ProgressionSummaryCard fontLoaded />);

    expect(screen.getByText('Laborer')).toBeTruthy();
    expect(screen.getByLabelText('Current progression rank badge: Laborer')).toBeTruthy();
  });

  it('keeps long rank titles constrained within the card text block', () => {
    mockUseProgression.mockReturnValue({
      progression: buildProgressionSnapshot(28175),
      errorMessage: null,
      isLoading: false,
    });

    render(<ProgressionSummaryCard fontLoaded />);

    expect(screen.getByText('Emperor of Sumer & Akkad').props.numberOfLines).toBe(2);
  });
});
