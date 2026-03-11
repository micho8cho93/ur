import {
  Board,
  BoardImageLayoutFrame,
  BOARD_IMAGE_SOURCE,
  getBoardPiecePixelSize,
} from '@/components/game/Board';
import { BoardDropIntro } from '@/components/game/BoardDropIntro';
import { Dice } from '@/components/game/Dice';
import { EdgeScore } from '@/components/game/EdgeScore';
import { GameStageHUD } from '@/components/game/GameStageHUD';
import { HowToPlayModal } from '@/components/HowToPlayModal';
import { PieceRail, ReserveSlotMeasurement } from '@/components/game/PieceRail';
import { ReserveCascadeIntro, ReserveCascadePieceTarget } from '@/components/game/ReserveCascadeIntro';
import { Modal } from '@/components/ui/Modal';
import { urTheme, urTypography } from '@/constants/urTheme';
import { hasNakamaConfig, isNakamaEnabled } from '@/config/nakama';
import { useGameLoop } from '@/hooks/useGameLoop';
import { DEFAULT_BOT_DIFFICULTY, isBotDifficulty } from '@/logic/bot/types';
import { BOARD_COLS, BOARD_ROWS } from '@/logic/constants';
import { PlayerColor } from '@/logic/types';
import { gameAudio } from '@/services/audio';
import { nakamaService } from '@/services/nakama';
import { useGameStore } from '@/store/useGameStore';
import {
  MatchOpCode,
  MoveRequestPayload,
  RollRequestPayload,
  decodePayload,
  encodePayload,
  isServerErrorPayload,
  isStateSnapshotPayload,
} from '@/shared/urMatchProtocol';
import { MatchData, MatchPresenceEvent, Socket } from '@heroiclabs/nakama-js';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef } from 'react';
import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const UR_BG_IMAGE = require('../../assets/images/ur_bg.png');

interface BoardTargetFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function GameRoom() {
  const { id, offline, botDifficulty } = useLocalSearchParams<{
    id?: string | string[];
    offline?: string | string[];
    botDifficulty?: string | string[];
  }>();
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const matchId = useMemo(() => (Array.isArray(id) ? id[0] : id), [id]);
  const offlineParam = useMemo(() => (Array.isArray(offline) ? offline[0] : offline), [offline]);
  const botDifficultyParam = useMemo(
    () => (Array.isArray(botDifficulty) ? botDifficulty[0] : botDifficulty),
    [botDifficulty],
  );
  const resolvedBotDifficulty = useMemo(
    () => (isBotDifficulty(botDifficultyParam) ? botDifficultyParam : DEFAULT_BOT_DIFFICULTY),
    [botDifficultyParam],
  );
  const isOffline = useMemo(
    () =>
      offlineParam === '1' ||
      !isNakamaEnabled() ||
      !hasNakamaConfig() ||
      String(matchId ?? '').startsWith('local-'),
    [matchId, offlineParam],
  );

  const gameState = useGameStore((state) => state.gameState);
  const roll = useGameStore((state) => state.roll);
  const reset = useGameStore((state) => state.reset);
  const userId = useGameStore((state) => state.userId);
  const playerColor = useGameStore((state) => state.playerColor);
  const initGame = useGameStore((state) => state.initGame);
  const setMatchId = useGameStore((state) => state.setMatchId);
  const storedMatchId = useGameStore((state) => state.matchId);
  const matchToken = useGameStore((state) => state.matchToken);
  const serverRevision = useGameStore((state) => state.serverRevision);
  const applyServerSnapshot = useGameStore((state) => state.applyServerSnapshot);
  const setPlayerColor = useGameStore((state) => state.setPlayerColor);
  const setOnlineMode = useGameStore((state) => state.setOnlineMode);
  const updateMatchPresences = useGameStore((state) => state.updateMatchPresences);
  const setSocketState = useGameStore((state) => state.setSocketState);
  const setRollCommandSender = useGameStore((state) => state.setRollCommandSender);
  const setMoveCommandSender = useGameStore((state) => state.setMoveCommandSender);

