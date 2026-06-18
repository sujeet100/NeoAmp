/* Alchemy V4 — WMP "Alchemy: Random" rebuilt on the REAL v2 kit factories.
 *
 * Plain <script> loaded AFTER presets/kit.js. Each "look" is a SEPARATE preset built from the
 * actual tuned kit motif factories (alcAnemone / alcOrbiterNode / alcTether / alcMeshRings /
 * alcSpindle / alcNgonStack / alcStarWaves / alcOrb...), wrapped in a shared V4 ENGINE:
 *   - WARP: kaleidoscope fold + dynamic camera (perspective tilt / zoom / rot / swirl / pan) + decay.
 *   - COMP: VIBRANT multi-colour-fusion background (+ moiré / marble / horizon variants) UNDER the
 *           kit-coloured motif, bloom, Reinhard tone-map.
 * The viz.js Director shuffle-cycles these scenes (every look once before any repeat).
 *
 * Q-VAR SPLIT (so the engine never collides with the kit motif contract):
 *   MOTIF (kit factories read): q2,q3 center · q5 size · q6 jag · q7 orbR · q8 hue · q9 spin ·
 *     q10 twist/diag-opacity · q11 ngon tier-energy · q14 mesh depth · q21..q24 orbiter nodes ·
 *     q25 orb radius · q26 tether amp
 *   ENGINE (warp/comp read): q1 decay · q12 foldN · q13 foldStr · q15 zoom · q16 rot · q17 swirl ·
 *     q18 dx · q19 dy · q20 pivotX · q27 pivotY · q28 tilt · q29 bgVariant · q31 exposure · q32 bass
 *     (comp also reads q8 for the shared hue clock so fg + bg stay in the same colour family)
 */
