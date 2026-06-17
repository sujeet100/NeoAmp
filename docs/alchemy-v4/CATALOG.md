I have everything I need. The kit inventory is complete and confirmed. Now I'll produce the exhaustive catalog and wiring plan.

# ALCHEMY V4 — COMPLETE CONTENT CATALOG & WIRING PLAN

Sources reconciled: (A) 11 per-segment 720p reads, (B) the 186s macro arc (L1–L20), (C) the 228s original-video background catalog (25 bg variants). Nothing is collapsed. Kit factories are confirmed present in `/Users/sujitk/projects/personal/ytmusic-wmp-visualizer/presets/kit.js` (line numbers cited). New factories needed are flagged `[NEW]`.

---

## 1. MOTIF CATALOG — foreground geometry (every motif × every variation)

Numbered M-series. Format: **#. Name — geometry — kit factory.**

### ANEMONE / RADIAL-BURST / URCHIN / DANDELION family (the dominant motif; A:t50,65,140,170; B:L4,L6,L12,L13,L19; the "newburst" folder)
1. **Anemone — sparse** — ~40–60 fine straight spokes from a core orb, gaps between spokes — `alcAnemone(spikes, colorize)` (kit:1193), low `spikes`.
2. **Anemone — dense** — 80–150 hair-fine spokes, near-solid rim — `alcAnemone`, high `spikes`.
3. **Anemone — feathery/dandelion** — 300+ soft wavy filament hairs, fuzzy 3D puffball, frizzed tips — `alcAnemone` with high spike count + waveform-driven tip frizz (drive displacement off `a.value1`); fronds = `alcRadialBurst({feather:high})` (kit:970).
4. **Anemone — folded (quad-mirror)** — anemone arms mirrored into a 4-fold butterfly — `alcAnemone` under `alcCamera('kaleido')`/`ALC_KALEIDO_GLSL` warp (kit:171/388).
5. **Sea-urchin (sharp needle disc)** — 60–100 uniform straight needles, near-circular rim, faint vortex sweep — `alcRadialBurst({straight:1, sweep:small})`.
6. **Sea-urchin — dark-center hole/pupil** — same with a black/red bean-shaped void hub — `alcRadialBurst` + `darken_center` baseVal (or central void in the emitter).
7. **Urchin — elliptical/perspective-squashed disc** (~2:1 wide oval, "iris" look) — `alcRadialBurst` with `aspectY≈0.5` squash + perspective tilt.
8. **Spider/fountain burst (frizzy explosion)** — dense magenta+green chaotic spray fanning upward off-center (A:t95 frames 22–24) — `alcRadialBurst({chaos:high, anchor:offcenter})`.
9. **Fur fronds / sprouting urchin from base** (B:L4, A:t26) — fronds sprouting from low-center, not full radial — `alcRadialBurst({arc:bottom-half}}` / `alcAnemone` half-sweep.
10. **Filament-flower / central rosette** — small frizzy magenta/green tuft at a crossing/center, bass-spiked nucleus — `alcSpindle(colorize)` (kit:1300, the small frizzy rosette form) or `alcRadialBurst` small.
11. **Iris/eye spoke-disc with swirl shear** (A:t50) — spoke disc with logarithmic-spiral pinwheel twist, morphing bright core — `alcRadialBurst` + `alcCamVortex` shear (kit:443) + iris core via `alcOrbFeathery`.
12. **Anemone with morphing bright iris core** — orange→magenta→cyan→peach filled nucleus inside the burst — `alcAnemone` + center `alcOrbFeathery(cx,cy)` (kit:1555).

### STAR / N-GON / MANDALA family (A:t80,95,155; B:L8,L10)
13. **Spiky star-polygon (10/11-pt)** — sharp concave star outline, crisp bright edges, double/echoed outline — `alcStarWaves(tris, hueOff)` (kit:622) or `alcNgon({points, concavity:deep})` (kit:673).
14. **Star → frizz transition** — star feathering into a feathery urchin over time — `alcStarWaves` blending into `alcAnemone` (cross-emit on a morph param).
15. **Radial-burst star (spirograph, 12–18 sharp rays)** — many-pointed cyan/white star crossing a bright center — `alcStarWaves(tris=12..18)`.
16. **N-gon wireframe outline (hex/polygon)** — faint single polygon outline over a tile — `alcNgon(opts)` (kit:673).
17. **N-gon stack (nested polygons, mandala 4/6/8-fold)** — concentric pointed-polygon mandala — `alcNgonStack(aspectX, specs, perWave)` (kit:753) with `ALC_MANDALA_SPECS` (kit:739).
18. **Triangle mandala (kaleidoscopic ring)** — folded triangle set around center — `alcTriMandala(count, colorize)` (kit:1243).
19. **Concentric wire-rings / Lissajous ring-mandala** (B:L9) — thin overlapping circles/Lissajous loops, bilateral+concentric — `alcMeshRings(nRings, hueOff)` (kit:1152) as flat concentric rings (zoom→0 perspective).
20. **Triangle (single rotating)** — one rotating triangle element — `alcTriangle(rotOffset, hueOff)` (kit:592).

