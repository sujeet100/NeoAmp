# Alchemy v2 — Resume / handoff note

Snapshot for picking up Alchemy v2 in a fresh session. Read this + `README.md` +
`v2-implementation-plan.md`. Auto-memory `MEMORY.md` loads the key gotchas.

## The big shift this session: the COMPOSABLE KIT

Alchemy is **vocabulary × camera × feedback**, recomposed per scene (the user's framing,
matches `README.md` foundations). We built a reusable **Alchemy kit** in `wmp-presets.js`
(just before `var P = {}`). A scene is now ~6 lines: pick a camera + motifs + colors.

**Kit pieces (all in `wmp-presets.js`):**
- `alcCamera(kind)` — the camera = the FEEDBACK transform. `top` (shrink to center → face-on
  mandala), `side` (corridor; currently feedback recedes to an off-center down-right VP
  cx 0.86/cy 0.62, decay 0.42, zoom 0.95), `orbit`.
- `alcTriangle` / `alcStarWaves(tris)` — waveform triangle/star motif (1=triangle, 2=hexagram).
- `alcRay` / `alcRayWaves(n, hueOff, lenScale)` — n waveform lines through center, rotating (q9).
- `alcMeshRings(nRings, hueOff)` — EXPLICIT wavy depth-ring net projected to a VP (built, but
  Net Corridor currently uses the feedback star net, not this).
- `alcOrb` / `alcOrbWhite/Same/Contrast`, `alcOrbRow` — WAVE-based orbs. **Mostly superseded**
  by shapes (see below); kept for reference.
- **`makeOrbTrailShapes(count)`** — the GOOD orb trail: custom **SHAPES** (real filled circles).
  Filled hue-cycling HEAD + hollow shrinking RINGS on a WAVY path receding to a VP. This is the
  current orb in Net Corridor. **Custom shapes RENDER in this build** (confirmed this session —
  a big unblock; the orb fight was because custom *waves* can't draw a clean filled circle).
- `alcSetColor`, `sm01`, `ALC_COMP` (additive+bloom, tone-mapped; bloom now 0.20), `alcNetFrame`
  (shared per-frame driver: sets q2/q3 head, q5 star-radius, q6 jaggedness, q7 orb-radius,
  q8 hue, q9 spin, q14 orb-flow, q19 time; zoom on beat).

## Scenes (in `viz.js` FAVORITES dropdown), all committed
- **Wireframe Net** — `top` camera, spinning 2-triangle star + orb core (face-on mandala).
- **Net Corridor** — `side` camera; feedback star net receding down-right + **8 shape-orbs**
  (filled head + hollow wavy ring trail, hue-cycling). The most-worked scene; "good progress,
  refine later" per the user.
- **Waveform Sheet** — single waveform line (alcRayWaves n=1) + shape-orb, side camera.
- **Ray Burst** — 5 rotating waveform rays + orb core, top camera.

## Pending (kit perspective)
- **Orbs**: refine — distinct circles still bunch a bit toward the VP; head/trail balance; the
  feedback (decay 0.42) gives a slight glow that can still tube if pushed. Consider an explicit
  comet (Gemini's delayed-time idea) instead of relying on feedback at all.
- **Net**: decide feedback-star vs explicit `alcMeshRings`. The corridor net + orbs should share
  one VP (they do now via feedback). Explicit net (alcMeshRings) would be crisper/controllable
  but the user reverted it once (looked like face-on concentric circles — needs the off-center
  down-right VP to read as a corridor, not a target).
- **Motifs still to add** (from `README.md` Part II + Gemini's 5-primitive list):
  - Radial **Spindle/Anemone** (lines from a point, twist→vortex) — harvest the existing
    `Anemone Pulsar` preset into a kit motif. Highest reuse (≈6 scenes).
  - **N-gon generalization** (sides + inner/outer radius → triangle/diamond/octagon/star) — Gemini's idea.
  - **Mandala** (nested polygons), **Ribbon** (3D waving plane), **dotted fine trail** (the small
    blue dots under the orbs in the reference).
  - **Backgrounds** (comp/warp shaders): solid-color snap, fluid marble, moiré stripes,
    oscilloscope band, kaleidoscope mirror.
- **Colors**: orb fill hue-cycles; net is teal+amber. Keep the muted rule for these families.
- Optional `Journey` sequencer to crossfade scenes.

## Hard-won learnings THIS session (don't relearn)
1. **Feedback is for glow/motion-blur, NOT structure** (Gemini's rule, proven repeatedly). The
   corridor/net never reached the VP and the orbs smeared because we leaned on feedback decay
   for structure. Draw structure EXPLICITLY; use feedback only for a short glow.
2. **Custom waves can't draw a clean filled circle** — spiral fill = a tube of concentric rings;
   usedots = a sparse halftone grid; line-mode multi-orb = a connecting beam. Dead ends.
3. **Custom SHAPES work in this build** and are the right primitive for orbs (filled disc +
   gradient core via r2/g2/b2 + border ring). `makeShapes()` creates 4; we set `preset.shapes`
   to an arbitrary-length array and 8–10 render fine.
4. **Additive + bright filled discs accumulate to WHITE** (the "white sausage"). Orbs must be
   **non-additive** (additive:0) so color just paints and can't blow out.
5. **zoom>1 feedback runs away to a white-out.** Keep zoom ≤1 unless decay is very low.
6. The reference orb trail (`~/Downloads/YouTube 1080p 60fps Download.mp4`, and screenshots): a
   FILLED hue-cycling head + HOLLOW shrinking rings on a slightly WAVY path; later circles
   smaller; a separate fine dotted trail underneath.
7. **One change at a time; prove ONE orb before scaling.** Over-batching (rings+orbs at once,
   60 instances) repeatedly cost rounds. The user pushed back hard on overconfidence — heed it.
8. The corridor camera-angle direction was the single biggest time-sink — the user wants a
   **single-sided corridor receding to one VP** (not a symmetric spindle). `sx>1` about center
   is ALWAYS symmetric; use off-center zoom feedback (or explicit projection) instead.

## Conventions
- `viz.js` `DEFAULT_PRESET` — set to the actively-iterated scene.
- Validate before reload: `node --check wmp-presets.js && node --check viz.js`, then run
  frame_eqs + sweep wave point_eqs / shape frame_eqs for NaN (see prior commands in history).
- Custom-wave cap ≈6 enabled. Shapes: 8–10 fine.
- We can't see the live render — iterate from the user's screenshots.

## Where the user is
Building the composable kit; Net Corridor is the lead scene. "Good progress, refine later."
Next session: refine orbs (maybe fully-explicit comet), decide net approach, then start adding
the remaining motifs (Anemone first).
