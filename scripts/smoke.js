#!/usr/bin/env node
/** Lightweight smoke: syntax + required globals / mode strings present. */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const files = ['js/sim.js', 'js/storage.js', 'js/audio.js', 'js/ads.js', 'js/skins.js', 'js/game.js'];
let ok = true;
for (const f of files) {
  const src = fs.readFileSync(path.join(root, f), 'utf8');
  if (!src.trim()) { console.error('EMPTY', f); ok = false; }
}
const game = fs.readFileSync(path.join(root, 'js/game.js'), 'utf8');
const need = [
  'timeattack', 'nocoin', 'onelife', 'RISKY', 'CLOSE!', 'Ghost',
  'Turbo', 'magnet', 'claimStreak', 'getLeaderboards', 'pickTrafficKind',
  '3.58.5', 'squashTarget', 'voiceCue', 'softenCoinComboOnMiss', 'Sukoon', 'relaxBumpResponse', 'activeVisualBirdId', 'mascot:',
  'PERFECT!', 'DANGER', 'coinComboMult', 'grantMysteryReward', 'birdPass',
  'runPerfects', 'bossActive', 'effectiveWeather',
  'LUCKY!', 'isForgivingMode', 'firstRunProtect', 'calibMods', 'applyLuckySave', 'resolveCollision',
  'btn-voice-preview', "voiceCue('lucky')",
  'openGiftsScreen', 'doSpinOnce', 'doSpinAll', 'addGiftBoxes', 'spinWheelOnce',
  'animateWheelTo', 'Mystery Rewards', '📦 → Mystery Rewards',
  'voiceGiftCue', 'noteGiftAdd', 'maybeShowSpinUnlockPopup', 'setGuideLang', 'spin-unlock-overlay',
  'checkSeasonalUnlocks', 'Seasonals', 'hunza', 'monsoon',
  'spawnGiftPop', 'MAX_PARTICLES', "showToast('CLOSE!', 850, 'close')", 'gift-progress',
  'wingFlap', 'headTilt', 'spawnFlapFeathers', 'wheelRot',
  'SPIN_ONCE_MS', 'beginWheelSpin', 'grantSpinCoins', 'checkThemeSkinMilestones',
  'vehicleTheme', 'spinAllDurationMs',
  'mouthOpen', 'triggerChirpMouth', 'headBob', 'mouthChirpUntil',
  'refreshSpinHistoryUI', 'wheelEaseOut', 'cancelWheelAnim', 'spin-history-list',
  'requestAnimationFrame(frame)', 'ROOT-CAUSE FIX',
  'spawnPerfectStars', 'spawnConfettiBurst', 'runGradeFor', 'spinRarityClass', 'spinRarityLabel',
  'wingLag', 'tipFlutter', 'tailWag', 'eyeBlink', 'vehLean', 'isForgivingMode()) g *= 0.93',
  'spawnPowerPickupFX', 'particleBudget', 'fogWisps', 'weatherFlash', 'applyGarageFilter',
  'garageFilter', 'powerRemainSec', 'pause-score', 'lastFlapTouchTs', 'combo-x5',
  'camKickX', 'drawMagnetAura', 'openSharePreview', 'bossDurMs', 'medal-gallery', 'nearMissCamUntil',
  'drawPerfectRails', 'drawPracticeGhost', 'practiceGhost', 'BOX_CHANCE_LATE', 'updateOfflineBanner',
  'hideBootSplash', 'ta-hud', 'perfectRailFlash', 'time_up',
  'drawSlowMoVFX', 'drawTurboVFX', 'updateLivesHud', 'updateUnlockTeaser', 'coinEconomyScale',
  'openChallengeStageSelect', 'abortPendingSpinKeepCharge', 'closeTopOverlayOrPanel', 'panel-close',
  'haptic(\'gift\')', 'pendingUngrantedSpin'
,
  'spawnFireworks', 'refreshDeathTip', 'refreshMenuTip', 'TUTORIAL_TIPS', 'bloomFirework', 'lastHitCause',
  'fw_rocket', 'menu-tip', 'death-tip',
  'maybeComboMilestone', 'COMBO_MILESTONES', 'tryFlapFromInput', 'startGaragePreview',
  'syncQuietNight', 'claim-juice', 'quiet-night-toggle', 'drawBox',
  'buildStreakCalendarHtml', 'confettiScale', 'recordTopRun', 'Local Top 5',
  'startSpinWhoosh', 'spinLand', 'confetti-intensity',
  'playUnlockFanfare', 'buildMissionCalendarHtml', 'thunder', 'fanfare',
  '_particleBudgetCached',
  'spawnCoinRain', 'setPauseBlur', 'clearMysteryHistoryUI', 'life-break', 'coin_rain',
  'btn-clear-spin-history',
  'runBootSequence', 'setBootProgress', 'refreshSeasonalHint', 'applyLargeButtons',
  'large-buttons-toggle', 'seasonal-hint', 'splash-progress-fill', 'announceGameEvent', 'isDemoMode', 'exportProgress', 'importProgress',
  'buildShareCardCanvas', 'shareScoreCardImage', 'spawnLandingDust', 'syncPrefersReducedMotion',
  'shadowProx',
  'COACH_STEPS', 'maybeStartCoach', 'advanceCoach', 'finishCoach', 'showCoachStep',
  'practiceGhostOpacity', 'magnetPullAcc', 'ghost-opacity-slider', '_pCap',
  'turboTrail', 'ghostSilTrail', 'garageSortMode', 'garage-sort',
  'captureDeathFreezeFrame', 'replayBuf', 'drawPipeParallaxMicro', 'drawDeathFreezeOverlay',
  'MUTE_SVG_ON', 'paintReplayViz', 'startReplayVizAnim', 'replaySnapshot', 'envFade',
  'popScore(gained, c.x, c.y - 10, { coin: true })',
  'powerExpiring', 'power-expiring', 'drawNearMissEdgeFlash', 'nearMissEdgeFlash',
  'refreshDailyCountdown', 'startDailyCountdownTicker', 'applyResetPreferences',
  'hapticScale', 'hapticIntensity', 'bossWarnActive', 'to next spin', 'INBOUND',
  'spawnFlapWhoosh', 'updatePowerHud._fp', 'trailGap',
  'spawnSoftCollisionDust', 'celebrateJackpot', 'syncAreaMusicPref',
  'maybeToastOfflineReady', 'collectionFilter', 'collection-filters',
  'syncSwipeDismissPref', 'syncStreakBtn', 'deferredA2hsPrompt', 'pointer-bounce',
  'A2HS_LATER_KEY', 'a2hsHowToText', 'haptic(\'perfect\')', 'isIosSafari',
  'FLAP_UI_BLOCK', 'score-juice', 'medal-shine', 'is-landscape',
  'updateComboMeter', 'spawnGroundBounceJuice', 'bindSettingsSections', 'combo-meter',
  'runResumeCountdown', 'sortedClouds', 'finishResumeFromPause', 'activePowerIndicators',
  'drawSunFlare', 'missions-empty', 'missions-all-done',
  'missions-claim-all', 'garage-empty', 'No scores yet', "mode === 'night'",
  'ensureStarfield', 'drawStarfield', 'claim-all-juice', 'data-garage-empty-cta', '_cloudsSorted',
  'drawShootingStar', 'shootingStar', 'garage-search', 'toast-claim', 'Claimed all',
  'Star luck!', 'garage-search-clear', 'onGarageFavoriteChange', "garageFilter === 'fav'",
  '★ Synced', 'STAR_COIN_RUN_CAP', 'Star luck!', 'openGarageLongPreview', 'garage-lp-preview',
  'equipFromGarageLp', 'garage-lp-equip', 'pingCoinHudStar', 'coin-hud-star-ping', 'Equipped ·',
  'playEquipFanfareLight', 'onGarageDoubleEquip', 'nightAmbAcc', 'night ambience haze',
  'armEquipUndo', 'undoLastEquip', 'toast-undo', 'syncNightAmbVol', 'garagePickWithUndo',
  'equipUndoStack', 'pruneEquipUndoStack', 'previewNightAmbienceVol', 'extendTopEquipUndo',
  'clearEquipUndoStack', 'toast-undo-clear', 'Cleared undo', 'Night sample',
  'requestClearEquipUndoStack', 'undo-confirm', 'Yes, clear', 'cancelClearEquipUndo',
  'spawnPipeClearJuice', 'btn-play-milestone', 'maybePlayShimmer', 'clearPlayShimmer', 'pipeClear', 'PLAY_SPLASH_DAY_KEY', 'document.hidden', 'pipeClear({ combo', 'juiceKind', 'visibilitychange', 'squashTarget >= 0.9', "!p._wasNearMiss", '_lastPerfectToastAt', '_lastPerfectHapticAt', '_lastPerfectVoiceAt', 'camKickZoom = 0.012', 'railN', 'nStar', 'combo >= 8', 'var cap = particleBudget', '_pCap * 0.7'
];
for (const n of need) {
  if (!game.includes(n)) { console.error('MISSING in game.js:', n); ok = false; }
}
if (!game.includes('SPIN_ONCE_MS = 15000')) { console.error('SPIN_ONCE_MS not 15000'); ok = false; }
if (!game.includes('return 8000') || !game.includes('return 5000')) { console.error('spinAllDurationMs tiering missing'); ok = false; }
const storage = fs.readFileSync(path.join(root, 'js/storage.js'), 'utf8');
for (const n of ['coins50', 'dodge20', 'nearmiss3', 'score100', 'score70', 'addFragments', 'rollBoxRarity', 'albumCompletionPct', 'pushRunDuration', 'getAvgRunDuration', 'getGiftBoxes', 'spinWheelAll', 'beginWheelSpin', 'grantSpinCoins', 'WHEEL_REWARDS', 'GIFTS_PER_SPIN', 'checkSeasonalUnlocks', 'SEASONALS', 'unlockSeasonal', 'kabootar', 'oldcity', 'jungle', 'alpine', 'seagull', 'checkThemeSkinMilestones', 'getSpinHistory', 'recordSpinHistory', 'getSpinHistoryTotal', 'clearSpinHistory', 'SPIN_HISTORY_MAX', 'isQuietNight', 'setQuietNight', 'getTopRuns', 'recordTopRun', 'getStreakLog', 'getConfettiIntensity', 'getMissionDays', 'markMissionDay', 'isLargeButtons', 'setLargeButtons', 'getPracticeGhostOpacity', 'setPracticeGhostOpacity', 'isCoachDone', 'setCoachDone', 'getCoachStep', 'setCoachStep', 'getGarageSort', 'setGarageSort', 'getNightAmbVol', 'setNightAmbVol', 'getGarageFavorites', 'isGarageFavorite', 'toggleGarageFavorite', 'msUntilDailyReset', 'formatDailyCountdown', 'resetPreferences', 'getHapticIntensity', 'setHapticIntensity', 'isAreaMusic', 'setAreaMusic', 'isSwipeDismiss', 'setSwipeDismiss', 'isResumeCountdown', 'setResumeCountdown', 'getGuideLang', 'setGuideLang', 'perfect5', 'combo8', 'gifts3', 'fly800', 'nearmiss8', 'score40']) {
  if (!storage.includes(n)) { console.error('MISSING in storage.js:', n); ok = false; }
}
const audio = fs.readFileSync(path.join(root, 'js/audio.js'), 'utf8');
for (const n of ['playMenuMusic', 'setAreaMusicEnabled', 'setMusicFadeTarget', 'musicFade', 'voiceTone', 'setVoicePack', 'isVoicePack', 'speechSynthesis', 'speakPhrase', 'playChirpNotes', 'preview', 'SPEAK_TEXT', 'voiceGift', 'VOICE_POOLS', 'GLOBAL_VOICE_COOLDOWN_MS', 'zabardast', 'mil_gaya', 'function chirp', 'fanfareLight', 'pipeClear', 'nightAmbienceTick', 'setNightAmbienceVolume', 'previewNightAmbience', 'duckAmbienceForVoice', 'ambienceEffectiveMul', 'perfect_pass', 'time_up', 'lajawab', 'bilkul_center']) {
  if (!audio.includes(n)) { console.error('MISSING in audio.js:', n); ok = false; }
}
if (!audio.includes('independent') && !audio.includes('Independent') && !audio.includes('voiceOn only')) {
  console.error('MISSING voice independence note in audio.js');
  ok = false;
}
const skins = fs.readFileSync(path.join(root, 'js/skins.js'), 'utf8');
for (const n of ['BIRD_PASSIVES', 'weatherMods', 'sunset', 'pickBossKind', 'SEASONAL_PACKS', 'seasonalEligible', 'mynah', 'hunza', 'ind_topi', 'basant_trail', 'drawBirdBody', 'drawVehicleUnder', 'rickshaw', 'mehran', 'drawWing', 'shadeColor', 'wingFlap', 'headTilt', 'wheelRot', 'jungle', 'alpine', 'seagull', 'jungle_rickshaw', 'snow_bike', 'sea_boat', 'vehicleTheme', 'Best ', 'mouthOpen', 'headBob', 'wingLag', 'tipFlutter', 'tailWag', 'eyeBlink', 'vehLean', 'theme-skin', 'skin-theme-badge', 'skin-fav-pin', 'favorited', 'isGarageFavorite', 'THEME_IDS', 'pal.neon', 'pal.night', 'drawPipeSkin', 'mosaic', 'terracotta', 'neon_pipe', 'tiled', 'lattice', 'stripe', 'skin-teaser-bar', 'skin-teaser-near', 'shadowProx', 'sortMode', 'itemUnlocked', 'items.sort']) {
  if (!skins.includes(n)) { console.error('MISSING in skins.js:', n); ok = false; }
}
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
if (!sw.includes('urrjaa-v90-20260930')) { console.error('SW cache not bumped'); ok = false; }
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
if (pkg.version !== '3.58.5-urrjaa') { console.error('package version', pkg.version); ok = false; }
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
if (!html.includes('v3.58.5-urrjaa')) { console.error('index version tag missing'); ok = false; }
if (!html.includes('how-to-play.html') || !fs.existsSync(path.join(root, 'how-to-play.html'))) { console.error('bilingual quick guide missing'); ok = false; }
const guide = fs.readFileSync(path.join(root, 'how-to-play.html'), 'utf8');
if (!guide.includes('<section id="roman-urdu" lang="ur-Latn">')) { console.error('Roman Urdu language tag missing'); ok = false; }
if (!html.includes('data-mode="timeattack"')) { console.error('modes missing'); ok = false; }
if (!html.includes('run-summary')) { console.error('run summary missing'); ok = false; }
if (!html.includes('btn-voice-preview')) { console.error('voice preview btn missing'); ok = false; }
if (!html.includes('screen-gifts')) { console.error('gifts screen missing'); ok = false; }
if (!html.includes('btn-spin-once') || !html.includes('btn-spin-all')) { console.error('spin buttons missing'); ok = false; }
if (!html.includes('Mystery Rewards')) { console.error('Mystery Rewards title missing'); ok = false; }
if (!html.includes('spin-wheel') || !html.includes('wheel-hub')) { console.error('visual wheel missing'); ok = false; }
if (!html.includes('spin-history-list') || !html.includes('Mystery box History')) { console.error('spin history UI missing'); ok = false; }
if (!html.includes('run-grade') || !html.includes('run-time')) { console.error('run grade/time summary missing'); ok = false; }
if (!html.includes('spin-history-count')) { console.error('spin history count missing'); ok = false; }
if (!html.includes('btn-play-pulse') || !html.includes('logo-shimmer')) { console.error('menu polish classes missing'); ok = false; }
if (!html.includes('Run grade')) { console.error('guide run grade missing'); ok = false; }
if (!html.includes('garage-filter') || !html.includes('data-garage-filter="theme"')) { console.error('garage theme filter missing'); ok = false; }
if (!html.includes('pause-score') || !html.includes('pause-tip')) { console.error('pause polish missing'); ok = false; }
if (!html.includes('settings-group') || !html.includes('btn-haptic-preview')) { console.error('settings polish missing'); ok = false; }
if (!html.includes('Daily missions')) { console.error('guide daily missions missing'); ok = false; }
if (!html.includes('share-preview') || !html.includes('btn-share-confirm')) { console.error('share preview missing'); ok = false; }
if (!html.includes('id="continue-hint"') || !html.includes('DEMO · Simulate rewarded revive')) { console.error('demo-only continue UX missing'); ok = false; }
if (!html.includes('Install Urr Jaa!') && !html.includes('Install for offline play')) { console.error('a2hs polish missing'); ok = false; }
if (!html.includes('Chase events')) { console.error('guide chase missing'); ok = false; }
if (!html.includes('boot-splash') || !html.includes('offline-banner')) { console.error('splash/offline missing'); ok = false; }
if (!html.includes('Perfect rail') || !html.includes('Practice')) { console.error('guide 3.14 missing'); ok = false; }
if (!html.includes('panel-close') || !html.includes('data-panel-close')) { console.error('panel close missing'); ok = false; }
if (!html.includes('btn-magic-action') || !html.includes('screen-magic') || !html.includes('USE MAGIC')) { console.error('MAGIC UI missing'); ok = false; }
if (!html.includes('lives-hud') || !html.includes('unlock-teaser') || !html.includes('challenge-stage-panel')) { console.error('3.15 HUD/panels missing'); ok = false; }
if (!html.includes('Power VFX') || !html.includes('Close (X)')) { console.error('guide 3.15 missing'); ok = false; }
if (!html.includes('15s') || !html.includes('Mystery wheel')) { console.error('guide 3.16 wheel missing'); ok = false; }
if (!html.includes('Spin once ≈ 15s wheel')) { console.error('spin hint 15s missing'); ok = false; }
if (!html.includes('menu-tip') || !html.includes('death-tip')) { console.error('3.17 tip elements missing'); ok = false; }
if (!html.includes('quiet-night-toggle') || !html.includes('Quiet at night')) { console.error('3.18 quiet night missing'); ok = false; }
if (!html.includes('3.18:')) { console.error('guide 3.18 missing'); ok = false; }
if (!html.includes('confetti-intensity') || !html.includes('Confetti intensity')) { console.error('3.19 confetti setting missing'); ok = false; }
if (!html.includes('3.19:')) { console.error('guide 3.19 missing'); ok = false; }
if (!html.includes('Settings · Quiet at night') || !html.includes('Settings · Confetti intensity')) { console.error('guide quiet/confetti notes missing'); ok = false; }
if (!html.includes('3.20:')) { console.error('guide 3.20 missing'); ok = false; }
if (!html.includes('btn-clear-spin-history')) { console.error('clear history btn missing'); ok = false; }
if (!html.includes('apple-mobile-web-app-status-bar-style') || !html.includes('black-translucent')) { console.error('iOS status bar meta missing'); ok = false; }
if (!html.includes('apple-mobile-web-app-title')) { console.error('iOS PWA title missing'); ok = false; }
if (!html.includes('3.21:')) { console.error('guide 3.21 missing'); ok = false; }
if (!html.includes('large-buttons-toggle') || !html.includes('Larger buttons')) { console.error('3.22 large buttons missing'); ok = false; }
if (!html.includes('seasonal-hint') || !html.includes('splash-progress-fill')) { console.error('3.22 splash/seasonal missing'); ok = false; }
if (!html.includes('name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"')) { console.error('user-zoomable viewport missing'); ok = false; }
if (!html.includes('id="game-announcer"') || !html.includes('id="btn-export-progress"') || !html.includes('id="btn-import-progress"')) { console.error('accessibility/data-transfer controls missing'); ok = false; }
if (!html.includes('3.22:')) { console.error('guide 3.22 missing'); ok = false; }
if (!html.includes('btn-share-image') || !html.includes('Share score card')) { console.error('3.23 share image missing'); ok = false; }
if (!html.includes('settings-credits') || !html.includes('v3.58.5-urrjaa')) { console.error('3.23 credits missing'); ok = false; }
if (!html.includes('data-mascot-selection=\"sunseed\"') || !html.includes('Use equipped bird')) { console.error('mascot selector/fallback missing'); ok = false; }
if (!html.includes('3.23:')) { console.error('guide 3.23 missing'); ok = false; }
if (!html.includes('coach-marks') || !html.includes('btn-coach-next')) { console.error('3.24 coach missing'); ok = false; }
if (!html.includes('ghost-opacity-slider') || !html.includes('Practice ghost opacity')) { console.error('3.24 ghost opacity missing'); ok = false; }
if (!html.includes('3.24:')) { console.error('guide 3.24 missing'); ok = false; }
if (!html.includes('garage-sort') || !html.includes('Owned first')) { console.error('3.25 garage sort missing'); ok = false; }
if (!html.includes('3.25:')) { console.error('guide 3.25 missing'); ok = false; }
if (!html.includes('death-freeze-thumb') || !html.includes('btn-replay-stub')) { console.error('3.26 freeze/replay missing'); ok = false; }
if (!html.includes('mute-btn')) { console.error('3.26 mute btn class missing'); ok = false; }
if (!html.includes('3.26:')) { console.error('guide 3.26 missing'); ok = false; }
if (!html.includes('replay-viz-canvas') || !html.includes('Replay path')) { console.error('3.27 replay viz missing'); ok = false; }
if (!html.includes('death-freeze-badge')) { console.error('3.27 freeze badge missing'); ok = false; }
if (!html.includes('3.27:')) { console.error('guide 3.27 missing'); ok = false; }
if (!html.includes('daily-reset-countdown') || !html.includes('btn-reset-prefs')) { console.error('3.28 daily/reset missing'); ok = false; }
if (!html.includes('reset-prefs-confirm')) { console.error('3.28 reset confirm missing'); ok = false; }
if (!html.includes('3.28:')) { console.error('guide 3.28 missing'); ok = false; }
if (!html.includes('haptic-intensity') || !html.includes('Haptic intensity')) { console.error('3.29 haptic intensity missing'); ok = false; }
if (!html.includes('3.29:')) { console.error('guide 3.29 missing'); ok = false; }
if (!html.includes('settings-changelog') || !html.includes('Changelog')) { console.error('3.30 changelog missing'); ok = false; }
if (!html.includes('3.30:')) { console.error('guide 3.30 missing'); ok = false; }
if (!html.includes('area-music-toggle') || !html.includes('Area / menu music')) { console.error('3.31 music toggle missing'); ok = false; }
if (!html.includes('collection-pct-header')) { console.error('3.31 collection meter missing'); ok = false; }
if (!html.includes('3.31:')) { console.error('guide 3.31 missing'); ok = false; }
if (!html.includes('3.32:')) { console.error('guide 3.32 missing'); ok = false; }
if (!html.includes('3.33:')) { console.error('guide 3.33 missing'); ok = false; }
if (!html.includes('swipe-dismiss-toggle') || !html.includes('a2hs-install')) { console.error('3.33 UI missing'); ok = false; }
if (!html.includes('3.34:')) { console.error('guide 3.34 missing'); ok = false; }
if (!html.includes('a2hs-how') || !html.includes('a2hs-steps')) { console.error('3.34 A2HS flow missing'); ok = false; }
if (!html.includes('3.35:')) { console.error('guide 3.35 missing'); ok = false; }
if (!html.includes('medal-shine-sheen')) { console.error('3.35 medal shine missing'); ok = false; }
if (!html.includes('3.36:')) { console.error('guide 3.36 missing'); ok = false; }
if (!html.includes('combo-meter') || !html.includes('settings-section') || !html.includes('notch-pad')) { console.error('3.36 UI missing'); ok = false; }
if (!html.includes('3.37:')) { console.error('guide 3.37 missing'); ok = false; }
if (!html.includes('resume-countdown') || !html.includes('magnet-hud') || !html.includes('resume-countdown-toggle')) { console.error('3.37 UI missing'); ok = false; }
if (!html.includes('3.38:')) { console.error('guide 3.38 missing'); ok = false; }
if (!html.includes('gift-bob')) { console.error('3.38 gift bob missing'); ok = false; }
if (!html.includes('3.39:')) { console.error('guide 3.39 missing'); ok = false; }
if (!html.includes('3.40:')) { console.error('guide 3.40 missing'); ok = false; }
if (!html.includes('Quick tips (3.23')) { console.error('3.30 guide refresh missing'); ok = false; }

