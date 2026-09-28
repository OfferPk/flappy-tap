# HANDOFF — Urr Jaa! 3.8.0-urrjaa (theme skins + 7s Mystery spin)

**Status:** READY_FOR_QA  
**Version:** 3.8.0-urrjaa  
**SW:** urrjaa-v17-20260928  
**Live:** https://offerpk.github.io/flappy-tap/  
**Path:** `/workspace/games/flappy-tap`

## What landed (3.8.0)
1. Theme skins — Jungle / Mountains / Sea birds + matching vehicles; score-or-coins unlock UI
2. Pseudo-3D polish — richer wing feathers, head depth; vehicle accents from bird theme
3. Mystery Rewards — Spin once ~7s decelerate into segment, **then** grant 444–999; Spin all sequential
4. Hitboxes unchanged; Classic no countdown; all ≤3.7 features kept

## Verify
```bash
npm run check && npm run smoke && npm run build:web && npm run pack:windows
```

## Key paths
- `js/skins.js` — theme birds/vehicles + unlock hints
- `js/storage.js` — BIRDS/VEHICLES maps, `checkThemeSkinMilestones`, `beginWheelSpin` / `grantSpinCoins`
- `js/game.js` — `SPIN_ONCE_MS`, tryUnlock score gates, vehicleTheme
- `sw.js` — `urrjaa-v17-20260928`
