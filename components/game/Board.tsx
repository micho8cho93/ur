import { urShadows, urTheme, urTextures } from '@/constants/urTheme';
import { BOARD_COLS, BOARD_ROWS, PATH_DARK, PATH_LIGHT } from '@/logic/constants';
import { useGameStore } from '@/store/useGameStore';
import React, { useEffect, useMemo } from 'react';
import {
  Image,
  LayoutAnimation,
  Platform,
  StyleSheet,
  UIManager,
  useWindowDimensions,
  View,
} from 'react-native';
import { Tile } from './Tile';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export const Board: React.FC = () => {
  const gameState = useGameStore((state) => state.gameState);
  const validMoves = useGameStore((state) => state.validMoves);
  const makeMove = useGameStore((state) => state.makeMove);
  const playerId = 'light';
  const { width } = useWindowDimensions();

  const boardWidth = useMemo(() => Math.min(width - urTheme.spacing.lg, 760), [width]);

  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, [gameState.history.length]);

  const mapIndexToCoord = (color: 'light' | 'dark', index: number, r: number, c: number) => {
    const path = color === 'light' ? PATH_LIGHT : PATH_DARK;
    const coord = path[index];
    if (!coord) return false;
    return coord.row === r && coord.col === c;
  };

  const getPieceAt = (r: number, c: number): { id: string; color: 'light' | 'dark' } | undefined => {
    const lightPiece = gameState.light.pieces.find(
      (piece) =>
        !piece.isFinished && piece.position !== -1 && mapIndexToCoord('light', piece.position, r, c),
    );
    if (lightPiece) return { id: lightPiece.id, color: 'light' };

    const darkPiece = gameState.dark.pieces.find(
      (piece) =>
        !piece.isFinished && piece.position !== -1 && mapIndexToCoord('dark', piece.position, r, c),
    );
    if (darkPiece) return { id: darkPiece.id, color: 'dark' };

    return undefined;
  };

  const handleTilePress = (r: number, c: number) => {
    if (gameState.currentTurn !== playerId) return;

    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);

    const scoringMove = validMoves.find((move) => {
      if (move.toIndex !== 14) return false;
      return mapIndexToCoord(playerId, move.fromIndex, r, c);
    });
    if (scoringMove) {
      makeMove(scoringMove);
      return;
    }

    const move = validMoves.find((candidate) => {
      if (candidate.toIndex === 14) return false;
      return mapIndexToCoord(playerId, candidate.toIndex, r, c);
    });
    if (move) {
      makeMove(move);
    }
  };

  const renderGrid = () => {
    const rows = [];
    for (let r = 0; r < BOARD_ROWS; r++) {
      const rowCells = [];
      for (let c = 0; c < BOARD_COLS; c++) {
        const isGap = (r === 0 || r === 2) && (c === 4 || c === 5);
        if (isGap) {
          rowCells.push(<View key={`${r}-${c}`} style={styles.gapCell} />);
          continue;
        }

        const piece = getPieceAt(r, c);
        let isValidTarget = false;

        if (gameState.currentTurn === playerId) {
          const canScore = validMoves.some((move) => {
            if (move.toIndex !== 14) return false;
            return mapIndexToCoord(playerId, move.fromIndex, r, c);
          });

          const isDestination = validMoves.some((move) => {
            if (move.toIndex === 14) return false;
            return mapIndexToCoord(playerId, move.toIndex, r, c);
          });

          isValidTarget = canScore || isDestination;
        }

        rowCells.push(
          <View key={`${r}-${c}`} style={styles.cellShell}>
            <Tile row={r} col={c} piece={piece} isValidTarget={isValidTarget} onPress={() => handleTilePress(r, c)} />
          </View>,
        );
      }

      rows.push(
        <View key={r} style={styles.row}>
          {rowCells}
        </View>,
      );
    }

    return rows;
  };

  return (
    <View style={[styles.frame, urShadows.deep, { width: boardWidth }]}>
      <Image source={urTextures.border} resizeMode="repeat" style={styles.frameBorderTexture} />

      <View style={styles.innerFrame}>
        <Image source={urTextures.woodDark} resizeMode="repeat" style={styles.boardTexture} />
        <View style={styles.topGlow} />
        <View style={styles.bottomShade} />
        <View style={styles.innerStroke} />
        <View style={styles.gridWrap}>{renderGrid()}</View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  frame: {
    alignSelf: 'center',
    borderRadius: urTheme.radii.lg + 4,
    padding: urTheme.spacing.sm,
    backgroundColor: '#462814',
    borderWidth: 2,
    borderColor: 'rgba(217, 164, 65, 0.55)',
    overflow: 'hidden',
  },
  frameBorderTexture: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.24,
  },
  innerFrame: {
    borderRadius: urTheme.radii.lg,
    overflow: 'hidden',
    backgroundColor: '#54301A',
    padding: urTheme.spacing.xs,
  },
  boardTexture: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.28,
  },
  topGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '42%',
    backgroundColor: 'rgba(255, 220, 150, 0.14)',
  },
  bottomShade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '46%',
    backgroundColor: 'rgba(8, 8, 8, 0.2)',
  },
  innerStroke: {
    ...StyleSheet.absoluteFillObject,
    margin: urTheme.spacing.xs,
    borderRadius: urTheme.radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 226, 175, 0.26)',
  },
  gridWrap: {
    gap: urTheme.spacing.xs - 2,
  },
  row: {
    flexDirection: 'row',
    width: '100%',
  },
  cellShell: {
    width: `${100 / BOARD_COLS}%`,
    aspectRatio: 1,
    padding: 3,
  },
  gapCell: {
    width: `${100 / BOARD_COLS}%`,
    aspectRatio: 1,
    padding: 3,
  },
});
