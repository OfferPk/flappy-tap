# HANDOFF — Urr Jaa!

Urr Jaa! `3.58.5-urrjaa` is released at commit `d829300e0cbe611438433033758114395bd6eb64`, a direct child of the requested v3.58.4 baseline. The [v3.58.5-urrjaa tag and release](https://github.com/OfferPk/flappy-tap/releases/tag/v3.58.5-urrjaa) are public, and the [live game](https://offerpk.github.io/flappy-tap/) is serving the new version.

The Windows package is available as [urr-jaa-web-windows.zip](https://github.com/OfferPk/flappy-tap/releases/download/v3.58.5-urrjaa/urr-jaa-web-windows.zip). Its SHA-256 is `c5afa31d3bb2ab7c9e4c2a280dd628b0b46a5d5d89e6d521751c2b46112206a9`.

GitHub Pages reports `built` from `main:/docs` at the release commit. Public HTTP checks returned v3.58.5 for the HTML, `js/game.js`, `js/storage.js`, and `sw.js` (`urrjaa-v73-20260929`). The ZIP download returned HTTP 200 and matches both the local artifact and GitHub’s reported digest.

## MAGIC 🪄

The menu and gameplay HUD share persistent local inventory. A new local calendar day adds one free item without overwriting inventory; each activation consumes one. MAGIC runs for 10 seconds: smooth gap-seeking autopilot for the first 7 seconds, followed by a red 3-second countdown with player control returned. The timer pauses with the game, and pipe/traffic collisions are non-lethal during the effect; world boundaries behave normally. Visuals include a purple-gold glow and trail.

Rewarded ads are unavailable without a connected SDK. The action remains disabled and cannot grant items; reward-state logic enforces a maximum of 2 per local day with a 10-hour cooldown for any future verified integration.

`npm run check`, `npm test`, `npm run smoke`, `npm run pack:windows`, and Chromium responsive layout tests at 320×568 and 390×844 passed. Physical-device and airplane-mode testing were not performed.
