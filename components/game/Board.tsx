import { boxShadow } from '@/constants/styleEffects';
import { urTheme } from '@/constants/urTheme';
import { BOARD_COLS, BOARD_ROWS } from '@/logic/constants';
import { getPathVariantDefinition } from '@/logic/pathVariants';
import { Coordinates, GameState, MoveAction, PlayerColor } from '@/logic/types';
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
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { PIECE_ART_VISIBLE_COVERAGE, Piece } from './Piece';
import { Tile } from './Tile';

export const BOARD_IMAGE_SOURCE = require('../../assets/board/board_design.png');

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface BoardProps {
  showRailHints?: boolean;
  autoMoveHintEnabled?: boolean;
  highlightMode?: 'subtle' | 'theatrical';
  boardScale?: number;
  orientation?: BoardOrientation;
  gameStateOverride?: GameState;
  validMovesOverride?: MoveAction[];
  onMakeMoveOverride?: (move: MoveAction) => void;
  playerColorOverride?: PlayerColor | null;
  allowInteraction?: boolean;
  freezeMotion?: boolean;
  onInteraction?: () => void;
  onBoardImageLayout?: (layout: BoardImageLayoutFrame) => void;
}

interface Point {
  x: number;
  y: number;
}

type PreviewTone = 'valid' | 'blocked';

interface PreviewState {
  color: 'light' | 'dark';
  fromIndex: number;
  pieceId: string;
  toIndex: number;
  tone: PreviewTone;
}

interface BoardOccupant {
  color: 'light' | 'dark';
  id: string;
  position: number;
}

interface AnimatedBoardMove {
  capturedPiece: {
    color: 'light' | 'dark';
    id: string;
  } | null;
  color: 'light' | 'dark';
  cumulativeDistances: number[];
  durationMs: number;
  isCaptureMove: boolean;
  isScoringMove: boolean;
  pieceId: string;
  points: Point[];
  totalDistance: number;
}

