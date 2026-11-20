# NULL TIDE — The City That Remembers Water

You are not the hero. You are the tide.

A 12-minute browser god-elegy: flood and recede over a tiny procedural city,
and the city remembers everything you left behind — then rewrites its culture
around it. Every run ends with a four-line eulogy and a title. That is the score.

**Play free:** https://derbaroser-eng.github.io/null-tide/

**Tidekeeper Edition (USD 5):** https://buy.stripe.com/5kQ5kGeemawo5mFay44ko0U
Offline build + full ambient OST + seed artbook + credits.

## Run it

Open `index.html` in any modern browser, or serve the folder:

```
python -m http.server 8000
```

No build step, no dependencies, no network calls, no tracking. The seed
recreates the city 1:1.

## Develop

```
node --test tests/sim.test.mjs
```

15 tests: deterministic RNG/city, eulogy reachability (all 24 endings),
omen trade-offs, and a full 10-tide integration run.

## Files

- `index.html`, `styles.css`, `game.js` — the game
- `tests/` — simulation tests (Node, no deps)
- `dist/null-tide-1.0.0-itch.zip` — itch.io upload build (index.html at root)
- `ITCH.md` — itch.io page copy

## License

Design, code, art, audio and poetry: derbaroser-eng. All rights reserved.
