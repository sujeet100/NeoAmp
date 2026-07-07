# 08 — Spirograph petal flower / wreath / ferris-wheel family

**Matrix items:** A1 · **Priority:** P1 (both captures) · **Risk flags:** none in the matrix (see §5 for adjacent user-rejection history to respect) · **Confirmation needed:** no — all five variants are directly evidenced in the references; no dots, no new wave/shape slots, no camera changes.

This doc is self-contained: all measured evidence is copied in below. Do not re-open the
analyst reports.

---

## 1. Reference behaviour (what the original does)

One recurring central-motif FAMILY, absent from v7: closed **petal-loop rosettes traced as a
single crisp wobbly stroke** radiating from a hollow centre, whose **construction identity is
re-rolled per re-stamp** (~1–2 s cadence) among at least five variants.

### Measured evidence

**480p (colour-accurate capture), analyst p0, Motif M7** — t=27.5–30, 35.3, 38, 49.8, 51–56
(stills 27.6 / 30.0 / 35.3 / 49.8 / 52.3 / 54.5):
- "10–14 large petal LOOPS (or pointed star tips) drawn as **one crisp wobbly stroke ~1.5–2 px**
  radiating from centre; loop length 80–150 px [≈ 15–30 % of the 480p frame width]; over its own
  tan/khaki fuzz trail."
- **Variants seen:** (a) **open lotus loops** (27.6, purple); (b) **pointed-star lace-crown**
  (35.3, white, ~14–16 diamond points, stamped AROUND the pompom rim); (c) **wavy-ray sun
  medallion with a dark core star** (49.8); (d) **scribble wreath-ball** (52.3, chartreuse);
  (e) **ferris-wheel** — circular wreath + **8–10 internal radial spokes and a bright hub** (54.5).
- **Per-STAMP shape swap:** consecutive re-stamps alternate wreath↔star↔wheel (burst_54).
- **Waveform test: PASS** — the petal wobble re-arranges every frame (live audio on the stroke).
- Scene context: it is the **central medallion of the long S7 climax (44.5–58 s)** — "camera
  STILL; bands undulate in place… per-stamp medallion shape swap" — and appears in the S4
  quad-mirror kaleidoscope (23.5–31.5) as the "central spirograph motif".

**1080p (geometry/motion-trusted), analyst h1, Motif M4 "petal flower / pinwheel rose"** —
t=83.5–86 (still_84.8):
- "**12–14 narrow petal LOOPS (two curved 1 px lines meeting at a tip)**, petal length **~25 % of
  frame**, total **~60 %**; centre = **dark ellipse hole + purple ellipse outline + pale-green
  rim**. **Two-tone: alternating cream-green and ORANGE petals in one motif.** Grows from the
  folded cobweb in ~0.7 s, then **tilts oblate (y-squash to ~0.5)** like lying on a receding
  plane; casts a soft contact shadow. **Feathery ghosting = slight rotation between stamps.**"
- Scene S4a (83.0–86.0): the flower blooms out of a fishnet-cobweb fold; the dumbbell orbs +
  diagonal tether stay present at the frame corners BEHIND it (layer independence).

**1080p, analyst h1, Motif M5 "scribble wreath/torus"** — t=89–95.5 (burst_90.5, still_91.8);
this is the full-scene form of the wreath-ball variant:
- "Ring **~35 % frame** of overlapping short jagged chords, hole **~12 %** with magenta inner
  glow. Crisp lines **re-tint yellow→green→teal ~2 s/hue**; drift up-left ~1.5 %/s; trail = big
  soft smear-cloud of the OLD hues lagging down-right, ~40 % frame, lives 3–5 s."
- (At 95.0 a 12-point star overlays it with two green beads ON the ring — the bead threading is
  matrix item **A8**, NOT this doc. Do not build beads here.)

**1080p second capture, analyst h2 §2.13** — trans_164.5: "Small green spirograph-flower
outlines (**nested petal loops ~15 % frame**) spawn inside the tangle cluster during the 164–166
transition." (Small/garnish usage — noted as a non-goal below.)

### Emitter-vs-trail mechanism (explicit)

- **Emitter:** ONE crisp ~1.5–2 px stroke re-drawn EVERY frame; the wobble along the stroke is
  the **live audio waveform** (p0 waveform test PASS). The loop/star geometry itself is
  clock-driven (petal count and shape do not re-jag).
