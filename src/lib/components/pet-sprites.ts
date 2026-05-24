import type { PetColorPalette } from '$lib/types/settings';

export type { PetColorPalette };

export interface BurstParams {
  extraParticles: number;
  spread: number;
  force: number;
  duration: number;
}

export interface WiggleParams {
  amplitude: number;
  frequency: number;
}

export interface SpinParams {
  speed: number;
}

export type AnimState = 'idle' | 'burst' | 'wiggle' | 'spin';

export const DEFAULT_COLORS: PetColorPalette = {
  core: '#ffffff',
  inner: '#c98aff',
  mid: '#912eff',
  outer: '#5a00c2',
  ember: '#5a00c2',
};

export const ORB_CORE: [number, number][] = [
  [0, -1], [-1, 0], [0, 0], [1, 0], [0, 1],
];

export const BIG_FLAME_CONFIG = {
  spawnRate: 3,
  spawnWidth: 4,
  baseY: 42,
  velocities: { vyMin: -0.4, vyMax: -0.2, vxRange: 0.15 },
  decayRange: { min: 0.02, max: 0.05 },
  emberChance: 0.15,
} as const;

export const SMALL_PARTICLE_CONFIG = {
  sparkCount: 4,
  sparkRadius: 2.5,
  sparkSpeed: 0.04,
  spinSpeed: 0.06,
  pixelScale: 3,
} as const;

export const ANIMATION_PRESETS: Record<AnimState, {
  burst?: BurstParams;
  wiggle?: WiggleParams;
  spin?: SpinParams;
}> = {
  idle: {},
  burst: { burst: { extraParticles: 8, spread: 3, force: 1.5, duration: 20 } },
  wiggle: { wiggle: { amplitude: 1.5, frequency: 0.08 } },
  spin: { spin: { speed: 0.12 } },
};

export const PIXEL = 4;
