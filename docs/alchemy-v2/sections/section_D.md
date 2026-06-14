# Segment D — 0:58–1:16

Frames analyzed: **f_0117–f_0153** (37 frames, 2 fps, 640×360). Time map: `t = (NNNN−1)*0.5`, so f_0117 = 58.0s, f_0153 = 76.0s. This segment is the **money shot of the whole Alchemy clip**: it captures the full life-cycle of the "Anemone Pulsar → Swirling Vortex" arc, the vortex dissipating back into Orbiters, and a hard cut into a flat "Wireframe Net" finale. The prompt's hypothesis is **confirmed and refined** below, with the line-curving moment pinned to ~f_0129 (64.0s) and the vortex peak at ~f_0132–0133 (65.5–66.0s).

There are **five distinguishable scenes** in this 18-second window. I document each in detail with implementation direction for a Butterchurn author.

---

## Scene D1 — Anemone Pulsar with Orbiters, blue water (f_0117–f_0118, 58.0–58.5s)

**Background.** Dusty desaturated **steel-blue / slate** wash, fluid and cloudy — like looking down into murky water. No hard purple or black yet; the darkest region is the central blue-green core of the anemone. Low-saturation throughout (this is the muted Alchemy palette per CLAUDE.md). Soft cloud-like mottling suggests a slow fbm/fluid background, not a flat fill.

**Foreground elements & counts.** This is the classic **Starburst/Anemone**: a single central radiating cluster of hundreds of fine filament lines spraying outward from a center point, plus **2 Orbiters**. In f_0117 the anemone is *edge-on / collapsed* — the filaments are compressed onto a diagonal axis (top-right ↔ bottom-left), so it reads almost as a single bright diagonal bar with the two Orbiters (yellow-green glowing blobs) sitting at the two far ends of that axis, connected by a **red/magenta double waveform line** running corner-to-corner through center. By f_0118 the camera/structure has rotated so the anemone is *face-on*: a full radial green-yellow sea-urchin spray fills the middle, Orbiters now at upper-right and lower-left, each dragging a short comet-like wavy tail.

**Geometry.** Radial symmetry about one center; the two Orbiters are at ~180° opposed positions (diametrically opposite), tracing a large ellipse. The connecting waveform line is the WMP signature — a live oscilloscope jagged line strung between the two Orbiters straight through the center (exactly the "Dance" two-circles-joined-by-waveform pattern, in Alchemy colors).

**Motion.** Slow orbital sweep of the two Orbiters around the ellipse; the dramatic change from f_0117 (edge-on) to f_0118 (face-on) over 0.5s implies the camera is rotating around the anemone's polar axis (a 3D tilt), OR the anemone is rapidly spinning to face the viewer. Filaments shimmer/breathe with audio.

**Camera/perspective.** Pseudo-3D — the anemone has a tilted disc/perspective feel (the central core looks like a tilted ellipse, not a flat circle).

**Feedback/blur.** Light. Filaments are crisp; only the Orbiter tails show short trails. Decay is moderate here (trails are short), not the long-trail vortex regime yet.

**Color.** Muted green-yellow filaments, red/magenta waveform, yellow-green Orbiters, slate-blue bg. Hue is roughly fixed (yellow-green) in this sub-scene.

**Audio hypotheses.** Filament length/brightness ← `treb`. Orbiter glow size ← `bass`. Waveform jaggedness ← live `value1/value2`.

---

## Scene D2 — The Dive: camera zooms into the anemone, feedback ramps (f_0119–f_0127, 59.0–63.0s)

This is the **acceleration into the vortex** — the transition is a **continuous morph**, NOT a cut. Watch the center grow: across these frames the central core inflates from a small tilted ellipse (f_0119) to a large dark donut/eye filling the middle (f_0123–0127). The camera is **diving straight into the center** (zoom-into-center, classic feedback `zoom > 1`).

