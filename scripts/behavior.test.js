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

  assert.equal(sim.softenCoinComboOnMiss(5), 4, 'a missed coin steps a combo down one level');
  assert.equal(sim.softenCoinComboOnMiss(2), 1);
  assert.equal(sim.softenCoinComboOnMiss(1), 0);
  assert.equal(sim.softenCoinComboOnMiss(0), 0);

  assert.equal(sim.isRelaxMode('relax'), true, 'only the new opt-in mode uses Relax rules');
  for (const mode of ['classic', 'timeattack', 'hard', 'nocoin', 'challenge', 'onelife', 'daily', 'practice']) {
    assert.equal(sim.isRelaxMode(mode), false, mode + ' retains its existing rules');
  }
  assert.equal(sim.normalizeRelaxDuration('60'), 60);
  assert.equal(sim.normalizeRelaxDuration('180'), 180);
  assert.equal(sim.normalizeRelaxDuration('300'), 300);
  assert.equal(sim.normalizeRelaxDuration('999'), 180, 'invalid duration falls back to three minutes');
  assert.deepEqual(sim.relaxBumpResponse('ground', 540, 14, 260, 600, 72), { y: 512, vy: -70 });
  assert.deepEqual(sim.relaxBumpResponse('ceiling', 4, 14, -260, 600, 72), { y: 16, vy: 70 });
  assert.deepEqual(sim.relaxBumpResponse('pipe', 300, 14, 300, 600, 72), { y: 300, vy: 110 });

  const dailySequence = (date) => {
    const rng = sim.makeRng(sim.hashSeed('urrjaa-daily-' + date + '-stage-1'));
    return [rng(), rng()];
  };
  assert.deepEqual(dailySequence('2026-09-29'), dailySequence('2026-09-29'), 'same Daily seed reproduces its initial RNG sequence');
  assert.notDeepEqual(dailySequence('2026-09-29'), dailySequence('2026-09-30'), 'a new local date changes the Daily sequence');
  const magicStart = sim.magicCountdownState(1000, 1000, 10000, 7000);
  assert.deepEqual(magicStart, { active: true, remaining: 10, automatic: true, warning: false });
  assert.equal(sim.magicCountdownState(7999, 1000, 10000, 7000).remaining, 4, 'the first seven seconds remain in autopilot');
  const handoff = sim.magicCountdownState(8000, 1000, 10000, 7000);
  assert.deepEqual(handoff, { active: true, remaining: 3, automatic: false, warning: true }, 'control returns as the red final-three-second warning begins');
  assert.equal(sim.magicCountdownState(10999, 1000, 10000, 7000).remaining, 1);
  assert.equal(sim.magicCountdownState(11000, 1000, 10000, 7000).active, false, 'MAGIC ends at ten seconds');
  const pausedMagic = sim.magicCountdownState(63000, 61000, 10000, 7000);
  assert.equal(pausedMagic.remaining, 8, 'shifting the start by paused time preserves remaining seconds on resume');
  let flightY = 100;
  for (let i = 0; i < 60; i++) flightY = sim.magicFlightStep(flightY, 300, 1 / 60, 24, 520);
  assert.ok(flightY >= 290 && flightY <= 300, 'smooth autopilot converges to the next gap center');
  assert.equal(sim.magicFlightStep(100, 500, 0.05, 24, 200), 117, 'autopilot movement is speed-limited and stays within the safe flight bounds');

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

