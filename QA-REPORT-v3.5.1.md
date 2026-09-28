# QA REPORT — Urr Jaa! / flappy-tap v3.5.1-urrjaa (collection depth)

**To:** Master / publish gate  
**From:** QA Bug Hunter (independent)  
**When:** 2026-09-28 17:37 PKT  
**Path:** `/workspace/factory/projects/flappy-tap`  
**Handoff:** `HANDOFF.md` · `STATUS.md` · `README.md`  
**Scope:** REPORT ONLY — no product code changes, no GitHub push, no agent messages  

## Verdict: **PASS** — CLEAR from QA

Master items hold. No P0/P1 ship blockers found.

---

## Master verify

### 1) Collection unlocks offline (coins / milestones / date windows) — **PASS**

| Path | Evidence |
|------|----------|
| **Birds (coins)** | 8 new birds in `js/skins.js` BIRDS with costs (kabootar 38 … mor 90). Garage `tryUnlock` (`js/game.js` ~2388) spends coins via `FTStorage.spendCoins` → `unlockBird`. Defaults locked until earned (`parseSet` + always `sparrow` only). |
| **Areas (coins OR score)** | 6 new ENVS with `cost` + `unlockScore` 130–180. Auto via `checkEnvMilestones` (`js/storage.js` 938–954): canal@130 … oldcity@180. Coin path in `tryUnlock` when score gate not met. |
| **Seasonals (date OR milestone)** | 4 packs in `SEASONAL_PACKS`; `seasonalEligible` = local calendar window **OR** `milestoneScore`. `checkSeasonalUnlocks` persists to `flappy-tap:unlocked-seasonals` and grants hat+trail forever. Node logic sim: Aug14→independence; winter@60 yes / @59 no; eid date+milestone OK. |

### 2) No live-ops dependency for core collection — **PASS**

- Collection state: `localStorage` only (`flappy-tap:*` keys).  
- `js/storage.js`, `js/skins.js`, `js/game.js`: **no** `fetch` / XHR / WebSocket / firebase / supabase for unlocks.  
- Seasonals explicitly offline (device `Date` + best score). HANDOFF/STATUS: “no server seasons”.  
- Only network touch in tree: SW cache-miss `fetch` (normal PWA), not collection gating.

### 3) GUIDE ok — **PASS**

`index.html` Guide EN / Roman Urdu / Urdu (`screen-guide`, tabs en/ru/ur):

- Collection birds/areas called out (EN/RU name examples; UR generic).  
- **Seasonals (offline):** Azadi / Eid / Winter / Basant — local date or score; no server seasons (all 3 langs).  
- Smoke asserts `Seasonals (offline)` + guide screen/tabs.

### 4) smoke / check scripts pass — **PASS**

```
npm run check   → exit 0 (node --check all js/*.js)
npm run smoke   → SMOKE OK · Urr Jaa! 3.5.1-urrjaa
npm run build:web → Built web assets → www/ and docs/
```

---

## Claim confirmations

| Claim | Result | Evidence |
|-------|--------|----------|
| +8 birds | **PASS** | mynah, bulbul, cheel, mor, kawwa, kabootar, hoopoe, falcon — costs + passives + colors + draw accents |
| +6 areas | **PASS** | canal, hunza, gwadar, quetta, monsoon, oldcity — unlockScore/cost + palettes + obstacle pools + sky silhouettes in game.js |
| 4 seasonal packs | **PASS** | independence (Azadi), eid, winter, basant — hat+trail each; Album **Seasonals** section |
| Ads stubs | **PASS** | `js/ads.js`: `enabled: false`, `rewardedId: null`, stub modal, no `ca-app-pub-*` |
| SW `urrjaa-v13-20260928` | **PASS** | root / `www/` / `docs/` `sw.js` CACHE match; package + tagline `3.5.1-urrjaa` |

---

## Script / build results

| Script | Result |
|--------|--------|
| `npm run check` | PASS (exit 0) |
| `npm run smoke` | PASS — `SMOKE OK · Urr Jaa! 3.5.1-urrjaa` |
| `npm run build:web` | PASS — refreshed `www/` + `docs/` |

---

## Residuals (non-blocking)

- **P0/P1:** none.  
- Push / GitHub Pages live deploy **not done** (handoff intentional). Live URL may lag until publish.  
- On **2026-09-28 PKT**, no seasonal **date** window is active (next windows: winter Dec+, etc.); milestone path still unlocks all packs offline — by design.  
- Guide Urdu collection line is shorter (no bird name list) — cosmetic/docs only, not a ship blocker.

---

## CLEAR from QA?

**YES** — CLEAR for Master ship gate on collection-depth v3.5.1-urrjaa (pending any separate publish/push step outside this QA).

**Report path:** `/workspace/factory/projects/flappy-tap/QA-REPORT-v3.5.1.md`
