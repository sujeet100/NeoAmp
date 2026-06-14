# Segment A — 0:00–0:22

Frame source: `/tmp/alchemy_frames/f_NNNN.png`, 2 fps, 640x360. time = (NNNN-1)*0.5.
Range covered: f_0001 (0.0s) through f_0045 (22.0s). Every frame in range was read.

Note on chrome: frames up to ~f_0023 still show the WMP player transport bar at the
bottom-center and a green Italian "Registrazione in corso" (recording-in-progress)
badge top-right. These are screen-capture overlays, NOT part of the visualization, and
must be ignored for the preset. From ~f_0024 onward the capture is full-bleed (no chrome),
so those frames are the most trustworthy for color and geometry.

---

## Scene map (timestamps & transition types)

| Scene | Frames | Time | Name | Transition in |
| --- | --- | --- | --- | --- |
| 0. Black intro | f_0001–f_0011 | 0.0–5.0s | Loading / silence | — |
| 1. Perspective Light-Tunnel | f_0012–f_0017 | 5.5–8.0s | "Lens-Bands + Red Rain" | hard fade-up from black at 5.5s |
| 2. Wireframe Net (chaotic) | f_0018–f_0029 | 8.5–14.0s | Wireframe Net + Orbiters | morph (net grows out of the band field ~8.5s) |
| 3. Orbiters on black | f_0030–f_0034 | 14.5–16.5s | Orbiters (isolated) | morph (net dissolves, orbiters remain) ~14.5s |
| 4. Kaleidoscope Diamonds | f_0035–f_0045 | 17.0–22.0s | Kaleido Diamond Tiling | crossfade begins ~16.5–17.0s, hue ramps through end of segment |

Two structural beats define the segment: an early **horizontally-streaming perspective
field** (scenes 1–2) that hosts the recurring **Orbiters** and **Wireframe Net** motifs,
then a hard pivot at ~17s into a **mirror-kaleidoscope** background (scene 4) where the
orbiters survive as tiny corner accents. Scenes 1→2→3 are continuous morphs sharing one
coordinate space; scene 3→4 is a true crossfade into a different render mode.

---

## Scene 0 — Black intro (f_0001–f_0011, 0.0–5.0s)

Pure black canvas. The only non-black content is screen-capture chrome: the WMP transport
bar (bottom center: play/pause, stop, seek) and the recording badge (top right). A faint
mouse cursor drifts mid-frame in a couple of frames. f_0011 (5.0s) shows the play button
lit blue — playback is just starting; audio energy is ~zero so the visualizer draws
nothing. No geometry, no waveform, no color.

Implementation: this is just the cold-start of a feedback buffer. In Butterchurn terms the
preset should simply produce nothing meaningful until audio arrives (decay clears to black).
You do NOT need to author this; a real-audio preset is naturally black during silence. If
you want fidelity, gate brightness on `bass+mid+treb` so the scene stays dark until the
track kicks in.

---

## Scene 1 — Perspective Light-Tunnel "Lens-Bands + Red Rain" (f_0012–f_0017, 5.5–8.0s)

This is the visualization's opening statement and it is dense. (~700 words.)

**Background.** Not solid black — it is an animated, layered field of **horizontal
glowing color bands** that span the full width and recede in perspective. The dominant
bands are a broad **green** swath through the vertical middle (≈ y 0.45–0.65 of the pane), a
**cyan/teal** band just above it, and thinner **magenta/blue** bands below. The bands are
soft-edged, additive, and clearly have **frame-feedback smear**: each looks like a streak
that has been zoom-stretched horizontally, i.e. the feedback transform is biased toward a
strong horizontal (x) zoom/translation, not a radial zoom. Decay is moderate-to-high
(~0.93–0.96): trails persist for many frames as long colored ribbons but still fade.

**Foreground elements.**
1. **Red "rain" bars** — roughly 8–14 near-vertical thin red lines falling/standing across
   the frame (f_0012, f_0013, f_0015). They are slightly tilted and converge toward a
   vanishing point on the right, betraying a 3D perspective projection. These read as a
   particle/line system whose members are nearly vertical line segments. They flicker frame
   to frame (count and position change), suggesting they are spawned/driven by transient
   audio (treble/percussion hits).
