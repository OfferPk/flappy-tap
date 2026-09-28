# HANDOFF — Urr Jaa! 3.5.3-urrjaa (IMPROVE ship hygiene)

**Status:** READY_FOR_QA (build-web fix delta)
**Version:** 3.5.3-urrjaa
**SW:** urrjaa-v15-20260928
**Prior gate:** v3.5.2 QA PASS + Security PASS_WITH_NOTES — CLEAR for 3.5.2
**Live (after Pages deploy):** https://offerpk.github.io/flappy-tap/
**Local:** `/workspace/factory/projects/flappy-tap`
**Push:** not done (Master must re-QA this delta before publish)

## What landed (3.5.3 improve)

1. **GitHub Pages static-hosting hygiene**
   - `scripts/build-web.js` preserves an existing `docs/.nojekyll` during the rmrf/rebuild
   - The build always writes an empty `docs/.nojekyll`, so the marker survives even if absent before the build
   - `www/` behavior is unchanged
2. **No gameplay/collection change**
   - This patch only hardens the web build/publish path

## Gate and ship prerequisite

- Prior **v3.5.2 QA PASS** and **Security PASS_WITH_NOTES — CLEAR for 3.5.2** remain recorded.
- This 3.5.3 build-web delta is **READY_FOR_QA**.
- `docs/.nojekyll` must remain present after `npm run build:web` before Pages publish.
- No release tags amended and no GitHub push performed.

## Verify

```bash
npm run build:web
 test -f docs/.nojekyll
npm run check
npm run smoke
```

## Key paths

- `scripts/build-web.js` — `.nojekyll` preservation and write-after-build
- `sw.js` — `urrjaa-v15-20260928`
- `package.json` — `3.5.3-urrjaa`
- `STATUS.md` · this `HANDOFF.md`
