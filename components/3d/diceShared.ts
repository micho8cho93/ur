import type {
  Group,
  LineBasicMaterial,
  Material,
  Mesh,
  MeshBasicMaterial,
  MeshPhongMaterial,
  MeshStandardMaterial,
  Object3D,
  Side,
} from 'three';
import THREE from './three';

export const DEFAULT_DICE_ROLL_DURATION_MS = 3375;
export const DEFAULT_DICE_ROLL_END_HOLD_MS = 500;

export const DICE_ROLL_CAMERA = {
  position: [0, 0.26, 6.1] as [number, number, number],
  fov: 26,
} as const;

export const DICE_ROLL_NATIVE_CAMERA = {
  position: [0, 0.3, 5.48] as [number, number, number],
  fov: 23,
} as const;

export const MATCH_DICE_STAGE_CAMERA = {
  position: [0, 0.12, 9.4] as [number, number, number],
  target: [0, -1.02, 0.18] as [number, number, number],
  fov: 31,
  near: 0.1,
  far: 24,
} as const;

export const DICE_GROUND_Y = -0.52;
export const DICE_SCALE = 0.42;
export const DICE_HALF_EXTENT = 0.5773502588272095;
export const DICE_GROUND_CLEARANCE = 0.014;
export const DICE_SHADOW_DROP = 0.038;
export const DICE_IMPACT_PROGRESS = 0.72;
export const DICE_BOUNCE_END_PROGRESS = 0.91;

export type DiceRenderProfileName = 'web' | 'native' | 'matchStage';

export type DiceRenderProfile = {
  ambientIntensity: number;
  dieColor: string;
  dieCoreColor: string;
  dieCoreScale: number;
  dieMetalness: number;
  dieRimColor: string;
  dieRimOpacity: number;
  dieRimScale: number;
  dieRoughness: number;
  dieScaleMultiplier: number;
  edgeColor: string;
  edgeOpacity: number;
  faceMarkColor: string;
  faceMarkMetalness: number;
  faceMarkRoughness: number;
  faceMarkScale: number;
  fillLightColor: string;
  fillLightIntensity: number;
  fillLightPosition: [number, number, number];
  fogArgs: [string, number, number];
  groundOpacity: number;
  groundScale: [number, number, number];
  groupPosition: [number, number, number];
  hemisphereGroundColor: string;
  hemisphereIntensity: number;
  hemisphereSkyColor: string;
  keyLightColor: string;
  keyLightIntensity: number;
  keyLightPosition: [number, number, number];
  rimLightColor: string;
  rimLightIntensity: number;
  rimLightPosition: [number, number, number];
  shadowOpacityDrop: number;
  shadowOpacityStart: number;
  shadowScaleBase: number;
  shadowScaleHeightBoost: number;
  shadowStretch: number;
};

