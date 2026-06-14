# User observations + Gemini gap report (reconciled)

Two more inputs on the **current implementation**, reconciled with the frame-by-frame
analysis in [`README.md`](README.md) / [`section_1..3.md`](section_1.md). The **user's
observations are authoritative** — they watched it live; treat them as the priority list.

---

## A. The user's observations (priority — these are what bother them most)

| # | Observation | Diagnosis | Concrete Butterchurn fix |
|---|---|---|---|
| **U1** | Lines aren't sharp/well-defined, sometimes blurry vs original | Feedback decay too high / additive bloom too soft / wave lines too thick & low-alpha; the original lines are **crisp** with feedback *behind* them, not smeared *through* them. | Lower `decay` for line-dominant scenes (~0.90–0.93), reduce wave line thickness, raise per-line alpha, add a slight unsharp/contrast in `comp`; keep feedback as a trail *behind* crisp geometry, don't let it soften the live stroke. Confirms gap **G1/G7/G8** + [[alchemy-reference-look]] "crisp not fuzzy." |
| **U2** | Not smooth — feels laggy/low-fps | Likely too few wave points (coarse polylines look steppy) and/or per-frame heavy shader cost; motion sampled coarsely. | Increase custom-wave sample count (smoother polylines), ensure `frame_eqs` motion uses `time` (continuous) not frame-quantized steps, profile the `comp`/`warp` cost. Smoothness ≠ blur — get high point density + steady fps, *then* crisp strokes. |
| **U3** | The central "flower" motif is a **drawn line** — in the original the central flower **IS the sound waveform**, not drawn geometry | Our central rosette/flower is synthetic parametric (Lissajous) curves. The original's central flower is a **radial live-audio oscilloscope** (spokes = `a.value1`). | Rebuild the central flower as a **radial `circleWave`** whose per-point radius = base + `a.value1*amp` (the 512 live samples become the petals/spokes). No `sin()` shapes. This is the cardinal rule (CLAUDE.md, gap **G4**). |
| **U4** | The **waveform connecting the circles vibrates too wide / looks like big thick fuzz** — in the original it's a **single line vibrating like lightning** | Our tether has too-high displacement amplitude and/or too many overlapping waveLines + too much thickness/feedback → reads as a fat fuzzy band instead of one crisp jagged filament. | Use **ONE** thin `waveLine` tether between the two orbs. Cut perpendicular displacement amplitude hard (lightning = many *small* fast zig-zags, not big swings): `disp = a.value1*SMALL*(0.5+0.5*treb_att)`. Thin stroke, high alpha, minimal feedback on it so it stays a sharp lightning line. (Refines **G1**: a tether *does* exist but is mis-tuned — not entirely absent.) |
| **U5** | The circles don't feel like the original; **ratio of circle-size to lightning-line is off** | Orbs too big / line too fat, so proportions read wrong. Original = **small** crisp ringed orbs joined by a **thin** long lightning line. | Shrink orb `circleWave` radius (small cores + thin white Saturn ring), lengthen/thin the tether. Tune the **orb:line** scale ratio to match `s03_orbiters_black` — small orbs, dominant thin line. See [[alchemy-reference-look]]. |
| **U6** | Too few lines/motifs per scene; **background too black** — the original sometimes has a **complex, colored, patterned** background (not a single flat color, genuinely complex) | Density too low; background is a flat black void in most scenes. The original layers many strands AND a busy animated field behind them. | (a) **Raise element density** — more waveLines/spokes per motif, multiple motif layers composited. (b) Add **complex animated backgrounds**: an `fbm`/domain-warp fluid field, the kaleidoscope/mirror fold, the banded corridor — not just black and not just one solid color. (Confirms **G5/G6**; note the nuance: the user wants *complex* backgrounds, not only the solid-snap mode.) |

**Takeaway from the user:** the framework needs **crisp, dense, live-waveform geometry**
(small orbs + a single thin lightning tether + waveform-driven central flower) over
**richer, busier backgrounds** — and to stop reading as blurry/laggy/sparse.

---

## B. Gemini "Implementation Analysis & Gap Report" (7pp) — what's useful, what's wrong

Gemini analyzed `alchemy my implementation.mov` against the reference. Useful pointers, but
it makes a **false core assumption** and **fabricates the impl's scene order** — read with care.

