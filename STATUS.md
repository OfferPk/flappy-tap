# Urr Jaa! STATUS

## Candidate patch: **3.58.5-urrjaa** (2026-09-29 PKT)

**Branch:** `feature/magic-powerup`
**Base:** released HUD baseline `v3.58.4-urrjaa` · `5fc2e379cfdb3e9202fefc18d4f9e7086f78df3b`
**Live site:** still the baseline build at https://offerpk.github.io/flappy-tap/ — this patch has not been published.

### MAGIC 🪄 — saved inventory and guided flight
- **Persistent inventory:** daily local-calendar reward adds exactly +1 once per date; menu and gameplay button share the same saved count; each activation consumes exactly one item.
- **Gameplay:** `🪄 MAGIC × [count]` is grey/disabled with no items and disabled while active. The menu shows **Available** and **USE MAGIC**.
- **Flight:** 10-second effect; smoothly steers toward the next pipe gap for the first 7 seconds, then returns player control for 3 seconds with a red pulsing countdown. The 0 state clears; pause time is excluded and remaining time is refreshed on resume. Pipe and traffic obstacles cannot cause a lethal collision during MAGIC; ground/ceiling boundaries retain normal gameplay.
- **Visuals/accessibility:** purple-gold glow and trail, visible top-right timer below active-effect chips, descriptive timer labels, and reduced-motion handling.
- **Rewarded ads:** no SDK is connected, so the ad action stays disabled and cannot grant an item. Persistent state tracks a maximum of 2 rewards per local day with a 10-hour cooldown for a future verified SDK adapter.
- **PWA safety:** cache is `urrjaa-v73-20260929`; activation removes only older cache names in this app’s `urrjaa-v*` namespace, not other apps’ caches.
- **Documentation/builds:** English and Roman Urdu guides/changelogs, README, generated Pages (`docs/`) and Capacitor (`www/`) assets, and Windows ZIP are updated to 3.58.5.

### Verification
- `npm run check`, `npm test`, and `npm run smoke` pass; Chromium responsive layout checks cover 320×568 and 390×844.
- `npm run pack:windows` rebuilds root/Pages/Capacitor copies and Windows ZIP; source parity, archive integrity, and ZIP hash parity are checked.
- Local browser preview verified daily inventory, menu use/one-item consumption, timer visibility, and the red 3-second control-return state. Pause-offset arithmetic and reward/cooldown boundaries are covered by behavior tests.
- No physical-device or airplane-mode network test was performed.

**Release tag:** not created; remote push/Pages deployment intentionally not performed.
**Windows artifact:** `dist/urr-jaa-web-windows.zip`.
