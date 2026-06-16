# Alchemy Orb Motifs — Complete Reference Guide

This guide synthesizes frame-by-frame analysis of all 9 sections (0:00–3:06) of the WMP Alchemy reference video into implementation-ready specifications for Butterchurn. Numbers are measured at 640×360 unless noted.

---

## 1. Orb Variant Catalog

### Variant 1: Orbiter Head — Hue-Cycling Filled Core with Saturn Ring
**Where/When:** Section A, 0:04–0:16 (f_0022–f_0058), Scenes 1–3. The canonical orbiter in its most legible form.

**Visual description:** Slightly elliptical filled disc (wider than tall due to perspective foreshortening), 28–50px wide. A separate concentric "Saturn ring" — a thin white stroke ~2px wide — is drawn concentrically around the filled core. These are two distinct elements: the filled disc and the ring are NOT the same circle.

**Colors & cycling:** Fast rainbow hue-cycle, approximately one full HSL sweep per 3–4s. Sequence: blue/steel → yellow-gold → purple/magenta → amber/orange → pink/magenta → violet/indigo. The Saturn ring stays pure white (#FFF or r=1.3,g=1.55,b=2.0 boosted white) regardless of core hue. Saturation is moderate (not neon), slightly more vivid in Scene 3.

**Trail mechanics:** Stepped-echo (NOT smear). Each past orb position is stamped as a hollow ring onto the feedback buffer. ~8–15 discrete ring echoes per trail row, stretching 50–60% of frame width toward the vanishing point on the right. Spacing between echoes is even, consistent with constant-velocity motion. Trail rings are visually identical to the Saturn ring but smaller and fainter. Opacity decays from ~70% near the head to ~5% at the far end. This behavior emerges from `decay ~0.92` + small rightward camera push — the orb moves leftward relative to the shrinking buffer, so each stamped ring is slightly left of the previous.

**Movement:** Each orb travels along a horizontal axis with right-side perspective convergence. Path in screen space looks linear with slight perspective arc. Speed roughly 10–15% of frame width per second in screen space. Two orbs, each on a separate horizontal track, converging toward the same VP.

**Audio reactivity:**
- `bass` → head orb SIZE (visibly larger on beat)
- `bass` → ring brightness / glow intensity
- `mid` → whip-filament jaggedness and length
- `treb` → strobe rate (how many new echo rings appear per unit time)

**Tether/connection:** 4–6 jagged waveform lines ("whips") arc from one orb head toward the other — dense small zig-zags driven by `a.value1`. Filaments are same hue as the orbs. This is the `waveLine()` pattern from Dance of the Freaky Circles.

**Blend mode & glow:** `additive: 1`. Head ring and core both bloom additively. Trail echoes also additive but dimmer.

**Butterchurn implementation:**
- Two `circleWave(qx, qy)` instances for the ring component (one per orbiter head). For the Saturn white ring: a second concentric `circleWave` at slightly larger radius, white color, thin stroke.
- The filled core CANNOT be done cleanly with a wave; use `alcOrbiterNode()` (the existing kit function) which uses a dense sqrt-spiral fill for 55% of samples + a ring band for the remaining 45%.
- Trail: emerges from `decay: 0.92` — do not draw echoes explicitly.
- `frame_eqs`: `q21 = 0.5 + 0.28*cos(time*0.8)`, `q22 = 0.5 + 0.15*sin(time*0.8)` for head A; B is +π offset.
- Hue: `hue = (hue + dt*0.25) % 1` → one cycle per 4s.

---

### Variant 2: Trail Echo Rings — Stroboscopic Dotted Row
**Where/When:** Section A, 0:04–0:16, inseparable from Variant 1 (it IS the feedback echo of Variant 1).

**Visual description:** Hollow ring / slightly flattened ellipse. Transparent interior with ring outline only. Small-to-medium: 8–20px wide, decreasing as they recede toward VP (perspective scaling). Head-nearest echoes ~20px, far end ~6–8px. Stroke ~1–2px, crisp not blurred.

**Colors & cycling:** Exact same hue as the current orb head (same fast rainbow cycle). White when orb is in white/neutral phase.

**Trail mechanics:** These ARE the trail. Each ring is a discrete stamped copy of the orb at a past position. ~8–15 echo rings per row × 2 rows = 16–30 simultaneous rings on screen. Spacing even (constant-velocity source). Opacity gradient: 60–70% near head down to 5–10% at far end.

**Movement:** Stationary relative to screen; the row IS the historical orbital path. Newest echo appears at head position; all others shift with feedback.

**Audio reactivity:** `treb`/transients control how many new echo rings appear (strobe rate). `bass` makes newly-stamped echoes brighter.

**Butterchurn implementation:** This variant is a pure feedback artifact. Set `decay: 0.92`, `zoom: 1.0` (no zoom needed for this), small `dx` or `cx` offset to push the buffer left slightly each frame. The even spacing + ring anatomy emerge from the orb being a thin ring shape rather than a filled blob.

---

### Variant 3: Kaleidoscope Corner Accent Orbs
**Where/When:** Section A, 0:17–0:22 (f_0052–f_0058), Scene 4 (kaleidoscope transition).

**Visual description:** Small circle, ~14–20px diameter. Small filled bright core (~4–6px) surrounded by a thin white/blue ring ~1–2px stroke. Much smaller than the Scene 1–3 head orb. 2 real positions (upper-left ≈ x=0.12,y=0.12 and lower-right ≈ x=0.88,y=0.88), kaleidoscope 4-fold mirror makes them appear as 4 in some frames.

**Colors & cycling:** White-blue ring with amber/gold or white core. Mostly neutral regardless of background hue cycling.

**Trail mechanics:** None — stationary corner accents with no stroboscopic trail at this scale/speed.

**Movement:** Near-stationary. Slow drift or orbit within the corner region, <2% of screen width per second. The 4-fold kaleidoscope mirror means only 2 real orbs need to be drawn.

**Audio reactivity:** `treb` → ring brightness (ring brightens on hits). `bass` → subtle size pulse.

**Butterchurn implementation:** Two small `circleWave` instances pinned near (0.12,0.12) and (0.88,0.88). The kaleidoscope comp shader mirrors them into 4. `wave_scale: 0.02–0.03`. `additivewave: 1`.

---

### Variant 4: WireframeNet-EndpointNode
**Where/When:** Section B, 0:27–0:37 (f_0086–f_0098), B2 Wireframe Net scene.

**Visual description:** Small hollow ring, 8–14px diameter, thin 1–2px stroke. 2–4 visible simultaneously, typically 1–2 clustering in the upper-right corner + 1 lower-left. These are the endpoint caps of wire strand convergence — NOT independently floating orbs.

**Colors & cycling:** Hue tracks the net strand color and the overall scene cycle: teal/cyan → green → magenta/pink → white/pale grey. Hue period ~8–12s.

**Trail mechanics:** Stepped-echo — in f_0086 upper-right shows 4–5 discrete past-position rings stacked vertically, each ~50% opacity of previous. Trail extends ~30–40px behind the current node. Emerges automatically from `decay ~0.95` when the node moves slowly.

**Movement:** Arc / slow orbit following the net endpoint sweep. Primarily corner regions. Speed ~0.03–0.07 screen widths/s.

**Audio reactivity:** `bass` → size pulse (modest). `time` → hue. Trail density increases with higher energy.

**Tether/connection:** The wire strand IS the tether — nodes sit at strand terminii.

**Butterchurn implementation:** These are NOT separate shapes. They are the natural accumulation point of a `waveLine` custom wave at its endpoint. When many waveform line samples converge to a single (x,y) at `a.sample = 0` or `a.sample = 1`, additive blending makes the endpoint glow brighter, reading as a node. For a more explicit hollow ring: add a small `circleWave` at the strand endpoint coordinates (carried in q-vars). Color: `a.r/g/b = pal(time*0.1 + strandIndex*0.05)` so strands carry staggered hues.

---

### Variant 5: Orbiter-CometHead (Hollow Ring + Filled Disc Companion)
**Where/When:** Section B, 0:38–0:40 (f_0113–f_0121), B3 Orbiters scene.

**Visual description:** Hollow ring ~16–22px diameter, 2–3px stroke, with a small filled disc companion ~8–10px adjacent or overlaid. The hollow ring head is the primary element; the filled disc appears as a satellite or inner feature.

**Colors & cycling:** Slow hue cycle, green/teal → white/grey → magenta/pink → purple over ~10–15s. Two nodes may carry different hues simultaneously (complementary pair). Colors are muted-but-vivid (not blown out).

**Trail mechanics:** Stepped-echo — f_0120 shows 6–8 discrete smaller hollow ring stamps spaced along the waveform path behind each node, each progressively smaller and fainter. NOT a continuous smear. Trail extends ~80–120px behind the head.

**Movement:** Slow arc / orbit between opposite corners. Nodes travel between corner regions tracing large arcs. BL↔TR diagonal axis. Speed ~0.02–0.05 screen widths/s. Counter-rotating pair: one clockwise, one counter-clockwise, maintaining rough diagonal opposition.

**Audio reactivity:** `bass` → ring radius pulse (larger on beat). `mid/treb` → waveform amplitude (tether jaggedness). `bass_att` → overall glow brightness.

**Tether/connection:** Single long jagged live-audio oscilloscope line from node to node corner-to-corner. The stepped-echo trail rings ARE the waveform path echoes — when the orb is at the waveLine endpoint, its echo rings stamp into the buffer.

**Blend mode & glow:** `additive: 1`. Soft bloom halo confirms additive compositing.

**Butterchurn implementation:**
- `circleWave(qx, qy)` for the hollow ring head. `additivewave: 1`. `wave_scale: 0.3–0.5` (keeps rings tight).
- For the filled disc companion: a second `circleWave` at the same (qx, qy) but `wave_scale: 0.1–0.15` with `usedots: 1` — or use `alcOrbiterNode(qx, qy)` which does fill+ring in one wave.
- Trail: `decay: 0.96` so each frame's ring stamps as a ghost ring over ~6–8 frames.
- Tether: `waveLine()` A→B with `a.y += 0.12 * a.value1` for perpendicular displacement.

---

### Variant 6: C1-Orbiter — Teal Concentric-Ring Sprite
**Where/When:** Section C, 0:40–0:47 (f_0121–f_0141), Scene C1.

**Visual description:** Hollow ring sprite with 2–3 nested concentric rings forming a bullseye/target appearance. ~30–40px overall diameter. Each ring ~1–2px stroke. Dark/transparent between rings. 2 simultaneous (upper-left quadrant and lower-right, BL↔TR diagonal axis).

**Colors & cycling:** Teal/cyan rings (hsl ~185°, 80%, 55%) with an orange-red outer rim accent. The outermost ring is warmer. Brightness moderate, not blown white.

**Trail mechanics:** Smear — not discrete stepped echoes. The heavy feedback decay (~0.92) of this scene leaves a horizontal smear ~0.5–1× the orbiter diameter behind it.

**Movement:** Approximately stationary / slow drift along the BL–TR diagonal. Position shifts only slightly frame to frame. Speed <0.05 screen widths/s. The orbs jitter in place at the two ends of the diagonal waveform line rather than tracing a clean orbit.

**Audio reactivity:** `treb` → ring brightness. Position does not obviously respond in C1 — corner-anchored.

**Tether/connection:** Jagged waveform line (real audio oscilloscope) connects the two orbiters diagonally. In C1 it is a chaotic yellow-green lightning line through the net tangle.

**Butterchurn implementation:**
- 2–3 `circleWave` instances at slightly different radii (0.03, 0.055, 0.075) with near-zero audio displacement so they stay as crisp rings.
- Teal: `a.r=0.1, a.g=0.8, a.b=0.8`. Orange accent on outermost ring: `a.r=0.9, a.g=0.4, a.b=0.1`.
- Orbital motion: `q21=0.5+0.38*cos(time*0.28), q22=0.5+0.38*sin(time*0.28)` for A; B is opposite.
- `decay: 0.92`. `additivewave: 1`.

---

### Variant 7: C3-Orbiter-Mature — Yellow-Green Layered Ring Sprite with Orange/Red Core Dot
**Where/When:** Section C, 0:55–0:58 (f_0166–f_0175), Scene C3 mature pulsar phase.

**Visual description:** 2–3 nested hollow rings around a small filled dot core. Innermost element is a bright colored dot (~4–6px), surrounded by progressively larger faint rings. Overall ~35–50px diameter. Each ring ~1–2px stroke.

**Colors & cycling:** Yellow-green rings (hsl ~80°, 70%, 55%) with saturated orange-red core dot (hsl ~10°, 80%, 55%) in f_0166, shifting to red-orange in f_0167. Mild pink/green glow halo. Color is scene-phase dependent (changes as pulsar evolves).

**Trail mechanics:** Smear from `decay ~0.90`. Short halo extends ~1–1.5× sprite radius. Faint, clearly dimmer than the bright sprite core.

**Movement:** Slow arc/orbit along BL–TR diagonal. Between f_0166 and f_0169 the orbs shift position slightly (upper one moves from top-right toward right-center), consistent with a slow clockwise orbit around the central pulsar. Speed ~0.05–0.10 screen widths/s.

**Audio reactivity:** `treb` → ring brightness and inner dot color saturation. Orbital speed is slow constant phase advance (time-driven, not audio-gated). Size mostly fixed.

**Tether/connection:** Jagged waveform tether faintly visible connecting the two orbiters through the central pulsar. The thick doubled waveform tether in f_0175 is the dominant graphical element — red + yellow/orange parallel jagged lines diagonally LL→UR. This is the canonical "two orbs joined by waveform" WMP signature.

**Butterchurn implementation:**
- `circleWave` center dot at very small radius (0.005–0.01), orange: `a.r=0.9, a.g=0.5, a.b=0.1`.
- `circleWave` ring at radius 0.03, lime: `a.r=0.5, a.g=1.0, a.b=0.1`.
- Optional third `circleWave` at radius 0.055 for the outermost faint ring.
- Tether: two `waveLine` waves offset by ±0.008 in perpendicular direction for the red+orange doubled look. `wave_scale ~0.8`, gain `0.18*a.value1`.
- Use at most 6 custom waves total (Butterchurn cap). Combine two tether lines into one if needed.

---

### Variant 8: D1-Orbiter-YellowGreen — Filled Disc with Concentric Glow Halo
**Where/When:** Section D, 0:58–0:59 (f_0175–f_0178), Scene D1. The "Dance of the Freaky Circles" pattern in Alchemy's palette.

**Visual description:** Filled disc with bright yellow-green saturated core fading outward, surrounded by a glowing halo of concentric rings — "small sun with rings." Head disc ~45–50px diameter; halo extends to ~70px total. 2 simultaneous, diametrically opposed on a diagonal axis.

**Colors & cycling:** Bright yellow-green (chartreuse, HSL ~80°, high-sat) core with orange-red inner ring halo and outer green glow. Adjacent magenta/purple smear from motion.

**Trail mechanics:** Smear — vivid orange-red comet-tail behind the orb head, not discrete stamps. Extends ~60–80px. Bright orange-red near head, fading to near-zero at tail. Very high decay: `0.96–0.98`.

**Movement:** Elliptical orbit around center. Two orbs at opposite ends of large diagonal ellipse. Speed ~0.05–0.08 screen widths/s clockwise. Diagonal axis lower-left to upper-right.

**Audio reactivity:** `bass` → glow radius and halo brightness expand on kick. `treb` → comet-tail length.

**Tether/connection:** Live audio oscilloscope jagged line, red/yellow, from one orb through frame center to the other. Dense fine zigzag from real audio samples — NOT a sine wave. Real `a.value1` samples.

**Butterchurn implementation:**
- `alcOrbiterNode(qx, qy)` or `alcOrb(hueOff)` for the filled core + ring.
- Large wave: `additivewave: 1`, `a: 0.9`, `r/g = chartreuse`.
- Trail: pure feedback artifact, `decay: 0.96`, `zoom: 1.01`.
- `frame_eqs`: standard elliptical orbit, `q21 = 0.5+0.32*cos(time*0.4)`.

---

### Variant 9: D4-Orbiter-CyanRing — Hollow Double-Ring with Bead-Chain Coil Trail
**Where/When:** Section D, 1:06–1:10 (f_0200–f_0211), Scene D4. The most distinctive trail variant.

**Visual description:** Hollow ring — clear circle outline with transparent interior, plus a second outer concentric ring giving a "double-ring" or washer appearance. ~22–30px outer diameter. Two thin lines separated by ~4–5px gap. 2 simultaneous, diametrically opposed.

**Colors & cycling:** Alternates cyan/teal (#00E5CC) and yellow-gold (#D4A800) depending on the moment. Hue cycles cyan→gold→green over ~6s. Background: dark indigo-purple.

**Trail mechanics:** Stepped-echo — the most clearly stepped-echo trail in the entire video. 3–6 discrete "bead" ring echoes behind the head, extending ~50–80px. Each echo is a smaller/fainter copy of the hollow double-ring at a past position, clearly separated from the next (NOT a blur). Opacity: nearest echo ~50–70% of head brightness, oldest ~10–15%. The result looks like a "beaded coil / spring tail." This is a `circleWave` drawing a ring outline at constant velocity, with `decay: 0.93–0.95` stamping each frame.

**Movement:** Large elliptical orbit around frame center. Orbital axis precesses (rotates) over the ~6s window. Speed ~0.04–0.07 screen widths/s. Orbs travel in opposite directions simultaneously.

**Audio reactivity:** `bass` → ring glow brightness pulses (brighter/slightly larger on kick). `mid/treb` → tether jaggedness. `time` (slow) → hue cycle.

**Tether/connection:** 2–3 parallel jagged oscilloscope lines connecting the two orbs through frame center. Lines are cyan/red or gold depending on phase. The parallel-line stack (2–3 offset copies) is a key visual. In f_0202 a clear white/cyan waveform with red parallel offset copy is visible.

**Butterchurn implementation:**
- `circleWave(qx, qy)` with moderate `wave_scale: 0.3–0.5`, `additivewave: 1`.
- For the double-ring: two `circleWave` at slightly different radii (e.g., wave occupies an annulus by having samples at two rings — split sample range 0..0.5 → inner ring, 0.5..1 → outer ring at slightly larger radius).
- `decay: 0.93–0.95` — lower than the smear variants, which keeps the echo rings discrete rather than smearing into a comet tail.
- Tether: `waveLine()` with 2–3 copies offset by ±0.003 in the perpendicular direction.

---

### Variant 10: Orbiter Dot-Column Rings (E1)
**Where/When:** Section E, 1:21–1:23 (f_0243–f_0249), E1 mandala scene tail.

**Visual description:** Small hollow target-ring glyphs, ~14–20px diameter. Always a ring/target, never a filled disc. Arranged as two vertical columns of 8–10 each, mirrored L/R of center (x≈0.38 and x≈0.62), with top/bottom symmetry within each column. 16–20 simultaneous rings on screen.

**Colors & cycling:** Three states in quick succession: (1) lavender/pink rim with teal center, (2) cyan/teal elongated pill, (3) vivid orange-amber rim with dark center. Tracks the slow mandala color cycle.

**Trail mechanics:** None — the dots appear as static positioned glyphs that scroll slowly downward without echo trails.

**Movement:** Linear downward march within each column. Column positions fixed (x fixed); y slowly decreasing/wrapping. Speed ~0.05–0.10 screen heights/s. Top/bottom symmetry within each column (top half marches down, bottom half mirrors).

**Audio reactivity:** `bass_att` → brightness and slight size enlargement on transient.

**Butterchurn implementation:** Custom SHAPES (not waves) — ~10 shapes per column at fixed x columns (x≈0.38, x≈0.62) with y values spread evenly 0.05..0.95. Animate with slow downward scroll (`y += 0.005*frame mod 1.0`). Sides=40 (circle). Size: `0.03 + 0.01*bass_att`. Mirror T/B by placing pairs at y and 1-y. Non-additive blend for crisp ring reads.

---

### Variant 11: Corner Orbiter Nodes with Waveform Tether (E3)
**Where/When:** Section E, 1:25–1:28 (f_0257–f_0267), E3 free-space fluid scene.

**Visual description:** Small glowing blob at corners (~18–25px including halo). At clearest moment shows a ring structure with a slightly darker ~5px hollow eye at center. Soft bloom rather than hard edge — fuzzy glow node. Exactly 2, always antipodal at lower-left (~0.08, 0.82) and upper-right (~0.92, 0.18).

**Colors & cycling:** Cyan/teal-white in f_0259/f_0261. Shifting to magenta/pink. In f_0263 one is cyan-white, the other is magenta-pink (asymmetric during transition). Color drifts over several seconds.

**Trail mechanics:** Smear — continuous soft motion-blur ~40–80px behind node's direction of travel. ~20–40% of node brightness. Blends into fluid background.

**Movement:** Slow arc along main diagonal axis (BL↔TR). Antipodal: when one is at BL, other is at TR. Full diagonal sweep over ~10–15s. Speed ~0.05–0.08 screen widths/s.

**Audio reactivity:** `bass` → brightness and slight size increase. `time` → orbital position.

**Tether/connection:** Thick jagged waveform line / "rope" along the BL→TR diagonal. In f_0259: converging fan of ~20 fine green-cyan lines fanning from center to the lower-left orbiter. In f_0265: single fat orange-red waveform string ~6–8px thick with dense high-frequency jitter from live audio. The tether transitions from a fan to a thick rope as the scene deepens.

**Butterchurn implementation:** Two `circleWave(qx, qy)` with `additivewave: 1`, `wave_scale: 0.03–0.04`. Positions: `q21 = 0.5+0.45*cos(time*0.15)`, etc. Tether: `waveLine()` with `a.y += amp * a.value1` where `amp` increases over scene time. Smear trail from `decay: 0.92–0.94`.

---

### Variant 12: Feathery Ring / Wireframe Donut (E4)
**Where/When:** Section E, 1:28–1:30 (f_0267–f_0271), E4 glowing ring scene.

**Visual description:** A centered hollow annulus (~160–180px outer diameter, ~70–80px inner hole). The ring band (~40–50px wide) is made of short radial filaments / spokes — a feathery/hairy texture, NOT a solid stroke. Individual filaments ~1px, densely packed. Single centered ring. Slightly tilted (~15° from horizontal), elliptical due to 3D perspective. Two-tone coloring: pale yellow-gold outer face + bright lime-green inner face in f_0271; previously single pale-gold in f_0267.

**Colors & cycling:** f_0267: pale yellow-gold ring with bright red/orange thick waveform string skewering it. f_0271: vivid pink/magenta outer filaments + bright lime-green inner face. The diagonal tether continues passing through the ring hole.

**Trail mechanics:** Smear from accumulated feedback. Soft circular blur halo ~30–50px beyond the ring boundary. ~40–60% of ring brightness.

**Movement:** Near-stationary at screen center (0.5, 0.5). Slow rotation ~0.5 rev/s. Slight drift ±10–20px. The tilt makes it appear as an ellipse (~1.0:0.85 aspect ratio).

**Audio reactivity:** `bass` → ring radius breathes. Live waveform samples → filament length/jitter (outer spokes flutter). `treb` → brightness.

**Tether/connection:** The thick diagonal waveform string (from E3) passes THROUGH the ring hole, entering lower-left and exiting upper-right. The ring is literally threaded onto the string.

**Butterchurn implementation:** A `circleWave` centered at (0.5, 0.5) with fixed radius R≈0.25. Add radial spoke displacement: `a.x = 0.5 + (R + 0.05*a.value1)*cos(theta)`. Layer two waves: one with additive green glow (inner), one with additive pink/magenta (outer filaments). Full 360°, `wave_smoothing: 0.3` so spokes are visible. R breathes with `bass: R = 0.22 + 0.06*bass`.

---

### Variant 13: Small Flanking Orbiter Dots (E5)
**Where/When:** Section E, 1:32–1:35 (f_0277–f_0287), E5 neon star-mandala scene.

**Visual description:** Small hollow ring with colored rim, ~14–18px overall diameter, 2–3px rim width, ~8–10px center hole. Exactly 2, positioned left and right of the central star-mandala at x≈0.18 and x≈0.82, y≈0.55–0.60 (slightly below center).

**Colors & cycling:** Warm hue only (red/orange/magenta) — cycles red when mandala is warm, pink when mandala is magenta. NEVER cyan or green.

**Trail mechanics:** None — sharp static glyphs with no echo.

**Movement:** Very slow lateral drift / slight orbital wobble around the mandala center. Nearly stationary relative to the mandala. Speed <0.05 screen widths over a few seconds.

**Audio reactivity:** `bass_att` → size and brightness pulse (pop larger and brighter on transient; appear as full filled pink blobs on loud beat vs. smaller rings on quiet).

**Tether:** None persistent — isolated accent companion dots.

**Butterchurn implementation:** Custom SHAPES at fixed offsets from center (`x = 0.5 ± 0.32, y ≈ 0.55`). `sides=40` (circle). `rad = 0.03 + 0.01*bass_att`. Non-additive blend for crisp rings. Add a slightly larger faint outer ring shape behind for the rim effect. Warm hue: `r=0.9+0.1*sin(time*0.3), g=0.3, b=0.2`.

---

### Variant 14: F1/F2 Bullseye Orbiter with Comet Smear
**Where/When:** Section F, 1:41–1:47 (f_0305–f_0321), Scenes F1 late and F2.

**Visual description:** Hollow ring with bright filled core — concentric-circle bullseye/target sprite. ~30–40px diameter. 2–3 concentric rings visible, 3–5px per ring. White/cream rings with a saturated yellow-gold core dot. Surrounding comet streak is red/orange/magenta. 2 simultaneously at diagonally opposite positions.

**Colors & cycling:** White/cream rings, yellow-gold core. The whole orb sits in a warm-red comet halo. The tether waveform is nearly vertical in f_0306 (two orbs stacked vertically), then rotates ~45° in a few frames.

**Trail mechanics:** Very long smear — the orb is embedded in a continuous red/magenta comet-streak that extends 40–60% of screen width along the diagonal. NOT discrete stamped echoes. Emerges from `decay: 0.96–0.98` + `zoom: 1.01–1.03` (outward zoom). The smear blends into the fluid background.

**Movement:** Arc/diagonal along lower-left to upper-right axis slowly rotating. Speed ~5–10% of screen width/s. The two orbs are at opposite ends and slowly orbit around frame center.

**Audio reactivity:** `bass` → core brightness/size pulse. `treb` → comet streak flares hotter red. `a.value1` → waveform jaggedness in connecting line.

**Tether/connection:** Dense zig-zag real-audio waveform line (red/magenta), NOT a synthetic sine.

**Butterchurn implementation:** `alcOrbiterNode(qx, qy)` or the `alcOrb` family. `additivewave: 1`. Comet smear: `decay: 0.97`, `zoom: 1.02`, slight `dx/dy` push. The smear is entirely feedback — no explicit trail drawing needed.

---

### Variant 15: F3 Corner Orbiters — Quad-Mirror Hollow Rings on Diagonal X
**Where/When:** Section F, 1:49–1:57 (f_0325–f_0349), Scene F3 moiré stripe scene.

**Visual description:** Small hollow ring, 14–20px diameter, single thin 1–2px stroke. No filled disc. 4 visible (one per quadrant / corner) due to the quad-mirror symmetry of Scene F3 — only 2 real orbs need to be drawn; the comp shader mirrors produce the other 2. Each orb sits at the end of one arm of the diagonal X waveform lines.

**Colors & cycling:** Cycles across the scene: teal/cyan (f_0328) → blue (f_0337) → blue-cyan (f_0340) → magenta/purple (f_0343). Matches the overall stripe-scene hue drift (green→magenta→red→green). Color cycling period ~15–20s.

**Trail mechanics:** None — crisp isolated shapes against the stripe background. Lower feedback (`decay ~0.90`) keeps echoes from accumulating.

**Movement:** Slow radial drift outward from center toward corners. Speed ~5–8% screen width/s. All 4 move symmetrically outward together due to the mirror.

**Audio reactivity:** `bass` → ring brightness pulse. Position along diagonal arm may be driven by `bass_att` (further out on louder passages). Color cycling driven by slow `time` function.

**Tether/connection:** Each orb sits at the end of one arm of the diagonal X waveform lines. The X-lines are the tether: fine jagged real-audio waveform lines running corner-to-corner through frame center. In f_0346 two thin diagonal jagged lines cross the frame as an X, and a hollow ring orb sits at the midpoint of each arm.

**Butterchurn implementation:** Two `circleWave(qx, qy)` with `additivewave: 0` (normal blend gives ring look without blowout). `wave_scale: 0.025–0.04`. The comp shader quad-mirror (`abs()` on uv coords) mirrors 2 real orbs into 4. Position: `q21 = 0.5 + dist*cos(time*0.08)`, `q22 = 0.5 + dist*sin(time*0.08)` where `dist` slowly increases. Color: `sin(time*0.3)` mix between teal and magenta.

---

### Variant 16: F4 Ribbon Scene — Large Green Filled Disc (Primary Orbiter)
**Where/When:** Section F, 1:57–2:00 (f_0349–f_0361), Scene F4. The most clearly resolved orbs in the entire video.

**Visual description:** Solid filled disc, NOT hollow. ~35–45px for primary (top-right), ~25–30px for secondary (bottom-left). Center brighter than edge — soft filled disc with additive bloom making center the hottest point. Bright white core with green bloom halo (~40px total including halo).

**Colors & cycling:** Vivid green — saturated grass-green/lime-green. `r=0.1, g=0.9, b=0.2` approximately. The center blows out to near-white at peak (additive).

**Trail mechanics:** Minimal on the disc itself. The connecting waveform tether has a faint echo/smear from low background decay. Just the natural softness of additive bloom.

**Movement:** Very slow diagonal drift. Top-right orb nearly stationary (anchored near upper-right). Bottom-left companion drifts more. Together move along the diagonal orientation of the ribbon. Speed <5% screen width over the full 3s F4 span.

**Audio reactivity:** `bass` → disc brightness/size pulses clearly (larger/brighter on beat). `a.value1` → tether jaggedness (direct time-domain amplitude).

**Tether/connection:** Dense jagged waveform line — fine dense zig-zag with numerous tight squiggles (confirming it is the real 512-sample time-domain waveform). This is the definitive "two circles joined by a waveform line" WMP signature, same as Dance of the Freaky Circles. **f_0352 is the canonical reference frame.**

**Butterchurn implementation:** `alcOrbiterNode(qx, qy)` — the existing kit function (white core + cycling ring). For a pure filled green disc: use `alcOrb(fillHueOff=0.28)` (green at hue offset 0.28) with `additivewave: 1`. Tether: `waveLine()` with `wave_scale: 0.5–0.8`. `decay: 0.85–0.90` (fast decay to keep background clean).

---

### Variant 17: G1/G3 Orbiter — Gradient Blob (Wireframe Tunnel Scene)
**Where/When:** Section G, 2:01–2:19 (f_0366–f_0415), G1 launch and G3 wireframe-net scenes.

**Visual description:**
- G1 launch: small solid-color filled disc ~12–14px, bright electric green (#00FF80), white-hot core, soft green glow halo ~2px radius. Two simultaneous.
- G3 wireframe: medium oval/filled gradient blob ~28–35px long axis, ~18–22px short axis (elongated along motion direction by motion blur). Layered gradient: white/gold hot core → cyan/teal mid-ring → blue-violet/purple outer halo. No sharp edge — pure continuous radial gradient.

**Colors & cycling:** G1: pure green at launch, no hue cycling. G3: gold-core/cyan-halo/purple-outer, shifting to magenta halo by f_0415 over ~6s.

**Trail mechanics:** G1: none at first launch (f_0366); short comet smear ~30–50px within 1–2 frames. G3: smooth continuous comet blur 50–80px, NOT discrete echoes. Trail head ~70% of disc brightness, tail ~5%.

**Movement:** Orbital arc around the net tunnel vanishing point (G3) or large arc along diagonal (G1). Speed G1: ~0.15–0.20 screen widths/s (faster than other variants). G3: ~0.10–0.15 screen widths/s. Clockwise orbit. Positions shift from UL/LR → UC/LC → UR/LL over ~6s. Always point-symmetric: orb B = mirror of orb A about center.

**Audio reactivity:** G1: orbital speed beat-locked. Waveform displacement on tether IS the audio signal. G3: halo brightness/size may pulse on `bass`. Comet trail length correlates with recent speed.

**Tether/connection:** G1: thin straight line at low audio → erupts into dense jagged live-waveform zigzag spanning full diagonal at high audio. G3: faint thin pale waveform/straight line through net tunnel throat — very low amplitude, nearly straight, barely visible at this scene's quiet audio.

**Butterchurn implementation:** Per CLAUDE.md memory (wave-vs-shape-coordinate-space.md): use SHAPES (not waves) for the gradient-blob disc head, because clean filled circles require shapes. But the tether waveLine endpoints must use q-vars that also drive the shape positions so they stay co-located. For G3 gradient-blob: layer TWO shapes at the same position — one small bright white/gold inner (`radius: 0.02`), one larger semi-transparent cyan-blue outer (`radius: 0.05`, lower alpha). Both additive. Smear trail: `decay: 0.97`, slight `dx/dy`. G1 disc: single small shape, `radius: 0.019–0.022`.

---

### Variant 18: H1 Orbiter Terminal Knot + I-Series Orbiters
**Where/When:** Section H, 2:25–2:52 (f_0436–f_0458) for H1 terminal knot. Section I, 2:48–3:06 for the three I-series variants.

**Visual description:**
- H1 Terminal Knot: small filled disc ~10–14px. Gradient: bright white/ice-blue core fading to soft lavender-periwinkle halo. The "orb" IS the terminal brightening of the waveform endpoint — visually indistinguishable from a very bright, slightly enlarged terminal sample of the waveform.
- I-A Orbiter Puck: larger filled disc puck ~30–90px (grows across the scene). Layered gradient: bright glowing core + darker torus ring band + outer colored halo. Slightly wider than tall (1.15:1 aspect ratio, slight downward perspective). 2 simultaneous, slow scissoring orbit.
- I-B Lightning-Line Endpoint Node: small filled disc ~15–20px, vivid green/cyan, at endpoints of diagonal lightning lines during peak Supernova.
- I-C Vanishing-Point Node: very small warm yellow/orange dot cluster ~20–30px tall at the perspective vanishing point (0.5, 0.5). Stationary.

**Colors & cycling:**
- H1: cool lavender/periwinkle-blue → ice-white → teal/cyan over ~6s. Slow palette drift, not fast cycling.
- I-A: hue cycles across amber/gold → pink/magenta → cyan-blue → red, driven by slow LFO ~0.4 rad/s.
- I-B: vivid green/cyan, high saturation lime-to-teal.
- I-C: warm yellow-amber to orange.

**Trail mechanics:** H1: no orb-specific trail; the waveform tether line IS the conceptual trail. I-A: moderate smear from `decay ~0.95`, ~1–1.5× orb diameter behind each.

**Audio reactivity:** H1: `bass` → core brightness flares whiter; slight size swell ~+20%. I-A: `bass` → core brightness and halo radius pulse strongly (beat-driven bloom). I-B: `bass` → brightness/flare amplitude.

**Butterchurn implementation:**
- H1: do NOT draw the orb as a separate shape. In `waveLine point_eqs`, boost `a.r/g/b` by 3–5× when `a.sample < 0.02` or `a.sample > 0.98` so the endpoint glows. The bright knot emerges from endpoint sample density + additive blend.
- I-A: use 2× custom SHAPES (NOT waves) — shapes draw clean filled discs. Shape frame_eqs: `s.x = 0.45 + 0.06*sin(time*0.3)`, `s.y = 0.62 + 0.03*cos(time*0.25)`. Radius: `0.04 + 0.06*bass_att`. Hue: `pal(time*0.4)`. Non-additive: `additive: 0` to prevent white-sausage blowout.
- I-B: `circleWave(qx, qy)` at lightning-line endpoints (same q-vars as waveLine endpoints for alignment). `wave_scale: 0.03`, green: `r=0.2, g=1.0, b=0.6`. `additivewave: 1`.
- I-C: small circleWave at (0.5, 0.5), `wave_scale: 0.01`, warm: `r=1.0, g=0.85, b=0.1`. OR comp-shader warm Gaussian: `ret = vec3(1.0,0.7,0.1)*exp(-d*d*400.0)*treb_att`.

---

## 2. Orb Relationships & Clustering

### Typical count: always 2 (or 2 mirrored to 4)
All orb variants in this video use exactly 2 real orbs. Never 1, never 3. The only exception is the E1 dot-column rings (16–20 positions, but those are a different motif — marching ring grid, not the orbital pair).

### Orbital relationship: always antipodal
The two orbs are always positioned at diametrically opposite points relative to a shared center (approximately frame center or the scene's vanishing point). When orb A is at position (cx + dx, cy + dy), orb B is always at (cx - dx, cy - dy). One angle variable θ drives both: A = center + R·(cos θ, sin θ), B = center - R·(cos θ, sin θ).

### Do they orbit each other or a shared center?
They orbit a shared center (approximately frame center, or the VP in corridor scenes). They do NOT spiral around each other. Their angular separation is maintained at 180° throughout.

### Orbital radius across scenes
- Section A (trail rows): R horizontal ≈ 15–25% of frame width in screen space
- Section B (corner orbiters): R ≈ 35–45% of frame width (deep corners)
- Section C/D (pulsar companion): R ≈ 35–40%, BL↔TR diagonal
- Section E (fluid scene): R ≈ 40–45%, antipodal corners
- Section F (ribbon): mostly stationary, R ≈ 30–40%
- Section G (wireframe net): R ≈ 25–30% orbiting the tunnel VP

### Tether mechanics: the connecting waveform line
The tether is ALWAYS a `waveLine()` custom wave (live audio oscilloscope). It always runs between the two orb positions. Key properties:
- **Direction**: corner-to-corner diagonal in most scenes; occasionally axis-aligned (vertical in F1, horizontal in later G scenes)
- **Displacement axis**: perpendicular to the line direction. `a.y += scale * a.value1` for a horizontal tether, or rotate by 90° for diagonal.
- **Amplitude**: `scale = 0.08–0.18` depending on scene energy. Lower = tight lightning line. Higher = wild rope.
- **At low audio**: nearly a straight line (1px). At high audio: erupts into dense jagged zigzag spanning 10–15% of frame width in perpendicular displacement.
- **Additive**: always `additive: 1` for the tether wave so it glows over the background.

---

## 3. Trail Taxonomy

### Type 1: Stepped-Echo (Discrete Stamped Rings)
**Sections**: A (Variant 1/2), B (Variant 5), D (Variant 9), G (partial).

**Appearance**: Individual past-position rings are clearly separated, each progressively smaller and fainter. Looks like a "bead chain" or "comet with ghost rings." The rings are identical in anatomy to the orb head but at reduced opacity.

**How to achieve in Butterchurn**:
- `decay: 0.92–0.96`. The lower the decay, the more visible the separation between echo rings.
- Critical: the orb must be drawn as a RING (not a filled disc) for the echo stamps to read as rings. A filled disc stamped by feedback produces a filled blob smear, not discrete rings.
- The orb must move at constant velocity so echo spacing is even.
- `zoom: 1.0` (no zoom — zoom causes the echoes to scale, destroying the ring clarity).

**Discrete echo count vs decay**:
- `decay 0.96` at 60fps → each echo has half the brightness of the previous after ~17 frames → ~5–8 clearly visible echoes
- `decay 0.93` → ~10 frames to half-brightness → ~4–6 clearly visible echoes
- `decay 0.90` → ~7 frames → ~3–4 echoes

**Opacity falloff per echo**:
- Echo 1 (most recent): ~70% of head brightness
- Echo 4: ~25%
- Echo 8: ~5% (barely visible)
- Follows: `opacity_n = (decay ^ n_frames) × head_brightness`

**Spacing between echoes** (pixels):
- Spacing = orb_speed (px/frame) × 1 frame ÷ decay_factor
- At speed 3px/frame and decay 0.94: spacing ~3px → echoes are very tightly packed
- At speed 8px/frame and decay 0.94: spacing ~8px → clearly separated beads

### Type 2: Smear Trail (Feedback-Based Comet)
**Sections**: C (Variant 6), D (Variant 8), F (Variant 14), G (Variant 17).

**Appearance**: Continuous smooth comet tail behind the orb, blending into the background. No discrete stamps. The orb appears to drag a colored tail.

**How to achieve**: High `decay: 0.94–0.98` PLUS `zoom: 1.01–1.03` (outward zoom slightly expands the buffer, stretching the tail). The zoom is critical — without it, the decay alone produces stepped echoes. With zoom, the buffer content smears into a continuous blur.

**Comet tail length** vs parameters:
- `decay 0.97 + zoom 1.02` → ~60–80px tail at 5px/frame orb speed
- `decay 0.94 + zoom 1.00` → ~30–40px tail (less smear, more stepped)
- `decay 0.98 + zoom 1.03` → very long tail, 100px+

**Color of smear**: Always matches the orb's recent hue history. If the orb was orange 10 frames ago and is now green, the tail root is green and the far end is orange. This creates the natural hue-shifted comet.

### Type 3: No Trail / Clean Glyph
**Sections**: E (Variants 10, 13), F (Variant 15), A (Variant 3 corner accents).

**How to achieve**: `decay: 0.85–0.90` (fast decay kills the echo before the next orb stamp). The orb appears as a crisp floating sprite with no ghost.

### Type 4: Waveform-Line as Trail (H1 Terminal Knot)
**Sections**: H (Variant 18 — H1 knot). The tether waveLine IS the trail conceptually — the orb endpoint glow is the terminus of the wave, not a separate element.

---

## 4. Movement Path Reference

### Path A: Circular/Elliptical Orbit (most common)
Used by: Variants 5, 8, 9, 11, 14, 17, 18.
```
θ(t) = ω·t + φ₀
cx_A = 0.5 + R·cos(θ)
cy_A = 0.5 + R·sin(θ)
cx_B = 0.5 - R·cos(θ)   // antipodal
cy_B = 0.5 - R·sin(θ)
```
Typical values:
- R (orbit radius): 0.28–0.45 in 0..1 space
- ω (angular speed): 0.2–1.0 rad/s (slower in fluid scenes, faster in G1 launch)
- Frame eqs update continuously

### Path B: Diagonal Axis with Perspective Convergence (Section A)
Two orbs on separate horizontal rails converging to a right-side VP. The orb head moves slowly left→right in local rail space while feedback pushes the buffer left, creating the receding trail row. Not a standard circular orbit.

### Path C: Slow Diagonal BL↔TR Oscillation (Sections C, D)
BL and TR positions, axes rotate slowly. Not a circular orbit — more of a pendulum along the diagonal.
```
angle_of_diagonal = π/4 + 0.02·t   // very slowly rotating diagonal
R = 0.35
cx_A = 0.5 + R·cos(angle_of_diagonal)
cy_A = 0.5 + R·sin(angle_of_diagonal)
cx_B = 0.5 - R·cos(angle_of_diagonal)
cy_B = 0.5 - R·sin(angle_of_diagonal)
```

### Path D: Near-Stationary with Small Drift (Sections C1, F4, I-A)
Orbs are effectively parked at fixed diagonal positions with tiny positional noise:
```
cx = 0.15 + 0.03·sin(time·0.3)
cy = 0.82 + 0.02·cos(time·0.25)
// second orb: (0.85, 0.18) with opposite phase
```

### Path E: Slow Scissor / Pivot (Section I-A)
Two orbs pivot around a shared midpoint with opposite phase, making a slow see-saw:
```
cx1 = 0.45 + 0.06·sin(time·0.3)
cy1 = 0.62 + 0.03·cos(time·0.25)
cx2 = 0.55 - 0.06·sin(time·0.3)
cy2 = 0.65 - 0.03·cos(time·0.25)
```

### Path F: Perspective-Projected Corridor Flow (Section A, Net Corridor)
Orbs flow through a 3D corridor, projected to a VP:
```
depth_z = (idx/count + q14) % 1.0   // q14 = march phase
proj = 1.0 / (1.0 + K * depth_z)   // K=4.0 typical
cx = (nearX - vpx) * proj + vpx
cy = (nearY - vpy) * proj + vpy
```

### Audio modulation of orbital path
- **bass_att spike** → `zoom = baseZoom - 0.025 * bass_norm` in `alcNetFrame`. The beat causes a brief zoom-in, which is the "pulse" effect on the whole corridor.
- **No direct bass→position modulation** for the orbital path. Position is time-driven; only SIZE and BRIGHTNESS react to audio per-frame.

---

## 5. Audio Reactivity Mapping

| Visual Parameter | Audio Band | Mapping Function | Typical Range |
|---|---|---|---|
| Orb disc/ring SIZE (radius) | `bass_att` | `r = r_base + r_mod * bass_att` | r_base: 0.02–0.05; r_mod: 0.01–0.03 |
| Orb core BRIGHTNESS | `bass_att` | `brightness = base + (bass_att - 1) * 2.0` (clamped) | Boosts 20–60% on kick |
| Orb halo/glow RADIUS | `bass_att` | Same as size, but for outer shape/halo | Expands ~30% on kick |
| Ring glow BRIGHTNESS | `treb_att` | `ring_b = 0.7 + 0.6 * treb_att` | Brighter on high freq transients |
| Tether JAGGEDNESS / amplitude | `value1` (time-domain) | `a.y += 0.12 * a.value1` (raw sample displacement) | 0 = straight line; ±0.15 = wild rope |
| Tether WIDTH / thickness | `mid_att` | `wave_scale = 0.3 + 0.5 * mid_att` | Thicker on mid-heavy passages |
| Orbital SPEED | None (time-driven) | Speed is constant per scene; not audio-modulated in the reference | Fixed ω per scene |
| Hue CYCLE SPEED | `(bass + mid) / 2` | `hue += dt * (0.02 + 0.05 * energy)` | Slightly faster on energetic passages |
| Camera ZOOM (feedback) | `bass_att` | `zoom = baseZoom - 0.025 * bass_norm` | Subtle beat-dive |
| Echo COUNT visible | `treb` | Higher treb → more new stamp echoes appear per unit time | Subjective; not a direct mapping |
| Comet tail LENGTH | `treb_energy` | Longer tail when more treble energy | Feedback-indirect |
| Waveform filament flutter | `value1`/`value2` | Raw PCM samples drive spoke displacement in Feathery Ring | Direct PCM |

---

## 6. Implementation Priority for Net Corridor Scene

The Net Corridor scene currently has `makeOrbTrailShapes(8)` — custom shapes producing a filled head + hollow shrinking rings on a wavy path receding to a VP. Per the RESUME.md notes: "Circles still bunch toward VP; head/trail balance off."

### Priority 1 (implement first): Variant 9 — D4 Bead-Chain Stepped-Echo Trail
**Why first:** The clearest, most distinctive feature of the Alchemy orbiter not yet achieved. Currently the corridor has a smear (high decay) when it should have discrete bead rings.

**Fix:** Switch from `decay: 0.97` to `decay: 0.93–0.94`. Remove `zoom > 1.0`. The orb shape must be drawn as a RING (thin outline), not a filled disc, so the echo stamps read as rings not blobs. Use `makeOrbTrailShapes()` but set `fillA = 0` for trail positions (only the head position at `raw < 0.12` gets the filled core; all others get only `border_a > 0` ring).

**Key parameters:**
```javascript
// In makeOrbTrailShapes frame_eqs:
var isHead = raw < 0.12;
s.a  = isHead ? (0.85 * fade) : 0;        // HEAD: filled; trail: transparent fill
s.a2 = isHead ? (0.4 * fade) : 0;
s.border_a = 0.85 * fade;                  // ALL positions: ring outline always drawn
// decay in baseVals:
decay: 0.93
// zoom: remove or set to 0.999 (very slight inward)
```

### Priority 2: Variant 16 — F4 Green Filled Disc with Tether (the "money shot")
**Why second:** The clearest canonical reference for the WMP "two circles joined by a waveform" signature. f_0352 is the definitive implementation reference. Currently the corridor has no waveform tether between the two leading orbs — adding this transforms the look.

**Fix:** Add a `waveLine()` custom wave connecting the two corridor head orb positions (q21/q22 and q23/q24).

**Key parameters:**
```javascript
// In frame_eqs:
t.q21 = 0.14 + 0.04*Math.sin(time*0.3);   // left head X
t.q22 = 0.45 + 0.03*Math.cos(time*0.25);  // left head Y
t.q23 = 0.14 + 0.04*Math.sin(time*0.3 + Math.PI); // right head X
t.q24 = 0.55 + 0.03*Math.cos(time*0.25 + Math.PI);
// waveLine point_eqs:
var ax = a.q21, ay = a.q22, bx = a.q23, by = a.q24;
var frac = a.sample;
a.x = ax + frac*(bx - ax) + 0.12 * a.value1 * (-(by-ay));
a.y = ay + frac*(by - ay) + 0.12 * a.value1 * (bx - ax);
a.r = 0.2; a.g = 1.0; a.b = 0.4;  // green
```

### Priority 3: Variant 8 — D1 Large Glowing Orbiter Halo (the "Dance" pattern)
**Why third:** The concentric-ring halo "small sun with rings" is the most WMP-recognizable orbiter.

**Fix:** Ensure `q7 = 0.10 + 0.05*bass_norm`. The key visual is CONTRAST between the white inner core and the colored outer ring. Ring band width ~16% of total radius (the `0.92..1.06×r` annulus in `alcOrbiterNode`).

### Priority 4: Variant 5 — B3 Orbiter-CometHead with Stepped Echo Train
**Fix:** Cap max projection depth so orbs never bunch at VP: `raw = Math.min(raw, 0.85)`. Combined with decay 0.93, this gives clearly-spaced echoes across the full corridor depth.

### Priority 5: Variant 17 — G3 Gradient Blob (White-Gold Core + Cyan Halo)
**Fix:** Layer TWO shapes per orb position — one small bright white/gold inner (`radius: 0.02`), one larger semi-transparent cyan-blue outer (`radius: 0.05`, lower alpha). Both additive.

### Priority 6: Dotted Fine Trail
Implement as a short `waveLine` with `usedots: 1`, very low `a` (0.3–0.4), marching along the orbital path.

### Priority 7: Variant 3 / Variant 13 — Corner Accent Orbs / Flanking Dots
Use custom SHAPES at fixed offset positions from center. Implement only after lead orb motif is satisfactory.

---

## Quick Parameter Reference Card

```
Stepped-echo trail:  decay 0.93-0.95, zoom 0.998-1.000
Smear trail:         decay 0.96-0.98, zoom 1.01-1.03
No trail:            decay 0.85-0.90, zoom 0.995-0.999

Orb ring anatomy:
  fill samples:   0.00 - 0.60 (dense sqrt-spiral → solid disc)
  ring samples:   0.60 - 1.00 (annulus 0.92..1.06 × rad)

Orbital radius (0..1 space):   0.28 - 0.45
Orbital speed:                 0.2 - 1.0 rad/s
Orbit update in frame_eqs:     q21/q22/q23/q24

Tether (waveLine) displacement: 0.08 - 0.18 × a.value1
Tether for doubled look:        two offset copies ±0.003 perp

Hue cycling speeds:
  Fast (4s per cycle):   hue += dt * 0.25
  Medium (15s cycle):    hue += dt * 0.067
  Slow (60s cycle):      hue += dt * 0.017

Bass reactivity multiplier:   1.0 + (bass_att - 1.0) * 0.5
Treb brightness multiplier:   0.7 + 0.6 * treb_att

Custom wave cap: ≤6 enabled waves total (Butterchurn hard limit)
Custom shapes:   8-10 render reliably
additive:0 for shapes (prevents white sausage blowout)
additive:1 for waves that need glow (tether, accent rings)
```

---

*Source: frame-by-frame analysis of WMP Alchemy reference video, all 9 sections (0:00–3:06 of `YouTube 1080p 60fps Download.mp4`), cross-referenced with existing kit functions in `wmp-presets.js`. 10 subagents × section analysis + synthesis. 2026-06-16.*
