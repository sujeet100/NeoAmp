# Alchemy v4 — Reverse-Engineering Findings & Rebuild Plan

_Synthesized 2026-06-18 from an 18-agent investigation (12 video-analysis + 5 code-mining +
1 architecture), grounded in frame-by-frame reads of `~/Downloads/Alchemy Random Media Player
480p.mp4` and a decode of `vendor/butterchurn.min.js`. This is the authoritative plan for the
next v4 pass. Read **after** `MISTAKES.md` (note §0 below corrects its §4)._

## Provenance / how to reproduce the evidence
Frames were extracted to `/tmp/alc-orig/` (not committed). Re-extract with the CLAUDE.md ffmpeg
recipe. Windows used: `w_open` 0:00–0:12, `w_3d` 0:13–0:23 (the signature), `w_sweep` 0:38–0:47,
`w_rot` ~2:35–2:45, `w_ripple` ~2:43–2:54, `w_mid` 1:30–1:44, plus whole-video `survey` montages
(1 frame/2s, 6×6 tiles: montage_01 = 0:00–1:10, _02 = 1:12–2:22, _03 = 2:24–3:34, _04 = 3:36–end).

## The user's hard guardrails (apply to everything below)
1. **ONE preset, ONE menu entry.** Scenes must bleed continuously; no fade/cut that reads as "a
   new preset started." Retire the cross-preset Director.
2. **Real-waveform displacement is a PRIMARY-MOTIF signature only.** Ripples and other secondary
   effects do NOT need it.
3. **The 4-wave + 4-shape budget is precious.** Don't spend a wave slot on secondary effects
   (ripples, sweep trails, corner bleed) — do those in the comp/warp GLSL / feedback buffer.
4. **Only build what the original actually does.** No invented embellishments (the "dust particles"
   idea was rejected). Verify an effect exists in the reference before building it.
5. **Colours muted-but-LUMINOUS** (dusty harmonious 2–3 tone fusion; never neon-rainbow, flat
   single-tone, or blown to white). Reinhard tone-map the final.
6. **Use the REAL kit factories** — never reimplement geometry inline.

---

## 0. THE BREAKTHROUGH — a single seamless preset is viable, with NO quality penalty

**MISTAKES.md §4 is factually wrong.** It claims "a single preset can't reliably hot-swap per-wave
baseVals each frame — that's why multi-preset." A decode of `vendor/butterchurn.min.js` proves the
opposite. Verified grep hits:

- **Shapes** (`drawCustomShape`): `var l=s.frame_eqs(a),m=l.sides; m=Math.clamp(m,3,100)` and
  `o=Math.clamp(a.num_inst,1,1024)` — `sides` and instancing (1..1024) are read from the per-frame
  `frame_eqs` **return** every frame.
- **Waves** (`generateWaveform`/`drawCustomWaveform`): `…=l.spectrum,A=l.smoothing,f=l.usedots,…`
  read from the per-frame return; `0!==r.additivewave ? blendFunc(SRC_ALPHA,ONE) : …` flips the GL
  blend mode **per frame**.
- **Load seed**: a slot is only seeded `if(0!==baseVals.enabled)` — so **`enabled` is the ONLY
  build-fixed field**.

**Implication:** one preset can morph per-slot geometry, sample count, blend mode, polygon sides,
and instancing continuously. `P["Alchemy v2: Random"]` (alchemy.js:374) already exploits this. v4's
8 separate presets are a regression driven by a false assumption.

### Recommended architecture (decisive)
Collapse the 8 v4 scenes into **ONE persistent preset** = the v2:Random self-sequencing **spine**
+ v4's **engine** (COMP_V4/WARP_V4) + v4's **filled orbs**.

- **4 morphable WAVE slots** (all `enabled:1`, `samples:512`; gate visibility by alpha, never by
  `enabled`):
  - `WAVE0` = **central motif**, dispatch on `q1` across the kit factories (verbatim reuse of
    v2:Random `centralDraw` at alchemy.js:428 → fAnem/fTriM/fNgon/fSpin/fBur2/fRays/fStar/fDia/
    fHor/fFea/fMesh, each = `alcXxx(...).point_eqs`).
  - `WAVE1`,`WAVE2` = the two **roaming orbs** (alcOrbTarget dispatch on `q16`, or wave-orbs that
    connect to the tether).
  - `WAVE3` = real-waveform **tether + beads** (alcTether reading the same q21..q24 endpoints).
