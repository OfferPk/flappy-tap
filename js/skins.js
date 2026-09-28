/**
 * Cosmetic skins: bird / bike / rickshaw / rocket — canvas-drawn, pickable, persist via FTStorage.
 * Hitboxes ~10–15% smaller than visual sprite AABB for forgiving collisions.
 */
(function (global) {
  'use strict';

  const SKINS = [
    { id: 'bird', label: 'Bird', free: true },
    { id: 'bike', label: 'Bike', free: true },
    { id: 'rickshaw', label: 'Rickshaw', free: true },
    { id: 'rocket', label: 'Rocket', free: false, unlockScore: 40 }
  ];

  function drawBird(ctx, x, y, rot, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.scale(scale, scale);
    ctx.fillStyle = '#ffd93d';
    ctx.beginPath();
    ctx.ellipse(0, 0, 16, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f0a500';
    ctx.beginPath();
    ctx.ellipse(-2, 2, 10, 6, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(8, -4, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(10, -4, 2.2, 0, Math.PI * 2);
    ctx.fill();
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
    ctx.beginPath();
    ctx.arc(-12, 8, 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(12, 8, 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-12, 8);
    ctx.lineTo(0, -6);
    ctx.lineTo(12, 8);
    ctx.moveTo(0, -6);
    ctx.lineTo(0, 4);
    ctx.moveTo(-4, 4);
    ctx.lineTo(8, 4);
    ctx.stroke();
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
    ctx.fillStyle = '#ff6b6b';
    ctx.fillRect(-18, -10, 28, 18);
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(-18, -14, 28, 6);
    ctx.fillStyle = '#ffd93d';
    ctx.fillRect(-16, -12, 24, 3);
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(-10, 12, 7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(14, 12, 7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#4ecdc4';
    ctx.beginPath();
    ctx.arc(10, -4, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawRocket(ctx, x, y, rot, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.scale(scale, scale);
    // body
    ctx.fillStyle = '#e8eef8';
    ctx.beginPath();
    ctx.moveTo(18, 0);
    ctx.lineTo(4, -10);
    ctx.lineTo(-14, -8);
    ctx.lineTo(-14, 8);
    ctx.lineTo(4, 10);
    ctx.closePath();
    ctx.fill();
    // nose
    ctx.fillStyle = '#ff6b6b';
    ctx.beginPath();
    ctx.moveTo(18, 0);
    ctx.lineTo(4, -10);
    ctx.lineTo(4, 10);
    ctx.closePath();
    ctx.fill();
    // window
    ctx.fillStyle = '#4ecdc4';
    ctx.beginPath();
    ctx.arc(2, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    // fins
    ctx.fillStyle = '#5b7cfa';
    ctx.beginPath();
    ctx.moveTo(-10, -8);
    ctx.lineTo(-18, -16);
    ctx.lineTo(-14, -6);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-10, 8);
    ctx.lineTo(-18, 16);
    ctx.lineTo(-14, 6);
    ctx.closePath();
    ctx.fill();
    // flame
    ctx.fillStyle = '#ffd93d';
    ctx.beginPath();
    ctx.moveTo(-14, -4);
    ctx.lineTo(-26, 0);
    ctx.lineTo(-14, 4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ff6b6b';
    ctx.beginPath();
    ctx.moveTo(-14, -2);
    ctx.lineTo(-22, 0);
    ctx.lineTo(-14, 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  const DRAW = {
    bird: drawBird,
    bike: drawBike,
    rickshaw: drawRickshaw,
    rocket: drawRocket
  };

  function draw(ctx, id, x, y, rot, scale) {
    const fn = DRAW[id] || drawBird;
    fn(ctx, x, y, rot || 0, scale == null ? 1 : scale);
  }

  /**
   * Collision AABB (full width/height). Visual sprites are larger:
   * bird ~32×24 → 26×20 (~19%/17%); bike ~40×30 → 34×24; rickshaw ~36×30 → 30×24;
   * rocket ~44×32 → 36×26. ~10–15%+ forgiving vs raw sprite bounds.
   */
  function hitbox(id) {
    if (id === 'bike') return { w: 34, h: 24 };
    if (id === 'rickshaw') return { w: 30, h: 24 };
    if (id === 'rocket') return { w: 36, h: 26 };
    return { w: 26, h: 20 };
  }

  function isUnlocked(id) {
    if (typeof FTStorage !== 'undefined' && FTStorage.isSkinUnlocked) {
      return FTStorage.isSkinUnlocked(id);
    }
    const skin = SKINS.find((s) => s.id === id);
    return !skin || skin.free;
  }

  function renderPicker(container, selectedId, onPick, onUnlockRequest) {
    if (!container) return;
    container.innerHTML = '';
    SKINS.forEach((skin) => {
      const unlocked = isUnlocked(skin.id);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className =
        'skin-card' +
        (skin.id === selectedId && unlocked ? ' selected' : '') +
        (!unlocked ? ' locked' : '');
      btn.dataset.skin = skin.id;
      const c = document.createElement('canvas');
      c.width = 64;
      c.height = 64;
      const cctx = c.getContext('2d');
      cctx.clearRect(0, 0, 64, 64);
      draw(cctx, skin.id, 32, 32, 0, 1.15);
      if (!unlocked) {
        cctx.fillStyle = 'rgba(15,23,42,0.55)';
        cctx.fillRect(0, 0, 64, 64);
        cctx.fillStyle = '#ffd93d';
        cctx.font = 'bold 18px system-ui';
        cctx.textAlign = 'center';
        cctx.textBaseline = 'middle';
        cctx.fillText('🔒', 32, 32);
      }
      const label = document.createElement('span');
      label.textContent = unlocked ? skin.label : skin.label + ' 🔒';
      btn.appendChild(c);
      btn.appendChild(label);
      if (!unlocked) {
        const unlockHint = document.createElement('span');
        unlockHint.className = 'skin-unlock-hint';
        unlockHint.textContent =
          'Score ' + (skin.unlockScore || 40) + '+ or Ad';
        btn.appendChild(unlockHint);
      }
      btn.addEventListener('click', () => {
        if (!unlocked) {
          if (typeof onUnlockRequest === 'function') {
            onUnlockRequest(skin);
          }
          return;
        }
        onPick(skin.id);
        container.querySelectorAll('.skin-card').forEach((el) => {
          el.classList.toggle(
            'selected',
            el.dataset.skin === skin.id && !el.classList.contains('locked')
          );
        });
      });
      container.appendChild(btn);
    });
  }

  global.FTSkins = { SKINS, draw, hitbox, renderPicker, isUnlocked };
})(window);
