# 15 — Travelling elements: comet head · snake-worm · swimmer stalks · sail/kelp blade

**Matrix items:** A6 (travelling comet head, P2) · A21 (snake-worm / waveform-worm, P3) · A19 (sail/kelp blade + vertical smoke strands, P3) · A11 (swimmer stalks with morphing orb heads, P3)
**Priority:** A6 = P2 (build first); A21/A19/A11 = P3.
**Risk flags:** A6 (1) — the streaming tail MUST come from feedback ghosts / stamped copies, NEVER a drawn dot bead-chain (h0 describes "dotted bead-chain comets"; drawn bead rows were removed 2026-07-04 as "so ugly, remove", commit `bad7755`). A11 (2) — the refs show a blurred floor-reflection smear under each stalk; **omit it** (standing rule: skip reflections without user sign-off). A19/A21 — none.
**Confirmation needed:** **No.** Proceed with feedback-ghost tails (A6) and omit stalk reflections (A11) per the standing rules above. One latent question, raise ONLY if a literal dotted tail is later wanted: _"A6's comet tail is a fading same-hue feedback ghost, not a drawn dotted bead-chain — is that acceptable, or do you want the dotted-bead tail back (it was previously removed as ugly)?"_

---

## 1. Reference behaviour (what the original does)

Four distinct "something moves and leaves a body" figures. The load-bearing distinction (from `gap-matrix-v2.md` A21): a **comet** is a LARGE motif that translates leaving a feedback tail; a **worm** is a SMALL thin waveform ribbon whose _body IS its own feedback trail_, head ≈ one glow dot. Emitter-vs-trail is explicit below.

### A6 — Travelling comet head (P2, both videos)

