/* Alchemy family presets — the multi-phase 'Era —' presets.
 * Plain <script> loaded AFTER presets/kit.js; registers into window.WMP_PRESETS.
 * Uses the shared kit globals (build, circleWave, ALC_PAL, alc* factories, ...).
 * (Split out of the former monolithic presets/alchemy.js — see CLAUDE.md.)
 */
(function () {
  "use strict";
  var P = (window.WMP_PRESETS = window.WMP_PRESETS || {});

  // ── Alchemy v2: Era — Anemone/Vortex ─────────────────────────────────────────
  // The FIRST true ERA-PRESET (Tier-1 of the Director architecture; see
  // docs/alchemy-v2 + memory). Recreates the reference's emotional centre (0:40–1:16)
  // NOT as a fixed scene but as a DECOUPLED STATE MACHINE running inside one preset:
  // four layers each advance on their OWN clock (verified composition model — WMP
  // Alchemy evolves colour/background/camera/motif independently, not in lockstep):
  //   L1 COLOUR  — energy-coupled hue drift, ping-ponging green↔magenta (q8).
  //   L2 CAMERA  — a vortex dive that ramps in/out on its own ~26s clock (q12/q13 →
  //                warp twist+suction); deeper when the music is loud. Independent of
  //                the motif: the anemone fur SMEARS into spiral arms when it engages.
  //   L3 BG      — crossfades solid-snap ↔ fluid on a ~17s clock (q14); the solid
  //                COLOUR snaps to a new dusty tone on a strong beat (q15 — a discrete,
  //                decoupled event, like the sage→cobalt snaps in the reference).
  //   L4 MOTIF   — the two tethered orbiters fade in/out on a ~22s clock (q17); the
  //                anemone is the constant primary.
  // q1..q32 reach the warp+comp shaders in this build (#define q1 _qa.x …), so every
  // layer is data-driven from frame_eqs. Muted + Reinhard tone-mapped per the Alchemy
  // rule. <=6 custom waves (the build's reliable cap).
  P["Alchemy v2: Era — Anemone/Vortex"] = (function () {
    var huePhase = 0,
      lastT = 0;
    var camPhase = 0; // camera = deliberate gesture (LFO ramp)
    var bgSH = makeSH(0, 1, 8, 18, 1.2),
      motifSH = makeSH(0.3, 1.0, 10, 22, 1.0); // stochastic decoupled layers
    var bgSel = 0,
      lastSnap = -10;
    var flash = alcBeatFlash();
    var rosePal = alcPalette({ step: 0.5, base: 0.28, sat: 0.75, gain: 1.0 }); // green↔magenta band (brighter fur)

    var preset = build(
      {
        wave_a: 0,
        decay: 0.95,
        gammaadj: 1.3,
        zoom: 1.0,
        rot: 0.0,
        warp: 0.0,
        wrap: 0,
        darken_center: 0.0,
        echo_alpha: 0,
      },
      {
        frame: function (t) {
          var bass = t.bass_att || t.bass || 1,
            mid = t.mid_att || t.mid || 1,
            treb = t.treb_att || t.treb || 1;
          var tm = t.time;
          var dt = Math.min(0.1, Math.max(0, tm - lastT));
          lastT = tm;
          var energy = (bass + mid + treb) / 3;
          var f = flash(energy, dt); // 0..1 beat flash (discrete events)

          // L1 — COLOUR: slow energy-coupled hue clock (faster only when LOUDER than nominal).
          huePhase = alcHueClock(huePhase, dt, Math.max(0, energy - 1), 0.012, 0.06);
          t.q8 = huePhase;

          // L2 — CAMERA: vortex dive ramps on its OWN ~26s clock, deepened by loudness.
          camPhase += dt / 26;
          var vortexAmt = 0.5 - 0.5 * Math.cos(camPhase * 6.2832); // smooth 0→1→0
          vortexAmt = Math.min(1, vortexAmt * (0.6 + 0.6 * Math.max(0, energy - 1)));
          t.q12 = vortexAmt; // warp twist gate
          t.q13 = vortexAmt; // warp inward-suction gate

          // L3 — BACKGROUND: solid↔fluid crossfade on its OWN ~17s clock; solid colour
          // SNAPS to the next dusty tone on a strong beat (≥4s apart) — a discrete event.
          t.q14 = bgSH(tm, dt); // 0=solid↔1=fluid (stochastic sample&hold)
          if (f > 0.6 && tm - lastSnap > 4) {
            bgSel = (bgSel + 1) % 4;
            lastSnap = tm;
          }
          t.q15 = bgSel;
          t.q16 = 0.5 + 0.6 * f + 0.2 * Math.max(0, bass - 1); // bg brightness lifts on beats

          // L4 — MOTIF: orbiter pair fades in/out stochastically (random hold + morph).
          t.q17 = motifSH(tm, dt); // orbiter visibility (stochastic)

          // motif geometry (the anemone fur + the two flanking orbiters on opposing orbits)
          var th = tm * 0.3;
          t.q1 = 0.5 + 0.24 * Math.cos(th);
          t.q2 = 0.5 + 0.24 * Math.sin(th); // orbs pulled IN closer
          t.q3 = 0.5 + 0.24 * Math.cos(th + Math.PI);
          t.q4 = 0.5 + 0.24 * Math.sin(th + Math.PI);
          t.q5 = 0.018 + 0.014 * bass; // orb core radius
          t.q6 = t.q5 * 2.1 + 0.006; // Saturn ring radius
          t.q7 = 0.01 + 0.035 * treb; // tether lightning amplitude (small)
          t.q9 = 0.11 + 0.1 * bass; // anemone base radius (bigger fur, fills the centre)
          t.q10 = 0.06 + 0.07 * mid; // anemone fur amplitude (PULSAR pulse)
          return t;
        },
        // CAMERA (L2) lives here: a twist that GROWS toward centre + inward suction, both
        // GATED by q12/q13 (vortexAmt). At rest (q12=0) the warp is identity + a fast fade
        // → crisp anemone; as it engages, the fur smears into spiral arms (slow fade).
        warp:
          "shader_body {\n" +
          "vec2 c = uv - 0.5;\n" +
          "float pr = length(c);\n" +
          "float tw = q12 * (0.05 + 0.05*mid + 0.10/(pr*6.0 + 1.0));\n" + // twist tightens toward centre
          "float sc = 1.0 - q13 * (0.012 + 0.006*bass);\n" + // inward suction
          "float sn = sin(tw), cs = cos(tw);\n" +
          "vec2 sd = vec2(c.x*cs - c.y*sn, c.x*sn + c.y*cs) * sc + 0.5;\n" +
          "ret = texture2D(sampler_main, sd).rgb;\n" +
          "ret -= mix(0.022, 0.005, q12);\n" + // short tight orb trails when flat, long spiral arms in the vortex
          "}\n",
        // BACKGROUND (L3) lives here: crossfade a snapping SOLID colour (q15) with a domain-
        // warped FLUID wash by q14, brightness q16, dark central pupil + vignette, then the
        // feedback buffer (motif glow) + bloom, Reinhard tone-mapped so it stays muted.
        comp:
          NOISE_GLSL +
          "shader_body {\n" +
          "vec2 d = uv - 0.5; d.x *= resolution.x / resolution.y;\n" +
          "float pr = length(d);\n" +
          "float si = mod(floor(q15), 4.0);\n" +
          "vec3 sol = si < 0.5 ? vec3(0.10,0.17,0.12) : si < 1.5 ? vec3(0.09,0.14,0.30) : si < 2.5 ? vec3(0.16,0.07,0.18) : vec3(0.18,0.16,0.07);\n" + // sage / cobalt / plum / olive
          "vec2 fq = vec2(fbm(uv*1.8 + vec2(time*0.04, -time*0.03)), fbm(uv*1.8 + 5.0 - time*0.035));\n" +
          "float n = fbm(uv*1.6 + fq*1.3);\n" +
          "vec3 flu = mix(vec3(0.05,0.03,0.10), vec3(0.04,0.12,0.08), clamp(n*1.3, 0.0, 1.0));\n" + // purple↔green fluid
          "vec3 bg = mix(sol, flu, clamp(q14, 0.0, 1.0));\n" +
          "float vig = 1.0 - 0.45*smoothstep(0.25, 1.1, pr);\n" +
          "float pupil = smoothstep(0.0, 0.05, pr);\n" + // SMALL dark anemone eye (was a huge hole)
          "bg *= vig * pupil * (0.6 + 0.5*q16);\n" +
          "vec3 g = texture2D(sampler_main, uv).rgb;\n" +
          "vec3 glow = (texture2D(sampler_blur1, uv).rgb + texture2D(sampler_blur2, uv).rgb) * 0.5;\n" +
          "vec3 outc = bg + g + glow * 0.30;\n" +
          "ret = outc / (outc + vec3(0.9));\n" + // Reinhard, muted (k=0.9)
          "}\n",
      }
    );

    // L4 motif waves — the anemone fur (constant) + a fading orbiter pair joined by a tether.
    // The anemone hue PING-PONGS green↔magenta off the q8 colour clock (a band, not a full
    // wheel sweep — the reference's two-tone behaviour). Orbs/tether fade via q17.
    function anemone() {
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
          var rad = (a.q9 || 0.12) + (a.q10 || 0.06) * (a.value1 || 0);
          if (rad < 0.03) rad = 0.03;
          a.x = 0.5 + rad * Math.cos(ang);
          a.y = 0.5 + rad * Math.sin(ang);
          rosePal(a, 0); // muted green↔magenta band keyed by a.q8
          return a;
        },
      };
    }
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
          r: 0.6,
          g: 0.8,
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
          var disp = (a.value1 || 0) * (a.q7 || 0.03);
          a.x = ax + a.sample * dx + nx * disp;
          a.y = ay + a.sample * dy + ny * disp;
          var vis = a.q17 === undefined ? 1 : a.q17; // L4 fade
          a.r = 0.6 * vis;
          a.g = 0.8 * vis;
          a.b = 1.0 * vis;
          a.a = 0.55 * vis;
          return a;
        },
      };
    }
    function orb(qx, qy, isRing) {
      return {
        baseVals: Object.assign({}, WAVE_BASE, {
          enabled: 1,
          samples: isRing ? 96 : 80,
          additive: 1,
          usedots: 0,
          scaling: 1,
          smoothing: 0.9,
          a: isRing ? 0.25 : 0.95,
          thick: isRing ? 0 : 1,
        }),
        init_eqs: passthrough,
        frame_eqs: passthrough,
        point_eqs: function (a) {
          var r = isRing ? a.q6 || 0.05 : a.q5 || 0.02;
          var ang = a.sample * 6.2832;
          a.x = (a[qx] || 0.5) + r * Math.cos(ang);
          a.y = (a[qy] || 0.5) + r * Math.sin(ang);
          var vis = a.q17 === undefined ? 1 : a.q17; // L4 fade
          if (isRing) {
            a.r = 0.85 * vis;
            a.g = 0.92 * vis;
            a.b = 1.0 * vis;
            a.a = 0.25 * vis;
          } // white Saturn ring
          else {
            a.r = 1.0 * vis;
            a.g = 0.72 * vis;
            a.b = 0.34 * vis;
            a.a = 0.95 * vis;
          } // gold core
          return a;
        },
      };
    }
    preset.waves[0] = anemone(); // anemone fur (constant primary)
    preset.waves[1] = tether(); // lightning tether between the orbs
    preset.waves[2] = orb("q1", "q2", false); // orb A core (gold)
    preset.waves[3] = orb("q3", "q4", false); // orb B core (gold)
    preset.waves[4] = orb("q1", "q2", true); // orb A ring (white)
    preset.waves[5] = orb("q3", "q4", true); // orb B ring (white)
    return preset;
  })();

  // ── Alchemy v2: Era — Corridor ───────────────────────────────────────────────
  // Macro era 1 (reference 0:00–0:40): a wireframe NET of radial waveform spokes +
  // the orbiter pair over a 3D-corridor camera that FOLDS into a red/green kaleido "X"
  // tunnel and back. Energetic, vivid (the kaleido muting-rule exception). Decoupled
  // layers in frame_eqs: L1 fast rainbow hue (q8) · L2 camera = kaleido-fold amount on a
  // ~24s clock + bass zoom (q12/q13 → warp) · L3 horizon-bands ↔ black bg (q14, beat-lit
  // q16) · L4 orbiter fade (q17). Net spokes are the constant primary.
  P["Alchemy v2: Era — Corridor"] = (function () {
    var lastT = 0,
      camPhase = 0; // camera = deliberate gesture (LFO)
    var hueSH = makeSH(0, 1, 9, 18, 0.5); // STOCHASTIC scheme hue → palette differs over time
    var bgSH = makeSH(0, 1, 8, 18, 1.2),
      motifSH = makeSH(0.3, 1.0, 10, 22, 1.0);
    var oax = makeSH(0.18, 0.82, 5, 11, 0.7),
      oay = makeSH(0.18, 0.82, 5, 11, 0.7),
      obx = makeSH(0.18, 0.82, 5, 11, 0.7),
      oby = makeSH(0.18, 0.82, 5, 11, 0.7); // orbs at RANDOM places
    var flash = alcBeatFlash();
    var preset = build(
      {
        wave_a: 0,
        decay: 0.95,
        gammaadj: 1.4,
        zoom: 1.0,
        rot: 0.0,
        warp: 0.0,
        wrap: 0,
        darken_center: 0.04,
        echo_alpha: 0,
      },
      {
        frame: function (t) {
          var bass = t.bass_att || t.bass || 1,
            mid = t.mid_att || t.mid || 1,
            treb = t.treb_att || t.treb || 1;
          var tm = t.time,
            dt = Math.min(0.1, Math.max(0, tm - lastT));
          lastT = tm;
          var energy = (bass + mid + treb) / 3,
            f = flash(energy, dt);
          t.q8 = (hueSH(tm, dt) + tm * 0.004) % 1; // L1 STOCHASTIC scheme hue
          camPhase += dt / 24;
          t.q12 = 0.5 - 0.5 * Math.cos(camPhase * 6.2832); // L2 kaleido-fold 0..1
          t.q13 = Math.max(0, bass - 1); // L2 corridor zoom pulse
          t.q14 = bgSH(tm, dt); // L3 bands↔black (stochastic)
          t.q16 = 0.5 + 0.6 * f + 0.2 * Math.max(0, bass - 1);
          t.q17 = motifSH(tm, dt); // L4 orbiter visibility (stochastic)
          t.q1 = oax(tm, dt);
          t.q2 = oay(tm, dt); // orbs wander to RANDOM places (not a fixed orbit)
          t.q3 = obx(tm, dt);
          t.q4 = oby(tm, dt);
          t.q5 = 0.015 + 0.012 * bass;
          t.q6 = t.q5 * 2.1 + 0.006;
          t.q7 = 0.01 + 0.035 * treb;
          t.q9 = tm * 0.1; // net spin
          t.q18 = 0.4; // net spoke length
          return t;
        },
        // L2 CAMERA: fold the FEEDBACK into a 4-fold mirror by q12 (the kaleido X tunnel)
        // and recede it slightly; at q12=0 it's a plain corridor.
        warp:
          "shader_body {\n" +
          "vec2 c = uv - 0.5;\n" +
          "float pa = atan(c.y, c.x);\n" +
          "float pr = length(c);\n" +
          "float seg = 6.2832 / 4.0;\n" +
          "float fa = abs(pa - seg * floor(pa / seg + 0.5));\n" +
          "float ua = mix(pa, fa, clamp(q12, 0.0, 1.0));\n" +
          "float z = 0.992 - 0.012 * q13;\n" +
          "vec2 sd = vec2(cos(ua), sin(ua)) * pr * z + 0.5;\n" +
          "ret = texture2D(sampler_main, sd).rgb;\n" +
          "ret -= 0.006;\n" +
          "}\n",
        // L3 BACKGROUND: spectral horizon bands (hue-shifted by the q8 clock) faded to black
        // by q14; less muting (k=0.7) so the kaleido era reads vivid.
        comp:
          NOISE_GLSL +
          PAL_GLSL +
          "shader_body {\n" +
          "vec2 d = uv - 0.5; d.x *= resolution.x / resolution.y;\n" +
          "float pr = length(d);\n" +
          "float yb = d.y * 4.0 + time * 0.06;\n" +
          "float bb = 0.5 + 0.5 * sin(fract(yb) * 6.2832);\n" +
          "vec3 bands = mix(vec3(1.0, 0.18, 0.18), vec3(0.18, 0.95, 0.35), bb);\n" + // red↔green bands (no rainbow)
          "bands *= exp(-pow(d.y * 3.0, 2.0));\n" +
          "vec3 bg = bands * clamp(q14, 0.0, 1.0) * (0.5 + 0.5 * q16);\n" +
          "vec3 g = texture2D(sampler_main, uv).rgb;\n" +
          "vec3 glow = (texture2D(sampler_blur1, uv).rgb + texture2D(sampler_blur2, uv).rgb) * 0.5;\n" +
          "vec3 outc = bg + g + glow * 0.35;\n" +
          "ret = outc / (outc + vec3(0.7));\n" +
          "}\n",
      }
    );
    function rays(n) {
      return {
        baseVals: Object.assign({}, WAVE_BASE, {
          enabled: 1,
          samples: 512,
          additive: 1,
          usedots: 0,
          scaling: 1,
          smoothing: 0.05,
          a: 0.5,
          thick: 0,
        }),
        init_eqs: passthrough,
        frame_eqs: passthrough,
        point_eqs: function (a) {
          var seg = 1 / n,
            k = Math.floor(a.sample / seg),
            ff = (a.sample - k * seg) / seg;
          var ang = (k / n) * 6.2832 + (a.q9 || 0);
          var rad = ff * (a.q18 || 0.4);
          var disp = (a.value1 || 0) * 0.05 * ff; // waveform jag grows outward along each spoke
          a.x = 0.5 + rad * Math.cos(ang) - disp * Math.sin(ang);
          a.y = 0.5 + rad * Math.sin(ang) + disp * Math.cos(ang);
          // RED↔GREEN two-tone (the reference X-tunnel is red/green, NOT a rainbow);
          // parity splits spokes into the two hues, the duo drifts slowly with q8.
          var h = (k % 2 ? 0.0 : 0.65) + 0.05 * Math.sin(6.2832 * (a.q8 || 0));
          a.r = (0.5 + 0.5 * Math.cos(6.2832 * h)) * 0.85;
          a.g = (0.5 + 0.5 * Math.cos(6.2832 * (h + 0.33))) * 0.85;
          a.b = (0.5 + 0.5 * Math.cos(6.2832 * (h + 0.67))) * 0.85;
          return a;
        },
      };
    }
    function orb(qx, qy, isRing) {
      return {
        baseVals: Object.assign({}, WAVE_BASE, {
          enabled: 1,
          samples: isRing ? 96 : 80,
          additive: 1,
          usedots: 0,
          scaling: 1,
          smoothing: 0.9,
          a: isRing ? 0.25 : 0.95,
          thick: isRing ? 0 : 1,
        }),
        init_eqs: passthrough,
        frame_eqs: passthrough,
        point_eqs: function (a) {
          var r = isRing ? a.q6 || 0.05 : a.q5 || 0.02,
            ang = a.sample * 6.2832;
          a.x = (a[qx] || 0.5) + r * Math.cos(ang);
          a.y = (a[qy] || 0.5) + r * Math.sin(ang);
          var vis = a.q17 === undefined ? 1 : a.q17;
          if (isRing) {
            a.r = 0.85 * vis;
            a.g = 0.92 * vis;
            a.b = 1.0 * vis;
            a.a = 0.25 * vis;
          } else {
            a.r = 1.0 * vis;
            a.g = 0.85 * vis;
            a.b = 0.5 * vis;
            a.a = 0.95 * vis;
          }
          return a;
        },
      };
    }
    preset.waves[0] = rays(18); // the wireframe net of radial waveform spokes
    preset.waves[1] = orb("q1", "q2", false); // orb A core
    preset.waves[2] = orb("q3", "q4", false); // orb B core
    preset.waves[3] = orb("q1", "q2", true); // orb A ring
    preset.waves[4] = orb("q3", "q4", true); // orb B ring
    return preset;
  })();

  // ── Alchemy v2: Era — Mandala/Fluid ──────────────────────────────────────────
  // Macro era 3 (reference 1:16–2:00): nested counter-rotating star-polygon mandalas with
  // a persistent diagonal waveform line, over a flat-blue backdrop that crossfades to a
  // green↔magenta marbled-fluid field. Crisp lines (cleared feedback → no smear). Decoupled
  // layers: L1 green↔magenta hue (q8) · L2 camera = mandala spin rate (q9, its own clock) ·
  // L3 flat-blue ↔ marble bg crossfade (q14) · L4 diagonal-line + orbiter fade (q17).
  P["Alchemy v2: Era — Mandala/Fluid"] = (function () {
    var huePhase = 0,
      lastT = 0,
      spin = 0; // spin = mandala camera (gesture)
    var bgSH = makeSH(0, 1, 8, 18, 1.2),
      motifSH = makeSH(0.3, 1.0, 10, 22, 1.1); // stochastic decoupled layers
    var linePal = alcPalette({ base: 0.55, step: 0.1, sat: 0.3, gain: 1.8 }); // near-WHITE crisp lines (pop on any backdrop, like the reference)
    var preset = build(
      {
        wave_a: 0,
        decay: 0.5,
        gammaadj: 1.3,
        zoom: 1.0,
        rot: 0.0,
        warp: 0.0,
        wrap: 0,
        darken_center: 0.0,
        echo_alpha: 0,
      },
      {
        frame: function (t) {
          var bass = t.bass_att || t.bass || 1,
            mid = t.mid_att || t.mid || 1,
            treb = t.treb_att || t.treb || 1;
          var tm = t.time,
            dt = Math.min(0.1, Math.max(0, tm - lastT));
          lastT = tm;
          var energy = (bass + mid + treb) / 3;
          huePhase = alcHueClock(huePhase, dt, Math.max(0, energy - 1), 0.012, 0.05);
          t.q8 = huePhase; // L1
          spin += dt * (0.15 + 0.25 * Math.max(0, treb - 1));
          t.q9 = spin; // L2 mandala spin (own clock)
          t.q14 = bgSH(tm, dt); // L3 flat-blue↔marble (stochastic)
          t.q17 = motifSH(tm, dt); // L4 diagonal + orb visibility (stochastic)
          t.q5 = 0.018 + 0.012 * bass;
          t.q6 = t.q5 * 2.1 + 0.006; // orb radii
          var th = tm * 0.22;
          t.q1 = 0.5 + 0.36 * Math.cos(th);
          t.q2 = 0.5 + 0.36 * Math.sin(th);
          t.q3 = 0.5 + 0.36 * Math.cos(th + Math.PI);
          t.q4 = 0.5 + 0.36 * Math.sin(th + Math.PI);
          return t;
        },
        warp: ALC_CLEAR_WARP, // clear each frame → crisp mandala lines (glow comes from the comp bloom)
        comp:
          NOISE_GLSL +
          "shader_body {\n" +
          "vec2 d = uv - 0.5; d.x *= resolution.x / resolution.y;\n" +
          "float pr = length(d);\n" +
          "vec3 flatbg = vec3(0.08, 0.26, 0.60) * (1.0 - 0.45 * pr);\n" + // RICH saturated blue backdrop (the reference is vivid, NOT muted)
          "vec2 fq = d + 0.15 * vec2(sin(time * 0.2), cos(time * 0.17));\n" +
          "float fv = fbm(fq * 3.0 + time * 0.05);\n" +
          "float rdg = abs(fract(fv * 5.0) - 0.5);\n" +
          "float ridge = smoothstep(0.05, 0.0, rdg);\n" +
          "vec3 marble = mix(vec3(0.06, 0.18, 0.10), vec3(0.26, 0.05, 0.22), 0.5 + 0.5 * sin(time * 0.06)) + ridge * vec3(0.12, 0.42, 0.22);\n" + // luminous green↔magenta fluid + softer veins (so the white stars read on top)
          "vec3 bg = mix(flatbg, marble, clamp(q14, 0.0, 1.0));\n" +
          "vec3 g = texture2D(sampler_main, uv).rgb;\n" +
          "vec3 glow = (texture2D(sampler_blur1, uv).rgb + texture2D(sampler_blur2, uv).rgb) * 0.5;\n" +
          "vec3 outc = bg + g + glow * 0.30;\n" +
          "ret = outc / (outc + vec3(0.85));\n" +
          "}\n",
      }
    );
    // a crisp {n/step} STAR POLYGON (e.g. pentagram {5/2}) — straight edges between every
    // step-th vertex of n points → the recognizable nested-star mandala. Rotated by q9*dir.
    function starPoly(n, step, R, dir) {
      return {
        baseVals: Object.assign({}, WAVE_BASE, {
          enabled: 1,
          samples: 512,
          additive: 1,
          usedots: 0,
          scaling: 1,
          smoothing: 0.0,
          a: 1.0,
          thick: 1,
        }),
        init_eqs: passthrough,
        frame_eqs: passthrough,
        point_eqs: function (a) {
          var idx = a.sample * n; // position along the n star edges
          var i0 = Math.floor(idx),
            fr = idx - i0;
          var phi = (a.q9 || 0) * dir;
          var a0 = (((i0 * step) % n) / n) * 6.2832 + phi; // current star vertex
          var a1 = ((((i0 + 1) * step) % n) / n) * 6.2832 + phi; // next (step away)
          var x = Math.cos(a0) + fr * (Math.cos(a1) - Math.cos(a0)); // straight crisp edge between them
          var y = Math.sin(a0) + fr * (Math.sin(a1) - Math.sin(a0));
          a.x = 0.5 + R * x;
          a.y = 0.5 + R * y;
          linePal(a, n % 2);
          return a;
        },
      };
    }
    function diagonal() {
      return {
        baseVals: Object.assign({}, WAVE_BASE, {
          enabled: 1,
          samples: 512,
          additive: 1,
          usedots: 0,
          scaling: 1,
          smoothing: 0.03,
          a: 0.85,
          thick: 1,
        }),
        init_eqs: passthrough,
        frame_eqs: passthrough,
        point_eqs: function (a) {
          var s = a.sample,
            disp = (a.value1 || 0) * 0.08;
          a.x = 0.12 + s * 0.76 - disp * 0.7071;
          a.y = 0.12 + s * 0.76 + disp * 0.7071; // SW→NE, perpendicular jag
          var vis = a.q17 === undefined ? 1 : a.q17;
          a.r = 0.95 * vis;
          a.g = 0.35 * vis;
          a.b = 0.85 * vis;
          a.a = 0.6 * vis; // magenta line
          return a;
        },
      };
    }
    function orb(qx, qy, isRing) {
      return {
        baseVals: Object.assign({}, WAVE_BASE, {
          enabled: 1,
          samples: isRing ? 96 : 80,
          additive: 1,
          usedots: 0,
          scaling: 1,
          smoothing: 0.9,
          a: isRing ? 0.25 : 0.9,
          thick: isRing ? 0 : 1,
        }),
        init_eqs: passthrough,
        frame_eqs: passthrough,
        point_eqs: function (a) {
          var r = isRing ? a.q6 || 0.05 : a.q5 || 0.02,
            ang = a.sample * 6.2832;
          a.x = (a[qx] || 0.5) + r * Math.cos(ang);
          a.y = (a[qy] || 0.5) + r * Math.sin(ang);
          var vis = a.q17 === undefined ? 1 : a.q17;
          if (isRing) {
            a.r = 0.85 * vis;
            a.g = 0.92 * vis;
            a.b = 1.0 * vis;
            a.a = 0.25 * vis;
          } else {
            a.r = 1.0 * vis;
            a.g = 0.78 * vis;
            a.b = 0.42 * vis;
            a.a = 0.9 * vis;
          }
          return a;
        },
      };
    }
    preset.waves[0] = starPoly(12, 5, 0.34, 1); // outer 12/5 star
    preset.waves[1] = starPoly(8, 3, 0.22, -1); // mid 8/3 star (counter-rotating)
    preset.waves[2] = starPoly(5, 2, 0.12, 1); // inner pentagram
    preset.waves[3] = diagonal(); // persistent diagonal waveform line
    preset.waves[4] = orb("q1", "q2", false); // flanking orb A
    preset.waves[5] = orb("q3", "q4", false); // flanking orb B
    return preset;
  })();

  // ── Alchemy v2: Era — Supernova ──────────────────────────────────────────────
  // Macro era 4 finale (reference 2:48–3:06): a violent furry radial URCHIN (spoke length
  // ∝ RAW bass — explosive, not breathing — + live waveform fur), a dark central eye, the
  // orbiter pair + tether, over a magenta↔lime radial bloom. Vivid (supernova exception).
  // Decoupled layers: L1 vivid hue (q8) · L2 camera = Z-plunge ramp on its own clock (q12/q13
  // → warp) · L3 dark ↔ radial-bloom bg, tightening on bass (q14) · L4 orbiter fade (q17);
  // the urchin RE-BLOOMS on each beat (alcBeatFlash → q19).
  P["Alchemy v2: Era — Supernova"] = (function () {
    var huePhase = 0,
      lastT = 0,
      camPhase = 0; // camera = deliberate gesture (LFO)
    var bgSH = makeSH(0, 1, 8, 18, 1.2),
      motifSH = makeSH(0.3, 1.0, 10, 22, 1.0); // stochastic decoupled layers
    var flash = alcBeatFlash();
    var preset = build(
      {
        wave_a: 0,
        decay: 0.94,
        gammaadj: 1.5,
        zoom: 1.0,
        rot: 0.0,
        warp: 0.0,
        wrap: 0,
        darken_center: 0.1,
        echo_alpha: 0,
      },
      {
        frame: function (t) {
          var bass = t.bass_att || t.bass || 1,
            mid = t.mid_att || t.mid || 1,
            treb = t.treb_att || t.treb || 1;
          var rawBass = t.bass || 1;
          var tm = t.time,
            dt = Math.min(0.1, Math.max(0, tm - lastT));
          lastT = tm;
          var energy = (bass + mid + treb) / 3,
            f = flash(energy, dt);
          huePhase = alcHueClock(huePhase, dt, Math.max(0, energy - 1), 0.03, 0.1);
          t.q8 = huePhase; // L1 vivid
          camPhase += dt / 28;
          t.q12 = 0.5 - 0.5 * Math.cos(camPhase * 6.2832); // L2 plunge ramp
          t.q13 = Math.max(0, mid - 1); // L2 swirl
          t.q14 = bgSH(tm, dt); // L3 dark↔bloom (stochastic)
          t.q17 = motifSH(tm, dt); // L4 orbiter visibility (stochastic)
          t.q18 = 0.16; // urchin base radius
          t.q19 = 0.18 * Math.max(0, rawBass - 1) + 0.3 * f; // explosive spoke growth: RAW bass + beat re-bloom
          t.q9 = tm * 0.06; // slow urchin spin
          var th = tm * 0.34;
          t.q1 = 0.5 + 0.33 * Math.cos(th);
          t.q2 = 0.5 + 0.33 * Math.sin(th);
          t.q3 = 0.5 + 0.33 * Math.cos(th + Math.PI);
          t.q4 = 0.5 + 0.33 * Math.sin(th + Math.PI);
          t.q5 = 0.015 + 0.012 * bass;
          t.q6 = t.q5 * 2.1 + 0.006;
          t.q7 = 0.01 + 0.035 * treb;
          return t;
        },
        // L2 CAMERA: Z-plunge — sample inward (content expands outward) gated by q12, with a
        // small q13 swirl; long trails when plunging, short when at rest.
        warp:
          "shader_body {\n" +
          "vec2 c = uv - 0.5;\n" +
          "float pl = q12 * (0.02 + 0.03 * bass);\n" +
          "float tw = 0.012 * q13;\n" +
          "float sn = sin(tw), cs = cos(tw);\n" +
          "vec2 rc = vec2(c.x * cs - c.y * sn, c.x * sn + c.y * cs);\n" +
          "vec2 sd = rc * (1.0 - pl) + 0.5;\n" +
          "ret = texture2D(sampler_main, sd).rgb * mix(0.74, 0.93, q12);\n" + // FAST multiplicative fade → dark between spikes (kills the pale wash); longer streaks only deep in the plunge
          "}\n",
        // L3 BACKGROUND: magenta↔lime radial bloom (hue-clocked) that tightens on bass, faded
        // in by q14; never pure black. Vivid (k=0.7).
        comp:
          NOISE_GLSL +
          "shader_body {\n" +
          "vec2 d = uv - 0.5; d.x *= resolution.x / resolution.y;\n" +
          "float pr = length(d);\n" +
          "float bloom = exp(-pr * pr * (3.0 - 1.5 * bass));\n" +
          "vec3 col = mix(vec3(0.9, 0.2, 0.6), vec3(0.3, 0.9, 0.2), 0.5 + 0.5 * sin(time * 0.4 + q8 * 6.2832));\n" +
          "vec3 bg = col * bloom * clamp(q14, 0.0, 1.0) + vec3(0.02, 0.01, 0.03);\n" +
          "vec3 g = texture2D(sampler_main, uv).rgb;\n" +
          "vec3 glow = (texture2D(sampler_blur1, uv).rgb + texture2D(sampler_blur2, uv).rgb) * 0.5;\n" +
          "vec3 outc = bg + g + glow * 0.18;\n" + // less bloom (was a white halo)
          "ret = outc / (outc + vec3(1.1));\n" + // Reinhard (eased back now the fast fade prevents buildup) → colour returns
          "}\n",
      }
    );
    function urchin() {
      return {
        baseVals: Object.assign({}, WAVE_BASE, {
          enabled: 1,
          samples: 512,
          additive: 1,
          usedots: 0,
          scaling: 1,
          smoothing: 0.02,
          a: 0.5,
          thick: 0,
        }),
        init_eqs: passthrough,
        frame_eqs: passthrough,
        point_eqs: function (a) {
          var n = 64,
            seg = 1 / n,
            k = Math.floor(a.sample / seg),
            ff = (a.sample - k * seg) / seg;
          var ang = (k / n) * 6.2832 + (a.q9 || 0);
          var rad = ff * ((a.q18 || 0.16) + (a.q19 || 0)) + (a.value1 || 0) * 0.04 * ff; // RAW-bass spike + waveform fur
          a.x = 0.5 + rad * Math.cos(ang);
          a.y = 0.5 + rad * Math.sin(ang);
          // GREEN↔MAGENTA two-tone (canonical Alchemy; NOT a rainbow). Parity-split spikes,
          // duo drifts with the q8 clock.
          var h = (k % 2 ? 0.2 : 0.65) + 0.05 * Math.sin(6.2832 * (a.q8 || 0));
          a.r = (0.5 + 0.5 * Math.cos(6.2832 * h)) * 0.5; // dimmed so additive overlap stays COLOURED, not white
          a.g = (0.5 + 0.5 * Math.cos(6.2832 * (h + 0.33))) * 0.5;
          a.b = (0.5 + 0.5 * Math.cos(6.2832 * (h + 0.67))) * 0.5;
          return a;
        },
      };
    }
    function tether() {
      return {
        baseVals: Object.assign({}, WAVE_BASE, {
          enabled: 1,
          samples: 512,
          additive: 1,
          usedots: 0,
          scaling: 1,
          smoothing: 0.03,
          a: 0.5,
          thick: 0,
        }),
        init_eqs: passthrough,
        frame_eqs: passthrough,
        point_eqs: function (a) {
          var ax = a.q1 !== undefined ? a.q1 : 0.4,
            ay = a.q2 !== undefined ? a.q2 : 0.5;
          var bx = a.q3 !== undefined ? a.q3 : 0.6,
            by = a.q4 !== undefined ? a.q4 : 0.5;
          var dx = bx - ax,
            dy = by - ay,
            len = Math.sqrt(dx * dx + dy * dy) || 1;
          var nx = -dy / len,
            ny = dx / len,
            disp = (a.value1 || 0) * (a.q7 || 0.03);
          a.x = ax + a.sample * dx + nx * disp;
          a.y = ay + a.sample * dy + ny * disp;
          var vis = a.q17 === undefined ? 1 : a.q17;
          a.r = 0.7 * vis;
          a.g = 0.85 * vis;
          a.b = 1.0 * vis;
          a.a = 0.5 * vis;
          return a;
        },
      };
    }
    function orb(qx, qy, isRing) {
      return {
        baseVals: Object.assign({}, WAVE_BASE, {
          enabled: 1,
          samples: isRing ? 96 : 80,
          additive: 1,
          usedots: 0,
          scaling: 1,
          smoothing: 0.9,
          a: isRing ? 0.25 : 0.95,
          thick: isRing ? 0 : 1,
        }),
        init_eqs: passthrough,
        frame_eqs: passthrough,
        point_eqs: function (a) {
          var r = isRing ? a.q6 || 0.05 : a.q5 || 0.02,
            ang = a.sample * 6.2832;
          a.x = (a[qx] || 0.5) + r * Math.cos(ang);
          a.y = (a[qy] || 0.5) + r * Math.sin(ang);
          var vis = a.q17 === undefined ? 1 : a.q17;
          if (isRing) {
            a.r = 0.85 * vis;
            a.g = 0.92 * vis;
            a.b = 1.0 * vis;
            a.a = 0.25 * vis;
          } else {
            a.r = 1.0 * vis;
            a.g = 0.72 * vis;
            a.b = 0.34 * vis;
            a.a = 0.95 * vis;
          }
          return a;
        },
      };
    }
    preset.waves[0] = urchin(); // the furry supernova urchin (primary)
    preset.waves[1] = tether(); // tether between the orbiters
    preset.waves[2] = orb("q1", "q2", false); // orb A core
    preset.waves[3] = orb("q3", "q4", false); // orb B core
    preset.waves[4] = orb("q1", "q2", true); // orb A ring
    preset.waves[5] = orb("q3", "q4", true); // orb B ring
    return preset;
  })();
})();
