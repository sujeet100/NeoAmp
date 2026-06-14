# Implementation Analysis — Segment 1 (0:00–0:13)

Source: OUR Butterchurn preset, 27 frames at 2fps (g_0001=0.0s … g_0027=13.0s),
640×360. Compared against the WMP Alchemy reference spec in
`docs/alchemy-v2/README.md` + `reconciliation.md` and the `keyframes/*.png`.

Reminder on scope: I do NOT penalize a different scene order/content — the impl is
a free-composing framework. I judge framework quality: motif fidelity, motion,
camera, feedback/blur, color discipline, waveform geometry, audio-reactivity feel.

---

## What's on screen

This segment shows **three sub-states that cross-fade continuously** (no hard cuts),
all centered, all flat-2D radial. There is constant heavy frame-feedback the entire
time — the screen is never cleared.

### State 1 — Green radial "iris" starburst tunnel (g_0001–g_0010, ~0.0–4.5s)
- **Background:** near-black at the extreme edges, but the whole frame is flooded by
  a radial spray of fine **green** lines emanating from a small dark central hole
  (an oblate/horizontal dark "pupil"). Color is mid-emerald green with a brighter
  yellow-green core that intensifies over the run.
- **Foreground geometry:** hundreds of very fine, nearly-straight radial filaments
  (a "sunburst" / dandelion of thin lines) packed densely all the way around 360°.
  They read as a single radial spray, not as discrete spokes. There is a small dark
  ellipse at the exact center (the "eye/pupil"), wider than tall.
- **Counts:** one central burst only. No orbs, no rings, no discrete shapes.
- **Motion:** the burst slowly **intensifies and the core brightens** g_0001→g_0009;
  by g_0009–g_0010 a faint **square wireframe grid** (perspective floor/box net)
  fades up behind it, plus wispy cyan smoke at left. Rotation is minimal — the
  spray barely turns; mostly it's a brightness/density pulse. Slow.
- **Camera/perspective:** flat, dead-centered. The dark pupil is the only depth cue
  (a hint of a tunnel mouth), but there's no real vanishing-point travel.
- **Feedback/blur:** strong. The radial lines have soft motion-blur smear along
  their length (decay trails pointing radially). No echo ghosting of discrete
  objects (there are none yet).
- **Waveform geometry:** the radial filaments look like they MIGHT be waveform-driven
  spokes, but at this density and straightness I cannot confirm live-audio jaggedness
  — they read as smooth/procedural radial lines, not visibly jagged zig-zags.
- **Color:** monochrome green + yellow-green core. A thin yellow/olive border frames
  the whole canvas (looks like a persistent edge artifact from feedback wrap).
- **Audio-reactivity feel:** core brightness swells gently — plausibly bass-coupled,
  but subtle. No sharp beat-driven expansion visible.

### State 2 — Magenta/purple petal flower mandala (g_0011–g_0021, ~5.0–10.0s)
- **Transition in:** g_0011 is a hybrid — green burst still center, but red/pink
  hyperbola-like curved lines sweep in forming a bowtie/petal lattice over vertical
  faint stripes. By g_0013 it's a full flower.
- **Background:** very dark green/black with faint **vertical stripes** (the grid
  from State 1, now reading as vertical lines) and a yellow canvas border. A bright
  **green smoke/cloud band** sits at left-center and drifts rightward across frames
  (g_0013 left → g_0019 center → g_0021 right), the one moving "fluid" element.
- **Foreground geometry:** a symmetric **6-petal flower / rosette** of magenta-pink
  loops radiating from center, each petal an elongated lens/leaf outline. Petals are
  hollow line-loops (not filled), with finer nested echo loops inside each (feedback
  ghosting). Very ornate, lots of thin curved filaments.
- **Counts:** ~6 main petals (g_0013–g_0017), growing to ~8 with secondary inner
  petals by g_0019–g_0021. One central bright node where petals meet.