- **4 morphable SHAPE slots**: `SHAPE0/1` = v4 `orbShape` filled-colour cores co-located with the
  orbs (the look the user liked); `SHAPE2/3` = secondary-motif overflow (alcNgonStack mandala tiers
  via `num_inst` instancing, alcStarWaves 2nd triangle) — shown only while that mode is active.
- **ONE compiled comp/warp** (no program swap → no fog). Background **varies per look** by
  cross-mixing two bg fields *inside* the shader (v2:Random `bgField` dispatch, alchemy.js:584-596,
  selected by `q18`=fieldA / `q20`=fieldB, mixed by `q27`), grafted into v4's COMP_V4 fusion+bloom.
- **In-preset eased director** = v2:Random `makePicker` (alchemy.js:398): shuffle-without-replace,
  beat-gated cut, smoothstep fade, hard-cap. **Independent clocks** (lookPick bg+cam+exposure
  9–16s/4s-fade; motifPick center 7–13s/2s-fade; orbStylePick 10–20s; palPick 16–32s) → never
  loops, feels random, reads as ONE preset.
- **Seamless motif swap = opacity dip-swap, NOT vertex cross-blend** (incompatible sample
  parameterizations). `q15` visibility envelope dips WAVE0 to ~10% at the swap instant, geometry
  changes under cover, fades back — while orbs/tether/feedback-trail/hue **persist** across the
  swap. That persistence is exactly what the original shows (w_sweep f_03→f_07→f_10: an anemone
  dissolves AS the line-sweep arrives, same colour family + trail persisting).

### Migration steps
1. Start from the v2:Random IIFE (alchemy.js:374-654 — already a complete single-preset engine).
2. Swap its polar-twist warp + bgField comp for v4's **WARP_V4/COMP_V4** strings (richer fusion bg +
   bloom + Reinhard); graft the `bgField(mode)` dispatch into COMP_V4 so bg decouples from motif.
3. Add `SHAPE0/1 = orbShape` (v4 filled orbs) + `SHAPE2/3` for multi-wave-motif overflow.
4. viz.js: replace the 8 `Alchemy V4: <Scene>` FAVORITES entries + the `__director__` sentinel with
   ONE `{ label:"Alchemy: Random", wmp:"Alchemy: Random" }`. Boot directly into it (drop
   `setDirector(true)` + `WMP_V4_SCENES` playlist wiring at viz.js:426-438). Keep the Director IIFE
   dormant for debugging only.
5. Validate: CLAUDE.md Node concat+frame_eqs harness, then ANGLE-precheck WARP_V4/COMP_V4, then the
   self-render harness screenshots.

---

## 1. Why current v4 reads as "a new preset faded in" (the diagnosis)

Each v4 scene is a **separately compiled** Butterchurn preset. `Director.tick` → `onSwitch` →
`loadByName` → `viz.loadPreset(preset, blend)` (viz.js:293) invokes Butterchurn's built-in
**two-program cross-dissolve**: during the 1.6–3.0s blend (blendCalmS/blendLoudS, viz.js:169-170) it
renders BOTH pipelines every frame (`prevWarpShader` + `warpShader`, `prevCompShader` + `compShader`)
and alpha-wipes them with a per-vertex noise pattern — the literal visual grammar of a MilkDrop
preset transition. Compounding it: at the cut **every** look-defining quantity jumps to a new
scene's constants (decay `q1`, bg variant `q29`, base hue `q8`, fold `q12/q13`, motif geometry,
orbit-phase clock), the shared feedback trail is re-governed by the new decay, and the orbs/tether
are rebuilt from scratch. **Fix = the single-preset rebuild in §0** (parameter MORPH within one
persistent preset, not preset SWAP).

---

## 2. Per-problem findings (original behaviour → technique → our gap → plan)

