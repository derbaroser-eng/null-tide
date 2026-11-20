# NULL TIDE — The City That Remembers Water
### A standout HTML5 browser game for itch.io | plain HTML/CSS/JS, zero dependencies, zero paid APIs

**High concept (one sentence):** You are not the hero. You are the tide — you flood and recede over a tiny procedural city, and the city remembers what you left behind and rewrites its culture around it.

This is not a tower defense clone, not a vampire-survivors clone, not a cozy-farm clone. There is no avatar to move, no enemies to shoot, no grid to optimize. The fantasy is elemental and melancholic: a god-game played in 12-minute elegies where every run ends with the city writing a poem about you.

---

## 1. Why this is unlike 10,000 itch clones

1. **You play a verb, not a character.** In 99% of jam games you move a sprite. Here you ARE a rhythm: INHALE (recede) / EXHALE (flood). Two buttons + mouse. That's it.
2. **Memory is the only resource.** Water deposits and steals OBJECTS (a shoe, a bell, a wedding ring, a war medal). Citizens pick them up and build shrines, taboos, festivals around them. Leave a sword twice → the district becomes Militarist. Leave a teddy bear → it becomes Tender. The city is a culture-sim, not an economy-sim.
3. **Every run produces a shareable artifact.** At the end, the game generates a 4-line eulogy + a seed-code + a tiny pixel skyline PNG (canvas export). Players post "My city remembered me as MERCIFUL / DROWNER" — this is the viral hook. No server needed: the seed recreates the city 1:1.
4. **Designed for browser-first donations.** 12 minutes, no install, no tutorial wall, instant restart. Perfect itch loop: play free in browser → "I need to see what my next city becomes" → pay $5 for the downloadable + OST + seed-artbook.

Comparable comps (for positioning, not cloning): *Tiny Islands* (minimalist god-toy) + *Cultist Simulator* (culture from objects) + *A Short Hike* (melancholy + generosity). Nothing on itch does tide-as-memory.

---

## 2. Core loop (60 seconds, repeated ~10x per run)

```
RECED­E (6s) → CHOOSE what to pick up from the exposed seabed
FLOOD (8s) → CHOOSE where to drop it (which district)
WATCH (30s) → Citizens find it, argue, build, change district trait
OMEN (10s) → Storm / Gulls / Deep Bell event forces a trade-off
```

- **Districts:** 5 on a 960×540 island: Docks, Market, Chapel Hill, Salt Flats, Sunken Gate. Each has 2 hidden meters: REVERENCE (how much they worship the tide) and DREAD (how much they fear it). Objects push these.
- **Objects (36 total in full game, 14 in jam slice):** each has WEIGHT (how far tide carries it), ECHO (how strongly it shifts culture), STAIN (does it pollute water?). Example: `Brass Bell (ECHO 3)` → +Festival. `Oil Drum (STAIN 2)` → +Industry but poisons gulls.
- **Tide physics (simple, juicy):** water level = sine + player drag. Drag outward = recede faster, drag inward = flood faster. No physics engine — just a heightfield array of 120 columns, rendered as layered sine bands. Runs at 60fps on a Chromebook.
- **Win/Lose reframed:** No game over. After 10 cycles the Deep Bell rings and the tide leaves forever. The city writes your EULOGY based on final traits (e.g., Tender+Reverent = "She Who Returned Shoes"). That's the score. Players chase rare eulogies (24 variants).

**A 12-minute run = 10 tides + eulogy + share card.**

---

## 3. The hook that makes a stranger share it

> "My tide drowned the chapel but saved the market — my city called me THE HALF-MERCIFUL. Seed: TIDE-7F3K. Beat that."

Why it spreads:
- **Identity verdict:** the eulogy judges YOU (Merciful / Thief / Gardener / Drowner). People share judgments.
- **Visual share card:** one-click canvas → PNG (city skyline + eulogy + seed). Works on X / Discord / TikTok thumbnail. No backend.
- **Seed visiting:** enter a friend's seed, play THEIR city layout with your own tide style, compare eulogies. Async multiplayer with zero server (deterministic RNG: mulberry32 + seed string).
- **Streamer bait:** chat votes INHALE/EXHALE every tide. 2-button game = perfect chat-plays.

