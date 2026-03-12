/* eslint-disable react/no-unknown-property */
import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export interface DiceRollSceneContentProps {
  playbackId: number;
  durationMs?: number;
  onComplete?: () => void;
  size?: number;
  variant?: 'animated' | 'start';
}

export const DEFAULT_DICE_ROLL_DURATION_MS = 2250;
const DEFAULT_DICE_ROLL_END_HOLD_MS = 500;

const CAMERA_POSITION: [number, number, number] = [0, 0.26, 6.1];
const GROUND_Y = -0.52;
const DIE_SCALE = 0.42;
const DIE_HALF_EXTENT = 0.5773502588272095;
const DIE_GROUND_CLEARANCE = 0.014;
const SHADOW_DROP = 0.038;
export const DICE_ROLL_CAMERA = {
  position: CAMERA_POSITION,
  fov: 26,
} as const;

// Tune the camera, light strength, duration, end hold, and landing feel here for the button-sized roll surface.
const BASE_DICE_LAYOUT = [
  {
    start: [-1.34, 0.66, 0.42] as [number, number, number],
    landing: [-1.1, GROUND_Y, 0.32] as [number, number, number],
    arcHeight: 0.46,
    bounceHeight: 0.2,
    finalRotation: [0.45, 0.18, -0.3] as [number, number, number],
    spinTurns: [2.45, 3.15, 2.2] as [number, number, number],
    delay: 0,
  },
  {
    start: [-0.46, 0.74, 0.08] as [number, number, number],
    landing: [-0.38, GROUND_Y, -0.06] as [number, number, number],
    arcHeight: 0.52,
    bounceHeight: 0.18,
    finalRotation: [0.28, 0.82, 0.24] as [number, number, number],
    spinTurns: [2.9, 2.55, 2.65] as [number, number, number],
    delay: 0.03,
  },
  {
    start: [0.44, 0.68, -0.12] as [number, number, number],
    landing: [0.46, GROUND_Y, 0.22] as [number, number, number],
    arcHeight: 0.44,
    bounceHeight: 0.17,
    finalRotation: [0.62, -0.54, 0.16] as [number, number, number],
    spinTurns: [2.65, 3.35, 2.35] as [number, number, number],
    delay: 0.05,
  },
  {
    start: [1.26, 0.72, 0.32] as [number, number, number],
    landing: [1.08, GROUND_Y, -0.1] as [number, number, number],
    arcHeight: 0.5,
    bounceHeight: 0.21,
    finalRotation: [0.18, -0.2, -0.48] as [number, number, number],
    spinTurns: [3.05, 2.75, 3.25] as [number, number, number],
    delay: 0.08,
  },
] as const;

const TETRAHEDRON_GEOMETRY = new THREE.TetrahedronGeometry(1, 0);
const EDGE_GEOMETRY = new THREE.EdgesGeometry(TETRAHEDRON_GEOMETRY);
const FACE_MARK_GEOMETRY = new THREE.CircleGeometry(0.14, 18);
const SHADOW_GEOMETRY = new THREE.CircleGeometry(1, 28);
const UP_VECTOR = new THREE.Vector3(0, 0, 1);

type FaceMarkConfig = {
  position: [number, number, number];
  rotation: [number, number, number];
};

