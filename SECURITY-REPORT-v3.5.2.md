# SECURITY REPORT — Urr Jaa! (flappy-tap) v3.5.2-urrjaa

**Role:** Security Reviewer (Olivia factory)  
**Date:** 2026-09-28 ~17:50 Asia/Karachi (PKT)  
**Path reviewed:** `/workspace/factory/projects/flappy-tap` (canonical: root `js/`, `index.html`, `sw.js`; `www/`/`docs/` are build copies)  
**Version:** **3.5.2-urrjaa** (package.json / STATUS / HANDOFF; uncommitted working tree on top of 3.5.1)  
**SW cache:** `urrjaa-v14-20260928`  
**Prior:** v3.5.1 `SECURITY-REPORT.md` — **PASS_WITH_NOTES**; F1 Missions XSS was **MEDIUM**  
**Scope:** IMPROVE delta — Missions XSS close-out, Share, A2HS tip, SW bump, ads stubs  
**Gate:** `/workspace/factory/shared/security/RELEASE_GATE.md`  
**Actions:** Report only — **no product code edits**, **no git push**  
**This file:** `SECURITY-REPORT-v3.5.2.md` (does **not** overwrite `SECURITY-REPORT.md`)

---

## Verdict: **PASS_WITH_NOTES**

**Sign-off:** **CLEAR** (QA / continue ship pipeline allowed)

**Ship blockers:** **None**

**F1 closed?** **yes** — Missions allowlist + `createElement`/`textContent` closes the v3.5.1 MEDIUM stored-DOM XSS path (evidence below).

Remaining notes are non-blocking: **F2** SW runtime `cache.put` still lacks same-origin guard (**LOW**, carried); **F3** no lockfile / `npm audit` N/A (**INFO**, carried).

---

## Executive summary

| Focus | Result |
|-------|--------|
| 1. Missions F1 close-out | **CLOSED** — allowlist + DOM hygiene + static unknown label |
| 2. Share XSS | **PASS** — plain-text share/clipboard; toast via `textContent` |
| 3. A2HS tip | **PASS** — static HTML; `sessionStorage` `urrjaa:a2hs`; home-only; no BIP; no network |
| 4. SW bump | **PASS_WITH_NOTES** — `urrjaa-v14-20260928`; old caches deleted; F2 still open |
| 5. Secrets / ads | **PASS** — stubs only; null IDs; no keys |

`npm run check` PASS · `npm run smoke` PASS (`SMOKE OK · Urr Jaa! 3.5.2-urrjaa`) · `npm audit` ENOLOCK (no package-lock).

---

## F1 — CLOSED (was MEDIUM) — Missions XSS

### Prior issue (v3.5.1)
- `refreshMissions` used `card.innerHTML` with `m.label` concat  
- `getActiveMissionIds` could return raw `missions-active` CSV when length ≥ 3  
- Unknown id → `{ label: id }` reflected into HTML  

### Remediation verified (v3.5.2)

| Check | Evidence | Status |
|-------|----------|--------|
| Allowlist vs `MISSION_POOL` / `DAILY_MISSION_IDS` | `js/storage.js:675–688` — `allowed = Set(MISSION_POOL ids)` + `DAILY_MISSION_IDS`; `raw.filter(id => allowed.has(id))`; rewrite storage when junk dropped; else re-pick daily | **PASS** |
| `refreshMissions` DOM hygiene | `js/game.js:2591–2640` — `missionsList.innerHTML = ''` only; cards via `createElement`; `title.textContent = m.label \|\| 'Mission'`; meta/btn `textContent`; **no** `card.innerHTML` / label HTML concat | **PASS** |
| Unknown-id label | `js/storage.js:704` — fallback `{ label: 'Mission', ... }` (static), not raw id | **PASS** |
| Progress bar width | `js/game.js:2597–2608` — `pct` from `Number(progress)/Number(target)` clamped 0–100; `fill.style.width = pct + '%'` | **PASS** |

**Logic sim (attacker CSV):**  
Input `missions-active` = `<img src=x onerror=alert(1)>,coins50,dodge20` → allowlist drops the payload tag; filtered = `['coins50','dodge20']` (&lt; 3) → re-pick from `DAILY_MISSION_IDS` only. Payload never reaches DOM.

**Defense in depth:** Even if an unexpected id reached `getMissions`, label is static `"Mission"` and rendered with `textContent`.

---

## Focus 2 — Share XSS — PASS

**Where:** `js/game.js` `buildShareText` / `shareRunSummary` / `copyShareText` / `showToast` (~885–931, 238–246); `#btn-share` on death screen (`index.html`).

| Check | Result |
|-------|--------|
| Text construction | Numeric `score` + `getBest()` + allowlisted `MODE_SHARE_LABELS[playMode]` (fallback `playMode` string only) — plain text template |
| `navigator.share` | `{ title: 'Urr Jaa!', text }` — Web Share API text, not HTML |
| Clipboard fallback | `clipboard.writeText` / `textarea.value` + `execCommand('copy')` — no DOM HTML injection |
| Toast | `showToast('Copied share text')` → `toastEl.textContent` |
| Network | No fetch/XHR/beacon from share path |

No HTML injection surface for share payload.

---

