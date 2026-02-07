import { Board } from '@/components/game/Board';
import { Dice } from '@/components/game/Dice';
import { Modal } from '@/components/ui/Modal';
import { urTheme, urTextures, urTypography } from '@/constants/urTheme';
import { hasNakamaConfig } from '@/config/nakama';
import { useGameLoop } from '@/hooks/useGameLoop';
import { nakamaService } from '@/services/nakama';
import { useGameStore } from '@/store/useGameStore';
import { MatchData, MatchPresenceEvent, Socket } from '@heroiclabs/nakama-js';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const OP_MOVE = 1;

export default function GameRoom() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

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

  const turnGlow = useSharedValue(isMyTurn ? 0.75 : 0.25);
  const turnSweep = useSharedValue(0);
  const lastTurnRef = useRef(gameState.currentTurn);

  useGameLoop(isOffline);

  useEffect(() => {
    if (gameState.winner) {
      setShowWinModal(true);
    }
  }, [gameState.winner]);

  useEffect(() => {
    if (isMyTurn) {
      turnGlow.value = withRepeat(
        withSequence(
          withTiming(0.95, { duration: 720, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.35, { duration: 720, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        true,
      );
      return;
    }

    cancelAnimation(turnGlow);
    turnGlow.value = withTiming(0.2, { duration: 220 });
  }, [isMyTurn, turnGlow]);

  useEffect(() => {
    if (lastTurnRef.current !== gameState.currentTurn) {
      turnSweep.value = 1;
      turnSweep.value = withTiming(0, { duration: 560, easing: Easing.out(Easing.cubic) });
      lastTurnRef.current = gameState.currentTurn;
    }
  }, [gameState.currentTurn, turnSweep]);

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

  const turnGlowStyle = useAnimatedStyle(() => ({
    opacity: turnGlow.value,
    transform: [{ scale: 0.95 + turnGlow.value * 0.1 }],
  }));

  const turnSweepStyle = useAnimatedStyle(() => ({
    opacity: turnSweep.value * 0.7,
    transform: [{ translateX: (1 - turnSweep.value) * 220 - 110 }],
  }));

  const recentHistory = gameState.history.slice(-5).reverse();

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: `Game #${id}` }} />
      <Image source={urTextures.woodDark} resizeMode="repeat" style={styles.pageTexture} />
      <View style={styles.pageGlowTop} />
      <View style={styles.pageShadeBottom} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.scoreRow}>
          <View style={[styles.scoreCard, isMyTurn && styles.scoreCardActive]}>
            <Image source={urTextures.lapisMosaic} resizeMode="cover" style={styles.scoreTexture} />
            <Text style={styles.scoreLabel}>You</Text>
            <Text style={styles.scoreValue}>{gameState.light.finishedCount}/7</Text>
            <Text style={styles.scoreHint}>finished</Text>
          </View>

          <View style={[styles.scoreCard, !isMyTurn && styles.scoreCardActive]}>
            <Image source={urTextures.goldInlay} resizeMode="repeat" style={styles.scoreTexture} />
            <Text style={styles.scoreLabel}>Opponent</Text>
            <Text style={styles.scoreValue}>{gameState.dark.finishedCount}/7</Text>
            <Text style={styles.scoreHint}>finished</Text>
          </View>
        </View>

        <View style={styles.turnWrap}>
          <Animated.View style={[styles.turnSweep, turnSweepStyle]} />
          <Animated.View style={[styles.turnOrb, turnGlowStyle]} />
          <View style={styles.turnTextWrap}>
            <Text style={styles.turnTitle}>{isMyTurn ? 'Your Turn' : 'Opponent Turn'}</Text>
            <Text style={styles.turnHint}>
              {canRoll
                ? 'Cast the dice to advance'
                : gameState.phase === 'moving'
                  ? 'Select a glowing destination'
                  : 'Awaiting move'}
            </Text>
          </View>
        </View>

        <View style={styles.boardCard}>
          <Board />
        </View>

        <View style={styles.controlsWrap}>
          <Dice value={gameState.rollValue} rolling={rollingVisual} onRoll={handleRoll} canRoll={canRoll} />
        </View>

        <View style={styles.logCard}>
          <Image source={urTextures.wood} resizeMode="repeat" style={styles.logTexture} />
          <View style={styles.logHeaderRow}>
            <Text style={styles.logTitle}>Game Log</Text>
            <Text style={styles.logMeta}>{gameState.history.length} events</Text>
          </View>

          {recentHistory.length === 0 ? (
            <Text style={styles.logEntryMuted}>Moves will appear here as the match unfolds.</Text>
          ) : (
            recentHistory.map((entry, index) => (
              <Text key={`${entry}-${index}`} style={styles.logEntry}>
                {entry}
              </Text>
            ))
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
    opacity: 0.26,
  },
  pageGlowTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '36%',
    backgroundColor: 'rgba(83, 122, 162, 0.2)',
  },
  pageShadeBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '46%',
    backgroundColor: 'rgba(6, 12, 22, 0.3)',
  },
  scrollContent: {
    paddingHorizontal: urTheme.spacing.md,
    paddingTop: urTheme.spacing.md,
    paddingBottom: urTheme.spacing.xl,
    alignItems: 'center',
    gap: urTheme.spacing.md,
  },
  scoreRow: {
    width: '100%',
    flexDirection: 'row',
    gap: urTheme.spacing.sm,
  },
  scoreCard: {
    flex: 1,
    borderRadius: urTheme.radii.md,
    paddingVertical: urTheme.spacing.sm,
    paddingHorizontal: urTheme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(241, 230, 208, 0.2)',
    overflow: 'hidden',
    backgroundColor: 'rgba(13, 15, 18, 0.45)',
  },
  scoreCardActive: {
    borderColor: 'rgba(111, 184, 255, 0.78)',
    shadowColor: urTheme.colors.glow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.24,
    shadowRadius: 7,
    elevation: 6,
  },
  scoreTexture: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.2,
  },
  scoreLabel: {
    ...urTypography.label,
    color: urTheme.colors.ivory,
    fontSize: 11,
    opacity: 0.85,
  },
  scoreValue: {
    marginTop: 6,
    color: '#F8E9CD',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  scoreHint: {
    marginTop: 1,
    color: 'rgba(247, 227, 194, 0.84)',
    fontSize: 11,
    letterSpacing: 0.4,
  },
  turnWrap: {
    width: '100%',
    borderRadius: urTheme.radii.pill,
    backgroundColor: 'rgba(13, 15, 18, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(217, 164, 65, 0.56)',
    paddingVertical: urTheme.spacing.sm,
    paddingHorizontal: urTheme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  turnSweep: {
    position: 'absolute',
    left: -100,
    top: 0,
    bottom: 0,
    width: 100,
    backgroundColor: 'rgba(111, 184, 255, 0.22)',
  },
  turnOrb: {
    width: 14,
    height: 14,
    borderRadius: urTheme.radii.pill,
    backgroundColor: '#F6C26A',
    shadowColor: '#F6C26A',
    shadowOpacity: 0.75,
    shadowRadius: 6,
    elevation: 6,
  },
  turnTextWrap: {
    marginLeft: urTheme.spacing.sm,
  },
  turnTitle: {
    ...urTypography.label,
    color: urTheme.colors.ivory,
    fontSize: 12,
    letterSpacing: 1.15,
  },
  turnHint: {
    color: 'rgba(235, 220, 193, 0.84)',
    fontSize: 11,
    marginTop: 1,
  },
  boardCard: {
    width: '100%',
  },
  controlsWrap: {
    width: '100%',
    maxWidth: 420,
  },
  logCard: {
    width: '100%',
    borderRadius: urTheme.radii.md,
    borderWidth: 1,
    borderColor: 'rgba(217, 164, 65, 0.5)',
    padding: urTheme.spacing.md,
    overflow: 'hidden',
    backgroundColor: 'rgba(10, 13, 18, 0.66)',
  },
  logTexture: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.16,
  },
  logHeaderRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: urTheme.spacing.sm,
  },
  logTitle: {
    ...urTypography.subtitle,
    color: urTheme.colors.parchment,
    fontSize: 18,
  },
  logMeta: {
    color: 'rgba(231, 211, 175, 0.74)',
    fontSize: 11,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  logEntry: {
    color: 'rgba(244, 230, 206, 0.9)',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 6,
  },
  logEntryMuted: {
    color: 'rgba(217, 193, 158, 0.78)',
    fontSize: 12,
    lineHeight: 18,
  },
});
