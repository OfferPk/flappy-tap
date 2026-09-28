# STATUS — Flappy Tap v1.1

**Path:** `/workspace/games/flappy-tap`  
**Owner:** Mia Smith  
**Updated:** 2026-09-28 ~12:35 Asia/Karachi (PKT)  
**Version:** 1.1.0

## Done ✅

- [x] Playable offline one-tap Flappy-style (canvas)
- [x] **v1.1 physics:** fixed bird X; dt-based gravity + flap impulse (rate-clamped); terminal V
- [x] Pipe pairs: random gap Y; spawn/recycle; score once when right edge passes bird X
- [x] AABB vs pipes + ground + ceiling → death
- [x] Difficulty ramp: speed ↑, gap shrink, tighter spacing (tunable caps)
- [x] Juice: velocity tilt, parallax ground, hit flash, death freeze then Game Over UI
- [x] Medals: bronze 10 / silver 25 / gold 50; best medal + best score in `localStorage`
- [x] Skin-synced palette: bird=day, bike=dusk, rickshaw=night
- [x] Skins: bird / bike / rickshaw — pickable, `localStorage`
- [x] Ads stubs kept (`js/ads.js`): rewarded continue; interstitial between runs
- [x] PWA: `manifest.json` + `sw.js` cache **flappy-tap-v2**
- [x] Capacitor scaffold unchanged (`webDir` www)
- [x] `www/` + `docs/` refreshed; `dist/flappy-tap-web-windows.zip` + PLAY-WINDOWS.bat
- [x] README.md + STATUS.md note enhancements
- [x] No keystores / tokens / `.env` / GitHub push

## Left / out of scope ⏳

- [ ] Real AdMob plugin + production ad unit IDs
- [ ] Signed release APK/AAB — **blocked here** (no JDK / Android SDK assumed)
- [ ] iOS Capacitor target
- [ ] GitHub Pages publish / release upload — **parent agent** (no push from this box)

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
