# HANDOFF — Urr Jaa!

**Live version:** 3.58.4-urrjaa · service worker `urrjaa-v72-20260929`

**Release:** https://github.com/OfferPk/flappy-tap/releases/tag/v3.58.4-urrjaa

**Live game:** https://offerpk.github.io/flappy-tap/

**Windows ZIP:** https://github.com/OfferPk/flappy-tap/releases/latest/download/urr-jaa-web-windows.zip

**This patch:** active power effects use small horizontal chips with live second counts and expiry removal. Shield remains the existing one-hard-hit protection (it has no time limit), so its chip says “1 hit” and disappears when used; no gameplay durations or stacking rules were changed. Chips wrap within the HUD-safe width, stay below the score/control/status band, and have labeled screen-reader output with no per-second live announcements.

**Verification:** `npm run check`, `npm run smoke`, and `npm test` (including timer/expiry/multiple-effect tests and real Chromium device-emulation layout checks at 320×568 and 390×844) passed. Pages/Capacitor assets were rebuilt and compared; the Windows ZIP passed integrity and hash parity checks.

Keep the game local/offline. No server, account, or network feature was added. Existing modes, scores, saved data, Sukoon, mascots, and PWA behavior remain in scope and were not intentionally changed.