---

## 4. 3-minute onboarding (no text wall, no tutorial level)

**0:00–0:30 — One touch, instant beauty.** Game opens mid-tide, water already moving, gulls crying (WebAudio synth). Prompt: "HOLD to recede." Player holds mouse/space → water pulls back, seabed glints, a shoe exposed. Release → water rushes in. They already played.

**0:30–1:30 — First meaning.** A citizen (2-pixel hooded figure) wades out, picks up the shoe, carries it to Docks. A tiny bell chime. Tooltip: "The Docks found a LOST SHOE → +Tender." Player learns: *what I drop changes them.*

**1:30–2:30 — First choice.** Tide recedes again, exposing TWO objects: Brass Bell vs Oil Drum. Ghost text: "The Chapel loves beautiful things. The Market loves useful things." Player drags one to a district. Citizens react with hearts / jeers (floating icons, no reading required).

**2:30–3:00 — First omen + promise.** Sky darkens. "STORM COMING — hold back the water or let it take?" Player chooses. Then: "7 tides remain until the Deep Bell. What will they remember?" Progress ring appears. Hooked.

No menus, no WASD, no fail state in first 3 minutes. Mobile: same with one finger.

---

## 5. Controls (deliberately tiny)

- **Hold SPACE / Mouse / Finger:** recede. Release: flood. That's 90% of game.
- **Drag object while receded:** pick up + aim drop (arc preview).
- **Single key E:** ring the Deep Bell early (end run when you want).
- Accessibility: color-blind-safe palette (blue/amber, never red/green for meaning), one-hand play, 0.85x/1x/1.25x tide speed toggle, mute + photosensitive-safe mode (no flash >2Hz).

---

## 6. Concrete feature list — buildable in plain HTML/CSS/JS

No downloads, no npm, no paid APIs. Target: single `index.html` + `/js` + `/css` + `/assets` (all procedural), <3MB total, itch browser embed 960×600.

**Simulation (`sim.js`, ~600 lines):**
- [ ] Heightfield water (120 floats) + tide phase machine (RECEDE/FLOOD/WATCH/OMEN)
- [ ] Deterministic RNG (mulberry32 + xmur3 seed) — same seed = same city + object order
- [ ] 5 districts with {reverence, dread, traits[3], shrines[]} + citizen agents (12 agents, seek/pickup/worship/flee steering, no pathfinding lib — flow-field on 48×27 grid)
- [ ] 14 objects jam slice (36 full): {name, pixelIcon 12×12, weight, echo, stain, loreLine}
- [ ] Culture rules: IF district receives 2× same ECHO type → trait locks in (Festival/Militarist/Tender/Industrious/Drowned). 24 eulogy templates with slot-fill.
- [ ] Omens deck (6 cards jam, 12 full): Storm, Gull Plague, Deep Bell Echo, Moon Pull, Stranger's Boat, Oil Slick — each a 2-choice event with tide-physics effect
- [ ] Save: localStorage (best eulogy, seeds visited, settings). Export PNG via canvas.toDataURL.

**Rendering (`render.js`, canvas 2D, no WebGL):**
- [ ] Layered water bands (4 translucent fills + foam line + floating debris sprites)
- [ ] Pixel city skyline (procedural houses: 3 roof types × 4 palettes, lit windows at dusk, shrines appear as tiny icons)
- [ ] Citizens as 3-frame hooded sprites (drawn programmatically, no image files)
- [ ] Weather: rain lines + vignette + bell ripple rings. Day→dusk→night over 10 tides.
- [ ] Share card renderer (offscreen 1200×630 canvas → PNG download)

**Audio (`audio.js`, WebAudio only, no files):**
- [ ] Procedural: water noise (filtered noise buffer), bell (sine + exponential decay), gulls (2 detuned saws with vibrato), deep bell (55Hz + harmonics), UI ticks
- [ ] Dynamic mix: reverence raises choir pad, dread raises low drone. Mute + volume persisted.

**UI (`ui.js` + CSS):**
- [ ] HUD: tide ring, cycle 1/10, district tooltip on hover, object card (icon + 1 lore line)
- [ ] Eulogy screen + share buttons (Copy Seed, Download PNG, Play Again, Visit Seed input)
- [ ] Title / pause / settings / credits / content-warning (drowning themes, gentle) screens
- [ ] Full keyboard + touch + gamepad (one button) support

