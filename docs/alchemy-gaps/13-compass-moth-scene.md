# Doc 13 — Compass-moth radial scene (corrugated ray fans + crosshair axes + rose-bullseye pair)

> **★ LANDED IN FULL (2026-07-10, 5 commits 86a690b→…; ADAPTATIONS):** motif = **mode 20**
> (landing-order rule; the registry's 20 held). Radial-out reuses doc 01's field with a
> moth-specific 0.005 target (urchin/fluff keep the de-distorted 0.002). Crosshair in comp —
> NOTE comp `uv.y` is TOP-DOWN vs wave y (the horizontal line reads `1.0-uv.y`). **Step 4
> ADAPTED:** the waves[3] ring accessories were PULLED 2026-07-10 (hollow-ring ghosts), so O10
> ships as the ORB PAIR itself — vertical "8" through the hub, accent ink stepping ~1s; NO
> rings. Step 5 = free via doc-03 tether events between the parked pair. Step 6 crimson
> verified numerically. Accessory lines FADE under the moth (radial-out advected them into
> frame-wide stripes — the pinwheel-under-freeze lesson again). Awaiting the user's live look.

**Matrix items:** A7 · **Priority:** P2 · **Risk flags:** (6) Pastel stays muted — the crimson fan is a deliberate brief vivid accent, everything else desaturated dusty. · **Confirmation needed:** yes —

1. A7's crimson fan family (t=87.2–89) is _explicitly the most-saturated element in the whole 6.5s segment_. Confirm we may ship ONE brief (~1–2 s) saturated-crimson accent that intentionally breaks the muted rule, per the vivid-accent policy (risk 6)? The reference does this, so it is faithful, but it is the one place we push saturation.
2. Route the rose-bullseye ring pair (O10) through **doc 07 Step 5's `waves[3]` ring-accessory multiplexer** (so this doc _depends on_ doc 07 shipping the bullseye type first — cleaner, reuses `alcOrbTarget`), OR ship a standalone minimal orb-recolour + one `alcOrbTarget` ring in this doc's Step 4 so it can land independently?

---

## 1. Reference behaviour (what the original does)

Source: 480p, **S8/M7 "Compass moth" climax, t=82.9–89.5** (report_p1 §S8 L108–125, M7 L258–264; gap-matrix A7 L60–64). Camera is **static for the entire scene — all radial motion lives in the trail layer** (report_p1 §3.7).

**Bloom entry (LIVE burst).** Near-empty → **~80% of frame span in < 0.5 s** (burst_81.3). A fast expansion, not a fade-in.

**Corrugated ray fans — the signature (TRAIL-STREAMED, not N drawn rays).**

- 2–4 _families_ of fine rays. Each ray ≈ **1–1.5 px** with a **regular chevron ripple: wavelength ~12–15 px, amplitude ~2–3 px**. **15–25 rays per family, 40–60 total.**
- Colours: pale blue-lavender / grey-green / dusty pink, all in the **#594964 muted tier**.
- **Streaming radially OUTWARD.** The trail displacement field is **radial-out in this scene** (unlike the down-bias fields elsewhere — report_p1 §3.1). Fan orientation **precesses ~15–20°/s** (clockwise).
- **Emitter-vs-trail (critical):** the "40–60 rays" are NOT all drawn per frame. A small crisp live ray set is emitted near the hub; the radial-out warp advects+enlarges the copies outward, so the dense fan fill _comes from the feedback buffer_ (report_p1 §4 moth-fans note L407–409: "1 wave drawing N rays per frame … radial-out trail = scene-gated warp `zoom>1` centred on motif").

**Centre — rose-bullseye pair (O10).** A **vertical pair** of magenta rose-bullseyes stacked like an **"8"** (full_84.0). Each ≈ **13% dia**, **2–3 magenta ring outlines around a violet core (#7b278f)**. Core hue **steps ~1 s/step**: green (83.5) → gold (84.4) → milky-white (85.2) → pink (86.2). (Orb definition O10, report_p1 L320.)

**Crosshair axes (LIVE).** A literal **1 px cyan horizontal line spanning 100% width** + a **vertical partner through the motif centre**, **flashing / jittering LIVE** (report_p1 L112–114). Cheap: comp-shader additive lines, costs no slots (gap-matrix A7 L64; report_p1 §4 L409).

**Electric-blue stepped-jag bundles (LIVE, ~0.5 s).** 3–6 rays flash diagonally through centre on hits.

**Crimson fan family (t=87.2–89) — the vivid accent.** A saturated crimson fan sweeps in from left and right mid; the **most saturated element in the segment**. Brief.

**Dumbbell stamp within the scene (t=88.25) — LAYER INDEPENDENCE.** Two pink rose-pompom orbs (~9–10%) on the **UL→LR diagonal** joined by a thin pale **double-strand tether** (~45% span) stamp _while the fans keep streaming_ — the fans are unaffected. Bg behind fans: dusty grey-mauve **#6f5866**.

**Lifecycle summary.** Whole scene ~6.5 s. Bloom < 0.5 s; fan precession continuous; core hue steps once/second; crimson accent ~t=87 for ~1–2 s; dumbbell one-shot near the end.

---

## 2. Current implementation state

Verified against `presets/alchemy-v7.js` @ 302349c.

**Corrugated fans — ABSENT.** Nearest is the `waves[1]` **ray-curtain** accessory (`accLine===1`, L1225–1245): 16 **straight** parallel rays, one-shot 1.6 s sine envelope, pivots ~0.8 rad while alive, arms-then-fires-on-beat. No chevron corrugation, no continuous precession, no radial-out streaming. The **pinwheel** (`accLine===4`, L1203–1224): 8 straight lines through a motif-anchored hub, steady 0.28 rad/s — closest to the precessing-fan _motion_ but straight and hub-locked, not streamed. `alcRadialBurst` (kit L1348) draws straight radial rays and is the nearest reuse candidate but has no corrugation.

**Crosshair — ABSENT.** The comp composite is `col = ground + trail*1.28 + glow*0.6` (L200). No additive line term. q2/q3 (motif centre) reach the shader per memory `alchemy-director-t02-finding`, so a crosshair can be drawn there with zero slot cost.

**Radial-out trail field — ABSENT but PLANNED.** `WARP_V7` (L43–76) runs one program always: decay + isotropic blur + tiny magnify `q15` (L54–56) + pan + roll + swirl(tunnel only). Radial-out = raising `q15` (magnify shrinks the sample offset → old buffer appears larger each frame → deposits grow outward) centred on pivot (q20,q27). **Doc 01 Step 4** already specifies exactly this as `radialAmt` (C2 field #3), gated to motif modes 2/16 (urchin/fluff). A7's moth wants the _same field_, gated additionally to the moth mode. **Shared ownership — do not add the block twice.**

**Rose-bullseye pair — DEVIATING.** Orbs today are `orbShape` (L255–301, 40-sided filled disc + prominent contrast border) + `orbGlow` (L302–337, additive halo). No concentric ring outlines. O10 = magenta rings + violet core → route via kit **`alcOrbTarget(qx,qy,n,colorize)`** (L2168; draws `n` concentric rings on a wave), which is exactly **doc 07 Step 5's `waves[3]` bullseye type**.

**Dumbbell + tether — REUSABLE.** Orb pair (shapes 0–3) at (q21,q22)/(q23,q24) + `fTether` double-stroke on `waves[2]` (L1266–1287, gated to both-orbs-visible) already produce a two-orb-joined-by-double-strand dumbbell. Needs only diagonal staging (doc 07 Step 3 D15) + forced-visible during the moth scene.

**Slot budget today (catalog §7):** waves[0] motif · waves[1] accessory · waves[2] tether · waves[3] **corridor-only, idle otherwise** · shapes 0–3 = the 2 orbs × (fill+glow). The moth scene ≠ corridor, so **`waves[3]` is free during the moth** for the bullseye rings.

---

## 3. Implementation plan

**Architecture decision:** the moth is a **motif mode** (new `q30` id 17, occupying the always-on `waves[0]`), coupled to a warp field + a comp term + orb recolour — i.e. a _scene coupling of one new emitter + existing/planned pieces_, not a free-standing new subsystem. This keeps the emitter crisp on `waves[0]` and lets the radial-out warp do the fan-fill, matching the trail-streamed mechanism. **No new q-var:** the moth reuses `q30` (already shader-read as motif mode), reads existing `q2/q3` for the crosshair centre, and reuses `q15` for radial-out via doc 01's shared `radialAmt`. Scene sub-state (accent timing, dumbbell one-shot) lives in **closure state** (`mothT0`, `mothCrimson`).

HARD constraints honoured: **4 waves** — waves[0] moth fan (motif, already allocated); waves[3] bullseye rings (reuses the idle-outside-corridor slot); waves[2] tether (reused); waves[1] accessory **untouched**. **4 shapes** — orbs recoloured, none added. **No dots** — rays are lines, bullseye is ring outlines. **Pastel muted** — fan colours desat pale (#594964 tier); crimson is the ONE brief accent. **Kit factories** — CALL `alcOrbTarget` for the bullseye (don't re-derive); `alcRadialBurst` (L1348) is the reuse candidate for the straight-ray base if extended, but the corrugation is mode-specific so a mode point-fn is acceptable.

### Step 0 — debug pin (no visual change, no code)

The `__ALC_FORCE` hook (L1136–1140) already forwards any key onto `t`. Pin the mode from selfrender with `window.__ALC_FORCE = { q30: 17 }` (and `{ q30:17, q29:5 }` to sit it on the flat wash so the fans read against a calm ground). Nothing to write.

### Step 1 — corrugated-ray-fan MOTIF MODE (smallest shippable slice, visible on its own)

_Target:_ new mode id 17 drawn on `waves[0]`; add a `case 17` branch in `centralDraw` (dispatch L835–846), an entry in the `MODES` array (L807–825), a `MODE_ALPHA[17]` (L827–831, low ~0.42 — additive dense), and a `MOTIF_BAG` weight (L923–925, weight ~1, rare).
_Change (ES5 sketch, point_eqs on the 512-sample wave):_

```js
// mode 17 COMPASS-MOTH fan: R rays from the hub, chevron-corrugated, slow precession.
var R = 20,
  fk = (a.sample || 0) * R,
  k = Math.floor(fk),
  u = fk - k;
var pang = mothRot + k * (6.2832 / R); // mothRot = time*0.30 (~17°/s precession)
var t01 = u; // 0..1 along the ray
var lam = 0.03; // chevron wavelength ~13px in uv
var corr = Math.sin((t01 / lam) * 6.2832) * 0.012; // ~2-3px perpendicular ripple
var len = sc * 1.4; // sc = size scale (scaleFor)
var rr = t01 * len;
a.x = a.q2 + Math.cos(pang) * rr - Math.sin(pang) * corr;
a.y = a.q3 + Math.sin(pang) * rr + Math.cos(pang) * corr;
// muted #594964 tier: family hue steps per ray-group, LOW brightness
var hm = (a.q8 || 0) + Math.floor(k / (R / 3)) * 0.12; // 3 families, analogous
var bri = 0.5; // desat/dark — trail + radial-out do the mass
a.r = orbCol(hm, 0) * bri;
a.g = orbCol(hm, 0.33) * bri;
a.b = orbCol(hm, 0.67) * bri;
a.a = u < 0.02 ? 0 : 0.42; // hide the hub connector
```

`mothRot` is a closure var advanced in `frame` (`mothRot = time*0.30`). _This alone renders a corrugated precessing starburst._ _Revert:_ remove the mode entry + bag weight.

### Step 2 — radial-out warp field gated to the moth (the trail-streamed fill)

_Target:_ doc 01 Step 4's `radialAmt` block. **If doc 01 Step 4 is already shipped**, extend its gate only: `(mCur===2 || mCur===16 || mCur===17)`. **If not yet shipped, this doc owns the block** (copy doc 01 Step 4 verbatim, with mode 17 in the gate). Cap `q15 ≤ 0.008` (a bigger magnify is the rejected spiky over-fill, L971–972); hub = (q2,q3); damp pan while active.
_Effect:_ the crisp fan emitted in Step 1 streams outward and the feedback copies compound → the observed 40–60-ray dense fan from ~20 live rays. _Revert:_ drop `mCur===17` from the gate.

### Step 3 — crosshair axes (comp, ZERO slots)

_Target:_ comp `makeComp`, just before the composite (insert after L199, before `col = ground + …` at L200). Gate on the moth mode (q30 reaches comp) and draw through (q2,q3).
_Change (GLSL sketch — mind reserved names; use `pxh`/`pxv`):_

```glsl
float moth = step(16.5, q30) * step(q30, 17.5);
float px = 1.5 / resolution.y;                 // ~1.5px
float lh = smoothstep(px, 0.0, abs(uv.y - q3));           // horizontal, full width
float lv = smoothstep(px, 0.0, abs((uv.x - q2)*asp));     // vertical, through centre
float flash = 0.35 + 0.65*clamp(treb_att, 0.0, 1.5);      // LIVE flash on highs
float jit = 0.85 + 0.15*sin(time*47.0);                   // fine LIVE jitter
vec3 cyan = vec3(0.35, 0.85, 0.95);
glow += cyan * (lh + lv) * moth * flash * jit * 0.6;       // additive, MUTED cyan
```

Add into `glow` (already additive into the composite at L200) so tone-mapping compresses it — keeps it from blowing to white. _Revert:_ delete the block.

### Step 4 — rose-bullseye orb pair (O10)

_Preferred (depends on doc 07 Step 5):_ when moth active, select the `waves[3]` **bullseye type** anchored to both orb posts, tuned to O10: `n=3` magenta rings via `alcOrbTarget("q21","q22",3, colMagenta)` + `("q23","q24",3, colMagenta)` (kit L2168 — CALL it, don't re-derive), and recolour `orbShape` core to violet #7b278f with the ~1 s hue step (green→gold→white→pink) driven by a closure clock `floor((time-mothT0)/1.0)`. Force vertical "8" staging: park orb B directly above orb A (small Δy, Δx≈0) during the moth.
_Standalone fallback (if doc 07 not yet shipped):_ recolour the existing orbs to violet core + magenta halo and draw ONE `alcOrbTarget` ring pair in the idle `waves[3]` slot gated to `moth`. _Revert:_ mode-gate the recolour + waves[3] branch off.

### Step 5 — dumbbell + tether reuse (layer independence)

_Target:_ the moth-scene director in `frame`. Force both orb visibilities up (`q14`, `q25` → 1) and enable the tether during the moth; stage the pair on the **UL→LR diagonal** for the t≈88 dumbbell moment (reuse doc 07 Step 3 D15 staging if present; else a simple eased diagonal offset). `waves[2]` tether is already double-stroke — no slot change. The fans (waves[0]) are untouched → layer independence for free. _Revert:_ remove the forced-visibility writes.

### Step 6 — crimson fan accent (risk 6 — own commit, user eyes)

_Target:_ the mode-17 draw colour + a closure clock. ~4–5 s into the moth dwell (analog of t=87.2), for ~1.5 s, tint the fan family toward crimson and boost saturation ONLY for that window:

```js
mothCrimson = time - mothT0 > 4.0 && time - mothT0 < 5.5 ? 1 : 0;
// in point_eqs: if (mothCrimson) { a.r = min(1, 0.9); a.g *= 0.15; a.b *= 0.2; }
```

Keep it brief and single-family (one small saturated accent — memory `alc-colors-were-washed-out`). _Revert:_ pin `mothCrimson = 0`.

---

## 4. Verification recipe

**Syntax + runtime smoke (before any reload):**

```bash
cd /Users/sujitk/projects/personal/ytmusic-wmp-visualizer
for f in presets/*.js viz.js; do node --check "$f" || break; done
# concat into ONE shared global scope (NOTE: the alchemy file is alchemy-v7, not "alchemy"):
node -e 'const fs=require("fs"),vm=require("vm");global.window=global;
  const cat=["kit","dance","alchemy-v7","ambience","battery"].map(f=>fs.readFileSync("presets/"+f+".js","utf8")).join("\n;\n");
  vm.runInThisContext(cat);
  let n=0; for(const [k,p] of Object.entries(window.WMP_PRESETS)){ if(p.frame_eqs) p.frame_eqs({time:85,bass:1.3,bass_att:1.1,mid:1,treb:1.2,treb_att:1.2}); n++; }
  console.log("ok", n, "presets");'
```

Run `frame_eqs` at `time:85` (mid-moth) so the crimson-accent + hue-step clocks execute. GLSL (the Step 3 crosshair, Step 2 warp) only fails at runtime — pre-check the comp string via the headless ANGLE recipe in CLAUDE.md if the crosshair block doesn't link.

**Self-render pinning (per step):** `node tools/selfrender.mjs` with the scratchpad `pinrender.mjs` setting `window.__ALC_FORCE`:

- Step 1: `{ q30:17, q29:5 }` → expect a corrugated precessing starburst at centre on the flat wash.
- Step 2: same pin, over several seconds → rays visibly **stream outward** and thicken into a 40–60-ray fan from ~20 live rays.
- Step 3: same pin → a **1px cyan crosshair** through centre, brightening on treb.
- Step 4: same pin → **violet-core / magenta-ring bullseye pair**, vertically stacked, core hue stepping ~1 s.
- Step 5: unpin visibility → both orbs + double-strand tether present _while fans keep streaming_.
- Step 6: capture at `time≈mothT0+4.5` → one brief crimson fan family, everything else still muted.

**One screenshot-visible acceptance check per step** = the "expect" clause above.

---

## 5. Risks & rollback

- **Risk (6) muted (the crimson accent):** the ONLY intentional saturation break. Confined to one family for ~1.5 s (Step 6, own commit). If the user finds it too hot, `mothCrimson=0` kills it in one line without touching the rest of the scene. Everything else stays #594964-tier pale (memory `alchemy-measured-color-facts`: sat ~0.3–0.5 on a dark ground).
- **Risk — radial-out warp is the rejected-rework class (doc 01 / C2 flag 4):** ship it as ONE gated field, verified live (Step 2). It reuses doc 01's `radialAmt` — coordinate so the block is added once, not twice.
- **Risk — comp crosshair could blow to white:** routed through `glow` + Reinhard tone-map, muted cyan, treb-gated. If it reads neon, drop the `0.6` multiplier.
- **No invented elements** (memory `alc-faithfulness-no-invented-elements`): every piece here is measured in S8 (fans, crosshair, bullseye pair, dumbbell, crimson accent). The electric-blue stepped-jag bundles are DEFERRED (rare LIVE 0.5 s hits) — not shipped in this cluster unless a spare beat-event slot exists; note as out-of-scope, not invented.

**One commit per step:**

1. `alchemy: A7 step1 — compass-moth corrugated ray-fan motif mode (q30=17)`
2. `alchemy: A7 step2 — radial-out trail field gated to the moth (shared radialAmt)`
3. `alchemy: A7 step3 — cyan crosshair axes in comp (zero-slot, LIVE flash)`
4. `alchemy: A7 step4 — rose-bullseye O10 orb pair (violet core + magenta rings)`
5. `alchemy: A7 step5 — dumbbell + tether reuse during the moth (layer independence)`
6. `alchemy: A7 step6 — brief crimson fan accent (vivid-accent policy)`

---

## 6. Acceptance criteria (observable, vs the S8 reference)

- [ ] A **corrugated** ray starburst (chevron ripple, not straight rays) blooms at centre and **precesses ~15–20°/s**.
- [ ] The fan **streams radially outward** — dense 40–60-ray fill is visibly built by the trail, not by drawing 60 rays (crisp near the hub, softer/enlarged at the rim).
- [ ] A **1 px cyan crosshair** (full-width horizontal + vertical-through-centre) is present and **flashes/jitters LIVE**.
- [ ] A **vertical rose-bullseye pair** ("8"): violet core (#7b278f-ish) + 2–3 magenta ring outlines, core hue **stepping ~1 s** green→gold→white→pink.
- [ ] Near scene-end, a **dumbbell** (two orbs + thin pale double-strand tether, UL→LR diagonal) stamps **while the fans keep streaming** (layer independence — fans unaffected).
- [ ] Exactly ONE brief **crimson fan** accent; all other elements stay muted #594964-tier on the dusty grey-mauve ground.
- [ ] Camera is static throughout — all radial motion is in the trail layer.
- [ ] Slot budget unchanged: waves[0] motif + waves[3] bullseye (moth-only) + waves[2] tether; no new shapes; no dots; no new q-var.
