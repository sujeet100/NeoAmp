/* Dance family presets (3) for the WMP visualizer.
 * Plain <script> loaded AFTER presets/kit.js; registers into window.WMP_PRESETS.
 * Uses the shared kit globals (build, circleWave, ALC_PAL, alc* factories, ...).
 */
(function () {
  "use strict";
  var P = (window.WMP_PRESETS = window.WMP_PRESETS || {});


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
})();