- **p0 M11** (`report_p0.md` L73-74, stills 59.5/60.3): a crumple-net ball (crimson mesh, **130–160px**) travels **lower-left → upper-right at ~30% frame-width/s** (t=59.25→60.5, so it crosses in ~3s), a salmon fuzz tail streaming behind (**~250px, widening/blurring**); cyan squiggles overlay the head. Camera STILL, flat sea-green wash under it (p0 L14). _The tail is the head's own blur/feedback wake_, not drawn beads.
- **h0 O6** (`report_h0.md` L241-242, L227-228): "comet/caterpillar chain-head = 70–150px elongated blob + dotted bead tail" (t=10 red; 64.25 yellow-green); h0 L228 "shrink with distance → comet-with-dotted-tail". **This is the risk-(1) evidence** — h0 _sees_ the tail as discrete beads; we render it as feedback ghosts / discrete stamped copies (h2 2.4's "stamped copies") instead of drawn dots.
- **Emitter vs trail:** head = the live motif (waves[0]) re-positioned along a travel path; tail = feedback trail (decay is already 0.957; bump it during travel). No new element.

### A21 — Snake-worm / waveform-worm (P3, recurs in FOUR reports)

- **h2 2.6** (`report_h2.md` L120-122, t≈133–137): "Thick pink fuzzy S-curve strand **~12px wide, ~230px long**, wobbling vertically; **green glow-dot head ~30px = the emitter; the pink body is its trail.** 1–2 present at once, near frame top/edges." — the canonical description.
- **p1 S13** (`report_p1.md` L193, t=111.0–111.7): "a **waveform worm** with a cyan end bead" (during a decay-to-rest, i.e. near-silence).
- (also p3 S6 @222.3 diagonal streak → S-worm → dash-worm wallpaper rows; p2 S5b "snake wiggle line".)
- **Emitter vs trail:** head = a small bright (green) glow following the travel path; body = a short **live** waveform ribbon (real `a.value1` jag) that the feedback smears into the fuzzy pink S-curve. Head is the emitter, body is trail — same grammar as the comet but small-scale.

### A19 — Sail / kelp blade + vertical smoke strands (P3, both videos)

- **p3 D-SAIL** (`report_p3.md` L130-136, t=185–195): "tall curved blade, **full frame height, ~60–80px wide at base tapering to ~10px**; crisp 2px edges, interior filled with a **fan of 15–20 parallel hairlines converging to a bottom corner**. Chromatic doubling (blue+magenta edge pair @189.3; gold + cyan @191.5). **Waves/flexes slowly in place like kelp** (tip drifts ~20px over 2s); **NOT audio-jagged (smooth → clock-driven)**. Persists ~9s." — **faithfulness exception:** this element is CLOCK-driven `sin()`, not real-waveform jag (the "zigzag = real waveform" rule is for jagged motifs; this ref is explicitly smooth).
- **p1 S5** (`report_p1.md` L76-77, t=72–75.5): "2–3 vertical **smoke strands**: 1.5–2px, **~75% tall, colour-GRADIENT along length (green base → yellow → pale top)**, swaying (clock, ~0.3 Hz), older copies displaced sideways = sway trail."
- **Emitter vs trail:** live element = the sail/strand geometry; the "sway trail" (sideways-displaced older copies) is feedback. Along-length colour gradient is the novel bit — v7 colours per-strand/per-sample offset but never _gradient-along-a-vertical-figure_.

### A11 — Swimmer stalks with morphing orb heads (P3, both videos)

- **r0 2.3** (`report_r0.md` L37-41, t=8.2–12.6, best 9.85): "vertical **coil column** (stack of 4–6 soft rings 40–55px wide, slinky-like) + orb head. 2–3 swimmers at once, heights **35–60% of frame**. **Snakes/sways in place, S-flex period ~1.5–2s, amplitude ~15–25px; NO travel.** Head **MORPHS every ~1–2s** on the SAME stalk: blue disc w/ green ring → pagoda of 2–3 squashed discs → jellyfish bell → violet glow ball → milky plume. Floor shows blurred mirrored reflection smears (→ **OMIT**, risk 2)." Live green waveform sprigs from the head.
- **p0 M3** snaking stalk (5.8–8.5); **h1 O7** sprout-bulb comet — corroborating.
- **Emitter vs trail:** the stalk is a live figure that sways in place (does not travel); its trail is just the normal feedback wake. Head morph = per-orb-anatomy cycling (depends on the A16 anatomy descriptors — doc 07 step 4).

---

## 2. Current implementation state

Verified against `presets/alchemy-v7.js` @ `302349c`.

- **No traveller crosses the frame.** The motif centre is a small ±0.12 Lissajous only: `t.q2/t.q3` at **L1011-1012** (`0.5 + 0.12*sin(time*0.045)…`). Nothing translates LL→UR; no travel director exists (contrast the corridor/valley scene eases, catalog §3).
- **The only "traveller-ish" infrastructure is the orb SNAKE-wobble** (`frame()` **L1025-1038**): the two orbs orbit on `axis=time*0.05` with incommensurate wobble sines `snA/snB` (periods ~2.6s/1.5s) so their feedback trails paint S-curves. This is the closest prior art for "moving anchor + trail = curve", and the code comment (L1028-1032) already frames it that way. **Caveat:** doc 07 step 3 (D15 staging) proposes to REPLACE this snake wobble with parked-post/slide staging — coordinate; A6/A21 below drive the MOTIF centre or an accessory, not the orbs, so they do not collide with that rework.
- **fTangle** (**L720-740**) is a golden-angle curly-strand fan around `(q2,q3)` with `a.value1` audio jitter — the natural motif to _carry_ on the comet travel path (p0 M11's comet head IS a crumple-net/tangle ball).
- **Accessory slot waves[1]** (**L1167-1265**) already multiplexes on the closure var `accLine` (declared **L895**, shared scope with `frame_eqs`): `0 none · 1 ray-curtain · 2 waveform bundle · 4 pinwheel`, picked every 5–11s (**L1063-1075**, table at **L1067**). The **waveform bundle** (**L1246-1261**) is exactly the waveLine-with-live-jag primitive the worm/sail reuse — 3 chromatic strands on a drifting Y rail. **This slot is the home for A21 + A19.**
- **waves[3]** (**L1288-1331**) is the corridor ring-dot row, gated to bgMode 3, idle otherwise — and carries the loud "BEAD-ROW ACCESSORY REMOVED" note (**L1292-1297**). **Do not put any traveller tail here as dots.** (Also: doc 07 step 5 claims waves[3] for the orb-ring multiplexer — leave it to that cluster.)
- **Absent:** comet travel, worm, sail/kelp, smoke strands, swimmer stalks — none exist.

---

## 3. Implementation plan

Smallest slice first. **Slot budget is the hard constraint** — see the box after the steps. Each traveller reuses existing q-vars (all 32 are taken; none free) by re-purposing the motif-centre / accessory q-vars during its event.

### Step 1 — A6 comet: travel director on the motif centre (P2, NO new slot)

The comet head IS the current motif (waves[0]); we only change where it lives and lengthen the trail. Add closure state near the other directors (~L895): `var cometNext = 15, cometT0 = -99, cometAmt = 0, cometFromX, cometFromY, cometToX, cometToY;`. In `frame()` just before setting `t.q2/t.q3` (L1011):

```js
// A6 comet: occasionally the motif TRAVELS across the frame (crumple-net ball, ~3s LL->UR),
// its feedback wake = the salmon tail (NO drawn beads). Calm-gated, prefers net/tangle motifs.
if (time >= cometNext) {
  var canComet = (mCur === 7 || mCur === 13) && energy < 1.2 && corridorAmt < 0.1 && restAmt < 0.2;
  if (canComet && Math.random() < 0.5) {
    cometT0 = time; // start a ~3.3s traverse (30% frame-width/s -> full frame ~3.3s)
    var edge = Math.random(); // pick opposite corners
    cometFromX = edge < 0.5 ? 0.12 : 0.88;
    cometFromY = 0.85;
    cometToX = 1 - cometFromX;
    cometToY = 0.15;
    cometNext = time + 26 + Math.random() * 20; // rare (~26-46s)
  } else cometNext = time + 8 + Math.random() * 8;
}
var cp = (time - cometT0) / 3.3; // 0..1 traverse progress
cometAmt = cp >= 0 && cp <= 1 ? Math.sin(cp * 3.14159) : 0; // ease in/out (0 at endpoints hides the pop)
```

Then blend the travel target over the Lissajous (replace L1011-1012's assignment tail):

```js
var lisX = 0.5 + 0.12 * Math.sin(time * 0.045) + 0.05 * Math.sin(time * 0.017 + 1.0);
var lisY = 0.5 + 0.09 * Math.cos(time * 0.038) + 0.05 * Math.sin(time * 0.021 + 2.0);
var trav = cp >= 0 && cp <= 1 ? Math.max(0, Math.min(1, cp)) : 0; // 0..1 position along the path
t.q2 = lisX + cometAmt * (cometFromX + (cometToX - cometFromX) * trav - lisX);
t.q3 = lisY + cometAmt * (cometFromY + (cometToY - cometFromY) * trav - lisY);
```

Tail = feedback: while `cometAmt > 0`, bump decay so the wake stretches into the ~250px salmon tail (coordinate with doc 01's decay handling — do NOT double-drive q1): near L973/decay assignment, `if (cometAmt > 0.05) t.q1 = 0.97 + 0.005*cometAmt;` (longer trail, same hue → the tail is automatically the head's colour). No new wave/shape/q-var.
**Scheduled as:** its own rare event clock, gated to net(7)/tangle(13) motifs + calm.
**Revert gate:** pin `window.__ALC_FORCE = { }` won't touch it; to disable, set `cometNext = 1e9` at declaration (one-line) or pin a debug flag (Step 0 below). One commit; if the tail reads as beads or the pop is visible, revert.

### Step 0 (tiny, do with Step 1) — extend the debug hook for travellers

The self-render hook (**L1136-1140**) only copies q-vars onto `t`; `cometAmt`/`accLine` are closure vars. Add right after the `for(fk in F)` loop, mirroring doc 07 step 0:

```js
if (F.cometForce) {
  cometT0 = time - 1.65;
} // pin mid-traverse for a screenshot
if (F.accLine !== undefined) {
  accLine = F.accLine;
  accLineArm = false;
}
```

so `pinrender.mjs` can force a worm/sail/comet on demand.

### Step 2 — A21 snake-worm: accessory mode on waves[1] (P3)

Add `accLine` id **5** to the picker (**L1067**), re-weighting into more buckets, e.g.:
`accLine = rl<0.30?0 : rl<0.48?1 : rl<0.64?2 : rl<0.80?4 : 5;` (worm p≈0.20). On pick (L1071-1073) also set a worm travel path: `accWormT0 = time; accWormFromX/Y, accWormToX/Y` (a short 0.3–0.5-span diagonal near a frame edge). In waves[1] `point_eqs`, add a branch (after the `accLine===2` block, ~L1261):

```js
if (accLine === 5) {
  // SNAKE-WORM: short live-jag ribbon that travels; head = bright leading edge, body = its feedback wake
  var wp = a.q_time_or_use_closure; // use the closure travel progress (0..1) captured in frame_eqs into a q-var, e.g. q26 spare-window
  var s = a.sample || 0; // 0 tail-end .. 1 head-end of the ~230px ribbon
  var baseX = accWormX,
    baseY = accWormY; // current head position (closure, moved in frame_eqs)
  var along = (s - 1) * 0.11; // ~230px body trailing the head
  var jag = (a.value1 || 0) * 0.03 * s; // REAL-waveform S-wobble, strongest toward the head
  a.x = baseX + along * Math.cos(accWormAng) + jag * Math.cos(accWormAng + 1.5708);
  a.y = baseY + along * Math.sin(accWormAng) + jag * Math.sin(accWormAng + 1.5708);
  var hw = (a.q8 || 0) + 0.33; // green-lean head vs pinkish body via feedback ageing
  a.r = orbCol(hw, 0) * 0.9;
  a.g = orbCol(hw, 0.33) * 0.9;
  a.b = orbCol(hw, 0.67) * 0.9;
  a.a = (0.35 + 0.55 * s) * accVis; // brighter head (s->1) = the glow-dot emitter; body dimmer, feedback fills it
  return a;
}
```

Head glow-dot = the bright leading samples (additive) + feedback bloom — **no orb stolen, no drawn dot.** The pink fuzzy body is painted by decay (already 0.957). `accWormX/Y/Ang` are advanced in `frame_eqs` along the travel path (like the bundle's `accLineY` drift, L1088).
**Scheduled as:** accessory-director pick (own 5–11s clock). **Revert gate:** remove id 5 from the picker line (one edit); pin `F.accLine=5` to verify. One commit.

### Step 3 — A19 sail/kelp blade + smoke strands: accessory mode on waves[1] (P3)

Add `accLine` id **6** (sail) with a LONGER dwell when picked (`accLineNext = time + 9 + Math.random()*2;` on the sail branch — it persists ~9s, L136). In waves[1] `point_eqs`, add:

```js
if (accLine === 6) {
  // SAIL/KELP: tall curved blade, fan of hairlines to a bottom corner, SMOOTH clock-flex (NOT audio)
  var S = 18,
    fk = (a.sample || 0) * S,
    strand = Math.floor(fk),
    u = fk - strand; // 18 hairlines
  var baseX = accLineX,
    baseY = 0.9; // fan converges at a bottom corner
  var topY = 0.1,
    topX = baseX + 0.1 * (strand / S - 0.5); // spread ~80px at top
  var flex = 0.06 * Math.sin(time * 0.9 + u * 2.0); // clock kelp-flex, NOT a.value1
  a.x = baseX + (topX - baseX) * u + flex * u;
  a.y = baseY + (topY - baseY) * u;
  var hg = (a.q8 || 0) + 0.15 + 0.35 * u; // COLOUR-GRADIENT ALONG LENGTH (base->tip), the A19 novelty
  a.r = orbCol(hg, 0) * 0.8;
  a.g = orbCol(hg, 0.33) * 0.8;
  a.b = orbCol(hg, 0.67) * 0.8;
  a.a = (u < 0.03 ? 0 : 0.45) * accVis;
  return a;
}
```

Smoke-strand variant = the same branch with `S=3` (few strands) and the flex reused — or fold in as a coin-flip inside id 6. The sideways sway-trail comes free from feedback. **Faithfulness note in code:** flex is `sin()`, deliberately not `a.value1` (this ref is smooth — see §1). **Revert gate:** remove id 6. One commit.

### Step 4 — A11 swimmer stalks: new motif mode on waves[0] (P3, LAST)

Add a motif mode (extend `MODES` L807, `MODE_ALPHA` L827, `scaleFor` L832, and `MOTIF_BAG` L923 weight ~1). It draws 1–3 vertical coil columns that **sway in place** (no travel — this is a motif, not a traveller-director):

```js
function fSwimmer(a) {
  // vertical slinky column: rings stacked bottom->top, S-flex sway
  var COLS = 2,
    N = 64,
    fk = (a.sample || 0) * COLS,
    col = Math.floor(fk),
    s = fk - col;
  var cx = (a.q2 || 0.5) + (col - (COLS - 1) / 2) * 0.22; // 2 stalks flanking the centre
  var ang = s * 6.2832 * 5; // 5 rings stacked (slinky)
  var yTop = (a.q3 || 0.5) - 0.3,
    yBot = (a.q3 || 0.5) + 0.3; // ~60% frame tall
  var sway = 0.05 * Math.sin(a.time * 0.6 * 3.14159 + s * 3.0); // S-flex 1.5-2s, in place (clock)
  var ringR = (a.q5 || 0.4) * 0.16 * Math.cos(ang);
  a.x = cx + ringR + sway;
  a.y = yBot + (yTop - yBot) * s;
  var h = (a.q8 || 0) + s * 0.12;
  a.r = orbCol(h, 0);
  a.g = orbCol(h, 0.33);
  a.b = orbCol(h, 0.67);
  a.a = 0.5;
  return a;
}
```

The **morphing orb head** rides on top: re-anchor orb A to `(cx, yTop)` during this mode and cycle its anatomy every ~1–2s — this **depends on doc 07 step 4** (A16 anatomy descriptors). Until doc 07 lands, ship the stalk with the plain existing orb head. **OMIT floor reflections** (risk 2). The green waveform sprig from the head = a short live-jag segment on the head anchor (fold into fSwimmer's top samples, no extra slot). **Revert gate:** remove the mode from `MOTIF_BAG` (leave the function). One commit; pin `F.q30=<newId>` to verify.

### HARD constraints (state which slot each traveller borrows, and when)

- **4 custom waves** (vendor cap): `waves[0]`=motif (A6 rides it; A11 = a new motif MODE of it) · `waves[1]`=accessory (A21 worm = id 5, A19 sail/smoke = id 6 — **one at a time**, mutually exclusive with curtain/bundle/pinwheel) · `waves[2]`=tether (untouched) · `waves[3]`=corridor rings (**untouched — do NOT put tails here; claimed by doc 07 step 5**).
- **4 custom shapes** all committed to the orb pair + halos. **No traveller borrows a shape.** Comet head = the motif; worm head = bright wave samples + feedback bloom; swimmer head = the _existing_ re-anchored orb (no new shape). No filled bead, no drawn dot.
- **Dots stay ~2px fixed** → **no drawn bead tails anywhere.** A6 tail + A21 body are FEEDBACK ghosts / stamped copies (decay 0.957, bumped to ~0.97 during comet travel). This is the entire risk-(1) mitigation.
- **32 q-vars all taken** → travellers add NONE. A6 re-purposes q2/q3 (motif centre) during its event; A21/A19 read `accLine` (closure) + q8 (hue) + `a.value1`; A11 reads the motif q-vars (q2/q3/q5/q8/q9). Any transient scalar (worm progress) rides an already-spare _window_ of an existing q-var or a closure var, not a new q.
- **Pastel muted:** all traveller colours come from `orbCol(q8+offset)` on the shared hue clock; keep additive alphas ≤0.5 so the Reinhard tone-map (comp) compresses highlights — no neon head, no blown-white tail.

---

## 4. Verification recipe

Run per step, before asking for any live reload.

```bash
# 1. syntax
node --check presets/alchemy-v7.js

# 2. concat + build + run every frame_eqs (CLAUDE.md smoke — catches missing closure refs / throwing eqs).
#    NOTE the file is alchemy-v7, and it registers under window.WMP_PRESETS.
node -e 'const fs=require("fs"),vm=require("vm");global.window=global;
  const cat=["kit","dance","alchemy-v7","ambience","battery"].map(f=>fs.readFileSync("presets/"+f+".js","utf8")).join("\n;\n");
  vm.runInThisContext(cat);
  let n=0; for(const [k,p] of Object.entries(window.WMP_PRESETS)){ if(p.frame_eqs) p.frame_eqs({time:2,bass:1.3,bass_att:1.1,mid:1,treb:1,treb_att:1,frame:120}); n++; }
  console.log("ok", n, "presets");'
```

Then self-render with pins (`tools/selfrender.mjs` + scratchpad `pinrender.mjs`, which sets `window.__ALC_FORCE`). One screenshot-visible acceptance check per step:

- **Step 1 (A6):** pin `window.__ALC_FORCE = { q30: 7, cometForce: 1 }` (net motif, comet forced mid-traverse via Step 0). Shoot two frames ~2s apart. **PASS:** the crumple-net/tangle ball is at a **different frame position** in the two shots, moving toward a corner, with a **fading same-hue ghost trail behind the motion direction** (widening/blurring) — and **no discrete dots** in the tail.
- **Step 2 (A21):** pin `{ accLine: 5 }`. **PASS:** a small (~230px) S-worm near a frame edge with a **bright leading head** and a **fuzzy dimmer body-trail** behind it; the body wobble tracks audio (live jag), not a fixed sine; head is a glow, not a drawn bead.
- **Step 3 (A19):** pin `{ accLine: 6 }`. **PASS:** a tall (~full-height) curved blade of ~18 hairlines converging to a bottom corner, **flexing smoothly** (compare two shots 1s apart — tip drifts, but the flex is smooth NOT jagged), with a **colour gradient from base to tip**. Smoke variant: 2–3 thin vertical gradient strands with a sideways sway trail.
- **Step 4 (A11):** pin `{ q30: <swimmer mode id> }`. **PASS:** 1–2 vertical coil columns ~60% frame tall, **swaying in place** (different sway phase 1s apart, but the base does not travel), orb head on top, **no floor reflection**.

---

## 5. Risks & rollback

- **Risk A6-(1) — dotted tail regression.** h0 saw the comet tail as a dotted bead-chain; drawn bead rows were removed as ugly (`bad7755`, `accDots` pinned 0 at L1091). **Mitigation:** the tail is ONLY feedback ghosts (Step 1's decay bump) — no wave dots, no `usedots`. If a reviewer/user reads the wake as "beads", it is the feedback stamping cadence, not drawn dots; tune by lowering the decay bump, not by adding a slot.
- **Risk A11-(2) — floor reflections.** Deliberately **not built** (standing rule). If later wanted, it's a comp-shader mirror (zero slot), gated behind sign-off — out of scope here.
- **Slot contention.** A21+A19 both live in waves[1] and are mutually exclusive with curtain/bundle/pinwheel — only one accessory renders at a time, so re-weighting the picker (L1067) is the whole cost; no new slot. **Cross-cluster:** do NOT touch waves[3] (doc 07 step 5) or the orb path rework (doc 07 step 3); A6 drives q2/q3, not the orbs, so it is orthogonal.
- **Pop visibility (A6).** The `sin(cp*π)` envelope makes cometAmt 0 at both endpoints so the head eases in/out of the Lissajous — if a pop shows, widen the traverse time or add a short alpha dip via the existing q4 machinery.

**One commit per step** (small, revertable):

- Step 1+0: `alchemy: A6 comet-head travel director (motif crosses frame, feedback tail) + debug hook`
- Step 2: `alchemy: A21 snake-worm accessory (waves[1] id 5, live-jag body + feedback trail)`
- Step 3: `alchemy: A19 sail/kelp blade + smoke strands accessory (waves[1] id 6, clock-flex, along-length gradient)`
- Step 4: `alchemy: A11 swimmer-stalk motif mode (vertical slinky, sway-in-place; reflections omitted)`

---

## 6. Acceptance criteria (cluster "done")

- [ ] **A6:** on calm net/tangle scenes, the motif occasionally (~every 30s) **traverses the frame in ~3s** at ~30% frame-width/s, leaving a **widening same-hue feedback tail** behind the motion — verified by two screenshots ~2s apart showing the head at different positions with a trailing ghost, and **zero drawn dots** in the tail.
- [ ] **A21:** a small **~230px S-worm** with a **bright glow-dot head + fuzzy live-jag body-trail** appears intermittently near frame edges; body wobble is real-waveform (not a fixed sine); no orb stolen, no drawn bead.
- [ ] **A19:** a **tall curved kelp blade** (hairline fan to a bottom corner) that **flexes smoothly (clock-driven, not audio-jagged)**, persists ~9s, with a **base→tip colour gradient**; the smoke-strand variant shows 2–3 thin vertical gradient strands with a sway trail.
- [ ] **A11:** **1–2 vertical coil columns** ~60% frame tall that **sway in place** (no travel) with an orb head on top; **floor reflections omitted** by design.
- [ ] Budget respected: still exactly 4 waves / 4 shapes; no new q-var; travellers use `orbCol`/q8 hue; Pastel highlights stay tone-mapped (no neon/blown-white).
- [ ] `node --check` + concat smoke both green; each step self-rendered and screenshot-checked before any live reload.
