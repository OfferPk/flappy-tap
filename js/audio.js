/**
 * Urr Jaa! v3.15.0-urrjaa — expanded desi voice lines.
 * Urr Jaa! v3.6.0-urrjaa — Web Audio SFX + Desi voice (speechSynthesis) + chirp fallback.
 * Mute (game SFX) and Desi voice are independent toggles.
 * Voice still works when game mute is ON (voiceOn only).
 * Cooldown + variety: same phrase ~12s, any voice ~6s, rotate pools.
 * No external assets; works offline.
 */
(function (global) {
  'use strict';

  let ctx = null;
  let muted = false;
  let quietMul = 1; // 3.18 night quiet duck (1 = full)
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
    var g = (gain == null ? 0.12 : gain) * quietMul;
    return rawTone(freq, dur, type, g, slideTo);
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
    var gv = (gain == null ? 0.08 : gain) * quietMul;
    g.gain.setValueAtTime(gv, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    src.connect(g);
    g.connect(c.destination);
    src.start(t0);
    src.stop(t0 + dur + 0.02);
  }

  /** 3.17 SFX mix: small random pitch/gain so flaps/scores don't sound identical. */
  function mixJitter(base, spread) {
    return base + (Math.random() - 0.5) * (spread == null ? 40 : spread);
  }

  function flap() {
    var j = mixJitter(0, 36);
    var v = 0.06 + Math.random() * 0.025;
    tone(480 + j, 0.055, 'square', v);
    setTimeout(function () { tone(680 + j * 0.8, 0.05, 'square', v * 0.8); }, 28);
    setTimeout(function () { tone(820 + j * 0.5, 0.04, Math.random() > 0.45 ? 'triangle' : 'sine', v * 0.6); }, 55);
  }

  function score() {
    var j = mixJitter(0, 50);
    tone(880 + j, 0.07, 'sine', 0.1);
    setTimeout(function () { tone(1175 + j * 0.7, 0.09, 'sine', 0.08); }, 55);
    setTimeout(function () { tone(1480 + j * 0.4, 0.06, Math.random() > 0.5 ? 'triangle' : 'sine', 0.05); }, 100);
  }

  function coin() {
    var j = mixJitter(0, 60);
    tone(1200 + j, 0.05, 'sine', 0.085 + Math.random() * 0.02);
    setTimeout(function () { tone(1600 + j * 0.6, 0.07, 'sine', 0.07); }, 40);
    setTimeout(function () { tone(2000 + j * 0.3, 0.05, 'triangle', 0.04); }, 80);
  }

  function hit() {
    var j = mixJitter(0, 25);
    noiseBurst(0.12, 0.11 + Math.random() * 0.03);
    tone(140 + j, 0.22, 'sawtooth', 0.14, 60);
    setTimeout(function () { tone(70 + j * 0.4, 0.28, 'triangle', 0.1); }, 40);
  }

  /** Soft firework pop for high-score celebration (3.17). */
  function firework() {
    noiseBurst(0.06, 0.05);
    var j = mixJitter(0, 80);
    tone(520 + j, 0.05, 'sine', 0.07);
    setTimeout(function () { tone(780 + j * 0.5, 0.07, 'triangle', 0.06); }, 35);
    setTimeout(function () { tone(1100 + j * 0.3, 0.08, 'sine', 0.045); }, 80);
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

  /** Short bird chirp for mouth-open moments (tap / close / gift). Respects mute. */
  function chirp(kind) {
    kind = kind || 'tap';
    if (kind === 'gift') {
      tone(1400, 0.05, 'sine', 0.07);
      setTimeout(function () { tone(1800, 0.06, 'triangle', 0.06); }, 40);
      setTimeout(function () { tone(2100, 0.05, 'sine', 0.04); }, 85);
    } else if (kind === 'close') {
      tone(1600, 0.035, 'triangle', 0.06);
      setTimeout(function () { tone(2100, 0.04, 'sine', 0.045); }, 28);
    } else {
      tone(1250, 0.035, 'sine', 0.055);
      setTimeout(function () { tone(1650, 0.04, 'triangle', 0.04); }, 30);
    }
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
  /* Cooldown: ~6s between any voice; ~12s before exact same phrase repeats.
     Variety: prefer different lines from the same pool when cues fire. */

  const GLOBAL_VOICE_COOLDOWN_MS = 6000;
  const SAME_PHRASE_COOLDOWN_MS = 12000;
  let lastVoiceAt = 0;
  let lastVoiceId = '';
  const phraseLastAt = Object.create(null);
  const recentVoiceIds = [];

  const VOICE_LABELS = {
    oye_hoye: 'Oye hoye!',
    bach_ke: 'Bach ke!',
    wah_ji: 'Wah ji wah!',
    kya_udaan: 'Kya udaan hai!',
    haye_oye: 'Haye oye!',
    shabaash: 'Shabaash!',
    lucky: 'Lucky!',
    zabardast: 'Zabardast!',
    kya_baat: 'Kya baat!',
    mast: 'Mast!',
    bohot_ache: 'Bohot ache!',
    irshad: 'Irshad!',
    wah: 'Wah!',
    close_call: 'Close call!',
    gift: 'Gift!',
    mil_gaya: 'Mil gaya!',
    gift_box: 'Box!',
    kamaal: 'Kamaal!',
    are_wah: 'Are wah!',
    jee_haan: 'Jee haan!',
    lelo: 'Le lo!',
    box_mila: 'Box mila!',
    perfect_pass: 'Perfect!',
    bilkul_center: 'Bilkul center!',
    time_up: 'Time up!',
    jaldi: 'Jaldi!',
    dheere: 'Dheere!',
    practice_ok: 'Practice!',
    full_paisa: 'Full paisa!',
    oye_bhai: 'Oye bhai!',
    chalo_jee: 'Chalo jee!',
    lajawab: 'Lajawab!'
  };

  /** Spoken phrase text (short) for Web Speech API. */
  const SPEAK_TEXT = {
    oye_hoye: 'oye hoye',
    bach_ke: 'bach ke',
    wah_ji: 'wah ji wah',
    kya_udaan: 'kya udaan hai',
    haye_oye: 'haye oye',
    shabaash: 'shabaash',
    lucky: 'lucky',
    zabardast: 'zabardast',
    kya_baat: 'kya baat hai',
    mast: 'mast',
    bohot_ache: 'bohot ache',
    irshad: 'irshad',
    wah: 'wah',
    close_call: 'close call',
    gift: 'gift',
    mil_gaya: 'mil gaya',
    gift_box: 'box',
    kamaal: 'kamaal',
    are_wah: 'are wah',
    jee_haan: 'jee haan',
    lelo: 'le lo',
    box_mila: 'box mila',
    // 3.14 extras
    perfect_pass: 'perfect pass',
    bilkul_center: 'bilkul center',
    time_up: 'time up',
    jaldi: 'jaldi jaldi',
    dheere: 'dheere se',
    practice_ok: 'practice karo',
    full_paisa: 'full paisa',
    double_tap: 'double tap',
    oye_bhai: 'oye bhai',
    chalo_jee: 'chalo jee',
    zabardasti: 'zabardasti',
    lajawab: 'lajawab'
  };

  /** Category pools for variety rotation (no "wah g wah" spam). */
  const VOICE_POOLS = {
    praise: ['shabaash', 'zabardast', 'kya_baat', 'mast', 'bohot_ache', 'wah', 'wah_ji', 'irshad', 'kya_udaan', 'kamaal', 'are_wah', 'jee_haan', 'lajawab', 'chalo_jee', 'perfect_pass', 'bilkul_center'],
    warn: ['bach_ke', 'oye_hoye', 'close_call', 'jaldi', 'oye_bhai', 'dheere'],
    fail: ['haye_oye', 'oye_hoye', 'time_up'],
    lucky: ['lucky', 'shabaash', 'mast', 'kamaal', 'full_paisa'],
    gift: ['gift', 'mil_gaya', 'gift_box', 'lelo', 'box_mila', 'full_paisa'],
    start: ['oye_hoye', 'irshad', 'kya_udaan', 'jee_haan', 'chalo_jee', 'practice_ok']
  };

  const ID_TO_POOL = {
    oye_hoye: 'warn', bach_ke: 'warn', close_call: 'warn', jaldi: 'warn', dheere: 'warn', oye_bhai: 'warn',
    wah_ji: 'praise', kya_udaan: 'praise', shabaash: 'praise',
    zabardast: 'praise', kya_baat: 'praise', mast: 'praise',
    bohot_ache: 'praise', irshad: 'praise', wah: 'praise',
    haye_oye: 'fail', lucky: 'lucky', time_up: 'fail',
    gift: 'gift', mil_gaya: 'gift', gift_box: 'gift',
    kamaal: 'praise', are_wah: 'praise', jee_haan: 'praise',
    lelo: 'gift', box_mila: 'gift',
    perfect_pass: 'praise', bilkul_center: 'praise', practice_ok: 'start',
    full_paisa: 'gift', double_tap: 'warn', chalo_jee: 'start', zabardasti: 'praise', lajawab: 'praise'
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
    },
    zabardast: function () {
      playChirpNotes([
        { f: 440, d: 0.08, t: 'square', g: 0.16, at: 0 },
        { f: 554, d: 0.08, t: 'sine', g: 0.17, at: 70 },
        { f: 659, d: 0.1, t: 'triangle', g: 0.16, at: 140 },
        { f: 880, d: 0.12, t: 'sine', g: 0.15, at: 230 }
      ]);
    },
    kya_baat: function () {
      playChirpNotes([
        { f: 392, d: 0.1, t: 'triangle', g: 0.18, at: 0 },
        { f: 523, d: 0.1, t: 'sine', g: 0.17, at: 90 },
        { f: 659, d: 0.12, t: 'triangle', g: 0.15, at: 180 }
      ]);
    },
    mast: function () {
      playChirpNotes([
        { f: 587, d: 0.1, t: 'sine', g: 0.18, at: 0 },
        { f: 740, d: 0.12, t: 'triangle', g: 0.16, at: 90 }
      ]);
    },
    bohot_ache: function () {
      playChirpNotes([
        { f: 494, d: 0.08, t: 'sine', g: 0.17, at: 0 },
        { f: 587, d: 0.08, t: 'sine', g: 0.16, at: 70 },
        { f: 740, d: 0.1, t: 'triangle', g: 0.15, at: 140 },
        { f: 880, d: 0.12, t: 'sine', g: 0.14, at: 220 }
      ]);
    },
    irshad: function () {
      playChirpNotes([
        { f: 349, d: 0.1, t: 'triangle', g: 0.17, slide: 520, at: 0 },
        { f: 523, d: 0.12, t: 'sine', g: 0.15, at: 110 }
      ]);
    },
    wah: function () {
      playChirpNotes([
        { f: 523, d: 0.1, t: 'sine', g: 0.18, at: 0 },
        { f: 784, d: 0.14, t: 'triangle', g: 0.16, at: 90 }
      ]);
    },
    close_call: function () {
      playChirpNotes([
        { f: 880, d: 0.06, t: 'square', g: 0.14, at: 0 },
        { f: 660, d: 0.08, t: 'triangle', g: 0.13, at: 55 },
        { f: 440, d: 0.1, t: 'sine', g: 0.12, at: 120 }
      ]);
    },
    gift: function () {
      playChirpNotes([
        { f: 660, d: 0.07, t: 'sine', g: 0.2, at: 0 },
        { f: 880, d: 0.08, t: 'triangle', g: 0.19, at: 55 },
        { f: 1175, d: 0.1, t: 'sine', g: 0.17, at: 120 },
        { f: 1400, d: 0.12, t: 'triangle', g: 0.14, at: 200 }
      ]);
    },
    mil_gaya: function () {
      playChirpNotes([
        { f: 523, d: 0.08, t: 'triangle', g: 0.18, at: 0 },
        { f: 659, d: 0.08, t: 'sine', g: 0.16, at: 75 },
        { f: 784, d: 0.1, t: 'sine', g: 0.15, at: 150 },
        { f: 1047, d: 0.12, t: 'triangle', g: 0.14, at: 230 }
      ]);
    },
    gift_box: function () {
      playChirpNotes([
        { f: 400, d: 0.07, t: 'square', g: 0.15, at: 0 },
        { f: 600, d: 0.08, t: 'triangle', g: 0.16, at: 60 },
        { f: 900, d: 0.12, t: 'sine', g: 0.15, at: 130 }
      ]);
    },
    kamaal: function () {
      playChirpNotes([
        { f: 494, d: 0.08, t: 'sine', g: 0.18, at: 0 },
        { f: 622, d: 0.09, t: 'triangle', g: 0.16, at: 80 },
        { f: 830, d: 0.12, t: 'sine', g: 0.15, at: 170 }
      ]);
    },
    are_wah: function () {
      playChirpNotes([
        { f: 392, d: 0.09, t: 'triangle', g: 0.17, at: 0 },
        { f: 523, d: 0.1, t: 'sine', g: 0.16, at: 90 },
        { f: 784, d: 0.12, t: 'triangle', g: 0.14, at: 190 }
      ]);
    },
    jee_haan: function () {
      playChirpNotes([
        { f: 440, d: 0.08, t: 'sine', g: 0.17, at: 0 },
        { f: 554, d: 0.1, t: 'sine', g: 0.15, at: 85 }
      ]);
    },
    lelo: function () {
      playChirpNotes([
        { f: 700, d: 0.07, t: 'square', g: 0.16, at: 0 },
        { f: 900, d: 0.08, t: 'triangle', g: 0.16, at: 60 },
        { f: 1200, d: 0.11, t: 'sine', g: 0.14, at: 130 }
      ]);
    },
    box_mila: function () {
      playChirpNotes([
        { f: 480, d: 0.07, t: 'triangle', g: 0.17, at: 0 },
        { f: 640, d: 0.08, t: 'sine', g: 0.16, at: 70 },
        { f: 860, d: 0.08, t: 'triangle', g: 0.15, at: 140 },
        { f: 1100, d: 0.12, t: 'sine', g: 0.14, at: 210 }
      ]);
    }
  };

  function nowMs() {
    return (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
  }

  function phraseReady(id, t) {
    const last = phraseLastAt[id] || 0;
    return (t - last) >= SAME_PHRASE_COOLDOWN_MS;
  }

  function pickVarietyId(requestedId, t) {
    const poolName = ID_TO_POOL[requestedId];
    const pool = poolName ? VOICE_POOLS[poolName] : null;
    if (!pool || !pool.length) {
      return phraseReady(requestedId, t) ? requestedId : '';
    }
    // Prefer: requested if ready and not last; else least-recent ready in pool; else skip
    const candidates = [];
    for (let i = 0; i < pool.length; i++) {
      const id = pool[i];
      if (!VOICE_LABELS[id]) continue;
      if (!phraseReady(id, t)) continue;
      if (id === lastVoiceId) continue;
      if (recentVoiceIds.indexOf(id) >= 0) continue;
      candidates.push(id);
    }
    if (!candidates.length) {
      for (let i = 0; i < pool.length; i++) {
        const id = pool[i];
        if (VOICE_LABELS[id] && phraseReady(id, t) && id !== lastVoiceId) candidates.push(id);
      }
    }
    if (!candidates.length) {
      if (phraseReady(requestedId, t)) return requestedId;
      return '';
    }
    // Prefer requested if still in candidates
    if (candidates.indexOf(requestedId) >= 0 && requestedId !== lastVoiceId) return requestedId;
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  function markPlayed(id, t) {
    lastVoiceAt = t;
    lastVoiceId = id;
    phraseLastAt[id] = t;
    recentVoiceIds.push(id);
    if (recentVoiceIds.length > 4) recentVoiceIds.shift();
  }

  /**
   * Play Desi cue: prefer speechSynthesis; else multi-note chirp.
   * Mute does NOT block — only voiceOn does.
   * Cooldown + variety prevent same-line spam (e.g. "wah g wah").
   * opts.force — bypass cooldown (settings preview).
   * opts.priority — gift cues may play slightly sooner (still respect same-phrase).
   * Returns toast label ('' if skipped).
   */
  function voice(id, opts) {
    ensure();
    if (!voiceOn) return '';
    opts = opts || {};
    const t = nowMs();
    let playId = id;
    if (!opts.force) {
      const gap = t - lastVoiceAt;
      const minGap = opts.priority ? Math.floor(GLOBAL_VOICE_COOLDOWN_MS * 0.55) : GLOBAL_VOICE_COOLDOWN_MS;
      if (lastVoiceAt && gap < minGap) {
        // Within global window: only allow if we can swap to a fresh different line
        // and at least ~2.5s passed (avoid back-to-back chatter)
        if (gap < 2500) return '';
        playId = pickVarietyId(id, t);
        if (!playId || playId === lastVoiceId) return '';
      } else {
        playId = pickVarietyId(id, t);
        if (!playId) return '';
      }
    } else {
      playId = id;
    }
    if (!VOICE_LABELS[playId]) playId = id;
    if (!VOICE_LABELS[playId]) return '';

    const label = VOICE_LABELS[playId] || '';
    const phrase = SPEAK_TEXT[playId] || '';
    let spoke = false;
    if (phrase) spoke = speakPhrase(phrase, playId);
    if (!spoke) {
      if (VOICE_CHIRPS[playId]) VOICE_CHIRPS[playId]();
      else if (VOICE_CHIRPS[id]) VOICE_CHIRPS[id]();
      else VOICE_CHIRPS.oye_hoye();
    }
    markPlayed(playId, t);
    return label;
  }

  /** Gift / mystery-box collect voice — distinct, cooldown-aware. */
  function voiceGift() {
    const pool = VOICE_POOLS.gift;
    const t = nowMs();
    let id = pool[Math.floor(Math.random() * pool.length)];
    // Prefer one that is ready
    for (let i = 0; i < pool.length; i++) {
      const cand = pool[(i + Math.floor(Math.random() * pool.length)) % pool.length];
      if (phraseReady(cand, t) && cand !== lastVoiceId) { id = cand; break; }
    }
    return voice(id, { priority: true });
  }

  /** Settings preview — speaks sample; bypasses cooldown. */
  function preview() {
    unlock();
    if (!voiceOn) return '';
    return voice('oye_hoye', { force: true });
  }

  function setMuted(on) { muted = !!on; if (muted) stopAreaMusic(); }
  function isMuted() { return muted; }
  /** 3.18: night quiet — softens SFX (~35%) without full mute. */
  function setQuietMode(on) { quietMul = on ? 0.35 : 1; }
  function isQuietMode() { return quietMul < 0.99; }
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
    flap: flap, score: score, coin: coin, hit: hit, firework: firework, powerup: powerup, nearmiss: nearmiss, chirp: chirp,
    combo: combo, turbo: turbo, ghost: ghost, record: record, risky: risky,
    perfect: perfect, boss: boss, mystery: mystery, legendary: legendary, lucky: lucky,
    playAreaMusic: playAreaMusic, stopAreaMusic: stopAreaMusic,
    voice: voice, voiceGift: voiceGift, preview: preview, VOICE_LABELS: VOICE_LABELS, SPEAK_TEXT: SPEAK_TEXT, VOICE_POOLS: VOICE_POOLS,
    setMuted: setMuted, isMuted: isMuted, setQuietMode: setQuietMode, isQuietMode: isQuietMode, setVoicePack: setVoicePack, isVoicePack: isVoicePack, unlock: unlock
  };
})(window);
