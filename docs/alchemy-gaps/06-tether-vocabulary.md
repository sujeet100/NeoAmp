# 06 — Tether vocabulary & event lifecycle

> **★ LANDED (2026-07-09, 6 commits `572f568`→`1840076`):** Step 1 (lifecycle) **SKIPPED as
> superseded** — doc 03's typed scheduler + the user's own presence tuning (aa74f83) own the
> cadence; this doc's sparser 2-4s cadence would have undone that. Landed on top of it: B1
> accent ink (ring = tether ink exactly, the old +0.5 contrast border dropped; fills lag) ·
> all 7 constructions (chord/helix/staircase/lightning-twigs/rope/kite/cascade, per-spawn
> re-roll, `FORCE.tetherKind`) · kind-0 anatomy (chevron envelope/knot/ghost) · persistent
> rail w/ parked-post orbs (`FORCE.rail`; Q11 approved). **Pearl-chain SKIPPED** per answered
> Q8. Awaiting live looks.

**Matrix items:** A5 (tether construction vocabulary incl. hanging cascade + persistent rail-chord) · D1 (tether event lifecycle: per-event spawn, per-event ink snap, mid-span knot, rare persistent rail) · B1 (two-anchor "current ink" spine) · **Priority:** all P1 · **Risk flags:** (1) pearl-chain only — dot beads need user sign-off (bead rows were removed as "ugly, unfixable", commit `bad7755`); (4) on B1/Step 5 — touches user-tuned orb identity/staging, one change at a time; (6) ink snaps must stay inside the muted Pastel envelope · **Confirmation needed:** **yes** —
1. *Pearl-chain*: the ref's bead-path tether (60–80 tiny 4–5px beads on an S-curve) can only be built with wave DOTS (~2px fixed) routed through the otherwise-idle `waves[3]` dots slot. You removed the bead-row accessory as ugly. Build this one tiny-bead variant behind its own flag, or skip it entirely?
2. *Rail posts (D15 fragment)*: while a persistent rail is up, may the two orbs be temporarily pinned to the rail's endpoints (they stop snake-wobbling for the rail's 15–30s life)? This is a small slice of item D15 (orb posts/slide-along-rail — its own doc); shipping the pin here makes the rail read correctly, but say no and the rail will span the orbs' spawn positions without freezing them.

Cross-references (owned by other docs, do NOT build here): the sagging/chevron STAMP fields the tethers leave behind need the per-scene trail-displacement fields (**C2**) and terrain freeze (**B3**); the typed beat-event scheduler that should eventually own tether spawning is **B2**; full orb parked-post staging is **D15**; beads threaded ON wires is **A8/D9**. This doc's Step 1 scheduler is deliberately local so it can later be folded into B2's scheduler without rework.

---

## 1. Reference behaviour (what the original does)

All measurements below are copied from the analyst reports (480p = colour-trusted 0–228s; h0/h1/h2 = 1080p geometry/motion-trusted 0–186s; r0 = 19s colour-accurate clip). Frame ≈ 640×480 (p-reports) / 1280×720 (h-reports); px percentages given where the report gave them.

**Emitter-vs-trail mechanism (unanimous, measured):** every tether is a LIVE emitter — the fine jag reshuffles every frame (waveform tests PASSED at 60fps: h0 `wavetest_19.5`, h1 `wfc_67.5`/`wfc_88.4`, h2 `wf146_stack`, p2 wavetests at 1.25/3.45/14.2–14.4/16.0, p0 `wavetest_21`). The parallel "ghost" copies and the chevron/cascade fields around tethers are FROZEN feedback-trail copies — only the newest strand is live (p0 M6 measured; h0 T2: "per-frame stamps march AWAY perpendicular… building the chevron stamp field").

### A5 — the construction vocabulary (each appearance re-rolls its identity)

