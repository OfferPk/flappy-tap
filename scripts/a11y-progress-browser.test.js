#!/usr/bin/env node
'use strict';

// Real-browser UI coverage using the Chromium binary already required by the layout suite.
// No Playwright/Puppeteer dependency: drive the page through Chromium DevTools Protocol.
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const http = require('node:http');
const net = require('node:net');
const os = require('node:os');
const path = require('node:path');

const root = path.join(__dirname, '..');
const chromium = process.env.CHROMIUM_BIN || '/usr/bin/chromium';
if (!fs.existsSync(chromium)) {
  console.error('Accessibility/progress browser test requires Chromium at ' + chromium + ' (override with CHROMIUM_BIN).');
  process.exit(1);
}
if (typeof WebSocket !== 'function') {
  console.error('Accessibility/progress browser test requires Node.js with the built-in WebSocket API (Node 21+).');
  process.exit(1);
}

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp',
  '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2'
};
const server = http.createServer((request, response) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname); }
  catch (_) { response.writeHead(400).end('Bad request'); return; }
  const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  let filename = path.resolve(root, relative);
  if (filename !== root && !filename.startsWith(root + path.sep)) { response.writeHead(403).end('Forbidden'); return; }
  try {
    if (fs.statSync(filename).isDirectory()) filename = path.join(filename, 'index.html');
    const stat = fs.statSync(filename);
    response.writeHead(200, {
      'Content-Type': MIME[path.extname(filename).toLowerCase()] || 'application/octet-stream',
      'Content-Length': stat.size,
      'Cache-Control': 'no-store'
    });
    fs.createReadStream(filename).pipe(response);
  } catch (_) { response.writeHead(404).end('Not found'); }
});

function delay(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }
async function freePort() {
  const socket = net.createServer();
  await new Promise((resolve) => socket.listen(0, '127.0.0.1', resolve));
  const port = socket.address().port;
  await new Promise((resolve) => socket.close(resolve));
  return port;
}
async function waitFor(read, label, timeout = 8000) {
  const end = Date.now() + timeout;
  let last;
  while (Date.now() < end) {
    try {
      last = await read();
      if (last) return last;
    } catch (_) { /* page may be navigating/reloading */ }
    await delay(50);
  }
  throw new Error('Timed out waiting for ' + label + (last ? ' (last=' + last + ')' : ''));
}

class DevTools {
  constructor(socket) {
    this.socket = socket;
    this.nextId = 0;
    this.pending = new Map();
    socket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      if (message.id) {
        const pending = this.pending.get(message.id);
        if (!pending) return;
        this.pending.delete(message.id);
        clearTimeout(pending.timer);
        if (message.error) pending.reject(new Error(message.error.message));
        else pending.resolve(message);
      }
    });
  }
  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++this.nextId;
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error('DevTools timeout: ' + method));
      }, 10000);
      this.pending.set(id, { resolve, reject, timer });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }
  async evaluate(expression) {
    const response = await this.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    const result = response.result.result;
    if (response.result.exceptionDetails) {
      throw new Error('Page evaluation failed: ' + (response.result.exceptionDetails.text || result.description || 'unknown error'));
    }
    return result.value;
  }
  async press(key, code, virtualKeyCode) {
    const params = { key, code, windowsVirtualKeyCode: virtualKeyCode, nativeVirtualKeyCode: virtualKeyCode };
    const keyDown = Object.assign({ type: 'keyDown' }, params);
    if (key === 'Enter') keyDown.text = keyDown.unmodifiedText = '\r';
    else if (key === ' ') keyDown.text = keyDown.unmodifiedText = ' ';
    await this.send('Input.dispatchKeyEvent', keyDown);
    await this.send('Input.dispatchKeyEvent', Object.assign({ type: 'keyUp' }, params));
    await delay(35);
  }
}

