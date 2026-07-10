# 14 — Ray-star family dedupe, chromatic doubling, radial hair field, lighthouse fans, oblate spinner disc

> **★ STEPS 3-4 LANDED (2026-07-10; steps 1-2 landed 2026-07-07 as "doc 14a"):** A20 spinner =
> **mode 21** — pinwheel core ~3s/rev + fringe restyle 1-2s (lash/scribble/spikes,
> `FORCE._spinStyle` pin); tilt FIXED mild per the crisp-symmetric rule; jelly untouched.
> D10 lighthouse = the accLine-1 rework: ONE strand from a compositional pivot (orb/tether-mid/
> hub) **captured at pick** (live-tracking pivot painted a woven grid), sweeping ~14°/s for the
> whole dwell; shares the swath's tick + mini-freeze (braided-rope lesson). A17 scale class NOT
> built (frame-filling conflicts with the 2026-07-10 compact-motif rule — revisit only on user ask).

**Matrix items:** D8 (ray-star dedupe + true chromatic doubling) · A17 (full-frame radial hair field) · D10 (accessory fans → lighthouse fans) · A20 (oblate spinner disc)
**Priority:** all P2
**Risk flags:** D8 none · A17 (4) via C2 — the radial-out streaming warp belongs to doc 01 · D10 (4) accessory rework was in the rejected-rework blast radius, one change at a time + live-verified · A20 none
**Confirmation needed:** no. Two decisions are MADE in this doc (a coder should not re-litigate them, but the user may veto live): (1) A20 spinner ships as a NEW motif mode reusing an `fJelly`-derived helper — plain jelly (mode 9) is preserved (honours the variants-over-choosing preference); it is NOT a rewrite of fJelly. (2) D8 chromatic doubling ships as cheap per-wave offset copies in this doc; the systematic global per-channel feedback offset is deferred to doc 01. Both D10 and A17 reach FULL fidelity only after their doc-01/doc-02 warp prerequisites land — until then they ship as the graceful-degradation forms described below.

---

## 1. Reference behaviour (what the original does)

### D8 — ray-star modes are near-identical + real chromatic doubling

- The survey memory flags that "several motif modes render as near-identical giant ray-stars (1/2/10 and friends) and can dominate minutes" — a dedupe/reweight problem, not a missing element.
- Chromatic doubling is a **systematic** trait, not a per-mode quirk: sharp elements are drawn as **2–3 RGB-offset copies of the SAME stroke** (2–4 px spatial offset, red/blue channel split). Evidence: p0 M2 (magenta chromatic ghosting between copies); h2 2.7 (star outlines with chromatic pink/green/blue edge offsets); h1 §4 (tether trail "ages toward blue/red chroma-split"; the cheap mechanism is a per-channel ±1px feedback offset). The reference doubling is a geometric offset, NOT two adjacent hues on alternating arms.

### A17 — full-frame radial hair/filament FIELD, outward-streaming

- h1 M6 (95.5–101.5): full-frame wavy ribbons, transverse period 40–60 px, **outward feedback streaming 2–4 %/s**, whole-field hue journey mauve→cyan over ~5–6 s, resolving into concentric moiré ripples.
- h0 M11 anemone: filaments radiate from a dark central hole **all the way TO THE FRAME EDGES** (the "motif IS the background" scale class); eras re-tint by overdraw.
- Emitter-vs-trail split: the crisp radial hairs are the emitter; the outward _streaming_ is a TRAIL-field displacement (radial-out advection), not element motion. The streaming regime is doc 01's C2 field — see cross-ref in §3.

### D10 — accessory fans are persistent lighthouse fans (one live strand + trail copies)

- h2 2.3: 50–150 rays; "sweeps like a lighthouse **~10–20°/s**… fan spread opens/closes over ~1 s; pivot re-anchors… pivot placement is compositional: ON the tether mid-span, hidden behind the star head, BETWEEN the mushroom caps."
- p0 M10 (39–44.5, bursts 39/41.5): fan rotates continuously **15–25°/s** while the central clump stays PINNED at the pinch point; ray trails accumulate into translucent moiré **curtain sheets**.
- h1 M2: 40–80 spokes.
- **Emitter-vs-trail mechanism (measured, p0 wavetest_21 on the sibling harp swath M6):** the parallel strands do **NOT** re-jag — they are **FROZEN TRAIL COPIES of one moving chord; only the newest edge strand is live**. The fan = one strand whose free end sweeps while the apex stays pinned, stamping copies that the feedback buffer freezes. Life 5–20 s (vs our 1.6 s), older strands blur/dissolve over ~4–6 s. The freeze/copy mechanic itself is doc 02's job — see cross-ref.

