/**
 * Urr Jaa! v3.15.0-urrjaa — Power VFX, Challenge select, One Life HUD, coin balance, unlock teaser, gift haptic,
 * landscape safe-area, universal panel Close (X), bugfixes.
 * Core: FLY→DODGE→COINS→COMBO→POWER-UP→RECORD→UNLOCK→TRY AGAIN. NO countdown.
 * KEEP all prior features — different pack from 3.11–3.14.
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
  const FLAP_IMPULSE = -430;      // snappier tap response (3.11)
  const TERMINAL_V = 620;
  const FLAP_COOLDOWN = 0.07;     // tighter tap cadence (3.11)
  const PIPE_W = 64;
  const BASE_SPEED = 138;        // Classic baseline a touch calmer (3.11); Hard uses modeSpeedMul
  const BASE_GAP = 194;          // Classic: roomier reactable gaps (3.11)
  const BASE_SPAWN = 228;
  const SPEED_CAP = 260;
  const GAP_FLOOR = 128;
  const SPAWN_FLOOR = 160;
  const SPEED_PER_SCORE = 1.55;
  const GAP_SHRINK_PER = 0.58;
  const SPAWN_SHRINK_PER = 0.82;
  const HITBOX_INSET = 0.30;     // extra soft inset on top of smaller body hitbox (3.11)
  const CORNER_TOL = 18;         // obstacle corner forgiveness (px) — Classic grace (3.11)
  const LUCKY_COOLDOWN_MS = 2000;
  const MEDAL_BRONZE = 10;
  const MEDAL_SILVER = 25;
  const MEDAL_GOLD = 50;
  const MEDAL_PLATINUM = 100;
  const DEATH_FREEZE_MS = 700;
  const HIT_FLASH_MS = 220;
  const NEAR_MISS_PX = 24;
  const SLOWMO_MS = 3000;
  const SLOWMO_SCALE = 0.45;
  const POWERUP_CHANCE = 0.10;
  const POWERUP_R = 14;
  const TURBO_MS = 2500;
  const GHOST_MS = 2500;
  const TRAIL_INTERVAL = 0.035;
  const COIN_R = 14;
  const BOX_CHANCE = 0.075;      // 3.14: slightly rarer early gifts (was 0.10)
  const BOX_CHANCE_LATE = 0.12;  // after score 40+

  const M_PER_PX = 0.08;
  const TIME_ATTACK_S = 60;
  const TRAFFIC_CHANCE = 0.018;
  const PERFECT_CENTER_PX = 14;
  const BOSS_EVERY_M = 180;
  const BOSS_MIN_S = 30;
  const BOSS_MAX_S = 60;

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
  let fogWisps = [];
  let weatherFlash = 0; // storm lightning alpha
  let camKickX = 0;
  let camKickY = 0;
  let camKickZoom = 0;
  let nearMissCamUntil = 0;
  let bossPulse = 0;
  let perfectRailFlash = 0; // 0–1 visual after PERFECT
  let practiceGhost = null; // {x,y,rot} for Practice mode guide



  let scorePops = [];
  let score = 0;
  let best = 0;
  let birdId = 'sparrow';
  let vehicleId = 'none';
  let envId = 'city';
  let weatherId = 'clear';
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
  // v3.2
  let runNearMisses = 0;
  let runPerfects = 0;
  let runBestCoinCombo = 0;
  let bossActive = false;
  let bossUntil = 0;
  let bossDurMs = 30000;
  let bossKind = null;
  let nextBossAt = BOSS_EVERY_M;
  let weatherDynId = null; // dynamic weather override during run
  let lastAreaMusic = null;
  let mysteryAdUsed = false;
  let nextWeatherAt = 90;
  let runStartTs = 0;
  let luckyCooldownUntil = 0;
  let mouthChirpUntil = 0; // visual mouth open (chirp) until ts
  let phaseSimple = true; // first ~10s / early classic: simple patterns

  const hud = document.getElementById('hud');
  const scoreEl = document.getElementById('score-display');
  const comboEl = document.getElementById('combo-display');
  const modeBadgeEl = document.getElementById('mode-badge');
  const powerHudEl = document.getElementById('power-hud');
  const livesHudEl = document.getElementById('lives-hud');
  const unlockTeaserEl = document.getElementById('unlock-teaser');
  const challengeStagePanel = document.getElementById('challenge-stage-panel');
  const challengeStageList = document.getElementById('challenge-stage-list');
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
  const btnShare = document.getElementById('btn-share');
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
  const btnVoicePreview = document.getElementById('btn-voice-preview');
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
  const runDistanceEl = document.getElementById('run-distance');
  const runNearMissEl = document.getElementById('run-nearmiss');
  const runComboEl = document.getElementById('run-combo');
  const runPerfectEl = document.getElementById('run-perfect');
  const newRecordBanner = document.getElementById('new-record-banner');
  const modeDeathValueEl = document.getElementById('mode-death-value');
  const btnDeathCollection = document.getElementById('btn-death-collection');
  const btnMysteryAd = document.getElementById('btn-mystery-ad');
  const mysteryOverlay = document.getElementById('mystery-overlay');
  const mysteryRarityEl = document.getElementById('mystery-rarity');
  const mysteryRewardEl = document.getElementById('mystery-reward');
  const btnMysteryOk = document.getElementById('btn-mystery-ok');
  const screenGifts = document.getElementById('screen-gifts');
  const btnGifts = document.getElementById('btn-gifts');
  const btnCollectionGifts = document.getElementById('btn-collection-gifts');
  const giftsCountEl = document.getElementById('gifts-count');
  const spinsCountEl = document.getElementById('spins-count');
  const spinWheelEl = document.getElementById('spin-wheel');
  const spinResultEl = document.getElementById('spin-result');
  const btnSpinOnce = document.getElementById('btn-spin-once');
  const btnSpinAll = document.getElementById('btn-spin-all');
  const runGiftsEl = document.getElementById('run-gifts');
  const screenGuide = document.getElementById('screen-guide');
  const btnGuide = document.getElementById('btn-guide');
  const spinUnlockOverlay = document.getElementById('spin-unlock-overlay');
  const btnSpinUnlockGo = document.getElementById('btn-spin-unlock-go');
  const btnSpinUnlockDismiss = document.getElementById('btn-spin-unlock-dismiss');
  let pendingSpinUnlockPopup = false;
  let spinUnlockShownThisUnlock = false;

  function showToast(msg, ms, kind) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.hidden = false;
    toastEl.classList.remove('toast-pop', 'toast-close', 'toast-lucky', 'toast-gift', 'toast-perfect', 'toast-medal');
    if (kind === 'close' || kind === 'lucky' || kind === 'gift' || kind === 'perfect' || kind === 'medal') {
      toastEl.classList.add('toast-' + kind);
    }
    void toastEl.offsetWidth;
    toastEl.classList.add('toast-pop');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function () {
      toastEl.hidden = true;
      toastEl.classList.remove('toast-close', 'toast-lucky', 'toast-gift', 'toast-perfect', 'toast-medal');
    }, ms || 1600);
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
    if (!FTAudio || typeof FTAudio.isVoicePack !== 'function') return;
    if (!FTAudio.isVoicePack()) return;
    if (FTAudio.unlock) FTAudio.unlock();
    var label = FTAudio.voice(id); // cooldown + variety inside audio.js
    // Toast only when a line actually played (empty = cooldown skip — no spam toast)
    if (label) showToast(label, 1100);
  }

  function voiceGiftCue() {
    if (!FTAudio || typeof FTAudio.isVoicePack !== 'function') return;
    if (!FTAudio.isVoicePack()) return;
    if (FTAudio.unlock) FTAudio.unlock();
    var label = '';
    if (typeof FTAudio.voiceGift === 'function') label = FTAudio.voiceGift();
    else label = FTAudio.voice('gift', { priority: true });
    if (label) showToast(label, 1100, 'gift');
  }

  /** When gifts cross a multiple of 10, unlock a spin — one-time popup (not on menu reopen). */
  function noteGiftAdd(n) {
    n = n | 0;
    if (n <= 0) return FTStorage.getGiftBoxes ? FTStorage.getGiftBoxes() : 0;
    var beforeSpins = FTStorage.getSpinCharges ? FTStorage.getSpinCharges() : 0;
    var total = FTStorage.addGiftBoxes(n);
    var afterSpins = FTStorage.getSpinCharges ? FTStorage.getSpinCharges() : 0;
    if (afterSpins > beforeSpins) {
      pendingSpinUnlockPopup = true;
      spinUnlockShownThisUnlock = false;
      if (state === 'playing') {
        showToast('🎰 Spin unlocked! · Mystery Box kholo', 1800);
      } else {
        maybeShowSpinUnlockPopup();
      }
    }
    return total;
  }

  function maybeShowSpinUnlockPopup() {
    if (!pendingSpinUnlockPopup || spinUnlockShownThisUnlock) return;
    if (!spinUnlockOverlay) return;
    // Don't interrupt active wheel spin overlay
    if (mysteryOverlay && !mysteryOverlay.hidden) return;
    spinUnlockShownThisUnlock = true;
    pendingSpinUnlockPopup = false;
    spinUnlockOverlay.hidden = false;
    spinUnlockOverlay.classList.remove('mystery-pop');
    void spinUnlockOverlay.offsetWidth;
    spinUnlockOverlay.classList.add('mystery-pop');
  }

  function dismissSpinUnlockPopup() {
    if (spinUnlockOverlay) spinUnlockOverlay.hidden = true;
  }

  /** For gifts already added in storage (missions/streak): infer unlock from delta. */
  function detectSpinUnlockFromDelta(giftsAdded) {
    giftsAdded = giftsAdded | 0;
    if (giftsAdded <= 0 || !FTStorage.getGiftBoxes) return;
    var g = FTStorage.getGiftBoxes();
    var after = Math.floor(g / 10);
    var before = Math.floor((g - giftsAdded) / 10);
    if (after > before) {
      pendingSpinUnlockPopup = true;
      spinUnlockShownThisUnlock = false;
      maybeShowSpinUnlockPopup();
    }
  }

  function haptic(kind) {
    if (!hapticsOn) return;
    try {
      if (!navigator.vibrate) return;
      if (kind === 'death') navigator.vibrate([40, 30, 80]);
      else if (kind === 'power') navigator.vibrate(18);
      else if (kind === 'gift') navigator.vibrate([12, 40, 18, 40, 28]);
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

  /** Classic / Daily / Practice (and mild modes) get forgiveness; Hard/Challenge/One Life do not. */
  function isForgivingMode() {
    return !isHard() && !isChallenge() && !isOneLife();
  }

  function runElapsedSec() {
    if (!runStartTs) return 0;
    return (performance.now() - runStartTs) / 1000;
  }

  /** First 5 competitive runs: extra-wide gaps, fewer vehicles, slower, earlier power-up (3.9 stronger). */
  function firstRunProtect() {
    if (!isForgivingMode()) return false;
    var rc = FTStorage.getRunCount();
    return rc <= 5;
  }

  /** Calibration from last 5 run durations (forgiving modes only). */
  function calibMods() {
    if (!isForgivingMode() || !FTStorage.getAvgRunDuration) return { gap: 1, speed: 1, traffic: 1, power: 1 };
    var avg = FTStorage.getAvgRunDuration();
    if (!avg || avg <= 0) return { gap: 1, speed: 1, traffic: 1, power: 1 };
    // 3.11: slightly stronger ease for struggling players; soft harden for long survivors
    if (avg < 18) return { gap: 1.24, speed: 0.84, traffic: 0.48, power: 1.50 }; // short → ease
    if (avg < 30) return { gap: 1.15, speed: 0.89, traffic: 0.68, power: 1.32 };
    if (avg > 80) return { gap: 0.95, speed: 1.06, traffic: 1.15, power: 0.92 }; // long → gently harden
    if (avg > 55) return { gap: 0.98, speed: 1.02, traffic: 1.06, power: 0.96 };
    return { gap: 1, speed: 1, traffic: 1, power: 1 };
  }

  /**
   * Classic curve by score + first-10s ease:
   * 0–10 Easy → 10–25 Easy+ → 25–45 Normal → 45–75 Difficult → 75+ Hard.
   * Hard Mode starts aggressive via modeSpeedMul/modeGapMul.
   */
  function classicPhaseMods(sc) {
    var t = runElapsedSec();
    var m = { gap: 1, speed: 1, spawn: 1, traffic: 1, simple: false, power: 1 };
    if (isHard()) {
      // Hard unchanged aggression (3.11 keeps Hard strict)
      m.gap = 0.95; m.speed = 1.02; m.spawn = 0.95; m.traffic = 1.15; m.simple = false;
      return m;
    }
    if (isChallenge() || isOneLife()) {
      m.simple = t < 8;
      if (t < 8) { m.gap = 1.08; m.speed = 0.94; m.spawn = 1.06; m.traffic = 0.7; }
      return m;
    }
    // First ~20s: slow, wide, simple (3.11 smoother Classic survival ramp)
    if (t < 20) {
      var ease = t < 12 ? 1 : (1 - (t - 12) / 16); // soft blend toward normal by ~20s
      m.gap = 1.26 + 0.14 * ease; m.speed = 0.76 - 0.08 * ease; m.spawn = 1.14 + 0.1 * ease;
      m.traffic = 0.10 + 0.18 * (1 - ease); m.simple = true; m.power = 1.38 + 0.15 * ease;
      phaseSimple = true;
      return m;
    }
    phaseSimple = false;
    if (sc < 10) { m.gap = 1.22; m.speed = 0.82; m.spawn = 1.14; m.traffic = 0.28; m.simple = true; m.power = 1.30; }
    else if (sc < 25) { m.gap = 1.14; m.speed = 0.88; m.spawn = 1.10; m.traffic = 0.46; m.simple = true; m.power = 1.18; }
    else if (sc < 45) { m.gap = 1.04; m.speed = 0.96; m.spawn = 1.04; m.traffic = 0.74; }
    else if (sc < 75) { m.gap = 0.97; m.speed = 1.04; m.spawn = 0.97; m.traffic = 1.00; }
    else { m.gap = 0.91; m.speed = 1.11; m.spawn = 0.91; m.traffic = 1.18; }
    return m;
  }

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
    if (isHard()) return 1.38; // Hard still tough, slightly less brutal (3.9)
    if (isChallenge()) {
      var st = CHALLENGE_STAGES[challengeStageIdx] || CHALLENGE_STAGES[0];
      return (st.speedMul || 1.05) * 0.97;
    }
    if (isOneLife()) return 1.08;
    return 1;
  }

  function modeGapMul() {
    if (isHard()) return 0.86;
    if (isChallenge()) {
      var st = CHALLENGE_STAGES[challengeStageIdx] || CHALLENGE_STAGES[0];
      return (st.gapMul || 1) * 1.04;
    }
    if (isOneLife()) return 0.97;
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
    var nRain = reduceMotion ? 18 : 48;
    for (var i = 0; i < nRain; i++) {
      rainDrops.push({
        x: Math.random() * W,
        y: Math.random() * H,
        len: 8 + Math.random() * 14,
        spd: 260 + Math.random() * 220,
        splash: 0
      });
    }
    fogWisps = [];
    var nFog = reduceMotion ? 6 : 14;
    for (var fi = 0; fi < nFog; fi++) {
      fogWisps.push({
        x: Math.random() * W,
        y: H * 0.35 + Math.random() * H * 0.4,
        w: 40 + Math.random() * 70,
        h: 12 + Math.random() * 18,
        spd: 12 + Math.random() * 22,
        a: 0.08 + Math.random() * 0.12
      });
    }
  }

  function difficultyFor(sc) {
    var sm = modeSpeedMul();
    var gm = modeGapMul();
    var turboMul = performance.now() < turboUntil ? 1.35 : 1;
    var wMul = weatherMul().speedMul || 1;
    if (bossActive) wMul *= 1.08;
    var phase = classicPhaseMods(sc);
    var cal = calibMods();
    var frGap = 1, frSpd = 1, frSpawn = 1;
    if (firstRunProtect()) {
      frGap = 1.28; frSpd = 0.80; frSpawn = 1.20;
    }
    var speed = (BASE_SPEED + sc * SPEED_PER_SCORE) * sm * turboMul * wMul * phase.speed * cal.speed * frSpd;
    var gap = (BASE_GAP - sc * GAP_SHRINK_PER) * gm * phase.gap * cal.gap * frGap;
    var spawn = (BASE_SPAWN - sc * SPAWN_SHRINK_PER) * phase.spawn * frSpawn;
    // Practice: always roomy
    if (isPractice()) { gap *= 1.28; speed *= 0.80; spawn *= 1.14; }
    // Daily: mildly forgiving like classic
    if (playMode === 'daily' && !isHard()) { gap *= 1.08; speed *= 0.93; }
    currentSpeed = Math.min(SPEED_CAP * (isHard() ? 1.25 : 1), speed);
    currentGap = Math.max(GAP_FLOOR * gm * (isHard() ? 0.95 : 1), gap);
    currentSpawn = Math.max(SPAWN_FLOOR, spawn);
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
    // Continuous ladder x1→x5; miss coin resets (elsewhere)
    var base = Math.min(5, Math.max(1, coinCombo));
    // Connect with near-miss streak + RISKY if present
    if (nearMissStreak >= 2) base = Math.min(5, base + 1);
    if (riskyActive()) base = Math.min(5, base + 1);
    return base;
  }

  function pipeComboMult() {
    var m = 1;
    if (combo >= 5) m = 2;
    if (performance.now() < riskyUntil) m *= 3;
    if (performance.now() < score2xUntil) m *= 2;
    return m;
  }

  function birdPass() {
    return FTSkins.birdPassive ? FTSkins.birdPassive(birdId) : { gravityMul: 1, flapMul: 1, coinMul: 1, nearMissBonus: 0, nightBonus: 0 };
  }

  function effectiveWeather() {
    if (weatherDynId) return weatherDynId;
    var area = activeArea();
    if (area === 'rain' || area === 'monsoon') return 'rain';
    if (area === 'night' || area === 'quetta') return 'night';
    return weatherId === 'sunny' ? 'clear' : weatherId;
  }

  function weatherMul() {
    var mods = FTSkins.weatherMods ? FTSkins.weatherMods(effectiveWeather()) : { speedMul: 1, visibility: 1 };
    return mods;
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
      comboEl.classList.toggle('combo-x3', ccm >= 3);
      comboEl.classList.toggle('combo-x5', ccm >= 5 || combo >= 5 || riskyActive());
      var bits = [];
      if (riskyActive()) bits.push('RISKY x3');
      else if (nearMissStreak >= 2) bits.push('CLOSE x' + nearMissStreak);
      if (combo >= 2) bits.push('PIPE ' + combo);
      if (ccm > 1) bits.push('COIN x' + ccm);
      else if (coinCombo >= 2) bits.push('COINS ' + coinCombo);
      comboEl.textContent = bits.join(' · ');
      comboEl.classList.toggle('combo-hot', ccm >= 5 || combo >= 5 || riskyActive());
    } else {
      comboEl.hidden = true;
    }
  }

  function powerRemainSec(until) {
    return Math.max(0, Math.ceil((until - performance.now()) / 1000));
  }
  function updatePowerHud() {
    if (!powerHudEl) return;
    var now = performance.now();
    var bits = [];
    if (shieldActive) bits.push({ t: '🛡 Shield', k: 'shield' });
    if (now < slowMoUntil) bits.push({ t: '⏱ ' + powerRemainSec(slowMoUntil) + 's', k: 'slowmo' });
    if (now < magnetUntil) bits.push({ t: '🧲 ' + powerRemainSec(magnetUntil) + 's', k: 'magnet' });
    if (now < turboUntil) bits.push({ t: '⚡ ' + powerRemainSec(turboUntil) + 's', k: 'turbo' });
    if (now < ghostUntil) bits.push({ t: '👻 ' + powerRemainSec(ghostUntil) + 's', k: 'ghost' });
    if (riskyActive()) bits.push({ t: '🎯x3', k: 'risky' });
    if (isHard()) bits.push({ t: '🔥', k: 'hard' });
    if (isNoCoin()) bits.push({ t: '🚫🪙', k: 'nocoin' });
    if (isOneLife()) bits.push({ t: '1️⃣', k: 'onelife' });
    if (bits.length) {
      powerHudEl.hidden = false;
      powerHudEl.innerHTML = '';
      bits.forEach(function (b) {
        var chip = document.createElement('span');
        chip.className = 'power-chip power-' + (b.k || 'generic');
        chip.textContent = b.t;
        powerHudEl.appendChild(chip);
      });
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
    if (isTimeAttack() && (state === 'playing' || state === 'dying' || state === 'paused')) {
      timerHudEl.hidden = false;
      var sec = Math.ceil(Math.max(0, timeLeft));
      var pace = runStartTs ? (score / Math.max(1, (TIME_ATTACK_S - timeLeft))) * 60 : 0;
      timerHudEl.innerHTML = '';
      var ring = document.createElement('span');
      ring.className = 'ta-ring';
      ring.setAttribute('aria-hidden', 'true');
      var pct = Math.max(0, Math.min(1, timeLeft / TIME_ATTACK_S));
      ring.style.setProperty('--ta', String(pct));
      var label = document.createElement('strong');
      label.className = 'ta-time';
      label.textContent = sec + 's';
      var sub = document.createElement('span');
      sub.className = 'ta-sub';
      sub.textContent = '⏱ ' + Math.round(pace) + '/min';
      timerHudEl.appendChild(ring);
      timerHudEl.appendChild(label);
      timerHudEl.appendChild(sub);
      timerHudEl.classList.toggle('timer-low', timeLeft <= 10);
      timerHudEl.classList.toggle('timer-critical', timeLeft <= 5);
      timerHudEl.classList.add('ta-hud');
    } else {
      timerHudEl.hidden = true;
      timerHudEl.classList.remove('ta-hud', 'timer-low', 'timer-critical');
    }
  }

  function updateLivesHud() {
    if (!livesHudEl) return;
    if (isOneLife() && (state === 'playing' || state === 'dying' || state === 'paused' || state === 'dead')) {
      livesHudEl.hidden = false;
      var lost = state === 'dying' || state === 'dead' || !bird || (bird && !bird.alive);
      livesHudEl.innerHTML = lost
        ? '<span class="life-heart life-lost">🖤</span><span class="life-label">Gone</span>'
        : '<span class="life-heart">❤️</span><span class="life-label">×1</span>';
      livesHudEl.classList.toggle('lives-lost', !!lost);
    } else {
      livesHudEl.hidden = true;
    }
  }

  function nextBirdUnlockTeaser() {
    if (!FTSkins || !FTSkins.BIRDS) return null;
    var coins = FTStorage.getCoins();
    var best = FTStorage.getBest();
    var bestCand = null;
    FTSkins.BIRDS.forEach(function (b) {
      if (!b || b.free || b.cost === 0) return;
      if (FTStorage.isBirdUnlocked && FTStorage.isBirdUnlocked(b.id)) return;
      var cost = b.cost || 0;
      var scoreOk = b.unlockScore && best >= b.unlockScore;
      var afford = coins >= cost || scoreOk;
      var need = afford ? 0 : Math.max(0, cost - coins);
      var cand = { bird: b, need: need, afford: afford, scoreOk: scoreOk };
      if (!bestCand || need < bestCand.need || (need === bestCand.need && cost < (bestCand.bird.cost || 0))) {
        bestCand = cand;
      }
    });
    return bestCand;
  }

  function updateUnlockTeaser() {
    if (!unlockTeaserEl) return;
    var t = nextBirdUnlockTeaser();
    if (!t) { unlockTeaserEl.hidden = true; unlockTeaserEl.textContent = ''; return; }
    unlockTeaserEl.hidden = false;
    if (t.afford) {
      unlockTeaserEl.textContent = '✨ Ready to unlock ' + t.bird.label + ' in Garage!';
      unlockTeaserEl.classList.add('teaser-ready');
    } else {
      unlockTeaserEl.textContent = '🔓 Next bird: ' + t.bird.label + ' · need ' + t.need + ' more 🪙';
      unlockTeaserEl.classList.remove('teaser-ready');
    }
  }

  function updateCoinHud() {
    if (coinHudEl) coinHudEl.textContent = '🪙 ' + FTStorage.getCoins();
    if (coinsStartEl) coinsStartEl.textContent = String(FTStorage.getCoins());
    if (garageCoinsEl) garageCoinsEl.textContent = String(FTStorage.getCoins());
    updateUnlockTeaser();
  }

  function cosmeticsOpts() {
    var sx = squash < 1 ? 1.14 : (squash > 1 ? 0.90 : 1);
    var sy = squash;
    var t = performance.now() / 1000;
    var now = performance.now();
    var wingFlap = 0;
    var wingLag = 0;
    var headTilt = 0;
    var headBob = 0;
    var mouthOpen = 0;
    var tailWag = 0;
    var eyeBlink = 0;
    var wheelRot = 0;
    var vehBob = 0;
    var vehLean = 0;
    var tipFlutter = 0;
    if (!reduceMotion) {
      var vy = (bird && typeof bird.vy === 'number') ? bird.vy : 0;
      var rising = Math.max(0, -vy / 380);
      var falling = Math.max(0, vy / 520);
      // Burst flap after tap + continuous flight — richer 3.11 independent wing phase
      var burst = (squash < 0.95) ? 1 : 0;
      var flapHz = 9.2 + rising * 15 + burst * 20;
      var flapAmp = 0.42 + rising * 0.78 + burst * 0.68;
      if (state === 'playing' || state === 'dying') {
        wingFlap = Math.sin(t * flapHz) * flapAmp;
        wingLag = Math.sin(t * flapHz - 0.55) * flapAmp * 0.92; // far wing lag
        tipFlutter = Math.sin(t * (flapHz * 2.4)) * (0.12 + rising * 0.18 + burst * 0.22);
        if (falling > 0.35 && burst === 0) {
          wingFlap *= 0.38;
          wingLag *= 0.5;
          tipFlutter *= 0.55;
        }
        headTilt = Math.max(-0.68, Math.min(0.72, vy / 400));
        headBob = Math.sin(t * 12) * (0.48 + rising * 0.9) + (burst ? Math.sin(t * 24) * 1.35 : 0);
        tailWag = Math.sin(t * 9.5) * (0.25 + falling * 0.55) + (burst ? 0.35 : 0) + vy / 900;
        vehLean = Math.max(-0.22, Math.min(0.22, vy / 900));
      } else {
        // Menu idle: gentle wing + head bob + occasional blink/mouth
        wingFlap = Math.sin(t * 6.5) * 0.36;
        wingLag = Math.sin(t * 6.5 - 0.7) * 0.30;
        tipFlutter = Math.sin(t * 14) * 0.08;
        headTilt = Math.sin(t * 2.4) * 0.16;
        headBob = Math.sin(t * 3.5) * 0.62;
        tailWag = Math.sin(t * 4.2) * 0.18;
        vehLean = Math.sin(t * 1.8) * 0.04;
      }
      // Eye blink every ~2.8s for ~0.12s
      var blinkCycle = (t % 2.85);
      eyeBlink = (blinkCycle > 2.72) ? Math.min(1, (blinkCycle - 2.72) / 0.06) : 0;
      if (blinkCycle > 2.78) eyeBlink = Math.max(0, 1 - (blinkCycle - 2.78) / 0.07);
      // Mouth open during chirp window (tap / near-miss / gift) + idle micro-chirp
      if (now < mouthChirpUntil) {
        var rem = (mouthChirpUntil - now) / 280;
        mouthOpen = Math.max(0, Math.min(1, rem > 0.55 ? 1 : rem * 1.6));
      } else if (burst) {
        mouthOpen = 0.42; // slight open on flap squash
      } else {
        var idleChirp = (t % 5.6);
        if (idleChirp > 5.2 && idleChirp < 5.45) mouthOpen = 0.22 * Math.sin((idleChirp - 5.2) / 0.25 * Math.PI);
      }
      wheelRot = t * (5.5 + (currentSpeed || 138) / 32);
      vehBob = Math.sin(t * 8.2) * 1.35 + Math.sin(t * 3.4) * 0.45 + (burst ? 1.1 : 0);
    }
    var vehTheme = null;
    if (birdId === 'jungle') vehTheme = 'jungle';
    else if (birdId === 'alpine') vehTheme = 'alpine';
    else if (birdId === 'seagull') vehTheme = 'sea';
    return {
      vehicle: vehicleId,
      hat: hatId,
      giant: false,
      squashX: reduceMotion ? 1 : sx,
      squashY: reduceMotion ? 1 : sy,
      wingFlap: wingFlap,
      wingLag: wingLag,
      tipFlutter: tipFlutter,
      headTilt: headTilt,
      headBob: headBob,
      mouthOpen: mouthOpen,
      tailWag: tailWag,
      eyeBlink: eyeBlink,
      animT: t,
      wheelRot: wheelRot,
      vehBob: vehBob,
      vehLean: vehLean,
      reduceMotion: reduceMotion,
      vehicleTheme: vehTheme
    };
  }

  /** Open beak briefly + optional chirp SFX (visual mouth; hitbox unchanged). */
  function triggerChirpMouth(kind) {
    mouthChirpUntil = performance.now() + (kind === 'gift' ? 420 : 280);
    if (FTAudio.chirp) FTAudio.chirp(kind || 'tap');
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
    var chance = POWERUP_CHANCE;
    var phase = classicPhaseMods(score);
    var cal = calibMods();
    chance *= (phase.power || 1) * (cal.power || 1);
    if (firstRunProtect()) chance *= 1.55; // earlier / more frequent power-up
    if (runElapsedSec() < 12 && isForgivingMode()) chance *= 1.35;
    if (rng() > chance) return;
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
    // 3.15: fewer early doubles, rare late triple
    var n = 1;
    if (score >= 12 && rng() < 0.42) n = 2;
    if (score >= 45 && rng() < 0.18) n = 3;
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
    // 3.14 balance: rarer early, ramp mid-run; skip if powerup already on this gap
    var chance = score >= 40 ? BOX_CHANCE_LATE : (score >= 15 ? 0.09 : BOX_CHANCE);
    if (isPractice()) chance *= 0.55;
    if (isTimeAttack()) chance *= 0.85;
    if (firstRunProtect()) chance *= 0.65;
    // avoid gift piled on top of a power-up in same gap
    for (var i = 0; i < powerups.length; i++) {
      if (powerups[i].pipeRef === pipe && !powerups[i].taken) chance *= 0.35;
    }
    if (rng() > chance) return;
    var gap = pipe.gap != null ? pipe.gap : currentGap;
    boxes.push({
      x: pipe.x + PIPE_W / 2,
      y: pipe.gapY + gap * (0.18 + rng() * 0.2),
      taken: false,
      pipeRef: pipe
    });
  }

  function makePipe(x, gap) {
    var g = gap == null ? currentGap : gap;
    var margin = 55;
    var maxTop = H - GROUND_H - g - margin;
    var gapY = margin + rng() * Math.max(10, maxTop - margin);
    var phase = classicPhaseMods(score);
    var kind;
    if (phase.simple || firstRunProtect()) {
      // Simple patterns: mostly pipes / soft props
      var simple = ['pipe', 'pipe', 'tiled', 'terracotta', 'signboard', 'tree', 'kite'];
      kind = simple[Math.floor(rng() * simple.length)];
    } else {
      kind = FTSkins.pickObstacleKind(rng, activeArea());
    }
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
    var phase = classicPhaseMods(score);
    var cal = calibMods();
    var chance = TRAFFIC_CHANCE * (phase.traffic || 1) * (cal.traffic || 1);
    if (firstRunProtect()) chance *= 0.4;
    if (phase.simple) chance *= 0.35; // almost no hard vehicle combos early
    if (rng() > chance) return;
    if (traffic.length >= (phase.simple ? 1 : 3)) return;
    // Early / simple: only light vehicles
    var kind;
    if (phase.simple || firstRunProtect()) {
      var light = ['bike', 'scooty', 'rickshaw', 'car'];
      kind = light[Math.floor(rng() * light.length)];
    } else {
      kind = FTSkins.pickTrafficKind(score, rng);
    }
    var dir = rng() < 0.5 ? 1 : -1;
    var dual = !phase.simple && !firstRunProtect() && score >= 28 && rng() < 0.16;
    if (isHard()) dual = score >= 12 && rng() < 0.28;
    var yBase = H - GROUND_H - 28 - rng() * 40;
    var speed = (90 + rng() * 80 + score * 1.2) * dir * (phase.simple ? 0.75 : 1);
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
    var txt = (typeof amount === 'string') ? amount : ('+' + amount);
    scorePops.push({
      text: txt,
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
    medalEl.className = 'medal medal-' + m + ' medal-pop';
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
      screenMissions, screenCollection, screenGifts, screenGuide, screenBoards, screenStreak];
  }

  var MODE_SHARE_LABELS = {
    classic: 'Classic', timeattack: 'Time Attack', hard: 'Hard', nocoin: 'No Coin',
    challenge: 'Challenge', onelife: 'One Life', daily: 'Daily', practice: 'Practice'
  };

  function buildShareText() {
    var n = score;
    var b = FTStorage.getBest();
    var modeLabel = MODE_SHARE_LABELS[playMode] || playMode;
    var m = medalFor(n);
    var medalBit = m ? (' · ' + m + ' medal') : '';
    var dist = Math.floor(metersFlown);
    var line = 'Urr Jaa! اڑ جا! — ' + n + ' pts (' + modeLabel + ')' + medalBit +
      ' · ' + dist + 'm · best ' + b;
    if (runPerfects) line += ' · ' + runPerfects + ' PERFECT';
    line += ' · https://offerpk.github.io/flappy-tap/';
    return line;
  }

  function openSharePreview() {
    var overlay = document.getElementById('share-preview');
    var body = document.getElementById('share-preview-body');
    var textEl = document.getElementById('share-preview-text');
    if (!overlay || !body) {
      shareRunSummary();
      return;
    }
    var m = medalFor(score);
    var modeLabel = MODE_SHARE_LABELS[playMode] || playMode;
    body.innerHTML = '';
    var title = document.createElement('div');
    title.className = 'share-card-title';
    title.textContent = 'Urr Jaa! · ' + modeLabel;
    var sc = document.createElement('div');
    sc.className = 'share-card-score';
    sc.textContent = String(score);
    var meta = document.createElement('div');
    meta.className = 'share-card-meta';
    meta.textContent = Math.floor(metersFlown) + 'm · Best ' + FTStorage.getBest() +
      (m ? ' · ' + m.toUpperCase() : '') +
      (runPerfects ? ' · ✨' + runPerfects : '');
    body.appendChild(title);
    body.appendChild(sc);
    body.appendChild(meta);
    if (textEl) textEl.textContent = buildShareText();
    overlay.hidden = false;
    overlay.classList.remove('share-pop');
    void overlay.offsetWidth;
    overlay.classList.add('share-pop');
  }

  function legacyCopyShare(text) {
    try {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    } catch (_) { /* ignore */ }
  }

  function copyShareText(text) {
    var done = function () { showToast('Copied share text'); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(function () {
        legacyCopyShare(text);
        done();
      });
      return;
    }
    legacyCopyShare(text);
    done();
  }

  function shareRunSummary() {
    var text = buildShareText();
    if (navigator.share) {
      navigator.share({ title: 'Urr Jaa!', text: text, url: 'https://offerpk.github.io/flappy-tap/' }).catch(function () {
        copyShareText(text);
      });
      return;
    }
    copyShareText(text);
  }

  var A2HS_SESSION_KEY = 'urrjaa:a2hs';

  function updateA2hsTip() {
    var a2hs = document.getElementById('a2hs');
    if (!a2hs) return;
    try {
      if (sessionStorage.getItem(A2HS_SESSION_KEY) === '1' || localStorage.getItem(A2HS_SESSION_KEY) === '1') {
        a2hs.hidden = true;
        return;
      }
    } catch (_) { /* private mode */ }
    // 3.13: show after a few runs so first visit stays clean
    var runs = FTStorage.getRunCount ? FTStorage.getRunCount() : 0;
    var show = screenStart && !screenStart.hidden && runs >= 2;
    a2hs.hidden = !show;
    if (show) a2hs.classList.add('a2hs-visible');
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
    updateA2hsTip();
    updateUnlockTeaser();
    updateLivesHud();
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

  function runGradeFor(sc, perfects, nears, secs) {
    var pts = (sc | 0) + (perfects | 0) * 4 + (nears | 0) * 2 + Math.min(40, Math.floor((secs || 0) / 3));
    if (pts >= 160) return { letter: 'S', tier: 's', tip: 'Shabaash — legendary flight!' };
    if (pts >= 100) return { letter: 'A', tier: 'a', tip: 'Wah ji — strong run' };
    if (pts >= 60) return { letter: 'B', tier: 'b', tip: 'Solid — keep chaining PERFECT' };
    if (pts >= 30) return { letter: 'C', tier: 'c', tip: 'Getting there — watch the edges' };
    if (pts >= 12) return { letter: 'D', tier: 'd', tip: 'Warm-up done — try again' };
    return { letter: 'E', tier: 'e', tip: 'Oye — flap again!' };
  }

  function showDeath() {
    state = 'dead';
    hideAllScreens();
    screenDeath.hidden = false;
    hud.hidden = true;
    // Calibration: last 5 run durations (forgiving modes only)
    if (runStartTs && isForgivingMode() && !isPractice() && FTStorage.pushRunDuration) {
      FTStorage.pushRunDuration((performance.now() - runStartTs) / 1000);
    }
    if (FTAudio.stopAreaMusic) FTAudio.stopAreaMusic();
    lastAreaMusic = null;
    bossActive = false;
    bossKind = null;
    if (finalScoreEl) finalScoreEl.textContent = String(score);
    if (runCoinsEl) runCoinsEl.textContent = String(runCoins);
    if (runDistanceEl) runDistanceEl.textContent = String(Math.floor(metersFlown));
    if (runNearMissEl) runNearMissEl.textContent = String(runNearMisses);
    if (runComboEl) runComboEl.textContent = String(Math.max(runBestCombo, runBestCoinCombo));
    if (runPerfectEl) runPerfectEl.textContent = String(runPerfects);
    if (modeDeathEl) modeDeathEl.textContent = 'Mode';
    if (modeDeathValueEl) {
      var labels = {
        classic: 'Classic', timeattack: 'Time Attack', hard: 'Hard', nocoin: 'No Coin',
        challenge: 'Challenge', onelife: 'One Life', daily: 'Daily', practice: 'Practice'
      };
      modeDeathValueEl.textContent = labels[playMode] || playMode;
    }
    var isRecord = persistScore();
    FTStorage.setBestPerfect(runPerfects);
    FTStorage.bumpNearMissTotal(runNearMisses);
    FTStorage.bumpPerfectTotal(runPerfects);
    updateBestUI();
    showMedalUI(score);
    if (newRecordBanner) newRecordBanner.hidden = !isRecord;
    if (isRecord) {
      FTAudio.record();
      voiceCue('shabaash');
      showToast('Shabaash! New record!', 2200, 'medal');
    } else {
      voiceCue('haye_oye');
    }
    if (btnContinue) {
      var allow = !isPractice() && !isChallenge() && !isOneLife() && !isTimeAttack();
      btnContinue.hidden = !allow;
      btnContinue.disabled = continuedThisRun || !allow || oneLifeLocked;
      btnContinue.classList.toggle('continue-used', !!continuedThisRun);
      btnContinue.classList.toggle('continue-ready', allow && !continuedThisRun && !oneLifeLocked);
      btnContinue.textContent = continuedThisRun ? '✓ Continue used this run' : '▶ Revive · Continue (Ad stub)';
      var contHint = document.getElementById('continue-hint');
      if (contHint) {
        contHint.hidden = !allow;
        contHint.textContent = continuedThisRun
          ? 'Revive already used — retry for a fresh run.'
          : 'Watch a short stub ad to revive at your score (once per run).';
      }
    }
    if (runGiftsEl) runGiftsEl.textContent = runBoxes > 0 ? ('+' + runBoxes) : '0';
    var flightSec = runStartTs ? Math.max(0, (performance.now() - runStartTs) / 1000) : 0;
    var runTimeEl = document.getElementById('run-time');
    if (runTimeEl) {
      var m = Math.floor(flightSec / 60);
      var sec = Math.floor(flightSec % 60);
      runTimeEl.textContent = m > 0 ? (m + 'm ' + sec + 's') : (sec + 's');
    }
    var gradeEl = document.getElementById('run-grade');
    if (gradeEl) {
      var g = runGradeFor(score, runPerfects, runNearMisses, flightSec);
      gradeEl.textContent = g.letter;
      gradeEl.className = 'run-grade grade-' + g.tier;
      gradeEl.title = g.tip;
    }
    if (btnMysteryAd) {
      btnMysteryAd.hidden = isPractice();
      btnMysteryAd.disabled = mysteryAdUsed;
      btnMysteryAd.textContent = mysteryAdUsed ? 'Gift claimed' : '🎁 +1 Gift (Ad)';
    }
    // One-time spin unlock popup at run end if threshold crossed mid-run
    if (pendingSpinUnlockPopup) {
      setTimeout(function () { maybeShowSpinUnlockPopup(); }, 700);
    }
    if (btnRetry) {
      btnRetry.textContent = isOneLife() ? 'HOME' : 'RETRY';
    }
    // Persist daily missions (today's 3 from pool)
    FTStorage.bumpMission('fly_m', Math.floor(metersFlown));
    FTStorage.bumpMission('coins', runCoins);
    FTStorage.bumpMission('coins50', runCoins);
    FTStorage.bumpMission('pipes', score);
    FTStorage.bumpMission('dodge20', score);
    FTStorage.bumpMission('boxes', runBoxes);
    FTStorage.bumpMission('gifts3', runBoxes);
    FTStorage.bumpMission('nearmiss3', runNearMisses);
    FTStorage.bumpMission('nearmiss8', runNearMisses);
    FTStorage.bumpMission('perfect5', runPerfects);
    FTStorage.setMissionMax('score100', score);
    FTStorage.setMissionMax('score70', score);
    FTStorage.setMissionMax('score40', score);
    FTStorage.setMissionMax('combo8', Math.max(runBestCombo, combo));
    FTStorage.setMissionMax('perfect5', runPerfects);
    if (!hitThisRun && cleanScorePeak >= 50) FTStorage.setMissionMax('clean50', cleanScorePeak);
    var unlocked = FTStorage.checkEnvMilestones(FTStorage.getBest());
    var themeNew = FTStorage.checkThemeSkinMilestones ? FTStorage.checkThemeSkinMilestones(FTStorage.getBest()) : [];
    var seasonalNew = FTStorage.checkSeasonalUnlocks ? FTStorage.checkSeasonalUnlocks(FTStorage.getBest()) : [];
    var allNew = unlocked.concat(themeNew || []).concat(seasonalNew || []);
    if (allNew.length) showToast('Unlocked: ' + allNew.join(', '), 2500);
  }

  function pauseGame() {
    if (state !== 'playing') return;
    state = 'paused';
    if (screenPause) screenPause.hidden = false;
    var pauseScore = document.getElementById('pause-score');
    var pauseMode = document.getElementById('pause-mode');
    var pauseTip = document.getElementById('pause-tip');
    if (pauseScore) pauseScore.textContent = String(score);
    if (pauseMode) {
      var labels = {
        classic: 'Classic', timeattack: 'Time Attack', hard: 'Hard', nocoin: 'No Coin',
        challenge: 'Challenge', onelife: 'One Life', daily: 'Daily', practice: 'Practice'
      };
      pauseMode.textContent = labels[playMode] || playMode;
    }
    if (pauseTip) {
      var tips = [
        'Center the gap for PERFECT (+3).',
        'Edge graze = CLOSE — stacks coin mult.',
        'Gifts 📦 → Mystery spins (10 = 1 spin).',
        'Shield saves one hard hit.',
        'Classic is forgiving; Hard is not.',
        'Combo x5+ drops confetti — keep chaining!'
      ];
      pauseTip.textContent = tips[Math.floor(Math.random() * tips.length)];
    }
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
    updateLivesHud();
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
      runBestCoinCombo = 0;
      runNearMisses = 0;
      runPerfects = 0;
      bossActive = false;
      bossUntil = 0;
      bossKind = null;
      nextBossAt = BOSS_EVERY_M;
      weatherDynId = null;
      mysteryAdUsed = false;
      nextWeatherAt = 90;
      runStartTs = performance.now();
      luckyCooldownUntil = 0;
      mouthChirpUntil = 0;
      phaseSimple = true;
      setScore(0);
      resetBird();
      resetPipes();
      groundX = 0;
      if (isChallenge()) {
        var st = CHALLENGE_STAGES[challengeStageIdx];
        showToast(st.label + ' · score ' + st.target, 2000);
        setTimeout(function () { voiceCue('kya_udaan'); }, 400);
      } else if (isOneLife()) {
        showToast('One Life · no continue!', 1800);
        voiceCue('kya_udaan');
      } else {
        if (firstRunProtect()) showToast('Easy start · learn the flap!', 1600);
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
      bossActive = false;
      bossUntil = 0;
      bossKind = null;
    }
    var hb = FTSkins.hitbox(birdId, cosmeticsOpts());
    bird.w = hb.w;
    bird.h = hb.h;
    updateComboUI();
    updatePowerHud();
    updateCoinHud();
    if (!animId) loop(performance.now());
  }

  function spawnFlapFeathers() {
    if (!bird || reduceMotion) return;
    var n = 3;
    var cols = ['#fff', '#ffd93d', '#c4a35a', '#8b6914'];
    for (var i = 0; i < n; i++) {
      particles.push({
        x: bird.x - 6 + (Math.random() - 0.5) * 10,
        y: bird.y + (Math.random() - 0.5) * 8,
        vx: -30 - Math.random() * 40,
        vy: -20 - Math.random() * 50,
        life: 0.28, max: 0.4,
        color: cols[i % cols.length],
        r: 1.6 + Math.random() * 1.4,
        kind: 'spark'
      });
    }
    trimParticles();
  }

  function flap() {
    var sens = sensitivity;
    var pass = birdPass();
    var impulse = FLAP_IMPULSE * sens * (pass.flapMul || 1);
    if (state === 'menu') {
      startRun(false, 'classic');
      bird.vy = FLAP_IMPULSE * sens;
      flapCooldown = FLAP_COOLDOWN;
      squashTarget = 0.72;
      FTAudio.flap();
      triggerChirpMouth('tap');
      spawnFlapFeathers();
      return;
    }
    if (state !== 'playing' || !bird || !bird.alive) return;
    if (flapCooldown > 0) return;
    bird.vy = impulse;
    flapCooldown = FLAP_COOLDOWN;
    squashTarget = 0.68;
    FTAudio.flap();
    triggerChirpMouth('tap');
    spawnFlapFeathers();
  }

  function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }

  function ghostActive() { return performance.now() < ghostUntil; }

  /**
   * Collision with forgiveness (3.9 more relaxed on Classic/Daily/Practice):
   * - Hitbox already ~22–28% smaller than sprite (body only; wings/hats/mouth ignored)
   * - Extra inset + wider obstacle corner tolerance
   * - Returns: false | 'hard' | 'soft' (soft → LUCKY on forgiving modes)
   */
  function checkCollision() {
    if (ghostActive()) return false;
    var halfW = bird.w / 2;
    var halfH = bird.h / 2;
    var left = bird.x - halfW;
    var top = bird.y - halfH;
    var cornerTol = CORNER_TOL;
    if (isForgivingMode()) {
      if (firstRunProtect()) cornerTol = CORNER_TOL + 8;
      else cornerTol = CORNER_TOL + 4; // 3.11: more Classic corner grace
    } else {
      cornerTol = Math.max(10, CORNER_TOL - 5); // Hard/Challenge/OneLife stay strict
    }
    // Ground / ceiling — soft near-edge on forgiving modes
    var groundY = H - GROUND_H;
    if (bird.y + halfH >= groundY) {
      var overG = bird.y + halfH - groundY;
      if (isForgivingMode() && overG < cornerTol * 0.85) return 'soft';
      return 'hard';
    }
    if (bird.y - halfH <= 0) {
      var overC = halfH - bird.y;
      if (isForgivingMode() && overC < cornerTol * 0.85) return 'soft';
      return 'hard';
    }
    var insetMul = isForgivingMode() ? 0.82 : 0.48; // 3.11: Classic softer body inset
    var inset = Math.max(4, Math.round(Math.min(bird.w, bird.h) * HITBOX_INSET * insetMul));
    var bx = left + inset, by0 = top + inset, bw = bird.w - inset * 2, bh = bird.h - inset * 2;
    var softHit = false;
    for (var i = 0; i < pipes.length; i++) {
      var p = pipes[i];
      var gap = p.gap != null ? p.gap : currentGap;
      var pw = p.w || PIPE_W;
      // Top pipe
      if (rectsOverlap(bx, by0, bw, bh, p.x, 0, pw, p.gapY)) {
        var penTop = (by0 + bh) - p.gapY; // how far into the pipe edge
        var cornerX = Math.min(Math.abs((bx + bw) - p.x), Math.abs(bx - (p.x + pw)));
        if (isForgivingMode() && penTop > 0 && penTop <= cornerTol && cornerX <= cornerTol + 10) softHit = true;
        else return 'hard';
      }
      var botY = p.gapY + gap;
      if (rectsOverlap(bx, by0, bw, bh, p.x, botY, pw, groundY - botY)) {
        var penBot = botY - by0;
        var cornerXb = Math.min(Math.abs((bx + bw) - p.x), Math.abs(bx - (p.x + pw)));
        if (isForgivingMode() && penBot > 0 && penBot <= cornerTol && cornerXb <= cornerTol + 10) softHit = true;
        else return 'hard';
      }
    }
    for (var j = 0; j < traffic.length; j++) {
      var tv = traffic[j];
      var thb = FTSkins.trafficHitbox(tv);
      var tw = thb.w * (isForgivingMode() ? 0.82 : 0.88), th = thb.h * (isForgivingMode() ? 0.82 : 0.88);
      var tx = tv.x - tw / 2, ty = tv.y - th / 2;
      if (rectsOverlap(bx, by0, bw, bh, tx, ty, tw, th)) {
        if (isForgivingMode() && !tv.boss) {
          // Shallow graze only → soft; deep overlap → hard
          var overlapX = Math.min(bx + bw, tx + tw) - Math.max(bx, tx);
          var overlapY = Math.min(by0 + bh, ty + th) - Math.max(by0, ty);
          if (overlapX <= cornerTol + 8 || overlapY <= cornerTol + 6) softHit = true;
          else return 'hard';
        } else return 'hard';
      }
    }
    return softHit ? 'soft' : false;
  }

  function applyLuckySave() {
    luckyCooldownUntil = performance.now() + LUCKY_COOLDOWN_MS;
    hitFlash = 0.35;
    // Nudge bird toward nearest gap center
    var nearest = null, bestDx = 1e9;
    for (var i = 0; i < pipes.length; i++) {
      var dx = Math.abs(pipes[i].x + PIPE_W / 2 - bird.x);
      if (dx < bestDx) { bestDx = dx; nearest = pipes[i]; }
    }
    if (nearest) {
      var g = nearest.gap != null ? nearest.gap : currentGap;
      var cy = nearest.gapY + g / 2;
      bird.y += (cy - bird.y) * 0.58; // 3.11: stronger center recover
      if (bird.vy > 80) bird.vy *= 0.28;
      if (bird.vy < -120) bird.vy *= 0.42;
    } else {
      if (bird.y + bird.h / 2 >= H - GROUND_H) bird.y = H - GROUND_H - bird.h / 2 - 4;
      if (bird.y - bird.h / 2 <= 0) bird.y = bird.h / 2 + 4;
      bird.vy *= 0.4;
    }
    if (FTAudio.lucky) FTAudio.lucky();
    else FTAudio.nearmiss();
    showBanner('LUCKY!', 750);
    showToast('LUCKY!', 1000, 'lucky');
    triggerChirpMouth('close');
    voiceCue('lucky');
    haptic('nearmiss');
  }

  function resolveCollision() {
    var hit = checkCollision();
    if (!hit) return;
    if (hit === 'soft' && isForgivingMode()) {
      if (performance.now() >= luckyCooldownUntil) {
        applyLuckySave();
      } else {
        // Still in soft zone on cooldown: micro-nudge, no death (forgiveness holds)
        if (bird.y + bird.h / 2 > H - GROUND_H - 2) bird.y -= 2;
        if (bird.y - bird.h / 2 < 2) bird.y += 2;
        bird.vy *= 0.92;
      }
      return;
    }
    beginDeath();
  }

  var MAX_PARTICLES = 96;
  function particleBudget() {
    if (reduceMotion) return 28;
    // Mobile / low DPR: tighter budget (3.12 perf)
    var dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
    var narrow = (typeof window !== 'undefined' && window.innerWidth < 480);
    if (narrow || dpr > 2.5) return 56;
    return MAX_PARTICLES;
  }

  function trimParticles() {
    var cap = particleBudget();
    if (particles.length > cap) particles.splice(0, particles.length - cap);
  }

  function spawnNearMissSparks(x, y) {
    var n = reduceMotion ? 3 : 16;
    for (var i = 0; i < n; i++) {
      var a = (Math.PI * 2 * i) / n + rng() * 0.25;
      var sp = 55 + rng() * 120;
      particles.push({
        x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        life: 0.42, max: 0.7, color: i % 3 === 0 ? '#ff6b6b' : (i % 2 ? '#ffd93d' : '#fff'),
        r: 2.2 + rng() * 2.8, kind: 'spark'
      });
    }
    // ring pop for clearer CLOSE feedback
    if (!reduceMotion) {
      particles.push({ x: x, y: y, vx: 0, vy: 0, life: 0.28, max: 0.28, color: 'rgba(255,217,61,.55)', r: 10, kind: 'ring', grow: 38 });
    }
    trimParticles();
  }

  function spawnPerfectStars(x, y) {
    if (reduceMotion) return;
    var cols = ['#ffd93d', '#fff', '#7dd3fc', '#f9a8d4', '#86efac'];
    for (var i = 0; i < 10; i++) {
      var a = (Math.PI * 2 * i) / 10 + rng() * 0.2;
      var sp = 40 + rng() * 90;
      particles.push({
        x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40,
        life: 0.55, max: 0.75, color: cols[i % cols.length],
        r: 3.2 + rng() * 2.2, kind: 'star', rot: rng() * Math.PI
      });
    }
    particles.push({ x: x, y: y, vx: 0, vy: 0, life: 0.3, max: 0.3, color: 'rgba(125,211,252,.55)', r: 8, kind: 'ring', grow: 42 });
    trimParticles();
  }

  function spawnConfettiBurst(x, y, n) {
    if (reduceMotion) return;
    var cols = ['#ff6b6b', '#ffd93d', '#4ecdc4', '#c084fc', '#60a5fa', '#f472b6'];
    n = n || 18;
    for (var i = 0; i < n; i++) {
      particles.push({
        x: x, y: y,
        vx: (rng() - 0.5) * 220,
        vy: -60 - rng() * 160,
        life: 0.7 + rng() * 0.4, max: 1.1,
        color: cols[i % cols.length],
        r: 2.2 + rng() * 2.4,
        kind: 'confetti',
        rot: rng() * Math.PI,
        spin: (rng() - 0.5) * 14
      });
    }
    trimParticles();
  }

  function spawnCoinPop(x, y) {
    var n = reduceMotion ? 4 : 14;
    for (var i = 0; i < n; i++) {
      var a = (Math.PI * 2 * i) / n + rng() * 0.2;
      particles.push({
        x: x, y: y, vx: Math.cos(a) * (70 + rng() * 45), vy: Math.sin(a) * (70 + rng() * 45) - 50,
        life: 0.48, max: 0.6, color: i % 2 ? '#ffd93d' : '#fff3bf', r: 2.4 + rng() * 1.4, kind: 'coin'
      });
    }
    trimParticles();
  }

  function spawnGiftPop(x, y) {
    var n = reduceMotion ? 5 : 18;
    var cols = ['#c084fc', '#ffd93d', '#ff6b6b', '#fff'];
    for (var i = 0; i < n; i++) {
      var a = (Math.PI * 2 * i) / n + rng() * 0.2;
      var sp = 70 + rng() * 90;
      particles.push({
        x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 30,
        life: 0.55, max: 0.7, color: cols[i % cols.length], r: 2.6 + rng() * 2.2, kind: 'gift'
      });
    }
    if (!reduceMotion) {
      particles.push({ x: x, y: y, vx: 0, vy: 0, life: 0.32, max: 0.32, color: 'rgba(192,132,252,.5)', r: 8, kind: 'ring', grow: 34 });
    }
    trimParticles();
  }

  function spawnTrailParticle() {
    if (!bird || reduceMotion || trailId === 'none') return;
    var colors = {
      spark: '#ffd93d', smoke: '#94a3b8', stars: '#a78bfa', star: '#fbbf24',
      fire: '#ff6b35', rainbow: null,
      ind_trail: '#006600', eid_trail: '#f1c40f', winter_trail: '#ebf5fb', basant_trail: '#e74c3c'
    };
    var color = colors[trailId] || '#ffd93d';
    if (trailId === 'rainbow') {
      var rainbow = ['#ff6b6b', '#ffd93d', '#2ecc71', '#3498db', '#9b59b6'];
      color = rainbow[Math.floor(Math.random() * rainbow.length)];
    }
    if (trailId === 'fire') color = Math.random() < 0.5 ? '#ff6b35' : '#ffd93d';
    if (trailId === 'ind_trail') color = Math.random() < 0.5 ? '#006600' : '#ffffff';
    if (trailId === 'eid_trail') color = Math.random() < 0.5 ? '#f1c40f' : '#ffffff';
    if (trailId === 'winter_trail') color = Math.random() < 0.5 ? '#ebf5fb' : '#aed6f1';
    if (trailId === 'basant_trail') {
      var kite = ['#e74c3c', '#f1c40f', '#3498db', '#2ecc71'];
      color = kite[Math.floor(Math.random() * kite.length)];
    }
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

  function spawnPowerPickupFX(x, y, type) {
    if (reduceMotion) return;
    var cols = {
      shield: ['#7dd3fc', '#38bdf8', '#fff'],
      slowmo: ['#c4b5fd', '#a78bfa', '#fff'],
      turbo: ['#fbbf24', '#f59e0b', '#fff'],
      magnet: ['#f9a8d4', '#ec4899', '#fff'],
      ghost: ['#e2e8f0', '#94a3b8', '#fff']
    };
    var c = cols[type] || ['#ffd93d', '#fff'];
    for (var i = 0; i < 12; i++) {
      var a = (Math.PI * 2 * i) / 12;
      particles.push({
        x: x, y: y, vx: Math.cos(a) * (50 + rng() * 60), vy: Math.sin(a) * (50 + rng() * 60) - 20,
        life: 0.4, max: 0.55, color: c[i % c.length], r: 2.2 + rng() * 1.8, kind: 'spark'
      });
    }
    particles.push({ x: x, y: y, vx: 0, vy: 0, life: 0.28, max: 0.28, color: c[0], r: 8, kind: 'ring', grow: 36 });
    trimParticles();
  }

  function collectPowerup(pu) {
    pu.taken = true;
    FTAudio.powerup();
    haptic('power');
    var now = performance.now();
    var labels = {
      shield: '🛡 Shield ON',
      slowmo: '⏱ Slow-mo 3s',
      magnet: '🧲 Coin Magnet',
      turbo: '⚡ Turbo!',
      ghost: '👻 Ghost phase'
    };
    spawnPowerPickupFX(pu.x, pu.y, pu.type);
    if (pu.type === 'shield') { shieldActive = true; showToast(labels.shield, 1200, 'lucky'); voiceCue('wah_ji'); }
    else if (pu.type === 'slowmo') { slowMoUntil = now + SLOWMO_MS; showToast(labels.slowmo, 1200); }
    else if (pu.type === 'magnet') { magnetUntil = now + 4000; showToast(labels.magnet, 1200); }
    else if (pu.type === 'turbo') { turboUntil = now + TURBO_MS; FTAudio.turbo(); showToast(labels.turbo, 1200, 'medal'); showBanner('TURBO!', 800); }
    else if (pu.type === 'ghost') { ghostUntil = now + GHOST_MS; FTAudio.ghost(); showToast(labels.ghost, 1200); }
    showBanner(labels[pu.type] || 'Power!', 700);
    updatePowerHud();
    updateComboUI();
  }

  function coinEconomyScale() {
    // 3.15: softer early economy, reward longer runs
    if (score < 12) return 0.85;
    if (score < 30) return 1.0;
    if (score >= 60) return 1.2;
    return 1.1;
  }

  function collectCoin(c) {
    c.taken = true;
    coinCombo += 1;
    runBestCoinCombo = Math.max(runBestCoinCombo, coinCombo);
    runBestCombo = Math.max(runBestCombo, coinCombo);
    var mult = coinComboMult();
    var pass = birdPass();
    var gained = Math.max(1, Math.round(mult * (pass.coinMul || 1) * coinEconomyScale()));
    // Owl night bonus
    var w = effectiveWeather();
    if (pass.nightBonus && (w === 'night' || activeArea() === 'night' || activeArea() === 'quetta')) {
      gained = Math.max(1, Math.round(gained * (1 + pass.nightBonus)));
    }
    runCoins += gained;
    FTStorage.addCoins(gained);
    if (FTAudio.coin) FTAudio.coin(); else FTAudio.score();
    haptic('coin');
    spawnCoinPop(c.x, c.y);
    popScore(gained, c.x, c.y - 10);
    if (mult >= 5) {
      FTAudio.combo();
      showBanner('COIN x' + mult + '!', 900);
      voiceCue('wah_ji');
      setScore(score + Math.floor(mult / 2));
    } else if (mult >= 3) {
      showBanner('COIN x' + mult, 700);
    }
    updateComboUI();
    updateCoinHud();
  }

  /** Show spin/gift result modal — ONLY when user spins from Gifts screen (never auto after death). */
  function showMysteryResult(title, text) {
    if (mysteryOverlay && mysteryRarityEl && mysteryRewardEl) {
      mysteryRarityEl.textContent = title || 'SPIN!';
      mysteryRarityEl.className = 'mystery-rarity rarity-rare';
      mysteryRewardEl.textContent = text;
      mysteryOverlay.hidden = false;
      mysteryOverlay.classList.remove('mystery-pop');
      void mysteryOverlay.offsetWidth;
      mysteryOverlay.classList.add('mystery-pop');
    } else {
      showToast((title || '') + ' ' + text, 2200);
    }
  }

  /** v3.4+: mystery rewards add gifts to inventory — no rarity/duplicate popup. */
  function grantMysteryReward(rngFn) {
    if (FTAudio.mystery) FTAudio.mystery();
    haptic('power');
    noteGiftAdd(1);
    voiceGiftCue();
    if (bird) spawnGiftPop(bird.x, bird.y);
    showToast('📦 → Mystery Rewards', 1300, 'gift');
    updateCoinHud();
    return { gifts: 1, text: '+1 Gift' };
  }

  function openMysteryBox(box) {
    box.taken = true;
    runBoxes += 1;
    FTAudio.powerup();
    if (FTAudio.mystery) FTAudio.mystery();
    haptic('gift');
    triggerChirpMouth('gift');
    noteGiftAdd(1);
    voiceGiftCue();
    spawnGiftPop(box.x, box.y);
    showToast('📦 → Mystery Rewards', 1200, 'gift');
    popScore('📦', box.x, box.y - 10);
  }

  function refreshGiftsUI() {
    var g = FTStorage.getGiftBoxes ? FTStorage.getGiftBoxes() : 0;
    var s = FTStorage.getSpinCharges ? FTStorage.getSpinCharges() : 0;
    var per = (FTStorage.GIFTS_PER_SPIN || 10);
    var toward = g % per;
    if (giftsCountEl) giftsCountEl.textContent = String(g);
    if (spinsCountEl) spinsCountEl.textContent = String(s);
    var prog = document.getElementById('gift-progress');
    var fill = document.getElementById('gift-progress-fill');
    var ptxt = document.getElementById('gift-progress-text');
    if (prog && fill && ptxt) {
      var shown = s > 0 && toward === 0 ? per : toward;
      var pct = Math.max(0, Math.min(100, (shown / per) * 100));
      fill.style.width = pct + '%';
      prog.setAttribute('aria-valuenow', String(shown));
      ptxt.textContent = s > 0
        ? (shown + ' / ' + per + ' · ' + s + ' spin' + (s === 1 ? '' : 's') + ' ready')
        : (shown + ' / ' + per + ' to next spin');
    }
    var busy = !!wheelSpinning || !!spinQueueActive;
    if (btnSpinOnce) {
      btnSpinOnce.disabled = busy || s < 1;
      btnSpinOnce.textContent = s < 1 ? ('Need ' + (per - toward) + ' more 🎁') : 'Spin once (10 🎁)';
    }
    if (btnSpinAll) {
      btnSpinAll.disabled = busy || s < 1;
      btnSpinAll.textContent = s > 1 ? ('Spin all (' + s + ')') : 'Spin all';
    }
    refreshSpinHistoryUI();
  }

  function formatSpinAgo(ts) {
    ts = ts | 0;
    if (!ts) return '';
    var sec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
    if (sec < 45) return 'just now';
    if (sec < 3600) return Math.floor(sec / 60) + 'm ago';
    if (sec < 86400) return Math.floor(sec / 3600) + 'h ago';
    if (sec < 86400 * 7) return Math.floor(sec / 86400) + 'd ago';
    try {
      return new Date(ts).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (err) {
      return '';
    }
  }

  function spinRarityClass(coins) {
    var c = coins | 0;
    if (c >= 999) return 'rarity-jackpot';
    if (c >= 888) return 'rarity-legendary';
    if (c >= 777) return 'rarity-epic';
    if (c >= 666) return 'rarity-rare';
    if (c >= 555) return 'rarity-uncommon';
    return 'rarity-common';
  }
  function spinRarityLabel(coins) {
    var c = coins | 0;
    if (c >= 999) return 'JACKPOT';
    if (c >= 888) return 'LEGENDARY';
    if (c >= 777) return 'EPIC';
    if (c >= 666) return 'RARE';
    if (c >= 555) return 'NICE';
    return 'WIN';
  }

  function refreshSpinHistoryUI() {
    var list = document.getElementById('spin-history-list');
    var totalEl = document.getElementById('spin-history-total');
    var countEl = document.getElementById('spin-history-count');
    var hist = FTStorage.getSpinHistory ? FTStorage.getSpinHistory() : [];
    var total = FTStorage.getSpinHistoryTotal ? FTStorage.getSpinHistoryTotal() : 0;
    if (totalEl) totalEl.textContent = total > 0 ? (total.toLocaleString() + ' 🪙 won') : 'No wins yet';
    if (countEl) countEl.textContent = hist.length ? (hist.length + ' spin' + (hist.length === 1 ? '' : 's')) : '';
    if (!list) return;
    list.innerHTML = '';
    if (!hist.length) {
      var empty = document.createElement('li');
      empty.className = 'spin-history-empty';
      empty.innerHTML = '<span class="spin-empty-ico" aria-hidden="true">🎰</span><span>No spins yet — collect <strong>10 🎁</strong> to spin!</span>';
      list.appendChild(empty);
      return;
    }
    hist.slice(0, 20).forEach(function (entry, i) {
      var li = document.createElement('li');
      var coins = entry.coins | 0;
      li.className = 'spin-history-item ' + spinRarityClass(coins) + (i === 0 ? ' latest' : '');
      var left = document.createElement('div');
      left.className = 'spin-hist-left';
      var amt = document.createElement('strong');
      amt.className = 'spin-hist-coins';
      amt.textContent = '+' + coins + ' 🪙';
      var badge = document.createElement('span');
      badge.className = 'spin-hist-badge';
      badge.textContent = spinRarityLabel(coins);
      left.appendChild(amt);
      left.appendChild(badge);
      var meta = document.createElement('span');
      meta.className = 'spin-hist-meta';
      var order = (entry.n | 0) ? ('#' + (entry.n | 0)) : ('#' + (hist.length - i));
      var ago = formatSpinAgo(entry.ts | 0);
      meta.textContent = order + (ago ? ' · ' + ago : '');
      li.appendChild(left);
      li.appendChild(meta);
      list.appendChild(li);
    });
  }

  function openGiftsScreen() {
    hideAllScreens();
    if (screenGifts) screenGifts.hidden = false;
    // Don't cancel mid-spin if returning during spin-all queue; only clean idle
    if (!wheelSpinning && !spinQueueActive) {
      cancelWheelAnim();
      if (spinWheelEl) {
        spinWheelEl.style.transform = 'rotate(' + wheelAngle + 'deg) translateZ(0)';
        spinWheelEl.style.webkitTransform = 'rotate(' + wheelAngle + 'deg) translateZ(0)';
      }
    }
    refreshGiftsUI();
    if (spinResultEl && !wheelSpinning) {
      spinResultEl.classList.remove('win-flash');
      spinResultEl.textContent = 'Tap Spin — land on 444 · 555 · 666 · 777 · 888 · 999';
    }
    var wrap = document.getElementById('wheel-wrap');
    if (wrap && !wheelSpinning) { wrap.classList.remove('wheel-spinning', 'wheel-win'); }
  }

  var wheelSpinning = false;
  var spinQueueActive = false;
  var pendingUngrantedSpin = null; // {coins} spent but not granted — refund on abort
  var wheelAngle = 0;
  var wheelWrapEl = document.getElementById('wheel-wrap');

  function setSpinButtonsBusy(busy) {
    var s = FTStorage.getSpinCharges ? FTStorage.getSpinCharges() : 0;
    var lock = busy || !!wheelSpinning || !!spinQueueActive;
    if (btnSpinOnce) btnSpinOnce.disabled = lock || s < 1;
    if (btnSpinAll) btnSpinAll.disabled = lock || s < 1;
    // 3.15: Close (X) always available; mid-spin abort refunds gift charge
    document.querySelectorAll('[data-close="gifts"], [data-panel-close="gifts"]').forEach(function (b) {
      b.disabled = false;
      if (lock) b.setAttribute('title', 'Close (keeps spin charge if mid-spin)');
      else b.removeAttribute('title');
      b.removeAttribute('aria-busy');
    });
  }

  function abortPendingSpinKeepCharge() {
    if (!wheelSpinning && !spinQueueActive && !pendingUngrantedSpin) {
      cancelWheelAnim();
      return false;
    }
    cancelWheelAnim();
    wheelSpinning = false;
    spinQueueActive = false;
    if (pendingUngrantedSpin) {
      var per = (FTStorage.GIFTS_PER_SPIN || 10);
      if (FTStorage.addGiftBoxes) FTStorage.addGiftBoxes(per);
      pendingUngrantedSpin = null;
      showToast('Spin cancelled · charge kept', 1400, 'lucky');
    }
    if (wheelWrapEl) wheelWrapEl.classList.remove('wheel-spinning', 'wheel-win');
    setSpinButtonsBusy(false);
    refreshGiftsUI();
    return true;
  }

  /** Full dramatic spin duration for Spin once (~7s). Reduce-motion stays near-instant. */
  var SPIN_ONCE_MS = 7000;
  /** Spin-all sequential: short when many, full 7s when only one charge. */
  function spinAllDurationMs(remaining, planned) {
    if (planned <= 1) return SPIN_ONCE_MS;
    if (planned <= 3) return 3200;
    return 1800;
  }

  /**
   * Animate wheel so `coins` segment lands under the top pointer.
   * ROOT-CAUSE FIX (3.10): CSS transition on #spin-wheel was unreliable —
   * `.wheel-spinning .spin-wheel { filter:… }` forced a new compositor layer
   * mid-transition, and `html.reduce-motion .spin-wheel { transition:none !important }`
   * could kill it. Drive rotation with requestAnimationFrame + ease-out instead
   * so Spin once always shows continuous rotation (~7s) then decelerates into the segment.
   */
  var wheelAnimRaf = 0;
  function cancelWheelAnim() {
    if (wheelAnimRaf) {
      cancelAnimationFrame(wheelAnimRaf);
      wheelAnimRaf = 0;
    }
  }
  function wheelEaseOut(t) {
    // Fast start, long decelerate into the winning segment (easeOutQuint)
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    var u = 1 - t;
    return 1 - u * u * u * u * u;
  }
  function animateWheelTo(coins, done, durationMs) {
    if (!spinWheelEl) { if (done) done(); return; }
    cancelWheelAnim();
    var rewards = (FTStorage.WHEEL_REWARDS || [444, 555, 666, 777, 888, 999]);
    var idx = rewards.indexOf(coins);
    if (idx < 0) idx = 0;
    var seg = 360 / rewards.length;
    // Segment centers: idx 0 at 0° (top). Clockwise rotation brings idx under pointer.
    var desiredMod = (360 - idx * seg) % 360;
    var reduce = !!reduceMotion || document.documentElement.classList.contains('reduce-motion');
    var dur = reduce ? 80 : (durationMs != null ? durationMs : SPIN_ONCE_MS);
    // More full rotations for longer spins → clearer “wheel of fortune” feel
    var turns = reduce ? 1 : (dur >= 6000 ? 12 : (dur >= 3000 ? 7 : (dur >= 1500 ? 4 : 3)));
    var currentMod = ((wheelAngle % 360) + 360) % 360;
    var delta = (desiredMod - currentMod + 360) % 360;
    var startAngle = wheelAngle;
    var target = wheelAngle + turns * 360 + delta;
    wheelSpinning = true;
    setSpinButtonsBusy(true);
    if (wheelWrapEl) {
      wheelWrapEl.classList.remove('wheel-win');
      wheelWrapEl.classList.add('wheel-spinning');
    }
    if (spinResultEl && !reduce && dur >= 5000) {
      flashSpinResult('Spinning… 🎰');
    }
    // Kill any leftover CSS transition — rAF owns transform exclusively
    spinWheelEl.style.transition = 'none';
    spinWheelEl.style.webkitTransition = 'none';
    spinWheelEl.style.transform = 'rotate(' + startAngle + 'deg) translateZ(0)';
    spinWheelEl.style.webkitTransform = 'rotate(' + startAngle + 'deg) translateZ(0)';
    var t0 = performance.now();
    var lastTickSeg = Math.floor(startAngle / (seg / 2));
    function frame(now) {
      var p = Math.min(1, (now - t0) / Math.max(1, dur));
      var e = reduce ? p : wheelEaseOut(p);
      var ang = startAngle + (target - startAngle) * e;
      spinWheelEl.style.transform = 'rotate(' + ang + 'deg) translateZ(0)';
      spinWheelEl.style.webkitTransform = 'rotate(' + ang + 'deg) translateZ(0)';
      // Soft tick as segments pass the pointer (audio optional)
      var tickSeg = Math.floor(ang / (seg / 2));
      if (tickSeg !== lastTickSeg) {
        lastTickSeg = tickSeg;
        if (!reduce && FTAudio && typeof FTAudio.tick === 'function') {
          try { FTAudio.tick(); } catch (err) { /* ignore */ }
        }
      }
      if (p < 1) {
        wheelAnimRaf = requestAnimationFrame(frame);
      } else {
        wheelAnimRaf = 0;
        wheelAngle = target;
        spinWheelEl.style.transform = 'rotate(' + target + 'deg) translateZ(0)';
        spinWheelEl.style.webkitTransform = 'rotate(' + target + 'deg) translateZ(0)';
        wheelSpinning = false;
        if (wheelWrapEl) {
          wheelWrapEl.classList.remove('wheel-spinning');
          wheelWrapEl.classList.remove('wheel-win');
          void wheelWrapEl.offsetWidth;
          wheelWrapEl.classList.add('wheel-win');
        }
        // Land flash on card / history
        if (spinResultEl) spinResultEl.classList.add('land-pulse');
        setTimeout(function () {
          if (spinResultEl) spinResultEl.classList.remove('land-pulse');
        }, 700);
        if (done) done();
      }
    }
    wheelAnimRaf = requestAnimationFrame(frame);
  }

  function flashSpinResult(text) {
    if (!spinResultEl) return;
    spinResultEl.classList.remove('win-flash');
    void spinResultEl.offsetWidth;
    spinResultEl.textContent = text;
    spinResultEl.classList.add('win-flash');
  }

  function doSpinOnce() {
    if (wheelSpinning || spinQueueActive) return;
    var begin = FTStorage.beginWheelSpin || null;
    var r = begin ? begin(Math.random) : (FTStorage.spinWheelOnce ? FTStorage.spinWheelOnce(Math.random) : null);
    if (!r) { showToast('Need 10 gifts for a spin'); refreshGiftsUI(); return; }
    var alreadyGranted = !begin; // legacy path granted immediately
    pendingUngrantedSpin = alreadyGranted ? null : { coins: r.coins };
    refreshGiftsUI(); // gifts already spent — show updated spin count while wheel turns
    if (FTAudio.mystery) FTAudio.mystery();
    flashSpinResult('Wheel spinning… hold tight! 🎰');
    animateWheelTo(r.coins, function () {
      if (!alreadyGranted && FTStorage.grantSpinCoins) FTStorage.grantSpinCoins(r.coins);
      pendingUngrantedSpin = null;
      showMysteryResult(spinRarityLabel(r.coins) + '!', '+' + r.coins + ' coins');
      flashSpinResult('You won +' + r.coins + ' 🪙 · ' + (FTStorage.getGiftBoxes ? FTStorage.getGiftBoxes() : r.giftsLeft) + ' gifts left');
      showToast('+' + r.coins + ' 🪙 ' + spinRarityLabel(r.coins), 1600, r.coins >= 888 ? 'medal' : 'gift');
      refreshGiftsUI();
      updateCoinHud();
      setSpinButtonsBusy(false);
      voiceCue('wah_ji');
    }, SPIN_ONCE_MS);
  }

  /** Sequential spins: full ~7s when 1 charge; shorter sequential when many. Grant after each land. */
  function doSpinAll() {
    if (wheelSpinning || spinQueueActive) return;
    var charges = FTStorage.getSpinCharges ? FTStorage.getSpinCharges() : 0;
    if (charges < 1) { showToast('Need 10 gifts for a spin'); return; }
    var results = [];
    var total = 0;
    var planned = charges;
    spinQueueActive = true;
    if (FTAudio.mystery) FTAudio.mystery();
    flashSpinResult('Spinning ×' + planned + '…');
    setSpinButtonsBusy(true);

    function finishAll() {
      spinQueueActive = false;
      if (!results.length) {
        showToast('Need 10 gifts for a spin');
        refreshGiftsUI();
        setSpinButtonsBusy(false);
        return;
      }
      var detail = results.map(function (c) { return '+' + c; }).join(' · ');
      showMysteryResult('SPIN ×' + results.length, '+' + total + ' coins total');
      flashSpinResult(detail + ' = +' + total + ' 🪙');
      refreshGiftsUI();
      updateCoinHud();
      setSpinButtonsBusy(false);
      voiceCue('shabaash');
    }

    function nextSpin() {
      if ((FTStorage.getSpinCharges ? FTStorage.getSpinCharges() : 0) < 1) {
        finishAll();
        return;
      }
      var begin = FTStorage.beginWheelSpin || null;
      var r = begin ? begin(Math.random) : (FTStorage.spinWheelOnce ? FTStorage.spinWheelOnce(Math.random) : null);
      if (!r) { finishAll(); return; }
      var alreadyGranted = !begin;
      pendingUngrantedSpin = alreadyGranted ? null : { coins: r.coins };
      refreshGiftsUI();
      var dur = spinAllDurationMs(planned - results.length, planned);
      animateWheelTo(r.coins, function () {
        if (!alreadyGranted && FTStorage.grantSpinCoins) FTStorage.grantSpinCoins(r.coins);
        pendingUngrantedSpin = null;
        results.push(r.coins);
        total += r.coins;
        flashSpinResult('+' + r.coins + ' 🪙  (' + results.length + '/' + planned + ')');
        refreshGiftsUI();
        updateCoinHud();
        if (results.length >= planned) {
          setTimeout(finishAll, 280);
        } else {
          setTimeout(nextSpin, 220);
        }
      }, dur);
    }
    nextSpin();
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
    updateLivesHud();
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
      spawnConfettiBurst(bird.x, bird.y, 12);
    }
  }

  function addPipeScore(p) {
    combo += 1;
    runBestCombo = Math.max(runBestCombo, combo, coinCombo, nearMissStreak);
    var mult = pipeComboMult();
    // Perfect Pass: near gap center → +3 base (tune with existing mult)
    var gap = p.gap != null ? p.gap : currentGap;
    var center = p.gapY + gap / 2;
    var distCenter = Math.abs(bird.y - center);
    var basePts = 1;
    var tag = '';
    if (distCenter <= PERFECT_CENTER_PX) {
      basePts = 3;
      runPerfects += 1;
      tag = 'PERFECT!';
      if (FTAudio.perfect) FTAudio.perfect();
      showBanner('PERFECT!', 800);
      showToast('PERFECT!', 900, 'perfect');
      spawnPerfectStars(bird.x, bird.y);
      perfectRailFlash = 1;
      // rail sparkles along gap center
      if (!reduceMotion) {
        for (var ri = 0; ri < 8; ri++) {
          particles.push({
            x: p.x + PIPE_W / 2 + (rng() - 0.5) * 10,
            y: center + (rng() - 0.5) * (PERFECT_CENTER_PX * 2),
            vx: (rng() - 0.5) * 40, vy: (rng() - 0.5) * 30 - 20,
            life: 0.4, max: 0.55, color: ri % 2 ? '#7dd3fc' : '#ffd93d',
            r: 1.8 + rng(), kind: 'spark'
          });
        }
        trimParticles();
      }
      voiceCue(rng() < 0.5 ? 'perfect_pass' : 'wah_ji');
    }
    // Near-miss bonus score already tracked separately; if just near-missed this pipe, bump
    if (p._wasNearMiss) {
      basePts = Math.max(basePts, 5);
      tag = tag || 'CLOSE +5';
      var pass = birdPass();
      if (pass.nearMissBonus) basePts += pass.nearMissBonus;
    }
    var gained = basePts * mult;
    setScore(score + gained);
    FTAudio.score();
    popScore(gained, bird.x + 20, bird.y - 30);
    if (tag && basePts >= 3) {
      popScore(tag, bird.x, bird.y - 48);
    }
    if (mult >= 3) {
      FTAudio.combo();
      showBanner((riskyActive() ? 'RISKY x' : 'COMBO x') + mult + '!', 900);
      if (mult >= 5 && !reduceMotion) {
        spawnConfettiBurst(bird.x, bird.y - 20, 10);
        showToast('COMBO x' + mult + '!', 900, 'medal');
      }
    }
    // Track combo mission peak live
    if (FTStorage.setMissionMax) FTStorage.setMissionMax('combo8', Math.max(combo, runBestCombo));
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
      var nmY = topClear < botClear ? p.gapY + 4 : p.gapY + gap - 4;
      spawnNearMissSparks(p.x + PIPE_W / 2, nmY);
      FTAudio.nearmiss();
      haptic('nearmiss');
      nearMissStreak += 1;
      runNearMisses += 1;
      p._wasNearMiss = true;
      // 3.13 near-miss camera kick toward the graze edge
      if (!reduceMotion) {
        nearMissCamUntil = performance.now() + 220;
        camKickX = (p.x + PIPE_W / 2 > bird.x ? 1 : -1) * 5;
        camKickY = (topClear < botClear ? -1 : 1) * 7;
        camKickZoom = 0.028;
        triggerShake();
      }
      showToast('CLOSE!', 850, 'close');
      showBanner('CLOSE!', 500);
      triggerChirpMouth('close');
      if (nearMissStreak === 1 && rng() < 0.45) voiceCue('bach_ke');
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
    var weather = effectiveWeather();
    var pal = FTSkins.envPalette(drawEnv === 'rain' || drawEnv === 'monsoon' ? 'city' : drawEnv, weather);
    var weatherNow = effectiveWeather();
    if ((pal.rain || drawEnv === 'rain' || drawEnv === 'monsoon' || weatherNow === 'storm') && !reduceMotion) {
      rainDrops.forEach(function (d) {
        d.y += d.spd * dt;
        d.x -= (weatherNow === 'storm' ? 55 : 40) * dt;
        if (d.splash > 0) d.splash = Math.max(0, d.splash - dt * 3);
        if (d.y > H - GROUND_H) {
          d.splash = 1;
          d.y = -10;
          d.x = Math.random() * W;
        }
      });
    }
    if ((pal.fog || weatherNow === 'fog') && fogWisps.length) {
      fogWisps.forEach(function (w) {
        w.x += w.spd * dt;
        w.y += Math.sin(performance.now() / 900 + w.x * 0.01) * 6 * dt;
        if (w.x - w.w > W) { w.x = -w.w; w.y = H * 0.35 + Math.random() * H * 0.4; }
      });
    }
    if (weatherNow === 'storm' && !reduceMotion) {
      if (weatherFlash > 0) weatherFlash = Math.max(0, weatherFlash - dt * 2.2);
      else if (rng() < 0.008) weatherFlash = 0.85 + rng() * 0.4;
    } else {
      weatherFlash = 0;
    }
    // Refresh power HUD countdown chips ~4 Hz
    if (state === 'playing' && powerHudEl && !powerHudEl.hidden) {
      if (!updatePowerHud._acc) updatePowerHud._acc = 0;
      updatePowerHud._acc += dt;
      if (updatePowerHud._acc > 0.25) { updatePowerHud._acc = 0; updatePowerHud(); }
    }

    for (var i = particles.length - 1; i >= 0; i--) {
      var pt = particles[i];
      pt.life -= dt;
      if (pt.kind === 'ring') {
        pt.r += (pt.grow || 30) * dt;
      } else {
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        if (pt.kind === 'confetti') {
          pt.vy += 90 * dt;
          pt.rot = (pt.rot || 0) + (pt.spin || 6) * dt;
          pt.vx *= 0.99;
        } else if (pt.kind === 'star') {
          pt.vy += 60 * dt;
          pt.rot = (pt.rot || 0) + 3 * dt;
        } else if (pt.kind !== 'trail') {
          pt.vy += 140 * dt;
        } else {
          pt.vx *= 0.98;
        }
      }
      if (pt.life <= 0) particles.splice(i, 1);
    }
    if (particles.length > particleBudget()) particles.splice(0, particles.length - particleBudget());

    for (var si = scorePops.length - 1; si >= 0; si--) {
      var sp = scorePops[si];
      sp.life -= dt;
      sp.y -= 40 * dt;
      if (sp.life <= 0) scorePops.splice(si, 1);
    }

    if (hitFlash > 0) hitFlash = Math.max(0, hitFlash - dt * (1000 / HIT_FLASH_MS));
    // Near-miss camera kick decay (3.13)
    if (performance.now() >= nearMissCamUntil) {
      camKickX *= Math.max(0, 1 - dt * 10);
      camKickY *= Math.max(0, 1 - dt * 10);
      camKickZoom *= Math.max(0, 1 - dt * 10);
      if (Math.abs(camKickX) < 0.05) camKickX = 0;
      if (Math.abs(camKickY) < 0.05) camKickY = 0;
      if (camKickZoom < 0.001) camKickZoom = 0;
    }
    if (perfectRailFlash > 0) perfectRailFlash = Math.max(0, perfectRailFlash - dt * 2.2);
    // Practice ghost: smooth toward next gap center (3.14)
    if (isPractice() && state === 'playing' && bird && pipes.length) {
      var target = null;
      for (var gi = 0; gi < pipes.length; gi++) {
        if (pipes[gi].x + PIPE_W > bird.x - 10) { target = pipes[gi]; break; }
      }
      if (target) {
        var tg = target.gap != null ? target.gap : currentGap;
        var ty = target.gapY + tg / 2;
        if (!practiceGhost) practiceGhost = { x: bird.x - 36, y: bird.y, rot: 0 };
        practiceGhost.x = bird.x - 42;
        practiceGhost.y += (ty - practiceGhost.y) * Math.min(1, sdt * 3.2);
        practiceGhost.rot += (((ty - practiceGhost.y) / 80) - practiceGhost.rot) * Math.min(1, sdt * 6);
      }
    } else if (state !== 'playing') {
      practiceGhost = null;
    }

    if (state === 'dying') {
      if (performance.now() >= deathFreezeUntil) showDeath();
      return;
    }
    if (state !== 'playing' || !bird) return;

    if (flapCooldown > 0) flapCooldown -= sdt;
    // Refresh difficulty curve (time-based first 10s + score bands)
    if (Math.floor(runElapsedSec() * 2) !== Math.floor((runElapsedSec() - sdt) * 2)) {
      difficultyFor(score);
    }
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
        voiceCue('time_up');
        showToast('Time\'s up! Score ' + score, 1600, 'medal');
        return;
      }
    }

    var g = GRAVITY * sensitivity * (birdPass().gravityMul || 1);
    // 3.11: Classic/Daily/Practice slightly floatier; Hard/Challenge/OneLife unchanged
    if (isForgivingMode()) g *= 0.93;
    var term = TERMINAL_V * Math.max(0.85, sensitivity);
    bird.vy += g * sdt;
    if (bird.vy > term) bird.vy = term;
    bird.y += bird.vy * sdt;

    var targetRot = Math.max(-0.65, Math.min(1.25, bird.vy / 500));
    bird.rot += (targetRot - bird.rot) * Math.min(1, sdt * 12);

    metersFlown += currentSpeed * sdt * M_PER_PX;

    // Boss / Chase events every N distance (30–60s then normal)
    if (!bossActive && metersFlown >= nextBossAt && !isPractice()) {
      bossActive = true;
      bossPulse = 1;
      var dur = (BOSS_MIN_S + rng() * (BOSS_MAX_S - BOSS_MIN_S)) * 1000;
      bossUntil = now + dur;
      bossDurMs = dur;
      bossKind = FTSkins.pickBossKind ? FTSkins.pickBossKind(rng) : { id: 'truck', label: 'GIANT TRUCK', emoji: '🚛' };
      nextBossAt = metersFlown + BOSS_EVERY_M + rng() * 40;
      if (FTAudio.boss) FTAudio.boss();
      showBanner((bossKind.emoji || '⚠') + ' DANGER — ' + (bossKind.label || 'CHASE') + '!', 1800);
      showToast((bossKind.emoji || '⚠') + ' Chase incoming!', 1400, 'close');
      voiceCue('bach_ke');
      triggerShake();
      if (!reduceMotion) spawnConfettiBurst(W * 0.5, 80, 8);
      // Spawn heavy traffic / giant obstacle feel (3.13: eagle uses bird-height hawk-ish truck, police multi-wave)
      if (bossKind.id === 'storm') weatherDynId = 'storm';
      else if (bossKind.id === 'eagle') {
        traffic.push({ x: W + 60, y: Math.max(60, bird.y - 20), vx: -200, kind: 'truck', dir: -1, boss: true, scale: 1.25 });
        traffic.push({ x: W + 140, y: Math.min(H - GROUND_H - 40, bird.y + 30), vx: -170, kind: 'bike', dir: -1, boss: true });
      } else if (bossKind.id === 'police') {
        traffic.push({ x: -50, y: H - GROUND_H - 36, vx: 220, kind: 'taxi', dir: 1, boss: true, scale: 1.15 });
        traffic.push({ x: -90, y: H - GROUND_H - 56, vx: 235, kind: 'bike', dir: 1, boss: true });
        traffic.push({ x: -140, y: H - GROUND_H - 28, vx: 200, kind: 'taxi', dir: 1, boss: true });
      } else if (bossKind.id === 'truck' || bossKind.id === 'giant') {
        traffic.push({ x: W + 80, y: H - GROUND_H - 40, vx: -175, kind: 'truck', dir: -1, boss: true, scale: 1.35 });
      }
      difficultyFor(score);
    }
    if (bossActive && now >= bossUntil) {
      bossActive = false;
      bossKind = null;
      bossPulse = 0;
      if (weatherDynId === 'storm') weatherDynId = null;
      showToast('Chase clear! ✅', 1200, 'lucky');
      showBanner('ALL CLEAR!', 900);
      if (!reduceMotion) spawnConfettiBurst(bird.x, bird.y, 14);
      difficultyFor(score);
    }
    if (bossPulse > 0) bossPulse = Math.max(0, bossPulse - sdt * 0.85);

    // Mild dynamic weather drift (not unfair)
    if (!bossActive && state === 'playing' && metersFlown >= nextWeatherAt) {
      nextWeatherAt = metersFlown + 90 + rng() * 80;
      if (!weatherDynId && rng() < 0.55) {
        var opts = ['clear', 'rain', 'fog', 'sunset', 'night'];
        weatherDynId = opts[Math.floor(rng() * opts.length)];
        showToast('Weather: ' + weatherDynId, 1200);
        difficultyFor(score);
      } else if (weatherDynId && weatherDynId !== 'storm') {
        weatherDynId = null;
        difficultyFor(score);
      }
    }

    // Optional per-area music stubs
    var areaNow = activeArea();
    if (FTAudio.playAreaMusic && areaNow !== lastAreaMusic) {
      lastAreaMusic = areaNow;
      FTAudio.playAreaMusic(areaNow);
    }

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
      if (dx * dx + dy * dy < (POWERUP_R + bird.w * 0.48) * (POWERUP_R + bird.w * 0.48)) {
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
        if (dist < 140) {
          c.x += (cdx / dist) * 240 * sdt;
          c.y += (cdy / dist) * 240 * sdt;
          // 3.13 magnet suction trail
          if (!reduceMotion && rng() < 0.35) {
            particles.push({
              x: c.x, y: c.y,
              vx: (cdx / dist) * 40, vy: (cdy / dist) * 40,
              life: 0.25, max: 0.35,
              color: rng() < 0.5 ? '#f9a8d4' : '#ffd93d',
              r: 1.6 + rng() * 1.2,
              kind: 'trail'
            });
          }
        } else {
          c.x -= currentSpeed * sdt;
        }
      } else {
        c.x -= currentSpeed * sdt;
      }
      if (c.x < -30) { coins.splice(ci, 1); coinCombo = 0; continue; }
      var cx = bird.x - c.x, cy = bird.y - c.y;
      if (cx * cx + cy * cy < (COIN_R + bird.w * 0.55) * (COIN_R + bird.w * 0.55)) {
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
      if (bx * bx + by2 * by2 < (20 + bird.w * 0.5) * (20 + bird.w * 0.5)) {
        openMysteryBox(b);
        boxes.splice(bi, 1);
      }
    }

    if (pipes.length && pipes[0].x + PIPE_W < -12) {
      pipes.shift();
      var last = pipes[pipes.length - 1];
      pipes.push(makePipe(last.x + currentSpawn, currentGap));
    }

    resolveCollision();
  }

  function drawSky() {
    var area = activeArea();
    var weather = effectiveWeather();
    var palEnv = (area === 'rain' || area === 'monsoon') ? 'city' : area;
    var pal = FTSkins.envPalette(palEnv, weather);
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, pal.sky0);
    g.addColorStop(0.55, pal.sky1);
    g.addColorStop(1, pal.sky2);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = pal.sun;
    ctx.beginPath();
    if (pal.stars || area === 'night' || area === 'quetta') {
      ctx.arc(W - 70, 80, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      for (var i = 0; i < 18; i++) {
        ctx.fillRect((i * 97 + 40) % W, (i * 53 + 20) % 220, 2, 2);
      }
      // 3.13 night city window lights + street glow
      var gy = H - GROUND_H;
      for (var bi = 0; bi < 6; bi++) {
        var bx = ((bi * 78 + groundX * 0.6) % (W + 40)) - 10;
        var bh = 28 + (bi % 3) * 14;
        ctx.fillStyle = 'rgba(20,28,48,0.85)';
        ctx.fillRect(bx, gy - bh, 36, bh);
        for (var wy = 0; wy < 3; wy++) {
          for (var wx = 0; wx < 2; wx++) {
            if ((bi + wy + wx + Math.floor(performance.now() / 2000)) % 5 === 0) continue;
            ctx.fillStyle = (bi + wy) % 2 ? 'rgba(255,220,120,0.85)' : 'rgba(120,200,255,0.7)';
            ctx.fillRect(bx + 6 + wx * 14, gy - bh + 6 + wy * 10, 8, 6);
          }
        }
      }
      ctx.fillStyle = 'rgba(255,180,80,0.12)';
      ctx.fillRect(0, gy - 18, W, 18);
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
    } else if (area === 'lahore' || area === 'karachi' || area === 'city' || area === 'night' || area === 'rain' || area === 'quetta' || area === 'oldcity') {
      for (var ci = 0; ci < 6; ci++) {
        var cx = ((ci * 70 + groundX * 0.3) % (W + 80)) - 40;
        var bh = 40 + (ci % 3) * 25;
        if (area === 'oldcity') bh = 28 + (ci % 4) * 18;
        ctx.fillRect(cx, H - GROUND_H - bh, 36 + (ci % 2) * 20, bh);
        if (area === 'quetta' || area === 'oldcity') {
          ctx.fillStyle = 'rgba(255,200,80,0.25)';
          ctx.fillRect(cx + 6, H - GROUND_H - bh + 8, 8, 6);
          ctx.fillStyle = 'rgba(0,0,0,0.12)';
        }
      }
    } else if (area === 'murree' || area === 'islamabad' || area === 'mountains' || area === 'hunza') {
      ctx.beginPath();
      ctx.moveTo(0, H - GROUND_H);
      for (var mi = 0; mi < 5; mi++) {
        ctx.lineTo(mi * 100, H - GROUND_H - 50 - (mi % 2) * 30 - (area === 'hunza' ? 20 : 0));
      }
      ctx.lineTo(W, H - GROUND_H);
      ctx.fill();
      if (area === 'hunza') {
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.beginPath();
        ctx.moveTo(40, H - GROUND_H - 90);
        ctx.lineTo(80, H - GROUND_H - 130);
        ctx.lineTo(120, H - GROUND_H - 90);
        ctx.fill();
      }
    } else if (area === 'desert') {
      ctx.fillStyle = 'rgba(210,160,40,0.35)';
      ctx.beginPath();
      ctx.ellipse(80, H - GROUND_H, 70, 22, 0, 0, Math.PI * 2);
      ctx.ellipse(250, H - GROUND_H, 90, 18, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (area === 'village' || area === 'monsoon') {
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
      if (area === 'monsoon') {
        ctx.fillStyle = 'rgba(40,120,60,0.25)';
        for (var fi = 0; fi < 8; fi++) {
          var fx = ((fi * 50 + groundX * 0.2) % (W + 40)) - 10;
          ctx.fillRect(fx, H - GROUND_H - 18, 6, 18);
        }
      }
    } else if (area === 'canal') {
      ctx.fillStyle = 'rgba(52,152,219,0.35)';
      ctx.fillRect(0, H - GROUND_H - 28, W, 18);
      ctx.fillStyle = 'rgba(40,40,50,0.2)';
      for (var cai = 0; cai < 4; cai++) {
        var cax = ((cai * 110 + groundX * 0.3) % (W + 60)) - 20;
        ctx.fillRect(cax, H - GROUND_H - 50, 50, 8);
      }
    } else if (area === 'gwadar') {
      ctx.fillStyle = 'rgba(46,134,193,0.4)';
      ctx.fillRect(0, H - GROUND_H - 36, W, 36);
      ctx.fillStyle = 'rgba(241,196,15,0.25)';
      ctx.beginPath();
      ctx.ellipse(W - 80, H - GROUND_H - 10, 60, 14, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    clouds.forEach(function (c) {
      ctx.fillStyle = pal.cloud;
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, c.w, c.w * 0.45, 0, 0, Math.PI * 2);
      ctx.ellipse(c.x + c.w * 0.4, c.y + 4, c.w * 0.7, c.w * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    if (pal.fog) {
      ctx.fillStyle = 'rgba(220,220,230,0.18)';
      ctx.fillRect(0, H * 0.28, W, H * 0.22);
      ctx.fillStyle = 'rgba(200,205,220,0.22)';
      ctx.fillRect(0, H * 0.45, W, H * 0.35);
    }
  }

  function drawWeatherFX() {
    var area = activeArea();
    var weather = effectiveWeather();
    var pal = FTSkins.envPalette(area === 'rain' || area === 'monsoon' ? 'city' : area, weather);
    var isRain = !!(pal.rain || area === 'rain' || area === 'monsoon' || weather === 'storm');
    var isFog = !!(pal.fog || weather === 'fog');
    // Fog wisps (3.12)
    if (isFog && fogWisps.length) {
      fogWisps.forEach(function (w) {
        ctx.fillStyle = 'rgba(220,225,235,' + w.a.toFixed(3) + ')';
        ctx.beginPath();
        ctx.ellipse(w.x, w.y, w.w, w.h, 0, 0, Math.PI * 2);
        ctx.fill();
      });
    }
    // Storm lightning flash
    if (weatherFlash > 0) {
      ctx.fillStyle = 'rgba(220,235,255,' + (weatherFlash * 0.45).toFixed(3) + ')';
      ctx.fillRect(0, 0, W, H);
    }
    if (!isRain || reduceMotion) return;
    ctx.strokeStyle = pal.storm ? 'rgba(200,220,255,0.6)' : 'rgba(180,200,230,0.5)';
    ctx.lineWidth = pal.storm ? 1.8 : 1.4;
    rainDrops.forEach(function (d) {
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x - (pal.storm ? 4 : 3), d.y + d.len);
      ctx.stroke();
      if (d.splash > 0) {
        ctx.globalAlpha = Math.min(1, d.splash);
        ctx.strokeStyle = 'rgba(200,220,255,0.45)';
        ctx.beginPath();
        ctx.arc(d.x, H - GROUND_H - 2, 3 + (1 - d.splash) * 4, Math.PI, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    });
  }

  function drawPipe(p) {
    var area = activeArea();
    var weather = effectiveWeather();
    var pal = FTSkins.envPalette(area === 'rain' || area === 'monsoon' ? 'city' : area, weather);
    var ghost = (isPractice() || ghostActive()) && state === 'playing';
    FTSkins.drawObstaclePair(ctx, p, pal, H - GROUND_H, ghost);
  }

  function drawPowerup(pu) {
    if (pu.taken) return;
    var t = performance.now() / 1000;
    var bob = reduceMotion ? 0 : Math.sin(t * 4 + pu.x * 0.05) * 3.5;
    var pulse = 1 + (reduceMotion ? 0 : Math.sin(t * 6 + pu.x) * 0.1);
    ctx.save();
    ctx.translate(pu.x, pu.y + bob);
    ctx.scale(pulse, pulse);
    var colors = {
      shield: 'rgba(100,200,255,0.95)', slowmo: 'rgba(180,140,255,0.95)',
      turbo: 'rgba(255,180,50,0.97)', magnet: 'rgba(255,100,150,0.95)', ghost: 'rgba(200,220,255,0.9)'
    };
    var glow = colors[pu.type] || '#ffd93d';
    // outer glow ring (3.12 clarity)
    if (!reduceMotion) {
      ctx.strokeStyle = glow;
      ctx.globalAlpha = 0.35 + 0.25 * Math.sin(t * 5);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, POWERUP_R + 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, POWERUP_R + 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.65)';
    ctx.lineWidth = 2.2;
    ctx.stroke();
    ctx.fillStyle = '#0a2540';
    ctx.font = 'bold 13px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    var icons = { shield: '🛡', slowmo: '⏱', turbo: '⚡', magnet: '🧲', ghost: '👻' };
    ctx.fillText(icons[pu.type] || '✦', 0, 1);
    // tiny label under icon
    var names = { shield: 'SHIELD', slowmo: 'SLOW', turbo: 'TURBO', magnet: 'MAG', ghost: 'GHOST' };
    ctx.font = 'bold 7px system-ui';
    ctx.fillStyle = 'rgba(10,37,64,0.9)';
    ctx.fillText(names[pu.type] || 'PWR', 0, POWERUP_R + 9);
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
    for (var pi = 0; pi < particles.length; pi++) {
      var pt = particles[pi];
      var a = Math.max(0, pt.life / (pt.max || 0.5));
      if (pt.kind === 'ring') {
        ctx.globalAlpha = a * 0.85;
        ctx.strokeStyle = pt.color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
        continue;
      }
      if (pt.kind === 'star') {
        ctx.globalAlpha = a;
        ctx.fillStyle = pt.color;
        ctx.save();
        ctx.translate(pt.x, pt.y);
        ctx.rotate((pt.rot || 0) + (1 - a) * 2);
        var r = Math.max(0.8, pt.r * (0.7 + 0.3 * a));
        ctx.beginPath();
        for (var si = 0; si < 5; si++) {
          var ang = (si * Math.PI * 2) / 5 - Math.PI / 2;
          var r1 = r, r2 = r * 0.4;
          ctx.lineTo(Math.cos(ang) * r1, Math.sin(ang) * r1);
          ctx.lineTo(Math.cos(ang + Math.PI / 5) * r2, Math.sin(ang + Math.PI / 5) * r2);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        ctx.globalAlpha = 1;
        continue;
      }
      if (pt.kind === 'confetti') {
        ctx.globalAlpha = a * 0.95;
        ctx.fillStyle = pt.color;
        ctx.save();
        ctx.translate(pt.x, pt.y);
        ctx.rotate(pt.rot || 0);
        ctx.fillRect(-pt.r, -pt.r * 0.4, pt.r * 2, pt.r * 0.8);
        ctx.restore();
        ctx.globalAlpha = 1;
        continue;
      }
      ctx.globalAlpha = a * (pt.kind === 'trail' ? 0.7 : 1);
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, Math.max(0.5, pt.r * (pt.kind === 'gift' ? (0.6 + 0.4 * a) : a)), 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
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
    var weather = effectiveWeather();
    var pal = FTSkins.envPalette(area === 'rain' || area === 'monsoon' ? 'city' : area, weather);
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
    var t = performance.now() / 1000;
    var rem = Math.max(0, (ghostUntil - performance.now()) / GHOST_MS);
    ctx.save();
    // Afterimage copies
    if (!reduceMotion) {
      for (var i = 1; i <= 3; i++) {
        ctx.globalAlpha = 0.12 * rem;
        FTSkins.draw(ctx, birdId, bird.x - i * 10, bird.y + Math.sin(t * 6 + i) * 2, bird.rot * 0.6, 0.9, {
          vehicle: 'none', hat: 'none', reduceMotion: true
        });
      }
    }
    ctx.globalAlpha = 0.4 + 0.2 * Math.sin(t * 7);
    ctx.strokeStyle = 'rgba(226,232,240,0.95)';
    ctx.lineWidth = 2.2;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.arc(bird.x, bird.y, Math.max(bird.w, bird.h) * 0.85 + 8 + Math.sin(t * 5) * 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(148,163,184,0.55)';
    ctx.font = 'bold 10px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('GHOST', bird.x, bird.y - Math.max(bird.w, bird.h) * 0.7 - 10);
    ctx.restore();
  }

  function drawSlowMoVFX() {
    if (!bird || performance.now() >= slowMoUntil) return;
    var rem = Math.max(0, Math.min(1, (slowMoUntil - performance.now()) / SLOWMO_MS));
    ctx.save();
    var g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.15, W / 2, H / 2, Math.max(W, H) * 0.72);
    g.addColorStop(0, 'rgba(167,139,250,0)');
    g.addColorStop(1, 'rgba(91,33,182,' + (0.16 + 0.14 * rem).toFixed(3) + ')');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    if (!reduceMotion) {
      ctx.strokeStyle = 'rgba(196,181,253,' + (0.35 + 0.25 * rem).toFixed(3) + ')';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(bird.x, bird.y, 26 + Math.sin(performance.now() / 200) * 3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(221,214,254,0.85)';
      ctx.font = 'bold 11px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('SLOW', bird.x, bird.y - 34);
    }
    ctx.restore();
  }

  function drawTurboVFX() {
    if (!bird || performance.now() >= turboUntil) return;
    var rem = Math.max(0, Math.min(1, (turboUntil - performance.now()) / TURBO_MS));
    var t = performance.now() / 80;
    ctx.save();
    if (!reduceMotion) {
      for (var i = 0; i < 7; i++) {
        var yy = bird.y + (i - 3) * 7 + Math.sin(t + i) * 2;
        ctx.strokeStyle = 'rgba(251,191,36,' + (0.15 + 0.35 * rem * (1 - Math.abs(i - 3) / 4)).toFixed(3) + ')';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(bird.x - 18 - i * 6, yy);
        ctx.lineTo(bird.x - 48 - i * 10, yy + (rng() - 0.5));
        ctx.stroke();
      }
    }
    // amber edge wash
    var g2 = ctx.createLinearGradient(0, 0, W * 0.35, 0);
    g2.addColorStop(0, 'rgba(245,158,11,' + (0.12 * rem).toFixed(3) + ')');
    g2.addColorStop(1, 'rgba(245,158,11,0)');
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, W * 0.4, H);
    ctx.fillStyle = 'rgba(253,230,138,0.9)';
    ctx.font = 'bold 11px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('TURBO', bird.x, bird.y - 34);
    ctx.restore();
  }

  function drawPerfectRails() {
    if (state !== 'playing' || !pipes.length || reduceMotion) return;
    // Find nearest ahead pipe; draw center rail when bird is near gap
    var p = null;
    for (var i = 0; i < pipes.length; i++) {
      if (pipes[i].x + PIPE_W > bird.x - 20) { p = pipes[i]; break; }
    }
    if (!p || !bird) return;
    var gap = p.gap != null ? p.gap : currentGap;
    var center = p.gapY + gap / 2;
    var dist = Math.abs(bird.y - center);
    var approaching = p.x < bird.x + 90 && p.x + PIPE_W > bird.x - 20;
    if (!approaching && perfectRailFlash <= 0) return;
    var align = Math.max(0, 1 - dist / (PERFECT_CENTER_PX * 2.5));
    var a = Math.max(perfectRailFlash * 0.9, approaching ? align * 0.55 : 0);
    if (a < 0.08) return;
    var x0 = p.x - 6;
    var x1 = p.x + PIPE_W + 6;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.strokeStyle = perfectRailFlash > 0.2 ? '#ffd93d' : '#7dd3fc';
    ctx.lineWidth = 2 + perfectRailFlash * 2;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.moveTo(x0, center);
    ctx.lineTo(x1, center);
    ctx.stroke();
    // soft rail band
    ctx.globalAlpha = a * 0.25;
    ctx.fillStyle = perfectRailFlash > 0.2 ? 'rgba(255,217,61,0.5)' : 'rgba(125,211,252,0.45)';
    ctx.fillRect(x0, center - PERFECT_CENTER_PX, x1 - x0, PERFECT_CENTER_PX * 2);
    ctx.setLineDash([]);
    ctx.restore();
  }

  function drawPracticeGhost() {
    if (!isPractice() || state !== 'playing' || !practiceGhost || reduceMotion) return;
    ctx.save();
    ctx.globalAlpha = 0.38;
    FTSkins.draw(ctx, birdId, practiceGhost.x, practiceGhost.y, practiceGhost.rot, 0.92, {
      vehicle: 'none', hat: 'none', reduceMotion: true, wingFlap: Math.sin(performance.now() / 120) * 0.4
    });
    ctx.globalAlpha = 0.55;
    ctx.strokeStyle = 'rgba(125,211,252,0.7)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.arc(practiceGhost.x, practiceGhost.y, 18, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(125,211,252,0.9)';
    ctx.font = 'bold 9px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('GHOST', practiceGhost.x, practiceGhost.y - 24);
    ctx.restore();
  }

  function drawMagnetAura() {
    if (!bird || performance.now() >= magnetUntil) return;
    var t = performance.now() / 1000;
    ctx.save();
    ctx.strokeStyle = 'rgba(249,168,212,' + (0.35 + 0.25 * Math.sin(t * 8)).toFixed(3) + ')';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.arc(bird.x, bird.y, 38 + Math.sin(t * 6) * 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  function drawFrame(idle) {
    var kick = !reduceMotion && (camKickX || camKickY || camKickZoom);
    if (kick) {
      ctx.save();
      ctx.translate(W / 2 + camKickX, H / 2 + camKickY);
      ctx.scale(1 + camKickZoom, 1 + camKickZoom);
      ctx.translate(-W / 2, -H / 2);
    }
    drawSky();
    pipes.forEach(drawPipe);
    drawPerfectRails();
    traffic.forEach(function (t) { FTSkins.drawTraffic(ctx, t); });
    powerups.forEach(drawPowerup);
    coins.forEach(drawCoin);
    boxes.forEach(drawBox);
    drawGround();
    drawParticles();
    drawWeatherFX();
    drawPracticeGhost();
    if (bird) {
      drawSlowMoVFX();
      drawTurboVFX();
      drawShieldAura();
      drawGhostAura();
      drawMagnetAura();
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
    if (state === 'playing' || state === 'dying') {
      var vis = weatherMul().visibility;
      if (vis < 0.98) {
        ctx.fillStyle = 'rgba(200,210,220,' + ((1 - vis) * 0.55).toFixed(3) + ')';
        ctx.fillRect(0, 0, W, H);
      }
    }
    if (state === 'playing' && bossActive && bossKind) {
      var left = Math.max(0, (bossUntil - performance.now()) / 1000);
      var pulseA = 0.10 + 0.08 * Math.sin(performance.now() / 180) + bossPulse * 0.2;
      ctx.fillStyle = 'rgba(180,20,40,' + pulseA.toFixed(3) + ')';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(120,10,20,0.82)';
      ctx.fillRect(0, 36, W, 40);
      ctx.fillStyle = '#ffd93d';
      ctx.font = 'bold 13px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText((bossKind.emoji || '⚠') + ' DANGER — ' + bossKind.label, W / 2, 54);
      var barW = 160;
      var pct = Math.max(0, Math.min(1, (left * 1000) / Math.max(1, bossDurMs)));
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(W / 2 - barW / 2, 60, barW, 6);
      ctx.fillStyle = '#ff6b6b';
      ctx.fillRect(W / 2 - barW / 2, 60, barW * pct, 6);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px system-ui';
      ctx.fillText(Math.ceil(left) + 's left', W / 2, 78);
    }
    if (kick) ctx.restore();
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

  var lastFlapTouchTs = 0;
  function onPointer(e) {
    if (e.target && e.target.closest && e.target.closest(
      'button, .skin-card, #ad-stub-modal, .screen, label, input, .tab-btn, .mission-card, .chip, .garage-filter, .power-chip'
    )) return;
    // 3.12: debounce duplicate pointer/touch within 30ms (mobile double-fire)
    var now = performance.now();
    if (now - lastFlapTouchTs < 30) return;
    lastFlapTouchTs = now;
    if (e.cancelable) e.preventDefault();
    flap();
  }
  // Unlock AudioContext + speechSynthesis on first user tap (mobile gate)
  (function () {
    var done = false;
    function once() {
      if (done) return;
      done = true;
      if (FTAudio && FTAudio.unlock) FTAudio.unlock();
      document.removeEventListener('pointerdown', once, true);
      document.removeEventListener('touchstart', once, true);
      document.removeEventListener('keydown', once, true);
    }
    document.addEventListener('pointerdown', once, true);
    document.addEventListener('touchstart', once, { capture: true, passive: true });
    document.addEventListener('keydown', once, true);
  })();

  canvas.style.touchAction = 'none';
  canvas.addEventListener('pointerdown', onPointer, { passive: false });
  // Prefer pointer events only on #app during play (avoids touch+mouse double flap)
  document.getElementById('app').addEventListener('pointerdown', function (e) {
    if (state === 'playing') {
      if (e.target.closest && e.target.closest('button, .screen, label, input, .icon-btn')) return;
      var now = performance.now();
      if (now - lastFlapTouchTs < 30) return;
      lastFlapTouchTs = now;
      if (e.cancelable) e.preventDefault();
      flap();
    }
  }, { passive: false });

  function closePanelByKey(key) {
    key = key || '';
    if (key === 'ad-stub') {
      var ad = document.getElementById('ad-stub-modal');
      if (ad) {
        var no = ad.querySelector('[data-ad-no]');
        if (no) no.click();
        else ad.hidden = true;
      }
      return true;
    }
    if (key === 'share') {
      var ov = document.getElementById('share-preview');
      if (ov) ov.hidden = true;
      return true;
    }
    if (key === 'spin-unlock') { dismissSpinUnlockPopup(); return true; }
    if (key === 'mystery') {
      if (mysteryOverlay) mysteryOverlay.hidden = true;
      return true;
    }
    if (key === 'challenge-stages') {
      if (challengeStagePanel) challengeStagePanel.hidden = true;
      return true;
    }
    if (key === 'pause') { resumeGame(); return true; }
    if (key === 'death') { showMenu(); return true; }
    if (key === 'settings') {
      if (screenSettings) screenSettings.hidden = true;
      showMenu();
      return true;
    }
    if (key === 'gifts') {
      abortPendingSpinKeepCharge();
      showMenu();
      return true;
    }
    // Generic panel → menu
    if (key === 'modes' || key === 'garage' || key === 'missions' || key === 'collection' ||
        key === 'boards' || key === 'streak' || key === 'guide') {
      showMenu();
      return true;
    }
    return false;
  }

  function closeTopOverlayOrPanel() {
    var share = document.getElementById('share-preview');
    if (share && !share.hidden) { share.hidden = true; return true; }
    if (spinUnlockOverlay && !spinUnlockOverlay.hidden) { dismissSpinUnlockPopup(); return true; }
    if (mysteryOverlay && !mysteryOverlay.hidden) { mysteryOverlay.hidden = true; return true; }
    var ad = document.getElementById('ad-stub-modal');
    if (ad && !ad.hidden) {
      var no = ad.querySelector('[data-ad-no]');
      if (no) no.click();
      else ad.hidden = true;
      return true;
    }
    if (challengeStagePanel && !challengeStagePanel.hidden) {
      challengeStagePanel.hidden = true;
      return true;
    }
    if (state === 'paused') { resumeGame(); return true; }
    if (state === 'dead' && screenDeath && !screenDeath.hidden) { showMenu(); return true; }
    // Any visible panel screen (not start)
    var panels = [screenSettings, screenGarage, screenModes, screenMissions, screenCollection,
      screenGifts, screenGuide, screenBoards, screenStreak];
    for (var i = 0; i < panels.length; i++) {
      if (panels[i] && !panels[i].hidden) {
        if (panels[i] === screenGifts) abortPendingSpinKeepCharge();
        showMenu();
        return true;
      }
    }
    return false;
  }

  document.addEventListener('click', function (e) {
    var btn = e.target && e.target.closest ? e.target.closest('[data-panel-close]') : null;
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    closePanelByKey(btn.getAttribute('data-panel-close'));
  }, true);

  window.addEventListener('keydown', function (e) {
    if (e.code === 'Escape' || e.key === 'Escape') {
      e.preventDefault();
      if (closeTopOverlayOrPanel()) return;
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
  if (btnShare) btnShare.addEventListener('click', function () { openSharePreview(); });
  var btnShareConfirm = document.getElementById('btn-share-confirm');
  var btnShareCopy = document.getElementById('btn-share-copy');
  var btnShareClose = document.getElementById('btn-share-close');
  if (btnShareConfirm) btnShareConfirm.addEventListener('click', function () {
    var ov = document.getElementById('share-preview');
    if (ov) ov.hidden = true;
    shareRunSummary();
  });
  if (btnShareCopy) btnShareCopy.addEventListener('click', function () {
    copyShareText(buildShareText());
  });
  if (btnShareClose) btnShareClose.addEventListener('click', function () {
    var ov = document.getElementById('share-preview');
    if (ov) ov.hidden = true;
  });

  var a2hsOk = document.getElementById('a2hs-ok');
  if (a2hsOk) {
    a2hsOk.addEventListener('click', function () {
      try {
        sessionStorage.setItem(A2HS_SESSION_KEY, '1');
        localStorage.setItem(A2HS_SESSION_KEY, '1');
      } catch (_) {}
      var tip = document.getElementById('a2hs');
      if (tip) tip.hidden = true;
    });
  }
  btnContinue.addEventListener('click', async function () {
    if (continuedThisRun || isPractice() || isOneLife()) return;
    btnContinue.disabled = true;
    btnContinue.textContent = 'Loading revive…';
    var res = await Ads.showRewarded('continue');
    if (res && res.rewarded) {
      continuedThisRun = true;
      showToast('Revived! Keep flying 🛡', 1600, 'lucky');
      startRun(true);
    } else {
      showToast('Revive skipped');
      btnContinue.disabled = false;
      btnContinue.textContent = '▶ Revive · Continue (Ad stub)';
    }
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
  var btnHapticPreview = document.getElementById('btn-haptic-preview');
  if (btnHapticPreview) {
    btnHapticPreview.addEventListener('click', function () {
      haptic('power');
      showToast('Haptic pulse', 900);
    });
  }
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
    if (on) {
      FTAudio.unlock();
      voiceCue('oye_hoye'); // preview sample when enabling (speech; independent of mute)
    } else {
      showToast('Desi voice off', 900);
    }
  });
  if (btnVoicePreview) btnVoicePreview.addEventListener('click', function () {
    FTAudio.unlock();
    if (!FTAudio.isVoicePack()) {
      showToast('Turn Desi voice ON first', 1000);
      return;
    }
    var label = (FTAudio.preview && FTAudio.preview()) || FTAudio.voice('oye_hoye');
    if (label) showToast(label, 1200);
    else showToast('Oye hoye!', 1200);
  });

  async function tryUnlock(item, kind) {
    var cost = item.cost || 0;
    if (item.seasonal) {
      var packId = item.seasonal;
      if (FTStorage.isSeasonalUnlocked && FTStorage.isSeasonalUnlocked(packId)) {
        if (kind === 'hat') FTStorage.unlockHat(item.id);
        else if (kind === 'trail') FTStorage.unlockTrail(item.id);
        showToast(item.label + ' unlocked!');
        refreshGarage();
        return;
      }
      var pack = null;
      if (FTSkins.SEASONAL_PACKS) {
        for (var si = 0; si < FTSkins.SEASONAL_PACKS.length; si++) {
          if (FTSkins.SEASONAL_PACKS[si].id === packId) { pack = FTSkins.SEASONAL_PACKS[si]; break; }
        }
      }
      var bestNow = FTStorage.getBest();
      if (pack && FTSkins.seasonalEligible && FTSkins.seasonalEligible(pack, bestNow)) {
        FTStorage.unlockSeasonal(packId);
        showToast((pack.label || item.label) + ' pack unlocked!');
        refreshGarage();
        refreshCollection();
        return;
      }
      var need = pack && pack.milestoneScore ? pack.milestoneScore : '?';
      showToast('Seasonal — play in window or reach score ' + need);
      return;
    }
    if (item.unlockScore && FTStorage.getBest() >= item.unlockScore) {
      if (kind === 'bird') FTStorage.unlockBird(item.id);
      else if (kind === 'vehicle') FTStorage.unlockVehicle(item.id);
      else if (kind === 'env') FTStorage.unlockEnv(item.id);
      else if (kind === 'hat') FTStorage.unlockHat(item.id);
      else if (kind === 'trail') FTStorage.unlockTrail(item.id);
      else return;
      FTStorage.addToCollection(kind === 'hat' ? 'accessory' : kind, item.id);
      showToast(item.label + ' unlocked (best ' + item.unlockScore + '+)!');
      voiceCue('wah_ji');
      updateCoinHud();
      refreshGarage();
      refreshCollection();
      return;
    }
    if (cost <= 0) {
      if (item.unlockScore) showToast('Reach best ' + item.unlockScore + ' or earn coins');
      return;
    }
    if (FTStorage.getCoins() < cost) {
      var needMsg = 'Need ' + cost + ' coins';
      if (item.unlockScore) needMsg += ' (or best ' + item.unlockScore + '+)';
      showToast(needMsg);
      return;
    }
    if (!FTStorage.spendCoins(cost)) {
      var needMsg2 = 'Need ' + cost + ' coins';
      if (item.unlockScore) needMsg2 += ' (or best ' + item.unlockScore + '+)';
      showToast(needMsg2);
      return;
    }
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
    refreshCollection();
  }

  function onPickCosmetic(id, kind) {
    if (kind === 'bird') {
      birdId = id; FTStorage.setBird(id);
      var p = birdPass();
      if (p && p.label) showToast(p.label, 1400);
    }
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

  var garageFilter = 'all'; // all | theme | seasonal

  function applyGarageFilter() {
    var hint = document.getElementById('garage-filter-hint');
    if (hint) {
      hint.textContent = garageFilter === 'theme'
        ? 'Showing theme skins — Jungle · Mountains · Sea (+ matching vehicles)'
        : garageFilter === 'seasonal'
          ? 'Showing seasonal packs — unlock by date window or score'
          : 'Theme skins: Jungle · Mountains · Sea (score or coins)';
    }
    document.querySelectorAll('#screen-garage .skin-card').forEach(function (card) {
      var show = true;
      if (garageFilter === 'theme') show = card.dataset.theme === '1';
      else if (garageFilter === 'seasonal') show = card.dataset.seasonal === '1';
      card.hidden = !show;
    });
    // Hide empty section titles lightly via row emptiness
    document.querySelectorAll('#screen-garage .skin-row').forEach(function (row) {
      var any = false;
      row.querySelectorAll('.skin-card').forEach(function (c) { if (!c.hidden) any = true; });
      row.classList.toggle('filter-empty', !any);
    });
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
    document.querySelectorAll('.garage-filter').forEach(function (b) {
      var on = b.getAttribute('data-garage-filter') === garageFilter;
      b.classList.toggle('active', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    applyGarageFilter();
  }

  if (btnGarage) btnGarage.addEventListener('click', function () {
    hideAllScreens();
    if (screenGarage) screenGarage.hidden = false;
    refreshGarage();
  });
  document.querySelectorAll('.garage-filter').forEach(function (b) {
    b.addEventListener('click', function () {
      garageFilter = b.getAttribute('data-garage-filter') || 'all';
      document.querySelectorAll('.garage-filter').forEach(function (el) {
        var on = el === b;
        el.classList.toggle('active', on);
        el.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      applyGarageFilter();
    });
  });
  document.querySelectorAll('[data-close="garage"]').forEach(function (b) {
    b.addEventListener('click', function () { showMenu(); });
  });


  function refreshChallengeStageSelect() {
    if (!challengeStageList) return;
    var unlocked = Math.max(1, FTStorage.getChallengeStage() || 1);
    challengeStageList.innerHTML = '';
    CHALLENGE_STAGES.forEach(function (st, idx) {
      var open = st.id <= unlocked;
      var cleared = st.id < unlocked;
      var card = document.createElement('button');
      card.type = 'button';
      card.className = 'challenge-stage-card' + (open ? '' : ' locked') + (cleared ? ' cleared' : '') +
        (idx === challengeStageIdx && open ? ' current' : '');
      card.disabled = !open;
      card.innerHTML = '<span class="cs-num">' + (cleared ? '✓' : (open ? st.id : '🔒')) + '</span>' +
        '<span class="cs-body"><strong>' + st.label + '</strong><em>Target ' + st.target + ' · ' + st.area + '</em></span>';
      if (open) {
        card.addEventListener('click', function () {
          challengeStageIdx = idx;
          FTStorage.setChallengeStage(Math.max(FTStorage.getChallengeStage() || 1, st.id));
          if (challengeStagePanel) challengeStagePanel.hidden = true;
          startRun(false, 'challenge');
          showToast(st.label + ' · score ' + st.target, 1800, 'medal');
        });
      }
      challengeStageList.appendChild(card);
    });
  }

  function openChallengeStageSelect() {
    hideAllScreens();
    if (screenModes) screenModes.hidden = false;
    if (challengeStagePanel) {
      challengeStagePanel.hidden = false;
      refreshChallengeStageSelect();
    }
  }

  if (btnModes) btnModes.addEventListener('click', function () {
    hideAllScreens();
    if (screenModes) screenModes.hidden = false;
    if (challengeStagePanel) challengeStagePanel.hidden = true;
  });
  document.querySelectorAll('[data-close="modes"]').forEach(function (b) {
    b.addEventListener('click', function () { showMenu(); });
  });
  document.querySelectorAll('[data-mode]').forEach(function (b) {
    b.addEventListener('click', function () {
      var m = b.getAttribute('data-mode');
      FTAudio.unlock();
      if (m === 'challenge') {
        openChallengeStageSelect();
        return;
      }
      startRun(false, m);
      var names = {
        classic: 'Classic', timeattack: 'Time Attack 60s', hard: 'Hard',
        nocoin: 'No Coin', challenge: 'Challenge Stages', onelife: 'One Life',
        daily: 'Daily', practice: 'Practice'
      };
      showToast(names[m] || m);
      if (m === 'practice') showToast('Practice · follow the ghost path', 1800, 'lucky');
      if (m === 'timeattack') showToast('Time Attack · 60s — go!', 1600, 'medal');
      if (m === 'onelife') { updateLivesHud(); showToast('One Life · heart on HUD', 1600); }
    });
  });
  var btnChallengeCancel = document.getElementById('btn-challenge-cancel');
  if (btnChallengeCancel) btnChallengeCancel.addEventListener('click', function () {
    if (challengeStagePanel) challengeStagePanel.hidden = true;
  });

  function refreshMissions() {
    if (!missionsList) return;
    missionsList.innerHTML = '';
    FTStorage.getMissions().forEach(function (m) {
      var card = document.createElement('div');
      card.className = 'mission-card' + (m.done ? ' done' : '') + (m.claimed ? ' claimed' : '');
      var pct = Math.min(100, Math.max(0, Math.floor((Number(m.progress) / Math.max(1, Number(m.target))) * 100)));
      var rewardLabel = m.rewardType === 'fragment' ? (m.reward + ' ✦ frag') :
        m.rewardType === 'mystery' ? '🎁 Gift box' : ('🪙 ' + m.reward);
      var unitIco = { coins: '🪙', pipes: '🧱', nearmiss: '⚡', score: '🏆', m: '🛫', boxes: '🎁', perfect: '✨', combo: '🔥' };

      var title = document.createElement('div');
      title.className = 'mission-title';
      title.textContent = m.label || 'Mission';

      var bar = document.createElement('div');
      bar.className = 'mission-bar';
      var fill = document.createElement('span');
      fill.style.width = pct + '%';
      bar.appendChild(fill);

      var meta = document.createElement('div');
      meta.className = 'mission-meta';
      meta.textContent = (unitIco[m.unit] || '•') + ' ' + Math.min(m.progress, m.target) + ' / ' + m.target + ' · ' + rewardLabel;

      card.appendChild(title);
      card.appendChild(bar);
      card.appendChild(meta);

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn primary btn-sm';
      btn.textContent = m.claimed ? 'Claimed' : m.done ? 'Claim' : 'In progress';
      btn.disabled = !m.done || m.claimed;
      btn.addEventListener('click', function () {
        var r = FTStorage.claimMission(m.id);
        if (r) {
          if (r.mystery) {
            showToast('Mission: +' + (r.gifts || 1) + ' Gift 🎁');
            if (FTAudio.mystery) FTAudio.mystery();
            voiceGiftCue();
            // gifts already added in storage — detect spin unlock from delta
            detectSpinUnlockFromDelta(r.gifts || 1);
          } else if (r.fragments) showToast('+' + r.fragments + ' fragments!');
          else showToast('+' + r.coins + ' coins!');
          refreshMissions(); updateCoinHud();
        }
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
    var envs = FTStorage.getUnlockedEnvs();
    var pct = FTStorage.albumCompletionPct ? FTStorage.albumCompletionPct() : 0;
    var claimed = FTStorage.getAlbumClaimed ? FTStorage.getAlbumClaimed() : {};
    var frags = FTStorage.getFragments ? FTStorage.getFragments() : 0;
    collectionList.innerHTML = '';
    var summary = document.createElement('p');
    summary.className = 'hint';
    summary.textContent =
      'Birds ' + counts.birds.have + '/' + counts.birds.total +
      ' · Vehicles ' + counts.vehicles.have + '/' + counts.vehicles.total +
      ' · Acc ' + counts.accessories.have + '/' + counts.accessories.total +
      ' · Trails ' + counts.trails.have + '/' + counts.trails.total +
      ' · Areas ' + counts.areas.have + '/' + counts.areas.total +
      ' · Seasonals ' + (counts.seasonals ? counts.seasonals.have + '/' + counts.seasonals.total : '0/0') +
      ' · Challenges ' + counts.challenges.have + '/' + counts.challenges.total;
    collectionList.appendChild(summary);
    var prog = document.createElement('p');
    prog.className = 'hint';
    var giftsOwned = FTStorage.getGiftBoxes ? FTStorage.getGiftBoxes() : 0;
    var spinsAvail = FTStorage.getSpinCharges ? FTStorage.getSpinCharges() : 0;
    prog.textContent = 'Album ' + pct + '% · Fragments ✦ ' + frags + ' · 🎁 ' + giftsOwned + ' (' + spinsAvail + ' spins)';
    collectionList.appendChild(prog);
    var tiers = document.createElement('div');
    tiers.className = 'btn-row';
    [25, 50, 75, 100].forEach(function (t) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn ghost btn-sm';
      b.textContent = claimed[String(t)] ? (t + '% ✓') : (t + '% reward');
      b.disabled = !!claimed[String(t)] || pct < t;
      b.addEventListener('click', function () {
        var r = FTStorage.claimAlbumReward(t);
        if (r) { showToast(t + '% → +' + r.coins + ' coins!'); refreshCollection(); updateCoinHud(); }
      });
      tiers.appendChild(b);
    });
    collectionList.appendChild(tiers);
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
    var envLabels = {}; FTSkins.ENVS.forEach(function (b) { envLabels[b.id] = b.label; });
    section('Birds', birds, birdLabels);
    section('Vehicles', vehs, vehLabels);
    section('Accessories', hats, hatLabels);
    section('Trails', trails, trailLabels);
    section('Areas', envs, envLabels);
    var seasonalMap = FTStorage.getUnlockedSeasonals ? FTStorage.getUnlockedSeasonals() : {};
    var seasonalLabels = {};
    if (FTSkins.SEASONAL_PACKS) {
      FTSkins.SEASONAL_PACKS.forEach(function (p) {
        seasonalLabels[p.id] = (p.emoji ? p.emoji + ' ' : '') + p.label;
      });
    }
    section('Seasonals', seasonalMap, seasonalLabels);
    var chMap = {};
    var chLabels = {};
    for (var i = 0; i < CHALLENGE_STAGES.length; i++) {
      var st = CHALLENGE_STAGES[i];
      chLabels[String(st.id)] = st.label;
      chMap[String(st.id)] = counts.challenges.have >= st.id;
    }
    section('Challenges', chMap, chLabels);
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
    var best = lb.personalBest | 0;
    var bestMedal = FTStorage.getBestMedal ? FTStorage.getBestMedal() : null;
    var tiers = [
      { id: 'bronze', label: 'Bronze', need: MEDAL_BRONZE },
      { id: 'silver', label: 'Silver', need: MEDAL_SILVER },
      { id: 'gold', label: 'Gold', need: MEDAL_GOLD },
      { id: 'platinum', label: 'Platinum', need: MEDAL_PLATINUM }
    ];
    var order = { bronze: 1, silver: 2, gold: 3, platinum: 4, legend: 5 };
    var gallery = '<div class="medal-gallery" aria-label="Medal gallery">';
    tiers.forEach(function (t) {
      var earned = best >= t.need || (order[bestMedal] || 0) >= order[t.id];
      gallery += '<div class="medal-tile medal-' + t.id + (earned ? ' earned' : ' locked') + '" title="' +
        t.label + ' at ' + t.need + '+">' +
        '<div class="medal-disc" aria-hidden="true"></div>' +
        '<span>' + t.label + '</span>' +
        '<em>' + (earned ? '✓ ' + t.need + '+' : '🔒 ' + t.need) + '</em></div>';
    });
    gallery += '</div>';
    var rows = [
      ['Personal Best', lb.personalBest],
      ['Today Best', lb.todayBest],
      ['All-Time', lb.allTime],
      ['Best Distance (m)', lb.bestDistance],
      ['Best Combo', lb.bestCombo],
      ['Time Attack', lb.timeAttack],
      ['Hard Best', lb.hard],
      ['No Coin Best', lb.noCoin],
      ['One Life PB', lb.oneLife],
      ['Best Medal', bestMedal ? String(bestMedal) : '—']
    ];
    boardsList.innerHTML = '<h3 class="section-title">Medal Gallery</h3>' + gallery +
      '<h3 class="section-title">Scores</h3>' +
      rows.map(function (r) {
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
    var st = FTStorage.getStreak();
    var fire = st.day >= 5 ? '🔥🔥' : (st.day >= 3 ? '🔥' : '✨');
    var html = '<p class="hint streak-status">' + fire + ' Day <strong>' + st.day + '</strong> of 7' +
      (st.claimed ? ' · claimed today' : ' · claim ready!') + '</p>';
    html += '<div class="streak-progress" aria-hidden="true"><span style="width:' +
      Math.round((Math.max(0, st.day - (st.claimed ? 0 : 1)) / 7) * 100) + '%"></span></div>';
    html += '<div class="streak-days">';
    for (var i = 1; i <= 7; i++) {
      var r = st.rewards[i - 1];
      var done = i < st.day || (i === st.day && st.claimed);
      var current = i === st.day && !st.claimed;
      var label = r.type === 'coins' ? r.coins + '🪙' :
        r.type === 'rare_skin' ? '🐦+' + (r.coins || 0) :
        r.type === 'mystery' ? '🎁+' + (r.coins || 0) : '?';
      html += '<div class="streak-day' + (done ? ' done' : '') + (current ? ' current' : '') + '">' +
        '<span>D' + i + '</span><strong>' + label + '</strong></div>';
    }
    html += '</div>';
    streakBody.innerHTML = html;
    var btn = document.getElementById('btn-claim-streak');
    if (btn) {
      btn.disabled = !st.canClaim;
      btn.classList.toggle('btn-streak-ready', !!st.canClaim);
      btn.textContent = st.claimed ? 'Claimed today' : ('Claim Day ' + st.day + ' 🔥');
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
      showToast('Day ' + r.day + ': rare skin ' + r.unlocked + '!', 2200, 'medal');
      voiceCue('shabaash');
      if (typeof spawnConfettiBurst === 'function') spawnConfettiBurst(W / 2, H * 0.35, 20);
    } else if (r.type === 'mystery') {
      showToast('Day ' + r.day + ': +' + r.coins + ' 🪙 + gift 🎁', 2000, 'gift');
      voiceGiftCue();
      detectSpinUnlockFromDelta(r.gifts || 1);
    } else {
      showToast('Streak Day ' + r.day + ': +' + r.coins + ' 🪙', 1800, 'medal');
    }
    updateCoinHud();
    refreshStreak();
  });
  document.querySelectorAll('[data-close="streak"]').forEach(function (b) {
    b.addEventListener('click', function () { showMenu(); });
  });

  if (btnDeathCollection) btnDeathCollection.addEventListener('click', function () {
    hideAllScreens();
    if (screenCollection) screenCollection.hidden = false;
    refreshCollection();
  });
  if (btnMysteryOk) btnMysteryOk.addEventListener('click', function () {
    if (mysteryOverlay) mysteryOverlay.hidden = true;
  });
  if (btnMysteryAd) btnMysteryAd.addEventListener('click', async function () {
    if (mysteryAdUsed || state !== 'dead') return;
    var res = await Ads.showRewarded('mystery-box');
    if (res && res.rewarded) {
      mysteryAdUsed = true;
      btnMysteryAd.disabled = true;
      btnMysteryAd.textContent = 'Gift claimed';
      grantMysteryReward(Math.random);
      if (runGiftsEl) {
        var cur = parseInt(runGiftsEl.textContent.replace(/\D/g, ''), 10) || 0;
        runGiftsEl.textContent = '+' + (cur + 1);
      }
    } else showToast('Gift skipped');
  });
  if (btnGifts) btnGifts.addEventListener('click', function () { openGiftsScreen(); });
  if (btnCollectionGifts) btnCollectionGifts.addEventListener('click', function () { openGiftsScreen(); });
  document.querySelectorAll('[data-close="gifts"]').forEach(function (b) {
    b.addEventListener('click', function () {
      // 3.11: don't abandon mid-spin (charges already spent; grant happens on land)
      if (wheelSpinning || spinQueueActive) {
        showToast('Wait for the wheel to land…', 1400, 'gift');
        return;
      }
      showMenu();
    });
  });
  if (btnSpinOnce) btnSpinOnce.addEventListener('click', function () { doSpinOnce(); });
  if (btnSpinAll) btnSpinAll.addEventListener('click', function () { doSpinAll(); });

  function setGuideLang(lang) {
    lang = lang || 'en';
    document.querySelectorAll('.guide-tab').forEach(function (t) {
      var on = t.getAttribute('data-guide-lang') === lang;
      t.classList.toggle('active', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    document.querySelectorAll('[data-guide-panel]').forEach(function (p) {
      p.hidden = p.getAttribute('data-guide-panel') !== lang;
    });
  }
  if (btnGuide) btnGuide.addEventListener('click', function () {
    hideAllScreens();
    if (screenGuide) screenGuide.hidden = false;
    setGuideLang('en');
  });
  document.querySelectorAll('.guide-tab').forEach(function (t) {
    t.addEventListener('click', function () {
      setGuideLang(t.getAttribute('data-guide-lang') || 'en');
    });
  });
  document.querySelectorAll('[data-close="guide"]').forEach(function (b) {
    b.addEventListener('click', function () { showMenu(); });
  });
  if (btnSpinUnlockGo) btnSpinUnlockGo.addEventListener('click', function () {
    dismissSpinUnlockPopup();
    openGiftsScreen();
  });
  if (btnSpinUnlockDismiss) btnSpinUnlockDismiss.addEventListener('click', function () {
    dismissSpinUnlockPopup();
  });

  // Boot
  birdId = FTStorage.getBird();
  vehicleId = FTStorage.getVehicle();
  envId = FTStorage.getEnv();
  weatherId = FTStorage.getWeather();
  if (weatherId === 'sunny') weatherId = 'clear';
  hatId = FTStorage.getHat();
  trailId = FTStorage.getTrail();
  sensitivity = FTStorage.getSensitivity();
  reduceMotion = FTStorage.getReduceMotion();
  hapticsOn = FTStorage.getHaptics();
  FTAudio.setVoicePack(FTStorage.getVoicePack());
  applyReduceMotionClass();
  best = FTStorage.getBest();
  FTStorage.checkEnvMilestones(best);
  if (FTStorage.checkSeasonalUnlocks) FTStorage.checkSeasonalUnlocks(best);
  syncMuteBtn();
  initClouds();
  initRain();
  resetBird();
  resetPipes();
  updateBestUI();
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  window.addEventListener('orientationchange', function () { setTimeout(resizeCanvas, 100); });

  function updateOfflineBanner() {
    var el = document.getElementById('offline-banner');
    if (!el) return;
    var offline = (typeof navigator !== 'undefined' && navigator.onLine === false);
    el.hidden = !offline;
    if (offline) el.classList.add('offline-show');
    else el.classList.remove('offline-show');
  }
  function hideBootSplash() {
    var splash = document.getElementById('boot-splash');
    if (!splash || splash.hidden) return;
    splash.classList.add('splash-hide');
    setTimeout(function () {
      splash.hidden = true;
      splash.setAttribute('aria-hidden', 'true');
    }, 450);
  }
  window.addEventListener('online', updateOfflineBanner);
  window.addEventListener('offline', updateOfflineBanner);
  updateOfflineBanner();
  showMenu();
  loop(performance.now());
  requestAnimationFrame(function () { requestAnimationFrame(hideBootSplash); });
})();
