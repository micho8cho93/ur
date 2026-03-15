import {
  DICE_RENDER_PROFILES,
  MATCH_DICE_STAGE_CAMERA,
  createDiceSceneMaterials,
  createImperativeDiceGroup,
  type DiceSceneMaterials,
  disposeDiceSceneMaterials,
  disposeImperativeDiceObject,
} from '@/components/3d/diceShared';
import THREE from '@/components/3d/three';
import { GLView, type ExpoWebGLRenderingContext } from 'expo-gl';
import React, { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import type {
  Group,
  Object3D,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from 'three';
import {
  buildMatchDiceStageMotion,
  sampleMatchDiceStageMotion,
} from './matchDiceStageMotion';
import type { MatchDiceRollStageRendererProps } from './MatchDiceRollStageRenderer.shared';

const MATCH_STAGE_PROFILE = DICE_RENDER_PROFILES.matchStage;

type StageRuntime = {
  animationFrameId: number | null;
  camera: PerspectiveCamera;
  diceGroups: Group[];
  gl: ExpoWebGLRenderingContext;
  materials: DiceSceneMaterials;
  renderer: WebGLRenderer;
  rootGroup: Group;
  scene: Scene;
};

const createExpoGlCanvas = (gl: ExpoWebGLRenderingContext) => ({
  width: gl.drawingBufferWidth,
  height: gl.drawingBufferHeight,
  style: {},
  addEventListener: () => {},
  removeEventListener: () => {},
  clientHeight: gl.drawingBufferHeight,
  clientWidth: gl.drawingBufferWidth,
  getContext: () => gl,
});

const createStageRenderer = (gl: ExpoWebGLRenderingContext) => {
  const canvas = createExpoGlCanvas(gl);
  const renderer = new THREE.WebGLRenderer({
    canvas: canvas as never,
    context: gl,
    antialias: true,
    alpha: true,
  });

  renderer.setPixelRatio(1);
  renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight, false);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.sortObjects = false;

  return renderer;
};

const getNow = () => global.performance?.now?.() ?? Date.now();

const disableFrustumCulling = (root: Object3D) => {
  root.traverse((node) => {
    const nextNode = node as Object3D & { frustumCulled?: boolean };
    if ('frustumCulled' in nextNode) {
      nextNode.frustumCulled = false;
    }
  });
};

const applyMotionFrame = ({
  motion,
  progress,
  runtime,
}: {
  motion: ReturnType<typeof buildMatchDiceStageMotion>;
  progress: number;
  runtime: StageRuntime;
}) => {
  motion.forEach((config, index) => {
    const sample = sampleMatchDiceStageMotion(config, progress);
    const diceGroup = runtime.diceGroups[index];

    if (!diceGroup) {
      return;
    }

    diceGroup.position.set(...sample.translate);
    diceGroup.rotation.set(...sample.rotate);
    diceGroup.scale.setScalar(sample.scale);
  });
};

const createStageRuntime = (gl: ExpoWebGLRenderingContext): StageRuntime => {
  const renderer = createStageRenderer(gl);
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    MATCH_DICE_STAGE_CAMERA.fov,
    gl.drawingBufferWidth / Math.max(gl.drawingBufferHeight, 1),
    MATCH_DICE_STAGE_CAMERA.near,
    MATCH_DICE_STAGE_CAMERA.far,
  );
  camera.position.set(...MATCH_DICE_STAGE_CAMERA.position);
  camera.lookAt(...MATCH_DICE_STAGE_CAMERA.target);

  const materials = createDiceSceneMaterials(MATCH_STAGE_PROFILE, { shading: 'phong' });
  const rootGroup = new THREE.Group();
  rootGroup.position.set(...MATCH_STAGE_PROFILE.groupPosition);

  scene.add(new THREE.AmbientLight('#FFF2DE', MATCH_STAGE_PROFILE.ambientIntensity));
  scene.add(
    new THREE.HemisphereLight(
      MATCH_STAGE_PROFILE.hemisphereSkyColor,
      MATCH_STAGE_PROFILE.hemisphereGroundColor,
      MATCH_STAGE_PROFILE.hemisphereIntensity,
    ),
  );

  const keyLight = new THREE.DirectionalLight(
    MATCH_STAGE_PROFILE.keyLightColor,
    MATCH_STAGE_PROFILE.keyLightIntensity,
  );
  keyLight.position.set(...MATCH_STAGE_PROFILE.keyLightPosition);
  scene.add(keyLight);

  const diceGroups = Array.from({ length: 4 }, () => createImperativeDiceGroup(materials, MATCH_STAGE_PROFILE));

  diceGroups.forEach((group) => {
    disableFrustumCulling(group);
    rootGroup.add(group);
  });
  scene.add(rootGroup);
  renderer.compile(scene, camera);

  return {
    animationFrameId: null,
    camera,
    diceGroups,
    gl,
    materials,
    renderer,
    rootGroup,
    scene,
  };
};