### ORB family (A:t5,50,65,80,95,110,155,170; B:L1,L5,L13)
21. **Orb — feathery filled (soft-halo blob)** — blurred glowing filled ellipse, no ring — `alcOrbFeathery(cx, cy, colorize)` (kit:1555).
22. **Orb — concentric ring / bullseye** — pale outer ring + dark/mid ring + bright core, hollow center — `alcOrbTarget(qxVar, qyVar, n, colorize)` (kit:1532).
23. **Orb — filled glow / gradient blob** — solid colored disc + soft gradient — `alcOrbGradBlob(qxVar, qyVar, colorize)` (kit:1499).
24. **Orb — ringed "Saturn" node** — bright warm-white core + cycling-hue ring/halo (orbiter end-cap) — `alcOrbiterNode(qx, qy, qr, ringPal)` (kit:1364).
25. **Orb — base alcOrb / white / same / contrast** — fill + ring variants — `alcOrb(hueOff, borderHueOff)` (kit:1060), `alcOrbWhite`/`alcOrbSame`/`alcOrbContrast` (kit:1094–1096).
26. **Orb — bullseye with internal waveform rings** (A:t95) — filled blue core + oscilloscope rings + amber outer ring — `alcOrbTarget` + `circleWave` inner rings (kit:269).
27. **Orb string — graduated perspective bead row** (A:t5,t50; B:L1) — line of feathery ellipses small→large in perspective, "head" orb at near end — `alcOrbRow(n, fillHueOff, ringHueOff, nearX, nearY, vpx, vpy)` (kit:1106).
28. **Orb — single explicit at flowing depth** — one perspective orb (for staggered hand-placed rows) — `alcOrbAt(depthOffset, fillHueOff, borderHueOff)` (kit:1395).
29. **Orb dot-trail (marching dotted bead-line)** (A:t170 orb-row; B:L1) — discrete dots strung along a path — `alcOrbDotTrail(rows, colorize)` (kit:1580).
30. **Orb dot-columns** — orbs arrayed in columns — `alcOrbDotColumns(countPerCol, colorize)` (kit:1608).
31. **Orb — dot-grid lattice (hex-lens envelope)** (A:t80) — large regular square/diamond lattice filling a hexagonal-lens envelope — `alcOrbDotColumns`×rows tiled, or `[NEW] alcOrbGrid(cols,rows,envelope)` for the hex-lens clip + cross-hatch net.
32. **Orb — capsule/lozenge (motion-smeared)** (A:t170) — orb stretched 3–4× along travel into a capsule — `alcOrbGradBlob`/`alcOrbiterNode` under high `echo`/`dx` smear (no new factory; render setting).
33. **Orb — satellite/small glow blobs** (B:L13) — tiny orbs orbiting the anemone — `alcOrbFeathery` small, animated orbit positions.
34. **Orb — endpoint orb (tether terminus)** — small orb capping a waveform line end — `alcOrbiterNode` at tether endpoints (q21/q22, q23/q24).
35. **Orb — corner orb (loose lime/teal)** (A:t35) — bright soft orbs loose in frame corners — `alcOrbFeathery` at corner positions.
36. **Orb — indigo capsule + tiny orange dot-orbs riding bg spokes** (A:t140) — two bg orb styles coexisting — `alcOrbGradBlob` (capsule, outlined) + `alcOrbDotTrail` (tiny dots).