(async () => {
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'flappy-a11y-progress-'));
  const profile = path.join(scratch, 'chrome-profile');
  const downloads = path.join(scratch, 'downloads');
  fs.mkdirSync(downloads);
  let browser;
  let ws;
  let cdp;
  let appServer;
  try {
    const httpPort = await new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server.address().port)));
    appServer = true;
    const debugPort = await freePort();
    browser = spawn(chromium, [
      '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
      '--disable-background-networking', '--disable-extensions', '--no-first-run', '--no-default-browser-check',
      '--remote-allow-origins=*', `--remote-debugging-port=${debugPort}`, `--user-data-dir=${profile}`, 'about:blank'
    ], { stdio: 'ignore' });

    const page = await waitFor(async () => {
      const pages = await (await fetch(`http://127.0.0.1:${debugPort}/json/list`)).json();
      return pages.find((item) => item.type === 'page');
    }, 'Chromium DevTools page');
    ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.addEventListener('open', resolve, { once: true });
      ws.addEventListener('error', reject, { once: true });
    });
    cdp = new DevTools(ws);
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Network.enable');
    await cdp.send('Network.setBypassServiceWorker', { bypass: true });
    await cdp.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: downloads });
    await cdp.send('Page.navigate', { url: `http://127.0.0.1:${httpPort}/` });
    await waitFor(() => cdp.evaluate("document.readyState === 'complete' && !!window.FTStorage && !!document.getElementById('btn-play')"), 'app initialization');

    // Seed a deterministic local save and skip first-run coach marks, then reload so the game initializes from it.
    await cdp.evaluate("localStorage.setItem('flappy-tap:best','47'); localStorage.setItem('flappy-tap:coins','123'); localStorage.setItem('flappy-tap:runs','10'); localStorage.setItem('flappy-tap:coach-done','1'); localStorage.setItem('flappy-tap:mute','1'); localStorage.setItem('flappy-tap:resume-countdown','1'); true");
    const splashObserverScript = await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: `(() => {
      window.__bootSplashProgressSamples = [];
      let previous = '';
      const capture = () => {
        const splash = document.getElementById('boot-splash');
        const progress = document.getElementById('splash-progress-bar');
        const percentage = document.getElementById('splash-progress-pct');
        const hint = document.querySelector('.splash-hint');
        const announcer = document.getElementById('game-announcer');
        if (!splash || !progress || !percentage || !hint || !announcer) return;
        const sample = {role:splash.getAttribute('role'),live:splash.getAttribute('aria-live'),value:progress.getAttribute('aria-valuenow'),valueText:progress.getAttribute('aria-valuetext'),percentage:percentage.textContent,hint:hint.textContent,announcement:announcer.textContent};
        const key = JSON.stringify(sample);
        if (key !== previous) { window.__bootSplashProgressSamples.push(sample); previous = key; }
      };
      const observer = new MutationObserver(capture);
      observer.observe(document, {subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['aria-valuenow','aria-valuetext']});
      window.__stopBootSplashProgressObserver = () => observer.disconnect();
      capture();
    })();` });
    await cdp.send('Page.reload', { ignoreCache: true });
    await waitFor(() => cdp.evaluate("document.readyState === 'complete' && !!window.FTStorage && document.getElementById('boot-splash').hidden"), 'menu after boot');
    const bootProgressSamples = await cdp.evaluate("window.__bootSplashProgressSamples || []");
    await cdp.evaluate("window.__stopBootSplashProgressObserver && window.__stopBootSplashProgressObserver()");
    await cdp.send('Page.removeScriptToEvaluateOnNewDocument', { identifier: splashObserverScript.result.identifier });
    const bootProgressByValue = Object.fromEntries(bootProgressSamples.filter((sample) => sample.value).map((sample) => [sample.value, sample]));
    for (const value of ['12', '38', '62', '85', '100']) {
      const sample = bootProgressByValue[value];
      assert.ok(sample, `boot progress exposes ${value}% to the browser`);
      assert.deepEqual({role:sample.role,live:sample.live,percentage:sample.percentage,valueText:sample.valueText},
        {role:null,live:'off',percentage:`${value}%`,valueText:`${sample.hint} · ${value}%`},
        `boot progress ${value}% remains available without a live-region announcement`);
    }
    for (const value of ['38', '62', '85']) {
      assert.equal(bootProgressByValue[value].announcement,'Loading game.',`${value}% progress does not replace the single loading announcement`);
    }
    assert.ok(bootProgressSamples.some((sample) => sample.value === '100' && sample.announcement === 'Game ready.'),
      'boot completion is announced once after progress reaches 100%');
    const bootFinalSemantics = await cdp.evaluate("(() => {const s=document.getElementById('boot-splash'),p=document.getElementById('splash-progress-bar');return {role:s.getAttribute('role'),live:s.getAttribute('aria-live'),progressRole:p.getAttribute('role'),value:p.getAttribute('aria-valuenow'),valueText:p.getAttribute('aria-valuetext'),visiblePercent:document.getElementById('splash-progress-pct').textContent,hint:document.querySelector('.splash-hint').textContent,announcement:document.getElementById('game-announcer').textContent};})()");
    assert.deepEqual(bootFinalSemantics,{role:null,live:'off',progressRole:'progressbar',value:'100',valueText:'Ready — Urr Jao! · 100%',visiblePercent:'100%',hint:'Ready — Urr Jao!',announcement:'Game ready.'},
      'the finished splash keeps its final visible and accessible progress and announces readiness');
    const dailyCountdowns = await cdp.evaluate(`(() => {
      const menu = document.getElementById('daily-reset-countdown');
      const modes = document.getElementById('daily-reset-countdown-modes');
      const info = (el) => ({role:el.getAttribute('role'),live:el.getAttribute('aria-live'),hidden:el.hidden,text:el.textContent});
      return {menu:info(menu),modes:info(modes)};
    })()`);
    assert.equal(dailyCountdowns.menu.role,'timer','menu countdown has timer semantics, not a repeating status announcement');
    assert.equal(dailyCountdowns.menu.live,'off','menu clock updates do not announce every second');
    assert.equal(dailyCountdowns.menu.hidden,false,'the visual menu countdown remains visible');
    assert.match(dailyCountdowns.menu.text,/^Daily resets in \d+:\d{2}:\d{2}$/,'the visible menu text still includes the reset time');
    assert.equal(dailyCountdowns.modes.role,'timer','Modes countdown also has timer semantics');
    assert.equal(dailyCountdowns.modes.live,'off','Modes clock updates are not a live announcement stream');
    const nextCountdownTick = await waitFor(() => cdp.evaluate(`(() => {
      const text = document.getElementById('daily-reset-countdown').textContent;
      return text !== ${JSON.stringify(dailyCountdowns.menu.text)} ? text : null;
    })()`), 'visible daily countdown tick', 3500);
    assert.notEqual(nextCountdownTick,dailyCountdowns.menu.text,'the visual countdown continues updating once its announcements are silenced');

    async function clickElementAt(selector) {
      const point = await cdp.evaluate(`(() => {
        const element = document.querySelector(${JSON.stringify(selector)});
        if (!element) return null;
        const rect = element.getBoundingClientRect();
        const x = (rect.left + rect.right) / 2;
        const y = (rect.top + rect.bottom) / 2;
        const target = document.elementFromPoint(x, y);
        return { x, y, hidden: element.hidden, hit: !!target && (target === element || element.contains(target)) };
      })()`);
      assert.ok(point && !point.hidden && point.hit, `${selector} center is visible and receives pointer hits`);
      await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: point.x, y: point.y });
      await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: point.x, y: point.y, button: 'left', clickCount: 1 });
      await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: point.x, y: point.y, button: 'left', clickCount: 1 });
    }
    async function changePageVisibility(hidden) {
      const state = hidden ? 'hidden' : 'visible';
      const actual = await cdp.evaluate(`(() => {
        Object.defineProperty(document, 'hidden', { configurable: true, value: ${hidden} });
        Object.defineProperty(document, 'visibilityState', { configurable: true, value: ${JSON.stringify(state)} });
        document.dispatchEvent(new Event('visibilitychange'));
        return { hidden: document.hidden, visibilityState: document.visibilityState };
      })()`);
      assert.deepEqual(actual, { hidden, visibilityState: state }, 'dispatch a coherent page visibilitychange transition');
    }
    async function checkShortMenuViewport(width, height) {
      await cdp.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: true });
      await waitFor(() => cdp.evaluate(`innerWidth === ${width} && innerHeight === ${height}`), `${width}×${height} menu viewport`);
      const initial = await cdp.evaluate(`(() => {
        const rect = (selector) => { const r = document.querySelector(selector).getBoundingClientRect(); return { top: r.top, bottom: r.bottom, left: r.left, right: r.right }; };
        const menu = document.getElementById('screen-start');
        const prompt = document.getElementById('a2hs');
        const play = document.getElementById('btn-play');
        const playRect = play.getBoundingClientRect();
        const hit = document.elementFromPoint((playRect.left + playRect.right) / 2, (playRect.top + playRect.bottom) / 2);
        return { viewport: [innerWidth, innerHeight], overflowY: getComputedStyle(menu).overflowY,
          clientHeight: menu.clientHeight, scrollHeight: menu.scrollHeight,
          app: rect('#app'), title: rect('#screen-start .logo'), play: rect('#btn-play'), prompt: rect('#a2hs'),
          promptHidden: prompt.hidden, promptPosition: getComputedStyle(prompt).position,
          promptLayout: menu.classList.contains('a2hs-prompt-visible'), playHit: !!(hit && hit.closest('#btn-play')) };
      })()`);
      assert.deepEqual(initial.viewport, [width, height], 'requested narrow viewport is active');
      assert.equal(initial.overflowY, 'auto', `${width}×${height} menu remains scrollable`);
      assert.ok(initial.scrollHeight > initial.clientHeight, `${width}×${height} menu overflow is scrollable rather than clipped`);
      assert.ok(initial.title.top >= initial.app.top && initial.title.bottom <= initial.app.bottom,
        `${width}×${height} title stays inside the first view: ${JSON.stringify(initial.title)}`);
      assert.ok(initial.play.top >= initial.app.top && initial.play.bottom <= initial.app.bottom,
        `${width}×${height} Play button stays inside the first view: ${JSON.stringify(initial.play)}`);
      assert.equal(initial.promptHidden, false, `${width}×${height} A2HS prompt is present for the seeded returning player`);
      assert.equal(initial.promptLayout, true, `${width}×${height} menu enters A2HS scroll layout while the prompt is visible`);
      assert.equal(initial.promptPosition, 'static', `${width}×${height} prompt follows menu content rather than overlaying controls`);
      assert.ok(initial.prompt.left >= initial.app.left && initial.prompt.right <= initial.app.right,
        `${width}×${height} prompt stays within the app width: ${JSON.stringify(initial.prompt)}`);
      assert.ok(initial.prompt.bottom <= initial.play.top || initial.prompt.top >= initial.play.bottom,
        `${width}×${height} prompt never overlaps Play: prompt=${JSON.stringify(initial.prompt)} play=${JSON.stringify(initial.play)}`);
      assert.equal(initial.playHit, true, `${width}×${height} Play center hit-tests to Play, not the install prompt`);

      await cdp.evaluate("(() => { const menu=document.getElementById('screen-start'); const runs=menu.querySelector('.runs-line'); menu.scrollTop=Math.max(0, runs.offsetTop + runs.offsetHeight - menu.clientHeight); return menu.scrollTop; })()");
      const bottom = await cdp.evaluate(`(() => {
        const rect = (selector) => { const r = document.querySelector(selector).getBoundingClientRect(); return { top: r.top, bottom: r.bottom, left: r.left, right: r.right }; };
        const menu = document.getElementById('screen-start');
        return { scrollTop: menu.scrollTop, app: rect('#app'), hint: rect('#controls-hint'), guide: rect('.guide-quick-link-wrap'), runs: rect('.runs-line') };
      })()`);
      assert.ok(bottom.scrollTop > 0 || bottom.runs.bottom <= bottom.app.bottom, `${width}×${height} menu footer is reachable without scrolling past it to the A2HS prompt`);
      assert.ok(bottom.hint.top >= bottom.app.top && bottom.hint.bottom <= bottom.app.bottom,
        `${width}×${height} controls hint can be fully viewed: ${JSON.stringify(bottom.hint)}`);
      assert.ok(bottom.hint.bottom <= bottom.guide.top, `${width}×${height} hint does not overlap the guide link`);
      assert.ok(bottom.runs.top >= bottom.app.top && bottom.runs.bottom <= bottom.app.bottom,
        `${width}×${height} final menu row is reachable: ${JSON.stringify(bottom.runs)}`);
      await cdp.evaluate("document.getElementById('screen-start').scrollTop = 0; true");
      console.log(`MENU VIEWPORT OK · ${width}×${height}`);
    }
    async function checkA2hsPromptViewport(width, height) {
      await cdp.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: true });
      await waitFor(() => cdp.evaluate(`innerWidth === ${width} && innerHeight === ${height}`), `${width}×${height} A2HS viewport`);
      await cdp.evaluate("document.getElementById('screen-start').scrollTop = 0; true");
      const layout = await cdp.evaluate(`(() => {
        const menu = document.getElementById('screen-start');
        const prompt = document.getElementById('a2hs');
        const play = document.getElementById('btn-play');
        const rect = (element) => { const r = element.getBoundingClientRect(); return { top: r.top, bottom: r.bottom, left: r.left, right: r.right }; };
        const appRect = rect(document.getElementById('app'));
        const playRect = rect(play);
        const hit = document.elementFromPoint((playRect.left + playRect.right) / 2, (playRect.top + playRect.bottom) / 2);
        return { app: appRect, play: playRect, prompt: rect(prompt), promptHidden: prompt.hidden,
          position: getComputedStyle(prompt).position, overflowY: getComputedStyle(menu).overflowY,
          layout: menu.classList.contains('a2hs-prompt-visible'), playHit: !!(hit && hit.closest('#btn-play')) };
      })()`);
      assert.equal(layout.promptHidden, false, `${width}×${height} install tip is visible`);
      assert.equal(layout.layout, true, `${width}×${height} menu scroll state matches the visible tip`);
      assert.equal(layout.position, 'static', `${width}×${height} tip is in normal menu flow`);
      assert.equal(layout.overflowY, 'auto', `${width}×${height} menu can scroll to the tip`);
      assert.ok(layout.play.top >= layout.app.top && layout.play.bottom <= layout.app.bottom,
        `${width}×${height} Play stays visible: ${JSON.stringify(layout.play)}`);
      assert.ok(layout.prompt.bottom <= layout.play.top || layout.prompt.top >= layout.play.bottom,
        `${width}×${height} tip and Play do not overlap: ${JSON.stringify(layout)}`);
      assert.equal(layout.playHit, true, `${width}×${height} Play receives a real pointer hit`);
      console.log(`A2HS VIEWPORT OK · ${width}×${height}`);
    }
    async function checkScaledMenuViewport(width, height, promptExpected) {
      await cdp.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: true });
      await waitFor(() => cdp.evaluate(`innerWidth === ${width} && innerHeight === ${height}`), `${width}×${height} 200% text-scale viewport`);
      await cdp.evaluate("document.documentElement.style.fontSize = '200%'; document.getElementById('screen-start').scrollTop = 0; true");
      const layout = await cdp.evaluate(`(() => {
        const menu = document.getElementById('screen-start');
        const prompt = document.getElementById('a2hs');
        const logo = document.querySelector('#screen-start .logo');
        const tagline = document.querySelector('#screen-start .tagline');
        const coins = document.querySelector('#screen-start .coins-line');
        const play = document.getElementById('btn-play');
        const copy = document.querySelector('#a2hs .a2hs-copy');
        const actions = document.querySelector('#a2hs .a2hs-actions');
        const rect = (element) => { const r = element.getBoundingClientRect(); return { top: r.top, bottom: r.bottom, left: r.left, right: r.right }; };
        const appRect = rect(document.getElementById('app'));
        const playRect = rect(play);
        const hit = document.elementFromPoint((playRect.left + playRect.right) / 2, (playRect.top + playRect.bottom) / 2);
        return { rootFont: getComputedStyle(document.documentElement).fontSize, overflowY: getComputedStyle(menu).overflowY,
          clientHeight: menu.clientHeight, scrollHeight: menu.scrollHeight, app: appRect, logo: rect(logo), tagline: rect(tagline),
          coins: rect(coins), play: playRect, prompt: rect(prompt), promptHidden: prompt.hidden,
          promptPosition: getComputedStyle(prompt).position, promptFont: getComputedStyle(copy).fontSize,
          logoOverflow: logo.scrollWidth > logo.clientWidth + 1, taglineOverflow: tagline.scrollWidth > tagline.clientWidth + 1,
          coinsOverflow: coins.scrollWidth > coins.clientWidth + 1, promptCopyOverflow: copy.scrollWidth > copy.clientWidth + 1,
          actions: rect(actions), playHit: !!(hit && hit.closest('#btn-play')) };
      })()`);
      assert.equal(layout.rootFont, '32px', `${width}×${height} test actually applies 200% text scaling`);
      assert.equal(layout.promptHidden, !promptExpected, `${width}×${height} prompt visibility matches its test state`);
      assert.ok(layout.logo.left >= layout.app.left && layout.logo.right <= layout.app.right,
        `${width}×${height} scaled title stays within the app width: ${JSON.stringify(layout.logo)}`);
      assert.ok(!layout.logoOverflow && !layout.taglineOverflow && !layout.coinsOverflow,
        `${width}×${height} scaled menu text wraps without horizontal clipping: ${JSON.stringify(layout)}`);
      assert.ok(layout.play.top >= layout.app.top && layout.play.bottom <= layout.app.bottom,
        `${width}×${height} scaled Play button remains in the first view: ${JSON.stringify(layout.play)}`);
      assert.ok(layout.logo.bottom <= layout.play.top,
        `${width}×${height} scaled title does not collide with Play: ${JSON.stringify(layout)}`);
      assert.equal(layout.playHit, true, `${width}×${height} scaled Play remains the pointer target`);
      if (layout.scrollHeight > layout.clientHeight) {
        assert.equal(layout.overflowY, 'auto', `${width}×${height} overflowing scaled menu remains scrollable`);
      }
      if (!promptExpected && layout.scrollHeight > layout.clientHeight) {
        await cdp.evaluate("(() => { const menu=document.getElementById('screen-start'); menu.scrollTop=menu.scrollHeight; return menu.scrollTop; })()");
        const footer = await cdp.evaluate("(() => { const r=document.querySelector('#screen-start .runs-line').getBoundingClientRect(); const a=document.getElementById('app').getBoundingClientRect(); return {top:r.top,bottom:r.bottom,appTop:a.top,appBottom:a.bottom}; })()");
        assert.ok(footer.top >= footer.appTop && footer.bottom <= footer.appBottom,
          `${width}×${height} scaled menu footer stays reachable after scrolling: ${JSON.stringify(footer)}`);
        await cdp.evaluate("document.getElementById('screen-start').scrollTop = 0; true");
      }
      if (promptExpected) {
        assert.equal(layout.promptPosition, 'static', `${width}×${height} scaled prompt remains in menu flow`);
        assert.ok(layout.prompt.left >= layout.app.left && layout.prompt.right <= layout.app.right,
          `${width}×${height} scaled prompt stays within app bounds: ${JSON.stringify(layout.prompt)}`);
        assert.ok(layout.prompt.bottom <= layout.play.top || layout.prompt.top >= layout.play.bottom,
          `${width}×${height} scaled prompt does not overlap Play: ${JSON.stringify(layout)}`);
        assert.ok(Number.parseFloat(layout.promptFont) >= 25,
          `${width}×${height} prompt copy visibly scales with text: ${layout.promptFont}`);
        assert.ok(!layout.promptCopyOverflow && layout.actions.left >= layout.prompt.left && layout.actions.right <= layout.prompt.right,
          `${width}×${height} prompt copy and actions fit inside the scaled card: ${JSON.stringify(layout)}`);
        await cdp.evaluate("(() => { const menu=document.getElementById('screen-start'); menu.scrollTop=menu.scrollHeight; return menu.scrollTop; })()");
        const dismiss = await cdp.evaluate("(() => { const e=document.getElementById('a2hs-ok'); const r=e.getBoundingClientRect(); const hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2); return {top:r.top,bottom:r.bottom,visible:r.top>=0&&r.bottom<=innerHeight,hit:!!hit&&(hit===e||e.contains(hit))}; })()");
        assert.ok(dismiss.visible && dismiss.hit, `${width}×${height} scaled prompt can scroll fully into view with a tappable dismiss control: ${JSON.stringify(dismiss)}`);
      }
      await cdp.evaluate("document.documentElement.style.fontSize = ''; document.getElementById('screen-start').scrollTop = 0; true");
      console.log(`TEXT SCALE OK · ${width}×${height} · 200% · prompt ${promptExpected ? 'visible' : 'dismissed'}`);
    }
    async function checkLandscapeSafeAreaViewport(width, height) {
      const insets = { top: 8, left: 44, bottom: 21, right: 44 };
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width, height, deviceScaleFactor: 2, mobile: true,
        screenOrientation: { type: 'landscapePrimary', angle: 90 }
      });
      await cdp.send('Emulation.setSafeAreaInsetsOverride', { insets });
      await waitFor(() => cdp.evaluate(`innerWidth === ${width} && innerHeight === ${height}`), `${width}×${height} landscape safe-area viewport`);
      const layout = await cdp.evaluate(`(() => {
        const menu = document.getElementById('screen-start');
        const prompt = document.getElementById('a2hs');
        const logo = document.querySelector('#screen-start .logo');
        const play = document.getElementById('btn-play');
        const rect = (element) => { const r = element.getBoundingClientRect(); return { top: r.top, bottom: r.bottom, left: r.left, right: r.right }; };
        const appRect = rect(document.getElementById('app'));
        const playRect = rect(play);
        const hit = document.elementFromPoint((playRect.left + playRect.right) / 2, (playRect.top + playRect.bottom) / 2);
        const rootStyle = getComputedStyle(document.documentElement);
        return { app: appRect, logo: rect(logo), play: playRect, prompt: rect(prompt), promptHidden: prompt.hidden,
          promptPosition: getComputedStyle(prompt).position, overflowY: getComputedStyle(menu).overflowY,
          safe: ['--safe-top','--safe-left','--safe-bottom','--safe-right'].map((name) => rootStyle.getPropertyValue(name).trim()),
          playHit: !!(hit && hit.closest('#btn-play')) };
      })()`);
      assert.deepEqual(layout.safe, ['8px', '44px', '21px', '44px'], `${width}×${height} native safe-area insets reach the game CSS`);
      assert.ok(layout.logo.top >= insets.top && layout.logo.left >= insets.left && layout.logo.right <= width - insets.right,
        `${width}×${height} title stays in the safe app area: ${JSON.stringify(layout.logo)}`);
      assert.ok(layout.play.left >= insets.left && layout.play.right <= width - insets.right,
        `${width}×${height} Play stays between landscape side insets: ${JSON.stringify(layout.play)}`);
      assert.ok(layout.play.top >= layout.app.top && layout.play.bottom <= layout.app.bottom,
        `${width}×${height} Play remains visible: ${JSON.stringify(layout.play)}`);
      assert.equal(layout.playHit, true, `${width}×${height} Play receives pointer hits inside safe area`);
      assert.equal(layout.promptHidden, false, `${width}×${height} install tip remains present`);
      assert.equal(layout.promptPosition, 'static', `${width}×${height} install tip follows the safe-area-aware menu flow`);
      assert.equal(layout.overflowY, 'auto', `${width}×${height} short landscape menu can scroll`);
      assert.ok(layout.prompt.left >= insets.left && layout.prompt.right <= width - insets.right,
        `${width}×${height} install tip stays within safe-area width: ${JSON.stringify(layout.prompt)}`);
      assert.ok(layout.prompt.bottom <= layout.play.top || layout.prompt.top >= layout.play.bottom,
        `${width}×${height} install tip does not overlap Play: ${JSON.stringify(layout)}`);
      await cdp.evaluate("(() => { const menu=document.getElementById('screen-start'); menu.scrollTop=menu.scrollHeight; return menu.scrollTop; })()");
      const dismiss = await cdp.evaluate("(() => { const e=document.getElementById('a2hs-ok'); const r=e.getBoundingClientRect(); const hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2); return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,visible:r.top>=0&&r.bottom<=innerHeight&&r.bottom<=innerHeight-21,hit:!!hit&&(hit===e||e.contains(hit))}; })()");
      assert.ok(dismiss.visible && dismiss.hit, `${width}×${height} dismiss action remains tappable above the bottom safe area: ${JSON.stringify(dismiss)}`);
      await cdp.evaluate("document.getElementById('screen-start').scrollTop = 0; true");
      console.log(`LANDSCAPE SAFE AREA OK · ${width}×${height} · insets ${insets.left}/${insets.top}/${insets.right}/${insets.bottom}`);
    }
    for (const [width, height] of [[320, 568], [320, 480], [320, 400]]) await checkShortMenuViewport(width, height);
    await checkA2hsPromptViewport(390, 844);
    await checkScaledMenuViewport(320, 480, true);
    await checkScaledMenuViewport(390, 844, true);
    await checkLandscapeSafeAreaViewport(568, 320);
    await checkLandscapeSafeAreaViewport(844, 390);
    await cdp.send('Emulation.setSafeAreaInsetsOverride', { insets: {} });
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 320, height: 480, deviceScaleFactor: 1, mobile: true });
    await waitFor(() => cdp.evaluate('innerWidth === 320 && innerHeight === 480'), '320×480 A2HS Play hit test viewport');
    await cdp.evaluate("document.getElementById('screen-start').scrollTop = 0; true");
    await clickElementAt('#btn-play');
    await waitFor(() => cdp.evaluate("document.getElementById('screen-start').hidden"), 'Play tap starts a run while the A2HS prompt is present');
    console.log('A2HS PLAY HIT TEST OK · 320×480');
    await cdp.send('Page.reload', { ignoreCache: true });
    await waitFor(() => cdp.evaluate("document.readyState === 'complete' && !!window.FTStorage && document.getElementById('boot-splash').hidden && !document.getElementById('screen-start').hidden"), 'menu restored after A2HS Play hit test');
    await cdp.evaluate("localStorage.setItem('flappy-tap:best','47'); localStorage.setItem('flappy-tap:coins','123'); localStorage.setItem('flappy-tap:runs','10'); localStorage.setItem('flappy-tap:coach-done','1'); localStorage.setItem('flappy-tap:mute','1'); localStorage.setItem('flappy-tap:resume-countdown','1'); true");
    await cdp.send('Page.reload', { ignoreCache: true });
    await waitFor(() => cdp.evaluate("document.readyState === 'complete' && !!window.FTStorage && document.getElementById('boot-splash').hidden && !document.getElementById('a2hs').hidden"), 'A2HS prompt restored for dismissal test');
    await cdp.evaluate("document.getElementById('a2hs-ok').scrollIntoView({ block: 'center', inline: 'nearest' }); true");
    await waitFor(() => cdp.evaluate("(() => { const r=document.getElementById('a2hs-ok').getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; })()"), 'A2HS dismiss control scrolls into view');
    await clickElementAt('#a2hs-ok');
    await waitFor(() => cdp.evaluate("document.getElementById('a2hs').hidden && !document.getElementById('screen-start').classList.contains('a2hs-prompt-visible')"), 'dismissed A2HS prompt restores normal menu layout');
    console.log('A2HS DISMISS HIT TEST OK · 320×480');
    await checkScaledMenuViewport(390, 844, false);
    await cdp.send('Emulation.clearDeviceMetricsOverride');
    await waitFor(() => cdp.evaluate('innerWidth > 320 && innerHeight > 400'), 'restore desktop viewport');
    const menuHint = await cdp.evaluate("document.getElementById('controls-hint').textContent");
    assert.match(menuHint, /Pause: ⏸ or Esc/i, 'the main-menu hint names the touch-accessible pause button and keyboard shortcut');

    await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
    async function setStreakViewport(width, height) {
      await cdp.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: true });
      await waitFor(() => cdp.evaluate(`innerWidth === ${width} && innerHeight === ${height}`), `${width}×${height} Streak viewport`);
      await cdp.evaluate("(() => { const r=document.documentElement.style; r.setProperty('--safe-top','24px'); r.setProperty('--safe-bottom','34px'); r.setProperty('--safe-left','8px'); r.setProperty('--safe-right','8px'); return true; })()");
    }
    async function openStreak() {
      await cdp.evaluate("document.getElementById('btn-streak').click(); true");
      await waitFor(() => cdp.evaluate("!document.getElementById('screen-streak').hidden"), 'Streak panel open');
      await delay(280);
    }
    async function tapAt(selector) {
      const point = await cdp.evaluate(`(() => { const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect(); return {x:r.left+r.width/2,y:r.top+r.height/2}; })()`);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ id: 1, x: point.x, y: point.y }] });
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await delay(100);
    }
    function parseRgb(value) {
      const match = String(value).match(/rgba?\(([^)]+)\)/);
      assert.ok(match, `expected a computed RGB color, got ${value}`);
      return match[1].split(',').slice(0, 3).map((channel) => Number(channel.trim()));
    }
    function contrastRatio(foreground, background) {
      const luminance = (rgb) => {
        const channels = rgb.map((value) => {
          const c = value / 255;
          return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
      };
      const a = luminance(parseRgb(foreground));
      const b = luminance(parseRgb(background));
      return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    }
    async function inspectStreakActions(width, height, expectedDisabled) {
      const data = await cdp.evaluate(`(() => {
        const rect = (el) => { const r=el.getBoundingClientRect(); return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height,visible:!!el.getClientRects().length}; };
        const claim=document.getElementById('btn-claim-streak');
        const back=document.querySelector('#screen-streak [data-close="streak"]');
        const claimStyle=getComputedStyle(claim), backStyle=getComputedStyle(back);
        const safe=getComputedStyle(document.documentElement);
        const body=document.getElementById('streak-body');
        const screen=document.getElementById('screen-streak'), screenStyle=getComputedStyle(screen);
        return {viewport:[innerWidth,innerHeight],app:rect(document.getElementById('app')),screen:rect(screen),screenStyle:{paddingTop:screenStyle.paddingTop,paddingBottom:screenStyle.paddingBottom,boxSizing:screenStyle.boxSizing,height:screenStyle.height,gap:screenStyle.gap},claim:Object.assign(rect(claim),{text:claim.textContent,disabled:claim.disabled,color:claimStyle.color,backgroundColor:claimStyle.backgroundColor,backgroundImage:claimStyle.backgroundImage,opacity:claimStyle.opacity}),back:Object.assign(rect(back),{text:back.textContent,color:backStyle.color,backgroundColor:backStyle.backgroundColor}),safe:{left:parseFloat(safe.getPropertyValue('--safe-left'))||0,right:parseFloat(safe.getPropertyValue('--safe-right'))||0,bottom:parseFloat(safe.getPropertyValue('--safe-bottom'))||0},body:{clientHeight:body.clientHeight,scrollHeight:body.scrollHeight}};
      })()`);
      assert.deepEqual(data.viewport, [width, height], 'requested Streak viewport is active');
      assert.equal(data.claim.visible && data.back.visible, true, `${width}×${height} both Streak actions are rendered`);
      assert.equal(data.claim.disabled, expectedDisabled, 'Claim is enabled only when a reward is available');
      for (const [name, button] of [['Claim', data.claim], ['Back', data.back]]) {
        assert.ok(button.width >= 44 && button.height >= 44, `${name} has a usable 44×44px touch target: ${JSON.stringify(button)}`);
        assert.ok(button.left >= data.app.left + data.safe.left - 1 && button.right <= data.app.right - data.safe.right + 1,
          `${name} stays inside the app and horizontal safe area: ${JSON.stringify(button)}`);
        assert.ok(button.bottom <= data.app.bottom - data.safe.bottom - 10,
          `${name} stays above the bottom safe area: ${JSON.stringify({button,app:data.app,safe:data.safe,screen:data.screen,screenStyle:data.screenStyle})}`);
      }
      assert.ok(data.back.top - data.claim.bottom >= 8, `Claim and Back have a clear gap and never overlap: ${JSON.stringify({claim:data.claim,back:data.back})}`);
      const stops = data.claim.backgroundImage.match(/rgba?\([^)]+\)/g) || [data.claim.backgroundColor];
      const claimContrast = Math.min(...stops.map((color) => contrastRatio(data.claim.color, color)));
      const backContrast = contrastRatio(data.back.color, data.back.backgroundColor);
      assert.ok(claimContrast >= 4.5, `Claim/status text contrast is WCAG AA: ${claimContrast.toFixed(2)}:1`);
      assert.ok(backContrast >= 4.5, `Back text contrast is WCAG AA: ${backContrast.toFixed(2)}:1`);
      if (expectedDisabled) {
        assert.equal(data.claim.text, 'Claimed today', 'the completed reward state has clear status text');
        assert.equal(data.claim.opacity, '1', 'the claimed status is not dimmed like an unavailable action');
      }
      if (width === 320 && height === 568) {
        const scrolled = await cdp.evaluate("(() => { const b=document.getElementById('streak-body'); b.scrollTop=b.scrollHeight; const c=document.getElementById('btn-claim-streak').getBoundingClientRect(); const k=document.querySelector('#screen-streak [data-close=\"streak\"]').getBoundingClientRect(); return {scrollTop:b.scrollTop,scrollHeight:b.scrollHeight,clientHeight:b.clientHeight,claimTop:c.top,backTop:k.top}; })()");
        assert.ok(scrolled.scrollTop > 0 && scrolled.scrollHeight > scrolled.clientHeight, 'calendar details remain independently scrollable on a small phone');
        assert.ok(Math.abs(scrolled.claimTop - data.claim.top) < 1 && Math.abs(scrolled.backTop - data.back.top) < 1,
          'the Claim and Back actions remain fixed and visible while the calendar scrolls');
        await cdp.evaluate("document.getElementById('streak-body').scrollTop=0; true");
      }
      console.log(`STREAK ACTIONS OK · ${width}×${height} · claim ${claimContrast.toFixed(1)}:1 · back ${backContrast.toFixed(1)}:1`);
      return data;
    }
    async function checkScaledStreakViewport(width,height,insets,landscape) {
      await cdp.send('Emulation.setDeviceMetricsOverride',{
        width,height,deviceScaleFactor:2,mobile:true,
        screenOrientation:{type:landscape?'landscapePrimary':'portraitPrimary',angle:landscape?90:0}
      });
      await cdp.send('Emulation.setSafeAreaInsetsOverride',{insets});
      await cdp.evaluate("(() => {const s=document.documentElement.style;s.fontSize='200%';['--safe-top','--safe-bottom','--safe-left','--safe-right'].forEach(k=>s.removeProperty(k));return true;})()");
      await openStreak();
      const actions=await inspectStreakActions(width,height,true);
      const layout=await cdp.evaluate(`(() => {
        const screen=document.getElementById('screen-streak'),body=document.getElementById('streak-body');
        const rect=(e)=>{const r=e.getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right};};
        const root=getComputedStyle(document.documentElement);
        const selectors=['.streak-status','.streak-days','.streak-day','.streak-day strong','.streak-calendar','.streak-cal-head','.streak-cal-dows','.streak-cal-grid','.streak-cal-cell'];
        const overflow=[];
        selectors.forEach(selector=>screen.querySelectorAll(selector).forEach(e=>{if(e.scrollWidth>e.clientWidth+1)overflow.push({selector,text:(e.textContent||'').trim().slice(0,40),width:e.clientWidth,scrollWidth:e.scrollWidth});}));
        const close=screen.querySelector('[data-close="streak"]');
        return {rootFont:getComputedStyle(document.documentElement).fontSize,
          safe:['--safe-top','--safe-left','--safe-bottom','--safe-right'].map(k=>root.getPropertyValue(k).trim()),
          heading:rect(screen.querySelector('h2')),body:rect(body),actions:rect(screen.querySelector('.streak-actions')),
          bodyScroll:{width:body.clientWidth,scrollWidth:body.scrollWidth,height:body.clientHeight,scrollHeight:body.scrollHeight},overflow,
          claimFont:getComputedStyle(document.getElementById('btn-claim-streak')).fontSize,
          backHit:(()=>{const r=close.getBoundingClientRect();const h=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return !!h&&(h===close||close.contains(h));})()};
      })()`);
      assert.equal(layout.rootFont,'32px',`${width}×${height} Streak uses 200% text scale`);
      assert.deepEqual(layout.safe,[`${insets.top}px`,`${insets.left}px`,`${insets.bottom}px`,`${insets.right}px`],`${width}×${height} native insets reach Streak CSS`);
      assert.ok(layout.heading.top>=insets.top && layout.heading.left>=insets.left && layout.heading.right<=width-insets.right,
        `${width}×${height} Streak heading remains inside the safe area: ${JSON.stringify(layout.heading)}`);
      assert.ok(layout.heading.bottom<=layout.body.top && layout.body.bottom<=layout.actions.top,
        `${width}×${height} Streak header, scrollable calendar, and footer do not overlap: ${JSON.stringify(layout)}`);
      assert.ok(layout.bodyScroll.width>=layout.bodyScroll.scrollWidth-1,
        `${width}×${height} scaled Streak content has no horizontal scroll/clipping: ${JSON.stringify(layout)}`);
      assert.deepEqual(layout.overflow,[],`${width}×${height} Streak calendar labels fit without horizontal clipping: ${JSON.stringify(layout.overflow)}`);
      assert.ok(Number.parseFloat(layout.claimFont)>=30,`${width}×${height} reward status text scales with the user's text setting`);
      assert.equal(layout.backHit,true,`${width}×${height} Back remains hit-testable at 200% scale`);
      const initial={claimTop:actions.claim.top,backTop:actions.back.top};
      await cdp.evaluate("(() => {const b=document.getElementById('streak-body');b.scrollTop=b.scrollHeight;return b.scrollTop;})()");
      const afterScroll=await cdp.evaluate("(() => {const c=document.getElementById('btn-claim-streak').getBoundingClientRect(),b=document.querySelector('#screen-streak [data-close=\"streak\"]').getBoundingClientRect(),s=document.getElementById('streak-body');return {claimTop:c.top,backTop:b.top,scrollTop:s.scrollTop,scrollHeight:s.scrollHeight};})()");
      assert.ok(afterScroll.scrollTop>0 && Math.abs(afterScroll.claimTop-initial.claimTop)<1 && Math.abs(afterScroll.backTop-initial.backTop)<1,
        `${width}×${height} fixed Streak actions stay visible while the scaled calendar scrolls: ${JSON.stringify(afterScroll)}`);
      await tapAt('#screen-streak [data-close="streak"]');
      await waitFor(()=>cdp.evaluate("document.getElementById('screen-streak').hidden"),`${width}×${height} scaled Streak Back action`);
      await cdp.evaluate("(() => {const s=document.documentElement.style;s.fontSize='';['--safe-top','--safe-bottom','--safe-left','--safe-right'].forEach(k=>s.removeProperty(k));return true;})()");
      await cdp.send('Emulation.setSafeAreaInsetsOverride',{insets:{}});
      await cdp.send('Emulation.clearDeviceMetricsOverride');
      await waitFor(()=>cdp.evaluate('innerWidth>320&&innerHeight>400'),'restore desktop after Streak audit');
      console.log(`STREAK SCALE/SAFE AREA OK · ${width}×${height} · 200% · ${landscape?'landscape':'portrait'}`);
    }

    await setStreakViewport(704, 1540);
    await openStreak();
    const claimableLayout = await inspectStreakActions(704, 1540, false);
    assert.match(claimableLayout.claim.text, /Claim Day 1/i, 'a claimable streak shows the current reward action');
    const coinsBeforeClaim = Number(await cdp.evaluate("localStorage.getItem('flappy-tap:coins') || '0'"));
    await tapAt('#btn-claim-streak');
    const claimOutcome = await waitFor(() => cdp.evaluate("(() => { const b=document.getElementById('btn-claim-streak'); return b.disabled && b.textContent === 'Claimed today' ? {text:b.textContent,coins:Number(localStorage.getItem('flappy-tap:coins')||'0')} : null; })()"), 'streak claim result');
    assert.equal(claimOutcome.coins, coinsBeforeClaim + 12, 'a Day 1 tap preserves and grants exactly the configured 12-coin reward');
    await tapAt('#screen-streak [data-close="streak"]');
    await waitFor(() => cdp.evaluate("document.getElementById('screen-streak').hidden && !document.getElementById('screen-start').hidden"), 'Streak Back returns to menu');
    assert.equal(await cdp.evaluate("document.activeElement.id"), 'btn-streak', 'Back restores focus to the Streak menu control');

    await cdp.evaluate("(() => { const n=new Date(); const day=n.getFullYear()+'-'+String(n.getMonth()+1).padStart(2,'0')+'-'+String(n.getDate()).padStart(2,'0'); localStorage.setItem('flappy-tap:streak-date',day); localStorage.setItem('flappy-tap:streak-day','2'); localStorage.setItem('flappy-tap:streak-claimed','1'); return true; })()");
    await checkScaledStreakViewport(320,568,{top:28,left:0,bottom:34,right:0},false);
    await checkScaledStreakViewport(568,320,{top:8,left:44,bottom:21,right:44},true);
    for (const [width, height] of [[704, 1540], [393, 690], [320, 568]]) {
      await setStreakViewport(width, height);
      await openStreak();
      const claimedLayout = await inspectStreakActions(width, height, true);
      assert.equal(claimedLayout.claim.text, 'Claimed today');
      const coinsBeforeDisabledTap = Number(await cdp.evaluate("localStorage.getItem('flappy-tap:coins') || '0'"));
      await tapAt('#btn-claim-streak');
      assert.equal(await cdp.evaluate("!document.getElementById('screen-streak').hidden"), true, 'tapping the disabled claimed status does not activate another action');
      assert.equal(Number(await cdp.evaluate("localStorage.getItem('flappy-tap:coins') || '0'")), coinsBeforeDisabledTap, 'the claimed state cannot grant duplicate rewards');
      await tapAt('#screen-streak [data-close="streak"]');
      await waitFor(() => cdp.evaluate("document.getElementById('screen-streak').hidden && !document.getElementById('screen-start').hidden"), `${width}×${height} Back tap returns to menu`);
    }
    await cdp.evaluate("(() => { const s=document.documentElement.style; ['--safe-top','--safe-bottom','--safe-left','--safe-right'].forEach(k=>s.removeProperty(k)); localStorage.setItem('flappy-tap:coins','123'); ['streak-date','streak-day','streak-claimed','streak-log'].forEach(k=>localStorage.removeItem('flappy-tap:'+k)); return true; })()");
    await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: false });
    await cdp.send('Emulation.clearDeviceMetricsOverride');
    await waitFor(() => cdp.evaluate('innerWidth > 320 && innerHeight > 400'), 'restore desktop viewport');
    await cdp.evaluate("document.getElementById('btn-play').focus(); true");
    await changePageVisibility(true);
    await changePageVisibility(false);
    const menuAfterVisibility = await cdp.evaluate("({menu:!document.getElementById('screen-start').hidden,hud:document.getElementById('hud').hidden,pause:!document.getElementById('screen-pause').hidden})");
    assert.deepEqual(menuAfterVisibility, { menu: true, hud: true, pause: false }, 'hiding and returning while in the menu does not start or pause a run');

    const activeId = () => cdp.evaluate("document.activeElement && document.activeElement.id || ''");
    let current = await activeId();
    if (!current) {
      await cdp.press('Tab', 'Tab', 9);
      current = await activeId();
    }
    assert.equal(current, 'btn-play', 'startup or first Tab focuses the first visible menu action');
    await cdp.press('Tab', 'Tab', 9);
    assert.equal(await activeId(), 'btn-modes', 'Tab advances through the menu in DOM order');
    const focusStyle = await cdp.evaluate("getComputedStyle(document.activeElement).outlineStyle");
    assert.notEqual(focusStyle, 'none', 'keyboard focus has a visible outline');
    await cdp.press('Enter', 'Enter', 13);
    await waitFor(() => cdp.evaluate("document.activeElement.tagName === 'H2' && !!document.activeElement.closest('#screen-modes')"), 'mode panel heading focus');
    const visibleModesCountdown = await cdp.evaluate("(() => { const e=document.getElementById('daily-reset-countdown-modes'); return {hidden:e.hidden,text:e.textContent,role:e.getAttribute('role'),live:e.getAttribute('aria-live')}; })()");
    assert.equal(visibleModesCountdown.hidden,false,'the Modes reset countdown remains visible when its panel opens');
    assert.equal(visibleModesCountdown.role,'timer','the visible Modes countdown keeps timer semantics');
    assert.equal(visibleModesCountdown.live,'off','opening Modes does not enable per-second announcements');
    assert.match(visibleModesCountdown.text,/^⏱ Daily resets in \d+:\d{2}:\d{2}$/,'Modes retains its visible reset-time copy');
    await cdp.press('Escape', 'Escape', 27);
    await waitFor(() => cdp.evaluate("document.getElementById('screen-modes').hidden && document.activeElement.id === 'btn-modes'"), 'panel close focus restoration');

    current = await activeId();
    for (let i = 0; i < 20 && current !== 'btn-settings'; i++) {
      await cdp.press('Tab', 'Tab', 9);
      current = await activeId();
    }
    assert.equal(current, 'btn-settings', 'keyboard traversal reaches Settings');
    await cdp.press('Enter', 'Enter', 13);
    await waitFor(() => cdp.evaluate("document.activeElement.tagName === 'H2' && !!document.activeElement.closest('#screen-settings')"), 'settings panel heading focus');

    async function checkScaledSettingsViewport(width, height, insets, landscape) {
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width, height, deviceScaleFactor: 2, mobile: true,
        screenOrientation: { type: landscape ? 'landscapePrimary' : 'portraitPrimary', angle: landscape ? 90 : 0 }
      });
      await cdp.send('Emulation.setSafeAreaInsetsOverride', { insets });
      await waitFor(() => cdp.evaluate(`innerWidth === ${width} && innerHeight === ${height}`), `${width}×${height} Settings viewport`);
      await cdp.evaluate("(() => { document.documentElement.style.fontSize='200%'; const s=document.getElementById('screen-settings'); s.scrollTop=0; s.querySelector('.settings-card').scrollTop=0; return true; })()");
      await delay(350);
      const layout = await cdp.evaluate(`(() => {
        const screen=document.getElementById('screen-settings');
        const card=screen.querySelector('.settings-card');
        const rect=(e)=>{const r=e.getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,width:r.width,height:r.height};};
        const rows=[...screen.querySelectorAll('.setting-row')];
        const text=[...screen.querySelectorAll('.setting-hint,.settings-group')];
        const root=getComputedStyle(document.documentElement);
        const box=(e)=>({width:e.clientWidth,scrollWidth:e.scrollWidth});
        const overflows=(items)=>items.filter(e=>e.scrollWidth>e.clientWidth+1).map(e=>(e.textContent||'').trim().slice(0,70));
        return {rootFont:getComputedStyle(document.documentElement).fontSize,
          safe:['--safe-top','--safe-left','--safe-bottom','--safe-right'].map(k=>root.getPropertyValue(k).trim()),
          screen:rect(screen),screenOverflow:getComputedStyle(screen).overflowY,screenScrollHeight:screen.scrollHeight,screenClientHeight:screen.clientHeight,
          heading:rect(screen.querySelector('h2')),close:rect(screen.querySelector('.panel-close')),
          card:rect(card),cardOverflow:getComputedStyle(card).overflowY,cardScrollHeight:card.scrollHeight,cardClientHeight:card.clientHeight,cardSize:box(card),
          rowOverflows:overflows(rows),textOverflows:overflows(text)};
      })()`);
      assert.equal(layout.rootFont,'32px',`${width}×${height} Settings uses 200% text scale`);
      assert.deepEqual(layout.safe,[`${insets.top}px`,`${insets.left}px`,`${insets.bottom}px`,`${insets.right}px`],`${width}×${height} native safe insets reach Settings`);
      assert.equal(layout.screenOverflow,'auto',`${width}×${height} Settings screen can scroll`);
      assert.equal(layout.cardOverflow,'auto',`${width}×${height} Settings sections can scroll within their card`);
      assert.ok(layout.screenScrollHeight>=layout.screenClientHeight && layout.cardScrollHeight>layout.cardClientHeight,
        `${width}×${height} Settings content is not clipped by fixed-height containers`);
      assert.ok(layout.heading.top>=insets.top && layout.heading.left>=insets.left && layout.heading.right<=width-insets.right,
        `${width}×${height} Settings heading is inside the safe viewport: ${JSON.stringify(layout.heading)}`);
      assert.ok(layout.close.top>=insets.top && layout.close.right<=width-insets.right+1,
        `${width}×${height} Settings close control is inside the safe viewport: ${JSON.stringify(layout.close)}`);
      assert.ok(layout.card.left>=insets.left && layout.card.right<=width-insets.right && layout.cardSize.scrollWidth<=layout.cardSize.width+1,
        `${width}×${height} Settings card has no horizontal clipping: ${JSON.stringify(layout)}`);
      assert.deepEqual(layout.rowOverflows,[],`${width}×${height} setting labels and controls wrap without horizontal overflow`);
      assert.deepEqual(layout.textOverflows,[],`${width}×${height} setting hints and headings wrap without horizontal overflow`);

      await cdp.evaluate("document.getElementById('btn-import-progress').scrollIntoView({block:'center',inline:'nearest'}); true");
      const importControl=await cdp.evaluate("(() => {const e=document.getElementById('btn-import-progress');const r=e.getBoundingClientRect();const hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,visible:r.top>=0&&r.bottom<=innerHeight,hit:!!hit&&(hit===e||e.contains(hit))};})()");
      assert.ok(importControl.visible && importControl.hit && importControl.left>=insets.left && importControl.right<=width-insets.right,
        `${width}×${height} scaled Import action remains visible and tappable: ${JSON.stringify(importControl)}`);
      await cdp.evaluate("document.getElementById('btn-settings-close').scrollIntoView({block:'center',inline:'nearest'}); true");
      const done=await cdp.evaluate("(() => {const e=document.getElementById('btn-settings-close');const r=e.getBoundingClientRect();const hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,visible:r.top>=0&&r.bottom<=innerHeight,hit:!!hit&&(hit===e||e.contains(hit))};})()");
      assert.ok(done.visible && done.hit && done.left>=insets.left && done.right<=width-insets.right,
        `${width}×${height} scaled Done action is reachable and tappable: ${JSON.stringify(done)}`);
      await cdp.evaluate("(() => {document.documentElement.style.fontSize='';const s=document.getElementById('screen-settings');s.scrollTop=0;s.querySelector('.settings-card').scrollTop=0;return true;})()");
      await cdp.send('Emulation.setSafeAreaInsetsOverride',{insets:{}});
      await cdp.send('Emulation.clearDeviceMetricsOverride');
      await waitFor(()=>cdp.evaluate('innerWidth>320&&innerHeight>400'),'restore desktop after Settings audit');
      console.log(`SETTINGS SCALE/SAFE AREA OK · ${width}×${height} · 200% · ${landscape?'landscape':'portrait'}`);
    }
    await checkScaledSettingsViewport(320,568,{top:28,left:0,bottom:34,right:0},false);
    await checkScaledSettingsViewport(568,320,{top:8,left:44,bottom:21,right:44},true);

    // Walk the actual settings tab order to the export/import controls.
    current = await activeId();
    for (let i = 0; i < 100 && current !== 'btn-export-progress'; i++) {
      await cdp.press('Tab', 'Tab', 9);
      current = await activeId();
    }
    assert.equal(current, 'btn-export-progress', 'progress export is reachable using Tab');
    assert.equal(await cdp.evaluate("document.activeElement.tabIndex"), 0, 'export is a normal keyboard focus target');
    await cdp.press('Enter', 'Enter', 13);
    const downloadedPath = await waitFor(() => {
      const candidate = fs.readdirSync(downloads).find((name) => /^flappy-tap-progress-.*\.json$/.test(name));
      return candidate && !candidate.endsWith('.crdownload') ? path.join(downloads, candidate) : null;
    }, 'progress JSON download');
    const backupText = fs.readFileSync(downloadedPath, 'utf8');
    const backup = JSON.parse(backupText);
    assert.equal(backup.format, 'flappy-tap-progress', 'export UI downloads the versioned backup format');
    assert.equal(backup.version, 1);
    assert.equal(backup.data.best, '47', 'export contains the seeded best score');
    assert.equal(backup.data.coins, '123', 'export contains the seeded local coins');
    assert.match(await cdp.evaluate("document.getElementById('progress-transfer-status').textContent"), /backup downloaded/i,
      'export UI announces a successful download');

    // Change local data, then use the real Import button; only the native file chooser is adapted to an in-memory File.
    await cdp.evaluate("localStorage.setItem('flappy-tap:best','2'); localStorage.setItem('flappy-tap:coins','5'); true");
    const escapedBackupText = JSON.stringify(backupText);
    await cdp.evaluate(`(() => {
      const input = document.getElementById('progress-import-file');
      window.__importConfirmMessage = '';
      window.__importChooserRequests = 0;
      window.confirm = (message) => { window.__importConfirmMessage = message; return true; };
      input.click = function () {
        window.__importChooserRequests++;
        const transfer = new DataTransfer();
        transfer.items.add(new File([${escapedBackupText}], 'flappy-tap-progress.json', { type: 'application/json' }));
        this.files = transfer.files;
        this.dispatchEvent(new Event('change', { bubbles: true }));
      };
      return true;
    })()`);
    current = await activeId();
    for (let i = 0; i < 8 && current !== 'btn-import-progress'; i++) {
      await cdp.press('Tab', 'Tab', 9);
      current = await activeId();
    }
    assert.equal(current, 'btn-import-progress', 'progress import is reachable immediately after export in the keyboard order');
    const oldTimeOrigin = await cdp.evaluate('performance.timeOrigin');
    await cdp.press('Enter', 'Enter', 13);
    await waitFor(() => cdp.evaluate("document.getElementById('progress-transfer-status').textContent.startsWith('Imported ')"), 'import UI success state');
    const importState = await cdp.evaluate("({message:document.getElementById('progress-transfer-status').textContent,confirmation:window.__importConfirmMessage,chooserRequests:window.__importChooserRequests})");
    assert.match(importState.confirmation, /will be replaced/i, 'import presents the overwrite confirmation');
    assert.equal(importState.chooserRequests, 1, 'Import activates the browser file chooser');
    assert.match(importState.message, /reloading/i, 'successful import reports that restored data is being applied');
    await waitFor(() => cdp.evaluate(`performance.timeOrigin > ${oldTimeOrigin} && localStorage.getItem('flappy-tap:best') === '47' && localStorage.getItem('flappy-tap:coins') === '123'`), 'reload with imported save', 10000);
    await waitFor(() => cdp.evaluate("document.getElementById('boot-splash').hidden"), 'post-import boot completion');

    // Negative UI paths must leave the current local save untouched and must not reload.
    current = await activeId();
    for (let i = 0; i < 20 && current !== 'btn-settings'; i++) {
      await cdp.press('Tab', 'Tab', 9);
      current = await activeId();
    }
    assert.equal(current, 'btn-settings', 'Settings remains reachable after the import reload');
    await cdp.press('Enter', 'Enter', 13);
    await waitFor(() => cdp.evaluate("document.activeElement.tagName === 'H2' && !!document.activeElement.closest('#screen-settings')"), 'settings focus for negative imports');

    async function snapshotLocalStorage() {
      return cdp.evaluate("(() => { const entries=[]; for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);entries.push([key,localStorage.getItem(key)]);} return entries.sort((a,b)=>a[0].localeCompare(b[0])); })()");
    }
    async function verifySameBackupFileCanBeSelectedTwice() {
      await cdp.evaluate("localStorage.setItem('flappy-tap:best','209'); localStorage.setItem('flappy-tap:coins','51'); true");
      const beforeTimeOrigin = await cdp.evaluate('performance.timeOrigin');
      const beforeSnapshot = await snapshotLocalStorage();
      await cdp.evaluate(`(() => {
        const input = document.getElementById('progress-import-file');
        window.__sameBackupFile = new File([${JSON.stringify(backupText)}], 'same-progress-backup.json', { type: 'application/json' });
        window.__sameFileConfirmCalls = 0;
        window.__sameFileChooserCalls = 0;
        window.__sameFileChangeEvents = 0;
        window.__sameFileSuppressed = 0;
        window.confirm = () => { window.__sameFileConfirmCalls++; return false; };
        input.addEventListener('change', () => { window.__sameFileChangeEvents++; });
        input.click = function () {
          window.__sameFileChooserCalls++;
          if (this.files.length === 1 && this.files[0].name === window.__sameBackupFile.name) {
            window.__sameFileSuppressed++;
            return;
          }
          const transfer = new DataTransfer();
          transfer.items.add(window.__sameBackupFile);
          this.files = transfer.files;
          this.dispatchEvent(new Event('change', { bubbles: true }));
        };
        return true;
      })()`);
      async function chooseAgain() {
        await cdp.evaluate("document.getElementById('btn-import-progress').focus(); true");
        await cdp.press('Enter', 'Enter', 13);
      }
      await chooseAgain();
      await waitFor(() => cdp.evaluate("window.__sameFileConfirmCalls === 1 && document.getElementById('progress-transfer-status').textContent.includes('Import cancelled.')"), 'first selection of the backup file');
      const first = await cdp.evaluate("({value:document.getElementById('progress-import-file').value,files:document.getElementById('progress-import-file').files.length,confirmCalls:window.__sameFileConfirmCalls,changeEvents:window.__sameFileChangeEvents,chooserCalls:window.__sameFileChooserCalls,suppressed:window.__sameFileSuppressed,status:document.getElementById('progress-transfer-status').textContent})");
      assert.equal(first.value, '', 'the file input value resets after the first selection');
      assert.equal(first.files, 0, 'the first selected file is cleared so the browser can report it again');
      assert.equal(first.confirmCalls, 1, 'the first selection reaches import confirmation');
      assert.equal(first.changeEvents, 1, 'the first selection dispatches a change event');
      assert.match(first.status, /Import cancelled\. Nothing was changed\./);

      await chooseAgain();
      await waitFor(() => cdp.evaluate("window.__sameFileConfirmCalls === 2 && document.getElementById('progress-transfer-status').textContent.includes('Import cancelled.')"), 'second selection of the same backup file');
      const second = await cdp.evaluate("({value:document.getElementById('progress-import-file').value,files:document.getElementById('progress-import-file').files.length,timeOrigin:performance.timeOrigin,confirmCalls:window.__sameFileConfirmCalls,changeEvents:window.__sameFileChangeEvents,chooserCalls:window.__sameFileChooserCalls,suppressed:window.__sameFileSuppressed,status:document.getElementById('progress-transfer-status').textContent})");
      assert.equal(second.confirmCalls, 2, 'reselecting the same file reaches confirmation a second time');
      assert.equal(second.changeEvents, 2, 'the second same-file selection dispatches another change event');
      assert.equal(second.chooserCalls, 2, 'the import chooser is activated twice');
      assert.equal(second.suppressed, 0, 'the simulated chooser does not suppress the same file after input reset');
      assert.equal(second.value, '', 'the file input is cleared again after the second selection');
      assert.equal(second.files, 0);
      assert.equal(second.timeOrigin, beforeTimeOrigin, 'canceling both confirmations does not reload the page');
      assert.match(second.status, /Import cancelled\. Nothing was changed\./);
      assert.deepEqual(await snapshotLocalStorage(), beforeSnapshot, 'canceling both selections preserves all saved progress');
    }
    async function verifyFilePickerCancel() {
      await cdp.evaluate("localStorage.setItem('flappy-tap:best','209'); localStorage.setItem('flappy-tap:coins','51'); true");
      const beforeTimeOrigin = await cdp.evaluate('performance.timeOrigin');
      const beforeSnapshot = await snapshotLocalStorage();
      await cdp.evaluate(`(() => {
        const input = document.getElementById('progress-import-file');
        window.__importConfirmCalls = 0;
        window.__importChooserRequests = 0;
        window.confirm = () => { window.__importConfirmCalls++; return true; };
        input.click = function () {
          window.__importChooserRequests++;
          this.dispatchEvent(new Event('cancel'));
        };
        return true;
      })()`);
      await cdp.evaluate("document.getElementById('btn-import-progress').focus(); true");
      await cdp.press('Enter', 'Enter', 13);
      await waitFor(() => cdp.evaluate("document.getElementById('progress-transfer-status').textContent.includes('No new backup selected.')"), 'file-picker cancellation status');
      const state = await cdp.evaluate("({timeOrigin:performance.timeOrigin,confirmCalls:window.__importConfirmCalls,chooserRequests:window.__importChooserRequests,status:document.getElementById('progress-transfer-status').textContent})");
      assert.equal(state.chooserRequests, 1, 'Import opens the native file chooser');
      assert.equal(state.confirmCalls, 0, 'file-picker cancellation never reaches import confirmation');
      assert.equal(state.timeOrigin, beforeTimeOrigin, 'file-picker cancellation does not reload the page');
      assert.match(state.status, /Saved progress was not changed/i);
      assert.deepEqual(await snapshotLocalStorage(), beforeSnapshot, 'file-picker cancellation preserves every saved localStorage entry');
    }
    async function verifyRejectedImport(label, fileText, confirmDecision, expectedStatus, expectedConfirmCalls, fileSizeBytes) {
      await cdp.evaluate("localStorage.setItem('flappy-tap:best','209'); localStorage.setItem('flappy-tap:coins','51'); true");
      const before = await cdp.evaluate("({timeOrigin:performance.timeOrigin,best:localStorage.getItem('flappy-tap:best'),coins:localStorage.getItem('flappy-tap:coins')})");
      const beforeSnapshot = await snapshotLocalStorage();
      const fileParts = fileSizeBytes ? `new Uint8Array(${fileSizeBytes})` : JSON.stringify(fileText);
      await cdp.evaluate(`(() => {
        const input = document.getElementById('progress-import-file');
        window.__importConfirmMessage = '';
        window.__importConfirmCalls = 0;
        window.__importChooserRequests = 0;
        window.__importConfirmDecision = ${JSON.stringify(confirmDecision)};
        window.confirm = (message) => {
          window.__importConfirmCalls++;
          window.__importConfirmMessage = message;
          return window.__importConfirmDecision;
        };
        input.click = function () {
          window.__importChooserRequests++;
          const transfer = new DataTransfer();
          transfer.items.add(new File([${fileParts}], 'test-progress-backup.json', { type: 'application/json' }));
          this.files = transfer.files;
          this.dispatchEvent(new Event('change', { bubbles: true }));
        };
        return true;
      })()`);
      await cdp.evaluate("document.getElementById('btn-import-progress').focus(); true");
      await cdp.press('Enter', 'Enter', 13);
      await waitFor(() => cdp.evaluate(`document.getElementById('progress-transfer-status').textContent.includes(${JSON.stringify(expectedStatus)})`), label);
      const after = await cdp.evaluate("({timeOrigin:performance.timeOrigin,best:localStorage.getItem('flappy-tap:best'),coins:localStorage.getItem('flappy-tap:coins'),confirmCalls:window.__importConfirmCalls,chooserRequests:window.__importChooserRequests})");
      assert.equal(after.confirmCalls, expectedConfirmCalls, label + ' confirmation count');
      assert.equal(after.chooserRequests, 1, label + ' opened the import picker');
      assert.equal(after.best, before.best, label + ' preserves the saved best score');
      assert.equal(after.coins, before.coins, label + ' preserves the saved coins');
      assert.equal(after.timeOrigin, before.timeOrigin, label + ' does not reload the page');
      assert.deepEqual(await snapshotLocalStorage(), beforeSnapshot, label + ' preserves every saved localStorage entry');
    }

    await verifySameBackupFileCanBeSelectedTwice();
    await verifyFilePickerCancel();
    await verifyRejectedImport('cancelled backup import', backupText, false, 'Import cancelled. Nothing was changed.', 1);
    await verifyRejectedImport('malformed JSON backup', '{"format":"flappy-tap-progress",', true, 'Could not read that backup file.', 0);
    const malformedSchema = JSON.stringify({ format: backup.format, version: backup.version, exportedAt: backup.exportedAt, data: { best: 'not-a-number' } });
    await verifyRejectedImport('malformed backup data', malformedSchema, true, 'Invalid, unsupported, or damaged backup.', 1);
    const unsupportedVersion = Object.assign({}, backup, { version: backup.version + 1 });
    await verifyRejectedImport('unsupported backup version', JSON.stringify(unsupportedVersion), true, 'Unsupported or invalid progress backup.', 0);
    await verifyRejectedImport('oversized backup file', '', true, 'That file is too large to be a valid progress backup.', 0, 256 * 1024 + 1);

    // Fail once after earlier keys have been written, then allow the transaction's rollback writes to succeed.
    await cdp.evaluate(`(() => {
      const input = document.getElementById('progress-import-file');
      window.__importConfirmCalls = 0;
      window.__importChooserRequests = 0;
      window.__storageFailureTriggered = false;
      window.__importWriteAttempts = [];
      window.confirm = () => { window.__importConfirmCalls++; return true; };
      window.__nativeStorageSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key, value) {
        window.__importWriteAttempts.push(key);
        if (key === 'flappy-tap:coins' && !window.__storageFailureTriggered) {
          window.__storageFailureTriggered = true;
          throw new DOMException('simulated localStorage quota failure', 'QuotaExceededError');
        }
        return window.__nativeStorageSetItem.call(this, key, value);
      };
      input.click = function () {
        window.__importChooserRequests++;
        const transfer = new DataTransfer();
        transfer.items.add(new File([${JSON.stringify(backupText)}], 'test-progress-backup.json', { type: 'application/json' }));
        this.files = transfer.files;
        this.dispatchEvent(new Event('change', { bubbles: true }));
      };
      return true;
    })()`);
    const beforeFailedImport = await snapshotLocalStorage();
    const failedImportTimeOrigin = await cdp.evaluate('performance.timeOrigin');
    await cdp.evaluate("document.getElementById('btn-import-progress').focus(); true");
    await cdp.press('Enter', 'Enter', 13);
    await waitFor(() => cdp.evaluate("document.getElementById('progress-transfer-status').textContent.includes('Browser storage could not save the backup.')"), 'simulated storage-write failure status');
    const failedImport = await cdp.evaluate("({timeOrigin:performance.timeOrigin,confirmCalls:window.__importConfirmCalls,chooserRequests:window.__importChooserRequests,failureTriggered:window.__storageFailureTriggered,attempts:window.__importWriteAttempts})");
    assert.equal(failedImport.confirmCalls, 1, 'storage-write failure import was confirmed');
    assert.equal(failedImport.chooserRequests, 1, 'storage-write failure import used the UI file picker');
    assert.equal(failedImport.failureTriggered, true, 'the simulated quota error occurred');
    assert.ok(failedImport.attempts.indexOf('flappy-tap:best') >= 0 && failedImport.attempts.indexOf('flappy-tap:coins') > failedImport.attempts.indexOf('flappy-tap:best'),
      'at least one earlier field was written before the simulated failure');
    assert.equal(failedImport.timeOrigin, failedImportTimeOrigin, 'failed storage import does not reload the page');
    assert.deepEqual(await snapshotLocalStorage(), beforeFailedImport, 'rollback restores every existing localStorage entry');
    assert.match(await cdp.evaluate("document.getElementById('progress-transfer-status').textContent"), /Existing progress was restored/i);
    await cdp.evaluate("Storage.prototype.setItem = window.__nativeStorageSetItem; true");

    // A valid file exactly at the documented 256 KiB ceiling must still pass the UI size gate.
    const maxBackupBytes = 256 * 1024;
    const paddingBytes = maxBackupBytes - Buffer.byteLength(backupText);
    assert.ok(paddingBytes > 0, 'the exported fixture leaves room for the size-boundary padding');
    await cdp.evaluate("localStorage.setItem('flappy-tap:best','209'); localStorage.setItem('flappy-tap:coins','51'); true");
    const beforeBoundaryImport = await cdp.evaluate('performance.timeOrigin');
    await cdp.evaluate(`(() => {
      const input = document.getElementById('progress-import-file');
      window.__importConfirmCalls = 0;
      window.__selectedBackupSize = 0;
      window.confirm = () => { window.__importConfirmCalls++; return true; };
      input.click = function () {
        const transfer = new DataTransfer();
        const file = new File([${JSON.stringify(backupText)}, ' '.repeat(${paddingBytes})], 'limit-progress-backup.json', { type: 'application/json' });
        window.__selectedBackupSize = file.size;
        transfer.items.add(file);
        this.files = transfer.files;
        this.dispatchEvent(new Event('change', { bubbles: true }));
      };
      return true;
    })()`);
    await cdp.evaluate("document.getElementById('btn-import-progress').focus(); true");
    await cdp.press('Enter', 'Enter', 13);
    await waitFor(() => cdp.evaluate("document.getElementById('progress-transfer-status').textContent.startsWith('Imported ')"), 'maximum-size import UI success state');
    const boundaryResult = await cdp.evaluate("({size:window.__selectedBackupSize,confirmCalls:window.__importConfirmCalls,status:document.getElementById('progress-transfer-status').textContent})");
    assert.equal(boundaryResult.size, maxBackupBytes, 'fixture is exactly 256 KiB');
    assert.equal(boundaryResult.confirmCalls, 1, 'the boundary-sized backup reaches confirmation instead of being rejected');
    assert.match(boundaryResult.status, /Reloading/i, 'the valid boundary-sized file is imported');
    await waitFor(() => cdp.evaluate(`performance.timeOrigin > ${beforeBoundaryImport} && localStorage.getItem('flappy-tap:best') === '47' && localStorage.getItem('flappy-tap:coins') === '123'`), 'accepted maximum-size backup reload', 10000);
    await waitFor(() => cdp.evaluate("document.getElementById('boot-splash').hidden"), 'boot after maximum-size import');

    // The real live region is checked after keyboard-triggered gameplay events, with no frame-by-frame score narration.
    await cdp.evaluate("localStorage.setItem('flappy-tap:best','0'); localStorage.setItem('flappy-tap:coins','123'); true");
    await cdp.evaluate("document.getElementById('btn-play').focus(); true");
    await cdp.press('Enter', 'Enter', 13);
    const gameEntry = await cdp.evaluate("({active:document.activeElement.id,canvasTabIndex:document.getElementById('game').tabIndex,startHidden:document.getElementById('screen-start').hidden,hudHidden:document.getElementById('hud').hidden,playDisabled:document.getElementById('btn-play').disabled,bootHidden:document.getElementById('boot-splash').hidden,settingsHidden:document.getElementById('screen-settings').hidden})");
    assert.ok(gameEntry.startHidden && !gameEntry.hudHidden, 'keyboard activation enters gameplay: ' + JSON.stringify(gameEntry));
    assert.equal(gameEntry.active, 'game', 'starting a run focuses the keyboard flap surface');
    assert.equal(gameEntry.canvasTabIndex, 0, 'the game surface joins the tab order only while a run is active');
    assert.deepEqual(await cdp.evaluate("(() => {const s=getComputedStyle(document.getElementById('game'));return {style:s.outlineStyle,width:s.outlineWidth};})()"),{style:'solid',width:'3px'},'the focused game surface has a visible keyboard outline');
    const liveSemantics = await cdp.evaluate("({role:document.getElementById('game-announcer').getAttribute('role'),live:document.getElementById('game-announcer').getAttribute('aria-live'),atomic:document.getElementById('game-announcer').getAttribute('aria-atomic')})");
    assert.deepEqual(liveSemantics, { role: 'status', live: 'polite', atomic: 'true' }, 'the event announcement region has polite atomic status semantics');
    const startAnnouncement = await waitFor(() => cdp.evaluate("document.getElementById('game-announcer').textContent.includes('run started') && document.getElementById('game-announcer').textContent"), 'run-start announcement');
    assert.match(startAnnouncement, /Classic run started/i);
    await cdp.evaluate(`(() => {
      const storage = window.FTStorage;
      const getBest = storage.getBest;
      const setBest = storage.setBest;
      storage.getBest = () => -1;
      storage.setBest = function (value) {
        storage.getBest = getBest;
        storage.setBest = setBest;
        return setBest.call(storage, value);
      };
      return true;
    })()`);
    const stableAnnouncement = await cdp.evaluate("document.getElementById('game-announcer').textContent");
    await delay(250);
    assert.equal(await cdp.evaluate("document.getElementById('game-announcer').textContent"), stableAnnouncement,
      'the polite live region remains quiet between meaningful events');
    const muteBefore=await cdp.evaluate("(() => {const b=document.getElementById('btn-mute');return {label:b.getAttribute('aria-label'),pressed:b.getAttribute('aria-pressed'),muted:window.FTStorage.isMuted(),title:b.title};})()");
    await cdp.evaluate("document.getElementById('btn-mute').focus(); true");
    await cdp.press('Enter','Enter',13);
    const muteToggled=await cdp.evaluate("(() => {const b=document.getElementById('btn-mute');return {label:b.getAttribute('aria-label'),pressed:b.getAttribute('aria-pressed'),muted:window.FTStorage.isMuted(),title:b.title};})()");
    await cdp.press('Enter','Enter',13);
    const muteRestored=await cdp.evaluate("(() => {const b=document.getElementById('btn-mute');return {label:b.getAttribute('aria-label'),pressed:b.getAttribute('aria-pressed'),muted:window.FTStorage.isMuted(),title:b.title};})()");
    assert.equal(muteBefore.label,'Mute sound','mute toggle has a stable accessible name in its initial state');
    assert.equal(muteToggled.label,muteBefore.label,'accessible name does not switch from Mute to Unmute when pressed');
    assert.notEqual(muteToggled.pressed,muteBefore.pressed,'keyboard activation changes the explicit pressed state');
    assert.equal(muteBefore.pressed,muteBefore.muted?'true':'false','initial pressed state matches the saved sound setting');
    assert.equal(muteToggled.pressed,muteToggled.muted?'true':'false','toggled pressed state matches the saved sound setting');
    assert.equal(muteToggled.title,muteToggled.muted?'Unmute':'Mute','sighted tooltip describes the next available action');
    assert.deepEqual(muteRestored,muteBefore,'a second keyboard activation restores both sound and its accessible state');
    const pauseControl = await cdp.evaluate("(() => { const button=document.getElementById('btn-pause'); return {visible:!!button && button.getClientRects().length > 0, label:button && button.getAttribute('aria-label')}; })()");
    assert.deepEqual(pauseControl, { visible: true, label: 'Pause' }, 'the on-screen pause button is visible and named for assistive technology');
    await cdp.evaluate("document.getElementById('btn-pause').focus(); true");
    await cdp.press('Enter', 'Enter', 13);
    const pauseAnnouncement = await waitFor(() => cdp.evaluate("document.getElementById('game-announcer').textContent.includes('Game paused') && document.getElementById('game-announcer').textContent"), 'pause announcement');
    assert.match(pauseAnnouncement, /Score \d+/);
    const pauseLiveDetails = await cdp.evaluate("(() => {const s=document.querySelector('.pause-stats');return {statsLive:s.getAttribute('aria-live'),score:document.getElementById('pause-score').textContent,mode:document.getElementById('pause-mode').textContent,focus:document.activeElement.id};})()");
    assert.equal(pauseLiveDetails.statsLive,'off','pause stats remain readable on demand without duplicating the concise pause announcement');
    assert.ok(pauseAnnouncement.includes('Score ' + pauseLiveDetails.score + '.'),'the dedicated pause announcement still includes the current score');
    assert.equal(pauseLiveDetails.focus,'btn-resume','suppressing the duplicate stats announcement does not change pause focus');
    assert.ok(pauseLiveDetails.score.length > 0 && pauseLiveDetails.mode.length > 0,'score and mode remain available to read in the Pause panel');
    const pausePanelVisible = await cdp.evaluate("!document.getElementById('screen-pause').hidden && document.activeElement.id === 'btn-resume'");
    assert.equal(pausePanelVisible, true, 'keyboard activation of the visible pause control opens the pause panel and focuses Resume');
    async function enableScaledLandscape(width,height,insets) {
      await cdp.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:2,mobile:true,screenOrientation:{type:'landscapePrimary',angle:90}});
      await cdp.send('Emulation.setSafeAreaInsetsOverride',{insets});
      await waitFor(()=>cdp.evaluate(`innerWidth===${width}&&innerHeight===${height}`),`${width}×${height} scaled landscape viewport`);
      await cdp.evaluate("document.documentElement.style.fontSize='200%'; true");
      await delay(350);
    }
    async function resetScaledLandscape() {
      await cdp.evaluate("document.documentElement.style.fontSize=''; true");
      await cdp.send('Emulation.setSafeAreaInsetsOverride',{insets:{}});
      await cdp.send('Emulation.clearDeviceMetricsOverride');
      await waitFor(()=>cdp.evaluate('innerWidth>320&&innerHeight>400'),'restore desktop after landscape audit');
    }
    async function checkPauseLandscape(width,height,insets) {
      await enableScaledLandscape(width,height,insets);
      const panel=await cdp.evaluate("(() => {const s=document.getElementById('screen-pause');s.scrollTop=0;const r=e=>{const b=e.getBoundingClientRect();return {top:b.top,bottom:b.bottom,left:b.left,right:b.right,width:b.width,height:b.height};};const safe=getComputedStyle(document.documentElement);const close=s.querySelector('.panel-close'),c=close.getBoundingClientRect(),hit=document.elementFromPoint(c.left+c.width/2,c.top+c.height/2);const selectors=['.pause-stats','.pause-stat','.pause-tip'];const overflow=[];selectors.forEach(q=>s.querySelectorAll(q).forEach(e=>{if(e.scrollWidth>e.clientWidth+1)overflow.push({selector:q,text:(e.textContent||'').trim(),width:e.clientWidth,scrollWidth:e.scrollWidth});}));return {font:getComputedStyle(document.documentElement).fontSize,safe:['--safe-top','--safe-left','--safe-bottom','--safe-right'].map(k=>safe.getPropertyValue(k).trim()),overflowY:getComputedStyle(s).overflowY,scrollWidth:s.scrollWidth,clientWidth:s.clientWidth,scrollHeight:s.scrollHeight,clientHeight:s.clientHeight,overflow,heading:r(s.querySelector('h2')),stats:r(s.querySelector('.pause-stats')),tip:r(s.querySelector('.pause-tip')),close:r(close),closeHit:!!hit&&(hit===close||close.contains(hit))};})()");
      assert.equal(panel.font,'32px',`${width}×${height} Pause uses 200% text scale`);
      assert.deepEqual(panel.safe,[`${insets.top}px`,`${insets.left}px`,`${insets.bottom}px`,`${insets.right}px`],`${width}×${height} native safe insets reach Pause`);
      assert.equal(panel.overflowY,'auto',`${width}×${height} Pause can scroll when scaled content is taller than the viewport`);
      assert.ok(panel.scrollWidth<=panel.clientWidth+1,`${width}×${height} Pause has no horizontal panel overflow`);
      assert.ok(panel.heading.top>=insets.top&&panel.heading.left>=insets.left&&panel.heading.right<=width-insets.right,
        `${width}×${height} Pause heading remains reachable from the safe top: ${JSON.stringify(panel.heading)}`);
      assert.ok(panel.close.top>=insets.top&&panel.close.right<=width-insets.right&&panel.closeHit,
        `${width}×${height} Pause close control remains safe and hit-testable: ${JSON.stringify(panel.close)}`);
      assert.ok(panel.stats.bottom<=panel.tip.top,`${width}×${height} Pause stats and tip do not overlap`);
      assert.deepEqual(panel.overflow,[],`${width}×${height} Pause stats/tip text wraps without horizontal clipping`);
      for(const selector of ['#btn-resume','#btn-quit-pause']) {
        await cdp.evaluate(`document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'center',inline:'nearest'}); true`);
        const control=await cdp.evaluate(`(() => {const e=document.querySelector(${JSON.stringify(selector)}),r=e.getBoundingClientRect(),h=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,width:r.width,height:r.height,visible:r.top>=0&&r.bottom<=innerHeight,hit:!!h&&(h===e||e.contains(h))};})()`);
        assert.ok(control.visible&&control.hit&&control.height>=44&&control.left>=insets.left&&control.right<=width-insets.right&&control.bottom<=height-insets.bottom,
          `${width}×${height} ${selector} stays reachable and tappable above the safe area: ${JSON.stringify(control)}`);
      }
      await resetScaledLandscape();
      console.log(`PAUSE SCALE/SAFE AREA OK · ${width}×${height} · 200% landscape`);
    }
    await checkPauseLandscape(568,320,{top:8,left:44,bottom:21,right:44});
    await checkPauseLandscape(844,390,{top:8,left:44,bottom:21,right:44});
    const manualPauseAnnouncement = await cdp.evaluate("document.getElementById('game-announcer').textContent");
    await changePageVisibility(true);
    await changePageVisibility(false);
    assert.equal(await cdp.evaluate("!document.getElementById('screen-pause').hidden"), true, 'an already-paused game remains paused across hide/show');
    assert.equal(await cdp.evaluate("document.getElementById('game-announcer').textContent"), manualPauseAnnouncement, 'backgrounding an already-paused game does not announce a second pause');
    await cdp.press('Escape', 'Escape', 27);
    const resumeAnnouncement = await waitFor(() => cdp.evaluate("document.getElementById('game-announcer').textContent === 'Game resumed.' && document.getElementById('game-announcer').textContent"), 'resume announcement');
    assert.equal(resumeAnnouncement, 'Game resumed.');
    await cdp.press('Escape', 'Escape', 27);
    const escapePause = await waitFor(() => cdp.evaluate("document.getElementById('game-announcer').textContent.includes('Game paused') && document.getElementById('game-announcer').textContent"), 'Escape pause announcement');
    assert.match(escapePause, /Score \d+/);
    await cdp.press('Escape', 'Escape', 27);
    assert.equal(await waitFor(() => cdp.evaluate("document.getElementById('game-announcer').textContent === 'Game resumed.' && document.getElementById('game-announcer').textContent"), 'Escape resume announcement'), 'Game resumed.');

    await changePageVisibility(true);
    const backgroundPause = await waitFor(() => cdp.evaluate("!document.getElementById('screen-pause').hidden && document.getElementById('game-announcer').textContent.includes('Game paused') && document.getElementById('game-announcer').textContent"), 'active-run background auto-pause');
    assert.match(backgroundPause, /Score \d+/);
    await changePageVisibility(false);
    assert.equal(await cdp.evaluate("!document.getElementById('screen-pause').hidden"), true, 'returning from a hidden page leaves the active run paused');
    assert.equal(await cdp.evaluate("document.getElementById('game-announcer').textContent"), backgroundPause, 'returning does not announce or trigger an automatic resume');
    await changePageVisibility(true);
    await changePageVisibility(false);
    assert.equal(await cdp.evaluate("!document.getElementById('screen-pause').hidden"), true, 'repeated visibility events do not unpause or duplicate the pause');
    assert.equal(await cdp.evaluate("document.getElementById('game-announcer').textContent"), backgroundPause, 'the repeated hide/show cycle does not repeat the pause announcement');

    await cdp.press('Enter', 'Enter', 13);
    await waitFor(() => cdp.evaluate("!document.getElementById('resume-countdown').hidden && document.getElementById('screen-pause').hidden"), 'resume countdown begins');
    const resumeTimerSemantics = await cdp.evaluate("(() => {const e=document.getElementById('resume-countdown');return {role:e.getAttribute('role'),live:e.getAttribute('aria-live'),value:document.getElementById('resume-countdown-num').textContent};})()");
    assert.deepEqual(resumeTimerSemantics,{role:'timer',live:'off',value:'3'},'the resume digits are available as a timer without a live announcement on each tick');
    const resumeStartAnnouncement = await waitFor(() => cdp.evaluate("document.getElementById('game-announcer').textContent === 'Game resumes in 3 seconds.' && document.getElementById('game-announcer').textContent"), 'single resume countdown announcement');
    assert.equal(resumeStartAnnouncement,'Game resumes in 3 seconds.');
    assert.equal(await waitFor(() => cdp.evaluate("document.getElementById('resume-countdown-num').textContent === '2' && document.getElementById('resume-countdown-num').textContent"), 'visible resume countdown tick'),'2','visual digits still advance while live announcements stay quiet');
    assert.equal(await cdp.evaluate("document.getElementById('game-announcer').textContent"),resumeStartAnnouncement,'countdown tick changes do not replace the concise start announcement');
    await changePageVisibility(true);
    await changePageVisibility(false);
    await waitFor(() => cdp.evaluate("document.getElementById('game-announcer').textContent === 'Resume cancelled. The game remains paused.'"), 'resume cancellation announcement after tab return');
    const cancelledCountdownState = await cdp.evaluate("({pause:!document.getElementById('screen-pause').hidden,countdown:!document.getElementById('resume-countdown').hidden,focus:document.activeElement.id,announcement:document.getElementById('game-announcer').textContent})");
    assert.deepEqual(cancelledCountdownState, { pause: true, countdown: false, focus: 'btn-resume', announcement: 'Resume cancelled. The game remains paused.' }, 'hiding during resume countdown cancels it, explains the paused state, and restores the explicit Resume control');
    await cdp.press('Enter', 'Enter', 13);
    assert.equal(await waitFor(() => cdp.evaluate("!document.getElementById('resume-countdown').hidden && document.getElementById('game-announcer').textContent === 'Game resumes in 3 seconds.'"), 'resume countdown restart after returning'), true);
    await cdp.press('Escape', 'Escape', 27);
    const escapeCountdownCancel = await waitFor(() => cdp.evaluate("document.getElementById('game-announcer').textContent === 'Resume cancelled. The game remains paused.' && document.getElementById('game-announcer').textContent"), 'Escape cancels resume countdown');
    assert.equal(escapeCountdownCancel,'Resume cancelled. The game remains paused.');
    assert.equal(await cdp.evaluate("!document.getElementById('screen-pause').hidden && document.getElementById('resume-countdown').hidden && document.activeElement.id === 'btn-resume'"),true,'Escape restores the paused panel and Resume focus');
    await cdp.press('Enter', 'Enter', 13);
    assert.equal(await waitFor(() => cdp.evaluate("document.getElementById('game-announcer').textContent === 'Game resumed.' && document.getElementById('game-announcer').textContent"), 'explicit resume after returning'), 'Game resumed.');

    const firstRunResult = await waitFor(() => cdp.evaluate("!document.getElementById('screen-death').hidden && document.getElementById('run-result-announcement').textContent"), 'new-record run-end announcement', 15000);
    assert.equal(firstRunResult, 'Run complete. Score 0. New personal record.', 'run end announces the final score and new record once in concise text');
    const gameOverAnnouncement = await cdp.evaluate("document.getElementById('run-result-announcement').textContent");
    await changePageVisibility(true);
    await changePageVisibility(false);
    const gameOverAfterVisibility = await cdp.evaluate("({death:!document.getElementById('screen-death').hidden,pause:!document.getElementById('screen-pause').hidden,result:document.getElementById('run-result-announcement').textContent})");
    assert.deepEqual(gameOverAfterVisibility, { death: true, pause: false, result: gameOverAnnouncement }, 'hiding and returning on the game-over screen preserves its result without opening Pause');
    const stableRunResult = await cdp.evaluate("document.getElementById('run-result-announcement').textContent");
    await delay(250);
    assert.equal(await cdp.evaluate("document.getElementById('run-result-announcement').textContent"), stableRunResult,
      'the run-end live region does not repeat its announcement after the result is shown');
    const resultRegion = await cdp.evaluate("(() => { const el=document.getElementById('run-result-announcement'); return {role:el.getAttribute('role'),live:el.getAttribute('aria-live'),atomic:el.getAttribute('aria-atomic')}; })()");
    assert.deepEqual(resultRegion, { role: 'status', live: 'polite', atomic: 'true' }, 'the final result uses one polite atomic screen-reader status region');

    async function checkRunEndPortraitRetry(width,height) {
      const insets={top:24,left:0,bottom:20,right:0};
      await cdp.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:2,mobile:true,screenOrientation:{type:'portraitPrimary',angle:0}});
      await cdp.send('Emulation.setSafeAreaInsetsOverride',{insets});
      await waitFor(()=>cdp.evaluate(`innerWidth===${width}&&innerHeight===${height}`),`${width}×${height} run-summary portrait viewport`);
      await delay(200);
      const retry=await cdp.evaluate("(() => {const s=document.getElementById('screen-death');s.scrollTop=0;const e=document.getElementById('btn-retry'),r=e.getBoundingClientRect(),h=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return {top:r.top,bottom:r.bottom,height:r.height,visible:r.top>=24&&r.bottom<=innerHeight-20,hit:!!h&&(h===e||e.contains(h)),scrollTop:s.scrollTop,scrollHeight:s.scrollHeight,clientHeight:s.clientHeight};})()");
      assert.ok(retry.visible&&retry.hit&&retry.height>=44,`${width}×${height} RETRY is visible and hit-testable without scrolling: ${JSON.stringify(retry)}`);
      await cdp.send('Emulation.setSafeAreaInsetsOverride',{insets:{}});
      await cdp.send('Emulation.clearDeviceMetricsOverride');
      await waitFor(()=>cdp.evaluate('innerWidth>320&&innerHeight>400'),'restore desktop after portrait Retry audit');
      console.log(`RUN END QUICK RETRY OK · ${width}×${height} portrait`);
    }
    await checkRunEndPortraitRetry(320,480);
    await checkRunEndPortraitRetry(320,568);

    async function checkRunEndLandscape(width,height,insets) {
      await enableScaledLandscape(width,height,insets);
      const layout=await cdp.evaluate("(() => {const s=document.getElementById('screen-death');s.scrollTop=0;const r=e=>{const b=e.getBoundingClientRect();return {top:b.top,bottom:b.bottom,left:b.left,right:b.right,width:b.width,height:b.height};};const safe=getComputedStyle(document.documentElement),close=s.querySelector('.panel-close'),c=close.getBoundingClientRect(),hit=document.elementFromPoint(c.left+c.width/2,c.top+c.height/2);const overflow=[];['.run-summary','.sum-row','.score-big','.new-record-banner','.grade-wrap','.btn-row'].forEach(q=>s.querySelectorAll(q).forEach(e=>{if(e.getClientRects().length&&e.scrollWidth>e.clientWidth+1)overflow.push({selector:q,text:(e.textContent||'').trim().slice(0,60),width:e.clientWidth,scrollWidth:e.scrollWidth});}));return {font:getComputedStyle(document.documentElement).fontSize,safe:['--safe-top','--safe-left','--safe-bottom','--safe-right'].map(k=>safe.getPropertyValue(k).trim()),overflowY:getComputedStyle(s).overflowY,scrollWidth:s.scrollWidth,clientWidth:s.clientWidth,scrollHeight:s.scrollHeight,clientHeight:s.clientHeight,overflow,heading:r(s.querySelector('h2')),summary:r(s.querySelector('#run-summary')),close:r(close),closeHit:!!hit&&(hit===close||close.contains(hit))};})()");
      assert.equal(layout.font,'32px',`${width}×${height} run summary uses 200% text scale`);
      assert.deepEqual(layout.safe,[`${insets.top}px`,`${insets.left}px`,`${insets.bottom}px`,`${insets.right}px`],`${width}×${height} native safe insets reach run summary`);
      assert.equal(layout.overflowY,'auto',`${width}×${height} run summary is vertically scrollable`);
      assert.ok(layout.scrollWidth<=layout.clientWidth+1,`${width}×${height} run summary has no horizontal panel overflow`);
      assert.ok(layout.heading.top>=insets.top&&layout.heading.left>=insets.left&&layout.heading.right<=width-insets.right,
        `${width}×${height} run heading remains reachable inside the safe area: ${JSON.stringify(layout.heading)}`);
      assert.ok(layout.close.top>=insets.top&&layout.close.right<=width-insets.right&&layout.closeHit,
        `${width}×${height} run-summary close control remains safe and hit-testable: ${JSON.stringify(layout.close)}`);
      assert.ok(layout.summary.left>=insets.left&&layout.summary.right<=width-insets.right,
        `${width}×${height} run-summary metrics remain within the horizontal safe area: ${JSON.stringify(layout.summary)}`);
      assert.deepEqual(layout.overflow,[],`${width}×${height} score and summary labels fit without horizontal clipping: ${JSON.stringify(layout.overflow)}`);
      for(const selector of ['#btn-retry','#btn-share','#btn-death-collection','#btn-menu']) {
        await cdp.evaluate(`document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'center',inline:'nearest'}); true`);
        const control=await cdp.evaluate(`(() => {const e=document.querySelector(${JSON.stringify(selector)}),r=e.getBoundingClientRect(),h=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,width:r.width,height:r.height,visible:r.top>=0&&r.bottom<=innerHeight,hit:!!h&&(h===e||e.contains(h))};})()`);
        assert.ok(control.visible&&control.hit&&control.height>=44&&control.left>=insets.left&&control.right<=width-insets.right&&control.bottom<=height-insets.bottom,
          `${width}×${height} ${selector} remains reachable and tappable above the safe area: ${JSON.stringify(control)}`);
      }
      await cdp.evaluate("document.getElementById('screen-death').scrollTop=0; true");
      await resetScaledLandscape();
      console.log(`RUN END SCALE/SAFE AREA OK · ${width}×${height} · 200% landscape`);
    }
    await checkRunEndLandscape(568,320,{top:8,left:44,bottom:21,right:44});
    await checkRunEndLandscape(844,390,{top:8,left:44,bottom:21,right:44});

    await cdp.evaluate("document.getElementById('btn-retry').focus(); true");
    await cdp.press('Enter', 'Enter', 13);
    await waitFor(() => cdp.evaluate("document.getElementById('screen-death').hidden && !document.getElementById('hud').hidden"), 'start the no-new-record run');
    const secondRunResult = await waitFor(() => cdp.evaluate("!document.getElementById('screen-death').hidden && document.getElementById('run-result-announcement').textContent"), 'no-new-record run-end announcement', 15000);
    assert.equal(secondRunResult, 'Run complete. Score 0. No new record.', 'run end explicitly announces when the score is not a new record');

    await cdp.evaluate("(() => {localStorage.clear();localStorage.setItem('flappy-tap:best','0');localStorage.setItem('flappy-tap:coins','0');localStorage.setItem('flappy-tap:runs','0');localStorage.setItem('flappy-tap:coach-done','0');localStorage.setItem('flappy-tap:coach-step','0');localStorage.setItem('flappy-tap:mute','1');localStorage.setItem('flappy-tap:resume-countdown','0');return true;})()");
    await cdp.send('Page.reload',{ignoreCache:true});
    await waitFor(()=>cdp.evaluate("document.readyState==='complete'&&!!window.FTStorage&&document.getElementById('boot-splash').hidden&&!document.getElementById('screen-start').hidden"),'fresh first-run menu for coach-flow regression');
    assert.equal(await cdp.evaluate("document.getElementById('game').tabIndex"),-1,'the canvas is not an extra Tab stop in the menu');
    await cdp.evaluate("document.getElementById('btn-play').focus(); true");
    await cdp.press('Enter','Enter',13);
    const firstCoach=await waitFor(()=>cdp.evaluate("(() => {const d=document.getElementById('coach-marks');return !d.hidden;})()"),'eligible first-run coach appears');
    const coachStart=await cdp.evaluate("(() => {const d=document.getElementById('coach-marks'),t=document.getElementById('coach-text'),g=document.getElementById('game');return {visible:!d.hidden,role:d.getAttribute('role'),description:d.getAttribute('aria-describedby'),textRole:t.getAttribute('role'),textLive:t.getAttribute('aria-live'),text:t.textContent,focus:document.activeElement.id,canvasTabIndex:g.tabIndex};})()");
    assert.equal(firstCoach,true,'first-run coaching begins on an eligible run');
    assert.deepEqual(coachStart,{visible:true,role:'dialog',description:'coach-text',textRole:'status',textLive:'polite',text:'👆 Tap or press Space to flap — keep flapping!',focus:'game',canvasTabIndex:0},'coach instructions are announced while Space remains ready to flap');
    await cdp.press(' ','Space',32);
    const nextCoach=await waitFor(()=>cdp.evaluate("document.getElementById('coach-text').textContent.includes('Fly through')&&document.getElementById('coach-text').textContent"),'Space flaps and advances the initial coach step');
    assert.equal(nextCoach,'🕊 Fly through the gaps between pipes','Space on the game surface performs the advertised flap');
    assert.equal(await cdp.evaluate("document.activeElement.id"),'game','focus stays on the game surface after a flap');
    await cdp.evaluate("document.getElementById('btn-coach-next').focus(); true");
    await cdp.press(' ','Space',32);
    const coinsCoach=await waitFor(()=>cdp.evaluate("document.getElementById('coach-text').textContent.includes('Grab coins')&&document.getElementById('coach-text').textContent"),'Space activates the focused coach Next button');
    assert.equal(coinsCoach,'🪙 Grab coins & power-ups in the gaps','focused coach buttons retain native Space activation');
    assert.equal(await cdp.evaluate("document.activeElement.id"),'game','coach progression returns keyboard focus to gameplay');
    await cdp.evaluate("document.getElementById('btn-coach-skip').focus(); true");
    await cdp.press(' ','Space',32);
    await waitFor(()=>cdp.evaluate("document.getElementById('coach-marks').hidden&&document.activeElement.id==='game'"),'Space dismisses coach and returns focus to the flap surface');
    assert.equal(await cdp.evaluate("localStorage.getItem('flappy-tap:coach-done')"),'1','coach skip persists completion');
    await cdp.press(' ','Space',32);
    assert.deepEqual(await cdp.evaluate("({pauseHidden:document.getElementById('screen-pause').hidden,focus:document.activeElement.id,hudHidden:document.getElementById('hud').hidden})"),{pauseHidden:true,focus:'game',hudHidden:false},'Space on the game surface flaps instead of activating Pause');
    await cdp.evaluate("document.getElementById('btn-pause').focus(); true");
    await cdp.press(' ','Space',32);
    await waitFor(()=>cdp.evaluate("!document.getElementById('screen-pause').hidden&&document.activeElement.id==='btn-resume'"),'Space activates the focused Pause button');
    await cdp.press(' ','Space',32);
    await waitFor(()=>cdp.evaluate("document.getElementById('screen-pause').hidden&&!document.getElementById('hud').hidden&&document.activeElement.id==='game'"),'Space resumes and returns focus to the flap surface');
    await cdp.press(' ','Space',32);
    assert.equal(await cdp.evaluate("document.getElementById('screen-pause').hidden"),true,'Space continues flapping after Pause/Resume');
    await cdp.evaluate("document.getElementById('btn-pause').focus(); true");
    await cdp.press(' ','Space',32);
    await waitFor(()=>cdp.evaluate("!document.getElementById('screen-pause').hidden"),'pause again before returning to menu');
    await cdp.evaluate("document.getElementById('btn-quit-pause').focus(); true");
    await cdp.press(' ','Space',32);
    await waitFor(()=>cdp.evaluate("!document.getElementById('screen-start').hidden&&document.getElementById('hud').hidden&&document.getElementById('game').tabIndex===-1&&document.activeElement.id==='btn-play'"),'quitting to menu removes the canvas tab stop and restores Play focus');
    console.log('GAMEPLAY KEYBOARD FOCUS OK · Space flap · coach actions · Pause/Resume · menu return');

    await cdp.evaluate("localStorage.setItem('flappy-tap:reduce-motion','1'); localStorage.setItem('flappy-tap:coach-done','1'); localStorage.setItem('flappy-tap:resume-countdown','0'); true");
    await cdp.send('Page.reload',{ignoreCache:true});
    await waitFor(()=>cdp.evaluate("document.readyState==='complete'&&!!window.FTStorage&&document.getElementById('boot-splash').hidden&&document.documentElement.classList.contains('reduce-motion')&&!document.getElementById('screen-start').hidden"),'reduced-motion menu for replay regression');
    // A fresh page has an empty replay buffer; expose the actual Replay control to exercise its empty-state handler.
    await cdp.evaluate("document.getElementById('screen-start').hidden=true; document.getElementById('screen-death').hidden=false; document.getElementById('btn-replay-stub').scrollIntoView({block:'center'}); true");
    await clickElementAt('#btn-replay-stub');
    const emptyReplay=await cdp.evaluate("(() => {const c=document.getElementById('replay-viz-canvas'),w=document.getElementById('death-freeze-wrap'),d=document.getElementById('replay-path-description'),more=document.getElementById('replay-path-details'),extra=document.getElementById('replay-path-expanded');return {description:d.textContent,canvasHidden:c.hidden,wrapperHidden:w.hidden,detailsHidden:more.hidden,detailsOpen:more.open,expandedText:extra.textContent};})()");
    assert.deepEqual(emptyReplay,{description:'No saved flight path is available for this run.',canvasHidden:true,wrapperHidden:true,detailsHidden:true,detailsOpen:false,expandedText:''},'an empty run receives a clear accessible message without exposing stale replay details');
    await cdp.evaluate("document.getElementById('screen-death').hidden=true; document.getElementById('screen-death').scrollTop=0; document.getElementById('screen-start').hidden=false; true");
    await delay(1300);
    await clickElementAt('#btn-play');
    await waitFor(()=>cdp.evaluate("document.getElementById('screen-start').hidden&&!document.getElementById('hud').hidden"),'reduced-motion run starts');
    assert.deepEqual(await cdp.evaluate("(() => {const d=document.getElementById('replay-path-description'),more=document.getElementById('replay-path-details'),extra=document.getElementById('replay-path-expanded');return {description:d.textContent,detailsHidden:more.hidden,detailsOpen:more.open,expandedText:extra.textContent};})()"),{description:'',detailsHidden:true,detailsOpen:false,expandedText:''},'a fresh run clears and collapses both replay descriptions');
    await cdp.press(' ','Space',32);
    await delay(180);
    await cdp.press(' ','Space',32);
    await delay(180);
    await waitFor(()=>cdp.evaluate("!document.getElementById('screen-death').hidden&&document.getElementById('run-result-announcement').textContent"),'reduced-motion run-end for replay regression',15000);
    await cdp.evaluate("document.getElementById('btn-replay-stub').scrollIntoView({block:'center'}); true");
    const replayBefore=await cdp.evaluate("(() => {const c=document.getElementById('replay-viz-canvas'),w=document.getElementById('death-freeze-wrap');return {canvasHidden:c.hidden,wrapperHidden:w.hidden,description:document.getElementById('replay-path-description').textContent};})()");
    assert.deepEqual(replayBefore,{canvasHidden:true,wrapperHidden:true,description:''},'the new run keeps its saved path concealed until Replay is requested');
    await clickElementAt('#btn-replay-stub');
    const replayShown=await cdp.evaluate("(() => {const c=document.getElementById('replay-viz-canvas'),w=document.getElementById('death-freeze-wrap'),d=document.getElementById('replay-path-description'),more=document.getElementById('replay-path-details'),extra=document.getElementById('replay-path-expanded'),summary=more.querySelector('summary');return {visible:!c.hidden&&!w.hidden&&c.getClientRects().length>0,data:c.toDataURL(),description:d.textContent,role:d.getAttribute('role'),live:d.getAttribute('aria-live'),canvasRole:c.getAttribute('role'),describedBy:c.getAttribute('aria-describedby'),detailsHidden:more.hidden,detailsOpen:more.open,detailsText:extra.textContent,detailsLive:more.getAttribute('aria-live'),summaryHeight:summary.getBoundingClientRect().height};})()");
    assert.equal(replayShown.visible,true,'tapping Replay reveals the recorded flight path inside its previously hidden figure');
    assert.match(replayShown.description,/^Vertical path over (?:less than a second|about \d+ seconds): the bird (?:stayed nearly level|mostly rose|mostly fell|moved up and down) and finished (?:near|above|below) its starting height\.$/,'the status summarizes duration and vertical movement from the saved samples');
    assert.deepEqual({role:replayShown.role,live:replayShown.live,canvasRole:replayShown.canvasRole,describedBy:replayShown.describedBy},{role:'status',live:'polite',canvasRole:'img',describedBy:'replay-path-description'},'the visible canvas is connected to one polite live summary');
    assert.equal(replayShown.detailsHidden,false,'More flight details appears only after a saved path is available');
    assert.equal(replayShown.detailsOpen,false,'expanded details remain collapsed by default');
    assert.match(replayShown.detailsText,/^Captured \d+ positions over (?:less than a second|about \d+ seconds)\. (?:(?:The bird changed vertical direction \d+ times?\.)|The path kept one vertical trend\.) It covered a (?:narrow|moderate|wide) vertical range\.$/,'expanded text describes the captured samples, direction changes, and range');
    assert.ok(replayShown.summaryHeight>=44,'the native details summary has a 44px minimum tap target');
    assert.equal(replayShown.detailsLive,null,'expanded text is not a live region and will not announce until the player opens it');
    await cdp.evaluate("document.querySelector('#replay-path-details > summary').scrollIntoView({block:'center'}); true");
    await clickElementAt('#replay-path-details > summary');
    const expandedState=await cdp.evaluate("(() => {const more=document.getElementById('replay-path-details');return {open:more.open,description:document.getElementById('replay-path-description').textContent,detailsLive:more.getAttribute('aria-live'),targetHeight:more.querySelector('summary').getBoundingClientRect().height};})()");
    assert.equal(expandedState.open,true,'the More flight details summary expands the native disclosure');
    assert.equal(expandedState.description,replayShown.description,'expanding details does not change or repeat the concise live summary');
    assert.equal(expandedState.detailsLive,null,'the expanded paragraph remains outside a live region');
    assert.ok(expandedState.targetHeight>=44,'the expanded disclosure keeps a usable tap target');
    await cdp.evaluate("document.querySelector('#replay-path-details > summary').scrollIntoView({block:'center'}); true");
    await clickElementAt('#replay-path-details > summary');
    const collapsedState=await cdp.evaluate("(() => {const more=document.getElementById('replay-path-details');return {open:more.open,description:document.getElementById('replay-path-description').textContent,text:document.getElementById('replay-path-expanded').textContent};})()");
    assert.equal(collapsedState.open,false,'the same native summary collapses the expanded description');
    assert.equal(collapsedState.description,replayShown.description,'collapsing details leaves the short live summary unchanged');
    assert.equal(collapsedState.text,replayShown.detailsText,'collapsing preserves the saved details for a later user-requested expansion');
    await delay(250);
    const replayAfter=await cdp.evaluate("({data:document.getElementById('replay-viz-canvas').toDataURL(),description:document.getElementById('replay-path-description').textContent,detailsOpen:document.getElementById('replay-path-details').open})");
    assert.deepEqual(replayAfter,{data:replayShown.data,description:replayShown.description,detailsOpen:false},'Reduced Motion keeps the path static and expanding/collapsing never changes the concise live summary');
    assert.ok((await cdp.evaluate("document.getElementById('toast').textContent")).includes('Static replay'),'reduced-motion feedback explains that the path is being shown without animation');
    console.log('REPLAY DETAILS OK · empty state · collapsed default · expand/collapse · no repeated live text · Reduced Motion stays static');

    await cdp.evaluate(`(() => {
      const probe = window.__shareProbe = {shareCalls:0,copyCalls:0,downloads:0,errorName:'AbortError'};
      Object.defineProperty(navigator,'share',{configurable:true,value:function(){probe.shareCalls++;return Promise.reject(new DOMException('Share sheet dismissed',probe.errorName));}});
      Object.defineProperty(navigator,'canShare',{configurable:true,value:function(){return true;}});
      Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:function(){probe.copyCalls++;return Promise.resolve();}}});
      Object.defineProperty(window,'__shareOriginalAnchorClick',{configurable:true,value:HTMLAnchorElement.prototype.click});
      HTMLAnchorElement.prototype.click=function(){if(this.download==='urr-jaa-score.png'){probe.downloads++;return;}return window.__shareOriginalAnchorClick.call(this);};
      return true;
    })()`);
    const clickShareControl = async (selector) => {
      await cdp.evaluate(`document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'center',inline:'nearest'}); true`);
      await clickElementAt(selector);
    };
    const openSharePreview = async () => {
      await clickShareControl('#btn-share');
      await waitFor(()=>cdp.evaluate("!document.getElementById('share-preview').hidden"),'share preview opens');
    };
    await cdp.evaluate("window.__shareProbe.errorName='AbortError';document.getElementById('toast').textContent='share cancel baseline';true");
    await openSharePreview();
    await clickShareControl('#btn-share-confirm');
    await waitFor(()=>cdp.evaluate('window.__shareProbe.shareCalls===1'),'text share sheet opens');
    await delay(80);
    const cancelledTextShare=await cdp.evaluate("({shareCalls:window.__shareProbe.shareCalls,copyCalls:window.__shareProbe.copyCalls,downloads:window.__shareProbe.downloads,toast:document.getElementById('toast').textContent})");
    assert.deepEqual(cancelledTextShare,{shareCalls:1,copyCalls:0,downloads:0,toast:'share cancel baseline'},'cancelling text sharing does not silently copy text or report a false success');

    await cdp.evaluate("document.getElementById('toast').textContent='image cancel baseline';true");
    await openSharePreview();
    await clickShareControl('#btn-share-image');
    await waitFor(()=>cdp.evaluate('window.__shareProbe.shareCalls===2'),'image share sheet opens');
    await delay(80);
    const cancelledImageShare=await cdp.evaluate("({shareCalls:window.__shareProbe.shareCalls,copyCalls:window.__shareProbe.copyCalls,downloads:window.__shareProbe.downloads,toast:document.getElementById('toast').textContent,previewHidden:document.getElementById('share-preview').hidden})");
    assert.deepEqual(cancelledImageShare,{shareCalls:2,copyCalls:0,downloads:0,toast:'image cancel baseline',previewHidden:false},'cancelling image sharing does not start an unrequested download and leaves the share choices available');
    await clickShareControl('#btn-share-close');
    await waitFor(()=>cdp.evaluate("document.getElementById('share-preview').hidden"),'share preview closes after cancellation');

    await cdp.evaluate("window.__shareProbe.errorName='NotAllowedError';document.getElementById('toast').textContent='text fallback baseline';true");
    await openSharePreview();
    await clickShareControl('#btn-share-confirm');
    await waitFor(()=>cdp.evaluate('window.__shareProbe.shareCalls===3&&window.__shareProbe.copyCalls===1'),'text share failure fallback');
    await delay(40);
    const textShareFallback=await cdp.evaluate("({copyCalls:window.__shareProbe.copyCalls,downloads:window.__shareProbe.downloads,toast:document.getElementById('toast').textContent})");
    assert.deepEqual(textShareFallback,{copyCalls:1,downloads:0,toast:'Copied share text'},'a non-cancellation text-share failure still copies the result as a fallback');

    await cdp.evaluate("document.getElementById('toast').textContent='image fallback baseline';true");
    await openSharePreview();
    await clickShareControl('#btn-share-image');
    await waitFor(()=>cdp.evaluate('window.__shareProbe.shareCalls===4&&window.__shareProbe.downloads===1'),'image share failure fallback');
    const imageShareFallback=await cdp.evaluate("({copyCalls:window.__shareProbe.copyCalls,downloads:window.__shareProbe.downloads,toast:document.getElementById('toast').textContent})");
    assert.deepEqual(imageShareFallback,{copyCalls:1,downloads:1,toast:'Score card saved 📷'},'a non-cancellation image-share failure still saves the score card as a fallback');
    console.log('SHARE CANCELLATION OK · no surprise copy/download · real failures retain fallbacks');

    console.log('BROWSER A11Y/PROGRESS OK · gameplay focus/Space controls · first-run coaching · background pause/recovery · menu/pause/game-over preservation · event/run-end announcements · backup flows');
  } finally {
    if (ws && ws.readyState === WebSocket.OPEN) ws.close();
    if (browser && browser.exitCode === null) {
      browser.kill('SIGTERM');
      await Promise.race([new Promise((resolve) => browser.once('close', resolve)), delay(1500)]);
    }
    if (appServer && server.listening) await new Promise((resolve) => server.close(resolve));
    fs.rmSync(scratch, { recursive: true, force: true });
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
