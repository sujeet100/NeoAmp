# 05 — Independent per-class colour clocks, stepped hue arrival, deposit stains & hue stratigraphy

> **★ LANDED IN FULL (2026-07-09, 7 commits `148ac0e`→`b1668d9`, one per step; not yet
> live-confirmed).** Both confirm questions were pre-answered YES (README Q6/Q7). Deviations
> from the plan below, made at landing time:
> - **Step 0 folded into each step** as named `FORCE` keys (`motifHue`/`accentHue`/`splat`/
>   `spike`), matching the file's established pin style — no underscore-prefix mechanism.
> - **Step 1:** stamp-walk modes (tangle 13 / mountains 14 / spiro 17 / cocoon 18) HOLD the
>   motif step clock while up — their per-stamp hue walks already are their D12; stepping the
>   base under them would double-step. Sketchbook pages keep the global clock (+restStampHue).
> - **Step 2:** implemented as the doc's re-time-inkOff variant: `accentHue` is HELD; scheduler
>   events re-anchor it to `huePhase+hueStep+inkOff`, beats (0.6s floor) walk it. `fillLag` →
>   `fillHue` (eases toward `accentHue` ~1s). Corridor dots joined the accent family.
> - **Step 4:** tangle (13) EXCLUDED from RADIAL_FRONT — h2 measures it re-tinting
>   whole-cluster per stamp, not as a front. Front verified numerically (centre point snaps,
>   rim follows ~1s later).
> - **Step 5:** two guards added from acceptance shots: sprawling full-frame line motifs
>   (1/3/7/8/10/12/13) get 0.35× hold (they pile dozens of held copies into a web — a control
>   render confirmed the net-on-wash web is pre-existing, but full hold quadrupled it), and the
>   hold is damped 0.55× under the sketchbook (its ~1s ghost-fade was live-tuned). Plus the
>   doc's own q4×0.8 white-guard fallback.
> - **Step 6b SKIPPED:** `waves[3]` has `usedots:1` as a static baseVal — the "outline ring"
>   would render as a dotted bead loop, i.e. the removed `bad7755` ugliness. 6a (glow swell)
>   shipped; splats trigger inside the tether event branch (~half of casts, ≥4s apart).

**Matrix items:** B7 (independent per-class colour clocks + complementary fg/bg, P1) · D12 (stepped hue arrival as the norm, P2) · D13 (one-vivid-accent saturation policy, P2, **CONFIRM**) · C10 (deposit-holding grounds, stains 3–10s, P2) · A14 (amoeba splats / deposit puffs, P3, **hue-ageing claim CONFLICTED**)
**Priority:** B7 is P1 — it is the structural change the others ride on; D12/D13/C10 P2; A14 P3.
**Risk flags:** (6) on B7/D12/D13 — every clock must stay inside the muted Pastel envelope (hue-only changes; saturation is touched ONLY in the confirm-gated D13 step, and only as an *ordering*, never a global lift). (4) on C10 — per-scene decay/blur modulation is a warp-*input* change of the rejected-rework class (`9ba675e`): ship wash-gated, ONE commit, user-verified; consume doc 01's field engine if it has landed. (1) on A14 — filled wobbly blobs have no renderer in budget (all 4 shape slots taken, shapes are rigid n-gons); route splats through the existing `orbGlow` stamps into the feedback, exactly as the matrix prescribes.
**Confirmation needed:** **yes** — two questions, each before its step:

1. *(before Step 7 / D13)* "The refs are muted-with-ONE-hot-accent: one small orb family (≤6.5% of frame) + the tether is deliberately the most saturated thing on screen, everything else slightly MORE muted, with rare ~0.6s vivid spikes. OK to add that accent exemption (emit-side only, comp profiles untouched), as one commit you verify live?"
2. *(before Step 5 / C10)* "C10 slows decay + blur ONLY during the flat-wash background so deposits live 3–6s as stains (today they die in ~1s). It's a feedback-engine input change of the class you rejected wholesale in `9ba675e` — OK as one wash-gated commit you verify live?"

**THE ONE LAW this whole doc hangs on (measured, unanimous): trails keep their BIRTH hue.**
Old paint never retro-tints. All hue changes are applied to *emitter draw colours* (JS-side, at stamp time) — never comp-wide, never to the buffer. The feedback buffer stores RGB, so this law is free *as long as no shader recolours the trail*. The current comp obeys it (the trail is sampled and composited untinted apart from the static profile tint); keep it that way. Evidence: p1 §3.4 "trails never retro-change — hue ages in place"; p2 §2 "hue does NOT rotate as it ages (keeps deposit hue, only desaturates)"; h2 §3 "hue does not drift after deposit"; r0 "hue dilutes toward bg tint… no hue rotation". The lone counter-claim (p0: gold splat re-tints pink at 59.75→60.5) is 4-vs-1 outvoted and is most plausibly an overlapping FRESH deposit — **do NOT build retro-recolouring** (matrix A14 resolution).