### TETHER / WAVEFORM-LINE family ("two-orbs-joined" WMP signature; A:t5,35,65,95,110,125,155,170; B:L1,L5,L15,L17)
37. **Tether — single thin jagged waveform bolt** — one live-audio oscilloscope line linking two orbs, windowed to land on nodes — `alcTether(qax,qay,qbx,qby,qamp,colorize)` (kit:1331) + flanking `alcOrbiterNode` pair.
38. **Tether — smooth low-amplitude swoop** (A:t5) — low-displacement waveform curve (red swoop) — `alcTether` with small `qamp`.
39. **Tether — high-amplitude jagged zigzag** (A:t5) — same line cranked to dense jaggedness — `alcTether` with large `qamp` (drive from treb).
40. **Tether — beaded/dotted chain arm** (A:t65) — string of discrete beads forming one zigzag arm — `waveLine()` (kit:293) with `wave_dots:1` / `alcOrbDotTrail` along the segment.
41. **Tether — braided multi-strand golden rope** (A:t65) — 2–4 parallel wavy strands twisting like a double-helix — `[NEW] alcBraidTether(strands)` (multiple `alcTether` copies with phase offsets; route through ≤4 wave budget).
42. **Tether — typed chained segments** (A:t65) — beaded-red arm + smooth-cyan arm chained end-to-end — two `alcTether`/`waveLine` segments with different palettes.
43. **Waveform line — corner-to-corner oscilloscope** (A:t35,155) — long diagonal real-sample line marching corner→corner — `waveLine()` (kit:293).
44. **Waveform line — doubled/parallel twins** (A:t35) — two close parallel waveform lines — two `waveLine` copies, small offset.
45. **Waveform line — diagonal serrated comet streak through a burst** (A:t140) — single sawtooth line slashing through the dandelion at peak — `waveLine()` over the burst, treb-gated amplitude.
46. **Vertical waveform streams / lightning-lines** (A:t80) — 4–8 lime jagged top-to-bottom lines, mirror-doubled — `waveLine()` rotated vertical ×N + vertical mirror.
47. **Horizontal oscilloscope scan-seam** (A:t110) — thin bright horizontal waveform line bisecting frame — `waveLine()` horizontal, low amp.
48. **Zigzag waveform band — echoed/smeared ribbon** (A:t125) — 3–5 ghost copies fanning across a rotating oblique axis, motion-smeared — `waveLine()` ×3–5 on a rotating axis + high `echo`/`decay`.
49. **Circle waveform (pulsing ringed circle)** — circular oscilloscope ring (Dance signature) — `circleWave(qx, qy, colorize)` (kit:269).

### NET / MESH / LATTICE / COMB family (A:t5,35,80,170; B:L2,L18)
50. **Net-mesh / web (crossing chords)** — dense criss-crossing straight chords, multi-color tangled lattice — `alcNetFrame(headFn, baseZoom)` (kit:1643) / `alcRotLines(n, opts)` (kit:904).
51. **Wireframe net / crossing-helix lattice (tilted wire dome/sail)** (B:L2,L18) — 3D perspective wire lattice mirrored about a vanishing point — `alcNetFrame` + perspective camera; `alcMeshRings` for the woven-ring basket form.
52. **Net-mesh ring / woven basket around a tunnel mouth** (A:t95) — concentric mesh rings woven around a perspective hole — `alcMeshRings(nRings)` (kit:1152).
53. **Hex-lens envelope + diagonal cross-hatch net** (A:t80) — dark-blue hexagon boundary with internal diagonal net — `alcNgon(6)` outline + `ALC_HATCH` (kit:107) / `alcRotLines` cross-hatch.
54. **Birds-nest net (chaotic oval cluster)** (A:t80) — ~20–30 thin yellow-green segments tangled into a rough oval — `alcRotLines` low-order + waveform jitter, or `alcNetFrame` clustered.
55. **Comb / picket-fence (vertical tick row)** (A:t5) — row of short evenly-spaced vertical ticks (amber/grey spectrum ticks) — `[NEW] alcComb(n, height)` (short vertical line instances; route via instancing/waves).
56. **Woven ladder / film-strip / centipede mesh** (A:t125) — parallelogram of perpendicular rungs strung between two waveform rails — `[NEW] alcLadder(rungs, rail)` (rungs between two `waveLine` rails).
57. **Parallel-line comb / hatched sheet → moiré** (A:t35) — two crossing parallel ray families → diamond moiré mesh — `alcRotLines(n, {spread})` two families + `ALC_MOIRE_GLSL` (kit:184) interference.

