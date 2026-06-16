# Alchemy Background Motifs — Complete Reference Guide

Companion to [`orb-motifs-reference.md`](orb-motifs-reference.md). Where that guide
covers the **foreground** (orbs, tethers, waveform geometry), this one covers the
**background**: the field/environment *behind* the foreground — wash color, texture,
feedback smear, fluid, symmetry folding, stripes, dither, perspective tunnels.

**Method (read this — it sets the trust level of every claim).** Two independent
passes were cross-checked:

1. **Empirical pass.** The reference clip `YouTube 1080p 60fps Download.mp4`
   (1280×720, 60fps, 3:06 — the same clip the orb guide used) was split into the
   same 9 sections A–I. Frames were extracted at 1.5fps per section; one subagent
   per section analyzed *only the background* and was told to **confirm or refute**
   the Gemini hypotheses rather than assume them.
2. **Architectural pass (Gemini).** Eight reconstructed "background architectures"
   (Variations 1–8) derived from the frame sequence + knowledge of the classic
   WMP/Alchemy rendering pipeline.

Where they agree, confidence is high. Where they disagree, the **empirical frame
evidence wins** and the divergence is called out explicitly. Audio reactivity is
*inferred from frame-to-frame change* (the analysts could not hear the track) and
is flagged as such throughout.

> **Muting rule caveat (important).** CLAUDE.md's "Alchemy must stay muted" rule
> holds for **most** sections (C wash, E early, the calm fluids). But the frames
> show the **kaleidoscope (A-late), radial fountain (D), wireframe-net/tunnel (G),
> and supernova finale (I) sections run genuinely VIVID** (saturated green/magenta/
> gold). Treat muting as the default and these four as the documented exceptions —
> match each section's own frames, don't force-mute everything.

---

## 0. Executive summary — what the backgrounds actually are

Across the whole clip the background is **never a static image and never one single
effect**. It is a small vocabulary of mechanisms that crossfade in and out:

| # | Background mechanism | Where (sections) | Vivid/Muted |
|---|---|---|---|
| BG1 | **Near-black void** (empty field, foreground-only) | A0–3, B-exit, C-dark, E-mid | — |
| BG2 | **Directional feedback smear** (horizontal `dx` drift → light bands) | A3–18, C-dark, H | muted |
| BG3 | **Flat tinted color wash** + slow hue cycle + soft vignette + faint dither | C48–58, E-early | muted |
| BG4 | **fbm domain-warp fluid** w/ iso-contour ridges ("marble / aurora") | D2, E-late, F1, H-finale | muted→mid |
| BG5 | **Kaleidoscope / quad-mirror fold** (4-fold X, lens, mirrored stripes) | A18–27, B-lens, F2, G-late | vivid |
| BG6 | **Moiré vertical stripes** (quad-mirrored, bass-beating) | F2 | mid |
| BG7 | **Radial filament fountain / vortex** (pinwheel; collapse to hot center) | D1, I-bloom | vivid |
| BG8 | **Perspective wireframe net / tunnel** (rays converge to a VP) | G, I-terrain, B-grid | vivid |
| BG9 | **Reflected-waveform horizon** (waveform-on-water mirror) | G1 | mid |
| BG10 | **Static dither / hatch overlay** (subtle, ever-present texture) | global (probe, C, H) | — |

The dominant *connective tissue* between scenes is **feedback persistence + slow
hue drift + a soft radial vignette + Reinhard tone-mapping** — those four are on
almost everywhere; the table rows are what's layered on top.

---

## 1. Hypothesis verdicts (Gemini Variations 1–8 vs. the frames)

