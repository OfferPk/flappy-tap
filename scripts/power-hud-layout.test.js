#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const net = require('node:net');
const os = require('node:os');
const path = require('node:path');

const root = path.join(__dirname, '..');
const chromium = process.env.CHROMIUM_BIN || '/usr/bin/chromium';
if (!fs.existsSync(chromium)) {
  console.error('Responsive layout test requires Chromium at ' + chromium + ' (override with CHROMIUM_BIN).');
  process.exit(1);
}

const html = `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<link rel="stylesheet" href="${'file://' + path.join(root, 'css/style.css')}">
<style>#hud { display:block; } #game { position:absolute; inset:0; } #combo-display, #lives-hud, #timer-hud { display:block; }</style>
</head><body class="has-notch-pad"><main id="app"><canvas id="game"></canvas><div id="hud" class="overlay-layer">
<div id="score-display">128</div><div id="combo-display">COMBO 5</div><div id="mode-badge">Classic</div>
<div id="coin-hud">🪙 20</div><div id="timer-hud">60s</div><div id="lives-hud" class="lives-hud">♥ 3</div>
<div id="power-hud" role="group" aria-label="Active effects" aria-live="off">
<span class="power-chip power-shield" aria-label="Shield active: blocks one hard hit">🛡 Shield · 1 hit</span>
<span class="power-chip power-slowmo" aria-label="Slow-mo: 3 seconds remaining">⏱ Slow-mo 3s</span>
<span class="power-chip power-magnet" aria-label="Magnet: 4 seconds remaining">🧲 Magnet 4s</span>
<span class="power-chip power-turbo" aria-label="Turbo: 3 seconds remaining">⚡ Turbo 3s</span>
<span class="power-chip power-ghost" aria-label="Ghost: 2 seconds remaining">👻 Ghost 2s</span>
<span class="power-chip power-risky" aria-label="Risky multiplier: 4 seconds remaining">🎯 RISKY 3× 4s</span>
<span class="power-chip power-onelife" aria-label="One Life mode">1️⃣ One Life</span>
</div>
<button id="btn-pause" class="icon-btn" aria-label="Pause">⏸</button><button id="btn-mute" class="icon-btn" aria-label="Mute sound">🔊</button>
</div></main>
<script>
function overlaps(a,b){return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;}
function runCheck(){
  const app=document.getElementById('app').getBoundingClientRect();
  const hud=document.getElementById('power-hud');
  const row=hud.getBoundingClientRect();
  const chips=[...hud.querySelectorAll('.power-chip')].map(x=>({el:x,r:x.getBoundingClientRect()}));
  const ids=['score-display','combo-display','btn-pause','btn-mute','mode-badge','coin-hud','timer-hud','lives-hud'];
  const blockers=ids.map(id=>({id,r:document.getElementById(id).getBoundingClientRect()}));
  const errors=[];
  if(row.width>app.width+0.5 || row.left<app.left-0.5 || row.right>app.right+0.5) errors.push('row outside app');
  if(row.top < blockers.find(x=>x.id==='lives-hud').r.bottom) errors.push('row overlaps lives/status band');
  if(row.bottom > innerHeight*0.5) errors.push('row extends into center gameplay region');
  for(const chip of chips){
    if(chip.r.width<=0 || chip.r.height<=0) errors.push('empty chip');
    if(chip.r.height>30) errors.push('chip is not compact horizontally');
    if(chip.r.left<row.left-0.5 || chip.r.right>row.right+0.5) errors.push('chip outside row');
    for(const blocker of blockers){if(overlaps(chip.r,blocker.r)) errors.push('chip overlaps '+blocker.id);}
  }
  for(let i=0;i<chips.length;i++) for(let j=i+1;j<chips.length;j++) if(overlaps(chips[i].r,chips[j].r)) errors.push('chips overlap each other');
  const hiddenProbe=document.createElement('div'); hiddenProbe.id='power-hud'; hiddenProbe.hidden=true; document.body.appendChild(hiddenProbe);
  if(getComputedStyle(hiddenProbe).display!=='none') errors.push('hidden state overridden by flex styling');
  document.documentElement.dataset.layoutOk=errors.length?'false':'true';
  document.documentElement.dataset.layoutErrors=errors.join(';');
  document.documentElement.dataset.layoutBounds=JSON.stringify({viewport:[innerWidth,innerHeight],row:[row.left,row.top,row.right,row.bottom],chips:chips.map(x=>[x.r.left,x.r.top,x.r.right,x.r.bottom])});
}
requestAnimationFrame(()=>requestAnimationFrame(runCheck));
</script></body></html>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'flappy-power-hud-'));
const file = path.join(dir, 'layout.html');
fs.writeFileSync(file, html);

async function freePort() {
  const server = net.createServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  return port;
}
function delay(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

async function runAt(width, height) {
  const port = await freePort();
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'flappy-power-hud-chrome-'));
  const browser = spawn(chromium, [
    '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
    '--remote-allow-origins=*', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, 'about:blank'
  ], { stdio: 'ignore' });
  let ws;
  try {
    let page;
    for (let i = 0; i < 80; i++) {
      try {
        const pages = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
        page = pages.find((item) => item.type === 'page');
        if (page) break;
      } catch (_) { /* browser is still starting */ }
      await delay(100);
    }
    assert.ok(page, 'Chromium DevTools page started');
    ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.addEventListener('open', resolve, { once: true });
      ws.addEventListener('error', reject, { once: true });
    });
    let nextId = 0;
    const pending = new Map();
    ws.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      if (message.id && pending.has(message.id)) {
        pending.get(message.id)(message);
        pending.delete(message.id);
      }
    });
    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const id = ++nextId;
      const timer = setTimeout(() => { pending.delete(id); reject(new Error('DevTools timeout: ' + method)); }, 10000);
      pending.set(id, (message) => { clearTimeout(timer); message.error ? reject(new Error(message.error.message)) : resolve(message); });
      ws.send(JSON.stringify({ id, method, params }));
    });
    await send('Page.enable');
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: true });
    await send('Page.navigate', { url: 'file://' + file });
    await delay(350);
    const result = await send('Runtime.evaluate', {
      expression: '({ok:document.documentElement.dataset.layoutOk,errors:document.documentElement.dataset.layoutErrors,bounds:document.documentElement.dataset.layoutBounds})',
      returnByValue: true
    });
    const data = result.result.result.value;
    assert.equal(data.ok, 'true', `${width}×${height} non-overlap failed: ${data.errors} ${data.bounds}`);
    const bounds = JSON.parse(data.bounds);
    assert.deepEqual(bounds.viewport, [width, height], 'exact CSS viewport emulation is active');
    console.log(`POWER HUD LAYOUT OK · ${width}×${height} · ${data.bounds}`);
  } finally {
    if (ws && ws.readyState === WebSocket.OPEN) ws.close();
    browser.kill('SIGTERM');
    await new Promise((resolve) => browser.once('close', resolve));
    for (let i = 0; i < 5; i++) {
      try { fs.rmSync(profile, { recursive: true, force: true }); break; }
      catch (_) { await delay(100); }
    }
  }
}

(async () => {
  try {
    await runAt(320, 568);
    await runAt(390, 844);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
