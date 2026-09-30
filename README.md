# Urr Jaa! — Offline One-Tap Fly Arcade

**اڑ جا!** Vanilla HTML/CSS/JS Flappy-style game with Pakistani flair. **100% offline after first load.** No servers, no accounts, no live ops.

**Display name:** Urr Jaa! · **Folder / repo:** `flappy-tap` (https://github.com/OfferPk/flappy-tap) · **Version:** **3.58.5-urrjaa**

Tagline: **One-tap fly** — tap to flap, 2-second learn, **no countdown**.  
Core loop: **FLY → DODGE → COINS → COMBO → POWER-UP → RECORD → UNLOCK → TRY AGAIN**.

## Play & download

| Platform | Link |
|----------|------|
| **Browser (PC / Android Chrome)** | https://offerpk.github.io/flappy-tap/ |
| **Windows zip** | https://github.com/OfferPk/flappy-tap/releases/latest/download/urr-jaa-web-windows.zip |
| **Android** | Same browser link in Chrome (Add to Home Screen). APK not built yet. |

**Quick start:** [How to play — English + Roman Urdu](https://offerpk.github.io/flappy-tap/how-to-play.html) · [Source guide](./how-to-play.html). The game menu also links to this offline-ready guide.

## Play locally (web)

```bash
cd /workspace/games/flappy-tap
npx --yes serve -l 4174 .
# → http://localhost:4174
```

Or `npm start` / `python3 -m http.server 4174`.

### Windows zip

Extract `dist/urr-jaa-web-windows.zip` (also in `docs/`) → **PLAY-WINDOWS.bat** or open `index.html`.

## Features (v3.58.5-urrjaa)

- **Soft collision dust** · **area/menu music stub** · **collection % meter** · **mystery jackpot juice**
- Changelog · flap whoosh · guide refresh · perf · haptic intensity · boss warn · gift→spin toast
- Death freeze · path replay that respects reduced-motion settings · env fade · coin popup · coach · share card
- **Mystery wheel 15s** Spin once (KEEP) · Close (X) · tips · fireworks · pipes · safe-area
- Power VFX clarity (Slow-mo / Ghost / Turbo) · Challenge stage picker · One Life heart HUD
- Coin economy balance · Bird unlock teasers · Gift haptic · Landscape safe-area
- **MAGIC 🪄** persistent inventory · daily +1 · pause-aware 10-second safe flight; ad rewards stay unavailable until a real SDK is connected
- Universal Close (X) on all panels · Esc · mid-spin Mystery keeps charge

- Perfect Pass center-rail juice + Practice ghost guide
- Time Attack pace HUD · Offline banner · Branded boot splash
- Extra pipe skins (mosaic, terracotta, neon, tiled) · Gift spawn balance

- **Chase 3.13:** boss DANGER pulse + timer bar · multi-wave traffic · clear confetti
- **Near-miss camera** kick toward graze edge
- **Medal gallery** on Boards · share score-card preview
- **Night city** window lights + neon pipes · magnet aura/trail
- **Local demo-only revive/gift simulations** · hidden on hosted builds · A2HS after 2 runs · accessible zoom/focus
- **≤3.12 systems kept** (missions, weather FX, garage filters, Classic feel, 3D, Mystery…)

- **Polish 3.6.0:** richer bird/vehicle art · juice/toasts · Mystery progress · voice variety · Guide/menu polish
- **Collection depth:** +8 desi birds · +6 areas · 4 offline seasonal packs (Azadi / Eid / Winter / Basant)
- **Improve 3.5.2/3.5.3:** Run Share · Home A2HS tip · Missions XSS harden · build preserves docs/.nojekyll

| Feature | Notes |
|---------|--------|
| One-tap flap | Click / touch / Space — squash juice, rate-clamped |
| **Modes** | Classic · Time Attack 60s · Hard · No Coin · Challenge · One Life · Daily · Practice |
| **Sukoon / Relax** | Optional 1/3/5-minute slower flight · wider gaps · gentle non-lethal bumps · no score, coins, streaks, missions, or records |
| Character looks | Six compact local mascot sprites in Garage; “Use equipped bird” restores the existing appearance · visual-only, no coins/unlocks/passive changes |
| Near-miss | **CLOSE!** · 3 consecutive → **RISKY x3** |
| **Perfect Pass** | Gap center → **PERFECT!** (+3) · Near-miss pass (+5) · Normal (+1) |
| Coin combo | Continuous ladder **x1→x5** · missed coin gently steps multiplier down one level · near-miss/RISKY boost |
| **Mystery Rewards** | Menu/Album → visual **spin wheel**. In-run 📦 → inventory. **10 gifts = 1 spin**. Prizes **444–999** 🪙. Spin once / Spin all |
| Spin unlock popup | One-time when a new ×10 threshold is crossed (not spam on menu open) |
| **Guide** | Menu → Guide · **English / Roman Urdu / اردو** |
| First-run coach | Live-announced tips for flapping, pipe gaps, coins/power-ups, and HUD · Space stays on the flap surface through coach and Pause/Resume |
| Sound toggle | Stable accessible name · explicit muted/unmuted pressed state · tooltip describes the next action |
| Power-ups | Compact active chips show live remaining time and disappear on expiry; Shield accurately shows its existing one-hit protection · Turbo · Coin Magnet · Slow-mo 3s · Ghost |
| Bird passives | Sparrow control · Parrot +5% coin · Owl night · Eagle near-miss (mild, free) |
| Weather | Clear · Rain · Fog · Storm · Night · Sunset (light speed/visibility) |
| Boss/Chase | Every ~180m · DANGER 30–60s · truck/eagle/police/storm/giant |
| Daily Missions | 3/day from pool · coins / mystery / skin fragments |
| Run Summary | Score with quick **RETRY** · Best · Distance · Coins · Near Misses · Combo · Perfects · **Share** · COLLECTION/HOME |
| A2HS tip | Soft home tip (EN + Roman Urdu); session dismiss |
| Missions XSS | Allowlisted ids + textContent cards (F1 closed) |
| Collection | Birds · Vehicles · Accessories · Trails · Areas · Challenges · 25–100% rewards |
| Ad actions | Demo-only on localhost with `?demoAds=1`; hidden on hosted builds until a real provider is connected |
| Progress backup | Versioned JSON export/import · strict validation · explicit overwrite confirmation · local-only |
| MAGIC 🪄 | Persistent inventory · daily +1 · 10-second guided safe flight · rewarded ads unavailable without SDK |
| Feel / forgiveness | Smaller hitbox · corner grace · **LUCKY** · first-10s ease · Classic curve · first-run protect |
| Desi voices | speechSynthesis + chirp · **cooldown ~6s** · same-phrase ~12s · variety pools · gift lines · Preview · Settings ON/OFF (**≠ mute**) |
| Streak | Day 1–7 → coins → mystery → rare skin |
| Boards | PB · Today · All-Time · Distance · Combo (localStorage) |
| PWA | `sw.js` cache **urrjaa-v88-20260930** · failed asset requests stay asset errors; only offline navigations fall back to the app shell |
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
  package.json       # name urr-jaa, version 3.10.0-urrjaa
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

No live ad provider or ad IDs are connected. Simulated revive/gift prompts are available only on localhost with `?demoAds=1`; hosted builds hide those actions. Core play stays free and offline-capable.
