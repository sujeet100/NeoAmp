# 03 — Typed beat-event scheduler & stamp grammar

**Matrix items:** B2 (P1) · B4 (P1) · A12 (P2) · A13 (P2) · D7 (P2) · **Priority:** P1 (B2/B4 are the reactivity-character gap; A12/A13/D7 are its first three consumers) · **Risk flags:** B4 carries (4) — the motif-swap opacity dip + the every-beat tether flash are SHIPPED, user-seen behaviour; replace one commit at a time with the user's eyes (memory `dont-over-iterate-speculatively`). A12/A13/D7/B2: no flags. All new elements are evidence-backed (guardrail (5) satisfied — timestamps quoted below). · **Confirmation needed:** **yes** — ask before Step 1 and Step 5: *"Two shipped behaviours would change: (a) the tether currently flashes on EVERY beat — the refs spawn it as a discrete event every 1–4s and go silent in rests; (b) motif swaps currently hide behind a global opacity dip — the refs stop the old emitter (its ghost decays) and bloom the new one in <0.5s. OK to land these as two separate commits you verify live?"*

Everything in this doc is **frame_eqs / point_eqs JS only** — no warp/comp GLSL changes, no new wave or shape slots, no q-var changes. It is the safest of the P1 clusters and a prerequisite for the tether-lifecycle (D1), orb-event (D2), and rest (B6) docs, which register more event types into the scheduler built here.

---

## 1. Reference behaviour (what the original does)

Mechanism common to all five items: **the original is a stamp+feedback engine**. 1–3 crisp emitters are re-drawn per frame; everything soft is their accumulated trail in the feedback buffer. On top of a serene continuous base, the engine fires **discrete, typed, one-at-a-time events**; each event is a stamp/spawn/snap whose ghost the feedback buffer keeps. Emitters *stop*, they never fade-dip.

### B2 — Discrete typed beat-EVENT scheduler (P1, both captures)

- **p1 §3.5** (480p 58–117s): "Event system (beat-triggered, **cadence ~0.75–0.8s in busy phases, one event per 1–3 beats**): tether spawn/flash, colour snap, splat/ribbon stamp, dumbbell stamp, motif bloom (<0.5s), axis-line flash, orb balloon-deflate (2x→1x in 0.25s), kaleido fold." Measured burst at t≈77.0/77.75/78.5: tether bursts cadence ~0.75s, life 0.25–0.5s.
- **p2 §3.5** (480p 114–174s): "discrete beat-events on top of smooth clocks — orb-pair+tether spawn (0.3–0.5s), balloon pulses (0.35s attack / 0.4s release), motif re-stamp, emitter hue SNAP (often simultaneous with an orb event), big-stamp orbs. **Rate: one event every ~1.5–4s during active phases; NONE during rests.**"
- **h0 §5.2** (1080p 0–62s): beat-event rate "**~1–2/s at climaxes, one per 2–4s in rests**"; menu observed: orb balloon (attack ≤2 frames), fresh net-strand stamp (10.1), fan re-aim, band-segment recolour, tether spawn (19.5, 45.0, 54.25) + flare (57.9), kaleido region flood (2–4/s at peak), ray-curtain burst (25.2, 27.0), scribble-star stamp (20.5), hexagram stamp (57.0), ring-cage bloom (57.25), bloom-in (41.0).
- **h2 §3.7** (1080p 124–186s): "majors every ~3–5s, minors ~0.5s: tether spawn (146.25, 179.6), chord flash (163.4), motif morph/re-stamp (175.3, 180.1), cap/orb colour snaps ~0.5–0.75s". Smooth & never reactive: fan sweep rate, curtain slide, hue-roll speed, trail decay.
- **r0 §3.4** (19s colour-accurate clip): "Event grammar (beat-triggered, **~every 2s, denser in climaxes**): tether-spawn · orb-balloon (2.5–3x) · giant-ring balloon + milk-fill · colour-snap · orb-variant swap · band-colour injection · lightning strike w/ branches · final X-cross→starburst."

Takeaway: min-spacing ~0.75–0.8s, typical gap 1.5–4s, **one typed event per hit** (never everything pulsing together), **silence during rests**.

### B4 — Motif lifecycle grammar: bloom-in / stamp-cadence life / stamp-stop exit / anchor-seed (P1, both)