### A20 — oblate spinner disc (rotating pinwheel core + fringe-restyle cycling)

- h0 M9 (t=46.8–52, ~5 s, a DOMINANT motif): tilted ellipse ~520×300 px (~40 % frame width), centred slightly left.
- Rim = tangential feathery fringe (60–90 px strokes woven around the rim). Interior = smooth **marbled fill** with an orange/gold kidney patch + crimson wedge + dashes.
- Core = a **PINWHEEL spiral that visibly ROTATES**, period **~2–4 s** (arm angle changes tile-to-tile in burst_49.5).
- Fringe **RESTYLES every ~1–2 s**: teal lash spokes → blue curly scribble → orange/yellow spikes with rays 2× diameter. This is another instance of the per-appearance re-roll grammar (cf. A5/A16).
- **Two-generation fringe tinting** — "the old fringe's hue lingers under the new style" — this comes FREE from the always-on decay trail (no special mechanism needed). Marbled interior likewise rides the trail buffer: stamped core strokes smeared by the compounding blur read as marble.
- Born from the previous scene's trail imprint at the 46.8 wash flood (an emitter-handoff — out of scope here; see doc 04).
- Note: this reference region (46.8–52) OVERLAPS the frames our `fJelly` cites ("reworked against the ACTUAL 0:47–0:53 reference"). Our jelly is a _under-featured_ reading of the same disc (tilt + filaments, but no core rotation / restyle / marble). We add the full reading as a distinct mode rather than mutate the tuned jelly.

---

## 2. Current implementation state (verified file:line)

`presets/alchemy-v7.js`:

**Motif dispatch:** `MODES` array L807–825 (17 entries, ids 0–16). `MODE_ALPHA` L827–831 (17 entries). `scaleFor` L832–834 (mode 0 → 0.36, all others → 0.4 — no frame-filling scale class exists). `MOTIF_BAG` L923–924 = 25 weighted entries.

**D8 — ray-star look-alikes (verified count of MOTIF_BAG):**
`[0,0,1,1,2,3,4,5,6,6,7,7,8,9,10,11,12,13,13,14,15,15,16,16,1]`

- mode 1 star-net → weight **3**, mode 2 urchin → **1**, mode 8 vortex → **1**, mode 10 12-star → **1** = **6/25** of the bag reads as giant radial ray-stars.
- mode 16 fluff ball → **2** is star-adjacent, so the look-alike share is up to **8/25**.
- The current "chromatic doubling" is FAKE: `fStarNet` L430 sets `h = q8 + 0.18 + (seg&1 ? 0.35 : 0)` (alternating-arm hue duo) and `f12Star` L648 sets `h = q8 + 0.1 + (seg&1 ? 0.35 : 0)` — two adjacent hues on alternating arms, NOT offset copies of one stroke. `fUrchin` (L438–451) and `fVortex` (L567–585) are single-hue.

