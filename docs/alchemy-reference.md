# Alchemy: Random — reference analysis (for the Butterchurn preset)

Synthesized from frame-by-frame study of two reference captures
(`Alchemy Random Media Player 480p.mp4` 228s, `YouTube 1080p 60fps Download.mp4`
186s), via per-shot filmstrips (10 frames over ~2s each). Use this to drive
`P["Alchemy Random"]` in `wmp-presets.js`. Keep it honest: we match *character*
(motif, motion, color, camera, symmetry), not pixels.

## Global behaviors
- **It's a crossfading state machine** through MANY distinct scene "looks"
  (~8–14s each), not one scene. Variety is the whole point.
- **Slow hue cycle** over tens of seconds (e.g. green↔magenta, teal→magenta→
  purple, gold↔violet). Confirmed by mid-shot color sweeps.
- **Two color worlds, alternating:**
  - **Saturated neon-on-BLACK** — the green filament scenes (dandelion, starburst,
    spiderweb, two-orb dark free-space). Bright vivid strokes on near-black.
  - **Pastel washes** — pink/magenta/lilac/amber, light high-key backgrounds with
    multiple colors *bleeding* together (NOT flat, NOT black).
  → Saturation/darkness must vary PER SCENE. Don't mute everything.
- **Geometry is real audio-waveform** (taut/jagged oscilloscope strands), never
  procedural-noise lines. (See CLAUDE.md "zigzag = real waveform".)
- **Motion** ranges slow→medium-fast; whippy on the drawn elements, slow on hue.
- **Camera varies per scene** (see each entry): perspective-tunnel push, flat
  head-on, lateral shear/tilt, rotate+zoom feedback swirl.
- **Line thickness varies**: the connecting waveform / lightning bolt is THICK and
  glowing; the radial bursts are MANY FINE rays (fill via density, not width).

## The signature ("money shot") — highest-priority target
Two small **ringed orbs** (circular oscilloscope waveforms, ~10–15% frame) that
**orbit between opposite corners/center**, joined by a **thick jagged waveform
line** (perpendicular displacement = live sample, like Dance's `waveLine`), with a
**central additive bloom/rosette** that spikes on bass. Dark free-space bg. Warm
gold ↔ cool violet via slow hue cycle. This is "Dance of the Freaky Circles" in
Alchemy colors. Often the dandelion burst surrounds the two core orbs (170s).

## Scene catalog (motif · colors · camera · symmetry · thickness)
0. **Dandelion / urchin burst** — centered radial spray of hundreds of FINE rays
   from a core; rays = waveform length (jitter/extend on bass); breathes + slow
   rotate. Green-on-black (neon). Radial symmetry. Camera: gentle zoom/pulse.
1. **Two-orb + waveform (HERO)** — see signature above. Off-center/spread. Dark.
   Thick connecting line; orb rings. Camera: minimal, motion is in the elements.
2. **Perspective-tunnel starburst** — many radial rays rushing OUTWARD, warp-speed;
   develops a swirl; hue cross-fades (green→magenta). Camera: `zoom`>1 + slow `rot`.
3. **Kaleidoscope lens-bands / eye-lattice** — horizontal mirror-tiled "eyes", each
   with a small spike-burst core; bands scroll/breathe. SATURATED green/red/teal,
   multi-color bleed, filled edge-to-edge. Symmetry: 4-fold mirror + vertical tile.
4. **Hexagon / honeycomb wireframe mesh** — vertically-stacked twin hexagons, faint
   triangular grid, jagged waveform thread through center. CALM, desaturated steel/
   teal-blue. Dual-axis (quad) mirror. Camera: flat head-on, no zoom. Slow breathe.
5. **Smoke / lava plumes** — soft volumetric fbm clouds, central lightning-bolt
   waveform; magenta↔green bleed (complementary). Asymmetric/free. Camera: mild
   zoom-in bloom. High decay (~0.97).
6. **Diagonal comet streaks** — 1–2 elongated glowing bars on a diagonal, cyan core
   + magenta halo, bright orb bulb-tips that migrate/pulse. Dark maroon bg. Loose
   180° rotational. Camera: sweep/rotate.
7. **Rainbow spiderweb starburst** — busiest: center-anchored radial fine-line burst
   + 4–6 rotating colored arm-streaks (full rainbow at once) on BLACK. Radial
   N-fold (~6–12). Camera: mild zoom + swirl.
8. **Vertical-comb / wallpaper tiling** — venetian-blind vertical green stripes,
   faint central magenta rosette; shears into perspective wedges (tile/tunnel
   transition). Muted olive green. x-tiling + diagonal fold. Camera: perspective shear.
9. **Crescent / comma swirl** — single sweeping rotating arc from feedback echoes
   (high `decay` + `rot` + slight `zoom`); muted teal, one saturated magenta orb at
   pivot. Rotational. Camera: rotate + slight zoom (feedback smear).
10. **Landscape strata** — warm amber "tree/bush" clump over rolling horizontal
    color bands; character is the SLOW HUE CYCLE (teal→magenta→purple), minimal
    geometry motion. Low symmetry. Camera: gentle drift.

## Mapping to our preset (current → target)
We have 4 custom-wave slots (orbs ×2, connecting line, central motif) + the comp
shader for backgrounds + warp for camera/trails. Strategy:
- **Backgrounds (comp):** implement scene types 2/3/4/5/8/10 as shader looks
  (tunnel, lens-bands, hex mesh, smoke, vertical-comb, strata) + the multi-color
  bleed wash; pick per scene with the scene clock. Vary **saturation/darkness per
  scene** (neon-on-black vs pastel).
- **Foreground (waves):** hero two-orb+waveform+bloom; dandelion/starburst (many
  fine rays); spiral/rose/lissajous/star-web; comet streaks; crescent swirl.
- **Camera (warp + comp zoom):** per-scene feedback `zoom`/`rot`/shear + per-scene
  geometry zoom, matched to the catalog above.
- Keep circles SPARSE (mostly the hero scene).

## Honest fidelity ceiling
4 wave slots + 2 shaders can't render all 11 motifs simultaneously; we cycle a
representative subset and lean on the comp shader for background variety. Match the
feel, iterate from screenshots.
