/* eslint-disable @typescript-eslint/no-require-imports */
import React from 'react';
import { Platform } from 'react-native';
import type { DiceRollSceneContentProps } from './DiceRollScene.shared';

const PlatformDiceRollScene =
  Platform.OS === 'web'
    ? (require('./DiceRollScene.web') as typeof import('./DiceRollScene.web')).DiceRollScene
    : (require('./DiceRollScene.native') as typeof import('./DiceRollScene.native')).DiceRollScene;

export const DiceRollScene: React.FC<DiceRollSceneContentProps> = (props) => <PlatformDiceRollScene {...props} />;