**A17 — no full-frame radial class:** `fUrchin`/`fAnem`/`fFluffBall` are bounded by `scaleFor` (0.36–0.4) so they never reach the frame edge; there is no outward-streaming trail regime (that regime is doc 01's C2, absent).

**D10 — accessory fans (director L1063–1096):** `accLine` re-rolls every 5–11 s (L1067–1068): `1 = ray-curtain (p≈0.20)`, `4 = pinwheel (p≈0.26)`. Ray-curtain (built L1225–1245) = **16 straight parallel rays** with a fixed perpendicular offset, one-shot **sine envelope over 1.6 s** life (L1080–1081), pivots 0.8 rad while alive. Pinwheel (built L1203–1224) = 8 lines through a hub anchored to the motif centre, steady 0.28 rad/s. Neither is a pinned-apex, single-live-strand, tens-of-seconds lighthouse fan; neither reuses tether-midpoint/orb pivots.

**A20 — nearest cousin is `fJelly` (mode 9, L591–616):** compact tilted furry disc — 64 golden-angle filaments, live-audio length, tangential curl, tilt oscillation 0.30–0.65 (`q9·1.7`). It has NO core rotation, NO fringe-restyle cycle, NO marbled fill. `MODE_ALPHA[9]=0.34` (lowest — the additive filament pileup was blowing the core to white). No spinner mode exists and it is not otherwise covered.

**Budget (catalog §7):** waves[0] = the central motif (all modes share it), waves[1] = star-net companion / accessory (curtain/bundle/pinwheel), waves[2] = tether, waves[3] = corridor ring-dot row. All 4 shape slots are the 2 orbs × (fill+glow). **A new motif costs ZERO extra slots** (it is another `point_eqs` branch on waves[0]). q1..q32 are fully allocated (catalog §Q-var contract) — no free q-var.

**Cross-doc collision to respect:** doc 02 Step 4 ("A10 scallop marcher") already claims **new motif mode 17**. If both docs land, the spinner must take the NEXT free id (18 if doc 02 lands first). This is a second reason to prefer a jelly-derived helper appended at the tail rather than assuming id 17.

---

## 3. Implementation plan (smallest slice first; revert gate after each step)

Guardrails honoured throughout: **4 waves + 4 shapes** (no step adds a slot — motif modes ride waves[0], the lighthouse fan reuses waves[1]); **32 q-vars already taken** (no step needs a new q-var; sub-clock state lives in the closure like `accLine*`); **kit factories** reused where variants exist (`orbCol`, existing disc math); **Pastel stays muted** (sat 0.3–0.5, vivid only in kaleido/additive cores). Faithfulness: every element below is measured in a reference — nothing invented.

### Step 1 — MOTIF_BAG reweight (data-only, no code change) — DO THIS FIRST

Reduce the ray-star share from 6/25. Concretely: drop star-net (mode 1) from weight 3 → 2 (remove one of the two leading `1`s or the trailing `1`), keeping urchin/vortex/12-star at 1 each — target ≈ **5/25 or lower** for the 1/2/8/10 family. Redistribute the freed weight toward under-represented distinct motifs (spirograph/mesh/valley/mountains — whichever are highest-value per the sibling docs) so total runtime feels varied. This is a single-line edit to the `MOTIF_BAG` array (L923–924); `motifPick`'s `makePicker(MOTIF_BAG.length, …)` re-reads length automatically. **Revert gate:** if variety regresses, restore the array line.

### Step 2 — true chromatic doubling as a per-point colour change (D8)

Replace the fake alternating-arm hue duo with **offset copies of the same stroke**, inside the existing wave (no new slot). In `fStarNet` and `f12Star` (and optionally `fUrchin`/`fVortex`), **sample-split** the 512 samples into 2 interleaved passes by point index parity:

- pass A: offset the drawn point by `+δ` (δ ≈ 0.006–0.010 in 0..1 ≈ 2–4 px), boost `a.r`, cut `a.b` (red-lean copy);
- pass B: offset by `−δ`, boost `a.b`, cut `a.r` (blue-lean copy).
  Keep the base hue on the shared `q8` clock so it stays analogous/muted. This halves effective ray sample-density per copy (~256 samples/copy across 6–12 rays — still dense enough). Remove the `(seg&1 ? 0.35 : 0)` duo term (L430, L648). **Revert gate:** if the fringe reads as neon or the geometry frays, restore the single-copy hue lines.
- **Deferred (do NOT build here):** the _systematic_ global version — a per-channel ±1px sampler offset in the comp/warp that fringes ALL sharp elements (the true reference mechanism, h1 §4) — is a warp-program change (risk 4). **Cross-ref doc 01** (camera & per-scene displacement engine); land it there, one field at a time, not in this doc.

### Step 3 — oblate spinner disc as a new mode (A20)

Add `fSpinnerDisc` by factoring `fJelly`'s disc/tilt scaffold (L591–616) into a shared helper both call (jelly = plain, spinner = full). Append it to `MODES` (tail; id 17, or the next free id if doc 02's scallop already took 17 — see §2 collision note), append one `MODE_ALPHA` entry (~0.40 — the marble is trail-borne and the core is a small stroke count, so slightly above jelly's 0.34), and give it bag weight in the Step-1 rebalanced `MOTIF_BAG` (2–3, matching its "dominant motif" role). Construction, all on waves[0] via sample-partitioning (like `fValley`'s spine split):

