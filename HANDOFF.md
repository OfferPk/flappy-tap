# HANDOFF — Urr Jaa! 3.11.0-urrjaa (Classic feel + 3D + Mystery/juice polish)

**Status:** READY_FOR_QA  
**Version:** 3.11.0-urrjaa  
**SW:** urrjaa-v20-20260928  
**Live:** https://offerpk.github.io/flappy-tap/  
**Path:** `/workspace/games/flappy-tap`

## What landed (3.11.0)
1. **Classic feel** — roomier early gaps, softer gravity/inset, stronger LUCKY center recover; Hard/Challenge/One Life stay strict
2. **Richer 3D** — independent wing lag + tip flutter, blink, tail wag, vehicle lean + exhaust puffs
3. **Mystery polish** — history rarity badges (WIN→JACKPOT), land pulse/glow, Back disabled mid-spin
4. **Juice** — PERFECT stars, death confetti, toast kinds (perfect/medal), run grade S–E + flight time, menu Play pulse / logo shimmer
5. **Guide** — tiny EN / Roman Urdu / Urdu notes for feel + grade
6. KEEP all ≤3.10 features

## Verify
```bash
npm run check && npm run smoke && npm run build:web && npm run pack:windows
```

## Key paths
- `js/game.js` — classicPhaseMods, cosmeticsOpts, runGradeFor, spinRarity*, particles
- `js/skins.js` — drawWing tipFlutter, eyeBlink, tailWag, vehLean
- `css/style.css` — run-grade, spin-hist-badge, logo-shimmer, btn-play-pulse
- `sw.js` — `urrjaa-v20-20260928`
