import { BoardFrame } from '@/components/board/BoardFrame';
import { BOARD_GAP, BoardGrid, BOARD_PADDING, getTilePosition } from '@/components/board/BoardGrid';
import { urTheme } from '@/constants/urTheme';
import { PATH_DARK, PATH_LENGTH, PATH_LIGHT } from '@/logic/constants';
import { GameState, MoveAction, PlayerColor } from '@/logic/types';
import { useGameStore } from '@/store/useGameStore';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Piece } from './Piece';

interface BoardProps {
  showRailHints?: boolean;
  highlightMode?: 'subtle' | 'theatrical';
  boardScale?: number;
  orientation?: 'horizontal' | 'vertical';
  gameStateOverride?: GameState;
  validMovesOverride?: MoveAction[];
  onMakeMoveOverride?: (move: MoveAction) => void;
  playerColorOverride?: PlayerColor | null;
  allowInteraction?: boolean;
}

const MIN_TILE_SIZE = 48;
const MAX_TILE_SIZE = 90;

const mapIndexToCoord = (color: PlayerColor, index: number) => {
  const path = color === 'light' ? PATH_LIGHT : PATH_DARK;
  return path[index] ?? null;
};

export const Board: React.FC<BoardProps> = ({
  boardScale = 1,
  gameStateOverride,
  validMovesOverride,
  onMakeMoveOverride,
  playerColorOverride,
  allowInteraction = true,
}) => {
  const storeGameState = useGameStore((state) => state.gameState);
  const storeValidMoves = useGameStore((state) => state.validMoves);
  const storeMakeMove = useGameStore((state) => state.makeMove);
  const storePlayerColor = useGameStore((state) => state.playerColor);
  const { width } = useWindowDimensions();
  const [selectedMove, setSelectedMove] = useState<MoveAction | null>(null);

  const gameState = gameStateOverride ?? storeGameState;
  const validMoves = validMovesOverride ?? storeValidMoves;
  const makeMove = onMakeMoveOverride ?? storeMakeMove;
  const playerColor = playerColorOverride ?? storePlayerColor;

  const tileSize = useMemo(() => {
    const scaled = Math.min((width * 0.6) / 3, MAX_TILE_SIZE) * boardScale;
    return Math.max(MIN_TILE_SIZE, Math.min(MAX_TILE_SIZE, Math.round(scaled)));
  }, [boardScale, width]);

  const gridWidth = tileSize * 3 + BOARD_GAP * 2;
  const gridHeight = tileSize * 8 + BOARD_GAP * 7;
  const frameWidth = BOARD_PADDING * 2 + 4 + gridWidth;
  const frameHeight = BOARD_PADDING * 2 + 4 + gridHeight;

  const interactiveTurn = allowInteraction && gameState.phase === 'moving' && (!playerColor || gameState.currentTurn === playerColor);

  const highlightKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const move of validMoves) {
      if (selectedMove) {
        if (move.fromIndex !== selectedMove.fromIndex || move.pieceId !== selectedMove.pieceId) continue;
      }
      const coord = move.toIndex >= 0 && move.toIndex < PATH_LENGTH ? mapIndexToCoord(gameState.currentTurn, move.toIndex) : null;
      if (coord) keys.add(`${coord.row},${coord.col}`);
    }
    return keys;
  }, [gameState.currentTurn, selectedMove, validMoves]);

  const pieces = useMemo(() => {
    const all = [...gameState.light.pieces, ...gameState.dark.pieces];
    return all
      .map((piece) => {
        if (piece.position < 0 || piece.position >= PATH_LENGTH) return null;
        const coord = mapIndexToCoord(piece.owner, piece.position);
        if (!coord) return null;
        return { piece, x: coord.row, y: coord.col };
      })
      .filter((value): value is { piece: (typeof all)[number]; x: number; y: number } => !!value);
  }, [gameState.dark.pieces, gameState.light.pieces]);

  const onTilePress = (x: number, y: number) => {
    if (!interactiveTurn) return;
    const tileMoves = validMoves.filter((move) => {
      const from = move.fromIndex >= 0 ? mapIndexToCoord(gameState.currentTurn, move.fromIndex) : null;
      const to = move.toIndex >= 0 && move.toIndex < PATH_LENGTH ? mapIndexToCoord(gameState.currentTurn, move.toIndex) : null;
      return (from && from.row === x && from.col === y) || (to && to.row === x && to.col === y);
    });

    if (!tileMoves.length) {
      setSelectedMove(null);
      return;
    }

    if (selectedMove) {
      const match = tileMoves.find((move) => move.pieceId === selectedMove.pieceId && move.fromIndex === selectedMove.fromIndex);
      if (match) {
        makeMove(match);
        setSelectedMove(null);
        return;
      }
    }

    setSelectedMove(tileMoves[0]);
  };

  const spawnMove = interactiveTurn ? validMoves.find((move) => move.fromIndex === -1) : undefined;
  const scoreMove = interactiveTurn ? validMoves.find((move) => move.toIndex === PATH_LENGTH) : undefined;

  return (
    <View style={styles.container}>
      <BoardFrame width={frameWidth} height={frameHeight}>
        <View style={{ width: gridWidth, height: gridHeight, alignSelf: 'center' }}>
          <BoardGrid tileSize={tileSize} onTilePress={onTilePress} highlighted={highlightKeys} disabled={!interactiveTurn} />

          <View pointerEvents="none" style={styles.pieceLayer}>
            {pieces.map(({ piece, x, y }) => {
              const pos = getTilePosition(x, y, tileSize, BOARD_GAP, 0, 0);
              return (
                <View
                  key={piece.id}
                  style={{
                    position: 'absolute',
                    left: pos.left,
                    top: pos.top,
                    width: pos.width,
                    height: pos.height,
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10,
                  }}
                >
                  <Piece color={piece.owner} />
                </View>
              );
            })}
          </View>
        </View>
      </BoardFrame>

      <View style={styles.cueRow}>
        {spawnMove && (
          <Pressable style={styles.cue} onPress={() => makeMove(spawnMove)}>
            <Text style={styles.cueText}>ENTER</Text>
          </Pressable>
        )}
        {scoreMove && (
          <Pressable style={styles.cue} onPress={() => makeMove(scoreMove)}>
            <Text style={styles.cueText}>SCORE</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pieceLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  cueRow: {
    marginTop: urTheme.spacing.sm,
    flexDirection: 'row',
    gap: urTheme.spacing.xs,
  },
  cue: {
    backgroundColor: '#8B5E3C',
    borderColor: '#6E472C',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  cueText: {
    color: '#F2E6D8',
    fontWeight: '700',
    letterSpacing: 0.6,
  },
});