2. **Dotted orbit line** — a horizontal row of evenly spaced soft glowing dots/ellipses
   marching left→right across the lower third (f_0012–f_0016). The dots grow from small on
   the left to larger ellipses on the right, then there's a notably **larger orb** that
   pulses (purple in f_0014, white-green in f_0016). This is the nascent **Orbiters** motif
   — a point traveling a path and leaving a stroboscopic trail of its past positions
   (echo of a single moving sprite, not many separate sprites).
3. A faint **fan of fine lines** sweeping from the lower-left corner (f_0012, f_0015) —
   the leading edge of the Wireframe Net that fully blooms in scene 2.

**Geometry / perspective.** Strongly **3D**: there is a clear vanishing point toward the
right-center, lines converge there, and the band field reads like a floor/ceiling receding
into depth. Camera sits low and to the left, looking down a horizontal corridor. The whole
field **pans/streams right-to-left** (content slides leftward across frames while new
material enters from the vanishing point on the right).

**Color & cycling.** Multi-hue (green dominant, with cyan, magenta, red accents). Over
these 2.5s the palette stays green/cyan-dominant — no full hue cycle yet within the scene,
but the bands' individual hues drift slowly. Treat the band palette as a slow rainbow that
is currently sitting in the green/teal quadrant.

**Symmetry.** None — fully asymmetric perspective scene. No mirroring.

**Audio reactivity hypotheses.** Bass → brightness/size of the marching orbs and the
horizontal band intensity. Treble/transients → the red vertical "rain" bars (they spawn on
hits). Mid → the band scroll speed / waveform ripple on the dot-line.

**Implementation direction (scene 1).**
- Coordinate system: **cartesian with a fake-perspective warp**. The band field is best done
  in the `warp`/`comp` shader: draw horizontal sinusoidal bands `sin(uv.y*N + phase)`, color
  them from a slow palette `pal(uv.y + time*0.03)`, and apply a horizontal-biased feedback
  (`echo_zoom` ~1.02 on x via the warp UV: scale `d.x` more than `d.y`).
- Feedback: `decay ≈ 0.94`, `zoom` slightly >1 with `dx` negative (leftward stream). Keep
  `wrap=1` off the vertical edges to avoid band wrap artifacts.
- Red rain: a custom wave (`waveLine`) of near-vertical short segments, spawned with count
  scaled by `treb_att`; color fixed red, `additivewave=1`.
- The marching dots: a single `circleWave` sprite whose center walks left→right in
  `frame_eqs` (`cx = mod(time*v, 1)`), relying on feedback decay to leave the dotted trail.
- Keep colors muted per the Alchemy rule: desaturate the band palette, tone-map the comp.

---

## Scene 2 — Wireframe Net + Orbiters (f_0018–f_0029, 8.5–14.0s)

The signature Alchemy "spaceframe" era. (~750 words.)

**Background.** Black, with the horizontal color bands from scene 1 receding into faint
remnants on the right edge (f_0018–f_0021) then gone by f_0024. By f_0024 the canvas is
essentially pure black behind the geometry. So the scene transitions from "band field still
visible" (8.5–10s) to "geometry on black" (10–14s).

**Foreground element 1 — the Wireframe Net.** A large mesh of **thin straight line
segments** occupying the left ~60% of the frame, fanning from a dense cluster on the left
out toward the right. In f_0018–f_0019 it is a **green** chaotic tangle; f_0020–f_0021 it
becomes a more ordered **cyan/teal** net resembling two cones/funnels joined at their bases
(the "two funnels joined at base" form named in the motif vocab), rendered as crisscrossing
lines that look woven; f_0022–f_0023 it densifies into a near-random tangle again
(hundreds of intersecting lines, X-crossing patterns); f_0024–f_0025 it relaxes back into a
recognizable 3D funnel/fishbone with a clear spine. So within the scene the net
**oscillates between ordered (symmetric double-funnel) and chaotic (tangle)** — this is the
defining Wireframe Net behavior. The mesh is faint (low-alpha lines), additive, with light
feedback ghosting. It rotates/undulates slowly in 3D, viewed from low-left.

**Foreground element 2 — the Orbiters.** Running through the net's spine is a **horizontal
axis line** along which 2 prominent glowing orbs travel, each trailed by:
- a **stroboscopic dotted trail** (the orb's past positions, evenly spaced ellipses with
  ring outlines, fading with distance — f_0026–f_0027 show this beautifully as two parallel
  dotted lines), and
- a **jagged audio waveform line** connecting/streaming from the orbs (the green/red wiggly
  filament in f_0024, f_0025 — this is a real oscilloscope waveform, dense small zig-zags
  driven by `a.value1`).

