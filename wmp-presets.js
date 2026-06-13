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

  window.WMP_PRESETS = P;
})();
