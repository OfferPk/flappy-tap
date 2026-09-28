/**
 * Flappy Tap — Flappy-style physics + juice (canvas).
 * Fixed bird X; world scrolls; dt-based gravity/flap; difficulty ramp;
 * AABB death; medals; hit flash; death freeze.
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

  // Physics tuned for ~60fps dt (seconds). Values ≈ classic feel.
  const GRAVITY = 1850;       // px/s²
  const FLAP_IMPULSE = -420;  // px/s (set, not additive)
  const TERMINAL_V = 620;     // px/s max fall
  const FLAP_COOLDOWN = 0.08; // seconds — clamp flap spam
  const PIPE_W = 64;

  // Base difficulty (ramps with score)
  const BASE_SPEED = 160;     // px/s scroll
  const BASE_GAP = 152;
  const BASE_SPAWN = 210;     // px between pipe centers
  const SPEED_CAP = 260;
  const GAP_FLOOR = 108;
  const SPAWN_FLOOR = 155;
  const SPEED_PER_SCORE = 2.2;
  const GAP_SHRINK_PER = 0.9;
  const SPAWN_SHRINK_PER = 1.1;

  // Medals
  const MEDAL_BRONZE = 10;
  const MEDAL_SILVER = 25;
  const MEDAL_GOLD = 50;

  // Juice
  const DEATH_FREEZE_MS = 650;
  const HIT_FLASH_MS = 180;

  let state = 'menu'; // menu | playing | dying | dead
  let bird = null;
  let pipes = [];
  let score = 0;
  let best = 0;
  let skin = 'bird';
  let continuedThisRun = false;
  let animId = 0;
  let groundX = 0;
  let clouds = [];
  let lastTs = 0;
  let flapCooldown = 0;
  let hitFlash = 0;       // 0..1
  let deathFreezeUntil = 0;
  let nightMode = false;
  let currentSpeed = BASE_SPEED;
  let currentGap = BASE_GAP;
  let currentSpawn = BASE_SPAWN;

  // DOM
  const hud = document.getElementById('hud');
  const scoreEl = document.getElementById('score-display');
  const screenStart = document.getElementById('screen-start');
  const screenDeath = document.getElementById('screen-death');
  const finalScoreEl = document.getElementById('final-score');
  const bestStartEl = document.getElementById('best-start');
  const bestDeathEl = document.getElementById('best-death');
  const btnPlay = document.getElementById('btn-play');
  const btnRetry = document.getElementById('btn-retry');
  const btnMenu = document.getElementById('btn-menu');
  const btnContinue = document.getElementById('btn-continue');
  const btnMute = document.getElementById('btn-mute');
  const skinPicker = document.getElementById('skin-picker');
  const toastEl = document.getElementById('toast');
  const medalEl = document.getElementById('medal-display');
  const medalLabelEl = document.getElementById('medal-label');

  function showToast(msg, ms) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.hidden = false;
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => {
      toastEl.hidden = true;
    }, ms || 1800);
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
    // Rickshaw → night palette; bike → dusk; bird → day
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

  function makePipe(x, gap) {
    const g = gap == null ? currentGap : gap;
    const margin = 55;
    const maxTop = H - GROUND_H - g - margin;
    const gapY = margin + Math.random() * Math.max(10, maxTop - margin);
    return {
      x: x,
      gapY: gapY,
      gap: g,
      scored: false
    };
  }

  function resetPipes() {
    pipes = [];
    difficultyFor(0);
    const startX = W + 60;
    pipes.push(makePipe(startX));
    pipes.push(makePipe(startX + currentSpawn));
    pipes.push(makePipe(startX + currentSpawn * 2));
  }

  function updateBestUI() {
    best = FTStorage.getBest();
    if (bestStartEl) bestStartEl.textContent = String(best);
    if (bestDeathEl) bestDeathEl.textContent = String(best);
  }

  function setScore(n) {
    score = n;
    if (scoreEl) scoreEl.textContent = String(score);
    difficultyFor(score);
  }

  function showMedalUI(sc) {
    const m = medalFor(sc);
    if (!medalEl) return;
    if (!m) {
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
    hud.hidden = true;
    hitFlash = 0;
    updateBestUI();
    drawFrame(true);
  }

  function showDeath() {
    state = 'dead';
    screenDeath.hidden = false;
    screenStart.hidden = true;
    hud.hidden = true;
    if (finalScoreEl) finalScoreEl.textContent = String(score);
    updateBestUI();
    showMedalUI(score);
    if (btnContinue) {
      btnContinue.disabled = continuedThisRun;
      btnContinue.textContent = continuedThisRun
        ? 'Continue used'
        : '▶ Continue (Ad)';
    }
  }

  function startRun(fromContinue) {
    FTAudio.unlock();
    state = 'playing';
    screenStart.hidden = true;
    screenDeath.hidden = true;
    hud.hidden = false;
    hitFlash = 0;
    deathFreezeUntil = 0;
    flapCooldown = 0;
    lastTs = 0;
    if (!fromContinue) {
      continuedThisRun = false;
      setScore(0);
      resetBird();
      resetPipes();
      groundX = 0;
    } else {
      resetBird();
      bird.y = H * 0.4;
      bird.vy = 0;
      // Clear nearby pipes so continue isn't instant death
      pipes.forEach((p) => {
        if (p.x < bird.x + 100) p.x = bird.x + 200;
      });
      // Ensure spacing after nudge
      for (let i = 1; i < pipes.length; i++) {
        if (pipes[i].x < pipes[i - 1].x + currentSpawn) {
          pipes[i].x = pipes[i - 1].x + currentSpawn;
        }
      }
    }
    if (!animId) loop(performance.now());
  }

  function flap() {
    if (state === 'menu') {
      startRun(false);
      bird.vy = FLAP_IMPULSE;
      flapCooldown = FLAP_COOLDOWN;
      FTAudio.flap();
      return;
    }
    if (state !== 'playing' || !bird || !bird.alive) return;
    if (flapCooldown > 0) return;
    // Set velocity to fixed upward impulse (not additive spam)
    bird.vy = FLAP_IMPULSE;
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

  function beginDeath() {
    if (state !== 'playing') return;
    bird.alive = false;
    state = 'dying';
    FTAudio.hit();
    hitFlash = 1;
    deathFreezeUntil = performance.now() + DEATH_FREEZE_MS;
    best = FTStorage.setBest(score);
    updateBestUI();
  }

  function update(dt) {
    // Cap dt to avoid spiral after tab switch
    if (dt > 0.05) dt = 0.05;

    const scroll = currentSpeed * dt * (state === 'playing' ? 1 : 0.35);

    // Parallax ground + clouds always drift a little
    groundX = (groundX - scroll * (state === 'playing' ? 1 : 0.5)) % 40;
    clouds.forEach((c) => {
      c.x -= c.s * (state === 'playing' ? currentSpeed * 0.15 * dt : 8 * dt);
      if (c.x < -80) c.x = W + 40;
    });

    if (hitFlash > 0) {
      hitFlash = Math.max(0, hitFlash - dt * (1000 / HIT_FLASH_MS));
    }

    if (state === 'dying') {
      // Freeze world briefly, then show death UI
      if (performance.now() >= deathFreezeUntil) {
        showDeath();
      }
      return;
    }

    if (state !== 'playing' || !bird) return;

    if (flapCooldown > 0) flapCooldown -= dt;

    // Vertical physics (dt-based)
    bird.vy += GRAVITY * dt;
    if (bird.vy > TERMINAL_V) bird.vy = TERMINAL_V;
    bird.y += bird.vy * dt;

    // Tilt by velocity
    const targetRot = Math.max(-0.65, Math.min(1.25, bird.vy / 500));
    bird.rot += (targetRot - bird.rot) * Math.min(1, dt * 12);

    // Pipes scroll left at constant (ramped) speed
    for (let i = 0; i < pipes.length; i++) {
      const p = pipes[i];
      p.x -= currentSpeed * dt;
      // Score when pipe’s right edge passes bird X, once
      if (!p.scored && p.x + PIPE_W < bird.x) {
        p.scored = true;
        setScore(score + 1);
        FTAudio.score();
      }
    }

    // Recycle off-screen
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
      // stars
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

  function drawFrame(idle) {
    drawSky();
    pipes.forEach(drawPipe);
    drawGround();
    if (bird) {
      FTSkins.draw(ctx, skin, bird.x, bird.y, bird.rot, 1);
    } else if (idle) {
      FTSkins.draw(
        ctx,
        skin,
        BIRD_X,
        H * 0.42 + Math.sin(Date.now() / 300) * 8,
        0,
        1
      );
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
    if (e.target && e.target.closest && e.target.closest('button, .skin-card, #ad-stub-modal')) {
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
        if (e.target.closest && e.target.closest('button')) return;
        e.preventDefault();
        flap();
      }
    },
    { passive: false }
  );

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.key === ' ') {
      e.preventDefault();
      if (state === 'menu') startRun(false);
      else if (state === 'playing') flap();
      else if (state === 'dead') retryFlow();
    }
  });

  // ——— Buttons ———
  btnPlay.addEventListener('click', () => {
    FTAudio.unlock();
    startRun(false);
  });

  async function retryFlow() {
    FTStorage.bumpRunCount();
    if (FTStorage.getRunCount() % 2 === 0) {
      await Ads.showInterstitial('between-runs');
    }
    startRun(false);
  }

  btnRetry.addEventListener('click', () => {
    retryFlow();
  });

  btnMenu.addEventListener('click', () => {
    showMenu();
  });

  btnContinue.addEventListener('click', async () => {
    if (continuedThisRun) return;
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
