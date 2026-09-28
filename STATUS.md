# STATUS — Urr Jaa! v3.4.0-urrjaa

**Path:** `/workspace/games/flappy-tap` (repo OfferPk/flappy-tap; UI title **Urr Jaa!**)
**Owner:** Mia Smith
**Updated:** 2026-09-28 ~16:30 Asia/Karachi (PKT)
**Version:** **3.4.0-urrjaa**
**SW cache:** `urrjaa-v10-20260928`
**Capacitor appId:** `com.offerpk.urrjaa`

## OWNER COMPLETE ✅

### Core (kept from ≤3.3)
- [x] FLY→DODGE→COINS→COMBO→POWER-UP→RECORD→UNLOCK→TRY AGAIN
- [x] Modes · leaderboards · near-miss RISKY · power-ups · streak · accessories/trails
- [x] Desi voices · traffic · special areas · One Life · Collection · ads stubs · juice
- [x] Daily Missions · Perfect Pass · bird passives · weather · boss · run summary · album
- [x] Hitbox forgiveness · ease-in · calibration · Desi speechSynthesis

### ADD — v3.4.0 (Gift Collection — no post-run mystery popup)
- [x] Collecting 📦/🎁 during play adds to **Gift Collection** inventory (count)
- [x] **No** auto rarity / Duplicate→Fragments modal after death or mid-run
- [x] Run Summary stays clean (RETRY / COLLECTION / HOME) + optional **+N gifts** line
- [x] Gift Collection screen (menu **🎁 Gifts** + Album entry): owned count + spin charges
- [x] **Spin wheel**: every **10 gifts = 1 spin**; rewards ONLY coins **444 / 555 / 666 / 777 / 888 / 999**
- [x] Buttons: **Spin once** (spend 10) · **Spin all** (all complete sets of 10)
- [x] Ads “Mystery Box” stub adds **+1 gift** to inventory (no rarity UI)
- [x] Mission / streak mystery rewards add gifts (no interrupt popup)

### Ship
- [x] Offline PWA (`urrjaa-v10-20260928`)
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