if (!html.includes('Tips &amp; fireworks') && !html.includes('Tips & fireworks')) { console.error('guide 3.17 missing'); ok = false; }
if (!html.includes('run-gifts')) { console.error('run gifts summary missing'); ok = false; }
if (!html.includes('screen-guide') || !html.includes('btn-guide')) { console.error('guide screen missing'); ok = false; }
if (!html.includes('data-guide-lang="ur"')) { console.error('urdu guide tab missing'); ok = false; }
if (!html.includes('spin-unlock-overlay')) { console.error('spin unlock popup missing'); ok = false; }
if (!html.includes('Seasonals (offline)')) { console.error('seasonal guide missing'); ok = false; }
if (!html.includes('btn-share')) { console.error('share button missing'); ok = false; }
if (!html.includes('id="a2hs"')) { console.error('a2hs tip missing'); ok = false; }
if (!html.includes('Add to Home Screen')) { console.error('a2hs EN copy missing'); ok = false; }
if (!game.includes('shareRunSummary')) { console.error('shareRunSummary missing'); ok = false; }
if (!game.includes('updateA2hsTip')) { console.error('updateA2hsTip missing'); ok = false; }
if (!storage.includes("label: 'Mission'")) { console.error('safe mission fallback label missing'); ok = false; }
if (!storage.includes('allowed.has')) { console.error('mission id allowlist missing'); ok = false; }
if (game.includes("'<div class=\"mission-title\">' + m.label")) { console.error('mission label innerHTML concat still present'); ok = false; }
const css = fs.readFileSync(path.join(root, 'css/style.css'), 'utf8');
if (!css.includes('rim-pulse') || !css.includes('wheel-hub')) { console.error('wheel polish CSS missing'); ok = false; }
if (!css.includes('run-grade') || !css.includes('spin-hist-badge') || !css.includes('btn-play-pulse')) { console.error('3.11 polish CSS missing'); ok = false; }
if (!css.includes('power-chip') || !css.includes('garage-filter') || !css.includes('pause-stats') || !css.includes('streak-progress')) { console.error('3.12 polish CSS missing'); ok = false; }
if (!css.includes('share-card') || !css.includes('medal-gallery') || !css.includes('continue-hint') || !css.includes('a2hs-visible')) { console.error('3.13 polish CSS missing'); ok = false; }
if (!css.includes('boot-splash') || !css.includes('offline-banner') || !css.includes('ta-hud')) { console.error('3.14 polish CSS missing'); ok = false; }
if (!css.includes('panel-close') || !css.includes('lives-hud') || !css.includes('challenge-stage-card') || !css.includes('safe-left')) { console.error('3.15 polish CSS missing'); ok = false; }
if (!css.includes('spin-history') || !css.includes('wheel-land')) { console.error('3.10 history/spin CSS missing'); ok = false; }
if (!css.includes('.a2hs')) { console.error('a2hs CSS missing'); ok = false; }
if (!css.includes('coach-marks') || !css.includes('coach-dot')) { console.error('3.24 coach CSS missing'); ok = false; }
if (!css.includes('garage-sort-row')) { console.error('3.25 garage sort CSS missing'); ok = false; }
if (!css.includes('death-freeze-thumb') || !css.includes('mute-btn')) { console.error('3.26 freeze/mute CSS missing'); ok = false; }
if (!css.includes('replay-viz-canvas') || !css.includes('death-freeze-badge')) { console.error('3.27 replay CSS missing'); ok = false; }
if (!css.includes('power-expiry-pulse') || !css.includes('daily-reset-countdown')) { console.error('3.28 CSS missing'); ok = false; }
if (!css.includes('panel-slide-in')) { console.error('3.29 panel slide CSS missing'); ok = false; }
if (!css.includes('settings-changelog')) { console.error('3.30 changelog CSS missing'); ok = false; }
if (!css.includes('collection-pct-meter') || !css.includes('wheel-jackpot')) { console.error('3.31 collection/jackpot CSS missing'); ok = false; }
if (!css.includes('collection-filter-chip') || !css.includes('collection-filters')) { console.error('3.32 CSS missing'); ok = false; }
if (!css.includes('pointer-bounce-land') || !css.includes('streak-flame-flicker') || !css.includes('a2hs-install-btn')) { console.error('3.33 CSS missing'); ok = false; }
if (!css.includes('a2hs-how') || !css.includes('a2hs-step') || !css.includes('toast.perfect')) { console.error('3.34 CSS missing'); ok = false; }
if (!css.includes('score-juice-big') || !css.includes('medal-shine-sweep') || !css.includes('is-landscape')) { console.error('3.35 CSS missing'); ok = false; }
if (!css.includes('combo-meter') || !css.includes('settings-section') || !css.includes('notch-pad') || !css.includes('--hud-top')) { console.error('3.36 CSS missing'); ok = false; }
if (!css.includes('resume-countdown') || !css.includes('magnet-hud') || !css.includes('resume-pop')) { console.error('3.37 CSS missing'); ok = false; }
if (!css.includes('missions-empty') || !css.includes('gift-bob-ui')) { console.error('3.38 CSS missing'); ok = false; }
if (!css.includes('missions-claim-all') || !css.includes('panel-empty')) { console.error('3.39 CSS missing'); ok = false; }
if (!css.includes('claim-all-pop') || !css.includes('panel-empty-cta')) { console.error('3.40 CSS missing'); ok = false; }
if (!css.includes('garage-search') || !css.includes('toast-claim') || !css.includes('claim-toast-glow')) { console.error('3.41 CSS missing'); ok = false; }
if (!html.includes('garage-search') || !html.includes('id="garage-search"')) { console.error('3.41 garage search HTML missing'); ok = false; }
if (!game.includes('drawShootingStar') || !game.includes('shootingStar') || !game.includes("kind === 'claim'")) { console.error('3.41 game features missing'); ok = false; }
if (!game.includes("Claimed all ·") && !game.includes('Claimed all')) { console.error('3.41 claim toast copy missing'); ok = false; }
if (!css.includes('skin-fav-pin') || !css.includes('garage-search-clear') || !css.includes('skin-card.favorited')) { console.error('3.42 CSS missing'); ok = false; }
if (!html.includes('garage-search-clear') || !html.includes('data-garage-filter="fav"')) { console.error('3.42 garage fav/clear HTML missing'); ok = false; }
if (!game.includes('onGarageFavoriteChange') || !game.includes("garageFilter === 'fav'")) { console.error('3.42 game features missing'); ok = false; }
if (!skins.includes('skin-fav-pin') || !storage.includes('toggleGarageFavorite')) { console.error('3.42 fav pin storage/skins missing'); ok = false; }
if (!css.includes('toast-sync') || !css.includes('garage-lp-preview') || !css.includes('garage-lp-card')) { console.error('3.43 CSS missing'); ok = false; }
if (!game.includes('★ Synced') || !game.includes('STAR_COIN_RUN_CAP') || !game.includes('Star luck!') || !game.includes('openGarageLongPreview')) { console.error('3.43 game features missing'); ok = false; }
if (!game.includes("kind === 'sync'") || !game.includes('garage-lp-preview')) { console.error('3.43 sync/lp missing'); ok = false; }
if (!css.includes('coin-hud-star-ping') || !css.includes('garage-lp-actions')) { console.error('3.44 CSS missing'); ok = false; }
if (!game.includes('equipFromGarageLp') || !game.includes('garage-lp-equip') || !game.includes('pingCoinHudStar') || !game.includes('Equipped ·')) { console.error('3.44 game features missing'); ok = false; }
if (!css.includes('equip-flash-pop') || !css.includes('skin-card.equip-flash')) { console.error('3.45 CSS missing'); ok = false; }
if (!game.includes('playEquipFanfareLight') || !game.includes('onGarageDoubleEquip') || !game.includes('nightAmbAcc')) { console.error('3.45 game features missing'); ok = false; }
if (!audio.includes('fanfareLight') || !audio.includes('nightAmbienceTick')) { console.error('3.45 audio missing'); ok = false; }
if (!skins.includes('onGarageDoubleEquip') || !skins.includes('equip-flash')) { console.error('3.45 skins double-tap missing'); ok = false; }
if (!css.includes('toast-undo') || !css.includes('toast-undo-btn')) { console.error('3.46 CSS missing'); ok = false; }
if (!game.includes('armEquipUndo') || !game.includes('undoLastEquip') || !game.includes('syncNightAmbVol')) { console.error('3.46 game features missing'); ok = false; }
if (!html.includes('night-amb-vol') || !storage.includes('getNightAmbVol') || !audio.includes('setNightAmbienceVolume')) { console.error('3.46 night amb vol missing'); ok = false; }
if (!game.includes('equipUndoStack') || !game.includes('pruneEquipUndoStack') || !game.includes('previewNightAmbienceVol')) { console.error('3.47 game features missing'); ok = false; }
if (!html.includes('btn-night-amb-preview') || !audio.includes('previewNightAmbience', 'duckAmbienceForVoice', 'ambienceEffectiveMul')) { console.error('3.47 night preview missing'); ok = false; }
if (!game.includes('clearEquipUndoStack') || !game.includes('toast-undo-clear') || !game.includes('Cleared undo')) { console.error('3.48 clear undo missing'); ok = false; }
if (!css.includes('toast-undo-clear') || !css.includes('toast-undo-actions')) { console.error('3.48 CSS missing'); ok = false; }
if (!audio.includes('cricket chorus') || !game.includes('Night sample')) { console.error('3.48 better preview missing'); ok = false; }
if (!game.includes('requestClearEquipUndoStack') || !game.includes('undo-confirm') || !game.includes('Yes, clear')) { console.error('3.49 clear confirm missing'); ok = false; }
if (!css.includes('toast-undo-confirm') || !css.includes('toast-undo-confirm-yes')) { console.error('3.49 CSS missing'); ok = false; }
if (!audio.includes('duckAmbienceForVoice') || !audio.includes('ambienceEffectiveMul')) { console.error('3.49 voice duck missing'); ok = false; }
if (!game.includes('spawnPipeClearJuice') || !game.includes('_pCap * 0.7')) { console.error('3.50 game features missing'); ok = false; }
if (!css.includes('btn-play-milestone') || !css.includes('play-milestone-splash')) { console.error('3.50 CSS missing'); ok = false; }
if (!html.includes('3.50')) { console.error('3.50 changelog/guide missing'); ok = false; }
if (!game.includes('maybePlayShimmer') || !game.includes('PLAY_SPLASH_DAY_KEY') || !game.includes('pipeClear')) { console.error('3.51 game features missing'); ok = false; }
if (!audio.includes('pipeClear') || !audio.includes('function pipeClear')) { console.error('3.51 pipeClear SFX missing'); ok = false; }
if (!html.includes('3.51')) { console.error('3.51 changelog/guide missing'); ok = false; }
if (!audio.includes('_pipeClearLastAt') || !audio.includes('comboMul') || !audio.includes('voiceDuckUntil')) { console.error('3.52 pipeClear mix missing'); ok = false; }
if (!game.includes('document.hidden') || !game.includes('maybePlayShimmer._lastTry') || !game.includes('pipeClear({ combo')) { console.error('3.52 shimmer/mix wiring missing'); ok = false; }
if (!html.includes('3.52')) { console.error('3.52 changelog/guide missing'); ok = false; }
if (!game.includes('clearPlayShimmer') || !game.includes('juiceKind') || !game.includes('visibilitychange')) { console.error('3.53 bugfix/juice missing'); ok = false; }
if (!audio.includes('respect mute mid-blip') && !audio.includes('if (muted) return; // 3.53')) { console.error('3.53 pipeClear mute fix missing'); ok = false; }
if (!html.includes('3.53')) { console.error('3.53 changelog/guide missing'); ok = false; }
if (!game.includes('kind: juiceKind')) { console.error('3.54 juice/wiring missing'); ok = false; }
if (!audio.includes("kind === 'close'") || !audio.includes('f0')) { console.error('3.54 CLOSE SFX mix missing'); ok = false; }
if (!html.includes('3.54')) { console.error('3.54 changelog/guide missing'); ok = false; }
if (!game.includes('squashTarget >= 0.9') || !game.includes('!p._wasNearMiss') || !game.includes('si < n')) { console.error('3.55 features missing'); ok = false; }
if (!html.includes('3.55')) { console.error('3.55 changelog/guide missing'); ok = false; }
if (!game.includes('_lastPerfectToastAt') || !game.includes('var cap = particleBudget')) { console.error('3.56 features missing'); ok = false; }
if (!html.includes('3.56')) { console.error('3.56 changelog/guide missing'); ok = false; }
if (!game.includes('_lastPerfectHapticAt') || !game.includes('railN') || !game.includes('camKickZoom = 0.012')) { console.error('3.57 features missing'); ok = false; }
if (!html.includes('3.57')) { console.error('3.57 changelog/guide missing'); ok = false; }
if (!game.includes('_lastPerfectVoiceAt') || !game.includes('nStar') || !game.includes('combo >= 8) life')) { console.error('3.58 features missing'); ok = false; }
if (!html.includes('3.58')) { console.error('3.58 changelog/guide missing'); ok = false; }
if (!css.includes('menu-tools') || !css.includes('gift-progress') || !css.includes('toast-close')) { console.error('3.6 polish CSS missing'); ok = false; }
if (!html.includes('gift-progress') || !html.includes('menu-tools')) { console.error('3.6 polish HTML missing'); ok = false; }
// Ensure post-death rarity auto-open path is gone (no Duplicate → Fragments in openMysteryBox flow)
if (game.includes("text = 'Duplicate → +'")) { console.error('legacy duplicate fragment popup text still present'); ok = false; }
if (ok) console.log('SMOKE OK · Urr Jaa! 3.58.5-urrjaa · MAGIC 🪄');
else { console.error('SMOKE FAIL'); process.exit(1); }
