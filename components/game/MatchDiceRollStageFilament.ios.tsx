/* eslint-disable @typescript-eslint/no-require-imports */
import { DEFAULT_DICE_ROLL_DURATION_MS } from '@/components/3d/DiceRollScene.shared';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Camera,
  FilamentScene,
  FilamentView,
  Light,
  ModelInstance,
  ModelRenderer,
  useModel,
} from 'react-native-filament';
import type { MatchDiceRollStageFilamentProps } from './MatchDiceRollStageFilament.shared';
import {
  buildMatchDiceStageMotion,
  sampleMatchDiceStageMotion,
} from './matchDiceStageMotion';

const DICE_MODEL_SOURCE = require('../../assets/models/ur_tetra_die.glb');

const FilamentDiceInstances: React.FC<{
  playbackId: number;
  progress: number;
  rollValue: number | null;
}> = ({ playbackId, progress, rollValue }) => {
  const motion = useMemo(
    () =>
      buildMatchDiceStageMotion({
        playbackId,
        rollValue,
        landingZone: { width: 320, height: 220 },
      }),
    [playbackId, rollValue],
  );

  return (
    <>
      {motion.map((config, index) => (
        <FilamentDieInstance
          key={`${playbackId}-${index}`}
          index={index}
          motionConfig={config}
          progress={progress}
        />
      ))}
    </>
  );
};

const FilamentDieInstance: React.FC<{
  index: number;
  motionConfig: ReturnType<typeof buildMatchDiceStageMotion>[number];
  progress: number;
}> = ({ index, motionConfig, progress }) => {
  const sample = sampleMatchDiceStageMotion(motionConfig, progress);
  const scale = useMemo(
    () => [sample.scale, sample.scale, sample.scale] as [number, number, number],
    [sample.scale],
  );

  return <ModelInstance index={index} rotate={sample.rotate} scale={scale} translate={sample.translate} />;
};

const FilamentStageContent: React.FC<MatchDiceRollStageFilamentProps> = ({
  onReady,
  playbackId,
  rollValue,
}) => {
  const readyPlaybackRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  const [progress, setProgress] = useState(0);
  const model = useModel(DICE_MODEL_SOURCE, {
    instanceCount: 4,
    shouldReleaseSourceData: true,
  });

  useEffect(() => {
    setProgress(0);

    const startedAt = Date.now();
    const tick = () => {
      const nextProgress = Math.min((Date.now() - startedAt) / DEFAULT_DICE_ROLL_DURATION_MS, 1);
      setProgress(nextProgress);

      if (nextProgress < 1) {
        animationFrameRef.current = requestAnimationFrame(tick);
      } else {
        animationFrameRef.current = null;
      }
    };

    animationFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [playbackId]);

  useEffect(() => {
    if (model.state !== 'loaded' || readyPlaybackRef.current === playbackId) {
      return;
    }

    readyPlaybackRef.current = playbackId;
    console.log('[MatchDiceRollStage.filament] model ready', {
      playbackId,
    });
    onReady();
  }, [model, onReady, playbackId]);

  useEffect(() => {
    readyPlaybackRef.current = 0;
  }, [playbackId]);

  if (model.state !== 'loaded') {
    return null;
  }

  return (
    <ModelRenderer castShadow model={model} receiveShadow transformToUnitCube>
      <FilamentDiceInstances
        playbackId={playbackId}
        progress={progress}
        rollValue={rollValue}
      />
    </ModelRenderer>
  );
};

class FilamentErrorBoundary extends React.Component<
  React.PropsWithChildren<{
    onError: (error: Error) => void;
  }>
> {
  static getDerivedStateFromError() {
    return { hasError: true };
  }

  state = {
    hasError: false,
  };

  componentDidCatch(error: Error) {
    this.props.onError(error);
  }

  componentDidUpdate(prevProps: Readonly<React.PropsWithChildren<{ onError: (error: Error) => void }>>) {
    if (prevProps.children !== this.props.children && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return null;
    }

    return this.props.children;
  }
}

export const MatchDiceRollStageFilament: React.FC<MatchDiceRollStageFilamentProps> = (props) => {
  return (
    <FilamentErrorBoundary onError={props.onError}>
      <FilamentScene antiAliasing="FXAA" dithering="temporal" postProcessing shadowing>
        <FilamentView enableTransparentRendering style={{ flex: 1 }}>
          <Camera
            cameraPosition={[0, 1.22, 7.25]}
            cameraTarget={[0, -0.08, 0]}
            cameraUp={[0, 1, 0]}
            far={32}
            focalLengthInMillimeters={34}
            near={0.05}
          />
          <Light
            castShadows
            colorKelvin={5600}
            direction={[0.24, -0.92, -0.32]}
            intensity={98000}
            type="directional"
          />
          <Light
            colorKelvin={3600}
            falloffRadius={8}
            intensity={2600}
            position={[-2.6, 1.45, 1.85]}
            type="point"
          />
          <Light
            colorKelvin={7000}
            falloffRadius={8}
            intensity={1800}
            position={[2.2, 1.15, 2.65]}
            type="point"
          />
          <FilamentStageContent {...props} />
        </FilamentView>
      </FilamentScene>
    </FilamentErrorBoundary>
  );
};
