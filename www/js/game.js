/**
 * Flappy Tap — one-tap arcade core (canvas).
 * Gravity, pipes, collision, continue-after-death, local best score.
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
  const GRAVITY = 0.38;
  const FLAP_V = -7.2;
  const PIPE_W = 64;
  const PIPE_GAP = 148;
  const PIPE_SPEED = 2.6;
  const PIPE_SPAWN = 170; // px between pipe pairs
  const MAX_FALL = 10;

  let state = 'menu'; // menu | playing | dead | continue
  let bird = null;
  let pipes = [];
  let score = 0;
  let best = 0;
  let skin = 'bird';
  let continuedThisRun = false;
  let animId = 0;
  let groundX = 0;
  let clouds = [];
  let pendingStartAfterAd = false;

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
        s: 0.4 + Math.random() * 0.6,
        w: 40 + Math.random() * 50
      });
    }
  }

  function resetBird() {
    const hb = FTSkins.hitbox(skin);
    bird = {
      x: W * 0.32,
      y: H * 0.42,
      vy: 0,
      rot: 0,
      alive: true,
      w: hb.w,
      h: hb.h
    };
  }

  function makePipe(x) {
    const margin = 60;
    const gapY = margin + Math.random() * (H - GROUND_H - PIPE_GAP - margin * 2);
    return {
      x: x,
      gapY: gapY,
      scored: false
    };
  }

  function resetPipes(keepFar) {
    pipes = [];
    const startX = keepFar ? W + 80 : W + 40;
    pipes.push(makePipe(startX));
    pipes.push(makePipe(startX + PIPE_SPAWN));
    pipes.push(makePipe(startX + PIPE_SPAWN * 2));
  }

  function updateBestUI() {
    best = FTStorage.getBest();
    if (bestStartEl) bestStartEl.textContent = String(best);
    if (bestDeathEl) bestDeathEl.textContent = String(best);
  }

  function setScore(n) {
    score = n;
    if (scoreEl) scoreEl.textContent = String(score);
  }

  function showMenu() {
    state = 'menu';
    screenStart.hidden = false;
    screenDeath.hidden = true;
    hud.hidden = true;
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
    if (!fromContinue) {
      continuedThisRun = false;
      setScore(0);
      resetBird();
      resetPipes(false);
      groundX = 0;
    } else {
      // Nudge bird clear of nearby pipes
      resetBird();
      bird.y = H * 0.4;
      bird.vy = 0;
      pipes.forEach((p) => {
        if (p.x < bird.x + 80) p.x = bird.x + 180;
      });
    }
    if (!animId) loop();
  }

  function flap() {
    if (state === 'menu') {
      startRun(false);
      bird.vy = FLAP_V;
      FTAudio.flap();
      return;
    }
    if (state !== 'playing' || !bird || !bird.alive) return;
    bird.vy = FLAP_V;
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

    // Ground / ceiling
    if (bird.y + halfH >= H - GROUND_H) return true;
    if (bird.y - halfH <= 0) return true;

    for (let i = 0; i < pipes.length; i++) {
      const p = pipes[i];
      // top pipe
      if (
        rectsOverlap(
          left,
          top,
          bird.w,
          bird.h,
          p.x,
          0,
          PIPE_W,
          p.gapY
        )
      )
        return true;
      // bottom pipe
      const by = p.gapY + PIPE_GAP;
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

  function die() {
    if (state !== 'playing') return;
    bird.alive = false;
    FTAudio.hit();
    best = FTStorage.setBest(score);
    updateBestUI();
    showDeath();
  }

  function update(dt) {
    // idle parallax on menu
    groundX = (groundX - PIPE_SPEED * 0.5) % 40;
    clouds.forEach((c) => {
      c.x -= c.s * 0.3;
      if (c.x < -80) c.x = W + 40;
    });

    if (state !== 'playing' || !bird) return;

    bird.vy = Math.min(bird.vy + GRAVITY, MAX_FALL);
    bird.y += bird.vy;
    bird.rot = Math.max(-0.6, Math.min(1.1, bird.vy * 0.08));

    groundX = (groundX - PIPE_SPEED) % 40;

    for (let i = 0; i < pipes.length; i++) {
      const p = pipes[i];
      p.x -= PIPE_SPEED;
      if (!p.scored && p.x + PIPE_W < bird.x) {
        p.scored = true;
        setScore(score + 1);
        FTAudio.score();
      }
    }

    // recycle pipes
    if (pipes.length && pipes[0].x + PIPE_W < -10) {
      pipes.shift();
      const last = pipes[pipes.length - 1];
      pipes.push(makePipe(last.x + PIPE_SPAWN));
    }

    if (checkCollision()) die();
  }

  function drawSky() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#5ec8f0');
    g.addColorStop(0.55, '#87ceeb');
    g.addColorStop(1, '#b8e0f0');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // sun
    ctx.fillStyle = 'rgba(255,240,150,0.85)';
    ctx.beginPath();
    ctx.arc(W - 60, 70, 28, 0, Math.PI * 2);
    ctx.fill();

    clouds.forEach((c) => {
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, c.w, c.w * 0.45, 0, 0, Math.PI * 2);
      ctx.ellipse(c.x + c.w * 0.4, c.y + 4, c.w * 0.7, c.w * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawPipe(p) {
    const r = 8;
    // top
    ctx.fillStyle = '#2d8f4e';
    ctx.fillRect(p.x, 0, PIPE_W, p.gapY);
    ctx.fillStyle = '#3cb371';
    ctx.fillRect(p.x - 4, p.gapY - 22, PIPE_W + 8, 22);
    // bottom
    const by = p.gapY + PIPE_GAP;
    const bh = H - GROUND_H - by;
    ctx.fillStyle = '#2d8f4e';
    ctx.fillRect(p.x, by, PIPE_W, bh);
    ctx.fillStyle = '#3cb371';
    ctx.fillRect(p.x - 4, by, PIPE_W + 8, 22);
    // highlight
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(p.x + 6, 0, 8, p.gapY - 22);
    ctx.fillRect(p.x + 6, by + 22, 8, Math.max(0, bh - 22));
  }

  function drawGround() {
    const gy = H - GROUND_H;
    ctx.fillStyle = '#c2a05c';
    ctx.fillRect(0, gy, W, GROUND_H);
    ctx.fillStyle = '#7ec850';
    ctx.fillRect(0, gy, W, 14);
    // stripes
    ctx.fillStyle = '#a88848';
    for (let x = groundX; x < W + 40; x += 40) {
      ctx.fillRect(x, gy + 18, 20, 8);
    }
    ctx.fillStyle = '#5a8f3a';
    ctx.fillRect(0, gy, W, 3);
  }

  function drawFrame(idle) {
    drawSky();
    pipes.forEach(drawPipe);
    drawGround();
    if (bird) {
      FTSkins.draw(ctx, skin, bird.x, bird.y, bird.rot, 1);
    } else if (idle) {
      FTSkins.draw(ctx, skin, W * 0.32, H * 0.42 + Math.sin(Date.now() / 300) * 8, 0, 1);
    }
  }

  function loop() {
    update(1);
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
      else if (state === 'dead') {
        // space = retry after optional interstitial
        retryFlow();
      }
    }
  });

  // ——— Buttons ———
  btnPlay.addEventListener('click', () => {
    FTAudio.unlock();
    startRun(false);
  });

  async function retryFlow() {
    FTStorage.bumpRunCount();
    // Interstitial between runs (every 2nd retry)
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
  FTSkins.renderPicker(skinPicker, skin, (id) => {
    skin = id;
    FTStorage.setSkin(id);
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
  resetPipes(false);
  updateBestUI();
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  window.addEventListener('orientationchange', () => setTimeout(resizeCanvas, 100));
  showMenu();
  loop();
})();
