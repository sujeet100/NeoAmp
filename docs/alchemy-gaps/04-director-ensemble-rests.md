# 04 — Director: ensemble density, true rests / starvation outro, scene pairings & transitions

**Matrix items:** B5 (ensemble density 5–6 classes), B6 (rest depth + starvation outro), B9 (scene
couplings: sweep-under-motif · treadmill band · wedge sweeps), B10 (transition-type repertoire),
B11 (composed scene pairings) · **Priority:** B6 **P1** (promoted — near-empty rests appear in all
8 analyst reports), B5 **P1**; B9/B10/B11 **P2** · **Risk flags:** (1) budget — all 4 waves + 4
shapes taken, new classes must be zero-slot comp or the one idle wave; (4) the wholesale
motion/accessory rework was REJECTED (9ba675e) → ship ONE change at a time, user-verified; (6)
Pastel stays muted, vivid ONLY in the kaleido/fold zone. · **Confirmation needed: YES** — two
questions:

1. **B6:** is it OK for the central motif to fully **stamp-stop and leave the frame** (background +
   orbs only) for 3–7 s during a deep rest, and to **drain to a near-flat field** on a sustained
   quiet passage (the "starvation outro")? v7 today _always_ keeps the motif on screen; this is a
   deliberate character change the refs demand but the user has not seen live.
2. **B10:** the **rare hard-wipe** transition (clears the trail in ~2 frames, holds a ~1 s dark
   rest, then snaps the new scene in) is a deliberately abrupt cut. Acceptable as a _rare_ event
   (~1 per 20–25 s), with the live tether+orbs preserved across it?

This cluster is the **director** layer: it sequences _what is on screen at once_, _how scenes
enter/leave_, and _which bg/motif/orb combinations are allowed_. **It needs ZERO new q-vars and
(almost) zero new slots** — every change is either a comp-shader layer driven by `time`/`q29`, or
the closure overriding q-vars it _already_ sets each frame (`q1` decay, `q4` motif alpha, `q12/q13`
fold, `q31` exposure). That is the whole reason this cluster is comparatively low-risk. The one
optional slot change (reclaiming `waves[3]`) is flagged and deferred.

---

## 1. Reference behaviour (what the original does)

### B5 — Ensemble density: 5–6 element classes at climaxes (P1, both captures)

- **p0 S4/S7:** "6–7 classes; climax" — S4 (23.5–31.5, kaleido) counts _kaleido bg + straight
  tether + endpoint orbs + central spirograph motif + squiggle/pearl tether events + 4×-mirrored
  mini orbs + corner echoes_ (6–7).
- **p1 climaxes 5–6:** 76–80, 83–89, 102–107. Example (p1 S10, 91–96.5): band bg + 4 mirrored arms
  - ring targets + centre knot/net-sphere + tether = 4–5, spiking to 6 on beat events (axis-line
    flash + splat).
- **h0** 5 classes at 41–46.8 and 58.5–65; **h2 S2** 5–6. Survey memory: "3–5 simultaneous element
  CLASSES … breathing down to 1–2."
- **Mechanism:** the extra classes over v7's 4 are **zero-slot comp/shader layers** — mirror-copy
  echoes, corner echoes, giant soft wedge/swath, crosshair/axis-line flashes — plus _beat-event_
  layers (splats, mirrored mini-orbs) that are transient, not permanent slots.

### B6 — Rest depth + starvation outro / near-empty frames (P1, both captures)

- **Every one of the 8 reports** documents near-empty rests:
  - **p1:** rests at 82.1–82.6, 97.3 ("near-EMPTY frame"), 112.0–112.6 → **1–2 classes**.
  - **p0:** 23.5–24.2 = a **~1 s dark rest, tether only**, between the swath climax and the kaleido
    snap-in. Overall "busy↔empty breathing … a **hard rest beat roughly every 20–25 s**."
  - **p2:** two rests; **h0:** a **4.5 s dark rest at 12–17**; **h1 S3:** an **8 s flat-paper rest**;
    **h2 S8** sparse.
