# Urr Jaa! STATUS

## Current: **3.58.1-urrjaa** (2026-09-29 PKT)

### This pack (NEW vs 3.58.0)
- **Reliability** — behavior-level tests cover collision geometry, pipe scoring, mode-aware pause/resume/retry transitions, persistent progress, and service-worker offline/missing-asset cases.
- **PWA** — failed JS/image requests remain asset errors; only offline document navigations fall back to the app shell. Guide and simulation module are precached.
- **Accessibility** — run results receive one concise polite announcement and focus; menu panels and pause restore focus without animation-frame chatter.
- **Guide** — English and Roman Urdu quick guide linked from the game menu and README.
- **Daily** — retry is explicitly labeled and restarts today’s seeded run locally. A full personal-best ghost/replay is intentionally omitted: gameplay and visual-effect randomness still share the seeded stream, so a recorded run could diverge until those RNG consumers are separated.

SW cache: `urrjaa-v68-20260929`

**Ship commit:** tag `v3.58.1-urrjaa` (see main history)
**Live:** https://offerpk.github.io/flappy-tap/
