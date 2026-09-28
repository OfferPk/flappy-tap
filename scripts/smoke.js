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
  '3.3.0', 'squashTarget', 'voiceCue',
  'PERFECT!', 'DANGER', 'coinComboMult', 'grantMysteryReward', 'birdPass',
  'runPerfects', 'bossActive', 'effectiveWeather',
  'LUCKY!', 'isForgivingMode', 'firstRunProtect', 'calibMods', 'applyLuckySave', 'resolveCollision'
];
for (const n of need) {
  if (!game.includes(n)) { console.error('MISSING in game.js:', n); ok = false; }
}
const storage = fs.readFileSync(path.join(root, 'js/storage.js'), 'utf8');
for (const n of ['coins50', 'dodge20', 'nearmiss3', 'score100', 'addFragments', 'rollBoxRarity', 'albumCompletionPct', 'pushRunDuration', 'getAvgRunDuration']) {
  if (!storage.includes(n)) { console.error('MISSING in storage.js:', n); ok = false; }
}
const audio = fs.readFileSync(path.join(root, 'js/audio.js'), 'utf8');
for (const n of ['voiceTone', 'setVoicePack', 'isVoicePack', 'Desi voice']) {
  if (!audio.includes(n) && n !== 'Desi voice') { console.error('MISSING in audio.js:', n); ok = false; }
}
if (!audio.includes('independent') && !audio.includes('Independent') && !audio.includes('voiceOn only')) {
  /* soft */
}
const skins = fs.readFileSync(path.join(root, 'js/skins.js'), 'utf8');
for (const n of ['BIRD_PASSIVES', 'weatherMods', 'sunset', 'pickBossKind']) {
  if (!skins.includes(n)) { console.error('MISSING in skins.js:', n); ok = false; }
}
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
if (!sw.includes('urrjaa-v8-20260928')) { console.error('SW cache not bumped'); ok = false; }
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
if (pkg.version !== '3.3.0-urrjaa') { console.error('package version', pkg.version); ok = false; }
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
if (!html.includes('v3.3.0-urrjaa')) { console.error('index version tag missing'); ok = false; }
if (!html.includes('data-mode="timeattack"')) { console.error('modes missing'); ok = false; }
if (!html.includes('run-summary')) { console.error('run summary missing'); ok = false; }
if (ok) console.log('SMOKE OK · Urr Jaa! 3.3.0-urrjaa');
else { console.error('SMOKE FAIL'); process.exit(1); }
