# Alchemy v2 — Resume / handoff note

Snapshot for picking up Alchemy v2 in a fresh session. Read this + `README.md` +
`v2-implementation-plan.md` + `orb-motifs-reference.md`. Auto-memory `MEMORY.md` loads
the key gotchas.

## This session: Orb Motif Completion

The entire orb motif kit is now built and tested. All 18 variants from the frame-by-frame
reference analysis (`orb-motifs-reference.md`) are either implemented as kit functions or
composable from existing pieces.

---

## Complete Kit (all in `wmp-presets.js`, before `var P = {}`)

### Cameras
- `alcCamera(kind)` — `top` / `side` / `orbit` / `flat`

### Palettes
- `ALC_PAL.twoTone / mono / spread / roseGreen / redCyan / warm`
  - `warm`: base 0.86 in cosine wheel = amber/gold, cycle:0 stays warm against teal nets

### Color helpers
- `alcSetColor(a, h, warm, gain)` — muted warm-shifted color for waves
- `alcPalette(spec)` — build custom palette

### Net / Line motifs
- `alcStarWaves(tris, hueOff)` — waveform triangle star (1=triangle, 2=hexagram)
- `alcRayWaves(n, hueOff, lenScale)` — n rotating waveform spokes
- `alcTriangle / alcNgon / alcNgonPacked / alcNgonStack / alcDiagonalLine` — geometry
- `alcMeshRings(nRings, hueOff)` — explicit perspective net rings
- `alcRibbonWarp / alcRibbonComp` — ribbon scene elements
- `alcSpindle(colorize)` — circlewave ring-urchin
- `alcAnemone / alcTriMandala` — fur anemone, tri mandala
- `alcMandalaFrame()` — shared mandala per-frame driver

### Orb motifs (NEW this session — all variants from reference)
- `makeOrbTrailShapes(count, rows, colorize)` — corridor trail: filled head + hollow ring echoes
  receding to VP. rows=1|2, colorize=any ALC_PAL. **This is the primary corridor orb motif.**
- `alcOrbGradBlob(qxVar, qyVar, colorize)` — V17: hot gold core + cyan halo (2 shapes).
  Returns `[outerShape, innerShape]` — concat to `preset.shapes`.
  ⚠️ shapes use different coordinate space than waves — do NOT try to align with a wave tether.
- `alcOrbTarget(qxVar, qyVar, n, colorize)` — V6/V14: n concentric rings in 1 wave.
  Outermost ring gets audio jitter. Works with `alcTether` (both waves — same coord space).
- `alcOrbFeathery(cx, cy, colorize)` — V12: large ring with radial filament spokes.
  cx/cy are static numbers (0..1), not q-var strings. q5=ring radius, q9=rotation.
  Keep q5 small (0.04–0.08) — it accumulates in feedback and dominates at larger values.
- `alcOrbDotTrail(rows, colorize)` — fine dotted underlay matching corridor geometry.
  usedots:1, 96 samples. Must share rows/nearYs with `makeOrbTrailShapes`.
- `alcOrbDotColumns(countPerCol, colorize)` — V10: two vertical marching ring columns (shapes).
- `alcOrbiterNode(qx, qy, qr, ringPal)` — Saturn-ring orb as a WAVE (correct for tethers).
- `alcOrb / alcOrbWhite / alcOrbSame / alcOrbContrast / alcOrbRow` — wave-based orb family.
- `alcTether(qax,qay,qbx,qby,qamp,colorize)` — waveform lightning bolt between two nodes.
  Already has sin-window anchoring so endpoints stay on the nodes.

### Scene drivers
- `alcNetFrame(headFn, baseZoom)` — shared hue/spin/march driver for net scenes.
  Sets q2/q3 (head), q5 (star radius), q6 (jaggedness), q7 (orb radius), q8 (hue),
  q9 (spin), q14 (march), q19 (time clock). zoom breathes on beat.

---

## Scenes (in `viz.js` FAVORITES)

