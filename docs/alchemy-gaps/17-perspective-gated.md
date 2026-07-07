# Perspective devices & valley dolly (confirmation-gated)

**Matrix items:** C9, D14 · **Priority:** P3 · **Risk flags:** (2)(3)(4)(5) · **Confirmation needed:** YES — this whole doc is gated

This is a **decision dossier, not an implementation plan.** Both items sit on territory the
user has explicitly rejected before. Nothing here gets built until the questions in §4 are
answered. The sketch in §5 is deliberately rough and applies **only to whatever is approved**.

Risk-flag legend (from `gap-matrix-v2.md` header): **(2)** faked-3D reflective water REJECTED ·
**(3)** perspective floor grid REJECTED (v6 era) · **(4)** wholesale motion/accessory rework
REJECTED (9ba675e) — camera/motion changes ONE at a time, user-verified · **(5)** NO invented
elements.

---

## 1. Reference behaviour (what the original does)

### (a) Perspective devices the refs GENUINELY use — item by item, with timestamps

All of these occur while the **camera is STILL** (the depth is drawn, not flown through — see C1
reconciliation and §2 below):

1. **Vanishing-point string fans** — h0 M2 (5.2–8, camera STILL). A fan of 20+ cyan/red 1–2px
   strings converging to an **off-frame vanishing point at left (y≈300)**, fanning right/down
   toward a bead row — "reads as strings receding in 3D." Straight lines, clock/geometry-driven;
   the fan **re-aims** every ~0.5–1s (a stamped event), old fan fades in ~1s.
2. **Bead colonnade (receding row)** — h0 M3 (5.2–17). A row of ~14+ beads at y≈500,
   **perspective-scaled small-left (~8px) → large-right (~45px)**, spacing 40→110px. Static
   positions — the row does NOT march; individual beads pulse.
3. **Oblate y-squash + soft contact shadow** — h1 M4 (petal flower, 85.0) + wreath (90): the motif
   "tilts oblate (y-squash to ~0.5) **like lying on a receding plane**; casts a soft contact
   shadow." (h1 §Camera item 4.)
4. **Receding perspective rows at the bars exit** — h1 S8 (115.5–116.5, "115.8"): the vertical-bar
   field dissolves via growing wedges, "leaving **receding thin horizontal row-lines (perspective
   floor) that fade**." (h1 B8 + §Camera item 5.) A brief transition device, not a persistent floor.
5. **Floor reflections (dim, blurred, mirrored-below)** — r0 §2.3 (swimmer stalks, 8.2–12.6): "Floor
   shows **blurred mirrored reflection smears beneath each stalk**" (the 19s clip); h1 M8 zigzag
   ribbon (121.8+): "Dim floor reflections below"; h1 S8/S9 dumbbell (121.8, still_126.5):
   "reflections dim below"; h0 M3: "dim mirrored bead copies just below the row." Always **dim +
   blurred**, never a rippling water surface.

### (b) Devices we previously INVENTED or exaggerated (NOT in the refs)

- **Forward dolly into a vanishing point** — see D14. No report observed a dolly/zoom-into-VP
  anywhere in either video. This is a v7 invention (§2, §3).
- (No other C9 device is currently over-built; the gap is the opposite — the refs' 3D-illusion kit
  is mostly _absent_ from v7.)

### The corridor precedent — an accepted perspective device already shipped

**Receding-row foreshortening already ships and the user has accepted it.** The `waves[3]` corridor
ring-dot row (`alchemy-v7.js` L1288–1331) draws 10 dots foreshortened via `pow(idx,1.5)` spacing
from near-left (0.16,0.52) toward a VP at (0.82,0.49), with alpha fading into depth — i.e. exactly
h0 M3's bead colonnade minus the reflection. The corridor scene-coupling (L1101–1124) stages the two
orbs as near-left + far-right anchors and pans right so the row marches to a right VP. This is a
**vanishing-point / receding-row device that is live and un-objected-to today** — the precedent that
distinguishes C9's string-fans/rows (safe class) from the rejected perspective _floor grid_ (§3).

---

## 2. Current implementation state (verified line refs)

