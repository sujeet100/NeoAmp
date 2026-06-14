# Alchemy v2 — Reference Analysis & Recreation Blueprint

This folder is the **complete reverse-engineering spec** for the Windows Media Player
**Alchemy** visualizer, produced by analyzing the source clip frame-by-frame, for the
purpose of building a higher-fidelity **Alchemy v2** Butterchurn preset *alongside* (not
replacing) the existing one.

- **Source video:** `~/Downloads/YouTube 1080p 60fps Download.mp4` — 186.4s (3:06),
  1280×720, 60fps, full-frame capture (no WMP-pane crop needed).
- **Method:** extracted 373 frames at 2fps (one every 0.5s, `f_NNNN.png`,
  `t = (NNNN-1)*0.5`), scanned via montages to find scene boundaries, then dispatched
  9 parallel analyst agents — one per ~18–28s segment — each reading **every frame** in
  its range and writing a multi-page spec. Key frames per scene are not committed —
  regenerate from the source videos with [`keyframes.md`](keyframes.md).
- **Framework note:** the reference clip is **one example**. The goal is a *composable
  framework* (motif primitives + feedback engine + audio mapping + scene sequencer), not a
  frame-exact replay — once the framework is right, scenes recompose freely. Judge by
  *character*, not scene order.
- **Companion docs:**
  [`gemini-blueprint.md`](gemini-blueprint.md) — transcription of Gemini's architecture/math
  spec (equations, feedback constants, audio bindings; written for a generic GL engine).
  [`reconciliation.md`](reconciliation.md) — **start here before building** — translates the
  Gemini blueprint into our Butterchurn primitives and lists where it's factually wrong vs.
  the frames (notably: **no white-out ending — the clip freezes**).
  [`impl-analysis/README.md`](impl-analysis/README.md) — **gap analysis of our CURRENT
  preset** vs. this framework (5 critical/important capability gaps; top need = the missing
  Orbiters layer + a 3D camera + feedback-driven vortex). Includes the user's authoritative
  live observations + the second Gemini report in `impl-analysis/user-notes-and-gemini.md`.
  [`v2-implementation-plan.md`](v2-implementation-plan.md) — **the build plan** ("the one that
  kills"): a shared Alchemy Kit + composed scene-presets, phased, with done-criteria traced to
  every user complaint.
- **Per-segment specs (read these for full detail — each is 1+ page/scene):**
  [A 0:00–0:22](sections/section_A.md) ·
  [B 0:22–0:40](sections/section_B.md) ·
  [C 0:40–0:58](sections/section_C.md) ·
  [D 0:58–1:16](sections/section_D.md) ·
  [E 1:16–1:36](sections/section_E.md) ·
  [F 1:36–2:00](sections/section_F.md) ·
  [G 2:00–2:28](sections/section_G.md) ·
  [H 2:28–2:48](sections/section_H.md) ·
  [I 2:48–3:06](sections/section_I.md)

> **Capture chrome warning:** frames up to ~0:11 show the WMP transport bar (bottom
> center) and an Italian *"Registrazione in corso"* recording badge (top right). These
> are screen-capture overlays, **not** part of the visualization — ignore them. From
> ~0:12 onward the capture is full-bleed. The clip **ends on a frozen/paused frame**
> (~2:55 onward is identical, WMP transport bar reappears) — there is **no** fade-out or
> runaway zoom finale.

---

## Part I — Global architecture & core philosophy

Alchemy is **algorithmic, real-time, audio-driven** — not keyframed. To recreate it you
program rules for **shapes, camera, color cycling, and frame-feedback (echo)**. Four
foundations carry the whole look:

1. **Frame feedback / motion blur — the single most defining trait.** The screen is
   never fully cleared. Each frame = (previous frame, transformed slightly + faded a few
   %) with new geometry drawn on top. This produces every tunnel, trail, smear, "net",
   and ghost in the piece. Tune this *first* — it is 80% of the look. Too strong → wash
   to white; too weak → loses the fluidity. In Butterchurn terms: `decay`, `zoom`, `rot`,
   `dx/dy`, `warp`, `echo_*`. Across the piece decay sits roughly **0.92–0.96**, biased
   horizontally in corridor scenes and radially in vortex/tunnel scenes.

2. **Audio-reactivity mapping (consistent across scenes):**
   - **Bass / kicks →** global scale/zoom pulse, orb & ring radius, "shake," anemone
     expansion, kaleidoscope breathing.
   - **Mids / vocals →** hue-cycle rate, wireframe vertex undulation, waveform-filament
     jaggedness/amplitude, net density.
   - **Treble / hats →** brightness/bloom, spawn of sharp new waveform lines, strobe rate
     of dotted trails, finest line density.

3. **Color = continuous hue cycling, energy-coupled.** Colors are rarely static; they
   drift around the wheel. The cycle is **slow when the music is calm (~15–30s)** and
   **fast in energetic passages (~3–8s)** — drive palette phase off `time` **plus an
   audio-energy integrator** so it speeds up with the music. Palette favors high-contrast
   neon pairs (cyan/magenta, green/magenta, red/green) against either pure black or a
   flat saturated solid color. **Muting rule (project-specific, HARD for Alchemy):** keep
   the orb/anemone/net scenes dusty/pastel and tone-mapped (Reinhard `c/(c+k)`) so
   additive bloom compresses to soft color, *never* blown white. **Exception:** the
   kaleidoscope/X-tunnel and the late terrain/supernova passages genuinely reach vivid
   saturation in the reference — match per scene, don't force global muting.

4. **Two coordinate regimes, switched by scene:**
   - **3D right-of-center vanishing-point corridor** (camera low-left) — scenes 1–3, the
     ribbon, the terrain. Bake the *asymmetric* perspective into the warp; don't center it.
   - **Flat 2D radial/mirror** — kaleidoscopes, mandalas, anemone, vortex, supernova.

---

## Part II — Recurring motifs ("prefabs")

Build these as reusable layers; scenes differ mainly in **which layer dominates** and the
**background mode**. The project's existing `Dance of the Freaky Circles` preset is the
canonical implementation of the Orbiters + waveform-line idea — reuse its pattern.

### Motif A — The Orbiters *(the WMP signature; appears in A,B,C,D,E,F,G,I)*
Two glowing **core orbs**, each wrapped in a thin white **"Saturn" ring**, orbiting the
center on opposing elliptical paths. Each orb drags **(a)** a *stroboscopic dotted trail*
of its past positions (receding toward the vanishing point in 3D scenes) and **(b)** a
fan of **jagged live-audio waveform "whip" lines** (dense small zig-zags from `a.value1`).
The two orbs are frequently **joined by one waveform line** — that two-orbs-joined-by-a-
live-waveform shape *is* the Alchemy signature (essentially "Dance" in Alchemy colors).
- **Build:** two `circleWave` sprites (centers walk in `frame_eqs`, 180° out of phase,
  radius ∝ `bass_att`) + a concentric thin white ring wave each + 1–6 `waveLine`
  instances between/off them with perpendicular displacement `= a.value1*amp*(0.4+0.6*mid_att)`.
  Dotted receding trail comes from `decay≈0.92` + small `dx<0`/`zoom>1` smear sampling the
  constant-velocity orb each frame.

### Motif B — The Wireframe Net *(appears in A,B,C,D,E,G,H)*
A mesh of thin, faint, additive straight line-segments that **morphs between an organized
symmetric 3D form** (two cones/funnels joined at their wide bases; or a radial tunnel) and
a **chaotic tangle** of crisscrossing lines — the morph is gated on **bass**. Often the
"net" lines are themselves **live-waveform `waveLine`s**, not static geometry.
- **Build:** many `waveLine`s whose `a.x/a.y` trace a parametric 3D funnel
  `(cos θ, sin θ)` with a fake-perspective divide, blended toward chaos by adding
  `a.value`-driven jitter scaled by `mid_att`. Thin, low-alpha, additive.

### Motif C — The Starburst / Anemone *(appears in C,E,F,G,I)*
A central cluster of lines radiating from one point — dandelion/sea-anemone/urchin. It
**pulses (scales) violently on the beat**; line density rises with audio energy; in the
finale it becomes a furry radial **urchin with a dark central "eye."** Late versions curve
their radiating lines into a **spiral/vortex** under heavy rotational feedback.
- **Build:** a radial `circleWave`/`waveLine` with many spokes displaced by `a.value1`
  (real waveform → free dense jaggedness). Scale ∝ `bass_att`. Curve into vortex by adding
  `rot` to the feedback and an angular twist proportional to radius.

### Supporting backgrounds (also reused)
- **Horizontal color-band corridor** (perspective, horizontally-smeared feedback).
- **Solid flat color** that **snaps** instantly (sage-green, cobalt-blue, brown) on scene
  changes — a hallmark Alchemy move.
- **Fluid / topographic marbled swirl** (fbm/noise warp shader), neon green/magenta.
- **Vertical green/black panning stripes** → horizontal **moiré** (comp-shader, quad
  mirror).
- **Oscilloscope bars** — literal horizontal time-domain waveform band(s), mirrored.

---

## Part III — Full scene timeline (corrected from frame analysis)

Times are from the actual clip. "Cut" = hard instantaneous switch; "morph" = continuous
transform; "snap" = background color flips while geometry continues. Each row links to the
segment spec with the full per-scene page.

| # | Time | Scene | Bg | Dominant motif | Transition in | Spec |
|---|------|-------|----|----------------|---------------|------|
| 0 | 0:00–0:05 | Black intro (silence) | black | — | — | [A](sections/section_A.md) |
| 1 | 0:05–0:08 | Perspective light-tunnel "Lens-Bands + Red Rain" | h-bands | Net (nascent) + Orbiters (nascent) | fade-up | [A](sections/section_A.md) |
| 2 | 0:08–0:14 | Wireframe Net + Orbiters (corridor) | bands→black | Net ↔ Orbiters | morph | [A](sections/section_A.md) |
| 3 | 0:14–0:16.5 | **Orbiters isolated on black** (cleanest motif) | black | Orbiters | morph | [A](sections/section_A.md) |
| 4 | 0:17–0:22 | Kaleidoscope diamond/lens tiling | self | mirror kaleido + corner orbiters | crossfade (dive into orb) | [A](sections/section_A.md) |
| 5 | 0:22–0:27.5 | **Red/green 2D kaleidoscope "X" tunnel**, hue-strobe | self | 4-fold mirror arcs | morph | [B](sections/section_B.md) |
| 6 | 0:28–0:37.5 | 3D orbiting Wireframe Net (waveform strands, ordered↔tangle on bass) | black | Net | fast blurred morph | [B](sections/section_B.md) |
| 7 | 0:38–0:40 | Orbiters emerge (2 ringed nodes + jagged waveform over purple fluid) | purple fluid | Orbiters | morph | [B](sections/section_B.md) |
| 8 | 0:40–0:46.5 | Net + diagonal-waveform Orbiters collapse into central rainbow rosette | dark | Net → Anemone | morph | [C](sections/section_C.md) |
| 9 | 0:47–0:52 | 3D oblate "abstract eye" lens dilating into helical-lattice anemone | **snap sage-green** | Anemone (3D) | bg snap @0:47 | [C](sections/section_C.md) |
| 10 | 0:52–0:58 | **Anemone Pulsar** + 2 waveform-tethered Orbiters (canonical) | **snap cobalt-blue** | Anemone + Orbiters | bg snap @0:52 | [C](sections/section_C.md) |
| 11 | 0:58–1:04 | Anemone Pulsar + Orbiters; camera dives in, feedback ramps | blue water | Anemone + Orbiters | morph | [D](sections/section_D.md) |
| 12 | 1:04–1:06.5 | **Swirling Vortex** (radial lines curve into spiral @1:04, peak 1:05.5) | darkening | Anemone→spiral | morph | [D](sections/section_D.md) |
| 13 | 1:06.5–1:13.5 | Vortex unwinds back to Orbiters on dark purple | dark purple | Orbiters | morph | [D](sections/section_D.md) |
| 14 | 1:13.5–1:16 | Static Wireframe Net | **flat blue** | Net | **hard CUT @1:13.5** | [D](sections/section_D.md) |
| 15 | 1:16–1:22 | 2D nested star-polygon mandala + persistent diagonal waveform line | flat blue | Mandala (nested N-gons) | morph (collapse-to-line dropout) | [E](sections/section_E.md) |
| 16 | 1:22–1:30 | Feathery starburst zoom → 2 Orbiters + red waveform "string" → glowing wireframe donut skewered by it | dark | Anemone → Orbiters → ring | cut @~1:22.5 then morphs | [E](sections/section_E.md) |
| 17 | 1:30–1:36 | Vibrant neon green/magenta star-mandala ring over luminous fluid (Dance signature) → marbled-smoke whirlpool | fluid | Mandala + Orbiters | morph | [E](sections/section_E.md) |
| 18 | 1:36–1:42 | Fluid topographic bg + Orbiters + vertical waveform line | fluid | Orbiters | morph | [F](sections/section_F.md) |
| 19 | 1:42–1:48 | Green/red filament anemone bloom → diagonal mirror-fold | dark | Anemone/Net | morph | [F](sections/section_F.md) |
| 20 | 1:48–1:55 | **Vertical green/black panning moiré stripes** (quad mirror) + central horizontal oscilloscope band + diagonal X of waveform lines + pulsing diamond | striped | moiré + oscilloscope | morph | [F](sections/section_F.md) |
| 21 | 1:55–2:00 | **3D iridescent rainbow ribbon plane** + Orbiter pair + dandelion anemone | black | Ribbon + Orbiters + Anemone | morph through black | [F](sections/section_F.md) |
| 22 | 2:00–2:04 | Anemone-over-ribbon | dark maroon | Anemone + Ribbon | morph | [G](sections/section_G.md) |
| 23 | 2:04–2:11.5 | **3D Ribbon plane**; Orbiters weave live-waveform trails above/below | dark maroon | Ribbon + Orbiters | morph | [G](sections/section_G.md) |
| 24 | 2:12–2:19 | Radial Wireframe-Net **tunnel**; Orbiters orbit the throat | dark | Net (radial tunnel) | morph | [G](sections/section_G.md) |
| 25 | 2:19.5–2:28 | Rebloomed Anemone → giant crossing **X of two jagged waveform sawtooth beams** | dark | Anemone → waveform-X | morph | [G](sections/section_G.md) |
| 26 | 2:28–2:34 | Chromatic prism-dispersed crossed-waveform X (Orbiters), RGB split | dark | Orbiters (prism) | morph | [H](sections/section_H.md) |
| 27 | 2:34–2:42 | **Receding stacked-waveform terrain sheet** (toward left-side hub) | dark + floor reflection | Net/terrain | morph | [H](sections/section_H.md) |
| 28 | 2:42–2:48 | Sparse straight-line wireframe fan → re-condensing green net | dark | Net | morph | [H](sections/section_H.md) |
| 29 | 2:48–2:52 | Orbiters + wire-net dome | dark | Orbiters + Net | morph | [I](sections/section_I.md) |
| 30 | 2:52–3:01 | **The Supernova** — violent rainbow furry urchin/anemone, dark central eye, two corner "lightning" axes, hue-cycles on beat | black | Anemone (urchin) | morph | [I](sections/section_I.md) |
| 31 | 3:01–3:06 | Green one-point-perspective corridor — **clip FREEZES (paused)**, no zoom/fade | black | corridor | morph, then held | [I](sections/section_I.md) |

### Macro-structure (for pacing the preset)
1. **Intro / corridor era (0:00–0:40):** light-tunnel → wireframe net → orbiters →
   kaleidoscope → red/green X. Establishes Orbiters + Net over a 3D corridor; energetic
   hue-strobe finish.
2. **Anemone / vortex era (0:40–1:16):** snapping solid backgrounds (sage→cobalt), the
   Anemone Pulsar with tethered Orbiters, a dive-in **vortex** spiral, hard cut to flat
   blue. The emotional center of the piece.
3. **Mandala / fluid / ribbon era (1:16–2:00):** nested 2D mandalas on flat blue, neon
   fluid backgrounds, moiré stripes + literal oscilloscope, an iridescent 3D ribbon.
4. **Ribbon / terrain / supernova finale (2:00–3:06):** orbiters weaving over a ribbon,
   a radial net tunnel, stacked-waveform terrain, then the violent **Supernova** urchin,
   ending on a held green corridor.

---

## Part IV — Implementation strategy for the v2 preset (do not touch the original)

> **Preserve both versions.** Keep the existing `Alchemy Random` preset untouched. Add a
> **new** entry (e.g. `P["Alchemy v2"]` in `wmp-presets.js` + a `FAVORITES` row in
> `viz.js`) so the two can be compared side-by-side.

**Recommended construction order (build feedback + motifs before scenes):**

1. **Feedback bed first.** Get `decay/zoom/rot/dx/dy` + a tone-mapped comp shader feeling
   right on a single test scene (the Orbiters on black, scene 3 — the cleanest reference).
   This is 80% of the look; nail it before anything else.
2. **Build the three motif layers** (Orbiters, Wireframe Net, Anemone) as parametric
   functions driven by `q`-vars, reusing the `Dance` `circleWave`/`waveLine` machinery.
   All three are fundamentally **live-waveform geometry** — drive jaggedness from
   `a.value1`, never synthetic `sin()` zig-zags.
3. **Build the background modes** as comp-shader branches: 3D band corridor, flat solid
   (with snap), fbm fluid swirl, moiré stripes, kaleidoscope/mirror fold, radial tunnel.
4. **Sequence the scenes** with a `q`-var `scene` advanced on a long timer and/or an
   energy accumulator; crossfade between comp branches; trigger the **background snaps**
   and the **hard cut at 1:13.5** as discrete events. Couple **hue-cycle speed to audio
   energy** so it slows in calm passages and races in loud ones.
5. **Per-scene tuning from screenshots** — we cannot see the live render; iterate with the
   user's screenshots, small tweaks, commit often (see project working agreements).

**Honest fidelity ceiling:** the original DLL is proprietary and procedural; we match
*character* — color, motion, symmetry, feedback feel, the Orbiters-joined-by-a-waveform
signature — not pixels.

### Cross-checks / corrections vs. the earlier (Gemini) pass
- Clip is **3:06**, not ~2:46; total **31 micro-scenes** in 4 eras (table above).
- The finale **freezes on a held frame** (playback paused) — **no** infinite zoom tunnel.
- Many "neural nets," "ribbons," "terrains," and "starbursts" are literally rendered from
  the **live audio waveform** (`waveLine`s), which is why they look organically jagged.
- Background **color snaps** (sage-green @0:47, cobalt-blue @0:52, flat-blue cut @1:13.5)
  are discrete events, not gradual fades.
- Hue cycling **rate is audio-energy-coupled**, not a fixed period.
- Corridor scenes use an **asymmetric right-of-center vanishing point** (camera low-left).

---

## Files in this folder
- `README.md` — this master blueprint (start here).
- `reconciliation.md` — Gemini blueprint × frame analysis × Butterchurn reality (read before building).
- `gemini-blueprint.md` — transcription of Gemini's generic-GL architecture/math spec.
- `sections/section_[A–I].md` — the 9 frame-by-frame segment specs (full per-scene detail).
- `impl-analysis/` — gap analysis of our CURRENT preset (README + 3 segment specs +
  `user-notes-and-gemini.md`).
- `keyframes.md` — ffmpeg recipe + timestamp tables to regenerate reference/impl key frames
  (PNGs are intentionally not committed).

*Frames were extracted to `/tmp/alchemy_frames/` (2fps) and can be re-extracted with the
ffmpeg recipe in the project `CLAUDE.md`. The analysis specs and key frames here are the
durable record.*
