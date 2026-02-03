import { PlayerColor } from '@/logic/types';
import React from 'react';
import { View } from 'react-native';

interface PieceProps {
    color: PlayerColor;
    highlight?: boolean;
}

export const Piece: React.FC<PieceProps> = ({ color, highlight }) => {
    // Light = ceramic ivory, Dark = obsidian basalt
    const bgColor = color === 'light' ? '#ece3d2' : '#1e1a18';
    const borderColor = color === 'light' ? '#8c6a3d' : '#d2b371';
    const innerBgColor = color === 'light' ? '#1f4d6f' : '#c38d2d';

    return (
        <View style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: bgColor,
            borderWidth: highlight ? 3 : 1.5,
            borderColor: borderColor,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 6,
            overflow: 'hidden',
        }}>
            <View style={{
                position: 'absolute',
                top: 4,
                left: 4,
                right: 4,
                bottom: 4,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: color === 'light' ? 'rgba(80, 55, 30, 0.3)' : 'rgba(236, 227, 210, 0.2)',
            }} />
            <View style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                opacity: 0.75,
                backgroundColor: innerBgColor,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.4)'
            }} />
            <View style={{
                position: 'absolute',
                width: 10,
                height: 10,
                borderRadius: 5,
                borderWidth: 1,
                borderColor: 'rgba(0, 0, 0, 0.15)'
            }} />
        </View>
    );
};
