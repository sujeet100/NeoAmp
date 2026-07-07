# Alchemy gap docs — index, ID registry & roadmap

## Purpose & provenance

These 17 documents (`01-…` through `17-…`) are self-contained implementation plans for
closing the fidelity gaps between our shipped `presets/alchemy-v7.js` ("Alchemy (Pastel)"
default + "(Vivid)") and the original WMP Alchemy visualiser. Their provenance: an
**8-segment dual-video deep analysis** (the 480p colour-accurate capture + the 1080p
geometry/motion capture, plus the 19s colour clip), reconciled against a
**current-implementation catalog**, distilled into a **critique-revised 59-item gap matrix**
(July 2026). The analyst reports (`report_p0/p1/p2/p3`, `report_h0/h1/h2`, `r0`) and the
matrix (`gap-matrix-v2.md`) live in the session scratchpad; each doc here copies its own
measured evidence inline so a coder need not re-open them. Every doc follows the same shape:
§1 reference behaviour · §2 current state (verified file:line) · §3 stepwise plan (smallest
shippable slice first, one commit per step) · §4 self-render verification recipe · §5
risks/rollback · §6 acceptance criteria.

---

## ID REGISTRY (canonical)

New engine IDs collide across docs (each doc numbered in isolation). This table assigns **one
canonical id per new element**, sequenced in doc-number-of-implementation order.
**Docs' in-text ids yield to this registry — renumber on implementation.** (Physical `q30`/
`BG_BAG` values are `MODES.length`/appended at landing time; the registry's job is to
guarantee no two docs claim the same slot and to fix the ordering.)

### Motif modes — `q30` (existing 0–16 taken; `MODES` has 17 entries)

| id  | element                                    | owning doc | in-text id                 | status |
| --- | ------------------------------------------ | ---------- | -------------------------- | ------ |
| 17  | A10 scallop-marcher (mountain-row bg)      | 02         | "mode 17"                  | P2     |
| 18  | A1 spirograph lotus-flower rosette         | 08         | "mode 17" ⚠                | P1     |
| 19  | A2 mesh cocoon / net-ball / geodesic       | 09         | `COCOON_ID = MODES.length` | P1     |
| 20  | A7 compass-moth corrugated ray-fan         | 13         | "q30 id 17" ⚠              | P2     |
| 21  | A20 oblate spinner disc (`fJelly`-derived) | 14         | "next free / tail"         | P2     |
| 22  | A11 swimmer stalks (vertical coil)         | 15         | "`<newId>` / next free"    | P3     |

⚠ **Collision resolved:** motif mode 17 was claimed by docs 02, 08, 09 (as `MODES.length`)
and 13. Doc 14 already anticipated this ("must take the NEXT free id"). Canonical: doc 02
keeps 17; 08→18, 09→19, 13→20, 14→21, 15→22.

### Background regimes — `q29` / comp `m==` (existing 0–8 taken; catch-all `m>7.5` = caustic id 8, must be bounded to `m<8.5` before adding ≥9 — doc 12 Step 0)

| id  | element                                         | owning doc | in-text id | status              |
| --- | ----------------------------------------------- | ---------- | ---------- | ------------------- |
| 9   | B9a treadmill band (motif pinned, band scrolls) | 04         | `m==9` ⚠   | P2                  |
| 10  | D4/C6 static strata + injection front           | 12         | `m==9` ⚠   | P2 · **CONFIRM Q1** |
| 11  | C7 curtain wedges (comp half-plane)             | 12         | `m==10`    | P2                  |
| 12  | C11 floor-band / horizon strip                  | 12         | `m==11`    | P3                  |
| 13  | C3 wallpaper tiling (sample-coord fold)         | 12         | `m==12`    | P2                  |
| 14  | C4 chevron terrain comp ground (optional)       | 12         | `m==13`    | P2                  |

⚠ **Collision resolved:** regime 9 was claimed by both doc 04 (treadmill) and doc 12
(static-strata) — genuinely different regimes, both distinct from the user-protected sweep
`m==6`. Doc 04 (lower doc-number, lands first) keeps 9; doc 12's block shifts +1 to 10–14.
`BG_BAG`/`bgPick` length is derived, so appending is safe.

