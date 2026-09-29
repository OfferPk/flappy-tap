/* Pure, dependency-free gameplay rules shared by the game and regression tests. */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.FTSim = api;
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this), function () {
  'use strict';

  function hashSeed(value) {
    var text = String(value);
    var hash = 2166136261 >>> 0;
    for (var i = 0; i < text.length; i++) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function makeRng(seed) {
    var state = seed >>> 0 || 1;
    return function () {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return state / 4294967296;
    };
  }

  function rectanglesOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }

  function scorePipePass(options) {
    options = options || {};
    var distance = Math.abs(Number(options.distanceFromCenter));
    var threshold = Math.max(0, Number(options.perfectCenterPx) || 0);
    var perfect = Number.isFinite(distance) && distance <= threshold;
    var basePoints = perfect ? 3 : 1;
    var tag = perfect ? 'PERFECT!' : '';
    if (options.nearMiss) {
      basePoints = Math.max(basePoints, 5);
      if (!tag) tag = 'CLOSE +5';
      var bonus = Number(options.nearMissBonus);
      if (Number.isFinite(bonus)) basePoints += bonus;
    }
    var multiplier = Math.max(1, Number(options.multiplier) | 0);
    return {
      perfect: perfect,
      basePoints: basePoints,
      multiplier: multiplier,
      gained: basePoints * multiplier,
      tag: tag
    };
  }

  function canTransition(state, action, mode) {
    if (action === 'pause') return state === 'playing';
    if (action === 'resume') return state === 'paused';
    if (action === 'retry') return state === 'dead' && mode !== 'onelife';
    if (action === 'continue') {
      return state === 'dead' && ['practice', 'challenge', 'onelife', 'timeattack'].indexOf(mode) < 0;
    }
    if (action === 'start') return state === 'menu' || state === 'dead';
    return false;
  }

  return {
    hashSeed: hashSeed,
    makeRng: makeRng,
    rectanglesOverlap: rectanglesOverlap,
    scorePipePass: scorePipePass,
    canTransition: canTransition
  };
});
