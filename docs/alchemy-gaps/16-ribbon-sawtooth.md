# 16 — Zigzag ribbon scissor-X & sawtooth rod / serrated X

**Matrix items:** A9 (zigzag ribbon scissor-X, P2, 1080p) · A15 (sawtooth rod / serrated ribbon X, P3, 1080p)
· **Priority:** P2 (highest of the two)
· **Risk flags:** (2) faked-3D floor reflections REJECTED — appear in A9 evidence, gated behind confirmation ·
(6) Pastel stays muted · (4)-adjacent: A15 adds ONE accessory type — an incremental accessory-layer change, do it alone + user-verified.
· **Confirmation needed:** **YES** — one question, see below.

> **Confirmation question (A9 floor reflections):** A9's 1080p climax (h1, `still_126.5`) shows _dim floor
> reflections_ beneath the scissor ribbons. Faked-3D reflective water was previously rejected (risk 2). Should I
> (a) **skip reflections entirely [proposed default]**, or (b) build a subtle vertical-mirror ghost of the
> ribbons in the lower third at low alpha (a soft mirror, not a specular water plane)? Everything else in this
> doc ships without an answer; only Step 5 is blocked on it.

Cross-references (do NOT re-implement here): the **discrete "folding-screen" stamp fan** (A9) and the **serrated-X
accumulation** (A15) are both _trail/stamp_ phenomena — use the stamp-cadence + trail-freeze machinery specified
in **doc 03 (typed beat-event scheduler & stamp grammar)** and **doc 02 (stamp accumulation / freeze & sink)**.
This doc builds the two _emitters_; their persistence/accumulation is those docs' mechanisms.

---

## 1. Reference behaviour (what the original does)

### A9 — Coarse zigzag ribbon scissor-X ("folding screens") — P2, 1080p only

Evidence: **h1 M8 / S9** (`report_h1.md` L84-92, L144-149; frames `sheet_62_127.png`, `still_123.3`, `still_126.5`).

- **Scene:** true-black bg, **2–3 coarse zigzag ribbons** standing roughly vertical/diagonal, plus a full-diagonal
  dumbbell tether (out of scope here). Window ~121.8–127+ s. Camera still.
- **Ribbon anatomy (`still_123.3`):** a crisp **~2 px** white/hue zigzag _emitter_ with a small green **bead** at the
  leading tip, over a **fat soft after-ribbon ghost 15–25 px** in the ribbon's own hue.
- **Two displacement scales (key):** a **coarse triangle-wave** along the line — **period ~95–110 px** (~7% frame w),
  **amplitude ~90 px**, **7–9 apexes per frame-height** — whose **apex heights JITTER with audio**; the coarse period
  itself is a **clock** (fixed spatial pitch), not audio. A finer live jag rides on top.
- **Scissoring MOTION:** ribbons **pivot/swing about a shared crossing node ~(55%,45%)** like scissors,
  **~10–25°/s** swings. The pivot sweep **leaves 12–20 discrete per-frame stamp copies** (the "folding-screen" fan),
  each **stamp life ~0.3–0.5 s**.
- **Colour:** per-ribbon distinct hues — **green / red-pink / cyan-white / gold**; soft after-glow keeps the ribbon's
  hue (hue-frozen trail). Muted, on black.
- **Emitter vs trail:** the crisp 2 px zigzag = **emitter** (waves[0]); the fat 15–25 px ghost + the 12–20 stamp fan =
  **trail** (feedback decay + stamp cadence, docs 02/03).
- **Reflections:** "dim floor reflections below" at the climax (`still_126.5`) — the risk-(2) element.

### A15 — Sawtooth rod / serrated ribbon X — P3, 1080p only

Evidence: **h2 §2.9 / §2.10** (`report_h2.md` L144-152; scene rows L25-33; frames `rod_143.6`, `wf146_stack`).

- **Sawtooth rod (S4, t≈143–145):** a **straight ribbon ~20–25 px wide translating diagonally (~55°)** _through a
  stationary urchin ball_ — **counter-motion**: the rod moves, the ball is still. Body mint/white; a **RED square-wave
  zigzag core bounces between the ribbon's two edges, step period ~30 px**. The pattern is **REGULAR = a CLOCK texture,
  explicitly NOT audio** (h2 §2.9).
