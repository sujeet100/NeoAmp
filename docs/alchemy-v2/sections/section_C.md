# Segment C — 0:40–0:58

Frame range f_0081–f_0117 (40.0s–58.0s), 2 fps, 640x360. Time = (NNNN-1)*0.5.

This segment is a continuous metamorphosis through **three distinct visual
regimes** joined by **morph** transitions (no hard cuts), but punctuated by two
abrupt **background color snaps**. The arc is: (A) the dying **Wireframe Net +
Orbiters** on near-black, collapsing into a chaotic **central radiating
starburst**; (B) a snap to a **solid sage-green** background carrying a defined
**lens/"abstract eye" disc** that grows into the ringed **Anemone shell**; (C) a
snap to a **solid blue** background carrying the mature **Anemone Pulsar** —
a pink/cyan radiating fireball with two glowing **Orbiters** trailing jagged
waveform tethers. The defining WMP signatures here are (1) the solid-color
background snaps, (2) the radial "anemone" filament burst that shakes/pulses on
bass, and (3) the reappearance of the two waveform-tethered Orbiters.

---

## Scene C1 — Net collapse → central radiant starburst (40.0s–46.5s, f_0081–f_0094)

**Background.** Near-black with very dark desaturated purple/magenta wash in the
lower-left quadrant. NOT solid — it is animated frame-feedback fluid. Through
f_0081–f_0094 a faint horizontally-banded "rippling water" texture (the WMP
liquid-mirror reflection field) creeps up from the bottom: rows of soft
zig-zag chevrons in muted pink, teal, green, ochre, stacked like reflections on
disturbed water. This banded reflection field is the constant Alchemy substrate
under the dark frames.

**Foreground elements & counts.** At 40.0s (f_0081) the scene is still the
**Orbiters + diagonal waveform** motif from the prior segment: a single bright
**jagged lightning line** (real audio oscilloscope) runs corner-to-corner from
lower-left (~x0.08,y0.95) to upper-right (~x0.95,y0.05), dense small-amplitude
high-frequency jaggies along its whole length. Two ringed **Orbiter** glints sit
at the line's ends (lower-left corner, upper-right corner) — small concentric
ring sprites in orange/red. By f_0082 the waveform line is greener and the
banded reflections intensify.

**The collapse (f_0083–f_0088, 41.0s–43.5s).** The diagonal line motif violently
reorganizes into a **central radial burst**. f_0083: a dense vertical curtain of
fine radiating threads erupts at center with a faint yellow vertical axis line
through it and pink/green hotspots — like a spider-web net seen end-on. f_0084:
becomes a full **starburst** — hundreds of fine filaments radiating from a
central glowing core, colored in a horizontal rainbow gradient (red/orange left,
green/yellow center, with the radial spray fanning outward). f_0085: two small
white **Orbiter dots** appear at upper-left and lower-right; the starburst core
glows orange/green. f_0086: the burst tightens into a clean **snowflake/rosette**
— a radially symmetric flower of ~16–24 spokes around a bright yellow-green core,
with the muted pink/green water-bands flanking left and right. f_0087: the
rosette explodes outward into looser, longer chaotic filaments (a "shattering"
look) with magenta/green chromatic fringing. f_0088: re-tightens to a dense
upward-fanning spray of fine threads over a green/yellow core glow.

**Net + Orbiters return (f_0089–f_0094, 44.0s–46.5s).** The central mass becomes
a tangled **Wireframe Net** — loose loops and tangled thin lines (yellow/green/
blue) churning around a central glow, framed top by a clearer arching mesh
"canopy." The two **Orbiters** are now prominent ringed sprites (concentric
rings, blue/teal core with orange rim) parked at upper-left and lower-right
corners (f_0090–f_0093), connected through the tangle by faint jagged tethers.
The whole mass sits on the rising rainbow water-band reflections. f_0094 is the
**morph threshold**: the net dissolves into soft vertical pink/green smears and a
thin white zig-zag waveform stub at top — the field is washing out to prepare the
green snap.

**Geometry / symmetry.** Radial symmetry about screen center during the rosette
frames (f_0086), breaking to chaotic during burst/net frames. The Orbiters break
symmetry as a point-pair on the BL↔TR diagonal.

**Motion.** Fast, agitated. The radial filaments pulse outward then collapse
inward on a sub-second beat — classic bass-driven "breathing." Strong
frame-feedback: long horizontal ghost-trails on the water bands (decay ~0.92,
read as motion blur smearing everything horizontally). Slight overall churn/
rotation of the net (<5°/frame, indeterminate direction). The Orbiters jitter
in place rather than orbit cleanly here.

**Camera/perspective.** Flat 2D. No depth cue except the feedback trails.