- **★ Starvation outro (p3 S6, 219–228.4, "Outro drain", track ends):** classes collapse to
  _wallpaper (fading) + 1 tiny central motif_, then "**Silence drains the engine** … quiet audio →
  no stamps → the feedback has nothing to eat → the frame **converges to its average colour**
  (`#614853`) by 224.5, holding to the end with **only two pinprick anchor dots left**. The 'empty'
  scenes are **not authored — they're starvation**." This is the key mechanistic insight: rests are
  _emergent from an emitter-starved feedback loop_, not a scripted fade.
- **Mechanism:** emitter (motif stamp) **stops firing** when audio is quiet → the feedback field
  (decay + blur) drains toward its mean → only the persistent anchors (orbs) survive. Depth of rest
  tracks how long/deep the audio lull is.

### B9 — Scene couplings: bg swept-replaced under a persisting motif · treadmill band · wedge sweeps (P2, both)

- **Layer-independent bg replace (p1 S4, 69.5–71.5):** "Background regime replaced in-place … the
  bush **persists untouched** through the swap → layer independence." **p1 S10:** bg cycles
  ochre→rainbow-stripes→magenta→lavender→sage _within_ one scene while the motif persists.
- **Treadmill band (h1 S8):** a streak band **STREAMS horizontally** under a **pinned** pompom — the
  band scrolls, the motif does not.
- **Wedge/swath sweeps (p1 B5, 79–82):** "huge soft diagonal teal/magenta wedges sweeping ~**0.1
  frame/s** — creates **depth without camera motion**." **p3 D-SWATH:** a dusty-wine swath sweeps in
  over ~4 s carrying the scene's light transition. **h2 2.19:** re-tint sweeps along a valley beam.
- **Mechanism:** background and motif are **independent layers on independent clocks** (v7 already
  has this). The gap is the _counter-motion pairings_ — a bg element that streams/sweeps while the
  motif holds still, which reads as parallax depth.

### B10 — Transition-type repertoire (P2, both)

- **p1 §3.6 catalogues FIVE types:**
  1. **wash-dissolve** (~0.7 s) — t=58.5: bands soften and dissolve into feedback.
  2. **bg-sweep-only replace** — t=69.5: only the ground changes, cast persists (= B9).
  3. **motif metamorphosis via its own trail** — t=101.5: pompom→flame morph through feedback.
  4. **quad-fold absorption (vivid spike, ~0.6 s)** — t=90.05: the whole frame folds 4-way, old
     content becomes the mirrored wedge texture, **the segment's saturation peak** (vivid
     orange/green/purple), then settles. Mechanism: fold switched on over live feedback → absorption
     is automatic.
  5. **stamp-seed** — t=96.05 / 112.75: a dumbbell/orb _event_ becomes the next scene's cast.
- **★ Rare hard wipe (p0 §3.3, t=23.5):** "the ONE hard wipe … clears trails in **<2 frames** but
  **PRESERVES the live tether+orbs**, then a **~1 s dark rest** precedes the kaleido snap-in at
  24.25." Persistent elements bridge the cut. This is the single abrupt transition in 228 s — rare
  by design.
- **p2 §3.1 (decisive):** at 121.8 the picket bars "**physically bend into the kaleido's arcs within
  0.5 s — nothing is cleared; the incoming regime re-warps existing pigment**." The re-warp trick
  comes free once regimes affect the WARP (see doc 01/02, item C2), not just the comp ground.
- **Mechanism:** every ref transition is a **feedback event** (decay bump / fold switch / warp
  change), NOT a palette cut. v7's is a palette cut (q29 snaps at mix 0.5).

### B11 — Composed scene PAIRINGS (P2, both)