const disposeStageRuntime = (runtime: StageRuntime | null) => {
  if (!runtime) {
    return;
  }

  if (runtime.animationFrameId !== null) {
    cancelAnimationFrame(runtime.animationFrameId);
  }

  disposeImperativeDiceObject(runtime.rootGroup);
  disposeDiceSceneMaterials(runtime.materials);
  runtime.renderer.dispose();
};

export const MatchDiceRollStageThree: React.FC<MatchDiceRollStageRendererProps> = ({
  durationMs,
  onError,
  onReady,
  playbackId,
  rollValue,
}) => {
  const runtimeRef = useRef<StageRuntime | null>(null);
  const readyRef = useRef(false);
  const reportedErrorRef = useRef(false);

  const reportError = useCallback(
    (error: unknown) => {
      if (reportedErrorRef.current) {
        return;
      }

      reportedErrorRef.current = true;
      onError(error instanceof Error ? error : new Error('The Three match dice stage failed.'));
    },
    [onError],
  );

  const animate = useCallback(() => {
    const runtime = runtimeRef.current;
    if (!runtime) {
      return;
    }

  try {
      const startedAt = getNow();
      const motion = buildMatchDiceStageMotion({
        playbackId,
        rollValue,
        landingZone: {
          height: runtime.gl.drawingBufferHeight,
          width: runtime.gl.drawingBufferWidth,
        },
      });

      applyMotionFrame({
        motion,
        progress: 0,
        runtime,
      });
      runtime.renderer.render(runtime.scene, runtime.camera);
      runtime.gl.endFrameEXP();

      if (!readyRef.current) {
        readyRef.current = true;
        onReady();
      }

      const renderFrame = () => {
        const liveRuntime = runtimeRef.current;
        if (!liveRuntime) {
          return;
        }

        const progress = Math.min((getNow() - startedAt) / durationMs, 1);

        applyMotionFrame({
          motion,
          progress,
          runtime: liveRuntime,
        });

        liveRuntime.renderer.render(liveRuntime.scene, liveRuntime.camera);
        liveRuntime.gl.endFrameEXP();

        liveRuntime.animationFrameId = requestAnimationFrame(renderFrame);
      };

      renderFrame();
    } catch (error) {
      reportError(error);
    }
  }, [durationMs, onReady, playbackId, reportError, rollValue]);

  const handleContextCreate = useCallback(
    (gl: ExpoWebGLRenderingContext) => {
      try {
        readyRef.current = false;
        reportedErrorRef.current = false;
        disposeStageRuntime(runtimeRef.current);
        runtimeRef.current = createStageRuntime(gl);
        animate();
      } catch (error) {
        reportError(error);
      }
    },
    [animate, reportError],
  );

  useEffect(
    () => () => {
      disposeStageRuntime(runtimeRef.current);
      runtimeRef.current = null;
    },
    [],
  );

  return (
    <View pointerEvents="none" style={styles.wrap}>
      <GLView onContextCreate={handleContextCreate} style={styles.glView} />
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  glView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
