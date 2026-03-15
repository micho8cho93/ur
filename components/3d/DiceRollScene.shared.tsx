/* eslint-disable react/no-unknown-property */
import React, { useEffect, useMemo, useRef } from 'react';
import type { Clock, Group, Mesh, MeshBasicMaterial } from 'three';
import {
  DEFAULT_DICE_ROLL_DURATION_MS,
  DEFAULT_DICE_ROLL_END_HOLD_MS,
  DICE_RENDER_PROFILES,
  DICE_SCALE,
  EDGE_GEOMETRY,
  FACE_MARK_GEOMETRY,
  FACE_MARKS,
  TETRAHEDRON_GEOMETRY,
  SHADOW_GEOMETRY,
  clamp,
  createDiceSceneMaterials,
  createSeededRandom,
  disposeDiceSceneMaterials,
  randomBetween,
  sampleDiceMotion,
  type DiceMotionConfig,
  type DiceRenderProfileName,
} from './diceShared';
import { useFrame } from './r3f';

export { DEFAULT_DICE_ROLL_DURATION_MS, DICE_ROLL_CAMERA, DICE_ROLL_NATIVE_CAMERA } from './diceShared';

export interface DiceRollSceneContentProps {
  playbackId: number;
  durationMs?: number;
  onComplete?: () => void;
  size?: number;
  renderProfile?: DiceRenderProfileName;
  variant?: 'animated' | 'start' | 'settled';
}

const WEB_BASE_DICE_LAYOUT = [
  {
    start: [-1.34, 0.66, 0.42] as [number, number, number],
    landing: [-1.1, -0.52, 0.32] as [number, number, number],
    arcHeight: 0.46,
    bounceHeight: 0.2,
    finalRotation: [0.45, 0.18, -0.3] as [number, number, number],
    spinTurns: [2.45, 3.15, 2.2] as [number, number, number],
    delay: 0,
  },
  {
    start: [-0.46, 0.74, 0.08] as [number, number, number],
    landing: [-0.38, -0.52, -0.06] as [number, number, number],
    arcHeight: 0.52,
    bounceHeight: 0.18,
    finalRotation: [0.28, 0.82, 0.24] as [number, number, number],
    spinTurns: [2.9, 2.55, 2.65] as [number, number, number],
    delay: 0.03,
  },
  {
    start: [0.44, 0.68, -0.12] as [number, number, number],
    landing: [0.46, -0.52, 0.22] as [number, number, number],
    arcHeight: 0.44,
    bounceHeight: 0.17,
    finalRotation: [0.62, -0.54, 0.16] as [number, number, number],
    spinTurns: [2.65, 3.35, 2.35] as [number, number, number],
    delay: 0.05,
  },
  {
    start: [1.26, 0.72, 0.32] as [number, number, number],
    landing: [1.08, -0.52, -0.1] as [number, number, number],
    arcHeight: 0.5,
    bounceHeight: 0.21,
    finalRotation: [0.18, -0.2, -0.48] as [number, number, number],
    spinTurns: [3.05, 2.75, 3.25] as [number, number, number],
    delay: 0.08,
  },
] as const;

const BASE_DICE_LAYOUT = [
  {
    start: [-1.46, 0.72, -0.88] as [number, number, number],
    landing: [-1, -0.52, -0.06] as [number, number, number],
    arcHeight: 0.48,
    bounceHeight: 0.2,
    finalRotation: [0.45, 0.18, -0.3] as [number, number, number],
    spinTurns: [2.45, 3.15, 2.2] as [number, number, number],
    delay: 0,
  },
  {
    start: [-0.92, 0.78, -0.72] as [number, number, number],
    landing: [-0.34, -0.52, 0.08] as [number, number, number],
    arcHeight: 0.54,
    bounceHeight: 0.18,
    finalRotation: [0.28, 0.82, 0.24] as [number, number, number],
    spinTurns: [2.9, 2.55, 2.65] as [number, number, number],
    delay: 0.03,
  },
  {
    start: [-0.34, 0.72, -0.58] as [number, number, number],
    landing: [0.32, -0.52, -0.02] as [number, number, number],
    arcHeight: 0.46,
    bounceHeight: 0.17,
    finalRotation: [0.62, -0.54, 0.16] as [number, number, number],
    spinTurns: [2.65, 3.35, 2.35] as [number, number, number],
    delay: 0.06,
  },
  {
    start: [0.24, 0.78, -0.44] as [number, number, number],
    landing: [0.96, -0.52, 0.12] as [number, number, number],
    arcHeight: 0.52,
    bounceHeight: 0.21,
    finalRotation: [0.18, -0.2, -0.48] as [number, number, number],
    spinTurns: [3.05, 2.75, 3.25] as [number, number, number],
    delay: 0.09,
  },
] as const;