- **h2 §3.4**: "no cuts ever. **New motifs spawn anchored on an existing element** (dandelion ON the mushroom cap; star at the ball center; totem at the beam crossing) or the current pivot; **old emitters simply stop and their trail decays** under the new scene."
- **r0 §3.6**: "Scene changes are **emitter handoffs**: stop stamping A, start stamping B; **the buffer does the crossfade** and A's ghost becomes B's floor/terrain."
- **p1**: moth blooms near-empty→**80% frame span in <0.5s** (t=82.9); **stamp-seed transitions**: at t=96.05 two saturated magenta glow discs (~6%) stamp mid-L/mid-R, snap to red w/ white rings + a 1px red tether spans them (~70%) — that dumbbell event BECOMES the next scene's cast; same at t=112.75 (dumbbell stamp → draped-rope-cascade scene).
- **h0 §3 item 6**: "transitions are asymmetric: **enter by sweep-in/flood/bloom** (bloom-in 0.5s at 41.0), **exit by stopping the emitter and letting trail decay (~1s)**, or corner-collapse; the previous scene's trail is ALWAYS inherited briefly by the new scene."
- **r0 2.1**: exit observed at 8.0–8.5 = "stamp-stop + ghost absorption into floor".

### A12 — One-shot star/snowflake/hexagram STAMPS with long ghosts (P2, both)

- **p3 D-STAR** (480p 171–228s): "One-shot outline stamp **~180px** (≈28% of the 640px frame width), thin 2px lines, **12 spiky arms** (174.0 lavender/green); **ghost persists ≥7s on black**; a gear/flower ring variant (8 lobes) **wraps an orb** at 186.5."
- **h2 2.7** (1080p): "**3–4 nested/offset spiky star-polygon outlines (8–12 points)**, crisp 1–2px, **chromatic offsets (pink/green/blue edges)**, green glow core ~130px; overall ~300px (**23% frame**; S13 ~35%). Outline radius re-jitters per frame (audio). Drifts slowly (~3%/s), stamps a fuzzy cigar/pillow trail ~450px long."
- **h0**: nested zigzag polygon "scribble-star" rings stamp around centre at 20.3–20.7 (yellow/green, over the dark kaleido); hexagram/nested-triangle wireframe stamp **~55% width** at t=57.0; spirograph ring-cage bloom around the fluff ball at 57.25.
- Mechanism: emitter draws the star crisp for a moment, **stops**; the feedback buffer keeps the ghost. The refs use stars as **punctuation events over other scenes**, not as a dwelling motif.

### A13 — Rest-scene wireframe stamps cycling construction (P2, 1080p)

- **h1 S3 [74.8–83.0]** ("flat blue paper + spirograph net stamps", a REST scene): flat untextured slate-blue bg, **pixel-identical at 75.5 vs 82.5** (true static ground); **ONE wireframe motif re-stamping every ~1–2s cycling BOTH construction AND hue**: white star-net (78.5) → maroon net (79.5) → mirrored bead-and-stem garden lattice w/ ring-dot heads (80.5) → blue diamond dot-lattice (81) → magenta radial scribble-star (82.5). **Old stamps ghost-fade in ~1s. NO music jag in the net chords (clock-driven re-arrangement).** Camera dead still.
- **h1 M3 detail**: dozens of STRAIGHT chords (1–2px, crisp) tangent to an inner ellipse → horizontally-stretched star-net ~72%×60% of frame, bilaterally mirrored.

### D7 — Organic tangle: one-hue STAMP events + two-generation coexistence (P2, both)

- **h1 M7 [104–107]**: full-frame tangle of long curvy 1–2px strands, some clearly BIFURCATING; "**stamped as an EVENT in one hue (yellow→red→white, ~1.3–2s cadence), crisp ~1–1.5s, then trail**. Does not move once stamped."
- **p2 2.1** (coral tangle, ~100–200 strokelets, 28–35% frame width): strokes re-shuffle fine geometry **every frame** while alive (live-audio); "**hue SNAP on emitter while trail keeps old colour** — t≈137.3: crisp strokes flip red→green over ~0.3s, the red cloud persists ~2s beneath. Re-stamp event: t≈143.0 a fresh green+magenta tangle stamps in **within 0.25s**." Two hues at once (filaments one hue, core fringe another).
- **h0 M7 [32–37]**: 40–60 strands, whole-mass hue walks in **~1.5–2s steps** "with **two generations coexisting** (fresh green over older blue at 34.0)".
- **r0 2.1** (net/scribble ball, 30fps-verified): "crisp fully-formed stamp appears **every ~5–8 frames (0.2–0.3s)**; between stamps only the decaying ghost + a few live arms persist. **Stamp geometry fully re-randomized each stamp. The re-stamp cadence is audio-gated.**" (That fast tier belongs to the mesh-ball motif — matrix A2, another doc — but it fixes the mechanism: alpha-gated stamp frames over a held ghost.)
- Trail-hue rule (matrix A14 ★CONFLICTED note, resolved 4-vs-1): **trails never retro-change hue — hue ages in place.** Snap only the EMITTER colour; the two-generation look then comes free from the buffer.