## Focus 3 — A2HS tip — PASS

**Where:** `index.html:56–58` `#a2hs` inside `#screen-start`; `js/game.js` `updateA2hsTip` / dismiss (~933–946, 2381–2387); `css/style.css` `.a2hs`.

| Check | Result |
|-------|--------|
| Content | Static EN + Roman Urdu tip in HTML (no user/storage string into tip body) |
| Dismiss | `sessionStorage` key `urrjaa:a2hs` = `'1'`; try/catch for private mode |
| Home-only | Tip nested under `#screen-start`; `updateA2hsTip` sets `hidden` when start screen hidden; called from `showMenu` |
| `beforeinstallprompt` | **Not used** (grep clean) |
| Network | None |

---

## Focus 4 — SW bump — PASS_WITH_NOTES (F2 open)

**Where:** root `sw.js` (mirrored in `www/sw.js`, `docs/sw.js`).

| Check | Result |
|-------|--------|
| Cache name | `CACHE = 'urrjaa-v14-20260928'` |
| Activate | Deletes all cache keys ≠ current; `clients.claim` |
| Precache | Relative same-origin assets only (`./`, HTML/CSS/JS/icons/manifest) |
| Install | `skipWaiting` |
| F2 | **Still open (LOW)** — fetch miss path `cache.put(req, copy)` without `url.origin === self.location.origin` / opaque skip (`sw.js:32–44`) |

**Mitigating (unchanged):** App JS has no cross-origin `fetch`/XHR/Image beacons; precache is relative. Carry F2 for Engineer — not a ship blocker.

---

## Focus 5 — Secrets / ads — PASS

- `js/ads.js`: `enabled: false`, `interstitialId`/`rewardedId` null; stub modal shell is static HTML; title/body via `textContent`  
- `capacitor.config.json`: `com.offerpk.urrjaa` only — no AdMob/plugin keys  
- Repo secret scan: no `ca-app-pub-*`, API keys, tokens, passwords in canonical sources (README documents stubs only)

---

## Other surfaces (spot-check)

| Surface | Notes |
|---------|--------|
| Boards `innerHTML` | Hardcoded labels + numeric `getLeaderboards()` values — unchanged safe pattern |
| Streak `innerHTML` | Numeric day + catalog `STREAK_REWARDS` glyphs — safe |
| Collection / garage | Prior v3.5.1: `textContent` + catalog allowlists — not regressed by this delta |
| Network | No app `fetch`/XHR/`sendBeacon`/analytics in root `js/` + `index.html` (SW miss fetch only) |

---

## Findings summary

| ID | Severity | Status | Summary |
|----|----------|--------|---------|
| F1 | MEDIUM | **CLOSED** (v3.5.2) | Missions allowlist + `textContent` / `createElement` |
| F2 | LOW | **OPEN** (carry) | SW runtime `cache.put` no same-origin / opaque guard |
| F3 | INFO | **OPEN** (carry) | No `package-lock.json`; `npm audit` ENOLOCK |

---

## Checklist (RELEASE_GATE + Master focus)

| # | Item | Status | Notes |
|---|------|--------|-------|
| 1 | Authn / sessions | N/A | Offline; no accounts |
| 2 | Authz / IDOR | N/A | Local unlocks only |
| 3 | Secrets & config | **PASS** | Ads stubs; no keys |
| 4 | API surface | N/A | No app server |
| 5 | Injection (XSS) | **PASS** | F1 closed; share/A2HS safe |
| 6 | Uploads & files | N/A | |
| 7 | Dependencies | **NOTES** | Capacitor 6.2.x; F3 |
| 8 | Logging / leakage | **PASS** | |
| 9 | Transport | **PASS** | `androidScheme: https`, `allowMixedContent: false` |
| 10 | Admin / debug | **PASS** | |
| M1 | Missions F1 | **CLOSED** | Allowlist + DOM hygiene |
| M2 | Share XSS | **PASS** | Plain text + textContent toast |
| M3 | A2HS tip | **PASS** | Static; session dismiss; home-only |
| M4 | SW bump | **PASS_WITH_NOTES** | v14; F2 open |
| M5 | Ads / secrets | **PASS** | Stubs |

---

## Tooling

```
npm run check  → exit 0
npm run smoke  → SMOKE OK · Urr Jaa! 3.5.2-urrjaa
npm audit      → ENOLOCK (no package-lock.json)
```

---

## Ship blockers

**None.**

Optional follow-ups (non-blocking): tighten SW `cache.put` same-origin/opaque checks (**F2**); add lockfile + `npm audit` (**F3**).

---

## Sign-off

| Field | Value |
|-------|-------|
| Verdict | **PASS_WITH_NOTES** |
| Sign-off | **CLEAR** |
| Ship blockers | None |
| F1 closed | **yes** |
| Report path | `/workspace/factory/projects/flappy-tap/SECURITY-REPORT-v3.5.2.md` |
| Prior history | `SECURITY-REPORT.md` kept (v3.5.1) |
| Reviewed by | Security Reviewer (executor) |
| Product edits | None |
| Git push | None |

Gate: CLEAR ≡ allowed to proceed; F2/F3 notes tracked for Engineer (non-blocking for this offline PWA improve delta).
