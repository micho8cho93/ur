import { fireEvent, render, screen, waitFor } from '@testing-library/react-native'
import React from 'react'

import { FeedbackComposerModal } from './FeedbackComposerModal'

const mockUseAuth = jest.fn()
const mockSubmitFeedback = jest.fn()

jest.mock('@/src/auth/useAuth', () => ({
  useAuth: (...args: unknown[]) => mockUseAuth(...args),
}))

jest.mock('@/services/feedback', () => ({
  submitFeedback: (...args: unknown[]) => mockSubmitFeedback(...args),
}))

jest.mock('@/components/ui/Modal', () => ({
  Modal: ({
    visible,
    title,
    message,
    actionLabel,
    secondaryActionLabel,
    onAction,
    onSecondaryAction,
    children,
  }: {
    visible?: boolean
    title: string
    message?: string
    actionLabel?: string
    secondaryActionLabel?: string
    onAction?: () => void
    onSecondaryAction?: () => void
    children?: React.ReactNode
  }) => {
    const { Pressable, Text, View } = require('react-native')

    if (!visible) {
      return null
    }

    return (
      <View>
        <Text>{title}</Text>
        {message ? <Text>{message}</Text> : null}
        {children}
        {actionLabel ? (
          <Pressable onPress={onAction}>
            <Text>{actionLabel}</Text>
          </Pressable>
        ) : null}
        {secondaryActionLabel ? (
          <Pressable onPress={onSecondaryAction}>
            <Text>{secondaryActionLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    )
  },
}))

describe('FeedbackComposerModal', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseAuth.mockReturnValue({
      user: {
        id: 'player-1',
        username: 'Player One',
        provider: 'google',
        nakamaUserId: 'nakama-1',
      },
    })
    mockSubmitFeedback.mockResolvedValue({
      id: 'feedback-1',
      type: 'bug',
      message: 'Example',
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
    })
  })

  it('shows match context and submits the preselected player report category', async () => {
    render(
      <FeedbackComposerModal
        visible
        sourcePage="match"
        initialType="player_report"
        matchContext={{ matchId: 'match-22' }}
        reportedUser={{ userId: 'opponent-9', username: 'Opponent' }}
        onClose={jest.fn()}
      />,
    )

    expect(screen.getByText('Player report')).toBeTruthy()
    expect(screen.getByText('A conduct issue, exploit, or abuse report.')).toBeTruthy()

    fireEvent.changeText(screen.getByLabelText('Feedback message'), 'The other player kept stalling.')
    fireEvent.press(screen.getByLabelText('Send feedback'))

    await waitFor(() => {
      expect(mockSubmitFeedback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'player_report',
          message: 'The other player kept stalling.',
          sourcePage: 'match',
          matchContext: { matchId: 'match-22' },
          reportedUser: { userId: 'opponent-9', username: 'Opponent' },
          submitter: {
            userId: 'player-1',
            username: 'Player One',
            provider: 'google',
            nakamaUserId: 'nakama-1',
          },
        }),
      )
    })
  })

  it('requires a category and message before submitting', async () => {
    render(<FeedbackComposerModal visible sourcePage="home" onClose={jest.fn()} />)

    fireEvent.press(screen.getByLabelText('Send feedback'))
    expect(screen.getByText('Pick a category before sending.')).toBeTruthy()

    fireEvent.press(screen.getByText('Bug'))
    fireEvent.press(screen.getByLabelText('Send feedback'))
    expect(screen.getByText('Write a message before sending.')).toBeTruthy()
  })
})
