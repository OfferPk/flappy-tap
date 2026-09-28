# STATUS — Urr Jaa! v3.5.2-urrjaa

**Path:** `/workspace/factory/projects/flappy-tap` (repo OfferPk/flappy-tap; UI title **Urr Jaa!**)
**Owner:** Mia Smith · Olivia pick via Master
**Updated:** 2026-09-28 ~17:55 Asia/Karachi (PKT)
**Version:** **3.5.2-urrjaa**
**SW cache:** `urrjaa-v14-20260928`
**Capacitor appId:** `com.offerpk.urrjaa`

## Prior gate (v3.5.1) — CLEAR
- QA **PASS** (`QA-REPORT-v3.5.1.md`)
- Security **PASS_WITH_NOTES** (`SECURITY-REPORT.md`) — F1 Missions XSS was MEDIUM note

## READY_FOR_QA ✅ (improve delta 3.5.2)

### IMPROVE — v3.5.2 (post–3.5.1 CLEAR · no collection packs)
- [x] **F1 closed — Missions XSS harden:** `getActiveMissionIds` allowlists against `MISSION_POOL` / `DAILY_MISSION_IDS`; `refreshMissions` uses `createElement` + `textContent` (no label HTML concat); unknown-id fallback label **Mission** (not raw id)
- [x] **Run Summary Share:** `#btn-share` on `#screen-death` — `Urr Jaa! — score N (mode) · best B` (mode when not Classic); `navigator.share` or clipboard + `showToast`
- [x] **Home A2HS tip:** soft tip on `#screen-start` only (EN + Roman Urdu); `sessionStorage` `urrjaa:a2hs` dismiss; no `beforeinstallprompt` required
- [x] Docs: README local path → factory projects; STATUS reflects prior CLEAR + this delta READY_FOR_QA
- [x] No new birds/areas/seasonals; ads remain stubs; `todayKey` unchanged

### Kept from ≤3.5.1
- Collection depth (+8 birds / +6 areas / 4 seasonals) · Voice · Mystery wheel · Guide · One Life · modes · juice

### Ship
- [x] Offline PWA (`urrjaa-v14-20260928`)
- [x] `www/` + `docs/` via `npm run build:web`
- [x] `npm run check` + `npm run smoke`
- [ ] Push / Pages publish — after Master re-QA of this improve delta

## How to open

```bash
cd /workspace/factory/projects/flappy-tap
npx --yes serve -l 4174 .
# → http://localhost:4174
```

Menu → **📖 Guide** · **📦 Collection** · death **📤 Share** · home A2HS tip.

See **HANDOFF.md** for improve notes.