### Accessory ids — `accLine` on `waves[1]` (existing 0=none, 1=ray-curtain, 2=waveform-bundle, 4=pinwheel; **id 3 retired/free**)

| id  | element                             | owning doc | in-text id | status |
| --- | ----------------------------------- | ---------- | ---------- | ------ |
| 5   | A3 pinned-apex harp swath fan       | 02         | "type 5" ⚠ | P1     |
| 6   | A21 snake-worm / waveform-worm      | 15         | "id 5" ⚠   | P3     |
| 7   | A19 sail/kelp blade + smoke strands | 15         | "id 6" ⚠   | P3     |
| 8   | A15 sawtooth rod / serrated X       | 16         | "type 6" ⚠ | P3     |

⚠ **Collisions resolved:** accLine 5 claimed by doc 02 (harp, reserved) AND doc 15 (worm);
accLine 6 claimed by doc 15 (sail) AND doc 16 (sawtooth). Canonical by doc-number order:
02→5, 15 worm→6, 15 sail→7, 16 sawtooth→8. (Free id 3 is left unused per the docs' own
convention.)

### Other multiplexing / shared channels (not new ids, but contended — coordinate)

- **`waves[3]` outside the corridor — owner: doc 07 Step 5** (orb ring-accessory multiplexer:
  bullseye / column / rosette / eyelet ring; corridor row stays priority-1). _Clients:_ doc 13
  routes its rose-bullseye through this multiplexer (see Q); doc 06 pearl-chain (tether **kind
  7**, CONFIRM-gated) and doc 05 Step 6b splat-outline are optional transient flashes on the
  same idle branch, gated to `bgMode≠3`. Doc 15 explicitly defers `waves[3]` to doc 07. **All
  compatible** (corridor priority-1; everyone else non-corridor and time-shared) _provided doc
  07 lands the multiplexer first, or the client ships a temporary standalone doc 07 later
  subsumes._ Docs 07 & 13 are the "both plan waves[3]" pair the brief flagged — reconciled:
  07 owns, 13 depends.
- **`q13` — three claimants:** doc 10 (kaleido fold scale, `m==1`), doc 01 Step 7 (radial
  ripple, non-kaleido), doc 12 Step 6b (injection front). Only one may drive it per regime;
  the docs already gate on `q29`. If ≥2 land, verify the regime gates are mutually exclusive.
- **`q12`** freed by doc 01 Step 6 (shear amount) — was `bgMode==1?4:1`.

---

## Roadmap

Order rule: P1 risk-free quick wins first; then the P1 engine/feature tier in dependency
order (never two engine changes in one round); then P2, then P3; confirmation-gated steps
land only after their question is answered; **doc 17 is LAST, behind explicit sign-off.**