**Background.** Still slate-blue at the rim in f_0119–0122, but the center darkens into a **dark blue-violet "eye"** (a hole) by f_0123. The rim of the frame stays bluish; the energy concentrates centrally. By f_0125–0127 the dominant hue has shifted to **green** (a big green radial spray) with a dark red/maroon ellipse core — the first strong hue rotation of the segment.

**Foreground.** The radial filaments are now the whole show, sprayed from center to all edges (full 360° starburst, ~hundreds of fine lines). The **2 Orbiters survive** but are pushed to the frame corners/edges, each with a lengthening wavy tail (f_0119 upper-right + lower-left; f_0124 top-left + bottom-right). A bright zig-zag **lightning waveform line** crosses the center diagonally (f_0119, f_0121 — a vivid white zig-zag X). f_0120 and f_0121 show a faint **vertical seam/mirror line** down the middle — evidence of a mirror/kaleidoscope symmetry kicking in, or a wipe between two sub-states.

**Geometry & motion.** Pure radial starburst. The key event: **filaments are still essentially STRAIGHT (radial) through f_0127** — they spray straight out from center. The dark central "eye" grows = `zoom` increasing, camera diving. Rotation is still slow here.

**Feedback.** Ramping up. The central donut/eye is the tell-tale of `zoom>1` feedback eating the center; trails are getting longer. Decay rising toward ~0.96.

**Color & cycling.** Big hue rotation: blue (f_0119) → purple-magenta filaments (f_0121–0122) → **red** spray (f_0123) → **green** spray (f_0125–0127). This is fast hue cycling driven into the dive — period looks like ~3–4s for a full sweep here (faster than the slow 15–60s drift of calmer scenes; the dive energizes the cycle).

**Audio.** Zoom rate / dive speed likely ← `bass_att` (builds with the music). Hue rotation rate ← `time` plus a `bass` kick.

---

## Scene D3 — The Swirling Vortex (f_0128–0133, 63.5–66.0s) ★ peak

**This is the vortex.** The straight radial filaments **CURVE into a spiral**. Pin the moment: **f_0129 (64.0s)** is where the lines first visibly bend (the filaments fan out and start hooking); by **f_0130–0131 (64.5–65.0s)** they are fully logarithmic-spiral curves wrapping around a central point; **f_0132–0133 (65.5–66.0s)** is the **vortex peak** — a clean spiral galaxy / whirlpool of fine curved lines converging to a small bright center, the whole field rotating.

**Background.** Now firmly **magenta/purple** with green spiral streaks — the muted-blue water is gone, replaced by a swirling violet field. Center is a small bright magenta-pink core (f_0132–0133). The transition blue→purple completes here (begins darkening f_0123, fully purple by f_0130).

**Foreground.** Curved spiral filaments (hundreds), spiraling inward to center. The 2 Orbiters are caught in the spiral arms (f_0128 shows two blue-rimmed Orbiters joined by a white waveform; f_0129 shows them dragging long beaded tails into the swirl). By f_0132–0133 the Orbiters are nearly absorbed — only faint curved comet-streaks remain at the edges.

**Geometry / symmetry.** Logarithmic spiral, single center, ~2-arm to many-arm spiral. Strong **rotational symmetry**; the spiral arms are evenly distributed around the center (the radial filaments simply get a per-radius angular twist).

**Motion.** **Rapid rotation** of the whole structure + continued zoom-into-center. This is the acceleration the prompt predicted: the rotation speeds up markedly versus D1–D2. The spiral winds tighter frame-to-frame.

**Feedback (critical for authoring).** The spiral arms ARE feedback trails — heavy frame-feedback with simultaneous **rotation + zoom** is what bends straight radial lines into spirals. Estimate: `decay ≈ 0.96–0.97` (long persistent trails), `zoom ≈ 1.02–1.04` (steady inward pull), `rot ≈ 0.04–0.08 rad/frame` (fast spin), small `warp`. The combination of rot+zoom in the feedback buffer is the entire mechanism — you do NOT draw a spiral, you draw radial lines and let rotating+zooming feedback smear them into a spiral.

