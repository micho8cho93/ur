import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { ProgressionSummaryCard } from './ProgressionSummaryCard';
import { buildProgressionSnapshot } from '@/shared/progression';

const mockUseProgression = jest.fn();

jest.mock('@/src/progression/useProgression', () => ({
  useProgression: (...args: unknown[]) => mockUseProgression(...args),
}));

describe('ProgressionSummaryCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
