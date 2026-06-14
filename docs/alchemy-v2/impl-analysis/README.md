# Implementation Gap Analysis — current Alchemy preset vs. the framework we want

Frame-by-frame analysis of **our current Butterchurn Alchemy preset** (`~/Desktop/alchemy
my implementation.mov`, 39.5s, captured at 4096×2304/60fps; analyzed at 2fps → 79 frames),
compared against the reference framework in [`../README.md`](../README.md) /
[`../reconciliation.md`](../reconciliation.md) and the reference [`../keyframes/`](../keyframes/).

- **Per-segment detail:** [`section_1.md`](section_1.md) (0:00–0:13) · [`section_2.md`](section_2.md)
  (0:13–0:26) · [`section_3.md`](section_3.md) (0:26–0:39).
- **⭐ Highest-priority input:** [`user-notes-and-gemini.md`](user-notes-and-gemini.md) — the
  **user's own live observations** (the authoritative priority list: blurry/laggy/sparse,
  thick-fuzzy tether vs single lightning line, drawn flower vs waveform flower, orb:line ratio,
  too-black backgrounds) plus a reconciliation of the second Gemini gap report (whose "missing
  FBO loop" premise is **false** for Butterchurn). **Read that doc's section C for the
  re-ranked priorities.** Key frames are not committed — regenerate via [`../keyframes.md`](../keyframes.md).

> **Scope (per the user's framing): the reference clip is ONE example. The preset is a
> framework — scenes can be composed in any order.** So we do **not** penalize different
> scene order or different scene content. We judge the **framework**: are the motif
> primitives, feedback engine, camera/coordinate system, color discipline, waveform
> geometry, and audio-reactivity *capable and faithful* enough that any composition reads
> as Alchemy? The gaps below are framework-level capabilities that are missing or weak.

---

## What the implementation currently is

A continuous, **always-centered, flat-2D-radial** feedback piece that morphs through ~5
states with no hard cuts, all on a near-black background:

1. **0:00–4.5s** — green radial "iris" starburst tunnel (dark central pupil, dense fine green spray).
2. **5–10s** — magenta/purple 6–8 **petal flower mandala** (smooth Lissajous loops, rotating/breathing).
3. **10.5–13s** — collapse to a spiky star over soft **gold-corner fluid** lobes.
4. **13–21s** — off-center **swirl/net** (green concentric arcs + magenta feather brush), slow hue drift.
5. **21.5–28s** — furry **"anemone eye" donut** (teal→green→yellow), real-audio corona — *the strongest, most faithful state.*
6. **28–36s** — donut **skewered by a diagonal waveform beam** → diagonal **coil tangle** → giant crossing **X** of fur beams with a white central flare (good "supernova axes" match).
7. **36–39s (end)** — radial god-ray burst → **green spiral pinwheel vortex** with a magenta core; **cuts off mid-spin.**

**Genuine strengths to keep:** the anemone-eye corona, the X fur-beams, and the donut fur
are **real `a.value1`-driven waveform geometry** (the defining WMP texture). Color is
**mostly muted/dusty**, hue drifts slowly, and there's no persistent white-out. Mirror
symmetry in the radial regime is clean. The diagonal-beam-through-ring and crossing-X are
strong, on-spec motifs.

---

## The gaps, by framework capability (prioritized)

Each of the 3 independent segment analyses surfaced the same top issues — high confidence.

### 🔴 CRITICAL — capabilities the framework is missing entirely

**G1. The Orbiters motif (Motif A) does not exist anywhere.**
All three segments flag this as the #1 gap. There is not a single orb, thin white "Saturn"
ring, stroboscopic dotted trail, or the **two-orbs-joined-by-one-live-waveform** tether —
which is *the* WMP Alchemy signature (and the thing our own `Dance of the Freaky Circles`
already nails). A framework that can't render the Orbiters can't read as Alchemy no matter
how scenes are composed.
*Fix:* port the `Dance` machinery as a reusable layer — two `circleWave` orbs whose centers
walk opposing ellipses in `frame_eqs` (180° out of phase, `radius ∝ 0.04+0.03*bass_att`),
each with a concentric **thin near-white ring** wave, plus **1 `waveLine` tether** between
them displaced by `a.value1*amp*(0.4+0.6*mid_att)`. The dotted receding trail falls out of
`decay≈0.92` + small `dx<0`/`zoom>1` sampling the moving orb each frame.

**G2. No 3D / perspective coordinate regime — everything is flat and centered.**
The framework only has one camera: dead-center 2D radial. The reference's entire
intro/corridor/ribbon/terrain family needs a **3D corridor with a right-of-center,
low-left vanishing point** (asymmetric perspective; trails *recede and shrink*). Faint
grids that appear are symmetric decorative backdrops, not a navigable space.
*Fix:* add a perspective-divide path for `point_eqs` (`(x,y)` projected toward a vanishing
point ~`(0.62,0.45)` with a `1/(1+z*k)` divide) usable by the net/ribbon/orbiter-trail
layers, plus a horizontal `dx<0` feedback pan biased toward that point. This is a new
*coordinate mode* the framework lacks.

**G3. The vortex is a DRAWN procedural pinwheel, not a feedback-generated spiral.**
The ending vortex is evenly-spaced spiral *lines* with a pasted-on core — a polar `comp`
swirl. The reference vortex is **existing geometry dragged inward** by `zoom<1` + `rot` +
radius-proportional warp twist ("water down a drain"), forming a dark central pupil.
*Fix:* don't draw spiral primitives. Curl the *current* anemone/X geometry into a vortex
via feedback: ramp `zoom≈0.96` (inward) + `rot≈0.05–0.08` + `decay≈0.95` over ~1.5s, add an
angular twist `∝` local radius in `warp`, and `darken_center` for the pupil. The vortex
should be a **feedback behavior**, not a shape — a reusable framework capability.

### 🟠 IMPORTANT — capabilities that exist but are weak/degraded

**G4. Waveform geometry is only *half* real-audio.** The later states (anemone corona, X
beams, donut fur) are genuinely `a.value1`-driven — good. But the **early** states (the
green iris spray, the magenta flower petals, the spiral arms) are **smooth synthetic
parametric curves**. Per CLAUDE.md this is the cardinal rule: *all* geometry's jaggedness
should come from live samples, never `sin()`. *Fix:* rebuild the burst/flower/spiral edges
with `a.value1` perpendicular displacement (scaled by `mid_att`) so everything is whiskery.

**G5. No background variety — perpetually black.** The framework has exactly one background:
black-with-feedback-haze. It lacks the three reference background *modes*: (a) **solid flat
color that SNAPS** instantly (sage-green, cobalt-blue) — a hallmark Alchemy move done with a
`q`-var bg color + `decay≈0` during the snap; (b) **fbm fluid/topographic wash** (the ring/
vortex family glows *into* a dark teal-green fluid, not a void) — the project already has an
`fbm` helper; (c) the **horizontal banded corridor**. Add these as selectable comp-shader
background modes.

**G6. The Wireframe Net (Motif B) is degraded to soft concentric arcs / decorative grids.**
It never reads as a structured mesh of straight crisscrossing segments ("two funnels joined
at the base") and never **morphs ordered↔tangle on bass**. *Fix:* render it as many straight
`waveLine`s on a parametric funnel with perspective divide, with `a.value`-driven jitter
`*mid_att` gating the order→chaos morph on `bass`.

**G7. Feedback is not scene-aware — uniform/heavy in places, near-zero in others.** The
single most-defining Alchemy trait is applied inconsistently (heavy haze in early states
washing detail; almost no trailing on the donut; abrupt switches). *Fix:* make `decay`/`zoom`/
`rot`/`dx` **`q`-vars driven by the active scene** (the §2 feedback table in
`reconciliation.md`): ~0.90 + radial for crisp bursts, ~0.95 + `zoom<1` for vortex, ≈0 for
solid-snap/mandala, horizontal-biased for corridors.

**G8. Color discipline slips toward neon in several states.** The magenta flower, the vortex
green/magenta, and the white central flares break the **hard muting rule**. *Fix:* desaturate
those hues to dusty rose/sage; apply Reinhard `c/(c+k)` tone-mapping in `comp` consistently so
additive cores compress to soft color, never pure white. (Supernova axes may stay vivid — match
per scene.)

### 🟡 POLISH — artifacts and missing detail

- **G9. Persistent yellow/olive border vignette** rings the canvas in many frames — looks like
  a feedback **wrap** edge artifact. *Fix:* `wrap=0` (clamp) and/or darken comp at UV edges.
- **G10. Stray white dot** stuck upper-right across many frames — likely a stuck wave point; cull it.
- **G11. No Saturn rings / dotted trails** anywhere (follows from G1) — add thin white ring waves + feedback-sampled trails.
- **G12. Coils read as countable stacked circle-echoes**, not a continuous helix — raise orb velocity/point-count and lean on `warp` rotational smear instead of repeated circle draws.
- **G13. Hue cycling not visibly energy-coupled** — drive palette phase off `time` **plus** an audio-energy integrator (`q`-var accumulating bass+mid+treb) so it accelerates in loud passages.
- **G14. Central flares are hard white lens-flare sprites** — drive via additive bloom + tone-map, tint gold/green, soften/multiply the rays.
- **G15. Transitions feel like hard swaps**; the ending cuts off mid-spin. *Fix:* crossfade `q`-var motif weights over ~1s and let feedback bridge; have the finale **settle into a corridor** rather than spin forever.

---

## What this says about the framework (the headline)

The current preset is essentially **one motif family done well (Anemone/Motif C + waveform
beams) plus a generic-MilkDrop mandala/pinwheel**, all in **one camera (flat-centered)** and
**one background (black)**. To become the *framework* we want, it needs, in priority order:

1. **The Orbiters layer (G1)** — the missing signature motif; we already have it in `Dance`.
2. **A perspective/3D coordinate mode (G2)** — so corridor/ribbon/net scenes can exist.
3. **Feedback-as-behavior, scene-driven (G3, G7)** — especially the vortex; feedback is 80% of the look and must be parameterized per scene, not constant.
4. **Background modes (G5)** — solid-snap, fbm fluid, banded corridor — as a selectable layer.
5. **Make all geometry live-audio (G4)** and **enforce muting + tone-map globally (G8)**.

Get those five framework capabilities right and the existing good motifs (anemone, X-beams,
donut) plus a proper Orbiters layer can be **composed into any Alchemy scene** — which is the
actual goal. Detailed, scene-by-scene evidence and concrete Butterchurn fixes are in the three
`section_*.md` files.

*(Capture caveats noted by the analysts: the render window was resized mid-clip from ~g_0073,
adding letterbox bars + a title strip — ignore those, judge the inset. Frames are at
`/tmp/impl_frames/` and re-extractable.)*