- **Serrated ribbon X (S5, t≈145.5–148.5):** RGB-offset copies of the rod + feedback thickening **grow into** two thick
  beams of RGB-layered strands (green/pink/cream) with **chevron teeth along the edges**; teeth are **stable
  frame-to-frame = STAMPED, not live** (h2 §2.10). Crossing ~60°/shallow; breathes/thickens via feedback; drifts
  up-left ≤2%/s. Spawn is a **beat event** (a separate live-audio tether crosses at t≈146.25; that tether is out of
  scope — it's the tether doc).
- **Emitter vs trail:** the rod = **emitter** (one wave); the serrated X = its **feedback accumulation** (trail, doc 02).
  Lifecycle: rare, ~2 s crisp then stacked sinking copies ~2 s more.

**Faithfulness note (per guardrail memories):** BOTH the A9 coarse envelope and the A15 rod core are **CLOCK textures
(fixed spatial sawtooth/triangle), NOT re-jagging audio waveforms.** Only A9's _fine_ jag and _apex-height breathing_
are audio. Do not drive the coarse chevron / square-wave from `a.value1`. (Contrast: fMountains/fUrchin are
fully audio — see §2.)

---

## 2. Current implementation state

**A9 nearest mode — `fCrossX` (motif mode 3), `presets/alchemy-v7.js` L453-472** (verified):

- Two beams packed into ONE wave by sample-split (`half<0.5` vs `≥0.5`), fixed at **±45° (`ang = ±0.7854`)** — **no
  scissor pivot**.
- Displacement is **fine live jag only** (`jag = a.value1 * q6 * 2.2`) — **no coarse triangle-wave clock envelope**,
  **no audio apex-height breathing** as a separate scale.
- Colour is a **rainbow spread along one beam** (`h = q8 + a.sample*0.25`, RGB via `orbCol` +0/+0.33/+0.67) — WRONG
  for A9, which wants **per-ribbon DUO hues**, not a per-sample rainbow.
- No stamp fan (relies on the shared feedback trail only). MODE index **3**, `MODE_ALPHA[3] = 0.7` (L830),
  `MOTIF_BAG` weight **1** (one `3` at L924). Dispatched via `MODES` (L807-825) on **waves[0]**.

**A9 contrast mode — `fMountains` (mode 14), L743-763** (verified): stacked horizontal ridgelines with peaks =
`Math.abs(a.value1) * (q6*3.2)` — a **fully audio** sawtooth. Confirms the engine has _no_ clock-driven (spatial,
fixed-pitch) triangle/sawtooth displacement anywhere; A9's coarse envelope is a **new displacement kind**.

**A15 — no existing element.** The urchin ball is mode 2 (`fUrchin`, L438-451, waves[0]); there is no translating rod
and no serrated-X prop.

**Accessory slot (where A15 goes):** `accLine` on **waves[1]** (L895, director L1063-1096) currently picks ids
**0 none · 1 ray-curtain · 2 waveform-bundle · 4 pinwheel** (id 3 retired). **Id 5 is reserved by doc 02** (A3 harp
swath) — so A15's rod uses **id 6**.

**Hard constraints (verified against catalog §7 + code):**

- **4 waves:** [0] motif (A9 lives here, extending mode 3) · [1] accessory (A15 rod lives here, new type) · [2] tether ·
  [3] corridor dots. **No new wave slot.**
- **4 shapes:** fully committed to orbs; **both A9 and A15 are LINE elements → zero shape-slot cost.**
- **32 q-vars all taken** (catalog q-var contract). Neither item needs a new q-var: both ride **`q9`** (global time
  proxy, `t.q9 = time*0.06` at L1017, propagates into point_eqs — confirmed used in point_eqs, e.g. `fFluffBall`
  L791). q9 is set globally every frame regardless of which motif is up, so it is a safe clock for the A15 accessory too.
- **Pastel muted** (risk 6): per-ribbon DUO hues off the `orbCol` cosine palette on the q8 clock; no full-saturation
  rainbow; the A15 red core stays a muted contrast hue, not neon.

---

## 3. Implementation plan

Smallest slice first; **one commit per step**; each step is independently shippable and revertable.

### Step 1 — A9: coarse triangle-wave clock envelope + audio apex breathing (extend `fCrossX`, no scissor yet)

Rework `fCrossX` (L453-472) to add the **second displacement scale** and fix the colour. Still fixed ±45° beams.
Revert gate: if the ribbon reads as noise instead of a clean chevron, drop `nTeeth`/`coarseAmp` back and re-verify.

```js
function fCrossX(a) {
  var NRIB = 2; // 2 ribbons packed by sample-split (bump to 3 later)
  var fk = (a.sample || 0) * NRIB,
    rib = Math.floor(fk),
    u = fk - rib; // u = 0..1 along THIS ribbon
  var s = u * 2 - 1; // -1..1 along the beam axis
  var ang = (rib ? 1 : -1) * 0.7854; // ±45° (scissor swing added in Step 2)
  var ct = Math.cos(ang),
    st = Math.sin(ang);
  var len = (a.q5 || 0.4) * 1.6;
  // --- TWO displacement scales ---
  var nTeeth = 7; // 7-9 apexes; period ~ len/7 (clock, fixed)
  var tri = Math.abs(((u * nTeeth) % 1) * 2 - 1) * 2 - 1; // triangle CLOCK, -1..1 (NOT audio)
  var coarse = tri * (a.q5 || 0.4) * 0.28; // apex amp rides q5 => breathes with bass
  var fine = (a.value1 || 0) * (a.q6 || 0.05) * 1.4; // fine LIVE jag on top
  var perp = coarse + fine;
  var cx = a.q2 !== undefined ? a.q2 : 0.5,
    cy = a.q3 !== undefined ? a.q3 : 0.5;
  a.x = cx + s * len * ct - perp * st;
  a.y = cy + s * len * st + perp * ct;
  var h = (a.q8 || 0) + (rib ? 0.42 : 0.0); // per-ribbon DUO hue (muted; NOT a per-sample rainbow)
  a.r = orbCol(h, 0);
  a.g = orbCol(h, 0.33);
  a.b = orbCol(h, 0.67);
  if (u < 0.02 || u > 0.98) a.a = 0; // hide ribbon-to-ribbon connector + tips
  return a;
}
```

No MODES/MODE_ALPHA/bag change (still mode 3). Optionally raise `MODE_ALPHA[3]` toward the fat-ghost look later.

### Step 2 — A9: scissor pivot about the shared node (counter-rotating half-beams)

Make the two ribbons swing like scissors. `q9` is the smooth time proxy already in point_eqs — no new q-var.
Revert gate: if the swing looks mechanical/too fast, reduce amp/rate; keep the node fixed at (q2,q3).

```js
var swing = 0.35 * Math.sin((a.q9 || 0) * 3.2); // ~±20°, ~10-25°/s at q9=time*0.06
var ang = (rib ? 1 : -1) * (0.7854 + swing); // ribbons open/close about (cx,cy)
```

(The node is the shared centre (q2,q3) — matches the ref's ~(55%,45%) crossing.)

### Step 3 — A9: discrete "folding-screen" stamp fan — **via doc 03 + doc 02, not re-implemented here**

The 12–20 crisp per-frame stamp copies (life ~0.3–0.5 s) are a **stamp-cadence** phenomenon over a **frozen trail**.
Register mode-3 as a client of the doc-03 stamp scheduler (short cadence, ~0.3–0.5 s stamp life) and let doc-02's
trail-freeze hold the copies. Do NOT invent a per-copy renderer here (would burst the wave budget). If docs 02/03
aren't yet implemented, ship Steps 1–2 and mark Step 3 **blocked-on-doc-03**. Revert gate: none — it's additive
config on the scheduler; back out the mode-3 client registration if the fan looks cluttered.

### Step 4 — A15: sawtooth rod accessory (new `accLine` type **6**, waves[1])

Add a translating clock-sawtooth rod. Route through the existing accessory director (L1063-1096) with a **LOW**
weight (P3, rare). It reads as counter-motion whenever a static ball motif (urchin mode 2) is up. The **serrated X
is a free consequence** of the rod's translation into the feedback trail (doc 02) + Step-2 scissoring — do not draw
it separately.

- **Director change (L1067):** extend the pick to include id 6 at low probability, e.g.
  `accLine = rl < 0.30 ? 0 : rl < 0.50 ? 1 : rl < 0.70 ? 2 : rl < 0.90 ? 4 : 6;` (id 6 ≈ 10%). Optionally bias id 6
  higher when the current motif is 2 (urchin) so it lands as the counter-motion prop.
- **point_eqs sketch (waves[1] when `accLine===6`):**

```js
function fSawRod(a) {
  var s = a.sample || 0; // 0..1 along the rod
  var ang = 0.96,
    ct = Math.cos(ang),
    st = Math.sin(ang); // ~55°
  var t = s * 2 - 1,
    len = 0.9; // full-frame diagonal
  var steps = 16; // square-wave core, ~30px step (CLOCK, NOT audio)
  var sq = Math.floor(s * steps) % 2 ? 1 : -1;
  var perp = sq * 0.028; // core bounces edge-to-edge, ribbon ~20-25px wide
  var slide = (((a.q9 || 0) * 0.35) % 1) * 0.6 - 0.3; // TRANSLATE diagonally over time (q9 time proxy)
  var cx = 0.5,
    cy = 0.5; // rod is not motif-anchored; crosses centre field
  a.x = cx + t * len * ct - perp * st + slide * -st;
  a.y = cy + t * len * st + perp * ct + slide * ct;
  var h = (a.q8 || 0) + 0.5; // muted RED-ish contrast core (risk 6: keep it muted)
  a.r = orbCol(h, 0);
  a.g = orbCol(h, 0.33);
  a.b = orbCol(h, 0.67);
  if (s < 0.02 || s > 0.98) a.a = 0;
  return a;
}
```

Wire `fSawRod` into the waves[1] point_eqs dispatch alongside curtain/bundle/pinwheel; gate its alpha by `accVis`
like the other accessories. Revert gate: if the rod competes with the motif, cut its weight to ~5% or restrict to
motif===2 only.

### Step 5 — A9 floor reflections — **BLOCKED on the confirmation question (risk 2)**

Do NOT build until the user answers. If (b): a subtle **vertical-mirror ghost** — sample the trail buffer mirrored
about a horizon line in the lower third at low alpha in the COMP shader (a soft mirror, not a specular water plane).
This is a COMP change; ship it strictly alone (risk 4). If (a): close the item as "intentionally omitted."

---

## 4. Verification recipe

Per step, before asking for a reload:

```bash
cd /Users/sujitk/projects/personal/ytmusic-wmp-visualizer
for f in presets/*.js viz.js content.js; do node --check "$f" || break; done   # or: npm test
# concat/frame_eqs smoke test (CLAUDE.md — shared global scope, build all presets, run each frame_eqs):
node -e 'const fs=require("fs"),vm=require("vm");global.window=global;
  const cat=["kit","dance","alchemy-v7","ambience","battery"].map(f=>fs.readFileSync("presets/"+f+".js","utf8")).join("\n;\n");
  vm.runInThisContext(cat);
  let n=0; for(const [k,p] of Object.entries(window.WMP_PRESETS)){ if(p.frame_eqs) p.frame_eqs({time:2,bass:1.3,bass_att:1.1,mid:1,treb:1,treb_att:1}); n++; }
  console.log("ok", n, "presets");'
```

Also exercise the point_eqs directly (they are pure JS, Node-checkable): call `fCrossX`/`fSawRod` with a fake
`a = {sample:0.3, value1:0.4, q2:0.5,q3:0.5,q5:0.4,q6:0.05,q8:0.2,q9:12}` and assert `a.x/a.y` are finite and within
~[0,1]. GLSL (Step 5 only) cannot compile in Node — pre-check via the ANGLE headless path (CLAUDE.md).

**Self-render (see it without the user):** `node tools/selfrender.mjs`, pinning the motif via the scratchpad
`pinrender.mjs` which sets `window.__ALC_FORCE` — **q30 = 3** for A9 (fCrossX). For A15, force the accessory: pin
`accLine = 6` (add a `__ALC_FORCE.accLine` override next to the q30 pin) and q30 = 2 (urchin) to see counter-motion.

**One screenshot-visible acceptance check per step:**

- Step 1: the ribbon shows a **regular chevron** (count ~7 apexes) whose apex heights pulse with bass, with fine
  jaggedness on top — not pure noise.
- Step 2: the two ribbons **open and close** about the centre (scissor), ~1 swing / few seconds.
- Step 3: a **fan of discrete crisp ghost copies** trails the swing (folding-screen look), each fading in <0.5 s.
- Step 4: a **straight ribbon with a stepped core** slides diagonally across a static urchin; a **serrated X**
  builds in its wake.
- Step 5: (if built) a **dim mirrored ghost** of the ribbons in the lower third — no hard specular line.

---

## 5. Risks & rollback

- **(2) Floor reflections — HARD confirmation gate.** A9 evidence shows them; the class was rejected. Steps 1–4 ship
  without them; Step 5 is fenced behind the user's answer and, if built, ships alone as a COMP change.
- **(6) Pastel muted.** Per-ribbon DUO hues and the red rod core stay on the `orbCol` q8 palette; verify against the
  480p-accurate colour before accepting (memory `alc-colors-were-washed-out`). No full-sat rainbow.
- **(4)-adjacent — accessory-layer change (A15).** Adding one accessory type to the existing director is the
  _allowed_ incremental path (not a wholesale rework); still land it alone and user-verify. Do not also retune the
  other accessory weights in the same commit.
- **Budget.** No new wave/shape slot; no new q-var (both ride q9). If a step tempts you to add a slot, stop — route
  through the existing slots or drop the sub-feature.
- **Faithfulness.** Keep the coarse envelope / rod core as CLOCK textures; do not "improve" them into audio waveforms
  (memory `alc-faithfulness-no-invented-elements`).

**One commit per step (suggested messages):**

1. `alchemy: A9 crossX — coarse triangle-clock envelope + audio apex breathing + per-ribbon duo hue`
2. `alchemy: A9 crossX — scissor pivot (counter-rotating half-beams about the node)`
3. `alchemy: A9 crossX — folding-screen stamp fan via the beat scheduler (doc 03/02)`
4. `alchemy: A15 — sawtooth rod accessory (accLine type 6); serrated-X emerges from feedback`
5. `alchemy: A9 — dim ribbon floor-mirror ghost (COMP)` ← only after user confirms

Rollback is `git revert <step>`; steps are ordered so reverting a later one leaves earlier ones intact
(Step 2 depends on Step 1's rewrite; revert 2→1 in that order if backing both out).

---

## 6. Acceptance criteria (observable, vs the references)

**A9 (vs h1 S9 / M8):**

- [ ] The crossed-X motif shows a **coarse chevron/zigzag** (~7–9 apexes across its span), not just fine jag.
- [ ] Apex **heights breathe with the audio**; the coarse **pitch stays constant** (clock), the fine jag re-shuffles live.
- [ ] Two (or three) ribbons **scissor** — pivot open/closed about a shared central node.
- [ ] A crisp thin emitter sits over a **fat soft same-hue ghost**; the pivot leaves a **fan of discrete stamp copies**.
- [ ] Ribbons carry **distinct muted per-ribbon hues** (DUO/quad), not a per-sample rainbow; trail hue is frozen.
- [ ] Reflections: either intentionally absent (option a) or a **soft mirror** in the lower third (option b) — never a
      hard specular water plane.

**A15 (vs h2 §2.9 / §2.10):**

- [ ] A **straight ribbon** with a **regular stepped (square-wave) core** translates diagonally across the field.
- [ ] It reads as **counter-motion** against a static motif (best when the urchin, mode 2, is up).
- [ ] The core texture is **regular (clock)**, not audio-jagged.
- [ ] A **serrated / chevron-edged X** accumulates in the rod's wake via feedback (not a separately drawn element).
- [ ] Rare — appears occasionally via the accessory director, not every scene.
- [ ] Colour muted; the red core is a contrast hue on the q8 palette, not neon.
