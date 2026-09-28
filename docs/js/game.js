/**
 * Urr Jaa! v3.0.0-urrjaa — one-tap fly, PK cosmetics, coins, missions, modes.
 * Fixed bird X; world scrolls; dt gravity/flap; NO countdown.
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
  const SLOWMO_MS = 3000;
  const SLOWMO_SCALE = 0.45;
  const POWERUP_CHANCE = 0.22;
  const POWERUP_R = 14;
  const SCORE2X_MS = 5000;
  const TRAIL_INTERVAL = 0.04;
  const COIN_R = 10;
  const BOX_CHANCE = 0.12;
  const M_PER_PX = 0.08; // visual meters from scroll

  let state = 'menu';
  let bird = null;
  let pipes = [];
  let powerups = [];
  let coins = [];
  let boxes = [];
  let particles = [];
  let rainDrops = [];
  let score = 0;
  let best = 0;
  let birdId = 'sparrow';
  let vehicleId = 'none';
  let envId = 'city';
  let weatherId = 'sunny';
  let hatId = 'none';
  let trailId = 'spark';
  let continuedThisRun = false;
  let animId = 0;
  let groundX = 0;
  let clouds = [];
  let lastTs = 0;
  let flapCooldown = 0;
  let hitFlash = 0;
  let deathFreezeUntil = 0;
  let currentSpeed = BASE_SPEED;
  let currentGap = BASE_GAP;
  let currentSpawn = BASE_SPAWN;
  let playMode = 'classic'; // classic|daily|practice|challenge|hard|reverse|giant
  let combo = 0; // pipe streak
  let coinCombo = 0; // consecutive coins
  let shieldActive = false;
  let slowMoUntil = 0;
  let magnetPipesLeft = 0;
  let score2xUntil = 0;
  let rng = Math.random;
  let sensitivity = 1;
  let reduceMotion = false;
  let hapticsOn = true;
  let trailAcc = 0;
  let metersFlown = 0;
  let runCoins = 0;
  let runBoxes = 0;
  let hitThisRun = false;
  let cleanScorePeak = 0;
  let challengeWon = false;
  let toastOyeAcc = 0;
  let fxAcc = 0;

  // DOM
  const hud = document.getElementById('hud');
  const scoreEl = document.getElementById('score-display');
  const comboEl = document.getElementById('combo-display');
  const modeBadgeEl = document.getElementById('mode-badge');
  const powerHudEl = document.getElementById('power-hud');
  const coinHudEl = document.getElementById('coin-hud');
  const screenStart = document.getElementById('screen-start');
  const screenDeath = document.getElementById('screen-death');
  const screenSettings = document.getElementById('screen-settings');
  const screenPause = document.getElementById('screen-pause');
  const screenGarage = document.getElementById('screen-garage');
  const screenModes = document.getElementById('screen-modes');
  const screenMissions = document.getElementById('screen-missions');
  const screenCollection = document.getElementById('screen-collection');
  const finalScoreEl = document.getElementById('final-score');
  const bestStartEl = document.getElementById('best-start');
  const bestDeathEl = document.getElementById('best-death');
  const dailyBestStartEl = document.getElementById('daily-best-start');
  const totalRunsEl = document.getElementById('total-runs');
  const coinsStartEl = document.getElementById('coins-start');
  const modeDeathEl = document.getElementById('mode-death-label');
  const runCoinsEl = document.getElementById('run-coins');
  const btnPlay = document.getElementById('btn-play');
  const btnModes = document.getElementById('btn-modes');
  const btnGarage = document.getElementById('btn-garage');
  const btnMissions = document.getElementById('btn-missions');
  const btnCollection = document.getElementById('btn-collection');
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
  const toastEl = document.getElementById('toast');
  const medalEl = document.getElementById('medal-display');
  const medalLabelEl = document.getElementById('medal-label');
  const appEl = document.getElementById('app');
  const garageBirds = document.getElementById('garage-birds');
  const garageVehicles = document.getElementById('garage-vehicles');
  const garageEnvs = document.getElementById('garage-envs');
  const garageHats = document.getElementById('garage-hats');
  const garageTrails = document.getElementById('garage-trails');
  const weatherRow = document.getElementById('weather-row');
  const missionsList = document.getElementById('missions-list');
  const collectionList = document.getElementById('collection-list');
  const garageCoinsEl = document.getElementById('garage-coins');

  function showToast(msg, ms) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.hidden = false;
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => { toastEl.hidden = true; }, ms || 1800);
  }

  function haptic(kind) {
    if (!hapticsOn) return;
    try {
      if (!navigator.vibrate) return;
      if (kind === 'death') navigator.vibrate([40, 30, 80]);
      else if (kind === 'power') navigator.vibrate(18);
      else if (kind === 'nearmiss') navigator.vibrate(10);
      else navigator.vibrate(12);
    } catch (_) {}
  }

  function triggerShake() {
    if (!appEl || reduceMotion) return;
    appEl.classList.remove('shake');
    void appEl.offsetWidth;
    appEl.classList.add('shake');
    clearTimeout(triggerShake._t);
    triggerShake._t = setTimeout(() => appEl.classList.remove('shake'), 500);
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
    let s = seed >>> 0 || 1;
    return function () {
      s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
      return (s >>> 0) / 4294967296;
    };
  }

  function setupRngForMode() {
    if (playMode === 'daily') {
      rng = makeRng(hashSeed('urrjaa-daily-' + FTStorage.getDailyDate()));
    } else {
      rng = Math.random;
    }
  }

  function isGiant() { return playMode === 'giant'; }
  function isReverse() { return playMode === 'reverse'; }
  function isHard() { return playMode === 'hard'; }
  function isChallenge() { return playMode === 'challenge'; }

  function modeSpeedMul() {
    if (isHard()) return 1.35;
    if (isChallenge()) return 1.05;
    return 1;
  }

  function modeGapMul() {
    if (isHard()) return 0.88;
    if (isGiant()) return 1.35;
    return 1;
  }

  function resizeCanvas() {
    const app = document.getElementById('app');
    const scale = Math.min(app.clientWidth / W, app.clientHeight / H);
    const dw = Math.floor(W * scale);
    const dh = Math.floor(H * scale);
    canvas.style.width = dw + 'px';
    canvas.style.height = dh + 'px';
    canvas.style.position = 'absolute';
    canvas.style.left = Math.floor((app.clientWidth - dw) / 2) + 'px';
    canvas.style.top = Math.floor((app.clientHeight - dh) / 2) + 'px';
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

  function initRain() {
    rainDrops = [];
    for (let i = 0; i < 40; i++) {
      rainDrops.push({
        x: Math.random() * W,
        y: Math.random() * H,
        len: 8 + Math.random() * 12,
        spd: 280 + Math.random() * 200
      });
    }
  }

  function difficultyFor(sc) {
    const sm = modeSpeedMul();
    const gm = modeGapMul();
    currentSpeed = Math.min(SPEED_CAP * (isHard() ? 1.15 : 1), (BASE_SPEED + sc * SPEED_PER_SCORE) * sm);
    currentGap = Math.max(GAP_FLOOR * gm, (BASE_GAP - sc * GAP_SHRINK_PER) * gm);
    currentSpawn = Math.max(SPAWN_FLOOR, BASE_SPAWN - sc * SPAWN_SHRINK_PER);
  }

  function medalFor(sc) {
    if (sc >= MEDAL_PLATINUM) return 'platinum';
    if (sc >= MEDAL_GOLD) return 'gold';
    if (sc >= MEDAL_SILVER) return 'silver';
    if (sc >= MEDAL_BRONZE) return 'bronze';
    return null;
  }

  function coinComboMult() {
    if (coinCombo >= 10) return 10;
    if (coinCombo >= 5) return 5;
    if (coinCombo >= 2) return 2;
    return 1;
  }

  function pipeComboMult() {
    if (combo >= 10) return 2;
    if (combo >= 5) return 2;
    return 1;
  }

  function score2xActive() {
    return performance.now() < score2xUntil;
  }

  function updateComboUI() {
    if (!comboEl) return;
    const ccm = coinComboMult();
    if ((combo >= 2 || coinCombo >= 2) && state === 'playing') {
      comboEl.hidden = false;
      const bits = [];
      if (combo >= 2) bits.push('PIPE ' + combo);
      if (ccm > 1) bits.push('COMBO x' + ccm);
      else if (coinCombo >= 2) bits.push('COINS ' + coinCombo);
      if (score2xActive()) bits.push('×2');
      comboEl.textContent = bits.join(' · ');
      comboEl.classList.toggle('combo-hot', ccm >= 5 || combo >= 5);
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
    if (isReverse()) bits.push('↕');
    if (isGiant()) bits.push('🦅');
    if (isHard()) bits.push('🔥');
    if (bits.length) {
      powerHudEl.hidden = false;
      powerHudEl.textContent = bits.join('  ');
    } else powerHudEl.hidden = true;
  }

  function updateModeBadge() {
    if (!modeBadgeEl) return;
    const labels = {
      daily: 'Daily · ' + FTStorage.getDailyDate(),
      practice: 'Practice · No Death',
      challenge: 'Challenge · 100m clean',
      hard: 'Hard',
      reverse: 'Reverse Flap',
      giant: 'Giant Bird'
    };
    if (labels[playMode]) {
      modeBadgeEl.hidden = false;
      modeBadgeEl.textContent = labels[playMode];
    } else modeBadgeEl.hidden = true;
  }

  function updateCoinHud() {
    if (coinHudEl) coinHudEl.textContent = '🪙 ' + FTStorage.getCoins();
    if (coinsStartEl) coinsStartEl.textContent = String(FTStorage.getCoins());
    if (garageCoinsEl) garageCoinsEl.textContent = String(FTStorage.getCoins());
  }

  function cosmeticsOpts() {
    return { vehicle: vehicleId, hat: hatId, giant: isGiant() && state === 'playing' };
  }

  function resetBird() {
    const hb = FTSkins.hitbox(birdId, cosmeticsOpts());
    bird = { x: BIRD_X, y: H * 0.42, vy: 0, rot: 0, alive: true, w: hb.w, h: hb.h };
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

  function spawnCoinsInGap(pipe) {
    const gap = pipe.gap != null ? pipe.gap : currentGap;
    const n = 1 + (rng() < 0.4 ? 1 : 0);
    for (let i = 0; i < n; i++) {
      coins.push({
        x: pipe.x + PIPE_W / 2 + (i === 1 ? 28 : 0),
        y: pipe.gapY + gap * (0.35 + rng() * 0.3),
        taken: false,
        pipeRef: pipe
      });
    }
  }

  function maybeSpawnBox(pipe) {
    if (rng() > BOX_CHANCE) return;
    const gap = pipe.gap != null ? pipe.gap : currentGap;
    boxes.push({
      x: pipe.x + PIPE_W / 2,
      y: pipe.gapY + gap * 0.2,
      taken: false,
      pipeRef: pipe
    });
  }

  function makePipe(x, gap) {
    const g = gap == null ? currentGap : gap;
    const margin = 55;
    const maxTop = H - GROUND_H - g - margin;
    const gapY = margin + rng() * Math.max(10, maxTop - margin);
    const kind = FTSkins.pickObstacleKind(rng);
    const pipe = {
      x: x, gapY: gapY, gap: g, scored: false, nearMissChecked: false,
      kind: kind, w: PIPE_W
    };
    maybeSpawnPowerup(pipe);
    spawnCoinsInGap(pipe);
    maybeSpawnBox(pipe);
    return pipe;
  }

  function resetPipes() {
    pipes = [];
    powerups = [];
    coins = [];
    boxes = [];
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
      bestDeathEl.textContent = String(
        playMode === 'daily' ? FTStorage.getDailyBest() : best
      );
    }
    if (dailyBestStartEl) dailyBestStartEl.textContent = String(FTStorage.getDailyBest());
    if (totalRunsEl) totalRunsEl.textContent = String(FTStorage.getRunCount());
    updateCoinHud();
  }

  function setScore(n) {
    score = n;
    if (scoreEl) scoreEl.textContent = String(score);
    difficultyFor(score);
    if (!hitThisRun) cleanScorePeak = Math.max(cleanScorePeak, score);
  }

  function showMedalUI(sc) {
    const m = medalFor(sc);
    if (!medalEl) return;
    if (!m || playMode === 'practice') { medalEl.hidden = true; return; }
    medalEl.hidden = false;
    medalEl.className = 'medal medal-' + m;
    if (medalLabelEl) {
      medalLabelEl.textContent = ({ platinum: 'Platinum', gold: 'Gold', silver: 'Silver', bronze: 'Bronze' }[m] || '') + ' Medal';
    }
    const bestMedal = FTStorage.getBestMedal();
    const order = { bronze: 1, silver: 2, gold: 3, platinum: 4 };
    if (!bestMedal || (order[m] || 0) > (order[bestMedal] || 0)) FTStorage.setBestMedal(m);
  }

  function hideAllScreens() {
    [screenStart, screenDeath, screenSettings, screenPause, screenGarage, screenModes, screenMissions, screenCollection]
      .forEach((el) => { if (el) el.hidden = true; });
  }

  function showMenu() {
    state = 'menu';
    hideAllScreens();
    screenStart.hidden = false;
    hud.hidden = true;
    hitFlash = 0;
    playMode = 'classic';
    updateBestUI();
    drawFrame(true);
  }

  function showDeath() {
    state = 'dead';
    hideAllScreens();
    screenDeath.hidden = false;
    hud.hidden = true;
    if (finalScoreEl) finalScoreEl.textContent = String(score);
    if (runCoinsEl) runCoinsEl.textContent = String(runCoins);
    if (modeDeathEl) {
      const labels = {
        daily: 'Daily best', practice: 'Practice run', challenge: 'Challenge',
        hard: 'Hard best', reverse: 'Reverse', giant: 'Giant'
      };
      modeDeathEl.textContent = labels[playMode] || 'Best';
    }
    updateBestUI();
    showMedalUI(score);
    if (btnContinue) {
      const allow = playMode !== 'practice' && playMode !== 'challenge';
      btnContinue.hidden = !allow;
      btnContinue.disabled = continuedThisRun || !allow;
      btnContinue.textContent = continuedThisRun ? 'Continue used' : '▶ Continue (Ad)';
    }
    // Mission updates at end
    FTStorage.bumpMission('fly_m', Math.floor(metersFlown));
    FTStorage.bumpMission('coins', runCoins);
    FTStorage.bumpMission('pipes', score);
    FTStorage.bumpMission('boxes', runBoxes);
    if (!hitThisRun && cleanScorePeak >= 50) FTStorage.setMissionMax('clean50', cleanScorePeak);
    FTStorage.setMetersBest(Math.floor(metersFlown));
    const unlocked = FTStorage.checkEnvMilestones(FTStorage.getBest());
    if (unlocked.length) showToast('Unlocked: ' + unlocked.join(', '), 2500);
  }

  function pauseGame() {
    if (state !== 'playing') return;
    state = 'paused';
    if (screenPause) screenPause.hidden = false;
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
    if (playMode !== 'practice') {
      FTStorage.bumpRunCount();
      updateBestUI();
    }
  }

  function startRun(fromContinue, mode) {
    FTAudio.unlock();
    if (mode) playMode = mode;
    setupRngForMode();
    state = 'playing';
    hideAllScreens();
    hud.hidden = false;
    hitFlash = 0;
    deathFreezeUntil = 0;
    flapCooldown = 0;
    lastTs = 0;
    trailAcc = 0;
    toastOyeAcc = 0;
    challengeWon = false;
    updateModeBadge();
    initRain();

    if (!fromContinue) {
      bumpRunsIfCompetitive();
      continuedThisRun = false;
      combo = 0;
      coinCombo = 0;
      shieldActive = false;
      slowMoUntil = 0;
      magnetPipesLeft = 0;
      score2xUntil = 0;
      metersFlown = 0;
      runCoins = 0;
      runBoxes = 0;
      hitThisRun = false;
      cleanScorePeak = 0;
      setScore(0);
      resetBird();
      resetPipes();
      groundX = 0;
    } else {
      resetBird();
      bird.y = H * 0.4;
      bird.vy = 0;
      shieldActive = false;
      pipes.forEach((p) => { if (p.x < bird.x + 100) p.x = bird.x + 200; });
      for (let i = 1; i < pipes.length; i++) {
        if (pipes[i].x < pipes[i - 1].x + currentSpawn) pipes[i].x = pipes[i - 1].x + currentSpawn;
      }
      powerups = powerups.filter((pu) => pu.x > bird.x + 40);
      coins = coins.filter((c) => c.x > bird.x + 40);
      boxes = boxes.filter((b) => b.x > bird.x + 40);
    }
    // refresh hitbox for giant
    const hb = FTSkins.hitbox(birdId, cosmeticsOpts());
    bird.w = hb.w;
    bird.h = hb.h;
    updateComboUI();
    updatePowerHud();
    updateCoinHud();
    if (!animId) loop(performance.now());
  }

  function flap() {
    const sens = sensitivity;
    let impulse = FLAP_IMPULSE * sens;
    if (isReverse()) impulse = -impulse;
    if (state === 'menu') {
      startRun(false, 'classic');
      bird.vy = FLAP_IMPULSE * sens;
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
      const pw = p.w || PIPE_W;
      if (rectsOverlap(left, top, bird.w, bird.h, p.x, 0, pw, p.gapY)) return true;
      const by = p.gapY + gap;
      if (rectsOverlap(left, top, bird.w, bird.h, p.x, by, pw, H - GROUND_H - by)) return true;
    }
    return false;
  }

  function spawnNearMissSparks(x, y) {
    const n = reduceMotion ? 1 : 10;
    for (let i = 0; i < n; i++) {
      const a = (Math.PI * 2 * i) / 10 + rng() * 0.3;
      const sp = 40 + rng() * 90;
      particles.push({
        x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        life: 0.35, max: 0.6, color: i % 2 ? '#ffd93d' : '#fff', r: 2 + rng() * 2, kind: 'spark'
      });
    }
  }

  function spawnTrailParticle() {
    if (!bird || reduceMotion || trailId === 'none') return;
    const colors = { spark: '#ffd93d', smoke: '#94a3b8', stars: '#a78bfa' };
    particles.push({
      x: bird.x - bird.w * 0.35,
      y: bird.y + (Math.random() - 0.5) * bird.h * 0.4,
      vx: -30, vy: (Math.random() - 0.5) * 20,
      life: 0.3, max: 0.5,
      color: colors[trailId] || '#ffd93d',
      r: trailId === 'stars' ? 3 : 2.5,
      kind: 'trail'
    });
  }

  function collectPowerup(pu) {
    pu.taken = true;
    FTAudio.powerup();
    haptic('power');
    if (pu.type === 'shield') { shieldActive = true; showToast('Shield!'); }
    else if (pu.type === 'slowmo') { slowMoUntil = performance.now() + SLOWMO_MS; showToast('Slow-mo 3s'); }
    else if (pu.type === 'coin') { magnetPipesLeft = Math.max(magnetPipesLeft, 1); showToast('Magnet · next +2'); }
    else if (pu.type === 'score2x') { score2xUntil = performance.now() + SCORE2X_MS; showToast('Score ×2 · 5s'); }
    updatePowerHud();
    updateComboUI();
  }

  function collectCoin(c) {
    c.taken = true;
    coinCombo += 1;
    const mult = coinComboMult();
    const gained = mult;
    runCoins += gained;
    FTStorage.addCoins(gained);
    FTAudio.score();
    if (mult >= 5) {
      FTAudio.combo();
      showToast('COMBO x' + mult + '!');
      setScore(score + Math.floor(mult / 2));
    }
    updateComboUI();
    updateCoinHud();
  }

  function openMysteryBox(box) {
    box.taken = true;
    runBoxes += 1;
    FTAudio.powerup();
    haptic('power');
    const pool = [
      { kind: 'bird', ids: ['parrot', 'chick', 'owl'] },
      { kind: 'vehicle', ids: ['cycle', 'scooty', 'bicycle', 'rickshaw'] },
      { kind: 'hat', ids: ['topi', 'cap'] },
      { kind: 'trail', ids: ['smoke', 'stars'] },
      { kind: 'env', ids: ['lahore', 'village', 'karachi'] },
      { kind: 'coins', ids: null }
    ];
    const pick = pool[Math.floor(rng() * pool.length)];
    if (pick.kind === 'coins') {
      const n = 15 + Math.floor(rng() * 20);
      FTStorage.addCoins(n);
      runCoins += n;
      showToast('Mystery: +' + n + ' coins!');
    } else {
      const id = pick.ids[Math.floor(rng() * pick.ids.length)];
      let unlocked = false;
      if (pick.kind === 'bird' && !FTStorage.isBirdUnlocked(id)) { FTStorage.unlockBird(id); unlocked = true; }
      else if (pick.kind === 'vehicle' && !FTStorage.isVehicleUnlocked(id)) { FTStorage.unlockVehicle(id); unlocked = true; }
      else if (pick.kind === 'hat' && !FTStorage.isHatUnlocked(id)) { FTStorage.unlockHat(id); unlocked = true; }
      else if (pick.kind === 'trail' && !FTStorage.isTrailUnlocked(id)) { FTStorage.unlockTrail(id); unlocked = true; }
      else if (pick.kind === 'env' && !FTStorage.isEnvUnlocked(id)) { FTStorage.unlockEnv(id); unlocked = true; }
      FTStorage.addToCollection(pick.kind, id);
      if (unlocked) showToast('Mystery: ' + id + ' unlocked!');
      else {
        FTStorage.addCoins(10);
        runCoins += 10;
        showToast('Mystery: already owned · +10 🪙');
      }
    }
    updateCoinHud();
  }

  function beginDeath() {
    if (state !== 'playing') return;
    if (playMode === 'practice') {
      if (bird.vy > 0) bird.vy = FLAP_IMPULSE * 0.6 * sensitivity;
      else bird.vy = Math.abs(bird.vy) * 0.4;
      const halfH = bird.h / 2;
      if (bird.y + halfH >= H - GROUND_H) bird.y = H - GROUND_H - halfH - 2;
      if (bird.y - halfH <= 0) bird.y = halfH + 2;
      let nearest = null, bestDx = 1e9;
      for (let i = 0; i < pipes.length; i++) {
        const dx = Math.abs(pipes[i].x + PIPE_W / 2 - bird.x);
        if (dx < bestDx) { bestDx = dx; nearest = pipes[i]; }
      }
      if (nearest && bestDx < PIPE_W) {
        bird.y = nearest.gapY + (nearest.gap || currentGap) / 2;
        bird.vy = Math.min(bird.vy, 0);
      }
      return;
    }
    if (shieldActive) {
      shieldActive = false;
      hitFlash = 0.55;
      hitThisRun = true;
      FTAudio.nearmiss();
      showToast('Shield broke!');
      updatePowerHud();
      let nearest = null, bestDx = 1e9;
      for (let i = 0; i < pipes.length; i++) {
        const dx = Math.abs(pipes[i].x + PIPE_W / 2 - bird.x);
        if (dx < bestDx) { bestDx = dx; nearest = pipes[i]; }
      }
      if (nearest) {
        bird.y = nearest.gapY + (nearest.gap || currentGap) / 2;
        bird.vy = 0;
      }
      return;
    }
    bird.alive = false;
    state = 'dying';
    hitThisRun = true;
    coinCombo = 0;
    FTAudio.hit();
    haptic('death');
    triggerShake();
    hitFlash = 1;
    deathFreezeUntil = performance.now() + DEATH_FREEZE_MS;
    if (playMode === 'daily') FTStorage.setDailyBest(score);
    else if (playMode !== 'practice') best = FTStorage.setBest(score);
    updateBestUI();
  }

  function addPipeScore(p) {
    const base = magnetPipesLeft > 0 ? 2 : 1;
    if (magnetPipesLeft > 0) magnetPipesLeft--;
    combo += 1;
    const mult = pipeComboMult() * (score2xActive() ? 2 : 1);
    setScore(score + base * mult);
    FTAudio.score();
    if (mult > 1 && combo % 5 === 0) {
      FTAudio.combo();
      showToast('Pipe combo x' + mult + '!');
    }
    // occasional PK toast
    toastOyeAcc += 1;
    if (toastOyeAcc >= 7 + Math.floor(rng() * 5)) {
      toastOyeAcc = 0;
      if (p.kind && p.kind !== 'pipe') showToast('Oye bach ke!', 1200);
    }
    updateComboUI();
    updatePowerHud();
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
      spawnNearMissSparks(p.x + PIPE_W / 2, topClear < botClear ? p.gapY + 4 : p.gapY + gap - 4);
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

    // weather FX
    const pal = FTSkins.envPalette(envId, weatherId);
    if (pal.rain && !reduceMotion) {
      rainDrops.forEach((d) => {
        d.y += d.spd * dt;
        d.x -= 40 * dt;
        if (d.y > H) { d.y = -10; d.x = Math.random() * W; }
      });
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const pt = particles[i];
      pt.life -= dt;
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      if (pt.kind !== 'trail') pt.vy += 120 * dt;
      else pt.vx *= 0.98;
      if (pt.life <= 0) particles.splice(i, 1);
    }

    if (hitFlash > 0) hitFlash = Math.max(0, hitFlash - dt * (1000 / HIT_FLASH_MS));

    if (state === 'dying') {
      if (performance.now() >= deathFreezeUntil) showDeath();
      return;
    }
    if (state !== 'playing' || !bird) return;

    if (flapCooldown > 0) flapCooldown -= sdt;
    if (slowActive) updatePowerHud();
    else if (slowMoUntil && now >= slowMoUntil) { slowMoUntil = 0; updatePowerHud(); }
    if (score2xUntil && now >= score2xUntil) { score2xUntil = 0; updatePowerHud(); updateComboUI(); }

    // Reverse mode: gravity flips sign relative to flap
    let g = GRAVITY * sensitivity;
    if (isReverse()) g = -g;
    const term = TERMINAL_V * Math.max(0.85, sensitivity);
    bird.vy += g * sdt;
    if (!isReverse() && bird.vy > term) bird.vy = term;
    if (isReverse() && bird.vy < -term) bird.vy = -term;
    bird.y += bird.vy * sdt;

    const targetRot = Math.max(-0.65, Math.min(1.25, bird.vy / 500));
    bird.rot += (targetRot - bird.rot) * Math.min(1, sdt * 12);

    metersFlown += currentSpeed * sdt * M_PER_PX;

    // Challenge win
    if (isChallenge() && !challengeWon && metersFlown >= 100 && !hitThisRun) {
      challengeWon = true;
      FTStorage.addCoins(50);
      FTAudio.combo();
      showToast('Challenge clear! +50 🪙', 2500);
      updateCoinHud();
      // soft end — keep flying but celebrate
    }

    trailAcc += sdt;
    if (trailAcc >= TRAIL_INTERVAL) { trailAcc = 0; spawnTrailParticle(); }

    for (let i = 0; i < pipes.length; i++) {
      const p = pipes[i];
      p.x -= currentSpeed * sdt;
      checkNearMiss(p);
      if (!p.scored && p.x + (p.w || PIPE_W) < bird.x) {
        p.scored = true;
        addPipeScore(p);
      }
    }

    function syncAndCollect(list, r, onHit) {
      for (let i = list.length - 1; i >= 0; i--) {
        const item = list[i];
        if (item.taken) { list.splice(i, 1); continue; }
        if (item.pipeRef) {
          item.x = item.pipeRef.x + PIPE_W / 2 + (item._ox || 0);
        } else {
          item.x -= currentSpeed * sdt;
        }
        if (item.x < -30) { list.splice(i, 1); continue; }
        const dx = bird.x - item.x;
        const dy = bird.y - item.y;
        if (dx * dx + dy * dy < (r + bird.w * 0.35) * (r + bird.w * 0.35)) {
          onHit(item);
          list.splice(i, 1);
        }
      }
    }

    for (let i = powerups.length - 1; i >= 0; i--) {
      const pu = powerups[i];
      if (pu.taken) { powerups.splice(i, 1); continue; }
      if (pu.pipeRef) {
        pu.x = pu.pipeRef.x + PIPE_W / 2;
        const gap = pu.pipeRef.gap != null ? pu.pipeRef.gap : currentGap;
        pu.y = pu.pipeRef.gapY + gap / 2;
      } else pu.x -= currentSpeed * sdt;
      if (pu.x < -30) { powerups.splice(i, 1); continue; }
      const dx = bird.x - pu.x, dy = bird.y - pu.y;
      if (dx * dx + dy * dy < (POWERUP_R + bird.w * 0.35) ** 2) {
        collectPowerup(pu);
        powerups.splice(i, 1);
      }
    }

    for (let i = coins.length - 1; i >= 0; i--) {
      const c = coins[i];
      if (c.taken) { coins.splice(i, 1); continue; }
      if (c.pipeRef) {
        // keep relative; coins were placed with absolute y
      }
      c.x -= currentSpeed * sdt;
      if (c.x < -30) { coins.splice(i, 1); coinCombo = 0; continue; }
      const dx = bird.x - c.x, dy = bird.y - c.y;
      if (dx * dx + dy * dy < (COIN_R + bird.w * 0.35) ** 2) {
        collectCoin(c);
        coins.splice(i, 1);
      }
    }

    for (let i = boxes.length - 1; i >= 0; i--) {
      const b = boxes[i];
      if (b.taken) { boxes.splice(i, 1); continue; }
      if (b.pipeRef) b.x = b.pipeRef.x + PIPE_W / 2;
      else b.x -= currentSpeed * sdt;
      if (b.x < -30) { boxes.splice(i, 1); continue; }
      const dx = bird.x - b.x, dy = bird.y - b.y;
      if (dx * dx + dy * dy < (16 + bird.w * 0.35) ** 2) {
        openMysteryBox(b);
        boxes.splice(i, 1);
      }
    }

    if (pipes.length && pipes[0].x + PIPE_W < -12) {
      pipes.shift();
      const last = pipes[pipes.length - 1];
      pipes.push(makePipe(last.x + currentSpawn, currentGap));
    }

    if (checkCollision()) beginDeath();
  }

  function drawSky() {
    const pal = FTSkins.envPalette(envId, weatherId);
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, pal.sky0);
    g.addColorStop(0.55, pal.sky1);
    g.addColorStop(1, pal.sky2);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = pal.sun;
    ctx.beginPath();
    if (pal.stars) {
      ctx.arc(W - 70, 80, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      for (let i = 0; i < 18; i++) {
        ctx.fillRect((i * 97 + 40) % W, (i * 53 + 20) % 220, 2, 2);
      }
    } else {
      ctx.arc(W - 60, 70, 28, 0, Math.PI * 2);
      ctx.fill();
    }

    // silhouette accents per city
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    if (envId === 'lahore' || envId === 'karachi' || envId === 'city' || envId === 'night') {
      for (let i = 0; i < 6; i++) {
        const bx = ((i * 70 + groundX * 0.3) % (W + 80)) - 40;
        const bh = 40 + (i % 3) * 25;
        ctx.fillRect(bx, H - GROUND_H - bh, 36 + (i % 2) * 20, bh);
      }
    } else if (envId === 'murree' || envId === 'islamabad') {
      ctx.beginPath();
      ctx.moveTo(0, H - GROUND_H);
      for (let i = 0; i < 5; i++) {
        ctx.lineTo(i * 100, H - GROUND_H - 50 - (i % 2) * 30);
      }
      ctx.lineTo(W, H - GROUND_H);
      ctx.fill();
    } else if (envId === 'desert') {
      ctx.fillStyle = 'rgba(210,160,40,0.35)';
      ctx.beginPath();
      ctx.ellipse(80, H - GROUND_H, 70, 22, 0, 0, Math.PI * 2);
      ctx.ellipse(250, H - GROUND_H, 90, 18, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    clouds.forEach((c) => {
      ctx.fillStyle = pal.cloud;
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, c.w, c.w * 0.45, 0, 0, Math.PI * 2);
      ctx.ellipse(c.x + c.w * 0.4, c.y + 4, c.w * 0.7, c.w * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    if (pal.fog) {
      ctx.fillStyle = 'rgba(220,220,230,0.25)';
      ctx.fillRect(0, H * 0.35, W, H * 0.4);
    }
  }

  function drawWeatherFX() {
    const pal = FTSkins.envPalette(envId, weatherId);
    if (!pal.rain || reduceMotion) return;
    ctx.strokeStyle = pal.storm ? 'rgba(200,220,255,0.55)' : 'rgba(180,200,230,0.45)';
    ctx.lineWidth = 1.5;
    rainDrops.forEach((d) => {
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x - 3, d.y + d.len);
      ctx.stroke();
    });
    if (pal.storm && Math.random() < 0.008) {
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(0, 0, W, H);
    }
  }

  function drawPipe(p) {
    const pal = FTSkins.envPalette(envId, weatherId);
    const ghost = playMode === 'practice' && state === 'playing';
    FTSkins.drawObstaclePair(ctx, p, pal, H - GROUND_H, ghost);
  }

  function drawPowerup(pu) {
    if (pu.taken) return;
    const t = performance.now() / 1000;
    const bob = reduceMotion ? 0 : Math.sin(t * 4 + pu.x * 0.05) * 3;
    ctx.save();
    ctx.translate(pu.x, pu.y + bob);
    const colors = { shield: 'rgba(100,200,255,0.9)', slowmo: 'rgba(180,140,255,0.92)', score2x: 'rgba(255,138,92,0.95)', coin: '#ffd93d' };
    ctx.fillStyle = colors[pu.type] || '#ffd93d';
    ctx.beginPath();
    ctx.arc(0, 0, POWERUP_R, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0a2540';
    ctx.font = 'bold 12px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const icons = { shield: '🛡', slowmo: '⏱', score2x: '×2', coin: '✦' };
    ctx.fillText(icons[pu.type] || '✦', 0, 1);
    ctx.restore();
  }

  function drawCoin(c) {
    if (c.taken) return;
    const bob = reduceMotion ? 0 : Math.sin(performance.now() / 200 + c.x) * 2;
    ctx.save();
    ctx.translate(c.x, c.y + bob);
    ctx.fillStyle = '#ffd93d';
    ctx.beginPath();
    ctx.arc(0, 0, COIN_R, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#c9a000';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#7a5a00';
    ctx.font = 'bold 11px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🪙', 0, 1);
    ctx.restore();
  }

  function drawBox(b) {
    if (b.taken) return;
    const bob = reduceMotion ? 0 : Math.sin(performance.now() / 250 + b.x) * 3;
    ctx.save();
    ctx.translate(b.x, b.y + bob);
    ctx.fillStyle = '#8e44ad';
    ctx.fillRect(-12, -12, 24, 24);
    ctx.fillStyle = '#ffd93d';
    ctx.fillRect(-12, -2, 24, 4);
    ctx.fillRect(-2, -12, 4, 24);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('?', 0, 1);
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
    const pal = FTSkins.envPalette(envId, weatherId);
    const gy = H - GROUND_H;
    ctx.fillStyle = pal.ground;
    ctx.fillRect(0, gy, W, GROUND_H);
    ctx.fillStyle = pal.grass;
    ctx.fillRect(0, gy, W, 14);
    ctx.fillStyle = pal.stripe || '#a88848';
    for (let x = groundX; x < W + 40; x += 40) ctx.fillRect(x, gy + 18, 20, 8);
    ctx.fillStyle = pal.grassLine || '#5a8f3a';
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
    coins.forEach(drawCoin);
    boxes.forEach(drawBox);
    drawGround();
    drawParticles();
    drawWeatherFX();
    if (bird) {
      drawShieldAura();
      FTSkins.draw(ctx, birdId, bird.x, bird.y, bird.rot, 1, cosmeticsOpts());
    } else if (idle) {
      const bob = reduceMotion ? 0 : Math.sin(Date.now() / 300) * 8;
      FTSkins.draw(ctx, birdId, BIRD_X, H * 0.42 + bob, 0, 1, cosmeticsOpts());
    }
    // meters for challenge
    if (state === 'playing' && isChallenge()) {
      ctx.fillStyle = 'rgba(15,23,42,0.7)';
      ctx.fillRect(W / 2 - 50, 8, 100, 22);
      ctx.fillStyle = '#ffd93d';
      ctx.font = 'bold 12px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(Math.floor(metersFlown) + ' / 100m', W / 2, 23);
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
    if (e.target && e.target.closest && e.target.closest(
      'button, .skin-card, #ad-stub-modal, .screen, label, input, .tab-btn, .mission-card'
    )) return;
    e.preventDefault();
    flap();
  }
  canvas.addEventListener('pointerdown', onPointer);
  document.getElementById('app').addEventListener('pointerdown', (e) => {
    if (state === 'playing') {
      if (e.target.closest && e.target.closest('button, .screen, label, input')) return;
      e.preventDefault();
      flap();
    }
  }, { passive: false });

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
  btnPlay.addEventListener('click', () => { FTAudio.unlock(); startRun(false, 'classic'); });

  async function retryFlow() {
    if (FTStorage.getRunCount() % 2 === 0) await Ads.showInterstitial('between-runs');
    startRun(false, playMode === 'challenge' && challengeWon ? 'classic' : playMode);
  }
  btnRetry.addEventListener('click', () => retryFlow());
  btnMenu.addEventListener('click', () => showMenu());
  btnContinue.addEventListener('click', async () => {
    if (continuedThisRun || playMode === 'practice') return;
    const res = await Ads.showRewarded('continue');
    if (res && res.rewarded) {
      continuedThisRun = true;
      showToast('Continue granted!');
      startRun(true);
    } else showToast('Continue skipped');
  });

  if (btnPause) btnPause.addEventListener('click', (e) => { e.stopPropagation(); pauseGame(); });
  if (btnResume) btnResume.addEventListener('click', () => resumeGame());
  if (btnQuitPause) btnQuitPause.addEventListener('click', () => quitToMenu());

  function syncMuteBtn() {
    const m = FTStorage.isMuted();
    FTAudio.setMuted(m);
    btnMute.textContent = m ? '🔇' : '🔊';
    if (soundToggleChk) soundToggleChk.checked = !m;
  }
  btnMute.addEventListener('click', () => {
    FTStorage.setMuted(!FTStorage.isMuted());
    syncMuteBtn();
  });

  function applyReduceMotionClass() {
    document.documentElement.classList.toggle('reduce-motion', reduceMotion);
  }

  if (btnSettings) btnSettings.addEventListener('click', () => {
    if (!screenSettings) return;
    screenSettings.hidden = false;
    if (sensSlider) sensSlider.value = String(sensitivity);
    if (sensValueEl) sensValueEl.textContent = sensitivity.toFixed(2);
    if (reduceMotionChk) reduceMotionChk.checked = reduceMotion;
    if (soundToggleChk) soundToggleChk.checked = !FTStorage.isMuted();
    if (hapticsToggleChk) hapticsToggleChk.checked = hapticsOn;
  });
  if (btnSettingsClose) btnSettingsClose.addEventListener('click', () => { screenSettings.hidden = true; });
  if (sensSlider) sensSlider.addEventListener('input', () => {
    sensitivity = FTStorage.setSensitivity(sensSlider.value);
    if (sensValueEl) sensValueEl.textContent = sensitivity.toFixed(2);
  });
  if (reduceMotionChk) reduceMotionChk.addEventListener('change', () => {
    reduceMotion = !!reduceMotionChk.checked;
    FTStorage.setReduceMotion(reduceMotion);
    applyReduceMotionClass();
  });
  if (soundToggleChk) soundToggleChk.addEventListener('change', () => {
    FTStorage.setMuted(!soundToggleChk.checked);
    syncMuteBtn();
  });
  if (hapticsToggleChk) hapticsToggleChk.addEventListener('change', () => {
    hapticsOn = !!hapticsToggleChk.checked;
    FTStorage.setHaptics(hapticsOn);
  });

  // ——— Garage / unlock ———
  async function tryUnlock(item, kind) {
    const cost = item.cost || 0;
    if (cost <= 0) return;
    if (FTStorage.getCoins() < cost) {
      showToast('Need ' + cost + ' coins');
      return;
    }
    // score gate for env as alternative
    if (kind === 'env' && item.unlockScore && FTStorage.getBest() >= item.unlockScore) {
      FTStorage.unlockEnv(item.id);
      showToast(item.label + ' unlocked (score)!');
      refreshGarage();
      return;
    }
    if (!FTStorage.spendCoins(cost)) {
      showToast('Need ' + cost + ' coins');
      return;
    }
    if (kind === 'bird') FTStorage.unlockBird(item.id);
    else if (kind === 'vehicle') FTStorage.unlockVehicle(item.id);
    else if (kind === 'env') FTStorage.unlockEnv(item.id);
    else if (kind === 'hat') FTStorage.unlockHat(item.id);
    else if (kind === 'trail') FTStorage.unlockTrail(item.id);
    FTStorage.addToCollection(kind, item.id);
    showToast(item.label + ' unlocked!');
    updateCoinHud();
    refreshGarage();
  }

  function onPickCosmetic(id, kind) {
    if (kind === 'bird') { birdId = id; FTStorage.setBird(id); }
    else if (kind === 'vehicle') { vehicleId = id; FTStorage.setVehicle(id); }
    else if (kind === 'env') { envId = id; FTStorage.setEnv(id); }
    else if (kind === 'hat') { hatId = id; FTStorage.setHat(id); }
    else if (kind === 'trail') { trailId = id; FTStorage.setTrail(id); }
    if (bird) {
      const hb = FTSkins.hitbox(birdId, cosmeticsOpts());
      bird.w = hb.w; bird.h = hb.h;
    }
    drawFrame(true);
  }

  function refreshGarage() {
    updateCoinHud();
    if (garageBirds) FTSkins.renderPicker(garageBirds, birdId, onPickCosmetic, tryUnlock, 'bird');
    if (garageVehicles) FTSkins.renderPicker(garageVehicles, vehicleId, onPickCosmetic, tryUnlock, 'vehicle');
    if (garageEnvs) FTSkins.renderPicker(garageEnvs, envId, onPickCosmetic, tryUnlock, 'env');
    if (garageHats) FTSkins.renderPicker(garageHats, hatId, onPickCosmetic, tryUnlock, 'hat');
    if (garageTrails) FTSkins.renderPicker(garageTrails, trailId, onPickCosmetic, tryUnlock, 'trail');
    if (weatherRow) {
      weatherRow.innerHTML = '';
      FTSkins.WEATHERS.forEach((w) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'chip' + (w.id === weatherId ? ' selected' : '');
        btn.textContent = w.label;
        btn.addEventListener('click', () => {
          weatherId = w.id;
          FTStorage.setWeather(w.id);
          weatherRow.querySelectorAll('.chip').forEach((el) => el.classList.remove('selected'));
          btn.classList.add('selected');
          drawFrame(true);
        });
        weatherRow.appendChild(btn);
      });
    }
  }

  if (btnGarage) btnGarage.addEventListener('click', () => {
    hideAllScreens();
    if (screenGarage) screenGarage.hidden = false;
    refreshGarage();
  });
  document.querySelectorAll('[data-close="garage"]').forEach((b) => {
    b.addEventListener('click', () => showMenu());
  });

  // Modes screen
  if (btnModes) btnModes.addEventListener('click', () => {
    hideAllScreens();
    if (screenModes) screenModes.hidden = false;
  });
  document.querySelectorAll('[data-close="modes"]').forEach((b) => {
    b.addEventListener('click', () => showMenu());
  });
  document.querySelectorAll('[data-mode]').forEach((b) => {
    b.addEventListener('click', () => {
      const m = b.getAttribute('data-mode');
      FTAudio.unlock();
      startRun(false, m);
      const names = {
        classic: 'Classic', daily: 'Daily', practice: 'Practice',
        challenge: 'Challenge 100m', hard: 'Hard', reverse: 'Reverse', giant: 'Giant'
      };
      showToast(names[m] || m);
    });
  });

  // Missions
  function refreshMissions() {
    if (!missionsList) return;
    missionsList.innerHTML = '';
    FTStorage.getMissions().forEach((m) => {
      const card = document.createElement('div');
      card.className = 'mission-card' + (m.done ? ' done' : '') + (m.claimed ? ' claimed' : '');
      const pct = Math.min(100, Math.floor((m.progress / m.target) * 100));
      card.innerHTML =
        '<div class="mission-title">' + m.label + '</div>' +
        '<div class="mission-bar"><span style="width:' + pct + '%"></span></div>' +
        '<div class="mission-meta">' + Math.min(m.progress, m.target) + ' / ' + m.target +
        ' · 🪙 ' + m.reward + '</div>';
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn primary btn-sm';
      btn.textContent = m.claimed ? 'Claimed' : m.done ? 'Claim' : 'In progress';
      btn.disabled = !m.done || m.claimed;
      btn.addEventListener('click', () => {
        const r = FTStorage.claimMission(m.id);
        if (r) { showToast('+' + r + ' coins!'); refreshMissions(); updateCoinHud(); }
      });
      card.appendChild(btn);
      missionsList.appendChild(card);
    });
  }
  if (btnMissions) btnMissions.addEventListener('click', () => {
    hideAllScreens();
    if (screenMissions) screenMissions.hidden = false;
    refreshMissions();
  });
  document.querySelectorAll('[data-close="missions"]').forEach((b) => {
    b.addEventListener('click', () => showMenu());
  });

  // Collection album
  function refreshCollection() {
    if (!collectionList) return;
    const c = FTStorage.getCollection();
    const birds = FTStorage.getUnlockedBirds();
    const vehs = FTStorage.getUnlockedVehicles();
    const envs = FTStorage.getUnlockedEnvs();
    collectionList.innerHTML = '';
    function section(title, map, labels) {
      const h = document.createElement('h3');
      h.textContent = title;
      collectionList.appendChild(h);
      const row = document.createElement('div');
      row.className = 'skin-row';
      Object.keys(labels).forEach((id) => {
        const el = document.createElement('div');
        el.className = 'collect-chip' + (map[id] ? ' owned' : '');
        el.textContent = (map[id] ? '✓ ' : '🔒 ') + labels[id];
        row.appendChild(el);
      });
      collectionList.appendChild(row);
    }
    const birdLabels = {}; FTSkins.BIRDS.forEach((b) => { birdLabels[b.id] = b.label; });
    const vehLabels = {}; FTSkins.VEHICLES.forEach((b) => { vehLabels[b.id] = b.label; });
    const envLabels = {}; FTSkins.ENVS.forEach((b) => { envLabels[b.id] = b.label; });
    section('Birds', birds, birdLabels);
    section('Vehicles', vehs, vehLabels);
    section('Environments', envs, envLabels);
    void c;
  }
  if (btnCollection) btnCollection.addEventListener('click', () => {
    hideAllScreens();
    if (screenCollection) screenCollection.hidden = false;
    refreshCollection();
  });
  document.querySelectorAll('[data-close="collection"]').forEach((b) => {
    b.addEventListener('click', () => showMenu());
  });

  // Boot
  birdId = FTStorage.getBird();
  vehicleId = FTStorage.getVehicle();
  envId = FTStorage.getEnv();
  weatherId = FTStorage.getWeather();
  hatId = FTStorage.getHat();
  trailId = FTStorage.getTrail();
  sensitivity = FTStorage.getSensitivity();
  reduceMotion = FTStorage.getReduceMotion();
  hapticsOn = FTStorage.getHaptics();
  applyReduceMotionClass();
  best = FTStorage.getBest();
  FTStorage.checkEnvMilestones(best);
  syncMuteBtn();
  initClouds();
  initRain();
  resetBird();
  resetPipes();
  updateBestUI();
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  window.addEventListener('orientationchange', () => setTimeout(resizeCanvas, 100));
  showMenu();
  loop(performance.now());
})();
