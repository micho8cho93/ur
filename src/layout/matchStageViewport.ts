import type { ViewportSize } from './matchViewport';

const MOBILE_LAYOUT_BREAKPOINT = 760;
const TABLET_MIN_SHORT_SIDE = MOBILE_LAYOUT_BREAKPOINT;
const TABLET_MAX_SHORT_SIDE = 1024;
const TABLET_MAX_LONG_SIDE = 1366;
const TABLET_LANDSCAPE_SIDE_COLUMN_SCALE = 0.9;
const TABLET_LANDSCAPE_RESERVE_TRAY_SCALE = 0.68;
const TABLET_LANDSCAPE_VIEWPORT_HORIZONTAL_PADDING_RATIO = 0.11;
const TABLET_LANDSCAPE_VIEWPORT_HORIZONTAL_PADDING_MIN = 32;
const MOBILE_WEB_BOARD_SIZE_SCALE = 1.22705 * 0.9;

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

export interface MatchStageBoardScaleInput {
  isMobileLayout: boolean;
  isMobileWebLayout: boolean;
  layoutBoardScale: number;
  viewportFitBoardScale: number;
}

export interface MatchStageBoardViewportSafetyInsets {
  horizontal: number;
  vertical: number;
}

export const resolveMobileWebHeaderLift = ({
  boardLift,
  isMobileLayout,
  isMobileWebLayout,
}: {
  boardLift: number;
  isMobileLayout: boolean;
  isMobileWebLayout: boolean;
}): number => {
  if (!isMobileLayout) {
    return 0;
  }

  if (!isMobileWebLayout) {
    return boardLift;
  }

  return Math.max(0, boardLift - Math.max(8, Math.round(boardLift * 0.45)));
};

export const resolveMobileReserveRailTopOffset = ({
  isMobileWebLayout,
  isOnlineMatch,
  reserveColumnWidth,
  useMobileSideReserveRails,
}: {
  isMobileWebLayout: boolean;
  isOnlineMatch: boolean;
  reserveColumnWidth: number;
  useMobileSideReserveRails: boolean;
}): number => {
  if (!useMobileSideReserveRails) {
    return 0;
  }

  const baseOffset = Math.max(6, Math.round(reserveColumnWidth * 0.14));

  if (!isMobileWebLayout || !isOnlineMatch) {
    return baseOffset;
  }

  return baseOffset + Math.max(8, Math.round(reserveColumnWidth * 0.12));
};

export const resolveMobileBoardRowInset = ({
  isMobileWebLayout,
  useMobileSideReserveRails,
  viewportWidth,
}: {
  isMobileWebLayout: boolean;
  useMobileSideReserveRails: boolean;
  viewportWidth: number;
}): number =>
  isMobileWebLayout && useMobileSideReserveRails
    ? 6
    : Math.max(6, Math.round(Math.max(0, viewportWidth) / 65));

export const resolveMobileBoardViewportSafetyInsets = ({
  isMobileLayout,
  isMobileWebLayout,
  viewportHeight,
  viewportWidth,
}: {
  isMobileLayout: boolean;
  isMobileWebLayout: boolean;
  viewportHeight: number;
  viewportWidth: number;
}): MatchStageBoardViewportSafetyInsets => {
  if (!isMobileLayout) {
    return {
      horizontal: 0,
      vertical: 0,
    };
  }

  const mobileWebInsetBoost = isMobileWebLayout ? 2 : 0;

  return {
    horizontal: Math.max(6, Math.round(Math.max(0, viewportWidth) * 0.015)) + mobileWebInsetBoost,
    vertical: Math.max(6, Math.round(Math.max(0, viewportHeight) * 0.012)) + mobileWebInsetBoost,
  };
};

export const resolveMatchStageBoardScale = ({
  isMobileLayout,
  isMobileWebLayout,
  layoutBoardScale,
  viewportFitBoardScale,
}: MatchStageBoardScaleInput): number => {
  const adjustedLayoutBoardScale = isMobileWebLayout
    ? layoutBoardScale * MOBILE_WEB_BOARD_SIZE_SCALE
    : layoutBoardScale;

  if (!isMobileLayout) {
    return adjustedLayoutBoardScale;
  }

  return Math.min(adjustedLayoutBoardScale, viewportFitBoardScale);
};

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

export const resolveMatchStageReserveTrayScale = ({
  defaultTrayScale,
  isTabletLandscape,
}: {
  defaultTrayScale: number;
  isTabletLandscape: boolean;
}): number => (isTabletLandscape ? TABLET_LANDSCAPE_RESERVE_TRAY_SCALE : defaultTrayScale);

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
