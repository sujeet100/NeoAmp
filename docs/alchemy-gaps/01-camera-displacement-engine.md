# 01 — Camera model & per-scene trail-displacement engine

> **★ LANDED IN FULL (2026-07-08, 7 commits `fba6b7c`→step-7):** steps 1–7 all implemented, one
> commit per step, npm-test + pinned-self-render verified per step (rest-pan · freeze@motif-14 ·
> down-sag@bg-4/6 · radial-out@motif-2/16 · swirl-eye@motif-8 · dormant q12 shear (+q12 freed,
> squash gate moved to q29) · rare q13 radial ripple w/ lazy first-cooldown + `FORCE.ripple` pin).
> The confirmation question was pre-answered YES (README Q1). **Awaiting the per-field LIVE looks**
> — each commit is individually revertible per §5. Optional step 8 remains parked.

**Matrix items:** C1 (camera model: emitters pinned, trail-only streaming — RECONCILED) · C2 (per-scene trail-displacement FIELD programs — the core engine gap) · C8 (radial ripple starburst finale warp)
**Priority:** C1 P1 · C2 P1 · C8 P3
**Risk flags:** (4) HARD on all three — warp/motion changes are exactly the class of change the user rejected wholesale (commit `9ba675e` reverted the camera/world-follow rework into `presets/alchemy-motion.js`). Ship ONE field at a time, user-verified live between steps. (6) on the freeze/deposit steps — longer-lived deposits must not accumulate to white; keep the Reinhard headroom, never raise the trail composite gain. (5) is satisfied: every field program below is copied from a measured reference behaviour, nothing invented.
**Confirmation needed:** **yes** — ask before starting step 1:

> "The Alchemy trail-pan today runs at one constant speed forever. The references keep the pan *character* but give it per-scene behaviour: it goes near-still during rest beats and in the terrain scene, drifts downward under the bars/bands scenes, streams outward under the urchin/fluff motifs, and coils around an off-centre eye under the vortex. OK to add these one at a time as scene-gated variations — keeping today's snap-pan as the default everywhere else, never moving the motif/orbs themselves, and each change individually revertible?"

(The user rejected the previous motion rework and "prefers the classic WITH its pan" — that rework moved the *emitters* (world-follow) and added a global camera-regime director; this plan does neither. C8 needs no separate question — it is directly evidenced (r0 2.5) — but it is still a warp change, so it lands as its own step with a live look.)

Cross-references: B3 (terrain from stacked stamps) and D11 (mountains accumulate/freeze) *consume* the freeze field built here; A17 (full-frame radial field) and A3 (harp swath frozen copies) consume the radial-out and freeze fields; C4 (chevron shear terrain) consumes the shear term; C10 (deposit-holding grounds) consumes freeze. Those items' docs describe the *content*; this doc builds the *engine capability* they run on. Do not duplicate their content work here.

---

## 1. Reference behaviour (what the original does)

### C1 — Camera model: emitters never translate; only the TRAIL field streams

The eight analyst reports are near-unanimous, using **feature-anchored** checks (tracking specific emitters/background anchors across frames, not whole-frame correlation):

- **p0 §3.7 (480p, 0–60s):** "Camera: NO rigid translation anywhere in 0–60s. All parallax is element travel + trail slip + fold/rotation (bursts show static bg reference points in every scene)."
- **p1 §3.7 (480p, 57–117s):** "Camera: static for the entire 60s." Verified by feature alignment: flame apex moves 48%→47% of frame width over 2.2s (i.e. nothing); bars pinned; band scenes anchored.
- **p2 §3.3 (480p, 114–174s):** "Camera: STILL for the entire 60s. All background anchors (bar x-positions, fold axes, band edges, mountain rail) hold position; parallax feel comes entirely from element drift + trail slip (**trails stream in the warp direction faster than emitters move**) and counter-swinging accessories."
- **p3 §3.1 (480p, 171–228s):** wallpaper grid pixel-static; "scene changes = the emitter set + displacement field switch programs while the buffer keeps running."
- **h0 (1080p, 0–65s):** "STILL for the entire segment. No sustained pan, no dolly. Only: scene entry sweep-in from an edge (5.3), scene exit corner-collapse (28.25), and ±3% center wander in the anemone/vortex."
- **h1 (1080p, 62–127s):** "NO global camera translation or zoom anywhere in 62–127." Depth comes from bg advection under pinned motifs, outward feedback streaming, a treadmill band under a static pompom, trail lag.
- **h2 §3.1 (1080p, 124–186s):** "essentially ZERO advection in this segment — stamps freeze where drawn… Exception: slight global down-left drift ≤2–3%/s in S1 and a downward sink under the S14 totem. No global zoom/rot/snap-pan observed anywhere in 124–186."
  **Open caveat:** h2 adds the aside "(Contrast with earlier segments' snap-pans; the finale is anchored.)" — implying earlier segments had snap-pans, which h0/h1 (who own those segments) contradict. Segment owners outrank an out-of-segment aside, so **emitters-pinned stands**, but keep this caveat in mind if a live look ever suggests otherwise.