| Gemini Var | Claim | Verdict | Notes |
|---|---|---|---|
| **1. Infinite Fractal Tunnel** (feedback zoom+rotate, bass→zoom) | Foreground bleeds outward via accumulation-buffer zoom | **PARTIAL** | Feedback is real and pervasive, but it is mostly **directional/horizontal smear** (A,C,H) or a **radial fountain** (D) — *not* a clean centered zoom-tunnel. The actual "tunnels" (G,I) are **perspective GEOMETRY**, not feedback zoom. Confirms the existing memory *"feedback is for glow, not structure."* |
| **2. Kaleidoscopic Symmetry** (mirror 2/4/8×, snap on beat) | — | **CONFIRMED (geometry) / PARTIAL (beat-snap)** | 4-fold X-fold (A18–27), lens mirror (B), quad-mirrored stripes (F2), late X-burst (G,I). Symmetry is mostly **constant or slowly drifting**, NOT snapping between 2/4/8× on beats. The one clear beat-gated *appearance* is the A~18s snap-in. |
| **3. Oscilloscope Wireframe Terrain** (screen-spanning waveform horizon) | — | **CONFIRMED — but mostly foreground** | The jagged waveform lines are the *foreground* (already documented). As a **background** it shows up as the perspective net/terrain (G,I) and the reflected-waveform horizon (G1, "waveform on water"). |
| **4. Deep Radial Gradient Pulses** (center gradient breathing w/ bass) | — | **PARTIAL** | Radial vignette + slow hue cycle are everywhere; radial *lobes* appear inside kaleido cells (A) and the supernova bloom (I) is radial — but it's **filament-based, not a smooth gradient**, and there is no clean per-beat radial strobe. |
| **5. CRT Interlacing & Scanlines** (h-scanlines, treble→tear) | — | **REFUTED as animated CRT / CONFIRMED as static dither** | No horizontal scanlines, no treble-tearing anywhere. BUT a **subtle, static fine dither / cross-hatch grid** is genuinely present (the very first probe frame's sage-green field shows it; also C f_11 and H). Reframe as a low-contrast **static texture overlay**, not a glitch effect. |
| **6. Topographic Audio Mesh** (3D wireframe heightfield floor, bass-roll) | — | **PARTIAL** | The G/I perspective nets read as a *floor/ceiling* mesh receding to a VP — consistent with a wireframe terrain. But the frames show **radial line-convergence** more than a rolling Perlin heightfield. A real 3D heightfield is a plausible *implementation* of the look, not directly observed as rolling hills. |
| **7. Gravitational Vortex** (polar inward-spiral, low decay → hot center) | — | **CONFIRMED (D, I-collapse)** | D1 is exactly this: a radial fountain/pinwheel that swirls; the bloom collapse in I sucks filaments to a bright center. The "low black-wash opacity → dense white hot-spot at center" matches D's bright core. |
| **8. Aurora Interference Ribbons** (wide screen-blended sine ribbons) | — | **CONFIRMED in spirit** | The soft "fabric folding over itself" rest scenes (E-late green/magenta marble, D2 ribbons, F1 fluid) ARE this look — but in the video it's produced by **fbm domain-warp** (the project's `alcFluid`), not literal stacked Bezier polygons. Both paths give the same additive-interference result; fbm is the cheaper one already in the kit. |

**Net:** Gemini's 8 architectures collapse to ~7 real background mechanisms once you
merge "tunnel/feedback-zoom" → directional-smear + perspective-geometry, fold
"scanlines" → static dither, and recognize "aurora ribbons" and the fluid wash as
the same fbm field. Nothing in the 8 is *wrong*; three need the reframings above.

---

## 2. Background Variant Catalog

Each entry: where it appears, what it looks like, color, motion, audio (inferred),
transitions, and a Butterchurn recipe (comp/warp GLSL + feedback baseVals).

### BG1 — Near-Black Void
**Where:** A 0–3s (cold open), B exit (~39s), C dark regime (40–48s), E mid (91–95s).
**Look:** pure/near black `#000–#0a0a12`, foreground only; any color is feedback
residue bleeding off the foreground. Often a faint warm-purple or teal cast at the
edges.
**Motion:** none of its own.
**Transitions:** the clip *opens* on void (hard cut from nothing) and uses void as a
**reset between scenes** — energy drains, the field goes black, the next scene fades
up. This is the "breath" between sections.
**Butterchurn:** this is just the host preset's cleared/decayed buffer. `decay`
moderate so a little residue lingers; `gammaadj ~1.8` keeps it near-black. No shader
needed beyond the tone-map tail.

