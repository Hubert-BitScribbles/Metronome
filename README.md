# Metronome

A steady, good-looking metronome by bitScribbles: 40–240 BPM, tap tempo, five time signatures, accent on beat one, light and dark modes. Free, no ads, works offline.

Live at **https://metronome.bitscribbles.com**, a Cloudflare Worker that serves this repository's files as they are from `main` — there is no build step on Cloudflare.

## What's where

| Path | What it is |
|---|---|
| `index.html` | The page: fonts, styles, loads `app.js`, registers the service worker |
| `src/app.jsx` | **The app's source** (React). Edit this. |
| `app.js` | Built from `src/app.jsx` — the file browsers actually run. Commit it with every change. |
| `sw.js` | Service worker: saves the app so it opens offline (network first, saved copy as fallback) |
| `fonts/` | Self-hosted Space Grotesk, Inter, JetBrains Mono and Caveat (SIL OFL, `fonts/OFL.txt`) |
| `manifest.json`, `*.png` | Install details and icons |
| `design/` | Icon source (`metronome-icon.svg`) and `make-icons.py`, which rebuilds every icon size |
| `build/` | Build tools (esbuild, React, axe-core). Kept out of the repo root so Cloudflare serves the site as plain files. |
| `checks/check.py` | Browser checks: tap tempo, keyboard, screen wake, offline, accessibility (axe) in both themes |

## Making a change

```sh
cd build
npm install          # once
# edit ../src/app.jsx
npm run build        # writes ../app.js
npm run check        # optional: runs checks/check.py (needs Python Playwright + Chromium)
```

Commit `src/app.jsx` **and** `app.js` together.

## Releasing

Changes go on a branch and a pull request; merging to `main` publishes.

1. Bump `VERSION` in `src/app.jsx` (shown in the app and in About) and `CACHE` in `sw.js` to match. Fixes bump the last number, features the middle.
2. Add an entry to `CHANGELOG.md`.
3. `npm run build`, commit, push the branch, open the pull request.

iPhone keeps an old Home Screen icon until it is removed and re-added; the app itself updates on the next open while online.

## Licence

MIT — see `LICENSE`. Fonts under the SIL Open Font License.
