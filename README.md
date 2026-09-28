# Urr Jaa! — Offline One-Tap Fly Arcade

**اڑ جا!** Vanilla HTML/CSS/JS Flappy-style game with Pakistani flair. **100% offline after first load.** No servers, no accounts, no live ops.

**Display name:** Urr Jaa! · **Folder / repo:** `flappy-tap` (https://github.com/OfferPk/flappy-tap) · **Version:** **3.1.0-urrjaa**

Tagline: **One-tap fly** — tap to flap, 2-second learn, **no countdown**.  
Core loop: **FLY → DODGE → COINS → COMBO → POWER-UP → RECORD → UNLOCK → TRY AGAIN**.

## Play & download

| Platform | Link |
|----------|------|
| **Browser (PC / Android Chrome)** | https://offerpk.github.io/flappy-tap/ |
| **Windows zip** | https://github.com/OfferPk/flappy-tap/releases/latest/download/urr-jaa-web-windows.zip |
| **Android** | Same browser link in Chrome (Add to Home Screen). APK not built yet. |

## Play locally (web)

```bash
cd /workspace/games/flappy-tap
npx --yes serve -l 4174 .
# → http://localhost:4174
```

Or `npm start` / `python3 -m http.server 4174`.

### Windows zip

Extract `dist/urr-jaa-web-windows.zip` (also in `docs/`) → **PLAY-WINDOWS.bat** or open `index.html`.

## Features (v3.1.0-urrjaa)

| Feature | Notes |
|---------|--------|
| One-tap flap | Click / touch / Space — squash juice, rate-clamped |
| **Modes** | Classic · Time Attack 60s · Hard · No Coin · Challenge stages · One Life · Daily · Practice |
| Near-miss | **CLOSE!** toast · 3 consecutive → **RISKY x3** |
| Power-ups (rare) | Shield · Turbo · Coin Magnet · Slow-mo 3s · Ghost |
| Traffic | Escalating rickshaw/cycle → bike → taxi → bus/truck · dual cross |
| Areas | City · Bridge · Mountains · Village · Rain · Night · Desert |
| Accessories | Sunglasses · Cap · Hat · Helmet · Scarf |
| Trails | Spark · Smoke · Stars · Fire · Rainbow |
| Desi voices | Oye hoye · Bach ke · Wah ji wah · Kya udaan · Haye oye · Shabaash |
| Streak | Day 1–7 → coins → mystery → rare skin |
| Boards | PB · Today · All-Time · Distance · Combo (localStorage) |
| One Life | 1 attempt · Bronze100 / Silver300 / Gold500 / Legend1000 |
| Collection | Progress counters birds / vehicles / accessories / trails |
| PWA | `sw.js` cache **urrjaa-v6-20260928** |
| Capacitor | `appId` **com.offerpk.urrjaa**, `webDir` www |

## Capacitor / Android (optional)

```bash
npm install
npm run build:web
npx cap add android   # once
npm run cap:sync
npx cap open android
```

## Layout

```
flappy-tap/          # repo path kept
  index.html         # title Urr Jaa!
  css/ style.css
  js/ storage.js audio.js ads.js skins.js game.js
  icons/ manifest.json sw.js
  www/               # Capacitor webDir
  docs/              # GitHub Pages + urr-jaa-web-windows.zip
  dist/              # urr-jaa-web-windows.zip
  package.json       # name urr-jaa, version 3.1.0-urrjaa
  capacitor.config.json
  README.md STATUS.md
```

## Scripts

| Script | What |
|--------|------|
| `npm start` | Serve port **4174** |
| `npm run build:web` | → `www/` + `docs/` |
| `npm run pack:windows` | → `dist/urr-jaa-web-windows.zip` + docs copy |
| `npm run check` | `node --check` on all `js/*.js` |
| `npm run smoke` | Feature/version smoke assertions |

## Monetization

Stubs only in `js/ads.js`. No secrets / AdMob IDs. Core play free offline.