- **r0 (19s colour-accurate clip):** "camera contributes NOTHING (zero global translation the whole clip — camtest_s1_bg, camtest_terrain)"; terrain peaks "do NOT translate; they diffuse in place."

**Reconciliation with the motion-study memory (this replaces the old raw CONFLICT):** the memory `alchemy-motion-study` measured 0.16–0.27 UV/s "pan regimes" via GLOBAL phase correlation — a whole-frame method that locks onto the dominant pixel mass and therefore **cannot distinguish camera translation from feedback-trail streaming**. The feature-anchored analysis shows emitters never translate. Both observations fit ONE model: **the original streams only the TRAIL buffer while emitters stay pinned** — which is exactly v7's architecture today (the warp pan translates the trail-buffer sample coordinate; motif/orb anchors live in composition space). This is also precisely why the world-follow rework was rejected: moving the emitters was never the original's behaviour.

**Quantitative rates (motion-study, reinterpreted as trail-streaming rates):** gentle drift ≈ 0.08 UV/s (≈ 0.0013 UV/frame at 60fps) in most calm scenes; sustained directional streams 0.16–0.27 UV/s (0.0027–0.0045 UV/frame) held 5–12s; rare violent streams 0.5–0.9 UV/s; **near-still RESTs 4–10s**. v7's constant 0.0045 UV/frame sits permanently at the TOP of the reference band and never rests — the actionable half of C1.

**Empirical sign map (measured via pinned self-renders, motion-study memory — still valid):** `+q18` streams buffer content LEFT; `+q19` streams it UP. The comment at `presets/alchemy-v7.js:981` claiming `q19 = −0.0012` is "upward drift" is WRONG by this test — it streams DOWNWARD. Wave coords are y-up (`q3` increasing = up on screen).

### C2 — Per-scene trail-displacement FIELD programs (the core engine gap)

Every report independently concludes the feedback warp is **scheduled per scene**, not fixed:

- **p1 §3.1:** "Feedback engine = decay + blur + directional displacement, **per-scene field**. Down-bias in most scenes (mountain ranges t=79, rope cascade t=112.8, stems t=116); RADIAL-OUT in the moth scene (fans stream outward, t=83–89); sideways sway-copies for the smoke strands (t=72.3). The S-warp on sinking waveform copies (t=79.0) shows a wavy shear component in the displacement field, not pure translation."
- **p2 §3.1–3.2 (DECISIVE):** "at t≈121.8 the picket bars physically bend into the kaleido's arcs within 0.5s — nothing is cleared; **the incoming regime re-warps existing pigment**." Field menu proven in one 60s segment: (a) none/gentle blur (washes), (b) quad-mirror + barrel lens, (c) **sawtooth x-shear as f(y)** + slow advection along the band axis — proven by "big stamp orbs get chevron-sheared into zigzag ribbons within ~1s of landing", (d) mild rightward/down advection + vertical waviness. "Colour transport rides the warp."
- **p3 §3.1:** one 57s stretch walks SIX programs: perpendicular-comb → **near-still low-decay (ghosts live 5–8s)** → sweeping swaths → downward advection → **rotation about a movable eye at (33%, 8%)** (the black "eye" is just the un-fed centre of rotation) → tile-replicator → decay-to-flat. "Old content is never erased, only advected/decayed."
- **h2 §3.1:** "essentially ZERO advection in this segment — **stamps freeze where drawn** (chevrons S1, mushroom bodies S11, gold band S7→S8)"; decay to invisibility in ~4–8s.
- **p0 §3.2:** "Feedback warp is PHASE-SCHEDULED, not fixed": downward sag in S2 (mountain rows), strong **vertical stretch** late-S2 (grass blades 35–55px), near-isotropic gentle blur in the wash scenes, 4-way mirror fold, rotation-smear. "The bg 'regimes' are mostly the warp mode applied to whatever trails exist."
- **r0 (terrain):** "draw stacked waveform lines into a mid band for ~1s bursts, then STOP and let decay hold ≥3s — **high decay, low blur during the terrain phase — q-gated blur**." Peaks persist ≥3.5s with NO translation, recolouring in place.