The orbs are color-cycling: green (f_0024–25), then they pick up the band colors. In
f_0026–f_0027 the geometry is gone and we are left with **two clean horizontal rows of
ringed dots** converging toward a vanishing point on the right — the purest read of "a
point orbiting/translating, sampled stroboscopically into a receding dotted line."

**Geometry / camera.** 3D, low camera, vanishing point right-center, same corridor as scene
1. The net is a volumetric line cloud; the orbiters ride its central axis. Strong sense of
**depth via convergence** of the dotted rows.

**Motion.** The whole assembly streams **right→left**; the net undulates (vertices wobble on
audio); orbs travel left→right along the axis (against the global leftward pan, so they
appear to hold near center while trails stretch). Rotation is slow.

**Motion blur / feedback.** Moderate. Decay ~0.93. The dotted trails are partly genuine
echo (feedback) and partly explicitly drawn sampled positions; the waveform filament has a
short smear.

**Color & cycling.** Green → teal/cyan → (later) blue. Slow hue drift, ~20–30s period;
within this 5.5s window it moves green→cyan→blue-ish. Muted, not neon.

**Symmetry.** The net flirts with bilateral symmetry (double-funnel) but is mostly
asymmetric. No kaleidoscope yet.

**Audio reactivity hypotheses.** Bass → orb size and the net's overall expansion/pulse.
Mid → net vertex undulation amplitude and the waveform filament's jaggedness. Treble →
density/flicker of the finest net lines and the strobe rate of the dotted trail.

**Implementation direction (scene 2).**
- The Orbiters are exactly the **Dance of the Freaky Circles** pattern — reuse it. Two
  `circleWave` sprites whose centers follow paths in `frame_eqs`; a `waveLine` between them
  with perpendicular displacement from `a.value1` for the jagged filament.
- The dotted receding trail: drive a `q`-var "history" by letting feedback `decay≈0.93` +
  small `zoom>1`/`dx<0` smear each frame's orb into a leftward-receding echo; the even
  spacing comes from the orb moving at constant velocity while the feedback samples it each
  frame. Add ring outlines via the circleWave's edge.
- The Wireframe Net: a custom wave with many points (`waveLine` with high sample count)
  whose `a.x/a.y` are a parametric 3D funnel `(cos, sin)` projected with a fake-perspective
  divide, blended toward chaos by mixing in `a.value`-driven jitter scaled by `mid_att`.
  Keep lines thin, additive, low alpha.
- Color: `pal(time*0.04 + q)` sitting in the green→blue quadrant; desaturate; tone-map comp.

---

## Scene 3 — Orbiters isolated on black (f_0030–f_0034, 14.5–16.5s)

A brief, gorgeous lull where the net dissolves and ONLY the Orbiters remain on pure black.
This is the cleanest reference for the motif. (~650 words.)

**Background.** Pure black. (Full-bleed capture now; no band field, no net — they have
faded out via feedback decay.) A faint remnant of the green net clings to the far left edge
in f_0031–f_0032 but is essentially gone.

**Foreground.** Two orbiting "comets," each = a bright **core orb** + a **white ring**
("Saturn"-like, the ring is a thin bright ellipse around the orb) + a **stroboscopic dotted
trail** + several **jagged waveform whip-lines** streaming off them. The two orbs sit on
roughly opposite sides and are connected by a fan of 4–6 wiggly filaments (f_0032, f_0033):
one orb upper-left, one lower-center, with the waveform whips arcing between and past them.
The dotted trails recede toward a vanishing point on the right (f_0034 shows two parallel
dotted rows again). Orb color cycles strongly here: f_0030 **blue/steel**, f_0031
**yellow-green**, f_0032 **magenta/pink**, f_0033 **violet/indigo**, f_0034 (next scene)
**amber**. So the hue is sweeping fast through this window — roughly one full color step
per 0.5s, i.e. a ~3–4s visible cycle during this energetic passage (faster than scenes 1–2;
likely tied to a louder musical section).

**Geometry / camera.** Still the 3D corridor with a right-side vanishing point, but now
almost nothing else is drawn, so the perspective reads purely from the convergence of the
two dotted trails. Camera low-left as before.