- **Core (~first 30 % of samples):** a pinwheel spiral `ang = k·r + spin`, `spin = q9·(fast)` giving a **2–4 s** rotation period (a per-motif spin override — faster than the shared `q9=time·0.06`; scale a local multiplier so period lands 2–4 s). A few short arms; the compounding blur smears them into the **marbled fill** (rides the trail buffer — no fill geometry drawn, faithful to §1).
- **Rim fringe (~remaining 70 %):** tangential feathery strokes woven around the oblate rim (reuse the tilt-squash), whose **STYLE re-rolls every 1–2 s** via a closure sub-clock `spinStyle ∈ {lash, scribble, spikes}` (like `accLine`'s pick clock at L1067): lash = straight tangential spokes; scribble = curly (add `sin` curl to the stroke); spikes = longer radial rays (2× length). Branch the fringe point_eqs on `spinStyle`.
- **Two-generation tinting** comes FREE from decay (old fringe lingers) — do not build a separate mechanism.
- **MODE_ALPHA implication:** keep the new entry low-ish (~0.40) to avoid additive white-out of the core, same failure `fJelly` hit; tune from the self-render.
- **Revert gate + fallback-to-variant:** guard the restyle/core behind a single local constant so disabling it degrades `fSpinnerDisc` back to plain-jelly rendering; if the disc reads wrong, flip the constant (or drop the mode from the bag) rather than touching mode 9.

### Step 4 — lighthouse-fan conversion of the accessory (D10) — LAST, risk (4)

Rework the `accLine===1` ray-curtain (build L1225–1245, life L1080–1081) from 16 parallel one-shot rays into a **pinned-apex lighthouse fan**: ONE live strand (a `waveLine` A→B) whose apex is **pinned to an orb q-position or the tether mid-span** (reuse `q21..q24`/`q2,q3`, per h2 §4 compositional pivots) while the **free end sweeps continuously at ~10–20°/s** for a long life (extend from 1.6 s to ~5–20 s; drive the sweep angle off `time` in the director, not the 1.6 s envelope). The **fan body = frozen trail copies** of that sweeping strand — **defer the freeze/copy mechanic to doc 02** (its Step 3 "A3 harp swath: accessory type 5 — ONE pinned sweeping strand + frozen copies" is the exact same mechanism; build the emitter here, let doc 02's freeze field / low-blur region deliver the crisp moiré curtain). **Graceful degradation:** before doc 02 lands, the standard decay (0.957) already smears the sweeping strand into a soft curtain — acceptable, just blurrier than the reference moiré. **Revert gate (mandatory, risk 4):** ship as ONE change, self-render, screenshot to the user; if rejected, `git revert` to the 16-ray curtain. Do NOT also touch the pinwheel (accLine 4) in the same step.

### Note on A17 (mostly a cross-reference)

A17's core — the **outward-streaming radial trail-displacement regime** — is doc 01's C2 field #3 ("RADIAL-OUT field under radial filament motifs", doc 01 Step 4). **Do not build the warp here.** What THIS doc contributes is the **"motif IS the background" full-frame scale class**: allow the radial motifs (urchin/anemone/fluff, and the Step-3 spinner) to scale up toward frame-filling under that regime — a `scaleFor`/`q5` tweak (L832–834, L1015), cheap and slot-free — so that when doc 01's radial-out field is active the hairs read edge-to-edge. Land the scale tweak only alongside or after doc 01 Step 4; on its own it just makes a bounded motif bigger.

---

## 4. Verification recipe

Per the CLAUDE.md workflow — validate in Node BEFORE asking for a reload; GLSL is untouched by this cluster (all changes are JS point_eqs + data arrays), so no ANGLE pre-check is needed.

**Static check (every step):**

```bash
cd /Users/sujitk/projects/personal/ytmusic-wmp-visualizer
for f in presets/*.js viz.js content.js; do node --check "$f" || break; done   # or: npm test
```

**Concat + frame_eqs smoke test (catches missing kit refs / throwing eqs):** run the concat snippet from CLAUDE.md (kit + families in one global scope, build every preset, call each `frame_eqs`). Confirms the new `MODES`/`MODE_ALPHA`/`MOTIF_BAG` lengths stay consistent and `fSpinnerDisc` builds.

**Self-render pinning (per affected mode) — the primary visual gate:** use `node tools/selfrender.mjs` with the scratchpad `pinrender.mjs`, pinning `window.__ALC_FORCE` (production no-op, L1136–1140):

- q30 = 1 / 2 / 8 / 10 → check **D8**: star/12-star/urchin/vortex show visible **red/blue fringing at ray tips** (offset copies, not two flat hues), still muted (no neon).
- q30 = the spinner's id → check **A20**: (a) the pinwheel core visibly rotates (compare two shots ~2 s apart — arm angles differ); (b) **two consecutive shots ~1.5 s apart show DIFFERENT fringe styles** (lash vs scribble vs spikes); (c) marbled interior present; core not white-blown. Also pin q30 = 9 to confirm plain jelly is UNCHANGED.
- Force accLine = 1 (D10): one strand sweeps across many seconds from a pinned apex; the fan body accumulates behind it; no 1.6 s pop-out.
- A17 scale tweak: with doc 01's radial-out field forced on, urchin/anemone hairs reach the frame edges.

**Live acceptance (one focused screenshot question per step, per dont-over-iterate):** after each step, self-render + ask the user one thing (e.g. "do the star rays now show red/blue fringing?" / "do the two spinner shots show different fringe styles?").

---

## 5. Risks & rollback

- **D8 (Step 1 + 2) — risk none.** Step 1 is data-only. Step 2's offset copies could read neon or fray the geometry — mitigated by keeping the base hue muted on q8 and small δ; revert = restore the single-copy hue lines. The systematic global-shader version is explicitly deferred to doc 01 to avoid a warp change in this doc.
- **A20 (Step 3) — risk none**, but it (a) adds a mode (index-safe append; respect the doc-02 mode-17 collision), and (b) could white-out the additive core (same trap as jelly) — mitigated by low MODE_ALPHA + a restyle-disable constant that degrades to plain jelly. Plain jelly (mode 9) is preserved, so there is no regression to a tuned motif.
- **D10 (Step 4) — risk (4), the sharp one.** Accessory changes were in the rejected wholesale rework; this MUST be a single, live-verified change with a mandatory revert gate, and must NOT be bundled with the pinwheel or any other accessory edit. Full moiré fidelity depends on doc 02's freeze field — until then it degrades gracefully to a soft decay curtain.
- **A17 — risk (4) via C2**, but owned by doc 01; this doc only contributes a slot-free scale tweak that is inert without doc 01 Step 4.

**One commit per step** (small commits = easy `git revert`, per CLAUDE.md), suggested messages:

1. `alchemy: reweight MOTIF_BAG — cut the ray-star look-alike share (D8 dedupe)`
2. `alchemy: true chromatic doubling on star modes (offset R/B copies, D8)`
3. `alchemy: add oblate spinner-disc motif — rotating core + restyling fringe (A20)`
4. `alchemy: accessory ray-curtain → pinned-apex lighthouse fan (D10; freeze via doc 02)`
   (A17 scale tweak lands with doc 01 Step 4, not as its own commit here.)

---

## 6. Acceptance criteria (observable, vs the references)

- [ ] **D8 dedupe:** over a multi-minute self-render, the 1/2/8/10 ray-star family no longer dominates — distinct motifs appear between stars; bag share for the family is ≤ ~5/25 (down from 6/25, 8/25 incl. fluff).
- [ ] **D8 doubling:** star-net and 12-star show genuine **red/blue chromatic fringing at ray tips** (spatially-offset copies), not two adjacent flat hues on alternating arms; the effect stays muted (no neon), matching p0 M2 / h2 2.7.
- [ ] **A20 core rotation:** the spinner's pinwheel core visibly rotates with a **2–4 s** period (arm angle differs across shots).
- [ ] **A20 fringe restyle:** two spinner shots **~1.5 s apart show different fringe styles** (lash / scribble / spikes); older fringe hue lingers under the new (two-generation tint, from decay).
- [ ] **A20 form:** oblate tilted disc, marbled interior, ~40 % frame width; core not blown to white; **plain jelly (mode 9) is visually unchanged**.
- [ ] **D10 lighthouse fan:** the fan has a **pinned apex** (on an orb / tether mid-span), ONE live edge strand sweeping ~10–20°/s, a body of accumulated (frozen, once doc 02 lands) copies, and a life of many seconds — not a 1.6 s 16-ray pop; matches h2 2.3 / p0 M10.
- [ ] **A17 (with doc 01 Step 4):** under the radial-out regime, urchin/anemone/spinner hairs stream outward and reach the **frame edges** (the "motif IS the background" class), resolving toward concentric moiré — matching h1 M6 / h0 M11.
- [ ] No new wave/shape slot consumed; no new q-var; Node checks + concat smoke test pass; Pastel remains muted.
