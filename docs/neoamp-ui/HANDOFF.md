# NeoAmp — Winamp Player UI · Handoff

Handoff for the **Winamp-style player UI** (separate workstream from the Alchemy/
Butterchurn *visualizer presets*, which CLAUDE.md and `docs/alchemy-*` cover). This
is the floating windowed player overlaid on YouTube Music.

Last updated: 2026-06-19. Repo state: clean, all on `main` (HEAD `f658899`).

---

## 1. What it is + file map

A Manifest V3 content-script UI that draws a classic Winamp player over music.youtube.com,
themed by real `.wsz` skins (bitmap sprites blitted to canvas). None of this needs the
sandboxed iframe — it's pure DOM/canvas, so it lives in the content-script world.

| File | Role |
| --- | --- |
| `content.js` | Backend on `window.NeoAmp`: `getDisplayMedia` capture + `AnalyserNode`; scrapes YTM's DOM for track / queue / search / home shelves / like-state; drives playback by poking YTM controls. **The EQ + balance here are cosmetic (no audio effect yet).** |
| `winamp.js` | Window manager (drag, edge-snap dock, group-raise, resize, persist) + the DOM windows: Main (procedural), EQ, Visualization (Butterchurn iframe), Playlist, Library, Now-Playing panel. Skin picker. `wins{}`, `raise()`, `attachedCluster()`, `applyFrame()`, `enableClassic()`, `ensureNowPlaying()`. |
| `wsz.js` | **Real Winamp 2 `.wsz` engine**: unzips a skin, decodes BMP sprite sheets, blits sprites to `<canvas>` for the Main + EQ windows (coords from Webamp's skinSprites.ts). `SP`, `LAYOUT`/`EQ_LAYOUT`, `GEN`/`PLED` frame sprites, `mountMain`/`mountEq`, `drawBrand` (gold nameplate). |
| `winamp.css` | Procedural chrome + the GEN/PLEDIT frame CSS that themes the DOM windows (Playlist/Library/Viz/Now-Playing) per skin. The launcher button. |
| `skins.js` | CSS-var procedural skins (retired from the picker; `.wsz` skins are the default). |
| `manifest.json` | Content-script + `web_accessible_resources` (incl. each `vendor/skins/*.wsz`). |

Classic skins are vendored in `vendor/skins/*.wsz`. Current list (in `CLASSIC_SKINS`):
Winamp Classic (base-2.91), **TopazAmp**, Sony Esprit, Nucleo NLog, Winamp3 Classified,
**Winamp5 Classified**, Bento Classified. Users can also drag-drop any `.wsz` (persisted).

---

## 2. How to verify renders (THE key tool)

**You can self-render the player UI headlessly — don't depend only on the user's screenshots.**

```bash
node tools/render-neoamp.mjs                 # default stack + library/search/home → /tmp/neoamp-render/*.png
SKIN=TopazAmp node tools/render-neoamp.mjs   # also switch to + shoot a named skin
```

`tools/neoamp-preview.html` shims `chrome.*` + mocks `window.NeoAmp` with sample data, then
loads the REAL `skins.js`/`wsz.js`/`winamp.js`/`winamp.css` + a vendored `.wsz`.
`tools/render-neoamp.mjs` static-serves the repo, drives full Chrome over CDP, screenshots
(default + focused clips: `np_focus`, `eqpl_focus`, `viz_titlebar`, `dropdown`), and dumps a
window-geometry probe + console errors. (`tools/selfrender.mjs` is the sibling for the *viz*.)

This caught two fresh-install bugs the user's persisted-layout screenshots had masked.
**Iterate with it before asking the user**; still get one live confirmation for final polish.

---

## 3. What this session shipped (2026-06-19)

A full fidelity pass on the Winamp UI (commits `14856c3`..`f658899`, 18 commits, all pushed):

- **Window mgmt:** grabbing the main window raises the whole docked stack together.
- **Nameplate / launcher / skin picker:** classic engraved **gold** look (vector `drawBrand`,
  gold launcher, gold beveled picker button + readable dropdown).
- **Sliders:** volume / balance / position are draggable (commit-on-release seek).
- **Close icon:** framed windows no longer double-draw `✕` — a transparent hit-area sits over
  the baked GEN/PLEDIT corner close; pressed sprite on `:active`.
- **Now-Playing panel:** skin-framed border (GEN/PLEDIT → changes with the skin); 2-column
  button cluster — like/dislike stacked left, VIS+LIB row over the skin picker right.
- **Buttons:** VIS/LIB are chrome EQ-style keys (square LED, pixelated label) matching the
  skin's real EQ/PL bitmaps; like = neon-green heart, dislike = neon-pink thumb, both press in.
- **Data (content.js):** like/dislike control + state, album/year, play counts (queue + search),
  playlist open vs play, and the Library "home" view (Quick Picks / Listen Again).
- **Skins:** added TopazAmp + Winamp5 Classified.
- **Fixes:** procedural `#wa-eq` no longer floats over the NP panel in classic mode; viz/lib
  default positions cleared of the stack; playlist gold titlebar no longer flex-shrinks; crisp
  SVG fullscreen icon (was the flaky `⛶` glyph).

---

## 4. Current state & known tradeoffs

- **EQ + balance are cosmetic** — the 10-band EQ and balance slider move/redraw but do NOT
  shape audio yet. (Top of the next-work list.)
- **VIS/LIB/like/dislike buttons are CSS chrome, fixed across skins.** They mirror the EQ/PL
  *style* but don't recolor per skin like the real bitmap EQ/PL do. Winamp ships no VIS/LIB or
  heart/thumb sprites, so true per-skin buttons would mean rendering from the GEN generic-button
  sprite + bitmap font on canvas (a bigger change; the NP panel *frame* already changes per skin).
- **Shuffle/Repeat/Volume toggles are fire-and-forget** — they click YTM's controls but don't
  read YTM's actual state back (can drift out of sync). Like-state IS read back.
- Album art shows empty in the headless preview (no real URLs there) — fine in the live extension.

---

## 5. Next planned work (user wants a fresh session for this)

User's explicit next ask: **"build the real EQ + state sync + keyboard shortcuts."** All three
center on `content.js` (audio graph + YTM DOM), a distinct workstream from the UI chrome.

1. **Real equalizer + balance.** In `content.js`'s audio graph (currently
   `src → boost → analyser → muted sink → destination`), insert a chain of 10 `BiquadFilter`
   nodes (peaking, at the band freqs 60/170/310/600/1k/3k/6k/12k/14k/16k + a preamp gain) and a
   `StereoPannerNode` for balance. Expose `control.setEq(bandIndex, gainDb)` / `setPreamp` /
   `setBalance` / `setEqEnabled`. Wire `wsz.js mountEq`'s band drag + the procedural EQ sliders
   to call them. NOTE: the capture graph keeps the tab audible via `getDisplayMedia`; the EQ
   must sit on the path that reaches `destination` (re-architect so the audible path is filtered,
   not just the analysis branch).