- **Motion:** the flower slowly **rotates** (petal orientation shifts a few degrees
  per frame, g_0013 upright → g_0017 tilted → g_0019 rotated further) and **breathes**
  (petals lengthen/contract). Smooth, continuous, moderate speed.
- **Camera/perspective:** flat 2D radial, perfectly centered & mirror-symmetric.
- **Feedback/blur:** heavy. Each petal drags concentric echo-loops inside itself
  (the nested-loop look is pure frame-feedback with slight zoom). Trails are clean,
  not washed.
- **Waveform geometry:** petal outlines are **smooth curves** — no live-audio
  jaggedness. They look like Lissajous/parametric loops, NOT waveform whips.
- **Color:** magenta/purple-pink petals on dark, plus the green smoke band. This is
  a **green↔magenta** complementary pairing, which matches Alchemy's palette, but
  the magenta here is fairly **saturated/vivid**, edging toward neon.
- **Audio-reactivity feel:** petal length and the central node brightness pulse —
  reads as bass/mid coupled. Reasonable.

### State 3 — Collapse to spiky burst over yellow-fluid corners (g_0022–g_0027, ~10.5–13.0s)
- **Transition:** g_0022–g_0023 the flower petals **straighten into a fine radial
  star/anemone** (the loops unwind into spokes) over a faint curved wireframe
  net (concentric ellipses + radial lines, like a globe/dome wireframe).
- **Background:** dark teal/navy. Large soft **yellow/gold** smoky lobes appear in the
  bottom corners (g_0024) and grow into big yellow curved sweeps occupying the
  left+right thirds (g_0025–g_0026), with a magenta fringe joining them by g_0027.
- **Foreground geometry:** g_0023 = dense purple/magenta radial star (anemone-like)
  with a bright central node; g_0024 the wireframe dome net is prominent; g_0025
  the burst collapses to a soft blue-violet **lens/eye** shape center; g_0026–g_0027
  it's a small dim violet smudge dwarfed by the big yellow corner fluid sweeps.
- **Motion:** rapid morph/collapse — the central structure shrinks while the
  background fluid lobes swell outward. Feels like a "dive/zoom out" moment.
- **Camera/perspective:** still flat-centered; the curved wireframe net (g_0024)
  hints at a 3D dome but it's symmetric, not the asymmetric corridor.
- **Feedback/blur:** very heavy here — the yellow corner sweeps are smeared
  arcs of feedback, soft and large. The center nearly dissolves into blur.
- **Waveform geometry:** the radial star in g_0023 shows the finest hint of
  jaggedness, but still ambiguous — could be procedural.
- **Color:** dark teal bg + gold/yellow fluid + violet center + magenta fringe.
  Muted-ish here (the yellow is soft), closer to the reference's dusty feel than
  State 2's vivid magenta.
- **Audio-reactivity feel:** the big morph reads as a structural/scene change, not
  obviously beat-locked.

---

## Gaps vs reference

### 1. NO ORBITERS — the single biggest gap (Motif A entirely absent)
- **Impl:** across all 13s there is **not one** orb, ringed node, or
  two-orbs-joined-by-a-waveform shape. Only a central burst and a flower.
- **Reference:** the **Orbiters are the WMP signature** and appear in scenes
  A,B,C,D,E,F,G,I — i.e. they should show in this very window. `s03_orbiters_black`
  shows two glowing yellow-green orbs each wrapped in a thin **white "Saturn" ring**,
  dragging stroboscopic dotted trails, joined/tethered by a live waveform line.
  `s09_anemone_pulsar_blue` shows the two ringed orbs flanking the anemone.
- **Fix:** add two `circleWave` orb sprites whose centers walk in `frame_eqs`
  (180° out of phase, elliptical orbit), each with a concentric thin **white**
  ring wave, plus 1 `waveLine` tether between them with perpendicular displacement
  `= a.value1*amp*(0.4+0.6*mid_att)`. This is literally the `Dance of the Freaky
  Circles` pattern in Alchemy colors. Right now the framework is missing its most
  important motif for this era.

