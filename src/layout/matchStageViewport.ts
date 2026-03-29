import type { ViewportSize } from './matchViewport';

const MOBILE_LAYOUT_BREAKPOINT = 760;
const TABLET_MIN_SHORT_SIDE = MOBILE_LAYOUT_BREAKPOINT;
const TABLET_MAX_SHORT_SIDE = 1024;
const TABLET_MAX_LONG_SIDE = 1366;
const TABLET_LANDSCAPE_SIDE_COLUMN_SCALE = 0.9;
const TABLET_LANDSCAPE_VIEWPORT_HORIZONTAL_PADDING_RATIO = 0.1;
const TABLET_LANDSCAPE_VIEWPORT_HORIZONTAL_PADDING_MIN = 32;

export interface MatchStageViewportMode {
  isMobileHandset: boolean;
  isTabletLandscape: boolean;
  isTabletPortrait: boolean;
  isTabletViewport: boolean;
  useMobileLayout: boolean;
  useMobileSideReserveRails: boolean;
  useSideColumns: boolean;
}

export interface MatchStageSideColumnWidthInput {
  isTabletLandscape: boolean;
  stageContentWidth: number;
  viewportWidth: number;
}

export interface MatchStageTabletPortraitTuning {
  boardLiftViewportRatio: number;
  boardGapControlScale: number;
  mobileSideBoardScaleMultiplier: number;
  reserveColumnMaxWidth: number;
  reserveColumnMinWidth: number;
  reserveColumnWidthRatio: number;
  reservePieceScale: number;
  rollButtonMaxSize: number;
  rollButtonMinSize: number;
  rollButtonWidthRatio: number;
  trayScale: number;
}

export interface MatchStageTopAlignedFrame {
  y: number;
}

export const resolveMatchStageViewportMode = ({
  width,
  height,
}: ViewportSize): MatchStageViewportMode => {
  const roundedWidth = Math.max(0, Math.round(width));
  const roundedHeight = Math.max(0, Math.round(height));
  const shortSide = Math.min(roundedWidth, roundedHeight);
  const longSide = Math.max(roundedWidth, roundedHeight);
  const isTabletViewport =
    shortSide >= TABLET_MIN_SHORT_SIDE &&
    shortSide <= TABLET_MAX_SHORT_SIDE &&
    longSide <= TABLET_MAX_LONG_SIDE;
  const isTabletPortrait = isTabletViewport && roundedHeight > roundedWidth;
  const isTabletLandscape = isTabletViewport && roundedWidth > roundedHeight;
  const isMobileHandset = roundedWidth < MOBILE_LAYOUT_BREAKPOINT;
  const useMobileLayout = isMobileHandset || isTabletPortrait;

  return {
    isMobileHandset,
    isTabletLandscape,
    isTabletPortrait,
    isTabletViewport,
    useMobileLayout,
    useMobileSideReserveRails: useMobileLayout,
    useSideColumns: roundedWidth >= MOBILE_LAYOUT_BREAKPOINT && !isTabletPortrait,
  };
};

export const resolveMatchStageSideColumnWidth = ({
  isTabletLandscape,
  stageContentWidth,
  viewportWidth,
}: MatchStageSideColumnWidthInput): number => {
  const baseWidth = Math.max(
    88,
    Math.min(264, Math.floor(stageContentWidth * (viewportWidth < 720 ? 0.2 : 0.24))),
  );

  if (!isTabletLandscape) {
    return baseWidth;
  }

  return Math.max(72, Math.round(baseWidth * TABLET_LANDSCAPE_SIDE_COLUMN_SCALE));
};

export const resolveMatchStageViewportHorizontalPadding = ({
  isTabletLandscape,
  viewportWidth,
}: {
  isTabletLandscape: boolean;
  viewportWidth: number;
}): number =>
  isTabletLandscape
    ? Math.max(
      TABLET_LANDSCAPE_VIEWPORT_HORIZONTAL_PADDING_MIN,
      Math.round(Math.max(0, viewportWidth) * TABLET_LANDSCAPE_VIEWPORT_HORIZONTAL_PADDING_RATIO),
    )
    : 0;

export const resolveMatchStageTabletPortraitTuning = (
  isTabletPortrait: boolean,
): MatchStageTabletPortraitTuning => {
  if (!isTabletPortrait) {
    return {
      boardLiftViewportRatio: 0.042,
      boardGapControlScale: 1,
      mobileSideBoardScaleMultiplier: 0.8,
      reserveColumnMaxWidth: 80,
      reserveColumnMinWidth: 52,
      reserveColumnWidthRatio: 0.16,
      reservePieceScale: 0.84,
      rollButtonMaxSize: 102,
      rollButtonMinSize: 84,
      rollButtonWidthRatio: 0.22,
      trayScale: 1,
    };
  }

  return {
    boardLiftViewportRatio: 0.052,
    boardGapControlScale: 1.1,
    mobileSideBoardScaleMultiplier: 0.78,
    reserveColumnMaxWidth: 68,
    reserveColumnMinWidth: 48,
    reserveColumnWidthRatio: 0.13,
    reservePieceScale: 0.96,
    rollButtonMaxSize: 116,
    rollButtonMinSize: 90,
    rollButtonWidthRatio: 0.235,
    trayScale: 1.08,
  };
};

export const resolveMobileWebBoardTrayAlignmentCorrection = ({
  boardFrame,
  currentCorrection,
  darkTrayFrame,
  lightTrayFrame,
}: {
  boardFrame: MatchStageTopAlignedFrame | null;
  currentCorrection: number;
  darkTrayFrame: MatchStageTopAlignedFrame | null;
  lightTrayFrame: MatchStageTopAlignedFrame | null;
}): number => {
  if (!boardFrame || !lightTrayFrame || !darkTrayFrame) {
    return 0;
  }

  const trayTop = Math.min(lightTrayFrame.y, darkTrayFrame.y);
  const boardTop = boardFrame.y;
  const delta = Math.round(boardTop - trayTop);

  if (Math.abs(delta) <= 1) {
    return currentCorrection;
  }

  return Math.max(0, Math.min(96, currentCorrection + delta));
};
