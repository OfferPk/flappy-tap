/**
 * Urr Jaa! v3.3.1 — birds, vehicles, accessories, trails, weather, passives, traffic.
 * Canvas-drawn; forgiving hitboxes.
 */
(function (global) {
  'use strict';

  const BIRDS = [
    { id: 'sparrow', label: 'Sparrow', cost: 0, free: true },
    { id: 'parrot', label: 'Parrot', cost: 40 },
    { id: 'eagle', label: 'Eagle', cost: 80 },
    { id: 'chick', label: 'Chick', cost: 30 },
    { id: 'owl', label: 'Owl', cost: 50 },
    { id: 'funny', label: 'Funny', cost: 100 }
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
    { id: 'night', label: 'Night', cost: 50, unlockScore: 120 }
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
    funny: { id: 'none', label: 'Goofy', gravityMul: 1, flapMul: 1, coinMul: 1, nearMissBonus: 0, nightBonus: 0 }
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
    { id: 'crown', label: 'Crown', cost: 60 }
  ];

  const TRAILS = [
    { id: 'none', label: 'None', cost: 0, free: true },
    { id: 'spark', label: 'Spark', cost: 0, free: true },
    { id: 'smoke', label: 'Smoke', cost: 20 },
    { id: 'stars', label: 'Stars', cost: 35 },
    { id: 'star', label: 'Star Dust', cost: 40 },
    { id: 'fire', label: 'Fire', cost: 50 },
    { id: 'rainbow', label: 'Rainbow', cost: 70 }
  ];

  const SKINS = BIRDS; // legacy alias

  const BIRD_COLORS = {
    sparrow: { body: '#c4a35a', wing: '#8b6914', beak: '#ff6b6b', eye: '#111' },
    parrot: { body: '#2ecc71', wing: '#27ae60', beak: '#f39c12', eye: '#111', crest: '#e74c3c' },
    eagle: { body: '#8d6e63', wing: '#5d4037', beak: '#ffd93d', eye: '#111' },
    chick: { body: '#ffd93d', wing: '#f0a500', beak: '#ff6b6b', eye: '#111' },
    owl: { body: '#a1887f', wing: '#6d4c41', beak: '#ffd93d', eye: '#fff', pupil: '#111' },
    funny: { body: '#ff6b6b', wing: '#4ecdc4', beak: '#ffd93d', eye: '#111', shades: true }
  };

  function drawBirdBody(ctx, id, scale) {
    const c = BIRD_COLORS[id] || BIRD_COLORS.sparrow;
    const s = scale == null ? 1 : scale;
    ctx.scale(s, s);
    ctx.fillStyle = c.body;
    ctx.beginPath();
    ctx.ellipse(0, 0, 16, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = c.wing;
    ctx.beginPath();
    ctx.ellipse(-2, 2, 10, 6, -0.4, 0, Math.PI * 2);
    ctx.fill();
    if (c.crest) {
      ctx.fillStyle = c.crest;
      ctx.beginPath();
      ctx.moveTo(-4, -10);
      ctx.lineTo(0, -18);
      ctx.lineTo(4, -10);
      ctx.fill();
    }
    if (id === 'owl') {
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(6, -3, 6, 0, Math.PI * 2);
      ctx.arc(14, -3, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = c.pupil || '#111';
      ctx.beginPath();
      ctx.arc(7, -3, 2.5, 0, Math.PI * 2);
      ctx.arc(15, -3, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(8, -4, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = c.eye;
      ctx.beginPath();
      ctx.arc(10, -4, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    if (c.shades) {
      ctx.fillStyle = '#111';
      ctx.fillRect(4, -7, 14, 5);
      ctx.fillStyle = '#4ecdc4';
      ctx.fillRect(5, -6, 5, 3);
      ctx.fillRect(12, -6, 5, 3);
    }
    ctx.fillStyle = c.beak;
    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.lineTo(24, 2);
    ctx.lineTo(14, 5);
    ctx.closePath();
    ctx.fill();
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
    }
  }

  function drawVehicleUnder(ctx, vid) {
    if (!vid || vid === 'none') return;
    ctx.save();
    ctx.translate(0, 14);
    ctx.scale(0.85, 0.85);
    if (vid === 'rickshaw' || vid === 'chingchi') {
      ctx.fillStyle = vid === 'chingchi' ? '#9b59b6' : '#ff6b6b';
      ctx.fillRect(-18, -8, 28, 16);
      ctx.fillStyle = '#222';
      ctx.beginPath();
      ctx.arc(-8, 10, 6, 0, Math.PI * 2);
      ctx.arc(12, 10, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffd93d';
      ctx.fillRect(-16, -10, 24, 3);
    } else if (vid === 'cycle' || vid === 'bicycle') {
      ctx.strokeStyle = vid === 'bicycle' ? '#2ecc71' : '#4ecdc4';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(-12, 6, 7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(12, 6, 7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-12, 6); ctx.lineTo(0, -4); ctx.lineTo(12, 6);
      ctx.moveTo(0, -4); ctx.lineTo(0, 4);
      ctx.stroke();
    } else if (vid === 'bike' || vid === 'scooty') {
      ctx.fillStyle = vid === 'scooty' ? '#e91e63' : '#34495e';
      ctx.fillRect(-16, -2, 28, 8);
      ctx.fillStyle = '#222';
      ctx.beginPath();
      ctx.arc(-10, 8, 6, 0, Math.PI * 2);
      ctx.arc(12, 8, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#bbb';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(8, -2); ctx.lineTo(14, -10);
      ctx.stroke();
    } else if (vid === 'taxi' || vid === 'mehran') {
      ctx.fillStyle = vid === 'taxi' ? '#f1c40f' : '#ecf0f1';
      ctx.fillRect(-20, -6, 36, 14);
      ctx.fillStyle = '#3498db';
      ctx.fillRect(-12, -10, 16, 6);
      ctx.fillStyle = '#222';
      ctx.beginPath();
      ctx.arc(-12, 10, 5, 0, Math.PI * 2);
      ctx.arc(12, 10, 5, 0, Math.PI * 2);
      ctx.fill();
      if (vid === 'taxi') {
        ctx.fillStyle = '#111';
        ctx.font = 'bold 8px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('TAXI', 0, 2);
      }
    } else if (vid === 'bus') {
      ctx.fillStyle = '#27ae60';
      ctx.fillRect(-22, -10, 44, 18);
      ctx.fillStyle = '#fff';
      for (let i = 0; i < 3; i++) ctx.fillRect(-16 + i * 12, -6, 8, 6);
      ctx.fillStyle = '#222';
      ctx.beginPath();
      ctx.arc(-14, 10, 5, 0, Math.PI * 2);
      ctx.arc(14, 10, 5, 0, Math.PI * 2);
      ctx.fill();
    } else if (vid === 'tractor') {
      ctx.fillStyle = '#e67e22';
      ctx.fillRect(-14, -8, 24, 14);
      ctx.fillStyle = '#222';
      ctx.beginPath();
      ctx.arc(-10, 10, 8, 0, Math.PI * 2);
      ctx.arc(12, 8, 5, 0, Math.PI * 2);
      ctx.fill();
    } else if (vid === 'truck') {
      ctx.fillStyle = '#2980b9';
      ctx.fillRect(-22, -8, 26, 16);
      ctx.fillStyle = '#3498db';
      ctx.fillRect(4, -12, 16, 20);
      ctx.fillStyle = '#222';
      ctx.beginPath();
      ctx.arc(-14, 10, 5, 0, Math.PI * 2);
      ctx.arc(2, 10, 5, 0, Math.PI * 2);
      ctx.arc(14, 10, 5, 0, Math.PI * 2);
      ctx.fill();
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
    murree: ['pipe', 'tree', 'kite', 'wires']
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
      rain: { sky0: '#7f8c8d', sky1: '#95a5a6', sky2: '#bdc3c7', ground: '#6d5c4d', grass: '#5a8f3a', pipe: '#2d5a3d', pipeCap: '#3d7a4d', rain: true }
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
        const icons = { none: '·', topi: '🎩', cap: '🧢', crown: '👑', sunglasses: '🕶', hat: '👒', helmet: '⛑', scarf: '🧣', spark: '✨', smoke: '💨', stars: '⭐', star: '🌟', fire: '🔥', rainbow: '🌈' };
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
    SKINS, BIRDS, VEHICLES, ENVS, WEATHERS, HATS, TRAILS,
    BIRD_PASSIVES, birdPassive, weatherMods, BOSS_KINDS, pickBossKind,
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