function testPowerIndicators() {
  const effects = sim.activePowerIndicators(1000, {
    shieldActive: true,
    slowMoUntil: 4000,
    magnetUntil: 5000,
    turboUntil: 1000,
    ghostUntil: 2200
  });
  assert.deepEqual(effects.map((item) => item.id), ['shield', 'slowmo', 'magnet', 'ghost'],
    'all active effects render together; a timer at its deadline is already absent');
  assert.equal(effects[0].text, '🛡 Shield · 1 hit', 'Shield keeps its existing one-hit gameplay rather than gaining a new timer');
  assert.equal(effects[0].remainingSeconds, null);
  assert.match(effects[1].text, /3s$/, 'timed chip displays ceiling-rounded seconds');
  assert.equal(effects[1].remainingSeconds, 3);
  assert.equal(effects[3].remainingSeconds, 2);
  assert.equal(effects[3].expiring, true, 'last 1.2 seconds receive a distinct expiring state');
  assert.match(effects[3].ariaLabel, /2 seconds remaining/, 'timer has an accessible descriptive label');

  const afterExpiry = sim.activePowerIndicators(4000, {
    shieldActive: true,
    slowMoUntil: 4000,
    magnetUntil: 3999,
    turboUntil: 0,
    ghostUntil: 1000
  });
  assert.deepEqual(afterExpiry.map((item) => item.id), ['shield'],
    'timed chips disappear at/after expiry while the one-hit Shield lasts until consumed');
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
    const testSource = source.replace('global.FTStorage = {', 'global.FTStorage = { __testClaimMagicAdReward: claimMagicAdReward,');
    assert.notEqual(testSource, source, 'test-only MAGIC ad grant hook is injected only by the test harness');
    vm.runInNewContext(testSource, context, { filename: 'js/storage.js (test harness)' });
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
  storage.unlockBird('owl');
  storage.setBird('owl');
  const progressBeforeMascot = {
    bird: storage.getBird(),
    birds: JSON.stringify(storage.getUnlockedBirds()),
    coins: storage.getCoins(),
    best: storage.getBest(),
    albumBirds: storage.collectionCounts().birds
  };
  assert.equal(storage.getMascotSelection(), '', 'the old equipped-bird appearance remains the default');
  assert.equal(storage.BIRDS.moonwink, undefined, 'visual concepts are not added to owned bird species');
  assert.equal(storage.isBirdUnlocked('moonwink'), false, 'new looks do not rewrite bird unlock ownership');
  assert.equal(storage.setMascotSelection('moonwink'), 'moonwink');
  assert.equal(storage.getMascotSelection(), 'moonwink');
  storage = loadStorage();
  assert.equal(storage.getMascotSelection(), 'moonwink', 'visual preference persists on this device');
  assert.equal(storage.getBird(), progressBeforeMascot.bird, 'visual preference leaves the equipped bird untouched');
  assert.equal(JSON.stringify(storage.collectionCounts().birds), JSON.stringify(progressBeforeMascot.albumBirds), 'visual preference leaves album totals untouched');
  assert.equal(storage.setMascotSelection('not-a-mascot'), false, 'unknown mascot ids are rejected');
  assert.equal(storage.getMascotSelection(), 'moonwink', 'invalid choice does not clear the prior visual preference');
  assert.equal(storage.setMascotSelection('equipped'), '', 'Use equipped bird only clears the visual preference');
  assert.equal(storage.getMascotSelection(), '');
  assert.equal(storage.getBird(), progressBeforeMascot.bird);
  assert.equal(JSON.stringify(storage.getUnlockedBirds()), progressBeforeMascot.birds);
  assert.equal(storage.getCoins(), progressBeforeMascot.coins);
  assert.equal(storage.getBest(), progressBeforeMascot.best);
  assert.equal(JSON.stringify(storage.collectionCounts().birds), JSON.stringify(progressBeforeMascot.albumBirds));
  assert.equal(storage.spendCoins(10), true);
  assert.equal(storage.getCoins(), 15);
  assert.equal(storage.spendCoins(99), false, 'cannot spend more coins than saved');
  assert.equal(storage.getCoins(), 15, 'failed purchase leaves saved coins unchanged');

  const day1 = new Date(2026, 8, 29, 12, 0, 0);
  const day2 = new Date(2026, 8, 30, 12, 0, 0);
  const daily = storage.claimDailyMagic(day1);
  assert.equal(daily.claimed, true);
  assert.equal(storage.getMagicCount(), 1, 'first local calendar-day claim grants exactly one saved MAGIC');
  assert.equal(storage.claimDailyMagic(day1).claimed, false, 'daily claim is idempotent within the same local date');
  assert.equal(storage.claimDailyMagic(day2).count, 2, 'the next local date adds one MAGIC without overwriting the saved item');
  assert.equal(storage.claimDailyMagic(new Date(2026, 8, 30, 18, 0, 0)).claimed, false, 'reopening on the same next-day date does not duplicate the reward');
  assert.equal(storage.consumeMagic(), true);
  assert.equal(storage.getMagicCount(), 1, 'activation consumes exactly one item');
  assert.equal(storage.consumeMagic(), true);
  assert.equal(storage.getMagicCount(), 0, 'the second saved MAGIC is independently consumable');
  assert.equal(storage.consumeMagic(), false, 'empty inventory cannot be consumed');
  const adTime = 1000000;
  const firstAd = storage.__testClaimMagicAdReward(adTime, day1);
  assert.equal(firstAd.adCount, 1);
  assert.equal(storage.getMagicCount(), 1, 'a rewarded ad adds exactly one item');
  assert.equal(storage.getMagicAdStatus(adTime + 10 * 60 * 60 * 1000 - 1, day1).eligible, false, 'the ad cooldown blocks just-before ten hours');
  assert.equal(storage.getMagicAdStatus(adTime + 10 * 60 * 60 * 1000, day1).eligible, true, 'the next ad unlocks at ten hours exactly');
  const secondAd = storage.__testClaimMagicAdReward(adTime + 10 * 60 * 60 * 1000, day1);
  assert.equal(secondAd.adCount, 2);
  assert.equal(storage.__testClaimMagicAdReward(adTime + 20 * 60 * 60 * 1000, day1), null, 'the daily ad cap blocks any third reward');
  assert.equal(storage.getMagicAdStatus(adTime + 20 * 60 * 60 * 1000, day1).eligible, false);
  storage = loadStorage();
  assert.equal(storage.getMagicCount(), 2, 'MAGIC inventory survives a fresh storage module instance');
  assert.equal(storage.isDailyMagicClaimed(day2), true, 'the latest daily claim date persists locally');
  assert.equal(storage.getMagicAdStatus(adTime + 20 * 60 * 60 * 1000, day1).count, 2, 'ad count persists locally');
  assert.equal(storage.claimMagicAdReward, undefined, 'production storage exposes no user-callable ad grant path');

  const exported = JSON.parse(JSON.stringify(storage.exportProgress()));
  assert.equal(exported.format, 'flappy-tap-progress', 'backup has an explicit format identifier');
  assert.equal(exported.version, 1, 'backup carries a schema version');
  assert.equal(exported.data.coins, '15', 'backup exports a recognized local progress value');
  assert.equal(exported.data.best, '12', 'backup exports saved scores');
  storage.addCoins(100);
  const validImport = storage.importProgress(exported);
  assert.equal(validImport.ok, true, 'valid backup restores whitelisted fields');
  assert.equal(validImport.imported, Object.keys(exported.data).length);
  assert.equal(storage.getCoins(), 15, 'import replaces the coin value from backup');
  assert.equal(storage.getBest(), 12, 'import restores the saved best');
  const beforeInvalidImport = Array.from(values.entries());
  const invalidCoin = JSON.parse(JSON.stringify(exported));
  invalidCoin.data.best = '900';
  invalidCoin.data.coins = '-1';
  assert.equal(storage.importProgress(invalidCoin).ok, false, 'negative currency fails strict validation');
  assert.deepEqual(Array.from(values.entries()), beforeInvalidImport, 'invalid backup makes no partial writes');
  const futureVersion = Object.assign({}, exported, { version: 2 });
  assert.equal(storage.importProgress(futureVersion).ok, false, 'unsupported future versions are rejected');
  const futureCooldown = JSON.parse(JSON.stringify(exported));
  futureCooldown.data.magicLastAdAt = String(Date.now() + 365 * 24 * 60 * 60 * 1000);
  assert.equal(storage.importProgress(futureCooldown).ok, false, 'implausible future cooldown timestamps are rejected');
  const unknownKey = Object.assign({}, exported, { data: Object.assign({}, exported.data, { admin: '1' }) });
  assert.equal(storage.importProgress(unknownKey).ok, false, 'unknown keys are rejected');
  const inheritedBirdId = JSON.parse(JSON.stringify(exported));
  inheritedBirdId.data.unlockedBirds = 'constructor';
  assert.equal(storage.importProgress(inheritedBirdId).ok, false, 'inherited object properties are not accepted as unlocked bird IDs');
  const inheritedCollectionKind = JSON.parse(JSON.stringify(exported));
  inheritedCollectionKind.data.collection = '{"__proto__":{}}';
  assert.equal(storage.importProgress(inheritedCollectionKind).ok, false, 'prototype names are not accepted as collection kinds');
  const inheritedRunMode = JSON.parse(JSON.stringify(exported));
  inheritedRunMode.data.topRuns = JSON.stringify([{ score: 1, mode: 'constructor', date: exported.exportedAt.slice(0, 10), perfects: 0, combo: 0 }]);
  assert.equal(storage.importProgress(inheritedRunMode).ok, false, 'inherited object properties are not accepted as run modes');
  assert.deepEqual(Array.from(values.entries()), beforeInvalidImport, 'prototype-derived values do not write or mutate saved progress');
  const emptyBackup = Object.assign({}, exported, { data: {} });
  assert.equal(storage.importProgress(emptyBackup).ok, false, 'empty backups cannot overwrite state');
}

