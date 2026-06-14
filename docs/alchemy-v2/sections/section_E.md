# Segment E — 1:16–1:36

Frame source: 2 fps PNGs, 640×360, `/tmp/alchemy_frames/f_NNNN.png`.
Time = (NNNN−1)×0.5. This segment covers **f_0153 → f_0193 (76.0s → 96.0s)**, 41 frames.

This twenty-second span is a single continuous *transformation arc*, not a set of hard cuts. There is exactly **one true cut** (a black flash/restart of the mandala at ~82.5s) and a chain of **morphs** elsewhere. The arc runs:

1. **Scene E1 — 2D Geometric Mandala (Wireframe Net) on flat blue** (76.0–82.0s)
2. **CUT → re-seeded Net + Orbiter dot-columns** (82.5–83.0s)
3. **Scene E2 — Starburst / Anemone bursting into a Fluid background** (83.0–85.5s)
4. **Scene E3 — Free-space fluid field with Orbiters + diagonal waveform line** (86.0–88.0s)
5. **Scene E4 — Glowing Ring (wireframe donut) skewered by the waveform line** (88.5–90.0s)
6. **Scene E5 — Neon Star-Mandala ring orbiting over a deepening fluid** (90.5–95.0s)
7. **Scene E6 — Topographic / marbled-smoke swirl (transition out)** (95.5–96.0s)

The single most persistent motif across the WHOLE segment is the **jagged diagonal waveform line running bottom-left → top-right** (a live oscilloscope). It is present in E1, vanishes briefly during the anemone burst, and returns in force as a thick red/orange "string" through the ring scenes. Treat it as a permanent overlay element, not per-scene.

---

## Scene E1 — 2D Geometric Mandala / Wireframe Net on flat blue (76.0–82.0s, f_0153–f_0165)

**Background.** A completely **solid flat blue** field — a single dusty steel/petrol blue (~RGB 45–70 / 95–120 / 140–160), no gradient, no texture, no vignette. It is a constant clear-color, NOT an animated background in this scene. This flatness is diagnostic of Alchemy's "2D geometric" mode: the mandala is drawn as pure additive wireframe on top of a constant fill.

**Foreground geometry.** A large **horizontally-elongated mandala** centred on screen, roughly an ellipse 1.6–1.8× wider than tall (it fills ~70% of width, ~55% of height). It is built from **overlapping straight-line polygons** — thin 1px wireframe diamonds, octagons and many-pointed stars nested and rotated against each other. The look is a *spirograph / star-polygon* mesh: long straight chords spanning from one side of the ellipse to the other, crossing through the centre, producing a dense lattice with a brighter knot of crossings at the centre and two bright **focal nodes** at the left and right extremities (~x=0.25 and x=0.75, y=0.5). Those two side-nodes are where most chords converge — they read as a pair of "eyes" or pinch-points and are a stable feature of this scene (visible f_0153, f_0158–0162).

**Counts.** Roughly **8–12 superimposed polygon rings**, each an N-gon with N≈8–16, rotated at small relative offsets so the chord count is high (dozens of visible lines). Don't try to match exact N — match the *density* and the elliptical envelope.

**Motion.** **Rigid 2D scaling + rotation**, NOT fluid. The whole mandala pulses: it scales up/down symmetrically and the nested polygons counter-rotate slowly, so chords sweep like a breathing spirograph. f_0153–0154 the lattice is broad and faint; f_0155–0156 it has **collapsed almost entirely to just the diagonal line** (the polygons shrank to near-zero scale, leaving only the waveform); f_0157 onward it re-expands. This collapse-and-rebloom is audio-gated — the geometry scale tracks bass: a quiet bar shrinks the net to nothing but the persistent diagonal, a loud bar blooms it wide.

**Camera / perspective.** Pure **flat 2D mandala**, viewed head-on. No 3D, no tunnel, no perspective foreshortening. All scaling is in the screen plane.