### P1 — Transitions (continuous morph, not fade/cut)
- **Original:** ONE continuously-morphing field over a PERSISTENT feedback buffer. Never hard-cuts,
  never fades to/from blank. Continuity from 3 buffer-shared mechanisms: (1) HIGH decay smears the
  prior frame so old geometry lingers while the new motif overdraws on the SAME buffer; (2) the bg
  tint slides on a SLOW clock INDEPENDENT of the motif (amber→teal→pink→purple→green over w_mid,
  never jumping at a motif change); (3) the corner orbs+tether PERSIST the whole time and only
  restyle in place — they are the visual anchor bridging every motif change. Fold strength ramps
  continuously (full X-symmetry → free-space), never snaps.
- **Plan:** the §0 rebuild. Specifically: unify+raise decay (floor ≥0.93; current 0.45 Mandala /
  0.78 Corridor clear the buffer too fast); drive hue/bg/fold/decay from Director-eased continuous
  globals, not per-scene constants; cross-fade the bg variant in-shader (mix two grounds by a mix
  q-var) instead of swapping; keep orbs+tether at the same q21..q26 contract so they persist.

### P2 — Orb spacing + single/pair/tether staging
- **Original (measured, normalized to pane):** signature pair `~(0.12,0.72)` & `(0.85,0.30)`,
  **separation ~0.78–0.85w** on a true ~45° diagonal, **radius ~0.045–0.07w** (nearer orb bigger).
  Count VARIES: w_open/f_01 none; f_09 a SINGLE orb (second arrives much later, staggered); f_11 a
  small cluster, NO tether; f_17 two orbs opposite corners, NO tether — the web only materialises by
  f_21/f_24; w_3d/f_18 the pair MULTIPLIES into a cluster. w_ripple/f_05 a pair with NO tether.
- **Our gap:** separation capped ~0.43w (collapses through center → orbs collide), orbR ~0.035 too
  small, and `orbPair()`+`alcTether` are hardcoded in every scene (always 2, always tethered).
- **Plan:** anchor orbs to OPPOSITE corners on a slowly-drifting diagonal that never crosses center
  (amp ~0.40: `q21=0.5-0.40·cos(dA)`, `q23=0.5+0.40·cos(dA)`, `dA=π/4+0.2·sin(t·0.05)`). Raise orbR
  to ~0.045 (nearer orb ~0.06–0.07 via a small depth factor). Add a **staging state machine**: a
  per-cycle hash-seeded PRNG picks count∈{1,2,cluster} and tetherOn∈{0,1}; gate births on
  within-cycle progress `p` — orbA `smoothstep(0,0.15,p)`, orbB `smoothstep(0.25,0.40,p)`, tether
  `smoothstep(0.50,0.70,p)·tetherOn`. Cluster routes 2–3 extra small orbs along the diagonal via the
  shape slots.

### P3 / P16 — Orb colour (distinct border vs fill; fill pulses with music)
- **Original:** translucent COLOURED fill + a thin CONTRAST-hue rim; fill brightness/size pulses with
  bass. (Our orbShape is wrongly white-cored with a same-hue ring and `a2=0`.)
- **Plan:** fill hue `q8+hueOff` (sat ~0.55), border hue **`+0.5` complementary** (sat ~0.85, bright);
  `s.a2 = 0.25 + 0.5·beat` so the fill flashes with the kick while the rim stays constant; bloom the
  core on transients. Mirror `alcOrbContrast` (kit.js:1096). Consider `alcOrbGradBlob` (kit.js:1499,
  br already pulses bass_att) with its border re-enabled (currently `border_a=0`).

### P5 — Camera 3D / 45° side-angle (kill the top-view slideshow)
- **Original (w_3d f_06→f_19):** depth from FOUR feedback cues, not a one-frame perspective shader.
  (1) a **single OFF-CENTER vanishing point** near a corner that orbs/traces shrink+fade toward (the
  orb "tube-stacks" are the orb redrawn each frame while the prior frame is scaled toward the VP =
  feedback zoom<1 about an off-center center-of-zoom); (2) a steep **diagonal axis ~25–45°**, never
  axis-aligned; (3) camera **ROLL + VP pan** swinging the axis (parallax of orbiting the rising
  stalk); (4) **single-ended foreshortening** along the VP (near orb big+round, echoes taper to dots
  at the VP — never the symmetric both-ends taper a center-pivot zoom gives).
