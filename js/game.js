/**
 * Urr Jaa! v3.1.0-urrjaa — one-tap fly, juice-first, modes, traffic, streak, one-life.
 * Core: FLY→DODGE→COINS→COMBO→POWER-UP→RECORD→UNLOCK→TRY AGAIN. NO countdown.
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
  const SPEED_CAP = 280;
  const GAP_FLOOR = 108;
  const SPAWN_FLOOR = 150;
  const SPEED_PER_SCORE = 2.2;
  const GAP_SHRINK_PER = 0.9;
  const SPAWN_SHRINK_PER = 1.1;
  const MEDAL_BRONZE = 10;
  const MEDAL_SILVER = 25;
  const MEDAL_GOLD = 50;
  const MEDAL_PLATINUM = 100;
  const DEATH_FREEZE_MS = 700;
  const HIT_FLASH_MS = 220;
  const NEAR_MISS_PX = 18;
  const SLOWMO_MS = 3000;
  const SLOWMO_SCALE = 0.45;
  const POWERUP_CHANCE = 0.10;
  const POWERUP_R = 14;
  const TURBO_MS = 2500;
  const GHOST_MS = 2500;
  const TRAIL_INTERVAL = 0.035;
  const COIN_R = 10;
  const BOX_CHANCE = 0.10;
  const M_PER_PX = 0.08;
  const TIME_ATTACK_S = 60;
  const TRAFFIC_CHANCE = 0.018;

  const CHALLENGE_STAGES = [
    { id: 1, label: 'City Warm-up', area: 'city', target: 15, gapMul: 1.1, speedMul: 0.95 },
    { id: 2, label: 'Bridge Dash', area: 'bridge', target: 25, gapMul: 1.0, speedMul: 1.05 },
    { id: 3, label: 'Mountain Pass', area: 'mountains', target: 35, gapMul: 0.95, speedMul: 1.1 },
    { id: 4, label: 'Village Hop', area: 'village', target: 45, gapMul: 0.92, speedMul: 1.12 },
    { id: 5, label: 'Desert Storm', area: 'desert', target: 60, gapMul: 0.88, speedMul: 1.2 }
  ];

  let state = 'menu';
  let bird = null;
  let pipes = [];
  let powerups = [];
  let coins = [];
  let boxes = [];
  let particles = [];
  let traffic = [];
  let rainDrops = [];
  let scorePops = [];
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
  let playMode = 'classic';
  let combo = 0;
  let coinCombo = 0;
  let nearMissStreak = 0;
  let riskyUntil = 0;
  let shieldActive = false;
  let slowMoUntil = 0;
  let magnetUntil = 0;
  let turboUntil = 0;
  let ghostUntil = 0;
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
  let challengeStageIdx = 0;
  let toastOyeAcc = 0;
  let timeLeft = TIME_ATTACK_S;
  let squash = 1;
  let squashTarget = 1;
  let areaOverride = null;
  let oneLifeLocked = false;
  let runBestCombo = 0;
  let bannerText = '';
  let bannerUntil = 0;

  const hud = document.getElementById('hud');
  const scoreEl = document.getElementById('score-display');
  const comboEl = document.getElementById('combo-display');
  const modeBadgeEl = document.getElementById('mode-badge');
  const powerHudEl = document.getElementById('power-hud');
  const coinHudEl = document.getElementById('coin-hud');
  const timerHudEl = document.getElementById('timer-hud');
  const screenStart = document.getElementById('screen-start');
  const screenDeath = document.getElementById('screen-death');
  const screenSettings = document.getElementById('screen-settings');
  const screenPause = document.getElementById('screen-pause');
  const screenGarage = document.getElementById('screen-garage');
  const screenModes = document.getElementById('screen-modes');
  const screenMissions = document.getElementById('screen-missions');
  const screenCollection = document.getElementById('screen-collection');
  const screenBoards = document.getElementById('screen-boards');
  const screenStreak = document.getElementById('screen-streak');
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
  const btnBoards = document.getElementById('btn-boards');
  const btnStreak = document.getElementById('btn-streak');
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
  const voiceToggleChk = document.getElementById('voice-toggle');
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
  const boardsList = document.getElementById('boards-list');
  const streakBody = document.getElementById('streak-body');
  const garageCoinsEl = document.getElementById('garage-coins');

  function showToast(msg, ms) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.hidden = false;
    toastEl.classList.remove('toast-pop');
    void toastEl.offsetWidth;
    toastEl.classList.add('toast-pop');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function () { toastEl.hidden = true; }, ms || 1600);
  }

  function showBanner(text, ms) {
    bannerText = text;
    bannerUntil = performance.now() + (ms || 1200);
    if (comboEl) {
      comboEl.hidden = false;
      comboEl.textContent = text;
      comboEl.classList.add('combo-hot', 'banner-pop');
      clearTimeout(showBanner._t);
      showBanner._t = setTimeout(function () { comboEl.classList.remove('banner-pop'); }, 400);
    }
  }

  function voiceCue(id) {
    if (!FTAudio.isVoicePack || !FTAudio.isVoicePack()) return;
    var label = FTAudio.voice(id);
    if (label) showToast(label, 1100);
  }

  function haptic(kind) {
    if (!hapticsOn) return;
    try {
      if (!navigator.vibrate) return;
      if (kind === 'death') navigator.vibrate([40, 30, 80]);
      else if (kind === 'power') navigator.vibrate(18);
      else if (kind === 'nearmiss') navigator.vibrate(10);
      else if (kind === 'coin') navigator.vibrate(8);
      else navigator.vibrate(12);
    } catch (_) {}
  }

  function triggerShake() {
    if (!appEl || reduceMotion) return;
    appEl.classList.remove('shake');
    void appEl.offsetWidth;
    appEl.classList.add('shake');
    clearTimeout(triggerShake._t);
    triggerShake._t = setTimeout(function () { appEl.classList.remove('shake'); }, 520);
  }

  function hashSeed(str) {
    var h = 2166136261 >>> 0;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function makeRng(seed) {
    var s = seed >>> 0 || 1;
    return function () {
      s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
      return (s >>> 0) / 4294967296;
    };
  }

  function setupRngForMode() {
    if (playMode === 'daily' || playMode === 'challenge') {
      var stage = CHALLENGE_STAGES[challengeStageIdx] || CHALLENGE_STAGES[0];
      rng = makeRng(hashSeed('urrjaa-' + playMode + '-' + FTStorage.getDailyDate() + '-' + stage.id));
    } else {
      rng = Math.random;
    }
  }

  function isHard() { return playMode === 'hard'; }
  function isChallenge() { return playMode === 'challenge'; }
  function isTimeAttack() { return playMode === 'timeattack'; }
  function isNoCoin() { return playMode === 'nocoin'; }
  function isOneLife() { return playMode === 'onelife'; }
  function isPractice() { return playMode === 'practice'; }

  function activeArea() {
    if (areaOverride) return areaOverride;
    if (isChallenge()) {
      var st = CHALLENGE_STAGES[challengeStageIdx] || CHALLENGE_STAGES[0];
      return st.area;
    }
    if (score >= 70) return 'desert';
    if (score >= 55) return 'night';
    if (score >= 40) return 'rain';
    if (score >= 28) return 'mountains';
    if (score >= 18) return 'bridge';
    if (score >= 10) return 'village';
    return envId || 'city';
  }

  function modeSpeedMul() {
    if (isHard()) return 1.4;
    if (isChallenge()) {
      var st = CHALLENGE_STAGES[challengeStageIdx] || CHALLENGE_STAGES[0];
      return st.speedMul || 1.05;
    }
    if (isOneLife()) return 1.08;
    return 1;
  }

  function modeGapMul() {
    if (isHard()) return 0.86;
    if (isChallenge()) {
      var st = CHALLENGE_STAGES[challengeStageIdx] || CHALLENGE_STAGES[0];
      return st.gapMul || 1;
    }
    return 1;
  }

  function resizeCanvas() {
    var app = document.getElementById('app');
    var scale = Math.min(app.clientWidth / W, app.clientHeight / H);
    var dw = Math.floor(W * scale);
    var dh = Math.floor(H * scale);
    canvas.style.width = dw + 'px';
    canvas.style.height = dh + 'px';
    canvas.style.position = 'absolute';
    canvas.style.left = Math.floor((app.clientWidth - dw) / 2) + 'px';
    canvas.style.top = Math.floor((app.clientHeight - dh) / 2) + 'px';
  }

  function initClouds() {
    clouds = [];
    for (var i = 0; i < 5; i++) {
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
    for (var i = 0; i < 40; i++) {
      rainDrops.push({
        x: Math.random() * W,
        y: Math.random() * H,
        len: 8 + Math.random() * 12,
        spd: 280 + Math.random() * 200
      });
    }
  }

  function difficultyFor(sc) {
    var sm = modeSpeedMul();
    var gm = modeGapMul();
    var turboMul = performance.now() < turboUntil ? 1.35 : 1;
    currentSpeed = Math.min(SPEED_CAP * (isHard() ? 1.2 : 1), (BASE_SPEED + sc * SPEED_PER_SCORE) * sm * turboMul);
    currentGap = Math.max(GAP_FLOOR * gm, (BASE_GAP - sc * GAP_SHRINK_PER) * gm);
    currentSpawn = Math.max(SPAWN_FLOOR, BASE_SPAWN - sc * SPAWN_SHRINK_PER);
  }

  function medalFor(sc) {
    if (isOneLife()) return FTStorage.oneLifeMedalFor(sc);
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
    var m = 1;
    if (combo >= 5) m = 2;
    if (performance.now() < riskyUntil) m *= 3;
    if (performance.now() < score2xUntil) m *= 2;
    return m;
  }

  function riskyActive() { return performance.now() < riskyUntil; }

  function updateComboUI() {
    if (!comboEl) return;
    if (performance.now() < bannerUntil && bannerText) {
      comboEl.hidden = false;
      comboEl.textContent = bannerText;
      comboEl.classList.add('combo-hot');
      return;
    }
    var ccm = coinComboMult();
    if ((combo >= 2 || coinCombo >= 2 || riskyActive() || nearMissStreak >= 2) && state === 'playing') {
      comboEl.hidden = false;
      var bits = [];
      if (riskyActive()) bits.push('RISKY x3');
      else if (nearMissStreak >= 2) bits.push('CLOSE x' + nearMissStreak);
      if (combo >= 2) bits.push('PIPE ' + combo);
      if (ccm > 1) bits.push('COMBO x' + ccm);
      else if (coinCombo >= 2) bits.push('COINS ' + coinCombo);
      comboEl.textContent = bits.join(' · ');
      comboEl.classList.toggle('combo-hot', ccm >= 5 || combo >= 5 || riskyActive());
    } else {
      comboEl.hidden = true;
    }
  }

  function updatePowerHud() {
    if (!powerHudEl) return;
    var now = performance.now();
    var bits = [];
    if (shieldActive) bits.push('🛡');
    if (now < slowMoUntil) bits.push('⏱');
    if (now < magnetUntil) bits.push('🧲');
    if (now < turboUntil) bits.push('⚡');
    if (now < ghostUntil) bits.push('👻');
    if (riskyActive()) bits.push('🎯x3');
    if (isHard()) bits.push('🔥');
    if (isNoCoin()) bits.push('🚫🪙');
    if (isOneLife()) bits.push('1️⃣');
    if (bits.length) {
      powerHudEl.hidden = false;
      powerHudEl.textContent = bits.join('  ');
    } else powerHudEl.hidden = true;
  }

  function updateModeBadge() {
    if (!modeBadgeEl) return;
    var labels = {
      classic: '',
      timeattack: '⏱ Time Attack 60s',
      hard: '🔥 Hard',
      nocoin: 'No Coin · Survive',
      challenge: '🏔 ' + ((CHALLENGE_STAGES[challengeStageIdx] || {}).label || 'Challenge'),
      onelife: '1️⃣ One Life',
      daily: 'Daily · ' + FTStorage.getDailyDate(),
      practice: 'Practice'
    };
    if (labels[playMode]) {
      modeBadgeEl.hidden = false;
      modeBadgeEl.textContent = labels[playMode];
    } else modeBadgeEl.hidden = true;
  }

  function updateTimerHud() {
    if (!timerHudEl) return;
    if (isTimeAttack() && (state === 'playing' || state === 'dying')) {
      timerHudEl.hidden = false;
      timerHudEl.textContent = Math.ceil(Math.max(0, timeLeft)) + 's';
      timerHudEl.classList.toggle('timer-low', timeLeft <= 10);
    } else {
      timerHudEl.hidden = true;
    }
  }

  function updateCoinHud() {
    if (coinHudEl) coinHudEl.textContent = '🪙 ' + FTStorage.getCoins();
    if (coinsStartEl) coinsStartEl.textContent = String(FTStorage.getCoins());
    if (garageCoinsEl) garageCoinsEl.textContent = String(FTStorage.getCoins());
  }

  function cosmeticsOpts() {
    var sx = squash < 1 ? 1.12 : (squash > 1 ? 0.92 : 1);
    var sy = squash;
    return {
      vehicle: vehicleId,
      hat: hatId,
      giant: false,
      squashX: reduceMotion ? 1 : sx,
      squashY: reduceMotion ? 1 : sy
    };
  }

  function resetBird() {
    var hb = FTSkins.hitbox(birdId, cosmeticsOpts());
    bird = { x: BIRD_X, y: H * 0.42, vy: 0, rot: 0, alive: true, w: hb.w, h: hb.h };
    squash = 1;
    squashTarget = 1;
  }

  function pickPowerType() {
    var r = rng();
    if (r < 0.22) return 'shield';
    if (r < 0.40) return 'turbo';
    if (r < 0.58) return 'magnet';
    if (r < 0.78) return 'slowmo';
    return 'ghost';
  }

  function maybeSpawnPowerup(pipe) {
    if (rng() > POWERUP_CHANCE) return;
    if (isNoCoin() && rng() > 0.5) return;
    var gap = pipe.gap != null ? pipe.gap : currentGap;
    powerups.push({
      x: pipe.x + PIPE_W / 2,
      y: pipe.gapY + gap / 2,
      type: pickPowerType(),
      taken: false,
      pipeRef: pipe
    });
  }

  function spawnCoinsInGap(pipe) {
    if (isNoCoin()) return;
    var gap = pipe.gap != null ? pipe.gap : currentGap;
    var n = 1 + (rng() < 0.4 ? 1 : 0);
    for (var i = 0; i < n; i++) {
      coins.push({
        x: pipe.x + PIPE_W / 2 + (i === 1 ? 28 : 0),
        y: pipe.gapY + gap * (0.35 + rng() * 0.3),
        taken: false,
        pipeRef: pipe
      });
    }
  }

  function maybeSpawnBox(pipe) {
    if (isNoCoin()) return;
    if (rng() > BOX_CHANCE) return;
    var gap = pipe.gap != null ? pipe.gap : currentGap;
    boxes.push({
      x: pipe.x + PIPE_W / 2,
      y: pipe.gapY + gap * 0.2,
      taken: false,
      pipeRef: pipe
    });
  }

  function makePipe(x, gap) {
    var g = gap == null ? currentGap : gap;
    var margin = 55;
    var maxTop = H - GROUND_H - g - margin;
    var gapY = margin + rng() * Math.max(10, maxTop - margin);
    var kind = FTSkins.pickObstacleKind(rng, activeArea());
    var pipe = {
      x: x, gapY: gapY, gap: g, scored: false, nearMissChecked: false,
      kind: kind, w: PIPE_W
    };
    maybeSpawnPowerup(pipe);
    spawnCoinsInGap(pipe);
    maybeSpawnBox(pipe);
    return pipe;
  }

  function maybeSpawnTraffic() {
    if (state !== 'playing') return;
    if (rng() > TRAFFIC_CHANCE) return;
    if (traffic.length >= 3) return;
    var kind = FTSkins.pickTrafficKind(score, rng);
    var dir = rng() < 0.5 ? 1 : -1;
    var dual = score >= 25 && rng() < 0.18;
    var yBase = H - GROUND_H - 28 - rng() * 40;
    var speed = (90 + rng() * 80 + score * 1.2) * dir;
    function spawn(yy, spd, k) {
      traffic.push({
        x: spd > 0 ? -40 : W + 40,
        y: yy,
        vx: spd,
        kind: k,
        dir: spd > 0 ? 1 : -1
      });
    }
    spawn(yBase, speed, kind);
    if (dual) {
      var k2 = FTSkins.pickTrafficKind(score, rng);
      spawn(yBase - 36, -speed * (0.85 + rng() * 0.3), k2);
    }
  }

  function resetPipes() {
    pipes = [];
    powerups = [];
    coins = [];
    boxes = [];
    particles = [];
    traffic = [];
    scorePops = [];
    difficultyFor(0);
    var startX = W + 60;
    pipes.push(makePipe(startX));
    pipes.push(makePipe(startX + currentSpawn));
    pipes.push(makePipe(startX + currentSpawn * 2));
  }

  function updateBestUI() {
    best = FTStorage.getBest();
    if (bestStartEl) bestStartEl.textContent = String(best);
    if (bestDeathEl) {
      var b = best;
      if (playMode === 'daily') b = FTStorage.getDailyBest();
      else if (isTimeAttack()) b = FTStorage.getTimeAttackBest();
      else if (isOneLife()) b = FTStorage.getOneLifeBest();
      else if (isHard()) b = FTStorage.getHardBest();
      else if (isNoCoin()) b = FTStorage.getNoCoinBest();
      bestDeathEl.textContent = String(b);
    }
    if (dailyBestStartEl) dailyBestStartEl.textContent = String(FTStorage.getTodayBest());
    if (totalRunsEl) totalRunsEl.textContent = String(FTStorage.getRunCount());
    updateCoinHud();
  }

  function popScore(amount, x, y) {
    if (reduceMotion) return;
    scorePops.push({
      text: '+' + amount,
      x: x == null ? bird.x : x,
      y: y == null ? bird.y - 20 : y,
      life: 0.7,
      max: 0.7
    });
    if (scoreEl) {
      scoreEl.classList.remove('score-bump');
      void scoreEl.offsetWidth;
      scoreEl.classList.add('score-bump');
    }
  }

  function setScore(n) {
    score = n;
    if (scoreEl) scoreEl.textContent = String(score);
    difficultyFor(score);
    if (!hitThisRun) cleanScorePeak = Math.max(cleanScorePeak, score);
  }

  function showMedalUI(sc) {
    var m = medalFor(sc);
    if (!medalEl) return;
    if (!m || isPractice()) { medalEl.hidden = true; return; }
    medalEl.hidden = false;
    medalEl.className = 'medal medal-' + m;
    if (medalLabelEl) {
      var names = { platinum: 'Platinum', gold: 'Gold', silver: 'Silver', bronze: 'Bronze', legend: 'Legend' };
      if (isOneLife()) {
        medalLabelEl.textContent = (names[m] || '') + (m === 'legend' ? ' 1000' : m === 'gold' ? ' 500' : m === 'silver' ? ' 300' : ' 100');
      } else {
        medalLabelEl.textContent = (names[m] || '') + ' Medal';
      }
    }
    if (!isOneLife()) {
      var bestMedal = FTStorage.getBestMedal();
      var order = { bronze: 1, silver: 2, gold: 3, platinum: 4, legend: 5 };
      if (!bestMedal || (order[m] || 0) > (order[bestMedal] || 0)) FTStorage.setBestMedal(m);
    }
  }

  function allScreens() {
    return [screenStart, screenDeath, screenSettings, screenPause, screenGarage, screenModes,
      screenMissions, screenCollection, screenBoards, screenStreak];
  }

  function hideAllScreens() {
    allScreens().forEach(function (el) { if (el) el.hidden = true; });
  }

  function showMenu() {
    state = 'menu';
    hideAllScreens();
    screenStart.hidden = false;
    hud.hidden = true;
    hitFlash = 0;
    playMode = 'classic';
    oneLifeLocked = false;
    areaOverride = null;
    updateBestUI();
    drawFrame(true);
  }

  function persistScore() {
    var isNew = score > FTStorage.getBest();
    if (playMode === 'daily') FTStorage.setDailyBest(score);
    else if (isTimeAttack()) FTStorage.setTimeAttackBest(score);
    else if (isOneLife()) FTStorage.setOneLifeBest(score);
    else if (isHard()) FTStorage.setHardBest(score);
    else if (isNoCoin()) FTStorage.setNoCoinBest(score);
    else if (!isPractice()) best = FTStorage.setBest(score);
    else return false;
    FTStorage.setTodayBest(score);
    FTStorage.setAllTimeBest(score);
    FTStorage.setBestCombo(runBestCombo);
    FTStorage.setMetersBest(Math.floor(metersFlown));
    return isNew && !isPractice();
  }

  function showDeath() {
    state = 'dead';
    hideAllScreens();
    screenDeath.hidden = false;
    hud.hidden = true;
    if (finalScoreEl) finalScoreEl.textContent = String(score);
    if (runCoinsEl) runCoinsEl.textContent = String(runCoins);
    if (modeDeathEl) {
      var labels = {
        timeattack: 'Time Attack best', hard: 'Hard best', nocoin: 'No Coin best',
        challenge: 'Challenge', onelife: 'One Life PB', daily: 'Daily best', practice: 'Practice'
      };
      modeDeathEl.textContent = labels[playMode] || 'Best';
    }
    var isRecord = persistScore();
    updateBestUI();
    showMedalUI(score);
    if (isRecord) {
      FTAudio.record();
      voiceCue('shabaash');
      showToast('Shabaash! New record!', 2200);
    } else {
      voiceCue('haye_oye');
    }
    if (btnContinue) {
      var allow = !isPractice() && !isChallenge() && !isOneLife() && !isTimeAttack();
      btnContinue.hidden = !allow;
      btnContinue.disabled = continuedThisRun || !allow || oneLifeLocked;
      btnContinue.textContent = continuedThisRun ? 'Continue used' : '▶ Continue (Ad)';
    }
    if (btnRetry) {
      btnRetry.textContent = isOneLife() ? 'Back to Menu' : 'Try Again';
    }
    FTStorage.bumpMission('fly_m', Math.floor(metersFlown));
    FTStorage.bumpMission('coins', runCoins);
    FTStorage.bumpMission('pipes', score);
    FTStorage.bumpMission('boxes', runBoxes);
    if (!hitThisRun && cleanScorePeak >= 50) FTStorage.setMissionMax('clean50', cleanScorePeak);
    var unlocked = FTStorage.checkEnvMilestones(FTStorage.getBest());
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
    if (!isPractice()) {
      FTStorage.bumpRunCount();
      updateBestUI();
    }
  }

  function startRun(fromContinue, mode) {
    FTAudio.unlock();
    if (mode) playMode = mode;
    if (isChallenge()) {
      challengeStageIdx = Math.max(0, Math.min(CHALLENGE_STAGES.length - 1, (FTStorage.getChallengeStage() || 1) - 1));
      areaOverride = (CHALLENGE_STAGES[challengeStageIdx] || {}).area || 'city';
    } else {
      areaOverride = null;
    }
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
    timeLeft = TIME_ATTACK_S;
    updateModeBadge();
    updateTimerHud();
    initRain();

    if (!fromContinue) {
      bumpRunsIfCompetitive();
      continuedThisRun = false;
      oneLifeLocked = isOneLife();
      combo = 0;
      coinCombo = 0;
      nearMissStreak = 0;
      riskyUntil = 0;
      shieldActive = false;
      slowMoUntil = 0;
      magnetUntil = 0;
      turboUntil = 0;
      ghostUntil = 0;
      score2xUntil = 0;
      metersFlown = 0;
      runCoins = 0;
      runBoxes = 0;
      hitThisRun = false;
      cleanScorePeak = 0;
      runBestCombo = 0;
      setScore(0);
      resetBird();
      resetPipes();
      groundX = 0;
      if (isChallenge()) {
        var st = CHALLENGE_STAGES[challengeStageIdx];
        showToast(st.label + ' · score ' + st.target, 2000);
      } else if (isOneLife()) {
        showToast('One Life · no continue!', 1800);
        voiceCue('kya_udaan');
      } else {
        voiceCue('oye_hoye');
      }
    } else {
      resetBird();
      bird.y = H * 0.4;
      bird.vy = 0;
      shieldActive = false;
      pipes.forEach(function (p) { if (p.x < bird.x + 100) p.x = bird.x + 200; });
      for (var i = 1; i < pipes.length; i++) {
        if (pipes[i].x < pipes[i - 1].x + currentSpawn) pipes[i].x = pipes[i - 1].x + currentSpawn;
      }
      powerups = powerups.filter(function (pu) { return pu.x > bird.x + 40; });
      coins = coins.filter(function (c) { return c.x > bird.x + 40; });
      boxes = boxes.filter(function (b) { return b.x > bird.x + 40; });
      traffic = [];
    }
    var hb = FTSkins.hitbox(birdId, cosmeticsOpts());
    bird.w = hb.w;
    bird.h = hb.h;
    updateComboUI();
    updatePowerHud();
    updateCoinHud();
    if (!animId) loop(performance.now());
  }

  function flap() {
    var sens = sensitivity;
    var impulse = FLAP_IMPULSE * sens;
    if (state === 'menu') {
      startRun(false, 'classic');
      bird.vy = FLAP_IMPULSE * sens;
      flapCooldown = FLAP_COOLDOWN;
      squashTarget = 0.72;
      FTAudio.flap();
      return;
    }
    if (state !== 'playing' || !bird || !bird.alive) return;
    if (flapCooldown > 0) return;
    bird.vy = impulse;
    flapCooldown = FLAP_COOLDOWN;
    squashTarget = 0.68;
    FTAudio.flap();
  }

  function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }

  function ghostActive() { return performance.now() < ghostUntil; }

  function checkCollision() {
    if (ghostActive()) return false;
    var halfW = bird.w / 2;
    var halfH = bird.h / 2;
    var left = bird.x - halfW;
    var top = bird.y - halfH;
    if (bird.y + halfH >= H - GROUND_H) return true;
    if (bird.y - halfH <= 0) return true;
    var inset = 3;
    for (var i = 0; i < pipes.length; i++) {
      var p = pipes[i];
      var gap = p.gap != null ? p.gap : currentGap;
      var pw = p.w || PIPE_W;
      if (rectsOverlap(left + inset, top + inset, bird.w - inset * 2, bird.h - inset * 2, p.x, 0, pw, p.gapY)) return true;
      var by = p.gapY + gap;
      if (rectsOverlap(left + inset, top + inset, bird.w - inset * 2, bird.h - inset * 2, p.x, by, pw, H - GROUND_H - by)) return true;
    }
    for (var j = 0; j < traffic.length; j++) {
      var t = traffic[j];
      var thb = FTSkins.trafficHitbox(t);
      if (rectsOverlap(left + 2, top + 2, bird.w - 4, bird.h - 4, t.x - thb.w / 2, t.y - thb.h / 2, thb.w, thb.h)) return true;
    }
    return false;
  }

  function spawnNearMissSparks(x, y) {
    var n = reduceMotion ? 2 : 14;
    for (var i = 0; i < n; i++) {
      var a = (Math.PI * 2 * i) / n + rng() * 0.3;
      var sp = 50 + rng() * 110;
      particles.push({
        x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        life: 0.4, max: 0.65, color: i % 3 === 0 ? '#ff6b6b' : (i % 2 ? '#ffd93d' : '#fff'),
        r: 2 + rng() * 2.5, kind: 'spark'
      });
    }
  }

  function spawnCoinPop(x, y) {
    var n = reduceMotion ? 3 : 12;
    for (var i = 0; i < n; i++) {
      var a = (Math.PI * 2 * i) / n;
      particles.push({
        x: x, y: y, vx: Math.cos(a) * (60 + rng() * 40), vy: Math.sin(a) * (60 + rng() * 40) - 40,
        life: 0.45, max: 0.55, color: '#ffd93d', r: 2.5, kind: 'coin'
      });
    }
  }

  function spawnTrailParticle() {
    if (!bird || reduceMotion || trailId === 'none') return;
    var colors = {
      spark: '#ffd93d', smoke: '#94a3b8', stars: '#a78bfa', star: '#fbbf24',
      fire: '#ff6b35', rainbow: null
    };
    var color = colors[trailId] || '#ffd93d';
    if (trailId === 'rainbow') {
      var rainbow = ['#ff6b6b', '#ffd93d', '#2ecc71', '#3498db', '#9b59b6'];
      color = rainbow[Math.floor(Math.random() * rainbow.length)];
    }
    if (trailId === 'fire') color = Math.random() < 0.5 ? '#ff6b35' : '#ffd93d';
    particles.push({
      x: bird.x - bird.w * 0.35,
      y: bird.y + (Math.random() - 0.5) * bird.h * 0.4,
      vx: -40 - (trailId === 'fire' ? 20 : 0),
      vy: (Math.random() - 0.5) * 30,
      life: 0.35, max: 0.55,
      color: color,
      r: trailId === 'stars' || trailId === 'star' ? 3.5 : (trailId === 'fire' ? 3 : 2.5),
      kind: 'trail'
    });
  }

  function collectPowerup(pu) {
    pu.taken = true;
    FTAudio.powerup();
    haptic('power');
    var now = performance.now();
    if (pu.type === 'shield') { shieldActive = true; showToast('Shield!'); voiceCue('wah_ji'); }
    else if (pu.type === 'slowmo') { slowMoUntil = now + SLOWMO_MS; showToast('Slow-mo 3s'); }
    else if (pu.type === 'magnet') { magnetUntil = now + 4000; showToast('Coin Magnet!'); }
    else if (pu.type === 'turbo') { turboUntil = now + TURBO_MS; FTAudio.turbo(); showToast('Turbo!'); showBanner('TURBO!', 800); }
    else if (pu.type === 'ghost') { ghostUntil = now + GHOST_MS; FTAudio.ghost(); showToast('Ghost!'); }
    updatePowerHud();
    updateComboUI();
  }

  function collectCoin(c) {
    c.taken = true;
    coinCombo += 1;
    var mult = coinComboMult();
    var gained = mult;
    runCoins += gained;
    FTStorage.addCoins(gained);
    if (FTAudio.coin) FTAudio.coin(); else FTAudio.score();
    haptic('coin');
    spawnCoinPop(c.x, c.y);
    popScore(gained, c.x, c.y - 10);
    if (mult >= 5) {
      FTAudio.combo();
      showBanner('COMBO x' + mult + '!', 900);
      voiceCue('wah_ji');
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
    var pool = [
      { kind: 'bird', ids: ['parrot', 'chick', 'owl'] },
      { kind: 'vehicle', ids: ['cycle', 'scooty', 'bicycle', 'rickshaw', 'truck'] },
      { kind: 'hat', ids: ['sunglasses', 'cap', 'hat', 'helmet', 'scarf'] },
      { kind: 'trail', ids: ['smoke', 'stars', 'fire', 'rainbow'] },
      { kind: 'env', ids: ['lahore', 'village', 'bridge', 'mountains'] },
      { kind: 'coins', ids: null }
    ];
    var pick = pool[Math.floor(rng() * pool.length)];
    if (pick.kind === 'coins') {
      var n = 15 + Math.floor(rng() * 20);
      FTStorage.addCoins(n);
      runCoins += n;
      showToast('Mystery: +' + n + ' coins!');
    } else {
      var id = pick.ids[Math.floor(rng() * pick.ids.length)];
      var unlocked = false;
      if (pick.kind === 'bird' && !FTStorage.isBirdUnlocked(id)) { FTStorage.unlockBird(id); unlocked = true; }
      else if (pick.kind === 'vehicle' && !FTStorage.isVehicleUnlocked(id)) { FTStorage.unlockVehicle(id); unlocked = true; }
      else if (pick.kind === 'hat' && !FTStorage.isHatUnlocked(id)) { FTStorage.unlockHat(id); unlocked = true; }
      else if (pick.kind === 'trail' && !FTStorage.isTrailUnlocked(id)) { FTStorage.unlockTrail(id); unlocked = true; }
      else if (pick.kind === 'env' && !FTStorage.isEnvUnlocked(id)) { FTStorage.unlockEnv(id); unlocked = true; }
      FTStorage.addToCollection(pick.kind === 'hat' ? 'accessory' : pick.kind, id);
      if (unlocked) { showToast('Mystery: ' + id + '!'); voiceCue('wah_ji'); }
      else {
        FTStorage.addCoins(10);
        runCoins += 10;
        showToast('Mystery: +10 🪙');
      }
    }
    updateCoinHud();
  }

  function beginDeath() {
    if (state !== 'playing') return;
    if (isPractice()) {
      if (bird.vy > 0) bird.vy = FLAP_IMPULSE * 0.6 * sensitivity;
      else bird.vy = Math.abs(bird.vy) * 0.4;
      var halfH = bird.h / 2;
      if (bird.y + halfH >= H - GROUND_H) bird.y = H - GROUND_H - halfH - 2;
      if (bird.y - halfH <= 0) bird.y = halfH + 2;
      return;
    }
    if (shieldActive) {
      shieldActive = false;
      hitFlash = 0.55;
      hitThisRun = true;
      FTAudio.nearmiss();
      voiceCue('bach_ke');
      showToast('Shield broke!');
      updatePowerHud();
      var nearest = null, bestDx = 1e9;
      for (var i = 0; i < pipes.length; i++) {
        var dx = Math.abs(pipes[i].x + PIPE_W / 2 - bird.x);
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
    nearMissStreak = 0;
    FTAudio.hit();
    haptic('death');
    triggerShake();
    hitFlash = 1;
    deathFreezeUntil = performance.now() + DEATH_FREEZE_MS;
    if (!reduceMotion) {
      for (var k = 0; k < 18; k++) {
        var a = (Math.PI * 2 * k) / 18;
        particles.push({
          x: bird.x, y: bird.y,
          vx: Math.cos(a) * (80 + rng() * 60),
          vy: Math.sin(a) * (80 + rng() * 60),
          life: 0.55, max: 0.7, color: '#ff6b6b', r: 3, kind: 'spark'
        });
      }
    }
  }

  function addPipeScore(p) {
    combo += 1;
    runBestCombo = Math.max(runBestCombo, combo, coinCombo, nearMissStreak);
    var mult = pipeComboMult();
    var gained = 1 * mult;
    setScore(score + gained);
    FTAudio.score();
    popScore(gained, bird.x + 20, bird.y - 30);
    if (mult >= 3) {
      FTAudio.combo();
      showBanner((riskyActive() ? 'RISKY x' : 'COMBO x') + mult + '!', 900);
    }
    toastOyeAcc += 1;
    if (toastOyeAcc >= 7 + Math.floor(rng() * 5)) {
      toastOyeAcc = 0;
      if (p.kind && p.kind !== 'pipe') voiceCue('bach_ke');
      else if (rng() < 0.5) voiceCue('oye_hoye');
    }
    if (isChallenge() && !challengeWon) {
      var st = CHALLENGE_STAGES[challengeStageIdx] || CHALLENGE_STAGES[0];
      if (score >= st.target) {
        challengeWon = true;
        FTStorage.addCoins(40 + challengeStageIdx * 10);
        var next = Math.min(CHALLENGE_STAGES.length, challengeStageIdx + 2);
        FTStorage.setChallengeStage(next);
        FTAudio.combo();
        voiceCue('shabaash');
        showBanner('STAGE CLEAR!', 1600);
        showToast('Stage clear! Stage ' + next + ' unlocked', 2500);
        updateCoinHud();
      }
    }
    updateComboUI();
    updatePowerHud();
  }

  function checkNearMiss(p) {
    if (p.nearMissChecked) return;
    if (bird.x < p.x + PIPE_W * 0.35) return;
    p.nearMissChecked = true;
    var gap = p.gap != null ? p.gap : currentGap;
    var halfH = bird.h / 2;
    var topClear = bird.y - halfH - p.gapY;
    var botClear = p.gapY + gap - (bird.y + halfH);
    var clear = Math.min(topClear, botClear);
    if (clear >= 0 && clear < NEAR_MISS_PX) {
      spawnNearMissSparks(p.x + PIPE_W / 2, topClear < botClear ? p.gapY + 4 : p.gapY + gap - 4);
      FTAudio.nearmiss();
      haptic('nearmiss');
      nearMissStreak += 1;
      showToast('CLOSE!', 700);
      if (nearMissStreak >= 3) {
        riskyUntil = performance.now() + 5000;
        FTAudio.risky();
        showBanner('RISKY x3!', 1100);
        voiceCue('kya_udaan');
        nearMissStreak = 0;
      }
      updateComboUI();
    } else if (clear >= NEAR_MISS_PX) {
      nearMissStreak = 0;
    }
  }

  function update(dt) {
    if (dt > 0.05) dt = 0.05;
    if (state === 'paused') return;
    var now = performance.now();
    var slowActive = now < slowMoUntil;
    var timeScale = slowActive ? SLOWMO_SCALE : 1;
    var sdt = dt * timeScale;
    var scroll = currentSpeed * sdt * (state === 'playing' ? 1 : 0.35);

    squash += (squashTarget - squash) * Math.min(1, dt * 18);
    if (Math.abs(squash - squashTarget) < 0.02 && squashTarget !== 1) squashTarget = 1.08;
    if (squashTarget > 1 && Math.abs(squash - squashTarget) < 0.02) squashTarget = 1;

    groundX = (groundX - scroll * (state === 'playing' ? 1 : 0.5)) % 40;
    clouds.forEach(function (c) {
      c.x -= c.s * (state === 'playing' ? currentSpeed * 0.15 * sdt : 8 * dt);
      if (c.x < -80) c.x = W + 40;
    });

    var drawEnv = activeArea();
    var weather = (drawEnv === 'rain') ? 'rain' : (drawEnv === 'night' ? 'night' : weatherId);
    var pal = FTSkins.envPalette(drawEnv === 'rain' ? 'city' : drawEnv, weather);
    if ((pal.rain || drawEnv === 'rain') && !reduceMotion) {
      rainDrops.forEach(function (d) {
        d.y += d.spd * dt;
        d.x -= 40 * dt;
        if (d.y > H) { d.y = -10; d.x = Math.random() * W; }
      });
    }

    for (var i = particles.length - 1; i >= 0; i--) {
      var pt = particles[i];
      pt.life -= dt;
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      if (pt.kind !== 'trail') pt.vy += 140 * dt;
      else pt.vx *= 0.98;
      if (pt.life <= 0) particles.splice(i, 1);
    }

    for (var si = scorePops.length - 1; si >= 0; si--) {
      var sp = scorePops[si];
      sp.life -= dt;
      sp.y -= 40 * dt;
      if (sp.life <= 0) scorePops.splice(si, 1);
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
    if (turboUntil && now >= turboUntil) { turboUntil = 0; difficultyFor(score); updatePowerHud(); }
    if (ghostUntil && now >= ghostUntil) { ghostUntil = 0; updatePowerHud(); }
    if (magnetUntil && now >= magnetUntil) { magnetUntil = 0; updatePowerHud(); }
    if (riskyUntil && now >= riskyUntil) { riskyUntil = 0; updateComboUI(); updatePowerHud(); }

    if (isTimeAttack()) {
      timeLeft -= sdt;
      updateTimerHud();
      if (timeLeft <= 0) {
        timeLeft = 0;
        bird.alive = false;
        state = 'dying';
        hitFlash = 0.8;
        deathFreezeUntil = now + 400;
        FTAudio.combo();
        showBanner('TIME!', 1000);
        return;
      }
    }

    var g = GRAVITY * sensitivity;
    var term = TERMINAL_V * Math.max(0.85, sensitivity);
    bird.vy += g * sdt;
    if (bird.vy > term) bird.vy = term;
    bird.y += bird.vy * sdt;

    var targetRot = Math.max(-0.65, Math.min(1.25, bird.vy / 500));
    bird.rot += (targetRot - bird.rot) * Math.min(1, sdt * 12);

    metersFlown += currentSpeed * sdt * M_PER_PX;

    trailAcc += sdt;
    if (trailAcc >= TRAIL_INTERVAL) { trailAcc = 0; spawnTrailParticle(); }

    maybeSpawnTraffic();
    for (var ti = traffic.length - 1; ti >= 0; ti--) {
      var tv = traffic[ti];
      tv.x += tv.vx * sdt;
      if (tv.x < -80 || tv.x > W + 80) traffic.splice(ti, 1);
    }

    for (var pi = 0; pi < pipes.length; pi++) {
      var p = pipes[pi];
      p.x -= currentSpeed * sdt;
      checkNearMiss(p);
      if (!p.scored && p.x + (p.w || PIPE_W) < bird.x) {
        p.scored = true;
        addPipeScore(p);
      }
    }

    var magOn = now < magnetUntil;
    for (var pui = powerups.length - 1; pui >= 0; pui--) {
      var pu = powerups[pui];
      if (pu.taken) { powerups.splice(pui, 1); continue; }
      if (pu.pipeRef) {
        pu.x = pu.pipeRef.x + PIPE_W / 2;
        var gap = pu.pipeRef.gap != null ? pu.pipeRef.gap : currentGap;
        pu.y = pu.pipeRef.gapY + gap / 2;
      } else pu.x -= currentSpeed * sdt;
      if (pu.x < -30) { powerups.splice(pui, 1); continue; }
      var dx = bird.x - pu.x, dy = bird.y - pu.y;
      if (dx * dx + dy * dy < (POWERUP_R + bird.w * 0.35) * (POWERUP_R + bird.w * 0.35)) {
        collectPowerup(pu);
        powerups.splice(pui, 1);
      }
    }

    for (var ci = coins.length - 1; ci >= 0; ci--) {
      var c = coins[ci];
      if (c.taken) { coins.splice(ci, 1); continue; }
      if (magOn) {
        var cdx = bird.x - c.x, cdy = bird.y - c.y;
        var dist = Math.sqrt(cdx * cdx + cdy * cdy) || 1;
        if (dist < 120) {
          c.x += (cdx / dist) * 220 * sdt;
          c.y += (cdy / dist) * 220 * sdt;
        } else {
          c.x -= currentSpeed * sdt;
        }
      } else {
        c.x -= currentSpeed * sdt;
      }
      if (c.x < -30) { coins.splice(ci, 1); coinCombo = 0; continue; }
      var cx = bird.x - c.x, cy = bird.y - c.y;
      if (cx * cx + cy * cy < (COIN_R + bird.w * 0.4) * (COIN_R + bird.w * 0.4)) {
        collectCoin(c);
        coins.splice(ci, 1);
      }
    }

    for (var bi = boxes.length - 1; bi >= 0; bi--) {
      var b = boxes[bi];
      if (b.taken) { boxes.splice(bi, 1); continue; }
      if (b.pipeRef) b.x = b.pipeRef.x + PIPE_W / 2;
      else b.x -= currentSpeed * sdt;
      if (b.x < -30) { boxes.splice(bi, 1); continue; }
      var bx = bird.x - b.x, by2 = bird.y - b.y;
      if (bx * bx + by2 * by2 < (16 + bird.w * 0.35) * (16 + bird.w * 0.35)) {
        openMysteryBox(b);
        boxes.splice(bi, 1);
      }
    }

    if (pipes.length && pipes[0].x + PIPE_W < -12) {
      pipes.shift();
      var last = pipes[pipes.length - 1];
      pipes.push(makePipe(last.x + currentSpawn, currentGap));
    }

    if (checkCollision()) beginDeath();
  }

  function drawSky() {
    var area = activeArea();
    var weather = area === 'rain' ? 'rain' : (area === 'night' ? 'night' : weatherId);
    var palEnv = (area === 'rain') ? 'city' : area;
    var pal = FTSkins.envPalette(palEnv, weather);
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, pal.sky0);
    g.addColorStop(0.55, pal.sky1);
    g.addColorStop(1, pal.sky2);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = pal.sun;
    ctx.beginPath();
    if (pal.stars || area === 'night') {
      ctx.arc(W - 70, 80, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      for (var i = 0; i < 18; i++) {
        ctx.fillRect((i * 97 + 40) % W, (i * 53 + 20) % 220, 2, 2);
      }
    } else {
      ctx.arc(W - 60, 70, 28, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    if (area === 'bridge') {
      ctx.fillStyle = 'rgba(40,40,50,0.35)';
      ctx.fillRect(0, H - GROUND_H - 50, W, 12);
      for (var bi = 0; bi < 5; bi++) {
        var bx = ((bi * 90 + groundX * 0.4) % (W + 60)) - 30;
        ctx.fillRect(bx, H - GROUND_H - 90, 8, 40);
      }
    } else if (area === 'lahore' || area === 'karachi' || area === 'city' || area === 'night' || area === 'rain') {
      for (var ci = 0; ci < 6; ci++) {
        var cx = ((ci * 70 + groundX * 0.3) % (W + 80)) - 40;
        var bh = 40 + (ci % 3) * 25;
        ctx.fillRect(cx, H - GROUND_H - bh, 36 + (ci % 2) * 20, bh);
      }
    } else if (area === 'murree' || area === 'islamabad' || area === 'mountains') {
      ctx.beginPath();
      ctx.moveTo(0, H - GROUND_H);
      for (var mi = 0; mi < 5; mi++) {
        ctx.lineTo(mi * 100, H - GROUND_H - 50 - (mi % 2) * 30);
      }
      ctx.lineTo(W, H - GROUND_H);
      ctx.fill();
    } else if (area === 'desert') {
      ctx.fillStyle = 'rgba(210,160,40,0.35)';
      ctx.beginPath();
      ctx.ellipse(80, H - GROUND_H, 70, 22, 0, 0, Math.PI * 2);
      ctx.ellipse(250, H - GROUND_H, 90, 18, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (area === 'village') {
      for (var vi = 0; vi < 4; vi++) {
        var vx = ((vi * 100 + groundX * 0.25) % (W + 60)) - 20;
        ctx.fillStyle = 'rgba(120,80,40,0.3)';
        ctx.fillRect(vx, H - GROUND_H - 36, 40, 36);
        ctx.beginPath();
        ctx.moveTo(vx - 4, H - GROUND_H - 36);
        ctx.lineTo(vx + 20, H - GROUND_H - 56);
        ctx.lineTo(vx + 44, H - GROUND_H - 36);
        ctx.fill();
      }
    }

    clouds.forEach(function (c) {
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
    var area = activeArea();
    var weather = area === 'rain' ? 'rain' : weatherId;
    var pal = FTSkins.envPalette(area === 'rain' ? 'city' : area, weather);
    if ((!pal.rain && area !== 'rain') || reduceMotion) return;
    ctx.strokeStyle = pal.storm ? 'rgba(200,220,255,0.55)' : 'rgba(180,200,230,0.45)';
    ctx.lineWidth = 1.5;
    rainDrops.forEach(function (d) {
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x - 3, d.y + d.len);
      ctx.stroke();
    });
  }

  function drawPipe(p) {
    var area = activeArea();
    var weather = area === 'rain' ? 'rain' : (area === 'night' ? 'night' : weatherId);
    var pal = FTSkins.envPalette(area === 'rain' ? 'city' : area, weather);
    var ghost = (isPractice() || ghostActive()) && state === 'playing';
    FTSkins.drawObstaclePair(ctx, p, pal, H - GROUND_H, ghost);
  }

  function drawPowerup(pu) {
    if (pu.taken) return;
    var t = performance.now() / 1000;
    var bob = reduceMotion ? 0 : Math.sin(t * 4 + pu.x * 0.05) * 3;
    ctx.save();
    ctx.translate(pu.x, pu.y + bob);
    var colors = {
      shield: 'rgba(100,200,255,0.9)', slowmo: 'rgba(180,140,255,0.92)',
      turbo: 'rgba(255,180,50,0.95)', magnet: 'rgba(255,100,150,0.92)', ghost: 'rgba(200,220,255,0.85)'
    };
    ctx.fillStyle = colors[pu.type] || '#ffd93d';
    ctx.beginPath();
    ctx.arc(0, 0, POWERUP_R, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#0a2540';
    ctx.font = 'bold 12px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    var icons = { shield: '🛡', slowmo: '⏱', turbo: '⚡', magnet: '🧲', ghost: '👻' };
    ctx.fillText(icons[pu.type] || '✦', 0, 1);
    ctx.restore();
  }

  function drawCoin(c) {
    if (c.taken) return;
    var bob = reduceMotion ? 0 : Math.sin(performance.now() / 200 + c.x) * 2;
    var pulse = 1 + (reduceMotion ? 0 : Math.sin(performance.now() / 120 + c.x) * 0.08);
    ctx.save();
    ctx.translate(c.x, c.y + bob);
    ctx.scale(pulse, pulse);
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
    var bob = reduceMotion ? 0 : Math.sin(performance.now() / 250 + b.x) * 3;
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
    particles.forEach(function (pt) {
      var a = Math.max(0, pt.life / (pt.max || 0.5));
      ctx.globalAlpha = a * (pt.kind === 'trail' ? 0.7 : 1);
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.r * a, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });
  }

  function drawScorePops() {
    scorePops.forEach(function (sp) {
      var a = Math.max(0, sp.life / sp.max);
      ctx.globalAlpha = a;
      ctx.fillStyle = '#ffd93d';
      ctx.font = 'bold 16px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(sp.text, sp.x, sp.y);
      ctx.globalAlpha = 1;
    });
  }

  function drawGround() {
    var area = activeArea();
    var weather = area === 'rain' ? 'rain' : weatherId;
    var pal = FTSkins.envPalette(area === 'rain' ? 'city' : area, weather);
    var gy = H - GROUND_H;
    ctx.fillStyle = pal.ground;
    ctx.fillRect(0, gy, W, GROUND_H);
    ctx.fillStyle = pal.grass;
    ctx.fillRect(0, gy, W, 14);
    ctx.fillStyle = pal.stripe || '#a88848';
    for (var x = groundX; x < W + 40; x += 40) ctx.fillRect(x, gy + 18, 20, 8);
    ctx.fillStyle = pal.grassLine || '#5a8f3a';
    ctx.fillRect(0, gy, W, 3);
  }

  function drawHitFlash() {
    if (hitFlash <= 0) return;
    var r = 255, g = state === 'dying' ? 80 : 255, b = state === 'dying' ? 80 : 255;
    ctx.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + (0.55 * hitFlash).toFixed(3) + ')';
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

  function drawGhostAura() {
    if (!bird || !ghostActive()) return;
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = 'rgba(220,230,255,0.9)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(bird.x, bird.y, Math.max(bird.w, bird.h) * 0.85 + 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  function drawFrame(idle) {
    drawSky();
    pipes.forEach(drawPipe);
    traffic.forEach(function (t) { FTSkins.drawTraffic(ctx, t); });
    powerups.forEach(drawPowerup);
    coins.forEach(drawCoin);
    boxes.forEach(drawBox);
    drawGround();
    drawParticles();
    drawWeatherFX();
    if (bird) {
      drawShieldAura();
      drawGhostAura();
      ctx.globalAlpha = ghostActive() ? 0.55 : 1;
      FTSkins.draw(ctx, birdId, bird.x, bird.y, bird.rot, 1, cosmeticsOpts());
      ctx.globalAlpha = 1;
    } else if (idle) {
      var bob = reduceMotion ? 0 : Math.sin(Date.now() / 300) * 8;
      FTSkins.draw(ctx, birdId, BIRD_X, H * 0.42 + bob, 0, 1, cosmeticsOpts());
    }
    drawScorePops();
    if (state === 'playing' && isChallenge()) {
      var st = CHALLENGE_STAGES[challengeStageIdx] || CHALLENGE_STAGES[0];
      ctx.fillStyle = 'rgba(15,23,42,0.7)';
      ctx.fillRect(W / 2 - 60, 8, 120, 22);
      ctx.fillStyle = '#ffd93d';
      ctx.font = 'bold 12px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(score + ' / ' + st.target, W / 2, 23);
    }
    if (state === 'playing' && riskyActive()) {
      ctx.fillStyle = 'rgba(255,100,80,0.12)';
      ctx.fillRect(0, 0, W, H);
    }
    drawHitFlash();
  }

  function loop(ts) {
    if (!lastTs) lastTs = ts;
    var dt = (ts - lastTs) / 1000;
    lastTs = ts;
    update(dt);
    drawFrame(state === 'menu');
    animId = requestAnimationFrame(loop);
  }

  function onPointer(e) {
    if (e.target && e.target.closest && e.target.closest(
      'button, .skin-card, #ad-stub-modal, .screen, label, input, .tab-btn, .mission-card, .chip'
    )) return;
    e.preventDefault();
    flap();
  }
  canvas.addEventListener('pointerdown', onPointer);
  document.getElementById('app').addEventListener('pointerdown', function (e) {
    if (state === 'playing') {
      if (e.target.closest && e.target.closest('button, .screen, label, input')) return;
      e.preventDefault();
      flap();
    }
  }, { passive: false });

  window.addEventListener('keydown', function (e) {
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
      else if (state === 'dead') {
        if (isOneLife()) showMenu();
        else retryFlow();
      }
    }
  });

  btnPlay.addEventListener('click', function () { FTAudio.unlock(); startRun(false, 'classic'); });

  async function retryFlow() {
    if (isOneLife()) { showMenu(); return; }
    if (FTStorage.getRunCount() % 2 === 0) await Ads.showInterstitial('between-runs');
    startRun(false, playMode === 'challenge' && challengeWon ? 'classic' : playMode);
  }
  btnRetry.addEventListener('click', function () { retryFlow(); });
  btnMenu.addEventListener('click', function () { showMenu(); });
  btnContinue.addEventListener('click', async function () {
    if (continuedThisRun || isPractice() || isOneLife()) return;
    var res = await Ads.showRewarded('continue');
    if (res && res.rewarded) {
      continuedThisRun = true;
      showToast('Continue granted!');
      startRun(true);
    } else showToast('Continue skipped');
  });

  if (btnPause) btnPause.addEventListener('click', function (e) { e.stopPropagation(); pauseGame(); });
  if (btnResume) btnResume.addEventListener('click', function () { resumeGame(); });
  if (btnQuitPause) btnQuitPause.addEventListener('click', function () { quitToMenu(); });

  function syncMuteBtn() {
    var m = FTStorage.isMuted();
    FTAudio.setMuted(m);
    btnMute.textContent = m ? '🔇' : '🔊';
    if (soundToggleChk) soundToggleChk.checked = !m;
  }
  btnMute.addEventListener('click', function () {
    FTStorage.setMuted(!FTStorage.isMuted());
    syncMuteBtn();
  });

  function applyReduceMotionClass() {
    document.documentElement.classList.toggle('reduce-motion', reduceMotion);
  }

  if (btnSettings) btnSettings.addEventListener('click', function () {
    if (!screenSettings) return;
    screenSettings.hidden = false;
    if (sensSlider) sensSlider.value = String(sensitivity);
    if (sensValueEl) sensValueEl.textContent = sensitivity.toFixed(2);
    if (reduceMotionChk) reduceMotionChk.checked = reduceMotion;
    if (soundToggleChk) soundToggleChk.checked = !FTStorage.isMuted();
    if (hapticsToggleChk) hapticsToggleChk.checked = hapticsOn;
    if (voiceToggleChk) voiceToggleChk.checked = FTStorage.getVoicePack();
  });
  if (btnSettingsClose) btnSettingsClose.addEventListener('click', function () { screenSettings.hidden = true; });
  if (sensSlider) sensSlider.addEventListener('input', function () {
    sensitivity = FTStorage.setSensitivity(sensSlider.value);
    if (sensValueEl) sensValueEl.textContent = sensitivity.toFixed(2);
  });
  if (reduceMotionChk) reduceMotionChk.addEventListener('change', function () {
    reduceMotion = !!reduceMotionChk.checked;
    FTStorage.setReduceMotion(reduceMotion);
    applyReduceMotionClass();
  });
  if (soundToggleChk) soundToggleChk.addEventListener('change', function () {
    FTStorage.setMuted(!soundToggleChk.checked);
    syncMuteBtn();
  });
  if (hapticsToggleChk) hapticsToggleChk.addEventListener('change', function () {
    hapticsOn = !!hapticsToggleChk.checked;
    FTStorage.setHaptics(hapticsOn);
  });
  if (voiceToggleChk) voiceToggleChk.addEventListener('change', function () {
    var on = !!voiceToggleChk.checked;
    FTStorage.setVoicePack(on);
    FTAudio.setVoicePack(on);
  });

  async function tryUnlock(item, kind) {
    var cost = item.cost || 0;
    if (cost <= 0) return;
    if (FTStorage.getCoins() < cost) { showToast('Need ' + cost + ' coins'); return; }
    if (kind === 'env' && item.unlockScore && FTStorage.getBest() >= item.unlockScore) {
      FTStorage.unlockEnv(item.id);
      showToast(item.label + ' unlocked (score)!');
      refreshGarage();
      return;
    }
    if (!FTStorage.spendCoins(cost)) { showToast('Need ' + cost + ' coins'); return; }
    if (kind === 'bird') FTStorage.unlockBird(item.id);
    else if (kind === 'vehicle') FTStorage.unlockVehicle(item.id);
    else if (kind === 'env') FTStorage.unlockEnv(item.id);
    else if (kind === 'hat') FTStorage.unlockHat(item.id);
    else if (kind === 'trail') FTStorage.unlockTrail(item.id);
    FTStorage.addToCollection(kind === 'hat' ? 'accessory' : kind, item.id);
    showToast(item.label + ' unlocked!');
    voiceCue('wah_ji');
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
      var hb = FTSkins.hitbox(birdId, cosmeticsOpts());
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
      FTSkins.WEATHERS.forEach(function (w) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'chip' + (w.id === weatherId ? ' selected' : '');
        btn.textContent = w.label;
        btn.addEventListener('click', function () {
          weatherId = w.id;
          FTStorage.setWeather(w.id);
          weatherRow.querySelectorAll('.chip').forEach(function (el) { el.classList.remove('selected'); });
          btn.classList.add('selected');
          drawFrame(true);
        });
        weatherRow.appendChild(btn);
      });
    }
  }

  if (btnGarage) btnGarage.addEventListener('click', function () {
    hideAllScreens();
    if (screenGarage) screenGarage.hidden = false;
    refreshGarage();
  });
  document.querySelectorAll('[data-close="garage"]').forEach(function (b) {
    b.addEventListener('click', function () { showMenu(); });
  });

  if (btnModes) btnModes.addEventListener('click', function () {
    hideAllScreens();
    if (screenModes) screenModes.hidden = false;
  });
  document.querySelectorAll('[data-close="modes"]').forEach(function (b) {
    b.addEventListener('click', function () { showMenu(); });
  });
  document.querySelectorAll('[data-mode]').forEach(function (b) {
    b.addEventListener('click', function () {
      var m = b.getAttribute('data-mode');
      FTAudio.unlock();
      startRun(false, m);
      var names = {
        classic: 'Classic', timeattack: 'Time Attack 60s', hard: 'Hard',
        nocoin: 'No Coin', challenge: 'Challenge Stages', onelife: 'One Life',
        daily: 'Daily', practice: 'Practice'
      };
      showToast(names[m] || m);
    });
  });

  function refreshMissions() {
    if (!missionsList) return;
    missionsList.innerHTML = '';
    FTStorage.getMissions().forEach(function (m) {
      var card = document.createElement('div');
      card.className = 'mission-card' + (m.done ? ' done' : '') + (m.claimed ? ' claimed' : '');
      var pct = Math.min(100, Math.floor((m.progress / m.target) * 100));
      card.innerHTML =
        '<div class="mission-title">' + m.label + '</div>' +
        '<div class="mission-bar"><span style="width:' + pct + '%"></span></div>' +
        '<div class="mission-meta">' + Math.min(m.progress, m.target) + ' / ' + m.target +
        ' · 🪙 ' + m.reward + '</div>';
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn primary btn-sm';
      btn.textContent = m.claimed ? 'Claimed' : m.done ? 'Claim' : 'In progress';
      btn.disabled = !m.done || m.claimed;
      btn.addEventListener('click', function () {
        var r = FTStorage.claimMission(m.id);
        if (r) { showToast('+' + r + ' coins!'); refreshMissions(); updateCoinHud(); }
      });
      card.appendChild(btn);
      missionsList.appendChild(card);
    });
  }
  if (btnMissions) btnMissions.addEventListener('click', function () {
    hideAllScreens();
    if (screenMissions) screenMissions.hidden = false;
    refreshMissions();
  });
  document.querySelectorAll('[data-close="missions"]').forEach(function (b) {
    b.addEventListener('click', function () { showMenu(); });
  });

  function refreshCollection() {
    if (!collectionList) return;
    var counts = FTStorage.collectionCounts();
    var birds = FTStorage.getUnlockedBirds();
    var vehs = FTStorage.getUnlockedVehicles();
    var hats = FTStorage.getUnlockedHats();
    var trails = FTStorage.getUnlockedTrails();
    collectionList.innerHTML = '';
    var summary = document.createElement('p');
    summary.className = 'hint';
    summary.textContent =
      'Birds ' + counts.birds.have + '/' + counts.birds.total +
      ' · Vehicles ' + counts.vehicles.have + '/' + counts.vehicles.total +
      ' · Accessories ' + counts.accessories.have + '/' + counts.accessories.total +
      ' · Trails ' + counts.trails.have + '/' + counts.trails.total;
    collectionList.appendChild(summary);
    function section(title, map, labels) {
      var h = document.createElement('h3');
      h.textContent = title;
      collectionList.appendChild(h);
      var row = document.createElement('div');
      row.className = 'skin-row';
      Object.keys(labels).forEach(function (id) {
        if (id === 'none') return;
        var el = document.createElement('div');
        el.className = 'collect-chip' + (map[id] ? ' owned' : '');
        el.textContent = (map[id] ? '✓ ' : '🔒 ') + labels[id];
        row.appendChild(el);
      });
      collectionList.appendChild(row);
    }
    var birdLabels = {}; FTSkins.BIRDS.forEach(function (b) { birdLabels[b.id] = b.label; });
    var vehLabels = {}; FTSkins.VEHICLES.forEach(function (b) { vehLabels[b.id] = b.label; });
    var hatLabels = {}; FTSkins.HATS.forEach(function (b) { hatLabels[b.id] = b.label; });
    var trailLabels = {}; FTSkins.TRAILS.forEach(function (b) { trailLabels[b.id] = b.label; });
    section('Birds', birds, birdLabels);
    section('Vehicles', vehs, vehLabels);
    section('Accessories', hats, hatLabels);
    section('Trails', trails, trailLabels);
  }
  if (btnCollection) btnCollection.addEventListener('click', function () {
    hideAllScreens();
    if (screenCollection) screenCollection.hidden = false;
    refreshCollection();
  });
  document.querySelectorAll('[data-close="collection"]').forEach(function (b) {
    b.addEventListener('click', function () { showMenu(); });
  });

  function refreshBoards() {
    if (!boardsList) return;
    var lb = FTStorage.getLeaderboards();
    var rows = [
      ['Personal Best', lb.personalBest],
      ['Today Best', lb.todayBest],
      ['All-Time', lb.allTime],
      ['Best Distance (m)', lb.bestDistance],
      ['Best Combo', lb.bestCombo],
      ['Time Attack', lb.timeAttack],
      ['Hard Best', lb.hard],
      ['No Coin Best', lb.noCoin],
      ['One Life PB', lb.oneLife]
    ];
    boardsList.innerHTML = rows.map(function (r) {
      return '<div class="board-row"><span>' + r[0] + '</span><strong>' + r[1] + '</strong></div>';
    }).join('');
  }
  if (btnBoards) btnBoards.addEventListener('click', function () {
    hideAllScreens();
    if (screenBoards) screenBoards.hidden = false;
    refreshBoards();
  });
  document.querySelectorAll('[data-close="boards"]').forEach(function (b) {
    b.addEventListener('click', function () { showMenu(); });
  });

  function refreshStreak() {
    if (!streakBody) return;
    var s = FTStorage.getStreak();
    var html = '<p class="hint">Day ' + s.day + ' of 7' + (s.claimed ? ' · claimed today' : '') + '</p>';
    html += '<div class="streak-days">';
    for (var i = 1; i <= 7; i++) {
      var r = s.rewards[i - 1];
      var done = i < s.day || (i === s.day && s.claimed);
      var current = i === s.day && !s.claimed;
      var label = r.type === 'coins' ? r.coins + '🪙' : r.type === 'rare_skin' ? '🐦' : '?';
      html += '<div class="streak-day' + (done ? ' done' : '') + (current ? ' current' : '') + '">' +
        '<span>D' + i + '</span><strong>' + label + '</strong></div>';
    }
    html += '</div>';
    streakBody.innerHTML = html;
    var btn = document.getElementById('btn-claim-streak');
    if (btn) {
      btn.disabled = !s.canClaim;
      btn.textContent = s.claimed ? 'Claimed today' : 'Claim Day ' + s.day;
    }
  }
  if (btnStreak) btnStreak.addEventListener('click', function () {
    hideAllScreens();
    if (screenStreak) screenStreak.hidden = false;
    refreshStreak();
  });
  var btnClaimStreak = document.getElementById('btn-claim-streak');
  if (btnClaimStreak) btnClaimStreak.addEventListener('click', function () {
    var r = FTStorage.claimStreak();
    if (!r) return;
    if (r.type === 'rare_skin') {
      showToast('Day ' + r.day + ': rare skin ' + r.unlocked + '!');
      voiceCue('shabaash');
    } else if (r.type === 'mystery') {
      showToast('Day ' + r.day + ': mystery +' + r.coins + ' 🪙');
      voiceCue('wah_ji');
    } else {
      showToast('Day ' + r.day + ': +' + r.coins + ' coins');
    }
    updateCoinHud();
    refreshStreak();
  });
  document.querySelectorAll('[data-close="streak"]').forEach(function (b) {
    b.addEventListener('click', function () { showMenu(); });
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
  FTAudio.setVoicePack(FTStorage.getVoicePack());
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
  window.addEventListener('orientationchange', function () { setTimeout(resizeCanvas, 100); });
  showMenu();
  loop(performance.now());
})();
