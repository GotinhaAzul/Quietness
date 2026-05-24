<script lang="ts">
  import { settings } from '$lib/stores/settings';
  import { viewMode } from '$lib/stores/editor';
  import {
    DEFAULT_COLORS, ORB_CORE, BIG_FLAME_CONFIG, SMALL_PARTICLE_CONFIG,
    ANIMATION_PRESETS, PIXEL,
    type PetColorPalette, type AnimState,
  } from '$lib/components/pet-sprites';
  import { onMount, onDestroy } from 'svelte';

  let colors: PetColorPalette = $derived($settings.pet.colors);
  let enabled = $derived($settings.pet.enabled);
  let currentMode = $derived($viewMode);
  let animState: AnimState = $state('idle');
  let canvasEl: HTMLCanvasElement = $state(null as unknown as HTMLCanvasElement);
  let ctx: CanvasRenderingContext2D | null = null;
  let rafId: number | undefined;

  interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    decay: number;
    isEmber: boolean;
  }

  let bfParticles: Particle[] = [];
  let bfFrame = 0;
  let burstFramesRemaining = 0;

  interface Spark {
    angle: number;
    radius: number;
    speed: number;
    phase: number;
    phaseSpeed: number;
  }

  let spOrbiters: Spark[] = [];
  let bfX: number;
  let bfY: number;
  let spX: number;
  let spY: number;

  function updatePositions() {
    bfX = canvasEl.width - 60;
    bfY = canvasEl.height - 60;
    spX = canvasEl.width / 2 - 100;
    spY = canvasEl.height - 200;
  }

  function resize() {
    if (!canvasEl) return;
    canvasEl.width = window.innerWidth;
    canvasEl.height = window.innerHeight;
    updatePositions();
  }

  function initSparks() {
    spOrbiters = Array.from({ length: SMALL_PARTICLE_CONFIG.sparkCount }, (_, i) => ({
      angle: (i / SMALL_PARTICLE_CONFIG.sparkCount) * Math.PI * 2,
      radius: SMALL_PARTICLE_CONFIG.sparkRadius,
      speed: SMALL_PARTICLE_CONFIG.sparkSpeed + Math.random() * 0.015,
      phase: Math.random() * Math.PI * 2,
      phaseSpeed: 0.05,
    }));
  }

  function drawBigFlame() {
    const cfg = BIG_FLAME_CONFIG;
    const preset = ANIMATION_PRESETS[animState];

    let count = cfg.spawnRate;
    let extraSpread = 0;
    let forceMul = 1;

    if (animState === 'burst' && burstFramesRemaining > 0) {
      const bp = preset.burst!;
      count += bp.extraParticles;
      extraSpread = bp.spread;
      forceMul = bp.force;
      burstFramesRemaining--;
    }

    let wiggleOff = 0;
    if (animState === 'wiggle') {
      const wp = preset.wiggle!;
      wiggleOff = Math.sin(bfFrame * wp.frequency) * wp.amplitude;
    }

    const vyMinAdj = cfg.velocities.vyMin * forceMul;
    const vyMaxAdj = cfg.velocities.vyMax * forceMul;

    for (let i = 0; i < count; i++) {
      const sx = bfX + (Math.random() - 0.5) * (cfg.spawnWidth + extraSpread) + wiggleOff;
      const sy = bfY - cfg.baseY;
      const vy = vyMinAdj + Math.random() * (vyMaxAdj - vyMinAdj);
      const vx = (Math.random() - 0.5) * cfg.velocities.vxRange * 2;
      const decay = cfg.decayRange.min + Math.random() * (cfg.decayRange.max - cfg.decayRange.min);
      const isEmber = Math.random() < cfg.emberChance;
      bfParticles.push({ x: sx, y: sy, vx, vy, life: 1, decay, isEmber });
    }

    for (const p of bfParticles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vx += (Math.random() - 0.5) * 0.02;
      p.vy += (Math.random() - 0.5) * 0.01;
      p.life -= p.decay;
    }

    for (const p of bfParticles) {
      const sx = Math.round(p.x / PIXEL) * PIXEL;
      const sy = Math.round(p.y / PIXEL) * PIXEL;

      if (p.isEmber) {
        ctx!.globalAlpha = p.life * 0.6;
        ctx!.fillStyle = colors.ember;
      } else if (p.life > 0.75) {
        ctx!.globalAlpha = p.life;
        ctx!.fillStyle = colors.core;
      } else if (p.life > 0.5) {
        ctx!.globalAlpha = p.life;
        ctx!.fillStyle = colors.inner;
      } else if (p.life > 0.25) {
        ctx!.globalAlpha = p.life;
        ctx!.fillStyle = colors.mid;
      } else {
        ctx!.globalAlpha = p.life * 0.8;
        ctx!.fillStyle = colors.outer;
      }

      const size = p.isEmber ? 2 : PIXEL;
      ctx!.fillRect(sx, sy, size, size);
    }

    ctx!.globalAlpha = 1;
    bfParticles = bfParticles.filter(p => p.life > 0);

    const tipBob = Math.sin(bfFrame * 0.05) * 2;
    const tipX = Math.round(bfX / PIXEL) * PIXEL;
    const tipY = Math.round((bfY - cfg.baseY - 15 + tipBob) / PIXEL) * PIXEL;
    ctx!.fillStyle = colors.core;
    ctx!.globalAlpha = 0.8;
    ctx!.fillRect(tipX, tipY, PIXEL, PIXEL);
    ctx!.globalAlpha = 1;
  }

  function drawSmallParticle() {
    const cfg = SMALL_PARTICLE_CONFIG;

    const cx = Math.round(spX / PIXEL) * PIXEL;
    const cy = Math.round(spY / PIXEL) * PIXEL;

    for (const [ox, oy] of ORB_CORE) {
      const dist = Math.sqrt(ox * ox + oy * oy);
      const maxDist = 1.5;
      const t = Math.min(dist / maxDist, 1);
      const col = t < 0.25 ? colors.core : t < 0.5 ? colors.inner : t < 0.75 ? colors.mid : colors.outer;
      ctx!.globalAlpha = 0.9;
      ctx!.fillStyle = col;
      ctx!.fillRect(cx + ox * PIXEL, cy + oy * PIXEL, PIXEL, PIXEL);
    }

    const sparkSpeed = animState === 'spin' ? ANIMATION_PRESETS.spin.spin!.speed : cfg.sparkSpeed;

    for (const s of spOrbiters) {
      s.angle += sparkSpeed;
      s.phase += s.phaseSpeed;

      const r = s.radius + Math.sin(s.phase) * 0.5;
      const sx = cx + Math.round(Math.cos(s.angle) * r) * PIXEL;
      const sy = cy + Math.round(Math.sin(s.angle) * r) * PIXEL;
      ctx!.globalAlpha = 0.4 + 0.3 * Math.sin(s.phase);
      ctx!.fillStyle = colors.outer;
      ctx!.fillRect(sx, sy, PIXEL, PIXEL);
    }

    ctx!.globalAlpha = 1;
  }

  function tick() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
    bfFrame++;

    drawBigFlame();
    drawSmallParticle();

    rafId = requestAnimationFrame(tick);
  }

  function startLoop() {
    if (!ctx && canvasEl) {
      ctx = canvasEl.getContext('2d');
    }
    if (ctx && !rafId) {
      resize();
      initSparks();
      rafId = requestAnimationFrame(tick);
    }
  }

  function stopLoop() {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = undefined;
    }
    if (ctx && canvasEl) {
      ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
    }
    ctx = null;
  }

  onMount(() => {
    window.addEventListener('resize', resize);
    if (enabled && canvasEl) {
      startLoop();
    }
  });

  onDestroy(() => {
    if (rafId) cancelAnimationFrame(rafId);
    window.removeEventListener('resize', resize);
  });

  $effect(() => {
    if (enabled) {
      if (canvasEl && !rafId) {
        startLoop();
      }
    } else {
      stopLoop();
    }
  });
</script>

{#if enabled}
  <canvas
    bind:this={canvasEl}
    class="flame-canvas"
  ></canvas>
{/if}

<style>
  .flame-canvas {
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    image-rendering: pixelated;
    z-index: 40;
  }
</style>
