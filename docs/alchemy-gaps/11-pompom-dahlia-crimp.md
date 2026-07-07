# 11 — Pompom-on-wire, dahlia drip-stems, filament crimp texture & radial hue fronts

**Matrix items:** A8 (elements threaded on wires/rings + dahlia drip-stems) · D6 (radial filament crimp texture + travelling hue front) · **Priority:** D6 = **P1**, A8 = P2 · **Risk flags:** (1) filled beads-on-wire out of scope → deferred to D9/doc 09 · (4) threading re-anchors the user-tuned motif centre → one incremental step · (5) drip-stem must be a trail DEPOSIT, never invented drawn geometry · (6) Pastel stays muted (hue-only changes) · **Confirmation needed:** NO for the core geometry/colour slices (Steps 1–4, all zero-slot changes on existing `waves[0]`). ONE question gates Step 5 (threading): _"The chenille pompom threads onto the telephone-cord tether, but our tether is beat-gated and transient (flashes only when both orbs are visible — doc 06). Should the threaded pompom (a) ride the tether so it appears only when the tether does, or (b) get a dedicated low-key persistent wire (the doc-06 Step-5 rail chord) so it can stand alone? I recommend (b), reusing doc 06's rail."_

---

## 1. Reference behaviour (what the original does)

Two measured behaviours converge on the same family of "furry" radial motifs. Sizes are % of the 640×480 (480p) or 1280×720 (1080p) source frame; the 480p is the colour-accurate reference (memory `alchemy-measured-color-facts`).

### D6 — filament CRIMP texture (P1, both refs)

- **h2 §2.8 (1080p):** the radial filaments are _"each a wavy branching strand with a **REGULAR crimp/zigzag texture (period ~10–14px)** plus **per-frame audio jitter at the tips**."_ Two displacement scales: a **static spatial wavelet** running along the strand (regular, ~10–14px ≈ 0.016–0.022 of frame width) + **live audio jitter concentrated at the strand ends**.
- **motion-study deferred gap:** _"ref filaments are contour-like wavelets, ours are straight even spokes."_ This is the crux of D6 part 1 — our urchin/anemone/fluff filaments are smooth radial lines; the ref's are crimped wavelets.
- **Guardrail (project rule):** live jag comes from real audio (`a.value1`) wherever the original shows live jag — here that is **only the tips**. The regular crimp is _static texture_ and is therefore a fixed spatial wavelet (`sin` of arc-length), NOT a wasted wave slot and NOT audio-driven. (memory `alc-waveform-rule-scope-and-budget`.)

### D6 — travelling radial hue FRONT (P1, both refs)

- **h2 §2.8:** _"new hue starts AT the core and sweeps outward, reaching the rim in **~1.5–2s**… previous hue persists longest at the rim — **NOT a strobe, a travelling front**."_ Centre-out.
- **p0 M9 (480p, dandelion pompom t=31.5–39):** measured emitter hue-step sequence **yellow(32) → hot-pink(33.5) → white(35) → mint(36.5) → orange(38.5)**; the trail keeps the old hue → a permanent 2-tone ball with a radial front. Ball reaches ~380px ≈ **59% of frame WIDTH** at peak; breathes ±5–8%; spikes +10–15% on hits; **milky fuzz body + crisp fringe**.
- **Colour LAW is doc 05's** (Step 4: per-point hue = old hue for samples beyond the front `fr = (t − stepT)/1.8`; radial modes 0/2/8/9/13/16 already listed there). This doc does NOT re-specify the clock/front machinery — it (a) adds the crimp GEOMETRY the front rides on, and (b) adds a **bottom-up** front variant for the pompom/dahlia (below).

### A8 — chenille pompom threaded on a wire; dahlia on drip-stems (P2, both refs)