**Motion blur / feedback.** **Low feedback / crisp.** Lines are sharp single-pixel strokes with only a faint additive halo; there is little trailing. Decay is short here (frames don't smear into each other) — the net redraws cleanly each frame.

**Waveform.** The **diagonal oscilloscope line** is unmistakable and dominant in f_0153–0156: a thin jagged pink/white line from bottom-left (~0,0.85) to top-right (~1.0,0.15), with visible small high-frequency jitter along its length (real audio samples). In f_0155–0156 it is literally the *only* thing on screen besides the blue. It is additive (slightly glowing), ~1px, pink-white core.

**Color scheme & hue cycling.** Wireframe is **magenta/pink + dull red + olive-green + pale cyan-white**, all fairly desaturated against the blue (consistent with the "muted Alchemy" rule). There is a slow hue drift: f_0153 is magenta/red-dominant, f_0157–0158 shifts toward **green/cyan**, f_0159 back to warm olive/orange, f_0160–0162 to **lavender/pink with orange Orbiter dots**. Estimated hue-cycle period ≈ 12–18s for a full sweep (slow — confirm over the whole video, not one frame).

**Orbiter dot-columns (sub-motif, enters f_0160).** From f_0160 a striking new element appears: **two vertical columns of small ringed dots** (little donut/target glyphs, orange-rimmed with a violet centre) marching down the centre-left and centre-right (~x=0.42 and x=0.58), about 8–12 dots per column, mirrored top/bottom. In f_0161 they brighten to vivid orange-on-green. These are small "Orbiter"-style glyphs being shed by the mandala — they pulse with the beat (brighter/larger on transient). They persist faintly into the cut.

**Symmetry.** Strong **horizontal mirror (left↔right) AND vertical mirror (top↔bottom)** → effectively **4-fold (2 axes) symmetry**, plus the rotational symmetry of the star-polygons (~8-fold rotational). The dot-columns respect the same L/R + T/B mirroring.

**Audio-reactivity hypotheses.** Mandala overall scale ← `bass` (collapse on quiet, bloom on loud, see f_0155 dropout). Counter-rotation speed ← steady `time` + small `mid` kick. Brightness of the two side focal-nodes ← `treb`. Dot-column glyph size/brightness ← beat transient (`bass_att`). Waveform line displacement ← raw time-domain samples.

---

## CUT → re-seeded Net + heavy Orbiter columns (82.5–83.0s, f_0166–0167)

**f_0166** is a genuine **discontinuity (hard cut / re-seed)**: the elliptical net is replaced by a **radial spiked star** — a single tight starburst of straight magenta/pink rays emanating from screen-centre (a ~14-point star), much smaller and more concentrated than E1's broad ellipse, set on the same flat blue with faint background dot-glyphs. **f_0167** keeps the central radial star but now in **cyan/teal**, with the **orange Orbiter dot-glyphs spread across the entire field** in a grid (the dot-motif maxes out here — dozens of orange target-dots tiling the blue). This is the pivot from the 2D-mandala mode into the anemone/burst mode. Treat f_0166 as a scene boundary (cut), f_0167 as the last "flat-blue + wireframe" frame before the fluid background fades in.

---

## Scene E2 — Starburst / Anemone bursting into Fluid (83.0–85.5s, f_0168–0171)

**Background.** The flat blue **starts to dissolve into a fluid/blurred wash**. By f_0168 the blue is no longer flat: it has soft horizontal banding and blur, like out-of-focus water. By f_0170–0171 it is a fully **blurred radial-zoom field** — desaturated teal-blue with smeared olive/gold streaks pulled toward a vanishing point. This is the **transition from "solid flat blue" to "animated fluid"** — describe the background here as a *radial motion-blur zoom* rather than a topographic swirl (the true topographic swirl arrives in E6).

**Foreground.** A **central Starburst / Anemone**: a dense radiating cluster of fine **feathery filaments** (NOT straight chords anymore — these are soft, hair-like, slightly curved spokes) exploding from a bright core at centre. f_0168 it is a pale **yellow-gold dandelion** of ~40+ wispy spokes; f_0169 a fuller **white-gold sea-urchin/anemone** with a green vertical waveform thread piercing top-to-bottom; f_0170 it has flattened into a **12-pointed gold sunflower** (the filaments now bundle into ~12 fat petals) with a bright white core. The filaments are the WMP signature "draw the waveform as radiating hair" — their length/jitter is driven by live samples.

**Motion.** **Fluid + radial zoom.** Between f_0170 and f_0171 the entire anemone **rushes outward toward the viewer / blurs into a streak-zoom** — the spokes elongate into long motion-blurred rays converging at a slightly off-centre vanishing point (f_0171 is almost pure radial blur with the core blown out). This is camera-style dolly-in / zoom feedback, not 2D scaling.

**Camera / perspective.** Shifts from flat (f_0168) to a **mild 3D radial-zoom** (f_0171) — first hint of depth in the segment.

**Feedback / blur.** **High** now — strong radial motion-blur and frame-feedback smear (`zoom > 1`, echo). The crispness of E1 is gone; everything is soft.

**Color.** Gold / pale-yellow filaments over teal-blue; small **magenta/pink dot-glyphs** drift in at the edges (f_0170, lower-left & right). Muted, dusty — matches the Alchemy palette rule.

**Symmetry.** Radial only (~12-fold rotational about the core); the strict L/R + T/B mirror of E1 is breaking down as fluid motion takes over.

**Audio-reactivity.** Filament length/jitter ← raw waveform samples (longer spikes on loud transients). Zoom rate (f_0170→0171 rush) ← `bass` swell. Core brightness ← `treb`.

---

## Scene E3 — Free-space fluid field, Orbiters + diagonal waveform string (86.0–88.0s, f_0172–0175)

**Background.** Now a **flowing free-space fluid field**: desaturated petrol-blue/teal with soft, slowly-drifting **olive-gold and rust cloud blooms** low in the frame and faint horizontal flow-ripples. It is animated and continuous (no flat fill) but still gentle — think a slow `fbm`-warped wash, not yet the violent marbling of E6.

**Foreground.** This is the clearest **Orbiters** scene. **Two glowing ringed nodes (Orbiters)** sit at opposite corners — f_0173 top-right + bottom-left, f_0174 top-right + bottom-left — each a small green/white **target-ring** (a little donut glyph), and they are **joined by a taut converging fan of fine green-cyan lines** that pinch to a vanishing point near centre (f_0173: a beautiful sheaf of ~20 parallel lines fanning from a centre node down to the bottom-left Orbiter). f_0174 the two Orbiters are linked by an **X-shaped pair of green flow-streaks** crossing at a blue-white hot centre. f_0175 simplifies to a single thin line connecting two pale Orbiters across a near-empty fluid field.

**Diagonal waveform string returns (f_0176-adjacent).** The connecting line thickens and reddens — by the end of this scene the Orbiters are joined by a **fat jagged red/orange "string"** running bottom-left → top-right (the same persistent diagonal as E1, now rendered as a thick glowing rope with visible high-frequency wobble = live waveform). This is the bridge into the Ring scene.

**Motion.** **Fluid / drifting**, with the Orbiters slowly migrating along the diagonal toward opposite corners (like Dance's two orbiting circles). The connecting fan/line is redrawn each frame from the live waveform, so it shimmers.

**Camera.** Mild perspective — the converging fan in f_0173 reads as lines receding to a vanishing point (slight 3D), but mostly a flat field with a depth hint.

**Feedback.** Moderate — soft trails on the Orbiters, smeared cloud background.

**Color & cycling.** Green-cyan lines + white Orbiter cores over teal-blue; warm rust/gold in the background clouds. Hue continues its slow drift (greens here, warming to red for the string). Period still ≈ 12–18s.

**Symmetry.** Two-point (180° rotational) symmetry about centre — the two Orbiters are antipodal. Not mirror-mandala symmetry anymore.

**Audio-reactivity.** Orbiter orbit position ← `time` (slow sweep corner-to-corner). String thickness/wobble ← waveform amplitude. Fan-line count/spread ← `mid`/`treb`. Centre hot-spot ← `bass` flash.

---

## Scene E4 — Glowing Ring (wireframe donut) on the waveform string (88.5–90.0s, f_0177–0179)

**Background.** Darker now — the fluid field deepens to a **navy/teal** with green and rust blooms in the lower third (f_0178 has a clear green diagonal flow band). The background is dimming toward the near-black of E5.

**Foreground — the Glowing Ring.** The hero element: a **wireframe donut / torus ring** centred on screen, **threaded onto the thick red waveform string** (the string passes straight through the ring's hole, entering lower-left, exiting upper-right — f_0177, f_0178). The ring is built from **fine radial filaments forming a circular wreath** (NOT a solid disc — it's a hairy/feathery annulus with a clear dark hole in the middle). 
- f_0177: pale **yellow-gold** wispy ring, thin, with the bright red string skewering it.
- f_0178: ring fattens, becomes a **lime-green + white feathery wreath**, hole still open, string still through it.
- f_0179: ring gains **magenta/pink radial spokes over a green glow disc** — now a two-tone (pink filaments + green core-glow) donut, ~12 short spokes around the rim. This is the "multi-layered ring" the brief predicted.

**Motion.** The ring **pulses (breathes) and slowly rotates/tilts**; the string it sits on sways. Between frames the ring's radius and spoke-length pulse with the beat. Slight tilt gives it a 3D "coin seen at an angle" feel.

**Camera.** Mild 3D — the ring reads as a torus tilted slightly out of plane (the hole is a vertical ellipse, not a perfect circle), so there is gentle perspective.

**Feedback.** Moderate-high — the feathery filaments leave soft glow trails; the string has a thick additive bloom.

**Color.** Gold → lime-green → magenta/green over the 3 frames — a rapid local hue cycle within the ring, plus the constant **red/orange string**. Brighter and more saturated than E1's muted net (the neon era is beginning).

**Symmetry.** Radial (~12-fold) about the ring centre; the string breaks it into rough L/R reflection along the diagonal.

**Audio-reactivity.** Ring radius/spoke-length ← `bass` (breathing). Filament jitter ← waveform. Spoke count constant; brightness ← `treb`. String through-line ← live samples.

---

## Scene E5 — Neon Star-Mandala ring orbiting over deepening fluid (90.5–95.0s, f_0180–0191)

This is the longest sub-scene and the **vibrant neon green/magenta** payoff the brief predicted. The ring of E4 **morphs (no cut)** into a spinning star-polygon mandala that orbits over an increasingly active fluid background.

**Background.** A **near-black deep field** (very dark navy/green-black) in f_0180–0187, which then **fills with a glowing fluid wash** (electric blue, magenta, green nebula blooms) by f_0188–0191. The background goes from "black void with a bright object" to "object embedded in a luminous fluid cloud." By f_0190–0191 the centre of the mandala shows a clear **blue-purple fluid pool** churning inside the ring.

**Foreground geometry.** A **circular wreath that is simultaneously a feathery donut AND a star-polygon mandala**:
- f_0180–0182: a **hot-pink/magenta feathery donut** with a green underside glow, tumbling — it looks like a glowing rose/anemone bagel, motion-blurred, with a small green tail dragging off to the lower-right (an Orbiter trail).
- f_0183–0185: thin **neon-green star-polygon outlines** (8–10 pointed stars) emerge crisply on top of the magenta/green glow — a sharp wireframe star sitting in a soft glow donut. f_0185 is the cleanest: a vivid **teal/green 9-point star** rim around a dark central hole, glowing magenta+green skirt below, with two small red Orbiter dots flanking left & right.
- f_0186–0187: the wireframe densifies into a full **spirograph star-mandala** (overlapping blue + red + green star-polygons) with the two Orbiters now trailing long curved tails out to upper-right & lower-left (f_0187: classic "two Orbiters joined across the mandala" — the Dance signature, in Alchemy neon).
- f_0188–0190: a **multi-pointed neon star** (10–12 points), green + blue + magenta layered, rotating, over the now-luminous fluid; a faint **horizontal jagged waveform thread** crosses the centre (f_0188). f_0190 shows fat soft gold star-points around a blue fluid eye.
- f_0191: the wireframe dissolves into a **rainbow cloud wreath** (pink/green/gold) around a blue-violet fluid hole — the mandala melting back into pure fluid.

**Motion.** **Rotation + tumble + orbit.** The whole mandala spins about its centre AND the centre itself orbits/drifts (it's not locked to screen-centre — it sits low-centre and wobbles). Star-polygons counter-rotate. The two Orbiter dots swing out to opposite corners on curved leashes. Mix of rigid rotation (the wireframe star) and fluid motion (the glow skirt + background).

**Camera.** Tilted-3D: the ring/star is consistently seen as an **ellipse tilted ~30° from vertical** (perspective on a spinning disc). Real depth, unlike flat E1.

**Feedback / blur.** **High.** Strong glow, soft motion-blur skirts under every star, long Orbiter trails. Decay long (`decay`≈0.95+, additive bloom heavy).

**Color & hue cycling.** **Vibrant neon — green + magenta/pink + electric blue + gold.** This is the saturated section (note: this segment is *Alchemy Random* style which the brief flagged as full-rainbow / NOT bound by the muted rule — match the reference's real vibrancy here). The wireframe cycles green→blue→magenta→gold over ~4–5s; the background fluid cycles independently. Two-color-plus-rainbow palette.

**Symmetry.** Radial **~9–12 fold rotational** (the star-point count), plus rough left/right mirror; the two Orbiters give antipodal 180° symmetry.

**Audio-reactivity.** Star-point radius / spoke length ← `bass` (the star "breathes" big on drops). Wireframe brightness & point count ← `treb`. Rotation speed ← steady + `mid` nudge. Orbiter leash length ← `time`. Central fluid-pool intensity ← `bass_att`. Horizontal waveform thread (f_0188) ← live samples.

---

## Scene E6 — Topographic / marbled-smoke swirl (95.5–96.0s, f_0192–0193)

**Background = foreground here.** f_0192 the mandala has fully dissolved into a **swirling iridescent cloud** (pink/green/gold/blue marbled smoke) with faint dark wiry filaments arcing through it and a blue-violet eye at centre. f_0193 (segment end) is a full **topographic / marbled fluid swirl**: deep purple and olive **flow-bands radiating from a central pinch** like a 3D tunnel/whirlpool wall, with a green-blue glowing pool at the heart and a thin white vertical lightning thread. This is the predicted **fluid/topographic swirling background** in full force — a violent `fbm`/domain-warp field with strong radial flow toward a vanishing point. It is the hand-off into the next segment (likely a tunnel/free-space scene).

**Motion.** Fully fluid, churning, radial-inward flow (whirlpool). **Camera:** strong 3D — reads as looking down a warped tunnel. **Feedback:** maximal smear. **Color:** muddy purple/olive/teal (the neon has drained as the geometry dissolved). **Symmetry:** rough radial only. **Audio:** flow turbulence ← `bass`/`mid`; central lightning thread ← waveform.

---

## Implementation direction for a Butterchurn author

**Overall.** Build this as a **state machine of ~6 phases on a timeline** (mandala → cut/reseed → anemone+zoom → orbiters+string → ring → neon star-mandala → fluid swirl), each phase a different mix of: (a) a fullscreen background shader, (b) custom waves, (c) feedback `decay`/`zoom`. Drive phase by `time` but keep all geometry waveform-/bass-reactive within each phase. The **diagonal waveform line is a persistent custom `waveLine`** present in nearly every phase — author it once (see Dance's `waveLine`) and just vary its color/thickness per phase.

**Coordinate system.** Butterchurn waves use 0..1 with 0.5=centre. The mandala/ring/star sit at centre (0.5,0.5); Orbiters orbit to opposite corners via `cx=0.5+R*cos(time*w)`, `cy=0.5+R*sin(time*w)` (antipodal pair = +π offset), exactly like Dance.

**E1 mandala (nested star-polygons).** Don't use a shader for the lines — use **multiple custom waves**, each a closed N-gon: `point_eqs` maps `a.sample` (0..1) to vertex angle `theta = floor(a.sample*N)/N*2π + phase`, radius `R*scale`, then `a.x=0.5+R*cos(theta)*aspect`, `a.y=0.5+R*sin(theta)`. Stack 8–12 such waves with different `N` (8,9,10,12,16), small per-wave rotation `phase = time*spin_i`, and a shared `scale ← 0.2 + bass*0.6` so the whole net collapses on quiet bars (reproduces f_0155 dropout). Flat blue background = set comp shader to a constant `ret = vec3(0.20,0.42,0.60)` (or just clear color) with **short decay (~0.90)** for crispness. Color the waves muted magenta/olive/cyan; slow-cycle hue with `0.5+0.5*sin(time*0.08)`.

**Orbiter dot-columns (E1 end).** Optional: a wave of `wave_dots` plotting small ringed glyphs in two vertical columns; brightness `← bass_att`.

**E2 anemone.** A radial **filament wave**: `theta = a.sample*2π*Nspokes`, `R = R0 + waveAmp*a.value1` (live sample = the hairy jitter), `a.x/y` from theta — gives the feathery sea-urchin. Add `zoom>1` (≈1.04) + `echo_alpha` for the f_0170→0171 rush-zoom. Background: switch comp to a blurred radial `fbm` wash, raise `decay`→0.95.

**E3 orbiters + fan.** Two `circleWave` Orbiters at antipodal orbit positions (like Dance) joined by a `waveLine` whose displacement = `a.value1` (the jagged string). Background: gentle `fbm` flow shader (`uv += 0.02*fbm(uv+time)`), teal/rust palette, muted.

**E4 ring (donut).** A `circleWave` at centre with `R` fixed and `point_eqs` adding short radial spokes: `a.x=0.5+(R+spoke*a.value1)*cos(theta)`. Keep the `waveLine` string passing through (it naturally crosses the ring). Two-layer: one green glow ring (additive, blurred) + one magenta wireframe ring on top. `bass`-breathing radius.

**E5 neon star-mandala.** Combine E1's nested star-polygon waves (now vivid, full-saturation cosine palette `pal(time*0.2)`) with E4's glow donut and the two Orbiters on curved leashes, over a **luminous fluid comp shader** (`fbm` domain-warp + neon palette + Reinhard tone-map so the glow blooms without blowing to white). High `decay` (0.95), heavy `additivewave`, tilt the whole thing via `cy`/`dy` for the 3D ellipse look (or a slight `warp`). Central blue fluid pool = darken_center off, let the shader show through the ring's hole.

**E6 fluid swirl.** Pure comp shader: domain-warped `fbm` with strong **radial inflow** (`uv = center + rotate(uv-center)*(1-0.3*r)`), purple/olive palette, max feedback `zoom`/`decay` for the whirlpool. Geometry fades out (wave alpha → 0). Thin vertical `waveLine` for the lightning thread.

**Feedback summary by phase:** E1 crisp (decay~0.90) → E2–E6 increasingly smeary (decay 0.95+, zoom>1, echo on). **Palette:** muted in E1–E3, then unleash full neon green/magenta/blue in E4–E5 (this preset is the vibrant/"Random" family, not the muted family), draining to muddy purple in E6.
