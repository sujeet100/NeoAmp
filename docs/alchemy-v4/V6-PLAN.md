# Alchemy V6 — Background / Parallax / Paint / Color: Build Plan

_Synthesized 2026-06-21 from a 7-agent reverse-engineering workflow (6 video-analysis + 1 synthesis) over `Alchemy Random Media Player 480p.mp4` + `YouTube 1080p 60fps Download.mp4`, reconciled against alchemy-v4.js + kit.js, cross-checked with the user's frame reads and Gemini's notes. V6 takes alchemy-v4.js as base. Read with MISTAKES.md (§8) + FINDINGS-AND-REBUILD-PLAN.md + V5-HANDOFF.md._

## DIAGNOSIS — why v4 backgrounds read static/wrong

V4's backgrounds read static/wrong for three structural reasons, all visible in COMP_V4/WARP_V4:

(1) ONE background regime where the original has TWO. COMP_V4 always builds an fbm "fusion" ground (`fbm(w*1.3)`, lines 118-121) regardless of look. The original alternates between a DUSTY MOTIF-PAINTED WASH (no intrinsic field at all — the soft green/amber cloud IS the decayed average of what the orbs/anemone/tether deposited; proof: probe_480p is pure soft green with the red anemone painted on it and only one stray yellow orb-smear) and INTRINSIC HIGH-SAT SYMMETRIC fields (4-fold X-wedges 75-95% sat, concentric bullseyes, sine bands, vortex spirals, wallpaper tilings). fbm gives a perpetually-present mottled mid-frame fog that reads neither as the clean single-hue wash NOR as the bold structured fields. The wash should EMERGE from paint+decay, not be generated.

(2) The fbm field is recomputed every frame in screen space, so it does NOT move with parallax. It swirls in place (`time*0.04` advection inside the noise) but never recedes toward a vanishing point, never spirals, never shears. The only camera in WARP_V4 is a near-symmetric zoom/rot/swirl about a pivot that, while technically off-center via q20/q27, sits at rest-zoom ~0 (`L("zoom")` is 0 or ±0.018) with the pivot pan amplitude tiny (0.02-0.06). There is no perspective-shear of the OLD buffer referenced to an off-center VP (the `pd /= max(1.0 + q28*pd.y,...)` divisor at line 48 is center-referenced and q28/tilt is small), no persistent inward recede, and the vortex 1/r term (line 50) is gated to q17 swirl which is 0 on most looks. Net: uniform breathing/spin = no foreground-vs-background speed differential = flat.

(3) Saturation is single-valued. The de-wash pass (lines 174-177: Reinhard k=0.6, resaturate 1.22, darks-deepen 0.72) is applied globally. There is no per-scene SAT target, so the bold X-wedge/kaleido scenes can never hit ~0.85 sat while the wash scenes stay ~0.3. The fold path (lines 137-146) does produce bold complementary panes, but it is the ONLY structured field and it's bolted onto the same fbm ground rather than being one of a family of intrinsic generators. Color also drifts via a single global hue clock q8 (alcHueClock 0.02/0.05) with NO spatial hue ramps — so "multicolor" can only come from temporal cycling, never from the radial/angular/along-wave spatial gradients the original uses for its vivid scenes.

Secondary: motif paint is too saturated/neon (no luminance-gated desaturation of the deposited cloud), the tether is correctly alpha-blended but orbs are solid filled discs (orbShape) not ring-outline + offset pink fill, and there is no per-scene/per-layer decay split (one q1 governs both the crisp short-trail tether AND any long-stacked fan).

## BACKGROUND ARCHITECTURE (V6)

V6 splits the background into a per-scene BG_MODE selector (var q29 widened to 0..9, fed by bgPick) that switches the COMP background GENERATOR, plus a hard rule that the WARP owns field GEOMETRY (fold/spiral/shear/recede) and the COMP owns field COLOR (which hue at this folded-angle/radius/tile-coord, at what saturation). Two families:

