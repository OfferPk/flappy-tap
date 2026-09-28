# HANDOFF — Urr Jaa! 3.9.0-urrjaa (3D anim + relaxed feel)

**Status:** READY_FOR_QA  
**Version:** 3.9.0-urrjaa  
**SW:** urrjaa-v18-20260928  
**Live:** https://offerpk.github.io/flappy-tap/  
**Path:** `/workspace/games/flappy-tap`

## What landed (3.9.0)
1. Pseudo-3D — stronger independent wing flap, moveable head bob/tilt, mouth open/close (chirp on tap / CLOSE / gift / LUCKY)
2. Vehicles keep secondary motion (wheel spin + bob)
3. Relaxed feel — smaller body hitbox, more corner/LUCKY grace, larger early gaps, slower first ~18s ramp, first 5 runs stronger protect, larger coin/gift pickup
4. Hard / Challenge / One Life slightly less brutal (still stricter than Classic)
5. Hitbox still body-only (wings/hats/mouth ignored)
6. KEEP all ≤3.8 (skins Jungle/Mountains/Sea, Mystery 7s spin, Guide, voice, modes, etc.)

## Verify
```bash
npm run check && npm run smoke && npm run build:web && npm run pack:windows
```

## Key paths
- `js/skins.js` — mouthOpen / headBob / stronger drawWing; smaller hitbox()
- `js/game.js` — HITBOX_INSET / CORNER_TOL / phase ease / triggerChirpMouth
- `js/audio.js` — `chirp(kind)`
- `sw.js` — `urrjaa-v18-20260928`
