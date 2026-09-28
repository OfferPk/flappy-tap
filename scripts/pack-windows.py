#!/usr/bin/env python3
"""Build flappy-tap-web-windows.zip with PLAY-WINDOWS.bat → dist/ and docs/."""
import zipfile, os, shutil, subprocess, sys
from pathlib import Path

root = Path(__file__).resolve().parent.parent
subprocess.check_call(['node', str(root / 'scripts' / 'build-web.js')])

staging = root / '.pack-staging' / 'flappy-tap-web'
if staging.parent.exists():
    shutil.rmtree(staging.parent)
staging.mkdir(parents=True)

def copytree(src, dst):
    dst.mkdir(parents=True, exist_ok=True)
    for p in Path(src).iterdir():
        if p.is_dir():
            copytree(p, dst / p.name)
        else:
            shutil.copy2(p, dst / p.name)

for f in ['index.html', 'manifest.json', 'sw.js']:
    shutil.copy2(root / f, staging / f)
copytree(root / 'css', staging / 'css')
copytree(root / 'js', staging / 'js')
copytree(root / 'icons', staging / 'icons')

(staging / 'PLAY-WINDOWS.bat').write_bytes(
    b'@echo off\r\ncd /d "%~dp0"\r\nstart "" "index.html"\r\n'
)
(staging / 'README-PLAY.txt').write_text(
    'Flappy Tap — offline web build (v1.2 power-ups + daily + practice)\r\n'
    'Windows: double-click PLAY-WINDOWS.bat (or open index.html in Chrome/Edge)\r\n'
    'Android: open the GitHub Pages link in Chrome (Add to Home Screen for PWA)\r\n'
    'Controls: tap / click / Space to flap\r\n'
    'Modes: Classic / Daily Challenge / Practice · Combo x2 at 5 · Skins + medals\r\n',
    encoding='utf-8',
)

dist = root / 'dist'
dist.mkdir(exist_ok=True)
zip_path = dist / 'flappy-tap-web-windows.zip'
if zip_path.exists():
    zip_path.unlink()

base = staging.parent
with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as z:
    for dirpath, _, filenames in os.walk(base):
        for name in filenames:
            full = Path(dirpath) / name
            z.write(full, full.relative_to(base))

docs = root / 'docs'
docs.mkdir(exist_ok=True)
shutil.copy2(zip_path, docs / zip_path.name)
shutil.rmtree(staging.parent)
print('Packed →', zip_path, f'({zip_path.stat().st_size} bytes)')
print('Copied →', docs / zip_path.name)
