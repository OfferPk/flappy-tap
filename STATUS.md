# STATUS — Urr Jaa! v3.8.0-urrjaa

**Path:** `/workspace/games/flappy-tap` (repo OfferPk/flappy-tap; UI title **Urr Jaa!**)
**Owner:** Mia Smith
**Updated:** 2026-09-28 ~18:45 Asia/Karachi (PKT)
**Version:** **3.8.0-urrjaa**
**SW cache:** `urrjaa-v17-20260928`
**Capacitor appId:** `com.offerpk.urrjaa`

## Sync
- Local was already on `origin/main` @ `efec193` (3.7.0) — no Factory remote commits to merge before 3.8.0 work.

## ADD — v3.8.0 theme skins + 7s Mystery spin (keeps all ≤3.7 systems)
- [x] Theme birds: **Jungle wali**, **Mountains wali**, **Sea wali** (pseudo-3D art + mild passives)
- [x] Matching vehicles: **Leafy Rickshaw**, **Snow Bike**, **Sea Boat** + vehicleTheme accents when themed bird equipped
- [x] Unlock: Best score gate **or** coins — clear garage hints (`Best N+ or X 🪙`); auto-unlock on score milestones
- [x] Deeper pseudo-3D polish (wing feathers, head specular/neck join)
- [x] Mystery wheel: Spin once **~7s** smooth decelerate, grant coins **after** land; Spin all sequential (7s if 1, shorter if many)
- [x] Hitboxes unchanged; no countdown on normal play
- [x] SW `urrjaa-v17-20260928`

### Unlock conditions (new)
| Skin | Score free | Or coins |
|------|------------|----------|
| Jungle wali | Best ≥ 50 | 55 🪙 |
| Mountains wali | Best ≥ 70 | 65 🪙 |
| Sea wali | Best ≥ 60 | 60 🪙 |
| Leafy Rickshaw | Best ≥ 50 | 48 🪙 |
| Snow Bike | Best ≥ 70 | 52 🪙 |
| Sea Boat | Best ≥ 60 | 50 🪙 |

### Ship
- [x] `npm run check` + `npm run smoke` + build:web + pack:windows
- [ ] push main · Pages · release zip — **BLOCKED:** `GH_TOKEN`/`GITHUB_TOKEN` both 401 Unauthorized (need valid PAT with `repo` scope)

## How to open
```bash
cd /workspace/games/flappy-tap
npx --yes serve -l 4174 .
# → http://localhost:4174
```
