# Reconciliation — Gemini blueprint × frame analysis × Butterchurn reality

Three inputs now describe the Alchemy clip:
1. [`README.md`](README.md) + [`sections/`](sections/) — **my frame-by-frame analysis** of
   the actual clip (373 frames @ 2fps). This is the **ground truth for what's on screen**.
2. [`gemini-blueprint.md`](gemini-blueprint.md) — Gemini's **architecture/math spec**. Strong
   on equations, feedback constants, and audio bindings; written for a **from-scratch
   OpenGL/WebGL engine**, so its *implementation* assumptions don't all hold for us.
3. This file — how to **translate** Gemini's techniques into **Butterchurn primitives**, plus
   the **corrections** where the blueprint contradicts the frames.

> **TL;DR for the preset author:** Use Gemini's *equations and feedback numbers* as a
> starting point, but implement everything through Butterchurn's `baseVals` / `frame_eqs` /
> custom-wave `point_eqs` / `warp`+`comp` GLSL — **we have no custom vertex/geometry shaders,
> no 3D mesh pipeline, and no per-frame FBO code.** And ignore Gemini's white-out ending — the
> clip actually **freezes on a held frame**.

---

## 1. The architectural mismatch (read this first)

Gemini assumes you are writing the engine. **We are not** — Butterchurn 2.6.7 *is* the
MilkDrop FBO-feedback engine, and it only exposes specific hooks. Map every Gemini concept
onto the right hook:

| Gemini concept | Butterchurn reality | Where it lives |
|---|---|---|
| FBO ping-pong loop (`Color_prev×0.95−0.01`) | Already built-in. You only set **`decay`** (≈0.95), plus `zoom`/`rot`/`dx`/`dy`/`warp`/`echo_*`. | `baseVals` + `frame_eqs` |
| UV scale-up ×1.02 on feedback | **`zoom > 1`** (outward) or `< 1` (inward, for the vortex) | `baseVals.zoom` / `frame_eqs` |
| Feedback rotation 0.01 rad | **`rot`** | `baseVals.rot` / `frame_eqs` |
| Subtractive blend to avoid white-out | **`decay < 1`** + `darken_center`; tone-map in `comp` | `comp` shader (Reinhard) |
| Custom **vertex shader** displacing a mesh | ❌ Not available. Fake 3D by computing `a.x/a.y` in a custom wave's **`point_eqs` (a JS function)**, projecting yourself. | `waveLine()`/`circleWave()` `point_eqs` |
| **Geometry shader** (Supernova face-break, mandala emit_vertex) | ❌ Not available. Use many custom-wave points / multiple waves. | custom waves |
| 3D mesh (icosphere, torus-knot, 200×200 plane) | ❌ No mesh pipeline. Approximate via parametric custom waves or a `comp`-shader SDF/field. | custom waves or `comp` |
| FFT band array `wave_raw[X_index]` | We get **`t.bass/mid/treb`** (+`_att` smoothed, ≈0..2) and the **time-domain** samples `a.value1/a.value2` per wave point. No easy raw FFT *spectrum* array. | `frame_eqs(t)` / point `a` |
| Vertex/fragment GLSL `uniforms` | `warp`/`comp` get `time,bass,bass_att,mid,treb,treb_att,frame,fps,resolution,sampler_main`. | `warp`/`comp` strings |
| Per-frame CPU logic (`if bass_hit`, color_index++) | Do it in **`frame_eqs`** with `q`-vars; persist state across frames via `q1..q32`. | `frame_eqs` |

**Consequences / cautions:**
- Anything Gemini renders as a **3D mesh** (Scenes 2, 6, 9, 11, 12) we must **fake**: either
  parametric custom waves with a hand-written perspective divide in `point_eqs`, or a
  field/SDF in the `comp` shader. Expect *character*, not exact geometry.
- **GLSL reserved-name trap** (project CLAUDE.md): never declare `ang`, `rad`, `ret`, `uv`,
  `time`, `bass…`, `q1..q32` as locals in `shader_body` — use `pang`, `pr`, etc.
- For an **enabled** custom wave, `point_eqs` **must be a function** (string eqs are skipped
  for converted presets). Drive jaggedness from `a.value1`, never synthetic `sin()`.

---

## 2. Global mappings (these hold across all scenes)

### Audio
| Gemini | Butterchurn | Notes |
|---|---|---|
| `bass_env` | `t.bass_att` (smoothed) or `t.bass` (snappier) | scale/zoom/shake/anemone expansion |
| `mid_env` | `t.mid_att` / `t.mid` | hue-cycle rate, vertex undulation, twist, net density |
| `treb_env` | `t.treb_att` / `t.treb` | luminance, line spawning, strobe rate |
| `wave_raw[i]` | `a.value1` / `a.value2` (per wave point) | the live oscilloscope; drives all "jagged" geometry |
| "raw un-smoothed peak" (Supernova) | `t.bass` (not `_att`) | use the un-smoothed band for explosive, non-breathing spikes |

