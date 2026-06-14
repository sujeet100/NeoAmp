# Implementation Analysis — Segment 2 (0:13–0:26)

Source: OUR Butterchurn "Alchemy" preset, frames `g_0027`–`g_0053` (2fps, 640×360),
t = 13.0s … 26.0s. Read every frame. Compared against the Alchemy v2 reference
blueprint (README.md / reconciliation.md) and reference keyframes s03 (Orbiters on
black), s09 (Anemone Pulsar blue), s10 (Swirling Vortex), s15 (3D ribbon orbiters).

---

## What's on screen

This 13s window is **two motif passages with a continuous morph between them**, all
over a near-black, low-saturation feedback bed:

1. **0:13–0:17 (g_0027–g_0031) — "swirling net / vortex" build.** A large off-center
   swirl. Twin ribbon families: a **magenta/pink feathery band** sweeping diagonally
   through center, and a **green concentric arc swarm** filling the right third (and
   wrapping to the lower-left). The green strands are fine, nested, near-circular arcs
   — a vortex/funnel net seen at an angle. Background is a dark teal-to-charcoal
   radial wash with a faint warmer (olive/amber) glow blob slightly right-of-center.
   A thin amber/olive vignette ring frames the whole pane (a hard-edged border arc,
   top and right). Motion: slow clockwise swirl; feedback smears strands tangentially.

