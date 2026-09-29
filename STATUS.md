# Urr Jaa! STATUS

## Current: **3.58.5-urrjaa** (2026-09-29 PKT)

The release commit is `d829300e0cbe611438433033758114395bd6eb64`. The [v3.58.5-urrjaa release](https://github.com/OfferPk/flappy-tap/releases/tag/v3.58.5-urrjaa) is public, and the [live game](https://offerpk.github.io/flappy-tap/) is serving it.

GitHub reports a successful build from the configured `main:/docs` Pages source. Direct public requests returned HTTP 200 for the page, game/storage scripts, and the v3.58.5 service worker `urrjaa-v73-20260929`.

**Windows ZIP:** [Download](https://github.com/OfferPk/flappy-tap/releases/download/v3.58.5-urrjaa/urr-jaa-web-windows.zip) · SHA-256 `c5afa31d3bb2ab7c9e4c2a280dd628b0b46a5d5d89e6d521751c2b46112206a9`

### MAGIC 🪄

The persistent local inventory is shared by the menu and gameplay HUD. Each new local calendar day adds exactly one item without replacing saved items, and activation consumes exactly one. The gameplay button reflects the saved count and is disabled at zero or while active; the menu shows **Available** and **USE MAGIC**.

Each use lasts 10 seconds. The first 7 seconds smoothly steer toward the next pipe gap; control returns for a red, pulsing 3-second countdown. Pause time is excluded, and the timer refreshes on resume. Pipe and traffic collisions cannot cause a lethal hit during MAGIC, while ground/ceiling boundaries retain normal gameplay. The bird receives a purple-gold glow and trail, with descriptive timer labels and reduced-motion styling.

Rewarded ads are unavailable until a real SDK is connected; the action stays disabled and grants nothing. Reward state supports a limit of 2 per local day and a 10-hour cooldown for a future verified ad integration. Service-worker activation removes only older caches in this app’s `urrjaa-v*` namespace.

### Verification

`npm run check`, `npm test`, `npm run smoke`, and `npm run pack:windows` passed. Responsive Chromium checks passed at 320×568 and 390×844. The release ZIP downloaded with HTTP 200; its size and SHA-256 matched the local artifact and GitHub’s reported digest. The public Pages build and source are live and verified.

No physical-device or airplane-mode network test was performed.