- Recurring **signature pairings** across reports — the bg choice _implies_ the motif class, orb
  staging and tether mode:
  - **bars bg + dahlia/tangle standing on its own stem-trunks** (p1 S15; p2 S1/S2).
  - **near-black + waveform-mountains + eyelet-dumbbell ON a rail** (p2 S7; r0 terrain scene).
  - **kaleido + orb-pair-tether spawn events + mirrored rosette** (p0 S4/S7; p2 S4).
  - **wallpaper + small centre motif + persistent anchor pair** (p3 S5).
  - **flat wash + ONE dominant organic ball** (p0 S5; h0 46.8–58.5).
- Survey-memory rule: "**structured bg + exactly ONE organic centre motif — never two competing
  organic motifs.**"
- **Mechanism:** the director couples the three layers; scenes read as _composed set-pieces_, not a
  random cross-product.

---

## 2. Current implementation state

Verified against `presets/alchemy-v7.js` @ `302349c`.

**Directors & closure state** (catalog §5):

- `makePicker(n, minS, maxS, fade)` — L347-382: stochastic index cross-fader (dwell minS..maxS,
  smoothstep crossfade over `fade` s to a _different_ random index).
- `bgPick = makePicker(15, 7, 12, 3.0)` (L926) over `BG_BAG` L920 `[0,0,0,0,0,2,2,1,3,4,5,6,7,8,1]`;
  **q29 SNAPS discretely at mix 0.5** — `t.q29 = BG_BAG[bg.mix<0.5 ? bg.a : bg.b]` (L942-943). "A
  hard cut, softened only by the persistent trail buffer bridging it." No shader-side crossfade.
- `motifPick = makePicker(25, 6, 11, 2.0)` (L927) over `MOTIF_BAG` L923-925
  `[0,0,1,1,2,3,4,5,6,6,7,7,8,9,10,11,12,13,13,14,15,15,16,16,1]`; **fully INDEPENDENT of bgPick**;
  q30 snaps at mix 0.5 (L994-996), hidden by the q4 opacity dip (L997-1000).
- **Rest/busy breathing** L1044-1059: at each `breathNext`, a rest starts only if `energy < 1.15`,
  `corridorAmt < 0.1`, and a coin-flip; rest 3–7 s, busy 8–14 s; `restAmt` eased 0.8/s. **During
  rest, ONLY**: `accVis = 1 − 0.88·restAmt` (accessories fade) and `t.q14 *= 1 − 0.92·restAmt` (orb
  B leaves, taking the tether). **The central motif (waves[0]) NEVER leaves** — nothing multiplies
  its q4 down during a rest. Floor ≈ 2–3 classes.
- **Accessory director** L1063-1096: own 5–11 s clock; `accLine ∈ {0 none p=.32, 1 ray-curtain,
2 bundle, 4 pinwheel}`. `accBundleVis` fades the bundle under sprawling motifs 7/8/13 (never two
  sprawling organics — L1093-1096).
- **Scene couplings that exist:** only CORRIDOR (bg 3 ↔ orbs+tether staging, L1101-1124) and VALLEY
  (motif 12 ↔ forward dolly, L1126-1134). No bg↔motif pairing table.

**Reusable / absent / deviates:**

- **Reusable:** `makePicker` (gate arg lets us bias picks); the breathing director (extend it); the
  independent-layer architecture (B9/B11 need it — already correct); the `bgMode`/`bgPrev` snap logic
  in comp; `energy` signal (L936); the debug pin hook `window.__ALC_FORCE` (L1136-1140) copies any
  `t.qN` (and, once doc 03/05 Step 0 lands, closure underscore keys) onto `t`.
- **Absent:** motif-leaves-in-rest; audio-starvation drain; bg-transition types beyond a snap;
  treadmill regime; wedge/swath comp layer; bg×motif pairing weights.
- **Deviates:** rest floor is the refs' _mid_ level (motif always present); every scene change is a
  palette cut; bg×motif is a uniform random cross-product (produces ref-authentic AND ref-impossible
  combos at equal rates, e.g. busy caustic-bands under the frame-filling net).

