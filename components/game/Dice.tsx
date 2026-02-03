import React, { useEffect } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withSpring, withTiming } from 'react-native-reanimated';

interface DiceProps {
    value: number | null; // 0-4
    rolling: boolean;
    onRoll: () => void;
    canRoll: boolean;
}

// Visual representation of 4 tetrahedral dice
// If value is null, show ? or 0
export const Dice: React.FC<DiceProps> = ({ value, rolling, onRoll, canRoll }) => {
    // Use simple rotation or bounce
    const offset = useSharedValue(0);
    const spin = useSharedValue(0);

    useEffect(() => {
        if (rolling) {
            offset.value = withSequence(
                withTiming(-10, { duration: 100 }),
                withTiming(10, { duration: 100 }),
                withTiming(-10, { duration: 100 }),
                withTiming(10, { duration: 100 }),
                withSpring(0)
            );
            spin.value = withRepeat(withTiming(1, { duration: 350 }), 2, true);
        }
    }, [rolling]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateY: offset.value },
            { rotate: `${spin.value * 18}deg` },
        ],
    }));

    return (
        <TouchableOpacity
            onPress={onRoll}
            disabled={!canRoll || rolling}
            style={{
                padding: 16,
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 120,
                backgroundColor: canRoll ? '#b8742e' : '#a49a8b',
                opacity: canRoll ? 1 : 0.5,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: canRoll ? 0.3 : 0,
                shadowRadius: 5,
                elevation: canRoll ? 8 : 0,
                overflow: 'hidden',
            }}
        >
            <View style={{
                position: 'absolute',
                top: 6,
                left: 6,
                right: 6,
                bottom: 6,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: 'rgba(255, 215, 150, 0.4)',
            }} />
            <Animated.View style={[animatedStyle, { flexDirection: 'row', gap: 8 }]}>
                {/* Render 4 dice visuals */}
                {/* Simply show value for now, or 4 pips */}
                {[0, 1, 2, 3].map(i => {
                    // Visualize probability? 
                    // In Ur, 4 dice, each has 50% chance of 1.
                    // If we have total `value` (e.g. 3), we need to visually show 3 success, 1 fail.
                    // If rolling, show random?
                    // Since `value` is the result, we only know it after roll.
                    // While rolling (value is usually null or old), show '...'.

                    // Deterministic visualization:
                    // if value=2, Dice 0,1=ON, 2,3=OFF.
                    const isOn = value !== null && i < value;

                    return (
                        <View key={i} style={{
                            width: 32,
                            height: 32,
                            transform: [{ rotate: '45deg' }],
                            borderWidth: 1.5,
                            borderColor: '#7a5a2e',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: isOn ? '#234862' : '#e6d6b8',
                            shadowColor: '#2b1a0d',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.25,
                            shadowRadius: 3,
                            elevation: 3,
                        }}>
                            <View style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundColor: isOn ? 'rgba(16, 28, 40, 0.15)' : 'rgba(255, 244, 220, 0.2)',
                            }} />
                            {/* Pyramid tip */}
                            {isOn && <View style={{ width: 8, height: 8, backgroundColor: '#f5e9d0', borderRadius: 4 }} />}
                        </View>
                    );
                })}
            </Animated.View>
            <Text style={{
                marginTop: 8,
                fontWeight: 'bold',
                color: '#f8efe2',
                textAlign: 'center',
                textTransform: 'uppercase',
                fontSize: 12,
            }}>
                {rolling ? 'Rolling...' : value !== null ? `Rolled: ${value}` : 'Tap to Roll'}
            </Text>
        </TouchableOpacity>
    );
};
