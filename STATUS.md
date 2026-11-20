# STATUS - NULL TIDE (updated 2026-11-20T20:33:03+01:00)

## This run
- docs gate: `python scripts/docs_gate.py check` -> allowed=true ("live docs fetched and studied"), exit 0; `system_state()` captured (Hermes v0.23.1, Python 3.14.9).
- product selected: NULL TIDE (itch-game) - code complete, 15/15 Node sim tests green, itch build v1.0.0 built, but ZERO live presence. shellguard is closest to shippable but its only remaining step (PyPI publish) is credential-blocked.
- created repo https://github.com/derbaroser-eng/null-tide (public), pushed source + tests + dist, commit e3d8793.
- enabled GitHub Pages (master, /) -> build status "built".
- live: https://derbaroser-eng.github.io/null-tide/ -> HTTP 200 (index.html 6529 bytes; game.js and styles.css -> HTTP 200).
- created Stripe checkout for the $5 Tidekeeper Edition: https://buy.stripe.com/5kQ5kGeemawo5mFay44ko0U -> HTTP 200 (product prod_VfI7z9WgEJTv0O, price price_1UdxWzV05gWq3LvXf1rqj0rM).
- added the checkout CTA to index.html (title-screen row-links + end-screen tip), README.md and ITCH.md.

## Evidence
- `node --test tests/sim.test.mjs` -> 15 pass, 0 fail, exit 0.
- `gh repo create ... --source=. --push` -> exit 0.
- `gh api -X POST repos/derbaroser-eng/null-tide/pages ...` -> exit 0.
- live URL poll -> HTTP 200 after 4 tries.

## Next concrete step
- Publish the itch.io listing (blocked: no itch.io credential; `butler login` is interactive). Then drive traffic: r/indiegames, r/WebGames, r/ExperimentalGame, itch community boards; the 1200x630 memory card is the share hook.
