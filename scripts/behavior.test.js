#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const sim = require('../js/sim.js');

function testGameplayRules() {
  assert.equal(sim.rectanglesOverlap(0, 0, 10, 10, 9, 9, 5, 5), true, 'overlapping hitboxes collide');
  assert.equal(sim.rectanglesOverlap(0, 0, 10, 10, 10, 0, 5, 5), false, 'touching edges are not overlap');
  assert.equal(sim.rectanglesOverlap(0, 0, 10, 10, 0, 10, 5, 5), false, 'touching horizontal edges are not overlap');

  assert.deepEqual(sim.scorePipePass({ distanceFromCenter: 30, perfectCenterPx: 10, multiplier: 1 }), {
    perfect: false, basePoints: 1, multiplier: 1, gained: 1, tag: ''
  }, 'ordinary pipe pass scores one point');
  assert.deepEqual(sim.scorePipePass({ distanceFromCenter: 4, perfectCenterPx: 10, multiplier: 2 }), {
    perfect: true, basePoints: 3, multiplier: 2, gained: 6, tag: 'PERFECT!'
  }, 'center pass uses the existing +3 award and combo multiplier');
  assert.deepEqual(sim.scorePipePass({ distanceFromCenter: 25, perfectCenterPx: 10, multiplier: 2, nearMiss: true, nearMissBonus: 1 }), {
    perfect: false, basePoints: 6, multiplier: 2, gained: 12, tag: 'CLOSE +5'
  }, 'near miss pass retains +5 and bonus before combo multiplier');
  assert.deepEqual(sim.scorePipePass({ distanceFromCenter: 0, perfectCenterPx: 10, multiplier: 1, nearMiss: true }), {
    perfect: true, basePoints: 5, multiplier: 1, gained: 5, tag: 'PERFECT!'
  }, 'a simultaneous near miss keeps the higher existing base award');

  const dailySequence = (date) => {
    const rng = sim.makeRng(sim.hashSeed('urrjaa-daily-' + date + '-stage-1'));
    return [rng(), rng()];
  };
  assert.deepEqual(dailySequence('2026-09-29'), dailySequence('2026-09-29'), 'same Daily seed reproduces its initial RNG sequence');
  assert.notDeepEqual(dailySequence('2026-09-29'), dailySequence('2026-09-30'), 'a new local date changes the Daily sequence');

  assert.equal(sim.canTransition('playing', 'pause', 'daily'), true);
  assert.equal(sim.canTransition('paused', 'pause', 'daily'), false);
  assert.equal(sim.canTransition('paused', 'resume', 'daily'), true);
  assert.equal(sim.canTransition('playing', 'resume', 'daily'), false);
  assert.equal(sim.canTransition('dead', 'retry', 'daily'), true);
  assert.equal(sim.canTransition('dead', 'retry', 'onelife'), false, 'One Life has no retry');
  assert.equal(sim.canTransition('dead', 'continue', 'daily'), true);
  assert.equal(sim.canTransition('dead', 'continue', 'timeattack'), false);
  assert.equal(sim.canTransition('menu', 'start', 'classic'), true);
  assert.equal(sim.canTransition('playing', 'start', 'classic'), false);
}

function testSavedProgress() {
  const values = new Map();
  const localStorage = {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(String(key), String(value)); },
    removeItem(key) { values.delete(String(key)); }
  };
  const source = fs.readFileSync(path.join(root, 'js/storage.js'), 'utf8');
  function loadStorage() {
    const context = { window: {}, localStorage, Date, Math, Object, Array, String, Number, parseInt, isFinite };
    vm.runInNewContext(source, context, { filename: 'js/storage.js' });
    return context.window.FTStorage;
  }
  let storage = loadStorage();
  assert.equal(storage.getBest(), 0);
  assert.equal(storage.setBest(12), 12);
  assert.equal(storage.setBest(7), 12, 'saved all-time best never decreases');
  assert.equal(storage.setDailyBest(9), 9);
  assert.equal(storage.setDailyBest(3), 9, 'same-day Daily best never decreases');
  storage.addCoins(25);
  assert.equal(storage.getCoins(), 25);

  storage = loadStorage();
  assert.equal(storage.getBest(), 12, 'best score survives a fresh storage module instance');
  assert.equal(storage.getDailyBest(), 9, 'Daily best survives a fresh storage module instance');
  assert.equal(storage.getCoins(), 25, 'coins survive a fresh storage module instance');
  assert.equal(storage.spendCoins(10), true);
  assert.equal(storage.getCoins(), 15);
  assert.equal(storage.spendCoins(99), false, 'cannot spend more coins than saved');
  assert.equal(storage.getCoins(), 15, 'failed purchase leaves saved coins unchanged');
}