### RAY / SPOKE / FAN / SPINDLE family (A:t5,20,140,155; B:L5,L7,L15,L16,L17)
58. **Radial-burst / line-fan from a vanishing point** (A:t5) — fan of fine straight chords from one moving point, two-color (red+blue) — `alcRay(rayOffset, hueOff, lenScale)` (kit:862) / `alcRayWaves(n, hueOff, lenScale)` (kit:887).
59. **Thick painterly spoke-fan (30–50 chunky tapering spokes)** (A:t20) — solid magenta/purple painterly strokes, blurred hub — `alcRayWaves` with thick `thick`, additive.
60. **Pinwheel / radial spray fans from off-center nodes** (B:L16) — long straight rays from several emitter nodes — multiple `alcRay`/`alcRadialBurst` at node positions.
61. **Vertical drop-spokes** (A:t155) — thin vertical lines crossing the floor bands — `alcDiagonalLine(angleRad=π/2, halfLen, amp, r,g,b)` (kit:773) ×N.
62. **Red ray-fan from a corner (15–25 rays)** (A:t155) — straight rays fanning from one upper corner — `alcRayWaves(15..25)` anchored at corner.
63. **Diagonal orbiter spindle / bar (orb caps each end)** (B:L7,L15) — bright tilted bar with orbs at both ends crossing through a flower — `alcSpindle(colorize)` (kit:1300) + `alcOrbiterNode` end-caps.
64. **Crossed-laser X (two orbiter axes crossing)** (B:L6,L17) — two long diagonal beams crossing with starburst orbs at crossing — two `alcSpindle`/`alcDiagonalLine` axes + `alcStarWaves` at crossing.
65. **Comet/laser trail spindle** (B:L15) — orbiter bar leaving RGB comet trails — `alcSpindle` + high `echo`/`decay` chroma trails (`alcChroma`, kit:238).
66. **Ray/streak tails (comet residue)** (A:t125) — faint comet streaks trailing off band ends — feedback `echo`/`dx` smear of the waveform (render setting, not a factory).
67. **Diagonal single line (configurable)** — one straight chord at an arbitrary angle — `alcDiagonalLine(angleRad, halfLen, amp, r,g,b)` (kit:773).
68. **Stray full-canvas light-streak lines** (A:t50) — 1–3 thin white/yellow/cyan/red lines crossing independently — `alcDiagonalLine` ×1–3, random angle/color.

### RIBBON / FROND / MISC
69. **Undulating horizon band / ribbon** (A:t20) — thick snaking magenta→black band meandering horizontally, pinching to vesica eyes — `alcRibbonWarp(angle, push)` + `alcRibbonComp(angle)` (kit:826/838).
70. **Spool / spindle / capsule (bobbin/hourglass)** (A:t80) — pale-mint/green bobbin shapes anchored top/bottom, plain or red/orange-banded — `[NEW] alcSpool(banded)` (custom shape; route via 4 shape slots) — closest existing is `alcSpindle` reshaped to hourglass.
71. **4-square / white block clusters** (A:t80) — small white square blocks at symmetric positions — `[NEW] alcBlocks(n)` (small filled shapes via shape slots).
72. **Amber/tan wisp flecks** (A:t110) — soft feathery brush-stroke specks in the bands — `alcRadialBurst` tiny / texture flecks via bg `fbm`.
73. **Smoke/spray plume (feedback motion-trail)** (A:t35,140) — soft pink-white diffuse haze trailing a burst — feedback `echo`/`decay` of the burst (render setting + `ALC_FOG_GLSL`, kit:211).

> Motif total: **73 distinct foreground looks** (factory × variation). None dropped. New factories required: `alcComb`, `alcLadder`, `alcBraidTether`, `alcOrbGrid`, `alcSpool`, `alcBlocks` (6). Everything else maps to an existing kit factory.

---

## 2. BACKGROUND CATALOG — every distinct background treatment

B-series. Format: **#. Name — base colors — gradient/shape — texture/pattern — bleed — kit GLSL helper.**

