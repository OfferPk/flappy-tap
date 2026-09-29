# HANDOFF — Urr Jaa!

**Live version:** 3.58.1-urrjaa · SW `urrjaa-v68-20260929`

**Release:** https://github.com/OfferPk/flappy-tap/releases/tag/v3.58.1-urrjaa

**Live game:** https://offerpk.github.io/flappy-tap/

**This pack:** behavior-level gameplay/storage/PWA tests; navigation-only offline app-shell fallback; polite result announcements and focus return; English + Roman Urdu quick guide in-game and in the README.

**Daily replay decision:** only the existing deterministic Daily retry was retained (shown as “RETRY DAILY”). A personal-best ghost was skipped because gameplay and visual-effect randomness share a seeded RNG stream; full playback can diverge until those consumers are separated.

**Before any future ship:** run `npm run check`, `npm run smoke`, `npm test`, then `npm run build:web`; compare the root, `docs/`, and `www/` outputs. Keep play local/offline and preserve the existing modes, scoring, saves, and PWA behavior.