**Emitter-vs-trail mechanism (explicit):** in every scene, 1–3 crisp ~1–2px emitters are re-drawn per frame at pinned/slow-moving anchors; ALL area/mass (mounds, mountains, curtains, bodies) is their accumulated trail, and the trail's motion is the scene's displacement field — direction/speed/character chosen per scene class, with FREEZE (no blur, no displacement) as a first-class program. v7 has exactly ONE program running always; the freeze in particular is impossible today because the compounding blur is unconditional.

### C8 — Radial ripple starburst finale (19s clip)

- **r0 2.5 (t=18.6–19.6, best frames 19.2/19.45/rays_crop):** the finale begins as a thin X-cross of 4 straight 1px pink/white lines through the hub (18.6–18.9), blooms to ~40 rays by 19.1. Simultaneously "**the whole previous frame ripples radially: concentric chevron interference bands (wavelength ~25px) sweep the corners → radial ripple displacement in feedback warp, hub-centred**." ~25px on the ~480px-tall clip ≈ **5% of frame height** wavelength. Duration ≈ 1s. Hub = the starburst hub (the motif centre). Rays inherit the underlying terrain hue.
- **r0 §4 impl note:** "add a **q-gated radial ripple displacement** (hub-centred, chevron wavelength ~25px) for the starburst finale."
- Scope split: the X-cross → 40-ray bloom is motif work (A7/A12 — other docs). **This doc's C8 scope is ONLY the buffer-ripple warp term + its rare event trigger.** It is a climax *transition* effect observed once in 19s of footage — cadence must be rare.

---

## 2. Current implementation state

All refs verified against `presets/alchemy-v7.js` @ HEAD (`4db3368`, same content as catalog snapshot `302349c`).

**One warp program, always on** — `WARP_V7` L43–76:
- decay `q1 = 0.957` (set L969; valley blends → 0.96 at L1132),
- compounding 9-tap gaussian blur, radius `2.4 + 2.2·q28` px with `q28 = 0.5` (L970, blur loop L63–74) — **unconditional**, so nothing can hold crisp ≥3s,
- tiny magnify `q15 = 0.0012 + 0.0018·pulse` (L973; the comment L971–972 records that a big magnify was the **rejected "spiky-burst over-fill"** — cap any radial-out below that),
- roll `q16 = 0.01·sin(time·0.06)` (L974) + swirl `q17` (L975, 0 except tunnel bg → L1099),
- pan `q18/q19` applied to the sample coord at L58.