function serviceWorkerHarness(fetchImpl, seededCache) {
  const listeners = Object.create(null);
  const cacheData = new Map(seededCache || []);
  const appShell = { body: 'cached app shell', ok: true, clone() { return this; } };
  const caches = {
    async match(request) {
      if (request === './index.html') return appShell;
      const key = typeof request === 'string' ? request : request.url;
      return cacheData.get(key) || null;
    },
    async open() {
      return { async put(request, response) { cacheData.set(request.url, response); }, async addAll() {} };
    },
    async keys() { return []; },
    async delete() { return true; }
  };
  const self = {
    location: { origin: 'https://game.test', href: 'https://game.test/flappy-tap/sw.js' },
    clients: { async claim() {} },
    async skipWaiting() {},
    addEventListener(name, callback) { listeners[name] = callback; }
  };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'sw.js'), 'utf8'), { self, caches, fetch: fetchImpl, Promise, URL });
  return {
    async fetch(request) {
      let responsePromise;
      listeners.fetch({ request, respondWith(promise) { responsePromise = promise; } });
      assert.ok(responsePromise, 'GET request is handled by the service worker');
      return responsePromise;
    },
    cacheData
  };
}

async function testOfflineAssetFallback() {
  const networkDown = async () => { throw new Error('offline'); };
  const worker = serviceWorkerHarness(networkDown);
  await assert.rejects(worker.fetch({ method: 'GET', url: 'https://game.test/app/js/missing.js', mode: 'cors' }), /offline/,
    'offline JavaScript miss rejects instead of returning index.html');
  await assert.rejects(worker.fetch({ method: 'GET', url: 'https://game.test/app/icons/missing.png', mode: 'no-cors' }), /offline/,
    'offline image miss rejects instead of returning index.html');
  const navigation = await worker.fetch({ method: 'GET', url: 'https://game.test/app/deep-link', mode: 'navigate' });
  assert.equal(navigation.body, 'cached app shell', 'only an offline navigation receives the app shell fallback');

  const notFound = { ok: false, status: 404, body: 'not found', clone() { return this; } };
  const httpWorker = serviceWorkerHarness(async () => notFound);
  const response = await httpWorker.fetch({ method: 'GET', url: 'https://game.test/app/js/missing.js', mode: 'cors' });
  assert.equal(response.status, 404, 'HTTP asset errors remain HTTP errors, not the app shell');
  assert.equal(httpWorker.cacheData.size, 0, 'unsuccessful responses are not cached');

  const cachedScript = { body: 'cached game code' };
  const warmWorker = serviceWorkerHarness(networkDown, [['https://game.test/app/js/game.js', cachedScript]]);
  const cached = await warmWorker.fetch({ method: 'GET', url: 'https://game.test/app/js/game.js', mode: 'cors' });
  assert.equal(cached.body, 'cached game code', 'a precached offline game script remains available');
}

async function main() {
  testGameplayRules();
  testSavedProgress();
  await testOfflineAssetFallback();

  const game = fs.readFileSync(path.join(root, 'js/game.js'), 'utf8');
  assert.match(game, /FTSim\.scorePipePass\(/, 'live pipe scoring is wired to the tested pure rules');
  assert.match(game, /FTSim\.rectanglesOverlap\(/, 'live collision geometry is wired to the tested pure rules');
  assert.match(game, /FTSim\.canTransition\(/, 'live run controls use the tested transition rules');
  console.log('BEHAVIOR TESTS OK · collision · scoring · mode/pause/retry · local saves · offline assets');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
