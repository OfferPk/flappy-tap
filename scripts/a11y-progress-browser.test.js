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
    await cdp.evaluate("localStorage.setItem('flappy-tap:best','47'); localStorage.setItem('flappy-tap:coins','123'); localStorage.setItem('flappy-tap:coach-done','1'); localStorage.setItem('flappy-tap:mute','1'); true");
    await cdp.send('Page.reload', { ignoreCache: true });
    await waitFor(() => cdp.evaluate("document.readyState === 'complete' && !!window.FTStorage && document.getElementById('boot-splash').hidden"), 'menu after boot');

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
    await cdp.evaluate("localStorage.setItem('flappy-tap:best','47'); localStorage.setItem('flappy-tap:coins','123'); true");
    await cdp.evaluate("document.getElementById('btn-play').focus(); true");
    await cdp.press('Enter', 'Enter', 13);
    const gameEntry = await cdp.evaluate("({active:document.activeElement.id,startHidden:document.getElementById('screen-start').hidden,hudHidden:document.getElementById('hud').hidden,playDisabled:document.getElementById('btn-play').disabled,bootHidden:document.getElementById('boot-splash').hidden,settingsHidden:document.getElementById('screen-settings').hidden})");
    assert.ok(gameEntry.startHidden && !gameEntry.hudHidden, 'keyboard activation enters gameplay: ' + JSON.stringify(gameEntry));
    const liveSemantics = await cdp.evaluate("({role:document.getElementById('game-announcer').getAttribute('role'),live:document.getElementById('game-announcer').getAttribute('aria-live'),atomic:document.getElementById('game-announcer').getAttribute('aria-atomic')})");
    assert.deepEqual(liveSemantics, { role: 'status', live: 'polite', atomic: 'true' }, 'the event announcement region has polite atomic status semantics');
    const startAnnouncement = await waitFor(() => cdp.evaluate("document.getElementById('game-announcer').textContent.includes('run started') && document.getElementById('game-announcer').textContent"), 'run-start announcement');
    assert.match(startAnnouncement, /Classic run started/i);
    const stableAnnouncement = await cdp.evaluate("document.getElementById('game-announcer').textContent");
    await delay(250);
    assert.equal(await cdp.evaluate("document.getElementById('game-announcer').textContent"), stableAnnouncement,
      'the polite live region remains quiet between meaningful events');
    await cdp.press('Escape', 'Escape', 27);
    const pauseAnnouncement = await waitFor(() => cdp.evaluate("document.getElementById('game-announcer').textContent.includes('Game paused') && document.getElementById('game-announcer').textContent"), 'pause announcement');
    assert.match(pauseAnnouncement, /Score \d+/);
    await cdp.press('Escape', 'Escape', 27);
    const resumeAnnouncement = await waitFor(() => cdp.evaluate("document.getElementById('game-announcer').textContent === 'Game resumed.' && document.getElementById('game-announcer').textContent"), 'resume announcement');
    assert.equal(resumeAnnouncement, 'Game resumed.');

    console.log('BROWSER A11Y/PROGRESS OK · keyboard/focus · event announcements · valid/rejected/oversized imports · rollback after simulated storage failure');
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
