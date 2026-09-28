/**
 * Urr Jaa! v3.23.0-urrjaa — bird shadow polish + prior skins; keeps ≤3.22.
 * Canvas-drawn; wings/hats/mouth are visual-only (hitbox ignores them).
 */
(function (global) {
  'use strict';

  const BIRDS = [
    { id: 'sparrow', label: 'Sparrow', cost: 0, free: true },
    { id: 'parrot', label: 'Parrot', cost: 40 },
    { id: 'eagle', label: 'Eagle', cost: 80 },
    { id: 'chick', label: 'Chick', cost: 30 },
    { id: 'owl', label: 'Owl', cost: 50 },
    { id: 'funny', label: 'Funny', cost: 100 },
    { id: 'mynah', label: 'Mynah', cost: 45 },
    { id: 'bulbul', label: 'Bulbul', cost: 48 },
    { id: 'cheel', label: 'Cheel', cost: 70 },
    { id: 'mor', label: 'Mor', cost: 90 },
    { id: 'kawwa', label: 'Kawwa', cost: 42 },
    { id: 'kabootar', label: 'Kabootar', cost: 38 },
    { id: 'hoopoe', label: 'Hoopoe', cost: 55 },
    { id: 'falcon', label: 'Baaz', cost: 85 },
    { id: 'jungle', label: 'Jungle wali', cost: 55, unlockScore: 50 },
    { id: 'alpine', label: 'Mountains wali', cost: 65, unlockScore: 70 },
    { id: 'seagull', label: 'Sea wali', cost: 60, unlockScore: 60 }
  ];

  const VEHICLES = [
    { id: 'none', label: 'Solo', cost: 0, free: true },
    { id: 'rickshaw', label: 'Rickshaw', cost: 50 },
    { id: 'cycle', label: 'Cycle', cost: 35 },
    { id: 'bike', label: 'Bike', cost: 45 },
    { id: 'scooty', label: 'Scooty', cost: 40 },
    { id: 'bicycle', label: 'Bicycle', cost: 30 },
    { id: 'chingchi', label: 'Chingchi', cost: 55 },
    { id: 'taxi', label: 'Taxi', cost: 60 },
    { id: 'bus', label: 'Bus', cost: 70 },
    { id: 'mehran', label: 'Mehran', cost: 65 },
    { id: 'tractor', label: 'Tractor', cost: 75 },
    { id: 'truck', label: 'Truck', cost: 80 },
    { id: 'jungle_rickshaw', label: 'Leafy Rickshaw', cost: 48, unlockScore: 50 },
    { id: 'snow_bike', label: 'Snow Bike', cost: 52, unlockScore: 70 },
    { id: 'sea_boat', label: 'Sea Boat', cost: 50, unlockScore: 60 }
  ];

  const ENVS = [
    { id: 'city', label: 'City', cost: 0, free: true, unlockScore: 0 },
    { id: 'bridge', label: 'Bridge', cost: 28, unlockScore: 25 },
    { id: 'lahore', label: 'Lahore', cost: 25, unlockScore: 15 },
    { id: 'islamabad', label: 'Islamabad', cost: 30, unlockScore: 30 },
    { id: 'mountains', label: 'Mountains', cost: 35, unlockScore: 40 },
    { id: 'karachi', label: 'Karachi', cost: 35, unlockScore: 45 },
    { id: 'rain', label: 'Rain City', cost: 32, unlockScore: 55 },
    { id: 'murree', label: 'Murree', cost: 40, unlockScore: 60 },
    { id: 'village', label: 'Village', cost: 30, unlockScore: 80 },
    { id: 'desert', label: 'Desert', cost: 45, unlockScore: 100 },
    { id: 'night', label: 'Night', cost: 50, unlockScore: 120 },
    { id: 'canal', label: 'Canal', cost: 48, unlockScore: 130 },
    { id: 'hunza', label: 'Hunza', cost: 55, unlockScore: 140 },
    { id: 'gwadar', label: 'Gwadar', cost: 50, unlockScore: 150 },
    { id: 'quetta', label: 'Quetta Bazaar', cost: 55, unlockScore: 160 },
    { id: 'monsoon', label: 'Monsoon Fields', cost: 52, unlockScore: 170 },
    { id: 'oldcity', label: 'Old City Rooftops', cost: 58, unlockScore: 180 }
  ];

  const WEATHERS = [
    { id: 'clear', label: 'Clear' },
    { id: 'rain', label: 'Rain' },
    { id: 'fog', label: 'Fog' },
    { id: 'storm', label: 'Storm' },
    { id: 'night', label: 'Night' },
    { id: 'sunset', label: 'Sunset' }
  ];

  /** Mild bird passives — never paywalled; sparrow free control feel. */
  const BIRD_PASSIVES = {
    sparrow: { id: 'control', label: 'Steady flaps', gravityMul: 0.96, flapMul: 1.04, coinMul: 1, nearMissBonus: 0, nightBonus: 0 },
    parrot: { id: 'coin', label: '+5% coins', gravityMul: 1, flapMul: 1, coinMul: 1.05, nearMissBonus: 0, nightBonus: 0 },
    owl: { id: 'night', label: 'Night bonus', gravityMul: 1, flapMul: 1, coinMul: 1, nearMissBonus: 0, nightBonus: 0.08 },
    eagle: { id: 'nearmiss', label: 'Near-miss bonus', gravityMul: 1, flapMul: 1, coinMul: 1, nearMissBonus: 1, nightBonus: 0 },
    chick: { id: 'none', label: 'Cute', gravityMul: 1, flapMul: 1, coinMul: 1, nearMissBonus: 0, nightBonus: 0 },
    funny: { id: 'none', label: 'Goofy', gravityMul: 1, flapMul: 1, coinMul: 1, nearMissBonus: 0, nightBonus: 0 },
    mynah: { id: 'coin', label: '+4% coins', gravityMul: 1, flapMul: 1, coinMul: 1.04, nearMissBonus: 0, nightBonus: 0 },
    bulbul: { id: 'flap', label: 'Light flaps', gravityMul: 0.98, flapMul: 1.05, coinMul: 1, nearMissBonus: 0, nightBonus: 0 },
    cheel: { id: 'nearmiss', label: 'Soar near-miss', gravityMul: 1, flapMul: 1.02, coinMul: 1, nearMissBonus: 1, nightBonus: 0 },
    mor: { id: 'coin', label: '+6% coins', gravityMul: 1.02, flapMul: 1, coinMul: 1.06, nearMissBonus: 0, nightBonus: 0 },
    kawwa: { id: 'control', label: 'Street smart', gravityMul: 0.97, flapMul: 1.03, coinMul: 1, nearMissBonus: 0, nightBonus: 0 },
    kabootar: { id: 'control', label: 'City glide', gravityMul: 0.95, flapMul: 1.02, coinMul: 1, nearMissBonus: 0, nightBonus: 0 },
    hoopoe: { id: 'night', label: 'Dusk bonus', gravityMul: 1, flapMul: 1, coinMul: 1, nearMissBonus: 0, nightBonus: 0.06 },
    falcon: { id: 'nearmiss', label: 'Dive bonus', gravityMul: 1.01, flapMul: 1.06, coinMul: 1, nearMissBonus: 1, nightBonus: 0 },
    jungle: { id: 'coin', label: 'Jungle coins +5%', gravityMul: 0.98, flapMul: 1.03, coinMul: 1.05, nearMissBonus: 0, nightBonus: 0 },
    alpine: { id: 'control', label: 'Alpine glide', gravityMul: 0.94, flapMul: 1.02, coinMul: 1, nearMissBonus: 0, nightBonus: 0.04 },
    seagull: { id: 'flap', label: 'Sea breeze flaps', gravityMul: 0.97, flapMul: 1.06, coinMul: 1.03, nearMissBonus: 0, nightBonus: 0 }
  };

  function birdPassive(id) {
    return BIRD_PASSIVES[id] || BIRD_PASSIVES.sparrow;
  }

  /** Light weather gameplay modifiers — slight, not unfair. */
  function weatherMods(weatherId) {
    const w = weatherId === 'sunny' ? 'clear' : weatherId;
    const table = {
      clear: { speedMul: 1, visibility: 1, label: 'Clear' },
      rain: { speedMul: 0.97, visibility: 0.92, label: 'Rain' },
      fog: { speedMul: 0.98, visibility: 0.72, label: 'Fog' },
      storm: { speedMul: 1.06, visibility: 0.85, label: 'Storm' },
      night: { speedMul: 1, visibility: 0.8, label: 'Night' },
      sunset: { speedMul: 0.98, visibility: 0.95, label: 'Sunset' }
    };
    return table[w] || table.clear;
  }

  const HATS = [
    { id: 'none', label: 'None', cost: 0, free: true },
    { id: 'sunglasses', label: 'Sunglasses', cost: 20 },
    { id: 'cap', label: 'Cap', cost: 25 },
    { id: 'hat', label: 'Hat', cost: 30 },
    { id: 'topi', label: 'Topi', cost: 20 },
    { id: 'helmet', label: 'Helmet', cost: 45 },
    { id: 'scarf', label: 'Scarf', cost: 35 },
    { id: 'crown', label: 'Crown', cost: 60 },
    { id: 'ind_topi', label: 'Azadi Topi', cost: 0, seasonal: 'independence' },
    { id: 'eid_sparkle', label: 'Eid Sparkle', cost: 0, seasonal: 'eid' },
    { id: 'winter_shawl', label: 'Winter Shawl', cost: 0, seasonal: 'winter' },
    { id: 'basant_pagri', label: 'Basant Pagri', cost: 0, seasonal: 'basant' }
  ];

  const TRAILS = [
    { id: 'none', label: 'None', cost: 0, free: true },
    { id: 'spark', label: 'Spark', cost: 0, free: true },
    { id: 'smoke', label: 'Smoke', cost: 20 },
    { id: 'stars', label: 'Stars', cost: 35 },
    { id: 'star', label: 'Star Dust', cost: 40 },
    { id: 'fire', label: 'Fire', cost: 50 },
    { id: 'rainbow', label: 'Rainbow', cost: 70 },
    { id: 'ind_trail', label: 'Azadi Trail', cost: 0, seasonal: 'independence' },
    { id: 'eid_trail', label: 'Eid Glow', cost: 0, seasonal: 'eid' },
    { id: 'winter_trail', label: 'Snow Dust', cost: 0, seasonal: 'winter' },
    { id: 'basant_trail', label: 'Kite Trail', cost: 0, seasonal: 'basant' }
  ];

  /** Offline seasonal packs — date windows (device local) and/or score milestones. Persist forever once unlocked. */
  const SEASONAL_PACKS = [
    {
      id: 'independence',
      label: 'Azadi Pack',
      emoji: '🇵🇰',
      hat: 'ind_topi',
      trail: 'ind_trail',
      milestoneScore: 75,
      // ~14 Aug window (device local calendar)
      windows: [{ m: 8, d0: 10, d1: 20 }]
    },
    {
      id: 'eid',
      label: 'Eid Sparkle',
      emoji: '🌙',
      hat: 'eid_sparkle',
      trail: 'eid_trail',
      milestoneScore: 100,
      // Approximate lunar + fixed calendar windows + milestone fallback
      windows: [
        { m: 3, d0: 15, d1: 31 },
        { m: 4, d0: 1, d1: 15 },
        { m: 6, d0: 1, d1: 25 }
      ]
    },
    {
      id: 'winter',
      label: 'Winter Shawl',
      emoji: '🧣',
      hat: 'winter_shawl',
      trail: 'winter_trail',
      milestoneScore: 60,
      windows: [
        { m: 12, d0: 1, d1: 31 },
        { m: 1, d0: 1, d1: 31 },
        { m: 2, d0: 1, d1: 15 }
      ]
    },
    {
      id: 'basant',
      label: 'Basant Kites',
      emoji: '🪁',
      hat: 'basant_pagri',
      trail: 'basant_trail',
      milestoneScore: 80,
      windows: [{ m: 2, d0: 1, d1: 28 }]
    }
  ];

  function seasonalInWindow(pack, dateObj) {
    const d = dateObj || new Date();
    const mo = d.getMonth() + 1;
    const day = d.getDate();
    const wins = pack.windows || [];
    for (let i = 0; i < wins.length; i++) {
      const w = wins[i];
      if (mo === w.m && day >= w.d0 && day <= w.d1) return true;
    }
    return false;
  }

  function seasonalEligible(pack, bestScore, dateObj) {
    if (!pack) return false;
    if (seasonalInWindow(pack, dateObj)) return true;
    const best = bestScore | 0;
    return !!(pack.milestoneScore && best >= pack.milestoneScore);
  }

  const SKINS = BIRDS; // legacy alias

  const BIRD_COLORS = {
    sparrow: { body: '#c4a35a', wing: '#8b6914', beak: '#ff6b6b', eye: '#111' },
    parrot: { body: '#2ecc71', wing: '#27ae60', beak: '#f39c12', eye: '#111', crest: '#e74c3c' },
    eagle: { body: '#8d6e63', wing: '#5d4037', beak: '#ffd93d', eye: '#111' },
    chick: { body: '#ffd93d', wing: '#f0a500', beak: '#ff6b6b', eye: '#111' },
    owl: { body: '#a1887f', wing: '#6d4c41', beak: '#ffd93d', eye: '#fff', pupil: '#111' },
    funny: { body: '#ff6b6b', wing: '#4ecdc4', beak: '#ffd93d', eye: '#111', shades: true },
    mynah: { body: '#4a4a4a', wing: '#2c2c2c', beak: '#f39c12', eye: '#111', cheek: '#f5b7b1' },
    bulbul: { body: '#6d4c41', wing: '#5d4037', beak: '#ff6b6b', eye: '#111', crest: '#111' },
    cheel: { body: '#8d6e63', wing: '#5d4037', beak: '#e67e22', eye: '#111' },
    mor: { body: '#1abc9c', wing: '#16a085', beak: '#f39c12', eye: '#111', crest: '#9b59b6', tail: true },
    kawwa: { body: '#2c3e50', wing: '#1a252f', beak: '#7f8c8d', eye: '#111' },
    kabootar: { body: '#95a5a6', wing: '#7f8c8d', beak: '#e74c3c', eye: '#111', neck: '#9b59b6' },
    hoopoe: { body: '#c0392b', wing: '#f5b041', beak: '#2c3e50', eye: '#111', crest: '#f1c40f' },
    falcon: { body: '#7f8c8d', wing: '#566573', beak: '#f39c12', eye: '#111' },
    jungle: { body: '#27ae60', wing: '#1e8449', beak: '#f39c12', eye: '#111', crest: '#e74c3c', leaf: true },
    alpine: { body: '#ecf0f1', wing: '#85929e', beak: '#e67e22', eye: '#111', snow: true },
    seagull: { body: '#f5f6fa', wing: '#5dade2', beak: '#f1c40f', eye: '#111', sea: true }
  };

  function shadeColor(hex, amt) {
    if (!hex || hex[0] !== '#') return hex || '#888';
    var h = hex.length === 4
      ? '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3]
      : hex;
    var n = parseInt(h.slice(1), 16);
    if (isNaN(n)) return hex;
    var r = Math.max(0, Math.min(255, (n >> 16) + amt));
    var g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
    var b = Math.max(0, Math.min(255, (n & 255) + amt));
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  /** Pseudo-3D bird: flapping wings + moveable head + mouth open/close. Visual only — hitbox body-only. */
  function drawBirdBody(ctx, id, scale, opts) {
    opts = opts || {};
    const c = BIRD_COLORS[id] || BIRD_COLORS.sparrow;
    const s = scale == null ? 1 : scale;
    const wingFlap = opts.wingFlap || 0; // radians-ish, ~-1..1
    const wingLag = opts.wingLag != null ? opts.wingLag : -wingFlap * 0.85;
    const tipFlutter = opts.tipFlutter || 0;
    const headTilt = opts.headTilt || 0;
    const headBob = opts.headBob || 0;
    const mouthOpen = Math.max(0, Math.min(1, opts.mouthOpen || 0));
    const tailWag = opts.tailWag || 0;
    const eyeBlink = Math.max(0, Math.min(1, opts.eyeBlink || 0));
    const animT = opts.animT || 0;
    ctx.scale(s, s);

    // 3.23: soft contact shadow — larger/darker near ground (shadowProx 0..1)
    var sp = Math.max(0.12, Math.min(1, opts.shadowProx != null ? opts.shadowProx : 0.55));
    var shY = 12 + (1 - sp) * 2;
    ctx.fillStyle = 'rgba(15,23,42,' + (0.10 + 0.22 * sp).toFixed(3) + ')';
    ctx.beginPath();
    ctx.ellipse(1, shY, 10 + 8 * sp, 2.2 + 2.2 * sp, 0, 0, Math.PI * 2);
    ctx.fill();
    // Soft outer penumbra
    ctx.fillStyle = 'rgba(15,23,42,' + (0.04 + 0.08 * sp).toFixed(3) + ')';
    ctx.beginPath();
    ctx.ellipse(1, shY + 0.5, 14 + 6 * sp, 3.2 + 1.4 * sp, 0, 0, Math.PI * 2);
    ctx.fill();

    // Tail silhouette first (behind body) — wag with velocity / idle (3.11)
    ctx.save();
    ctx.translate(-12, 2);
    ctx.rotate(tailWag * 0.35);
    ctx.translate(12, -2);
    ctx.fillStyle = shadeColor(c.wing, -18);
    ctx.beginPath();
    if (id === 'cheel' || id === 'falcon') {
      ctx.moveTo(-12, 2); ctx.lineTo(-26, -5); ctx.lineTo(-21, 2); ctx.lineTo(-27, 8); ctx.closePath();
    } else {
      ctx.moveTo(-12, 1); ctx.lineTo(-25, -5); ctx.lineTo(-22, 6); ctx.closePath();
    }
    ctx.fill();
    // Tail depth rim
    ctx.strokeStyle = 'rgba(255,255,255,.22)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-14, 0); ctx.lineTo(-22, -2);
    ctx.stroke();

    if (c.tail || id === 'mor') {
      ctx.fillStyle = '#156f78';
      for (let ti = 0; ti < 3; ti++) {
        ctx.beginPath();
        ctx.ellipse(-22 - ti * 3, -4 + ti * 5, 13, 5, -.25 + ti * .2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = ti === 1 ? '#f1c40f' : '#9b59b6';
        ctx.beginPath(); ctx.arc(-30 - ti * 2, -5 + ti * 5, 2.4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#156f78';
      }
    }

    ctx.restore(); // end tail wag group

    // FAR wing (behind body) — lagged phase + tip flutter (3.11)
    drawWing(ctx, c, wingLag, true, tipFlutter * 0.7);

    // Body ellipsoid with top-lit 2.5D shading
    const bodyGrad = ctx.createRadialGradient(-4, -5, 2, 0, 0, 18);
    bodyGrad.addColorStop(0, shadeColor(c.body, 42));
    bodyGrad.addColorStop(0.45, c.body);
    bodyGrad.addColorStop(1, shadeColor(c.body, -38));
    ctx.fillStyle = bodyGrad;
    ctx.strokeStyle = 'rgba(15,23,42,.48)';
    ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.ellipse(0, 0, 16, 12, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    // Specular rim (left-top)
    ctx.strokeStyle = 'rgba(255,255,255,.38)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(-2, -3, 11, 7, -0.35, Math.PI * 0.85, Math.PI * 1.55);
    ctx.stroke();
    // Belly occlude shadow
    ctx.fillStyle = 'rgba(15,23,42,.14)';
    ctx.beginPath(); ctx.ellipse(2, 5, 10, 5, 0.1, 0, Math.PI * 2); ctx.fill();

    // Species markings (body surface)
    if (id === 'sparrow') {
      ctx.fillStyle = '#ead8a6'; ctx.beginPath(); ctx.ellipse(5, 3, 9, 7, -.15, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#6f5124'; ctx.beginPath(); ctx.arc(5, -5, 7, Math.PI, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#3f2d17'; ctx.beginPath(); ctx.moveTo(3,-2); ctx.lineTo(10,0); ctx.lineTo(5,3); ctx.closePath(); ctx.fill();
    } else if (id === 'eagle') {
      ctx.fillStyle = '#f5f1df'; ctx.beginPath(); ctx.ellipse(9, -2, 9, 9, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f5f1df'; for (let ei=0; ei<3; ei++) { ctx.beginPath(); ctx.moveTo(1+ei*3,4); ctx.lineTo(4+ei*3,8); ctx.lineTo(7+ei*3,3); ctx.fill(); }
    } else if (id === 'mynah') {
      ctx.fillStyle = '#f1c40f'; ctx.beginPath(); ctx.ellipse(9, -4, 6, 4, -.15, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.fillRect(-8, 3, 8, 3);
    } else if (id === 'bulbul') {
      ctx.fillStyle = '#f4e3c1'; ctx.beginPath(); ctx.ellipse(5, 4, 8, 6, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#d63031'; ctx.beginPath(); ctx.ellipse(-7, 7, 5, 3, 0, 0, Math.PI*2); ctx.fill();
    } else if (id === 'kabootar') {
      ctx.fillStyle = '#2ecc71'; ctx.beginPath(); ctx.ellipse(6, 3, 5, 7, -.4, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = '#566573'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-5,-7); ctx.lineTo(-10,7); ctx.stroke();
    } else if (id === 'falcon') {
      ctx.fillStyle = '#ecf0f1'; ctx.beginPath(); ctx.ellipse(8, -1, 8, 8, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#34495e'; ctx.beginPath(); ctx.moveTo(5,-7); ctx.lineTo(9,1); ctx.lineTo(12,-6); ctx.closePath(); ctx.fill();
    } else if (id === 'hoopoe') {
      ctx.strokeStyle = '#2c3e50'; ctx.lineWidth = 1.6; for (let hi=0; hi<3; hi++) { ctx.beginPath(); ctx.moveTo(-8+hi*4,-8); ctx.lineTo(-13+hi*6,-17-hi); ctx.stroke(); }
    } else if (id === 'kawwa') {
      ctx.fillStyle = 'rgba(93,173,226,.35)'; ctx.beginPath(); ctx.ellipse(-3,-3,8,3,-.25,0,Math.PI*2); ctx.fill();
    } else if (id === 'jungle') {
      ctx.fillStyle = '#f1c40f'; ctx.beginPath(); ctx.ellipse(6, 3, 7, 5, -.2, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#145a32';
      for (var ji = 0; ji < 3; ji++) {
        ctx.beginPath();
        ctx.ellipse(-6 - ji * 3, -8 + ji * 2, 5, 2.2, -0.5 + ji * 0.15, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#e74c3c'; ctx.beginPath(); ctx.arc(-2, 6, 2.2, 0, Math.PI*2); ctx.fill();
    } else if (id === 'alpine') {
      ctx.fillStyle = '#d5d8dc'; ctx.beginPath(); ctx.ellipse(4, 3, 9, 6, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#fff';
      for (var ai = 0; ai < 4; ai++) {
        ctx.beginPath(); ctx.arc(-8 + ai * 5, -6 + (ai % 2), 1.8, 0, Math.PI*2); ctx.fill();
      }
      ctx.fillStyle = '#5d6d7e'; ctx.beginPath(); ctx.moveTo(-10,2); ctx.lineTo(-4,8); ctx.lineTo(2,1); ctx.closePath(); ctx.fill();
    } else if (id === 'seagull') {
      ctx.fillStyle = '#d6eaf8'; ctx.beginPath(); ctx.ellipse(5, 4, 8, 5, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#2c3e50'; ctx.beginPath(); ctx.moveTo(2,-6); ctx.lineTo(12,-2); ctx.lineTo(4,0); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(52,152,219,.55)'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(-10,2); ctx.quadraticCurveTo(-2,8,8,4); ctx.stroke();
    }

    // NEAR wing (in front) — primary flap + tip flutter (3.11)
    drawWing(ctx, c, wingFlap, false, tipFlutter);

    // Moveable head group: tilts / bobs with velocity look-direction + chirp bob
    ctx.save();
    ctx.translate(6, -2 + (opts.reduceMotion ? 0 : headBob * 0.35));
    ctx.rotate(headTilt);
    // subtle idle bob + stronger when chirping
    ctx.translate(0, Math.sin(animT * 9) * (opts.reduceMotion ? 0 : 0.7) - mouthOpen * 0.8);

    // Head sphere with depth
    const headGrad = ctx.createRadialGradient(-2, -3, 1, 2, 0, 11);
    headGrad.addColorStop(0, shadeColor(c.body, 36));
    headGrad.addColorStop(1, shadeColor(c.body, -22));
    ctx.fillStyle = headGrad;
    ctx.beginPath(); ctx.ellipse(4, 0, 9, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(15,23,42,.3)';
    ctx.lineWidth = 1;
    ctx.stroke();
    // Neck join shadow + top specular for rounder 3D head
    ctx.fillStyle = 'rgba(15,23,42,.16)';
    ctx.beginPath(); ctx.ellipse(0, 5, 5, 2.2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.35)';
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.ellipse(2, -3, 5.5, 3.5, -0.4, Math.PI * 0.9, Math.PI * 1.55); ctx.stroke();

    if (c.crest) {
      ctx.fillStyle = c.crest; ctx.beginPath();
      if (id === 'bulbul') { ctx.moveTo(-3,-7); ctx.lineTo(0,-18); ctx.lineTo(5,-8); }
      else if (id === 'jungle') { ctx.moveTo(-2,-7); ctx.lineTo(1,-17); ctx.lineTo(6,-8); }
      else { ctx.moveTo(-3,-7); ctx.lineTo(2,-16); ctx.lineTo(7,-7); }
      ctx.closePath(); ctx.fill();
      if (id === 'jungle') {
        ctx.fillStyle = '#1e8449';
        ctx.beginPath(); ctx.ellipse(-1, -14, 4, 2, -0.6, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(4, -15, 3.5, 1.8, 0.4, 0, Math.PI*2); ctx.fill();
      }
    }
    if (c.snow) {
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.ellipse(2, -8, 7, 2.5, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = 'rgba(174,214,241,.7)';
      ctx.beginPath(); ctx.arc(8, -4, 1.6, 0, Math.PI*2); ctx.fill();
    }
    if (c.sea) {
      ctx.fillStyle = '#2c3e50';
      ctx.fillRect(1, -5, 10, 1.6);
      ctx.fillStyle = '#5dade2';
      ctx.beginPath(); ctx.ellipse(3, 5, 4, 1.5, 0, 0, Math.PI*2); ctx.fill();
    }
    if (c.cheek) { ctx.fillStyle = c.cheek; ctx.beginPath(); ctx.arc(3, 3, 3.2, 0, Math.PI*2); ctx.fill(); }

    if (id === 'owl') {
      ctx.fillStyle = '#e6d7bd'; ctx.beginPath(); ctx.arc(1,-1,6.5,0,Math.PI*2); ctx.arc(8,-1,6.5,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(1,-1,4.5,0,Math.PI*2); ctx.arc(8,-1,4.5,0,Math.PI*2); ctx.fill();
      // pupils look slightly with tilt
      const look = headTilt * 3;
      ctx.fillStyle = c.pupil || '#111'; ctx.beginPath(); ctx.arc(2+look,-1,2,0,Math.PI*2); ctx.arc(9+look,-1,2,0,Math.PI*2); ctx.fill();
      if (eyeBlink > 0.05) {
        ctx.fillStyle = shadeColor(c.body, -10);
        ctx.beginPath(); ctx.ellipse(1, -1, 4.6, 4.5 * eyeBlink, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(8, -1, 4.6, 4.5 * eyeBlink, 0, 0, Math.PI * 2); ctx.fill();
      }
    } else {
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(5,-2,4.4,0,Math.PI*2); ctx.fill();
      const look = headTilt * 2.5;
      ctx.fillStyle = c.eye; ctx.beginPath(); ctx.arc(6.2+look,-2,2,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(6.9+look,-2.7,.65,0,Math.PI*2); ctx.fill();
      if (eyeBlink > 0.05) {
        ctx.fillStyle = shadeColor(c.body, -8);
        ctx.beginPath(); ctx.ellipse(5.5, -2, 4.6, 4.4 * eyeBlink, 0, 0, Math.PI * 2); ctx.fill();
      }
    }
    if (c.shades) {
      ctx.fillStyle = '#111'; ctx.fillRect(0,-5,13,4.5); ctx.fillStyle = '#4ecdc4'; ctx.fillRect(1,-4,4.5,2.5); ctx.fillRect(7.5,-4,4.5,2.5);
    }
    // Beak / mouth — opens on chirp (tap / near-miss / gift); visual only
    ctx.fillStyle = c.beak;
    ctx.strokeStyle = 'rgba(15,23,42,.35)';
    ctx.lineWidth = 1;
    const jaw = mouthOpen * 4.2;
    // Upper mandible
    ctx.beginPath();
    ctx.moveTo(10, 1 - mouthOpen * 0.6);
    ctx.lineTo(20, 3 - jaw * 0.35);
    ctx.lineTo(10, 2.4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = shadeColor(c.beak, 30);
    ctx.beginPath();
    ctx.moveTo(10, 1 - mouthOpen * 0.6);
    ctx.lineTo(20, 3 - jaw * 0.35);
    ctx.lineTo(10, 1.6);
    ctx.closePath();
    ctx.fill();
    // Lower mandible (drops when mouthOpen)
    ctx.fillStyle = shadeColor(c.beak, -12);
    ctx.beginPath();
    ctx.moveTo(10, 2.6);
    ctx.lineTo(19.2, 3 + jaw * 0.55);
    ctx.lineTo(10, 5.5 + jaw);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Mouth cavity when open
    if (mouthOpen > 0.15) {
      ctx.fillStyle = 'rgba(60,20,30,' + (0.35 + mouthOpen * 0.4) + ')';
      ctx.beginPath();
      ctx.moveTo(11, 2.4);
      ctx.lineTo(17.5, 3 + jaw * 0.1);
      ctx.lineTo(11, 4.2 + jaw * 0.7);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  function drawWing(ctx, c, flap, far, tipFlutter) {
    tipFlutter = tipFlutter || 0;
    ctx.save();
    // Pivot near shoulder — 3.11 flap (scaleY + rotate + tip lift + flutter)
    const px = far ? -5 : -2;
    const py = far ? 0 : 1;
    ctx.translate(px, py);
    const ang = flap * (far ? 0.78 : 1.22) + tipFlutter * (far ? 0.35 : 0.55);
    ctx.rotate(-0.38 + ang * 0.52);
    const sy = Math.max(0.20, Math.cos(ang * 1.08));
    ctx.scale(far ? 0.94 : 1.08, sy * (far ? 0.86 : 1));
    // Tip rises on upstroke + micro flutter
    ctx.translate(0, -Math.sin(Math.max(0, ang)) * (far ? 1.7 : 3.1) - tipFlutter * (far ? 0.6 : 1.1));
    if (far) ctx.globalAlpha = 0.72;

    const wingGrad = ctx.createLinearGradient(-12, -6, 8, 8);
    wingGrad.addColorStop(0, shadeColor(c.wing, far ? -10 : 28));
    wingGrad.addColorStop(0.55, c.wing);
    wingGrad.addColorStop(1, shadeColor(c.wing, -40));
    ctx.fillStyle = wingGrad;
    ctx.strokeStyle = 'rgba(15,23,42,.4)';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-6, -8, -16, -4);
    ctx.quadraticCurveTo(-20, 2, -12, 8);
    ctx.quadraticCurveTo(-4, 7, 2, 3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Feather bars (layered for pseudo-3D depth)
    ctx.strokeStyle = 'rgba(255,255,255,.42)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-3, -1); ctx.quadraticCurveTo(-10, 1, -15, 0);
    ctx.moveTo(-2, 2); ctx.quadraticCurveTo(-9, 4, -13, 5);
    ctx.moveTo(-1, 4); ctx.quadraticCurveTo(-7, 6, -11, 7);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(15,23,42,.22)';
    ctx.beginPath();
    ctx.moveTo(-4, 0); ctx.quadraticCurveTo(-11, 3, -16, 2);
    ctx.stroke();
    // Tip highlight + secondary vane + tertiary flutter vane (3.11)
    ctx.fillStyle = 'rgba(255,255,255,.26)';
    ctx.beginPath(); ctx.ellipse(-14, -2, 3.2, 1.7, -0.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.12)';
    ctx.beginPath(); ctx.ellipse(-8, 3, 4, 1.4, 0.2, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.28)';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(-5, -3); ctx.quadraticCurveTo(-12, -6 - tipFlutter * 2, -18, -1);
    ctx.stroke();

    ctx.restore();
  }

  function drawHat(ctx, hatId) {
    if (!hatId || hatId === 'none') return;
    if (hatId === 'sunglasses') {
      ctx.fillStyle = '#111';
      ctx.fillRect(3, -7, 16, 5);
      ctx.fillStyle = '#1abc9c';
      ctx.fillRect(4, -6, 6, 3);
      ctx.fillRect(12, -6, 6, 3);
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(3, -4); ctx.lineTo(-2, -2);
      ctx.stroke();
    } else if (hatId === 'topi') {
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.ellipse(0, -14, 14, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e74c3c';
      ctx.fillRect(-10, -22, 20, 10);
    } else if (hatId === 'cap') {
      ctx.fillStyle = '#3498db';
      ctx.beginPath();
      ctx.ellipse(2, -13, 12, 5, 0, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(8, -14, 12, 3);
    } else if (hatId === 'hat') {
      ctx.fillStyle = '#5d4037';
      ctx.beginPath();
      ctx.ellipse(0, -12, 16, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#6d4c41';
      ctx.fillRect(-8, -22, 16, 12);
    } else if (hatId === 'helmet') {
      ctx.fillStyle = '#e74c3c';
      ctx.beginPath();
      ctx.ellipse(0, -14, 14, 10, 0, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.fillRect(-4, -18, 8, 3);
    } else if (hatId === 'scarf') {
      ctx.fillStyle = '#e74c3c';
      ctx.beginPath();
      ctx.ellipse(0, 8, 12, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(6, 6, 6, 16);
      ctx.fillStyle = '#ffd93d';
      ctx.fillRect(7, 14, 4, 3);
    } else if (hatId === 'crown') {
      ctx.fillStyle = '#ffd93d';
      ctx.beginPath();
      ctx.moveTo(-10, -12);
      ctx.lineTo(-8, -22);
      ctx.lineTo(-2, -14);
      ctx.lineTo(2, -24);
      ctx.lineTo(6, -14);
      ctx.lineTo(10, -22);
      ctx.lineTo(12, -12);
      ctx.closePath();
      ctx.fill();
    } else if (hatId === 'ind_topi') {
      ctx.fillStyle = '#006600';
      ctx.fillRect(-12, -22, 24, 12);
      ctx.fillStyle = '#fff';
      ctx.fillRect(-12, -16, 24, 4);
      ctx.beginPath();
      ctx.arc(0, -16, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (hatId === 'eid_sparkle') {
      ctx.fillStyle = '#f1c40f';
      ctx.beginPath();
      ctx.arc(0, -18, 8, 0.2, Math.PI * 1.6);
      ctx.lineTo(0, -18);
      ctx.fill();
      ctx.fillStyle = '#fff';
      for (let si = 0; si < 4; si++) {
        ctx.fillRect(-10 + si * 7, -26, 2, 2);
      }
    } else if (hatId === 'winter_shawl') {
      ctx.fillStyle = '#5dade2';
      ctx.beginPath();
      ctx.ellipse(0, 10, 14, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(8, 8, 8, 18);
      ctx.fillStyle = '#ebf5fb';
      ctx.fillRect(9, 16, 6, 4);
    } else if (hatId === 'basant_pagri') {
      ctx.fillStyle = '#e74c3c';
      ctx.beginPath();
      ctx.ellipse(0, -14, 14, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f1c40f';
      ctx.fillRect(-10, -20, 20, 6);
      ctx.fillStyle = '#3498db';
      ctx.beginPath();
      ctx.moveTo(10, -18);
      ctx.lineTo(22, -28);
      ctx.lineTo(18, -14);
      ctx.closePath();
      ctx.fill();
    }
  }

  function drawVehicleUnder(ctx, vid, opts) {
    if (!vid || vid === 'none') return;
    opts = opts || {};
    const wheelRot = opts.wheelRot || 0;
    const bob = opts.vehBob || 0;
    const lean = opts.vehLean || 0;
    const animT = opts.animT || 0;
    ctx.save();
    ctx.translate(0, 14 + bob);
    ctx.rotate(lean); // pitch with bird rise/fall (3.11)
    // Slight perspective foreshortening (2.5D)
    ctx.scale(0.85, 0.82);
    ctx.transform(1, 0, -0.08, 1, 0, 0);

    function wheel(x, y, r) {
      ctx.save();
      ctx.translate(x, y);
      // Tire shadow
      ctx.fillStyle = 'rgba(15,23,42,.25)';
      ctx.beginPath(); ctx.ellipse(1.5, 1.5, r, r * 0.85, 0, 0, Math.PI * 2); ctx.fill();
      // Tire body with depth
      const wg = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 1, 0, 0, r);
      wg.addColorStop(0, '#444');
      wg.addColorStop(1, '#0a0a0a');
      ctx.fillStyle = wg;
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#d0d5dd'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(0, 0, r - 1.4, 0, Math.PI * 2); ctx.stroke();
      // Spinning spokes
      ctx.rotate(wheelRot);
      ctx.strokeStyle = 'rgba(255,255,255,.4)';
      ctx.lineWidth = 1.2;
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(i * Math.PI / 2) * (r - 2.5), Math.sin(i * Math.PI / 2) * (r - 2.5));
        ctx.stroke();
      }
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath(); ctx.arc(0, 0, 2, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    function bodyShade(base, x0, y0, x1, y1) {
      const g = ctx.createLinearGradient(x0, y0, x1, y1);
      g.addColorStop(0, shadeColor(base, 35));
      g.addColorStop(0.45, base);
      g.addColorStop(1, shadeColor(base, -45));
      return g;
    }

    if (vid === 'rickshaw' || vid === 'chingchi') {
      const body = vid === 'chingchi' ? '#8e44ad' : '#e74c3c';
      const trim = vid === 'chingchi' ? '#f5b041' : '#ffd93d';
      const canopyBob = Math.sin(animT * 5) * 1.2;
      ctx.fillStyle = bodyShade(body, -20, -12, 22, 10);
      ctx.strokeStyle = 'rgba(15,23,42,.45)'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(-20,-10); ctx.lineTo(14,-10); ctx.quadraticCurveTo(22,-8,22,0); ctx.lineTo(22,8); ctx.lineTo(-20,8); ctx.closePath(); ctx.fill(); ctx.stroke();
      // Side depth panel
      ctx.fillStyle = 'rgba(15,23,42,.18)';
      ctx.fillRect(-20, 2, 42, 6);
      ctx.fillStyle = 'rgba(173,216,230,.75)'; ctx.fillRect(-8,-8,16,7);
      ctx.fillStyle = trim; ctx.fillRect(-18,-12,30,3); ctx.fillRect(-18,5,30,2);
      ctx.fillStyle = '#222'; ctx.fillRect(-20,-8,5,12);
      ctx.strokeStyle = '#f8fafc'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-4,-10); ctx.lineTo(-4,-18 + canopyBob); ctx.lineTo(8,-18 + canopyBob); ctx.stroke();
      ctx.fillStyle = trim; ctx.beginPath(); ctx.ellipse(2,-18 + canopyBob,12,3,0,0,Math.PI*2); ctx.fill();
      // Canopy highlight
      ctx.fillStyle = 'rgba(255,255,255,.28)';
      ctx.beginPath(); ctx.ellipse(0, -19 + canopyBob, 7, 1.4, 0, 0, Math.PI * 2); ctx.fill();
      wheel(-8, 10, 6); wheel(14, 10, 6);
      // Exhaust puff (3.11)
      if (!opts.reduceMotion) {
        const ex = 0.5 + 0.5 * Math.sin(animT * 11);
        ctx.globalAlpha = 0.25 + ex * 0.35;
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath(); ctx.ellipse(-22 - ex * 4, 2, 3 + ex * 2, 2 + ex, 0, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
      }
    } else if (vid === 'cycle' || vid === 'bicycle') {
      const col = vid === 'bicycle' ? '#27ae60' : '#1abc9c';
      ctx.strokeStyle = col; ctx.lineWidth = 2.6; ctx.lineJoin = 'round';
      wheel(-12, 6, 7); wheel(12, 6, 7);
      ctx.beginPath();
      ctx.moveTo(-12,6); ctx.lineTo(0,-3); ctx.lineTo(12,6);
      ctx.moveTo(0,-3); ctx.lineTo(0,5);
      ctx.moveTo(-2,5); ctx.lineTo(8,-8);
      ctx.moveTo(8,-8); ctx.lineTo(14,-4);
      ctx.moveTo(-2,5); ctx.lineTo(-8,-2);
      ctx.stroke();
      // Frame highlight
      ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(-10, 4); ctx.lineTo(-1, -2); ctx.stroke();
      ctx.fillStyle = '#2c3e50'; ctx.fillRect(-4,-5,8,2.5);
      ctx.strokeStyle = '#95a5a6'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(8,-8); ctx.lineTo(16,-10); ctx.stroke();
    } else if (vid === 'bike' || vid === 'scooty') {
      const body = vid === 'scooty' ? '#e91e63' : '#2c3e50';
      ctx.fillStyle = bodyShade(body, -16, -8, 14, 8);
      ctx.strokeStyle = 'rgba(15,23,42,.4)'; ctx.lineWidth = 1.1;
      ctx.beginPath(); ctx.moveTo(-16,-1); ctx.lineTo(-16,-4); ctx.lineTo(12,-4); ctx.lineTo(14,6); ctx.lineTo(-16,6); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.fillRect(-14, -3, 20, 1.5);
      ctx.fillStyle = '#111'; ctx.fillRect(-4,-8,10,5);
      ctx.strokeStyle = '#bdc3c7'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(8,-2); ctx.lineTo(14,-11); ctx.lineTo(18,-9); ctx.stroke();
      wheel(-10, 8, 6); wheel(12, 8, 6);
      if (vid === 'scooty') { ctx.fillStyle = '#fff'; ctx.fillRect(6,-7,5,3); }
      if (!opts.reduceMotion) {
        const ex = 0.5 + 0.5 * Math.sin(animT * 13);
        ctx.globalAlpha = 0.22 + ex * 0.3;
        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath(); ctx.ellipse(-18 - ex * 3, 4, 2.5 + ex * 2, 1.8 + ex, 0, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
      }
    } else if (vid === 'taxi' || vid === 'mehran') {
      const body = vid === 'taxi' ? '#f1c40f' : '#ecf0f1';
      ctx.fillStyle = bodyShade(body, -22, -14, 22, 8);
      ctx.strokeStyle = 'rgba(15,23,42,.45)'; ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-22,6); ctx.lineTo(-20,-4); ctx.quadraticCurveTo(-18,-8,-10,-8);
      ctx.lineTo(8,-8); ctx.quadraticCurveTo(14,-8,16,-4); ctx.lineTo(22,6); ctx.closePath();
      ctx.fill(); ctx.stroke();
      // Roof depth
      ctx.fillStyle = shadeColor(body, -25);
      ctx.beginPath(); ctx.moveTo(-10,-8); ctx.lineTo(-6,-14); ctx.lineTo(6,-14); ctx.lineTo(10,-8); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#5dade2';
      ctx.beginPath(); ctx.moveTo(-9,-8); ctx.lineTo(-5.5,-13); ctx.lineTo(5.5,-13); ctx.lineTo(9,-8); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(-5,-12.5,4,3.5); ctx.fillRect(1,-12.5,4,3.5);
      ctx.fillStyle = '#111'; ctx.fillRect(-22,0,5,3); ctx.fillRect(17,0,5,3);
      // Under-body shadow
      ctx.fillStyle = 'rgba(15,23,42,.2)'; ctx.fillRect(-20, 5, 40, 2);
      if (vid === 'mehran') {
        ctx.fillStyle = '#7f8c8d'; ctx.fillRect(-18,-3,8,3); ctx.fillRect(4,-3,8,3);
        ctx.strokeStyle = '#95a5a6'; ctx.lineWidth = 1; ctx.strokeRect(-12,-7,10,5);
      }
      if (vid === 'taxi') {
        ctx.fillStyle = '#111'; ctx.font = 'bold 7px system-ui'; ctx.textAlign = 'center'; ctx.fillText('TAXI', 0, 2);
        ctx.fillStyle = '#e74c3c'; ctx.fillRect(-3,-17,6,3);
      }
      wheel(-12, 10, 5); wheel(12, 10, 5);
    } else if (vid === 'bus') {
      ctx.fillStyle = bodyShade('#27ae60', -24, -12, 24, 10);
      ctx.strokeStyle = 'rgba(15,23,42,.4)'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(-24,8); ctx.lineTo(-22,-10); ctx.lineTo(22,-10); ctx.lineTo(24,8); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(15,23,42,.15)'; ctx.fillRect(-24, 4, 48, 4);
      ctx.fillStyle = '#ecf0f1'; for (let i = 0; i < 3; i++) ctx.fillRect(-16 + i * 12, -6, 8, 6);
      ctx.fillStyle = '#f1c40f'; ctx.fillRect(-24,2,48,2);
      wheel(-14, 10, 5); wheel(14, 10, 5);
    } else if (vid === 'tractor') {
      ctx.fillStyle = bodyShade('#e67e22', -14, -14, 14, 8);
      ctx.fillRect(-14, -8, 24, 14);
      ctx.fillStyle = '#f5b041'; ctx.fillRect(-4, -14, 12, 8);
      ctx.fillStyle = '#3498db'; ctx.fillRect(-2, -12, 6, 5);
      ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(-12, -6, 18, 2);
      wheel(-10, 10, 8); wheel(12, 8, 5);
    } else if (vid === 'truck') {
      ctx.fillStyle = bodyShade('#2980b9', -22, -12, 20, 10);
      ctx.fillRect(-22, -8, 26, 16);
      ctx.fillStyle = bodyShade('#3498db', 4, -14, 20, 10);
      ctx.fillRect(4, -12, 16, 20);
      ctx.fillStyle = '#ecf0f1'; ctx.fillRect(7, -8, 8, 6);
      ctx.fillStyle = '#f1c40f'; ctx.fillRect(-22, 4, 26, 2);
      ctx.fillStyle = 'rgba(15,23,42,.18)'; ctx.fillRect(-22, 6, 42, 2);
      wheel(-14, 10, 5); wheel(2, 10, 5); wheel(14, 10, 5);
    } else if (vid === 'jungle_rickshaw') {
      const canopyBob = Math.sin(animT * 5) * 1.2;
      ctx.fillStyle = bodyShade('#1e8449', -20, -12, 22, 10);
      ctx.strokeStyle = 'rgba(15,23,42,.45)'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(-20,-10); ctx.lineTo(14,-10); ctx.quadraticCurveTo(22,-8,22,0); ctx.lineTo(22,8); ctx.lineTo(-20,8); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(15,23,42,.16)'; ctx.fillRect(-20, 2, 42, 6);
      ctx.fillStyle = 'rgba(173,216,230,.7)'; ctx.fillRect(-8,-8,16,7);
      ctx.fillStyle = '#f1c40f'; ctx.fillRect(-18,-12,30,3); ctx.fillRect(-18,5,30,2);
      // Leaf accents
      ctx.fillStyle = '#27ae60';
      for (let li = 0; li < 4; li++) {
        ctx.beginPath();
        ctx.ellipse(-14 + li * 9, -14 + (li % 2), 5, 2.4, -0.4 + li * 0.1, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#145a32'; ctx.fillRect(-20,-8,5,12);
      ctx.strokeStyle = '#a9dfbf'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-4,-10); ctx.lineTo(-4,-18 + canopyBob); ctx.lineTo(8,-18 + canopyBob); ctx.stroke();
      ctx.fillStyle = '#58d68d'; ctx.beginPath(); ctx.ellipse(2,-18 + canopyBob,12,3.4,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = '#196f3d';
      ctx.beginPath(); ctx.ellipse(-4, -19 + canopyBob, 4, 2, -0.5, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(6, -20 + canopyBob, 3.5, 1.8, 0.3, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.25)';
      ctx.beginPath(); ctx.ellipse(0, -19.5 + canopyBob, 6, 1.2, 0, 0, Math.PI * 2); ctx.fill();
      wheel(-8, 10, 6); wheel(14, 10, 6);
    } else if (vid === 'snow_bike') {
      ctx.fillStyle = bodyShade('#d6eaf8', -16, -8, 14, 8);
      ctx.strokeStyle = 'rgba(15,23,42,.35)'; ctx.lineWidth = 1.1;
      ctx.beginPath(); ctx.moveTo(-16,-1); ctx.lineTo(-16,-4); ctx.lineTo(12,-4); ctx.lineTo(14,6); ctx.lineTo(-16,6); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.fillRect(-14, -3, 20, 2);
      ctx.fillStyle = '#5dade2'; ctx.fillRect(-4,-8,10,5);
      ctx.fillStyle = '#85929e'; ctx.fillRect(-14, 3, 22, 2);
      // Snow dust on nose
      ctx.fillStyle = 'rgba(255,255,255,.85)';
      ctx.beginPath(); ctx.arc(10, -5, 2, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(-12, -2, 1.5, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = '#aab7b8'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(8,-2); ctx.lineTo(14,-11); ctx.lineTo(18,-9); ctx.stroke();
      wheel(-10, 8, 6); wheel(12, 8, 6);
    } else if (vid === 'sea_boat') {
      const wave = Math.sin(animT * 4) * 1.5;
      ctx.translate(0, wave * 0.3);
      ctx.fillStyle = bodyShade('#1a5276', -22, -6, 22, 10);
      ctx.beginPath();
      ctx.moveTo(-22, 4); ctx.quadraticCurveTo(-18, -6, 0, -8); ctx.quadraticCurveTo(18, -6, 24, 4);
      ctx.lineTo(18, 10); ctx.lineTo(-18, 10); ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#5dade2'; ctx.fillRect(-10, -6, 16, 5);
      ctx.fillStyle = '#f9e79f'; ctx.fillRect(-8, -4, 6, 3);
      // Mast + sail
      ctx.strokeStyle = '#f5f5f5'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(2, -6); ctx.lineTo(2, -20); ctx.stroke();
      ctx.fillStyle = 'rgba(236,240,241,.9)';
      ctx.beginPath(); ctx.moveTo(2, -18); ctx.lineTo(14, -10); ctx.lineTo(2, -8); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#148f77'; ctx.fillRect(-20, 6, 40, 2);
      // Foam floats instead of wheels
      ctx.fillStyle = '#ecf0f1';
      ctx.beginPath(); ctx.ellipse(-10, 11, 7, 3, 0, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(12, 11, 7, 3, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = 'rgba(93,173,226,.45)';
      ctx.beginPath(); ctx.ellipse(0, 13 + wave * 0.2, 16, 2.5, 0, 0, Math.PI*2); ctx.fill();
    }

    // Optional theme accents overlay on any vehicle (matching bird theme)
    const theme = opts.vehicleTheme;
    if (theme && vid !== 'none') {
      if (theme === 'jungle') {
        ctx.fillStyle = 'rgba(39,174,96,.35)';
        ctx.fillRect(-18, -12, 8, 3);
        ctx.beginPath(); ctx.ellipse(10, -10, 4, 2, 0.3, 0, Math.PI*2); ctx.fill();
      } else if (theme === 'alpine') {
        ctx.fillStyle = 'rgba(255,255,255,.55)';
        ctx.fillRect(-16, -10, 14, 2);
        ctx.beginPath(); ctx.arc(8, -8, 2, 0, Math.PI*2); ctx.fill();
      } else if (theme === 'sea') {
        ctx.fillStyle = 'rgba(52,152,219,.4)';
        ctx.fillRect(-18, 6, 36, 2);
        ctx.beginPath(); ctx.ellipse(0, 10, 10, 2, 0, 0, Math.PI*2); ctx.fill();
      }
    }
    ctx.restore();
  }

  function draw(ctx, birdId, x, y, rot, scale, opts) {
    opts = opts || {};
    const vehicle = opts.vehicle || 'none';
    const hat = opts.hat || 'none';
    const giant = opts.giant ? 1.55 : 1;
    const squashX = opts.squashX != null ? opts.squashX : 1;
    const squashY = opts.squashY != null ? opts.squashY : 1;
    const sc = (scale == null ? 1 : scale) * giant;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot || 0);
    ctx.scale(squashX, squashY);
    if (vehicle !== 'none') drawVehicleUnder(ctx, vehicle, opts);
    ctx.save();
    drawBirdBody(ctx, birdId || 'sparrow', sc, opts);
    // Hats follow head tilt lightly
    ctx.save();
    if (!opts.reduceMotion && (opts.headTilt || opts.headBob || opts.mouthOpen)) {
      ctx.translate(6, -2 + (opts.headBob || 0) * 0.25);
      ctx.rotate((opts.headTilt || 0) * 0.7);
      ctx.translate(-6, 2);
    }
    drawHat(ctx, hat);
    ctx.restore();
    ctx.restore();
    ctx.restore();
  }

  /** Legacy draw API: draw(ctx, id, x, y, rot, scale) — id may be old skin */
  function drawLegacy(ctx, id, x, y, rot, scale) {
    const map = { bird: 'sparrow', bike: 'sparrow', rickshaw: 'sparrow', rocket: 'eagle' };
    const bird = map[id] || id;
    const vehicle = id === 'bike' ? 'bike' : id === 'rickshaw' ? 'rickshaw' : 'none';
    draw(ctx, bird, x, y, rot, scale, { vehicle: vehicle });
  }

  function hitbox(birdId, opts) {
    opts = opts || {};
    // Body-only hitbox (~25% smaller than drawn sprite). Wings / hats / mouth / trails ignored.
    let w = 15, h = 12;
    if (opts.vehicle && opts.vehicle !== 'none') {
      // Vehicle body only — ignore mirrors / spoilers visually larger than hitbox
      w = 21;
      h = 16;
    }
    if (opts.giant) {
      w = Math.round(w * 1.5);
      h = Math.round(h * 1.5);
    }
    return { w: w, h: h };
  }

  // ——— PK Obstacle drawing (cosmetic pipe replacements) ———
  const OBSTACLE_KINDS = [
    'pipe', 'kite', 'rickshaw', 'cycle', 'bus', 'signboard',
    'tree', 'construction', 'brick', 'wires', 'clothesline', 'truck',
    'mosaic', 'terracotta', 'neon_pipe', 'tiled', 'lattice', 'stripe'
  ];

  const AREA_OBSTACLES = {
    city: ['pipe', 'mosaic', 'neon_pipe', 'lattice', 'stripe', 'signboard', 'bus', 'rickshaw', 'construction'],
    bridge: ['pipe', 'tiled', 'lattice', 'wires', 'signboard', 'bus', 'truck'],
    mountains: ['pipe', 'terracotta', 'tree', 'brick', 'kite'],
    village: ['pipe', 'terracotta', 'tree', 'clothesline', 'cycle', 'kite'],
    rain: ['pipe', 'tiled', 'wires', 'signboard', 'bus'],
    night: ['pipe', 'neon_pipe', 'signboard', 'bus', 'wires', 'rickshaw'],
    desert: ['pipe', 'terracotta', 'brick', 'construction', 'truck'],
    lahore: ['pipe', 'mosaic', 'stripe', 'kite', 'rickshaw', 'signboard', 'bus'],
    islamabad: ['pipe', 'tiled', 'tree', 'signboard', 'kite'],
    karachi: ['pipe', 'neon_pipe', 'bus', 'signboard', 'rickshaw', 'truck'],
    murree: ['pipe', 'tree', 'kite', 'wires'],
    canal: ['pipe', 'wires', 'signboard', 'cycle', 'rickshaw'],
    hunza: ['pipe', 'tree', 'brick', 'kite'],
    gwadar: ['pipe', 'bus', 'signboard', 'truck', 'wires'],
    quetta: ['pipe', 'signboard', 'rickshaw', 'brick', 'wires'],
    monsoon: ['pipe', 'tree', 'clothesline', 'kite', 'wires'],
    oldcity: ['pipe', 'mosaic', 'terracotta', 'stripe', 'lattice', 'clothesline', 'brick', 'wires', 'signboard']
  };

  function pickObstacleKind(rng, areaId) {
    const pool = AREA_OBSTACLES[areaId] || AREA_OBSTACLES.city;
    const r = rng();
    // 3.14: fewer plain pipes — more patterned skins
    if (r < 0.16) return 'pipe';
    if (r < 0.28) {
      const fancy = ['mosaic', 'terracotta', 'neon_pipe', 'tiled', 'lattice', 'stripe'];
      return fancy[Math.floor(rng() * fancy.length)];
    }
    return pool[Math.floor(rng() * pool.length)];
  }

  function drawPipeSkin(ctx, p, pal, groundY, gap, skin) {
    skin = skin || 'pipe';
    const body = skin === 'terracotta' ? '#c0392b' :
      skin === 'mosaic' ? (pal.neon || '#1abc9c') :
      skin === 'neon_pipe' ? '#0f3460' :
      skin === 'tiled' ? '#5d6d7e' :
      skin === 'lattice' ? '#2c3e50' :
      skin === 'stripe' ? '#1a5276' : pal.pipe;
    const cap = skin === 'terracotta' ? '#e67e22' :
      skin === 'mosaic' ? '#f1c40f' :
      skin === 'neon_pipe' ? (pal.neon || '#4ecdc4') :
      skin === 'tiled' ? '#95a5a6' :
      skin === 'lattice' ? '#f39c12' :
      skin === 'stripe' ? '#e74c3c' : pal.pipeCap;
    function column(y0, y1) {
      const h = y1 - y0;
      if (h <= 0) return;
      ctx.fillStyle = body;
      ctx.fillRect(p.x, y0, p.w, h);
      // rivet / band details
      if (skin === 'pipe' || skin === 'tiled') {
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        for (let y = y0 + 10; y < y1 - 8; y += 18) ctx.fillRect(p.x + 4, y, p.w - 8, 3);
      } else if (skin === 'mosaic') {
        for (let y = y0 + 4; y < y1 - 4; y += 10) {
          for (let x = 0; x < 3; x++) {
            ctx.fillStyle = ((Math.floor(y / 10) + x) % 2) ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.18)';
            ctx.fillRect(p.x + 6 + x * 18, y, 14, 8);
          }
        }
      } else if (skin === 'terracotta') {
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 1;
        for (let y = y0 + 8; y < y1; y += 14) {
          ctx.beginPath(); ctx.moveTo(p.x, y); ctx.lineTo(p.x + p.w, y); ctx.stroke();
        }
      } else if (skin === 'neon_pipe') {
        ctx.strokeStyle = cap;
        ctx.globalAlpha = 0.85;
        ctx.lineWidth = 2;
        ctx.strokeRect(p.x + 3, y0 + 2, p.w - 6, Math.max(2, h - 4));
        ctx.globalAlpha = 1;
        ctx.fillStyle = 'rgba(78,205,196,0.15)';
        ctx.fillRect(p.x, y0, 4, h);
      } else if (skin === 'lattice') {
        // 3.17 diamond lattice overlay
        ctx.strokeStyle = 'rgba(243,156,18,0.55)';
        ctx.lineWidth = 1.4;
        for (let y = y0 + 6; y < y1 - 4; y += 12) {
          ctx.beginPath();
          ctx.moveTo(p.x + 4, y);
          ctx.lineTo(p.x + p.w / 2, y + 6);
          ctx.lineTo(p.x + p.w - 4, y);
          ctx.stroke();
        }
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.fillRect(p.x + 2, y0, 3, h);
      } else if (skin === 'stripe') {
        // 3.17 bold diagonal / band stripes
        for (let y = y0; y < y1; y += 16) {
          ctx.fillStyle = ((Math.floor((y - y0) / 16) % 2) === 0) ? 'rgba(231,76,60,0.55)' : 'rgba(255,255,255,0.12)';
          ctx.fillRect(p.x, y, p.w, 10);
        }
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(p.x + p.w - 6, y0, 6, h);
      }
    }
    column(0, p.gapY);
    ctx.fillStyle = cap;
    ctx.fillRect(p.x - 4, p.gapY - 22, p.w + 8, 22);
    // cap highlight
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.fillRect(p.x - 2, p.gapY - 20, p.w + 4, 4);
    const by = p.gapY + gap;
    column(by, groundY);
    ctx.fillStyle = cap;
    ctx.fillRect(p.x - 4, by, p.w + 8, 22);
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(p.x - 2, by + 2, p.w + 4, 4);
  }

  function drawObstaclePair(ctx, p, pal, groundY, ghost) {
    const gap = p.gap;
    const kind = p.kind || 'pipe';
    ctx.globalAlpha = ghost ? 0.55 : 1;
    if (kind === 'pipe' || !kind || kind === 'mosaic' || kind === 'terracotta' || kind === 'neon_pipe' || kind === 'tiled' || kind === 'lattice' || kind === 'stripe') {
      drawPipeSkin(ctx, p, pal, groundY, gap, kind === 'pipe' || !kind ? 'pipe' : kind);
    } else if (kind === 'kite') {
      drawKiteColumn(ctx, p.x, 0, p.gapY, p.w, '#e74c3c');
      drawKiteColumn(ctx, p.x, p.gapY + gap, groundY - (p.gapY + gap), p.w, '#3498db');
    } else if (kind === 'tree') {
      drawTreeColumn(ctx, p.x, 0, p.gapY, p.w);
      drawTreeColumn(ctx, p.x, p.gapY + gap, groundY - (p.gapY + gap), p.w);
    } else if (kind === 'brick' || kind === 'construction') {
      drawBrickColumn(ctx, p.x, 0, p.gapY, p.w, kind === 'construction');
      drawBrickColumn(ctx, p.x, p.gapY + gap, groundY - (p.gapY + gap), p.w, kind === 'construction');
    } else if (kind === 'signboard') {
      drawSignColumn(ctx, p.x, 0, p.gapY, p.w, 'STOP');
      drawSignColumn(ctx, p.x, p.gapY + gap, groundY - (p.gapY + gap), p.w, 'Oye!');
    } else if (kind === 'wires' || kind === 'clothesline') {
      drawWireColumn(ctx, p.x, 0, p.gapY, p.w, kind === 'clothesline');
      drawWireColumn(ctx, p.x, p.gapY + gap, groundY - (p.gapY + gap), p.w, kind === 'clothesline');
    } else {
      // vehicle-as-obstacle: bus / rickshaw / cycle stacked
      drawVehColumn(ctx, p.x, 0, p.gapY, p.w, kind);
      drawVehColumn(ctx, p.x, p.gapY + gap, groundY - (p.gapY + gap), p.w, kind);
    }
    ctx.globalAlpha = 1;
  }

  function drawKiteColumn(ctx, x, y, h, w, color) {
    if (h <= 0) return;
    ctx.fillStyle = '#888';
    ctx.fillRect(x + w / 2 - 2, y, 4, h);
    const mid = y + h * 0.55;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x + w / 2, mid - 18);
    ctx.lineTo(x + w / 2 + 16, mid);
    ctx.lineTo(x + w / 2, mid + 18);
    ctx.lineTo(x + w / 2 - 16, mid);
    ctx.closePath();
    ctx.fill();
  }

  function drawTreeColumn(ctx, x, y, h, w) {
    if (h <= 0) return;
    ctx.fillStyle = '#6d4c41';
    ctx.fillRect(x + w / 2 - 6, y, 12, h);
    ctx.fillStyle = '#27ae60';
    const cy = y + Math.min(h * 0.4, 40);
    ctx.beginPath();
    ctx.arc(x + w / 2, cy, Math.min(w * 0.7, 28), 0, Math.PI * 2);
    ctx.fill();
  }

  function drawBrickColumn(ctx, x, y, h, w, cone) {
    if (h <= 0) return;
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#922b21';
    ctx.lineWidth = 1;
    for (let yy = y; yy < y + h; yy += 12) {
      ctx.beginPath();
      ctx.moveTo(x, yy);
      ctx.lineTo(x + w, yy);
      ctx.stroke();
    }
    if (cone && h > 30) {
      ctx.fillStyle = '#f39c12';
      ctx.beginPath();
      ctx.moveTo(x + 4, y + h - 4);
      ctx.lineTo(x + w / 2, y + 8);
      ctx.lineTo(x + w - 4, y + h - 4);
      ctx.fill();
    }
  }

  function drawSignColumn(ctx, x, y, h, w, text) {
    if (h <= 0) return;
    ctx.fillStyle = '#7f8c8d';
    ctx.fillRect(x + w / 2 - 3, y, 6, h);
    const sy = y + Math.max(10, h - 50);
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(x - 4, sy, w + 8, 28);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text || '!', x + w / 2, sy + 14);
  }

  function drawWireColumn(ctx, x, y, h, w, clothes) {
    if (h <= 0) return;
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 4, y);
    ctx.lineTo(x + w - 4, y + h);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + w - 4, y);
    ctx.lineTo(x + 4, y + h);
    ctx.stroke();
    if (clothes) {
      const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f'];
      for (let i = 0; i < 3; i++) {
        const cy = y + 20 + i * Math.max(18, (h - 40) / 3);
        if (cy > y + h - 10) break;
        ctx.fillStyle = colors[i % 4];
        ctx.fillRect(x + 8, cy, w - 16, 14);
      }
    }
  }

  function drawVehColumn(ctx, x, y, h, w, kind) {
    if (h <= 0) return;
    const colors = { bus: '#27ae60', rickshaw: '#ff6b6b', cycle: '#4ecdc4', truck: '#2980b9' };
    ctx.fillStyle = colors[kind] || '#7f8c8d';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    for (let yy = y + 8; yy < y + h - 8; yy += 22) {
      ctx.fillRect(x + 8, yy, w - 16, 10);
    }
  }

  // Environment palettes
  function envPalette(envId, weatherId) {
    const nightish = weatherId === 'night' || weatherId === 'storm' || envId === 'night';
    const bases = {
      city: { sky0: '#5ec8f0', sky1: '#87ceeb', sky2: '#b8e0f0', ground: '#c2a05c', grass: '#7ec850', pipe: '#2d8f4e', pipeCap: '#3cb371' },
      lahore: { sky0: '#f5a962', sky1: '#87b8d8', sky2: '#d4e6f1', ground: '#c9a66b', grass: '#8bc34a', pipe: '#c0392b', pipeCap: '#e74c3c', accent: '#8e44ad' },
      islamabad: { sky0: '#5dade2', sky1: '#a9dfbf', sky2: '#d5f5e3', ground: '#a8d08d', grass: '#58d68d', pipe: '#1e8449', pipeCap: '#27ae60', hills: true },
      karachi: { sky0: '#85c1e9', sky1: '#5dade2', sky2: '#f9e79f', ground: '#d5b895', grass: '#82e0aa', pipe: '#1a5276', pipeCap: '#2874a6', sea: true },
      murree: { sky0: '#aed6f1', sky1: '#d5f5e3', sky2: '#f5eef8', ground: '#a1887f', grass: '#66bb6a', pipe: '#4a6741', pipeCap: '#689f38', pines: true },
      village: { sky0: '#f9e79f', sky1: '#f5cba7', sky2: '#fad7a0', ground: '#d4ac0d', grass: '#9ccc65', pipe: '#6d4c41', pipeCap: '#8d6e63' },
      desert: { sky0: '#f5b041', sky1: '#f8c471', sky2: '#fdebd0', ground: '#d4a017', grass: '#c9a227', pipe: '#a04000', pipeCap: '#ca6f1e', dunes: true },
      night: { sky0: '#0b1026', sky1: '#1a2744', sky2: '#2a3555', ground: '#3d3428', grass: '#3a7a45', pipe: '#1e6b3a', pipeCap: '#2a8f4e', stars: true },
      bridge: { sky0: '#5dade2', sky1: '#85c1e9', sky2: '#d6eaf8', ground: '#7f8c8d', grass: '#95a5a6', pipe: '#34495e', pipeCap: '#5d6d7e', bridge: true },
      mountains: { sky0: '#aed6f1', sky1: '#d5f5e3', sky2: '#f5eef8', ground: '#7d6b5d', grass: '#66bb6a', pipe: '#4a6741', pipeCap: '#689f38', hills: true, pines: true },
      rain: { sky0: '#7f8c8d', sky1: '#95a5a6', sky2: '#bdc3c7', ground: '#6d5c4d', grass: '#5a8f3a', pipe: '#2d5a3d', pipeCap: '#3d7a4d', rain: true },
      canal: { sky0: '#5dade2', sky1: '#a9cce3', sky2: '#d4efdf', ground: '#7dcea0', grass: '#52be80', pipe: '#1a5276', pipeCap: '#2874a6', canal: true },
      hunza: { sky0: '#85c1e9', sky1: '#aed6f1', sky2: '#f5eef8', ground: '#a1887f', grass: '#58d68d', pipe: '#1e8449', pipeCap: '#27ae60', hills: true, pines: true },
      gwadar: { sky0: '#5dade2', sky1: '#76d7c4', sky2: '#f9e79f', ground: '#d5b895', grass: '#82e0aa', pipe: '#1a5276', pipeCap: '#148f77', sea: true },
      quetta: { sky0: '#1a2744', sky1: '#2c3e50', sky2: '#5d6d7e', ground: '#5d4e37', grass: '#3a7a45', pipe: '#7b241c', pipeCap: '#922b21', stars: true, bazaar: true },
      monsoon: { sky0: '#5d6d7e', sky1: '#85929e', sky2: '#a9cce3', ground: '#6d5c4d', grass: '#196f3d', pipe: '#1e8449', pipeCap: '#196f3d', rain: true },
      oldcity: { sky0: '#f5b041', sky1: '#f8c471', sky2: '#fdebd0', ground: '#a04000', grass: '#7d6608', pipe: '#6e2c00', pipeCap: '#935116', rooftops: true }
    };
    const pal = Object.assign({
      sun: 'rgba(255,240,150,0.85)',
      cloud: 'rgba(255,255,255,0.75)',
      pipeHi: 'rgba(255,255,255,0.15)',
      stripe: '#a88848',
      grassLine: '#5a8f3a'
    }, bases[envId] || bases.city);
    if (nightish) {
      pal.sky0 = '#0b1026';
      pal.sky1 = '#1a2744';
      pal.sky2 = '#2a3555';
      pal.sun = 'rgba(220,220,255,0.55)';
      pal.cloud = 'rgba(180,190,220,0.35)';
      pal.stars = true;
      pal.night = true;
      // Neon city accents (3.13)
      if (envId === 'city' || envId === 'lahore' || envId === 'karachi' || envId === 'oldcity') {
        pal.pipe = '#1a3d5c';
        pal.pipeCap = '#e91e8c';
        pal.neon = '#4ecdc4';
        pal.grass = '#2d5a3a';
        pal.ground = '#2a2430';
        pal.stripe = '#3d3550';
      }
    }
    if (weatherId === 'fog') {
      pal.cloud = 'rgba(220,220,230,0.55)';
      pal.fog = true;
    }
    if (weatherId === 'rain' || weatherId === 'storm') {
      pal.rain = true;
      pal.storm = weatherId === 'storm';
      pal.sky0 = pal.storm ? '#2c3e50' : '#7f8c8d';
      pal.sky1 = pal.storm ? '#34495e' : '#95a5a6';
      pal.sky2 = '#bdc3c7';
    }
    if (weatherId === 'sunset') {
      pal.sky0 = '#ff7e5f';
      pal.sky1 = '#feb47b';
      pal.sky2 = '#ffd194';
      pal.sun = 'rgba(255,160,80,0.9)';
      pal.cloud = 'rgba(255,200,160,0.55)';
    }
    if (weatherId === 'clear' || weatherId === 'sunny') {
      /* keep base palette */
    }
    return pal;
  }

  const BOSS_KINDS = [
    { id: 'truck', label: 'GIANT TRUCK', emoji: '🚛' },
    { id: 'eagle', label: 'FLYING EAGLE', emoji: '🦅' },
    { id: 'police', label: 'POLICE CHASE', emoji: '🚓' },
    { id: 'storm', label: 'STORM FRONT', emoji: '⛈' },
    { id: 'giant', label: 'GIANT OBSTACLE', emoji: '🧱' }
  ];

  function pickBossKind(rng) {
    const r = typeof rng === 'function' ? rng : Math.random;
    return BOSS_KINDS[Math.floor(r() * BOSS_KINDS.length)];
  }

  function isUnlocked(id) {
    if (typeof FTStorage !== 'undefined' && FTStorage.isBirdUnlocked) {
      return FTStorage.isBirdUnlocked(id === 'bird' ? 'sparrow' : id === 'rocket' ? 'eagle' : id);
    }
    return true;
  }

  function renderPicker(container, selectedId, onPick, onUnlockRequest, kind) {
    if (!container) return;
    kind = kind || 'bird';
    const list = kind === 'vehicle' ? VEHICLES : kind === 'env' ? ENVS : kind === 'hat' ? HATS : kind === 'trail' ? TRAILS : BIRDS;
    container.innerHTML = '';
    function itemUnlocked(item) {
      if (!FTStorage) return true;
      if (kind === 'bird') return FTStorage.isBirdUnlocked(item.id);
      if (kind === 'vehicle') return FTStorage.isVehicleUnlocked(item.id);
      if (kind === 'env') return FTStorage.isEnvUnlocked(item.id);
      if (kind === 'hat') return FTStorage.isHatUnlocked(item.id);
      if (kind === 'trail') return FTStorage.isTrailUnlocked(item.id);
      return true;
    }
    // 3.25 garage sort · 3.42 favorites pin first
    let items = list.slice();
    const sortMode = (typeof FTStorage !== 'undefined' && FTStorage.getGarageSort) ? FTStorage.getGarageSort() : 'owned';
    const favOf = function (it) {
      return (typeof FTStorage !== 'undefined' && FTStorage.isGarageFavorite && FTStorage.isGarageFavorite(kind, it.id)) ? 0 : 1;
    };
    items.sort(function (a, b) {
      const fa = favOf(a), fb = favOf(b);
      if (fa !== fb) return fa - fb;
      if (sortMode === 'name') return String(a.label || a.id).localeCompare(String(b.label || b.id));
      if (sortMode === 'cost') return (a.cost || 0) - (b.cost || 0) || String(a.label || '').localeCompare(String(b.label || ''));
      // owned first (default)
      const ua = itemUnlocked(a) ? 0 : 1;
      const ub = itemUnlocked(b) ? 0 : 1;
      if (ua !== ub) return ua - ub;
      return String(a.label || a.id).localeCompare(String(b.label || b.id));
    });
    items.forEach((item) => {
      let unlocked = itemUnlocked(item);
      let cost = item.cost || 0;

      const themeIds = { jungle: 1, alpine: 1, seagull: 1, jungle_rickshaw: 1, snow_bike: 1, sea_boat: 1 };
      const isTheme = !!(item.theme || themeIds[item.id]);
      const isSeasonal = !!item.seasonal;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'skin-card' + (item.id === selectedId && unlocked ? ' selected' : '') + (!unlocked ? ' locked' : '') +
        (isTheme ? ' theme-skin' : '') + (isSeasonal ? ' seasonal-skin' : '');
      btn.dataset.id = item.id;
      btn.dataset.label = item.label || item.id;
      btn.dataset.theme = isTheme ? '1' : '0';
      btn.dataset.seasonal = isSeasonal ? '1' : '0';
      const isFav = !!(typeof FTStorage !== 'undefined' && FTStorage.isGarageFavorite && FTStorage.isGarageFavorite(kind, item.id));
      btn.dataset.fav = isFav ? '1' : '0';
      if (isFav) btn.className += ' favorited';
      const c = document.createElement('canvas');
      c.width = 64;
      c.height = 64;
      const cctx = c.getContext('2d');
      cctx.clearRect(0, 0, 64, 64);
      if (kind === 'bird' || kind === 'vehicle') {
        draw(cctx, kind === 'bird' ? item.id : 'sparrow', 32, 28, 0, 1.0, {
          vehicle: kind === 'vehicle' ? item.id : 'none'
        });
      } else if (kind === 'env') {
        const pal = envPalette(item.id, 'clear');
        const g = cctx.createLinearGradient(0, 0, 0, 64);
        g.addColorStop(0, pal.sky0);
        g.addColorStop(1, pal.sky2);
        cctx.fillStyle = g;
        cctx.fillRect(0, 0, 64, 48);
        cctx.fillStyle = pal.ground;
        cctx.fillRect(0, 48, 64, 16);
        cctx.fillStyle = pal.grass;
        cctx.fillRect(0, 48, 64, 4);
      } else {
        cctx.fillStyle = '#1a1a2e';
        cctx.fillRect(0, 0, 64, 64);
        cctx.fillStyle = '#ffd93d';
        cctx.font = '24px system-ui';
        cctx.textAlign = 'center';
        cctx.textBaseline = 'middle';
        const icons = { none: '·', topi: '🎩', cap: '🧢', crown: '👑', sunglasses: '🕶', hat: '👒', helmet: '⛑', scarf: '🧣', spark: '✨', smoke: '💨', stars: '⭐', star: '🌟', fire: '🔥', rainbow: '🌈', ind_topi: '🇵🇰', eid_sparkle: '🌙', winter_shawl: '🧣', basant_pagri: '🪁', ind_trail: '💚', eid_trail: '✨', winter_trail: '❄', basant_trail: '🪁' };
        cctx.fillText(icons[item.id] || '?', 32, 32);
      }
      if (!unlocked) {
        cctx.fillStyle = 'rgba(15,23,42,0.55)';
        cctx.fillRect(0, 0, 64, 64);
        cctx.fillStyle = '#ffd93d';
        cctx.font = 'bold 16px system-ui';
        cctx.textAlign = 'center';
        cctx.textBaseline = 'middle';
        cctx.fillText('🔒', 32, 32);
      }
      const label = document.createElement('span');
      label.textContent = unlocked ? item.label : item.label;
      btn.appendChild(c);
      btn.appendChild(label);
      if (isTheme) {
        const badge = document.createElement('span');
        badge.className = 'skin-theme-badge';
        badge.textContent = item.id.indexOf('jungle') >= 0 ? '🌿' :
          (item.id.indexOf('alpine') >= 0 || item.id.indexOf('snow') >= 0) ? '⛰' :
          (item.id.indexOf('sea') >= 0 || item.id === 'seagull') ? '🌊' : '✦';
        badge.title = 'Theme skin';
        btn.appendChild(badge);
      }
      if (!unlocked && item.seasonal) {
        const hint = document.createElement('span');
        hint.className = 'skin-unlock-hint';
        hint.textContent = '📅 Seasonal';
        btn.appendChild(hint);
      } else if (!unlocked && item.unlockScore && cost > 0) {
        const hint = document.createElement('span');
        hint.className = 'skin-unlock-hint';
        hint.textContent = 'Best ' + item.unlockScore + '+ or ' + cost + ' 🪙';
        btn.appendChild(hint);
      } else if (!unlocked && item.unlockScore) {
        const hint = document.createElement('span');
        hint.className = 'skin-unlock-hint';
        hint.textContent = 'Best ' + item.unlockScore + '+';
        btn.appendChild(hint);
      } else if (!unlocked && cost > 0) {
        const hint = document.createElement('span');
        hint.className = 'skin-unlock-hint';
        hint.textContent = cost + ' 🪙';
        btn.appendChild(hint);
      }
      if (!unlocked && kind === 'bird' && cost > 0 && typeof FTStorage !== 'undefined' && FTStorage.getCoins) {
        const have = FTStorage.getCoins() | 0;
        const pct = Math.max(0, Math.min(100, Math.floor((have / cost) * 100)));
        const bar = document.createElement('span');
        bar.className = 'skin-teaser-bar';
        bar.title = have + ' / ' + cost + ' coins';
        const fill = document.createElement('span');
        fill.style.width = pct + '%';
        bar.appendChild(fill);
        btn.appendChild(bar);
        if (pct >= 70) btn.classList.add('skin-teaser-near');
      }
      // 3.42 favorites pin
      const pin = document.createElement('button');
      pin.type = 'button';
      pin.className = 'skin-fav-pin' + (isFav ? ' on' : '');
      pin.setAttribute('aria-label', isFav ? 'Unpin favorite' : 'Pin favorite');
      pin.title = isFav ? 'Unpin' : 'Pin favorite';
      pin.textContent = isFav ? '★' : '☆';
      pin.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (!FTStorage || !FTStorage.toggleGarageFavorite) return;
        const nowOn = FTStorage.toggleGarageFavorite(kind, item.id);
        pin.classList.toggle('on', nowOn);
        pin.textContent = nowOn ? '★' : '☆';
        pin.setAttribute('aria-label', nowOn ? 'Unpin favorite' : 'Pin favorite');
        pin.title = nowOn ? 'Unpin' : 'Pin favorite';
        btn.classList.toggle('favorited', nowOn);
        btn.dataset.fav = nowOn ? '1' : '0';
        if (typeof global.onGarageFavoriteChange === 'function') {
          global.onGarageFavoriteChange(kind, item.id, nowOn, item.label || item.id);
        }
      });
      btn.appendChild(pin);
      btn.addEventListener('click', () => {
        if (!unlocked) {
          if (typeof onUnlockRequest === 'function') onUnlockRequest(item, kind);
          return;
        }
        onPick(item.id, kind);
        container.querySelectorAll('.skin-card').forEach((el) => {
          el.classList.toggle('selected', el.dataset.id === item.id && !el.classList.contains('locked'));
        });
        // 3.45: double-tap equip juice
        const now = Date.now();
        const key = kind + ':' + item.id;
        if (renderPicker._lastTapKey === key && (now - (renderPicker._lastTapAt || 0)) < 380) {
          renderPicker._lastTapKey = '';
          renderPicker._lastTapAt = 0;
          btn.classList.add('equip-flash');
          setTimeout(function () { btn.classList.remove('equip-flash'); }, 480);
          if (typeof global.onGarageDoubleEquip === 'function') {
            global.onGarageDoubleEquip(kind, item.id, item.label || item.id);
          }
        } else {
          renderPicker._lastTapKey = key;
          renderPicker._lastTapAt = now;
        }
      });
      container.appendChild(btn);
    });
  }


  // ——— Dynamic traffic vehicles (cross-screen) ———
  const TRAFFIC_TIERS = [
    { ids: ['rickshaw', 'cycle'], minScore: 0 },
    { ids: ['bike', 'scooty', 'bicycle'], minScore: 8 },
    { ids: ['taxi', 'mehran', 'chingchi'], minScore: 20 },
    { ids: ['bus'], minScore: 35 },
    { ids: ['truck', 'tractor'], minScore: 50 }
  ];

  function pickTrafficKind(score, rng) {
    let pool = TRAFFIC_TIERS[0].ids.slice();
    for (let i = 0; i < TRAFFIC_TIERS.length; i++) {
      if (score >= TRAFFIC_TIERS[i].minScore) pool = TRAFFIC_TIERS[i].ids.slice();
    }
    // slight chance of any lower tier
    if (rng() < 0.25 && score > 8) {
      const lower = TRAFFIC_TIERS[Math.max(0, TRAFFIC_TIERS.findIndex((t) => score < t.minScore) - 1)];
      if (lower) pool = pool.concat(lower.ids);
    }
    return pool[Math.floor(rng() * pool.length)];
  }

  function drawTraffic(ctx, t) {
    ctx.save();
    ctx.translate(t.x, t.y);
    if (t.dir < 0) ctx.scale(-1, 1);
    const bob = Math.sin((t.x || 0) * 0.05) * 1.5;
    ctx.translate(0, bob);
    const animT = (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;
    const speed = Math.abs(t.vx || 80);
    drawVehicleUnder(ctx, t.kind, {
      wheelRot: animT * (speed / 18),
      vehBob: Math.sin(animT * 6 + (t.x || 0) * 0.02) * 0.8,
      animT: animT
    });
    ctx.restore();
  }

  function trafficHitbox(t) {
    const big = t.kind === 'bus' || t.kind === 'truck' || t.kind === 'tractor';
    // ~15% smaller than visual vehicle silhouette
    return { w: big ? 40 : 30, h: big ? 24 : 18 };
  }

  global.FTSkins = {
    SKINS, BIRDS, VEHICLES, ENVS, WEATHERS, HATS, TRAILS, SEASONAL_PACKS,
    BIRD_PASSIVES, birdPassive, weatherMods, BOSS_KINDS, pickBossKind,
    seasonalInWindow, seasonalEligible,
    THEME_IDS: { jungle: 1, alpine: 1, seagull: 1, jungle_rickshaw: 1, snow_bike: 1, sea_boat: 1 },
    draw, drawLegacy, hitbox, renderPicker, isUnlocked,
    envPalette, pickObstacleKind, drawObstaclePair, OBSTACLE_KINDS,
    AREA_OBSTACLES, pickTrafficKind, drawTraffic, trafficHitbox, TRAFFIC_TIERS
  };
  // Compat: old draw signature when 6 args without opts object
  const _draw = draw;
  global.FTSkins.draw = function (ctx, id, x, y, rot, scale, opts) {
    if (opts && typeof opts === 'object') return _draw(ctx, id, x, y, rot, scale, opts);
    if (id === 'bird' || id === 'bike' || id === 'rickshaw' || id === 'rocket') {
      return drawLegacy(ctx, id, x, y, rot, scale);
    }
    return _draw(ctx, id, x, y, rot, scale, {});
  };
})(window);