export const DICE_RENDER_PROFILES: Record<DiceRenderProfileName, DiceRenderProfile> = {
  web: {
    ambientIntensity: 1.05,
    dieColor: '#F1E4C9',
    dieCoreColor: '#E4D2AF',
    dieCoreScale: 0.88,
    dieMetalness: 0.05,
    dieRimColor: '#6A4527',
    dieRimOpacity: 0,
    dieRimScale: 1.02,
    dieRoughness: 0.64,
    dieScaleMultiplier: 1,
    edgeColor: '#4F3622',
    edgeOpacity: 0.9,
    faceMarkColor: '#322317',
    faceMarkMetalness: 0.04,
    faceMarkRoughness: 0.8,
    faceMarkScale: 1,
    fillLightColor: '#DCA95C',
    fillLightIntensity: 0.35,
    fillLightPosition: [-2.6, 1.9, 2.1],
    fogArgs: ['#25180E', 8, 12],
    groundOpacity: 0.08,
    groundScale: [2.9, 1.25, 1],
    groupPosition: [0, -0.02, 0],
    hemisphereGroundColor: '#3A2416',
    hemisphereIntensity: 0.5,
    hemisphereSkyColor: '#FFF4DE',
    keyLightColor: '#FFF6E4',
    keyLightIntensity: 1.5,
    keyLightPosition: [3.8, 4.7, 3.1],
    rimLightColor: '#FFF0D3',
    rimLightIntensity: 0,
    rimLightPosition: [-3.2, 1.4, 3.6],
    shadowOpacityDrop: 0.09,
    shadowOpacityStart: 0.26,
    shadowScaleBase: 1.55,
    shadowScaleHeightBoost: 0.9,
    shadowStretch: 0.72,
  },
  native: {
    ambientIntensity: 1.16,
    dieColor: '#F5E8CC',
    dieCoreColor: '#E9D8B5',
    dieCoreScale: 0.885,
    dieMetalness: 0.08,
    dieRimColor: '#6B4321',
    dieRimOpacity: 0.16,
    dieRimScale: 1.05,
    dieRoughness: 0.54,
    dieScaleMultiplier: 1.14,
    edgeColor: '#5A381C',
    edgeOpacity: 1,
    faceMarkColor: '#2A180F',
    faceMarkMetalness: 0.06,
    faceMarkRoughness: 0.72,
    faceMarkScale: 1.14,
    fillLightColor: '#E5B66B',
    fillLightIntensity: 0.56,
    fillLightPosition: [-2.8, 2.15, 2.55],
    fogArgs: ['#23170E', 6.6, 10.8],
    groundOpacity: 0.11,
    groundScale: [3.15, 1.34, 1],
    groupPosition: [0, -0.01, 0.08],
    hemisphereGroundColor: '#311D11',
    hemisphereIntensity: 0.66,
    hemisphereSkyColor: '#FFF8E8',
    keyLightColor: '#FFF8E8',
    keyLightIntensity: 1.95,
    keyLightPosition: [3.25, 5.1, 3.45],
    rimLightColor: '#FFE5B8',
    rimLightIntensity: 0.34,
    rimLightPosition: [-3.4, 1.55, 3.9],
    shadowOpacityDrop: 0.12,
    shadowOpacityStart: 0.31,
    shadowScaleBase: 1.74,
    shadowScaleHeightBoost: 1.04,
    shadowStretch: 0.7,
  },
  matchStage: {
    ambientIntensity: 1.18,
    dieColor: '#F3E6C7',
    dieCoreColor: '#E4D2A8',
    dieCoreScale: 0.89,
    dieMetalness: 0.08,
    dieRimColor: '#6A4321',
    dieRimOpacity: 0.22,
    dieRimScale: 1.06,
    dieRoughness: 0.52,
    dieScaleMultiplier: 1.24,
    edgeColor: '#57361E',
    edgeOpacity: 1,
    faceMarkColor: '#25160D',
    faceMarkMetalness: 0.06,
    faceMarkRoughness: 0.74,
    faceMarkScale: 1.18,
    fillLightColor: '#D6A65B',
    fillLightIntensity: 0.68,
    fillLightPosition: [-2.9, 1.7, 2.5],
    fogArgs: ['#26160D', 5.6, 11.5],
    groundOpacity: 0.11,
    groundScale: [3.5, 1.54, 1],
    groupPosition: [0, -0.72, 0.18],
    hemisphereGroundColor: '#2D1B10',
    hemisphereIntensity: 0.7,
    hemisphereSkyColor: '#FFF4DE',
    keyLightColor: '#FFF6E8',
    keyLightIntensity: 2.22,
    keyLightPosition: [2.9, 4.8, 3.6],
    rimLightColor: '#FEE2AE',
    rimLightIntensity: 0.45,
    rimLightPosition: [-3.8, 1.4, 3.8],
    shadowOpacityDrop: 0.1,
    shadowOpacityStart: 0.26,
    shadowScaleBase: 1.56,
    shadowScaleHeightBoost: 0.92,
    shadowStretch: 0.74,
  },
};

export const TETRAHEDRON_GEOMETRY = new THREE.TetrahedronGeometry(1, 0);
export const EDGE_GEOMETRY = new THREE.EdgesGeometry(TETRAHEDRON_GEOMETRY);
export const FACE_MARK_GEOMETRY = new THREE.CircleGeometry(0.14, 18);
export const SHADOW_GEOMETRY = new THREE.CircleGeometry(1, 28);

const UP_VECTOR = new THREE.Vector3(0, 0, 1);

export type FaceMarkConfig = {
  position: [number, number, number];
  rotation: [number, number, number];
};

