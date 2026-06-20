/* Alchemy family presets — standalone single-motif scenes (Orbiters/Kaleidoscope/Anemone Pulsar/Vortex).
 * Plain <script> loaded AFTER presets/kit.js; registers into window.WMP_PRESETS.
 * Uses the shared kit globals (build, circleWave, ALC_PAL, alc* factories, ...).
 * (Split out of the former monolithic presets/alchemy.js — see CLAUDE.md.)
 */
(function () {
  "use strict";
  var P = (window.WMP_PRESETS = window.WMP_PRESETS || {});

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
    var huePhase = 0,
      lastT = 0; // energy-coupled hue accumulator (closure state)

    var preset = build(
      {
        wave_a: 0, // primary waveform off; the custom waves draw everything
        decay: 0.92, // short, CRISP trail (dotted orb beads), not a smear
        gammaadj: 1.3,
        zoom: 0.995, // slight INWARD drift keeps trails compact (1.0 made them sprawl)
        rot: 0.0,
        warp: 0.0, // no sinusoidal warp -> lines stay clean/sharp
        wrap: 0, // clamp (no edge-wrap border artifact)
        darken_center: 0.06, // keep the busy center from over-blooming
        echo_alpha: 0,
      },
      {
        frame: function (t) {
          var bass = t.bass_att || t.bass || 1;
          var mid = t.mid_att || t.mid || 1;
          var treb = t.treb_att || t.treb || 1;
          var tm = t.time;

          // energy-coupled hue drift: faster when the music is loud, slow when calm
          var dt = Math.min(0.1, Math.max(0, tm - lastT));
          lastT = tm;
          var energy = (bass + mid + treb) / 3;
          huePhase = (huePhase + dt * (0.02 + 0.06 * energy)) % 1;

          // two orbs on opposing elliptical orbits (180 deg apart) -> the single
          // tether between them reads as ONE clean lightning line through center.
          var th = tm * 0.42;
          t.q1 = 0.5 + 0.27 * Math.cos(th); // orb A center
          t.q2 = 0.5 + 0.2 * Math.sin(th * 1.06);
          t.q3 = 0.5 + 0.27 * Math.cos(th + Math.PI); // orb B center (opposite)
          t.q4 = 0.5 + 0.2 * Math.sin(th * 1.06 + Math.PI);

          t.q5 = 0.018 + 0.012 * bass; // orb core radius (SMALL)
          t.q6 = t.q5 * 2.1 + 0.006; // Saturn-ring radius (just outside core)
          t.q7 = 0.012 + 0.045 * treb; // lightning displacement (SMALL + fast)
          t.q8 = huePhase; // (reserved) shared hue phase

          t.q9 = 0.085 + 0.05 * bass; // central flower base radius
          t.q10 = 0.05 + 0.06 * mid; // flower waveform amplitude
          t.q11 = (huePhase + 0.45) % 1; // flower hue (offset from orbs)
          t.q12 = energy; // loudness -> bg breathe / brightness
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
          NOISE_GLSL +
          ALC_FLUID_GLSL +
          "shader_body {\n" +
          "vec2 d = uv - 0.5; d.x *= resolution.x / resolution.y;\n" +
          "float vig = 1.0 - smoothstep(0.22, 0.95, length(d));\n" +
          "vec3 bg = alcFluid(uv * 2.0, time, bass, vec3(0.012,0.045,0.055), vec3(0.06,0.035,0.11), vec3(0.09,0.15,0.15)) * vig;\n" + // dark-teal / dusty-purple / teal-grey
          "vec3 sharp = texture2D(sampler_main, uv).rgb;\n" + // geometry + recede trails
          "vec3 glow = (texture2D(sampler_blur1, uv).rgb + texture2D(sampler_blur2, uv).rgb) * 0.5;\n" +
          "vec3 outc = bg + sharp + glow * 0.30;\n" +
          "ret = outc / (outc + vec3(0.85));\n" + // Reinhard: glow, never white-out
          "}\n",
      }
    );

    // central FLOWER = the live audio waveform as a radial scope (the U3 fix). Each
    // of the 512 samples is a spoke whose radius = base + amp*value1 -> jagged petals.
    function waveFlower() {
      return {
        baseVals: Object.assign({}, WAVE_BASE, {
          enabled: 1,
          samples: 512,
          additive: 1,
          usedots: 0,
          scaling: 1,
          smoothing: 0.06,
          a: 0.8,
          thick: 0,
        }),
        init_eqs: passthrough,
        frame_eqs: passthrough,
        point_eqs: function (a) {
          var ang = a.sample * 6.2832;
          var rad = (a.q9 || 0.1) + (a.q10 || 0.05) * (a.value1 || 0);
          if (rad < 0.02) rad = 0.02;
          a.x = 0.5 + rad * Math.cos(ang);
          a.y = 0.5 + rad * Math.sin(ang);
          var h = a.q11 || 0; // dusty (desaturated) hue
          var rr = 0.5 + 0.5 * Math.cos(6.2832 * h);
          var gg = 0.5 + 0.5 * Math.cos(6.2832 * (h + 0.33));
          var bb = 0.5 + 0.5 * Math.cos(6.2832 * (h + 0.67));
          var l = (rr + gg + bb) / 3,
            s = 0.62;
          a.r = (rr * s + l * (1 - s)) * 0.85;
          a.g = (gg * s + l * (1 - s)) * 0.85;
          a.b = (bb * s + l * (1 - s)) * 0.85;
          return a;
        },
      };
    }

    // SINGLE lightning tether A->B (the U4 fix): one thin line, small fast perpendicular
    // displacement from the live waveform -> a crisp lightning filament, not a fuzzy band.
    function tether() {
      return {
        baseVals: Object.assign({}, WAVE_BASE, {
          enabled: 1,
          samples: 512,
          additive: 1,
          usedots: 0,
          scaling: 1,
          smoothing: 0.03,
          a: 0.9,
          thick: 0,
          r: 0.62,
          g: 0.85,
          b: 1.0,
        }),
        init_eqs: passthrough,
        frame_eqs: passthrough,
        point_eqs: function (a) {
          var ax = a.q1 !== undefined ? a.q1 : 0.4,
            ay = a.q2 !== undefined ? a.q2 : 0.5;
          var bx = a.q3 !== undefined ? a.q3 : 0.6,
            by = a.q4 !== undefined ? a.q4 : 0.5;
          var dx = bx - ax,
            dy = by - ay;
          var len = Math.sqrt(dx * dx + dy * dy) || 1;
          var nx = -dy / len,
            ny = dx / len; // unit perpendicular
          var s = a.sample; // 0..1 from A to B
          var disp = (a.value1 || 0) * (a.q7 || 0.03);
          a.x = ax + s * dx + nx * disp;
          a.y = ay + s * dy + ny * disp;
          a.r = 0.65;
          a.g = 0.85;
          a.b = 1.0; // electric blue-white lightning
          return a;
        },
      };
    }

    // SMALL orb core: a tiny bright smooth ring that reads as a glowing node under bloom.
    function orbCore(qx, qy) {
      return {
        baseVals: Object.assign({}, WAVE_BASE, {
          enabled: 1,
          samples: 80,
          additive: 1,
          usedots: 0,
          scaling: 1,
          smoothing: 0.9,
          a: 0.95,
          thick: 1,
          r: 1.0,
          g: 0.72,
          b: 0.34,
        }),
        init_eqs: passthrough,
        frame_eqs: passthrough,
        point_eqs: function (a) {
          var r = a.q5 || 0.02;
          var ang = a.sample * 6.2832;
          a.x = (a[qx] || 0.5) + r * Math.cos(ang);
          a.y = (a[qy] || 0.5) + r * Math.sin(ang);
          a.r = 1.0;
          a.g = 0.72;
          a.b = 0.34;
          return a;
        },
      };
    }

    // thin near-white "Saturn" ring around each orb (the orb:line ratio detail).
    function orbRing(qx, qy) {
      return {
        baseVals: Object.assign({}, WAVE_BASE, {
          enabled: 1,
          samples: 96,
          additive: 1,
          usedots: 0,
          scaling: 1,
          smoothing: 0.9,
          a: 0.5,
          thick: 0,
          r: 0.85,
          g: 0.92,
          b: 1.0,
        }),
        init_eqs: passthrough,
        frame_eqs: passthrough,
        point_eqs: function (a) {
          var r = a.q6 || 0.05;
          var ang = a.sample * 6.2832;
          a.x = (a[qx] || 0.5) + r * Math.cos(ang);
          a.y = (a[qy] || 0.5) + r * Math.sin(ang);
          a.r = 0.85;
          a.g = 0.92;
          a.b = 1.0;
          return a;
        },
      };
    }

    preset.waves[0] = waveFlower(); // central live-waveform flower (back)
    preset.waves[1] = tether(); // single lightning line A<->B
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
    var huePhase = 0,
      lastT = 0;
    var preset = build(
      {
        wave_a: 0,
        decay: 0.95,
        gammaadj: 1.3,
        zoom: 1.0,
        rot: 0.012,
        warp: 0.0,
        wrap: 0,
        darken_center: 0.04,
        echo_alpha: 0,
      },
      {
        frame: function (t) {
          var bass = t.bass_att || t.bass || 1;
          var mid = t.mid_att || t.mid || 1;
          var treb = t.treb_att || t.treb || 1;
          var tm = t.time;
          var dt = Math.min(0.1, Math.max(0, tm - lastT));
          lastT = tm;
          huePhase = (huePhase + dt * (0.04 + 0.1 * ((bass + mid + treb) / 3))) % 1;
          t.zoom = 1.0 + 0.05 * bass; // bass "surge" -> tunnel pushes inward
          t.rot = 0.012 + 0.02 * treb; // slow rotation; treb spins it faster
          t.q9 = 0.1 + 0.05 * bass; // burst base radius
          t.q10 = 0.1 + 0.1 * mid; // burst waveform amplitude (dramatic)
          t.q11 = huePhase; // burst hue
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
          "float pr = length(d);\n" + // NOT 'rad' (reserved/predeclared)
          "float pa = atan(d.y, d.x);\n" + // NOT 'ang' (reserved/predeclared)
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
          "ret = outc / (outc + vec3(0.7));\n" + // Reinhard (slightly hotter -> vivid)
          "}\n",
      }
    );

    // central live-waveform BURST (radial scope); the comp mirrors it into the kaleidoscope.
    function burst(useSecond) {
      return {
        baseVals: Object.assign({}, WAVE_BASE, {
          enabled: 1,
          samples: 512,
          additive: 1,
          usedots: 0,
          scaling: 1,
          smoothing: 0.05,
          a: 0.85,
          thick: 0,
        }),
        init_eqs: passthrough,
        frame_eqs: passthrough,
        point_eqs: function (a) {
          var ang = a.sample * 6.2832;
          var samp = useSecond ? (a.value2 !== undefined ? a.value2 : a.value1) : a.value1;
          var rad = (a.q9 || 0.1) + (a.q10 || 0.1) * (samp || 0);
          if (rad < 0.02) rad = 0.02;
          a.x = 0.5 + rad * Math.cos(ang);
          a.y = 0.5 + rad * Math.sin(ang);
          var h = (a.q11 || 0) + a.sample * 0.15; // hue varies slightly around the ring
          a.r = 0.5 + 0.5 * Math.cos(6.2832 * h);
          a.g = 0.5 + 0.5 * Math.cos(6.2832 * (h + 0.33));
          a.b = 0.5 + 0.5 * Math.cos(6.2832 * (h + 0.67));
          return a;
        },
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
    var huePhase = 0,
      lastT = 0;
    var preset = build(
      {
        wave_a: 0,
        decay: 0.9,
        gammaadj: 1.3,
        zoom: 0.997, // shorter decay -> compact orb beads, less coil
        rot: 0.0,
        warp: 0.0,
        wrap: 0,
        darken_center: 0.05,
        echo_alpha: 0,
      },
      {
        frame: function (t) {
          var bass = t.bass_att || t.bass || 1;
          var mid = t.mid_att || t.mid || 1;
          var treb = t.treb_att || t.treb || 1;
          var tm = t.time;
          var dt = Math.min(0.1, Math.max(0, tm - lastT));
          lastT = tm;
          huePhase = (huePhase + dt * (0.015 + 0.05 * ((bass + mid + treb) / 3))) % 1;
          var th = tm * 0.33; // slow flanking orbit
          t.q1 = 0.5 + 0.34 * Math.cos(th); // orb A — CIRCULAR orbit, radius 0.34 so both
          t.q2 = 0.5 + 0.34 * Math.sin(th); //   orbs sit clearly OUTSIDE the anemone fur
          t.q3 = 0.5 + 0.34 * Math.cos(th + Math.PI); // orb B (opposite) — not masked, not in a corner
          t.q4 = 0.5 + 0.34 * Math.sin(th + Math.PI);
          t.q5 = 0.016 + 0.012 * bass; // orb core radius
          t.q6 = t.q5 * 2.1 + 0.006; // Saturn ring
          t.q7 = 0.01 + 0.035 * treb; // tether lightning amplitude (small)
          t.q9 = 0.07 + 0.06 * bass; // anemone base radius — smaller so the
          t.q10 = 0.04 + 0.05 * mid; //   flanking orbs sit OUTSIDE the fur (PULSAR pulse)
          t.q11 = huePhase; // hue drift (kept in the rose/magenta band below)
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
          "float idx = mod(floor(time / 6.0), 3.0);\n" + // snap every 6s
          "vec3 c0 = vec3(0.09, 0.14, 0.30);\n" + // dusty cobalt
          "vec3 c1 = vec3(0.10, 0.17, 0.12);\n" + // dusty sage
          "vec3 c2 = vec3(0.16, 0.07, 0.18);\n" + // dusty plum
          "vec3 solid = idx < 0.5 ? c0 : (idx < 1.5 ? c1 : c2);\n" +
          "float wash = 0.85 + 0.30 * fbm(uv * 2.2 + vec2(time * 0.03, -time * 0.02));\n" +
          "float vig = 1.0 - 0.45 * smoothstep(0.25, 1.1, pr);\n" +
          "float pupil = smoothstep(0.0, 0.16, pr);\n" + // dark center -> the anemone's eye
          "vec3 bg = solid * wash * vig * pupil * (0.9 + 0.15 * bass);\n" +
          "vec3 g = texture2D(sampler_main, uv).rgb;\n" +
          "vec3 glow = (texture2D(sampler_blur1, uv).rgb + texture2D(sampler_blur2, uv).rgb) * 0.5;\n" +
          "vec3 outc = bg + g + glow * 0.30;\n" +
          "ret = outc / (outc + vec3(0.9));\n" + // Reinhard, muted (k=0.9)
          "}\n",
      }
    );

    // the ANEMONE: a radial live-waveform scope, dusty rose/magenta, dark pupil.
    function anemone(useSecond) {
      return {
        baseVals: Object.assign({}, WAVE_BASE, {
          enabled: 1,
          samples: 512,
          additive: 1,
          usedots: 0,
          scaling: 1,
          smoothing: 0.04,
          a: 0.7,
          thick: 0,
        }),
        init_eqs: passthrough,
        frame_eqs: passthrough,
        point_eqs: function (a) {
          var ang = a.sample * 6.2832;
          var samp = useSecond ? (a.value2 !== undefined ? a.value2 : a.value1) : a.value1;
          var rad = (a.q9 || 0.12) + (a.q10 || 0.06) * (samp || 0);
          if (rad < 0.03) rad = 0.03;
          a.x = 0.5 + rad * Math.cos(ang);
          a.y = 0.5 + rad * Math.sin(ang);
          var h = 0.9 + 0.1 * Math.sin(6.2832 * (a.q11 || 0)); // dusty rose <-> magenta band
          var rr = 0.5 + 0.5 * Math.cos(6.2832 * h);
          var gg = 0.5 + 0.5 * Math.cos(6.2832 * (h + 0.33));
          var bb = 0.5 + 0.5 * Math.cos(6.2832 * (h + 0.67));
          var l = (rr + gg + bb) / 3,
            s = 0.55;
          a.r = (rr * s + l * (1 - s)) * 0.8;
          a.g = (gg * s + l * (1 - s)) * 0.8;
          a.b = (bb * s + l * (1 - s)) * 0.8;
          return a;
        },
      };
    }
    // single thin lightning tether between the flanking orbs (fainter here so it doesn't
    // overpower the anemone).
    function tether() {
      return {
        baseVals: Object.assign({}, WAVE_BASE, {
          enabled: 1,
          samples: 512,
          additive: 1,
          usedots: 0,
          scaling: 1,
          smoothing: 0.03,
          a: 0.55,
          thick: 0,
          r: 0.62,
          g: 0.85,
          b: 1.0,
        }),
        init_eqs: passthrough,
        frame_eqs: passthrough,
        point_eqs: function (a) {
          var ax = a.q1 !== undefined ? a.q1 : 0.4,
            ay = a.q2 !== undefined ? a.q2 : 0.5;
          var bx = a.q3 !== undefined ? a.q3 : 0.6,
            by = a.q4 !== undefined ? a.q4 : 0.5;
          var dx = bx - ax,
            dy = by - ay;
          var len = Math.sqrt(dx * dx + dy * dy) || 1;
          var nx = -dy / len,
            ny = dx / len;
          var s = a.sample;
          var disp = (a.value1 || 0) * (a.q7 || 0.03);
          a.x = ax + s * dx + nx * disp;
          a.y = ay + s * dy + ny * disp;
          a.r = 0.6;
          a.g = 0.8;
          a.b = 1.0;
          return a;
        },
      };
    }
    // cr/cg/cb let each orb be tinted (orb B is tinted distinctly as a diagnostic to
    // confirm it renders; if both show, we'll decide same-color vs distinct).
    function orbCore(qx, qy, cr, cg, cb) {
      return {
        baseVals: Object.assign({}, WAVE_BASE, {
          enabled: 1,
          samples: 80,
          additive: 1,
          usedots: 0,
          scaling: 1,
          smoothing: 0.9,
          a: 0.95,
          thick: 1,
          r: cr,
          g: cg,
          b: cb,
        }),
        init_eqs: passthrough,
        frame_eqs: passthrough,
        point_eqs: function (a) {
          var r = a.q5 || 0.02;
          var ang = a.sample * 6.2832;
          a.x = (a[qx] || 0.5) + r * Math.cos(ang);
          a.y = (a[qy] || 0.5) + r * Math.sin(ang);
          a.r = cr;
          a.g = cg;
          a.b = cb;
          return a;
        },
      };
    }
    function orbRing(qx, qy, cr, cg, cb) {
      return {
        baseVals: Object.assign({}, WAVE_BASE, {
          enabled: 1,
          samples: 96,
          additive: 1,
          usedots: 0,
          scaling: 1,
          smoothing: 0.9,
          a: 0.25,
          thick: 0,
          r: cr,
          g: cg,
          b: cb,
        }),
        init_eqs: passthrough,
        frame_eqs: passthrough,
        point_eqs: function (a) {
          var r = a.q6 || 0.05;
          var ang = a.sample * 6.2832;
          a.x = (a[qx] || 0.5) + r * Math.cos(ang);
          a.y = (a[qy] || 0.5) + r * Math.sin(ang);
          a.r = cr;
          a.g = cg;
          a.b = cb;
          return a;
        },
      };
    }
    // 6-wave layout, identical to the known-good Orbiters preset. NOTE: a 7-wave version
    // (two anemone channels) made the 7th wave (orb B's ring) fail to render — this build
    // only reliably draws ~6 enabled custom waves. Keep orb waves at low indices.
    preset.waves[0] = anemone(false); // anemone fur
    preset.waves[1] = tether(); // thin lightning between the orbs
    preset.waves[2] = orbCore("q1", "q2", 1.0, 0.72, 0.34); // orb A core (gold)
    preset.waves[3] = orbCore("q3", "q4", 1.0, 0.72, 0.34); // orb B core (gold — matches A)
    preset.waves[4] = orbRing("q1", "q2", 0.85, 0.92, 1.0); // orb A ring (white)
    preset.waves[5] = orbRing("q3", "q4", 0.85, 0.92, 1.0); // orb B ring (white)
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
    var huePhase = 0,
      lastT = 0;
    var preset = build(
      {
        wave_a: 0,
        decay: 0.95,
        gammaadj: 1.3,
        zoom: 1.0, // inward pull + twist done in warp
        rot: 0.0,
        warp: 0.0,
        wrap: 0,
        darken_center: 0.1,
        echo_alpha: 0,
      },
      {
        frame: function (t) {
          var bass = t.bass_att || t.bass || 1;
          var mid = t.mid_att || t.mid || 1;
          var treb = t.treb_att || t.treb || 1;
          var tm = t.time;
          var dt = Math.min(0.1, Math.max(0, tm - lastT));
          lastT = tm;
          huePhase = (huePhase + dt * (0.02 + 0.05 * ((bass + mid + treb) / 3))) % 1;
          var th = tm * 0.3; // orbs being pulled around the vortex (slower)
          t.q1 = 0.5 + 0.3 * Math.cos(th);
          t.q2 = 0.5 + 0.3 * Math.sin(th);
          t.q3 = 0.5 + 0.3 * Math.cos(th + Math.PI);
          t.q4 = 0.5 + 0.3 * Math.sin(th + Math.PI);
          t.q5 = 0.015 + 0.01 * bass; // orb core radius (small)
          t.q9 = 0.06 + 0.05 * bass; // central burst base radius
          t.q10 = 0.05 + 0.06 * mid; // burst fur amplitude
          t.q11 = huePhase; // hue (green<->magenta band below)
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
          "vec3 haze = mix(vec3(0.04, 0.02, 0.07), vec3(0.03, 0.10, 0.06), n);\n" + // purple <-> green
          "float vig = 1.0 - smoothstep(0.2, 1.0, pr);\n" +
          "haze *= vig * (0.5 + 0.4 * bass);\n" +
          "haze *= smoothstep(0.0, 0.12, pr);\n" + // dark central pupil
          "vec3 g = texture2D(sampler_main, uv).rgb;\n" +
          "vec3 glow = (texture2D(sampler_blur1, uv).rgb + texture2D(sampler_blur2, uv).rgb) * 0.5;\n" +
          "vec3 outc = haze + g + glow * 0.35;\n" +
          "ret = outc / (outc + vec3(0.85));\n" +
          "}\n",
      }
    );

    // central live-waveform burst (feeds the vortex); muted green<->magenta.
    function burst(useSecond) {
      return {
        baseVals: Object.assign({}, WAVE_BASE, {
          enabled: 1,
          samples: 512,
          additive: 1,
          usedots: 0,
          scaling: 1,
          smoothing: 0.05,
          a: 0.8,
          thick: 0,
        }),
        init_eqs: passthrough,
        frame_eqs: passthrough,
        point_eqs: function (a) {
          var ang = a.sample * 6.2832;
          var samp = useSecond ? (a.value2 !== undefined ? a.value2 : a.value1) : a.value1;
          var rad = (a.q9 || 0.08) + (a.q10 || 0.05) * (samp || 0);
          if (rad < 0.03) rad = 0.03;
          a.x = 0.5 + rad * Math.cos(ang);
          a.y = 0.5 + rad * Math.sin(ang);
          var h = 0.33 + 0.59 * (0.5 + 0.5 * Math.sin(6.2832 * ((a.q11 || 0) + a.sample * 0.25))); // green<->magenta
          var rr = 0.5 + 0.5 * Math.cos(6.2832 * h);
          var gg = 0.5 + 0.5 * Math.cos(6.2832 * (h + 0.33));
          var bb = 0.5 + 0.5 * Math.cos(6.2832 * (h + 0.67));
          var l = (rr + gg + bb) / 3,
            sat = 0.6;
          a.r = (rr * sat + l * (1 - sat)) * 0.8;
          a.g = (gg * sat + l * (1 - sat)) * 0.8;
          a.b = (bb * sat + l * (1 - sat)) * 0.8;
          return a;
        },
      };
    }
    // orb = a small FILLED glow-disc (samples fill a tiny disc, drawn as dots). Big enough
    // (~16px) to survive the warp resampling, so its per-frame feedback stamps merge into a
    // continuous bright spiral STREAK — not a chain of rings (circle orb) and not a faint
    // dotted line (single-point orb).
    function orbCore(qx, qy) {
      return {
        baseVals: Object.assign({}, WAVE_BASE, {
          enabled: 1,
          samples: 48,
          additive: 1,
          usedots: 1,
          scaling: 1,
          smoothing: 0,
          a: 1.0,
          thick: 1,
          r: 1.0,
          g: 0.78,
          b: 0.4,
        }),
        init_eqs: passthrough,
        frame_eqs: passthrough,
        point_eqs: function (a) {
          var fr = a.sample;
          var rr = 0.008 * Math.sqrt(fr); // fill a small disc (dense center -> glow)
          var ang = fr * 6.2832 * 9.0; // sunflower spread
          a.x = (a[qx] || 0.5) + rr * Math.cos(ang);
          a.y = (a[qy] || 0.5) + rr * Math.sin(ang);
          a.r = 1.0;
          a.g = 0.78;
          a.b = 0.4;
          return a;
        },
      };
    }
    preset.waves[0] = burst(false); // central waveform burst (channel 1)
    preset.waves[1] = burst(true); // central waveform burst (channel 2)
    preset.waves[2] = orbCore("q1", "q2"); // orb A (pulled into the spiral)
    preset.waves[3] = orbCore("q3", "q4"); // orb B
    return preset;
  })();
})();