### 2. Waveform geometry is synthetic/smooth, not live-audio jagged
- **Impl:** the radial burst spokes and especially the flower petals are **smooth
  parametric curves**. The dense organic jaggedness that defines Alchemy is absent.
- **Reference:** README §IV and CLAUDE.md are emphatic — all three motifs are
  "fundamentally live-waveform geometry — drive jaggedness from `a.value1`, never
  synthetic `sin()`." `s08_green_eye_anemone` and `s09` show furry/whiskery spokes
  that are clearly the 512 live samples giving free dense jaggedness.
- **Fix:** rebuild the radial star/anemone as a `circleWave`/`waveLine` whose spoke
  length/edge is displaced by `a.value1` (perpendicular), not by smooth functions.
  The flower petals could keep parametric base shape but should gain `a.value1`
  edge-jitter scaled by `mid_att` so they look whiskery, not like clean vector loops.

### 3. The flower-mandala state is too clean/ornate & too neon-magenta vs the muted rule
- **Impl:** State 2 is a crisp, highly-decorative magenta Lissajous flower with many
  clean nested loops — beautiful but reads as a generic MilkDrop mandala, fairly
  **saturated magenta**.
- **Reference:** the Alchemy mandala (`s11_mandala_blue`) is a **sparse star-polygon
  of thin pale lines on flat blue**, not a dense saturated flower. And the hard MUTING
  rule applies to Alchemy: "dusty/pastel, tone-mapped (Reinhard `c/(c+k)`), never
  neon." The impl's magenta is brighter/more saturated than the dusty reference.
- **Fix:** (a) desaturate the magenta toward dusty rose/lavender; (b) add a Reinhard
  tone-map `c/(c+k)` in the `comp` shader so the bright petal cores don't read neon;
  (c) thin out the petal count / reduce nested-loop density to feel sparser. If a
  mandala state is wanted, bias it toward the pale-blue star-polygon look of `s11`.

### 4. Backgrounds never SNAP to a flat solid color — a hallmark Alchemy move is missing
- **Impl:** background is continuously dark (black/dark-green/dark-teal) with feedback
  haze the entire 13s. No solid color ever fills the frame.
- **Reference:** Alchemy's signature is **solid flat color that snaps instantly**
  (sage-green @0:47, cobalt-blue @0:52, flat-blue hard cut @1:13.5). `s08` is on a
  **flat sage-green** field; `s09` on a **flat cobalt-blue** field — the geometry
  floats on a solid color, NOT on black-with-trails.
- **Fix:** add a `q`-var-driven solid background color in the `comp` shader that can
  **snap** (instant flip, not fade) to sage-green / cobalt-blue / flat-blue on scene
  events, with feedback `decay≈0` during snaps so the solid renders crisp. Even
  within this segment, swapping the perpetual black for an occasional flat-color
  snap would massively raise fidelity.

### 5. Camera is always flat & centered — no asymmetric 3D corridor
- **Impl:** every state is dead-centered radial. The faint grids (g_0009 box net,
  g_0024 dome net) are symmetric and decorative; there's no perspective travel.
- **Reference:** the intro/corridor era (0:00–0:40) is built on a **3D right-of-center
  vanishing-point corridor, camera low-left** (`s01_light_tunnel` shows a horizontal
  banded corridor receding off-center; `s03_orbiters` shows the wireframe net in
  asymmetric perspective with orbs in the corners). README §IV: "bake the asymmetric
  perspective into the warp; don't center it."
- **Fix:** for corridor/net states, compute `a.x/a.y` in `point_eqs` with a perspective
  divide whose vanishing point is offset right-of-center and low, and add a horizontal
  `dx<0` feedback pan. The Wireframe-Net motif (Motif B) should appear as an
  asymmetric receding mesh, not a centered dome.

