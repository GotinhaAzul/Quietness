<script lang="ts">
  import { settings } from '$lib/stores/settings';
  import { viewMode } from '$lib/stores/editor';
  import { petCursorCoords, petLastTypingTime } from '$lib/stores/pet';
  import {
    DEFAULT_COLORS, ORB_CORE, BIG_FLAME_CONFIG, SMALL_PARTICLE_CONFIG,
    ANIMATION_PRESETS, PIXEL, SMALL_PIXEL,
    BREATH_AMPLITUDE, BREATH_SPEED,
    type PetColorPalette, type AnimState,
  } from '$lib/components/pet-sprites';
  import { onMount, onDestroy } from 'svelte';

  let colors: PetColorPalette = $derived($settings.pet.colors);
  let bigFlameEnabled = $derived($settings.pet.bigFlameEnabled);
  let smallParticleEnabled = $derived($settings.pet.smallParticleEnabled);
  let ambientParticlesEnabled = $derived($settings.pet.ambientParticlesEnabled);
  let currentMode = $derived($viewMode);
  let cursorCoords = $derived($petCursorCoords);
  let lastTyping = $derived($petLastTypingTime);
  let animState: AnimState = $state('idle');
  let canvasEl: HTMLCanvasElement = $state(null as unknown as HTMLCanvasElement);
  let ctx: CanvasRenderingContext2D | null = null;
  let rafId: number | undefined;

  interface AmbientParticle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    phase: number;
    isEmber: boolean;
  }

  let ambientParticles: AmbientParticle[] = [];

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

  let bfX = 0;
  let bfY = 0;
  let showBigFlame = true;

  let spX = 0;
  let spY = 0;
  let lastSpX = 0;
  let lastSpY = 0;
  let spTargetX = 0;
  let spTargetY = 0;
  let isSeparated = false;
  let spSpinning = false;
  let prevMode = 'split';

  let mouseX: number | null = null;
  let mouseY: number | null = null;
  let trailEmbers: Particle[] = [];

  let mouseLookActive = false;
  let targetAngle = 0;
  let previewPanelEl: HTMLElement | null = null;
  let isPageHidden = false;

  const MOUSE_LOOK_RADIUS = 80;
  const PUFF_RADIUS = 4;
  const LOOK_ANGLES = [-0.8, -0.3, 0.3, 0.8];

  $effect(() => {
    if (currentMode !== prevMode) {
      prevMode = currentMode;
      refreshPreviewPanelCache();

      burstFramesRemaining = 0;
      animState = 'idle';
      spSpinning = false;

      petLastTypingTime.set(0);

      if (currentMode === 'edit') {
        isSeparated = false;
        spX = -30;
        spY = window.innerHeight / 2;
        spTargetX = 40;
        spTargetY = window.innerHeight / 2;
      } else {
        isSeparated = true;
      }
    }
  });

  function updateBigFlamePosition() {
    if (!previewPanelEl || !previewPanelEl.isConnected) {
      refreshPreviewPanelCache();
    }
    const preview = previewPanelEl;
    if (preview && (currentMode === 'split' || currentMode === 'preview') && bigFlameEnabled) {
      const rect = preview.getBoundingClientRect();
      bfX = rect.right - 50;
      bfY = rect.bottom + 45;
      showBigFlame = true;
    } else {
      showBigFlame = false;
    }
  }

  function resize() {
    if (!canvasEl) return;
    canvasEl.width = window.innerWidth;
    canvasEl.height = window.innerHeight;
    refreshPreviewPanelCache();
    updateBigFlamePosition();
  }

  function refreshPreviewPanelCache() {
    previewPanelEl = document.getElementById('preview-panel');
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

  function hexToRgba(hex: string, alpha: number): string {
    const cleanHex = hex.replace('#', '');
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function initAmbientParticles() {
    const w = canvasEl?.width || window.innerWidth;
    const h = canvasEl?.height || window.innerHeight;
    ambientParticles = Array.from({ length: 25 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: 0,
      vy: -0.05 - Math.random() * 0.1,
      life: Math.random(),
      phase: Math.random() * Math.PI * 2,
      isEmber: Math.random() < 0.5,
    }));
  }

  function drawBigFlame(breath: number) {
    if (!showBigFlame) return;

    const cfg = BIG_FLAME_CONFIG;
    const preset = ANIMATION_PRESETS[animState];

    let count = Math.max(0, cfg.spawnRate + Math.round(breath));
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
      const sx = bfX + (Math.random() - 0.5) * (cfg.spawnWidth + breath + extraSpread) + wiggleOff;
      const sy = bfY - (cfg.baseY + breath);
      const vy = vyMinAdj + Math.random() * (vyMaxAdj - vyMinAdj);
      const vx = (Math.random() - 0.5) * cfg.velocities.vxRange * 2;
      const decay = cfg.decayRange.min + Math.random() * (cfg.decayRange.max - cfg.decayRange.min);
      const isEmber = Math.random() < cfg.emberChance;
      bfParticles.push({ x: sx, y: sy, vx, vy, life: 1, decay, isEmber });
    }

    for (const p of bfParticles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vx += (Math.random() - 0.5) * 0.06;
      p.vy += (Math.random() - 0.5) * 0.02;
      p.life -= p.decay;
    }

    // Radial glow aura
    const glowRadius = 20 + breath * 3;
    const glowY = bfY - cfg.baseY;
    const grad = ctx!.createRadialGradient(bfX, glowY, 0, bfX, glowY, glowRadius);
    grad.addColorStop(0, hexToRgba(colors.outer, 0.15));
    grad.addColorStop(0.5, hexToRgba(colors.outer, 0.05));
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx!.fillStyle = grad;
    ctx!.fillRect(bfX - glowRadius, glowY - glowRadius, glowRadius * 2, glowRadius * 2);

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
    const tipY = Math.round((bfY - (cfg.baseY + breath) - 15 + tipBob) / PIXEL) * PIXEL;
    ctx!.fillStyle = colors.core;
    ctx!.globalAlpha = 0.8;
    ctx!.fillRect(tipX, tipY, PIXEL, PIXEL);
    ctx!.globalAlpha = 1;
  }

  function drawSmallParticle() {
    if (!smallParticleEnabled) return;

    // Draw trailEmbers (Subtask B3)
    for (const e of trailEmbers) {
      const sx = Math.round(e.x / SMALL_PIXEL) * SMALL_PIXEL;
      const sy = Math.round(e.y / SMALL_PIXEL) * SMALL_PIXEL;
      ctx!.globalAlpha = e.life * 0.6;
      ctx!.fillStyle = colors.ember;
      ctx!.fillRect(sx, sy, 2, 2);
    }
    ctx!.globalAlpha = 1;

    if (!isSeparated) return;

    const cfg = SMALL_PARTICLE_CONFIG;

    const cx = Math.round(spX / SMALL_PIXEL) * SMALL_PIXEL;
    const cy = Math.round(spY / SMALL_PIXEL) * SMALL_PIXEL;

    for (const [ox, oy] of ORB_CORE) {
      const dist = Math.sqrt(ox * ox + oy * oy);
      const maxDist = 1.5;
      const t = Math.min(dist / maxDist, 1);
      const col = t < 0.25 ? colors.core : t < 0.5 ? colors.inner : t < 0.75 ? colors.mid : colors.outer;
      ctx!.globalAlpha = 0.9;
      ctx!.fillStyle = col;
      ctx!.fillRect(cx + ox * SMALL_PIXEL, cy + oy * SMALL_PIXEL, SMALL_PIXEL, SMALL_PIXEL);
    }

    const sparkSpeed = spSpinning ? ANIMATION_PRESETS.spin.spin!.speed : cfg.sparkSpeed;

    spOrbiters.forEach((s, i) => {
      s.phase += s.phaseSpeed;

      if (mouseLookActive) {
        const lookAngle = targetAngle + LOOK_ANGLES[i];
        let diff = lookAngle - s.angle;
        diff = Math.atan2(Math.sin(diff), Math.cos(diff));
        s.angle += diff * 0.2;
      } else {
        s.angle += sparkSpeed;
      }

      const baseRadius = mouseLookActive ? PUFF_RADIUS : s.radius;
      const r = baseRadius + Math.sin(s.phase) * 0.5;
      const sx = cx + Math.round(Math.cos(s.angle) * r) * SMALL_PIXEL;
      const sy = cy + Math.round(Math.sin(s.angle) * r) * SMALL_PIXEL;
      ctx!.globalAlpha = 0.4 + 0.3 * Math.sin(s.phase);
      ctx!.fillStyle = colors.outer;
      ctx!.fillRect(sx, sy, SMALL_PIXEL, SMALL_PIXEL);
    });

    ctx!.globalAlpha = 1;
  }

  function tick() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
    bfFrame++;

    updateBigFlamePosition();

    const now = performance.now();
    const elapsed = lastTyping > 0 ? now - lastTyping : Infinity;
    const isActive = elapsed < 2000;
    const isIdleSpin = elapsed >= 2000 && elapsed < 10000;
    const isIdleMerged = elapsed >= 10000;

    // ── Small particle spinning ──
    spSpinning = isIdleSpin && isSeparated;
    mouseLookActive = false;

    // ── Big flame reaction to mouse proximity (Subtask B1) ──
    let wiggleChance = 0.008;
    if (mouseX !== null && mouseY !== null) {
      const dx = mouseX - bfX;
      const dy = mouseY - bfY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 120) {
        wiggleChance = 0.03;
      }
    }

    // ── Big flame idle animations (burst / wiggle) ──
    if (showBigFlame && !isActive) {
      if (burstFramesRemaining > 0) {
        burstFramesRemaining--;
        animState = 'burst';
      } else if (animState === 'burst') {
        animState = 'idle';
      } else if (animState === 'wiggle' && Math.random() < 0.02) {
        animState = 'idle';
      } else if (animState !== 'wiggle' && Math.random() < 0.003) {
        animState = 'burst';
        burstFramesRemaining = ANIMATION_PRESETS.burst.burst!.duration;
      } else if (animState !== 'wiggle' && Math.random() < wiggleChance) {
        animState = 'wiggle';
      } else if (isIdleSpin) {
        animState = 'spin';
      } else {
        animState = 'idle';
      }
    } else if (isActive) {
      animState = 'idle';
    }

    // ── Small particle positioning ──
    if (isActive && cursorCoords) {
      spTargetX = cursorCoords.x + 12;
      spTargetY = cursorCoords.y;
      isSeparated = true;
    } else if (isIdleSpin && isSeparated) {
      // Spin in place — keep current position as target
      spTargetX = spX;
      spTargetY = spY;

      if (mouseX !== null && mouseY !== null) {
        const dx = mouseX - spX;
        const dy = mouseY - spY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MOUSE_LOOK_RADIUS) {
          mouseLookActive = true;
          spSpinning = false;
          targetAngle = Math.atan2(dy, dx);
        }
      }
    } else if (isIdleMerged && isSeparated) {
      // Return to big flame (or left edge in edit-only mode)
      if (showBigFlame) {
        spTargetX = bfX - 10;
        spTargetY = bfY - 20;
      } else {
        spTargetX = 40;
        spTargetY = canvasEl.height / 2;
      }
      const dx = spX - spTargetX;
      const dy = spY - spTargetY;
      if (Math.sqrt(dx * dx + dy * dy) < 8) {
        isSeparated = false;
        spSpinning = false;
      }
    } else {
      // Resting at big flame or left edge
      if (showBigFlame) {
        spTargetX = bfX - 10;
        spTargetY = bfY - 20;
      } else {
        spTargetX = 40;
        spTargetY = canvasEl.height / 2;
      }
    }

    const lerpFactor = isActive ? 0.18 : 0.04;
    spX += (spTargetX - spX) * lerpFactor;
    spY += (spTargetY - spY) * lerpFactor;

    // Wobble Idle: Small Particle tremida aleatória (Subtask B4)
    if (!isActive && smallParticleEnabled) {
      const isResting = !isSeparated;
      const isSpinning = isIdleSpin && isSeparated;
      if ((isResting || isSpinning) && Math.random() < 0.005) {
        spX += (Math.random() - 0.5) * 8;
        spY += (Math.random() - 0.5) * 4;
      }
    }

    // Rastilho de Embers: Small Particle (Subtask B3)
    const spMoved = Math.abs(spX - lastSpX) > 1 || Math.abs(spY - lastSpY) > 1;
    if (isSeparated && !isActive && spMoved && smallParticleEnabled) {
      const decay = 0.06 + Math.random() * 0.02; // decay rápido (0.06–0.08)
      trailEmbers.push({
        x: spX,
        y: spY,
        vx: 0,
        vy: 0,
        life: 1,
        decay,
        isEmber: true,
      });
    }

    // Atualizar trailEmbers (decay apenas, sem velocidade)
    for (const e of trailEmbers) {
      e.life -= e.decay;
    }
    trailEmbers = trailEmbers.filter(e => e.life > 0);

    // Respiração Idle: Big Flame (Subtask A)
    const breath = Math.sin(bfFrame * BREATH_SPEED) * BREATH_AMPLITUDE;

    // T15 — Ambient Particles
    if (ambientParticlesEnabled) {
      if (ambientParticles.length === 0) {
        initAmbientParticles();
      }
      for (const p of ambientParticles) {
        p.phase += 0.03;
        p.vx += Math.sin(p.phase) * 0.02;
        p.vx *= 0.95;
        p.x += p.vx;
        p.y += p.vy;

        // Wrap or respawn
        if (p.y < -5) {
          p.y = canvasEl.height + 5;
          p.x = Math.random() * canvasEl.width;
          p.vy = -0.05 - Math.random() * 0.1;
          p.life = Math.random();
          p.phase = Math.random() * Math.PI * 2;
          p.isEmber = Math.random() < 0.5;
        }
        if (p.x < -5) p.x = canvasEl.width + 5;
        if (p.x > canvasEl.width + 5) p.x = -5;

        ctx!.globalAlpha = 0.05 + p.life * 0.15;
        ctx!.fillStyle = p.isEmber ? colors.ember : colors.outer;
        const size = p.life < 0.5 ? 1 : 2;
        ctx!.fillRect(Math.round(p.x), Math.round(p.y), size, size);
      }
      ctx!.globalAlpha = 1;
    } else if (ambientParticles.length > 0) {
      ambientParticles = [];
    }

    drawBigFlame(breath);
    drawSmallParticle();

    lastSpX = spX;
    lastSpY = spY;

    rafId = requestAnimationFrame(tick);
  }

  function startLoop() {
    if (!ctx && canvasEl) {
      ctx = canvasEl.getContext('2d');
    }
    if (ctx && !rafId) {
      resize();
      initSparks();
      updateBigFlamePosition();
      const isEditMode = currentMode === 'edit' || !showBigFlame;
      if (isEditMode) {
        spX = -20;
        spY = canvasEl.height / 2;
      } else {
        spX = bfX - 10;
        spY = bfY - 20;
      }
      spTargetX = spX;
      spTargetY = spY;
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

  function handleMouseMove(e: MouseEvent) {
    mouseX = e.clientX;
    mouseY = e.clientY;
  }

  function handleMouseLeave() {
    mouseX = null;
    mouseY = null;
  }

  function handleVisibilityChange() {
    isPageHidden = document.visibilityState !== 'visible';
    if (isPageHidden) {
      stopLoop();
      return;
    }
    const anyEnabled = bigFlameEnabled || smallParticleEnabled || ambientParticlesEnabled;
    if (anyEnabled && canvasEl && !rafId) {
      startLoop();
    }
  }

  onMount(() => {
    refreshPreviewPanelCache();
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    isPageHidden = document.visibilityState !== 'visible';
    if (!isPageHidden && (bigFlameEnabled || smallParticleEnabled || ambientParticlesEnabled) && canvasEl) {
      startLoop();
    }
  });

  onDestroy(() => {
    stopLoop();
    window.removeEventListener('resize', resize);
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseleave', handleMouseLeave);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  });

  $effect(() => {
    const anyEnabled = bigFlameEnabled || smallParticleEnabled || ambientParticlesEnabled;
    if (anyEnabled && !isPageHidden) {
      if (canvasEl && !rafId) {
        startLoop();
      }
    } else {
      stopLoop();
    }
  });
</script>

{#if bigFlameEnabled || smallParticleEnabled || ambientParticlesEnabled}
  <canvas
    bind:this={canvasEl}
    class="flame-canvas"
    onmousemove={handleMouseMove}
    onmouseleave={handleMouseLeave}
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
