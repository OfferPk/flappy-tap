/**
 * Urr Jaa! v3.0.0-urrjaa — localStorage: scores, coins, unlocks, missions, settings.
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
    collection: PREFIX + 'collection',
    missionsDate: PREFIX + 'missions-date',
    missionsProgress: PREFIX + 'missions-progress',
    missionsClaimed: PREFIX + 'missions-claimed',
    metersBest: PREFIX + 'meters-best',
    cleanRuns: PREFIX + 'clean-runs'
  };

  const BIRDS = {
    sparrow: 1, parrot: 1, eagle: 1, chick: 1, owl: 1, funny: 1
  };
  const VEHICLES = {
    none: 1, rickshaw: 1, cycle: 1, bike: 1, scooty: 1, bicycle: 1,
    chingchi: 1, taxi: 1, bus: 1, mehran: 1, tractor: 1
  };
  const ENVS = {
    city: 1, lahore: 1, islamabad: 1, karachi: 1, murree: 1,
    village: 1, desert: 1, night: 1
  };
  const HATS = { none: 1, topi: 1, cap: 1, crown: 1 };
  const TRAILS = { none: 1, spark: 1, smoke: 1, stars: 1 };
  const VALID_MEDALS = { bronze: 1, silver: 1, gold: 1, platinum: 1 };
  // Legacy skins map → bird
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
    return true;
  }

  // Legacy skin helpers (compat)
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
    const w = get(KEYS.weather, 'sunny');
    const ok = { sunny: 1, rain: 1, fog: 1, night: 1, storm: 1 };
    return ok[w] ? w : 'sunny';
  }
  function setWeather(id) {
    const ok = { sunny: 1, rain: 1, fog: 1, night: 1, storm: 1 };
    if (ok[id]) set(KEYS.weather, id);
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

  function getMetersBest() {
    return parseInt(get(KEYS.metersBest, '0'), 10) || 0;
  }
  function setMetersBest(n) {
    const best = Math.max(getMetersBest(), n | 0);
    set(KEYS.metersBest, best);
    return best;
  }

  // Daily missions
  const MISSION_DEFS = [
    { id: 'fly_m', label: 'Fly 500m', target: 500, reward: 25, unit: 'm' },
    { id: 'coins', label: 'Collect 20 coins', target: 20, reward: 20, unit: 'coins' },
    { id: 'pipes', label: 'Pass 30 obstacles', target: 30, reward: 25, unit: 'pipes' },
    { id: 'boxes', label: 'Open 2 mystery boxes', target: 2, reward: 30, unit: 'boxes' },
    { id: 'clean50', label: 'Score 50 clean (no hit)', target: 50, reward: 40, unit: 'score' }
  ];

  function ensureMissionsDay() {
    const today = todayKey();
    if (get(KEYS.missionsDate, '') !== today) {
      set(KEYS.missionsDate, today);
      set(KEYS.missionsProgress, JSON.stringify({ fly_m: 0, coins: 0, pipes: 0, boxes: 0, clean50: 0 }));
      set(KEYS.missionsClaimed, '');
    }
  }

  function getMissions() {
    ensureMissionsDay();
    let progress = {};
    try { progress = JSON.parse(get(KEYS.missionsProgress, '{}')) || {}; } catch (_) { progress = {}; }
    const claimed = {};
    String(get(KEYS.missionsClaimed, '')).split(',').forEach((id) => {
      if (id) claimed[id] = true;
    });
    return MISSION_DEFS.map((m) => ({
      ...m,
      progress: progress[m.id] || 0,
      claimed: !!claimed[m.id],
      done: (progress[m.id] || 0) >= m.target
    }));
  }

  function bumpMission(id, amount) {
    ensureMissionsDay();
    let progress = {};
    try { progress = JSON.parse(get(KEYS.missionsProgress, '{}')) || {}; } catch (_) { progress = {}; }
    progress[id] = (progress[id] || 0) + (amount || 1);
    set(KEYS.missionsProgress, JSON.stringify(progress));
  }

  function setMissionMax(id, value) {
    ensureMissionsDay();
    let progress = {};
    try { progress = JSON.parse(get(KEYS.missionsProgress, '{}')) || {}; } catch (_) { progress = {}; }
    progress[id] = Math.max(progress[id] || 0, value | 0);
    set(KEYS.missionsProgress, JSON.stringify(progress));
  }

  function claimMission(id) {
    const list = getMissions();
    const m = list.find((x) => x.id === id);
    if (!m || !m.done || m.claimed) return false;
    const claimed = String(get(KEYS.missionsClaimed, ''))
      .split(',')
      .filter(Boolean);
    claimed.push(id);
    set(KEYS.missionsClaimed, claimed.join(','));
    addCoins(m.reward);
    return m.reward;
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

  /** Score-milestone auto-unlocks for environments */
  function checkEnvMilestones(bestScore) {
    const gates = [
      [15, 'lahore'], [30, 'islamabad'], [45, 'karachi'],
      [60, 'murree'], [80, 'village'], [100, 'desert'], [120, 'night']
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
    getSkin, setSkin, getBird, setBird, getVehicle, setVehicle,
    getEnv, setEnv, getWeather, setWeather, getHat, setHat, getTrail, setTrail,
    isMuted, setMuted, getRunCount, bumpRunCount, getBestMedal, setBestMedal,
    getSensitivity, setSensitivity, getReduceMotion, setReduceMotion,
    getHaptics, setHaptics,
    getUnlockedSkins, isSkinUnlocked, unlockSkin,
    getCoins, setCoins, addCoins, spendCoins,
    getUnlockedBirds, isBirdUnlocked, unlockBird,
    getUnlockedVehicles, isVehicleUnlocked, unlockVehicle,
    getUnlockedEnvs, isEnvUnlocked, unlockEnv,
    getUnlockedHats, isHatUnlocked, unlockHat,
    getUnlockedTrails, isTrailUnlocked, unlockTrail,
    getCollection, addToCollection,
    getMissions, bumpMission, setMissionMax, claimMission, MISSION_DEFS,
    getMetersBest, setMetersBest, checkEnvMilestones
  };
})(window);
