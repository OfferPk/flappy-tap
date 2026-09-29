# Urr Jaa! STATUS

## Current: **3.58.2-urrjaa** (2026-09-29 PKT)

### This pack (follow-up to the 3.58.1 source tag)
- **Reliability** — behavior-level tests cover collision geometry, pipe scoring, mode-aware pause/resume/retry transitions, persistent progress, and service-worker offline/missing-asset cases.
- **PWA** — failed JS/image requests remain asset errors; only offline document navigations fall back to the app shell. Guide and simulation module are precached.
- **Accessibility** — run results receive one concise polite announcement and focus; menu panels and pause restore focus without animation-frame chatter. The Roman Urdu guide section is tagged `lang="ur-Latn"`.
- **Guide** — English and Roman Urdu quick guide linked from the game menu and README.
- **Windows ZIP** — refreshed package includes the new guide and simulation module, plus a corrected 3.58.2 build note.
- **Daily** — retry is explicitly labeled and restarts today’s seeded run locally. A full personal-best ghost/replay is intentionally omitted: gameplay and visual-effect randomness still share the seeded stream, so a recorded run could diverge until those RNG consumers are separated.

SW cache: `urrjaa-v69-20260929`

**Ship commit:** tag `v3.58.2-urrjaa` (see main history)
**Live:** https://offerpk.github.io/flappy-tap/
