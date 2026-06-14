# Implementation Analysis — Segment 3 (0:26–0:39)

Frames g_0053–g_0079 (t = 26.0s → 39.0s), our Butterchurn "Alchemy" preset at 2 fps,
640×360. Compared against the reference Alchemy v2 spec (README + reconciliation) and
keyframes s10_swirling_vortex, s12_glowing_ring_fluid, s17_supernova, s18_final_corridor.

This is the final segment; the clip ends at g_0079 (t≈39s).

---

## What's on screen

### Sub-state 1 — "Furry yellow donut / eye" (g_0053–g_0056, 26.0–27.5s)
- **Background:** near-pure black with a faint very-dark olive vignette. No fluid, no
  topographic marbling — flat black.
- **Foreground:** one dominant **furry yellow-green ring** (a donut / "eye") centered
  roughly mid-screen. It is a `circleWave`-style ring whose radius is fuzzed by dense,
  short, **real-waveform spikes** radiating both inward and outward — the jaggedness is
  audio-driven (it changes spike length/density frame to frame), good. Inner hole is a
  clean dark void; a hint of a soft brown/grey lens fills the hole (g_0056). A thin
  whiter sub-ring sits just inside the yellow fur (a Saturn-ring echo).
- **Color:** lemon-yellow fur grading to white at the inner edge, faint green tips. A
  separate **blue waveform strand** snakes through the lower-right and upper-right (a
  second wave instance), distinctly cyan/cobalt against the yellow.
- **Motion:** the ring breathes (radius pulses on bass); the camera is static 2D, no pan.
  Very mild rotation. Frame-feedback is **weak here** — almost no trailing/ghosting of the
  ring, edges are crisp (decay low).
- **Symmetry:** radial, single center. Waveform geometry: REAL (value1-driven fur).

### Sub-state 2 — "Donut skewered by a diagonal beam" (g_0057–g_0061, 28.0–30.0s)
- A **blue/cyan waveform beam** crosses the whole frame on the **NW–SE diagonal**, passing
  directly through the yellow donut — the classic "ring skewered by a waveform string"
  (reference Scene 16). The beam is a `waveLine` with dense real-audio fur along its length,
  bright white at its core where it crosses the donut.
- The donut persists, still furry yellow, but now begins to drift/tilt (the dark hole goes
  slightly oblate, g_0058–g_0059) and slowly shrinks.
- **New element:** faint concentric **spiral whorls / coils** appear at the upper-right and
  lower-left ends of the diagonal (g_0058–g_0061) — overlapping circle echoes that read as
  the *beginnings* of a vortex winding. Multi-hue (blue→green→yellow) along the beam.
- Feedback is **building**: the whorls are clearly frame-feedback echoes (zoom+rot on the
  beam endpoints). Direction of smear is along the diagonal + rotational.

### Sub-state 3 — "Diagonal double-helix / coil tangle" (g_0062–g_0067, 30.5–33.0s)
- The donut **dissolves**; the screen is now dominated by **two thick fuzzy
  waveform-fur ribbons** crossing diagonally, wrapped in **green concentric-circle coils**
  (overlapping rings stacked along the ribbon — a "slinky"/helix look). A warm beige soft
  glow sits center as the only bright bg.
- The coils are dense overlapping circle-echoes (feedback `circleWave` copies); they give a
  rotating, twisting, **coil-around-an-axis** impression rather than a flat field.
- **Color:** olive-green coils + white-cored fur ribbons over black; a dim amber center glow.
- **Motion:** strong twist/rotation; the coils sweep. Camera still 2D-ish but the coiling
  suggests depth. Feedback now medium-strong (the coil stacks ARE the feedback trail).

### Sub-state 4 — "Crossing X of waveform beams" (g_0068–g_0073, 33.5–36.0s)
- Resolves into a giant **X**: two broad **yellow-green fur beams** crossing near center with
  a **bright white/gold star-burst flare** at the crossing point (g_0071–g_0073). This is
  squarely the reference's "giant crossing X of two jagged waveform beams" (Scene 25) and
  the supernova-axes look — and it is the strongest match in the segment.
- Beams are dense real-waveform fur (value1 lacing visible as a knit/mesh texture along each
  beam, g_0069–g_0073). Faint residual coil whorls linger at the left edge.
- **Color:** yellow→olive→faint orange; the central flare blows to near-white (g_0072) — a
  bright radial light-burst with visible rays.
