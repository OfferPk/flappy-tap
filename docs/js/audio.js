/**
 * Urr Jaa! v3.2.0 — Web Audio SFX + Desi cues + perfect/boss/mystery + area music stubs.
 * No external assets; works offline.
 */
(function (global) {
  'use strict';

  let ctx = null;
  let muted = false;
  let voiceOn = true;

  function ensure() {
    if (!ctx) {
      const AC = global.AudioContext || global.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  }

  function tone(freq, dur, type, gain, slideTo) {
    if (muted) return;
    const c = ensure();
    if (!c) return;
    const t0 = c.currentTime;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo != null) osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t0 + dur);
    g.gain.setValueAtTime(gain == null ? 0.12 : gain, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(g);
    g.connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  function noiseBurst(dur, gain) {
    if (muted) return;
    const c = ensure();
    if (!c) return;
    const n = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, n, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = c.createBufferSource();
    src.buffer = buf;
    const g = c.createGain();
    const t0 = c.currentTime;
    g.gain.setValueAtTime(gain == null ? 0.08 : gain, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    src.connect(g);
    g.connect(c.destination);
    src.start(t0);
    src.stop(t0 + dur + 0.02);
  }

  function flap() {
    tone(480, 0.055, 'square', 0.07);
    setTimeout(() => tone(680, 0.05, 'square', 0.055), 28);
    setTimeout(() => tone(820, 0.04, 'triangle', 0.04), 55);
  }

  function score() {
    tone(880, 0.07, 'sine', 0.1);
    setTimeout(() => tone(1175, 0.09, 'sine', 0.08), 55);
    setTimeout(() => tone(1480, 0.06, 'triangle', 0.05), 100);
  }

  function coin() {
    tone(1200, 0.05, 'sine', 0.09);
    setTimeout(() => tone(1600, 0.07, 'sine', 0.07), 40);
    setTimeout(() => tone(2000, 0.05, 'triangle', 0.04), 80);
  }

  function hit() {
    noiseBurst(0.12, 0.12);
    tone(140, 0.22, 'sawtooth', 0.14, 60);
    setTimeout(() => tone(70, 0.28, 'triangle', 0.1), 40);
  }

  function powerup() {
    tone(660, 0.06, 'sine', 0.1);
    setTimeout(() => tone(880, 0.07, 'sine', 0.09), 45);
    setTimeout(() => tone(1320, 0.1, 'sine', 0.08), 90);
    setTimeout(() => tone(1760, 0.08, 'triangle', 0.05), 140);
  }

  function nearmiss() {
    tone(1500, 0.04, 'triangle', 0.07);
    setTimeout(() => tone(1900, 0.05, 'sine', 0.05), 25);
    noiseBurst(0.04, 0.04);
  }

  function combo() {
    tone(990, 0.06, 'square', 0.07);
    setTimeout(() => tone(1320, 0.08, 'square', 0.06), 45);
    setTimeout(() => tone(1760, 0.1, 'sine', 0.05), 95);
  }

  function turbo() {
    tone(400, 0.08, 'sawtooth', 0.08, 900);
    setTimeout(() => tone(900, 0.1, 'square', 0.05), 70);
  }

  function ghost() {
    tone(300, 0.15, 'sine', 0.06, 600);
    setTimeout(() => tone(500, 0.12, 'triangle', 0.04), 80);
  }

  function record() {
    tone(523, 0.08, 'sine', 0.1);
    setTimeout(() => tone(659, 0.08, 'sine', 0.09), 70);
    setTimeout(() => tone(784, 0.08, 'sine', 0.08), 140);
    setTimeout(() => tone(1047, 0.16, 'triangle', 0.1), 210);
  }

  function risky() {
    tone(440, 0.05, 'square', 0.08);
    setTimeout(() => tone(660, 0.05, 'square', 0.07), 40);
    setTimeout(() => tone(880, 0.08, 'square', 0.06), 80);
  }

  function perfect() {
    tone(988, 0.05, 'sine', 0.09);
    setTimeout(() => tone(1319, 0.07, 'sine', 0.08), 40);
    setTimeout(() => tone(1568, 0.1, 'triangle', 0.06), 90);
  }

  function boss() {
    noiseBurst(0.1, 0.1);
    tone(110, 0.2, 'sawtooth', 0.12, 80);
    setTimeout(() => tone(180, 0.15, 'square', 0.08), 60);
  }

  function mystery() {
    tone(400, 0.06, 'triangle', 0.08);
    setTimeout(() => tone(600, 0.06, 'triangle', 0.07), 50);
    setTimeout(() => tone(800, 0.06, 'triangle', 0.06), 100);
    setTimeout(() => tone(1200, 0.12, 'sine', 0.08), 160);
  }

  function legendary() {
    tone(523, 0.07, 'sine', 0.1);
    setTimeout(() => tone(659, 0.07, 'sine', 0.09), 60);
    setTimeout(() => tone(784, 0.07, 'sine', 0.08), 120);
    setTimeout(() => tone(1047, 0.1, 'sine', 0.09), 180);
    setTimeout(() => tone(1319, 0.14, 'triangle', 0.08), 260);
  }

  /** Optional per-area music stubs (short looping-ish arpeggios). */
  let areaMusicTimer = null;
  let areaMusicId = null;
  function stopAreaMusic() {
    if (areaMusicTimer) { clearInterval(areaMusicTimer); areaMusicTimer = null; }
    areaMusicId = null;
  }
  function playAreaMusic(areaId) {
    if (muted) { stopAreaMusic(); return; }
    if (areaMusicId === areaId) return;
    stopAreaMusic();
    areaMusicId = areaId;
    ensure();
    const themes = {
      city: [392, 494, 523, 587],
      bridge: [349, 440, 523],
      mountains: [262, 330, 392, 523],
      village: [294, 370, 440],
      rain: [220, 247, 294],
      night: [196, 247, 294, 370],
      desert: [311, 370, 415, 466]
    };
    const notes = themes[areaId] || themes.city;
    let i = 0;
    areaMusicTimer = setInterval(() => {
      if (muted) return;
      tone(notes[i % notes.length], 0.12, 'triangle', 0.025);
      i++;
    }, 420);
  }

  /** Short Desi voice-like pitch phrases (not speech synthesis dialogue). */
  const VOICE = {
    oye_hoye: function () {
      if (!voiceOn || muted) return;
      tone(360, 0.07, 'triangle', 0.09);
      setTimeout(() => tone(520, 0.09, 'triangle', 0.08), 60);
      setTimeout(() => tone(440, 0.07, 'sine', 0.06), 130);
    },
    bach_ke: function () {
      if (!voiceOn || muted) return;
      tone(700, 0.05, 'square', 0.07);
      setTimeout(() => tone(500, 0.08, 'square', 0.06, 350), 50);
    },
    wah_ji: function () {
      if (!voiceOn || muted) return;
      tone(600, 0.06, 'sine', 0.08);
      setTimeout(() => tone(750, 0.07, 'sine', 0.07), 55);
      setTimeout(() => tone(900, 0.1, 'triangle', 0.06), 120);
    },
    kya_udaan: function () {
      if (!voiceOn || muted) return;
      tone(480, 0.08, 'triangle', 0.08, 720);
      setTimeout(() => tone(800, 0.1, 'sine', 0.06), 90);
    },
    haye_oye: function () {
      if (!voiceOn || muted) return;
      tone(420, 0.12, 'sawtooth', 0.1, 180);
      setTimeout(() => tone(200, 0.15, 'triangle', 0.07), 80);
    },
    shabaash: function () {
      if (!voiceOn || muted) return;
      tone(550, 0.07, 'sine', 0.09);
      setTimeout(() => tone(690, 0.07, 'sine', 0.08), 60);
      setTimeout(() => tone(880, 0.12, 'triangle', 0.09), 130);
    }
  };

  const VOICE_LABELS = {
    oye_hoye: 'Oye hoye!',
    bach_ke: 'Bach ke!',
    wah_ji: 'Wah ji wah!',
    kya_udaan: 'Kya udaan!',
    haye_oye: 'Haye oye!',
    shabaash: 'Shabaash!'
  };

  function voice(id) {
    if (VOICE[id]) VOICE[id]();
    return VOICE_LABELS[id] || '';
  }

  function setMuted(on) { muted = !!on; }
  function isMuted() { return muted; }
  function setVoicePack(on) { voiceOn = !!on; }
  function isVoicePack() { return voiceOn; }
  function unlock() { ensure(); }

  global.FTAudio = {
    flap, score, coin, hit, powerup, nearmiss, combo, turbo, ghost, record, risky,
    perfect, boss, mystery, legendary, playAreaMusic, stopAreaMusic,
    voice, VOICE_LABELS,
    setMuted, isMuted, setVoicePack, isVoicePack, unlock
  };
})(window);
