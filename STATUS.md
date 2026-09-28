# STATUS — Urr Jaa! v3.3.0-urrjaa

**Path:** `/workspace/games/flappy-tap` (repo OfferPk/flappy-tap; UI title **Urr Jaa!**)
**Owner:** Mia Smith
**Updated:** 2026-09-28 ~16:15 Asia/Karachi (PKT)
**Version:** **3.3.0-urrjaa**
**SW cache:** `urrjaa-v8-20260928`
**Capacitor appId:** `com.offerpk.urrjaa`

## OWNER COMPLETE ✅

### Core (kept from ≤3.2)
- [x] FLY→DODGE→COINS→COMBO→POWER-UP→RECORD→UNLOCK→TRY AGAIN
- [x] Modes · leaderboards · near-miss RISKY · power-ups · streak · accessories/trails
- [x] Desi voices · traffic · special areas · One Life · Collection · ads stubs · juice
- [x] Daily Missions · Perfect Pass · bird passives · weather · boss · mystery · run summary · album

### ADD — v3.3.0 (feel + voice fix, no feature bloat)
- [x] Hitbox ~15–20% smaller than sprite; wings/hats/trails ignored; traffic shrink; coin radius +2
- [x] Obstacle corner tolerance + LUCKY save (forgiving modes)
- [x] First ~10s: slow, wide gaps, simple patterns, almost no hard vehicle combos
- [x] Classic curve: 0–10 Easy → 10–25 Easy+ → 25–45 Normal → 45–75 Difficult → 75+ Hard
- [x] Classic gap size increase (BASE_GAP 172) for reactable play
- [x] Near-edge CLOSE!; soft collision → LUCKY (no instant death) with cooldown
- [x] First-run protection (runs ≤3): extra-wide gaps, fewer vehicles, slower, earlier power-ups
- [x] Calibration from last 5 run durations (short→ease, long→gently harden) — not Hard/Challenge/One Life
- [x] Sensitivity still scales gravity & flap
- [x] **Desi voice FIX:** toasts + Web Audio beeps fire on events; Settings Desi voice ON/OFF (localStorage, default ON); mute ≠ voice (independent); no TTS required

### Forgiveness by mode
| Mode | Forgiving |
|------|-----------|
| Classic / Daily / Practice (+ Time Attack / No Coin) | YES — LUCKY, ease-in, calib, first-run |
| Hard / Challenge / One Life | NO — aggressive / stage / strict |

### Ship
- [x] Offline PWA (`urrjaa-v8-20260928`)
- [x] `www/` + `docs/` + `dist/urr-jaa-web-windows.zip`
- [x] `npm run check` + `npm run smoke`
- [x] No git push · no secrets

## Out of scope ⏳
- [ ] Real AdMob + production IDs
- [ ] Signed APK/AAB
- [ ] GitHub Pages / release upload — **parent agent**

## How to open

```bash
cd /workspace/games/flappy-tap
npx --yes serve -l 4174 .
# → http://localhost:4174
```

Windows: extract `dist/urr-jaa-web-windows.zip` → `PLAY-WINDOWS.bat`.