- **Our gap:** we zoom/rotate/tilt about a near-center pivot SYMMETRICALLY at rest-zoom ~1 (no
  persistent recede), roll is sub-perceptual.
- **Plan:** point the feedback center-of-zoom (`q20/q27`) at an off-center corner VP (~0.74,0.78).
  Add a PERSISTENT inward recede (`q15 ~ −0.03..−0.05` so `pd*=(1+q15)` shrinks the sample each frame
  → echo-stacks build; keep decay ~0.93–0.95 for 5–8 echoes). Replace the symmetric divisor at
  WARP_V4:39 with a VP-referenced single-ended tilt `pd /= max(1+q28·(piv.y−uv.y),0.25)`, q28~0.35–0.6.
  Add a real ROLL `q16 = rot + 0.12·sin(t·0.05)` (~±7°). Orbit the VP with pan ~0.10–0.14. Bias a
  RISE `q19 = dy − 0.004`. Per-scene VP anchors near a corner; leave Mandala centered as the flat
  exception. (Reconcile with scenes that want forward-fly: those use positive zoom.)
- **Gemini cross-check:** the pitch(X)+yaw(Z) rotation-matrix + perspective-divide is the same idea;
  in our engine it's the off-center feedback recede + single-ended tilt above.

### P6 — Empty scenes (fill the frame — NO dust)
- **Original:** never dead-black (black bars = letterboxing). Body frames are full soft texture with
  **6–8 corner orbs** and **edge rays reaching the borders**; even the opening is textured dark.
- **Plan (faithful only):** raise the COMP_V4 brightness floor (`0.45+0.4·n1` → `0.62+0.30·n1`) and
  corner-vignette floor (0.6 → 0.80) so corners never read black; widen the orbit so orbs reach the
  corners (the kaleido fold then mirrors them to 8); add edge-reaching `alcRayWaves(2)`/`alcRay` on
  sparse scenes; **mild** zoom-to-fill ONLY on small-motif scenes (driven by the known `q5` size — no
  bounding-box measurement). **No dust particles** (rejected — not in the original).

### P7 — Backgrounds never flat (asymmetric corner bleed)
- **Original:** never a centered symmetric vignette. Four asymmetric OFF-CENTER sources over a
  low-sat base: (1) **diagonal colour plates** from a tilted plane (frame split into separately-tinted
  wedges along the plane's vanishing edges); (2) a **large off-center soft pool** (gaussian/fbm whose
  center is offset ~+0.3,−0.1); (3) a **one-edge plume** (warm column rising from the bottom edge
  only); (4) **corner glow bloom** (the roaming orbs + their feedback trails smeared to the edges).
- **Plan:** in COMP_V4 replace the symmetric vignette (alchemy-v4.js:82) with: an off-center pool
  `exp(-|pdc−poolC|²·k)` (poolC slow-drifting off-center); an edge plume `smoothstep(0.55,0,uv.y)·warm`
  (edge pickable per variant); a diagonal-plate term tied to the existing `q28` tilt. This is the
  same idea as Gemini's "wandering gradient nodes" (3–4 blurred off-center colour nodes on prime-ratio
  sin/cos) — adopt either form.

### P9 / P13 — Background decoupling + variety; restore V2 backgrounds
- **Original:** the SAME motif (e.g. anemone) appears over MANY different bgs and a bg family recurs
  under different motifs → bg and foreground are INDEPENDENT channels on separate clocks. ≥7–8 bg
  families: near-black-with-streaks, pastel FLUID, kaleido/butterfly MOIRE, MARBLE veins, HORIZON
  bands, wallpaper/cross-hatch/dot-grid, near-flat sage/mauve saved only by the off-center bleed.
- **Our gap:** `q29` is fixed per scene and only spans 0–3; most kit bg fields are unused; bg is
  married to motif.