1. **Near-black void** — `#020204` — flat, optional faint horizon glow — none (only fg streaks) — minimal — `ALC_SOLIDSNAP_GLSL` near-black (kit:198) / `ALC_CLEAR_WARP` (kit:381).
2. **Black + green/violet streaks** — black base — flat — chromatic fringe on streaks only — green/magenta fringe — `ALC_SOLIDSNAP` + `alcChroma` (kit:238).
3. **Vertical reed/grass curtain** — dark-green→brown `#1c2a14`–`#3a2a1a` — vertical gradient — motion-blurred vertical reed smear (feedback `dy`) — olive/teal bleed — `ALC_WASH_GLSL` (kit:135) + upward `dy` feedback.
4. **Warm dusty-brown vignette ground** — `#6b4a3a` — edge vignette, warm-center bright — slight horizontal feathering — soft warm bleed — `ALC_WASH_GLSL` + radial vignette.
5. **Flat dusty-wash (sage/olive/slate/mauve, hue-drifting)** — `#608066`/`#607640`/`#63576a`/`#5e4650` — flat with soft center vignette + film grain — film-grain/dither noise — slow global hue drift, complementary aurora bleed — `ALC_WASH_GLSL` (kit:135) + `alcHueClock` (kit:540).
6. **Radial tie-dye bloom (magenta/violet)** — `#b15179`→`#994fab`→`#9d5c58` — full-field radial gradient, bright center → red-brown rim, concentric soft rings — feathery dandelion strands — strong pink↔red aurora bleed — `ALC_RADIALBLOOM_GLSL` (kit:146).
7. **Dusty-red flat field** — `#9d5c58` — faint radial vignette — near-solid wash — low — `ALC_WASH_GLSL` brick-red.
8. **Olive↔teal starburst-spokes wash** — red→olive→teal `#607640`/`#1e6062` — radial spoke streaks from center — sparkler-trail spokes — complementary hue drift — `ALC_WASH_GLSL` + `alcRotLines`/`alcRay` spokes baked.
9. **Liquid marble / fluid veins (muted)** — teal/magenta/violet `#1e6062`/`#5e4650` — swirled flow — domain-warped fbm marble veins — teal↔magenta marble bleed — `ALC_MARBLE_GLSL` (kit:88) + `fbm` (kit `NOISE_GLSL`).
10. **Bold/saturated marble-aurora (mid-piece)** — lime+magenta+blue, central dark pupil — warped flow, bolder — bright mint veins (the "marble veins bold" preference) — vivid green/magenta bleed — `ALC_MARBLE_GLSL` (higher gain) — *not* muted (vivid exception per B:L12).
11. **Aurora spectral wash** — multi-hue domain-warped — patchy color pools — fbm spectral — complementary aurora bleed — `ALC_AURORA_GLSL` (kit:117) + `pal`/`fbm`.
12. **Kaleido vortex swirl (green-dominant)** — green/teal+magenta `#3b3a39` near-black plum — rotational spiral arms around an off-center eye — feedback `rot` smear, rainbow ring around eye — strong chromatic fringe — `ALC_FLUID_GLSL` (kit:71) + `alcCamVortex` (kit:443).
13. **Plum/slate-blue nebula fog (softest)** — `#4b6989` — cloudy haze, dark corners — soft fbm, no hard edges — plum→teal→magenta drift — `ALC_FOG_GLSL` (kit:211) + `fbm`.
14. **Hard X / bow-tie kaleidoscope** — flat olive/mustard/violet blocks that swap hue — 4-fold mirrored bow-tie, hard diagonal seam — flat color blocks — hue swaps per tile — `ALC_KALEIDO_GLSL` (kit:171) over `ALC_SOLIDSNAP`.
15. **Butterfly kaleidoscope (magenta/teal)** — magenta-pink+teal — 4-fold mirror, pink horizontal band — flat blocks — — `ALC_KALEIDO_GLSL` (magenta/teal palette).
16. **4-petal clover mandala kaleidoscope** — green+magenta lobes, bright center bead — 4-fold mirrored clover, hard seams — flat color, mandala symmetry — — `ALC_KALEIDO_GLSL` (petal mode) — possibly `[NEW] ALC_KALEIDO_PETAL` variant.
17. **Stacked horizon-bands "lens/eye"** — vivid red↔green (intro), mustard/teal (mid) — stacked horizontal bands bulging into lens/lozenge (sin-warp), dark center slit — banded horizon stripes — heavy inter-band bleed — `ALC_HORIZONBANDS_GLSL` (kit:158).
18. **Horizontal lens-band ripple (yellow/teal)** — mustard-yellow top, teal pinch mid — sin-warped stacked bands, concentric ripple at rosette — band ripple — band bleed — `ALC_HORIZONBANDS_GLSL` (ripple mode).
19. **Perspective horizontal band-stack floor (teal/green/olive/magenta)** (A:t5) — sage `#46784`/teal/olive + magenta seam — receding band floor, top+bottom black falloff — horizontal striped bands + vertical comb overlay + horizontal feedback smear — heavy inter-band bleed, slow hue shift — `ALC_HORIZONBANDS_GLSL` perspective + `ALC_WASH` + horizontal `dx` echo.
20. **Olive perspective-floor (receding plane)** — `#607640` — floor tilting to horizon, motion-blur convergence — receding plane streaks — olive→brown bleed — `ALC_WASH` + perspective warp / `alcCamPlunge` (kit:429).
21. **Amber/olive perspective floor + diagonal scanlines** — `#5a513d` — receding floor + faint diagonal scan-streaks — diagonal scan smear — dusty warm bleed — `ALC_WASH` + diagonal scan via `ALC_HATCH`.
22. **Perspective tunnel / vortex eye (marble)** (A:t95; B:L11,L20) — mauve/green marble, maroon eye `#702d2d` — dark center hole, swirl-into-eye radial — marble veins spiraling into eye — green↔mauve bleed — `ALC_MARBLE_GLSL` + `alcCamPlunge`/`alcCamVortex`, `darken_center`.
23. **Radial spoke-ray tunnel (green/purple bands + wallpaper underlay)** (A:t140) — green/violet alternating bands — spokes converge to VP, center-bright vignette, horizontal mirror seam — radial sunburst spokes + wallpaper-tile underlay — green↔violet phase drift — `ALC_HORIZONBANDS` radial + `alcRotLines` spokes.
24. **Green light-cone / floor sweep (beam climax)** (B:L17) — green sweep — diagonal light-cone wash — sweeping cone — green bleed — `ALC_WASH` + directional gradient.
25. **Vertical-stripe wallpaper / picket-fence** (A:t110; B:L14, C:15) — bright-green/dark-green stripes `#4b7c2b` — evenly spaced vertical bars, shear into perspective X late — repeating stripe wallpaper — green↔magenta complementary bleed — `ALC_MOIRE_GLSL` (kit:184) vertical-comb mode.
26. **Vertical-bar EQ comb / moiré standing-wave** (B:L14) — red/green/magenta — dense vertical stripes, sometimes 4-fold butterfly — moiré interference — saturated (vivid interlude) — `ALC_MOIRE_GLSL`.
27. **Dot-grid / beaded lattice wallpaper** (A:t80; C:22) — teal/orange/olive variants — regular studded dot lattice, soft 3D shading — repeating dot wallpaper — hue drifts across variants — `[NEW] ALC_DOTGRID_GLSL` (studded-lattice; no current helper).
28. **Magenta-pink flat + dot-grid ghost** (C:23) — flat dusty magenta `#7983` w/ embossed grid, tiny blue markers — flat — faint embossed dot-grid — soft — `ALC_SOLIDSNAP` magenta + `ALC_DOTGRID_GLSL` low-amp.
29. **Slate cross-hatch / diagonal-weave wallpaper** (C:24) — slate-teal/slate-mauve `#695d5e` — diagonal `/`+`\` woven hatch — repeating weave wallpaper — — `ALC_HATCH` (kit:107) cross-hatch double-pass.
30. **Slate-purple zigzag/chevron field** (C:18) — `#63576a` — chevron jaggies (smeared waveform) in teal/yellow — repeating chevron texture — strong cyan/magenta channel split, teal↔magenta aurora — `[NEW] ALC_CHEVRON_GLSL` or `ALC_MOIRE` chevron variant + `alcChroma`.
31. **Soft concentric-ripple bullseye** (C:21) — near-greyscale muted — concentric target rings, centered glow bead — ring ripple — near-monochrome — `ALC_RADIALBLOOM_GLSL` (ring mode) / `circleWave` baked.
32. **Dark-purple vignette + bokeh orbs** (C:19) — deep aubergine, heavy vignette — edge vignette — out-of-focus bokeh circles drifting — dusty low-key — `ALC_WASH` aubergine + `[NEW] bokeh layer` (`alcOrbFeathery` defocused, or fbm spots).
33. **Solid-snap flat color (kaleidoscope base)** — any muted flat hue — flat — none — — `ALC_SOLIDSNAP_GLSL` (kit:198).

