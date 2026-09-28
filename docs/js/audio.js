/**
 * Tiny Web Audio SFX — no external assets, works offline.
 */
(function (global) {
  'use strict';

  let ctx = null;
  let muted = false;

  function ensure() {
    if (!ctx) {
      const AC = global.AudioContext || global.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  }

  function tone(freq, dur, type, gain) {
    if (muted) return;
    const c = ensure();
    if (!c) return;
    const t0 = c.currentTime;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(gain == null ? 0.12 : gain, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(g);
    g.connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  function flap() {
    tone(520, 0.08, 'square', 0.08);
    setTimeout(() => tone(720, 0.06, 'square', 0.06), 40);
  }

  function score() {
    tone(880, 0.1, 'sine', 0.1);
    setTimeout(() => tone(1175, 0.12, 'sine', 0.08), 70);
  }

  function hit() {
    tone(120, 0.25, 'sawtooth', 0.15);
    setTimeout(() => tone(80, 0.3, 'triangle', 0.1), 50);
  }

  function setMuted(on) {
    muted = !!on;
  }

  function isMuted() {
    return muted;
  }

  function unlock() {
    ensure();
  }

  global.FTAudio = { flap, score, hit, setMuted, isMuted, unlock };
})(window);
