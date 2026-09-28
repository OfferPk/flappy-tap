# Urr Jaa! — Offline One-Tap Fly Arcade

**اڑ جا!** Vanilla HTML/CSS/JS Flappy-style game with Pakistani flair. **100% offline after first load.** No servers, no accounts, no live ops.

**Display name:** Urr Jaa! · **Folder / repo:** `flappy-tap` (https://github.com/OfferPk/flappy-tap) · **Version:** **3.4.0-urrjaa**

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

## Features (v3.4.0-urrjaa)

| Feature | Notes |
|---------|--------|
| One-tap flap | Click / touch / Space — squash juice, rate-clamped |
| **Modes** | Classic · Time Attack 60s · Hard · No Coin · Challenge · One Life · Daily · Practice |
| Near-miss | **CLOSE!** · 3 consecutive → **RISKY x3** |
| **Perfect Pass** | Gap center → **PERFECT!** (+3) · Near-miss pass (+5) · Normal (+1) |
| Coin combo | Continuous ladder **x1→x5** · miss resets · near-miss/RISKY boost |
| **Gift Collection** | In-run 📦/🎁 → inventory (no death popup). **10 gifts = 1 spin**. Wheel: **444–999** coins. Spin once / Spin all |
| Power-ups | Shield · Turbo · Coin Magnet · Slow-mo 3s · Ghost |
| Bird passives | Sparrow control · Parrot +5% coin · Owl night · Eagle near-miss (mild, free) |
| Weather | Clear · Rain · Fog · Storm · Night · Sunset (light speed/visibility) |
| Boss/Chase | Every ~180m · DANGER 30–60s · truck/eagle/police/storm/giant |
| Mystery box | COMMON→LEGENDARY · coins/bird/accessory/trail/vehicle/env · dups→Fragments |
| Daily Missions | 3/day from pool · coins / mystery / skin fragments |
| Run Summary | Score · Best · Distance · Coins · Near Misses · Combo · Perfects · RETRY/COLLECTION/HOME |
| Collection | Birds · Vehicles · Accessories · Trails · Areas · Challenges · 25–100% rewards |
| Ads stubs | Continue once / Mystery Box — never mid-flight |
| Traffic | Escalating rickshaw→truck · dual cross |
| Areas | City · Bridge · Mountains · Village · Rain · Night · Desert (+ cities) |
| Feel / forgiveness | Smaller hitbox · corner grace · **LUCKY** · first-10s ease · Classic curve · first-run protect · duration calib |
| Desi voices | **speechSynthesis** (hi-IN/ur) · Oye hoye · Bach ke · Wah ji wah · Kya udaan · Haye oye · Shabaash · Lucky · chirp fallback · Preview · Settings ON/OFF (≠ mute) |
| Streak | Day 1–7 → coins → mystery → rare skin |
| Boards | PB · Today · All-Time · Distance · Combo (localStorage) |
| PWA | `sw.js` cache **urrjaa-v9-20260928** |
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
  package.json       # name urr-jaa, version 3.4.0-urrjaa
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

Stubs only in `js/ads.js`. No secrets / AdMob IDs. Core play free offline. Continue + Mystery Box rewarded stubs never interrupt mid-flight.
