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
  '3.1.0', 'squashTarget', 'voiceCue'
];
for (const n of need) {
  if (!game.includes(n)) { console.error('MISSING in game.js:', n); ok = false; }
}
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
if (!sw.includes('urrjaa-v6-20260928')) { console.error('SW cache not bumped'); ok = false; }
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
if (pkg.version !== '3.1.0-urrjaa') { console.error('package version', pkg.version); ok = false; }
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
if (!html.includes('v3.1.0-urrjaa')) { console.error('index version tag missing'); ok = false; }
if (!html.includes('data-mode="timeattack"')) { console.error('modes missing'); ok = false; }
if (ok) console.log('SMOKE OK · Urr Jaa! 3.1.0-urrjaa');
else { console.error('SMOKE FAIL'); process.exit(1); }
