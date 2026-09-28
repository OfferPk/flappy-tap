# STATUS — Urr Jaa! v3.9.0-urrjaa

**Path:** `/workspace/games/flappy-tap` (repo OfferPk/flappy-tap; UI title **Urr Jaa!**)
**Owner:** Mia Smith
**Updated:** 2026-09-28 ~19:05 Asia/Karachi (PKT)
**Version:** **3.9.0-urrjaa**
**SW cache:** `urrjaa-v18-20260928`
**Capacitor appId:** `com.offerpk.urrjaa`

## Sync
- Local matched `origin/main` @ `40f9058` (3.8.0 docs note) before 3.9.0 work — no remote merge needed.

## ADD — v3.9.0 deeper 3D + relaxed collision (keeps all ≤3.8 systems)
- [x] Wings flap stronger (amp/hz + tip lift); head tilt + bob; mouth open/close on chirp
- [x] Chirp SFX + mouth on tap / CLOSE / gift / LUCKY
- [x] Vehicles secondary motion kept (wheelRot / vehBob)
- [x] Smaller body hitbox (15×12 / veh 21×16); extra inset; CORNER_TOL 16; LUCKY cooldown 2s
- [x] Larger early gaps (BASE_GAP 186); first ~18s slow ramp; GAP shrink slower
- [x] firstRunProtect → first 5 runs, stronger gap/speed
- [x] Coin/gift/powerup pickup radius larger
- [x] Hard/Challenge/OneLife slightly eased
- [x] SW `urrjaa-v18-20260928`

### Ship
- [ ] `npm run check` + `npm run smoke` + build:web + pack:windows
- [ ] push main · tag v3.9.0-urrjaa · Pages · release zip

## How to open
```bash
cd /workspace/games/flappy-tap
npx --yes serve -l 4174 .
# → http://localhost:4174
```
