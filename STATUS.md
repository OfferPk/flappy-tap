# STATUS — Urr Jaa! v3.6.0-urrjaa

**Path:** `/workspace/games/flappy-tap` (repo OfferPk/flappy-tap; UI title **Urr Jaa!**)
**Owner:** Mia Smith
**Updated:** 2026-09-28 ~18:30 Asia/Karachi (PKT)
**Version:** **3.6.0-urrjaa**
**SW cache:** `urrjaa-v15-20260928`
**Capacitor appId:** `com.offerpk.urrjaa`

## Merged remote (OfferPk Factory) before this ship
- `c11caab` 3.5.1 — collection depth (+8 birds, +6 areas, 4 seasonal packs)
- `dd627c8` windows zip refresh for Pages
- `c91ba1f` docs/.nojekyll
- `81e7c6d` release v3.5.2 (Share · A2HS · Missions XSS harden)

## ADD — v3.6.0 polish (keeps all ≤3.5.2 systems)
- [x] Character graphics: clearer bird silhouettes/markings (Sparrow + unlocks) + richer Rickshaw/Cycle/Mehran/vehicles — hitboxes unchanged
- [x] Feel & juice: CLOSE/LUCKY/gift toast variants, coin/gift/near-miss pops + ring, particle cap
- [x] Mystery Rewards: spin progress bar, clearer gifts/spins left, smoother wheel, unlock popup polish
- [x] Voice: more variety lines; keep 6s global / same-phrase anti-spam; mute ≠ voice
- [x] Guide: slightly richer EN / Roman Urdu / اردو; mobile overflow fixes
- [x] Menu tool-row polish (Guide · Mystery · Settings) · run-summary readability
- [x] Classic forgiving retained; Hard modes strict; no countdown

### Ship
- [x] Offline PWA (`urrjaa-v15-20260928`)
- [x] `www/` + `docs/` + `dist/urr-jaa-web-windows.zip`
- [x] `npm run check` + `npm run smoke`

## How to open
```bash
cd /workspace/games/flappy-tap
npx --yes serve -l 4174 .
# → http://localhost:4174
```
