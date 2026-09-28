# STATUS — Urr Jaa! v3.5.1-urrjaa

**Path:** `/workspace/factory/projects/flappy-tap` (repo OfferPk/flappy-tap; UI title **Urr Jaa!**)
**Owner:** Mia Smith · Olivia pick via Master
**Updated:** 2026-09-28 ~17:40 Asia/Karachi (PKT)
**Version:** **3.5.1-urrjaa**
**SW cache:** `urrjaa-v13-20260928`
**Capacitor appId:** `com.offerpk.urrjaa`

## READY_FOR_QA ✅

### ADD — v3.5.1 (collection depth · no live-ops)
- [x] **+8 birds:** Mynah, Bulbul, Cheel, Mor, Kawwa, Kabootar, Hoopoe, Baaz — costs + mild passives + colors + draw accents
- [x] **+6 areas:** Canal, Hunza, Gwadar, Quetta Bazaar, Monsoon Fields, Old City Rooftops — unlockScore/cost + palettes + obstacles + sky silhouettes
- [x] **4 offline seasonal packs:** Azadi · Eid Sparkle · Winter Shawl · Basant Kites — date windows (device local) **and/or** score milestones; persist forever once unlocked (no server seasons)
- [x] Collection UI shows Seasonals section; garage hats/trails include seasonal cosmetics
- [x] Guide EN / Roman Urdu / Urdu updated for collection + seasonals
- [x] Ads remain stubs (no AdMob keys)
- [x] Existing unlocks/saves: new ids locked until earned (graceful)

### Kept from ≤3.5.0
- Voice cooldown/variety · Mystery wheel · Guide · One Life · modes · juice

### Ship
- [x] Offline PWA (`urrjaa-v13-20260928`)
- [x] `www/` + `docs/` refreshed via `npm run build:web`
- [x] `npm run check` + `npm run smoke`
- [ ] Push — **not required** (READY_FOR_QA handoff only)

## How to open

```bash
cd /workspace/factory/projects/flappy-tap
npx --yes serve -l 4174 .
# → http://localhost:4174
```

Menu → **📖 Guide** · **📦 Collection** · Garage birds/areas/seasonal hats & trails.

See **HANDOFF.md** for unlock tables and QA notes.
