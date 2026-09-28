# HANDOFF — Urr Jaa! 3.12.0-urrjaa (missions/weather/power/garage/combo/perf)

**Status:** READY_FOR_QA  
**Version:** 3.12.0-urrjaa  
**SW:** urrjaa-v21-20260928  
**Live:** https://offerpk.github.io/flappy-tap/  
**Path:** `/workspace/games/flappy-tap`

## What landed (3.12.0) — different pack from 3.11
1. Daily mission variety + streak juice
2. Weather: fog wisps, rain splash, storm flash
3. Power-ups: glow/labels, pickup FX, HUD countdowns
4. Garage: theme/seasonal filters + badges
5. Combo x5 juice · pause tip/stats · settings groups
6. Perf: particleBudget · touch debounce
7. KEEP ≤3.11

## Verify
```bash
npm run check && npm run smoke && npm run build:web && npm run pack:windows
```