const buildDiceMotion = (
  playbackId: number,
  renderProfileName: DiceRenderProfileName,
): DiceMotionConfig[] => {
  const next = createSeededRandom(playbackId || 1);
  const isWebProfile = renderProfileName === 'web';
  const baseLayout = isWebProfile ? WEB_BASE_DICE_LAYOUT : BASE_DICE_LAYOUT;

  return baseLayout.map((config) => ({
    start: [
      config.start[0] + randomBetween(next, -0.08, 0.08),
      config.start[1] + randomBetween(next, -0.06, 0.06),
      config.start[2] + randomBetween(next, -0.08, 0.08),
    ],
    landing: [
      config.landing[0] + randomBetween(next, isWebProfile ? -0.08 : -0.06, isWebProfile ? 0.08 : 0.06),
      config.landing[1],
      config.landing[2] + randomBetween(next, isWebProfile ? -0.08 : -0.04, isWebProfile ? 0.08 : 0.04),
    ],
    arcHeight: config.arcHeight + randomBetween(next, -0.08, 0.08),
    bounceHeight: config.bounceHeight + randomBetween(next, -0.025, 0.025),
    initialRotation: [
      randomBetween(next, -0.6, 0.6),
      randomBetween(next, -0.8, 0.8),
      randomBetween(next, -0.4, 0.4),
    ],
    finalRotation: [
      config.finalRotation[0] + randomBetween(next, -0.12, 0.12),
      config.finalRotation[1] + randomBetween(next, -0.12, 0.12),
      config.finalRotation[2] + randomBetween(next, -0.12, 0.12),
    ],
    spinTurns: [
      config.spinTurns[0] + randomBetween(next, -0.15, 0.15),
      config.spinTurns[1] + randomBetween(next, -0.2, 0.2),
      config.spinTurns[2] + randomBetween(next, -0.15, 0.15),
    ],
    delay: config.delay,
    shadowScale: randomBetween(next, 0.68, 0.84),
    settleLift: randomBetween(next, 0.04, 0.065),
    settleTwist: randomBetween(next, 0.12, 0.22),
  }));
};

type AnimatedDiceSetProps = {
  playbackId: number;
  durationMs: number;
  onComplete?: () => void;
  renderProfile: DiceRenderProfileName;
  size: number;
  variant: 'animated' | 'start' | 'settled';
};

