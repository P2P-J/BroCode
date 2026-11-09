# BroCode

Chrome extension (Manifest V3). Arrow-key skip/rewind, volume, and space play/pause on any HTML5 video player, plus removal of player gradients and hover controls.

## Install (developer mode)
1. Open `chrome://extensions` and turn on **Developer mode**.
2. Click **Load unpacked** and select this folder.

## Keys
| Key | Action |
|---|---|
| → / ← | Skip forward / back |
| ↑ / ↓ | Volume ±5% |
| Space | Play / pause |

Other keys are left to the site (e.g. YouTube M, C, F).

## Development
```
npm install
npm test           # unit tests
npm run test:e2e   # extension loaded in Chromium against test/fixtures
npm run icons      # regenerate icons
```
E2E uses the Chromium at `~/.cache/ms-playwright/chromium-1226`; override with `BROCODE_CHROME=/path/to/chrome`.

## Where to edit
- Player presets (selectors to hide): `src/content/config/players.js`
- Per-site overrides (keys, adapter, extra selectors): `src/content/config/sites.js`
- Skip interval table and defaults: `src/shared/defaults.js`

See `docs/PLANNING.md` for the full spec.
