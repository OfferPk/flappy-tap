/**
 * Urr Jaa! v3.51.0-urrjaa — Reduced-motion respect, score-card screenshot share, bird shadow polish,
 * soft landing dust, credits/version in settings, bugfixes.
 * KEEP ALL ≤3.22 incl. 15s Mystery Spin once + Close (X) + large buttons + seasonal hint.
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
  const FLAP_IMPULSE = -430;      // snappier tap response (3.11)
  const TERMINAL_V = 620;
  const FLAP_COOLDOWN = 0.05;     // 3.18: snappier mobile tap cadence (was 0.07)
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
  let nearMissEdgeFlash = 0; // 3.28 edge flash intensity
  let nearMissEdgeSide = 'top'; // top|bottom|left|right
  var dailyCountdownTimer = 0;
  let bossPulse = 0;
  let perfectRailFlash = 0; // 0–1 visual after PERFECT
  let practiceGhost = null; // {x,y,rot} for Practice mode guide
  let practiceGhostOpacity = 0.38; // 3.24 Settings
  let coachStep = 0;
  let coachActive = false;
  let magnetPullAcc = 0; // 3.24 VFX throttle
  var turboTrail = []; // 3.25 afterimages {x,y,rot}
  var ghostSilTrail = []; // 3.25 ghost silhouettes
  var garageSortMode = 'owned';
  var replayBuf = []; // 3.26 last ~5s stub {x,y,rot,t}
  var replaySampleAcc = 0;
  var deathFreezeCanvas = null;
  var deathCamZoom = 0;
  var REPLAY_WINDOW_MS = 5000;
  var replaySnapshot = []; // 3.27 frozen copy for death-screen viz
  var envFade = 0;
  var envFadeFrom = null; // previous area id
  var lastEnvArea = null;
  var deathFreezeMs = 900;
  var replayVizRaf = 0;



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
  var lastLandingDustAt = 0;
  let clouds = [];
  var _cloudsSorted = null;
  var _cloudsSortedLen = 0;
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
  var comboMilestonesHit = Object.create(null); // 3.18 milestone toasts
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
  let hapticIntensity = 'normal'; // 3.29 low|normal|high
  let bossWarnActive = false;
  let bossWarnPulse = 0;
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
  var lastHitCause = 'pipe'; // pipe | ground | ceiling | traffic (3.17 death tip)
  let nextWeatherAt = 90;
  let runStartTs = 0;
  let luckyCooldownUntil = 0;
  let mouthChirpUntil = 0; // visual mouth open (chirp) until ts
  let phaseSimple = true; // first ~10s / early classic: simple patterns

  const hud = document.getElementById('hud');
  const scoreEl = document.getElementById('score-display');
  const comboEl = document.getElementById('combo-display');
  const comboMeterEl = document.getElementById('combo-meter');
  const comboMeterFillEl = document.getElementById('combo-meter-fill');
  const modeBadgeEl = document.getElementById('mode-badge');
  const powerHudEl = document.getElementById('power-hud');
  const magnetHudEl = document.getElementById('magnet-hud');
  const resumeCountdownEl = document.getElementById('resume-countdown');
  const resumeCountdownNumEl = document.getElementById('resume-countdown-num');
  const resumeCountdownChk = document.getElementById('resume-countdown-toggle');
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
  const hapticIntensitySel = document.getElementById('haptic-intensity');
  const voiceToggleChk = document.getElementById('voice-toggle');
  const quietNightChk = document.getElementById('quiet-night-toggle');
  const areaMusicChk = document.getElementById('area-music-toggle');
  const nightAmbVolSel = document.getElementById('night-amb-vol');
  const btnNightAmbPreview = document.getElementById('btn-night-amb-preview');
  const swipeDismissChk = document.getElementById('swipe-dismiss-toggle');
  const confettiIntensitySel = document.getElementById('confetti-intensity');
  const largeButtonsChk = document.getElementById('large-buttons-toggle');
  const ghostOpacitySlider = document.getElementById('ghost-opacity-slider');
  const ghostOpacityValueEl = document.getElementById('ghost-opacity-value');
  const coachMarksEl = document.getElementById('coach-marks');
  const coachTextEl = document.getElementById('coach-text');
  const coachDotsEl = document.getElementById('coach-dots');
  const btnCoachNext = document.getElementById('btn-coach-next');
  const btnCoachSkip = document.getElementById('btn-coach-skip');
  const garageSortSel = document.getElementById('garage-sort');
  const deathFreezeThumb = document.getElementById('death-freeze-thumb');
  const btnReplayStub = document.getElementById('btn-replay-stub');
  const replayVizCanvas = document.getElementById('replay-viz-canvas');
  const deathFreezeWrap = document.getElementById('death-freeze-wrap');
  const deathFreezeBadge = document.getElementById('death-freeze-badge');
  const dailyCountdownEl = document.getElementById('daily-reset-countdown');
  const dailyCountdownModesEl = document.getElementById('daily-reset-countdown-modes');
  const btnResetPrefs = document.getElementById('btn-reset-prefs');
  const resetPrefsConfirmEl = document.getElementById('reset-prefs-confirm');
  const btnResetPrefsYes = document.getElementById('btn-reset-prefs-yes');
  const btnResetPrefsNo = document.getElementById('btn-reset-prefs-no');
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
    toastEl.hidden = false;
    toastEl.classList.remove('toast-pop', 'toast-close', 'toast-lucky', 'toast-gift', 'toast-perfect', 'toast-medal', 'toast-claim', 'toast-sync', 'toast-undo', 'toast-undo-confirm');
    if (kind === 'undo') {
      toastEl.textContent = '';
      var span = document.createElement('span');
      span.className = 'toast-undo-msg';
      span.textContent = msg;
      toastEl.appendChild(span);
      var actions = document.createElement('span');
      actions.className = 'toast-undo-actions';
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'toast-undo-btn';
      btn.id = 'toast-undo-btn';
      btn.textContent = 'Undo';
      btn.setAttribute('aria-label', 'Undo equip');
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        undoLastEquip();
      });
      actions.appendChild(btn);
      var clearBtn = document.createElement('button');
      clearBtn.type = 'button';
      clearBtn.className = 'toast-undo-clear';
      clearBtn.id = 'toast-undo-clear';
      clearBtn.textContent = 'Clear';
      clearBtn.setAttribute('aria-label', 'Clear undo stack');
      clearBtn.title = 'Clear all undo steps';
      clearBtn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        requestClearEquipUndoStack();
      });
      actions.appendChild(clearBtn);
      toastEl.appendChild(actions);
      toastEl.classList.add('toast-undo');
    } else {
      toastEl.textContent = msg;
      if (kind === 'undo-confirm') {
        toastEl.textContent = '';
        var cspan = document.createElement('span');
        cspan.className = 'toast-undo-msg';
        cspan.textContent = msg;
        toastEl.appendChild(cspan);
        var cact = document.createElement('span');
        cact.className = 'toast-undo-actions';
        var yes = document.createElement('button');
        yes.type = 'button';
        yes.className = 'toast-undo-clear toast-undo-confirm-yes';
        yes.id = 'toast-undo-confirm-yes';
        yes.textContent = 'Yes, clear';
        yes.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          clearEquipUndoStack({ confirmed: true });
        });
        var no = document.createElement('button');
        no.type = 'button';
        no.className = 'toast-undo-btn toast-undo-confirm-no';
        no.id = 'toast-undo-confirm-no';
        no.textContent = 'Keep';
        no.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          cancelClearEquipUndo();
        });
        cact.appendChild(yes);
        cact.appendChild(no);
        toastEl.appendChild(cact);
        toastEl.classList.add('toast-undo', 'toast-undo-confirm');
      } else if (kind === 'close' || kind === 'lucky' || kind === 'gift' || kind === 'perfect' || kind === 'medal' || kind === 'claim' || kind === 'sync') {
        toastEl.classList.add('toast-' + kind);
      }
    }
    void toastEl.offsetWidth;
    toastEl.classList.add('toast-pop');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function () {
      toastEl.hidden = true;
      toastEl.classList.remove('toast-close', 'toast-lucky', 'toast-gift', 'toast-perfect', 'toast-medal', 'toast-claim', 'toast-sync', 'toast-undo', 'toast-undo-confirm');
      if (kind === 'undo' || kind === 'undo-confirm') toastEl.textContent = '';
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
    var per = (FTStorage.GIFTS_PER_SPIN || 10);
    var toward = total % per;
    if (afterSpins > beforeSpins) {
      pendingSpinUnlockPopup = true;
      spinUnlockShownThisUnlock = false;
      if (state === 'playing') {
        showToast('🎰 Spin ready! ' + afterSpins + ' charge' + (afterSpins === 1 ? '' : 's') + ' · ' + per + '/' + per, 2000, 'gift');
      } else {
        maybeShowSpinUnlockPopup();
      }
    } else if (state === 'playing') {
      // 3.29/3.30: mid-run gift→spin progress (throttle spam)
      var shown = toward === 0 ? per : toward;
      var msg = '🎁 ' + shown + ' / ' + per + ' to next spin';
      var tnow = performance.now();
      if (!noteGiftAdd._lastToastAt || tnow - noteGiftAdd._lastToastAt > 450 || noteGiftAdd._lastMsg !== msg) {
        noteGiftAdd._lastToastAt = tnow;
        noteGiftAdd._lastMsg = msg;
        showToast(msg, 1100, 'gift');
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

  function hapticScale() {
    if (hapticIntensity === 'low') return 0.55;
    if (hapticIntensity === 'high') return 1.45;
    return 1;
  }
  function scaleVibePattern(pat, mul) {
    if (typeof pat === 'number') return Math.max(1, Math.round(pat * mul));
    return pat.map(function (n) { return Math.max(1, Math.round(n * mul)); });
  }
  function haptic(kind) {
    if (!hapticsOn) return;
    try {
      if (!navigator.vibrate) return;
      var mul = hapticScale();
      var pat;
      if (kind === 'death') pat = [40, 30, 80];
      else if (kind === 'power') pat = 18;
      else if (kind === 'gift') pat = [12, 40, 18, 40, 28];
      else if (kind === 'nearmiss') pat = 10;
      else if (kind === 'coin') pat = 8;
      else if (kind === 'boss') pat = [30, 40, 30, 40, 50];
      else if (kind === 'perfect') pat = [6, 18, 10]; // 3.34 soft double-tap
      else pat = 12;
      navigator.vibrate(scaleVibePattern(pat, mul));
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
    _particleBudgetCached = -1; // 3.50 refresh perf cache on resize

    var app = document.getElementById('app');
    if (!app) return;
    var landscape = false;
    try { landscape = window.matchMedia && window.matchMedia('(orientation: landscape)').matches; } catch (_) {}
    document.documentElement.classList.toggle('is-landscape', !!landscape);
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
    _cloudsSorted = null;
    _cloudsSortedLen = 0;
    // 3.37: three parallax layers — far / mid / near
    var layers = [
      { n: 4, depth: 0.22, y0: 30, y1: 120, w0: 50, w1: 90, a: 0.45 },
      { n: 4, depth: 0.45, y0: 50, y1: 160, w0: 36, w1: 70, a: 0.7 },
      { n: 3, depth: 0.75, y0: 70, y1: 200, w0: 28, w1: 55, a: 0.95 }
    ];
    layers.forEach(function (L) {
      for (var i = 0; i < L.n; i++) {
        clouds.push({
          x: Math.random() * (W + 120) - 40,
          y: L.y0 + Math.random() * (L.y1 - L.y0),
          s: L.depth * (0.85 + Math.random() * 0.3),
          w: L.w0 + Math.random() * (L.w1 - L.w0),
          depth: L.depth,
          a: L.a * (0.85 + Math.random() * 0.2),
          bob: Math.random() * Math.PI * 2
        });
      }
    });
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

  
  var COMBO_MILESTONES = [5, 10, 15, 20, 25, 30, 40, 50];

function updateComboMeter(visible) {
    if (!comboMeterEl || !comboMeterFillEl) return;
    if (!visible || state !== 'playing') {
      comboMeterEl.hidden = true;
      return;
    }
    // Progress toward next COMBO milestone (pipe combo primary, else coin)
    var c = Math.max(combo, coinCombo, nearMissStreak);
    var next = 5;
    for (var i = 0; i < COMBO_MILESTONES.length; i++) {
      if (c < COMBO_MILESTONES[i]) { next = COMBO_MILESTONES[i]; break; }
      next = COMBO_MILESTONES[i] + 5;
    }
    var prev = 0;
    for (var j = 0; j < COMBO_MILESTONES.length; j++) {
      if (COMBO_MILESTONES[j] <= c) prev = COMBO_MILESTONES[j];
      else break;
    }
    var span = Math.max(1, next - prev);
    var pct = Math.max(0, Math.min(100, ((c - prev) / span) * 100));
    if (c <= 0) pct = 0;
    comboMeterEl.hidden = false;
    comboMeterFillEl.style.width = pct + '%';
    comboMeterEl.classList.toggle('combo-meter-hot', c >= 5 || riskyActive());
    comboMeterEl.setAttribute('aria-valuenow', String(c));
    comboMeterEl.setAttribute('aria-valuemax', String(next));
  }

  function updateComboUI() {
    if (!comboEl) return;
    if (performance.now() < bannerUntil && bannerText) {
      comboEl.hidden = false;
      comboEl.textContent = bannerText;
      comboEl.classList.add('combo-hot');
      updateComboMeter(true);
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
      updateComboMeter(true);
    } else {
      comboEl.hidden = true;
      updateComboMeter(false);
    }
  }


  function isNightAmbience() {
    var a = typeof activeArea === 'function' ? activeArea() : envId;
    var w = typeof effectiveWeather === 'function' ? effectiveWeather() : weatherId;
    return a === 'night' || a === 'quetta' || w === 'night' || w === 'storm';
  }
  function syncQuietNight() {
    if (!FTAudio || !FTAudio.setQuietMode) return;
    var want = !!(FTStorage.isQuietNight && FTStorage.isQuietNight()) && isNightAmbience() && state === 'playing';
    FTAudio.setQuietMode(want);
  }
  function syncNightAmbVol() {
    var lvl = (FTStorage.getNightAmbVol && FTStorage.getNightAmbVol()) || 'normal';
    if (FTAudio && FTAudio.setNightAmbienceVolume) FTAudio.setNightAmbienceVolume(lvl);
    return lvl;
  }

  function maybeComboMilestone(c) {
    if (!c || state !== 'playing') return;
    for (var i = 0; i < COMBO_MILESTONES.length; i++) {
      var m = COMBO_MILESTONES[i];
      if (c === m && !comboMilestonesHit[m]) {
        comboMilestonesHit[m] = 1;
        showToast('🔥 Combo ' + m + '!', 1300, 'medal');
        showBanner('COMBO ' + m + '!', 900);
        if (FTAudio.combo) FTAudio.combo();
        haptic('gift');
        if (!reduceMotion && bird) spawnConfettiBurst(bird.x, bird.y - 24, m >= 20 ? 16 : 10);
        if (m >= 20) voiceCue('shabaash');
        else if (m >= 10) voiceCue('wah_ji');
        break;
      }
    }
  }

  function powerRemainSec(until) {
    return Math.max(0, Math.ceil((until - performance.now()) / 1000));
  }
  function powerExpiring(until, warnMs) {
    warnMs = warnMs == null ? 1200 : warnMs;
    var left = until - performance.now();
    return left > 0 && left <= warnMs;
  }
  function updatePowerHud() {
    if (!powerHudEl) return;
    var now = performance.now();
    var bits = [];
    if (shieldActive) bits.push({ t: '🛡 Shield', k: 'shield', exp: false });
    if (now < slowMoUntil) bits.push({ t: '⏱ ' + powerRemainSec(slowMoUntil) + 's', k: 'slowmo', exp: powerExpiring(slowMoUntil) });
    if (now < magnetUntil) bits.push({ t: '🧲 ' + powerRemainSec(magnetUntil) + 's', k: 'magnet', exp: powerExpiring(magnetUntil) });
    if (now < turboUntil) bits.push({ t: '⚡ ' + powerRemainSec(turboUntil) + 's', k: 'turbo', exp: powerExpiring(turboUntil) });
    if (now < ghostUntil) bits.push({ t: '👻 ' + powerRemainSec(ghostUntil) + 's', k: 'ghost', exp: powerExpiring(ghostUntil) });
    if (riskyActive()) bits.push({ t: '🎯x3', k: 'risky', exp: powerExpiring(riskyUntil, 1500) });
    if (isHard()) bits.push({ t: '🔥', k: 'hard', exp: false });
    if (isNoCoin()) bits.push({ t: '🚫🪙', k: 'nocoin', exp: false });
    if (isOneLife()) bits.push({ t: '1️⃣', k: 'onelife', exp: false });
    // 3.37: dedicated coin magnet HUD icon near coins
    if (magnetHudEl) {
      var magOn = now < magnetUntil;
      magnetHudEl.hidden = !magOn;
      if (magOn) {
        magnetHudEl.classList.toggle('magnet-expiring', powerExpiring(magnetUntil));
        magnetHudEl.textContent = '🧲 ' + powerRemainSec(magnetUntil) + 's';
      }
    }
    var coinHud = document.getElementById('coin-hud');
    if (coinHud) coinHud.classList.toggle('coin-magnet-on', now < magnetUntil);
    if (bits.length) {
      var fp = bits.map(function (b) { return b.t + (b.exp ? '!' : ''); }).join('|');
      if (updatePowerHud._fp === fp && !powerHudEl.hidden) return; // 3.30 perf: skip DOM rebuild
      updatePowerHud._fp = fp;
      powerHudEl.hidden = false;
      powerHudEl.innerHTML = '';
      bits.forEach(function (b) {
        var chip = document.createElement('span');
        chip.className = 'power-chip power-' + (b.k || 'generic') + (b.exp ? ' power-expiring' : '');
        if (b.exp) chip.setAttribute('aria-label', b.t + ' expiring soon');
        chip.textContent = b.t;
        powerHudEl.appendChild(chip);
      });
    } else {
      updatePowerHud._fp = '';
      powerHudEl.hidden = true;
    }
  }

  function refreshDailyCountdown() {
    if (!FTStorage.msUntilDailyReset || !FTStorage.formatDailyCountdown) return;
    var ms = FTStorage.msUntilDailyReset();
    var txt = 'Daily resets in ' + FTStorage.formatDailyCountdown(ms);
    if (dailyCountdownEl) {
      dailyCountdownEl.textContent = txt;
      dailyCountdownEl.hidden = false;
    }
    if (dailyCountdownModesEl) {
      dailyCountdownModesEl.textContent = '⏱ ' + txt;
      dailyCountdownModesEl.hidden = false;
    }
    // enrich daily mode badge while playing
    if (playMode === 'daily' && modeBadgeEl && !modeBadgeEl.hidden) {
      modeBadgeEl.textContent = 'Daily · resets ' + FTStorage.formatDailyCountdown(ms);
    }
  }
  function startDailyCountdownTicker() {
    refreshDailyCountdown();
    if (dailyCountdownTimer) clearInterval(dailyCountdownTimer);
    dailyCountdownTimer = setInterval(refreshDailyCountdown, 1000);
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
      var wasLost = livesHudEl.classList.contains('lives-lost');
      if (lost) {
        livesHudEl.innerHTML = '<span class="life-heart life-lost life-break" aria-hidden="true">❤️</span><span class="life-label">Gone</span>';
      } else {
        livesHudEl.innerHTML = '<span class="life-heart">❤️</span><span class="life-label">×1</span>';
      }
      livesHudEl.classList.toggle('lives-lost', !!lost);
      if (lost && !wasLost) {
        livesHudEl.classList.remove('life-loss-pop');
        void livesHudEl.offsetWidth;
        livesHudEl.classList.add('life-loss-pop');
      }
    } else {
      livesHudEl.hidden = true;
      livesHudEl.classList.remove('lives-lost', 'life-loss-pop');
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


  function applyLargeButtons(on) {
    document.documentElement.classList.toggle('large-buttons', !!on);
  }

  /** 3.22: hint when a seasonal pack window is active (auto-theme / unlock nudge). */
  function refreshSeasonalHint() {
    var el = document.getElementById('seasonal-hint');
    if (!el || !FTSkins || !FTSkins.SEASONAL_PACKS) return;
    var best = FTStorage.getBest ? FTStorage.getBest() : 0;
    var now = new Date();
    var active = null;
    for (var i = 0; i < FTSkins.SEASONAL_PACKS.length; i++) {
      var p = FTSkins.SEASONAL_PACKS[i];
      if (!p) continue;
      var inWin = FTSkins.seasonalInWindow ? FTSkins.seasonalInWindow(p, now) : false;
      if (!inWin) continue;
      var unlocked = FTStorage.isSeasonalUnlocked && FTStorage.isSeasonalUnlocked(p.id);
      active = { pack: p, unlocked: !!unlocked };
      break;
    }
    if (!active) {
      el.hidden = true;
      el.textContent = '';
      return;
    }
    var emoji = active.pack.emoji || '📅';
    if (active.unlocked) {
      el.textContent = emoji + ' ' + active.pack.label + ' is live — equip in Garage → Seasonals';
    } else {
      var need = active.pack.milestoneScore || '?';
      el.textContent = emoji + ' ' + active.pack.label + ' window open — unlock in Garage (or best ' + need + '+)';
    }
    el.hidden = false;
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

  /** 3.44: star-coin HUD ping */
  function pingCoinHudStar() {
    if (!coinHudEl) return;
    coinHudEl.classList.remove('coin-hud-star-ping');
    void coinHudEl.offsetWidth;
    coinHudEl.classList.add('coin-hud-star-ping');
    clearTimeout(pingCoinHudStar._t);
    pingCoinHudStar._t = setTimeout(function () {
      if (coinHudEl) coinHudEl.classList.remove('coin-hud-star-ping');
    }, reduceMotion ? 400 : 950);
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
      // 3.19 idle blink polish: ~2.4–3.6s cadence, soft open/close, occasional double-blink
      var blinkPeriod = 2.55 + (Math.sin(t * 0.17) * 0.5 + 0.5) * 0.9; // 2.55–3.45s
      var blinkCycle = t % blinkPeriod;
      var closeStart = blinkPeriod - 0.16;
      eyeBlink = 0;
      if (blinkCycle > closeStart) {
        var u = (blinkCycle - closeStart) / 0.16;
        // ease in-out lid
        eyeBlink = u < 0.45 ? (u / 0.45) : (u < 0.7 ? 1 : Math.max(0, 1 - (u - 0.7) / 0.3));
      }
      // Occasional double-blink (~every 4th cycle)
      var cycleIdx = Math.floor(t / blinkPeriod);
      if ((cycleIdx % 4) === 2 && blinkCycle < 0.22) {
        var u2 = blinkCycle / 0.22;
        eyeBlink = Math.max(eyeBlink, u2 < 0.4 ? u2 / 0.4 : Math.max(0, 1 - (u2 - 0.4) / 0.6));
      }
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
    // 3.23: shadow strength from height above ground (closer = larger/darker)
    var shadowProx = 0.55;
    if (bird) {
      var gnd = H - GROUND_H;
      var air = Math.max(0, gnd - (bird.y + bird.h / 2));
      shadowProx = Math.max(0.15, Math.min(1, 1 - air / 220));
    }
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
      vehicleTheme: vehTheme,
      shadowProx: shadowProx
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
      // 3.17: more patterned skins even in easy phase
      var simple = ['pipe', 'pipe', 'tiled', 'terracotta', 'lattice', 'stripe', 'mosaic', 'signboard', 'tree', 'kite'];
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

  function popScore(amount, x, y, opts) {
    if (reduceMotion) return;
    opts = opts || {};
    var txt = (typeof amount === 'string') ? amount : ('+' + amount);
    if (opts.coin && typeof amount === 'number') txt = '+' + amount + ' 🪙';
    scorePops.push({
      text: txt,
      x: x == null ? bird.x : x,
      y: y == null ? bird.y - 20 : y,
      life: opts.coin ? 0.85 : 0.7,
      max: opts.coin ? 0.85 : 0.7,
      kind: opts.coin ? 'coin' : (opts.kind || 'score'),
      scale: opts.coin ? 1.15 : 1
    });
    if (scoreEl) {
      scoreEl.classList.remove('score-bump', 'score-juice', 'score-juice-big', 'score-milestone');
      void scoreEl.offsetWidth;
      scoreEl.classList.add('score-bump', 'score-juice');
      var big = !!opts.coin || (typeof amount === 'number' && amount >= 3) ||
        (typeof amount === 'string' && /PERFECT|CLOSE|COMBO|x[3-9]/i.test(amount));
      if (big) scoreEl.classList.add('score-juice-big');
    }
  }

  function setScore(n) {
    var prev = score;
    score = n;
    if (scoreEl) {
      scoreEl.textContent = String(score);
      if (score > prev) {
        var hitMilestone = (score >= 10 && prev < 10) || (score >= 25 && prev < 25) ||
          (score >= 50 && prev < 50) || (score >= 100 && prev < 100) ||
          (score >= 150 && prev < 150) || (score % 25 === 0);
        scoreEl.classList.remove('score-bump', 'score-juice', 'score-juice-big', 'score-milestone');
        void scoreEl.offsetWidth;
        scoreEl.classList.add('score-bump', 'score-juice');
        if ((score - prev) >= 3 || hitMilestone) scoreEl.classList.add('score-juice-big');
        if (hitMilestone) scoreEl.classList.add('score-milestone');
      }
    }
    difficultyFor(score);
    if (!hitThisRun) cleanScorePeak = Math.max(cleanScorePeak, score);
  }

  function showMedalUI(sc) {
    var m = medalFor(sc);
    if (!medalEl) return;
    if (!m || isPractice()) { medalEl.hidden = true; return; }
    medalEl.hidden = false;
    medalEl.className = 'medal medal-' + m + ' medal-pop medal-shine';
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


  /** 3.23: rasterize share card to PNG for image share / download. */
  function buildShareCardCanvas() {
    var c = document.createElement('canvas');
    c.width = 720;
    c.height = 920;
    var x = c.getContext('2d');
    // background
    var gbg = x.createLinearGradient(0, 0, 0, 920);
    gbg.addColorStop(0, '#1a2744');
    gbg.addColorStop(1, '#0b1026');
    x.fillStyle = gbg;
    x.fillRect(0, 0, 720, 920);
    // accent bar
    x.fillStyle = '#4ecdc4';
    x.fillRect(0, 0, 720, 10);
    x.fillStyle = '#ffd93d';
    x.fillRect(0, 910, 720, 10);
    x.fillStyle = '#fff';
    x.font = 'bold 42px system-ui, sans-serif';
    x.textAlign = 'center';
    x.fillText('Urr Jaa!', 360, 90);
    x.font = '28px system-ui, sans-serif';
    x.fillStyle = '#ffe082';
    x.fillText('اڑ جا!', 360, 135);
    var modeLabel = MODE_SHARE_LABELS[playMode] || playMode;
    x.fillStyle = '#94a3b8';
    x.font = '22px system-ui, sans-serif';
    x.fillText(modeLabel, 360, 190);
    // score
    x.fillStyle = '#ffd93d';
    x.font = 'bold 140px system-ui, sans-serif';
    x.fillText(String(score), 360, 360);
    x.fillStyle = '#cbd5e1';
    x.font = '24px system-ui, sans-serif';
    x.fillText('SCORE', 360, 400);
    var m = medalFor(score);
    var lines = [
      Math.floor(metersFlown) + ' m flown',
      'Best ' + FTStorage.getBest(),
      (runPerfects ? ('✨ ' + runPerfects + ' PERFECT') : 'Keep chaining PERFECT'),
      (m ? ('Medal: ' + m.toUpperCase()) : 'Medal: —')
    ];
    x.fillStyle = '#e2e8f0';
    x.font = '26px system-ui, sans-serif';
    for (var i = 0; i < lines.length; i++) {
      x.fillText(lines[i], 360, 480 + i * 42);
    }
    x.fillStyle = '#4ecdc4';
    x.font = 'bold 22px system-ui, sans-serif';
    x.fillText('offerpk.github.io/flappy-tap', 360, 740);
    x.fillStyle = '#64748b';
    x.font = '18px system-ui, sans-serif';
    x.fillText('Offline one-tap fly · v3.24.0-urrjaa', 360, 780);
    return c;
  }

  function shareScoreCardImage() {
    try {
      var c = buildShareCardCanvas();
      var preview = document.getElementById('share-card-image');
      if (preview) {
        preview.src = c.toDataURL('image/png');
        preview.hidden = false;
      }
      c.toBlob(function (blob) {
        if (!blob) {
          showToast('Could not build image', 1200);
          return;
        }
        var file = new File([blob], 'urr-jaa-score.png', { type: 'image/png' });
        var text = buildShareText();
        if (navigator.canShare && navigator.canShare({ files: [file] }) && navigator.share) {
          navigator.share({
            files: [file],
            title: 'Urr Jaa!',
            text: text
          }).catch(function () {
            downloadShareImage(c);
          });
        } else if (navigator.share) {
          // fallback: text share + offer download
          downloadShareImage(c);
          shareRunSummary();
        } else {
          downloadShareImage(c);
          copyShareText(text);
        }
      }, 'image/png');
    } catch (err) {
      showToast('Share image unavailable', 1200);
      shareRunSummary();
    }
  }

  function downloadShareImage(c) {
    try {
      var a = document.createElement('a');
      a.href = c.toDataURL('image/png');
      a.download = 'urr-jaa-score.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast('Score card saved 📷', 1400, 'medal');
    } catch (e) {
      showToast('Copy text instead', 1200);
    }
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
    try {
      var img = document.getElementById('share-card-image');
      if (!img) {
        img = document.createElement('img');
        img.id = 'share-card-image';
        img.className = 'share-card-image';
        img.alt = 'Score card preview';
      }
      img.src = buildShareCardCanvas().toDataURL('image/png');
      img.hidden = false;
      body.appendChild(img);
    } catch (errImg) { /* ignore */ }
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

  var A2HS_DISMISS_KEY = 'urrjaa:a2hs'; // permanent dismiss / installed
  var A2HS_LATER_KEY = 'urrjaa:a2hs-later'; // session snooze
  var deferredA2hsPrompt = null;
  var a2hsFlowStep = 0; // 0 tip, 1 prompting

  function isA2hsInstalled() {
    try {
      if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) return true;
      if (window.matchMedia && window.matchMedia('(display-mode: fullscreen)').matches) return true;
      if (typeof navigator !== 'undefined' && navigator.standalone === true) return true;
    } catch (_) {}
    return false;
  }

  function isIosSafari() {
    try {
      var ua = navigator.userAgent || '';
      var iOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      var webkit = /WebKit/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
      return iOS && webkit;
    } catch (_) { return false; }
  }

  function a2hsHowToText() {
    if (isIosSafari()) {
      return 'Tap <strong>Share</strong> ↑ then <strong>Add to Home Screen</strong>';
    }
    if (deferredA2hsPrompt) {
      return 'Tap <strong>Install</strong> → confirm in the browser sheet';
    }
    return 'Browser menu → <strong>Add to Home Screen</strong> / Install app';
  }

  function updateA2hsTip() {
    var a2hs = document.getElementById('a2hs');
    if (!a2hs) return;
    if (isA2hsInstalled()) {
      a2hs.hidden = true;
      a2hs.classList.remove('a2hs-visible', 'a2hs-can-install', 'a2hs-ios', 'a2hs-flow');
      return;
    }
    try {
      if (localStorage.getItem(A2HS_DISMISS_KEY) === '1') {
        a2hs.hidden = true;
        return;
      }
      if (sessionStorage.getItem(A2HS_LATER_KEY) === '1') {
        a2hs.hidden = true;
        return;
      }
    } catch (_) { /* private mode */ }
    var runs = FTStorage.getRunCount ? FTStorage.getRunCount() : 0;
    var show = screenStart && !screenStart.hidden && runs >= 1;
    a2hs.hidden = !show;
    var canNative = !!(show && deferredA2hsPrompt);
    a2hs.classList.toggle('a2hs-can-install', canNative);
    a2hs.classList.toggle('a2hs-ios', !!(show && isIosSafari() && !deferredA2hsPrompt));
    a2hs.classList.toggle('a2hs-flow', !!(show && a2hsFlowStep > 0));
    if (show) a2hs.classList.add('a2hs-visible');
    var how = document.getElementById('a2hs-how');
    if (how) how.innerHTML = a2hsHowToText();
    var steps = document.getElementById('a2hs-steps');
    if (steps) {
      steps.hidden = !show;
      steps.innerHTML = canNative
        ? '<span class="a2hs-step' + (a2hsFlowStep >= 1 ? ' done' : ' active') + '">1 Install</span>' +
          '<span class="a2hs-step' + (a2hsFlowStep >= 2 ? ' done' : (a2hsFlowStep >= 1 ? ' active' : '')) + '">2 Confirm</span>'
        : (isIosSafari()
          ? '<span class="a2hs-step active">1 Share ↑</span><span class="a2hs-step">2 Add to Home</span>'
          : '<span class="a2hs-step active">Menu</span><span class="a2hs-step">Install</span>');
    }
    var installBtn = document.getElementById('a2hs-install');
    if (installBtn) {
      // Always show Install: native prompt when available, else how-to toast / expand
      installBtn.hidden = !show;
      installBtn.textContent = deferredA2hsPrompt ? 'Install' : (isIosSafari() ? 'How to' : 'How to');
      installBtn.classList.toggle('a2hs-howto', !deferredA2hsPrompt);
    }
    var okBtn = document.getElementById('a2hs-ok');
    if (okBtn) okBtn.textContent = deferredA2hsPrompt ? 'Later' : 'Got it';
  }

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredA2hsPrompt = e;
    a2hsFlowStep = 0;
    updateA2hsTip();
  });
  window.addEventListener('appinstalled', function () {
    deferredA2hsPrompt = null;
    a2hsFlowStep = 2;
    try { localStorage.setItem(A2HS_DISMISS_KEY, '1'); } catch (_) {}
    updateA2hsTip();
    showToast('✓ Installed · offline-ready', 1800, 'medal');
  });

  function hideAllScreens() {

    allScreens().forEach(function (el) { if (el) el.hidden = true; });
  }


  function syncAreaMusicPref() {
    var on = !!(FTStorage.isAreaMusic && FTStorage.isAreaMusic());
    if (FTAudio.setAreaMusicEnabled) FTAudio.setAreaMusicEnabled(on);
    if (areaMusicChk) areaMusicChk.checked = on;
    if (!on) {
      if (FTAudio.stopAreaMusic) FTAudio.stopAreaMusic(true);
      if (FTAudio.stopMenuMusic) FTAudio.stopMenuMusic(true);
    }
  }

  function showMenu() {
    stopGaragePreview();
    if (typeof closeGarageLongPreview === 'function') closeGarageLongPreview();
    if (typeof clearEquipUndoStack === 'function') clearEquipUndoStack({ silent: true });
    setPauseBlur(false);
    state = 'menu';
    hideCoach();
    hideAllScreens();
    screenStart.hidden = false;
    hud.hidden = true;
    syncStreakBtn();
    if (FTAudio.stopAreaMusic) FTAudio.stopAreaMusic();
    lastAreaMusic = null;
    if (FTAudio.playMenuMusic) FTAudio.playMenuMusic();
    hitFlash = 0;
    playMode = 'classic';
    oneLifeLocked = false;
    areaOverride = null;
    updateBestUI();
    updateA2hsTip();
    updateUnlockTeaser();
    refreshSeasonalHint();
    updateLivesHud();
    refreshMenuTip();
    maybePlayShimmer(); // 3.51 once/day Play shimmer
    if (FTAudio && FTAudio.setQuietMode) FTAudio.setQuietMode(false);
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


  var TUTORIAL_TIPS = [
    'Tap early — pipes come at you fast.',
    'Center the gap for PERFECT (+3).',
    'Edge graze = CLOSE — stacks coin mult.',
    'Gifts 📦 → Mystery spins (10 = 1 spin · 15s wheel).',
    'Shield saves one hard hit.',
    'Classic is forgiving; Hard is not.',
    'Combo x5+ drops confetti — keep chaining!',
    'Magnet pulls coins · Slow-mo buys time.',
    'Practice mode: follow the ghost bird.',
    'Time Attack: pace yourself — timer on HUD.',
    'Near-miss CLOSE for juice & coins.',
    'Landscape notch? Safe-area keeps HUD clear.'
  ];

  function pickTutorialTip(seed) {
    var i = Math.abs((seed | 0) + (FTStorage.getRunCount ? FTStorage.getRunCount() : 0)) % TUTORIAL_TIPS.length;
    return TUTORIAL_TIPS[i];
  }

  // 3.51: Play shimmer once per calendar day (not forever / not every menu)
  var PLAY_SPLASH_DAY_KEY = 'flappy-tap:play-splash-day';
  var _playSplashSessionFallback = false;

  function playSplashTodayKey() {
    var d = new Date();
    var m = d.getMonth() + 1;
    var day = d.getDate();
    return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (day < 10 ? '0' : '') + day;
  }

  function maybePlayShimmer() {
    if (reduceMotion) return;
    var today = playSplashTodayKey();
    try {
      if (localStorage.getItem(PLAY_SPLASH_DAY_KEY) === today) return;
      localStorage.setItem(PLAY_SPLASH_DAY_KEY, today);
    } catch (_) {
      if (_playSplashSessionFallback) return;
      _playSplashSessionFallback = true;
    }
    if (btnPlay) {
      btnPlay.classList.remove('btn-play-milestone');
      void btnPlay.offsetWidth;
      btnPlay.classList.add('btn-play-milestone');
      clearTimeout(maybePlayShimmer._t);
      maybePlayShimmer._t = setTimeout(function () {
        if (btnPlay) btnPlay.classList.remove('btn-play-milestone');
      }, 1400);
    }
    if (typeof spawnConfettiBurst === 'function') {
      spawnConfettiBurst(W * 0.5, H * 0.58, 8);
    }
  }

  function refreshMenuTip() {
    var el = document.getElementById('menu-tip');
    if (!el) return;
    el.textContent = '💡 ' + pickTutorialTip(Date.now() / 8000);
    el.hidden = false;
  }

  function refreshDeathTip(isRecord) {
    var el = document.getElementById('death-tip');
    if (!el) return;
    var tip;
    if (isRecord) tip = '🏆 New best! Fireworks for you — can you beat it again?';
    else if (lastHitCause === 'ground') tip = '💡 Tip: flap sooner near the ground — stay mid-gap.';
    else if (lastHitCause === 'ceiling') tip = '💡 Tip: ease off the taps — ceiling hits count.';
    else if (lastHitCause === 'traffic') tip = '💡 Tip: traffic dodge — wait a beat or grab Ghost.';
    else if (score < 3) tip = '💡 Tip: tap once, wait, tap again — 2s to learn.';
    else if (runPerfects === 0 && score >= 5) tip = '💡 Tip: aim for the gap center — PERFECT pays +3.';
    else if (runNearMisses === 0 && score >= 8) tip = '💡 Tip: graze the edge for CLOSE juice (safe-ish!).';
    else if (runBoxes === 0 && score >= 10) tip = '💡 Tip: snag 📦 gifts for Mystery spins (15s wheel).';
    else tip = '💡 ' + pickTutorialTip(score + runPerfects * 3);
    el.textContent = tip;
    el.hidden = false;
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
    if (!isPractice() && score > 0 && FTStorage.recordTopRun) {
      FTStorage.recordTopRun({
        score: score, mode: playMode, perfects: runPerfects,
        combo: Math.max(runBestCombo, runBestCoinCombo)
      });
    }
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
      // 3.17 high-score fireworks
      spawnFireworks(W * 0.5, H * 0.32, 5);
      spawnCoinRain(28);
      setTimeout(function () { spawnFireworks(W * 0.35, H * 0.28, 3); }, 280);
      setTimeout(function () { spawnFireworks(W * 0.65, H * 0.3, 3); spawnCoinRain(16); }, 520);
      if (newRecordBanner) {
        newRecordBanner.classList.remove('fw-boom');
        void newRecordBanner.offsetWidth;
        newRecordBanner.classList.add('fw-boom');
      }
    } else {
      voiceCue('haye_oye');
    }
    refreshDeathTip(isRecord);
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

  function setPauseBlur(on) {
    var useBlur = !!on && !reduceMotion;
    if (appEl) appEl.classList.toggle('paused-blur', useBlur);
    if (canvas) canvas.classList.toggle('paused-blur-canvas', useBlur);
    if (screenPause) {
      screenPause.classList.toggle('pause-blur-ready', !!on);
      screenPause.classList.toggle('pause-reduced', !!on && !!reduceMotion);
    }
  }
  function pauseGame() {
    if (state !== 'playing') return;
    hideResumeCountdown();
    state = 'paused';
    if (screenPause) screenPause.hidden = false;
    setPauseBlur(true);
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
      pauseTip.textContent = '💡 ' + pickTutorialTip(Math.floor(Math.random() * 99) + score);
    }
  }
  var resumeCountdownTimer = 0;
  var resumeCountdownBusy = false;

  function hideResumeCountdown() {
    if (resumeCountdownEl) resumeCountdownEl.hidden = true;
    if (resumeCountdownTimer) { clearTimeout(resumeCountdownTimer); resumeCountdownTimer = 0; }
    resumeCountdownBusy = false;
  }

  function finishResumeFromPause() {
    hideResumeCountdown();
    state = 'playing';
    if (screenPause) screenPause.hidden = true;
    setPauseBlur(false);
    lastTs = 0;
  }

  function runResumeCountdown() {
    if (!resumeCountdownEl || !resumeCountdownNumEl) {
      finishResumeFromPause();
      return;
    }
    resumeCountdownBusy = true;
    if (screenPause) screenPause.hidden = true;
    setPauseBlur(false);
    resumeCountdownEl.hidden = false;
    resumeCountdownEl.classList.remove('resume-go');
    var steps = ['3', '2', '1', 'GO!'];
    var i = 0;
    function tick() {
      if (!resumeCountdownBusy) return;
      if (i >= steps.length) {
        finishResumeFromPause();
        return;
      }
      var label = steps[i];
      resumeCountdownNumEl.textContent = label;
      resumeCountdownEl.classList.toggle('resume-go', label === 'GO!');
      resumeCountdownNumEl.classList.remove('resume-pop');
      void resumeCountdownNumEl.offsetWidth;
      resumeCountdownNumEl.classList.add('resume-pop');
      if (label !== 'GO!' && FTAudio && FTAudio.tick) {
        try { FTAudio.tick(); } catch (_) {}
      } else if (label === 'GO!' && FTAudio && FTAudio.flap) {
        try { /* soft cue */ if (FTAudio.score) FTAudio.score(); } catch (_) {}
      }
      i++;
      resumeCountdownTimer = setTimeout(tick, label === 'GO!' ? 380 : 620);
    }
    tick();
  }

  function resumeGame() {
    if (state !== 'paused') return;
    if (resumeCountdownBusy) return;
    var wantCd = !(FTStorage.isResumeCountdown) || !!FTStorage.isResumeCountdown();
    if (!wantCd || reduceMotion) {
      finishResumeFromPause();
      return;
    }
    // stay 'paused' until countdown ends so flap/update don't run
    runResumeCountdown();
  }
  function quitToMenu() {
    hideResumeCountdown();
    if (screenPause) screenPause.hidden = true;
    setPauseBlur(false);
    showMenu();
  }

  function bumpRunsIfCompetitive() {
    if (!isPractice()) {
      FTStorage.bumpRunCount();
      updateBestUI();
    }
  }


  /* ——— 3.24 first-run coach marks ——— */
  var COACH_STEPS = [
    { id: 'flap', text: '👆 Tap or press Space to flap — keep flapping!' },
    { id: 'pipes', text: '🕊 Fly through the gaps between pipes' },
    { id: 'coins', text: '🪙 Grab coins & power-ups in the gaps' },
    { id: 'hud', text: '⏸ Pause & 🔊 Mute live in the top corners' }
  ];

  function shouldShowCoach() {
    if (!isForgivingMode()) return false;
    if (FTStorage.isCoachDone && FTStorage.isCoachDone()) return false;
    var rc = FTStorage.getRunCount ? FTStorage.getRunCount() : 99;
    return rc <= 5;
  }

  function renderCoachDots() {
    if (!coachDotsEl) return;
    var html = '';
    for (var i = 0; i < COACH_STEPS.length; i++) {
      html += '<span class="coach-dot' + (i === coachStep ? ' active' : (i < coachStep ? ' done' : '')) + '"></span>';
    }
    coachDotsEl.innerHTML = html;
  }

  function showCoachStep() {
    if (!coachMarksEl || !coachTextEl) return;
    if (coachStep >= COACH_STEPS.length) {
      finishCoach();
      return;
    }
    coachActive = true;
    coachMarksEl.hidden = false;
    coachMarksEl.classList.toggle('coach-hud', COACH_STEPS[coachStep].id === 'hud');
    coachTextEl.textContent = COACH_STEPS[coachStep].text;
    renderCoachDots();
    if (btnCoachNext) btnCoachNext.textContent = coachStep >= COACH_STEPS.length - 1 ? 'Finish' : 'Got it';
  }

  function hideCoach() {
    coachActive = false;
    if (coachMarksEl) coachMarksEl.hidden = true;
  }

  function finishCoach() {
    hideCoach();
    if (FTStorage.setCoachDone) FTStorage.setCoachDone(true);
    if (FTStorage.setCoachStep) FTStorage.setCoachStep(COACH_STEPS.length);
    showToast("You're ready — Urr Jaa!", 1400);
  }

  function advanceCoach(fromFlap) {
    if (!coachActive) return;
    if (fromFlap && COACH_STEPS[coachStep] && COACH_STEPS[coachStep].id !== 'flap') return;
    coachStep += 1;
    if (FTStorage.setCoachStep) FTStorage.setCoachStep(coachStep);
    if (coachStep >= COACH_STEPS.length) finishCoach();
    else showCoachStep();
  }

  function maybeStartCoach(fromContinue) {
    if (fromContinue || !shouldShowCoach()) { hideCoach(); return; }
    coachStep = (FTStorage.getCoachStep && FTStorage.getCoachStep()) || 0;
    if (coachStep >= COACH_STEPS.length) { finishCoach(); return; }
    showCoachStep();
  }

  function startRun(fromContinue, mode) {
    FTAudio.unlock();
    if (FTAudio.stopMenuMusic) FTAudio.stopMenuMusic();
    starCoinRunGain = 0; // 3.43 star coin run cap
    starCoinLastAt = 0;
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
    comboMilestonesHit = Object.create(null);
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
      nearMissEdgeFlash = 0;
      riskyUntil = 0;
      shieldActive = false;
      slowMoUntil = 0;
      magnetUntil = 0;
      turboUntil = 0;
      ghostUntil = 0;
      turboTrail.length = 0;
      ghostSilTrail.length = 0;
      replayBuf.length = 0;
      replaySnapshot.length = 0;
      replaySampleAcc = 0;
      deathFreezeCanvas = null;
      deathCamZoom = 0;
      envFade = 0;
      envFadeFrom = null;
      lastEnvArea = null;
      if (replayVizRaf) { cancelAnimationFrame(replayVizRaf); replayVizRaf = 0; }
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
      bossWarnActive = false;
      bossWarnPulse = 0;
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

  /** 3.30 feel juice: soft expanding whoosh ring on flap. */
  function spawnFlapWhoosh() {
    if (!bird || reduceMotion) return;
    particles.push({
      x: bird.x, y: bird.y + 4,
      vx: 0, vy: 0,
      life: 0.28, max: 0.28,
      color: combo >= 5 ? 'rgba(251,191,36,0.55)' : 'rgba(125,211,252,0.5)',
      r: 10,
      kind: 'ring',
      grow: 48 + Math.min(24, combo * 2)
    });
    trimParticles();
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
      spawnFlapWhoosh();
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
    spawnFlapWhoosh();
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
      lastHitCause = 'ground';
      return 'hard';
    }
    if (bird.y - halfH <= 0) {
      var overC = halfH - bird.y;
      if (isForgivingMode() && overC < cornerTol * 0.85) return 'soft';
      lastHitCause = 'ceiling';
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
        else { lastHitCause = 'pipe'; return 'hard'; }
      }
      var botY = p.gapY + gap;
      if (rectsOverlap(bx, by0, bw, bh, p.x, botY, pw, groundY - botY)) {
        var penBot = botY - by0;
        var cornerXb = Math.min(Math.abs((bx + bw) - p.x), Math.abs(bx - (p.x + pw)));
        if (isForgivingMode() && penBot > 0 && penBot <= cornerTol && cornerXb <= cornerTol + 10) softHit = true;
        else { lastHitCause = 'pipe'; return 'hard'; }
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
        } else { lastHitCause = 'traffic'; return 'hard'; }
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
    var kickDirY = 0;
    if (nearest) {
      var g = nearest.gap != null ? nearest.gap : currentGap;
      var cy = nearest.gapY + g / 2;
      kickDirY = (cy > bird.y) ? 1 : -1;
      bird.y += (cy - bird.y) * 0.58; // 3.11: stronger center recover
      if (bird.vy > 80) bird.vy *= 0.28;
      if (bird.vy < -120) bird.vy *= 0.42;
    } else {
      if (bird.y + bird.h / 2 >= H - GROUND_H) bird.y = H - GROUND_H - bird.h / 2 - 4;
      if (bird.y - bird.h / 2 <= 0) bird.y = bird.h / 2 + 4;
      bird.vy *= 0.4;
    }
    // 3.32: soft camera nudge toward safety + tiny zoom
    if (!reduceMotion) {
      nearMissCamUntil = performance.now() + 280;
      camKickX = nearest ? ((nearest.x + PIPE_W / 2 > bird.x) ? -3 : 3) : 0;
      camKickY = kickDirY * 6;
      camKickZoom = 0.022;
    }
    if (FTAudio.lucky) FTAudio.lucky();
    else FTAudio.nearmiss();
    showBanner('LUCKY!', 750);
    showToast('LUCKY!', 1000, 'lucky');
    if (bird) {
      spawnSoftCollisionDust(bird.x, bird.y, 14);
      spawnLandingDust(bird.x, H - GROUND_H - 2, 6);
    }
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
        if (!reduceMotion && bird && rng() < 0.08) spawnSoftCollisionDust(bird.x, bird.y, 4);
      }
      return;
    }
    beginDeath();
  }

  var MAX_PARTICLES = 96;
  var _particleBudgetCached = -1;
  var _particleBudgetAt = 0;
  function particleBudget() {
    // 3.20 micro-perf: cache budget ~1s (resize/reduce-motion still refresh)
    var now = performance.now();
    if (_particleBudgetCached >= 0 && (now - _particleBudgetAt) < 1000) return _particleBudgetCached;
    var cap;
    if (reduceMotion) cap = 28;
    else {
      var dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
      var narrow = (typeof window !== 'undefined' && window.innerWidth < 480);
      cap = (narrow || dpr > 2.5) ? 56 : MAX_PARTICLES;
    }
    _particleBudgetCached = cap;
    _particleBudgetAt = now;
    return cap;
  }

  function trimParticles() {
    var cap = particleBudget();
    if (particles.length > cap) particles.splice(0, particles.length - cap);
  }


  /** 3.31: soft collision / LUCKY dust puff at bird. */
  function spawnSoftCollisionDust(x, y, n) {
    if (reduceMotion) return;
    n = n || 12;
    var cols = ['rgba(125,211,252,0.65)', 'rgba(253,230,138,0.7)', 'rgba(226,232,240,0.55)', 'rgba(194,160,92,0.5)'];
    for (var i = 0; i < n; i++) {
      var a = (Math.PI * 2 * i) / n + rng() * 0.3;
      var sp = 35 + rng() * 70;
      particles.push({
        x: x + (rng() - 0.5) * 8,
        y: y + (rng() - 0.5) * 8,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 25,
        life: 0.4 + rng() * 0.25,
        max: 0.65,
        color: cols[i % cols.length],
        r: 2.2 + rng() * 2.8,
        kind: 'dust'
      });
    }
    if (!reduceMotion) {
      particles.push({
        x: x, y: y, vx: 0, vy: 0,
        life: 0.3, max: 0.3,
        color: 'rgba(125,211,252,0.45)',
        r: 8, kind: 'ring', grow: 32
      });
    }
    trimParticles();
  }

  /** 3.23: soft dust puff when bird skims / lands near ground. */
  function spawnLandingDust(x, y, n) {
    if (reduceMotion) return;
    n = n || 8;
    for (var i = 0; i < n; i++) {
      particles.push({
        x: x + (rng() - 0.5) * 18,
        y: y,
        vx: (rng() - 0.5) * 70,
        vy: -20 - rng() * 50,
        life: 0.35 + rng() * 0.25,
        max: 0.6,
        color: i % 2 ? 'rgba(194,160,92,0.7)' : 'rgba(212,180,120,0.55)',
        r: 2 + rng() * 2.5,
        kind: 'dust'
      });
    }
    trimParticles();
  }

  /** 3.36: soft ground bounce juice — ring + upward flecks. */
  function spawnGroundBounceJuice(x, y, vy) {
    if (reduceMotion) return;
    particles.push({
      x: x, y: y, vx: 0, vy: 0, life: 0.28, max: 0.28,
      color: 'rgba(212,180,120,0.5)', r: 8, kind: 'ring', grow: 28 + Math.min(24, (vy || 0) / 20)
    });
    for (var i = 0; i < 5; i++) {
      particles.push({
        x: x + (rng() - 0.5) * 22,
        y: y - 2,
        vx: (rng() - 0.5) * 50,
        vy: -40 - rng() * 60,
        life: 0.3 + rng() * 0.2,
        max: 0.5,
        color: i % 2 ? 'rgba(255,217,61,0.55)' : 'rgba(194,160,92,0.65)',
        r: 1.6 + rng() * 1.8,
        kind: 'spark'
      });
    }
    trimParticles();
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


  /** 3.21: cascading coin rain for big celebrations (records / unlocks). */
  function spawnCoinRain(count) {
    if (reduceMotion) return;
    var scale = confettiScale();
    if (scale <= 0) return;
    count = Math.max(4, Math.round((count || 24) * scale));
    var cols = ['#ffd93d', '#fff3bf', '#f59e0b', '#fde68a'];
    for (var i = 0; i < count; i++) {
      particles.push({
        x: rng() * W,
        y: -10 - rng() * 80,
        vx: (rng() - 0.5) * 40,
        vy: 90 + rng() * 160,
        life: 1.1 + rng() * 0.7,
        max: 1.8,
        color: cols[i % cols.length],
        r: 2.4 + rng() * 2.2,
        kind: 'coin_rain',
        rot: rng() * Math.PI,
        spin: (rng() - 0.5) * 10
      });
    }
    trimParticles();
  }

  function confettiScale() {
    var lvl = (FTStorage.getConfettiIntensity && FTStorage.getConfettiIntensity()) || 'normal';
    if (lvl === 'off') return 0;
    if (lvl === 'low') return 0.45;
    if (lvl === 'high') return 1.55;
    return 1;
  }
  function spawnConfettiBurst(x, y, n) {
    if (reduceMotion) return;
    var scale = confettiScale();
    if (scale <= 0) return;
    var cols = ['#ff6b6b', '#ffd93d', '#4ecdc4', '#c084fc', '#60a5fa', '#f472b6'];
    n = Math.max(0, Math.round((n || 18) * scale));
    if (n < 1) return;
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

  /** 3.17: high-score fireworks — rockets that bloom into star bursts. */
  function spawnFireworks(cx, cy, waves) {
    if (reduceMotion) return;
    waves = waves || 3;
    var cols = ['#ff6b6b', '#ffd93d', '#4ecdc4', '#c084fc', '#60a5fa', '#f472b6', '#fff'];
    for (var w = 0; w < waves; w++) {
      var ox = cx + (rng() - 0.5) * (W * 0.45);
      var oy = cy + rng() * 40;
      particles.push({
        x: ox, y: H - GROUND_H - 8,
        vx: (ox - cx) * 0.15,
        vy: -220 - rng() * 160,
        life: 0.55 + rng() * 0.25, max: 0.9,
        color: cols[w % cols.length],
        r: 3.2,
        kind: 'fw_rocket',
        bloomY: oy,
        bloomColor: cols[(w + 2) % cols.length]
      });
    }
    trimParticles();
  }

  function bloomFirework(pt) {
    var cols = ['#ff6b6b', '#ffd93d', '#4ecdc4', '#c084fc', '#60a5fa', '#f472b6', '#fff'];
    var n = 14 + Math.floor(rng() * 8);
    for (var i = 0; i < n; i++) {
      var a = (Math.PI * 2 * i) / n + rng() * 0.2;
      var sp = 70 + rng() * 140;
      particles.push({
        x: pt.x, y: pt.y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        life: 0.55 + rng() * 0.35, max: 1,
        color: cols[i % cols.length],
        r: 2 + rng() * 2.4,
        kind: 'fw_spark',
        rot: rng() * Math.PI
      });
    }
    particles.push({
      x: pt.x, y: pt.y, vx: 0, vy: 0,
      life: 0.35, max: 0.35,
      color: pt.bloomColor || 'rgba(255,217,61,.55)',
      r: 6, kind: 'ring', grow: 55
    });
    if (FTAudio && typeof FTAudio.firework === 'function') {
      try { FTAudio.firework(); } catch (e) { /* ignore */ }
    }
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
    var cols = ['#c084fc', '#ffd93d', '#ff6b6b', '#fff', '#f0abfc'];
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
      // 3.26 gift spawn sparkle stars
      for (var s = 0; s < 8; s++) {
        var sa = (Math.PI * 2 * s) / 8;
        particles.push({
          x: x, y: y,
          vx: Math.cos(sa) * (40 + rng() * 50),
          vy: Math.sin(sa) * (40 + rng() * 50) - 40,
          life: 0.45 + rng() * 0.2, max: 0.65,
          color: s % 2 ? '#fef08a' : '#e9d5ff',
          r: 3.2 + rng() * 2,
          kind: 'star',
          spin: 4 + rng() * 6
        });
      }
      // twinkle sparks
      for (var k = 0; k < 6; k++) {
        particles.push({
          x: x + (rng() - 0.5) * 20, y: y + (rng() - 0.5) * 20,
          vx: (rng() - 0.5) * 30, vy: -30 - rng() * 40,
          life: 0.35, max: 0.5,
          color: '#fff',
          r: 1.2 + rng(),
          kind: 'spark'
        });
      }
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
    popScore(gained, c.x, c.y - 10, { coin: true });
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
    if (state !== 'playing') showToast('📦 → Mystery Rewards', 1300, 'gift');
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
    var clearBtn = document.getElementById('btn-clear-spin-history');
    if (clearBtn) clearBtn.disabled = !hist.length;
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


  function clearMysteryHistoryUI() {
    if (!FTStorage.clearSpinHistory) return;
    var hist = FTStorage.getSpinHistory ? FTStorage.getSpinHistory() : [];
    if (!hist.length) { showToast('History already empty', 1000); return; }
    if (!window.confirm('Clear Mystery spin history? This cannot be undone.')) return;
    FTStorage.clearSpinHistory();
    refreshSpinHistoryUI();
    showToast('Spin history cleared', 1200, 'gift');
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

  /** Full dramatic spin duration for Spin once (15s). Reduce-motion stays near-instant. */
  var SPIN_ONCE_MS = 15000;
  /** Spin-all sequential: 15s when 1 charge; 8s when ≤3 planned; 5s when many. */
  function spinAllDurationMs(remaining, planned) {
    if (planned <= 1) return SPIN_ONCE_MS;
    if (planned <= 3) return 8000;
    return 5000;
  }

  /**
   * Animate wheel so `coins` segment lands under the top pointer.
   * ROOT-CAUSE FIX (3.10): CSS transition on #spin-wheel was unreliable —
   * `.wheel-spinning .spin-wheel { filter:… }` forced a new compositor layer
   * mid-transition, and `html.reduce-motion .spin-wheel { transition:none !important }`
   * could kill it. Drive rotation with requestAnimationFrame + ease-out instead
   * so Spin once always shows continuous rotation (15s) then decelerates into the segment.
   */
  var wheelAnimRaf = 0;
  function cancelWheelAnim() {
    if (wheelAnimRaf) {
      cancelAnimationFrame(wheelAnimRaf);
      wheelAnimRaf = 0;
    }
    if (FTAudio && FTAudio.stopSpinWhoosh) {
      try { FTAudio.stopSpinWhoosh(); } catch (errC) { /* ignore */ }
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
    var turns = reduce ? 1 : (dur >= 12000 ? 20 : (dur >= 6000 ? 14 : (dur >= 3000 ? 7 : (dur >= 1500 ? 4 : 3))));
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
    // 3.19: soft whoosh bed during long spins (esp. full 15s Spin once)
    if (!reduce && dur >= 2000 && FTAudio && FTAudio.startSpinWhoosh) {
      try { FTAudio.startSpinWhoosh(); } catch (errW) { /* ignore */ }
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
        if (FTAudio && FTAudio.stopSpinWhoosh) {
          try { FTAudio.stopSpinWhoosh(); } catch (errS) { /* ignore */ }
        }
        if (!reduce && FTAudio && FTAudio.spinLand) {
          try { FTAudio.spinLand(); } catch (errL) { /* ignore */ }
        }
        if (wheelWrapEl) {
          wheelWrapEl.classList.remove('wheel-spinning');
          wheelWrapEl.classList.remove('wheel-win', 'pointer-bounce');
          void wheelWrapEl.offsetWidth;
          wheelWrapEl.classList.add('wheel-win', 'pointer-bounce');
          setTimeout(function () {
            if (wheelWrapEl) wheelWrapEl.classList.remove('pointer-bounce');
          }, 900);
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


  /** 3.31: extra juice when wheel lands jackpot (999) / mega (888+). */
  function celebrateJackpot(coins) {
    coins = coins | 0;
    if (coins < 888) return;
    var isJack = coins >= 999;
    showBanner(isJack ? '💎 JACKPOT 999!' : '✨ MEGA ' + coins + '!', isJack ? 2200 : 1600);
    haptic(isJack ? 'boss' : 'gift');
    if (!reduceMotion) {
      spawnFireworks(W * 0.5, H * 0.35, isJack ? 7 : 4);
      spawnCoinRain(isJack ? 36 : 18);
      spawnConfettiBurst(W * 0.5, H * 0.4, isJack ? 28 : 14);
      if (isJack) {
        setTimeout(function () { spawnFireworks(W * 0.3, H * 0.28, 4); }, 220);
        setTimeout(function () { spawnFireworks(W * 0.7, H * 0.3, 4); spawnCoinRain(14); }, 420);
      }
    }
    if (wheelWrapEl) {
      wheelWrapEl.classList.remove('wheel-jackpot');
      void wheelWrapEl.offsetWidth;
      wheelWrapEl.classList.add('wheel-jackpot');
      setTimeout(function () { if (wheelWrapEl) wheelWrapEl.classList.remove('wheel-jackpot'); }, 2200);
    }
    voiceCue(isJack ? 'shabaash' : 'wah_ji');
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
      celebrateJackpot(r.coins);
      refreshGiftsUI();
      updateCoinHud();
      setSpinButtonsBusy(false);
      if (r.coins < 888) voiceCue('wah_ji');
    }, SPIN_ONCE_MS);
  }

  /** Sequential spins: full 15s when 1 charge; 8s/5s tiering when many. Grant after each land. */
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
        if (r.coins >= 888) celebrateJackpot(r.coins);
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


  /** 3.26/3.27: capture canvas freeze frame at death impact. */
  function captureDeathFreezeFrame() {
    try {
      if (!canvas) return;
      if (!deathFreezeCanvas) {
        deathFreezeCanvas = document.createElement('canvas');
      }
      deathFreezeCanvas.width = canvas.width;
      deathFreezeCanvas.height = canvas.height;
      var dctx = deathFreezeCanvas.getContext('2d');
      dctx.clearRect(0, 0, deathFreezeCanvas.width, deathFreezeCanvas.height);
      dctx.drawImage(canvas, 0, 0);
    } catch (err) { deathFreezeCanvas = null; }
  }

  function pushReplaySample(now) {
    if (!bird) return;
    replayBuf.push({ x: bird.x, y: bird.y, rot: bird.rot || 0, t: now });
    var cutoff = now - REPLAY_WINDOW_MS;
    while (replayBuf.length && replayBuf[0].t < cutoff) replayBuf.shift();
    if (replayBuf.length > 64) replayBuf.shift();
  }

  function drawReplayPathStub(buf) {
    buf = buf || replayBuf;
    if (!buf.length || reduceMotion) return;
    ctx.save();
    // glow underlay
    ctx.strokeStyle = 'rgba(251,191,36,0.25)';
    ctx.lineWidth = 5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (var i = 0; i < buf.length; i++) {
      var p = buf[i];
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,217,61,0.75)';
    ctx.lineWidth = 2.2;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    for (var i2 = 0; i2 < buf.length; i2++) {
      var p2 = buf[i2];
      if (i2 === 0) ctx.moveTo(p2.x, p2.y);
      else ctx.lineTo(p2.x, p2.y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    for (var j = 0; j < buf.length; j += 2) {
      var q = buf[j];
      var a = 0.2 + 0.45 * (j / buf.length);
      ctx.globalAlpha = a;
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(q.x, q.y, 2.8, 0, Math.PI * 2);
      ctx.fill();
    }
    // start / end markers
    ctx.globalAlpha = 0.9;
    var s0 = buf[0], s1 = buf[buf.length - 1];
    ctx.fillStyle = '#4ade80';
    ctx.beginPath(); ctx.arc(s0.x, s0.y, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f87171';
    ctx.beginPath(); ctx.arc(s1.x, s1.y, 4.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function drawDeathFreezeOverlay() {
    if (state !== 'dying' || !bird) return;
    var rem = Math.max(0, (deathFreezeUntil - performance.now()) / Math.max(1, deathFreezeMs));
    ctx.save();
    var gV = ctx.createRadialGradient(bird.x, bird.y, 20, bird.x, bird.y, Math.max(W, H) * 0.75);
    gV.addColorStop(0, 'rgba(0,0,0,0)');
    gV.addColorStop(0.55, 'rgba(30,10,15,' + (0.12 * (1 - rem)).toFixed(3) + ')');
    gV.addColorStop(1, 'rgba(15,5,10,' + (0.38 + 0.28 * (1 - rem)).toFixed(3) + ')');
    ctx.fillStyle = gV;
    ctx.fillRect(0, 0, W, H);
    // progress chip
    var bw = 72, bh = 6;
    var bx = bird.x - bw / 2, by = Math.max(36, bird.y - 56);
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = '#fca5a5';
    ctx.fillRect(bx, by, bw * rem, bh);
    ctx.fillStyle = 'rgba(254,226,226,0.95)';
    ctx.font = 'bold 11px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('❄ IMPACT FREEZE', bird.x, by - 8);
    ctx.restore();
  }

  function drawPipeParallaxMicro() {
    if (reduceMotion || !pipes.length) return;
    var shift = ((groundX % 40) * 0.22) - 4;
    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.translate(shift, 1.5);
    for (var i = 0; i < pipes.length; i++) {
      var p = pipes[i];
      var gap = p.gap != null ? p.gap : currentGap;
      var topH = p.gapY;
      var botY = p.gapY + gap;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(p.x - 3, 0, (p.w || PIPE_W) + 2, topH);
      ctx.fillRect(p.x - 3, botY, (p.w || PIPE_W) + 2, (H - GROUND_H) - botY);
    }
    ctx.restore();
  }

  /** 3.27: paint path replay onto death-screen mini canvas (+ optional animate). */
  function paintReplayViz(progress) {
    if (!replayVizCanvas) return false;
    var buf = replaySnapshot.length ? replaySnapshot : replayBuf;
    if (!buf.length) {
      replayVizCanvas.hidden = true;
      return false;
    }
    replayVizCanvas.hidden = false;
    var w = replayVizCanvas.width;
    var h = replayVizCanvas.height;
    var rctx = replayVizCanvas.getContext('2d');
    rctx.clearRect(0, 0, w, h);
    // bg
    var bg = rctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#0f172a');
    bg.addColorStop(1, '#1e293b');
    rctx.fillStyle = bg;
    rctx.fillRect(0, 0, w, h);
    // fit path
    var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (var i = 0; i < buf.length; i++) {
      minX = Math.min(minX, buf[i].x); maxX = Math.max(maxX, buf[i].x);
      minY = Math.min(minY, buf[i].y); maxY = Math.max(maxY, buf[i].y);
    }
    var pad = 18;
    var spanX = Math.max(40, maxX - minX);
    var spanY = Math.max(40, maxY - minY);
    var scale = Math.min((w - pad * 2) / spanX, (h - pad * 2) / spanY);
    function tx(p) { return pad + (p.x - minX) * scale + (w - pad * 2 - spanX * scale) / 2; }
    function ty(p) { return pad + (p.y - minY) * scale + (h - pad * 2 - spanY * scale) / 2; }
    rctx.strokeStyle = 'rgba(251,191,36,0.35)';
    rctx.lineWidth = 4;
    rctx.lineJoin = 'round';
    rctx.beginPath();
    for (var j = 0; j < buf.length; j++) {
      var p = buf[j];
      if (j === 0) rctx.moveTo(tx(p), ty(p));
      else rctx.lineTo(tx(p), ty(p));
    }
    rctx.stroke();
    rctx.strokeStyle = '#fbbf24';
    rctx.lineWidth = 2;
    rctx.beginPath();
    for (var k = 0; k < buf.length; k++) {
      var q = buf[k];
      if (k === 0) rctx.moveTo(tx(q), ty(q));
      else rctx.lineTo(tx(q), ty(q));
    }
    rctx.stroke();
    // markers
    rctx.fillStyle = '#4ade80';
    rctx.beginPath(); rctx.arc(tx(buf[0]), ty(buf[0]), 4, 0, Math.PI * 2); rctx.fill();
    rctx.fillStyle = '#f87171';
    rctx.beginPath(); rctx.arc(tx(buf[buf.length - 1]), ty(buf[buf.length - 1]), 4, 0, Math.PI * 2); rctx.fill();
    // animated bird cursor
    var pr = progress == null ? 1 : Math.max(0, Math.min(1, progress));
    var idx = Math.min(buf.length - 1, Math.floor(pr * (buf.length - 1)));
    var cur = buf[idx];
    rctx.fillStyle = '#38bdf8';
    rctx.beginPath();
    rctx.ellipse(tx(cur), ty(cur), 7, 5, cur.rot || 0, 0, Math.PI * 2);
    rctx.fill();
    rctx.fillStyle = 'rgba(226,232,240,0.85)';
    rctx.font = 'bold 10px system-ui';
    rctx.textAlign = 'left';
    rctx.fillText('Last ' + Math.round(REPLAY_WINDOW_MS / 1000) + 's path', 8, 14);
    return true;
  }

  function startReplayVizAnim() {
    if (replayVizRaf) { cancelAnimationFrame(replayVizRaf); replayVizRaf = 0; }
    var buf = replaySnapshot.length ? replaySnapshot : replayBuf;
    if (!buf.length) {
      showToast('No path to replay yet', 1200);
      return;
    }
    var t0 = performance.now();
    var dur = 2000;
    function tick(now) {
      var p = Math.min(1, (now - t0) / dur);
      paintReplayViz(p);
      if (p < 1) replayVizRaf = requestAnimationFrame(tick);
      else replayVizRaf = 0;
    }
    showToast('Replaying last 5s path…', 1000);
    replayVizRaf = requestAnimationFrame(tick);
  }

  function updateDeathFreezeThumb() {
    if (deathFreezeThumb && deathFreezeCanvas) {
      try {
        deathFreezeThumb.src = deathFreezeCanvas.toDataURL('image/jpeg', 0.78);
        deathFreezeThumb.hidden = false;
        if (deathFreezeWrap) deathFreezeWrap.hidden = false;
        if (deathFreezeBadge) deathFreezeBadge.hidden = false;
      } catch (e) {
        deathFreezeThumb.hidden = true;
        if (deathFreezeWrap) deathFreezeWrap.hidden = true;
      }
    } else {
      if (deathFreezeThumb) deathFreezeThumb.hidden = true;
      if (deathFreezeWrap) deathFreezeWrap.hidden = true;
    }
    // always try static path viz
    paintReplayViz(1);
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
    hideCoach();
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

  function spawnPipeClearJuice(x, y) {
    // 3.50/3.51 soft gold pipe-clear ring (+ soft SFX in addPipeScore)
    if (reduceMotion || !bird) return;
    if (particles.length > particleBudget() * 0.9) return;
    particles.push({
      x: x, y: y,
      vx: 0, vy: 0,
      life: 0.3, max: 0.3,
      color: combo >= 5 ? 'rgba(251,191,36,0.55)' : 'rgba(255,217,61,0.42)',
      r: 11,
      kind: 'ring',
      grow: 40
    });
    trimParticles();
  }

  function addPipeScore(p) {
    combo += 1;
    maybeComboMilestone(combo);
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
      haptic('perfect');
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
    // 3.51: soft pipe-clear SFX; skip stacked score blip on PERFECT (already has perfect())
    if (!reduceMotion) spawnPipeClearJuice(bird.x + 8, bird.y);
    if (tag === 'PERFECT!') {
      /* perfect() already played */
    } else if (FTAudio && FTAudio.pipeClear) {
      FTAudio.pipeClear();
    } else if (FTAudio && FTAudio.score) {
      FTAudio.score();
    }
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
        // 3.28: screen-edge flash toward graze
        nearMissEdgeFlash = 1;
        nearMissEdgeSide = topClear < botClear ? 'top' : 'bottom';
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

    // 3.45/3.50 soft night ambience — cache volume mul ~0.4s (stability/perf)
    if (state === 'playing' && isNightAmbience()) {
      if (now - (update._nightAmbVolAt || 0) > 400) {
        update._nightAmbVolCache = (FTAudio && FTAudio.getNightAmbienceVolumeMul)
          ? FTAudio.getNightAmbienceVolumeMul() : 1;
        update._nightAmbVolAt = now;
      }
      if ((update._nightAmbVolCache || 0) > 0.001) {
        nightAmbAcc += dt;
        if (nightAmbAcc > 1.8 + (update._nightAmbNext || 0)) {
          nightAmbAcc = 0;
          update._nightAmbNext = Math.random() * 1.4;
          if (FTAudio && FTAudio.nightAmbienceTick) FTAudio.nightAmbienceTick();
        }
      } else {
        nightAmbAcc = 0;
      }
    } else {
      nightAmbAcc = 0;
    }

    squash += (squashTarget - squash) * Math.min(1, dt * 18);
    if (Math.abs(squash - squashTarget) < 0.02 && squashTarget !== 1) squashTarget = 1.08;
    if (squashTarget > 1 && Math.abs(squash - squashTarget) < 0.02) squashTarget = 1;

    groundX = (groundX - scroll * (state === 'playing' ? 1 : 0.5)) % 40;
    clouds.forEach(function (c) {
      var depth = c.depth != null ? c.depth : c.s;
      var spd = state === 'playing' ? currentSpeed * (0.08 + depth * 0.22) * sdt : (4 + depth * 10) * dt;
      c.x -= spd;
      if (!reduceMotion && c.bob != null) c.bob += dt * (0.35 + depth * 0.4);
      if (c.x < -c.w - 40) {
        c.x = W + 30 + Math.random() * 60;
        if (c.depth != null) c.y = (c.depth < 0.35 ? 30 : (c.depth < 0.6 ? 50 : 70)) + Math.random() * 90;
      }
    });

    var drawEnv = activeArea();
    var weather = effectiveWeather();
    var weatherNow = weather; // 3.20 micro-perf: reuse cached weather id
    var pal = FTSkins.envPalette(drawEnv === 'rain' || drawEnv === 'monsoon' ? 'city' : drawEnv, weather);
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
      else if (rng() < 0.008) {
        weatherFlash = 0.85 + rng() * 0.4;
        // 3.20: thunder rumble paired with lightning
        if (FTAudio && FTAudio.thunder) {
          try { FTAudio.thunder(); } catch (errT) { /* ignore */ }
        }
        if (hapticsOn) haptic('close');
      }
    } else {
      weatherFlash = 0;
    }
    // Refresh power HUD countdown chips ~4 Hz
    if (state === 'playing' && powerHudEl && !powerHudEl.hidden) {
      if (!updatePowerHud._acc) updatePowerHud._acc = 0;
      updatePowerHud._acc += dt;
      if (updatePowerHud._acc > 0.25) { updatePowerHud._acc = 0; updatePowerHud(); syncQuietNight(); }
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
        } else if (pt.kind === 'dust') {
          pt.vy += 60 * dt;
          pt.vx *= 0.96;
          pt.r *= 0.992;
        } else if (pt.kind === 'coin_rain') {
          pt.vy += 40 * dt;
          pt.rot = (pt.rot || 0) + (pt.spin || 4) * dt;
          if (pt.y > H - GROUND_H - 4) { pt.vy *= -0.25; pt.y = H - GROUND_H - 4; pt.life *= 0.7; }
        } else if (pt.kind === 'fw_rocket') {
          pt.vy += 40 * dt;
          if (pt.y <= (pt.bloomY || H * 0.35) || pt.life < 0.12) {
            bloomFirework(pt);
            pt.life = 0;
          }
        } else if (pt.kind === 'fw_spark') {
          pt.vy += 110 * dt;
          pt.vx *= 0.985;
          pt.rot = (pt.rot || 0) + 5 * dt;
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
    var _pCap = particleBudget(); // 3.24 micro-perf: one budget read
    if (particles.length > _pCap) particles.splice(0, particles.length - _pCap);

    for (var si = scorePops.length - 1; si >= 0; si--) {
      var sp = scorePops[si];
      sp.life -= dt;
      sp.y -= 40 * dt;
      if (sp.life <= 0) scorePops.splice(si, 1);
    }

    if (hitFlash > 0) hitFlash = Math.max(0, hitFlash - dt * (1000 / HIT_FLASH_MS));
    if (nearMissEdgeFlash > 0) nearMissEdgeFlash = Math.max(0, nearMissEdgeFlash - dt * 3.2);
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

    // 3.25: sample turbo / ghost trails
    if (bird && state === 'playing' && !reduceMotion) {
      if (now < turboUntil) {
        turboTrail.push({ x: bird.x, y: bird.y, rot: bird.rot });
        if (turboTrail.length > 14) turboTrail.shift();
      } else if (turboTrail.length) turboTrail.length = 0;
      if (now < ghostUntil) {
        ghostSilTrail.push({ x: bird.x, y: bird.y, rot: bird.rot });
        if (ghostSilTrail.length > 12) ghostSilTrail.shift();
      } else if (ghostSilTrail.length) ghostSilTrail.length = 0;
    }
    // 3.26: ring-buffer last 5s for replay stub
    if (bird && state === 'playing') {
      replaySampleAcc += sdt;
      if (replaySampleAcc >= 0.1) {
        replaySampleAcc = 0;
        pushReplaySample(now);
      }
    }

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
    // 3.23/3.36 soft landing dust + bounce juice when skimming ground
    if (bird && bird.alive && state === 'playing') {
      var gY = H - GROUND_H;
      var distG = gY - (bird.y + bird.h / 2);
      if (distG < 14 && bird.vy > 40) {
        var nowD = performance.now();
        if (nowD - lastLandingDustAt > 180) {
          lastLandingDustAt = nowD;
          if (!reduceMotion) {
            spawnLandingDust(bird.x, gY - 2, bird.vy > 180 ? 12 : 7);
            spawnGroundBounceJuice(bird.x, gY - 2, bird.vy);
          }
          squashTarget = 0.78;
          if (!reduceMotion) {
            camKickY = Math.min(6, 2 + bird.vy / 120);
            camKickZoom = 0.012;
          }
          // soft micro-bounce dampen (visual juice, not a save)
          if (distG < 8 && bird.vy > 90) bird.vy *= 0.82;
        }
      }
    }

    var targetRot = Math.max(-0.65, Math.min(1.25, bird.vy / 500));
    bird.rot += (targetRot - bird.rot) * Math.min(1, sdt * 12);

    metersFlown += currentSpeed * sdt * M_PER_PX;

    // 3.29: pre-chase warning when within ~28m of next boss
    if (!bossActive && !isPractice() && metersFlown < nextBossAt) {
      var distLeft = nextBossAt - metersFlown;
      if (distLeft <= 28) {
        if (!bossWarnActive) {
          bossWarnActive = true;
          bossWarnPulse = 1;
          showToast('⚠ Chase inbound · brace!', 1200, 'close');
          haptic('boss');
        }
      } else {
        bossWarnActive = false;
      }
    }
    // Boss / Chase events every N distance (30–60s then normal)
    if (!bossActive && metersFlown >= nextBossAt && !isPractice()) {
      bossActive = true;
      bossWarnActive = false;
      bossPulse = 1;
      bossWarnPulse = 1;
      var dur = (BOSS_MIN_S + rng() * (BOSS_MAX_S - BOSS_MIN_S)) * 1000;
      bossUntil = now + dur;
      bossDurMs = dur;
      bossKind = FTSkins.pickBossKind ? FTSkins.pickBossKind(rng) : { id: 'truck', label: 'GIANT TRUCK', emoji: '🚛' };
      nextBossAt = metersFlown + BOSS_EVERY_M + rng() * 40;
      if (FTAudio.boss) FTAudio.boss();
      showBanner((bossKind.emoji || '⚠') + ' DANGER — ' + (bossKind.label || 'CHASE') + '!', 2000);
      showToast((bossKind.emoji || '⚠') + ' CHASE! Survive ' + Math.round(dur / 1000) + 's', 1600, 'close');
      voiceCue('bach_ke');
      triggerShake();
      haptic('boss');
      if (!reduceMotion) spawnConfettiBurst(W * 0.5, 80, 10);
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
    if (bossWarnPulse > 0) bossWarnPulse = Math.max(0, bossWarnPulse - sdt * 1.1);

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
    // 3.27 env transition fade
    if (lastEnvArea == null) lastEnvArea = areaNow;
    else if (areaNow !== lastEnvArea) {
      envFadeFrom = lastEnvArea;
      envFade = 1;
      lastEnvArea = areaNow;
    }
    if (envFade > 0) envFade = Math.max(0, envFade - sdt * 1.35);

    // 3.30/3.50 perf: adaptive trail interval — reuse frame particle budget
    trailAcc += sdt;
    var trailGap = TRAIL_INTERVAL;
    if (particles.length > _pCap * 0.7) trailGap = TRAIL_INTERVAL * 2.2;
    else if (reduceMotion) trailGap = TRAIL_INTERVAL * 3;
    if (trailAcc >= trailGap) { trailAcc = 0; spawnTrailParticle(); }

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
          // 3.13/3.24 magnet suction trail (throttled micro-perf)
          magnetPullAcc += sdt;
          if (!reduceMotion && magnetPullAcc > 0.045) {
            magnetPullAcc = 0;
            particles.push({
              x: c.x, y: c.y,
              vx: (cdx / dist) * 55, vy: (cdy / dist) * 55,
              life: 0.28, max: 0.4,
              color: rng() < 0.5 ? '#f9a8d4' : '#ffd93d',
              r: 1.8 + rng() * 1.4,
              kind: 'trail'
            });
            // pull swirl mote toward bird
            particles.push({
              x: c.x + (rng() - 0.5) * 6, y: c.y + (rng() - 0.5) * 6,
              vx: (cdx / dist) * 90, vy: (cdy / dist) * 90,
              life: 0.2, max: 0.3,
              color: '#ec4899',
              r: 1.2 + rng(),
              kind: 'spark'
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
      // 3.39 ribbon trail samples
      if (!reduceMotion) {
        if (!b.trail) b.trail = [];
        // 3.40 perf: sample trail every other frame-ish via distance
        var last = b.trail.length ? b.trail[b.trail.length - 1] : null;
        var by = b.y + (Math.sin(performance.now() / 220 + b.x * 0.08) * 5);
        if (!last || (last.x - b.x) * (last.x - b.x) + (last.y - by) * (last.y - by) > 36) {
          b.trail.push({ x: b.x, y: by });
          if (b.trail.length > 8) b.trail.shift();
        }
      }
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


  /** 3.38/3.39: celestial flare — day / dusk / night moon. Skip under reduce-motion. */
  function drawSunFlare(sx, sy, sr, weather, pal, mode) {
    if (reduceMotion) return;
    if (weather === 'storm' || weather === 'rain') return;
    var t = performance.now() / 1000;
    var isNight = mode === 'night' || weather === 'night' || (pal && pal.stars);
    var isSunset = !isNight && (mode === 'dusk' || weather === 'sunset');
    var haloR = sr * (isNight ? 4.8 : (isSunset ? 5.5 : 4.2));
    var halo = ctx.createRadialGradient(sx, sy, sr * 0.35, sx, sy, haloR);
    if (isNight) {
      halo.addColorStop(0, 'rgba(220,230,255,0.55)');
      halo.addColorStop(0.4, 'rgba(140,170,255,0.18)');
      halo.addColorStop(1, 'rgba(80,100,200,0)');
    } else if (isSunset) {
      halo.addColorStop(0, 'rgba(255,200,120,0.55)');
      halo.addColorStop(0.35, 'rgba(255,120,60,0.22)');
      halo.addColorStop(1, 'rgba(255,80,40,0)');
    } else {
      halo.addColorStop(0, 'rgba(255,250,200,0.5)');
      halo.addColorStop(0.4, 'rgba(255,230,140,0.18)');
      halo.addColorStop(1, 'rgba(255,255,255,0)');
    }
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(sx, sy, haloR, 0, Math.PI * 2);
    ctx.fill();
    var rays = isNight ? 5 : (isSunset ? 8 : 6);
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(t * (isNight ? 0.03 : (isSunset ? 0.08 : 0.05)));
    for (var r = 0; r < rays; r++) {
      ctx.rotate((Math.PI * 2) / rays);
      var len = sr * (isNight ? 2.4 : (isSunset ? 3.2 : 2.6)) + Math.sin(t * 2 + r) * (isNight ? 2 : 4);
      var grd = ctx.createLinearGradient(0, 0, len, 0);
      if (isNight) grd.addColorStop(0, 'rgba(180,200,255,0.28)');
      else grd.addColorStop(0, isSunset ? 'rgba(255,180,80,0.35)' : 'rgba(255,255,220,0.28)');
      grd.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.moveTo(sr * 0.55, -2);
      ctx.lineTo(len, 0);
      ctx.lineTo(sr * 0.55, 2);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    if (isNight) {
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = '#0b1020';
      ctx.beginPath();
      ctx.arc(sx + sr * 0.35, sy - sr * 0.15, sr * 0.85, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      for (var si = 0; si < 6; si++) {
        var ang = t * 0.6 + si * 1.1;
        var rad = sr * 2.2 + (si % 3) * 8;
        ctx.globalAlpha = 0.35 + 0.35 * Math.sin(t * 3 + si);
        ctx.fillStyle = '#e8eeff';
        ctx.fillRect(sx + Math.cos(ang) * rad, sy + Math.sin(ang) * rad, 2, 2);
      }
      ctx.globalAlpha = 1;
      var nWash = ctx.createLinearGradient(0, 0, 0, H * 0.4);
      nWash.addColorStop(0, 'rgba(40,60,120,0.12)');
      nWash.addColorStop(1, 'rgba(40,60,120,0)');
      ctx.fillStyle = nWash;
      ctx.fillRect(0, 0, W, H * 0.4);
    } else if (isSunset) {
      var wash = ctx.createLinearGradient(0, H * 0.45, 0, H - GROUND_H);
      wash.addColorStop(0, 'rgba(255,100,40,0)');
      wash.addColorStop(0.6, 'rgba(255,90,40,0.12)');
      wash.addColorStop(1, 'rgba(255,60,30,0.18)');
      ctx.fillStyle = wash;
      ctx.fillRect(0, H * 0.45, W, H - GROUND_H - H * 0.45);
    } else {
      var gx = W * 0.35 + Math.sin(t * 0.7) * 6;
      var gy = H * 0.45;
      ctx.globalAlpha = 0.12;
      ctx.fillStyle = '#fff8dc';
      ctx.beginPath();
      ctx.arc(gx, gy, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.08;
      ctx.beginPath();
      ctx.arc(gx * 0.7 + 40, gy + 30, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }


  // 3.40: cached night starfield (perf + polish)
  var starfieldCache = null;
  var starfieldW = 0, starfieldH = 0;
  var shootingStar = null; // 3.41 rare night shooting star
  var starCoinRunGain = 0; // 3.43 per-run cap
  var starCoinLastAt = 0;
  var STAR_COIN_CHANCE = 0.12;
  var STAR_COIN_RUN_CAP = 3;
  var STAR_COIN_COOLDOWN_MS = 10000;
  var nightAmbAcc = 0; // 3.45 night ambience SFX cadence
  function ensureStarfield() {
    if (starfieldCache && starfieldW === W && starfieldH === H) return starfieldCache;
    starfieldW = W; starfieldH = H;
    var n = reduceMotion ? 28 : 56;
    starfieldCache = [];
    for (var i = 0; i < n; i++) {
      var layer = i % 3; // 0 far, 1 mid, 2 near
      starfieldCache.push({
        x: (i * 97 + 40) % W,
        y: (i * 53 + 17) % Math.max(120, H * 0.42),
        r: layer === 2 ? 1.6 : (layer === 1 ? 1.2 : 0.9),
        a: layer === 2 ? 0.95 : (layer === 1 ? 0.7 : 0.45),
        tw: Math.random() * Math.PI * 2,
        spd: 0.8 + layer * 0.6,
        bright: i % 11 === 0
      });
    }
    return starfieldCache;
  }
  function drawStarfield() {
    var stars = ensureStarfield();
    var t = performance.now() / 1000;
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      var twinkle = reduceMotion ? 1 : (0.55 + 0.45 * Math.sin(t * s.spd + s.tw));
      ctx.globalAlpha = s.a * twinkle;
      ctx.fillStyle = s.bright ? '#fff8e7' : '#e8eeff';
      if (s.bright && !reduceMotion) {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r + 0.8 * twinkle, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(s.x, s.y, s.r * 2, s.r * 2);
      }
    }
    ctx.globalAlpha = 1;
    // soft milky band
    if (!reduceMotion) {
      var band = ctx.createLinearGradient(0, H * 0.08, W, H * 0.28);
      band.addColorStop(0, 'rgba(160,180,255,0)');
      band.addColorStop(0.45, 'rgba(180,200,255,0.06)');
      band.addColorStop(1, 'rgba(160,180,255,0)');
      ctx.fillStyle = band;
      ctx.fillRect(0, 0, W, H * 0.35);
    }
    // 3.41: rare shooting star (night only; skip under reduce-motion)
    drawShootingStar();
  }

  function drawShootingStar() {
    if (reduceMotion) { shootingStar = null; return; }
    if (!shootingStar || shootingStar.life <= 0) {
      // ~0.18% per night frame ≈ rare streak every ~10–30s at 60fps
      if (Math.random() > 0.0018) return;
      var fromLeft = Math.random() < 0.55;
      var life = 36 + Math.floor(Math.random() * 28);
      shootingStar = {
        x: fromLeft ? -12 : W + 12,
        y: 18 + Math.random() * Math.max(40, H * 0.32),
        vx: fromLeft ? (7.5 + Math.random() * 5.5) : -(7.5 + Math.random() * 5.5),
        vy: 2.8 + Math.random() * 3.6,
        life: life,
        maxLife: life
      };
    }
    var s = shootingStar;
    s.x += s.vx;
    s.y += s.vy;
    s.life--;
    var a = Math.max(0, s.life / s.maxLife);
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = 'rgba(255,248,220,' + (0.75 * a) + ')';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(s.x - s.vx * 3.8, s.y - s.vy * 3.8);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,' + (0.95 * a) + ')';
    ctx.beginPath();
    ctx.arc(s.x, s.y, 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,220,140,' + (0.35 * a) + ')';
    ctx.beginPath();
    ctx.arc(s.x, s.y, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    if (s.life <= 0 || s.x < -80 || s.x > W + 80 || s.y > H * 0.55) {
      // 3.42/3.43: rare star coin — lower chance, run cap, cooldown, mostly +1
      if (!s.rewarded && state === 'playing') {
        s.rewarded = true;
        var now = performance.now();
        var room = STAR_COIN_RUN_CAP - starCoinRunGain;
        var cooled = (now - starCoinLastAt) >= STAR_COIN_COOLDOWN_MS;
        if (room > 0 && cooled && Math.random() < STAR_COIN_CHANCE) {
          var n = (room >= 2 && Math.random() < 0.22) ? 2 : 1;
          if (n > room) n = room;
          starCoinRunGain += n;
          starCoinLastAt = now;
          if (FTStorage.addCoins) FTStorage.addCoins(n);
          if (typeof updateCoinHud === 'function') updateCoinHud();
          if (typeof pingCoinHudStar === 'function') pingCoinHudStar();
          showToast('⭐ Star luck! +' + n + ' 🪙' + (starCoinRunGain >= STAR_COIN_RUN_CAP ? ' · cap' : ''), 2000, 'lucky');
          if (FTAudio && FTAudio.coin) FTAudio.coin();
          else if (FTAudio && FTAudio.score) FTAudio.score();
          if (typeof haptic === 'function') haptic('gift');
        }
      }
      shootingStar = null;
    }
  }

  function drawSky() {
    var area = activeArea();
    var weather = effectiveWeather();
    var palEnv = (area === 'rain' || area === 'monsoon') ? 'city' : area;
    var pal = FTSkins.envPalette(palEnv, weather);
    // 3.27: crossfade previous env sky
    if (envFade > 0.02 && envFadeFrom && !reduceMotion) {
      var fromEnv = (envFadeFrom === 'rain' || envFadeFrom === 'monsoon') ? 'city' : envFadeFrom;
      var palFrom = FTSkins.envPalette(fromEnv, weather);
      var gFrom = ctx.createLinearGradient(0, 0, 0, H);
      gFrom.addColorStop(0, palFrom.sky0);
      gFrom.addColorStop(0.55, palFrom.sky1);
      gFrom.addColorStop(1, palFrom.sky2);
      ctx.fillStyle = gFrom;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1 - envFade;
    }
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, pal.sky0);
    g.addColorStop(0.55, pal.sky1);
    g.addColorStop(1, pal.sky2);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    if (envFade > 0.02 && envFadeFrom && !reduceMotion) ctx.globalAlpha = 1;

    ctx.fillStyle = pal.sun;
    ctx.beginPath();
    if (pal.stars || area === 'night' || area === 'quetta' || weather === 'night') {
      var moonX = W - 70, moonY = 80, moonR = 22;
      ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
      ctx.fill();
      drawSunFlare(moonX, moonY, moonR, weather, pal, 'night');
      drawStarfield();
      // 3.45 soft night ambience haze
      if (!reduceMotion) {
        var haze = ctx.createLinearGradient(0, 0, 0, H * 0.55);
        haze.addColorStop(0, 'rgba(30,50,110,0.10)');
        haze.addColorStop(0.55, 'rgba(20,30,70,0.04)');
        haze.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = haze;
        ctx.fillRect(0, 0, W, H * 0.55);
      }
      // 3.13/3.40 night city window lights (tick cached ~2s)
      drawSky._nightTick = Math.floor(performance.now() / 2000);
      var gy = H - GROUND_H;
      for (var bi = 0; bi < 6; bi++) {
        var bx = ((bi * 78 + groundX * 0.6) % (W + 40)) - 10;
        var bh = 28 + (bi % 3) * 14;
        ctx.fillStyle = 'rgba(20,28,48,0.85)';
        ctx.fillRect(bx, gy - bh, 36, bh);
        for (var wy = 0; wy < 3; wy++) {
          for (var wx = 0; wx < 2; wx++) {
            if ((bi + wy + wx + (drawSky._nightTick || 0)) % 5 === 0) continue;
            ctx.fillStyle = (bi + wy) % 2 ? 'rgba(255,220,120,0.85)' : 'rgba(120,200,255,0.7)';
            ctx.fillRect(bx + 6 + wx * 14, gy - bh + 6 + wy * 10, 8, 6);
          }
        }
      }
      ctx.fillStyle = 'rgba(255,180,80,0.12)';
      ctx.fillRect(0, gy - 18, W, 18);
    } else {
      var sunX = W - 60;
      var sunY = 70;
      var sunR = weather === 'sunset' ? 32 : 28;
      if (weather === 'sunset') { sunX = W - 50; sunY = H * 0.38; sunR = 34; }
      else if (weather === 'clear' || weather === 'fog') { sunY = 62; }
      ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
      ctx.fill();
      drawSunFlare(sunX, sunY, sunR, weather, pal, weather === 'sunset' ? 'dusk' : 'day');
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

    // 3.37/3.40: draw far→near — reuse sorted list
    var sortedClouds = clouds;
    if (!reduceMotion && clouds.length > 1) {
      if (!_cloudsSorted || _cloudsSortedLen !== clouds.length) {
        _cloudsSorted = clouds.slice().sort(function (a, b) {
          return (a.depth != null ? a.depth : a.s) - (b.depth != null ? b.depth : b.s);
        });
        _cloudsSortedLen = clouds.length;
      }
      sortedClouds = _cloudsSorted;
    }
    sortedClouds.forEach(function (c) {
      var depth = c.depth != null ? c.depth : c.s;
      var bobY = (!reduceMotion && c.bob != null) ? Math.sin(c.bob) * (2 + depth * 3) : 0;
      var alpha = c.a != null ? c.a : (0.4 + depth * 0.5);
      ctx.globalAlpha = Math.max(0.2, Math.min(1, alpha));
      ctx.fillStyle = pal.cloud;
      ctx.beginPath();
      ctx.ellipse(c.x, c.y + bobY, c.w, c.w * 0.45, 0, 0, Math.PI * 2);
      ctx.ellipse(c.x + c.w * 0.4, c.y + bobY + 4, c.w * 0.7, c.w * 0.35, 0, 0, Math.PI * 2);
      if (depth > 0.55) {
        ctx.ellipse(c.x - c.w * 0.35, c.y + bobY + 2, c.w * 0.55, c.w * 0.3, 0, 0, Math.PI * 2);
      }
      ctx.fill();
      ctx.globalAlpha = 1;
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
    var t = performance.now();
    // 3.38: richer bob + tilt (still static under reduce-motion)
    var bob = reduceMotion ? 0 : Math.sin(t / 220 + b.x * 0.08) * 5;
    var tilt = reduceMotion ? 0 : Math.sin(t / 320 + b.x * 0.05) * 0.12;
    var pulse = reduceMotion ? 1 : (0.82 + 0.18 * Math.sin(t / 160 + b.x * 0.05));
    ctx.save();
    ctx.translate(b.x, b.y + bob);
    if (!reduceMotion) ctx.rotate(tilt);
    // 3.18/3.38: soft outer glow + pulse ring
    if (!reduceMotion) {
      ctx.globalAlpha = 0.3 * pulse;
      ctx.fillStyle = '#c084fc';
      ctx.beginPath();
      ctx.arc(0, 0, 24 * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.6;
      ctx.strokeStyle = '#ffd93d';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 17 + 4 * pulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
      // shadow under bobbing box
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.ellipse(0, 16 - bob * 0.3, 10, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = '#8e44ad';
    ctx.fillRect(-12, -12, 24, 24);
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-12, -12, 24, 24);
    ctx.fillStyle = '#ffd93d';
    ctx.fillRect(-12, -2, 24, 4);
    ctx.fillRect(-2, -12, 4, 24);
    // ribbon ends sway
    if (!reduceMotion) {
      var sway = Math.sin(t / 180 + b.x) * 2;
      ctx.strokeStyle = '#ffd93d';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -12);
      ctx.quadraticCurveTo(-6 + sway, -20, -4, -26);
      ctx.moveTo(0, -12);
      ctx.quadraticCurveTo(6 - sway, -20, 4, -26);
      ctx.stroke();
    }
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('?', 0, 1);
    ctx.restore();
    // 3.39: ribbon trail (world-space)
    if (!reduceMotion && b.trail && b.trail.length > 1) {
      ctx.save();
      ctx.lineCap = 'round';
      for (var ti = 1; ti < b.trail.length; ti++) {
        var p0 = b.trail[ti - 1], p1 = b.trail[ti];
        var a = ti / b.trail.length;
        ctx.globalAlpha = 0.12 + a * 0.5;
        ctx.strokeStyle = ti % 2 ? '#ffd93d' : '#c084fc';
        ctx.lineWidth = 1.5 + 2 * a;
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.restore();
    }
  }

  function drawParticles() {
    if (!particles.length) return; // 3.20 micro-perf
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
      if (pt.kind === 'dust') {
        ctx.globalAlpha = a * 0.7;
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.ellipse(pt.x, pt.y, pt.r * 1.4, pt.r * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        continue;
      }
      if (pt.kind === 'coin_rain') {
        ctx.globalAlpha = a;
        ctx.save();
        ctx.translate(pt.x, pt.y);
        ctx.rotate(pt.rot || 0);
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, pt.r * 1.1, pt.r * 0.85, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(122,90,0,0.55)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = 'rgba(122,90,0,0.55)';
        ctx.font = 'bold ' + Math.max(7, pt.r + 3) + 'px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🪙', 0, 0.5);
        ctx.restore();
        ctx.globalAlpha = 1;
        continue;
      }
      if (pt.kind === 'fw_rocket') {
        ctx.globalAlpha = a;
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = a * 0.5;
        ctx.fillStyle = '#fff';
        ctx.fillRect(pt.x - 1, pt.y, 2, 10);
        ctx.globalAlpha = 1;
        continue;
      }
      if (pt.kind === 'fw_spark') {
        ctx.globalAlpha = a;
        ctx.fillStyle = pt.color;
        ctx.save();
        ctx.translate(pt.x, pt.y);
        ctx.rotate(pt.rot || 0);
        ctx.beginPath();
        ctx.moveTo(0, -pt.r);
        ctx.lineTo(pt.r * 0.45, 0);
        ctx.lineTo(0, pt.r);
        ctx.lineTo(-pt.r * 0.45, 0);
        ctx.closePath();
        ctx.fill();
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
    if (!scorePops.length) return; // 3.30 perf
    scorePops.forEach(function (sp) {
      var a = Math.max(0, sp.life / sp.max);
      var sc = sp.scale || 1;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.translate(sp.x, sp.y);
      ctx.scale(sc, sc);
      if (sp.kind === 'coin') {
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(15,23,42,0.55)';
        ctx.fillStyle = '#fde68a';
        ctx.font = 'bold 18px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeText(sp.text, 0, 0);
        ctx.fillStyle = '#fbbf24';
        ctx.fillText(sp.text, 0, 0);
      } else {
        ctx.fillStyle = '#ffd93d';
        ctx.font = 'bold 16px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(sp.text, 0, 0);
      }
      ctx.restore();
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

  function drawNearMissEdgeFlash() {
    if (nearMissEdgeFlash <= 0 || reduceMotion) return;
    var a = 0.55 * nearMissEdgeFlash;
    var thick = 14 + nearMissEdgeFlash * 10;
    ctx.save();
    var grad;
    if (nearMissEdgeSide === 'top') {
      grad = ctx.createLinearGradient(0, 0, 0, thick * 2);
      grad.addColorStop(0, 'rgba(255,217,61,' + a.toFixed(3) + ')');
      grad.addColorStop(1, 'rgba(255,217,61,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, thick * 2);
    } else if (nearMissEdgeSide === 'bottom') {
      grad = ctx.createLinearGradient(0, H, 0, H - thick * 2);
      grad.addColorStop(0, 'rgba(255,107,107,' + a.toFixed(3) + ')');
      grad.addColorStop(1, 'rgba(255,107,107,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, H - thick * 2, W, thick * 2);
    } else {
      // side fallback amber wash
      ctx.fillStyle = 'rgba(251,191,36,' + (a * 0.35).toFixed(3) + ')';
      ctx.fillRect(0, 0, thick, H);
      ctx.fillRect(W - thick, 0, thick, H);
    }
    // soft vertical rails
    ctx.fillStyle = 'rgba(255,255,255,' + (a * 0.25).toFixed(3) + ')';
    ctx.fillRect(0, 0, 3, H);
    ctx.fillRect(W - 3, 0, 3, H);
    ctx.restore();
  }

  function drawHitFlash() {
    if (hitFlash <= 0) return;
    var r = 255, g = state === 'dying' ? 80 : 255, b = state === 'dying' ? 80 : 255;
    ctx.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + (0.55 * hitFlash).toFixed(3) + ')';
    ctx.fillRect(0, 0, W, H);
  }

  function drawShieldAura() {
    if (!bird || !shieldActive) return;
    var t = performance.now() / 1000;
    var R = Math.max(bird.w, bird.h) * 0.75 + 8;
    ctx.save();
    // 3.24: soft bubble fill + shimmer arcs
    var g = ctx.createRadialGradient(bird.x - 5, bird.y - 7, 2, bird.x, bird.y, R);
    g.addColorStop(0, 'rgba(186,230,253,0.28)');
    g.addColorStop(0.55, 'rgba(56,189,248,0.14)');
    g.addColorStop(1, 'rgba(14,165,233,0.04)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(bird.x, bird.y, R, 0, Math.PI * 2);
    ctx.fill();
    if (!reduceMotion) {
      for (var si = 0; si < 3; si++) {
        var a0 = t * 2.4 + si * 2.094;
        ctx.strokeStyle = 'rgba(224,242,254,' + (0.4 + 0.4 * Math.sin(t * 5 + si)).toFixed(3) + ')';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(bird.x, bird.y, R - 2, a0, a0 + 0.85);
        ctx.stroke();
      }
      // specular glint
      ctx.strokeStyle = 'rgba(255,255,255,' + (0.35 + 0.25 * Math.sin(t * 7)).toFixed(3) + ')';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(bird.x - R * 0.25, bird.y - R * 0.35, R * 0.45, -0.8, 0.4);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(120,210,255,0.88)';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.arc(bird.x, bird.y, R, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawGhostAura() {
    if (!bird || !ghostActive()) return;
    var t = performance.now() / 1000;
    var rem = Math.max(0, (ghostUntil - performance.now()) / GHOST_MS);
    ctx.save();
    // 3.25: ghost silhouette trail (soft slate ovals along path)
    if (!reduceMotion && ghostSilTrail.length) {
      for (var gi = 0; gi < ghostSilTrail.length; gi++) {
        var gp = ghostSilTrail[gi];
        var ga = (gi + 1) / ghostSilTrail.length * 0.22 * rem;
        ctx.globalAlpha = ga;
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.ellipse(gp.x, gp.y, 13, 9, gp.rot || 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = ga * 0.7;
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    } else if (!reduceMotion) {
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
    var pulse = reduceMotion ? 1 : (0.92 + 0.08 * Math.sin(performance.now() / 280));
    ctx.save();
    // 3.25: deeper purple vignette (clear center, dark corners)
    var gV = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.18 * pulse, W / 2, H / 2, Math.max(W, H) * 0.78);
    gV.addColorStop(0, 'rgba(167,139,250,0)');
    gV.addColorStop(0.45, 'rgba(91,33,182,' + (0.06 * rem).toFixed(3) + ')');
    gV.addColorStop(0.75, 'rgba(76,29,149,' + (0.22 + 0.18 * rem).toFixed(3) + ')');
    gV.addColorStop(1, 'rgba(15,5,35,' + (0.42 + 0.22 * rem).toFixed(3) + ')');
    ctx.fillStyle = gV;
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
    // 3.25: amber afterimage trail along recent path
    if (!reduceMotion && turboTrail.length) {
      for (var ti = 0; ti < turboTrail.length; ti++) {
        var tp = turboTrail[ti];
        var ta = ((ti + 1) / turboTrail.length) * 0.35 * rem;
        ctx.globalAlpha = ta;
        ctx.fillStyle = ti % 2 ? '#fbbf24' : '#f59e0b';
        ctx.beginPath();
        ctx.ellipse(tp.x, tp.y, 11, 7.5, tp.rot || 0, 0, Math.PI * 2);
        ctx.fill();
        if (ti > turboTrail.length - 4) {
          ctx.globalAlpha = ta * 0.55;
          FTSkins.draw(ctx, birdId, tp.x, tp.y, tp.rot || 0, 0.85, {
            vehicle: 'none', hat: 'none', reduceMotion: true
          });
        }
      }
      ctx.globalAlpha = 1;
    }
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
    var opa = Math.max(0.15, Math.min(0.85, practiceGhostOpacity || 0.38));
    ctx.globalAlpha = opa;
    FTSkins.draw(ctx, birdId, practiceGhost.x, practiceGhost.y, practiceGhost.rot, 0.92, {
      vehicle: 'none', hat: 'none', reduceMotion: true, wingFlap: Math.sin(performance.now() / 120) * 0.4
    });
    ctx.globalAlpha = Math.min(0.85, opa + 0.17);
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
    var rem = Math.max(0, Math.min(1, (magnetUntil - performance.now()) / 4000));
    var pulse = 38 + Math.sin(t * 6) * 4;
    ctx.save();
    // 3.24: dual pulse rings
    ctx.strokeStyle = 'rgba(249,168,212,' + (0.3 + 0.28 * Math.sin(t * 8) * rem).toFixed(3) + ')';
    ctx.lineWidth = 2.2;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.arc(bird.x, bird.y, pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = 'rgba(236,72,153,' + (0.18 * rem).toFixed(3) + ')';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(bird.x, bird.y, pulse + 10 + Math.sin(t * 5) * 2, 0, Math.PI * 2);
    ctx.stroke();
    // pull beams to nearby coins
    if (!reduceMotion && coins.length) {
      for (var mi = 0; mi < coins.length; mi++) {
        var c = coins[mi];
        if (c.taken) continue;
        var dx = c.x - bird.x, dy = c.y - bird.y;
        var d = Math.sqrt(dx * dx + dy * dy) || 1;
        if (d >= 140 || d < 10) continue;
        var a = (0.2 + 0.45 * (1 - d / 140) * rem);
        ctx.strokeStyle = 'rgba(249,168,212,' + a.toFixed(3) + ')';
        ctx.lineWidth = 1.4 + (1 - d / 140);
        ctx.beginPath();
        ctx.moveTo(bird.x, bird.y);
        ctx.quadraticCurveTo(bird.x + dx * 0.45, bird.y + dy * 0.45 - 10, c.x, c.y);
        ctx.stroke();
        // tip spark
        ctx.fillStyle = 'rgba(255,217,61,' + (a * 0.9).toFixed(3) + ')';
        ctx.beginPath();
        ctx.arc(c.x, c.y, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.fillStyle = 'rgba(251,207,232,0.9)';
    ctx.font = 'bold 10px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('🧲', bird.x, bird.y - pulse - 6);
    ctx.restore();
  }

  function drawFrame(idle) {
    // 3.26: death camera freeze zoom toward bird
    var dZoom = (state === 'dying' && !reduceMotion) ? deathCamZoom : 0;
    if (state === 'dying' && !reduceMotion) deathCamZoom = Math.min(0.14, deathCamZoom + 0.012);
    var kick = !reduceMotion && (camKickX || camKickY || camKickZoom || dZoom);
    if (kick) {
      ctx.save();
      var cx = (state === 'dying' && bird) ? bird.x : W / 2;
      var cy = (state === 'dying' && bird) ? bird.y : H / 2;
      ctx.translate(cx + camKickX, cy + camKickY);
      ctx.scale(1 + camKickZoom + dZoom, 1 + camKickZoom + dZoom);
      ctx.translate(-cx, -cy);
    }
    drawSky();
    // 3.30 perf: skip parallax under particle pressure / reduce-motion
    if (!reduceMotion && particles.length < particleBudget() * 0.85) drawPipeParallaxMicro();
    pipes.forEach(drawPipe);
    drawPerfectRails();
    // 3.24 micro-perf: skip empty entity passes
    if (traffic.length) traffic.forEach(function (t) { FTSkins.drawTraffic(ctx, t); });
    if (powerups.length) powerups.forEach(drawPowerup);
    if (coins.length) coins.forEach(drawCoin);
    if (boxes.length) boxes.forEach(drawBox);
    drawGround();
    drawParticles();
    // 3.30 perf: weather FX only while actively flying / dying
    if (state === 'playing' || state === 'dying' || state === 'paused') drawWeatherFX();
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
    // 3.29: pre-chase warning wash + inbound meter
    if (state === 'playing' && bossWarnActive && !bossActive && !reduceMotion) {
      var distL = Math.max(0, nextBossAt - metersFlown);
      var warnA = 0.08 + 0.1 * Math.sin(performance.now() / 140) + bossWarnPulse * 0.15;
      ctx.fillStyle = 'rgba(220, 38, 38,' + warnA.toFixed(3) + ')';
      ctx.fillRect(0, 0, W, 10);
      ctx.fillRect(0, H - 10, W, 10);
      ctx.fillStyle = 'rgba(15,23,42,0.75)';
      ctx.fillRect(W / 2 - 70, 8, 140, 28);
      ctx.fillStyle = '#fca5a5';
      ctx.font = 'bold 12px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('⚠ INBOUND · ' + Math.ceil(distL) + 'm', W / 2, 26);
    }
    if (state === 'playing' && bossActive && bossKind) {
      var left = Math.max(0, (bossUntil - performance.now()) / 1000);
      var pulseA = 0.12 + 0.1 * Math.sin(performance.now() / 160) + bossPulse * 0.22;
      ctx.fillStyle = 'rgba(180,20,40,' + pulseA.toFixed(3) + ')';
      ctx.fillRect(0, 0, W, H);
      // siren stripes
      if (!reduceMotion) {
        var stripeT = performance.now() / 90;
        for (var si = 0; si < 6; si++) {
          ctx.fillStyle = 'rgba(255,255,255,' + (0.04 + 0.03 * Math.sin(stripeT + si)).toFixed(3) + ')';
          ctx.fillRect(((si * 70 + stripeT * 40) % (W + 70)) - 70, 0, 28, H);
        }
      }
      ctx.fillStyle = 'rgba(120,10,20,0.88)';
      ctx.fillRect(0, 32, W, 52);
      ctx.fillStyle = '#ffd93d';
      ctx.font = 'bold 14px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText((bossKind.emoji || '⚠') + ' DANGER — ' + bossKind.label, W / 2, 52);
      var barW = 180;
      var pct = Math.max(0, Math.min(1, (left * 1000) / Math.max(1, bossDurMs)));
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(W / 2 - barW / 2, 62, barW, 8);
      ctx.fillStyle = pct < 0.25 ? '#fbbf24' : '#ff6b6b';
      ctx.fillRect(W / 2 - barW / 2, 62, barW * pct, 8);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 11px system-ui';
      ctx.fillText('Survive ' + Math.ceil(left) + 's', W / 2, 82);
    }
    if (state === 'dying') drawReplayPathStub();
    if (kick) ctx.restore();
    if (state === 'playing') drawNearMissEdgeFlash();
    if (state === 'dying') drawDeathFreezeOverlay();
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
  /** 3.35: during play only block real controls — not whole .screen (letterbox dead-zone fix). */
  var FLAP_UI_BLOCK = 'button, a, input, select, textarea, label, .icon-btn, .skin-card, #ad-stub-modal, .tab-btn, .mission-card, .chip, .garage-filter, .power-chip, .panel-close, #coach-marks, .a2hs, .toast, .offline-banner';
  var FLAP_UI_BLOCK_MENU = FLAP_UI_BLOCK + ', .screen.panel-screen, .settings-screen, .pause-screen';
  /** 3.18/3.35: shared flap path — touchstart first; #app letterbox also flaps. */
  function tryFlapFromInput(e) {
    var block = (state === 'playing') ? FLAP_UI_BLOCK : FLAP_UI_BLOCK_MENU;
    if (e.target && e.target.closest && e.target.closest(block)) return false;
    if (state !== 'playing' && state !== 'menu') return false;
    var now = performance.now();
    // 18ms debounce: blocks touch+pointer double-fire without delaying first tap
    if (now - lastFlapTouchTs < 18) return false;
    lastFlapTouchTs = now;
    if (e.cancelable) e.preventDefault();
    flap();
    if (coachActive) advanceCoach(true);
    return true;
  }
  function onPointer(e) {
    tryFlapFromInput(e);
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


  // 3.22: prevent iOS/Android double-tap zoom (viewport + gesture + dblclick)
  (function preventDoubleTapZoom() {
    try {
      document.addEventListener('gesturestart', function (e) {
        if (e.cancelable) e.preventDefault();
      }, { passive: false });
      document.addEventListener('gesturechange', function (e) {
        if (e.cancelable) e.preventDefault();
      }, { passive: false });
      var lastTouchEnd = 0;
      document.addEventListener('touchend', function (e) {
        var now = Date.now();
        if (now - lastTouchEnd <= 320) {
          if (e.cancelable) e.preventDefault();
        }
        lastTouchEnd = now;
      }, { passive: false });
      document.addEventListener('dblclick', function (e) {
        if (e.cancelable) e.preventDefault();
      }, { passive: false });
    } catch (errZ) { /* ignore */ }
  })();

  canvas.style.touchAction = 'none';
  var appElTouch = document.getElementById('app');
  if (appElTouch) appElTouch.style.touchAction = 'none';
  // 3.18/3.35: touchstart before pointerdown; #app catches letterbox dead-zones
  canvas.addEventListener('touchstart', function (e) {
    if (state === 'playing' || state === 'menu') tryFlapFromInput(e);
  }, { passive: false });
  canvas.addEventListener('pointerdown', onPointer, { passive: false });
  if (appElTouch) {
    appElTouch.addEventListener('touchstart', function (e) {
      if (e.target === canvas || (canvas.contains && canvas.contains(e.target))) return;
      if (state === 'playing' || state === 'menu') tryFlapFromInput(e);
    }, { passive: false });
    appElTouch.addEventListener('pointerdown', function (e) {
      if (e.target === canvas || (canvas.contains && canvas.contains(e.target))) return;
      if (state === 'playing' || state === 'menu') tryFlapFromInput(e);
    }, { passive: false });
  }

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


  /* ——— 3.33: optional swipe-down to dismiss panels ——— */
  var swipeDismissOn = true;
  function syncSwipeDismissPref() {
    swipeDismissOn = !(FTStorage.isSwipeDismiss) || !!FTStorage.isSwipeDismiss();
    if (swipeDismissChk) swipeDismissChk.checked = swipeDismissOn;
    document.documentElement.classList.toggle('swipe-dismiss-on', !!swipeDismissOn);
  }
  (function bindSwipeDismiss() {
    var startY = 0, startX = 0, tracking = false, fromEdge = false;
    var panelsSel = '.panel-screen, .settings-screen, .pause-screen';
    function onStart(e) {
      if (!swipeDismissOn || reduceMotion) return;
      if (state === 'playing') return;
      var t = e.touches && e.touches[0];
      if (!t) return;
      var panel = e.target && e.target.closest ? e.target.closest(panelsSel) : null;
      if (!panel || panel.hidden) return;
      // don't steal from scrollable lists / buttons / wheel
      if (e.target.closest && e.target.closest('button, a, input, select, textarea, .spin-wheel, .wheel-rim, .collection-filters')) return;
      startY = t.clientY;
      startX = t.clientX;
      fromEdge = startY < 72; // top strip / header
      tracking = true;
    }
    function onMove(e) {
      if (!tracking) return;
      var t = e.touches && e.touches[0];
      if (!t) return;
      var dy = t.clientY - startY;
      var dx = Math.abs(t.clientX - startX);
      if (dy > 28 && dy > dx * 1.2 && fromEdge) {
        // visual hint
        var panel = document.querySelector('.panel-screen:not([hidden]), .settings-screen:not([hidden]), .pause-screen:not([hidden])');
        if (panel) panel.style.transform = 'translateY(' + Math.min(120, dy * 0.45) + 'px)';
      }
    }
    function onEnd(e) {
      if (!tracking) return;
      tracking = false;
      var t = (e.changedTouches && e.changedTouches[0]) || null;
      var panel = document.querySelector('.panel-screen:not([hidden]), .settings-screen:not([hidden]), .pause-screen:not([hidden])');
      if (panel) panel.style.transform = '';
      if (!t) return;
      var dy = t.clientY - startY;
      var dx = Math.abs(t.clientX - startX);
      if (fromEdge && dy > 90 && dy > dx * 1.35) {
        closeTopOverlayOrPanel();
      }
    }
    document.addEventListener('touchstart', onStart, { passive: true });
    document.addEventListener('touchmove', onMove, { passive: true });
    document.addEventListener('touchend', onEnd, { passive: true });
    document.addEventListener('touchcancel', function () {
      tracking = false;
      var panel = document.querySelector('.panel-screen:not([hidden]), .settings-screen:not([hidden]), .pause-screen:not([hidden])');
      if (panel) panel.style.transform = '';
    }, { passive: true });
  })();

  function closeTopOverlayOrPanel() {
    if (resumeCountdownBusy) {
      hideResumeCountdown();
      state = 'paused';
      if (screenPause) screenPause.hidden = false;
      setPauseBlur(true);
      return true;
    }
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
  if (btnReplayStub) btnReplayStub.addEventListener('click', function () {
    startReplayVizAnim();
  });
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
  var btnShareImage = document.getElementById('btn-share-image');
  if (btnShareImage) btnShareImage.addEventListener('click', function () {
    shareScoreCardImage();
  });
  if (btnShareCopy) btnShareCopy.addEventListener('click', function () {
    copyShareText(buildShareText());
  });
  if (btnShareClose) btnShareClose.addEventListener('click', function () {
    var ov = document.getElementById('share-preview');
    if (ov) ov.hidden = true;
  });


  // 3.36: remember settings section open/collapsed
  (function bindSettingsSections() {
    var KEY = 'urrjaa:settings-sections';
    var saved = {};
    try { saved = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (_) { saved = {}; }
    document.querySelectorAll('.settings-section').forEach(function (d) {
      var id = d.id || '';
      if (id && Object.prototype.hasOwnProperty.call(saved, id)) {
        if (saved[id]) d.setAttribute('open', '');
        else d.removeAttribute('open');
      }
      d.addEventListener('toggle', function () {
        try {
          var cur = {};
          try { cur = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (__ ) { cur = {}; }
          cur[id] = d.open;
          localStorage.setItem(KEY, JSON.stringify(cur));
        } catch (___) {}
      });
    });
  })();

  var a2hsOk = document.getElementById('a2hs-ok');
  if (a2hsOk) {
    a2hsOk.addEventListener('click', function () {
      try {
        if (deferredA2hsPrompt) {
          // Later = snooze this session only (reappears next visit)
          sessionStorage.setItem(A2HS_LATER_KEY, '1');
        } else {
          localStorage.setItem(A2HS_DISMISS_KEY, '1');
        }
      } catch (_) {}
      var tip = document.getElementById('a2hs');
      if (tip) tip.hidden = true;
      a2hsFlowStep = 0;
    });
  }
  var a2hsInstall = document.getElementById('a2hs-install');
  if (a2hsInstall) {
    a2hsInstall.addEventListener('click', function () {
      if (!deferredA2hsPrompt) {
        a2hsFlowStep = 1;
        updateA2hsTip();
        if (isIosSafari()) {
          showToast('iPhone: Share ↑ → Add to Home Screen', 2400);
        } else {
          showToast('Browser menu → Install / Add to Home Screen', 2200);
        }
        return;
      }
      a2hsFlowStep = 1;
      updateA2hsTip();
      var ev = deferredA2hsPrompt;
      // keep deferred until choice — re-bind if dismissed
      ev.prompt().then(function () {
        return ev.userChoice;
      }).then(function (choice) {
        if (choice && choice.outcome === 'accepted') {
          deferredA2hsPrompt = null;
          a2hsFlowStep = 2;
          try { localStorage.setItem(A2HS_DISMISS_KEY, '1'); } catch (_) {}
          showToast('✓ Installing…', 1200, 'medal');
        } else {
          a2hsFlowStep = 0;
          // prompt consumed; wait for next beforeinstallprompt
          deferredA2hsPrompt = null;
          showToast('Install anytime from this tip', 1400);
        }
        updateA2hsTip();
      }).catch(function () {
        a2hsFlowStep = 0;
        deferredA2hsPrompt = null;
        updateA2hsTip();
      });
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

  // 3.26: clearer mute SVG icons
  var MUTE_SVG_ON = '<svg class="mute-ico" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1-3.29-2.5-4.03v8.05c1.5-.74 2.5-2.26 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>';
  var MUTE_SVG_OFF = '<svg class="mute-ico" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M16.5 12c0-1.77-1-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>';
  function syncMuteBtn() {
    var m = FTStorage.isMuted();
    FTAudio.setMuted(m);
    if (btnMute) {
      btnMute.innerHTML = m ? MUTE_SVG_OFF : MUTE_SVG_ON;
      btnMute.classList.toggle('is-muted', !!m);
      btnMute.setAttribute('aria-pressed', m ? 'true' : 'false');
      btnMute.setAttribute('aria-label', m ? 'Unmute sound' : 'Mute sound');
      btnMute.title = m ? 'Unmute' : 'Mute';
    }
    if (soundToggleChk) soundToggleChk.checked = !m;
  }
  btnMute.addEventListener('click', function () {
    FTStorage.setMuted(!FTStorage.isMuted());
    syncMuteBtn();
  });

  function applyReduceMotionClass() {
    document.documentElement.classList.toggle('reduce-motion', reduceMotion);
  }
  /** 3.23: honor OS prefers-reduced-motion when unset; keep listening for changes. */
  function syncPrefersReducedMotion() {
    starfieldCache = null; // 3.40 rebuild density when motion pref changes
    try {
      var mq = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
      if (!mq) return;
      var raw = null;
      try { raw = localStorage.getItem('flappy-tap:reduce-motion'); } catch (e) { raw = null; }
      if (raw == null && mq.matches) {
        reduceMotion = true;
        if (FTStorage.setReduceMotion) FTStorage.setReduceMotion(true);
        if (reduceMotionChk) reduceMotionChk.checked = true;
        applyReduceMotionClass();
        _particleBudgetCached = -1;
      }
      if (!syncPrefersReducedMotion._bound) {
        syncPrefersReducedMotion._bound = true;
        var onChange = function (ev) {
          try {
            var has = localStorage.getItem('flappy-tap:reduce-motion');
            if (has != null) return; // user preference wins
            reduceMotion = !!ev.matches;
            if (FTStorage.setReduceMotion) FTStorage.setReduceMotion(reduceMotion);
            if (reduceMotionChk) reduceMotionChk.checked = reduceMotion;
            applyReduceMotionClass();
            _particleBudgetCached = -1;
          } catch (err) { /* ignore */ }
        };
        if (mq.addEventListener) mq.addEventListener('change', onChange);
        else if (mq.addListener) mq.addListener(onChange);
      }
    } catch (err2) { /* ignore */ }
  }


  function syncSettingsFormFromStorage() {
    sensitivity = FTStorage.getSensitivity();
    reduceMotion = FTStorage.getReduceMotion();
    hapticsOn = FTStorage.getHaptics();
    hapticIntensity = (FTStorage.getHapticIntensity && FTStorage.getHapticIntensity()) || 'normal';
    practiceGhostOpacity = (FTStorage.getPracticeGhostOpacity && FTStorage.getPracticeGhostOpacity()) || 0.38;
    garageSortMode = (FTStorage.getGarageSort && FTStorage.getGarageSort()) || 'owned';
    if (sensSlider) sensSlider.value = String(sensitivity);
    if (sensValueEl) sensValueEl.textContent = sensitivity.toFixed(2);
    if (reduceMotionChk) reduceMotionChk.checked = reduceMotion;
    applyReduceMotionClass();
    if (hapticsToggleChk) hapticsToggleChk.checked = hapticsOn;
    if (hapticIntensitySel) {
      hapticIntensity = (FTStorage.getHapticIntensity && FTStorage.getHapticIntensity()) || 'normal';
      hapticIntensitySel.value = hapticIntensity;
      hapticIntensitySel.disabled = !hapticsOn;
    }
    if (quietNightChk) quietNightChk.checked = !!(FTStorage.isQuietNight && FTStorage.isQuietNight());
    if (areaMusicChk) areaMusicChk.checked = !!(FTStorage.isAreaMusic && FTStorage.isAreaMusic());
    if (nightAmbVolSel && FTStorage.getNightAmbVol) nightAmbVolSel.value = FTStorage.getNightAmbVol();
    syncNightAmbVol();
    if (swipeDismissChk) swipeDismissChk.checked = !(FTStorage.isSwipeDismiss) || !!FTStorage.isSwipeDismiss();
    if (resumeCountdownChk) resumeCountdownChk.checked = !(FTStorage.isResumeCountdown) || !!FTStorage.isResumeCountdown();
    if (voiceToggleChk) voiceToggleChk.checked = FTStorage.getVoicePack();
    if (soundToggleChk) soundToggleChk.checked = !FTStorage.isMuted();
    if (confettiIntensitySel && FTStorage.getConfettiIntensity) confettiIntensitySel.value = FTStorage.getConfettiIntensity();
    if (largeButtonsChk) {
      largeButtonsChk.checked = !!(FTStorage.isLargeButtons && FTStorage.isLargeButtons());
      applyLargeButtons(!!largeButtonsChk.checked);
    }
    if (ghostOpacitySlider) {
      ghostOpacitySlider.value = String(practiceGhostOpacity);
      if (ghostOpacityValueEl) ghostOpacityValueEl.textContent = practiceGhostOpacity.toFixed(2);
    }
    syncMuteBtn();
    _particleBudgetCached = -1;
  }
  function applyResetPreferences() {
    if (FTStorage.resetPreferences) FTStorage.resetPreferences();
    syncSettingsFormFromStorage();
    syncAreaMusicPref();
    syncSwipeDismissPref();
    if (resumeCountdownChk) resumeCountdownChk.checked = !(FTStorage.isResumeCountdown) || !!FTStorage.isResumeCountdown();
    if (resetPrefsConfirmEl) resetPrefsConfirmEl.hidden = true;
    showToast('Settings reset (coins & unlocks kept)', 1600);
  }
  if (btnResetPrefs) btnResetPrefs.addEventListener('click', function () {
    if (resetPrefsConfirmEl) resetPrefsConfirmEl.hidden = false;
  });
  if (btnResetPrefsYes) btnResetPrefsYes.addEventListener('click', function () {
    applyResetPreferences();
  });
  if (btnResetPrefsNo) btnResetPrefsNo.addEventListener('click', function () {
    if (resetPrefsConfirmEl) resetPrefsConfirmEl.hidden = true;
  });

  if (btnSettings) btnSettings.addEventListener('click', function () {
    if (!screenSettings) return;
    screenSettings.hidden = false;
    if (sensSlider) sensSlider.value = String(sensitivity);
    if (sensValueEl) sensValueEl.textContent = sensitivity.toFixed(2);
    if (reduceMotionChk) reduceMotionChk.checked = reduceMotion;
    if (soundToggleChk) soundToggleChk.checked = !FTStorage.isMuted();
    if (hapticsToggleChk) hapticsToggleChk.checked = hapticsOn;
    if (hapticIntensitySel) {
      hapticIntensitySel.value = hapticIntensity || 'normal';
      hapticIntensitySel.disabled = !hapticsOn;
    }
    if (voiceToggleChk) voiceToggleChk.checked = FTStorage.getVoicePack();
    if (quietNightChk) quietNightChk.checked = !!(FTStorage.isQuietNight && FTStorage.isQuietNight());
    if (confettiIntensitySel && FTStorage.getConfettiIntensity) {
      confettiIntensitySel.value = FTStorage.getConfettiIntensity();
    }
    if (largeButtonsChk) largeButtonsChk.checked = !!(FTStorage.isLargeButtons && FTStorage.isLargeButtons());
    if (ghostOpacitySlider) {
      practiceGhostOpacity = (FTStorage.getPracticeGhostOpacity && FTStorage.getPracticeGhostOpacity()) || 0.38;
      ghostOpacitySlider.value = String(practiceGhostOpacity);
      if (ghostOpacityValueEl) ghostOpacityValueEl.textContent = practiceGhostOpacity.toFixed(2);
    }
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
    _particleBudgetCached = -1; // 3.20 refresh perf cache
  });
  if (soundToggleChk) soundToggleChk.addEventListener('change', function () {
    FTStorage.setMuted(!soundToggleChk.checked);
    syncMuteBtn();
  });
  if (hapticsToggleChk) hapticsToggleChk.addEventListener('change', function () {
    hapticsOn = !!hapticsToggleChk.checked;
    FTStorage.setHaptics(hapticsOn);
    if (hapticIntensitySel) hapticIntensitySel.disabled = !hapticsOn;
    if (hapticsOn) haptic('power');
  });
  if (hapticIntensitySel) hapticIntensitySel.addEventListener('change', function () {
    hapticIntensity = FTStorage.setHapticIntensity
      ? FTStorage.setHapticIntensity(hapticIntensitySel.value)
      : hapticIntensitySel.value;
    showToast('Haptics: ' + hapticIntensity, 900);
    if (hapticsOn) haptic('gift');
  });
  if (quietNightChk) quietNightChk.addEventListener('change', function () {
    if (FTStorage.setQuietNight) FTStorage.setQuietNight(!!quietNightChk.checked);
    syncQuietNight();
    showToast(quietNightChk.checked ? 'Quiet at night ON' : 'Quiet at night OFF', 1000);
  });
  if (areaMusicChk) areaMusicChk.addEventListener('change', function () {
    var on = !!areaMusicChk.checked;
    if (FTStorage.setAreaMusic) FTStorage.setAreaMusic(on);
    syncAreaMusicPref();
    showToast(on ? 'Area / menu music ON' : 'Area / menu music OFF', 1000);
    if (on && state === 'menu' && FTAudio.playMenuMusic) FTAudio.playMenuMusic();
  });

  function previewNightAmbienceVol() {
    var lvl = (nightAmbVolSel && nightAmbVolSel.value) ||
      (FTStorage.getNightAmbVol && FTStorage.getNightAmbVol()) || 'normal';
    syncNightAmbVol();
    if (lvl === 'off') {
      showToast('Night ambience is Off', 1000);
      return;
    }
    if (FTAudio && FTAudio.unlock) FTAudio.unlock();
    if (FTAudio && FTAudio.previewNightAmbience) {
      FTAudio.previewNightAmbience();
    } else if (FTAudio && FTAudio.nightAmbienceTick) {
      FTAudio.nightAmbienceTick();
      setTimeout(function () { if (FTAudio.nightAmbienceTick) FTAudio.nightAmbienceTick(); }, 220);
      setTimeout(function () { if (FTAudio.nightAmbienceTick) FTAudio.nightAmbienceTick(); }, 440);
    }
    showToast('🌙 Night sample · ' + lvl + ' · cricket + owl', 1400, 'lucky');
  }

  if (nightAmbVolSel) {
    nightAmbVolSel.addEventListener('change', function () {
      var lvl = FTStorage.setNightAmbVol ? FTStorage.setNightAmbVol(nightAmbVolSel.value) : nightAmbVolSel.value;
      syncNightAmbVol();
      if (lvl === 'off') showToast('Night ambience: off', 900);
      else previewNightAmbienceVol();
    });
  }
  if (btnNightAmbPreview) {
    btnNightAmbPreview.addEventListener('click', function () {
      previewNightAmbienceVol();
    });
  }
  if (swipeDismissChk) swipeDismissChk.addEventListener('change', function () {
    var on = !!swipeDismissChk.checked;
    if (FTStorage.setSwipeDismiss) FTStorage.setSwipeDismiss(on);
    syncSwipeDismissPref();
    showToast(on ? 'Swipe-down dismiss ON' : 'Swipe-down dismiss OFF', 1000);
  });
  if (resumeCountdownChk) resumeCountdownChk.addEventListener('change', function () {
    var on = !!resumeCountdownChk.checked;
    if (FTStorage.setResumeCountdown) FTStorage.setResumeCountdown(on);
    showToast(on ? 'Resume countdown ON' : 'Resume countdown OFF', 1000);
  });
  if (confettiIntensitySel) confettiIntensitySel.addEventListener('change', function () {
    var v = FTStorage.setConfettiIntensity ? FTStorage.setConfettiIntensity(confettiIntensitySel.value) : confettiIntensitySel.value;
    showToast('Confetti: ' + v, 900);
    if (v !== 'off' && !reduceMotion) spawnConfettiBurst(W * 0.5, H * 0.4, 12);
  });
  if (largeButtonsChk) largeButtonsChk.addEventListener('change', function () {
    var on = !!largeButtonsChk.checked;
    if (FTStorage.setLargeButtons) FTStorage.setLargeButtons(on);
    applyLargeButtons(on);
    showToast(on ? 'Larger buttons ON' : 'Larger buttons OFF', 1000);
  });
  if (ghostOpacitySlider) ghostOpacitySlider.addEventListener('input', function () {
    practiceGhostOpacity = FTStorage.setPracticeGhostOpacity
      ? FTStorage.setPracticeGhostOpacity(ghostOpacitySlider.value)
      : parseFloat(ghostOpacitySlider.value) || 0.38;
    if (ghostOpacityValueEl) ghostOpacityValueEl.textContent = practiceGhostOpacity.toFixed(2);
  });
  if (btnCoachNext) btnCoachNext.addEventListener('click', function (e) {
    e.stopPropagation();
    advanceCoach(false);
  });
  if (btnCoachSkip) btnCoachSkip.addEventListener('click', function (e) {
    e.stopPropagation();
    finishCoach();
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


  function playUnlockFanfare(label) {
    showBanner('UNLOCKED!', 1200);
    showToast((label || 'Skin') + ' unlocked! ✨', 2000, 'medal');
    if (FTAudio.fanfare) FTAudio.fanfare();
    else if (FTAudio.legendary) FTAudio.legendary();
    else if (FTAudio.record) FTAudio.record();
    voiceCue('shabaash');
    haptic('gift');
    if (!reduceMotion) {
      spawnConfettiBurst(W * 0.5, H * 0.35, 22);
      spawnFireworks(W * 0.5, H * 0.3, 3);
      spawnCoinRain(20);
    }
  }

  async function tryUnlock(item, kind) {
    var cost = item.cost || 0;
    if (item.seasonal) {
      var packId = item.seasonal;
      if (FTStorage.isSeasonalUnlocked && FTStorage.isSeasonalUnlocked(packId)) {
        if (kind === 'hat') FTStorage.unlockHat(item.id);
        else if (kind === 'trail') FTStorage.unlockTrail(item.id);
        playUnlockFanfare(item.label);
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
        playUnlockFanfare(pack.label || item.label);
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
      playUnlockFanfare(item.label);
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
    playUnlockFanfare(item.label);
    updateCoinHud();
    refreshGarage();
    refreshCollection();
  }

  function currentCosmeticId(kind) {
    if (kind === 'bird') return birdId;
    if (kind === 'vehicle') return vehicleId;
    if (kind === 'env') return envId;
    if (kind === 'hat') return hatId;
    if (kind === 'trail') return trailId;
    return null;
  }

  // 3.46/3.47: equip undo stack (multi-step)
  var EQUIP_UNDO_MAX = 8;
  var EQUIP_UNDO_MS = 5000;
  var equipUndoStack = [];

  function pruneEquipUndoStack() {
    var now = performance.now();
    equipUndoStack = equipUndoStack.filter(function (u) { return u && u.until > now; });
  }

  function requestClearEquipUndoStack() {
    pruneEquipUndoStack();
    var n = equipUndoStack.length;
    if (n < 1) {
      showToast('Undo stack empty', 900);
      return;
    }
    // 3.49: confirm clear-all (always ask when clearing from toast)
    showToast('Clear all ' + n + ' undo step' + (n === 1 ? '' : 's') + '?', 5500, 'undo-confirm');
    if (typeof haptic === 'function') haptic('power');
  }

  function cancelClearEquipUndo() {
    pruneEquipUndoStack();
    if (!equipUndoStack.length) {
      showToast('Kept — nothing to undo', 900);
      return;
    }
    var top = equipUndoStack[equipUndoStack.length - 1];
    // refresh window
    top.until = performance.now() + EQUIP_UNDO_MS;
    showEquipUndoToast(top.label || top.newId || 'skin');
  }

  function clearEquipUndoStack(opts) {
    opts = opts || {};
    pruneEquipUndoStack();
    var n = equipUndoStack.length;
    // Non-silent clear from UI requires confirm path unless confirmed/silent
    if (!opts.silent && !opts.confirmed && n > 0) {
      requestClearEquipUndoStack();
      return 0;
    }
    equipUndoStack = [];
    if (opts.silent) return n;
    if (toastEl) {
      toastEl.hidden = true;
      toastEl.classList.remove('toast-undo', 'toast-undo-confirm');
      toastEl.textContent = '';
    }
    showToast(n ? ('Cleared undo · ' + n + ' step' + (n === 1 ? '' : 's')) : 'Undo stack empty', 1200, 'sync');
    if (typeof haptic === 'function' && n) haptic('power');
    return n;
  }

  function refreshUndoToastButton() {
    var btn = document.getElementById('toast-undo-btn');
    pruneEquipUndoStack();
    var n = equipUndoStack.length;
    if (btn) {
      btn.textContent = n > 1 ? ('Undo · ' + n) : 'Undo';
      btn.setAttribute('aria-label', n > 1 ? ('Undo equip, ' + n + ' in stack') : 'Undo equip');
    }
    var clearBtn = document.getElementById('toast-undo-clear');
    if (clearBtn) {
      clearBtn.hidden = n < 1;
      clearBtn.textContent = n > 1 ? ('Clear · ' + n) : 'Clear';
    }
  }

  function showEquipUndoToast(label) {
    pruneEquipUndoStack();
    var n = equipUndoStack.length;
    var msg = 'Equipped · ' + (label || 'skin') + (n > 1 ? (' · stack ' + n) : '');
    showToast(msg, EQUIP_UNDO_MS, 'undo');
    refreshUndoToastButton();
  }

  function armEquipUndo(kind, prevId, newId, label) {
    if (!kind || prevId == null || prevId === newId) return;
    pruneEquipUndoStack();
    equipUndoStack.push({
      kind: kind,
      prevId: prevId,
      newId: newId,
      label: label || newId,
      until: performance.now() + EQUIP_UNDO_MS
    });
    if (equipUndoStack.length > EQUIP_UNDO_MAX) {
      equipUndoStack = equipUndoStack.slice(-EQUIP_UNDO_MAX);
    }
    showEquipUndoToast(label || newId);
  }

  function extendTopEquipUndo(kind, id, label) {
    pruneEquipUndoStack();
    var top = equipUndoStack.length ? equipUndoStack[equipUndoStack.length - 1] : null;
    if (top && top.kind === kind && top.newId === id) {
      top.until = performance.now() + EQUIP_UNDO_MS;
      showEquipUndoToast(label || top.label || id);
      return true;
    }
    return false;
  }

  function markGarageSelected(kind, id) {
    document.querySelectorAll('#screen-garage .skin-card').forEach(function (el) {
      var rowKind = el.closest('#garage-birds') ? 'bird' :
        el.closest('#garage-vehicles') ? 'vehicle' :
        el.closest('#garage-envs') ? 'env' :
        el.closest('#garage-hats') ? 'hat' :
        el.closest('#garage-trails') ? 'trail' : '';
      if (rowKind !== kind) return;
      el.classList.toggle('selected', el.dataset.id === id && !el.classList.contains('locked'));
    });
  }

  function undoLastEquip() {
    pruneEquipUndoStack();
    if (!equipUndoStack.length) {
      showToast('Nothing to undo', 900);
      return;
    }
    var u = equipUndoStack.pop();
    onPickCosmetic(u.prevId, u.kind, { skipUndo: true, skipPassToast: true });
    markGarageSelected(u.kind, u.prevId);
    if (typeof haptic === 'function') haptic('power');
    drawFrame(true);
    pruneEquipUndoStack();
    if (equipUndoStack.length) {
      var top = equipUndoStack[equipUndoStack.length - 1];
      // refresh window on remaining stack
      top.until = performance.now() + EQUIP_UNDO_MS;
      var n = equipUndoStack.length;
      showToast('Undid · ' + (u.label || u.newId) + ' · stack ' + n, EQUIP_UNDO_MS, 'undo');
      refreshUndoToastButton();
    } else {
      showToast('Undid equip · restored', 1400, 'sync');
    }
  }

  function onPickCosmetic(id, kind, opts) {
    opts = opts || {};
    var prev = currentCosmeticId(kind);
    if (kind === 'bird') {
      birdId = id; FTStorage.setBird(id);
      var p = birdPass();
      if (p && p.label && !opts.skipPassToast && !opts.offerUndo) showToast(p.label, 1400);
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
    if (opts.offerUndo && !opts.skipUndo) {
      armEquipUndo(kind, prev, id, opts.label || id);
    }
  }

  var garageFilter = 'all'; // all | theme | seasonal | fav

  function applyGarageFilter() {
    var hint = document.getElementById('garage-filter-hint');
    var searchEl = document.getElementById('garage-search');
    var q = searchEl ? String(searchEl.value || '').trim().toLowerCase() : '';
    var clearBtn = document.getElementById('garage-search-clear');
    if (clearBtn) clearBtn.hidden = !q;
    if (hint) {
      if (q) {
        hint.textContent = 'Search: "' + q + '"' + (garageFilter !== 'all' ? ' · filter ' + garageFilter : '');
      } else {
        hint.textContent = garageFilter === 'theme'
          ? 'Showing theme skins — Jungle · Mountains · Sea (+ matching vehicles)'
          : garageFilter === 'seasonal'
            ? 'Showing seasonal packs — unlock by date window or score'
            : garageFilter === 'fav'
              ? 'Showing pinned favorites — tap ★ on a skin to pin'
              : '★ pin · double-tap equip · long-press preview';
      }
    }
    document.querySelectorAll('#screen-garage .skin-card').forEach(function (card) {
      var show = true;
      if (garageFilter === 'theme') show = card.dataset.theme === '1';
      else if (garageFilter === 'seasonal') show = card.dataset.seasonal === '1';
      else if (garageFilter === 'fav') show = card.dataset.fav === '1';
      if (show && q) {
        var lab = (card.dataset.label || '').toLowerCase();
        if (!lab) {
          var span = card.querySelector('span');
          lab = span ? String(span.textContent || '').toLowerCase() : '';
        }
        var id = (card.dataset.id || '').toLowerCase();
        show = lab.indexOf(q) >= 0 || id.indexOf(q) >= 0;
      }
      card.hidden = !show;
    });
    // Hide empty section titles lightly via row emptiness
    document.querySelectorAll('#screen-garage .skin-row').forEach(function (row) {
      var any = false;
      row.querySelectorAll('.skin-card').forEach(function (c) { if (!c.hidden) any = true; });
      row.classList.toggle('filter-empty', !any);
    });
    var gEmpty = document.getElementById('garage-empty');
    if (!gEmpty) {
      gEmpty = document.createElement('div');
      gEmpty.id = 'garage-empty';
      gEmpty.className = 'panel-empty';
      gEmpty.setAttribute('role', 'status');
      var host = document.getElementById('screen-garage');
      if (host) host.appendChild(gEmpty);
    }
    var anyVisible = !!document.querySelector('#screen-garage .skin-card:not([hidden])');
    if (gEmpty) {
      gEmpty.hidden = anyVisible;
      if (!anyVisible) {
        var emptyTitle = q ? 'No skins match' : (garageFilter === 'fav' ? 'No favorites yet' : 'Nothing in this filter');
        var emptyHint = q
          ? 'Clear search or try another name / id.'
          : (garageFilter === 'fav'
            ? 'Tap ★ on any skin card to pin it here.'
            : 'Switch filter or grab unlocks from Mystery Rewards.');
        gEmpty.innerHTML = '<div class="panel-empty-ico" aria-hidden="true">🧺</div>' +
          '<p class="panel-empty-title">' + emptyTitle + '</p>' +
          '<p class="hint">' + emptyHint + '</p>' +
          '<div class="panel-empty-cta btn-row">' +
          '<button type="button" class="btn primary btn-sm" data-garage-empty-cta="all">Show all</button>' +
          '<button type="button" class="btn ghost btn-sm" data-garage-empty-cta="mystery">Mystery Rewards</button>' +
          '</div>';
        gEmpty.querySelectorAll('[data-garage-empty-cta]').forEach(function (btn) {
          btn.addEventListener('click', function () {
            var act = btn.getAttribute('data-garage-empty-cta');
            if (act === 'all') {
              garageFilter = 'all';
              var gs = document.getElementById('garage-search');
              if (gs) gs.value = '';
              document.querySelectorAll('.garage-filter').forEach(function (b) {
                var on = b.getAttribute('data-garage-filter') === 'all';
                b.classList.toggle('active', on);
                b.setAttribute('aria-selected', on ? 'true' : 'false');
              });
              applyGarageFilter();
              showToast('Showing all skins', 900);
            } else if (act === 'mystery') {
              hideAllScreens();
              if (typeof openGiftsScreen === 'function') openGiftsScreen();
              else if (screenGifts) { screenGifts.hidden = false; if (typeof refreshGiftsUI === 'function') refreshGiftsUI(); }
            }
          });
        });
      }
    }
  }


  var garagePreviewRaf = 0;
  var garagePreviewT0 = 0;
  function stopGaragePreview() {
    if (garagePreviewRaf) {
      cancelAnimationFrame(garagePreviewRaf);
      garagePreviewRaf = 0;
    }
  }
  function tickGaragePreview(now) {
    if (!screenGarage || screenGarage.hidden) { stopGaragePreview(); return; }
    if (!garagePreviewT0) garagePreviewT0 = now;
    var t = (now - garagePreviewT0) / 1000;
    var cards = screenGarage.querySelectorAll('.skin-card canvas');
    for (var i = 0; i < cards.length; i++) {
      var c = cards[i];
      var card = c.parentElement;
      if (!card || card.classList.contains('locked') || card.hidden) continue;
      var kind = card.closest('#garage-birds') ? 'bird' :
        card.closest('#garage-vehicles') ? 'vehicle' : null;
      if (!kind || !FTSkins || !FTSkins.draw) continue;
      var id = card.dataset.id;
      var cctx = c.getContext('2d');
      cctx.clearRect(0, 0, 64, 64);
      var flap = Math.sin(t * 6 + i * 0.4) * 0.55;
      var rot = Math.sin(t * 1.2 + i * 0.2) * 0.18;
      if (kind === 'bird') {
        FTSkins.draw(cctx, id, 32, 30, rot, 1.0, { wingFlap: flap, tipFlutter: flap * 0.3, mouthOpen: 0.15 + 0.1 * Math.max(0, flap) });
      } else {
        FTSkins.draw(cctx, 'sparrow', 32, 28, rot * 0.5, 1.0, { vehicle: id, wingFlap: 0, vehLean: Math.sin(t * 2 + i) * 0.12 });
      }
    }
    garagePreviewRaf = requestAnimationFrame(tickGaragePreview);
  }
  function startGaragePreview() {
    stopGaragePreview();
    garagePreviewT0 = 0;
    if (reduceMotion) return;
    garagePreviewRaf = requestAnimationFrame(tickGaragePreview);
  }

  function refreshGarage() {
    updateCoinHud();
    if (garageSortSel && FTStorage.getGarageSort) {
      garageSortMode = FTStorage.getGarageSort();
      garageSortSel.value = garageSortMode;
    }
    function garagePickWithUndo(id, kind) {
      var prev = currentCosmeticId(kind);
      var label = id;
      document.querySelectorAll('#screen-garage .skin-card').forEach(function (el) {
        if (el.dataset.id !== id) return;
        var rowKind = el.closest('#garage-birds') ? 'bird' :
          el.closest('#garage-vehicles') ? 'vehicle' :
          el.closest('#garage-envs') ? 'env' :
          el.closest('#garage-hats') ? 'hat' :
          el.closest('#garage-trails') ? 'trail' : '';
        if (rowKind === kind) label = el.dataset.label || id;
      });
      onPickCosmetic(id, kind, { skipPassToast: true });
      armEquipUndo(kind, prev, id, label);
    }
    if (garageBirds) FTSkins.renderPicker(garageBirds, birdId, garagePickWithUndo, tryUnlock, 'bird');
    if (garageVehicles) FTSkins.renderPicker(garageVehicles, vehicleId, garagePickWithUndo, tryUnlock, 'vehicle');
    if (garageEnvs) FTSkins.renderPicker(garageEnvs, envId, garagePickWithUndo, tryUnlock, 'env');
    if (garageHats) FTSkins.renderPicker(garageHats, hatId, garagePickWithUndo, tryUnlock, 'hat');
    if (garageTrails) FTSkins.renderPicker(garageTrails, trailId, garagePickWithUndo, tryUnlock, 'trail');
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
    startGaragePreview();
    bindGarageLongPress();
    closeGarageLongPreview();
  });
  if (garageSortSel) {
    garageSortMode = (FTStorage.getGarageSort && FTStorage.getGarageSort()) || 'owned';
    garageSortSel.value = garageSortMode;
    garageSortSel.addEventListener('change', function () {
      garageSortMode = FTStorage.setGarageSort ? FTStorage.setGarageSort(garageSortSel.value) : garageSortSel.value;
      refreshGarage();
      startGaragePreview();
      showToast('Sort: ' + garageSortMode, 800);
    });
  }
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

  var garageSearchEl = document.getElementById('garage-search');
  if (garageSearchEl && !garageSearchEl._urrjaaBound) {
    garageSearchEl._urrjaaBound = true;
    garageSearchEl.addEventListener('input', function () { applyGarageFilter(); });
    garageSearchEl.addEventListener('search', function () { applyGarageFilter(); });
  }
  var garageSearchClear = document.getElementById('garage-search-clear');
  if (garageSearchClear && !garageSearchClear._urrjaaBound) {
    garageSearchClear._urrjaaBound = true;
    garageSearchClear.addEventListener('click', function () {
      var gs = document.getElementById('garage-search');
      if (gs) { gs.value = ''; gs.focus(); }
      applyGarageFilter();
      showToast('Search cleared', 700);
    });
  }
  // 3.42/3.43: pin refresh + favorite sync toast
  global.onGarageFavoriteChange = function (kind, id, nowOn, label) {
    var favCount = 0;
    if (FTStorage.getGarageFavorites) favCount = FTStorage.getGarageFavorites().length;
    var syncMsg = (nowOn ? '★ Synced · ' : '☆ Synced · ') + (label || id) +
      ' · ' + favCount + ' favorite' + (favCount === 1 ? '' : 's');
    showToast(syncMsg, 1600, 'sync');
    if (typeof haptic === 'function') haptic('power');
    var q = '';
    var gs = document.getElementById('garage-search');
    if (gs) q = gs.value;
    var keep = garageFilter;
    refreshGarage();
    garageFilter = keep;
    document.querySelectorAll('.garage-filter').forEach(function (b) {
      var on = b.getAttribute('data-garage-filter') === garageFilter;
      b.classList.toggle('active', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    if (gs) gs.value = q;
    applyGarageFilter();
    if (typeof startGaragePreview === 'function') startGaragePreview();
    if (typeof bindGarageLongPress === 'function') bindGarageLongPress();
  };

  // 3.43: long-press skin card → large animated preview
  var garageLpTimer = 0;
  var garageLpRaf = 0;
  var garageLpOpened = false;
  var garageLpSuppressClick = false;
  var garageLpCard = null;
  var garageLpKind = null;
  var garageLpId = null;

  function stopGarageLpAnim() {
    if (garageLpRaf) { cancelAnimationFrame(garageLpRaf); garageLpRaf = 0; }
  }
  function closeGarageLongPreview() {
    var ov = document.getElementById('garage-lp-preview');
    if (ov) ov.hidden = true;
    stopGarageLpAnim();
    garageLpOpened = false;
    garageLpCard = null;
    garageLpKind = null;
    garageLpId = null;
  }

  function playEquipFanfareLight() {
    if (FTAudio && FTAudio.fanfareLight) FTAudio.fanfareLight();
    else if (FTAudio && FTAudio.coin) FTAudio.coin();
  }

  function equipFromGarageLp() {
    if (!garageLpKind || !garageLpId) return;
    if (garageLpCard && garageLpCard.classList.contains('locked')) {
      showToast('Locked — unlock first', 1200);
      if (typeof haptic === 'function') haptic('power');
      return;
    }
    var label = (garageLpCard && (garageLpCard.dataset.label || garageLpId)) || garageLpId;
    onPickCosmetic(garageLpId, garageLpKind, { offerUndo: true, skipPassToast: true, label: label });
    markGarageSelected(garageLpKind, garageLpId);
    playEquipFanfareLight();
    if (garageLpCard) {
      garageLpCard.classList.add('equip-flash');
      setTimeout(function () { if (garageLpCard) garageLpCard.classList.remove('equip-flash'); }, 480);
    }
    if (typeof haptic === 'function') haptic('gift');
    closeGarageLongPreview();
  }
  function drawGarageLpFrame(kind, id, canvas, t0) {
    if (!canvas || !FTSkins || !FTSkins.draw) return;
    var cctx = canvas.getContext('2d');
    var S = canvas.width;
    var mid = S / 2;
    var sc = S / 64;
    cctx.clearRect(0, 0, S, S);
    var t = (performance.now() - t0) / 1000;
    var flap = Math.sin(t * 6) * 0.55;
    var rot = Math.sin(t * 1.2) * 0.18;
    cctx.save();
    cctx.translate(mid, mid);
    cctx.scale(sc, sc);
    cctx.translate(-32, -32);
    if (kind === 'bird') {
      FTSkins.draw(cctx, id, 32, 30, rot, 1.0, { wingFlap: flap, tipFlutter: flap * 0.3, mouthOpen: 0.15 + 0.1 * Math.max(0, flap) });
    } else if (kind === 'vehicle') {
      FTSkins.draw(cctx, 'sparrow', 32, 28, rot * 0.5, 1.0, { vehicle: id, wingFlap: 0, vehLean: Math.sin(t * 2) * 0.12 });
    } else if (kind === 'env' && FTSkins.envPalette) {
      var pal = FTSkins.envPalette(id, 'clear');
      var g = cctx.createLinearGradient(0, 0, 0, 64);
      g.addColorStop(0, pal.sky0); g.addColorStop(1, pal.sky2);
      cctx.fillStyle = g; cctx.fillRect(0, 0, 64, 48);
      cctx.fillStyle = pal.ground; cctx.fillRect(0, 48, 64, 16);
      cctx.fillStyle = pal.grass; cctx.fillRect(0, 48, 64, 4);
    } else if (kind === 'hat' || kind === 'trail') {
      // reuse tiny picker icon style via blank + label handled outside
      cctx.fillStyle = '#1a1a2e'; cctx.fillRect(0, 0, 64, 64);
      var src = garageLpCard && garageLpCard.querySelector('canvas');
      if (src) cctx.drawImage(src, 0, 0, 64, 64);
    }
    cctx.restore();
  }
  function openGarageLongPreview(card) {
    if (!card || reduceMotion) {
      // still show static preview when reduce-motion
    }
    var kind = card.closest('#garage-birds') ? 'bird' :
      card.closest('#garage-vehicles') ? 'vehicle' :
      card.closest('#garage-envs') ? 'env' :
      card.closest('#garage-hats') ? 'hat' :
      card.closest('#garage-trails') ? 'trail' : null;
    if (!kind) return;
    var id = card.dataset.id;
    var label = card.dataset.label || id;
    var ov = document.getElementById('garage-lp-preview');
    if (ov && !document.getElementById('garage-lp-equip')) {
      ov.remove();
      ov = null;
    }
    if (!ov) {
      ov = document.createElement('div');
      ov.id = 'garage-lp-preview';
      ov.className = 'garage-lp-preview';
      ov.setAttribute('role', 'dialog');
      ov.setAttribute('aria-label', 'Skin preview');
      ov.innerHTML = '<div class="garage-lp-card">' +
        '<canvas id="garage-lp-canvas" width="160" height="160" aria-hidden="true"></canvas>' +
        '<p class="garage-lp-label" id="garage-lp-label"></p>' +
        '<p class="hint garage-lp-hint">Long-press preview · Equip or Close</p>' +
        '<div class="garage-lp-actions btn-row">' +
        '<button type="button" class="btn primary btn-sm" id="garage-lp-equip">Equip</button>' +
        '<button type="button" class="btn ghost btn-sm" id="garage-lp-close">Close</button>' +
        '</div></div>';
      var host = document.getElementById('screen-garage') || document.body;
      host.appendChild(ov);
      ov.addEventListener('click', function (e) {
        var tid = e.target && e.target.id;
        if (tid === 'garage-lp-equip') {
          e.preventDefault();
          e.stopPropagation();
          equipFromGarageLp();
          return;
        }
        if (e.target === ov || tid === 'garage-lp-close') closeGarageLongPreview();
      });
    }
    var lab = document.getElementById('garage-lp-label');
    if (lab) lab.textContent = (card.classList.contains('locked') ? '🔒 ' : '') + label;
    var canvas = document.getElementById('garage-lp-canvas');
    garageLpCard = card;
    garageLpKind = kind;
    garageLpId = id;
    garageLpOpened = true;
    ov.hidden = false;
    var eq = document.getElementById('garage-lp-equip');
    if (eq) {
      var locked = card.classList.contains('locked');
      eq.disabled = !!locked;
      eq.textContent = locked ? 'Locked' : 'Equip';
      eq.classList.toggle('ghost', !!locked);
      eq.classList.toggle('primary', !locked);
    }
    stopGarageLpAnim();
    var t0 = performance.now();
    function tick() {
      if (!garageLpOpened) return;
      drawGarageLpFrame(kind, id, canvas, t0);
      if (!reduceMotion && (kind === 'bird' || kind === 'vehicle')) {
        garageLpRaf = requestAnimationFrame(tick);
      }
    }
    tick();
    if (typeof haptic === 'function') haptic('power');
  }
  function bindGarageLongPress() {
    if (!screenGarage || screenGarage._lpBound) return;
    screenGarage._lpBound = true;
    screenGarage.addEventListener('pointerdown', function (e) {
      if (e.button != null && e.button !== 0) return;
      var card = e.target.closest && e.target.closest('.skin-card');
      if (!card || e.target.closest('.skin-fav-pin')) return;
      clearTimeout(garageLpTimer);
      garageLpSuppressClick = false;
      var ptr = e.pointerId;
      garageLpTimer = setTimeout(function () {
        garageLpTimer = 0;
        garageLpSuppressClick = true;
        openGarageLongPreview(card);
      }, 450);
      function clearLp() {
        clearTimeout(garageLpTimer);
        garageLpTimer = 0;
        screenGarage.releasePointerCapture && screenGarage.releasePointerCapture(ptr);
      }
      function onUp() {
        clearLp();
        screenGarage.removeEventListener('pointerup', onUp);
        screenGarage.removeEventListener('pointercancel', onUp);
        screenGarage.removeEventListener('pointerleave', onUp);
        // keep preview open until explicit close / second tap outside
      }
      try { screenGarage.setPointerCapture && screenGarage.setPointerCapture(ptr); } catch (err) {}
      screenGarage.addEventListener('pointerup', onUp);
      screenGarage.addEventListener('pointercancel', onUp);
    }, true);
    screenGarage.addEventListener('click', function (e) {
      if (!garageLpSuppressClick) return;
      var card = e.target.closest && e.target.closest('.skin-card');
      if (card) {
        e.preventDefault();
        e.stopPropagation();
        garageLpSuppressClick = false;
      }
    }, true);
    screenGarage.addEventListener('contextmenu', function (e) {
      if (e.target.closest && e.target.closest('.skin-card')) e.preventDefault();
    });
  }
  bindGarageLongPress();

  // 3.45: double-tap skin card → light fanfare + toast
  global.onGarageDoubleEquip = function (kind, id, label) {
    playEquipFanfareLight();
    if (!extendTopEquipUndo(kind, id, label || id)) {
      showToast('Equipped · ' + (label || id), 1200, 'medal');
    }
    if (typeof haptic === 'function') haptic('gift');
  };

  document.querySelectorAll('[data-close="garage"]').forEach(function (b) {
    b.addEventListener('click', function () {
      closeGarageLongPreview();
      stopGaragePreview();
      // 3.48: leaving garage clears pending undo stack (silent)
      if (typeof clearEquipUndoStack === 'function') clearEquipUndoStack({ silent: true });
      showMenu();
    });
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
    refreshDailyCountdown();
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

  function buildMissionCalendarHtml() {
    var log = (FTStorage.getMissionDays && FTStorage.getMissionDays()) || [];
    var claimed = Object.create(null);
    for (var i = 0; i < log.length; i++) claimed[log[i]] = 1;
    var now = new Date();
    var y = now.getFullYear();
    var mo = now.getMonth();
    var monthName = now.toLocaleString(undefined, { month: 'short', year: 'numeric' });
    var firstDow = new Date(y, mo, 1).getDay();
    var daysInMonth = new Date(y, mo + 1, 0).getDate();
    var todayStr = y + '-' + String(mo + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
    var html = '<div class="mission-calendar" aria-label="Daily challenge calendar">';
    html += '<div class="mission-cal-head"><strong>📅 ' + monthName + '</strong><span>claim days lit</span></div>';
    html += '<div class="mission-cal-dows" aria-hidden="true"><span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span></div>';
    html += '<div class="mission-cal-grid">';
    for (var b = 0; b < firstDow; b++) html += '<span class="mission-cal-cell empty"></span>';
    for (var d = 1; d <= daysInMonth; d++) {
      var key = y + '-' + String(mo + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
      var cls = 'mission-cal-cell';
      if (claimed[key]) cls += ' claimed';
      if (key === todayStr) cls += ' today';
      html += '<span class="' + cls + '" title="' + key + '">' + d + '</span>';
    }
    html += '</div></div>';
    return html;
  }
  function refreshMissions() {
    if (!missionsList) return;
    missionsList.innerHTML = '';
    var dateEl = document.createElement('p');
    dateEl.className = 'hint mission-today';
    dateEl.textContent = 'Today · ' + (FTStorage.getDailyDate ? FTStorage.getDailyDate() : new Date().toDateString()) + ' · 3 challenges';
    missionsList.appendChild(dateEl);
    var calWrap = document.createElement('div');
    calWrap.innerHTML = buildMissionCalendarHtml();
    while (calWrap.firstChild) missionsList.appendChild(calWrap.firstChild);
    var missions = FTStorage.getMissions ? FTStorage.getMissions() : [];
    var claimable = missions.filter(function (m) { return m.done && !m.claimed; });
    if (claimable.length >= 2) {
      var batchRow = document.createElement('div');
      batchRow.className = 'missions-batch-row';
      var batchBtn = document.createElement('button');
      batchBtn.type = 'button';
      batchBtn.className = 'btn reward btn-sm missions-claim-all';
      batchBtn.textContent = 'Claim all (' + claimable.length + ')';
      batchBtn.addEventListener('click', function () {
        var r = FTStorage.claimMissionsBatch && FTStorage.claimMissionsBatch();
        if (!r) return;
        // 3.40 claim-all juice
        batchBtn.classList.remove('claim-all-juice');
        void batchBtn.offsetWidth;
        batchBtn.classList.add('claim-all-juice');
        haptic('boss');
        if (!reduceMotion) {
          spawnConfettiBurst(W * 0.5, H * 0.32, 22);
          if (typeof spawnFireworks === 'function') spawnFireworks(W * 0.5, H * 0.28, 3);
          if (typeof spawnCoinRain === 'function' && r.coins >= 40) spawnCoinRain(12);
        }
        if (FTAudio.fanfare) FTAudio.fanfare();
        else if (FTAudio.combo) FTAudio.combo();
        showBanner('CLAIM ALL ×' + r.count + '!', 1100);
        var bits = [];
        if (r.coins) bits.push('+' + r.coins + ' 🪙');
        if (r.fragments) bits.push('+' + r.fragments + ' ✦');
        if (r.gifts) bits.push('+' + r.gifts + ' 🎁');
        // 3.41 richer claim-all toast
        var claimMsg = '🎁 Claimed all · ' + r.count + ' mission' + (r.count === 1 ? '' : 's');
        if (bits.length) claimMsg += ' · ' + bits.join(' · ');
        else claimMsg += ' · nice!';
        showToast(claimMsg, 3400, 'claim');
        if (r.gifts) detectSpinUnlockFromDelta(r.gifts);
        voiceCue('zabardast');
        refreshMissions(); updateCoinHud();
      });
      batchRow.appendChild(batchBtn);
      missionsList.appendChild(batchRow);
    }
    if (!missions.length) {
      var empty = document.createElement('div');
      empty.className = 'missions-empty';
      empty.setAttribute('role', 'status');
      empty.innerHTML = '<div class="missions-empty-ico" aria-hidden="true">📋</div>' +
        '<p class="missions-empty-title">No missions right now</p>' +
        '<p class="hint">Fly a run — daily challenges refresh each day. Come back after the reset countdown!</p>';
      missionsList.appendChild(empty);
    } else {
      var allClaimed = true;
      missions.forEach(function (m) {
        if (!m.claimed) allClaimed = false;
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
            card.classList.remove('claim-juice');
            void card.offsetWidth;
            card.classList.add('claim-juice');
            haptic('gift');
            if (!reduceMotion) spawnConfettiBurst(W * 0.5, H * 0.35, 14);
            if (FTAudio.combo) FTAudio.combo();
            if (r.mystery) {
              showToast('Mission: +' + (r.gifts || 1) + ' Gift 🎁', 1600, 'gift');
              if (FTAudio.mystery) FTAudio.mystery();
              voiceGiftCue();
              detectSpinUnlockFromDelta(r.gifts || 1);
            } else if (r.fragments) {
              showToast('+' + r.fragments + ' fragments!', 1400, 'medal');
              voiceCue('wah_ji');
            } else {
              showToast('+' + r.coins + ' coins!', 1400, 'medal');
              voiceCue('shabaash');
            }
            refreshMissions(); updateCoinHud();
          }
        });
        card.appendChild(btn);
        missionsList.appendChild(card);
      });
      if (allClaimed) {
        var doneBanner = document.createElement('div');
        doneBanner.className = 'missions-empty missions-all-done';
        doneBanner.setAttribute('role', 'status');
        doneBanner.innerHTML = '<div class="missions-empty-ico" aria-hidden="true">✅</div>' +
          '<p class="missions-empty-title">All missions claimed</p>' +
          '<p class="hint">Shabaash! New set after daily reset — keep flying for tomorrow\'s three.</p>';
        missionsList.appendChild(doneBanner);
      }
    }
  }
  if (btnMissions) btnMissions.addEventListener('click', function () {
    hideAllScreens();
    if (screenMissions) screenMissions.hidden = false;
    refreshMissions();
  });
  document.querySelectorAll('[data-close="missions"]').forEach(function (b) {
    b.addEventListener('click', function () { showMenu(); });
  });

  var collectionFilter = 'all'; // 3.32 all | owned | locked

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
    // 3.31: collection % meter
    var meterWrap = document.createElement('div');
    meterWrap.className = 'collection-pct-meter';
    meterWrap.setAttribute('role', 'progressbar');
    meterWrap.setAttribute('aria-valuemin', '0');
    meterWrap.setAttribute('aria-valuemax', '100');
    meterWrap.setAttribute('aria-valuenow', String(pct));
    meterWrap.setAttribute('aria-label', 'Album completion ' + pct + ' percent');
    var meterFill = document.createElement('span');
    meterFill.className = 'collection-pct-fill';
    meterFill.style.width = Math.max(0, Math.min(100, pct)) + '%';
    var meterLabel = document.createElement('strong');
    meterLabel.className = 'collection-pct-label';
    meterLabel.textContent = pct + '% complete';
    meterWrap.appendChild(meterFill);
    meterWrap.appendChild(meterLabel);
    collectionList.appendChild(meterWrap);
    var headerMeter = document.getElementById('collection-pct-header');
    var headerFill = document.getElementById('collection-pct-header-fill');
    var headerTxt = document.getElementById('collection-pct-header-text');
    if (headerMeter) {
      headerMeter.hidden = false;
      headerMeter.setAttribute('aria-valuenow', String(pct));
    }
    if (headerFill) headerFill.style.width = Math.max(0, Math.min(100, pct)) + '%';
    if (headerTxt) headerTxt.textContent = pct + '%';
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
    // 3.32: collection filter chips
    var filterRow = document.createElement('div');
    filterRow.className = 'collection-filters';
    filterRow.setAttribute('role', 'tablist');
    filterRow.setAttribute('aria-label', 'Collection filter');
    [
      { id: 'all', label: 'All' },
      { id: 'owned', label: 'Owned' },
      { id: 'locked', label: 'Locked' }
    ].forEach(function (f) {
      var fb = document.createElement('button');
      fb.type = 'button';
      fb.className = 'collection-filter-chip' + (collectionFilter === f.id ? ' active' : '');
      fb.setAttribute('role', 'tab');
      fb.setAttribute('aria-selected', collectionFilter === f.id ? 'true' : 'false');
      fb.dataset.filter = f.id;
      fb.textContent = f.label;
      fb.addEventListener('click', function () {
        collectionFilter = f.id;
        refreshCollection();
      });
      filterRow.appendChild(fb);
    });
    collectionList.appendChild(filterRow);
    function section(title, map, labels) {
      var h = document.createElement('h3');
      h.className = 'collection-section-title';
      h.textContent = title;
      collectionList.appendChild(h);
      var row = document.createElement('div');
      row.className = 'skin-row collect-chip-row';
      var shown = 0;
      Object.keys(labels).forEach(function (id) {
        if (id === 'none') return;
        var owned = !!map[id];
        if (collectionFilter === 'owned' && !owned) return;
        if (collectionFilter === 'locked' && owned) return;
        shown++;
        var el = document.createElement('button');
        el.type = 'button';
        el.className = 'collect-chip' + (owned ? ' owned' : ' locked');
        el.setAttribute('aria-pressed', owned ? 'true' : 'false');
        el.textContent = (owned ? '✓ ' : '🔒 ') + labels[id];
        row.appendChild(el);
      });
      if (!shown) {
        var empty = document.createElement('p');
        empty.className = 'panel-empty collect-filter-empty';
        empty.innerHTML = '<div class="panel-empty-ico" aria-hidden="true">' +
          (collectionFilter === 'owned' ? '📦' : '✨') + '</div>' +
          '<p class="panel-empty-title">' +
          (collectionFilter === 'owned' ? 'No owned items here yet' : 'None locked — nice!') +
          '</p><p class="hint">' +
          (collectionFilter === 'owned' ? 'Unlock skins in Garage or Mystery Rewards.' : "You've collected this whole section.") +
          '</p>';
        collectionList.appendChild(empty);
      } else {
        collectionList.appendChild(row);
      }
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
    var top = (lb.topRuns && lb.topRuns.length) ? lb.topRuns : (FTStorage.getTopRuns ? FTStorage.getTopRuns() : []);
    var topHtml = '<h3 class="section-title">Local Top 5</h3><div class="top5-list" role="list">';
    if (!top.length) {
      topHtml += '<p class="hint top5-empty">No ranked runs yet — finish a flight!</p>';
    } else {
      for (var ti = 0; ti < top.length; ti++) {
        var tr = top[ti];
        topHtml += '<div class="top5-row" role="listitem">' +
          '<span class="top5-rank">#' + (ti + 1) + '</span>' +
          '<span class="top5-score">' + (tr.score | 0) + '</span>' +
          '<span class="top5-meta">' + (tr.mode || 'classic') +
          (tr.perfects ? (' · ✨' + tr.perfects) : '') +
          (tr.combo ? (' · 🔥' + tr.combo) : '') +
          '<em>' + (tr.date || '') + '</em></span></div>';
      }
    }
    topHtml += '</div>';
    var emptyBoard = '';
    if (!(best > 0)) {
      emptyBoard = '<div class="panel-empty" role="status">' +
        '<div class="panel-empty-ico" aria-hidden="true">🏆</div>' +
        '<p class="panel-empty-title">No scores yet</p>' +
        '<p class="hint">Finish a Classic run — your best lands here with medals.</p></div>';
    }
    boardsList.innerHTML = emptyBoard + '<h3 class="section-title">Medal Gallery</h3>' + gallery + topHtml +
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

  function buildStreakCalendarHtml() {
    var log = (FTStorage.getStreakLog && FTStorage.getStreakLog()) || [];
    var claimed = Object.create(null);
    for (var i = 0; i < log.length; i++) claimed[log[i]] = 1;
    var now = new Date();
    var y = now.getFullYear();
    var m = now.getMonth(); // 0-based
    var monthName = now.toLocaleString(undefined, { month: 'long', year: 'numeric' });
    var firstDow = new Date(y, m, 1).getDay(); // 0 Sun
    var daysInMonth = new Date(y, m + 1, 0).getDate();
    var todayStr = y + '-' + String(m + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
    var html = '<div class="streak-calendar" aria-label="Streak calendar ' + monthName + '">';
    html += '<div class="streak-cal-head"><strong>' + monthName + '</strong><span>claimed days lit</span></div>';
    html += '<div class="streak-cal-dows" aria-hidden="true"><span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span></div>';
    html += '<div class="streak-cal-grid">';
    for (var b = 0; b < firstDow; b++) html += '<span class="streak-cal-cell empty"></span>';
    for (var d = 1; d <= daysInMonth; d++) {
      var key = y + '-' + String(m + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
      var cls = 'streak-cal-cell';
      if (claimed[key]) cls += ' claimed';
      if (key === todayStr) cls += ' today';
      html += '<span class="' + cls + '" title="' + key + '">' + d + '</span>';
    }
    html += '</div></div>';
    return html;
  }
  function syncStreakBtn() {
    if (!btnStreak || !FTStorage.getStreak) return;
    var st = FTStorage.getStreak();
    btnStreak.classList.toggle('streak-flame-btn', st.day >= 2 || !!st.canClaim);
    btnStreak.classList.toggle('btn-streak-ready', !!st.canClaim);
    btnStreak.innerHTML = '<span class="streak-flame-icon' + (st.canClaim ? ' claimable' : (st.day >= 3 ? ' warm' : '')) + '" aria-hidden="true">🔥</span> Streak';
  }
  function refreshStreak() {
    if (!streakBody) return;
    var st = FTStorage.getStreak();
    var fire = st.day >= 5 ? '🔥🔥' : (st.day >= 3 ? '🔥' : '✨');
    var flameCls = 'streak-flame' + (st.day >= 5 ? ' hot' : (st.day >= 3 ? ' warm' : '')) + (st.canClaim ? ' claimable' : '');
    var html = '<p class="hint streak-status"><span class="' + flameCls + '" aria-hidden="true">🔥</span> Day <strong>' + st.day + '</strong> of 7' +
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
    html += buildStreakCalendarHtml();
    streakBody.innerHTML = html;
    var btn = document.getElementById('btn-claim-streak');
    if (btn) {
      btn.disabled = !st.canClaim;
      btn.classList.toggle('btn-streak-ready', !!st.canClaim);
      btn.textContent = st.claimed ? 'Claimed today' : ('Claim Day ' + st.day + ' 🔥');
    }
    if (btnStreak) {
      btnStreak.classList.toggle('streak-flame-btn', st.day >= 2 || !!st.canClaim);
      btnStreak.classList.toggle('btn-streak-ready', !!st.canClaim);
      btnStreak.innerHTML = '<span class="streak-flame-icon' + (st.canClaim ? ' claimable' : (st.day >= 3 ? ' warm' : '')) + '" aria-hidden="true">🔥</span> Streak';
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
    var btnClearSpinHistory = document.getElementById('btn-clear-spin-history');
  if (btnClearSpinHistory) {
    btnClearSpinHistory.addEventListener('click', function (e) {
      e.stopPropagation();
      clearMysteryHistoryUI();
    });
  }
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

  function setGuideLang(lang, persist) {
    lang = lang || 'en';
    if (lang !== 'en' && lang !== 'ru' && lang !== 'ur') lang = 'en';
    document.querySelectorAll('.guide-tab').forEach(function (t) {
      var on = t.getAttribute('data-guide-lang') === lang;
      t.classList.toggle('active', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    document.querySelectorAll('[data-guide-panel]').forEach(function (p) {
      p.hidden = p.getAttribute('data-guide-panel') !== lang;
    });
    if (persist !== false && FTStorage.setGuideLang) FTStorage.setGuideLang(lang);
  }
  if (btnGuide) btnGuide.addEventListener('click', function () {
    hideAllScreens();
    if (screenGuide) screenGuide.hidden = false;
    var saved = (FTStorage.getGuideLang && FTStorage.getGuideLang()) || 'en';
    setGuideLang(saved, false);
  });
  document.querySelectorAll('.guide-tab').forEach(function (t) {
    t.addEventListener('click', function () {
      setGuideLang(t.getAttribute('data-guide-lang') || 'en', true);
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
  hapticIntensity = (FTStorage.getHapticIntensity && FTStorage.getHapticIntensity()) || 'normal';
  // 3.25 leftover bugfix: load ghost opacity + garage sort + coach at boot
  practiceGhostOpacity = (FTStorage.getPracticeGhostOpacity && FTStorage.getPracticeGhostOpacity()) || 0.38;
  garageSortMode = (FTStorage.getGarageSort && FTStorage.getGarageSort()) || 'owned';
  coachStep = (FTStorage.getCoachStep && FTStorage.getCoachStep()) || 0;
  applyLargeButtons(FTStorage.isLargeButtons && FTStorage.isLargeButtons());
  syncPrefersReducedMotion();
  FTAudio.setVoicePack(FTStorage.getVoicePack());
  applyReduceMotionClass();
  best = FTStorage.getBest();
  FTStorage.checkEnvMilestones(best);
  if (FTStorage.checkSeasonalUnlocks) FTStorage.checkSeasonalUnlocks(best);
  syncMuteBtn();
  syncAreaMusicPref();
  startDailyCountdownTicker();
  initClouds();
  initRain();
  resetBird();
  resetPipes();
  updateBestUI();
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  window.addEventListener('orientationchange', function () { setTimeout(resizeCanvas, 100); });

  var offlineReadyToasted = false;
  var wasOffline = false;
  function updateOfflineBanner() {
    var el = document.getElementById('offline-banner');
    if (!el) return;
    var offline = (typeof navigator !== 'undefined' && navigator.onLine === false);
    el.hidden = !offline;
    if (offline) {
      el.classList.add('offline-show');
      el.textContent = '📡 Offline — Urr Jaa! still plays from cache.';
      wasOffline = true;
    } else {
      el.classList.remove('offline-show');
      if (wasOffline) {
        wasOffline = false;
        showToast('✓ Back online · still offline-ready', 1600);
      }
    }
  }
  /** 3.32: one-shot toast after boot confirming cache-ready play. */
  function maybeToastOfflineReady() {
    if (offlineReadyToasted) return;
    offlineReadyToasted = true;
    try {
      if (sessionStorage.getItem('urrjaa:offline-ready-toast') === '1') return;
      sessionStorage.setItem('urrjaa:offline-ready-toast', '1');
    } catch (e) { /* private */ }
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      showToast('📡 Offline-ready · playing from cache', 1800);
    } else {
      showToast('✓ Offline-ready · works without network', 1600);
    }
  }
  function setBootProgress(pct, label) {
    var fill = document.getElementById('splash-progress-fill');
    var pctEl = document.getElementById('splash-progress-pct');
    var hint = document.querySelector('.splash-hint');
    pct = Math.max(0, Math.min(100, pct | 0));
    if (fill) fill.style.width = pct + '%';
    if (pctEl) pctEl.textContent = pct + '%';
    if (hint && label) hint.textContent = label;
  }
  function hideBootSplash() {
    var splash = document.getElementById('boot-splash');
    if (!splash || splash.hidden) return;
    setBootProgress(100, 'Ready — Urr Jao!');
    splash.classList.add('splash-hide');
    setTimeout(function () {
      splash.hidden = true;
      splash.setAttribute('aria-hidden', 'true');
    }, 450);
  }
  function runBootSequence() {
    setBootProgress(12, 'Warming engines…');
    setTimeout(function () { setBootProgress(38, 'Loading skins…'); }, 90);
    setTimeout(function () { setBootProgress(62, 'Tuning audio…'); }, 180);
    setTimeout(function () {
      setBootProgress(85, 'Almost ready…');
      try { if (FTAudio && FTAudio.unlock) { /* wait for gesture */ } } catch (e) {}
    }, 280);
    setTimeout(function () {
      setBootProgress(100, 'Ready — Urr Jao!');
      hideBootSplash();
      setTimeout(maybeToastOfflineReady, 520);
    }, 420);
  }
  window.addEventListener('online', updateOfflineBanner);
  window.addEventListener('offline', updateOfflineBanner);
  updateOfflineBanner();
  syncSwipeDismissPref();
  syncStreakBtn();
  showMenu();
  loop(performance.now());
  runBootSequence();
})();
