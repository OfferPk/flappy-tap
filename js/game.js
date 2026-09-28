/**
 * Flappy Tap v2.0.0-complete — physics + juice + power-ups, modes, combo, settings.
 * Fixed bird X; world scrolls; dt-based gravity/flap; difficulty ramp;
 * AABB death; medals incl. platinum; hit flash; death freeze; daily/practice;
 * pause; bird trail; haptics stub; rewarded skin unlock.
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
  const MEDAL_PLATINUM = 100;

  const DEATH_FREEZE_MS = 650;
  const HIT_FLASH_MS = 180;
  const NEAR_MISS_PX = 16;
  const COMBO_X2_AT = 5;
  const SLOWMO_MS = 3000;
  const SLOWMO_SCALE = 0.45;
  const POWERUP_CHANCE = 0.38;
  const POWERUP_R = 14;
  const SCORE2X_MS = 5000;
  const TRAIL_INTERVAL = 0.04;

  let state = 'menu'; // menu | playing | paused | dying | dead
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

  let playMode = 'classic'; // classic | daily | practice
  let combo = 0;
  let shieldActive = false;
  let slowMoUntil = 0;
  let magnetPipesLeft = 0;
  let score2xUntil = 0;
  let rng = Math.random;
  let sensitivity = 1;
  let reduceMotion = false;
  let hapticsOn = true;
  let trailAcc = 0;
  let pauseResumeMode = 'classic';

  // DOM
  const hud = document.getElementById('hud');
  const scoreEl = document.getElementById('score-display');
  const comboEl = document.getElementById('combo-display');
  const modeBadgeEl = document.getElementById('mode-badge');
  const powerHudEl = document.getElementById('power-hud');
  const screenStart = document.getElementById('screen-start');
  const screenDeath = document.getElementById('screen-death');
  const screenSettings = document.getElementById('screen-settings');
  const screenPause = document.getElementById('screen-pause');
  const finalScoreEl = document.getElementById('final-score');
  const bestStartEl = document.getElementById('best-start');
  const bestDeathEl = document.getElementById('best-death');
  const dailyBestStartEl = document.getElementById('daily-best-start');
  const totalRunsEl = document.getElementById('total-runs');
  const modeDeathEl = document.getElementById('mode-death-label');
  const btnPlay = document.getElementById('btn-play');
  const btnDaily = document.getElementById('btn-daily');
  const btnPractice = document.getElementById('btn-practice');
  const btnRetry = document.getElementById('btn-retry');
  const btnMenu = document.getElementById('btn-menu');
  const btnContinue = document.getElementById('btn-continue');
  const btnMute = document.getElementById('btn-mute');
  const btnPause = document.getElementById('btn-pause');
  const btnResume = document.getElementById('btn-resume');
  const btnQuitPause = document.getElementById('btn-quit-pause');
  const btnSettings = document.getElementById('btn-settings');
  const btnSettingsClose = document.getElementById('btn-settings-close');
  const sensSlider = document.getElementById('sens-slider');
  const sensValueEl = document.getElementById('sens-value');
  const reduceMotionChk = document.getElementById('reduce-motion');
  const soundToggleChk = document.getElementById('sound-toggle');
  const hapticsToggleChk = document.getElementById('haptics-toggle');
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

  function haptic(kind) {
    if (!hapticsOn) return;
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
    nightMode = skin === 'rickshaw' || skin === 'rocket';
  }

  function difficultyFor(sc) {
    currentSpeed = Math.min(SPEED_CAP, BASE_SPEED + sc * SPEED_PER_SCORE);
    currentGap = Math.max(GAP_FLOOR, BASE_GAP - sc * GAP_SHRINK_PER);
    currentSpawn = Math.max(SPAWN_FLOOR, BASE_SPAWN - sc * SPAWN_SHRINK_PER);
  }

  function medalFor(sc) {
    if (sc >= MEDAL_PLATINUM) return 'platinum';
    if (sc >= MEDAL_GOLD) return 'gold';
    if (sc >= MEDAL_SILVER) return 'silver';
    if (sc >= MEDAL_BRONZE) return 'bronze';
    return null;
  }

  function comboMultiplier() {
    return combo >= COMBO_X2_AT ? 2 : 1;
  }

  function score2xActive() {
    return performance.now() < score2xUntil;
  }

  function updateComboUI() {
    if (!comboEl) return;
    if (combo >= 2 && state === 'playing') {
      comboEl.hidden = false;
      const mult = comboMultiplier() * (score2xActive() ? 2 : 1);
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
    if (score2xActive()) bits.push('×2');
    if (playMode === 'practice') bits.push('GHOST');
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
      modeBadgeEl.textContent = 'Practice · No Death';
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
    if (r < 0.28) return 'shield';
    if (r < 0.52) return 'slowmo';
    if (r < 0.78) return 'coin';
    return 'score2x';
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
    if (totalRunsEl) {
      totalRunsEl.textContent = String(FTStorage.getRunCount());
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
      const labels = {
        platinum: 'Platinum Medal',
        gold: 'Gold Medal',
        silver: 'Silver Medal',
        bronze: 'Bronze Medal'
      };
      medalLabelEl.textContent = labels[m] || 'Medal';
    }
    const bestMedal = FTStorage.getBestMedal();
    const order = { bronze: 1, silver: 2, gold: 3, platinum: 4 };
    if (!bestMedal || (order[m] || 0) > (order[bestMedal] || 0)) {
      FTStorage.setBestMedal(m);
    }
  }

  function showMenu() {
    state = 'menu';
    screenStart.hidden = false;
    screenDeath.hidden = true;
    if (screenSettings) screenSettings.hidden = true;
    if (screenPause) screenPause.hidden = true;
    hud.hidden = true;
    hitFlash = 0;
    playMode = 'classic';
    updateBestUI();
    refreshSkinPicker();
    drawFrame(true);
  }

  function showDeath() {
    state = 'dead';
    screenDeath.hidden = false;
    screenStart.hidden = true;
    if (screenSettings) screenSettings.hidden = true;
    if (screenPause) screenPause.hidden = true;
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

  function pauseGame() {
    if (state !== 'playing') return;
    state = 'paused';
    pauseResumeMode = playMode;
    if (screenPause) screenPause.hidden = false;
    if (screenSettings) screenSettings.hidden = true;
  }

  function resumeGame() {
    if (state !== 'paused') return;
    state = 'playing';
    if (screenPause) screenPause.hidden = true;
    lastTs = 0;
  }

  function quitToMenu() {
    if (screenPause) screenPause.hidden = true;
    showMenu();
  }

  function bumpRunsIfCompetitive() {
    if (playMode === 'classic' || playMode === 'daily') {
      FTStorage.bumpRunCount();
      updateBestUI();
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
    if (screenPause) screenPause.hidden = true;
    hud.hidden = false;
    hitFlash = 0;
    deathFreezeUntil = 0;
    flapCooldown = 0;
    lastTs = 0;
    trailAcc = 0;
    updateModeBadge();

    if (!fromContinue) {
      bumpRunsIfCompetitive();
      continuedThisRun = false;
      combo = 0;
      shieldActive = false;
      slowMoUntil = 0;
      magnetPipesLeft = 0;
      score2xUntil = 0;
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
      particles.push({
        x: x,
        y: y,
        vx: 0,
        vy: 0,
        life: 0.25,
        max: 0.25,
        color: '#fff8a0',
        r: 3,
        kind: 'spark'
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
        r: 2 + rng() * 2.5,
        kind: 'spark'
      });
    }
  }

  function spawnTrailParticle() {
    if (!bird || reduceMotion) return;
    const speed = Math.min(1, Math.abs(bird.vy) / TERMINAL_V);
    particles.push({
      x: bird.x - bird.w * 0.35,
      y: bird.y + (Math.random() - 0.5) * bird.h * 0.4,
      vx: -30 - speed * 40,
      vy: (Math.random() - 0.5) * 20 - bird.vy * 0.05,
      life: 0.28 + speed * 0.2,
      max: 0.5,
      color: skin === 'rocket' ? '#ff8a5c' : skin === 'bike' ? '#4ecdc4' : '#ffd93d',
      r: 2.5 + speed * 2,
      kind: 'trail'
    });
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
    } else if (pu.type === 'score2x') {
      score2xUntil = performance.now() + SCORE2X_MS;
      showToast('Score ×2 · 5s');
    }
    updatePowerHud();
    updateComboUI();
  }

  function beginDeath() {
    if (state !== 'playing') return;

    // Practice = full-run ghost / invulnerable (no death ever)
    if (playMode === 'practice') {
      if (bird.vy > 0) bird.vy = FLAP_IMPULSE * 0.6 * sensitivity;
      else bird.vy = Math.abs(bird.vy) * 0.4;
      const halfH = bird.h / 2;
      if (bird.y + halfH >= H - GROUND_H) bird.y = H - GROUND_H - halfH - 2;
      if (bird.y - halfH <= 0) bird.y = halfH + 2;
      // Soft nudge out of pipe overlap toward gap center
      let nearest = null;
      let bestDx = 1e9;
      for (let i = 0; i < pipes.length; i++) {
        const dx = Math.abs(pipes[i].x + PIPE_W / 2 - bird.x);
        if (dx < bestDx) {
          bestDx = dx;
          nearest = pipes[i];
        }
      }
      if (nearest && bestDx < PIPE_W) {
        const gap = nearest.gap != null ? nearest.gap : currentGap;
        bird.y = nearest.gapY + gap / 2;
        bird.vy = Math.min(bird.vy, 0);
      }
      return;
    }

    if (shieldActive) {
      shieldActive = false;
      hitFlash = 0.55;
      FTAudio.nearmiss();
      showToast('Shield broke!');
      updatePowerHud();
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
    const mult = comboMultiplier() * (score2xActive() ? 2 : 1);
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
  }

  function checkNearMiss(p) {
    if (p.nearMissChecked) return;
    if (bird.x < p.x + PIPE_W * 0.35) return;
    p.nearMissChecked = true;
    const gap = p.gap != null ? p.gap : currentGap;
    const halfH = bird.h / 2;
    const topClear = bird.y - halfH - p.gapY;
    const botClear = p.gapY + gap - (bird.y + halfH);
    const clear = Math.min(topClear, botClear);
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

    if (state === 'paused') return;

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

    for (let i = particles.length - 1; i >= 0; i--) {
      const pt = particles[i];
      pt.life -= dt;
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      if (pt.kind !== 'trail') pt.vy += 120 * dt;
      else pt.vx *= 0.98;
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

    if (slowActive) updatePowerHud();
    else if (slowMoUntil && now >= slowMoUntil) {
      slowMoUntil = 0;
      updatePowerHud();
    }
    if (score2xUntil && now >= score2xUntil) {
      score2xUntil = 0;
      updatePowerHud();
      updateComboUI();
    }

    const g = GRAVITY * sensitivity;
    const term = TERMINAL_V * Math.max(0.85, sensitivity);
    bird.vy += g * sdt;
    if (bird.vy > term) bird.vy = term;
    bird.y += bird.vy * sdt;

    const targetRot = Math.max(-0.65, Math.min(1.25, bird.vy / 500));
    bird.rot += (targetRot - bird.rot) * Math.min(1, sdt * 12);

    // Velocity trail
    trailAcc += sdt;
    if (trailAcc >= TRAIL_INTERVAL) {
      trailAcc = 0;
      spawnTrailParticle();
    }

    for (let i = 0; i < pipes.length; i++) {
      const p = pipes[i];
      p.x -= currentSpeed * sdt;
      checkNearMiss(p);
      if (!p.scored && p.x + PIPE_W < bird.x) {
        p.scored = true;
        addPipeScore(p);
      }
    }

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
    const ghost = playMode === 'practice' && state === 'playing';
    ctx.globalAlpha = ghost ? 0.55 : 1;
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
    ctx.globalAlpha = 1;
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
    } else if (pu.type === 'score2x') {
      ctx.fillStyle = 'rgba(255,138,92,0.95)';
      ctx.beginPath();
      ctx.arc(0, 0, POWERUP_R, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 11px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('×2', 0, 1);
    } else {
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
      ctx.globalAlpha = a * (pt.kind === 'trail' ? 0.7 : 1);
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
        'button, .skin-card, #ad-stub-modal, #screen-settings, #screen-pause, label, input'
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
          e.target.closest('button, #screen-settings, #screen-pause, label, input')
        )
          return;
        e.preventDefault();
        flap();
      }
    },
    { passive: false }
  );

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Escape' || e.key === 'Escape') {
      e.preventDefault();
      if (state === 'playing') pauseGame();
      else if (state === 'paused') resumeGame();
      return;
    }
    if (e.code === 'Space' || e.key === ' ') {
      e.preventDefault();
      if (state === 'menu') startRun(false, 'classic');
      else if (state === 'playing') flap();
      else if (state === 'paused') resumeGame();
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
      showToast('Practice · no death (ghost)');
    });
  }

  async function retryFlow() {
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

  if (btnPause) {
    btnPause.addEventListener('click', (e) => {
      e.stopPropagation();
      pauseGame();
    });
  }
  if (btnResume) {
    btnResume.addEventListener('click', () => resumeGame());
  }
  if (btnQuitPause) {
    btnQuitPause.addEventListener('click', () => quitToMenu());
  }

  function syncMuteBtn() {
    const m = FTStorage.isMuted();
    FTAudio.setMuted(m);
    btnMute.textContent = m ? '🔇' : '🔊';
    if (soundToggleChk) soundToggleChk.checked = !m;
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
    if (soundToggleChk) soundToggleChk.checked = !FTStorage.isMuted();
    if (hapticsToggleChk) hapticsToggleChk.checked = hapticsOn;
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
  if (soundToggleChk) {
    soundToggleChk.addEventListener('change', () => {
      const muted = !soundToggleChk.checked;
      FTStorage.setMuted(muted);
      syncMuteBtn();
    });
  }
  if (hapticsToggleChk) {
    hapticsToggleChk.addEventListener('change', () => {
      hapticsOn = !!hapticsToggleChk.checked;
      FTStorage.setHaptics(hapticsOn);
    });
  }

  async function unlockRocketSkin(skinDef) {
    const bestScore = FTStorage.getBest();
    const need = skinDef.unlockScore || 40;
    if (bestScore >= need) {
      FTStorage.unlockSkin(skinDef.id);
      showToast('Rocket unlocked (high score)!');
      refreshSkinPicker();
      return;
    }
    const res = await Ads.showRewarded('skin-unlock-' + skinDef.id);
    if (res && res.rewarded) {
      FTStorage.unlockSkin(skinDef.id);
      showToast('Rocket unlocked (ad)!');
      refreshSkinPicker();
    } else {
      showToast('Need score ' + need + '+ or watch ad');
    }
  }

  function refreshSkinPicker() {
    FTSkins.renderPicker(
      skinPicker,
      skin,
      (id) => {
        skin = id;
        FTStorage.setSkin(id);
        syncNightFromSkin();
        if (bird) {
          const hb = FTSkins.hitbox(skin);
          bird.w = hb.w;
          bird.h = hb.h;
        }
        drawFrame(true);
      },
      (skinDef) => {
        unlockRocketSkin(skinDef);
      }
    );
  }

  // Skin picker
  skin = FTStorage.getSkin();
  syncNightFromSkin();
  refreshSkinPicker();

  // Boot
  sensitivity = FTStorage.getSensitivity();
  reduceMotion = FTStorage.getReduceMotion();
  hapticsOn = FTStorage.getHaptics();
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
