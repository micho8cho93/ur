import type { ViewportSize } from './matchViewport';

const MOBILE_LAYOUT_BREAKPOINT = 760;
const TABLET_MIN_SHORT_SIDE = MOBILE_LAYOUT_BREAKPOINT;
const TABLET_MAX_SHORT_SIDE = 1024;
const TABLET_MAX_LONG_SIDE = 1366;
const TABLET_LANDSCAPE_SIDE_COLUMN_SCALE = 0.8;

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
  mobileSideBoardScaleMultiplier: number;
  reservePieceScale: number;
  rollButtonMaxSize: number;
  rollButtonMinSize: number;
  rollButtonWidthRatio: number;
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

export const resolveMatchStageTabletPortraitTuning = (
  isTabletPortrait: boolean,
): MatchStageTabletPortraitTuning => {
  if (!isTabletPortrait) {
    return {
      boardLiftViewportRatio: 0.042,
      mobileSideBoardScaleMultiplier: 0.8,
      reservePieceScale: 0.84,
      rollButtonMaxSize: 102,
      rollButtonMinSize: 84,
      rollButtonWidthRatio: 0.22,
    };
  }

  return {
    boardLiftViewportRatio: 0.05,
    mobileSideBoardScaleMultiplier: 0.64,
    reservePieceScale: 0.72,
    rollButtonMaxSize: 88,
    rollButtonMinSize: 72,
    rollButtonWidthRatio: 0.18,
  };
};
