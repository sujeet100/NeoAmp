# Alchemy V6 — HANDOFF (2026-06-21, end of session)

**The user is NOT happy with V6 and asked to stop and hand off to a fresh session.** This doc is the
antidote to repeating the ~15-round thrash this session went through. **Read this BEFORE touching
`presets/alchemy-v6.js`.** Read it WITH `MISTAKES.md` (§1 = the thrash meta-mistake) and `V6-PLAN.md`
(the original 7-agent analysis that started V6).

> A definitive reverse-engineering of the actual `orig.mp4` reference + a fresh rebuild plan is
> appended at the bottom under **"DEFINITIVE ORIG SPEC + REBUILD PLAN"** (from a handoff workflow).
> That section is the authoritative starting point; the retrospective below is why the obvious paths
> are dead-ends.

---

## 0. THE HONEST META-LESSON (most important)

This session **thrashed badly**: ~15 rounds of reactive tweaks driven by (a) chasing each user
screenshot one-at-a-time, and (b) following Gemini advice that **flip-flopped and was sometimes flat
wrong** (it sent me down the faked-3D-water rabbit hole, and separately told me "stable canvas, zoom=1"
then later "continuous zoom+rotation tunnel"). I also **invented geometry** (a parametric rose) instead
of using kit factories — a CLAUDE.md violation — and the user hated it ("WTF is this flower").

**Do NOT continue blind screenshot-chasing.** Before writing code, the next session should:
1. Get the user to point at ONE specific element of the original and confirm the target (motif shape?
   bg motion? depth?), then nail THAT one thing against the reference before touching anything else.