export type DiceMotionConfig = {
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

export type DiceMotionSample = {
  rotate: [number, number, number];
  scale: number;
  shadowOpacity: number;
  shadowScale: number;
  shadowY: number;
  translate: [number, number, number];
};

export type DiceMotionSampleOptions = {
  dieHalfExtent?: number;
  dieScale: number;
  groundClearance?: number;
  impactProgress?: number;
  bounceEndProgress?: number;
  shadowDrop?: number;
  shadowHeightDivisor?: number;
  shadowOpacityDrop: number;
  shadowOpacityStart: number;
  shadowScaleBase: number;
  shadowScaleHeightBoost: number;
};

export type DiceSceneMaterials = {
  die: Material;
  dieCore: Material;
  dieRim: Material;
  faceMark: Material;
  edge: LineBasicMaterial;
  shadow: MeshBasicMaterial;
  ground: MeshBasicMaterial;
};

type DiceMaterialShading = 'phong' | 'standard';

const createLitMaterial = ({
  color,
  metalness,
  opacity,
  roughness,
  shading = 'standard',
  side,
  transparent,
}: {
  color: string;
  metalness?: number;
  opacity?: number;
  roughness?: number;
  shading?: DiceMaterialShading;
  side?: Side;
  transparent?: boolean;
}): MeshPhongMaterial | MeshStandardMaterial => {
  const baseOptions: {
    color: string;
    opacity?: number;
    side?: Side;
    transparent?: boolean;
  } = { color };

  if (typeof transparent === 'boolean') {
    baseOptions.transparent = transparent;
  }

  if (typeof opacity === 'number') {
    baseOptions.opacity = opacity;
  }

  if (side !== undefined) {
    baseOptions.side = side;
  }

  return shading === 'phong'
    ? new THREE.MeshPhongMaterial({
        ...baseOptions,
        shininess: Math.max(8, Math.round((1 - (roughness ?? 0.5)) * 70)),
        specular: new THREE.Color('#f2d1a0'),
      })
    : new THREE.MeshStandardMaterial({
        ...baseOptions,
        roughness,
        metalness: metalness ?? 0,
      });
};

export const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
export const lerp = (start: number, end: number, progress: number) => start + (end - start) * progress;
export const easeOutCubic = (value: number) => 1 - Math.pow(1 - value, 3);
export const easeOutQuart = (value: number) => 1 - Math.pow(1 - value, 4);
export const easeInOutSine = (value: number) => -(Math.cos(Math.PI * value) - 1) / 2;

export const createSeededRandom = (seed: number) => {
  let value = seed + 0x6d2b79f5;

  return () => {
    value += 0x6d2b79f5;
    let next = Math.imul(value ^ (value >>> 15), 1 | value);
    next ^= next + Math.imul(next ^ (next >>> 7), 61 | next);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
};

export const randomBetween = (next: () => number, min: number, max: number) => min + (max - min) * next();

export const FACE_MARKS: FaceMarkConfig[] = (() => {
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

export const getDiceRenderProfile = (name: DiceRenderProfileName) => DICE_RENDER_PROFILES[name];

export const sampleDiceMotion = (
  config: DiceMotionConfig,
  progress: number,
  options: DiceMotionSampleOptions,
): DiceMotionSample => {
  const {
    dieHalfExtent = DICE_HALF_EXTENT,
    dieScale,
    groundClearance = DICE_GROUND_CLEARANCE,
    impactProgress = DICE_IMPACT_PROGRESS,
    bounceEndProgress = DICE_BOUNCE_END_PROGRESS,
    shadowDrop = DICE_SHADOW_DROP,
    shadowHeightDivisor = 0.9,
    shadowOpacityDrop,
    shadowOpacityStart,
    shadowScaleBase,
    shadowScaleHeightBoost,
  } = options;

  const localProgress = clamp(progress, 0, 1);
  const settleY = config.landing[1] + dieHalfExtent * dieScale + groundClearance;
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
    y = settleY + Math.sin(settleProgress * Math.PI * 5.15) * config.settleLift * Math.pow(1 - settleProgress, 1.65);
  }

  const wobbleEnvelope = localProgress > impactProgress ? Math.pow(1 - localProgress, 1.7) : 0;
  const wobble = Math.sin((localProgress - impactProgress) * Math.PI * 6.5) * wobbleEnvelope * config.settleTwist;
  const heightFromGround = clamp((y - config.landing[1]) / shadowHeightDivisor, 0, 1);

  return {
    rotate: [
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
    ],
    scale: dieScale,
    shadowOpacity: shadowOpacityStart - heightFromGround * shadowOpacityDrop,
    shadowScale:
      config.shadowScale * dieScale * (shadowScaleBase + heightFromGround * shadowScaleHeightBoost),
    shadowY: config.landing[1] - shadowDrop,
    translate: [x, y, z],
  };
};

export const createDiceSceneMaterials = (
  profile: DiceRenderProfile,
  options: {
    shading?: DiceMaterialShading;
  } = {},
): DiceSceneMaterials => ({
  die: createLitMaterial({
    color: profile.dieColor,
    metalness: profile.dieMetalness,
    roughness: profile.dieRoughness,
    shading: options.shading,
  }),
  dieCore: createLitMaterial({
    color: profile.dieCoreColor,
    metalness: 0.02,
    roughness: Math.min(0.9, profile.dieRoughness + 0.08),
    shading: options.shading,
  }),
  dieRim: createLitMaterial({
    color: profile.dieRimColor,
    metalness: 0.02,
    opacity: profile.dieRimOpacity,
    roughness: Math.min(0.95, profile.dieRoughness + 0.16),
    shading: options.shading,
    side: THREE.BackSide,
    transparent: true,
  }),
  faceMark: createLitMaterial({
    color: profile.faceMarkColor,
    metalness: profile.faceMarkMetalness,
    roughness: profile.faceMarkRoughness,
    shading: options.shading,
    side: THREE.DoubleSide,
  }),
  edge: new THREE.LineBasicMaterial({
    color: profile.edgeColor,
    transparent: true,
    opacity: profile.edgeOpacity,
  }),
  shadow: new THREE.MeshBasicMaterial({
    color: '#140C07',
    transparent: true,
    opacity: profile.shadowOpacityStart,
    depthWrite: false,
  }),
  ground: new THREE.MeshBasicMaterial({
    color: '#41291A',
    transparent: true,
    opacity: profile.groundOpacity,
    depthWrite: false,
  }),
});

export const disposeDiceSceneMaterials = (materials: DiceSceneMaterials) => {
  (Object.values(materials) as Material[]).forEach((material) => material.dispose());
};

const disposeChildGeometries = (root: Object3D) => {
  root.traverse((node) => {
    const mesh = node as Mesh & { geometry?: { dispose?: () => void } };
    if (mesh.geometry && mesh.geometry !== TETRAHEDRON_GEOMETRY && mesh.geometry !== FACE_MARK_GEOMETRY) {
      mesh.geometry.dispose?.();
    }
  });
};

export const createImperativeDiceGroup = (
  materials: DiceSceneMaterials,
  profile: DiceRenderProfile,
): Group => {
  const group = new THREE.Group();

  if (profile.dieRimOpacity > 0) {
    const rimMesh = new THREE.Mesh(TETRAHEDRON_GEOMETRY, materials.dieRim);
    rimMesh.scale.setScalar(profile.dieRimScale);
    group.add(rimMesh);
  }

  group.add(new THREE.Mesh(TETRAHEDRON_GEOMETRY, materials.die));

  const coreMesh = new THREE.Mesh(TETRAHEDRON_GEOMETRY, materials.dieCore);
  coreMesh.scale.setScalar(profile.dieCoreScale);
  group.add(coreMesh);

  group.add(new THREE.LineSegments(EDGE_GEOMETRY, materials.edge));

  FACE_MARKS.forEach((mark) => {
    const faceMark = new THREE.Mesh(FACE_MARK_GEOMETRY, materials.faceMark);
    faceMark.position.set(...mark.position);
    faceMark.rotation.set(...mark.rotation);
    faceMark.scale.setScalar(profile.faceMarkScale);
    group.add(faceMark);
  });

  return group;
};

export const createImperativeGroundMesh = (
  materials: DiceSceneMaterials,
  profile: DiceRenderProfile,
): Mesh => {
  const groundMesh = new THREE.Mesh(new THREE.CircleGeometry(1, 64), materials.ground);
  groundMesh.position.set(0, DICE_GROUND_Y - DICE_SHADOW_DROP - 0.01, 0.04);
  groundMesh.rotation.set(-Math.PI / 2, 0, 0);
  groundMesh.scale.set(...profile.groundScale);
  return groundMesh;
};

export const disposeImperativeDiceObject = (root: Object3D) => {
  disposeChildGeometries(root);
  root.clear();
};
