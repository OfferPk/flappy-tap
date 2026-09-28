#!/usr/bin/env node
/**
 * Copy static web assets into www/ (Capacitor) and docs/ (GitHub Pages).
 * Preserves docs/*-web-windows.zip if present.
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

function rmrf(p) {
  if (!fs.existsSync(p)) return;
  fs.rmSync(p, { recursive: true, force: true });
}

function copyFile(src, dst) {
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(src, dst);
}

function copyDir(src, dst) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dst, { recursive: true });
  for (const name of fs.readdirSync(src)) {
    const s = path.join(src, name);
    const d = path.join(dst, name);
    if (fs.statSync(s).isDirectory()) copyDir(s, d);
    else copyFile(s, d);
  }
}

function buildTo(dest, { preserveGlobs } = {}) {
  const saved = [];
  if (preserveGlobs && fs.existsSync(dest)) {
    for (const name of fs.readdirSync(dest)) {
      if (preserveGlobs.some((g) => name.endsWith(g) || name === g)) {
        const tmp = path.join(root, '.build-preserve-' + name);
        fs.copyFileSync(path.join(dest, name), tmp);
        saved.push([name, tmp]);
      }
    }
  }
  rmrf(dest);
  fs.mkdirSync(dest, { recursive: true });
  const files = ['index.html', 'manifest.json', 'sw.js'];
  for (const f of files) {
    const src = path.join(root, f);
    if (fs.existsSync(src)) copyFile(src, path.join(dest, f));
  }
  copyDir(path.join(root, 'css'), path.join(dest, 'css'));
  copyDir(path.join(root, 'js'), path.join(dest, 'js'));
  copyDir(path.join(root, 'icons'), path.join(dest, 'icons'));
  for (const [name, tmp] of saved) {
    fs.copyFileSync(tmp, path.join(dest, name));
    fs.unlinkSync(tmp);
  }
}

buildTo(path.join(root, 'www'));
buildTo(path.join(root, 'docs'), { preserveGlobs: ['-web-windows.zip', '.nojekyll'] });
// GitHub Pages must stay in static mode even when docs/ is rebuilt from scratch.
fs.writeFileSync(path.join(root, 'docs', '.nojekyll'), '');
console.log('Built web assets → www/ and docs/');