  const hasAssignedColor = playerColor === 'light' || playerColor === 'dark';
  const effectiveMatchToken = storedMatchId === matchId ? matchToken : null;
  const isMyTurn = hasAssignedColor && gameState.currentTurn === playerColor;
  const canRoll = isMyTurn && gameState.phase === 'rolling';
  const didPlayerWin =
    gameState.winner !== null && hasAssignedColor ? gameState.winner === playerColor : gameState.winner === 'light';
  const winModalTitle = didPlayerWin ? 'Victory' : 'Defeat';
  const winModalMessage = didPlayerWin ? 'The royal path is yours.' : 'The opponent seized the final lane.';

  const [showWinModal, setShowWinModal] = React.useState(false);
  const [showHowToPlay, setShowHowToPlay] = React.useState(false);
  const [rollingVisual, setRollingVisual] = React.useState(false);
  const [showScoreBanner, setShowScoreBanner] = React.useState(false);
  const [boardSlotSize, setBoardSlotSize] = React.useState({ width: 0, height: 0 });
  const [boardTargetFrame, setBoardTargetFrame] = React.useState<BoardTargetFrame | null>(null);
  const [lightReserveSlots, setLightReserveSlots] = React.useState<ReserveSlotMeasurement[]>([]);
  const [darkReserveSlots, setDarkReserveSlots] = React.useState<ReserveSlotMeasurement[]>([]);
  const [showBoardDropIntro, setShowBoardDropIntro] = React.useState(false);
  const [hasPlayedBoardDropIntro, setHasPlayedBoardDropIntro] = React.useState(false);
  const [showReserveCascadeIntro, setShowReserveCascadeIntro] = React.useState(false);
  const [hasPlayedReserveCascadeIntro, setHasPlayedReserveCascadeIntro] = React.useState(false);
  const boardMeasureRef = useRef<View | null>(null);
  const boardImageLayoutRef = useRef<BoardImageLayoutFrame | null>(null);
  const rollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scoreBannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const syncBoardTargetFrame = React.useCallback(() => {
    const boardImageLayout = boardImageLayoutRef.current;
    const boardNode = boardMeasureRef.current;

    if (!boardImageLayout || !boardNode) {
      return;
    }

    requestAnimationFrame(() => {
      boardNode.measureInWindow((x, y) => {
        const nextFrame = {
          x: x + boardImageLayout.x,
          y: y + boardImageLayout.y,
          width: boardImageLayout.width,
          height: boardImageLayout.height,
        };

        setBoardTargetFrame((previous) =>
          previous &&
            previous.x === nextFrame.x &&
            previous.y === nextFrame.y &&
            previous.width === nextFrame.width &&
            previous.height === nextFrame.height
            ? previous
            : nextFrame,
        );
      });
    });
  }, []);

  const handleLiveBoardImageLayout = React.useCallback(
    (layout: BoardImageLayoutFrame) => {
      boardImageLayoutRef.current = layout;
      syncBoardTargetFrame();
    },
    [syncBoardTargetFrame],
  );

  useGameLoop(isOffline);

  useEffect(() => {
    if (gameState.winner) {
      setShowWinModal(true);
    }
  }, [gameState.winner]);

  useEffect(() => {
    boardImageLayoutRef.current = null;
    setBoardTargetFrame(null);
    setShowBoardDropIntro(false);
    setHasPlayedBoardDropIntro(false);
    setLightReserveSlots([]);
    setDarkReserveSlots([]);
    setShowReserveCascadeIntro(false);
    setHasPlayedReserveCascadeIntro(false);
  }, [matchId]);

  useEffect(() => {
    if (!matchId) return;
    if (isOffline || storedMatchId !== matchId) {
      initGame(matchId, { botDifficulty: resolvedBotDifficulty });
    }
    setMatchId(matchId);
  }, [initGame, isOffline, matchId, resolvedBotDifficulty, setMatchId, storedMatchId]);

