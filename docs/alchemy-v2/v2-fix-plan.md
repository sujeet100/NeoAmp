# Alchemy v2: Random — one-shot fix plan (2026-06-17)

Lives in `presets/alchemy.js` (post-split). Goal: fix the "shabby vs v1" regression in ONE pass,
then user tests. Diagnosis (frame-by-frame compare of original WMP video vs v1 vs v2 captures +
code read) and reconciliation with Gemini's "Alchemy Butterchurn Guidelines" are in memory
(`alchemy-v2-regression-rootcause`). Root cause: v2 kept the kit but DROPPED v1's orchestration
spine. This plan restores the spine, keeps the kit + v2's stochastic non-looping selection, and
folds in Gemini's valid points.

## The 6 fixes
1. **ONE shared stochastic MACRO-LOOK clock.** A single `lookPick` crossfades **background +
   camera + exposure together** (each LOOK bundles `{bg field, camera tuple, darkness}`). Long
   fade (~4.5s) ⇒ morph, not the hard-cut slideshow. Random next-look ⇒ non-looping. Motif /
   orb-style / palette keep their OWN slower clocks (the "random" feel) layered on top.
2. **Structured, frame-filling backgrounds.** `bgField` gains v1's PROVEN structured GLSL
   (`bgTunnel/bgComb/bgStrata/bgHex`) alongside the kit fields (fluid/marble/wash/moiré/
   solidsnap/radial-bloom) → 11 fields. Even when the central motif is thin/absent the frame is
   never empty (fixes the t27–31 / t46–55 barren stretches).
3. **Exposure + muted colour.** Per-look darkness `q19` (crossfaded), Reinhard **k=0.88** (was
   0.7 → white cores), stronger desaturation (`pastel` s=0.66; the spectral radial-burst `fBur`
   gets an extra `desat 0.5` — it was the neon source). Keeps v1's **dual palette**: soft-but-
   coloured geometry over MUTED grounds, tone-mapped. No neon, no blow-out (Alchemy hard rule).
4. **The WMP signature, reliable.** Two orbs **ROAM** on wide sine paths (span the frame) so the
   tether stretches corner-to-corner; both usually present ⇒ the two-orbs+lightning fires often
   (not v2's rare triple-gate). Tether = `alcTether` driven by the **live waveform** (`value1`,
   NOT rand) with bright **beads** strung along it. Orbs cycle the kit's factories (`alcOrbTarget`
   n=1/2/3 + `alcOrbiterNode` glow-disc) via `q16`; small node scale so orbiterNode reads cleanly.
5. **Gemini spatial coupling.** All four waves share ONE gentle global rotation (`q13`, bounded
   sway) about centre ⇒ the whole foreground moves WITH the camera (same pivot/angle keeps orbs
   joined to the tether). Not endless spin.
6. **Camera life.** Per-look camera tuples engage kaleido fold (`q31`) and a per-look depth/plunge
   (zoom>1) — depth is PER-LOOK, never a global constant forward-flight.

## Rejected from Gemini (would re-introduce known bugs)
- `rand()`-jittered lightning → use live `value1/value2` (CLAUDE.md rule; rand flickers as static).
- Global constant `zoom = 1+0.05*bass` → depth is a per-look camera mode, not permanent.
- "High-saturation HSL" → Alchemy stays MUTED (high-sat is exactly v2's neon late-half). Gemini's
  "avoid white via alpha decay / non-additive" IS kept (orbs+tether non-additive; comp glow halos).

## Wave/shape budget (4+4 hard limit)
4 waves: [0] central kit motif · [1] orb A · [2] orb B · [3] tether+beads. Shapes unused this pass;
filled-orb-via-shapes deferred (the wave-vs-shape aspect mismatch documented on `alcOrbiterNode`
means a shape blob won't sit under a wave ring — revisit separately).

## q-var map (frame → shaders/waves)
q1 motif mode · q2/q3 motif centre (0.5) · q4 tether gate · q5 motif scale · q6 ray disp ·
q7/q25 orb radius · q8 hue phase (bg hueRot + palettes + solidsnap sel) · q9 spin · q10 burst ·
q11 energy · q12 orb B presence · **q13 fg global rotation (NEW)** · q14 mesh flow · q15 motif vis ·
q16 orb style · q17 orb A presence · q18/q20/q27 bg crossfade A/B/mix · **q19 per-look darkness (NEW)** ·
q21..q24 orb positions (roaming) · q26 tether amp · q28..q32 camera [zoom,rot,twist,kaleido,drift].

## Validate (no live render for us — GLSL only checks at runtime)
`node --check` all preset files + the concat-in-one-scope runtime check (builds all 67, runs every
frame_eqs); additionally run the v2 wave `point_eqs` on a sample point. GLSL reserved-name rule:
shader locals use `pa`/`pr` (never `ang`/`rad`/`ret`/`uv`/`q*`).
