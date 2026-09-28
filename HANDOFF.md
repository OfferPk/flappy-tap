# HANDOFF — Urr Jaa! 3.5.2-urrjaa (IMPROVE post–3.5.1)

**Status:** READY_FOR_QA (improve delta)  
**Version:** 3.5.2-urrjaa  
**SW:** urrjaa-v14-20260928  
**Prior:** v3.5.1 QA PASS + Security PASS_WITH_NOTES (F1 now closed)  
**Live (after Pages deploy):** https://offerpk.github.io/flappy-tap/  
**Local:** `/workspace/factory/projects/flappy-tap`  
**Push:** not done (handoff for re-QA)

## What landed (3.5.2 improve)

1. **Missions XSS (Security F1 closed)**  
   - `js/storage.js` `getActiveMissionIds` — allowlist vs `MISSION_POOL` + `DAILY_MISSION_IDS`; rewrite storage when junk dropped  
   - Unknown id fallback label: static **Mission** (never raw id into DOM)  
   - `js/game.js` `refreshMissions` — `createElement` + `textContent`; progress bar `style.width` numeric only  

2. **Run Summary Share**  
   - Death screen `#btn-share`  
   - Text: `Urr Jaa! — score N · best B` or with `(Mode)` when not Classic  
   - `navigator.share` → else clipboard + toast “Copied share text” · offline OK  

3. **Home A2HS tip**  
   - Inside `#screen-start` only (hidden with other panels)  
   - EN Add to Home Screen + Roman Urdu one-liner  
   - Dismiss: `sessionStorage` key `urrjaa:a2hs`  

4. **Docs** — STATUS / README path / this HANDOFF; patch bump + SW cache bump  

## Out of scope (unchanged)
New birds/areas/seasonals, real AdMob, accounts, live seasons, `todayKey` PKT force.

## Verify
```bash
npm run check
npm run smoke
npm run build:web
```

## Key paths
- `js/storage.js` — mission allowlist  
- `js/game.js` — refreshMissions DOM hygiene · shareRunSummary · updateA2hsTip  
- `index.html` — `#btn-share` · `#a2hs`  
- `css/style.css` — `.a2hs`  
- `sw.js` — `urrjaa-v14-20260928`  
- `STATUS.md` · this `HANDOFF.md`