> Background total: **33 distinct treatments.** New GLSL helpers needed: `ALC_DOTGRID_GLSL`, `ALC_CHEVRON_GLSL`, an `ALC_KALEIDO_PETAL` mode, and a bokeh layer (4). All others map to existing helpers.

---

## 3. PALETTE + BLEED

**Color schemes (ALC_PAL, kit:521 — all confirmed present; extend as noted):**
- `roseGreen` (green↔magenta) — the canonical anemone duo (B:L6,L7,L12,L13; A:t95,t140,t170). DOMINANT.
- `redCyan` (red↔cyan) — the dahlia / lens (A:t125 red-vs-teal; B:L3 red↔green-ish).
- `twoTone` (generic complementary, step 0.5) — default duo.
- `mono` (single drifting hue, sat 0.72) — orb rings, fog.
- `spread` (multi-color, step 0.04) — rainbow phases (A:t5 climax net, t50 spoke iridescence, t125 near-rainbow; B intro lasers + L19 firework).
- `warm` (amber/gold, base 0.86, no drift) — Ambience-amber bands, comb ticks (A:t5 amber cycle).
- **[NEW palette specs to register]:** `greenViolet` (= `alcPalette({step:0.5, base:0.30})` for L8/L10/L16 green↔violet bands), `tealAmber` (`{step:0.5, base:0.55}` for A:t5 teal↔amber bands & L18), `magentaTeal` (`{step:0.5, base:0.83}` for C:12 butterfly). These are one-liner `alcPalette` calls (kit:502), not engine work.

