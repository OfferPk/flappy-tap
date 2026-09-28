/**
 * Flappy Tap v1.2 — physics + juice + power-ups, modes, combo, settings.
 * Fixed bird X; world scrolls; dt-based gravity/flap; difficulty ramp;
 * AABB death; medals; hit flash; death freeze; daily/practice; haptics stub.
 */
(function () {
  'use strict';

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  const W = 400;
  const H = 600;
  canvas.width = W;
  canvas.height = H;

  const GROUND_H = 72;
  const BIRD_X = W * 0.32;

  const GRAVITY = 1850;
  const FLAP_IMPULSE = -420;
  const TERMINAL_V = 620;
  const FLAP_COOLDOWN = 0.08;
  const PIPE_W = 64;

  const BASE_SPEED = 160;
  const BASE_GAP = 152;
  const BASE_SPAWN = 210;
  const SPEED_CAP = 260;
  const GAP_FLOOR = 108;
  const SPAWN_FLOOR = 155;
  const SPEED_PER_SCORE = 2.2;
  const GAP_SHRINK_PER = 0.9;
  const SPAWN_SHRINK_PER = 1.1;

  const MEDAL_BRONZE = 10;
  const MEDAL_SILVER = 25;
  const MEDAL_GOLD = 50;

  const DEATH_FREEZE_MS = 650;
  const HIT_FLASH_MS = 180;
  const NEAR_MISS_PX = 16;
  const COMBO_X2_AT = 5;
  const PRACTICE_SAFE_S = 30;
  const SLOWMO_MS = 3000;
  const SLOWMO_SCALE = 0.45;
  const POWERUP_CHANCE = 0.38;
  const POWERUP_R = 14;

  let state = 'menu'; // menu | playing | dying | dead
  let bird = null;
  let pipes = [];
  let powerups = [];
  let particles = [];
  let score = 0;
  let best = 0;
  let skin = 'bird';
  let continuedThisRun = false;
  let animId = 0;
  let groundX = 0;
  let clouds = [];
  let lastTs = 0;
  let flapCooldown = 0;
  let hitFlash = 0;
  let deathFreezeUntil = 0;
  let nightMode = false;
  let currentSpeed = BASE_SPEED;
  let currentGap = BASE_GAP;
  let currentSpawn = BASE_SPAWN;

  // v1.2
  let playMode = 'classic'; // classic | daily | practice
  let combo = 0;
  let shieldActive = false;
  let slowMoUntil = 0;
  let magnetPipesLeft = 0; // next N pipes score +2 base
  let practiceSafeLeft = 0;
  let rng = Math.random;
  let sensitivity = 1;
  let reduceMotion = false;

  // DOM
  const hud = document.getElementById('hud');
  const scoreEl = document.getElementById('score-display');
  const comboEl = document.getElementById('combo-display');
  const modeBadgeEl = document.getElementById('mode-badge');
  const powerHudEl = document.getElementById('power-hud');
  const screenStart = document.getElementById('screen-start');
  const screenDeath = document.getElementById('screen-death');
  const screenSettings = document.getElementById('screen-settings');
  const finalScoreEl = document.getElementById('final-score');
  const bestStartEl = document.getElementById('best-start');
  const bestDeathEl = document.getElementById('best-death');
  const dailyBestStartEl = document.getElementById('daily-best-start');
  const modeDeathEl = document.getElementById('mode-death-label');
  const btnPlay = document.getElementById('btn-play');
  const btnDaily = document.getElementById('btn-daily');
  const btnPractice = document.getElementById('btn-practice');
  const btnRetry = document.getElementById('btn-retry');
  const btnMenu = document.getElementById('btn-menu');
  const btnContinue = document.getElementById('btn-continue');
  const btnMute = document.getElementById('btn-mute');
  const btnSettings = document.getElementById('btn-settings');
  const btnSettingsClose = document.getElementById('btn-settings-close');
  const sensSlider = document.getElementById('sens-slider');
  const sensValueEl = document.getElementById('sens-value');
  const reduceMotionChk = document.getElementById('reduce-motion');
  const skinPicker = document.getElementById('skin-picker');
  const toastEl = document.getElementById('toast');
  const medalEl = document.getElementById('medal-display');
  const medalLabelEl = document.getElementById('medal-label');
  const appEl = document.getElementById('app');

  function showToast(msg, ms) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.hidden = false;
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => {
      toastEl.hidden = true;
    }, ms || 1800);
  }

  /** Haptics stub — Vibration API when available; no-op otherwise. */
  function haptic(kind) {
    try {
      if (!navigator.vibrate) return;
      if (kind === 'death') navigator.vibrate([40, 30, 80]);
      else if (kind === 'power') navigator.vibrate(18);
      else if (kind === 'nearmiss') navigator.vibrate(10);
      else navigator.vibrate(12);
    } catch (_) { /* ignore */ }
  }

  function triggerShake() {
    if (!appEl || reduceMotion) return;
    appEl.classList.remove('shake');
    void appEl.offsetWidth;
    appEl.classList.add('shake');
    clearTimeout(triggerShake._t);
    triggerShake._t = setTimeout(() => {
      appEl.classList.remove('shake');
    }, 500);
  }

  function hashSeed(str) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function makeRng(seed) {
    let s = seed >>> 0;
    if (s === 0) s = 1;
    return function () {
      s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
      return (s >>> 0) / 4294967296;
    };
  }

  function setupRngForMode() {
    if (playMode === 'daily') {
      const day = FTStorage.getDailyDate();
      rng = makeRng(hashSeed('flappy-tap-daily-' + day));
    } else {
      rng = Math.random;
    }
  }

  function resizeCanvas() {
    const app = document.getElementById('app');
    const aw = app.clientWidth;
    const ah = app.clientHeight;
    const scale = Math.min(aw / W, ah / H);
    const dw = Math.floor(W * scale);
    const dh = Math.floor(H * scale);
    canvas.style.width = dw + 'px';
    canvas.style.height = dh + 'px';
    canvas.style.position = 'absolute';
    canvas.style.left = Math.floor((aw - dw) / 2) + 'px';
    canvas.style.top = Math.floor((ah - dh) / 2) + 'px';
  }

  function initClouds() {
    clouds = [];
    for (let i = 0; i < 5; i++) {
      clouds.push({
        x: Math.random() * W,
        y: 40 + Math.random() * 180,
        s: 0.35 + Math.random() * 0.55,
        w: 40 + Math.random() * 50
      });
    }
  }

  function syncNightFromSkin() {
    nightMode = skin === 'rickshaw';
  }

  function difficultyFor(sc) {
    currentSpeed = Math.min(SPEED_CAP, BASE_SPEED + sc * SPEED_PER_SCORE);
    currentGap = Math.max(GAP_FLOOR, BASE_GAP - sc * GAP_SHRINK_PER);
    currentSpawn = Math.max(SPAWN_FLOOR, BASE_SPAWN - sc * SPAWN_SHRINK_PER);
  }

  function medalFor(sc) {
    if (sc >= MEDAL_GOLD) return 'gold';
    if (sc >= MEDAL_SILVER) return 'silver';
    if (sc >= MEDAL_BRONZE) return 'bronze';
    return null;
  }

  function comboMultiplier() {
    return combo >= COMBO_X2_AT ? 2 : 1;
  }

  function updateComboUI() {
    if (!comboEl) return;
    if (combo >= 2 && state === 'playing') {
      comboEl.hidden = false;
      const mult = comboMultiplier();
      comboEl.textContent =
        mult > 1 ? 'COMBO x' + mult + ' · ' + combo : 'COMBO ' + combo;
      comboEl.classList.toggle('combo-hot', mult > 1);
    } else {
      comboEl.hidden = true;
    }
  }

  function updatePowerHud() {
    if (!powerHudEl) return;
    const bits = [];
    if (shieldActive) bits.push('🛡');
    if (performance.now() < slowMoUntil) bits.push('⏱');
    if (magnetPipesLeft > 0) bits.push('✦+' + magnetPipesLeft);
    if (playMode === 'practice' && practiceSafeLeft > 0) {
      bits.push('PRACTICE ' + Math.ceil(practiceSafeLeft) + 's');
    }
    if (bits.length) {
      powerHudEl.hidden = false;
      powerHudEl.textContent = bits.join('  ');
    } else {
      powerHudEl.hidden = true;
    }
  }

  function updateModeBadge() {
    if (!modeBadgeEl) return;
    if (playMode === 'daily') {
      modeBadgeEl.hidden = false;
      modeBadgeEl.textContent = 'Daily · ' + FTStorage.getDailyDate();
    } else if (playMode === 'practice') {
      modeBadgeEl.hidden = false;
      modeBadgeEl.textContent = 'Practice';
    } else {
      modeBadgeEl.hidden = true;
    }
  }

  function resetBird() {
    const hb = FTSkins.hitbox(skin);
    bird = {
      x: BIRD_X,
      y: H * 0.42,
      vy: 0,
      rot: 0,
      alive: true,
      w: hb.w,
      h: hb.h
    };
  }

  function pickPowerType() {
    const r = rng();
    if (r < 0.34) return 'shield';
    if (r < 0.67) return 'slowmo';
    return 'coin';
  }

  function maybeSpawnPowerup(pipe) {
    if (rng() > POWERUP_CHANCE) return;
    const gap = pipe.gap != null ? pipe.gap : currentGap;
    powerups.push({
      x: pipe.x + PIPE_W / 2,
      y: pipe.gapY + gap / 2,
      type: pickPowerType(),
      taken: false,
      pipeRef: pipe
    });
  }

  function makePipe(x, gap) {
    const g = gap == null ? currentGap : gap;
    const margin = 55;
    const maxTop = H - GROUND_H - g - margin;
    const gapY = margin + rng() * Math.max(10, maxTop - margin);
    const pipe = {
      x: x,
      gapY: gapY,
      gap: g,
      scored: false,
      nearMissChecked: false
    };
    maybeSpawnPowerup(pipe);
    return pipe;
  }

  function resetPipes() {
    pipes = [];
    powerups = [];
    particles = [];
    difficultyFor(0);
    const startX = W + 60;
    pipes.push(makePipe(startX));
    pipes.push(makePipe(startX + currentSpawn));
    pipes.push(makePipe(startX + currentSpawn * 2));
  }

  function updateBestUI() {
    best = FTStorage.getBest();
    if (bestStartEl) bestStartEl.textContent = String(best);
    if (bestDeathEl) {
      if (playMode === 'daily') {
        bestDeathEl.textContent = String(FTStorage.getDailyBest());
      } else {
        bestDeathEl.textContent = String(best);
      }
    }
    if (dailyBestStartEl) {
      dailyBestStartEl.textContent = String(FTStorage.getDailyBest());
    }
  }

  function setScore(n) {
    score = n;
    if (scoreEl) scoreEl.textContent = String(score);
    difficultyFor(score);
  }

  function showMedalUI(sc) {
    const m = medalFor(sc);
    if (!medalEl) return;
    if (!m || playMode === 'practice') {
      medalEl.hidden = true;
      return;
    }
    medalEl.hidden = false;
    medalEl.className = 'medal medal-' + m;
    if (medalLabelEl) {
      medalLabelEl.textContent =
        m === 'gold' ? 'Gold Medal' : m === 'silver' ? 'Silver Medal' : 'Bronze Medal';
    }
    const bestMedal = FTStorage.getBestMedal();
    const order = { bronze: 1, silver: 2, gold: 3 };
    if (!bestMedal || (order[m] || 0) > (order[bestMedal] || 0)) {
      FTStorage.setBestMedal(m);
    }
  }

  function showMenu() {
    state = 'menu';
    screenStart.hidden = false;
    screenDeath.hidden = true;
    if (screenSettings) screenSettings.hidden = true;
    hud.hidden = true;
    hitFlash = 0;
    playMode = 'classic';
    updateBestUI();
    drawFrame(true);
  }

  function showDeath() {
    state = 'dead';
    screenDeath.hidden = false;
    screenStart.hidden = true;
    if (screenSettings) screenSettings.hidden = true;
    hud.hidden = true;
    if (finalScoreEl) finalScoreEl.textContent = String(score);
    if (modeDeathEl) {
      if (playMode === 'daily') modeDeathEl.textContent = 'Daily best';
      else if (playMode === 'practice') modeDeathEl.textContent = 'Practice run';
      else modeDeathEl.textContent = 'Best';
    }
    updateBestUI();
    showMedalUI(score);
    if (btnContinue) {
      const allowContinue = playMode !== 'practice';
      btnContinue.hidden = !allowContinue;
      btnContinue.disabled = continuedThisRun || !allowContinue;
      btnContinue.textContent = continuedThisRun
        ? 'Continue used'
        : '▶ Continue (Ad)';
    }
  }

  function startRun(fromContinue, mode) {
    FTAudio.unlock();
    if (mode) playMode = mode;
    setupRngForMode();
    state = 'playing';
    screenStart.hidden = true;
    screenDeath.hidden = true;
    if (screenSettings) screenSettings.hidden = true;
    hud.hidden = false;
    hitFlash = 0;
    deathFreezeUntil = 0;
    flapCooldown = 0;
    lastTs = 0;
    updateModeBadge();

    if (!fromContinue) {
      continuedThisRun = false;
      combo = 0;
      shieldActive = false;
      slowMoUntil = 0;
      magnetPipesLeft = 0;
      practiceSafeLeft = playMode === 'practice' ? PRACTICE_SAFE_S : 0;
      setScore(0);
      resetBird();
      resetPipes();
      groundX = 0;
    } else {
      resetBird();
      bird.y = H * 0.4;
      bird.vy = 0;
      shieldActive = false;
      pipes.forEach((p) => {
        if (p.x < bird.x + 100) p.x = bird.x + 200;
      });
      for (let i = 1; i < pipes.length; i++) {
        if (pipes[i].x < pipes[i - 1].x + currentSpawn) {
          pipes[i].x = pipes[i - 1].x + currentSpawn;
        }
      }
      powerups = powerups.filter((pu) => pu.x > bird.x + 40);
    }
    updateComboUI();
    updatePowerHud();
    if (!animId) loop(performance.now());
  }

  function flap() {
    const sens = sensitivity;
    const impulse = FLAP_IMPULSE * sens;
    if (state === 'menu') {
      startRun(false, 'classic');
      bird.vy = impulse;
      flapCooldown = FLAP_COOLDOWN;
      FTAudio.flap();
      return;
    }
    if (state !== 'playing' || !bird || !bird.alive) return;
    if (flapCooldown > 0) return;
    bird.vy = impulse;
    flapCooldown = FLAP_COOLDOWN;
    FTAudio.flap();
  }

  function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }

  function checkCollision() {
    const halfW = bird.w / 2;
    const halfH = bird.h / 2;
    const left = bird.x - halfW;
    const top = bird.y - halfH;

    if (bird.y + halfH >= H - GROUND_H) return true;
    if (bird.y - halfH <= 0) return true;

    for (let i = 0; i < pipes.length; i++) {
      const p = pipes[i];
      const gap = p.gap != null ? p.gap : currentGap;
      if (rectsOverlap(left, top, bird.w, bird.h, p.x, 0, PIPE_W, p.gapY))
        return true;
      const by = p.gapY + gap;
      if (
        rectsOverlap(
          left,
          top,
          bird.w,
          bird.h,
          p.x,
          by,
          PIPE_W,
          H - GROUND_H - by
        )
      )
        return true;
    }
    return false;
  }

  function spawnNearMissSparks(x, y) {
    if (reduceMotion) {
      // one subtle flash particle only
      particles.push({
        x: x,
        y: y,
        vx: 0,
        vy: 0,
        life: 0.25,
        max: 0.25,
        color: '#fff8a0',
        r: 3
      });
      return;
    }
    for (let i = 0; i < 10; i++) {
      const a = (Math.PI * 2 * i) / 10 + rng() * 0.3;
      const sp = 40 + rng() * 90;
      particles.push({
        x: x,
        y: y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: 0.35 + rng() * 0.25,
        max: 0.6,
        color: i % 2 ? '#ffd93d' : '#ffffff',
        r: 2 + rng() * 2.5
      });
    }
  }

  function collectPowerup(pu) {
    pu.taken = true;
    FTAudio.powerup();
    haptic('power');
    if (pu.type === 'shield') {
      shieldActive = true;
      showToast('Shield!');
    } else if (pu.type === 'slowmo') {
      slowMoUntil = performance.now() + SLOWMO_MS;
      showToast('Slow-mo 3s');
    } else if (pu.type === 'coin') {
      magnetPipesLeft = Math.max(magnetPipesLeft, 1);
      showToast('Magnet · next pipe +2');
    }
    updatePowerHud();
  }

  function beginDeath() {
    if (state !== 'playing') return;

    // Practice invulnerability window
    if (playMode === 'practice' && practiceSafeLeft > 0) {
      // Bounce slightly off hazard instead of dying
      if (bird.vy > 0) bird.vy = FLAP_IMPULSE * 0.6 * sensitivity;
      else bird.vy = Math.abs(bird.vy) * 0.4;
      // Nudge out of ceiling/ground
      const halfH = bird.h / 2;
      if (bird.y + halfH >= H - GROUND_H) bird.y = H - GROUND_H - halfH - 2;
      if (bird.y - halfH <= 0) bird.y = halfH + 2;
      return;
    }

    // Shield absorbs one hit
    if (shieldActive) {
      shieldActive = false;
      hitFlash = 0.55;
      FTAudio.nearmiss();
      showToast('Shield broke!');
      updatePowerHud();
      // Clear immediate pipe overlap by nudging bird to gap center of nearest pipe
      let nearest = null;
      let bestDx = 1e9;
      for (let i = 0; i < pipes.length; i++) {
        const dx = Math.abs(pipes[i].x + PIPE_W / 2 - bird.x);
        if (dx < bestDx) {
          bestDx = dx;
          nearest = pipes[i];
        }
      }
      if (nearest) {
        const gap = nearest.gap != null ? nearest.gap : currentGap;
        bird.y = nearest.gapY + gap / 2;
        bird.vy = 0;
      }
      return;
    }

    bird.alive = false;
    state = 'dying';
    FTAudio.hit();
    haptic('death');
    triggerShake();
    hitFlash = 1;
    deathFreezeUntil = performance.now() + DEATH_FREEZE_MS;
    if (playMode === 'daily') {
      FTStorage.setDailyBest(score);
    } else if (playMode !== 'practice') {
      best = FTStorage.setBest(score);
    }
    updateBestUI();
  }

  function addPipeScore(p) {
    const base = magnetPipesLeft > 0 ? 2 : 1;
    if (magnetPipesLeft > 0) magnetPipesLeft--;
    combo += 1;
    const prevMult = comboMultiplier();
    // streak just increased — check if we crossed threshold
    const mult = comboMultiplier();
    const gained = base * mult;
    setScore(score + gained);
    FTAudio.score();
    if (mult > 1 && (combo === COMBO_X2_AT || (combo > COMBO_X2_AT && combo % 5 === 0))) {
      FTAudio.combo();
      showToast('Combo x' + mult + '!');
    }
    updateComboUI();
    updatePowerHud();
    void p;
    void prevMult;
  }

  function checkNearMiss(p) {
    if (p.nearMissChecked) return;
    // Once bird X is past pipe center, evaluate clearance
    if (bird.x < p.x + PIPE_W * 0.35) return;
    p.nearMissChecked = true;
    const gap = p.gap != null ? p.gap : currentGap;
    const halfH = bird.h / 2;
    const topClear = bird.y - halfH - p.gapY;
    const botClear = p.gapY + gap - (bird.y + halfH);
    const clear = Math.min(topClear, botClear);
    // Near-miss juice only — no combo penalty
    if (clear >= 0 && clear < NEAR_MISS_PX) {
      const ySpark =
        topClear < botClear ? p.gapY + 4 : p.gapY + gap - 4;
      spawnNearMissSparks(p.x + PIPE_W / 2, ySpark);
      FTAudio.nearmiss();
      haptic('nearmiss');
    }
  }

  function update(dt) {
    if (dt > 0.05) dt = 0.05;

    const now = performance.now();
    const slowActive = now < slowMoUntil;
    const timeScale = slowActive ? SLOWMO_SCALE : 1;
    const sdt = dt * timeScale;

    const scroll = currentSpeed * sdt * (state === 'playing' ? 1 : 0.35);

    groundX = (groundX - scroll * (state === 'playing' ? 1 : 0.5)) % 40;
    clouds.forEach((c) => {
      c.x -= c.s * (state === 'playing' ? currentSpeed * 0.15 * sdt : 8 * dt);
      if (c.x < -80) c.x = W + 40;
    });

    // Particles always tick in real time
    for (let i = particles.length - 1; i >= 0; i--) {
      const pt = particles[i];
      pt.life -= dt;
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vy += 120 * dt;
      if (pt.life <= 0) particles.splice(i, 1);
    }

    if (hitFlash > 0) {
      hitFlash = Math.max(0, hitFlash - dt * (1000 / HIT_FLASH_MS));
    }

    if (state === 'dying') {
      if (performance.now() >= deathFreezeUntil) {
        showDeath();
      }
      return;
    }

    if (state !== 'playing' || !bird) return;

    if (flapCooldown > 0) flapCooldown -= sdt;

    if (playMode === 'practice' && practiceSafeLeft > 0) {
      practiceSafeLeft = Math.max(0, practiceSafeLeft - dt);
      if (practiceSafeLeft === 0) showToast('Practice over — real danger!');
      updatePowerHud();
    }

    if (slowActive) updatePowerHud();
    else if (slowMoUntil && now >= slowMoUntil) {
      slowMoUntil = 0;
      updatePowerHud();
    }

    const g = GRAVITY * sensitivity;
    const term = TERMINAL_V * Math.max(0.85, sensitivity);
    bird.vy += g * sdt;
    if (bird.vy > term) bird.vy = term;
    bird.y += bird.vy * sdt;

    const targetRot = Math.max(-0.65, Math.min(1.25, bird.vy / 500));
    bird.rot += (targetRot - bird.rot) * Math.min(1, sdt * 12);

    for (let i = 0; i < pipes.length; i++) {
      const p = pipes[i];
      p.x -= currentSpeed * sdt;
      checkNearMiss(p);
      if (!p.scored && p.x + PIPE_W < bird.x) {
        p.scored = true;
        addPipeScore(p);
      }
    }

    // Sync powerups that track pipes, scroll others
    for (let i = powerups.length - 1; i >= 0; i--) {
      const pu = powerups[i];
      if (pu.taken) {
        powerups.splice(i, 1);
        continue;
      }
      if (pu.pipeRef) {
        pu.x = pu.pipeRef.x + PIPE_W / 2;
        const gap = pu.pipeRef.gap != null ? pu.pipeRef.gap : currentGap;
        pu.y = pu.pipeRef.gapY + gap / 2;
      } else {
        pu.x -= currentSpeed * sdt;
      }
      if (pu.x < -30) {
        powerups.splice(i, 1);
        continue;
      }
      // Collect
      const dx = bird.x - pu.x;
      const dy = bird.y - pu.y;
      if (dx * dx + dy * dy < (POWERUP_R + bird.w * 0.35) * (POWERUP_R + bird.w * 0.35)) {
        collectPowerup(pu);
        powerups.splice(i, 1);
      }
    }

    if (pipes.length && pipes[0].x + PIPE_W < -12) {
      pipes.shift();
      const last = pipes[pipes.length - 1];
      pipes.push(makePipe(last.x + currentSpawn, currentGap));
    }

    if (checkCollision()) beginDeath();
  }

  function palette() {
    if (nightMode) {
      return {
        sky0: '#0b1026',
        sky1: '#1a2744',
        sky2: '#2a3555',
        sun: 'rgba(220,220,255,0.55)',
        cloud: 'rgba(180,190,220,0.35)',
        pipe: '#1e6b3a',
        pipeCap: '#2a8f4e',
        pipeHi: 'rgba(255,255,255,0.1)',
        ground: '#3d3428',
        grass: '#3a7a45',
        stripe: '#2e2820',
        grassLine: '#2d5a35'
      };
    }
    if (skin === 'bike') {
      return {
        sky0: '#f0a070',
        sky1: '#87b8d8',
        sky2: '#c8dde8',
        sun: 'rgba(255,200,120,0.9)',
        cloud: 'rgba(255,255,255,0.65)',
        pipe: '#2d8f4e',
        pipeCap: '#3cb371',
        pipeHi: 'rgba(255,255,255,0.15)',
        ground: '#c2a05c',
        grass: '#7ec850',
        stripe: '#a88848',
        grassLine: '#5a8f3a'
      };
    }
    return {
      sky0: '#5ec8f0',
      sky1: '#87ceeb',
      sky2: '#b8e0f0',
      sun: 'rgba(255,240,150,0.85)',
      cloud: 'rgba(255,255,255,0.75)',
      pipe: '#2d8f4e',
      pipeCap: '#3cb371',
      pipeHi: 'rgba(255,255,255,0.15)',
      ground: '#c2a05c',
      grass: '#7ec850',
      stripe: '#a88848',
      grassLine: '#5a8f3a'
    };
  }

  function drawSky() {
    const pal = palette();
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, pal.sky0);
    g.addColorStop(0.55, pal.sky1);
    g.addColorStop(1, pal.sky2);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = pal.sun;
    ctx.beginPath();
    if (nightMode) {
      ctx.arc(W - 70, 80, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      for (let i = 0; i < 18; i++) {
        const sx = (i * 97 + 40) % W;
        const sy = (i * 53 + 20) % 220;
        ctx.fillRect(sx, sy, 2, 2);
      }
    } else {
      ctx.arc(W - 60, 70, 28, 0, Math.PI * 2);
      ctx.fill();
    }

    clouds.forEach((c) => {
      ctx.fillStyle = pal.cloud;
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, c.w, c.w * 0.45, 0, 0, Math.PI * 2);
      ctx.ellipse(c.x + c.w * 0.4, c.y + 4, c.w * 0.7, c.w * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawPipe(p) {
    const pal = palette();
    const gap = p.gap != null ? p.gap : currentGap;
    ctx.fillStyle = pal.pipe;
    ctx.fillRect(p.x, 0, PIPE_W, p.gapY);
    ctx.fillStyle = pal.pipeCap;
    ctx.fillRect(p.x - 4, p.gapY - 22, PIPE_W + 8, 22);
    const by = p.gapY + gap;
    const bh = H - GROUND_H - by;
    ctx.fillStyle = pal.pipe;
    ctx.fillRect(p.x, by, PIPE_W, bh);
    ctx.fillStyle = pal.pipeCap;
    ctx.fillRect(p.x - 4, by, PIPE_W + 8, 22);
    ctx.fillStyle = pal.pipeHi;
    ctx.fillRect(p.x + 6, 0, 8, Math.max(0, p.gapY - 22));
    ctx.fillRect(p.x + 6, by + 22, 8, Math.max(0, bh - 22));
  }

  function drawPowerup(pu) {
    if (pu.taken) return;
    const t = performance.now() / 1000;
    const bob = reduceMotion ? 0 : Math.sin(t * 4 + pu.x * 0.05) * 3;
    const y = pu.y + bob;
    ctx.save();
    ctx.translate(pu.x, y);
    if (pu.type === 'shield') {
      ctx.fillStyle = 'rgba(100,200,255,0.9)';
      ctx.beginPath();
      ctx.arc(0, 0, POWERUP_R, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, POWERUP_R - 4, -0.8, 0.8);
      ctx.stroke();
      ctx.fillStyle = '#0a2540';
      ctx.font = 'bold 12px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🛡', 0, 1);
    } else if (pu.type === 'slowmo') {
      ctx.fillStyle = 'rgba(180,140,255,0.92)';
      ctx.beginPath();
      ctx.arc(0, 0, POWERUP_R, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 11px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⏱', 0, 1);
    } else {
      // Magnet / coin
      ctx.fillStyle = '#ffd93d';
      ctx.beginPath();
      ctx.arc(0, 0, POWERUP_R, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#c9a000';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#7a5a00';
      ctx.font = 'bold 13px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('✦', 0, 1);
    }
    ctx.restore();
  }

  function drawParticles() {
    particles.forEach((pt) => {
      const a = Math.max(0, pt.life / (pt.max || 0.5));
      ctx.globalAlpha = a;
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.r * a, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });
  }

  function drawGround() {
    const pal = palette();
    const gy = H - GROUND_H;
    ctx.fillStyle = pal.ground;
    ctx.fillRect(0, gy, W, GROUND_H);
    ctx.fillStyle = pal.grass;
    ctx.fillRect(0, gy, W, 14);
    ctx.fillStyle = pal.stripe;
    for (let x = groundX; x < W + 40; x += 40) {
      ctx.fillRect(x, gy + 18, 20, 8);
    }
    ctx.fillStyle = pal.grassLine;
    ctx.fillRect(0, gy, W, 3);
  }

  function drawHitFlash() {
    if (hitFlash <= 0) return;
    ctx.fillStyle = 'rgba(255,255,255,' + (0.55 * hitFlash).toFixed(3) + ')';
    ctx.fillRect(0, 0, W, H);
  }

  function drawShieldAura() {
    if (!bird || !shieldActive) return;
    ctx.save();
    ctx.strokeStyle = 'rgba(120,210,255,0.75)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(bird.x, bird.y, Math.max(bird.w, bird.h) * 0.75 + 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawFrame(idle) {
    drawSky();
    pipes.forEach(drawPipe);
    powerups.forEach(drawPowerup);
    drawGround();
    drawParticles();
    if (bird) {
      drawShieldAura();
      FTSkins.draw(ctx, skin, bird.x, bird.y, bird.rot, 1);
    } else if (idle) {
      const bob = reduceMotion ? 0 : Math.sin(Date.now() / 300) * 8;
      FTSkins.draw(ctx, skin, BIRD_X, H * 0.42 + bob, 0, 1);
    }
    drawHitFlash();
  }

  function loop(ts) {
    if (!lastTs) lastTs = ts;
    const dt = (ts - lastTs) / 1000;
    lastTs = ts;
    update(dt);
    drawFrame(state === 'menu');
    animId = requestAnimationFrame(loop);
  }

  // ——— Input ———
  function onPointer(e) {
    if (
      e.target &&
      e.target.closest &&
      e.target.closest(
        'button, .skin-card, #ad-stub-modal, #screen-settings, label, input'
      )
    ) {
      return;
    }
    e.preventDefault();
    flap();
  }

  canvas.addEventListener('pointerdown', onPointer);
  document.getElementById('app').addEventListener(
    'pointerdown',
    (e) => {
      if (state === 'playing') {
        if (
          e.target.closest &&
          e.target.closest('button, #screen-settings, label, input')
        )
          return;
        e.preventDefault();
        flap();
      }
    },
    { passive: false }
  );

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.key === ' ') {
      e.preventDefault();
      if (state === 'menu') startRun(false, 'classic');
      else if (state === 'playing') flap();
      else if (state === 'dead') retryFlow();
    }
  });

  // ——— Buttons ———
  btnPlay.addEventListener('click', () => {
    FTAudio.unlock();
    startRun(false, 'classic');
  });

  if (btnDaily) {
    btnDaily.addEventListener('click', () => {
      FTAudio.unlock();
      startRun(false, 'daily');
      showToast('Daily challenge · ' + FTStorage.getDailyDate());
    });
  }

  if (btnPractice) {
    btnPractice.addEventListener('click', () => {
      FTAudio.unlock();
      startRun(false, 'practice');
      showToast('Practice · safe for 30s');
    });
  }

  async function retryFlow() {
    FTStorage.bumpRunCount();
    if (FTStorage.getRunCount() % 2 === 0) {
      await Ads.showInterstitial('between-runs');
    }
    startRun(false, playMode);
  }

  btnRetry.addEventListener('click', () => {
    retryFlow();
  });

  btnMenu.addEventListener('click', () => {
    showMenu();
  });

  btnContinue.addEventListener('click', async () => {
    if (continuedThisRun || playMode === 'practice') return;
    const res = await Ads.showRewarded('continue');
    if (res && res.rewarded) {
      continuedThisRun = true;
      showToast('Continue granted!');
      startRun(true);
    } else {
      showToast('Continue skipped');
    }
  });

  function syncMuteBtn() {
    const m = FTStorage.isMuted();
    FTAudio.setMuted(m);
    btnMute.textContent = m ? '🔇' : '🔊';
  }

  btnMute.addEventListener('click', () => {
    const next = !FTStorage.isMuted();
    FTStorage.setMuted(next);
    syncMuteBtn();
  });

  function applyReduceMotionClass() {
    document.documentElement.classList.toggle('reduce-motion', reduceMotion);
  }

  function openSettings() {
    if (!screenSettings) return;
    screenSettings.hidden = false;
    if (sensSlider) sensSlider.value = String(sensitivity);
    if (sensValueEl) sensValueEl.textContent = sensitivity.toFixed(2);
    if (reduceMotionChk) reduceMotionChk.checked = reduceMotion;
  }

  function closeSettings() {
    if (screenSettings) screenSettings.hidden = true;
  }

  if (btnSettings) {
    btnSettings.addEventListener('click', () => openSettings());
  }
  if (btnSettingsClose) {
    btnSettingsClose.addEventListener('click', () => closeSettings());
  }
  if (sensSlider) {
    sensSlider.addEventListener('input', () => {
      sensitivity = FTStorage.setSensitivity(sensSlider.value);
      if (sensValueEl) sensValueEl.textContent = sensitivity.toFixed(2);
    });
  }
  if (reduceMotionChk) {
    reduceMotionChk.addEventListener('change', () => {
      reduceMotion = !!reduceMotionChk.checked;
      FTStorage.setReduceMotion(reduceMotion);
      applyReduceMotionClass();
    });
  }

  // Skin picker
  skin = FTStorage.getSkin();
  syncNightFromSkin();
  FTSkins.renderPicker(skinPicker, skin, (id) => {
    skin = id;
    FTStorage.setSkin(id);
    syncNightFromSkin();
    if (bird) {
      const hb = FTSkins.hitbox(skin);
      bird.w = hb.w;
      bird.h = hb.h;
    }
    drawFrame(true);
  });

  // Boot
  sensitivity = FTStorage.getSensitivity();
  reduceMotion = FTStorage.getReduceMotion();
  applyReduceMotionClass();
  best = FTStorage.getBest();
  syncMuteBtn();
  initClouds();
  resetBird();
  resetPipes();
  updateBestUI();
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  window.addEventListener('orientationchange', () => setTimeout(resizeCanvas, 100));
  showMenu();
  loop(performance.now());
})();
