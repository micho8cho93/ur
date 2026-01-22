import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

interface RosetteSVGProps {
    size?: number;
    color?: string;
}

// 8-pointed star rosette pattern from the Royal Game of Ur
export const RosetteSVG: React.FC<RosetteSVGProps> = ({ size = 48, color = '#7f1d1d' }) => {
    return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
            {/* Center circle */}
            <Circle cx="50" cy="50" r="8" fill={color} opacity={0.3} />
            
            {/* 8-pointed star */}
            <Path
                d="M 50,15 L 55,40 L 70,30 L 60,45 L 85,50 L 60,55 L 70,70 L 55,60 L 50,85 L 45,60 L 30,70 L 40,55 L 15,50 L 40,45 L 30,30 L 45,40 Z"
                fill={color}
                opacity={0.25}
            />
            
            {/* Inner decorative points */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
                const rad = (angle * Math.PI) / 180;
                const x = 50 + 20 * Math.cos(rad);
                const y = 50 + 20 * Math.sin(rad);
                return <Circle key={i} cx={x} cy={y} r="3" fill={color} opacity={0.4} />;
            })}
        </Svg>
    );
};