INTRINSIC-FIELD modes (high sat, parallax via the warp transforming whatever symmetry the warp folded):
- 0 = MOTIF-WASH (the dominant ambient look — NO intrinsic field; see paintPlan). COMP just samples the warped buffer, lifts it ~5%, adds a faint per-scene low-sat tint that drifts complementary to the motif hue, Reinhard. decay 0.94.
- 1 = X-WEDGE FOLD: WARP folds angle to 4 wedges; COMP quantizes folded-angle into hue bands `wedge=floor(pang/seam); hue=q8+wedge*0.28`, sat ~0.85. The hard diagonal seam = the fold discontinuity.
- 2 = BULLSEYE RINGS: `rings=fract(pr*8.0 - time*0.15); col=pal(q8+rings)`, sat ~0.7. WARP slow zoom expands rings outward (parallax recede).
- 3 = HORIZONTAL SINE BANDS: `w=sin(uv.y*5.0 + sin(uv.x*3.0+time)*0.6); col=mix(pal(q8),pal(q8+0.35),step(0,w))`, sat ~0.7.
- 4 = QUAD-MIRROR MANDALA: WARP does abs(pd) before sampling (fold=4 already wired); COMP applies a green-dominant hue gradient across the folded radius. sat ~0.75.
- 5 = TILT PLANES: WARP applies perspective-shear about an OFF-center VP + diagonal roll; COMP tints by a low-freq gradient along the tilt axis `pal(q8+dot(pdc,tiltDir)*1.5)`. sat ~0.5.
- 6 = VORTEX SPIRAL: WARP rotate-about-eye with 1/r swirl + inward pull; COMP soft teal/lavender milky, sat ~0.45, decay 0.95.
- 7 = WALLPAPER TILING: `t2=fract(uv*10.0 + scroll); dot=smoothstep(r,r-0.02,length(t2-0.5)); col=mix(tileBg,tileFg,dot)`, sat ~0.55.
- 8 = VERTICAL PICKETS / PERSP FLOOR: `step(fract(uv.x*N/(uv.y+0.3)),0.5)`, sat ~0.5.
- 9 = NEON-ON-DARK: near-black base, low decay 0.86, all color from additive wave/shape geometry (the PAINTED extreme — reuse mode-0's paint with a black base + short trail).

The fbm fusion is RETIRED as the default ground (it matched no reference regime cleanly). Keep fbm ONLY as a subtle texture multiplier (≤0.15 amplitude) on the wash/tilt grounds to add "tooth," never as the dominant field.

VIBRANT + NON-FLAT + PARALLAX: (a) saturation is per-scene (computed in-shader from q29 ranges, no new q-var) so bold scenes hit 0.85 and washes stay ~0.35; (b) NEVER flat — keep the asymmetric off-center color pool + one-edge plume from COMP_V4 (lines 149-152, they work) under every mode; (c) parallax always-on — feed the WARP an off-center, time-DRIFTING pivot with a small persistent zoom/rot even in wash mode, and DECOUPLE the warp pivot (roams, q20/q27) from the motif center (screen, q2/q3=0.5) so the field recedes/spirals behind a steadier motif (see parallaxPlan). Available kit fields to reuse for the dustier grounds: alcAurora, alcMarble, alcMoire/alcMoireStripes, alcHorizonBands — feed them the dusty scene tones, weight ≤0.5, re-Reinhard.

## PARALLAX PLAN

Concrete WARP changes. The single highest-leverage fix: make the pivot OFF-CENTER + TIME-VARYING and apply NON-symmetric transforms (perspective-shear, off-center recede, 1/r vortex) to the OLD buffer. Because displacement = transform(pd) and pd grows with distance-from-pivot, an off-center pivot alone makes edge geometry move 5-10x faster than near-pivot geometry — the readable parallax.

q-var scheme (engine reads q1, q12-q20, q27-q32; keep the split):
- q20=pivotX, q27=pivotY: in frame() set an OFF-center, drifting VP. `q20 = L("px") + 0.13*sin(time*0.07)`, `q27 = L("py") + 0.11*cos(time*0.05)`, with per-look px/py biased toward a corner (~0.30 or ~0.70) for tilt/vortex/tunnel looks, ~0.5 for mandala (flat exception). Current pan amplitude (0.02-0.06) is too small — raise to 0.10-0.14.
- q28=tilt (perspective-shear strength, 0..1.2): in WARP replace the center-referenced divisor (line 48) with a VP-referenced single-ended shear `pd /= max(1.0 + q28*(uv.y - q27), 0.25);` so the plane compresses toward the VP row, not symmetrically about center. Drive q28 from the look (0 for free-space, 0.6-1.0 for tilt-plane/picket looks). Add a diagonal roll so the horizon isn't axis-aligned: raise q16 roll amplitude to ±~7° (`0.12*sin(time*0.05)`).
- q15=zoom (persistent recede/dolly): currently pinned near 0. For tunnel/recede looks set q15 ~ -0.03..-0.05 (`pd*=(1+q15)` shrinks the sample → echo-stacks build toward the VP); for dolly-in/burst looks q15 ~ +0.015..+0.03; bass-spike it `q15 += 0.012*(bass_att-1)`. NEVER leave it at 0 for non-wash looks.
- q17=swirl + a strengthened 1/r vortex term. The existing line 50 (`pang = q16 + q17*pr + q17*0.10/(pr*6+1)`) has the 1/r piece but it is weak and tied to q17. For the vortex look strengthen the 1/r coefficient (route the vortex magnitude through q17) so inner rotation is 2-3x faster than outer → the log-spiral comma arms. Pair with q15<0 inward pull about the OFF-center eye (q20/q27 → ~0.42,0.45). decay 0.95 for the milky winding smear.
- ECHO-STACK depth: for the stacked-waveform terrain, add a tiny per-frame depth translate via the existing q18/q19 dx/dy plus pd*=0.985, decay ~0.95 so 5-8 receding copies survive.

Aspect-correct all distance math: pd.x *= asp before the polar/length ops (already at line 39), undo pd.x /= asp before sampling (line 54) — keep so the spiral/eye stays circular not oval.

Per-look weights are crossfaded by lookPick (existing) so the preset flows tilted-plane → vortex → tunnel → picket-floor → free-space without cuts. Reuse the unused kit drivers (alcCamVortex/alcCamRoll/alcCamPlunge/alcCamFloat) for the audio-reactive dive/suction/handheld terms. Verify in selfrender that foreground beads streak while the VP stays put (force q28=0.8, q20=0.3 to test the tilt; force q17 high + q15=-0.04 to test the vortex).

## PAINT PLAN (milky well-defined spreading colour)

The dominant ambient background (MOTIF-WASH, BG_MODE 0) must EMERGE from motif/orb/tether paint + decay, not be generated. This is the biggest conceptual fix.

DEPOSIT (waves/shapes drawn fresh each frame, additive, MODEST alpha so OVERLAP does the milky build-up):
- Motif waves: per-sample alpha 0.12-0.30 (keep dense bristle modes — spindle/fountain/anemone — at 0.4-0.5 to avoid the milky-out gotcha §8). Set wave color to the motif's OWN hue directly (a.r/a.g/a.b from pal(q8+off)). Do NOT pre-whiten — let additive accumulation + tone-map produce the pastel.
- Gate paint on density/beat: scale deposit alpha by a paint-enable factor `deposit_a = baseA * clamp(paintGate)` where paintGate rises with bass_att and motif compactness, so sparse/quiet passages glide without staining (matches the 480_open sparse-no-paint regime).
- Beat bloom: `deposit_gain = 0.6 + 0.9*bass_att` and pulse motif scale `q5 *= 1 + 0.15*bass` (q5 breathing already exists) so peaks dump a momentary brighter/bigger cloud that rides decay down.

DECAY + SPREAD (the WARP smears+fades the deposited ink into a soft well-defined cloud):
- decay (q1) ~0.92 for wash (range 0.90-0.94). Apply a SMALL outward zoom (q15 ~ +0.004..+0.010) + tiny swirl about the pivot for gentle drift. CRITICAL: do NOT add high-frequency fbm/turbulence to the warp sample coords (suv) — that foams the well-defined halo into fog (the V5 mistake + gotcha). Keep the warp blur LOW-frequency (the existing 5-tap at lines 56-61 is fine; do not add noise advection to suv).
- decay≈0.92 + zoom≈+0.006 self-limits the halo to ~1.5-2x motif radius (bounded island, not full-frame). Verify in selfrender it doesn't creep to the edges; if it does, lower zoom toward +0.003 or decay toward 0.90.

PASTELIZE in COMP (the deposit must read milky pastel S≈23-40%, V capped ~0.8 — half the motif core's saturation — NOT neon):
After sampling/dilating the warped buffer (`sharp`), push saturation DOWN where bright:
`vec3 hsv = rgb2hsv(sharp); hsv.y *= mix(1.0, 0.45, smoothstep(0.4,0.9,hsv.z)); hsv.z = min(hsv.z, 0.82); sharp = hsv2rgb(hsv);`
(add a compact rgb2hsv/hsv2rgb pair to COMP). This reproduces deposited_S ≈ 0.45x core, V capped ~0.8. Then Reinhard the FINAL with k≈0.6-0.9 so the additive pile becomes soft pastel pink/violet instead of clipping to flat white. SKIP this pastelize in the fold/kaleido modes (1/4) so those stay vivid — gate it on BG_MODE.

EDGE DEFINITION via contrast: build the wash base color as a LOW-value (V≈0.35-0.40), OPPOSITE-hue tint relative to the active motif hue (green under pink, teal under violet, purple under gold): base hue = q8 + 0.5 (complementary), low sat, so the pastel island always pops. The COMP_V4 ground darkening (line 153) already deepens toward edges — keep it; just make the base hue complementary.

Layer the slow temporal hue clock onto the deposited cloud's hue in COMP so an old pink cloud drifts toward violet/cyan over ~10s (the "colors shift as they sit" feel). ORBS: the orb FILL is the heavy-additive layer (big gaussian, tone-mapped creamy); the orb RING and the tether stay alpha-blended/crisp on the SHORT-trail path. LINES: tether alpha-blended (crisp thread, short trail); rotating-line fan gets high decay (0.96) so the few source lines' swept history stacks into the parallel-thread comb.

## COLOUR / HUE-SPEED PLAN

TWO sources of multicolor, implemented separately (the key insight: vivid "many colors at once" is SPATIAL, not fast temporal cycling).

TEMPORAL (slow, smooth, per-scene base drift — measured +/-2 to +20 deg/s, full family change every 20-90s):
- Hue clock q8 = alcHueClock(q8, dt, max(0,energy-1), base=0.03, gain=0.05) — bump base from V4's 0.02 to 0.03 cyc/s (~11 deg/s), cap effective rate at ~0.08 cyc/s. This is the ONLY thing driving color when a scene is held.
- NO beat-synced hue snaps (they read jerky — V5 confirmed). Route bass/treb to brightness (q31 exposure, already done) and zoom (q15), at most a tiny +/-5 deg hue wobble.
- Scene CUTS: when bgPick or motifPick transitions, step q8 origin by a random 60-160 deg (+0.17..0.44 cyc) so the palette family flips, then holds + slow-drifts. The makePicker crossfade smooths the geometry; let the hue step ride it.

SPATIAL (the vivid multicolor — frozen or only slowly rotating, used per BG_MODE):
- RADIAL RAMP (bullseye/lens-band, mode 2): `ret = pal(q8 + pr*RING_FREQ)` with RING_FREQ ~1.3 cyc per unit radius (~8 in radians). Full radial rainbow in one frame, only slow temporal motion of q8.
- ANGULAR WEDGES (X-fold, mode 1): `sector = floor((pang+PI)/(TAU/NSEC)); ret = pal(q8 + sector*0.28)` with NSEC 6-8 → hard-edged gold/magenta/cyan wedges.
- ALONG-WAVE rainbow (filaments/dandelion/ribbon/star/X): set wave point color from a.sample: `a.r/g/b = pal(q8 + a.sample*SPREAD)` with SPREAD 0.7-1.0 cyc, so the 512 live samples carry a hue ramp base→tip (fRibbon/fWaveFan already do a version — extend SPREAD and apply to fStarNet/fCrossX).
- DIAGONAL WASH (free-space): `pal(q8 + dot(pdc, dirVec)*1.5)`.

SATURATION TARGETS (per-scene, the large measured gap): spatial-multicolor scenes (X-fold/bullseye/bands/mandala) sat ~0.85; plain drift/wash scenes sat ~0.30-0.45 (respects the muted rule); tilt/vortex/wallpaper ~0.45-0.55. Implement WITHOUT a new q-var: compute SAT in-shader from BG_MODE (q29) via ranges, e.g. `sat = (m==1||m==2||m==3||m==4) ? 0.85 : (m==0||m==9) ? 0.35 : 0.5;` (q11 is the only free control var and it's the focus/pupil amount — don't spend it). Apply: `vec3 c = pal(h); float l=dot(c,vec3(0.333)); c = mix(vec3(l), c, sat);`

SUMMARY KNOBS: hueBase 0.03 cyc/s (+up to 0.05 from energy, cap 0.08); RING_FREQ 1.3; NSEC 6-8; along-wave SPREAD 0.8; sat 0.85 spatial / 0.35 wash / 0.5 mid; cut hue-step +0.17..0.44 cyc per scene transition; no beat hue snap.

## BUILD STEPS (each = one commit, self-render before showing the user)

### 1. Retire fbm as the default ground; add the BG_MODE switch scaffold
- **What:** Widen q29 to 0..9 in frame() (bgPick over ~9 variants). In COMP_V4 replace the unconditional fbm fusion ground (lines 118-121) with a `vec3 ground` selected by floor(q29+0.5): mode 0 = wash (ground = dusty(pal(q8+0.5),0.35)*0.4, a low-V complementary tint). Leave modes 1-9 falling through to the existing fbm for now; wire them in later steps. Keep the asymmetric pool + plume + edge-darken (lines 149-153).
- **Where:** presets/alchemy-v4.js — COMP_V4 string + frame() bgPick/q29
- **Validate:** node --check + concat-frame_eqs harness; selfrender 'Alchemy V4: Random' t=2,5,8 — mode-0 frames show a near-empty dim complementary-tinted field (the wash base), not busy fbm mottle.

### 2. Make the wash EMERGE from paint (mode 0): pastelize + complementary base
- **What:** Add compact rgb2hsv/hsv2rgb to COMP. After building `sharp`, in mode 0/9 push saturation down where bright: hsv.y*=mix(1.0,0.45,smoothstep(0.4,0.9,hsv.z)); hsv.z=min(hsv.z,0.82). Wash base hue = q8+0.5 (complementary). Keep motif wave colors at their own hue.
- **Where:** COMP_V4 (sharp post-process + ground base)
- **Validate:** selfrender t=3,6 — sharp motif reads as a pastel island (S~0.4) on a dark complementary ground, not neon; no full-frame fog.

### 3. Off-center drifting pivot + raised pan amplitude (parallax foundation)
- **What:** frame(): q20 = L('px') + 0.13*sin(time*0.07); q27 = L('py') + 0.11*cos(time*0.05). Bias per-look px/py to corners (0.30/0.70) for tilt/vortex/tunnel LOOKS; keep 0.5 for mandala. Raise LOOKS pan to 0.10-0.14.
- **Where:** frame() q20/q27 + LOOKS table
- **Validate:** selfrender 4 sequential frames (t=2,2.5,3,3.5) — field slides/recedes toward the off-center VP while the motif holds center; edge content moves faster than near-VP content.

### 4. VP-referenced perspective-shear (tilt-plane look)
- **What:** In WARP_V4 replace `pd /= max(1.0 + q28*pd.y, 0.25)` (line 48) with `pd /= max(1.0 + q28*(uv.y - q27), 0.25)`. Raise q28 to 0.6-1.0 on tilt/picket LOOKS. Add diagonal roll via raised q16 amplitude (0.12*sin(time*0.05), ~±7°).
- **Where:** WARP_V4 shear divisor + frame() q28/q16 + LOOKS tilt
- **Validate:** Force q28=0.8, q20=0.3,q27=0.3 (__DEBUG__), selfrender — a ground plane recedes diagonally toward the off-center VP, near-edge big, far-edge compressed.

### 5. Persistent recede/dolly (q15) per look + strengthened 1/r vortex
- **What:** Stop pinning q15 near 0. tunnel/recede looks q15 ~ -0.04; dolly/burst looks q15 ~ +0.02; bass-spike q15 += 0.012*(bass_att-1). Strengthen the WARP vortex 1/r coefficient (route vortex magnitude through q17) so inner rotation 2-3x outer; pair with q15<0 inward pull about eye q20/q27~0.42,0.45, decay 0.95.
- **Where:** frame() q15 per look + WARP_V4 pang 1/r term + vortex LOOK
- **Validate:** Force the vortex look (__DEBUG__), selfrender 4 frames — comma/log-spiral arms wind toward the off-center eye; content shrinks+fades inward.

### 6. Intrinsic-field generators in COMP: X-wedge (1), bullseye (2), sine-bands (3)
- **What:** Add spatial-color branches by floor(q29): 1 = angular wedges pal(q8+floor((pang+PI)/(TAU/6))*0.28) sat 0.85; 2 = pal(q8+pr*1.3) sat 0.7 with WARP slow zoom expanding rings; 3 = sine bands mix(pal(q8),pal(q8+0.35),step(0,sin(uv.y*5+sin(uv.x*3+time)*0.6))) sat 0.7. Gate the mode-0 pastelize OFF for modes 1-4.
- **Where:** COMP_V4 ground-select branches
- **Validate:** selfrender forcing q29=1,2,3 — bold X-wedges / concentric rainbow rings / wavy horizontal bands, high sat, not fbm mottle.

### 7. Quad-mandala (4), tilt (5), vortex (6), wallpaper (7), pickets (8), neon-dark (9) + per-scene SAT
- **What:** 4 = green-dominant hue gradient over the abs(pd)-folded coord (WARP fold=4 wired); 5 = pal(q8+dot(pdc,tiltDir)*1.5) sat 0.5; 6 = soft teal/lavender milky sat 0.45 decay 0.95; 7 = fract(uv*10+scroll) dot lattice sat 0.55; 8 = perspective vertical pickets sat 0.5; 9 = near-black base + decay 0.86 (paint dominates). Per-scene SAT computed in-shader from q29 range (no new var).
- **Where:** COMP_V4 branches + per-look decay floor for 6/9
- **Validate:** selfrender forcing q29 = 4..9 — each matches its reference regime; mode 9 is black with bright painted geometry.

### 8. Hue: bump base rate, scene-cut hue step, along-wave SPREAD
- **What:** alcHueClock base 0.02->0.03. On bgPick/motifPick transition step q8 origin by random 60-160deg. Extend along-wave hue SPREAD to ~0.8 in fRibbon/fWaveFan; add to fStarNet/fCrossX. Keep NO beat hue snap.
- **Where:** frame() hue clock + picker-transition hook + the wave point fns
- **Validate:** concat-frame_eqs harness over many frames; selfrender t=2..20 confirming slow drift within a scene + a flip at a transition; filament modes show base->tip hue ramp.

### 9. Orbs as ring-outline + offset gaussian fill (ring color != fill color)
- **What:** Replace orbShape's single filled disc with (a) a circleWave ring (cyan/coral hue) for the OUTLINE and (b) a separate gaussian SHAPE for the soft pink FILL, offset ~0.25*R toward velocity at 0.8*R. Different hue q-vars. Big-milky-orb mode = large gaussian, faint/no ring, Reinhard creamy core. Consolidate the current orbGlow into the gaussian fill to stay within 4 shapes / 4 waves.
- **Where:** orbShape/orbGlow factories + shape/wave slot assignment
- **Validate:** selfrender at a beat (force bass) — orbs read as thin cyan/coral rings with a pink interior pooled to the leading edge + soft halo, NOT solid discs.

### 10. Decay split: crisp tether (short) vs stacked fan (long); ripples in COMP
- **What:** Keep tether on the alpha/short-trail path (additive=0, already). For the rotating-line fan look raise decay to 0.96 so the few source lines' swept history stacks into the parallel-thread comb; kill roll/swirl while holding the buffer (the existing tunnelAmt coupling pattern). Ripples stay procedural in COMP (gotcha §8b — never a feedback wave), stamped at orb center on the beat, expanded by the buffer.
- **Where:** frame() per-look decay (fan look) + COMP ripple
- **Validate:** Force the rotline/sweep look, selfrender — a dense fan of fine parallel threads sweeping from the pivot (not discrete spokes, not a blurred disc).

## RISKS / GOTCHAS

- ADDITIVE-DENSITY MILKY-OUT (gotcha §8): dense additive bristle motifs (spindle/fountain/anemone) accumulate to equilibrium ~input/(1-decay) and saturate to white. Keep per-mode alpha low for dense modes (0.4-0.5), decay <=0.93 for those scenes, and DO NOT raise wash decay above 0.94. The mode-9 neon-dark look must stay short-decay (0.86) or it milks out too.
- FEEDBACK-ROTATION SPIRAL (gotcha §8): anything PERSISTENT in the feedback buffer gets rotated by camera roll/swirl into an ugly permanent spiral. Do ripples + transient secondary effects in COMP drawn FRESH each frame, never as a feedback wave. When holding the buffer still for a fan/tunnel (high decay), KILL roll/swirl/translate (the existing tunnelAmt coupling does this — preserve the pattern for any new high-decay look).
- FOGGY / HIGH-FREQ ADVECTION (V5 mistake + paint-spread): adding fbm/turbulence to the warp SAMPLE coords (suv) to make paint 'organic' foams the well-defined halo into full-field fog. Keep warp blur LOW-frequency (the existing 5-tap), spread via small isotropic zoom only. The wash must stay a bounded ~1.5-2x-radius island.
- NEON OVER-CORRECTION: the bold scenes are MORE saturated than v4 (0.85) but the wash/drift scenes must stay muted (0.35) and nothing may blow to flat white. Reinhard the FINAL (k~0.6-0.9), cap deposited V at ~0.82, and gate the pastelize-desaturate ON for wash modes / OFF for fold modes. Do not globally crank saturation (that was a V4-era thrash).
- RADIAL-FOLD-ON-FLOWER SPIROGRAPH (gotcha §8): a 6-fold radial fold on a dense flower reads as an off-brand thin-line spirograph. The original kaleidoscope is QUAD (4-fold) soft COLOUR wedges + a SMALL mirrored centre. Use fold=4 (abs(pd)) for the mandala; shrink the motif under any fold (the existing t.q5*=0.52 under fold — keep it).
- NO ALWAYS-ON ORB / FIXED PATH (gotcha §8): orbs must fully come-and-go on out-of-phase clocks (never all-gone simultaneously) and the pair axis must rotate through all directions, not retrace a fixed diagonal. The existing comeGo/axis machinery does this — preserve it when reworking orbs into ring+fill.
- Q-VAR BUDGET / COLLISIONS: only q1..q32 reach shaders; q33+ do NOT (V5-HANDOFF). q11 is the only nominally-free control var (currently focus/pupil). Compute per-scene SAT in-shader from q29 directly rather than spending a new var. Keep the engine/motif q-split (engine q1/q12-q20/q27-q32 + q8; motif q2-q11/q14/q21-q26) to avoid the collisions that broke earlier pastes.
- 4-WAVE + 4-SHAPE BUDGET: reworking orbs into ring+fill costs slots. Tether(1 wave) + central motif(1 wave) are fixed; ring-orbs can be circleWaves (2 waves, 0 free) OR shapes (ring+fill = up to 4 shapes for 2 orbs). Ripples, sweep-fan threads, corner bleed MUST be procedural (COMP/WARP/feedback), never a wave slot (guardrail #3). Allocate slots explicitly per the build steps; route overflow through the shader.
- DON'T REGRESS TO MULTI-PRESET OR THRASH: ONE seamless preset, morph via q-vars in frame_eqs, never loadPreset (= the foggy two-program crossfade). Make small targeted edits, self-render each via tools/selfrender.mjs BEFORE asking the user, commit after each verified change. The 2026-06-18 session converged fast precisely because of this cadence.

---

# FULL REFERENCE REPORT

# Alchemy V6 — Background / Parallax / Paint / Color Build Reference

Consolidated from 6 expert video analyses reconciled against `presets/alchemy-v4.js` (WARP_V4, COMP_V4, the 12 motif MODES, the LOOKS table, the q-var map) and `presets/kit.js` (GLSL helpers + factories). Authoritative spec for the V6 rebuild. Read with `MISTAKES.md` (§8 gotchas) and `FINDINGS-AND-REBUILD-PLAN.md`.

## Guardrails (unchanged)
ONE seamless self-sequencing preset (no cross-preset loads — that is the "foggy" two-program crossfade). Real kit factories, not reinvented geometry. Muted-but-LUMINOUS: bold scenes MORE saturated than v4 (~0.85) but never neon/blown-white; Reinhard the final. 4-wave + 4-shape budget (secondary effects go in COMP/WARP/feedback, never a wave slot). Only build what the original does. Only q1..q32 reach shaders.

---

## 1. BACKGROUNDS

Finding: TWO regimes, do not conflate.
- (A) DUSTY MOTIF-PAINTED WASH (dominant ambient) — low-sat (~25-40%), structureless soft green/amber/teal cloud. NOT generated; it is the decayed average of what orbs/anemone/tether painted (probe_480p: soft green with the anemone on top + one stray orb-smear). Hue lags the motif by several seconds. decay 0.93-0.96.
- (B) INTRINSIC SYMMETRIC fields (75-95% sat): 4-fold X-wedges, concentric bullseyes, horizontal sine bands, quad-mirror mandalas, tilt planes, vortex spirals, wallpaper tilings, vertical pickets, and a neon-on-dark filament regime (decay 0.85-0.88, near-black base).

V4 gap: COMP_V4 always builds an fbm "fusion" ground (lines 118-121) — reproduces only the wash's smoothness but as a perpetual mottled fog; misses the entire intrinsic-symmetric family; never tracks the motif-deposited hue; can't hit 0.85 sat; lacks kaleidoscope FOLD persistence + receding parallax.

V6 architecture: per-scene BG_MODE (q29 widened 0..9, fed by bgPick): 0=motif-wash, 1=X-wedge-fold, 2=bullseye-rings, 3=sine-bands, 4=quad-mandala, 5=tilt-planes, 6=vortex-spiral, 7=wallpaper, 8=pickets, 9=neon-on-dark. CRITICAL split: WARP owns field GEOMETRY (fold/spiral/shear/recede → transforms the OLD buffer, creates parallax + persistence); COMP owns field COLOR. fbm retired as the default ground; kept only as ≤0.15 texture tooth on wash/tilt.

Measurements: wash hue follows motif (green era ~120-140°, amber ~40-50°, teal ~180°); arc-wide drift ~one full rotation per ~90s (~0.07 rad/s); fold counts {2,4}; decay washes 0.93-0.96 / neon-dark 0.85-0.88; bullseye 6-10 rings; bands 4-6 with ~0.15 wobble; wallpaper 8-12 tiles; vortex 2-3 turns, eye offset 0.2-0.35.

GLSL helpers to reuse: ALC_KALEIDO_GLSL (alcKaleido n-fold), ALC_MOIRE_GLSL (alcMoire dots + alcMoireStripes), PAL_GLSL (pal), NOISE_GLSL (fbm), ALC_AURORA/FLUID/MARBLE/WASH/HORIZONBANDS/RADIALBLOOM_GLSL.

## 2. MOTIF PAINTING

Finding: motifs paint a MILKY, WELL-DEFINED cloud only when DENSE+bright. The deposit is the additive sum of many low-alpha hued strokes pushed to high V (~0.70-0.80) but pulled DOWN in saturation (S≈0.23-0.40, ~half the core's). It carries the motif's OWN hue (pink from red anemone, violet from magenta burst, gold from gold dandelion), held within ±15°. Well-defined because it hugs the motif (~1.3-2x radius) on a CONTRASTING dark complementary ground, blurs slowly (~3-15% over 30 frames), and is bounded by decay. Beat-pulsed. Exception: under kaleidoscope FOLD the local deposit is replicated+amplified into a vivid full-field pattern.

Numbers: ground green/teal H≈167 S≈46% V≈38%; motif core red H≈350 S≈67% V≈88%; halo pink H≈336-352 S≈23-40% V≈71-80%. Rule: deposited_S ≈ 0.35-0.55× core_S, V capped ~0.8, hue within ±15°. decay ≈0.90-0.94; per-frame zoom ≈+1.003..+1.010.

V4 gap: likely paints too saturated/neon (no luminance-gated desaturate), deposit always-on (no density/beat gate), possible high-freq warp turbulence (fogs it), bg not dark-complementary enough.

V6: modest wave alpha (0.12-0.30); COMP rgb2hsv desaturate-on-bright (hsv.y*=mix(1,0.45,smoothstep(0.4,0.9,hsv.z)), hsv.z=min(.,0.82)); Reinhard k~0.6-0.9; complementary dark base (hue=q8+0.5); paint-gate on bass/compactness; low-freq warp blur only; bounded halo verified in selfrender. Pastelize gated OFF for fold modes.

## 3. ORB PAINTING

Finding: orbs are NOT solid discs — each is a thin (1-2px) cyan/coral RING outline (~6-12% frame) enclosing a soft pink gaussian fill that pools toward the LEADING edge with a near-white hot core, bleeding a faint halo outside the ring. Ring color != fill color (the signature). Big-milky variant = large soft gaussian (15-22%), faint/no ring, creamy via tone-map. They roam in 2-5 bead clusters along the cyan tether; trail is a backward teardrop from WARP feedback (decay 0.90-0.94 + zoom/translate), NOT stamped copies; in a vortex the smear curls into spiral arcs. Ripples = COMP procedural (sin(dist*freq-time*spd) rings centered on orb), never a wave slot. Corner glow via COMP bloom + warp push-to-edge.

V4 gap: orbShape draws a solid filled disc with same ring/fill hue, centered fill; orbGlow adds an additive halo but still disc-shaped. Misses ring!=fill, leading-edge fill pooling, the dedicated big-gaussian mode, the bead-string cluster.

V6: ring = circleWave (cyan/coral); fill = separate gaussian SHAPE offset ~0.25R toward velocity at 0.8R; different hue vars; big-milky mode = large gaussian no ring; ripples in COMP. Budget: 2 ring-orbs as waves (2 slots) OR shapes (ring+fill = up to 4 shapes for 2 orbs); consolidate orbGlow into the gaussian fill.

Numbers: ring diameter 6-12% (1-2px stroke), fill pools to leading edge covering 50-70% with a 15-25% hot core, halo bleed 10-20% of R, cluster 2-5 (often 2), trail 10-25% (full-quadrant in vortex), decay 0.90-0.94, ring cyan ~rgb(80,230,230)/coral ~rgb(230,90,90), fill pink ~rgb(235,120,160).

## 4. LINES / TETHER

Finding: the tether is ONE continuous cyan/aqua audio-waveform strand (512 real samples, irregular teeth) marching between the two orbs with perpendicular value1 displacement (= Dance's waveLine in aqua), ALPHA-blended so it stays a crisp bright thread with only a short ghost — NOT a milky cloud. Always present structurally; amplitude pumps with bass; beat-gates on/off in some scenes (orig 0:27-0:39). The rotating/sweep-line motif is DIFFERENT: 2-5 bright radial/diameter lines share ONE slow rotation (~0.06 rad/s); the WARP rotate-about-pivot + HIGH decay (0.95-0.97) smears their swept history into a dense FAN of 15-25 fine parallel threads receding toward the hub. The ripples "terrain" variant = rectified-waveform peaks + translate/scale warp → hatched flanks.

V4 status: tether is correct (alcTether, additive=0, beat-gated). fRotLine exists and merges 3 lines; under tunnelAmt it holds the buffer still + strobes. Risk: if the fan rotates too fast or decay isn't raised enough, the comb won't form. Threads must be pale low-sat, not neon.

Numbers: tether aqua (R0.5-0.6,G0.9-0.98,B1.0) a~0.85, perp amp 3-6% of height scaling with bass_att, short ghost (decay 0.90-0.94). Fan: omega ~0.06 rad/s, rotStep ~0.001 rad/frame, decay 0.95-0.97, 15-25 threads from 2-5 source lines, pale hue-clocked.

V6: keep tether alpha/short-trail; rotating-fan look raises decay to 0.96 + slow continuous rotate-about-pivot in WARP; kill roll/swirl while holding the buffer; ripples + terrain in COMP/feedback, not a wave slot.

## 5. CAMERA / PARALLAX

Finding: all "3D" is feedback-warp on the persistent buffer. Big device: warp the OLD buffer about an OFF-CENTER pivot with non-1.0 zoom + perspective-shear, so echoes stack toward a vanishing point while new geometry draws at screen rate. Parallax = displacement scales with distance-from-pivot (edge moves 5-10x faster than near-pivot). Five devices: (1) tilted side-angle plane via pd/=(1+tilt*pd.y) about an off-center VP + diagonal roll; (2) vortex/drain via rotate-about-eye with 1/r swirl + inward zoom; (3) perspective picket-floor; (4) forward dolly/recede (zoom about off-center VP, bass-spiked); (5) slow roll/pan + drifting pivot (always-on bed); (6) stacked-waveform echo-depth.

V4 gap (why it reads flat): zoom/rot/swirl near-symmetric about a near-center pivot at rest-zoom ~0; pan amplitude tiny (0.02-0.06); shear divisor (line 48) center-referenced not VP-referenced; vortex 1/r term weak/gated; q15 zoom pinned ~0 → no persistent recede, no echo-stacks, no foreground-vs-background speed differential.

Numbers: tilt 30-45° (q28 ~0.6-1.2); vortex eye ~(0.42,0.45); swirl 0.2-0.5 rad/s with 1/r making inner 2-3x faster; drain zoom ~0.985-0.995; dolly ~1.015-1.03; recede ~0.97-0.99; pivot drift 0.10-0.18, period 12-20s; roll ±7° at ~0.05Hz; decay plane/picket 0.90-0.93, vortex/burst 0.93-0.95.

V6: off-center + drifting pivot (q20/q27, raise pan to 0.10-0.14); VP-referenced single-ended shear pd/=max(1+q28*(uv.y-q27),0.25); persistent recede/dolly q15 per look (-0.04 tunnel / +0.02 burst, bass-spiked); strengthened 1/r vortex about the eye; raised roll; echo-stack via small dx/dy + pd*=0.985 + decay 0.95. Decouple warp pivot (roams) from motif center (screen). Crossfade device weights with lookPick. Reuse unused drivers alcCamVortex/alcCamRoll/alcCamPlunge/alcCamFloat.

## 6. COLOR SPEED

Finding: TWO sources. (a) TEMPORAL drift WITHIN a scene is SLOW+SMOOTH (~2-20 deg/s, full family per 20-90s), never beat-snapped (beats drive brightness/zoom, not hue). (b) Vivid "many colors at once" is almost always SPATIAL (radial palette ramp ~290° across the radius; along-wave hue ramp; angular wedges; kaleidoscope fold of a gradient) — frozen or slowly rotating. (c) Scene CUTS hard-flip the palette 60-160° then hold+drift.

Numbers: temporal base 0.03 cyc/s (~11 deg/s), energy gain +0.05, cap ~0.08; RADIAL RING_FREQ ~1.3 cyc/unit-radius (~8 rad); kaleido 4-fold; ALONG-wave SPREAD ~0.8; angular NSEC 6-8, step ~0.28; saturation 0.79-0.86 spatial vs 0.20-0.45 drift; cut step +0.17..0.44 cyc every 10-20s.

V4 gap: single global hue clock (0.02/0.05) → temporal-only multicolor; fbm mottle not structured ramps; one global saturation (too neon in drift, too washed in kaleido); no held-vs-cut distinction; whole-wave one hue per frame (misses along-length rainbow).

V6: hue clock base→0.03, no beat snap, scene-cut hue step on picker transitions; spatial ramps per BG_MODE (radial pal(q8+pr*1.3), angular pal(q8+sector*0.28), along-wave pal(q8+a.sample*0.8), diagonal pal(q8+dot(pdc,dir)*1.5)); per-scene SAT computed in-shader from q29 (0.85 spatial / 0.35 wash / 0.5 mid) — no new q-var.

---

## Build order (each = one commit, self-render before showing the user)
1. Retire fbm default; BG_MODE switch scaffold (q29 0..9).
2. Wash emerges from paint: pastelize (rgb2hsv desaturate-on-bright) + complementary dark base.
3. Off-center drifting pivot + raised pan (parallax foundation).
4. VP-referenced perspective-shear (tilt-plane).
5. Persistent recede/dolly q15 per look + strengthened 1/r vortex.
6. Intrinsic fields: X-wedge / bullseye / sine-bands.
7. Quad-mandala / tilt / vortex / wallpaper / pickets / neon-dark + per-scene SAT.
8. Hue: base 0.03 + scene-cut step + along-wave SPREAD.
9. Orbs as ring-outline + offset gaussian fill (ring!=fill, big-milky mode).
10. Decay split (crisp tether vs long-decay fan) + COMP ripples.

## Risks (carry from MISTAKES §8 / V5-HANDOFF)
Additive milky-out (low alpha for dense modes, decay ≤0.93/0.94); feedback-rotation spiral (transients in COMP, kill roll/swirl when holding the buffer); foggy high-freq advection (low-freq warp blur only, no suv turbulence); neon over-correction (Reinhard final, cap V~0.82, pastelize gated to wash modes); radial-fold spirograph (quad fold + shrink motif); no always-on orb / fixed path (come-and-go on out-of-phase clocks, rotating axis); q-var budget (only q1..q32 reach shaders, q11 the only free control var — compute SAT in-shader from q29); 4-wave/4-shape budget (secondary effects procedural); never go back to multi-preset or thrash (small edits, self-render, commit each).

## Source references
- Implementation base: /Users/sujitk/projects/personal/ytmusic-wmp-visualizer/presets/alchemy-v4.js (WARP_V4 lines 34-63, COMP_V4 lines 67-179, MODES line 506, LOOKS line 548, frame() line 686).
- Kit helpers: /Users/sujitk/projects/personal/ytmusic-wmp-visualizer/presets/kit.js (alcKaleido 273, alcMoire/alcMoireStripes 286, pal 166, fbm 165, alcRotLines 1272, alcRadialBurst 1348, alcTether 1873, alcCamVortex 707, ALC_PAL 791).
- Gotchas: docs/alchemy-v4/MISTAKES.md §8; prior plan: docs/alchemy-v4/FINDINGS-AND-REBUILD-PLAN.md; V5 lessons: docs/alchemy-v4/V5-HANDOFF.md.

---

# IMPLEMENTATION STATUS (2026-06-21)

`presets/alchemy-v6.js` → `P["Alchemy V6: Random"]` (single seamless preset; boots by default; in
viz.html + viz.js FAVORITES). Built v4 → v6 in 4 commits, each headless-verified via the self-render
harnesses (`tools/selfrender.mjs` + scratchpad `render-bgmodes.mjs` / `render-motion.mjs`, which pin
`window.__ALC_FORCE` — a production-no-op debug hook in frame()):

- **03e3e4e — backgrounds.** COMP rebuilt as a `q29` BG_MODE 0..9 selector: 0 motif-wash · 1 X-wedge ·
  2 bullseye · 3 sine-bands · 4 quad-mandala · 5 tilt-planes · 6 vortex · 7 wallpaper · 8 pickets ·
  9 neon-on-dark. Two regimes (dusty motif-painted washes 0/5/6/9 vs intrinsic high-sat structured
  fields). Per-scene saturation in-shader. Milky pastelize (rgb2hsv desaturate-on-bright) gated to the
  wash regimes. Fold decoupled from looks → driven by BG_MODE. bgPick widened to 10, DISCRETE snap.
- **d8f0aee — parallax.** Intrinsic field now built at a CAMERA-WARPED coord `gpd` (fractional shear +
  slow roll + depth-breath) so it's no longer screen-locked → layered depth vs the full-rate buffer.
  WARP: VP-referenced single-ended perspective shear + strengthened 1/r vortex. frame(): off-center
  DRIFTING vanishing point (amp ~0.12) + per-BG_MODE camera intent (tilt/picket shear, vortex inward
  swirl, bullseye outward dolly).
- **dffea69 — colour speed.** Slow drift (~0.03) normally; FAST cycle (~0.1) in the spatial-multicolor
  modes (1/2/4) so wedges/rings sweep colour; scene-cut palette FLIP (60-160°) at each bg change;
  along-wave rainbow on the burst/wave modes.
- **047da33 — pickets** = true perspective floor (converging columns).

## Verified headless (NO live audio — synthetic beat only)
All 10 modes compile + render with no shader errors; fields animate/recede/roll (parallax); mode-0
wash shows the orbs/tether painting a spreading milky trail; mode-1/2 sweep multicolour. The dynamic
colour-bleed + beat behaviour under REAL music must be judged from the user's screen.

## DEFERRED (plan steps 9-10 — intentionally not done this pass)
- **Orbs ring-outline + offset gaussian fill (ring≠fill).** v4's filled-colour orbs were praised
  ("orbs look gorgeous") — left untouched to avoid regressing a liked element (MISTAKES: small targeted
  changes for liked elements). Revisit only if the user wants the distinct cyan-ring/pink-fill look.
- **Decay-split (crisp tether vs long-decay sweep fan) + COMP beat-shed ripples.** Lower priority.
- Vortex spiral drama + wallpaper-dot visibility may need tuning from the user's live screenshots.
