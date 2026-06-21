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
  var COMP_V7 =
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
    "  if (m > 1.5) {\n" +
    "    float pa = atan(c.y, c.x);\n" +
    "    float spokes = pow(0.5 + 0.5 * cos(pa * 40.0 + time * 0.1), 7.0);\n" +
    "    float depth = smoothstep(1.25, 0.05, prad);\n" +
    "    ground = ground * 0.45 + pal(hb + 0.12) * spokes * depth * 0.55;\n" +
    "  }\n" +
    // ── KALEIDOSCOPE regime (m==1): BOLD saturated diamonds (the reference's vivid red↔green). ──
    "  if (m > 0.5 && m < 1.5) {\n" +
    "    vec3 kcol = pal(hb + 0.4 * suv.x + 0.18 * suv.y);\n" +
    "    kcol = kcol * kcol * 1.5;\n" + // contrast → BOLD vivid diamonds (the reference's punchy red/green), not pastel
    "    ground = mix(ground * 0.22, kcol, 0.82);\n" +
    "  }\n" +
    "  ground *= mix(0.55, 1.06, smoothstep(1.45, 0.1, prad));\n" + // depth vignette
    // ── COMPOSITE: vivid trails + glow halo POP on the dark ground (value separation = depth). ──
    "  vec3 col = ground + trail * 1.28 + glow * 0.6;\n" +
    "  col *= q31;\n" + // exposure (smoothed beat lift)
    // ── tone-map + MEASURED resaturate. Reinhard compresses highlights to colour not white; then a
    //    luminance-preserving resaturate toward the measured ~0.45 + a darks-deepen so the dark ground
    //    stays near-black and saturated trails pop. Never lift highlights to neon-white. ──
    "  vec3 toned = col / (col + vec3(0.55));\n" +
    "  float tl = dot(toned, vec3(0.299, 0.587, 0.114));\n" +
    "  toned = mix(vec3(tl), toned, 1.2);\n" +
    "  toned = mix(toned * toned, toned, 0.68);\n" +
    "  ret = clamp(toned, 0.0, 1.0);\n" +
    "}\n";

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
        var bri = 0.85 + 0.55 * be; // fill brightness pulses with the beat
        s.x = cx;
        s.y = cy;
        s.rad = (s.q7 || 0.06) * (1 + 0.4 * be); // radius pulses with the beat
        s.r = Math.min(1, fr * bri);
        s.g = Math.min(1, fg * bri);
        s.b = Math.min(1, fb * bri);
        s.a = 0.96 * vis;
        s.r2 = fr * 0.85;
        s.g2 = fg * 0.85;
        s.b2 = fb * 0.85;
        s.a2 = 0.3 * vis;
        s.border_r = br * 0.34;
        s.border_g = bg * 0.34;
        s.border_b = bb * 0.34;
        s.border_a = 0.95 * vis; // contrast-hue rim — gets prominent on the beat (radius+brightness)
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
  var fAnem = alcAnemone(10, ALC_PAL.roseGreen).point_eqs; // soft 10-arm flower (hollow centre)
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
  // ROSE — the central FLOWER as a smooth continuous curve (intersecting petals). r=cos(k·θ); bass breathes.
  function fRose(a) {
    var s = a.sample || 0;
    var cx = a.q2 !== undefined ? a.q2 : 0.5,
      cy = a.q3 !== undefined ? a.q3 : 0.5;
    var k = 5.0;
    var th = s * 6.2832 + (a.q9 || 0);
    var r = (a.q5 || 0.4) * (0.9 + 0.18 * (a.q10 || 0)) * Math.cos(k * th);
    a.x = cx + r * Math.cos(th);
    a.y = cy + r * Math.sin(th);
    var h = (a.q8 || 0) + Math.abs(r) * 0.35;
    a.r = orbCol(h, 0);
    a.g = orbCol(h, 0.33);
    a.b = orbCol(h, 0.67);
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
  // ROTLINE — N live-waveform diameter lines sharing one fast rotation (q9), smeared by feedback into a
  // swept fan/tunnel (the rotating-lines / radial-tunnel scenes).
  function fRotLine(a) {
    var N = 3,
      fk = (a.sample || 0) * N,
      seg = Math.floor(fk),
      u = fk - seg,
      s = u * 2 - 1;
    var th = (a.q9 || 0) * 4.0;
    var len = (a.q5 || 0.4) * 1.05,
      disp = (a.value1 || 0) * (a.q6 || 0.05) * 1.8;
    var off = disp + (seg - 1) * 0.0012;
    var cx = a.q2 !== undefined ? a.q2 : 0.5,
      cy = a.q3 !== undefined ? a.q3 : 0.5;
    a.x = cx + s * len * Math.cos(th) - off * Math.sin(th);
    a.y = cy + s * len * Math.sin(th) + off * Math.cos(th);
    var h = a.q8 || 0;
    a.r = orbCol(h, 0);
    a.g = orbCol(h, 0.33);
    a.b = orbCol(h, 0.67);
    if (u < 0.02) a.a = 0;
    return a;
  }
  var MODES = [fAnem, fStarNet, fRose, fUrchin, fCrossX, fRotLine];
  // ADDITIVE dense modes (anemone/urchin/rotline) pile up → lower alpha; crisp outline modes keep more.
  var MODE_ALPHA = [0.5, 0.72, 0.78, 0.54, 0.7, 0.66];
  function scaleFor(m) {
    return m === 0 ? 0.36 : m === 3 ? 0.4 : m === 2 ? 0.32 : 0.4;
  }
  function centralDraw(a) {
    var m = Math.floor((a.q30 || 0) + 0.5);
    if (m < 0) m = 0;
    if (m >= MODES.length) m = MODES.length - 1;
    MODES[m](a);
    // PULSAR oblate squash — the anemone/urchin read as a tilted 3D eye, not a flat face-on circle.
    if ((m === 0 || m === 3) && (a.q12 || 1) < 1.5) {
      var cyS = a.q3 !== undefined ? a.q3 : 0.5;
      a.y = cyS + (a.y - cyS) * (1.0 - 0.34 * (a.q11 || 0));
    }
    a.a = (a.a === undefined ? 0.85 : a.a) * (a.q4 || 0) * MODE_ALPHA[m];
    return a;
  }
  var fTether = alcTether("q21", "q22", "q23", "q24", "q26", ALC_PAL.warm).point_eqs;

  // ── director state (closure → persists; ONE preset, never reloaded) ──
  var lastT = 0,
    huePhase = 0,
    hueStep = 0,
    lastBgMode = -1,
    pulse = 0, // SMOOTHED beat envelope (fast attack / slow release) — breathes, never strobes
    panMag = 0,
    spinAmt = 0, // mode 5 (rotline) → fast constant spin
    focusAmt = 0; // modes 0/3/5 → COMP pupil + anemone squash
  var beat = alcBeatFlash({ rise: 1.22 });
  // WEIGHTED bags — DOMINANT = dark wavy-fluid ground; kaleidoscope + radial-tunnel are ACCENTS.
  var BG_BAG = [0, 0, 0, 0, 0, 0, 2, 2, 1, 1]; // 0 wavy-fluid · 1 kaleidoscope · 2 radial-tunnel
  var MOTIF_BAG = [0, 0, 0, 1, 1, 1, 2, 2, 4, 5]; // flower/star/rose DOMINANT; cross/rotline rare accents; urchin dropped (it sprayed a frame-filling burst — the rejected spiky look)
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
      ((mCur === 0 || mCur === 3 || mCur === 5 ? 1 : 0) - focusAmt) * Math.min(1, dt * 0.6);
    spinAmt += ((mCur === 5 ? 1 : 0) - spinAmt) * Math.min(1, dt * 0.6);

    // MOTIF contract (read by the point fns). The central motif DRIFTS gently around the frame (not
    // locked at center) so — as the hue clock advances + the feedback diffuses — it PAINTS a flowing,
    // multi-hued WATERCOLOUR trail (the #1 reference signature, 1:29-1:36 / 2:11-2:30), like the
    // original's roaming flower. Small amplitude so it stays the central object.
    t.q2 = 0.5 + 0.12 * Math.sin(time * 0.045) + 0.05 * Math.sin(time * 0.017 + 1.0);
    t.q3 = 0.5 + 0.09 * Math.cos(time * 0.038) + 0.05 * Math.sin(time * 0.021 + 2.0);
    t.q5 = scaleFor(mCur) * (0.82 + 0.3 * (bassA - 1) + 0.2 * pulse); // breathing + smoothed beat pop
    t.q6 = 0.05;
    t.q9 = time * 0.06 * (1 - spinAmt) + time * 0.85 * spinAmt; // slow spin → fast when rotline
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

    // __DEBUG__ self-render hook (PRODUCTION NO-OP — window.__ALC_FORCE is never set live).
    if (typeof window !== "undefined" && window.__ALC_FORCE) {
      var F = window.__ALC_FORCE;
      for (var fk in F) t[fk] = F[fk];
    }
    return t;
  }

  // ── build: WAVE0 central motif · WAVE1 star-net companion lattice (gated) · WAVE2 tether ·
  //    SHAPE0/1 filled orbs · SHAPE2/3 additive glow halos. ──
  var preset = build(BASE, { frame: frame, warp: WARP_V7, comp: COMP_V7 });
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
      a.a = (a.a === undefined ? 0.9 : a.a) * g * beatG;
      return a;
    },
  };
  preset.shapes[0] = orbShape("q21", "q22", 0.0, "q25"); // orb A (near-persistent anchor)
  preset.shapes[1] = orbShape("q23", "q24", 0.35, "q14"); // orb B (comes & goes; different hue)
  preset.shapes[2] = orbGlow("q21", "q22", 0.0, "q25"); // additive glow halo A
  preset.shapes[3] = orbGlow("q23", "q24", 0.35, "q14"); // additive glow halo B

  P["Alchemy V7: Random"] = preset;
})();
