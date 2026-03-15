export interface MatchDiceRollStageRendererProps {
  playbackId: number;
  rollValue: number | null;
  durationMs: number;
  onReady: () => void;
  onError: (error: Error) => void;
}