type DiceMotionConfig = {
  start: [number, number, number];
  landing: [number, number, number];
  arcHeight: number;
  bounceHeight: number;
  initialRotation: [number, number, number];
  finalRotation: [number, number, number];
  spinTurns: [number, number, number];
  delay: number;
  shadowScale: number;
  settleLift: number;
  settleTwist: number;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const lerp = (start: number, end: number, progress: number) => start + (end - start) * progress;
const easeOutCubic = (value: number) => 1 - Math.pow(1 - value, 3);
const easeOutQuart = (value: number) => 1 - Math.pow(1 - value, 4);
const easeInOutSine = (value: number) => -(Math.cos(Math.PI * value) - 1) / 2;

const createSeededRandom = (seed: number) => {
  let value = seed + 0x6d2b79f5;

  return () => {
    value += 0x6d2b79f5;
    let next = Math.imul(value ^ (value >>> 15), 1 | value);
    next ^= next + Math.imul(next ^ (next >>> 7), 61 | next);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
};

const randomBetween = (next: () => number, min: number, max: number) => min + (max - min) * next();

const FACE_MARKS: FaceMarkConfig[] = (() => {
  const position = TETRAHEDRON_GEOMETRY.getAttribute('position');
  const marks: FaceMarkConfig[] = [];

  for (let index = 0; index < position.count; index += 3) {
    const a = new THREE.Vector3(position.getX(index), position.getY(index), position.getZ(index));
    const b = new THREE.Vector3(position.getX(index + 1), position.getY(index + 1), position.getZ(index + 1));
    const c = new THREE.Vector3(position.getX(index + 2), position.getY(index + 2), position.getZ(index + 2));
    const center = a.clone().add(b).add(c).multiplyScalar(1 / 3);
    const normal = b
      .clone()
      .sub(a)
      .cross(c.clone().sub(a))
      .normalize();
    const rotation = new THREE.Euler().setFromQuaternion(
      new THREE.Quaternion().setFromUnitVectors(UP_VECTOR, normal),
    );

    center.addScaledVector(normal, 0.02);
    marks.push({
      position: [center.x, center.y, center.z],
      rotation: [rotation.x, rotation.y, rotation.z],
    });
  }

  return marks;
})();

const buildDiceMotion = (playbackId: number): DiceMotionConfig[] => {
  const next = createSeededRandom(playbackId || 1);

  return BASE_DICE_LAYOUT.map((config) => ({
    start: [
      config.start[0] + randomBetween(next, -0.08, 0.08),
      config.start[1] + randomBetween(next, -0.06, 0.06),
      config.start[2] + randomBetween(next, -0.08, 0.08),
    ],
    landing: [
      config.landing[0] + randomBetween(next, -0.08, 0.08),
      config.landing[1],
      config.landing[2] + randomBetween(next, -0.08, 0.08),
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
  size: number;
  variant: 'animated' | 'start';
};

const AnimatedDiceSet: React.FC<AnimatedDiceSetProps> = ({ playbackId, durationMs, onComplete, size, variant }) => {
  const diceRefs = useRef<(THREE.Group | null)[]>([]);
  const shadowRefs = useRef<(THREE.Mesh | null)[]>([]);
  const startMsRef = useRef<number | null>(null);
  const completeRef = useRef(false);
  const motionConfig = useMemo(() => buildDiceMotion(playbackId), [playbackId]);

  const materials = useMemo(
    () => ({
      die: new THREE.MeshStandardMaterial({
        color: '#F1E4C9',
        roughness: 0.64,
        metalness: 0.05,
      }),
      dieCore: new THREE.MeshStandardMaterial({
        color: '#E4D2AF',
        roughness: 0.72,
        metalness: 0.02,
      }),
      faceMark: new THREE.MeshStandardMaterial({
        color: '#322317',
        roughness: 0.8,
        metalness: 0.04,
        side: THREE.DoubleSide,
      }),
      edge: new THREE.LineBasicMaterial({
        color: '#4F3622',
        transparent: true,
        opacity: 0.9,
      }),
      shadow: new THREE.MeshBasicMaterial({
        color: '#140C07',
        transparent: true,
        opacity: 0.2,
        depthWrite: false,
      }),
      ground: new THREE.MeshBasicMaterial({
        color: '#41291A',
        transparent: true,
        opacity: 0.08,
        depthWrite: false,
      }),
    }),
    [],
  );

  useEffect(() => {
    startMsRef.current = null;
    completeRef.current = false;
  }, [playbackId, variant]);

  useEffect(
    () => () => {
      Object.values(materials).forEach((material) => material.dispose());
    },
    [materials],
  );

  useFrame(({ clock }) => {
    const impactProgress = 0.72;
    const bounceEndProgress = 0.91;
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

      const localProgress = clamp((progress - config.delay) / (1 - config.delay * 0.78), 0, 1);
      const settleY = config.landing[1] + DIE_HALF_EXTENT * DIE_SCALE * size + DIE_GROUND_CLEARANCE;
      const travelProgress =
        localProgress < impactProgress
          ? easeOutCubic(localProgress / impactProgress) * 0.9
          : 0.9 + easeOutQuart((localProgress - impactProgress) / (1 - impactProgress)) * 0.1;

      const x = lerp(config.start[0], config.landing[0], travelProgress);
      const z = lerp(config.start[2], config.landing[2], travelProgress);

      let y = settleY;
      if (localProgress < impactProgress) {
        const airProgress = localProgress / impactProgress;
        y = lerp(config.start[1], settleY, airProgress) + Math.sin(airProgress * Math.PI) * config.arcHeight;
      } else if (localProgress < bounceEndProgress) {
        const bounceProgress = (localProgress - impactProgress) / (bounceEndProgress - impactProgress);
        y = settleY + Math.sin(bounceProgress * Math.PI) * config.bounceHeight * (1 - bounceProgress * 0.08);
      } else {
        const settleProgress = (localProgress - bounceEndProgress) / (1 - bounceEndProgress);
        y =
          settleY +
          Math.sin(settleProgress * Math.PI * 5.15) * config.settleLift * Math.pow(1 - settleProgress, 1.65);
      }

      const wobbleEnvelope = localProgress > impactProgress ? Math.pow(1 - localProgress, 1.7) : 0;
      const wobble = Math.sin((localProgress - impactProgress) * Math.PI * 6.5) * wobbleEnvelope * config.settleTwist;

      die.position.set(x, y, z);
      die.rotation.set(
        lerp(
          config.initialRotation[0],
          config.finalRotation[0] + config.spinTurns[0] * Math.PI * 2,
          easeInOutSine(localProgress),
        ) + wobble * 0.85,
        lerp(
          config.initialRotation[1],
          config.finalRotation[1] + config.spinTurns[1] * Math.PI * 2,
          easeOutQuart(localProgress),
        ) - wobble * 0.55,
        lerp(
          config.initialRotation[2],
          config.finalRotation[2] + config.spinTurns[2] * Math.PI * 2,
          easeInOutSine(localProgress),
        ) + wobble,
      );
      die.scale.setScalar(DIE_SCALE * size);

      const heightFromGround = clamp((y - config.landing[1]) / 0.9, 0, 1);
      const shadowScale = config.shadowScale * DIE_SCALE * size * (1.55 + heightFromGround * 0.9);
      shadow.position.set(x, config.landing[1] - SHADOW_DROP, z);
      shadow.scale.set(shadowScale, shadowScale * 0.72, 1);
      (shadow.material as THREE.MeshBasicMaterial).opacity = 0.26 - heightFromGround * 0.09;
    });

    // Hold the settled frame a little longer before snapping back to the idle start pose.
    if (variant === 'animated' && elapsedMs >= durationMs + DEFAULT_DICE_ROLL_END_HOLD_MS && !completeRef.current) {
      completeRef.current = true;
      onComplete?.();
    }
  });

  return (
    <group position={[0, -0.02, 0]}>
      <ambientLight intensity={1.05} />
      <hemisphereLight args={['#FFF4DE', '#3A2416', 0.5]} />
      {/* Tune this key light to push stronger highlights or a longer floor read. */}
      <directionalLight position={[3.8, 4.7, 3.1]} intensity={1.5} color="#FFF6E4" />
      <pointLight position={[-2.6, 1.9, 2.1]} intensity={0.35} color="#DCA95C" />

      <mesh position={[0, GROUND_Y - SHADOW_DROP - 0.01, 0.04]} rotation={[-Math.PI / 2, 0, 0]} scale={[2.9, 1.25, 1]}>
        <circleGeometry args={[1, 64]} />
        <primitive object={materials.ground} attach="material" />
      </mesh>

      {motionConfig.map((_, index) => (
        <React.Fragment key={`${playbackId}-${index}`}>
          <mesh
            ref={(node: THREE.Mesh | null) => {
              shadowRefs.current[index] = node;
            }}
            geometry={SHADOW_GEOMETRY}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <primitive object={materials.shadow} attach="material" />
          </mesh>

          <group
            ref={(node: THREE.Group | null) => {
              diceRefs.current[index] = node;
            }}
          >
            {/* Tweak die material tones or die scale here to better match the board treatment. */}
            <mesh geometry={TETRAHEDRON_GEOMETRY} material={materials.die} />
            <mesh geometry={TETRAHEDRON_GEOMETRY} material={materials.dieCore} scale={0.88} />
            <lineSegments geometry={EDGE_GEOMETRY} material={materials.edge} />
            {FACE_MARKS.map((mark, markIndex) => (
              <mesh
                key={markIndex}
                geometry={FACE_MARK_GEOMETRY}
                material={materials.faceMark}
                position={mark.position}
                rotation={mark.rotation}
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
  size = 1,
  variant = 'animated',
}) => (
  <>
    <fog attach="fog" args={['#25180E', 8, 12]} />
    <AnimatedDiceSet
      playbackId={playbackId}
      durationMs={durationMs}
      onComplete={onComplete}
      size={size}
      variant={variant}
    />
  </>
);
