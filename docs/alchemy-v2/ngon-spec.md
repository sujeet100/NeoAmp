# N-gon motif — locked spec

Reconciles three sources: my frame-by-frame read of the reference, Gemini's teardown,
and the prior frame analysis in `sections/section_E.md`. All three agree.

## Reference targets (in `~/Downloads/YouTube 1080p 60fps Download.mp4`)
- **Mandala (primary):** 1:14–1:28 (keyframe `s11_mandala_blue` @1:19). Slice:
  `~/Downloads/ngon-slices/01_mandala_ngon_1m14-1m28.mp4`.
- **Diamond anchor (secondary):** 1:45–1:55 (`s14_moire_stripes` @1:52). Slice:
  `~/Downloads/ngon-slices/02_diamond_anchor_1m45-1m55.mp4`.

## What the motif is
A single configurable polygon primitive `alcNgon` that generalizes triangle / diamond /
octagon / N-point star. It is a direct generalization of the existing `alcTriangle`
(which is a hardcoded 3-gon waveform wave).

Per-instance parameters:
- **sides N** — 3..16.
- **innerR / outerR** — equal → regular polygon; `innerR/outerR ≈ 0.6–0.7` → N-point star
  (vertices alternate outer/inner radius). Full star range 0.1..1.0.
- **rotate (phase)** — for slow counter-rotation between stacked instances.
- **aspectX** — horizontal stretch of the bounding box, 1.0 (circular) .. ~2.0 (heavy).
  ~1.7 is the reference mandala value. This stretch is what makes the two bright
  **"eye" nodes** EMERGE (low-slope chord segments pile up additively at the L/R extremities
  — confirmed emergent by Gemini, not a drawn element).
- **jagged amp** — perpendicular displacement of edges by the live waveform (`a.value1`),
  so straight chords become fine oscilloscope zig-zags. Additive on top of clean geometry.

## The mandala = a STACK
- 8–12 overlapping polygons with different N (e.g. 4, 6, 8, 9, 12, 16), small per-instance
  rotation offsets, counter-rotating (alternate sign). Speed slow & decoupled from transients
  (~0.1–0.2 Hz/layer — "mechanical clock", not beat-snapped).
- **Engine constraint:** custom waves render reliably only up to ~6 enabled (see memory
  `butterchurn-custom-wave-cap`). So DON'T use one wave per polygon. Instead **pack K polygons
  into ONE wave** by slicing `a.sample` into K segments (same trick `alcTriangle` uses to pack
  3 edges into one wave). Blank the connector sample between polygons (`a.a = 0` at the seam)
  so no stray bridge chord is drawn. One packed wave (+ maybe a 2nd) covers the whole mandala,
  leaving wave budget for the diagonal line.

## Audio routing (the "Alchemy feel")
- **bass envelope → global scale multiplier** on the whole stack = the breathing. On a quiet
  bar scale → ~0 so the net collapses to nothing (the dropout); loud bar blooms it wide.
- **waveform (`a.value1`) → edge jaggedness** (the jagged amp above).
- **N jumps 4→6→8→16** on structural changes — quantized, threshold/time-gated, not continuous.

## The diagonal baseline line (SEPARATE motif, not the N-gon)
- A single 2-point `waveLine` fixed at ~15–20° off horizontal, bottom-left→top-right.
- Heavy `a.value1` displacement (real waveform, finely jagged), thin ~1px, pink/white core, additive.
- **Persistent** — it's the resting state. Its opacity is modulated INVERSELY to mandala
  complexity: subtle when the net is dense, bright when the net collapses (so something always
  carries the rhythm).

## Color & background (MUTED — Alchemy rule)
- Flat blue background: comp shader returns a constant `vec3(~0.20, 0.42, 0.60)` wash.
- Wireframes thin (~1px), pale/translucent: cyan, magenta, faint yellow, white. Low saturation.
- Crisp lines → **short decay (~0.88–0.90), zoom ~0.998** ("flat" camera). Feedback is for a
  faint glow only, NOT structure (draw the lattice explicitly each frame).
- Optional slow hue drift `0.5+0.5*sin(time*0.08)` over the ~14s.

## Anchor variant (secondary target)
- Single `alcNgon` N=4 regular (innerR==outerR), rotation locked at 0, aspectX=1, slight
  bass scale only, magenta. Over the moiré/fluid background. Briefly shatters to high-N chaos
  on a transient then snaps back.

## Build order (respect "prove ONE before scaling")
1. ✅ `alcNgon(opts)` primitive — configurable {N/skip} star-polygon wave.
2. ✅ Proved ONE polygon (`P["Alchemy v2: N-gon Proof"]`), aspectX ellipse confirmed.
3. ✅ Star geometry — used **{N/skip}** (connect every skip-th vertex → center-crossing chords),
   NOT inner/outer radius (that gives an empty-center spiky ring — rejected on screen). Jagged
   edges = perpendicular-to-chord waveform displacement.
4. ✅ Packed stack — `alcNgonPacked` packs K polygons per wave (seam-blank a.a=0); 12 polygons in
   4 waves. Counter-rotation via signed `dir`; bass-breathing.
5. ✅ Diagonal line as its OWN motif `alcDiagonalLine` (corner-to-corner, q10 inverse opacity).
6. ✅ `P["Alchemy v2: Mandala"]` scene wired (clear-warp + flat-blue comp).
7. ✅ Polish: collapse-to-line dropout + energy-gated density (per-spec `tier` + q11) + eye-node
   glow + thin line, all driven by reusable `alcMandalaFrame()`.
8. (Later) diamond-anchor scene reuses `alcNgon`/`alcDiagonalLine` over the moiré bg (section_F).

## Hard-won notes (don't relearn)
- **{N/skip}, not inner/outer radius** — only skipping vertices produces the center-crossing
  spirograph chords + central knot. Gemini suggested inner/outer; we validated skip is right.
- **Jaggedness = perpendicular to the chord**, not radial — keeps the zigzag riding the straight
  chord (oscilloscope look). Radial would bow the chords.
- **Eye nodes are emergent** — aspectX horizontal stretch piles low-slope chords additively at L/R;
  even-N polygons at rotate:0 share the exact L/R vertices to strengthen it.
- **Last wave is silently dropped in this build** — put the must-see motif (the line) at index 0.
  See memory butterchurn-custom-wave-cap.
- Feedback must be cleared each frame (ALC_CLEAR_WARP) — `decay` base-val has no effect here.