---

## 2. Current implementation state

File: `presets/alchemy-v7.js` (1373 lines, commit `302349c`). All line refs verified against that build.

**Continuous modulation only — no scheduler.** `frame()` (L930) computes one transient flash `f = beat(...)` (`alcBeatFlash({rise:1.22})`, L918; kit factory at `presets/kit.js` L829) and one smoothed `pulse` (L939). Everything rides these two envelopes together:
- Motif size/brightness: `t.q5 = scaleFor(mCur)*(0.82 + 0.3*(bassA-1) + 0.45*pulse)` (L1015); `t.q4 ... *(1 + 0.3*pulse)` beat flash (L1000).
- Orbs: `t.q7 = (0.06+0.02*...)*(1+0.85*pulse)` (L1041).
- **Tether flashes on EVERY beat**: `waves[2].point_eqs` (L1266–1287) gates alpha by `beatG = ((a.q32||1)-1.05)/0.4` (L1282) × both-orbs-visible `g` (L1281) × corridor override (L1283–1284). No cadence, no min-spacing, no rest silence (rests only remove orb B, which happens to kill the tether via `g`).
- **Hue snap exists but inline**: `if (f > 0.9 && time - lastHueSnapT > 1.2) { hueStep += ...; }` (L959–962) — the ONLY discrete event in the build. Reusable as the scheduler's first client.

**Motif swap = disguised crossfade, not a handoff.** `motifPick` (L927, `makePicker(25, 6, 11, 2.0)` — transitions already GATED to a beat `f > 0.6` or +5s overtime, L994) crossfades `mo.mix` 0→1 over 2s; `q30` snaps at mix 0.5 (L995–996); the swap hides behind the q4 Gaussian dip `t.q4 = 0.85*(1 - 0.75*exp(-dd*dd))*...` (L997–1000). No bloom entrance, no stamp-stop exit, no anchor inheritance (motif centre is a free Lissajous, L1011–1012).

**No stamp lifecycle anywhere.** The 12-point star is a persistent dwell mode (`f12Star`, L619–654, bag weight 1/25); the tangle draws continuously with `hue + u*0.1` on the global q8 clock (`fTangle`, L720–740 — its strand seed `seg*2.39996` is FIXED, so geometry never re-rolls); star-net (`fStarNet` L414–436) and net (`fNet` L520–564) likewise persist and rotate. Rests (L1048–1058) fade accessories + orb B but the central motif never leaves and never cycles.

**Reusable assets (do NOT re-derive):**
- The closure-state pattern: accessory director state lives in the file closure (L891–917) and is read DIRECTLY by `waves[1].point_eqs` (e.g. `accLine`, `accVis`, `accLineEnv` at L1202+). Point fns share the IIFE scope — **event state needs zero q-vars** (all 32 are taken, header L29–33; q-vars only if a SHADER must read them, per memory `alchemy-director-t02-finding` — nothing here does).
- `alcBeatFlash` (kit L829) — the hit detector; `makePicker` (L347) — dwell/crossfade; `MODES` dispatch (L807) + `centralDraw` (L835) — one multiply point for stamp gating; `orbCol` cosine palette — all stamp colours stay on it (muted guardrail).
- The `window.__ALC_FORCE` debug hook (L1136–1140) — extend it (Step 0) to pin closure-level event state for self-render.
- Existing star constructions (`f12Star`, `fStarNet`, `fNet`, `fTriMandala` L769) — A12/A13 reuse these point fns, not new geometry.

**Budget ledger for this doc (hard constraint: 4 waves + 4 shapes):**