### ❌ Where Gemini is WRONG (don't act on these as written)
1. **"CRITICAL GAP: missing FBO feedback loop — you call `glClear` every frame; objects look
   like solid lines/dots on black with no trails."** **False for us.** Butterchurn **is** the
   FBO ping-pong engine, and our impl visibly **has** feedback (the frame analysis shows long
   trails, stacked coil-echoes, vortex smear, donut halos). Gemini analyzed as if this were a
   from-scratch GL app. Our real problem is feedback **mis-tuning** (too heavy → blur per U1;
   inconsistent per scene per G7), **not** a missing loop. Its "implement ping-pong FBOs" fix
   and the closing `glBindFramebuffer/glBlendFunc` code listing are **not applicable** — we
   don't write a render loop; we set `decay/zoom/rot/echo_*` + `comp` blend.
2. **Fabricated impl scene order.** Gemini's per-scene breakdown assumes our impl plays the
   reference's 13 scenes in order with matching timestamps ("Scene 1 Wavy Grid 0:00–0:02 in
   your video", "Scene 10 Vertical Bars 0:32–0:34"). Our impl does **not** do this — it opens
   on a green anemone, has no wavy grid / no moiré bars / no supernova-sphere, and is only
   39s. So those per-scene "gaps" describe scenes we never render. Ignore the timestamps;
   harvest only the *general* points below.
3. **"Switch to additive blending" as if absent.** Our impl already glows/blooms (additive is
   on). The issue is the *opposite* in places (too much bloom → white flares, U1/G8), needing
   **tone-mapping**, not just "turn on additive."

### ✅ Where Gemini agrees / adds value (consistent with our analysis + the user)
- **"Particle system vs continuous line strips"** — our geometry sometimes reads as discrete
  points/segments; the original uses dense continuous line strips. Matches **U2/U6** (density)
  and the live-waveform rule. → more points per wave, continuous polylines.
- **Orbiters = 3D oscilloscopes** displaced tangentially by the raw wave leaving a jagged
  trail — exactly **U3/U4** and gap **G1**. (Gemini even notes "yours are just moving dots.")
- **Vortex = torsional deformation of the vertices**, not a rotating camera / drawn pinwheel —
  matches **G3** (feedback-/warp-driven spiral).
- **Background fluid is a CRITICAL miss** (fBm/domain-warp smoke), and **mandala/2D scenes
  need Z-buffer off + hard-edged sharp lines on a flat field** — matches **U6/G5** and the
  sharpness point **U1**.
- **Color inversion flashes** on heaviest kicks (supernova) and **strobing palette swaps** on
  kick (kaleidoscope) — small reactive touches we don't have; cheap to add in `comp` via a
  beat-gated `q`-var.
- **Radial alpha fade + bloom** on anemone lines for the "glowing pollen" look — but balance
  against U1 (don't over-blur) and the muting rule (tone-map, don't blow white).

---

## C. Net adjustments to the gap priorities

The user's notes **sharpen and re-rank** the framework gaps in [`README.md`](README.md):

1. **Crispness & smoothness first (U1, U2)** — new top-line quality bar: dense continuous
   live-waveform polylines, crisp strokes, steady fps; feedback sits *behind* geometry, never
   blurs the live stroke. (Cuts across all motifs.)
2. **Orbiters proportions (U3, U4, U5)** — the tether/orbs already exist but are mis-tuned:
   **one thin lightning tether** (small amplitude, fast `treb`-driven zig-zag) + **small**
   ringed orbs; fix the orb:line ratio. The **central flower must be a live-waveform** radial
   scope, not drawn.
3. **Density + complex backgrounds (U6)** — more strands/layers per scene; replace the black
   void with `fbm` fluid / kaleidoscope / corridor fields (busy, multi-color, not flat).
4. Then the structural framework gaps: **3D camera mode (G2)**, **feedback-driven vortex
   (G3)**, **scene-aware feedback (G7)**, **global tone-mapping + muting (G8)**, **background
   modes (G5)**, **Wireframe-Net morph (G6)**, and the artifact cleanups (border vignette G9,
   stray dot G10).

See also [[alchemy-reference-look]] (thin lightning line, small orbs, waveform central
flower, crisp not fuzzy) — the user's notes strongly re-affirm that earlier memory.
