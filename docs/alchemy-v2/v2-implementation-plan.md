# Alchemy v2 — Implementation Plan ("the one that kills")

Goal: a **composable Alchemy framework** in Butterchurn that fixes every gap we found and
nails the user's quality bar — **crisp, smooth, dense, live-waveform geometry** (small
ringed orbs joined by a **single thin lightning line**, a **central flower that IS the
waveform**) over **rich, complex, colored backgrounds**, never blurry/laggy/sparse/too-black.

This plan is built from: [`README.md`](README.md) (reference framework + 31-scene timeline),
[`reconciliation.md`](reconciliation.md) (Butterchurn constraints + Gemini corrections),
[`impl-analysis/`](impl-analysis/) (our current gaps + the user's observations). The
reference clip is **one example** — we build the framework, not a frame replay.

> **Hard constraints (from CLAUDE.md):** equations are JS functions; `point_eqs` must be a
> function for enabled waves; drive all jaggedness from `a.value1` (never synthetic `sin()`);
> GLSL reserved-name trap (no `ang`/`rad`/`ret`/`uv`/`q*` locals in `shader_body`);
> MUTING rule for Alchemy (dusty/pastel + Reinhard tone-map, never neon/white) — relaxed
> only for kaleidoscope/supernova; **do NOT touch the existing `Alchemy Random` preset.**

---

## 0. Architecture decision (recommended)

**Build a shared "Alchemy Kit" of reusable builders + several composed scene-presets, not one
monolith.** Rationale:
- Butterchurn runs **one preset at a time** and **crossfades on switch** — free, good-looking
  transitions and a natural "compose scenes in any order" via the existing dropdown / ⏮⏭🎲 nav.
- MilkDrop's per-preset budget (≈**4 custom waves + 4 custom shapes** + 1 warp + 1 comp) is
  tight; giving **each scene its own preset** gives each its full budget for density.
- The **framework = the shared kit** (motif builders, palette, tone-map, feedback presets,
  perspective helper) that every `Alchemy v2: <scene>` preset is assembled from. Recompose
  freely by adding/reordering presets.
- *(Optional later)* one `Alchemy v2: Journey` mega-preset that sequences modes internally
  via a `q`-var scene state machine + timed crossfades, for the full continuous experience.

**The one decision to confirm before coding:** multi-preset kit (recommended) vs. a single
internally-sequenced mega-preset. The kit approach is assumed below.

---

## 1. Phase 0 — Foundations & capability verification (de-risk first)

Before authoring scenes, verify the Butterchurn build's real limits (cheap, prevents rework):

- **T0.1** Confirm custom **wave count** (expect 4: `waves[0..3]`) and **custom-shape** support
  + per-shape `border_*` (the orb "Saturn ring" for free) and `num_inst` instancing.
- **T0.2** Confirm whether **`q1..q32` reach the warp/comp shaders** in this build. If yes →
  scene selector + per-scene shader params can be data-driven from `frame_eqs`. If no → derive
  the scene selector inside the shader from `time` (mirror the `frame_eqs` schedule) and pass
  audio only via the built-in `bass/mid/treb` uniforms. **This gates the sequencer design.**
- **T0.3** Confirm additive wave glow (`additivewave`) + that a **Reinhard tone-map in `comp`**
  (`ret = c/(c+k)`) compresses bloom without killing color. Lock the global tone-map snippet.
- **T0.4** Scaffold the **Alchemy Kit** in `wmp-presets.js` (new section, additive only — no
  edits to existing presets): namespaced helpers (below). Add **one** `P["Alchemy v2: Orbiters"]`
  + its `FAVORITES` row in `viz.js` as the first composed preset / tuning anchor.
- **T0.5** Re-establish the validation loop: `node --check` + the frame_eqs runtime check, and
  the **ANGLE shader pre-check** via chrome-devtools MCP for every comp/warp before asking for a
  reload (per CLAUDE.md). Commit the scaffold.

**Kit API to build (the framework surface):**
| Helper | Produces | Notes |
|---|---|---|
| `alcOrbiters({n:2,size,ratio})` | 2 small orb shapes + white border rings + **1 thin `waveLine` tether** | the U3/U4/U5 fix; tether disp small & `treb`-driven |
| `alcWaveFlower({spokes})` | radial `circleWave`, `r = base + a.value1*amp` | central flower **IS** the waveform (U3) |
| `alcNet({perspective})` | straight `waveLine`s on a funnel, `mid_att` chaos morph | Wireframe Net (G6), uses perspective helper |
| `alcUrchin()` | radial `waveLine`, spoke len ∝ raw `bass` + `a.value1` | Supernova/Anemone spikes |
| `persp(x,y,z,vp)` | fake-perspective divide toward off-center VP | the 3D corridor camera (G2) |
| `bgFluid()/bgKaleido()/bgCorridor()/bgMoire()/bgSolidSnap()` | GLSL comp/warp snippets | complex backgrounds (U6/G5) |
| `pal(t)/mutedMix(a,b,phase)` | dusty palette + energy-coupled hue | muting + G13 |
| `tonemap()` | Reinhard comp tail | global, every preset (U1/G8) |
| `fb.crisp/fb.trail/fb.vortex/fb.snap` | `{decay,zoom,rot,dx,dy,wrap,darken_center}` presets | scene-aware feedback (G3/G7) |

**Acceptance:** kit compiles; `Alchemy v2: Orbiters` loads; tone-map + additive verified; q-var-in-shader question answered.

---

## 2. Phase 1 — The signature motif: Orbiters (fixes U1, U3, U4, U5 — the headline kill)

This is the make-or-break motif and the cleanest tuning target (reference `s03`).

- **T1.1 Orbs:** two small `circleWave`/shape orbs, **small radius** (`~0.03 + 0.02*bass_att`),
  each with a thin near-white **Saturn ring** (shape `border` or a concentric thin ring wave).
  Centers walk in `frame_eqs` on **opposing ellipses** (180° phase), continuous in `time`.
- **T1.2 The single lightning tether (the U4 fix):** **ONE** thin `waveLine` between the two
  orb centers. Perpendicular displacement **small & fast**: `disp = a.value1 * SMALL *
  (0.5 + 0.5*treb_att)` → many tiny fast zig-zags = lightning, **not** a fat fuzzy band. Thin
  stroke, high alpha, **minimal feedback on it** so it stays razor-sharp.
- **T1.3 Orb:line ratio (U5):** tune orb size *down* and tether length *up* so the thin line
  dominates and orbs read as small bright nodes — match `s03` proportions.
- **T1.4 Central waveform flower (U3):** `alcWaveFlower` — radial scope where each spoke's
  radius = `base + a.value1*amp`. The flower is literally the 512 live samples; no drawn loops.
- **T1.5 Dotted receding trail:** emerges from `fb.trail` (`decay≈0.92` + small `dx<0` +
  `zoom>1`) sampling the constant-velocity orbs — past positions become the dotted chain.
- **T1.6 Crispness (U1):** use `fb.crisp` (`decay≈0.90`) for this scene; feedback sits **behind**
  geometry, never blurs the live stroke; thin high-alpha lines; tone-map so cores don't bloom white.
- **T1.7 Smoothness (U2):** max out wave **sample count** for smooth polylines; all motion off
  `time` (no frame-step quantization).

**Acceptance (must pass before moving on):** small crisp orbs + **one** thin lightning line +
a waveform-driven central flower, with a dotted receding trail, on a clean bed — visibly crisp,
smooth, correctly proportioned. Screenshot-confirmed with the user. Commit.

---

## 3. Phase 2 — Complex backgrounds + global color (fixes U6, G5, G8)

Kill the "too black / flat" problem; make backgrounds **busy, colored, multi-layered**.

- **T2.1 Fluid field `bgFluid`:** `fbm` + domain-warp in `comp`/`warp` (project already has an
  `fbm` helper), dusty teal↔purple, slow drift, **flow rate ∝ audio energy**. Low-contrast so it
  enriches without competing.
- **T2.2 Kaleidoscope `bgKaleido`:** 4-fold mirror UV fold (`abs` + diagonal swap) with lens/arc
  contours; allowed to be **vivid** (relaxed muting).
- **T2.3 Corridor `bgCorridor`:** horizontal receding color bands with off-center VP + horizontal
  feedback pan (pairs with the perspective helper).
- **T2.4 Moiré `bgMoire`:** `step(0.5, fract((uv.x + time*v)*density))` stripes, quad-mirrored.
- **T2.5 Solid-snap `bgSolidSnap`:** `q`-var/`time`-driven solid color that **flips instantly**
  (sage-green, cobalt-blue) with `decay≈0` during the snap.
- **T2.6 Global palette + tone-map:** dusty `mutedMix` palette; **energy-coupled hue rate**
  (accumulate `bass+mid+treb`); **Reinhard tone-map on every preset** so nothing blows to white.

**Acceptance:** each background renders correctly (ANGLE pre-checked), reads as complex/colored
not flat, stays muted (except kaleido), no white-out. Commit per background.

---

## 4. Phase 3 — Compose the scene-presets from the kit

Each is a `P["Alchemy v2: <name>"]` + `FAVORITES` row, assembled from kit helpers, individually
tuned & screenshot-verified. Order = by impact/leverage:

1. **Orbiters** (Phase 1) — done first.
2. **Anemone Pulsar** — `alcWaveFlower` (dusty pink) on `bgSolidSnap` cobalt, flanked by
   `alcOrbiters`; radial alpha-fade + tone-map (glowing pollen, not white).
3. **Vortex (feedback-driven, fixes G3):** start from anemone/urchin geometry, apply `fb.vortex`
   (`zoom≈0.96` inward + `rot≈0.05–0.08`) + radius-proportional angular twist in `warp` +
   `darken_center` → arms **emerge from the trail**, not drawn pinwheel lines.
3. **Wireframe Net / Corridor (G2, G6):** `alcNet` with the `persp` helper (off-center VP, camera
   low-left), morph ordered↔tangle on `bass`, over `bgCorridor`; orbiter dotted trail recedes.
4. **Glowing Ring + Fluid:** torus-ish `circleWave` + inner white rim + aperture lattice strands
   over `bgFluid` (the U6 "complex background" showcase).
5. **3D Ribbon:** `waveLine` plane row with `persp` + sine height (`*bass`), `alcOrbiters` weaving
   over/under, slow camera orbit, flare bloom (tone-mapped).
6. **Supernova:** `alcUrchin` with spoke length ∝ **raw `t.bass`** (un-smoothed, explosive) +
   `a.value1`; optional 1-frame **color invert** in `comp` on heaviest beat; vivid allowed.
7. **Mandala:** nested polygon `waveLine`s, **hard-edged/crisp**, `decay≈0`, flat-blue bg, a
   **persistent diagonal live-waveform line** (`a.value1`) slicing across.
8. **Kaleidoscope X / Red-Green tunnel:** `bgKaleido` + zoom-surge on bass + palette strobe.

**Acceptance per preset:** matches its reference *character*; crisp; dense (enough strands —
fixes U6 "too few"); muted-or-intentionally-vivid; audio-reactive; ANGLE-clean; user screenshot OK.

---

## 5. Phase 4 — Polish, artifacts, smoothness pass (cross-cutting)

- **T4.1** Kill the **border vignette** (G9): `wrap=0` (clamp) + darken comp at UV edges.
- **T4.2** Cull the **stray white dot** (G10) — find the stuck wave point/instance.
- **T4.3** **Smoothness (U2):** audit point counts + shader cost; ensure 60fps; no steppy motion.
- **T4.4** **Sharpness (U1):** final per-scene `decay`/thickness/alpha tune so lines are crisp.
- **T4.5** **Density (U6):** raise strand/spoke counts and layer motifs where scenes feel sparse.
- **T4.6** Verify the **muting rule** holds everywhere (Reinhard `k` per scene); only kaleido/
  supernova vivid.

## 6. Phase 5 — (Optional) `Alchemy v2: Journey` auto-sequencer

If desired after the scene-presets land: one preset with a `q`-var `scene` advanced by timer +
energy accumulator, all motif layers present but gated per scene, comp shader branching on the
scene selector (per T0.2 outcome), with the discrete events (two bg snaps + a hard cut) and the
finale **settling into a held corridor** (not a white-out, not endless spin — per the
[`reconciliation.md`](reconciliation.md) ending correction).

---

## 7. Validation & working agreements (every step)

- `node --check wmp-presets.js && node --check viz.js`; run the frame_eqs runtime check.
- **ANGLE pre-check** every comp/warp via chrome-devtools MCP **before** asking for a reload
  (GLSL can't compile in Node; this is the only way to catch the reserved-name/link errors).
- **Commit before any big change**; small commits per preset (easy `git revert`).
- **Iterate from the user's screenshots** — state what changed each round, one focused question.
- Keep `Alchemy Random` and all existing presets **untouched** (v2 lives in new `P[...]` entries).

---

## 8. Definition of done — the "kills" criteria (traceable to the user's complaints)

| User complaint | Done when |
|---|---|
| U1 lines blurry/not sharp | Live strokes are crisp; feedback is a trail *behind*, never softens the stroke; no white blowout |
| U2 laggy/not smooth | 60fps, dense smooth polylines, continuous `time`-based motion |
| U3 central flower is drawn, not waveform | Central flower = radial `a.value1` scope (no drawn loops) |
| U4 connecting line too wide/fuzzy | **One** thin lightning tether, small fast `treb`-driven zig-zag |
| U5 circle:line ratio off | Small bright ringed orbs, dominant thin long line — matches `s03` |
| U6 too few lines / too black | Denser motifs + complex animated colored backgrounds (fluid/kaleido/corridor), not flat black |
| (framework) | Reusable kit composes any scene; Orbiters/Net/Anemone/Vortex/Ribbon/Supernova all available; muted+tone-mapped; audio-reactive; ANGLE-clean |

**Fidelity ceiling (honest):** the original DLL is proprietary and procedural; Butterchurn has
no mesh/geometry-shader pipeline — we match **character** (motion, blur feel, symmetry, color,
the orbs-joined-by-a-lightning-line signature), not pixels. The framework + the kit is the win.

---

### Suggested first PR
Phase 0 + Phase 1 (the kit scaffold + `Alchemy v2: Orbiters`) — it proves the framework and
directly kills U1/U3/U4/U5 on the most important motif, with the least surface area to review.