- **Valley forward dolly — the D14 subject** (`alchemy-v7.js` L1126–1134). When motif 12 (green
  valley) is active, `valleyAmt` eases in and applies: `t.q15 += (0.012 − t.q15)·va` — q15>0
  **magnifies the trail buffer = a forward dolly into the VP** (L1131); `t.q1 += (0.96 − t.q1)·0.5·va`
  — blends decay up so the receding sheet-lines leave a depth trail (L1132); `t.q16 *= 1 − va` —
  kills roll for "a clean dive down the valley" (L1133). The valley MOTIF itself (`fValley`,
  L687–716) is a pair of 8-line sheets converging to a central VP plus a vertical live-waveform
  spine — that geometry is _faithful_; only the camera dolly is in question.
- **Analysis verdict on the dolly (D14):** UNSUPPORTED. Evidence — r0 (mountain valley 14.8–18.4:
  camera STILL, `camtest_terrain` shows peaks do NOT translate, they diffuse in place); p1 S12
  (flame apex x=48%→47% over 2.2s = no motion, camera static); h2 (finale S14 valley-X + star
  totem, 182–186.4: camera static, `burst_184` tiles nearly identical, near-static ≥4.5s to video
  end; h2 §3.1 "No global zoom/rot/snap-pan observed anywhere in 124–186"). **No report saw a
  dolly-into-VP anywhere.** The code comment itself (L1127) hedges "not the rejected always-on
  plunge" — but the analysis says even the brief scene-local dolly is unsupported.
  - _One open caveat (honesty):_ h2 §3.1 adds an aside "(Contrast with earlier segments' snap-pans;
    the finale is anchored.)" — but the segment owners h0/h1 report NO snap-pans in their segments,
    and none of them saw a valley dolly. The aside does not rescue the dolly.
- **Corridor perspective (the accepted precedent, not in question):** L1101–1124 + waves[3]
  L1288–1331, described in §1. This is what makes the C9 receding-row question low-risk.
- **Oblate y-squash already exists:** modes 0/2 get a PULSAR y-squash ×(1−0.34·q11) under focus
  (catalog §1) — so device (3) above is partly present; only the contact shadow is missing.

---

## 3. History: what was rejected and why (the user's own calls)

1. **Faked-3D reflective water — REJECTED (risk 2).** Memory `alchemy-v7-gap-analysis`: the 2:08
   "mirrored rainbow waveform-mountains + reflection… the survey says the original genuinely has it,
   but the user REJECTED faked-3D-water before (alchemy-v6-rebuild V6-HANDOFF §2); CONFIRM before
   building." → This is why C9's **floor-reflection** sub-item is gated (Q2).
2. **Perspective floor grid — REJECTED (risk 3), v6 era.** Memory `alchemy-480p-gap-analysis`: "480p
   has a PERSPECTIVE FLOOR plane / tunnel-floor woven-lattice + tilt-down camera (137–143s) — the
   user REJECTED 'perspective floor grid' in the V6 era. Confirm before building." → This is why C9's
   receding-row / string-fan question (Q3) must explicitly distinguish itself from a floor grid.
3. **Wholesale motion rework incl. always-on plunge / world-follow — REJECTED (risk 4), commit
   9ba675e.** Memory `alchemy-full-survey-2026-07`: after live A/B "the classic one looks better,
   you have screwed it up"; the rework was reverted into `alchemy-motion.js`, salvage **one at a
   time with the user's eyes**. The C1 reconciliation adds the reason: **moving the emitters / flying
   the camera was never the original's behaviour** (it streams only the trail while emitters stay
   pinned) — which is precisely the class the valley dolly (a buffer magnify = camera move) belongs
   to. Faithfulness rule `alc-faithfulness-no-invented-elements`: build only what the original does.

---

## 4. Questions for the user

**Q1 — Valley dolly (D14). Remove the forward dolly (L1131) and keep the valley motif static, like
the refs?** _Recommended: **YES (remove).**_ Every valley/terrain/flame scene in both videos is
camera-STILL (r0 `camtest_terrain`, p1 S12 48%→47%, h2 S14); no report ever saw a dolly. The
converging-sheet + waveform-spine _geometry_ already reads as a valley without any camera move.

- **If yes:** delete the q15 magnify (L1131) and the roll-kill (L1133); valley becomes a static
  motif over a still buffer. Mark D14 **resolved / closed** in the matrix.
- **If no:** keep the dolly; upgrade the matrix note from "approved-by-silence" to "explicitly
  confirmed-keep."