const AnimatedDiceSet: React.FC<AnimatedDiceSetProps> = ({
  playbackId,
  durationMs,
  onComplete,
  renderProfile: renderProfileName,
  size,
  variant,
}) => {
  const diceRefs = useRef<(Group | null)[]>([]);
  const shadowRefs = useRef<(Mesh | null)[]>([]);
  const startMsRef = useRef<number | null>(null);
  const completeRef = useRef(false);
  const firstFrameLoggedRef = useRef(false);
  const motionConfig = useMemo(
    () => buildDiceMotion(playbackId, renderProfileName),
    [playbackId, renderProfileName],
  );
  const renderProfile = useMemo(() => DICE_RENDER_PROFILES[renderProfileName], [renderProfileName]);

  const materials = useMemo(() => createDiceSceneMaterials(renderProfile), [renderProfile]);

  useEffect(() => {
    startMsRef.current = null;
    completeRef.current = false;
    firstFrameLoggedRef.current = false;
  }, [playbackId, variant]);

  useEffect(
    () => () => {
      disposeDiceSceneMaterials(materials);
    },
    [materials],
  );

  useFrame(({ clock }: { clock: Clock }) => {
    if (renderProfileName === 'native' && !firstFrameLoggedRef.current) {
      firstFrameLoggedRef.current = true;
      console.log('[DiceRollScene.native] frame loop active', {
        playbackId,
        variant,
      });
    }

    let progress = 0;
    let elapsedMs = 0;

    if (variant === 'animated') {
      if (!playbackId) {
        return;
      }

      const currentMs = clock.elapsedTime * 1000;
      if (startMsRef.current === null) {
        startMsRef.current = currentMs;
      }

      elapsedMs = currentMs - startMsRef.current;
      progress = clamp(elapsedMs / durationMs, 0, 1);
    }

    motionConfig.forEach((config, index) => {
      const die = diceRefs.current[index];
      const shadow = shadowRefs.current[index];
      if (!die || !shadow) {
        return;
      }

      const localProgress =
        variant === 'settled'
          ? 1
          : variant === 'start'
            ? 0
            : clamp((progress - config.delay) / (1 - config.delay * 0.78), 0, 1);
      const effectiveDieScale = DICE_SCALE * size * renderProfile.dieScaleMultiplier;
      const sample = sampleDiceMotion(config, localProgress, {
        dieScale: effectiveDieScale,
        shadowOpacityDrop: renderProfile.shadowOpacityDrop,
        shadowOpacityStart: renderProfile.shadowOpacityStart,
        shadowScaleBase: renderProfile.shadowScaleBase,
        shadowScaleHeightBoost: renderProfile.shadowScaleHeightBoost,
      });

      die.position.set(...sample.translate);
      die.rotation.set(...sample.rotate);
      die.scale.setScalar(effectiveDieScale);

      shadow.position.set(sample.translate[0], sample.shadowY, sample.translate[2]);
      shadow.scale.set(sample.shadowScale, sample.shadowScale * renderProfile.shadowStretch, 1);
      (shadow.material as MeshBasicMaterial).opacity = sample.shadowOpacity;
    });

    if (
      variant === 'animated' &&
      elapsedMs >= durationMs + DEFAULT_DICE_ROLL_END_HOLD_MS &&
      !completeRef.current
    ) {
      completeRef.current = true;
      onComplete?.();
    }
  });

  return (
    <group position={renderProfile.groupPosition}>
      <ambientLight intensity={renderProfile.ambientIntensity} />
      <hemisphereLight
        args={[
          renderProfile.hemisphereSkyColor,
          renderProfile.hemisphereGroundColor,
          renderProfile.hemisphereIntensity,
        ]}
      />
      <directionalLight
        position={renderProfile.keyLightPosition}
        intensity={renderProfile.keyLightIntensity}
        color={renderProfile.keyLightColor}
      />
      <pointLight
        position={renderProfile.fillLightPosition}
        intensity={renderProfile.fillLightIntensity}
        color={renderProfile.fillLightColor}
      />
      {renderProfile.rimLightIntensity > 0 ? (
        <pointLight
          position={renderProfile.rimLightPosition}
          intensity={renderProfile.rimLightIntensity}
          color={renderProfile.rimLightColor}
        />
      ) : null}

      <mesh
        position={[0, -0.52 - 0.038 - 0.01, 0.04]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={renderProfile.groundScale}
      >
        <circleGeometry args={[1, 64]} />
        <primitive object={materials.ground} attach="material" />
      </mesh>

      {motionConfig.map((_, index) => (
        <React.Fragment key={`${playbackId}-${index}`}>
          <mesh
            ref={(node: Mesh | null) => {
              shadowRefs.current[index] = node;
            }}
            geometry={SHADOW_GEOMETRY}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <primitive object={materials.shadow} attach="material" />
          </mesh>

          <group
            ref={(node: Group | null) => {
              diceRefs.current[index] = node;
            }}
          >
            {renderProfile.dieRimOpacity > 0 ? (
              <mesh geometry={TETRAHEDRON_GEOMETRY} material={materials.dieRim} scale={renderProfile.dieRimScale} />
            ) : null}
            <mesh geometry={TETRAHEDRON_GEOMETRY} material={materials.die} />
            <mesh geometry={TETRAHEDRON_GEOMETRY} material={materials.dieCore} scale={renderProfile.dieCoreScale} />
            <lineSegments geometry={EDGE_GEOMETRY} material={materials.edge} />
            {FACE_MARKS.map((mark, markIndex) => (
              <mesh
                key={markIndex}
                geometry={FACE_MARK_GEOMETRY}
                material={materials.faceMark}
                position={mark.position}
                rotation={mark.rotation}
                scale={renderProfile.faceMarkScale}
              />
            ))}
          </group>
        </React.Fragment>
      ))}
    </group>
  );
};

export const DiceRollSceneContent: React.FC<DiceRollSceneContentProps> = ({
  playbackId,
  durationMs = DEFAULT_DICE_ROLL_DURATION_MS,
  onComplete,
  renderProfile = 'web',
  size = 1,
  variant = 'animated',
}) => (
  <>
    <fog attach="fog" args={DICE_RENDER_PROFILES[renderProfile].fogArgs} />
    <AnimatedDiceSet
      playbackId={playbackId}
      durationMs={durationMs}
      onComplete={onComplete}
      renderProfile={renderProfile}
      size={size}
      variant={variant}
    />
  </>
);