2. **State sync.** Read YTM's actual shuffle/repeat (`aria-pressed` / class on the player-bar
   buttons) and volume (`video.volume`), and reflect them on the UI toggles each tick — instead
   of toggling blind. (Like-state already syncs via `readLikeStatus()`.)
3. **Keyboard shortcuts.** Global handlers for classic Winamp: `Z X C V B` = prev/play/pause/
   stop/next, `Space` = play/pause, `←/→` = seek ±5s, `↑/↓` = volume, `L` = focus Library search.
   Guard against firing while typing in inputs (the existing keydown guard pattern).

---

## 6. Gotchas worth keeping

- **CDP `Runtime.evaluate`** returns the value at `result.result.value` (NOT `result.value`);
  `returnByValue` on objects is flaky → return `JSON.stringify(...)`.
- **Framed (GEN/PLEDIT) titlebar must be `flex: 0 0 40px`** — otherwise the flex column shrinks
  the gold bar to nothing in shorter windows (was the "floating PLAYLIST title" bug).
- The **close glyph is baked into the GEN/PLEDIT top-right corner sprite** — never draw a second
  `✕`; overlay a transparent hit-area + the pressed sprite on `:active`.
- **Museum `.wsz` download URL:** `https://r2.webampskins.org/skins/<md5>.wsz` (the viewer page
  at skins.webamp.org is just HTML; S3/CDN are gated). Browser UA helps.
- The `.wsz` bitmap font has no alpha → can't cheaply tint it; the nameplate uses vector
  `fillText`, not the skin font.
- VT323 ("NeoAmp LCD") is the only bundled pixel font; it has no bold weight (faux-bold via a
  tiny `text-shadow`).

See also the memory notes: NeoAmp Winamp UI layer, fidelity session decisions, and the
self-render harness entry.
