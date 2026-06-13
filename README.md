# YT Music — WMP / Winamp Visualizer

A Manifest V3 Chrome extension that overlays **MilkDrop-style WebGL visualizations**
(via [Butterchurn](https://github.com/jberg/butterchurn)) on **YouTube Music**, with a
**"WMP favorites"** menu that maps your remembered Windows Media Player presets to the
closest-matching MilkDrop presets.

This is the **fast / closest-match** route: it reuses the real YT Music player and your
real account, captures the tab's audio for analysis, and renders 368 presets. It does not
re-stream anything, so it stays on the right side of YouTube's terms.

## How it works

```
content script (music.youtube.com)                 sandboxed iframe (viz.html)
  getDisplayMedia ▶ AudioContext ▶ AnalyserNode  ──postMessage(bytes)──▶  Butterchurn.render({audioLevels})
                                                                              ▶ WebGL canvas + controls
```

- **Rendering:** WebGL via Butterchurn (a JS port of Winamp's MilkDrop 2 — the same
  feedback-buffer engine family as WMP's Battery / Ambience / Alchemy).
- **The sandbox, and why:** Butterchurn compiles MilkDrop preset equations with
  `new Function`. Content scripts inherit YouTube Music's strict CSP, which bans
  `unsafe-eval`, so Butterchurn cannot run in the content script. MV3's only context that
  permits `unsafe-eval` is a **sandboxed extension page**, so the visualizer lives in a
  fullscreen sandboxed iframe (`viz.html`).
- **Audio:** the content script captures tab audio via `getDisplayMedia` (which sidesteps
  the cross-origin tainting that makes `createMediaElementSource` on YouTube return silence,
  and keeps the tab audible), reads `AnalyserNode` time-domain bytes each frame, and
  `postMessage`s them into the iframe. The iframe feeds them to Butterchurn's external
  `render({ audioLevels })` API — no audio-node bridging across the frame boundary.
- **Preset curation:** your WMP favorites are matched to Butterchurn presets by keyword at
  runtime, so each favorite button cycles through real, existing presets.

## Install (load unpacked)

1. Open `chrome://extensions`.
2. Toggle **Developer mode** on (top-right).
3. Click **Load unpacked** and select this `ytmusic-wmp-visualizer/` folder.
4. Go to <https://music.youtube.com> and start playing a track.
5. Click the **◢◤ Visualizer** button (bottom-right), or press **Shift+V**.
6. In Chrome's share dialog, pick **this tab** and **tick "Also share tab audio"** — this
   is required, otherwise there's no signal to visualize.

> Works in Chrome / Edge / Brave (Chromium, MV3). Firefox needs minor manifest tweaks.

## Controls

| Action | Key / Button |
| --- | --- |
| Start / stop | `Shift+V`, or the launcher / `✕` button |
| Next / previous preset | `→` or `Space` / `←`, or `⏭` `⏮` |
| Random preset | `R`, or `🎲` |
| WMP favorites | The named buttons in the bar (click again to cycle matches) |
| Exit | `Esc` |

The control bar auto-hides after a few seconds; move the mouse to bring it back.

## WMP favorites → MilkDrop mapping

Closest-match by keyword (matches found in the bundled 368 presets):

| Your WMP preset | Matched by | ~matches |
| --- | --- | --- |
| Dance of the Freaky Circles | circle / ring / orb / sphere / tunnel / bubble | 26 |
| SepiaSwirl | swirl / spiral / smoke / flow / liquid | 26 |
| My Tornado is Resting | vortex / tornado / swirl / whirl / flow | 19 |
| StrawberryAid | plasma / swirl / spiral / melt / candy | 16 |
| Alchemy: Random | fractal / kaleido / mandala / symmetry / geiss | 83 |

These are *vibe* matches (~80% of the nostalgia), not the exact WMP plugins — those were
closed-source Windows DLLs and have never been ported. To get them exactly, see the roadmap.

## Roadmap (higher-fidelity tiers)

- **Exact custom shaders:** build a small ping-pong feedback pipeline (framebuffer + warp +
  palette + FFT uniforms) and hand-author each WMP preset to match a reference video. A
  lightweight shader lib (`regl` / `OGL`) or `three.js` (especially for the 3D Alchemy
  variant) would host this. Battery's real preset parameters live in the Windows registry
  (`HKLM\SOFTWARE\WOW6432Node\Microsoft\MediaPlayer\Battery`) and can guide color/behavior.
- **Winamp skin chrome:** wrap the player controls in a classic Winamp skin via
  [Webamp](https://github.com/captbaritone/webamp), which loads real `.wsz` skins.

## Files

```
manifest.json   MV3 manifest (content script on music.youtube.com)
content.js      launcher + capture + Butterchurn render loop + favorites menu
overlay.css     WMP/Winamp-flavored overlay chrome
vendor/         Butterchurn core + 3 preset packs (vendored; MV3 bans remote code)
```

## Notes / limitations

- The `getDisplayMedia` picker appears once per session and shows a "sharing" indicator —
  acceptable for this PoC. A future version can swap in `chrome.tabCapture` +
  offscreen-document audio for a picker-free start.
- Visualization quality depends on your GPU; Butterchurn is WebGL-heavy.
- Libraries: Butterchurn 2.6.7 and butterchurn-presets 2.4.7 (both MIT).
