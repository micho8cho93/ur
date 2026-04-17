import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Platform } from 'react-native';
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
      onHoverIn,
      onHoverOut,
      isInteractive,
    }: {
      row: number;
      col: number;
      piece?: { id: string; color: PlayerColor };
      pieceInvalidSelectionToken?: number;
      onPress?: (row: number, col: number) => void;
      onHoverIn?: (row: number, col: number) => void;
      onHoverOut?: (row: number, col: number) => void;
      isInteractive?: boolean;
    }) => (
      <Pressable
        testID={`tile-${row}-${col}`}
        onPress={() => onPress?.(row, col)}
        onHoverIn={() => onHoverIn?.(row, col)}
        onHoverOut={() => onHoverOut?.(row, col)}
        disabled={!isInteractive}
      >
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

const setActivePieces = (state: GameState, color: PlayerColor, activePieceIndexes: number[]) => {
  const player = state[color];
  const activeIndexes = new Set(activePieceIndexes);
  player.finishedCount = player.pieces.length - activeIndexes.size;

  player.pieces.forEach((piece, index) => {
    if (activeIndexes.has(index)) {
      piece.position = index;
      piece.isFinished = false;
      return;
    }

    piece.position = state.matchConfig.pieceCountPerSide + 20 + index;
    piece.isFinished = true;
  });
};

describe('Board interactions', () => {
  const originalPlatform = Platform.OS;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(console, 'info').mockImplementation(() => {});
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      get: () => 'ios',
    });
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
    jest.restoreAllMocks();
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      get: () => originalPlatform,
    });
  });

  it('does not auto-highlight one of several legal moves', () => {
    const state = createInitialState();
    state.currentTurn = 'light';
    state.phase = 'moving';
    state.rollValue = 1;
    setActivePieces(state, 'light', [0, 3]);
    setAllPiecesFinished(state, 'dark');

    const validMoves = getValidMoves(state, 1);

    render(
      <Board
        autoMoveHintEnabled
        gameStateOverride={state}
        validMovesOverride={validMoves}
        onMakeMoveOverride={jest.fn()}
        playerColorOverride="light"
      />,
    );

    expect(screen.queryByTestId('board-preview-valid')).toBeNull();
    expect(screen.queryByTestId('board-preview-destination')).toBeNull();
  });

  it('reveals a path after hovering a piece on web', () => {
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      get: () => 'web',
    });

    const state = createInitialState();
    state.currentTurn = 'light';
    state.phase = 'moving';
    state.rollValue = 1;
    setActivePieces(state, 'light', [0, 3]);
    setAllPiecesFinished(state, 'dark');

    const validMoves = getValidMoves(state, 1);
    const pieceTile = getPathCoord(state.matchConfig.pathVariant, 'light', 0);

    if (!pieceTile) {
      throw new Error('Expected a board coordinate for the hover test tile.');
    }

    render(
      <Board
        autoMoveHintEnabled
        gameStateOverride={state}
        validMovesOverride={validMoves}
        onMakeMoveOverride={jest.fn()}
        playerColorOverride="light"
      />,
    );

    const tile = screen.getByTestId(`tile-${pieceTile.row}-${pieceTile.col}`);
    act(() => {
      fireEvent(tile, 'hoverIn');
    });

    expect(screen.getByTestId('board-preview-valid')).toBeTruthy();
  });

  it('moves a hovered piece on web with a single click', () => {
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      get: () => 'web',
    });

    const state = createInitialState();
    state.currentTurn = 'light';
    state.phase = 'moving';
    state.rollValue = 1;
    setActivePieces(state, 'light', [0, 3]);
    setAllPiecesFinished(state, 'dark');

    const validMoves = getValidMoves(state, 1);
    const onMakeMove = jest.fn();
    const pieceTile = getPathCoord(state.matchConfig.pathVariant, 'light', 0);

    if (!pieceTile) {
      throw new Error('Expected a board coordinate for the web click test tile.');
    }

    const targetMove = validMoves.find((move) => move.fromIndex === 0);
    if (!targetMove) {
      throw new Error('Expected a valid move for the clicked piece.');
    }

    render(
      <Board
        autoMoveHintEnabled
        gameStateOverride={state}
        validMovesOverride={validMoves}
        onMakeMoveOverride={onMakeMove}
        playerColorOverride="light"
      />,
    );

    const tile = screen.getByTestId(`tile-${pieceTile.row}-${pieceTile.col}`);

    act(() => {
      fireEvent(tile, 'hoverIn');
    });
    expect(screen.getByTestId('board-preview-valid')).toBeTruthy();

    fireEvent.press(tile);
    expect(onMakeMove).toHaveBeenCalledWith(expect.objectContaining(targetMove));
  });

  it('selects a piece on mobile and commits it on the second tap', () => {
    const state = createInitialState();
    state.currentTurn = 'light';
    state.phase = 'moving';
    state.rollValue = 1;
    setActivePieces(state, 'light', [0, 3]);
    setAllPiecesFinished(state, 'dark');

    const validMoves = getValidMoves(state, 1);
    const onMakeMove = jest.fn();
    const pieceTile = getPathCoord(state.matchConfig.pathVariant, 'light', 0);

    if (!pieceTile) {
      throw new Error('Expected a board coordinate for the mobile test tile.');
    }

    render(
      <Board
        autoMoveHintEnabled
        gameStateOverride={state}
        validMovesOverride={validMoves}
        onMakeMoveOverride={onMakeMove}
        playerColorOverride="light"
      />,
    );

    fireEvent.press(screen.getByTestId(`tile-${pieceTile.row}-${pieceTile.col}`));
    expect(onMakeMove).not.toHaveBeenCalled();
    expect(screen.getByTestId('board-preview-valid')).toBeTruthy();

    fireEvent.press(screen.getByTestId(`tile-${pieceTile.row}-${pieceTile.col}`));
    const targetMove = validMoves.find((move) => move.fromIndex === 0);
    if (!targetMove) {
      throw new Error('Expected a valid move for the tapped piece.');
    }
    expect(onMakeMove).toHaveBeenCalledWith(
      expect.objectContaining(targetMove),
    );
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

  it('emits the selected piece while a mobile tap selection is open', () => {
    const state = createInitialState();
    state.currentTurn = 'light';
    state.phase = 'moving';
    state.rollValue = 1;
    setActivePieces(state, 'light', [0, 3]);
    setAllPiecesFinished(state, 'dark');

    const validMoves = getValidMoves(state, 1);
    const onSelectedPieceChange = jest.fn();
    const pieceTile = getPathCoord(state.matchConfig.pathVariant, 'light', 0);

    if (!pieceTile) {
      throw new Error('Expected a board coordinate for the selected-piece test tile.');
    }

    render(
      <Board
        gameStateOverride={state}
        validMovesOverride={validMoves}
        onMakeMoveOverride={jest.fn()}
        onSelectedPieceChange={onSelectedPieceChange}
        playerColorOverride="light"
      />,
    );

    const targetMove = validMoves.find((move) => move.fromIndex === 0);
    if (!targetMove) {
      throw new Error('Expected a valid move for the tapped piece.');
    }

    fireEvent.press(screen.getByTestId(`tile-${pieceTile.row}-${pieceTile.col}`));

    expect(onSelectedPieceChange).toHaveBeenLastCalledWith(targetMove.pieceId);
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
    const pieceTile = getPathCoord(state.matchConfig.pathVariant, 'light', 0);

    if (!pieceTile) {
      throw new Error('Expected a board coordinate for the frozen test tile.');
    }

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

    fireEvent.press(screen.getByTestId(`tile-${pieceTile.row}-${pieceTile.col}`));
    act(() => {
      jest.advanceTimersByTime(180);
    });
    expect(onMakeMove).not.toHaveBeenCalled();

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

    fireEvent.press(screen.getByTestId(`tile-${pieceTile.row}-${pieceTile.col}`));
    expect(onMakeMove).not.toHaveBeenCalled();
  });
});
