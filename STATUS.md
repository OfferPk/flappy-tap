# STATUS — Urr Jaa! v3.2.0-urrjaa

**Path:** `/workspace/games/flappy-tap` (repo OfferPk/flappy-tap; UI title **Urr Jaa!**)
**Owner:** Mia Smith
**Updated:** 2026-09-28 ~16:00 Asia/Karachi (PKT)
**Version:** **3.2.0-urrjaa**
**SW cache:** `urrjaa-v7-20260928`
**Capacitor appId:** `com.offerpk.urrjaa`

## OWNER COMPLETE ✅

### Core (kept from ≤3.1)
- [x] FLY→DODGE→COINS→COMBO→POWER-UP→RECORD→UNLOCK→TRY AGAIN
- [x] Modes · leaderboards · near-miss RISKY · power-ups · streak · accessories/trails
- [x] Desi voices · traffic · special areas · One Life · Collection · ads stubs · juice

### ADD — v3.2.0
- [x] Daily Missions: 3/day from pool (50 coins · dodge 20 · 3 near-misses · score 100) · coins/mystery/fragment rewards · persisted
- [x] Coin combo ladder continuous x1→x5 · miss resets · links near-miss + RISKY
- [x] Perfect Pass (gap center) · Normal +1 · Perfect +3 · Near-miss +5
- [x] Bird passives (mild): Sparrow control · Parrot +5% coin · Owl night · Eagle near-miss — free
- [x] Dynamic weather gameplay: Clear/Rain/Fog/Storm/Night/Sunset (slight visibility/speed)
- [x] Boss/Chase every ~180m: DANGER truck/eagle/police/storm/giant · 30–60s
- [x] Mystery box COMMON→LEGENDARY · rewards · duplicates→Fragments · 10/20 unlock
- [x] Run Summary: Score/Best/Distance/Coins/Near Misses/Best Combo/Perfects · NEW RECORD · RETRY|COLLECTION|HOME
- [x] Collection Album: Birds/Vehicles/Accessories/Trails/Areas/Challenges + 25/50/75/100% rewards
- [x] Monetization stubs: Continue once · Mystery Box ad — never mid-flight

### Polish
- [x] Physics/passive feel · collision juice · SFX variety · score pops · shake · particles
- [x] Optional per-area Web Audio music stubs

### Ship
- [x] Offline PWA (`urrjaa-v7-20260928`)
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
