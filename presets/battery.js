/* Battery family presets (23) for the WMP visualizer.
 * Plain <script> loaded AFTER presets/kit.js; registers into window.WMP_PRESETS.
 * Uses the shared kit globals (build, circleWave, ALC_PAL, alc* factories, ...).
 */
(function () {
  "use strict";
  var P = (window.WMP_PRESETS = window.WMP_PRESETS || {});

  // ── Battery relatively calm ────────────────────────────────────────────────
  // Soft milky teal swirl that drifts green<->blue; lazy rotation, gentle.
  P["Battery relatively calm"] = (function () {
    var preset = build(
      {
        wave_a: 0,
        wave_smoothing: 0.9,
        additivewave: 1,
        wave_scale: 0.7,
        decay: 0.96,
        gammaadj: 1.8,
        zoom: 0.999,
        rot: 0.012,
        warp: 0.02,
        cx: 0.5,
        cy: 0.5,
        darken_center: 0,
        wrap: 0,
      },
      {
        frame: function (t) {
          var bass = t.bass_att || t.bass || 1;
          t.q1 = 0.5;
          t.q2 = 0.5;
          t.q5 = 0.3 + 0.04 * bass;
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
          "}\n",
      }
    );
    preset.waves[0] = circleWave("q1", "q2");
    preset.waves[0].baseVals.smoothing = 0.9;
    preset.waves[0].baseVals.a = 0.8;
    preset.waves[0].baseVals.r = 0.35;
    preset.waves[0].baseVals.g = 0.7;
    preset.waves[0].baseVals.b = 0.6;
    return preset;
  })();

  // ── Battery strawberryaid ──────────────────────────────────────────────────
  // Pink/red radial starburst: two jagged rings spiking outward on the bass.
  P["Battery strawberryaid"] = (function () {
    var preset = build(
      {
        wave_a: 0,
        wave_smoothing: 0.1,
        additivewave: 1,
        wave_scale: 1.4,
        decay: 0.93,
        gammaadj: 2.0,
        zoom: 1.0,
        rot: 0.01,
        warp: 0.05,
        cx: 0.5,
        cy: 0.5,
        darken_center: 0,
        wrap: 0,
      },
      {
        frame: function (t) {
          var bass = t.bass_att || t.bass || 1;
          var treb = t.treb || 1;
          t.q1 = 0.5;
          t.q2 = 0.5;
          t.q3 = 0.5;
          t.q4 = 0.5;
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
          "}\n",
      }
    );
    preset.waves[0] = circleWave("q1", "q2");
    preset.waves[0].baseVals.smoothing = 0.05;
    preset.waves[0].baseVals.r = 0.95;
    preset.waves[0].baseVals.g = 0.25;
    preset.waves[0].baseVals.b = 0.45;
    preset.waves[1] = circleWave("q3", "q4");
    preset.waves[1].baseVals.smoothing = 0.05;
    preset.waves[1].baseVals.r = 0.95;
    preset.waves[1].baseVals.g = 0.35;
    preset.waves[1].baseVals.b = 0.55;
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
        wave_a: 0,
        wave_smoothing: 0.7,
        additivewave: 1,
        wave_scale: 0.9,
        decay: 0.97,
        gammaadj: 1.9,
        zoom: 0.985,
        rot: 0.05,
        warp: 0.12,
        warpscale: 1.5,
        cx: 0.5,
        cy: 0.5,
        darken_center: 1,
        wrap: 0,
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
          "}\n",
      }
    );
    preset.waves[0] = circleWave("q1", "q2");
    preset.waves[0].baseVals.smoothing = 0.6;
    preset.waves[0].baseVals.a = 0.4;
    preset.waves[0].baseVals.r = 0.7;
    preset.waves[0].baseVals.g = 0.7;
    preset.waves[0].baseVals.b = 0.7;
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
        wave_a: 0,
        decay: 0.9,
        gammaadj: 2.0,
        zoom: 1.0,
        warp: 0.02,
        darken_center: 0,
        wrap: 0,
        echo_alpha: 0,
      },
      {
        frame: function (t) {
          var bass = t.bass_att || t.bass || 1;
          t.q1 = 0.5;
          t.q2 = 0.5;
          t.q5 = 0.2 + 0.08 * bass;
          t.decay = 0.9;
          return t;
        },
        comp:
          "shader_body {\n" +
          "vec3 prev = texture2D(sampler_main, uv).rgb;\n" +
          "vec2 d = uv - vec2(0.5);\n" +
          "d.x *= resolution.x / resolution.y;\n" +
          "float r = length(d);\n" +
          "float prad = 0.26 + 0.07 * bass;\n" +
          "float core = exp(-r*r * 22.0) * (1.0 + 0.6*bass_att);\n" +
          "float rim = smoothstep(prad, prad*0.7, r) * smoothstep(prad*0.45, prad*0.75, r);\n" +
          "float shade = clamp(1.0 - r/prad, 0.0, 1.0);\n" +
          "shade = pow(shade, 1.5);\n" +
          "vec3 sphereCol = vec3(0.45, 0.78, 1.0);\n" +
          "vec3 orb = sphereCol * (shade*0.55 + rim*0.9) + vec3(0.85,0.95,1.0)*core;\n" +
          "ret = prev * 0.55 + orb;\n" +
          "}\n",
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
        wave_a: 0,
        decay: 0.93,
        gammaadj: 2.1,
        zoom: 1.07,
        warp: 0.03,
        darken_center: 0,
        wrap: 0,
        echo_alpha: 0,
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
          "}\n",
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
        wave_a: 0,
        decay: 0.96,
        gammaadj: 1.9,
        zoom: 1.005,
        warp: 0.05,
        warpscale: 0.8,
        darken_center: 0,
        wrap: 0,
        echo_alpha: 0,
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
          "float pang = atan(d.y, d.x);\n" +
          "float star = 0.5 + 0.5 * cos(pang * 5.0);\n" +
          "float reach = (0.18 + 0.05*bass) * (0.6 + 0.4*star);\n" +
          "float glow = exp(-r*r / (reach*reach + 0.002));\n" +
          "glow = pow(glow, 1.3);\n" +
          // WMP cottonstar cycles white <-> teal over time.
          "vec3 petal = mix(vec3(0.95,1.0,1.0), vec3(0.20,0.88,0.82), 0.5+0.5*sin(time*0.06));\n" +
          "ret = prev * 0.86 + petal * glow * (0.5 + 0.4*bass_att);\n" +
          "}\n",
      }
    );
    preset.waves[0] = circleWave("q1", "q2");
    preset.waves[0].baseVals.r = 0.7;
    preset.waves[0].baseVals.g = 1.0;
    preset.waves[0].baseVals.b = 0.95;
    preset.waves[0].baseVals.a = 0.7;
    preset.waves[0].baseVals.smoothing = 0.4; // keep the jagged song waveform visible
    return preset;
  })();

  // ── Battery dandelion ─────────────────────────────────────────────────────
  // A dandelion seed-head: 3 real-audio spokes (6 arms) slowly rotating, plus a
  // dotted real-audio seed-ring at the tips. White / pale-yellow on dark.
  P["Battery dandelion"] = (function () {
    var DAND = [1.0, 1.0, 1.0]; // white seeds; the comp owns the cycling hue
    var preset = build(
      {
        wave_a: 0,
        decay: 0.91,
        gammaadj: 2.0,
        zoom: 1.0,
        warp: 0.01,
        darken_center: 0,
        wrap: 0,
        echo_alpha: 0,
      },
      {
        frame: function (t) {
          var bass = t.bass_att || t.bass || 1;
          t.q1 = t.time * 0.25;
          t.q2 = 0.5;
          t.q3 = 0.5;
          t.q5 = 0.4 + 0.05 * bass;
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
          "}\n",
      }
    );
    // 3 spokes at 0/60/120 deg => a 6-armed seed-head, sharing rotation a.q1.
    var offsets = [0.0, Math.PI / 3, (2 * Math.PI) / 3];
    for (var i = 0; i < offsets.length; i++) {
      preset.waves[i] = spokeLine(0, 0.42, 0.05, DAND[0], DAND[1], DAND[2]);
      (function (off, idx) {
        preset.waves[idx].point_eqs = function (a) {
          var th = (a.q1 || 0.0) + off;
          var ct = Math.cos(th),
            st = Math.sin(th);
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
        wave_a: 0,
        decay: 0.95,
        gammaadj: 1.9,
        zoom: 0.97,
        warp: 0.0,
        darken_center: 1,
        wrap: 0,
        echo_alpha: 0,
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
          "}\n",
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
      { wave_a: 0, decay: 0.9, gammaadj: 2.1, zoom: 1.0, warp: 0.02, wrap: 0, darken_center: 1 },
      {
        frame: function (t) {
          var tr = t.treb || 1,
            ba = t.bass_att || 1;
          t.q1 = t.time * 0.25;
          t.q2 = 0.5;
          t.q3 = 0.5;
          t.q10 = 0.45 + 0.55 * Math.min(tr, 2.0);
          t.warp = 0.02 + 0.05 * (tr - 1);
          t.decay = 0.9;
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
          "ret += vec3(0.06, 0.30, 0.12) * glow * (0.6 + 0.5*treb);\n" + // green electric glow
          "}\n",
      }
    );
    var bolts = 4;
    for (var i = 0; i < bolts; i++) {
      (function (idx) {
        var off = (Math.PI / bolts) * idx;
        var wl = waveLine();
        wl.baseVals.smoothing = 0.02;
        wl.baseVals.r = 0.55;
        wl.baseVals.g = 1.0;
        wl.baseVals.b = 0.6;
        wl.baseVals.a = 0.85;
        wl.baseVals.additive = 1;
        wl.baseVals.usedots = 0;
        wl.point_eqs = function (a) {
          var ang = (a.q1 || 0) + off;
          var s = a.sample - 0.5;
          var disp = ((a.value1 || 0.5) - 0.5) * 1.2;
          var c = Math.cos(ang),
            sn = Math.sin(ang);
          a.x = 0.5 + s * c - disp * sn;
          a.y = 0.5 + s * sn + disp * c;
          var fl = a.q10 || 0.6;
          a.r = 0.55 * fl;
          a.g = 1.0 * fl;
          a.b = 0.6 * fl;
          a.a = 0.85 * fl;
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
          "}\n",
      }
    );
    preset.waves[0] = circleWave("q1", "q2");
    preset.waves[0].baseVals.r = 1.0;
    preset.waves[0].baseVals.g = 0.55;
    preset.waves[0].baseVals.b = 0.1;
    preset.waves[0].baseVals.a = 0.9;
    preset.waves[0].baseVals.additive = 1;
    preset.waves[0].baseVals.smoothing = 0.5;
    preset.waves[0].point_eqs = function (a) {
      var cx = a.q1 || 0.5,
        cy = a.q2 || 0.5;
      var ang = a.sample * 6.2831853 + (a.q3 || 0);
      var rad = (a.q5 || 0.18) + 0.1 * ((a.value1 || 0.5) - 0.5);
      a.x = cx + rad * Math.cos(ang);
      a.y = cy + rad * Math.sin(ang);
      var heat = 0.7 + 0.3 * (a.value1 || 0.5);
      a.r = 1.0 * heat;
      a.g = 0.55 * heat;
      a.b = 0.1 * heat;
      a.a = 0.9;
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
          var m = t.mid || 1,
            ba = t.bass_att || 1;
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
          "}\n",
      }
    );
    preset.waves[0] = circleWave("q1", "q2");
    preset.waves[0].baseVals.r = 0.35;
    preset.waves[0].baseVals.g = 1.0;
    preset.waves[0].baseVals.b = 0.7;
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
          var ba = t.bass_att || 1,
            m = t.mid || 1;
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
          "}\n",
      }
    );
    preset.waves[0] = circleWave("q1", "q2");
    preset.waves[0].baseVals.r = 0.85;
    preset.waves[0].baseVals.g = 0.1;
    preset.waves[0].baseVals.b = 0.22;
    preset.waves[0].baseVals.a = 0.75;
    preset.waves[0].baseVals.additive = 1;
    preset.waves[0].baseVals.smoothing = 0.4; // let the song waveform shape the petal tips
    preset.waves[0].point_eqs = function (a) {
      var cx = a.q1 || 0.5,
        cy = a.q2 || 0.5;
      var ang = a.sample * 6.2831853 + (a.q3 || 0);
      var petal = 0.06 * Math.abs(Math.sin(ang * 3.0));
      var rad = (a.q5 || 0.16) + petal + 0.12 * ((a.value1 || 0.5) - 0.5);
      a.x = cx + rad * Math.cos(ang);
      a.y = cy + rad * Math.sin(ang);
      a.r = 0.85;
      a.g = 0.1;
      a.b = 0.22;
      a.a = 0.75;
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
          "}\n",
      }
    );
    var beams = 6;
    for (var i = 0; i < beams; i++) {
      (function (idx) {
        var off = ((2 * Math.PI) / beams) * idx;
        var sp = spokeLine(0, 0.48, 0.06, 1.0, 0.92, 0.6);
        sp.baseVals.smoothing = 0.4;
        sp.baseVals.additive = 1;
        sp.baseVals.usedots = 0;
        sp.point_eqs = function (a) {
          var ang = (a.q1 || 0) + off;
          var s = (a.sample - 0.5) * 2.0;
          var disp = ((a.value1 || 0.5) - 0.5) * 0.5;
          var c = Math.cos(ang),
            sn = Math.sin(ang);
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
          t.q1 = 0.5;
          t.q2 = 0.5;
          t.q5 = 0.08 + 0.3 * bass;
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
          "}\n",
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
      {
        wave_a: 0,
        decay: 0.94,
        gammaadj: 1.9,
        zoom: 1.0,
        warp: 0.03,
        rot: 0.01,
        darken_center: 0,
        wrap: 0,
      },
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
          "float pang = atan(d.y, d.x);\n" +
          "pang = abs(mod(pang, seg) - seg*0.5);\n" +
          "float prad = length(d);\n" +
          "vec2 m = prad * vec2(cos(pang), sin(pang)) + 0.5;\n" +
          "vec3 c = texture2D(sampler_main, m).rgb;\n" +
          "float lum = dot(c, vec3(0.33));\n" +
          // WMP kaleidovision is GREEN-dominant with faint spectral speckle, not full rainbow.
          "vec3 speck = pal(time*0.05 + prad*1.5);\n" +
          "vec3 col = mix(vec3(0.30,1.0,0.40), speck, 0.22);\n" +
          "ret = col * lum * 1.7;\n" +
          "ret += vec3(0.30,1.0,0.40) * exp(-prad*prad*9.0) * (0.10 + 0.35*bass);\n" +
          "}\n",
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
          t.q1 = 0.5;
          t.q2 = 0.5;
          t.q5 = 0.07 + 0.04 * treb;
          t.q6 = 0.18 + 0.4 * bass;
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
          "float pang = atan(d.y, d.x);\n" +
          "float lum = dot(c, vec3(0.33));\n" +
          // WMP chemicalnova is a full-spectrum psychedelic burst — hue sweeps by angle+radius.
          "vec3 tint = pal(pang/6.2832 + r*0.6 - time*0.12);\n" +
          "ret = tint * lum * 1.9;\n" +
          "ret += vec3(1.0) * exp(-r*r*22.0) * (0.3 + 1.2*bass);\n" +
          "}\n",
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
          t.q1 = 0.5;
          t.q2 = 0.5;
          t.q5 = 0.1 + 0.05 * bass;
          t.q6 = 0.2 + 0.05 * mid;
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
          "}\n",
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
      var rad = ((a.q5 || 0.1) + (a.q7 || 0.05) * a.value1) * petal;
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
      var rad = ((a.q6 || 0.2) + (a.q7 || 0.05) * a.value1) * petal;
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
      {
        wave_a: 0,
        decay: 0.95,
        gammaadj: 1.9,
        zoom: 1.005,
        warp: 0.06,
        rot: 0.005,
        darken_center: 0,
        wrap: 1,
      },
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
          "}\n",
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
        wave_a: 0,
        decay: 0.95,
        gammaadj: 1.9,
        zoom: 1.0,
        warp: 0.05,
        rot: 0,
        dy: -0.012,
        cx: 0.5,
        cy: 0.5,
        darken_center: 1,
        wrap: 0,
        wave_smoothing: 0.6,
        additivewave: 1,
      },
      {
        frame: function (t) {
          var b = t.bass_att || 1,
            tr = t.treb || 1;
          t.q1 = 0.5;
          t.q2 = 0.5;
          t.q5 = 0.1 + 0.07 * b;
          t.zoom = 1.006 + 0.004 * b;
          t.dy = -0.01 - 0.006 * tr;
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
          "}\n",
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
        wave_a: 0,
        decay: 0.965,
        gammaadj: 2.0,
        zoom: 1.0,
        warp: 0.18,
        rot: 0.01,
        cx: 0.5,
        cy: 0.5,
        darken_center: 0,
        wrap: 1,
        wave_smoothing: 0.7,
        additivewave: 1,
      },
      {
        frame: function (t) {
          var b = t.bass_att || 1,
            m = t.mid || 1;
          t.q1 = 0.5;
          t.q2 = 0.5;
          t.q5 = 0.12 + 0.06 * b;
          t.warp = 0.16 + 0.1 * m;
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
          "}\n",
      }
    );
    preset.waves[0] = circleWave("q1", "q2");
    preset.waves[0].baseVals.r = 0.45;
    preset.waves[0].baseVals.g = 0.72;
    preset.waves[0].baseVals.b = 0.78;
    preset.waves[0].baseVals.a = 0.7;
    preset.waves[0].baseVals.smoothing = 0.4; // keep the stirring waveform legible
    return preset;
  })();

  // ── Battery spider's last moment ────────────────────────────────────────────
  // A spider web: 3 real-audio radial spokes (6 spans) + 1 real-audio concentric
  // thread ring; thin pale-silver lines on near-black, faintly trembling. Eerie.
  P["Battery spider's last moment"] = (function () {
    var preset = build(
      {
        wave_a: 0,
        decay: 0.88,
        gammaadj: 2.1,
        zoom: 1.0,
        warp: 0.0,
        rot: 0,
        cx: 0.5,
        cy: 0.5,
        darken_center: 1,
        wrap: 0,
        additivewave: 1,
      },
      {
        frame: function (t) {
          var b = t.bass_att || 1,
            tr = t.treb_att || 1;
          t.q1 = t.time * 0.05 + 0.01 * Math.sin(t.time * 7.0) * tr;
          t.q2 = 0.5;
          t.q3 = 0.5;
          t.q5 = 0.1 + 0.04 * b;
          t.decay = 0.88;
          return t;
        },
        comp:
          "shader_body {\n" +
          "vec3 c = texture2D(sampler_main, uv).rgb;\n" +
          "ret = c * vec3(0.45,1.0,0.55);\n" + // WMP spider web threads glow green
          "float bg = 0.015;\n" +
          "ret += vec3(bg*0.4, bg*1.2, bg*0.5);\n" +
          "}\n",
      }
    );
    var offs = [0.0, 1.047, 2.094];
    for (var i = 0; i < offs.length; i++) {
      preset.waves[i] = spokeLine(0, 0.55, 0.04, 0.55, 1.0, 0.6);
      (function (off, idx) {
        preset.waves[idx].point_eqs = function (a) {
          var th = (a.q1 || 0) + off;
          var s = a.sample * 2.0 - 1.0;
          var ct = Math.cos(th),
            st = Math.sin(th);
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
  // GREYSCALE swirling smoke WHIRLPOOL around a dark central eye (NOT a globe — the
  // reference is a satellite-storm of monochrome smoke bands, sat ~7). A bright jagged
  // real-audio ring is the source the vortex smears into spiraling smoke; the dark eye
  // comes from darken_center. Engine via alcSmokeVortex + treble speckle + heavy vignette.
  P["Battery the world"] = (function () {
    var sv = alcSmokeVortex({
      eyeX: 0.52,
      eyeY: 0.49,
      swirl: 0.075,
      pull: 0.991, // inward pull -> spiraling whirlpool
      floor: "vec3(0.05,0.05,0.055)",
      tint: "vec3(0.96,0.97,0.99)", // neutral grey wisps (bright body, sat ~0)
      vignette: 0.6,
      speckle: 0.1,
      cloud: 1.0, // dense satellite-storm cloud
      eye: 0.15, // dark central eye
      toneK: 0.55, // brighter mid-grey (target YAVG ~120)
    });
    var preset = build(
      {
        wave_a: 0,
        decay: 0.96,
        gammaadj: 1.9,
        zoom: 1.0,
        warp: 0.0,
        rot: 0,
        cx: 0.52,
        cy: 0.49,
        darken_center: 1, // the dark eye
        wrap: 1,
        additivewave: 1,
      },
      {
        frame: function (t) {
          var b = t.bass_att || t.bass || 1;
          t.q2 = 0.52;
          t.q3 = 0.49; // source ring / eye center
          t.q5 = 0.16 + 0.05 * (b - 1); // ring pulses with bass
          t.decay = 0.96;
          return t;
        },
        warp: sv.warp,
        comp: sv.comp,
      }
    );
    // bright jagged real-audio ring — the source the vortex smears into smoke bands.
    preset.waves[0] = circleWave("q2", "q3");
    preset.waves[0].baseVals.r = 0.85;
    preset.waves[0].baseVals.g = 0.86;
    preset.waves[0].baseVals.b = 0.9;
    preset.waves[0].baseVals.a = 0.5;
    preset.waves[0].baseVals.additive = 1;
    preset.waves[0].baseVals.smoothing = 0.04; // jagged waveform
    return preset;
  })();

  // ── Battery back to the groove ──────────────────────────────────────────────
  // Retro oscilloscope groove: a real-audio horizontal scope line (waveLine, q1=0)
  // on a scrolling grid with slow hue drift and scanlines. Funky and rhythmic.
  P["Battery back to the groove"] = (function () {
    var preset = build(
      {
        wave_a: 0,
        decay: 0.93,
        gammaadj: 2.0,
        zoom: 1.0,
        warp: 0.0,
        rot: 0,
        cx: 0.5,
        cy: 0.5,
        darken_center: 0,
        wrap: 0,
        additivewave: 1,
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
          "}\n",
      }
    );
    preset.waves[0] = waveLine();
    preset.waves[0].baseVals.a = 0.9;
    preset.waves[0].baseVals.smoothing = 0.02;
    return preset;
  })();
})();
