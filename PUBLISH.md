# Publishing NULL TIDE to itch.io — staged, not yet published

There is **no itch.io credential wired into this repo**, and this run is unattended,
so the listing below is STAGED. No upload was attempted and no account was created.
`butler` also requires an interactive login, which a cron run cannot do.

## 1. Build the upload zip (already done by this run)

```bash
cd "C:/Users/armoo/AppData/Local/hermes/workspace/products/itch-game"
python itch-build.py          # -> dist/null-tide-1.0.0-itch.zip, index.html at root
```

## 2. Create the itch.io page (owner, 2 minutes)

1. Go to <https://itch.io/upload> and choose **"Upload new project"**.
2. Title: `NULL TIDE — The City That Remembers Water`
3. Project URL: `null-tide`
4. Classification: **HTML** (so it runs in the browser on itch).
5. Kind of project: **Game**.
6. Release status: **Draft** until the $5 tier is configured.
7. Pricing: `Pay what you want` with a $5 suggested price for the Tidekeeper Edition.
8. Description: paste `ITCH.md` (it is plain markdown and itch renders it).
9. Tags: `god-game`, `atmospheric`, `experimental`, `short`, `pixel-art`, `no-combat`, `generative`, `poetry`.
10. Upload `dist/null-tide-1.0.0-itch.zip` to the **Uploads** section and set the
    `index.html` entry as the playable file.

## 3. Optional: push from the CLI once the owner has credentials

```bash
# one-time, interactive, needs the owner's itch.io password or API key
butler login
butler push dist/null-tide-1.0.0-itch.zip derbaroser/null-tide:html
```

`butler` stores the credential in `%APPDATA%\itch\butler_creds.json`. Never commit it.

## 4. After publishing

- Set the page live, then paste the URL into `workspace/distribution/` and into the
  B2B suite index (`workspace/products/index.html`) so the game rail cross-links.
- Drive traffic: the memory-card PNG is the share hook. Post seeds + cards on
  r/indiegames, r/WebGames, r/ExperimentalGame, and itch's own community boards.
