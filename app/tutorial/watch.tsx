import { HowToPlayModal } from '@/components/HowToPlayModal';
import { Board, getBoardPiecePixelSize } from '@/components/game/Board';
import { Dice } from '@/components/game/Dice';
import { EdgeScore } from '@/components/game/EdgeScore';
import { GameStageHUD } from '@/components/game/GameStageHUD';
import { PieceRail } from '@/components/game/PieceRail';
import { TutorialControls } from '@/components/tutorial/TutorialControls';
import { TutorialModal } from '@/components/tutorial/TutorialModal';
import { Button } from '@/components/ui/Button';
import { boxShadow, textShadow } from '@/constants/styleEffects';
import { urTheme, urTypography } from '@/constants/urTheme';
import { BOARD_COLS, BOARD_ROWS } from '@/logic/constants';
import { buildTutorialFrames } from '@/tutorials/tutorialEngine';
import { TutorialStep, TutorialTeachingStep, TutorialUiTarget } from '@/tutorials/tutorialTypes';
import { WATCH_TUTORIAL_SCRIPT } from '@/tutorials/watchTutorialScript';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PLAYER_PERSPECTIVE = 'light' as const;
const UR_BG_IMAGE = require('../../assets/images/ur_bg.png');

const isTeachingStep = (step: TutorialStep): step is TutorialTeachingStep => step.kind === 'PAUSE' || step.kind === 'UI_HINT';

const getTeachingFocus = (step: TutorialTeachingStep | null): TutorialUiTarget | null => {
  if (!step) return null;
  if (step.kind === 'UI_HINT') return step.target;
  return step.focus ?? null;
};

const getAutoAdvanceDelay = (step: TutorialStep, speed: 1 | 2) => {
  const base = step.kind === 'MOVE' ? 900 : step.kind === 'ROLL' ? 850 : 420;
  return Math.round(base / speed);
};