interface BoardTileLandingOffsetOptions {
  cellSize: number;
  col: number;
  orientation?: BoardOrientation;
  row: number;
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
const BOARD_PIECE_VISIBLE_TILE_COVERAGE = 0.75;
const BOARD_PIECE_ART_SCALE = BOARD_PIECE_VISIBLE_TILE_COVERAGE / PIECE_ART_VISIBLE_COVERAGE;
const BOARD_PIECE_ART_OFFSET_Y_RATIO = 0.02;
const MOVE_SLIDE_MIN_DURATION_MS = 240;
const MOVE_SLIDE_BASE_DURATION_MS = 150;
const MOVE_SLIDE_STEP_DURATION_MS = 110;
const MOVE_SLIDE_MAX_DURATION_MS = 640;
const SHOW_BOARD_ALIGNMENT_DEBUG = false;
const VERTICAL_BOARD_ROW_LANDING_OFFSET_Y_RATIOS = [
  0.008,
  0.014,
  0.02,
  0.026,
  0.03,
  0.018,
  0.002,
  -0.03,
] as const;
const VERTICAL_BOARD_COLUMN_LANDING_OFFSET_X_RATIOS = [
  0.008,
  0,
  -0.008,
] as const;

interface BoardPiecePixelSizeOptions {
  viewportWidth: number;
  boardScale?: number;
  orientation?: BoardOrientation;
}

export interface BoardPieceRenderMetrics {
  pixelSize: number;
  artScale: number;
  artOffsetY: number;
}

export const getBoardPieceRenderMetrics = ({
  viewportWidth,
  boardScale = 1,
  orientation = 'horizontal',
}: BoardPiecePixelSizeOptions): BoardPieceRenderMetrics => {
  const displayCols = orientation === 'vertical' ? BOARD_ROWS : BOARD_COLS;
  const boardWidth = Math.min(viewportWidth - urTheme.spacing.lg, urTheme.layout.boardMax) * boardScale;
  const gridWidth = boardWidth - FRAME_PADDING * 2 - INNER_PADDING * 2;
  const cellSize = gridWidth / displayCols;
  const tileShellPadding = Math.max(MIN_TILE_SHELL_PADDING, Math.round(cellSize * 0.04));
  const pixelSize = Math.max(18, Math.round(cellSize - tileShellPadding * 2));

  return {
    pixelSize,
    artScale: BOARD_PIECE_ART_SCALE,
    artOffsetY: Math.round(pixelSize * BOARD_PIECE_ART_SCALE * BOARD_PIECE_ART_OFFSET_Y_RATIO * 100) / 100,
  };
};

export const getBoardPiecePixelSize = (options: BoardPiecePixelSizeOptions): number =>
  getBoardPieceRenderMetrics(options).pixelSize;

export const getBoardTileLandingOffset = ({
  cellSize,
  col,
  orientation = 'horizontal',
  row,
}: BoardTileLandingOffsetOptions): Point => {
  if (orientation !== 'vertical') {
    return { x: 0, y: 0 };
  }

  const displayRow = col;
  const displayCol = BOARD_ROWS - 1 - row;
  const xRatio = VERTICAL_BOARD_COLUMN_LANDING_OFFSET_X_RATIOS[displayCol] ?? 0;
  const yRatio = VERTICAL_BOARD_ROW_LANDING_OFFSET_Y_RATIOS[displayRow] ?? 0;

  return {
    x: Math.round(cellSize * xRatio * 100) / 100,
    y: Math.round(cellSize * yRatio * 100) / 100,
  };
};

export const getBoardScoreExitLogicalCoord = (path: readonly Coordinates[]): Coordinates | null => {
  const finalCoord = path[path.length - 1];

  if (!finalCoord) {
    return null;
  }

  const previousCoord = path[path.length - 2];

  if (!previousCoord) {
    return {
      row: finalCoord.row,
      col: finalCoord.col - 1,
    };
  }

  return {
    row: finalCoord.row + (finalCoord.row - previousCoord.row),
    col: finalCoord.col + (finalCoord.col - previousCoord.col),
  };
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

const areMovesEqual = (
  first: MoveAction | null | undefined,
  second: MoveAction | null | undefined,
) =>
  !!first &&
  !!second &&
  first.pieceId === second.pieceId &&
  first.fromIndex === second.fromIndex &&
  first.toIndex === second.toIndex;

export const Board: React.FC<BoardProps> = ({
  showRailHints = false,
  autoMoveHintEnabled = false,
  highlightMode = 'theatrical',
  boardScale = 1,
  orientation = 'horizontal',
  gameStateOverride,
  validMovesOverride,
  onMakeMoveOverride,
  playerColorOverride,
  allowInteraction = true,
  freezeMotion = false,
  onInteraction,
  onBoardImageLayout,
}) => {
  const storeGameState = useGameStore((state) => state.gameState);
  const storeValidMoves = useGameStore((state) => state.validMoves);
  const storeMakeMove = useGameStore((state) => state.makeMove);
  const storePlayerColor = useGameStore((state) => state.playerColor);
  const { width } = useWindowDimensions();
  const [selectedMove, setSelectedMove] = useState<MoveAction | null>(null);
  const [hoveredMove, setHoveredMove] = useState<MoveAction | null>(null);
  const [blockedPreview, setBlockedPreview] = useState<PreviewState | null>(null);
  const [animatedMove, setAnimatedMove] = useState<AnimatedBoardMove | null>(null);

  const cuePulse = useSharedValue(0);
  const scoreCuePulse = useSharedValue(0);
  const previewPulse = useSharedValue(0);
  const movingPieceProgress = useSharedValue(0);
  const movingPieceLift = useSharedValue(0);
  const movingPieceImpact = useSharedValue(0);
  const movingPieceLanding = useSharedValue(0);
  const capturedPieceCrush = useSharedValue(0);

  const gameState = gameStateOverride ?? storeGameState;
  const validMoves = validMovesOverride ?? storeValidMoves;
  const makeMove = onMakeMoveOverride ?? storeMakeMove;
  const playerColor = playerColorOverride ?? storePlayerColor;
  const notifyInteraction = React.useCallback(() => {
    onInteraction?.();
  }, [onInteraction]);
  const clearAnimatedMove = React.useCallback(() => {
    setAnimatedMove(null);
  }, []);
  const isVertical = orientation === 'vertical';
  const displayRows = isVertical ? BOARD_COLS : BOARD_ROWS;
  const displayCols = isVertical ? BOARD_ROWS : BOARD_COLS;
  const pathDefinition = useMemo(
    () => getPathVariantDefinition(gameState.matchConfig.pathVariant),
    [gameState.matchConfig.pathVariant],
  );
  const pathLength = pathDefinition.pathLength;
  const previousGameStateRef = React.useRef<GameState | null>(null);
  const getPathForColor = React.useCallback(
    (color: 'light' | 'dark') => (color === 'light' ? pathDefinition.light : pathDefinition.dark),
    [pathDefinition.dark, pathDefinition.light],
  );

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
  const boardPieceRenderMetrics = useMemo(
    () => getBoardPieceRenderMetrics({ viewportWidth: width, boardScale, orientation }),
    [boardScale, orientation, width],
  );
  const boardPiecePixelSize = boardPieceRenderMetrics.pixelSize;
  const boardPieceArtScale = boardPieceRenderMetrics.artScale;
  const boardPieceArtOffsetY = boardPieceRenderMetrics.artOffsetY;
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

  const mapLogicalToDisplayCoord = React.useCallback((r: number, c: number): { row: number; col: number } => {
    if (!isVertical) {
      return { row: r, col: c };
    }

    return {
      row: c,
      col: BOARD_ROWS - 1 - r,
    };
  }, [isVertical]);

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
    const path = getPathForColor(color);
    const coord = path[index];
    if (!coord) return false;
    return coord.row === r && coord.col === c;
  };

  const getCellCenter = React.useCallback((r: number, c: number): Point => {
    const displayCoord = mapLogicalToDisplayCoord(r, c);
    const landingOffset = getBoardTileLandingOffset({
      cellSize: renderedTileSize,
      col: c,
      orientation,
      row: r,
    });

    return {
      x:
        boardLayout.innerGridLeft +
        displayCoord.col * (boardLayout.cellSize + GRID_GAP) +
        boardLayout.cellSize / 2 +
        landingOffset.x,
      y:
        boardLayout.innerGridTop +
        displayCoord.row * (boardLayout.cellSize + GRID_GAP) +
        boardLayout.cellSize / 2 +
        landingOffset.y,
    };
  }, [
    boardLayout.cellSize,
    boardLayout.innerGridLeft,
    boardLayout.innerGridTop,
    mapLogicalToDisplayCoord,
    orientation,
    renderedTileSize,
  ]);

  const projectLogicalOffset = React.useCallback((x: number, y: number): Point => {
    if (!isVertical) {
      return { x, y };
    }

    return {
      x: -y,
      y: x,
    };
  }, [isVertical]);

  const coordForPathIndex = React.useCallback((color: 'light' | 'dark', index: number): Point | null => {
    const path = getPathForColor(color);

    if (index === -1) {
      const startCenter = getCellCenter(path[0].row, path[0].col);
      const reserveOffset = projectLogicalOffset(spawnCueOffsetDistance, 0);
      return {
        x: startCenter.x + reserveOffset.x,
        y: startCenter.y + reserveOffset.y,
      };
    }

    if (index === pathLength) {
      const scoreExitCoord = getBoardScoreExitLogicalCoord(path);

      if (!scoreExitCoord) {
        return null;
      }

      return getCellCenter(scoreExitCoord.row, scoreExitCoord.col);
    }

    const coord = path[index];
    if (!coord) return null;
    return getCellCenter(coord.row, coord.col);
  }, [
    boardLayout.cellSize,
    getCellCenter,
    getPathForColor,
    pathLength,
    projectLogicalOffset,
    spawnCueOffsetDistance,
  ]);

  const buildPathPoints = React.useCallback(
    (color: 'light' | 'dark', fromIndex: number, toIndex: number): Point[] => {
      const points: Point[] = [];
      const cappedToIndex = Math.min(toIndex, pathLength);

      if (fromIndex === -1) {
        const reservePoint = coordForPathIndex(color, -1);
        if (reservePoint) {
          points.push(reservePoint);
        }

        for (let index = 0; index <= Math.min(cappedToIndex, pathLength - 1); index += 1) {
          const point = coordForPathIndex(color, index);
          if (point) {
            points.push(point);
          }
        }
      } else {
        const startPoint = coordForPathIndex(color, fromIndex);
        if (startPoint) {
          points.push(startPoint);
        }

        for (let index = fromIndex + 1; index <= Math.min(cappedToIndex, pathLength - 1); index += 1) {
          const point = coordForPathIndex(color, index);
          if (point) {
            points.push(point);
          }
        }
      }

      if (cappedToIndex === pathLength) {
        const finishPoint = coordForPathIndex(color, pathLength);
        if (finishPoint) {
          points.push(finishPoint);
        }
      }

      return points;
    },
    [coordForPathIndex, pathLength],
  );

  const buildAnimatedMove = React.useCallback(
    (
      color: 'light' | 'dark',
      pieceId: string,
      fromIndex: number,
      toIndex: number,
      capturedPiece: AnimatedBoardMove['capturedPiece'] = null,
    ): AnimatedBoardMove | null => {
      const points = buildPathPoints(color, fromIndex, toIndex);
      if (points.length < 2) {
        return null;
      }

      let totalDistance = 0;
      const cumulativeDistances = [0];

      for (let index = 1; index < points.length; index += 1) {
        const previous = points[index - 1];
        const current = points[index];
        totalDistance += Math.hypot(current.x - previous.x, current.y - previous.y);
        cumulativeDistances.push(totalDistance);
      }

      return {
        capturedPiece,
        color,
        cumulativeDistances,
        durationMs: Math.min(
          MOVE_SLIDE_MAX_DURATION_MS,
          Math.max(
            MOVE_SLIDE_MIN_DURATION_MS,
            MOVE_SLIDE_BASE_DURATION_MS + (points.length - 1) * MOVE_SLIDE_STEP_DURATION_MS,
          ),
        ),
        isCaptureMove: capturedPiece !== null,
        isScoringMove: toIndex === pathLength,
        pieceId,
        points,
        totalDistance,
      };
    },
    [buildPathPoints],
  );

  const getPieceAt = (r: number, c: number): BoardOccupant | undefined => {
    const lightPiece = gameState.light.pieces.find(
      (piece) =>
        !piece.isFinished && piece.position !== -1 && mapIndexToCoord('light', piece.position, r, c),
    );
    if (lightPiece) return { id: lightPiece.id, color: 'light', position: lightPiece.position };

    const darkPiece = gameState.dark.pieces.find(
      (piece) => !piece.isFinished && piece.position !== -1 && mapIndexToCoord('dark', piece.position, r, c),
    );
    if (darkPiece) return { id: darkPiece.id, color: 'dark', position: darkPiece.position };

    return undefined;
  };

  const assignedPlayerColor: 'light' | 'dark' | null = playerColor === 'light' || playerColor === 'dark'
    ? playerColor
    : null;

  const mapAssignedIndexToCoord = (index: number, r: number, c: number) =>
    assignedPlayerColor ? mapIndexToCoord(assignedPlayerColor, index, r, c) : false;

  const isMyTurn = assignedPlayerColor !== null && gameState.currentTurn === assignedPlayerColor;
  const isInteractiveTurn = !freezeMotion && allowInteraction && isMyTurn;

  const spawnMove = useMemo(
    () => validMoves.find((move) => move.fromIndex === -1) ?? null,
    [validMoves],
  );
  const scoringMoves = useMemo(() => validMoves.filter((move) => move.toIndex === pathLength), [pathLength, validMoves]);
  const suggestedMove = useMemo(() => {
    if (!autoMoveHintEnabled || !isInteractiveTurn || gameState.phase !== 'moving' || validMoves.length === 0) {
      return null;
    }

    return [...validMoves].sort((left, right) => {
      const leftUsesBoardPiece = left.fromIndex >= 0 ? 1 : 0;
      const rightUsesBoardPiece = right.fromIndex >= 0 ? 1 : 0;

      if (leftUsesBoardPiece !== rightUsesBoardPiece) {
        return rightUsesBoardPiece - leftUsesBoardPiece;
      }

      if (left.toIndex !== right.toIndex) {
        return right.toIndex - left.toIndex;
      }

      if (left.fromIndex !== right.fromIndex) {
        return right.fromIndex - left.fromIndex;
      }

      return left.pieceId.localeCompare(right.pieceId);
    })[0] ?? null;
  }, [autoMoveHintEnabled, gameState.phase, isInteractiveTurn, validMoves]);

  const spawnCueColor: 'light' | 'dark' = gameState.currentTurn;
  const hasScoringMove = scoringMoves.length > 0;
  const scoreCueSize = Math.round(
    Math.min(Math.max(boardLayout.cellSize * 0.92, SCORE_CUE_MIN_SIZE), SCORE_CUE_MAX_SIZE),
  );

  const spawnCueAnchor = spawnMove
    ? (() => {
      const start = getPathForColor(spawnCueColor)[0];
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
        const path = getPathForColor(assignedPlayerColor);
        const scoreExitCoord = getBoardScoreExitLogicalCoord(path);

        if (!scoreExitCoord) {
          return null;
        }

        return getCellCenter(scoreExitCoord.row, scoreExitCoord.col);
      })()
      : null;

  const hintedMove = !selectedMove && !hoveredMove ? suggestedMove : null;
  const validPreview = selectedMove ?? hoveredMove ?? hintedMove;
  const previewState = useMemo<PreviewState | null>(() => {
    if (blockedPreview) {
      return blockedPreview;
    }

    if (!validPreview) {
      return null;
    }

    return {
      color: validPreview.pieceId.startsWith('dark') ? 'dark' : 'light',
      fromIndex: validPreview.fromIndex,
      pieceId: validPreview.pieceId,
      toIndex: validPreview.toIndex,
      tone: 'valid',
    };
  }, [blockedPreview, validPreview]);
  const previewTone: PreviewTone = previewState?.tone ?? 'valid';

  const previewPoints = useMemo(() => {
    if (!previewState) {
      return [] as Point[];
    }

    return buildPathPoints(previewState.color, previewState.fromIndex, previewState.toIndex);
  }, [buildPathPoints, previewState]);

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
  const previewDestinationPoint = previewPoints[previewPoints.length - 1] ?? null;
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
    if (freezeMotion) {
      return;
    }

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, [freezeMotion, gameState.history.length]);