function testProgressBackupRollback() {
  const values = new Map([['flappy-tap:best', '4'], ['flappy-tap:coins', '9']]);
  let writeCount = 0;
  const localStorage = {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) {
      writeCount += 1;
      if (writeCount === 2) throw new Error('quota');
      values.set(String(key), String(value));
    },
    removeItem(key) { values.delete(key); }
  };
  const context = { window: {}, localStorage, Date, Math, Object, Array, String, Number, parseInt, isFinite, Set };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'js/storage.js'), 'utf8'), context, { filename: 'js/storage.js (rollback test)' });
  const bundle = { format: 'flappy-tap-progress', version: 1, exportedAt: new Date().toISOString(), data: { best: '44', coins: '99' } };
  const failedImport = context.window.FTStorage.importProgress(bundle);
  assert.equal(failedImport.ok, false, 'storage failure is reported');
  assert.equal(failedImport.error, 'storage-unavailable');
  assert.equal(values.get('flappy-tap:best'), '4', 'a failed import rolls back values already written');
  assert.equal(values.get('flappy-tap:coins'), '9', 'a failed import preserves the failing key value');
}

function serviceWorkerHarness(fetchImpl, seededCache, seededCacheNames) {
  const listeners = Object.create(null);
  const cacheData = new Map(seededCache || []);
  const cacheNames = seededCacheNames || [];
  const deletedCacheNames = [];
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
    async keys() { return cacheNames.slice(); },
    async delete(key) { deletedCacheNames.push(key); return true; }
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
    async activate() {
      let activationPromise;
      listeners.activate({ waitUntil(promise) { activationPromise = promise; } });
      await activationPromise;
      return deletedCacheNames.slice();
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
  assert.equal(cached.body, 'cached game code', 'a precached game script remains available');

  const namespacedWorker = serviceWorkerHarness(networkDown, [], ['urrjaa-v78-20260930', 'another-app-cache', 'urrjaa-v79-20260930', 'urrjaa-v80-20260930', 'urrjaa-v81-20260930', 'urrjaa-v82-20260930', 'urrjaa-v83-20260930', 'urrjaa-v84-20260930', 'urrjaa-v85-20260930', 'urrjaa-v86-20260930', 'urrjaa-v87-20260930', 'urrjaa-v88-20260930', 'urrjaa-v89-20260930']);
  assert.deepEqual(await namespacedWorker.activate(), ['urrjaa-v78-20260930', 'urrjaa-v79-20260930', 'urrjaa-v80-20260930', 'urrjaa-v81-20260930', 'urrjaa-v82-20260930', 'urrjaa-v83-20260930', 'urrjaa-v84-20260930', 'urrjaa-v85-20260930', 'urrjaa-v86-20260930', 'urrjaa-v87-20260930', 'urrjaa-v88-20260930'], 'activation deletes this app’s old named caches and preserves unrelated/current caches');
}

async function testMagicAdsUnavailableWithoutSdk() {
  const context = { window: {}, Promise };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'js/ads.js'), 'utf8'), context, { filename: 'js/ads.js' });
  assert.equal(context.window.Ads.isMagicRewardAvailable(), false, 'no SDK means no user-reachable MAGIC ad reward');
  const result = await context.window.Ads.showMagicReward();
  assert.equal(result.rewarded, false);
  assert.equal(result.reason, 'no-plugin');
  const genericMagic = await context.window.Ads.showRewarded('magic');
  assert.equal(genericMagic.rewarded, false, 'the generic stub cannot grant MAGIC either');
  assert.equal(context.window.Ads.isDemoMode(), false, 'demo rewards are disabled without an explicit local demo URL');
  const productionStub = await context.window.Ads.showRewarded('continue');
  assert.equal(productionStub.rewarded, false, 'a deployed/default build cannot grant a simulated revive');
  assert.equal(productionStub.reason, 'demo-disabled');
  const remoteDemo = { window: { location: { hostname: 'game.example', search: '?demoAds=1' } }, Promise };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'js/ads.js'), 'utf8'), remoteDemo, { filename: 'js/ads.js (remote demo guard)' });
  assert.equal(remoteDemo.window.Ads.isDemoMode(), false, 'the demo query flag never enables rewards on a remote host');
  const localDemo = { window: { location: { hostname: 'localhost', search: '?demoAds=1' } }, Promise };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'js/ads.js'), 'utf8'), localDemo, { filename: 'js/ads.js (local demo)' });
  assert.equal(localDemo.window.Ads.isDemoMode(), true, 'explicit demo mode can be used on localhost only');
}