**Budget ledger (catalog §7):** waves[0] motif · waves[1] accessory · waves[2] tether · waves[3]
**idle outside corridor (bg 3, ~1/15 of the time)** · shapes[0-3] orbs+glows (fully committed).
**The only reclaimable slot is waves[3].**

---

## 3. Implementation plan

**Slot budget for this whole cluster: unchanged (0 new waves, 0 new shapes) for B6/B9/B10/B11; B5
adds ONE optional deferred wave (waves[3] reclaim). No new q-vars anywhere** — every shader-driven
change reuses q-vars the closure already writes (`q1` decay, `q4` motif alpha, `q12/q13` fold,
`q31` exposure) or is computed in comp from `time`+`q29`. New _cross-frame state lives in the file
closure_ (booleans/timers), pinnable via the doc 03/05 Step 0 underscore-key hook.

Each step gets a `FEAT_*` boolean const near the top of the closure (default `true`) so a live A/B
is a one-line flip, plus its own commit for `git revert`.

### Step 0 — closure-state pin (skip if doc 03 or 05 Step 0 already landed)

Extend the debug hook (L1137-1140) so `window.__ALC_FORCE` underscore keys write closure state, not
just `t.qN`. Add after the q-copy loop:

```js
if (F._restDeep !== undefined) resting = restDeep = !!F._restDeep;
if (F._starve !== undefined) starveAmt = +F._starve;
if (F._transType !== undefined) transType = +F._transType;
if (F._pairOff !== undefined) FEAT_PAIRING = false; // force uniform picks for A/B
```

No visual change. Lets `selfrender.mjs` pin a deep rest / starvation / a specific transition without
waiting for the stochastic clock.

### Step 1 — B11: bg×motif pairing weight table (smallest slice; no engine change, no slot, no q-var)

**Target:** `motifPick` call at L994. **Change:** bias the motif re-roll by the _current_ bgMode so
the cross-product matches the refs' set-pieces. Add a `FEAT_PAIRING` const and a small table mapping
each bgMode → the motif ids it favours (from the B11 evidence). Rather than fork `makePicker`,
gate the _acceptance_ of a new motif pick: when `makePicker` proposes index `b`, if
`FEAT_PAIRING` and `MOTIF_BAG[b]` is _disfavoured_ under the live bgMode, re-roll up to ~3 times.

```js
// bgMode -> allowed/favoured motif ids (rest fall through as low-weight)
var PAIR = {
  4: [13, 15, 16, 14], // bars bg  -> tangle / mandala / fluff / mountains (stem-standing)
  3: [14, 11], // corridor/near-black -> mountains / bead-rail (terrain)
  1: [0, 2, 10, 15, 6], // kaleido  -> rosette-y radial motifs that mirror well
  5: [16, 13, 9], // flat wash-> ONE organic ball (fluff / tangle / jelly)
  6: [13, 16, 15], // wallpaper/bands -> small centre motif
};
```

Never _forbid_ — just weight, so variety survives. Compose: leaves bgPick/motifPick clocks intact;
only the chosen index shifts. Gate: `FEAT_PAIRING`. **Cross-ref doc 05 Step 3** (complementary
fg/bg seeding at motif swaps) — the _colour_ half of a pairing; keep the geometry half here.

### Step 2 — B6a: deep rest lets the MOTIF leave (extend the existing breathing director)

