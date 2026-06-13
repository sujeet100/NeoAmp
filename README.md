# NeoAmp 🎵◢◤

**Winamp / Windows Media Player–style music visualizations, overlaid on YouTube Music.**

NeoAmp is a Manifest V3 Chrome/Arc extension that renders **MilkDrop**
visualizations (via [Butterchurn](https://github.com/jberg/butterchurn)) on top of
YouTube Music, driven by the live audio of the tab. On top of Butterchurn's bundled
MilkDrop presets, NeoAmp ships **hand-authored presets that recreate the classic
Windows Media Player visualizers** — the *Alchemy*, *Battery*, and *Ambience*
families — behind a Winamp-flavored launcher.

> Nostalgic for WMP's swirling Alchemy flower and Winamp's MilkDrop? NeoAmp brings
> that look back, reacting to whatever you're playing.

## Features

- 🌀 **MilkDrop visuals on YouTube Music**, reacting to the live track.
- 🎛️ **Hand-authored WMP recreations** — notably **Alchemy Random**, a 10-scene
  engine (the two-orb "Dance" waveform, dandelion/urchin bursts, spiral arms,
  kaleidoscope lens-bands, hexagon mesh, smoke plumes, comet streaks, spiderweb,
  vertical-comb, landscape strata), plus Battery and Ambience families.
- 🔀 Grouped preset dropdown + ⏮ / ⏭ / 🎲 navigation.
- ⌨️ Launch with the **◢◤ Visualizer** button (bottom-right) or **Shift+V**.
- 🔒 Fully local — no remote code, no tracking; only `music.youtube.com` host access.

## Install (load unpacked)

1. Go to `chrome://extensions` (Arc: `arc://extensions`) and enable **Developer mode**.
2. **Load unpacked** → select this folder.
3. Open <https://music.youtube.com> and play a track.
4. Click the **◢◤ Visualizer** launcher (bottom-right) or press **Shift+V**.
5. In the screen-share dialog, pick **this tab** and **tick "Also share tab audio"**
   — this is required (no audio = frozen visuals; only the *Tab* option exposes the
   audio checkbox).

## How it works

```
content.js  (runs on music.youtube.com)
  getDisplayMedia({video,audio}) → AudioContext → AnalyserNode (fftSize 1024)
  → each frame: postMessage(time-domain bytes) ─┐
                                                 │
viz.html  (sandboxed extension page, fullscreen iframe)
  Butterchurn (WebGL) ◄──── postMessage ◄────────┘  → renders the <canvas>
```

Two deliberate design choices (full rationale in `CLAUDE.md`):

- **Tab capture via `getDisplayMedia`** — `createMediaElementSource` on YouTube's
  `<video>` returns all-zeros due to cross-origin tainting, so NeoAmp captures the
  tab's audio instead (keeping it audible) and analyzes that.
- **A sandboxed iframe for rendering** — Butterchurn compiles MilkDrop equations
  with `new Function`, which needs `unsafe-eval`. MV3 only allows that in a
  **sandboxed extension page**, so Butterchurn runs in `viz.html`.

## Repo layout

| Path | Role |
| --- | --- |
| `manifest.json` | MV3 manifest (content script, sandbox page, CSP, web-accessible resources). |
| `content.js` | Launcher, tab-audio capture, analyser, iframe, audio message pump. |
| `viz.html` / `viz.js` | Sandboxed renderer: Butterchurn init, canvas sizing, controls, render loop. |
| `wmp-presets.js` | Hand-authored WMP-style presets (`window.WMP_PRESETS`). |
| `vendor/*.min.js` | Vendored Butterchurn 2.6.7 core + preset packs. |
| `docs/alchemy-reference.md` | Frame-by-frame analysis of the original WMP Alchemy visualizer. |
| `CLAUDE.md` | Developer notes / architecture gotchas / preset-authoring guide. |

## Contributing

Most of the work is **authoring presets** in `wmp-presets.js`. A preset is a
Butterchurn "converted" object (equations are JS functions, shaders are GLSL
strings). See `CLAUDE.md` for the reverse-engineered authoring rules and the
validate-before-reload workflow (including a headless ANGLE shader-compile check —
GLSL can't be validated by Node alone).

## Credits

- [Butterchurn](https://github.com/jberg/butterchurn) by Jordan Berg — the WebGL
  MilkDrop engine NeoAmp renders with (vendored under `vendor/`, MIT licensed).
- MilkDrop, Winamp, and Windows Media Player are the inspiration; their visual
  *character* is reproduced here, not their code (the originals are proprietary).

## License

[MIT](./LICENSE). Bundled Butterchurn retains its own MIT license.
