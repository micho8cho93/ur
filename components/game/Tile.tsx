import { isRosette, isWarZone } from '@/logic/constants';
import { PlayerColor } from '@/logic/types';
import React from 'react';
import { TouchableOpacity, View, ViewStyle } from 'react-native';
import { Piece } from './Piece';
import { RosetteSVG } from './RosetteSVG';
import { EyePatternSVG } from './EyePatternSVG';

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

    // Materials based on Design System:
    // Ivory (cream) for player rows (row 0 and 2)
    // Lapis Lazuli (deep blue) for middle war zone (row 1)
    const isIvory = row !== 1; // Top and bottom rows
    const isLapis = row === 1; // Middle war zone row

    // Base tile styling with 3D inset effect
    let tileStyle: ViewStyle = {
        width: '100%',
        height: '100%',
        aspectRatio: 1,
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
        margin: 4,
        // 3D inset effect - darker bottom and right borders
        borderBottomWidth: 3,
        borderRightWidth: 3,
        borderTopWidth: 1,
        borderLeftWidth: 1,
    };

    // Apply material colors
    if (isIvory) {
        tileStyle = {
            ...tileStyle,
            backgroundColor: '#f3e5ab', // Ivory cream
            borderBottomColor: '#d4c594',
            borderRightColor: '#d4c594',
            borderTopColor: '#fef5d4',
            borderLeftColor: '#fef5d4',
        };
    } else if (isLapis) {
        tileStyle = {
            ...tileStyle,
            backgroundColor: '#1e3a8a', // Lapis deep blue
            borderBottomColor: '#172554',
            borderRightColor: '#172554',
            borderTopColor: '#3b82f6',
            borderLeftColor: '#3b82f6',
        };
    }

    // Valid target glow overlay
    if (isValidTarget) {
        tileStyle = {
            ...tileStyle,
            backgroundColor: isIvory ? '#dcfce7' : '#065f46', // Green tint
            borderBottomColor: '#22c55e',
            borderRightColor: '#22c55e',
            borderBottomWidth: 4,
            borderRightWidth: 4,
        };
    }

    // Last move highlight
    if (lastMoveDest) {
        tileStyle = {
            ...tileStyle,
            backgroundColor: isIvory ? '#fef3c7' : '#854d0e', // Yellow tint
        };
    }

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={!isValidTarget}
            style={tileStyle}
        >
            {/* Rosette Pattern - 8-pointed star */}
            {rosette && !piece && (
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
                    <RosetteSVG size={48} color={isIvory ? '#7f1d1d' : '#fbbf24'} />
                </View>
            )}

            {/* Eye Pattern for war zone non-rosette tiles */}
            {war && !rosette && !piece && (
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
                    <EyePatternSVG size={32} color="#fbbf24" />
                </View>
            )}

            {/* Valid Move Indicator (Dot) */}
            {isValidTarget && !piece && (
                <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: '#4ade80', opacity: 0.7 }} />
            )}

            {/* Piece */}
            {piece && (
                <View style={{ opacity: isValidTarget ? 0.7 : 1 }}>
                    <Piece color={piece.color} />
                </View>
            )}
        </TouchableOpacity>
    );
};