- **Q1b (sub-question, only if Q1=yes):** the decay bump to 0.96 (L1132) is _not_ a camera move — it
  just lengthens the sheet-line trails. Keep it (harmless depth trail) or drop it too? _Recommended:
  keep._

**Q2 — Floor reflections (C9, risk 2). May we add a SUBTLE floor reflection — a dim, blurred,
vertically-mirrored copy of the lower motif in a bottom band, with NO rippling water surface — where
the refs show it (r0 §2.3 stalks 8.2–12.6; h1 M8 121.8+; h0 M3 bead row)?** _Recommended: **NO
(leave closed) unless you want it.**_ It is the nearest neighbour of the rejected faked-3D water;
even a static mirror can read as "water," and the payoff is small.

- **If yes:** we build a comp-shader mirror of the bottom ~15–18% band only, dimmed ×~0.25 + extra
  blur, no ripple/normal-map (explicitly distinct from the rejected water).
- **If no:** mark the C9 reflection sub-items (and the reflection notes on A9/A11) **closed**.

**Q3 — Receding rows / vanishing-point string fans (C9, risk 3). May we extend receding-row
foreshortening + VP string-fans to more scenes (h0 M2 string fan 5.2–8; h0 M3 colonnade; h1 115.8
receding rows) — noting this is the SAME device already shipped and accepted in the corridor dot-row
(waves[3], L1288–1331) and corridor staging, NOT the rejected perspective FLOOR GRID?**
_Recommended: **YES.**_ It is precedented, accepted, and geometrically a wave-space foreshorten, not
a tilted receding lattice/plane.

- **If yes:** route via the existing `pow()`-spacing foreshorten pattern on an idle wave slot,
  re-aimed on beats — bounded to fans/rows, never a full floor lattice.
- **If no:** mark C9 perspective-device build **closed**; corridor keeps its existing foreshorten.

**Q4 — Contact shadow (C9 "safe subset"). May we add a small, soft dark ellipse under oblate-tilted
motifs (h1 M4 at 85, wreath at 90 — "casts a soft contact shadow")?** _Recommended: **YES, but low
priority.**_ It is small, cheap (comp-only), and explicitly listed in the matrix's C9 "safe subset
(verify with user)"; oblate y-squash already exists to hang it on.

- **If yes:** a dim dark ellipse in comp below the motif centre, offset down by the squash amount.
- **If no:** mark closed.

---

## 5. Sketch (only for whatever §4 approves — rough, NOT a step-by-step plan)

- **Q1 remove valley dolly:** strip L1131 (q15 magnify) + L1133 (roll-kill); optionally L1132 per
  Q1b. No new code; valley relies on its existing `fValley` geometry over a still buffer. No slot
  cost.
- **Q2 reflection (if approved):** comp-shader only — read the trail buffer at the y-mirrored coord
  inside a bottom floor band, blend dim + blurred, no ripple. Coordinate math folds into the comp
  the same way the ground regimes do; see **doc 01 (trail-displacement / coord math)** for the
  mirror-coord derivation. Zero wave/shape slot cost.
- **Q3 receding rows / string fans (if approved):** generalise the shipped `waves[3]` `pow()`-spacing
  foreshorten into a reusable point-fn on an idle wave slot; re-aim on beat events per **doc 02
  (stamp cadence)**, displacement per **doc 01**. Explicitly bounded to fans/rows — never a floor
  lattice (that stays rejected, risk 3).
- **Q4 contact shadow (if approved):** one dim dark ellipse drawn in comp under the motif, offset by
  the existing PULSAR squash. Comp-only, zero slot cost.

## 6. Acceptance criteria — what "resolved" means for this doc

- **Every question in §4 has an explicit yes/no** from the user (no silence-approval).
- **Declined items are marked CLOSED in `gap-matrix-v2.md`** — specifically: C9 reflections closed
  if Q2=no; C9 perspective rows closed if Q3=no; C9 contact shadow closed if Q4=no.
- **D14 is settled either way:** dolly deleted + valley static (Q1=yes) → D14 closed; or dolly kept
  → matrix note changed from "user-approved-by-silence" to "explicitly confirmed."
- **Approved items graduate:** each yes spawns its own single-change implementation doc/commit,
  built and live-verified ONE at a time (risk 4), never bundled.
