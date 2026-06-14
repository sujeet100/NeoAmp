# Segment B — 0:22–0:40

Frame-by-frame analysis of WMP "Alchemy" visualization, frames `f_0045`
(22.0s) through `f_0081` (40.0s), extracted at 2 fps, 640x360. Filename
mapping: `time_seconds = (NNNN - 1) * 0.5`.

This segment contains THREE scenes with two transitions:

- **Scene B1 — "Kaleidoscope X-Tunnel"** : 22.0s (f_0045) → ~27.5s (f_0056).
  Confirmed: a horizontally-mirrored, vertically-mirrored 2D kaleidoscope of an
  "X"-shaped twin tunnel with strobing hue cycling red→green→yellow→dark.
- **Transition / Scene B2 — "Wireframe Net"** : ~28.0s (f_0057) → ~37.5s
  (f_0075). Confirmed: thin-line mesh that morphs between an ordered, curved
  layered "sheet" and a chaotic tangled ball; camera is 3D/perspective and
  tumbles around the form. Hue drifts pink→green→amber→purple→blue.
- **Scene B3 — "Orbiters" (emerging)** : ~38.0s (f_0076) → 40.0s (f_0081). The
  Wireframe Net dissolves into the recurring Orbiters motif: 2 glowing endpoint
  "comet" nodes connected by a jagged live-audio waveform line, over a dark
  purple fluid wash. This is the same family as "Dance of the Freaky Circles."

The big-picture rhythm of this segment: a high-contrast, strobing, *symmetric 2D*
scene gives way to a *3D depth* line-mesh scene, which dissolves to the *minimal*
two-node waveform-line scene — i.e. Alchemy cycles busy→busy→sparse.

---

## Scene B1 — Kaleidoscope X-Tunnel (22.0s – ~27.5s, f_0045–f_0056)

**Overview.** This is the "RED/GREEN 2D kaleidoscope X tunnel with strobing" the
brief predicted, and the frames confirm it precisely. The screen is divided by a
bright bow-tie / "X" of crossing diagonal lines that meet at a single vanishing
point dead-center. Above and below the X are two lens-shaped (eye/almond) lobes;
left and right of the X are two triangular wedges. The whole field is built from a
single radiating sunburst tile that is mirrored across BOTH the vertical and
horizontal center axes — a 4-fold (2x2) mirror kaleidoscope, NOT a radial one.

**Background / fill.** There is no separate "background" — the entire frame is the
visual. It is an animated fluid field of broad soft color bands (a saturated
sunburst that fans out from the center). The bands are heavily blurred/feathered,
giving a soft-focus painterly wash, punctuated by sharp thin black radial spokes
that emanate from the central vanishing point like rays of a fan or the spokes of
a Japanese paper umbrella. So: foreground = thin sharp radial spokes + the bright
diagonal X edges; midground/background = the soft blurred color lobes.

**Geometry & symmetry.** Mirror symmetry on the vertical axis (left=right) and the
horizontal axis (top=bottom), 2 axes, producing the 4-quadrant bow-tie. The
central vanishing point is the convergence of all spokes and the X. The almond
lobes top/bottom undulate vertically — their waistline rises and falls over the
scene (compare f_0045 fat lobes vs f_0049 pinched lobes), which reads as a slow
breathing/throb of the kaleidoscope, almost certainly bass-driven.

**Color & hue cycling.** This is the dominant feature. Hue cycles rapidly and
continuously across the whole scene:
- f_0045–f_0046 (22.0–22.5s): deep RED field with violet/purple lobe cores.
- f_0047 (23.0s): red lobes over an OLIVE-GREEN background — mid-transition.
- f_0048–f_0049 (23.5–24.0s): vivid GREEN background, red lobes, pale-yellow
  wedges.
- f_0050–f_0052 (24.5–25.5s): pale yellow-green / lime background, dark-red lobes,
  bright green rims — highest-key (lightest) part of the cycle.
- f_0053–f_0055 (26.0–27.0s): darkening — lobes go red-cored with green rims over
  near-black wedges; field dims toward a dark navy.
- f_0056 (27.5s): very dark — desaturated olive lobes over near-black.
The cycle period is roughly **8–10 seconds for a full red→green→yellow→dark
sweep**, and it is paired with a brightness pulse (bright at ~24.5s, dark by
27.5s). This is a strobing-ish luminance throb layered on a slow hue rotation.

