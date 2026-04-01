import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Board } from './Board';
import { createInitialState, getValidMoves } from '@/logic/engine';
import { getPathCoord } from '@/logic/pathVariants';
import type { GameState, PlayerColor } from '@/logic/types';

jest.mock('./Tile', () => {
  const React = require('react');
  const { Pressable, Text } = require('react-native');

  return {
    Tile: ({
      row,
      col,
      piece,
      pieceInvalidSelectionToken,
      onPress,
      isInteractive,
    }: {
      row: number;
      col: number;
      piece?: { id: string; color: PlayerColor };
      pieceInvalidSelectionToken?: number;
      onPress?: () => void;
      isInteractive?: boolean;
    }) => (
      <Pressable testID={`tile-${row}-${col}`} onPress={onPress} disabled={!isInteractive}>
        <Text>{`${row}-${col}`}</Text>
        {piece ? (
          <Text testID={`tile-piece-feedback-${piece.id}`}>{String(pieceInvalidSelectionToken ?? 0)}</Text>
        ) : null}
      </Pressable>
    ),
  };
});

jest.mock('./Piece', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    Piece: () => <View testID="mock-piece" />,
  };
});

const setOnlyActivePiece = (state: GameState, color: PlayerColor, pieceIndex: number, position: number) => {
  const player = state[color];

  player.finishedCount = 0;
  player.pieces.forEach((piece, index) => {
    piece.position = -1;
    piece.isFinished = index !== pieceIndex;

    if (piece.isFinished) {
      piece.position = state.matchConfig.pieceCountPerSide + 20;
      player.finishedCount += 1;
    }
  });

  player.pieces[pieceIndex].position = position;
  player.pieces[pieceIndex].isFinished = false;
};

const setAllPiecesFinished = (state: GameState, color: PlayerColor) => {
  const player = state[color];
  player.finishedCount = player.pieces.length;
  player.pieces.forEach((piece, index) => {
    piece.position = state.matchConfig.pieceCountPerSide + 20 + index;
    piece.isFinished = true;
  });
};