**Pan director** L977–981: `panMag` eases toward 0.0045 UV/frame (≈0.27 UV/s — the top of the refs' band); direction from `makeSnapDir(3.0, 6.0)` (L385–395: holds a random angle 3–6s then snaps); constant `−0.0012` bias on q19 (comment says "upward"; measured DOWNWARD — see sign map). **The pan never rests** — the rest system (L1044–1059) fades accessories + orb B only.

**Drifting pivot** L983–987: `(q20,q27)` on an elliptical Lissajous (r 0.12±0.04).

**Scene couplings that already modulate the field (the pattern to copy):** CORRIDOR (bgMode 3) L1101–1124 — `corridorAmt` eased at 0.5/s, forces rightward pan 0.0065, kills vertical drift + magnify, re-anchors orbs; VALLEY (motif 12) L1126–1134 — `valleyAmt` forces `q15 → 0.012` dolly + decay → 0.96 + roll off. These prove per-scene field modulation composes safely with the directors. (Note D14: the valley dolly itself is unsupported by the refs — do NOT copy the dolly, only the easing/gating *pattern*.)

**Reusable:**
- The eased-scene-amount pattern (`corridorAmt`/`valleyAmt`) is exactly the gate shape each new field needs.
- The pinned-emitter architecture already matches C1 — motif centre (q2/q3, L1011–1012) and orb anchors (q21–q24, L1035–1038) never ride the pan. **Preserve this.**
- `window.__ALC_FORCE` debug hook L1136–1140 (runs at the END of `frame()`, overrides any `t.*` key — works for pinning q-vars read by shaders and point fns).
- `restAmt` (L1057) is the ready-made gate for the rest field.

**Absent:** any directional sag/shear/vertical-stretch, radial-out streaming, movable-eye rotation, FREEZE (blur off / near-zero displacement), radial ripple. `wrap: 0` (BASE L245) — the pan drags the buffer with edge clamp → smears at frame borders (a rest/freeze field also reduces this symptom).

**Q-var budget:** all 32 taken (header L29–33). But this cluster needs almost NO new shader inputs — the rest/freeze/down-sag/radial-out/swirl-eye programs are all expressible through the EXISTING channels (`q1 q15 q16 q17 q18 q19 q20 q27 q28`) written per-frame from JS. Only two genuinely new shader inputs are needed:
- **shear amount** → free `q12`. Today q12 is written at L990 (`4` when kaleido, else `1`) and read ONLY at L841 by JS point fns (`(a.q12 || 1) < 1.5` gates the PULSAR squash to fold-off). The same information is in `q29` (fold ⇔ bgMode 1). Freeing edit is two lines (step 6).
- **ripple amount** → multiplex `q13`. q13 is written at L991 (fold scale in kaleido, **exactly 0 otherwise**) and read only inside the comp's `m==1` branch (L107). The warp never reads it. So outside kaleido, q13 is a free channel; the warp gates on `q29` to be safe.

New cross-frame state (eased field amounts, cooldown timers, ripple envelope) lives in the **file closure** next to `corridorAmt`/`valleyAmt` (L880–917) — q-vars only where a shader must read the value.

---

## 3. Implementation plan

**Slot budget: 0 custom waves, 0 custom shapes.** Everything in this cluster is frame_eqs JS + the warp shader. (No dots, no beads, no new geometry — the constraints on wave/shape slots don't bite here.)

**Protocol (risk 4):** one step = one commit = one live user verification before the next step starts. Do not batch. Each step has its own gate variable so `git revert` of any single commit restores the prior behaviour exactly.

**Placement:** steps 1–5 insert a "FIELD" block in `frame()` **after the pivot block (L987) and before the FOLD block (L989)** — so the corridor/valley couplings (L1101–1134), which run later and ease `t.q18/t.q15` toward their own targets, still win when active. The ripple write (step 7) must come **after** L991 (which zeroes q13 outside kaleido).

**Field exclusivity/priority:** gates can co-occur (e.g. motif 14 mountains + bgMode 4 bars → freeze AND down-sag). Rule: **freeze wins** — apply down-sag first, then scale it by `(1 − freezeAmt)`; corridor/valley (existing) override everything as today. State this in code comments.

### Step 0 — debug pins for closure state (no visual change)

`__ALC_FORCE` only overrides `t.*` AFTER frame() computes (L1136–1140) — fine for q-var pins, useless for closure behaviours (rest, ripple firing). Add at the TOP of `frame()` (right after `var time…`, ~L931):

```js
// __DEBUG__ closure pins (production no-op — __ALC_FORCE is never set live)
var F0 = (typeof window !== "undefined" && window.__ALC_FORCE) || null;
if (F0 && F0.__rest !== undefined) { resting = F0.__rest > 0.5; breathNext = time + 999; }
if (F0 && F0.__ripple) { rippleT0 = time; F0.__ripple = 0; } // one-shot fire (step 7)
```

Guard each `F0.__x` read so absent keys change nothing. Commit together with step 1 (it is step 1's test harness) or as its own tiny commit.

### Step 1 — REST the pan during rest beats (C1, smallest safe slice)

*Evidence:* refs show near-still rests 4–10s (motion-study measured; B6: all 8 reports document near-empty rests); v7's pan "never rests" (catalog §3).
*Target:* the pan block L977–981.
*Change (2 lines):*

```js
// REST field (C1): the refs go near-still during rest beats — the pan eases out with restAmt.
panMag += ((0.0045 * (1 - 0.9 * restAmt)) - panMag) * Math.min(1, dt * 0.8);
```

(replace the existing L978 target `0.0045`). Also scale the constant q19 bias by `(1 - 0.9 * restAmt)`. While touching L981, fix the wrong comment: `−0.0012` is a **downward** stream per the measured sign map.
*Gate:* `restAmt` (existing, L1057) — no new state.
*Composes:* corridor already suppresses rests (L1049 `corridorAmt < 0.1`), so no conflict.
*Revert:* single-line revert restores constant pan.

### Step 2 — FREEZE field under the mountains motif (C2 field #1 — the load-bearing one)

*Evidence:* r0 terrain (peaks persist ≥3.5s, NO translation, "high decay, low blur during terrain phase — q-gated blur"); h2 §3.1 (stamps freeze where drawn); p3 (near-still low-decay, ghosts 5–8s). B3/D11/A3/C10 all presuppose this field.
*Target:* new closure var `freezeAmt` (declare next to `valleyAmt`, ~L889); FIELD block after L987.
*Change:*

```js
// FREEZE field (C2): terrain scenes hold stamps crisp — blur nearly off, longer decay, pan damped.
freezeAmt += ((mCur === 14 ? 1 : 0) - freezeAmt) * Math.min(1, dt * 0.6);
if (freezeAmt > 0.01) {
  t.q28 += (0.08 - t.q28) * freezeAmt;   // blur ~off → stamps stay crisp (the q-gated blur)
  t.q1  += (0.974 - t.q1) * freezeAmt;   // hold ghosts ~4-8s (h2) — NOT 1.0 (must still decay)
  t.q15 += (0.0 - t.q15) * freezeAmt;    // no growth
  t.q18 *= 1 - 0.92 * freezeAmt;         // near-still (r0: peaks do NOT translate)
  t.q19 *= 1 - 0.92 * freezeAmt;
  t.q16 *= 1 - 0.8 * freezeAmt;          // no roll — frozen peaks must not smear rotationally
}
```

Note `mCur` is available from L995. Gate initially to motif 14 ONLY (mountains — the scene r0 measured). B3's doc may later widen the gate; not our call here.
*(6) guard:* decay 0.974 with blur 0.08 keeps additive deposits longer — verify no white pileup (acceptance below). Do NOT raise `trail·1.28` in comp (L200) or `q31`.
*Revert:* delete the block + the var.

### Step 3 — DOWN-SAG field under bars/bands scenes (C2 field #2)

*Evidence:* p1 §3.1 down-bias "in most scenes" — rope cascade t=112.8, stems t=116 (stems stand on the BARS bg, p1 S15/S16); h2 down-left drift ≤2–3%/s (= 0.0003–0.0005 UV/frame) and "downward sink under the S14 totem"; p0 §3.2 downward sag in S2.
*Target:* new closure var `sagAmt`; FIELD block (after the freeze block).
*Change:*

```js
// DOWN-SAG field (C2): bars/bands scenes stream the trail gently DOWNWARD (refs: 2-3%/s),
// replacing the random snap-dir while active. Sign map (measured): -q19 streams DOWN.
sagAmt += (((bgMode === 4 || bgMode === 6) ? 1 : 0) - sagAmt) * Math.min(1, dt * 0.6);
sagAmt *= 1 - freezeAmt; // freeze wins
if (sagAmt > 0.01) {
  t.q18 += (0.0004 * Math.sin(time * 0.13) - t.q18) * sagAmt; // trace of lateral waviness (p2 field d)
  t.q19 += (-0.0022 - t.q19) * sagAmt;                        // ≈0.13 UV/s downward
}
```

*Composes:* runs before corridor (which would override q18 anyway); rest scaling from step 1 already applied to panMag upstream — multiply the sag targets by `(1 - 0.9 * restAmt)` too so rests stay still.
*Revert:* delete block.

### Step 4 — RADIAL-OUT field under radial filament motifs (C2 field #3)

*Evidence:* p1 §3.1 RADIAL-OUT in the moth scene (fans stream outward t=83–89, streaming 2–4%/s per h1 M6); h0 M11 anemone filaments radiate to the frame edges; A17 depends on this.
*Target:* new closure var `radialAmt`; FIELD block.
*Change:*

```js
// RADIAL-OUT field (C2): urchin/fluff scenes stream the trail outward from the motif.
// CAP q15 — a big magnify is the rejected "spiky-burst over-fill" (see L971-972).
radialAmt += (((mCur === 2 || mCur === 16) ? 1 : 0) - radialAmt) * Math.min(1, dt * 0.5);
if (radialAmt > 0.01) {
  t.q15 += (0.006 - t.q15) * radialAmt;          // outward growth ≈2-4%/s — NEVER above 0.008
  t.q20 += (t.q2 - t.q20) * 0.7 * radialAmt;     // hub = the motif centre (streaming is motif-centred)
  t.q27 += (t.q3 - t.q27) * 0.7 * radialAmt;
  t.q18 *= 1 - 0.8 * radialAmt;                  // damp the pan — outward flow IS the motion
  t.q19 *= 1 - 0.8 * radialAmt;
}
```

*Composes:* valley (L1131) still eases q15 to 0.012 when active — motif 12 ≠ 2/16 so no overlap. Pivot re-targets revert automatically when radialAmt decays (the Lissajous write at L986–987 runs first each frame).
*Revert:* delete block.

### Step 5 — SWIRL-EYE field under the vortex motif (C2 field #4)

*Evidence:* p3 §3.1 "rotation about a movable eye at (33%, 8%)… the black eye is just the un-fed center of rotation"; p0 §3.2 rotation-smear (S6, fan scene).
*Target:* new closure var `eyeAmt` + a slowly-wandering eye position (`eyeX/eyeY` closure vars, re-rolled per activation); FIELD block. Today swirl fires only under the tunnel bg (L1099) — this adds the motif-8 case.
*Change:*

```js
// SWIRL-EYE field (C2): vortex scenes rotate the trail about an off-centre eye (p3: (33%,8%)).
eyeAmt += ((mCur === 8 ? 1 : 0) - eyeAmt) * Math.min(1, dt * 0.5);
if (eyeAmt > 0.01) {
  t.q17 += (0.07 - t.q17) * eyeAmt;              // strong local swirl (tunnel uses 0.04)
  t.q20 += (eyeX - t.q20) * 0.7 * eyeAmt;        // pivot → the eye
  t.q27 += (eyeY - t.q27) * 0.7 * eyeAmt;
  t.q18 *= 1 - 0.85 * eyeAmt; t.q19 *= 1 - 0.85 * eyeAmt;
}
```

Re-roll `eyeX = 0.25 + 0.5*Math.random(); eyeY = 0.15 + 0.3*Math.random();` when `eyeAmt` crosses upward through ~0.02 (track with a bool). Keep q17 ≤ ~0.09 — above that the 1/r falloff (L51) whips the centre.
*Revert:* delete block + vars.

### Step 6 — SHEAR warp term (the first of two GLSL edits; ships DORMANT)

*Evidence:* p2 §3.2(c) sawtooth x-shear as f(y), "orbs shearing into chevrons within ~1s of landing"; p1 S-warp wavy shear; p0 vertical stretch. C4 (chevron shear terrain — another doc) is the production consumer; this step builds + proves the capability with **no production writer**, so it is zero-visual-risk.
*Target A — free q12 (2 lines):*
- L841: `if ((m === 0 || m === 2) && (a.q12 || 1) < 1.5) {` → `if ((m === 0 || m === 2) && Math.abs((a.q29 || 0) - 1.0) > 0.5) {` (squash gated to "not kaleido bg" — same semantics, q29 IS the fold source per L990's own condition).
- L990: `t.q12 = bgMode === 1 ? 4 : 1;` → `t.q12 = 0; // freed: shear amount (C2/C4); fold-on is implied by q29==1`. Update the header comment L30.
*Target B — warp term* (in `WARP_V7`, insert after the `suv` pan line L58, before the blur):

```glsl
suv.x += q12 * 0.03 * (abs(fract(suv.y * 3.0 + time * 0.05) * 2.0 - 1.0) * 2.0 - 1.0);
```

(a triangle wave in y — sawtooth x-shear as f(y); `q12` in −1..1, 0 = off. Tooth count 3 ≈ p2's ~40px teeth at 480p scaled to bands.)
*Verify the freeing:* pin `q29=1, q30=0` — the anemone must be round (no squash) under kaleido, exactly as before; pin `q29=0, q30=0` — squash present. Then pin `q12=0.5` — chevron-folded trails.
*Revert:* revert the commit; nothing else writes q12.

### Step 7 — C8 radial ripple finale event (second GLSL edit + a rare event writer)

*Evidence:* r0 2.5 (§1 above): hub-centred concentric chevron interference bands, wavelength ≈5% of frame height, sweeping the corners for ~1s during the starburst climax. Observed ONCE in 19s — keep it rare.
*Target A — warp term* (same insertion region, after the roll/swirl rotate L53, using the existing `pr`/`pd`):

```glsl
float rip = (abs(q29 - 1.0) < 0.5) ? 0.0 : q13;  // q13 belongs to the kaleido fold when q29==1
pd *= 1.0 + rip * 0.018 * sin(pr * 125.6 - time * 30.0);
```

(λ = 2π/125.6 ≈ 0.05 UV ≈ the measured ~25px/480px; the `time` term sweeps the bands outward through the corners. Radial modulation of `pd` about the pivot = hub-centred, and the pivot is eased to the motif centre during the event, below.)
*Target B — event writer* (closure vars `rippleT0 = -99`, cooldown; in `frame()` AFTER the fold block L989–991 so it overwrites q13's 0 only outside kaleido):

```js
// C8 radial ripple finale: a RARE ~1s hub-centred buffer ripple on a hard beat (r0 18.6-19.6).
if (f > 0.95 && bgMode !== 1 && time - rippleT0 > 75 && Math.random() < 0.25) rippleT0 = time;
var rl = (time - rippleT0) / 1.1;
if (rl >= 0 && rl < 1 && bgMode !== 1) {
  t.q13 = 0.9 * Math.sin(rl * 3.14159);          // attack+release inside ~1.1s
  t.q20 += (t.q2 - t.q20) * 0.8;                 // hub = the motif centre (r0: hub-centred)
  t.q27 += (t.q3 - t.q27) * 0.8;
}
```

Cooldown ≥75s + probability keeps it ≈ once per few minutes (faithful to one-sighting evidence; risk 5). Never fires under kaleido (q13 conflict + never observed there).
*Revert:* revert the commit; q13 outside kaleido returns to constant 0.

**Optional step 8 (do NOT build without a fresh user ask):** lowering the default panMag toward the refs' 0.08 UV/s drift with occasional held faster streams re-approaches the rejected CAM_REG regime director. Park it; steps 1–5 may already land the feel.

---

## 4. Verification recipe

**Static checks (before every reload/render):**

```bash
cd /Users/sujitk/projects/personal/ytmusic-wmp-visualizer
for f in presets/*.js viz.js content.js; do node --check "$f" || break; done
npm test   # tools/test.mjs — concats kit+dance+alchemy-v7+ambience+battery into one scope, builds every preset, runs each frame_eqs
```

GLSL (steps 6–7) cannot compile in Node — use the self-render's console: the `[WMP-viz shader]` hook prints driver errors with numbered source. A clean render with visible trails = shaders linked. **Do not declare `ang`/`rad` locals in shader_body** (reserved — silent link failure).

**Self-render with pinning:** the old scratchpad `pinrender.mjs` is gone; recreate it once:
copy `tools/selfrender.mjs` to the scratchpad as `pinrender.mjs`, add near the top `const PIN = process.env.PIN || "";`, and right after the `pump` Runtime.evaluate (~L146) add:

```js
if (PIN) await send("Runtime.evaluate", { expression: "window.__ALC_FORCE=" + PIN, returnByValue: true });
```

Run: `PIN='{"q30":14}' node pinrender.mjs "Alchemy (Pastel)" "6,10"` → shots in `/tmp/alc-render/`. Caveat: q-var pins land AFTER frame() computes, so JS scene couplings still run on unpinned values — pin the *input* (`q30`/`q29` steer the point fns + shaders directly; `__rest`/`__ripple` steer the closure via step 0's hooks). Take **pairs of shots ≥3–4s apart** — every acceptance check below is about what the trail does *between* two shots.

**Per-step acceptance (each visible in a screenshot pair):**

1. **Rest-pan:** `PIN='{"__rest":1}'`, shots at 6s and 10s. The trail smear behind the motif must NOT elongate in one direction between shots; deposits sit locally around their emitters. Control: `{"__rest":0}` shows the familiar directional drag. Also: fewer edge-clamp streaks at the frame borders.
2. **Freeze:** `PIN='{"q30":14}'`, shots at 6s and 10s. Ridge deposits visible in shot 1 are STILL visible in shot 2 — same x/y position (not translated), still ridge-shaped (crisp edges, not diffused to haze). Brightest trail pixel stays below blown-white (spot-check: no flat #FFF regions — Pastel must stay muted). Control with the step reverted: ridges gone/diffused within ~1.5s.
3. **Down-sag:** `PIN='{"q29":4}'` (bars) shots 4s apart: trail ghosts hang BELOW their emitters (orb comet-trails point downward), bars themselves static. Same for `q29:6`.
4. **Radial-out:** `PIN='{"q30":2}'` (urchin): between shots, filament ghosts have moved OUTWARD from the motif centre (compare a ghost ring's radius); corners gain outward-streaming residue; the live urchin itself is the SAME size in both shots (emitter pinned — only trail streams).
5. **Swirl-eye:** `PIN='{"q30":8}'`: trail field coils around one off-centre point; a darker un-fed "eye" hole forms there (p3's signature); the eye is NOT at frame centre.
6. **Shear:** `PIN='{"q12":0.5}'`: straight vertical elements' trails read as chevron zigzags (3 teeth down the frame); `{"q12":0}` renders identical to pre-step-6 (dormant). Also `{"q29":1,"q30":0}`: anemone un-squashed under kaleido (freeing-edit regression check).
7. **Ripple:** `PIN='{"__ripple":1,"q29":0}'` with shots at the fire time +0.3s/+0.7s: concentric ring-shaped distortion bands (≈5% frame wavelength ≈ 40px at 800px height) visible across the frame around the motif hub, gone by +1.5s. Never any ripple with `q29:1`.

**After every step:** one LIVE user verification (extension reload, Shift+V) before the next step — synthetic audio ≠ real music, and this is rejected-rework territory.

---

## 5. Risks & rollback

- **(4) — the dominant risk.** Commit `7e93259` (CAM_REG camera-regime director + world-follow + wrap + kaleido flow) was A/B'd and **REJECTED** (`9ba675e`); it lives on only as the "Alchemy Motion" variants in `presets/alchemy-motion.js`. What made it wrong (per the reconciled C1): it **moved the emitters** (world-follow) — the original never does — and applied motion regimes globally/uniformly. This plan is designed around that lesson: emitters stay pinned in every step, no wrap, no global regime picker, each field is scene-gated and lands alone. If the user reacts badly to ANY step, revert that one commit and stop — do not iterate speculatively on top (memory `dont-over-iterate-speculatively`: one change, verify, check in).
- **Rejected things deliberately NOT touched:** world-follow/emitter travel; edge wrap; the bead/dot accessories; perspective floor grids (3); reflective water (2); removing the snap-pan (user prefers the classic WITH its pan); the valley dolly (D14 — flagged unsupported, but it is shipped/user-approved-by-silence; its removal needs its own confirmation, out of scope here).
- **(6) freeze vs muted Pastel:** longer-lived crisp deposits raise accumulation risk. Mitigations: decay ≤0.974, blur floor 0.08 (not 0), unchanged comp gains, acceptance check 2's white-pixel spot check. If a live look shows milkiness, lower q1 toward 0.968 before touching anything else.
- **Magnify cap:** q15 ≥ ~0.01 outside the valley scene reproduces the rejected "spiky-burst over-fill" (L971–972). Radial-out is capped at 0.006–0.008 and motif-gated.
- **q12/q13 repurposing:** the only cross-file risk. q12 is read nowhere but L841 (verified by grep across `presets/*.js`, `viz.js`); q13 nowhere but comp L107 (kaleido branch). The q29-gates make both safe; acceptance 6's regression check covers the L841 edit.
- **One-commit-per-step plan** (suggested messages):
  1. `alchemy: rest the trail-pan during rest beats (C1 step 1) + __ALC_FORCE closure pins`
  2. `alchemy: FREEZE displacement field under waveform-mountains (C2 field 1)`
  3. `alchemy: down-sag trail field under bars/bands scenes (C2 field 2)`
  4. `alchemy: radial-out trail streaming under urchin/fluff (C2 field 3)`
  5. `alchemy: swirl-eye trail rotation under vortex motif (C2 field 4)`
  6. `alchemy: sawtooth shear warp term (dormant, q12 freed) (C2/C4 capability)`
  7. `alchemy: rare radial-ripple finale warp event (C8)`

  Commit BEFORE starting (clean tree) — reverting uncommitted shader work has burned this project before.

---

## 6. Acceptance criteria (cluster "done" vs the references)

- [ ] Emitters (motif centre, orb anchors, accessory pivots) never translate with any field, in any scene — only the trail buffer streams (C1; already true today, preserved through all 7 steps).
- [ ] During rest beats the trail field goes near-still for the rest's duration (refs: 4–10s near-still rests), and resumes the familiar snap-pan after (C1).
- [ ] Mountains scene: stamped ridges hold crisp, untranslated, ≥3s (r0 ≥3.5s; h2 4–8s), visibly enabling accumulate-then-freeze terrain (unblocks B3/D11) — with zero white blowout in Pastel (C2+6).
- [ ] Bars/bands scenes: trail residue visibly streams downward at a gentle rate (h2: ≤2–3%/s), not in random snap directions (C2).
- [ ] Urchin/fluff scenes: trail residue streams outward from the motif hub at ~2–4%/s, filling corners, while the live motif stays constant-size (C2, unblocks A17).
- [ ] Vortex scenes: the trail coils around an off-centre eye with a dark un-fed hole (p3 signature) (C2).
- [ ] The shear term compiles, is pin-testable (`q12`), and is invisible at q12=0 (capability handed to C4's doc) (C2).
- [ ] The radial ripple fires rarely (cooldown ≥75s, never under kaleido), lasts ~1s, shows hub-centred concentric chevron bands at ≈5% frame wavelength sweeping the corners (C8).
- [ ] Every step passed `npm test`, a pinned self-render pair, and a LIVE user look; each landed as its own revertible commit; no step moved an emitter, added wrap, or introduced a global camera regime.
