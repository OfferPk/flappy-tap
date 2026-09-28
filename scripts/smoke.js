#!/usr/bin/env node
/** Lightweight smoke: syntax + required globals / mode strings present. */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const files = ['js/storage.js', 'js/audio.js', 'js/ads.js', 'js/skins.js', 'js/game.js'];
let ok = true;
for (const f of files) {
  const src = fs.readFileSync(path.join(root, f), 'utf8');
  if (!src.trim()) { console.error('EMPTY', f); ok = false; }
}
const game = fs.readFileSync(path.join(root, 'js/game.js'), 'utf8');
const need = [
  'timeattack', 'nocoin', 'onelife', 'RISKY', 'CLOSE!', 'Ghost',
  'Turbo', 'magnet', 'claimStreak', 'getLeaderboards', 'pickTrafficKind',
  '3.5.0', 'squashTarget', 'voiceCue',
  'PERFECT!', 'DANGER', 'coinComboMult', 'grantMysteryReward', 'birdPass',
  'runPerfects', 'bossActive', 'effectiveWeather',
  'LUCKY!', 'isForgivingMode', 'firstRunProtect', 'calibMods', 'applyLuckySave', 'resolveCollision',
  'btn-voice-preview', "voiceCue('lucky')",
  'openGiftsScreen', 'doSpinOnce', 'doSpinAll', 'addGiftBoxes', 'spinWheelOnce',
  'animateWheelTo', 'Mystery Rewards', '📦 → Mystery Rewards',
  'voiceGiftCue', 'noteGiftAdd', 'maybeShowSpinUnlockPopup', 'setGuideLang', 'spin-unlock-overlay'
];
for (const n of need) {
  if (!game.includes(n)) { console.error('MISSING in game.js:', n); ok = false; }
}
const storage = fs.readFileSync(path.join(root, 'js/storage.js'), 'utf8');
for (const n of ['coins50', 'dodge20', 'nearmiss3', 'score100', 'addFragments', 'rollBoxRarity', 'albumCompletionPct', 'pushRunDuration', 'getAvgRunDuration', 'getGiftBoxes', 'spinWheelAll', 'WHEEL_REWARDS', 'GIFTS_PER_SPIN']) {
  if (!storage.includes(n)) { console.error('MISSING in storage.js:', n); ok = false; }
}
const audio = fs.readFileSync(path.join(root, 'js/audio.js'), 'utf8');
for (const n of ['voiceTone', 'setVoicePack', 'isVoicePack', 'speechSynthesis', 'speakPhrase', 'playChirpNotes', 'preview', 'SPEAK_TEXT', 'voiceGift', 'VOICE_POOLS', 'GLOBAL_VOICE_COOLDOWN_MS', 'zabardast', 'mil_gaya']) {
  if (!audio.includes(n)) { console.error('MISSING in audio.js:', n); ok = false; }
}
if (!audio.includes('independent') && !audio.includes('Independent') && !audio.includes('voiceOn only')) {
  console.error('MISSING voice independence note in audio.js');
  ok = false;
}
const skins = fs.readFileSync(path.join(root, 'js/skins.js'), 'utf8');
for (const n of ['BIRD_PASSIVES', 'weatherMods', 'sunset', 'pickBossKind']) {
  if (!skins.includes(n)) { console.error('MISSING in skins.js:', n); ok = false; }
}
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
if (!sw.includes('urrjaa-v12-20260928')) { console.error('SW cache not bumped'); ok = false; }
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
if (pkg.version !== '3.5.0-urrjaa') { console.error('package version', pkg.version); ok = false; }
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
if (!html.includes('v3.5.0-urrjaa')) { console.error('index version tag missing'); ok = false; }
if (!html.includes('data-mode="timeattack"')) { console.error('modes missing'); ok = false; }
if (!html.includes('run-summary')) { console.error('run summary missing'); ok = false; }
if (!html.includes('btn-voice-preview')) { console.error('voice preview btn missing'); ok = false; }
if (!html.includes('screen-gifts')) { console.error('gifts screen missing'); ok = false; }
if (!html.includes('btn-spin-once') || !html.includes('btn-spin-all')) { console.error('spin buttons missing'); ok = false; }
if (!html.includes('Mystery Rewards')) { console.error('Mystery Rewards title missing'); ok = false; }
if (!html.includes('spin-wheel') || !html.includes('wheel-hub')) { console.error('visual wheel missing'); ok = false; }
if (!html.includes('run-gifts')) { console.error('run gifts summary missing'); ok = false; }
if (!html.includes('screen-guide') || !html.includes('btn-guide')) { console.error('guide screen missing'); ok = false; }
if (!html.includes('data-guide-lang="ur"')) { console.error('urdu guide tab missing'); ok = false; }
if (!html.includes('spin-unlock-overlay')) { console.error('spin unlock popup missing'); ok = false; }
const css = fs.readFileSync(path.join(root, 'css/style.css'), 'utf8');
if (!css.includes('rim-pulse') || !css.includes('wheel-hub')) { console.error('wheel polish CSS missing'); ok = false; }
// Ensure post-death rarity auto-open path is gone (no Duplicate → Fragments in openMysteryBox flow)
if (game.includes("text = 'Duplicate → +'")) { console.error('legacy duplicate fragment popup text still present'); ok = false; }
if (ok) console.log('SMOKE OK · Urr Jaa! 3.5.0-urrjaa');
else { console.error('SMOKE FAIL'); process.exit(1); }
