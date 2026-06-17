/* Alchemy V4 — a ground-up rebuild of WMP "Alchemy: Random".
 *
 * Plain <script> loaded AFTER presets/kit.js; registers into window.WMP_PRESETS.
 * Uses kit globals: build, WAVE_BASE, ALC_KALEIDO_GLSL, PAL_GLSL, makeSH, alcEnergy.
 *
 * WHY this is different from v1/v2 (see docs/alchemy-v4/SPEC.md + the plan):
 *   The real Alchemy is NOT discrete motifs on flat backgrounds switched by a director
 *   (that was v2 -> hollow, repetitive, long, muddy). It is ONE continuous FEEDBACK FIELD:
 *   thin live-waveform emitters are injected each frame into a warp/decay loop and
 *   KALEIDOSCOPICALLY MIRRORED, so a few moving emitters smear + multiply into a dense
 *   flower / vortex / tunnel / bowtie / mandala that fills the whole frame, while a muted
 *   palette drifts and the "look" morphs every ~5-6s. This is "Dance of the Freaky Circles"
 *   (the one preset the user loves) generalized into a self-driving engine.
 *
 *   The 16 reference looks collapse to 6 MECHANISMS (M0..M6), all the same engine under
 *   different (fold, camera, emitter, palette, density). A macro-director in frame_eqs eases
 *   ~9 continuous knobs toward per-scene targets (picked non-periodically, anti-repeat) so
 *   every transition is a smooth morph and the frame is never hollow (fold+feedback fill it).
 *
 * q-var map (frame_eqs -> warp/comp shaders + wave point_eqs; all read the same q object):
 *   q1 emitterMode(0..4)  q2 emitterAlpha   q3 foldStrength   q4 foldN
 *   q5 zoomRate(+in/-out) q6 rot            q7 swirl          q8 dx   q9 dy   q10 decayMul
 *   q11 palettePhase      q12 exposure      q13 bass          q14 energy
 *   q15 bgAmbient         q16 warmMix       q17 reach         q18 bass_att   q19 treb
 *   q20 time              q21..q24 orb A/B (x,y)  q25 spokeSpan  q27 pivotX  q28 pivotY
 *   q29 density           q30 (reserved: oblique seam)         q31/q32 spare
 */