| slot | today | after this doc |
|---|---|---|
| waves[0] | central motif | unchanged geometry; gains stamp-alpha gating + per-stamp hue/seed (closure-driven) |
| waves[1] | star-net companion / accessory multiplex | + ONE new top-priority branch: the ≤0.3s star-stamp event (pre-empts the accessory for its life) |
| waves[2] | tether, every-beat flash | alpha gate swaps `beatG` → scheduler event envelope; nothing else |
| waves[3] | corridor ring-dots only | **untouched** |
| shapes[0..3] | orb fills + halos | **untouched** |

Zero new slots. Zero dots (nothing here needs them — all new geometry is line outlines; the ~2px-dot / no-filled-beads constraints are not tickled). All cross-frame state = closure vars.

---

## 3. Implementation plan

Order = smallest shippable slice first. Each step is one commit, individually revertible, gated behind its own flag/branch. **Steps 1 and 5 change shipped behaviour — get the user's confirmation (header question) and their eyes on each.**

### Step 0 — Debug pinning hooks (no visual change)

Target: `frame()` L930 + the `__ALC_FORCE` block (L1136–1140).
The existing hook only overrides `t.*` q-vars AFTER frame logic, so closure-level event/lifecycle state can't be pinned. Read the force object ONCE at the top of `frame()` and honour three **debug-only keys** (production no-op — `__ALC_FORCE` is never set live):

```js
var FORCE = (typeof window !== "undefined" && window.__ALC_FORCE) || null;
// ... after `var mCur = MOTIF_BAG[...]` (L995):
if (FORCE && FORCE.motif !== undefined) mCur = FORCE.motif;   // drive lifecycle logic, not just q30
// ... before restAmt easing (L1057):
if (FORCE && FORCE.rest !== undefined) resting = !!FORCE.rest;
// ... in the scheduler (Step 1): if (FORCE && FORCE.ev !== undefined) force-fire that type when spacing allows
```

Keep the existing tail-of-frame q-var override unchanged. Commit: `alchemy: __ALC_FORCE debug keys for motif/rest/event pinning (no visual change)`.

### Step 1 — B2: the typed event scheduler + first two clients (tether spawn, hue snap)

Target: closure state near L880–918; scheduler block in `frame()` right after `pulse` (L939); `waves[2].point_eqs` gate (L1281–1284); the inline hue-snap block (L959–962).

```js
// ── TYPED BEAT-EVENT SCHEDULER (B2) — ONE discrete event per hit, min-spacing enforced,
// SILENT in rests (p2 §3.5). State lives in the closure (q-vars all taken; no shader reads it).
var evNextT = 0,           // earliest next fire
    evTetherT0 = -9, evTetherLife = 0,  // event 1: tether spawn
    // Step 2+: evStarT0/-Life/-Anchor/-Pts/-R, stamp state, ... (one var group per type)
    EV_MENU = [];          // filled below; other docs push more types here
```

In `frame()`:

```js
// one typed event per qualifying hit; cadence: min gap 0.8s, mean 1.5–3s (p1/p2/h0/r0)
if (f > 0.75 && time >= evNextT && restAmt < 0.5) {
  var rEv = Math.random();
  if (rEv < 0.5) {                       // 1: TETHER SPAWN (D1 doc refines anatomy/ink later)
    evTetherT0 = time;
    evTetherLife = 0.4 + Math.random() * 1.6;   // 0.4–2s (h1 bursts ≤0.75s .. p0 lives 1–2.5s)
  } else {                               // 2: HUE SNAP (moved from the inline L959 block)
    hueStep += (0.05 + 0.07 * Math.random()) * (Math.random() < 0.5 ? -1 : 1);
  }
  evNextT = time + 0.8 + Math.random() * 2.2;
}
tetherEnv = time < evTetherT0 + evTetherLife
  ? Math.min(1, (time - evTetherT0) * 12)                       // p0: spawns fully-formed <33ms
  : Math.max(0, 1 - (time - evTetherT0 - evTetherLife) * 6);    // fast stop; buffer keeps ghost
```