  useEffect(() => {
    if (freezeMotion || !spawnMove) {
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
  }, [cuePulse, freezeMotion, spawnMove]);

  useEffect(() => {
    if (freezeMotion || !isInteractiveTurn || !hasScoringMove) {
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
  }, [freezeMotion, hasScoringMove, isInteractiveTurn, scoreCuePulse]);

  useEffect(() => {
    if (freezeMotion || !previewState) {
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
  }, [freezeMotion, previewPulse, previewState]);

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
    setBlockedPreview(null);
  }, [gameState.currentTurn, gameState.phase, gameState.rollValue]);

  useEffect(() => {
    if (freezeMotion) {
      setSelectedMove(null);
      setHoveredMove(null);
      setBlockedPreview(null);
      clearAnimatedMove();
      previousGameStateRef.current = gameState;
      return;
    }

    const previousGameState = previousGameStateRef.current;

    if (!previousGameState) {
      previousGameStateRef.current = gameState;
      return;
    }

    const newHistoryEntries =
      gameState.history.length > previousGameState.history.length
        ? gameState.history.slice(previousGameState.history.length)
        : [];
    const didApplyMove = newHistoryEntries.some((entry) => entry.includes('moved to'));

    if (didApplyMove) {
      const movingColor = previousGameState.currentTurn;
      const opponentColor = movingColor === 'light' ? 'dark' : 'light';
      const previousPieces = previousGameState[movingColor].pieces;
      const movedPiece = gameState[movingColor].pieces.find((piece) => {
        const previousPiece = previousPieces.find((candidate) => candidate.id === piece.id);
        if (!previousPiece) {
          return false;
        }

        return previousPiece.position !== piece.position || previousPiece.isFinished !== piece.isFinished;
      });
      const previousPiece = movedPiece
        ? previousPieces.find((candidate) => candidate.id === movedPiece.id) ?? null
        : null;
      const previousOpponentPieces = previousGameState[opponentColor].pieces;
      const capturedPiece = previousOpponentPieces.find((piece) => {
        if (piece.isFinished || piece.position < 0) {
          return false;
        }

        const nextPiece = gameState[opponentColor].pieces.find((candidate) => candidate.id === piece.id);

        return !!nextPiece && !nextPiece.isFinished && nextPiece.position === -1;
      });

      if (movedPiece && previousPiece) {
        const nextAnimatedMove = buildAnimatedMove(
          movingColor,
          movedPiece.id,
          previousPiece.position,
          movedPiece.position,
          capturedPiece
            ? {
              color: opponentColor,
              id: capturedPiece.id,
            }
            : null,
        );

        if (nextAnimatedMove) {
          setAnimatedMove(nextAnimatedMove);
        }
      }
    }

    previousGameStateRef.current = gameState;
  }, [buildAnimatedMove, clearAnimatedMove, freezeMotion, gameState]);

  useEffect(() => {
    if (freezeMotion || !animatedMove) {
      cancelAnimation(movingPieceProgress);
      cancelAnimation(movingPieceLift);
      cancelAnimation(movingPieceImpact);
      cancelAnimation(movingPieceLanding);
      cancelAnimation(capturedPieceCrush);
      movingPieceProgress.value = 0;
      movingPieceLift.value = 0;
      movingPieceImpact.value = 0;
      movingPieceLanding.value = 0;
      capturedPieceCrush.value = 0;
      if (freezeMotion && animatedMove) {
        clearAnimatedMove();
      }
      return;
    }

    movingPieceProgress.value = 0;
    movingPieceLift.value = 0;
    movingPieceImpact.value = 0;
    movingPieceLanding.value = 0;
    capturedPieceCrush.value = 0;
    movingPieceLift.value = withSequence(
      withTiming(1, {
        duration: Math.max(90, Math.round(animatedMove.durationMs * 0.32)),
        easing: Easing.out(Easing.cubic),
      }),
      withTiming(0, {
        duration: Math.max(120, Math.round(animatedMove.durationMs * 0.68)),
        easing: Easing.inOut(Easing.quad),
      }),
    );
    movingPieceProgress.value = withTiming(
      animatedMove.totalDistance,
      {
        duration: animatedMove.durationMs,
        easing: Easing.inOut(Easing.cubic),
      },
      (finished) => {
        if (!finished) {
          return;
        }

        if (animatedMove.isCaptureMove) {
          movingPieceImpact.value = withSequence(
            withTiming(1, {
              duration: 80,
              easing: Easing.out(Easing.cubic),
            }),
            withTiming(0, {
              duration: 150,
              easing: Easing.out(Easing.back(1.5)),
            }),
          );
          capturedPieceCrush.value = withTiming(1, {
            duration: 190,
            easing: Easing.in(Easing.cubic),
          }, (crushed) => {
            if (crushed) {
              runOnJS(clearAnimatedMove)();
            }
          });
          return;
        }

        if (animatedMove.isScoringMove) {
          movingPieceLanding.value = withSequence(
            withTiming(1, {
              duration: 110,
              easing: Easing.out(Easing.quad),
            }),
            withTiming(0, {
              duration: 170,
              easing: Easing.out(Easing.back(1.4)),
            }, (settled) => {
              if (settled) {
                runOnJS(clearAnimatedMove)();
              }
            }),
          );
          return;
        }

        runOnJS(clearAnimatedMove)();
      },
    );

    return () => {
      cancelAnimation(movingPieceProgress);
      cancelAnimation(movingPieceLift);
      cancelAnimation(movingPieceImpact);
      cancelAnimation(movingPieceLanding);
      cancelAnimation(capturedPieceCrush);
    };
  }, [
    freezeMotion,
    animatedMove,
    capturedPieceCrush,
    clearAnimatedMove,
    movingPieceImpact,
    movingPieceLanding,
    movingPieceLift,
    movingPieceProgress,
  ]);

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
    setBlockedPreview(null);
    makeMove(move);
    setSelectedMove(null);
    setHoveredMove(null);
  };

