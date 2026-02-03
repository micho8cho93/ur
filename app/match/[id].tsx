import { Board } from '@/components/game/Board';
import { Dice } from '@/components/game/Dice';
import { Modal } from '@/components/ui/Modal';
import { useGameStore } from '@/store/useGameStore';
import { nakamaService } from '@/services/nakama';
import { MatchData, MatchPresenceEvent, Socket } from '@heroiclabs/nakama-js';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef } from 'react';
import { ScrollView, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

const OP_MOVE = 1;

export default function GameRoom() {
    const { id } = useLocalSearchParams();
    const router = useRouter();

    const matchId = useMemo(() => (Array.isArray(id) ? id[0] : id), [id]);

    const gameState = useGameStore(state => state.gameState);
    const roll = useGameStore(state => state.roll);
    const reset = useGameStore(state => state.reset);
    const initGame = useGameStore(state => state.initGame);
    const setMatchId = useGameStore(state => state.setMatchId);
    const setGameStateFromServer = useGameStore(state => state.setGameStateFromServer);
    const updateMatchPresences = useGameStore(state => state.updateMatchPresences);
    const setSocketState = useGameStore(state => state.setSocketState);
    const setMatchMoveSender = useGameStore(state => state.setMatchMoveSender);

    // Local Player is Light
    const isMyTurn = gameState.currentTurn === 'light';
    const canRoll = isMyTurn && gameState.phase === 'rolling';

    const handleRoll = () => {
        if (canRoll) roll();
    };

    const [showWinModal, setShowWinModal] = React.useState(false);
    const torchFlicker = useSharedValue(0.6);

    useEffect(() => {
        if (gameState.winner) {
            setShowWinModal(true);
        }
    }, [gameState.winner]);

    useEffect(() => {
        torchFlicker.value = withRepeat(
            withSequence(
                withTiming(0.9, { duration: 600 }),
                withTiming(0.6, { duration: 500 })
            ),
            -1,
            true
        );
    }, [torchFlicker]);

    useEffect(() => {
        if (!matchId) return;
        initGame(matchId);
        setMatchId(matchId);
    }, [initGame, matchId, setMatchId]);

    const socketRef = useRef<Socket | null>(null);
    const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (!matchId) return;

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
                const socket = nakamaService.getSocket() ?? await withTimeout(
                    nakamaService.connectSocket(),
                    10_000,
                    'Connecting to the match server timed out.'
                );
                attachSocketHandlers(socket);
                const match = await withTimeout(
                    socket.joinMatch(matchId),
                    10_000,
                    'Joining the match timed out.'
                );
                if (!isMounted) return;
                setMatchId(match.match_id);
                setSocketState('connected');
                if (isReconnect && match.metadata) {
                    try {
                        const metadata = JSON.parse(match.metadata);
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
    }, [matchId, setGameStateFromServer, setMatchId, setSocketState, updateMatchPresences]);

    useEffect(() => {
        if (!matchId) return;

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
    }, [matchId, setMatchMoveSender]);

    const handleExit = () => {
        setShowWinModal(false);
        reset();
        router.replace('/');
    };

    const torchStyle = useAnimatedStyle(() => ({
        opacity: torchFlicker.value,
        transform: [{ scale: 0.9 + torchFlicker.value * 0.15 }],
    }));

    return (
        <View className="flex-1 bg-stone-light">
            <Stack.Screen options={{ title: `Game #${id}` }} />
            <View style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: '#c8a37a',
            }} />
            <View style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '35%',
                backgroundColor: 'rgba(255, 236, 200, 0.2)',
            }} />
            <View style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                height: '40%',
                backgroundColor: 'rgba(77, 52, 32, 0.2)',
            }} />
            <View style={{
                position: 'absolute',
                top: -80,
                left: -80,
                right: -80,
                bottom: -80,
                borderRadius: 400,
                borderWidth: 2,
                borderColor: 'rgba(54, 36, 20, 0.12)',
            }} />
            <View style={{
                position: 'absolute',
                top: 24,
                left: 24,
                right: 24,
                bottom: 24,
                borderRadius: 32,
                borderWidth: 1,
                borderColor: 'rgba(255, 226, 170, 0.35)',
            }} />

            <ScrollView contentContainerStyle={{ padding: 16, alignItems: 'center' }}>
                {/* Status Bar */}
                <View className="flex-row justify-between w-full mb-8">
                    <View className="items-center">
                        <Text className="font-bold text-[#2d4963] text-lg tracking-wide">YOU (Light)</Text>
                        <Text className="text-[#5c4833]">Finished: {gameState.light.finishedCount}/7</Text>
                    </View>
                    <View className="items-center">
                        <Text className="font-bold text-[#3b2b1e] text-lg tracking-wide">BOT (Dark)</Text>
                        <Text className="text-[#5c4833]">Finished: {gameState.dark.finishedCount}/7</Text>
                    </View>
                </View>

                {/* Turn Indicator */}
                <View style={{
                    marginBottom: 16,
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 999,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    backgroundColor: isMyTurn ? '#1f4d6f' : '#3f3428',
                    borderWidth: 1,
                    borderColor: 'rgba(255, 223, 170, 0.5)',
                    shadowColor: '#1d140c',
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: 0.25,
                    shadowRadius: 4,
                    elevation: 4,
                }}>
                    <Animated.View style={[torchStyle, {
                        width: 14,
                        height: 14,
                        borderRadius: 7,
                        backgroundColor: '#f5c45e',
                        shadowColor: '#f5c45e',
                        shadowOpacity: 0.7,
                        shadowRadius: 6,
                    }]} />
                    <Text className="text-white font-bold uppercase tracking-widest">
                        {isMyTurn ? "Your Turn" : "Opponent Turn"}
                    </Text>
                </View>

                {/* Board */}
                <Board />

                {/* Controls */}
                <View className="mt-8 w-full max-w-xs">
                    <Dice
                        value={gameState.rollValue}
                        rolling={false} // Animation logic handled in Dice component via effect? 
                        // Actually we pass 'rolling' prop if we want to show rolling state.
                        // For now simple.
                        onRoll={handleRoll}
                        canRoll={canRoll}
                    />
                </View>

                {/* History Log */}
                <View style={{
                    marginTop: 32,
                    width: '100%',
                    backgroundColor: 'rgba(244, 232, 210, 0.65)',
                    padding: 16,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: 'rgba(126, 90, 58, 0.4)',
                }}>
                    <Text className="font-bold mb-2 text-[#3f2b17] tracking-wide">Game Log:</Text>
                    {gameState.history.slice(-3).map((log, i) => (
                        <Text key={i} className="text-xs text-[#5c4833]">{log}</Text>
                    ))}
                </View>

            </ScrollView>

            {/* Win Modal */}
            <Modal
                visible={showWinModal}
                title={gameState.winner === 'light' ? "VICTORY!" : "DEFEAT"}
                message={gameState.winner === 'light' ? "The Royal Game is yours!" : "The Bot has bested you."}
                actionLabel="Return to Menu"
                onAction={handleExit}
            />
        </View>
    );
}