**Bleed / drift behavior (universal overlay, both videos confirm):**
1. **Slow global hue clock** — `alcHueClock(hue, dt, energy, base, gain)` (kit:540), base≈0.02 → one full sweep over ~15–60s. Drives the duo ping-pong and the rainbow phases. Background-wash hue drifts SLOWER than geometry hue (two separate clocks: bgHue base≈0.012, fgHue base≈0.03).
2. **Complementary two-tone aurora bleed** — two complementary hues bleed across the field; implement as `tintComp(colA,colB,speed,boost)`-style mix in the comp shader (or `ALC_AURORA`/`ALC_MARBLE` two-hue mix). The dominant behavior is **ping-pong, not continuous rainbow scroll** (per the color-motifs memory).
3. **Per-edge chromatic-aberration fringing** — R/G/B channel offset on every high-contrast edge (lightning lines, orb rings): `alcChroma(amt)` (kit:238) in comp, amt scaled by energy.
4. **Drifting bokeh orbs** — appear in dark segments (C:19) — defocused `alcOrbFeathery` layer.
5. **Beat-coupled brightness, never hue** — `alcEnergy` (kit:548) + `alcBeatFlash` (kit:557): louder = brighter/faster cycle, transients flash core brightness (the supernova re-bloom), but hue is driven only by the slow clock.
6. **Reinhard tone-map the final** — `c/(c+k)` in comp so additive cores compress to soft color (muted-rule); muting applies to the organic middle, NOT to the vivid exceptions: B:L3 lens, B:L12 bold marble, B:L14 EQ comb, A:t20 red/green scene (match their genuine saturation per-look).

---

## 4. V4 WIRING PLAN

