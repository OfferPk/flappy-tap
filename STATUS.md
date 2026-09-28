# STATUS — Flappy Tap v2.0.0-complete

**Path:** `/workspace/games/flappy-tap`  
**Owner:** Mia Smith  
**Updated:** 2026-09-28 ~13:00 Asia/Karachi (PKT)  
**Version:** 2.0.0-complete

## OWNER COMPLETE ✅

### Core
- [x] One-tap flap
- [x] Gravity continuous
- [x] Collide pipe / ground / ceiling = death
- [x] Score +1 per pipe pair once (magnet/combo/×2 can multiply)

### Physics
- [x] dt-clamped gravity
- [x] Consistent flap impulse
- [x] Terminal velocity
- [x] Hitboxes ~10–15%+ forgiving vs sprite (skins.js `hitbox`)

### Difficulty
- [x] Gap shrink + speed ramp with soft caps
- [x] Fair restart spawns

### Modes
- [x] Classic endless
- [x] **Practice = full-run no-death / ghost pipes** (entire run; label “Practice (No Death)”)
- [x] Daily seed run (local date seed + local daily best)

### Power-ups
- [x] Shield 1 hit
- [x] Slow-mo
- [x] Magnet/coin
- [x] Timed ×2 score pickup (+ combo ×2 at streak 5)

### Meta
- [x] Skins: bird / bike / rickshaw + locked **Rocket** (4th)
- [x] Medals bronze / silver / gold / **platinum** (≥100)
- [x] Best + **totalRuns** localStorage (shown on menu)
- [x] Settings: Sound, Haptics stub, Sensitivity, Reduce FX

### Juice
- [x] Parallax
- [x] **Bird velocity trail** (respects reduce-motion)
- [x] Screen flash on death
- [x] Combo text

### Monetization stubs
- [x] Rewarded continue 1/run
- [x] **Rewarded skin unlock** for Rocket (or score ≥40 gate)
- [x] Interstitial between runs
- [x] Core free offline — no AdMob IDs required

### Screens
- [x] Menu
- [x] Skins picker + unlock flow
- [x] Settings
- [x] Play HUD
- [x] Death / Results
- [x] **Pause** (HUD ⏸ + Esc → Resume / Quit)

### Ship
- [x] Offline + PWA (`sw.js` cache **flappy-tap-v4-complete**)
- [x] Capacitor scaffold (`webDir` www) — no APK
- [x] Ads stubs only — no secrets / no AdMob IDs
- [x] `www/` + `docs/` + `dist/flappy-tap-web-windows.zip` refreshed
- [x] Version **2.0.0-complete** in package.json, README, STATUS, index tagline, SW
- [x] No git push from this box

## Out of scope ⏳

- [ ] Real AdMob plugin + production ad unit IDs
- [ ] Signed release APK/AAB — blocked (no JDK / Android SDK assumed)
- [ ] iOS Capacitor target
- [ ] GitHub Pages publish / release upload — **parent agent** (no push)

## How to open

```bash
cd /workspace/games/flappy-tap
npx --yes serve -l 4174 .
# → http://localhost:4174
```

Windows: extract `dist/flappy-tap-web-windows.zip` → `PLAY-WINDOWS.bat`.

## Blockers

1. APK not built on this box (no Java/SDK).  
2. AdMob stubs until real app IDs are provided.  
3. Pages/release publish deferred to parent (no git push).