- **Plan:** a Director-owned **bg clock independent of the motif clock**; expand to ~8 variants by
  calling the REAL kit fields in COMP_V4 (`ALC_FLUID`:71, `ALC_MARBLE`:88, `ALC_AURORA`:117,
  `ALC_WASH`:135, `ALC_HORIZONBANDS`:158, `ALC_RADIALBLOOM`:146, `ALC_MOIRE`:184 already in,
  `alcRibbonWarp/Comp`:826/838). Feed each the dusty scene tones (not raw `pal()`), keep weights
  ≤0.5, re-Reinhard. (Single-preset version: cross-mix fieldA/fieldB by a mix q-var per §0.)

### P8 / P14(kaleido) — Prominent kaleidoscope via diagonal mirror
- **Original:** dominant look is a **4-FOLD QUAD MIRROR** (reflect across both center axes →
  `abs(pd)`), giving the X/butterfly symmetry (w_mid/f_08 = perfect 4-quadrant; w_sweep/f_24-27 =
  central waveform mirrored 4 ways); occasional 6/8-fold radial pinwheel at peaks. Seams run along the
  center axes; the visible diagonal X is where mirrored wedge content meets.
- **Our gap:** v4 has the fold fully wired in WARP_V4 but it's **DEAD** — all 8 scenes leave
  `cfg.fold` unset, so `q12=1, q13=0` disable it everywhere.
- **Plan:** activate it — set `fold:4` on ≥1 scene (selects the `fquad=abs(pd)` branch); ramp `q13`
  (intermittency) on bass instead of binary. Optionally add an **additive 4-quadrant comp mirror**
  gated by `step()` on the bg id (the load-bearing piece that reads as a true mandala — matches
  alchemy.js:883-885 v2:Kaleidoscope, which already nails it) + lens-arc bands. Surface visible
  diagonal seam glow. Add `fold:6/8` variants routed through radial `alcKaleido` (kit.js:171).

### P11(camera vortex) / P15 — Restore V2 vortex + fountain
- **Vortex:** a warp rotating sample coords by a twist that GROWS toward center + an inward pull
  (`tw=base+gain/(pr·6+1)`, `sc=0.99−bass·…`; driver `alcCamVortex` kit.js:443). Add this spiral
  branch to WARP_V4 (after the fold, before the rot) gated on `q10`; wire `alcCamVortex`/`alcCamPlunge`
  (currently unused) into sceneFrame so the dive/suction is audio-reactive.
- **Fountain:** the REAL outward-blooming emitter is `alcRadialBurst` (kit.js:970, `rad=q9+q10·sample`)
  — v4 Burst wrongly fakes it with `alcSpindle` (a bristle urchin). Add a Fountain scene using
  `alcRadialBurst` + `alcCamPlunge`; resolve the `q9/q10` dual-use (fountain wants them for radius/amp;
  move the WARP vortex shear onto `q17` swirl to free `q10`).

### P15(sweep) — Line-sweep effect (0:40–0:45)
- **Original:** 2–4 near-straight live-waveform DIAMETER lines sharing one slowly-advancing rotation,
  finely wavy (perp displacement from `value1`), smeared by HIGH decay into a dense swept FAN of fine
  parallel threads crossing center. Rotation ~0.2–0.4 rad/s; pale cream→gold, additive, low-sat.
