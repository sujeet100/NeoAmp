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

  var P = {};

  // ── Dance of the Freaky Circles (Bateria: taniec dźwiękowych kółek) ─────────
  // Magenta circular waveform; a second echoed ring fades in and out so you see
  // one ring sometimes and two at others; the background washes slowly between
  // dark and purple (matching the WMP capture); radius pulses with the bass.
  P["Dance of the Freaky Circles"] = (function () {
    var preset = build(
      {
        wave_a: 0,             // primary waveform off; the two custom circles draw it
        decay: 0.92,           // trails leave faint motion arcs as the circles orbit
        gammaadj: 2.0,
        zoom: 1.0,
        warp: 0.04,
        echo_alpha: 0,
        darken_center: 0,
        wrap: 0
      },
      {
        // Two orbit centers (q1,q2)=(q3,q4) on opposite sides of center, plus a
        // bass-pulsing radius (q5). Read by the two circleWave point equations.
        frame: function (t) {
          var bass = t.bass_att || t.bass || 1;
          var th = t.time * 0.6;
          var orbit = 0.13;
          t.q1 = 0.5 + orbit * Math.cos(th);
          t.q2 = 0.5 + orbit * Math.sin(th);
          t.q3 = 0.5 - orbit * Math.cos(th);
          t.q4 = 0.5 - orbit * Math.sin(th);
          t.q5 = 0.12 + 0.06 * bass;     // ring radius pulses with bass
          t.decay = 0.92;
          return t;
        },
        // Mostly black with only a faint, slow purple wash now and then.
        comp:
          "shader_body {\n" +
          "ret = texture2D(sampler_main, uv).rgb;\n" +
          "float bg = 0.04 * (0.5 + 0.5 * sin(time * 0.10));\n" +
          "ret += vec3(bg, bg * 0.10, bg * 1.3);\n" +
          "}\n"
      }
    );
    preset.waves[0] = circleWave("q1", "q2");  // orbiting circle A
    preset.waves[1] = circleWave("q3", "q4");  // orbiting circle B
    return preset;
  })();

  // ── Alchemy Random ─────────────────────────────────────────────────────────
  // Contour-line kaleidoscope: each of 6 scenes draws crisp wavy CONTOUR LINES of
  // warped noise fields (filaments, wavy rings, lattice, web) with 4-fold mirror
  // symmetry, breathing zoom + slow rotation, swirling flow, and beads sliding
  // along paths. Scenes cycle and crossfade.
  P["Alchemy Random"] = build(
    {
      wave_a: 0, decay: 0.80, gammaadj: 1.2, zoom: 1.0, rot: 0.0,
      warp: 0.0, wrap: 0, darken_center: 0, echo_alpha: 0
    },
    {
      frame: function (t) { t.decay = 0.80; return t; },
      comp:
        "float hash21(vec2 p){ p = fract(p*vec2(127.1,311.7)); p += dot(p, p+34.5); return fract(p.x*p.y); }\n" +
        "float vnoise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);\n" +
        "  float a=hash21(i), b=hash21(i+vec2(1.0,0.0)), c=hash21(i+vec2(0.0,1.0)), e=hash21(i+vec2(1.0,1.0));\n" +
        "  return mix(mix(a,b,f.x), mix(c,e,f.x), f.y); }\n" +
        "float fbm(vec2 p){ float s=0.0, m=0.5; for(int i=0;i<4;i++){ s+=m*vnoise(p); p=p*2.0+1.3; m*=0.5; } return s; }\n" +
        "vec3 pal(float h){ return 0.5+0.5*cos(6.2832*(h+vec3(0.0,0.33,0.67))); }\n" +
        "float ctr(float v, float w){ return smoothstep(w, 0.0, abs(fract(v)-0.5)); }\n" +
        "vec3 ascene(float id, vec2 d, float r, float a, float tt, float bs){\n" +
        "  vec3 c = vec3(0.0);\n" +
        "  if (id < 0.5) {\n" +
        "    float rr = r + 0.08*sin(a*6.0 + tt) + 0.06*fbm(d*4.0+tt);\n" +
        "    c = pal(0.60)*ctr(rr*5.0 - tt, 0.09) + pal(0.80)*ctr(fbm(d*3.0+tt*0.3)*4.0, 0.07)*0.8;\n" +
        "  } else if (id < 1.5) {\n" +
        "    c = vec3(0.34,0.02,0.10);\n" +
        "    vec2 w = d + 0.18*vec2(fbm(d*3.0 + vec2(cos(tt),sin(tt))), fbm(d*3.0 - vec2(sin(tt),cos(tt))));\n" +
        "    c += vec3(1.0,0.3,0.8)*ctr(fbm(w*4.0)*6.0 + tt, 0.06);\n" +
        "    float bead = smoothstep(0.05,0.0, abs(fract(d.x*3.0 - d.y*2.0 - tt*0.6)-0.5)) * smoothstep(0.12,0.0, abs(d.y - d.x*0.5));\n" +
        "    c += vec3(0.3,0.95,1.0)*bead;\n" +
        "    c += vec3(1.0,0.7,0.4)*smoothstep(0.010,0.0, abs(d.x*0.8 - d.y))*0.8;\n" +
        "  } else if (id < 2.5) {\n" +
        "    float rr = r + 0.06*sin(a*8.0 - tt*1.5);\n" +
        "    c = vec3(0.20,0.04,0.12) + pal(0.33)*(ctr(rr*6.0 - tt, 0.07) + ctr(fbm(d*5.0+tt*0.4)*5.0,0.07)*0.7);\n" +
        "    float spoke = ctr(a*3.0/3.14159, 0.05);\n" +
        "    float bead = smoothstep(0.05,0.0, abs(r - fract(tt*0.5)*1.3)) * spoke;\n" +
        "    c += pal(0.45)*bead*1.2;\n" +
        "  } else if (id < 3.5) {\n" +
        "    c = pal(a/6.2832 + tt*0.1)*ctr((a*0.5 + r*3.0 - tt*0.4)*4.0, 0.08) + pal(0.5)*0.04;\n" +
        "  } else if (id < 4.5) {\n" +
        "    vec2 w = d*5.0 + 1.5*vec2(fbm(d*2.0+tt), fbm(d*2.0-tt));\n" +
        "    c = vec3(0.05,0.10,0.20) + pal(0.55 + tt*0.05)*(ctr(w.x,0.10)+ctr(w.y,0.10));\n" +
        "  } else {\n" +
        "    vec2 w = d + 0.25*vec2(fbm(d*2.0 + vec2(cos(tt*0.5),sin(tt*0.5))), fbm(d*2.0 + 5.0 - vec2(sin(tt*0.5),cos(tt*0.5))));\n" +
        "    c = vec3(0.13,0.03,0.10) + pal(0.05 + tt*0.03)*(ctr(fbm(w*3.5)*7.0,0.05) + ctr(fbm(w*7.0+2.0)*9.0,0.04)*0.6);\n" +
        "  }\n" +
        "  return c * (smoothstep(1.5, 0.15, r) + 0.12);\n" +
        "}\n" +
        "shader_body {\n" +
        "  vec2 d = uv - 0.5;\n" +
        "  d.x *= resolution.x / resolution.y;\n" +
        "  float breathe = 1.0 + 0.18*sin(time*0.7) - 0.12*bass;\n" +
        "  float rt = time*0.06;\n" +
        "  d = mat2(cos(rt), -sin(rt), sin(rt), cos(rt)) * d * breathe;\n" +
        "  vec2 dm = abs(d);\n" +
        "  float r = length(d) * 2.0;\n" +
        "  float a = atan(dm.y, dm.x);\n" +
        "  float SC = 8.0; float NUM = 6.0;\n" +
        "  float ph = time / SC;\n" +
        "  float cur = mod(floor(ph), NUM);\n" +
        "  float nxt = mod(cur + 1.0, NUM);\n" +
        "  float f = smoothstep(0.72, 1.0, fract(ph));\n" +
        "  vec3 col = mix(ascene(cur, dm, r, a, time, bass), ascene(nxt, dm, r, a, time, bass), f);\n" +
        "  col *= (1.0 + 0.5*bass);\n" +
        "  col += vec3(1.0,0.95,1.0) * exp(-r*r*45.0) * (0.15 + 0.4*bass);\n" +
        "  vec3 fb = texture2D(sampler_main, uv).rgb * 0.32;\n" +
        "  ret = max(col, fb);\n" +
        "}\n",
      warp:
        "shader_body {\n" +
        "  vec2 dd = uv - 0.5;\n" +
        "  float ang = 0.02 + 0.015*sin(time*0.3);\n" +
        "  float s = sin(ang), c = cos(ang);\n" +
        "  vec2 ruv = 0.5 + mat2(c, -s, s, c) * dd * 1.004;\n" +
        "  ret = texture2D(sampler_main, ruv).rgb;\n" +
        "  ret -= 0.004;\n" +
        "}\n"
    }
  );

  // ── Ambience Thingus ─────────────────────────────────────────────────────
  // Smooth yellow swirl on black: a smooth circular waveform churned by a warp
  // and long feedback into spiraling liquid light, tinted by the amber ramp.
  P["Ambience Thingus"] = build(
    {
      wave_mode: 0, wave_smoothing: 0.92, wave_scale: 0.6, additivewave: 1,
      wave_r: 1.0, wave_g: 0.85, wave_b: 0.3, wave_a: 0.6,
      decay: 0.96, gammaadj: 1.8,
      zoom: 1.01, rot: 0.06, warp: 0.18, warpscale: 1.4, warpanimspeed: 0.7,
      cx: 0.5, cy: 0.5, darken_center: 0, wrap: 1
    },
    {
      frame: function (t) {
        var bass = t.bass_att || t.bass || 1;
        var treb = t.treb || 1;
        t.rot = 0.04 + 0.05 * Math.sin(t.time * 0.3);
        t.zoom = 1.0 + 0.02 * Math.sin(t.time * 0.5) + 0.01 * bass;
        t.warp = 0.14 + 0.08 * treb;
        t.decay = 0.96;
        t.wave_g = 0.8 + 0.1 * bass;
        return t;
      },
      warp:
        "shader_body {\n" +
        "vec2 w = uv + 0.010 * vec2(sin(uv.y*8.0 + time*0.8), cos(uv.x*8.0 + time*0.6));\n" +
        "ret = texture2D(sampler_main, w).rgb;\n" +
        "ret -= 0.003;\n" +
        "}\n",
      comp:
        AMBER_RAMP +
        "shader_body {\n" +
        "vec3 src = texture2D(sampler_main, uv).rgb;\n" +
        "float v = dot(src, vec3(0.33)) * (1.0 + 0.4*bass);\n" +
        "v += 0.05 * sin(time*0.4);\n" +
        "ret = amber_ramp(v);\n" +
        "}\n"
    }
  );

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
          "vec3 pink = vec3(0.92, 0.24, 0.47);\n" +
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

  window.WMP_PRESETS = P;
})();