**Color & cycling.** Full muted rainbow — red/orange/yellow/green dominate the
core, magenta/teal in the fringes and bands. Saturation is LOW/dusty per the
Alchemy mandate. No clean hue-cycle period readable in 6.5s; treat as
broadband rainbow tint driven by the spectrum rather than a time sweep.

**Audio-reactivity hypotheses.** Filament count/length and core brightness track
**bass** (burst on transient, collapse on decay). The jagged waveform line and
net tangle are the **live time-domain waveform** mapped radially. Orbiter ring
brightness tracks **treble**.

**Implementation (Butterchurn).** Centered polar coordinate system. Drive the
radial spray with a **custom circular wave** (`circleWave`) whose per-point radius
is `0.15 + 0.25*bass_att + 0.3*abs(a.value1)` so each of 512 samples becomes a
filament — real-waveform displacement gives the dense jaggedness for free
(per CLAUDE.md "zigzag = real audio waveform"). Add a second counter-rotating
`circleWave` for the net tangle. Two `circleWave`/sprite Orbiters parked on the
diagonal, brightness = `treb_att`. Background: `decay ~0.92`, `dx`-biased echo
to smear horizontally for the water bands; warp shader adding stacked
`sin(uv.y*N + time)` chevron rows in muted pink/teal. comp shader does a muted
cosine-palette tint of luminance and a Reinhard tone-map `c/(c+0.6)` to keep
highlights soft, not white.

---

## Scene C2 — GREEN SNAP: lens/abstract-eye disc → anemone shell (47.0s–52.0s, f_0095–f_0104)

**BACKGROUND SNAP (f_0095, 47.0s).** Hard transition: the dark field is replaced
by a **solid, flat sage/olive-green** fill (≈ RGB 120,140,100) covering the whole
frame. This is one of the WMP "snap to solid color" moments. A single faint thin
diagonal line (a stray waveform tether, nearly invisible) crosses the green from
lower-left to upper-right. The green slowly warms toward **olive/khaki** by
f_0103 (≈ 150,150,70) — a slow background hue drift over ~5s, NOT a second snap.

**Foreground — the lens/"abstract eye" (f_0095–f_0098).** Centered on screen is a
single **flattened ellipse disc** (a 3D oblate spheroid seen near-edge-on, wider
than tall, ~0.35w x 0.18h). f_0095: the disc is a soft iridescent lens — a
horizontal oval with a vertical **green zig-zag waveform** running down its middle
and faint pink/purple/green chromatic banding inside (looks like an oil-slick
bubble). f_0096: it sharpens into a clear **"abstract eye"**: a green fibrous
**iris ring** of fine radial spokes surrounding a bright yellow-green elliptical
**pupil/core**, with a dark crescent (the "eyelid" shadow) along the top inner
edge. f_0097: the eye narrows (pupil shrinks, ring thickens) — it visibly
**dilates/contracts on the beat**. f_0098: the ring grows a dense outer halo of
fine blue/teal **fibrous filaments** (the start of the anemone shell), core still
yellow-green.

**Anemone shell forms (f_0099–f_0104, 49.0s–52.0s).** f_0099: a full
**spherical wireframe shell** — a translucent ball of crosshatched teal/blue
mesh enclosing a glowing yellow-green core that now shows a 3D conical/funnel
interior (radial spokes converging to a deep center point → real perspective
depth). f_0100: chaotic — the shell sprouts long straight **spike rays** shooting
out past its rim (white/red radial spears), core flashes magenta+yellow.
f_0101: settles to a calmer iridescent lens again with red/orange core and a
soft teal feathered rim, on now-warmer green. f_0102: the classic **Anemone
shell** — an oblate ball wrapped in a regular helical lattice of blue lines
(top hemisphere) and yellow/orange lines (bottom hemisphere) like longitude
lines on a globe, with a pink/magenta core glow and a few long spike rays. f_0103:
the lattice becomes a tight regular **green spiral cage** (concentric woven
ellipses) over an orange/red core, with two bright crossing diagonal waveform
lines (one green, one cream) lancing through — a very structured frame. f_0104:
the cage erupts into a dense **dark-cored urchin** — radial green/teal spikes
bristling outward from a dark center with an orange hotspot, over olive bg; a
white waveform line crosses TL→BR. This is the **morph threshold** to the blue
snap.

**Geometry / symmetry.** Strong **bilateral + radial** symmetry about the disc
center; the ellipse is consistently horizontal (camera looking slightly down on
an oblate sphere). Spike rays radiate isotropically.