- **This is exactly `alcRotLines` (kit.js:904), which v4 never instantiates.**
- **Plan:** add a Sweep scene `alcRotLines(3,{len:0.72,jiggle:0.045,sat:0.25,alpha:0.5})` over a
  high-decay (≥0.95) feedback camera; slow continuous spin. **q-var collision:** alcRotLines reads
  `q1` for rotation but v4's engine uses `q1`=decay — add an `opts.angVar` (default `q1`) and pass
  `angVar:"q9"` (v4's motif spin). Beat-couple density/brightness via exposure `q31`.

### P16(rotating) — Rotating-lines + co-appearing orb (2:40)
- **Original (w_rot):** dominantly ONE full-diameter live-waveform line pivoting about screen CENTER,
  rotating ~0.3–0.5 rad/s, briefly densifying into a ~16–24-spoke WHEEL (f_13) then collapsing back.
  1–2 SMALL ringed orbs (radius ~0.06–0.09, much smaller than the ~0.4 primary motif) ride ON the
  line as beads, sliding along its angle. Layered OVER the primary urchin/anemone, additive.
- **Plan:** `alcRotLines(1,...)` rotating (`q1`/`angVar`) over a primary `alcAnemone`/`alcSpindle`;
  thread `alcOrbiterNode` whose `q21/q22 = 0.5 + off·(cos,sin)(angle)` so it slides along the wire;
  gate the f_13 wheel-burst (`alcRotLines(8,{strobeVar:"q14"})`) on loud bars; orb radius small &
  bass-pulsed. Budget: anemone+rotline+orbiterNode = 3 waves (under 4).

### P17(ripples) — Wavy beat-shed ripple traces (2:46) — SHADER, not a wave slot
- **Original (w_ripple):** each orb has ~6–12 tightly-nested rings whose edges are scalloped/wavy
  (NOT circular); densest at the orb, growing larger/fainter outward; a fresh bright ring is born on
  each BEAT and its hue is frozen into the trail (so successive nests differ in colour).
- **Mechanism:** ring drawn at the orb each frame; warp `ret=acc·q1` + OUTWARD zoom `pd*=(1+q15)`
  re-samples prior frames expanding outward while fading; on a beat the radius+brightness jump and
  hue steps.
- **Plan (per guardrail #3: no wave slot if avoidable):** prefer a **procedural radial wavy-ring
  field in the comp/warp GLSL** stamped at the orb position on each beat (`alcBeatFlash`),
  expanded+faded by the feedback buffer, recoloured on the pulse — costs zero wave slots. If a wave
  is genuinely cheaper for a given scene, a `circleWave` (kit.js:269) with `value1` displacement +
  outward-zoom feedback is the fallback, but the shader route is preferred. Waviness may be procedural
  (sin/fbm) — the real-waveform rule is for primary motifs only.

### P12 — Colours + shapes pulse with the music within a scene
- **Original:** hue is a SMOOTH continuous clock (orb fill green→yellow→white→blue→magenta over ~10s),
  **NOT per-beat hue jumping**. Loud passages push WARMER + brighter + toward-white (Reinhard keeps
  peaks cream, not neon). Orbs/shapes visibly SCALE + brighten on transients, decaying within ~0.5s.
- **Our gap:** hue locked to `time·0.02`; no beat-flash; no energy-warmth term.
- **Plan:** per-preset `flash=alcBeatFlash(); hue=alcHueClock(hue,dt,energy−1,0.02,0.05)` then
  `q8=cfg.hue+hue+0.04·f` (clock dominant, small per-beat warm nudge — do NOT randomize hue per beat).
  Add a warmth uniform `q30=min(0.5, 0.5·max(0,energy−1)+0.6·f)`; in COMP bias `cA/cC` toward
  `vec3(1,0.82,0.5)` by `q30` and desaturate-toward-cream on peaks before Reinhard. Pop size
  `q5·(…+0.22·f)`, orb radius `q7·(1+0.4·f)`, exposure `q31·(1+0.5·f)`, and bloom the orb core on kicks.

### P13 — Extract V1 central flow motif
- **What it is:** V1 `wave[3]` (alchemy.js:294-352) — ONE custom wave whose 512 live samples map into
  **9 selectable geometries** via `q28` (rose/spiral/urchin/lissajous/star-web/spiderweb/crescent/
  bolt + none), bass-flared by `bscale=0.5+0.7·q17`, rotated by `q25`. The two waveform-faithful
  "flow" members: **URCHIN** (shape 3: `rad=bscale·(0.08+0.26·|value1|)`, radial filaments) and
  **BOLT** (shape 8: vertical oscilloscope column `x=cx+value1·0.16+value2·0.05, y=0.08+sample·0.84`).
  The "flow ridges" the user remembers are this stamp dragged into receding parallel contours by high
  decay + the warp camera — not a separate geometry.
- **Plan:** urchin already = `alcSpindle` (kit.js:1300). Add a new kit factory **`alcBolt(colorize)`**
  (BOLT generalized to the `q2/q3` center + `q6` amplitude). Add Bolt + Urchin-Flow scenes (high decay
  ~0.93–0.94 + gentle `dy` drift / slight negative zoom → the receding-ridge flow). Remap the q-vars
  (V1 used q25/q26/q28 which are orb/tether/tilt in v4 — that collision is why wave[3] can't be pasted
  verbatim). In the single-preset rebuild, this becomes additional `q1` dispatch entries in WAVE0.

---

## 3. Numbers cheat-sheet (targets measured from the original)
- Orb pair separation: **0.78–0.85w** on a ~45° diagonal; never crossing center.
- Orb radius: **0.045–0.07w** (nearer/lower orb larger); small ride-along orbs ~0.06–0.09.
- Tether span: **0.6–0.85**; amplitude audio-coupled **q26 ≈ 0.10–0.14·(0.5+0.9·bass_att)** (quiet
  ~0.05, loud ~0.20); **2–3 distinct-colour strands** (gold/green/purple) + a feedback comb (decay
  ≥0.92, primary strand additive).
- Decay floor: **≥0.93** for continuity (Vortex 0.965 is the reference; current 0.45/0.78 too low).
- Hue clock: base **0.02 cyc/s**, energy gain **0.05**, per-beat warm nudge **0.04·f** (clock-dominant).
- Camera: off-center VP ~(0.74,0.78); persistent recede `q15 ≈ −0.03..−0.05`; roll ±~7° at 0.05 Hz;
  VP-pan 0.10–0.14; rise `dy ≈ −0.004`; single-ended tilt `q28 ≈ 0.35–0.6`.
- Kaleido: dominant **4-fold quad** (`abs(pd)`); 6/8-fold radial at peaks.
- Rotation (sweep/rot-line): **0.2–0.5 rad/s**, continuous (not beat-snapped).

---

## 4. Gemini's analysis — reconciled
Gemini's blueprints align directionally but assume a free-form Canvas2D engine. **Adopt:** decouple
bg/motif/orb lifecycles into independent clocks (= v2 spine); 3D camera via rotation + perspective
divide; orb fill-alpha = bass, border constant; wandering gradient nodes = corner bleed; diagonal
kaleido (rotate 45°, abs, rotate back); line-sweep via feedback translate; rotating lines anchored to
an orb; orbs/tether persist through motif changes. **Translate:** "30-vertex polygon per ripple" →
shader ring (or 1 wave) with procedural waviness; "draw waveform 3× for thickness" → scale WARP_V4's
existing 5-tap blur by bass; "off-screen buffer mirror" → `sampler_main` IS that buffer (fold in
warp); "dust particles" → **rejected** (not in original); "bounding-box auto-zoom" → drive zoom from
the known `q5`. **Reject the contradiction:** Gemini's Phase-4 "keep the 8-scene Director shuffle-bag"
contradicts its own decouple blueprint and the single-preset requirement — go single-preset.

---

## 5. Suggested build order (small steps, verify each via the self-render harness)
1. **Activate the dead kaleidoscope** (set `fold:4`, ramp `q13`) — cheap, high visual payoff, proves
   the harness loop.
2. **Fix orbs** (separation 0.78–0.85w, radius up, border≠fill, bass-pulsed fill, staging machine).
3. **Camera 3D** (off-center VP recede + single-ended tilt + roll + rise).
4. **Backgrounds** (asymmetric bleed + decoupled bg clock + restore moiré/marble/ribbon/aurora).
5. **Audio coupling** (hue energy-term + beat-flash size/exposure pops).
6. **Tether** (span/amplitude/multi-strand/comb) and **waveform-line consistency**.
7. **New emitters**: `alcBolt`, Urchin-Flow, Sweep (`alcRotLines`), RotLine+orb, Fountain
   (`alcRadialBurst`), Vortex spiral warp.
8. **Ripples** in the shader (beat-shed wavy rings).
9. **THE BIG ONE — collapse to a single seamless preset** (§0) and retire the cross-preset Director.
   (Doing the small fixes inside the current 8-scene structure first de-risks the rebuild; or do the
   collapse first and apply the fixes once, in one place — judgment call at build time.)
