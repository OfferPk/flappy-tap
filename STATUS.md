# STATUS — Flappy Tap MVP

**Path:** `/workspace/games/flappy-tap`  
**Owner:** Mia Smith  
**Updated:** 2026-09-28 ~12:25 Asia/Karachi (PKT)  
**Version:** 1.0.0

## Done ✅

- [x] Playable offline one-tap Flappy-style (canvas) — flap, gravity, pipes, ground/ceiling death
- [x] Controls: click / touch / Space
- [x] Skins: bird / bike / rickshaw — pickable, `localStorage`
- [x] Score + best score in `localStorage`
- [x] Mobile-friendly UI (HUD, start/death screens, mute)
- [x] Ads stubs only (`js/ads.js`): rewarded continue after death; interstitial between runs
- [x] PWA: `manifest.json` + `sw.js` (cache-first)
- [x] Capacitor scaffold: `package.json`, `capacitor.config.json`, `build:web`, README Android notes
- [x] `www/` webDir build
- [x] `docs/` static copy for GitHub Pages
- [x] `dist/flappy-tap-web-windows.zip` + `PLAY-WINDOWS.bat` (+ copy in `docs/`)
- [x] README.md + STATUS.md
- [x] No keystores / tokens / `.env` / GitHub push

## Left / out of scope ⏳

- [ ] Real AdMob plugin + production ad unit IDs
- [ ] Signed release APK/AAB — **blocked here** (no JDK / Android SDK assumed)
- [ ] iOS Capacitor target
- [ ] Fancy particle FX / parallax polish beyond current art
- [ ] GitHub Pages publish / release upload — **parent agent** (no push from this box)

## How to open

```bash
cd /workspace/games/flappy-tap
npx --yes serve -l 4174 .
# → http://localhost:4174
```

Windows: extract `dist/flappy-tap-web-windows.zip` → `PLAY-WINDOWS.bat`.

## Blockers

1. APK not built on this box (no Java/SDK required for MVP).  
2. AdMob stubs until real app IDs are provided.  
3. Pages/release publish deferred to parent (no git push).