**Motion.** The two orbs swing/orbit — in f_0032 they are mid-swing with long trailing
whips, in f_0034 they've separated into the two-row converging pattern. The whips
(waveform filaments) are dense small zig-zags = live oscilloscope. There is real motion
blur on the whips (short smear) but the dotted trail is crisp (explicit samples). Decay
moderate ~0.92.

**Feedback.** Lower than scenes 1–2 (background fully cleared to black), but the dotted
trails persist — consistent with explicit per-frame position sampling plus modest echo.

**Color & cycling.** Fast rainbow sweep (≈3–4s) as noted. Orbs and their whips share the
current hue; rings stay white.

**Symmetry.** Two-fold (the two orbiters are roughly point-symmetric about center) but not a
true mirror. No kaleidoscope.

**Audio reactivity hypotheses.** Bass → orb core size + ring radius pulse (the rings bloom
on beats). Mid → whip filament length and jaggedness. Treble → number/flicker of the dotted
trail samples and brightness of the white rings.

**Implementation direction (scene 3).**
- This IS the Orbiters / Dance pattern at its most exposed — make this the visual anchor of
  the preset. Two `circleWave` sprites; each gets a second concentric thin-line wave for the
  white "Saturn" ring (slightly larger radius, white, `additivewave`).
- Centers follow opposing orbit paths in `frame_eqs`:
  `cx1 = 0.5+0.25*cos(time*w)`, `cy1 = 0.5+0.18*sin(time*w)`, and the second 180° out of
  phase. Modulate radius with `bass_att`.
- The waveform whips: 4–6 `waveLine` instances from orb A toward orb B, each offset, with
  perpendicular displacement = `a.value1*amp*(0.4+0.6*mid_att)` for the dense jagged look.
- Dotted receding trail: keep `decay≈0.92`, `dx` small negative + `zoom` slightly >1 so each
  orb position smears into a leftward-receding row; ring outlines come for free from the
  circleWave edges.
- Color: fast `pal(time*0.25)` here (faster than other scenes); rings forced white;
  tone-map. Keep saturation moderate (this passage is more vivid than scenes 1–2 but still
  Alchemy-muted, not neon).

---

## Scene 4 — Kaleidoscope Diamond Tiling (f_0035–f_0045, 17.0–22.0s)

A hard pivot in render mode: from the open 3D corridor to a flat, mirror-symmetric
**kaleidoscope** of diamonds/lenses. Crossfade begins ~16.5–17s (f_0035 is a transitional
half-state) and the kaleidoscope holds through the end of the segment, with the palette
ramping dramatically. (~750 words.)

**Transition (f_0035).** A blurry close-up: a large soft blue-outlined sphere with an amber
core fills the upper-left, with a smaller amber orb lower-right — this looks like the camera
diving INTO one of the orbiters, the orb ballooning to fill the frame as a transition wipe
into the kaleidoscope. By f_0036 the kaleidoscope structure has snapped in.

**Background / structure.** A **mirror-kaleidoscope tiling**: the frame is divided by two
diagonals into 4 triangular sectors (top, bottom, left, right) meeting at center — an
**X / bowtie** layout — and curved bands flow through them, mirrored across both a vertical
and a horizontal axis (and the diagonals), giving **4-fold mirror symmetry** (effectively a
2x2 kaleidoscope with a central pinch). The motif is **lens/eye/diamond shapes**: pairs of
curved arcs bulge from the left and right edges toward center forming lens (almond) shapes,
while black diamonds sit top and bottom. The curved bands are layered concentric arcs
(like contour lines of a lens).

**Color ramp over the scene (this is the headline behavior).** The palette cycles
unmistakably and fast here:
- f_0036–f_0037: near-black with faint **rust/brown** arcs (just emerging).
- f_0038–f_0039: **teal/dark-green** arcs on black diamonds.
- f_0040: **teal arcs + deep magenta/purple** fill appears.
- f_0041: **purple/lavender + teal** dominant.
- f_0042: a tangle of **blue/green thin lines** (a waveform burst) over the dark lens.
- f_0043: **magenta + yellow-green** lines, vivid.
- f_0044: **hot pink/magenta** fill with green filament burst at center.
- f_0045: **bright red + purple** — the lens arcs now glow red/violet, fully saturated.
So across ~5s the hue ramps black → rust → teal → purple → magenta → **red**, i.e. a fast
(~8–10s if extrapolated to a full loop) rainbow drift, currently sweeping cool→warm. This is
the "Alchemy slowly cycles hue" behavior, here on the faster end because it's an energetic
passage. NOTE: by f_0045 the colors are quite saturated (vivid red); within the kaleidoscope
the muting rule is relaxed compared to the orbiter scenes — match the reference, which gets
genuinely vivid here.