export default function WatchTutorialScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [showHowToPlay, setShowHowToPlay] = React.useState(false);
  const [stepIndex, setStepIndex] = React.useState(0);
  const [isPlaying, setIsPlaying] = React.useState(true);
  const [speed, setSpeed] = React.useState<1 | 2>(1);
  const [activeModalStep, setActiveModalStep] = React.useState<TutorialTeachingStep | null>(null);
  const [rollingVisual, setRollingVisual] = React.useState(false);
  const [boardSlotSize, setBoardSlotSize] = React.useState({ width: 0, height: 0 });
  const resumeAfterModalRef = React.useRef(false);

  const tutorialBuild = React.useMemo(() => {
    try {
      return {
        frames: buildTutorialFrames(WATCH_TUTORIAL_SCRIPT),
        error: null as Error | null,
      };
    } catch (error) {
      console.error(error);
      return {
        frames: null,
        error: error instanceof Error ? error : new Error('Failed to build tutorial frames'),
      };
    }
  }, []);

  const totalSteps = WATCH_TUTORIAL_SCRIPT.length;

  const currentFrame = tutorialBuild.frames ? tutorialBuild.frames[stepIndex] : null;
  const currentFocus = getTeachingFocus(activeModalStep);
  const controlsLocked = activeModalStep !== null;

  const advanceStep = React.useCallback(() => {
    if (!tutorialBuild.frames) return;
    if (activeModalStep || stepIndex >= totalSteps) return;

    const step = WATCH_TUTORIAL_SCRIPT[stepIndex];
    const shouldResumeAfterModal = isPlaying;

    setStepIndex((prev) => Math.min(prev + 1, totalSteps));

    if (isTeachingStep(step)) {
      resumeAfterModalRef.current = shouldResumeAfterModal;
      setIsPlaying(false);
      setActiveModalStep(step);
    }
  }, [activeModalStep, isPlaying, stepIndex, totalSteps, tutorialBuild.frames]);

  const handleContinueModal = React.useCallback(() => {
    const shouldResume = resumeAfterModalRef.current;
    resumeAfterModalRef.current = false;
    setActiveModalStep(null);
    if (shouldResume && stepIndex < totalSteps) {
      setIsPlaying(true);
    }
  }, [stepIndex, totalSteps]);

  const handleBackStep = React.useCallback(() => {
    if (controlsLocked) return;
    setIsPlaying(false);
    setStepIndex((prev) => Math.max(0, prev - 1));
  }, [controlsLocked]);

  const handleNextStep = React.useCallback(() => {
    if (controlsLocked) return;
    setIsPlaying(false);
    advanceStep();
  }, [advanceStep, controlsLocked]);

  const handleRestart = React.useCallback(() => {
    resumeAfterModalRef.current = false;
    setIsPlaying(false);
    setActiveModalStep(null);
    setRollingVisual(false);
    setStepIndex(0);
  }, []);

  const handleTogglePlay = React.useCallback(() => {
    if (controlsLocked || stepIndex >= totalSteps) return;
    setIsPlaying((prev) => !prev);
  }, [controlsLocked, stepIndex, totalSteps]);

  React.useEffect(() => {
    if (!tutorialBuild.frames) return;
    if (!isPlaying || controlsLocked || stepIndex >= totalSteps) return;

    const nextStep = WATCH_TUTORIAL_SCRIPT[stepIndex];
    const timer = setTimeout(() => {
      advanceStep();
    }, getAutoAdvanceDelay(nextStep, speed));

    return () => clearTimeout(timer);
  }, [advanceStep, controlsLocked, isPlaying, speed, stepIndex, totalSteps, tutorialBuild.frames]);

  React.useEffect(() => {
    if (stepIndex >= totalSteps) {
      setIsPlaying(false);
    }
  }, [stepIndex, totalSteps]);

  React.useEffect(() => {
    if (stepIndex === 0) {
      setRollingVisual(false);
      return;
    }

    const lastStep = WATCH_TUTORIAL_SCRIPT[stepIndex - 1];
    if (lastStep.kind !== 'ROLL') {
      setRollingVisual(false);
      return;
    }

    setRollingVisual(true);
    const timer = setTimeout(() => {
      setRollingVisual(false);
    }, Math.round(460 / speed));

    return () => clearTimeout(timer);
  }, [speed, stepIndex]);


  if (!tutorialBuild.frames || !currentFrame) {
    return (
      <View style={styles.screen}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.errorWrap}>
          <Text style={styles.errorTitle}>Tutorial failed to load</Text>
          <Text style={styles.errorText}>{tutorialBuild.error?.message ?? 'Unknown error'}</Text>
          <View style={styles.errorButtonWrap}>
            <Button title="Back to Home" onPress={() => router.replace('/')} />
          </View>
        </View>
      </View>
    );
  }

  const gameState = currentFrame.gameState;
  const isMyTurn = gameState.currentTurn === PLAYER_PERSPECTIVE;
  const canRoll = isMyTurn && gameState.phase === 'rolling';
  const displayRollValue = gameState.rollValue ?? currentFrame.displayRollValue;
  const showDestinationHighlights = !rollingVisual && displayRollValue !== null;
  const displayedValidMoves = showDestinationHighlights ? currentFrame.validMoves : [];

  const lightReserve = gameState.light.pieces.filter((piece) => !piece.isFinished && piece.position === -1).length;
  const darkReserve = gameState.dark.pieces.filter((piece) => !piece.isFinished && piece.position === -1).length;

  const highlight = (target: TutorialUiTarget) => currentFocus === target;

  const viewportHorizontalPadding = 0;
  const stageContentWidth = Math.min(Math.max(width - viewportHorizontalPadding * 2, 0), urTheme.layout.stage.maxWidth);
  const useSideColumns = width >= 980;
  const compactSupportPanels = width < 460;
  const boardClusterGap = useSideColumns ? urTheme.spacing.xs : urTheme.spacing.sm;
  const sideColumnWidth = useSideColumns
    ? Math.max(224, Math.min(292, Math.floor(stageContentWidth * 0.24)))
    : 0;
  const boardWidthLimitByLayout = useSideColumns
    ? Math.max(
      224,
      Math.min(urTheme.layout.boardMax, stageContentWidth - sideColumnWidth * 2 - boardClusterGap * 2),
    )
    : Math.max(224, Math.min(urTheme.layout.boardMax, stageContentWidth - 2));

  // Must match Board.tsx base width before boardScale is applied.
  const boardBaseWidth = Math.min(Math.max(width - urTheme.spacing.lg, 0), urTheme.layout.boardMax);
  const boardFramePadding = urTheme.spacing.sm;
  const boardInnerPadding = urTheme.spacing.xs;
  const boardGridGap = 0;
  const boardOuterPadding = boardFramePadding * 2 + boardInnerPadding * 2;
  const verticalBoardRows = BOARD_COLS;
  const verticalBoardCols = BOARD_ROWS;
  const verticalBoardGapTotal = (verticalBoardRows - 1) * boardGridGap;
  const boardSlotWidth = boardSlotSize.width > 0 ? boardSlotSize.width : boardWidthLimitByLayout;
  const boardSlotHeight = boardSlotSize.height > 0 ? boardSlotSize.height : Math.max(0, height * 0.45);
  const boardWidthLimitByHeight = Math.min(
    urTheme.layout.boardMax,
    boardOuterPadding +
    (Math.max(0, boardSlotHeight - boardOuterPadding - verticalBoardGapTotal) * verticalBoardCols) / verticalBoardRows,
  );
  const widenedBoardLayoutTarget = Math.min(urTheme.layout.boardMax, boardWidthLimitByLayout * 1.5);
  const targetBoardWidth = Math.max(110, Math.min(widenedBoardLayoutTarget, boardWidthLimitByHeight, boardSlotWidth));
  const isMobileLayout = width < 760;
  const mobileBoardScaleBoost = isMobileLayout ? 1.2 : 1;
  const boardScale = Math.max(
    0.24,
    Math.min(1.2, (targetBoardWidth / Math.max(boardBaseWidth, 1)) * mobileBoardScaleBoost),
  );
  const reservePiecePixelSize = getBoardPiecePixelSize({
    viewportWidth: width,
    boardScale,
    orientation: 'vertical',
  });
  const stageGap = height < 760 ? urTheme.spacing.sm : urTheme.spacing.md;
  const viewportTopPadding = 0;
  const viewportBottomPadding = Math.max(insets.bottom, urTheme.spacing.xs);
  const topChromeTop = insets.top + urTheme.spacing.xs;
  const topChromeHeight = 36;
  const scoreOverlayTop = topChromeTop + topChromeHeight + urTheme.spacing.xs;
  const backdropOverscan = Math.ceil(Math.max(width, height) * 0.025);
  const canvasTopEdgeLift = Math.max(24, Math.min(96, Math.round(height * 0.07)));
  const wideLayoutSupportColumnOffset = useSideColumns
    ? Math.max(56, Math.round(height * 0.11))
    : 0;
  const sideColumnTopInset = scoreOverlayTop + urTheme.spacing.sm + wideLayoutSupportColumnOffset;
  const mobileBoardOffsetTop = isMobileLayout
    ? Math.max(scoreOverlayTop - urTheme.spacing.xs, Math.round(height * 0.065))
    : 0;
  const mobileBoardOffsetBottom = isMobileLayout ? Math.max(urTheme.spacing.md, Math.round(height * 0.06)) : 0;
  const mobileSupportOffsetTop = isMobileLayout ? Math.max(urTheme.spacing.md, Math.round(height * 0.05)) : 0;

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: false }} />

      <View pointerEvents="none" style={styles.backdropLayer}>
        <Image
          source={UR_BG_IMAGE}
          resizeMode="cover"
          style={[
            styles.backdropImage,
            {
              left: -backdropOverscan,
              width: width + backdropOverscan * 2,
              top: -backdropOverscan - canvasTopEdgeLift,
              height: height + backdropOverscan * 2 + canvasTopEdgeLift,
            },
          ]}
        />
      </View>

      <View style={[styles.topChrome, { top: topChromeTop }]}>
        <View style={styles.topChromeLeft}>
          <Pressable
            onPress={() => router.replace('/')}
            accessibilityRole="button"
            accessibilityLabel="Exit tutorial"
            style={({ pressed }) => [styles.topChromeIconButton, pressed && styles.headerHelpButtonPressed]}
          >
            <MaterialIcons name="arrow-back" size={20} color={urTheme.colors.parchment} />
          </Pressable>
          <Text numberOfLines={1} style={styles.topChromeTitle}>
            Watch Tutorial
          </Text>
        </View>

        <View style={styles.topChromeRight}>
          <Pressable
            onPress={() => router.replace('/')}
            accessibilityRole="button"
            accessibilityLabel="Skip tutorial"
            style={({ pressed }) => [styles.headerHelpButton, pressed && styles.headerHelpButtonPressed]}
          >
            <Text style={styles.headerHelpLabel}>Skip</Text>
          </Pressable>
          <Pressable
            onPress={() => setShowHowToPlay(true)}
            accessibilityRole="button"
            accessibilityLabel="Open how to play instructions"
            style={({ pressed }) => [styles.headerHelpButton, pressed && styles.headerHelpButtonPressed]}
          >
            <Text style={styles.headerHelpLabel}>Help</Text>
          </Pressable>
        </View>
      </View>

      <View
        style={[
          styles.stageViewport,
          {
            paddingHorizontal: viewportHorizontalPadding,
            paddingTop: viewportTopPadding,
            paddingBottom: viewportBottomPadding,
          },
        ]}
      >
        <View style={[styles.stageWrap, { gap: stageGap }]}>
          <View
            pointerEvents="none"
            style={[
              styles.scoreRow,
              styles.scoreRowOverlay,
              { top: scoreOverlayTop },
              isMobileLayout && styles.scoreRowOverlayMobile,
            ]}
          >
            <EdgeScore label="Light Score" value={`${gameState.light.finishedCount}/7`} active={isMyTurn} />
            <EdgeScore
              label="Dark Score"
              value={`${gameState.dark.finishedCount}/7`}
              active={!isMyTurn}
              align="right"
            />
          </View>

          {useSideColumns ? (
            <View style={[styles.boardClusterWide, { gap: boardClusterGap }]}>
              <View style={[styles.sideColumn, { width: sideColumnWidth, paddingTop: sideColumnTopInset }]}>
                <PieceRail
                  label="Light Reserve"
                  color="light"
                  tokenVariant="light"
                  piecePixelSize={reservePiecePixelSize}
                  reserveCount={lightReserve}
                  active={isMyTurn}
                />
                <View style={[styles.focusWrap, highlight('turnBanner') && styles.focusWrapActive]}>
                  <GameStageHUD isMyTurn={isMyTurn} canRoll={canRoll} phase={gameState.phase} />
                </View>
                <View style={[styles.focusWrap, highlight('controls') && styles.focusWrapActive]}>
                  <TutorialControls
                    steps={WATCH_TUTORIAL_SCRIPT}
                    stepIndex={stepIndex}
                    isPlaying={isPlaying}
                    speed={speed}
                    controlsLocked={controlsLocked}
                    onTogglePlay={handleTogglePlay}
                    onNext={handleNextStep}
                    onBack={handleBackStep}
                    onRestart={handleRestart}
                    onToggleSpeed={() => setSpeed((prev) => (prev === 1 ? 2 : 1))}
                    compact
                  />
                </View>
              </View>

              <View style={styles.boardCenterColumn}>
                <View
                  style={styles.boardViewport}
                  onLayout={(event) => {
                    const { width: slotWidth, height: slotHeight } = event.nativeEvent.layout;
                    setBoardSlotSize((prev) =>
                      prev.width === slotWidth && prev.height === slotHeight
                        ? prev
                        : { width: slotWidth, height: slotHeight },
                    );
                  }}
                >
                  <View style={[styles.boardCard, (highlight('board') || highlight('pieceSelect')) && styles.focusWrapActive]}>
                    <Board
                      showRailHints
                      highlightMode="theatrical"
                      boardScale={boardScale}
                      orientation="vertical"
                      gameStateOverride={gameState}
                      validMovesOverride={displayedValidMoves}
                      playerColorOverride={PLAYER_PERSPECTIVE}
                      onMakeMoveOverride={() => { }}
                      allowInteraction={false}
                    />
                  </View>
                </View>
              </View>

              <View style={[styles.sideColumn, { width: sideColumnWidth, paddingTop: sideColumnTopInset }]}>
                <PieceRail
                  label="Dark Reserve"
                  color="dark"
                  tokenVariant="dark"
                  piecePixelSize={reservePiecePixelSize}
                  reserveCount={darkReserve}
                  active={!isMyTurn}
                />
                <View style={[styles.focusWrap, highlight('dice') && styles.focusWrapActive]}>
                  <Dice
                    value={displayRollValue}
                    rolling={rollingVisual}
                    onRoll={() => { }}
                    canRoll={false}
                    mode="stage"
                    compact={compactSupportPanels}
                    showNumericResult={!compactSupportPanels}
                  />
                </View>
              </View>
            </View>
          ) : (
            <View style={[styles.boardClusterMobile, { gap: urTheme.spacing.sm, paddingTop: mobileBoardOffsetTop }]}>
              <View
                style={[styles.boardViewport, { paddingBottom: mobileBoardOffsetBottom }]}
                onLayout={(event) => {
                  const { width: slotWidth, height: slotHeight } = event.nativeEvent.layout;
                  setBoardSlotSize((prev) =>
                    prev.width === slotWidth && prev.height === slotHeight
                      ? prev
                      : { width: slotWidth, height: slotHeight },
                  );
                }}
              >
                <View style={[styles.boardCard, (highlight('board') || highlight('pieceSelect')) && styles.focusWrapActive]}>
                  <Board
                    showRailHints
                    highlightMode="theatrical"
                    boardScale={boardScale}
                    orientation="vertical"
                    gameStateOverride={gameState}
                    validMovesOverride={displayedValidMoves}
                    playerColorOverride={PLAYER_PERSPECTIVE}
                    onMakeMoveOverride={() => { }}
                    allowInteraction={false}
                  />
                </View>
              </View>

              <View style={[styles.mobileSupportStack, { marginTop: mobileSupportOffsetTop }]}>
                <View style={styles.mobileReserveRow}>
                  <View style={styles.mobileReserveCell}>
                    <PieceRail
                      label="Light Reserve"
                      color="light"
                      tokenVariant="light"
                      piecePixelSize={reservePiecePixelSize}
                      reserveCount={lightReserve}
                      active={isMyTurn}
                    />
                    <View style={[styles.focusWrap, highlight('turnBanner') && styles.focusWrapActive]}>
                      <GameStageHUD isMyTurn={isMyTurn} canRoll={canRoll} phase={gameState.phase} />
                    </View>
                  </View>
                  <View style={styles.mobileReserveCell}>
                    <PieceRail
                      label="Dark Reserve"
                      color="dark"
                      tokenVariant="dark"
                      piecePixelSize={reservePiecePixelSize}
                      reserveCount={darkReserve}
                      active={!isMyTurn}
                    />
                    <View style={[styles.focusWrap, highlight('dice') && styles.focusWrapActive]}>
                      <Dice
                        value={displayRollValue}
                        rolling={rollingVisual}
                        onRoll={() => { }}
                        canRoll={false}
                        mode="stage"
                        compact={compactSupportPanels}
                        showNumericResult={!compactSupportPanels}
                      />
                    </View>
                  </View>
                </View>

                <View style={[styles.focusWrap, highlight('controls') && styles.focusWrapActive]}>
                  <TutorialControls
                    steps={WATCH_TUTORIAL_SCRIPT}
                    stepIndex={stepIndex}
                    isPlaying={isPlaying}
                    speed={speed}
                    controlsLocked={controlsLocked}
                    onTogglePlay={handleTogglePlay}
                    onNext={handleNextStep}
                    onBack={handleBackStep}
                    onRestart={handleRestart}
                    onToggleSpeed={() => setSpeed((prev) => (prev === 1 ? 2 : 1))}
                  />
                </View>
              </View>
            </View>
          )}
        </View>
      </View>

      <TutorialModal visible={Boolean(activeModalStep)} step={activeModalStep} onContinue={handleContinueModal} />
      <HowToPlayModal visible={showHowToPlay} onClose={() => setShowHowToPlay(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#D9C39A',
  },
  backdropLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
    backgroundColor: '#D9C39A',
  },
  backdropImage: {
    position: 'absolute',
    opacity: 1,
  },
  stageViewport: {
    flex: 1,
    paddingHorizontal: urTheme.spacing.md,
    alignItems: 'center',
  },
  stageWrap: {
    width: '100%',
    maxWidth: urTheme.layout.stage.maxWidth,
    flex: 1,
    minHeight: 0,
  },
  topChrome: {
    position: 'absolute',
    left: urTheme.spacing.xs,
    right: urTheme.spacing.xs,
    zIndex: 7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: urTheme.spacing.sm,
  },
  topChromeLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: urTheme.spacing.xs,
  },
  topChromeRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: urTheme.spacing.xs,
    flexShrink: 0,
  },
  topChromeIconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: 'rgba(217, 164, 65, 0.78)',
    backgroundColor: 'rgba(13, 15, 18, 0.38)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  topChromeTitle: {
    ...urTypography.label,
    color: urTheme.colors.clay,
    fontSize: 13,
    letterSpacing: 0.35,
    ...textShadow({
      color: 'rgba(0, 0, 0, 0.45)',
      offset: { width: 0, height: 1 },
      blurRadius: 2,
    }),
    flexShrink: 1,
  },
  scoreRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: urTheme.spacing.sm,
    flexShrink: 0,
  },
  scoreRowOverlay: {
    position: 'absolute',
    left: urTheme.spacing.xs,
    right: urTheme.spacing.xs,
    zIndex: 5,
  },
  scoreRowOverlayMobile: {
    right: urTheme.spacing.sm,
  },
  boardClusterWide: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'stretch',
    flex: 1,
    minHeight: 0,
  },
  boardClusterMobile: {
    width: '100%',
    flex: 1,
    minHeight: 0,
  },
  sideColumn: {
    justifyContent: 'flex-start',
    gap: urTheme.spacing.sm,
    flexShrink: 0,
  },
  boardCenterColumn: {
    flex: 1,
    minWidth: 0,
    minHeight: 0,
  },
  boardViewport: {
    flex: 1,
    minHeight: 0,
    width: '100%',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  mobileSupportStack: {
    width: '100%',
    gap: urTheme.spacing.sm,
    flexShrink: 0,
  },
  mobileReserveRow: {
    width: '100%',
    flexDirection: 'row',
    gap: urTheme.spacing.md,
    alignItems: 'flex-start',
  },
  mobileReserveCell: {
    flex: 1,
    minWidth: 0,
    gap: urTheme.spacing.sm,
  },
  boardCard: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginTop: 2,
    marginBottom: 2,
  },
  focusWrap: {
    width: '100%',
    borderRadius: urTheme.radii.md,
  },
  focusWrapActive: {
    borderWidth: 1.2,
    borderColor: 'rgba(111, 184, 255, 0.92)',
    ...boxShadow({
      color: urTheme.colors.glow,
      opacity: 0.22,
      blurRadius: 10,
      elevation: 6,
    }),
    backgroundColor: 'rgba(111, 184, 255, 0.05)',
  },

  headerHelpButton: {
    minHeight: 34,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: urTheme.radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(217, 164, 65, 0.78)',
    backgroundColor: 'rgba(13, 15, 18, 0.38)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerHelpButtonPressed: {
    opacity: 0.8,
  },
  headerHelpLabel: {
    ...urTypography.label,
    color: urTheme.colors.parchment,
    fontSize: 11,
    letterSpacing: 0.8,
  },
  errorWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: urTheme.spacing.lg,
    gap: urTheme.spacing.sm,
  },
  errorTitle: {
    ...urTypography.title,
    color: urTheme.colors.parchment,
    fontSize: 28,
    textAlign: 'center',
  },
  errorText: {
    color: 'rgba(247, 229, 203, 0.92)',
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
  },
  errorButtonWrap: {
    width: '100%',
    maxWidth: 260,
    marginTop: urTheme.spacing.sm,
  },
});
