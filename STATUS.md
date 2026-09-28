# STATUS — Urr Jaa! v3.1.0-urrjaa

**Path:** `/workspace/games/flappy-tap` (repo OfferPk/flappy-tap; UI title **Urr Jaa!**)  
**Owner:** Mia Smith  
**Updated:** 2026-09-28 ~15:45 Asia/Karachi (PKT)  
**Version:** **3.1.0-urrjaa**  
**SW cache:** `urrjaa-v6-20260928`  
**Capacitor appId:** `com.offerpk.urrjaa`

## OWNER COMPLETE ✅

### Core (kept)
- [x] FLY→DODGE→COINS→COMBO→POWER-UP→RECORD→UNLOCK→TRY AGAIN
- [x] Tap→flap, gravity, obstacles, score, death · NO countdown · 2s learn
- [x] Pakistani birds/vehicles/cities · ads stubs · pause/settings

### ADD — v3.1.0
- [x] Modes: Classic · Time Attack 60s · Hard · No Coin · Challenge stages · One Life (+ Daily/Practice)
- [x] Local leaderboards: PB / Today / All-Time / Distance / Combo (+ mode bests)
- [x] Near-miss CLOSE! · 3× consecutive → RISKY x3 score mult
- [x] Rare power-ups: Shield · Turbo · Coin Magnet · Slow-mo 3s · Ghost
- [x] Daily streak Day1–7 → coins → mystery → rare skin
- [x] Accessories: sunglasses, cap, hat, helmet, scarf · trails fire/star/smoke/rainbow
- [x] Desi voice cues: Oye hoye, Bach ke, Wah ji wah, Kya udaan, Haye oye, Shabaash
- [x] Dynamic traffic escalate rickshaw/cycle→bike→taxi→bus→truck · dual cross
- [x] Special areas: City, Bridge, Mountains, Village, Rain, Night, Desert
- [x] Collection Book counters birds/vehicles/accessories/trails
- [x] One Life: 1 attempt · Bronze100/Silver300/Gold500/Legend1000

### Juice (priority)
- [x] Flap squash · coin pop particles · near-miss sparks · death flash+shake
- [x] Score pop floats · combo/RISKY banners · forgiving hitbox · richer SFX

### Ship
- [x] Offline PWA (`urrjaa-v6-20260928`)
- [x] `www/` + `docs/` + `dist/urr-jaa-web-windows.zip`
- [x] `npm run check` + `npm run smoke`
- [x] No git push · no secrets

## Out of scope ⏳
- [ ] Real AdMob + production IDs
- [ ] Signed APK/AAB
- [ ] GitHub Pages / release upload — **parent agent**

## How to open

```bash
cd /workspace/games/flappy-tap
npx --yes serve -l 4174 .
# → http://localhost:4174
```

Windows: extract `dist/urr-jaa-web-windows.zip` → `PLAY-WINDOWS.bat`.