| ord | doc | title                                                    | matrix items             | pri | risk / gate                                             | depends on                                    |
| --- | --- | -------------------------------------------------------- | ------------------------ | --- | ------------------------------------------------------- | --------------------------------------------- |
| 1   | 08  | Spirograph petal-flower family                           | A1                       | P1  | none — no confirm                                       | —                                             |
| 2   | 09  | Mesh cocoon / net-ball                                   | A2                       | P1  | (1) eyes reuse orb pair — no confirm                    | —                                             |
| 3   | 14a | Ray-star reweight + chromatic doubling (Steps 1–2)       | D8                       | P2  | none (data + per-point colour)                          | —                                             |
| 4   | 11a | Filament crimp texture (Step 1)                          | D6                       | P1  | (6) hue-only — no confirm                               | —                                             |
| 5   | 03  | Typed beat-event scheduler & stamp grammar               | B2·B4·A12·A13·D7         | P1  | (4) Steps 1&5 **CONFIRM**; JS-only, safest engine       | — (prereq for 04/06/07)                       |
| 6   | 01  | Camera model & trail-displacement engine                 | C1·C2·C8                 | P1  | (4) HARD **CONFIRM**; one field per commit              | — (prereq for 02/05/13/14)                    |
| 7   | 02  | Stamp terrain / freeze & sink · harp swath · scallop     | B3·D11·A3·A10            | P1  | (4)(1)(6); Step 5 **CONFIRM**                           | 01 Steps 0+2                                  |
| 8   | 06  | Tether vocabulary & event lifecycle                      | A5·D1·B1                 | P1  | (1)(4)(6); 2 **CONFIRM**; Step 5 rail = prereq for 07   | 03 (folds into scheduler)                     |
| 9   | 05  | Colour clocks, stepped hue, deposit stains               | B7·D12·D13·C10·A14       | P1  | (6)(4)(1); Steps 5&7 **CONFIRM**                        | 01 (C10), 03 (events), 06 Step 2 (ink)        |
| 10  | 07  | Orb anatomy, balloons, staging, columns                  | A16·D2·D15·A4·D9·A18     | P1  | (1)(4); 3 **CONFIRM**                                   | 06 (rail for D15, B1 ink)                     |
| 11  | 04  | Director: ensemble density, rests, pairings, transitions | B5·B6·B9·B10·B11         | P1  | (1)(4)(6); 2 **CONFIRM**                                | 03/05 Step 0                                  |
| 12  | 10  | Kaleido lattice variants + region floods                 | C5·B8                    | P1  | (6) permissive; 2 **CONFIRM** (both have defaults)      | standalone (comp branch)                      |
| 13  | 11b | Pompom hue front + apex bloom + threading (Steps 2–5)    | D6·A8                    | P2  | (4)(5)(6); Step 5 **CONFIRM**                           | 05 (front machinery), 06 (rail for threading) |
| 14  | 12  | Structured grounds (wallpaper/chevron/bands/wedges/wash) | C3·C4·C6·C7·C11·D3·D4·D5 | P2  | (4) on C4 only; 2 **CONFIRM**                           | 01 (C4 warp deferred there)                   |
| 15  | 13  | Compass-moth radial scene                                | A7                       | P2  | (6); 2 **CONFIRM**                                      | 01 Step 4 (radial-out), 07 Step 5 (bullseye)  |
| 16  | 14b | Oblate spinner + lighthouse fans (Steps 3–4)             | A20·D10·A17              | P2  | D10 (4); A17 via C2                                     | 01/02 (warp prereqs for full fidelity)        |
| 17  | 16  | Zigzag ribbon scissor-X + sawtooth rod (Steps 1–4)       | A9·A15                   | P2  | (2)(4)(6); Step 5 gated                                 | 03 + 02 (stamp/freeze)                        |
| 18  | 15  | Travellers: comet · worm · sail/kelp · swimmer           | A6·A21·A19·A11           | P3  | A6 (1), A11 (2)-reflections-omitted; no confirm         | A11 → 07 Step 4 (orb head)                    |
| 19  | 07t | Bead-chain taper + mushroom (Steps 7–8 tail)             | D9·A18                   | P3  | (1)                                                     | 07 core, 03                                   |
| 20  | 16s | A9 floor reflections (Step 5)                            | A9                       | P3  | (2) **BLOCKED on reflection Q**                         | 16 core                                       |
| 21  | 17  | Perspective devices & valley dolly                       | C9·D14                   | P3  | (2)(3)(4)(5) — **whole doc gated on §4 sign-off; LAST** | —                                             |

---

## Consolidated questions for the user

Deduplicated across all docs; each tagged with its doc(s) and a recommendation where given.
Answer these before the corresponding step lands — an item that touches previously-rejected
territory ships **only after** its question is answered.

1. **[01]** OK to add per-scene trail-pan _variations_ (near-still in rests/terrain, down-drift
   under bars/bands, outward-stream under urchin/fluff, coil-around-eye under vortex) — keeping
   today's snap-pan as the default, **never moving the motif/orbs**, each individually
   revertible? _(This is the classic-with-its-pan, not the rejected world-follow rework.)_
2. **[02, Step 5, optional]** For the 19s clip's in-place terrain re-tint: fake it as a fresh
   overdraw sweep (new-hue ridge stamps re-tracing the pile ~1s) rather than recolouring the
   buffer — or skip it? _(4-of-5 reports say trails never retro-tint; recommend skip or the
   overdraw fake, never buffer recolour.)_
3. **[03, Steps 1&5]** OK to land two shipped-behaviour changes as two separate live-verified
   commits: (a) tether becomes a discrete event every 1–4s with rest silence (was every-beat
   flash); (b) motif swaps stop-the-old-emitter + bloom-the-new in <0.5s (replaces the global
   opacity dip)?
