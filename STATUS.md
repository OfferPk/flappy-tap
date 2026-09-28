# STATUS — Urr Jaa! v3.5.3-urrjaa

**Path:** `/workspace/factory/projects/flappy-tap` (repo OfferPk/flappy-tap; UI title **Urr Jaa!**)
**Owner:** Mia Smith · Olivia pick via Master
**Updated:** 2026-09-28 ~18:20 Asia/Karachi (PKT)
**Version:** **3.5.3-urrjaa**
**SW cache:** `urrjaa-v15-20260928`
**Capacitor appId:** `com.offerpk.urrjaa`

## Prior gate (v3.5.2) — CLEAR
- QA **PASS** (`QA-REPORT-v3.5.2.md`)
- Security **PASS_WITH_NOTES — CLEAR for 3.5.2** (`SECURITY-REPORT-v3.5.2.md`); F1 Missions XSS closed, F2 remains LOW note

## READY_FOR_QA ✅ (improve delta 3.5.3)

### IMPROVE — v3.5.3 (ship hygiene only · no gameplay/collection)
- [x] `scripts/build-web.js` preserves `docs/.nojekyll` across rebuilds and always writes an empty marker
- [x] `npm run build:web` leaves `docs/.nojekyll` present; `www/` behavior remains unchanged
- [x] HANDOFF documents the Pages/static-hosting prerequisite
- [x] No new birds/areas/seasonals; no gameplay or collection changes

### Kept from v3.5.2
- Collection depth (+8 birds / +6 areas / 4 seasonals) · Voice · Mystery wheel · Guide · One Life · modes · juice

### Ship gate
- [x] Offline PWA (`urrjaa-v15-20260928`)
- [x] `www/` + `docs/` via `npm run build:web`
- [x] `npm run check` + `npm run smoke`
- [x] `docs/.nojekyll` present after build
- [ ] Master re-QA of this 3.5.3 build-web delta
- [ ] Push / Pages publish — no GH push performed here

## How to open

```bash
cd /workspace/factory/projects/flappy-tap
npx --yes serve -l 4174 .
# → http://localhost:4174
```

Menu → **📖 Guide** · **📦 Collection** · death **📤 Share** · home A2HS tip.

See **HANDOFF.md** for improve notes.