| Scene | Camera | Key motifs | Status |
|---|---|---|---|
| Wireframe Net | top | star + orb core | ✓ |
| Net Corridor | side | star + makeOrbTrailShapes(8,2,warm) + tether + dot trail | ✓ refined this session |
| **Gradient Orbs** | flat | alcOrbGradBlob × 2 + alcOrbFeathery (subtle) + dot columns | ✓ NEW |
| **Bullseye Orbiters** | — | alcOrbTarget × 2 + alcTether + purple bg | ✓ NEW |
| Waveform Sheet | side | single ray + shape orb | ✓ |
| Ray Burst | top | 5 rays + orb core | ✓ |
| N-gon Proof / Mandala / Nested Mandala | flat/top | ngon stack | ✓ |
| Anemone / Petals / Mandala | flat | anemone motifs | ✓ |
| Spindle | orbit | spindle ring-urchin | ✓ |
| Ribbon | side | ribbon warp/comp | ✓ |
| Moiré | flat | bars + diamond + oscilloscope | ✓ (kaleidoscope TODO) |
| Vortex / Orbiters / Kaleidoscope / Anemone Pulsar | various | misc | ✓ |

---

## Net Corridor — current state

`makeOrbTrailShapes(8, 2, ALC_PAL.warm)`: 2 rows (nearYT=0.26, nearYB=0.54), K=1.4,
natural perspective radius (no cap), amber/gold. Head pair filled, trail rings hollow.

Tether (`waves[2]`): single white/ice line. frame_eqs wrapper computes q21–q24 as ring
**EDGES** (not centers), including the per-frame wobble (uses q19 time clock). Tether
anchors exactly at ring rims via sm01 end-fade.

Dot trail (`waves[3]`): `alcOrbDotTrail(2, ALC_PAL.warm)` — fine dots marching same path.

Wave budget: 4 waves used (star[0], star[1], tether[2], dotTrail[3]). 2 spare.

---

## Hard-won learnings THIS session

1. **Wave vs shape coordinate space** — shapes use non-aspect-corrected coords; waves use
   invAspect. Same (qx,qy) lands at different screen positions. `alcOrbGradBlob` (shapes)
   cannot be aligned with `alcOrbTarget` (wave) — they'll be at different screen positions.
   Use `alcOrbiterNode` (wave) when you need a tether-anchored orb node.

2. **Stepped-echo vs smear** — `decay < 0.96 + zoom ≈ 1.0` → discrete bead echoes.
   `decay > 0.96 + zoom > 1.0` → smooth comet smear. Net Corridor uses discrete.

3. **Tether endpoints must be ring EDGES, not centers** — compute as center ± orbRad.
   Wobble must use q19 (not t.time directly) to match shape frame_eqs exactly.

4. **alcOrbFeathery q5 creep** — feathery ring radius accumulates in feedback. Keep q5 ≤ 0.06.
   At q5=0.09 it fills the frame within a few seconds.

5. **ALC_PAL.warm base** — cosine palette base 0.86 = amber/gold (NOT 0.09 which is pink).

6. **makeOrbTrailShapes** — K=1.4 spreads orbs evenly. fillA ceiling 1.0 = opaque head disc.
   Fill threshold raw<0.15. Inner fill (r2/g2/b2) brighter than outer = warm glow from inside.

---

## Background analysis (NEW 2026-06-16)

Full frame-by-frame background analysis done — see `background-motifs-reference.md`
(companion to `orb-motifs-reference.md`). 9 subagents (one per section A–I) +
synthesis, confirming/refuting 8 Gemini "background architecture" hypotheses.
**10 real bg mechanisms** identified; key reframings: "feedback tunnel" is mostly
directional smear / perspective geometry (feedback = glow not structure); "CRT
scanlines" is actually a subtle STATIC dither/hatch; "aurora ribbons" = the fbm
fluid we already have. Muted-rule exceptions: kaleido/fountain/net/supernova run vivid.

## Pending work (not done)

- **Background kit helpers (NEW — from bg analysis):** extend `alcFluid` with
  iso-contour ridges + green↔magenta marble (BG4, highest leverage, 90% built);
  `bgNetTunnel()` radial-ray shader (BG8, G section has no bg shader); 1-line
  `bgHatch()` static dither (BG10); extract `bgKaleido()`/`bgMoire()` + finish
  butterfly; `bgFountain()`/vortex (BG7); `bgWaveHorizon()` (BG9); `bgSolidSnap`.
- **Gradient Orbs scene** needs screenshot validation after latest fix (orbit R 0.26→0.18,
  q5 0.04). First result showed blobs clipped at edges — needs user screenshot confirmation.
- **Moiré kaleidoscope** — bars-as-wave approach confirmed correct; butterfly look needs tuning.
- **Journey sequencer** — crossfade between scenes (deferred).
- **Fluid marble background** — reusable fbm/domain-warp comp shader (now spec'd as BG4 ridge extension).
- All Ambience/Battery presets tuning from screenshots (ongoing as-needed).
