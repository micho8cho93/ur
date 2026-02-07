import { Board } from '@/components/game/Board';
import { Dice } from '@/components/game/Dice';
import { EdgeScore } from '@/components/game/EdgeScore';
import { GameStageHUD } from '@/components/game/GameStageHUD';
import { PieceRail } from '@/components/game/PieceRail';
import { Modal } from '@/components/ui/Modal';
import { urTheme, urTextures, urTypography } from '@/constants/urTheme';
import { hasNakamaConfig } from '@/config/nakama';
import { useGameLoop } from '@/hooks/useGameLoop';
import { nakamaService } from '@/services/nakama';
import { useGameStore } from '@/store/useGameStore';
import { MatchData, MatchPresenceEvent, Socket } from '@heroiclabs/nakama-js';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef } from 'react';
import { Image, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

const OP_MOVE = 1;

export default function GameRoom() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const matchId = useMemo(() => (Array.isArray(id) ? id[0] : id), [id]);
  const isOffline = useMemo(
    () => !hasNakamaConfig() || String(matchId ?? '').startsWith('local-'),
    [matchId],
  );

  const gameState = useGameStore((state) => state.gameState);
  const roll = useGameStore((state) => state.roll);
  const reset = useGameStore((state) => state.reset);
  const initGame = useGameStore((state) => state.initGame);
  const setMatchId = useGameStore((state) => state.setMatchId);
  const setGameStateFromServer = useGameStore((state) => state.setGameStateFromServer);
  const updateMatchPresences = useGameStore((state) => state.updateMatchPresences);
  const setSocketState = useGameStore((state) => state.setSocketState);
  const setMatchMoveSender = useGameStore((state) => state.setMatchMoveSender);

  const isMyTurn = gameState.currentTurn === 'light';
  const canRoll = isMyTurn && gameState.phase === 'rolling';

  const [showWinModal, setShowWinModal] = React.useState(false);
  const [rollingVisual, setRollingVisual] = React.useState(false);
  const rollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useGameLoop(isOffline);

  useEffect(() => {
    if (gameState.winner) {
      setShowWinModal(true);
    }
  }, [gameState.winner]);

  useEffect(() => {
    if (!matchId) return;
    initGame(matchId);
    setMatchId(matchId);
  }, [initGame, matchId, setMatchId]);

  const socketRef = useRef<Socket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!matchId) return;
    if (isOffline) {
      setSocketState('connected');
      return;
    }

    let isMounted = true;

    const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> => {
      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs);
      });
      try {
        return await Promise.race([promise, timeoutPromise]);
      } finally {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      }
    };

    const handleMatchData = (matchData: MatchData) => {
      if (matchData.match_id !== matchId) return;

      let rawData = '';
      if (typeof matchData.data === 'string') {
        rawData = matchData.data;
      } else if (typeof TextDecoder !== 'undefined') {
        rawData = new TextDecoder().decode(matchData.data);
      } else {
        return;
      }

      try {
        const payload = JSON.parse(rawData);
        const nextState = payload?.state ?? payload?.gameState ?? payload;
        if (nextState?.currentTurn) {
          setGameStateFromServer(nextState);
        }
      } catch {
        // Ignore malformed payloads.
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
        setSocketState('disconnected');
        if (reconnectTimerRef.current) {
          return;
        }
        reconnectTimerRef.current = setTimeout(() => {
          reconnectTimerRef.current = null;
          void connectAndJoin(true);
        }, 1500);
      };
    };

    const connectAndJoin = async (isReconnect = false) => {
      try {
        setSocketState('connecting');
        const socket =
          nakamaService.getSocket() ??
          (await withTimeout(
            nakamaService.connectSocket(),
            10_000,
            'Connecting to the match server timed out.',
          ));
        attachSocketHandlers(socket);
        const match = await withTimeout(socket.joinMatch(matchId), 10_000, 'Joining the match timed out.');
        if (!isMounted) return;
        setMatchId(match.match_id);
        setSocketState('connected');
        const reconnectMetadata = (match as { metadata?: string }).metadata;
        if (isReconnect && reconnectMetadata) {
          try {
            const metadata = JSON.parse(reconnectMetadata);
            const state = metadata?.state ?? metadata;
            if (state?.currentTurn) {
              setGameStateFromServer(state);
            }
          } catch {
            // ignore metadata parse errors
          }
        }
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
      if (socketRef.current) {
        socketRef.current.onmatchdata = () => {};
        socketRef.current.onmatchpresence = () => {};
      }
    };
  }, [isOffline, matchId, setGameStateFromServer, setMatchId, setSocketState, updateMatchPresences]);

  useEffect(() => {
    if (!matchId) return;
    if (isOffline) {
      setMatchMoveSender(null);
      return;
    }

    const sendMove = async (move: { pieceId: string; fromIndex: number; toIndex: number }) => {
      const socket = socketRef.current;
      if (!socket) return;
      const payload = JSON.stringify({ op: 'move', move });
      await socket.sendMatchState(matchId, OP_MOVE, payload);
    };

    setMatchMoveSender(() => sendMove);

    return () => {
      setMatchMoveSender(null);
    };
  }, [isOffline, matchId, setMatchMoveSender]);

  useEffect(() => {
    return () => {
      if (rollTimerRef.current) {
        clearTimeout(rollTimerRef.current);
      }
    };
  }, []);

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
    setShowWinModal(false);
    reset();
    router.replace('/');
  };

  const recentHistory = gameState.history.slice(-4).reverse();
  const lightReserve = gameState.light.pieces.filter((piece) => !piece.isFinished && piece.position === -1).length;
  const darkReserve = gameState.dark.pieces.filter((piece) => !piece.isFinished && piece.position === -1).length;

  const isWide = width >= 980;
  const isNarrow = width < 720;

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: `Game #${id}` }} />
      <Image source={urTextures.woodDark} resizeMode="repeat" style={styles.pageTexture} />
      <View style={styles.pageGlowTop} />
      <View style={styles.pageGlowMiddle} />
      <View style={styles.pageShadeBottom} />
      <View style={styles.vignetteTop} />
      <View style={styles.vignetteBottom} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.stageWrap, isWide && styles.stageWrapWide]}>
          {!isWide && (
            <View style={styles.mobileTopRail}>
              <PieceRail
                label="Dark Pieces"
                color="dark"
                tokenVariant="light"
                reserveCount={darkReserve}
                active={!isMyTurn}
              />
            </View>
          )}

          <View style={[styles.stageColumns, isWide && styles.stageColumnsWide]}>
            {isWide && (
              <View style={styles.sideRailCol}>
                <PieceRail
                  label="Dark Pieces"
                  color="dark"
                  tokenVariant="light"
                  reserveCount={darkReserve}
                  active={!isMyTurn}
                />
                <EdgeScore label="Dark Score" value={`${gameState.dark.finishedCount}/7`} active={!isMyTurn} />
              </View>
            )}

            <View style={styles.boardCol}>
              {!isWide && (
                <View style={styles.mobileScoreRow}>
                  <EdgeScore label="Dark" value={`${gameState.dark.finishedCount}/7`} active={!isMyTurn} />
                  <EdgeScore label="Light" value={`${gameState.light.finishedCount}/7`} active={isMyTurn} align="right" />
                </View>
              )}

              <GameStageHUD isMyTurn={isMyTurn} canRoll={canRoll} phase={gameState.phase} />

              <View style={styles.boardCard}>
                <Board showRailHints={isWide} highlightMode="theatrical" boardScale={isNarrow ? 0.96 : 1} />
              </View>

              {recentHistory.length > 0 && (
                <View style={styles.historyStrip}>
                  <Text style={styles.historyTitle}>Recent</Text>
                  {recentHistory.map((entry, index) => (
                    <Text key={`${entry}-${index}`} style={styles.historyEntry}>
                      {entry}
                    </Text>
                  ))}
                </View>
              )}
            </View>

            {isWide && (
              <View style={styles.sideRailCol}>
                <PieceRail
                  label="Easy Bot Pieces"
                  color="light"
                  tokenVariant="reserve"
                  reserveCount={lightReserve}
                  active={isMyTurn}
                />
                <Dice
                  value={gameState.rollValue}
                  rolling={rollingVisual}
                  onRoll={handleRoll}
                  canRoll={canRoll}
                  mode="stage"
                />
                <EdgeScore label="Light Score" value={`${gameState.light.finishedCount}/7`} active={isMyTurn} align="right" />
              </View>
            )}
          </View>

          {!isWide && (
            <View style={styles.mobileBottomRail}>
              <PieceRail
                label="Easy Bot Pieces"
                color="light"
                tokenVariant="reserve"
                reserveCount={lightReserve}
                active={isMyTurn}
              />
              <Dice
                value={gameState.rollValue}
                rolling={rollingVisual}
                onRoll={handleRoll}
                canRoll={canRoll}
                mode="stage"
              />
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={showWinModal}
        title={gameState.winner === 'light' ? 'Victory' : 'Defeat'}
        message={gameState.winner === 'light' ? 'The royal path is yours.' : 'The opponent seized the final lane.'}
        actionLabel="Return to Menu"
        onAction={handleExit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: urTheme.colors.night,
  },
  pageTexture: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.28,
  },
  pageGlowTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '32%',
    backgroundColor: 'rgba(84, 130, 182, 0.18)',
  },
  pageGlowMiddle: {
    position: 'absolute',
    top: '34%',
    left: 0,
    right: 0,
    height: '32%',
    backgroundColor: 'rgba(33, 58, 93, 0.14)',
  },
  pageShadeBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '45%',
    backgroundColor: 'rgba(6, 12, 22, 0.34)',
  },
  vignetteTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  vignetteBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 140,
    backgroundColor: 'rgba(0, 0, 0, 0.24)',
  },
  scrollContent: {
    paddingHorizontal: urTheme.spacing.md,
    paddingTop: urTheme.spacing.md,
    paddingBottom: urTheme.spacing.xl,
    alignItems: 'center',
  },
  stageWrap: {
    width: '100%',
    maxWidth: urTheme.layout.stage.maxWidth,
    gap: urTheme.spacing.md,
  },
  stageWrapWide: {
    paddingHorizontal: urTheme.spacing.sm,
  },
  stageColumns: {
    width: '100%',
    gap: urTheme.spacing.md,
  },
  stageColumnsWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: urTheme.layout.stage.gutter,
  },
  sideRailCol: {
    width: '22%',
    minWidth: urTheme.layout.stage.sideRailMin,
    maxWidth: urTheme.layout.stage.sideRailMax,
    gap: urTheme.spacing.md,
  },
  boardCol: {
    flex: 1,
    maxWidth: urTheme.layout.boardMax + 70,
    gap: urTheme.spacing.md,
    alignItems: 'center',
  },
  boardCard: {
    width: '100%',
    alignItems: 'center',
  },
  mobileTopRail: {
    width: '100%',
  },
  mobileBottomRail: {
    width: '100%',
    gap: urTheme.spacing.md,
  },
  mobileScoreRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  historyStrip: {
    width: '100%',
    borderRadius: urTheme.radii.md,
    borderWidth: 1,
    borderColor: 'rgba(217, 164, 65, 0.44)',
    backgroundColor: 'rgba(9, 14, 20, 0.64)',
    paddingHorizontal: urTheme.spacing.md,
    paddingVertical: urTheme.spacing.sm,
    overflow: 'hidden',
  },
  historyTitle: {
    ...urTypography.label,
    fontSize: 10,
    color: 'rgba(241, 230, 208, 0.72)',
    marginBottom: 6,
  },
  historyEntry: {
    color: 'rgba(244, 230, 206, 0.86)',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 4,
  },
});
