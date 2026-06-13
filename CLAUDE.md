# CLAUDE.md — YT Music WMP/Winamp Visualizer

Context for working on this project. Read this fully before making changes.

## What this is

A **Manifest V3 Chrome/Arc extension** that overlays **Winamp/WMP-style music
visualizations on YouTube Music**. Rendering is done with **Butterchurn** (a
WebGL/MilkDrop visualizer). On top of the bundled MilkDrop presets, we
hand-author **custom presets that recreate specific Windows Media Player
visualizations** (Battery, Ambience, Alchemy families) — that recreation work is
the bulk of the effort.

Goal: the user is nostalgic for WMP's Battery/Ambience/Alchemy visualizers and
Winamp skins. We reproduce those looks as Butterchurn presets driven by the live
YouTube Music audio.

## How to run / test (manual — there is no automated UI test)

1. `chrome://extensions` (Arc: `arc://extensions`) → enable **Developer mode** →
   **Load unpacked** → select this folder. After editing the manifest, click the
   **reload** (↻) icon; after editing JS, reload the extension **and** the tab.
2. Open <https://music.youtube.com>, play a track.
3. Click the **◢◤ Visualizer** launcher (bottom-right) or press **Shift+V**.
4. In the share dialog pick **this tab** and **tick "Also share tab audio"**
   (required — no audio = frozen visuals; only the *Tab* option exposes the audio
   checkbox, not Entire Screen).
5. Click the favorite buttons to switch presets. Console logs are prefixed
   `[WMP-viz]`.

We (Claude) **cannot see the live render** — iterate by asking the user for
screenshots. Validate code with Node before asking them to reload (below).

## Architecture & the load-bearing gotchas

```
content.js  (runs on music.youtube.com, page CSP applies)
  getDisplayMedia({video,audio}) → keep audio track → AudioContext
  → gain(1.8) → AnalyserNode(fftSize 1024) → muted gain → destination
  → each frame: getByteTimeDomainData → postMessage(Uint8Array) ─┐
                                                                  │ (1KB/frame)
viz.html  (sandboxed extension page, loaded as a fullscreen <iframe>)
  Butterchurn (needs unsafe-eval) ◄───── postMessage ◄───────────┘
  → render({ audioLevels: { timeByteArray, timeByteArrayL, timeByteArrayR } })
  → WebGL <canvas> + the favorites control bar
```

