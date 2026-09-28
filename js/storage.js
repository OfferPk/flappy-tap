/**
 * Urr Jaa! v3.5.1-urrjaa — localStorage: scores, coins, unlocks, seasonals, streak, missions, fragments, album, gift boxes, Mystery Rewards.
 * Offline only. Prefix kept flappy-tap: for save continuity.
 */
(function (global) {
  'use strict';

  const PREFIX = 'flappy-tap:';

  const KEYS = {
    best: PREFIX + 'best',
    skin: PREFIX + 'skin',
    bird: PREFIX + 'bird',
    vehicle: PREFIX + 'vehicle',
    env: PREFIX + 'env',
    weather: PREFIX + 'weather',
    hat: PREFIX + 'hat',
    trail: PREFIX + 'trail',
    mute: PREFIX + 'mute',
    runs: PREFIX + 'runs',
    medal: PREFIX + 'best-medal',
    dailyBest: PREFIX + 'daily-best',
    dailyDate: PREFIX + 'daily-date',
    sensitivity: PREFIX + 'sensitivity',
    reduceMotion: PREFIX + 'reduce-motion',
    haptics: PREFIX + 'haptics',
    unlockedSkins: PREFIX + 'unlocked-skins',
    coins: PREFIX + 'coins',
    unlockedBirds: PREFIX + 'unlocked-birds',
    unlockedVehicles: PREFIX + 'unlocked-vehicles',
    unlockedEnvs: PREFIX + 'unlocked-envs',
    unlockedHats: PREFIX + 'unlocked-hats',
    unlockedTrails: PREFIX + 'unlocked-trails',
    unlockedSeasonals: PREFIX + 'unlocked-seasonals',
    collection: PREFIX + 'collection',
    missionsDate: PREFIX + 'missions-date',
    missionsProgress: PREFIX + 'missions-progress',
    missionsClaimed: PREFIX + 'missions-claimed',
    metersBest: PREFIX + 'meters-best',
    cleanRuns: PREFIX + 'clean-runs',
    // v3.1
    bestCombo: PREFIX + 'best-combo',
    todayBest: PREFIX + 'today-best',
    todayBestDate: PREFIX + 'today-best-date',
    allTimeBest: PREFIX + 'all-time-best',
    streakDay: PREFIX + 'streak-day',
    streakDate: PREFIX + 'streak-date',
    streakClaimed: PREFIX + 'streak-claimed',
    oneLifeBest: PREFIX + 'one-life-best',
    oneLifeMedal: PREFIX + 'one-life-medal',
    timeAttackBest: PREFIX + 'time-attack-best',
    noCoinBest: PREFIX + 'nocoin-best',
    hardBest: PREFIX + 'hard-best',
    challengeStage: PREFIX + 'challenge-stage',
    voicePack: PREFIX + 'voice-pack',
    runDurations: PREFIX + 'run-durations',
    // v3.2
    missionsActive: PREFIX + 'missions-active',
    fragments: PREFIX + 'fragments',
    albumClaimed: PREFIX + 'album-claimed',
    bestPerfect: PREFIX + 'best-perfect',
    nearMissTotal: PREFIX + 'nearmiss-total',
    perfectTotal: PREFIX + 'perfect-total',
    // v3.4
    giftBoxes: PREFIX + 'gift-boxes'
  };

  const BIRDS = {
    sparrow: 1, parrot: 1, eagle: 1, chick: 1, owl: 1, funny: 1,
    mynah: 1, bulbul: 1, cheel: 1, mor: 1, kawwa: 1, kabootar: 1, hoopoe: 1, falcon: 1
  };
  const VEHICLES = {
    none: 1, rickshaw: 1, cycle: 1, bike: 1, scooty: 1, bicycle: 1,
    chingchi: 1, taxi: 1, bus: 1, mehran: 1, tractor: 1, truck: 1
  };
  const ENVS = {
    city: 1, lahore: 1, islamabad: 1, karachi: 1, murree: 1,
    village: 1, desert: 1, night: 1, bridge: 1, mountains: 1, rain: 1,
    canal: 1, hunza: 1, gwadar: 1, quetta: 1, monsoon: 1, oldcity: 1
  };
  const HATS = {
    none: 1, topi: 1, cap: 1, crown: 1,
    sunglasses: 1, hat: 1, helmet: 1, scarf: 1,
    ind_topi: 1, eid_sparkle: 1, winter_shawl: 1, basant_pagri: 1
  };
  const TRAILS = {
    none: 1, spark: 1, smoke: 1, stars: 1,
    fire: 1, star: 1, rainbow: 1,
    ind_trail: 1, eid_trail: 1, winter_trail: 1, basant_trail: 1
  };
  const SEASONALS = {
    independence: 1, eid: 1, winter: 1, basant: 1
  };
  const VALID_MEDALS = { bronze: 1, silver: 1, gold: 1, platinum: 1, legend: 1 };
  const LEGACY_SKIN = { bird: 'sparrow', bike: 'sparrow', rickshaw: 'sparrow', rocket: 'eagle' };

  function get(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v === null ? fallback : v;
    } catch (_) {
      return fallback;
    }
  }

  function set(key, value) {
    try {
      localStorage.setItem(key, String(value));
    } catch (_) { /* private / quota */ }
  }

  function todayKey() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function parseSet(raw, valid, always) {
    const out = {};
    String(raw || '').split(',').forEach((id) => {
      id = id.trim();
      if (valid[id]) out[id] = true;
    });
    (always || []).forEach((id) => { out[id] = true; });
    return out;
  }

  function writeSet(key, obj) {
    set(key, Object.keys(obj).filter((k) => obj[k]).join(','));
  }

  function getBest() {
    return parseInt(get(KEYS.best, '0'), 10) || 0;
  }
  function setBest(n) {
    const best = Math.max(getBest(), n | 0);
    set(KEYS.best, best);
    // also update all-time + today
    setAllTimeBest(best);
    setTodayBest(n | 0);
    return best;
  }

  function getAllTimeBest() {
    return Math.max(getBest(), parseInt(get(KEYS.allTimeBest, '0'), 10) || 0);
  }
  function setAllTimeBest(n) {
    const best = Math.max(getAllTimeBest(), n | 0);
    set(KEYS.allTimeBest, best);
    return best;
  }

  function getTodayBest() {
    if (get(KEYS.todayBestDate, '') !== todayKey()) return 0;
    return parseInt(get(KEYS.todayBest, '0'), 10) || 0;
  }
  function setTodayBest(n) {
    const date = todayKey();
    let best = get(KEYS.todayBestDate, '') === date ? (parseInt(get(KEYS.todayBest, '0'), 10) || 0) : 0;
    best = Math.max(best, n | 0);
    set(KEYS.todayBestDate, date);
    set(KEYS.todayBest, best);
    return best;
  }

  function getBestCombo() {
    return parseInt(get(KEYS.bestCombo, '0'), 10) || 0;
  }
  function setBestCombo(n) {
    const best = Math.max(getBestCombo(), n | 0);
    set(KEYS.bestCombo, best);
    return best;
  }

  function getDailyBest() {
    if (get(KEYS.dailyDate, '') !== todayKey()) return 0;
    return parseInt(get(KEYS.dailyBest, '0'), 10) || 0;
  }
  function setDailyBest(n) {
    const date = todayKey();
    let best = get(KEYS.dailyDate, '') === date ? (parseInt(get(KEYS.dailyBest, '0'), 10) || 0) : 0;
    best = Math.max(best, n | 0);
    set(KEYS.dailyDate, date);
    set(KEYS.dailyBest, best);
    return best;
  }
  function getDailyDate() { return todayKey(); }

  function getCoins() {
    return parseInt(get(KEYS.coins, '0'), 10) || 0;
  }
  function setCoins(n) {
    const v = Math.max(0, n | 0);
    set(KEYS.coins, v);
    return v;
  }
  function addCoins(n) {
    return setCoins(getCoins() + (n | 0));
  }
  function spendCoins(n) {
    n = n | 0;
    if (getCoins() < n) return false;
    setCoins(getCoins() - n);
    return true;
  }

  function getUnlockedBirds() {
    return parseSet(get(KEYS.unlockedBirds, 'sparrow'), BIRDS, ['sparrow']);
  }
  function isBirdUnlocked(id) {
    return !!getUnlockedBirds()[id];
  }
  function unlockBird(id) {
    if (!BIRDS[id]) return false;
    const u = getUnlockedBirds();
    u[id] = true;
    writeSet(KEYS.unlockedBirds, u);
    addToCollection('bird', id);
    return true;
  }

  function getUnlockedVehicles() {
    return parseSet(get(KEYS.unlockedVehicles, 'none'), VEHICLES, ['none']);
  }
  function isVehicleUnlocked(id) {
    return !!getUnlockedVehicles()[id];
  }
  function unlockVehicle(id) {
    if (!VEHICLES[id]) return false;
    const u = getUnlockedVehicles();
    u[id] = true;
    writeSet(KEYS.unlockedVehicles, u);
    addToCollection('vehicle', id);
    return true;
  }

  function getUnlockedEnvs() {
    return parseSet(get(KEYS.unlockedEnvs, 'city'), ENVS, ['city']);
  }
  function isEnvUnlocked(id) {
    return !!getUnlockedEnvs()[id];
  }
  function unlockEnv(id) {
    if (!ENVS[id]) return false;
    const u = getUnlockedEnvs();
    u[id] = true;
    writeSet(KEYS.unlockedEnvs, u);
    addToCollection('env', id);
    return true;
  }

  function getUnlockedHats() {
    return parseSet(get(KEYS.unlockedHats, 'none'), HATS, ['none']);
  }
  function isHatUnlocked(id) {
    return !!getUnlockedHats()[id];
  }
  function unlockHat(id) {
    if (!HATS[id]) return false;
    const u = getUnlockedHats();
    u[id] = true;
    writeSet(KEYS.unlockedHats, u);
    addToCollection('accessory', id);
    return true;
  }

  function getUnlockedTrails() {
    return parseSet(get(KEYS.unlockedTrails, 'none,spark'), TRAILS, ['none', 'spark']);
  }
  function isTrailUnlocked(id) {
    return !!getUnlockedTrails()[id];
  }
  function unlockTrail(id) {
    if (!TRAILS[id]) return false;
    const u = getUnlockedTrails();
    u[id] = true;
    writeSet(KEYS.unlockedTrails, u);
    addToCollection('trail', id);
    return true;
  }

  function getUnlockedSkins() {
    const birds = getUnlockedBirds();
    const out = { bird: true, bike: true, rickshaw: true };
    if (birds.eagle) out.rocket = true;
    return out;
  }
  function isSkinUnlocked(id) {
    if (id === 'bird' || id === 'bike' || id === 'rickshaw') return true;
    if (id === 'rocket') return isBirdUnlocked('eagle');
    return isBirdUnlocked(id);
  }
  function unlockSkin(id) {
    if (id === 'rocket') return unlockBird('eagle');
    return unlockBird(LEGACY_SKIN[id] || id);
  }

  function getBird() {
    let s = get(KEYS.bird, '');
    if (!s) {
      const legacy = get(KEYS.skin, 'bird');
      s = LEGACY_SKIN[legacy] || 'sparrow';
    }
    if (!BIRDS[s] || !isBirdUnlocked(s)) return 'sparrow';
    return s;
  }
  function setBird(id) {
    if (!BIRDS[id] || !isBirdUnlocked(id)) return;
    set(KEYS.bird, id);
    set(KEYS.skin, id === 'sparrow' ? 'bird' : id);
  }
  function getSkin() { return getBird(); }
  function setSkin(id) { setBird(LEGACY_SKIN[id] || id); }

  function getVehicle() {
    const v = get(KEYS.vehicle, 'none');
    if (!VEHICLES[v] || !isVehicleUnlocked(v)) return 'none';
    return v;
  }
  function setVehicle(id) {
    if (!VEHICLES[id] || !isVehicleUnlocked(id)) return;
    set(KEYS.vehicle, id);
  }

  function getEnv() {
    const e = get(KEYS.env, 'city');
    if (!ENVS[e] || !isEnvUnlocked(e)) return 'city';
    return e;
  }
  function setEnv(id) {
    if (!ENVS[id] || !isEnvUnlocked(id)) return;
    set(KEYS.env, id);
  }

  function getWeather() {
    let w = get(KEYS.weather, 'clear');
    if (w === 'sunny') w = 'clear';
    const ok = { clear: 1, sunny: 1, rain: 1, fog: 1, night: 1, storm: 1, sunset: 1 };
    return ok[w] ? (w === 'sunny' ? 'clear' : w) : 'clear';
  }
  function setWeather(id) {
    const ok = { clear: 1, sunny: 1, rain: 1, fog: 1, night: 1, storm: 1, sunset: 1 };
    if (ok[id]) set(KEYS.weather, id === 'sunny' ? 'clear' : id);
  }

  function getHat() {
    const h = get(KEYS.hat, 'none');
    if (!HATS[h] || !isHatUnlocked(h)) return 'none';
    return h;
  }
  function setHat(id) {
    if (!HATS[id] || !isHatUnlocked(id)) return;
    set(KEYS.hat, id);
  }

  function getTrail() {
    const t = get(KEYS.trail, 'spark');
    if (!TRAILS[t] || !isTrailUnlocked(t)) return 'spark';
    return t;
  }
  function setTrail(id) {
    if (!TRAILS[id] || !isTrailUnlocked(id)) return;
    set(KEYS.trail, id);
  }

  function getCollection() {
    try {
      return JSON.parse(get(KEYS.collection, '{}')) || {};
    } catch (_) {
      return {};
    }
  }
  function addToCollection(kind, id) {
    const c = getCollection();
    if (!c[kind]) c[kind] = {};
    c[kind][id] = true;
    set(KEYS.collection, JSON.stringify(c));
  }
  function collectionCounts() {
    const birds = getUnlockedBirds();
    const vehs = getUnlockedVehicles();
    const hats = getUnlockedHats();
    const trails = getUnlockedTrails();
    const envs = getUnlockedEnvs();
    const count = (obj) => Object.keys(obj).filter((k) => obj[k] && k !== 'none').length;
    const total = (map) => Object.keys(map).filter((k) => k !== 'none').length;
    const challengeStage = getChallengeStage();
    const challengeTotal = 5;
    const challengesHave = Math.max(0, Math.min(challengeTotal, challengeStage - 1));
    const seasonals = getUnlockedSeasonals();
    const seasonalTotal = Object.keys(SEASONALS).length;
    const seasonalHave = Object.keys(seasonals).filter((k) => seasonals[k]).length;
    return {
      birds: { have: count(birds), total: total(BIRDS) },
      vehicles: { have: count(vehs), total: total(VEHICLES) },
      accessories: { have: count(hats), total: total(HATS) },
      trails: { have: count(trails), total: total(TRAILS) },
      areas: { have: count(envs), total: total(ENVS) },
      seasonals: { have: seasonalHave, total: seasonalTotal },
      challenges: { have: challengesHave, total: challengeTotal }
    };
  }

  function albumCompletionPct() {
    const c = collectionCounts();
    let have = 0, tot = 0;
    Object.keys(c).forEach((k) => { have += c[k].have; tot += c[k].total; });
    if (!tot) return 0;
    return Math.floor((have / tot) * 100);
  }

  function getAlbumClaimed() {
    const out = {};
    String(get(KEYS.albumClaimed, '')).split(',').forEach((id) => { if (id) out[id] = true; });
    return out;
  }

  function claimAlbumReward(tier) {
    const tiers = { 25: 30, 50: 60, 75: 100, 100: 200 };
    if (!tiers[tier]) return null;
    const claimed = getAlbumClaimed();
    if (claimed[String(tier)]) return null;
    if (albumCompletionPct() < tier) return null;
    claimed[String(tier)] = true;
    set(KEYS.albumClaimed, Object.keys(claimed).join(','));
    addCoins(tiers[tier]);
    if (tier === 100) {
      addFragments(5);
    }
    return { tier: tier, coins: tiers[tier] };
  }

  function getFragments() {
    return parseInt(get(KEYS.fragments, '0'), 10) || 0;
  }
  function setFragments(n) {
    const v = Math.max(0, n | 0);
    set(KEYS.fragments, v);
    return v;
  }
  function addFragments(n) {
    return setFragments(getFragments() + (n | 0));
  }
  function spendFragments(n) {
    n = n | 0;
    if (getFragments() < n) return false;
    setFragments(getFragments() - n);
    return true;
  }
  /** Spend 10/20 fragments to unlock a locked cosmetic. */
  function unlockWithFragments(kind, id, cost) {
    cost = cost || 10;
    if (!spendFragments(cost)) return false;
    if (kind === 'bird') unlockBird(id);
    else if (kind === 'vehicle') unlockVehicle(id);
    else if (kind === 'hat' || kind === 'accessory') unlockHat(id);
    else if (kind === 'trail') unlockTrail(id);
    else if (kind === 'env' || kind === 'area') unlockEnv(id);
    else if (kind === 'seasonal') unlockSeasonal(id);
    else { addFragments(cost); return false; }
    return true;
  }

  function getBestPerfect() {
    return parseInt(get(KEYS.bestPerfect, '0'), 10) || 0;
  }
  function setBestPerfect(n) {
    const best = Math.max(getBestPerfect(), n | 0);
    set(KEYS.bestPerfect, best);
    return best;
  }
  function bumpNearMissTotal(n) {
    const v = (parseInt(get(KEYS.nearMissTotal, '0'), 10) || 0) + (n | 0);
    set(KEYS.nearMissTotal, v);
    return v;
  }
  function bumpPerfectTotal(n) {
    const v = (parseInt(get(KEYS.perfectTotal, '0'), 10) || 0) + (n | 0);
    set(KEYS.perfectTotal, v);
    return v;
  }

  function getMetersBest() {
    return parseInt(get(KEYS.metersBest, '0'), 10) || 0;
  }
  function setMetersBest(n) {
    const best = Math.max(getMetersBest(), n | 0);
    set(KEYS.metersBest, best);
    return best;
  }

  // Daily streak Day1–7
  const STREAK_REWARDS = [
    { day: 1, coins: 10, type: 'coins' },
    { day: 2, coins: 15, type: 'coins' },
    { day: 3, coins: 25, type: 'coins' },
    { day: 4, coins: 0, type: 'mystery' },
    { day: 5, coins: 40, type: 'coins' },
    { day: 6, coins: 0, type: 'mystery' },
    { day: 7, coins: 0, type: 'rare_skin', skin: 'funny' }
  ];

  function getStreak() {
    const today = todayKey();
    const last = get(KEYS.streakDate, '');
    let day = parseInt(get(KEYS.streakDay, '0'), 10) || 0;
    const claimed = get(KEYS.streakClaimed, '') === '1';
    if (last === today) {
      return { day: Math.max(1, day), claimed: claimed, canClaim: !claimed, rewards: STREAK_REWARDS };
    }
    // yesterday?
    const y = new Date();
    y.setDate(y.getDate() - 1);
    const yKey = y.getFullYear() + '-' + String(y.getMonth() + 1).padStart(2, '0') + '-' + String(y.getDate()).padStart(2, '0');
    if (last === yKey) {
      return { day: Math.min(7, day + 1), claimed: false, canClaim: true, rewards: STREAK_REWARDS };
    }
    // reset
    return { day: 1, claimed: false, canClaim: true, rewards: STREAK_REWARDS };
  }

  function claimStreak() {
    const s = getStreak();
    if (!s.canClaim) return null;
    const day = s.day;
    const reward = STREAK_REWARDS[Math.min(6, day - 1)];
    set(KEYS.streakDay, day);
    set(KEYS.streakDate, todayKey());
    set(KEYS.streakClaimed, '1');
    const result = { day: day, type: reward.type, coins: 0, unlocked: null };
    if (reward.type === 'coins') {
      addCoins(reward.coins);
      result.coins = reward.coins;
    } else if (reward.type === 'rare_skin') {
      unlockBird(reward.skin || 'funny');
      result.unlocked = reward.skin || 'funny';
    } else if (reward.type === 'mystery') {
      const n = 20 + Math.floor(Math.random() * 30);
      addCoins(n);
      addGiftBoxes(1);
      result.coins = n;
      result.type = 'mystery';
      result.gifts = 1;
    }
    return result;
  }

  // One Life Challenge
  function getOneLifeBest() {
    return parseInt(get(KEYS.oneLifeBest, '0'), 10) || 0;
  }
  function setOneLifeBest(n) {
    const best = Math.max(getOneLifeBest(), n | 0);
    set(KEYS.oneLifeBest, best);
    const medal = oneLifeMedalFor(best);
    if (medal) set(KEYS.oneLifeMedal, medal);
    return best;
  }
  function oneLifeMedalFor(sc) {
    if (sc >= 1000) return 'legend';
    if (sc >= 500) return 'gold';
    if (sc >= 300) return 'silver';
    if (sc >= 100) return 'bronze';
    return null;
  }
  function getOneLifeMedal() {
    const m = get(KEYS.oneLifeMedal, '');
    return VALID_MEDALS[m] ? m : null;
  }

  function getTimeAttackBest() {
    return parseInt(get(KEYS.timeAttackBest, '0'), 10) || 0;
  }
  function setTimeAttackBest(n) {
    const best = Math.max(getTimeAttackBest(), n | 0);
    set(KEYS.timeAttackBest, best);
    return best;
  }
  function getNoCoinBest() {
    return parseInt(get(KEYS.noCoinBest, '0'), 10) || 0;
  }
  function setNoCoinBest(n) {
    const best = Math.max(getNoCoinBest(), n | 0);
    set(KEYS.noCoinBest, best);
    return best;
  }
  function getHardBest() {
    return parseInt(get(KEYS.hardBest, '0'), 10) || 0;
  }
  function setHardBest(n) {
    const best = Math.max(getHardBest(), n | 0);
    set(KEYS.hardBest, best);
    return best;
  }
  function getChallengeStage() {
    return parseInt(get(KEYS.challengeStage, '1'), 10) || 1;
  }
  function setChallengeStage(n) {
    set(KEYS.challengeStage, Math.max(1, n | 0));
  }

  function getLeaderboards() {
    return {
      personalBest: getBest(),
      todayBest: getTodayBest(),
      allTime: getAllTimeBest(),
      bestDistance: getMetersBest(),
      bestCombo: getBestCombo(),
      timeAttack: getTimeAttackBest(),
      oneLife: getOneLifeBest(),
      hard: getHardBest(),
      noCoin: getNoCoinBest()
    };
  }

  // Daily missions — each calendar day pick 3 from pool
  const MISSION_POOL = [
    { id: 'coins50', label: 'Collect 50 coins', target: 50, unit: 'coins', rewardType: 'coins', reward: 40 },
    { id: 'dodge20', label: 'Dodge 20 obstacles', target: 20, unit: 'pipes', rewardType: 'mystery', reward: 1 },
    { id: 'nearmiss3', label: 'Land 3 near-misses', target: 3, unit: 'nearmiss', rewardType: 'fragment', reward: 3 },
    { id: 'score100', label: 'Score 100', target: 100, unit: 'score', rewardType: 'coins', reward: 50 },
    // legacy-compatible extras still trackable if selected historically
    { id: 'fly_m', label: 'Fly 500m', target: 500, unit: 'm', rewardType: 'coins', reward: 25 },
    { id: 'coins', label: 'Collect 20 coins', target: 20, unit: 'coins', rewardType: 'coins', reward: 20 },
    { id: 'pipes', label: 'Pass 30 obstacles', target: 30, unit: 'pipes', rewardType: 'coins', reward: 25 },
    { id: 'boxes', label: 'Open 2 mystery boxes', target: 2, unit: 'boxes', rewardType: 'coins', reward: 30 },
    { id: 'clean50', label: 'Score 50 clean (no hit)', target: 50, unit: 'score', rewardType: 'coins', reward: 40 }
  ];
  const MISSION_DEFS = MISSION_POOL; // alias
  const DAILY_MISSION_IDS = ['coins50', 'dodge20', 'nearmiss3', 'score100'];

  function hashDay(str) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function pickDailyMissionIds(dateStr) {
    const pool = DAILY_MISSION_IDS.slice();
    let seed = hashDay('urrjaa-missions-' + dateStr);
    function rnd() {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return (seed >>> 0) / 4294967296;
    }
    // Fisher-Yates pick 3
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      const t = pool[i]; pool[i] = pool[j]; pool[j] = t;
    }
    return pool.slice(0, 3);
  }

  function ensureMissionsDay() {
    const today = todayKey();
    if (get(KEYS.missionsDate, '') !== today) {
      set(KEYS.missionsDate, today);
      const active = pickDailyMissionIds(today);
      set(KEYS.missionsActive, active.join(','));
      const progress = {};
      active.forEach((id) => { progress[id] = 0; });
      // also zero legacy keys for bump compatibility
      ['fly_m', 'coins', 'pipes', 'boxes', 'clean50', 'coins50', 'dodge20', 'nearmiss3', 'score100'].forEach((id) => {
        if (progress[id] == null) progress[id] = 0;
      });
      set(KEYS.missionsProgress, JSON.stringify(progress));
      set(KEYS.missionsClaimed, '');
    } else if (!get(KEYS.missionsActive, '')) {
      const active = pickDailyMissionIds(today);
      set(KEYS.missionsActive, active.join(','));
    }
  }

  function getActiveMissionIds() {
    ensureMissionsDay();
    const raw = String(get(KEYS.missionsActive, '')).split(',').filter(Boolean);
    if (raw.length >= 3) return raw.slice(0, 3);
    return pickDailyMissionIds(todayKey());
  }

  function missionDef(id) {
    return MISSION_POOL.find((m) => m.id === id) || null;
  }

  function getMissions() {
    ensureMissionsDay();
    let progress = {};
    try { progress = JSON.parse(get(KEYS.missionsProgress, '{}')) || {}; } catch (_) { progress = {}; }
    const claimed = {};
    String(get(KEYS.missionsClaimed, '')).split(',').forEach((id) => {
      if (id) claimed[id] = true;
    });
    return getActiveMissionIds().map((id) => {
      const m = missionDef(id) || { id: id, label: id, target: 1, reward: 10, rewardType: 'coins' };
      return {
        ...m,
        progress: progress[m.id] || 0,
        claimed: !!claimed[m.id],
        done: (progress[m.id] || 0) >= m.target
      };
    });
  }

  function bumpMission(id, amount) {
    ensureMissionsDay();
    let progress = {};
    try { progress = JSON.parse(get(KEYS.missionsProgress, '{}')) || {}; } catch (_) { progress = {}; }
    // Map legacy bump ids onto today's mission ids when relevant
    const map = {
      coins: 'coins50',
      pipes: 'dodge20',
      nearmiss: 'nearmiss3',
      score: 'score100'
    };
    const targets = [id];
    if (map[id]) targets.push(map[id]);
    // Also: coins bump should advance coins50; pipes→dodge20; etc.
    if (id === 'coins') targets.push('coins50');
    if (id === 'pipes') targets.push('dodge20');
    targets.forEach((tid) => {
      progress[tid] = (progress[tid] || 0) + (amount || 1);
    });
    set(KEYS.missionsProgress, JSON.stringify(progress));
  }

  function setMissionMax(id, value) {
    ensureMissionsDay();
    let progress = {};
    try { progress = JSON.parse(get(KEYS.missionsProgress, '{}')) || {}; } catch (_) { progress = {}; }
    progress[id] = Math.max(progress[id] || 0, value | 0);
    // map score peaks
    if (id === 'clean50' || id === 'score' || id === 'score100') {
      progress.score100 = Math.max(progress.score100 || 0, value | 0);
    }
    set(KEYS.missionsProgress, JSON.stringify(progress));
  }

  function claimMission(id) {
    const list = getMissions();
    const m = list.find((x) => x.id === id);
    if (!m || !m.done || m.claimed) return null;
    const claimed = String(get(KEYS.missionsClaimed, ''))
      .split(',')
      .filter(Boolean);
    claimed.push(id);
    set(KEYS.missionsClaimed, claimed.join(','));
    const result = { id: id, type: m.rewardType || 'coins', coins: 0, fragments: 0, mystery: false };
    if (m.rewardType === 'fragment') {
      addFragments(m.reward || 2);
      result.fragments = m.reward || 2;
    } else if (m.rewardType === 'mystery') {
      addGiftBoxes(m.reward || 1);
      result.mystery = true;
      result.type = 'mystery';
      result.gifts = m.reward || 1;
    } else {
      addCoins(m.reward || 20);
      result.coins = m.reward || 20;
    }
    return result;
  }

  // Mystery box rarity roll COMMON→LEGENDARY
  const BOX_RARITIES = [
    { id: 'common', label: 'COMMON', weight: 50, coinsMin: 8, coinsMax: 18, fragDup: 1 },
    { id: 'uncommon', label: 'UNCOMMON', weight: 28, coinsMin: 15, coinsMax: 28, fragDup: 2 },
    { id: 'rare', label: 'RARE', weight: 14, coinsMin: 25, coinsMax: 45, fragDup: 3 },
    { id: 'epic', label: 'EPIC', weight: 6, coinsMin: 40, coinsMax: 70, fragDup: 5 },
    { id: 'legendary', label: 'LEGENDARY', weight: 2, coinsMin: 80, coinsMax: 120, fragDup: 8 }
  ];

  function rollBoxRarity(rngFn) {
    const rnd = typeof rngFn === 'function' ? rngFn : Math.random;
    const total = BOX_RARITIES.reduce((s, r) => s + r.weight, 0);
    let roll = rnd() * total;
    for (let i = 0; i < BOX_RARITIES.length; i++) {
      roll -= BOX_RARITIES[i].weight;
      if (roll <= 0) return BOX_RARITIES[i];
    }
    return BOX_RARITIES[0];
  }

  function isMuted() { return get(KEYS.mute, '0') === '1'; }
  function setMuted(on) { set(KEYS.mute, on ? '1' : '0'); }
  function getRunCount() { return parseInt(get(KEYS.runs, '0'), 10) || 0; }
  function bumpRunCount() {
    const n = getRunCount() + 1;
    set(KEYS.runs, n);
    return n;
  }
  function getBestMedal() {
    const m = get(KEYS.medal, '');
    return VALID_MEDALS[m] ? m : null;
  }
  function setBestMedal(id) {
    if (VALID_MEDALS[id]) set(KEYS.medal, id);
  }
  function getSensitivity() {
    const n = parseFloat(get(KEYS.sensitivity, '1'));
    if (isNaN(n)) return 1;
    return Math.max(0.7, Math.min(1.3, n));
  }
  function setSensitivity(n) {
    const v = Math.max(0.7, Math.min(1.3, parseFloat(n) || 1));
    set(KEYS.sensitivity, v.toFixed(2));
    return v;
  }
  function getReduceMotion() { return get(KEYS.reduceMotion, '0') === '1'; }
  function setReduceMotion(on) { set(KEYS.reduceMotion, on ? '1' : '0'); }
  function getHaptics() { return get(KEYS.haptics, '1') === '1'; }
  function setHaptics(on) { set(KEYS.haptics, on ? '1' : '0'); }
  function getVoicePack() { return get(KEYS.voicePack, '1') === '1'; }
  function setVoicePack(on) { set(KEYS.voicePack, on ? '1' : '0'); }

  function pushRunDuration(sec) {
    let arr = [];
    try { arr = JSON.parse(get(KEYS.runDurations, '[]')); } catch (e) { arr = []; }
    if (!Array.isArray(arr)) arr = [];
    const v = Math.max(0, Math.round((parseFloat(sec) || 0) * 10) / 10);
    arr.push(v);
    if (arr.length > 5) arr = arr.slice(-5);
    set(KEYS.runDurations, JSON.stringify(arr));
    return arr;
  }
  function getRunDurations() {
    let arr = [];
    try { arr = JSON.parse(get(KEYS.runDurations, '[]')); } catch (e) { arr = []; }
    return Array.isArray(arr) ? arr : [];
  }
  function getAvgRunDuration() {
    const arr = getRunDurations();
    if (!arr.length) return 0;
    let sum = 0;
    for (let i = 0; i < arr.length; i++) sum += arr[i];
    return sum / arr.length;
  }



  // --- Mystery Rewards + Spin Wheel (v3.4 / 3.4.1) ---
  // Collecting 📦/🎁 during play adds inventory; every 10 boxes = 1 spin.
  // Wheel rewards ONLY coins: 444 / 555 / 666 / 777 / 888 / 999
  const GIFTS_PER_SPIN = 10;
  const WHEEL_REWARDS = [444, 555, 666, 777, 888, 999];

  function getGiftBoxes() {
    return parseInt(get(KEYS.giftBoxes, '0'), 10) || 0;
  }
  function setGiftBoxes(n) {
    const v = Math.max(0, n | 0);
    set(KEYS.giftBoxes, v);
    return v;
  }
  function addGiftBoxes(n) {
    return setGiftBoxes(getGiftBoxes() + (n | 0));
  }
  function spendGiftBoxes(n) {
    n = n | 0;
    if (n <= 0) return true;
    if (getGiftBoxes() < n) return false;
    setGiftBoxes(getGiftBoxes() - n);
    return true;
  }
  function getSpinCharges() {
    return Math.floor(getGiftBoxes() / GIFTS_PER_SPIN);
  }
  function rollWheelCoins(rngFn) {
    const rnd = typeof rngFn === 'function' ? rngFn : Math.random;
    const i = Math.floor(rnd() * WHEEL_REWARDS.length);
    return WHEEL_REWARDS[Math.max(0, Math.min(WHEEL_REWARDS.length - 1, i))];
  }
  /** Spend 10 gifts for one spin. Returns { coins, giftsLeft, spinsLeft } or null. */
  function spinWheelOnce(rngFn) {
    if (getGiftBoxes() < GIFTS_PER_SPIN) return null;
    if (!spendGiftBoxes(GIFTS_PER_SPIN)) return null;
    const coins = rollWheelCoins(rngFn);
    addCoins(coins);
    return { coins: coins, giftsLeft: getGiftBoxes(), spinsLeft: getSpinCharges(), count: 1 };
  }
  /** Spend all complete sets of 10. Returns { totalCoins, results[], giftsLeft, spinsLeft } or null. */
  function spinWheelAll(rngFn) {
    const n = getSpinCharges();
    if (n <= 0) return null;
    const results = [];
    let total = 0;
    for (let i = 0; i < n; i++) {
      const r = spinWheelOnce(rngFn);
      if (!r) break;
      results.push(r.coins);
      total += r.coins;
    }
    if (!results.length) return null;
    return { totalCoins: total, results: results, giftsLeft: getGiftBoxes(), spinsLeft: getSpinCharges(), count: results.length };
  }

  function getUnlockedSeasonals() {
    return parseSet(get(KEYS.unlockedSeasonals, ''), SEASONALS, []);
  }
  function isSeasonalUnlocked(id) {
    return !!getUnlockedSeasonals()[id];
  }
  function unlockSeasonal(id) {
    if (!SEASONALS[id]) return false;
    const u = getUnlockedSeasonals();
    if (u[id]) return false;
    u[id] = true;
    writeSet(KEYS.unlockedSeasonals, u);
    addToCollection('seasonal', id);
    // Grant pack cosmetics
    const packs = (typeof FTSkins !== 'undefined' && FTSkins.SEASONAL_PACKS) ? FTSkins.SEASONAL_PACKS : [];
    const pack = packs.find ? packs.find((p) => p.id === id) : null;
    if (pack) {
      if (pack.hat) unlockHat(pack.hat);
      if (pack.trail) unlockTrail(pack.trail);
    }
    return true;
  }

  /** Offline date + milestone seasonal unlocks. Persists forever once earned. */
  function checkSeasonalUnlocks(bestScore, dateObj) {
    const packs = (typeof FTSkins !== 'undefined' && FTSkins.SEASONAL_PACKS) ? FTSkins.SEASONAL_PACKS : [];
    const unlocked = [];
    const best = bestScore | 0;
    packs.forEach((pack) => {
      if (isSeasonalUnlocked(pack.id)) return;
      let ok = false;
      if (typeof FTSkins !== 'undefined' && FTSkins.seasonalEligible) {
        ok = FTSkins.seasonalEligible(pack, best, dateObj);
      } else if (pack.milestoneScore && best >= pack.milestoneScore) {
        ok = true;
      }
      if (ok && unlockSeasonal(pack.id)) unlocked.push(pack.id);
    });
    return unlocked;
  }

  function checkEnvMilestones(bestScore) {
    const gates = [
      [15, 'lahore'], [25, 'bridge'], [30, 'islamabad'], [40, 'mountains'],
      [45, 'karachi'], [55, 'rain'], [60, 'murree'], [80, 'village'],
      [100, 'desert'], [120, 'night'],
      [130, 'canal'], [140, 'hunza'], [150, 'gwadar'],
      [160, 'quetta'], [170, 'monsoon'], [180, 'oldcity']
    ];
    const unlocked = [];
    gates.forEach(([need, id]) => {
      if (bestScore >= need && !isEnvUnlocked(id)) {
        unlockEnv(id);
        unlocked.push(id);
      }
    });
    return unlocked;
  }

  global.FTStorage = {
    getBest, setBest, getDailyBest, setDailyBest, getDailyDate,
    getTodayBest, setTodayBest, getAllTimeBest, setAllTimeBest,
    getBestCombo, setBestCombo, getLeaderboards,
    getSkin, setSkin, getBird, setBird, getVehicle, setVehicle,
    getEnv, setEnv, getWeather, setWeather, getHat, setHat, getTrail, setTrail,
    isMuted, setMuted, getRunCount, bumpRunCount, getBestMedal, setBestMedal,
    getSensitivity, setSensitivity, getReduceMotion, setReduceMotion,
    getHaptics, setHaptics, getVoicePack, setVoicePack,
    getUnlockedSkins, isSkinUnlocked, unlockSkin,
    getCoins, setCoins, addCoins, spendCoins,
    getUnlockedBirds, isBirdUnlocked, unlockBird,
    getUnlockedVehicles, isVehicleUnlocked, unlockVehicle,
    getUnlockedEnvs, isEnvUnlocked, unlockEnv,
    getUnlockedHats, isHatUnlocked, unlockHat,
    getUnlockedTrails, isTrailUnlocked, unlockTrail,
    getUnlockedSeasonals, isSeasonalUnlocked, unlockSeasonal, checkSeasonalUnlocks,
    getCollection, addToCollection, collectionCounts,
    getMissions, bumpMission, setMissionMax, claimMission, MISSION_DEFS, MISSION_POOL,
    getActiveMissionIds, getMetersBest, setMetersBest, checkEnvMilestones,
    getStreak, claimStreak, STREAK_REWARDS,
    getOneLifeBest, setOneLifeBest, oneLifeMedalFor, getOneLifeMedal,
    getTimeAttackBest, setTimeAttackBest,
    getNoCoinBest, setNoCoinBest, getHardBest, setHardBest,
    getChallengeStage, setChallengeStage,
    getFragments, setFragments, addFragments, spendFragments, unlockWithFragments,
    albumCompletionPct, getAlbumClaimed, claimAlbumReward,
    getBestPerfect, setBestPerfect, bumpNearMissTotal, bumpPerfectTotal,
    rollBoxRarity, BOX_RARITIES,
    getGiftBoxes, setGiftBoxes, addGiftBoxes, spendGiftBoxes, getSpinCharges,
    spinWheelOnce, spinWheelAll, rollWheelCoins, WHEEL_REWARDS, GIFTS_PER_SPIN,
    BIRDS, VEHICLES, ENVS, HATS, TRAILS, SEASONALS
  };
})(window);
