/**
 * Urr Jaa! v3.6.0-urrjaa — richer bird/vehicle silhouettes; seasonal packs kept.
 * Canvas-drawn; forgiving hitboxes unchanged.
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
    { id: 'falcon', label: 'Baaz', cost: 85 }
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
    { id: 'truck', label: 'Truck', cost: 80 }
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
    falcon: { id: 'nearmiss', label: 'Dive bonus', gravityMul: 1.01, flapMul: 1.06, coinMul: 1, nearMissBonus: 1, nightBonus: 0 }
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
    falcon: { body: '#7f8c8d', wing: '#566573', beak: '#f39c12', eye: '#111' }
  };

  function drawBirdBody(ctx, id, scale) {
    const c = BIRD_COLORS[id] || BIRD_COLORS.sparrow;
    const s = scale == null ? 1 : scale;
    ctx.scale(s, s);

    // Tail silhouette first: accessories and feathers stay outside the forgiving body hitbox.
    ctx.fillStyle = c.wing;
    ctx.beginPath();
    if (id === 'cheel' || id === 'falcon') {
      ctx.moveTo(-12, 2); ctx.lineTo(-26, -5); ctx.lineTo(-21, 2); ctx.lineTo(-27, 8); ctx.closePath();
    } else {
      ctx.moveTo(-12, 1); ctx.lineTo(-25, -5); ctx.lineTo(-22, 6); ctx.closePath();
    }
    ctx.fill();

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

    // Rounded body with outline gives every unlock a crisp silhouette on bright skies.
    ctx.fillStyle = c.body;
    ctx.strokeStyle = 'rgba(15,23,42,.48)';
    ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.ellipse(0, 0, 16, 12, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    // Species markings.
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
    }

    // Layered wing and feather bars.
    ctx.fillStyle = c.wing;
    ctx.strokeStyle = 'rgba(15,23,42,.35)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(-3, 2, 10, 6, -.4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.42)';
    ctx.beginPath(); ctx.moveTo(-10,1); ctx.quadraticCurveTo(-3,4,5,2); ctx.moveTo(-8,4); ctx.quadraticCurveTo(-2,7,4,4); ctx.stroke();

    if (c.crest) {
      ctx.fillStyle = c.crest; ctx.beginPath();
      if (id === 'bulbul') { ctx.moveTo(-5,-9); ctx.lineTo(-2,-20); ctx.lineTo(3,-10); }
      else { ctx.moveTo(-5,-9); ctx.lineTo(0,-18); ctx.lineTo(5,-9); }
      ctx.closePath(); ctx.fill();
    }
    if (c.cheek) { ctx.fillStyle = c.cheek; ctx.beginPath(); ctx.arc(5, 2, 3.5, 0, Math.PI*2); ctx.fill(); }
    if (c.neck && id !== 'kabootar') { ctx.fillStyle = c.neck; ctx.beginPath(); ctx.ellipse(-1,4,6,4,0,0,Math.PI*2); ctx.fill(); }

    if (id === 'owl') {
      ctx.fillStyle = '#e6d7bd'; ctx.beginPath(); ctx.arc(7,-3,7,0,Math.PI*2); ctx.arc(14,-3,7,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(7,-3,5,0,Math.PI*2); ctx.arc(14,-3,5,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = c.pupil || '#111'; ctx.beginPath(); ctx.arc(8,-3,2.2,0,Math.PI*2); ctx.arc(15,-3,2.2,0,Math.PI*2); ctx.fill();
    } else {
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(9,-4,4.6,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = c.eye; ctx.beginPath(); ctx.arc(10.5,-4,2.1,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(11.2,-4.8,.7,0,Math.PI*2); ctx.fill();
    }
    if (c.shades) {
      ctx.fillStyle = '#111'; ctx.fillRect(4,-7,14,5); ctx.fillStyle = '#4ecdc4'; ctx.fillRect(5,-6,5,3); ctx.fillRect(12,-6,5,3);
    }
    ctx.fillStyle = c.beak; ctx.strokeStyle = 'rgba(15,23,42,.35)';
    ctx.beginPath(); ctx.moveTo(14,0); ctx.lineTo(25,2); ctx.lineTo(14,5); ctx.closePath(); ctx.fill(); ctx.stroke();
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

  function drawVehicleUnder(ctx, vid) {
    if (!vid || vid === 'none') return;
    ctx.save();
    ctx.translate(0, 14);
    ctx.scale(0.85, 0.85);
    function wheel(x, y, r) {
      ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#d0d5dd'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(x, y, r - 1.4, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.moveTo(x - r + 2, y); ctx.lineTo(x + r - 2, y); ctx.moveTo(x, y - r + 2); ctx.lineTo(x, y + r - 2); ctx.stroke();
    }
    if (vid === 'rickshaw' || vid === 'chingchi') {
      const body = vid === 'chingchi' ? '#8e44ad' : '#e74c3c';
      const trim = vid === 'chingchi' ? '#f5b041' : '#ffd93d';
      ctx.fillStyle = body; ctx.strokeStyle = 'rgba(15,23,42,.45)'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(-20,-10); ctx.lineTo(14,-10); ctx.quadraticCurveTo(22,-8,22,0); ctx.lineTo(22,8); ctx.lineTo(-20,8); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(173,216,230,.7)'; ctx.fillRect(-8,-8,16,7);
      ctx.fillStyle = trim; ctx.fillRect(-18,-12,30,3); ctx.fillRect(-18,5,30,2);
      ctx.fillStyle = '#222'; ctx.fillRect(-20,-8,5,12); // driver cab
      ctx.strokeStyle = '#f8fafc'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-4,-10); ctx.lineTo(-4,-18); ctx.lineTo(8,-18); ctx.stroke(); // canopy pole
      ctx.fillStyle = trim; ctx.beginPath(); ctx.ellipse(2,-18,12,3,0,0,Math.PI*2); ctx.fill();
      wheel(-8, 10, 6); wheel(14, 10, 6);
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
      ctx.fillStyle = '#2c3e50'; ctx.fillRect(-4,-5,8,2.5);
      ctx.strokeStyle = '#95a5a6'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(8,-8); ctx.lineTo(16,-10); ctx.stroke();
    } else if (vid === 'bike' || vid === 'scooty') {
      const body = vid === 'scooty' ? '#e91e63' : '#2c3e50';
      ctx.fillStyle = body; ctx.strokeStyle = 'rgba(15,23,42,.4)'; ctx.lineWidth = 1.1;
      ctx.beginPath(); ctx.moveTo(-16,-1); ctx.lineTo(-16,-4); ctx.lineTo(12,-4); ctx.lineTo(14,6); ctx.lineTo(-16,6); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#111'; ctx.fillRect(-4,-8,10,5);
      ctx.strokeStyle = '#bdc3c7'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(8,-2); ctx.lineTo(14,-11); ctx.lineTo(18,-9); ctx.stroke();
      wheel(-10, 8, 6); wheel(12, 8, 6);
      if (vid === 'scooty') { ctx.fillStyle = '#fff'; ctx.fillRect(6,-7,5,3); }
    } else if (vid === 'taxi' || vid === 'mehran') {
      const body = vid === 'taxi' ? '#f1c40f' : '#ecf0f1';
      ctx.fillStyle = body; ctx.strokeStyle = 'rgba(15,23,42,.45)'; ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-22,6); ctx.lineTo(-20,-4); ctx.quadraticCurveTo(-18,-8,-10,-8);
      ctx.lineTo(8,-8); ctx.quadraticCurveTo(14,-8,16,-4); ctx.lineTo(22,6); ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#5dade2';
      ctx.beginPath(); ctx.moveTo(-10,-8); ctx.lineTo(-6,-14); ctx.lineTo(6,-14); ctx.lineTo(10,-8); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.fillRect(-5,-13,4,4); ctx.fillRect(1,-13,4,4);
      ctx.fillStyle = '#111'; ctx.fillRect(-22,0,5,3); ctx.fillRect(17,0,5,3); // bumpers/lights
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
      ctx.fillStyle = '#27ae60'; ctx.strokeStyle = 'rgba(15,23,42,.4)'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(-24,8); ctx.lineTo(-22,-10); ctx.lineTo(22,-10); ctx.lineTo(24,8); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ecf0f1'; for (let i = 0; i < 3; i++) ctx.fillRect(-16 + i * 12, -6, 8, 6);
      ctx.fillStyle = '#f1c40f'; ctx.fillRect(-24,2,48,2);
      wheel(-14, 10, 5); wheel(14, 10, 5);
    } else if (vid === 'tractor') {
      ctx.fillStyle = '#e67e22'; ctx.fillRect(-14, -8, 24, 14);
      ctx.fillStyle = '#f5b041'; ctx.fillRect(-4, -14, 12, 8);
      ctx.fillStyle = '#3498db'; ctx.fillRect(-2, -12, 6, 5);
      wheel(-10, 10, 8); wheel(12, 8, 5);
    } else if (vid === 'truck') {
      ctx.fillStyle = '#2980b9'; ctx.fillRect(-22, -8, 26, 16);
      ctx.fillStyle = '#3498db'; ctx.fillRect(4, -12, 16, 20);
      ctx.fillStyle = '#ecf0f1'; ctx.fillRect(7, -8, 8, 6);
      ctx.fillStyle = '#f1c40f'; ctx.fillRect(-22, 4, 26, 2);
      wheel(-14, 10, 5); wheel(2, 10, 5); wheel(14, 10, 5);
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
    if (vehicle !== 'none') drawVehicleUnder(ctx, vehicle);
    ctx.save();
    drawBirdBody(ctx, birdId || 'sparrow', sc);
    drawHat(ctx, hat);
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
    // Body-only hitbox (~18% smaller than drawn sprite). Wings / hats / trails ignored.
    let w = 18, h = 14;
    if (opts.vehicle && opts.vehicle !== 'none') {
      // Vehicle body only — ignore mirrors / spoilers visually larger than hitbox
      w = 24;
      h = 19;
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
    'tree', 'construction', 'brick', 'wires', 'clothesline', 'truck'
  ];

  const AREA_OBSTACLES = {
    city: ['pipe', 'signboard', 'bus', 'rickshaw', 'construction'],
    bridge: ['pipe', 'wires', 'signboard', 'bus', 'truck'],
    mountains: ['pipe', 'tree', 'brick', 'kite'],
    village: ['pipe', 'tree', 'clothesline', 'cycle', 'kite'],
    rain: ['pipe', 'wires', 'signboard', 'bus'],
    night: ['pipe', 'signboard', 'bus', 'wires', 'rickshaw'],
    desert: ['pipe', 'brick', 'construction', 'truck'],
    lahore: ['pipe', 'kite', 'rickshaw', 'signboard', 'bus'],
    islamabad: ['pipe', 'tree', 'signboard', 'kite'],
    karachi: ['pipe', 'bus', 'signboard', 'rickshaw', 'truck'],
    murree: ['pipe', 'tree', 'kite', 'wires'],
    canal: ['pipe', 'wires', 'signboard', 'cycle', 'rickshaw'],
    hunza: ['pipe', 'tree', 'brick', 'kite'],
    gwadar: ['pipe', 'bus', 'signboard', 'truck', 'wires'],
    quetta: ['pipe', 'signboard', 'rickshaw', 'brick', 'wires'],
    monsoon: ['pipe', 'tree', 'clothesline', 'kite', 'wires'],
    oldcity: ['pipe', 'clothesline', 'brick', 'wires', 'signboard']
  };

  function pickObstacleKind(rng, areaId) {
    const pool = AREA_OBSTACLES[areaId] || AREA_OBSTACLES.city;
    const r = rng();
    if (r < 0.28) return 'pipe';
    return pool[Math.floor(rng() * pool.length)];
  }

  function drawObstaclePair(ctx, p, pal, groundY, ghost) {
    const gap = p.gap;
    const kind = p.kind || 'pipe';
    ctx.globalAlpha = ghost ? 0.55 : 1;
    if (kind === 'pipe' || !kind) {
      ctx.fillStyle = pal.pipe;
      ctx.fillRect(p.x, 0, p.w, p.gapY);
      ctx.fillStyle = pal.pipeCap;
      ctx.fillRect(p.x - 4, p.gapY - 22, p.w + 8, 22);
      const by = p.gapY + gap;
      ctx.fillStyle = pal.pipe;
      ctx.fillRect(p.x, by, p.w, groundY - by);
      ctx.fillStyle = pal.pipeCap;
      ctx.fillRect(p.x - 4, by, p.w + 8, 22);
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
    list.forEach((item) => {
      let unlocked = true;
      let cost = item.cost || 0;
      if (kind === 'bird') unlocked = !FTStorage || FTStorage.isBirdUnlocked(item.id);
      else if (kind === 'vehicle') unlocked = !FTStorage || FTStorage.isVehicleUnlocked(item.id);
      else if (kind === 'env') unlocked = !FTStorage || FTStorage.isEnvUnlocked(item.id);
      else if (kind === 'hat') unlocked = !FTStorage || FTStorage.isHatUnlocked(item.id);
      else if (kind === 'trail') unlocked = !FTStorage || FTStorage.isTrailUnlocked(item.id);

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'skin-card' + (item.id === selectedId && unlocked ? ' selected' : '') + (!unlocked ? ' locked' : '');
      btn.dataset.id = item.id;
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
      if (!unlocked && cost > 0) {
        const hint = document.createElement('span');
        hint.className = 'skin-unlock-hint';
        hint.textContent = cost + ' 🪙';
        btn.appendChild(hint);
      } else if (!unlocked && item.seasonal) {
        const hint = document.createElement('span');
        hint.className = 'skin-unlock-hint';
        hint.textContent = '📅 Seasonal';
        btn.appendChild(hint);
      }
      btn.addEventListener('click', () => {
        if (!unlocked) {
          if (typeof onUnlockRequest === 'function') onUnlockRequest(item, kind);
          return;
        }
        onPick(item.id, kind);
        container.querySelectorAll('.skin-card').forEach((el) => {
          el.classList.toggle('selected', el.dataset.id === item.id && !el.classList.contains('locked'));
        });
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
    drawVehicleUnder(ctx, t.kind);
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