**Motion.** The disc **pulses (dilate/contract) on the beat** and slowly
**rotates** about its vertical axis — the lattice longitude-lines drift sideways
across the face (≈ slow spin, a few deg/frame, consistent direction). Spike rays
shoot out on bass transients (f_0100, f_0104) then retract. Mild horizontal
shake on heavy bass. Feedback is LIGHTER here than C1 — the solid bg means trails
are subtle (decay ~0.85), so the disc reads crisp, not smeared. (Matches the
"crisp not fuzzy" note in the Alchemy reference memory.)

**Camera/perspective.** **3D** — genuine perspective: the oblate ellipse,
converging funnel interior (f_0099/f_0102), and longitude-line lattice all read
as a tilted sphere. This is the most 3D part of the whole segment.

**Color.** Background solid green→olive (slow drift). Disc is iridescent: green/
teal lattice + yellow-green core early, shifting to magenta/red/orange core by
f_0102–f_0104. Muted, dusty — never neon. The complementary green-bg / red-core
contrast is the signature look here.

**Audio-reactivity hypotheses.** Pupil/core radius = inverse of bass (dilates on
hit). Spike-ray length = bass transient. Lattice spin rate ≈ constant (or mid).
Filament shell density = treble.

**Implementation (Butterchurn).** Centered, **aspect-squashed** coordinates to
make the oblate ellipse: in warp/comp scale `d.y *= 1.9` before computing radius
so circles render as horizontal ellipses (intentional, opposite of the usual
aspect-correct). Background: `frame_eqs` set a solid clear color that hue-drifts
green→olive via `0.5+0.5*sin(time*0.06)`; keep `decay ~0.85`. The lattice =
a `circleWave` drawn at several radii with `point_eqs` adding a `sin(a.sample*N +
time*spin)` longitude offset; color top-half teal, bottom-half gold by
`a.y`. The core funnel = a comp-shader radial gradient with `pr` (radius) raised
to a power for the converging-tunnel falloff, tinted red/orange. Spike rays =
a sparse `waveLine`/wave with high `a.value1` gain firing on `bass_att`. Pulse
the whole disc scale with `1.0 - 0.15*bass_att`.

---

## Scene C3 — BLUE SNAP: Anemone Pulsar + Orbiters return (52.0s–58.0s, f_0105–f_0117)

**BACKGROUND SNAP (f_0105, 52.0s).** Hard transition to a **solid steel/cobalt
blue** fill (≈ RGB 45,80,130). A faint thin diagonal waveform tether crosses TL→
BR. The blue is near-flat but gains soft radial vignette glow around the central
object as it brightens (f_0106 lighter cobalt). This is the "bright blue/cyan
Anemone Pulsar background" the brief predicted — confirmed at 52.0s.

**Foreground evolution.**
- f_0105–f_0106: the disc is still the **rotating oblate Anemone shell** from C2
  but now blue-on-blue: concentric radial spokes in blue/teal/yellow forming a
  flattened ball, bright white-yellow core, long thin diagonal waveform line
  through it. The shell **spins** (f_0106 shows the spokes swept into a pinwheel).
- f_0107 (53.0s): tightens to a small dense blue **pinwheel disc** with a tiny
  pink/red core dot and a dark pupil — a compact "eye" on flat blue.
- f_0108 (53.5s): **explosion frame** — the disc detonates into a horizontal
  spray of fine white/blue filaments with a magenta core flash; the background
  reveals its **rippled water bands** again (faint zig-zag chevron rows top and
  bottom, in blue). Transitional chaos.
- f_0109–f_0110 (54.0s–54.5s): the mature **Anemone Pulsar** forms — a central
  radiating **fireball of fine filaments** (white/cyan spray with a magenta-pink
  core) and, critically, the **two Orbiters reappear**: glowing yellow-green
  ringed sprites at upper-right and lower-left, each trailing a **jagged
  red/orange waveform tether** back to the core. The Orbiters now clearly **orbit**
  the central pulsar on the BL↔TR diagonal.
- f_0111–f_0114 (55.0s–56.5s): the pulsar matures into a big soft **pink/magenta
  feathered burst** ("dandelion/sea-anemone" — thousands of fine pink filaments
  radiating from a teal/white core) on cobalt blue, with strong motion-blur halo.
  Orbiters present at the diagonal corners (f_0112 has them at UR + LL). f_0114
  adds yellow-green into the core and the Orbiters drift; the burst pulses large
  on the beat.
- f_0115 (57.0s): a striking **net cage frame** — a large faint hexagonal/circular
  **wireframe net** (thin white lattice ring) expands around the green/pink core
  pulsar, Orbiters at UR + LL. The net is the expanding shockwave outline.
