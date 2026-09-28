# HANDOFF — Urr Jaa! 3.5.1-urrjaa (collection depth)

**Status:** READY_FOR_QA  
**Version:** 3.5.1-urrjaa  
**SW:** urrjaa-v13-20260928  
**Live (after Pages deploy):** https://offerpk.github.io/flappy-tap/  
**Local:** `/workspace/factory/projects/flappy-tap`  
**Push:** not done (handoff only)

## What landed

### New birds (8) — coin unlock in Garage
| id | Label | Cost | Passive |
|----|-------|------|---------|
| mynah | Mynah | 45 | +4% coins |
| bulbul | Bulbul | 48 | Light flaps |
| cheel | Cheel | 70 | Soar near-miss |
| mor | Mor | 90 | +6% coins |
| kawwa | Kawwa | 42 | Street smart |
| kabootar | Kabootar | 38 | City glide |
| hoopoe | Hoopoe | 55 | Dusk bonus |
| falcon | Baaz | 85 | Dive bonus |

No licensed IP / trademarked cartoon names — desi theme only.

### New areas (6) — score milestone **or** coins
| id | Label | Cost | unlockScore |
|----|-------|------|-------------|
| canal | Canal | 48 | 130 |
| hunza | Hunza | 55 | 140 |
| gwadar | Gwadar | 50 | 150 |
| quetta | Quetta Bazaar | 55 | 160 |
| monsoon | Monsoon Fields | 52 | 170 |
| oldcity | Old City Rooftops | 58 | 180 |

Milestones auto-unlock via `checkEnvMilestones` (same as older cities). Palettes + obstacle pools + sky silhouettes wired so areas are not blank.

### Seasonal packs (4) — **offline only**
Unlock when **device local date** is in window **OR** best score ≥ milestone. Once unlocked, hats + trails stay forever (persisted in `flappy-tap:unlocked-seasonals` + hat/trail sets).

| Pack | Hat | Trail | Date windows (local) | Milestone |
|------|-----|-------|----------------------|-----------|
| independence (Azadi) | ind_topi | ind_trail | Aug 10–20 | 75 |
| eid (Eid Sparkle) | eid_sparkle | eid_trail | Mar 15–31, Apr 1–15, Jun 1–25 | 100 |
| winter (Winter Shawl) | winter_shawl | winter_trail | Dec–Jan all, Feb 1–15 | 60 |
| basant (Basant Kites) | basant_pagri | basant_trail | Feb 1–28 | 80 |

Collection Album → **Seasonals** section. Garage shows seasonal hats/trails as 📅 Seasonal when locked.

## Migration
- New bird/env/hat/trail/seasonal ids start **locked** until earned.
- Existing saves untouched; `parseSet` ignores unknown ids gracefully and always keeps free starters.

## Out of scope (unchanged)
Multiplayer, accounts, live/server seasons, real AdMob SDK.

## Verify
```bash
npm run check
npm run smoke
npm run build:web
```

## Key paths
- `js/skins.js` — BIRDS / ENVS / HATS / TRAILS / SEASONAL_PACKS / draw / palettes
- `js/storage.js` — unlock maps, `checkSeasonalUnlocks`, env milestones
- `js/game.js` — sky silhouettes, trail colors, Collection Seasonals, tryUnlock seasonal
- `index.html` — Guide EN/RU/Urdu + version tag
- `sw.js` — cache bump
- `STATUS.md` · this `HANDOFF.md`
