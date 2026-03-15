import type { SharedValue } from 'react-native-reanimated';

export interface MatchDiceRollStageFilamentProps {
  onError: (error: Error) => void;
  onReady: () => void;
  playbackId: number;
  rollProgress: SharedValue<number>;
  rollValue: number | null;
}

