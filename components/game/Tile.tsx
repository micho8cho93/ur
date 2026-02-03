import { isRosette, isWarZone } from '@/logic/constants';
import { PlayerColor } from '@/logic/types';
import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Piece } from './Piece';

interface TileProps {
    row: number;
    col: number;
    piece?: { id: string, color: PlayerColor }; // If occupied
    isValidTarget?: boolean; // If current roll allows moving here
    onPress?: () => void;
    lastMoveSource?: boolean; // Highlight previous position?
    lastMoveDest?: boolean;
}

export const Tile: React.FC<TileProps> = ({ row, col, piece, isValidTarget, onPress, lastMoveSource, lastMoveDest }) => {
    const rosette = isRosette(row, col);
    const war = isWarZone(row, col);

    // Styling
    // Normal: Stone Light
    // Rosette: Special pattern (border or icon)
    // War: Maybe slight red tint or just stone
    // Valid Target: Green glow or border

    let bgClass = "bg-stone-200";
    if (rosette) bgClass = "bg-stone-300 border-2 border-royal-gold";
    if (war && !rosette) bgClass = "bg-stone-200"; // War zone same color usually or checkered

    if (isValidTarget) bgClass += " bg-green-100 border-2 border-green-500";
    if (lastMoveDest) bgClass += " bg-yellow-100";

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={!isValidTarget}
            style={{
                width: '100%',
                height: '100%',
                aspectRatio: 1,
                backgroundColor: rosette ? '#cdbb9a' : '#d8c7a4',
                borderWidth: rosette ? 2 : 1,
                borderColor: rosette ? '#caa349' : 'rgba(96, 67, 42, 0.5)',
                borderRadius: 8,
                alignItems: 'center',
                justifyContent: 'center',
                margin: 4,
                overflow: 'hidden',
                shadowColor: '#3f2b17',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 3,
                elevation: 3,
                ...(isValidTarget && {
                    borderWidth: 2,
                    borderColor: '#d6b45a',
                    backgroundColor: '#e2d4b3',
                }),
                ...(lastMoveDest && {
                    backgroundColor: '#eadcba',
                }),
            }}
        >
            <View style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: rosette ? 'rgba(114, 75, 39, 0.08)' : 'rgba(45, 28, 16, 0.06)',
            }} />
            <View style={{
                position: 'absolute',
                top: 2,
                left: 2,
                right: 2,
                bottom: 2,
                borderRadius: 6,
                borderWidth: 1,
                borderColor: 'rgba(255, 233, 190, 0.35)',
            }} />
            {/* Rosette Marker */}
            {rosette && !piece && (
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', opacity: 0.35 }}>
                    <View style={{ width: 30, height: 30, transform: [{ rotate: '45deg' }], borderWidth: 3, borderColor: '#a97b2f' }} />
                    <View style={{ position: 'absolute', width: 8, height: 8, borderRadius: 4, backgroundColor: '#a97b2f', opacity: 0.4 }} />
                </View>
            )}

            {/* Coordinates (Debug) */}
            {/* <Text style={{ fontSize: 8, position: 'absolute', top: 4, left: 4, color: '#9ca3af' }}>{row},{col}</Text> */}

            {/* Valid Move Indicator (Dot) */}
            {isValidTarget && !piece && (
                <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: '#caa349', opacity: 0.6 }} />
            )}

            {/* Piece */}
            {piece && (
                <View style={{ opacity: isValidTarget ? 0.6 : 1 }}>
                    <Piece color={piece.color} />
                </View>
            )}
        </TouchableOpacity>
    );
};