**Motion.** Two motions: (1) the lobe undulation (vertical breathing of the almond
waists, ~1 cycle every 2–3 s, audio-tied), and (2) the spokes appear and sharpen
on beats (f_0051 and f_0052 show dense bright spoke bursts radiating from center —
clearly a treble/transient response). There is mild zoom-pulse toward the center.
Feedback/trails are LOW here — edges are crisp, the softness is gaussian blur in
the source tile, not frame-feedback ghosting. Estimate `decay ≈ 0.9` (short).

**Waveform.** A faint live oscilloscope line is visible threading horizontally
through the center across the X in f_0047 and f_0050 (a thin pale jagged line left↔right). It is subtle, low-amplitude, overlaid on the kaleidoscope.

**Audio-reactivity hypotheses.** Bass → lobe-waist breathing + overall zoom pulse;
treble/transients → the sharp radial spoke bursts (f_0051/f_0052); the hue cycle
is time-driven (not audio). Brightness throb likely overall RMS/bass envelope.

**Implementation direction (Butterchurn).** Do this almost entirely in a `comp`
(and/or `warp`) shader. Coordinate system: copy `uv` into a local `vec2 p`,
recentre `p = uv - 0.5`, aspect-correct `p.x *= resolution.x/resolution.y`.
Kaleidoscope fold: `p = abs(p)` to get the 4-fold mirror (this gives the bow-tie
for free). Convert to polar around center for the radial sunburst: `float pang =
atan(p.y, p.x); float pr = length(p);` (remember: NOT `ang`/`rad` — reserved).
Build the sunburst with `sin(pang * N)` for the spokes (N≈24–40 for many thin
rays), and the soft color lobes with smooth functions of `pr`. The X edges fall
out of `abs()` mirror seams. Hue cycle: drive a `pal()`-style cosine palette by
`time * 0.12` (≈8.5s period) and mix between RED and GREEN poles, then add a
luminance throb `* (0.6 + 0.4*bass_att)`. For the spoke bursts, gate spoke
amplitude on `treb_att`. Keep `decay` short (~0.9), low `warp`. Optionally draw the
faint center waveform as one `waveLine()` horizontal custom wave at y=0.5 with low
`wave_scale`. **Colors here are VIVID, not muted** — this scene is high-saturation
red/green, so do not apply the Alchemy-muting rule to B1; match the reference's
saturation.

---

## Scene B2 — Wireframe Net (≈28.0s – ≈37.5s, f_0057–f_0075)

**Overview & transition.** Confirmed as the "tangled Wireframe Net" scene. The
transition out of B1 is a fast morph, not a clean cut: f_0057 (28.0s) is a
motion-blurred smear of the dark kaleidoscope already breaking apart into
diagonal banded planes with a green/pink waveform streak — a ~0.5s blurred
hand-off. By f_0058 (29.0s) we are fully into the Net: a black background with
dozens of thin glowing filaments.

**Background.** Solid near-black throughout, occasionally tinted by soft
out-of-focus color glows behind the mesh (red/green/purple bokeh blobs drifting in
the deep background, e.g. f_0060, f_0064). Black background makes the thin
filaments read as glowing neon lines (additive).

**Foreground elements & geometry.** A mesh of many thin parallel-ish filaments
(roughly 15–40 visible lines) that form a curved, warped "sheet" or "net." The net
continuously morphs between two states:
- **Ordered sheet** (f_0058–f_0064, ~28.5–31.5s): the filaments are smooth,
  near-parallel curved strands sweeping diagonally across frame like a draped
  fishing net or harp strings, with a clear flow direction (upper-right to
  lower-left). They fan out from a converging waist. Lines are clean, low-noise.
- **Chaotic tangle** (f_0065–f_0072, ~32.0–35.5s): the same filaments crumple into
  a dense knotted ball/clump — a "tumbleweed" or sea-urchin of crossing lines
  (f_0065 green tangle, f_0066 green hairball, f_0068 purple+green knot, f_0070
  purple/yellow burst, f_0071–f_0072 purple needle-ball). The lines cross
  randomly, very high line-density at the clump center.
- Then it RE-ORDERS back toward sheet/wave form by f_0073–f_0075 (35.5–37.5s):
  filaments straighten into diagonal strands again, then dissolve.

So the morph is: ordered sheet → chaotic tangle → ordered sheet, ~one full
order↔chaos cycle across the ~9s scene, gated on the music.

