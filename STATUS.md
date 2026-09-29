# Urr Jaa! STATUS

## Current: **3.58.4-urrjaa** (2026-09-29 PKT)

### Focused patch — compact active power indicators
- **UI** — Shield and timed effects use compact horizontal chips, wrap across narrow screens, show remaining time while active, and disappear at expiry.
- **Gameplay rules** — Shield is an existing one-hard-hit protection with no timer; its indicator reports “1 hit” and clears when consumed. Existing effect durations and stacking behavior are unchanged.
- **Accessibility** — active effects have a labeled group and descriptive chip labels; updates do not spam a live region. Reduced-motion mode avoids animation.
- **Responsive layout** — real Chromium device-emulation checks pass at 320×568 and 390×844; seven simultaneous chips remain inside the screen, clear of the standard HUD, and above the central play area.
- **Preservation** — no new server/account/network feature; scores, local data, modes, Sukoon, mascots, and offline/PWA design are retained.
- **Verification** — `npm run check`, `npm run smoke`, `npm test`, `npm run build:web`, and `npm run pack:windows` passed. Source/Pages/www assets match; Windows ZIP copies have identical SHA-256 and pass `unzip -t`.

SW cache: `urrjaa-v72-20260929`

**Ship tag:** `v3.58.4-urrjaa`
**Live:** https://offerpk.github.io/flappy-tap/
**Windows ZIP:** https://github.com/OfferPk/flappy-tap/releases/latest/download/urr-jaa-web-windows.zip