- **Feedback:** the central flare radiates fine **light rays** (a radial blur / godrays
  look). Camera 2D radial.
- **NOTE — capture artifact:** from g_0073 onward the frame is **letterboxed / shrunk**
  (black bars top+bottom, a window title-bar strip at the very top of g_0074+). The render
  window was resized mid-capture; ignore the bars, judge the inset image.

### Sub-state 5 — "Radial god-ray burst → green spiral vortex" (g_0074–g_0079, 36.0–39.0s, ENDING)
- g_0074–g_0075: the X collapses into a **central radial sunburst** — many fine grey/dark
  rays emanating from a single center point (a radial-blur tunnel), with smoky magenta/amber
  clouds at top. Reads like a zoom into the crossing point.
- g_0076–g_0079: a **green spiral / pinwheel VORTEX** spins up — two-armed green logarithmic
  spirals of fine lines winding into the center, with a **magenta/purple core blob** offset
  toward upper-center. The spiral clearly rotates and tightens frame to frame (g_0077→g_0079
  the arms wrap more). This is our "vortex" finale.
- **Color:** spiral arms vivid green; core magenta/purple. Black bg. Fairly **saturated /
  neon**, not muted.
- **The clip ENDS on this spinning green spiral (g_0079)** — it does NOT freeze on a held
  green corridor (reference Scene 31) and does NOT white-out. It cuts off mid-spin.

---

## Gaps vs reference

### 1. The vortex reads as a FLAT PROCEDURAL PINWHEEL, not a spiral galaxy (biggest gap)
- **Impl (g_0076–g_0079):** clean, evenly-spaced green logarithmic-spiral *lines* radiating
  from center — geometric, regular, "drawn." Looks like a 2D pinwheel / `comp`-shader polar
  swirl (constant angular twist applied to a radial line field). The magenta core is a
  separate blob pasted on top. There is little sense of *material being dragged inward*.
- **Reference (s10_swirling_vortex):** the spiral is **feedback-GENERATED** — anemone/net
  filaments smeared by **inward zoom (`zoom<1`) + rotation (`rot`)** so that *existing
  geometry* curves into a galaxy. It has a soft, fluid, depth-y "water going down a drain"
  quality, fine radial striations from the feedback, and a hazy purple/green field, not
  crisp drawn arms. There's a dark central "pupil" the arms wind into.
- **Fix:** stop drawing the spiral as explicit lines. Reuse the segment's existing
  anemone/X waveform geometry and curl it into the vortex via **feedback**: ramp
  `frame_eqs` to `zoom ≈ 0.96` (inward) + `rot ≈ 0.05–0.08` + `decay ≈ 0.95` over ~1.5s, and
  add an **angular twist proportional to radius** in `warp` (rotate UV by `k*pr` where `pr`
  is local radius). The arms should *emerge from the trail*, not be primitives. Add
  `darken_center` so the central pupil forms naturally.

### 2. Background is FLAT BLACK throughout — no fluid / topographic field
- **Impl:** every sub-state sits on pure black (plus a faint center glow). No fbm marbling.
- **Reference:** the ring/vortex family (Scene 9 s12_glowing_ring_fluid, Scene 12) lives over
  a **dark teal/green fluid topographic wash** with soft marbled luminance — the ring glows
  *into* a fluid, not into a void. The black makes ours feel emptier and more "screensaver."
- **Fix:** add a low-amplitude `fbm()` domain-warped wash in `comp`/`warp` (project already
  has an `fbm` helper), very dark teal-green, low saturation, slowly drifting — enough to
  give the void some substance without competing with the geometry. Keep it muted.

### 3. Colors are too NEON / saturated for the Alchemy muting rule
- **Impl:** the donut yellow is bright lemon; the vortex green and magenta core are vivid,
  nearly neon (g_0077–g_0079); the central flare blows to pure white (g_0072).
- **Reference:** ring/anemone/vortex scenes are **dusty/pastel** — the s12 ring is a soft
  desaturated teal-green, the s10 vortex is muted purple/green. Per the HARD Alchemy muting
  rule, additive bloom should tone-map to soft color, never blow to white.
- **Fix:** desaturate the donut (gold→soft amber, pull saturation ~30%), mute the vortex
  green/magenta, and apply Reinhard tone-mapping (`c/(c+k)`) in `comp` so the g_0072 flare
  compresses to warm gold instead of clipping white. The X-flare may stay brighter (supernova
  axes are allowed to be vivid) but should not be pure-white core.

