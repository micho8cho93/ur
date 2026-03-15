/* eslint-disable @typescript-eslint/no-require-imports */

const globalScope = globalThis as typeof globalThis & {
  THREE?: typeof import('three');
};

const sharedThree = globalScope.THREE ?? (require('three') as typeof import('three'));

// Keep one shared Three.js instance so Metro doesn't evaluate both the ESM and CJS builds on native.
globalScope.THREE = sharedThree;

export default sharedThree;
