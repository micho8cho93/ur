import { Buffer } from 'node:buffer';
import fs from 'node:fs/promises';
import path from 'node:path';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

const OUTPUT_PATH = path.resolve(process.cwd(), 'assets/models/ur_tetra_die.glb');
const TETRAHEDRON_GEOMETRY = new THREE.TetrahedronGeometry(1, 0);
const EDGE_GEOMETRY = new THREE.EdgesGeometry(TETRAHEDRON_GEOMETRY);
const FACE_MARK_GEOMETRY = new THREE.CylinderGeometry(0.14, 0.14, 0.045, 24);
const EDGE_CYLINDER_RADIUS = 0.038;
const CYLINDER_UP = new THREE.Vector3(0, 1, 0);

class FileReaderPolyfill {
  result = null;
  onloadend = null;

  async readAsArrayBuffer(blob) {
    this.result = await blob.arrayBuffer();
    this.onloadend?.();
  }

  async readAsDataURL(blob) {
    const buffer = Buffer.from(await blob.arrayBuffer());
    this.result = `data:${blob.type || 'application/octet-stream'};base64,${buffer.toString('base64')}`;
    this.onloadend?.();
  }
}

globalThis.FileReader = FileReaderPolyfill;

const extractFaceMarks = () => {
  const position = TETRAHEDRON_GEOMETRY.getAttribute('position');
  const faceMarks = [];

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
    const quaternion = new THREE.Quaternion().setFromUnitVectors(CYLINDER_UP, normal);

    faceMarks.push({
      position: center.addScaledVector(normal, 0.055),
      quaternion,
    });
  }

  return faceMarks;
};

const buildEdgeMeshes = (material) => {
  const edgePositions = EDGE_GEOMETRY.getAttribute('position');
  const group = new THREE.Group();

  for (let index = 0; index < edgePositions.count; index += 2) {
    const start = new THREE.Vector3(
      edgePositions.getX(index),
      edgePositions.getY(index),
      edgePositions.getZ(index),
    );
    const end = new THREE.Vector3(
      edgePositions.getX(index + 1),
      edgePositions.getY(index + 1),
      edgePositions.getZ(index + 1),
    );
    const vector = end.clone().sub(start);
    const length = vector.length();
    const cylinder = new THREE.Mesh(
      new THREE.CylinderGeometry(EDGE_CYLINDER_RADIUS, EDGE_CYLINDER_RADIUS, length, 12),
      material,
    );

    cylinder.position.copy(start.clone().add(end).multiplyScalar(0.5));
    cylinder.quaternion.setFromUnitVectors(CYLINDER_UP, vector.normalize());
    group.add(cylinder);
  }

  return group;
};

const buildModel = () => {
  const root = new THREE.Group();
  const shellMaterial = new THREE.MeshStandardMaterial({
    color: '#6B4321',
    metalness: 0.04,
    opacity: 0.14,
    roughness: 0.84,
    side: THREE.BackSide,
    transparent: true,
  });
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: '#F5E8CC',
    metalness: 0.08,
    roughness: 0.56,
  });
  const coreMaterial = new THREE.MeshStandardMaterial({
    color: '#E5D2AE',
    metalness: 0.03,
    roughness: 0.66,
  });
  const edgeMaterial = new THREE.MeshStandardMaterial({
    color: '#5A381C',
    metalness: 0.08,
    roughness: 0.42,
  });
  const faceMarkMaterial = new THREE.MeshStandardMaterial({
    color: '#26160D',
    metalness: 0.04,
    roughness: 0.74,
  });

  const shell = new THREE.Mesh(TETRAHEDRON_GEOMETRY, shellMaterial);
  shell.scale.setScalar(1.05);
  root.add(shell);

  const body = new THREE.Mesh(TETRAHEDRON_GEOMETRY, bodyMaterial);
  root.add(body);

  const core = new THREE.Mesh(TETRAHEDRON_GEOMETRY, coreMaterial);
  core.scale.setScalar(0.885);
  root.add(core);

  const edgeGroup = buildEdgeMeshes(edgeMaterial);
  root.add(edgeGroup);

  extractFaceMarks().forEach(({ position, quaternion }) => {
    const mark = new THREE.Mesh(FACE_MARK_GEOMETRY, faceMarkMaterial);
    mark.position.copy(position);
    mark.quaternion.copy(quaternion);
    root.add(mark);
  });

  return root;
};

const exporter = new GLTFExporter();
const scene = new THREE.Scene();
scene.add(buildModel());

const glbBuffer = await new Promise((resolve, reject) => {
  exporter.parse(
    scene,
    (result) => {
      if (result instanceof ArrayBuffer) {
        resolve(Buffer.from(result));
        return;
      }

      reject(new Error('Expected GLB ArrayBuffer output.'));
    },
    reject,
    { binary: true, onlyVisible: true },
  );
});

await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
await fs.writeFile(OUTPUT_PATH, glbBuffer);
console.log(`Wrote ${OUTPUT_PATH}`);
