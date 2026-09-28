# SECURITY REPORT — Urr Jaa! (flappy-tap) v3.5.1-urrjaa

**Role:** Security Reviewer (Olivia factory)  
**Date:** 2026-09-28 ~17:40 Asia/Karachi (PKT)  
**Path reviewed:** `/workspace/factory/projects/flappy-tap` (on-disk canonical: root `js/`, `index.html`, `sw.js`)  
**Version:** **3.5.1-urrjaa** (package.json / STATUS / HANDOFF; Git HEAD may still read 3.5.0 — review used uncommitted 3.5.1 sources)  
**SW cache:** `urrjaa-v13-20260928`  
**Scope:** Collection depth (skins/storage XSS, seasonal client logic, AdMob/secrets, SW cache, network surface)  
**Gate:** `/workspace/factory/shared/security/RELEASE_GATE.md`  
**Actions:** Report only — **no product code edits**, **no git push**

---

## Verdict: **PASS_WITH_NOTES**

**Sign-off:** **CLEAR** (QA / continue ship pipeline allowed)

**Ship blockers:** **None**

No HIGH XSS on v3.5.1 collection/garage/seasonal surfaces (labels use `textContent` + catalog allowlists). One pre-existing **MEDIUM** stored-DOM XSS path exists in Missions UI (`innerHTML` + unallowlisted `missions-active` fallback). Offline, no accounts/servers; exploit requires same-origin `localStorage` write (e.g. DevTools or another page on shared `offerpk.github.io` origin). Tracked as a hardening note — fix recommended before/with next patch, not a collection-depth FAIL.

---

## Executive summary

| Focus | Result |
|-------|--------|
| 1. Skins/storage XSS (garage/collection/missions) | Collection + garage **safe** (`textContent` / createElement). Missions **MEDIUM** (`innerHTML` + storage id fallback). |
| 2. Seasonal date logic | Client-only; device-local windows; ids allowlisted (`SEASONALS`); unlock persistence OK; no code injection via seasonal ids. |
| 3. Secrets / AdMob | Stubs only; null IDs; no keys in `capacitor.config.json`. |
| 4. PWA SW cache bump | `urrjaa-v13-20260928`; old caches deleted; precache same-origin relative assets. Runtime `cache.put` lacks same-origin guard (**LOW** note). |
| 5. Network / telemetry | No app `fetch`/XHR/beacon/analytics beyond SW cache-miss revalidate. |

`npm run check` PASS · `npm run smoke` PASS · `npm audit` N/A (no lockfile).

---

## Findings

### F1 — MEDIUM — Missions `innerHTML` can reflect crafted `localStorage` mission ids

**Where:**  
- `js/game.js:2520–2524` — `card.innerHTML` concatenates `m.label` and reward meta  
- `js/storage.js:675–679` — `getActiveMissionIds()` returns raw `missions-active` CSV (no pool allowlist when `length >= 3`)  
- `js/storage.js:694–695` — unknown id → `{ label: id, ... }` fallback  

**Issue:** If `flappy-tap:missions-date` is today’s key and `flappy-tap:missions-active` is set to e.g.  
`<img src=x onerror=…>,coins50,dodge20`,  
`getMissions()` uses the crafted string as `label`, and `refreshMissions()` injects it via `innerHTML`.

**Evidence (logic sim):** Payload appears inside generated HTML as a live `<img …>` node string.

**Why not HIGH / not FAIL:** No remote write path in-app; no accounts/cookies/secrets to steal from this app. Requires attacker-controlled write to this origin’s `localStorage`. On GitHub Pages, org sites share `offerpk.github.io` origin — elevates shared-origin risk slightly, still MEDIUM for this offline game.

**Remediation (for Engineer — do not applied in this review):**  
1. Allowlist active mission ids against `MISSION_POOL` in `getActiveMissionIds`.  
2. Prefer `textContent` / `createElement` in `refreshMissions` (never concatenate labels into HTML).  
3. Drop unknown-id label fallback or force a safe static label.

**v3.5.1 scope:** Pre-existing (missions ≤3.2); collection/seasonal paths added in 3.5.1 are not affected.

---

### F2 — LOW — SW runtime cache does not restrict to same-origin

**Where:** `sw.js:32–44`  

**Issue:** On cache miss, any successful GET is `cache.put`’d without checking `url.origin === self.location.origin`. Opaque cross-origin responses could theoretically be cached if the client ever requested them (classic SW cache-poisoning class).

**Mitigating:** App JS has **no** cross-origin `fetch`/XHR/Image beacons. Precache list is relative same-origin only. Activate deletes non-current cache names.

**Remediation:** Before `c.put`, skip non-GET, non-OK, opaque, or cross-origin responses; optionally cache-first only for precached paths.

---

### F3 — INFO — `npm audit` unavailable (no package-lock)

**Where:** project root  

**Issue:** `npm audit` fails with `ENOLOCK`. Dependencies are Capacitor 6.2.x only (`@capacitor/android`, `@capacitor/core`, CLI). Android/ios dirs gitignored; web game does not load Capacitor JS at runtime in PWA path.

**Remediation:** Add lockfile in a supply-chain hygiene pass; re-run audit before native store ships.

---

## Checklist (RELEASE_GATE + Master focus)

