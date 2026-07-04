# Meta-prompt: WMP Alchemy deep video analysis (scene-by-scene, frame-by-frame, motif-by-motif)

Copy everything below the line into a fresh Claude session (or split the SEGMENT variable across
parallel subagents). Fill in the video path(s) first.

---

## Role and goal

You are analyzing reference video captures of the Windows Media Player "Alchemy Random" music
visualizer so its behaviour can be faithfully re-implemented as a Butterchurn (MilkDrop) preset.
Your job is OBSERVATION and MECHANISM INFERENCE, not implementation. Every claim must be anchored
to a timestamp and, where possible, measured rather than eyeballed. Someone will write code from
your report — vague words like "organic" or "dynamic" are useless; sizes in % of frame, speeds in
frame-widths/second, periods in seconds, and counts are what matters.

## Inputs

- VIDEO: `<absolute path to reference .mp4>`
- SEGMENT: `<start>s to <end>s` (if analyzing in parallel, each analyst takes one segment)
- Work dir: `<scratch dir>` — extract all frames/montages here, never into the repo.

Known captures and their trust levels (adjust if using different files):
- `Alchemy Random Media Player 480p.mp4` (640x480, 228s) — COLOUR-ACCURATE (true blacks ~7,
  muted/dusty). Trust its colours.
- `YouTube 1080p 60fps Download.mp4` (1280x720, 186s) — a washed/boosted 60fps re-encode: blacks
  lifted to ~48, saturation inflated. Trust its GEOMETRY and MOTION, not its colour levels.
- `Alchemy-orig-reference-19s.mp4` (640x480, 19s) — colour-accurate; excellent for orb pulsing,
  snaking stalk motion, and bold banded backgrounds.
- Ignore player chrome: WMP transport bars at frame bottom, screen-recording overlays.

## Method

1. **Scene inventory**: `ffmpeg -ss <t0> -t <dur> -i "$V" -vf "fps=1,scale=240:-2,tile=8x8:padding=2" -frames:v 1 sheet.png`
   → Read it, mark scene boundaries (tile N = second t0+N).
2. **Motion bursts** at each scene's midpoint (and at every transition):
   `ffmpeg -ss <t> -t 2.2 -i "$V" -vf "fps=4,scale=320:-2,tile=3x3:padding=2" -frames:v 1 burst_<t>.png`
   — 9 consecutive frames 0.25s apart. This is your main instrument: compare tiles to see what
   moved, what re-jagged, what pulsed, what recoloured.
3. **Full-res stills + crops** for anatomy: extract single frames without scaling; crop close on
   orbs, line intersections, tether spans, band edges. Line thickness in px matters.
4. **Long-span checks**: hue cycles and camera drifts are slow (5-60s). For any colour or drift
   claim, compare frames ≥20s apart, not adjacent ones.
5. **Motion measurement** (optional but preferred): phase-correlate consecutive grayscale frames
   (numpy, 256px wide) to get global dx/dy per second — separates camera motion from element
   motion. Report speeds as %-of-frame-width per second.
6. Frame-rate note: anything re-randomizing EVERY frame at source fps is live-audio-driven;
   anything smooth is a clock. This is the single most important discrimination — always state
   which one you observed and how you know.

## Critical analysis rules

- **Emitter vs trail**: most of what fills an Alchemy frame is the feedback buffer (decayed,
  blurred, displaced copies of past frames). For every element, separate the LIVE emitter (crisp,
  re-drawn per frame) from its TRAIL (soft, lagging, displaced). Describe both, and describe the
  displacement direction of the trail relative to the emitter's motion.
- **The waveform test**: if a line's jaggedness re-shuffles every single frame with fine dense
  teeth, it is the live audio waveform. If it undulates smoothly, it is a sine/clock. Say which.
- **Layer independence**: elements are NOT parented. For each scene, list every element class and
  its OWN motion direction/clock. Counter-motion (bg one way, motif another) is a defining
  Alchemy trait — catalog every instance and its mechanism.
- **Never average away extremes**: "mostly muted with a vivid kaleidoscope phase" is right;
  "medium saturation" is wrong. Report ranges and when each end occurs.

## Question checklist — answer ALL of these explicitly

### A. Motifs (for EACH distinct motif seen)
- Construction: what primitive is it built from (radial filaments? polygon outlines? parallel
  strand families? stacked ring copies? scribble strokes?), how many elements (arms, strands,
  rays, petals — count them), size in % of frame.
- Line quality: thickness (px at source resolution), soft or crisp, single stroke or 2-3
  chromatic offset copies (RGB doubling), straight / curved / wavy / jagged.