- f_0116–f_0117 (57.5s–58.0s): the net contracts, the two **Orbiters** become the
  dominant elements — bright concentric ringed green/pink sprites at UR and LL,
  joined by a **doubled jagged waveform tether** (red + orange parallel lightning
  lines) stretched diagonally across the now-calmer blue/teal field. f_0117 is
  essentially the pure **Orbiters-joined-by-waveform** signature (the Alchemy
  equivalent of "Dance of the Freaky Circles") — two orbs at opposite diagonal
  corners with the live waveform strung between them over a softly churning
  blue background. This is the stable end-state of the segment.

**Geometry / symmetry.** Radial symmetry of the central pulsar; the Orbiter pair
+ tether enforce a strong **BL↔TR diagonal axis** throughout C3.

**Motion.** The pulsar **breathes** (expand on bass, contract on decay) and the
filament spray shimmers (treble). The two Orbiters **orbit** the center slowly
(swapping between UR/LL ends over the segment), and the connecting waveform tether
**whips/oscillates** with the live audio — dense jaggies = real samples. Heavy
horizontal motion-blur on the burst (decay ~0.9). Mild full-frame shake on bass
transients (f_0108 detonation).

**Camera/perspective.** Mostly **2D** for the pulsar (flat radial burst), with the
Orbiters reading as flat sprites; less 3D than C2.

**Color & cycling.** Background solid blue (fixed through C3, no further snap).
Core/burst cycles **magenta-pink ↔ cyan-white ↔ yellow-green** over the ~6s — a
slow palette drift, period ≳10s (don't lock from this window alone). Orbiters are
yellow-green with pink/orange rims; tethers red/orange. Muted but more saturated
than C2 (the pink fireball is genuinely vivid against blue). Keep dusty per the
Alchemy mandate but allow the pink core to glow.

**Audio-reactivity hypotheses.** Pulsar radius & filament length = `bass_att`.
Filament shimmer/count = `treb`. Orbiter orbital position = slow `time` phase
(not audio). Tether geometry = live waveform (`a.value1/value2`). Net-cage
expansion (f_0115) = a bass-transient shockwave ring.

**Implementation (Butterchurn).** This is essentially the **Dance pattern**
re-skinned: centered polar system. Central pulsar = a `circleWave` with
`r = 0.05 + 0.3*bass_att + 0.4*abs(a.value1)` over 512 points → fine radial
filaments; additive (`additivewave=1`), color pink→cyan via slow time mix. Two
**Orbiters** = two `circleWave` ring sprites whose centers follow
`cx = 0.5 + 0.4*cos(time*0.3)`, `cy = 0.5 + 0.4*sin(time*0.3)` (opposite phase
for the second) → they trace the BL↔TR diagonal. The **tether** = a `waveLine`
marching from Orbiter A to Orbiter B with perpendicular displacement
`= 0.15*a.value1` (real waveform, doubled by drawing two offset lines for the
red+orange pair). Background: `frame_eqs` solid blue clear color, `decay ~0.9`,
`dx` echo for horizontal smear; faint warp-shader chevron water-bands top/bottom
in muted blue. Net-cage shockwave = a thin extra `circleWave` ring whose radius
spikes on `bass_att` then decays. comp shader: muted cosine palette tint +
Reinhard tone-map so the bright core stays colored-soft, not blown white.

---

## Transition summary (timestamps)

| Time | Frame | Event | Type |
| --- | --- | --- | --- |
| 40.0s | f_0081 | Orbiters + diagonal waveform (carryover) | — |
| 41.0–43.5s | f_0083–88 | Net collapses to central radial starburst/rosette | morph |
| 44.0–46.5s | f_0089–94 | Wireframe net + corner Orbiters; washes out | morph |
| **47.0s** | **f_0095** | **SNAP to solid sage-green; lens/abstract-eye disc** | **bg snap** |
| 48.0–50.0s | f_0096–99 | Eye dilates → spherical anemone shell (3D) | morph |
| 50.5–52.0s | f_0102–04 | Helical-lattice globe → urchin burst | morph |
| **52.0s** | **f_0105** | **SNAP to solid cobalt-blue; spinning shell** | **bg snap** |
| 53.5s | f_0108 | Detonation/explosion transition | morph |
| 54.0s | f_0109 | **Anemone Pulsar + 2 Orbiters w/ waveform tethers emerge** | morph |
| 55.0–57.0s | f_0111–15 | Mature pink pulsar; net-cage shockwave (f_0115) | — |
| 57.5–58.0s | f_0116–17 | Stable Orbiters-joined-by-waveform end-state | — |

Two true background **snaps** (green @47.0s, blue @52.0s); everything else is a
continuous feedback morph. The green segment is the most 3D (oblate-sphere
"abstract eye"); the blue segment ends on the canonical two-Orbiters-+-live-
waveform signature.