**Content files (plain JSON/JS, no pipeline):**
- [ ] `data/objects.js` (14 → 36), `data/eulogies.js` (24 templates), `data/omens.js` (6 → 12), `data/names.js` (200 city names: SALT + VERB, e.g., "Salt-Mourns")

Performance budget: 60fps on Intel i3 / 4GB, <50MB RAM, works offline after first load (no service worker needed for itch, but include manifest for download build).

---

## 7. Monetization surface (itch-native, no ads, no paid APIs)

**Free browser build (donation funnel):** full 12-min game, all 14 objects, all endings, share cards. Pay-what-you-want $0+ with suggested $4. Itch tips enabled. No paywall in game — only a gentle eulogy-screen line: "If this city moved you, toss a coin to keep the tide alive."

**Paid download ($5, "Tidekeeper's Edition"):** itch downloadables, no DRM:
- Full 36 objects + 12 omens + night-tide endless mode
- OST (12 WebAudio-rendered tracks exported as WAV/MP3 — rendered locally with OfflineAudioContext, no studio cost)
- Seed Artbook PDF (50 best cities + eulogies, generated from canvas exports)
- 3 desktop wallpapers (1920×1080 PNG from share-card renderer) + phone wallpapers
- Name-in-game: backers' city names in `names.js` (itch purchase → Google Form → added in update; creates repeat visits)

**Expansion rails (no extra tech):**
- Physical zine (print-on-demand via itch physical + DriveThru, no inventory held by us)
- Soundtrack on Bandcamp/YouTube (Content ID + affiliate-free)
- Streamer overlay pack (free) → drives traffic → donations

Price test plan: launch PWYW, after 500 plays + 4.2★+ rating, add $5 edition. Goal: 2% conversion on browser players (itch cozy average 1–3%).

---

## 8. Itch page pitch (ready to paste)

**Title:** NULL TIDE — The City That Remembers Water
**Tagline:** You are the tide. Flood. Recede. Be remembered.
**Description hook:** A 12-minute god-elegy about memory. No hero, no shooting — just water, lost things, and a little city that will write a poem about you when you leave. Every city is shareable with a seed.
**Tags:** cozy, atmospheric, god-game, short, emotional, pixel-art, procedural, story-rich, singleplayer, browser, free, donation
**Thumbnail direction:** deep-blue water band across middle, tiny amber-lit skyline above, one huge brass bell below waterline, text: "WHAT WILL THEY REMEMBER?" — 630×500 + 3 GIFs (recede / drop bell / eulogy card).

---

## 9. Build roadmap (solo-dev, plain stack)

- **Day 1–2 — Water toy:** heightfield + hold/release + sound. Fun to touch before anything else.
- **Day 3–4 — Meaning:** 1 district + 3 objects + 1 citizen + tooltip reaction. First eulogy stub.
- **Day 5–7 — Full loop:** 5 districts, 14 objects, 10 tides, 6 omens, day→night, eulogy + share card + seed visit.
- **Day 8–9 — Juice + audio mix + onboarding tuning (3-min test with 3 strangers) + a11y + perf.**
- **Day 10 — Itch page, thumbnail, GIFs, PWYW + $5 build packaging (zip: index.html + files, runs offline).**

Definition of done: stranger plays 12 min in browser, gets eulogy, clicks Download PNG or Copy Seed without prompting.

---

## 10. Risks + mitigations

- Risk: "god game with no avatar feels passive" → Mitigation: tide control is constant (every 6–8s a decision), citizens react within 5s with sound + icons, omens force trade-offs.
- Risk: "culture sim too opaque" → Mitigation: every object shows 1-line prediction ("Chapel will love this"), traits shown as visible shrines, never numbers.
- Risk: "scope creep to 36 objects" → Mitigation: ship 14, data-driven so 36 is content-only update for paid edition.

---

**License / cost:** 100% original code + procedural art/audio. No store assets, no external APIs, no server. Total spend: $0. Itch fee only on sale (10% default, adjustable).
**Next file to write:** `prototype.html` (water toy) → `sim.js` → `render.js` → `audio.js` → itch page.