**Color.** Magenta/purple/green, muted but vivid at the bright core. Hue still rotating but the bg settles to purple-magenta.

**Audio.** Rotation speed ← `bass_att` (peaks with the drop). Zoom/dive depth ← bass. Core brightness ← bass kick.

---

## Scene D4 — Vortex dissipates into Orbiters on dark purple (f_0134–0147, 66.5–73.0s)

**Continuous morph out of the vortex.** By f_0134 the camera has "passed through" — we're now in a calmer, darker **deep blue-violet/near-black** space with a **soft magenta nebula glow** off to one side (right/lower-right). The spiral has unwound; what remains are the **2 Orbiters** prominently reasserted, joined by **2–3 parallel jagged waveform lines** stretched diagonally across the frame.

**Background.** Dark — deep indigo/blue-violet, the darkest of the whole segment, with a soft pink/magenta light-leak glow that drifts (f_0135 lower-right, f_0138 right, f_0144–0146 center). Faint swirling feedback streaks (orange/teal) curl through the dark — residual vortex motion still gently rotating the background.

**Foreground.** The 2 Orbiters return as glowing **beaded/coiled blobs** (cyan-rimmed in f_0134, yellow-gold in f_0136–0137, green in f_0142–0145) at opposite ends of the frame, connected by parallel **live oscilloscope waveform lines** (clearly real audio — fine dense jaggedness, 2–3 stacked lines in red/cyan/yellow/green). The waveform color cycles: cyan+red (f_0134) → yellow/gold (f_0136–0138) → green+blue (f_0142–0145). The Orbiters trail little "spring/coil" sprite tails (the beaded look).

**Geometry / motion.** The two Orbiters orbit on a large ellipse (corner-to-corner diagonal), the connecting waveform sweeping with them. The diagonal axis rotates slowly (f_0134 ~60°, f_0142 shallower, f_0143 near-horizontal green line, f_0146 vertical-ish) — the orbit is precessing. Motion is calmer than the vortex but the background still has slow rotational drift (leftover feedback).

**Feedback.** Reduced — trails are short again on the waveform lines, but the bg light-leak smears suggest decay still ~0.94 with mild rot.

**Color & cycling.** Dark purple bg fixed; waveform/Orbiter hue cycles cyan→gold→green over ~6s. Magenta nebula glow fixed-ish.

**Audio.** Waveform displacement amplitude ← live samples (`value1/value2`). Orbiter glow ← bass. Line color ← slow `time` cycle.

---

## Scene D5 — HARD CUT to flat Wireframe Net on flat blue (f_0148–0153, 73.5–76.0s)

