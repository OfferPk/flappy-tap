#!/usr/bin/env python3
"""Build urr-jaa-web-windows.zip with PLAY-WINDOWS.bat → dist/ and docs/."""
import zipfile, os, shutil, subprocess, sys
from pathlib import Path

root = Path(__file__).resolve().parent.parent
subprocess.check_call(['node', str(root / 'scripts' / 'build-web.js')])

staging = root / '.pack-staging' / 'urr-jaa-web'
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

for f in ['index.html', 'how-to-play.html', 'manifest.json', 'sw.js']:
    shutil.copy2(root / f, staging / f)
copytree(root / 'css', staging / 'css')
copytree(root / 'js', staging / 'js')
copytree(root / 'icons', staging / 'icons')
copytree(root / 'assets', staging / 'assets')

(staging / 'PLAY-WINDOWS.bat').write_bytes(
    b'@echo off\r\ncd /d "%~dp0"\r\nstart "" "index.html"\r\n'
)
(staging / 'README-PLAY.txt').write_text(
    'Urr Jaa! — offline web build (v3.58.3-urrjaa)\r\n'
    'Quick guide: open how-to-play.html (English / Roman Urdu)\r\n'
    'Windows: double-click PLAY-WINDOWS.bat (or open index.html in Chrome/Edge)\r\n'
    'Android: open the GitHub Pages link in Chrome (Add to Home Screen for PWA)\r\n'
    'Controls: tap / click / Space to flap — NO countdown\r\n'
    'Modes: Classic / Time Attack / Hard / No Coin / Challenge Stages / One Life / Sukoon\r\n'
    'Garage: six local-only character looks plus existing birds, vehicles, hats and trails\r\n'
    'Mystery Rewards: 10 gifts = 1 spin · wheel 444–999 coins\r\n'
    'Repo folder: flappy-tap (OfferPk/flappy-tap) · title Urr Jaa!\r\n',
    encoding='utf-8',
)

dist = root / 'dist'
dist.mkdir(exist_ok=True)
zip_path = dist / 'urr-jaa-web-windows.zip'
# remove old zip name if present
old = dist / 'flappy-tap-web-windows.zip'
if old.exists():
    old.unlink()
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
# remove old docs zip
old_docs = docs / 'flappy-tap-web-windows.zip'
if old_docs.exists():
    old_docs.unlink()
shutil.copy2(zip_path, docs / zip_path.name)
shutil.rmtree(staging.parent)
print('Packed →', zip_path, f'({zip_path.stat().st_size} bytes)')
print('Copied →', docs / zip_path.name)