- **Re-stamp events (~1–2 s, ≈ beat groups):** the construction identity (lotus / crown /
  medallion / wreath / wheel), a small rotation offset ("feathery ghosting = slight rotation
  between stamps"), and the hue snap all change per stamp. p0 §3 mechanism synthesis: "re-stamp
  events for motifs (fresh crisp copy over its own trail, per ~1–2 s, shape-variant swapped per
  stamp)".
- **Trail:** the ordinary feedback canvas — a same-hue fuzz beneath the crisp stroke (tan/khaki
  in p0; in h1's wreath scene the smear-cloud keeps OLD hues while the emitter re-tints). No
  trail-freeze machinery needed (that is C2); v7's existing decay+blur buffer already produces
  this class of ghost.
- **Sizes / counts / periods, consolidated:** petal loops 10–14 (crown 14–16 points; wheel 8–10
  spokes); total flower ~50–60 % of frame (wreath ring ~35 %, hole ~12 %; garnish form ~15 %);
  identity re-stamp every ~1–2 s; wreath hue step ~2 s/hue; bloom-in ~0.7 s; the family occupies
  whole scenes (S7 = 13.5 s) with the swap running throughout.
- p0 §4 implementation note (analyst's own Butterchurn mapping): "spirograph M7: rose-curve
  r=cos(kθ) plus audio jitter; per-stamp shape-variant switched via q-var" — we use the closure
  instead of a q-var (all 32 are taken; no shader needs the variant).

---

## 2. Current implementation state

Verified against `presets/alchemy-v7.js` @ HEAD (4db3368; same geometry as catalog snapshot
302349c) and `presets/kit.js`.

**Absent:** no petal-loop / rosette / trochoid tracer exists anywhere.
- `MODES` array L807–825 has 17 entries (ids 0–16); none draws closed loops radiating from a
  centre. Nearest neighbours (all different constructions):
  - Anemone `fAnem` L402–411 (kit `alcAnemone`, kit.js L1641–1707) — closed triangle SPIKES with
    bases on an inner circle, not loops.
  - Tri-mandala `fTriMandala` L768–777 (kit `alcTriMandala`, kit.js L1717) — 9 rotated triangles.
  - 12-point star `f12Star` L619–654 — straight {12/5} chords.
  - Fluff ball `fFluffBall` L781–803 — 64 short curly filaments (this is the pompom the
    lace-crown is stamped around in p0 35.3).
- kit.js has no rose/trochoid factory (checked the full `alc*` factory list, kit.js L362–2370),
  so per the kit-variants rule there is nothing to CALL for the curve itself — this is a genuinely
  new tracer, which is why it must be added as a new mode rather than a wrapper.

**Reusable machinery (anchor the new mode to ALL of this — do not re-derive):**
- Mode dispatch + dressing: `centralDraw` L835–846 (clamps mode id, applies `q4 × MODE_ALPHA[m]`),
  `MODE_ALPHA` L827–831 (17 entries), `scaleFor` L832–834, waves[0] wiring L1148–1164 (512
  samples, additive, thick, baseVal a 0.62).
- Sequencing: `MOTIF_BAG` L923–925 (25 entries) + `motifPick = makePicker(MOTIF_BAG.length, 6, 11, 2.0)`
  L927; q30 snap at crossfade midpoint L994–996; swap hidden by the q4 opacity dip L997–1000.
- Motif contract (read by every mode fn): centre q2/q3 L1011–1012, size q5 L1015, jag q6 L1016,
  spin q9 L1017, hue q8 via `orbCol(h, off)` L252–254.
- Closure-state precedent (all 32 q-vars are taken): the accessory director state L895–917 with
  the explicit comment L890–894 — "the waves' point fns share this scope — q-vars are only needed
  for shaders". New spiro state lives exactly like this.
- Beat gate precedent: `motifPick(time, dt, f > 0.6)` L994; beat flash `f` computed L937.
- Oblate-squash precedent: PULSAR squash in `centralDraw` L840–844 (modes 0/2 only, via q11) —
  we do NOT extend it (it is coupled to the COMP pupil via focusAmt L1002–1004); the spiro tilt
  is applied inside the new mode fn instead.
- Per-stamp identity re-roll: **no precedent** — every current motif keeps one identity for its
  whole 6–11 s dwell. This grammar is new here (same grammar as A16 orb anatomy / A5 tether
  constructions — cross-reference, don't duplicate: this doc implements it only for the motif).

**Deviates:** nothing to fix in existing modes; this is purely additive (a new mode id 17).

---

## 3. Implementation plan

**Slot budget (hard constraint, stated up front):** waves[0] ONLY — the shared central-motif
slot every mode already uses. waves[1] is touched only by optional Step 4 (inside its existing
gating structure). waves[2]/waves[3] and all 4 shape slots untouched. No dots anywhere. No new
q-vars: all new cross-frame state is file-closure variables; the shader never needs the variant.

### Step 1 — `fSpiro` lotus-loop tracer as motif mode 17 (smallest shippable slice)

Target: new function after `fFluffBall` (after L803); register in `MODES` (L825), `MODE_ALPHA`
(L831), `MOTIF_BAG` (L923–925).

The petal loop of h1 M4 ("two curved 1 px lines meeting at a tip") is exactly a rose-curve lobe
with an inner-radius offset for the hollow centre; one closed sweep of s∈[0,1] traces all k
petals with **no pen lift → no connector-hiding alphas needed**. (Alternative for true
base-crossing spirograph loops: a hypotrochoid `x=(k−1)cos t + d·cos((k−1)t)`, `y=(k−1)sin t −
d·sin((k−1)t)`, d≈1.3, normalised — also fits one 512-sample wave naturally. Start with the rose
form; switch only if the user says the petals should overlap/cross at the base.)

```js
// SPIROGRAPH PETAL FLOWER family (480p 27.5-30/35.3/49.8/51-56 · 1080p 83.5-86 · A1):
// k petal LOOPS traced as ONE closed stroke from a hollow centre; construction identity
// re-rolls PER STAMP (spiro* closure state, step 2). Live-waveform wobble on the stroke.
function fSpiro(a) {
  var s = a.sample || 0;
  var th = s * 6.2832 + spiroRot;               // one full sweep = the whole flower
  var k = spiroK;                               // 12 in step 1; per-stamp 10-14 later
  var hole = 0.14;                              // hollow centre (h1: dark ellipse hole)
  var petal = Math.abs(Math.sin(th * k * 0.5)); // k rose lobes
  var R = (a.q5 || 0.4) * 0.9;
  var r = R * (hole + (1 - hole) * petal);
  r += (a.value1 || 0) * (a.q6 || 0.05) * 0.9;  // live wobble re-arranges per frame (p0 PASS)
  var cx = a.q2 !== undefined ? a.q2 : 0.5,
    cy = a.q3 !== undefined ? a.q3 : 0.5;
  a.x = cx + r * Math.cos(th);
  a.y = cy + r * Math.sin(th) * spiroTilt;      // 1.0 until step 3
  var pi2 = Math.floor(s * k);                  // petal index
  var h = (a.q8 || 0) + spiroHue + (pi2 & 1 ? 0.38 : 0); // alternating-petal DUO (h1 two-tone)
  a.r = orbCol(h, 0);
  a.g = orbCol(h, 0.33);
  a.b = orbCol(h, 0.67);
  return a;
}
```

- Closure seeds next to the accessory state (L895–917): `spiroVar = 0, spiroK = 12,
  spiroRot = 0, spiroHue = 0, spiroTilt = 1, spiroNext = -1`.
- `MODES.push(fSpiro)` → id 17; `MODE_ALPHA` gets `0.58` (outline-class; the k lobes converge at
  the hub — additive pileup, so start below the 12-star's 0.62 and check the hub isn't blown
  white in Pastel); `scaleFor` default 0.4 is fine (R = q5·0.9 → total dia ~55–65 % of frame
  height, matching h1's ~60 %).
- Bag weight: append `17, 17` to `MOTIF_BAG` (2 of 27 — a P1 family recurring in BOTH captures;
  comparable to anemone/hexagram weight). `motifPick` uses `MOTIF_BAG.length`, so appending
  before the picker construction (L927) is automatically correct.
- Composition with directors: nothing else — mode 17 inherits the q4 dip/flash, rest breathing,
  hue clock, kaleidoscope fold and centre-drift for free, like every mode.
- Gate/revert: the whole step is one mode id — reverting = removing the two bag entries (the
  mode then simply becomes unreachable), or the one commit.

### Step 2 — per-stamp identity director (the A1 signature)

Target: `frame(t)`, immediately after the motif-contract block (after `t.q11 = focusAmt`,
L1019) — `mCur`, `f`, `time`, `dt` are all in scope there.

```js
// SPIRO per-stamp re-roll (p0 burst_54: consecutive stamps alternate wreath<->star<->wheel,
// ~1-2s cadence ~= beat groups; h1: feathery ghosting = slight rotation between stamps).
// Debug gotcha: __ALC_FORCE overrides q30 AFTER frame() (L1136-1140), so honour it here too
// or a pinned self-render never re-rolls variants.
var mEff = mCur;
if (typeof window !== "undefined" && window.__ALC_FORCE && window.__ALC_FORCE.q30 !== undefined)
  mEff = Math.floor(window.__ALC_FORCE.q30 + 0.5);
if (mEff === 17) {
  if (spiroNext < 0) spiroNext = time; // first entry: stamp immediately
  if (time >= spiroNext && (f > 0.5 || time >= spiroNext + 2.5)) {
    var pv = spiroVar;
    while (spiroVar === pv) spiroVar = Math.floor(Math.random() * 5); // always a DIFFERENT one
    spiroK = spiroVar === 1 ? 14 + Math.floor(Math.random() * 3)     // crown 14-16 points
           : spiroVar === 4 ? 8 + Math.floor(Math.random() * 3)      // wheel 8-10 spokes
           : 10 + Math.floor(Math.random() * 5);                     // lotus/medallion 10-14
    spiroRot += 0.25 + Math.random() * 0.5;    // slight rotation between stamps (feathery ghosts)
    spiroHue = (Math.random() - 0.5) * 0.3;    // per-stamp hue snap, riding the shared q8 clock
    spiroNext = time + 1.0 + Math.random() * 1.0; // ~1-2s cadence
  }
} else { spiroNext = -1; }
```

Then extend `fSpiro` to a 5-way switch on `spiroVar` (all single-stroke tracers on the same
512-sample sweep; ES5, same style as the existing modes):

- **0 lotus loops** — step 1's rose form, `hole 0.14`, petal exponent 1.
- **1 lace-crown star** — same equation, `hole 0.38`, `petal = Math.pow(Math.abs(Math.sin(th*k*0.5)), 2.6)`
  → narrow diamond points around a rim (p0 35.3: ~14–16 points). Single hue (no duo): the ref
  crown is one pale colour; let the additive stroke + tone-map make it pale, do NOT force white.
- **2 sun medallion** — samples split ~0.8/0.2 (the only variant needing a connector hide):
  s<0.8 → wavy-ray ring `r = R*(0.78 + 0.14*Math.sin(th2*k + spiroRot*2))` over th2 = (s/0.8)·2π;
  s≥0.8 → small inner star `r = R*0.22*(0.6+0.4*|sin(th3*4)|)` (the "dark core star" reads dark
  by omission — an additive wave cannot paint dark, so the small inner star + empty annulus over
  the dark ground gives the eye; say this in the code comment). Hide the seam:
  `if (Math.abs(s-0.8) < 0.01) a.a = 0;`.
- **3 wreath-ball** — scribble annulus: `r = R*(0.85 + 0.13*(Math.sin(th*7.3+spiroRot*3) +
  0.6*Math.sin(th*11.7-spiroRot*2))*0.5)` + the live wobble; successive frames' drifting phases +
  feedback ghosts build h1 M5's overlapping-chord torus (ring ~35 %, hole ~12 % — with R=q5·0.9·0.85
  and hole from the annulus inner edge this lands in range). No beads (A8).
- **4 ferris wheel** — samples split 0.6/0.4: s<0.6 → wreath-ish ring (variant-3 maths, gentler
  wobble); s≥0.6 → 9 spokes traced hub→rim→hub (out-and-back: spoke j = floor(u*9), v = frac;
  radial coord = `R*(v<0.5 ? v*2 : 2-2*v)` → continuous at the hub, no alpha hides between
  spokes). The bright hub comes FREE from the additive pileup of 9 spoke-ends — do not add a
  glow. Hide only the ring→spokes seam.

Composition: cadence is beat-gated (f>0.5) with a 2.5 s overtime fallback — same grammar as
`motifPick`'s gate (L994). Revert: delete the frame() block + the switch (mode 17 falls back to
step 1's permanent lotus).

### Step 3 — per-stamp oblate tilt

Target: the same re-roll block + one line already present in `fSpiro` (`* spiroTilt`).

- In the re-roll: `spiroTilt = Math.random() < 0.6 ? 1.0 : 0.5 + Math.random() * 0.2;`
  (face-on 60 % — the 480p medallions are face-on; oblate y-squash to ~0.5–0.7 40 % — h1 M4
  "tilts oblate (y-squash to ~0.5)"). Snap at the stamp boundary is correct behaviour (the ref
  changes pose between stamps; the feedback ghost bridges it).
- Do NOT reuse the PULSAR q11 squash (L840–844): it is entangled with the COMP pupil via
  focusAmt (L1002–1004) and only reaches ×0.66. Keep the tilt local to `fSpiro`.
- No contact shadow (h1 mentions one): an additive wave cannot draw dark — out of reach without
  shader work; explicitly skipped, not forgotten.

### Step 4 (OPTIONAL — only after 1–3 are user-verified) — lace-crown around the pompom

Evidence: p0 35.3 — the crown variant is "stamped AROUND the pompom rim" (the S5 dandelion
pompom = v7's fluff ball, mode 16). Target: the waves[1] accessory point fn — add a branch after
the star-net companion branch (L1181–1201), gated `Math.abs((a.q30||0) - 16) < 0.5 && accLine === 0
&& spiroCrownOn`, where `spiroCrownOn` is rolled by the existing accessory director (L1063–1075:
add `spiroCrownOn = Math.random() < 0.35;` at re-pick). Draw the variant-1 crown maths at
`R = (a.q5||0.4) * 0.78` (just outside the ball's 0.62), alpha `0.45 * accVis`, single pale hue.
Composes with the rest fade (`accVis`) automatically. Revertible by deleting the branch + flag.

**Non-goals (say no here so nobody scope-creeps):** the ~15 % garnish spirographs inside the
tangle (h2 164.5 — would need a second simultaneous motif; revisit with A13's stamp machinery);
beads ON the wreath ring (A8); the rosette/gear-flower ORB (A16 — orb-scale, different item);
one-shot star stamps with long ghosts (A12 — different lifecycle); trail freeze (C2 — not needed
for A1).

---

## 4. Verification recipe

After every step:

```bash
cd /Users/sujitk/projects/personal/ytmusic-wmp-visualizer
npm test        # = node --check on all sources + the concat/frame_eqs smoke test (tools/test.mjs)
```

(If running the CLAUDE.md one-liner manually, the alchemy file is `alchemy-v7`, not `alchemy`:
`["kit","dance","alchemy-v7","ambience","battery"]`.)

Self-render (headless, no user needed):

```bash
node /Users/sujitk/projects/personal/ytmusic-wmp-visualizer/tools/selfrender.mjs "Alchemy (Pastel)" "4,6,8,10,12"
# shots land in /tmp/alc-render/Alchemy__Pastel__<t>s.png — Read them
```

To PIN the feature (the bag only reaches mode 17 stochastically): copy `tools/selfrender.mjs` to
the scratchpad as `pinrender.mjs` and add one `Runtime.evaluate` right after the audio-pump
evaluate (~L146): `await send("Runtime.evaluate", { expression: "window.__ALC_FORCE={q30:17}" });`
— optionally also `q29:0` (wavy-fluid ground) and `q4:0.85` (defeat the swap dip) for clean
frames. **This only works if Step 2's `mEff` gotcha is implemented** — `__ALC_FORCE` overrides
q-vars after frame() (L1136–1140), so the stamp director must read the forced q30 or a pinned run
shows the lotus forever. Step 4 has no q-var to pin: temporarily set `spiroCrownOn = true` at its
roll site for the verification run (and revert), pinning `q30:16`.

Acceptance checks per step (each visible in a screenshot):

- **Step 1** (pin q30=17): ONE closed flower near frame centre, total diameter ~50–65 % of frame
  height; **12 countable petal loops**, each a thin bright stroke meeting at a tip, hollow dark
  centre; petals alternate between two hues (analogous, muted — no white blowout at the hub);
  soft same-hue fuzz ghost beneath the crisp stroke; dark wavy-fluid ground intact.
- **Step 2** (pin q30=17, shots 4,6,8,10,12 s): across the 5 shots **at least 3 distinct
  constructions** appear (petal loops / diamond-point crown / wavy ring + inner star / scribble
  torus / ring + 8–10 spokes with bright hub); between consecutive shots the figure is rotated a
  visible notch; a fading ghost of the PREVIOUS construction is visible under the new one at
  least once; hue relationship shifts per stamp but stays analogous-muted.
- **Step 3** (same pin, more shots e.g. 8): at least one shot shows the flower **y-squashed to
  roughly half its width** (elliptical, "lying down"), and at least one face-on.
- **Step 4** (pin q30=16, crown forced on): the fluff ball with a **thin pale diamond-point ring
  just outside its rim** (~25 % larger radius), fading during rests like other accessories.
- **Unpinned sanity** (no `__ALC_FORCE`, 60 s run, shots every 6 s): the spirograph family
  appears at roughly bag frequency (2/27 dwells) and every OTHER motif/bg/orb behaviour is
  unchanged vs a pre-change baseline run.

Synthetic audio ≠ real music — after self-render passes, ask the user for ONE live confirmation
(CLAUDE.md rule) before calling A1 done.

---

## 5. Risks & rollback

- **Matrix risk flags: none** — "loop tracing fits one wave; oblate squash mechanism already
  exists as PULSAR" (gap-matrix A1). No dots, no filled beads, no camera/accessory rework, no
  invented elements (all five variants have timestamps).
- **Adjacent user-rejection history this touches (respect, don't re-trigger):**
  - *Star blizzard* (fix a6e3f04): an earlier star motif went edge-to-edge as a hairline
    blizzard. Keep R ≤ q5·0.9 and loop counts countable (10–16); if a screenshot shows
    uncountable spokes, reduce k, don't reduce alpha first.
  - *Rotational gear-smear* (f12Star comment L628: spin softened 0.4→0.12): continuous spin +
    feedback smears star shapes into gear-webs. The spiro therefore takes its rotation as
    per-stamp SNAPS (`spiroRot +=`), NOT a faster continuous q9 multiple — this also happens to
    be exactly what h1's "feathery ghosting" describes.
  - *Bead-row removal* (bad7755, "ugly, unfixable"): nothing here uses dots or bead rows; the
    wreath stays a continuous scribble stroke.
  - *Motion rework rejection* (9ba675e): no camera or accessory-layer changes except the
    clearly-gated optional Step 4, which is one small branch inside the existing accessory
    structure — ship it as its own commit so it can be reverted alone.
  - *Pastel stays muted* (alchemy-measured-color-facts): sat ~0.3–0.5 on a dark ground; all
    colour via `orbCol` on the q8 clock + the comp tone-map; never force white (the crown reads
    pale through the pipeline, not via rgb=1).
  - *Don't over-iterate* (dont-over-iterate-speculatively): one step → self-render → user look →
    commit. Never stack steps 1–3 into one unverified push.
- **Additive-pileup risk at the hub** (lotus lobes and wheel spokes converge): mitigated by
  MODE_ALPHA 0.58 start + the hollow-centre offset; check the Pastel hub in every step's shots.
- **One commit per step:**
  1. `alchemy: spirograph petal-flower motif (mode 17, lotus loops)`
  2. `alchemy: spirograph per-stamp variant swap (crown/medallion/wreath/ferris)`
  3. `alchemy: spirograph per-stamp oblate tilt`
  4. `alchemy: lace-crown ring accessory around the fluff ball (optional)`
  Each is independently revertible with `git revert`; step 1's bag entries are the single
  reachability switch for the whole family.

---

## 6. Acceptance criteria

- [ ] A new central-motif family exists (mode 17) drawing **closed petal-loop rosettes as one
      crisp stroke from a hollow centre**, 10–14 loops, total ~50–65 % of frame — matching p0 M7
      / h1 M4 construction, not triangles/chords (which the anemone/12-star already cover).
- [ ] The stroke's wobble is the **live audio waveform** (re-arranges every frame — primary-motif
      waveform rule).
- [ ] **Five constructions** are reachable and visually distinct: lotus loops · lace-crown star
      (14–16 diamond points) · wavy-ray sun medallion with inner star · scribble wreath-ball
      (ring ~35 %, hole ~12 %) · ferris wheel (ring + 8–10 spokes + bright hub).
- [ ] Construction identity, rotation offset, and hue **re-roll per stamp every ~1–2 s,
      beat-gated**, while mode 17 is up — consecutive stamps never repeat the same variant
      (burst_54 behaviour), with the old stamp's ghost fading beneath.
- [ ] Alternating-petal **two-tone duo** on the lotus (h1: cream-green/orange class — analogous
      hues from the q8 clock, muted in Pastel).
- [ ] Some stamps are **oblate (y-squash ~0.5–0.7)**, most face-on.
- [ ] Budget intact: still 4 waves + 4 shapes, motif on waves[0] only; no new q-vars; no dots.
- [ ] `npm test` green; self-render pinned + unpinned runs pass the §4 checks; existing motifs,
      backgrounds, orbs, tether, camera behave identically to a pre-change baseline.
- [ ] (Optional step 4) crown ring composes around the fluff ball and fades in rests.
- [ ] User has live-confirmed the family against the 480p reference (27.5–30 / 49.8–56) once.
