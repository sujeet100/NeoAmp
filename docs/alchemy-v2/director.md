# Alchemy v2 — The Director (composition architecture)

How the final visualization is assembled from the motif kit. Read after `README.md`
(the 31-scene timeline) and `reconciliation.md`.

## How the original WMP Alchemy composes (verified)

Alchemy is a **dynamic, decoupled state machine** — NOT pre-composed scenes stitched
together, and NOT a scripted timeline. Verified three ways (2026-06-17):

1. **SDK archaeology.** WMP visualizers are real-time procedural `IWMPEffects` plug-ins
   (1024-bin FFT + 1024-sample waveform per frame). Named sub-presets are discrete
   `switch(m_nPreset)` branches sharing one per-family engine; "Random" auto-cycles them.
   There is no video-playback path. (Sources in the research pass; Microsoft SDK docs.)
2. **The "Alchemy Random" clip (228s).** Recombines a fixed motif vocabulary (orbiters /
   anemone / net / kaleido-X / terrain / vortex / mandala / ribbon) with a different
   colour+camera+background each time; no loop; ends differently from the 3:06 reference
   clip. Two runs ⇒ two sequences ⇒ dynamic recombination.
3. **Layer independence.** Background snaps sage→cobalt @0:47–0:52 while the SAME anemone
   keeps morphing; in the Random clip the hue sweeps per-frame while orbiter geometry is
   frozen. Four layers on four clocks, not one scene descriptor.

**Four decoupled layers + cadence (measured):**

| Layer | Cadence | Driven by |
|---|---|---|
| COLOUR (hue/wash) | fastest, continuous | energy-coupled (slow when calm, fast when loud) |
| BACKGROUND style | ~5–20s | beat/section cues |
| FOREGROUND motif | ~20–40s | song-structure boundaries |
| CAMERA / feedback | ~40–70s | macro energy arc |

**Transitions:** ~80% continuous MORPHS (params lerp; anemone→vortex by ramping rotational
feedback). Discrete events are rare: ~3 hard CUTS per 3 min (era changes) + a few
background COLOUR SNAPS (one layer, mid-morph, on a beat).

## How we build it (Hybrid — closest to the original)

Butterchurn renders ONE preset at a time (≤4 waves + ≤4 shapes + 1 warp + 1 comp;
switching crossfades for free). So:

- **Tier 1 — in-preset decoupling (the 80% morphing).** Each preset is an ERA whose
  `frame_eqs` runs the decoupled state machine over its layers: a shared energy-coupled
  hue clock, an independent camera driver, a background-mode selector/crossfade, and
  1–2 alpha-crossfading motif waves — each on its OWN clock. The kit's per-frame drivers
  (`alcHueClock`/`alcEnergy`/`alcBeatFlash`/`alcCam*`/the `alc*` bg-field GLSL/motif
  builders) were built for exactly this.
- **Tier 2 — cross-preset cuts (the rare era changes).** `Director` in `viz.js` watches
  audio energy and crossfades between era-presets on an energy-scaled, beat-aligned
  cadence (Butterchurn's free crossfade = the rare hard cut).

Why Hybrid over a single mega-preset: same decoupling fidelity, but each era keeps its
full 4-wave budget (Alchemy is dense). Why over preset-switching-only: that couples all
layers and reproduces only the rare cuts, not the signature morphing.

**T0.2 (gating capability) — RESOLVED:** `q1..q32` reach BOTH warp and comp shaders in
this Butterchurn build (`#define q1 _qa.x` … `q32 _qh.w`, fed per-frame from `frame_eqs`).
So every layer is data-driven from `frame_eqs` — no in-shader schedule mirroring needed.
(This is also why `q1..q32` / `ang`/`rad`/`ret`/`uv` must NOT be redeclared in a
`shader_body` — they are already `#define`d in the generated `main()`.)

## The Director (`viz.js`)

`Director` IIFE — the Tier-2 "when-to-change" brain:
- **feed(bytes,now):** RMS energy from the time-domain bytes → AGC-normalized → a slow
  "vibe" EMA (macro pacing) + a transient/beat onset (energy vs. a ~0.5s local average,
  with sensitivity, silence floor, refractory).
- **tick(now):** on an energy-scaled dwell (calm ≈30s ↔ loud ≈14s), arm a change; fire it
  on the next beat (or after `maxBeatWaitMs`), crossfading to the next era (no back-to-back
  repeats; blend length energy-scaled). `noteLoaded` resets the clock on every load (manual
  or director) so a manual pick gets its full dwell.
- **Off by default** (single-preset screenshot iteration is the norm). Toggle with **`d`**
  in the viz iframe or `postMessage {type:"director:toggle"}`. `window.Director` exposed.
- Era playlist set in `init()` (real era-presets + remaining demos as stand-ins).
- Future refinement: pass bass-band energy from `content.js` for kick-aligned cuts (current
  onset is overall-loudness).

## Era-preset pattern (Tier 1)

`P["Alchemy v2: Era — <name>"]` = `build({feedback baseVals}, { frame, warp, comp })` where
`frame_eqs` advances independent layer clocks into q-vars the shaders read:
- L1 COLOUR → `q8` (hue) via `alcHueClock(hue, dt, max(0,energy-1), base, gain)`.
- L2 CAMERA → q-vars gating a custom `warp` (e.g. q12/q13 = vortex twist+suction), ramped
  on its own slow clock + energy.
- L3 BACKGROUND → q-vars the `comp` reads to `mix()` background fields + a solid-snap index
  flipped on a beat (`alcBeatFlash`).
- L4 MOTIF → a q-var multiplying motif-wave alpha to crossfade layers in/out.
Keep ≤6 custom waves; muted + Reinhard tone-map (`ret = c/(c+k)`) per the Alchemy rule.

**Built (all 4 macro eras, hooked into the Director playlist):**
- `Era — Corridor` (0:00–0:40) — radial-waveform net + orbiters; camera folds into a
  red/green kaleido "X" (q12) over horizon-bands↔black; vivid (kaleido exception).
- `Era — Anemone/Vortex` (0:40–1:16) — anemone fur + tethered orbiters; vortex-dive camera
  (q12/q13); solid-snap↔fluid bg snapping on beats.
- `Era — Mandala/Fluid` (1:16–2:00) — nested counter-rotating N-gon mandalas + diagonal
  waveform line; cleared feedback (crisp); flat-blue↔marble bg.
- `Era — Supernova` (2:48–3:06 finale) — furry urchin (spoke length ∝ RAW bass + beat
  re-bloom) + orbiters; Z-plunge camera; magenta↔lime radial bloom; vivid.

All four are unverified on-screen (mechanically validated only) — tune per-era from the
user's screenshots. The Director sequences between them (Tier 2); each morphs internally
(Tier 1).
