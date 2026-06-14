# Alchemy v2 — Resume / handoff note

Snapshot for picking up the Alchemy v2 build in a fresh session. Read this + `README.md`
+ `v2-implementation-plan.md` and you're current. (Auto-memory `MEMORY.md` also loads the
key gotchas.)

## Status (as of this note)

**Committed + pushed to `main`** (4 scenes, all in `wmp-presets.js`, with `FAVORITES` rows
in `viz.js`):
- `Alchemy v2: Orbiters` — small ringed orbs + ONE thin lightning tether + central
  live-waveform flower, over a dusty fbm fluid bg. The approved reference for the kit.
- `Alchemy v2: Kaleidoscope` — central waveform burst mirrored 4-fold over a complex
  colored lens-arc bg; dark pupil center (no drawn flower). Vivid allowed here.
- `Alchemy v2: Anemone Pulsar` — dusty rose anemone (pulses on bass) + 2 flanking orbs,
  over the SOLID-COLOR-SNAP bg mode (cobalt/sage/plum). Muted.
- `Alchemy v2: Vortex` — feedback-generated spiral galaxy (inward pull + radius twist in
  warp); orbs are small glow-discs that streak into spiral arms. Slowed so spin is calm.

**WIP — NOT committed, currently the default startup preset:**
- `Alchemy v2: Wireframe Net` — fake-3D corridor: 3 `netCoil` waveLines forming a funnel
  that converges to an OFF-CENTER vanishing point (`project()` helper, VP 0.62/0.45, camera
  low-left), morphing ordered↔tangle on bass via live-waveform jitter. First render was a
  flat pink "rose" (full-rainbow hue + heavy feedback smear). Last edit: biased hue to
  teal/green and cut feedback (`decay 0.82`, `zoom 1.0`, center 0.5) so the wireframe lines
  show. **Awaiting a screenshot to confirm it reads as a 3D funnel, not a flat whirl.**
  - If it's good → commit it.
  - If still off → likely need a stronger perspective read (e.g. fewer loops, bigger near
    radius, or draw connecting radial spokes between rings), and consider adding the
    orbiters-riding-the-axis (dotted receding trail toward the VP) which v1 omitted.
  - Either way, if leaving it unfinished, set `DEFAULT_PRESET` in `viz.js` back to a
    committed scene (e.g. `"Alchemy v2: Vortex"`).

**Conventions in play:**
- `viz.js` has `DEFAULT_PRESET` — bump it to whatever scene is being actively iterated.
- Dev auto-launch is ON by default (`winamp.js`): first click/keypress starts NeoAmp; the
  getDisplayMedia share dialog still requires that gesture. Disable: `localStorage
  neoamp_autostart=0`.

## Remaining scenes (from the plan)
Supernova (radial urchin, raw-bass extrusion, optional 1-frame color invert), Glowing Ring
+ Fluid (luminous torus over fbm), 3D Ribbon (needs the `project()` camera), Mandala
(nested polygons, hard-edged), orbiters-riding-the-corridor. Optional `Journey` sequencer.

## Hard-won gotchas (don't relearn)
- **≤6 enabled custom waves** render reliably in this build; a 7th silently dropped a wave
  (see `MEMORY` butterchurn-custom-wave-cap). Mirror the 6-wave Orbiters layout; combine
  elements rather than adding waves.
- **Orb trail recipe** (proven in Vortex): a circle-orb makes a chain of rings; a 1px point
  makes a faint *dotted* line (aliased by warp resampling); a small **filled glow-disc**
  (`usedots:1`, ~48 samples filling a ~0.016 disc) makes a continuous bright streak.
- **Muting rule** is HARD for the orb/anemone/net families (dusty + Reinhard tone-map);
  relaxed only for kaleidoscope/supernova. Don't reflexively thicken/brighten on feedback —
  validate against the reference first (see `MEMORY` validate-dont-reflexively-agree).
- **GLSL reserved names**: never declare `ang`/`rad`/`ret`/`uv`/`q*` as locals in
  `shader_body` (use `pr`, `pa`, `pang`, etc.).

## Validation workflow (do BEFORE every reload)
1. `node --check wmp-presets.js && node --check viz.js`
2. Runtime: load the preset, run `frame_eqs` once and sweep every enabled wave's `point_eqs`
   over `sample` 0..1, asserting no NaN in x/y/r.
3. **ANGLE pre-check for shaders** (GLSL can't compile in Node). In Node, wrap the preset's
   `comp`/`warp`: split on `shader_body`, put the pre-`shader_body` part as global helpers,
   splice the body into a `main()` that PREDECLARES the MilkDrop builtins as locals
   (`vec3 ret; vec2 uv=gl_FragCoord.xy/resolution; float rad=...; float ang=...; vec3
   hue_shader; float q1..q32;`) under uniforms `sampler_main, sampler_blur1, sampler_blur2,
   time, bass, bass_att, mid, mid_att, treb, treb_att, frame, fps, resolution`. Then via the
   chrome-devtools MCP (a blank page is fine), create a WebGL context, compile the fragment +
   a trivial vertex shader, `linkProgram`, and read COMPILE_STATUS / LINK_STATUS / info logs.
   This reproduces the reserved-name redefinition trap that a bare wrap would hide.

## Where the user is
Building the composable Alchemy framework (motifs + feedback + bg modes + camera), iterating
each scene from screenshots (we can't see live render). The reference clip is ONE example —
scenes recompose freely; match *character*, not a fixed storyboard.
