/* eslint-disable @typescript-eslint/no-require-imports */
import { Platform } from 'react-native';
import THREE from './three';

type UseFrameHook = typeof import('@react-three/fiber').useFrame;

const fiber = Platform.OS === 'web'
  ? (require('@react-three/fiber') as typeof import('@react-three/fiber'))
  : (require('@react-three/fiber/native') as typeof import('@react-three/fiber/native'));

export { THREE };
export const useFrame = fiber.useFrame as UseFrameHook;
