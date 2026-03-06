import { urTheme } from '@/constants/urTheme';
import { BOARD_COLS, BOARD_ROWS, PATH_DARK, PATH_LENGTH, PATH_LIGHT } from '@/logic/constants';
import { GameState, MoveAction, PlayerColor } from '@/logic/types';
import { useGameStore } from '@/store/useGameStore';
import React, { useEffect, useMemo, useState } from 'react';
import { Image, LayoutAnimation, Platform, Pressable, StyleSheet, Text, UIManager, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Piece } from './Piece';
import { Tile } from './Tile';

const boardImage = require('../../assets/board/board_design.png');

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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

interface Point {
  x: number;
  y: number;
}

const FRAME_PADDING = urTheme.spacing.sm;
const INNER_PADDING = urTheme.spacing.xs;
const GRID_GAP = 0;
const CUE_SIZE = 48;
const SCORE_CUE_MIN_SIZE = 44;
const SCORE_CUE_MAX_SIZE = 58;
const MIN_TILE_SHELL_PADDING = 2;
const BOARD_IMAGE_HORIZONTAL_STRETCH = 2.5;

export const Board: React.FC<BoardProps> = ({
  showRailHints = false,
  highlightMode = 'theatrical',
  boardScale = 1,
  orientation = 'horizontal',
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

  const cuePulse = useSharedValue(0);
  const scoreCuePulse = useSharedValue(0);
  const previewPulse = useSharedValue(0);

  const gameState = gameStateOverride ?? storeGameState;
  const validMoves = validMovesOverride ?? storeValidMoves;
  const makeMove = onMakeMoveOverride ?? storeMakeMove;
  const playerColor = playerColorOverride ?? storePlayerColor;
  const isVertical = orientation === 'vertical';
  const displayRows = isVertical ? BOARD_COLS : BOARD_ROWS;
  const displayCols = isVertical ? BOARD_ROWS : BOARD_COLS;

  const boardWidth = useMemo(
    () => Math.min(width - urTheme.spacing.lg, urTheme.layout.boardMax) * boardScale,
    [boardScale, width],
  );

  const cellSize = useMemo(() => {
    const gridWidth = boardWidth - FRAME_PADDING * 2 - INNER_PADDING * 2;
    return gridWidth / displayCols;
  }, [boardWidth, displayCols]);
  const tileShellPadding = useMemo(
    () => Math.max(MIN_TILE_SHELL_PADDING, Math.round(cellSize * 0.04)),
    [cellSize],
  );
  const renderedTileSize = useMemo(
    () => Math.max(18, Math.round(cellSize - tileShellPadding * 2)),
    [cellSize, tileShellPadding],
  );
  const gridHeight = cellSize * displayRows + GRID_GAP * Math.max(0, displayRows - 1);
  const frameHeight = FRAME_PADDING * 2 + INNER_PADDING * 2 + gridHeight;

  const mapLogicalToDisplayCoord = (r: number, c: number): { row: number; col: number } => {
    if (!isVertical) {
      return { row: r, col: c };
    }

    return {
      row: c,
      col: BOARD_ROWS - 1 - r,
    };
  };

  const mapDisplayToLogicalCoord = (r: number, c: number): { row: number; col: number } => {
    if (!isVertical) {
      return { row: r, col: c };
    }

    return {
      row: BOARD_ROWS - 1 - c,
      col: r,
    };
  };

  const mapIndexToCoord = (color: 'light' | 'dark', index: number, r: number, c: number) => {
    const path = color === 'light' ? PATH_LIGHT : PATH_DARK;
    const coord = path[index];
    if (!coord) return false;
    return coord.row === r && coord.col === c;
  };

  const getCellCenter = (r: number, c: number): Point => ({
    x: (() => {
      const displayCoord = mapLogicalToDisplayCoord(r, c);
      return FRAME_PADDING + INNER_PADDING + displayCoord.col * cellSize + cellSize / 2;
    })(),
    y: (() => {
      const displayCoord = mapLogicalToDisplayCoord(r, c);
      return FRAME_PADDING + INNER_PADDING + displayCoord.row * (cellSize + GRID_GAP) + cellSize / 2;
    })(),
  });

  const projectLogicalOffset = (x: number, y: number): Point => {
    if (!isVertical) {
      return { x, y };
    }

    return {
      x: -y,
      y: x,
    };
  };

  const coordForPathIndex = (color: 'light' | 'dark', index: number): Point | null => {
    const path = color === 'light' ? PATH_LIGHT : PATH_DARK;

    if (index === -1) {
      const startCenter = getCellCenter(path[0].row, path[0].col);
      const reserveOffset = projectLogicalOffset(cellSize * 0.58, 0);
      return {
        x: startCenter.x + reserveOffset.x,
        y: startCenter.y + reserveOffset.y,
      };
    }

    if (index === PATH_LENGTH) {
      const finalCenter = getCellCenter(path[path.length - 1].row, path[path.length - 1].col);
      const finishOffset = projectLogicalOffset(cellSize * 0.95, 0);
      return {
        x: finalCenter.x + finishOffset.x,
        y: finalCenter.y + finishOffset.y,
      };
    }

    const coord = path[index];
    if (!coord) return null;
    return getCellCenter(coord.row, coord.col);
  };

  const getPieceAt = (r: number, c: number): { id: string; color: 'light' | 'dark' } | undefined => {
    const lightPiece = gameState.light.pieces.find(
      (piece) =>
        !piece.isFinished && piece.position !== -1 && mapIndexToCoord('light', piece.position, r, c),
    );
    if (lightPiece) return { id: lightPiece.id, color: 'light' };

    const darkPiece = gameState.dark.pieces.find(
      (piece) => !piece.isFinished && piece.position !== -1 && mapIndexToCoord('dark', piece.position, r, c),
    );
    if (darkPiece) return { id: darkPiece.id, color: 'dark' };

    return undefined;
  };

  const assignedPlayerColor: 'light' | 'dark' | null = playerColor === 'light' || playerColor === 'dark'
    ? playerColor
    : null;

  const mapAssignedIndexToCoord = (index: number, r: number, c: number) =>
    assignedPlayerColor ? mapIndexToCoord(assignedPlayerColor, index, r, c) : false;

  const isMyTurn = assignedPlayerColor !== null && gameState.currentTurn === assignedPlayerColor;
  const isInteractiveTurn = allowInteraction && isMyTurn;

  const spawnMove = useMemo(
    () => validMoves.find((move) => move.fromIndex === -1) ?? null,
    [validMoves],
  );
  const scoringMoves = useMemo(() => validMoves.filter((move) => move.toIndex === PATH_LENGTH), [validMoves]);

  const spawnCueColor: 'light' | 'dark' = gameState.currentTurn;
  const hasScoringMove = scoringMoves.length > 0;
  const scoreCueSize = Math.round(Math.min(Math.max(cellSize * 0.92, SCORE_CUE_MIN_SIZE), SCORE_CUE_MAX_SIZE));

  const spawnCueAnchor = spawnMove
    ? (() => {
      const start = spawnCueColor === 'light' ? PATH_LIGHT[0] : PATH_DARK[0];
      const startCenter = getCellCenter(start.row, start.col);
      const spawnOffset = projectLogicalOffset(cellSize * 0.58, 0);
      return {
        x: startCenter.x + spawnOffset.x,
        y: startCenter.y + spawnOffset.y,
      };
    })()
    : null;

  const scoreCueAnchor =
    hasScoringMove && assignedPlayerColor
      ? (() => {
        const path = assignedPlayerColor === 'light' ? PATH_LIGHT : PATH_DARK;
        const final = path[path.length - 1];
        return getCellCenter(final.row, final.col - 1);
      })()
      : null;

  const previewPoints = (() => {
    if (!selectedMove) return [] as Point[];

    const color: 'light' | 'dark' = selectedMove.pieceId.startsWith('dark') ? 'dark' : 'light';
    const points: Point[] = [];

    if (selectedMove.fromIndex === -1) {
      const reservePoint = coordForPathIndex(color, -1);
      if (reservePoint) {
        points.push(reservePoint);
      }
      for (let index = 0; index <= Math.min(selectedMove.toIndex, PATH_LENGTH - 1); index += 1) {
        const point = coordForPathIndex(color, index);
        if (point) {
          points.push(point);
        }
      }
    } else {
      const startPoint = coordForPathIndex(color, selectedMove.fromIndex);
      if (startPoint) {
        points.push(startPoint);
      }
      for (
        let index = selectedMove.fromIndex + 1;
        index <= Math.min(selectedMove.toIndex, PATH_LENGTH - 1);
        index += 1
      ) {
        const point = coordForPathIndex(color, index);
        if (point) {
          points.push(point);
        }
      }
    }

    if (selectedMove.toIndex === PATH_LENGTH) {
      const finishPoint = coordForPathIndex(color, PATH_LENGTH);
      if (finishPoint) {
        points.push(finishPoint);
      }
    }

    return points;
  })();

  const previewSegments = useMemo(() => {
    const segments: { x: number; y: number; width: number; angle: number }[] = [];

    for (let index = 0; index < previewPoints.length - 1; index += 1) {
      const current = previewPoints[index];
      const next = previewPoints[index + 1];
      const dx = next.x - current.x;
      const dy = next.y - current.y;
      const width = Math.sqrt(dx * dx + dy * dy);

      segments.push({
        x: (current.x + next.x) / 2,
        y: (current.y + next.y) / 2,
        width,
        angle: Math.atan2(dy, dx),
      });
    }

    return segments;
  }, [previewPoints]);

  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, [gameState.history.length]);

  useEffect(() => {
    if (!spawnMove) {
      cancelAnimation(cuePulse);
      cuePulse.value = withTiming(0, { duration: urTheme.motion.duration.fast });
      return;
    }

    cuePulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 760, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.2, { duration: 760, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      true,
    );
  }, [cuePulse, spawnMove]);

  useEffect(() => {
    if (!isInteractiveTurn || !hasScoringMove) {
      cancelAnimation(scoreCuePulse);
      scoreCuePulse.value = withTiming(0, { duration: urTheme.motion.duration.fast });
      return;
    }

    scoreCuePulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 640, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.25, { duration: 640, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      true,
    );
  }, [hasScoringMove, isInteractiveTurn, scoreCuePulse]);

  useEffect(() => {
    if (!selectedMove) {
      cancelAnimation(previewPulse);
      previewPulse.value = withTiming(0, { duration: urTheme.motion.duration.fast });
      return;
    }

    previewPulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 620, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.4, { duration: 620, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      true,
    );
  }, [previewPulse, selectedMove]);

  useEffect(() => {
    if (!selectedMove) return;

    const stillValid = validMoves.some(
      (move) =>
        move.pieceId === selectedMove.pieceId &&
        move.fromIndex === selectedMove.fromIndex &&
        move.toIndex === selectedMove.toIndex,
    );

    if (!stillValid) {
      setSelectedMove(null);
    }
  }, [selectedMove, validMoves]);

  useEffect(() => {
    setSelectedMove(null);
  }, [gameState.currentTurn, gameState.phase, gameState.rollValue]);

  const executeMove = (move: MoveAction) => {
    console.info('[Board][executeMove]', {
      pieceId: move.pieceId,
      fromIndex: move.fromIndex,
      toIndex: move.toIndex,
      phase: gameState.phase,
      turn: gameState.currentTurn,
      playerColor: assignedPlayerColor,
    });
    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
    makeMove(move);
    setSelectedMove(null);
  };

  const handleSpawnCuePress = () => {
    if (!spawnMove || !isInteractiveTurn || gameState.phase !== 'moving') return;

    if (
      selectedMove &&
      selectedMove.pieceId === spawnMove.pieceId &&
      selectedMove.fromIndex === spawnMove.fromIndex &&
      selectedMove.toIndex === spawnMove.toIndex
    ) {
      executeMove(spawnMove);
      return;
    }

    setSelectedMove(spawnMove);
  };

  const handleScoreCuePress = () => {
    if (!isInteractiveTurn || gameState.phase !== 'moving') return;

    if (selectedMove && selectedMove.toIndex === PATH_LENGTH) {
      const selectedScoringMove = validMoves.find(
        (move) =>
          move.pieceId === selectedMove.pieceId &&
          move.fromIndex === selectedMove.fromIndex &&
          move.toIndex === selectedMove.toIndex,
      );

      if (selectedScoringMove) {
        executeMove(selectedScoringMove);
        return;
      }
    }

    const fallbackScoringMove = scoringMoves[0];
    if (!fallbackScoringMove) return;

    executeMove(fallbackScoringMove);
  };

  const handleTilePress = (r: number, c: number) => {
    if (!assignedPlayerColor || !isInteractiveTurn || gameState.phase !== 'moving') return;

    const moveFromTile = validMoves.find(
      (move) => move.fromIndex >= 0 && mapAssignedIndexToCoord(move.fromIndex, r, c),
    );

    if (moveFromTile) {
      if (
        selectedMove &&
        selectedMove.pieceId === moveFromTile.pieceId &&
        selectedMove.fromIndex === moveFromTile.fromIndex &&
        selectedMove.toIndex === moveFromTile.toIndex
      ) {
        setSelectedMove(null);
      } else {
        setSelectedMove(moveFromTile);
      }
      return;
    }

    if (selectedMove) {
      const selectedToTileMatch =
        selectedMove.toIndex !== PATH_LENGTH && mapAssignedIndexToCoord(selectedMove.toIndex, r, c);

      if (selectedToTileMatch) {
        executeMove(selectedMove);
        return;
      }
    }

    const moveToTile = validMoves.find(
      (move) => move.toIndex !== PATH_LENGTH && mapAssignedIndexToCoord(move.toIndex, r, c),
    );

    if (moveToTile) {
      executeMove(moveToTile);
      return;
    }

    setSelectedMove(null);
  };

  const cueAnimatedStyle = useAnimatedStyle(() => ({
    opacity: 0.3 + cuePulse.value * 0.7,
    transform: [{ scale: 0.94 + cuePulse.value * 0.14 }],
  }));

  const scoreCueAnimatedStyle = useAnimatedStyle(() => ({
    opacity: 0.48 + scoreCuePulse.value * 0.52,
    transform: [{ scale: 0.94 + scoreCuePulse.value * 0.12 }],
    shadowOpacity: 0.28 + scoreCuePulse.value * 0.44,
  }));

  const previewPulseStyle = useAnimatedStyle(() => ({
    opacity: 0.28 + previewPulse.value * 0.64,
    shadowOpacity: 0.26 + previewPulse.value * 0.5,
  }));

  const renderGrid = () => {
    const rows = [];

    for (let displayRow = 0; displayRow < displayRows; displayRow += 1) {
      const rowCells = [];

      for (let displayCol = 0; displayCol < displayCols; displayCol += 1) {
        const { row: r, col: c } = mapDisplayToLogicalCoord(displayRow, displayCol);
        const isGap = (r === 0 || r === 2) && (c === 4 || c === 5);
        if (isGap) {
          rowCells.push(
            <View
              key={`gap-${displayRow}-${displayCol}`}
              style={[styles.gapCell, { width: `${100 / displayCols}%`, padding: tileShellPadding }]}
            />,
          );
          continue;
        }

        const piece = getPieceAt(r, c);
        const moveFromTile = validMoves.find(
          (move) => move.fromIndex >= 0 && isMyTurn && mapAssignedIndexToCoord(move.fromIndex, r, c),
        );

        const isDestination =
          isMyTurn &&
          validMoves.some(
            (move) => move.toIndex !== PATH_LENGTH && mapAssignedIndexToCoord(move.toIndex, r, c),
          );

        const isSelectedDestination =
          !!selectedMove &&
          selectedMove.toIndex !== PATH_LENGTH &&
          mapAssignedIndexToCoord(selectedMove.toIndex, r, c);

        const isSelectedPiece =
          !!selectedMove && selectedMove.fromIndex >= 0 && mapAssignedIndexToCoord(selectedMove.fromIndex, r, c);

        const isValidTarget = isSelectedDestination || isDestination;
        const isInteractable = isInteractiveTurn && (isValidTarget || !!moveFromTile || isSelectedPiece);

        rowCells.push(
          <View
            key={`cell-${displayRow}-${displayCol}`}
            style={[styles.cellShell, { width: `${100 / displayCols}%`, padding: tileShellPadding }]}
          >
            <Tile
              row={r}
              col={c}
              cellSize={renderedTileSize}
              piece={piece}
              isValidTarget={isValidTarget}
              isSelectedPiece={isSelectedPiece}
              isInteractive={isInteractable}
              highlightMode={highlightMode}
              skin="transparent"
              onPress={() => handleTilePress(r, c)}
            />
          </View>,
        );
      }

      rows.push(
        <View key={`row-${displayRow}`} style={styles.row}>
          {rowCells}
        </View>,
      );
    }

    return rows;
  };

  const spawnCueSelected =
    !!spawnMove &&
    !!selectedMove &&
    spawnMove.pieceId === selectedMove.pieceId &&
    spawnMove.fromIndex === selectedMove.fromIndex &&
    spawnMove.toIndex === selectedMove.toIndex;
  const scoreCueSelected = !!selectedMove && selectedMove.toIndex === PATH_LENGTH;

  return (
    <View
      style={[styles.frame, { width: boardWidth, height: frameHeight }]}
    >
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: boardWidth,
          height: frameHeight,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Image
          source={boardImage}
          resizeMode="stretch"
          style={{
            width: isVertical ? boardWidth : frameHeight,
            height: isVertical ? frameHeight : boardWidth,
            transform: isVertical ? [] : [{ rotate: '-90deg' }, { scaleX: BOARD_IMAGE_HORIZONTAL_STRETCH }],
          }}
        />
      </View>

      <View style={styles.innerFrame}>
        <View style={styles.tileLayer}>
          <View style={styles.gridWrap}>{renderGrid()}</View>
        </View>
      </View>

      {previewSegments.length > 0 && (
        <View pointerEvents="none" style={styles.previewLayer}>
          {previewSegments.map((segment, index) => (
            <Animated.View
              key={`segment-${index}`}
              style={[
                styles.previewSegment,
                {
                  left: segment.x - segment.width / 2,
                  top: segment.y - 3,
                  width: segment.width,
                  transform: [{ rotateZ: `${segment.angle}rad` }],
                },
                previewPulseStyle,
              ]}
            />
          ))}
          {previewPoints.map((point, index) => (
            <Animated.View
              key={`point-${index}`}
              style={[
                styles.previewPoint,
                {
                  left: point.x - 7,
                  top: point.y - 7,
                },
                previewPulseStyle,
              ]}
            />
          ))}
        </View>
      )}

      {isInteractiveTurn && hasScoringMove && scoreCueAnchor && (
        <Pressable
          onPress={handleScoreCuePress}
          style={[
            styles.scoreCueTouchable,
            {
              left: scoreCueAnchor.x - scoreCueSize / 2,
              top: scoreCueAnchor.y - scoreCueSize / 2,
              width: scoreCueSize,
              height: scoreCueSize,
              borderRadius: scoreCueSize / 2,
            },
          ]}
        >
          <Animated.View
            style={[
              styles.scoreCue,
              scoreCueSelected && styles.scoreCueSelected,
              { borderRadius: scoreCueSize / 2 },
              scoreCueAnimatedStyle,
            ]}
          >
            <View
              style={[
                styles.scoreCueInner,
                {
                  width: scoreCueSize - 8,
                  height: scoreCueSize - 8,
                  borderRadius: (scoreCueSize - 8) / 2,
                },
              ]}
            >
              <Text style={styles.scoreCueText}>SCORE</Text>
            </View>
          </Animated.View>
        </Pressable>
      )}

      {spawnCueAnchor && (
        <Pressable
          onPress={handleSpawnCuePress}
          disabled={!isInteractiveTurn}
          style={[
            styles.spawnCueTouchable,
            {
              left: spawnCueAnchor.x - CUE_SIZE / 2,
              top: spawnCueAnchor.y - CUE_SIZE / 2,
            },
          ]}
        >
          <Animated.View
            style={[
              styles.spawnCue,
              spawnCueSelected && styles.spawnCueSelected,
              !isInteractiveTurn && styles.spawnCueReadonly,
              cueAnimatedStyle,
            ]}
          >
            <View style={styles.spawnCueInner}>
              <Piece
                color={spawnCueColor}
                size="sm"
                variant={spawnCueColor}
                highlight={spawnCueSelected}
                state={spawnCueSelected ? 'active' : 'idle'}
              />
            </View>
          </Animated.View>
        </Pressable>
      )}

      {showRailHints && (
        <View pointerEvents="none" style={isVertical ? styles.hintColumn : styles.hintRow}>
          <Text style={styles.hintText}>START</Text>
          <Text style={styles.hintText}>FINISH</Text>
        </View>
      )}

    </View>
  );
};