- Are the lines live waveforms? (apply the waveform test).
- Music reactivity: what pulses on beats (size %, brightness, jag amplitude, re-stamp events,
  filament density) and what stays smooth. Estimate pulse magnitude (e.g. "diameter +15% on
  hits", "balloons 2.5-3x over ~0.8s then settles").
- Motion: how does it move/rotate through space — drift path shape (straight/S-curve/orbit),
  speed, rotation rate, does it precess/tilt in 3D (y-squash oscillation?), does it grow/bloom
  on entry and how fast, how does it exit (fade/dissolve/shrink)?
- Colour: which 2-3 hues at once, saturation level vs the ground, how fast hue moves WITHIN the
  motif (sweep front? whole-motif re-tint? per-arm alternation?), does colour snap on hits?

### B. Scenes and composition
- Full scene catalog with timestamps and dwell times.
- Per scene: which element CLASSES are simultaneously present (bg / central motif / tether+orbs /
  accessory rows / ray fans / free strands) — count them. Note rest scenes (1-2 classes) and
  climax scenes (5+), and the busy↔empty breathing period.
- How scenes transition: hard cut / crossfade / feedback dissolve (old content absorbed into the
  new scene — describe HOW, e.g. "bars get folded into the incoming kaleido").
- Which pairings recur (e.g. structured bg + exactly one organic motif; terrain + endpoint orbs).

### C. Camera and parallax
- Global camera behaviour per scene: still / constant drift (speed+direction) / sustained pan
  (speed, hold duration) / oscillating pan (flip period) / violent travel / zoom-dolly. Match
  camera behaviour to scene TYPE (wallpaper scenes vs sheet scenes vs net scenes...).
- How the parallax feel is created: does the whole scene translate rigidly? Does the trail
  stream faster than the emitters (slip)? Do layers translate at different rates/directions
  (treadmill ground under still motifs)? Radial expansion behind orbiting elements? Catalog
  each mechanism with a timestamp.

### D. Backgrounds
- Catalog every background regime: solid wash / banded / bars / kaleidoscope-fold / wallpaper
  tile / fluid-marble / caustic streaks / pure black / self-feedback smear. Mid-tone or dark?
  Textured how?
- How each MOVES: scroll direction+speed, undulation, shear, streaming streak texture. Is the
  movement continuous, and does colour change ride ON the movement (bands sweeping through) or
  happen in place?
- What subtle effects create the sense of motion or 3D: perspective foreshortening, receding
  rows, oblate tilted discs, reflections, vignettes, depth-fades, moiré, mirrored counterflow —
  name each and where.
- How motifs and tethers leave COLOUR TRACES on the background: how far the pigment spreads, how
  long it lives (seconds until gone), does it diffuse/blur as it ages, does it change hue as it
  ages, does it move (sink/stream) after deposit?

### E. Tethers (the orb-to-orb lines)
- Construction: how many parallel strands, thickness in px, crisp or soft edges, chromatic
  fringing?
- Geometry: how do the endpoints land on the orbs? Straight chord + perpendicular waveform
  displacement? Amplitude envelope along the span (calm at tips, wild mid-span)?
- Appearance/disappearance: is the tether persistent or an EVENT (appears on hits, lives N
  seconds, dissolves into trail)? Measure typical lifetime and spawn cadence.
- Colour: fixed per appearance or cycling; single hue or duo (highlights of a second hue along
  it); does colour snap between appearances?

### F. Orbs
- Catalog every orb VARIANT: plain glow-disc / ringed disc (how many rings) / bullseye eyelet /
  hollow ring / pompom-scribble / bead / rosette-flower / comet-with-tail / ring-stack cone or
  telescope tube. For each: size (% of frame), where it appears.
- Anatomy: how is the body filled (solid, gradient, milky core + bright rim?), outline (how many
  concentric ring outlines, their colour vs the fill), the halo/glow (extent, hue same or offset).
- Motion: paths (straight orbit vs snaking/wobbling — measure the wobble period and amplitude),
  do they sit at the tips of stalks/columns, do they swap corners, do mirrored twins oppose?
- Traces/trails: what does an orb deposit (comet smear, colour puff/splat)? size and hue of the
  puff vs the orb, and how it decays.
- Pulse: size pulsing magnitude and envelope shape on beats (attack/decay), brightness flash,
  colour flips. Do different orbs pulse independently?
- How orbs pair with tethers and bead rows (the "dumbbell" signature): typical separation,
  diagonal orientation, staging (one persistent, one coming/going?).

### G. Music reactivity synthesis (cross-cutting)
- Separate into: (1) continuous per-frame audio coupling (waveform jag), (2) beat-triggered
  EVENTS (list every event type seen: tether spawn, colour snap, ray-curtain sweep, motif
  re-stamp, bead pop, orb balloon), (3) smooth beat-independent motion (list what NEVER reacts).
- Estimate the beat-event rate (every beat? every 2-4 beats? only strong hits?).

## Report format

1. **Scene catalog**: one entry per scene — `[t0-t1] name · element classes (count) · camera ·
   bg regime · counter-motion · reactivity · colours`. Keep entries tight but complete.
2. **Element dossiers**: one section per element TYPE (each motif, tether, each orb variant,
   each bg regime) answering the checklist questions, with the best example timestamps.
3. **Mechanism synthesis**: your inferred engine model — feedback decay/blur/displacement, layer
   independence, event triggers — each claim tied to observations.
4. **Implementation notes**: for each finding, one line on what would produce it in a
   MilkDrop/Butterchurn preset (frame_eqs clocks, custom-wave point_eqs geometry, warp/comp
   shader, feedback decay/blur). Constraint to respect: max 4 custom waves + 4 custom shapes
   per preset; waves render lines/dots only (no filled discs); shapes render filled/outlined
   polygons.
5. **Uncertainties**: anything you could not determine and what extraction would resolve it.

Do not modify any project files. Keep all extracted assets in the work dir.