**This is a CUT, not a morph** — the change between f_0147 (dark purple vortex-tail) and f_0148 is abrupt: a bright tunnel/wireframe with a hard diagonal seam appears, and by **f_0150–0151** we are on a **completely flat, solid medium-blue background** (the same flat cerulean as the clip's "Wireframe Net" interludes). This is a scene boundary.

**Transition detail.** f_0148–0149 are an intermediate "wireframe tunnel" — bright rainbow-edged mesh sheets with a strong diagonal fold line and green/magenta aurora curtains; f_0150 shows a magenta pixelated star-mesh exploding outward on flat blue; f_0151 a kaleidoscopic diamond mesh (mirror symmetry, 4-fold) on flat blue.

**Background.** **Flat solid blue** (~#3A7EA5 cerulean), zero animation, zero feedback. A complete tonal reset from the dark vortex.

**Foreground.** A **Wireframe Net**: thin green + magenta line-mesh forming a faceted **ellipse/lens outline** in the center (f_0152–0153), with radiating spikes at the left/right vertices (two "burst" nodes at the ellipse's far left and right ends). A single straight **magenta diagonal line** crosses the whole frame corner-to-corner (a guide/axis line). The mesh is low-contrast, sitting quietly on the flat blue.

**Geometry / symmetry.** Bilateral + 4-fold mirror symmetry (f_0151 diamond, f_0152 horizontal-ellipse with mirrored left/right burst nodes). Flat 2D, no perspective.

**Motion.** Slow morph of the wireframe; the diagonal line sweeps slowly. Very low energy — a "breather" scene.

**Feedback.** **None / near-zero** — lines are crisp, no trails, flat bg. `decay` low (~0.85), `zoom≈1`, `rot≈0`.

**Color.** Green + magenta lines on flat blue. Fixed hue.

**Audio.** Mesh vertex displacement ← live waveform; node burst spikes ← treb.

---

## Implementation summary for a Butterchurn author

**Overall structure.** Author this as ONE preset with a `frame_eqs` time-driven state machine (or accept it as the 3 reusable building blocks below). The segment = Orbiters → (zoom+rot ramp) → Vortex → Orbiters → cut to Net. The vortex is the centerpiece.

**Coordinate system.** Use **polar** thinking for the vortex (per-pixel warp shader operating on radius/angle). For Orbiters use the proven `circleWave` + `waveLine` approach from "Dance".

**The three building blocks:**

1. **Orbiters (D1, D4).** Two `circleWave` orbs at opposite ends of an ellipse: `cx = 0.5 + R*cos(orbit)`, `cy = 0.5 + R*sin(orbit)*0.6` and the mirror (`+π`). Join them with one `waveLine()` whose `point_eqs` marches A→B with perpendicular displacement from `a.value1` (the live audio jaggedness — this is the WMP signature, do NOT fake with `sin`). 2–3 stacked offset copies for the parallel-lines look in D4. Glow via `additivewave`.

2. **Anemone/Starburst (D1–D2).** A dense radial set of short line waves from center, OR (cheaper) a comp shader that samples the waveform along `ang` and emits radial filaments: `bri = wave(ang) * smoothstep(rad)`. Brightness/length ← `treb`.

3. **Vortex (D3) — the key.** Do NOT draw a spiral. Draw radial filaments (block 2) and let **feedback warp** spiral them: in baseVals set during the vortex window `decay≈0.965, zoom≈1.03, rot` ramping 0.0→0.07, plus a warp shader that adds an **angular twist proportional to radius**: in the comp/warp, `pang += k * pr` (twist increases with radius → logarithmic spiral) and `pr *= 0.97` (pull inward). `cx/cy` = 0.5. Rotation speed `k` and zoom ← `bass_att`. This rot+zoom-in-feedback is exactly what bends straight lines to spirals.

**Color.** Muted Alchemy palette. Background cycles blue (water) → purple (vortex) → dark indigo → flat cerulean. Implement bg as a low-saturation `pal()`/`fbm` wash, tone-mapped (Reinhard `c/(c+k)`) so the bright vortex core compresses to soft pink, never blown white. Hue cycles FAST during the dive/vortex (~3–4s period via `0.5+0.5*sin(time*1.6)`), slow elsewhere (~6s).

**Transitions.** D1→D3 is a continuous morph driven by rising `zoom`+`rot` (ramp over ~5s, f_0119→0132). D3→D4 is the morph back out (ramp down). **D4→D5 is a hard CUT** — flip to flat-blue bg, kill feedback (`decay→0.85`), swap to a static 4-fold mirror wireframe (`wave_mode` mesh / `circleWave` with low point count) — do this on a time gate, not a blend.

**Pinned timestamps:** dive begins ~59s (f_0119); lines start curving **64.0s (f_0129)**; vortex peak **65.5–66.0s (f_0132–0133)**; vortex unwinds to Orbiters ~66.5s (f_0134); hard cut to Wireframe Net **~73.5s (f_0148)**, flat blue by 75s (f_0150).