Single preset `P["Alchemy v4: Random"]` built via `build()` (kit:248). It is a **director-driven state machine** over four independent axes (motif, background, fold/symmetry, camera) × palette, each with its own clock so they evolve out of lockstep (the macro-arc's defining property: "a new distinct LOOK every 8–12s, axes drift independently"). Budget: ≤4 enabled custom WAVES + ≤4 custom SHAPES per frame (vendor `customWaveforms=c.range(4)`), instancing up to 1024×. Extras route through the shape budget / instancing — never dropped.

### 4a. EMITTER MODES (one dispatch entry per motif #1–#73)
Build a flat dispatch table `EMITTERS = [...]`, indexed 0..N, each entry `{ id, build(slot, cfg), drive(t, cfg) }`:
- `build(slot, cfg)` assigns the motif's kit factory to a wave/shape slot, e.g. `preset.waves[slot] = alcAnemone(cfg.spikes, cfg.pal)`.
- `drive(t, cfg)` sets the per-frame q-vars the factory reads (`q2/q3` center, `q5` radius, `q6` jaggedness, `q7` orb radius, `q8` hue, `q9` spin, `q14` march, `q21..q26` orbiter/tether endpoints+amp).
- Every entry corresponds to one numbered motif+variation above (anemone sparse/dense/feathery/folded are SEPARATE entries → motif count is NOT reduced).
- The director can co-activate up to **4 wave-emitters + 4 shape-emitters simultaneously** (e.g. anemone[wave] + tether[wave] + 2 orbiter-node[wave] for the Pulsar; orbs via shape slots). When a scene wants more variants than slots, it **time-slices** them (swap factory in/out of a slot at scene boundaries) and routes filled-orb/grid/spool/block motifs through the 4 SHAPE slots + instancing.
- New emitters wire the 6 `[NEW]` factories (`alcComb`, `alcLadder`, `alcBraidTether`, `alcOrbGrid`, `alcSpool`, `alcBlocks`).

### 4b. BACKGROUND-FIELD SELECTOR (cycles all bg #1–#33)
- A `BG_FIELDS = [...]` table, each entry `{ id, warp, comp, drive }` where `warp`/`comp` are the GLSL helper strings (prepend `NOISE_GLSL`/`PAL_GLSL` where the helper needs `fbm`/`pal`).
- Director picks a bg field per scene; `drive(t)` sets its uniforms via q-vars (bg hue clock `q8`, vignette, band count, swirl amount). Because comp/warp can't be swapped mid-frame in Butterchurn, **V4 ships the bg as a `uflavor` integer uniform** (set per frame in `frame_eqs`, e.g. `t.q30 = bgId`) and the single mega-comp shader `switch(int(q30))`-dispatches to the right helper block. This keeps one compiled program while cycling all 33 fields. (Confirmed pattern: the existing "Alchemy v2: Random" already does scene-id-in-a-uniform; extend its `switch` to cover all 33.)
- New helpers `ALC_DOTGRID_GLSL`, `ALC_CHEVRON_GLSL`, `ALC_KALEIDO_PETAL`, bokeh added as new `case` blocks.

### 4c. DIRECTOR (cycles motif × bg × fold × camera × palette, non-periodic, anti-repeat)
A `frame_eqs` state machine holding `sceneStart, sceneDur, cur{motif,bg,fold,cam,pal}, prev{...}`:
1. **Independent clocks per axis** — `motifClock`, `bgClock`, `foldClock`, `camClock`, `palClock`, each with its own period drawn from a jittered range (motif 8–12s per macro-arc pacing; bg 15–40s slow drift per C; fold/cam shorter). They tick from `dt = t.time - lastT` and re-roll their axis independently → the combination is **non-periodic** (axes never realign).
2. **Weighted random pick with anti-repeat** — when an axis clock fires, pick a new value `≠ prev` (reject-sample), with weights matching the macro arc (anemone/orb dominant; lens/EQ-comb/marble as periodic accents; intro-graphic looks rarer). Keep a short ring-buffer of the last K picks per axis to forbid near-repeats (the macro-arc shows looks recur but never back-to-back).
3. **Macro-arc bias (optional shaping)** — a slow `arcPhase = time/186` can bias weights to reproduce the intro-graphic → muted-flower → beam-climax → tunnel-outro envelope (B), while still randomizing within each phase. Energy (`alcEnergy`) drives density/count/brightness within a scene (sparse→dense, smooth→jagged), exactly as the per-segment reads describe.
4. **Transitions = MORPH by default** — feedback `decay`/`echo` left high so the old scene smears into the new over ~1–2s (B: "predominantly morph"). Two scene types flagged `hardCut:true` (the red-green lens, the EQ-comb) snap `decay` low for one frame. Orbiter-bar scenes use a fast wipe (sweep the spindle across at scene entry).
5. **Each axis feeds the right consumer** — motif→emitter dispatch (4a), bg→`q30` field id (4b), fold→kaleidoscope warp params (`ALC_KALEIDO` n-fold / mirror seams), cam→`alcCamera(kind)` family (`hold/plunge/vortex/tiltFloor`, kit:388–472) + zoom/rot, palette→which `ALC_PAL.*` the emitters' `colorize` uses + the two hue-clock bases.
6. **Anti-lockstep guarantee** — never advance two axes on the same frame from one clock; each axis owns its own `nextChange` timestamp. This is what makes V4 read as "endlessly varied" rather than a looping playlist.

### 4d. Build skeleton (concrete shape)
```
P["Alchemy v4: Random"] = (function () {
  var director = makeDirector();              // holds the 5 independent clocks + ring buffers
  var slots = { waves: [/*4*/], shapes: [/*4*/] };
  // assign placeholder factories; director hot-swaps factory refs at scene boundaries
  return build(BASE, {
    init: function (t) { director.reset(t); return t; },
    frame: function (t) {
      var dt = director.tick(t.time);
      director.maybeAdvanceMotif(dt);  director.maybeAdvanceBg(dt);
      director.maybeAdvanceFold(dt);   director.maybeAdvanceCam(dt);
      director.maybeAdvancePalette(dt);
      EMITTERS[director.cur.motif].drive(t, director.cfg());   // sets q2..q26
      t.q30 = director.cur.bg;                                  // bg field id for the comp switch
      applyCamera(t, director.cur.cam);                         // alcCamera + zoom/rot/echo
      t.q8 = (t.q8 + dt*fgHueBase) % 1;                         // fg hue clock
      t.q31 = (t.q31 + dt*bgHueBase) % 1;                       // separate bg hue clock
      return t;
    },
    warp: BG_WARP_SWITCH,    // switch(int(q30)) over all bg warps
    comp: BG_COMP_SWITCH     // switch(int(q30)) + alcChroma + Reinhard tone-map
  });
})();
```

### 4e. Coverage checklist (nothing dropped)
- All 73 motif emitters reachable; the 4-wave/4-shape cap handled by time-slicing + shape-budget + instancing (stated explicitly, never by dropping a variant).
- All 33 bg fields reachable via the `q30` switch.
- All ALC_PAL schemes + 3 new palette one-liners wired into `colorize`.
- Both hue clocks (fg fast, bg slow), `alcChroma` fringing, `alcBeatFlash` core flash, Reinhard tone-map present.
- 5 independent jittered clocks + per-axis anti-repeat ring buffers = non-periodic director.
- New code required: 6 emitter factories (`alcComb/alcLadder/alcBraidTether/alcOrbGrid/alcSpool/alcBlocks`), 4 bg helpers (`ALC_DOTGRID_GLSL/ALC_CHEVRON_GLSL/ALC_KALEIDO_PETAL/bokeh`), 3 palette one-liners, the director + dispatch tables. Everything else is existing kit.

---

Relevant files: `/Users/sujitk/projects/personal/ytmusic-wmp-visualizer/presets/kit.js` (all cited factories), `/Users/sujitk/projects/personal/ytmusic-wmp-visualizer/presets/alchemy.js` (where `P["Alchemy v4: Random"]` is added; existing `Alchemy v2: Random` at line 374 is the closest scene-id-uniform precedent to extend), `/Users/sujitk/projects/personal/ytmusic-wmp-visualizer/viz.js` (add the `FAVORITES` entry).