- **p1 S11 (480p, t=96.5–101.5, "chenille ball on a wire"):** on a flat sage bg (#597460) a telephone-cord tether (doc 06 construction #2) winds between bullseye targets; at **t=97.8 a bright pink chenille pompom (M6, ~10% dia) stamps MID-WIRE, threaded ON the tether**; grows to **~16% by t=98.8**; **deposits a sinking smear column** (its stem). Ball hue morphs **pink→lime→gold with the front moving BOTTOM-UP**; the smear column preserves the hue history (stratigraphy — newest at top). A dark vignette ring hugs the pompom at t=101.0.
- **p1 M6 (measured):** _"Dense scribble ball, strands 1–1.5px, hundreds, re-knit per frame (LIVE); dark core hole + inner disc at apex form. Deposits a sinking smear column (its stem/trunk) at ~5%/s; column preserves hue history."_ Grows on entry ~0.8s (10→16%).
- **p1 S15 (480p, t=113.5–117, "dahlia on a picket fence"):** the pompom's **apex form** = giant **dahlia bloom 28–32% dia** (dense scribble + petal tufts, strands 1–1.5px, dark core hole + inner disc), **standing on 2–3 thick vertical STEM TRUNKS (~4% wide each — each its own drip trail)**. Whole-bloom **bottom-up hue front pink-lavender → lime-green → gold → orange-red over ~4s** (t=113.8→116.8); **stems keep the older hue** (green stems under a red bloom at t=117). Sits over a static-bars bg with a gold backlight flooding down (doc 03/D3 territory).
- **A8 general grammar (v2 generalisation, gap-matrix):** _"elements thread onto existing wires/rings"_ — pompom-on-cord (this doc), **beads-on-tether (h1 T1@113)** and **beads-on-star-ring (h1 O8)** and **pearl-chain** (all FILLED beads → risk (1), out of this cluster's build scope, see §5 + cross-ref **D9/doc 09**).

**Emitter-vs-trail split (load-bearing):**

- **Emitter (live, `waves[0]`):** the crimped filament ball itself — re-knit every frame. Crimp = static wavelet; tips = live `value1`.
- **Trail (feedback buffer):** the **drip smear column / stem trunk** is NOT drawn — it is the pompom's own ghost, sunk downward by a **down-biased trail-displacement field** while the pompom holds position. This depends on **C2 (per-scene down-bias field), doc 01/doc 02** — it cannot be faithful without them, and must never be faked as extra drawn spokes (risk (5)). The hue stratigraphy (green stems under red bloom) is exactly the frozen-trail-keeps-birth-hue behaviour of doc 05/C10.

---

## 2. Current implementation state

Verified against `presets/alchemy-v7.js` @ `302349c` and `presets/kit.js`.

- **`fFluffBall`** (mode 16, **L781–803**): 64 golden-angle-scattered filaments, each a strand from `r0` to `r0+len·u`, `len = R·(0.3+0.25·|value1|)`, curl direction alternates per filament (`seg&1`), R = q5·0.62 (near-round ball, y×0.92), hue scatter 0.08. **This IS the pompom base** — but the filaments are smooth arcs (no crimp), it free-floats at the motif centre (q2,q3) — never threaded on a wire — and it has no dark core hole / petal-tuft "apex form", no drip column.
- **`fUrchin`** (mode 2, **L438–451**): a single closed contour, `rad = sc·(0.2+0.65·|value1|)`, `ang = sample·2π + q9`. Spiky rosette CONTOUR (not discrete spokes); smooth between spikes — no crimp texture; single hue q8.
- **`fAnem`** (mode 0, **L403–411**) → geometry in kit **`alcAnemone` (kit L1641–1707)**: 10 closed acute triangles, bases on an inner circle; the _slanted edges_ already get live-waveform jag (`kit L1699`); alternating-arm duo hue. No regular crimp; single-clock hue.
- **`fJelly`** (mode 9, **L591–616**): 64 golden-angle filaments with a tangential curl (`u·0.9`), tilt oscillation 0.30–0.65, per-filament hue scatter 0.1. Strand-based like fluff — the cleanest host for a crimp helper — but no crimp today.
- **Hue:** every mode colours per-sample from `orbCol(h, off)` on the single global q8 clock (per-mode offsets/duos). **No travelling front, no stepped clock** — that machinery is added by **doc 05 Step 1 (stepped motif clock: `motifHue`/`motifHueOld`/`motifStepT` closure vars) + Step 4 (centre-out radial front, `RADIAL_FRONT = {0,2,8,9,13,16}`)**. Modes 0/2/8/9/13/16 are already in doc-05's radial-front set; **this doc supplies the crimp geometry they ride and the pompom's bottom-up variant.**
- **Threading anchor:** all modes centre on the drifting Lissajous (q2,q3) (**L1011–1012**); the tether endpoints live at (q21,q22)/(q23,q24) (**L1266–1287**) and the tether is beat-gated + transient (doc 06 §2). No mechanism points a motif centre onto the tether line.
- **Budget (catalog §7):** `waves[0]`=motif · `waves[1]`=accessory/star-companion · `waves[2]`=tether · `waves[3]`=corridor-only ring row; shapes[0–3]=orbs+glows, all committed. **The pompom/urchin/anemone/jelly all draw on `waves[0]`, so crimp, hue front and bloom-form are per-point changes INSIDE the existing mode fns → ZERO new slots.** No instancing is used.
- **Reusable:** the golden-angle strand structure in `fFluffBall`/`fJelly` (per-filament `seg`, along-strand `u`) is the ideal crimp host; kit `alcAnemone` is the shared factory (crimp there benefits every consumer per the "use all kit variants" rule); the closure-state block (**L880–928**) is the sanctioned home for any new director flag (all 32 q-vars taken); `__ALC_FORCE` debug hook (**L1136–1140**) pins q-vars for self-render.

---

## 3. Implementation plan

Smallest-shippable-slice first. Steps 1–2 (D6) are P1 and unblock the P1 fidelity delta; Steps 3–4 (A8 pompom bloom + bottom-up front) are self-contained on `waves[0]`; Step 5 (threading) is risk-(4) incremental + confirm-gated; Step 6 (drip-stem) is C2-gated and mostly a cross-ref. One commit per step; each step reverts cleanly (`git revert`) with the ordering noted in §5.

### Step 1 — D6 filament CRIMP texture (P1; the smallest slice) — start with the pompom base

_Target:_ `fFluffBall` (L781–803) FIRST (it is the A8 pompom base and is already strand-structured), then extend to `fJelly` (L591–616), `fUrchin` (L438–451, contour variant) and kit `alcAnemone` (kit L1699).

Add a shared crimp helper (a **static spatial wavelet** transverse to each strand, ~10–14px ≈ 0.018 UV period, plus live jitter concentrated at the TIPS). Strand-based sketch (fluff/jelly — `u` is along-strand 0→1, `ang`/`rr` already computed):

```js
// crimp: regular transverse wavelet (static) + tip-only audio jitter (live)
var CRIMP_CYC = 10; // cycles along the strand → ~10-14px period at R~0.25
var crimpAmp = 0.005; // ~3px transverse
var dPerp = crimpAmp * Math.sin(u * CRIMP_CYC * 6.2832) + (a.value1 || 0) * 0.012 * (u * u); // tips jitter (u^2 → concentrated at the end)
ang += dPerp / Math.max(rr, 0.05); // transverse offset = rr·dAng ⇒ dAng = dPerp/rr
```

For `fUrchin` (contour, no per-strand `u`): add a fine radial ripple on top of the amplitude — `rad += 0.004 * Math.sin((a.sample||0) * 70.0)` (≈70 ripples around the ring ≈ 10–14px crimp) so the smooth contour becomes a crimped wavelet; keep the existing `|value1|` spikes as the coarse scale. For kit `alcAnemone`, add the same `sin`-of-`f` crimp to the slanted-edge branches (near kit L1699) so the shared factory (and any future consumer) gets it.

_Revert gate:_ geometry-only. Node smoke (§4) + self-render pinned to each mode; accept when the filaments read as crimped wavelets, not straight/smooth spokes, with the jitter visibly biased to the tips.
_Commit:_ `alchemy: D6 crimp/wavelet texture on radial filaments (static wavelet + tip audio jitter)`.

### Step 2 — D6 travelling hue front on the crimped filaments (mostly a cross-ref to doc 05)

_Target:_ doc 05 Step 4 already installs the centre-out radial front for modes {0,2,8,9,13,16} in `centralDraw` (L835–847), reading `motifHue`/`motifHueOld`/`motifStepT` (doc 05 Step 1). **No new code here if doc 05 landed** — the crimped filaments inherit the front automatically.

If doc 05 has NOT landed, this doc carries the _minimal inline_ version for the filament modes only (do not duplicate the full clock — copy the ~8-line `RADIAL_FRONT` re-draw block from doc 05 Step 4 and a two-var stepped `motifHue` from doc 05 Step 1). Prefer to land doc 05 first and make this step a verification-only checkpoint.

_Revert gate:_ self-render, pin `q30:2` (urchin) or `q30:16` (fluff); at 0.5s after a hue step the centre is the new hue while the crimped rim is still old; by ~2s the whole ball is new with only the trail-ghost rim old.
_Commit (only if inline):_ `alchemy: D6 centre-out hue front on filament motifs (defers colour law to doc 05)`.

### Step 3 — A8 pompom "apex form" bloom (dense scribble + dark core hole + petal tufts)

_Target:_ `fFluffBall` (L781–803) — add a **bloom-density parameter** so mode 16 can render both the small chenille pompom (~10–16%) and the dahlia apex form (28–32% dia, denser, dark core hole + inner disc). Reuse a closure flag (director) rather than a q-var (all 32 taken).

Sketch (inside `fFluffBall`, guarded by a director `pompomApex` flag read via the frame closure — pass it through as a spare packed field or gate on `q5` size band):

```js
// dark core HOLE: hide the innermost fraction so the ball reads as a bloom, not a solid tuft
if (rr < R * 0.18) a.a = 0; // core hole
// petal tufts: modulate strand length by a low-frequency azimuthal term (denser = more tufts)
len *= 0.7 + 0.5 * Math.abs(Math.sin(h0 * (pompomApex ? 7.0 : 3.0)));
```

Keep the milky fuzz body + crisp fringe by leaving the additive alpha (MODE_ALPHA[16]=0.36) and the crimp from Step 1. Grow-on-entry (~0.8s, 10→16%) already comes free from the motif crossfade dip (q4) + the q5 size ease; the 28–32% apex size is a larger `q5` band, not a new mechanism.

_Revert gate:_ self-render pin `q30:16`; accept when the ball shows a visible dark central hole and petal-tuft lobing (not a uniform fuzzball), at both small and apex sizes.
_Commit:_ `alchemy: A8 pompom apex bloom form (dark core hole + petal tufts on mode 16)`.

### Step 4 — A8 BOTTOM-UP hue front for the pompom/dahlia (distinct from the radial front)

_Target:_ `centralDraw` (L835–847), pompom mode only. The dahlia's front is **bottom-up** (`per-point hue = f(a.y − front(t))`, ~4s cycle), NOT centre-out. Override the front direction for mode 16 by substituting a vertical coordinate for the radius in doc 05's re-draw block:

```js
// mode 16 (pompom/dahlia): BOTTOM-UP front instead of centre-out (p1 S15: ~4s cycle)
if (m === 16) {
  var cy = a.q3 !== undefined ? a.q3 : 0.5,
    sc = a.q5 || 0.4;
  var vy = 0.5 - (a.y - cy) / (sc * 1.3); // 0 at bottom of bloom → 1 at top
  var frv = (nowT - motifStepT) / 4.0; // slower ~4s sweep
  if (frv < 1 && vy > frv) {
    a.q8 = motifHueOld;
    MODES[16](a);
  } // above the front: old hue
}
```

This reuses doc 05's stepped clock (`motifHue`/`motifHueOld`/`motifStepT`) with a vertical front and a ~4s period. Stems (once Step 6 lands) keep the older hue for free because they are frozen trail (birth hue, doc 05/C10). Colour stays inside the muted Pastel envelope (hue-only, same `orbCol` cosine palette — risk (6) satisfied).

_Revert gate:_ self-render pin `q30:16`, release the clock; accept when the new hue climbs from the bottom of the bloom to the top over ~4s while the top holds the previous hue (measured pink→green→gold→red sequence).
_Commit:_ `alchemy: A8 bottom-up hue front on the pompom/dahlia bloom (~4s, top holds old hue)`.

### Step 5 — A8 threading: anchor the pompom ON the tether/wire mid-span (risk (4); CONFIRM first)

_Target:_ the frame director (closure block L880–928) + the motif-centre assignment (q2,q3 at L1011–1012). When a "threaded pompom" staging is picked (low probability, gated to a calm scene), set the pompom centre to a point along the tether chord:

```js
// threaded staging: pompom rides mid-tether (tp≈0.5), so it reads as stamped ON the wire
if (threaded) {
  var tp = 0.5; // mid-span
  t.q2 = t.q21 + (t.q23 - t.q21) * tp;
  t.q3 = t.q22 + (t.q24 - t.q22) * tp;
}
```

Because our tether is beat-gated/transient (doc 06 §2), this only reads if the wire is present — hence the **confirmation question in the header**: ride the transient tether (a) or reuse doc 06 Step 5's persistent **rail chord** (b, recommended). If (b), this step DEPENDS on doc 06 Step 5 and anchors to the rail's endpoints instead. Risk (4): re-pointing the user-tuned motif centre is an incremental, user-verified change (memory `dont-over-iterate-speculatively`).

_Revert gate:_ self-render an unpinned calm stretch (or pin the staging flag via `__ALC_FORCE` closure key); accept when the pompom visibly sits ON the wire mid-span and the wire threads through/behind it, not free-floating.
_Commit:_ `alchemy: A8 thread the pompom onto the tether/rail mid-span (staging director)`.

### Step 6 — A8 drip-stem / trunk column (DEFERRED — cross-ref C2 / doc 01+02)

_Target:_ none in this cluster directly. The stem trunk is the pompom's **downward trail deposit** under a **down-biased trail-displacement field** while the pompom holds position — this is **C2 (doc 01 camera/displacement engine + doc 02 stamp/terrain/freeze)**. Once a down-bias field regime exists, the dahlia standing on 2–3 stem trunks emerges for free (the pompom's ghost sinks; hue stratigraphy from doc 05/C10). **Do NOT fake the trunk as extra drawn filaments (risk (5)) — it is a deposit, not geometry.** This doc's contribution is the cross-reference + the acceptance note that a stamp-holding pompom + down-bias field = the dahlia-on-stems look.

_Commit:_ none until C2 lands; then a data-only director coupling (pompom staging → request a down-bias field), verified with doc 01/02's harness.

---

## 4. Verification recipe

After EVERY step:

```bash
cd /Users/sujitk/projects/personal/ytmusic-wmp-visualizer
node --check presets/alchemy-v7.js
npm test    # tools/test.mjs: node --check all + concat kit→families into one global scope,
            # build every preset, run each frame_eqs (catches missing closure refs / throws)
```

Additionally exercise the changed point fns once in Node (the smoke test only runs `frame_eqs`), pinning `q30` to each touched mode (2 urchin, 16 fluff, 9 jelly, 0 anemone):

```bash
node -e 'const fs=require("fs"),vm=require("vm");global.window=global;
 ["kit","dance","alchemy-v7","alchemy-motion","ambience","battery"].forEach(f=>vm.runInThisContext(fs.readFileSync("presets/"+f+".js","utf8")));
 const p=window.WMP_PRESETS["Alchemy (Pastel)"];
 p.frame_eqs({time:2,bass:1.3,bass_att:1.1,mid:1,treb:1,treb_att:1});
 [2,16,9,0].forEach(m=>{ p.waves[0].point_eqs({sample:.37,value1:.4,q2:.5,q3:.5,q5:.4,q8:.2,q4:1,q30:m,q9:0,q6:.05,time:2}); });
 console.log("filament point fns ok");'
```

Self-render (GLSL is untouched by Steps 1–5, but always confirm no `[WMP-viz shader]` errors), pinning `q30` via `window.__ALC_FORCE` (JSON `FORCE=` env, per the scratchpad `pinrender.mjs` pattern; underscore keys pin closure state):

```bash
node tools/selfrender.mjs "Alchemy (Pastel)" 3,8,11
FORCE='{"q30":16,"q29":5}' node <pinrender> "Alchemy (Pastel)" 6,8,10,12   # pompom on flat wash
FORCE='{"q30":2,"q29":5}'  node <pinrender> "Alchemy (Pastel)" 6,8,10      # urchin crimp
```

Per-step screenshot-visible acceptance:

- **Step 1 (crimp):** pin `q30:2` and `q30:16` — filaments read as crimped wavelets with a regular ~10–14px ripple; the wobble is clearly stronger at the strand TIPS than the base; compare against a pre-step shot (was smooth/straight).
- **Step 2 (radial front):** pin `q30:2`; shots 0.5s / 1.2s / 2s after a hue step — the new hue is centre-only at 0.5s, boundary moved out at 1.2s, whole disc (bar the trail-ghost rim) new by 2s.
- **Step 3 (apex bloom):** pin `q30:16` — a visible dark central hole and petal-tuft lobing at both small and apex sizes; milky fuzz body + crisp fringe preserved.
- **Step 4 (bottom-up front):** pin `q30:16`, release clock — the new hue climbs from the bloom's bottom to top over ~4s while the top holds the previous hue.
- **Step 5 (threading):** the pompom sits ON the wire mid-span (wire threads through/behind it), not free-floating.

Final: a 60s unpinned run of BOTH variants (`"Alchemy (Pastel)"`, `"Alchemy (Vivid)"`) — no shader errors, corridor/valley scenes still look shipped (their couplings overwrite these channels and must win).

---

## 5. Risks & rollback

- **(1) filled beads-on-wire UNBUILDABLE in wave slots (out of this cluster's scope).** A8's beads-on-tether (h1 T1@113), beads-on-star-ring (h1 O8) and pearl-chain are FILLED beads — the removed-bead-row territory (`bad7755`); no free shape slot exists. They are **deferred to D9 / doc 09** and remain confirm-gated there. **Our pompom/dahlia is a filament SCRIBBLE ball (strands 1–1.5px), wave-drawable on `waves[0]` — NOT a filled bead — so it carries no (1) risk.** Do not regress the pompom toward a filled disc.
- **(4) threading re-anchors the user-tuned motif centre.** Step 5 changes where the motif sits (onto the wire). This is the incremental class (memory `dont-over-iterate-speculatively`): ship it alone, self-render, show the user, ask ONE question, wait. Confirm the wire choice (header question) BEFORE building Step 5.
- **(5) no invented elements — the drip-stem is a DEPOSIT.** Step 6's stem trunk must emerge from a down-bias trail field (C2/doc 01+02), never from extra drawn spokes. Everything else here is timestamp-backed (§1).
- **(6) Pastel stays muted.** Steps 1 (geometry) and 3 (geometry) touch no colour. Steps 2/4 are hue-only offsets on the same `orbCol` cosine palette + the doc-05 stepped clock — the measured sat ~0.3–0.5 envelope cannot move; never lift highlights (memory `alc-colors-were-washed-out`).
- **Rollback:** one commit per step. Independent: Steps 1, 3, 5. Ordering deps: Step 2 requires doc 05 Step 4 (or its inline copy) — revert 2 before doc 05; Step 4 reuses doc 05's clock + Step 2's front block — revert 4 before 2; Step 6 requires C2. No cross-entanglement otherwise.

---

## 6. Acceptance criteria

- **D6 crimp:** urchin, anemone, fluff (and jelly) filaments read as **crimped/wavelet strands** with a regular ~10–14px texture + tip-biased live jitter — the "straight even spokes" critique is gone (vs h2 §2.8).
- **D6 radial front:** on radial modes a **new hue sweeps centre-out over ~1.5–2s**, the rim holds the old hue, and the trail shows the two-generation ghost — not a strobe (vs h2 §2.8, p0 M9).
- **A8 pompom bloom:** mode 16 renders both the small chenille pompom (~10–16%) and the **dahlia apex form (28–32% dia)** with a dark core hole + petal tufts + milky fuzz body + crisp fringe (vs p1 M6/S15).
- **A8 bottom-up front:** the pompom/dahlia hue sweeps **bottom-up over ~4s** (pink→green→gold→red), the top holding the previous hue (vs p1 S15).
- **A8 threading:** the pompom stamps **ON a wire mid-span** (threaded), not free-floating at the motif centre (vs p1 S11) — pending the header confirmation on which wire.
- **A8 drip-stem (C2-gated):** once a down-bias trail field exists, the dahlia **stands on 2–3 stem trunks** that keep the older hue while the bloom recolours (stratigraphy) — no invented drawn spokes (vs p1 S15).
- **No regressions:** corridor/valley scenes unchanged; both Pastel and Vivid variants render clean with no shader errors; overall frame stays within the muted 480p colour character.
