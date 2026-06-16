# Alchemy Color Motifs — Behavior Reference & Kit

Companion to `orb-motifs-reference.md` (foreground) and `background-motifs-reference.md`
(backgrounds). Those cover *shape*; this covers **color behavior** — how colors
*evolve over time and react to audio* across **all** motifs (orbs, lines, flowers,
fields). The goal is a set of reusable **color motifs** (behaviors, not just static
palettes) that scenes plug in.

**Method:** focused color-behavior pass over `YouTube 1080p 60fps Download.mp4` —
3 subagents (A–C / D–F / G–I) tracking frame-to-frame color change, cross-checked
against Gemini's 5 hypothesized color behaviors. Audio reactivity is *inferred* from
frame-to-frame change (analysts can't hear the track) — flagged throughout. Cycle
periods are read from 1.5fps frame spacing (±10–20%).

**Engine note (vs Gemini's Canvas-2D framing):** we're WebGL/Butterchurn, so color
lives in **two** places — **JS `point_eqs`** (waves/shapes, via `alcSetColor`/`ALC_PAL`)
and **GLSL comp** (fields, via `pal()`/cosine). Each color motif below names its form(s).

---

## 0. Headline findings (what actually drives Alchemy color)

1. **Complementary two-tone ping-pong is the DOMINANT scheme**, not a rainbow scroll.
   Green↔magenta runs through D, E, G, I; green↔red in F. Two near-complementary hues,
   one slowly waxing as the other wanes (a damped oscillation), over a neutral ground.
2. **Continuous full-spectrum scroll** (G→B→R→G, ~30–45s) is real but mostly **A–C**
   (the early ambient/ribbon phase). It is **time-driven**; audio-speed coupling is
   *unconfirmed* from frames — treat as a slow clock, optionally energy-nudged.
3. **Hue is shared globally**: at any instant the whole frame sits on one drifting hue
   (or one duo), with foreground motifs carrying a *local* spread on top.
4. **Saturation/coverage is energy-gated, hue usually isn't**: louder → the active
   pole blooms brighter/wider and decays to the neutral base when quiet. The *hue* keeps
   drifting on its own clock.
5. **White-hot additive cores are conditional**: muted sections (A–C, E) keep cores
   **soft and colored** (tone-mapped, per the muting rule); only the **vivid** sections
   (G line overlaps, I supernova) genuinely **burn white** at dense intersections.
6. **Everything sits on a jewel-tone vignette fog** — never pure black, always a dark
   desaturated version of the current hue, darkening to the edges. Universal.
7. **Discrete events are flashes/re-blooms, NOT inversions.** The I supernova recolors
   in 2–5 frame bursts; F flashes red axes; D has a polychrome burst. No negative-image
   inversion was ever observed.

---

## 1. Color-behavior taxonomy (deduped, whole video)

### CB1 — Slow full-spectrum hue clock (continuous scroll)
- **Where:** A–C (global), the ambient/ribbon/orb phase. Faint elsewhere.
- **Palette:** walks the whole wheel G→B→R→G; **medium saturation** (dusty), not neon.
- **Cycling:** continuous forward scroll, **~30–45s** per revolution.
- **Audio (inferred):** time-driven; speed-coupling to audio *unconfirmed* — flag.
- **Form:** JS `q8` accumulator + any `ALC_PAL` keyed off `q8`; GLSL `pal(time*k)`.

### CB2 — Complementary two-tone ping-pong  ⭐ the dominant scheme
- **Where:** D & E (green↔magenta, ~18–24s), G aurora (green↔magenta, ~8–15s),
  F moiré (**green↔red**, ~8–12s green→red handoff).
- **Palette:** two near-complementary hues + a neutral ground (steel-blue in D, black
  in F). Dusty-to-mid saturation; F is the one high-contrast/near-neon exception.
- **Cycling:** damped ping-pong — one pole waxes as the other wanes; **coverage decays
  to the neutral base on quiet passages** (not an endless even cycle).
- **Audio (inferred):** pole *brightness/coverage* energy-gated; the *which-pole* phase
  is a slow internal clock. Dominance can swap (green→red across F).
- **Form:** JS `ALC_PAL.roseGreen` (green↔magenta) / `ALC_PAL.redCyan` / `ALC_PAL.twoTone`
  keyed by a slow `q8`; energy gates brightness. GLSL: `mix(colA, colB, 0.5+0.5*sin(t*w))`.

### CB3 — Spatial rainbow-spread (hue = position)
- **Where:** A/C flower petals, G3 radial fan, H1 lattice, I supernova (hue = radius).
- **Palette:** adjacent-hue fan across the *elements* of one motif (petals/spokes),
  layered over the mono/duo field. Muted; warm-biased in H.
- **Cycling:** the spread rotates with the global clock; not a flash.
- **Form:** JS `ALC_PAL.spread` keyed by element index / `a.sample` (angular) or radius;
  GLSL `pal(angle)` / `pal(radius)`.

### CB4 — Prism band (hue along a spatial axis)
- **Where:** F finale iridescent plank; E f_25 caustic preview.
- **Palette:** full spectrum smeared along ONE axis on black; white-hot sparkle at the
  orb contact point.
- **Form:** GLSL `pal(uv.x*k + time*s)` on a thin band mask; JS for a single line.

### CB5 — Fixed / cool mono
- **Where:** E teal aquatic base, H2 blue→teal cooldown.
- **Palette:** near-single hue (teal/steel-blue), low saturation — the "trough" between
  energetic phases.
- **Form:** `ALC_PAL.mono` (cycle:0 holds a fixed hue) / GLSL flat tint.

### CB6 — Soft additive glow  vs  CB7 — white-hot plasma core
- **CB6 (muted sections A–C, E):** additive cores stay **soft and colored**, Reinhard
  tone-mapped — pale-warm highlight, never hard white. (The muting rule.)
- **CB7 (vivid sections G, I):** dense line overlaps / supernova center genuinely **burn
  to white/pale-yellow**, dispersing to colored tips.
- **Form:** both = `additive:1` + Reinhard `ret = c/(c+k)`; the **`k` knob** chooses:
  `k≈0.85–0.95` = soft (CB6), `k≈0.5–0.7` = lets cores blow white (CB7).

### CB8 — Depth/vignette fog (universal)
- **Where:** every section. Backgrounds are a dark **jewel-tone** (emerald/magenta/
  sapphire/gold) version of the current hue, darkening to the edges; foreground bright.
- **Cycling:** the fog hue tracks the global clock at low saturation/lightness.
- **Form:** GLSL `mix(col, fogColor, depth) * vignette`; JS depth-fade of `a.r/g/b` by age.

### CB9 — Energy-gated saturation/brightness ramp
- **Where:** A kaleidoscope bands (dim→vivid as section builds), D/E pole coverage,
  everywhere a motif "blooms" on loud passages.
- **Form:** multiply saturation/brightness (NOT hue) by a smoothed energy envelope.

### CB10 — Beat flash / re-bloom (discrete, NOT inversion)
- **Where:** I supernova recolors every 2–5 frames (beat-locked hue-advance + inflate);
  F red-axis flares; D polychrome burst.
- **Audio (inferred):** transient-triggered. No negative-image inversion seen — flag.
- **Form:** a transient detector → a fast-decaying flash that pops brightness and/or
  advances hue for a few frames.

### CB11 — Chromatic-aberration fringe
- **Where:** G — white line cores split into opposing R-magenta / G-cyan ghost edges;
  offset ∝ brightness/displacement; swaps sides as the line rotates.
- **Form:** GLSL comp re-sample with R/B radial offset — **already built: `alcChroma(amt)`**.

---

## 2. Reconciliation with Gemini's 5 color behaviors

| Gemini behavior | Verdict | Note |
|---|---|---|
| 1. Continuous HSL scroll, speed ∝ mid audio | **PARTIAL** | Scroll real in A–C (CB1); D–I is mostly **two-tone ping-pong** (CB2). Audio-speed coupling **unconfirmed** — treat clock as time-driven, optionally energy-nudged. |
| 2. Additive plasma → white-hot core | **CONDITIONAL** | True in vivid G/I (CB7); muted sections keep cores **soft/colored** (CB6). The `k` knob selects. |
| 3. Bi-polar opposites + 90° swap on bass | **CONFIRMED (tension) / PARTIAL (swap)** | Complementary two-tone tension is THE dominant scheme (CB2). A literal 90°-on-bass swap is unconfirmed; dominance *handoff* (green→red in F) is real. |
| 4. Depth/vignette fade to fog jewel-tone | **CONFIRMED** | Universal (CB8). |
| 5. Beat-triggered inversion/flash | **PARTIAL** | Flash/re-bloom confirmed (CB10, esp. I); true color **inversion REFUTED** (never observed). |

**Net:** Gemini's framing over-weights the continuous scroll and a literal inversion;
the frames say **complementary ping-pong + energy-gated bloom + jewel fog** are the
backbone, with scroll/plasma/flash as section-specific behaviors.

---

## 3. The reusable Color Motif Kit

Two layers: **SCHEME** (which hues / contrast) and **BEHAVIOR** (how they move/react).
Compose: scheme palette × behavior driver × shaping.

### A. Scheme palettes — already in `ALC_PAL` (keyed by `q8` hue + element index)
| Scheme | Palette | Maps to |
|---|---|---|
| mono / cool-fixed | `ALC_PAL.mono` (cycle:0 = fixed hue) | CB5 |
| duo complementary | `ALC_PAL.roseGreen` (green↔magenta), `redCyan`, `twoTone` | CB2 |
| rainbow spread | `ALC_PAL.spread` (per-element hue step) | CB3 |
| warm amber | `ALC_PAL.warm` | warm motifs |
| GLSL spectrum | `pal(h)` (cosine wheel) | CB1/CB3/CB4 |

### B. Behavior drivers — **NEW reusable helpers** (call in `frame_eqs`)
| Helper | Does | Motif |
|---|---|---|
| `alcHueClock(hue, dt, energy, base, gain)` | advance the shared hue accumulator (slow drift + optional energy coupling); dedupes the `huePhase` pattern in every scene | CB1 / CB2 clock |
| `alcEnergy(t)` | smoothed `(bass+mid+treb)/3` envelope (for gating saturation/brightness) | CB9 |
| `alcBeatFlash()` | factory → `f(energy, dt)` returns a 0..1 flash that pops on a transient and decays fast | CB10 |

### C. Shaping — color-space helpers
| Helper | Does | Motif |
|---|---|---|
| `ALC_FOG_GLSL` → `alcFog(col, depth, fog, d)` | lerp toward a dark jewel-tone fog by depth + edge vignette | CB8 |
| Reinhard `ret = c/(c+k)` (k knob) | soft (k≈0.9) vs white-hot (k≈0.6) cores | CB6/CB7 |
| `alcChroma(amt)` (built) | chromatic-aberration RGB split | CB11 |

### Composition recipes
- **Muted duo scene** (D/E): `ALC_PAL.roseGreen` + `alcHueClock(base 0.015, gain 0.03)` for a slow green↔magenta swing; energy gates brightness; `alcFog` teal/steel ground; Reinhard k≈0.9 (soft cores).
- **Vivid finale** (I): `ALC_PAL.spread` keyed by radius + `alcHueClock(base 0.05, gain 0.15)` (fast) + `alcBeatFlash()` popping brightness/hue on beats; Reinhard k≈0.6 (white-hot core).
- **Ambient scroll** (A–C): `ALC_PAL.spread`/`pal(time*0.025)` slow global clock; soft glow; jewel fog.
- **High-contrast moiré** (F): `ALC_PAL.redCyan`-style green↔red duo, flat (no tone-map smoothing), beat-flashed axes.

---

*Source: focused color-behavior frame analysis of `YouTube 1080p 60fps Download.mp4`
(9 sections, 3 subagents) + Gemini's 5-color-behavior notes, cross-checked. 2026-06-16.*
