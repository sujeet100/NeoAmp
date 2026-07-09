/* Alchemy V7: Random — ONE seamless self-sequencing preset (single menu entry).
 *
 * REBUILD 2026-06-21 from a FRESH frame-by-frame + COLOUR-MEASURED study of the user's authoritative
 * reference `~/Downloads/YouTube 1080p 60fps Download.mp4` (1280x720, 3:06). V7 keeps V6's good
 * GEOMETRY (glowing filled orbs + pulsing border, the thin-line flower/star/cross motifs, the jagged
 * waveform tether) but THROWS OUT V6's engine and rebuilds it around what the reference ACTUALLY is:
 *
 *   1. WATERCOLOUR TRACE FEEDBACK (the core magic). The motif/orbs/lines move + change colour, and the
 *      feedback buffer keeps a DIFFUSING, GROWING, FADING coloured ghost of them. Mechanism = a real
 *      feedback loop in the WARP: decay (~0.95, long trails) + a COMPOUNDING wide BLUR mixed back each
 *      frame (deposits soften/spread = ink-in-water) + a gentle off-centre MAGNIFY (deposits grow as
 *      they age) + a camera PAN that DRAGS the whole trail buffer (parallax). This is what V6 lacked:
 *      its decay was low (0.84-0.93, short trails), its blur was a 1px tap (no diffusion), its zoom was
 *      ~0 (no growth). (Scenes 1:29-1:36, 2:11-2:30.)
 *   2. DARK WAVY-FLUID GROUND (the bg the user loved, 1:36-1:45). NOT V6's bright procedural band field.
 *      A DARK (measured V~0.2), low-saturation domain-warped fbm liquid field — the calm teal/green
 *      base — over which the vivid watercolour trails do the talking. Built FRESH in COMP (display-only,
 *      never fed back). Two accent regimes: a BOLD tiled-diamond KALEIDOSCOPE (0:17-0:28) + a RADIAL
 *      CONVERGING-LINE tunnel for depth (2:11-2:30).
 *   3. MEASURED COLOUR (see measure.py study). Hue is a CONTINUOUS clock, NOT a 3-5Hz strobe and NOT
 *      neon-maxed (Gemini was wrong on both): the motif net-cycles a full wheel in ~5s (energetic /
 *      kaleidoscope) to ~15s (calm); mean SATURATION ~0.3-0.5 and mean VALUE ~0.2-0.45 — moderate
 *      colour on a DARK ground, vivid only at additive cores + the kaleidoscope. Analogous at any
 *      instant (2-3 adjacent hues), continuous drift, small per-beat hue nudge.
 *   4. ABRUPT-SNAP CAMERA PAN (2:24-2:31: "moving up, then abruptly right"). The pan VELOCITY holds a
 *      direction for a few seconds then SNAPS to a new one; the long trail buffer drags the new way,
 *      revealing earlier renders = parallax / sense of 3D motion.
 *
 * Q-VAR MAP (engine vs motif split; no collisions):
 *   ENGINE  q1 decay · q8 hue(shared) · q12 shear (warp; 0=off) · q13 fold-scale · q15 magnify · q16 roll ·
 *     q17 swirl · q18 dx · q19 dy · q20/q27 pivot · q28 blur/diffusion mix · q29 bgMode · q31 exp · q32 beat
 *   MOTIF   q2,q3 center · q4 motif-visibility dip · q5 size · q6 jag · q7 orbR · q9 spin · q10 twist ·
 *     q11 focus(pupil) · q14 orbB vis · q21..q24 orb nodes · q25 orbA vis · q26 tether amp · q30 motif mode id
 */
