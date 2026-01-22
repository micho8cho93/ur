import React, { useEffect } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';

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

    useEffect(() => {
        if (rolling) {
            offset.value = withSequence(
                withTiming(-10, { duration: 100 }),
                withTiming(10, { duration: 100 }),
                withTiming(-10, { duration: 100 }),
                withTiming(10, { duration: 100 }),
                withSpring(0)
            );
        }
    }, [rolling]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: offset.value }],
    }));

    return (
        <TouchableOpacity
            onPress={onRoll}
            disabled={!canRoll || rolling}
            style={{
                padding: 20,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 120,
                backgroundColor: canRoll ? '#f59e0b' : '#78350f',
                opacity: canRoll ? 1 : 0.6,
                borderWidth: 4,
                borderBottomWidth: 6,
                borderRightWidth: 5,
                borderColor: canRoll ? '#78350f' : '#1a120b',
                borderTopColor: canRoll ? '#fbbf24' : '#78350f',
                borderLeftColor: canRoll ? '#fbbf24' : '#78350f',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: canRoll ? 6 : 2 },
                shadowOpacity: canRoll ? 0.4 : 0.2,
                shadowRadius: canRoll ? 8 : 4,
                elevation: canRoll ? 10 : 4,
            }}
        >
            <Animated.View style={[animatedStyle, { flexDirection: 'row', gap: 8 }]}>
                {/* Render 4 dice visuals as tetrahedral pyramids */}
                {[0, 1, 2, 3].map(i => {
                    const isOn = value !== null && i < value;

                    return (
                        <View key={i} style={{
                            width: 36,
                            height: 36,
                            transform: [{ rotate: '45deg' }],
                            borderWidth: 2,
                            borderColor: '#78350f',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: isOn ? '#1e3a8a' : '#f3e5ab',
                            borderBottomWidth: 3,
                            borderRightWidth: 3,
                            borderBottomColor: isOn ? '#172554' : '#d4c594',
                            borderRightColor: isOn ? '#172554' : '#d4c594',
                            shadowColor: '#000',
                            shadowOffset: { width: 1, height: 1 },
                            shadowOpacity: 0.3,
                            shadowRadius: 2,
                            elevation: 3,
                        }}>
                            {/* Pyramid tip indicator */}
                            {isOn && <View style={{ width: 10, height: 10, backgroundColor: '#fbbf24', borderRadius: 5 }} />}
                        </View>
                    );
                })}
            </Animated.View>
            <Text style={{
                marginTop: 12,
                fontFamily: 'serif',
                fontWeight: 'bold',
                color: canRoll ? '#78350f' : '#f3e5ab',
                textAlign: 'center',
                textTransform: 'uppercase',
                fontSize: 14,
                letterSpacing: 1,
            }}>
                {rolling ? 'Rolling...' : value !== null ? `Rolled: ${value}` : 'Tap to Roll'}
            </Text>
        </TouchableOpacity>
    );
};
