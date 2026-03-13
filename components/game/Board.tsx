import { boxShadow } from '@/constants/styleEffects';
import { urTheme } from '@/constants/urTheme';
import { BOARD_COLS, BOARD_ROWS, PATH_DARK, PATH_LENGTH, PATH_LIGHT } from '@/logic/constants';
import { GameState, MoveAction, PlayerColor } from '@/logic/types';
import { useGameStore } from '@/store/useGameStore';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Image,
  LayoutAnimation,
  LayoutChangeEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  UIManager,
  useWindowDimensions,
  View,
} from 'react-native';
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

export const BOARD_IMAGE_SOURCE = require('../../assets/board/board_design.png');

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface BoardProps {
  showRailHints?: boolean;
  highlightMode?: 'subtle' | 'theatrical';
  boardScale?: number;
  orientation?: BoardOrientation;
  gameStateOverride?: GameState;
  validMovesOverride?: MoveAction[];
  onMakeMoveOverride?: (move: MoveAction) => void;
  playerColorOverride?: PlayerColor | null;
  allowInteraction?: boolean;
  onBoardImageLayout?: (layout: BoardImageLayoutFrame) => void;
}

interface Point {
  x: number;
  y: number;
}

interface BoardRenderLayout {
  cellSize: number;
  gridWidth: number;
  gridHeight: number;
  frameWidth: number;
  frameHeight: number;
  innerGridLeft: number;
  innerGridTop: number;
}

interface BoardArtImageLayout {
  width: number;
  height: number;
  left: number;
  top: number;
  rotate?: '-90deg';
}

export interface BoardImageLayoutFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface BoardArtAlignmentConfig {
  offsetX: number;
  offsetY: number;
  scale: number;
  insetTop: number;
  insetRight: number;
  insetBottom: number;
  insetLeft: number;
}

export type BoardOrientation = 'horizontal' | 'vertical';

const FRAME_PADDING = urTheme.spacing.sm;
const INNER_PADDING = urTheme.spacing.xs;
const GRID_GAP = 0;
const SPAWN_CUE_MIN_SIZE = 48;
const SCORE_CUE_MIN_SIZE = 44;
const SCORE_CUE_MAX_SIZE = 58;
const MIN_TILE_SHELL_PADDING = 2;
// Controls how much of each tile the on-board piece art occupies.
const BOARD_PIECE_TILE_COVERAGE = 0.86;
const SHOW_BOARD_ALIGNMENT_DEBUG = false;

interface BoardPiecePixelSizeOptions {
  viewportWidth: number;
  boardScale?: number;
  orientation?: BoardOrientation;
}

export const getBoardPiecePixelSize = ({
  viewportWidth,
  boardScale = 1,
  orientation = 'horizontal',
}: BoardPiecePixelSizeOptions): number => {
  const displayCols = orientation === 'vertical' ? BOARD_ROWS : BOARD_COLS;
  const boardWidth = Math.min(viewportWidth - urTheme.spacing.lg, urTheme.layout.boardMax) * boardScale;
  const gridWidth = boardWidth - FRAME_PADDING * 2 - INNER_PADDING * 2;
  const cellSize = gridWidth / displayCols;
  const tileShellPadding = Math.max(MIN_TILE_SHELL_PADDING, Math.round(cellSize * 0.04));
  const renderedTileSize = Math.max(18, Math.round(cellSize - tileShellPadding * 2));
  return Math.max(14, Math.round(renderedTileSize * BOARD_PIECE_TILE_COVERAGE));
};

