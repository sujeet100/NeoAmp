/* Custom Butterchurn presets that reproduce specific WMP Battery/Ambience
 * visualizations. These are hand-authored preset objects in Butterchurn's
 * "converted" format (equations are JS functions, shaders are GLSL strings).
 * Exposed as window.WMP_PRESETS for viz.js to load by name.
 *
 * Authored from reference: the user's WMP capture video + reference stills.
 * Iterating toward an exact match — tweak the numbers below per feedback.
 */
(function () {
  "use strict";

  var passthrough = function (a) { return a; };

  // Full default baseVals (mirrors Butterchurn's built-in default preset) so no
  // field is ever missing when the renderer reads the preset.
  var BASE = {
    gammaadj: 2, wave_g: 0.5, mv_x: 12, warpscale: 1, brighten: 0, mv_y: 9,
    wave_scale: 1, echo_alpha: 0, additivewave: 0, sx: 1, sy: 1, warp: 0.01,
    red_blue: 0, wave_mode: 0, wave_brighten: 0, wrap: 0, zoomexp: 1, fshader: 0,
    wave_r: 0.5, echo_zoom: 1, wave_smoothing: 0.75, warpanimspeed: 1, wave_dots: 0,
    wave_x: 0.5, wave_y: 0.5, zoom: 1, solarize: 0, modwavealphabyvolume: 0, dx: 0,
    cx: 0.5, dy: 0, darken_center: 0, cy: 0.5, invert: 0, bmotionvectorson: 0,
    rot: 0, modwavealphaend: 0.95, wave_mystery: -0.2, decay: 0.9, wave_a: 1,
    wave_b: 0.5, rating: 5, modwavealphastart: 0.75, darken: 0, echo_orient: 0,
    ib_r: 0.5, ib_g: 0.5, ib_b: 0.5, ib_a: 0, ib_size: 0, ob_r: 0, ob_g: 0,
    ob_b: 0, ob_a: 0, ob_size: 0.01, mv_dx: 0, mv_dy: 0, mv_a: 0, mv_r: 0.5,
    mv_g: 0.5, mv_b: 0.5, mv_l: 0
  };

  var WAVE_BASE = { a: 1, enabled: 0, b: 1, g: 1, scaling: 1, samples: 512, additive: 0, usedots: 0, spectrum: 0, r: 1, smoothing: 0.5, thick: 0, sep: 0 };
  var SHAPE_BASE = { r2: 0, a: 1, enabled: 0, b: 0, tex_ang: 0, thickoutline: 0, g: 0, textured: 0, g2: 1, tex_zoom: 1, additive: 0, border_a: 0.1, border_b: 1, b2: 0, a2: 0, r: 1, border_g: 1, rad: 0.1, x: 0.5, y: 0.5, ang: 0, sides: 4, border_r: 1 };

  function makeWaves() {
    var w = [];
    for (var i = 0; i < 4; i++) w.push({ baseVals: Object.assign({}, WAVE_BASE), init_eqs: passthrough, frame_eqs: passthrough, point_eqs: "" });
    return w;
  }
  function makeShapes() {
    var s = [];
    for (var i = 0; i < 4; i++) s.push({ baseVals: Object.assign({}, SHAPE_BASE), init_eqs: passthrough, frame_eqs: passthrough });
    return s;
  }

  var WARP_DEFAULT = "shader_body {\nret = texture2D(sampler_main, uv).rgb;\nret -= 0.004;\n}\n";
  var COMP_DEFAULT = "shader_body {\nret = texture2D(sampler_main, uv).rgb;\nret *= hue_shader;\n}\n";

  // Maps 0..1 luminance to the Ambience yellow ramp (black -> amber -> yellow ->
  // white-hot). Prepended to Ambience comp shaders as a GLSL helper function.
  var AMBER_RAMP =
    "vec3 amber_ramp(float v){\n" +
    "  v = clamp(v, 0.0, 1.0);\n" +
    "  vec3 c = mix(vec3(0.03,0.02,0.0), vec3(0.70,0.52,0.04), smoothstep(0.0,0.55,v));\n" +
    "  c = mix(c, vec3(0.98,0.92,0.30), smoothstep(0.45,0.85,v));\n" +
    "  c = mix(c, vec3(1.0,0.99,0.85),  smoothstep(0.85,1.0,v));\n" +
    "  return c;\n" +
    "}\n";

  // Shared GLSL helpers reused across the presets below (same definitions Alchemy
  // uses inline). Prepend the constant(s) before a shader_body to make them
  // callable: hash21/vnoise/fbm (noise), pal (rainbow), ctr (contour line).
  var NOISE_GLSL =
    "float hash21(vec2 p){ p = fract(p*vec2(127.1,311.7)); p += dot(p, p+34.5); return fract(p.x*p.y); }\n" +
    "float vnoise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);\n" +
    "  float a=hash21(i), b=hash21(i+vec2(1.0,0.0)), c=hash21(i+vec2(0.0,1.0)), e=hash21(i+vec2(1.0,1.0));\n" +
    "  return mix(mix(a,b,f.x), mix(c,e,f.x), f.y); }\n" +
    "float fbm(vec2 p){ float s=0.0, m=0.5; for(int i=0;i<4;i++){ s+=m*vnoise(p); p=p*2.0+1.3; m*=0.5; } return s; }\n";
  var PAL_GLSL = "vec3 pal(float h){ return 0.5+0.5*cos(6.2832*(h+vec3(0.0,0.33,0.67))); }\n";
  var CTR_GLSL = "float ctr(float v, float w){ return smoothstep(w, 0.0, abs(fract(v)-0.5)); }\n";

  // Alchemy v2 framework: a COMPLEX, dusty/muted fluid background (domain-warped fbm,
  // three low-saturation tones bleeding together — teal/purple/teal-grey), breathing
  // with bass. Fixes the "too black / single flat color" gap without going neon.
  // Needs NOISE_GLSL (fbm) prepended before the shader_body that calls alcFluid().
  var ALC_FLUID_GLSL =
    "vec3 alcFluid(vec2 p, float t, float b){\n" +
    "  vec2 q = vec2(fbm(p*1.7 + vec2(t*0.04, -t*0.03)), fbm(p*1.7 + vec2(5.2,1.3) - t*0.035));\n" +
    "  float n = fbm(p*1.5 + q*1.4 + vec2(-t*0.02, t*0.025));\n" +
    "  float n2 = fbm(p*2.6 - q*1.1 + t*0.015);\n" +
    "  vec3 deep = vec3(0.012, 0.045, 0.055);\n" +   // dark teal
    "  vec3 mids = vec3(0.06, 0.035, 0.11);\n" +     // dusty purple
    "  vec3 hi   = vec3(0.09, 0.15, 0.15);\n" +      // muted teal-grey
    "  vec3 c = mix(deep, mids, clamp(n*1.3, 0.0, 1.0));\n" +
    "  c = mix(c, hi, smoothstep(0.55, 0.95, n2));\n" +
    "  return c * (0.55 + 0.5 * b);\n" +
    "}\n";

  // Maps the feedback-buffer luminance to a tint (cycling colA<->colB when they
  // differ; pass the same color twice to hold a fixed hue) with a soft,
  // bass-pulsing center bloom. colA/colB/speed/boost are GLSL literal strings.
  function tintComp(colA, colB, speed, boost) {
    return "shader_body {\n" +
      "vec3 c = texture2D(sampler_main, uv).rgb;\n" +
      "float lum = dot(c, vec3(0.33));\n" +
      "float h = 0.5 + 0.5*sin(time*(" + speed + "));\n" +
      "vec3 tint = mix(" + colA + ", " + colB + ", h);\n" +
      "ret = tint * lum * (" + boost + ");\n" +
      "float d = distance(uv, vec2(0.5));\n" +
      "ret += tint * exp(-d*d*8.0) * (0.10 + 0.35*bass);\n" +
      "}\n";
  }

  function build(overrides, opts) {
    opts = opts || {};
    return {
      baseVals: Object.assign({}, BASE, overrides),
      init_eqs: opts.init || passthrough,
      frame_eqs: opts.frame || passthrough,
      pixel_eqs: opts.pixel || passthrough,
      waves: makeWaves(),
      shapes: makeShapes(),
      warp: opts.warp || WARP_DEFAULT,
      comp: opts.comp || COMP_DEFAULT
    };
  }

  // A custom wave that draws the audio waveform as a jagged circle, centered on
  // (a[qx], a[qy]) with radius a.q5 — values fed from the main per-frame eqs.
  // Equations are real FUNCTIONS: for a converted preset (function-based main
  // eqs) Butterchurn calls wave.point_eqs directly and never compiles *_str, so
  // point_eqs MUST be a function (an empty string would be skipped at draw time).
  function circleWave(qx, qy) {
    return {
      baseVals: Object.assign({}, WAVE_BASE, {
        enabled: 1, samples: 512, additive: 1, usedots: 0, scaling: 1,
        smoothing: 0.1, a: 1, r: 0.85, g: 0.13, b: 0.95
      }),
      init_eqs: passthrough,
      frame_eqs: passthrough,
      point_eqs: function (a) {
        var ang = a.sample * 6.2832;
        var rad = (a.q5 || 0.15) + 0.05 * a.value1;
        a.x = (a[qx] || 0.5) + rad * Math.cos(ang);
        a.y = (a[qy] || 0.5) + rad * Math.sin(ang);
        return a;
      }
    };
  }

  // A custom wave that draws the actual audio waveform along a straight LINE
  // through center (q2,q3), rotated by angle q1, displaced perpendicular by the
  // waveform sample. With feedback decay the rotating line leaves arc traces.
  // Color cycles via hue q8. This is the same "real waveform geometry" approach
  // that makes Dance of the Freaky Circles' lines look right.
  function waveLine() {
    return {
      baseVals: Object.assign({}, WAVE_BASE, {
        enabled: 1, samples: 512, additive: 1, usedots: 0, scaling: 1,
        smoothing: 0.04, a: 1, r: 0.7, g: 0.5, b: 1.0
      }),
      init_eqs: passthrough,
      frame_eqs: passthrough,
      point_eqs: function (a) {
        var th = a.q1 || 0.0;
        var s = a.sample * 2.0 - 1.0;             // -1..1 along the line
        var ct = Math.cos(th), st = Math.sin(th);
        var cx = a.q2 !== undefined ? a.q2 : 0.5;
        var cy = a.q3 !== undefined ? a.q3 : 0.5;
        a.x = cx + s * 0.55 * ct - a.value1 * 0.26 * st;
        a.y = cy + s * 0.55 * st + a.value1 * 0.26 * ct;
        var h = a.q8 || 0.0;
        a.r = 0.5 + 0.5 * Math.cos(6.2832 * h);
        a.g = 0.5 + 0.5 * Math.cos(6.2832 * (h + 0.33));
        a.b = 0.5 + 0.5 * Math.cos(6.2832 * (h + 0.67));
        return a;
      }
    };
  }

  // A custom wave drawing the real audio waveform as a straight spoke through
  // center at a FIXED angle, displaced perpendicular by the sample. Use several
  // at different angles for stars / webs / windmills. len = half-length (0..~0.6),
  // amp = waveform displacement, [r,g,b] = color.
  function spokeLine(angle, len, amp, r, g, b) {
    var ct = Math.cos(angle), st = Math.sin(angle);
    return {
      baseVals: Object.assign({}, WAVE_BASE, {
        enabled: 1, samples: 512, additive: 1, usedots: 0, scaling: 1,
        smoothing: 0.04, a: 1, r: r, g: g, b: b
      }),
      init_eqs: passthrough,
      frame_eqs: passthrough,
      point_eqs: function (a) {
        var s = a.sample * 2.0 - 1.0;              // -1..1 along the spoke
        a.x = 0.5 + s * len * ct - a.value1 * amp * st;
        a.y = 0.5 + s * len * st + a.value1 * amp * ct;
        return a;
      }
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ALCHEMY KIT — composable vocabulary for Alchemy v2 scenes.
  //
  // A scene = a CAMERA (the feedback transform — where the trace recedes to) + one
  // or more MOTIFS (2D shapes redrawn each frame whose feedback TRAIL builds the
  // structure) + color/tuning. The SAME motif reads as a face-on mandala under the
  // "top" camera or a receding corridor net under the "side" camera — only the
  // camera changes. This is the WMP Alchemy mechanism (frame feedback, foundation
  // #1 in docs/alchemy-v2); see memory wireframe-net-is-crossing-helices.
  //
  // Motif convention — scenes drive motifs through shared q-vars set in frame_eqs:
  //   q2,q3 = head position (where the motif is drawn) | q5 = star radius
  //   q6 = waveform edge jaggedness | q7 = orb radius | q8 = hue phase | q9 = self-spin
  // ═══════════════════════════════════════════════════════════════════════════

  // Glow from ADDITIVE overdraw + soft bloom (NOT motion smear), tone-mapped
  // (Reinhard) so colors stay muted and never blow to white. Shared by Alchemy scenes.
  var ALC_COMP =
    "shader_body {\n" +
    "vec3 g = texture2D(sampler_main, uv).rgb;\n" +
    "vec3 bloom = (texture2D(sampler_blur1, uv).rgb + texture2D(sampler_blur2, uv).rgb) * 0.5;\n" +
    "vec3 outc = g + bloom * 0.20;\n" +
    "ret = outc / (outc + vec3(0.85));\n" +
    "}\n";

  // MANDALA backdrop: flat muted-blue + the crisp wireframe additively on top + soft bloom,
  // tone-mapped so it stays muted (the 2D star-polygon mandala scene, ref 1:14–1:28).
  var ALC_FLATBLUE_COMP =
    "shader_body {\n" +
    "vec3 g = texture2D(sampler_main, uv).rgb;\n" +
    "vec3 bloom = (texture2D(sampler_blur1, uv).rgb + texture2D(sampler_blur2, uv).rgb) * 0.5;\n" +
    "vec3 bg = vec3(0.10, 0.22, 0.38);\n" +              // flat muted blue (the mandala backdrop)
    "vec3 outc = bg + g + bloom * 0.15;\n" +
    "ret = outc / (outc + vec3(0.85));\n" +              // Reinhard -> muted, no white-out
    "}\n";

  // CRISP feedback: clear the buffer every frame. In THIS build the `decay` base-val has NO
  // effect — feedback is the WARP shader, and the default (`ret -= 0.004`) keeps the trail
  // nearly forever (the receding-diamond field). Returning black = motifs are redrawn fresh
  // each frame; glow still comes from the comp bloom. (learning #1: feedback is for glow, NOT
  // structure — the mandala lattice must be drawn explicitly.)
  var ALC_CLEAR_WARP = "shader_body {\nret = vec3(0.0);\n}\n";

  // CAMERA: the feedback baseVals for a named viewpoint. Spread into build()'s
  // overrides. The camera is literally "where does the previous frame shrink toward":
  //   top  = toward center  -> face-on spinning mandala (the trace stays centered)
  //   side = toward a right-edge VP -> the motif (drawn left) recedes into a corridor
  //   orbit= toward center + a steady spin -> swirling galaxy
  function alcCamera(kind) {
    // "side": SINGLE-SIDED corridor — NO sx/sy stretch (that is symmetric about center and
    // always tapers both ends). Instead isotropic zoom<1 toward a VP near the RIGHT EDGE
    // (cx≈0.92): the trace RECEDES left→right into that one point. Source is drawn on the LEFT
    // (big near-end), so the corridor opens at the left and converges at the right. One VP only.
    // Corridor: the EXPLICIT orb row carries depth/motion (it marches via q14), so the feedback
    // does NOT need zoom>1 (that runs away to a white-out). zoom=1 + LOW decay (0.6) = crisp
    // short trails only; a tiny leftward dx adds gentle drift. VP for the explicit orbs is the
    // right edge (handled in alcOrbRow), so the corridor reads left->right.
    // Corridor: feedback recedes the NET toward the SAME off-center VP the explicit orbs use
    // (cx 0.86 / cy 0.62, down-right), so net + orbs share one corridor. Moderate decay -> the
    // net gets its trace and the (explicit, redrawn) shape orbs get a slight glow-trail, not a tube.
    if (kind === "side")  return { wave_a: 0, gammaadj: 1.2, decay: 0.42, zoom: 0.95, sx: 1.0, sy: 1.0, cx: 0.86, cy: 0.62, dx: 0.0, rot: 0.0, warp: 0.0, wrap: 0, darken_center: 0, echo_alpha: 0 };
    if (kind === "orbit") return { wave_a: 0, gammaadj: 1.5, decay: 0.93, zoom: 0.972, cx: 0.50, cy: 0.50, rot: 0.06, warp: 0.0, wrap: 0, darken_center: 0, echo_alpha: 0 };
    // "flat": NEAR-ZERO feedback (decay 0.88, zoom 0.998) -> the motif is redrawn crisp each
    // frame with only a faint glow trail, NOT smeared into rings. Right for pulsing centered
    // motifs (anemone, mandala) where the reference is sharp fur, not echoey concentric ghosts.
    if (kind === "flat")  return { wave_a: 0, gammaadj: 1.3, decay: 0.88, zoom: 0.998, cx: 0.50, cy: 0.50, rot: 0.0, warp: 0.0, wrap: 0, darken_center: 0.04, echo_alpha: 0 };
    /* top */             return { wave_a: 0, gammaadj: 1.5, decay: 0.93, zoom: 0.955, cx: 0.50, cy: 0.50, rot: 0.0, warp: 0.0, wrap: 0, darken_center: 0, echo_alpha: 0 };
  }

  // Muted teal/green family for the net lines (hue h cycles slowly). `warm` (0..1)
  // pulls it toward amber/gold (used for orbs). Kept low-saturation per the Alchemy rule.
  function alcSetColor(a, h, warm, gain) {
    var rr = 0.5 + 0.5 * Math.cos(6.2832 * (h + 0.50 - 0.30 * warm));
    var gg = 0.5 + 0.5 * Math.cos(6.2832 * (h + 0.40 - 0.10 * warm));
    var bb = 0.5 + 0.5 * Math.cos(6.2832 * (h + 0.30 + 0.10 * warm));
    var l = (rr + gg + bb) / 3, sat = 0.78;            // saturated -> colored fills (orbs) + multi-color traces
    a.r = (rr * sat + l * (1 - sat)) * gain;
    a.g = (gg * sat + l * (1 - sat)) * gain * (1 - 0.1 * warm);
    a.b = (bb * sat + l * (1 - sat)) * gain * (1 - 0.3 * warm);
  }

  // ── KIT COLORS ───────────────────────────────────────────────────────────────
  // A PALETTE is a function colorize(a, idx) that sets a.r/g/b for element `idx` (triangle /
  // spike number), using a.q8 as the slow hue-drift phase. Scenes PICK a palette and pass it to
  // a motif, so color is composed at scene-assembly time — NOT hardcoded in the motif. This is
  // what makes "single colour vs two colours" a scene CONFIG rather than a motif rewrite.
  // alcPalette(spec):
  //   base  — base hue (0..1)        step  — per-element hue offset:
  //   sat   — saturation (muted <1)            0 = MONO (single colour), 0.5 = DUO (two tones),
  //   gain  — brightness                       ~0.04 = multicolour SPREAD
  //   cycle — if 0, q8 won't drift the hue (a fixed colour); default 1 (slow cycle)
  function alcPalette(spec) {
    spec = spec || {};
    var base = spec.base || 0;
    var step = spec.step === undefined ? 0.5 : spec.step;
    var sat = spec.sat === undefined ? 0.78 : spec.sat;
    var gain = spec.gain === undefined ? 0.9 : spec.gain;
    var cycle = spec.cycle === undefined ? 1 : spec.cycle;
    return function (a, idx) {
      var h = base + (cycle ? (a.q8 || 0) : 0) + (idx || 0) * step;
      var rr = 0.5 + 0.5 * Math.cos(6.2832 * h);
      var gg = 0.5 + 0.5 * Math.cos(6.2832 * (h + 0.33));
      var bb = 0.5 + 0.5 * Math.cos(6.2832 * (h + 0.67));
      var l = (rr + gg + bb) / 3;
      a.r = (rr * sat + l * (1 - sat)) * gain;
      a.g = (gg * sat + l * (1 - sat)) * gain;
      a.b = (bb * sat + l * (1 - sat)) * gain;
    };
  }
  // Named palettes scenes can grab directly off the kit (or build their own with alcPalette).
  var ALC_PAL = {
    twoTone:   alcPalette({ step: 0.5 }),                       // two complementary muted tones
    mono:      alcPalette({ step: 0.0, sat: 0.72 }),            // single drifting hue
    spread:    alcPalette({ step: 0.04, sat: 0.82, gain: 1.0 }),// multicolour spread
    roseGreen: alcPalette({ step: 0.5, base: 0.28 }),           // green ↔ magenta (the canonical anemone)
    redCyan:   alcPalette({ step: 0.5, base: 0.00 })            // red ↔ cyan (the dahlia)
  };

  // MOTIF — one triangle whose 3 edges are the LIVE waveform displaced PERPENDICULAR
  // (the jagged wireframe line). Drawn at head (q2,q3), radius q5, self-rotated by q9.
  // Use one for a single-triangle scene, or two at 60deg apart for the hexagram star.
  // (Kept one-triangle-per-wave: packing both in one wave draws a connector chord.)
  function alcTriangle(rotOffset, hueOff) {
    return {
      baseVals: Object.assign({}, WAVE_BASE, {
        enabled: 1, samples: 512, additive: 1, usedots: 0, scaling: 1,
        smoothing: 0.1, a: 1.0, thick: 1                 // thick=1 + brighter -> the net lines read clearly
      }),
      init_eqs: passthrough, frame_eqs: passthrough,
      point_eqs: function (a) {
        var hx = (a.q2 !== undefined ? a.q2 : 0.5), hy = (a.q3 !== undefined ? a.q3 : 0.5);
        var sz = (a.q5 || 0.26), amp = (a.q6 || 0.05), spin = (a.q9 || 0);
        var s = a.sample * 3.0;
        var e = Math.floor(s); if (e >= 3) e = 2;
        var f = s - e;
        var a0 = rotOffset + spin + e * 2.0944;
        var a1 = rotOffset + spin + (e + 1) * 2.0944;
        var x0 = Math.cos(a0), y0 = Math.sin(a0), x1 = Math.cos(a1), y1 = Math.sin(a1);
        var vx = x0 + (x1 - x0) * f, vy = y0 + (y1 - y0) * f;
        var ex = x1 - x0, ey = y1 - y0, el = Math.hypot(ex, ey) || 1;
        var nx = -ey / el, ny = ex / el;
        var disp = (a.value1 || 0) * amp;
        a.x = hx + sz * vx + nx * disp;
        a.y = hy + sz * vy + ny * disp;
        alcSetColor(a, (a.q8 || 0) + hueOff, 0, 1.5);
        return a;
      }
    };
  }

  // MOTIF — a star of `tris` overlapping triangles (1 = triangle, 2 = Star of David).
  // Returns an ARRAY of waves; spread into preset.waves.
  function alcStarWaves(tris, hueOff) {
    var arr = [];
    for (var i = 0; i < tris; i++) arr.push(alcTriangle(i * 2.0944 / tris, hueOff + i * 0.40));  // distinct hue per triangle -> multi-color net
    return arr;
  }

  // MOTIF — N-gon: ONE configurable closed polygon drawn as a waveform wave. Generalizes
  // alcTriangle (which is a hardcoded 3-gon). Builds the nested star-polygon MANDALA (ref
  // 1:14–1:28) by stacking instances with different `sides` + counter-rotation. See
  // docs/alchemy-v2/ngon-spec.md.
  //   opts.sides       N (3..16). 3=triangle, 4=diamond, 8=octagon.
  //   opts.radius      instance base radius fraction (multiplied by the global breathing scale q5).
  //   opts.innerRatio  inner/outer radius ratio. >=1 (default) => regular polygon (N verts);
  //                    <1 => N-POINT STAR (2N verts alternating outer/inner; ~0.6 is spiky).
  //   opts.aspectX     horizontal stretch of the bounding box (1=circular, ~1.7=ref ellipse).
  //                    The stretch is what makes the two bright "eye" nodes EMERGE at the L/R
  //                    extremities (low-slope chords pile up additively) — they are not drawn.
  //   opts.rotate      static phase offset (rad).
  //   opts.dir         counter-rotation direction (+1/-1); spin = q9*dir + rotate.
  //   opts.hueOff      hue offset added to the cycling q8.
  // Driven by shared q-vars: q2,q3 center | q5 global breathing scale | q6 edge jaggedness
  // (live waveform) | q8 hue phase | q9 spin base.
  // Shared vertex math: place point `a` on STAR-POLYGON {N/skip} `poly` at parameter `local`
  // (0..1 around the closed polyline), stretched by `aspectX`, jittered perpendicular by the
  // live waveform. The polyline connects every `skip`-th of N vertices on a circle — skip=1 is a
  // convex polygon (the outer envelope), skip>=2 makes long chords that span ACROSS the interior
  // and cross through the center (the spirograph knot + the central density of the reference
  // mandala). Pick skip coprime to N for one continuous path. Reads q2,q3 (center), q5 (breathing
  // scale), q6 (jitter amp), q9 (spin base). Used by alcNgon and alcNgonPacked.
  function ngonPoint(a, poly, local, aspectX) {
    var N = poly.sides || 4;
    var skip = poly.skip || 1;
    var scale = (a.q5 !== undefined ? a.q5 : 1.0);
    var amp = (a.q6 || 0.0);
    var spin = (a.q9 || 0) * (poly.dir === undefined ? 1 : poly.dir) + (poly.rotate || 0);
    var R = (poly.radius === undefined ? 0.30 : poly.radius) * scale;
    var s = local * N;                                    // 0..N across the N chords of the {N/skip} path
    var e = Math.floor(s), f = s - e;
    var i0 = (e * skip) % N, i1 = ((e + 1) * skip) % N;   // connect every skip-th vertex
    var ang0 = spin + i0 / N * 6.2832, ang1 = spin + i1 / N * 6.2832;
    var x0 = Math.cos(ang0) * R, y0 = Math.sin(ang0) * R;
    var x1 = Math.cos(ang1) * R, y1 = Math.sin(ang1) * R;
    var vx = x0 + (x1 - x0) * f, vy = y0 + (y1 - y0) * f;
    var ex = x1 - x0, ey = y1 - y0, el = Math.hypot(ex, ey) || 1;
    var nx = -ey / el, ny = ex / el;                      // perpendicular -> jagged waveform edges
    var disp = (a.value1 || 0) * amp;
    var cx = (a.q2 !== undefined ? a.q2 : 0.5), cy = (a.q3 !== undefined ? a.q3 : 0.5);
    a.x = cx + (vx + nx * disp) * aspectX;                // aspectX stretches X only -> ellipse
    a.y = cy + (vy + ny * disp);
  }

  function alcNgon(opts) {
    opts = opts || {};
    var aspectX = opts.aspectX === undefined ? 1.0 : opts.aspectX;
    var hueOff = opts.hueOff || 0;
    return {
      baseVals: Object.assign({}, WAVE_BASE, {
        enabled: 1, samples: 512, additive: 1, usedots: 0, scaling: 1,
        smoothing: 0.1, a: 1.0, thick: 1
      }),
      init_eqs: passthrough, frame_eqs: passthrough,
      point_eqs: function (a) {
        ngonPoint(a, opts, a.sample, aspectX);
        alcSetColor(a, (a.q8 || 0) + hueOff, 0, 1.3);
        return a;
      }
    };
  }

  // ONE wave that packs K polygons by slicing a.sample into K segments (the same trick
  // alcTriangle uses to pack 3 edges into one wave). Lets the mandala have 10–12 polygons
  // while staying within the ~6-wave cap (memory butterchurn-custom-wave-cap). The straight
  // connector chord between packed polygons (and each polygon's closing edge) is BLANKED by
  // setting a.a = 0 for the ~2 samples at each segment boundary, so no stray bridge is drawn.
  function alcNgonPacked(polys, aspectX) {
    var K = polys.length;
    var seam = 2.0 * K / 512;                             // ~2 samples (in per-polygon local units)
    return {
      baseVals: Object.assign({}, WAVE_BASE, {
        enabled: 1, samples: 512, additive: 1, usedots: 0, scaling: 1,
        smoothing: 0.1, a: 1.0, thick: 1
      }),
      init_eqs: passthrough, frame_eqs: passthrough,
      point_eqs: function (a) {
        var gi = a.sample * K;
        var pi = Math.floor(gi); if (pi >= K) pi = K - 1;
        var local = gi - pi;
        var poly = polys[pi];
        ngonPoint(a, poly, local, aspectX);
        alcSetColor(a, (a.q8 || 0) + (poly.hueOff || 0), 0, 1.3);
        // EYE-NODE boost: chords crossing the L/R horizontal extremes (y≈center, |x| large) pile
        // up there — brighten them so the two focal "eyes" glow (tone-map keeps it from blowing out).
        var ny = 1 - Math.min(Math.abs(a.y - 0.5) / 0.10, 1);
        var nx = Math.min(Math.max((Math.abs(a.x - 0.5) - 0.18) / 0.22, 0), 1);
        var eye = 1 + 1.3 * ny * nx;
        // DENSITY TIER: tier-0 polygons (envelopes) always show; higher tiers fade in as the
        // energy gate q11 rises -> the lattice densifies on loud/structural passages.
        var tier = poly.tier || 0;
        var vis = tier === 0 ? 1 : sm01(((a.q11 === undefined ? 1 : a.q11) - (tier * 0.4 - 0.15)) / 0.30);
        var k = eye * vis;
        a.r *= k; a.g *= k; a.b *= k;
        a.a = (local < seam || local > 1.0 - seam) ? 0 : vis;  // blank seams -> no bridge chord
        return a;
      }
    };
  }

  // MOTIF — the nested star-polygon MANDALA: a stack of N-gons with different `sides`, radii and
  // counter-rotation, sharing one horizontal-ellipse envelope (aspectX). The overlapping
  // low-slope chords at the L/R extremities pile up additively into the two bright "eye" nodes
  // (emergent, not drawn). `dir` is a signed SPEED multiplier so layers counter-rotate at
  // slightly different rates (the spirograph breathing). 12 polygons packed `perWave` to a wave.
  // EVEN-N polygons sit rotate:0 so their angle-0/π vertices pile up at the L/R extremes
  // (0.5 ± radius·aspectX, 0.5) → the bright "eye" nodes emerge there. ODD-N star-polygons keep
  // small rotate offsets for spirograph variety (they have no clean L/R vertex pair anyway).
  // tier: 0 = always on (outer envelopes + one anchor star), 1 = fades in at moderate energy,
  // 2 = only on loud/structural passages -> the lattice densifies with the music (N-jump feel).
  var ALC_MANDALA_SPECS = [
    { sides: 10, skip: 1, radius: 0.34, dir:  1.0, rotate: 0.00, hueOff: 0.00, tier: 0 }, // decagon — outer envelope
    { sides: 8,  skip: 1, radius: 0.32, dir: -0.8, rotate: 0.00, hueOff: 0.12, tier: 0 }, // octagon — envelope
    { sides: 12, skip: 5, radius: 0.34, dir:  1.2, rotate: 0.00, hueOff: 0.24, tier: 0 }, // {12/5} — anchor crossing star
    { sides: 7,  skip: 3, radius: 0.33, dir: -0.6, rotate: 0.30, hueOff: 0.40, tier: 1 }, // {7/3} — heptagram
    { sides: 9,  skip: 4, radius: 0.34, dir:  0.9, rotate: 0.17, hueOff: 0.55, tier: 1 }, // {9/4} — near-diameter chords
    { sides: 5,  skip: 2, radius: 0.32, dir: -1.1, rotate: 0.15, hueOff: 0.70, tier: 1 }, // {5/2} — pentagram
    { sides: 8,  skip: 3, radius: 0.33, dir:  0.7, rotate: 0.00, hueOff: 0.05, tier: 1 }, // {8/3} — octagram
    { sides: 9,  skip: 2, radius: 0.34, dir: -1.0, rotate: 0.12, hueOff: 0.46, tier: 2 }, // {9/2} — enneagram
    { sides: 10, skip: 3, radius: 0.33, dir:  1.1, rotate: 0.00, hueOff: 0.62, tier: 2 }, // {10/3} — decagram
    { sides: 6,  skip: 1, radius: 0.35, dir: -0.5, rotate: 0.00, hueOff: 0.30, tier: 0 }, // hexagon — envelope
    { sides: 16, skip: 7, radius: 0.32, dir:  0.8, rotate: 0.00, hueOff: 0.78, tier: 2 }, // {16/7} — dense rim star
    { sides: 12, skip: 5, radius: 0.35, dir: -0.9, rotate: 0.00, hueOff: 0.18, tier: 2 }  // {12/5} — rotated overlay
  ];
  function alcNgonStack(aspectX, specs, perWave) {
    specs = specs || ALC_MANDALA_SPECS;
    perWave = perWave || 2;                               // 12 specs / 2 = 6 packed waves (at the cap)
    var waves = [];
    for (var i = 0; i < specs.length; i += perWave) {
      waves.push(alcNgonPacked(specs.slice(i, i + perWave), aspectX));
    }
    return waves;
  }

  // MOTIF — the persistent DIAGONAL waveform line: a real oscilloscope line locked at a fixed
  // angle, displaced perpendicular by the live waveform (the jagged "lightning" slice that
  // recurs in the mandala (section_E) and the moiré "X" (section_F)). Its OWN motif so scenes
  // compose it (one for the mandala, a crossing pair for the moiré). Opacity reads q10 so a
  // scene can fade it INVERSELY to the mandala density — bright when the net collapses, subtle
  // when the net is dense (per the reference: something always carries the rhythm).
  //   angleRad — line tilt (e.g. 0.30 ≈ 17° off horizontal, bottom-left→top-right)
  //   halfLen  — half length along the line (0.6 spans most of the frame)
  //   amp      — perpendicular waveform displacement (jaggedness)
  //   [r,g,b]  — base color (default pink-white)
  function alcDiagonalLine(angleRad, halfLen, amp, r, g, b) {
    var ct = Math.cos(angleRad), st = Math.sin(angleRad);
    r = r === undefined ? 1.0 : r; g = g === undefined ? 0.72 : g; b = b === undefined ? 0.88 : b;
    return {
      baseVals: Object.assign({}, WAVE_BASE, {
        enabled: 1, samples: 512, additive: 1, usedots: 0, scaling: 1,
        smoothing: 0.03, a: 1.0, thick: 1
      }),
      init_eqs: passthrough, frame_eqs: passthrough,
      point_eqs: function (a) {
        var s = a.sample * 2.0 - 1.0;                     // -1..1 along the line
        var disp = (a.value1 || 0) * amp;                 // perpendicular waveform -> jagged slice
        a.x = 0.5 + s * halfLen * ct - disp * st;
        a.y = 0.5 + s * halfLen * st + disp * ct;
        var la = (a.q10 === undefined ? 1.0 : a.q10);     // opacity (scene drives inverse to net density)
        a.r = r * la; a.g = g * la; a.b = b * la; a.a = la;
        return a;
      }
    };
  }

  // DRIVER — shared per-frame audio-routing for the Mandala (the scene's "behavior" layer, like
  // alcNetFrame). Tracks a smoothed energy envelope and emits the q-vars the motifs read:
  //   q2,q3 center | q5 breathing scale (COLLAPSES toward ~0 on quiet bars -> the dropout, leaving
  //   only the diagonal) | q6 edge jaggedness | q8 hue drift | q9 spin | q10 diagonal opacity
  //   (bright when the net collapses) | q11 density gate (rises with energy -> higher polygon tiers
  //   fade in, the N-jump densification).
  function alcMandalaFrame() {
    var lastT = 0, egyS = 1.0, q11s = 0.4;
    return function (t) {
      var bass = t.bass_att || t.bass || 1, mid = t.mid_att || t.mid || 1, treb = t.treb_att || t.treb || 1;
      var tm = t.time, dt = Math.min(0.1, Math.max(0, tm - lastT)); lastT = tm;
      var egy = 0.6 * bass + 0.4 * mid;                  // overall energy (~0 silent, ~1 baseline, ~1.6 loud)
      egyS += (egy - egyS) * 0.15;                       // smooth so the collapse/bloom isn't jittery
      var lvl = Math.max(0, Math.min((egyS - 0.5) / 1.0, 1));   // 0..1 -> breathing scale
      var q11 = Math.max(0, Math.min((egyS - 0.6) / 0.9, 1));   // 0..1 -> density gate
      q11s += (q11 - q11s) * 0.08;
      t.q2 = 0.5; t.q3 = 0.5;
      t.q5 = 0.06 + 0.62 * lvl;                          // COLLAPSE to ~0.06 when quiet, bloom to ~0.68 loud
      t.q6 = 0.02 + 0.04 * Math.min(treb, 1.2);          // jagged edge displacement (live waveform)
      t.q8 = (tm * 0.04) % 1;                            // slow hue drift
      t.q9 = tm * 0.5;                                   // slow base spin (rad); per-layer dir scales/flips
      t.q10 = 0.5 + 0.5 * (1 - q11s);                    // diagonal opacity: full when net collapsed, half when dense
      t.q11 = q11s;                                      // density tier gate
      return t;
    };
  }

  // KIT — RIBBON warp: each frame, the previous buffer is sampled from a position slightly
  // AHEAD along the ribbon axis (uv + axis*push), so content appears to drift DOWN-LEFT (the
  // reference's "dx/dy push along the ribbon axis"). The waveform line drawn each frame
  // accumulates into a long diagonal streak as older copies pile up drifting away.
  //   angle — ribbon axis direction (rad). push — per-frame offset (0.002..0.005).
  function alcRibbonWarp(angle, push) {
    push = push || 0.003;
    var rc = Math.cos(angle).toFixed(5), rs = Math.sin(angle).toFixed(5);
    return "shader_body {\n" +
      "vec2 puv = uv + vec2(" + rc + ", " + rs + ") * " + push.toFixed(5) + ";\n" +
      "ret = texture2D(sampler_main, puv).rgb * 0.955;\n" +  // 0.955 multiplier = ~0.3s half-life @60fps
      "}\n";
  }

  // KIT — RIBBON comp: dark near-black background + iridescent rainbow tint along the ribbon
  // axis (matching the reference's cyan→green→magenta→gold gradient) + bloom + Reinhard.
  // `angle` must match the warp angle so the tint aligns with the streak direction.
  function alcRibbonComp(angle) {
    var rc = Math.cos(angle).toFixed(5), rs = Math.sin(angle).toFixed(5);
    // Magenta/green duotone palette: offsets (0, 0.42, -0.08) make t=0→MAGENTA, t=0.5→GREEN.
    // Standard (0,0.33,0.67) has no magenta at all — R and B peaks are never simultaneous.
    return "vec3 rib_pal(float t){\n" +
      "return vec3(0.55)+vec3(0.45)*cos(6.2832*(t+vec3(0.0,0.42,-0.08)));\n" +
      "}\n" +
      "shader_body {\n" +
      "vec2 d = uv - 0.5; d.x *= resolution.x / resolution.y;\n" +
      "float ribX = d.x * " + rc + " + d.y * " + rs + ";\n" +
      "vec3 g = texture2D(sampler_main, uv).rgb;\n" +
      "vec3 bloom = (texture2D(sampler_blur1,uv).rgb+texture2D(sampler_blur2,uv).rgb)*0.5;\n" +
      "vec3 rib_tint = rib_pal(ribX * 1.2 + time * 0.05);\n" +    // 1.2 = ~1.5 colors across ribbon; slow drift
      "float rib_lum = dot(g, vec3(0.33));\n" +
      "vec3 rib_col = mix(vec3(rib_lum), rib_tint, 0.70) * max(rib_lum, 0.0);\n" +
      "vec3 bg = vec3(0.02, 0.01, 0.03);\n" +
      "vec3 outc = bg + rib_col * 1.4 + g * 0.5 + bloom * 0.35;\n" +
      "ret = outc / (outc + vec3(0.85));\n" +
      "}\n";
  }

  // MOTIF — one waveform RAY: a straight line of the live waveform through the head
  // (q2,q3) at angle `rayOffset`, self-rotating by q9 (the "waveform lines rotating
  // around the center axis"). Half-length q5, perpendicular displacement q6.
  function alcRay(rayOffset, hueOff, lenScale) {
    lenScale = lenScale || 1.0;
    return {
      baseVals: Object.assign({}, WAVE_BASE, {
        enabled: 1, samples: 512, additive: 1, usedots: 0, scaling: 1,
        smoothing: 0.05, a: 1.0, thick: 1
      }),
      init_eqs: passthrough, frame_eqs: passthrough,
      point_eqs: function (a) {
        var hx = (a.q2 !== undefined ? a.q2 : 0.5), hy = (a.q3 !== undefined ? a.q3 : 0.5);
        var len = (a.q5 || 0.26) * lenScale, amp = (a.q6 || 0.05), spin = (a.q9 || 0);
        var th = rayOffset + spin;
        var ct = Math.cos(th), st = Math.sin(th);
        var s = a.sample * 2.0 - 1.0;                // -1..1 along the ray (through the head)
        var disp = (a.value1 || 0) * amp;
        a.x = hx + s * len * ct - disp * st;
        a.y = hy + s * len * st + disp * ct;
        alcSetColor(a, (a.q8 || 0) + hueOff, 0, 1.5);
        return a;
      }
    };
  }

  // MOTIF — `n` waveform rays evenly spaced around the head, rotating together (an
  // asterisk of live-waveform lines). Returns an ARRAY of waves.
  function alcRayWaves(n, hueOff, lenScale) {
    var arr = [];
    for (var i = 0; i < n; i++) arr.push(alcRay(i * 3.14159 / n, hueOff + i * 0.04, lenScale));
    return arr;
  }

  // MOTIF — an orb: a COLOR-FILLED glow disc with a THICK ring border, drawn at head (q2,q3),
  // radius q7. Under a camera's feedback it leaves the receding trail of shrinking orbs.
  //   fillHueOff   — fill hue offset (added to the cycling q8).
  //   borderHueOff — outline hue offset: undefined => bright cool-WHITE ring; a number =>
  //                  colored ring at (q8 + borderHueOff). Equal to fillHueOff = same color;
  //                  fillHueOff+0.5 = complementary/contrast. (See alcOrb* wrappers below.)
  function alcOrb(hueOff, borderHueOff) {
    return {
      baseVals: Object.assign({}, WAVE_BASE, {
        enabled: 1, samples: 512, additive: 1, usedots: 0, scaling: 1,
        smoothing: 0.0, a: 0.85, thick: 1                       // thick=1 -> fatter, more visible ring
      }),
      init_eqs: passthrough, frame_eqs: passthrough,
      point_eqs: function (a) {
        var hx = (a.q2 !== undefined ? a.q2 : 0.5), hy = (a.q3 !== undefined ? a.q3 : 0.5);
        var rad = (a.q7 || 0.05);
        if (a.sample < 0.55) {                                  // FILL: dense sqrt-spiral -> solid colored disc
          var f = a.sample / 0.55;
          var rf = rad * Math.sqrt(f), af = f * 6.2832 * 14.0;
          a.x = hx + rf * Math.cos(af);
          a.y = hy + rf * Math.sin(af);
          alcSetColor(a, (a.q8 || 0) + hueOff, 0.85, 1.0);      // warm amber/gold FILL
        } else {                                                // BORDER: THICK ring band, DIFFERENT color
          var fb = (a.sample - 0.55) / 0.45;
          var rb = rad * (0.90 + 0.16 * fb);                    // spiral across an annulus 0.90..1.06 r = thick ring
          var ab = fb * 6.2832 * 6.0;
          a.x = hx + rb * Math.cos(ab);
          a.y = hy + rb * Math.sin(ab);
          if (borderHueOff !== undefined) {                     // colored outline (tracks the hue cycle)
            alcSetColor(a, (a.q8 || 0) + borderHueOff, 0.2, 2.2);
          } else {                                              // default: bright cool-white ring
            a.r = 1.3; a.g = 1.55; a.b = 2.0;
          }
        }
        return a;
      }
    };
  }

  // Orb VARIATIONS (pick per scene): white ring, same-color ring, or contrast (complementary).
  function alcOrbWhite(hueOff)    { return alcOrb(hueOff); }                 // colored fill + cool-white ring
  function alcOrbSame(hueOff)     { return alcOrb(hueOff, hueOff); }         // ring same hue as fill (mono glow)
  function alcOrbContrast(hueOff) { return alcOrb(hueOff, hueOff + 0.5); }   // ring complementary hue (e.g. orange fill + blue ring)

  function sm01(x) { x = x < 0 ? 0 : (x > 1 ? 1 : x); return x * x * (3 - 2 * x); }

  // MOTIF — an EXPLICIT ROW of `n` distinct orbs receding into a corridor (Gemini's recipe):
  // each orb sits at a flowing depth z (wrapping with q14 so the row is infinite) and is
  // PERSPECTIVE-PROJECTED to an off-center vanishing point — so orbs bunch + shrink toward the
  // VP exactly like real depth, and span the full corridor on frame 1. Drawn directly (NOT a
  // feedback trail), so each orb is a crisp disc: colored fill + bright ring, fading into the
  // dark at the VP. nearX/nearY = lateral position of the near (camera) end; vpx/vpy = the VP.
  function alcOrbRow(n, fillHueOff, ringHueOff, nearX, nearY, vpx, vpy) {
    nearX = (nearX === undefined ? 0.12 : nearX); nearY = (nearY === undefined ? 0.50 : nearY);
    vpx = (vpx === undefined ? 0.90 : vpx); vpy = (vpy === undefined ? 0.50 : vpy);
    var K = 4.0;                                               // perspective strength (FOV)
    return {
      // NON-additive (additive:0): a SOLID colored disc + bright ring just PAINT their color,
      // they can't accumulate to white no matter how bright -> filled colored orb, no blowout.
      baseVals: Object.assign({}, WAVE_BASE, {
        enabled: 1, samples: 512, additive: 0, usedots: 0, scaling: 1,
        smoothing: 0.0, a: 1.0, thick: 1
      }),
      init_eqs: passthrough, frame_eqs: passthrough,
      point_eqs: function (a) {
        var seg = a.sample * n;
        var k = Math.floor(seg); if (k >= n) k = n - 1;
        var f = seg - k;                                       // 0..1 within this orb
        var raw = (k / n) + (a.q14 || 0);
        raw = raw - Math.floor(raw);                           // flowing depth (wraps -> infinite row)
        var proj = 1.0 / (1.0 + K * raw);
        var jx = (a.value1 || 0) * 0.02;
        var ccx = (nearX + jx - vpx) * proj + vpx;
        var ccy = (nearY - vpy) * proj + vpy;
        var rad = Math.min((a.q7 || 0.1) * proj, 0.08);        // bigger cap -> not too thin
        var fade = (1.0 - raw) * sm01(raw / 0.05);             // bright near, fade into the dark VP
        var rl, ang;
        if (f < 0.62) {                                        // FILL: dense spiral, SOFT gradient core
          var ff = f / 0.62; rl = rad * Math.sqrt(ff); ang = ff * 6.2832 * 16.0;
          a.r = 0.15; a.g = 0.30; a.b = 0.85;                  // deep-blue core (neon-tube look)
          a.a = 0.75 * fade * (1.0 - 0.85 * ff);               // bright center -> transparent edge: blends, no harsh blob
        } else {                                               // BORDER: bright cyan ring
          var fb = (f - 0.62) / 0.38; rl = rad * (0.92 + 0.12 * fb); ang = fb * 6.2832 * 3.0;
          a.r = 0.10; a.g = 1.0; a.b = 1.0;                    // bright cyan edge
          a.a = 0.9 * fade;
        }
        a.x = ccx + rl * Math.cos(ang);
        a.y = ccy + rl * Math.sin(ang);
        return a;
      }
    };
  }

  // MOTIF — an EXPLICIT corridor net: `nRings` concentric wavy rings drawn at flowing depths
  // and PERSPECTIVE-PROJECTED to the right VP (same math as alcOrbRow), redrawn every frame so
  // the mesh is crisp and controllable — NOT a busy feedback smear. The live waveform makes the
  // rings wavy; q9 slowly spins them; q14 flows them toward the VP. Ring-to-ring connectors run
  // radially -> they double as faint longitudinal corridor wires.
  function alcMeshRings(nRings, hueOff) {
    var K = 4.0, vpx = 0.90, vpy = 0.50, nearX = 0.16, nearY = 0.50;
    return {
      baseVals: Object.assign({}, WAVE_BASE, {
        enabled: 1, samples: 512, additive: 1, usedots: 0, scaling: 1,
        smoothing: 0.25, a: 0.6, thick: 0
      }),
      init_eqs: passthrough, frame_eqs: passthrough,
      point_eqs: function (a) {
        var s = a.sample * nRings;
        var k = Math.floor(s); if (k >= nRings) k = nRings - 1;
        var f = s - k;                                         // 0..1 around this ring
        var raw = ((k + 0.5) / nRings) + (a.q14 || 0);
        raw = raw - Math.floor(raw);                           // flowing depth (wraps)
        var proj = 1.0 / (1.0 + K * raw);
        var ccx = (nearX - vpx) * proj + vpx;                  // ring center recedes to the VP
        var ccy = (nearY - vpy) * proj + vpy;
        var th = f * 6.2832 + (a.q9 || 0) * 0.15;              // around the ring (slow spin)
        var jit = (a.value1 || 0) * 0.06;                      // waveform makes the ring wavy
        var R = ((a.q5 || 0.4) + jit) * proj;                  // ring radius shrinks with depth
        a.x = ccx + R * Math.cos(th);
        a.y = ccy + R * Math.sin(th);
        var fade = (1.0 - raw) * sm01(raw / 0.05);             // bright near, fade into the dark VP
        alcSetColor(a, (a.q8 || 0) + hueOff, 0, 1.2 * fade);
        return a;
      }
    };
  }

  // MOTIF — the ANEMONE / STARBURST (README Motif C): a STARBURST of thin triangular SPIKES.
  // Each spike is a thin triangle whose BASE sits on a small inner CIRCLE (the bases tile the
  // circle -> the dark central eye) and whose APEX points OUTWARD, its length set by the LIVE
  // waveform so the rim is spiky/jagged (the urchin fur). The wave traces one continuous
  // zig-zag: base-left -> apex -> base-right -> next base-left ... so the ONLY connectors run
  // along the inner base circle, NEVER between the outer peaks. Each spike a distinct COLOR;
  // NON-additive so colors paint cleanly (no white pile-up). Spins (q9), pulses size on bass
  // (q5), shears to a vortex on peaks (q10). Face-on ("flat" camera). Drawn at (q2,q3).
  //   spikes   — number of tilted copies around the circle (~30). tilt = 2π/spikes; since the
  //              base (24°) is WIDER than the tilt (12° at 30), consecutive triangles OVERLAP.
  //   colorize — a PALETTE picked from the kit (alcPalette / ALC_PAL.*); sets each triangle's
  //              colour by its index. Defaults to the two-tone palette.
  function alcAnemone(spikes, colorize) {
    spikes = spikes || 30;
    colorize = colorize || ALC_PAL.twoTone;
    var baseHalf = 0.21;                                      // FIXED ~12° -> base spans ~24° (independent of count)
    return {
      baseVals: Object.assign({}, WAVE_BASE, {
        enabled: 1, samples: 512, additive: 0, usedots: 0, scaling: 1,
        smoothing: 0.02, a: 0.85, thick: 0
      }),
      init_eqs: passthrough, frame_eqs: passthrough,
      point_eqs: function (a) {
        var hx = (a.q2 !== undefined ? a.q2 : 0.5), hy = (a.q3 !== undefined ? a.q3 : 0.5);
        var R = (a.q5 || 0.42), spin = (a.q9 || 0), twist = (a.q10 || 0), jag = (a.q6 || 0.03);
        var innerR = R * 0.16;                                // base circle radius -> the dark central eye
        var tilt = 6.2832 / spikes;                           // rotation between successive copies (< base -> OVERLAP)
        var seg = a.sample * spikes;
        var k = Math.floor(seg); if (k >= spikes) k = spikes - 1;
        var f = seg - k;                                      // 0..1 across THIS triangle
        var baseAng = k * tilt + spin;
        var aL = baseAng - baseHalf, aR = baseAng + baseHalf;
        var samp = a.value1 || 0;
        var spikeLen = R * (0.45 + 0.55 * Math.abs(samp));    // waveform sets apex length -> spiky rim (acute triangle)
        // CLOSED triangle (3 edges): base-left -> base-right (the base, on the inner circle) ->
        // apex (out) -> back to base-left. The base edges of all spikes draw the inner circle.
        var ang, r, onSide = 0;
        if (f < 0.34) {                                       // BASE edge (along inner circle)
          var u = f / 0.34; ang = aL + (aR - aL) * u; r = innerR;
        } else if (f < 0.67) {                                // base-RIGHT -> APEX
          var u = (f - 0.34) / 0.33; ang = aR + (baseAng - aR) * u; r = innerR + spikeLen * u; onSide = 1;
        } else {                                              // APEX -> base-LEFT (close the triangle)
          var u = (f - 0.67) / 0.33; ang = baseAng + (aL - baseAng) * u; r = innerR + spikeLen * (1 - u); onSide = 1;
        }
        if (onSide) ang += (samp * jag) / Math.max(r, 0.08);  // live waveform makes the slanted EDGES jagged (the "sound wave")
        ang += twist * (r - innerR);                          // vortex shear: outer parts lean more
        a.x = hx + r * Math.cos(ang);
        a.y = hy + r * Math.sin(ang);
        colorize(a, k);                                       // colour comes from the scene's palette (kit), keyed by spike index
        return a;
      }
    };
  }

  // MOTIF (variant) — ANEMONE built the OTHER way: full EQUILATERAL triangles centered on the
  // SAME point (q2,q3) and overlapping, each rotated by a small tilt -> a star-polygon MANDALA
  // with a natural center hole (the edges are chords at the inradius). Edges are jagged by the
  // LIVE waveform (q6). NON-additive colored outlines (no white pile-up). Spins (q9), pulses
  // size on bass (q5), shears on peaks (q10). The "overlap of equilateral triangles at the
  // center" look, distinct from alcAnemone's base-on-a-circle starburst.
  //   count    — number of overlapping triangles (~9).
  //   colorize — a PALETTE picked from the kit (alcPalette / ALC_PAL.*); keyed by triangle index.
  function alcTriMandala(count, colorize) {
    count = count || 9;
    colorize = colorize || ALC_PAL.twoTone;
    return {
      baseVals: Object.assign({}, WAVE_BASE, {
        enabled: 1, samples: 512, additive: 0, usedots: 0, scaling: 1,
        smoothing: 0.05, a: 0.82, thick: 1
      }),
      init_eqs: passthrough, frame_eqs: passthrough,
      point_eqs: function (a) {
        var hx = (a.q2 !== undefined ? a.q2 : 0.5), hy = (a.q3 !== undefined ? a.q3 : 0.5);
        var sz = (a.q5 || 0.40), amp = (a.q6 || 0.04), spin = (a.q9 || 0), twist = (a.q10 || 0);
        var seg = a.sample * count;
        var ti = Math.floor(seg); if (ti >= count) ti = count - 1;
        var f = seg - ti;                                     // 0..1 around THIS triangle
        var rot = spin + ti * 6.2832 / count;                 // each equilateral triangle rotated about the shared center
        // Trace 5 segments: center->c0, c0->c1, c1->c2, c2->c0, c0->center. The two SPOKE
        // segments (center<->c0) are drawn at alpha 0 (invisible) so the connector between
        // triangles is a zero-length center->center hop -> NO chord between outer peaks.
        var sp = 0.05, E = (1 - 2 * sp) / 3;                  // spoke fraction + edge fraction
        var ax, ay, bx, by, u, isEdge = 0;
        function cxj(j) { return Math.cos(rot + j * 2.0944); }
        function cyj(j) { return Math.sin(rot + j * 2.0944); }
        if (f < sp) { u = f / sp; ax = 0; ay = 0; bx = cxj(0); by = cyj(0); }                       // center -> c0 (spoke)
        else if (f < sp + E) { u = (f - sp) / E; ax = cxj(0); ay = cyj(0); bx = cxj(1); by = cyj(1); isEdge = 1; }
        else if (f < sp + 2 * E) { u = (f - sp - E) / E; ax = cxj(1); ay = cyj(1); bx = cxj(2); by = cyj(2); isEdge = 1; }
        else if (f < sp + 3 * E) { u = (f - sp - 2 * E) / E; ax = cxj(2); ay = cyj(2); bx = cxj(0); by = cyj(0); isEdge = 1; }
        else { u = (f - sp - 3 * E) / sp; ax = cxj(0); ay = cyj(0); bx = 0; by = 0; }               // c0 -> center (spoke)
        var vx = ax + (bx - ax) * u, vy = ay + (by - ay) * u;
        var px = sz * vx, py = sz * vy;
        if (isEdge) {                                         // live waveform displaces the edge -> jagged triangle line
          var ex = bx - ax, ey = by - ay, el = Math.hypot(ex, ey) || 1;
          var disp = (a.value1 || 0) * amp;
          px = sz * vx + (-ey / el) * disp; py = sz * vy + (ex / el) * disp;
        }
        var rad = Math.hypot(vx, vy) || 1, sh = twist * (rad - 0.5);
        var cs = Math.cos(sh), sn = Math.sin(sh);
        a.x = hx + px * cs - py * sn;
        a.y = hy + px * sn + py * cs;
        a.a = isEdge ? 0.85 : 0.0;                            // spokes invisible -> connectors hidden
        colorize(a, ti);                                      // colour from the scene's palette (kit), keyed by triangle index
        return a;
      }
    };
  }

  // MOTIF — SPINDLE / radial urchin: 512 samples sweep the full circle (ang = sample*2π); the
  // radius at each sample = eye (dark center floor) + spike * abs(value1) → wherever the live
  // waveform has energy, a bristle/spike protrudes. With additive mode the spiky ring glows;
  // with moderate feedback (default warp, not ALC_CLEAR_WARP) the spikes leave a soft glow trail.
  // This is the RING URCHIN geometry (circlewave-based), distinct from alcAnemone's triangle starburst.
  // Reference: section_C3 "fine radial filaments" pulsar; r = eye + spike * abs(value1).
  //   colorize — an ALC_PAL palette function, keyed by spike index (0=whole element; pass
  //              a function that uses a.sample for hue variation over the ring).
  // Q-var convention (same as alcAnemone):
  //   q2,q3 = center | q5 = overall radius scale (breathing) | q8 = hue phase | q9 = spin
  //   q10 = vortex shear (angular offset proportional to how far the bristle protrudes)
  function alcSpindle(colorize) {
    colorize = colorize || ALC_PAL.twoTone;
    return {
      baseVals: Object.assign({}, WAVE_BASE, {
        enabled: 1, samples: 512, additive: 1, usedots: 0, scaling: 1,
        smoothing: 0.02, a: 0.8, thick: 1
      }),
      init_eqs: passthrough, frame_eqs: passthrough,
      point_eqs: function (a) {
        var cx = (a.q2 !== undefined ? a.q2 : 0.5), cy = (a.q3 !== undefined ? a.q3 : 0.5);
        var R = (a.q5 || 0.35);                           // radius scale (breathing scale from frame)
        var spin = (a.q9 || 0);
        var twist = (a.q10 || 0);
        var samp = Math.abs(a.value1 || 0);               // abs waveform → bristle length (always +)
        // r = dark eye floor (15% of R, always present) + spike proportional to waveform energy
        var r = R * (0.15 + samp);
        var ang = a.sample * 6.2832 + spin;
        ang += twist * (r - R * 0.15);                    // vortex: protruding bristles curve into spiral
        a.x = cx + r * Math.cos(ang);
        a.y = cy + r * Math.sin(ang);
        colorize(a, 0);
        return a;
      }
    };
  }

  // KIT ELEMENT — TETHER: a thin jagged live-waveform line linking two points (the "lightning"
  // strung between a flanking ORBITER PAIR, as in the canonical Pulsar). Endpoints are read from
  // q-var FIELDS (e.g. "q21","q22" -> node A, "q23","q24" -> node B) that the scene's frame sets;
  // `qamp` field is the displacement amplitude. One custom WAVE. colorize optional (kit palette);
  // defaults to a cool-white bolt.
  function alcTether(qax, qay, qbx, qby, qamp, colorize) {
    qamp = qamp || "q26";
    return {
      baseVals: Object.assign({}, WAVE_BASE, {
        enabled: 1, samples: 512, additive: 0, usedots: 0, scaling: 1, // NON-additive -> crisp bolt, no feedback bloom band
        smoothing: 0.03, a: 0.9, thick: 1, r: 0.72, g: 0.85, b: 1.0
      }),
      init_eqs: passthrough, frame_eqs: passthrough,
      point_eqs: function (a) {
        var ax = (a[qax] !== undefined ? a[qax] : 0.4), ay = (a[qay] !== undefined ? a[qay] : 0.5);
        var bx = (a[qbx] !== undefined ? a[qbx] : 0.6), by = (a[qby] !== undefined ? a[qby] : 0.5);
        var dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1;
        var nx = -dy / len, ny = dx / len;
        // window the displacement to ZERO at both ends (sin(0)=sin(π)=0) so the bolt's tips land
        // EXACTLY on the two orbiter nodes (otherwise value1 at the ends floats them off-centre).
        var win = Math.sin(a.sample * 3.14159);
        var disp = (a.value1 || 0) * (a[qamp] || 0.03) * win; // live waveform -> jagged lightning, tied to the nodes
        a.x = ax + a.sample * dx + nx * disp;
        a.y = ay + a.sample * dy + ny * disp;
        if (colorize) colorize(a, 0); else { a.r = 0.72; a.g = 0.85; a.b = 1.0; }
        return a;
      }
    };
  }

  // KIT ELEMENT — ORBITER NODE: a glowing ringed disc (a "Saturn" orb) at a q-var position, used
  // in flanking PAIRS joined by alcTether. Returns a WAVE — NOT a shape: Butterchurn positions a
  // custom WAVE with invAspect ((2x-1)*invAspectx) but a custom SHAPE WITHOUT ((2x-1)), so a
  // shape orb and the wave tether at the SAME (qx,qy) land at different screen points and the
  // bolt won't touch the orb. As a wave it shares the tether's exact space -> always connected.
  // (At node size a spiral-fill disc reads cleanly; the tube problem only bites at large scale.)
  // The CENTRE is a bright warm-white (distinct from the trail); the RING takes a kit PALETTE
  // keyed by q8, so the ring/halo (and its feedback trail) CYCLE colour. qr = radius field.
  function alcOrbiterNode(qx, qy, qr, ringPal) {
    ringPal = ringPal || ALC_PAL.mono;                        // cycling single hue for the ring/halo
    qr = qr || "q25";
    return {
      baseVals: Object.assign({}, WAVE_BASE, {
        enabled: 1, samples: 256, additive: 0, usedots: 0, scaling: 1,  // NON-additive -> paints, can't bloom to a white blob
        smoothing: 0.0, a: 0.9, thick: 1
      }),
      init_eqs: passthrough, frame_eqs: passthrough,
      point_eqs: function (a) {
        var cx = (a[qx] !== undefined ? a[qx] : 0.5), cy = (a[qy] !== undefined ? a[qy] : 0.5);
        var rad = (a[qr] || 0.04);
        if (a.sample < 0.62) {                                // FILL: dense sqrt-spiral -> bright white CORE (≠ trail)
          var f = a.sample / 0.62, rf = rad * Math.sqrt(f), af = f * 6.2832 * 16.0;
          a.x = cx + rf * Math.cos(af); a.y = cy + rf * Math.sin(af);
          a.r = 1.0; a.g = 0.96; a.b = 0.9;
        } else {                                              // RING: cycling colour (palette via q8)
          var c = { q8: a.q8 }; ringPal(c, 0);
          var fb = (a.sample - 0.62) / 0.38, rb = rad * (0.96 + 0.12 * fb), ab = fb * 6.2832 * 5.0;
          a.x = cx + rb * Math.cos(ab); a.y = cy + rb * Math.sin(ab);
          a.r = c.r; a.g = c.g; a.b = c.b;
        }
        return a;
      }
    };
  }

  // MOTIF — ONE explicit orb at a flowing depth (q14 + depthOffset), projected to the right VP.
  // Each orb is its OWN wave: a dense spiral FILL + thick ring BORDER drawn with usedots:0, so
  // it's a clean filled glow disc with NO connecting line to other orbs (the row is several of
  // these at staggered depthOffsets). Fill/border colors as in alcOrb. Crisp, not a beam/dots.
  function alcOrbAt(depthOffset, fillHueOff, borderHueOff) {
    var K = 4.0, vpx = 0.90, vpy = 0.50, nearX = 0.12, nearY = 0.50;
    return {
      baseVals: Object.assign({}, WAVE_BASE, {
        enabled: 1, samples: 256, additive: 1, usedots: 0, scaling: 1,
        smoothing: 0.0, a: 0.85, thick: 1
      }),
      init_eqs: passthrough, frame_eqs: passthrough,
      point_eqs: function (a) {
        var raw = (a.q14 || 0) + depthOffset; raw = raw - Math.floor(raw);  // this orb's flowing depth
        var proj = 1.0 / (1.0 + K * raw);
        var ccx = (nearX - vpx) * proj + vpx;
        var ccy = (nearY - vpy) * proj + vpy;
        var rad = Math.min((a.q7 || 0.1) * proj, 0.07);
        var fade = (1.0 - raw) * sm01(raw / 0.05);
        var rl, ang, isB;
        if (a.sample < 0.6) {                                  // FILL: dense spiral disc
          var ff = a.sample / 0.6; rl = rad * Math.sqrt(ff); ang = ff * 6.2832 * 14.0; isB = false;
        } else {                                               // BORDER: thick ring
          var fb = (a.sample - 0.6) / 0.4; rl = rad * (0.92 + 0.13 * fb); ang = fb * 6.2832 * 4.0; isB = true;
        }
        a.x = ccx + rl * Math.cos(ang);
        a.y = ccy + rl * Math.sin(ang);
        if (isB) {
          if (borderHueOff !== undefined) alcSetColor(a, (a.q8 || 0) + borderHueOff, 0.2, 1.6 * fade);
          else { a.r = 1.1 * fade; a.g = 1.3 * fade; a.b = 1.6 * fade; }
        } else {
          alcSetColor(a, (a.q8 || 0) + fillHueOff, 0.85, 0.7 * fade);
        }
        return a;
      }
    };
  }

  // MOTIF (custom SHAPES) — the comet/marching-orb trail done RIGHT: `count` real filled
  // circles at flowing depths, projected to the right VP. Each is a native disc with a soft
  // gradient core (center opaque -> edge transparent via a2=0, so it glows and blends) + a
  // bright ring border, shrinking + fading into the distance. NOT a wave spiral (tube) and NOT
  // additive (no white blowout). Returns an ARRAY for preset.shapes. q7 = base radius, q14 = flow.
  function makeOrbTrailShapes(count) {
    // Path recedes from the near HEAD (top-left) to the VP (lower-right), with a gentle WAVY
    // wobble — matching the reference: a filled head sphere trailing hollow shrinking rings
    // along a curving path. Color hue-cycles over time (q8). q7=base radius, q14=flow, q19=time.
    var K = 2.0, nearX = 0.14, nearY = 0.40, vpx = 0.86, vpy = 0.62;
    var arr = [];
    for (var i = 0; i < count; i++) {
      (function (idx) {
        arr.push({
          baseVals: Object.assign({}, SHAPE_BASE, {
            enabled: 1, sides: 28, additive: 0, thickoutline: 1, textured: 0
          }),
          init_eqs: passthrough,
          frame_eqs: function (s) {
            var raw = (idx / count) + (s.q14 || 0);
            raw = raw - Math.floor(raw);                       // this orb's flowing depth (wraps)
            var proj = 1.0 / (1.0 + K * raw);
            var tm = (s.q19 !== undefined ? s.q19 : (s.time || 0));
            var wob = 0.11 * Math.sin(raw * 6.2832 * 1.3 + tm * 0.8) * proj;  // WAVY path (less wobble far)
            s.x = (nearX - vpx) * proj + vpx;                  // recede toward the VP (down-right)
            s.y = (nearY - vpy) * proj + vpy + wob;
            s.rad = Math.min((s.q7 || 0.1) * proj, 0.055);     // later circles smaller (perspective)
            var fade = (1.0 - raw) * sm01(raw / 0.015);        // bright at the HEAD (near), fade into distance; tiny in-ramp hides the recycle
            var h = (s.q8 || 0) + raw * 0.15;                  // hue CYCLES (q8) + slight shift along the trail
            var cr = 0.5 + 0.5 * Math.cos(6.2832 * h);
            var cg = 0.5 + 0.5 * Math.cos(6.2832 * (h + 0.32));
            var cb = 0.5 + 0.5 * Math.cos(6.2832 * (h + 0.62));
            var fillA = 0.85 * fade * sm01((0.18 - raw) / 0.18);  // HEAD (near) is FILLED; trail rings are HOLLOW
            s.r = cr; s.g = cg; s.b = cb; s.a = fillA;
            s.r2 = cr * 0.5; s.g2 = cg * 0.5; s.b2 = cb * 0.5; s.a2 = fillA * 0.4;
            s.border_r = 0.9; s.border_g = 0.95; s.border_b = 1.0; s.border_a = 0.85 * fade;  // bright white-ish ring (the gap edge)
            return s;
          }
        });
      })(i);
    }
    return arr;
  }

  // Shared per-frame driver for net scenes: cycles hue, accumulates the star's
  // self-spin, sets the motif q-vars, and breathes zoom on the beat. `headFn(time,
  // beat)` returns the [x,y] head position (camera-specific: centered for top,
  // left for side). `baseZoom` is the camera's resting feedback zoom.
  function alcNetFrame(headFn, baseZoom) {
    var hue = 0, lastT = 0, spin = 0, march = 0;
    return function (t) {
      var bass = t.bass_att || t.bass || 1, mid = t.mid_att || t.mid || 1, treb = t.treb_att || t.treb || 1;
      var tm = t.time, dt = Math.min(0.1, Math.max(0, tm - lastT)); lastT = tm;
      var bn = Math.max(0, Math.min(bass - 1, 1));
      hue = (hue + dt * (0.02 + 0.05 * ((bass + mid) / 2))) % 1;
      spin = spin + dt * (1.25 + 0.8 * bn);                        // lively spin (trace kept sparse via short decay)
      march = march + dt * (0.04 + 0.05 * bn);                     // SLOW orb-row flow -> circles read separately as they crawl
      var hp = headFn(tm, bn);
      t.q2 = hp[0]; t.q3 = hp[1];
      t.q5 = 0.38 + 0.06 * bn;                                    // star radius (bigger -> fills frame, less blank space)
      t.q6 = 0.03 + 0.11 * Math.min(0.6 * treb + 0.5 * mid, 2.0); // edge jaggedness (live waveform)
      t.q7 = 0.11 + 0.035 * bn;                                   // orb radius (big enough to read as the marching row)
      t.q8 = hue;                                                 // hue phase
      t.q9 = spin;                                                // star self-rotation
      t.q14 = march;                                              // orb-row march phase
      t.q19 = tm;                                                 // time clock (orb-trail wavy path)
      t.zoom = baseZoom - 0.025 * bn;                             // beats deepen the dive
      return t;
    };
  }

  var P = {};

  // ── Dance of the Freaky Circles (Nebula) ────────────────────────────────────
  // TWO "circle-in-circle" units orbit each other (originally re-derived from the
  // reference video). Each unit = a static inner circle "eye" + a POINTED, audio-gated
  // waveform ring around it (fades to zero + contracts when mid/treb are quiet), plus a
  // drifting inner harmonic and a counter-rotating outer aura -> a layered energy field.
  // Background is a cool bluish-purple NEBULA wash (drifting fbm, breathes with bass);
  // a motion-blur warp leaves soft phosphor trails; comp recolours to a magenta ramp.
  P["Dance of the Freaky Circles (Nebula)"] = (function () {
    var preset = build(
      {
        wave_a: 0,             // primary waveform off; the custom waves draw everything
        decay: 0.965,          // ~0.35s half-life @60fps (measured from the video); the
                               // mosaic lingers, then fades SLOWLY/smoothly (no on/off pop)
        gammaadj: 1.4,
        zoom: 0.997,           // very slight inward feedback drift -> blocks recede a touch
                               // as they fade = depth (not a flat slab). Subtle, no smear.
        warp: 0.04,
        echo_alpha: 0,
        darken_center: 0,
        wrap: 0
      },
      {
        frame: function (t) {
          var bass = t.bass_att || t.bass || 1;
          var treb = t.treb_att || t.treb || 1;
          var mid = t.mid_att || t.mid || 1;
          var th = t.time * 1.0;                       // the two units orbit each other
          var orbit = 0.11;                            // distance of each unit from the common center
          t.q1 = 0.5 + orbit * Math.cos(th);                  // unit A center
          t.q2 = 0.5 + orbit * Math.sin(th);
          t.q3 = 0.5 + orbit * Math.cos(th + Math.PI);        // unit B center (opposite)
          t.q4 = 0.5 + orbit * Math.sin(th + Math.PI);
          // Inner shapes: small; they keep their structure (circle + horizontal bar)
          // and only PULSE gently in size with the bass — no waveform distortion.
          t.q5 = 0.052 + 0.004 * bass;                 // inner circles almost STATIC (tiny bass wobble)
          t.q10 = Math.min(0.45 + 0.5 * ((bass + mid + treb) / 3), 1.2); // inner-circle intensity ~ volume
          // AUDIO GATE for the OUTER ring only (q14): when mid/treb drop, the waveform fades
          // to zero and contracts onto the inner circles; the inner circles (on q10) stay.
          var midA = (t.mid_att !== undefined ? t.mid_att : (t.mid || 0));
          var trebA = (t.treb_att !== undefined ? t.treb_att : (t.treb || 0));
          t.q14 = Math.max(0, Math.min((0.5 * (midA + trebA) - 0.55) * 1.8, 1.2));
          t.q6 = 0.055 + 0.085 * t.q14;                // ring radius contracts onto the inner circle when quiet
          // ONLY the outer waveform jumps: treble/mid spike it outward.
          t.q8 = 0.03 + 0.06 * Math.min(0.6 * treb + 0.4 * mid, 2.4);   // smaller jump (pointiness comes from fewer samples)
          // harmonic-layer drivers
          t.q11 = t.time;                              // phase clock for drift / counter-rotation
          t.q12 = (t.vol_att !== undefined ? t.vol_att : (t.vol || 0.5));  // volume -> outer-aura undulation
          t.q15 = 0.02 + 0.05 * Math.min(0.5 * bass + 0.5 * mid, 2.0);     // inner-harmonic amplitude (bass/mid)
          // Breather: the outer rings turn OFF briefly at RANDOM intervals (not a
          // fixed cadence), revealing the slowly-fading mosaic underneath. Each
          // ~0.55s slot has a ~30% chance of a brief off-window at its start.
          var slot = Math.floor(t.time / 0.55);
          var rnd = Math.sin(slot * 12.9898) * 43758.5453;
          rnd = rnd - Math.floor(rnd);                 // pseudo-random 0..1, stable per slot
          var ph = t.time / 0.55 - slot;               // 0..1 within the slot
          t.q9 = (rnd < 0.32 && ph < 0.4) ? 0 : 1;     // 0 = rings hidden (breather), 1 = on
          return t;
        },
        // WARP: trail control + soft PHOSPHOR blur. Each frame the feedback is lightly
        // blurred (5-tap) and faded, so the decay traces soften into glowing light as they
        // age, while the live waveform (drawn after warp) stays sharp. Fade keeps it short.
        warp:
          "shader_body {\n" +
          "vec2 wp = 1.0 / resolution;\n" +
          "float br = 1.5;\n" +                              // blur -> motion smears into a soft fill
          "vec3 acc = texture2D(sampler_main, uv).rgb * 0.5;\n" +
          "acc += texture2D(sampler_main, uv + vec2(wp.x * br, 0.0)).rgb * 0.125;\n" +
          "acc += texture2D(sampler_main, uv - vec2(wp.x * br, 0.0)).rgb * 0.125;\n" +
          "acc += texture2D(sampler_main, uv + vec2(0.0, wp.y * br)).rgb * 0.125;\n" +
          "acc += texture2D(sampler_main, uv - vec2(0.0, wp.y * br)).rgb * 0.125;\n" +
          "ret = acc * 0.95;\n" +                            // longer-lasting motion blur (trails linger)
          "}\n",
        // COMP: DEEP NEBULA wash (mosaic dropped) + the vivid circles/waveform on top.
        //  - BACKGROUND: a slow-drifting fbm cloud, kept very dim (~5-12%) and darkened
        //    toward the edges (vignette) so it adds depth without competing with the
        //    circles. No grid, no shapes, no feedback -> can't accumulate or interfere.
        //    Brightens gently with bass so the void "breathes".
        //  - LINES: the circles + waveform (from the feedback buffer) are recoloured to
        //    vivid magenta and added on top; residual green is clamped out.
        comp:
          NOISE_GLSL +
          "shader_body {\n" +
          "vec2 nuv = uv * 2.4 + vec2(time * 0.015, time * 0.010);\n" +   // slow drift
          "float n = fbm(nuv); n = n * n;\n" +                            // deepen -> dark with soft wisps
          "float vig = 1.0 - smoothstep(0.20, 0.92, length(uv - 0.5));\n" +
          // COOL bluish-purple smoke behind the WARM magenta waveform (cool/warm depth).
          // Floor keeps an ambient, slowly-drifting cloud alive even when the bass drops.
          "vec3 neb = mix(vec3(0.02, 0.012, 0.07), vec3(0.18, 0.07, 0.52), n) * (0.14 + 0.11 * bass) * vig;\n" +
          "vec3 sharp = texture2D(sampler_main, uv).rgb;\n" +             // circles + waveform (+ trails)
          "float sl = max(sharp.r, max(sharp.g, sharp.b));\n" +
          // multi-shade ramp, all in the PURPLE family (no blue/green dip) so dim trails
          // stay deep purple and only the bright cores flare hot pink -> dramatic but cohesive
          "vec3 lc = mix(vec3(0.42, 0.05, 0.66), vec3(0.92, 0.18, 1.0), smoothstep(0.10, 0.60, sl));\n" +
          "lc = mix(lc, vec3(1.0, 0.60, 1.0), smoothstep(0.72, 1.25, sl));\n" +
          "vec3 line = lc * sl * 0.95;\n" +
          "vec3 outc = neb + line;\n" +
          "outc.g = min(outc.g, 0.5 * max(outc.r, outc.b));\n" +          // clamp residual green
          "ret = outc;\n" +
          "}\n"
      }
    );

    // Inner SHAPE: a clean, smooth circle. NOT a waveform — geometry stays smooth
    // (any blockiness comes only from the mosaic shader over the top). Size from q5
    // (gentle bass pulse), colour intensity from q10 (volume).
    function innerCircle(qx, qy) {
      return {
        baseVals: Object.assign({}, WAVE_BASE, {
          enabled: 1, samples: 256, additive: 1, usedots: 0, scaling: 1,
          smoothing: 0.9, a: 0.7, thick: 1, r: 0.80, g: 0.20, b: 1.0
        }),
        init_eqs: passthrough,
        frame_eqs: passthrough,
        point_eqs: function (a) {
          var r = (a.q5 || 0.04);
          var ang = a.sample * 6.2832;
          a.x = (a[qx] || 0.5) + r * Math.cos(ang);
          a.y = (a[qy] || 0.5) + r * Math.sin(ang);
          a.r = 0.78; a.g = 0.22; a.b = 0.95;          // FIXED -> steady "eyes", no flashing
          return a;
        }
      };
    }

    // POINTED/JAGGED waveform RING around the inner circle. Radius q6 + q8*sample;
    // each unit on its own channel (value1 / value2). thick:1 = thicker lightning.
    // FEWER samples + smoothing 0 -> distinct angular spikes (pointed teeth, not a dense
    // fuzzy noodle). q9 is the breather gate: when 0 the ring is hidden (offscreen).
    function waveRing(qx, qy, useSecondChannel) {
      return {
        baseVals: Object.assign({}, WAVE_BASE, {
          enabled: 1, samples: 180, additive: 1, usedots: 0, scaling: 1,
          smoothing: 0.0, a: 0.85, thick: 1, r: 0.80, g: 0.35, b: 1.0
        }),
        init_eqs: passthrough,
        frame_eqs: passthrough,
        point_eqs: function (a) {
          if ((a.q9 !== undefined ? a.q9 : 1) < 0.5) {  // breather: ring off this frame
            a.x = -2; a.y = -2; return a;
          }
          var ang = a.sample * 6.2832;
          var samp = useSecondChannel ? (a.value2 !== undefined ? a.value2 : a.value1) : a.value1;
          var rad = (a.q6 || 0.11) + (a.q8 || 0.10) * samp;     // jagged ring, jumps with music
          rad = Math.max(0.045, Math.min(rad, 0.40));           // clamp -> no center-crossing spaghetti
          a.x = (a[qx] || 0.5) + rad * Math.cos(ang);
          a.y = (a[qy] || 0.5) + rad * Math.sin(ang);
          var v = (a.q10 !== undefined ? a.q10 : 1) * (a.q14 !== undefined ? a.q14 : 1);  // GATED: fades out when mid/treb quiet
          a.r = 0.80 * v; a.g = 0.35 * v; a.b = 1.0 * v;
          return a;
        }
      };
    }
    // INNER HARMONIC (layer 2): a thin, fainter waveform inside the main ring, size driven
    // by bass/mid (q15), angle slowly DRIFTING (q11*0.3) so its spikes weave in and out of
    // the main ring. Opposite channel + driver -> moves independently. thick:0 = thin.
    function innerHarmonic(qx, qy, useFirstChannel) {
      return {
        baseVals: Object.assign({}, WAVE_BASE, {
          enabled: 1, samples: 160, additive: 1, usedots: 0, scaling: 1,
          smoothing: 0.0, a: 0.40, thick: 0, r: 0.55, g: 0.22, b: 1.0
        }),
        init_eqs: passthrough,
        frame_eqs: passthrough,
        point_eqs: function (a) {
          if ((a.q9 !== undefined ? a.q9 : 1) < 0.5) { a.x = -2; a.y = -2; return a; }
          var ang = a.sample * 6.2832 + (a.q11 || 0) * 0.3;     // drifting phase -> weaves
          var samp = useFirstChannel ? a.value1 : (a.value2 !== undefined ? a.value2 : a.value1);
          var rad = (a.q6 || 0.11) * 0.60 + (a.q15 || 0.04) * (samp || 0);
          rad = Math.max(0.035, Math.min(rad, 0.32));
          a.x = (a[qx] || 0.5) + rad * Math.cos(ang);
          a.y = (a[qy] || 0.5) + rad * Math.sin(ang);
          var v = 0.6 * (a.q14 !== undefined ? a.q14 : 1);      // gated like the main ring
          a.r = 0.55 * v; a.g = 0.22 * v; a.b = 1.0 * v;
          return a;
        }
      };
    }
    // OUTER AURA (layer 3): a faint, smoothly UNDULATING ring outside the main one (5 sine
    // lobes whose depth tracks volume q12), rotating the OPPOSITE way (-q11*0.15) -> an
    // electric field enclosing the waves. Very low opacity -> atmosphere, not clutter.
    function outerAura(qx, qy) {
      return {
        baseVals: Object.assign({}, WAVE_BASE, {
          enabled: 1, samples: 128, additive: 1, usedots: 0, scaling: 1,
          smoothing: 0.5, a: 0.18, thick: 1, r: 0.45, g: 0.18, b: 1.0
        }),
        init_eqs: passthrough,
        frame_eqs: passthrough,
        point_eqs: function (a) {
          if ((a.q9 !== undefined ? a.q9 : 1) < 0.5) { a.x = -2; a.y = -2; return a; }
          var ang = a.sample * 6.2832 - (a.q11 || 0) * 0.15;    // opposite rotation
          var amp = 0.02 + 0.05 * (a.q12 || 0.5);               // undulation depth ~ volume
          var rad = (a.q6 || 0.11) * 1.55 + amp * Math.sin(a.sample * 6.2832 * 5.0 + (a.q11 || 0));
          a.x = (a[qx] || 0.5) + rad * Math.cos(ang);
          a.y = (a[qy] || 0.5) + rad * Math.sin(ang);
          var v = 0.32 * (a.q14 !== undefined ? a.q14 : 1);     // gated, very faint
          a.r = 0.45 * v; a.g = 0.18 * v; a.b = 1.0 * v;
          return a;
        }
      };
    }
    preset.waves[0] = innerCircle("q1", "q2");        // unit A inner circle (static eye)
    preset.waves[1] = waveRing("q1", "q2", false);    // unit A PRIMARY spiky ring (treb/mid)
    preset.waves[2] = innerCircle("q3", "q4");        // unit B inner circle (static eye)
    preset.waves[3] = waveRing("q3", "q4", true);     // unit B PRIMARY spiky ring
    preset.waves[4] = innerHarmonic("q1", "q2", false);  // unit A inner harmonic (drifts +)
    preset.waves[5] = innerHarmonic("q3", "q4", true);   // unit B inner harmonic
    preset.waves[6] = outerAura("q1", "q2");             // unit A outer aura (rotates -)
    preset.waves[7] = outerAura("q3", "q4");             // unit B outer aura
    return preset;
  })();

  // ── Dance of the Freaky Circles (Nebula Spectrum) ───────────────────────────
  // Same as (Nebula) but with WMP-style HUE CYCLING: the whole palette slowly rotates
  // through the colour wheel over ~50s (warm -> cool -> magenta) and periodically
  // desaturates to a grey/monochrome phase, like WMP's HueShift / "Musical Colors".
  // Background takes the complementary hue (cool/warm depth); cores still flare white-hot.
  P["Dance of the Freaky Circles (Nebula Spectrum)"] = (function () {
    var preset = build(
      {
        wave_a: 0,
        decay: 0.965,
        gammaadj: 1.4,
        zoom: 0.997,
        warp: 0.04,
        echo_alpha: 0,
        darken_center: 0,
        wrap: 0
      },
      {
        frame: function (t) {
          var bass = t.bass_att || t.bass || 1;
          var treb = t.treb_att || t.treb || 1;
          var mid = t.mid_att || t.mid || 1;
          var th = t.time * 1.0;
          var orbit = 0.11;
          t.q1 = 0.5 + orbit * Math.cos(th);
          t.q2 = 0.5 + orbit * Math.sin(th);
          t.q3 = 0.5 + orbit * Math.cos(th + Math.PI);
          t.q4 = 0.5 + orbit * Math.sin(th + Math.PI);
          t.q5 = 0.052 + 0.004 * bass;
          t.q10 = Math.min(0.45 + 0.5 * ((bass + mid + treb) / 3), 1.2);
          var midA = (t.mid_att !== undefined ? t.mid_att : (t.mid || 0));
          var trebA = (t.treb_att !== undefined ? t.treb_att : (t.treb || 0));
          t.q14 = Math.max(0, Math.min((0.5 * (midA + trebA) - 0.55) * 1.8, 1.2));
          t.q6 = 0.055 + 0.085 * t.q14;
          t.q8 = 0.03 + 0.06 * Math.min(0.6 * treb + 0.4 * mid, 2.4);
          t.q11 = t.time;
          t.q12 = (t.vol_att !== undefined ? t.vol_att : (t.vol || 0.5));
          t.q15 = 0.02 + 0.05 * Math.min(0.5 * bass + 0.5 * mid, 2.0);
          var slot = Math.floor(t.time / 0.55);
          var rnd = Math.sin(slot * 12.9898) * 43758.5453;
          rnd = rnd - Math.floor(rnd);
          var ph = t.time / 0.55 - slot;
          t.q9 = (rnd < 0.32 && ph < 0.4) ? 0 : 1;
          return t;
        },
        warp:
          "shader_body {\n" +
          "vec2 wp = 1.0 / resolution;\n" +
          "float br = 1.5;\n" +
          "vec3 acc = texture2D(sampler_main, uv).rgb * 0.5;\n" +
          "acc += texture2D(sampler_main, uv + vec2(wp.x * br, 0.0)).rgb * 0.125;\n" +
          "acc += texture2D(sampler_main, uv - vec2(wp.x * br, 0.0)).rgb * 0.125;\n" +
          "acc += texture2D(sampler_main, uv + vec2(0.0, wp.y * br)).rgb * 0.125;\n" +
          "acc += texture2D(sampler_main, uv - vec2(0.0, wp.y * br)).rgb * 0.125;\n" +
          "ret = acc * 0.95;\n" +
          "}\n",
        // COMP: hue-cycling palette (WMP HueShift). hueCol() rotates through the wheel and
        // desaturates toward grey when s is low. NO green clamp (the hue may legitimately
        // be green/cyan during the cycle).
        comp:
          NOISE_GLSL +
          "vec3 hueCol(float h, float s, float v) {\n" +
          "  vec3 rb = 0.5 + 0.5 * cos(6.2832 * (h + vec3(0.0, 0.33, 0.67)));\n" +
          "  return mix(vec3(0.5), rb, s) * v;\n" +
          "}\n" +
          "shader_body {\n" +
          "vec2 nuv = uv * 2.4 + vec2(time * 0.015, time * 0.010);\n" +
          "float n = fbm(nuv); n = n * n;\n" +
          "float vig = 1.0 - smoothstep(0.20, 0.92, length(uv - 0.5));\n" +
          "float hb = time * 0.02;\n" +                                  // ~50s full hue rotation
          "float S = clamp(0.55 + 0.55 * sin(time * 0.045), 0.0, 1.0);\n" +  // periodic grey phase
          "vec3 nebCol = hueCol(hb + 0.5, S * 0.85, 1.0);\n" +           // complementary bg hue
          "vec3 neb = mix(vec3(0.02, 0.02, 0.03), nebCol * 0.5, n) * (0.14 + 0.11 * bass) * vig;\n" +
          "vec3 sharp = texture2D(sampler_main, uv).rgb;\n" +
          "float sl = max(sharp.r, max(sharp.g, sharp.b));\n" +
          "vec3 base = hueCol(hb, S, 1.0);\n" +
          "vec3 lc = base * mix(0.45, 1.0, smoothstep(0.10, 0.60, sl));\n" +
          "lc = mix(lc, vec3(1.0), smoothstep(0.80, 1.30, sl) * 0.55);\n" +   // hot white cores
          "vec3 line = lc * sl;\n" +
          "ret = neb + line;\n" +
          "}\n"
      }
    );
    function innerCircle(qx, qy) {
      return {
        baseVals: Object.assign({}, WAVE_BASE, {
          enabled: 1, samples: 256, additive: 1, usedots: 0, scaling: 1,
          smoothing: 0.9, a: 0.7, thick: 1, r: 0.80, g: 0.20, b: 1.0
        }),
        init_eqs: passthrough,
        frame_eqs: passthrough,
        point_eqs: function (a) {
          var r = (a.q5 || 0.04);
          var ang = a.sample * 6.2832;
          a.x = (a[qx] || 0.5) + r * Math.cos(ang);
          a.y = (a[qy] || 0.5) + r * Math.sin(ang);
          a.r = 0.78; a.g = 0.22; a.b = 0.95;
          return a;
        }
      };
    }
    function waveRing(qx, qy, useSecondChannel) {
      return {
        baseVals: Object.assign({}, WAVE_BASE, {
          enabled: 1, samples: 180, additive: 1, usedots: 0, scaling: 1,
          smoothing: 0.0, a: 0.85, thick: 1, r: 0.80, g: 0.35, b: 1.0
        }),
        init_eqs: passthrough,
        frame_eqs: passthrough,
        point_eqs: function (a) {
          if ((a.q9 !== undefined ? a.q9 : 1) < 0.5) {
            a.x = -2; a.y = -2; return a;
          }
          var ang = a.sample * 6.2832;
          var samp = useSecondChannel ? (a.value2 !== undefined ? a.value2 : a.value1) : a.value1;
          var rad = (a.q6 || 0.11) + (a.q8 || 0.10) * samp;
          rad = Math.max(0.045, Math.min(rad, 0.40));
          a.x = (a[qx] || 0.5) + rad * Math.cos(ang);
          a.y = (a[qy] || 0.5) + rad * Math.sin(ang);
          var v = (a.q10 !== undefined ? a.q10 : 1) * (a.q14 !== undefined ? a.q14 : 1);
          a.r = 0.80 * v; a.g = 0.35 * v; a.b = 1.0 * v;
          return a;
        }
      };
    }
    function innerHarmonic(qx, qy, useFirstChannel) {
      return {
        baseVals: Object.assign({}, WAVE_BASE, {
          enabled: 1, samples: 160, additive: 1, usedots: 0, scaling: 1,
          smoothing: 0.0, a: 0.40, thick: 0, r: 0.55, g: 0.22, b: 1.0
        }),
        init_eqs: passthrough,
        frame_eqs: passthrough,
        point_eqs: function (a) {
          if ((a.q9 !== undefined ? a.q9 : 1) < 0.5) { a.x = -2; a.y = -2; return a; }
          var ang = a.sample * 6.2832 + (a.q11 || 0) * 0.3;
          var samp = useFirstChannel ? a.value1 : (a.value2 !== undefined ? a.value2 : a.value1);
          var rad = (a.q6 || 0.11) * 0.60 + (a.q15 || 0.04) * (samp || 0);
          rad = Math.max(0.035, Math.min(rad, 0.32));
          a.x = (a[qx] || 0.5) + rad * Math.cos(ang);
          a.y = (a[qy] || 0.5) + rad * Math.sin(ang);
          var v = 0.6 * (a.q14 !== undefined ? a.q14 : 1);
          a.r = 0.55 * v; a.g = 0.22 * v; a.b = 1.0 * v;
          return a;
        }
      };
    }
    function outerAura(qx, qy) {
      return {
        baseVals: Object.assign({}, WAVE_BASE, {
          enabled: 1, samples: 128, additive: 1, usedots: 0, scaling: 1,
          smoothing: 0.5, a: 0.18, thick: 1, r: 0.45, g: 0.18, b: 1.0
        }),
        init_eqs: passthrough,
        frame_eqs: passthrough,
        point_eqs: function (a) {
          if ((a.q9 !== undefined ? a.q9 : 1) < 0.5) { a.x = -2; a.y = -2; return a; }
          var ang = a.sample * 6.2832 - (a.q11 || 0) * 0.15;
          var amp = 0.02 + 0.05 * (a.q12 || 0.5);
          var rad = (a.q6 || 0.11) * 1.55 + amp * Math.sin(a.sample * 6.2832 * 5.0 + (a.q11 || 0));
          a.x = (a[qx] || 0.5) + rad * Math.cos(ang);
          a.y = (a[qy] || 0.5) + rad * Math.sin(ang);
          var v = 0.32 * (a.q14 !== undefined ? a.q14 : 1);
          a.r = 0.45 * v; a.g = 0.18 * v; a.b = 1.0 * v;
          return a;
        }
      };
    }
    preset.waves[0] = innerCircle("q1", "q2");
    preset.waves[1] = waveRing("q1", "q2", false);
    preset.waves[2] = innerCircle("q3", "q4");
    preset.waves[3] = waveRing("q3", "q4", true);
    preset.waves[4] = innerHarmonic("q1", "q2", false);
    preset.waves[5] = innerHarmonic("q3", "q4", true);
    preset.waves[6] = outerAura("q1", "q2");
    preset.waves[7] = outerAura("q3", "q4");
    return preset;
  })();

  // ── Dance of the Freaky Circles (Fire) ──────────────────────────────────────
  // A procedural fire visualizer over a clean black background, recoloured by a
  // MULTI-SHADE purple ramp (deep violet -> magenta -> pink-white). Two static inner
  // "eye" circles sit at the center; the OUTER ring is an audio-gated oscilloscope
  // that fades to zero + contracts when mid/treb are quiet, expands/spikes when active,
  // and beat-punches on detected bass jumps (radius hard-clamped so it can't blow out).
  // PROCEDURAL GLSL PARTICLES (custom-wave dots degrade to lines in this build): a
  // beat-triggered burst layer with ember physics (drag/buoyancy/turbulence, colour
  // temperature) + a continuous ambient ember layer. Trails use a motion-blur warp
  // (rotating, lightly-blurred multiplicative fade) since decay has no effect here.
  P["Dance of the Freaky Circles (Fire)"] = (function () {
    // beat-detection state (persists across frames via this closure) — used to fire a
    // particle burst ONLY when the bass jumps, not continuously.
    var avgBass = 0.5, lastBurst = -10, burstStr = 0, burstSeed = 0, burstCount = 0;
    var preset = build(
      {
        wave_a: 0,
        decay: 0.62,           // short fade (also forced in frame_eqs); high decay was only for mosaic
        gammaadj: 1.5,
        zoom: 1.0,
        warp: 0.0,
        echo_alpha: 0,
        darken_center: 0,
        wrap: 0
      },
      {
        frame: function (t) {
          var bass = t.bass_att || t.bass || 1;
          var treb = t.treb_att || t.treb || 1;
          var mid = t.mid_att || t.mid || 1;
          var th = t.time * 1.0;
          var orbit = 0.11;
          t.q1 = 0.5 + orbit * Math.cos(th);
          t.q2 = 0.5 + orbit * Math.sin(th);
          t.q3 = 0.5 + orbit * Math.cos(th + Math.PI);
          t.q4 = 0.5 + orbit * Math.sin(th + Math.PI);
          t.q5 = 0.052 + 0.004 * bass;   // inner circles nearly STATIC (tiny bass response)
          // AUDIO GATE on the outer ring (an oscilloscope driven by mid/treb): below a
          // threshold it fades to ZERO (additive -> invisible) and CONTRACTS toward the
          // inner circles; it expands + brightens as mid/treb rise. Beat-punch adds on kicks.
          // (read true _att values; the mid/treb vars above use ||1 which is 1 at silence.)
          var midA = (t.mid_att !== undefined ? t.mid_att : (t.mid || 0));
          var trebA = (t.treb_att !== undefined ? t.treb_att : (t.treb || 0));
          var gate = Math.max(0, Math.min((0.5 * (midA + trebA) - 0.55) * 1.8, 1.3));
          t.q10 = gate;                          // ring brightness/alpha (0 = gone)
          t.q6 = 0.07 + 0.13 * gate;             // radius contracts when quiet, expands when active
          // MODERATE amplitude from the SMOOTHED _att vars -> jagged spikes that bite but
          // can't explode; peaks AND troughs are also hard-clamped in waveRing point_eqs.
          t.q8 = 0.03 + 0.08 * Math.min(0.6 * trebA + 0.4 * midA, 2.0);
          var slot = Math.floor(t.time / 0.55);
          var rnd = Math.sin(slot * 12.9898) * 43758.5453;
          rnd = rnd - Math.floor(rnd);
          var ph = t.time / 0.55 - slot;
          t.q9 = (rnd < 0.32 && ph < 0.4) ? 0 : 1;
          // FORCE a short decay every frame (baseVals alone wasn't being applied -> the
          // rings were stacking into a ball of yarn). High decay was only for the mosaic.
          t.decay = 0.62;
          // --- beat detection: fire a particle burst ONLY on a bass jump ---
          var bi = (t.bass !== undefined ? t.bass : bass);   // instantaneous-ish bass
          avgBass = avgBass * 0.92 + bi * 0.08;              // slow running baseline
          if (bi > avgBass * 1.30 + 0.20 && t.time - lastBurst > 0.16) {
            lastBurst = t.time;
            burstCount += 1;
            burstStr = Math.min(bi / Math.max(avgBass, 0.2), 2.2);
            burstSeed = burstCount * 0.3713;                 // new seed per burst -> fresh spark spread
          }
          t.q11 = t.time - lastBurst;                        // seconds since burst (burst age)
          t.q12 = burstStr;                                  // burst strength
          t.q13 = burstSeed;                                 // per-burst seed
          // BEAT PUNCH: a fast-decaying flinch right after each burst -> the rings expand
          // and flash on the kick (so the whole shape reacts, not just the particles)
          var punch = burstStr * Math.exp(-(t.time - lastBurst) * 7.0);
          t.q6 += 0.045 * punch;                             // rings snap outward on the hit
          t.q10 = Math.min(t.q10 + 0.55 * punch, 1.8);       // and flash brighter
          return t;
        },
        // WARP: trail control + MOTION BLUR. The default warp only does `ret -= 0.004`
        // (trails last ~forever); decay base-val had no effect in this build. Instead of
        // fading a STATIC copy (which leaves distinct ring afterimages), we rotate + very
        // slightly contract the previous frame and add a tiny blur each frame, so trails
        // SMEAR along the motion (motion blur) and still fade fast (no furball).
        warp:
          "shader_body {\n" +
          "vec2 cc = uv - 0.5;\n" +
          "float aa = 0.010;\n" +                            // small rotation/frame -> arc smear
          "mat2 R = mat2(cos(aa), -sin(aa), sin(aa), cos(aa));\n" +
          "vec2 suv = 0.5 + R * cc * 0.997;\n" +             // rotate + slight inward pull
          "vec2 wp = 1.0 / resolution;\n" +
          "vec3 acc = texture2D(sampler_main, suv).rgb * 0.5;\n" +
          "acc += texture2D(sampler_main, suv + vec2(wp.x * 1.5, 0.0)).rgb * 0.125;\n" +
          "acc += texture2D(sampler_main, suv - vec2(wp.x * 1.5, 0.0)).rgb * 0.125;\n" +
          "acc += texture2D(sampler_main, suv + vec2(0.0, wp.y * 1.5)).rgb * 0.125;\n" +
          "acc += texture2D(sampler_main, suv - vec2(0.0, wp.y * 1.5)).rgb * 0.125;\n" +
          "ret = acc * 0.88;\n" +                            // phosphor trail (gentle fade; wave is gated+clamped now)
          "}\n",
        // COMP: blur the buffer into soft glowing circles (mosaic smoothing, no grid),
        // colour via a multi-shade purple ramp, then draw PROCEDURAL PARTICLES on top.
        // Dots are computed in GLSL (custom-wave dots render as connected lines here).
        // Beat-triggered via q11/q12/q13 set in frame_eqs; wavy fire trajectory.
        // (Reserved builtin names ang/rad are predeclared in main() -> use pang/pr.)
        comp:
          "float pHash(float n) { return fract(sin(n * 78.233) * 43758.5453); }\n" +
          "vec3 pal(float x) {\n" +                          // multi-shade purple ramp (dramatic, not flat)
          "  vec3 c1 = vec3(0.05, 0.02, 0.14);\n" +          // deep blue-violet (dim)
          "  vec3 c2 = vec3(0.40, 0.08, 0.80);\n" +          // violet
          "  vec3 c3 = vec3(0.82, 0.18, 1.00);\n" +          // magenta-purple
          "  vec3 c4 = vec3(0.92, 0.38, 1.00);\n" +          // bright magenta peaks (not pure white)
          "  vec3 c = mix(c1, c2, smoothstep(0.04, 0.34, x));\n" +
          "  c = mix(c, c3, smoothstep(0.34, 0.66, x));\n" +
          "  c = mix(c, c4, smoothstep(0.66, 1.0, x));\n" +
          "  return c;\n" +
          "}\n" +
          "shader_body {\n" +
          // sample with a small MAX-dilation -> THICKER lines, still crisp (max, not blur)
          "vec2 px = 1.0 / resolution;\n" +
          "float tk = 1.7;\n" +
          "vec3 sm = texture2D(sampler_main, uv).rgb;\n" +
          "sm = max(sm, texture2D(sampler_main, uv + vec2(px.x * tk, 0.0)).rgb);\n" +
          "sm = max(sm, texture2D(sampler_main, uv - vec2(px.x * tk, 0.0)).rgb);\n" +
          "sm = max(sm, texture2D(sampler_main, uv + vec2(0.0, px.y * tk)).rgb);\n" +
          "sm = max(sm, texture2D(sampler_main, uv - vec2(0.0, px.y * tk)).rgb);\n" +
          "float lum = clamp(max(sm.r, max(sm.g, sm.b)) * 1.05, 0.0, 1.2);\n" +
          // multi-shade circles (deep violet -> magenta -> pink-white), fade to black
          "vec3 col = pal(lum) * smoothstep(0.02, 0.25, lum);\n" +
          // cheap THRESHOLD bloom: ring-sample the buffer, keep only the BRIGHT parts and
          // add them back as a soft purple halo -> the sharp lines bleed glow into the space
          "vec3 bloom = vec3(0.0);\n" +
          "for (int b = 0; b < 8; b++) {\n" +
          "  float ba = float(b) / 8.0 * 6.2831;\n" +
          "  vec2 bd = vec2(cos(ba), sin(ba));\n" +
          "  bloom += max(texture2D(sampler_main, uv + bd * 4.0 * px).rgb - 0.25, 0.0);\n" +
          "  bloom += max(texture2D(sampler_main, uv + bd * 9.0 * px).rgb - 0.25, 0.0);\n" +
          "}\n" +
          "col += pal(0.62) * (bloom.r + bloom.b) * 0.06;\n" +
          // --- burst particles: fire ONLY on a bass jump (q11=age, q12=strength, q13=seed).
          //     They spawn at the outer-waveform radius and fly OUT to the border on a
          //     WAVY (non-linear) fire trajectory: a perpendicular wobble that grows + a
          //     brightness flicker. When no recent burst, all sparks are dead -> none show.
          "vec2 p = uv - 0.5; p.x *= resolution.x / resolution.y;\n" +
          // subtle deep-purple radial vignette so the shapes don't float in a pure-black vacuum
          "col += vec3(0.05, 0.012, 0.09) * (1.0 - smoothstep(0.10, 0.92, length(p)));\n" +
          "float bAge = q11;\n" +
          "float bStr = q12;\n" +
          "float bSeed = q13;\n" +
          "vec3 part = vec3(0.0);\n" +
          "for (int i = 0; i < 44; i++) {\n" +
          "  float fi = float(i);\n" +
          "  float h1 = pHash(fi * 1.7 + bSeed * 3.1);\n" +        // launch angle (reseeded each burst)
          "  float h2 = pHash(fi * 3.1 + bSeed * 1.7 + 2.0);\n" +  // launch speed
          "  float h3 = pHash(fi * 5.7 + bSeed * 2.3 + 4.0);\n" +  // drag / lifespan
          "  float life = 0.7 + 0.8 * h3;\n" +
          "  float age = bAge / life;\n" +                  // 0 at the jump, >1 = spark gone
          "  if (age < 1.0) {\n" +
          "    float heat = 1.0 - age;\n" +                 // embers cool over their life
          "    float pang = h1 * 6.2831;\n" +
          "    vec2 dir = vec2(cos(pang), sin(pang));\n" +
          "    vec2 perp = vec2(-dir.y, dir.x);\n" +
          // ballistic launch + DRAG -> speed is NON-uniform and decelerates toward terminal
          // velocity (fast off the line, easing out), per-spark v0 and drag constant
          "    float v0 = 0.45 + 1.05 * h2;\n" +
          "    float drag = 2.2 + 3.0 * h3;\n" +
          "    float prog = (1.0 - exp(-age * drag)) / (1.0 - exp(-drag));\n" +   // 0..1 ease-out
          "    float startR = 0.18 + 0.10 * h2;\n" +
          // outward velocity surges with the BASS TRANSIENT (kick punch), not a BPM clock
          "    float pr = startR + (0.30 + 0.50 * v0 + 0.45 * bass_att) * prog;\n" +
          // BUOYANCY (rises while hot) then GRAVITY arc, + turbulence wobble that grows with age
          "    float vert = (0.20 * age - 0.26 * age * age) * (0.6 + 0.8 * h2);\n" +
          "    float wob = (sin(age * 14.0 + h1 * 40.0) + 0.5 * sin(age * 31.0 + fi)) * 0.05 * age;\n" +
          "    vec2 pp = dir * pr + perp * wob + vec2(0.0, vert);\n" +
          "    float d = length(p - pp);\n" +
          "    float flick = 0.65 + 0.35 * sin(age * 34.0 + fi * 2.0);\n" +   // fire flicker
          // size/brightness FLARE with loudness (vol/treb) instead of changing the count:
          // loud -> thick blinding sparks, quiet -> tiny dim embers (keeps dynamic range)
          "    float size = (0.0032 + 0.0038 * heat) * (1.0 + 1.2 * vol_att + 0.6 * treb);\n" +
          "    float spark = (size * size) / (d * d + size * size);\n" +
          "    float si = spark * spark * heat * flick;\n" +
          // colour TEMPERATURE by distance: blinding hot white-pink at the core ->
          // cools to deep electric violet as it flies to the border (cinematic depth)
          "    float radT = clamp((pr - 0.18) / 0.85, 0.0, 1.0);\n" +
          "    vec3 sparkCol = mix(vec3(1.0, 0.80, 1.0), vec3(0.40, 0.0, 1.0), radT);\n" +
          "    part += sparkCol * si;\n" +
          "  }\n" +
          "}\n" +
          "part *= 1.8 * clamp(bStr, 0.0, 2.0);\n" +         // brightness scales with the jump strength
          "col += part;\n" +
          // --- AMBIENT embers: a second layer that is NOT beat-gated. Small, dim, slow
          //     floating sparks that drift outward + rise continuously so the scene stays
          //     alive between kicks. Fade in/out over a long life (sin) so they never pop.
          "for (int j = 0; j < 26; j++) {\n" +
          "  float fj = float(j);\n" +
          "  float a1 = pHash(fj * 2.3 + 11.0);\n" +
          "  float a2 = pHash(fj * 4.1 + 19.0);\n" +
          "  float a3 = pHash(fj * 6.7 + 5.0);\n" +
          "  float elife = 4.0 + 3.0 * a2;\n" +              // long life -> slow drift
          "  float eage = fract(time / elife + a3);\n" +
          "  float eang = a1 * 6.2831 + 0.25 * sin(time * 0.15 + fj);\n" +
          "  float er = 0.08 + eage * (0.55 + 0.25 * a2);\n" +   // drift slowly outward (mid-field)
          "  vec2 edir = vec2(cos(eang), sin(eang));\n" +
          "  vec2 eperp = vec2(-edir.y, edir.x);\n" +
          "  float ewob = sin(eage * 6.0 + a1 * 30.0) * 0.04 * eage;\n" +
          "  vec2 epp = edir * er + eperp * ewob + vec2(0.0, 0.12 * eage - 0.04 * eage * eage);\n" +  // gentle rise
          "  float ed = length(p - epp);\n" +
          "  float efade = sin(eage * 3.14159);\n" +         // smooth fade in -> peak -> out
          "  float esize = 0.0015 + 0.0010 * a2;\n" +        // smaller than the burst sparks
          "  float espark = (esize * esize) / (ed * ed + esize * esize);\n" +
          "  float esi = espark * espark * efade * (0.45 + 0.45 * vol_att);\n" +
          "  col += mix(vec3(0.80, 0.40, 1.0), vec3(0.32, 0.04, 0.85), eage) * esi * 0.55;\n" +  // dim purple, cools out
          "}\n" +
          // central CORE glow: a soft radial energy source that pulses with the bass,
          // anchoring the particle emissions in the middle of the frame
          "float cr = length(p);\n" +
          "float core = exp(-cr * cr * 30.0) * (0.08 + 0.30 * bass_att);\n" +   // smaller + dimmer pulse
          "col += vec3(0.72, 0.22, 1.0) * core;\n" +
          // fill the two hollow 'eyes': a bass-pulsing purple glow at each circle center
          // (q1,q2)/(q3,q4) -> centers feel dense + reactive instead of empty
          "vec2 cA = vec2((q1 - 0.5) * resolution.x / resolution.y, q2 - 0.5);\n" +
          "vec2 cB = vec2((q3 - 0.5) * resolution.x / resolution.y, q4 - 0.5);\n" +
          "float dA = length(p - cA);\n" +
          "float dB = length(p - cB);\n" +
          "col += vec3(0.55, 0.12, 0.95) * (exp(-dA * dA * 60.0) + exp(-dB * dB * 60.0)) * (0.16 + 0.32 * bass_att);\n" +                            // bright PURPLE, not white
          "ret = col;\n" +
          "}\n"
      }
    );
    // Inner circles: clean thin RING outline, mostly STATIC — fixed radius (q5 barely
    // moves) and FIXED brightness (not tied to the beat-punch q10), so they sit as steady
    // "eyes" while the outer ring does the reacting.
    function innerCircle(qx, qy) {
      return {
        baseVals: Object.assign({}, WAVE_BASE, {
          enabled: 1, samples: 256, additive: 1, usedots: 0, scaling: 1,
          smoothing: 0.9, a: 0.7, thick: 1, r: 0.80, g: 0.20, b: 1.0
        }),
        init_eqs: passthrough,
        frame_eqs: passthrough,
        point_eqs: function (a) {
          var r = (a.q5 || 0.05);
          var ang = a.sample * 6.2832;
          a.x = (a[qx] || 0.5) + r * Math.cos(ang);
          a.y = (a[qy] || 0.5) + r * Math.sin(ang);
          a.r = 0.72; a.g = 0.26; a.b = 0.92;   // fixed colour/brightness -> steady, no flashing
          return a;
        }
      };
    }
    // SPIKEY (not noodly) reactive ring: smoothing 0 (sharp joints, no rounding) + the
    // audio sample is sharpened (pow) so most of the ring stays tight and only the loud
    // peaks shoot out as pointed spikes — a spiky star, not a wobbly noodle.
    function waveRing(qx, qy, useSecondChannel) {
      return {
        baseVals: Object.assign({}, WAVE_BASE, {
          enabled: 1, samples: 512, additive: 1, usedots: 0, scaling: 1,
          smoothing: 0.0, a: 0.85, thick: 1, r: 0.80, g: 0.35, b: 1.0
        }),
        init_eqs: passthrough,
        frame_eqs: passthrough,
        point_eqs: function (a) {
          if ((a.q9 !== undefined ? a.q9 : 1) < 0.5) {
            a.x = -2; a.y = -2; return a;
          }
          var ang = a.sample * 6.2832;
          var samp = useSecondChannel ? (a.value2 !== undefined ? a.value2 : a.value1) : a.value1;
          var rad = (a.q6 || 0.11) + (a.q8 || 0.10) * samp;
          rad = Math.max(0.05, Math.min(rad, 0.42));   // clamp BOTH ends -> jagged but can't fly off-screen
          a.x = (a[qx] || 0.5) + rad * Math.cos(ang);
          a.y = (a[qy] || 0.5) + rad * Math.sin(ang);
          var v = (a.q10 !== undefined ? a.q10 : 1);
          a.r = 0.80 * v; a.g = 0.35 * v; a.b = 1.0 * v;
          return a;
        }
      };
    }
    preset.waves[0] = innerCircle("q1", "q2");
    preset.waves[1] = waveRing("q1", "q2", false);
    preset.waves[2] = innerCircle("q3", "q4");
    preset.waves[3] = waveRing("q3", "q4", true);
    return preset;
  })();

  // ── Alchemy Random ─────────────────────────────────────────────────────────
  // WMP11's "Alchemy: Random" is a STATE MACHINE that cycles through several
  // standalone Alchemy themes, crossfading every ~14s. Reproduced from reference
  // frames as a single "mega-preset" with FOUR busy, FULL-FRAME scenes whose
  // backgrounds are rich COLOR GRADIENTS (never black) packed with fine lines,
  // driven by one timed clock (mirrored in the shaders off `time`, since GLSL
  // can't read q-vars). Backgrounds per scene (from the frames):
  //   0 Deep-space fan   — dark blue/purple gradient + a dense radial spoke fan.
  //   1 Perspective bowl — warm amber↔green↔pink mesh dome (radial + concentric).
  //   2 Teal web field   — teal gradient + dense organic web/contour filaments.
  //   3 Color storm      — dramatic red↔blue/purple gradient + a yellow hourglass
  //                        spoke fan + a green central cloud.
  // Persistent foreground motif across ALL scenes (the WMP signature): two SMALL
  // ringed orbs that roam the whole frame and leave coil/bead RECEDE trails (via
  // high decay), joined by a jagged off-center LIGHTNING line, with a central
  // jagged "urchin" waveform. Orbs and the line each fade in/out on independent
  // slow envelopes so they "come and go" and recede separately, never static.
  P["Alchemy Random"] = (function () {
    // Scene clock shared by frame eqs + shaders. Keep D / FADE in sync with the
    // identical constants hard-coded in the GLSL below.
    var SCENE_N = 10;        // number of distinct scenes in the cycle
    var SCENE_D = 8.0;       // seconds per scene
    var SCENE_FADE = 2.0;    // crossfade window (last seconds of each scene)

    // Per-scene config — one entry per scene in the catalog (docs/alchemy-reference.md).
    // shape (central motif): 0 rose · 1 none(orbs/bg-led) · 2 spiral · 3 urchin ·
    //   4 lissajous · 5 star-web · 6 spiderweb · 7 crescent · 8 central waveform bolt.
    // cx/cy = central-motif center (off-center on some); orb = circle visibility;
    // rot = rotation speed. The BACKGROUND look + camera + kaleidoscope + darkness
    // for each scene index are hard-coded in the shaders (alScene/kalFor/gzFor/
    // darkFor/camZoom/camRot) — keep all of them indexed 0..9 in sync with this.
    var SCENES = [
      { shape: 3, cx: 0.50, cy: 0.50, orb: 0.15, rot: 0.25 },  // 0 dandelion / urchin burst
      { shape: 1, cx: 0.50, cy: 0.50, orb: 1.00, rot: 0.10 },  // 1 HERO: two orbs + waveform + bloom
      { shape: 2, cx: 0.50, cy: 0.50, orb: 0.15, rot: 0.45 },  // 2 perspective-tunnel spiral starburst
      { shape: 1, cx: 0.50, cy: 0.50, orb: 0.10, rot: 0.10 },  // 3 kaleidoscope lens-bands (bg-led)
      { shape: 8, cx: 0.50, cy: 0.50, orb: 0.10, rot: 0.10 },  // 4 hexagon mesh + central bolt
      { shape: 8, cx: 0.50, cy: 0.50, orb: 0.10, rot: 0.15 },  // 5 smoke plumes + central bolt
      { shape: 1, cx: 0.40, cy: 0.45, orb: 0.70, rot: 0.10 },  // 6 diagonal comet streaks
      { shape: 6, cx: 0.50, cy: 0.50, orb: 0.15, rot: 0.40 },  // 7 rainbow spiderweb
      { shape: 0, cx: 0.50, cy: 0.55, orb: 0.15, rot: 0.30 },  // 8 vertical-comb wallpaper + rosette
      { shape: 7, cx: 0.45, cy: 0.55, orb: 0.30, rot: 0.50 }   // 9 crescent swirl
    ];

    // Soft on/off envelope from a -1..1 sine: 0 for part of the cycle, smoothly
    // ramping to 1 — gives the rings/line their "come and go" behavior.
    function comeGo(s) {
      var x = (0.5 + 0.5 * s - 0.30) / 0.30;
      x = x < 0 ? 0 : (x > 1 ? 1 : x);
      return x * x * (3 - 2 * x);
    }

    // Bright, saturated cosine-palette color from a hue phase (0..1). The lines in
    // the original are vivid/glowing (gold/blue/magenta); only the BACKGROUND is
    // muted — so geometry uses this, the wash gets desaturated in the comp.
    function hueBright(h) {
      var r = 0.5 + 0.5 * Math.cos(6.2832 * h);
      var g = 0.5 + 0.5 * Math.cos(6.2832 * (h + 0.33));
      var b = 0.5 + 0.5 * Math.cos(6.2832 * (h + 0.67));
      var l = (r + g + b) / 3, s = 0.85;                      // keep saturation (grey/washed-out otherwise);
      return [(r * s + l * (1 - s)) * 0.95, (g * s + l * (1 - s)) * 0.95, (b * s + l * (1 - s)) * 0.95];  // the tonemap tames white
    }

    var preset = build(
      {
        // Moderate decay: the roaming orbs leave coil/bead recede trails without
        // the additive build-up blowing the frame to white. The colorful
        // background is drawn procedurally in comp (NOT fed back), so only the
        // additive orbs/line/spokes accumulate here.
        wave_a: 0, decay: 0.91, gammaadj: 1.3, zoom: 1.0, rot: 0.0,
        warp: 0.0, wrap: 0, darken_center: 0.10, echo_alpha: 0
      },
      {
        frame: function (t) {
          var bass = t.bass_att || t.bass || 1;
          var treb = t.treb_att || t.treb || 1;

          // State machine: current scene + smooth crossfade weight to the next.
          var ph = t.time / SCENE_D;
          var cur = Math.floor(ph) % SCENE_N;
          var fr = ph - Math.floor(ph);              // 0..1 within the scene
          var fadeFrac = SCENE_FADE / SCENE_D;
          var f = (fr - (1 - fadeFrac)) / fadeFrac;  // ramps 0..1 over the fade window
          f = f < 0 ? 0 : (f > 1 ? 1 : f);
          f = f * f * (3 - 2 * f);                   // smoothstep
          var next = (cur + 1) % SCENE_N;
          var sc = SCENES[cur], sn = SCENES[next];

          // Two orbs zipping on independent paths — FAST (the original has quick,
          // whippy movement). Wide travel makes the connecting lightning span
          // corner-to-corner, and with high decay the fast motion drags trails
          // across the whole screen (the "multiple lines everywhere" look).
          var tm = t.time;
          t.q1 = 0.5 + 0.34 * Math.sin(tm * 0.55);          // orb A center
          t.q2 = 0.5 + 0.30 * Math.cos(tm * 0.47);
          t.q3 = 0.5 + 0.32 * Math.cos(tm * 0.43 + 1.0);    // orb B center
          t.q4 = 0.5 + 0.34 * Math.sin(tm * 0.51 + 2.0);
          t.q5 = 0.035 + 0.02 * bass;                       // ring radius

          // Orbs (circles) show per the scene config — mainly the orbs+lightning
          // scene, faint elsewhere so circles don't dominate.
          var orbAmt = sc.orb * (1 - f) + sn.orb * f;
          t.q20 = orbAmt * (0.5 + 0.5 * comeGo(Math.sin(tm * 0.35)));        // orb A
          t.q21 = orbAmt * (0.5 + 0.5 * comeGo(Math.sin(tm * 0.31 + 2.2)));  // orb B
          t.q22 = orbAmt * (0.6 + 0.4 * comeGo(Math.sin(tm * 0.27 + 1.5)));  // thread
          t.q23 = ((tm * 0.05) + 0.16 * cur) % 1;           // hue drift + per-scene hue offset

          // Central motif: center lerps cur->next; rotation speed lerps; shape is
          // cur's motif id. A visibility window dips the alpha near scene edges so
          // the shape can swap during the crossfade without a hard pop.
          t.q26 = sc.cx * (1 - f) + sn.cx * f;              // central center x
          t.q27 = sc.cy * (1 - f) + sn.cy * f;              // central center y
          t.q28 = sc.shape;                                 // central motif id (0..5)
          t.q25 = tm * (sc.rot * (1 - f) + sn.rot * f);     // rotation
          var edge = 0.14;
          var vis = Math.min(fr / edge, (1 - fr) / edge);
          vis = vis < 0 ? 0 : (vis > 1 ? 1 : vis);
          vis = vis * vis * (3 - 2 * vis);                  // fade in after scene start, out before end
          t.q24 = vis * (0.6 + 0.4 * comeGo(Math.sin(tm * 0.24 + 0.7)));  // central presence

          t.q17 = bass;
          t.q18 = tm;
          t.q29 = (bass + (t.mid || 1) + treb) / 3;          // overall loudness (RMS-ish) -> geometry brightness
          t.decay = 0.91;
          return t;
        },
        // Background: four SOFT, MUTED PASTEL washes (no hard grids/fans — those
        // read as neon webs; in the real preset ALL the structure is the central
        // urchin + orbs). Each scene is a gentle 2-tone gradient + a faint soft
        // center warmth; they crossfade on the scene clock.
        comp:
          NOISE_GLSL +
          // Soft MULTI-COLOR bleed: 3 muted tones blended by low-freq fbm + a
          // gentle vertical gradient, slowly drifting — the original's background
          // has several colors bleeding together (not a flat 2-tone wash). This is
          // color blending, NOT the sharp contour "blobs" from before.
          "vec3 bleed(vec3 a, vec3 b, vec3 cc, vec2 d, float gy, float t){\n" +
          "  float n1 = fbm(d*1.3 + vec2(t*0.05, -t*0.04));\n" +
          "  float n2 = fbm(d*0.9 + vec2(-t*0.03, t*0.05) + 7.0);\n" +
          "  vec3 c = mix(a, b, clamp(gy*0.6 + 0.7*(n1-0.5) + 0.5, 0.0, 1.0));\n" +
          "  c = mix(c, cc, smoothstep(0.30, 0.80, n2));\n" +
          "  return c;\n" +
          "}\n" +
          // Structured per-scene BACKGROUND looks (catalog in docs/alchemy-reference.md).
          "vec3 bgLens(vec2 d,float t){ vec2 q=abs(fract(vec2(d.x*3.0, d.y*4.0+sin(d.x*6.0+t)*0.2))-0.5); float eye=smoothstep(0.5,0.2,q.y)*smoothstep(0.5,0.34,q.x); vec3 c=mix(vec3(0.04,0.16,0.14), vec3(0.10,0.42,0.20), eye); c+=vec3(0.5,0.12,0.10)*smoothstep(0.14,0.0,q.y)*0.7; return c; }\n" +  // 3 kaleidoscope lens-bands / eye-lattice
          "vec3 bgHex(vec2 d,float t){ vec2 p=d*6.0; float l1=abs(fract(p.x)-0.5), l2=abs(fract(p.x*0.5+p.y*0.866)-0.5), l3=abs(fract(p.x*0.5-p.y*0.866)-0.5); float g=smoothstep(0.06,0.0,min(min(l1,l2),l3)); return vec3(0.05,0.09,0.15) + vec3(0.25,0.5,0.4)*g*0.5; }\n" +  // 4 hexagon wireframe mesh (steel-blue)
          "vec3 bgSmoke(vec2 d,float t){ vec2 w=d*2.0 + vec2(fbm(d*1.5+t*0.1), fbm(d*1.5-t*0.1)); float n=fbm(w*2.0); vec3 cyc=mix(vec3(0.45,0.10,0.42), vec3(0.10,0.42,0.20), 0.5+0.5*sin(t*0.05)); return cyc*(0.25+0.7*n); }\n" +  // 5 smoke/lava plumes (magenta<->green)
          "vec3 bgComb(vec2 d,float t){ float s=smoothstep(0.46,0.5, abs(fract(d.x*14.0)-0.5)); return mix(vec3(0.05,0.13,0.06), vec3(0.16,0.30,0.12), s); }\n" +  // 8 vertical-comb wallpaper (olive)
          "vec3 bgTunnel(vec2 d,float r,float ang,float t){ float rays=smoothstep(0.5,0.0, abs(fract(ang*8.0/3.14159+0.5)-0.5)); vec3 cyc=mix(vec3(0.10,0.5,0.25), vec3(0.45,0.10,0.40), 0.5+0.5*sin(t*0.05)); return vec3(0.03,0.07,0.05) + cyc*rays*smoothstep(1.7,0.1,r); }\n" +  // 2 perspective-tunnel rays
          "vec3 bgStrata(vec2 d,float gy,float t){ float band=0.5+0.5*sin(gy*16.0 + sin(t*0.3)); vec3 cool=mix(vec3(0.10,0.30,0.34), vec3(0.42,0.12,0.36), 0.5+0.5*sin(t*0.05)); vec3 c=cool*(0.5+0.4*band); c+=vec3(0.5,0.34,0.10)*exp(-dot(d,d)*6.0); return c; }\n" +  // 9 landscape strata + amber clump
          "vec3 alScene(float id, vec2 d, float r, float ang, float gy, float t){\n" +
          "  if(id<0.5) return bleed(vec3(0.10,0.26,0.16), vec3(0.06,0.18,0.12), vec3(0.16,0.10,0.24), d, gy, t);\n" +  // 0 dandelion: dark green field
          "  if(id<1.5) return bleed(vec3(0.04,0.05,0.13), vec3(0.07,0.04,0.11), vec3(0.12,0.06,0.16), d, gy, t);\n" +  // 1 hero: dark navy free-space
          "  if(id<2.5) return bgTunnel(d, r, ang, t);\n" +
          "  if(id<3.5) return bgLens(d, t);\n" +
          "  if(id<4.5) return bgHex(d, t);\n" +
          "  if(id<5.5) return bgSmoke(d, t);\n" +
          "  if(id<6.5) return bleed(vec3(0.20,0.05,0.06), vec3(0.13,0.04,0.08), vec3(0.10,0.05,0.15), d, gy, t);\n" +  // 6 comet: dark maroon
          "  if(id<7.5) return vec3(0.02,0.02,0.045);\n" +     // 7 spiderweb: near-black
          "  if(id<8.5) return bgComb(d, t);\n" +
          "  return bgStrata(d, gy, t);\n" +                    // 9 strata
          "}\n" +
          "float kalFor(float id){ if(id<0.5) return 0.1; if(id<1.5) return 0.0; if(id<2.5) return 0.0; if(id<3.5) return 0.6; if(id<4.5) return 0.3; if(id<5.5) return 0.0; if(id<6.5) return 0.0; if(id<7.5) return 0.3; if(id<8.5) return 0.2; return 0.0; }\n" +  // per-scene kaleidoscope (mirror)
          "float gzFor(float id){ if(id<0.5) return 1.4; if(id<1.5) return 1.2; if(id<2.5) return 1.7; if(id<3.5) return 1.3; if(id<4.5) return 1.2; if(id<5.5) return 1.4; if(id<6.5) return 1.3; if(id<7.5) return 1.5; if(id<8.5) return 1.3; return 1.4; }\n" +  // per-scene geometry zoom (viewport)
          "float darkFor(float id){ if(id<0.5) return 0.5; if(id<1.5) return 0.35; if(id<2.5) return 0.6; if(id<3.5) return 0.95; if(id<4.5) return 0.85; if(id<5.5) return 0.7; if(id<6.5) return 0.5; if(id<7.5) return 0.4; if(id<8.5) return 0.85; return 0.7; }\n" +  // per-scene bg darkness (neon-on-black vs pastel)
          "shader_body {\n" +
          "  vec2 d = uv - 0.5;\n" +
          "  d.x *= resolution.x / resolution.y;\n" +
          "  float r = length(d) * 2.0;\n" +
          "  float pang = atan(d.y, d.x);\n" +   // NOT 'ang'/'rad' — Butterchurn predeclares those
          "  float gy = uv.y;\n" +
          "  float D = 8.0;\n" +                           // == SCENE_D
          "  float ph = time / D;\n" +
          "  float cur = mod(floor(ph), 10.0);\n" +        // == SCENE_N
          "  float nxt = mod(cur + 1.0, 10.0);\n" +
          "  float fr = fract(ph);\n" +
          "  float fade = 2.0 / D;\n" +                    // == SCENE_FADE / SCENE_D
          "  float f = clamp((fr - (1.0 - fade)) / fade, 0.0, 1.0); f = f*f*(3.0-2.0*f);\n" +
          "  vec3 col = mix(alScene(cur, d, r, pang, gy, time), alScene(nxt, d, r, pang, gy, time), f);\n" +
          "  col *= (0.95 + 0.12*bass);\n" +
          "  col *= mix(darkFor(cur), darkFor(nxt), f);\n" +            // neon scenes -> near-black bg, pastel stay light
          "  float km = 0.18 + mix(kalFor(cur), kalFor(nxt), f);\n" +
          "  float Z = mix(gzFor(cur), gzFor(nxt), f);\n" +
          "  vec2 zuv = (uv - 0.5) / Z + 0.5;\n" +
          "  float o = 2.5 / resolution.y;\n" +                         // dilation radius -> THICK lines
          "  vec3 fb = texture2D(sampler_main, zuv).rgb;\n" +
          "  fb = max(fb, texture2D(sampler_main, zuv + vec2(o,0.0)).rgb);\n" +
          "  fb = max(fb, texture2D(sampler_main, zuv - vec2(o,0.0)).rgb);\n" +
          "  fb = max(fb, texture2D(sampler_main, zuv + vec2(0.0,o)).rgb);\n" +
          "  fb = max(fb, texture2D(sampler_main, zuv - vec2(0.0,o)).rgb);\n" +
          "  fb += texture2D(sampler_main, vec2(1.0-zuv.x, zuv.y)).rgb * km;\n" +   // mirror fill (kaleidoscope)
          "  fb += texture2D(sampler_main, vec2(zuv.x, 1.0-zuv.y)).rgb * km;\n" +
          "  vec3 glow = texture2D(sampler_blur1, zuv).rgb + texture2D(sampler_blur2, zuv).rgb;\n" +
          "  vec3 outc = col + fb*0.55 + glow*0.45;\n" +
          "  float hw = (abs(cur-1.0)<0.5 ? (1.0-f) : 0.0) + (abs(nxt-1.0)<0.5 ? f : 0.0);\n" +  // HERO central bloom
          "  outc += vec3(1.0,0.82,0.55) * exp(-r*r*7.0) * (0.12 + 0.6*bass) * hw;\n" +
          "  ret = outc / (outc + vec3(0.9));\n" +                      // Reinhard tone-map: keep color, no white-out
          "}\n",
        // Gentle outward drift + a slow swirl of the feedback (trail) buffer:
        // makes each roaming orb's stamped echoes streak/recede into the coil-and-
        // bead trails seen in the reference, without smearing them into mush.
        warp:
          // Per-scene CAMERA on the feedback (trail) buffer: tunnel push (zoom>1)
          // for the starburst/swirl scenes, flat for the hero/urchin, rotation for
          // the swirl scenes. Computed from the same scene clock as comp/frame.
          "float camZoom(float id){ if(id<0.5) return 1.0; if(id<1.5) return 1.0; if(id<2.5) return 1.018; if(id<3.5) return 1.0; if(id<4.5) return 1.0; if(id<5.5) return 1.008; if(id<6.5) return 1.002; if(id<7.5) return 1.008; if(id<8.5) return 1.004; return 1.012; }\n" +
          "float camRot(float id){ if(id<0.5) return 0.004; if(id<1.5) return 0.0; if(id<2.5) return 0.016; if(id<3.5) return 0.0; if(id<4.5) return 0.0; if(id<5.5) return 0.002; if(id<6.5) return 0.010; if(id<7.5) return 0.016; if(id<8.5) return 0.0; return 0.022; }\n" +
          "shader_body {\n" +
          "  float D = 8.0; float ph = time / D;\n" +
          "  float cur = mod(floor(ph), 10.0); float nxt = mod(cur + 1.0, 10.0);\n" +
          "  float fr = fract(ph); float fade = 2.0 / D;\n" +
          "  float f = clamp((fr - (1.0 - fade)) / fade, 0.0, 1.0); f = f*f*(3.0-2.0*f);\n" +
          "  float zm = mix(camZoom(cur), camZoom(nxt), f);\n" +   // per-scene tunnel zoom
          "  float a = mix(camRot(cur), camRot(nxt), f);\n" +      // per-scene swirl rotation
          "  vec2 d = uv - 0.5;\n" +
          "  float s = sin(a), c = cos(a);\n" +
          "  vec2 ruv = 0.5 + mat2(c, -s, s, c) * d * zm;\n" +
          "  ret = texture2D(sampler_main, ruv).rgb;\n" +
          "  ret -= 0.008;\n" +                          // trim trails so beads stay discrete
          "}\n"
      }
    );

    // Build a custom-wave slot with the shared additive/glow look. point is the
    // per-point function; thick lines fix the "too thin" complaint.
    function sceneWave(point) {
      return {
        baseVals: Object.assign({}, WAVE_BASE, {
          enabled: 1, samples: 512, additive: 1, usedots: 0, scaling: 1,
          smoothing: 0.1, thick: 1, a: 1
        }),
        init_eqs: passthrough,
        frame_eqs: passthrough,
        point_eqs: point
      };
    }

    // A small, clean ringed orb at center (cxq,cyq), faded by envelope envq. As
    // it roams (high decay) it stamps a string of fading rings = the coil/bead
    // RECEDE trail from the reference frames. col = [r,g,b] glow color.
    function orbWave(cxq, cyq, envq, hoff) {
      var w = sceneWave(function (a) {
        var env = a[envq] || 0;
        var ang = a.sample * 6.2832;
        var rad = (a.q5 || 0.04) + 0.010 * a.value1;          // real-waveform ring (subtle, stays circular)
        a.x = (a[cxq] !== undefined ? a[cxq] : 0.4) + rad * Math.cos(ang);
        a.y = (a[cyq] !== undefined ? a[cyq] : 0.5) + rad * Math.sin(ang);
        var c = hueBright((a.q23 || 0) + hoff);                // bright per-scene hue (gold/blue/...)
        a.r = c[0]; a.g = c[1]; a.b = c[2];
        a.a = env * (0.3 + 0.7 * (a.q29 || 1));                // brightness scales with overall volume (RMS)
        return a;
      });
      w.baseVals.smoothing = 0.85;                             // round ring, not jagged
      return w;
    }
    // wave[0],[1] — the two bright roaming orbs (colored by the per-scene hue).
    preset.waves[0] = orbWave("q1", "q2", "q20", 0.0);
    preset.waves[1] = orbWave("q3", "q4", "q21", 0.08);

    // wave[2] — the THICK JAGGED glowing waveform joining the two orbs: a dense
    // high-freq zig-zag plus the live waveform (an electric oscilloscope line,
    // like the original's gold lightning), colored by the per-scene hue. Off
    // center because the orbs roam; spans the frame when they're far apart.
    preset.waves[2] = sceneWave(function (a) {
      var w = a.q22 || 0;
      var ax = a.q1 !== undefined ? a.q1 : 0.35, ay = a.q2 !== undefined ? a.q2 : 0.5;
      var bx = a.q3 !== undefined ? a.q3 : 0.65, by = a.q4 !== undefined ? a.q4 : 0.5;
      var s = a.sample;
      var dx = bx - ax, dy = by - ay;
      var len = Math.sqrt(dx * dx + dy * dy) || 1;
      var px = -dy / len, py = dx / len;                       // unit perpendicular
      var jag = a.value1 * 0.16 + a.value2 * 0.05;             // REAL audio waveform (like Dance) — naturally jagged
      a.x = ax + dx * s + px * jag;
      a.y = ay + dy * s + py * jag;
      var c = hueBright((a.q23 || 0) + 0.04);                  // same hue family as the orbs
      a.r = c[0]; a.g = c[1]; a.b = c[2];
      a.a = w * (0.3 + 0.7 * (a.q29 || 1));                    // brightness scales with overall volume (RMS)
      return a;
    });
    preset.waves[2].baseVals.smoothing = 0.0;                  // jagged, like a real oscilloscope

    // wave[3] — the central "flower urchin": each of the 512 waveform samples
    // shoots a filament outward by its amplitude → a thick spiky star of
    // filaments. Rotates (q25). Bright, complementary to the orbs/thread hue.
    preset.waves[3] = sceneWave(function (a) {
      var cx = a.q26 !== undefined ? a.q26 : 0.5;             // per-scene (possibly off-) center
      var cy = a.q27 !== undefined ? a.q27 : 0.5;
      var shape = a.q28 || 0;
      var rot = a.q25 || 0;
      var s = a.sample, v = a.value1, av = Math.abs(v), th = s * 6.2832;
      var alpha = (a.q24 || 0) * 0.8;
      // Per Gemini: the central "puffballs/rings" SCALE with BASS (kick flare,
      // shrink when quiet); the waveform amplitude adds the jagged detail.
      var bscale = 0.5 + 0.7 * (a.q17 || 1);
      if (shape < 0.5) {
        // 0 ROSE / spirograph: a k-petal curve (rotating; bass-scaled, audio-jagged)
        var rr = bscale * 0.34 * (0.6 + 0.4 * av) * Math.cos(4.0 * th + rot);
        a.x = cx + rr * Math.cos(th); a.y = cy + rr * Math.sin(th);
      } else if (shape < 1.5) {
        // 1 none (orbs + lightning scene): keep the central slot invisible
        a.x = cx; a.y = cy; alpha = 0.0;
      } else if (shape < 2.5) {
        // 2 SPIRAL S-arms rotating from center (decay leaves the trails)
        var ARMS = 3.0, seg = Math.floor(s * ARMS), u = s * ARMS - seg;
        var th2 = u * 2.5 * 6.2832 + seg * (6.2832 / ARMS) + rot;
        var rr2 = bscale * u * 0.40 + 0.04 * v;
        a.x = cx + rr2 * Math.cos(th2); a.y = cy + rr2 * Math.sin(th2);
        if (u < 0.02) alpha = 0.0;                            // hide the jump between arms
      } else if (shape < 3.5) {
        // 3 URCHIN: real-waveform radial filaments; bass flares the whole burst
        var rad = bscale * (0.08 + 0.26 * av), ang = th + rot;
        a.x = cx + rad * Math.cos(ang); a.y = cy + rad * Math.sin(ang);
      } else if (shape < 4.5) {
        // 4 LISSAJOUS figure (bass-scaled, audio-jittered)
        a.x = cx + bscale * (0.34 + 0.05 * v) * Math.sin(3.0 * th + rot);
        a.y = cy + bscale * (0.32 + 0.05 * v) * Math.sin(2.0 * th);
      } else if (shape < 5.5) {
        // 5 STAR-WEB: star polygon (non-integer angular step) + waveform radius
        var th5 = th * 2.5 + rot, rr5 = bscale * 0.32 * (0.7 + 0.3 * av);
        a.x = cx + rr5 * Math.cos(th5); a.y = cy + rr5 * Math.sin(th5);
      } else if (shape < 6.5) {
        // 6 SPIDERWEB: many fine radial spokes (dense), bass-flared, rotating
        var SPK = 24.0, sp = Math.floor(s * SPK), u6 = s * SPK - sp;
        var ang6 = sp * (6.2832 / SPK) + rot;
        var rr6 = bscale * (0.05 + u6 * 0.45) + 0.03 * v;
        a.x = cx + rr6 * Math.cos(ang6); a.y = cy + rr6 * Math.sin(ang6);
        if (u6 < 0.02) alpha = 0.0;                           // hide spoke-to-spoke jumps
      } else if (shape < 7.5) {
        // 7 CRESCENT: a single arc (half sweep); the feedback swirl smears it into
        // the comma/crescent seen in the original.
        var ca = s * 3.1416 + rot, rr7 = bscale * 0.34 + 0.04 * v;
        a.x = cx + rr7 * Math.cos(ca); a.y = cy + rr7 * Math.sin(ca);
      } else {
        // 8 BOLT: a central vertical waveform line (for the hex-mesh / smoke scenes)
        a.x = cx + (a.value1 * 0.16 + a.value2 * 0.05);
        a.y = 0.08 + s * 0.84;
      }
      var c = hueBright((a.q23 || 0) + 0.5);                  // complementary to orbs/thread
      a.r = c[0]; a.g = c[1]; a.b = c[2];
      a.a = alpha * (0.3 + 0.7 * (a.q29 || 1));               // brightness scales with overall volume (RMS)
      return a;
    });
    preset.waves[3].baseVals.smoothing = 0.0;
    return preset;
  })();

  // ── Alchemy v2: Orbiters ─────────────────────────────────────────────────────
  // First preset of the Alchemy v2 framework (see docs/alchemy-v2/). A focused,
  // CRISP recreation of the WMP "Orbiters" signature that fixes the gaps the user
  // flagged in the current Alchemy:
  //   • the central "flower" IS the live audio waveform (radial scope), not drawn loops
  //   • the two orbs are joined by ONE thin LIGHTNING line (a single waveLine with a
  //     small, fast, treb-driven zig-zag) — NOT a wide thick fuzzy band
  //   • SMALL bright ringed orbs (white "Saturn" rings); the orb:line ratio favors the line
  //   • crisp thin high-alpha strokes; feedback sits BEHIND the geometry (no blur smear)
  //   • a COMPLEX dusty fbm fluid background (teal<->purple), never flat black
  //   • Reinhard tone-map so additive cores glow without blowing out to white
  // Audio: bass -> orb/flower size + bg breathe; mid -> flower amplitude + hue rate;
  // treb -> lightning amplitude + ring brightness. Hue cycles slowly, energy-coupled.
  // Does NOT touch "Alchemy Random" — this is a separate, additive entry.
  P["Alchemy v2: Orbiters"] = (function () {
    var huePhase = 0, lastT = 0;        // energy-coupled hue accumulator (closure state)

    var preset = build(
      {
        wave_a: 0,            // primary waveform off; the custom waves draw everything
        decay: 0.92,          // short, CRISP trail (dotted orb beads), not a smear
        gammaadj: 1.3,
        zoom: 0.995,          // slight INWARD drift keeps trails compact (1.0 made them sprawl)
        rot: 0.0,
        warp: 0.0,            // no sinusoidal warp -> lines stay clean/sharp
        wrap: 0,              // clamp (no edge-wrap border artifact)
        darken_center: 0.06,  // keep the busy center from over-blooming
        echo_alpha: 0
      },
      {
        frame: function (t) {
          var bass = t.bass_att || t.bass || 1;
          var mid = t.mid_att || t.mid || 1;
          var treb = t.treb_att || t.treb || 1;
          var tm = t.time;

          // energy-coupled hue drift: faster when the music is loud, slow when calm
          var dt = Math.min(0.1, Math.max(0, tm - lastT)); lastT = tm;
          var energy = (bass + mid + treb) / 3;
          huePhase = (huePhase + dt * (0.02 + 0.06 * energy)) % 1;

          // two orbs on opposing elliptical orbits (180 deg apart) -> the single
          // tether between them reads as ONE clean lightning line through center.
          var th = tm * 0.42;
          t.q1 = 0.5 + 0.27 * Math.cos(th);            // orb A center
          t.q2 = 0.5 + 0.20 * Math.sin(th * 1.06);
          t.q3 = 0.5 + 0.27 * Math.cos(th + Math.PI);  // orb B center (opposite)
          t.q4 = 0.5 + 0.20 * Math.sin(th * 1.06 + Math.PI);

          t.q5 = 0.018 + 0.012 * bass;                 // orb core radius (SMALL)
          t.q6 = t.q5 * 2.1 + 0.006;                   // Saturn-ring radius (just outside core)
          t.q7 = 0.012 + 0.045 * treb;                 // lightning displacement (SMALL + fast)
          t.q8 = huePhase;                             // (reserved) shared hue phase

          t.q9 = 0.085 + 0.05 * bass;                  // central flower base radius
          t.q10 = 0.05 + 0.06 * mid;                   // flower waveform amplitude
          t.q11 = (huePhase + 0.45) % 1;               // flower hue (offset from orbs)
          t.q12 = energy;                              // loudness -> bg breathe / brightness
          return t;
        },
        // feedback: recede + trim, NO blur. zoom (baseVal) shrinks old frames inward
        // into a dotted bead trail; the live strokes (drawn after) stay razor-sharp.
        warp:
          "shader_body {\n" +
          "ret = texture2D(sampler_main, uv).rgb;\n" +
          "ret -= 0.006;\n" +
          "}\n",
        // COMPLEX dusty fluid background + crisp additive geometry + Reinhard tone-map.
        comp:
          NOISE_GLSL + ALC_FLUID_GLSL +
          "shader_body {\n" +
          "vec2 d = uv - 0.5; d.x *= resolution.x / resolution.y;\n" +
          "float vig = 1.0 - smoothstep(0.22, 0.95, length(d));\n" +
          "vec3 bg = alcFluid(uv * 2.0, time, bass) * vig;\n" +
          "vec3 sharp = texture2D(sampler_main, uv).rgb;\n" +                 // geometry + recede trails
          "vec3 glow = (texture2D(sampler_blur1, uv).rgb + texture2D(sampler_blur2, uv).rgb) * 0.5;\n" +
          "vec3 outc = bg + sharp + glow * 0.30;\n" +
          "ret = outc / (outc + vec3(0.85));\n" +                            // Reinhard: glow, never white-out
          "}\n"
      }
    );

    // central FLOWER = the live audio waveform as a radial scope (the U3 fix). Each
    // of the 512 samples is a spoke whose radius = base + amp*value1 -> jagged petals.
    function waveFlower() {
      return {
        baseVals: Object.assign({}, WAVE_BASE, {
          enabled: 1, samples: 512, additive: 1, usedots: 0, scaling: 1,
          smoothing: 0.06, a: 0.8, thick: 0
        }),
        init_eqs: passthrough, frame_eqs: passthrough,
        point_eqs: function (a) {
          var ang = a.sample * 6.2832;
          var rad = (a.q9 || 0.1) + (a.q10 || 0.05) * (a.value1 || 0);
          if (rad < 0.02) rad = 0.02;
          a.x = 0.5 + rad * Math.cos(ang);
          a.y = 0.5 + rad * Math.sin(ang);
          var h = a.q11 || 0;                          // dusty (desaturated) hue
          var rr = 0.5 + 0.5 * Math.cos(6.2832 * h);
          var gg = 0.5 + 0.5 * Math.cos(6.2832 * (h + 0.33));
          var bb = 0.5 + 0.5 * Math.cos(6.2832 * (h + 0.67));
          var l = (rr + gg + bb) / 3, s = 0.62;
          a.r = (rr * s + l * (1 - s)) * 0.85;
          a.g = (gg * s + l * (1 - s)) * 0.85;
          a.b = (bb * s + l * (1 - s)) * 0.85;
          return a;
        }
      };
    }

    // SINGLE lightning tether A->B (the U4 fix): one thin line, small fast perpendicular
    // displacement from the live waveform -> a crisp lightning filament, not a fuzzy band.
    function tether() {
      return {
        baseVals: Object.assign({}, WAVE_BASE, {
          enabled: 1, samples: 512, additive: 1, usedots: 0, scaling: 1,
          smoothing: 0.03, a: 0.9, thick: 0, r: 0.62, g: 0.85, b: 1.0
        }),
        init_eqs: passthrough, frame_eqs: passthrough,
        point_eqs: function (a) {
          var ax = a.q1 !== undefined ? a.q1 : 0.4, ay = a.q2 !== undefined ? a.q2 : 0.5;
          var bx = a.q3 !== undefined ? a.q3 : 0.6, by = a.q4 !== undefined ? a.q4 : 0.5;
          var dx = bx - ax, dy = by - ay;
          var len = Math.sqrt(dx * dx + dy * dy) || 1;
          var nx = -dy / len, ny = dx / len;            // unit perpendicular
          var s = a.sample;                              // 0..1 from A to B
          var disp = (a.value1 || 0) * (a.q7 || 0.03);
          a.x = ax + s * dx + nx * disp;
          a.y = ay + s * dy + ny * disp;
          a.r = 0.65; a.g = 0.85; a.b = 1.0;             // electric blue-white lightning
          return a;
        }
      };
    }

    // SMALL orb core: a tiny bright smooth ring that reads as a glowing node under bloom.
    function orbCore(qx, qy) {
      return {
        baseVals: Object.assign({}, WAVE_BASE, {
          enabled: 1, samples: 80, additive: 1, usedots: 0, scaling: 1,
          smoothing: 0.9, a: 0.95, thick: 1, r: 1.0, g: 0.72, b: 0.34
        }),
        init_eqs: passthrough, frame_eqs: passthrough,
        point_eqs: function (a) {
          var r = a.q5 || 0.02;
          var ang = a.sample * 6.2832;
          a.x = (a[qx] || 0.5) + r * Math.cos(ang);
          a.y = (a[qy] || 0.5) + r * Math.sin(ang);
          a.r = 1.0; a.g = 0.72; a.b = 0.34;
          return a;
        }
      };
    }

    // thin near-white "Saturn" ring around each orb (the orb:line ratio detail).
    function orbRing(qx, qy) {
      return {
        baseVals: Object.assign({}, WAVE_BASE, {
          enabled: 1, samples: 96, additive: 1, usedots: 0, scaling: 1,
          smoothing: 0.9, a: 0.5, thick: 0, r: 0.85, g: 0.92, b: 1.0
        }),
        init_eqs: passthrough, frame_eqs: passthrough,
        point_eqs: function (a) {
          var r = a.q6 || 0.05;
          var ang = a.sample * 6.2832;
          a.x = (a[qx] || 0.5) + r * Math.cos(ang);
          a.y = (a[qy] || 0.5) + r * Math.sin(ang);
          a.r = 0.85; a.g = 0.92; a.b = 1.0;
          return a;
        }
      };
    }

    preset.waves[0] = waveFlower();        // central live-waveform flower (back)
    preset.waves[1] = tether();            // single lightning line A<->B
    preset.waves[2] = orbCore("q1", "q2"); // orb A
    preset.waves[3] = orbCore("q3", "q4"); // orb B
    preset.waves[4] = orbRing("q1", "q2"); // orb A Saturn ring
    preset.waves[5] = orbRing("q3", "q4"); // orb B Saturn ring
    return preset;
  })();

  // ── Alchemy v2: Kaleidoscope ─────────────────────────────────────────────────
  // Phase 2 background showcase for the Alchemy v2 framework: the WMP "2D kaleidoscope
  // tunnel" look — a central LIVE-WAVEFORM burst mirrored into a 4-fold kaleidoscope
  // over a COMPLEX, colored lens-arc background (concentric color bands warped by angle,
  // slowly cycling). Vivid is allowed here (the reference kaleidoscope genuinely
  // saturates — the muting rule is relaxed for it), but Reinhard still caps white.
  // Directly answers the "background is too black / should be complex & colored" gap.
  // Audio: bass -> zoom "surge" (tunnel push) + bg brightness; mid -> burst amplitude;
  // treb -> rotation spin. Hue cycles, energy-coupled.
  P["Alchemy v2: Kaleidoscope"] = (function () {
    var huePhase = 0, lastT = 0;
    var preset = build(
      {
        wave_a: 0, decay: 0.95, gammaadj: 1.3, zoom: 1.0, rot: 0.012,
        warp: 0.0, wrap: 0, darken_center: 0.04, echo_alpha: 0
      },
      {
        frame: function (t) {
          var bass = t.bass_att || t.bass || 1;
          var mid = t.mid_att || t.mid || 1;
          var treb = t.treb_att || t.treb || 1;
          var tm = t.time;
          var dt = Math.min(0.1, Math.max(0, tm - lastT)); lastT = tm;
          huePhase = (huePhase + dt * (0.04 + 0.10 * ((bass + mid + treb) / 3))) % 1;
          t.zoom = 1.0 + 0.05 * bass;            // bass "surge" -> tunnel pushes inward
          t.rot = 0.012 + 0.02 * treb;           // slow rotation; treb spins it faster
          t.q9 = 0.10 + 0.05 * bass;             // burst base radius
          t.q10 = 0.10 + 0.10 * mid;             // burst waveform amplitude (dramatic)
          t.q11 = huePhase;                      // burst hue
          return t;
        },
        warp:
          "shader_body {\n" +
          "ret = texture2D(sampler_main, uv).rgb;\n" +
          "ret -= 0.004;\n" +
          "}\n",
        comp:
          PAL_GLSL +
          "shader_body {\n" +
          "vec2 d = uv - 0.5; d.x *= resolution.x / resolution.y;\n" +
          "float pr = length(d);\n" +                  // NOT 'rad' (reserved/predeclared)
          "float pa = atan(d.y, d.x);\n" +             // NOT 'ang' (reserved/predeclared)
          // 4-fold kaleidoscope: additively overlay the geometry mirrored in x, y and both
          "vec3 g = texture2D(sampler_main, uv).rgb;\n" +
          "g += texture2D(sampler_main, vec2(1.0 - uv.x, uv.y)).rgb;\n" +
          "g += texture2D(sampler_main, vec2(uv.x, 1.0 - uv.y)).rgb;\n" +
          "g += texture2D(sampler_main, vec2(1.0 - uv.x, 1.0 - uv.y)).rgb;\n" +
          // COMPLEX colored background: concentric lens-arc bands, petal-warped by angle
          "float bands = 0.5 + 0.5 * sin(pr * 20.0 - time * 1.4 + sin(pa * 6.0) * 1.3);\n" +
          // fade the procedural bands OUT of the center -> dark pupil + the live waveform
          // burst own the middle (no fixed drawn 'flower'); complex color stays outer.
          "float fade = smoothstep(0.04, 0.42, pr);\n" +
          "vec3 bg = pal(pr * 0.7 + time * 0.05) * bands * (0.16 + 0.12 * bass) * fade;\n" +
          "vec3 outc = bg + g * 0.72;\n" +
          "ret = outc / (outc + vec3(0.7));\n" +       // Reinhard (slightly hotter -> vivid)
          "}\n"
      }
    );

    // central live-waveform BURST (radial scope); the comp mirrors it into the kaleidoscope.
    function burst(useSecond) {
      return {
        baseVals: Object.assign({}, WAVE_BASE, {
          enabled: 1, samples: 512, additive: 1, usedots: 0, scaling: 1,
          smoothing: 0.05, a: 0.85, thick: 0
        }),
        init_eqs: passthrough, frame_eqs: passthrough,
        point_eqs: function (a) {
          var ang = a.sample * 6.2832;
          var samp = useSecond ? (a.value2 !== undefined ? a.value2 : a.value1) : a.value1;
          var rad = (a.q9 || 0.1) + (a.q10 || 0.1) * (samp || 0);
          if (rad < 0.02) rad = 0.02;
          a.x = 0.5 + rad * Math.cos(ang);
          a.y = 0.5 + rad * Math.sin(ang);
          var h = (a.q11 || 0) + a.sample * 0.15;       // hue varies slightly around the ring
          a.r = 0.5 + 0.5 * Math.cos(6.2832 * h);
          a.g = 0.5 + 0.5 * Math.cos(6.2832 * (h + 0.33));
          a.b = 0.5 + 0.5 * Math.cos(6.2832 * (h + 0.67));
          return a;
        }
      };
    }
    preset.waves[0] = burst(false);
    preset.waves[1] = burst(true);
    return preset;
  })();

  // ── Alchemy v2: Anemone Pulsar ───────────────────────────────────────────────
  // The emotional center of WMP Alchemy: a dusty rose/magenta furry ANEMONE (a radial
  // live-waveform scope with a dark pupil) that PULSES with the bass, flanked by the two
  // orbiters joined by one thin tether — all on a flat SOLID-COLOR background that SNAPS
  // between muted cobalt / sage / plum (the Alchemy hallmark; a new bg mode for the kit).
  // This is a MUTED scene (the muting rule applies — dusty, tone-mapped, no neon/white).
  // Audio: bass -> anemone pulse + bg brightness; mid -> fur amplitude; treb -> tether zig.
  P["Alchemy v2: Anemone Pulsar"] = (function () {
    var huePhase = 0, lastT = 0;
    var preset = build(
      {
        wave_a: 0, decay: 0.90, gammaadj: 1.3, zoom: 0.997,  // shorter decay -> compact orb beads, less coil
        rot: 0.0, warp: 0.0, wrap: 0, darken_center: 0.05, echo_alpha: 0
      },
      {
        frame: function (t) {
          var bass = t.bass_att || t.bass || 1;
          var mid = t.mid_att || t.mid || 1;
          var treb = t.treb_att || t.treb || 1;
          var tm = t.time;
          var dt = Math.min(0.1, Math.max(0, tm - lastT)); lastT = tm;
          huePhase = (huePhase + dt * (0.015 + 0.05 * ((bass + mid + treb) / 3))) % 1;
          var th = tm * 0.33;                          // slow flanking orbit
          t.q1 = 0.5 + 0.34 * Math.cos(th);            // orb A — CIRCULAR orbit, radius 0.34 so both
          t.q2 = 0.5 + 0.34 * Math.sin(th);            //   orbs sit clearly OUTSIDE the anemone fur
          t.q3 = 0.5 + 0.34 * Math.cos(th + Math.PI);  // orb B (opposite) — not masked, not in a corner
          t.q4 = 0.5 + 0.34 * Math.sin(th + Math.PI);
          t.q5 = 0.016 + 0.012 * bass;                 // orb core radius
          t.q6 = t.q5 * 2.1 + 0.006;                   // Saturn ring
          t.q7 = 0.010 + 0.035 * treb;                 // tether lightning amplitude (small)
          t.q9 = 0.07 + 0.06 * bass;                   // anemone base radius — smaller so the
          t.q10 = 0.04 + 0.05 * mid;                   //   flanking orbs sit OUTSIDE the fur (PULSAR pulse)
          t.q11 = huePhase;                            // hue drift (kept in the rose/magenta band below)
          return t;
        },
        warp:
          "shader_body {\n" +
          "ret = texture2D(sampler_main, uv).rgb;\n" +
          "ret -= 0.005;\n" +
          "}\n",
        // SOLID-COLOR-SNAP background mode: a flat muted color that hard-snaps every few
        // seconds, with a faint fbm wash for life, a vignette, and a dark central pupil.
        comp:
          NOISE_GLSL +
          "shader_body {\n" +
          "vec2 d = uv - 0.5; d.x *= resolution.x / resolution.y;\n" +
          "float pr = length(d);\n" +
          "float idx = mod(floor(time / 6.0), 3.0);\n" +          // snap every 6s
          "vec3 c0 = vec3(0.09, 0.14, 0.30);\n" +                 // dusty cobalt
          "vec3 c1 = vec3(0.10, 0.17, 0.12);\n" +                 // dusty sage
          "vec3 c2 = vec3(0.16, 0.07, 0.18);\n" +                 // dusty plum
          "vec3 solid = idx < 0.5 ? c0 : (idx < 1.5 ? c1 : c2);\n" +
          "float wash = 0.85 + 0.30 * fbm(uv * 2.2 + vec2(time * 0.03, -time * 0.02));\n" +
          "float vig = 1.0 - 0.45 * smoothstep(0.25, 1.1, pr);\n" +
          "float pupil = smoothstep(0.0, 0.16, pr);\n" +          // dark center -> the anemone's eye
          "vec3 bg = solid * wash * vig * pupil * (0.9 + 0.15 * bass);\n" +
          "vec3 g = texture2D(sampler_main, uv).rgb;\n" +
          "vec3 glow = (texture2D(sampler_blur1, uv).rgb + texture2D(sampler_blur2, uv).rgb) * 0.5;\n" +
          "vec3 outc = bg + g + glow * 0.30;\n" +
          "ret = outc / (outc + vec3(0.9));\n" +                  // Reinhard, muted (k=0.9)
          "}\n"
      }
    );

    // the ANEMONE: a radial live-waveform scope, dusty rose/magenta, dark pupil.
    function anemone(useSecond) {
      return {
        baseVals: Object.assign({}, WAVE_BASE, {
          enabled: 1, samples: 512, additive: 1, usedots: 0, scaling: 1,
          smoothing: 0.04, a: 0.7, thick: 0
        }),
        init_eqs: passthrough, frame_eqs: passthrough,
        point_eqs: function (a) {
          var ang = a.sample * 6.2832;
          var samp = useSecond ? (a.value2 !== undefined ? a.value2 : a.value1) : a.value1;
          var rad = (a.q9 || 0.12) + (a.q10 || 0.06) * (samp || 0);
          if (rad < 0.03) rad = 0.03;
          a.x = 0.5 + rad * Math.cos(ang);
          a.y = 0.5 + rad * Math.sin(ang);
          var h = 0.90 + 0.10 * Math.sin(6.2832 * (a.q11 || 0));   // dusty rose <-> magenta band
          var rr = 0.5 + 0.5 * Math.cos(6.2832 * h);
          var gg = 0.5 + 0.5 * Math.cos(6.2832 * (h + 0.33));
          var bb = 0.5 + 0.5 * Math.cos(6.2832 * (h + 0.67));
          var l = (rr + gg + bb) / 3, s = 0.55;
          a.r = (rr * s + l * (1 - s)) * 0.8;
          a.g = (gg * s + l * (1 - s)) * 0.8;
          a.b = (bb * s + l * (1 - s)) * 0.8;
          return a;
        }
      };
    }
    // single thin lightning tether between the flanking orbs (fainter here so it doesn't
    // overpower the anemone).
    function tether() {
      return {
        baseVals: Object.assign({}, WAVE_BASE, {
          enabled: 1, samples: 512, additive: 1, usedots: 0, scaling: 1,
          smoothing: 0.03, a: 0.55, thick: 0, r: 0.62, g: 0.85, b: 1.0
        }),
        init_eqs: passthrough, frame_eqs: passthrough,
        point_eqs: function (a) {
          var ax = a.q1 !== undefined ? a.q1 : 0.4, ay = a.q2 !== undefined ? a.q2 : 0.5;
          var bx = a.q3 !== undefined ? a.q3 : 0.6, by = a.q4 !== undefined ? a.q4 : 0.5;
          var dx = bx - ax, dy = by - ay;
          var len = Math.sqrt(dx * dx + dy * dy) || 1;
          var nx = -dy / len, ny = dx / len;
          var s = a.sample;
          var disp = (a.value1 || 0) * (a.q7 || 0.03);
          a.x = ax + s * dx + nx * disp;
          a.y = ay + s * dy + ny * disp;
          a.r = 0.6; a.g = 0.8; a.b = 1.0;
          return a;
        }
      };
    }
    // cr/cg/cb let each orb be tinted (orb B is tinted distinctly as a diagnostic to
    // confirm it renders; if both show, we'll decide same-color vs distinct).
    function orbCore(qx, qy, cr, cg, cb) {
      return {
        baseVals: Object.assign({}, WAVE_BASE, {
          enabled: 1, samples: 80, additive: 1, usedots: 0, scaling: 1,
          smoothing: 0.9, a: 0.95, thick: 1, r: cr, g: cg, b: cb
        }),
        init_eqs: passthrough, frame_eqs: passthrough,
        point_eqs: function (a) {
          var r = a.q5 || 0.02; var ang = a.sample * 6.2832;
          a.x = (a[qx] || 0.5) + r * Math.cos(ang);
          a.y = (a[qy] || 0.5) + r * Math.sin(ang);
          a.r = cr; a.g = cg; a.b = cb;
          return a;
        }
      };
    }
    function orbRing(qx, qy, cr, cg, cb) {
      return {
        baseVals: Object.assign({}, WAVE_BASE, {
          enabled: 1, samples: 96, additive: 1, usedots: 0, scaling: 1,
          smoothing: 0.9, a: 0.25, thick: 0, r: cr, g: cg, b: cb
        }),
        init_eqs: passthrough, frame_eqs: passthrough,
        point_eqs: function (a) {
          var r = a.q6 || 0.05; var ang = a.sample * 6.2832;
          a.x = (a[qx] || 0.5) + r * Math.cos(ang);
          a.y = (a[qy] || 0.5) + r * Math.sin(ang);
          a.r = cr; a.g = cg; a.b = cb;
          return a;
        }
      };
    }
    // 6-wave layout, identical to the known-good Orbiters preset. NOTE: a 7-wave version
    // (two anemone channels) made the 7th wave (orb B's ring) fail to render — this build
    // only reliably draws ~6 enabled custom waves. Keep orb waves at low indices.
    preset.waves[0] = anemone(false);                         // anemone fur
    preset.waves[1] = tether();                               // thin lightning between the orbs
    preset.waves[2] = orbCore("q1", "q2", 1.0, 0.72, 0.34);   // orb A core (gold)
    preset.waves[3] = orbCore("q3", "q4", 1.0, 0.72, 0.34);   // orb B core (gold — matches A)
    preset.waves[4] = orbRing("q1", "q2", 0.85, 0.92, 1.0);   // orb A ring (white)
    preset.waves[5] = orbRing("q3", "q4", 0.85, 0.92, 1.0);   // orb B ring (white)
    return preset;
  })();

  // ── Alchemy v2: Vortex ───────────────────────────────────────────────────────
  // The WMP "swirling vortex": NOT a drawn pinwheel — the spiral is generated by FEEDBACK.
  // A central live-waveform burst (+ two orbs) is dragged into a spiral galaxy by an inward
  // pull plus a radius-proportional TWIST in the warp shader (twist grows toward the
  // center -> "water down a drain"), leaving a dark central pupil, over a hazy purple/green
  // field. Muted + Reinhard. Audio: bass -> inward pull + burst size; mid -> twist speed;
  // treb -> burst fur. (<=6 custom waves per the build's wave cap.)
  P["Alchemy v2: Vortex"] = (function () {
    var huePhase = 0, lastT = 0;
    var preset = build(
      {
        wave_a: 0, decay: 0.95, gammaadj: 1.3, zoom: 1.0,   // inward pull + twist done in warp
        rot: 0.0, warp: 0.0, wrap: 0, darken_center: 0.10, echo_alpha: 0
      },
      {
        frame: function (t) {
          var bass = t.bass_att || t.bass || 1;
          var mid = t.mid_att || t.mid || 1;
          var treb = t.treb_att || t.treb || 1;
          var tm = t.time;
          var dt = Math.min(0.1, Math.max(0, tm - lastT)); lastT = tm;
          huePhase = (huePhase + dt * (0.02 + 0.05 * ((bass + mid + treb) / 3))) % 1;
          var th = tm * 0.3;                           // orbs being pulled around the vortex (slower)
          t.q1 = 0.5 + 0.30 * Math.cos(th);
          t.q2 = 0.5 + 0.30 * Math.sin(th);
          t.q3 = 0.5 + 0.30 * Math.cos(th + Math.PI);
          t.q4 = 0.5 + 0.30 * Math.sin(th + Math.PI);
          t.q5 = 0.015 + 0.010 * bass;                 // orb core radius (small)
          t.q9 = 0.06 + 0.05 * bass;                   // central burst base radius
          t.q10 = 0.05 + 0.06 * mid;                   // burst fur amplitude
          t.q11 = huePhase;                            // hue (green<->magenta band below)
          return t;
        },
        // FEEDBACK = the vortex: rotate each sample coord by a twist that GROWS toward the
        // center, and pull inward (scale<1). Over frames the live geometry smears into
        // spiral arms. mid speeds the twist; bass deepens the inward pull.
        warp:
          "shader_body {\n" +
          "vec2 c = uv - 0.5;\n" +
          "float pr = length(c);\n" +
          // Halve BOTH twist and inward-pull vs the first tight version: spiral pitch
          // (tightness ~ tw/(1-sc)) is preserved, but spin + inward flow run ~half speed.
          "float tw = 0.035 + 0.035 * mid + 0.09 / (pr * 6.0 + 1.0);\n" +
          "float sc = 0.991 - 0.006 * bass;\n" +
          "float s = sin(tw), co = cos(tw);\n" +
          "vec2 sd = vec2(c.x * co - c.y * s, c.x * s + c.y * co) * sc + 0.5;\n" +
          "ret = texture2D(sampler_main, sd).rgb;\n" +
          "ret -= 0.004;\n" +
          "}\n",
        comp:
          NOISE_GLSL +
          "shader_body {\n" +
          "vec2 d = uv - 0.5; d.x *= resolution.x / resolution.y;\n" +
          "float pr = length(d);\n" +
          "float n = fbm(uv * 2.0 + vec2(time * 0.03, -time * 0.025));\n" +
          "vec3 haze = mix(vec3(0.04, 0.02, 0.07), vec3(0.03, 0.10, 0.06), n);\n" +  // purple <-> green
          "float vig = 1.0 - smoothstep(0.2, 1.0, pr);\n" +
          "haze *= vig * (0.5 + 0.4 * bass);\n" +
          "haze *= smoothstep(0.0, 0.12, pr);\n" +                 // dark central pupil
          "vec3 g = texture2D(sampler_main, uv).rgb;\n" +
          "vec3 glow = (texture2D(sampler_blur1, uv).rgb + texture2D(sampler_blur2, uv).rgb) * 0.5;\n" +
          "vec3 outc = haze + g + glow * 0.35;\n" +
          "ret = outc / (outc + vec3(0.85));\n" +
          "}\n"
      }
    );

    // central live-waveform burst (feeds the vortex); muted green<->magenta.
    function burst(useSecond) {
      return {
        baseVals: Object.assign({}, WAVE_BASE, {
          enabled: 1, samples: 512, additive: 1, usedots: 0, scaling: 1,
          smoothing: 0.05, a: 0.8, thick: 0
        }),
        init_eqs: passthrough, frame_eqs: passthrough,
        point_eqs: function (a) {
          var ang = a.sample * 6.2832;
          var samp = useSecond ? (a.value2 !== undefined ? a.value2 : a.value1) : a.value1;
          var rad = (a.q9 || 0.08) + (a.q10 || 0.05) * (samp || 0);
          if (rad < 0.03) rad = 0.03;
          a.x = 0.5 + rad * Math.cos(ang);
          a.y = 0.5 + rad * Math.sin(ang);
          var h = 0.33 + 0.59 * (0.5 + 0.5 * Math.sin(6.2832 * ((a.q11 || 0) + a.sample * 0.25)));  // green<->magenta
          var rr = 0.5 + 0.5 * Math.cos(6.2832 * h);
          var gg = 0.5 + 0.5 * Math.cos(6.2832 * (h + 0.33));
          var bb = 0.5 + 0.5 * Math.cos(6.2832 * (h + 0.67));
          var l = (rr + gg + bb) / 3, sat = 0.6;
          a.r = (rr * sat + l * (1 - sat)) * 0.8;
          a.g = (gg * sat + l * (1 - sat)) * 0.8;
          a.b = (bb * sat + l * (1 - sat)) * 0.8;
          return a;
        }
      };
    }
    // orb = a small FILLED glow-disc (samples fill a tiny disc, drawn as dots). Big enough
    // (~16px) to survive the warp resampling, so its per-frame feedback stamps merge into a
    // continuous bright spiral STREAK — not a chain of rings (circle orb) and not a faint
    // dotted line (single-point orb).
    function orbCore(qx, qy) {
      return {
        baseVals: Object.assign({}, WAVE_BASE, {
          enabled: 1, samples: 48, additive: 1, usedots: 1, scaling: 1,
          smoothing: 0, a: 1.0, thick: 1, r: 1.0, g: 0.78, b: 0.4
        }),
        init_eqs: passthrough, frame_eqs: passthrough,
        point_eqs: function (a) {
          var fr = a.sample;
          var rr = 0.008 * Math.sqrt(fr);          // fill a small disc (dense center -> glow)
          var ang = fr * 6.2832 * 9.0;             // sunflower spread
          a.x = (a[qx] || 0.5) + rr * Math.cos(ang);
          a.y = (a[qy] || 0.5) + rr * Math.sin(ang);
          a.r = 1.0; a.g = 0.78; a.b = 0.4;
          return a;
        }
      };
    }
    preset.waves[0] = burst(false);          // central waveform burst (channel 1)
    preset.waves[1] = burst(true);           // central waveform burst (channel 2)
    preset.waves[2] = orbCore("q1", "q2");   // orb A (pulled into the spiral)
    preset.waves[3] = orbCore("q3", "q4");   // orb B
    return preset;
  })();

  // ── Alchemy v2: Wireframe Net ────────────────────────────────────────────────
  // Built from the ALCHEMY KIT. The woven net is FRAME FEEDBACK (docs foundation #1): a 2D
  // STAR (two waveform triangles) is redrawn each frame and its feedback TRAIL builds the
  // structure. Two scenes, SAME motifs, different CAMERA — the vocabulary-and-camera idea:
  //   • Wireframe Net  = "top" camera (trace shrinks to center) -> face-on spinning mandala.
  //   • Net Corridor   = "side" camera (trace recedes to a right VP) -> the fish-bone corridor.
  // Both add an orb (fill + bright border) whose feedback trail is the receding row of orbs.
  P["Alchemy v2: Wireframe Net"] = (function () {
    var preset = build(
      alcCamera("top"),                                  // trace shrinks to center -> face-on mandala
      { frame: alcNetFrame(function () { return [0.5, 0.5]; }, 0.955), comp: ALC_COMP }
    );
    var star = alcStarWaves(2, 0.0);                     // two waveform triangles -> hexagram
    preset.waves[0] = star[0];
    preset.waves[1] = star[1];
    preset.waves[2] = alcOrbSame(0.0);                   // mono glow core (ring same hue as fill)
    return preset;
  })();

  // ── Alchemy v2: Net Corridor ─────────────────────────────────────────────────
  // Same star + orb motifs as Wireframe Net, but the "side" camera: the head sits near the
  // camera on the LEFT and the feedback marches its trace toward a right-edge VP, so the
  // spinning-star trace reads as the horizontal fish-bone corridor and the orb leaves the
  // receding row of marching orbs (reference @0:09–0:14, side view).
  P["Alchemy v2: Net Corridor"] = (function () {
    var preset = build(
      alcCamera("side"),                                 // fly INTO corridor (zoom>1), VP anchored right
      { frame: alcNetFrame(function () { return [0.42, 0.50]; }, 0.95), comp: ALC_COMP }
    );
    var star = alcStarWaves(2, 0.0);                     // the woven net (feedback trace)
    preset.waves[0] = star[0];
    preset.waves[1] = star[1];
    // orb trail = 10 real SHAPES (blue core / cyan ring) receding to the VP — distinct circles
    preset.shapes = makeOrbTrailShapes(8);               // filled head + hollow shrinking rings, wavy, hue-cycling
    return preset;
  })();

  // ── Alchemy v2: Waveform Sheet ───────────────────────────────────────────────
  // The SINGLE-LINE motif: ONE live-waveform line (alcRayWaves with n=1), slowly rotating,
  // over the spindle camera so its feedback trace spreads into a single rippling sheet seen
  // from a side angle (the "single waveform line leaving a trace" look). One line, not a fan.
  P["Alchemy v2: Waveform Sheet"] = (function () {
    var preset = build(
      alcCamera("side"),                                 // fly INTO corridor (zoom>1), VP anchored right
      { frame: alcNetFrame(function () { return [0.42, 0.50]; }, 0.95), comp: ALC_COMP }
    );
    var ray = alcRayWaves(1, 0.0, 2.6);                  // ONE long waveform line
    preset.waves[0] = ray[0];
    preset.waves[1] = alcOrbRow(1, 0.0, 0.5, 0.12, 0.50, 0.90, 0.50);  // ONE ring orb
    return preset;
  })();

  // ── Alchemy v2: Ray Burst ────────────────────────────────────────────────────
  // Demonstrates the RAY motif: 5 live-waveform lines through the center, rotating around
  // the axis (q9), over the "top" camera so their feedback trail blooms into a spinning
  // asterisk/net burst with an orb core. Same kit, different motif.
  P["Alchemy v2: Ray Burst"] = (function () {
    var preset = build(
      alcCamera("top"),
      { frame: alcNetFrame(function () { return [0.5, 0.5]; }, 0.955), comp: ALC_COMP }
    );
    var rays = alcRayWaves(5, 0.0, 3.0);                 // 5 rotating waveform lines, LONG (span the screen)
    preset.waves[0] = rays[0];
    preset.waves[1] = rays[1];
    preset.waves[2] = rays[2];
    preset.waves[3] = rays[3];
    preset.waves[4] = rays[4];
    preset.waves[5] = alcOrbWhite(0.0);                  // orb core, white ring (6 waves total — at the cap)
    return preset;
  })();

  // ── Alchemy v2: N-gon Proof ──────────────────────────────────────────────────
  // STEP 1–2 of the N-gon build (docs/alchemy-v2/ngon-spec.md): prove ONE configurable
  // polygon on screen before scaling to the nested mandala. A single diamond (N=4), stretched
  // horizontally (aspectX 1.7 -> the reference ellipse), slowly spinning, BREATHING with bass
  // (collapses small when quiet, blooms wide when loud), jagged edges from the live waveform,
  // over a FLAT-BLUE background (the muted Alchemy mandala bg) with crisp short-decay feedback.
  P["Alchemy v2: N-gon Proof"] = (function () {
    var preset = build(
      // NEAR-ZERO feedback: draw the polygon CRISP every frame (glow comes from the comp bloom,
      // NOT from feedback). A rotating shape under any real decay smears its echoes into a
      // receding-diamond tunnel (the "feedback = structure" trap, learning #1) — so decay is tiny
      // and zoom is exactly 1.0 (no tunnel) and the center isn't darkened.
      { wave_a: 0, gammaadj: 1.3, decay: 0.30, zoom: 1.0, cx: 0.5, cy: 0.5, dx: 0.0, dy: 0.0, rot: 0.0, warp: 0.0, wrap: 0, darken_center: 0, echo_alpha: 0 },
      {
        frame: function (t) {
          var bass = t.bass_att || t.bass || 1, treb = t.treb_att || t.treb || 1;
          var bn = Math.max(0, Math.min(bass - 1, 1));
          t.q2 = 0.5; t.q3 = 0.5;
          t.q5 = 0.3 + 0.7 * bn;                          // breathing: collapse when quiet, bloom on bass
          t.q6 = 0.02 + 0.035 * Math.min(treb, 2.0);      // edge jaggedness (live waveform) — light, so the 4 edges read
          t.q8 = (t.time * 0.05) % 1;                     // slow hue drift
          t.q9 = t.time * 0.9;                            // slow self-rotation (rad)
          return t;
        },
        warp: ALC_CLEAR_WARP,
        comp: ALC_FLATBLUE_COMP
      }
    );
    preset.waves[0] = alcNgon({ sides: 4, radius: 0.28, aspectX: 1.7, dir: 1, hueOff: 0.0 });
    return preset;
  })();

  // ── Alchemy v2: Mandala ──────────────────────────────────────────────────────
  // STEP 4 of the N-gon build: the nested star-polygon mandala (ref 1:14–1:28). A STACK of 6
  // counter-rotating N-gons (diamond/hexagon/octagon + 5- & 8-point stars + 12-gon) sharing a
  // horizontal-ellipse envelope (aspectX 1.7) over flat blue, drawn crisp each frame. BREATHES
  // with bass (collapses toward nothing on quiet bars, blooms wide on loud) and the edges are
  // jagged by the live waveform. The two bright "eye" nodes at L/R emerge from the stretch.
  // (Step 5 will add the persistent diagonal waveform line — dropping to 5 polygons to stay
  // within the ~6-wave cap.)
  P["Alchemy v2: Mandala"] = (function () {
    var preset = build(
      { wave_a: 0, gammaadj: 1.3, decay: 0.30, zoom: 1.0, cx: 0.5, cy: 0.5, dx: 0.0, dy: 0.0, rot: 0.0, warp: 0.0, wrap: 0, darken_center: 0, echo_alpha: 0 },
      { frame: alcMandalaFrame(), warp: ALC_CLEAR_WARP, comp: ALC_FLATBLUE_COMP }
    );
    // Diagonal at index 0 (drawn FIRST) so it can't be the silently-dropped last wave; mandala follows.
    // corner-to-corner so its ends stick out BEYOND the net (reads as a separate slash, not a net chord).
    preset.waves[0] = alcDiagonalLine(0.62, 0.85, 0.10, 1.0, 0.85, 0.95);  // persistent BOLD jagged pink-white diagonal
    var stack = alcNgonStack(1.7, ALC_MANDALA_SPECS, 3);  // 12 polygons packed 3/wave -> 4 waves
    for (var i = 0; i < stack.length; i++) preset.waves[i + 1] = stack[i];  // mandala at indices 1..4 (5 waves total)
    return preset;
  })();

  // ── Alchemy v2: Nested Mandala ───────────────────────────────────────────────
  // CONCENTRIC nested polygon rings: each ring a convex N-gon (skip=1) at a different radius,
  // stacked from outer (16-gon) to inner (triangle), counter-rotating. Unlike the spirograph
  // Mandala (crossing-chord star-polygons at the same radius), this reads as a TARGET/ROSETTE
  // — each ring's shape is clearly distinct, the center is the focal point (not L/R eye-nodes).
  // A few {N/skip} star overlays add crossing-chord depth within the outer rings. Circular
  // (aspectX=1), centered glow comp.
  var ALC_NESTED_SPECS = [
    // Outer concentric ring envelopes — tier 0, always on, packed into wave 0 first
    { sides: 16, skip: 1, radius: 0.38, dir:  1.0, rotate: 0.00, hueOff: 0.00, tier: 0 },
    { sides: 12, skip: 1, radius: 0.31, dir: -0.9, rotate: 0.13, hueOff: 0.10, tier: 0 },
    { sides: 10, skip: 1, radius: 0.25, dir:  1.1, rotate: 0.25, hueOff: 0.20, tier: 0 },
    // Star overlays at outer/mid radius — crossing chords add depth to the outer ring layer
    { sides: 12, skip: 5, radius: 0.36, dir:  0.7, rotate: 0.08, hueOff: 0.55, tier: 1 },
    { sides: 8,  skip: 3, radius: 0.26, dir: -0.6, rotate: 0.00, hueOff: 0.65, tier: 1 },
    { sides: 8,  skip: 1, radius: 0.20, dir: -1.0, rotate: 0.00, hueOff: 0.33, tier: 1 },
    // Mid/inner concentric rings
    { sides: 7,  skip: 1, radius: 0.15, dir:  1.2, rotate: 0.20, hueOff: 0.44, tier: 1 },
    { sides: 6,  skip: 1, radius: 0.11, dir: -0.8, rotate: 0.00, hueOff: 0.70, tier: 2 },
    { sides: 5,  skip: 1, radius: 0.08, dir:  0.9, rotate: 0.10, hueOff: 0.80, tier: 2 },
    // Inner star overlays
    { sides: 6,  skip: 2, radius: 0.13, dir: -1.1, rotate: 0.05, hueOff: 0.26, tier: 2 },
    { sides: 5,  skip: 2, radius: 0.09, dir:  0.8, rotate: 0.00, hueOff: 0.87, tier: 2 },
    // Tiny central anchor — a square/diamond at the center
    { sides: 4,  skip: 1, radius: 0.05, dir: -1.0, rotate: 0.00, hueOff: 0.15, tier: 2 }
  ];
  // Comp for the Nested Mandala: flat-blue bg + soft radial core glow (pulsing on bass — the center
  // is the focal point of this scene, not the L/R eyes) + Reinhard tone-map.
  var ALC_NESTED_COMP =
    "shader_body {\n" +
    "vec2 d = uv - 0.5; d.x *= resolution.x / resolution.y;\n" +
    "float pr = length(d);\n" +
    "vec3 g = texture2D(sampler_main, uv).rgb;\n" +
    "vec3 bloom = (texture2D(sampler_blur1, uv).rgb + texture2D(sampler_blur2, uv).rgb) * 0.5;\n" +
    "vec3 bg = vec3(0.08, 0.18, 0.32);\n" +              // slightly deeper blue than the spirograph Mandala
    "float core = exp(-pr * pr * 18.0);\n" +             // tight gaussian at center
    "vec3 coreCol = vec3(0.18, 0.35, 0.60) * core * (0.5 + 0.8 * bass);\n" + // muted blue-teal core glow, bass-driven
    "vec3 outc = bg + g + bloom * 0.18 + coreCol;\n" +
    "ret = outc / (outc + vec3(0.85));\n" +              // Reinhard — muted, never blows to white
    "}\n";
  P["Alchemy v2: Nested Mandala"] = (function () {
    var preset = build(
      { wave_a: 0, gammaadj: 1.3, decay: 0.30, zoom: 1.0, cx: 0.5, cy: 0.5, dx: 0.0, dy: 0.0, rot: 0.0, warp: 0.0, wrap: 0, darken_center: 0, echo_alpha: 0 },
      { frame: alcMandalaFrame(), warp: ALC_CLEAR_WARP, comp: ALC_NESTED_COMP }
    );
    // 12 specs packed 3/wave -> 4 waves (well under cap). Tier-0 specs are FIRST so wave 0
    // always has the outer ring envelopes (gracefully degrades if the last wave drops).
    var stack = alcNgonStack(1.0, ALC_NESTED_SPECS, 3);  // aspectX=1.0 -> circular (rosette not ellipse)
    for (var i = 0; i < stack.length; i++) preset.waves[i] = stack[i];
    return preset;
  })();

  // ── Alchemy v2: Anemone ──────────────────────────────────────────────────────
  // A rosette of a FEW (6) rotated COLORED waveform triangles (kit Motif C, corridor technique)
  // on the low-feedback "flat" camera: distinct colored jagged triangle lines, NON-additive so
  // they never blow to white, over a soft COLORED CORE that fills the center (not a black hole)
  // and pulses on bass. PULSES size on bass (q5), spins (q9), shears to a vortex on peaks (q10).
  // Reference @0:52–1:06 (Anemone Pulsar). Composable like the other kit scenes.
  P["Alchemy v2: Anemone"] = (function () {
    var hue = 0, lastT = 0, spin = 0;
    // Custom comp: fills the central triangle-hole with a soft dusty-magenta CORE glow (pulses
    // on bass) so the middle isn't black, plus a mild bloom around the colored lines, tone-mapped.
    var ANEMONE_COMP =
      "shader_body {\n" +
      "vec2 d = uv - 0.5; d.x *= resolution.x / resolution.y;\n" +
      "float pr = length(d);\n" +
      "vec3 g = texture2D(sampler_main, uv).rgb;\n" +
      "vec3 bloom = (texture2D(sampler_blur1, uv).rgb + texture2D(sampler_blur2, uv).rgb) * 0.5;\n" +
      "float core = exp(-pr * pr * 16.0);\n" +                    // soft gaussian, brightest at center
      "vec3 coreCol = vec3(0.55, 0.18, 0.42) * core * (0.75 + 0.55 * bass);\n" + // dusty magenta center fill
      "vec3 outc = g + bloom * 0.12 + coreCol;\n" +
      "ret = outc / (outc + vec3(0.85));\n" +                     // Reinhard tone-map -> muted, no white-out
      "}\n";
    var preset = build(
      // flat camera, moderate decay (0.5): anemone lines redrawn crisp each frame; the soft
      // radial bleed + the comp core/bloom give the glow.
      Object.assign({}, alcCamera("flat"), { decay: 0.5 }),
      {
        frame: function (t) {
          var bass = t.bass_att || t.bass || 1, mid = t.mid_att || t.mid || 1, treb = t.treb_att || t.treb || 1;
          var tm = t.time, dt = Math.min(0.1, Math.max(0, tm - lastT)); lastT = tm;
          var bn = Math.max(0, Math.min(bass - 1, 1));
          hue = (hue + dt * (0.02 + 0.04 * bn)) % 1;
          // ROTATION LINKED TO INTENSITY: slow drift when quiet, whips around on the beat.
          spin = spin + dt * (0.5 + 4.0 * bn);                   // anemone self-spin (bass-driven)
          t.q2 = 0.5; t.q3 = 0.5;
          t.q5 = 0.40 + 0.10 * bn;                               // PULSAR pulse: starburst radius (big -> fills screen)
          t.q6 = 0.02 + 0.04 * Math.min(mid + 0.5 * treb, 2.0);  // edge jaggedness (live waveform on the triangle sides)
          t.q8 = hue;                                            // two-tone hue drift
          t.q9 = spin;                                           // rotation
          // vortex: 0 at rest; shears the spikes into a swirl on STRONG bass (>~1.2)
          t.q10 = 0.8 * Math.max(0, Math.min((bass - 1.2) / 0.6, 1));
          return t;
        },
        comp: ANEMONE_COMP
      }
    );
    preset.waves[0] = alcAnemone(30, ALC_PAL.roseGreen);         // 30 overlapping ~24° waveform triangles; green↔magenta palette
    // NOTE: orbiter pair + tether (alcTether / alcOrbiterNode, driven by q21..q26) are DEFERRED —
    // they smeared under feedback on this scene. The kit elements remain for a low-feedback host.
    return preset;
  })();

  // ── Alchemy v2: Anemone (Petals) ─────────────────────────────────────────────
  // Same base-on-a-circle starburst as Anemone, but SMOOTH edges (q6=0), a SLOW spin and a
  // longer color-bleed feedback (decay 0.82) -> the clean overlapping-petal "dahlia" look
  // (crisp twin-tone petals washing color into the background) rather than the frizzy fast one.
  P["Alchemy v2: Anemone (Petals)"] = (function () {
    var hue = 0, lastT = 0, spin = 0;
    var ANEMONE_COMP =
      "shader_body {\n" +
      "vec2 d = uv - 0.5; d.x *= resolution.x / resolution.y;\n" +
      "float pr = length(d);\n" +
      "vec3 g = texture2D(sampler_main, uv).rgb;\n" +
      "vec3 bloom = (texture2D(sampler_blur1, uv).rgb + texture2D(sampler_blur2, uv).rgb) * 0.5;\n" +
      "float core = exp(-pr * pr * 16.0);\n" +
      "vec3 coreCol = vec3(0.55, 0.18, 0.42) * core * (0.75 + 0.55 * bass);\n" +
      "vec3 outc = g + bloom * 0.16 + coreCol;\n" +
      "ret = outc / (outc + vec3(0.85));\n" +
      "}\n";
    var preset = build(
      Object.assign({}, alcCamera("flat"), { decay: 0.82 }),   // long bleed -> petals wash color into the bg
      {
        frame: function (t) {
          var bass = t.bass_att || t.bass || 1;
          var tm = t.time, dt = Math.min(0.1, Math.max(0, tm - lastT)); lastT = tm;
          var bn = Math.max(0, Math.min(bass - 1, 1));
          hue = (hue + dt * (0.02 + 0.04 * bn)) % 1;
          spin = spin + dt * (0.10 + 0.18 * bn);                 // SLOW spin (clean, coherent petals)
          t.q2 = 0.5; t.q3 = 0.5;
          t.q5 = 0.40 + 0.10 * bn;                               // pulse size on bass
          t.q6 = 0;                                              // SMOOTH edges (no waveform frizz) -> clean petals
          t.q8 = hue;
          t.q9 = spin;
          t.q10 = 0.6 * Math.max(0, Math.min((bass - 1.2) / 0.6, 1));
          return t;
        },
        comp: ANEMONE_COMP
      }
    );
    // Palette picked from the kit: redCyan (two-tone). Swap to ALC_PAL.mono for a single colour,
    // or ALC_PAL.spread for multicolour — colour is a scene CONFIG, not baked into the motif.
    preset.waves[0] = alcAnemone(30, ALC_PAL.redCyan);           // clean overlapping ~24° petals (smooth)
    return preset;
  })();

  // ── Alchemy v2: Anemone (Mandala) ────────────────────────────────────────────
  // The SECOND construction: full EQUILATERAL triangles overlapping at their shared CENTER,
  // each rotated by a small tilt -> a spinning star-polygon mandala with a dark center hole.
  // Same kit feel (flat camera, colored non-additive outlines, waveform-jagged edges, color
  // bleed to bg), different geometry from the base-on-a-circle Anemone.
  P["Alchemy v2: Anemone (Mandala)"] = (function () {
    var hue = 0, lastT = 0, spin = 0;
    var ANEMONE_COMP =
      "shader_body {\n" +
      "vec2 d = uv - 0.5; d.x *= resolution.x / resolution.y;\n" +
      "float pr = length(d);\n" +
      "vec3 g = texture2D(sampler_main, uv).rgb;\n" +
      "vec3 bloom = (texture2D(sampler_blur1, uv).rgb + texture2D(sampler_blur2, uv).rgb) * 0.5;\n" +
      "float core = exp(-pr * pr * 16.0);\n" +
      "vec3 coreCol = vec3(0.30, 0.20, 0.52) * core * (0.75 + 0.55 * bass);\n" + // dusty indigo center
      "vec3 outc = g + bloom * 0.16 + coreCol;\n" +
      "ret = outc / (outc + vec3(0.85));\n" +
      "}\n";
    var preset = build(
      Object.assign({}, alcCamera("flat"), { decay: 0.5 }),
      {
        frame: function (t) {
          var bass = t.bass_att || t.bass || 1, mid = t.mid_att || t.mid || 1, treb = t.treb_att || t.treb || 1;
          var tm = t.time, dt = Math.min(0.1, Math.max(0, tm - lastT)); lastT = tm;
          var bn = Math.max(0, Math.min(bass - 1, 1));
          hue = (hue + dt * (0.02 + 0.04 * bn)) % 1;
          spin = spin + dt * (0.85 + 1.1 * bn);                  // FAST rotation
          t.q2 = 0.5; t.q3 = 0.5;
          t.q5 = 0.40 + 0.10 * bn;                               // mandala radius (fills screen)
          t.q6 = 0.03 + 0.05 * Math.min(mid + 0.5 * treb, 2.0);  // edge jaggedness (live waveform on the triangle edges)
          t.q8 = hue;                                            // two-tone hue drift
          t.q9 = spin;
          t.q10 = 0.8 * Math.max(0, Math.min((bass - 1.2) / 0.6, 1)); // vortex shear on peaks
          return t;
        },
        comp: ANEMONE_COMP
      }
    );
    preset.waves[0] = alcTriMandala(9, ALC_PAL.twoTone);         // 9 overlapping equilateral triangles, two-tone palette, shared center
    return preset;
  })();

  // ── Alchemy v2: Spindle ──────────────────────────────────────────────────────
  // The RING URCHIN / radial pulsar motif (kitified from the Anemone Pulsar's local anemone()):
  // 512 samples sweep the full circle, radius = eye + spike*abs(waveform) → bristles protrude
  // wherever the live audio has energy. On loud bass the spikes bloom long; on a quiet bar the
  // urchin contracts to a small pulsing ring (the dark pupil). q10 vortex shear curves the
  // bristles into a spiral on heavy transients. Distinct from alcAnemone (triangle starburst) —
  // this is a continuous glow ring whose profile IS the waveform mapped radially.
  // Reference: section_C3, 0:52-1:06 (canonical cobalt-blue background, pink→magenta color).
  P["Alchemy v2: Spindle"] = (function () {
    var hue = 0, lastT = 0, spin = 0;
    var SPINDLE_COMP =
      "shader_body {\n" +
      "vec2 d = uv - 0.5; d.x *= resolution.x / resolution.y;\n" +
      "float pr = length(d);\n" +
      "vec3 g = texture2D(sampler_main, uv).rgb;\n" +
      "vec3 bloom = (texture2D(sampler_blur1, uv).rgb + texture2D(sampler_blur2, uv).rgb) * 0.5;\n" +
      "float pupil = smoothstep(0.0, 0.14, pr);\n" +              // DARK CENTER pupil (the eye) — deepens at center
      "vec3 bg = vec3(0.06, 0.11, 0.28) * pupil * (0.85 + 0.22 * bass);\n" + // cobalt-blue (pulses with bass)
      "vec3 outc = bg + g + bloom * 0.30;\n" +
      "ret = outc / (outc + vec3(0.85));\n" +                     // Reinhard — muted, no white-out
      "}\n";
    var preset = build(
      Object.assign({}, alcCamera("flat"), { decay: 0.88 }),      // flat + moderate decay: urchin redrawn crisp but soft glow trail
      {
        frame: function (t) {
          var bass = t.bass_att || t.bass || 1, mid = t.mid_att || t.mid || 1;
          var tm = t.time, dt = Math.min(0.1, Math.max(0, tm - lastT)); lastT = tm;
          var bn = Math.max(0, Math.min(bass - 1, 1));
          hue = (hue + dt * (0.015 + 0.04 * bn)) % 1;
          spin = spin + dt * (0.5 + 3.0 * bn);                    // slow spin, whips on the beat
          t.q2 = 0.5; t.q3 = 0.5;
          t.q5 = 0.22 + 0.20 * bass;                              // radius: breathes strongly with bass
          t.q8 = hue;                                             // slow hue (pink→magenta→cyan band)
          t.q9 = spin;                                            // self-rotation
          t.q10 = 0.7 * Math.max(0, Math.min((bass - 1.2) / 0.6, 1));  // vortex on heavy transients
          return t;
        },
        comp: SPINDLE_COMP
      }
    );
    // Pink↔cyan slow mix: at q8=0 → dusty rose; q8=0.5 → muted cyan (matches ref "pink→cyan").
    // Hardcoded rather than alcPalette because the 3-offset cosine palette has no clean magenta.
    var PAL_ROSE = function (a) {
      var mix = 0.5 + 0.5 * Math.cos(6.2832 * (a.q8 || 0));   // 1 = pink phase, 0 = cyan phase
      a.r = (0.70 * mix + 0.18 * (1 - mix)) * 0.85;
      a.g = (0.28 * mix + 0.60 * (1 - mix)) * 0.85;
      a.b = (0.52 * mix + 0.74 * (1 - mix)) * 0.85;
    };
    preset.waves[0] = alcSpindle(PAL_ROSE);
    return preset;
  })();

  // ── Alchemy v2: Ribbon ───────────────────────────────────────────────────────
  // The 3D iridescent rainbow ribbon plane (ref 1:55–2:11, sections F4 + G1-G2). Implementation:
  // a bold diagonal waveform line (alcDiagonalLine) with heavy perpendicular waveform amplitude;
  // a directional warp that smears each frame ALONG the ribbon axis (lower-left drift) building
  // up the long diagonal rainbow streaks; a comp shader that tints the accumulation with an
  // iridescent rainbow along the axis. The "band width" is the waveform displacement; the
  // "streak length" is the feedback persistence. Near-black backdrop.
  //
  // Kit functions: alcRibbonWarp(angle, push) + alcRibbonComp(angle) — both reusable for any
  // diagonal band scene (e.g. the moiré "X" of two crossing ribbons in section_F3).
  P["Alchemy v2: Ribbon"] = (function () {
    var lastT = 0;
    var ANGLE = 0.65;                                             // ~37° — lower-left→upper-right (matches ref G2)
    var preset = build(
      { wave_a: 0, gammaadj: 1.5, decay: 0.96, zoom: 0.999,
        cx: 0.5, cy: 0.5, dx: 0.0, dy: 0.0, rot: 0.0, warp: 0.0,
        wrap: 0, darken_center: 0, echo_alpha: 0 },
      {
        frame: function (t) {
          var treb = t.treb_att || t.treb || 1;
          var tm = t.time, dt = Math.min(0.1, Math.max(0, tm - lastT)); lastT = tm;
          t.q10 = 1.0;                                           // diagonal line: full opacity always
          t.q6_wave = 0.14 + 0.10 * Math.min(treb, 1.5);        // perpendicular waveform amplitude (ribbon width)
          return t;
        },
        warp: alcRibbonWarp(ANGLE, 0.0015),   // slower drift -> band stays centered longer
        comp: alcRibbonComp(ANGLE)
      }
    );
    // Bold gold-white waveform line — the raw element that accumulates into the ribbon.
    // thick:1 + heavy amp so each fresh frame draws a visible wide band; the warp does the rest.
    preset.waves[0] = alcDiagonalLine(ANGLE, 0.82, 0.18, 1.0, 0.90, 0.65);
    return preset;
  })();

  // ── Ambience Thingus ─────────────────────────────────────────────────────
  // Re-derived frame-by-frame from "YouTube Ambience Thingus 480p.mp4":
  //   • Exactly TWO jagged WHITE lightning lines crossing through dead center
  //     (= 4 arms radiating) — the live audio waveform, displaced perpendicular
  //     to each line. They cross cleanly at a single sharp centre (NO spiral eye).
  //   • Slow rotation + long decay smears the lines' trails into 4 soft, broad
  //     fluid arms behind them. Pure rotation only — no angular swirl (which
  //     produced extra vortex eyes). The bolt + its fresh trail glow white,
  //     fading out to the hue.
  //   • The whole frame is filled with a single GLOBAL hue that jumps to a RANDOM
  //     new hue every few seconds (crossfaded). Vivid monochrome (NOT amber),
  //     fading to a dark hue when the music drops.
  //   • Bass "breathes" the zoom slightly; rotation is slow CCW.
  P["Ambience Thingus"] = (function () {
    var preset = build(
      {
        wave_a: 0,                 // primary waveform off; the two custom lines draw the cross
        decay: 0.94,               // trails smear into soft arms, but short enough to stay clean
        gammaadj: 1.4,
        zoom: 1.0, rot: 0.01, warp: 0.02, warpscale: 1.2, warpanimspeed: 0.4,
        // wrap:0 — wrapping was smearing off-edge pixels back as blocky edge
        // artifacts; clamp instead so the spiral dissipates cleanly into the void.
        cx: 0.5, cy: 0.5, darken_center: 0, wrap: 0
      },
      {
        frame: function (t) {
          var bass = t.bass_att || t.bass || 1;
          var mid = t.mid_att || t.mid || 1;
          var treb = t.treb_att || t.treb || 1;
          t.q1 = t.time * 0.28;                            // the CROSS visibly rotates CCW
          t.q5 = 0.72;                                     // half-length (reaches the edges)
          t.q6 = 0.10 + 0.30 * Math.min(0.6 * treb + 0.4 * mid, 2.4); // waveform amplitude (the jaggedness)
          t.q7 = 0.06 + 0.04 * bass;                       // gentle S-bend depth
          t.q10 = Math.min(0.6 + 0.7 * bass, 1.5);         // bolt brightness PULSES with bass
          // The LINES rotate (q1); the feedback/background is NOT rotated (rot=0)
          // so it doesn't spin under them — matches the original.
          t.rot = 0.0;
          t.zoom = 1.0 + 0.035 * (bass - 1.0);             // beat zoom breathe (back by request)
          t.decay = 0.90;                                  // faster fade -> deeper void, less fuzzy mesh
          return t;
        },
        // Just a gentle feedback fade (rotation handles the smear). No angular
        // swirl or jitter — those broke the single radial centre into many eyes.
        warp:
          "shader_body {\n" +
          "ret = texture2D(sampler_main, uv).rgb;\n" +
          "ret -= 0.005;\n" +
          "}\n",
        // THICK lines: dilate the bright feedback by taking the max luminance over
        // a ring of taps (radius in screen pixels), so a thin bolt becomes a fat
        // band. The radius PULSES with the bass (thicker on the beat). Then fill
        // the WHOLE frame with one global hue that jumps to a RANDOM new hue every
        // ~6s (crossfaded); dim feedback keeps the hue, only the fat bolt glows
        // white. Slightly desaturated (vivid, not neon); soft tonemap.
        comp:
          "float h1d(float x){ return fract(sin(x*12.9898)*43758.5453); }\n" +
          "float lc(vec3 c){ return max(c.r, max(c.g, c.b)); }\n" +
          PAL_GLSL +
          "shader_body {\n" +
          "vec3 src = texture2D(sampler_main, uv).rgb;\n" +
          "float R = 9.0 + 20.0 * bass;\n" +                       // line thickness (px), pulses hard w/ bass
          "vec2 ips = vec2(1.0 / resolution.x, 1.0 / resolution.y);\n" +
          "float lum = lc(src);\n" +
          // Two rings (R and 0.5R) x 8 directions -> a SOLID fat band, not sparse.
          "for (int ri = 0; ri < 2; ri++) {\n" +
          "  float rr = R * (ri == 0 ? 1.0 : 0.5);\n" +
          "  vec2 ex = vec2(rr, 0.0) * ips;\n" +
          "  vec2 ey = vec2(0.0, rr) * ips;\n" +
          "  vec2 ed = vec2(rr * 0.7071) * ips;\n" +
          "  lum = max(lum, lc(texture2D(sampler_main, uv + ex).rgb));\n" +
          "  lum = max(lum, lc(texture2D(sampler_main, uv - ex).rgb));\n" +
          "  lum = max(lum, lc(texture2D(sampler_main, uv + ey).rgb));\n" +
          "  lum = max(lum, lc(texture2D(sampler_main, uv - ey).rgb));\n" +
          "  lum = max(lum, lc(texture2D(sampler_main, uv + ed).rgb));\n" +
          "  lum = max(lum, lc(texture2D(sampler_main, uv - ed).rgb));\n" +
          "  lum = max(lum, lc(texture2D(sampler_main, uv + vec2(ed.x, -ed.y)).rgb));\n" +
          "  lum = max(lum, lc(texture2D(sampler_main, uv - vec2(ed.x, -ed.y)).rgb));\n" +
          "}\n" +
          "float seg = time / 6.0;\n" +                            // new random hue every ~6s
          "float i0 = floor(seg);\n" +
          "float f = smoothstep(0.0, 1.0, fract(seg));\n" +
          "float h = mix(h1d(i0), h1d(i0 + 1.0), f);\n" +          // random hue, crossfaded
          "vec3 base = pal(h);\n" +
          "base = pow(base, vec3(1.5));\n" +                       // deepen (rich, not pastel)
          "float bl = dot(base, vec3(0.333));\n" +
          "base = clamp(bl + (base - bl) * 1.7, 0.0, 1.0);\n" +    // boost saturation (kill muddy grays)
          "float fill = (0.12 + 0.20 * bass) + 0.5 * lum;\n" +     // DEEP saturated hue field
          "vec3 col = base * fill;\n" +
          "col += vec3(1.0) * smoothstep(0.45, 0.95, lum) * 0.9;\n" + // the fat bolt pops stark WHITE
          "col = col / (col + 0.8);\n" +                           // gentler tonemap (less washout)
          "ret = col;\n" +
          "}\n"
      }
    );

    // One full lightning line through center at angle (q1 + offset): the live
    // waveform drawn from -len..+len, displaced PERPENDICULAR by the sample
    // (little wander near the centre, more toward the ends). White; the comp
    // tints the rest of the frame. Two of these (0 and 90deg) make the 4-arm X.
    function crossLine(offset, useV2) {
      return {
        baseVals: Object.assign({}, WAVE_BASE, {
          enabled: 1, samples: 512, additive: 1, usedots: 0, scaling: 1,
          smoothing: 0.0, a: 1.0, thick: 1, r: 1.0, g: 1.0, b: 1.0
        }),
        init_eqs: passthrough,
        frame_eqs: passthrough,
        point_eqs: function (a) {
          var th = (a.q1 || 0) + offset;
          var ct = Math.cos(th), st = Math.sin(th);
          var s = a.sample * 2.0 - 1.0;                      // -1 .. +1 through centre
          var len = (a.q5 || 0.7);
          var amp = (a.q6 || 0.12);
          var samp = useV2 ? (a.value2 !== undefined ? a.value2 : a.value1) : a.value1;
          // Overall S-shape: sin(s*PI) is 0 at the centre and bends one way on each
          // half -> a smooth S. The live waveform jaggedness rides on top (also 0
          // at centre so the two lines still cross cleanly).
          var bend = (a.q7 || 0.1) * Math.sin(s * Math.PI);
          var disp = bend + samp * amp * Math.abs(s);
          a.x = 0.5 + s * len * ct - disp * st;
          a.y = 0.5 + s * len * st + disp * ct;
          var w = (a.q10 !== undefined ? a.q10 : 1);
          a.r = w; a.g = w; a.b = w;
          return a;
        }
      };
    }
    preset.waves[0] = crossLine(0, false);
    preset.waves[1] = crossLine(Math.PI * 0.5, true);
    return preset;
  })();

  // ── Ambience Water ────────────────────────────────────────────────────────
  // Soft yellow pool caustics: layered sine ripples, no rotation, luminous.
  P["Ambience Water"] = build(
    {
      wave_mode: 0, wave_smoothing: 0.95, wave_scale: 0.35, additivewave: 1,
      wave_r: 1.0, wave_g: 0.9, wave_b: 0.35, wave_a: 0.22,
      decay: 0.95, gammaadj: 1.6,
      zoom: 1.0, rot: 0.0, warp: 0.12, warpscale: 2.2, warpanimspeed: 0.5,
      cx: 0.5, cy: 0.5, wrap: 1
    },
    {
      frame: function (t) {
        var bass = t.bass_att || t.bass || 1;
        var treb = t.treb_att || t.treb || 1;
        t.warp = 0.10 + 0.05 * bass;
        t.warpanimspeed = 0.4 + 0.3 * treb;
        t.zoom = 1.0 + 0.005 * Math.sin(t.time * 0.4);
        t.decay = 0.95;
        return t;
      },
      warp:
        "shader_body {\n" +
        "vec2 p = uv - 0.5;\n" +
        "float r = length(p);\n" +
        "vec2 w = uv;\n" +
        "w.x += 0.012 * sin(uv.y*14.0 + time*1.1) + 0.008 * sin(r*22.0 - time*0.9);\n" +
        "w.y += 0.012 * cos(uv.x*14.0 + time*0.9) + 0.008 * cos(r*22.0 - time*0.7);\n" +
        "ret = texture2D(sampler_main, w).rgb;\n" +
        "ret -= 0.002;\n" +
        "}\n",
      comp:
        AMBER_RAMP +
        "shader_body {\n" +
        "vec3 src = texture2D(sampler_main, uv).rgb;\n" +
        "float v = dot(src, vec3(0.33));\n" +
        "v = 0.35 + 0.7 * v;\n" +
        "v += 0.06 * sin(uv.x*10.0 + time*0.8) * sin(uv.y*10.0 - time*0.6);\n" +
        "v *= (1.0 + 0.25*bass);\n" +
        "ret = amber_ramp(v);\n" +
        "}\n"
    }
  );

  // ── Ambience Down the Drain ────────────────────────────────────────────────
  // Yellow caustics spiralling into a dark central hole: zoom-in + rotate.
  P["Ambience Down the Drain"] = build(
    {
      wave_mode: 0, wave_smoothing: 0.9, wave_scale: 0.5, additivewave: 1,
      wave_r: 1.0, wave_g: 0.82, wave_b: 0.25, wave_a: 0.8,
      decay: 0.965, gammaadj: 1.9,
      zoom: 0.99, rot: 0.10, warp: 0.06, warpscale: 1.2,
      cx: 0.55, cy: 0.5, darken_center: 0, wrap: 0
    },
    {
      frame: function (t) {
        var bass = t.bass_att || t.bass || 1;
        var treb = t.treb || 1;
        t.zoom = 0.99 - 0.008 * bass;   // gentle inward pull (was collapsing)
        t.rot = 0.08 + 0.06 * Math.sin(t.time * 0.2) + 0.02 * bass;
        t.cx = 0.55 + 0.01 * Math.sin(t.time * 0.3);
        t.decay = 0.965;
        t.wave_g = 0.78 + 0.12 * treb;
        return t;
      },
      warp:
        "shader_body {\n" +
        "vec2 p = uv - vec2(0.55, 0.5);\n" +
        "float a = atan(p.y, p.x);\n" +
        "float r = length(p);\n" +
        "a += 0.10 * (1.0 - r);\n" +
        "vec2 w = vec2(0.55,0.5) + r * vec2(cos(a), sin(a));\n" +
        "ret = texture2D(sampler_main, w).rgb;\n" +
        "ret -= 0.004;\n" +
        "}\n",
      comp:
        AMBER_RAMP +
        "shader_body {\n" +
        "vec3 src = texture2D(sampler_main, uv).rgb;\n" +
        "float v = dot(src, vec3(0.33)) * (1.0 + 0.3*bass);\n" +
        "v = 0.18 + 0.9 * v;\n" +                       // base so the field stays visible
        "float r = length(uv - vec2(0.55, 0.5));\n" +
        "v *= smoothstep(0.02, 0.11, r);\n" +           // smaller drain hole
        "ret = amber_ramp(v);\n" +
        "}\n"
    }
  );

  // ── Battery relatively calm ────────────────────────────────────────────────
  // Soft milky teal swirl that drifts green<->blue; lazy rotation, gentle.
  P["Battery relatively calm"] = (function () {
    var preset = build(
      {
        wave_a: 0, wave_smoothing: 0.9, additivewave: 1, wave_scale: 0.7,
        decay: 0.96, gammaadj: 1.8, zoom: 0.999, rot: 0.012, warp: 0.02,
        cx: 0.5, cy: 0.5, darken_center: 0, wrap: 0
      },
      {
        frame: function (t) {
          var bass = t.bass_att || t.bass || 1;
          t.q1 = 0.5; t.q2 = 0.5;
          t.q5 = 0.30 + 0.04 * bass;
          t.rot = 0.012 + 0.004 * Math.sin(t.time * 0.15);
          t.zoom = 0.999 - 0.0008 * bass;
          t.decay = 0.96;
          return t;
        },
        comp:
          "shader_body {\n" +
          "vec3 c = texture2D(sampler_main, uv).rgb;\n" +
          "float h = 0.5 + 0.5 * sin(time * 0.07);\n" +
          "vec3 tint = mix(vec3(0.30,0.70,0.45), vec3(0.40,0.60,0.85), h);\n" +
          "float lum = dot(c, vec3(0.33));\n" +
          "float r = distance(uv, vec2(0.5));\n" +
          "vec3 base = tint * (0.22 * (1.0 - smoothstep(0.0, 0.8, r)));\n" + // soft teal cloud, always present
          "ret = mix(c, lum * tint * 1.8, 0.6) + base;\n" +
          "}\n"
      }
    );
    preset.waves[0] = circleWave("q1", "q2");
    preset.waves[0].baseVals.smoothing = 0.9;
    preset.waves[0].baseVals.a = 0.8;
    preset.waves[0].baseVals.r = 0.35; preset.waves[0].baseVals.g = 0.7; preset.waves[0].baseVals.b = 0.6;
    return preset;
  })();

  // ── Battery strawberryaid ──────────────────────────────────────────────────
  // Pink/red radial starburst: two jagged rings spiking outward on the bass.
  P["Battery strawberryaid"] = (function () {
    var preset = build(
      {
        wave_a: 0, wave_smoothing: 0.1, additivewave: 1, wave_scale: 1.4,
        decay: 0.93, gammaadj: 2.0, zoom: 1.0, rot: 0.01, warp: 0.05,
        cx: 0.5, cy: 0.5, darken_center: 0, wrap: 0
      },
      {
        frame: function (t) {
          var bass = t.bass_att || t.bass || 1;
          var treb = t.treb || 1;
          t.q1 = 0.5; t.q2 = 0.5; t.q3 = 0.5; t.q4 = 0.5;
          t.q5 = 0.14 + 0.12 * bass;
          t.q6 = 0.26 + 0.16 * bass;
          t.wave_scale = 1.0 + 0.9 * bass + 0.3 * treb;
          t.zoom = 1.0 + 0.02 * bass;
          t.rot = 0.01 + 0.003 * Math.sin(t.time * 0.3);
          t.decay = 0.93;
          return t;
        },
        comp:
          "shader_body {\n" +
          "vec3 c = texture2D(sampler_main, uv).rgb;\n" +
          "float lum = dot(c, vec3(0.4));\n" +
          // strawberryaid slowly cycles its warm hue over time (red <-> pink/berry).
          "vec3 pink = mix(vec3(0.95,0.16,0.22), vec3(0.95,0.30,0.62), 0.5+0.5*sin(time*0.06));\n" +
          "vec3 deep = vec3(0.22, 0.0, 0.06);\n" +
          "ret = deep + pink * lum * (1.6 + 0.8 * bass);\n" +
          "float d = distance(uv, vec2(0.5));\n" +
          "ret += vec3(0.5, 0.1, 0.2) * (0.25 - d) * 1.5;\n" +
          "}\n"
      }
    );
    preset.waves[0] = circleWave("q1", "q2");
    preset.waves[0].baseVals.smoothing = 0.05;
    preset.waves[0].baseVals.r = 0.95; preset.waves[0].baseVals.g = 0.25; preset.waves[0].baseVals.b = 0.45;
    preset.waves[1] = circleWave("q3", "q4");
    preset.waves[1].baseVals.smoothing = 0.05;
    preset.waves[1].baseVals.r = 0.95; preset.waves[1].baseVals.g = 0.35; preset.waves[1].baseVals.b = 0.55;
    preset.waves[1].point_eqs = function (a) {
      var ang = a.sample * 6.2832;
      var rad = (a.q6 || 0.26) + 0.07 * a.value1;
      a.x = 0.5 + rad * Math.cos(ang);
      a.y = 0.5 + rad * Math.sin(ang);
      return a;
    };
    return preset;
  })();

  // ── Battery my tornado is resting ──────────────────────────────────────────
  // Greyscale swirling vortex with a dark eye; smoky trails spiral inward.
  P["Battery my tornado is resting"] = (function () {
    var preset = build(
      {
        wave_a: 0, wave_smoothing: 0.7, additivewave: 1, wave_scale: 0.9,
        decay: 0.97, gammaadj: 1.9, zoom: 0.985, rot: 0.05, warp: 0.12,
        warpscale: 1.5, cx: 0.5, cy: 0.5, darken_center: 1, wrap: 0
      },
      {
        frame: function (t) {
          var bass = t.bass_att || t.bass || 1;
          t.q1 = 0.5 + 0.03 * Math.cos(t.time * 0.2);
          t.q2 = 0.5 + 0.03 * Math.sin(t.time * 0.2);
          t.q5 = 0.22 + 0.05 * bass;
          t.rot = 0.05 + 0.02 * bass;
          t.zoom = 0.985 - 0.006 * bass;
          t.decay = 0.97;
          return t;
        },
        comp:
          "shader_body {\n" +
          "vec3 c = texture2D(sampler_main, uv).rgb;\n" +
          "float lum = dot(c, vec3(0.33));\n" +
          "vec3 grey = vec3(lum) * vec3(1.0, 0.98, 0.95);\n" +
          "ret = mix(c, grey, 0.85);\n" +
          "float d = distance(uv, vec2(0.5));\n" +
          "ret *= smoothstep(0.04, 0.30, d);\n" +
          "}\n",
        warp:
          "shader_body {\n" +
          "vec2 d = uv - vec2(0.5);\n" +
          "float a = 0.25 / (length(d) + 0.15);\n" +
          "vec2 sw = vec2(d.x * cos(a) - d.y * sin(a), d.x * sin(a) + d.y * cos(a));\n" +
          "ret = texture2D(sampler_main, vec2(0.5) + sw).rgb;\n" +
          "ret -= 0.004;\n" +
          "}\n"
      }
    );
    preset.waves[0] = circleWave("q1", "q2");
    preset.waves[0].baseVals.smoothing = 0.6;
    preset.waves[0].baseVals.a = 0.4;
    preset.waves[0].baseVals.r = 0.7; preset.waves[0].baseVals.g = 0.7; preset.waves[0].baseVals.b = 0.7;
    return preset;
  })();

  // ════════════════════════════════════════════════════════════════════════
  // AMBIENCE family (amber/yellow fluid light; Niagara cycles yellow<->teal).
  // Authored batch 2 — built with real audio: built-in circular waveform or
  // circleWave/spokeLine, so the pulsing elements beat with the music.
  // ════════════════════════════════════════════════════════════════════════

  // ── Ambience Snell ──────────────────────────────────────────────────────────
  // Refraction (Snell's law): the live circular waveform bent through a rippling
  // amber "interface"; a warp displaces uv along a travelling lens so straight
  // light bands shimmer and bend with the audio. Fixed amber.
  P["Ambience Snell"] = (function () {
    var preset = build(
      {
        wave_mode: 0, wave_smoothing: 0.9, wave_scale: 0.5, additivewave: 1,
        wave_r: 1.0, wave_g: 0.85, wave_b: 0.3, wave_a: 0.45,
        decay: 0.96, gammaadj: 1.8,
        zoom: 1.0, rot: 0.0, warp: 0.12, warpscale: 1.8, warpanimspeed: 0.6,
        cx: 0.5, cy: 0.5, darken_center: 0, wrap: 1
      },
      {
        frame: function (t) {
          var bass = t.bass_att || t.bass || 1;
          var treb = t.treb_att || t.treb || 1;
          t.warp = 0.10 + 0.06 * bass;
          t.warpanimspeed = 0.5 + 0.4 * treb;
          t.zoom = 1.0 + 0.004 * Math.sin(t.time * 0.3);
          t.rot = 0.01 * Math.sin(t.time * 0.2);
          t.decay = 0.96;
          t.wave_a = 0.30 + 0.30 * bass;
          t.wave_g = 0.82 + 0.10 * bass;
          return t;
        },
        warp:
          "shader_body {\n" +
          "vec2 w = uv;\n" +
          "float n = sin(uv.y * 9.0 + time * 0.7) + 0.6 * sin(uv.y * 17.0 - time * 0.5);\n" +
          "float m = cos(uv.x * 7.0 - time * 0.6) + 0.6 * cos(uv.x * 15.0 + time * 0.4);\n" +
          "w.x += 0.016 * n;\n" +
          "w.y += 0.010 * m;\n" +
          "ret = texture2D(sampler_main, w).rgb;\n" +
          "ret -= 0.003;\n" +
          "}\n",
        comp:
          AMBER_RAMP +
          "shader_body {\n" +
          "vec3 src = texture2D(sampler_main, uv).rgb;\n" +
          "float v = dot(src, vec3(0.33));\n" +
          "v = 0.28 + 0.85 * v;\n" +
          "v += 0.07 * sin(uv.y * 12.0 + time * 0.8);\n" +
          "v *= (1.0 + 0.30 * bass);\n" +
          "ret = amber_ramp(v);\n" +
          "}\n"
      }
    );
    return preset;
  })();

  // ── Ambience Warp ───────────────────────────────────────────────────────────
  // A warping amber tunnel: feedback zoomed outward each frame so trails of the
  // live waveform rush from the center as concentric rings, with a slow swirl.
  P["Ambience Warp"] = (function () {
    var preset = build(
      {
        wave_mode: 0, wave_smoothing: 0.88, wave_scale: 0.55, additivewave: 1,
        wave_r: 1.0, wave_g: 0.82, wave_b: 0.28, wave_a: 0.4,
        decay: 0.95, gammaadj: 1.9,
        zoom: 1.04, rot: 0.02, warp: 0.05, warpscale: 1.2, warpanimspeed: 0.6,
        cx: 0.5, cy: 0.5, darken_center: 0, wrap: 0
      },
      {
        frame: function (t) {
          var bass = t.bass_att || t.bass || 1;
          var treb = t.treb_att || t.treb || 1;
          t.zoom = 1.04 + 0.06 * bass;
          t.rot = 0.015 + 0.03 * Math.sin(t.time * 0.15);
          t.warp = 0.04 + 0.03 * treb;
          t.decay = 0.95;
          t.wave_a = 0.25 + 0.35 * bass;
          return t;
        },
        warp:
          "shader_body {\n" +
          "vec2 d = uv - 0.5;\n" +
          "float r = length(d);\n" +
          "float a = atan(d.y, d.x) + 0.06 * sin(time * 0.4);\n" +
          "r *= 0.985;\n" +
          "vec2 w = 0.5 + r * vec2(cos(a), sin(a));\n" +
          "ret = texture2D(sampler_main, w).rgb;\n" +
          "ret -= 0.003;\n" +
          "}\n",
        comp:
          AMBER_RAMP +
          "shader_body {\n" +
          "vec2 d = uv - 0.5;\n" +
          "d.x *= resolution.x / resolution.y;\n" +
          "float r = length(d);\n" +
          "vec3 src = texture2D(sampler_main, uv).rgb;\n" +
          "float v = dot(src, vec3(0.33)) * (1.0 + 0.35 * bass);\n" +
          "v += 0.10 * sin(r * 26.0 - time * 2.0);\n" +
          "v *= smoothstep(0.0, 0.12, r);\n" +
          // WMP Warp slowly cycles blue <-> yellow.
          "vec3 warm = amber_ramp(v);\n" +
          "vec3 cool = vec3(0.15, 0.45, 0.95) * v * 1.4;\n" +
          "ret = mix(cool, warm, 0.5 + 0.5*sin(time*0.05));\n" +
          "}\n"
      }
    );
    return preset;
  })();

  // ── Ambience Anon ───────────────────────────────────────────────────────────
  // Anonymous slow-morphing amber cloud: a soft fbm mass that breathes, with a
  // faint waveform heartbeat fed in. Deliberately minimal, very smooth.
  P["Ambience Anon"] = build(
    {
      wave_mode: 0, wave_smoothing: 0.95, wave_scale: 0.3, additivewave: 1,
      wave_r: 1.0, wave_g: 0.86, wave_b: 0.32, wave_a: 0.18,
      decay: 0.97, gammaadj: 1.7,
      zoom: 1.0, rot: 0.0, warp: 0.05, warpscale: 1.6, warpanimspeed: 0.2,
      cx: 0.5, cy: 0.5, darken_center: 0, wrap: 1
    },
    {
      frame: function (t) {
        var bass = t.bass_att || t.bass || 1;
        t.warp = 0.04 + 0.03 * bass;
        t.warpanimspeed = 0.18;
        t.zoom = 1.0 + 0.003 * Math.sin(t.time * 0.2);
        t.decay = 0.97;
        t.wave_a = 0.12 + 0.18 * bass;
        t.wave_g = 0.84 + 0.06 * Math.sin(t.time * 0.15);
        return t;
      },
      warp:
        "shader_body {\n" +
        "vec2 w = uv + 0.006 * vec2(sin(uv.y * 5.0 + time * 0.25), cos(uv.x * 5.0 + time * 0.2));\n" +
        "ret = texture2D(sampler_main, w).rgb;\n" +
        "ret -= 0.002;\n" +
        "}\n",
      comp:
        NOISE_GLSL +
        AMBER_RAMP +
        "shader_body {\n" +
        "vec2 p = uv * 2.2;\n" +
        "p += vec2(time * 0.04, -time * 0.03);\n" +
        "float cloud = fbm(p + fbm(p + time * 0.05));\n" +
        "vec3 src = texture2D(sampler_main, uv).rgb;\n" +
        "float v = 0.55 * cloud + 0.55 * dot(src, vec3(0.33));\n" +
        "float d = distance(uv, vec2(0.5));\n" +
        "v *= smoothstep(0.85, 0.15, d);\n" +
        "v *= (1.0 + 0.25 * bass);\n" +
        "ret = amber_ramp(v);\n" +
        "}\n"
    }
  );

  // ── Ambience Falloff ────────────────────────────────────────────────────────
  // Light cascading downward: feedback drifts down each frame so the live waveform
  // leaves amber streaks raining toward the bottom, with a faint sideways sway.
  P["Ambience Falloff"] = build(
    {
      wave_mode: 0, wave_smoothing: 0.9, wave_scale: 0.5, additivewave: 1,
      wave_r: 1.0, wave_g: 0.84, wave_b: 0.3, wave_a: 0.4,
      decay: 0.955, gammaadj: 1.85,
      zoom: 1.0, rot: 0.0, warp: 0.04, warpscale: 1.6, warpanimspeed: 0.5,
      cx: 0.5, cy: 0.3, dx: 0.0, dy: 0.012, darken_center: 0, wrap: 1
    },
    {
      frame: function (t) {
        var bass = t.bass_att || t.bass || 1;
        var treb = t.treb_att || t.treb || 1;
        t.dy = 0.010 + 0.006 * bass;
        t.dx = 0.002 * Math.sin(t.time * 0.4);
        t.warp = 0.04 + 0.03 * treb;
        t.zoom = 1.0;
        t.decay = 0.955;
        t.wave_a = 0.25 + 0.30 * bass;
        t.cy = 0.30 + 0.04 * Math.sin(t.time * 0.2);
        return t;
      },
      warp:
        "shader_body {\n" +
        "vec2 w = uv;\n" +
        "w.y -= 0.010;\n" +
        "w.x += 0.006 * sin(uv.y * 12.0 + time * 1.0);\n" +
        "ret = texture2D(sampler_main, w).rgb;\n" +
        "ret -= 0.003;\n" +
        "}\n",
      comp:
        AMBER_RAMP +
        "shader_body {\n" +
        "vec3 src = texture2D(sampler_main, uv).rgb;\n" +
        "float v = dot(src, vec3(0.33)) * (1.0 + 0.30 * bass);\n" +
        "v = 0.10 + 0.95 * v;\n" +
        "v += 0.05 * sin(uv.x * 30.0 + time * 1.5) * smoothstep(0.0, 0.5, uv.y);\n" +
        "v *= smoothstep(0.0, 0.18, 1.0 - uv.y) + 0.4;\n" +
        "ret = amber_ramp(v);\n" +
        "}\n"
    }
  );

  // ── Ambience Bubble ─────────────────────────────────────────────────────────
  // Round amber bubbles floating up: four soft glowing metaball circles drift and
  // pulse with bass, drawn as live circular waveforms (each a real-audio ring).
  P["Ambience Bubble"] = (function () {
    var preset = build(
      {
        wave_a: 0,
        wave_mode: 0, wave_smoothing: 0.9, additivewave: 1,
        decay: 0.95, gammaadj: 1.9,
        zoom: 1.0, rot: 0.0, warp: 0.05, warpscale: 1.4, warpanimspeed: 0.4,
        cx: 0.5, cy: 0.5, dx: 0.0, dy: -0.004, darken_center: 0, wrap: 1
      },
      {
        frame: function (t) {
          var bass = t.bass_att || t.bass || 1;
          t.dy = -0.003 - 0.004 * bass;
          t.warp = 0.04 + 0.02 * bass;
          t.zoom = 1.0 + 0.003 * Math.sin(t.time * 0.3);
          t.decay = 0.95;
          t.q1 = 0.30 + 0.10 * Math.sin(t.time * 0.50);
          t.q2 = 0.40 + 0.15 * Math.sin(t.time * 0.27 + 1.0);
          t.q3 = 0.70 + 0.10 * Math.sin(t.time * 0.40 + 2.0);
          t.q4 = 0.55 + 0.18 * Math.sin(t.time * 0.31 + 3.0);
          t.q6 = 0.50 + 0.12 * Math.sin(t.time * 0.43 + 4.0);
          t.q7 = 0.35 + 0.16 * Math.sin(t.time * 0.22 + 5.0);
          t.q8 = 0.60 + 0.10 * Math.sin(t.time * 0.37 + 6.0);
          t.q9 = 0.65 + 0.15 * Math.sin(t.time * 0.29 + 7.0);
          t.q5 = 0.09 + 0.05 * bass;
          return t;
        },
        warp:
          "shader_body {\n" +
          "vec2 w = uv + 0.005 * vec2(sin(uv.y * 6.0 + time * 0.4), cos(uv.x * 6.0 + time * 0.3));\n" +
          "ret = texture2D(sampler_main, w).rgb;\n" +
          "ret -= 0.0025;\n" +
          "}\n",
        comp:
          // WMP Bubble slowly cycles its base hue (observed magenta <-> teal across the video).
          "shader_body {\n" +
          "vec3 src = texture2D(sampler_main, uv).rgb;\n" +
          "float v = dot(src, vec3(0.33)) * (1.0 + 0.30 * bass);\n" +
          "v = 0.04 + 1.05 * v;\n" +
          "vec3 tint = mix(vec3(0.95,0.25,0.85), vec3(0.15,0.85,0.80), 0.5+0.5*sin(time*0.05));\n" +
          "ret = tint * v;\n" +
          "}\n"
      }
    );
    preset.waves[0] = circleWave("q1", "q2");
    preset.waves[1] = circleWave("q3", "q4");
    preset.waves[2] = circleWave("q6", "q7");
    preset.waves[3] = circleWave("q8", "q9");
    preset.waves.forEach(function (w) {
      w.baseVals.r = 1.0; w.baseVals.g = 1.0; w.baseVals.b = 1.0;
      w.baseVals.a = 0.7; w.baseVals.smoothing = 0.5;
    });
    return preset;
  })();

  // ── Ambience Dizzy ──────────────────────────────────────────────────────────
  // Dizzying spiral: fast rotation plus a center-pulling swirl warp; amber glow on
  // black, driven by a real circular waveform whose radius pulses with the bass.
  P["Ambience Dizzy"] = (function () {
    var preset = build(
      {
        wave_a: 0, decay: 0.96, gammaadj: 1.8, zoom: 1.02,
        rot: 0.06, warp: 0.10, warpscale: 1.4, warpanimspeed: 1.2,
        darken_center: 0, wrap: 0
      },
      {
        frame: function (t) {
          var b = t.bass_att || t.bass || 1;
          var tr = t.treb_att || t.treb || 1;
          t.rot = 0.05 + 0.10 * b;
          t.zoom = 1.01 + 0.02 * b;
          t.q1 = 0.5;
          t.q2 = 0.5;
          t.q5 = 0.14 + 0.07 * b + 0.02 * tr;
          return t;
        },
        warp:
          "shader_body {\n" +
          "vec2 d = uv - vec2(0.5);\n" +
          "float a = 0.45 / (length(d) + 0.18);\n" +
          "float s = sin(a + time * 0.6), c = cos(a + time * 0.6);\n" +
          "vec2 sw = vec2(d.x * c - d.y * s, d.x * s + d.y * c);\n" +
          "ret = texture2D(sampler_main, vec2(0.5) + sw * 0.992).rgb;\n" +
          "ret -= 0.003;\n" +
          "}\n",
        comp:
          // WMP Dizzy is a cyan/teal swirl (not the amber Ambience theme).
          "shader_body {\n" +
          "vec3 c = texture2D(sampler_main, uv).rgb;\n" +
          "float v = dot(c, vec3(0.4));\n" +
          "ret = vec3(0.10, 0.82, 0.85) * v * 1.7;\n" +
          "float dd = distance(uv, vec2(0.5));\n" +
          "ret += vec3(0.20, 0.95, 0.90) * exp(-dd * dd * 7.0) * (0.06 + 0.25 * bass);\n" +
          "}\n"
      }
    );
    preset.waves[0] = circleWave("q1", "q2");
    preset.waves[0].baseVals.r = 0.4; preset.waves[0].baseVals.g = 0.95; preset.waves[0].baseVals.b = 1.0;
    return preset;
  })();

  // ── Ambience Windmill ─────────────────────────────────────────────────────
  // Four real-audio spokes (an 8-armed blade set) rotating about the center over a
  // faint amber radial glow; spin and blade length react to the audio.
  P["Ambience Windmill"] = (function () {
    var preset = build(
      {
        wave_a: 0, decay: 0.94, gammaadj: 1.8, zoom: 1.0,
        rot: 0.0, warp: 0.02, darken_center: 0, wrap: 0
      },
      {
        frame: function (t) {
          var b = t.bass_att || t.bass || 1;
          t.q1 = t.time * (0.4 + 0.4 * b);
          t.q6 = 0.16 + 0.10 * b;
          return t;
        },
        comp:
          // WMP Windmill is a cyan/teal swirl.
          "shader_body {\n" +
          "vec3 c = texture2D(sampler_main, uv).rgb;\n" +
          "float v = dot(c, vec3(0.45));\n" +
          "ret = vec3(0.12, 0.80, 0.82) * v * 1.7;\n" +
          "float dd = distance(uv, vec2(0.5));\n" +
          "ret += vec3(0.20, 0.92, 0.88) * exp(-dd * dd * 5.0) * (0.10 + 0.30 * bass);\n" +
          "}\n"
      }
    );
    var offs = [0.0, 0.785, 1.571, 2.356];
    for (var i = 0; i < 4; i++) {
      preset.waves[i] = spokeLine(0, 0.5, 0.18, 0.4, 0.95, 1.0);
      (function (off, idx) {
        preset.waves[idx].point_eqs = function (a) {
          var th = (a.q1 || 0) + off;
          var s = a.sample * 2.0 - 1.0;
          var amp = a.q6 || 0.18;
          var ct = Math.cos(th), st = Math.sin(th);
          a.x = 0.5 + s * 0.5 * ct - a.value1 * amp * st;
          a.y = 0.5 + s * 0.5 * st + a.value1 * amp * ct;
          return a;
        };
      })(offs[i], i);
    }
    return preset;
  })();

  // ── Ambience Niagara ──────────────────────────────────────────────────────
  // A waterfall: shader streams of light falling downward, color CYCLING
  // yellow<->teal via tintComp; a real circular waveform rides on top for the beat.
  P["Ambience Niagara"] = (function () {
    var preset = build(
      {
        wave_a: 0, decay: 0.97, gammaadj: 1.7, zoom: 1.0,
        dy: 0.012, warp: 0.03, darken_center: 0, wrap: 1
      },
      {
        frame: function (t) {
          var b = t.bass_att || t.bass || 1;
          var tr = t.treb_att || t.treb || 1;
          t.dy = 0.010 + 0.012 * b;
          t.q1 = 0.5;
          t.q2 = 0.5;
          t.q5 = 0.13 + 0.06 * b + 0.02 * tr;
          return t;
        },
        warp:
          NOISE_GLSL +
          "shader_body {\n" +
          "vec2 w = uv;\n" +
          "w.y += 0.012;\n" +
          "vec3 c = texture2D(sampler_main, w).rgb;\n" +
          "float streams = fbm(vec2(uv.x * 14.0, uv.y * 4.0 - time * 1.5));\n" +
          "streams = smoothstep(0.55, 0.9, streams);\n" +
          "c += vec3(streams) * (0.05 + 0.18 * bass);\n" +
          "ret = c - 0.004;\n" +
          "}\n",
        // WMP Niagara cycles teal/cyan <-> blue (a waterfall, not amber).
        comp: tintComp("vec3(0.10,0.80,0.80)", "vec3(0.10,0.35,0.95)", "0.06", "1.6")
      }
    );
    preset.waves[0] = circleWave("q1", "q2");
    preset.waves[0].baseVals.r = 0.95;
    preset.waves[0].baseVals.g = 0.95;
    preset.waves[0].baseVals.b = 0.80;
    return preset;
  })();

  // ── Ambience Blender ────────────────────────────────────────────────────────
  // A blender vortex: like Dizzy but more churning — the swirl is perturbed by fbm
  // so everything tumbles as it is blended into the center; amber.
  P["Ambience Blender"] = (function () {
    var preset = build(
      {
        wave_a: 0, decay: 0.95, gammaadj: 1.8, zoom: 1.03,
        rot: 0.04, warp: 0.12, warpscale: 1.6, warpanimspeed: 1.5,
        darken_center: 0, wrap: 0
      },
      {
        frame: function (t) {
          var b = t.bass_att || t.bass || 1;
          var m = t.mid || 1;
          t.zoom = 1.02 + 0.03 * b;
          t.rot = 0.03 + 0.06 * m;
          t.q1 = 0.5;
          t.q2 = 0.5;
          t.q5 = 0.13 + 0.07 * b;
          return t;
        },
        warp:
          NOISE_GLSL +
          "shader_body {\n" +
          "vec2 d = uv - vec2(0.5);\n" +
          "float turb = fbm(d * 6.0 + time * 0.4) - 0.5;\n" +
          "float a = 0.55 / (length(d) + 0.16) + turb * (0.8 + 1.5 * bass);\n" +
          "float s = sin(a + time * 0.5), c = cos(a + time * 0.5);\n" +
          "vec2 sw = vec2(d.x * c - d.y * s, d.x * s + d.y * c);\n" +
          "ret = texture2D(sampler_main, vec2(0.5) + sw * 0.985).rgb;\n" +
          "ret -= 0.004;\n" +
          "}\n",
        comp:
          // WMP Blender cycles blue <-> purple/pink as it churns.
          "shader_body {\n" +
          "vec3 c = texture2D(sampler_main, uv).rgb;\n" +
          "float v = dot(c, vec3(0.42));\n" +
          "vec3 tint = mix(vec3(0.20,0.30,0.95), vec3(0.70,0.25,0.95), 0.5+0.5*sin(time*0.07));\n" +
          "ret = tint * v * 1.7;\n" +
          "float dd = distance(uv, vec2(0.5));\n" +
          "ret += tint * exp(-dd * dd * 9.0) * (0.08 + 0.30 * bass);\n" +
          "}\n"
      }
    );
    preset.waves[0] = circleWave("q1", "q2");
    preset.waves[0].baseVals.r = 0.6; preset.waves[0].baseVals.g = 0.6; preset.waves[0].baseVals.b = 1.0;
    return preset;
  })();

  // ── Ambience X Marks the Spot ───────────────────────────────────────────────
  // A glowing amber X: two crossed real-audio spokes at +/-45 deg that pulse with
  // the waveform, over a soft center bloom; the X slowly rotates.
  P["Ambience X Marks the Spot"] = (function () {
    var preset = build(
      {
        wave_a: 0, decay: 0.95, gammaadj: 1.8, zoom: 1.0,
        rot: 0.0, warp: 0.02, darken_center: 0, wrap: 0
      },
      {
        frame: function (t) {
          var b = t.bass_att || t.bass || 1;
          t.q1 = t.time * 0.15;
          t.q6 = 0.14 + 0.10 * b;
          return t;
        },
        comp:
          // WMP X Marks the Spot sits in the magenta/pink family.
          "shader_body {\n" +
          "vec3 c = texture2D(sampler_main, uv).rgb;\n" +
          "float v = dot(c, vec3(0.45));\n" +
          "ret = vec3(0.95, 0.25, 0.70) * v * 1.7;\n" +
          "float dd = distance(uv, vec2(0.5));\n" +
          "ret += vec3(1.0, 0.45, 0.85) * exp(-dd * dd * 6.0) * (0.12 + 0.35 * bass);\n" +
          "}\n"
      }
    );
    var offs = [0.785, -0.785];
    for (var i = 0; i < 2; i++) {
      preset.waves[i] = spokeLine(0, 0.55, 0.16, 1.0, 0.5, 0.85);
      (function (off, idx) {
        preset.waves[idx].point_eqs = function (a) {
          var th = (a.q1 || 0) + off;
          var s = a.sample * 2.0 - 1.0;
          var amp = a.q6 || 0.16;
          var ct = Math.cos(th), st = Math.sin(th);
          a.x = 0.5 + s * 0.55 * ct - a.value1 * amp * st;
          a.y = 0.5 + s * 0.55 * st + a.value1 * amp * ct;
          return a;
        };
      })(offs[i], i);
    }
    return preset;
  })();

  // ════════════════════════════════════════════════════════════════════════
  // BATTERY family (colorful, energetic, center-focused; mostly fixed hue).
  // Every preset carries a real-audio element (circleWave/spokeLine/waveLine).
  // ════════════════════════════════════════════════════════════════════════

  // ── Battery brightsphere ──────────────────────────────────────────────────
  // A luminous shaded orb (rim-lit, bright core) swelling with bass on near-black,
  // wrapped by a real-audio circular waveform ring. Cool white/cyan-blue.
  P["Battery brightsphere"] = (function () {
    var preset = build(
      {
        wave_a: 0, decay: 0.90, gammaadj: 2.0, zoom: 1.0, warp: 0.02,
        darken_center: 0, wrap: 0, echo_alpha: 0
      },
      {
        frame: function (t) {
          var bass = t.bass_att || t.bass || 1;
          t.q1 = 0.5;
          t.q2 = 0.5;
          t.q5 = 0.20 + 0.08 * bass;
          t.decay = 0.90;
          return t;
        },
        comp:
          "shader_body {\n" +
          "vec3 prev = texture2D(sampler_main, uv).rgb;\n" +
          "vec2 d = uv - vec2(0.5);\n" +
          "d.x *= resolution.x / resolution.y;\n" +
          "float r = length(d);\n" +
          "float rad = 0.26 + 0.07 * bass;\n" +
          "float core = exp(-r*r * 22.0) * (1.0 + 0.6*bass_att);\n" +
          "float rim = smoothstep(rad, rad*0.7, r) * smoothstep(rad*0.45, rad*0.75, r);\n" +
          "float shade = clamp(1.0 - r/rad, 0.0, 1.0);\n" +
          "shade = pow(shade, 1.5);\n" +
          "vec3 sphereCol = vec3(0.45, 0.78, 1.0);\n" +
          "vec3 orb = sphereCol * (shade*0.55 + rim*0.9) + vec3(0.85,0.95,1.0)*core;\n" +
          "ret = prev * 0.55 + orb;\n" +
          "}\n"
      }
    );
    preset.waves[0] = circleWave("q1", "q2");
    preset.waves[0].baseVals.r = 0.7;
    preset.waves[0].baseVals.g = 0.92;
    preset.waves[0].baseVals.b = 1.0;
    preset.waves[0].baseVals.a = 0.9;
    preset.waves[0].baseVals.smoothing = 0.2;
    return preset;
  })();

  // ── Battery cominatcha ──────────────────────────────────────────────────────
  // "Comin' at cha": jagged real-audio rings spawn at center and fly OUTWARD via
  // feedback zoom > 1, aggressive and fast. Electric cyan.
  P["Battery cominatcha"] = (function () {
    var preset = build(
      {
        wave_a: 0, decay: 0.93, gammaadj: 2.1, zoom: 1.07, warp: 0.03,
        darken_center: 0, wrap: 0, echo_alpha: 0
      },
      {
        frame: function (t) {
          var bass = t.bass_att || t.bass || 1;
          var treb = t.treb_att || t.treb || 1;
          t.q1 = 0.5;
          t.q2 = 0.5;
          t.q5 = 0.06 + 0.05 * bass;
          t.zoom = 1.05 + 0.04 * bass;
          t.rot = 0.02 * (treb - 1.0);
          t.decay = 0.93;
          return t;
        },
        comp:
          "shader_body {\n" +
          "vec3 prev = texture2D(sampler_main, uv).rgb;\n" +
          "float lum = dot(prev, vec3(0.33));\n" +
          "vec3 tint = mix(vec3(0.0,0.7,1.0), vec3(0.0,1.0,0.85), lum);\n" +
          "ret = tint * lum * 1.5;\n" +
          "float d = distance(uv, vec2(0.5));\n" +
          "ret += vec3(0.1,0.8,1.0) * exp(-d*d*10.0) * (0.10 + 0.4*bass);\n" +
          "}\n"
      }
    );
    preset.waves[0] = circleWave("q1", "q2");
    preset.waves[0].baseVals.r = 0.2;
    preset.waves[0].baseVals.g = 0.95;
    preset.waves[0].baseVals.b = 1.0;
    preset.waves[0].baseVals.smoothing = 0.05;
    preset.waves[0].point_eqs = function (a) {
      var ang = a.sample * 6.2832;
      var rad = (a.q5 || 0.06) + 0.09 * a.value1;
      a.x = (a.q1 || 0.5) + rad * Math.cos(ang);
      a.y = (a.q2 || 0.5) + rad * Math.sin(ang);
      return a;
    };
    return preset;
  })();

  // ── Battery cottonstar ──────────────────────────────────────────────────────
  // Soft fluffy pastel star: a gentle blurry bloom with feathered edges, slow.
  // Pastel pink/lavender; carries a soft real-audio ring for the beat.
  P["Battery cottonstar"] = (function () {
    var preset = build(
      {
        wave_a: 0, decay: 0.96, gammaadj: 1.9, zoom: 1.005, warp: 0.05, warpscale: 0.8,
        darken_center: 0, wrap: 0, echo_alpha: 0
      },
      {
        frame: function (t) {
          var bass = t.bass_att || t.bass || 1;
          t.q1 = 0.5;
          t.q2 = 0.5;
          t.q5 = 0.16 + 0.05 * bass;
          t.rot = 0.01;
          t.decay = 0.96;
          return t;
        },
        comp:
          "shader_body {\n" +
          "vec3 prev = texture2D(sampler_main, uv).rgb;\n" +
          "vec2 d = uv - vec2(0.5);\n" +
          "d.x *= resolution.x / resolution.y;\n" +
          "float r = length(d);\n" +
          "float ang = atan(d.y, d.x);\n" +
          "float star = 0.5 + 0.5 * cos(ang * 5.0);\n" +
          "float reach = (0.18 + 0.05*bass) * (0.6 + 0.4*star);\n" +
          "float glow = exp(-r*r / (reach*reach + 0.002));\n" +
          "glow = pow(glow, 1.3);\n" +
          // WMP cottonstar cycles white <-> teal over time.
          "vec3 petal = mix(vec3(0.95,1.0,1.0), vec3(0.20,0.88,0.82), 0.5+0.5*sin(time*0.06));\n" +
          "ret = prev * 0.86 + petal * glow * (0.5 + 0.4*bass_att);\n" +
          "}\n"
      }
    );
    preset.waves[0] = circleWave("q1", "q2");
    preset.waves[0].baseVals.r = 0.7;
    preset.waves[0].baseVals.g = 1.0;
    preset.waves[0].baseVals.b = 0.95;
    preset.waves[0].baseVals.a = 0.7;
    preset.waves[0].baseVals.smoothing = 0.4;   // keep the jagged song waveform visible
    return preset;
  })();

  // ── Battery dandelion ─────────────────────────────────────────────────────
  // A dandelion seed-head: 3 real-audio spokes (6 arms) slowly rotating, plus a
  // dotted real-audio seed-ring at the tips. White / pale-yellow on dark.
  P["Battery dandelion"] = (function () {
    var DAND = [1.0, 1.0, 1.0];   // white seeds; the comp owns the cycling hue
    var preset = build(
      {
        wave_a: 0, decay: 0.91, gammaadj: 2.0, zoom: 1.0, warp: 0.01,
        darken_center: 0, wrap: 0, echo_alpha: 0
      },
      {
        frame: function (t) {
          var bass = t.bass_att || t.bass || 1;
          t.q1 = t.time * 0.25;
          t.q2 = 0.5;
          t.q3 = 0.5;
          t.q5 = 0.40 + 0.05 * bass;
          t.decay = 0.91;
          return t;
        },
        comp:
          // WMP dandelion cycles teal <-> magenta over time.
          "shader_body {\n" +
          "vec3 c = texture2D(sampler_main, uv).rgb;\n" +
          "float lum = dot(c, vec3(0.4));\n" +
          "vec3 tint = mix(vec3(0.15,0.90,0.80), vec3(0.95,0.25,0.85), 0.5+0.5*sin(time*0.05));\n" +
          "ret = tint * lum * 1.7;\n" +
          "float d = distance(uv, vec2(0.5));\n" +
          "ret += tint * exp(-d*d*6.0) * 0.08;\n" +
          "}\n"
      }
    );
    // 3 spokes at 0/60/120 deg => a 6-armed seed-head, sharing rotation a.q1.
    var offsets = [0.0, Math.PI / 3, 2 * Math.PI / 3];
    for (var i = 0; i < offsets.length; i++) {
      preset.waves[i] = spokeLine(0, 0.42, 0.05, DAND[0], DAND[1], DAND[2]);
      (function (off, idx) {
        preset.waves[idx].point_eqs = function (a) {
          var th = (a.q1 || 0.0) + off;
          var ct = Math.cos(th), st = Math.sin(th);
          var s = a.sample * 2.0 - 1.0;
          a.x = 0.5 + s * 0.42 * ct - a.value1 * 0.05 * st;
          a.y = 0.5 + s * 0.42 * st + a.value1 * 0.05 * ct;
          return a;
        };
      })(offsets[i], i);
    }
    // Dotted seed-ring near the spoke tips.
    preset.waves[3] = circleWave("q2", "q3");
    preset.waves[3].baseVals.usedots = 1;
    preset.waves[3].baseVals.r = 1.0;
    preset.waves[3].baseVals.g = 1.0;
    preset.waves[3].baseVals.b = 1.0;
    preset.waves[3].baseVals.smoothing = 0.3;
    return preset;
  })();

  // ── Battery drinkdeep ─────────────────────────────────────────────────────
  // A deep liquid well: inward pull (zoom < 1) + swirl draws everything down into a
  // dark center; deep blue/indigo. Real-audio ring ripples on the surface.
  P["Battery drinkdeep"] = (function () {
    var preset = build(
      {
        wave_a: 0, decay: 0.95, gammaadj: 1.9, zoom: 0.97, warp: 0.0,
        darken_center: 1, wrap: 0, echo_alpha: 0
      },
      {
        frame: function (t) {
          var bass = t.bass_att || t.bass || 1;
          t.q1 = 0.5;
          t.q2 = 0.5;
          t.q5 = 0.26 + 0.06 * bass;
          t.zoom = 0.95 - 0.02 * bass;
          t.decay = 0.95;
          return t;
        },
        warp:
          "shader_body {\n" +
          "vec2 d = uv - vec2(0.5);\n" +
          "float a = 0.25 / (length(d) + 0.15);\n" +
          "vec2 sw = vec2(d.x*cos(a)-d.y*sin(a), d.x*sin(a)+d.y*cos(a));\n" +
          "ret = texture2D(sampler_main, vec2(0.5)+sw*0.985).rgb;\n" +
          "ret -= 0.004;\n" +
          "}\n",
        comp:
          "shader_body {\n" +
          "vec3 prev = texture2D(sampler_main, uv).rgb;\n" +
          "float lum = dot(prev, vec3(0.33));\n" +
          "vec3 tint = mix(vec3(0.06,0.10,0.45), vec3(0.15,0.35,0.85), lum);\n" +
          "ret = tint * lum * 1.6;\n" +
          "float d = distance(uv, vec2(0.5));\n" +
          "ret *= smoothstep(0.0, 0.30, d);\n" +
          "ret += vec3(0.1,0.25,0.6) * exp(-d*d*7.0) * (0.05 + 0.15*bass);\n" +
          "}\n"
      }
    );
    preset.waves[0] = circleWave("q1", "q2");
    preset.waves[0].baseVals.r = 0.4;
    preset.waves[0].baseVals.g = 0.6;
    preset.waves[0].baseVals.b = 1.0;
    preset.waves[0].baseVals.a = 0.7;
    preset.waves[0].baseVals.smoothing = 0.5;
    return preset;
  })();

  // ── Battery elektrination ───────────────────────────────────────────────────
  // Electric lightning: several jagged real-audio bolts crossing center, flickering
  // with treble, electric cyan-white on near-black with a faint blue glow.
  P["Battery elektrination"] = (function () {
    var preset = build(
      { wave_a: 0, decay: 0.90, gammaadj: 2.1, zoom: 1.0, warp: 0.02, wrap: 0, darken_center: 1 },
      {
        frame: function (t) {
          var tr = t.treb || 1, ba = t.bass_att || 1;
          t.q1 = t.time * 0.25;
          t.q2 = 0.5;
          t.q3 = 0.5;
          t.q10 = 0.45 + 0.55 * Math.min(tr, 2.0);
          t.warp = 0.02 + 0.05 * (tr - 1);
          t.decay = 0.90;
          t.zoom = 1.0 + 0.01 * (ba - 1);
          return t;
        },
        comp:
          "shader_body {\n" +
          "vec2 w = uv;\n" +
          "ret = texture2D(sampler_main, w).rgb;\n" +
          "vec2 d = uv - vec2(0.5);\n" +
          "d.x *= resolution.x/resolution.y;\n" +
          "float glow = 0.05/(length(d)*8.0 + 0.4);\n" +
          "ret += vec3(0.06, 0.30, 0.12) * glow * (0.6 + 0.5*treb);\n" +   // green electric glow
          "}\n"
      }
    );
    var bolts = 4;
    for (var i = 0; i < bolts; i++) {
      (function (idx) {
        var off = (Math.PI / bolts) * idx;
        var wl = waveLine();
        wl.baseVals.smoothing = 0.02;
        wl.baseVals.r = 0.55; wl.baseVals.g = 1.0; wl.baseVals.b = 0.6; wl.baseVals.a = 0.85;
        wl.baseVals.additive = 1; wl.baseVals.usedots = 0;
        wl.point_eqs = function (a) {
          var ang = (a.q1 || 0) + off;
          var s = (a.sample - 0.5);
          var disp = ((a.value1 || 0.5) - 0.5) * 1.2;
          var c = Math.cos(ang), sn = Math.sin(ang);
          a.x = 0.5 + s * c - disp * sn;
          a.y = 0.5 + s * sn + disp * c;
          var fl = a.q10 || 0.6;
          a.r = 0.55 * fl; a.g = 1.0 * fl; a.b = 0.6 * fl; a.a = 0.85 * fl;
          return a;
        };
        preset.waves[idx] = wl;
      })(i);
    }
    return preset;
  })();

  // ── Battery event horizon ─────────────────────────────────────────────────
  // A black hole: a hot orange/gold accretion ring (real-audio circleWave) orbiting
  // a DARK center, with a lensing swirl pulling light around.
  P["Battery event horizon"] = (function () {
    var preset = build(
      { wave_a: 0, decay: 0.94, gammaadj: 2.0, zoom: 1.0, warp: 0.0, wrap: 0, darken_center: 1 },
      {
        frame: function (t) {
          var ba = t.bass_att || 1;
          t.q1 = 0.5;
          t.q2 = 0.5;
          t.q5 = 0.18 + 0.07 * (ba - 1);
          t.q3 = t.time * 0.4;
          t.decay = 0.94;
          return t;
        },
        comp:
          "shader_body {\n" +
          "vec2 d = uv - vec2(0.5);\n" +
          "float a = 0.30/(length(d)+0.12);\n" +
          "vec2 sw = vec2(d.x*cos(a)-d.y*sin(a), d.x*sin(a)+d.y*cos(a));\n" +
          "ret = texture2D(sampler_main, vec2(0.5)+sw*0.99).rgb;\n" +
          "vec2 dd = uv - vec2(0.5);\n" +
          "dd.x *= resolution.x/resolution.y;\n" +
          "float core = smoothstep(0.0, 0.20, length(dd));\n" +
          "ret *= core;\n" +
          "ret -= 0.004;\n" +
          "}\n"
      }
    );
    preset.waves[0] = circleWave("q1", "q2");
    preset.waves[0].baseVals.r = 1.0;
    preset.waves[0].baseVals.g = 0.55;
    preset.waves[0].baseVals.b = 0.10;
    preset.waves[0].baseVals.a = 0.9;
    preset.waves[0].baseVals.additive = 1;
    preset.waves[0].baseVals.smoothing = 0.5;
    preset.waves[0].point_eqs = function (a) {
      var cx = a.q1 || 0.5, cy = a.q2 || 0.5;
      var ang = a.sample * 6.2831853 + (a.q3 || 0);
      var rad = (a.q5 || 0.18) + 0.10 * ((a.value1 || 0.5) - 0.5);
      a.x = cx + rad * Math.cos(ang);
      a.y = cy + rad * Math.sin(ang);
      var heat = 0.7 + 0.3 * (a.value1 || 0.5);
      a.r = 1.0 * heat; a.g = 0.55 * heat; a.b = 0.10 * heat; a.a = 0.9;
      return a;
    };
    return preset;
  })();

  // ── Battery hzodge ──────────────────────────────────────────────────────────
  // Abstract hodge-podge: turbulent fbm warp churn + a real-audio ring layered on
  // top. One bold fixed hue (magenta/purple) so it reads as energy, not mud.
  P["Battery hzodge"] = (function () {
    var preset = build(
      { wave_a: 0, decay: 0.93, gammaadj: 1.9, zoom: 1.0, warp: 0.06, wrap: 1, darken_center: 1 },
      {
        frame: function (t) {
          var m = t.mid || 1, ba = t.bass_att || 1;
          t.q1 = 0.5;
          t.q2 = 0.5;
          t.q5 = 0.14 + 0.06 * (ba - 1);
          t.warp = 0.06 + 0.05 * (m - 1);
          t.rot = 0.02 * Math.sin(t.time * 0.3);
          t.decay = 0.93;
          return t;
        },
        warp:
          NOISE_GLSL +
          "shader_body {\n" +
          "vec2 w = uv;\n" +
          "vec2 d = w - vec2(0.5);\n" +
          "d.x *= resolution.x/resolution.y;\n" +
          "float n = fbm(d*3.0 + vec2(time*0.15, -time*0.10));\n" +
          "vec2 off = vec2(n - 0.5, fbm(d*3.0 + 7.3) - 0.5) * (0.02 + 0.03*bass);\n" +
          "ret = texture2D(sampler_main, w + off).rgb;\n" +
          "}\n",
        comp:
          "shader_body {\n" +
          "vec2 w = uv;\n" +
          "vec3 c = texture2D(sampler_main, w).rgb;\n" +
          "float l = dot(c, vec3(0.33));\n" +
          // WMP hzodge is a green/teal swirl, not magenta.
          "vec3 grn = vec3(0.18, 0.85, 0.55);\n" +
          "ret = grn * (0.3 + 1.3*l);\n" +
          "vec2 d = uv - vec2(0.5);\n" +
          "d.x *= resolution.x/resolution.y;\n" +
          "ret += vec3(0.04, 0.25, 0.18) * (0.04/(length(d)+0.15)) * (0.5+0.5*bass);\n" +
          "}\n"
      }
    );
    preset.waves[0] = circleWave("q1", "q2");
    preset.waves[0].baseVals.r = 0.35;
    preset.waves[0].baseVals.g = 1.0;
    preset.waves[0].baseVals.b = 0.70;
    preset.waves[0].baseVals.a = 0.85;
    preset.waves[0].baseVals.additive = 1;
    preset.waves[0].baseVals.smoothing = 0.25;
    return preset;
  })();

  // ── Battery sepalvel ──────────────────────────────────────────────────────
  // Petals / velvet: soft layered petal arcs rotating gently, plush velvety look,
  // deep red/crimson. A real-audio ring whose spikes form petal tips.
  P["Battery sepalvel"] = (function () {
    var preset = build(
      { wave_a: 0, decay: 0.95, gammaadj: 1.8, zoom: 0.995, warp: 0.03, wrap: 0, darken_center: 1 },
      {
        frame: function (t) {
          var ba = t.bass_att || 1, m = t.mid || 1;
          t.q1 = 0.5;
          t.q2 = 0.5;
          t.q5 = 0.16 + 0.05 * (ba - 1);
          t.q3 = t.time * 0.18;
          t.rot = 0.01 + 0.01 * Math.sin(t.time * 0.2);
          t.zoom = 0.995;
          t.warp = 0.03 + 0.02 * (m - 1);
          t.decay = 0.95;
          return t;
        },
        comp:
          "shader_body {\n" +
          "vec2 w = uv;\n" +
          "vec3 c = texture2D(sampler_main, w).rgb;\n" +
          "float l = dot(c, vec3(0.33));\n" +
          "vec3 crimson = vec3(0.75, 0.06, 0.16);\n" +
          "vec3 deep = vec3(0.18, 0.0, 0.05);\n" +
          "ret = mix(deep, crimson, l*1.4);\n" +
          "vec2 d = uv - vec2(0.5);\n" +
          "d.x *= resolution.x/resolution.y;\n" +
          "float velvet = 0.05/(length(d)+0.25);\n" +
          "ret += vec3(0.20, 0.0, 0.04) * velvet * (0.6+0.4*bass_att);\n" +
          "}\n"
      }
    );
    preset.waves[0] = circleWave("q1", "q2");
    preset.waves[0].baseVals.r = 0.85;
    preset.waves[0].baseVals.g = 0.10;
    preset.waves[0].baseVals.b = 0.22;
    preset.waves[0].baseVals.a = 0.75;
    preset.waves[0].baseVals.additive = 1;
    preset.waves[0].baseVals.smoothing = 0.4;   // let the song waveform shape the petal tips
    preset.waves[0].point_eqs = function (a) {
      var cx = a.q1 || 0.5, cy = a.q2 || 0.5;
      var ang = a.sample * 6.2831853 + (a.q3 || 0);
      var petal = 0.06 * Math.abs(Math.sin(ang * 3.0));
      var rad = (a.q5 || 0.16) + petal + 0.12 * ((a.value1 || 0.5) - 0.5);
      a.x = cx + rad * Math.cos(ang);
      a.y = cy + rad * Math.sin(ang);
      a.r = 0.85; a.g = 0.10; a.b = 0.22; a.a = 0.75;
      return a;
    };
    return preset;
  })();

  // ── Battery illuminator ─────────────────────────────────────────────────────
  // Radiating light beams: bright real-audio spokes shooting outward from center,
  // god-ray feel, warm white/gold on near-black.
  P["Battery illuminator"] = (function () {
    var preset = build(
      { wave_a: 0, decay: 0.92, gammaadj: 2.1, zoom: 1.02, warp: 0.0, wrap: 0, darken_center: 0 },
      {
        frame: function (t) {
          var ba = t.bass_att || 1;
          t.q1 = t.time * 0.15;
          t.q10 = 0.5 + 0.5 * Math.min(ba, 2.0);
          t.zoom = 1.02 + 0.02 * (ba - 1);
          t.decay = 0.92;
          return t;
        },
        comp:
          "shader_body {\n" +
          "vec2 w = uv;\n" +
          "ret = texture2D(sampler_main, w).rgb;\n" +
          "vec2 d = uv - vec2(0.5);\n" +
          "d.x *= resolution.x/resolution.y;\n" +
          "float bloom = 0.07/(length(d)*6.0 + 0.3);\n" +
          "ret += vec3(0.30, 0.24, 0.10) * bloom * (0.6 + 0.5*bass_att);\n" +
          "}\n"
      }
    );
    var beams = 6;
    for (var i = 0; i < beams; i++) {
      (function (idx) {
        var off = (2 * Math.PI / beams) * idx;
        var sp = spokeLine(0, 0.48, 0.06, 1.0, 0.92, 0.6);
        sp.baseVals.smoothing = 0.4; sp.baseVals.additive = 1; sp.baseVals.usedots = 0;
        sp.point_eqs = function (a) {
          var ang = (a.q1 || 0) + off;
          var s = (a.sample - 0.5) * 2.0;
          var disp = ((a.value1 || 0.5) - 0.5) * 0.5;
          var c = Math.cos(ang), sn = Math.sin(ang);
          a.x = 0.5 + s * 0.48 * c - disp * sn;
          a.y = 0.5 + s * 0.48 * sn + disp * c;
          var br = a.q10 || 0.7;
          var taper = 1.0 - Math.abs(s);
          a.r = 1.0 * br * (0.5 + 0.5 * taper);
          a.g = 0.92 * br * (0.5 + 0.5 * taper);
          a.b = 0.6 * br * (0.5 + 0.5 * taper);
          a.a = 0.8 * br;
          return a;
        };
        preset.waves[idx] = sp;
      })(i);
    }
    return preset;
  })();

  // ── Battery i learned the truth ─────────────────────────────────────────────
  // A revelation: a white/gold core flashes from center on the beat (real-audio
  // ring expanding outward with bass) fading into a deep blue surround.
  P["Battery i learned the truth"] = (function () {
    var preset = build(
      { wave_a: 0, decay: 0.93, gammaadj: 2.0, zoom: 1.0, warp: 0.02, darken_center: 0, wrap: 0 },
      {
        frame: function (t) {
          var bass = t.bass_att || t.bass || 1;
          var treb = t.treb || 1;
          t.q1 = 0.5; t.q2 = 0.5;
          t.q5 = 0.08 + 0.30 * bass;
          t.q6 = 0.04 + 0.06 * treb;
          t.zoom = 1.012 + 0.02 * bass;
          t.decay = 0.93;
          return t;
        },
        comp:
          "shader_body {\n" +
          "vec3 c = texture2D(sampler_main, uv).rgb;\n" +
          "vec2 d = uv - 0.5;\n" +
          "d.x *= resolution.x / resolution.y;\n" +
          "float r = length(d);\n" +
          "float core = exp(-r*r*14.0) * (0.25 + 1.1*bass);\n" +
          "vec3 flash = vec3(1.0, 0.92, 0.65) * core;\n" +
          "vec3 surround = vec3(0.04, 0.10, 0.40) * (0.6 + 0.4*mid);\n" +
          "ret = c + flash + surround * smoothstep(0.0, 0.7, r) * 0.5;\n" +
          "}\n"
      }
    );
    preset.waves[0] = circleWave("q1", "q2");
    preset.waves[0].baseVals.r = 1.0;
    preset.waves[0].baseVals.g = 0.92;
    preset.waves[0].baseVals.b = 0.6;
    preset.waves[0].baseVals.a = 1.0;
    preset.waves[0].baseVals.smoothing = 0.2;
    preset.waves[0].point_eqs = function (a) {
      var ang = a.sample * 6.2832;
      var rad = (a.q5 || 0.15) + (a.q6 || 0.05) * a.value1;
      a.x = 0.5 + rad * Math.cos(ang);
      a.y = 0.5 + rad * Math.sin(ang);
      return a;
    };
    return preset;
  })();

  // ── Battery kaleidovision ───────────────────────────────────────────────────
  // A kaleidoscope: 6-fold mirror symmetry of a churning real-audio waveform field,
  // full RAINBOW (pal) that constantly shifts with time and radius.
  P["Battery kaleidovision"] = (function () {
    var preset = build(
      { wave_a: 0, decay: 0.94, gammaadj: 1.9, zoom: 1.0, warp: 0.03, rot: 0.01, darken_center: 0, wrap: 0 },
      {
        frame: function (t) {
          var bass = t.bass_att || t.bass || 1;
          t.q1 = 0.5 + 0.18 * Math.cos(t.time * 0.7);
          t.q2 = 0.5 + 0.18 * Math.sin(t.time * 0.9);
          t.q5 = 0.14 + 0.07 * bass;
          t.rot = 0.01 + 0.02 * Math.sin(t.time * 0.3);
          t.decay = 0.94;
          return t;
        },
        comp:
          PAL_GLSL +
          "shader_body {\n" +
          "vec2 d = uv - 0.5;\n" +
          "d.x *= resolution.x / resolution.y;\n" +
          "float PI = 3.14159265;\n" +
          "float seg = 2.0*PI/6.0;\n" +
          "float ang = atan(d.y, d.x);\n" +
          "ang = abs(mod(ang, seg) - seg*0.5);\n" +
          "float rad = length(d);\n" +
          "vec2 m = rad * vec2(cos(ang), sin(ang)) + 0.5;\n" +
          "vec3 c = texture2D(sampler_main, m).rgb;\n" +
          "float lum = dot(c, vec3(0.33));\n" +
          // WMP kaleidovision is GREEN-dominant with faint spectral speckle, not full rainbow.
          "vec3 speck = pal(time*0.05 + rad*1.5);\n" +
          "vec3 col = mix(vec3(0.30,1.0,0.40), speck, 0.22);\n" +
          "ret = col * lum * 1.7;\n" +
          "ret += vec3(0.30,1.0,0.40) * exp(-rad*rad*9.0) * (0.10 + 0.35*bass);\n" +
          "}\n"
      }
    );
    preset.waves[0] = circleWave("q1", "q2");
    preset.waves[0].baseVals.r = 1.0;
    preset.waves[0].baseVals.g = 1.0;
    preset.waves[0].baseVals.b = 1.0;
    preset.waves[0].baseVals.smoothing = 0.05;
    return preset;
  })();

  // ── Battery chemicalnova ────────────────────────────────────────────────────
  // An explosive nova: violent radial starburst — real-audio circleWave with BIG
  // spikes scaled hard by bass (low smoothing); toxic green/cyan with a hot core.
  P["Battery chemicalnova"] = (function () {
    var preset = build(
      { wave_a: 0, decay: 0.91, gammaadj: 2.1, zoom: 1.0, warp: 0.05, darken_center: 0, wrap: 0 },
      {
        frame: function (t) {
          var bass = t.bass_att || t.bass || 1;
          var treb = t.treb_att || t.treb || 1;
          t.q1 = 0.5; t.q2 = 0.5;
          t.q5 = 0.07 + 0.04 * treb;
          t.q6 = 0.18 + 0.40 * bass;
          t.zoom = 1.01 + 0.03 * bass;
          t.decay = 0.91;
          return t;
        },
        comp:
          PAL_GLSL +
          "shader_body {\n" +
          "vec3 c = texture2D(sampler_main, uv).rgb;\n" +
          "vec2 d = uv - 0.5;\n" +
          "d.x *= resolution.x / resolution.y;\n" +
          "float r = length(d);\n" +
          "float ang = atan(d.y, d.x);\n" +
          "float lum = dot(c, vec3(0.33));\n" +
          // WMP chemicalnova is a full-spectrum psychedelic burst — hue sweeps by angle+radius.
          "vec3 tint = pal(ang/6.2832 + r*0.6 - time*0.12);\n" +
          "ret = tint * lum * 1.9;\n" +
          "ret += vec3(1.0) * exp(-r*r*22.0) * (0.3 + 1.2*bass);\n" +
          "}\n"
      }
    );
    preset.waves[0] = circleWave("q1", "q2");
    preset.waves[0].baseVals.r = 1.0;
    preset.waves[0].baseVals.g = 1.0;
    preset.waves[0].baseVals.b = 1.0;
    preset.waves[0].baseVals.a = 1.0;
    preset.waves[0].baseVals.smoothing = 0.03;
    preset.waves[0].point_eqs = function (a) {
      var ang = a.sample * 6.2832;
      var rad = (a.q5 || 0.07) + (a.q6 || 0.3) * a.value1;
      a.x = 0.5 + rad * Math.cos(ang);
      a.y = 0.5 + rad * Math.sin(ang);
      return a;
    };
    return preset;
  })();

  // ── Battery lotus ───────────────────────────────────────────────────────────
  // A lotus flower: two concentric layered real-audio petal rings (abs(sin(ang*N))
  // petal modulation) opening; serene pink/white petals with a golden center.
  P["Battery lotus"] = (function () {
    var preset = build(
      { wave_a: 0, decay: 0.95, gammaadj: 1.9, zoom: 1.0, warp: 0.02, darken_center: 0, wrap: 0 },
      {
        frame: function (t) {
          var bass = t.bass_att || t.bass || 1;
          var mid = t.mid || 1;
          t.q1 = 0.5; t.q2 = 0.5;
          t.q5 = 0.10 + 0.05 * bass;
          t.q6 = 0.20 + 0.05 * mid;
          t.q7 = 0.04 + 0.05 * bass;
          t.decay = 0.95;
          return t;
        },
        comp:
          "shader_body {\n" +
          "vec3 c = texture2D(sampler_main, uv).rgb;\n" +
          "vec2 d = uv - 0.5;\n" +
          "d.x *= resolution.x / resolution.y;\n" +
          "float r = length(d);\n" +
          "float lum = dot(c, vec3(0.33));\n" +
          // WMP lotus holds magenta/purple petals with a warm golden center.
          "vec3 petal = vec3(0.80, 0.28, 0.95);\n" +
          "ret = mix(petal, vec3(1.0,0.85,1.0), 0.25) * lum * 1.7;\n" +
          "ret += vec3(1.0, 0.82, 0.4) * exp(-r*r*28.0) * (0.25 + 0.5*bass);\n" +
          "}\n"
      }
    );
    preset.waves[0] = circleWave("q1", "q2");
    preset.waves[0].baseVals.r = 0.85;
    preset.waves[0].baseVals.g = 0.35;
    preset.waves[0].baseVals.b = 1.0;
    preset.waves[0].baseVals.smoothing = 0.3;
    preset.waves[0].point_eqs = function (a) {
      var ang = a.sample * 6.2832;
      var petal = 0.55 + 0.45 * Math.abs(Math.sin(ang * 5.0));
      var rad = ((a.q5 || 0.10) + (a.q7 || 0.05) * a.value1) * petal;
      a.x = 0.5 + rad * Math.cos(ang);
      a.y = 0.5 + rad * Math.sin(ang);
      return a;
    };
    preset.waves[1] = circleWave("q1", "q2");
    preset.waves[1].baseVals.r = 0.95;
    preset.waves[1].baseVals.g = 0.55;
    preset.waves[1].baseVals.b = 1.0;
    preset.waves[1].baseVals.smoothing = 0.3;
    preset.waves[1].point_eqs = function (a) {
      var ang = a.sample * 6.2832 + 0.4;
      var petal = 0.6 + 0.4 * Math.abs(Math.sin(ang * 8.0));
      var rad = ((a.q6 || 0.20) + (a.q7 || 0.05) * a.value1) * petal;
      a.x = 0.5 + rad * Math.cos(ang);
      a.y = 0.5 + rad * Math.sin(ang);
      return a;
    };
    return preset;
  })();

  // ── Battery green is not your enemy ─────────────────────────────────────────
  // Lush, friendly green: a calming organic fbm field, fixed green hue, gentle
  // drift, with a real-audio ring rippling smoothly through it.
  P["Battery green is not your enemy"] = (function () {
    var preset = build(
      { wave_a: 0, decay: 0.95, gammaadj: 1.9, zoom: 1.005, warp: 0.06, rot: 0.005, darken_center: 0, wrap: 1 },
      {
        frame: function (t) {
          var bass = t.bass_att || t.bass || 1;
          t.q1 = 0.5 + 0.05 * Math.cos(t.time * 0.4);
          t.q2 = 0.5 + 0.05 * Math.sin(t.time * 0.35);
          t.q5 = 0.16 + 0.06 * bass;
          t.warp = 0.05 + 0.03 * Math.sin(t.time * 0.2);
          t.decay = 0.95;
          return t;
        },
        comp:
          NOISE_GLSL +
          "shader_body {\n" +
          "vec3 c = texture2D(sampler_main, uv).rgb;\n" +
          "vec2 d = uv - 0.5;\n" +
          "d.x *= resolution.x / resolution.y;\n" +
          "float r = length(d);\n" +
          "float lum = dot(c, vec3(0.33));\n" +
          "float n = fbm(uv*3.0 + time*0.08);\n" +
          "vec3 green = vec3(0.18, 0.85, 0.35);\n" +
          "vec3 leaf = vec3(0.35, 1.0, 0.45);\n" +
          "ret = mix(green, leaf, n) * lum * 1.6;\n" +
          "ret += green * (0.03 + 0.05*n) * (0.5 + 0.5*sin(time*0.15));\n" +
          "ret += leaf * exp(-r*r*7.0) * 0.04*mid;\n" +
          "}\n"
      }
    );
    preset.waves[0] = circleWave("q1", "q2");
    preset.waves[0].baseVals.r = 0.4;
    preset.waves[0].baseVals.g = 1.0;
    preset.waves[0].baseVals.b = 0.5;
    preset.waves[0].baseVals.a = 0.9;
    preset.waves[0].baseVals.smoothing = 0.5;
    return preset;
  })();

  // ── Battery sleepyspray ─────────────────────────────────────────────────────
  // A gentle drifting spray of soft particles floating upward, dreamy and calm;
  // soft cyan/lavender; slow upward feedback drift, a soft real-audio ring.
  P["Battery sleepyspray"] = (function () {
    var preset = build(
      {
        wave_a: 0, decay: 0.95, gammaadj: 1.9, zoom: 1.0, warp: 0.05,
        rot: 0, dy: -0.012, cx: 0.5, cy: 0.5, darken_center: 1, wrap: 0,
        wave_smoothing: 0.6, additivewave: 1
      },
      {
        frame: function (t) {
          var b = t.bass_att || 1, tr = t.treb || 1;
          t.q1 = 0.5;
          t.q2 = 0.5;
          t.q5 = 0.10 + 0.07 * b;
          t.zoom = 1.006 + 0.004 * b;
          t.dy = -0.010 - 0.006 * tr;
          t.warp = 0.05;
          t.decay = 0.95;
          return t;
        },
        comp:
          "shader_body {\n" +
          "vec3 c = texture2D(sampler_main, uv).rgb;\n" +
          "float lum = dot(c, vec3(0.33));\n" +
          "vec3 cyan = vec3(0.45,0.85,1.0);\n" +
          "vec3 lav  = vec3(0.70,0.62,1.0);\n" +
          "float h = 0.5 + 0.5*sin(time*0.12);\n" +
          "vec3 tint = mix(cyan, lav, h);\n" +
          "ret = tint * lum * 1.25;\n" +
          "vec2 d = uv - 0.5; d.x *= resolution.x/resolution.y;\n" +
          "ret += tint * exp(-dot(d,d)*6.0) * (0.06 + 0.18*bass);\n" +
          "}\n"
      }
    );
    preset.waves[0] = circleWave("q1", "q2");
    preset.waves[0].baseVals.r = 0.55;
    preset.waves[0].baseVals.g = 0.85;
    preset.waves[0].baseVals.b = 1.0;
    preset.waves[0].baseVals.a = 0.7;
    preset.waves[0].baseVals.smoothing = 0.5;
    return preset;
  })();

  // ── Battery smoke or water? ─────────────────────────────────────────────────
  // Ambiguous smoky/watery fluid: turbulent fbm warp billowing; blue-grey/teal;
  // a real-audio ring stirs the fluid. Long decay for smoke trails.
  P["Battery smoke or water?"] = (function () {
    var preset = build(
      {
        wave_a: 0, decay: 0.965, gammaadj: 2.0, zoom: 1.0, warp: 0.18,
        rot: 0.01, cx: 0.5, cy: 0.5, darken_center: 0, wrap: 1,
        wave_smoothing: 0.7, additivewave: 1
      },
      {
        frame: function (t) {
          var b = t.bass_att || 1, m = t.mid || 1;
          t.q1 = 0.5;
          t.q2 = 0.5;
          t.q5 = 0.12 + 0.06 * b;
          t.warp = 0.16 + 0.10 * m;
          t.rot = 0.008 + 0.012 * b;
          t.decay = 0.965;
          return t;
        },
        warp:
          NOISE_GLSL +
          "shader_body {\n" +
          "vec2 w = uv;\n" +
          "float n = fbm(w*4.0 + vec2(time*0.08, -time*0.05));\n" +
          "float n2 = fbm(w*7.0 - vec2(time*0.04));\n" +
          "vec2 flow = vec2(n - 0.5, n2 - 0.5) * (0.020 + 0.020*bass);\n" +
          "ret = texture2D(sampler_main, w + flow).rgb;\n" +
          "ret -= 0.003;\n" +
          "}\n",
        comp:
          "shader_body {\n" +
          "vec3 c = texture2D(sampler_main, uv).rgb;\n" +
          "float lum = dot(c, vec3(0.33));\n" +
          // WMP smoke-or-water? is essentially greyscale (white/grey smoke, faint cool tint).
          "vec3 grey = vec3(0.66, 0.70, 0.74);\n" +
          "ret = grey * (0.45 + 1.2*lum);\n" +
          "vec2 d = uv - 0.5; d.x *= resolution.x/resolution.y;\n" +
          "ret += grey * exp(-dot(d,d)*5.0) * (0.05 + 0.18*bass);\n" +
          "}\n"
      }
    );
    preset.waves[0] = circleWave("q1", "q2");
    preset.waves[0].baseVals.r = 0.45;
    preset.waves[0].baseVals.g = 0.72;
    preset.waves[0].baseVals.b = 0.78;
    preset.waves[0].baseVals.a = 0.7;
    preset.waves[0].baseVals.smoothing = 0.4;   // keep the stirring waveform legible
    return preset;
  })();

  // ── Battery spider's last moment ────────────────────────────────────────────
  // A spider web: 3 real-audio radial spokes (6 spans) + 1 real-audio concentric
  // thread ring; thin pale-silver lines on near-black, faintly trembling. Eerie.
  P["Battery spider's last moment"] = (function () {
    var preset = build(
      {
        wave_a: 0, decay: 0.88, gammaadj: 2.1, zoom: 1.0, warp: 0.0,
        rot: 0, cx: 0.5, cy: 0.5, darken_center: 1, wrap: 0,
        additivewave: 1
      },
      {
        frame: function (t) {
          var b = t.bass_att || 1, tr = t.treb_att || 1;
          t.q1 = t.time * 0.05 + 0.01 * Math.sin(t.time * 7.0) * tr;
          t.q2 = 0.5;
          t.q3 = 0.5;
          t.q5 = 0.10 + 0.04 * b;
          t.decay = 0.88;
          return t;
        },
        comp:
          "shader_body {\n" +
          "vec3 c = texture2D(sampler_main, uv).rgb;\n" +
          "ret = c * vec3(0.45,1.0,0.55);\n" +    // WMP spider web threads glow green
          "float bg = 0.015;\n" +
          "ret += vec3(bg*0.4, bg*1.2, bg*0.5);\n" +
          "}\n"
      }
    );
    var offs = [0.0, 1.047, 2.094];
    for (var i = 0; i < offs.length; i++) {
      preset.waves[i] = spokeLine(0, 0.55, 0.04, 0.55, 1.0, 0.6);
      (function (off, idx) {
        preset.waves[idx].point_eqs = function (a) {
          var th = (a.q1 || 0) + off;
          var s = a.sample * 2.0 - 1.0;
          var ct = Math.cos(th), st = Math.sin(th);
          a.x = 0.5 + s * 0.55 * ct - a.value1 * 0.04 * st;
          a.y = 0.5 + s * 0.55 * st + a.value1 * 0.04 * ct;
          return a;
        };
      })(offs[i], i);
    }
    preset.waves[3] = circleWave("q2", "q3");
    preset.waves[3].baseVals.r = 0.5;
    preset.waves[3].baseVals.g = 1.0;
    preset.waves[3].baseVals.b = 0.55;
    preset.waves[3].baseVals.a = 0.6;
    preset.waves[3].baseVals.smoothing = 0.3;
    return preset;
  })();

  // ── Battery the world ───────────────────────────────────────────────────────
  // A rotating globe: a sphere shaded in comp (blue oceans, hints of green) with a
  // real-audio equator ring; rotation via a scrolling longitude pattern. Deep blue.
  P["Battery the world"] = (function () {
    var preset = build(
      {
        wave_a: 0, decay: 0.90, gammaadj: 2.0, zoom: 1.0, warp: 0.0,
        rot: 0, cx: 0.5, cy: 0.5, darken_center: 0, wrap: 0,
        additivewave: 1
      },
      {
        frame: function (t) {
          var b = t.bass_att || 1;
          t.q1 = 0.5;
          t.q2 = 0.5;
          t.q5 = 0.30 + 0.03 * b;
          t.decay = 0.90;
          return t;
        },
        comp:
          NOISE_GLSL +
          "shader_body {\n" +
          "vec3 fb = texture2D(sampler_main, uv).rgb;\n" +
          "vec2 d = uv - 0.5; d.x *= resolution.x/resolution.y;\n" +
          "float r = length(d);\n" +
          "float R = 0.32;\n" +
          "float sphere = smoothstep(R, R-0.02, r);\n" +
          "float z = sqrt(max(R*R - dot(d,d), 0.0)) / R;\n" +
          "float lon = atan(d.x, z) * 1.4 + time*0.25;\n" +
          "float lat = d.y / R;\n" +
          "float land = fbm(vec2(lon*1.2, lat*2.0));\n" +
          "vec3 ocean = vec3(0.06,0.22,0.55);\n" +
          "vec3 deep  = vec3(0.02,0.10,0.35);\n" +
          "vec3 grn   = vec3(0.12,0.45,0.22);\n" +
          "vec3 surf = mix(mix(deep, ocean, smoothstep(0.0,0.6,land)), grn, smoothstep(0.62,0.72,land));\n" +
          "float shade = 0.45 + 0.55*z;\n" +
          "vec3 globe = surf * shade * sphere;\n" +
          "globe += vec3(0.5,0.7,1.0) * pow(z, 4.0) * 0.15 * sphere;\n" +
          "ret = globe + fb * (0.30 + sphere*0.20);\n" +
          "}\n"
      }
    );
    preset.waves[0] = circleWave("q1", "q2");
    preset.waves[0].baseVals.r = 0.55;
    preset.waves[0].baseVals.g = 0.80;
    preset.waves[0].baseVals.b = 1.0;
    preset.waves[0].baseVals.a = 0.7;
    preset.waves[0].baseVals.smoothing = 0.4;
    return preset;
  })();

  // ── Battery back to the groove ──────────────────────────────────────────────
  // Retro oscilloscope groove: a real-audio horizontal scope line (waveLine, q1=0)
  // on a scrolling grid with slow hue drift and scanlines. Funky and rhythmic.
  P["Battery back to the groove"] = (function () {
    var preset = build(
      {
        wave_a: 0, decay: 0.93, gammaadj: 2.0, zoom: 1.0, warp: 0.0,
        rot: 0, cx: 0.5, cy: 0.5, darken_center: 0, wrap: 0,
        additivewave: 1
      },
      {
        frame: function (t) {
          t.q1 = 0;
          t.q2 = 0.5;
          t.q3 = 0.5;
          t.q8 = (t.time * 0.05) % 1;
          t.decay = 0.93;
          return t;
        },
        comp:
          "shader_body {\n" +
          "vec3 fb = texture2D(sampler_main, uv).rgb;\n" +
          "vec2 w = uv;\n" +
          "vec2 g = abs(fract(vec2(w.x*16.0, w.y*12.0 + time*0.15)) - 0.5);\n" +
          "float grid = smoothstep(0.46, 0.5, max(g.x, g.y));\n" +
          "vec3 gridcol = vec3(0.10,0.30,0.18) * grid * (0.5 + 0.5*bass);\n" +
          // WMP back-to-the-groove cycles teal <-> yellow-green over its span.
          "vec3 hue = mix(vec3(0.15,0.85,0.70), vec3(0.70,0.95,0.20), 0.5+0.5*sin(time*0.07));\n" +
          "ret = fb * hue * 1.5 + gridcol;\n" +
          "float scan = 0.92 + 0.08*sin(w.y*resolution.y*0.6);\n" +
          "ret *= scan;\n" +
          "}\n"
      }
    );
    preset.waves[0] = waveLine();
    preset.waves[0].baseVals.a = 0.9;
    preset.waves[0].baseVals.smoothing = 0.02;
    return preset;
  })();

  window.WMP_PRESETS = P;
})();