  const isMoveValid = (move: MoveAction | null | undefined): move is MoveAction =>
    Boolean(
      move &&
      validMoves.some(
        (candidate) =>
          candidate.pieceId === move.pieceId &&
          candidate.fromIndex === move.fromIndex &&
          candidate.toIndex === move.toIndex,
      ),
    );

  const handleSpawnCuePress = () => {
    notifyInteraction();
    if (!spawnMove || !isInteractiveTurn || gameState.phase !== 'moving') return;
    setBlockedPreview(null);
    setHoveredMove(null);
    executeMove(spawnMove);
  };

  const handleSpawnCueHoverIn = () => {
    if (!spawnMove || !isInteractiveTurn || gameState.phase !== 'moving' || !!selectedMove) return;
    setBlockedPreview(null);
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
    notifyInteraction();
    if (!isInteractiveTurn || gameState.phase !== 'moving') return;
    setBlockedPreview(null);

    if (selectedMove && selectedMove.toIndex === pathLength) {
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

  const handlePreviewDestinationPress = () => {
    notifyInteraction();
    if (!isInteractiveTurn || gameState.phase !== 'moving' || !validPreview || !isMoveValid(validPreview)) {
      return;
    }

    setBlockedPreview(null);
    executeMove(validPreview);
  };

  const handleTilePress = (r: number, c: number) => {
    notifyInteraction();
    if (!assignedPlayerColor || !isInteractiveTurn || gameState.phase !== 'moving') return;
    const occupant = getPieceAt(r, c);
    const playerPiece = occupant && occupant.color === assignedPlayerColor ? occupant : undefined;

    const moveFromTile = validMoves.find(
      (move) => move.fromIndex >= 0 && mapAssignedIndexToCoord(move.fromIndex, r, c),
    );

    if (moveFromTile) {
      setBlockedPreview(null);
      setHoveredMove(null);
      executeMove(moveFromTile);
      return;
    }

    if (selectedMove) {
      const selectedToTileMatch =
        selectedMove.toIndex !== pathLength && mapAssignedIndexToCoord(selectedMove.toIndex, r, c);

      if (selectedToTileMatch) {
        setBlockedPreview(null);
        executeMove(selectedMove);
        return;
      }
    }

    const moveToTile = validMoves.find(
      (move) => move.toIndex !== pathLength && mapAssignedIndexToCoord(move.toIndex, r, c),
    );

    if (moveToTile) {
      setBlockedPreview(null);
      executeMove(moveToTile);
      return;
    }

    if (playerPiece && gameState.rollValue !== null) {
      const attemptedToIndex = Math.min(playerPiece.position + gameState.rollValue, pathLength);

      if (attemptedToIndex > playerPiece.position) {
        setSelectedMove(null);
        setHoveredMove(null);
        setBlockedPreview({
          color: playerPiece.color,
          fromIndex: playerPiece.position,
          pieceId: playerPiece.id,
          toIndex: attemptedToIndex,
          tone: 'blocked',
        });
        return;
      }
    }

    setSelectedMove(null);
    setHoveredMove(null);
    setBlockedPreview(null);
  };

  const handleTileHoverIn = (moveFromTile?: MoveAction) => {
    if (!moveFromTile || !isInteractiveTurn || gameState.phase !== 'moving' || !!selectedMove) return;
    setBlockedPreview(null);
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

  const movingPieceStyle = useAnimatedStyle(() => {
    if (!animatedMove || animatedMove.points.length === 0) {
      return {
        opacity: 0,
      };
    }

    const totalDistance = animatedMove.totalDistance;
    const travel = Math.max(0, Math.min(totalDistance, movingPieceProgress.value));
    let x = animatedMove.points[0].x;
    let y = animatedMove.points[0].y;

    for (let index = 1; index < animatedMove.points.length; index += 1) {
      const segmentStartDistance = animatedMove.cumulativeDistances[index - 1] ?? 0;
      const segmentEndDistance = animatedMove.cumulativeDistances[index] ?? totalDistance;

      if (travel <= segmentEndDistance || index === animatedMove.points.length - 1) {
        const startPoint = animatedMove.points[index - 1];
        const endPoint = animatedMove.points[index];
        const segmentDistance = Math.max(1, segmentEndDistance - segmentStartDistance);
        const segmentProgress = Math.min(1, Math.max(0, (travel - segmentStartDistance) / segmentDistance));

        x = startPoint.x + (endPoint.x - startPoint.x) * segmentProgress;
        y = startPoint.y + (endPoint.y - startPoint.y) * segmentProgress;
        break;
      }
    }

    const liftDistance = Math.max(8, boardPiecePixelSize * 0.12);
    const impactCompression = movingPieceImpact.value;
    const landingCompression = movingPieceLanding.value;
    let theatricalHopLift = 0;
    let theatricalHopScale = 0;
    let captureImpactLift = 0;

    if (animatedMove.isScoringMove && totalDistance > 0) {
      const terminalZoneStartIndex = Math.max(0, animatedMove.points.length - 3);
      const terminalZoneStartDistance = animatedMove.cumulativeDistances[terminalZoneStartIndex] ?? 0;
      const terminalZoneDistance = Math.max(1, totalDistance - terminalZoneStartDistance);
      const terminalZoneProgress = Math.max(0, Math.min(1, (travel - terminalZoneStartDistance) / terminalZoneDistance));
      const terminalZoneArc = Math.sin(terminalZoneProgress * Math.PI);

      theatricalHopLift = terminalZoneArc * Math.max(12, boardPiecePixelSize * 0.22);
      theatricalHopScale = terminalZoneArc * 0.05;
    }

    if (animatedMove.isCaptureMove && totalDistance > 0) {
      const impactZoneStartIndex = Math.max(0, animatedMove.points.length - 2);
      const impactZoneStartDistance = animatedMove.cumulativeDistances[impactZoneStartIndex] ?? 0;
      const impactZoneDistance = Math.max(1, totalDistance - impactZoneStartDistance);
      const impactZoneProgress = Math.max(0, Math.min(1, (travel - impactZoneStartDistance) / impactZoneDistance));
      const impactArc = Math.sin(impactZoneProgress * Math.PI);

      captureImpactLift = impactArc * Math.max(10, boardPiecePixelSize * 0.18);
    }

    return {
      opacity: 1,
      transform: [
        { translateX: x - boardPiecePixelSize / 2 },
        {
          translateY:
            y -
            boardPiecePixelSize / 2 -
            movingPieceLift.value * liftDistance -
            theatricalHopLift +
            impactCompression * Math.max(3, boardPiecePixelSize * 0.08) -
            captureImpactLift +
            landingCompression * Math.max(2, boardPiecePixelSize * 0.05),
        },
        {
          scaleX:
            1 +
            movingPieceLift.value * 0.04 +
            theatricalHopScale +
            landingCompression * 0.12,
        },
        {
          scaleY:
            1 +
            movingPieceLift.value * 0.04 +
            theatricalHopScale * 0.5 -
            landingCompression * 0.14,
        },
      ],
    };
  }, [
    animatedMove,
    boardPiecePixelSize,
    movingPieceImpact,
    movingPieceLanding,
    movingPieceLift,
    movingPieceProgress,
  ]);

  const capturedPieceStyle = useAnimatedStyle(() => {
    if (!animatedMove || !animatedMove.isCaptureMove || !animatedMove.capturedPiece || animatedMove.points.length === 0) {
      return {
        opacity: 0,
      };
    }

    const impactPoint = animatedMove.points[animatedMove.points.length - 1];
    const crush = capturedPieceCrush.value;

    return {
      opacity: 1 - crush * 0.96,
      transform: [
        { translateX: impactPoint.x - boardPiecePixelSize / 2 },
        { translateY: impactPoint.y - boardPiecePixelSize / 2 + crush * Math.max(4, boardPiecePixelSize * 0.16) },
        { scaleX: 1 + crush * 0.3 },
        { scaleY: 1 - crush * 0.76 },
      ],
    };
  }, [animatedMove, boardPiecePixelSize, capturedPieceCrush]);

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
        const visiblePiece = piece?.id === animatedMove?.pieceId ? undefined : piece;
        const moveFromTile = validMoves.find(
          (move) => move.fromIndex >= 0 && isMyTurn && mapAssignedIndexToCoord(move.fromIndex, r, c),
        );

        const isDestination =
          isMyTurn &&
          validMoves.some(
            (move) => move.toIndex !== pathLength && mapAssignedIndexToCoord(move.toIndex, r, c),
          );

        const isPreviewDestination =
          !!previewState &&
          previewState.toIndex !== pathLength &&
          mapAssignedIndexToCoord(previewState.toIndex, r, c);

        const isSelectedPiece =
          !!selectedMove && selectedMove.fromIndex >= 0 && mapAssignedIndexToCoord(selectedMove.fromIndex, r, c);
        const isHintedPiece =
          !!hintedMove && hintedMove.fromIndex >= 0 && mapAssignedIndexToCoord(hintedMove.fromIndex, r, c);
        const isFocusedPiece = isSelectedPiece || isHintedPiece;
        const isOwnTurnPiece = !!piece && piece.color === assignedPlayerColor;

        const isValidTarget = previewTone === 'valid' && isPreviewDestination;
        const isInteractable = isInteractiveTurn && (isDestination || !!moveFromTile || isFocusedPiece || isOwnTurnPiece);
        const pieceLandingOffset = getBoardTileLandingOffset({
          cellSize: renderedTileSize,
          col: c,
          orientation,
          row: r,
        });

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
              pieceOffsetX={pieceLandingOffset.x}
              pieceOffsetY={pieceLandingOffset.y}
              pieceArtScale={boardPieceArtScale}
              pieceArtOffsetY={boardPieceArtOffsetY}
              piece={visiblePiece}
              isValidTarget={isValidTarget}
              isSelectedPiece={isFocusedPiece}
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
    areMovesEqual(spawnMove, selectedMove);
  const spawnCueHinted = !!spawnMove && areMovesEqual(spawnMove, hintedMove);
  const spawnCueActive = spawnCueSelected || spawnCueHinted;
  const scoreCueSelected = !!selectedMove && selectedMove.toIndex === pathLength;

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

      {!freezeMotion && (previewSegments.length > 0 || previewDestinationPoint) && (
        <View
          pointerEvents="none"
          style={styles.previewLayer}
          testID={previewTone === 'blocked' ? 'board-preview-blocked' : 'board-preview-valid'}
        >
          {previewSegments.map((segment, index) => (
            <Animated.View
              key={`segment-${index}`}
              style={[
                styles.previewSegment,
                previewTone === 'blocked' ? styles.previewSegmentBlocked : styles.previewSegmentValid,
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
          {previewDestinationPoint ? (
            <Animated.View
              key="destination-point"
              style={[
                styles.previewPoint,
                previewTone === 'blocked' ? styles.previewPointBlocked : styles.previewPointValid,
                {
                  left: previewDestinationPoint.x - 7,
                  top: previewDestinationPoint.y - 7,
                },
                previewPulseStyle,
              ]}
            />
          ) : null}
        </View>
      )}

      {!freezeMotion && previewDestinationPoint && validPreview && isMoveValid(validPreview) ? (
        <Pressable
          onPress={handlePreviewDestinationPress}
          testID="board-preview-destination"
          style={[
            styles.previewDestinationTouchable,
            {
              left: previewDestinationPoint.x - Math.max(15, Math.round(boardPiecePixelSize * 0.42)),
              top: previewDestinationPoint.y - Math.max(15, Math.round(boardPiecePixelSize * 0.42)),
              width: Math.max(30, Math.round(boardPiecePixelSize * 0.84)),
              height: Math.max(30, Math.round(boardPiecePixelSize * 0.84)),
              borderRadius: Math.max(15, Math.round(boardPiecePixelSize * 0.42)),
            },
          ]}
        />
      ) : null}

      {!freezeMotion && animatedMove ? (
        <View pointerEvents="none" style={styles.movingPieceLayer}>
          {animatedMove.isCaptureMove && animatedMove.capturedPiece ? (
            <Animated.View testID="board-captured-piece" style={[styles.capturedPiece, capturedPieceStyle]}>
              <Piece
                color={animatedMove.capturedPiece.color}
                pixelSize={boardPiecePixelSize}
                artScale={boardPieceArtScale}
                artOffsetY={boardPieceArtOffsetY}
                state="idle"
              />
            </Animated.View>
          ) : null}
          <Animated.View testID="board-moving-piece" style={[styles.movingPiece, movingPieceStyle]}>
            <Piece
              color={animatedMove.color}
              pixelSize={boardPiecePixelSize}
              artScale={boardPieceArtScale}
              artOffsetY={boardPieceArtOffsetY}
              state="idle"
            />
          </Animated.View>
        </View>
      ) : null}

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

      {!freezeMotion && spawnCueAnchor && (
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
              spawnCueActive && styles.spawnCueSelected,
              !isInteractiveTurn && styles.spawnCueReadonly,
              { borderRadius: spawnCueSize / 2 },
              cueAnimatedStyle,
            ]}
          >
            <Piece
              color={spawnCueColor}
              pixelSize={boardPiecePixelSize}
              artScale={boardPieceArtScale}
              artOffsetY={boardPieceArtOffsetY}
              variant={spawnCueColor}
              highlight={spawnCueActive}
              state={spawnCueActive ? 'active' : 'idle'}
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
  },
  previewSegmentValid: {
    backgroundColor: 'rgba(111, 184, 255, 0.95)',
    ...boxShadow({
      color: urTheme.colors.glow,
      opacity: 0.36,
      blurRadius: 7,
      elevation: 6,
    }),
  },
  previewSegmentBlocked: {
    backgroundColor: 'rgba(214, 70, 58, 0.96)',
    ...boxShadow({
      color: '#D6463A',
      opacity: 0.34,
      blurRadius: 7,
      elevation: 6,
    }),
  },
  previewPoint: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: urTheme.radii.pill,
    borderWidth: 1,
  },
  previewPointValid: {
    backgroundColor: 'rgba(241, 230, 208, 0.92)',
    borderColor: 'rgba(63, 40, 18, 0.48)',
    ...boxShadow({
      color: urTheme.colors.glow,
      opacity: 0.4,
      blurRadius: 8,
      elevation: 6,
    }),
  },
  previewPointBlocked: {
    backgroundColor: 'rgba(255, 232, 226, 0.96)',
    borderColor: 'rgba(134, 34, 28, 0.72)',
    ...boxShadow({
      color: '#D6463A',
      opacity: 0.42,
      blurRadius: 8,
      elevation: 6,
    }),
  },
  previewDestinationTouchable: {
    position: 'absolute',
    zIndex: 6,
  },
  movingPieceLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 7,
  },
  movingPiece: {
    position: 'absolute',
  },
  capturedPiece: {
    position: 'absolute',
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