### 4. Donut/torus lacks the Saturn-ring and dotted-trail detail; no fluid lens
- **Impl:** the donut is a single fuzzy fur band with a clean void; the inner whiter ring is
  faint. The hole is empty black (just a hint of brown lens in g_0056).
- **Reference (s12):** the ring has a distinct **soft glowing torus body**, a fine bright
  inner rim, faint **wireframe lattice strands** spanning the aperture, and the whole thing
  glows into the fluid. It feels like a luminous donut with internal structure, not a fur
  ring around a hole.
- **Fix:** add a second concentric thin **white ring `circleWave`** (sharp, low fur) just
  inside the fur for the Saturn rim; add 3–5 faint `waveLine` strands chord-crossing the
  aperture (the lattice); give the hole a dim radial-gradient fill instead of pure black.

### 5. Frame-feedback strength is INCONSISTENT and weak where it matters
- **Impl:** the donut sub-state has almost no trailing (crisp, decay low), while the coil
  sub-state has heavy circle-echo stacking. The transitions feel abrupt because feedback
  isn't continuously carrying the look.
- **Reference:** feedback is the *single most defining trait* and is continuously present
  (decay ~0.92–0.96), biased radially in vortex/ring scenes. Trails should always be softly
  present, ramping up into the vortex, not switching on/off.
- **Fix:** keep `decay` in 0.93–0.96 across the whole segment; raise it slightly and bias it
  radially (inward `zoom<1`) as the vortex spins up. Avoid the near-zero-decay donut frames.

### 6. The "coils" read as discrete stacked rings, not a continuous helix/spiral
- **Impl (g_0062–g_0067):** the green coils are clearly **separate overlapping circle copies**
  (you can count the individual rings) — a feedback echo of a `circleWave` rather than a
  smooth twisting tube. Slightly mechanical.
- **Reference:** equivalent twisting forms are smooth, dense, fluid — continuous filament
  smear, not countable rings.
- **Fix:** increase the orb's per-frame velocity so successive echoes overlap more densely,
  raise wave point count, and lean on `warp` rotational smear rather than literal repeated
  circle draws — so the stack blurs into a continuous coil.

### 7. The ENDING is wrong — cuts off mid-spin instead of holding a corridor
- **Impl:** clip ends (g_0079) on the green spiral still actively spinning/tightening. No
  resolution, no held frame.
- **Reference (Scene 31, s18_final_corridor):** the piece resolves the supernova/vortex into
  a **green one-point-perspective corridor** and then **FREEZES on a held frame** — no
  white-out, no runaway zoom, no endless spin.
- **Fix:** after the vortex peak, transition to a green vanishing-point **corridor** (radial
  perspective lines converging to an off-center point) and damp all feedback/motion to a
  near-hold (`zoom→1`, `rot→0`, geometry static). Don't end on perpetual rotation. (Since
  our preset loops live audio this need not literally freeze, but it should *settle* into the
  corridor rather than spin forever.)

### 8. Missing the smooth morph continuity / scene transitions feel like hard swaps
- **Impl:** donut → coil → X → sunburst → spiral each arrive fairly abruptly; the X-to-
  sunburst (g_0073→g_0075) in particular is a jump.
- **Reference:** these are **continuous morphs** (geometry transforms through), punctuated by
  only a few discrete events. The radial sunburst should grow *out of* the X flare via
  zoom-in, and the spiral *out of* the sunburst via rotation — all carried by feedback.
- **Fix:** crossfade `q`-var weights between motifs over ~1s and let feedback bridge them,
  rather than swapping geometry on/off.

### 9. Central flare is a hard white star-burst, not a soft bloom
- **Impl (g_0072):** the crossing-point flare is a sharp pure-white radial star with hard
  rays — looks like a lens-flare sprite.
- **Reference:** crossing/supernova cores glow but stay colored (green/gold), soft, bloomed —
  not a clipped white star.
- **Fix:** drive the flare via additive bloom + tone-map; tint it gold/green; soften the rays
  (lower their alpha, more of them, blurred) so it reads as energy, not a flare sprite.

### Minor
- A tiny stray white dot persists upper-right across many frames (g_0054–g_0070) — looks like
  a stuck single wave point or UI artifact; verify it's intentional, otherwise cull it.
- The blue beam (sub-state 2) is the only cool color among warm yellows; reference keeps the
  ring family cohesively teal/green — the lone cobalt strand reads slightly off-palette.
