# Alchemy v2 — Resume / handoff note

Snapshot for picking up Alchemy v2 in a fresh session. Auto-memory `MEMORY.md` loads the
key gotchas. The four **reference docs** in this folder are the source of truth:
`orb-motifs-reference.md` (foreground), `background-motifs-reference.md`,
`color-motifs-reference.md`, `camera-motifs-reference.md`. Also `README.md` +
`v2-implementation-plan.md`.

## ▶ NEXT SESSION: compose VISUALIZATIONS (scenes) from the motif kit

**The entire MOTIF KIT is now built, configurable, and node-validated.** Foreground (orbs/
lines/flowers), backgrounds (10 BG mechanisms), color behaviors, and cameras all exist as
reusable, parameterized helpers in `wmp-presets.js` (before `var P = {}`). The next phase is
**assembling scenes** (`P["Alchemy v2: <name>"]`) by composing kit pieces — NOT building new
primitives.

**A scene = CAMERA × MOTIF(s) × COLOR × BACKGROUND-FIELD, composed thinly:**
1. `build(alcCamera(kind), { frame, warp, comp })` — pick a camera preset.
2. In `frame_eqs`: drive color (`alcHueClock`/`alcEnergy`/`alcBeatFlash`), camera
   (`alcCamPlunge`/`alcCamVortex`/`alcCamRoll`/`alcCamFloat`), and the q-vars motifs read
   (q1 angle, q7 radius, q8 hue, q21–q24 orb positions, q26 tether, …).
3. `preset.waves[i] = <motif builder>(…, colorize)` — foreground geometry (pass an `ALC_PAL`).
4. `comp:` = `NOISE_GLSL + PAL_GLSL + <field GLSL helpers> + shader_body{ field + sampler_main +
   bloom + alcFog + Reinhard tone-map + ALC_HATCH }`.
5. Add to `FAVORITES` in `viz.js`; set `DEFAULT_PRESET` to it for screenshot iteration.
6. **Validate** (`node --check` + the frame/point-eqs runtime check) BEFORE asking for a reload;
   GLSL can't be node-checked — rely on the in-browser `[WMP-viz shader]` hook.

**Hard-won iteration lessons from this session (READ before composing):**
- **`decay` baseVal is DEAD in this build** — fade is the WARP shader (`ret *= k` or `ret -= x`).
  Default warp keeps trails ~forever. To control trail life, write a custom warp.
- **Reload cadence:** make ONE focused change, state it, ask for ONE screenshot. The user iterates
  hard on look — don't batch many visual changes (hard to attribute).
- **The user's eye wins over guidelines** (e.g. bold marble veins beat the muting "fix"). Confirm
  muted-vs-vivid from the section's own frames; muting rule has documented exceptions (kaleido/
  fountain/net/supernova run vivid).
- **Match the original's MECHANISM, not just the look** — the user will check the source video
  (e.g. Net Tunnel = rotating line + feedback trace, NOT a drawn shader; strobe for discrete spokes).

---

## Earlier session: Orb Motif Completion

All 18 orb variants from `orb-motifs-reference.md` are implemented as kit functions or
composable from existing pieces.

---

## Complete Kit (all in `wmp-presets.js`, before `var P = {}`)

### Cameras (`camera-motifs-reference.md`)
- `alcCamera(kind)` — static presets: `top`/`side`/`orbit`/`flat` + `hold`/`plunge`/`vortex`/`tiltFloor`
- per-frame drivers (call in `frame_eqs`, fields stack): `alcCamPlunge` (zoom>1 + drifting VP),
  `alcCamVortex` (inward zoom + spin — the signature camera), `alcCamRoll` (bank + beat-snap),
  `alcCamFloat` (smooth pan-drift), `alcCamJitter` (transient shake accent)

### Color: SCHEME × BEHAVIOR (`color-motifs-reference.md`)
- SCHEME palettes (keyed by q8 hue): `ALC_PAL.twoTone / mono / spread / roseGreen / redCyan / warm`
  - dominant scheme is **complementary two-tone ping-pong** (roseGreen green↔magenta), NOT rainbow scroll
- BEHAVIOR drivers: `alcHueClock(hue,dt,energy,base,gain)` (shared hue accumulator),
  `alcEnergy(t)` (loudness envelope → gate sat/brightness, not hue), `alcBeatFlash()` (transient flash),
  `ALC_FOG_GLSL`/`alcFog` (depth/vignette jewel fog), `alcChroma(amt)` (chromatic aberration)
- `alcSetColor(a,h,warm,gain)`, `alcPalette(spec)` — low-level color helpers

### Background FIELD motifs (`background-motifs-reference.md` — all configurable now)
- GLSL fields: `alcFluid(…,deep,mids,hi)`, `alcMarble(…,colA,colB,vein)`, `alcAurora`, `alcWash(…,colA,colB)`,
  `alcRadialBloom(…,colA,colB)`, `alcHorizonBands`, `alcMoire(…,barCol)`, `alcSolidSnap`
  (prepend `NOISE_GLSL`/`PAL_GLSL` as noted); transforms `alcKaleido` (n-fold fold), `ALC_HATCH` (dither)
- wave/feedback fields: `alcRotLines` (net tunnel), `alcRadialBurst` (fountain/vortex), `bgWaveHorizon`

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

## Status: MOTIF KIT COMPLETE ✓

All four motif families are built, **configurable** (every motif takes color as a param/
palette), and node-validated: foreground orbs (`orb-motifs-reference.md`), backgrounds
(`background-motifs-reference.md`), color behaviors (`color-motifs-reference.md`), cameras
(`camera-motifs-reference.md`). 62 presets load clean.

## ▶ Next phase: compose scenes (the handoff goal — see top of this file)

Build `P["Alchemy v2: <name>"]` scenes by composing kit pieces. Candidate scenes to author
(each maps to a video section; use the section's reference frames + the mechanism notes):
- **Net Tunnel** — already mostly done this session (rotating-line fan + aurora bleed + gold
  orbiters + dark hole); confirm/finish from screenshots. The reference build pattern for
  feedback + composed motifs.
- **Marble** (done — bold green↔magenta veins), **Fountain** (built, never screenshotted — verify),
  **Bullseye Orbiters**, **Gradient Orbs** (needs screenshot validation).
- **Not yet wired into scenes** (kit pieces exist, no demo): `alcWash`, `alcRadialBloom`,
  `alcHorizonBands`, `alcChroma`, `alcKaleido`, `bgWaveHorizon`, `alcSolidSnap`, and the camera
  drivers (`alcCamPlunge/Vortex/Roll/Float/Jitter`). Each could anchor a scene.
- **Moiré scene** still uses its old x-only inline comp; point it at the new `alcMoire` (butterfly).
- **Journey sequencer** — crossfade between scenes (deferred).

Ongoing as-needed: Ambience/Battery preset tuning from screenshots.
