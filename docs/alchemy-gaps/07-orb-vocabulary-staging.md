# Doc 07 — Orb anatomy vocabulary, balloon events, staging & columns

> **★ LANDED 2026-07-09 (7 commits a8c4a89→8884834; confirmation questions were pre-answered as
> README Q10/Q11/Q12 = the recommended options).** Deviations from the plan below:
> **Step 6 (milk-fill) landed WITH step 4** — it's gated to the kind-1 anatomy descriptor, so a
> revert of anatomy necessarily takes it. **Step 7 (bead-chain taper) SKIPPED** — superseded: the
> user pulled motif 11 from MOTIF_BAG on 2026-07-09 (reads as a dotted stick, answered-Q8
> territory); do not re-polish it without a fresh ask. The doc's `fillHueLag` descriptor field was
> dropped (doc 05's `fillHue` lag mechanism is now always-on and covers it). The column got a
> slight per-seg stalk CURVE (the 480p 14–23s stalks bend — frame-verified before coding) and the
> mushroom's parity split needed BOTH seg ends hidden wide (u<0.12 / u>0.94) or connector lines
> draw between the two figures. Balloon radius scales live in closure (`radScaleA/B`), NOT in q7 —
> so accessory rings that must ride the balloon multiply by the host's radScale explicitly.
> **Un-judged live:** everything here awaits the user's next look; per-step pins in §4 still work
> (`_balloon`/`_stage`/`_anatA`/`_anatB`/`_acc3`/`_mushroom` via the underscore closure-pin
> channel added to `__ALC_FORCE`).
>
> **★ TAIL CLOSED 2026-07-10 night (commits 751e158 + ee23aab).** The telescope column was
> REDESIGNED FILLED/GLASSY after the hollow-outline pull (154ee6c): each bead is now a tight
> 4-turn SPIRAL whose ~6px pitch fuses under the 2.5px comp dilate into a solid glassy disc
> (milky-bright core → darker saturated rim, tip bead still brightest) — zero extra slots, same
> waves[3] branch. The column stays OUT of the natural accessory bag (the user pulled all
> orb-anchored ring accessories); it exists for the A18 mushroom + the `_acc3` pin. **A18 is
> UN-PINNED:** a self-contained natural roll (calm energy on fluid/wash, no rail/kaleido, ≥90s
> apart, λ≈1/45s eligible, never before t=45) SUMMONS its own filled-bead column at event start
> — the old gate needed a natural type-2 roll that could no longer happen. Verified via
> `_mushroom` pin: two mirror figures, cap orbs atop rising bead-trail bodies.

**Matrix items:** A16 (orb anatomy vocabulary, P1) · D2 (balloon events + base size, P1) · D15 (posts/rail staging, P1) · A4 (ring-stack / telescope / cone columns, P1) · D9 (bead-chain taper + attachment, P3) · A18 (mushroom figures, P3) · **Priority:** P1 core (A16/D2/D15/A4), P3 tail (D9/A18) · **Risk flags:** (1) budget routing — all 4 shape slots committed, ring-only variants must route via waves; filled beads were user-rejected before · (4) prior-revert territory — D2's base-size fix was reverted with the rejected motion rework; D15's snake wobble shipped with the user's eyes in 9b5ea11 · **Confirmation needed:** **yes** —
1. **A4 columns:** filled *glassy-sphere* bead stacks (p0 O6) need a filled-shape renderer, and all 4 shape slots are taken by the 2 orbs × (fill + halo). The plan ships columns as **hollow-RING stacks** drawn in the often-idle waves[3] slot (ring outlines only — faithful to p1 O7/p3 D-ORB.4, which are ring/disc *outlines*). OK to ship ring-only columns, or would you rather sacrifice orb B's additive halo slot to get filled glassy beads?
2. **D15 staging:** the refs measure orbs as *stationary posts* with occasional slow slides; our continuous snake-wobble orbit (shipped 9b5ea11 with your approval) is a v7 invention that prevents the "anchor" reading. Confirm you're OK replacing the orbs' S-curve comet snaking with parked posts + slides (the central motif keeps painting its watercolour trail — only the two orbs change).
3. **D2 base size:** re-land the measured base radius 0.06 → 0.048 (it was reverted only as part of the rejected motion rework, never judged on its own)? Will land as its own one-line commit so you can judge it live.

Cross-references: the **persistent rail chord** that D15's "slide-along-rail" presupposes is spec'd in the tether-lifecycle cluster (D1/A5 doc); this doc implements the *staging* (posts, slides, re-casts), which works standalone and hooks the rail for free because the rail reads the same orb q-vars. The per-event **ink snap** shared by orbs+tether is B1 (scheduler cluster). Trail-advection ("old rings enlarge as they age") is C2 territory — this doc draws columns live and only *benefits* from C2 later.

---

## 1. Reference behaviour (what the original does)

General mechanism (consistent across all reports): **orbs are EMITTERS** — crisp discs/rings redrawn every frame at (mostly) fixed posts; everything soft around them (halos, deposits, ghost rings, comet smears) is their integrated **feedback trail**. Orb *identity* (which anatomy) re-rolls **per appearance**, and ink (hue) snaps per event, shared with the tether.

### A16 — Orb anatomy vocabulary (≥8 distinct anatomies, both videos)
- **Milky ringed eyelet** — p0 O1 (t=1.5): 38–45 px, milky lavender fill, 2 px darker ring + a **smaller inner ring offset up-left** (the "eyelet"), orange halo puff deposit. p1 O6: eyelet bead ~4% (dark core + single bright ring) on a mini ring-stack stalk (t=81.9). p2 2.11.4 "bullseye eyelet": core disc ~50 px + 2–3 concentric 1–2 px rings, largest ~90 px, pitch ~10 px, sitting ON the rail/ridge as a diagonal pair, separation ~40% frame.
- **Giant translucent disc / bullseye disc** — p0 O5 (t=18.75, 24.5, 52.25, 56.75): up to 140 px (**22% of frame width**), milky, 2 px dark rim + inner offset ring; colour snaps per ~0.5–1 s (mauve→chartreuse→yellow→green→pink); **balloons in AT full size** then shrinks to become a bead-stack cap within ~1.5 s. p1 O9 "soap-bubble balloon": 20–25% dia translucent circle, thin dark ring, milky sheen, drifts ~1.5 s then deflates.
- **Ringless glow disc / giant sun** — p1 O1: soft gaussian, **no ring**; giant 21–23% peach suns (#bb7a5b, t=72.3); small 6% teal / magenta stamps. r0 2.7.6: flat chartreuse soft disc 15–18%, appears abruptly.
- **Hollow ring** — p0 O9 (t=47.5–57): thin pink/white outline circle 55–70 px, near-empty interior except a lagging pigment smudge core; mirrored 4× by the kaleido; **balloons to 130–160 px on hits then deflates in ~0.5 s**. p1 O4: empty circle 6–11%, 1.5–2 px gold stroke — *tethers land inside them*. p3 D-ORB.6, r0 2.7.3 same.
- **Multi-ring bullseye (3–6 rings)** — p1 O5: 3–6 evenly spaced thin rings, outer 8–20% (6-ring 17% at t=97.6; 3-ring 20% at t=106.8). p1 O10 rose-bullseye: magenta concentric rings around a violet core #7b278f, 9–13% (pairs at 84.0, 88.25). r0 2.7.8: bright core 25–28 px + milky ring + gold ring (~55 px) + soft splat halo (~90 px); cores colour-snap white→red→cyan.
- **Dark ECLIPSE orb** — p0 O10 (t=49.75): **170 px near-black teal `#092525` disc, crisp red 2 px rim — DARKER than the bg (subtractive)**; pairs opposed across centre, each tethered to the medallion. Balloons in at ~20% frame then settles to ~7% in ~1 s. p3 D-ORB.3 "dark spiral/vinyl": 5–7 dark concentric rings ~90–100 px, near-black on light ground.
- **Pearl** — p0 O8 (t=48): 25–32 px milky white gradient sphere, thin red/pink ring, drifts slowly at mirrored positions.
- **Rosette / gear-flower** — h0 O-catalog: rosette gear-flower 110–120 px (scalloped ring rim).
- **Identity rotates per appearance** — p1 (t=97.6→100.9): endpoint identity rotates 6-ring bullseye → blue ring-stack → two gold bullseyes across consecutive tether casts. Fill hue SNAPS ≤0.25 s, synchronized with partner orb + tether (shared ink); **fill hue can lag the ring hue** (r0: gold fill kept under a new green ring at 9.85).

### D2 — Balloon events, milk-fill, base size
- **Ballistic overshoot, not breathing** — p2 (t=166.58–166.83): the pair inflates dia **50→150 px (≈3×) in ~0.35 s**, translucent periwinkle with bright 1 px rim, cores flash white-yellow, snaps back to ~55 px in ~0.4 s; **the two orbs pulse near-together but with ~0.1 s offset and different maxima**. h0: balloon 2–2.5× with **attack ≤2 frames (~0.03 s)**, settle ~0.5 s (t≈10.1). r0: balloon events 2.5–3× dia in ≤0.25 s, settle 0.8–1.2 s (9.85: 55→135 px). p0 O5: balloons in AT full size then shrinks.
- **Milk-fill (signature)** — r0 #4 (t=13.85): a hollow eyelet ring **balloons 55→~170 px (28% frame h)** leaving the small milky ball inside, dark lens-like interior, **then FILLS with milk white over 0.4–0.6 s** (14.2–14.5) and shrinks back into the coil head.
- **Base size** — motion-study memory: our base radius measured **1.5–2× too big** vs the refs; the 0.048 fix was reverted with the rejected rework (current base back at 0.06). Ref steady-state orbs: small anchors 2–7% (p3 D-ORB.5), typical dumbbell orbs ~7–10% dia; the 17–25% sizes are *events or specific giant anatomies*, not the resting size.

### D15 — Staging: parked posts + slide-along-rail
- **Posts** — h1 S4b (t=86–89): orbs **pinned at ~(2%,87%) and ~(98%,13%) for 3 s+**, persistent BETWEEN tether events (still_88.0 shows no tether mid-gap — the orbs hold alone). p3 D-ORB.5: small anchor ring-orb "holds a fixed post for many seconds" (196–206 pair; wallpaper pair 207–228). p3 §3.3: anchors hold posts through whole scenes, usually on a diagonal or vertical axis, separation 40–70%.
- **Slides** — p2 2.11: the dumbbell pair "sits diagonal, **slides slowly ALONG the rail (~5–10% frame per 2 s)**, swaps size roles; one occasionally dissolves into a wavy splash-flower while the other persists".
- **Re-casts** — p1: diagonal orientation dominant (UL→LR three times: 88.25, 97.6, 112.75), separation 55–78% of frame; "**often one endpoint persists from the previous cast while the other is new**".
- Emitter-vs-trail: the posts are emitters that *do not translate*; comet smears in the refs come from trail slip, not from orbits. Our perpetual snake wobble (S-curve comet trails) is a v7 invention (risk flag 5 in the matrix).

### A4 — Ring-stack / telescope / cone-stack / coil-spring columns (present in EVERY segment of both captures)
- p0 O6 **bead-stack column** (t=14–23): 8–14 stacked glassy spheres (28–35 px) shrinking upward, slightly curved/tilted, orb cap on top; **sways ±5° at ~1 s period**; the "pedestal" for cap orbs — the cap balloons 2–2.5× on hits.
- p0 O7 **snail-cone** (still_19.0): 3–4 glassy discs stacked shrinking into a cone/telescope (**95 px base → 28 px tip**) with dark 2 px rims; reads as a 3D snail shell; appears as swath terminals.
- p1 O7 **telescope**: 4–10 discs tapering along an axis; vertical column form (navy, 31% tall, t=66.3) or corner-diagonal telescope (lavender #8381d9 → jade tips, t=102.9–106); "**extends/retracts along its axis ±8–10%, period 2–3 s**"; the tip disc is a ringed orb that **colour-SNAPS** (lavender→jade); leaves comet disc ghosts when moving.
- p1 O8 **ring-spring**: 5+ stacked hollow gold rings (60–110 px wide) forming a wobbling open beehive on a milky splat mound.
- p3 D-ORB.4 **slinky mechanism**: "orb stamps a ring every few frames; **outward feedback advects+enlarges old rings**" — rings 40→90 px, 4 cones pointing into corners; aged stacks accumulate into nested crescent fans. (So the refs get part of the stack for free from the trail; the *live* part is the ring emitter.)
- r0 2.7.2 **coil-spring**: vertical chain of 8–10 overlapping rings/beads 35–45 px; brightest hollow ring at top; snakes gently.

### D9 — Beaded chain: taper + attachment + persistence
- p1 O3: pearl-taper chain — beads **GROW 3%→9.4% along the chain away from the motif**, 6+ beads, chains at BOTH cocoon ends, **terminal bead gold-ringed**, bead colour snaps blue→gold ≤0.25 s.
- h2 2.17: diagonal beaded chain "lives **BEHIND the dominant motif**, persists ~3 s+, **survives the motif swap**" — an accessory, not its own scene.
- h1 (matrix A8/D9 cross-ref): the general composition rule is elements **threaded ON existing wires/rings** (beads-on-tether at h1 T1@113; beads-on-star-ring at h1 O8).

### A18 — Mushroom figures (rare figure scene, 1080p)
- h2 2.14 (S10, full_170.7): **ring-tube orbs** — 4–6 coiled fine yellow rings forming a short tube ~85 px dia, milky green disc mouth; pair ~265 px apart; **they RISE over ~2 s and become the mushroom caps — same element, continuous**.
- h2 2.15 (S11, full_173.5): cap = oblate bullseye (cyan elliptical core ~65×38 px, dark annulus, magenta ring, cream outer ring ~150×90 px = 12% frame). **Body = stack of stamped fuzzy discs** ~90 px wide × ~120 px tall — *the cap's bob/rise history* (pure trail). Two figures **leaning outward, mirror pair**, separation ~20% frame, height ~35–40%. Caps **colour-snap every ~0.5–0.75 s**: cream→cyan→magenta→yellow→blue (discrete, likely beat-locked).

---

## 2. Current implementation state

All refs verified against `presets/alchemy-v7.js` @ HEAD (4db3368) and `presets/kit.js`.

**Orbs — exactly ONE anatomy, always both layers** (A16 gap):
- `orbShape(qx,qy,hueOff,visVar)` L255-301: 40-gon **filled** disc, non-additive, solid cosine-palette fill on q8+hueOff, radius `s.q7·(1+0.45·be)` (L280), prominent contrast-hue border (hue+0.5, L269-270, L291-297). `orbGlow(...)` L302-337: 40-gon **additive** halo, hue +0.12, radius `q7·(1.7+0.5·be+1.1·puls)` (L325), alpha 0.42→0 gradient. Committed as shapes[0..3] at L1332-1335 (A fill / B fill / A halo / B halo). **Both factories live in the file's IIFE closure** — they can read closure vars directly (this is the key lever: no q-vars needed for anatomy state).
- Fill/border/halo parameters are constants — no per-appearance identity, no hollow/ringless/dark/multi-ring forms reachable.

**Pulse & size** (D2 gap): `t.q7 = (0.06 + 0.02·max(0,bassA−1))·(1 + 0.85·pulse)` L1039-1041 — a *continuous smoothed breathing*, one shared envelope for both orbs. `pulse` attack 12/s / release 2.6/s (L939). Corridor scales q7 ×(1+0.4·co) at L1117. **No shader reads q7** (grep: only L280/L325 shapes + L1041/L1117 frame) — per-orb radii can safely move to the closure.

**Staging** (D15 gap): L1025-1038 — orbs orbit continuously on `axis = time·0.05`, separation 0.3±0.06, plus fast incommensurate **snake wobble** `snA/snB` (periods ~2.6 s/1.5 s, amp 0.03/0.015, comment L1028-1032) painting S-curve comet trails. Visibility: orb A near-persistent `q25` (comeGo, L1023), orb B comes & goes `q14` (L1024, forced down in rests L1059). Corridor overrides positions by lerp at L1119-1122 (works with any upstream q21..q24 — keep).

**waves[3]** L1288-1331: corridor ring-dot row ONLY (gate `q29==3` at L1311-1314); 80 samples, `usedots:1`, additive. **Idle 14/15 of bg weight** (BG_BAG L920) — this is the dormant capacity the ring anatomies and columns route through. The old bead-row accessory was removed here (note L1292-1297, commit bad7755): dots render ~2 px fixed; overlapping fat ring-beads marching along a rail read as an ugly caterpillar; **no filled-shape budget exists**.

**Mode 11 beaded chain** (D9): `fBeadChain` L657-683 — 9 equal ring-beads (r 0.014, central eye ×1.7) on a straight line through the motif centre, rotating q9·0.3; bead ring drawn by sweeping `u` around each bead (L672-676), connector hidden (L681). MOTIF_BAG weight 1/25 (L923-925). Ring rendering shipped and survived (9b5ea11) — keep rings, never fill.

**Tether** `fTether` L852-878 reads orb posts q21..q24; gating L1279-1286 (both-orbs × beat flash, persistent in corridor). Any staging change composes for free.

**Directors**: closure state L880-928; beat flash `f` + smoothed `pulse` L937-939; hue snaps (`hueStep`) L951-962; rest system L1044-1059; accessory director L1063-1096; debug hook `window.__ALC_FORCE` L1136-1140 (copies keys onto `t` — cannot reach closure state yet; extended in step 0 below).

**Kit factories relevant here** (use, don't re-derive): `alcOrbTarget(qxVar,qyVar,n,colorize)` kit L2168-2196 — a **wave-based n-ring concentric bullseye** anchored to q-var coords, radius `q7·(0.65+k·0.5)`, outermost ring waveform-accented. This is exactly the A16 multi-ring bullseye — call it. `alcOrbGradBlob` (kit L2116) / `alcOrb` (kit L1452) / `alcOrbRow` (kit L1522) are shape-based (no free shape slots) or wrong-shaped for these items; not used. No kit factory exists for tapered ring columns (`alcOrbDotColumns` kit L2277 is dots — 2 px, unusable) — `fColumn` below is genuinely new.

**Reusable:** orbShape/orbGlow bodies (parameterize, don't replace); waves[3] slot + its corridor branch; fBeadChain's discrete-ring renderer; `makePicker`/comeGo/beat/hueStep machinery; `alcOrbTarget`.
**Absent:** anatomy identity, ballistic balloon envelope, milk-fill, posts/slides, columns, mushroom event.
**Deviates:** continuous orbit + snake wobble (v7 invention), continuous breathing pulse, base size 0.06.

---

## 3. Implementation plan

**Slot budget after this doc (explicit):**

| slot | before | after |
|---|---|---|
| waves[0] | central motif | unchanged (mode 11 gets taper/attach tweak in step 7) |
| waves[1] | star-net companion / accessory | unchanged |
| waves[2] | tether | unchanged |
| waves[3] | corridor ring-dot row only | **multiplexer**: corridor row (priority, unchanged) → else ORB RING-ACCESSORY (bullseye / column / rosette / eyelet-inner-ring / off) |
| shapes[0..3] | orb A/B fill + A/B halo | same 4 slots, **parameterized per appearance** (anatomy descriptors) |

No new wave/shape slots. All new cross-frame state lives in the **file closure** (all 32 q-vars are taken; shapes/waves point fns share the closure scope so no q-var is needed — shaders read nothing new).

### Step 0 — debug-hook extension (prerequisite, tiny)
Target: the `__ALC_FORCE` block L1136-1140. New closure state can't be pinned through q-vars, so: skip underscore keys in the q-copy loop and route them to closure state:
```js
if (typeof window !== "undefined" && window.__ALC_FORCE) {
  var F = window.__ALC_FORCE;
  for (var fk in F) { if (fk.charAt(0) === "_") continue; t[fk] = F[fk]; }
  if (F._anatA !== undefined) ANAT[0] = mkAnat(F._anatA);   // step 4
  if (F._anatB !== undefined) ANAT[1] = mkAnat(F._anatB);
  if (F._acc3 !== undefined) acc3 = mkAcc3(F._acc3);         // step 5
  if (F._balloon && time - balloonT0A > 3) fireBalloon(time); // step 1 (re-fires every 3s)
  if (F._stage !== undefined) stgForce = F._stage;           // step 3: "hold" | "slide"
  if (F._mushroom && mushT0 < 0) mushT0 = time;              // step 8
}
```
Production no-op (window.__ALC_FORCE never set live). Commit with step 1.

### Step 1 — D2a: ballistic balloon EVENTS + per-orb desync (smallest shippable slice)
Target: frame() L1039-1041 + new closure vars + orbShape/orbGlow radius lines L280/L325.
- Closure: `var balloonT0A=-9, balloonT0B=-9, balloonMagA=1, balloonMagB=1, balloonNext=-9, radScaleA=1, radScaleB=1;` and
```js
function fireBalloon(time) {
  balloonT0A = time;
  balloonT0B = time + 0.06 + 0.08 * Math.random();      // ~0.1s offset (p2)
  balloonMagA = 1.8 + 1.2 * Math.random();               // peak 1.8-3x
  balloonMagB = 1.8 + 1.2 * Math.random();               // different maxima (p2)
  balloonNext = time + 2 + 3 * Math.random();            // rate limit
}
function ballEnv(age, mag) {                             // overshoot-and-settle
  if (age < 0) return 1;
  var atk = 0.12;                                        // refs: 0.03-0.35s attack
  if (age < atk) { var u = age / atk; return 1 + (mag - 1) * u * u * (3 - 2 * u); }
  return 1 + (mag - 1) * Math.exp(-(age - atk) / 0.35);  // settle ~0.4-1.2s
}
```
- Trigger in frame(): `if (f > 0.9 && time > balloonNext && Math.random() < 0.6) fireBalloon(time);` (events every ~2–4 s in busy passages, silent in rests — `f` already ≈0 there).
- Replace L1041's `(1 + 0.85·pulse)` with small residual breathing `(1 + 0.10·pulse)` and compute `radScaleA = ballEnv(time - balloonT0A, balloonMagA)`, `radScaleB = ballEnv(time - balloonT0B, balloonMagB)`. q7 stays the shared base (audio + breathing; corridor ×1.4 at L1117 untouched).
- orbShape L280: `s.rad = (s.q7||0.06) * (1 + 0.15*be) * RS;` where `RS = (this-orb radScale)` — pass the orb index as a 5th factory arg and read `idx ? radScaleB : radScaleA` from the closure. Same multiply in orbGlow L325 (drop the `1.1·puls` term there — the halo now balloons with its orb, not with the smoothed pulse).
- Composes with directors: uses the existing beat flash `f`; nothing else changes.
Revert: single commit.

### Step 2 — D2b: base-size re-land (one line, own commit, user eyes)
Target: L1041. `0.06` → `0.048` (the measured value from the motion study, reverted only as part of 9ba675e). Land AFTER step 1 so the user judges resting size with real balloon events present. **Do not** bundle with anything.

### Step 3 — D15: post/slide staging state machine (replaces orbit + snake wobble)
Target: L1025-1038 (delete the axis/sep/snake block), new closure state.
```js
// staging: parked posts + occasional slide + endpoint re-casts (p3 §3.3, h1 S4b, p2 2.11)
var stgAx=0.28, stgAy=0.72, stgBx=0.72, stgBy=0.28,   // posts (diagonal default)
    stgNext=-1, stgSlideT0=-9, stgSlideVX=0, stgSlideVY=0, stgForce="";
```
In frame():
- **Cast** (at `time >= stgNext`, dwell 6–14 s): re-cast **ONE** endpoint (coin flip; prefer B, and only when that orb's visibility is <0.05 so posts never teleport on-screen — orb B's comeGo troughs give free windows; for A, wait for a q25 trough or skip this cycle). New post: diagonal-dominant — pick corner regions so separation lands 0.4–0.7 (refs 40–78%); keep the other endpoint (p1: "one endpoint persists from the previous cast").
- **Slide** (probability ~0.4 per dwell, or when `stgForce==="slide"`): both posts drift along the A→B axis direction at 0.025–0.05 frame/s for ~2 s (p2: 5–10% per 2 s), then hold.
- **Sway**: tiny live sway only — `±0.006·sin(time·1.3)` per post (NOT the 0.03/0.015 snake).
- Write `t.q21..q24` from posts + sway. Corridor override L1119-1122 still lerps over these — untouched. Rest system (q14 suppression L1059) untouched. The tether/rail (waves[2]) reads the same q-vars — when the D1/A5 rail lands, "slide-along-rail" is automatic.
Gate: this is a behaviour swap, one commit; `_stage` pin for verification. **Get confirmation q2 answered before landing** (snake wobble shipped with user's eyes).

### Step 4 — A16a: orb anatomy descriptors (parameterize the existing 4 shapes)
Target: orbShape L255-301, orbGlow L302-337, new closure state. **Identity re-rolls per appearance** — never add slots.
```js
// anatomy bag, weights from evidence frequency:
// 0 classic ringed (dominant) ·1 hollow ring ·2 giant translucent disc ·3 ringless glow/sun
// ·4 pearl ·5 eclipse (rare)
var ANAT_BAG = [0,0,0,0,0,0,1,1,1,2,2,3,3,4,4,5];
function mkAnat(force) {
  var k = force !== undefined ? force : ANAT_BAG[(Math.random()*ANAT_BAG.length)|0];
  return {
    kind: k,
    fill:   k===1 ? 0.0 : k===2 ? 0.28 : 1.0,     // hollow ring / translucent disc
    milk:   k===4 ? 0.85 : k===2 ? 0.4 : 0.0,      // white-mix (pearl/milky)
    dark:   k===5 ? 1 : 0,                          // eclipse: near-black fill
    rim:    k===3 ? 0.0 : 1.0,                      // ringless glow has NO border
    sizeMul:k===2 ? 2.6 : k===3 ? 2.2 : k===4 ? 0.7 : 1.0, // giants ~18-25% dia events
    halo:   (k===1 || k===5) ? 0.0 : k===3 ? 1.6 : 1.0,    // eclipse/hollow: halo off; sun: big
    fillHueLag: Math.random() < 0.3 ? 1 : 0,        // r0: fill hue lags the ring snap
  };
}
var ANAT = [mkAnat(0), mkAnat()];
```
- **Re-roll timing** (the "identity rotates per appearance" grammar): orb B → in frame(), detect `q14` rising through 0.05 (keep `prevQ14v` in closure) → `ANAT[1]=mkAnat()`. Orb A (near-persistent) → on a 10–20 s closure timer AND right after a balloon settles (`time - balloonT0A` in [1.2,1.3]). Corridor (`bgMode===3`) forces both to classic (`kind 0`) — the corridor anchors are the classic look.
- **orbShape edits** (inside frame_eqs, reading `var A = ANAT[idx];`): fill alpha `s.a = A.fill * vis`; white-mix `s.r = mix(s.r, 1, A.milk)` etc.; eclipse: `if (A.dark) { s.r=0.03; s.g=0.10; s.b=0.10; s.a=0.92*vis; border = fixed warm-red (orbCol(0.0,·)), border_a=0.9*vis; }` (p0 O10: near-black teal + crisp red rim); border alphas ×`A.rim`; radius ×`A.sizeMul`. Keep the beat terms — they're the classic anatomy's charm.
- **orbGlow edits**: alpha ×`A.halo`; radius ×`max(1, A.sizeMul*0.8)`. NOTE the halo slot is `additive:1` at build time (baseVals are fixed) — it can only brighten, so it is OFF for hollow/eclipse and the eyelet's *darker inner ring* routes through waves[3] (step 5), not here.
- **Honest limitation (eclipse)**: the comp composites `ground + trail·1.28 + glow·0.6` (L200) — a dark shape darkens the *trail*, not the ground, so the eclipse reads as a dark hole in the trail field with a red rim, genuinely darker than its glowing surround but not darker than raw ground. True darker-than-ground needs comp cooperation + a free q-var (none exist). Accept the approximation; it reads correctly on any scene with visible trail (which is all of them). Do NOT hack the comp for this.
- **Pastel discipline**: all anatomies use the existing `orbCol` palette + existing beat brightness terms — no new saturation. The eclipse is *darker*, the sun uses the halo (already tone-mapped by Reinhard). Nothing here may raise brightness ceilings.
Gate: identity bag — a revert restores `mkAnat(0)` behaviour exactly (classic constants match current values; verify by diffing a `kind 0` render against HEAD).

### Step 5 — A16b + A4: waves[3] ORB RING-ACCESSORY multiplexer (bullseyes, columns, rosette, eyelet ring)
Target: rebuild the waves[3] block L1288-1331. Corridor branch (L1311-1328) kept **verbatim as priority 1**. Change baseVals: `usedots:0, additive:0, samples:512, smoothing:0` (crisp non-additive ring strokes — this is what lets the eyelet's inner ring be *darker*, and avoids the removed-bead-row additive-dot failure). Corridor branch needs dots — it doesn't: it used `usedots:1`; re-check the corridor look after the switch to line-mode and, if the row degrades, draw the corridor dots as tiny rings (radius ~0.004) with the same recede — acceptance check below covers it.
- Closure descriptor, rolled on its own 6–14 s clock AND re-rolled when the host orb's anatomy re-rolls:
```js
// 0 off ·1 bullseye (2-6 rings) ·2 ring-stack/telescope column ·3 rosette ·4 eyelet inner ring
var acc3 = { type:0, orb:0, n:4, taper:0.7, ang:-1.2, extT:2.5, t0:0 };
```
Weights: off 0.30 · bullseye 0.25 · column 0.25 · rosette 0.08 · eyelet 0.12. `orb`: which post it anchors to (q21/q22 vs q23/q24); gate its alpha by that orb's visibility q-var (×`comeGo` value) and by `accVis` (rest fade, closure — already in scope).
- **Bullseye (type 1)**: CALL the kit factory — instantiate once at build time per anchor: `var bullA = alcOrbTarget("q21","q22",6,colAcc), bullB = alcOrbTarget("q23","q24",6,colAcc);` (kit L2168; `colAcc(a,k)` = orbCol on q8 + k·0.06). In point_eqs delegate: `bullX.point_eqs(a)` then post-gate rings ≥ `acc3.n` to alpha 0 (`k = min(floor(a.sample*6),5)` — same split the factory uses). This reuses the kit variant instead of re-deriving (working-agreements rule). Ring radii come from q7 → they balloon with D2 events for free = p0 O9's ballooning hollow rings + r0's giant balloon ring.
- **Column (type 2)** — new point fn (no kit factory draws tapered axial ring stacks):
```js
function fColumn(a) {
  var N = acc3.nCol;                              // 4-9 rings (p1 O7)
  var fk = (a.sample||0)*N, seg = Math.floor(fk), u = fk - seg;
  var ext = 1 + 0.09*Math.sin(6.2832*(a.time - acc3.t0)/acc3.extT); // ±8-10%, T 2-3s
  var sway = 0.09*Math.sin((a.time - acc3.t0)*6.2832/1.0);          // ±5°, ~1s (p0 O6)
  var axA = acc3.ang + sway;
  var d = (seg/(N-1)) * acc3.len * ext;           // len ~0.22-0.3 (refs: up to 31% tall)
  var rr = acc3.r0 * (1 - acc3.taper*seg/(N-1));  // taper 95->28px ≈ 0.7 (p0 O7)
  var bx = ox + Math.cos(axA)*d, by = oy + Math.sin(axA)*d;   // ox,oy = anchor orb post
  var th = u*6.2832;
  // ellipse squashed ALONG the axis -> foreshortened 3D stack read
  var ex = Math.cos(th)*rr, ey = Math.sin(th)*rr*0.38;
  a.x = bx + ex*Math.sin(axA) + ey*Math.cos(axA);
  a.y = by - ex*Math.cos(axA) + ey*Math.sin(axA);
  // hue: q8 family; TIP ring brighter + first to take hue snaps (p1: tip colour-snaps)
  ...orbCol(q8 + seg*0.03) ; tip (seg===N-1): brightness ×1.3;
  if (u < 0.05) a.a = 0;                          // discrete rings, hide connectors
}
```
  The column reads as p0 O6's pedestal when `ang≈-π/2` (rising from under the orb) and as p1 O7's corner telescope when diagonal — roll `ang` from {−90°±8°, toward-nearest-corner}. Rings are OUTLINES (hollow) — the glassy *filled* look, if the user asks for it (confirmation q1), would take orb B's halo slot; do not do it unprompted.
- **Rosette (type 3)**: scalloped ring on the anchor: `R(θ)=q7·1.15·(1+0.12·cos(10θ))` — procedural is allowed here (secondary accessory; the waveform rule binds PRIMARY motifs only — see memory `alc-waveform-rule-scope-and-budget`).
- **Eyelet inner ring (type 4)**: single small ring radius `q7·0.45` offset `(−0.25·q7, −0.25·q7)` from the anchor (p0 O1's up-left inner ring), slightly darker (alpha 0.5, non-additive). Auto-select this type when the host anatomy is classic (kind 0) with p≈0.4 — this completes the "milky ringed eyelet" anatomy.
- Transitions: ease a 0.4 s alpha envelope on type changes (no pops).
- **Why this won't repeat the removed bead-row failure** (bad7755): that failure was additive ring-beads *marching along a rail*, re-stamping into caterpillar tubes. These rings are (a) non-additive, (b) anchored to a stationary post (step 3), (c) few and tapered, (d) not translating — the trail leaves concentric ghosts (the p3 slinky look), not a smeared tube. If it still reads wrong, the type weight → 0 is a one-line kill.

### Step 6 — D2c: milk-fill event (needs steps 1+4)
Target: orbShape + frame(). When a balloon fires on an orb whose anatomy is `hollow ring` (kind 1): at the envelope peak start `milkT0 = time`; in orbShape, `var mf = smoothstep(0,0.5,time-milkT0)` (0.4–0.6 s fill, r0 14.2–14.5) → `s.a = max(A.fill, mf*0.9)·vis` with white-mix `max(A.milk, mf·0.9)`; decay mf back out with the settle. One closure var per orb. Small, gated to (kind===1 && balloon active) — invisible otherwise.

### Step 7 — D9: bead-chain taper + attachment (mode 11 tweak)
Target: `fBeadChain` L657-683 only.
- **Attachment**: chain runs motif-centre → orb A post instead of a free line through centre: `bx = cx + (a.q21-cx)·s01; by = cy + (a.q22-cy)·s01` where `s01 = seg/(B-1)` (replaces the `cos(ang)·t·R` line pair L663-666). The chain now "hangs off the current motif" and lands on an anchor (h2 2.17 reads as an accessory bridging elements).
- **Taper**: `br = 0.006 + 0.014·s01` (beads grow away from the motif, 3→9.4% p1 O3), drop the central-eye ×1.7 (the "eye" was a symmetric-line concept), keep the ×(1+0.4·be) beat pulse and the ring rendering (L672-676) — **rings, never filled** (risk flag: 9b5ea11 shipped rings; bad7755 removed fills).
- **Terminal accent**: last bead (seg===B−1) brightness ×1.3 (p1: terminal bead gold-ringed).
- Background persistence (h2: survives motif swap) is NOT implementable while the chain is a motif mode (waves[0] swaps with q30) — out of scope here; noted for the B4 lifecycle cluster.

### Step 8 — A18: mushroom rise event (P3, last, needs steps 3+5)
Target: frame() + fColumn. A rare scripted event: eligibility = `acc3.type===2` (column) AND `bgMode ∈ {0,5}` (fluid/wash) AND calm energy; roll p≈0.15 at column pick, min 90 s apart (`mushT0` closure timer).
- For ~4 s: force BOTH posts symmetric about centre-x (`stg` override), separation ~0.2 (h2: pair ~20% apart), and **rise**: post y eases from 0.72 → 0.50 over ~2 s (h2: rise over ~2 s to height 35–40%). The column (drawn under each orb — temporarily mirror `fColumn` on both anchors by alternating `seg` parity between orbs, axis tilted outward ±8°) draws the ring-tube; **the trail keeps the rise history = the stacked-disc body** (pure feedback, zero extra slots).
- Caps colour-snap: while the event runs, force a `hueStep += 0.12·(±1)` every 0.6 s (bypass the 1.2 s limiter L959-962 locally) — h2's cream→cyan→magenta→yellow→blue cadence.
- Exit: release the staging override; the bodies decay away naturally.
Gate: entire event behind `mushT0`; `_mushroom` pin. One commit; weight → 0 to kill.

---

## 4. Verification recipe

After EVERY step, before asking for a reload:
```bash
cd /Users/sujitk/projects/personal/ytmusic-wmp-visualizer
node --check presets/alchemy-v7.js && npm test
# concat smoke test (browser-like shared global scope; note the file is alchemy-v7, not "alchemy"):
node -e 'const fs=require("fs"),vm=require("vm");global.window=global;
  const cat=["kit","dance","alchemy-v7","ambience","battery"].map(f=>fs.readFileSync("presets/"+f+".js","utf8")).join("\n;\n");
  vm.runInThisContext(cat);
  let n=0; for(const [k,p] of Object.entries(window.WMP_PRESETS)){ if(p.frame_eqs) p.frame_eqs({time:2,bass:1.3,bass_att:1.1,mid:1,treb:1,treb_att:1}); n++; }
  console.log("ok", n, "presets");'
```
Also run the frame_eqs at time=2 AND time=200 (long-run state machines), and call each shape's `frame_eqs({q7:0.05,q8:0.1,q21:0.3,q22:0.7,q25:1,bass_att:1.2})` once — the anatomy refactor touches those directly.

**Self-render** (no GLSL changed in this doc, so shader pre-checks aren't needed):
```bash
node tools/selfrender.mjs "Alchemy (Pastel)" 3,6,9,12,15
```
**Pinning**: recreate the pinrender variant (per memory `alc-selfrender-harness`): copy `tools/selfrender.mjs` into the scratchpad and, right after the `Page.navigate` + `sleep(2500)` (selfrender.mjs L127-128), add:
```js
await send("Runtime.evaluate", { expression: `window.__ALC_FORCE=${JSON.stringify(FORCE)}` });
```
with `FORCE` taken from argv. Useful pins (step 0 keys): `{"_balloon":1}` · `{"_stage":"slide"}` · `{"_anatA":5,"_anatB":1}` · `{"_acc3":{"type":2,"orb":0}}` · `{"_mushroom":1}` · combine with `{"q29":5}` (flat wash — cleanest ground for judging orbs) and `{"q30":4}` (quiet triangle motif).

**Per-step acceptance checks (each = one screenshot judgment):**
1. **Balloon (step 1)**: pin `_balloon:1, q29:5`; shoot at 0.15 s intervals around a fire (3 shots ~5.0/5.2/5.6 s). PASS: peak orb dia ≈ 2–3× the calm dia (calm ≈ 75 px on the 1280×800 render → peak 150–230 px); the two orbs visibly different sizes in the same frame; by +1 s both back near calm. FAIL: sizes equal, or a smooth swell over >1 s.
2. **Base size (step 2)**: calm frame; orb dia ≈ 0.048·2·800 ≈ **77 px** (~9.6% of height), visibly smaller than HEAD's ~96 px.
3. **Staging (step 3)**: two shots 2 s apart, no pin: orb centres move **<1% frame** (posts); with `_stage:"slide"`: both centres move **5–10% in the SAME direction** along their axis; the trail behind each orb is a short straight smear, **no S-curves**.
4. **Anatomy (step 4)**: `_anatB:1` → orb B is a **ring outline with an empty (trail-coloured) interior**, no halo. `_anatA:5, q29:5` → orb A is a **dark disc clearly darker than everything around it with a warm-red rim**. `_anatA:2` → a translucent disc ~2.6× normal dia with a thin rim through which the ground reads. `_anatA:3` → soft ringless glow, no border ring.
5. **Ring accessory (step 5)**: `_acc3:{type:1}` → 2–6 crisp concentric rings centred on an orb, outer ring ~2–3× the orb dia. `_acc3:{type:2}` → 4–9 **hollow ellipse rings shrinking along one axis** from an orb (taper ~3:1 base:tip); two shots 1.2 s apart show the tip **extended vs retracted (~8–10% length change)**. Corridor regression: pin `q29:3` → the receding row still reads (10 elements near-left → right VP).
6. **Milk-fill (step 6)**: pin `_anatA:1,_balloon:1`; 3 shots ~0.3 s apart: hollow ring → giant ring (~25–29% frame h) → **white-filled disc** → shrinking back.
7. **Bead chain (step 7)**: pin `q30:11`: the chain **connects the motif centre to orb A**, beads visibly GROW toward the orb end (~3× radius ratio), all beads still hollow rings, last bead brightest.
8. **Mushrooms (step 8)**: pin `_mushroom:1, q29:5`; shot mid-event: **two roughly mirror-symmetric vertical figures**, each a ringed cap orb atop a fuzzy vertical trail body, heights ~35–40% frame, caps in different hues across two shots 0.7 s apart.

Colour sanity on every step (memory `alchemy-measured-color-facts`): backgrounds stay dark/dusty; no new element may render flat white at rest — if a screenshot shows a blown highlight, cut that element's alpha, never raise the tone-map knee.

---

## 5. Risks & rollback

- **(4) D2 base size was explicitly reverted before** — as part of the wholesale motion-rework revert (9ba675e), not on its own merits. Re-landing it bundled with anything would repeat the rework mistake; it is its own one-line commit (step 2) the user judges live.
- **(4) D15 kills the snake wobble the user approved in 9b5ea11.** The refs are unambiguous (posts + slides), but shipped-with-eyes behaviour is only replaced with explicit confirmation (question 2) and as an isolated commit. If rejected: keep the snake amplitude as-is and land only the post-recast/slide grammar on top of a *much slower* orbit — degraded but still directionally right.
- **(1) The bead/ring budget minefield.** Filled beads have no renderer (4 shape slots committed) and dot-mode waves render ~2 px fixed — both proven dead ends (bad7755, "so ugly, remove"). Everything here that looks like a bead is a **hollow ring outline in a line-mode wave**. The column deliberately differs from the removed bead-row on every axis that made it ugly (non-additive, anchored, tapered, non-marching). If any ring element still reads as a caterpillar/tube, its bag weight → 0 is a one-line revert — do NOT iterate speculatively on it live (memory `dont-over-iterate-speculatively`: one change, verify, check in).
- **Faithfulness guard** (memory `alc-faithfulness-no-invented-elements`): every anatomy/column/event above cites a measured ref timestamp; do not add extra decoration (no sparkle, no extra rings beyond the measured 2–6, no invented column materials).
- **Eclipse limitation** is stated in step 4 — resist "fixing" it with comp changes; there are no free q-vars and comp edits are the rejected-rework class.
- **waves[3] baseVals switch** (dots→lines) touches the corridor scene — the acceptance check in step 5 explicitly regression-tests `q29:3`; if line-mode rings degrade the corridor row, keep `usedots:1` and draw the accessory rings as dense dot-circles ONLY if they read as thin rings at 512 samples (verify in the same render) — otherwise split: corridor keeps dots and the accessory sets `usedots` cannot change per frame, so fall back to tiny line-rings (radius ≥0.004).
- **One commit per step**, suggested messages:
  1. `alchemy: orb balloon EVENTS — ballistic overshoot + per-orb desync (D2a) + __ALC_FORCE closure pins`
  2. `alchemy: re-land measured orb base size 0.06->0.048 (D2b)`
  3. `alchemy: orb staging — parked posts + slide + single-endpoint recast, snake wobble removed (D15)`
  4. `alchemy: orb anatomy vocabulary — per-appearance identity (hollow/giant/sun/pearl/eclipse) (A16a)`
  5. `alchemy: waves[3] ring-accessory — bullseyes (kit alcOrbTarget), telescope columns, rosette, eyelet ring (A16b+A4)`
  6. `alchemy: giant-ring milk-fill balloon event (D2c)`
  7. `alchemy: bead-chain taper + motif->orb attachment (D9)`
  8. `alchemy: rare mushroom-figures rise event (A18)`

## 6. Acceptance criteria

- [ ] Orb size at rest ≈ 9–10% frame height dia; **oversize only during events/giant anatomies** (refs: anchors 2–7%, giants 18–25% as events).
- [ ] Beat hits produce **overshoot-and-settle balloons** (2–3× dia, attack ≤0.25 s, settle 0.4–1.2 s), the two orbs desynced ~0.1 s with different maxima; **no continuous breathing swell**.
- [ ] Across a 3-minute run, orbs appear in **at least 5 visibly distinct anatomies** (classic eyelet, hollow ring, giant translucent disc, ringless sun, pearl, dark eclipse) with identity changing per appearance — never the same orb look twice in a row on orb B re-entry.
- [ ] A **hollow ring balloons and milk-fills white** at least once in a busy passage (the r0 13.85 signature).
- [ ] The **eclipse orb reads darker than its surround** with a crisp warm-red rim.
- [ ] Orbs hold **stationary posts for whole dwells** (<1% drift over 2 s), on diagonal-dominant axes with 40–70% separation; occasional **slides of 5–10% per 2 s along the axis**; on re-cast, **one endpoint persists**; no S-curve snake trails.
- [ ] **Ring-stack/telescope columns** appear regularly (they're in every ref segment): 4–9 tapered hollow rings off an orb, swaying ±5°, **extending/retracting ±8–10% at a 2–3 s period**; tip ring takes hue snaps first.
- [ ] **Multi-ring bullseyes (2–6 rings)** appear as orb accessories via the kit `alcOrbTarget` route.
- [ ] Corridor scene (q29=3) renders unchanged (recede row + anchors + steady tether).
- [ ] Mode 11 chain reads as an **accessory bridging motif→orb** with 3→9.4%-style taper, hollow ring beads, bright terminal bead.
- [ ] Rare **mirrored mushroom figures**: caps rise ~2 s, fuzzy trail bodies stack under them, caps hue-snap ~0.6 s cadence.
- [ ] Pastel profile stays muted throughout — no new flat-white or neon elements at rest (spot-check screenshots against the 480p reference's dusty look).
- [ ] `npm test` + concat smoke test pass; `node tools/selfrender.mjs "Alchemy (Pastel)"` renders non-black with no `[WMP-viz shader]` errors (no GLSL was touched).