const styles = StyleSheet.create({
  frame: {
    alignSelf: 'center',
    borderRadius: urTheme.radii.lg + 6,
    padding: FRAME_PADDING,
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderColor: 'transparent',
    overflow: 'visible',
    shadowColor: '#120A05',
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  boardFrameLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  boardStoneBaseLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  boardGridLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  frameBorderTexture: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.2,
  },
  frameRimOuter: {
    ...StyleSheet.absoluteFillObject,
    margin: 2,
    borderRadius: urTheme.radii.lg + 4,
    borderWidth: 1,
    borderColor: 'rgba(240, 192, 64, 0.32)',
  },
  frameRimInner: {
    ...StyleSheet.absoluteFillObject,
    margin: 7,
    borderRadius: urTheme.radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(80, 40, 15, 0.58)',
  },
  innerFrame: {
    borderRadius: urTheme.radii.lg,
    overflow: 'visible',
    backgroundColor: 'transparent',
    padding: INNER_PADDING,
  },
  tileLayer: {
    position: 'relative',
  },
  boardTexture: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.3,
  },
  topGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '42%',
    backgroundColor: 'rgba(255, 220, 150, 0.16)',
  },
  bottomShade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '46%',
    backgroundColor: 'rgba(8, 8, 8, 0.26)',
  },
  innerStroke: {
    ...StyleSheet.absoluteFillObject,
    margin: INNER_PADDING,
    borderRadius: urTheme.radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 226, 175, 0.22)',
  },
  gridWrap: {
    gap: GRID_GAP,
  },
  row: {
    flexDirection: 'row',
    width: '100%',
  },
  cellShell: {
    aspectRatio: 1,
    padding: 0,
  },
  gapCell: {
    aspectRatio: 1,
    padding: 0,
    backgroundColor: 'transparent',
    borderRadius: 0,
    opacity: 1,
  },
  previewLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  previewSegment: {
    position: 'absolute',
    height: 6,
    borderRadius: urTheme.radii.pill,
    backgroundColor: 'rgba(111, 184, 255, 0.95)',
    shadowColor: urTheme.colors.glow,
    shadowRadius: 7,
    elevation: 6,
  },
  previewPoint: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: urTheme.radii.pill,
    backgroundColor: 'rgba(241, 230, 208, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(63, 40, 18, 0.48)',
    shadowColor: urTheme.colors.glow,
    shadowRadius: 8,
    elevation: 6,
  },
  spawnCueTouchable: {
    position: 'absolute',
    width: CUE_SIZE,
    height: CUE_SIZE,
    borderRadius: urTheme.radii.pill,
  },
  scoreCueTouchable: {
    position: 'absolute',
  },
  scoreCue: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: 'rgba(76, 244, 124, 0.92)',
    backgroundColor: 'rgba(4, 40, 18, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#38EF78',
    shadowRadius: 10,
    elevation: 8,
  },
  scoreCueSelected: {
    borderColor: 'rgba(220, 255, 228, 0.98)',
    shadowColor: '#A8FFC4',
  },
  scoreCueInner: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(8, 66, 28, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(191, 255, 206, 0.48)',
  },
  scoreCueText: {
    color: 'rgba(236, 255, 240, 0.96)',
    fontSize: 10,
    letterSpacing: 0.7,
    fontWeight: '800',
  },
  spawnCue: {
    flex: 1,
    borderRadius: urTheme.radii.pill,
    borderWidth: 1.5,
    borderColor: 'rgba(111, 184, 255, 0.84)',
    backgroundColor: 'rgba(11, 24, 37, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: urTheme.colors.glow,
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 7,
  },
  spawnCueReadonly: {
    borderColor: 'rgba(206, 172, 112, 0.58)',
    backgroundColor: 'rgba(40, 31, 19, 0.76)',
  },
  spawnCueSelected: {
    borderColor: 'rgba(245, 214, 149, 0.95)',
    shadowColor: '#F5D695',
  },
  spawnCueInner: {
    width: 42,
    height: 42,
    borderRadius: urTheme.radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 27, 39, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255, 229, 183, 0.28)',
  },
  hintRow: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  hintColumn: {
    position: 'absolute',
    top: 14,
    bottom: 14,
    right: 8,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hintText: {
    color: 'rgba(248, 229, 198, 0.85)',
    fontSize: 10,
    letterSpacing: 1,
    fontWeight: '700',
  },
});
