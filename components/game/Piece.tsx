import { PlayerColor } from '@/logic/types';
import React from 'react';
import { View } from 'react-native';

interface PieceProps {
    color: PlayerColor;
    highlight?: boolean;
}

export const Piece: React.FC<PieceProps> = ({ color, highlight }) => {
    // Pearl (light) vs. Onyx (dark) pieces with museum-quality shadows
    const isPearl = color === 'light';
    
    return (
        <View style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: isPearl ? '#f5f5f4' : '#1e293b', // pearl : onyx
            borderWidth: highlight ? 3 : 2,
            borderColor: isPearl ? '#e7e5e4' : '#0f172a', // lighter pearl border : darker onyx border
            alignItems: 'center',
            justifyContent: 'center',
            // iOS shadow properties
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4,
            shadowRadius: 6,
            // Android elevation
            elevation: 8,
        }}>
            {/* Inner highlight to simulate 3D sphere/bevel */}
            <View style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: isPearl ? '#ffffff' : '#334155',
                opacity: 0.6,
                position: 'absolute',
                top: 8,
                left: 8,
            }} />
            
            {/* Gold accent ring */}
            <View style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: '#f59e0b',
                opacity: 0.4,
            }} />
        </View>
    );
};