### BG2 — Directional Feedback Smear (horizontal light bands)
**Where:** A 3–18s, C dark regime, **H (the defining bg of 145–168s)**.
**Look:** near-black with **horizontal motion-blurred streaks/bands** — the smeared
residue of bright foreground geometry pulled left↔right. Reads as a "terrain of
light" / horizon of color bands (green/teal/yellow/red).
**Color:** muted-to-mid; band hue tracks the foreground + the slow global drift.
**Motion:** **directional `dx` drift**, NOT radial zoom. Moderate `decay` (bands
read but aren't permanent). Mild shear/`rot`.
**Audio (inferred):** band thickness/brightness ∝ bass (beats fatten the trails);
drift speed/direction ∝ mid/treble. *Flagged inferred.*
**Transitions:** crossfades; bands accumulate then decay.
**Butterchurn (feedback artifact — do NOT paint bands explicitly):**
```
decay: 0.96, zoom: 1.0, rot: ~0, warp: 0.05, wrap: 1, darken_center: 0
frame_eqs: t.dx = 0.010 + 0.020*bass_att;  t.dy = 0.002*sin(time*0.7);
           t.rot = 0.02*sin(time*0.4) + 0.03*(mid - treb);
           t.decay = 0.94 + 0.03*bass_att;
```
The comp shader's job is only vignette + hue-tint + tone-map; the bands emerge from
the moving foreground under `dx` drift.

### BG3 — Flat Tinted Color Wash
**Where:** C 48–58s, E early (80–84s).
**Look:** a **solid, slightly-vignetted flat color plane** that slowly cycles hue
(grey-green → olive → muted periwinkle/steel-blue). A faint static dither/grid is
visible on it (see BG10).
**Color:** muted, low saturation (S≈0.15–0.35). **Hue cycles slowly**, period
**~30–60s** (only a partial cycle is visible in any one section — confirm over a
long span). Subtle vignette (edges ~10–15% darker).
**Motion:** nearly static apart from the hue drift and the foreground's bleed.
**Audio (inferred):** field brightness may breathe with bass (subtle); **hue is
TIME-driven, not audio** (smooth monotonic drift). *Flagged.*
**Transitions:** color→color shifts are continuous crossfades, never snaps.
**Butterchurn (explicit comp wash):**
```glsl
vec3 alcField(float t){
  vec3 a=vec3(0.10,0.11,0.13), b=vec3(0.52,0.62,0.50);   // dark / sage
  vec3 c=vec3(0.55,0.55,0.36), d=vec3(0.43,0.59,0.78);   // olive / periwinkle
  float p=0.5+0.5*sin(t*0.10);
  return mix(mix(a,b,p), mix(c,d,p), 0.5+0.5*sin(t*0.06));
}
shader_body {
  vec2 dd = uv-0.5; dd.x *= resolution.x/resolution.y;
  float vig = 1.0 - 0.30*dot(dd,dd);
  vec3 field = alcField(time)*vig;
  vec3 fb = texture2D(sampler_main, uv).rgb;
  ret = max(field, fb);            // foreground smear shows through the wash
  ret = ret/(ret+0.9);             // Reinhard -> stays muted
}
```
`max`/screen-blend with `sampler_main` reproduces both BG1 (early, when `alcField`
is near-black) and the wash automatically. baseVals: `decay 0.96, zoom 1.0,
wrap 0` (clean vignette, no tiling).

### BG4 — fbm Domain-Warp Fluid ("Marble / Aurora")  ⭐ partly built
**Where:** D2 (66–73s), **E-late (95–101s, the clearest example)**, F1 (101–107s),
H-finale (163–168s green wash).
**Look:** a screen-filling **flowing fbm field** with thin bright **iso-contour
ridge lines** (`abs(fract(fbm*k)-0.5)` thresholded) that radiate/swirl from center
like a topographic/marble map. Green↔magenta is the canonical two-tone (E-late);
teal↔purple in D2/F1.
**Color:** muted base + brighter (but tone-mapped) ridge highlights. Two-tone, slow
time-driven mix. **Inverting vignette** in the strongest phase (E-late f_26 is
*center-dark, edge-bright* — a dark "eye" with radial streaks out).
**Motion:** **swirls and domain-warps IN PLACE** — it does *not* radially scale, so
this is NOT feedback-zoom; it's an explicit fbm shader with a slow rotation matrix.
**Audio (inferred):** ridge brightness/contour sharpness ∝ bass; warp/swirl speed ∝
mid; hue ∝ time. *Flagged.*
**Transitions:** crossfade-up from black over ~2–3s (accelerating).
**Butterchurn:** the kit ALREADY has `ALC_FLUID_GLSL` / `alcFluid()` (teal↔purple) —
this is the base. What's missing is the **iso-contour ridge layer** and the
**green↔magenta marble** variant. Recipe (the ridges are the signature — without
them it's generic noise):
```glsl
// requires NOISE_GLSL (fbm) prepended
vec2 q = p + 0.15*vec2(sin(time*0.2), cos(time*0.17));
q *= mat2(cos(time*0.05),-sin(time*0.05), sin(time*0.05),cos(time*0.05)); // slow swirl
float f = fbm(q*3.0 + time*0.05);
float ridges = abs(fract(f*5.0 + time*0.1) - 0.5);
float ridge  = smoothstep(0.06, 0.0, ridges) * (0.6 + 0.6*bass);
vec3 base  = mix(vec3(0.18,0.45,0.30), vec3(0.45,0.28,0.50), 0.5+0.5*sin(time*0.06));
vec3 fluid = base*(0.5+0.5*f) + ridge*vec3(0.55,0.95,0.65);
fluid *= mix(1.0, smoothstep(0.0,0.45,length(p)), 0.7);   // inverting vignette
ret = fluid/(fluid+0.85);
```
baseVals: `decay 0.97` (soft, not a tunnel), `zoom 1.0` (no net zoom), `rot 0.006`,
`warp 0.0–0.4`, `wrap 0`.

### BG5 — Kaleidoscope / Quad-Mirror Fold
**Where:** A 18–27s (4-fold X), B-lens (27–30s), F2 stripe-fold, G-late X-burst.
**Look:** screen folded across 1–2 axes (`abs()` on centered uv) → hourglass/bowtie
(2-axis X) or 4-quadrant tiling. Inside the cells: radial gradient lobes, sunburst
striations, or fbm grain. A near-horizontal + near-vertical axis pair gives the
"X / diamond" the frames show most.
**Color:** the **vivid** sections — saturated red/green/purple (A), olive sunburst
(B). The center seam piles up additively → hot spot (keep base colors slightly
desaturated so the seam mixes to bright color, not blown white).
**Motion:** mirror axes mostly fixed but **slowly drift/wobble** (`rotate by
0.05*sin(time*0.3)`); internal lobes breathe.
**Audio (inferred):** the A~18s snap-in is **beat-gated** (the one clear beat
event); saturation ramps with energy. *Flagged.*
**Transitions:** the snap-in is a **hard cut** (not crossfade); exits by crossfade.
**Butterchurn (explicit comp):**
```glsl
vec2 c = uv - 0.5; c.x *= resolution.x/resolution.y;
// optional slow axis wobble:
float a = 0.05*sin(time*0.3); c = mat2(cos(a),-sin(a),sin(a),cos(a))*c;
c = abs(c);                       // 2-axis mirror
if (c.x < c.y) c = c.yx;          // diamond/X fold
float r = length(c);
float lobe = smoothstep(0.6, 0.0, r);
// striations + fbm grain in cells, palette biased red/green/purple (not full rainbow)
```
Gate the fold in/out with a `q`-var that ramps 0→1 after a chosen beat to reproduce
the snap. Tone-map lightly (this section is genuinely vivid — don't crush it).
**Status:** exists inline in the Kaleidoscope scene; not yet a reusable helper.

### BG6 — Moiré Vertical Stripes (quad-mirrored)
**Where:** F2 (~107–115s).
**Look:** dense **vertical** hard-edged stripes (~30–50 across the width), **4-way
mirrored** so the two halves' stripe phases collide at center → animated moiré beat.
A diagonal "X" seam where the mirror folds.
**Color:** muted green vs dark crimson/maroon over near-black; central magenta bloom
at the seam (foreground).
**Motion:** stripes scroll/shimmer; the moiré "beat" comes from a bass-driven phase
term beating against the fixed stripe frequency. Quadrants subtly breathe.
**Audio (inferred):** stripe phase/width oscillation ∝ bass (the strongest
reactivity guess in this section). *Flagged.*
**Transitions:** crossfades in over the F1 fluid, recedes/darkens into F3.
**Butterchurn:**
```glsl
vec2 m = abs(uv - 0.5);                                   // quad mirror (fold to one quadrant)
float bars    = step(0.5, fract(m.x*40.0 + bass*2.0));    // vertical hard stripes; bass shifts phase
float shimmer = 0.5 + 0.5*sin(m.y*30.0 + time*2.0);
vec3 col = mix(vec3(0.38,0.10,0.13), vec3(0.23,0.55,0.18), bars) * (0.7 + 0.3*shimmer);
col *= smoothstep(0.5, 0.0, length(m));                   // edge/seam vignette
ret = col/(col+0.6);
```
The `abs(uv-0.5)` fold + the `bass`-vs-`40.0` frequency beat is the whole trick.
**Status:** exists as `MOIRE_COMP` in the Moiré scene; the butterfly/4-fold look is
the open TODO (memory `moire-kaleidoscope-todo`).

### BG7 — Radial Filament Fountain / Gravitational Vortex
**Where:** D1 (58–66s pinwheel), I-bloom (173–181s supernova).
**Look:** dense thin curved streak-lines **radiating from / swirling around a center**
(D1 pinwheel fountain), or **collapsing inward to a bright hot core** (I supernova).
Hundreds of fine ~1px strands; bright nucleus.
**Color:** **vivid** — saturated magenta/purple, lime-green, cyan; gold/white core.
**Motion:** slight **outward zoom (D, fountain)** OR inward spiral (I, vortex) +
slow **rotation**; heavy decay smears the strands into the fountain/swirl.
**Audio (inferred):** strand count/brightness ∝ overall energy; bass → zoom/expand
pulse; core flares on bass. *Flagged.*
**Transitions:** continuous decay-driven morph (no cuts); D melts fountain→fluid→flat
as energy falls; I collapses bloom→terrain.
**Butterchurn (feedback artifact — seed thin radial strands, let feedback smear):**
```
decay: 0.96–0.985 (fountain) ; zoom: 1.0 + 0.015 + 0.04*bass_att (outward, D)
                              ; OR zoom: 1.0 - decay_rate*bass (inward vortex, I)
rot: 0.006 + 0.004*mid_att ; warp: 0.4–0.9 ; wrap: 0 ; darken_center: 0 (center is BRIGHT)
```
Seed = a centered burst of fine radial spokes whose displacement is the **live
waveform** (`a.value1/value2`, per the project's real-waveform rule), faint per-strand
alpha so feedback accumulates the fountain. Vortex variant (Gemini Var 7): polar
update `r -= decay_rate*bass; theta += spin; theta += treb_jitter` → low black-wash
opacity makes traces pile into a hot center.
**Status:** partially expressible via existing Vortex/Spindle scenes; no dedicated
fountain-as-background helper.

### BG8 — Perspective Wireframe Net / Tunnel  (Gemini Var 6 "Topographic Mesh")
**Where:** B-grid (30–35s), **G (120–145s, the defining section)**, I-terrain (168–172s,
182–186s).
**Look:** fine near-parallel/radial **lines converging to a vanishing point** →
depth tunnel; or a **wireframe floor/ceiling mesh** receding to a horizon (quad
ruling visible on the green floor in I). Often develops chromatic-aberration RGB
fringing along the lines, and a late **4-way X-burst**.
**Color:** **vivid** spectral lines (green→cyan→magenta) on a dark field with a warm
maroon corner vignette; gold nucleus at the VP.
**Motion:** **perspective convergence (NOT feedback zoom)** — straight rays meet at
a VP that drifts left↔center; whole field slowly **rolls/rotates**; lines carry dense
**raw-waveform jaggedness**. The "scanline shimmer" some frames show is **line-density
moiré**, not a CRT overlay.
**Audio (inferred):** ray jaggedness = waveform (high conf); ray length/spray angle
= bass "breathing"; rotation = mid; VP brightness = bass. *Flagged.*
**Transitions:** crossfade/morph (horizon ribbon densifies into the net); continuous
evolution net→spray→X-burst.
**Butterchurn (EXPLICIT shader, not feedback — a zoom artifact gives mush, not crisp
rays):**
```
baseVals: decay 0.94 (line glow only), zoom 1.0 (convergence in-shader), rot 0.004,
          warp 0, wrap 0, darken_center 0 (VP is BRIGHT), cx 0.46 cy 0.50 (VP drifts)
```
```glsl
vec2 d = uv - vec2(0.46,0.50); d.x *= resolution.x/resolution.y;
float pang = atan(d.y,d.x);          // NOT 'ang' (reserved!)
float pr   = length(d);              // NOT 'rad' (reserved!)
float rays = abs(fract(pang*28.0/6.2831 + time*0.05) - 0.5);
float line = smoothstep(0.06,0.0,rays) * (0.25/(pr+0.18));   // brighter near VP
vec3 col = pal(pr*0.6 + time*0.04 + pang*0.05);              // slow rainbow drift
col *= line * (1.2 + bass*1.5);
col = col*smoothstep(1.1,0.2,length(uv-0.5)) + vec3(0.10,0.02,0.05)*0.4; // warm vignette
ret = col/(col+0.85);
```
Late X-burst: ramp `d = abs(d)` over scene time. A true 3D heightfield (Gemini Var 6)
is an alternate implementation — project a vertex grid, `Z = fbm(x,y,time) +
audio[i]`, draw only the connecting lines, depth-fade alpha, color by Z (purple
valleys → green peaks). Either path reads as the WMP corridor.
**Status:** partially achieved via `alcCamera("side")` + perspective orb rows; no
explicit radial-ray tunnel shader yet.

### BG9 — Reflected-Waveform Horizon ("waveform on water")
**Where:** G1 (120–130s).
**Look:** a screen-spanning **raw-waveform ribbon** across the lower-middle, **mirrored
top/bottom about a horizon line** (like a waveform reflected on water). Dense jagged
real-audio samples; the horizon tilts and undulates.
**Color:** mid-saturation, hue drifts with the global cycle.
**Motion:** the horizon tilts/rolls; the ribbon is the live waveform so it vibrates
at audio rate.
**Audio:** the ribbon **IS** the time-domain waveform (direct). Horizon tilt ∝ slow
time/mid.
**Transitions:** densifies/morphs into the BG8 net over ~1.5–2s.
**Butterchurn:** a `waveLine()` (or `circleWave`) raw-waveform horizon at `cy`,
plus a second copy mirrored about `cy` (`a.y = cy - (a.y - cy)`), additive. This is
foreground-style geometry used *as* a background layer — coordinate with the orb
layer. Crossfade into the BG8 radial shader by scene time.

### BG10 — Static Dither / Hatch Overlay  (Gemini Var 5, reframed)
**Where:** **global** — visible on the very first probe frame's sage-green field,
on C's flat wash (f_11 cross-hatch), and pervasively in H (diagonal hatch).
**Look:** a **subtle, low-contrast, STATIC** fine cross-hatch / ordered-dither grid
(~2–4px cell) sitting on top of flat/wash areas. Gives a faint "woven / screen-door"
texture. **No scanline scroll, no treble-tearing** — this is the key correction to
Gemini Var 5.
**Why it's there:** likely a deliberate dither (or a low-bit-depth banding artifact)
in the original engine; either way it adds tooth to otherwise-flat washes.
**Butterchurn (a few % overlay in comp):**
```glsl
float grid = step(0.5, fract((uv.x + uv.y) * resolution.y * 0.5));   // fine diagonal hatch
ret *= mix(0.97, 1.0, grid);    // ~3% modulation — barely visible, adds tooth
```
Apply *under* the foreground glow, over the wash. Keep ≤3–4% or it reads as noise.

---

## 3. Cross-cutting systems

### 3.1 Color & hue behavior
- **Slow hue drift is universal.** Almost every section moves through hue over
  **~15–60s** (often only a partial cycle is visible in one section — confirm over a
  long span, per CLAUDE.md). Implement as `0.5+0.5*sin(time*~0.05)` two-tone mixes
  or `pal()` rainbow, **time-driven not audio-driven** (the drift is monotonic/smooth).
- **Two-tone is the norm**, not full rainbow: green↔magenta (E,H,I), teal↔purple
  (D,F1), olive↔periwinkle (C). Full spectral only in the vivid net/bloom (G,I).
- **Muted by default, vivid in 4 sections** (A-late kaleido, D fountain, G net,
  I supernova) — see the caveat at the top.
- **Soft radial vignette** is on almost everywhere; it **inverts** (center-dark) in
  the strongest fbm-fluid phase (E-late) and in the kaleido cells.
- **Reinhard tone-map (`c/(c+k)`) on the final** is mandatory family-wide so additive
  ridges/seams/cores glow as soft color, not blown white. Tune `k` per section
  (lower/none in vivid sections, higher in muted washes).

### 3.2 Feedback taxonomy (what `decay`/`zoom`/`dx` actually do here)
| Look | decay | zoom | dx/rot | Sections |
|---|---|---|---|---|
| Directional light bands | 0.94–0.97 | 1.0 | `dx` drift, mild shear | BG2 (A,C,H) |
| Radial fountain smear | 0.96–0.985 | 1.0+ (outward) | `rot` slow | BG7 (D) |
| Inward vortex / hot core | low black-wash | 1.0− (inward) | `rot` + treble jitter | BG7 (I) |
| Soft glow on crisp lines | 0.94 | 1.0 | ~0 | BG4, BG8 (G,I) |
| Clean wash (no tunnel) | 0.96–0.97 | 1.0 | 0, `wrap 0` | BG3, BG4 |

**Rule that holds across all of it (matches existing memory):** *feedback is for
glow/trails, NOT structure.* Every crisp structure (nets, rays, ridges, stripes,
mesh) is **drawn explicitly** in a shader or as geometry; feedback only adds the
trail/bloom around it. A pure feedback-zoom never reproduces the crisp converging
rays or the iso-contour ridges.

### 3.3 Transition grammar
- **Void resets** between sections (BG1) — energy drains to black, next scene fades up.
- **Crossfades** are the default scene-to-scene transition (~0.5–2s).
- **One hard beat-gated snap**: the A~18s kaleidoscope snap-in.
- **The finale settles** (I): bloom → calm wireframe terrain. **No white-out, no
  freeze** — it holds a loopable calm tunnel. (Confirms the `reconciliation.md`
  ending note.)

---

## 4. Butterchurn implementation kit — status & gaps

What exists in `wmp-presets.js` today vs. what these backgrounds need:

| Background motif | Kit status | Action |
|---|---|---|
| BG4 fbm fluid (teal↔purple) | ✅ `ALC_FLUID_GLSL` / `alcFluid()` | extend: add **iso-contour ridges** + **green↔magenta** + **marble** variant |
| Reinhard tone-map | ✅ `ALC_COMP`, `tintComp()` | reuse |
| BG3 flat wash + hue cycle | ⚠️ ad-hoc per scene | extract `bgWash(colA,colB,...)` helper |
| BG5 kaleidoscope fold | ⚠️ inline (Kaleidoscope scene) | extract `bgKaleido(folds)` helper |
| BG6 moiré stripes | ⚠️ `MOIRE_COMP` inline; butterfly TODO | extract `bgMoire()` + finish 4-fold |
| BG8 perspective net/tunnel | ⚠️ via `alcCamera("side")` only | add explicit `bgNetTunnel()` radial-ray shader |
| **BG2 directional smear** | ❌ | feedback-baseVals recipe only — document as `fb.bands` preset |
| **BG7 fountain/vortex** | ❌ | add `bgFountain()` / vortex feedback preset |
| **BG9 reflected-waveform horizon** | ❌ | add `bgWaveHorizon()` (mirrored `waveLine`) |
| **BG10 static dither/hatch** | ❌ | add a 1-line `bgHatch()` comp tail (≤3%) |
| **bgSolidSnap** (instant solid flip) | ❌ | the discrete-event snap (still pending from the plan) |

**Genuinely missing background motifs to build** (in rough priority):
1. **BG4 ridge/marble extension** — highest leverage; the green↔magenta marble
   (E-late) is one of the most beautiful backgrounds in the clip and is 90% built.
2. **BG8 `bgNetTunnel()`** — the G section is a whole scene with no proper bg shader.
3. **BG10 `bgHatch()`** — one line, adds the authentic "tooth" everywhere.
4. **BG5 `bgKaleido()` extraction** + finish BG6 butterfly.
5. **BG7 `bgFountain()` / vortex** and **BG9 `bgWaveHorizon()`**.
6. **bgSolidSnap** + **BG3 `bgWash()`** extraction.

---

## 5. Quick parameter reference card

```
Hue drift:            time-driven, 0.5+0.5*sin(time*0.05) two-tone, ~15-60s period
Default palette:      muted two-tone (green<->magenta, teal<->purple, olive<->periwinkle)
Vivid exceptions:     kaleido (A), fountain (D), net/tunnel (G), supernova (I)
Tone-map (always):    ret = c/(c+k);  k ~0.6-0.9 muted, ~0.85 vivid (keep cores colored)
Vignette:             soft radial; INVERTS (center-dark) in strong fbm-fluid + kaleido cells

Feedback presets:
  bands (BG2):        decay 0.96, zoom 1.0, dx 0.01+0.02*bass, wrap 1
  fountain (BG7-D):   decay 0.98, zoom 1.0+0.015+0.04*bass, rot 0.006, wrap 0
  vortex  (BG7-I):    decay high, zoom <1 (inward), rot + treble jitter, wrap 0
  wash/fluid:         decay 0.96-0.97, zoom 1.0, wrap 0   (NO tunnel zoom)
  net glow (BG8):     decay 0.94, zoom 1.0, darken_center 0 (VP bright)

Crisp structure is ALWAYS drawn explicitly (shader/geometry); feedback = glow only.
GLSL reserved-name trap: never declare ang/rad/ret/uv/q* in shader_body (use pang/pr).
Aspect-correct: d.x *= resolution.x/resolution.y (else circles become ovals).
fbm iso-contour ridge (the marble signature): abs(fract(fbm*k)-0.5) -> smoothstep.
```

---

*Source: empirical frame-by-frame analysis of `YouTube 1080p 60fps Download.mp4`
(9 sections A–I, 0:00–3:06, 1.5fps extraction), one subagent per section, each
confirming/refuting the 8 Gemini "background architecture" hypotheses — cross-checked
against the existing kit in `wmp-presets.js`. 2026-06-16.*
