/**
 * Urr Jaa! v3.4.0 — Web Audio SFX + Desi voice (speechSynthesis) + chirp fallback.
 * Mute (game SFX) and Desi voice are independent toggles.
 * Voice still works when game mute is ON (voiceOn only).
 * No external assets; works offline.
 */
(function (global) {
  'use strict';

  let ctx = null;
  let muted = false;
  let voiceOn = true;
  let speechUnlocked = false;
  let cachedVoice = null;
  let voicesHooked = false;

  function ensure() {
    if (!ctx) {
      const AC = global.AudioContext || global.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume().catch(function () {});
    return ctx;
  }

  /** Game SFX — respects mute. */
  function tone(freq, dur, type, gain, slideTo) {
    if (muted) return;
    return rawTone(freq, dur, type, gain, slideTo);
  }

  /** Desi voice tones — respect voiceOn only (independent of mute). */
  function voiceTone(freq, dur, type, gain, slideTo) {
    if (!voiceOn) return;
    return rawTone(freq, dur, type, gain, slideTo);
  }

  function rawTone(freq, dur, type, gain, slideTo) {
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
    setTimeout(function () { tone(680, 0.05, 'square', 0.055); }, 28);
    setTimeout(function () { tone(820, 0.04, 'triangle', 0.04); }, 55);
  }

  function score() {
    tone(880, 0.07, 'sine', 0.1);
    setTimeout(function () { tone(1175, 0.09, 'sine', 0.08); }, 55);
    setTimeout(function () { tone(1480, 0.06, 'triangle', 0.05); }, 100);
  }

  function coin() {
    tone(1200, 0.05, 'sine', 0.09);
    setTimeout(function () { tone(1600, 0.07, 'sine', 0.07); }, 40);
    setTimeout(function () { tone(2000, 0.05, 'triangle', 0.04); }, 80);
  }

  function hit() {
    noiseBurst(0.12, 0.12);
    tone(140, 0.22, 'sawtooth', 0.14, 60);
    setTimeout(function () { tone(70, 0.28, 'triangle', 0.1); }, 40);
  }

  function powerup() {
    tone(660, 0.06, 'sine', 0.1);
    setTimeout(function () { tone(880, 0.07, 'sine', 0.09); }, 45);
    setTimeout(function () { tone(1320, 0.1, 'sine', 0.08); }, 90);
    setTimeout(function () { tone(1760, 0.08, 'triangle', 0.05); }, 140);
  }

  function nearmiss() {
    tone(1500, 0.04, 'triangle', 0.07);
    setTimeout(function () { tone(1900, 0.05, 'sine', 0.05); }, 25);
    noiseBurst(0.04, 0.04);
  }

  function combo() {
    tone(990, 0.06, 'square', 0.07);
    setTimeout(function () { tone(1320, 0.08, 'square', 0.06); }, 45);
    setTimeout(function () { tone(1760, 0.1, 'sine', 0.05); }, 95);
  }

  function turbo() {
    tone(400, 0.08, 'sawtooth', 0.08, 900);
    setTimeout(function () { tone(900, 0.1, 'square', 0.05); }, 70);
  }

  function ghost() {
    tone(300, 0.15, 'sine', 0.06, 600);
    setTimeout(function () { tone(500, 0.12, 'triangle', 0.04); }, 80);
  }

  function record() {
    tone(523, 0.08, 'sine', 0.1);
    setTimeout(function () { tone(659, 0.08, 'sine', 0.09); }, 70);
    setTimeout(function () { tone(784, 0.08, 'sine', 0.08); }, 140);
    setTimeout(function () { tone(1047, 0.16, 'triangle', 0.1); }, 210);
  }

  function risky() {
    tone(440, 0.05, 'square', 0.08);
    setTimeout(function () { tone(660, 0.05, 'square', 0.07); }, 40);
    setTimeout(function () { tone(880, 0.08, 'square', 0.06); }, 80);
  }

  function perfect() {
    tone(988, 0.05, 'sine', 0.09);
    setTimeout(function () { tone(1319, 0.07, 'sine', 0.08); }, 40);
    setTimeout(function () { tone(1568, 0.1, 'triangle', 0.06); }, 90);
  }

  function boss() {
    noiseBurst(0.1, 0.1);
    tone(110, 0.2, 'sawtooth', 0.12, 80);
    setTimeout(function () { tone(180, 0.15, 'square', 0.08); }, 60);
  }

  function mystery() {
    tone(400, 0.06, 'triangle', 0.08);
    setTimeout(function () { tone(600, 0.06, 'triangle', 0.07); }, 50);
    setTimeout(function () { tone(800, 0.06, 'triangle', 0.06); }, 100);
    setTimeout(function () { tone(1200, 0.12, 'sine', 0.08); }, 160);
  }

  function legendary() {
    tone(523, 0.07, 'sine', 0.1);
    setTimeout(function () { tone(659, 0.07, 'sine', 0.09); }, 60);
    setTimeout(function () { tone(784, 0.07, 'sine', 0.08); }, 120);
    setTimeout(function () { tone(1047, 0.1, 'sine', 0.09); }, 180);
    setTimeout(function () { tone(1319, 0.14, 'triangle', 0.08); }, 260);
  }

  /** Soft "lucky save" chime (game SFX — muted with sound). */
  function lucky() {
    tone(660, 0.05, 'sine', 0.08);
    setTimeout(function () { tone(990, 0.08, 'triangle', 0.07); }, 45);
  }

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
    areaMusicTimer = setInterval(function () {
      if (muted) return;
      tone(notes[i % notes.length], 0.12, 'triangle', 0.025);
      i++;
    }, 420);
  }

  /* ——— Desi voice: speechSynthesis + audible melodic chirp fallback ——— */

  const VOICE_LABELS = {
    oye_hoye: 'Oye hoye!',
    bach_ke: 'Bach ke!',
    wah_ji: 'Wah ji wah!',
    kya_udaan: 'Kya udaan hai!',
    haye_oye: 'Haye oye!',
    shabaash: 'Shabaash!',
    lucky: 'Lucky!'
  };

  /** Spoken phrase text (short) for Web Speech API. */
  const SPEAK_TEXT = {
    oye_hoye: 'oye hoye',
    bach_ke: 'bach ke',
    wah_ji: 'wah ji wah',
    kya_udaan: 'kya udaan hai',
    haye_oye: 'haye oye',
    shabaash: 'shabaash',
    lucky: 'lucky'
  };

  function speechAvailable() {
    return !!(global.speechSynthesis && typeof global.SpeechSynthesisUtterance === 'function');
  }

  function scoreVoice(v) {
    if (!v || !v.lang) return 0;
    const lang = String(v.lang).toLowerCase().replace('_', '-');
    const name = String(v.name || '').toLowerCase();
    if (lang === 'hi-in' || lang.indexOf('hi-in') === 0) return 100;
    if (lang === 'hi' || lang.indexOf('hi-') === 0) return 90;
    if (lang === 'ur' || lang.indexOf('ur-') === 0 || lang === 'ur-pk') return 95;
    if (lang === 'en-in' || lang.indexOf('en-in') === 0) return 70;
    if (name.indexOf('hindi') >= 0 || name.indexOf('urdu') >= 0) return 85;
    if (lang.indexOf('en') === 0) return 40;
    return 10;
  }

  function pickVoice() {
    if (!speechAvailable()) return null;
    const list = global.speechSynthesis.getVoices() || [];
    if (!list.length) return cachedVoice;
    let best = null;
    let bestScore = -1;
    for (let i = 0; i < list.length; i++) {
      const s = scoreVoice(list[i]);
      if (s > bestScore) { bestScore = s; best = list[i]; }
    }
    cachedVoice = best;
    return best;
  }

  function hookVoices() {
    if (!speechAvailable() || voicesHooked) return;
    voicesHooked = true;
    try {
      global.speechSynthesis.addEventListener('voiceschanged', function () {
        cachedVoice = null;
        pickVoice();
      });
    } catch (e) { /* ignore */ }
    pickVoice();
  }

  /**
   * Unlock AudioContext + speechSynthesis on first user gesture (required on mobile).
   */
  function unlock() {
    ensure();
    hookVoices();
    if (!speechAvailable()) return;
    try {
      pickVoice();
      if (!speechUnlocked) {
        // Warm utterance in user-gesture context (iOS/Android gate)
        const warm = new global.SpeechSynthesisUtterance(' ');
        warm.volume = 0.01;
        warm.rate = 2;
        warm.pitch = 1;
        const v = pickVoice();
        if (v) { warm.voice = v; warm.lang = v.lang; }
        else warm.lang = 'hi-IN';
        global.speechSynthesis.speak(warm);
        speechUnlocked = true;
      } else if (global.speechSynthesis.paused) {
        global.speechSynthesis.resume();
      }
    } catch (e) {
      speechUnlocked = true; // still mark so we try real phrases
    }
  }

  /**
   * Speak a short phrase via Web Speech API.
   * @returns {boolean} true if speak() was queued successfully
   */
  function speakPhrase(phrase, fallbackId) {
    if (!voiceOn || !phrase) return false;
    if (!speechAvailable()) return false;
    hookVoices();
    try {
      if (global.speechSynthesis.speaking || global.speechSynthesis.pending) {
        global.speechSynthesis.cancel();
      }
      const u = new global.SpeechSynthesisUtterance(phrase);
      const v = pickVoice();
      if (v) {
        u.voice = v;
        u.lang = v.lang;
      } else {
        u.lang = 'hi-IN';
      }
      u.rate = 1.1;
      u.pitch = 1.05;
      u.volume = 1;
      u.onerror = function (ev) {
        var err = ev && ev.error;
        if (err === 'canceled' || err === 'interrupted') return;
        if (fallbackId && VOICE_CHIRPS[fallbackId]) VOICE_CHIRPS[fallbackId]();
      };
      global.speechSynthesis.speak(u);
      speechUnlocked = true;
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Audible multi-note melodic chirp fallback (clearly louder than a tiny beep).
   * Gated by voiceOn only — independent of game mute.
   */
  function playChirpNotes(notes) {
    if (!voiceOn || !notes || !notes.length) return;
    ensure();
    for (let i = 0; i < notes.length; i++) {
      (function (n, delay) {
        setTimeout(function () {
          voiceTone(n.f, n.d, n.t || 'triangle', n.g == null ? 0.18 : n.g, n.slide);
        }, delay);
      })(notes[i], notes[i].at || i * 70);
    }
  }

  const VOICE_CHIRPS = {
    oye_hoye: function () {
      playChirpNotes([
        { f: 340, d: 0.1, t: 'triangle', g: 0.2, at: 0 },
        { f: 480, d: 0.12, t: 'triangle', g: 0.2, at: 80 },
        { f: 560, d: 0.1, t: 'sine', g: 0.16, at: 170 },
        { f: 420, d: 0.12, t: 'sine', g: 0.14, at: 260 }
      ]);
    },
    bach_ke: function () {
      playChirpNotes([
        { f: 720, d: 0.08, t: 'square', g: 0.16, at: 0 },
        { f: 540, d: 0.1, t: 'square', g: 0.15, slide: 320, at: 70 },
        { f: 400, d: 0.12, t: 'triangle', g: 0.14, at: 160 }
      ]);
    },
    wah_ji: function () {
      playChirpNotes([
        { f: 520, d: 0.09, t: 'sine', g: 0.18, at: 0 },
        { f: 660, d: 0.1, t: 'sine', g: 0.17, at: 75 },
        { f: 780, d: 0.1, t: 'triangle', g: 0.16, at: 155 },
        { f: 920, d: 0.14, t: 'triangle', g: 0.15, at: 240 }
      ]);
    },
    kya_udaan: function () {
      playChirpNotes([
        { f: 400, d: 0.1, t: 'triangle', g: 0.18, slide: 640, at: 0 },
        { f: 700, d: 0.1, t: 'sine', g: 0.16, at: 100 },
        { f: 880, d: 0.14, t: 'sine', g: 0.14, at: 200 }
      ]);
    },
    haye_oye: function () {
      playChirpNotes([
        { f: 480, d: 0.14, t: 'sawtooth', g: 0.18, slide: 220, at: 0 },
        { f: 280, d: 0.12, t: 'triangle', g: 0.16, at: 100 },
        { f: 200, d: 0.16, t: 'sine', g: 0.14, at: 200 }
      ]);
    },
    shabaash: function () {
      playChirpNotes([
        { f: 523, d: 0.09, t: 'sine', g: 0.2, at: 0 },
        { f: 659, d: 0.09, t: 'sine', g: 0.18, at: 80 },
        { f: 784, d: 0.1, t: 'triangle', g: 0.17, at: 160 },
        { f: 1047, d: 0.16, t: 'triangle', g: 0.18, at: 250 }
      ]);
    },
    lucky: function () {
      playChirpNotes([
        { f: 660, d: 0.09, t: 'sine', g: 0.18, at: 0 },
        { f: 880, d: 0.1, t: 'triangle', g: 0.17, at: 70 },
        { f: 1100, d: 0.14, t: 'sine', g: 0.15, at: 150 }
      ]);
    }
  };

  /**
   * Play Desi cue: prefer speechSynthesis; else multi-note chirp.
   * Mute does NOT block — only voiceOn does.
   * Returns toast label.
   */
  function voice(id) {
    ensure();
    if (!voiceOn) return '';
    const label = VOICE_LABELS[id] || '';
    const phrase = SPEAK_TEXT[id] || '';
    let spoke = false;
    if (phrase) spoke = speakPhrase(phrase, id);
    if (!spoke) {
      if (VOICE_CHIRPS[id]) VOICE_CHIRPS[id]();
      else VOICE_CHIRPS.oye_hoye();
    }
    return label;
  }

  /** Settings preview — speaks sample "oye hoye" (gated by voiceOn). */
  function preview() {
    unlock();
    if (!voiceOn) return '';
    return voice('oye_hoye');
  }

  function setMuted(on) { muted = !!on; if (muted) stopAreaMusic(); }
  function isMuted() { return muted; }
  function setVoicePack(on) {
    voiceOn = !!on;
    if (!on && speechAvailable()) {
      try { global.speechSynthesis.cancel(); } catch (e) { /* ignore */ }
    }
  }
  function isVoicePack() { return voiceOn; }

  // Prefetch voices early when browser allows
  hookVoices();

  global.FTAudio = {
    flap: flap, score: score, coin: coin, hit: hit, powerup: powerup, nearmiss: nearmiss,
    combo: combo, turbo: turbo, ghost: ghost, record: record, risky: risky,
    perfect: perfect, boss: boss, mystery: mystery, legendary: legendary, lucky: lucky,
    playAreaMusic: playAreaMusic, stopAreaMusic: stopAreaMusic,
    voice: voice, preview: preview, VOICE_LABELS: VOICE_LABELS, SPEAK_TEXT: SPEAK_TEXT,
    setMuted: setMuted, isMuted: isMuted, setVoicePack: setVoicePack, isVoicePack: isVoicePack, unlock: unlock
  };
})(window);
