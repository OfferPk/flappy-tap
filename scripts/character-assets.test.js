#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.join(__dirname, '..');
const manifestPath = path.join(root, 'assets/characters/manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const ids = ['sunseed', 'moonwink', 'riverflash', 'cinderwing', 'ticktock', 'zipzap'];
assert.equal(manifest.format, 'webp');
assert.deepEqual(manifest.sprites.map((sprite) => sprite.id), ids, 'all six approved mascots appear in manifest order');
const expectedPrecache = ['assets/characters/manifest.json', ...manifest.sprites.map((sprite) => sprite.src)];
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const precachePaths = Array.from(sw.matchAll(/'\.\/(assets\/characters\/[^']+)'/g), (match) => match[1]).sort();
assert.deepEqual(precachePaths, expectedPrecache.slice().sort(), 'precache list exactly covers manifest and every sprite');

let aggregateBytes = 0;
for (const sprite of manifest.sprites) {
  assert.match(sprite.src, /^assets\/characters\/[a-z]+\.webp$/, 'sprite is a local WebP path');
  assert.equal(sprite.width, 256);
  assert.equal(sprite.height, 256);
  const source = path.join(root, sprite.src);
  const bytes = fs.statSync(source).size;
  assert.equal(sprite.bytes, bytes, `${sprite.id} byte count matches manifest`);
  assert.ok(bytes <= 40 * 1024, `${sprite.id} stays below 40 KB`);
  aggregateBytes += bytes;
  for (const dir of ['www', 'docs']) {
    const generated = path.join(root, dir, sprite.src);
    assert.ok(fs.existsSync(generated), `${dir} contains ${sprite.src}`);
    assert.deepEqual(fs.readFileSync(generated), fs.readFileSync(source), `${dir} copy matches source`);
  }
}
assert.ok(aggregateBytes <= 200 * 1024, `six WebP sprites total no more than 200 KB (${aggregateBytes} bytes)`);
assert.equal(fs.readdirSync(path.dirname(manifestPath)).filter((name) => name.toLowerCase().endsWith('.png')).length, 0,
  'high-resolution PNG concepts are not bundled');
for (const dir of ['www', 'docs']) {
  assert.deepEqual(fs.readFileSync(path.join(root, dir, 'assets/characters/manifest.json')), fs.readFileSync(manifestPath), `${dir} manifest matches source`);
}

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const skins = fs.readFileSync(path.join(root, 'js/skins.js'), 'utf8');
const storage = fs.readFileSync(path.join(root, 'js/storage.js'), 'utf8');
for (const id of ids) {
  assert.ok(html.includes(`data-mascot-selection="${id}"`), `accessible selector includes ${id}`);
  assert.ok(skins.includes(`id: '${id}'`), `renderer includes ${id}`);
  assert.ok(storage.includes(`${id}: 1`), `visual-only storage allowlist includes ${id}`);
}
assert.match(storage, /mascotSelection: PREFIX \+ 'mascot-selection'/, 'appearance uses a distinct local key');
assert.match(html, /Use equipped bird/, 'legacy equipped bird remains selectable');
assert.match(html, /birds, unlocks, coins and stats are unchanged/, 'UI discloses no progress side effects');

const zip = path.join(root, 'dist/urr-jaa-web-windows.zip');
assert.ok(fs.existsSync(zip), 'Windows ZIP was built before asset checks');
const names = execFileSync('unzip', ['-Z1', zip], { encoding: 'utf8' }).split(/\r?\n/);
for (const file of expectedPrecache.slice(1)) {
  const entry = `urr-jaa-web/${file}`;
  assert.ok(names.includes(entry), `Windows ZIP contains ${file}`);
}
console.log(`CHARACTER ASSETS OK · ${ids.length} sprites · ${aggregateBytes} bytes · manifest/SW/www/docs/ZIP parity`);
