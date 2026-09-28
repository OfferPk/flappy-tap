/**
 * Cosmetic skins: bird / bike / rickshaw — canvas-drawn, pickable, persist via FTStorage.
 */
(function (global) {
  'use strict';

  const SKINS = [
    { id: 'bird', label: 'Bird' },
    { id: 'bike', label: 'Bike' },
    { id: 'rickshaw', label: 'Rickshaw' }
  ];

  function drawBird(ctx, x, y, rot, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.scale(scale, scale);
    // body
    ctx.fillStyle = '#ffd93d';
    ctx.beginPath();
    ctx.ellipse(0, 0, 16, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    // wing
    ctx.fillStyle = '#f0a500';
    ctx.beginPath();
    ctx.ellipse(-2, 2, 10, 6, -0.4, 0, Math.PI * 2);
    ctx.fill();
    // eye
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(8, -4, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(10, -4, 2.2, 0, Math.PI * 2);
    ctx.fill();
    // beak
    ctx.fillStyle = '#ff6b6b';
    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.lineTo(24, 2);
    ctx.lineTo(14, 5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawBike(ctx, x, y, rot, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.scale(scale, scale);
    ctx.strokeStyle = '#4ecdc4';
    ctx.fillStyle = '#4ecdc4';
    ctx.lineWidth = 2.5;
    // wheels
    ctx.beginPath();
    ctx.arc(-12, 8, 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(12, 8, 8, 0, Math.PI * 2);
    ctx.stroke();
    // frame
    ctx.beginPath();
    ctx.moveTo(-12, 8);
    ctx.lineTo(0, -6);
    ctx.lineTo(12, 8);
    ctx.moveTo(0, -6);
    ctx.lineTo(0, 4);
    ctx.moveTo(-4, 4);
    ctx.lineTo(8, 4);
    ctx.stroke();
    // rider blob
    ctx.fillStyle = '#ffd93d';
    ctx.beginPath();
    ctx.arc(0, -12, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawRickshaw(ctx, x, y, rot, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.scale(scale * 0.9, scale * 0.9);
    // cabin
    ctx.fillStyle = '#ff6b6b';
    ctx.fillRect(-18, -10, 28, 18);
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(-18, -14, 28, 6);
    // canopy stripe
    ctx.fillStyle = '#ffd93d';
    ctx.fillRect(-16, -12, 24, 3);
    // wheels
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(-10, 12, 7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(14, 12, 7, 0, Math.PI * 2);
    ctx.stroke();
    // driver
    ctx.fillStyle = '#4ecdc4';
    ctx.beginPath();
    ctx.arc(10, -4, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  const DRAW = {
    bird: drawBird,
    bike: drawBike,
    rickshaw: drawRickshaw
  };

  function draw(ctx, id, x, y, rot, scale) {
    const fn = DRAW[id] || drawBird;
    fn(ctx, x, y, rot || 0, scale == null ? 1 : scale);
  }

  function hitbox(id) {
    // Approximate AABB half-sizes for collision (logical game units)
    if (id === 'bike') return { w: 28, h: 22 };
    if (id === 'rickshaw') return { w: 30, h: 24 };
    return { w: 26, h: 20 };
  }

  function renderPicker(container, selectedId, onPick) {
    if (!container) return;
    container.innerHTML = '';
    SKINS.forEach((skin) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'skin-card' + (skin.id === selectedId ? ' selected' : '');
      btn.dataset.skin = skin.id;
      const c = document.createElement('canvas');
      c.width = 64;
      c.height = 64;
      const cctx = c.getContext('2d');
      cctx.clearRect(0, 0, 64, 64);
      draw(cctx, skin.id, 32, 32, 0, 1.15);
      const label = document.createElement('span');
      label.textContent = skin.label;
      btn.appendChild(c);
      btn.appendChild(label);
      btn.addEventListener('click', () => {
        onPick(skin.id);
        container.querySelectorAll('.skin-card').forEach((el) => {
          el.classList.toggle('selected', el.dataset.skin === skin.id);
        });
      });
      container.appendChild(btn);
    });
  }

  global.FTSkins = { SKINS, draw, hitbox, renderPicker };
})(window);
