# STATUS — Urr Jaa! v3.5.0-urrjaa

**Path:** `/workspace/games/flappy-tap` (repo OfferPk/flappy-tap; UI title **Urr Jaa!**)
**Owner:** Mia Smith
**Updated:** 2026-09-28 ~17:10 Asia/Karachi (PKT)
**Version:** **3.5.0-urrjaa**
**SW cache:** `urrjaa-v12-20260928`
**Capacitor appId:** `com.offerpk.urrjaa`

## OWNER COMPLETE ✅

### Core (kept from ≤3.4)
- [x] FLY→DODGE→COINS→COMBO→POWER-UP→RECORD→UNLOCK→TRY AGAIN
- [x] Modes · leaderboards · near-miss RISKY · power-ups · streak · accessories/trails
- [x] Desi voices · traffic · special areas · One Life · Collection · ads stubs · juice
- [x] Mystery Rewards visual wheel · 10 gifts = 1 spin · 444–999 coins
- [x] Hitbox forgiveness · ease-in · calibration · mute ≠ Desi voice

### ADD — v3.5.0
- [x] Voice **cooldown** (~6s global) + **same-phrase** (~12s) — no "wah g wah" spam
- [x] Voice **variety pools** (praise / warn / gift / …) rotate lines
- [x] More Desi lines: shabaash, zabardast, kya baat, oye hoye, mast, bohot ache, irshad, wah, close call, gift/mil gaya/box
- [x] Mystery box collect → distinct gift voice + SFX (cooldown-aware)
- [x] **One-time** spin-unlock popup when gifts hit ×10 (mid-run toast → run-end popup; not on menu reopen)
- [x] **Guide** screen: English · Roman Urdu · اردو (tap, pipes, coins/gifts, power-ups, modes, Mystery, voice setting)

### Ship
- [x] Offline PWA (`urrjaa-v12-20260928`)
- [x] `www/` + `docs/` + `dist/urr-jaa-web-windows.zip`
- [x] `npm run check` + `npm run smoke`

## How to open

```bash
cd /workspace/games/flappy-tap
npx --yes serve -l 4174 .
# → http://localhost:4174
```

Menu → **📖 Guide** · **🎁 Mystery** · Settings Desi voice.