(function () {
  "use strict";
  var P = (window.WMP_PRESETS = window.WMP_PRESETS || {});
  var TAU = 6.28318530718;

  // ── shared WARP: fold + camera (tilt/zoom/rot/swirl/translate about a pivot) + light blur + decay ──
  var WARP_V4 =
    ALC_KALEIDO_GLSL +
    "shader_body {\n" +
    "  float asp = resolution.x / resolution.y;\n" +
    "  vec2 piv = vec2(q20, q27);\n" +
    "  vec2 pd = uv - piv; pd.x *= asp;\n" +
    "  vec2 fbil = vec2(abs(pd.x), pd.y);\n" +
    "  vec2 fquad = abs(pd);\n" +
    "  vec2 fmand = alcKaleido(pd, max(q12, 2.0));\n" +
    "  vec2 pdf = pd;\n" +
    "  pdf = mix(pdf, fbil,  step(1.5, q12) * step(q12, 2.5));\n" +
    "  pdf = mix(pdf, fquad, step(3.5, q12) * step(q12, 4.5));\n" +
    "  pdf = mix(pdf, fmand, step(5.5, q12));\n" +
    "  pd = mix(pd, pdf, q13);\n" +
    "  pd /= max(1.0 + q28 * pd.y, 0.25);\n" +
    "  float pr = length(pd);\n" +
    "  float pang = q16 + q17 * pr;\n" +
    "  float cs = cos(pang), sn = sin(pang);\n" +
    "  pd = mat2(cs, -sn, sn, cs) * pd;\n" +
    "  pd *= (1.0 + q15);\n" +
    "  pd.x /= asp;\n" +
    "  vec2 suv = piv + pd + vec2(q18, q19);\n" +
    "  vec2 wp = 1.0 / resolution; float br = 1.1;\n" +
    "  vec3 acc = texture2D(sampler_main, suv).rgb * 0.6;\n" +
    "  acc += texture2D(sampler_main, suv + vec2(wp.x * br, 0.0)).rgb * 0.1;\n" +
    "  acc += texture2D(sampler_main, suv - vec2(wp.x * br, 0.0)).rgb * 0.1;\n" +
    "  acc += texture2D(sampler_main, suv + vec2(0.0, wp.y * br)).rgb * 0.1;\n" +
    "  acc += texture2D(sampler_main, suv - vec2(0.0, wp.y * br)).rgb * 0.1;\n" +
    "  ret = acc * q1;\n" +
    "}\n";

  // ── shared COMP: vibrant multi-colour-fusion background (q29 variant) UNDER the kit-coloured
  //    motif, + bloom + Reinhard tone-map. fg + bg share the q8 hue clock -> harmonious. ──
  var COMP_V4 =
    NOISE_GLSL + PAL_GLSL + ALC_MOIRE_GLSL +
    "vec3 dusty(vec3 c, float s){ float l = dot(c, vec3(0.333)); return mix(vec3(l), c, s); }\n" +
    "shader_body {\n" +
    "  float asp = resolution.x / resolution.y;\n" +
    "  vec2 pdc = uv - 0.5; pdc.x *= asp; float prad = length(pdc);\n" +
    "  vec3 sharp = texture2D(sampler_main, uv).rgb;\n" +
    "  vec2 px = 1.0 / resolution; vec3 bloom = vec3(0.0);\n" +
    "  for (int i = 0; i < 8; i++) {\n" +
    "    float ba = float(i) / 8.0 * 6.2832; vec2 bd = vec2(cos(ba), sin(ba));\n" +
    "    bloom += max(texture2D(sampler_main, uv + bd * 3.0 * px).rgb - 0.2, 0.0);\n" +
    "    bloom += max(texture2D(sampler_main, uv + bd * 7.0 * px).rgb - 0.2, 0.0);\n" +
    "  }\n" +
    "  float bl = (bloom.r + bloom.g + bloom.b) * 0.05;\n" +
    "  float hb = q8; float bb = 0.5 + 0.5 * (q32 - 1.0);\n" +
    "  vec3 cA = dusty(pal(hb), 0.9), cB = dusty(pal(hb + 0.5), 0.85), cC = dusty(pal(hb + 0.28), 0.9);\n" +
    // multi-hue fusion of the scene's 3 harmonious tones (the original's colour bleed)
    "  vec2 w = pdc * 1.3 + vec2(fbm(pdc * 1.1 + vec2(time * 0.04, -time * 0.03)), fbm(pdc * 1.1 + 7.0 - time * 0.035));\n" +
    "  float n1 = fbm(w * 1.3 + time * 0.025), n2 = fbm(w * 2.0 - time * 0.02 + 3.0);\n" +
    "  vec3 ground = mix(cB, cC, smoothstep(0.30, 0.75, n1));\n" +
    "  ground = mix(ground, cA, smoothstep(0.45, 0.85, n2) * 0.45);\n" +
    "  if (q29 < 1.5) { ground = mix(ground, alcMoire(uv, time, bb, cA), 0.6); }\n" +                 // moiré
    "  else if (q29 < 2.5) { float vein = smoothstep(0.10, 0.0, abs(fract(n1 * 4.0) - 0.5) - 0.06); ground = mix(ground, cC * 1.25, vein * 0.6); }\n" +  // marble
    "  else if (q29 < 3.5) { float band = pdc.y * 5.0 + time * 0.10; ground = mix(ground, mix(cB, cA, 0.5 + 0.5 * sin(band)), 0.4); }\n" +              // horizon bands
    "  ground *= (0.45 + 0.4 * n1 + 0.15 * bb) * mix(0.6, 1.0, smoothstep(1.45, 0.1, prad));\n" +
    "  vec3 col = ground + sharp * 1.25 + cA * bl;\n" +                                               // kit-coloured motif over the vibrant ground
    "  col *= q31;\n" +
    "  ret = col / (col + vec3(0.6));\n" +
    "}\n";

  var BASE = { wave_a: 0, additivewave: 1, decay: 0.95, zoom: 1, rot: 0, warp: 0, dx: 0, dy: 0,
               cx: 0.5, cy: 0.5, gammaadj: 1.5, darken_center: 0, wrap: 0, echo_alpha: 0 };

  // Clean FILLED COLOUR orb as a custom SHAPE (not a spiral wave): bright warm-white core ->
  // colour halo -> colour ring. Drawn solid each frame (no 16-turn spiral, no white cone).
  // Positioned at (qx,qy) q-var fields; radius q7; colour from the shared hue clock q8 + hueOff.
  function orbShape(qx, qy, hueOff) {
    return {
      baseVals: Object.assign({}, SHAPE_BASE, { enabled: 1, sides: 48, additive: 0, thickoutline: 1 }),
      init_eqs: passthrough,
      frame_eqs: function (s) {
        var cx = s[qx] !== undefined ? s[qx] : 0.5, cy = s[qy] !== undefined ? s[qy] : 0.5;
        var h = (s.q8 || 0) + (hueOff || 0);
        var r = 0.5 + 0.5 * Math.cos(6.2832 * h), g = 0.5 + 0.5 * Math.cos(6.2832 * (h + 0.33)), b = 0.5 + 0.5 * Math.cos(6.2832 * (h + 0.67));
        s.x = cx; s.y = cy;
        s.rad = (s.q7 || 0.035) * (1 + 0.35 * Math.max(0, (s.bass_att || 1) - 1));
        s.r = 1.0; s.g = 0.96; s.b = 0.88; s.a = 0.95;       // bright warm-white CORE
        s.r2 = r; s.g2 = g; s.b2 = b; s.a2 = 0.0;            // colour halo fading out (the colour fill)
        s.border_r = r; s.border_g = g; s.border_b = b; s.border_a = 0.85;  // colour ring
        return s;
      }
    };
  }

  // Per-scene frame driver: sets the engine q-vars (camera/fold/bg/exposure) + the motif contract
  // (center/size/hue/spin/...) + orbiter motion. cfg holds the constants for this look.
  function sceneFrame(cfg) {
    return function (t) {
      var time = t.time || 0;
      var bass = t.bass || 1, bassA = t.bass_att !== undefined ? t.bass_att : bass;
      var energy = (typeof alcEnergy === "function") ? alcEnergy(t) : bassA;
      // ENGINE — camera + fold + bg + exposure (always-on gentle drift so nothing is static)
      t.q1 = cfg.decay;
      t.q12 = cfg.fold || 1; t.q13 = cfg.fold > 1.5 ? 1 : 0;
      t.q15 = (cfg.zoom || 0) + 0.006 * (bassA - 1) + 0.004 * Math.sin(time * 0.13);     // forward breath / fly
      t.q16 = (cfg.rot || 0) + 0.003 * Math.sin(time * 0.09);
      t.q17 = (cfg.swirl || 0) + (cfg.swirl ? 0.03 * (bassA - 1) : 0);
      t.q18 = cfg.dx || 0; t.q19 = cfg.dy || 0;
      var pan = cfg.pan === undefined ? 0.025 : cfg.pan;                                  // gentle orbit -> parallax
      t.q20 = (cfg.px === undefined ? 0.5 : cfg.px) + pan * Math.cos(time * 0.11);
      t.q27 = (cfg.py === undefined ? 0.5 : cfg.py) + pan * Math.sin(time * 0.11);
      t.q28 = (cfg.tilt || 0) + (cfg.tiltOsc === undefined ? 0.06 : cfg.tiltOsc) * Math.sin(time * 0.10);  // 3D plane wobble -> sense of space
      t.q29 = cfg.bg || 0;
      t.q31 = (cfg.exp || 1.0) * (1 + 0.25 * (bassA - 1));
      t.q32 = bass;
      // MOTIF contract (read by the kit factories)
      t.q2 = 0.5; t.q3 = 0.5;
      t.q5 = (cfg.size || 0.4) * (0.82 + 0.4 * (bassA - 1));            // breathing radius
      t.q6 = cfg.jag || 0.05;
      t.q7 = cfg.orbR || 0.035;
      t.q8 = (cfg.hue || 0) + time * 0.02;                              // slow WMP hue drift (shared by fg + bg)
      t.q9 = time * (cfg.spin || 0);
      t.q10 = (cfg.twist || 0) * (0.5 + 0.8 * (bassA - 1));             // vortex shear scales with bass
      t.q11 = 0.6 + 0.9 * energy;                                       // ngon tier-density energy gate
      t.q14 = (cfg.meshFlow ? (time * cfg.meshFlow) % 1 : 0);
      // orbiter node pair (pulsar / orbiters): roam on wide opposite paths so the tether spans
      var th = time * (cfg.orbitRate || 0.20);
      t.q21 = 0.5 + 0.16 * Math.cos(th); t.q22 = 0.5 + 0.14 * Math.sin(th * 0.83);
      t.q23 = 0.5 + 0.16 * Math.cos(th + Math.PI); t.q24 = 0.5 + 0.14 * Math.sin(th * 0.83 + Math.PI);
      t.q25 = cfg.orbR || 0.035; t.q26 = cfg.tetherAmp || 0.05;
      return t;
    };
  }

  // Build a scene preset from real kit-factory WAVES + orb SHAPES + the shared engine.
  function v4(name, cfg, waves, shapes) {
    var preset = build(BASE, { frame: sceneFrame(cfg), warp: WARP_V4, comp: COMP_V4 });
    for (var i = 0; i < preset.waves.length; i++) preset.waves[i].baseVals.enabled = 0;
    while (preset.waves.length < waves.length) preset.waves.push({ baseVals: Object.assign({}, WAVE_BASE), init_eqs: passthrough, frame_eqs: passthrough, point_eqs: "" });
    for (var j = 0; j < waves.length; j++) preset.waves[j] = waves[j];
    shapes = shapes || [];
    for (var s = 0; s < preset.shapes.length; s++) preset.shapes[s].baseVals.enabled = 0;
    while (preset.shapes.length < shapes.length) preset.shapes.push({ baseVals: Object.assign({}, SHAPE_BASE), init_eqs: passthrough, frame_eqs: passthrough });
    for (var k = 0; k < shapes.length; k++) preset.shapes[k] = shapes[k];
    P[name] = preset;
    (window.WMP_V4_SCENES = window.WMP_V4_SCENES || []).push(name);
    return preset;
  }
  function orbPair() { return [orbShape("q21", "q22", 0.0), orbShape("q23", "q24", 0.5)]; }  // two complementary orbs

  // ── the SCENES (real kit factories; each LAYERED: central motif + tether + two orbs) ──────────
  // PULSAR — anemone flower flanked by two crisp filled orbs joined by a jagged lightning tether.
  v4("Alchemy V4: Pulsar",
     { bg: 0, hue: 0.30, size: 0.42, jag: 0.05, spin: 0.10, decay: 0.86, exp: 1.0, tilt: 0.05, orbR: 0.04, tetherAmp: 0.06, orbitRate: 0.22 },
     [alcAnemone(30, ALC_PAL.roseGreen), alcSpindle(ALC_PAL.mono), alcTether("q21", "q22", "q23", "q24", "q26", ALC_PAL.warm)],
     orbPair());

  // CORRIDOR — a hexagon + triangle WAVEFORM n-gon flying into a tunnel (perspective + forward fly).
  v4("Alchemy V4: Corridor",
     { bg: 3, hue: 0.50, size: 0.34, jag: 0.05, spin: 0.04, decay: 0.78, exp: 1.05, tilt: 0.34, zoom: 0.022, tiltOsc: 0.03, px: 0.5, py: 0.5, orbR: 0.03, tetherAmp: 0.05 },
     [alcNgon({ sides: 6, aspectX: 1.0, hueOff: 0.0 }), alcNgon({ sides: 3, aspectX: 1.0, hueOff: 0.35 }), alcTether("q21", "q22", "q23", "q24", "q26", ALC_PAL.spread)],
     orbPair());

  // VORTEX — kitchen-sink drain: a waveform urchin + orbs spun into a spiral by rotational feedback.
  v4("Alchemy V4: Vortex",
     { bg: 2, hue: 0.00, size: 0.40, spin: 0.20, twist: 0.7, decay: 0.965, exp: 1.0, swirl: 0.09, rot: 0.018, zoom: 0.015, tiltOsc: 0.04, px: 0.45, py: 0.42, orbR: 0.035, tetherAmp: 0.05 },
     [alcSpindle(ALC_PAL.redCyan), alcSpindle(ALC_PAL.twoTone), alcTether("q21", "q22", "q23", "q24", "q26", ALC_PAL.warm)],
     orbPair());

  // MANDALA — nested star-polygon / triangle-waveform mandala over the moiré background + orbs.
  v4("Alchemy V4: Mandala",
     { bg: 1, hue: 0.62, size: 1.0, jag: 0.04, spin: 0.04, decay: 0.45, exp: 1.05, tilt: 0.0, tiltOsc: 0.03, orbR: 0.03 },
     alcNgonStack(1.5, ALC_MANDALA_SPECS, 3),   // 12 specs / 3 = 4 packed waves
     orbPair());

  // ANEMONE — the central sound-waveform flower + orbs + tether (the v1 look, layered).
  v4("Alchemy V4: Anemone",
     { bg: 0, hue: 0.83, size: 0.5, jag: 0.06, spin: 0.07, decay: 0.80, exp: 1.0, tilt: 0.04, orbR: 0.035, tetherAmp: 0.06, orbitRate: 0.15 },
     [alcAnemone(34, ALC_PAL.redCyan), alcTether("q21", "q22", "q23", "q24", "q26", ALC_PAL.mono), alcDiagonalLine(0.4, 0.55, 0.05)],
     orbPair());

  // ORBITERS — two crisp filled orbs + lightning tether + a small central target ring.
  v4("Alchemy V4: Orbiters",
     { bg: 0, hue: 0.15, size: 0.18, decay: 0.86, exp: 1.0, tilt: 0.12, pan: 0.05, orbR: 0.05, tetherAmp: 0.07, orbitRate: 0.20 },
     [alcTether("q21", "q22", "q23", "q24", "q26", ALC_PAL.spread), alcOrbTarget("q2", "q3", 2, ALC_PAL.twoTone)],
     orbPair());

  // STAR — hexagram of two counter-rotating waveform triangles + diagonal slice + orbs.
  v4("Alchemy V4: Star",
     { bg: 3, hue: 0.55, size: 0.32, jag: 0.05, spin: 0.09, decay: 0.78, exp: 1.05, tilt: 0.06, orbR: 0.03 },
     alcStarWaves(2, 0.0).concat([alcDiagonalLine(0.4, 0.6, 0.06)]),
     orbPair());

  // BURST — a waveform urchin blooming OUTWARD into a pinwheel (fountain) + orbs.
  v4("Alchemy V4: Burst",
     { bg: 2, hue: 0.40, size: 0.45, spin: 0.10, decay: 0.95, exp: 1.05, swirl: 0.04, zoom: -0.014, tiltOsc: 0.05, orbR: 0.035, tetherAmp: 0.05 },
     [alcSpindle(ALC_PAL.spread), alcSpindle(ALC_PAL.roseGreen), alcTether("q21", "q22", "q23", "q24", "q26", ALC_PAL.warm)],
     orbPair());
})();
