# STATUS — Flappy Tap v1.2

**Path:** `/workspace/games/flappy-tap`  
**Owner:** Mia Smith  
**Updated:** 2026-09-28 ~12:50 Asia/Karachi (PKT)  
**Version:** 1.2.0

## Done ✅

- [x] Playable offline one-tap Flappy-style (canvas)
- [x] v1.1 physics kept: fixed bird X; dt gravity + flap; terminal V; ramp; medals; skins; ads stubs
- [x] **Power-ups in gaps:** Shield (1 hit), Slow-mo (3s), Magnet/coin (next pipe +2)
- [x] **Daily challenge:** calendar-day seeded pipes; separate daily best in `localStorage`
- [x] **Practice mode:** no death for 30s, then normal
- [x] **Combo:** consecutive pipes; near-miss has no penalty; ×2 at streak 5
- [x] **Near-miss juice:** spark particles when barely clearing gap
- [x] **Settings:** sensitivity (gravity/flap scale), reduce-motion toggle
- [x] **Haptics stub** (`navigator.vibrate`) + CSS `#app.shake` on death
- [x] PWA: `sw.js` cache bumped to **flappy-tap-v3**
- [x] Capacitor scaffold unchanged (`webDir` www)
- [x] `www/` + `docs/` refreshed; `dist/flappy-tap-web-windows.zip` + PLAY-WINDOWS.bat
- [x] README.md + STATUS.md → v1.2
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