### 6. Wireframe Net motif (Motif B) is only a faint decorative grid, not a morphing mesh
- **Impl:** grids appear faintly (g_0009 square grid, g_0024 curved dome) but are
  static backdrops behind the burst, never the dominant feature, and never morph
  ordered↔tangle on bass.
- **Reference:** Motif B is "a mesh of thin faint additive line-segments that morphs
  between an organized symmetric 3D form (two cones joined at bases / radial tunnel)
  and a chaotic tangle, gated on bass," often made of **live waveform `waveLine`s**.
- **Fix:** build the net as many `waveLine`s tracing a parametric funnel
  `(cosθ, sinθ)` with fake perspective, blended toward chaos by `a.value`-driven
  jitter scaled by `mid_att`; gate the order↔tangle blend on `bass`. Thin, low-alpha,
  additive.

### 7. Persistent yellow/olive canvas BORDER artifact
- **Impl:** a thin yellow/olive frame rings the entire canvas in nearly every frame
  (g_0001–g_0021). This looks like a feedback **wrap** edge artifact, not intentional.
- **Reference:** no such border exists; backgrounds are clean to the edge.
- **Fix:** set `wrap = 0` (clamp instead of wrap) and/or darken the comp at the UV
  edges, or ensure the feedback sample stays inside [0,1] so the wrapped edge doesn't
  accumulate. Likely a one-line `baseVals.wrap` fix.

### 8. Feedback is a bit too uniform/heavy — washes detail in State 3
- **Impl:** decay/blur looks fairly constant and on the high side; by g_0025–g_0027
  the central structure dissolves into soft yellow corner-blur and almost nothing is
  legible.
- **Reference:** decay sits ~0.92–0.96 and is **scene-dependent** — biased
  horizontally in corridors, radially in vortex/tunnel, and dropped to near-zero for
  the crisp solid-snap/mandala scenes. The reference keeps geometry **legible** even
  with trails (e.g. the orbs stay crisp).
- **Fix:** make `decay` a `q`-var that changes per state: lower it (~0.90) for the
  burst/star states so spokes stay crisp, raise selectively only where long trails
  are wanted. Add `darken_center` so the core doesn't bloom out.

### 9. No "Saturn" rings / dotted stroboscopic trails
- **Impl:** absent (follows from gap 1). Even the central node has no ring; no dotted
  receding trail anywhere.
- **Reference:** each orb has a thin **white ring** and a **stroboscopic dotted trail**
  of past positions receding toward the vanishing point.
- **Fix:** concentric thin white `circleWave` ring per orb; dotted trail emerges from
  `decay≈0.92` + small `dx<0`/`zoom>1` smear sampling the constant-velocity orb each
  frame (per README Motif A build notes).

### 10. Hue cycling not evident / not energy-coupled
- **Impl:** within 13s the hue is essentially fixed per state (green, then magenta,
  then violet+gold). The change reads as scene-swaps, not a continuous hue drift.
- **Reference:** "Color = continuous hue cycling, energy-coupled" — a slow drift
  around the wheel that **speeds up with audio energy**. Even one state should show
  the hue creeping over ~15–30s.
- **Fix:** drive palette phase off `time` PLUS an audio-energy integrator (accumulate
  `bass+mid+treb` into a `q`-var) so the cycle accelerates in loud passages; mix
  between complementary pairs via `0.5+0.5*sin(phase)`.

### Minor / positive notes
- The **green↔magenta** complementary pairing (States 1→2) and the **green↔gold/violet**
  in State 3 are on-palette for Alchemy — good instinct, just over-saturated in State 2.
- The drifting green smoke band (States 2) and gold corner fluid (State 3) are a decent
  start on the "fluid/topographic swirl" background mode — but they're incidental rather
  than a deliberate fbm field; consider a real `fbm()` `warp`/`comp` background.
- Mirror symmetry of the flower is clean and correct for the 2D-radial regime.
