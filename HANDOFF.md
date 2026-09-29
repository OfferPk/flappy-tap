# HANDOFF — Urr Jaa!

**Live version:** 3.58.2-urrjaa · SW `urrjaa-v69-20260929`

**Release:** https://github.com/OfferPk/flappy-tap/releases/tag/v3.58.2-urrjaa

**Live game:** https://offerpk.github.io/flappy-tap/

**Windows ZIP:** https://github.com/OfferPk/flappy-tap/releases/latest/download/urr-jaa-web-windows.zip

**This pack:** behavior-level gameplay/storage/PWA tests; navigation-only offline app-shell fallback; polite result announcements and focus return; English + Roman Urdu quick guide (`lang="ur-Latn"`); refreshed Windows ZIP including the guide and simulation module. The earlier public `v3.58.1-urrjaa` tag remains unchanged.

**Daily replay decision:** only the existing deterministic Daily retry was retained (shown as “RETRY DAILY”). A personal-best ghost was skipped because gameplay and visual-effect randomness share a seeded RNG stream; full playback can diverge until those consumers are separated.

**Before any future ship:** run `npm run check`, `npm run smoke`, `npm test`, `npm run build:web`, and `npm run pack:windows`; compare generated outputs. Keep play local/offline and preserve the existing modes, scoring, saves, and PWA behavior.