4. **[04, Q1 / B6]** OK for the central motif to fully **stamp-stop and leave the frame**
   (bg + orbs only) for 3–7s in a deep rest, and to **drain to a near-flat field** on a
   sustained lull (the "starvation outro")? _(v7 always keeps the motif on; character change
   the refs demand, unseen live.)_
5. **[04, Q2 / B10]** Rare **hard-wipe** transition (clears trail in ~2 frames, ~1s dark rest,
   snaps the new scene in) acceptable as a _rare_ event (~1 per 20–25s), live tether+orbs
   preserved across it?
6. **[05, Q1 / D13]** OK to add the **one-hot-accent** exemption — one small orb family (≤6.5%)
   - tether are the most-saturated thing on screen, everything else _more_ muted, rare ~0.6s
     vivid spikes — **emit-side only, comp profiles untouched**? _(This is the root D13 policy
     that Q13 and Q17 below are specific applications of.)_
7. **[05, Q2 / C10]** OK to slow decay + blur **only during the flat-wash bg** so deposits live
   3–6s as stains (today ~1s), as one wash-gated live-verified commit? _(Feedback-input change
   of the rejected-rework class — hence the gate.)_
8. **[06, Q1]** Build the **pearl-chain tether** (60–80 tiny beads on an S-curve) via `waves[3]`
   dots behind its own flag — or skip it? _(Bead rows were removed as "ugly, unfixable"
   `bad7755`; dots render ~2px fixed. Recommend skip unless you specifically want it. This is
   the only tether variant with any overlap to the removed feature.)_
9. **[06, Q2]** While a persistent rail-chord is up (15–30s), may the two orbs be temporarily
   **pinned to the rail's endpoints** (they stop snake-wobbling for the rail's life)? _(Small
   slice of D15; makes the rail read right. Say no and the rail spans their spawn positions
   without freezing them.)_
10. **[07, Q1 / A4]** Ship **ring-only** column stacks (hollow ring outlines via `waves[3]`,
    faithful to p1 O7/p3) — or sacrifice orb B's additive halo slot to get **filled glassy
    beads**? _(Recommend ring-only; filled beads are removed-feature territory.)_
11. **[07, Q2 / D15]** OK to replace the orbs' continuous S-curve **snake-wobble orbit** (shipped
    9b5ea11 with your approval) with **parked posts + slow slides**? _(The central motif keeps
    painting its watercolour trail — only the two orbs change. The wobble prevents the "anchor"
    reading the refs show.)_
12. **[07, Q3 / D2]** Re-land the measured orb **base radius 0.06 → 0.048** (reverted only as
    part of the rejected motion rework, never judged on its own)? _(Own one-line commit, judged
    live.)_
13. **[10, Q1 / C5]** During a kaleido region-flood **peak** (~1–1.5s), may **Pastel spike
    toward vivid** (effective `ksat`→~0.8) per the one-vivid-accent policy — or keep Pastel's
    kaleido uniformly muted and let only Vivid pop? _(Default if no answer: keep Pastel muted,
    ship the flood desaturated in Pastel / vivid in Vivid.)_
14. **[10, Q2 / B8]** Acceptable to **re-anchor the orbs into the fold window** (they become
    4-fold mirrored mini-orbs, matches p0 S4/p1 S10) and **gate the wide tether off during
    kaleido**, rather than chase the ref-exact "mirror the field but exempt one full-frame
    line" (impossible with one uniform comp fold)? _(Default if no answer: yes.)_