describe('Board interactions', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('moves a piece directly when its piece tile is pressed', () => {
    const state = createInitialState();
    state.currentTurn = 'light';
    state.phase = 'moving';
    state.rollValue = 1;
    setOnlyActivePiece(state, 'light', 0, 0);
    setAllPiecesFinished(state, 'dark');

    const validMoves = getValidMoves(state, 1);
    const onMakeMove = jest.fn();

    render(
      <Board
        gameStateOverride={state}
        validMovesOverride={validMoves}
        onMakeMoveOverride={onMakeMove}
        playerColorOverride="light"
      />,
    );

    fireEvent.press(screen.getByTestId('tile-2-3'));
    act(() => {
      jest.advanceTimersByTime(180);
    });

    expect(onMakeMove).toHaveBeenCalledWith(validMoves[0]);
  });

  it('moves a piece directly when the pulsing destination overlay is pressed', () => {
    const state = createInitialState();
    state.currentTurn = 'light';
    state.phase = 'moving';
    state.rollValue = 1;
    setOnlyActivePiece(state, 'light', 0, 0);
    setAllPiecesFinished(state, 'dark');

    const validMoves = getValidMoves(state, 1);
    const onMakeMove = jest.fn();

    render(
      <Board
        autoMoveHintEnabled
        gameStateOverride={state}
        validMovesOverride={validMoves}
        onMakeMoveOverride={onMakeMove}
        playerColorOverride="light"
      />,
    );

    fireEvent.press(screen.getByTestId('board-preview-destination'));

    expect(onMakeMove).toHaveBeenCalledWith(validMoves[0]);
  });

  it('shows a blocked red path when an owned piece cannot move', () => {
    const state = createInitialState();
    state.currentTurn = 'light';
    state.phase = 'moving';
    state.rollValue = 1;
    setOnlyActivePiece(state, 'light', 0, 0);
    setAllPiecesFinished(state, 'dark');

    state.light.pieces[1].position = 1;
    state.light.pieces[1].isFinished = false;
    state.light.finishedCount -= 1;

    const validMoves = getValidMoves(state, 1);
    const onMakeMove = jest.fn();
    const blockedTile = getPathCoord(state.matchConfig.pathVariant, 'light', 0);

    if (!blockedTile) {
      throw new Error('Expected a board coordinate for the blocked test tile.');
    }

    render(
      <Board
        gameStateOverride={state}
        validMovesOverride={validMoves}
        onMakeMoveOverride={onMakeMove}
        playerColorOverride="light"
      />,
    );

    fireEvent.press(screen.getByTestId(`tile-${blockedTile.row}-${blockedTile.col}`));

    expect(onMakeMove).not.toHaveBeenCalled();
    expect(screen.getByTestId('board-preview-blocked')).toBeTruthy();
  });

  it('increments invalid piece feedback when an owned piece cannot move', () => {
    const state = createInitialState();
    state.currentTurn = 'light';
    state.phase = 'moving';
    state.rollValue = 1;
    setOnlyActivePiece(state, 'light', 0, 0);
    setAllPiecesFinished(state, 'dark');

    state.light.pieces[1].position = 1;
    state.light.pieces[1].isFinished = false;
    state.light.finishedCount -= 1;

    const validMoves = getValidMoves(state, 1);
    const blockedTile = getPathCoord(state.matchConfig.pathVariant, 'light', 0);

    if (!blockedTile) {
      throw new Error('Expected a board coordinate for the blocked test tile.');
    }

    render(
      <Board
        gameStateOverride={state}
        validMovesOverride={validMoves}
        onMakeMoveOverride={jest.fn()}
        playerColorOverride="light"
      />,
    );

    expect(screen.getByTestId('tile-piece-feedback-light-0').props.children).toBe('0');

    fireEvent.press(screen.getByTestId(`tile-${blockedTile.row}-${blockedTile.col}`));

    expect(screen.getByTestId('tile-piece-feedback-light-0').props.children).toBe('1');
  });

  it('emits the selected piece while the auto-commit window is open', () => {
    const state = createInitialState();
    state.currentTurn = 'light';
    state.phase = 'moving';
    state.rollValue = 1;
    setOnlyActivePiece(state, 'light', 0, 0);
    setAllPiecesFinished(state, 'dark');

    const validMoves = getValidMoves(state, 1);
    const onSelectedPieceChange = jest.fn();

    render(
      <Board
        gameStateOverride={state}
        validMovesOverride={validMoves}
        onMakeMoveOverride={jest.fn()}
        onSelectedPieceChange={onSelectedPieceChange}
        playerColorOverride="light"
      />,
    );

    fireEvent.press(screen.getByTestId('tile-2-3'));

    expect(onSelectedPieceChange).toHaveBeenLastCalledWith(validMoves[0]?.pieceId ?? null);
  });

  it('suppresses move affordances and interaction when motion is frozen', () => {
    const state = createInitialState();
    state.currentTurn = 'light';
    state.phase = 'moving';
    state.rollValue = 1;
    setOnlyActivePiece(state, 'light', 0, 0);
    setAllPiecesFinished(state, 'dark');

    const validMoves = getValidMoves(state, 1);
    const onMakeMove = jest.fn();

    const { queryByTestId, rerender } = render(
      <Board
        autoMoveHintEnabled
        gameStateOverride={state}
        validMovesOverride={validMoves}
        onMakeMoveOverride={onMakeMove}
        playerColorOverride="light"
      />,
    );

    expect(queryByTestId('board-preview-destination')).toBeTruthy();

    fireEvent.press(screen.getByTestId('tile-2-3'));
    act(() => {
      jest.advanceTimersByTime(180);
    });
    expect(onMakeMove).toHaveBeenCalledTimes(1);

    onMakeMove.mockClear();

    rerender(
      <Board
        autoMoveHintEnabled
        freezeMotion
        gameStateOverride={state}
        validMovesOverride={validMoves}
        onMakeMoveOverride={onMakeMove}
        playerColorOverride="light"
      />,
    );

    expect(queryByTestId('board-preview-destination')).toBeNull();

    fireEvent.press(screen.getByTestId('tile-2-3'));
    expect(onMakeMove).not.toHaveBeenCalled();
  });
});
