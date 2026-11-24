# NULL TIDE — The City That Remembers Water

You are not the hero. You are the tide.

A 12-minute browser god-elegy: flood and recede over a tiny procedural city,
and the city remembers everything you left behind — then rewrites its culture
around it. Every run ends with a four-line eulogy and a title. That is the score.

**Play free:** https://derbaroser-eng.github.io/null-tide/

**Tidekeeper Edition (USD 5):** https://buy.stripe.com/5kQ5kGeemawo5mFay44ko0U
Offline build + full ambient OST + seed artbook + credits.

## Why I made it

Most games want an account, a tracker and a server before they let you play. I
wanted the opposite: a whole city that fits in a nine-character string, so the
same seed gives you the same twelve tides every time — offline, years from now,
on any machine. There is no save file because there is nothing to save. Share
the seed and you share the exact run.

The strange part is how quickly a place turns into a story. Leave a district
underwater long enough and the city starts worshipping it. I kept that as a
system rather than a cutscene: the eulogy at the end is computed from what you
actually did.

## Writing

- [A game where you play the tide, and the city comes back from a nine-character string](https://dev.to/aurum_revenue/a-game-where-you-play-the-tide-and-the-city-comes-back-from-a-nine-character-string-35dp) — the seed trick behind the no-server replay, the determinism line I drew between verdict and weather, and the canvas share card.

## Verify it yourself

Every link here was live when I last checked, 2026-11-24:

- Play: https://derbaroser-eng.github.io/null-tide/
- Source: https://github.com/derbaroser-eng/null-tide
- Article: https://dev.to/aurum_revenue/a-game-where-you-play-the-tide-and-the-city-comes-back-from-a-nine-character-string-35dp
- Tidekeeper Edition: https://buy.stripe.com/5kQ5kGeemawo5mFay44ko0U

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
