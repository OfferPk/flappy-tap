# QA REPORT — Urr Jaa! / flappy-tap v3.5.2-urrjaa (improve delta)

**To:** Master / publish gate  
**From:** QA Bug Hunter (independent)  
**When:** 2026-09-28 17:51 PKT  
**Path:** `/workspace/factory/projects/flappy-tap`  
**Handoff:** `HANDOFF.md` · `STATUS.md` · inbox `IMPROVE-flappy-tap-20260928-1745.md`  
**Prior QA:** `QA-REPORT-v3.5.1.md` PASS (collection depth — not re-litigated)  
**Scope:** REPORT ONLY — no product code changes, no GitHub push, no agent messages  

## Git state (working tree under test)

| Item | Value |
|------|-------|
| **HEAD** | `c91ba1f` — `fix(pages): add docs/.nojekyll so GitHub Pages skips Jekyll` (2026-09-28 17:41 PKT) |
| **Branch** | `main` (tracks `origin/main`) |
| **Dirty** | **Yes** — uncommitted 3.5.2 delta (root + `www/` + `docs/`: `index.html`, `js/game.js`, `js/storage.js`, `sw.js`, `css/style.css`, `package.json`, `scripts/smoke.js`, STATUS/HANDOFF/README/SECURITY-REPORT, etc.) |
| **Note** | `docs/.nojekyll` deleted in working tree vs HEAD (see residual) |

## Verdict: **PASS** — CLEAR from QA

Master verify items hold. No P0/P1 ship blockers for this improve delta.

---

## Master verify

### 1) Missions XSS harden (Security F1) — **PASS**

| Check | Evidence |
|-------|----------|
| Allowlist | `js/storage.js` `getActiveMissionIds` (~675–688): `allowed` = `MISSION_POOL` ids ∪ `DAILY_MISSION_IDS`; `raw.filter(allowed.has)`; junk dropped; storage rewritten when first-3 differ; if `<3` valid → re-pick daily |
| DOM hygiene | `js/game.js` `refreshMissions` (~2591–2640): `missionsList.innerHTML = ''` then `createElement`; `title.textContent = m.label \|\| 'Mission'`; meta via `textContent`; bar `fill.style.width = pct + '%'` (numeric clamp) — **no label HTML concat** |
| Fallback label | `getMissions` (~704): `missionDef(id) \|\| { … label: 'Mission' … }` — static **Mission**, not raw id |
| Logic sim | Payload id `<img src=x onerror=…>` filtered out; not kept in active set |
| Docs | `SECURITY-REPORT.md` follow-up: F1 **CLOSED** for 3.5.2 |

### 2) Run Summary Share — **PASS**

| Check | Evidence |
|-------|----------|
| Button | `index.html` `#btn-share` on `#screen-death` (~167); wired `btnShare` → `shareRunSummary` (`game.js` ~2380) |
| Text | `buildShareText` (~885–892): `Urr Jaa! — score N · best B` or with `(Mode)` when `playMode !== 'classic'` (`MODE_SHARE_LABELS`) |
| Path | `navigator.share` → catch → clipboard / `execCommand` + `showToast('Copied share text')`; no network — offline OK |

### 3) Home A2HS tip — **PASS**

| Check | Evidence |
|-------|----------|
| Placement | `#a2hs` inside `#screen-start` only (`index.html` ~56–59); EN “Add to Home Screen” + Roman Urdu `Home screen par add karein…` |
| Dismiss | `sessionStorage` key `urrjaa:a2hs` (`A2HS_SESSION_KEY`); OK button sets `'1'` and hides tip |
| Visibility | `updateA2hsTip`: hidden if dismissed or `#screen-start` hidden; called from `showMenu` — tip rides home panel (hidden off home with parent). No `beforeinstallprompt` required |
| CSS | `.a2hs` / `.a2hs[hidden]` / `.a2hs-ur` in `css/style.css` |

### 4) Docs / version / SW — **PASS**

| Claim | Result |
|-------|--------|
| README local path | **PASS** — `cd /workspace/factory/projects/flappy-tap` |
| STATUS | **PASS** — prior v3.5.1 CLEAR + improve delta **READY_FOR_QA**; SW `urrjaa-v14-20260928` |
| SW cache | **PASS** — root / `www/` / `docs/` `sw.js` = `urrjaa-v14-20260928` |
| package version | **PASS** — `3.5.2-urrjaa` |
| Tagline | **PASS** — `v3.5.2-urrjaa` in index (root/www/docs) |

### 5) Gates — **PASS**

```
npm run check   → exit 0 (node --check all js/*.js)
npm run smoke   → SMOKE OK · Urr Jaa! 3.5.2-urrjaa
```

`www/` + `docs/` already synced for 3.5.2 markers (share, a2hs, SW v14, version) — did **not** re-run `build:web` (artifacts present; re-run would again wipe `docs/.nojekyll`).

Optional HTTP smoke (`python3 -m http.server` on free ports): `index.html` 200 with `#btn-share`, `#a2hs`, version string; `sw.js` CACHE `urrjaa-v14-20260928`.

---

## Claim confirmations (3.5.2 delta)

| Claim | Result | Evidence |
|-------|--------|----------|
| F1 closed | **PASS** | allowlist + textContent + static Mission |
| Share on death | **PASS** | `#btn-share` + `shareRunSummary` |
| A2HS home tip | **PASS** | EN+RU, session dismiss, home-only |
| No new birds/areas/seasonals | **PASS** (light) | IMPROVE/STATUS/HANDOFF scope; not re-audited collection depth |
| Ads stubs | **PASS** (kept) | out of delta; unchanged intent |
| SW v14 + 3.5.2 | **PASS** | package / sw / smoke / index |

---

## Script / build results

| Script | Result |
|--------|--------|
| `npm run check` | PASS (exit 0) |
| `npm run smoke` | PASS — `SMOKE OK · Urr Jaa! 3.5.2-urrjaa` |
| `npm run build:web` | Not re-run; existing `www/` + `docs/` match 3.5.2 (see residual on `.nojekyll`) |

---

## Residuals (non-blocking for this delta CLEAR)

- **P0/P1:** none for Master verify items.  
- **P2 — `docs/.nojekyll` missing after `build:web`:** HEAD `c91ba1f` added it for Pages; working tree shows `D docs/.nojekyll` because `scripts/build-web.js` `rmrf(docs)` and only preserves `*-web-windows.zip`. **Restore `.nojekyll` (or extend preserveGlobs) before GitHub Pages publish** or Pages may fail Jekyll again.  
- Push / Pages live deploy **not done** (handoff intentional).  
- Security **F2** (SW runtime cache same-origin) still LOW / open — out of this improve scope.

---

## CLEAR from QA?

**YES** — CLEAR for Master ship gate on improve delta **v3.5.2-urrjaa** (commit dirty tree as-audited; pending push/Pages + `.nojekyll` restore outside this QA).

**Report path:** `/workspace/factory/projects/flappy-tap/QA-REPORT-v3.5.2.md`