Gemini's normalization is 0..1; Butterchurn audio is ≈0..2 (`_att` smoothed). Rescale
constants accordingly (halve Gemini's multipliers as a first guess, then tune from screenshots).

### Feedback (consolidated from Gemini's per-scene numbers — good starting values)
| Scene type | `decay` | `zoom` | `rot` | extra |
|---|---|---|---|---|
| Wavy grid / corridor (S1) | ~0.93–0.96 (Gemini's "0.70" is too aggressive — frames show long trails) | 1.0 | 0 | horizontal `dx<0` smear for the pan |
| Wireframe (S2) | ~0.95 | 1.005 | 0.002 | faint ghost web |
| Kaleidoscope X (S3) | ~0.98 | 1.05 (→1.15 on bass) | small | the surge spike is the whole effect |
| Neural net (S4) | ~0.90 (high retain) | 1.0 | 0.01 (Z) | curved smear fills murky bg |
| Abstract-eye / bg-snap (S5) | **off / very low** | 1.0 | 0 | so solid bg snaps render crisp |
| Anemone (S6) | ~0.95 + slight outward blur | ≥1.0 | 0 | bloom + orbiter tails |
| Vortex (S7) | ~0.95–0.965 | **<1.0** (inward) | ramping ~0.07 | inward zoom + rot = spiral |
| Mandala (S8) | **very low** | 1.0 | 0 | keep N-gon lines crisp |
| Ring + fluid (S9) | ~0.95 | 1.0 | slow | fbm in `comp`/`warp` |
| Moiré bars (S10) | low | 1.0 | 0 | stripes are a `comp` shader |
| Ribbon (S11) | high | 1.0 | 0 | vertical blur softens plane; flare bloom |
| Supernova (S12) | ~0.92 | ≥1.0 | chaotic | raw-bass extrusion; optional 1-frame invert |
| Finale (S13/I) | hold (see correction) | ~1.0 | 0 | **NOT** a white-out — see §3 |

### Coordinate regimes (agrees with my analysis)
- **3D right-of-center corridor** (camera low-left): corridor, wireframe, ribbon, terrain →
  bake an *asymmetric* perspective divide into `point_eqs`; don't center the vanishing point.
- **2D radial/polar mirror**: kaleidoscope, mandala, anemone, vortex, supernova, final eye →
  fold UV in the `comp` shader (`abs()`, diagonal swap) and/or polar `circleWave`s.

### Color (reconcile with project's MUTING rule)
Gemini repeatedly calls for "max saturation neon." **Override for the muted families.** Per
CLAUDE.md and the frame analysis: keep orb/anemone/net scenes **dusty/pastel + tone-mapped**;
allow vivid saturation **only** where the reference genuinely is (kaleidoscope/X-tunnel S3/S5,
late terrain/supernova). Implement hue cycling as a slow palette drift whose **rate is coupled
to audio energy** (faster in loud passages) — both Gemini and my analysis agree it cycles; my
analysis adds the energy-coupling.

---

## 3. Corrections — where Gemini is WRONG vs. the frames

Trust the frame analysis over the blueprint on these:

1. **The ending (biggest error).** Gemini Scene 13 describes an *exponential zoom-to-white
   washout* (`fbo_alpha_retain → 1.05`, scale ×1.10) over the final 3–4s. **The clip does
   NOT do this.** Frame analysis: the finale is the **Supernova urchin → a static green
   one-point-perspective corridor**, and the clip **freezes on a held/paused frame** (WMP
   transport bar reappears; last ~10s are identical). → **Do not build a runaway white-out.**
   End on a held corridor (or just let it loop).
2. **Total length / scene count.** Gemini compresses everything into 0:05–2:46 / 13 scenes.
   The clip is **3:06** with **~31 micro-scenes** (see README timeline). Gemini's 13 are real
   *macro* beats but it **misses**: the **Orbiters-isolated-on-black** lull (0:14–0:16.5), the
   **stacked-waveform "terrain"** passage (~2:34–2:42), the **prism/RGB-split** crossed-waveform
   X (~2:28–2:34), and several morph sub-states.
3. **Transitions.** Gemini implies clean cuts between its 13 scenes. Frames show **mostly
   continuous morphs**, punctuated by a few discrete events: **background color SNAPS**
   (sage-green @0:47, cobalt-blue @0:52), and a genuine **hard CUT to flat blue @1:13.5**.
   Model those three as discrete; everything else crossfades/morphs.
4. **Scene-1 feedback `Alpha *= 0.70`** is too aggressive — frames show *long* persistent
   trails, i.e. high retain (decay ~0.93–0.96). Gemini's own later scenes use 0.90–0.98, which
   matches better.
5. **"Solid bright cyan/blue" everywhere for the Anemone (S6).** Frames show the Anemone era
   actually arrives via two **background snaps** (sage-green *then* cobalt-blue) and the orbs
   are **tethered by a single live waveform line** (the WMP signature) — capture that tether,
   which Gemini omits.
6. **Saturation.** Gemini's "maximum saturation magenta↔lime" is right for the supernova but
   wrong for the muted orb/anemone/net scenes (see §2 color). Don't globally neon everything.

Where they **agree** (high confidence — build to these): FBO feedback is 80% of the look;
bass→scale/zoom, mid→complexity/hue-rate, treb→spawn/flash; background color-snap behavior in
the eye scene; the vortex = same anemone geometry + inward-zoom + rotation feedback (twist);
the moiré stripes are a pure screen-space `fract/step` shader; the oscilloscope/grid is
`wave_raw` plotted as displacement.

---

## 4. Per-scene "Gemini equation → Butterchurn recipe" quick map

| Macro scene | Gemini math | Butterchurn implementation |
|---|---|---|
| Wavy grid (S1) | `Y=Y_base+wave_raw*scale`, x-pan + mod loop | `waveLine` rows; `a.y += a.value1*amp`; perspective divide in `point_eqs`; `dx<0` pan; bands via `comp` `sin(uv.y*N)` |
| Wireframe hyperboloid (S2) | `R(z)=base+a·z²`, `X=R cosθ` | many `waveLine`s parametric `(cos,sin)` w/ z-scaled radius + perspective divide; `mid_att`→twist |
| Kaleidoscope X (S3) | `θ_folded=mod(atan,π/2)`, scale-surge FBO | `comp` UV fold (`abs`, diagonal swap) + arc contours; `zoom` pulse to ~1.15 on `bass`; palette strobe |
| Neural net (S4) | simplex-noise vertices + proximity lines | `waveLine`s with `a.value`-driven jitter (`*mid_att`); `rot` Z feedback; horizontal oscilloscope slices = extra flat `waveLine`s |
| Abstract eye + snaps (S5) | normalize-to-circle hoop; bg color array on snare | `circleWave` radius `R0+bass_att` with `a.value1` jaggedness; `frame_eqs` switches a `q`-var bg color on a beat flag; `decay≈0` |
| Anemone pulsar (S6) | spherical golden-spiral spikes + elliptical orbiters | radial `circleWave`/`waveLine` spokes `*bass_att`; 2 `circleWave` orbiters + 1 `waveLine` tether (Dance pattern); radial alpha fade in `comp` |
| Vortex (S7) | twist: `θ'=atan+twist·r`, inward FBO zoom | feedback `zoom<1` + `rot` ramp via `frame_eqs`; angular twist ∝ radius in warp; reuse S6 geometry |
| Mandala (S8) | N-gon `(cos,sin)` w/ alt inner/outer R | nested `waveLine` polygons (sample→vertex); counter-rotate via `q`; persistent diagonal `waveLine` w/ `a.value1`; `decay≈0` |
| Ring + fluid (S9) | torus-knot wireframe + fBm domain-warp bg | `comp`/`warp` `fbm()` bg (project already has `fbm` helper); ring as a `circleWave` torus approximation; additive |
| Moiré bars (S10) | `step(0.5,fract((uv.x+t·v)·density))` | drop nearly verbatim into `comp`; `density` ∝ `mid`; central diamond = small `waveLine` octagon |
| 3D ribbon (S11) | `Y=sin(X·f1+t)cos(Z·f2+t)·amp`, camera orbit | a `waveLine` "ribbon" row with perspective + sine height (`*bass_att`); orbiters weave (Dance); Fresnel-ish color in `comp` |
| Supernova (S12) | normal extrusion `V+N·raw_peak` | radial `circleWave` urchin, spoke length `*t.bass` (un-smoothed) + `a.value1`; optional 1-frame invert in `comp` on beat |
| Final eye (S13/I) | exp Z accel → white-out | radial dense `circleWave`/`waveLine` eye over faint `fbm`; **HOLD on a corridor — no white-out** (see §3) |

---

## 5. Recommended next step

When we start building **`Alchemy v2`** (new preset, original untouched):
1. Stand up the **feedback bed + tone-mapped `comp`** on the cleanest reference (Orbiters on
   black) using the §2 feedback table — this is 80% of the look.
2. Build the 3 motif layers (Orbiters / Wireframe Net / Anemone) as reusable `waveLine`/
   `circleWave` functions driven by `q`-vars (reuse the `Dance` machinery).
3. Build background modes as `comp` branches (corridor bands, solid-snap, fbm fluid, moiré,
   kaleido fold, radial tunnel).
4. Sequence via a `q`-var `scene` on a timer/energy accumulator; fire the 3 discrete events
   (two bg snaps + the 1:13.5 hard cut); couple hue rate to energy.
5. Iterate from the user's screenshots; small commits.

Honest ceiling: we match **character** (color, motion, symmetry, feedback feel, the
orbs-joined-by-a-waveform signature), not pixels — the original DLL is proprietary and we
have no real mesh/geometry-shader pipeline.
