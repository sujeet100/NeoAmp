# Alchemy V4 — build spec (synthesized from the reference, 2026-06-17)

Source: a fan-out analysis of `Alchemy Random Media Player 480p.mp4` (15 per-mechanism
motion bursts + the 7 macro montages). The 16 analyzed looks **collapse to 6 base
mechanisms** — all the SAME feedback engine under different (fold, camera, emitter,
palette, density). This is the basis for `presets/alchemy-v4.js`.

## The engine (one preset)
Feedback warp loop (zoom/rot/swirl/translate + decay, all in a custom warp shader) +
a kaleidoscope coordinate fold, fed each frame by **4 reconfigurable custom-wave
emitters** drawing the LIVE audio waveform, recolored in a comp shader by a drifting
muted two-tone palette with Reinhard tone-mapping, driven by a macro-director in
`frame_eqs` that continuously eases ~9 knobs toward per-scene targets and retargets on a
non-periodic dwell. Structure is always DRAWN; feedback only smears/multiplies (glow +
the kaleidoscope copies) → density, never hollow.

## 1. The 6 mechanisms
| # | Look | fold | camera (intent) | emitter | palette | density |
|---|---|---|---|---|---|---|
| M0 | Cold-open sparks | 1 | static | RINGS/STALKS sparse | near-black + 1 neon | sparse |
| M1 | Free-space orbs+tether (the WMP signature) | 1 | slight outward, drift up-right | ORBS+TETHER | teal↔amber | medium |
| M2 | Dandelion / urchin burst ("growing stalks") | 1–2 | slight bloom, upward dy | DANDELION (+orbs) | green↔lime↔magenta cycle | med–dense |
| M3 | X-bowtie kaleidoscope | 4 | outward+CW rot, OR inward+swirl (vortex-wind) | FLOWER/DANDELION folded | green↔magenta + gold bands | dense |
| M4 | Quad bullseye + central rosette | 4 | inward steady, faint swirl | FLOWER (central) | warm amber/olive + green lobes (fixed) | medium |
| M5 | Vortex-swirl smear | 1–2 | inward + ramping rot + swirl 0.06–0.12, pivot off-center | RINGS/ORBS | teal↔lavender | sparse–med |
| M6 | Perspective-floor / vertical-rain | 1→2 | recede zoom, rot 0→+0.03, dx/dy drift | STALKS (sawtooth ribbon) | olive↔magenta | medium |

ORBS+TETHER is the recurring signature and can overlay any mechanism. Wedges/bands/X-arms,
bead-chains, ladder-stripes, quilt grids are **feedback artifacts** of one moving emitter —
never drawn explicitly.

## 2. The 9 director knobs (continuous, eased)
- **zoomRate** ±0.04 (our convention: + = inward/tunnel, − = outward/explode; home ≈ 0)
- **rot** −0.05 → +0.03 rad/frame (− = CW M3 bowtie, + = CCW M5 vortex)
- **swirl** 0 → 0.12 (radius-scaled rotation term; vortex)
- **dx** ±0.006, **dy** −0.006 → +0.016 (feedback re-feed offset = rakes/comets/rain)
- **mirrorFold** {1 free, 2 bilateral, 4 quad-X, 6–8 mandala}; `foldStrength` eases 0→1
- **emitterMode** {FLOWER, ORBS+TETHER, DANDELION, STALKS, RINGS}; crossfade via emitterAlpha dip
- **palettePhase** 0→1 indexes a complementary two-tone; biases home to **green/teal**
- **exposure** 0.5 (open/end) → 1.6 (peak); +bass_att transient bloom

## 3. Emitter geometry (4 wave slots, reconfigured per mode; displacement from live value1/value2)
- **FLOWER**: w0 central rosette ~16–24 spokes (radius = baseR + value1·reach); w1 horizontal
  waveform bar; w2/w3 flanking almond-lobe rings.
- **ORBS+TETHER**: w0/w1 orb rings at roaming anchors A,B; w2 tether waveLine A→B (perp disp
  = value1, jagged); w3 braided 2nd strand (value2 phase-shifted).
- **DANDELION**: w0 dense ~30–80-spoke burst from midpoint; w1/w2 orb rings; w3 tether/bead.
- **STALKS**: w0/w1 vertical waveform stalks near edges; w2 zigzag ribbon; w3 accent.
- **RINGS**: w0/w1 concentric-ring (bullseye) orbs (8 rings via sample banding); w2 tether; w3 seam.
Waves: 512 samples, additive, smoothing ≈0.18 (jagged), thick 1.

## 4. Palette — muted-but-luminous (hard rule)
Complementary two-tone: foreground = `pal(phase)`, background = `pal(phase+0.5)`, both
desaturated; ramp dim→bg(ambient, never black)→fg(mid)→toward-white(hot core). Reinhard
tone-map `c/(c+~0.6)` so additive cores compress to soft color, never flat white. Energy
mixes cool(quiet)→warm(loud). Home schemes = teal/amber (S1) + teal/lavender (S6); rare
rainbow. Within-era hue creep ~0.02–0.04/s.

## 5. Pacing + transitions
Dwell mixture: 60% U(6,12)s, 20% U(3,5)s, 20% U(18,25)s (never a metronome). ~75% smooth
morph (ease all knobs over 1.5–2.5s, feedback decay does the cross-dissolve); ~25% snap
(0.4–0.6s, biased to fold/era flips). Anti-repeat: never the same mechanism twice in a row;
change palette family; bias ~1-in-3 returns to green/teal home. For a LIVE visualizer we
couple exposure/density to live energy (louder→brighter/denser) instead of scripting the
demo song's 228s arc.

## 6. Starting values (first cut)
decay ≈0.95 (0.92 short M1 .. 0.97 long M5) — applied in the WARP shader (baseVal decay has
no effect in this build); gammaadj ≈1.6; wave_smoothing 0.18; tone-map k=0.6; exposure home
1.0; transitionTime 2.0s morph / 0.5s snap; hue creep 0.02/s. Per-frame: zoomRate +=
0.004·bass_att; exposure ·= (1+0.25·bass_att); reach = (0.10+0.06·bass_att)·density;
emitter displacement = value1·(0.5+0.5·treb).

Full per-clip analyses: workflow run `wf_3eb803b9-d76` (task `wnb1aomof`).
