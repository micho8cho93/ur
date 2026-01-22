import React from 'react';
import Svg, { Circle } from 'react-native-svg';

interface EyePatternSVGProps {
    size?: number;
    color?: string;
}

// Eye pattern with 5 dots from the Royal Game of Ur
export const EyePatternSVG: React.FC<EyePatternSVGProps> = ({ size = 32, color = '#7f1d1d' }) => {
    return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
            {/* 5-dot pattern in dice-5 arrangement */}
            <Circle cx="25" cy="25" r="6" fill={color} opacity={0.3} />
            <Circle cx="75" cy="25" r="6" fill={color} opacity={0.3} />
            <Circle cx="50" cy="50" r="6" fill={color} opacity={0.3} />
            <Circle cx="25" cy="75" r="6" fill={color} opacity={0.3} />
            <Circle cx="75" cy="75" r="6" fill={color} opacity={0.3} />
        </Svg>
    );
};