| # | Item | Status | Notes |
|---|------|--------|-------|
| 1 | Authn / sessions | N/A | Offline; no accounts |
| 2 | Authz / IDOR | N/A | Local unlocks only; cosmetic cheat ≠ remote |
| 3 | Secrets & config | **PASS** | No API keys; `.gitignore` has `.env`, keystores; `capacitor.config.json` appId only |
| 4 | API surface & rate limits | N/A | No app server |
| 5 | Injection (XSS focus) | **PASS_WITH_NOTES** | Collection/garage/seasonal OK; Missions MEDIUM (F1) |
| 6 | Uploads & file access | N/A | |
| 7 | Dependencies & supply chain | **NOTES** | Capacitor only; no lockfile / audit (F3) |
| 8 | Logging / leakage | **PASS** | No sensitive logging observed |
| 9 | Transport | **PASS** | Capacitor `androidScheme: https`, `allowMixedContent: false` |
| 10 | Admin / debug | **PASS** | No debug endpoints |
| M1 | Skins/storage XSS | **PASS_WITH_NOTES** | See F1; skins use textContent |
| M2 | Seasonal client-only | **PASS** | See below |
| M3 | AdMob stubs / no secrets | **PASS** | `js/ads.js` |
| M4 | SW cache bump safe | **PASS_WITH_NOTES** | F2 |
| M5 | No new network | **PASS** | SW-only fetch |

---

## Deep-dive notes (Master focus)

### Skins / garage / collection DOM

- `js/skins.js` `renderPicker` (~788–871): clears with `innerHTML = ''`, then `createElement` + **`label.textContent = item.label`** (catalog only). Seasonal locked hint: `textContent = '📅 Seasonal'`.  
- `js/game.js` `refreshCollection` (~2557–2641): summary/prog/`section()` all use **`textContent`**; labels built from `FTSkins.*` catalogs, not raw storage strings. Seasonals section uses `SEASONAL_PACKS` labels.  
- Unlock maps: `parseSet` allowlists against `BIRDS` / `VEHICLES` / `ENVS` / `HATS` / `TRAILS` / `SEASONALS` (`js/storage.js:117–125`, `91–93`). Unknown storage ids ignored.  
- `showToast` uses `textContent` (`game.js:237–239`) — seasonal unlock toasts safe even if ids joined.  
- Boards (`2666–2668`): labels hardcoded; values from numeric getters — safe.  
- Streak (`2679–2693`): numeric day + hardcoded reward glyphs — safe.  
- Ads stub modal (`ads.js:24–31`): static HTML shell; title/body set via **`textContent`**.

### Seasonal packs

- Catalog: `js/skins.js` `SEASONAL_PACKS` — independence / eid / winter / basant; hat+trail ids; `windows` + `milestoneScore`.  
- `seasonalInWindow` / `seasonalEligible`: device `Date` local month/day; OR score milestone. No server.  
- `unlockSeasonal`: rejects unless `SEASONALS[id]`; grants allowlisted hat/trail. Persists `flappy-tap:unlocked-seasonals`.  
- Cannot inject code via seasonal id strings: ids never flow into `innerHTML`; collection uses catalog labels + textContent.

### AdMob / secrets

- `js/ads.js`: `enabled: false`, `interstitialId`/`rewardedId` null; no `ca-app-pub-*`.  
- `capacitor.config.json`: `com.offerpk.urrjaa` only — no ad/plugin keys.  
- Repo secret scan: AdMob mentions are documentation/stub copy only.

### Service worker

- Cache name bumped to `urrjaa-v13-20260928`; activate deletes other cache keys; `skipWaiting` + `clients.claim`.  
- Precache: relative `./` assets only (HTML/CSS/JS/icons/manifest).  
- Fetch handler: GET only; cache-first then network; see F2.

### Network

- Grep of root `js/`, `index.html`, `sw.js`: sole `fetch` is SW miss path. No `sendBeacon`, XHR, gtag, WebSocket, firebase/supabase clients.

### Tooling

```
npm run check  → exit 0
npm run smoke  → SMOKE OK · Urr Jaa! 3.5.1-urrjaa
npm audit      → ENOLOCK (no package-lock.json)
```

### `.gitignore`

Ignores `node_modules/`, `android/`, `ios/`, `*.keystore`, `*.jks`, `.env`, `.env.*` (keeps `.env.example` pattern).

---

## Ship blockers

**None.**

Optional follow-ups (non-blocking for CLEAR): fix F1 Missions DOM construction; tighten SW `cache.put` origin checks (F2); add lockfile + audit (F3).

---

## Sign-off

| Field | Value |
|-------|-------|
| Verdict | **PASS_WITH_NOTES** |
| Sign-off | **CLEAR** |
| Ship blockers | None |
| Report path | `/workspace/factory/projects/flappy-tap/SECURITY-REPORT.md` |
| Reviewed by | Security Reviewer (executor) |
| Product edits | None |
| Git push | None |

Gate reference status mapping: CLEAR ≡ allowed to proceed; notes must be tracked for Engineer (F1 recommended before broad Pages publish on shared org origin).


---

## Follow-up — F1 closed (v3.5.2-urrjaa · 2026-09-28 ~17:55 PKT)

**Engineer / Improver:** Missions XSS remediation shipped in **3.5.2-urrjaa**.

| Item | Status |
|------|--------|
| F1 MEDIUM Missions innerHTML + unallowlisted ids | **CLOSED** |
| getActiveMissionIds allowlist vs MISSION_POOL / DAILY_MISSION_IDS | Done — unknown ids dropped; storage rewritten |
| refreshMissions createElement + textContent | Done — no label HTML concat; bar width via style.width |
| Unknown-id fallback | Static label Mission (not raw id) |

Prior verdict PASS_WITH_NOTES remains historical for 3.5.1; F1 no longer open for 3.5.2+. F2 (SW same-origin) unchanged LOW. Re-review optional with next Security pass on improve delta.
