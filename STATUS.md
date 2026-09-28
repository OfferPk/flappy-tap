# STATUS — Urr Jaa! v3.10.0-urrjaa

**Path:** `/workspace/games/flappy-tap` (repo OfferPk/flappy-tap; UI title **Urr Jaa!**)
**Owner:** Mia Smith
**Updated:** 2026-09-28 ~19:25 Asia/Karachi (PKT)
**Version:** **3.10.0-urrjaa**
**SW cache:** `urrjaa-v19-20260928`
**Capacitor appId:** `com.offerpk.urrjaa`

## Sync
- Fetched/merged `origin/main` before work (already up to date @ 3.9.0).
- Shipped: commit `545df23` · tag `v3.10.0-urrjaa` · Pages `docs/` · release zip

## ADD — v3.10.0 Mystery history + wheel spin fix
- [x] Mystery box History (persist + UI)
- [x] Wheel visual spin fix (rAF ~7s decelerate)
- [x] Mystery/UI polish
- [x] SW `urrjaa-v19-20260928`
- [x] KEEP all ≤3.9 systems

### Ship
- [x] `npm run check` + `npm run smoke` + build:web + pack:windows
- [x] push main · tag v3.10.0-urrjaa · Pages · release zip

## Root cause (non-spinning wheel)
CSS `transition` on `#spin-wheel` failed visually: `.wheel-spinning .spin-wheel { filter:… }` forced a new compositor layer mid-transition (and `transition:none !important` under reduce-motion). Fixed by rAF-driven `transform` + moving glow filter to `.wheel-rim`.

## Links
- Live: https://offerpk.github.io/flappy-tap/
- Release: https://github.com/OfferPk/flappy-tap/releases/tag/v3.10.0-urrjaa
- Zip: https://github.com/OfferPk/flappy-tap/releases/download/v3.10.0-urrjaa/urr-jaa-web-windows.zip
