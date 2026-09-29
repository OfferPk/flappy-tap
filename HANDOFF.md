# HANDOFF — Urr Jaa!

**Patch candidate:** `3.58.5-urrjaa` on `feature/magic-powerup`
**Based on:** `v3.58.4-urrjaa` · `5fc2e379cfdb3e9202fefc18d4f9e7086f78df3b`
**Live site:** [Urr Jaa!](https://offerpk.github.io/flappy-tap/) remains on the v3.58.4 baseline. This patch is local and has not been pushed or deployed.

## MAGIC 🪄

MAGIC has persistent local inventory shared by the menu and gameplay HUD. A new local calendar day adds one free item without replacing saved items; activation consumes one. The gameplay button reflects the current count and disables at zero or while active. The simple **MAGIC 🪄** screen shows **Available** and **USE MAGIC**.

Each use starts a 10-second guided flight: the first 7 seconds steer smoothly toward the next pipe gap; at 3, player control returns and the timer turns red/pulses through 2, 1, then 0. Pause duration is excluded and the timer refreshes on resume. Pipe and traffic collisions are non-lethal during the effect, while normal ground/ceiling boundaries remain. The bird receives a purple-gold glow and trail. Timer accessibility labels and reduced-motion styling are included.

**Rewarded ads are not connected in this build.** The action is visibly unavailable and grants nothing; saved ad-reward state enforces at most 2 per local day and a 10-hour cooldown for a future verified SDK integration.

## Verification

`npm run check`, `npm test`, and `npm run smoke` pass. Tests cover daily claim idempotence and additive inventory, exact consumption, persistence, ad reward/cooldown/cap logic, SDK-unavailable behavior, timer phases and pause-offset math, steering bounds, and app-scoped service-worker cleanup. Responsive Chromium layout checks cover 320×568 and 390×844. The Windows ZIP passes integrity and hash-parity checks against its Pages copy. A local browser preview verified the menu inventory, one-item use, visible timer, and red 3-second control-return state.

No physical-device or airplane-mode network test was performed. The public release tag and Pages deployment are intentionally unchanged.

## Local artifacts

- Pages source: `docs/`
- Capacitor web assets: `www/`
- Windows package: `dist/urr-jaa-web-windows.zip`
