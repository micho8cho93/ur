import { Board } from '@/components/game/Board';
import { Dice } from '@/components/game/Dice';
import { Modal } from '@/components/ui/Modal';
import { useGameLoop } from '@/hooks/useGameLoop';
import { useGameStore } from '@/store/useGameStore';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { ScrollView, Text, View } from 'react-native';

export default function GameRoom() {
    const { id } = useLocalSearchParams();
    const router = useRouter();

    // Game Loop Hook (Bot)
    useGameLoop();

    const gameState = useGameStore(state => state.gameState);
    const roll = useGameStore(state => state.roll);
    const reset = useGameStore(state => state.reset);

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

    const handleExit = () => {
        setShowWinModal(false);
        reset();
        router.replace('/');
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#2d1810' }}>
            <Stack.Screen options={{ title: `Game #${id}` }} />

            <ScrollView contentContainerStyle={{ padding: 16, alignItems: 'center' }}>
                {/* Status Bar - Museum Plaque Style */}
                <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    width: '100%',
                    marginBottom: 32,
                    backgroundColor: '#f3e5ab',
                    padding: 16,
                    borderRadius: 8,
                    borderWidth: 3,
                    borderColor: '#78350f',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 6,
                }}>
                    <View style={{ alignItems: 'center' }}>
                        <Text style={{ fontFamily: 'serif', fontWeight: 'bold', color: '#78350f', fontSize: 18 }}>YOU (Light)</Text>
                        <Text style={{ fontFamily: 'serif', color: '#78350f' }}>Finished: {gameState.light.finishedCount}/7</Text>
                    </View>
                    <View style={{ alignItems: 'center' }}>
                        <Text style={{ fontFamily: 'serif', fontWeight: 'bold', color: '#78350f', fontSize: 18 }}>BOT (Dark)</Text>
                        <Text style={{ fontFamily: 'serif', color: '#78350f' }}>Finished: {gameState.dark.finishedCount}/7</Text>
                    </View>
                </View>

                {/* Turn Indicator - Engraved Style */}
                <View style={{
                    marginBottom: 16,
                    paddingHorizontal: 24,
                    paddingVertical: 12,
                    borderRadius: 20,
                    backgroundColor: isMyTurn ? '#1e3a8a' : '#1e293b',
                    borderWidth: 2,
                    borderBottomWidth: 4,
                    borderRightWidth: 3,
                    borderColor: '#f59e0b',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    elevation: 4,
                }}>
                    <Text style={{
                        color: '#fbbf24',
                        fontFamily: 'serif',
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        fontSize: 14,
                        letterSpacing: 2,
                    }}>
                        {isMyTurn ? "Your Turn" : "Opponent Turn"}
                    </Text>
                </View>

                {/* Board */}
                <Board />

                {/* Controls */}
                <View style={{ marginTop: 32, width: '100%', maxWidth: 320 }}>
                    <Dice
                        value={gameState.rollValue}
                        rolling={false}
                        onRoll={handleRoll}
                        canRoll={canRoll}
                    />
                </View>

                {/* History Log - Parchment Style */}
                <View style={{
                    marginTop: 32,
                    width: '100%',
                    backgroundColor: '#f3e5ab',
                    padding: 16,
                    borderRadius: 8,
                    borderWidth: 3,
                    borderColor: '#78350f',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 6,
                    elevation: 4,
                }}>
                    <Text style={{
                        fontFamily: 'serif',
                        fontWeight: 'bold',
                        marginBottom: 8,
                        color: '#78350f',
                        fontSize: 16,
                    }}>Game History:</Text>
                    {gameState.history.slice(-3).map((log, i) => (
                        <Text key={i} style={{
                            fontFamily: 'serif',
                            fontSize: 12,
                            color: '#78350f',
                            opacity: 0.8,
                        }}>{log}</Text>
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