(function () {
  "use strict";
  var P = (window.WMP_PRESETS = window.WMP_PRESETS || {});

  // ── WARP_V7: the WATERCOLOUR feedback transform. Reads the previous frame, applies camera
  //    (off-centre roll + gentle magnify + pan), a COMPOUNDING wide blur (diffusion), and decay.
  //    The motif waves are drawn additively on TOP of this each frame, so they deposit fresh colour
  //    that becomes next frame's trail. (Optional kaleidoscope fold gated by q12.) ──
  var WARP_V7 =
    "shader_body {\n" +
    "  float asp = resolution.x / resolution.y;\n" +
    "  vec2 piv = vec2(q20, q27);\n" + // off-centre, drifting pivot → asymmetric parallax
    "  vec2 pd = uv - piv; pd.x *= asp;\n" +
    "  float pr = length(pd);\n" +
    // ROLL (q16, gentle sign-oscillating) + a soft 1/r inner SWIRL (q17, ~0 except vortex). Never a
    // constant plunge — this just tumbles the trail field so coils/arcs form, per the depth study.
    "  float pang = q16 + q17 * (0.55 / (pr * 2.4 + 0.35));\n" +
    "  float cs = cos(pang), sn = sin(pang);\n" +
    "  pd = mat2(cs, -sn, sn, cs) * pd;\n" +
    // RADIAL RIPPLE (doc 01 C8, r0 18.6-19.6): hub-centred concentric chevron bands (λ≈5% frame)
    // sweep outward for ~1s during the rare starburst finale. q13 belongs to the kaleido fold when
    // q29==1, so the ripple reads it ONLY outside kaleido (the event writer also never fires there).
    "  float rip = (abs(q29 - 1.0) < 0.5) ? 0.0 : q13;\n" +
    "  pd *= 1.0 + rip * 0.018 * sin(pr * 125.6 - time * 30.0);\n" +
    // MAGNIFY: q15>0 shrinks the sample offset → the old buffer appears slightly bigger each frame, so
    // every deposit GROWS as it ages (the "traces grow in size before disappearing" note). Small.
    "  pd *= (1.0 - q15);\n" +
    "  pd.x /= asp;\n" +
    "  vec2 suv = piv + pd + vec2(q18, q19);\n" + // PAN translate (abrupt-snap direction from frame())
    // q12 SIGN-MULTIPLEXED displacement terms, 0 = both OFF:
    //  q12>0 — sawtooth x-shear as f(y) (doc 01 step 6, p2 chevrons; dormant until C4 writes it).
    //  q12<0 — smooth per-column y-FLOW as f(x) (A10 scallops, user-corrected mechanism: the
    //  straight chord's sinking trail copies BEND into arches as they age — the wave lives in
    //  the FIELD, not the drawn line; ~0.04 UV/s at full amount, λ≈0.16 UV ≈ the ref 70-90px).
    "  suv.x += max(q12, 0.0) * 0.03 * (abs(fract(suv.y * 3.0 + time * 0.05) * 2.0 - 1.0) * 2.0 - 1.0);\n" +
    "  suv.y += max(-q12, 0.0) * 0.0009 * sin(suv.x * 40.0 + time * 0.35);\n" +
    // WATERCOLOUR DIFFUSION — a wide 9-tap gaussian of the previous frame, blended back by q28. Because
    // the WARP output feeds back, this COMPOUNDS: a deposit gets blurred again every frame → it spreads
    // and softens like ink bleeding into wet paper. Weights sum to 1.0.
    "  vec2 wp = 1.0 / resolution;\n" +
    "  float br = 2.4 + 2.2 * q28;\n" + // blur radius widens with the diffusion amount
    "  vec3 blur = texture2D(sampler_main, suv).rgb * 0.25;\n" +
    "  blur += texture2D(sampler_main, suv + vec2(wp.x * br, 0.0)).rgb * 0.125;\n" +
    "  blur += texture2D(sampler_main, suv - vec2(wp.x * br, 0.0)).rgb * 0.125;\n" +
    "  blur += texture2D(sampler_main, suv + vec2(0.0, wp.y * br)).rgb * 0.125;\n" +
    "  blur += texture2D(sampler_main, suv - vec2(0.0, wp.y * br)).rgb * 0.125;\n" +
    "  blur += texture2D(sampler_main, suv + vec2(wp.x * br, wp.y * br)).rgb * 0.0625;\n" +
    "  blur += texture2D(sampler_main, suv - vec2(wp.x * br, wp.y * br)).rgb * 0.0625;\n" +
    "  blur += texture2D(sampler_main, suv + vec2(wp.x * br, -wp.y * br)).rgb * 0.0625;\n" +
    "  blur += texture2D(sampler_main, suv - vec2(wp.x * br, -wp.y * br)).rgb * 0.0625;\n" +
    "  vec3 sharp = texture2D(sampler_main, suv).rgb;\n" +
    "  vec3 fb = mix(sharp, blur, clamp(q28, 0.0, 0.85));\n" + // q28 ≈ 0.4 diffusion mix
    "  ret = fb * q1;\n" + // q1 = decay (long watercolour trails)
    "}\n";

  // ── COMP_V7: DARK wavy-fluid ground (built FRESH, never fed back) + the watercolour trail buffer
  //    composited on top so the vivid trails POP on the dark calm field; soft bloom glow; the
  //    kaleidoscope tiled-diamond fold + radial tunnel as accent regimes; tone-map + measured
  //    resaturate (sat ~0.4-0.5, NOT neon). fg + bg share the q8 hue clock → harmonious/analogous. ──
  // GLSL float-literal formatter (so int profile values splice as floats, e.g. 1 → "1.0").
  function G(n) {
    n = String(n);
    return /[.eE]/.test(n) ? n : n + ".0";
  }
  // ── COMP factory: the ONLY thing that differs between the two variants (Pastel vs Vivid) is this
  //    final COLOUR profile P. All geometry/engine/motifs/scenes/camera are shared. P knobs:
  //    gboost (ground brightness) · kbold (kaleidoscope boldness) · tonek (Reinhard knee) ·
  //    sat (resaturate: >1 boost / <1 mute) · deepen (darks: <1 deepen / →1 milky) · lift (milky floor) ·
  //    tintR/G/B + tintAmt (a subtle hue bias, used for the pastel mauve/sage cast). ──
  function makeComp(P) {
    return (
      NOISE_GLSL +
      PAL_GLSL +
      "vec3 rgb2hsv(vec3 c){ vec4 K=vec4(0.0,-1.0/3.0,2.0/3.0,-1.0); vec4 p=mix(vec4(c.bg,K.wz),vec4(c.gb,K.xy),step(c.b,c.g)); vec4 q=mix(vec4(p.xyw,c.r),vec4(c.r,p.yzx),step(p.x,c.r)); float d=q.x-min(q.w,q.y); float e=1.0e-10; return vec3(abs(q.z+(q.w-q.y)/(6.0*d+e)), d/(q.x+e), q.x); }\n" +
      "vec3 hsv2rgb(vec3 c){ vec4 K=vec4(1.0,2.0/3.0,1.0/3.0,3.0); vec3 p=abs(fract(c.xxx+K.xyz)*6.0-K.www); return c.z*mix(K.xxx, clamp(p-K.xxx,0.0,1.0), c.y); }\n" +
      "shader_body {\n" +
      "  float asp = resolution.x / resolution.y;\n" +
      "  float m = floor(q29 + 0.5);\n" + // 0 wavy-fluid (dominant) · 1 kaleidoscope · 2 radial-tunnel
      "  float kv = floor(q13); float ksc = fract(q13);\n" + // doc 10: kaleido lattice variant | breathing fold scale
      "  vec2 c = uv - 0.5; c.x *= asp; float prad = length(c);\n" +
      "  float hb = q8;\n" +
      // ── sample coord: KALEIDOSCOPE tiled-diamond mirror-fold when m==1 (the reference's repeating
      //    diamond lattice of mirrored bursts) — a 4-fold abs mirror repeated ~1.6× across the frame. ──
      "  vec2 suv = uv;\n" +
      "  if (m > 0.5 && m < 1.5) {\n" +
      "    vec2 kc = (uv - 0.5) * (1.5 + 0.4 * ksc); kc.x *= asp;\n" +
      "    kc = abs(fract(kc * 0.5 + 0.5) * 2.0 - 1.0);\n" + // repeating mirror → diamonds
      "    kc.x /= asp; suv = clamp(kc * 0.5 + 0.25, 0.0, 1.0);\n" +
      "  }\n" +
      // ── WALLPAPER tiling (doc 12 C3; p3 D-WALL): m==13 makes the frame a 6×6 grid of miniature
      //    copies of the LIVE centre window — a fract() sample-fold (like the kaleido, no slot). The
      //    grid does NOT scroll; cells morph in place as the centre changes. Ground is dimmed below. ──
      "  if (m > 12.5 && m < 13.5) {\n" +
      "    vec2 wc = (uv - 0.5) * 6.0; wc.x *= asp;\n" +
      "    wc = fract(wc) - 0.5; wc.x /= asp;\n" +
      "    suv = clamp(wc * 0.25 + 0.5, 0.0, 1.0);\n" +
      "  }\n" +
      // ── the watercolour TRAIL + motif buffer, max-DILATED at ~2.5px (V1's "dilation radius →
      //    THICK lines" — the original renders ~300px and upscales, so every stroke is fat) +
      //    TWO-octave bloom (blur2 = the wide fuzz octave; V1 had it, v7 had dropped to blur1
      //    only — user 2026-07-09: "all lines look thin and sharp; the original is thicker,
      //    fuzzier, low-res"). ──
      "  float dil = 2.5 / resolution.y;\n" +
      "  vec3 trail = texture2D(sampler_main, suv).rgb;\n" +
      "  trail = max(trail, texture2D(sampler_main, suv + vec2(dil, 0.0)).rgb);\n" +
      "  trail = max(trail, texture2D(sampler_main, suv - vec2(dil, 0.0)).rgb);\n" +
      "  trail = max(trail, texture2D(sampler_main, suv + vec2(0.0, dil)).rgb);\n" +
      "  trail = max(trail, texture2D(sampler_main, suv - vec2(0.0, dil)).rgb);\n" +
      "  vec3 glow = texture2D(sampler_blur1, suv).rgb + texture2D(sampler_blur2, suv).rgb * 0.8;\n" +
      // ── DARK WAVY-FLUID GROUND (the W scene). Domain-warped fbm → liquid wavy bands; 3 ANALOGOUS dusty
      //    tones; kept DARK (measured V~0.2) + desaturated so the trails carry the vivid colour. ──
      "  vec2 g = c * 1.25;\n" +
      "  vec2 dw = vec2(fbm(g + vec2(time * 0.05, -time * 0.03)), fbm(g + vec2(4.0, 1.3) - time * 0.04));\n" +
      "  float n = fbm(g * 1.4 + dw * 1.7 + vec2(-time * 0.02, time * 0.025));\n" +
      "  float n2 = fbm(g * 2.3 - dw * 1.1 + vec2(0.0, -time * 0.05));\n" +
      "  vec3 ga = pal(hb + 0.03), gb2 = pal(hb + 0.17), gcc = pal(hb - 0.12);\n" +
      "  vec3 ground = mix(ga, gb2, smoothstep(0.3, 0.7, n));\n" +
      "  ground = mix(ground, gcc, smoothstep(0.45, 0.82, n2) * 0.55);\n" +
      "  { float gl = dot(ground, vec3(0.333)); ground = mix(vec3(gl), ground, 0.55); }\n" + // calm/dusty
      "  ground *= 0.17 * (0.55 + 0.85 * n);\n" + // DARK ground — trails do the talking
      // ── RADIAL-TUNNEL regime (m==2): converging spokes from the centre vanishing point = depth. ──
      "  if (m > 1.5 && m < 2.5) {\n" +
      "    float pa = atan(c.y, c.x);\n" +
      "    float spokes = pow(0.5 + 0.5 * cos(pa * 40.0 + time * 0.1), 7.0);\n" +
      "    float depth = smoothstep(1.25, 0.05, prad);\n" +
      "    ground = ground * 0.45 + pal(hb + 0.12) * spokes * depth * 0.55;\n" +
      "  }\n" +
      // CORRIDOR regime (m==3): a near-black VOID so the marching ring-orbs + the jagged waveform thread
      // glow as the only light (the reference's 0:06-0:16 corridor is on pure black), with a faint central
      // horizontal depth-haze along the orbit line.
      "  if (m > 2.5 && m < 3.5) {\n" +
      "    ground = ground * 0.05 + pal(hb + 0.1) * 0.03 * exp(-pow(c.y * 6.0, 2.0));\n" +
      "  }\n" +
      // ── STRUCTURED-FIELD backgrounds (survey gaps) — they REPLACE the wavy ground. ──
      // 4 VERTICAL BARS (doc 12 D3; p1 B9 / p2 2.9.1): ~10 STATIC dark vertical bars (they never
      // scroll — verified across bursts) + a gold backlight flooding DOWNWARD through the gaps;
      // old motif/tether pigment stays TRAPPED in the gaps (the trail shown only BETWEEN the bars —
      // see the bar-gap mask just before the composite). Was 22 bars scrolling at time*0.12 (wrong).
      "  else if (m > 3.5 && m < 4.5) {\n" +
      "    float bars = pow(0.5 + 0.5 * cos(uv.x * 10.0 * 6.2832), 1.3);\n" + // STATIC, ~10 bars
      "    float flood = smoothstep(0.35, 0.0, abs(fract(uv.y + time * 0.55) - 0.5));\n" + // gold front descends ~55%h/s
      "    ground = mix(pal(hb + 0.5), pal(hb + 0.04), bars) * (0.06 + 0.14 * bars);\n" +
      "    ground += pal(hb + 0.12) * flood * (0.10 + 0.10 * bars) * 0.6;\n" + // descending gold flood
      "  }\n" +
      // 5 FLAT SOLID-COLOUR WASH (0:48 / 1:16): a calm even mid-tone stage, dusty. doc 12 D5 —
      // the wash hue WALKS in discrete steps (~1.2s hold + ~0.4s fade, h0 bg4), NOT a continuous
      // drift. Stepped random blend between two analogous tones: hold, then ease to the next step.
      "  else if (m > 4.5 && m < 5.5) {\n" +
      "    float wf = time * 0.85; float ws = floor(wf); float wu = fract(wf);\n" +
      "    float wmix = mix(hash21(vec2(ws, 3.0)), hash21(vec2(ws + 1.0, 3.0)), smoothstep(0.0, 0.35, wu));\n" +
      "    ground = mix(pal(hb), pal(hb + 0.33), wmix);\n" +
      "    float gl = dot(ground, vec3(0.333)); ground = mix(vec3(gl), ground, 0.5);\n" +
      "    ground *= 0.15 + 0.03 * n;\n" + // faint fbm tooth so it's not dead-flat
      "  }\n" +
      // 6 HORIZONTAL colour BANDS (2:28-2:39): smooth horizontal stripes, slow vertical drift.
      "  else if (m > 5.5 && m < 6.5) {\n" +
      // bands must MOVE, not recolour in place (user: ours look static; the original's bands
      // sweep so the colour change reads as motion) — drift raised 0.06→0.32
      "    float yb = uv.y * 5.0 + sin(uv.x * 2.0 + time * 0.1) * 0.3 - time * 0.32;\n" +
      "    ground = mix(pal(hb), pal(hb + 0.3), 0.5 + 0.5 * sin(yb * 3.14159));\n" +
      "    float gl = dot(ground, vec3(0.333)); ground = mix(vec3(gl), ground, 0.62);\n" +
      "    ground *= 0.14;\n" +
      "  }\n" +
      // 7 CONCENTRIC RINGS / bullseye glow (1:33): a few soft concentric rings, low saturation.
      "  else if (m > 6.5 && m < 7.5) {\n" +
      "    float rng = 0.5 + 0.5 * sin((prad * 7.0 - time * 0.2) * 6.2832);\n" +
      "    ground = mix(pal(hb + 0.02), pal(hb + 0.2), rng) * (0.05 + 0.13 * rng);\n" +
      "  }\n" +
      // 8 CAUSTIC BANDS (the 19s reference clip): a BOLD mid-tone field — two-tone horizontal
      // bands (hot pink over slate at @9, teal at @3) overlaid with rippling vertical caustic
      // streaks; the band colours ride the beat-snapped hue clock hard. Deliberately the
      // BRIGHTEST ground regime (the 19s clip proves the original goes this bold in places).
      // (bounded — was the m>7.5 catch-all; doc 12's mandatory step-0 so new regimes can append)
      "  else if (m > 7.5 && m < 8.5) {\n" +
      "    float band = smoothstep(-0.3, 0.3, sin(uv.y * 6.2832 * 1.6 + time * 0.5));\n" +
      "    vec3 bandCol = mix(pal(hb), pal(hb + 0.38), band);\n" +
      "    float cst = 0.5 + 0.5 * sin(uv.x * 60.0 + sin(uv.y * 7.0 + time * 0.6) * 2.2 + time * 0.35);\n" +
      "    cst = cst * cst;\n" +
      "    bandCol *= 0.4 + 0.22 * cst;\n" +
      "    float bl = dot(bandCol, vec3(0.333)); ground = mix(vec3(bl), bandCol, 0.75);\n" +
      "  }\n" +
      // 9 TREADMILL (doc 04 B9a; h1 S8): soft vertical streaks STREAM horizontally while the
      // motif layer stays pinned — counter-motion parallax, camera static. Muted duo, dark.
      // (bounded < 9.5 — doc 12 precondition so regimes ≥10 can append below without falling
      // into this catch-all, exactly as doc 04 bounded the caustic branch)
      "  else if (m > 8.5 && m < 9.5) {\n" +
      "    float tx = fract(uv.x * 7.0 - time * 0.5);\n" +
      "    float streak = 0.5 + 0.5 * cos(tx * 6.2832);\n" +
      "    streak = streak * streak;\n" +
      "    vec3 tcol = mix(pal(hb), pal(hb + 0.5), streak);\n" +
      "    float tlm = dot(tcol, vec3(0.333)); tcol = mix(vec3(tlm), tcol, 0.6);\n" +
      "    ground = tcol * (0.06 + 0.16 * streak);\n" +
      "  }\n" +
      // 10 CURTAIN WEDGES (doc 12 C7; p1 B5): one huge soft diagonal wedge creeping across at
      // ~10%frame/s — depth without any camera move. Two soft analogous tones, very low spatial
      // frequency, muted (desat 0.45 + ×0.16).
      "  else if (m > 9.5 && m < 10.5) {\n" +
      "    float wpl = dot(uv - 0.5, vec2(0.7, 0.7)) + sin(time * 0.06) * 0.25;\n" +
      "    vec3 wedge = mix(pal(hb + 0.08), pal(hb + 0.42), smoothstep(-0.25, 0.25, wpl));\n" +
      "    float gl = dot(wedge, vec3(0.333)); ground = mix(vec3(gl), wedge, 0.45) * 0.16;\n" +
      "  }\n" +
      // 11 FLOOR-BAND / horizon strip (doc 12 C11; p1 S4/S5): a muted band across the BOTTOM ~18%
      // of frame with a low-freq wavy top edge undulating via fbm, a slightly darker ground above.
      // (the lateral-streaming variant r0 bg3 is deferred to doc 01's C2 displacement.)
      "  else if (m > 10.5 && m < 11.5) {\n" +
      "    float edge = 0.18 + 0.06 * fbm(vec2(uv.x * 3.0 + time * 0.05, 1.7));\n" +
      "    float floorMask = smoothstep(edge + 0.02, edge - 0.02, 1.0 - uv.y);\n" + // band anchored to BOTTOM (uv.y=0 is top here)
      "    vec3 floorCol = pal(hb + 0.5) * 0.20, skyCol = pal(hb + 0.06) * 0.10;\n" +
      "    ground = mix(skyCol, floorCol, floorMask);\n" +
      "  }\n" +
      // 12 STATIC STRATA + injection front (doc 12 D4/C6; README Q16a — a NEW regime, the q29=6
      // sweep stays): bands UNDULATE IN PLACE (no scroll), each recolours in stepped jumps every
      // ~4s (hash21 per band+step), and an injection front descends band-by-band as an occasional
      // event, brightening the band it passes (r0 2.8.2, p0 B7). Muted ×0.14.
      "  else if (m > 11.5 && m < 12.5) {\n" +
      "    float yb = uv.y * 5.0 + sin(uv.x * 2.0 + time * 0.1) * 0.12;\n" + // undulate in place, NO -time scroll
      "    float band = floor(yb);\n" +
      "    float stepc = floor(time / 4.0);\n" + // per-band hue steps every ~4s
      "    float bh = hb + hash21(vec2(band, stepc)) * 0.3;\n" +
      "    float front = smoothstep(0.30, 0.0, abs(fract(uv.y + time * 0.35) - 0.5));\n" + // descending injection front
      "    vec3 bc = pal(bh);\n" +
      "    float gl = dot(bc, vec3(0.333)); ground = mix(vec3(gl), bc, 0.6) * (0.14 + 0.10 * front);\n" +
      "  }\n" +
      // 13 WALLPAPER (doc 12 C3): the tiled TRAIL (folded above) IS the image — dim the base ground
      // so the grid of live-centre copies reads on near-black.
      "  else if (m > 12.5 && m < 13.5) { ground *= 0.1; }\n" +
      // 14 CHEVRON sawtooth-band ground (doc 12 C4; p2 2.6): horizontal bands with sawtooth
      // (chevron) edges — the COMP counterpart to doc 01's shear WARP (which sinks landing stamps
      // into zigzag ribbons); together they read as chevron terrain. Muted ×0.14.
      "  else if (m > 13.5 && m < 14.5) {\n" +
      "    float tooth = abs(fract(uv.x * 8.0) * 2.0 - 1.0) * 0.06;\n" +
      "    float yb = uv.y * 5.0 + tooth;\n" +
      "    vec3 bc = mix(pal(hb), pal(hb + 0.3), 0.5 + 0.5 * sin(yb * 3.14159));\n" +
      "    float gl = dot(bc, vec3(0.333)); ground = mix(vec3(gl), bc, 0.62) * 0.14;\n" +
      "  }\n" +
      // ── KALEIDOSCOPE regime (m==1): BOLD vivid diamonds (the reference's punchy red↔green, 0:22-0:27 —
      //    this phase deliberately BREAKS the muted rule). Alternating diamond cells take a 2-hue DUO. ──
      "  if (m > 0.5 && m < 1.5) {\n" +
      // ── doc 10 step 1 — colour arrives as REGION FLOODS, not a continuous clock. The refs
      //    (h0 M5) fill the centre diamond first, then side wedges, then band cores — 2-4
      //    discrete floods/s, each era ~1-1.5s. Regions from the folded radius; each adopts a
      //    STEPPED hue on its own ~0.17s delay so colour cascades centre→wedge→band. ──
      "    float pr2 = length(suv - 0.5);\n" +
      "    float region = step(0.14, pr2) + step(0.34, pr2);\n" + // 0 centre · 1 wedge · 2 band core
      "    float era = floor(time * 3.0 - region * 0.5);\n" + // ~3 floods/s, staggered per region
      "    float hf = hb + era * 0.14;\n" + // stepped, region-flooded hue base for every variant
      // ── doc 10 step 2 — lattice VARIANT dispatched on kv (packed in q13): 0 diamonds
      //    (shipped) · 1 bowtie sine-ribbons + wedge fans · 2 nested top/bottom sine-lens bands
      //    + midline seam · 3 undulating rainbow horizontal wave-bands. Every variant still
      //    region-floods (hf carries the era term). GLSL: locals named pang/d1/d2/lens/etc —
      //    NEVER ang/rad (predeclared in the generated main(); a redefinition fails to link). ──
      "    vec3 kcol;\n" +
      "    if (kv < 0.5) {\n" +
      "      float cell = step(0.5, fract((suv.x + suv.y) * 1.5));\n" + // checker of diamond cells
      "      kcol = pal(hf + cell * 0.45);\n" +
      "    } else if (kv < 1.5) {\n" +
      // bowtie: two horizontal sine ribbons pinching at nodes (black-diamond negatives between),
      // wedges filled with a radial filament fan
      "      float ribbon = sin(suv.x * 6.2831 * 2.0) * 0.12;\n" +
      "      float dband = min(abs((suv.y - 0.34) - ribbon), abs((suv.y - 0.66) + ribbon));\n" +
      "      float bandM = smoothstep(0.06, 0.0, dband);\n" +
      "      float pang = atan(suv.y - 0.5, suv.x - 0.5);\n" +
      "      float fan = pow(0.5 + 0.5 * cos(pang * 30.0), 6.0);\n" +
      "      kcol = mix(pal(hf + 0.4) * fan * 0.7, pal(hf), bandM);\n" +
      "    } else if (kv < 2.5) {\n" +
      // sine-lens: nested arcs around top/bottom foci + a bright midline specular seam
      "      float d1 = length((suv - vec2(0.5, 0.28)) * vec2(1.0, 1.7));\n" +
      "      float d2 = length((suv - vec2(0.5, 0.72)) * vec2(1.0, 1.7));\n" +
      "      float lens = 0.5 + 0.5 * sin(min(d1, d2) * 40.0 - time * 0.4);\n" +
      "      float seam = smoothstep(0.03, 0.0, abs(suv.y - 0.5));\n" +
      "      kcol = pal(hf + floor(lens * 4.0) * 0.1) * (0.45 + 0.55 * lens);\n" +
      "      kcol += vec3(1.0, 0.95, 0.7) * seam * 0.4;\n" +
      "    } else {\n" +
      // rainbow wave-bands: undulating horizontal ramp, the colour front rides the band movement
      "      float yb = suv.y + 0.04 * sin(suv.x * 12.0 + time * 0.5);\n" +
      "      kcol = pal(hf + floor(yb * 9.0) * 0.11);\n" +
      "    }\n" +
      "    float kl = dot(kcol, vec3(0.333)); kcol = mix(vec3(kl), kcol, " +
      G(P.ksat) +
      ");\n" + // PROFILE: kaleidoscope SATURATION (vivid full / pastel muted — was reading too vivid in pastel)
      "    kcol = kcol * kcol * " +
      G(P.kbold) +
      ";\n" + // PROFILE: kaleidoscope boldness (vivid bold / pastel soft)
      "    ground = mix(ground * 0.12, kcol, 0.9);\n" +
      "  }\n" +
      // ── B9b/B5 WEDGE SWEEP layer (doc 04 step 5; p1 B5 "~0.1 frame/s, depth without camera
      //    motion"): two soft half-plane gradients rotating slowly — the 5th simultaneous
      //    element class at climaxes. Open-ground regimes only; MUTED + faint (0.10 gain,
      //    desat 0.6) — the vivid zone is the fold, never the wedge. ──
      "  if (m < 0.5 || (m > 4.5 && m < 6.5)) {\n" +
      "    float wa = time * 0.05;\n" +
      "    float w1 = smoothstep(-0.5, 0.9, dot(c, vec2(cos(wa), sin(wa))));\n" +
      "    float w2 = smoothstep(-0.5, 0.9, dot(c, vec2(cos(wa + 2.1), sin(wa + 2.1))));\n" +
      "    vec3 wedge = (pal(hb + 0.12) * w1 + pal(hb + 0.55) * w2) * 0.10;\n" +
      "    float wl = dot(wedge, vec3(0.333)); wedge = mix(vec3(wl), wedge, 0.6);\n" +
      "    ground += wedge;\n" +
      "  }\n" +
      "  ground *= mix(0.55, 1.06, smoothstep(1.45, 0.1, prad));\n" + // depth vignette
      "  ground *= " +
      G(P.gboost) +
      ";\n" + // PROFILE: ground brightness (pastel lifts the washes; vivid keeps dark)
      // ── COMPOSITE: vivid trails + glow halo POP on the dark ground (value separation = depth).
      //    trail 1.28→1.15 / glow 0.6→0.55 rebalance pays for the fatter dilate + blur2 fuzz
      //    (total energy ≈ constant; never lift highlights — the pastel discipline). ──
      // doc 12 D3 — TRAPPED PIGMENT: under the bars regime the deposited trail shows ONLY in the
      // gaps between the static bars (the bar mask dims the trail ON the bars); elsewhere 1.0.
      "  float barGap = (m > 3.5 && m < 4.5) ? (0.35 + 0.65 * (1.0 - pow(0.5 + 0.5 * cos(uv.x * 10.0 * 6.2832), 1.3))) : 1.0;\n" +
      "  trail *= barGap;\n" +
      "  vec3 col = ground + trail * 1.15 + glow * 0.55;\n" +
      "  col *= q31;\n" + // exposure (smoothed beat lift)
      // ── tone-map + MEASURED resaturate. Reinhard compresses highlights to colour not white; then a
      //    luminance-preserving resaturate toward the measured ~0.45 + a darks-deepen so the dark ground
      //    stays near-black and saturated trails pop. Never lift highlights to neon-white. ──
      "  vec3 toned = col / (col + vec3(" +
      G(P.tonek) +
      "));\n" +
      "  float tl = dot(toned, vec3(0.299, 0.587, 0.114));\n" +
      "  toned = mix(vec3(tl), toned, " +
      G(P.sat) +
      ");\n" + // PROFILE: saturation (vivid >1 / pastel <1)
      "  toned = mix(toned * toned, toned, " +
      G(P.deepen) +
      ");\n" + // PROFILE: darks (vivid deepen / pastel milky)
      "  toned = toned + " +
      G(P.lift) +
      " * (1.0 - toned);\n" + // PROFILE: milky lift (pastel softens the floor)
      "  toned = mix(toned, toned * vec3(" +
      G(P.tintR) +
      ", " +
      G(P.tintG) +
      ", " +
      G(P.tintB) +
      ") * 1.8, " +
      G(P.tintAmt) +
      ");\n" + // PROFILE: tint (pastel mauve/sage cast)
      "  ret = clamp(toned, 0.0, 1.0);\n" +
      "}\n"
    );
  }

  var BASE = {
    wave_a: 0,
    additivewave: 1,
    decay: 0.95,
    zoom: 1,
    rot: 0,
    warp: 0,
    dx: 0,
    dy: 0,
    cx: 0.5,
    cy: 0.5,
    gammaadj: 1.5,
    darken_center: 0,
    wrap: 0,
    echo_alpha: 0,
  };

  // ── orbs: glowing filled balls with a pulsing coloured fill + contrast-hue border (the reference's
  //    2:15-2:20 orbs whose border + colour get prominent with the beat). Lifted from V6 (the user
  //    called these "gorgeous"). orbShape = the filled core+rim; orbGlow = an additive halo. ──
  function orbCol(h, off) {
    return 0.5 + 0.5 * Math.cos(6.2832 * (h + off));
  }
  // D13 (doc 05 step 7, answered README Q6): everything EXCEPT the accent family (orb pair +
  // tether) gets a mild EMIT-TIME desaturate — pull 14% toward luma — so the small accent reads
  // as "deliberately the most saturated thing on screen" (p1 O11). Comp profiles untouched:
  // this reorders saturation, never lifts the envelope.
  function mutRGB(a) {
    var lm = 0.299 * a.r + 0.587 * a.g + 0.114 * a.b;
    a.r += (lm - a.r) * 0.14;
    a.g += (lm - a.g) * 0.14;
    a.b += (lm - a.b) * 0.14;
  }
  // colorizer for the kit alcOrbTarget bullseyes (doc 07 A16b): accent-family ink, per-ring
  // +0.06 hue step, accessory-desaturated (D13 — only the orbs+tether carry the saturation)
  function colAcc(a, k) {
    var h = accentHue + k * 0.06;
    a.r = orbCol(h, 0);
    a.g = orbCol(h, 0.33);
    a.b = orbCol(h, 0.67);
    mutRGB(a);
  }
  // ── ORB ANATOMY VOCABULARY (doc 07 A16a). The refs rotate orb IDENTITY per appearance
  //    (p1 97.6→100.9: 6-ring bullseye → ring-stack → gold bullseyes across consecutive casts):
  //    0 classic ringed (dominant) · 1 hollow ring (p0 O9: thin outline, near-empty interior)
  //    · 2 giant translucent disc (p0 O5: up to 22% frame, milky, thin rim) · 3 ringless
  //    glow/sun (p1 O1: soft gaussian, NO ring) · 4 pearl (p0 O8: milky white sphere, thin rim)
  //    · 5 dark ECLIPSE (p0 O10: near-black teal disc + crisp warm-red rim — rare).
  //    Descriptors live in the closure (shapes share this scope; all 32 q-vars are taken).
  //    NOTE the eclipse darkens the TRAIL layer, not the raw ground (the comp adds ground
  //    outside our reach) — accepted approximation, do NOT hack the comp for it. ──
  var ANAT_BAG = [0, 0, 0, 0, 0, 0, 1, 1, 1, 2, 2, 3, 3, 4, 4, 5];
  function mkAnat(force) {
    var k = force !== undefined ? force : ANAT_BAG[(Math.random() * ANAT_BAG.length) | 0];
    return {
      kind: k,
      fill: k === 1 ? 0.0 : k === 2 ? 0.28 : 1.0, // hollow ring / translucent giant
      milk: k === 4 ? 0.85 : k === 2 ? 0.4 : 0.0, // white-mix (pearl / milky giant)
      dark: k === 5 ? 1 : 0, // eclipse: near-black fill + fixed warm-red rim
      rim: k === 3 ? 0.0 : 1.0, // the sun has NO border ring
      sizeMul: k === 2 ? 2.6 : k === 3 ? 2.2 : k === 4 ? 0.7 : 1.0, // giants ~18-25% dia
      halo: k === 1 || k === 5 ? 0.0 : k === 3 ? 1.6 : 1.0, // hollow/eclipse: halo off; sun: big
    };
  }
  var ANAT = [mkAnat(0), mkAnat(0)]; // start classic (the pre-doc-07 look)
  var prevQ14v = 0, // orb B appearance detector (rising edge through 0.05)
    anatNextA = -1, // orb A re-roll rate limiter (10-20s)
    milkT0A = -9, // D2c milk-fill event birth per orb (step 6)
    milkT0B = -9;
  // ── ORB RING-ACCESSORY (doc 07 A16b+A4): the waves[3] multiplexer descriptor. Ring-stack /
  //    telescope columns appear in EVERY ref segment (p0 O6/O7, p1 O7/O8, r0 2.7.2); multi-ring
  //    bullseyes are the p1 O5 anatomy. All HOLLOW RING outlines in the line-mode wave — the
  //    4 shape slots are taken, and filled beads were user-rejected (bad7755; README Q10 answered
  //    ring-only). Deliberately unlike the removed bead-row on every axis that made it ugly:
  //    non-additive, anchored to a stationary post, few + tapered, never marching. ──
  var acc3 = {
      type: 0,
      orb: 0,
      n: 4,
      nCol: 6,
      taper: 0.7,
      ang: -1.57,
      extT: 2.5,
      len: 0.26,
      t0: 0,
    },
    acc3Next = -1, // roll clock (6-14s dwells)
    acc3Env = 0, // 0.4s ease on type transitions (no pops)
    acc3Fading = false, // fade-out-then-swap latch
    mushT0 = -99, // A18 mushroom-figures rise event (rare: column + calm + fluid/wash ground)
    mushLast = -99, // events ≥90s apart
    mushSnapT = -9, // cap colour-snap cadence (~0.6s, h2 2.15)
    mushAmt = 0; // eased engagement (read by the waves[3] column branch)
  function rollAcc3(force) {
    var host = Math.random() < 0.5 ? 0 : 1;
    var ty;
    if (force !== undefined && force !== null) {
      ty = force.type !== undefined ? force.type : force;
      if (force.orb !== undefined) host = force.orb;
    } else {
      // ★ ALL orb-anchored ring accessories (bullseye 1 / rosette 3 / eyelet 4) PULLED — user's
      // 3 live screenshots: "ugly shapes with orbs — if you can't fix them remove them" (rosette =
      // a scalloped star with a smeared orb at its base; bullseye = nested ring ghosts). Exactly
      // the telescope-column story: HOLLOW line-mode rings ghost into floating empty coils under
      // the thick-line comp + feedback — a dead end as drawn outlines (same lesson as the column +
      // bad7755). Natural roll → always OFF. fBullseye/rosette/eyelet + the _acc3 pin stay for a
      // future FILLED/glassy redesign; the corridor ring-row (bgMode 3, its own branch) is
      // unaffected, and the eyelet-on-classic-anatomy auto-open is gone with them.
      ty = 0;
    }
    // column axis: pedestal (rising from under the orb, p0 O6) or toward the nearest corner
    // (p1 O7 corner telescopes; p3: 4 cones pointing into corners)
    var hx = host ? lastOrbBX : lastOrbAX,
      hy = host ? lastOrbBY : lastOrbAY;
    var cAng =
      Math.random() < 0.5
        ? -1.5708 + (Math.random() - 0.5) * 0.28 // pedestal ±8°
        : Math.atan2((hy < 0.5 ? 0.08 : 0.92) - hy, (hx < 0.5 ? 0.08 : 0.92) - hx);
    return {
      type: ty,
      orb: host,
      n: 2 + ((Math.random() * 5) | 0), // bullseye 2-6 rings (p1 O5)
      nCol: 4 + ((Math.random() * 6) | 0), // column 4-9 rings (p1 O7)
      taper: 0.6 + Math.random() * 0.15, // ~3:1 base:tip (p0 O7: 95→28px)
      ang: cAng,
      extT: 2 + Math.random(), // extend/retract period 2-3s (p1 O7)
      len: 0.2 + Math.random() * 0.1, // up to ~31% tall (p1 O7 navy column)
      t0: lastT,
    };
  }
  function orbShape(qx, qy, hueOff, visVar, idx) {
    return {
      baseVals: Object.assign({}, SHAPE_BASE, {
        enabled: 1,
        sides: 40,
        additive: 0,
        thickoutline: 1,
      }),
      init_eqs: passthrough,
      frame_eqs: function (s) {
        var vis = visVar ? (s[visVar] !== undefined ? s[visVar] : 1) : 1;
        var cx = s[qx] !== undefined ? s[qx] : 0.5,
          cy = s[qy] !== undefined ? s[qy] : 0.5;
        var be = Math.max(0, (s.bass_att || 1) - 1); // beat energy
        // B1 (doc 06) + B7 (doc 05 step 2): the RING flashes the HELD accent-family ink (shared
        // with the tether; each orb keeps its hueOff identity); the FILL chases it lazily via
        // fillHue (r0: ring snaps with the tether, fill lags ~1s). Held between snaps — the
        // continuous ground clock no longer drags the orbs (p1 S13 layer independence).
        var hf = fillHue + (hueOff || 0),
          hb = accentHue + (hueOff || 0); // ring = the tether's ink (B1, r0 measured)
        var fr = orbCol(hf, 0),
          fg = orbCol(hf, 0.33),
          fb = orbCol(hf, 0.67);
        var br = orbCol(hb, 0),
          bg = orbCol(hb, 0.33),
          bb = orbCol(hb, 0.67);
        var bri = (0.9 + 0.5 * be) * (1 + 0.35 * spikeAmt); // fill pulses; D13 spike ~0.6s
        var A = ANAT[idx || 0]; // per-appearance anatomy descriptor (doc 07 A16a)
        s.x = cx;
        s.y = cy;
        // radius: balloon EVENTS carry the pops (doc 07 D2a; per-orb closure envelope);
        // only a small beat residue remains (was 0.45·be + the 0.85·pulse breathing).
        // GIANT anatomies damp the balloon (they "balloon IN at full size", p0 O5 — a 2.6x
        // giant × a 3x balloon filled the screen with ring ghosts, user 2026-07-09) and the
        // absolute radius caps at the ref giants' ~22-28% frame dia.
        var RS = idx ? radScaleB : radScaleA;
        if (A.sizeMul > 1.5) RS = 1 + (RS - 1) / A.sizeMul;
        s.rad = (s.q7 || 0.048) * (1 + 0.15 * be) * RS * A.sizeMul;
        if (s.rad > 0.17) s.rad = 0.17;
        if (A.dark) {
          // ECLIPSE (p0 O10): near-black teal disc + crisp warm-red rim — reads as a dark
          // hole in the glowing trail field (darker-than-raw-ground is out of comp reach)
          s.r = 0.03;
          s.g = 0.1;
          s.b = 0.1;
          s.a = 0.92 * vis;
          s.r2 = 0.02;
          s.g2 = 0.07;
          s.b2 = 0.07;
          s.a2 = 0.9 * vis;
          s.border_r = 1.0;
          s.border_g = 0.25;
          s.border_b = 0.18;
          s.border_a = 0.9 * vis;
          return s;
        }
        // D2c milk-fill (step 6): a ballooning HOLLOW ring fills with milk white over ~0.5s
        // (r0 13.85-14.5), then the fill decays out with the settle. Per-orb closure timer.
        var mfAge = lastT - (idx ? milkT0B : milkT0A);
        var mf =
          A.kind === 1 && mfAge > 0
            ? Math.min(1, mfAge / 0.5) * Math.exp(-Math.max(0, mfAge - 0.8) / 0.5)
            : 0;
        var fillA = Math.max(A.fill, 0.9 * mf),
          milk = Math.max(A.milk, 0.9 * mf);
        // milk: pearls / milky giants / the milk-fill pull the fill toward white
        fr += (1 - fr) * milk;
        fg += (1 - fg) * milk;
        fb += (1 - fb) * milk;
        // fill — SOLID for the classic anatomy (near-1 opacity when present; `vis` does the
        // come-and-go fade), 0 for the hollow ring, translucent for the giant disc.
        s.r = Math.min(1, fr * bri);
        s.g = Math.min(1, fg * bri);
        s.b = Math.min(1, fb * bri);
        s.a = fillA * vis;
        s.r2 = fr * 0.9;
        s.g2 = fg * 0.9;
        s.b2 = fb * 0.9;
        s.a2 = 0.78 * fillA * vis;
        // PROMINENT border — BRIGHT contrast-hue rim (was dim ×0.34) that pulses hard on the beat (the
        // user: "border is still not prominent when it pulses" / "solid border with almost 1 opacity").
        var bbri = (0.8 + 0.7 * be) * (1 + 0.35 * spikeAmt); // D13: the ring spikes with the fill
        s.border_r = Math.min(1, br * bbri);
        s.border_g = Math.min(1, bg * bbri);
        s.border_b = Math.min(1, bb * bbri);
        s.border_a = Math.min(1, 0.7 + 0.6 * be) * vis * A.rim;
        return s;
      },
    };
  }
  function orbGlow(qx, qy, hueOff, visVar, idx) {
    return {
      baseVals: Object.assign({}, SHAPE_BASE, {
        enabled: 1,
        sides: 40,
        additive: 1,
        thickoutline: 0,
      }),
      init_eqs: passthrough,
      frame_eqs: function (s) {
        var vis = visVar ? (s[visVar] !== undefined ? s[visVar] : 1) : 1;
        var cx = s[qx] !== undefined ? s[qx] : 0.5,
          cy = s[qy] !== undefined ? s[qy] : 0.5;
        var be = Math.max(0, (s.bass_att || 1) - 1);
        // hue-OFFSET colour puff (480p 2:35-2:45: the orbs carry fat soft watercolour splats
        // in a NEIGHBOURING hue that pulse with the music and stain the trail). Rides the held
        // accent clock (B7) at a +0.12 neighbouring offset.
        var hf = accentHue + (hueOff || 0) + 0.12;
        var gr = orbCol(hf, 0),
          gg = orbCol(hf, 0.33),
          gb = orbCol(hf, 0.67);
        s.x = cx;
        s.y = cy;
        // A14 splat window (doc 05 step 6): a 0.35s sine swell — one fat bright emission the
        // feedback immediately owns (diffuses in place, hue-frozen). lastT = this frame's time.
        var sl = (lastT - splatT0) / 0.35;
        var spl = sl >= 0 && sl < 1 ? Math.sin(sl * 3.14159) : 0;
        // the halo balloons WITH its orb (doc 07 D2a; was riding the smoothed q32 pulse);
        // anatomy (A16a): hollow/eclipse kill the halo, the sun doubles down on it.
        // Same giant-balloon damp + absolute cap as the fill (user: giant×balloon blowups).
        var A = ANAT[idx || 0];
        var RS = idx ? radScaleB : radScaleA;
        if (A.sizeMul > 1.5) RS = 1 + (RS - 1) / A.sizeMul;
        s.rad = (s.q7 || 0.048) * (1.7 + 0.5 * be + 1.3 * spl) * RS * Math.max(1, A.sizeMul * 0.8);
        if (s.rad > 0.26) s.rad = 0.26;
        var spk = 1 + 0.35 * spikeAmt; // D13 accent spike
        s.r = Math.min(1, gr * 0.85 * spk);
        s.g = Math.min(1, gg * 0.85 * spk);
        s.b = Math.min(1, (gb * 1.4 + 0.12) * spk);
        s.a = (0.42 + 0.5 * spl) * vis * A.halo;
        s.r2 = gr * 0.4;
        s.g2 = gg * 0.4;
        s.b2 = gb * 0.5;
        s.a2 = 0.0; // → transparent rim = soft gradient falloff
        return s;
      },
    };
  }

  // smooth come-and-go envelope (0..1) from a sine input, with a hold band (V6).
  function comeGo(s) {
    var x = (0.5 + 0.5 * s - 0.3) / 0.3;
    x = x < 0 ? 0 : x > 1 ? 1 : x;
    return x * x * (3 - 2 * x);
  }
  // stochastic discrete index cross-fader (V6 makePicker): dwells minS..maxS, then ramps a smoothstep
  // crossfade to a NEW index over `fade` seconds. LONG fade ⇒ morph not cut.
  // `accept(idx)` (optional, doc 04 B11): veto-with-retry on the fresh roll — up to 3 re-rolls if
  // the proposed index is disfavoured under the current scene; the last roll always stands
  // (weighting, never forbidding — variety survives).
  function makePicker(n, minS, maxS, fade, accept) {
    var a = Math.floor(Math.random() * n),
      b = a,
      mix = 0,
      transing = false;
    var start = 0,
      roll = minS + Math.random() * (maxS - minS),
      tstart = 0,
      out = { a: a, b: a, mix: 0 };
    return function (time, dt, gate) {
      if (!transing) {
        var el = time - start;
        if (el >= roll && (gate === undefined || gate || el >= roll + 5)) {
          for (var tr = 0; tr < 4; tr++) {
            b = n > 1 ? Math.floor(Math.random() * (n - 1)) : a;
            if (b >= a) b++;
            if (!accept || accept(b)) break;
          }
          tstart = time;
          transing = true;
        }
      } else {
        var fr = (time - tstart) / fade;
        mix = fr < 0 ? 0 : fr > 1 ? 1 : fr;
        mix = mix * mix * (3 - 2 * mix);
        if (fr >= 1) {
          a = b;
          transing = false;
          mix = 0;
          start = time;
          roll = minS + Math.random() * (maxS - minS);
        }
      }
      out.a = a;
      out.b = b;
      out.mix = mix;
      return out;
    };
  }
  // ABRUPT-SNAP direction generator (the 2:24-2:31 camera): holds a random angle for [minS,maxS]s, then
  // SNAPS to a new one (no easing) — the long trail buffer drags the new way, revealing earlier renders.
  function makeSnapDir(minS, maxS) {
    var ang = Math.random() * 6.2832,
      next = 0;
    return function (time) {
      if (time >= next) {
        ang = Math.random() * 6.2832;
        next = time + minS + Math.random() * (maxS - minS);
      }
      return ang;
    };
  }

  // ── central-motif modes (curated to the reference's vocabulary). Each = a point fn for one wave. ──
  // ANEMONE — soft 10-arm flower with a hollow centre (matches the reference's flower, A_95). The kit
  // factory bakes a FIXED green↔magenta two-tone; we override the colour so the base hue DRIFTS with the
  // shared q8 clock (dynamic, not 2 constant colours — the user's note) while keeping an alternating-arm
  // DUO spread so it still reads as the canonical anemone.
  var anemPts = alcAnemone(10, ALC_PAL.roseGreen).point_eqs;
  function fAnem(a) {
    anemPts(a);
    var arm = Math.floor((a.sample || 0) * 10);
    var h = (a.q8 || 0) + (arm & 1 ? 0.5 : 0.0);
    a.r = orbCol(h, 0);
    a.g = orbCol(h, 0.33);
    a.b = orbCol(h, 0.67);
    return a;
  }
  // STAR-NET — crisp straight-line star-polygon mandala (the clean 12-point star, A_95). N diameter
  // lines through centre with a small live-waveform jag → a clean star, folds into a mandala.
  function fStarNet(a) {
    // TRUE chromatic doubling (D8, doc 14a Step 2): the ref draws the SAME stroke as 2 RGB-offset
    // copies (red/blue channel split), NOT two adjacent hues on alternating arms. Split the samples
    // into TWO contiguous half-density passes — each re-traces the FULL star, offset ±δ along the
    // ray normal — so you get two clean coherent copies (a chromatic fringe), never a serrated weave.
    var samp = a.sample || 0;
    var copy = samp < 0.5 ? 0 : 1;
    var cs = copy ? (samp - 0.5) * 2 : samp * 2; // 0..1 within each copy
    var N = 6,
      fk = cs * N,
      seg = Math.floor(fk),
      u = fk - seg,
      s = u * 2 - 1;
    var th = seg * (3.14159 / N) + (a.q9 || 0) * 0.5;
    // shrunk 1.5->0.9 (user screenshot: edge-to-edge hairline blizzard; the WMP stars stay
    // ~40-60% of frame with countable rays)
    var len = (a.q5 || 0.4) * 0.9;
    var jag = (a.value1 || 0) * (a.q6 || 0.05) * 1.2;
    var cx = a.q2 !== undefined ? a.q2 : 0.5,
      cy = a.q3 !== undefined ? a.q3 : 0.5;
    var delta = 0.0022 * (copy ? 1 : -1); // ~3px separation → a chromatic edge, not two stars
    a.x = cx + s * len * Math.cos(th) - jag * Math.sin(th) + delta * -Math.sin(th);
    a.y = cy + s * len * Math.sin(th) + jag * Math.cos(th) + delta * Math.cos(th);
    var h = (a.q8 || 0) + 0.18; // base hue on the shared q8 clock → analogous/muted, not neon
    var cr = orbCol(h, 0),
      cg = orbCol(h, 0.33),
      cb = orbCol(h, 0.67);
    if (copy) {
      a.r = cr * 0.6;
      a.g = cg;
      a.b = Math.min(1, cb * 1.4); // blue-lean copy
    } else {
      a.r = Math.min(1, cr * 1.4);
      a.g = cg;
      a.b = cb * 0.6; // red-lean copy
    }
    if (u < 0.02 || Math.abs(samp - 0.5) < 0.01) a.a = 0; // hide ray jumps + the copy-to-copy seam
    return a;
  }
  // D6 filament CRIMP (doc 11a Step 1): a STATIC transverse wavelet (~10-14px, ~10 cycles along a
  // strand) + LIVE audio jitter concentrated at the TIPS (u^2). Returns an angular offset to add to
  // `ang` at radius `rr` (transverse offset = rr·dAng ⇒ dAng = dPerp/rr). Static texture is a fixed
  // sin(arc-length), NOT audio-driven; only the tip jitter is live (alc-waveform-rule-scope).
  function alcCrimp(u, rr, value1) {
    var dPerp = 0.005 * Math.sin(u * 62.832) + (value1 || 0) * 0.012 * (u * u);
    return dPerp / Math.max(rr, 0.05);
  }
  // URCHIN — all 512 live-waveform samples form a spiky rosette whose spike LENGTH is the amplitude.
  function fUrchin(a) {
    var cx = a.q2 !== undefined ? a.q2 : 0.5,
      cy = a.q3 !== undefined ? a.q3 : 0.5;
    var sc = a.q5 || 0.4;
    var rad = sc * (0.2 + 0.65 * Math.abs(a.value1 || 0));
    rad += 0.004 * Math.sin((a.sample || 0) * 70.0); // D6 crimp: fine radial ripple on the contour
    var ang = (a.sample || 0) * 6.2832 + (a.q9 || 0);
    a.x = cx + rad * Math.cos(ang);
    a.y = cy + rad * Math.sin(ang);
    var h = a.q8 || 0;
    a.r = orbCol(h, 0);
    a.g = orbCol(h, 0.33);
    a.b = orbCol(h, 0.67);
    return a;
  }
  // CROSSED-X — two iridescent live-waveform BEAMS crossing at ±45° (the 2:24-2:31 camera scene).
  function fCrossX(a) {
    var half = (a.sample || 0) < 0.5 ? 0 : 1,
      u = ((a.sample || 0) - half * 0.5) * 2.0,
      s = u * 2 - 1;
    var ang = half ? 0.7854 : -0.7854;
    var ct = Math.cos(ang),
      st = Math.sin(ang);
    var len = (a.q5 || 0.4) * 1.6;
    var jag = (a.value1 || 0) * (a.q6 || 0.05) * 2.2;
    var cx = a.q2 !== undefined ? a.q2 : 0.5,
      cy = a.q3 !== undefined ? a.q3 : 0.5;
    a.x = cx + s * len * ct - jag * st;
    a.y = cy + s * len * st + jag * ct;
    var h = (a.q8 || 0) + a.sample * 0.25;
    a.r = orbCol(h, 0);
    a.g = orbCol(h, 0.33);
    a.b = orbCol(h, 0.67);
    if (u < 0.02) a.a = 0;
    return a;
  }
  // ── N-GON MOTIFS (the user asked: "square, triangle, double triangle, mandala using triangles"). The
  //    kit factories draw waveform-jagged polygon edges + already colour-cycle with q8 (dynamic). Under
  //    the kaleidoscope bg (q29=1) any of these FOLDS into a triangle/polygon MANDALA. ──
  // The kit polygon factories colour via alcSetColor (a NARROW-spread, brighter palette) — off-theme vs
  // the rest of v7 (the orbCol cosine palette on the q8 clock). So we wrap them and re-colour with orbCol
  // so the n-gons match the flowers/orbs/tether exactly (same hue clock, same analogous spread).
  var triPts = alcTriangle(0, 0).point_eqs;
  function fTri(a) {
    triPts(a);
    var h = (a.q8 || 0) + (a.sample || 0) * 0.12; // gentle analogous gradient along the edges
    a.r = orbCol(h, 0);
    a.g = orbCol(h, 0.33);
    a.b = orbCol(h, 0.67);
    return a;
  }
  var ngonPts = alcNgon({ sides: 4, aspectX: 1.0, hueOff: 0.0 }).point_eqs; // SQUARE
  function fNgon(a) {
    ngonPts(a);
    var h = (a.q8 || 0) + (a.sample || 0) * 0.1;
    a.r = orbCol(h, 0);
    a.g = orbCol(h, 0.33);
    a.b = orbCol(h, 0.67);
    return a;
  }
  // HEXAGRAM / Star-of-David — two triangles 60° apart packed into ONE wave (split the samples). The two
  // triangles take a DUO of hues 0.45 apart (drifting with q8) — the canonical two-tone, on-theme.
  var triUp = alcTriangle(0, 0).point_eqs;
  var triDn = alcTriangle(1.0472, 0.0).point_eqs; // +60°
  function fHexagram(a) {
    var half = (a.sample || 0) < 0.5 ? 0 : 1;
    var saved = a.sample;
    a.sample = ((a.sample || 0) - half * 0.5) * 2.0; // remap to 0..1 per triangle
    if (half === 0) triUp(a);
    else triDn(a);
    var h = (a.q8 || 0) + (half ? 0.45 : 0.0);
    a.r = orbCol(h, 0);
    a.g = orbCol(h, 0.33);
    a.b = orbCol(h, 0.67);
    if (a.sample < 0.02 && half === 1) a.a = 0; // hide the half-to-half connector
    a.sample = saved;
    return a;
  }
  // WIREFRAME NET — BENT-WIRE SHEAVES (reworked 2026-07-04 to match the original's 0:28-0:32
  // scene: two crossing families of parallel CURVED lines, like a bent wire grid). The rigid
  // full-screen CROSSHATCH read as "does not exist in original" (user screenshot); the even
  // older {13/5} star-art spray was rejected as chaotic — this is the measured middle: ordered
  // parallel strands, but each strand BOWS with its own slowly-drifting curvature.
  function fNet(a) {
    var half = (a.sample || 0) < 0.5 ? 0 : 1;
    var ss = half ? ((a.sample || 0) - 0.5) * 2.0 : (a.sample || 0) * 2.0; // 0..1 within each strand set
    var N = 7,
      fk = ss * N,
      line = Math.floor(fk),
      u = fk - line;
    var t = (line / (N - 1)) * 2.0 - 1.0; // strand offset across the sheet, -1..1
    var p = u * 2.0 - 1.0; // position along the strand, -1..1
    var R = (a.q5 || 0.4) * 0.85; // a SWATH with ground around it, not a full-frame mesh
    // per-strand BOW: a quadratic arc whose amplitude/phase drift slowly — the "bent sheaves"
    var hsh = 0.5 + 0.5 * Math.sin(line * 12.9898 + half * 78.233);
    var bow = (0.1 + 0.2 * hsh) * R * Math.sin((a.q9 || 0) * 0.35 + line * 1.7 + half * 2.4);
    var arc = bow * (1.0 - p * p);
    var gx, gy;
    if (half === 0) {
      gx = p * R;
      gy = t * R + arc;
    } else {
      gx = t * R + arc;
      gy = p * R;
    }
    var jag = (a.value1 || 0) * (a.q6 || 0.05) * 0.2; // gentle perpendicular live-waveform jag
    if (half === 0) gy += jag;
    else gx += jag;
    // GENTLE perspective foreshorten toward a slow tilt direction → a tilted sheet (not an extreme stretch)
    var tA = (a.q9 || 0) * 0.15 + 0.7; // SOFTENED: tilt direction barely rotates → less rotational smear
    var proj = gx * Math.cos(tA) + gy * Math.sin(tA);
    var d = 1.0 / (1.0 + 0.4 * proj);
    if (d > 1.4) d = 1.4;
    if (d < 0.65) d = 0.65;
    gx *= d;
    gy *= d;
    var cx = a.q2 !== undefined ? a.q2 : 0.5,
      cy = a.q3 !== undefined ? a.q3 : 0.5;
    a.x = cx + gx;
    a.y = cy + gy;
    // the two crossing families carry DISTINCT hues (ref 0:28: white-green sheaf x gold sheaf)
    var h = (a.q8 || 0) + 0.12 + (half ? 0.22 : 0);
    a.r = orbCol(h, 0);
    a.g = orbCol(h, 0.33);
    a.b = orbCol(h, 0.67);
    if (u < 0.02) a.a = 0; // hide strand-to-strand jumps
    return a;
  }
  // SPIRAL VORTEX / whirlpool (survey gap, 1:05-1:16): radial filaments whose angle GROWS with radius →
  // they curl into a rotating log-spiral DRAIN (distinct from urchin/tunnel's straight radial spokes).
  function fVortex(a) {
    var N = 56,
      fk = (a.sample || 0) * N,
      seg = Math.floor(fk),
      u = fk - seg;
    var baseAng = (seg / N) * 6.2832 + (a.q9 || 0) * 2.0;
    var rad = (a.q5 || 0.4) * (0.12 + 0.9 * u) + (a.value1 || 0) * 0.05 * u;
    var ang = baseAng + 3.0 * rad; // log-spiral twist: outer filaments wind tangentially → the drain
    var cx = a.q2 !== undefined ? a.q2 : 0.5,
      cy = a.q3 !== undefined ? a.q3 : 0.5;
    a.x = cx + rad * Math.cos(ang);
    a.y = cy + rad * Math.sin(ang);
    var h = (a.q8 || 0) + rad * 0.3;
    a.r = orbCol(h, 0);
    a.g = orbCol(h, 0.33);
    a.b = orbCol(h, 0.67);
    if (u < 0.03) a.a = 0;
    return a;
  }
  // JELLYFISH / EYE DISC — reworked 2026-07-04 against the ACTUAL 0:47-0:53 reference frames:
  // the original is a COMPACT tilted furry disc (~1/3 frame) of short swirling filaments
  // around a hot core (the COMP focus pupil), ALWAYS clearly oblate. The old version was one
  // big hollow ellipse OUTLINE whose oscillating-tilt trail stamps accumulated into a giant
  // arc-stack sprawl — which the user correctly flagged as absent from the original.
  function fJelly(a) {
    var N = 64,
      fk = (a.sample || 0) * N,
      seg = Math.floor(fk),
      u = fk - seg;
    var R = (a.q5 || 0.4) * 0.55;
    var h0 = (seg * 2.399) % 6.2832; // golden-angle scatter → even furry coverage
    var r0 = R * (0.3 + 0.62 * ((seg * 0.617) % 1)); // filament base radius, scattered
    var len = R * (0.22 + 0.22 * Math.abs(a.value1 || 0)); // short filament, live-audio length
    var ang = h0 + (a.q9 || 0) + u * 0.9; // curls tangentially along its length (swirl)
    var rr = r0 + len * u;
    ang += alcCrimp(u, rr, a.value1); // D6 crimp/wavelet texture + tip jitter
    var x = Math.cos(ang) * rr,
      y = Math.sin(ang) * rr;
    var tilt = 0.3 + 0.35 * (0.5 + 0.5 * Math.sin((a.q9 || 0) * 1.7)); // 0.30-0.65: stays a tilted disc
    y *= tilt;
    var cx = a.q2 !== undefined ? a.q2 : 0.5,
      cy = a.q3 !== undefined ? a.q3 : 0.5;
    a.x = cx + x;
    a.y = cy + y;
    var h = (a.q8 || 0) + 0.1 * ((seg * 0.617) % 1); // slight per-filament hue scatter
    a.r = orbCol(h, 0);
    a.g = orbCol(h, 0.33);
    a.b = orbCol(h, 0.67);
    if (u < 0.04) a.a = 0; // hide filament-to-filament jumps
    return a;
  }
  // 12-POINT STAR MANDALA (survey gap, 1:33): a {12/5} star polygon — finer/higher-order than the 6-arm
  // star-net. Pairs with the bullseye bg (q29=7) for the "12-point star over a bullseye iris" look.
  function f12Star(a) {
    // TRUE chromatic doubling (D8, doc 14a Step 2): two contiguous half-density copies of the SAME
    // {12/5} star, each offset ±δ along the chord normal, red-lean vs blue-lean — a clean chromatic
    // fringe, not a serrated per-point weave.
    var samp = a.sample || 0;
    var copy = samp < 0.5 ? 0 : 1;
    var cs = copy ? (samp - 0.5) * 2 : samp * 2;
    var P = 12,
      stride = 5,
      CH = 12,
      fk = cs * CH,
      seg = Math.floor(fk),
      u = fk - seg;
    var i0 = (seg * stride) % P,
      i1 = (seg * stride + stride) % P;
    var sp = (a.q9 || 0) * 0.12; // SOFTENED: barely rotate (was 0.4) → no rotational smear-into-a-gear-web
    var aa0 = (i0 / P) * 6.2832 + sp,
      aa1 = (i1 / P) * 6.2832 + sp;
    var R = (a.q5 || 0.4) * 0.6; // shrunk again (0.85→0.6): was filling the whole frame on beats
    var x0 = Math.cos(aa0) * R,
      y0 = Math.sin(aa0) * R,
      x1 = Math.cos(aa1) * R,
      y1 = Math.sin(aa1) * R;
    var px = x0 + (x1 - x0) * u,
      py = y0 + (y1 - y0) * u;
    var dxc = x1 - x0,
      dyc = y1 - y0,
      ln = Math.hypot(dxc, dyc) || 1;
    var jag = (a.value1 || 0) * (a.q6 || 0.05) * 0.15; // SOFTENED: clean star points (was 0.5 → toothed/gear-like)
    px += (-dyc / ln) * jag;
    py += (dxc / ln) * jag;
    var nX = -dyc / ln,
      nY = dxc / ln,
      delta = 0.0022 * (copy ? 1 : -1); // ~3px separation along the chord normal
    var h = (a.q8 || 0) + 0.1; // base hue on the shared q8 clock (analogous/muted, not neon)
    var cr = orbCol(h, 0),
      cg = orbCol(h, 0.33),
      cb = orbCol(h, 0.67);
    var cx = a.q2 !== undefined ? a.q2 : 0.5,
      cy = a.q3 !== undefined ? a.q3 : 0.5;
    a.x = cx + px + nX * delta;
    a.y = cy + py + nY * delta;
    if (copy) {
      a.r = cr * 0.6;
      a.g = cg;
      a.b = Math.min(1, cb * 1.4); // blue-lean copy
    } else {
      a.r = Math.min(1, cr * 1.4);
      a.g = cg;
      a.b = cb * 0.6; // red-lean copy
    }
    if (u < 0.02 || Math.abs(samp - 0.5) < 0.01) a.a = 0; // hide chord jumps + copy-to-copy seam
    return a;
  }
  // BEADED ORB-CHAIN (survey gap, 0:06 / 1:42): a row of DISCRETE small ring-beads along a slowly-rotating
  // line through center, the central bead larger (the 'eye'). Distinct from the continuous tether line.
  function fBeadChain(a) {
    var B = 9,
      fk = (a.sample || 0) * B,
      seg = Math.floor(fk),
      u = fk - seg;
    var t = (seg / (B - 1)) * 2 - 1; // -1..1 along the chain
    var ang = (a.q9 || 0) * 0.3;
    var R = (a.q5 || 0.4) * 1.5;
    var bx = Math.cos(ang) * t * R,
      by = Math.sin(ang) * t * R;
    var mid = Math.round((B - 1) / 2);
    var be = Math.max(0, (a.q32 || 1) - 1); // beat energy (q32 = smoothed beat carrier)
    // smaller + discrete (user: the fat overlapping discs read as a solid caterpillar arc,
    // unlike the original's small separate beads); the central 'eye' stays modestly larger
    var br = 0.014 * (seg === mid ? 1.7 : 1.0) * (1 + 0.4 * be);
    var ringAng = u * 6.2832;
    var cx = a.q2 !== undefined ? a.q2 : 0.5,
      cy = a.q3 !== undefined ? a.q3 : 0.5;
    a.x = cx + bx + Math.cos(ringAng) * br;
    a.y = cy + by + Math.sin(ringAng) * br;
    var h = (a.q8 || 0) + Math.abs(t) * 0.2;
    a.r = orbCol(h, 0);
    a.g = orbCol(h, 0.33);
    a.b = orbCol(h, 0.67);
    if (u < 0.06) a.a = 0; // discrete beads — hide the bead-to-bead connector
    return a;
  }
  // GREEN VALLEY (survey scene, 2:58-end): two line-SHEETS converging to a central vanishing point form an
  // X/VALLEY, with a vertical live-waveform SPINE marching down the seam to the VP. The star nucleus at the
  // VP = the focus pupil; a forward dolly (valley camera coupling) flies into it. Reads as 3D depth-corridor.
  function fValley(a) {
    var s = a.sample || 0;
    var cx = a.q2 !== undefined ? a.q2 : 0.5,
      cy = a.q3 !== undefined ? a.q3 : 0.5;
    var L = a.q5 || 0.4;
    var h = (a.q8 || 0) + 0.2; // green-lean (the reference valley is green/yellow)
    if (s < 0.42 || (s >= 0.42 && s < 0.84)) {
      var rightSheet = s >= 0.42;
      var ss = rightSheet ? (s - 0.42) / 0.42 : s / 0.42;
      var NL = 8,
        fk = ss * NL,
        seg = Math.floor(fk),
        u = fk - seg;
      var nearY = (seg / (NL - 1) - 0.5) * 1.7 * L; // near-edge points spread vertically
      var nearX = (rightSheet ? 1.7 : -1.7) * L;
      a.x = cx + nearX * (1 - u); // line from near-edge → VP at center (converging perspective)
      a.y = cy + nearY * (1 - u);
      if (u > 0.98 || u < 0.02) a.a = 0; // hide line-to-line jumps + the pile-up at the VP
    } else {
      var u2 = (s - 0.84) / 0.16; // central vertical WAVEFORM SPINE down the seam
      var jag = (a.value1 || 0) * (a.q6 || 0.05) * 1.6;
      a.x = cx + jag;
      a.y = cy + (u2 - 0.5) * 1.5 * L;
      h = (a.q8 || 0) + 0.5; // spine in the complementary hue (pink over green)
    }
    a.r = orbCol(h, 0);
    a.g = orbCol(h, 0.33);
    a.b = orbCol(h, 0.67);
    return a;
  }
  // ORGANIC FILAMENT TANGLE / hairball (480p survey — THE most-recurring central motif there): ~20 curly
  // jittered thin strands radiating + curling from center with live-waveform jitter → a dense organic
  // knot, NOT the clean spiky urchin or the geometric net. Pastel-soft when the flavor mode is up.
  function fTangle(a) {
    var S = 20,
      fk = (a.sample || 0) * S,
      seg = Math.floor(fk),
      u = fk - seg;
    var seed = seg * 2.39996 + stampSeed; // golden-angle spread; re-rolled per stamp (D7)
    var R = a.q5 || 0.4;
    var rad = R * (0.08 + 0.92 * u);
    var curl = seed + (a.q9 || 0) + 2.3 * u * Math.sin(seed * 1.7) + (a.value1 || 0) * 0.7 * u; // curl + audio jitter
    var jit = (a.value1 || 0) * (a.q6 || 0.05) * 1.6 * u;
    var cx = a.q2 !== undefined ? a.q2 : 0.5,
      cy = a.q3 !== undefined ? a.q3 : 0.5;
    a.x = cx + rad * Math.cos(curl) + jit * Math.cos(curl + 1.5708);
    a.y = cy + rad * Math.sin(curl) + jit * Math.sin(curl + 1.5708);
    var h = (a.q8 || 0) + stampHueOff + u * 0.1; // emitter snaps; the trail keeps the old hue
    a.r = orbCol(h, 0);
    a.g = orbCol(h, 0.33);
    a.b = orbCol(h, 0.67);
    if (u < 0.04) a.a = 0; // hide strand-to-strand jumps
    return a;
  }
  // WAVEFORM MOUNTAINS / terrain — REWORKED (doc 02 step 2, D11+B3): ONE live ridgeline (a
  // stereo strand pair), pinch-enveloped into triangular peaks on a per-dwell tiltable rail.
  // The mountain BODY below is 100% feedback (doc 01 freeze + the step-1 sink) — accumulation,
  // not drawing (r0: the crest re-jags per frame over static frozen peaks).
  function fMountains(a) {
    var s = a.sample || 0;
    var strand = s < 0.5 ? 0 : 1, // 2 strands × 256 samples (p2 draws bundles; L/R stereo)
      u = (s - strand * 0.5) * 2;
    var R = a.q5 || 0.4,
      W = R * 2.4;
    var ct = Math.cos(mtTilt),
      st = Math.sin(mtTilt);
    var pinch = Math.abs(Math.sin(u * 3.14159 * 3.5 + mtPinchPhase)); // amplitude pinched → triangular peaks (p2 2.7)
    var v = (strand ? a.value2 : a.value1) || 0; // REAL waveform — the live crest (r0)
    var ridge = Math.abs(v) * (a.q6 || 0.05) * 4.0 * (0.35 + 0.65 * pinch);
    var lx = (u - 0.5) * W,
      ly = -ridge + strand * 0.005;
    var cx = a.q2 !== undefined ? a.q2 : 0.5,
      cy = a.q3 !== undefined ? a.q3 : 0.5;
    a.x = cx + lx * ct - ly * st;
    a.y = cy + lx * st + ly * ct;
    var h = (a.q8 || 0) + mtHueStep + strand * 0.07; // emitter hue steps per stamp; pile keeps old hue
    a.r = orbCol(h, 0);
    a.g = orbCol(h, 0.33);
    a.b = orbCol(h, 0.67);
    // BURST-gated deposits (r0: bundles laid in ~1s bursts, then STOP — the pile holds crisp).
    // Between stamps the crest is a near-invisible hairline (0.16 still fuzzed the ridges into
    // furry bands — user's mountains clip 2026-07-09); the stamp window carries the deposit.
    a.a = u < 0.02 || u > 0.98 ? 0 : 0.06 + 0.94 * mtStampEnv;
    return a;
  }
  // SCALLOP (doc 02 A10) — REWORK v2 (user, twice: "the scallop is NOT a separate line — it's
  // the tether leaving a trail that gets distorted"). fScallop draws ONLY a thin STRAIGHT
  // tether-like chord between the two orb anchors (the mode-19 coupling parks the orbs at its
  // terminals — p0: ringed-orb line ends). The scallop arches are made ENTIRELY by the warp's
  // q12<0 per-column y-flow bending the chord's sinking trail copies as they age. The ~3s row
  // re-seat (scRowOff) + beat sink stack the bent rows into the p0-S2 mountain-row band.
  function fScallop(a) {
    var s = a.sample || 0;
    var strand = s < 0.5 ? 0 : 1, // stereo two-hue pair (p0 8-11s: green + crimson, adjacent)
      u = (s - strand * 0.5) * 2;
    var ax = a.q21 !== undefined ? a.q21 : 0.2,
      ay = a.q22 !== undefined ? a.q22 : 0.4;
    var bx = a.q23 !== undefined ? a.q23 : 0.85,
      by = a.q24 !== undefined ? a.q24 : 0.62;
    var live = (strand ? a.value2 : a.value1) || 0;
    var d = live * 0.01 + strand * 0.02 + scRowOff; // whisper of live jag + strand split + row walk
    a.x = ax + (bx - ax) * u;
    a.y = ay + (by - ay) * u + d;
    var h = (a.q8 || 0) + (strand ? 0.45 : 0.0);
    a.r = orbCol(h, 0);
    a.g = orbCol(h, 0.33);
    a.b = orbCol(h, 0.67);
    a.a = u < 0.02 || u > 0.98 ? 0 : 0.3 + 0.6 * mtStampEnv; // thin hairline chord + stamp bursts
    return a;
  }
  // TRIANGLE-FLOWER MANDALA (user: "many triangles rotating creating flower-like pattern") —
  // the kit ALREADY has this as alcTriMandala (9 equilateral triangles rotated about a shared
  // centre = a flower/mandala); v7 had never hooked it (kit-variants rule). Colour overridden
  // so alternating triangles take a 2-hue duo drifting with the shared q8 clock.
  var triMandPts = alcTriMandala(9, null).point_eqs;
  function fTriMandala(a) {
    triMandPts(a);
    var ti = Math.floor((a.sample || 0) * 9);
    var h = (a.q8 || 0) + 0.06 + (ti & 1 ? 0.45 : 0);
    a.r = orbCol(h, 0);
    a.g = orbCol(h, 0.33);
    a.b = orbCol(h, 0.67);
    return a;
  }
  // DANDELION FLUFF BALL (the 480p 0:28-0:38 flower: a dense furry SPHERE of short curly
  // filaments on a hot ground, orbs nesting inside) — like the reworked jelly disc but round
  // (no tilt squash), fuller and tighter-curled.
  function fFluffBall(a) {
    var N = 64,
      fk = (a.sample || 0) * N,
      seg = Math.floor(fk),
      u = fk - seg;
    var R = (a.q5 || 0.4) * 0.62;
    var h0 = (seg * 2.399) % 6.2832; // golden-angle scatter
    var r0 = R * (0.1 + 0.8 * ((seg * 0.617) % 1));
    var len = R * (0.3 + 0.25 * Math.abs(a.value1 || 0));
    // curl direction alternates per filament -> FUZZY fluff, not a coherent swirl donut
    var ang = h0 + (a.q9 || 0) * 0.6 + u * 1.0 * (seg & 1 ? 1 : -1);
    var rr = r0 + len * u;
    ang += alcCrimp(u, rr, a.value1); // D6 crimp/wavelet texture + tip jitter
    var cx = a.q2 !== undefined ? a.q2 : 0.5,
      cy = a.q3 !== undefined ? a.q3 : 0.5;
    a.x = cx + Math.cos(ang) * rr;
    a.y = cy + Math.sin(ang) * rr * 0.92; // near-round ball
    var h2 = (a.q8 || 0) + 0.08 * ((seg * 0.617) % 1);
    a.r = orbCol(h2, 0);
    a.g = orbCol(h2, 0.33);
    a.b = orbCol(h2, 0.67);
    if (u < 0.04) a.a = 0;
    return a;
  }
  // SPIROGRAPH PETAL FLOWER family (480p 27.5-30/35.3/49.8/51-56 · 1080p 83.5-86 · A1):
  // k petal LOOPS traced as ONE closed stroke from a hollow centre; construction identity
  // re-rolls PER STAMP (spiro* closure state, step 2). Live-waveform wobble on the stroke.
  function fSpiro(a) {
    var s = a.sample || 0;
    var k = spiroK; // 10-14 dahlia/wheel petals · 26-40 fur-ball filaments (per stamp)
    var R = (a.q5 || 0.4) * 0.58; // compact — the ref figures sit ~30-45% of frame, not edge-to-edge
    var cx = a.q2 !== undefined ? a.q2 : 0.5,
      cy = a.q3 !== undefined ? a.q3 : 0.5;
    var lox = 0,
      loy = 0;
    var hueOff = 0; // per-variant hue offset (only the dahlia takes the alternating-petal duo)
    var kill = false; // hide a single connector seam where a variant splits the sample sweep
    {
      // 0 DAHLIA · 1 FUR-BALL (many-petal) · 2 FERRIS WHEEL — ONE petal-star construction (user,
      // validated against 480p 35/49.8-56 + 1:03-1:06): the original's "wheel" is not a separate
      // build — the dahlia appears, a ROUND live-WAVEFORM ring briefly CONNECTS the petal tips,
      // then fades (variant 2, alpha rides spiroRingAmt eased in frame()). The 0:35 pompom is the
      // same radial construction with MANY short fine petals (user: "like the ferris wheel but
      // with many many petals — fur ball") = variant 1: k 26-40, single pale hue, width ∝ 12/k.
      // Measured (2026-07-08): the flower is NEVER a rigid star — petal lengths are irregular,
      // each petal sways on its own slow clock, and the outline is a LIVE-WAVEFORM lightning
      // stroke whose jag is comparable to the petal half-width (an earlier wprof² window crushed
      // the jag into a static clip-art leaf — the user's "very static" complaint).
      var breathe = Math.max(0.28, 0.5 + 0.85 * ((a.q32 || 1) - 1)); // ~0.5 calm → ~1.6 on a hit
      if (s >= 0.88) {
        // ROUND-WAVEFORM connector ring (the wheel phase): a live-waveform circle through the
        // petal-tip zone; alpha rides spiroRingAmt so it grows in / melts out.
        var su = (s - 0.88) / 0.12;
        var rth = su * 6.2832 + spiroRot;
        // same base+breathe law as the petal tips (below) so the ring rides AT the tips at any
        // beat phase instead of collapsing inside the flower when calm
        var rr =
          0.3 * R +
          (R * 0.95 - 0.3 * R) * breathe +
          (a.value1 || 0) * (a.q6 || 0.05) * (2.6 + 2.2 * ((a.q32 || 1) - 1));
        lox = rr * Math.cos(rth);
        loy = rr * Math.sin(rth);
        a.a = 0.75 * spiroRingAmt;
        if (su < 0.02 || su > 0.98) kill = true; // hide the petals→ring seam + the wrap gap
      } else {
        // ★ THICK bolt via RIBBON weave (user vs the ref screenshot: the original's bolts are CHUNKY,
        // several px wide — but WebGL lines are 1px and butterchurn 'thick' only adds ±half-pixel
        // copies). SAME principle as the tether's double-stroke band (b5d852f): thickness = two tight
        // rails + the stroke constantly crossing the gap to FILL it. The tether affords two separate
        // strands because its 512 points are dense on one long line; a petal edge only has ~21 points,
        // so a strand-split reads as two sparse crisp outlines (verified in a self-render). Instead,
        // ONE stroke alternates consecutive points across the rails — the weave IS the fill, at full
        // per-edge resolution.
        var sp = s / 0.88; // petals take the samples the ring slice doesn't
        var fk = sp * k,
          pi = Math.floor(fk),
          pu = fk - pi; // petal index + 0..1 within the petal
        // per-petal IDENTITY: hashed irregular length, seeded ONCE per motif dwell (spiroSeed) — NOT
        // per stamp: if lengths re-roll each stamp, a long ghost pokes out from under the new short
        // petal and reads as a DIFFERENT overlapping petal (user: "petals overlap"). Stable lengths
        // keep every ghost hugging its own petal → the ref's dense layered-flower look.
        var ph = Math.sin((pi + 1) * 12.9898 + spiroSeed) * 43758.5453;
        ph -= Math.floor(ph);
        // gentle independent sway per petal (~2.3s via the q9 clock) — undulation with no net spin
        // (continuous spin + feedback = the rejected gear-smear; sway oscillates, so no smear)
        var sway = 0.04 * Math.sin((a.q9 || 0) * 45.0 + pi * 2.4);
        var baseAng = (pi / k) * 6.2832 + spiroRot + sway;
        var edge = pu < 0.5 ? pu * 2 : 2 - pu * 2; // 0 at base → 1 at tip → 0 at base
        var sideSign = pu < 0.5 ? 1 : -1; // left edge out, right edge back
        var hole = 0.3 * R; // a REAL dark centre hole (Fable: 0.12R piled into a bright knot)
        // ★ COMPRESS / DECOMPRESS (user): the flower BREATHES with the beat via `breathe` (above) —
        // petals shoot out on hits and retract between, never static. q32 = smoothed beat carrier.
        var plen = 0.72 + 0.5 * ph; // irregular per-petal length (ref petals differ visibly)
        var d = hole + (R * plen - hole) * breathe * edge; // petal length pulses with the music
        // CURVED LEAF profile, slim enough that adjacent petals PACK without crossing: angular
        // half-width ≈ atan(0.13R/0.55R) ≈ 0.23 rad < half the k=12 spacing (0.26) — the ref petals
        // sit side by side like a real flower, never over each other. Width shrinks ∝ 12/k so the
        // many-petal fur ball (k 26-40) packs as fine filaments the same way.
        var wprof = (Math.pow(edge, 0.5) * (1 - edge)) / 0.385;
        var halfW = R * 0.085 * Math.min(1, 12 / k) * wprof; // needle-slim (user: match the fur ball's elegance at low k)
        // ★ LIGHTNING edges at N-GON strength (user: "waveform like the n-gon has"): full q6-scale
        // displacement like ngonPoint's disp = value1*q6, anchored only near the base so the loop
        // still closes; the tip keeps ~half jag (flame-lick) instead of being pinned to a point.
        var jw = Math.min(1, edge * 6) * (0.45 + 0.55 * wprof);
        var amp = (a.q6 || 0.05) * (1.15 + 1.0 * ((a.q32 || 1) - 1)); // beat-coupled; tamed so the FINE per-point teeth (below) dominate over long swings
        // ribbon teeth are LIVE (user: "ours is statically jagged"): the rail gap rides the LOCAL
        // waveform magnitude — quiet passage → thin near-smooth stroke, a hit → fat jagged teeth,
        // and the serration depth varies point-to-point with the actual samples, like the original.
        // Small floor keeps a visible stroke; parity of the GLOBAL point index flips the rail.
        var vmag = Math.abs(a.value1 || 0);
        // per-tooth RAGGEDNESS (user: the uniform staircase read as "artificially created"):
        // each tooth's depth is scaled by a per-point hash that drifts with the q9 clock, so the
        // serration is irregular along the edge AND morphs over time — lightning, not stitching.
        var j = Math.round(s * 512);
        var rag = Math.sin(j * 12.9898 + (a.q9 || 0) * 40.0) * 43758.5453;
        rag -= Math.floor(rag);
        var ribbon =
          ((j & 1) * 2 - 1) *
          R *
          (0.003 + 0.034 * vmag) * // shallow-but-dense teeth — fine serration, not big zigzag
          (0.35 + 0.65 * wprof) *
          (0.35 + 1.3 * rag);
        var lat = sideSign * halfW + ribbon + (a.value1 || 0) * amp * jw;
        // radial tip FLICK: the same live sample also jitters the petal ALONG its axis, strongest at
        // the tip — the displacement direction rotates lateral→radial outward, so tips lick like the
        // ref's flame-tips instead of wagging sideways only
        var dr = d + (a.value1 || 0) * amp * edge;
        lox = dr * Math.cos(baseAng) - lat * Math.sin(baseAng);
        loy = dr * Math.sin(baseAng) + lat * Math.cos(baseAng);
        hueOff = spiroVar === 1 ? 0 : pi & 1 ? 0.38 : 0; // duo two-tone; fur ball single pale hue (p0 35)
        // fade toward the hub → no additive pile-up, keeps the hole dark; the many-petal fur ball
        // deposits ~3× the strokes, so scale by √(12/k) or its trail streaks blow out the buffer
        a.a = (0.5 + 0.5 * edge) * Math.min(1, Math.sqrt(12 / k));
        if (pu < (1.5 * k) / 512) kill = true; // guarantee ≥1 hidden base connector per petal (Fable)
      }
    }
    a.x = cx + lox;
    a.y = cy + loy * spiroTilt; // 1.0 tilt; <1 = oblate lying-down pose
    var h = (a.q8 || 0) + spiroHue + hueOff;
    a.r = orbCol(h, 0);
    a.g = orbCol(h, 0.33);
    a.b = orbCol(h, 0.67);
    if (kill) a.a = 0;
    return a;
  }
  // MESH COCOON / NET-BALL / dreamcatcher (480p 8.5-15.5/59.6 · 19s clip 0-8 · p2 157 · A2):
  // a closed rounded wire CAGE — wobbly RIM + concentric inner rings + spokes + hooked rim spikes —
  // re-stamped over its own feedback ghost with per-frame node jitter and (step 3+) per-stamp
  // topology re-roll. DISTINCT from mode 7's open sheet and mode 13's tangle. Two orbs sit inside
  // like eyes (step 2). Step 4 adds crumple-cocoon + geodesic-sphere flavours.
  function cocHash(n) {
    var x = Math.sin(n * 127.1 + cocSeed) * 43758.5453;
    return x - Math.floor(x);
  }
  function cocRimR(i, R, jit) {
    return R * (1 + (cocHash(i) - 0.5) * jit); // crumpled rim node radius (cells 8-60px)
  }
  function fCocoon(a) {
    var s = a.sample || 0;
    var geo = cocFlavour === 2, // small clean wireframe SPHERE (p1 M5)
      crump = cocFlavour === 1; // elongated crumple-cocoon BAG (p1 M2)
    var R = (a.q5 || 0.4) * 0.38 * cocSizeMul * (geo ? 0.55 : 1); // geodesic is the 12-20% small form
    var rock = (a.q9 || 0) * 0.15 + cocAng; // slow ~5°/s rocking + per-stamp angle (no translation)
    var live = (a.value1 || 0) * (a.q6 || 0.05) * 0.5 * (geo ? 0.2 : 1); // geodesic strokes are cleanest
    var rimJit = crump ? 0.48 : geo ? 0.06 : 0.24; // crumpled bag / clean sphere / normal cage
    var cx = a.q2 !== undefined ? a.q2 : 0.5,
      cy = a.q3 !== undefined ? a.q3 : 0.5;
    var ang = 0,
      r = 0,
      hueSel = 0,
      bandA = 0.85,
      kill = false;
    var ox,
      oy,
      direct = false; // 'direct' bands set ox/oy themselves (crumple chords)
    var xsq = 1,
      ysq = 1; // per-band ellipse squash (geodesic great circles)
    if (s < 0.22) {
      // RIM — one closed wobbly loop, 14 nodes (geodesic: the equator great-circle)
      var u = s / 0.22,
        fk = u * 14,
        i = Math.floor(fk),
        fr = fk - i;
      var ra = cocRimR(i, R, rimJit),
        rb = cocRimR((i + 1) % 14, R, rimJit);
      r = ra + (rb - ra) * fr + live;
      ang = ((i + fr) / 14) * 6.2832 + rock;
      hueSel = i & 1;
    } else if (s < 0.5) {
      // INNER RINGS (geodesic: two great-circle ELLIPSES — a latitude ring + a meridian, at radius R)
      var u2 = (s - 0.22) / 0.28,
        ringSel = u2 < 0.5 ? 0 : 1;
      var uu = ringSel ? (u2 - 0.5) * 2 : u2 * 2;
      if (geo) {
        r = R + live;
        ang = uu * 6.2832 + rock;
        if (ringSel === 0)
          ysq = 0.42; // latitude ring (squashed vertically)
        else xsq = 0.42; // meridian (squashed horizontally)
      } else {
        // 0.34R inner ring leaves the dark "mouth" hole; the hub is never filled.
        var baseR = ringSel ? 0.34 * R : 0.62 * R;
        var fk2 = uu * 10,
          j2 = Math.floor(fk2),
          fr2 = fk2 - j2;
        var jitA = baseR * (1 + (cocHash(j2 + ringSel * 20) - 0.5) * 0.18);
        var jitB = baseR * (1 + (cocHash(((j2 + 1) % 10) + ringSel * 20) - 0.5) * 0.18);
        r = jitA + (jitB - jitA) * fr2 + live;
        ang = ((j2 + fr2) / 10) * 6.2832 + rock;
      }
      hueSel = ringSel;
      if (Math.abs(u2 - 0.5) < 0.01) kill = true; // hide the ring→ring seam
    } else if (s < 0.86) {
      // SPOKES (geodesic: an extra pair of meridian ellipses instead of hub spokes)
      var u3 = (s - 0.5) / 0.36;
      if (geo) {
        var half = u3 < 0.5 ? 0 : 1,
          uu3 = half ? (u3 - 0.5) * 2 : u3 * 2;
        r = R + live;
        ang = uu3 * 6.2832 + rock + (half ? 0.7854 : -0.7854);
        xsq = 0.42; // near-vertical meridians
        hueSel = half;
        if (Math.abs(u3 - 0.5) < 0.01) kill = true;
      } else {
        var fk3 = u3 * 12,
          k3 = Math.floor(fk3),
          fr3 = fk3 - k3;
        var rIn = 0.34 * R,
          rOut = cocRimR(k3 % 14, R, rimJit);
        r = rIn + (rOut - rIn) * fr3 + live;
        ang = (k3 / 12) * 6.2832 + rock;
        hueSel = k3 & 1; // alternate spokes take the 2nd strand hue
        bandA = 0.7;
        if (fr3 < 0.02) kill = true; // hide the jump between spokes
      }
    } else {
      // SPIKES (geodesic: suppressed · crumple: cross-chords for denser cells · else: hooked spikes)
      var u4 = (s - 0.86) / 0.14;
      if (geo) {
        kill = true;
      } else if (crump) {
        var fk4 = u4 * 3,
          c = Math.floor(fk4),
          fr4 = fk4 - c; // 3 chords between random rim nodes
        var na = Math.floor(cocHash(c * 7 + 1) * 14),
          nb = Math.floor(cocHash(c * 7 + 5) * 14);
        var angA = (na / 14) * 6.2832 + rock,
          angB = (nb / 14) * 6.2832 + rock;
        var rA = cocRimR(na, R, rimJit),
          rB = cocRimR(nb, R, rimJit);
        var xa = rA * Math.cos(angA),
          ya = rA * Math.sin(angA);
        ox = xa + (rB * Math.cos(angB) - xa) * fr4;
        oy = ya + (rB * Math.sin(angB) - ya) * fr4;
        hueSel = c & 1;
        bandA = 0.75;
        if (fr4 < 0.03) kill = true; // hide chord-to-chord jumps
      } else {
        var fk4b = u4 * 12,
          k4 = Math.floor(fk4b),
          fr4b = fk4b - k4;
        r = cocRimR(k4 % 14, R, rimJit) + R * 0.18 * fr4b + live;
        ang = (k4 / 12) * 6.2832 + rock + 0.25 * fr4b; // hooked tip
        hueSel = k4 & 1;
        bandA = 0.9;
        if (fr4b < 0.02) kill = true; // hide the jump between spikes
      }
    }
    if (!direct) {
      ox = r * Math.cos(ang);
      oy = r * Math.sin(ang);
    }
    ox *= xsq;
    oy *= ysq; // geodesic great-circle squash
    if (crump) {
      // elongate along a per-stamp diagonal axis → the ~1.5:1 crumpled bag (p1 M2)
      var A = cocAng + 0.7854,
        ca2 = Math.cos(A),
        sa2 = Math.sin(A);
      var par = (ox * ca2 + oy * sa2) * cocElong,
        per = -ox * sa2 + oy * ca2;
      ox = par * ca2 - per * sa2;
      oy = par * sa2 + per * ca2;
    }
    a.x = cx + ox;
    a.y = cy + oy;
    var h = (a.q8 || 0) + cocHue + (hueSel ? 0.3 : 0); // two strand hues at once (r0)
    a.r = orbCol(h, 0);
    a.g = orbCol(h, 0.33);
    a.b = orbCol(h, 0.67);
    a.a = kill ? 0 : bandA * (0.45 + 0.55 * cocEnv); // fresh stamp crisp; thins over its ghost
    return a;
  }
  // MODES — flower/mandala/beam/n-gon/net/vortex/jelly/12-star/bead-chain/valley + organic-tangle + mountains
  // + tri-mandala (15) + dandelion fluff ball (16).
  // ROSE/ROTLINE removed (user-rejected). fNet is the DELIBERATE woven net. Radial-tunnel DEPTH = q29=2.
  var MODES = [
    fAnem,
    fStarNet,
    fUrchin,
    fCrossX,
    fTri,
    fNgon,
    fHexagram,
    fNet,
    fVortex,
    fJelly,
    f12Star,
    fBeadChain,
    fValley,
    fTangle,
    fMountains,
    fTriMandala,
    fFluffBall,
    fSpiro, // id 17 (doc 08 A1; first new-motif doc to land → MODES.length was 17)
    fCocoon, // id 18 (doc 09 A2)
    fScallop, // id 19 (doc 02 A10 — the README registry's "MODES.length at landing" rule)
  ];
  // COCOON_ID keyed off the array (land-order independent, per doc 09) — the cocoon director/eyes
  // below all gate on this id, so it stays correct whatever else appends.
  var COCOON_ID = MODES.indexOf(fCocoon);
  // ADDITIVE dense modes (anemone/urchin/net/vortex/jelly/tangle/fluff) pile up → lower alpha; outlines keep more.
  var MODE_ALPHA = [
    // jelly (9) 0.6→0.34: the furry-disc rework packs 64 filaments into a compact disc —
    // at the old alpha the additive pileup blew the core to white
    0.5,
    0.6,
    0.54,
    0.7,
    0.74,
    0.74,
    0.7,
    0.45,
    0.5,
    0.34,
    0.62,
    0.82,
    // valley (12) 0.72→0.48: 16 always-drawn sheet lines + spine piled the wedges to blown
    // white (user's 84s clip); the ref valley is a muted dark-green scene
    0.48,
    0.5,
    0.66,
    0.66,
    0.36,
    0.4, // spiro (17): lowered 0.58→0.4 (user: finer/less bloom — the ref is a thin delicate rosette)
    0.55, // cocoon (18): rim/spoke crossings pile up additively (outline-class)
    0.6, // scallop (19): one smooth two-strand line — outline-class
  ];
  function scaleFor(m) {
    return m === 0 ? 0.36 : 0.4;
  }
  // D12 radial-front modes (doc 05 step 4): anemone/urchin/vortex/jelly/fluff — the compact
  // radial discs where h2 §2.8 measured the centre-out hue front. The tangle (13) is EXCLUDED:
  // h2 has it re-tinting whole-cluster per stamp (its own walk), never as a front.
  var RADIAL_FRONT = { 0: 1, 2: 1, 8: 1, 9: 1, 16: 1 };
  function centralDraw(a) {
    var m = Math.floor((a.q30 || 0) + 0.5);
    if (m < 0) m = 0;
    if (m >= MODES.length) m = MODES.length - 1;
    // D12 (doc 05): the motif rides its own STEPPED clock — a LOCAL q8 override (this wave's
    // point object only; the shader ground keeps the global). All mode fns + their per-stamp
    // hue walks (offsets on a.q8) ride it unchanged. Sketchbook pages keep the global clock
    // (+restStampHue) — that user-verified look predates this clock.
    if (sketchAmt < 0.5) a.q8 = motifHue;
    MODES[m](a);
    // D12 RADIAL FRONT (doc 05 step 4): for ~1.8s after a hue step the NEW hue occupies the
    // disc centre-out; the OLD hue persists longest at the rim (h2 §2.8: "a travelling front,
    // NOT a strobe"). The mode fns are deterministic per sample (geometry from sample/value1/
    // q-vars), so re-running a point with the old hue RECOLOURS it without moving it. lastT is
    // this frame's time (frame() runs before the wave point fns).
    var fr = (lastT - motifStepT) / 1.8;
    if (RADIAL_FRONT[m] && sketchAmt < 0.5 && fr >= 0 && fr < 1) {
      var fcx = a.q2 !== undefined ? a.q2 : 0.5,
        fcy = a.q3 !== undefined ? a.q3 : 0.5;
      var rr = Math.hypot(a.x - fcx, a.y - fcy) / ((a.q5 || 0.4) * 1.1);
      if (rr > fr) {
        a.q8 = motifHueOld;
        MODES[m](a); // outside the front: redraw the point's COLOUR in the old hue
      }
    }
    mutRGB(a); // D13: the motif is NOT the accent — mild emit-time desaturate
    // PULSAR oblate squash — the anemone/urchin (0/2) read as a tilted 3D eye, not a flat face-on
    // circle. Gated to "not kaleido" via q29 (the fold source) — q12 was freed for the shear warp.
    if ((m === 0 || m === 2) && Math.abs((a.q29 || 0) - 1.0) > 0.5) {
      var cyS = a.q3 !== undefined ? a.q3 : 0.5;
      a.y = cyS + (a.y - cyS) * (1.0 - 0.34 * (a.q11 || 0));
    }
    a.a = (a.a === undefined ? 0.85 : a.a) * (a.q4 || 0) * MODE_ALPHA[m] * stampGain;
    return a;
  }
  // TETHER — the jagged waveform line joining the two orbs; colour cycles with the shared q8
  // clock. Drawn as a DOUBLE-STROKE band (two parallel strands, each with its own live-waveform
  // jag): the user confirmed against the WMP video that the original's tether reads thicker and
  // softer than a crisp hairline. (Standalone, not alcTether — the double-stroke remaps a.sample.)
  function fTether(a) {
    // RAIL mode (doc 06 step 5): while a rail lives the chord uses the FROZEN slowly-rotating
    // rail endpoints, kind forced to the plain chord with a micro-jag; beat events REUSE the
    // rail chord with full jag/ink (p0: "doubled by a crisp orange live-jag copy on hits").
    var railOn = railAmt > 0.01;
    var tk = railOn ? 0 : tetherKind;
    var ax = railOn ? railAx : a.q21 !== undefined ? a.q21 : 0.4,
      ay = railOn ? railAy : a.q22 !== undefined ? a.q22 : 0.5;
    var bx = railOn ? railBx : a.q23 !== undefined ? a.q23 : 0.6,
      by = railOn ? railBy : a.q24 !== undefined ? a.q24 : 0.5;
    // idle rail keeps a VISIBLE live micro-jag (p2: 2-3px — alive, never a dead ruler line)
    var q26e = railOn ? 0.007 + ((a.q26 || 0.03) - 0.007) * tetherEnv : a.q26 || 0.03;
    if (tk === 6) {
      // CASCADE hangs from ONE orb (h0 T3): the far end is a point below orb A, not orb B
      bx = ax + 0.1 * Math.sin(tetherSeed);
      by = ay - 0.32; // y-up wave coords: -0.32 = hangs DOWNWARD on screen
    }
    var dx = bx - ax,
      dy = by - ay,
      len = Math.hypot(dx, dy) || 1;
    var nx = -dy / len,
      ny = dx / len;
    // ★ TRAIL-BUILT CONSTRUCTIONS (user-corrected 2026-07-09, verified by frame-stepping the
    // refs): the original never draws a multi-strand construction per frame — each frame shows
    // ONE live strand (rope: a thin rotating pair), and the braid/rod/fan is the FEEDBACK TRAIL
    // of that strand's motion. Helix (480p 1:37.5-1:41): one quasi-periodic strand, phase
    // alternating frame-to-frame; rope (1080p 1:56-2:01): the rod is accumulated trace, live =
    // hairlines; cascade (1080p 0:15.5-16.5): ONE hanging strand whose low end travels, the fan
    // is its frozen copies. Strand fold: 1 helix/kite/cascade · 2 everything else (rope = the
    // rotating pair; chord/staircase/lightning keep their measured in-frame ghost/twig strand).
    var NS = tk === 1 || tk === 5 || tk === 6 ? 1 : 2;
    var sN = (a.sample || 0) * NS,
      strand = Math.floor(sN),
      tt = sN - strand;
    if (strand >= NS) {
      strand = NS - 1;
      tt = 1;
    }
    var win = Math.sin(tt * 3.14159); // tips land exactly on the two orbs
    var disp, off;
    if (tk === 1) {
      // TELEPHONE-CORD HELIX (p1 T3; user re-corrected 2026-07-09: "2 waveforms intertwining,
      // or 1 waveform appears a split second later and disappears again — NOT a drawn shape").
      // The old FRAME-parity flip lit both rails every 16ms → read as a drawn solid spring.
      // Now: ONE strand dwells ~0.14s on a rail, blinks OFF ~30ms, reappears on the mirror
      // rail — the braid exists only in the trail. 12-14 loops over the span.
      var LOOPS = 12 + (((tetherSeed * 7) | 0) % 3);
      var hpar = ((lastT / 0.14) | 0) & 1 ? 3.1416 : 0; // time-quantized rail dwell
      disp =
        0.028 * Math.sin(tt * LOOPS * 6.2832 + hpar + lastT * 1.3 + tetherSeed) * win +
        (a.value1 || 0) * 0.008 * win;
      off = 0;
    } else if (tk === 2) {
      // SQUARE-STEP STAIRCASE (h0 T2): sample-and-hold of the REAL waveform — horizontal runs
      // joined by near-vertical jumps, wilder mid-span, reshuffling every frame (live).
      var stKey = strand * 100 + ((tt * 24) | 0);
      if (stKey !== heldKey) {
        heldKey = stKey;
        heldVal = a.value1 || 0;
      }
      disp = heldVal * q26e * 2.2 * win;
      off = (strand ? 1 : -1) * 0.0035 * win;
    } else if (tk === 3) {
      // LIGHTNING (p1 T4 / r0 2.6): bolder jag than the chord; strand 1 grows 2-3 side twigs below.
      disp = (a.value1 || 0) * q26e * 2.0 * win;
      off = (strand ? 1 : -1) * 0.0035 * win;
    } else if (tk === 4) {
      // BRAIDED ROPE (h1 T2): TWO thin lines ROTATING about the chord (user-corrected) — their
      // perpendicular offset oscillates with a slight along-length twist; the persistent ~5s
      // trail of the rotation builds the solid fuzzy ~25-30px rod. Live = just the hairline pair.
      disp = (a.value1 || 0) * q26e * 0.5 * win;
      off = (strand ? 1 : -1) * 0.011 * Math.cos(lastT * 3.2 + tt * 3.0 + tetherSeed) * win;
    } else if (tk === 5) {
      // LOOPY KITE-STRING (p1 T2): one WANDERING strand — the loops TRAVEL along the string
      // (phase drifts, amplitude breathes) so per-frame it is a moving hairline, never a
      // standing sine (user: a fixed-phase drawn wave read as a static shape). Brief life.
      disp =
        0.025 *
          (0.7 + 0.3 * Math.sin(lastT * 0.7 + tetherSeed)) *
          Math.sin(tt * (3 + (((tetherSeed * 5) | 0) % 3)) * 6.2832 + tetherSeed + lastT * 2.2) *
          win +
        (a.value1 || 0) * 0.006 * win;
      off = 0;
    } else if (tk === 6) {
      // HANGING CASCADE (h0 T3): ONE live strand hanging from the orb; its swing about the top
      // anchor is QUANTIZED to ~0.16s re-seats (frame-stepped ref: the fan is DISCRETE frozen
      // copies, not a smooth smear) — each re-seat leaves a strand, the fan opens downward.
      disp = (a.value1 || 0) * 0.01 * win;
      var cstep = Math.floor(lastT / 0.16) * 0.16;
      off = 0.055 * Math.sin(cstep * 2.2 + tetherSeed) * tt;
    } else {
      // 0 — fine-tooth waveform chord + the SLOW chevron envelope underneath (h2's two
      // displacement scales: fine jag reshuffles per frame, the big envelope evolves ~0.5-1s)
      var ci = Math.min(8, (tt * 8) | 0);
      if (envRefresh) envHold[ci] = a.value1 || 0;
      var fi = tt * 8,
        i0 = Math.min(7, fi | 0),
        frc = fi - i0;
      var chev = (envHold[i0] * (1 - frc) + envHold[i0 + 1] * frc) * (railOn ? 0 : 0.055) * win;
      disp = (a.value1 || 0) * q26e * win + chev;
      // strand 1 is the one-sided CHROMATIC GHOST (p2: 1px blue-violet ghost beside the stroke)
      off = strand ? 0.005 : -0.0035 * win;
    }
    a.x = ax + tt * dx + nx * (disp + off);
    a.y = ay + tt * dy + ny * (disp + off);
    if (tk === 0 && !railOn) {
      // mid-span scribble KNOT (h2: ~80-120px cluster roaming around mid-span, re-shuffling live)
      var kp = knotPos + 0.05 * Math.sin((a.q9 || 0) * 11.7);
      var ku = (tt - kp) / 0.05;
      if (ku > -1 && ku < 1) {
        var kw = 1 - ku * ku;
        a.x += 0.06 * Math.sin(ku * 25 + tetherSeed) * kw * ((a.value1 || 0) * 0.5 + 0.5);
        a.y += 0.06 * Math.cos(ku * 19 + tetherSeed) * kw * ((a.value1 || 0) * 0.5 + 0.5);
      }
    }
    var twigDim = 1;
    if (tk === 1 && (lastT / 0.14) % 1 > 0.8) twigDim = 0; // helix blink-gap between rails
    if (tk === 3 && strand === 1) {
      // side TWIGS (r0: mid-span branches): strand 1 draws ONLY the twigs — 2-3 hashed windows
      // become short rays leaving the chord; OUTSIDE the windows it is INVISIBLE (the ref's
      // frames show one bolt + twigs; the offset near-end copies are trail, not a second bolt).
      twigDim = 0;
      var nb = 2 + (((tetherSeed * 3) | 0) % 2);
      for (var bi = 0; bi < nb; bi++) {
        var bp = 0.25 + ((tetherSeed * (13 + bi * 7)) % 1) * 0.5;
        if (tt > bp && tt < bp + 0.05) {
          var u2 = (tt - bp) / 0.05;
          var bang = (tetherSeed * (1.7 + bi)) % 6.2832;
          var tl = 0.05 + 0.05 * ((tetherSeed * (3.3 + bi)) % 1);
          a.x = ax + bp * dx + Math.cos(bang) * u2 * tl;
          a.y = ay + bp * dy + Math.sin(bang) * u2 * tl + (a.value1 || 0) * 0.008;
          twigDim = 0.6;
          break;
        }
      }
    }
    // kind 2 is a CHROMATIC strand pair (h0: red+yellow / purple+violet); the kind-0 ghost
    // strand takes the contrast hue at low alpha (p2's one-sided chromatic ghost)
    // B7 (doc 05 step 2): the tether reads the HELD accent ink — one hue per appearance,
    // snapping per event (the r0 tether trace), shared exactly with the orb rings.
    var h = accentHue + (tk === 2 ? strand * 0.12 : 0) + (tk === 0 && strand ? 0.45 : 0);
    var ghostDim = tk === 0 && strand ? 0.4 : 1;
    var dim = tk === 4 ? 0.85 : 1; // rope reads soft but SOLID (h1: pale fuzzy rod)
    // kite POLARITY (p1 T2): dark-on-light over the flat-wash / caustic grounds
    var bgm = Math.floor((a.q29 || 0) + 0.5);
    if (tk === 5 && (bgm === 5 || bgm === 8)) dim *= 0.25;
    var spkT = dim * (1 + 0.35 * spikeAmt); // D13: the tether is accent-family — it spikes too
    a.r = Math.min(1, orbCol(h, 0) * spkT);
    a.g = Math.min(1, orbCol(h, 0.33) * spkT);
    a.b = Math.min(1, orbCol(h, 0.67) * spkT);
    if (railOn && tetherEnv < 0.5) {
      // quiet rail = a pale desaturated hairline (p2: lavender/white); events restore full ink
      a.r = a.r * 0.4 + 0.6;
      a.g = a.g * 0.4 + 0.6;
      a.b = a.b * 0.4 + 0.6;
    }
    // alpha set EVERY point (the reused point object would leak a one-shot 0 across strand 2);
    // fly-back segments joining consecutive strands are hidden (generalised for 1-4 strands)
    var flyback = (tt < 0.012 && strand > 0) || (tt > 0.988 && strand < NS - 1);
    a.a = flyback ? 0 : (tk === 4 ? 0.75 : 0.85) * twigDim * ghostDim;
    return a;
  }

  // ── director state (closure → persists; ONE preset, never reloaded) ──
  var lastT = 0,
    huePhase = 0,
    hueStep = 0,
    lastBgMode = -1,
    alcKV = 0, // doc 10 step 2: kaleido lattice variant, picked once per visit (0 diamonds ·1 bowtie ·2 lens ·3 rainbow-bands)
    alcInKal = false, // was in kaleido last frame? (fresh-visit edge → re-roll alcKV)
    pulse = 0, // SMOOTHED beat envelope (fast attack / slow release) — breathes, never strobes
    panMag = 0,
    focusAmt = 0, // modes 0 (anemone) / 2 (urchin) → COMP pupil + oblate squash
    corridorAmt = 0, // bgMode 3 → the marching-orbiter corridor (side-view, rightward drift)
    valleyAmt = 0, // motif 12 → the green valley corridor (forward dolly into the vanishing point)
    freezeAmt = 0, // motif 14 mountains → FREEZE displacement field (doc 01 C2: stamps hold crisp)
    sagAmt = 0, // bgMode 4/6 bars/bands → gentle DOWNWARD trail stream (doc 01 C2 field 2)
    washAmt = 0, // bgMode 5 flat wash → DEPOSIT-HOLDING ground (doc 05 C10: stains live 3-6s)
    radialAmt = 0, // motifs 2/16 urchin/fluff → outward trail streaming from the hub (field 3)
    eyeAmt = 0, // motif 8 vortex → trail rotation about an off-centre eye (field 4)
    eyeX = 0.35, // the eye — re-rolled each time the field engages (p3: (33%, 8%))
    eyeY = 0.3,
    eyeOn = false, // upward-crossing tracker for the re-roll
    rippleT0 = -99, // C8 radial-ripple finale event birth (rare, cooldown ≥75s)
    mtStampT = -9, // doc 02 B3: last terrain stamp instant (mountains ridge generations)
    sinkImp = 0, // per-stamp decaying SINK impulse — steps the buffer down one generation
    lastMotif = -1, // doc 02 D11: entry detector for the per-dwell mountains identity roll
    mtTilt = 0, // rail tilt (0 or ~±35-45°, p2 2.7)
    mtPinchPhase = 0, // pinch-envelope phase → triangular peaks
    mtHueStep = 0, // per-stamp EMITTER hue walk; the pile keeps old hues (trail is hue-frozen)
    mtStampEnv = 0, // bright-deposit window right after a stamp
    scRowOff = 0, // doc 02 A10: scallop emitter row height (walks the band over ~10s)
    scRowT = -9, // last row re-seat
    scalAmt = 0, // mode-19 engagement: orb parking + the warp's q12<0 scallop y-flow
    accTerrVis = 1, // accessory fade under terrain motifs 14/19 (frozen-ray-spray guard)
    swathAmt = 0, // doc 02 A3: harp-swath accessory (accLine 5) mini-freeze engagement
    accSwathTick = -9, // last discrete strand-copy stamp
    accSwathFam = 0, // alternating colour family (p0: gold+indigo interleaved)
    accSwathEnv = 0; // ~1-frame bright deposit window per tick
  // ── ACCESSORY LAYERS + REST BREATHING (survey 2026-07: the original runs 3-5 simultaneous
  // element classes — motif + orbs/tether + a bead row/chain + a sweeping ray curtain — and
  // empties to 1-2 classes for a few seconds every 8-12s). Accessory state lives in the
  // CLOSURE (all 32 q-vars are taken; the waves' point fns share this scope — q-vars are only
  // needed for shaders). Accessories are drawn in absolute screen space on their own clocks. ──
  var accLine = 0, // wave1 slot: 0 none · 1 beat-fired ray-curtain sweep · 2 waveform bundle
    accLineNext = -1,
    accLineT0 = -9,
    accLineArm = false,
    accLineEnv = 0,
    accLineRot = 0,
    accLineAng = 0,
    accLineX = 0.5,
    accLineY = 0.5,
    accLineDrift = 0,
    accLinePickT = 0, // pinwheel rotation reference (steady windmill, 480p 0:39-0:45)
    evNextT = 0, // TYPED BEAT-EVENT SCHEDULER (doc 03 B2): earliest next fire
    evTetherT0 = -9, // tether-spawn event birth
    evTetherLife = 0, // this spawn's life: 0.4-2s burst, or a LONG 3.5-10s session (user)
    evTetherDropT0 = -9, // long sessions FLICKER: brief random dropouts (user, vs the original)
    evTetherDropLen = 0,
    evTetherDropNext = 0,
    tetherEnv = 0, // tether event envelope (read by waves[2])
    inkOff = 0.08, // doc 06 B1: per-event ACCENT ink — a bounded offset on the q8 clock shared
    // by the tether + both orb RINGS; snaps per tether/hue event ("orbs+tether share one ink
    // pair that snaps per event" — the spine of the whole visualizer, p3 §3.3)
    fillHue = 0.55, // orb FILLS lag the rings ~1s (r0: gold fill kept under a new green ring) —
    // eases toward accentHue (was fillLag, an offset chasing inkOff, before doc 05 step 2)
    tetherKind = 0, // doc 06 A5: construction, re-rolled PER SPAWN (0 chord · 1 helix · 2 staircase
    // · 3 lightning+twigs · 4 rope · 5 kite · 6 cascade); chord stays dominant in the bag
    tetherSeed = 0, // per-appearance parameter re-roll (loop counts, branch points, phases)
    heldKey = -1, // kind-2 staircase sample-and-hold state (points iterate in sample order)
    heldVal = 0,
    envHold = [0, 0, 0, 0, 0, 0, 0, 0, 0], // kind-0 SLOW chevron envelope: 9 coarse REAL-waveform
    // samples held ~0.5-1s (h2: the envelope evolves slowly while the fine jag reshuffles at 60fps)
    envNext = 0,
    envRefresh = false,
    knotPos = 0.5, // kind-0 mid-span scribble knot centre (re-rolled per spawn, roams slowly)
    railAmt = 0, // doc 06 step 5: PERSISTENT rail-chord (rare, 15-30s, survives scene changes)
    railWant = 0,
    railT0 = -99,
    railLife = 20,
    railAx = 0.35, // frozen rail endpoints (rotate slowly about the midpoint, p2: 3-5°/s)
    railAy = 0.5,
    railBx = 0.65,
    railBy = 0.5,
    evStarT0 = -9, // one-shot star stamp event (doc 03 A12)
    evStarLife = 0.22,
    evStarOn = false, // read by waves[1] (point fns share the closure)
    evStarPts = 10,
    evStarR = 0.14,
    evStarHue = 0.3,
    evStarAnchor = 0, // 0 motif centre; 1 orb A (p3 186.5: a star wraps an orb)
    stampT0 = -9, // STAMP-CADENCE modes (doc 03 D7): last stamp instant
    stampNext = 0,
    stampSeed = 0, // re-rolls the tangle geometry per stamp (r0: fully re-randomized)
    stampHueOff = 0, // emitter-only hue walk; the trail keeps old hues (A14 resolution)
    stampGain = 1, // crisp-vs-residual envelope, multiplied into centralDraw
    prevMix = 0, // B4b: transition-start detector
    anchorAmt = 0, // B4b anchor-seed blend (1 at spawn, releases over ~4-6s)
    anchorX = 0.5,
    anchorY = 0.5,
    lastQ2 = 0.5, // previous frame's motif centre + orb anchors (orbs compute later in frame)
    lastQ3 = 0.5,
    lastOrbAX = 0.35,
    lastOrbAY = 0.5,
    lastOrbBX = 0.65,
    lastOrbBY = 0.5,
    sketchAmt = 0, // SKETCHBOOK rest scene (doc 03 A13) engagement
    restStampMode = 1, // current wireframe construction (REST_CYCLE)
    restStampHue = 0, // cycles WITH the construction (h1: white-maroon-blue-magenta)
    restStampT0 = -9,
    restStampNext = 0,
    accDots = 0, // wave3 slot: 0 none · 1 marching bead row · 2 caterpillar chain
    accDotsNext = -1,
    accDotsPhase = 0,
    accDotsDir = 1,
    accDotsY = 0.5,
    accDotsHue = 0,
    accVis = 1, // accessory visibility (fades out during rests)
    accBundleVis = 1, // bundle gate: off while a busy sprawling motif is up (net/vortex/tangle)
    resting = false,
    breathNext = -1,
    restAmt = 0,
    restDeep = false, // B6a (doc 04): this rest is DEEP — the central motif leaves too
    deepAmt = 0, // eased deep-rest engagement (multiplies q4 down)
    starveT = 0, // B6b: seconds of continuous deep-quiet (starvation detector)
    starveAmt = 0; // eased starvation drain (trails collapse, emitters starve)
  var FEAT_DEEPREST = true, // doc 04 A/B flips (one-line disable per step)
    FEAT_STARVE = true,
    FEAT_TRANS = true,
    transType = 0, // B10: 0 wash-dissolve · 1 sweep-replace · 2 quad-fold spike · 3 hard wipe
    transT0 = -99,
    transDur = 0.7,
    prevBgSnap = -1, // snap detectors (-1 = unseeded, no fire on the first frame)
    prevMoSnap = -1;
  // ── PER-CLASS COLOUR CLOCKS (doc 05 B7/D12). The refs run INDEPENDENT hue clocks per element
  // class — ground (the continuous q8 shader clock, unchanged), central motif (a STEPPED walk:
  // hold 0.75-2s, then jump a hue family), free accessories (their own slower walk). All changes
  // are EMITTER draw colours only; the trail keeps its birth hue (THE ONE LAW — never recolour
  // the buffer), so two-generation two-tone accumulations come free. Closure state — the wave
  // point fns share this scope; the shader only ever needs the global q8 (the ground's clock). ──
  var motifHue = 0, // held motif draw hue — steps, never drifts (h0 §3.3)
    motifHueOld = 0, // the previous held hue (rim ghosts / the radial front)
    motifStepT = -9, // last step instant (-9 = unseeded)
    motifStepNext = 0,
    accHue = 0.3, // free-accessory clock (p0: strands/columns snap at their own moments)
    accStepNext = 0,
    lastMCur = -1, // motif-identity swap detector (B7 step 3: re-seed the motif hue vs ground)
    accentHue = 0.55, // B7 (doc 05 step 2): the HELD accent-family ink — both orb rings + the
    // tether read this one value (r0: "tether hue = ring hue"); events re-anchor it near the
    // ground family, beats walk it. Held between snaps — never dragged by the continuous clock.
    accentSnapT = -9,
    spikeT0 = -99, // D13: rare ~0.6s VIVID SPIKE window on the accent family (p1: t=90.3 fold)
    spikeAmt = 0, // per-frame spike envelope, 0 under kaleido (the bg carries saturation there)
    splatT0 = -9; // A14 (doc 05 step 6): one-shot splat DEPOSIT at the tether endpoints — a
  // 0.35s orbGlow swell stamps a fat neighbouring-hue puff ~2x the orb into the feedback, which
  // diffuses 2-4s (3-6s on the C10 wash) and keeps its birth hue forever (THE ONE LAW). The
  // refs' crisp filled wobbly-outline amoeba has NO renderer in budget (all 4 shape slots taken;
  // waves[3] is dots-mode, so an outline ring there = the removed bead-row ugliness) — the
  // glow-stamp route is the matrix-sanctioned approximation ("deposit = trail").
  // SPIROGRAPH per-stamp state (doc 08 A1) — the waves[0] point fn (fSpiro) reads these; no q-var
  // needed (all 32 taken; no shader wants the variant). Identity re-rolls per stamp (step 2).
  var spiroVar = 0, // 0 dahlia · 1 fur-ball (many-petal) · 2 ferris wheel (dahlia + connector ring)
    spiroK = 12, // petal/point/spoke count (per-stamp within a variant's range)
    spiroRot = 0, // per-stamp rotation snap — SLIGHT (feathery ghosting hugs the petals)
    spiroSeed = 0, // per-DWELL petal-identity seed (stable while the motif is up → ghosts align)
    spiroRingAmt = 0, // wheel connector-ring opacity (flashes in on variant 3, melts out)
    spiroStampT = -9, // time of the last construction stamp
    spiroHue = 0, // per-stamp hue snap, riding the shared q8 clock
    spiroTilt = 1, // 1 face-on; <1 oblate y-squash (step 3)
    spiroNext = -1; // next stamp time (-1 = not entered)
  // MESH COCOON per-stamp state (doc 09 A2) — fCocoon + the frame-side eye/stamp blocks read these;
  // no q-var (all 32 taken; no shader wants cocoon state).
  var cocSeed = 0, // hash seed → node graph; re-rolled per stamp (step 3)
    cocStampT = 0, // last stamp time
    cocEnv = 1, // crisp-over-ghost envelope (step 3; 1 = full crisp)
    cocAmt = 0, // eye-anchor lerp amount (step 2)
    cocHue = 0, // strand hue step (step 3)
    cocAng = 0, // per-stamp rocking-angle offset
    cocElong = 1, // crumple-cocoon elongation (step 4)
    cocSizeMul = 1, // per-stamp size (step 3; dia 25-38%)
    cocFlavour = 0; // 0 dreamcatcher · 1 crumple-cocoon · 2 geodesic sphere (step 4)
  // h1 M7: the tangle stamps in ONE hue every 1.3-2s, crisp ~1-1.5s, then only trail; more
  // modes can join this table later (r0's 0.2-0.3s fast tier already lives in the cocoon block)
  var STAMP_MODES = { 13: { gapMin: 1.3, gapMax: 2.0, crisp: 1.0 } };
  // doc 06 A5 construction bag — chord dominant (0 chord ·1 helix ·2 staircase ·3 lightning
  // ·4 rope ·5 kite ·6 cascade); pearl-chain SKIPPED per the answered README Q8
  var TETHER_BAG = [0, 0, 0, 0, 1, 1, 2, 2, 3, 4, 5, 5, 6];
  var REST_CYCLE = [1, 7, 10, 15]; // sketchbook constructions: star-net / net / 12-star / tri-mandala
  var beat = alcBeatFlash({ rise: 1.22 });
  // WEIGHTED bags — DOMINANT = dark wavy-fluid ground; kaleidoscope + radial-tunnel are ACCENTS.
  // doc 12 D5: the flat WASH is the dominant REST ground in the refs (p1 B2, ≈half the runtime),
  // not the wavy-fluid — so wash(5)×4 + wavy(0)×3 now lead. New structured regimes 10-14 (curtain/
  // floor/strata/wallpaper/chevron) append here as each lands.
  var BG_BAG = [5, 5, 5, 5, 0, 0, 0, 1, 1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 12, 13, 14]; // 0 wavy-fluid · 1 kaleido · 2 radial-tunnel · 3 corridor · 4 vertical-bars · 5 flat-wash(dominant rest) · 6 horizontal-bands · 7 bullseye · 8 caustic · 9 treadmill · 10 curtain · 11 floor-band · 12 strata · 13 wallpaper · 14 chevron
  // polygon-flower family boosted (user: "mostly single triangle or square, never saw the
  // 2-triangle star or many-triangle flower"): hexagram ×2 + tri-mandala ×2 + fluff ball ×2.
  // D8 dedupe (doc 14a Step 1): star-net (1) cut 3→2 and the freed slot moved to valley (12), so
  // the near-identical ray-star family (1/2/8/10) drops from 6 to 5 shares of the bag.
  // bead-chain (11) PULLED from the bag (user 2026-07-09: reads as a drawn dotted stick —
  // the same removed-bead territory as the answered Q8; slot moved to tri-mandala 15)
  var MOTIF_BAG = [
    0, 0, 1, 1, 2, 3, 4, 5, 6, 6, 7, 7, 8, 9, 10, 15, 12, 12, 13, 13, 14, 15, 15, 16, 16, 17, 17,
    18, 18, 19,
  ];
  // ── B11 (doc 04 step 1): bg×motif PAIRING weights — the refs' scenes are composed set-pieces,
  //    not a uniform cross-product (bars + stem-standing organic · corridor + terrain/net ·
  //    kaleido + radial mirror-friendly · wash + ONE organic ball · bands + small centre motif).
  //    Disfavoured combos still pass at ~35% (weight, never forbid). ──
  var FEAT_PAIRING = true;
  var PAIR = {
    4: [13, 15, 16, 14, 17], // bars → tangle/mandala/fluff/mountains/dahlia (stem-standing)
    3: [14, 7], // corridor/near-black → mountains / the wireframe net (the opening signature)
    1: [0, 2, 10, 15, 6, 17], // kaleido → radial motifs that mirror well
    5: [16, 13, 9, 18], // flat wash → ONE dominant organic ball
    6: [13, 16, 15], // bands/wallpaper → small centre motif
  };
  var curBgMode = 0; // frame() refreshes this before the motif clock runs (accept cb reads it)
  function acceptMotif(idx) {
    if (!FEAT_PAIRING) return true;
    var fav = PAIR[curBgMode];
    if (!fav) return true;
    var id = MOTIF_BAG[idx];
    for (var i = 0; i < fav.length; i++) if (fav[i] === id) return true;
    return Math.random() < 0.35;
  }
  var bgPick = makePicker(BG_BAG.length, 7, 12, 3.0);
  var motifPick = makePicker(MOTIF_BAG.length, 6, 11, 2.0, acceptMotif);
  var panDir = makeSnapDir(3.0, 6.0); // ABRUPT-snap pan direction (the 2:24-2:31 camera)
  // ── ORB BALLOON EVENTS (doc 07 D2a). The refs' orb pops are BALLISTIC one-shot events —
  //    inflate 2-3x in ~0.1-0.35s, settle back over ~0.4-1.2s (p2 166.58: 50→150px in 0.35s;
  //    h0: attack ≤2 frames) — NOT a continuous breathing swell. The two orbs fire near-together
  //    but desynced ~0.1s with different maxima (p2). Closure state; the orb shapes read
  //    radScaleA/B directly (no free q-vars, shapes share this scope). ──
  var balloonT0A = -9,
    balloonT0B = -9,
    balloonMagA = 1,
    balloonMagB = 1,
    balloonNext = -9,
    radScaleA = 1,
    radScaleB = 1;
  function fireBalloon(time) {
    balloonT0A = time;
    balloonT0B = time + 0.06 + 0.08 * Math.random(); // ~0.1s offset (p2)
    balloonMagA = 1.8 + 1.2 * Math.random(); // peak 1.8-3x
    balloonMagB = 1.8 + 1.2 * Math.random(); // different maxima (p2)
    balloonNext = time + 2 + 3 * Math.random(); // rate limit: every ~2-4s in busy passages
  }
  function ballEnv(age, mag) {
    // overshoot-and-settle: smoothstep attack to the peak, exponential release
    if (age < 0) return 1;
    var atk = 0.12; // refs: 0.03-0.35s attack
    if (age < atk) {
      var u = age / atk;
      return 1 + (mag - 1) * u * u * (3 - 2 * u);
    }
    return 1 + (mag - 1) * Math.exp(-(age - atk) / 0.35); // settle ~0.4-1.2s
  }
  // ── ORB STAGING state (doc 07 D15): parked posts + slides + single-endpoint re-casts ──
  var stgAx = 0.28, // posts (diagonal default — refs: diagonal-dominant axes)
    stgAy = 0.72,
    stgBx = 0.72,
    stgBy = 0.28,
    stgNext = -1, // next cast/dwell decision
    stgSlideT0 = -9, // slide window start (both posts drift along the axis ~2s)
    stgSlideVX = 0,
    stgSlideVY = 0,
    stgForce = ""; // debug pin: "hold" | "slide"

  function frame(t) {
    var time = t.time || 0;
    // __ALC_FORCE debug keys (doc 03 Step 0; PRODUCTION NO-OP — the object is never set live).
    // Read once so closure-level LIFECYCLE state (motif/rest/event) is pinnable in self-renders;
    // the tail-of-frame hook only overrides t.* q-vars AFTER the frame logic has already run.
    var FORCE = (typeof window !== "undefined" && window.__ALC_FORCE) || null;
    var bass = t.bass || 1,
      bassA = t.bass_att !== undefined ? t.bass_att : bass;
    var dt = Math.min(0.05, Math.max(0.001, time - lastT));
    lastT = time;
    var energy = typeof alcEnergy === "function" ? alcEnergy(t) : bassA;
    var f = beat(t.bass || 1, dt);
    // SMOOTHED beat envelope — size/exposure/orb pops ride THIS, not the raw flash (no strobe/jitter).
    pulse += (f - pulse) * Math.min(1, dt * (f > pulse ? 12 : 2.6));

    // ── BACKGROUND — its own slow clock; 0 wavy-fluid (dominant) · 1 kaleidoscope · 2 radial-tunnel ──
    var bg = bgPick(time, dt, false);
    var bgSnapIdx = bg.mix < 0.5 ? bg.a : bg.b; // B10: transition detector reads the snap moment
    t.q29 = BG_BAG[bgSnapIdx]; // discrete snap (the persistent trail buffer bridges cuts)
    if (FORCE && FORCE.q29 !== undefined) t.q29 = FORCE.q29; // pin drives bg-gated lifecycle too
    var bgMode = Math.floor(t.q29 + 0.5);
    curBgMode = bgMode; // B11 pairing: the motif accept callback reads the live bg

    // ── COLOUR (MEASURED). Continuous hue clock: ~0.07 cyc/s calm → ~0.22 cyc/s kaleidoscope/energetic
    //    (full wheel in ~14s..~5s, matching the measured net-drift). Plus a small per-beat nudge for the
    //    snappy feel — NOT a 3-5Hz strobe (Gemini was wrong), NOT neon (sat lives in the shaders ~0.45). ──
    var hueRate = bgMode === 1 ? 0.2 : 0.1; // kaleidoscope cycles fastest (measured ~5s); calm ~10s
    huePhase = alcHueClock(huePhase, dt, Math.max(0, energy - 1), hueRate, 0.12);
    if (bgMode !== lastBgMode) {
      if (lastBgMode >= 0)
        hueStep += (0.08 + 0.14 * Math.random()) * (Math.random() < 0.5 ? -1 : 1);
      lastBgMode = bgMode;
    }
    // ── TYPED BEAT-EVENT SCHEDULER (doc 03 B2): at most ONE typed event fires per qualifying
    //    hit — min gap 0.8s, mean 1.5-3s in busy phases, SILENT in rests (p2 §3.5: no events
    //    during rests). The old inline hue snap moved in here (same visual rate, now mutually
    //    exclusive with other events on the same hit). Later docs register more event types. ──
    if ((f > 0.75 || (FORCE && FORCE.ev !== undefined)) && time >= evNextT && restAmt < 0.5) {
      var evRoll = Math.random();
      var evPick =
        FORCE && FORCE.ev !== undefined
          ? FORCE.ev
          : evRoll < 0.45
            ? "tether"
            : evRoll < 0.8
              ? "hue"
              : "star";
      if (evPick === "star") {
        // ONE-SHOT STAR STAMP (A12; h2 2.7: nested chromatic-offset spiky outlines, ~25-35% of
        // frame; p3: the ghost persists after). Crisp for a blink, then STOP - the buffer ghosts it.
        evStarT0 = time;
        evStarLife = 0.22;
        evStarPts = 8 + Math.floor(Math.random() * 5); // 8-12 points
        evStarR = 0.11 + Math.random() * 0.07;
        evStarHue = 0.15 + Math.random() * 0.35;
        evStarAnchor = Math.random() < 0.7 ? 0 : 1;
      } else if (evPick === "tether") {
        // RAIL (doc 06 step 5): a would-be spawn occasionally opens a persistent RAIL instead
        // (~1 per 1-3 min): a dim pale micro-jagged chord that outlives scene changes and rests,
        // orbs parked on its endpoints (answered README Q11: parked posts approved).
        // rail duty tuned to the refs (~38s of rail across the 228s video ≈ 17%; ours at 8%
        // per event was up ~half the time — user: "sometimes the tether shows as straight
        // line only" far more than the original): ~2% per event ≈ one rail per ~80s busy time.
        if (!railWant && corridorAmt < 0.1 && Math.random() < 0.02) {
          railWant = 1;
          railT0 = time;
          railLife = 12 + Math.random() * 13; // 12-25s (p0 ~25s; p2 instances 5-8s)
          railAx = lastOrbAX;
          railAy = lastOrbAY;
          railBx = lastOrbBX;
          railBy = lastOrbBY;
        }
        // TETHER SPAWN (B2; doc 06 refines the anatomy): most spawns are short 0.4-2s bursts;
        // ~40% open a LONG SESSION (3.5-10s) — the user confirmed the original often keeps the
        // tether up for a while, with brief random dropouts (the flicker block below).
        evTetherT0 = time;
        evTetherDropNext = time + 1 + Math.random() * 1.5; // first flicker no sooner than ~1s in
        // B1: the accent ink snaps PER EVENT (bounded q8 offset ±0.36 — never a raw hue, stays muted)
        inkOff = (0.06 + 0.3 * Math.random()) * (Math.random() < 0.5 ? -1 : 1);
        accentHue = huePhase + hueStep + inkOff; // B7: the event RE-ANCHORS the held accent ink
        accentSnapT = time;
        // A5: per-appearance construction re-roll (chord dominant); rope (4) is persistent ~5s (h1)
        tetherKind = TETHER_BAG[(Math.random() * TETHER_BAG.length) | 0];
        tetherSeed = Math.random() * 100;
        // A14: about half the casts DEPOSIT a splat where the tether lands (p1 O12), ≥4s apart
        if (time - splatT0 > 4 && Math.random() < 0.5) splatT0 = time;
        if (FORCE && FORCE.tetherKind !== undefined) tetherKind = FORCE.tetherKind;
        // ★ PER-KIND LIFE (design language + measured duty; user: a helix/kite held for seconds
        // reads as a drawn static shape and the refs never show one): only the plain chord and
        // the staircase hold LONG sessions (h0: the staircase persists for the scene's life);
        // every other construction is a BRIEF event. helix 1.5-2s ON (p1 duty) · lightning
        // ~0.5s flash (p1) · kite mostly 0.25-0.5s flicks, occasionally ~2s (p1 T2) · rope
        // ~5s rod (h1) · cascade 1.2-2.2s (the fan IS its trail).
        if (tetherKind === 0 || tetherKind === 2)
          evTetherLife =
            Math.random() < 0.4 ? 3.5 + Math.random() * 6.5 : 0.4 + Math.random() * 1.6;
        else if (tetherKind === 1) evTetherLife = 1.5 + Math.random() * 0.5;
        else if (tetherKind === 3) evTetherLife = 0.35 + Math.random() * 0.3;
        else if (tetherKind === 4) evTetherLife = 4 + Math.random() * 2;
        else if (tetherKind === 5)
          evTetherLife =
            Math.random() < 0.8 ? 0.25 + Math.random() * 0.25 : 1.6 + Math.random() * 0.6;
        else evTetherLife = 1.2 + Math.random();
        knotPos = 0.35 + 0.3 * Math.random(); // the scribble knot lands somewhere mid-span (h2)
      } else {
        // HUE SNAP (480p 2:56-3:10 + the 19s clip: palette jumps within a beat or two on hits)
        hueStep += (0.05 + 0.07 * Math.random()) * (Math.random() < 0.5 ? -1 : 1);
        inkOff = (0.06 + 0.3 * Math.random()) * (Math.random() < 0.5 ? -1 : 1); // accent rides the snap
        accentHue = huePhase + hueStep + inkOff; // B7: re-anchor (see the tether branch)
        accentSnapT = time;
      }
      evNextT = time + 0.8 + Math.random() * 1.7; // mean gap ~1.65s (was ~1.9 — user: tether too rare)
    }
    // p0: the tether spawns fully-formed within a frame; the stop is fast — the buffer keeps the
    // ghost. Long sessions FLICKER: brief 0.15-0.6s dropouts at random 0.8-2.6s intervals (user:
    // "it stays for long, often disappearing briefly every now and then — this is also random").
    var tethAlive = time < evTetherT0 + evTetherLife;
    if (tethAlive && time >= evTetherDropNext) {
      evTetherDropT0 = time;
      evTetherDropLen = 0.15 + Math.random() * 0.45;
      evTetherDropNext = time + evTetherDropLen + 0.8 + Math.random() * 1.8;
    }
    var tethDrop = time - evTetherDropT0 < evTetherDropLen ? 0 : 1; // abrupt off/on, like the refs
    tetherEnv =
      (tethAlive
        ? Math.min(1, (time - evTetherT0) * 12)
        : Math.max(0, 1 - (time - evTetherT0 - evTetherLife) * 6)) * tethDrop;
    // ── B7 ACCENT WALK (doc 05 step 2): between scheduler events the accent family still snaps
    //    on qualifying beats with a 0.6s floor (h2 tier b: discrete snaps ~0.5-0.75s on compact
    //    orbs; r0: 1.5-3s per event — beat-gating spans both depending on the music). Bounded
    //    walk steps keep it inside the muted envelope; rests are naturally silent (no beats). ──
    if (accentSnapT < -1) {
      accentHue = huePhase + hueStep + inkOff; // first-frame seed
      accentSnapT = time;
    }
    if (f > 0.6 && time - accentSnapT > 0.6) {
      accentHue += (0.06 + 0.3 * Math.random()) * (Math.random() < 0.5 ? -1 : 1);
      accentSnapT = time;
    }
    if (FORCE && FORCE.accentHue !== undefined) accentHue = FORCE.accentHue; // debug pin
    // ── D13 VIVID SPIKE (doc 05 step 7): on rare strong hits the accent family alone brightens
    //    ~0.6s (p1: vivid spikes are brief). Under the kaleidoscope the BG is the saturation
    //    carrier (p0 §3.4) — the accent stands down so there is only ever ONE hot element. ──
    if (FORCE && FORCE.spike) {
      spikeT0 = time;
      FORCE.spike = 0;
    }
    if (f > 0.95 && time - spikeT0 > 8 && bgMode !== 1) spikeT0 = time;
    var spu = (time - spikeT0) / 0.6;
    spikeAmt = spu >= 0 && spu < 1 && bgMode !== 1 ? Math.sin(spu * 3.14159) : 0;
    fillHue += (accentHue - fillHue) * Math.min(1, dt * 1.0); // orb FILLS chase the ink over ~1s (B1)
    envRefresh = time > envNext; // kind-0 chevron envelope refresh window (~0.5-1s, h2)
    if (envRefresh) envNext = time + 0.5 + Math.random() * 0.5;
    // RAIL lifecycle (doc 06 step 5): expire, ease, and rotate slowly about the midpoint
    // (~4°/s, p2). Deliberately NOT coupled to bgPick/motifPick/rests — it survives them (p0).
    if (FORCE && FORCE.splat) {
      splatT0 = time; // debug pin: fire one splat NOW (deterministic self-render shots)
      FORCE.splat = 0;
    }
    if (FORCE && FORCE.rail && !railWant) {
      railWant = 1;
      railT0 = time;
      railLife = 999; // debug pin holds it
      railAx = lastOrbAX;
      railAy = lastOrbAY;
      railBx = lastOrbBX;
      railBy = lastOrbBY;
    }
    if (railWant && time - railT0 > railLife) railWant = 0;
    railAmt += ((railWant ? 1 : 0) - railAmt) * Math.min(1, dt * 2);
    if (railAmt > 0.01) {
      var rmx = (railAx + railBx) / 2,
        rmy = (railAy + railBy) / 2;
      var rc = Math.cos(0.07 * dt),
        rs = Math.sin(0.07 * dt);
      var r1x = railAx - rmx,
        r1y = railAy - rmy;
      railAx = rmx + r1x * rc - r1y * rs;
      railAy = rmy + r1x * rs + r1y * rc;
      railBx = rmx - (r1x * rc - r1y * rs); // B mirrors A about the midpoint
      railBy = rmy - (r1x * rs + r1y * rc);
    }
    evStarOn = time < evStarT0 + evStarLife; // read by the waves[1] stamp branch
    t.q8 = huePhase + hueStep + 0.03 * pulse; // small per-beat hue nudge

    t.q31 = 0.92 * (1 + 0.1 * (bassA - 1) + 0.2 * pulse); // exposure — gentle smoothed beat lift
    t.q32 = 1 + 1.3 * pulse;

    // ── WATERCOLOUR FEEDBACK ENGINE ──
    t.q1 = 0.957; // decay — long diffusing trails (vs V6's 0.84-0.93 short trails)
    t.q28 = 0.5; // BLUR / diffusion mix — the watercolour bleed; this IS the "grow + soften in place"
    // MAGNIFY kept TINY — the watercolour growth must come from the in-place BLUR, NOT a radial march
    // (a big magnify marches deposits to the frame edges = the rejected spiky-burst over-fill).
    t.q15 = 0.0012 + 0.0018 * pulse;
    t.q16 = 0.01 * Math.sin(time * 0.06); // gentle sign-oscillating roll (no constant spin)
    t.q17 = 0.0; // swirl off (vortex mode raises it)

    // ── CAMERA PAN — abrupt-snap direction dragging the trail buffer (the 2:24-2:31 parallax).
    //    REST field (C1, doc 01 step 1): the refs go near-still during rest beats (4-10s near-still
    //    rests in every report) — the pan eases out with restAmt (prev-frame value; eased, so the
    //    one-frame lag is invisible) and resumes the familiar snap-pan when the rest ends. ──
    panMag += (0.0045 * (1 - 0.9 * restAmt) - panMag) * Math.min(1, dt * 0.8);
    var pdir = panDir(time);
    t.q18 = panMag * Math.cos(pdir);
    // constant bias streams the buffer DOWNWARD (measured sign map: +q19 streams UP — the old
    // "upward drift" comment was wrong); rests damp it like the pan.
    t.q19 = panMag * Math.sin(pdir) - 0.0012 * (1 - 0.9 * restAmt);

    // ── OFF-CENTRE drifting pivot on an elliptical path → asymmetric parallax (edges sweep faster). ──
    var vpAng = time * 0.045,
      vpR = 0.12 + 0.04 * Math.sin(time * 0.02);
    t.q20 = 0.5 + vpR * Math.cos(vpAng);
    t.q27 = 0.5 + vpR * Math.sin(vpAng * 1.31);

    // ── FOLD — engage the kaleidoscope only on bgMode 1 (the COMP tiled-diamond fold reads q13;
    //    fold-on is implied by q29==1). q12 FREED (doc 01 step 6): now the warp's sawtooth x-shear
    //    amount (-1..1, 0 = off) — DORMANT until the structured-grounds doc (C4) writes it. ──
    t.q12 = 0;
    // doc 10 step 2 — MULTIPLEX q13 (already kaleido-scoped, 0 elsewhere): integer part =
    // lattice variant (picked once per kaleido visit), fraction = the breathing fold scale.
    // The COMP reads kv=floor(q13), ksc=fract(q13). No new q-var (all 32 taken); the WARP's
    // q17/q16/q18/q19 stay live during kaleido, so we never steal them.
    if (bgMode === 1) {
      if (!alcInKal) alcKV = (Math.random() * 4) | 0;
      alcInKal = true;
      var kscale = Math.max(
        0,
        Math.min(0.9, 0.5 + 0.4 * Math.min(1, bassA - 1 + 0.5 * Math.sin(time * 0.07)))
      ); // clamp to [0,0.9] so floor(q13) stays the variant integer
      t.q13 = alcKV + kscale;
    } else {
      alcInKal = false;
      alcKV = 0;
      t.q13 = 0;
    }
    if (FORCE && FORCE.q13 !== undefined) t.q13 = FORCE.q13; // pin drives lattice variant in self-renders

    // ── CENTRAL MOTIF — own clock; geometry swapped under an opacity dip (q4) so it morphs invisibly. ──
    var mo = motifPick(time, dt, f > 0.6);
    var mCur = MOTIF_BAG[mo.mix < 0.5 ? mo.a : mo.b];
    // ── B10 (doc 04 step 6): every ref transition is a FEEDBACK EVENT, not a palette cut —
    //    on any bg/motif snap roll a transition type: 0 wash-dissolve (common) · 1 sweep-replace
    //    (ground-only, = the existing snap) · 2 quad-fold vivid spike · 3 rare HARD WIPE
    //    (answered README Q5). Applied at the frame tail on q-vars the closure already owns. ──
    var moSnapIdx = mo.mix < 0.5 ? mo.a : mo.b;
    if (
      (bgSnapIdx !== prevBgSnap && prevBgSnap >= 0) ||
      (moSnapIdx !== prevMoSnap && prevMoSnap >= 0)
    ) {
      var rt = Math.random();
      // quad-fold spike (type 2) REMOVED from the natural roll — user: "kaleidoscope appears for
      // a very short duration"; that 0.6s q29:=1 comp-fold on ~20% of snaps read as a brief,
      // frequent kaleido flash. Its 20% folds into wash-dissolve (the common benign one). The
      // apply block below is kept intact for the FORCE._transType debug pin / a future revisit.
      transType = rt < 0.75 ? 0 : rt < 0.95 ? 1 : 3;
      transT0 = time;
      transDur = transType === 3 ? 1.4 : transType === 2 ? 0.6 : 0.7;
    }
    prevBgSnap = bgSnapIdx;
    prevMoSnap = moSnapIdx;
    if (FORCE && FORCE.motif !== undefined) mCur = FORCE.motif; // pin drives lifecycle logic, not just q30
    // ── D12 STEPPED MOTIF CLOCK (doc 05 step 1): the emitter hue arrives in STEPS — hold
    //    0.75-2s, then jump a visible hue-family (h0; busier music → shorter holds). The ground
    //    keeps the continuous q8 clock: the per-wave q8 override in centralDraw is local to that
    //    wave's point object (verified vendor mechanism), the shader still sees the global.
    //    Stamp-walk modes (tangle 13 / mountains 14 / spiro 17 / cocoon 18) own their per-stamp
    //    hue cadence — the base HOLDS while they're up so hue never double-steps. ──
    if (motifStepT < -1) {
      motifHue = t.q8 + 0.1; // first-frame seed near the ground family
      motifHueOld = motifHue;
      motifStepT = time;
    }
    if (FORCE && FORCE.motifHue !== undefined) {
      motifHue = FORCE.motifHue; // debug pin (self-render acceptance shots)
      motifHueOld = FORCE.motifHueOld !== undefined ? FORCE.motifHueOld : FORCE.motifHue;
    }
    // ── B7 COMPLEMENTARY SEEDING (doc 05 step 3): when the motif IDENTITY swaps, re-seed its
    //    clock RELATIVE TO THE GROUND — 1-in-4 near-complementary (p1 M2: coral-red mesh ON a
    //    sage-green ground), else analogous (the default harmony). Hue relationships only; on
    //    Pastel a complementary pair still renders dusty (the comp is untouched). The B4a
    //    stop-then-bloom handoff already hides the seam. ──
    if (mCur !== lastMCur) {
      if (lastMCur >= 0) {
        motifHueOld = motifHue;
        motifHue =
          Math.random() < 0.25
            ? t.q8 + 0.5 + (Math.random() - 0.5) * 0.16 // complementary
            : t.q8 + (Math.random() - 0.5) * 0.3; // analogous
        motifStepT = time;
      }
      lastMCur = mCur;
    }
    var ownWalk = mCur === 13 || mCur === 14 || mCur === 17 || mCur === 18;
    if (!ownWalk && time >= motifStepNext) {
      motifHueOld = motifHue;
      motifHue += (0.06 + 0.1 * Math.random()) * (Math.random() < 0.5 ? -1 : 1);
      motifStepT = time;
      motifStepNext = time + 0.75 + 1.25 * Math.random() * (1.2 - Math.min(0.7, pulse));
    }
    // free accessories: their own slower step walk, re-anchored near the ground clock each
    // step (bounded offsets — the muted guardrail; p0: snaps at DIFFERENT moments than the motif)
    if (time >= accStepNext) {
      accHue = t.q8 + 0.18 + 0.3 * Math.random();
      accStepNext = time + 1.0 + 1.5 * Math.random();
    }
    // ── STAMP-CADENCE modes (doc 03 D7; h1 M7): the tangle lives as one-hue STAMP events —
    //    geometry fully re-rolled per stamp, fresh emitter hue over the previous generation's
    //    persisting cloud (never recolour the buffer — trails age in place, A14). ──
    var stampCfg = STAMP_MODES[mCur];
    if (stampCfg) {
      if (time >= stampNext && (f > 0.6 || time >= stampNext + 1.5)) {
        stampT0 = time;
        stampSeed = Math.random() * 6.2832;
        stampHueOff += (0.15 + Math.random() * 0.35) * (Math.random() < 0.5 ? -1 : 1); // h1: yellow→red→white steps
        stampNext = time + stampCfg.gapMin + Math.random() * (stampCfg.gapMax - stampCfg.gapMin);
      }
      stampGain = time - stampT0 < stampCfg.crisp ? 1 : 0.25; // crisp life, then "a few live arms" (r0)
    } else {
      stampGain = 1;
    }
    t.q30 = mCur;

    // (flash NOT under the kaleidoscope fold — it tiles the motif frame-wide and amplifies
    //  the flash into a milky washout)
    // ── B4a HANDOFF (doc 03 Step 5, user-confirmed): the old emitter STOPS ≤0.17s into the
    //    transition (its ghost carries the frame ~0.8s), then the new motif BLOOMS 25%→100% in
    //    <0.5s (p1 moth 82.9; h0 41.0). Replaces the whole-frame Gaussian dim dip — "the buffer
    //    does the crossfade" (r0). mo.mix runs 0→1 over the 2s window; q30 snaps at 0.5. ──
    // ── B4b ANCHOR-SEED (doc 03 Step 6; h2 §3.4): the incoming motif spawns ON an existing
    //    element — the old motif's centre (60%) or an orb (40%) — then releases to the free
    //    Lissajous path over ~4-6s. Positions are the previous frame's (computed later). ──
    if (prevMix === 0 && mo.mix > 0) {
      var ar = Math.random();
      anchorX = ar < 0.6 ? lastQ2 : ar < 0.85 ? lastOrbAX : lastOrbBX;
      anchorY = ar < 0.6 ? lastQ3 : ar < 0.85 ? lastOrbAY : lastOrbBY;
      anchorAmt = 1;
    }
    prevMix = mo.mix;
    var trans = mo.mix,
      flashMul = 1 + (bgMode === 1 ? 0 : 0.3) * pulse,
      bloomMul = 1;
    if (trans <= 0 || trans >= 1) t.q4 = 0.85 * flashMul;
    else if (trans < 0.5) t.q4 = 0.85 * Math.max(0, 1 - trans * 6) * flashMul;
    else {
      var bl = Math.min(1, (trans - 0.5) * 4);
      t.q4 = 0.85 * bl * flashMul;
      bloomMul = 0.25 + 0.75 * bl;
    }

    focusAmt +=
      ((mCur === 0 || mCur === 2 || mCur === 9 || mCur === 12 || mCur === 13 ? 1 : 0) - focusAmt) *
      Math.min(1, dt * 0.6); // anemone/urchin/jelly/valley/tangle get the warm-core pupil (orb-eye)
    valleyAmt += ((mCur === 12 ? 1 : 0) - valleyAmt) * Math.min(1, dt * 0.5); // valley → forward dolly

    // MOTIF contract (read by the point fns). The central motif DRIFTS gently around the frame (not
    // locked at center) so — as the hue clock advances + the feedback diffuses — it PAINTS a flowing,
    // multi-hued WATERCOLOUR trail (the #1 reference signature, 1:29-1:36 / 2:11-2:30), like the
    // original's roaming flower. Small amplitude so it stays the central object.
    var lisX = 0.5 + 0.12 * Math.sin(time * 0.045) + 0.05 * Math.sin(time * 0.017 + 1.0);
    var lisY = 0.5 + 0.09 * Math.cos(time * 0.038) + 0.05 * Math.sin(time * 0.021 + 2.0);
    anchorAmt *= Math.exp(-dt * 0.25); // release toward the free path over ~4-6s (B4b)
    t.q2 = lisX + (anchorX - lisX) * anchorAmt;
    t.q3 = lisY + (anchorY - lisY) * anchorAmt;
    // motif PULSE strengthened (19s clip: the net-dome visibly puffs AND flashes on hits) —
    // size rides the smoothed beat harder, and q4 below carries a brightness flash
    t.q5 = scaleFor(mCur) * (0.82 + 0.3 * (bassA - 1) + 0.28 * pulse) * bloomMul; // beat-puff tamed 0.45→0.28; bloomMul = the B4a entrance
    t.q6 = 0.05;
    t.q9 = time * 0.06; // slow self-spin
    t.q10 = 0.4 * Math.max(0, bassA - 1);
    t.q11 = focusAmt; // COMP pupil + anemone squash

    // ── SPIRO per-stamp re-roll (doc 08 A1; p0 burst_54: consecutive stamps alternate
    //    wreath<->star<->wheel, ~1-2s cadence ~= beat groups; h1: feathery ghosting = slight
    //    rotation between stamps). Debug gotcha: __ALC_FORCE overrides q30 AFTER frame() (below),
    //    so honour it here too or a pinned self-render never re-rolls variants. ──
    var mEff = mCur;
    if (typeof window !== "undefined" && window.__ALC_FORCE && window.__ALC_FORCE.q30 !== undefined)
      mEff = Math.floor(window.__ALC_FORCE.q30 + 0.5);
    if (mEff === 17) {
      if (spiroNext < 0) {
        spiroNext = time; // first entry: stamp immediately
        spiroSeed = Math.random() * 100; // petal identities for THIS dwell (stable across stamps)
      }
      if (time >= spiroNext && (f > 0.5 || time >= spiroNext + 2.5)) {
        var pv = spiroVar;
        while (spiroVar === pv) spiroVar = Math.floor(Math.random() * 3); // always a DIFFERENT one
        // debug pin (same gotcha as mEff above): a pinned self-render can hold ONE construction
        if (
          typeof window !== "undefined" &&
          window.__ALC_FORCE &&
          window.__ALC_FORCE.spiroVar !== undefined
        )
          spiroVar = window.__ALC_FORCE.spiroVar;
        spiroK =
          spiroVar === 1
            ? 26 + Math.floor(Math.random() * 15) // fur ball: many many short petals (p0 35)
            : 10 + Math.floor(Math.random() * 5); // dahlia/wreath/wheel 10-14
        // SLIGHT rotation between stamps (h1 "feathery ghosting"). Was 0.25-0.75 rad — a full
        // petal-spacing at k=12, so each ghost flower landed ACROSS the crisp one (user: "petals
        // overlap"). Tiny snaps keep every ghost hugging its petal → dense layered flower.
        spiroRot += 0.08 + Math.random() * 0.07; // 5-9°/stamp — visible slow crawl, still ≪ the 30° petal spacing
        // per-stamp RE-TINT (measured, h1 M5: crisp lines re-tint ~2s/hue while the trail keeps
        // the OLD hues): the hue WALKS forward each stamp instead of jittering around one point,
        // so a dwell layers several tints (user: ours held the same 2 colours the whole time)
        spiroHue += 0.09 + Math.random() * 0.1;
        // per-stamp oblate TILT (h1 M4 "tilts oblate to ~0.5"): face-on 60% · lying-down 40%. The
        // snap at the stamp boundary is correct (the ref changes pose per stamp; the ghost bridges).
        spiroTilt = Math.random() < 0.6 ? 1.0 : 0.5 + Math.random() * 0.2;
        spiroNext = time + 0.8 + Math.random() * 0.8; // ~0.8-1.6s cadence (1:03-1:06: crisp new stamps ~1/s)
        spiroStampT = time; // the ring flash keys off the stamp instant
      }
    } else {
      spiroNext = -1;
    }
    // ring lifecycle (user, 480p 51-56): the dahlia appears → a round waveform CONNECTS the petals
    // (the "wheel") → the ring melts away. Eased so it grows/fades instead of popping with the roll.
    // ring FLASH lifecycle (user, 480p 51-56): pops in fast with the wheel stamp, holds under a
    // second, then melts out — appear → connect the petals → disappear (not a steady circle).
    var ringTgt = mEff === 17 && spiroVar === 2 && time - spiroStampT < 0.9 ? 1 : 0;
    spiroRingAmt += (ringTgt - spiroRingAmt) * Math.min(1, dt * (ringTgt > spiroRingAmt ? 6 : 2.4));

    // ── ORBS + TETHER — wide diagonal pair joined by a jagged waveform line (the Dance signature, A_93/
    //    W_103). Staging: orb A near-persistent, orb B comes & goes; tether gated to both-present + beat. ──
    t.q25 = comeGo(0.3 + 0.6 * Math.sin(time * 0.06 + 0.3) + 0.38 * Math.sin(time * 0.027 + 2.2));
    t.q14 = comeGo(0.6 * Math.sin(time * 0.055 + 1.7) + 0.4 * Math.sin(time * 0.026 + 0.4));
    // DUMBBELL SUMMON (user: "even I did not see the tether in a long time" — the old gate needed
    // both orbs to HAPPEN to be up on a beat, and alpha scaled by their visibility ramp; the refs
    // spawn orb-pair + tether TOGETHER as one event, p1 96.05/112.75): a tether event forces its
    // endpoints fully visible for its life, so every spawn actually reads.
    t.q25 = Math.max(t.q25, tetherEnv);
    t.q14 = Math.max(t.q14, tetherEnv);
    // ── D15 STAGING (doc 07 step 3; answered README Q11): the refs stage the orbs as PARKED
    //    POSTS — pinned for whole dwells (h1 S4b: 3s+ at fixed posts, persistent BETWEEN tether
    //    events), an occasional slow SLIDE along the pair axis (p2 2.11: 5-10% frame per 2s),
    //    and single-endpoint re-casts (p1: one endpoint persists from the previous cast). The
    //    v7 continuous orbit + snake wobble was an invention that prevented the "anchor"
    //    reading — removed; the refs' comet smears come from TRAIL displacement, not orbits. ──
    if (FORCE && FORCE._stage !== undefined) stgForce = FORCE._stage; // "hold" | "slide"
    if (time >= stgNext) {
      var castB = Math.random() < 0.7; // prefer the come-and-go orb
      if ((castB ? t.q14 : t.q25) < 0.05) {
        // re-cast ONE endpoint while it's invisible (posts never teleport on-screen);
        // diagonal-dominant, separation 0.4-0.7 from the PERSISTING endpoint (refs 40-78%)
        var kpx = castB ? stgAx : stgBx,
          kpy = castB ? stgAy : stgBy;
        var npx = 1 - kpx,
          npy = 1 - kpy; // fallback: mirror across centre
        for (var ci = 0; ci < 8; ci++) {
          var cxr = 0.12 + Math.random() * 0.76,
            cyr = 0.12 + Math.random() * 0.76;
          var cdx = cxr - kpx,
            cdy = cyr - kpy,
            cd = Math.sqrt(cdx * cdx + cdy * cdy);
          if (cd > 0.4 && cd < 0.7) {
            npx = cxr;
            npy = cyr;
            break;
          }
        }
        if (castB) {
          stgBx = npx;
          stgBy = npy;
        } else {
          stgAx = npx;
          stgAy = npy;
        }
        stgNext = time + 6 + Math.random() * 8; // dwell 6-14s
        // ~40% of dwells open a SLIDE window: both posts drift along the axis for ~2s
        if (stgForce !== "hold" && Math.random() < 0.4) {
          stgSlideT0 = time + 1 + Math.random() * 2;
          var sdx = stgBx - stgAx,
            sdy = stgBy - stgAy,
            sl2 = Math.sqrt(sdx * sdx + sdy * sdy) || 1,
            sdir = Math.random() < 0.5 ? 1 : -1,
            svel = 0.025 + 0.025 * Math.random(); // 5-10% frame per 2s (p2)
          stgSlideVX = (sdir * sdx * svel) / sl2;
          stgSlideVY = (sdir * sdy * svel) / sl2;
        }
      } else stgNext = time + 1.5; // endpoint currently visible — retry shortly
    }
    if (stgForce === "slide" && time - stgSlideT0 > 4) stgSlideT0 = time; // pin: keep sliding
    if (time >= stgSlideT0 && time < stgSlideT0 + 2) {
      stgAx = Math.min(0.92, Math.max(0.08, stgAx + stgSlideVX * dt));
      stgAy = Math.min(0.92, Math.max(0.08, stgAy + stgSlideVY * dt));
      stgBx = Math.min(0.92, Math.max(0.08, stgBx + stgSlideVX * dt));
      stgBy = Math.min(0.92, Math.max(0.08, stgBy + stgSlideVY * dt));
    }
    // tiny live sway only — the posts breathe, they never snake (S-curves were the invention)
    t.q21 = stgAx + 0.006 * Math.sin(time * 1.3);
    t.q22 = stgAy + 0.006 * Math.sin(time * 1.1 + 1.0);
    t.q23 = stgBx + 0.006 * Math.sin(time * 1.35 + 2.1);
    t.q24 = stgBy + 0.006 * Math.sin(time * 1.15 + 0.4);
    // orb radius base (audio + a small residual breathing). The big pops are now the ballistic
    // BALLOON events (doc 07 D2a) — one-shot overshoot-and-settle per orb, not a pulse ride.
    if (f > 0.9 && time > balloonNext && Math.random() < 0.6) fireBalloon(time);
    if (FORCE && FORCE._balloon && time - balloonT0A > 3) fireBalloon(time); // debug pin (re-fires every 3s)
    // 0.048 = the MEASURED ref base radius (doc 07 D2b, answered README Q12; reverted before
    // only as part of the rejected motion rework, never judged on its own)
    t.q7 = (0.048 + 0.02 * Math.max(0, bassA - 1)) * (1 + 0.1 * pulse);
    radScaleA = ballEnv(time - balloonT0A, balloonMagA);
    radScaleB = ballEnv(time - balloonT0B, balloonMagB);
    t.q26 = 0.06 * (0.5 + 0.7 * bassA); // tether jag amplitude (audio-coupled)

    // ── REST/BUSY BREATHING — the original empties to 1-2 element classes for a few seconds
    //    every 8-12s (its sparse-black / minimal-disc rests), then refills. A rest only starts
    //    when the music is calm-ish and never during the corridor scene; during a rest the
    //    accessories fade out and orb B leaves (taking the tether, which needs both orbs). ──
    if (time >= breathNext) {
      if (!resting && energy < 1.15 && corridorAmt < 0.1 && Math.random() < 0.5) {
        resting = true;
        // B6a (doc 04 step 2, answered README Q4): ~40% of rests go DEEP — the central motif
        // stamp-stops and LEAVES (bg + orb anchor only; p1's near-empty frames, h0's 4.5s dark
        // rest). Never on the wash (bgMode 5) — the sketchbook rest owns that ground.
        restDeep = FEAT_DEEPREST && bgMode !== 5 && Math.random() < 0.4;
        breathNext = time + 3 + Math.random() * 4; // rest 3-7s
      } else {
        resting = false;
        restDeep = false;
        breathNext = time + 8 + Math.random() * 6; // busy 8-14s
      }
    }
    if (FORCE && FORCE.rest !== undefined) resting = !!FORCE.rest; // debug pin
    if (FORCE && FORCE._restDeep !== undefined) resting = restDeep = !!FORCE._restDeep;
    restAmt += ((resting ? 1 : 0) - restAmt) * Math.min(1, dt * 0.8);
    deepAmt += ((restDeep ? 1 : 0) - deepAmt) * Math.min(1, dt * 0.7);
    accVis = 1 - 0.88 * restAmt;
    t.q14 *= 1 - 0.92 * restAmt;
    t.q4 *= 1 - 0.92 * deepAmt; // deep rest: the motif fades out entirely

    // ── SKETCHBOOK REST (doc 03 A13; h1 S3 74.8-83): on a flat-wash rest the frame becomes a
    //    static page — ONE wireframe motif re-stamps every ~1-2s cycling BOTH construction AND
    //    hue, old stamps ghost-fade ~1s, centre static, NO music jag (clock-driven stamps).
    //    Existing constructions only (star-net / net / 12-star / tri-mandala). B2 events are
    //    already silent here (the rest gate). ──
    var sketch = restAmt > 0.7 && bgMode === 5;
    sketchAmt += ((sketch ? 1 : 0) - sketchAmt) * Math.min(1, dt * 2);
    if (sketch && time >= restStampNext) {
      restStampMode = REST_CYCLE[Math.floor(Math.random() * REST_CYCLE.length)];
      restStampHue += 0.2 + Math.random() * 0.4;
      restStampT0 = time;
      restStampNext = time + 1 + Math.random();
    }
    if (sketchAmt > 0.5) {
      mCur = restStampMode; // draw path only — the pickers keep their own clocks
      t.q30 = restStampMode;
      t.q2 += (0.5 - t.q2) * sketchAmt; // page centre, dead still (h1: camera static)
      t.q3 += (0.5 - t.q3) * sketchAmt;
      t.q6 *= 1 - 0.9 * sketchAmt; // clock-driven, not audio-jagged (h1: no music jag)
      t.q8 += restStampHue * sketchAmt;
      t.q4 = Math.max(t.q4, 0.7 * sketchAmt); // the page ignores the swap machinery's envelopes
      stampGain = time - restStampT0 < 0.3 ? 1 : 0; // crisp blink, then only the fading ghost
    }

    // ── PER-SCENE TRAIL-DISPLACEMENT FIELDS (doc 01 C2). The refs schedule the feedback warp
    //    per scene; v7 ran ONE program always. Each field is an eased scene-gated modulation of
    //    the EXISTING engine channels — emitters never move, only the trail buffer's motion
    //    character changes. Placed after the sketchbook block (final mCur, current restAmt) and
    //    before the tunnel-swirl/corridor/valley couplings, which run later and deliberately WIN.
    //    Priority: freeze > sag; corridor/valley override everything as today. ──
    // FREEZE (field 1): terrain stamps hold crisp — blur nearly off, longer decay, pan damped
    // (r0: peaks persist ≥3.5s, NO translation, "q-gated blur"; h2: stamps freeze where drawn).
    freezeAmt += ((mCur === 14 || mCur === 19 ? 1 : 0) - freezeAmt) * Math.min(1, dt * 0.6);
    if (freezeAmt > 0.01) {
      t.q28 += (0.08 - t.q28) * freezeAmt; // blur ~off → stamps stay crisp
      t.q1 += (0.98 - t.q1) * freezeAmt; // 0.974→0.98: generations died in ~2s, refs hold ≥3.5s (mountains clip); deposits are now burst-gated so pileup risk stays low
      t.q15 += (0.0 - t.q15) * freezeAmt; // no growth
      t.q18 *= 1 - 0.92 * freezeAmt; // near-still (r0: peaks do NOT translate)
      t.q19 *= 1 - 0.92 * freezeAmt;
      t.q16 *= 1 - 0.8 * freezeAmt; // no roll — frozen peaks must not smear rotationally
    }
    // B3 terrain SINK (doc 02 step 1): each STAMP steps the whole buffer DOWN one generation
    // (p1 S6: copies displace down 20-40px per stamp; r0: peaks do NOT translate BETWEEN stamps).
    // A per-stamp decaying impulse, NOT a constant scroll — frozen peaks stay put when quiet,
    // and the beat gate means rests STARVE the terrain (B6). Rides the freeze (low blur keeps
    // the stepped generations discrete — p3's venetian comb).
    if ((mCur === 14 || mCur === 19) && f > 0.7 && time - mtStampT > 0.6 && restAmt < 0.5) {
      mtStampT = time; // stamp event (step 2 reuses this for the emitter hue step + brightness)
      sinkImp = 1;
    }
    // A10 scallop row stepper: the emitter re-seats at a new height every ~3s (~10s to walk the
    // band, p0 S2); each re-seat is a stamp → lagging copies 8-15px below the fresh line.
    if (mCur === 19 && time - scRowT > 2.8) {
      scRowT = time;
      scRowOff += 0.09;
      if (scRowOff > 0.28) scRowOff = -0.18;
      sinkImp = 1;
    }
    sinkImp += (0 - sinkImp) * Math.min(1, dt * 4); // ~0.25s release
    // -q19 streams the buffer DOWN (measured sign map); integrated step ≈ 0.0042·60·0.25 ≈ 0.06 UV
    // ≈ the measured 20-40px generation gap. Applied after the freeze damping on purpose.
    t.q19 -= 0.0055 * sinkImp * freezeAmt; // 0.0042→0.0055: wider generation gap (user: bands too packed)
    // D11 mountains identity (doc 02 step 2): roll the rail tilt + pinch phase ON ENTRY to the
    // dwell; step the EMITTER hue per stamp — the pile keeps its old hue for free (hue-frozen
    // trails, A14) so two colour generations coexist (p1 S6: gold pile under a green crest).
    if (mCur === 14 && lastMotif !== 14) {
      mtTilt =
        Math.random() < 0.4 ? 0 : (Math.random() < 0.5 ? 1 : -1) * (0.6 + 0.18 * Math.random());
      mtPinchPhase = Math.random() * 6.2832;
      mtHueStep = 0;
    }
    lastMotif = mCur;
    if (mCur === 14 && mtStampT === time)
      mtHueStep += (0.06 + 0.09 * Math.random()) * (Math.random() < 0.5 ? -1 : 1);
    mtStampEnv = Math.max(0, 1 - (time - mtStampT) / 0.32); // burst window (r0: ~1s bursts; 0.18 was too thin a deposit)
    // DOWN-SAG (field 2): bars/bands scenes stream the trail gently DOWNWARD (h2: 2-3%/s;
    // p1 rope cascade/stems; p0 S2 sag), replacing the random snap-dir while active.
    // Sign map (measured): -q19 streams DOWN. Freeze wins; rests stay still.
    sagAmt += ((bgMode === 4 || bgMode === 6 ? 1 : 0) - sagAmt) * Math.min(1, dt * 0.6);
    sagAmt *= 1 - freezeAmt;
    if (sagAmt > 0.01) {
      var sagRest = 1 - 0.9 * restAmt;
      t.q18 += (0.0004 * Math.sin(time * 0.13) * sagRest - t.q18) * sagAmt; // trace of lateral waviness (p2 field d)
      t.q19 += (-0.0022 * sagRest - t.q19) * sagAmt; // ≈0.13 UV/s downward
    }
    // RADIAL-OUT (field 3): urchin/fluff scenes stream the trail outward from the motif hub
    // (p1 moth fans t=83-89; h1 M6 2-4%/s; h0 M11 filaments radiate to the edges).
    // CAP q15 ≤0.008 — a big magnify is the rejected "spiky-burst over-fill" (see the q15 note).
    radialAmt += ((mCur === 2 || mCur === 16 ? 1 : 0) - radialAmt) * Math.min(1, dt * 0.5);
    if (radialAmt > 0.01) {
      t.q15 += (0.006 - t.q15) * radialAmt; // outward growth ≈2-4%/s — NEVER above 0.008
      t.q20 += (t.q2 - t.q20) * 0.7 * radialAmt; // hub = the motif centre (streaming is motif-centred)
      t.q27 += (t.q3 - t.q27) * 0.7 * radialAmt;
      t.q18 *= 1 - 0.8 * radialAmt; // damp the pan — outward flow IS the motion
      t.q19 *= 1 - 0.8 * radialAmt;
    }
    // SWIRL-EYE (field 4): vortex scenes rotate the trail about an off-centre eye — the dark
    // "eye" is just the un-fed centre of rotation (p3 §3.1 at (33%,8%); p0 rotation-smear).
    // Keep q17 ≤ ~0.09 — above that the 1/r falloff whips the centre.
    eyeAmt += ((mCur === 8 ? 1 : 0) - eyeAmt) * Math.min(1, dt * 0.5);
    if (eyeAmt > 0.02 && !eyeOn) {
      eyeOn = true; // re-roll the eye per activation, off-centre like the refs
      eyeX = 0.25 + 0.5 * Math.random();
      eyeY = 0.15 + 0.3 * Math.random();
    } else if (eyeAmt <= 0.02) {
      eyeOn = false;
    }
    if (eyeAmt > 0.01) {
      t.q17 += (0.07 - t.q17) * eyeAmt; // strong local swirl (the tunnel bg uses 0.04)
      t.q20 += (eyeX - t.q20) * 0.7 * eyeAmt; // pivot → the eye
      t.q27 += (eyeY - t.q27) * 0.7 * eyeAmt;
      t.q18 *= 1 - 0.85 * eyeAmt;
      t.q19 *= 1 - 0.85 * eyeAmt;
    }
    // C10 DEPOSIT-HOLDING WASH (doc 05 step 5, answered README Q7): on the flat wash the bg IS
    // the scene's accumulated history (p1 B7) — stains must live 3-6s (p0: 5-10s), so decay up,
    // blur down, pan damped. Wash-gated ONLY; freeze wins (terrain crispness beats stains);
    // corridor/valley couplings run later and override as shipped. The sketchbook rest look was
    // live-tuned with ~1s ghost-fade — damp the hold there so pages keep their blink-and-ghost.
    // White-guard: trail composite gain unchanged; decay capped 0.988; blur floor 0.18.
    washAmt += ((bgMode === 5 ? 1 : 0) - washAmt) * Math.min(1, dt * 0.5);
    washAmt *= 1 - freezeAmt;
    if (washAmt > 0.01) {
      // FULL hold only for compact deposit-y motifs (the refs' wash stains are small pigment
      // patches — orb puffs, pompoms). A FULL-FRAME every-frame line motif (net/star/beams/
      // vortex/tangle/valley) piles dozens of held copies into a white web (acceptance shot) —
      // those get a much weaker hold (~1.4s trails) instead of the 3-6s stain life.
      var sprawl =
        mCur === 1 ||
        mCur === 3 ||
        mCur === 7 ||
        mCur === 8 ||
        mCur === 10 ||
        mCur === 12 ||
        mCur === 13;
      var wh = washAmt * (1 - 0.55 * sketchAmt) * (sprawl ? 0.35 : 1);
      t.q1 += (0.988 - t.q1) * wh; // 10% at ~3.2s (was 0.957: stains dead in ~0.9s)
      t.q28 += (0.18 - t.q28) * wh; // stains blur SLOWLY, stay legible — not the instant bleed
      t.q18 *= 1 - 0.7 * wh; // stains hold in place (p0: washes "near-static")
      t.q19 *= 1 - 0.7 * wh;
      // white-guard fallback (doc 05 §3 step 5): every-frame line motifs (net/star) pile toward
      // white at this decay — dim the LIVE emitter, never the comp (acceptance shot: dense web)
      t.q4 *= 1 - 0.2 * wh;
    }
    // C8 RADIAL RIPPLE finale: a RARE ~1s hub-centred buffer ripple on a hard beat (r0 18.6-19.6 —
    // observed ONCE in 19s, so cooldown ≥75s + probability ≈ once per few minutes). Never under
    // kaleido (q13 belongs to the fold there; also never observed there). Runs AFTER the fold
    // block, so the q13 write overrides its 0 only outside kaleido.
    if (rippleT0 === -99) rippleT0 = time; // first fire only after a full cooldown (climax, not opener)
    if (FORCE && FORCE.ripple) {
      rippleT0 = time + 1.5; // debug pin: fire 1.5s from now (deterministic self-render shots)
      FORCE.ripple = 0;
    }
    if (f > 0.95 && bgMode !== 1 && time - rippleT0 > 75 && Math.random() < 0.25) rippleT0 = time;
    var ripL = (time - rippleT0) / 1.1;
    if (ripL >= 0 && ripL < 1 && bgMode !== 1) {
      t.q13 = 0.9 * Math.sin(ripL * 3.14159); // attack+release inside ~1.1s
      t.q20 += (t.q2 - t.q20) * 0.8; // hub = the motif centre (r0: hub-centred)
      t.q27 += (t.q3 - t.q27) * 0.8;
    }

    // ── ACCESSORY DIRECTOR — the 3rd/4th element classes, each on its own clock, drawn in
    //    absolute screen space (independent of the motif — the original parents nothing). ──
    if (time >= accLineNext) {
      var rl = Math.random();
      // none / ray-curtain / waveform bundle / rotating PINWHEEL (the 480p 0:39-0:45 windmill
      // fan — long lines through an off-centre hub, rotating steadily for the whole dwell)
      // pinwheel (4) made RARER (user): ~0.26→~0.15, freed weight → "none" (calmer, motif-only)
      // HARP SWATH (5, doc 02 A3) carved ~.16 from curtain/bundle/pinwheel; "none" keeps .40:
      accLine = rl < 0.4 ? 0 : rl < 0.5 ? 1 : rl < 0.66 ? 5 : rl < 0.87 ? 2 : 4;
      if (accLine === 5 && corridorAmt > 0.1) accLine = 1; // corridor forces its own pan — no swath there
      accLineNext = time + 5 + Math.random() * 6;
      accLineArm = accLine === 1; // a curtain waits for a beat, then sweeps for ~1.6s
      accLineAng = Math.random() * 3.14159;
      accLineX = 0.3 + Math.random() * 0.4;
      accLineY = 0.3 + Math.random() * 0.4;
      accLineDrift = (Math.random() < 0.5 ? -1 : 1) * (0.008 + 0.02 * Math.random());
      accLinePickT = time;
    }
    if (accLineArm && f > 0.6) {
      accLineArm = false;
      accLineT0 = time; // the beat fires the sweep (survey: curtains land ON hits, ~1.5s life)
    }
    var clife = (time - accLineT0) / 1.6;
    accLineEnv = accLine === 1 ? (clife >= 0 && clife < 1 ? Math.sin(clife * 3.14159) : 0) : 1;
    if (FORCE && FORCE.swath && accLine !== 5) {
      accLine = 5; // debug pin: force a swath dwell (self-render acceptance)
      accLinePickT = time;
      accLineNext = time + 9;
    }
    if (accLine === 4) {
      // steady windmill rotation (~0.28 rad/s), direction from the drift sign
      accLineRot = accLineAng + (time - accLinePickT) * 0.28 * (accLineDrift < 0 ? -1 : 1);
    } else if (accLine === 5) {
      // A3 harp swath: the free end sweeps ~15°/s with a slow wander (r0: pivot 15-20°/s)
      accLineRot =
        accLineAng +
        (time - accLinePickT) * 0.26 * (accLineDrift < 0 ? -1 : 1) +
        0.15 * Math.sin(time * 0.5);
    } else {
      accLineRot = accLineAng + Math.max(0, Math.min(1, clife)) * 0.8; // the curtain pivots as it lives
    }
    // A3 stamp TICKS: a discrete frozen copy per tick, alternating the two colour families
    // (p0: gold+indigo interleaved). 0.18→0.28s (user screenshots: copies packed into a braided
    // rope) — pitch ≈ 0.26 rad/s × 0.28s ≈ 4.2° ≈ the measured 10-20px strand spacing.
    if (accLine === 5 && time - accSwathTick > 0.28) {
      accSwathTick = time;
      accSwathFam = 1 - accSwathFam;
    }
    accSwathEnv = Math.max(0, 1 - (time - accSwathTick) / 0.07); // ~1-frame bright deposit
    // mini-FREEZE while a swath lives — the copies must freeze, not diffuse (wavetest_21).
    // Accessory-scoped field change; strands live 4-6s, a spent fan lingers ~8s (p0).
    swathAmt += ((accLine === 5 ? 1 : 0) - swathAmt) * Math.min(1, dt * 1.2);
    if (swathAmt > 0.01) {
      t.q28 *= 1 - 0.85 * swathAmt; // blur ~off → discrete strands (0.7 left copies merging)
      // FULL-strength ease to 0.98 (the earlier ×0.5 blend landed the effective decay at ~0.968
      // → copies still died in ~1.4s and the fan stayed a braided rope — user's 2nd swath clip;
      // ref strands live 4-6s so the 15°/s sweep can spread ~11 copies into a ~45° wedge)
      t.q1 += (0.98 - t.q1) * swathAmt;
      t.q18 *= 1 - 0.6 * swathAmt; // damp the pan so the fan doesn't shear away
      t.q19 *= 1 - 0.6 * swathAmt;
    }
    accLineY += accLineDrift * dt; // the bundle drifts on its own axis
    if (accLineY < 0.15 || accLineY > 0.85) accLineDrift = -accLineDrift;
    // bead-row/caterpillar/snake accessory REMOVED (see waves[3] note) — accDots stays 0
    accDots = 0;
    accDotsPhase += dt * 0.045 * accDotsDir; // beads travel along their rail
    // two competing busy layers read as clutter (user, 6.33.07 screenshot: tangle + bundle) —
    // the original never stacks two sprawling organics; fade the bundle under net/vortex/tangle
    accBundleVis +=
      ((mCur === 7 || mCur === 8 || mCur === 13 ? 0 : 1) - accBundleVis) * Math.min(1, dt * 1.5);
    // TERRAIN scenes are motif-dominant (user screenshot 2026-07-09: a pinwheel under the FREEZE
    // field froze its rays into a permanent blue star over the mountains — the ref terrain scenes
    // have no crossing accessory lines). Fade ALL accessory lines under mountains/scallop.
    accTerrVis += ((mCur === 14 || mCur === 19 ? 0 : 1) - accTerrVis) * Math.min(1, dt * 1.5);
    accVis *= accTerrVis;

    // VORTEX-ish swirl on the radial-tunnel ground for a little inward churn
    if (bgMode === 2) t.q17 = 0.04 + 0.02 * (bassA - 1);

    // ── CORRIDOR SCENE (the iconic 0:06-0:16 marching-orbiter corridor, side-view + rightward drift).
    //    When bgMode 3 is active: the central flower fades, the two orbs become the NEAR-LEFT + FAR-RIGHT
    //    anchors of a receding row, the tether draws the jagged WAVEFORM thread ALONG the corridor, and
    //    the camera pans RIGHT so the whole row + its trail-echoes march toward a right vanishing point.
    //    waves[3] adds the receding ring-dot row between the anchors. (The "wave scene" the user asked.) ──
    corridorAmt += ((bgMode === 3 ? 1 : 0) - corridorAmt) * Math.min(1, dt * 0.5);
    if (corridorAmt > 0.01) {
      var co = corridorAmt;
      // fade the central motif during the corridor — EXCEPT the wireframe NET (mode 7): keeping the net
      // visible over the void with the orbs + beaded row IS the opening-signature look (0:06-0:12).
      if (mCur !== 7) t.q4 *= 1 - 0.94 * co;
      t.q18 += (0.0065 - t.q18) * co; // strong RIGHTWARD pan (camera/motifs move right)
      t.q19 += (0.0 - t.q19) * co; // kill the vertical drift
      t.q15 += (0.0 - t.q15) * co; // kill the magnify (a clean recede, not a watercolour bloom)
      t.q25 = Math.max(t.q25, co); // both orbs present (the corridor anchors)
      t.q14 = Math.max(t.q14, co);
      t.q7 *= 1 + 0.4 * co; // a touch bigger anchor orbs
      // near-LEFT anchor (foreground) ← orb A; far-RIGHT-ish anchor (recedes) ← orb B
      t.q21 += (0.16 - t.q21) * co;
      t.q22 += (0.52 - t.q22) * co;
      t.q23 += (0.7 - t.q23) * co;
      t.q24 += (0.49 - t.q24) * co;
      t.q26 += (0.05 - t.q26) * co; // steady tether-waveform jag along the corridor
    }

    // ── VALLEY (motif 12): DOLLY REMOVED (README answer 21 + user's 84s clip 2026-07-09: the
    //    magnify grew every sheet deposit outward, filling the wedges to a blown-white bow-tie;
    //    the refs' terrain scenes are camera-still — the geometry reads as a valley without a
    //    camera move). Keep the decay bump (depth trail) + roll-off. ──
    if (valleyAmt > 0.01) {
      var va = valleyAmt;
      t.q1 += (0.96 - t.q1) * 0.5 * va; // a touch more decay → the receding sheet-lines leave a depth trail
      t.q16 *= 1 - va; // no roll (a clean dive down the valley)
    }

    // ── ORB ANATOMY re-rolls (doc 07 A16a): identity rotates PER APPEARANCE — orb B on every
    //    re-entry (rising edge), orb A right after a balloon settles, rate-limited 10-20s.
    //    The corridor forces both classic (its anchors are the classic ringed look). ──
    if (t.q14 > 0.05 && prevQ14v <= 0.05) ANAT[1] = mkAnat();
    prevQ14v = t.q14;
    if (anatNextA < 0) anatNextA = time + 10 + Math.random() * 10;
    var settleAge = time - balloonT0A;
    if (time >= anatNextA && settleAge > 1.2) {
      ANAT[0] = mkAnat();
      anatNextA = time + 10 + Math.random() * 10;
    }
    if (corridorAmt > 0.5) {
      if (ANAT[0].kind !== 0) ANAT[0] = mkAnat(0);
      if (ANAT[1].kind !== 0) ANAT[1] = mkAnat(0);
    }
    // D2c milk-fill arm (step 6): a balloon firing on a HOLLOW orb starts its milk clock at
    // the envelope peak (attack 0.12s)
    if (ANAT[0].kind === 1 && balloonT0A > milkT0A + 3) milkT0A = balloonT0A + 0.12;
    if (ANAT[1].kind === 1 && balloonT0B > milkT0B + 3) milkT0B = balloonT0B + 0.12;
    if (FORCE) {
      // closure pins (underscore channel): anatomy + milk-fill are self-render-pinnable
      if (FORCE._anatA !== undefined && ANAT[0].kind !== FORCE._anatA)
        ANAT[0] = mkAnat(FORCE._anatA);
      if (FORCE._anatB !== undefined && ANAT[1].kind !== FORCE._anatB)
        ANAT[1] = mkAnat(FORCE._anatB);
    }

    // ── ORB RING-ACCESSORY director (doc 07 A16b+A4): roll the waves[3] descriptor on its own
    //    6-14s clock, fading 0.4s out → swap → 0.4s in (no pops). A FORCE._acc3 pin swaps on
    //    the same eased path. ──
    if (acc3Next < 0) acc3Next = time + 4 + Math.random() * 6;
    var acc3Pin = FORCE && FORCE._acc3 !== undefined ? FORCE._acc3 : undefined;
    if (
      !acc3Fading &&
      mushAmt < 0.1 && // never swap the column out mid-mushroom
      (time >= acc3Next ||
        (acc3Pin !== undefined &&
          acc3.type !== (acc3Pin.type !== undefined ? acc3Pin.type : acc3Pin)))
    )
      acc3Fading = true;
    if (acc3Fading) {
      acc3Env -= dt / 0.4;
      if (acc3Env <= 0) {
        acc3Env = 0;
        acc3 = rollAcc3(acc3Pin);
        acc3.t0 = time;
        acc3Fading = false;
        acc3Next = time + 6 + Math.random() * 8;
        // ── A18 MUSHROOM eligibility (doc 07 step 8): a fresh COLUMN on a calm fluid/wash
        //    ground rarely opens the scripted rise event (h2 2.14-2.15), ≥90s apart.
        //    NOTE: with the column pulled from the bag (empty-rings round) type 2 never rolls
        //    naturally, so the event is PIN-ONLY (_mushroom) until the column is redesigned. ──
        if (
          acc3.type === 2 &&
          (bgMode === 0 || bgMode === 5) &&
          energy < 1.15 &&
          railAmt < 0.01 &&
          time - mushLast > 90 &&
          Math.random() < 0.15
        ) {
          mushT0 = time;
          mushLast = time;
          // SPAWN IN PLACE (user: "an orb with a line moved in rapidly" — the capture lerp was
          // dragging visible orbs+tube across the screen; events pop at their posts, C1)
          stgAx = 0.4;
          stgAy = 0.45;
          stgBx = 0.6;
          stgBy = 0.47;
          stgNext = Math.max(stgNext, time + 6); // no re-cast mid-event
        }
      }
    } else if (acc3.type > 0) acc3Env = Math.min(1, acc3Env + dt / 0.4);
    if (FORCE && FORCE._mushroom && time - mushT0 > 6) {
      // debug pin: force the event (and the column it rides on) now
      mushT0 = time;
      mushLast = time;
      stgAx = 0.4;
      stgAy = 0.45;
      stgBx = 0.6;
      stgBy = 0.47;
      stgNext = Math.max(stgNext, time + 6);
      if (acc3.type !== 2) {
        acc3 = rollAcc3(2);
        acc3.t0 = time;
        acc3Fading = false;
      }
    }
    // ── A18 MUSHROOM RISE (h2 2.14-2.15, full_170.7/173.5): for ~4s both posts go symmetric
    //    about centre-x ~20% apart and RISE ~2s; each anchor carries a short coiled ring-TUBE
    //    (the cap — seg-parity split in the column branch) whose rise history stacks the fuzzy
    //    disc BODY below it (pure trail, zero extra slots). Caps colour-snap every ~0.6s. ──
    mushAmt += ((time - mushT0 < 4 ? 1 : 0) - mushAmt) * Math.min(1, dt * 2);
    if (mushAmt > 0.01) {
      var mu = mushAmt * (1 - cocAmt) * (1 - scalAmt) * (1 - corridorAmt) * (1 - railAmt);
      var mAge = time - mushT0;
      var yR = 0.45 + 0.18 * Math.min(1, Math.max(0, mAge) / 2); // caps rise over ~2s
      t.q21 += (0.4 - t.q21) * mu;
      t.q22 += (yR - t.q22) * mu;
      t.q23 += (0.6 - t.q23) * mu;
      t.q24 += (yR + 0.02 - t.q24) * mu; // slight stagger — the pair leans, not a mirror-clone
      t.q25 = Math.max(t.q25, 0.9 * mu);
      t.q14 = Math.max(t.q14, 0.9 * mu);
      if (time - mushSnapT > 0.6) {
        mushSnapT = time; // h2: caps snap cream→cyan→magenta→… every ~0.5-0.75s
        accentHue += (Math.random() < 0.5 ? -1 : 1) * 0.12;
      }
    }

    // ── B10 transition APPLY (doc 04 step 6; rolled at the snap detector above). Placed at the
    //    tail so it modulates the final q1/q4/q31; starvation (below) still wins. ──
    if (FORCE && FORCE._transType !== undefined && time - transT0 > 3) {
      transType = +FORCE._transType; // pin: re-fires every 3s
      transT0 = time;
      transDur = transType === 3 ? 1.4 : transType === 2 ? 0.6 : 0.7;
    }
    var tprog = FEAT_TRANS && transT0 > 0 ? (time - transT0) / transDur : 2;
    if (tprog < 1) {
      var tenv = Math.sin(Math.max(0, tprog) * 3.14159);
      if (transType === 0) t.q1 = Math.min(0.995, t.q1 + 0.012 * tenv); // wash-dissolve lingers
      if (transType === 2) {
        // quad-fold spike (p1 90.05): the comp's kaleido mirror-fold switched ON over the live
        // buffer ~0.6s + a brief exposure lift — the sanctioned vivid moment (D13). bgMode was
        // computed from the REAL q29 earlier, so only the comp folds; the engine stays put.
        t.q29 = 1;
        t.q31 *= 1 + 0.25 * tenv;
      }
      if (transType === 3) {
        // rare HARD WIPE (p0 23.5, ~5% of snaps): clear the field in ~0.15s, hold a ~1s dark
        // rest, snap the new scene in. Orbs + tether are NOT touched — they bridge the cut.
        // q28 MUST drop with q1: the warp's blur re-injection otherwise re-seeds the buffer
        // from the previous frame's soft copy and the clear never lands (probe-verified).
        if (tprog < 0.1) {
          t.q1 = 0.2; // strong per-frame kill — the clear must land even at low fps (the
          t.q28 = 0; // 0.14s window is only ~1 frame on a slow renderer; 0.2^2 ≈ black)
        } else if (tprog < 0.75) {
          t.q4 *= 0.05;
          accVis *= 0.05;
        }
      }
    }

    // ── B6b STARVATION DRAIN (doc 04 step 3; p3 S6 "outro drain", answered README Q4): the
    //    refs' empty frames are EMERGENT, not authored — quiet audio → no stamps → the feedback
    //    has nothing to eat and converges to its mean. Sustained deep-quiet (>1.5s) collapses
    //    the trails and starves the emitters; only the orb-A anchor survives. Recovers with the
    //    audio. Placed after every other q1/q4 writer so the drain wins. ──
    starveT = energy < 1.02 ? starveT + dt : 0;
    var starveTgt = FEAT_STARVE ? Math.min(1, Math.max(0, (starveT - 1.5) / 3)) : 0;
    if (FORCE && FORCE._starve !== undefined) starveTgt = +FORCE._starve;
    starveAmt += (starveTgt - starveAmt) * Math.min(1, dt * 0.5);
    if (starveAmt > 0.001) {
      t.q1 -= 0.1 * starveAmt; // decay drop — the field flattens toward its average colour
      t.q4 *= 1 - 0.95 * starveAmt; // motif stamps starve
      accVis *= 1 - 0.9 * starveAmt;
      t.q14 *= 1 - 0.95 * starveAmt; // orb B leaves; orb A stays the pinprick anchor
    }

    // B4b: remember this frame's FINAL centre + orb anchors (corridor/valley overrides included)
    lastQ2 = t.q2;
    lastQ3 = t.q3;
    lastOrbAX = t.q21;
    lastOrbAY = t.q22;
    lastOrbBX = t.q23;
    lastOrbBY = t.q24;

    // __DEBUG__ self-render hook (PRODUCTION NO-OP — window.__ALC_FORCE is never set live).
    // Underscore-prefixed keys are CLOSURE pins (doc 07 step 0) handled inside frame(), not q-vars.
    if (typeof window !== "undefined" && window.__ALC_FORCE) {
      var F = window.__ALC_FORCE;
      for (var fk in F) if (fk.charAt(0) !== "_") t[fk] = F[fk];
      // live state probe for pinned self-renders (read back over CDP): sampled q-vars + clocks
      F.__dbg = { t: time, q1: t.q1, q4: t.q4, ty: transType, tage: time - transT0 };
    }

    // ── COCOON EYES (doc 09 A2): both orb anchors live INSIDE the cage, ~0.07 UV each side of
    //    centre. Placed AFTER the __ALC_FORCE hook so it keys off the EFFECTIVE t.q30 — a q30 pin
    //    exercises the eyes too (couplings keyed off mCur earlier stay dead under a pin). ──
    var cocEff = Math.floor((t.q30 || 0) + 0.5);
    cocAmt += ((cocEff === COCOON_ID ? 1 : 0) - cocAmt) * Math.min(1, dt * 0.6);
    // ── STAMP cadence (A2): audio-gated FULL topology re-roll + crisp-over-ghost envelope.
    //    r0: crisp stamp every ~0.2-0.3s busy; p1: topology stable ~1s calm. ──
    if (cocEff === COCOON_ID) {
      var dueMin = time - cocStampT > 0.25; // r0: 0.2-0.3s busy cadence
      if ((f > 0.6 && dueMin) || time - cocStampT > 1.2) {
        // p1: topology ~1s calm
        cocStampT = time;
        cocSeed = Math.random() * 1000; // full re-randomize (r0)
        cocAng = (Math.random() - 0.5) * 0.8;
        cocSizeMul = 0.8 + Math.random() * 0.45; // dia range 25-38%
        // per-stamp FLAVOUR (r0 measures alternating flavours): dreamcatcher 45% · crumple 30% · sphere 25%
        var rf = Math.random();
        cocFlavour = rf < 0.45 ? 0 : rf < 0.75 ? 1 : 2;
        cocElong = 1.2 + Math.random() * 0.15; // crumple elongation tamed 1.3-1.6→1.2-1.35 (was too lopsided)
        if (Math.random() < 0.4)
          cocHue += (Math.random() < 0.5 ? -1 : 1) * (0.08 + Math.random() * 0.14); // hue step ~1.5-2s
      }
      cocEnv = Math.exp(-(time - cocStampT) * 2.2); // fresh crisp → thins to a few live arms
    }
    if (cocAmt > 0.01) {
      var ca = cocAmt * (1 - corridorAmt); // never fight the corridor override
      var eAng = 0.2 + cocAng * 0.3; // near-horizontal "eyes", per-stamp jitter
      var ex = 0.07 * Math.cos(eAng),
        ey = 0.07 * Math.sin(eAng);
      t.q21 += (t.q2 + ex - t.q21) * ca;
      t.q22 += (t.q3 + ey - t.q22) * ca;
      t.q23 += (t.q2 - ex - t.q23) * ca;
      t.q24 += (t.q3 - ey - t.q24) * ca;
      t.q25 = Math.max(t.q25, 0.9 * ca); // both eyes present for the ball's life
      t.q14 = Math.max(t.q14, 0.9 * ca);
    }
    // ── SCALLOP coupling (A10 v2; post-FORCE like the eyes, so a motif pin exercises it):
    //    park the orbs at the chord terminals (p0: ringed-orb line ends) and engage the warp's
    //    q12<0 per-column y-flow — the chord's sinking trail bends into the scallop arches. ──
    var scalEff = Math.floor((t.q30 || 0) + 0.5) === 19 ? 1 : 0;
    if (scalEff && scalAmt < 0.02) {
      // SPAWN IN PLACE at entry (user: the chord + orbs were gliding to the terminals —
      // read as a rapid camera move): snap the STAGING posts to the terminals while the
      // motif is still faded; the crossfade covers the pop
      stgAx = 0.2;
      stgAy = 0.4;
      stgBx = 0.85;
      stgBy = 0.62;
      stgNext = Math.max(stgNext, time + 4);
    }
    scalAmt += (scalEff - scalAmt) * Math.min(1, dt * 0.6);
    if (scalAmt > 0.01) {
      var sa = scalAmt * (1 - corridorAmt);
      t.q12 = Math.min(t.q12, -0.75 * sa); // negative = the scallop y-flow (C4 shear stays >0)
      t.q21 += (0.2 - t.q21) * 0.8 * sa; // low-left terminal
      t.q22 += (0.4 - t.q22) * 0.8 * sa;
      t.q23 += (0.85 - t.q23) * 0.8 * sa; // upper-right terminal (LL→UR diagonal, p0)
      t.q24 += (0.62 - t.q24) * 0.8 * sa;
      t.q25 = Math.max(t.q25, 0.9 * sa); // both terminal orbs present
      t.q14 = Math.max(t.q14, 0.9 * sa);
    }
    // ── RAIL POSTS (doc 06 step 5; answered README Q11): while a rail lives the orbs park on
    //    its endpoints — the staging posts blend back in when the rail dies. ──
    if (railAmt > 0.01) {
      t.q21 += (railAx - t.q21) * railAmt;
      t.q22 += (railAy - t.q22) * railAmt;
      t.q23 += (railBx - t.q23) * railAmt;
      t.q24 += (railBy - t.q24) * railAmt;
      t.q25 = Math.max(t.q25, 0.9 * railAmt);
      t.q14 = Math.max(t.q14, 0.9 * railAmt);
    }
    return t;
  }

  // ── build: WAVE0 central motif · WAVE1 star-net companion lattice (gated) · WAVE2 tether ·
  //    SHAPE0/1 filled orbs · SHAPE2/3 additive glow halos. ──
  function buildV7(comp) {
    var preset = build(BASE, { frame: frame, warp: WARP_V7, comp: comp });
    preset.waves[0] = {
      baseVals: Object.assign({}, WAVE_BASE, {
        enabled: 1,
        samples: 512,
        additive: 1,
        usedots: 0,
        scaling: 1,
        smoothing: 0.08, // 0.25 lowpassed the live jag into rounded wobble; 0.15 still ate the finest per-point teeth (user: jag too coarse)
        thick: 1,
        a: 0.62,
      }),
      init_eqs: passthrough,
      frame_eqs: passthrough,
      point_eqs: function (a) {
        return centralDraw(a);
      },
    };
    // WAVE1 = star-net companion (a 2nd star rotated a half-step + shorter) — denser 12-point mandala;
    // gated to motif mode 1 so it never bleeds through other motifs.
    preset.waves[1] = {
      baseVals: Object.assign({}, WAVE_BASE, {
        enabled: 1,
        samples: 512,
        additive: 1,
        usedots: 0,
        scaling: 1,
        smoothing: 0.25,
        thick: 1,
        a: 0.5,
      }),
      init_eqs: passthrough,
      frame_eqs: passthrough,
      point_eqs: function (a) {
        // D12 per-class hue override (doc 05 step 1; local to this wave's point object): the
        // star-net companion follows the MOTIF clock, the free accessories their own walk.
        // The one-shot star stamp keeps the global base (it re-rolls evStarHue per event).
        if (Math.abs((a.q30 || 0) - 1) < 0.5) {
          if (sketchAmt < 0.5) a.q8 = motifHue;
        } else if (!evStarOn) a.q8 = accHue;
        // ONE-SHOT STAR STAMP event (doc 03 A12) — top priority for its ≤0.22s life; pre-empts
        // the accessory briefly. 3 nested spiky outlines with chromatic hue offsets; small live
        // radius jitter (h2: outline re-jitters per frame). Suppressed while the star-net motif
        // is up (the branch below would double-expose). After the stamp stops, only the feedback
        // ghost remains (~1-2s at this decay; p3's ≥7s ghost needs the C2 freeze fields).
        if (evStarOn && Math.abs((a.q30 || 0) - 1) >= 0.5) {
          var sc3 = (a.sample || 0) * 3,
            sCopy = Math.floor(sc3),
            su3 = sc3 - sCopy;
          var sth = su3 * 6.2832 + sCopy * 0.06;
          var spike = Math.pow(Math.abs(Math.sin(sth * evStarPts * 0.5)), 1.5);
          var sr = evStarR * (0.42 + 0.58 * spike) * (1 + 0.035 * sCopy) + (a.value1 || 0) * 0.015;
          var sax = evStarAnchor
            ? a.q21 !== undefined
              ? a.q21
              : 0.5
            : a.q2 !== undefined
              ? a.q2
              : 0.5;
          var say = evStarAnchor
            ? a.q22 !== undefined
              ? a.q22
              : 0.5
            : a.q3 !== undefined
              ? a.q3
              : 0.5;
          a.x = sax + sr * Math.cos(sth);
          a.y = say + sr * Math.sin(sth);
          var sh = (a.q8 || 0) + evStarHue + sCopy * 0.12; // chromatic pink/green/blue edges
          a.r = orbCol(sh, 0);
          a.g = orbCol(sh, 0.33);
          a.b = orbCol(sh, 0.67);
          a.a = su3 < 0.015 || su3 > 0.985 ? 0 : 0.6; // hide copy-to-copy connectors
          return a;
        }
        if (Math.abs((a.q30 || 0) - 1) < 0.5) {
          // star-net companion (unchanged) — keeps priority when the star motif is up
          var N = 6,
            fk = (a.sample || 0) * N,
            seg = Math.floor(fk),
            u = fk - seg,
            s = u * 2 - 1;
          var th = seg * (3.14159 / N) + 3.14159 / (N * 2) + (a.q9 || 0) * 0.5;
          var len = (a.q5 || 0.4) * 0.85,
            jag = (a.value1 || 0) * (a.q6 || 0.05) * 1.0;
          var cx = a.q2 !== undefined ? a.q2 : 0.5,
            cy = a.q3 !== undefined ? a.q3 : 0.5;
          a.x = cx + s * len * Math.cos(th) - jag * Math.sin(th);
          a.y = cy + s * len * Math.sin(th) + jag * Math.cos(th);
          var h = (a.q8 || 0) + 0.18;
          a.r = orbCol(h, 0);
          a.g = orbCol(h, 0.33);
          a.b = orbCol(h, 0.67);
          a.a = u < 0.02 ? 0 : 0.5;
          mutRGB(a); // D13: companion lattice is not the accent
          return a;
        }
        // ACCESSORY LINES (mode from the closure director)
        if (accLine === 5) {
          // HARP SWATH (doc 02 A3): ONE strand, apex PINNED on orb A, free end sweeping —
          // the fan is entirely frozen trail copies (bright only at ticks); only the newest
          // edge strand is live. Two interleaved hue families (p0: gold+indigo class).
          var uS = a.sample || 0;
          var apx = a.q21 !== undefined ? a.q21 : 0.4,
            apy = a.q22 !== undefined ? a.q22 : 0.5;
          var LS = 0.42 + 0.1 * Math.sin(accLinePickT * 3.7); // strand length, rolled per pick
          // ~50px clocked waviness (aligned phases — clocked, not audio) + a whisper of live jag
          var wavS = 0.006 * Math.sin(uS * 31.0 + accLinePickT * 5.0) + (a.value1 || 0) * 0.004;
          a.x = apx + Math.cos(accLineRot) * uS * LS - Math.sin(accLineRot) * wavS;
          a.y = apy + Math.sin(accLineRot) * uS * LS + Math.cos(accLineRot) * wavS;
          var hS = (a.q8 || 0) + (accSwathFam ? 0.05 : 0.42);
          var briS = (0.18 + 0.82 * accSwathEnv) * accVis; // faint live strand; bright only at ticks
          a.r = orbCol(hS, 0) * briS;
          a.g = orbCol(hS, 0.33) * briS;
          a.b = orbCol(hS, 0.67) * briS;
          a.a = (uS < 0.03 ? 0 : 0.62) * accVis;
          mutRGB(a); // D13
          return a;
        }
        if (accLine === 4) {
          // ROTATING PINWHEEL (480p 0:39-0:45): 8 long thin lines through an off-centre hub,
          // rotating steadily like a windmill for the whole accessory dwell
          var Kp = 8,
            fkp = (a.sample || 0) * Kp,
            kp = Math.floor(fkp),
            up = fkp - kp;
          var pang = accLineRot + kp * (3.14159 / Kp);
          // CONTAINED reach (user: it was spraying edge-to-edge and burying the motif; the ref
          // windmill is a localized fan): half-length 1.7→0.7 so rays stay near the hub.
          var pp = (up - 0.5) * 0.7;
          // hub ANCHORED to the central motif (user, twice: the 480p 0:39-0:45 fan rotates
          // around the CENTRE MOTIF, not free-floating)
          var phx = a.q2 !== undefined ? a.q2 : 0.5,
            phy = a.q3 !== undefined ? a.q3 : 0.5;
          a.x = phx + Math.cos(pang) * pp;
          a.y = phy + Math.sin(pang) * pp;
          var hp = (a.q8 || 0) + 0.2;
          a.r = orbCol(hp, 0) * 0.5 * accVis; // dimmer (0.75→0.5) so it reads as a soft fan, not a wall
          a.g = orbCol(hp, 0.33) * 0.5 * accVis;
          a.b = orbCol(hp, 0.67) * 0.5 * accVis;
          a.a = (up < 0.03 ? 0 : 0.4) * accVis;
          mutRGB(a); // D13
          return a;
        }
        if (accLine === 1 && accLineEnv > 0.01) {
          // RAY-CURTAIN: 16 parallel rays × 32 samples, pivoting as a fan while it lives
          var K = 16,
            fk1 = (a.sample || 0) * K,
            k = Math.floor(fk1),
            u1 = fk1 - k;
          var dx1 = Math.cos(accLineRot),
            dy1 = Math.sin(accLineRot);
          var offp = (k / (K - 1) - 0.5) * 0.85;
          a.x = accLineX - dy1 * offp + dx1 * (u1 - 0.5) * 1.5;
          a.y = accLineY + dx1 * offp + dy1 * (u1 - 0.5) * 1.5;
          var h1 = (a.q8 || 0) + 0.24;
          // kept LIGHT: the pivoting sweep stamps ~every frame into the trail, so a bright
          // curtain accumulates into a solid wall of lines (the ref's sweeps stay thin)
          var bri = 0.62 * accLineEnv * accVis;
          a.r = orbCol(h1, 0) * bri;
          a.g = orbCol(h1, 0.33) * bri;
          a.b = orbCol(h1, 0.67) * bri;
          a.a = u1 < 0.03 ? 0 : 0.4 * accLineEnv * accVis;
          mutRGB(a); // D13
          return a;
        }
        if (accLine === 2) {
          // WAVEFORM BUNDLE: 3 chromatic strands stacked around accLineY, live-audio jag
          var S = 3,
            fk2 = (a.sample || 0) * S,
            st = Math.floor(fk2),
            u2 = fk2 - st;
          var jag2 = (a.value1 || 0) * 0.05;
          a.x = u2 * 1.14 - 0.07;
          a.y = accLineY + (st - 1) * 0.055 + jag2;
          var h2 = (a.q8 || 0) + 0.3 + st * 0.13; // each strand its own hue (chromatic bundle)
          a.r = orbCol(h2, 0) * 0.8;
          a.g = orbCol(h2, 0.33) * 0.8;
          a.b = orbCol(h2, 0.67) * 0.8;
          a.a = (u2 < 0.02 ? 0 : 0.5) * accVis * accBundleVis;
          mutRGB(a); // D13
          return a;
        }
        a.a = 0;
        return a;
      },
    };
    preset.waves[2] = {
      baseVals: Object.assign({}, WAVE_BASE, {
        enabled: 1,
        samples: 512,
        additive: 0,
        usedots: 0,
        scaling: 1,
        smoothing: 0.1, // slightly rounded — the WMP tether is softer than a razor polyline
        thick: 1,
        a: 0.9,
      }),
      init_eqs: passthrough,
      frame_eqs: passthrough,
      point_eqs: function (a) {
        fTether(a);
        var g = Math.max(0, (Math.min(a.q25 || 0, a.q14 || 0) - 0.45) / 0.55); // both orbs present
        var beatG = tetherEnv; // scheduler-driven spawn event (was: every-beat q32 flash)
        var corridor = Math.abs((a.q29 || 0) - 3) < 0.5 ? 1 : 0; // steady (the corridor's waveform thread)
        // COCOON (doc 09 A2): suppress the tether while the eyes sit inside the cage — the refs
        // show no line between the eyes. cocAmt is closure state, readable here like accLine.
        // RAIL bypasses the orb gate + event envelope (dim, persistent — doc 06 step 5).
        a.a =
          (a.a === undefined ? 0.9 : a.a) *
          Math.max(g, railAmt * 0.8) *
          Math.max(beatG, corridor, railAmt * 0.5) *
          (1 - 0.85 * cocAmt);
        return a;
      },
    };
    // waves[3] = MULTIPLEXER (doc 07 A16b+A4): corridor ring-row (priority 1, bgMode 3) → else
    // the ORB RING-ACCESSORY (multi-ring bullseye via the kit alcOrbTarget / telescope column /
    // rosette / eyelet inner ring / off). Line-mode now (was dots — a baseVals constant, so the
    // corridor row is drawn as tiny rings): NON-ADDITIVE crisp ring outlines, which is what lets
    // the eyelet ring read DARKER and avoids the removed-bead-row additive failure (bad7755 —
    // that was additive beads MARCHING; these are few, tapered, anchored to stationary posts).
    var bullA = alcOrbTarget("q21", "q22", 6, colAcc),
      bullB = alcOrbTarget("q23", "q24", 6, colAcc);
    preset.waves[3] = {
      baseVals: Object.assign({}, WAVE_BASE, {
        enabled: 1,
        samples: 512,
        additive: 0,
        usedots: 0,
        scaling: 1,
        smoothing: 0.0,
        thick: 1,
        a: 0.85,
      }),
      init_eqs: passthrough,
      frame_eqs: passthrough,
      point_eqs: function (a) {
        if (Math.abs((a.q29 || 0) - 3) < 0.5) {
          // CORRIDOR row — a row of small rings receding from the near-left anchor toward the
          // right vanishing point, foreshortened + fading (the 0:06-0:16 corridor recede).
          var K = 10,
            fk0 = (a.sample || 0) * K,
            ki = Math.min(Math.floor(fk0), K - 1),
            ku = fk0 - ki;
          var idx = ki / (K - 1);
          var d = Math.pow(idx, 1.5); // compress spacing toward the vanishing point
          var nearX = 0.16,
            nearY = 0.52,
            vpx = 0.82,
            vpy = 0.49;
          var bx = nearX + (vpx - nearX) * d;
          var by = nearY + (vpy - nearY) * d + 0.03 * Math.sin(idx * 6.0 + (a.q9 || 0) * 4.0);
          var rr0 = 0.008 * (1 - 0.5 * idx); // the ring shrinks with depth
          a.x = bx + Math.cos(ku * 6.2832) * rr0;
          a.y = by + Math.sin(ku * 6.2832) * rr0;
          var h0 = accentHue; // the row matches its anchor orbs (B7 — one accent family)
          a.r = orbCol(h0, 0);
          a.g = orbCol(h0, 0.33);
          a.b = orbCol(h0, 0.67);
          mutRGB(a); // D13: accent HUE family, but only orbs+tether carry the saturation
          a.a = ku < 0.05 ? 0 : 0.9 * (1 - idx * 0.72);
          return a;
        }
        var ty = acc3.type;
        var hostVis = acc3.orb ? a.q14 || 0 : a.q25 || 0;
        var gate = acc3Env * hostVis * accVis * (1 - cocAmt) * (1 - sketchAmt);
        if (ty === 0 || gate < 0.02) {
          a.a = 0;
          return a;
        }
        var ox = acc3.orb ? (a.q23 !== undefined ? a.q23 : 0.5) : a.q21 !== undefined ? a.q21 : 0.5;
        var oy = acc3.orb ? (a.q24 !== undefined ? a.q24 : 0.5) : a.q22 !== undefined ? a.q22 : 0.5;
        // host balloon → rings balloon too (p0 O9), CLAMPED — an unclamped 3x pop blew the
        // bullseye's outer ring to half the screen (user 2026-07-09: nested giant ring ghosts)
        var RS = Math.min(acc3.orb ? radScaleB : radScaleA, 1.6);
        if (ty === 1) {
          // MULTI-RING BULLSEYE — CALL the kit factory (working-agreements rule), then
          // post-gate rings ≥ n using the factory's own sample split. Outer radius is
          // NORMALISED to the ref's 8-20% frame bullseyes (p1 O5) — the raw kit scale ×
          // balloons blew frame-filling nested ring ghosts (user: "large orb ghosts").
          (acc3.orb ? bullB : bullA).point_eqs(a);
          var q7e = a.q7 || 0.048;
          var sc = Math.min(Math.min(RS, 1.25), 0.1 / (q7e * (0.65 + (acc3.n - 1) * 0.5)));
          a.x = ox + (a.x - ox) * sc;
          a.y = oy + (a.y - oy) * sc;
          var bk = Math.min(Math.floor((a.sample || 0) * 6), 5);
          a.a = bk >= acc3.n ? 0 : 0.55 * gate;
          return a;
        }
        if (ty === 2) {
          // TELESCOPE / RING-STACK COLUMN (p0 O6/O7, p1 O7): 4-9 hollow ellipse rings tapering
          // ~3:1 along an axis off the orb; extends/retracts ±9% (T 2-3s), sways (~1s) with a
          // slight stalk CURVE (the 480p 14-23s stalks bend); tip ring brightest (snaps first).
          var N = acc3.nCol;
          var fk = (a.sample || 0) * N,
            seg = Math.min(Math.floor(fk), N - 1),
            u = fk - seg;
          var segEff = seg,
            Nn = N,
            lenEff = acc3.len,
            taperEff = acc3.taper,
            angBase = acc3.ang,
            mush = mushAmt > 0.5;
          if (mush) {
            // A18 MUSHROOM: seg parity splits this one wave across BOTH anchors — each cap is
            // a short coiled ring-TUBE leaning outward (h2 2.14); the rise trail stacks the body
            var useB = (seg & 1) === 1;
            ox = useB ? (a.q23 !== undefined ? a.q23 : 0.5) : a.q21 !== undefined ? a.q21 : 0.5;
            oy = useB ? (a.q24 !== undefined ? a.q24 : 0.5) : a.q22 !== undefined ? a.q22 : 0.5;
            segEff = seg >> 1;
            Nn = Math.max(2, N >> 1);
            lenEff = 0.07; // short tube, not a long stalk
            taperEff = 0.3;
            angBase = -1.5708 + (useB ? 0.14 : -0.14); // the pair leans outward (mirror figures)
          }
          var age = lastT - acc3.t0;
          var ext = mush ? 1 : 1 + 0.09 * Math.sin((6.2832 * age) / acc3.extT);
          var swy = (mush ? 0.03 : 0.09) * Math.sin(age * 6.2832);
          var axA = angBase + swy + (mush ? 0 : seg * 0.06 * Math.sin(lastT * 0.6 + acc3.t0));
          var frac = segEff / (Nn - 1);
          var d2 = (0.14 + 0.86 * frac) * lenEff * ext;
          // 0.72: full-q7 base rings read as giant cups (user screenshots); ref beads are
          // 28-35px on the 300px pane ≈ ~10% dia — about 3/4 of the orb
          var rr = (a.q7 || 0.048) * 0.72 * (1 - taperEff * frac);
          var bx2 = ox + Math.cos(axA) * d2,
            by2 = oy + Math.sin(axA) * d2;
          var th = u * 6.2832;
          var exx = Math.cos(th) * rr,
            eyy = Math.sin(th) * rr * 0.38; // squash ALONG the axis → foreshortened 3D stack
          a.x = bx2 + exx * Math.sin(axA) + eyy * Math.cos(axA);
          a.y = by2 - exx * Math.cos(axA) + eyy * Math.sin(axA);
          var h2 = accentHue + segEff * 0.03;
          a.r = orbCol(h2, 0);
          a.g = orbCol(h2, 0.33);
          a.b = orbCol(h2, 0.67);
          if (segEff === Nn - 1) {
            a.r = Math.min(1, a.r * 1.3 + 0.15); // the TIP ring is brighter (p1: tip snaps)
            a.g = Math.min(1, a.g * 1.3 + 0.15);
            a.b = Math.min(1, a.b * 1.3 + 0.15);
          }
          mutRGB(a);
          // discrete rings — hide ring-to-ring connectors; during the mushroom the parity split
          // makes EVERY seg boundary jump between the two figures, so hide BOTH seg ends wide
          a.a = u < (mush ? 0.12 : 0.05) || (mush && u > 0.94) ? 0 : 0.6 * gate;
          return a;
        }
        if (ty === 3) {
          // ROSETTE — scalloped ring rim on the host (h0 gear-flower). Secondary accessory →
          // a procedural scallop is allowed (the waveform rule binds PRIMARY motifs only).
          var th3 = (a.sample || 0) * 6.2832;
          var R3 = (a.q7 || 0.048) * 1.15 * (1 + 0.12 * Math.cos(th3 * 10)) * RS;
          a.x = ox + Math.cos(th3) * R3;
          a.y = oy + Math.sin(th3) * R3;
          a.r = orbCol(accentHue, 0);
          a.g = orbCol(accentHue, 0.33);
          a.b = orbCol(accentHue, 0.67);
          mutRGB(a);
          a.a = 0.5 * gate;
          return a;
        }
        // ty 4: EYELET INNER RING (p0 O1: a smaller DARKER ring offset up-left INSIDE the orb —
        // completes the classic "milky ringed eyelet"; non-additive dark ink darkens the fill)
        var th4 = (a.sample || 0) * 6.2832;
        var R4 = (a.q7 || 0.048) * 0.45 * RS;
        var off4 = (a.q7 || 0.048) * 0.25 * RS;
        a.x = ox - off4 + Math.cos(th4) * R4;
        a.y = oy + off4 + Math.sin(th4) * R4;
        a.r = 0.16;
        a.g = 0.14;
        a.b = 0.2;
        a.a = 0.55 * gate;
        return a;
      },
    };
    preset.shapes[0] = orbShape("q21", "q22", 0.0, "q25", 0); // orb A (near-persistent anchor)
    preset.shapes[1] = orbShape("q23", "q24", 0.35, "q14", 1); // orb B (comes & goes; different hue)
    preset.shapes[2] = orbGlow("q21", "q22", 0.0, "q25", 0); // additive glow halo A
    preset.shapes[3] = orbGlow("q23", "q24", 0.35, "q14", 1); // additive glow halo B

    return preset;
  }

  // ── TWO VARIANTS — identical geometry/engine/motifs/scenes/camera; ONLY the COMP colour profile differs. ──
  // PASTEL = the accurate WMP look (480p + the orig-19s clip both measure muted/dusty/pastel, true blacks):
  // lower saturation, lifted softer washes, milky low-contrast, a faint mauve/sage cast.
  var PROFILE_PASTEL = {
    gboost: 1.1, // was 1.32/1.7 — user 2026-07-10 "backgrounds too milky/faded"; the ref has TRUE
    // blacks, so darken the DARK GROUND (gboost multiplies only `ground`, never the trail/glow —
    // the geometry keeps its presence while the empty/dark regions deepen).
    kbold: 0.85,
    ksat: 0.38, // kaleidoscope diamonds DESATURATED → soft pastel (they were reading too vivid in pastel)
    tonek: 0.68,
    sat: 0.82, // was 0.62 — keep real (muted) COLOUR, not greyed-out
    deepen: 0.74, // was 0.84/0.95 — more darks-compression (toned²) so the floor stays deep, not milky
    lift: 0.0, // was 0.02/0.05 — NO milky floor lift (ref has true blacks)
    tintR: 0.5,
    tintG: 0.5,
    tintB: 0.58,
    tintAmt: 0.06, // was 0.12 — subtler cast
  };
  // VIVID = the punchier 1080p-tuned look (what the user liked): boosted saturation, dark grounds,
  // deepened darks, bold kaleidoscope, no tint.
  var PROFILE_VIVID = {
    gboost: 1.0,
    kbold: 1.7,
    ksat: 1.0, // full-saturation bold diamonds (the vivid red/green kaleidoscope)
    tonek: 0.55,
    sat: 1.2,
    deepen: 0.68,
    lift: 0.0,
    tintR: 0.5,
    tintG: 0.5,
    tintB: 0.5,
    tintAmt: 0.0,
  };
  P["Alchemy (Pastel)"] = buildV7(makeComp(PROFILE_PASTEL));
  P["Alchemy (Vivid)"] = buildV7(makeComp(PROFILE_VIVID));
})();