| # | Construction | Measured evidence |
|---|---|---|
| 1 | **Fine-tooth waveform chord** (baseline) | p1 T1 (t=79.0, 112.75; flash form 92.0, 96.05): straight chord between two orbs + perpendicular LIVE waveform displacement; 1–2px core + 2–3 fainter parallel ghosts; amplitude envelope calm at endpoints, up to ~50px (~8% frame h) mid-span; spans full width or ~75% diagonal. Either persistent (many seconds) or single-flash (~0.25s). |
| 2 | **Telephone-cord double helix** | p1 T3 (t=97.55–101): TWO parallel strands winding around each other, **12–14 loops of 30–50px over a ~75% span**, ~1.5px each + ghosts. Duty ~1.5–2s ON / ~1s OFF. **Colour flips per appearance**: pink pair → red+blue contrasting braid (99.1) → pale-lavender 3–4-strand braid (100.8). Endpoints re-cast per appearance. |
| 3 | **Loopy kite-string** | p1 T2 (t=66.3, 92.05, 102.9–106): SINGLE wandering strand 1.5–2px, large open loops (amp 15–25px) + fine jag; meanders rather than straight; **lands INSIDE ring targets**, sometimes coiling around them. **Polarity adapts**: cream/white on dark scenes, NAVY on light scenes (dark-on-light, 102.9: UL-tip → summit tangle → LR bullseye). Life 0.25–0.5s, cadence ~0.75–1s busy; in S12 persists ~2s as a 2-segment chain (orb→motif→orb). |
| 4 | **Square-step staircase** | h0 T2 (signature 37–41, flare 57.9): straight chord BL→TR, 1–3 tight parallel strands 1–2px (chromatic pair: red+yellow at 58, purple+violet at 38.7), perpendicular displacement with **SQUARE-STEP (sample-and-hold) character** — horizontal runs + vertical jumps, excursions 10–200px, envelope wilder mid-span; reshuffles every frame (live). Persistent for the scene's life (37–41) or bold 1.5s flare (57.9, 2–3 strand red+yellow). |
| 5 | **Lightning ladder / lightning with side twigs** | p1 T4 (t=81.3): short vertical crisp orange multi-strand zigzag joining two stacked orbs ~25% apart, blocky outlines, life ~0.5s. r0 2.6: lightning strikes at 6.5, 7.9, 13.3, 17.2 **have side twigs** (mid-span branches); 1–2px, dense fine teeth, 2–3 offset strand copies near ends. |
| 6 | **Braided rope** | h1 T2 (116–121): corner-to-corner bundle of **~6–10 jagged strands, total width 25–30px**, pale green-grey, **persistent ~5s** (not event-flash); endpoints = ring-bead orb + tiny stacked-ring "thimble" cone; reads as a solid fuzzy rod, jag alive at 60fps. |
| 7 | **Hanging multi-strand cascade ("jellyfish")** | h0 T3 (15.5–16.5): **3–5 roughly-parallel jagged strands hanging from ONE orb** down to a bead cluster, swinging; **strand separation grows toward the lower end** (fan opens downward). Pink orbs at 15.5, yellow at 16.5. |
| 8 | **Pearl-chain** ⚠ risk (1) | p0 T3 (t=29.25, 30.25, still_30.0): path of **60–80 tiny white beads (4–5px, 2px gaps)** in an elegant S-curve between two gold-ring orbs; brightens toward the terminals; re-arranges per frame; gets 4×-mirrored by the kaleido. |
| 9 | **Persistent rail-chord** | p0 T1: thin (1–2px) cyan/white straight line between two orbs, PERSISTENT — **survives the t=23.5 hard scene wipe and lives ~25s across S3→S4**; occasionally doubled by a crisp orange live-jag copy on hits (24.5). p2 §2.10: "Rail chord — thin straight pale line (1–2px lavender/white/yellow) through the orb pair, spanning 70–80% frame; **persistent for many seconds (142→147; 163→171); slight live micro-jag (2–3px); slowly rotates with the scene (~3–5°/s)**." h0 T1: full-frame X-cross hairlines persist for many seconds (47–52); can be dark-on-light (dark tether at 22.5). |

Also seen: p1 S14 (112.6–115.3) — a plain live chord whose per-stamp copies sag 30–50px down per stamp into a 4–6-strand **draped-rope cascade** building rope-pile terrain ("terrain = stacked dead tethers"). The LIVE element there is just construction #1; the sag pile is C2/B3's trail-field job — do not fake it here.

### D1 — the event lifecycle