async function testMysteryRewardSingleFlight() {
  const source = fs.readFileSync(path.join(root, 'js/game.js'), 'utf8');
  const handler = source.match(/if \(btnMysteryAd\) btnMysteryAd\.addEventListener\('click', async function \(\) \{[\s\S]*?\n  \}\);/);
  assert.ok(handler, 'the mystery gift button handler is present for the in-flight regression');
  let requests = 0;
  let grantReward;
  let grants = 0;
  const button = { disabled: false, textContent: 'DEMO · Simulate +1 gift', addEventListener(event, callback) { this.clickHandler = callback; } };
  const context = {
    Ads: { isDemoMode: () => true, showRewarded: () => { requests++; return new Promise((resolve) => { grantReward = resolve; }); } },
    mysteryAdUsed: false, mysteryAdInFlight: false, state: 'dead', btnMysteryAd: button,
    grantMysteryReward: () => { grants++; }, runGiftsEl: { textContent: '+0' }, showToast: () => {}, Math
  };
  vm.runInNewContext(handler[0], context, { filename: 'mystery gift handler (single-flight test)' });
  const first = button.clickHandler();
  const duplicate = button.clickHandler();
  assert.equal(requests, 1, 'a repeated click cannot open a second reward prompt while one is pending');
  assert.equal(button.disabled, true, 'the reward button disables while the prompt is pending');
  grantReward({ rewarded: true });
  await Promise.all([first, duplicate]);
  assert.equal(grants, 1, 'one confirmed prompt grants exactly one mystery reward');
  assert.equal(context.mysteryAdUsed, true, 'a successful reward remains limited to once per run');
  assert.equal(context.mysteryAdInFlight, false, 'the in-flight lock clears after completion');
  assert.equal(button.disabled, true, 'the already-claimed reward button remains disabled');
  assert.equal(runGiftsText(context), '+1', 'the visible gift count increments only once');

  let skippedToast = '';
  const skipButton = { disabled: false, textContent: '', addEventListener(event, callback) { this.clickHandler = callback; } };
  const skipContext = {
    Ads: { isDemoMode: () => true, showRewarded: async () => ({ rewarded: false }) },
    mysteryAdUsed: false, mysteryAdInFlight: false, state: 'dead', btnMysteryAd: skipButton,
    grantMysteryReward: () => { throw new Error('a skipped reward must not grant'); }, runGiftsEl: { textContent: '+0' },
    showToast: (message) => { skippedToast = message; }, Math
  };
  vm.runInNewContext(handler[0], skipContext, { filename: 'mystery gift handler (skip test)' });
  await skipButton.clickHandler();
  assert.equal(skipContext.mysteryAdInFlight, false, 'skipping releases the in-flight lock');
  assert.equal(skipButton.disabled, false, 'skipping re-enables the demo reward button');
  assert.equal(skippedToast, 'Gift skipped', 'skipping keeps the existing feedback');
}

