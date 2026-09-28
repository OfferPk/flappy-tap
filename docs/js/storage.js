/**
 * localStorage helpers — scores, skin, mute. Offline only.
 */
(function (global) {
  'use strict';

  const PREFIX = 'flappy-tap:';

  const KEYS = {
    best: PREFIX + 'best',
    skin: PREFIX + 'skin',
    mute: PREFIX + 'mute',
    runs: PREFIX + 'runs'
  };

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

  function getBest() {
    return parseInt(get(KEYS.best, '0'), 10) || 0;
  }

  function setBest(n) {
    const best = Math.max(getBest(), n | 0);
    set(KEYS.best, best);
    return best;
  }

  function getSkin() {
    const s = get(KEYS.skin, 'bird');
    return s === 'bike' || s === 'rickshaw' || s === 'bird' ? s : 'bird';
  }

  function setSkin(id) {
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

  global.FTStorage = {
    getBest,
    setBest,
    getSkin,
    setSkin,
    isMuted,
    setMuted,
    getRunCount,
    bumpRunCount
  };
})(window);