(function () {
  "use strict";
  var P = (window.WMP_PRESETS = window.WMP_PRESETS || {});

  var TAU = 6.28318530718;
  function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }

  // ── emitter geometry helpers (shared by every wave's point_eqs) ─────────────────
  // Each sets a.x/a.y in 0..1 wave space (0.5 = center). Displacement is ALWAYS the live
  // waveform (a.value1/value2), never synthetic sin — that is what gives the dense organic
  // jaggedness for free (CLAUDE.md "zigzag/lightning line" rule).

  function ringAt(a, cx, cy, baseR, ampR) {            // one thin jagged ring
    var ang = a.sample * TAU;
    var rr = baseR + ampR * (a.value1 || 0);
    a.x = cx + rr * Math.cos(ang);
    a.y = cy + rr * Math.sin(ang);
  }
  function concentricAt(a, cx, cy, baseR, step, ampR) {// 8 nested rings -> bullseye orb
    var N = 8;
    var k = Math.floor(a.sample * N);
    var sIn = a.sample * N - k;
    var ang = sIn * TAU;
    var rr = baseR + k * step + ampR * (a.value1 || 0);
    a.x = cx + rr * Math.cos(ang);
    a.y = cy + rr * Math.sin(ang);
  }
  function spokeBurst(a, cx, cy, span, startAng, baseR, ampR, N) {  // dandelion / rosette fan
    var k = Math.floor(a.sample * N);
    var sIn = a.sample * N - k;                        // 0..1 along the spoke
    var ang = startAng + (k / N) * span;
    var rr = baseR * (0.12 + 0.88 * sIn) + ampR * (a.value1 || 0) * sIn;  // tip jaggedness grows outward
    a.x = cx + rr * Math.cos(ang);
    a.y = cy + rr * Math.sin(ang);
  }
  function tether(a, ax, ay, bx, by, amp, ch) {        // jagged oscilloscope line A->B
    var s = a.sample;
    var dx = bx - ax, dy = by - ay;
    var L = Math.sqrt(dx * dx + dy * dy) || 1;
    var nx = -dy / L, ny = dx / L;                     // perpendicular
    var v = ch === 2 ? (a.value2 || 0) : (a.value1 || 0);
    a.x = ax + dx * s + nx * amp * v;
    a.y = ay + dy * s + ny * amp * v;
  }
  function stalk(a, x0, amp) {                          // vertical waveform stalk
    a.y = a.sample;
    a.x = x0 + amp * (a.value1 || 0);
  }
  function offscreen(a) { a.x = -2; a.y = -2; a.r = 0; a.g = 0; a.b = 0; }

  // A custom wave that IS slot `slot` of the reconfigurable 4-emitter bank. Its point_eqs
  // branches on the live mode (a.q1) so the SAME 4 slots become any emitter configuration,
  // and crossfade between configs via a.q2 (emitterAlpha). Colors are near-white intensity
  // (cores brighter) — the comp shader does all the muted recoloring by luminance, which
  // keeps the palette cohesive and impossible to blow neon.
  function emitterWave(slot) {
    return {
      baseVals: Object.assign({}, WAVE_BASE, {
        enabled: 1, samples: 512, additive: 1, usedots: 0, scaling: 1,
        smoothing: 0.18, thick: 1, a: 1, r: 1, g: 1, b: 1
      }),
      init_eqs: passthrough,
      frame_eqs: passthrough,
      point_eqs: function (a) {
        var mode = Math.round(a.q1 || 0);
        var alpha = a.q2 === undefined ? 1 : a.q2;
        var reach = a.q17 || 0.10;
        var dens = a.q29 === undefined ? 0.7 : a.q29;
        var ax = a.q21 === undefined ? 0.30 : a.q21, ay = a.q22 === undefined ? 0.30 : a.q22;
        var bx = a.q23 === undefined ? 0.70 : a.q23, by = a.q24 === undefined ? 0.70 : a.q24;
        var mx = (ax + bx) * 0.5, my = (ay + by) * 0.5;  // tether midpoint (dandelion origin)
        var inten = 0.7;                                 // default filament intensity

        if (mode === 1) {                                // ORBS + TETHER (the WMP signature)
          if (slot === 0) { ringAt(a, ax, ay, reach * 0.55, reach * 0.18); inten = 0.95; }
          else if (slot === 1) { ringAt(a, bx, by, reach * 0.55, reach * 0.18); inten = 0.95; }
          else if (slot === 2) { tether(a, ax, ay, bx, by, 0.22, 1); inten = 0.8; }
          else { tether(a, ax, ay, bx, by, 0.16, 2); inten = 0.55; }   // braided 2nd strand
        } else if (mode === 2) {                         // DANDELION burst + orbs riding rim
          if (slot === 0) {
            var N = Math.round(28 + 56 * dens);
            spokeBurst(a, mx, my, (a.q25 || TAU), 0.0, reach * 1.4, reach * 1.0, N);
            inten = 0.7;
          } else if (slot === 1) { ringAt(a, ax, ay, reach * 0.5, reach * 0.15); inten = 0.9; }
          else if (slot === 2) { ringAt(a, bx, by, reach * 0.5, reach * 0.15); inten = 0.9; }
          else { tether(a, ax, ay, bx, by, 0.14, 1); inten = 0.5; }
        } else if (mode === 3) {                         // STALKS (vertical waveform comb / ribbon)
          if (slot === 0) { stalk(a, 0.12, 0.10); inten = 0.75; }
          else if (slot === 1) { stalk(a, 0.88, 0.10); inten = 0.75; }
          else if (slot === 2) { tether(a, 0.08, 0.78, 0.92, 0.62, 0.10, 1); inten = 0.7; } // diagonal ribbon
          else { stalk(a, 0.5, 0.16); inten = 0.6; }
        } else if (mode === 4) {                         // RINGS (concentric bullseye orbs + tether)
          if (slot === 0) { concentricAt(a, ax, ay, reach * 0.18, reach * 0.12, reach * 0.06); inten = 0.9; }
          else if (slot === 1) { concentricAt(a, bx, by, reach * 0.18, reach * 0.12, reach * 0.06); inten = 0.9; }
          else if (slot === 2) { tether(a, ax, ay, bx, by, 0.20, 1); inten = 0.8; }
          else { offscreen(a); return a; }
        } else {                                         // mode 0 = FLOWER (central rosette + bar + lobes)
          if (slot === 0) {
            var Nf = Math.round(14 + 14 * dens);
            spokeBurst(a, 0.5, 0.5, TAU, a.q20 * 0.05, reach * 1.3, reach * 0.9, Nf);
            inten = 0.7;
          } else if (slot === 1) {                       // horizontal waveform bar through center
            var s = a.sample;
            a.x = 0.15 + 0.70 * s;
            a.y = 0.5 + 0.045 * (a.value2 || 0);
            inten = 0.8;
          } else if (slot === 2) { ringAt(a, 0.32, 0.5, reach * 0.45, reach * 0.12); inten = 0.65; } // almond lobe L
          else { ringAt(a, 0.68, 0.5, reach * 0.45, reach * 0.12); inten = 0.65; }                   // almond lobe R
        }

        var v = inten * alpha;
        a.r = v; a.g = v; a.b = v;
        return a;
      }
    };
  }

  // ── the macro-director: continuous, non-periodic wander over the 9 knobs ────────
  // Mechanism profiles (target knob values). zoomRate convention: + = inward/tunnel,
  // - = outward/explode. fold: 1 free, 2 bilateral, 4 quad-X, 6/8 mandala.
  //   m = emitterMode (0 FLOWER,1 ORBS,2 DANDELION,3 STALKS,4 RINGS)
  var MECHS = [
    // M0 cold sparks (rare; opener/calm)
    { m: 4, fold: 1, zoom: 0.0,   rot: 0.0,   swirl: 0.0,  dx: 0.0,   dy: 0.0,   decay: 0.92, exp: 0.7, dens: 0.35, px: 0.5,  py: 0.5,  w: 0.5 },
    // M1 free-space orbs+tether (signature)
    { m: 1, fold: 1, zoom: -0.004,rot: 0.0,   swirl: 0.0,  dx: 0.0015,dy: -0.0015,decay: 0.93, exp: 1.0, dens: 0.6,  px: 0.5,  py: 0.5,  w: 1.4 },
    // M2 dandelion / growing stalks
    { m: 2, fold: 2, zoom: -0.003,rot: 0.0,   swirl: 0.0,  dx: 0.0,   dy: 0.004, decay: 0.94, exp: 1.1, dens: 0.8,  px: 0.5,  py: 0.5,  w: 1.0 },
    // M3a X-bowtie explode
    { m: 0, fold: 4, zoom: -0.020,rot: -0.04, swirl: 0.03, dx: 0.0,   dy: 0.0,   decay: 0.95, exp: 1.2, dens: 0.9,  px: 0.5,  py: 0.5,  w: 1.0 },
    // M3b X-bowtie vortex-wind
    { m: 2, fold: 4, zoom: 0.028, rot: 0.0,   swirl: 0.06, dx: 0.0,   dy: 0.0,   decay: 0.95, exp: 1.15,dens: 0.9,  px: 0.5,  py: 0.5,  w: 1.0 },
    // M4 quad bullseye + central rosette
    { m: 0, fold: 4, zoom: 0.034, rot: 0.0,   swirl: 0.01, dx: 0.0,   dy: 0.0,   decay: 0.95, exp: 1.0, dens: 0.7,  px: 0.5,  py: 0.5,  w: 0.9 },
    // M5 vortex-swirl smear
    { m: 4, fold: 1, zoom: 0.020, rot: 0.020, swirl: 0.09, dx: 0.0,   dy: 0.0,   decay: 0.97, exp: 1.0, dens: 0.55, px: 0.45, py: 0.40, w: 1.0 },
    // M6 perspective-floor / vertical-rain
    { m: 3, fold: 1, zoom: 0.012, rot: 0.0,   swirl: 0.0,  dx: -0.003,dy: 0.008, decay: 0.95, exp: 1.0, dens: 0.7,  px: 0.5,  py: 0.5,  w: 1.0 },
    // M8 dense mandala (rare set-piece)
    { m: 2, fold: 6, zoom: 0.006, rot: 0.012, swirl: 0.02, dx: 0.0,   dy: 0.0,   decay: 0.96, exp: 1.1, dens: 0.85, px: 0.5,  py: 0.5,  w: 1.0 }
  ];
  // weighted pick list (M0 rare; signature/kaleido common) — indices into MECHS
  var PICK = [0, 1, 1, 1, 2, 2, 3, 3, 4, 5, 6, 6, 7, 7, 8];

  function makeDirector() {
    // current (eased) + target knob values. Initialize on the signature look.
    var cur = { zoom: -0.004, rot: 0, swirl: 0, dx: 0, dy: 0, decay: 0.93, exp: 1.0,
                dens: 0.6, fold: 1, foldStr: 0, px: 0.5, py: 0.5, pal: 0.40, mode: 1 };
    var tgt = Object.assign({}, cur);
    var alpha = 1;          // emitterAlpha (dips during a mode change to hide the swap)
    var pendMode = cur.mode;
    var sceneStart = 0, dwell = 8, ease = 0.5, lastTime = 0, lastPick = 1;
    var palHome = [0.35, 0.42, 0.48];   // green/teal home hues (the field keeps returning here)

    function rollDwell() {
      var r = Math.random();
      if (r < 0.6) return 6 + Math.random() * 6;       // typical
      if (r < 0.8) return 3 + Math.random() * 2;       // short
      return 18 + Math.random() * 7;                   // long set-piece
    }
    function jit(v, frac) { return v * (1 + (Math.random() * 2 - 1) * frac) + (Math.random() * 2 - 1) * frac * 0.004; }

    function pickScene(time) {
      var idx;
      do { idx = PICK[Math.floor(Math.random() * PICK.length)]; } while (idx === lastPick);
      lastPick = idx;
      var M = MECHS[idx];
      tgt.zoom = jit(M.zoom, 0.18); tgt.rot = jit(M.rot, 0.15); tgt.swirl = clamp(jit(M.swirl, 0.2), 0, 0.13);
      tgt.dx = jit(M.dx, 0.2); tgt.dy = jit(M.dy, 0.2); tgt.decay = clamp(M.decay, 0.9, 0.975);
      tgt.exp = M.exp; tgt.dens = clamp(jit(M.dens, 0.12), 0.3, 1); tgt.fold = M.fold;
      tgt.foldStr = M.fold > 1.5 ? 1 : 0; tgt.px = M.px; tgt.py = M.py;
      pendMode = M.m;
      // palette: change family; bias ~1-in-3 back to the green/teal home, else wander.
      if (Math.random() < 0.34) tgt.pal = palHome[Math.floor(Math.random() * palHome.length)] + (Math.random() * 0.1 - 0.05);
      else tgt.pal = Math.random();
      // transition: 75% morph (slow ease), 25% snap (fast ease, biased to fold flips)
      var snap = Math.random() < 0.25 || tgt.fold !== cur.fold && Math.random() < 0.5;
      ease = snap ? (1 / 0.5) : (1 / 2.0);
      sceneStart = time; dwell = rollDwell();
    }

    return function (t) {
      var time = t.time || 0;
      var dt = clamp(time - lastTime, 0, 0.1); lastTime = time;
      if (sceneStart === 0) sceneStart = time;
      if (time - sceneStart >= dwell) pickScene(time);

      var k = clamp(dt * ease, 0, 1);                  // per-knob ease factor this frame
      cur.zoom += (tgt.zoom - cur.zoom) * k;
      cur.rot += (tgt.rot - cur.rot) * k;
      cur.swirl += (tgt.swirl - cur.swirl) * k;
      cur.dx += (tgt.dx - cur.dx) * k;
      cur.dy += (tgt.dy - cur.dy) * k;
      cur.decay += (tgt.decay - cur.decay) * k;
      cur.exp += (tgt.exp - cur.exp) * k;
      cur.dens += (tgt.dens - cur.dens) * k;
      cur.foldStr += (tgt.foldStr - cur.foldStr) * clamp(dt / 1.5, 0, 1);   // fold eases in ~1.5s
      cur.fold = tgt.fold;
      cur.px += (tgt.px - cur.px) * k; cur.py += (tgt.py - cur.py) * k;
      // palette: ease toward target + a slow constant creep so the hue is never frozen
      cur.pal += (tgt.pal - cur.pal) * clamp(dt * 0.4, 0, 1) + dt * 0.02;

      // emitter mode crossfade: dip alpha to ~0, swap, ramp back (feedback covers the gap)
      if (cur.mode !== pendMode) {
        alpha -= dt * 4.0;
        if (alpha <= 0.04) { alpha = 0.04; cur.mode = pendMode; }
      } else if (alpha < 1) {
        alpha = Math.min(1, alpha + dt * 2.5);
      }

      // ── audio coupling (live energy drives breath / bloom / jaggedness) ──
      var bass = t.bass || 1, bassA = t.bass_att !== undefined ? t.bass_att : bass;
      var treb = t.treb !== undefined ? t.treb : 1;
      var energy = alcEnergy(t);

      t.q1 = cur.mode;
      t.q2 = alpha;
      t.q3 = cur.foldStr;
      t.q4 = cur.fold;
      t.q5 = cur.zoom + 0.004 * (bassA - 1);           // beat breathing on the feedback zoom
      t.q6 = cur.rot;
      t.q7 = cur.swirl + (cur.swirl > 0.005 ? 0.03 * (bassA - 1) : 0);
      t.q8 = cur.dx;
      t.q9 = cur.dy;
      t.q10 = cur.decay;
      t.q11 = cur.pal;
      t.q12 = cur.exp * (1 + 0.25 * (bassA - 1));       // exposure transient bloom
      t.q13 = bass;
      t.q14 = energy;
      t.q15 = 0.05;                                     // bg ambient floor (ground never pure black)
      t.q16 = clamp(0.5 * (bassA - 1) + 0.5, 0, 1);     // cool(quiet) -> warm(loud) mix
      t.q17 = (0.10 + 0.07 * (bassA - 1)) * (0.7 + 0.6 * cur.dens);   // emitter reach pulses with bass
      t.q18 = bassA;
      t.q19 = treb;
      t.q20 = time;
      // orbs roam on wide opposite paths so the tether stretches corner-to-corner
      var th = time * 0.22;
      t.q21 = 0.5 + 0.30 * Math.cos(th);
      t.q22 = 0.5 + 0.30 * Math.sin(th * 0.83);
      t.q23 = 0.5 + 0.30 * Math.cos(th + Math.PI);
      t.q24 = 0.5 + 0.30 * Math.sin(th * 0.83 + Math.PI);
      t.q25 = TAU;                                      // dandelion full-circle span
      t.q27 = cur.px; t.q28 = cur.py;
      t.q29 = cur.dens;
      return t;
    };
  }

  // ── WARP: feedback transform (fold + camera + decay) ────────────────────────────
  // Build the new feedback buffer = the previous frame, kaleidoscope-folded then moved by
  // the camera (zoom/rot/swirl/translate about a pivot), faded by decay. This is the source
  // of ALL flowing structure: emitters drawn after warp get smeared into filaments and the
  // fold multiplies them into n-fold symmetry -> a dense field that fills the frame.
  // GLSL reserved-name rule: NO locals named ang/rad/ret/uv/q* (they are predeclared in the
  // generated main()). We use pd/pr/pang/etc.
  var WARP_V4 =
    ALC_KALEIDO_GLSL +
    "shader_body {\n" +
    "  float asp = resolution.x / resolution.y;\n" +
    "  vec2 piv = vec2(q27, q28);\n" +
    "  vec2 pd = uv - piv; pd.x *= asp;\n" +                       // centered on pivot, aspect-corrected
    // kaleidoscope fold (select bilateral / quad / mandala by q4; blend by foldStrength q3)
    "  vec2 fbil = vec2(abs(pd.x), pd.y);\n" +                     // q4~2  bilateral mirror
    "  vec2 fquad = abs(pd);\n" +                                  // q4~4  quad X-bowtie
    "  vec2 fmand = alcKaleido(pd, max(q4, 2.0));\n" +             // q4>=6 radial mandala
    "  vec2 pdf = pd;\n" +
    "  pdf = mix(pdf, fbil,  step(1.5, q4) * step(q4, 2.5));\n" +
    "  pdf = mix(pdf, fquad, step(3.5, q4) * step(q4, 4.5));\n" +
    "  pdf = mix(pdf, fmand, step(5.5, q4));\n" +
    "  pd = mix(pd, pdf, q3);\n" +
    // camera: rotate (+ radius-scaled swirl) then zoom about the pivot
    "  float pr = length(pd);\n" +
    "  float pang = q6 + q7 * pr;\n" +
    "  float cs = cos(pang), sn = sin(pang);\n" +
    "  pd = mat2(cs, -sn, sn, cs) * pd;\n" +
    "  pd *= (1.0 + q5);\n" +                                      // q5>0 = inward pull
    "  pd.x /= asp;\n" +
    "  vec2 suv = piv + pd + vec2(q8, q9);\n" +                    // feedback re-feed offset (rakes/comets)
    "  vec3 pcol = texture2D(sampler_main, suv).rgb;\n" +
    "  ret = pcol * q10;\n" +                                      // fade (decay; baseVal decay is inert in this build)
    "}\n";

  // ── COMP: recolor the field via a drifting muted two-tone palette + bloom + tone-map ──
  // The feedback buffer carries near-white additive intensity (cores bright, filaments dim).
  // We map luminance -> a complementary two-tone scheme (foreground for elements, the dim
  // ground tinted by the complement so it is NEVER flat black) and Reinhard tone-map so the
  // hot additive cores compress to SOFT colour, never neon white (the Alchemy muted rule).
  var COMP_V4 =
    PAL_GLSL +
    "vec3 dusty(vec3 c, float s){ float l = dot(c, vec3(0.333)); return mix(vec3(l), c, s); }\n" +
    "shader_body {\n" +
    "  vec3 sharp = texture2D(sampler_main, uv).rgb;\n" +
    "  float lum = max(sharp.r, max(sharp.g, sharp.b));\n" +
    // cheap 8-tap threshold bloom (sharp lines bleed a soft halo into the space)
    "  vec2 px = 1.0 / resolution;\n" +
    "  vec3 bloom = vec3(0.0);\n" +
    "  for (int i = 0; i < 8; i++) {\n" +
    "    float ba = float(i) / 8.0 * 6.2832;\n" +
    "    vec2 bd = vec2(cos(ba), sin(ba));\n" +
    "    bloom += max(texture2D(sampler_main, uv + bd * 3.0 * px).rgb - 0.18, 0.0);\n" +
    "    bloom += max(texture2D(sampler_main, uv + bd * 7.0 * px).rgb - 0.18, 0.0);\n" +
    "  }\n" +
    "  float bl = (bloom.r + bloom.g + bloom.b) * 0.06;\n" +
    // complementary two-tone, both desaturated -> muted-but-luminous
    "  vec3 fg = dusty(pal(q11), 0.72);\n" +                       // element hue
    "  vec3 bg = dusty(pal(q11 + 0.5), 0.5);\n" +                  // complementary ground hue
    "  vec3 warm = dusty(pal(q11 + 0.08), 0.8);\n" +
    "  fg = mix(fg, warm, q16 * 0.5);\n" +                         // shift warmer when loud
    "  vec3 col = bg * q15;\n" +                                   // ambient ground (never pure black)
    "  col = mix(col, fg, smoothstep(0.04, 0.42, lum));\n" +       // dim ground -> element colour
    "  col = mix(col, mix(fg, vec3(1.0), 0.6), smoothstep(0.55, 1.05, lum));\n" +  // hot cores -> toward white
    "  col += fg * bl;\n" +                                        // bloom halo in the element hue
    "  col *= q12;\n" +                                            // exposure (energy arc + bass)
    // depth vignette so the field has body and never reads as a flat slab
    "  float asp = resolution.x / resolution.y;\n" +
    "  vec2 pdc = uv - 0.5; pdc.x *= asp;\n" +
    "  col *= smoothstep(1.20, 0.25, length(pdc));\n" +
    "  ret = col / (col + vec3(0.6));\n" +                         // Reinhard tone-map -> soft, never neon
    "}\n";

  P["Alchemy V4: Random"] = (function () {
    var preset = build(
      {
        wave_a: 0,            // primary waveform off; the 4 custom waves draw everything
        additivewave: 1,
        decay: 0.95,          // (inert in this build; real fade is in WARP_V4 via q10)
        zoom: 1, rot: 0, warp: 0, dx: 0, dy: 0, cx: 0.5, cy: 0.5,
        gammaadj: 1.6,
        darken_center: 0, wrap: 0, echo_alpha: 0
      },
      { frame: makeDirector(), warp: WARP_V4, comp: COMP_V4 }
    );
    preset.waves[0] = emitterWave(0);
    preset.waves[1] = emitterWave(1);
    preset.waves[2] = emitterWave(2);
    preset.waves[3] = emitterWave(3);
    return preset;
  })();
})();
