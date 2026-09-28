# Flappy Tap — Offline One-Tap Arcade

Vanilla HTML/CSS/JS Flappy-style game. **100% offline after first load.** No servers, no accounts, no live ops.

**v1.2** — power-ups in gaps, daily challenge (seeded), practice mode, combo multiplier, near-miss sparks, settings (sensitivity / reduce-motion), haptics stub + death shake.

## Play & download

| Platform | Link |
|----------|------|
| **Browser (PC / Android Chrome)** | https://offerpk.github.io/flappy-tap/ |
| **Windows zip** | https://github.com/OfferPk/flappy-tap/releases/latest/download/flappy-tap-web-windows.zip |
| **Android** | Same browser link in Chrome (Add to Home Screen). APK not built yet (no JDK/SDK here). |

Repo: https://github.com/OfferPk/flappy-tap

## Play locally (web)

```bash
cd /workspace/games/flappy-tap
npx --yes serve -l 4174 .
# → http://localhost:4174
```

Or:

```bash
npm start
# / python3 -m http.server 4174
```

`file://` works for core play; PWA/service worker needs `http://`.

### Windows zip

Extract `dist/flappy-tap-web-windows.zip` (also copied to `docs/`) → double-click **PLAY-WINDOWS.bat** or open `index.html`.

### GitHub Pages

Static site is in `docs/` (same assets as `www/`). Parent agent publishes — this box does **not** git push.

## Features

| Feature | Notes |
|---------|--------|
| One-tap flap | Click / touch / Space — fixed upward impulse (rate-clamped) |
| Flappy physics | Fixed bird X; world scrolls; `vy += g·dt`; terminal velocity |
| Pipes | Random gap Y; recycle off-screen; score when right edge passes bird |
| **Power-ups** | Spawn in gaps: **Shield** (1 hit), **Slow-mo** (3s), **Magnet/coin** (next pipe +2) |
| **Daily challenge** | Fixed seed pipes for the calendar day; separate daily best |
| **Practice** | Invulnerable for 30s, then normal danger |
| **Combo** | Consecutive pipes (near-miss has **no** penalty) → score **×2** at streak 5 |
| **Near-miss juice** | Sparks when barely clearing a gap |
| **Settings** | Sensitivity (gravity/flap scale 0.7–1.3); reduce-motion toggle |
| **Haptics stub** | `navigator.vibrate` when available; CSS screen shake on death |
| Difficulty ramp | Speed ↑, gap ↓, spacing tighter with score (capped) |
| Collision | AABB vs pipes + ground + ceiling → hit flash → brief freeze → Game Over |
| Medals | Bronze 10 / Silver 25 / Gold 50 — best medal in `localStorage` |
| Skins | Bird (day) / Bike (dusk) / Rickshaw (night) — cosmetic + palette |
| Score + best | Classic + daily bests in `localStorage` |
| Juice | Velocity tilt, parallax ground, clouds, particles |
| Ads (stubs) | Rewarded continue after death; interstitial between runs (`js/ads.js`) |
| PWA | `manifest.json` + `sw.js` (cache `flappy-tap-v3`) |
| Sound | Tiny Web Audio beeps; mute button |

## Capacitor / Android (optional)

Scaffold only — **no APK built here** (JDK/Android SDK not assumed).

```bash
npm install
npm run build:web          # → www/ (+ docs/)
npx cap add android        # once
npm run cap:sync
npx cap open android       # Android Studio on a machine with SDK
# or: npm run android:build  # needs JDK 17+ and Android SDK
```

`capacitor.config.json`: `appId` `com.ceobot.flappytap`, `webDir` `www`.

## Layout

```
flappy-tap/
  index.html
  css/style.css
  js/storage.js audio.js ads.js skins.js game.js
  icons/  manifest.json  sw.js
  www/          # Capacitor webDir (built)
  docs/         # GitHub Pages static copy (+ windows zip)
  dist/         # flappy-tap-web-windows.zip
  scripts/build-web.js  pack-windows.js
  package.json  capacitor.config.json
  README.md     STATUS.md
```

## Scripts

| Script | What |
|--------|------|
| `npm start` | Serve on port **4174** |
| `npm run build:web` | Copy assets → `www/` and `docs/` |
| `npm run pack:windows` | Build zip with `PLAY-WINDOWS.bat` → `dist/` + `docs/` |

## Monetization

Cow-cash **stubs only** in `js/ads.js`. Set `window.ADMOB_CONFIG` later if wiring a real plugin — until then Grant/Skip UI simulates rewarded / interstitial. No keystores, tokens, or `.env` secrets in this repo.
