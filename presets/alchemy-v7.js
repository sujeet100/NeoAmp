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
 *   ENGINE  q1 decay · q8 hue(shared) · q12 fold-on · q13 fold-scale · q15 magnify · q16 roll ·
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
    // MAGNIFY: q15>0 shrinks the sample offset → the old buffer appears slightly bigger each frame, so
    // every deposit GROWS as it ages (the "traces grow in size before disappearing" note). Small.
    "  pd *= (1.0 - q15);\n" +
    "  pd.x /= asp;\n" +
    "  vec2 suv = piv + pd + vec2(q18, q19);\n" + // PAN translate (abrupt-snap direction from frame())
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
      "  vec2 c = uv - 0.5; c.x *= asp; float prad = length(c);\n" +
      "  float hb = q8;\n" +
      // ── sample coord: KALEIDOSCOPE tiled-diamond mirror-fold when m==1 (the reference's repeating
      //    diamond lattice of mirrored bursts) — a 4-fold abs mirror repeated ~1.6× across the frame. ──
      "  vec2 suv = uv;\n" +
      "  if (m > 0.5 && m < 1.5) {\n" +
      "    vec2 kc = (uv - 0.5) * (1.5 + 0.4 * q13); kc.x *= asp;\n" +
      "    kc = abs(fract(kc * 0.5 + 0.5) * 2.0 - 1.0);\n" + // repeating mirror → diamonds
      "    kc.x /= asp; suv = clamp(kc * 0.5 + 0.25, 0.0, 1.0);\n" +
      "  }\n" +
      // ── the watercolour TRAIL + motif buffer (a tiny max-dilate so thin lines survive) + bloom glow ──
      "  vec2 dpx = 1.0 / resolution;\n" +
      "  vec3 trail = texture2D(sampler_main, suv).rgb;\n" +
      "  trail = max(trail, texture2D(sampler_main, suv + vec2(dpx.x, 0.0)).rgb);\n" +
      "  trail = max(trail, texture2D(sampler_main, suv - vec2(dpx.x, 0.0)).rgb);\n" +
      "  trail = max(trail, texture2D(sampler_main, suv + vec2(0.0, dpx.y)).rgb);\n" +
      "  trail = max(trail, texture2D(sampler_main, suv - vec2(0.0, dpx.y)).rgb);\n" +
      "  vec3 glow = texture2D(sampler_blur1, suv).rgb;\n" +
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
      // 4 VERTICAL BARS / barcode (1:48-2:02): purple↔green vertical stripes, top-bottom mirrored.
      "  else if (m > 3.5 && m < 4.5) {\n" +
      "    float bars = pow(0.5 + 0.5 * cos((uv.x * 22.0 + time * 0.12) * 6.2832), 1.3);\n" +
      "    vec3 barCol = mix(pal(hb + 0.5), pal(hb + 0.04), bars);\n" + // two analogous bar hues
      "    ground = barCol * (0.07 + 0.16 * bars);\n" +
      "  }\n" +
      // 5 FLAT SOLID-COLOUR WASH (0:48 / 1:16): a calm even mid-tone stage, slow analogous drift, dusty.
      "  else if (m > 4.5 && m < 5.5) {\n" +
      "    ground = mix(pal(hb), pal(hb + 0.13), 0.5 + 0.5 * sin(time * 0.06));\n" +
      "    float gl = dot(ground, vec3(0.333)); ground = mix(vec3(gl), ground, 0.5);\n" +
      "    ground *= 0.15 + 0.03 * n;\n" + // faint fbm tooth so it's not dead-flat
      "  }\n" +
      // 6 HORIZONTAL colour BANDS (2:28-2:39): smooth horizontal stripes, slow vertical drift.
      "  else if (m > 5.5 && m < 6.5) {\n" +
      "    float yb = uv.y * 5.0 + sin(uv.x * 2.0 + time * 0.1) * 0.3 - time * 0.06;\n" +
      "    ground = mix(pal(hb), pal(hb + 0.3), 0.5 + 0.5 * sin(yb * 3.14159));\n" +
      "    float gl = dot(ground, vec3(0.333)); ground = mix(vec3(gl), ground, 0.62);\n" +
      "    ground *= 0.14;\n" +
      "  }\n" +
      // 7 CONCENTRIC RINGS / bullseye glow (1:33): a few soft concentric rings, low saturation.
      "  else if (m > 6.5) {\n" +
      "    float rng = 0.5 + 0.5 * sin((prad * 7.0 - time * 0.2) * 6.2832);\n" +
      "    ground = mix(pal(hb + 0.02), pal(hb + 0.2), rng) * (0.05 + 0.13 * rng);\n" +
      "  }\n" +
      // ── KALEIDOSCOPE regime (m==1): BOLD vivid diamonds (the reference's punchy red↔green, 0:22-0:27 —
      //    this phase deliberately BREAKS the muted rule). Alternating diamond cells take a 2-hue DUO. ──
      "  if (m > 0.5 && m < 1.5) {\n" +
      "    float cell = step(0.5, fract((suv.x + suv.y) * 1.5));\n" + // checker of diamond cells
      "    vec3 kcol = pal(hb + cell * 0.45 + 0.12 * suv.x);\n" + // bold 2-tone duo across cells
      "    kcol = kcol * kcol * " +
      G(P.kbold) +
      ";\n" + // PROFILE: kaleidoscope boldness (vivid bold / pastel soft)
      "    ground = mix(ground * 0.12, kcol, 0.9);\n" +
      "  }\n" +
      "  ground *= mix(0.55, 1.06, smoothstep(1.45, 0.1, prad));\n" + // depth vignette
      "  ground *= " +
      G(P.gboost) +
      ";\n" + // PROFILE: ground brightness (pastel lifts the washes; vivid keeps dark)
      // ── COMPOSITE: vivid trails + glow halo POP on the dark ground (value separation = depth). ──
      "  vec3 col = ground + trail * 1.28 + glow * 0.6;\n" +
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
  function orbShape(qx, qy, hueOff, visVar) {
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
        var hf = (s.q8 || 0) + (hueOff || 0),
          hb = hf + 0.5;
        var fr = orbCol(hf, 0),
          fg = orbCol(hf, 0.33),
          fb = orbCol(hf, 0.67);
        var br = orbCol(hb, 0),
          bg = orbCol(hb, 0.33),
          bb = orbCol(hb, 0.67);
        var bri = 0.9 + 0.5 * be; // fill brightness pulses with the beat
        s.x = cx;
        s.y = cy;
        s.rad = (s.q7 || 0.06) * (1 + 0.45 * be); // radius pulses with the beat
        // SOLID coloured fill — near-1 opacity when present (the original's orbs are solid, THEN fade;
        // the `vis` come-and-go envelope does the fade). Body kept solid too, not translucent.
        s.r = Math.min(1, fr * bri);
        s.g = Math.min(1, fg * bri);
        s.b = Math.min(1, fb * bri);
        s.a = 1.0 * vis;
        s.r2 = fr * 0.9;
        s.g2 = fg * 0.9;
        s.b2 = fb * 0.9;
        s.a2 = 0.78 * vis;
        // PROMINENT border — BRIGHT contrast-hue rim (was dim ×0.34) that pulses hard on the beat (the
        // user: "border is still not prominent when it pulses" / "solid border with almost 1 opacity").
        var bbri = 0.8 + 0.7 * be;
        s.border_r = Math.min(1, br * bbri);
        s.border_g = Math.min(1, bg * bbri);
        s.border_b = Math.min(1, bb * bbri);
        s.border_a = Math.min(1, 0.7 + 0.6 * be) * vis;
        return s;
      },
    };
  }
  function orbGlow(qx, qy, hueOff, visVar) {
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
        var hf = (s.q8 || 0) + (hueOff || 0);
        var gr = orbCol(hf, 0),
          gg = orbCol(hf, 0.33),
          gb = orbCol(hf, 0.67);
        s.x = cx;
        s.y = cy;
        s.rad = (s.q7 || 0.06) * (1.7 + 0.5 * be); // wider halo
        s.r = gr * 0.85;
        s.g = gg * 0.85;
        s.b = Math.min(1, gb * 1.4 + 0.12);
        s.a = 0.34 * vis;
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
  function makePicker(n, minS, maxS, fade) {
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
          b = n > 1 ? Math.floor(Math.random() * (n - 1)) : a;
          if (b >= a) b++;
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
    var N = 6,
      fk = (a.sample || 0) * N,
      seg = Math.floor(fk),
      u = fk - seg,
      s = u * 2 - 1;
    var th = seg * (3.14159 / N) + (a.q9 || 0) * 0.5;
    var len = (a.q5 || 0.4) * 1.5;
    var jag = (a.value1 || 0) * (a.q6 || 0.05) * 1.2;
    var cx = a.q2 !== undefined ? a.q2 : 0.5,
      cy = a.q3 !== undefined ? a.q3 : 0.5;
    a.x = cx + s * len * Math.cos(th) - jag * Math.sin(th);
    a.y = cy + s * len * Math.sin(th) + jag * Math.cos(th);
    var h = (a.q8 || 0) + 0.18;
    a.r = orbCol(h, 0);
    a.g = orbCol(h, 0.33);
    a.b = orbCol(h, 0.67);
    if (u < 0.02) a.a = 0;
    return a;
  }
  // URCHIN — all 512 live-waveform samples form a spiky rosette whose spike LENGTH is the amplitude.
  function fUrchin(a) {
    var cx = a.q2 !== undefined ? a.q2 : 0.5,
      cy = a.q3 !== undefined ? a.q3 : 0.5;
    var sc = a.q5 || 0.4;
    var rad = sc * (0.2 + 0.65 * Math.abs(a.value1 || 0));
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
  // WIREFRAME NET (survey gap #1, recurring 0:06-0:12 / 0:33 / 2:08 / 2:42): a clean CROSSHATCH GRID —
  // N horizontal + N vertical strands, GENTLY foreshortened toward a slow tilt so it reads as a tilted 3D
  // SHEET (the reference's actual net is a crossing-strand grid, NOT a chaotic star-art spray). Mild
  // live-waveform jag for the Alchemy texture. (Replaced the old {13/5} star-art version — it read as a
  // "hideous" chaotic mess; the user rejected it.)
  function fNet(a) {
    var half = (a.sample || 0) < 0.5 ? 0 : 1;
    var ss = half ? ((a.sample || 0) - 0.5) * 2.0 : (a.sample || 0) * 2.0; // 0..1 within each strand set
    var N = 9,
      fk = ss * N,
      line = Math.floor(fk),
      u = fk - line;
    var t = (line / (N - 1)) * 2.0 - 1.0; // strand offset across the sheet, -1..1
    var p = u * 2.0 - 1.0; // position along the strand, -1..1
    var R = (a.q5 || 0.4) * 1.4;
    var gx, gy;
    if (half === 0) {
      gx = p * R;
      gy = t * R;
    } else {
      gx = t * R;
      gy = p * R;
    }
    var jag = (a.value1 || 0) * (a.q6 || 0.05) * 0.45; // gentle perpendicular live-waveform jag
    if (half === 0) gy += jag;
    else gx += jag;
    // GENTLE perspective foreshorten toward a slow tilt direction → a tilted sheet (not an extreme stretch)
    var tA = (a.q9 || 0) * 0.5 + 0.7;
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
    var h = (a.q8 || 0) + 0.12;
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
  // JELLYFISH / EYE DISC (survey gap, 0:48): an oblate filament RING with a waveform fringe that TILTS in
  // 3D — its Y-scale oscillates flat↔edge-on so it reads as a disc rotating in space (distinct from the
  // flat front-on urchin). The warm core comes from the COMP focus pupil (mode added to the focus set).
  function fJelly(a) {
    var N = 80,
      fk = (a.sample || 0) * N,
      seg = Math.floor(fk),
      u = fk - seg;
    var ang = (seg / N) * 6.2832 + (a.q9 || 0);
    var R = (a.q5 || 0.4) * 0.95;
    var rr = R * (0.82 + 0.26 * Math.abs(a.value1 || 0)); // ring + live-waveform fringe
    var x = Math.cos(ang) * rr,
      y = Math.sin(ang) * rr;
    var tilt = 0.32 + 0.68 * (0.5 + 0.5 * Math.sin((a.q9 || 0) * 1.7)); // oscillating Y-squash → 3D tilt
    y *= tilt;
    var cx = a.q2 !== undefined ? a.q2 : 0.5,
      cy = a.q3 !== undefined ? a.q3 : 0.5;
    a.x = cx + x;
    a.y = cy + y;
    var h = a.q8 || 0;
    a.r = orbCol(h, 0);
    a.g = orbCol(h, 0.33);
    a.b = orbCol(h, 0.67);
    if (u < 0.02) a.a = 0;
    return a;
  }
  // 12-POINT STAR MANDALA (survey gap, 1:33): a {12/5} star polygon — finer/higher-order than the 6-arm
  // star-net. Pairs with the bullseye bg (q29=7) for the "12-point star over a bullseye iris" look.
  function f12Star(a) {
    var P = 12,
      stride = 5,
      CH = 12,
      fk = (a.sample || 0) * CH,
      seg = Math.floor(fk),
      u = fk - seg;
    var i0 = (seg * stride) % P,
      i1 = (seg * stride + stride) % P;
    var sp = (a.q9 || 0) * 0.4;
    var aa0 = (i0 / P) * 6.2832 + sp,
      aa1 = (i1 / P) * 6.2832 + sp;
    var R = (a.q5 || 0.4) * 1.3;
    var x0 = Math.cos(aa0) * R,
      y0 = Math.sin(aa0) * R,
      x1 = Math.cos(aa1) * R,
      y1 = Math.sin(aa1) * R;
    var px = x0 + (x1 - x0) * u,
      py = y0 + (y1 - y0) * u;
    var dxc = x1 - x0,
      dyc = y1 - y0,
      ln = Math.hypot(dxc, dyc) || 1;
    var jag = (a.value1 || 0) * (a.q6 || 0.05) * 0.5;
    px += (-dyc / ln) * jag;
    py += (dxc / ln) * jag;
    var cx = a.q2 !== undefined ? a.q2 : 0.5,
      cy = a.q3 !== undefined ? a.q3 : 0.5;
    a.x = cx + px;
    a.y = cy + py;
    var h = (a.q8 || 0) + 0.1;
    a.r = orbCol(h, 0);
    a.g = orbCol(h, 0.33);
    a.b = orbCol(h, 0.67);
    if (u < 0.02) a.a = 0;
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
    var br = 0.02 * (seg === mid ? 2.3 : 1.0) * (1 + 0.5 * be); // central bead bigger = the eye; beads POP on the beat
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
    var seed = seg * 2.39996; // golden-angle spread → strands fan all directions
    var R = a.q5 || 0.4;
    var rad = R * (0.08 + 0.92 * u);
    var curl = seed + (a.q9 || 0) + 2.3 * u * Math.sin(seed * 1.7) + (a.value1 || 0) * 0.7 * u; // curl + audio jitter
    var jit = (a.value1 || 0) * (a.q6 || 0.05) * 1.6 * u;
    var cx = a.q2 !== undefined ? a.q2 : 0.5,
      cy = a.q3 !== undefined ? a.q3 : 0.5;
    a.x = cx + rad * Math.cos(curl) + jit * Math.cos(curl + 1.5708);
    a.y = cy + rad * Math.sin(curl) + jit * Math.sin(curl + 1.5708);
    var h = (a.q8 || 0) + u * 0.1;
    a.r = orbCol(h, 0);
    a.g = orbCol(h, 0.33);
    a.b = orbCol(h, 0.67);
    if (u < 0.04) a.a = 0; // hide strand-to-strand jumps
    return a;
  }
  // WAVEFORM MOUNTAINS / terrain (480p survey, 0:03 / 1:05 / 2:41): several STACKED horizontal live-
  // waveform ridgelines (|sample| = sawtooth peaks) → a mountain range; feedback leaves the comb beneath.
  function fMountains(a) {
    var ROWS = 4,
      fk = (a.sample || 0) * ROWS,
      row = Math.floor(fk),
      u = fk - row;
    var R = a.q5 || 0.4;
    var W = R * 2.1; // wide span
    var amp = (a.q6 || 0.05) * 3.2;
    var rowY = (row / (ROWS - 1) - 0.5) * 0.95 * R; // stack the ridges vertically
    var ridge = Math.abs(a.value1 || 0) * amp; // |waveform| → upward sawtooth peaks
    var cx = a.q2 !== undefined ? a.q2 : 0.5,
      cy = a.q3 !== undefined ? a.q3 : 0.5;
    a.x = cx + (u - 0.5) * W;
    a.y = cy + rowY - ridge;
    var h = (a.q8 || 0) + row * 0.08;
    a.r = orbCol(h, 0);
    a.g = orbCol(h, 0.33);
    a.b = orbCol(h, 0.67);
    if (u < 0.02 || u > 0.98) a.a = 0;
    return a;
  }
  // MODES — flower/mandala/beam/n-gon/net/vortex/jelly/12-star/bead-chain/valley + organic-tangle + mountains.
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
  ];
  // ADDITIVE dense modes (anemone/urchin/net/vortex/jelly/tangle) pile up → lower alpha; outlines keep more.
  var MODE_ALPHA = [
    0.5, 0.72, 0.54, 0.7, 0.74, 0.74, 0.7, 0.58, 0.5, 0.6, 0.72, 0.82, 0.72, 0.5, 0.66,
  ];
  function scaleFor(m) {
    return m === 0 ? 0.36 : 0.4;
  }
  function centralDraw(a) {
    var m = Math.floor((a.q30 || 0) + 0.5);
    if (m < 0) m = 0;
    if (m >= MODES.length) m = MODES.length - 1;
    MODES[m](a);
    // PULSAR oblate squash — the anemone/urchin (0/2) read as a tilted 3D eye, not a flat face-on circle.
    if ((m === 0 || m === 2) && (a.q12 || 1) < 1.5) {
      var cyS = a.q3 !== undefined ? a.q3 : 0.5;
      a.y = cyS + (a.y - cyS) * (1.0 - 0.34 * (a.q11 || 0));
    }
    a.a = (a.a === undefined ? 0.85 : a.a) * (a.q4 || 0) * MODE_ALPHA[m];
    return a;
  }
  // TETHER — the jagged waveform line joining the two orbs. The kit bakes a fixed colour; we override so
  // it CYCLES with the shared q8 clock (in the original the line changes colour like everything else —
  // the user noticed ours was stuck amber). Slight offset from the orbs so it reads as its own element.
  var tetherPts = alcTether("q21", "q22", "q23", "q24", "q26", null).point_eqs;
  function fTether(a) {
    tetherPts(a);
    var h = (a.q8 || 0) + 0.08;
    a.r = orbCol(h, 0);
    a.g = orbCol(h, 0.33);
    a.b = orbCol(h, 0.67);
    return a;
  }

  // ── director state (closure → persists; ONE preset, never reloaded) ──
  var lastT = 0,
    huePhase = 0,
    hueStep = 0,
    lastBgMode = -1,
    pulse = 0, // SMOOTHED beat envelope (fast attack / slow release) — breathes, never strobes
    panMag = 0,
    focusAmt = 0, // modes 0 (anemone) / 2 (urchin) → COMP pupil + oblate squash
    corridorAmt = 0, // bgMode 3 → the marching-orbiter corridor (side-view, rightward drift)
    valleyAmt = 0; // motif 12 → the green valley corridor (forward dolly into the vanishing point)
  var beat = alcBeatFlash({ rise: 1.22 });
  // WEIGHTED bags — DOMINANT = dark wavy-fluid ground; kaleidoscope + radial-tunnel are ACCENTS.
  var BG_BAG = [0, 0, 0, 0, 0, 2, 2, 1, 3, 4, 5, 6, 7, 1]; // 0 wavy-fluid(dominant) · 1 kaleidoscope · 2 radial-tunnel · 3 corridor · 4 vertical-bars · 5 flat-wash · 6 horizontal-bands · 7 bullseye-rings
  var MOTIF_BAG = [0, 0, 1, 1, 2, 3, 4, 5, 6, 7, 7, 8, 9, 10, 11, 12, 13, 13, 14, 1]; // anemone/star DOMINANT; +urchin/cross/tri/square/hexagram/NET/vortex/jelly/12-star/bead-chain/valley/organic-TANGLE(×2)/mountains
  var bgPick = makePicker(BG_BAG.length, 7, 12, 3.0);
  var motifPick = makePicker(MOTIF_BAG.length, 6, 11, 2.0);
  var panDir = makeSnapDir(3.0, 6.0); // ABRUPT-snap pan direction (the 2:24-2:31 camera)

  function frame(t) {
    var time = t.time || 0;
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
    t.q29 = BG_BAG[bg.mix < 0.5 ? bg.a : bg.b]; // discrete snap (the persistent trail buffer bridges cuts)
    var bgMode = Math.floor(t.q29 + 0.5);

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

    // ── CAMERA PAN — abrupt-snap direction dragging the trail buffer (the 2:24-2:31 parallax). ──
    panMag += (0.0045 - panMag) * Math.min(1, dt * 0.8);
    var pdir = panDir(time);
    t.q18 = panMag * Math.cos(pdir);
    t.q19 = panMag * Math.sin(pdir) - 0.0012; // a touch of constant upward drift (scene "moves up")

    // ── OFF-CENTRE drifting pivot on an elliptical path → asymmetric parallax (edges sweep faster). ──
    var vpAng = time * 0.045,
      vpR = 0.12 + 0.04 * Math.sin(time * 0.02);
    t.q20 = 0.5 + vpR * Math.cos(vpAng);
    t.q27 = 0.5 + vpR * Math.sin(vpAng * 1.31);

    // ── FOLD — engage the kaleidoscope only on bgMode 1 (the COMP tiled-diamond fold reads q12/q13). ──
    t.q12 = bgMode === 1 ? 4 : 1;
    t.q13 = bgMode === 1 ? 0.5 + 0.4 * Math.min(1, bassA - 1 + 0.5 * Math.sin(time * 0.07)) : 0;

    // ── CENTRAL MOTIF — own clock; geometry swapped under an opacity dip (q4) so it morphs invisibly. ──
    var mo = motifPick(time, dt, f > 0.6);
    var mCur = MOTIF_BAG[mo.mix < 0.5 ? mo.a : mo.b];
    t.q30 = mCur;
    var dd = (mo.mix - 0.5) * 4.0;
    t.q4 = 0.85 * (1 - 0.75 * Math.exp(-dd * dd)); // dips at the swap instant

    focusAmt +=
      ((mCur === 0 || mCur === 2 || mCur === 9 || mCur === 12 || mCur === 13 ? 1 : 0) - focusAmt) *
      Math.min(1, dt * 0.6); // anemone/urchin/jelly/valley/tangle get the warm-core pupil (orb-eye)
    valleyAmt += ((mCur === 12 ? 1 : 0) - valleyAmt) * Math.min(1, dt * 0.5); // valley → forward dolly

    // MOTIF contract (read by the point fns). The central motif DRIFTS gently around the frame (not
    // locked at center) so — as the hue clock advances + the feedback diffuses — it PAINTS a flowing,
    // multi-hued WATERCOLOUR trail (the #1 reference signature, 1:29-1:36 / 2:11-2:30), like the
    // original's roaming flower. Small amplitude so it stays the central object.
    t.q2 = 0.5 + 0.12 * Math.sin(time * 0.045) + 0.05 * Math.sin(time * 0.017 + 1.0);
    t.q3 = 0.5 + 0.09 * Math.cos(time * 0.038) + 0.05 * Math.sin(time * 0.021 + 2.0);
    t.q5 = scaleFor(mCur) * (0.82 + 0.3 * (bassA - 1) + 0.2 * pulse); // breathing + smoothed beat pop
    t.q6 = 0.05;
    t.q9 = time * 0.06; // slow self-spin
    t.q10 = 0.4 * Math.max(0, bassA - 1);
    t.q11 = focusAmt; // COMP pupil + anemone squash

    // ── ORBS + TETHER — wide diagonal pair joined by a jagged waveform line (the Dance signature, A_93/
    //    W_103). Staging: orb A near-persistent, orb B comes & goes; tether gated to both-present + beat. ──
    t.q25 = comeGo(0.3 + 0.6 * Math.sin(time * 0.06 + 0.3) + 0.38 * Math.sin(time * 0.027 + 2.2));
    t.q14 = comeGo(0.6 * Math.sin(time * 0.055 + 1.7) + 0.4 * Math.sin(time * 0.026 + 0.4));
    var axis = time * 0.05 + 0.6 * Math.sin(time * 0.017);
    var sep = 0.3 + 0.06 * Math.sin(time * 0.037),
      wob = 0.35 * Math.sin(time * 0.043);
    t.q21 = 0.5 + sep * Math.cos(axis) + 0.045 * Math.sin(time * 0.09);
    t.q22 = 0.5 + sep * Math.sin(axis) + 0.045 * Math.cos(time * 0.081);
    t.q23 = 0.5 - sep * Math.cos(axis + wob) + 0.045 * Math.sin(time * 0.071 + 2.0);
    t.q24 = 0.5 - sep * Math.sin(axis + wob) + 0.045 * Math.cos(time * 0.063 + 1.0);
    t.q7 = (0.06 + 0.02 * Math.max(0, bassA - 1)) * (1 + 0.35 * pulse); // orb radius (smoothed beat pop)
    t.q26 = 0.06 * (0.5 + 0.7 * bassA); // tether jag amplitude (audio-coupled)

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

    // ── VALLEY camera (motif 12): a gentle forward DOLLY into the vanishing point — the sheets converge
    //    at center, so a slow zoom-in flies down the valley. Brief + scene-local (not the rejected
    //    always-on plunge). Slight extra decay so the receding sheet-lines leave a depth trail. ──
    if (valleyAmt > 0.01) {
      var va = valleyAmt;
      t.q15 += (0.012 - t.q15) * va; // q15>0 magnifies the old buffer → forward DOLLY into the VP
      t.q1 += (0.96 - t.q1) * 0.5 * va; // a touch more decay → the receding sheet-lines leave a depth trail
      t.q16 *= 1 - va; // no roll (a clean dive down the valley)
    }

    // __DEBUG__ self-render hook (PRODUCTION NO-OP — window.__ALC_FORCE is never set live).
    if (typeof window !== "undefined" && window.__ALC_FORCE) {
      var F = window.__ALC_FORCE;
      for (var fk in F) t[fk] = F[fk];
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
        smoothing: 0.25,
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
        if (Math.abs((a.q30 || 0) - 1) > 0.5) {
          a.a = 0;
          return a;
        }
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
        smoothing: 0.0,
        thick: 1,
        a: 0.9,
      }),
      init_eqs: passthrough,
      frame_eqs: passthrough,
      point_eqs: function (a) {
        fTether(a);
        var g = Math.max(0, (Math.min(a.q25 || 0, a.q14 || 0) - 0.45) / 0.55); // both orbs present
        var beatG = Math.max(0, Math.min(1, ((a.q32 || 1) - 1.05) / 0.4)); // flashes on the beat
        var corridor = Math.abs((a.q29 || 0) - 3) < 0.5 ? 1 : 0; // steady (the corridor's waveform thread)
        a.a = (a.a === undefined ? 0.9 : a.a) * g * Math.max(beatG, corridor);
        return a;
      },
    };
    // waves[3] = CORRIDOR ring-dot ROW — a row of glowing dots receding from the near-left anchor toward a
    // right vanishing point, foreshortened (spacing compresses with depth) + fading (the 0:06-0:16 corridor
    // recede). Gated to bgMode 3 (q29). Dots-mode; the spare 4th wave slot, 0 shape budget.
    preset.waves[3] = {
      baseVals: Object.assign({}, WAVE_BASE, {
        enabled: 1,
        samples: 80,
        additive: 1,
        usedots: 1,
        scaling: 1,
        smoothing: 0.0,
        thick: 1,
        a: 0.85,
      }),
      init_eqs: passthrough,
      frame_eqs: passthrough,
      point_eqs: function (a) {
        if (Math.abs((a.q29 || 0) - 3) > 0.5) {
          a.a = 0;
          return a;
        }
        var K = 10,
          idx = Math.floor((a.sample || 0) * K) / (K - 1); // 0 near .. 1 far (10 dots)
        var d = Math.pow(idx, 1.5); // foreshorten: compress spacing toward the vanishing point
        var nearX = 0.16,
          nearY = 0.52,
          vpx = 0.82,
          vpy = 0.49;
        a.x = nearX + (vpx - nearX) * d;
        a.y = nearY + (vpy - nearY) * d + 0.03 * Math.sin(idx * 6.0 + (a.q9 || 0) * 4.0);
        var h = a.q8 || 0;
        a.r = orbCol(h, 0);
        a.g = orbCol(h, 0.33);
        a.b = orbCol(h, 0.67);
        a.a = 0.9 * (1 - idx * 0.72); // fade with depth → recede
        return a;
      },
    };
    preset.shapes[0] = orbShape("q21", "q22", 0.0, "q25"); // orb A (near-persistent anchor)
    preset.shapes[1] = orbShape("q23", "q24", 0.35, "q14"); // orb B (comes & goes; different hue)
    preset.shapes[2] = orbGlow("q21", "q22", 0.0, "q25"); // additive glow halo A
    preset.shapes[3] = orbGlow("q23", "q24", 0.35, "q14"); // additive glow halo B

    return preset;
  }

  // ── TWO VARIANTS — identical geometry/engine/motifs/scenes/camera; ONLY the COMP colour profile differs. ──
  // PASTEL = the accurate WMP look (480p + the orig-19s clip both measure muted/dusty/pastel, true blacks):
  // lower saturation, lifted softer washes, milky low-contrast, a faint mauve/sage cast.
  var PROFILE_PASTEL = {
    gboost: 1.32, // was 1.7 — too washed; muted but the geometry keeps presence on a darker-ish ground
    kbold: 1.0,
    tonek: 0.68,
    sat: 0.82, // was 0.62 — keep real (muted) COLOUR, not greyed-out
    deepen: 0.84, // was 0.95 — restore some contrast so it isn't flat/milky
    lift: 0.02, // was 0.05 — barely a milky floor
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
    tonek: 0.55,
    sat: 1.2,
    deepen: 0.68,
    lift: 0.0,
    tintR: 0.5,
    tintG: 0.5,
    tintB: 0.5,
    tintAmt: 0.0,
  };
  P["Alchemy V7: Random (Pastel)"] = buildV7(makeComp(PROFILE_PASTEL));
  P["Alchemy V7: Random (Vivid)"] = buildV7(makeComp(PROFILE_VIVID));
  // back-compat: the old single name still resolves (→ Vivid, the look the user already liked).
  P["Alchemy V7: Random"] = P["Alchemy V7: Random (Vivid)"];
})();
