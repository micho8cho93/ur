import { Board } from '@/components/game/Board';
import { Dice } from '@/components/game/Dice';
import { Modal } from '@/components/ui/Modal';
import { useGameStore } from '@/store/useGameStore';
import { nakamaService } from '@/services/nakama';
import { MatchData, MatchPresenceEvent, Socket } from '@heroiclabs/nakama-js';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef } from 'react';
import { ScrollView, Text, View } from 'react-native';

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
    const setConnectionStatus = useGameStore(state => state.setConnectionStatus);
    const setMatchMoveSender = useGameStore(state => state.setMatchMoveSender);

    // Local Player is Light
    const isMyTurn = gameState.currentTurn === 'light';
    const canRoll = isMyTurn && gameState.phase === 'rolling';

    const handleRoll = () => {
        if (canRoll) roll();
    };

    const [showWinModal, setShowWinModal] = React.useState(false);

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

        let isMounted = true;

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
                setConnectionStatus('disconnected');
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
                const socket = nakamaService.getSocket() ?? await nakamaService.connectSocket();
                attachSocketHandlers(socket);
                const match = await socket.joinMatch(matchId);
                if (!isMounted) return;
                setMatchId(match.match_id);
                setConnectionStatus('connected');
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
            } catch {
                setConnectionStatus('disconnected');
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
    }, [matchId, setConnectionStatus, setGameStateFromServer, setMatchId, updateMatchPresences]);

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

    return (
        <View className="flex-1 bg-stone-light">
            <Stack.Screen options={{ title: `Game #${id}` }} />

            <ScrollView contentContainerStyle={{ padding: 16, alignItems: 'center' }}>
                {/* Status Bar */}
                <View className="flex-row justify-between w-full mb-8">
                    <View className="items-center">
                        <Text className="font-bold text-royal-blue text-lg">YOU (Light)</Text>
                        <Text>Finished: {gameState.light.finishedCount}/7</Text>
                    </View>
                    <View className="items-center">
                        <Text className="font-bold text-slate-700 text-lg">BOT (Dark)</Text>
                        <Text>Finished: {gameState.dark.finishedCount}/7</Text>
                    </View>
                </View>

                {/* Turn Indicator */}
                <View className={`mb-4 px-4 py-2 rounded-full ${isMyTurn ? 'bg-royal-blue' : 'bg-slate-700'}`}>
                    <Text className="text-white font-bold uppercase">
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
                <View className="mt-8 w-full bg-white p-4 rounded-lg bg-opacity-50">
                    <Text className="font-bold mb-2">Game Log:</Text>
                    {gameState.history.slice(-3).map((log, i) => (
                        <Text key={i} className="text-xs text-gray-500">{log}</Text>
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