**Target:** rest block L1048-1059. **Change:** add a `restDeep` flag — some rests are _deep_ (motif
stamp-stops, bg+orbs only), most stay shallow (today's behaviour). Add a motif-rest multiplier onto
`q4`. This is the character change the confirm question covers.

```js
if (time >= breathNext) {
  if (!resting && energy < 1.15 && corridorAmt < 0.1 && Math.random() < 0.5) {
    resting = true;
    restDeep = FEAT_DEEPREST && Math.random() < 0.4; // ~40% of rests go deep
    breathNext = time + 3 + Math.random() * 4;
  } else {
    resting = restDeep = false;
    breathNext = time + 8 + Math.random() * 6;
  }
}
restAmt += ((resting ? 1 : 0) - restAmt) * Math.min(1, dt * 0.8);
deepAmt += ((restDeep ? 1 : 0) - deepAmt) * Math.min(1, dt * 0.7); // separate ease
// ... existing accVis, q14 ...
```

Then where q4 is finalised (after L1000): `t.q4 *= 1 - 0.92*deepAmt;` — the motif fades out on a
deep rest, leaving bg + orb A (q25, near-persistent). Composes with the q4 swap-dip (multiplicative,
independent). **Cross-ref doc 03 Step 5 (B4a stamp-stop exit):** if that lands first, a deep rest
should route through the _stamp-stop_ mechanism (stop firing the emitter) rather than fading q4 — same
visible result, more faithful. Until then, the q4 fade is the smallest safe slice. Gate: `FEAT_DEEPREST`.

### Step 3 — B6b: audio-starvation drain (the "outro" / any sustained lull)

**Target:** new closure block after Step 2. **Change:** a starvation detector independent of the
breathing clock — when `energy` stays below a floor for a sustained window, drive the feedback toward
its mean and starve the emitters, leaving only the orb anchors (p3 S6).

```js
var starving = energy < 1.02; // deep quiet, not just "calm"
starveT = starving ? starveT + dt : 0; // seconds of continuous quiet
var starveTarget = FEAT_STARVE ? Math.min(1, Math.max(0, (starveT - 1.5) / 3)) : 0; // ramp in after 1.5s over 3s
starveAmt += (starveTarget - starveAmt) * Math.min(1, dt * 0.5);
// drain: lower decay so the field converges to mean; fade motif + accessories; KEEP orb A
t.q1 = q1base - 0.1 * starveAmt; // 0.957 -> ~0.857: trails collapse toward flat
t.q4 *= 1 - 0.95 * starveAmt;
accVis *= 1 - 0.9 * starveAmt;
t.q14 *= 1 - 0.95 * starveAmt; // orb B leaves; orb A (q25) survives as the anchor
```

This is the mechanism-faithful version of B6 ("empty scenes are starvation, not authored"). It also
naturally produces the _outro_ when a track ends. Composes above the breathing director (both write
q4/accVis multiplicatively; starvation wins because it drives closer to 0). Gate: `FEAT_STARVE`.
**Cross-ref doc 01/02:** the decay drop overlaps the WARP engine — keep the drop modest (~0.1) so it
doesn't fight a per-scene decay regime; if doc 02's freeze field lands, prefer _stopping stamps_ over
_dropping decay_.

### Step 4 — B9a: treadmill band regime (new comp bg case; no q-var, no slot)

**Target:** `makeComp` bg dispatch (comp, ~L144-164 near the bars/bands cases) + `BG_BAG` L920.
**Change:** add bgMode case `9` = **horizontal treadmill** — 6–8 soft vertical streaks scrolling in
x, `fract(pr.x*N - time*0.18)`, duo `pal(hb)`/`pal(hb+0.5)`, desat ~0.6, ×0.15 dark (muted). The
motif is a separate layer, so it _stays pinned while the band streams_ — exactly h1 S8, for free.
Add `9` to `BG_BAG` (low weight). Composes trivially (independent layers already). Gate: since it's a
bag entry, "revert" = remove the `9` from BG_BAG; wrap the comp case behind nothing (dead unless
selected). **Cross-ref doc 01/02:** distinct from a _warp_ treadmill; this is a comp ground.

### Step 5 — B9b + B5: giant soft wedge/swath sweep layer (comp; no q-var, no slot → the 5th class)

**Target:** `makeComp`, added to the composite line (L200 area) as a faint additive layer in the
open-ground regimes (wavy-fluid 0, wash 5, bands 6). **Change:** two overlapping half-plane gradients
rotating slowly from `time` — "depth without camera motion" (p1 B5, ~0.1 frame/s):

```glsl
// pd = aspect-corrected pixel dir from centre; hb = hue base
float wa = time*0.05;                                   // ~0.1 frame/s sweep
float w1 = smoothstep(-0.5, 0.9, dot(pd, vec2(cos(wa),      sin(wa))));
float w2 = smoothstep(-0.5, 0.9, dot(pd, vec2(cos(wa+2.1), sin(wa+2.1))));
vec3 wedge = (pal(hb+0.12)*w1 + pal(hb+0.55)*w2) * 0.10; // MUTED — 0.10 gain, Pastel-safe
ret += wedge * gWedge;                                    // gWedge = comp const per regime (0 in busy bgs)
```

Because it is always present (not gated) in those regimes, it is a genuine 5th simultaneous element
class at climaxes (B5) _and_ the counter-motion depth layer (B9). **B5 shader-route note:** the 6th
class at peaks is the **crosshair / axis-line flash** — that is a _beat-event_ comp layer owned by
**doc 03 (B2 event scheduler)**; don't build it here, just ensure this wedge layer and doc 03's flash
are _allowed to coexist_ (neither gates the other off). Keep wedge saturation muted per guardrail (6)
— the vivid zone is the fold, not the wedge. Gate: `gWedge` const (set 0 to disable). **Do NOT reclaim
waves[3] for B5** in this cluster — a second sprawling wave accessory reads as clutter (user rejected
tangle+bundle; L1093). Note waves[3] reclaim as a possible future _non-sprawling_ accessory only.

### Step 6 — B10: transition-type selector (closure drives existing q-vars; no q-var, no slot)

**Target:** new closure block; fires when `bgPick`/`motifPick` cross mix 0.5 (the existing snap
moment, L943/L995). **Change:** on each scene change, roll a transition _type_ and, for its duration,
override the shader-read q-vars the closure already sets. This turns the palette-cut into a feedback
event.

```js
// transType: 0 wash-dissolve · 1 sweep-replace(=B9, ground only) · 2 quad-fold spike · 3 hard-wipe
if (bgJustSnapped || motifJustSnapped) {
  // detect mix crossing 0.5 this frame
  var rt = Math.random();
  transType = rt < 0.55 ? 0 : rt < 0.75 ? 1 : rt < 0.95 ? 2 : 3; // hard-wipe RARE (~5%)
  transT0 = time;
  transDur = transType === 3 ? 1.4 : transType === 2 ? 0.6 : 0.7;
}
var tp = FEAT_TRANS ? Math.max(0, Math.min(1, (time - transT0) / transDur)) : 1; // 0..1 progress
var env = Math.sin(Math.min(1, tp) * Math.PI); // 0..1..0 bump
if (tp < 1) {
  if (transType === 0) t.q1 = q1base + 0.012 * env; // wash-dissolve: longer trail lingers
  if (transType === 2) {
    t.q12 = 4;
    t.q13 = 0.6;
    t.q31 *= 1 + 0.25 * env;
  } // quad-fold VIVID spike (fold-zone → sat OK)
  if (transType === 3) {
    // HARD WIPE + dark rest + snap-in
    if (tp < 0.1)
      t.q1 = 0.45; // clear the field in ~2 frames
    else if (tp < 0.75) {
      t.q4 *= 0.05;
      accVis *= 0.05;
    } // ~1s dark rest — motif+acc gone
    // orbs (q25/q14) + tether NOT touched -> they PRESERVE across the wipe (p0 §3.3)
  }
}
```

- Type 1 (sweep-replace) = B9's layer-independent bg change; with only the ground changing and the
  motif persisting it is already faithful once the wedge/treadmill regimes exist (Steps 4-5). No extra
  work beyond _not_ dipping the motif on a bg-only change.
- **Cross-ref doc 05 Step 7 (D13 one-vivid-accent):** the quad-fold spike is the sanctioned brief
  vivid moment — keep it ≤0.6 s and confirm it's the only vivid source at that instant.
- **Cross-ref doc 01/02 (C2):** the _re-warp-old-content_ transition (bars bending into kaleido arcs,
  p2 §3.1) comes for free once regimes drive the WARP; add it as a `transType 4` there, not here.
  Composes: multiplicative over q4/accVis/q1/q31 which the closure already writes; when `tp≥1` it is a
  no-op. Gate: `FEAT_TRANS`.

---

## 4. Verification recipe

**Static checks (before any reload):**

```bash
cd /Users/sujitk/projects/personal/ytmusic-wmp-visualizer
for f in presets/*.js viz.js; do node --check "$f" || break; done
# CLAUDE.md concat/frame_eqs smoke test — catches missing closure refs / throwing eqs:
node -e 'const fs=require("fs"),vm=require("vm");global.window=global;
  const cat=["kit","dance","alchemy-v7","ambience","battery"].map(f=>fs.readFileSync("presets/"+f+".js","utf8")).join("\n;\n");
  vm.runInThisContext(cat);
  let n=0; for(const [k,p] of Object.entries(window.WMP_PRESETS)){ if(p.frame_eqs) for(let i=0;i<300;i++) p.frame_eqs({time:i*0.033,frame:i,bass:1.3,bass_att:1.1,mid:1,treb:1,treb_att:1}); n++; }
  console.log("ok",n,"presets");'
```

Run frame_eqs for **many frames** (loop above) so the breathing/starvation/transition timers actually
advance and any bad state is hit in Node.

**Self-render (per step) — `node tools/selfrender.mjs "Alchemy (Pastel)"`**, pinning via
`window.__ALC_FORCE` (JSON; q-vars direct, closure state via the Step 0 underscore keys):

| Step     | Pin                                                             | Screenshot-visible acceptance check                                                                                                                                          |
| -------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 B11    | `{"q29":4}` (bars) then `{"q29":5}` (wash), let motif clock run | bars bg → motif is a stem-standing organic (tangle/mandala/fluff); wash bg → exactly ONE organic ball, never two competing organics.                                         |
| 2 B6a    | `{"_restDeep":1}`                                               | central motif **absent**; only the soft ground + orb A (one glowing anchor) remain; ≤2 classes. Release → motif fades back.                                                  |
| 3 B6b    | `{"_starve":1}`                                                 | frame **converges to a near-flat muted field** (trails collapsed), motif+orb B+accessories gone, orb A the sole pinprick anchor. Colour stays muted (no neon).               |
| 4 B9a    | `{"q29":9}` + normal motif                                      | soft vertical streaks **scroll horizontally** while the central motif stays **pinned** (grab 2 frames 0.5 s apart: band x shifts, motif centre does not).                    |
| 5 B9b/B5 | `{"q29":0}` at a climax (`bass_att≈1.4`)                        | count classes: motif + tether + 2 orbs + **soft diagonal wedge gradient** = **5**; wedge is faint/muted, sweeps slowly (2 frames 1 s apart → wedge angle rotates ~0.05 rad). |
| 6 B10    | `{"_transType":2}` (fold), `{"_transType":3}` (hard-wipe)       | fold: ~0.6 s 4-way mirror vivid spike then settle. hard-wipe: trail clears in ~2 frames, ~1 s dark frame with **orbs+tether still visible**, then new scene snaps in.        |

Also do one **unpinned 60 s render** and confirm: (a) rests reach ≤2 classes a few times, (b) at
least one deep rest / motif-absent moment occurs, (c) transitions vary (not all snaps), (d) no
sustained neon in Pastel.

---

## 5. Risks & rollback

- **Risk (4) — wholesale motion/accessory rework was REJECTED (9ba675e).** This cluster deliberately
  avoids the rejected axis: **no camera/emitter-travel change, no new sprawling wave accessory.**
  Every step is a comp layer or a q-var override the closure already computes. Still, **ship ONE step
  per commit, self-render, and get user sign-off before the next** (per `dont-over-iterate-speculatively`
  — the elektrination anger came from stacking unverified changes). Steps 2/3/6 are the _behavioural_
  changes most likely to surprise → these are the ones the confirm questions cover; do NOT land them
  before the answers.
- **Risk (1) — budget.** Honoured: 0 new waves/shapes for B6/B9/B10/B11; B5's 5th/6th classes are
  zero-slot comp (wedge) + doc 03's beat-flash. The waves[3] reclaim is explicitly **deferred** and
  flagged for clutter (user rejected two competing busy layers).
- **Risk (6) — muted Pastel.** Only the **quad-fold spike** (Step 6, type 2) raises saturation, and
  only inside the sanctioned fold zone for ≤0.6 s. The wedge layer (Step 5) is capped at 0.10 gain and
  muted `pal` hues. Confirm against `report_r0.md`/480p colour before accepting.
- **No new q-vars** means no risk of colliding with the point_eqs q-space; all overrides are on
  shader-read q-vars (q1/q4/q12/q13/q31) the closure already owns each frame.
- **What the user rejected before that this touches:** the motion/accessory rework (avoided here);
  invented elements (`alc-faithfulness` — every layer above is measured in the refs: wedges p1 B5,
  treadmill h1 S8, starvation p3 S6, hard-wipe p0 §3.3; nothing invented). Deep-rest/starvation is a
  _removal_ of the always-on motif, not an invention.

**One commit per step (suggested messages):**

1. `alchemy: B11 bg×motif pairing-weight table (composed set-pieces)`
2. `alchemy: B6a deep rests let the central motif leave the frame`
3. `alchemy: B6b audio-starvation drain (outro/lull → converge to flat)`
4. `alchemy: B9a treadmill horizontal-band bg regime (motif stays pinned)`
5. `alchemy: B9b/B5 giant soft wedge sweep comp layer (5th class, depth)`
6. `alchemy: B10 transition-type selector (wash/fold-spike/rare hard-wipe)`

Each `FEAT_*` const flips a step off without a revert; a full back-out is `git revert <step commit>`.

---

## 6. Acceptance criteria

Done vs the references when, on an unpinned 60 s Pastel self-render + the pinned checks above:

- [ ] **B11:** bg regime visibly constrains the motif class — bars→stem-standing organic, wash→one
      organic ball, kaleido→radial rosette; the ref-impossible combos (busy caustic-bands under the
      frame-filling net) no longer occur at equal rate. Variety still present (not deterministic).
- [ ] **B6 (rests):** several times per minute the frame breathes down to **≤2 classes**, and at
      least one **deep rest** shows the **central motif fully absent** (bg + one orb anchor), matching
      p1's near-empty frames / h0's 4.5 s dark rest.
- [ ] **B6 (starvation):** a sustained quiet passage **drains** the field toward a near-flat muted
      colour with **only the orb anchor(s)** surviving (p3 S6), and recovers when audio returns.
- [ ] **B5:** at climaxes (`bass_att` peaks) **5 simultaneous classes** are on screen (motif + tether + 2 orbs + wedge), reaching **6** when doc 03's crosshair/axis-flash coincides.
- [ ] **B9:** the **treadmill band** streams horizontally with the motif pinned; **soft wedges** sweep
      slowly behind the action creating depth with the camera static.
- [ ] **B10:** scene changes are **varied feedback events**, not palette cuts — a lingering
      wash-dissolve is common, a **vivid quad-fold spike** appears occasionally, and a **hard wipe**
      (clear + ~1 s dark rest + snap-in, orbs/tether preserved) occurs _rarely_ (~1 per 20–25 s).
- [ ] Pastel stays **muted** throughout except the ≤0.6 s fold spike; no sustained neon; colour reads
      as the dusty WMP palette against `report_r0.md`/480p.