**Foreground.** Two tiny **ringed orbiter dots** persist in opposite corners
(upper-left + lower-right) throughout scene 4 (visible in every frame f_0037–f_0042) —
vestigial Orbiters, now just accents riding the kaleidoscope. A **central waveform burst**
of thin crisscrossing lines appears on beats (f_0042–f_0044), radiating from the center
pinch — a live oscilloscope rendered radially and mirrored by the kaleidoscope into a
symmetric "spirograph."

**Geometry / camera.** Flat **2D** now (no perspective depth) — the kaleidoscope is a
screen-space symmetric warp. The X-shaped sector boundaries are razor-sharp straight
diagonals.

**Motion.** The arcs breathe/undulate (bands widen and narrow on audio); the whole pattern
slowly counter-rotates. The central waveform burst pulses on beats. Slow zoom in/out
breathing.

**Feedback.** Higher decay here (~0.95) — the arcs are smooth, contour-like, smeared; the
waveform bursts leave soft trails.

**Symmetry.** **4-fold mirror kaleidoscope** — vertical axis + horizontal axis (plus the two
diagonals defining the bowtie sectors). This is the defining feature.

**Audio reactivity hypotheses.** Bass → lens arc thickness/glow + overall zoom breathing +
the red/magenta fill intensity. Mid → the band undulation and the central waveform burst
amplitude. Treble → the fine crisscross line density in the burst and the brightness of the
corner orbiter dots.

**Implementation direction (scene 4).**
- Coordinate system: **polar/mirror in the comp shader**. Build a kaleidoscope by folding
  UV: `vec2 p = abs(uv-0.5);` then mirror across the diagonal (`if(p.x<p.y) swap`) to get the
  X-sector symmetry; draw concentric lens arcs as `sin(length(p)*N - time)` contours.
- Color: `pal(length(p) + time*0.12)` for the fast cool→warm ramp; allow higher saturation
  than scenes 1–3 (match the vivid red by f_0045). Still tone-map to avoid blown-white.
- Feedback: `decay≈0.95`, slow `rot` for the counter-rotation, gentle `zoom` oscillation
  (`zoom = 1 + 0.02*sin(time*0.5)*bass_att`) for the breathing.
- Central waveform burst: a radial `circleWave`/`waveLine` driven by `a.value1`, drawn once
  and let the kaleidoscope fold replicate it into the symmetric spirograph; gate its
  amplitude on `mid_att`/beat.
- Corner orbiter dots: two small `circleWave` sprites pinned near (0.12,0.12) and
  (0.88,0.88) with white rings — cheap callback to the Orbiters motif.
- Transition from scene 3: a quick `zoom` punch-in (`zoom>>1` for ~0.5s) on a beat to mimic
  diving into the orb (f_0035), then settle into the kaleidoscope.

---

## Cross-scene synthesis (for the preset author)

- Two persistent motifs thread the whole segment: **Orbiters** (2 ringed orbs + dotted
  receding trails + jagged live-waveform whips — the Dance pattern) and the **Wireframe
  Net** (a thin-line mesh morphing ordered-double-funnel ↔ chaotic-tangle). Build both as
  reusable layers; scenes differ mainly in which layer dominates and the background mode.
- **Background mode** is the big scene switch: scenes 1–3 use a **3D right-vanishing-point
  corridor** with a horizontally-smeared feedback (band field → black); scene 4 uses a
  **flat 4-fold mirror kaleidoscope**. A preset can crossfade a `q`-var `scene` between two
  comp-shader branches on a ~17s timer or a long-term energy accumulator.
- **Hue cycling** is real and present, slow in scenes 1–2 (green→teal→blue, ~20–30s),
  faster in scenes 3–4 (cool→warm rainbow, ~3–8s) during the louder passage. Drive palette
  phase off `time` plus an audio-energy integrator so it speeds up when the music does.
- **Muting:** keep scenes 1–3 muted/dusty (desaturate, tone-map). Scene 4 is allowed to go
  vivid (it genuinely reaches saturated red) — match the reference per scene rather than
  forcing global muting.
- **Vanishing point** for scenes 1–3 is consistently **right-of-center**, camera low-left.
  Bake that asymmetric perspective into the warp; do not center it.
