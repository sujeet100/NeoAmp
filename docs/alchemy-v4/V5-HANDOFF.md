# Alchemy V4 vs V5 — Handoff (2026-06-21)

## State at end of session
Two presets coexist for side-by-side comparison (both in the viz.js dropdown; boot = V4):

- **`presets/alchemy-v4.js` → `P["Alchemy V4: Random"]`** — reverted to commit **2dffe4d**, the
  pre-experiment baseline. Has all the incorporated motifs/scenes (Net Tunnel, void stage, wire
  star-net, prism split, crossed-X, corridor row, moiré stripes, vortex drain, pulsar eye, ribbon,
  orb glow) over the **original fbm "fusion" background**. This is the version *before* the
  watercolour/3D-motion rework.
- **`presets/alchemy-v5.js` → `P["Alchemy V5: Random"]`** — the **experimental** fork (was commit
  972d130). Same single-preset spine, but the background/colour was reworked toward the original
  WMP watercolour look. **The user is "not much happy" with V5 yet** — next session we rebuild it
  with the *same principles* but aiming for a better outcome.

To compare: load the extension, pick "Alchemy V4: Random" vs "Alchemy V5: Random" from the dropdown.

## What V5 tries (the principles to KEEP when rebuilding)
The arc (commits ac85d83 → 972d130) converged on the authentic MilkDrop mechanism, confirmed by the
user + Gemini's notes:

1. **The colour comes from the MOVING motif/orb/tether TRAILS, not a generated background.** The bg is a
   SIMPLE dim base (`baseBg = dusty(ground,0.88)*0.6`); the dominant colour is the blurred/decaying
   feedback of the moving motifs (`wetInk` from `sampler_blur1/2`, ×2.0). Because the motifs move, the
   colour moves — never the "static bleed" of a baked-in colourful bg.
2. **Colour-shifting trails** (the "pink orb, purple trail"): a **fast drawn-hue cycle** (alcHueClock
   base 0.09 / gain 0.15, ~11s/5-6s) + **long trails** (decay floor 0.95) → the orb reads its CURRENT
   colour while the high-decay trail holds the RECENT-PAST colours. NOT a feedback hue-rotation.
   This is GLOBAL — applies to orbs, central motif, and the tether (gate softened to 0.4 baseline so it
   trails continuously).
3. **Watercolour mixing / smudge**: curl-flow (divergence-free → swirls, never shears into "rain") in
   the dim base; an **FBM-distorted blur sample** (`wetInk`, blur1-weighted) that drags the trail into
   tendrils; a **WARP micro fluid-distortion** on `suv` so the trace bleeds like ink.
4. **Defined colour boundaries** (not foggy): tight `smoothstep` windows (~0.42–0.56) + an abs-value
   **ridge** (`smoothstep(0.055,0,abs(n1-0.5))`) = pigment-pooling contour; sharp motif kept crisp on top.
5. **Smooth, no jerks**: continuous hue drift (NO beat palette-snaps — they read jerky); pulse-driven
   effects ride a SMOOTHED envelope (`pulseSmooth` eases toward the beat-flash `f`, ~0.4s), fed to the
   shader via `t.q32 = bass + 1.4*pulseSmooth` (raw bass barely crosses 1.0 live, so the flash is the
   only clean beat signal; q33 does NOT reach shaders → q32 is the carrier).
6. **A bit NEON** (user revised the old muted-only rule): resaturate 1.5, dark-deepen 0.86, less-drab base.
7. **Faster scene changes** (user found it prolonged/boring): picker dwells look 6-11s / bg 9-17s /
   motif 4-8s.

## Why the user isn't happy yet (hypotheses to investigate)
- The orb smudge/trail "not much" earlier → may still be too weak; the trail colour-shift may read
  subtle or, conversely, the whole thing may be too busy/neon now.
- The "moving through space" depth: V5 leans on the **foreground moving against a calm bg** (Gemini's
  parallax-is-an-illusion point) rather than true bg parallax — may still feel flatter than the original.
- Decay 0.95 risks **milky-out** on loud passages (couldn't verify headless — no audio). Watch the centre.
- Possible over-stacking: curl + aurora + blur-smudge + ridge + neon + fast-hue may fight each other →
  consider rebuilding more minimally from the core principle (#1) and adding only what's needed.

## Hard-won gotchas / rules (do NOT relearn these)
- **Directional radial advection of the bg noise = harsh "RAIN" rays.** Use only curl (divergence-free)
  + isotropic scale-breath for smooth motion.
- **q33+ do NOT reach the shaders** (only q1..q32). q11 = the only "free" control var (used for the
  anemone/tunnel focus pupil). To get a beat into a shader, fold it into q32.
- **`sampler_blur1/2/3` ARE available** in this Butterchurn build (many repo presets use them).
- **Headless self-render has NO audio** → motifs are quiet, trails minimal. It verifies GLSL-compiles +
  base look + no milky-out, but the dynamic colour-bleed / beat effects MUST be judged from the user's
  screen recording.
- Verify: `npm test`; the concat node harness (CLAUDE.md); `node tools/selfrender.mjs "Alchemy V5: Random" "t1,t2,…"` → /tmp/alc-render/*.png.

## Key tunables (V5)
- Trail colour-shift: hue rate (alcHueClock 0.09/0.15) + decay floor (0.95).
- Colour-bleed strength / fog: `wetInk * 2.0`, base `dusty(ground,0.88)*0.6`.
- Definition: the colour-mix `smoothstep` windows + ridge depth (0.13).
- Neon: resaturate (1.5) + dark-deepen (0.86).
- Scene frequency: the three `makePicker` dwell ranges (~line 736-738).
- Ripple: orb beat-flare `0.3*f`; smudge `0.016+0.03*sw1`; WARP `suv` micro-distortion 0.0016.

See also: `docs/alchemy-v4/MISTAKES.md`, and the memory file `alchemy-v4-incorporation-and-gaps.md`
(full iteration log of how V5 was built).