  const socketRef = useRef<Socket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!matchId) return;
    if (isOffline) {
      setOnlineMode('offline');
      setPlayerColor('light');
      setSocketState('connected');
      return;
    }

    setOnlineMode('nakama');

    let isMounted = true;

    const handleMatchData = (matchData: MatchData) => {
      if (matchData.match_id !== matchId) return;

      let rawData = '';
      if (typeof matchData.data === 'string') {
        rawData = matchData.data;
      } else if (typeof TextDecoder !== 'undefined') {
        rawData = new TextDecoder().decode(matchData.data);
      } else {
        rawData = String.fromCharCode(...Array.from(matchData.data));
      }

      const payload = decodePayload(rawData);

      if (matchData.op_code === MatchOpCode.STATE_SNAPSHOT) {
        if (!isStateSnapshotPayload(payload)) {
          return;
        }
        const assignedColorFromSnapshot = userId
          ? (payload.assignments[userId] as PlayerColor | undefined)
          : undefined;
        console.info('[Nakama][snapshot]', {
          matchId: payload.matchId,
          revision: payload.revision,
          assignedPlayerColor: assignedColorFromSnapshot ?? null,
          phase: payload.gameState.phase,
          turn: payload.gameState.currentTurn,
          roll: payload.gameState.rollValue,
          lightFinished: payload.gameState.light.finishedCount,
          darkFinished: payload.gameState.dark.finishedCount,
        });
        applyServerSnapshot(payload.gameState, payload.revision, payload.matchId);
        if (userId) {
          const assignedColor = assignedColorFromSnapshot;
          if (assignedColor) {
            setPlayerColor(assignedColor);
          }
        }
        return;
      }

      if (matchData.op_code === MatchOpCode.SERVER_ERROR) {
        if (isServerErrorPayload(payload)) {
          console.warn('[Nakama][server_error]', {
            code: payload.code,
            message: payload.message,
            revision: payload.revision ?? null,
          });
        }
      }
    };

    const handleMatchPresence = (matchPresence: MatchPresenceEvent) => {
      if (matchPresence.match_id !== matchId) return;
      updateMatchPresences(matchPresence);
    };

    const attachSocketHandlers = (socket: Socket) => {
      socketRef.current = socket;
      socket.onmatchdata = handleMatchData;
      socket.onmatchpresence = handleMatchPresence;
      socket.ondisconnect = () => {
        nakamaService.disconnectSocket(false);
        setSocketState('disconnected');
        if (reconnectTimerRef.current) {
          return;
        }
        reconnectTimerRef.current = setTimeout(() => {
          reconnectTimerRef.current = null;
          void connectAndJoin();
        }, 1500);
      };
    };

    const connectAndJoin = async () => {
      try {
        setSocketState('connecting');
        const socket = await nakamaService.connectSocketWithRetry({
          attempts: 3,
          retryDelayMs: 1_000,
          createStatus: true,
        });
        attachSocketHandlers(socket);
        const match = effectiveMatchToken
          ? await socket.joinMatch(matchId, effectiveMatchToken)
          : await socket.joinMatch(matchId);
        if (!isMounted) return;
        setMatchId(match.match_id);
        setSocketState('connected');
      } catch (error) {
        console.error(error);
        setSocketState('error');
      }
    };

    void connectAndJoin();

    return () => {
      isMounted = false;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (!isOffline && socketRef.current && matchId) {
        void socketRef.current.leaveMatch(matchId).catch(() => { });
      }
      if (socketRef.current) {
        socketRef.current.onmatchdata = () => { };
        socketRef.current.onmatchpresence = () => { };
        socketRef.current.ondisconnect = () => { };
      }
    };
  }, [
    applyServerSnapshot,
    isOffline,
    matchId,
    effectiveMatchToken,
    setMatchId,
    setOnlineMode,
    setPlayerColor,
    setSocketState,
    updateMatchPresences,
    userId,
  ]);

  useEffect(() => {
    if (!matchId) return;
    if (isOffline) {
      setRollCommandSender(null);
      setMoveCommandSender(null);
      return;
    }

    const sendRoll = async () => {
      const socket = socketRef.current;
      if (!socket) return;
      const payload: RollRequestPayload = { type: 'roll_request' };
      console.info('[Nakama][send]', {
        eventType: payload.type,
        matchId,
        revision: serverRevision,
        payload,
      });
      await socket.sendMatchState(matchId, MatchOpCode.ROLL_REQUEST, encodePayload(payload));
    };

    const sendMove = async (move: { pieceId: string; fromIndex: number; toIndex: number }) => {
      const socket = socketRef.current;
      if (!socket) return;
      const payload: MoveRequestPayload = { type: 'move_request', move };
      console.info('[Nakama][send]', {
        eventType: payload.type,
        matchId,
        revision: serverRevision,
        payload,
      });
      await socket.sendMatchState(matchId, MatchOpCode.MOVE_REQUEST, encodePayload(payload));
    };

    setRollCommandSender(sendRoll);
    setMoveCommandSender(sendMove);

    return () => {
      setRollCommandSender(null);
      setMoveCommandSender(null);
    };
  }, [isOffline, matchId, serverRevision, setMoveCommandSender, setRollCommandSender]);

  useEffect(() => {
    return () => {
      if (rollTimerRef.current) {
        clearTimeout(rollTimerRef.current);
      }
      if (scoreBannerTimerRef.current) {
        clearTimeout(scoreBannerTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    void gameAudio.start();

    return () => {
      void gameAudio.stopAll();
    };
  }, []);

  const previousStateRef = useRef(gameState);

  useEffect(() => {
    const previous = previousStateRef.current;

    if (previous.rollValue !== gameState.rollValue && gameState.rollValue !== null) {
      void gameAudio.play('roll');
    }

    if (gameState.history.length > previous.history.length) {
      const newEntries = gameState.history.slice(previous.history.length);
      for (const entry of newEntries) {
        if (entry.includes('captured')) {
          void gameAudio.play('capture');
        } else if (entry.includes('moved to')) {
          void gameAudio.play('move');
        }
      }
    }

    if (
      gameState.light.finishedCount > previous.light.finishedCount ||
      gameState.dark.finishedCount > previous.dark.finishedCount
    ) {
      void gameAudio.play('score');

      if (hasAssignedColor) {
        const didIScore =
          playerColor === 'light'
            ? gameState.light.finishedCount > previous.light.finishedCount
            : gameState.dark.finishedCount > previous.dark.finishedCount;

        if (didIScore) {
          setShowScoreBanner(true);
          if (scoreBannerTimerRef.current) {
            clearTimeout(scoreBannerTimerRef.current);
          }
          scoreBannerTimerRef.current = setTimeout(() => {
            setShowScoreBanner(false);
            scoreBannerTimerRef.current = null;
          }, 1500);
        }
      }
    }

    if (!previous.winner && gameState.winner) {
      void gameAudio.play('win');
    }

    previousStateRef.current = gameState;
  }, [gameState, hasAssignedColor, playerColor]);

  const handleRoll = () => {
    if (!canRoll || rollingVisual) return;

    setRollingVisual(true);
    roll();
    if (rollTimerRef.current) {
      clearTimeout(rollTimerRef.current);
    }
    rollTimerRef.current = setTimeout(() => {
      setRollingVisual(false);
      rollTimerRef.current = null;
    }, 560);
  };

  const handleExit = () => {
    if (!isOffline && socketRef.current && matchId) {
      void socketRef.current.leaveMatch(matchId).catch(() => { });
      nakamaService.disconnectSocket(true);
    }
    setShowWinModal(false);
    reset();
    router.replace('/');
  };

  const lightReserve = gameState.light.pieces.filter((piece) => !piece.isFinished && piece.position === -1).length;
  const darkReserve = gameState.dark.pieces.filter((piece) => !piece.isFinished && piece.position === -1).length;
  const matchTitle = `Game #${matchId ?? 'local'}`;

  const viewportHorizontalPadding = 0;
  const stageContentWidth = Math.min(Math.max(width - viewportHorizontalPadding * 2, 0), urTheme.layout.stage.maxWidth);
  const useSideColumns = width >= 760;
  const boardClusterGap = useSideColumns ? urTheme.spacing.xs : urTheme.spacing.sm;
  const sideColumnWidth = useSideColumns
    ? Math.max(88, Math.min(264, Math.floor(stageContentWidth * (width < 720 ? 0.2 : 0.24))))
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
  const boardSlotHeight = boardSlotSize.height > 0 ? boardSlotSize.height : Math.max(0, height * (useSideColumns ? 0.9 : 0.45));
  const boardWidthLimitByHeight = Math.min(
    urTheme.layout.boardMax,
    boardOuterPadding +
    (Math.max(0, boardSlotHeight - boardOuterPadding - verticalBoardGapTotal) * verticalBoardCols) /
    verticalBoardRows,
  );
  const widenedBoardLayoutTarget = Math.min(urTheme.layout.boardMax, boardWidthLimitByLayout * 1.5);
  const targetBoardWidth = Math.max(110, Math.min(widenedBoardLayoutTarget, boardWidthLimitByHeight, boardSlotWidth));
  const isMobileLayout = width < 760;
  const mobileBoardScaleBoost = isMobileLayout ? 1 : 1;
  const boardScale = Math.max(
    0.24,
    Math.min(1.2, (targetBoardWidth / Math.max(boardBaseWidth, 1)) * mobileBoardScaleBoost),
  );
  const reservePiecePixelSize = useMemo(
    () => getBoardPiecePixelSize({ viewportWidth: width, boardScale, orientation: 'vertical' }),
    [boardScale, width],
  );
  const compactSupportUi = width <= 1024;
  const scaledReservePiecePixelSize = compactSupportUi
    ? Math.max(12, Math.round(reservePiecePixelSize * (width < 760 ? 0.72 : 0.84)))
    : reservePiecePixelSize;
  const stageGap = height < 760 ? urTheme.spacing.xs : urTheme.spacing.sm;
  const viewportTopPadding = 0;
  const viewportBottomPadding = Math.max(insets.bottom, urTheme.spacing.xs);
  const topChromeTop = insets.top + urTheme.spacing.xs;
  const topChromeHeight = 36;
  const scoreOverlayTop = topChromeTop + topChromeHeight + urTheme.spacing.xs;
  const backdropOverscan = Math.ceil(Math.max(width, height) * 0.025);
  const canvasTopEdgeLift = Math.max(24, Math.min(96, Math.round(height * 0.07)));
  const supportColumnBottomInset = Math.max(viewportBottomPadding + Math.round(height * 0.02), urTheme.spacing.sm);
  const supportColumnTopInset = Math.max(
    scoreOverlayTop + urTheme.spacing.sm,
    Math.round(height * 0.74) - (compactSupportUi ? 188 : 244),
  );
  const mobileBoardOffsetTop = isMobileLayout
    ? Math.max(scoreOverlayTop - urTheme.spacing.xs, Math.round(height * 0.100))
    : 0;
  const mobileScoreRowInset = Math.max(urTheme.spacing.xs, Math.round(width / 65));
  const mobileScoreIndicatorGap = Math.max(10, Math.round(width * 0.6));

  const reserveCascadeTargets = useMemo<ReserveCascadePieceTarget[]>(() => {
    const orderedLight = [...lightReserveSlots].sort((a, b) => a.index - b.index);
    const orderedDark = [...darkReserveSlots].sort((a, b) => a.index - b.index);

    return [...orderedLight, ...orderedDark].map((slot, index) => ({
      key: `${slot.color}-${slot.index}`,
      color: slot.color,
      x: slot.x,
      y: slot.y,
      size: slot.size,
      order: index,
    }));
  }, [darkReserveSlots, lightReserveSlots]);

  const isBoardTargetFrameReady =
    boardTargetFrame !== null &&
    boardTargetFrame.width > 0 &&
    boardTargetFrame.height > 0 &&
    boardSlotSize.width > 0 &&
    boardSlotSize.height > 0;

  const shouldHideReservePieces = !hasPlayedReserveCascadeIntro;

  useEffect(() => {
    if (hasPlayedBoardDropIntro || showBoardDropIntro) return;
    if (!isBoardTargetFrameReady) return;

    setShowBoardDropIntro(true);
  }, [hasPlayedBoardDropIntro, isBoardTargetFrameReady, showBoardDropIntro]);

  useEffect(() => {
    if (!hasPlayedBoardDropIntro) return;
    if (hasPlayedReserveCascadeIntro || showReserveCascadeIntro) return;
    if (reserveCascadeTargets.length === 0) return;
    if (lightReserveSlots.length !== lightReserve) return;
    if (darkReserveSlots.length !== darkReserve) return;

    setShowReserveCascadeIntro(true);
  }, [
    darkReserve,
    darkReserveSlots.length,
    hasPlayedBoardDropIntro,
    hasPlayedReserveCascadeIntro,
    lightReserve,
    lightReserveSlots.length,
    reserveCascadeTargets.length,
    showReserveCascadeIntro,
  ]);

  const liveBoard = (
    <View
      ref={boardMeasureRef}
      collapsable={false}
      onLayout={syncBoardTargetFrame}
      style={styles.liveBoardMeasure}
    >
      <View style={[styles.liveBoardWrap, !hasPlayedBoardDropIntro && styles.liveBoardHidden]}>
        <Board
          showRailHints
          highlightMode="theatrical"
          boardScale={boardScale}
          orientation="vertical"
          onBoardImageLayout={handleLiveBoardImageLayout}
        />
      </View>
    </View>
  );

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
            onPress={handleExit}
            accessibilityRole="button"
            accessibilityLabel="Exit game"
            style={({ pressed }) => [
              styles.topChromeIconButton,
              isMobileLayout && styles.topChromeIconButtonMobile,
              pressed && styles.headerHelpButtonPressed,
            ]}
          >
            <MaterialIcons
              name="arrow-back"
              size={20}
              color={urTheme.colors.glow}
            />
          </Pressable>
          <Text numberOfLines={1} style={styles.topChromeTitle}>
            {matchTitle}
          </Text>
        </View>

        <Pressable
          onPress={() => setShowHowToPlay(true)}
          accessibilityRole="button"
          accessibilityLabel="Open how to play instructions"
          style={({ pressed }) => [
            styles.headerHelpButton,
            isMobileLayout && styles.headerHelpButtonMobile,
            pressed && styles.headerHelpButtonPressed,
          ]}
        >
          <Text style={[styles.headerHelpLabel, isMobileLayout && styles.headerHelpLabelMobile]}>Help</Text>
        </Pressable>
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
              isMobileLayout && { left: mobileScoreRowInset - 3, right: mobileScoreRowInset - 2 },
              isMobileLayout && { justifyContent: 'center', gap: mobileScoreIndicatorGap },
            ]}
          >
            <EdgeScore
              label="Light Score"
              value={`${gameState.light.finishedCount}/7`}
              active={isMyTurn}
            />
            <EdgeScore
              label="Dark Score"
              value={`${gameState.dark.finishedCount}/7`}
              active={!isMyTurn}
              align="right"
            />
          </View>

          {useSideColumns ? (
            <View style={[styles.boardClusterWide, { gap: boardClusterGap }]}>
              <View
                style={[
                  styles.sideColumn,
                  {
                    width: sideColumnWidth,
                    paddingTop: supportColumnTopInset,
                    paddingBottom: supportColumnBottomInset,
                  },
                ]}
              >
                <PieceRail
                  label="Light Reserve"
                  color="light"
                  tokenVariant="light"
                  piecePixelSize={scaledReservePiecePixelSize}
                  reserveCount={lightReserve}
                  active={isMyTurn}
                  hideReservePieces={shouldHideReservePieces}
                  onReserveSlotsLayout={setLightReserveSlots}
                />
                <GameStageHUD isMyTurn={isMyTurn} canRoll={canRoll} phase={gameState.phase} compact={compactSupportUi} />
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
                  <View style={styles.boardCard}>
                    {liveBoard}
                  </View>
                </View>
              </View>

              <View
                style={[
                  styles.sideColumn,
                  {
                    width: sideColumnWidth,
                    paddingTop: supportColumnTopInset,
                    paddingBottom: supportColumnBottomInset,
                  },
                ]}
              >
                <PieceRail
                  label="Dark Reserve"
                  color="dark"
                  tokenVariant="dark"
                  piecePixelSize={scaledReservePiecePixelSize}
                  reserveCount={darkReserve}
                  active={!isMyTurn}
                  hideReservePieces={shouldHideReservePieces}
                  onReserveSlotsLayout={setDarkReserveSlots}
                />
                <Dice
                  value={gameState.rollValue}
                  rolling={rollingVisual}
                  onRoll={handleRoll}
                  canRoll={canRoll}
                  mode="stage"
                  compact={compactSupportUi}
                />
              </View>
            </View>
          ) : (
            <View
              style={[
                styles.boardClusterMobile,
                {
                  gap: urTheme.spacing.sm,
                  paddingTop: mobileBoardOffsetTop,
                },
              ]}
            >
              <View
                style={[styles.boardViewport]}
                onLayout={(event) => {
                  const { width: slotWidth, height: slotHeight } = event.nativeEvent.layout;
                  setBoardSlotSize((prev) =>
                    prev.width === slotWidth && prev.height === slotHeight
                      ? prev
                      : { width: slotWidth, height: slotHeight },
                  );
                }}
              >
                <View style={styles.boardCard}>
                  {liveBoard}
                </View>
              </View>

              <View style={styles.mobileSupportStack}>
                <View style={styles.mobileReserveRow}>
                  <View style={styles.mobileReserveCell}>
                    <PieceRail
                      label="Light Reserve"
                      color="light"
                      tokenVariant="light"
                      piecePixelSize={scaledReservePiecePixelSize}
                      reserveCount={lightReserve}
                      active={isMyTurn}
                      hideReservePieces={shouldHideReservePieces}
                      onReserveSlotsLayout={setLightReserveSlots}
                    />
                    <GameStageHUD isMyTurn={isMyTurn} canRoll={canRoll} phase={gameState.phase} compact={compactSupportUi} />
                  </View>

                  <View style={styles.mobileReserveCell}>
                    <PieceRail
                      label="Dark Reserve"
                      color="dark"
                      tokenVariant="dark"
                      piecePixelSize={scaledReservePiecePixelSize}
                      reserveCount={darkReserve}
                      active={!isMyTurn}
                      hideReservePieces={shouldHideReservePieces}
                      onReserveSlotsLayout={setDarkReserveSlots}
                    />
                    <Dice
                      value={gameState.rollValue}
                      rolling={rollingVisual}
                      onRoll={handleRoll}
                      canRoll={canRoll}
                      mode="stage"
                      compact={compactSupportUi}
                    />
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>
      </View>

      {showBoardDropIntro && boardTargetFrame && (
        <BoardDropIntro
          targetFrame={boardTargetFrame}
          boardSource={BOARD_IMAGE_SOURCE}
          onComplete={() => {
            setShowBoardDropIntro(false);
            setHasPlayedBoardDropIntro(true);
          }}
        />
      )}

      <ReserveCascadeIntro
        visible={showReserveCascadeIntro}
        pieceTargets={reserveCascadeTargets}
        onComplete={() => {
          setShowReserveCascadeIntro(false);
          setHasPlayedReserveCascadeIntro(true);
        }}
      />

      {showScoreBanner && (
        <View pointerEvents="none" style={styles.scoreBannerWrap}>
          <View style={styles.scoreBanner}>
            <Text style={styles.scoreBannerText}>You scored another point!</Text>
          </View>
        </View>
      )}

      <Modal
        visible={showWinModal}
        title={winModalTitle}
        message={winModalMessage}
        actionLabel="Return to Menu"
        onAction={handleExit}
      />

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
  topChromeIconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2.1,
    borderColor: 'rgba(46, 24, 10, 0.98)',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  topChromeIconButtonMobile: {
    borderWidth: 2.4,
    borderColor: 'rgba(46, 24, 10, 0.98)',
    backgroundColor: 'transparent',
    shadowColor: 'rgba(46, 24, 10, 0.92)',
    shadowOpacity: 0.32,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 6,
  },
  topChromeTitle: {
    ...urTypography.label,
    color: urTheme.colors.glow,
    fontSize: 13,
    letterSpacing: 0.35,
    textShadowColor: 'rgba(0, 0, 0, 0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
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
    gap: urTheme.spacing.md,
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
  headerHelpButton: {
    minHeight: 34,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: urTheme.radii.pill,
    borderWidth: 2.1,
    borderColor: 'rgba(46, 24, 10, 0.98)',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerHelpButtonMobile: {
    borderWidth: 2.4,
    borderColor: 'rgba(46, 24, 10, 0.98)',
    backgroundColor: 'transparent',
    shadowColor: 'rgba(46, 24, 10, 0.92)',
    shadowOpacity: 0.32,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 6,
  },
  headerHelpButtonPressed: {
    opacity: 0.8,
  },
  headerHelpLabel: {
    ...urTypography.label,
    color: urTheme.colors.glow,
    fontSize: 11,
    letterSpacing: 0.8,
  },
  headerHelpLabelMobile: {
    color: urTheme.colors.glow,
  },
  boardCard: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginTop: 2,
    marginBottom: 2,
  },
  liveBoardMeasure: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveBoardWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveBoardHidden: {
    opacity: 0,
  },
  scoreBannerWrap: {
    position: 'absolute',
    top: urTheme.spacing.lg,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 20,
  },
  scoreBanner: {
    borderRadius: urTheme.radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 220, 146, 0.86)',
    backgroundColor: 'rgba(27, 39, 23, 0.93)',
    paddingHorizontal: urTheme.spacing.md,
    paddingVertical: urTheme.spacing.xs,
    shadowColor: urTheme.colors.glow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.44,
    shadowRadius: 12,
    elevation: 9,
  },
  scoreBannerText: {
    ...urTypography.label,
    fontSize: 12,
    color: 'rgba(231, 255, 214, 0.97)',
    letterSpacing: 0.4,
  },
});
