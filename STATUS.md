# STATUS — Urr Jaa! v3.0.0-urrjaa

**Path:** `/workspace/games/flappy-tap` (repo OfferPk/flappy-tap; UI title **Urr Jaa!**)  
**Owner:** Mia Smith  
**Updated:** 2026-09-28 ~15:15 Asia/Karachi (PKT)  
**Version:** **3.0.0-urrjaa**  
**SW cache:** `urrjaa-v5-20260928`  
**Capacitor appId:** `com.offerpk.urrjaa`

## OWNER COMPLETE ✅

### Rename
- [x] Display name **Urr Jaa!** everywhere (logo, title, manifest, README, STATUS, Capacitor appName)
- [x] package.json `name`: `urr-jaa` · version `3.0.0-urrjaa`
- [x] Folder path kept `flappy-tap` (repo continuity)
- [x] Capacitor `com.offerpk.urrjaa`
- [x] Zip `urr-jaa-web-windows.zip`

### Core (kept)
- [x] Tap→flap, gravity, pipes/obstacles, score, death
- [x] Practice / Daily
- [x] Ads stubs · NO countdown · 2s learn
- [x] Shield / slow-mo / pause / settings / medals / power-ups

### ADD — all playable
- [x] Birds: Sparrow + Parrot, Eagle, Chick, Owl, Funny (garage/coins)
- [x] Vehicles collection pairing: Rickshaw, Cycle, Bike, Scooty, Bicycle, Chingchi, Taxi, Bus, Mehran, Tractor
- [x] Pakistani environments (bg): City, Lahore, Islamabad, Karachi, Murree, Village, Desert, Night City
- [x] Weather visual: Sunny, Rain, Fog, Night, Storm (FX only)
- [x] Coins in gaps + spend in garage
- [x] Coin combo consecutive → x2 / x5 / x10
- [x] Mystery boxes → random cosmetic + Collection album
- [x] Missions daily/local (meters, coins, obstacles, boxes, clean 50)
- [x] Funny PK obstacles + “Oye bach ke!” toast
- [x] Modes: Classic · Challenge 100m · Hard · Reverse · Giant (+ Daily/Practice)
- [x] Bird+Vehicle pairing visual comedy

### Ship
- [x] Offline PWA (`urrjaa-v5-20260928`)
- [x] Capacitor scaffold — no APK
- [x] Ads stubs only — no secrets
- [x] `www/` + `docs/` + `dist/urr-jaa-web-windows.zip`
- [x] `npm run check` + smoke
- [x] No git push from this box

## Out of scope ⏳
- [ ] Real AdMob + production IDs
- [ ] Signed APK/AAB (no JDK/SDK)
- [ ] iOS Capacitor
- [ ] GitHub Pages / release upload — **parent agent** (no push)

## How to open

```bash
cd /workspace/games/flappy-tap
npx --yes serve -l 4174 .
# → http://localhost:4174
```

Windows: extract `dist/urr-jaa-web-windows.zip` → `PLAY-WINDOWS.bat`.