Delete the inline `f > 0.9` hue-snap block (its behaviour moves into the menu; the scheduler's own spacing replaces `lastHueSnapT`). In `waves[2].point_eqs` replace the `beatG` line (L1282):

```js
var beatG = tetherEnv;   // scheduler-driven event (was: every-beat q32 flash)
```

Keep `g` (both-orbs) and the corridor override exactly as-is. Rest silence comes from the `restAmt < 0.5` gate — the refs fire NO events in rests (p2). Composition with directors: the scheduler sits BESIDE `bgPick`/`motifPick`/accessory director as a fourth independent clock; it reads `restAmt` but writes nothing the pickers read.
Revert path: this step is 3 small hunks; `git revert` restores every-beat flashing.
Commit: `alchemy: typed beat-event scheduler (B2) — tether spawn + hue snap as discrete events, silent in rests`.

### Step 2 — A12: one-shot star stamps with ghosts

Target: new event type in the menu (weight ~0.2 of the roll); new TOP-priority branch at the head of `waves[1].point_eqs` (L1180, before the star-net-companion check).

On fire, re-roll the star's identity per appearance (h2: 8–12 points; p3: 12-arm / 8-lobe gear variants):

```js
evStarT0 = time; evStarLife = 0.22;                    // crisp a few frames; then STOP
evStarPts = 8 + Math.floor(Math.random() * 5);          // 8–12 points
evStarR = 0.11 + Math.random() * 0.07;                  // ~23–35% frame width overall
evStarHue = 0.15 + Math.random() * 0.35;                // offset from q8, snapped per event
evStarAnchor = Math.random() < 0.7 ? 0 : 1;             // 0: motif centre · 1: orb A (p3 186.5 wraps an orb)
```

Draw (in `waves[1]`, when `time < evStarT0 + evStarLife`): split the 512 samples into **3 nested outline copies** (h2: 3–4 nested, chromatic pink/green/blue edge offsets) of a spiky star polygon — reuse the `f12Star` chord-walk construction (L619–654) parameterized by `evStarPts`, radius `evStarR*(1 + 0.035*copy)`, per-copy hue `q8 + evStarHue + copy*0.12`, small `value1` radius jitter (h2: outline radius re-jitters per frame). Anchor at `(q2,q3)` or `(q21,q22)` per `evStarAnchor`. Alpha ~0.6, brightness via `orbCol` only — **Pastel stays muted**; the tone-map must not be fed white (memory `alc-colors-were-washed-out`).
After `evStarLife` the branch returns `a.a = 0` — the feedback buffer keeps the ghost.
**Honest fidelity ceiling:** at decay 0.957 + compounding blur the ghost lives ~1–2s, not p3's ≥7s. The ≥7s ghost needs the per-scene freeze field (matrix C2, another doc) — note it there, do NOT touch the warp here.
Pre-emption note: for 0.22s the star replaces whatever accessory `waves[1]` was showing; suppress firing while motif mode 1 is up (the companion star would double-expose).
Commit: `alchemy: one-shot star stamp events with feedback ghosts (A12)`.

### Step 3 — D7: tangle stamp cadence + per-stamp emitter hue snap (two generations)

Target: `fTangle` (L720–740), `centralDraw` (L835–846), new closure stamp state; driven from `frame()`.

Data-driven per-mode table so more modes can join later (r0's 0.2–0.3s fast tier belongs to the future mesh-ball motif, matrix A2):

```js
var STAMP_MODES = { 13: { gapMin: 1.3, gapMax: 2.0, crisp: 1.0 } };  // h1 M7: 1.3–2s cadence, crisp ~1–1.5s
var stampT0 = -9, stampNext = 0, stampSeed = 0, stampHueOff = 0, stampGain = 1;
```

In `frame()` (after `mCur` is known): if `STAMP_MODES[mCur]` exists and `time >= stampNext` and `f > 0.6` (audio-gated cadence, r0), fire a stamp: `stampT0 = time; stampSeed = Math.random()*6.2832; stampHueOff = snaps by ±(0.15..0.5)` (h1: yellow→red→white steps); `stampNext = time + gapMin + rand*(gapMax-gapMin)`. Envelope:

```js
var cs = STAMP_MODES[mCur];
stampGain = !cs ? 1
  : (time - stampT0 < cs.crisp ? 1 : 0.2);   // crisp life, then residual "few live arms" (r0)
```

In `centralDraw` multiply: `a.a *= stampGain` (closure read — same pattern as `accVis`). In `fTangle`: `var seed = seg * 2.39996 + (a._stampSeed…)` — simplest is reading the closure directly: `seg * 2.39996 + stampSeed` (geometry fully re-randomized per stamp, r0) and hue `(a.q8||0) + stampHueOff + u*0.1` (emitter snaps; **the trail keeps the old hue automatically** — never recolour the buffer, matrix A14 resolution). Keep the per-frame `value1` jitter — the emitter stays LIVE while crisp (p2: strokes re-shuffle every frame).
Gate: only mode 13 changes; every other mode's `stampGain` is 1 — revert = delete the table entry.
Commit: `alchemy: tangle one-hue stamp events + two-generation trail (D7)`.

### Step 4 — A13: rest-scene wireframe stamp cycling ("sketchbook page")

Target: new closure block in `frame()` next to the rest logic (L1048–1058); reuses Step 3's stamp machinery.

Trigger: `restAmt > 0.7 && bgMode === 5` (flat wash — the nearest ground to h1's static slate-blue paper; weight 1/15 in `BG_BAG` L920, so the pairing is occasional like the refs' one such scene in 186s). While active:

```js
if (restStampOn && time >= restStampNext) {
  restStampMode = REST_CYCLE[Math.floor(Math.random() * REST_CYCLE.length)]; // [1, 7, 10, 15]
  restStampHue += 0.2 + Math.random() * 0.4;    // cycle hue WITH construction (h1: white→maroon→blue→magenta)
  restStampT0 = time;
  restStampNext = time + 1 + Math.random();      // re-stamp every ~1–2s (h1)
}
```

`REST_CYCLE = [1, 7, 10, 15]` — star-net, wireframe net, 12-point star, tri-mandala: all EXISTING wireframe constructions (`fStarNet` L414, `fNet` L520, `f12Star` L619, `fTriMandala` L769 via kit `alcTriMandala` kit-L1717 — kit factories, not re-derived). While active, in `frame()`: override `mCur = restStampMode` for the draw path, hold the centre static (`t.q2/q3 → 0.5`, ease over ~1s), crisp window ~0.3s then `stampGain → 0` until the next stamp (ghost fades ~1s at decay 0.957 — matches h1's ~1s ghost without warp changes), add `restStampHue` to the motif hue, and set `t.q6 = 0.01` (h1: NO music jag — clock-driven stamps). Suppress B2 events while this scene runs (h1 S3 shows only the cycler + bg).
Interaction with B6 (true rests, another doc): when B6 lands, this becomes one of two rest flavours (empty starvation vs sketchbook); a coin-flip at rest start picks. Note it there.
Revert: one boolean (`restStampOn` computation) disables the whole scene type.
Commit: `alchemy: rest-scene wireframe stamp cycling on flat wash (A13)`.

### Step 5 — B4a: stamp-stop exit + bloom-in entrance (replaces the q4 dip) — **user-confirm first**

Target: the q4 dip line (L997–1000) and `t.q5` (L1015). `motifPick`'s beat gating (L994) already lands transitions on hits — keep it.

```js
// B4a: handoff grammar. Old emitter STOPS early (ghost carries the frame),
// new motif BLOOMS in <0.5s (p1 moth 82.9; h0 41.0). mo.mix runs 0→1 over the 2s fade.
var trans = mo.mix, flashMul = 1 + (bgMode === 1 ? 0 : 0.3) * pulse;
if (trans <= 0 || trans >= 1) t.q4 = 0.85 * flashMul;                       // dwelling
else if (trans < 0.5) t.q4 = 0.85 * Math.max(0, 1 - trans * 6) * flashMul;  // stamp-stop ≤0.17s in
else {
  var bl = Math.min(1, (trans - 0.5) * 4);                                  // bloom over ~0.5s
  t.q4 = 0.85 * bl * flashMul;
  t.q5 *= 0.25 + 0.75 * bl;                                                  // scale 25%→100%
}
```

Between stop (mix≈0.08) and bloom (mix 0.5) only the old motif's ghost shows for ~0.8s — exactly h0's "exit by stopping the emitter and letting trail decay (~1s)" and r0's "the buffer does the crossfade". Delete nothing else; the Gaussian-dip expression is replaced in place (revert = restore L997–1000).
Commit: `alchemy: motif handoff — stamp-stop exit + bloom-in entrance replaces the swap dip (B4a)`.

### Step 6 — B4b: anchor-seed spawning

Target: transition-start detection around `motifPick` (L994) + the motif centre lines (L1011–1012).

At the frame where `mo.mix` first leaves 0, roll the incoming motif's seed anchor (h2 §3.4): 60% the old motif's current centre, 25% orb A `(q21,q22)`, 15% orb B `(q23,q24)` — capture from the PREVIOUS frame's values (orbs are computed after the motif block at L1025–1038; store `lastOrbAX/…` at end of frame). Then blend:

```js
anchorAmt *= Math.exp(-dt * 0.25);              // release toward the free path over ~4–6s
t.q2 = lisX + (anchorX - lisX) * anchorAmt;     // lisX/lisY = the existing L1011-1012 Lissajous
t.q3 = lisY + (anchorY - lisY) * anchorAmt;
```

With `anchorAmt = 1` set at transition start. The bloom (Step 5) now visibly grows OUT of an existing element — the p1 stamp-seed grammar. Corridor/valley couplings already override orb/centre positions later in `frame()` and keep winning (their easing runs after this block).
Commit: `alchemy: anchor-seed motif spawning — new motif inherits an existing element's position (B4b)`.

---

## 4. Verification recipe

After EVERY step:

```bash
node --check presets/alchemy-v7.js        # syntax
npm test                                   # all preset files
# concat/frame_eqs smoke test (CLAUDE.md — catches missing closure refs / throwing eqs):
node -e 'const fs=require("fs"),vm=require("vm");global.window=global;
  const cat=["kit","dance","alchemy-v7","alchemy-motion","ambience","battery"].map(f=>fs.readFileSync("presets/"+f+".js","utf8")).join("\n;\n");
  vm.runInThisContext(cat);
  let n=0; for(const [k,p] of Object.entries(window.WMP_PRESETS)){ if(p.frame_eqs) p.frame_eqs({time:2,bass:1.3,bass_att:1.1,mid:1,treb:1,treb_att:1}); n++; }
  console.log("ok", n, "presets");'
```

(That concat list matches `viz.html` L104–109. Additionally, run the Alchemy frame fn in a loop once — `for(let tt=0;tt<30;tt+=0.016) P["Alchemy (Pastel)"].frame_eqs({time:tt,bass:1.3,bass_att:1.1,mid:1,treb:1,treb_att:1})` — the scheduler/stamp state is time-dependent and a single call won't exercise fires.)

Self-render (no GLSL changed in this doc, so failures will be JS, visible in the printed console):

```bash
node /Users/sujitk/projects/personal/ytmusic-wmp-visualizer/tools/selfrender.mjs "Alchemy (Pastel)" 3,6,9,12
```

Pin features via the scratchpad `pinrender.mjs` pattern (injects `window.__ALC_FORCE` before boot), using the Step 0 keys. Per-step acceptance (each phrased as screenshot-visible):

- **Step 1 (scheduler/tether):** run 30s with shots every 1s during a busy track. BEFORE: the tether appears in nearly every shot (flashes each beat). AFTER: it appears in roughly 30–50% of shots, in runs (an event lives 0.4–2s) separated by gaps ≥0.8s. Pin `{rest:1}`: tether absent in ALL shots (and orb B gone — existing rest behaviour). Pin `{q29:3}`: corridor tether still steadily present (override intact).
- **Step 2 (star stamp):** pin `{ev:'star'}` (force-fire when spacing allows) + shots at t and t+1.0. Shot A: a nested 8–12-point outline star, 2–3 visibly offset copies in neighbouring hues, total ~25–35% of frame width, centred on the motif or an orb. Shot B (1s later): only a soft ghost of it — **no crisp star lines** — while the central motif continues unchanged. Colour check: star strokes are muted pastel (clearly NOT white/neon) against the dark ground.
- **Step 3 (tangle stamps):** pin `{motif:13}`; shots 0.15s apart around a stamp: one shot crisp single-hue strands, the next ghost-dominant (crisp gone or residual few arms). Across a stamp boundary: fresh strands read ONE hue family while the soft cloud beneath still shows the PREVIOUS hue (two generations in one frame).
- **Step 4 (rest cycler):** pin `{rest:1, q29:5}`; shots at t, t+2, t+4: three DIFFERENT wireframe constructions (e.g. 6-ray star-net vs bowed-strand net vs 12-point star) in three different hues, each crisp over the previous one's fading ghost, on a flat static wash; lines clean (no audio jag).
- **Step 5 (handoff):** run 30s unpinned with shots every 0.5s (motif dwell 6–11s ⇒ 3–5 transitions). At a transition: NO frame where the whole motif is uniformly dimmed (the old dip); instead find the sequence crisp-old → ghost-only (~0.5–1s, no crisp centre) → small new motif → full-size new motif within ~0.5s.
- **Step 6 (anchor-seed):** pin `{motif:…}` switches via two pinrender runs, or unpinned transitions: the incoming motif's first crisp frames sit ON the old motif's position or an orb (not at an unrelated Lissajous point), then drift free over the following seconds.

Then ask the user to reload + watch one full cycle (~2 min) per step — the cadence FEEL (serene base + discrete punctuation) is the actual acceptance and only reads at full speed.

## 5. Risks & rollback

- **(4) shipped-behaviour changes (Steps 1, 5):** the every-beat tether flash and the q4 swap dip are user-seen. The wholesale motion/accessory rework was REJECTED (9ba675e) precisely because many behaviours changed at once — this doc's counter: one commit per step, user verification between steps, and the header confirmation question BEFORE starting. If the user dislikes the new tether cadence, `git revert` the Step 1 commit alone restores every-beat flashing (nothing later depends on the specific weights).
- **`dont-over-iterate-speculatively`:** do NOT tune scheduler weights/cadences repeatedly in one sitting. Land the measured numbers (0.8s min gap, 0.4–2s tether life, 1.3–2s tangle cadence, 1–2s rest cycling), show, adjust once on feedback.
- **What the user rejected that this touches:** bead rows/dots (NOT touched — no dots anywhere here); invented elements (every event type carries reference timestamps above); accessory-layer blast radius (Step 2 borrows `waves[1]` for 0.22s bursts only — if the pre-emption reads as accessory "blinking", lower the star-event weight rather than moving slots).
- **Colour guardrail (6):** all new strokes colour via `orbCol` on the q8 clock with bounded offsets; hue snaps move the EMITTER only, never the buffer (no retro-recolouring — A14 resolution). Star-stamp alpha ≤0.6 so the additive pileup can't blow white through the Reinhard knee (Pastel stays muted; memory `alchemy-measured-color-facts`).
- **Ghost-length ceiling:** A12's ≥7s ghosts and A13's paper-static ground are only approximated (~1–2s ghosts; wavy-fluid-adjacent wash) until the C2 per-scene displacement/freeze fields land — do not "fix" this here by touching decay/blur globally (that IS the rejected-rework class).
- **Scheduler starvation bug class:** if `f` never crosses 0.75 (quiet track), events stop — that is CORRECT (matches the refs' rests), but verify the corridor tether override still shows a tether so the corridor scene isn't emptied.
- Commit sequence (suggested messages in §3): 0 debug keys → 1 scheduler → 2 star stamps → 3 tangle stamps → 4 rest cycler → 5 handoff → 6 anchor-seed. Never squash — each must be independently revertible.

## 6. Acceptance criteria

- [ ] A discrete-event scheduler exists: at most ONE typed event fires per hit, min-spacing ≥0.8s, typical gap 1.5–4s in busy phases, ZERO events while `restAmt` is high (B2).
- [ ] The tether is punctuation, not a metronome: spawns as an event with 0.4–2s life every 1–4s when both orbs are up; silent in rests; still persistent in the corridor scene (B2/D1-prep).
- [ ] Hue snaps fire through the scheduler (same visual rate as today's rate-limited snap, now mutually exclusive with other events on the same hit).
- [ ] One-shot nested star stamps (8–12 points, 2–3 chromatic-offset copies, ~25–35% frame) appear occasionally over other scenes, crisp <0.3s, then only a ghost; anchored on the motif centre or an orb; muted pastel strokes (A12).
- [ ] Tangle (mode 13) lives as stamp events: one-hue crisp stamps at ~1.3–2s audio-gated cadence, geometry re-rolled per stamp, fresh hue over the previous generation's persisting cloud — trail hue never retro-changes (D7).
- [ ] On flat-wash rests, a sketchbook scene occurs: ONE wireframe motif re-stamps every ~1–2s cycling BOTH construction (≥3 distinct: star-net/net/12-star/tri-mandala) and hue, ghosts fading ~1s, no audio jag, static centre (A13).
- [ ] Motif swaps are handoffs: old emitter stops (≤0.2s), ~0.5–1s ghost-only interregnum, new motif blooms 25%→100% in <0.5s on a beat — the whole-frame dim dip no longer occurs (B4a).
- [ ] New motifs inherit an existing element's position at spawn (old centre or an orb) and release to free drift over ~4–6s (B4b).
- [ ] Budget unchanged: 4 waves + 4 shapes as per §2 ledger; no new q-vars; `node --check`, the concat smoke test, and `tools/selfrender.mjs` all pass; the user has live-verified Steps 1 and 5 specifically.
