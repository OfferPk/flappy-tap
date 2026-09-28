# Urr Jaa! — Offline One-Tap Fly Arcade

**اڑ جا!** Vanilla HTML/CSS/JS Flappy-style game with Pakistani flair. **100% offline after first load.** No servers, no accounts, no live ops.

**Display name:** Urr Jaa! · **Folder / repo:** `flappy-tap` (https://github.com/OfferPk/flappy-tap) · **Version:** **3.0.0-urrjaa**

Tagline: **One-tap fly** — tap to flap, 2-second learn, **no countdown**.

## Play & download

| Platform | Link |
|----------|------|
| **Browser (PC / Android Chrome)** | https://offerpk.github.io/flappy-tap/ |
| **Windows zip** | https://github.com/OfferPk/flappy-tap/releases/latest/download/urr-jaa-web-windows.zip |
| **Android** | Same browser link in Chrome (Add to Home Screen). APK not built yet (no JDK/SDK here). |

## Play locally (web)

```bash
cd /workspace/games/flappy-tap
npx --yes serve -l 4174 .
# → http://localhost:4174
```

Or `npm start` / `python3 -m http.server 4174`.

### Windows zip

Extract `dist/urr-jaa-web-windows.zip` (also in `docs/`) → **PLAY-WINDOWS.bat** or open `index.html`.

## Features (v3.0.0-urrjaa)

| Feature | Notes |
|---------|--------|
| One-tap flap | Click / touch / Space — fixed impulse, rate-clamped |
| Gravity + pipes | Fixed bird X; world scrolls; forgiving hitboxes |
| **Birds** | Sparrow (start) · Parrot · Eagle · Chick · Owl · Funny — garage unlock with coins |
| **Vehicles** | Pairing comedy: Rickshaw, Cycle, Bike, Scooty, Bicycle, Chingchi, Taxi, Bus, Mehran, Tractor |
| **Environments** | Normal City, Lahore, Islamabad, Karachi, Murree, Village, Desert, Night City — score milestones or shop |
| **Weather** | Sunny / Rain / Fog / Night / Storm — **visual FX only** (no unfair difficulty) |
| **Coins** | Collect in gaps · spend in garage |
| **Coin combo** | Consecutive coins → COMBO **x2 / x5 / x10** score mult |
| **Mystery boxes** | Occasional · random cosmetic · Collection album |
| **Missions** | Daily local: fly meters, coins, obstacles, boxes, score 50 clean |
| **PK obstacles** | Kite, rickshaw, cycle, bus, signboard, tree, construction, brick, wires, clothesline + toast “Oye bach ke!” |
| **Modes** | Classic · Daily · Practice (no death) · Challenge 100m clean · Hard · Reverse flap · Giant bird |
| Power-ups | Shield, Slow-mo, Magnet, timed ×2 (optional, not cluttering core) |
| Pause / Settings | Esc or ⏸ · Sound, Haptics, Sensitivity, Reduce motion |
| Medals | Bronze 10 / Silver 25 / Gold 50 / Platinum 100 |
| Ads stubs | Rewarded continue · interstitial between runs — no AdMob IDs |
| PWA | `manifest.json` + `sw.js` cache **urrjaa-v5-20260928** |
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
  package.json       # name urr-jaa, version 3.0.0-urrjaa
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

## Monetization

Stubs only in `js/ads.js`. No secrets / AdMob IDs. Core play free offline.