**Camera / perspective.** This scene is **3D with perspective**, unlike B1. The
filaments recede in depth (foreground strands thick/bright, background strands thin
and converging), and the camera SLOWLY ORBITS/TUMBLES around the mesh — the
vanishing direction of the strands rotates frame to frame (compare the strand
angle in f_0059 vs f_0062 vs f_0067). There is a gentle dolly/roll. No mirror
symmetry here; it is an asymmetric 3D object viewed off-axis.

**Motion & feedback.** Strong sense of flow along the strands (energy travelling
down the lines). Motion blur is MODERATE-to-HIGH on the fast tangle frames (f_0057,
f_0067, f_0070 show smeared streaks) — there is real frame-feedback ghosting here,
estimate `decay ≈ 0.94–0.96` so the thin lines leave short trails as they whip
around. The orbit rotation is slow and steady (~10–20°/s).

**Waveform.** The filaments ARE waveforms. Each strand is a live-audio
oscilloscope trace — note the small-amplitude jitter riding along each line
(visible as fine wobble in f_0059, f_0073). The collective sheet is many stacked
waveform lines (horizontal-slice waveforms, exactly as the brief's "horizontal
waveform slices" hypothesis), and the tangle is those same waveforms with their
positions scrambled / amplitude blown up so they knot. The brief's "jagged line =
real audio waveform" applies: drive strand displacement from `a.value1/value2`.

**Color & hue cycling.** Hue drifts continuously, ~10–12s period:
- f_0058 (28.5s): orange/pink amber strands.
- f_0059–f_0060 (29.0–29.5s): white/green strands, green background glow.
- f_0061–f_0063 (30.0–31.0s): mixed green/yellow/purple.
- f_0064 (31.5s): warm AMBER/orange strands.
- f_0065–f_0066 (32.0–32.5s): GREEN tangle.
- f_0067 (33.0s): green→ goes white-green.
- f_0068–f_0070 (33.5–34.5s): PURPLE + green two-tone.
- f_0071–f_0075 (35.0–37.5s): increasingly BLUE/violet, ending deep indigo.
Individual strands can carry different hues simultaneously (multi-color net), so
this is a per-strand palette offset, not one global color.

**Audio-reactivity hypotheses.** Bass → order↔chaos morph amount (loud/bass-heavy
sections explode the net into the tangle; quiet sections let it relax into the
ordered sheet). Mid/treb → the fine per-strand waveform jitter amplitude. Camera
orbit speed steady (time-driven). Background bokeh glows pulse on bass.

**Implementation direction (Butterchurn).** This is a custom-wave scene, NOT a
shader scene. Coordinate system: per-point wave eqs. Use **many custom waves**
(`preset.waves[i] = waveLine()` for i in 0..~20), each a horizontal-ish strand.
For each wave, in its `point_eqs` function:
- Lay the base strand along a line; displace perpendicular by the live sample:
  `a.y = baseY + a.value1 * amp`, marching `a.x` with `a.sample`.
- To get the 3D orbit/perspective and the order↔chaos morph, precompute in the
  main `frame_eqs`: a rotation angle `q1 = time*0.25`, a chaos factor
  `q2 = bass_att` (0=ordered, high=tangle), and a per-wave depth. In point_eqs,
  rotate `(x,y)` by `q1` and add chaos: when `q2` is high, perturb each point with
  a hashed pseudo-random offset scaled by `q2` so strands scatter into the knot;
  when low, strands stay parallel. Fake perspective by scaling amplitude and
  spacing by a depth term so far strands converge.
- Color: set `a.r/g/b` per wave with a `pal()` offset `= time*0.1 + i*0.05` so
  strands carry staggered hues drifting over ~10s.
Set `additivewave = 1` (glow on black), `wave_smoothing ≈ 0.5`,
`decay ≈ 0.95` for the motion trails, black/very-dark `comp` background with a
faint bass-pulsing bokeh wash. Keep lines thin (`wave_dots = 0`, thin width).

---

## Scene B3 — Orbiters emerging (≈38.0s – 40.0s, f_0076–f_0081)

**Overview.** In the final ~2s the Wireframe Net dissolves into the recurring
**Orbiters** motif (the Alchemy cousin of "Dance of the Freaky Circles"). This is
the start of the next scene, caught here in its emergence.

**Frame walk.** f_0076 (37.5s): a single bright GREEN jagged zig-zag waveform line
descends diagonally over a dark purple smeared background (the net has collapsed to
one waveform strand). f_0077 (38.0s): very dark, a faint red/green waveform wisp
upper-left, two small teal node-dots appearing top-right and lower-right — trails
heavy, near-black. f_0078–f_0079 (38.5–39.0s): a strong magenta/purple jagged
waveform line sweeps diagonally across a purple fluid background with heavy
horizontal smear/echo (high feedback). f_0080 (39.5s): a pale jagged waveform line
along the same diagonal, two glowing nodes at its upper-right and far ends.
f_0081 (40.0s): clearest Orbiters frame — ONE long pale-green jagged live-waveform
line runs corner-to-corner (lower-left to upper-right), with a glowing red/orange
ringed node at EACH end (lower-left and upper-right), over a dark
purple/indigo fluid wash with faint ghost-trails of previous waveform positions.

**Elements & geometry.** 2 glowing endpoint nodes (small ringed "comet" dots) +
1 jagged waveform line connecting/trailing them. This is exactly the "Orbiters"
vocabulary: 2 glowing points + trailing jagged waveform line. The line is the live
oscilloscope (dense small jaggedness = real 512-sample waveform, NOT synthetic
sin). The nodes will orbit (here they sit at opposite corners; over the following
seconds they will swing — same pattern as Dance).

**Background / color.** Dark fluid wash, dominant PURPLE/INDIGO with magenta
accents and the waveform line in green or pale white. Heavy frame-feedback: the
smeared horizontal echoes in f_0078–f_0080 indicate strong trails, estimate
`decay ≈ 0.96–0.97` plus some `echo_zoom`/horizontal `dx` drift.

**Motion.** The waveform line and its end-nodes sweep/rotate across the diagonal;
trails ghost behind. Slow orbit. Camera is effectively 2D (flat field with
feedback), unlike B2's 3D.

**Color & hue cycling.** Purple-dominant background with the line cycling
green↔pale↔magenta; consistent with a slow hue drift (~10–15s) between purple and
green/magenta poles.

**Audio-reactivity hypotheses.** Bass → node orbit radius / line amplitude;
mid/treb → the fine waveform jaggedness; trails always on.

**Implementation direction (Butterchurn).** This is the *canonical* `circleWave` +
`waveLine` pattern — clone "Dance of the Freaky Circles" and recolor. Two
`circleWave("qx","qy")` waves for the two glowing end-nodes (small radius, ringed,
`additivewave=1`), positioned via main `frame_eqs` q-vars orbiting between opposite
corners (`q1 = 0.5 + 0.4*cos(time*0.4)`, `q2 = 0.5 + 0.4*sin(time*0.4)` and the
mirror for the second node). One `waveLine()` custom wave marching A→B between the
two node positions, displaced perpendicular by `a.value1` for the jagged live
trace. Background: a dark `comp` shader purple/indigo fluid wash with
`tintComp(purple, green, ~0.07, ...)` slow cycle. Set `decay ≈ 0.96`, small
horizontal `dx` drift and `echo` for the smear trails. Colors muted-but-colored
(soft purple/green), tone-mapped Reinhard so the additive node glows compress to
soft color, per the Alchemy muting rule (B3 IS in the muted family).

---

## Transition timings (summary)

| Time | Frame | Event |
| --- | --- | --- |
| 22.0s | f_0045 | B1 Kaleidoscope X already running (red phase) |
| ~24.5s | f_0050 | B1 brightness peak (lime/yellow phase) |
| 27.5–28.0s | f_0056→f_0057 | **Fast blurred morph** B1 → B2 (not a hard cut) |
| 28.5s | f_0058 | B2 Wireframe Net fully present (ordered sheet) |
| ~32.0s | f_0065 | B2 peak chaos (tangled hairball) |
| ~36s | f_0073 | B2 re-orders to sheet |
| 37.5–38.0s | f_0076→f_0077 | B2 dissolves → B3 Orbiters emerge |
| 40.0s | f_0081 | B3 clear: 2 end-nodes + jagged waveform line |

## Cross-scene implementation notes

- B1 = **shader-driven** (`comp`/`warp`, polar kaleidoscope, `abs()` 4-fold
  mirror, vivid red/green, short decay).
- B2 = **many custom waveLines** (3D orbit + order↔chaos morph gated on bass,
  per-strand staggered hue, additive on black, medium decay/trails).
- B3 = **circleWave x2 + waveLine** (Dance clone, purple/green, heavy feedback
  trails, muted tone-mapped).
- Hue cycles everywhere; periods ~8–12s. B1 vivid; B3 muted; B2 mid-saturation
  multi-hue. All three are time-driven hue with audio-driven geometry.