2. Treat Gemini's suggestions as unverified hypotheses — verify against `orig.mp4` frames, not vibes.
3. Use the REAL kit factories for geometry (don't invent motifs).
4. Self-render every change (`tools/selfrender.mjs`) — but remember headless has only a SYNTHETIC beat,
   so the dynamic feel can only be judged from the user's screen recording.

---

## 1. THE REFERENCE (use THIS file)

The user's authoritative reference is **`orig.mp4`** (640×480, 19.6s) — preserved as
**`~/Downloads/Alchemy-orig-reference-19s.mp4`** (the Desktop copy is volatile). This differs in
character from the earlier `Alchemy Random Media Player 480p.mp4` / `YouTube 1080p 60fps Download.mp4`
that `V6-PLAN.md` was based on — analyse **orig.mp4** specifically.

Frame study from this session (re-extract with the CLAUDE.md ffmpeg recipe; crop `606:478:16:0`):
clean frames showed a **dense gold WIREFRAME SPHERE/ball** on a teal field; a **dense cyan NET/web**
with diagonal receding dashed lines; two **orbs connected by lines** with perspective; **mirrored
waveform "mountains"** with a wedge. The bg shifted teal→olive→pink over ~6s (FAST colour change) and
had **horizontal bands**, **dot grids**, and **vertical bands** at different moments.

---

## 2. ★ REJECTED APPROACHES — do NOT propose any of these again

Each cost rounds; the user explicitly rejected all of them:

1. **Faked 3D environment** — water/reflection, a horizon mirror line, a perspective floor grid. The
   original has NONE of this; it read as a "synthwave-sunset mirror splitting the screen." **HARD NO.**
   (Committed in `d666861`, reverted in `7d1d15f`.)
2. **Spiky / disconnected RADIAL BURSTS** as the central motif (fountain/spindle radial spokes).
3. **A sparse single-stroke parametric ROSE / Lissajous flower** — "WTF is this flower"; too sparse +
   too big, and feedback rotation smeared it into giant ghost-loops. A single thin curve can't be the
   original's DENSE flower.
4. **FLAT multi-colour wedge "diamond" kaleidoscope** (hard colour blocks). The user PREFERS a **MIRROR
   kaleidoscope** — the motif/field reflected into a symmetric mandala. (Fixed toward this in `bce9580`.)
5. **RAINBOW / full-spectrum colour**, and **muddy over-blended** colour. Original is ANALOGOUS/harmonious.
6. **STATIC or SLOW backgrounds + slow colour change.** Original bg MOVES and changes colour FAST
   (~full family in 6s). (Sped up in `bce9580`.)
7. **A constant forward PLUNGE/zoom** — "always the same direction", tunnelled, and piled additive
   bursts into a white-out core.

**The #1 UNSOLVED problem:** the user repeatedly says it "feels FLAT / no 3D" and **we never cracked
what gives the original its depth.** Faked-3D and constant-plunge are both rejected. The depth answer
is in the appended spec — start there.

---

## 3. CURRENT CODE STATE

`presets/alchemy-v6.js` → `P["Alchemy V6: Random"]` (single seamless preset, boots by default; in
viz.html + viz.js FAVORITES; V4/V5 still present to compare). Architecture (from `V6-PLAN.md`): v4's
single-preset spine (makePicker director, persistent orbs/tether, per-frame motif dispatch) + a feedback
WARP/COMP engine. Where it ended this session:
- **Background:** `q29` BG_MODE 0..9 on a weighted bag (`BG_BAG`); dominant = a flowing scrolling-bands
  fluid field; modes 1/4 are a MIRROR kaleidoscope (fold mirrors field+motif); 2 bullseye, 3 sine-bands,
  5 tilt, 6 vortex, 7 wallpaper, 8 vertical-barcode, 9 neon-dark. Colours analogous; bg scroll + hue
  cycle were just sped up; bg snaps discretely on scene cuts.
- **Motif:** `MOTIF_BAG` weighted to the dense kit ANEMONE (`alcAnemone`); rose/Lissajous (`fRose`/`fLissa`,
  modes 12/13) demoted to occasional; spiky bursts rare. Smoothed beat envelope (`pulse`) drives the pops.
- **Camera/feedback:** gentle (the heavy zoom+rotation that smeared the motif was dialed back); a small
  upward `dy` drift; off-center drifting vanishing point.
- **Colour:** hue clock (faster now) + a per-scene-cut hue step; per-mode saturation; Reinhard tone-map;
  a milky pastelize on the wash regimes; `sampler_blur1` glow on the motif.
- A production-no-op debug hook in `frame()`: `window.__ALC_FORCE = {q29:N,...}` pins engine vars for
  headless verification (used by the scratchpad render harnesses).

**Commits this session** (all on `main`): `03e3e4e` two-regime bg · `d8f0aee` parallax(camera-warp) ·
`dffea69` colour-speed · `047da33` pickets · `6106b00` barcode · `97a1c35` depth/anti-jitter/white-out ·
`de48daa` weighted-rotation+glow · `f17cc49` stable-canvas+flowing-bg · `511fe69` scrolling-bands ·
`d666861` water(REVERTED) · `7d1d15f` remove-water · `69d8db1` parametric-flower+tunnel · `bce9580`
mirror-kaleido+faster-bg+demote-rose.

---

## 4. VERIFICATION

- `npm test` / `node --check presets/alchemy-v6.js`.
- Concat+frame_eqs harness (CLAUDE.md): build the preset, run `frame_eqs` over a time sweep, run enabled
  waves' `point_eqs` + shapes' `frame_eqs` — catches throws / missing kit refs / q-var collisions.
- **`node tools/selfrender.mjs "Alchemy V6: Random" "t1,t2,..."`** → `/tmp/alc-render/*.png` + the page
  console (catches `[WMP-viz shader]` compile errors). **Synthetic beat only — no real music.**
- Scratchpad helpers this session (under the session scratchpad, re-create if gone):
  `render-bgmodes.mjs` (pins each BG_MODE via `__ALC_FORCE`), `render-motion.mjs` (sequential frames of a
  pinned mode to judge motion). Reference frames of orig.mp4 are in the `handoff/` scratchpad dir.

---

## 5. WHAT THE USER POSITIVELY LIKED / ASKED FOR (anchors)
- A **mirror kaleidoscope** (content reflected into symmetry) over flat colour wedges.
- v4's **filled-colour orbs** were called "gorgeous" earlier.
- Backgrounds with **colour patterns that MOVE** (scroll up) and **change colour FAST**.
- The original's **depth / sense of 3D space** (never matched — the core ask).
- Smooth, non-jittery motion (smoothed envelope, not raw audio → coords).

---

## DEFINITIVE ORIG SPEC + REBUILD PLAN

_(Appended below from the handoff analysis workflow — the authoritative starting point.)_

### Verdict

REBUILD the central-motif + depth approach from scratch. Keep V6's INFRASTRUCTURE (the persistent feedback buffer, the WARP/COMP shader scaffolding, the per-frame q-var dispatch, the analogous palette/tone-map, the BG_MODE selector machinery) but THROW OUT how it draws figure and how it tries to manufacture depth. V6 reads flat for a structural reason that no amount of WARP/COMP tuning will fix: it draws the motif as a dense FILLED anemone/disc and the orbs as FILLED discs, then tries to bolt "depth" on via perspective-shear/vortex in the WARP. The original gets its depth the opposite way — depth lives in HOW THE GEOMETRY IS EMITTED (foreshortened wireframe sheet + a SINGLE ring per frame that the feedback echo turns into a receding coil/tube + a converging filament-comb), and the WARP only does a gentle oscillating roll/breathe to keep that geometry tumbling. You cannot retrofit that onto filled discs; the emission strategy must change. So: do not iterate V6's drawing code further. Start a fresh alchemy-v7.js that reuses V6's shader/engine plumbing but rebuilds the figure layer around three new emission primitives (foreshortened mesh, single-ring-echoed orb, converging comb) verified frame-by-frame against orig.mp4 BEFORE adding any colour/bg polish. This is the bigger rebuild, and it is the right call.

### What orig.mp4 actually IS (definitive spec)

orig.mp4 = ~/Downloads/Alchemy-orig-reference-19s.mp4, 640x480, 19.6s, ~30fps. I extracted and read the frames directly; this reconciles the 4 analyses with what is actually on screen.

ONE evolving 2D feedback space (never scene-cuts) cycling through the SAME visual vocabulary re-posed at new orientations over a fast-changing analogous colour field. Three layers, parallax-separated.

MOTIF (figure) — it is NOT one thing; it is a small vocabulary the engine re-poses:
1. A WIREFRAME MESH / NET. Frame ~0s: a regular cyan crosshatch GRID (not a yarn-tangle — it has clear horizontal+vertical strands forming cells), bowed so strand-spacing compresses on one side = foreshortened sheet seen at an angle. Diagonal blue dashed rake-lines fan off it (feedback smear of the grid). ~24-40 strands, thin (1-2px) slightly-additive, no clean radial symmetry.
2. A DENSE SPIKY/CURLY KNOT-URCHIN. Frame ~5s: a compact gold ovoid of many small spikes/loops, ~0.3w x 0.45h, sits low-center, churns/rotates slowly in place (does NOT zoom toward camera). Near-monochrome per frame.
3. COIL-ORBS. Frames ~11-13s: glowing ringed balls each TRAILING a vertical stack of receding ring-echoes (a slinky/tube). I confirmed via consecutive frames that the coil is the FEEDBACK ECHO of a SINGLE moving ring, not 8 drawn rings. Usually 2 orbs at opposite corners.
4. CONVERGING FILAMENT-COMB. Frame ~6s: ~12-20 near-parallel green+amber lines whose spacing NARROWS toward an off-frame vanishing direction. Strongest single perspective cue in the clip. Created by line-spacing, NOT a floor grid.
5. MIRRORED WAVEFORM MOUNTAINS. Frame ~7s: a live jagged AUDIO waveform drawn as a terrain ridge along the bottom, mirror-doubled (subtle 2-fold), with 2 small ringed orbs floating above. Plus a bright jagged audio-waveform LINE threaded through the motif in several frames.
All figure is THIN slightly-additive strokes; the volumetric read comes from overlap + feedback echo, never from a lit 3D surface or filled disc.

BACKGROUND — soft painterly CLOUD/FLUID field, NO geometry, NO grid/wedges/rings. 3-5 broad horizontal-ish colour bands with FEATHERED (never hard) edges, bleeding like wet watercolour. Dominant motion = HORIZONTAL/diagonal SMEAR-DRIFT (a feedback dx + small zoom about an off-center pivot) raking blobs into long lower-left->upper-right streaks. Darker/cool toward top+edges (vignette), brighter/warm toward bottom-center where the motif sits (atmospheric gradient, NOT a horizon line). Late scenes drop to near-black grounds so accents read as glow.

COLOUR — slow-ish ANALOGOUS wash drifting through neighbouring families, ~5s dwell per family: teal/cyan (0-5s) -> green->rose (5-9s) -> magenta/violet (9-14s) -> amber-on-near-black (14-19.6s). At any instant only 2-3 adjacent hues + ONE warmer accent on the motif (gold over teal, blue over pink). Never full-spectrum rainbow, never muddy. Saturation moderate (0.45-0.65), dusty cores, vivid only where additive/bright; only tiny orb cores blow to white.

MOTION/DEPTH — see depthAnswer. Camera ROLLS/BREATHES (oscillating rotation ~2-6deg/s sign-flipping, zoom oscillating tightly around 1.0), it does NOT plunge. Background fast, motif slow, orbs+comb fastest (parallax). Feedback decay ~0.93-0.96 (short enough to build coils without mush).

### ★ The depth answer (the #1 unsolved question, now answered)

The depth is NOT in the WARP transform and NOT in any environment — it is in HOW THE GEOMETRY IS DRAWN, plus the feedback echo turning single strokes into receding volumes. There are FOUR concrete, purely-2D mechanisms, none of which V6 currently does:

1. COIL-ORBS = FEEDBACK ECHO OF A SINGLE MOVING RING (the biggest one). I verified this on consecutive frames: each orb is ONE ring drawn per frame at the orb's drifting position; the WARP's small per-frame rotation+shrink about an OFF-CENTER pivot replicates the previous frames into a stepped, tapering stack = a slinky/tube receding into space. So you must (a) draw ONE thin ring per orb per frame (circleWave), NOT a filled disc and NOT 8 rings, (b) keep decay ~0.94, (c) keep the WARP pivot OFF-center from the orb so the echo displaces along a direction = the coil axis. The receding ring-stack IS the 3D read. V6's filled discs can never do this.

2. FORESHORTENED WIREFRAME (perspective squash in the draw-fn). Draw the mesh/net as a sheet of strands and, per point, multiply its offset by a depth factor d = 1/(1 + k*proj) where proj = dot(point, tiltDir) and tiltDir is a slowly-oscillating q-var axis. This compresses strand-spacing on the far side exactly like frame-0's bowed net — pure 2D math, no 3D engine. The non-uniform strand spacing is what makes a flat grid read as a tilted sheet.

3. CONVERGING FILAMENT-COMB. Lay ~16 near-parallel waveform lines (real audio for the jaggedness) whose lateral spacing is multiplied by the SAME d-factor toward a migrating vanishing direction (q-var). Converging parallels are the single strongest perspective cue in the whole clip and are trivial in 2D — and crucially this is the depth cue the user actually wants, achieved WITHOUT the rejected floor grid (the convergence is the comb's own line-spacing, not a ground plane).

4. LAYERED PARALLAX + OCCLUSION. Three layers at three motion rates: bg wash slowest (q-driven uv offset in COMP), mesh-knot mid, orbs+comb fastest (~1.5-2x). Draw orbs/comb ON TOP so they occlude the mid layer (frame-8 shows orbs clearly in front of the band). Different layer speeds = parallax = depth.

The WARP's ONLY job for depth is a GENTLE, SIGN-OSCILLATING roll+breathe about a SLOWLY-DRIFTING off-center pivot (rotation ~2-6deg/s flipping sign every few seconds; zoom oscillating in 0.995..1.005). That is the "tumbling/rolling space" feel. It must NEVER be a constant-direction plunge (rejected) and it does NOT itself create the depth — it only keeps the foreshortened geometry tumbling and replicates rings into coils. This is the reconciliation of "no faked 3D" and "no constant plunge": depth = foreshortened emission + feedback-echoed coils + converging comb + parallax, with the WARP merely rolling gently.

### Start here — the 2-3 things to nail FIRST

1. THE COIL-ORB AS A FEEDBACK ECHO OF A SINGLE MOVING RING. This is the single biggest gap and the single biggest depth source. V6 draws filled discs; the original draws ONE thin ring per frame and lets the off-center WARP rotation+shrink replicate it into a receding slinky/tube. Prove this in isolation (Step 1) before anything else — it is what the user means by '3D'.
2. FORESHORTENED WIREFRAME EMISSION for the central motif (perspective squash d=1/(1+k*proj) in the draw-fn) PLUS the converging filament-comb. Together these are the '3D feel' done in pure 2D, replacing both rejected dead-ends (dense filled disc AND sparse single-stroke rose). The mesh strand-spacing must visibly compress on the far side.
3. GENTLE OSCILLATING WARP, never a plunge. The WARP must roll/breathe (sign-flipping rotation, zoom oscillating tightly around 1.0, slowly-drifting off-center pivot). Its job is to tumble the foreshortened geometry and echo rings into coils — NOT to manufacture depth by zooming. Get this restraint right or it relapses into the rejected constant-forward-tunnel.

### Rebuild plan (alchemy-v7.js — keep V6 engine, rebuild figure+depth)

1. STEP 0 (no code): extract orig.mp4 frames yourself (~/Downloads/Alchemy-orig-reference-19s.mp4) at fps=2 + a tight consecutive-frame strip at 11.5-12.7s. Confirm with the user ONE target to nail first: the COIL-ORB. Do not start with bg or colour. Frames are reproducible with: ffmpeg -i "$V" -vf fps=2,scale=288:216,tile=5x8 montage.png and ffmpeg -ss 11.5 -t 1.2 -i "$V" -vf fps=8,scale=288:216,tile=5x2 orbcoil.png.
2. STEP 1 (the make-or-break test): fork alchemy-v7.js from V6 KEEPING the WARP/COMP/feedback plumbing. Strip the figure layer to NOTHING but TWO orbs, each drawn as a SINGLE thin ring per frame via kit circleWave (NOT alcOrbRow filled disc, NOT alcMeshRings 8-ring stack). Set decay q1~0.94. In WARP set a gentle per-frame rotation (~0.03 rad) + tiny shrink (zoom ~0.997) about an OFF-CENTER pivot offset from frame center. Self-render a SEQUENCE of consecutive frames (tools/selfrender.mjs with several close timestamps) and confirm the single ring echoes into a receding COIL/tube. If it doesn't, fix the pivot offset / decay / rotation before anything else. This is the #1 depth mechanism — prove it in isolation first.
3. STEP 2: add the FORESHORTENED MESH as the central motif. New emission (can live inline in v7 or as a new kit factory alcMeshSheet): a custom wave laying ~30 strands of a grid; per point multiply the offset by d=1/(1+k*dot(point,tiltDir)); tiltDir from a slow-oscillating q-var. Thin, additive, low wave_smoothing so the threaded live-audio jaggedness survives. Self-render at several tilt phases; confirm strand-spacing compresses on the far side = a tilted sheet, NOT a flat rosette. This replaces the rejected dense-disc-anemone AND the rejected sparse rose.
4. STEP 3: add the CONVERGING FILAMENT-COMB (one custom wave, ~16 parallel waveform lines, lateral spacing x d-factor toward a migrating vanishing q-var). Self-render; confirm parallels converge. This is the user's wanted depth cue without a floor grid.
5. STEP 4: add the MIRRORED WAVEFORM MOUNTAINS — one waveLine as a bottom ridge, mirror-folded ONCE in COMP (abs about a vertical axis) for the subtle 2-fold. Plus a separate waveLine audio thread through the motif center (like Dance). Real samples (a.value1) drive jaggedness — never synthetic sin().
6. STEP 5: ONLY NOW the background. In COMP build a domain-warped fbm cloud field (2-3 octaves), y-domain scaled bigger than x so it forms broad horizontal-ish soft bands with feathered edges. NO geometric modes for the dominant bg. Add the vertical luminance gradient (cool/dark top+edges, warm/bright bottom-center) + corner vignette. NO horizon line, NO mirror split.
7. STEP 6: background MOTION = a feedback dx (~0.004/frame) + small zoom (~1.006) about an off-center pivot in WARP, modulated by uv.y so lower bands smear faster than upper (the parallax/depth, not a plunge). Make the smear rake slightly diagonally (small shear) to match the lower-left->upper-right streaks.
8. STEP 7: COLOUR last. Drive ONE analogous base hue h0 advancing ~one family-hop per ~1.5s (full ~6s loop) from frame_eqs into both shaders. Background = narrow-spread cosine pal (tight 0.15/0.30 phase offsets so channels stay neighbouring, never rainbow) cross-faded between old/new family over ~1s so it morphs, never cuts. Motif accent hue = h0 offset toward warm (gold over teal). Desaturate-mix toward luminance ~30% + Reinhard tone-map so vivid peaks compress to colour not white. Tiny per-beat hue nudge (+0.02*bass_att) only.
9. STEP 8: tune parallax rates (bg slowest, mesh mid, orbs+comb ~1.5-2x), draw orbs/comb on top (occlusion), and animate q-vars on incommensurate slow sins (periods ~7s,~11s,~13s) so it feels random/non-looping as ONE preset. Commit small after each step that self-renders clean; ask the user for a SCREEN RECORDING (headless has only a synthetic beat — motion/coil/parallax can only be judged live).

---

## FULL REPORT (consolidated 4-aspect analysis)

# Alchemy V7 Handoff — Definitive Spec, Depth Answer, and Rebuild Plan

I extracted and read the actual orig.mp4 (`~/Downloads/Alchemy-orig-reference-19s.mp4`, 640x480, 19.6s, 30fps) frame-by-frame, including a tight consecutive-frame strip of the orb-coil moment, and reconciled it with the four analyses. Where the analyses disagreed, my own frame study is the tiebreaker. Verdict: **rebuild the figure + depth layer from scratch (alchemy-v7.js), reusing V6's shader/feedback plumbing.** V6 is flat for a structural reason, not a tuning reason.

## 1. THE MOTIF (figure)

The original does NOT have one central motif — it has a small VOCABULARY it re-poses over the clip, all rendered as THIN slightly-additive strokes (1-2px, soft glow), never filled, never neon, never clean radial spokes:

- **Wireframe mesh/net** (~0s): a regular cyan crosshatch GRID, bowed so strand-spacing compresses on one side (foreshortened sheet seen at an angle). Diagonal blue rake-lines fan off it = feedback smear of the grid. NOT a "ball of yarn" (Analysis 1 overstated the tangle); it is a structured net. ~24-40 strands.
- **Dense spiky knot-urchin** (~5s): compact gold ovoid of many small spikes/loops, churns slowly IN PLACE, does not zoom toward camera. Near-monochrome.
- **Coil-orbs** (~11-13s): glowing ringed balls each trailing a vertical stack of receding ring-echoes (slinky/tube). VERIFIED on consecutive frames to be the feedback echo of a SINGLE moving ring, not multiple drawn rings.
- **Converging filament-comb** (~6s): ~12-20 near-parallel green+amber lines, spacing narrowing toward an off-frame vanishing direction. The strongest perspective cue in the clip.
- **Mirrored waveform mountains** (~7s): a live jagged audio waveform as a bottom terrain ridge, mirror-doubled (subtle 2-fold), with small ringed orbs above. Plus a jagged audio-waveform line threaded through the motif in several frames.

V6 draws the motif as a dense filled kit anemone and the orbs as filled discs (alcOrbRow). That can produce NONE of these signatures regardless of WARP tuning. This is the root cause of "feels flat."

## 2. THE BACKGROUND

Soft painterly CLOUD/FLUID field. NO geometry, NO grid/wedges/rings (Analysis 2 is correct and overrides V6's 10 geometric BG_MODEs as the *dominant* look). 3-5 broad horizontal-ish bands, feathered edges, bleeding like wet watercolour. Dominant motion = horizontal/diagonal SMEAR-DRIFT (feedback dx + small zoom about an off-center pivot) raking blobs into lower-left->upper-right streaks. Atmospheric luminance gradient: cool/dark top+edges, warm/bright bottom-center where the motif sits — this is NOT a horizon line (the rejected water-mirror). Late scenes go near-black so accents read as glow. Build it as domain-warped fbm with the y-domain scaled larger than x for horizontal banding.

## 3. COLOUR

Analogous wash drifting through neighbouring families, ~5s dwell each: teal/cyan -> green/rose -> magenta/violet -> amber-on-near-black. At any instant only 2-3 adjacent hues + ONE warmer accent on the motif. Never rainbow, never muddy. Saturation 0.45-0.65, dusty cores, vivid only at additive highlights; only tiny orb cores blow to white. Drive one base hue h0 into both shaders; bg = narrow-spread cosine palette (tight phase offsets keep channels neighbouring); cross-fade old/new family over ~1s so it morphs, never cuts; tone-map (Reinhard) + desaturate-toward-luminance ~30%. (Note: the analyses split on speed — Analysis 2/3 say ~0.16-0.25 hue/s fast, Analysis 4 says ~5s dwell. They reconcile: a full FAMILY change in ~5-6s, which IS fast relative to this codebase's old 0.05 drift. Use ~one family-hop per 1.5s.)

## 4. DEPTH / 3D-FEEL — THE #1 UNSOLVED QUESTION, SOLVED

Depth is NOT in the WARP transform and NOT in any environment. It is in HOW THE GEOMETRY IS EMITTED + the feedback echo. Four purely-2D mechanisms, none of which V6 does:

1. **Coil-orbs = feedback echo of a single moving ring.** Verified on consecutive frames: ONE ring drawn per frame; the WARP's small per-frame rotation+shrink about an OFF-CENTER pivot replicates prior frames into a tapering receding stack = a tube into depth. Requires: draw one thin ring (circleWave) per orb, decay ~0.94, pivot OFFSET from the orb. This is the biggest single depth source and the user's "3D."
2. **Foreshortened wireframe** via a per-point depth squash d = 1/(1 + k*dot(point,tiltDir)), tiltDir a slow-oscillating q-var. Compresses strand-spacing on the far side = tilted sheet. Pure 2D.
3. **Converging filament-comb**: ~16 parallel waveform lines, lateral spacing x d-factor toward a migrating vanishing direction. Converging parallels = strongest perspective cue, with NO floor grid (the rejected approach).
4. **Layered parallax + occlusion**: bg slowest, mesh-knot mid, orbs+comb fastest (~1.5-2x), drawn on top so they occlude the mid layer.

The WARP's ONLY depth job: a gentle, SIGN-OSCILLATING roll+breathe about a slowly-drifting off-center pivot (rotation ~2-6deg/s flipping sign; zoom oscillating in 0.995..1.005). Never a constant plunge. This reconciles "no faked 3D" + "no constant plunge": depth = foreshortened emission + echoed coils + converging comb + parallax; the WARP just rolls gently and replicates rings into coils.

## 5. REBUILD PLAN (ordered, each self-renderable)

Fork alchemy-v7.js from V6 keeping WARP/COMP/feedback plumbing; throw out the figure-drawing and the depth-via-shear approach.
- Step 0: confirm with the user that the COIL-ORB is target #1.
- Step 1: prove the single-ring->coil feedback echo in isolation (two circleWave rings, off-center WARP pivot, decay 0.94). Self-render a consecutive-frame sequence.
- Step 2: foreshortened mesh sheet (perspective squash in the draw-fn).
- Step 3: converging filament-comb.
- Step 4: mirrored waveform mountains + threaded audio line (real a.value1, never sin()).
- Step 5: fbm cloud bg (no geometric modes) + luminance gradient + vignette.
- Step 6: bg smear-drift (feedback dx + uv.y-modulated zoom).
- Step 7: analogous colour (one base hue, narrow cosine palette, cross-fade families, tone-map).
- Step 8: parallax rates + occlusion + incommensurate-sin q-vars for non-looping feel. Commit small after each clean self-render; ask the user for a SCREEN RECORDING (headless has only a synthetic beat).

## 6. KIT IS SUFFICIENT — DO NOT INVENT GEOMETRY

The figure primitives already exist: `circleWave` (single ring orb), `waveLine` (audio thread + mountains), `alcMeshRings`/`alcNetFrame` (mesh basis), `alcOrbRow` (has vanishing-point args), `alcTether`. The rebuild needs a different EMISSION strategy (single ring + feedback echo; foreshortened mesh; converging comb), not new motif inventions. Use the factories; if a foreshortened-mesh-sheet emitter doesn't exist, add it as a kit factory (alcMeshSheet) rather than inlining a one-off (per CLAUDE.md). Honour the 4-wave/4-shape budget: orbs as rings via custom waves, comb as one wave, mesh as one wave, mountains/thread share slots.

## 7. EXPLICIT DEAD-ENDS TO NOT REPEAT
Faked 3D env (water/horizon/floor grid); spiky disconnected radial bursts as the motif; sparse single-stroke rose/Lissajous; flat colour-wedge diamond kaleidoscope (prefer MIRROR fold of the foreshortened mesh if symmetry wanted); rainbow / muddy colour; static/slow bg + slow colour; constant forward plunge/white-out core. All rejected over ~15 rounds.
