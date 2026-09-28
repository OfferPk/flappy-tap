/**
 * localStorage helpers — scores, medals, skins, mute, settings, daily. Offline only.
 */
(function (global) {
  'use strict';

  const PREFIX = 'flappy-tap:';

  const KEYS = {
    best: PREFIX + 'best',
    skin: PREFIX + 'skin',
    mute: PREFIX + 'mute',
    runs: PREFIX + 'runs',
    medal: PREFIX + 'best-medal',
    dailyBest: PREFIX + 'daily-best',
    dailyDate: PREFIX + 'daily-date',
    sensitivity: PREFIX + 'sensitivity',
    reduceMotion: PREFIX + 'reduce-motion',
    haptics: PREFIX + 'haptics',
    unlockedSkins: PREFIX + 'unlocked-skins'
  };

  const VALID_SKINS = { bird: 1, bike: 1, rickshaw: 1, rocket: 1 };
  const VALID_MEDALS = { bronze: 1, silver: 1, gold: 1, platinum: 1 };

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
    } catch (_) { /* private mode / quota */ }
  }

  function todayKey() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
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
    const date = get(KEYS.dailyDate, '');
    if (date !== todayKey()) return 0;
    return parseInt(get(KEYS.dailyBest, '0'), 10) || 0;
  }

  function setDailyBest(n) {
    const date = todayKey();
    const prevDate = get(KEYS.dailyDate, '');
    let best = 0;
    if (prevDate === date) {
      best = parseInt(get(KEYS.dailyBest, '0'), 10) || 0;
    }
    best = Math.max(best, n | 0);
    set(KEYS.dailyDate, date);
    set(KEYS.dailyBest, best);
    return best;
  }

  function getDailyDate() {
    return todayKey();
  }

  function getUnlockedSkins() {
    const raw = get(KEYS.unlockedSkins, 'bird,bike,rickshaw');
    const setIds = {};
    String(raw)
      .split(',')
      .forEach((id) => {
        id = id.trim();
        if (VALID_SKINS[id]) setIds[id] = true;
      });
    setIds.bird = true;
    setIds.bike = true;
    setIds.rickshaw = true;
    return setIds;
  }

  function isSkinUnlocked(id) {
    if (id === 'bird' || id === 'bike' || id === 'rickshaw') return true;
    return !!getUnlockedSkins()[id];
  }

  function unlockSkin(id) {
    if (!VALID_SKINS[id]) return false;
    const u = getUnlockedSkins();
    u[id] = true;
    set(KEYS.unlockedSkins, Object.keys(u).join(','));
    return true;
  }

  function getSkin() {
    const s = get(KEYS.skin, 'bird');
    if (!VALID_SKINS[s]) return 'bird';
    if (!isSkinUnlocked(s)) return 'bird';
    return s;
  }

  function setSkin(id) {
    if (!VALID_SKINS[id]) return;
    if (!isSkinUnlocked(id)) return;
    set(KEYS.skin, id);
  }

  function isMuted() {
    return get(KEYS.mute, '0') === '1';
  }

  function setMuted(on) {
    set(KEYS.mute, on ? '1' : '0');
  }

  function getRunCount() {
    return parseInt(get(KEYS.runs, '0'), 10) || 0;
  }

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
    if (VALID_MEDALS[id]) {
      set(KEYS.medal, id);
    }
  }

  /** Sensitivity scale 0.7–1.3 (1 = default). Affects gravity + flap. */
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

  function getReduceMotion() {
    return get(KEYS.reduceMotion, '0') === '1';
  }

  function setReduceMotion(on) {
    set(KEYS.reduceMotion, on ? '1' : '0');
  }

  /** Haptics on by default when supported. */
  function getHaptics() {
    return get(KEYS.haptics, '1') === '1';
  }

  function setHaptics(on) {
    set(KEYS.haptics, on ? '1' : '0');
  }

  global.FTStorage = {
    getBest,
    setBest,
    getDailyBest,
    setDailyBest,
    getDailyDate,
    getSkin,
    setSkin,
    isMuted,
    setMuted,
    getRunCount,
    bumpRunCount,
    getBestMedal,
    setBestMedal,
    getSensitivity,
    setSensitivity,
    getReduceMotion,
    setReduceMotion,
    getHaptics,
    setHaptics,
    getUnlockedSkins,
    isSkinUnlocked,
    unlockSkin
  };
})(window);