2. **0:17–0:20 (g_0032–g_0040) — hue-drifting "feather brush" + arc swarm.** The
   central band reorganizes into a **purple/lavender feathery brush** (looks like a
   bird's-wing or comet of dense short filaments) anchored lower-left, sweeping up and
   to the right. The arc swarm migrates: green (g_0032–35) → **yellow/olive**
   (g_0037–39) → the brush itself shifts purple→**blue** (g_0039–40). By g_0040 the
   scene is nearly empty: a dim blue feather lower-left, faint yellow arcs lower-right,
   large dark center. Clear **slow global hue cycling** (magenta+green → purple+yellow
   → blue+yellow). The feathering is dense, fine, and jagged — consistent with
   real-audio `waveLine`/`circleWave` displacement, not synthetic.

3. **0:20–0:21.5 (g_0041–g_0042) — near-empty trough.** Mostly black with a dim blue
   jagged band crossing upper-left and faint amber arc fragments at the edges. A
   transition lull.

4. **0:21.5–0:26 (g_0043–g_0053) — the dominant "Anemone Eye" donut.** A large
   **furry radial ring with a dark central eye (pupil)** snaps in center-frame. It is
   built from hundreds of fine radial spokes with **jagged live-waveform tips** (the
   outer edge is a dense zig-zag corona — clearly `a.value1`-driven, the genuinely
   "WMP" geometry). It pulses in radius (smaller/tighter g_0043–44, larger and more
   ragged g_0045–47, then a clean thick ring g_0049–53). Color cycles **teal/cyan
   (g_0043–49) → green→yellow-green (g_0050–53)**, with a soft white/cream highlight
   ring at the inner edge. A faint magenta/purple smear and small ghost arcs drift in
   the background (right side, g_0046–053) — feedback remnants of the earlier swirl.
   The eye is roughly centered, slightly left-of-center, and very slightly oblate
   (elliptical) in g_0048–050. Background returns to near-pure black.

**Cross-cutting observations**
- **Feedback / motion blur:** moderate-to-strong, **radial/tangential** (good for the
  vortex and anemone), giving soft halos around the donut and tangential smears on the
  net. Decay looks ~0.93–0.95. No harsh white-out — tone-mapping is holding.
- **Color discipline:** mostly **muted and dusty** (dark teal bg, soft teal/green/
  purple geometry) — on-spec for the muted Alchemy rule. The inner-edge highlight on
  the donut occasionally pushes toward bright cream/white but does **not** blow out.
- **Waveform geometry:** genuinely jagged, dense, audio-driven (the anemone corona and
  the feather brushes both read as real `value1` displacement). This is a strength.
- **Symmetry:** the anemone is radially symmetric (good); the vortex is asymmetric/
  off-center (acceptable — reference vortices are off-center too).
- **Audio-reactivity feel:** the donut radius pulse and corona raggedness read as
  bass/treble coupled. Reasonable.

---

## Gaps vs reference

### 1. The Orbiters motif is ENTIRELY ABSENT (biggest gap)
- **Impl:** Across all 27 frames there are **no orbs at all** — no glowing core orbs,
  no thin white "Saturn" rings, no pair of nodes, no dotted receding trail, and no
  single waveform line *joining two orbs*. The closest things are diffuse feather
  brushes and the anemone donut. The donut is a *single* centered ring, not two
  orbiting bodies.
- **Reference:** This exact window in the reference clip (and the s03 keyframe) is the
  **cleanest Orbiters showcase**: two glowing yellow-green core orbs, each wrapped in a
  thin white ellipse ring, on opposing elliptical orbits, dragging a **stroboscopic
  dotted trail of smaller rings** that recedes toward a **right-of-center vanishing
  point**, with a green wireframe net fanning out and **one live-waveform line joining
  the two orbs** (the WMP signature). The task brief explicitly expects this here.
- **Fix (Butterchurn):** Add the Orbiters layer (reuse the `Dance of the Freaky
  Circles` machinery). Two `circleWave` orbs whose centers walk in `frame_eqs` on
  opposing ellipses (180° out of phase), `radius ∝ 0.04+0.03*bass_att`; give each a
  concentric **thin white ring** wave (small fixed `wave_a`, `wave_thick=0` look) for
  the Saturn ring. Add **1 `waveLine` tether** between the two orb centers with
  perpendicular displacement `a.value1*amp*(0.4+0.6*mid_att)`. Produce the **dotted
  receding trail** from `decay≈0.92` + a small `dx<0` and `zoom>1` smear that samples
  the constant-velocity orb each frame (the trail dots are past orb positions left by
  feedback). The donut/anemone can stay as a *separate later scene* but the orbiters
  must appear in this 13–17s region.

### 2. No 3D corridor / asymmetric vanishing point
- **Impl:** The scene is **flat/radial**. The vortex swirl (g_0027–33) is a 2D spiral;
  the anemone is a centered 2D donut. There is no sense of a receding corridor or
  depth, and no off-center vanishing point.
- **Reference:** s03 has a clear **3D right-of-center corridor**: the net fans out and
  the orbiter trail recedes to a vanishing point right-of-center, camera low-left. The
  dotted trail shrinks with distance.
- **Fix:** Bake an **asymmetric perspective divide** into the `point_eqs` of the net
  `waveLine`s and the orbiter trail: project `(x,y)` toward a vanishing point at
  ~`(0.62, 0.45)` with a `1/(1+z*k)` divide so trail rings shrink as they recede. Bias
  feedback `dx` toward that point rather than purely radial.

### 3. Anemone arrives ~too early and over-dominates; lacks the "abstract-eye dilation" + bg-snap staging
- **Impl:** The furry-eye donut appears at ~21.5s and dominates 21.5–26s (and likely
  beyond). It is good geometry but it is doing the work that the reference splits
  across distinct staged scenes. There is **no background color SNAP** (sage-green,
  then cobalt-blue) — bg stays black/dark teal throughout.
- **Reference:** In the reference timeline the anemone/eye era is gated by **discrete
  background snaps** (sage-green @0:47, cobalt-blue @0:52) and the eye **dilates** from
  a 3D oblate lens into the anemone. The s09 Anemone Pulsar sits on a **solid cobalt-
  blue** field with two **tethered orbiters** flanking it.
- **Fix:** This is a framework, so scene *order* is allowed — but (a) add the
  **tethered-orbiter pair flanking the anemone** (s09: the two green orbs NE and SW of
  the pink burst, joined through the center), and (b) implement at least one **bg
  color snap** as a discrete `q`-var event so the anemone reads as Alchemy rather than
  a generic black-bg ring.

### 4. Anemone color is teal/green-only; reference pulsar is pink/magenta with a colored bg
- **Impl:** Donut cycles teal→green→yellow-green on black. Pleasant and muted, but a
  narrow band of the wheel; the center eye is just black (empty), not a dark *colored*
  pupil.
- **Reference (s09):** the Anemone Pulsar is a **dusty pink/magenta furry burst** on a
  **blue-green field**, with a dark center. The complementary pink-on-blue contrast is
  the signature. (Our teal-on-black is more like the s08 green-eye anemone, which is
  valid — but we never reach the pink-pulsar variant in this window.)
- **Fix:** Let the anemone hue cycle wider (include the **dusty pink/magenta** phase),
  and pair it with a **blue/sage bg** (see #3) for the pulsar look. Keep it muted/
  tone-mapped — pink should be dusty rose, not neon.

### 5. The "net" reads as a soft arc swarm, not a structured wireframe funnel
- **Impl:** The green strands (g_0027–33) are fine nested **arcs/rings** — pretty, but
  they don't read as a *wireframe net* of straight crisscrossing segments, nor as the
  "two cones joined at wide bases" funnel, nor do they morph ordered↔tangle on bass.
- **Reference (s03, s06):** the net is **straight thin additive line-segments** fanning
  from the orbiters to the vanishing point, forming a clear mesh/funnel that toggles
  between organized and chaotic on bass hits.
- **Fix:** Render the net as **many straight `waveLine`s** (parametric funnel
  `(cosθ,sinθ)` with perspective divide) rather than concentric arcs; gate an
  `a.value`-driven jitter `*mid_att` to morph ordered→tangle on bass. Keep them thin,
  low-alpha, additive.

### 6. Persistent amber/olive vignette border looks like a UI/clamp artifact
- **Impl:** A hard-edged amber arc hugs the top and right pane edges in nearly every
  frame (g_0027–042 esp.). It reads as a feedback-clamp/edge artifact or an
  out-of-bounds wave, not an intentional element.
- **Reference:** No such framing border; backgrounds are full-bleed black or solid
  color to the edges.
- **Fix:** Find the wave/shader producing the edge ring (likely a `circleWave` with
  radius >0.5 clipping at the frame, or a `comp` vignette term wrapping). Clamp wave
  radius, or set `wrap=0` and darken the comp toward edges so nothing rings the border.

### 7. Central "warm glow blob" bg is muddy and undirected
- **Impl:** g_0027–040 show a soft olive/amber radial glow blob slightly right-of-
  center. It's low-contrast and reads as feedback mud rather than a deliberate light
  source.
- **Reference:** backgrounds are either pure black (orbiter scenes) or a clean
  graded/solid field; no muddy central haze.
- **Fix:** Increase `darken_center` slightly and lower mid-tone bg gain, or push decay
  down a touch in the net passage so old frames don't accumulate into central haze.
  Reserve any glow for an intentional bloom on the orbs.

### 8. No visible orbiter "Saturn rings" anywhere
- **Impl:** Even the anemone has no thin elliptical ring; nothing in the segment shows
  the crisp thin white ellipse that wraps each reference orb.
- **Reference (s03):** each orb has a distinct thin white "Saturn" ring; the trail is a
  chain of these rings shrinking into the distance.
- **Fix:** Add a dedicated thin-ring `circleWave` (low alpha, near-white, `wave_thick`
  off, radius slightly larger than the orb core) locked to each orb center.

### 9. Donut occasionally pushes the inner highlight toward white
- **Impl:** g_0049–053 inner-edge highlight gets bright cream; not blown, but close.
- **Reference / muting rule:** keep highlights soft/dusty via Reinhard tone-map.
- **Fix:** Lower the additive gain on the anemone inner ring or strengthen the comp
  Reinhard `c/(c+k)` constant `k` so the brightest ring compresses to soft cream, not
  near-white.

### 10. Eye is slightly oblate/off-center without a depth reason
- **Impl:** g_0048–050 the pupil is a tilted ellipse, left-of-center, with no
  accompanying perspective cue — reads as warp wobble rather than intent.
- **Reference:** the s09 anemone is round and centered; the s09 "abstract eye" is
  oblate *because* it's a 3D lens at an angle (with matching perspective).
- **Fix:** Either center+round the anemone (set `cx/cy` to 0.5, reduce per-frame `cx`
  wobble), or commit to the 3D-lens read by adding the matching perspective/tilt so the
  oblateness is motivated.

### Summary of severity
- **Critical:** #1 (Orbiters motif missing — the defining WMP signature for this exact
  window), #2 (no 3D corridor/vanishing point), #5 (net is arcs not a wireframe funnel).
- **Important:** #3 (no bg snap / tethered orbiters around anemone), #6 (border
  artifact), #4 (anemone color/bg pairing).
- **Polish:** #7, #8, #9, #10.

**What's already good (keep):** real audio-driven jagged geometry (anemone corona,
feather brushes), muted/dusty color discipline, slow audio-ish hue cycling, radial
feedback halos, no white-out. The anemone-eye motif itself is a faithful Motif-C
implementation — the problem is the **Orbiters (Motif A) never appears** in a window
where it should dominate.