15. **[11, Step 5]** The threaded pompom rides a wire: should it **(a)** ride the transient
    beat-gated tether (appears only when the tether does), or **(b)** get a dedicated low-key
    persistent wire (doc 06's rail chord) so it can stand alone? _(Recommend **(b)**, reusing
    doc 06's rail.)_
16. **[12, Q1 / D4 — the load-bearing one]** Commit `302349c` raised the bands' drift to a
    visible sweep at your request; the refs show mostly **static strata that recolour
    band-by-band** with a sweep only as an occasional injection event. **(a)** Keep today's
    sweep on `q29=6` and add static/injection as a **new regime** _(recommended, reverts
    nothing)_; **(b)** replace the sweep (undoes `302349c`); **(c)** keep both and let the bag
    pick? _(Plan assumes (a).)_
17. **[12, Q2 / C7·D5]** Confirm you're OK that the extra flat-washes + curtain wedges read
    **darker/flatter** than the wavy-fluid ground they displace (that is the measured
    reference)? _(No confirm needed if you trust the measurement.)_
18. **[13, Q1 / A7]** May we ship **one brief (~1–2s) saturated-crimson** moth-fan accent that
    intentionally breaks the muted rule (per Q6's vivid-accent policy)? _(The reference does
    this — faithful — but it is the one place we push saturation.)_
19. **[13, Q2 / O10]** Route the rose-bullseye ring pair through **doc 07 Step 5's `waves[3]`
    multiplexer** (cleaner, reuses `alcOrbTarget`, **depends on doc 07 landing first**) — or
    ship a standalone minimal orb-recolour + one `alcOrbTarget` ring so doc 13 lands
    independently?
20. **[16 (A9) + 17 (Q2 / C9)]** Floor reflections (rejected-3D-water neighbour, risk 2):
    **skip entirely [recommended default]**, or build a subtle dim vertically-mirrored ghost in
    the lower ~15–18% band (soft mirror, no ripple/specular plane)? _(Covers doc 16's scissor
    ribbons and doc 17's broader C9 stalks/bead-rows; one policy answer settles both.)_
21. **[17, Q1 / D14]** Remove the valley forward **dolly** (L1131) and keep the valley motif
    static, like the refs? _(Recommend **YES, remove** — every terrain scene is camera-still;
    the geometry reads as a valley without a camera move.)_ **Q1b:** keep the harmless decay
    bump (0.96, L1132)? _(Recommend keep.)_
22. **[17, Q3 / C9]** Extend receding-row foreshortening + vanishing-point string-fans to more
    scenes — noting this is the SAME device already shipped/accepted in the corridor dot-row,
    NOT the rejected perspective floor grid? _(Recommend **YES** — precedented, wave-space
    foreshorten, bounded to fans/rows.)_
23. **[17, Q4 / C9]** Add a small soft **contact-shadow ellipse** under oblate-tilted motifs
    (comp-only, hangs on the existing y-squash)? _(Recommend **YES, low priority.**)_

_Latent (raise only if it comes up):_ **[15]** A6's comet tail is a fading same-hue feedback
ghost, not a drawn dotted bead-chain — acceptable, or do you want the dotted tail back (it was
removed as ugly)? _(Proceeding with feedback-ghost tails per the standing rule; no answer
needed unless a literal dotted tail is later wanted.)_

**Total: 23 consolidated questions (+1 latent).**

---

## Working rules

- **One commit per step.** Every step in every doc is a single revertible commit (`git
revert`), with its own gate/rollback noted in the doc's §5.
- **Selfrender-verify before asking for screenshots.** Use `node tools/selfrender.mjs
"Alchemy (Pastel)" "<seconds>"` and the scratchpad `pinrender.mjs`, pinning inputs via
  `window.__ALC_FORCE` (q30 motif mode, q29 bg regime, `accLine`, and doc-specific underscore
  closure keys). Pins land _after_ `frame()` computes, so pin the INPUTS the point-fns/shaders
  read. Always take shot **pairs ≥3–4s apart** — the checks are about what the trail does
  _between_ shots. Confirm no `[WMP-viz shader]` GLSL errors.
- **Never two engine changes in one round.** Warp/motion/accessory changes are exactly the
  class the user rejected wholesale (`9ba675e`). Ship ONE field/behaviour at a time, let the
  user see it live, and if a step reads wrong **revert that commit and stop** — do not stack
  speculative follow-ups (memory `dont-over-iterate-speculatively`).
- **Rejected-territory items are question-gated.** Any item touching previously-rejected
  territory (world-follow motion, faked-3D water/reflections, perspective floor grid, bead-row
  dots, saturation lifts, leaving-frame rests) ships **only after** its consolidated question
  above is answered — not on assumption.
- **Colours stay muted (Pastel).** Hue-only changes inside the muted envelope; saturation is
  touched only in the confirm-gated D13 accent step, and only as an _ordering_ (one hot
  element), never a global lift. Never feed white to the Reinhard tone-map; never raise the
  trail composite gain.
- **Respect the registry above.** When a step assigns a new motif mode / bg regime / accessory
  id, use the canonical id from the ID REGISTRY (renumbering the doc's in-text id), so two docs
  never collide on a slot.
