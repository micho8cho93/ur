import React from 'react';
import { View } from 'react-native';

type RosetteProps = {
  size: number;
};

export const Rosette: React.FC<RosetteProps> = ({ size }) => {
  const center = size / 2;
  const outerRadius = 8;
  const innerRadius = 5;
  const orbit = Math.max(outerRadius + 2, size * 0.22);

  return (
    <View pointerEvents="none" style={{ position: 'absolute', width: size, height: size }}>
      <View
        style={{
          position: 'absolute',
          left: center - (orbit + outerRadius),
          top: center - (orbit + outerRadius),
          width: (orbit + outerRadius) * 2,
          height: (orbit + outerRadius) * 2,
          borderRadius: orbit + outerRadius,
          borderWidth: 2,
          borderColor: '#F2E6D8',
        }}
      />
      {Array.from({ length: 6 }).map((_, index) => {
        const angle = (index / 6) * Math.PI * 2;
        const x = center + Math.cos(angle) * orbit;
        const y = center + Math.sin(angle) * orbit;
        return (
          <View
            key={`outer-${index}`}
            style={{
              position: 'absolute',
              left: x - outerRadius,
              top: y - outerRadius,
              width: outerRadius * 2,
              height: outerRadius * 2,
              borderRadius: outerRadius,
              backgroundColor: '#3AA6A0',
            }}
          />
        );
      })}
      {Array.from({ length: 6 }).map((_, index) => {
        const angle = (index / 6) * Math.PI * 2 + Math.PI / 6;
        const x = center + Math.cos(angle) * (orbit * 0.68);
        const y = center + Math.sin(angle) * (orbit * 0.68);
        return (
          <View
            key={`inner-${index}`}
            style={{
              position: 'absolute',
              left: x - innerRadius,
              top: y - innerRadius,
              width: innerRadius * 2,
              height: innerRadius * 2,
              borderRadius: innerRadius,
              backgroundColor: '#E08B3E',
            }}
          />
        );
      })}
      <View
        style={{
          position: 'absolute',
          left: center - 4,
          top: center - 4,
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: '#1E1E1E',
        }}
      />
    </View>
  );
};