Cross-references: doc **01** owns the C2 freeze/displacement field engine — C10 here *consumes* it (or ships a minimal wash-local version if 01 hasn't landed). Doc **03** owns the typed beat-event scheduler — the accent snaps and A14 splat events should register as event types there if it has landed; they work standalone otherwise. Doc **06** Step 2 builds the shared per-event "accent ink" (`inkOff`) for rings+tether — that IS the B7 accent-family clock; Step 2 below extends it rather than duplicating (see the note in that step). Doc **07** Step 0 extends `__ALC_FORCE` to reach closure state — reuse that pattern for pinning the new clocks.

---

## 1. Reference behaviour (what the original does)

### B7 — independent per-class colour clocks + complementary fg/bg (P1, both refs)

- **p0 §3.4 (480p, colour-trusted), verbatim:** "per-element-class hue clocks, mutually independent (tangle strands vs its internal orbs vs bead columns all snap at different moments — burst_14). Emitter hue snaps in steps (0.5–2s in busy phases, 3–5s for S7 grounds, 1.5–2s pompom); trails keep their birth hue → multi-hue accumulations and radial hue fronts."
- **r0 §3.3 (19s colour-accurate clip):** "three independent colour clocks at once" — (a) the **accent family** (ring outlines + tether + sprigs share one hue) snapping per event every **1.5–3s**; (b) **motif fills** re-tinting slowly (~2s drift); (c) **bg** on its OWN slower clock (band injections, terrain re-tint). r0 tether trace: one hue *per appearance*, snapping per event — white(1.25) gold(3.45) white(5.05) violet(6.5) blue(7.9) green(9.5) … "Tether hue = ring-outline hue of endpoint orbs."
- **p1 S13 (t=108.9–110) — the strongest layer-independence observation:** the whole UPPER layer (stacks, splats, tether) re-tints mauve/lavender over ~1s **while the green/orange colour-field bg stays un-retinted**; the tip orbs then snap magenta/red on their own moment.
- **Complementary fg/bg exists:** p1 M2 (t=59.6): coral-red mesh cocoon (#de4f50) ON a flat sage-green ground (#28705f) — complementary, not analogous; the motif then whole-re-tints pink→teal over ~1.5–2s while the ground stays.
- **Mechanism:** each element *class* (ground / central motif / orb+tether accent family / accessory) owns its own hue variable with its own step cadence. Trails are the classes' history in their birth hues, so several hue families coexist on screen without any blending.

### D12 — stepped hue arrival as the NORM; radial hue fronts (P2, both refs)

- **h0 §3.3 (1080p), verbatim:** "Colour changes are **stepped walks, not continuous drift**: hue steps every **~0.75–2s** (wash walk, tangle steps, kaleido era floods, tether colour steps at 37–39). New colour arrives as fresh strokes or region floods; old colour survives in the trail ~2s → **two-generation two-tone look**."
- **h2 §3.6 — three tiers:** (a) fast hue ROLLS within a motif, **1.5–2s per hue family**, entering as a **travelling front** (center-out in radial motifs, along-length on beams, whole-cluster on the tangle); (b) **discrete snaps every ~0.5–0.75s on compact orbs/caps**; (c) slow ground-colour **ERAS** (e.g. green held for the final 30s of the segment).
- **h2 §2.8 (urchin/dandelion, t=142–145.5, 175.3–180) — the radial front, verbatim:** "new hue starts AT the core and sweeps outward, reaching the rim in **~1.5–2s** … the previous hue persists longest at the rim (blue fringe, full_177). **NOT a strobe — a travelling front.**"
- **p0 S5 (t=31.5–39, dandelion pompom on coral wash):** emitter hue steps yellow(32) → hot-pink(33.5) → white(35) → mint(36.5) → orange(38.5); "trail keeps old hue → permanent 2-tone ball with a **radial hue front**."
- **Speed calibration (memory `alchemy-measured-color-facts`):** the full-wheel net rate ~5–15s is measured and v7's ~10s base already matches — **the MECHANISM (steps/fronts vs continuous drift) is what's wrong, not the speed**. And it is NOT a 3–5Hz strobe.
- **Mechanism:** the emitter's draw colour holds for 0.75–2s, then jumps a fraction of the wheel; the trail (feedback) still carries the previous hue for ~2s, which *is* the two-generation look — no extra machinery needed once emitter hue is stepped.

### D13 — ONE small vivid accent at a time + brief vivid spikes (P2, 480p; **CONFIRM**)

- **p1 §3.4, verbatim:** "Saturation strategy: muted dusty grounds, **ONE small saturated accent** (orange/jade/magenta orbs, crimson fan) **at a time**; vivid spikes are brief (t=90.3 fold, **~0.6s**)."
- **p1 O11 (t=112.8):** orange disc **#c45304** with lime ring outline, **5–6.5% of frame** — "small, deliberately the most saturated thing on screen."
- **p0 §3.4:** peak saturation lives in the **BG** at the magenta kaleido peak (30.5–31.5) *while motifs stay muted*; on wash scenes the **accent orbs** carry the saturation (vivid red discs on green, t=58.75). I.e. the accent *role* moves between bg (kaleido) and the small orb family (washes) — but there is always exactly one carrier.
- **p3 §4:** grounds measured #3b3f3d / #4e9890 / #9e68b3 …; "Saturation range: vivid marble (S1) → pastel grey (S3) — **keep both extremes, don't average**."
- **Mechanism:** the mutedness *reads* because one small element is allowed to be hot. Not a global saturation lift; a per-element exemption + rare ~0.6s spikes.

### C10 — deposit-holding grounds: the background IS accumulated history; stains live 3–10s (P2, both refs)

- **p1 B7 (t=105–112), verbatim:** "the bg IS old deposits — green blob (#4a9713), orange column, purple slab, grey slab; slowly melting." p1 colour-trace (all scenes): "deposits sink (down-bias ~3–8%/s …), blur as they age, and **KEEP their hue (stratigraphy at t=99.8–101, 116.5); life ~3–8s**."
- **p0 B4 (flat washes, 15.5–23.5 / 31.5–39 / 58+):** "flat, near-static, mid-tone; **holds local pigment stains 5–10s**" — concrete: yellow LL-corner stain ~t33 and a hot-pink stain ~t35.3 both persist on the coral wash for 5–10s.
- **p3 (t=174–184):** the chartreuse mound (#968853) is "restained to orange/red 179–184 BY the strands crossing it (deposit ink stains, **~5s to full recolour**) — not an instant global tint" — i.e. recolouring happens by NEW deposits landing on old, never by tinting.
- **h1 B7 (teal watercolour pool, 101.5–107.5):** "deposits advect on a slow swirl, **diffuse over 4–6s+, hue preserved while fading**."
- **Mechanism:** on calm wash scenes the feedback runs at high decay / low blur, and the procedural ground is dim enough that the buffer's stains read as part of the ground. Multi-second multi-hue layers = **hue stratigraphy**.

### A14 — amoeba/splat filled blobs + deposit puffs (P3, 480p)

- **p1 M9 (t=75.5–76, 90.3):** "Filled wobbly-outline shapes **10–18%** [of frame], lime green **with darker double edge**, outline wobbles per tile (LIVE), used as **tether endpoints**; life ~1–2s."
- **p1 O12:** "pompom/amoeba splat endpoints: milky cotton mounds 15–20% (t=76.5) and pink cotton splats (~15%, t=80.2) **deposited where tethers land; diffuse over 2–4s**."
- **p0 (orb deposits):** "orbs leave soft colour puffs **~1.5–2× their diameter** that fade in **3–6s** (green puffs t=2.5, gold splat t=59.75…)".
- **★CONFLICTED:** p0 additionally claims that gold splat "re-tints pink by 60.5 — deposits change hue as they age". This is contradicted by FOUR colour-trusted reports (p1/p2/h2/r0 — see THE ONE LAW above). **Resolution: deposits are hue-frozen; do not build hue-ageing.** If the user ever asks for it, revisit with a fresh frame extraction of 59.5–60.5.
- **Mechanism:** a splat is a one-shot bright emission at a tether endpoint that the feedback immediately owns (diffuses, fades in place). The crisp wobbly outline is a separate live element that dies in ~1–2s.

---

## 2. Current implementation state

All refs verified against `presets/alchemy-v7.js` @ HEAD (`4db3368`, 1374 lines).

**One clock rules everything (the B7/D12 gap).** `frame()` assembles a single hue: `huePhase` advanced continuously by kit `alcHueClock` (kit.js L810–816) at 0.1 cyc/s calm / 0.2 kaleido (L946–950), plus discrete `hueStep` jumps on bg-mode changes (L951–955) and a rate-limited beat-coupled palette snap (L956–962); `t.q8 = huePhase + hueStep + 0.03*pulse` (L963). Every colour in the preset derives from this one value via `orbCol(h, off)` (L252–254, full-sat cosine palette) or the shader `pal()` (kit L166) with **fixed** offsets:
- central motif: all 17 mode fns read `a.q8` (e.g. `fAnem` L406, `fTether` L870); duos/spreads are fixed offsets.
- orbs: `orbShape` reads `s.q8` L269 (orb B +0.35 via `hueOff`, L1333), `orbGlow` +0.12 further (L318).
- accessories: `a.q8 + 0.18/+0.2/+0.24/+0.3..` (L1195, L1218, L1236, L1255); corridor dots `a.q8` (L1324).
- ground: `pal(hb)` with `hb = q8` (L102, L125–127 and every regime) — the catalog notes this is *by design* ("fg/bg stay analogous"), which makes independent snap moments and complementary pairings **structurally impossible today** (the D12/B7 delta). When the beat snap fires, the whole palette — ground included — moves in lockstep; the refs never do that (p1 S13).

**Hue arrival is continuous** (D12 gap): between the occasional `hueStep` events the emitters drift smoothly. No per-class stepped walk, no travelling front (nearest existing thing: per-sample hue *gradients* like vortex `hue += rad*0.3`, fVortex L567–585 — a static rainbow ramp, not a front).

**Saturation is uniform** (D13 gap): the comp applies one Reinhard + resaturate + deepen + lift + tint chain to the whole frame (`makeComp` L200–227), knobs from `PROFILE_PASTEL`/`PROFILE_VIVID` (L1343–1370). No element-level exemption, no spike mechanism.

**Deposits die in ~1s** (C10 gap): decay `q1 = 0.957` (L969) → the trail falls to ~10% in ~0.9s at 60fps; the compounding 9-tap blur (`q28 = 0.5`, L970; WARP L59–74) diffuses stamps immediately; the pan (`panMag → 0.0045`, L978) drags them; and every ground regime is repainted procedurally each frame (COMP L119–198) and *added* to the trail (L200). Multi-second stains cannot exist. The only precedent for per-scene engine modulation: valley blends `q1 → 0.96` (L1132) and corridor kills pan/magnify (L1112–1114) — the eased-amount pattern to copy.

**No splat events** (A14 gap): `orbGlow` swells on the smoothed pulse (L325) every beat — a breathing halo, not a discrete deposit event; nothing marks tether endpoints.

**Reusable and load-bearing:**
- **Wave/shape point fns run in the file closure** — per-class hue state needs **NO q-vars** (all 32 are taken, header L29–33). Only the ground clock needs a shader channel, and it already has q8.
- **Verified vendor mechanism (butterchurn.min.js):** a custom wave's `frame_eqs(n)` returns object `l`, and *that same object* is passed per-sample to `point_eqs` (`l.sample=…; l = h.point_eqs(l)`). So setting `a.q8 = <closure hue>` inside a wave's `frame_eqs` (or at the top of its point fn) re-scopes the hue for THAT wave only — the shader still sees the global q8. This is the whole trick that makes B7 cheap.
- `hueStep`/`lastHueSnapT` (L883, L906) — the stepped-walk pattern already exists once; generalize it per class.
- `makePicker`/eased scene amounts (`corridorAmt`, `valleyAmt` L888–889) — the gating pattern for C10.
- `orbGlow` (L302–337) — the A14 splat emitter, already additive, already hue-offset (+0.12 "neighbouring-hue watercolour splat").
- waves[3] is **idle outside the corridor** (gate L1311–1314) — the only spare wave capacity, usable for the optional A14 outline ring. The bead-row precedent (removed `bad7755`, note L1292–1297) applies: dots render ~2px fixed; the splat ring below is a LINE loop, not dots, and is a 0.35s flash, not a persistent marcher.
- `window.__ALC_FORCE` (L1136–1140) only sets `t.*` q-vars today; doc 07 Step 0 extends it to closure state — needed here for pinning.

---

## 3. Implementation plan

Slot budget: **zero new waves, zero new shapes.** Steps 1–5 and 7 are frame_eqs/point_eqs JS + two q-var *value* writes (q1/q28, both already engine channels). Step 6b optionally borrows the idle non-corridor branch of waves[3]. All new cross-frame state lives in the file closure (q-vars only where a shader must read it — and no new shader reads are needed). Every step is one commit, individually revertible.

### Step 0 — pin hook for closure state (skip if doc 07 Step 0 landed)

*Target:* the `__ALC_FORCE` block (L1136–1140).
Extend so keys with a `_` prefix write closure vars instead of `t`:

```js
if (typeof window !== "undefined" && window.__ALC_FORCE) {
  var F = window.__ALC_FORCE;
  for (var fk in F) {
    if (fk === "_motifHue") { motifHue = F[fk]; motifHueOld = F[fk]; }
    else if (fk === "_accentHue") accentHue = F[fk];
    else if (fk === "_splat") { if (F[fk] > splatT0) splatT0 = time; }
    else t[fk] = F[fk];
  }
}
```

Production no-op, same as today. Commit: `alchemy: extend __ALC_FORCE to pin closure colour state (debug only)`.

### Step 1 — D12 core: stepped MOTIF hue clock (smallest shippable slice)

*Target:* new closure vars next to `hueStep` (L883); a step block in `frame()` after L963; hue injection at the top of `centralDraw` (L835) and of the waves[1] point fn (L1180).

Closure: `var motifHue = 0, motifHueOld = 0, motifStepT = -9, motifStepNext = 0, accHue = 0.3, accStepNext = 0;`

In `frame()` (after q8 is assembled — the ground keeps the existing continuous q8 exactly as-is):

```js
// D12: EMITTER hue arrives in STEPS (h0: every ~0.75-2s; the trail keeps the old hue
// -> two-generation two-tone for free). Ground stays on the continuous q8 clock.
if (time >= motifStepNext) {
  motifHueOld = motifHue;
  motifHue += (0.06 + 0.10 * Math.random()) * (Math.random() < 0.5 ? -1 : 1);
  motifStepT = time;
  motifStepNext = time + 0.75 + 1.25 * Math.random() * (1.2 - Math.min(0.7, pulse)); // busier music -> shorter holds
}
// accessories: their own slower step walk (p0: bead columns/strands snap at different moments)
if (time >= accStepNext) {
  accHue = t.q8 + 0.18 + 0.3 * Math.random();
  accStepNext = time + 1.0 + 1.5 * Math.random();
}
```

Seed `motifHue = t.q8 + smallOffset` on the first frame (`if (motifStepT < 0) …`). In `centralDraw`, first line: `a.q8 = motifHue;` — all 17 mode fns and their per-mode duo/spread offsets ride the stepped clock **unchanged** (no touching 17 functions), while the SHADER ground keeps the continuous global q8 (per-wave q override is local — verified vendor mechanism, §2). In the waves[1] point fn (L1180): `a.q8 = (Math.abs((a.q30||0) - 1) < 0.5) ? motifHue : accHue;` (the star-net companion follows the motif; free accessories follow their own clock). Leave the corridor-dot wave and the tether on the global q8 for now (Step 2 takes them).

Muted guardrail (6): hue-only; `orbCol` offsets bounded; saturation untouched.
*Composes:* the existing bg-change `hueStep` and beat snap (L951–962) still move the GROUND clock — grounds keep their own era steps, which is exactly tier (c) of h2 §3.6. Rest/dip/q4 logic untouched.
Commit: `alchemy: stepped motif+accessory hue clocks (emitters step 0.75-2s; ground keeps its own clock) [D12/B7]`.

### Step 2 — B7: the accent-family clock (orbs + tether snap together, on their own moments)

*Target:* `orbShape` L269, `orbGlow` L318, `fTether` L870; a snap block in `frame()`.

**If doc 06 Step 2 (`inkOff` per-event accent ink) has already landed:** do NOT add a parallel variable. Instead re-time it to be the B7 accent clock: snaps gated on beats with a 0.6s floor (h2 tier b: 0.5–0.75s on compact orbs; r0: 1.5–3s per event — beat-gating with a 0.6s floor spans both depending on music), and make the *base* it offsets the accent's own held value rather than the live q8 (so a ground era-step no longer drags the rings mid-event).

**Standalone version:** closure `var accentHue = 0.55, accentSnapT = -9;` In `frame()`:

```js
// B7: accent family (both orbs + tether share one ink; r0 "tether hue = ring hue") snapping
// on its OWN moments — never in lockstep with the ground or motif clocks.
if (f > 0.6 && time - accentSnapT > 0.6) {
  accentHue = t.q8 + (0.08 + 0.17 * Math.random()) * (Math.random() < 0.5 ? -1 : 1);
  accentSnapT = time;
}
```

Then replace the base hue reads: `orbShape` L269 `var hf = accentHue + (hueOff || 0)`; `orbGlow` L318 `var hf = accentHue + (hueOff || 0) + 0.12`; `fTether` L870 `var h = accentHue + 0.08`. Keep the per-orb identity offsets (0 / 0.35) — incremental, risk (4) friendly. Corridor dots (L1324) may also join (`accentHue`) so the corridor row matches its anchor orbs.

Result: **three independent clocks** — ground (q8: continuous + era steps), motif (stepped walk), accent (beat snaps) — precisely r0 §3.3's structure, plus the accessory walk from Step 1.
*Composes:* doc 06's per-event tether lifecycle will later re-snap `accentHue` per tether cast — same variable, no conflict. Doc 03's scheduler can register `accent-snap` as an event type.
Commit: `alchemy: orbs+tether share an accent-family hue clock snapping on beats [B7]`.

### Step 3 — B7: complementary fg/bg seeding at motif swaps

*Target:* the motif snap point (L995–996, where `t.q30` snaps at crossfade midpoint).

When the motif identity snaps (detect `mCur !== lastMCur`, new closure `lastMCur`), re-seed the motif clock *relative to the ground*:

```js
if (mCur !== lastMCur) {
  lastMCur = mCur;
  motifHueOld = motifHue;
  motifHue = Math.random() < 0.25
    ? t.q8 + 0.5 + (Math.random() - 0.5) * 0.16   // complementary (p1 M2: red mesh ON green ground)
    : t.q8 + (Math.random() - 0.5) * 0.3;          // analogous (the default harmony)
  motifStepT = time;
}
```

The q4 opacity dip (L997–1000) already hides the seam. Muted guardrail: this changes *hue relationships* only; on the Pastel profile a complementary pair still renders dusty (comp resaturate is unchanged).
Commit: `alchemy: motif hue re-seeds vs ground at swaps; 1-in-4 complementary pairing [B7]`.

### Step 4 — D12: radial hue FRONT on radial motifs

*Target:* `centralDraw` (L835–847). Radial modes: 0 anemone, 2 urchin, 8 vortex, 9 jelly, 13 tangle, 16 fluff.

For ~1.8s after a motif hue step, the NEW hue occupies the disc centre-out; the OLD hue persists at the rim (h2 §2.8). The mode fns compute colour from `a.q8` after geometry, so run the fn, measure the sample's radius, and re-run with the old hue for samples beyond the front (the fns are cheap and deterministic per sample — same `a.sample`/`a.value1` gives identical geometry):

```js
var RADIAL_FRONT = { 0: 1, 2: 1, 8: 1, 9: 1, 13: 1, 16: 1 };
function centralDraw(a) {
  var m = …;
  a.q8 = motifHue;
  MODES[m](a);
  var fr = (nowT - motifStepT) / 1.8; // nowT: closure copy of time, set each frame()
  if (RADIAL_FRONT[m] && fr < 1) {
    var cx = a.q2 !== undefined ? a.q2 : 0.5, cy = a.q3 !== undefined ? a.q3 : 0.5;
    var rr = Math.hypot(a.x - cx, a.y - cy) / ((a.q5 || 0.4) * 1.1);
    if (rr > fr) { a.q8 = motifHueOld; MODES[m](a); } // outside the front: redraw colour in the OLD hue
  }
  … // existing squash + alpha lines unchanged
}
```

Cost: ≤2× the 512-point wave during front windows on radial modes only. Non-radial modes (beams/chords) get their fronts later via doc 06 (along-length) — out of scope here. Note the trail *already* shows the front's history (old-hue rim ghosts) for free; this step makes the LIVE emitter show it too, which is what h2 measured.
Commit: `alchemy: travelling centre-out hue front on radial motifs (1.8s, old hue holds the rim) [D12]`.

### Step 5 — C10: deposit-holding flat wash (CONFIRM #2 first; risk (4))

*Target:* a scene-coupling block in `frame()` next to the corridor/valley couplings (after L1124); engine channels q1 (L969) / q28 (L970) / `panMag` (L978).

**If doc 01's field engine has landed:** implement this as one more consumer — extend its REST/FREEZE gate to `bgMode === 5` and stop; do not duplicate the eases.
**Standalone version** (copy the `corridorAmt` eased pattern, L1106):

```js
// C10: DEPOSIT-HOLDING WASH — on the flat wash the bg IS the scene's history (p1 B7):
// stains must live 3-6s (p0: 5-10s), so decay up + blur down + pan damped. Wash-gated ONLY.
washHold += ((bgMode === 5 ? 1 : 0) - washHold) * Math.min(1, dt * 0.5);
if (washHold > 0.01) {
  t.q1  += (0.988 - t.q1)  * washHold;  // 10% at ~3.2s, 5% at ~4.1s (was 0.957: dead in ~0.9s)
  t.q28 += (0.18  - t.q28) * washHold;  // stains blur slowly, stay legible (not the instant bleed)
  t.q18 *= 1 - 0.7 * washHold;          // stains hold in place (p0: washes "near-static")
  t.q19 *= 1 - 0.7 * washHold;
}
```

White-guard (risk 6): do NOT raise the trail composite gain (L200 stays `trail * 1.28`); the Reinhard knee is the ceiling. The motif's Lissajous drift (L1011–1012) bounds per-pixel dwell, but verify no blow-out in the acceptance check; if a hot core appears, lower waves[0] alpha under `washHold` (multiply `t.q4` by `1 - 0.15*washHold`) rather than touching the comp. If the corridor or valley coupling co-occurs it wins (they run later in `frame()` and overwrite pan/decay — keep this block ABOVE L1101). Hue stratigraphy (p1: layers at 99.8–101) now emerges by itself: successive motif hue steps deposit differently-coloured stains that coexist because trails are hue-frozen.
Commit: `alchemy: flat wash holds deposits 3-6s (decay/blur/pan eased, wash-gated) [C10]`.

### Step 6 — A14: splat deposit events at tether endpoints

*Target:* `orbGlow` (L302–337) + a trigger in `frame()`; optional 6b in waves[3] (L1310–1330).

6a (the deposit): closure `var splatT0 = -9;` Trigger where the tether flashes (the refs deposit splats *where tethers land* — p1 O12): in `frame()`, `if (f > 0.85 && time - splatT0 > 4 && t.q25 > 0.45 && t.q14 > 0.45) splatT0 = time;` (if doc 03's scheduler landed, register `splat` as an event type instead). In `orbGlow.frame_eqs` add:

```js
var sl = (nowT - splatT0) / 0.35;
var spl = sl >= 0 && sl < 1 ? Math.sin(sl * 3.14159) : 0;   // one 0.35s emission
s.rad = (s.q7 || 0.06) * (1.7 + 0.5 * be + 1.1 * puls + 1.3 * spl);
s.a = (0.42 + 0.5 * spl) * vis;
```

The 0.35s swell stamps a fat neighbouring-hue puff ~2× the orb diameter into the feedback (p0: 1.5–2×), which then diffuses 2–4s (3–6s on the C10 wash) and — per THE ONE LAW — keeps its birth hue forever. **Honesty about the ceiling:** the refs' crisp *filled* wobbly-outline amoeba (p1 M9, 10–18%, lime, double edge) has NO renderer in budget — all 4 shape slots are taken and Butterchurn shapes are rigid n-gons (can't wobble an outline); this glow-stamp route is the matrix-sanctioned approximation ("deposit = trail").

6b (optional, the darker double edge): waves[3]'s idle branch (it early-outs whenever `q29 !== 3`, L1311–1314) can flash the outline: when `!corridor && spl > 0`, draw an 80-sample closed loop at the splatting orb, radius `1.15 × glow radius`, displaced by the REAL waveform (`a.value1 * 0.012` — "wobbly outline" always means live audio, per the terminology rule), colour `orbCol(accentHue + 0.12) * 0.45` (darker edge), `a.a = 0.7 * spl`. It dies with the 0.35s window — no marching, no beads (the `bad7755` precedent stays respected).
Commits: `alchemy: tether-endpoint splat deposits via orbGlow swell events [A14]`, then optionally `alchemy: splat wobble-outline flash on the idle waves[3] branch [A14]`.

### Step 7 — D13: one-vivid-accent policy (CONFIRM #1 first)

*Target:* `orbShape`/`orbGlow`/`fTether` colour lines; a small desat helper next to `orbCol` (L252); NO comp/profile changes.

Emit-side only — the comp profiles (L1343–1370) are untouched, so this changes the saturation *ordering*, not the envelope:

```js
// D13: everything EXCEPT the accent family gets a mild emit-time desaturate, so the small
// accent orb+tether reads as "deliberately the most saturated thing on screen" (p1 O11).
function mut(c, l) { return c + (l - c) * 0.14; }  // pull 14% toward luma
// in centralDraw + accessory colour blocks:  var l = 0.299*a.r+0.587*a.g+0.114*a.b;
//   a.r = mut(a.r,l); a.g = mut(a.g,l); a.b = mut(a.b,l);
// in orbShape/orbGlow/fTether: draw at full orbCol saturation, brightness ×(1 + 0.35*spike)
```

Spike: closure `spikeT0`; on rare strong beats (`f > 0.95 && time - spikeT0 > 8`) open a 0.6s window (p1: vivid spikes ~0.6s) that multiplies ONLY the accent family's brightness ×1.35 (clamped ≤1 pre-draw). Exception rule (p0 §3.4): while the kaleidoscope regime is up (`bgMode === 1`) the BG is the saturation carrier — suppress the orb accent boost there (`accentBoost *= (bgMode === 1 ? 0 : 1)`) so there is only ever ONE hot element. Accent stays in the sanctioned zones: small orbs (q7 ≈ 6% ≈ the refs' 5–6.5% discs) + additive cores + kaleido; the field is never lifted.
Commit: `alchemy: one-vivid-accent policy — accent family exempt, others mildly muted at emit, 0.6s spikes [D13]`.

**Recommended landing order:** 0 → 1 → 2 → 3 → 4 → 5 → 6 → 7. Steps 1–4 are pure JS colour plumbing (lowest risk, highest structural value); 5 needs confirm #2; 7 needs confirm #1; 6 can land any time after 2.

---

## 4. Verification recipe

After EVERY step:

```bash
cd /Users/sujitk/projects/personal/ytmusic-wmp-visualizer
node --check presets/alchemy-v7.js
npm test          # runs tools/test.mjs: node --check everything + concat kit→families into one
                  # global scope, build every preset, run each frame_eqs (catches missing closure refs)
```

Additionally exercise the point fns once in Node (the smoke test only runs frame_eqs):

```bash
node -e 'const fs=require("fs"),vm=require("vm");global.window=global;
 ["kit","dance","alchemy-v7","alchemy-motion","ambience","battery"].forEach(f=>vm.runInThisContext(fs.readFileSync("presets/"+f+".js","utf8")));
 const p=window.WMP_PRESETS["Alchemy (Pastel)"];
 p.frame_eqs({time:2,bass:1.3,bass_att:1.1,mid:1,treb:1,treb_att:1});
 for (const w of p.waves) if(typeof w.point_eqs==="function") w.point_eqs({sample:.5,value1:.3,q2:.5,q3:.5,q5:.4,q8:.2,q4:1,q30:2,q29:0,q9:0,q6:.05,time:2});
 for (const s of p.shapes) if(s.frame_eqs) s.frame_eqs({q21:.4,q22:.5,q7:.06,q8:.2,q25:1,q32:1.2,bass_att:1.1});
 console.log("point/shape fns ok");'
```

Self-render (GLSL is untouched by steps 1–4/6a/7, but always confirm no `[WMP-viz shader]` errors):

```bash
node tools/selfrender.mjs "Alchemy (Pastel)" 3,8,9,10,11,20,30
# pinned runs — the FORCE env is JSON assigned to window.__ALC_FORCE (see the scratchpad
# pinrender.mjs pattern; q-vars pin directly, underscore keys pin closure state via Step 0):
FORCE='{"q30":2,"q29":5}'          node <pinrender> "Alchemy (Pastel)" 6,8,10,12,14   # urchin on flat wash
FORCE='{"q30":2,"q29":0,"_motifHue":0.65}' node <pinrender> ...                        # pinned motif hue
FORCE='{"q29":5,"_splat":1}'       node <pinrender> "Alchemy (Pastel)" 5,5.4,8        # splat event on wash
```

Per-step acceptance checks (each phrased as something visible in a screenshot):

- **Step 1 (stepped clocks):** pin `q30:2, q29:5`; shots at 8/9/10/11s. The urchin's spike colour is IDENTICAL between at least two adjacent shots and clearly JUMPED (a distinct hue family, not a slight shift) across another pair, while the wash ground colour moves smoothly and does NOT jump at the motif's step moments. Behind fresh spikes, a ghost of the urchin in the PREVIOUS hue is visible (two-generation two-tone).
- **Step 2 (accent clock):** pin `q29:0`; shots straddling a beat-heavy stretch. Both orbs' rings and the tether share ONE hue; that hue differs from the central motif's; across shots the orb hue changes at a DIFFERENT shot-pair than the motif hue does (independent moments).
- **Step 3 (complementary seeding):** unpinned 90s run, shots every ~8s (~10 motif swaps): at least one frame shows a near-complementary motif-vs-ground pairing (e.g. reddish motif on greenish wash — the p1 M2 look); the rest stay analogous.
- **Step 4 (radial front):** pin `q30:2, q29:5, _motifHue` then release; shoot 0.5s and 1.2s after a step: at 0.5s the urchin CENTRE (inner ~third of its radius) is in the new hue while the outer rim spikes are still the old hue; at 1.2s the boundary has moved outward; by 2s the whole disc is the new hue with only the trail rim ghost old.
- **Step 5 (deposit-holding wash):** pin `q29:5`; shots at t, t+3, t+5: a coloured stain (motif trail patch) is visible at the SAME location 3s later at reduced alpha, still hue-recognizable at 5s; two stains of different hue families coexist (stratigraphy); NO region of the frame is blown to flat white; when the bg swaps off the wash, trails shorten back to ~1s.
- **Step 6 (splats):** pin `q29:5, _splat`; shot 0.2s after trigger: a soft round puff ~2× the orb's diameter in the glow's neighbouring hue sits at the orb; shot +3s: the puff has spread and faded in place, SAME hue (never re-tinted). With 6b: the 0.2s shot also shows a darker, audio-wobbled outline ring hugging the puff edge; the +3s shot shows NO ring (it died with the window) and no bead/tube artifacts anywhere.
- **Step 7 (one vivid accent):** unpinned shot on a wash scene: the small orb pair + tether are unmistakably the most saturated elements (eyedropper: their sat exceeds the motif's and the ground's); the ground still reads dusty/pastel (compare against a pre-step screenshot — ground unchanged). On a kaleidoscope shot the orbs do NOT carry extra saturation (the bg is the hot element). Overall frame still matches the muted 480p character (memory `alchemy-measured-color-facts`: the 480p, not the washed 1080p, is the colour truth).

Final: a 60s unpinned run of BOTH variants (`"Alchemy (Pastel)"`, `"Alchemy (Vivid)"`) — no shader-error lines, no regressions in corridor/valley scenes (their couplings overwrite this doc's channels and must still look as shipped).

---

## 5. Risks & rollback

- **(4) rejected-rework class — C10 (Step 5).** The user rejected a wholesale camera/motion rework (`9ba675e`; it lives in `presets/alchemy-motion.js`). C10 modulates the SAME engine channels (decay/blur/pan). Mitigation: it is data-only (no warp GLSL edit), gated to ONE bg regime (flat wash, ~1/15 bag weight), eased in/out, placed above the corridor/valley couplings so the shipped scenes always win, and shipped as one commit for live verification (confirm #2). If doc 01's engine lands first, this becomes a one-line gate extension there instead.
- **(6) muted-Pastel guardrail — B7/D12/D13.** Steps 1–4 are hue-only (offsets on the same cosine palette; comp untouched) — the measured sat ~0.3–0.5 envelope cannot move. Step 7 deliberately touches saturation and is therefore confirm-gated (#1); even then it only *reorders* saturation (accent up locally, everything else pulled 14% toward luma at emit) and never edits the profiles (L1343–1370). Never lift highlights (memory `alc-colors-were-washed-out`).
- **(6) accumulation-to-white — C10 + A14.** Longer-lived deposits + additive stamps can pile to white pre-tone-map (framebuffer clamps per channel). Guards: trail composite gain stays 1.28 (L200), decay capped at 0.988, blur ≥0.18 on the wash, splat window 0.35s with ≥4s spacing; acceptance checks explicitly look for blown regions. Fallback knob: scale `t.q4` down under `washHold`.
- **(1) shape-slot pressure — A14.** No free shape slot exists (this is what killed the bead row, `bad7755`); the splat is therefore a glow-stamp into feedback + an optional short-lived wave outline. Do NOT attempt a filled wobbly polygon; do NOT put anything persistent or marching into waves[3] (the removed-accessory precedent).
- **(5) no invented elements.** Everything here is timestamp-backed (§1). The one contested behaviour — hue-ageing deposits — is explicitly NOT built (4-vs-1 conflict resolution, A14).
- **User-rejected behaviours touched:** none directly; but Step 1 changes how the shipped motif colours move (steps instead of drift). If the user reads the steps as "blinky", lengthen holds to 1.5–2.5s (h2's roll tier) before abandoning — the measured refs step, so tune cadence, not mechanism. Per memory `dont-over-iterate-speculatively`: after each commit, self-render, show the user, ask ONE question, wait.
- **Rollback plan:** one commit per step (messages given in §3). Each step is a plain `git revert` with no cross-step entanglement except: Step 4 requires Step 1 (revert 4 before 1); Step 6/7 read `accentHue` from Step 2 (revert 6/7 before 2). Steps 3 and 5 are fully independent.

---

## 6. Acceptance criteria

The cluster is DONE when all of the following hold in unpinned self-renders (and the user confirms live):

- [ ] **Three-plus independent clocks visible (B7):** over any ~30s span, the ground hue, the central-motif hue, and the orb+tether accent hue each change at moments that do not coincide (screenshot-pair diffing shows each layer changing while the others hold — the p1 S13 / r0 §3.3 structure).
- [ ] **Emitter hue arrives in steps (D12):** the motif's draw colour holds ~0.75–2s then jumps a visible hue-family; fresh strokes in the new hue coexist with trail ghosts in the old hue (two-generation two-tone), and the net full-wheel rate stays in the measured ~5–15s band (no strobe).
- [ ] **Radial fronts (D12):** after a step on anemone/urchin/jelly/tangle/fluff/vortex, the new hue visibly occupies the centre first and reaches the rim in ~1.5–2s, with the old hue persisting longest at the rim.
- [ ] **Complementary pairings occur but don't dominate (B7):** roughly 1 in 4 motif appearances sits complementary to its ground; the rest are analogous; both read muted on Pastel.
- [ ] **Trails/deposits NEVER retro-tint (law):** any stain, once deposited, only fades/desaturates in place — verifiable by tracking one stain across 3+ screenshots.
- [ ] **Flat-wash scenes hold history (C10):** stains persist 3–6s (recognizable at 5s), multiple hue generations coexist as stratigraphy, camera-dragging of stains is visibly reduced, and no white blow-out appears; other bg regimes keep today's ~1s trails.
- [ ] **Splat events (A14):** tether casts occasionally (≥4s apart) deposit a soft puff ~1.5–2× the orb diameter at an endpoint that diffuses over 2–4s in its birth hue; (if 6b shipped) a darker live-waveform outline flashes for ~0.35s and leaves no artifacts.
- [ ] **One vivid accent (D13, if confirmed):** on wash/fluid scenes exactly one small element family (orb pair + tether, ≤~6.5% of frame each) is the most saturated thing on screen; on kaleidoscope scenes the bg takes that role and the orbs stand down; vivid spikes last ~0.6s and are rare; the overall frame still measures muted (480p character, not the washed 1080p).
- [ ] **No regressions:** corridor and valley scenes render as shipped; `npm test` green; no `[WMP-viz shader]` errors; Vivid variant unaffected except by the shared emit-side changes.