// Gameplay geometry is canonical; adjust this object if the PNG asset changes.
const BOARD_ART_ALIGNMENT: BoardArtAlignmentConfig = {
  offsetX: 0,
  offsetY: 0,
  scale: 1,
  insetTop: 0.024,
  insetRight: 0.385,
  // Extend artwork down a touch so last-row side tiles align with gameplay hitboxes/glow.
  insetBottom: 0.018,
  insetLeft: 0.36,
};

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
  onBoardImageLayout,
}) => {
  const storeGameState = useGameStore((state) => state.gameState);
  const storeValidMoves = useGameStore((state) => state.validMoves);
  const storeMakeMove = useGameStore((state) => state.makeMove);
  const storePlayerColor = useGameStore((state) => state.playerColor);
  const { width } = useWindowDimensions();
  const [selectedMove, setSelectedMove] = useState<MoveAction | null>(null);
  const [hoveredMove, setHoveredMove] = useState<MoveAction | null>(null);

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

  // Gameplay coordinates derive from this layout and remain the source of truth.
  const boardLayout = useMemo<BoardRenderLayout>(() => {
    const frameWidth = boardWidth;
    const innerGridLeft = FRAME_PADDING + INNER_PADDING;
    const innerGridTop = FRAME_PADDING + INNER_PADDING;
    const gridWidth = frameWidth - FRAME_PADDING * 2 - INNER_PADDING * 2;
    const cellSize = gridWidth / displayCols;
    const gridHeight = cellSize * displayRows + GRID_GAP * Math.max(0, displayRows - 1);
    const frameHeight = FRAME_PADDING * 2 + INNER_PADDING * 2 + gridHeight;

    return {
      cellSize,
      gridWidth,
      gridHeight,
      frameWidth,
      frameHeight,
      innerGridLeft,
      innerGridTop,
    };
  }, [boardWidth, displayCols, displayRows]);

  const tileShellPadding = useMemo(
    () => Math.max(MIN_TILE_SHELL_PADDING, Math.round(boardLayout.cellSize * 0.04)),
    [boardLayout.cellSize],
  );
  const renderedTileSize = useMemo(
    () => Math.max(18, Math.round(boardLayout.cellSize - tileShellPadding * 2)),
    [boardLayout.cellSize, tileShellPadding],
  );
  // On-board PNG size is derived from board/tile geometry, not fixed presets.
  const boardPiecePixelSize = useMemo(
    () => Math.max(14, Math.round(renderedTileSize * BOARD_PIECE_TILE_COVERAGE)),
    [renderedTileSize],
  );
  const spawnCueSize = useMemo(
    () => Math.max(SPAWN_CUE_MIN_SIZE, Math.round(boardPiecePixelSize * 1.08)),
    [boardPiecePixelSize],
  );
  const spawnCueOffsetDistance = useMemo(
    () =>
      boardLayout.cellSize / 2 +
      spawnCueSize / 2 +
      Math.max(8, Math.round(boardLayout.cellSize * 0.08)),
    [boardLayout.cellSize, spawnCueSize],
  );

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

  const isGapCell = (r: number, c: number) => (r === 0 || r === 2) && (c === 4 || c === 5);

  const mapIndexToCoord = (color: 'light' | 'dark', index: number, r: number, c: number) => {
    const path = color === 'light' ? PATH_LIGHT : PATH_DARK;
    const coord = path[index];
    if (!coord) return false;
    return coord.row === r && coord.col === c;
  };

  const getCellCenter = (r: number, c: number): Point => ({
    x: (() => {
      const displayCoord = mapLogicalToDisplayCoord(r, c);
      return (
        boardLayout.innerGridLeft +
        displayCoord.col * (boardLayout.cellSize + GRID_GAP) +
        boardLayout.cellSize / 2
      );
    })(),
    y: (() => {
      const displayCoord = mapLogicalToDisplayCoord(r, c);
      return (
        boardLayout.innerGridTop +
        displayCoord.row * (boardLayout.cellSize + GRID_GAP) +
        boardLayout.cellSize / 2
      );
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
      const reserveOffset = projectLogicalOffset(spawnCueOffsetDistance, 0);
      return {
        x: startCenter.x + reserveOffset.x,
        y: startCenter.y + reserveOffset.y,
      };
    }

    if (index === PATH_LENGTH) {
      const finalCenter = getCellCenter(path[path.length - 1].row, path[path.length - 1].col);
      const finishOffset = projectLogicalOffset(boardLayout.cellSize * 0.95, 0);
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
  const scoreCueSize = Math.round(
    Math.min(Math.max(boardLayout.cellSize * 0.92, SCORE_CUE_MIN_SIZE), SCORE_CUE_MAX_SIZE),
  );

  const spawnCueAnchor = spawnMove
    ? (() => {
      const start = spawnCueColor === 'light' ? PATH_LIGHT[0] : PATH_DARK[0];
      const startCenter = getCellCenter(start.row, start.col);
      const spawnOffset = projectLogicalOffset(spawnCueOffsetDistance, 0);
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

  const previewMove = selectedMove ?? hoveredMove;

  const previewPoints = (() => {
    if (!previewMove) return [] as Point[];

    const color: 'light' | 'dark' = previewMove.pieceId.startsWith('dark') ? 'dark' : 'light';
    const points: Point[] = [];

    if (previewMove.fromIndex === -1) {
      const reservePoint = coordForPathIndex(color, -1);
      if (reservePoint) {
        points.push(reservePoint);
      }
      for (let index = 0; index <= Math.min(previewMove.toIndex, PATH_LENGTH - 1); index += 1) {
        const point = coordForPathIndex(color, index);
        if (point) {
          points.push(point);
        }
      }
    } else {
      const startPoint = coordForPathIndex(color, previewMove.fromIndex);
      if (startPoint) {
        points.push(startPoint);
      }
      for (
        let index = previewMove.fromIndex + 1;
        index <= Math.min(previewMove.toIndex, PATH_LENGTH - 1);
        index += 1
      ) {
        const point = coordForPathIndex(color, index);
        if (point) {
          points.push(point);
        }
      }
    }

    if (previewMove.toIndex === PATH_LENGTH) {
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

  const boardArtLayout = useMemo<BoardArtImageLayout>(() => {
    // Fit artwork from gameplay grid measurements so visuals follow interaction geometry.
    const cropWidthRatio = Math.max(0.01, 1 - BOARD_ART_ALIGNMENT.insetLeft - BOARD_ART_ALIGNMENT.insetRight);
    const cropHeightRatio = Math.max(0.01, 1 - BOARD_ART_ALIGNMENT.insetTop - BOARD_ART_ALIGNMENT.insetBottom);
    const baseWidth = boardLayout.gridWidth / cropWidthRatio;
    const baseHeight = boardLayout.gridHeight / cropHeightRatio;
    const scaledWidth = baseWidth * BOARD_ART_ALIGNMENT.scale;
    const scaledHeight = baseHeight * BOARD_ART_ALIGNMENT.scale;
    const baseLeft = boardLayout.innerGridLeft - BOARD_ART_ALIGNMENT.insetLeft * baseWidth;
    const baseTop = boardLayout.innerGridTop - BOARD_ART_ALIGNMENT.insetTop * baseHeight;
    const centeredLeft = baseLeft - (scaledWidth - baseWidth) / 2 + BOARD_ART_ALIGNMENT.offsetX;
    const centeredTop = baseTop - (scaledHeight - baseHeight) / 2 + BOARD_ART_ALIGNMENT.offsetY;

    if (isVertical) {
      return {
        width: scaledWidth,
        height: scaledHeight,
        left: centeredLeft,
        top: centeredTop,
      };
    }

    const horizontalBaseWidth = boardLayout.frameHeight;
    const horizontalBaseHeight = boardLayout.frameWidth;
    const horizontalWidth = horizontalBaseWidth * BOARD_ART_ALIGNMENT.scale;
    const horizontalHeight = horizontalBaseHeight * BOARD_ART_ALIGNMENT.scale;

    return {
      width: horizontalWidth,
      height: horizontalHeight,
      left:
        (boardLayout.frameWidth - horizontalBaseWidth) / 2 -
        (horizontalWidth - horizontalBaseWidth) / 2 +
        BOARD_ART_ALIGNMENT.offsetX,
      top:
        (boardLayout.frameHeight - horizontalBaseHeight) / 2 -
        (horizontalHeight - horizontalBaseHeight) / 2 +
        BOARD_ART_ALIGNMENT.offsetY,
      rotate: '-90deg',
    };
  }, [boardLayout, isVertical]);

  const debugPlayableCells = (() => {
    const cells: { key: string; left: number; top: number; centerX: number; centerY: number }[] = [];

    for (let displayRow = 0; displayRow < displayRows; displayRow += 1) {
      for (let displayCol = 0; displayCol < displayCols; displayCol += 1) {
        const { row: r, col: c } = mapDisplayToLogicalCoord(displayRow, displayCol);
        if (isGapCell(r, c)) {
          continue;
        }

        const left = boardLayout.innerGridLeft + displayCol * (boardLayout.cellSize + GRID_GAP);
        const top = boardLayout.innerGridTop + displayRow * (boardLayout.cellSize + GRID_GAP);

        cells.push({
          key: `${displayRow}-${displayCol}`,
          left,
          top,
          centerX: left + boardLayout.cellSize / 2,
          centerY: top + boardLayout.cellSize / 2,
        });
      }
    }

    return cells;
  })();

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
    if (!previewMove) {
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
  }, [previewMove, previewPulse]);

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
    if (!hoveredMove) return;

    if (!isInteractiveTurn || gameState.phase !== 'moving') {
      setHoveredMove(null);
      return;
    }

    const stillValid = validMoves.some(
      (move) =>
        move.pieceId === hoveredMove.pieceId &&
        move.fromIndex === hoveredMove.fromIndex &&
        move.toIndex === hoveredMove.toIndex,
    );

    if (!stillValid) {
      setHoveredMove(null);
    }
  }, [gameState.phase, hoveredMove, isInteractiveTurn, validMoves]);

  useEffect(() => {
    setSelectedMove(null);
    setHoveredMove(null);
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
    setHoveredMove(null);
  };

  const handleSpawnCuePress = () => {
    if (!spawnMove || !isInteractiveTurn || gameState.phase !== 'moving') return;
    setHoveredMove(null);

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

  const handleSpawnCueHoverIn = () => {
    if (!spawnMove || !isInteractiveTurn || gameState.phase !== 'moving' || !!selectedMove) return;
    setHoveredMove(spawnMove);
  };

  const handleSpawnCueHoverOut = () => {
    if (!spawnMove) return;
    setHoveredMove((current) => {
      if (!current) return null;
      if (
        current.pieceId === spawnMove.pieceId &&
        current.fromIndex === spawnMove.fromIndex &&
        current.toIndex === spawnMove.toIndex
      ) {
        return null;
      }
      return current;
    });
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
      setHoveredMove(null);
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
    setHoveredMove(null);
  };

  const handleTileHoverIn = (moveFromTile?: MoveAction) => {
    if (!moveFromTile || !isInteractiveTurn || gameState.phase !== 'moving' || !!selectedMove) return;
    setHoveredMove(moveFromTile);
  };

  const handleTileHoverOut = (moveFromTile?: MoveAction) => {
    if (!moveFromTile) return;
    setHoveredMove((current) => {
      if (!current) return null;
      if (
        current.pieceId === moveFromTile.pieceId &&
        current.fromIndex === moveFromTile.fromIndex &&
        current.toIndex === moveFromTile.toIndex
      ) {
        return null;
      }
      return current;
    });
  };

  const cueAnimatedStyle = useAnimatedStyle(() => ({
    opacity: 0.3 + cuePulse.value * 0.7,
    transform: [{ scale: 0.94 + cuePulse.value * 0.14 }],
  }));

  const scoreCueAnimatedStyle = useAnimatedStyle(() => ({
    opacity: 0.48 + scoreCuePulse.value * 0.52,
    transform: [{ scale: 0.94 + scoreCuePulse.value * 0.12 }],
  }));

  const previewPulseStyle = useAnimatedStyle(() => ({
    opacity: 0.28 + previewPulse.value * 0.64,
  }));

  const renderGrid = () => {
    const rows = [];

    for (let displayRow = 0; displayRow < displayRows; displayRow += 1) {
      const rowCells = [];

      for (let displayCol = 0; displayCol < displayCols; displayCol += 1) {
        const { row: r, col: c } = mapDisplayToLogicalCoord(displayRow, displayCol);
        const isGap = isGapCell(r, c);
        if (isGap) {
          rowCells.push(
            <View
              key={`gap-${displayRow}-${displayCol}`}
              style={[
                styles.gapCell,
                {
                  width: boardLayout.cellSize,
                  height: boardLayout.cellSize,
                  padding: tileShellPadding,
                },
              ]}
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
            style={[
              styles.cellShell,
              {
                width: boardLayout.cellSize,
                height: boardLayout.cellSize,
                padding: tileShellPadding,
              },
            ]}
          >
            <Tile
              row={r}
              col={c}
              cellSize={renderedTileSize}
              piecePixelSize={boardPiecePixelSize}
              piece={piece}
              isValidTarget={isValidTarget}
              isSelectedPiece={isSelectedPiece}
              isInteractive={isInteractable}
              highlightMode={highlightMode}
              skin="transparent"
              onPress={() => handleTilePress(r, c)}
              onHoverIn={() => handleTileHoverIn(moveFromTile)}
              onHoverOut={() => handleTileHoverOut(moveFromTile)}
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

  const handleBoardImageLayout = (event: LayoutChangeEvent) => {
    if (!onBoardImageLayout) return;

    const { x, y, width, height } = event.nativeEvent.layout;
    onBoardImageLayout({ x, y, width, height });
  };

  return (
    <View
      style={[styles.frame, { width: boardLayout.frameWidth, height: boardLayout.frameHeight }]}
    >
      <View pointerEvents="none" style={styles.boardArtLayer}>
        <Image
          source={BOARD_IMAGE_SOURCE}
          onLayout={handleBoardImageLayout}
          resizeMode="stretch"
          style={[
            styles.boardArtImage,
            {
              width: boardArtLayout.width,
              height: boardArtLayout.height,
              left: boardArtLayout.left,
              top: boardArtLayout.top,
              transform: boardArtLayout.rotate ? [{ rotate: boardArtLayout.rotate }] : undefined,
            },
          ]}
        />
      </View>

      {SHOW_BOARD_ALIGNMENT_DEBUG && (
        <View pointerEvents="none" style={styles.boardDebugOverlay}>
          <View
            style={[
              styles.debugFrameBounds,
              { width: boardLayout.frameWidth, height: boardLayout.frameHeight },
            ]}
          />
          <View
            style={[
              styles.debugGridBounds,
              {
                left: boardLayout.innerGridLeft,
                top: boardLayout.innerGridTop,
                width: boardLayout.gridWidth,
                height: boardLayout.gridHeight,
              },
            ]}
          />
          {debugPlayableCells.map((cell) => (
            <React.Fragment key={`debug-cell-${cell.key}`}>
              <View
                style={[
                  styles.debugCellBounds,
                  {
                    left: cell.left,
                    top: cell.top,
                    width: boardLayout.cellSize,
                    height: boardLayout.cellSize,
                  },
                ]}
              />
              <View
                style={[
                  styles.debugCellCenter,
                  {
                    left: cell.centerX - 2,
                    top: cell.centerY - 2,
                  },
                ]}
              />
            </React.Fragment>
          ))}
        </View>
      )}

      <View style={styles.innerFrame}>
        <View style={styles.tileLayer}>
          <View style={[styles.gridWrap, { width: boardLayout.gridWidth, height: boardLayout.gridHeight }]}>
            {renderGrid()}
          </View>
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
          onHoverIn={handleSpawnCueHoverIn}
          onHoverOut={handleSpawnCueHoverOut}
          disabled={!isInteractiveTurn}
          style={[
            styles.spawnCueTouchable,
            {
              left: spawnCueAnchor.x - spawnCueSize / 2,
              top: spawnCueAnchor.y - spawnCueSize / 2,
              width: spawnCueSize,
              height: spawnCueSize,
              borderRadius: spawnCueSize / 2,
            },
          ]}
        >
          <Animated.View
            style={[
              styles.spawnCue,
              spawnCueSelected && styles.spawnCueSelected,
              !isInteractiveTurn && styles.spawnCueReadonly,
              { borderRadius: spawnCueSize / 2 },
              cueAnimatedStyle,
            ]}
          >
            <Piece
              color={spawnCueColor}
              pixelSize={boardPiecePixelSize}
              variant={spawnCueColor}
              highlight={spawnCueSelected}
              state={spawnCueSelected ? 'active' : 'idle'}
            />
          </Animated.View>
        </Pressable>
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
  },
  boardArtLayer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: urTheme.radii.lg + 6,
    // Allow decorative border bleed for wider board templates (e.g. Greece variants).
    overflow: 'visible',
  },
  boardArtImage: {
    position: 'absolute',
  },
  boardDebugOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  debugFrameBounds: {
    position: 'absolute',
    left: 0,
    top: 0,
    borderWidth: 1,
    borderColor: 'rgba(255, 82, 82, 0.9)',
  },
  debugGridBounds: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(78, 255, 180, 0.95)',
  },
  debugCellBounds: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(103, 177, 255, 0.78)',
  },
  debugCellCenter: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 243, 167, 0.96)',
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
    ...boxShadow({
      color: urTheme.colors.glow,
      opacity: 0.36,
      blurRadius: 7,
      elevation: 6,
    }),
  },
  previewPoint: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: urTheme.radii.pill,
    backgroundColor: 'rgba(241, 230, 208, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(63, 40, 18, 0.48)',
    ...boxShadow({
      color: urTheme.colors.glow,
      opacity: 0.4,
      blurRadius: 8,
      elevation: 6,
    }),
  },
  spawnCueTouchable: {
    position: 'absolute',
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
    ...boxShadow({
      color: '#38EF78',
      opacity: 0.42,
      blurRadius: 10,
      elevation: 8,
    }),
  },
  scoreCueSelected: {
    borderColor: 'rgba(220, 255, 228, 0.98)',
    ...boxShadow({
      color: '#A8FFC4',
      opacity: 0.5,
      blurRadius: 10,
      elevation: 8,
    }),
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
    justifyContent: 'center',
    alignItems: 'center',
    ...boxShadow({
      color: urTheme.colors.glow,
      opacity: 0.22,
      blurRadius: 8,
      elevation: 7,
    }),
  },
  spawnCueReadonly: {
    opacity: 0.8,
  },
  spawnCueSelected: {
    ...boxShadow({
      color: '#F5D695',
      opacity: 0.34,
      blurRadius: 8,
      elevation: 7,
    }),
  },
});