**Why the sandboxed iframe (do not "simplify" this away):** Butterchurn compiles
MilkDrop equations with `new Function`. MV3 forbids `unsafe-eval` in content
scripts (and they inherit YouTube Music's strict CSP). The **only** MV3 context
that allows `unsafe-eval` is a **sandboxed extension page** (`manifest.sandbox`
+ `content_security_policy.sandbox`). So Butterchurn runs in `viz.html`,
embedded as an iframe by the content script. `viz.html` + scripts are in
`web_accessible_resources`.

**Why getDisplayMedia (not the obvious approach):** `createMediaElementSource`
on YouTube's `<video>` returns **all zeros** (cross-origin tainting). Tab capture
via `getDisplayMedia` avoids that and keeps the tab audible. The audio analysis
runs in the content script; only the FFT byte arrays cross into the iframe.

**Canvas sizing (caused a long "blurry/corner-cropped" bug):** This Butterchurn
build (2.6.7) does **NOT** resize the `<canvas>` you pass it — it stays at the
HTML default **300×150**. You must set `canvas.width/height = clientWidth*dpr`
**yourself**, and pass that same pixel size to `createVisualizer` with
`pixelRatio: 1` so buffer == render target == output viewport. See `setSize()`
in `viz.js`. Symptom if wrong: content fills only a corner and/or is blurry.

## Files

| File | Role |
| --- | --- |
| `manifest.json` | MV3 manifest: content script on `music.youtube.com`, `sandbox` page, sandbox CSP (allows `unsafe-eval`/`wasm-unsafe-eval`), `web_accessible_resources`. |
| `content.js` | Launcher button, `getDisplayMedia` capture, `AnalyserNode`, creates the iframe, pumps audio bytes via `postMessage`. |
| `viz.html` | Sandboxed page: `<canvas>` + control bar + script includes (vendor, `wmp-presets.js`, `viz.js`). |
| `viz.js` | Butterchurn init, canvas sizing, favorites menu, keyboard, message handling, render loop. `FAVORITES` array defines the buttons. |
| `wmp-presets.js` | Hand-authored custom presets + helpers; exposes `window.WMP_PRESETS`. **Most preset work happens here.** |
| `overlay.css` | Launcher button, fullscreen iframe, toast styling. |
| `vendor/*.min.js` | Butterchurn 2.6.7 core + 3 preset packs (2.4.7). Vendored locally — MV3 bans remote code. |

## Butterchurn preset authoring (the reverse-engineered rules)

A preset is an object in Butterchurn's **converted** format. Use the `build()`
helper in `wmp-presets.js`:

```js
P["Name"] = build(baseValsOverrides, { frame: fn, pixel: fn, init: fn, warp: glsl, comp: glsl });
```

- **Equations are JS FUNCTIONS, never strings.** `frame_eqs(t)` gets audio on
  `t`: `t.bass, t.bass_att, t.mid, t.mid_att, t.treb, t.treb_att` (≈0..2;
  `_att` = smoothed), `t.time` (sec), `t.frame`. Mutate `t` and `return t`.
- **Custom waves** (multiple shapes): set `preset.waves[i] = circleWave("qx","qy")`
  or `waveLine()`. For an **enabled** wave, `point_eqs` MUST be a **function**
  (Butterchurn skips `*_str` compilation for converted presets, and the draw loop
  only runs `point_eqs` when it isn't `""`). The point object `a` has:
  `a.sample` (0..1 along the wave), `a.value1/value2` (waveform samples),
  `a.x/a.y` (output, 0..1, **0.5 = center**), `a.r/g/b/a` (color), and any
  `a.q1..a.q32` you set in the main `frame_eqs` (they propagate to waves).
- **baseVals quick ref:** `wave_mode` (0 = circular waveform), `wave_r/g/b/a`,
  `additivewave` (1 = glow), `wave_scale`, `wave_smoothing` (0 jagged..1 smooth),
  `decay` (0.9..0.99 = feedback trail length), `gammaadj` (~1..3 brightness),
  `zoom` (>1 outward, <1 inward), `rot`, `warp`, `cx/cy` (center), `dx/dy`,
  `echo_alpha/echo_zoom/echo_orient`, `darken_center`, `wrap`, `wave_dots`.
- **Shaders** (`warp`, `comp`) are GLSL `shader_body { ... ret = ...; }` strings.
  Available uniforms: `time, bass, bass_att, mid, treb, treb_att, frame, fps,
  resolution` (vec2), `sampler_main` + `texture2D(...)`. You may define **helper
  functions before** `shader_body` (e.g. `AMBER_RAMP`, `pal`, `fbm`, `ctr`).
  **GLSL gotcha:** don't assign to `uv` (treat it as read-only) — copy into a
  local `vec2`. Aspect-correct with `d.x *= resolution.x/resolution.y` (else
  circles render as ovals).
  **GLSL gotcha (reserved names — caused a silent "program not linked"):**
  `shader_body` is spliced into a generated `main()` that ALREADY declares the
  MilkDrop pixel builtins as locals — notably **`ang`** (pixel angle) and **`rad`**
  (radius), plus `ret`, `uv`, `hue_shader`, `time`, `bass…`, `q1..q32`. Declaring
  your own `float ang`/`float rad` in `shader_body` is a **redefinition** →
  fragment fails to compile → the whole comp/warp program never links (you only
  see opaque `getUniformLocation: program not linked` warnings, not a clear
  error). Name your locals anything else (`pang`, `pr`, …). Function PARAMETERS
  named `ang`/`rad` are fine (they shadow in their own scope).
- **Helpers in `wmp-presets.js`:** `build`, `circleWave(qx,qy)`,
  `waveLine()`, `WAVE_BASE`, `SHAPE_BASE`, `AMBER_RAMP` (yellow ramp GLSL),
  and inline `pal`/`fbm`/`ctr`/`hash21`/`vnoise` GLSL helpers used by Alchemy.

### Validate before every reload

```bash
node --check wmp-presets.js && node --check viz.js && node --check content.js
# structural + runtime check of presets (catches missing fields / throwing eqs):
node -e 'global.window=global; require("./wmp-presets.js");
  for (const [n,p] of Object.entries(window.WMP_PRESETS)) {
    p.frame_eqs({time:2,bass:1.3,bass_att:1.1,mid:1,treb:1,treb_att:1});
    console.log("ok", n);
  }'
```

GLSL **cannot** be compiled in Node — shader errors only show at runtime. Each
preset is independent: a broken shader only fails when that favorite is clicked;
startup loads "Dance of the Freaky Circles" (known-good).

**Two ways to actually see GLSL errors (use these — guessing wastes rounds):**

1. **In-browser compiler log (best for the real failure).** `viz.js` installs a
   `compileShader`/`linkProgram` hook on the WebGL prototypes that prints the
   driver's error + the **numbered source** to the iframe console, prefixed
   `[WMP-viz shader]`. So a bad preset shader now reports e.g.
   `ERROR: 0:194: 'ang' : redefinition` instead of a black screen. (To see it:
   DevTools console → switch the context dropdown from `top` to the `viz.html`
   frame.) Keep this hook — it's the only window into GLSL errors.
2. **Headless ANGLE pre-check (validate BEFORE asking for a reload).** Extract a
   preset's `comp`/`warp` string in Node, wrap it as a standalone fragment, and
   compile+link it through the *same* compiler Chrome uses (ANGLE) via the
   chrome-devtools MCP. Crucial: **mimic Butterchurn's generated `main()`** — start
   the body with predeclared locals (`vec3 ret; float rad=…; float ang=…;`) or you
   WON'T reproduce the reserved-name redefinition (a bare wrap compiles fine and
   hides the bug). Then `createProgram`+`linkProgram`+`validateProgram` in both
   `webgl`/`webgl2` and read `getShaderInfoLog`/`getProgramInfoLog`. This caught
   and confirmed the `ang` fix end-to-end without a single reload.

## Current state

**Done & committed (`git log`):** Dance of the Freaky Circles (two orbiting
waveform circles — the best one, use it as the reference pattern), and batch 1:
Alchemy Random, Ambience Thingus/Water/Down the Drain, Battery relatively
calm/strawberryaid/my tornado is resting.

**ALL Alchemy/Battery/Ambience presets are now built** (30 added in one batch via
parallel subagents, then a frame-by-frame color-correction pass — see below).
Reachable from the `viz.js` `FAVORITES` dropdown and the ⏮/⏭/🎲 navigation.

**Quality notes:** Dance is the reference. **Alchemy Random was rewritten** from a
dedicated 228s video (`Alchemy Random Media Player 480p.mp4`): it is now a
real-audio engine — TWO pulsing ringed circles (`circleWave`) that orbit between
opposite corners and center, joined by an oscilloscope **waveform line** (custom
`waveLine` point_eqs marching A→B with perpendicular sample displacement), plus a
central bass-spiked rosette — composited over a 4-scene crossfading shader
background (kaleidoscope lens-bands / filament-flower free-space / perspective
tunnel / wallpaper tiling), rainbow-cycling. The two-circles-joined-by-waveform is
the WMP signature (essentially "Dance" in Alchemy's colors). Still "captures the
spirit," not frame-exact. Most other new presets are unproven on-screen — iterate
from the user's screenshots.

**Color behavior (re-researched frame-by-frame from the video — the earlier
"Ambience is all amber" note was WRONG):** Many presets **slowly cycle hue over
time** (a ~15-60s drift, easy to miss in a short clip — confirm over a long span,
not one frame). Implement cycling with a slow `0.5+0.5*sin(time*~0.05)` mix
between two colors (or `tintComp(colA,colB,speed,boost)` / `pal()` for rainbow).
- **Cycles:** Alchemy Random (full rainbow), Battery chemicalnova (full rainbow),
  Battery relatively calm (green↔blue), Battery strawberryaid (red↔berry/pink),
  Battery cottonstar (white↔teal), Battery dandelion (teal↔magenta),
  Ambience Niagara (teal↔blue), Ambience Blender (blue↔purple),
  Ambience Bubble (magenta↔teal), Ambience Warp (blue↔yellow),
  Battery back to the groove (teal↔yellow-green).
- **Fixed hue (per the frames):** Ambience is **not** uniformly amber — Anon/
  Falloff/Water/Down-the-Drain/Snell are amber/yellow, but **Dizzy & Windmill are
  cyan/teal**, **X Marks the Spot is magenta/pink**. Battery: brightsphere cyan,
  drinkdeep blue, event horizon red/orange, **hzodge green/teal**, illuminator
  amber/gold, i-learned-the-truth blue+gold, **kaleidovision GREEN (not rainbow)**,
  lotus magenta/purple, green-is-not-your-enemy green, sleepyspray blue/teal,
  **spider's-last-moment GREEN**, the-world blue.
- **Greyscale:** Battery my tornado, Battery smoke or water?.

**Remaining WMP presets to build:** none in scope — all Ambience (Snell, Warp,
Anon, Falloff, Bubble, Dizzy, Windmill, Niagara, Blender, X Marks the Spot) and
Battery (brightsphere, cominatcha, cottonstar, dandelion, drinkdeep, elektrination,
event horizon, hzodge, sepalvel, illuminator, i learned the truth, kaleidovision,
chemicalnova, lotus, green is not your enemy, sleepyspray, smoke or water?,
spider's last moment, the world, back to the groove) are built. Out of scope:
Bars & Waves / Plenoptic / Particle / Spikes. Remaining work is tuning from
screenshots, not new presets.

**Preset selector** is a compact grouped `<select>` dropdown in `viz.html`/`viz.js`
(not a button bar — that covered the visuals); it syncs with ⏮/⏭/🎲.

## Reference assets & frame-extraction workflow

Reference videos live in `~/Downloads/` (user-provided). The richest is
**`Windows Media Player Visualisations.mp4`** (~11.5 min, English WMP, the
preset name shows bottom-left of the viz pane). Workflow used:

```bash
# extract frames, crop the WMP viz pane (640x480 source: pane ≈ x58 y92 w300 h285)
ffmpeg -ss <t> -t <dur> -i "$V" -vf "fps=4,crop=300:285:58:92,scale=iw*1.5:ih*1.5" out_%02d.png
# read the green preset-name label (English collection): crop y≈378
ffmpeg -i frame.png -vf "crop=300:18:58:378,scale=iw*2:ih*2" label.png
# montage many frames to scan at once:
ffmpeg -i out_%02d.png -vf "scale=240:180,tile=6x8" -frames:v 1 montage.png
```

Scratch frames were kept under `/tmp/` (not committed). Re-extract as needed.

## Working agreements (learned the hard way this project)

- **Commit before any big preset change.** Reverting uncommitted shader rewrites
  meant reconstructing code from memory — painful. Small commits = easy
  `git revert`.
- **Prefer small, targeted tweaks over rewrites** for presets the user already
  likes. Rewrites repeatedly made Alchemy *worse*.
- **Iterate via the user's screenshots**; state clearly what changed each round
  and ask one focused question.
- **Be honest about fidelity ceilings** — the original DLLs are proprietary; we
  match *character* (color, motion, symmetry, audio-reactivity), not pixels.
- The user's key insight that unblocked good visuals: **real audio-waveform
  geometry** (drawing the waveform via custom waves, like Dance) looks far more
  "WMP" than procedural noise.
- **Terminology — "zigzag line" / "lightning line" / "jagged line" ALWAYS means a
  real audio waveform**, NOT an artificial `sin()` zig-zag. Drive the displacement
  from `a.value1`/`a.value2` (the live samples), like Dance's `waveLine` — the
  512 real samples give the dense jaggedness for free. Apply the same to any shape
  (orb rings, urchin filaments): prefer real-waveform displacement over synthetic.
- **Colors MUST stay MUTED** (the user repeats this — it is a hard requirement).
  The original is dusty/pastel: muted backgrounds AND muted-but-colored geometry
  (soft gold/lavender/sage), never neon and never blown out to flat white.
  Techniques: desaturate hues (don't use full-saturation cosine palettes), keep
  the background wash low-saturation, and **tone-map the final** (Reinhard
  `c/(c+k)`) so additive/bloom highlights compress to soft color instead of pure
  white. If it looks neon or white, it's wrong.

## Best practices for this codebase

### Chrome extension / MV3
- **No remotely-hosted code** (MV3 bans it) — keep all libs vendored in `vendor/`.
- **No inline scripts** in extension pages (CSP) — all JS in separate files.
- **Least privilege:** keep `host_permissions` to `music.youtube.com`; add
  permissions only when needed.
- **Service workers are ephemeral** (if one is added later): don't keep state in
  globals — use `chrome.storage`; return `true` from `onMessage` if responding
  async. (This project currently has no service worker by design.)
- **Separate concerns** by context: content script (capture + DOM) ↔ sandboxed
  page (render) ↔ (future) popup/options. Communicate via `postMessage`;
  validate `event.source`/`event.data` before acting.
- Validate the manifest loads cleanly (`chrome://extensions` shows no errors)
  after every manifest edit.
Sources: [Chrome MV3 overview](https://developer.chrome.com/docs/extensions/develop/migrate/what-is-mv3),
[MV3 CSP issues](https://medium.com/@python-javascript-php-html-css/resolving-content-security-policy-issues-in-chrome-extension-manifest-v3-4ab8ee6b3275).

### JavaScript / clean code
- **Small, single-purpose functions**, one level of abstraction each; extract
  when they grow (see `setSize`, `circleWave`, `waveLine`).
- **Intention-revealing names** — a long clear name beats a short name + comment.
- **Fail fast & handle expected failures:** validate inputs early; surface errors
  to the user (the on-screen `toast()`) with actionable text, and `console.error`
  with context (we prefix logs `[WMP-viz]`). Each preset is isolated so one
  failure can't take down the rest.
- **Comments explain *why*, not *what*** — note constraints/gotchas (e.g. the
  canvas-sizing and CSP comments), not restating the code.
- **Keep shader strings readable**: one GLSL statement per concatenated line,
  trailing `\n`, helper functions named (`pal`, `fbm`, `ctr`).
- **Match the existing style** (`var`/function-based, ES5-ish in `wmp-presets.js`
  so the preset objects stay simple and copy-paste-able).
Sources: [JS clean code 2025](https://saigontechnology.com/blog/clean-code/),
[clean code checklist](https://alldaystech.com/guides/software-development/clean-code-best-practices).

## Quick orientation for a fresh session
1. Read this file + skim `wmp-presets.js` (`build`, `circleWave`, `waveLine`,
   and the `Dance of the Freaky Circles` preset — the canonical good example).
2. To add a WMP preset: study its reference frames, author a `P["..."]` entry,
   add a `{ label, wmp: "..." }` to `FAVORITES` in `viz.js`, validate with Node,
   ask the user to reload + screenshot, iterate with small tweaks, commit.
