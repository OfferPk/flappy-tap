# STATUS — Urr Jaa! v3.4.1-urrjaa

**Path:** `/workspace/games/flappy-tap` (repo OfferPk/flappy-tap; UI title **Urr Jaa!**)
**Owner:** Mia Smith
**Updated:** 2026-09-28 ~16:40 Asia/Karachi (PKT)
**Version:** **3.4.1-urrjaa**
**SW cache:** `urrjaa-v11-20260928`
**Capacitor appId:** `com.offerpk.urrjaa`

## OWNER COMPLETE ✅

### Core (kept from ≤3.3)
- [x] FLY→DODGE→COINS→COMBO→POWER-UP→RECORD→UNLOCK→TRY AGAIN
- [x] Modes · leaderboards · near-miss RISKY · power-ups · streak · accessories/trails
- [x] Desi voices · traffic · special areas · One Life · Collection · ads stubs · juice
- [x] Daily Missions · Perfect Pass · bird passives · weather · boss · run summary · album
- [x] Hitbox forgiveness · ease-in · calibration · Desi speechSynthesis

### KEEP — v3.4.0 Gift inventory
- [x] Collecting 📦/🎁 during play adds to gift inventory (count)
- [x] **No** auto rarity / Duplicate→Fragments modal after death or mid-run
- [x] Run Summary clean (RETRY / COLLECTION / HOME) + optional **+N gifts** line
- [x] Every **10 gifts = 1 spin**; rewards ONLY coins **444 / 555 / 666 / 777 / 888 / 999**
- [x] Buttons: **Spin once** · **Spin all**
- [x] Ads / mission / streak mystery rewards add gifts (no interrupt popup)

### ADD — v3.4.1 (Mystery Rewards visual wheel)
- [x] Dedicated **Mystery Rewards** screen (menu **🎁 Mystery** + Album entry)
- [x] Polished visual **spin wheel** UI (rim · hub · pointer · glow · win flash)
- [x] Gift / spin stats cards; animate spin lands on prize; spend 10 gifts/spin
- [x] **Spin all** = rapid sequential queued spins with brief animation each
- [x] In-run toast: **📦 → Mystery Rewards** (no mid-game interrupt)
- [x] Run Summary stays clean (no RARE popup)

### Ship
- [x] Offline PWA (`urrjaa-v11-20260928`)
- [x] `www/` + `docs/` + `dist/urr-jaa-web-windows.zip`
- [x] `npm run check` + `npm run smoke`
- [x] No git push · no secrets

## Out of scope ⏳
- [ ] Real AdMob + production IDs
- [ ] Signed APK/AAB
- [ ] GitHub Pages / release upload — **parent agent**

## How to open Mystery Rewards wheel

1. Menu → **🎁 Mystery**
2. Or Album → **🎁 Mystery Rewards**

```bash
cd /workspace/games/flappy-tap
npx --yes serve -l 4174 .
# → http://localhost:4174
```

Windows: extract `dist/urr-jaa-web-windows.zip` → `PLAY-WINDOWS.bat`.