- **Spawn:** fully-formed in **<33ms (one frame)** together with its two orbs (p0 T2, measured `wavetest_21`).
- **Life:** 1–2.5s typical (p0); 0.25–0.5s flashes (p1 T2); a few frames–0.75s (h1 T1); ~0.4s (p2 kaleido event: deep-red line + **1px blue-violet chromatic ghost on one side**, then the quad-fold mirrors it into an X that persists ~2s as pigment).
- **Cadence:** every 2–4s in busy scenes (p0); ~0.75–1s at p1's busiest; 0.4–0.8s active (h1); **~2 spawns in 60s of quiet scenes (h2 — "punctuation, not a metronome")**; none in rests.
- **Ink:** colour snaps PER EVENT — h1: cyan→yellow→gold→salmon (67–69), white→red (86–88); r0's per-appearance list: white(1.25) gold(3.45) white(5.05) violet(6.5) blue(7.9) GREEN(9.5–10.4) white(11.7) red(13.3) YELLOW(13.9–14.6) gold green white-gold orange.
- **Anatomy (two displacement scales + knot):** h2 2.1 (`teth127_stack`): (a) slow large **chevron envelope, period ~120px, amp ~40–60px, evolving ~0.5–1s** — this is what stamps the frozen chevron trail bands; (b) fine dense jag + a **mid-span scribble KNOT ~80–120px wide that roams around mid-span**, re-shuffling every 60fps frame. Envelope always calm at tips, wild mid-span.
- **Endpoints:** land exactly on orb cores, and **the orb cores flash the tether hue** (h1 T1).
- **Two lifecycle POLES:** short event-flashes (above) alternate with the occasional long-lived quiet RAIL (#9) — a dim, micro-jagged, slowly-rotating chord that outlives scene changes. Item D15 (orb slide-along-rail staging) presupposes this rail.

### B1 — the two-anchor "current ink" spine

- p3 §3.3 (verbatim): *"At almost every moment there are exactly TWO anchor orbs (usually on a diagonal or vertical axis, separation 40–70% of frame). Tether stamps connect them; orbs+tether always share one ink pair (fill hue + ring hue) that SNAPS per event (~0.5–2s cadence). The anchors survive every scene change — down to 4px dots in the final flat frame. This is the spine of the whole visualizer."*
- r0 2.6/2.7: **"Tether hue = ring-outline hue of endpoint orbs"** (shared "accent family", snapping per event); **ring-outline hue snaps with the tether, FILL hue lags** (gold fill kept under a new green ring at 9.85).
- r0 §3.3: three independent colour clocks — per-event **accent family (ring outlines + tether + sprigs)** snapping every 1.5–3s · motif fills re-tinting slowly (~2s) · bg on its own slower clock.
- r0 2.7: dumbbell staging — two orbs at mirrored diagonal positions, separation 55–75% width, **both persistent per scene while the tether comes and goes**. (p2 2.11 adds the slide variant: the pair "slides slowly ALONG the rail (~5–10% frame per 2s)" — D15's evidence, rail built here in Step 5.)

---

## 2. Current implementation state

All refs verified against `presets/alchemy-v7.js` @ `302349c` (and `presets/kit.js`).

- **Construction — exactly ONE.** `fTether` (alchemy-v7.js **L852–878**): straight chord (q21,q22)→(q23,q24), sample split into TWO parallel strands (`s2 = sample*2`, perpendicular offset `±0.0035·win`), live jag `disp = value1 · q26 · sin(π·tt)` (tips land on the orbs), fly-back point hidden at `|sample−0.5|<0.004` (L876). Deliberately standalone (comment L848–851: the double-stroke remaps `a.sample`, so kit `alcTether` — kit.js **L1873–1916**, single-strand — is not used). No helix, staircase, lightning-twig, rope, cascade, kite-string, pearl, or knot.
- **Lifecycle — flashes on EVERY beat.** waves[2] wiring (**L1266–1287**): `alpha = base × gate(min(q25,q14) > 0.45) × max(beatG, corridor)` where `beatG = ((q32−1.05)/0.4)` (L1281–1284). q32 = 1+1.3·pulse (L966) → the tether strobes with the smoothed beat envelope whenever both orbs are visible; no discrete spawn, no per-event life, no silence in busy stretches. The ONLY persistent-tether analog is corridor-locked (`corridor = |q29−3|<0.5`, L1283; scene coupling L1101–1124 holds q26 at 0.05).
- **Ink — continuous, never snaps.** Hue = `q8 + 0.08` (L870), on the single global hue clock (q8 assembled L946–963: continuous `alcHueClock` + bg-change steps + rate-limited beat snaps — but those move the WHOLE palette, not a tether-specific accent). Orb A ring/fill = q8 (hueOff 0), orb B = q8+0.35, glows +0.12 further (`orbShape` L255–301, `orbGlow` L302–337, wired L1332–1335). No shared per-event accent family; fills never lag rings.
- **Jag amp:** `q26 = 0.06·(0.5+0.7·bassA)` (L1042) — one scale only; no slow chevron envelope, no knot, no chromatic ghost.
- **Reusable machinery:** the chord math + sine window + strand-fold trick in `fTether` (generalises to N strands); the transient beat flash `f` (`beat(t.bass,dt)`, L937) distinct from the smoothed `pulse`; the closure-state pattern for cross-frame directors (accessory block **L880–917** — this is the sanctioned home for new state, since **all 32 q-vars are taken**, header L29–33); the `__ALC_FORCE` debug hook (**L1136–1140** — currently q-vars only); rest state `restAmt` (L1044–1059) to silence tethers in rests; `makePicker`/bag pattern for weighted re-rolls (L347–382, L920–927).
- **Deviations vs refs, summarised:** cadence (every beat vs one typed event per 1–4s + silence), identity (same double-stroke every time vs per-appearance re-roll among ≥7 constructions), ink (continuous vs per-event snap shared with orb rings), anatomy (one displacement scale, no knot/ghost), lifecycle poles (no persistent rail outside the corridor scene-lock).

---

## 3. Implementation plan

**Slot budget (explicit):** everything lands in **waves[2]** — every A5 variant except pearl-chain is pure displacement math inside one `waveLine`-style point function. **No new wave or shape slots. Shapes stay exactly as wired (L1332–1335)** — B1 is a colour-only change inside `orbShape`/`orbGlow`. Pearl-chain (if confirmed) is the ONE exception: `usedots` is a static baseVal, so it cannot share waves[2]; route it through **waves[3]** (already `usedots:1`, idle outside bgMode 3 — L1291–1331), gated to `bgMode !== 3`. **q-vars: none needed** — all new cross-frame state lives in the file closure; `fTether`, the waves[2] `point_eqs`, and `orbShape`/`orbGlow` are all defined inside the same IIFE and read closure vars directly (exactly how `accLine`/`accLineEnv` already work, L1202+). No shader reads any of this, so no q-var pressure.

**Debug pinning (add in Step 1, keep forever):** extend the `__ALC_FORCE` hook (L1136–1140) to also accept closure keys — after the existing q-var loop add:

```js
if (F.tetherKind !== undefined) tetherKind = F.tetherKind;
if (F.tetherOn !== undefined) { tetherEnv = F.tetherOn; tetherT0 = time; tetherLife = 9; }
if (F.railOn !== undefined) railWant = F.railOn;
```

### Step 1 — D1 event lifecycle: spawn / hold / silence (construction unchanged)

*Target:* new closure vars + `frame()` scheduler block (put it right after the q26 line, L1042) + the waves[2] `point_eqs` gate (L1281–1284).

```js
// closure (add near accLine block L895):
var tetherEnv = 0, tetherT0 = -9, tetherLife = 0, tetherNext = 0;

// frame(), after L1042:
if (time >= tetherNext && f > 0.6 && t.q25 > 0.45 && t.q14 > 0.45 && restAmt < 0.3) {
  tetherT0 = time;                       // spawns FULLY FORMED (<1 frame, measured p0)
  tetherLife = 0.4 + Math.random() * 2.1;          // 0.4-2.5s (p2..p0 range)
  tetherNext = time + 2 + Math.random() * 2;       // busy cadence 2-4s (p0)
  if (energy < 1.05) tetherNext += 5 + Math.random() * 9; // quiet: punctuation (h2: ~2/60s)
}
var tl = time - tetherT0;
tetherEnv = tl >= 0 && tl < tetherLife
  ? Math.min(1, (tetherLife - tl) / 0.3)           // hold at 1, dissolve over last 0.3s
  : 0;
```

In waves[2] `point_eqs`, replace `beatG` with the closure value: `a.a *= g * Math.max(tetherEnv, corridor);` (keep `g` and the corridor override untouched). Delete the q32 read there.

*Composes with directors:* rests already starve it (`restAmt` gate + orb B leaving via q14); corridor persistence unchanged; B2's future scheduler can later own the spawn line — keep it a single `if` so it lifts out cleanly.
*Gate/revert:* the whole step is the one `if` block + one gate line — a clean `git revert`.

### Step 2 — B1 shared per-event accent ink (rings + tether snap together, fills lag)

*Target:* closure ink vars; `fTether` colour lines (L870–873); `orbShape` border hue (L255–301) and `orbGlow` hue (L302–337).

```js
var inkOff = 0.08, fillLag = 0.08;   // closure; inkOff replaces the hardcoded +0.08
// frame(): re-roll on every tether spawn (inside the Step-1 if), and when no tether
// for >4s also on strong beats (f > 0.9, reuse lastHueSnapT's 1.2s limiter pattern):
inkOff = (0.06 + 0.3 * Math.random()) * (Math.random() < 0.5 ? -1 : 1);
// fills LAG the rings (r0: gold fill kept under a new green ring):
fillLag += (inkOff - fillLag) * Math.min(1, dt * 1.0);
```

- `fTether` hue → `q8 + inkOff` (was `+0.08`).
- `orbShape`: the BORDER hue (currently `hue+0.5` contrast) → `q8 + inkOff + hueOff` so both rings flash the tether ink per event (keep each orb's `hueOff` identity offset — 0 / 0.35 — so this is incremental, risk (4)); the FILL hue → `q8 + fillLag·0.5 + hueOff` (a partial pull, not a jump).
- `orbGlow` hue offset +0.12 → `+0.12 + inkOff·0.5`.

**Muted guardrail (6):** `inkOff` is an OFFSET on the q8 clock, bounded ±0.36 — never a raw random hue; saturation stays wherever the Pastel comp puts it. Do not touch the profiles.
*Composes:* independent of Step 1's timing but reads its spawn moment; the existing global beat-snap (L956–962) stays — it moves the whole palette, the accent moves relative to it (a small slice of B7's independent clocks, deliberately minimal).
*Revert:* constants back to literals.

### Step 3 — A5 construction vocabulary, re-rolled per spawn

*Target:* `fTether` becomes a dispatcher on closure `tetherKind`, re-rolled inside the Step-1 spawn block from a weighted bag (chord stays dominant):

```js
var TETHER_BAG = [0,0,0,0, 1,1, 2,2, 3, 4, 5,5, 6];  // 0 chord ·1 helix ·2 staircase ·3 lightning+twigs ·4 rope ·5 kite ·6 cascade
tetherKind = TETHER_BAG[(Math.random() * TETHER_BAG.length) | 0];
tetherSeed = Math.random() * 100;                    // per-appearance param re-roll
if (tetherKind === 4) tetherLife = 4 + Math.random() * 2;  // rope is persistent ~5s (h1)
```

Ship in three sub-commits (3a/3b/3c), each adding kinds to the dispatch; kind 0 is byte-identical to today's `fTether` body.

- **3a. Helix (kind 1)** — reuse the existing 2-strand fold; replace the parallel offset with a crossing wind: `off = 0.028 · Math.sin(tt · LOOPS · 6.2832 + (strand ? 3.1416 : 0)) · win` with `LOOPS = 12 + ((tetherSeed * 7) | 0) % 3` (12–14, p1); keep a small live jag `value1 · 0.008` on top so it stays audio-alive. Amp 0.028 ≈ 30–50px loops at 480p scale.
- **3b. Staircase (kind 2) + lightning-twigs (kind 3).** Staircase = sample-and-hold of the REAL waveform (honours the waveform rule): closure `heldStep = -1, heldVal = 0`; in the point fn: `var st = (tt * 24) | 0; if (st !== heldStep) { heldStep = st; heldVal = a.value1 || 0; } disp = heldVal * q26 * 2.2;` — points iterate in sample order, so the hold produces horizontal runs + vertical jumps (h0's signature). Lightning: kind-0 math with `q26 × 2`, plus 2–3 twigs — for samples inside `[bp, bp+0.04]` windows (branch points hashed from `tetherSeed`), redirect the point outward from the branch point at a hashed angle, alpha ×0.6 (r0's side twigs).
- **3c. Rope (kind 4) · kite-string (kind 5) · cascade (kind 6).** Rope: fold into 3 strands (`s3 = sample*3`), per-strand incoherent jag (phase-offset `value1` reads via per-strand sample skew), parallel offsets ±0.008 → a ~25–30px fuzzy bundle; persistent life set at spawn (above); dim ink. Kite: single strand; `disp = 0.025·Math.sin(tt·(3+seed%3)·6.28 + seed) + value1·0.006` — large slow loops + fine jag; polarity: on light grounds (bgMode 5 flat-wash, 8 caustic) multiply rgb ×0.25 → dark-on-light (p1's navy). Cascade: **one-orb anchor** — endpoints A=(q21,q22), B=(q21+0.1·sin(seed), q22+0.32); fold into 4 strands (hide fly-backs near sample 0.25/0.5/0.75, same trick as L876); per-strand perpendicular offset `(strand−1.5) · 0.012 · tt` (separation GROWS toward the low end, h0); whole fan sways `0.02·sin(time·1.1)`. Gate cascade to spawn only when orb B is low (`q14 < 0.5`) so it reads as hanging from the lone anchor.
- **Pearl-chain (kind 7) — ONLY IF CONFIRMED (question 1):** not in waves[2] (usedots is static). Add to waves[3] `point_eqs` before the corridor gate: when `pearlEnv > 0` and `bgMode !== 3`, lay the 80 dots along an S-curve between the orbs (`cubic ease + 0.06·sin(π·s·2)` perpendicular), brightening toward the tips, alpha ×pearlEnv; spawn from the same scheduler with low weight. Dots render ~2px fixed — matches the ref's 4–5px tiny beads about as well as the slot allows; if it reads ugly, revert the one commit.

*Composes:* every kind inherits Step 1's lifecycle + Step 2's ink automatically (`fTether` colour lines are shared). Kite's "lands inside ring targets" comes free — endpoints are the orb centres and the rings are the orb borders.
*Kit rule:* no kit factory exists for any of these constructions (kit `alcTether` is the plain single-strand chord; v7 already forked it deliberately, L848–851) — extending `fTether` is not re-deriving a kit variant. Do NOT inline-copy `alcTether` back.

### Step 4 — D1 anatomy: mid-span knot + slow chevron envelope + chromatic ghost (kind 0 only)

*Target:* the kind-0 branch of `fTether`.

- **Slow chevron envelope (2nd displacement scale):** keep it REAL-audio but slow, per the measured "evolving ~0.5–1s": closure `envHold = new Array(9)`, refreshed from `a.value1` at 9 coarse sample indexes whenever `time > envNext` (capture during point iteration, then `envNext = time + 0.5 + Math.random()*0.5`); coarse displacement = linear interp of `envHold` along tt, amp `0.055 · win` (~40–60px). Fine jag stays as-is on top. This honours the waveform rule (memory: primary motifs use real samples) while matching the ref's slow envelope.
- **Knot:** closure `knotPos = 0.35 + 0.3·rand` per spawn; roams `+0.05·sin(time·0.7)`. For samples within ±0.05 of knotPos, add loop displacement: `kx = 0.06·Math.sin(u·25 + seed)`, `ky = 0.06·Math.cos(u·19 + seed)` where `u = (tt − knotPos)/0.05` — a scribble cluster ~80–120px (0.11–0.17 uv) that re-shuffles with the live jag under it.
- **Chromatic ghost:** strand 2 of the double-stroke gets hue `+0.45` and alpha ×0.4 with perpendicular offset widened to 0.005 (p2's "1px blue-violet ghost on one side") — strand 1 stays the full-alpha accent ink.

*Revert:* each of the three anatomy features is an independent small block; commit together but keep them behind readable constants.

### Step 5 — A5/D1 persistent rail-chord mode (prerequisite for D15)

*Target:* scheduler block + waves[2] gate + (pending question 2) a small orb-pin block in `frame()`.

```js
// closure:
var railAmt = 0, railWant = 0, railT0 = -99, railAx, railAy, railBx, railBy;
// scheduler: at a would-be spawn, occasionally start a RAIL instead (rare — ~1 per 1-3 min):
if (!railWant && Math.random() < 0.10) {
  railWant = 1; railT0 = time;
  railAx = t.q21; railAy = t.q22; railBx = t.q23; railBy = t.q24;  // freeze endpoints
  railLife = 15 + Math.random() * 15;                              // 15-30s (p0 ~25s)
}
if (railWant && time - railT0 > railLife) railWant = 0;
railAmt += ((railWant ? 1 : 0) - railAmt) * Math.min(1, dt * 2);
// slow rotation about the midpoint, 3-5 deg/s (p2): rotate (railAx..By) by railRot(dt)
```

- **Render:** reuse waves[2]. While `railAmt > 0`, `fTether` uses the FROZEN rail endpoints instead of (q21..q24), kind forced to 0, jag amp clamped tiny (`q26_eff = 0.004` → 2–3px micro-jag), no knot; alpha = `max(0.4·railAmt, tetherEnv)` — beat events REUSE the rail chord with full jag/ink (p0: the rail "doubled by a crisp orange live-jag copy on hits"). Rail ink: pale/low-sat — `rgb mixed 0.6 toward white`, alpha 0.4 (p2's lavender/white hairline).
- **Survives scene changes and rests:** nothing couples railWant to bgPick/motifPick (free); exempt it from the rest gate by bypassing `g` while railAmt is up — `a.a *= Math.max(g, railAmt·0.8) …`.
- **Orb pin (question 2):** while railAmt > 0, blend `t.q21..q24` toward the rail endpoints ×railAmt (orbs park as posts; snake wobble fades with the blend). If declined, skip — the rail still renders on its own frozen chord.
- **Corridor interaction:** skip rail rolls while `corridorAmt > 0.1` (the corridor already owns a persistent tether).

*Revert:* everything behind `railAmt`; one commit.

---

## 4. Verification recipe

After EVERY step, before asking the user anything:

```bash
cd /Users/sujitk/projects/personal/ytmusic-wmp-visualizer
node --check presets/alchemy-v7.js          # or: npm test (all files)
# concat/frame_eqs smoke (CLAUDE.md — catches missing closure refs / throwing eqs):
node -e 'const fs=require("fs"),vm=require("vm");global.window=global;
  const cat=["kit","dance","alchemy-v7","ambience","battery"].map(f=>fs.readFileSync("presets/"+f+".js","utf8")).join("\n;\n");
  vm.runInThisContext(cat);
  let n=0; for(const [k,p] of Object.entries(window.WMP_PRESETS)){ if(p.frame_eqs) p.frame_eqs({time:2,bass:1.3,bass_att:1.1,mid:1,treb:1,treb_att:1}); n++; }
  console.log("ok", n, "presets");'
```

(Check the alchemy filename in `viz.html` if the concat list drifts — the family file is `presets/alchemy-v7.js`.) Also run `frame_eqs` in a 300-iteration loop with advancing `time` to exercise the spawn scheduler (`for(let i=0;i<300;i++)p.frame_eqs({time:2+i*0.05,bass:1+(i%7?0:0.8),bass_att:1.1,...})`).

**Self-render** (headless, no user needed):

```bash
node /Users/sujitk/projects/personal/ytmusic-wmp-visualizer/tools/selfrender.mjs "Alchemy (Pastel)" 3,6,9,12,20
# output: /tmp/alc-render/shot_<t>s.png + page console (shader errors surface here)
```

Pin the feature under test via `window.__ALC_FORCE` (use the scratchpad `pinrender.mjs` pattern — evaluate the force object before the preset boots). Standard pins for THIS doc: `{q29:5, q30:15, q14:0.9, q25:0.9}` (flat-wash ground + calm tri-mandala + both orbs up → tether legible), plus the Step-1 closure keys: `tetherOn:1` (hold a tether visible), `tetherKind:<k>` (select a construction), `railOn:1` (hold the rail). For corridor-regression shots pin `{q29:3}`.

**Acceptance checks (each visible in a screenshot):**
- **Step 1:** with NO pins, in five shots at 3/6/9/12/20s **at most 2 show a tether** (was: every beat-adjacent shot); the `q29:3` corridor shot ALWAYS shows it; a pinned `tetherOn:1` shot shows the full double-stroke landing exactly on both orb centres.
- **Step 2:** freeze one shot — the tether strands and BOTH orbs' ring borders are the same hue while the orb fills stay their own (different) hues; a shot 6s later shows a different shared ring/tether hue. Colours stay dusty (no neon — compare against an unmodified Pastel shot).
- **Step 3a helix:** pin `tetherKind:1` — two strands visibly crossing **12–14 times** along the span. **3b staircase** (`tetherKind:2`): displacement shows flat horizontal runs joined by near-vertical jumps, wilder mid-span; **lightning** (`tetherKind:3`): 2–3 short side twigs branch off mid-span. **3c rope** (`tetherKind:4`): a fuzzy ~25–30px-wide bundle, still visible in two shots 3s apart (persistent); **cascade** (`tetherKind:6`): 3–5 strands hang from ONE orb, separation visibly wider at the bottom than the top.
- **Step 4:** pin `tetherKind:0, tetherOn:1` — a scribble knot ~10–15% of frame width sits near mid-span (different position after a re-spawn); the chord shows a big smooth chevron shape UNDER the fine teeth; one faint colour-shifted parallel ghost line beside the main stroke.
- **Step 5:** pin `railOn:1`, shots at 3/10/20s — the same thin pale straight chord persists across a bg-regime change (let bgPick run free), rotated only slightly (~3–5°/s ≈ 60–100° over 20s); micro-jag ≤ a few px; one beat-coincident shot shows it flaring bright with full jag. If the orb pin was approved: both orbs sit ON its endpoints in all three shots.

---

## 5. Risks & rollback

- **(1) Pearl-chain = dots.** The user removed the bead-row/caterpillar accessory 2026-07-04 (`bad7755`, "so ugly, remove"; see the waves[3] note L1292–1297 — dots render ~2px fixed and all 4 shape slots are taken, so no filled-bead renderer exists). Do NOT build kind 7 without an explicit yes (Confirmation question 1). All other variants are pure line-displacement math — zero overlap with the removed feature.
- **(4) Rejected-rework blast radius.** The wholesale motion/accessory rework was rejected (`9ba675e`); orb snake-wobble and staging shipped with the user's eyes (`9b5ea11`). Step 2 deliberately KEEPS each orb's identity hue offset and only snaps the ring/border accent; Step 5's orb pin is a small D15 fragment — confirm it (question 2) and keep it inside the railAmt gate so reverting the rail reverts the pin. Never remove the per-beat feel entirely in one move: Step 1 changes cadence alone, nothing else, so the user can judge it in isolation.
- **(6) Muted Pastel.** Ink snaps are bounded offsets on the q8 clock; no profile/tonemap changes anywhere in this doc. Rail ink is deliberately DESATURATED (mixed toward white) per p2.
- **(5) No invented elements.** Every construction has a cited timestamped ref; if a kind starts drifting stylistically during tuning (e.g. adding glow the refs don't show), stop and re-check the frames.
- **Don't over-iterate live** (memory `dont-over-iterate-speculatively`): one step per session with the user; self-render first; ask ONE focused question per screenshot round.
- **One commit per step** (revert-friendly):
  1. `alchemy: tether EVENT lifecycle — spawn/hold/silence replaces per-beat flash (D1)`
  2. `alchemy: shared per-event accent ink — tether + orb rings snap together, fills lag (B1)`
  3. `alchemy: tether vocabulary 1/3 — per-spawn kind re-roll + telephone-cord helix (A5)`
  4. `alchemy: tether vocabulary 2/3 — square-step staircase + lightning side-twigs (A5)`
  5. `alchemy: tether vocabulary 3/3 — rope braid, kite-string, hanging cascade (A5)`
  6. `alchemy: tether anatomy — mid-span knot, slow chevron envelope, chromatic ghost (D1)`
  7. `alchemy: rare persistent rail-chord tether, survives scene changes (A5/D1, D15 prereq)`
  8. *(only if confirmed)* `alchemy: pearl-chain tether via waves[3] dots (A5, user-approved)`

---

## 6. Acceptance criteria (cluster "done")

- [ ] Tether is SILENT for multi-second stretches in busy scenes (cadence 2–4s) and near-absent in quiet ones (~punctuation); it never strobes on every beat.
- [ ] Spawns fully formed in one frame with both endpoints on orb centres; lives 0.4–2.5s (rope ~5s); dissolves into trail, no fade-in.
- [ ] Consecutive spawns visibly differ in BOTH construction and ink (per-appearance identity re-roll) — chord / helix (12–14 crossings) / staircase / lightning-with-twigs / rope bundle / kite-string / one-orb hanging cascade all reachable and individually pinnable via `__ALC_FORCE.tetherKind`.
- [ ] Tether + both orb RING borders share one accent hue that snaps per event; orb FILLS lag the rings by ~1s; everything stays inside the muted Pastel envelope.
- [ ] Kind-0 chord shows two displacement scales (slow ~0.5–1s chevron envelope + per-frame fine jag) and a roaming mid-span scribble knot, plus a faint one-sided chromatic ghost.
- [ ] A dim, pale, micro-jagged RAIL chord appears rarely (~1 per 1–3 min), lives 15–30s, rotates ~3–5°/s, survives at least one background-regime change and one rest, and flares with live jag on beats — giving D15 its rail.
- [ ] Corridor scene behaviour unchanged (persistent corridor tether + ring-dot row as today).
- [ ] No new wave/shape slots consumed (pearl-chain, if approved, uses only the idle waves[3] dots slot outside corridors); no new q-vars; `npm test` + the concat/frame_eqs smoke pass; self-render shows no shader errors.
- [ ] Pearl-chain built ONLY after explicit user approval — otherwise absent.