function runGiftsText(context) {
  return context.runGiftsEl.textContent;
}

async function main() {
  testGameplayRules();
  testPowerIndicators();
  testSavedProgress();
  testProgressBackupRollback();
  await testMysteryRewardSingleFlight();
  await testMagicAdsUnavailableWithoutSdk();
  await testOfflineAssetFallback();

  const game = fs.readFileSync(path.join(root, 'js/game.js'), 'utf8');
  assert.match(game, /FTSim\.scorePipePass\(/, 'live pipe scoring is wired to the tested pure rules');
  assert.match(game, /FTSim\.softenCoinComboOnMiss\(/, 'missed coins use the forgiving rule');
  assert.match(game, /FTSim\.isRelaxMode\(playMode\)/, 'only the separately selected Relax mode activates its special rules');
  assert.match(game, /FTSim\.relaxBumpResponse\(/, 'Relax collisions use the tested non-lethal response');
  assert.match(game, /if \(isRelax\(\)\) return;/, 'Relax suppresses optional competitive pickups and scoring');
  assert.match(game, /FTSim\.rectanglesOverlap\(/, 'live collision geometry is wired to the tested pure rules');
  assert.match(game, /FTSim\.canTransition\(/, 'live run controls use the tested transition rules');
  assert.match(game, /FTSim\.activePowerIndicators\(/, 'live HUD consumes the tested active effect list');
  assert.match(game, /FTSim\.magicFlightStep\(/, 'MAGIC autopilot uses the bounded deterministic steering helper');
  assert.match(game, /for \(var i = 0; i < pipes\.length && !isMagicActive\(\); i\+\+\)/, 'MAGIC pipe immunity is scoped to the pipe collision loop');
  assert.match(game, /for \(var j = 0; j < traffic\.length && !isMagicActive\(\); j\+\+\)/, 'MAGIC safe flight also passes traffic obstacles without a lethal collision');
  assert.match(game, /magicStartedAt \+= Math\.max\(0, performance\.now\(\) - magicPauseAt\)/, 'MAGIC countdown shifts by paused duration on resume');
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.match(html, /id="power-hud" hidden role="group" aria-label="Active effects" aria-live="off"/,
    'indicators are exposed in a labeled, non-spamming screen-reader group');
  assert.match(html, /id="btn-magic-action" class="magic-game-button" type="button" disabled/, 'gameplay MAGIC control starts disabled until inventory is available');
  assert.match(html, /id="screen-magic"[^>]*hidden/, 'MAGIC menu is a separate screen');
  assert.match(html, /name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"/, 'viewport remains user-zoomable');
  assert.match(html, /id="game-announcer" class="sr-only" role="status" aria-live="polite" aria-atomic="true"/, 'important game events have a dedicated polite live region');
  assert.match(html, /id="btn-export-progress"/, 'settings expose a progress backup export action');
  assert.match(html, /id="btn-import-progress"/, 'settings expose a progress backup import action');
  assert.match(html, /id="btn-continue"[^>]*hidden/, 'demo revive starts hidden outside the explicit local demo');
  assert.match(html, /id="magic-ad-action-group" hidden/, 'MAGIC ad controls start hidden until a real ad provider exists');
  assert.doesNotMatch(fs.readFileSync(path.join(root, 'js/game.js'), 'utf8'), /preventDoubleTapZoom|gesturestart|gesturechange/,
    'game scripts no longer cancel user zoom gestures');
  const css = fs.readFileSync(path.join(root, 'css/style.css'), 'utf8');
  assert.match(css, /#game, canvas\s*\{\s*touch-action:\s*manipulation;/, 'canvas tap input preserves browser pinch zoom');
  assert.match(css, /#power-hud\[hidden\]\s*\{\s*display:\s*none\s*!important;/,
    'inactive indicator row is explicitly hidden despite flex layout');
  console.log('BEHAVIOR TESTS OK · gameplay · timer display/expiry/multiple effects · local saves · offline assets');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
