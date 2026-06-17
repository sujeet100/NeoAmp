/* Alchemy V4 — a ground-up rebuild of WMP "Alchemy: Random".
 *
 * Plain <script> loaded AFTER presets/kit.js; registers into window.WMP_PRESETS.
 * Uses kit globals: build, WAVE_BASE, ALC_KALEIDO_GLSL, PAL_GLSL, NOISE_GLSL, alcEnergy, passthrough.
 *
 * WHY (see docs/alchemy-v4/SPEC.md + the plan): the real Alchemy is ONE continuous FEEDBACK
 * FIELD — thin live-waveform emitters injected into a warp/decay loop and KALEIDOSCOPICALLY
 * MIRRORED, with a drifting muted palette, morphing look every ~5-6s. NOT discrete motifs on
 * flat backgrounds switched by a director (that was v2 -> hollow/repetitive). This is "Dance of
 * the Freaky Circles" (the loved preset) generalized into a self-driving engine.
 *
 * The FULL motif vocabulary is hooked (the user's hard requirement — do NOT reduce it):
 * 12 emitter modes reconfigure the SAME 4 custom-wave slots, and the director pairs each with a
 * camera+fold that makes it read as a named WMP look:
 *   0 FLOWER (rosette; fold8 = kaleido MANDALA)   1 ORBS+TETHER (the signature)
 *   2 DANDELION (seedhead burst)                  3 NET (cross-hatch; +inward zoom = CORRIDOR, fold4 = X-TUNNEL)
 *   4 RINGS (concentric bullseye orbs)            5 WIREFRAME NET-STAR (counter-rotating waveform hexagram)
 *   6 ANEMONE / SPINDLE URCHIN (furry iris)       7 RAY BURST (rotating waveform asterisk; fold6 = spoke mandala)
 *   8 FOUNTAIN (outward radial pinwheel)          9 RIBBON (drifting waveform streak)
 *   10 MANDALA STACK (crisp nested n-gon, clear-warp)  11 CORRIDOR MESH (perspective rings receding to a VP)
 * Plus per-mode camera/fold variations (vortex, bowtie, bullseye) -> ~19 director "mechanisms".
 * 4 background washes (fbm-fluid / marble-veins / horizon-bands / flat-blue) cycle underneath.
 *
 * q-var map (frame_eqs -> warp/comp shaders + wave point_eqs; one meaning each):
 *   q1 emitterMode  q2 emitterAlpha  q3 foldStrength  q4 foldN
 *   q5 zoomRate(+in/-out)  q6 rot  q7 swirl  q8 dx  q9 dy  q10 decayMul
 *   q11 palettePhase  q12 exposure  q13 bass  q14 energy  q15 bgLevel  q16 warmMix
 *   q17 reach  q18 bass_att  q19 treb  q20 time  q21..q24 orb A/B (x,y)  q25 spokeSpan
 *   q26 vortexTwist  q27 pivotX  q28 pivotY  q29 density  q30 bgVariant
 */
(function () {
  "use strict";
  var P = (window.WMP_PRESETS = window.WMP_PRESETS || {});

  var TAU = 6.28318530718;
  function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }

  // ── emitter geometry helpers (shared by every wave's point_eqs) ─────────────────
  // Each sets a.x/a.y in 0..1 wave space (0.5 = center). Displacement is ALWAYS the live
  // waveform (a.value1/value2), never synthetic sin — the dense organic jaggedness for free.

  function ringAt(a, cx, cy, baseR, ampR) {            // one thin jagged ring
    var ang = a.sample * TAU;
    var rr = baseR + ampR * (a.value1 || 0);
    a.x = cx + rr * Math.cos(ang); a.y = cy + rr * Math.sin(ang);
  }
  function concentricAt(a, cx, cy, baseR, step, ampR) {// 4 nested rings -> small tight bullseye
    var N = 4, k = Math.floor(a.sample * N), sIn = a.sample * N - k;
    var ang = sIn * TAU, rr = baseR + k * step + ampR * (a.value1 || 0);
    a.x = cx + rr * Math.cos(ang); a.y = cy + rr * Math.sin(ang);
  }
  function spokeBurst(a, cx, cy, span, startAng, baseR, ampR, N) {  // dandelion / rosette fan
    var k = Math.floor(a.sample * N), sIn = a.sample * N - k;       // sIn = 0..1 along the spoke
    var ang = startAng + (k / N) * span;
    var rr = baseR * (0.12 + 0.88 * sIn) + ampR * (a.value1 || 0) * sIn;
    a.x = cx + rr * Math.cos(ang); a.y = cy + rr * Math.sin(ang);
  }
  function tether(a, ax, ay, bx, by, amp, ch) {        // jagged oscilloscope line A->B
    var s = a.sample, dx = bx - ax, dy = by - ay;
    var L = Math.sqrt(dx * dx + dy * dy) || 1, nx = -dy / L, ny = dx / L;
    var v = ch === 2 ? (a.value2 || 0) : (a.value1 || 0);
    a.x = ax + dx * s + nx * amp * v; a.y = ay + dy * s + ny * amp * v;
  }
  function combV(a, N, x0, x1, amp, ch) {              // N vertical waveform stalks across [x0,x1]
    var k = Math.floor(a.sample * N), sIn = a.sample * N - k;
    var v = ch === 2 ? (a.value2 || 0) : (a.value1 || 0);
    a.x = x0 + (x1 - x0) * ((k + 0.5) / N) + amp * v; a.y = sIn;
  }
  function combH(a, N, y0, y1, amp, ch) {              // N horizontal waveform stalks across [y0,y1]
    var k = Math.floor(a.sample * N), sIn = a.sample * N - k;
    var v = ch === 2 ? (a.value2 || 0) : (a.value1 || 0);
    a.y = y0 + (y1 - y0) * ((k + 0.5) / N) + amp * v; a.x = sIn;
  }
  // closed N-gon / {N/skip} star edge — wireframe net-star, ray mandala, mandala stack.
  // skip=1 convex polygon; skip>=2 crossing-chord spirograph. value1 = perpendicular edge jag.
  // samp overrides a.sample (for packing several polys into one wave). Returns frac along edge.
  function polyEdge(a, cx, cy, R, N, skip, spin, ampR, aspectX, samp) {
    var sm = samp === undefined ? a.sample : samp;
    var s = sm * N, e = Math.floor(s); if (e >= N) e = N - 1;
    var f = s - e;
    var i0 = (e * skip) % N, i1 = ((e + 1) * skip) % N;
    var a0 = spin + i0 / N * TAU, a1 = spin + i1 / N * TAU;
    var x0 = Math.cos(a0) * R, y0 = Math.sin(a0) * R, x1 = Math.cos(a1) * R, y1 = Math.sin(a1) * R;
    var vx = x0 + (x1 - x0) * f, vy = y0 + (y1 - y0) * f;
    var ex = x1 - x0, ey = y1 - y0, el = Math.sqrt(ex * ex + ey * ey) || 1;
    var disp = ampR * (a.value1 || 0);
    a.x = cx + (vx + (-ey / el) * disp) * (aspectX || 1);
    a.y = cy + (vy + (ex / el) * disp);
    return f;
  }
  // perspective concentric rings receding to a vanishing point -> corridor / mesh-net.
  // Returns raw depth 0..1 (0 near, 1 at VP) so the caller can fade near-bright / VP-dark.
  function meshAt(a, nRings, baseR, ampJit, depthFlow, spin, vpx, vpy, nearX, nearY) {
    var s = a.sample * nRings, k = Math.floor(s), f = s - k;
    var raw = ((k + 0.5) / nRings + depthFlow) % 1.0; if (raw < 0) raw += 1;
    var proj = 1 / (1 + 4.0 * raw);
    var ccx = (nearX - vpx) * proj + vpx, ccy = (nearY - vpy) * proj + vpy;
    var th = f * TAU + spin * 0.15, rr = (baseR + ampJit * (a.value1 || 0)) * proj;
    a.x = ccx + rr * Math.cos(th); a.y = ccy + rr * Math.sin(th);
    return raw;
  }
  // radial burst / urchin / anemone fur — full or half circle, radius driven by |value|.
  // eyeR = dark-pupil floor, spike = radial amplitude, twist = vortex shear, ch picks value1/2.
  function radialAt(a, cx, cy, eyeR, spike, spin, twist, half, ch) {
    var v = ch === 2 ? (a.value2 || 0) : (a.value1 || 0);
    var rr = eyeR + spike * Math.abs(v); if (rr < 0.02) rr = 0.02;
    var ang = a.sample * (half ? Math.PI : TAU) + spin + twist * (rr - eyeR);
    a.x = cx + rr * Math.cos(ang); a.y = cy + rr * Math.sin(ang);
  }
  function offscreen(a) { a.x = -2; a.y = -2; }

  // crisp nested-polygon mandala specs: 3 polys per wave slot {sides, skip, radius}.
  var MANDALA_SPECS = [
    [{ s: 12, k: 5, r: 0.34 }, { s: 7, k: 3, r: 0.32 }, { s: 9, k: 4, r: 0.33 }],
    [{ s: 5, k: 2, r: 0.30 }, { s: 16, k: 7, r: 0.35 }, { s: 10, k: 1, r: 0.28 }],
    [{ s: 8, k: 1, r: 0.24 }, { s: 6, k: 1, r: 0.20 }, { s: 6, k: 2, r: 0.18 }],
    [{ s: 5, k: 1, r: 0.14 }, { s: 4, k: 1, r: 0.10 }, { s: 8, k: 3, r: 0.22 }]
  ];

  // ONE reconfigurable wave = slot `slot` of the 4-emitter bank. point_eqs branches on the live
  // mode (a.q1) so the same 4 slots BE any motif, crossfading via a.q2 (emitterAlpha). Colors are
  // near-white intensity (cores bright); the comp does all muted recoloring by luminance + the
  // background wash, so the palette stays cohesive and can't blow neon. fade=0 hides a point
  // (additive black draws nothing) — used for mandala seams / mesh depth-fade.
  function emitterWave(slot) {
    return {
      baseVals: Object.assign({}, WAVE_BASE, {
        enabled: 1, samples: 512, additive: 1, usedots: 0, scaling: 1,
        smoothing: 0.16, thick: 1, a: 1, r: 1, g: 1, b: 1
      }),
      init_eqs: passthrough, frame_eqs: passthrough,
      point_eqs: function (a) {
        var mode = Math.round(a.q1 || 0);
        var alpha = a.q2 === undefined ? 1 : a.q2;
        var reach = a.q17 || 0.10;
        var dens = a.q29 === undefined ? 0.7 : a.q29;
        var t = a.q20 || 0;
        var bassA = a.q18 === undefined ? 1 : a.q18;
        var ax = a.q21 === undefined ? 0.30 : a.q21, ay = a.q22 === undefined ? 0.30 : a.q22;
        var bx = a.q23 === undefined ? 0.70 : a.q23, by = a.q24 === undefined ? 0.70 : a.q24;
        var mx = (ax + bx) * 0.5, my = (ay + by) * 0.5;
        var inten = 0.7, fade = 1, c, s2, thi, L, spin, sp;

        if (mode === 1) {                                       // ORBS + TETHER (signature)
          if (slot === 0) { ringAt(a, ax, ay, reach * 0.30, reach * 0.09); inten = 0.95; }
          else if (slot === 1) { ringAt(a, bx, by, reach * 0.30, reach * 0.09); inten = 0.95; }
          else if (slot === 2) { tether(a, ax, ay, bx, by, 0.22, 1); inten = 0.8; }
          else { tether(a, ax, ay, bx, by, 0.16, 2); inten = 0.55; }
        } else if (mode === 2) {                                // DANDELION burst + orbs on rim
          if (slot === 0) { spokeBurst(a, mx, my, a.q25 || TAU, 0, reach * 1.4, reach * 1.0, Math.round(28 + 56 * dens)); inten = 0.7; }
          else if (slot === 1) { ringAt(a, ax, ay, reach * 0.28, reach * 0.08); inten = 0.9; }
          else if (slot === 2) { ringAt(a, bx, by, reach * 0.28, reach * 0.08); inten = 0.9; }
          else { tether(a, ax, ay, bx, by, 0.14, 1); inten = 0.5; }
        } else if (mode === 3) {                                // NET cross-hatch (+inward zoom = corridor)
          if (slot === 0) { combV(a, 9, 0.06, 0.94, 0.05, 1); inten = 0.62; }
          else if (slot === 1) { combV(a, 9, 0.10, 0.90, 0.05, 2); inten = 0.62; }
          else if (slot === 2) { combH(a, 7, 0.10, 0.90, 0.05, 1); inten = 0.56; }
          else { combH(a, 7, 0.06, 0.94, 0.05, 2); inten = 0.56; }
        } else if (mode === 4) {                                // RINGS concentric bullseye orbs + tether
          if (slot === 0) { concentricAt(a, ax, ay, reach * 0.05, reach * 0.04, reach * 0.025); inten = 0.9; }
          else if (slot === 1) { concentricAt(a, bx, by, reach * 0.05, reach * 0.04, reach * 0.025); inten = 0.9; }
          else if (slot === 2) { tether(a, ax, ay, bx, by, 0.20, 1); inten = 0.8; }
          else { offscreen(a); inten = 0; }
        } else if (mode === 5) {                                // WIREFRAME NET-STAR (counter-rotating hexagram)
          spin = t * 1.25;
          if (slot === 0) { polyEdge(a, 0.5, 0.5, reach * 2.6, 3, 1, spin, reach * 0.9, 1.0); inten = 0.75; }
          else if (slot === 1) { polyEdge(a, 0.5, 0.5, reach * 2.6, 3, 1, spin + Math.PI / 3, reach * 0.9, 1.0); inten = 0.75; }
          else if (slot === 2) { ringAt(a, ax, ay, reach * 0.28, reach * 0.08); inten = 0.9; }
          else { ringAt(a, bx, by, reach * 0.28, reach * 0.08); inten = 0.9; }
        } else if (mode === 6) {                                // ANEMONE / SPINDLE URCHIN (furry iris)
          spin = 0.5 * t + 4 * (bassA - 1);
          var tw = a.q26 || 0;
          if (slot === 0) { radialAt(a, 0.5, 0.5, reach * 0.18, reach * 2.6, spin, tw, false, 1); inten = 0.9; }
          else if (slot === 1) { radialAt(a, 0.5, 0.5, reach * 0.18, reach * 2.6, spin + 0.07, tw, false, 2); inten = 0.7; }
          else if (slot === 2) { ringAt(a, 0.5, 0.5, reach * 0.18, reach * 0.01); inten = 0.4; }
          else { offscreen(a); inten = 0; }
        } else if (mode === 7) {                                // RAY BURST (rotating waveform asterisk)
          spin = t * (1.25 + 0.8 * (bassA - 1));
          if (slot < 3) {
            thi = spin + slot * (Math.PI / 3); L = reach * 3.0; c = Math.cos(thi); s2 = Math.sin(thi);
            tether(a, 0.5 - L * c, 0.5 - L * s2, 0.5 + L * c, 0.5 + L * s2, reach * 0.5, 1); inten = 0.7;
          } else { ringAt(a, 0.5, 0.5, reach * 0.35, reach * 0.10); inten = 0.95; }
        } else if (mode === 8) {                                // FOUNTAIN (outward radial pinwheel)
          if (slot === 0) { radialAt(a, 0.5, 0.5, reach * 0.3, reach * 1.2, t * 0.5, 0, false, 1); inten = 0.8; }
          else if (slot === 1) { radialAt(a, 0.5, 0.5, reach * 0.3, reach * 1.2, t * 0.535, 0, false, 2); inten = 0.7; }
          else if (slot === 2) { ringAt(a, 0.5, 0.5, reach * 0.05, reach * 0.02); inten = 1.0; }
          else { offscreen(a); inten = 0; }
        } else if (mode === 9) {                                // RIBBON (drifting waveform streak)
          if (slot === 0) { tether(a, 0.12, 0.88, 0.88, 0.12, 0.06, 1); inten = 0.8; }
          else if (slot === 1) { tether(a, 0.10, 0.90, 0.90, 0.10, 0.05, 2); inten = 0.6; }
          else { offscreen(a); inten = 0; }
        } else if (mode === 10) {                               // MANDALA STACK (crisp nested n-gon, clear-warp)
          var specs = MANDALA_SPECS[slot];
          var gi = a.sample * 3, pi = Math.floor(gi); if (pi > 2) pi = 2;
          var local = gi - pi;
          sp = specs[pi];
          var dir = pi % 2 === 0 ? 1 : -1;
          polyEdge(a, 0.5, 0.5, sp.r * (0.06 + 0.62 * dens), sp.s, sp.k, t * 0.5 * dir, reach * 0.4, 1.7, local);
          fade = (local < 0.02 || local > 0.98) ? 0 : 1;        // blank the connector seams
          inten = 0.72;
        } else if (mode === 11) {                               // CORRIDOR MESH (perspective rings -> VP)
          var df = (t * 0.05) % 1;
          if (slot === 0) { fade = 1 - meshAt(a, 6, 0.4, 0.06, df, t, 0.90, 0.50, 0.16, 0.50); inten = 0.7; }
          else if (slot === 1) { fade = 1 - meshAt(a, 6, 0.55, 0.06, (df + 0.5) % 1, t, 0.90, 0.50, 0.22, 0.50); inten = 0.6; }
          else if (slot === 2) { tether(a, ax, ay, 0.86, 0.58, 0.06, 1); inten = 0.8; }
          else { offscreen(a); inten = 0; }
        } else {                                                // mode 0 = FLOWER (rosette + bar + lobes; fold8 = mandala)
          if (slot === 0) { spokeBurst(a, 0.5, 0.5, TAU, t * 0.05, reach * 1.3, reach * 0.9, Math.round(16 + 16 * dens)); inten = 0.72; }
          else if (slot === 1) { a.x = 0.15 + 0.70 * a.sample; a.y = 0.5 + 0.045 * (a.value2 || 0); inten = 0.8; }
          else if (slot === 2) { ringAt(a, 0.32, 0.5, reach * 0.45, reach * 0.12); inten = 0.65; }
          else { ringAt(a, 0.68, 0.5, reach * 0.45, reach * 0.12); inten = 0.65; }
        }

        var v2 = inten * alpha * fade;
        a.r = v2; a.g = v2; a.b = v2;
        return a;
      }
    };
  }

  // ── the macro-director: continuous, non-periodic wander over the knobs ──────────
  // Mechanism profiles pair an emitter MODE with the camera+fold that makes it read as a named
  // WMP look. zoom convention: + = inward/tunnel, - = outward/explode. bg = 0 fluid,1 marble,
  // 2 horizon-bands,3 flat-blue. ~19 mechanisms cover all 12 modes + variations (vortex, bowtie,
  // bullseye, corridor, X-tunnel, mandala) so the FULL vocabulary is reachable.
  var MECHS = [
    { m: 1,  fold: 1, zoom: -0.004, rot: 0,     swirl: 0,    dx: 0.0015, dy: -0.0015, decay: 0.93,  exp: 1.0,  dens: 0.6,  px: 0.5,  py: 0.5,  bg: 0 }, // 0 orbs free (signature)
    { m: 2,  fold: 2, zoom: -0.003, rot: 0,     swirl: 0,    dx: 0,      dy: 0.004,   decay: 0.94,  exp: 1.1,  dens: 0.8,  px: 0.5,  py: 0.5,  bg: 0 }, // 1 dandelion
    { m: 0,  fold: 4, zoom: -0.015, rot: -0.03, swirl: 0.03, dx: 0,      dy: 0,       decay: 0.955, exp: 1.15, dens: 0.9,  px: 0.5,  py: 0.5,  bg: 2 }, // 2 flower bowtie (X explode)
    { m: 0,  fold: 8, zoom: 0.006,  rot: 0.010, swirl: 0.02, dx: 0,      dy: 0,       decay: 0.96,  exp: 1.1,  dens: 0.85, px: 0.5,  py: 0.5,  bg: 1 }, // 3 flower mandala (8-fold)
    { m: 0,  fold: 4, zoom: 0.030,  rot: 0,     swirl: 0.01, dx: 0,      dy: 0,       decay: 0.955, exp: 1.0,  dens: 0.7,  px: 0.5,  py: 0.5,  bg: 1 }, // 4 bullseye flower (inward)
    { m: 4,  fold: 1, zoom: 0,      rot: 0,     swirl: 0,    dx: 0,      dy: 0,       decay: 0.92,  exp: 1.0,  dens: 0.6,  px: 0.5,  py: 0.5,  bg: 0 }, // 5 rings free
    { m: 4,  fold: 4, zoom: 0.025,  rot: 0,     swirl: 0.01, dx: 0,      dy: 0,       decay: 0.95,  exp: 1.0,  dens: 0.65, px: 0.5,  py: 0.5,  bg: 1 }, // 6 quad bullseye
    { m: 3,  fold: 1, zoom: 0.028,  rot: 0,     swirl: 0,    dx: 0,      dy: 0,       decay: 0.95,  exp: 1.05, dens: 0.8,  px: 0.5,  py: 0.5,  bg: 2 }, // 7 NET corridor (inward)
    { m: 3,  fold: 4, zoom: 0.020,  rot: 0.010, swirl: 0,    dx: 0,      dy: 0,       decay: 0.95,  exp: 1.1,  dens: 0.85, px: 0.86, py: 0.62, bg: 2 }, // 8 NET X-tunnel
    { m: 5,  fold: 1, zoom: 0.006,  rot: 0,     swirl: 0,    dx: 0,      dy: 0,       decay: 0.93,  exp: 1.0,  dens: 0.6,  px: 0.5,  py: 0.5,  bg: 1 }, // 9 wireframe net-star
    { m: 6,  fold: 1, zoom: 0,      rot: 0,     swirl: 0,    dx: 0,      dy: 0,       decay: 0.70,  exp: 1.0,  dens: 0.55, px: 0.5,  py: 0.5,  bg: 0 }, // 10 anemone/spindle
    { m: 7,  fold: 6, zoom: 0.006,  rot: 0,     swirl: 0,    dx: 0,      dy: 0,       decay: 0.93,  exp: 1.1,  dens: 0.5,  px: 0.5,  py: 0.5,  bg: 1 }, // 11 ray burst -> 6-fold mandala
    { m: 8,  fold: 1, zoom: -0.016, rot: 0,     swirl: 0.04, dx: 0,      dy: 0,       decay: 0.97,  exp: 1.1,  dens: 0.7,  px: 0.5,  py: 0.5,  bg: 0 }, // 12 fountain (outward)
    { m: 9,  fold: 1, zoom: 0,      rot: 0,     swirl: 0,    dx: -0.004, dy: 0.004,   decay: 0.955, exp: 1.0,  dens: 0.4,  px: 0.5,  py: 0.5,  bg: 0 }, // 13 ribbon
    { m: 10, fold: 1, zoom: 0,      rot: 0,     swirl: 0,    dx: 0,      dy: 0,       decay: 0.30,  exp: 1.1,  dens: 0.85, px: 0.5,  py: 0.5,  bg: 3 }, // 14 mandala stack (clear-warp)
    { m: 11, fold: 1, zoom: 0.010,  rot: 0,     swirl: 0,    dx: 0,      dy: 0,       decay: 0.42,  exp: 1.0,  dens: 0.7,  px: 0.86, py: 0.62, bg: 2 }, // 15 corridor mesh
    { m: 1,  fold: 2, zoom: 0.005,  rot: 0,     swirl: 0.02, dx: 0,      dy: 0,       decay: 0.95,  exp: 1.05, dens: 0.6,  px: 0.5,  py: 0.5,  bg: 0 }, // 16 orbs folded (bilateral)
    { m: 2,  fold: 4, zoom: 0.020,  rot: 0,     swirl: 0.05, dx: 0,      dy: 0,       decay: 0.96,  exp: 1.1,  dens: 0.9,  px: 0.5,  py: 0.5,  bg: 1 }, // 17 dandelion mandala (vortex-wind)
    { m: 6,  fold: 1, zoom: 0.020,  rot: 0.020, swirl: 0.09, dx: 0,      dy: 0,       decay: 0.965, exp: 1.0,  dens: 0.55, px: 0.45, py: 0.40, bg: 0 }  // 18 vortex urchin
  ];
  // weighted pick list (all modes reachable; signature/mandala/anemone common, set-pieces rarer)
  var PICK = [0, 0, 1, 1, 2, 3, 3, 4, 5, 6, 7, 7, 8, 9, 10, 10, 11, 12, 12, 13, 14, 15, 16, 17, 18];

  function makeDirector() {
    var cur = { zoom: -0.004, rot: 0, swirl: 0, dx: 0, dy: 0, decay: 0.93, exp: 1.0,
                dens: 0.6, fold: 1, foldStr: 0, px: 0.5, py: 0.5, pal: 0.42, mode: 1, bg: 0 };
    var tgt = Object.assign({}, cur);
    var alpha = 1, pendMode = cur.mode;
    var sceneStart = 0, dwell = 8, ease = 0.5, lastTime = 0, lastPick = 0;
    var palHome = [0.34, 0.42, 0.50];                  // green / teal / cyan "home" the field returns to

    function rollDwell() {
      var r = Math.random();
      if (r < 0.6) return 5 + Math.random() * 4;       // typical 5-9s
      if (r < 0.8) return 3 + Math.random() * 1.5;     // short
      return 14 + Math.random() * 6;                   // long set-piece
    }
    function jit(v, f) { return v * (1 + (Math.random() * 2 - 1) * f) + (Math.random() * 2 - 1) * f * 0.004; }

    function pickScene(time) {
      var idx; do { idx = PICK[Math.floor(Math.random() * PICK.length)]; } while (idx === lastPick);
      lastPick = idx;
      var M = MECHS[idx];
      tgt.zoom = jit(M.zoom, 0.18); tgt.rot = jit(M.rot, 0.15); tgt.swirl = clamp(jit(M.swirl, 0.2), 0, 0.13);
      tgt.dx = jit(M.dx, 0.2); tgt.dy = jit(M.dy, 0.2); tgt.decay = clamp(M.decay, 0.28, 0.975);
      tgt.exp = M.exp; tgt.dens = clamp(jit(M.dens, 0.12), 0.3, 1); tgt.fold = M.fold;
      tgt.foldStr = M.fold > 1.5 ? 1 : 0; tgt.px = M.px; tgt.py = M.py;
      pendMode = M.m; cur.bg = M.bg;                   // bg snaps (feedback covers the change)
      // palette: change family; bias ~1-in-4 back to green/teal home, else a CONTRASTING jump.
      if (Math.random() < 0.25) tgt.pal = palHome[Math.floor(Math.random() * palHome.length)] + (Math.random() * 0.1 - 0.05);
      else { var p; do { p = Math.random(); } while (Math.abs(p - cur.pal) < 0.18 && Math.abs(p - cur.pal) > 0.82); tgt.pal = p; }
      var snap = Math.random() < 0.25 || (tgt.fold !== cur.fold && Math.random() < 0.5);
      ease = snap ? (1 / 0.5) : (1 / 2.0);
      sceneStart = time; dwell = rollDwell();
    }

    return function (t) {
      var time = t.time || 0;
      var dt = clamp(time - lastTime, 0, 0.1); lastTime = time;
      if (sceneStart === 0) sceneStart = time;
      if (time - sceneStart >= dwell) pickScene(time);

      var k = clamp(dt * ease, 0, 1);
      cur.zoom += (tgt.zoom - cur.zoom) * k; cur.rot += (tgt.rot - cur.rot) * k;
      cur.swirl += (tgt.swirl - cur.swirl) * k; cur.dx += (tgt.dx - cur.dx) * k;
      cur.dy += (tgt.dy - cur.dy) * k; cur.decay += (tgt.decay - cur.decay) * k;
      cur.exp += (tgt.exp - cur.exp) * k; cur.dens += (tgt.dens - cur.dens) * k;
      cur.foldStr += (tgt.foldStr - cur.foldStr) * clamp(dt / 1.5, 0, 1); cur.fold = tgt.fold;
      cur.px += (tgt.px - cur.px) * k; cur.py += (tgt.py - cur.py) * k;
      cur.pal += (tgt.pal - cur.pal) * clamp(dt * 0.4, 0, 1) + dt * 0.02;   // ease + slow creep

      if (cur.mode !== pendMode) { alpha -= dt * 4.0; if (alpha <= 0.04) { alpha = 0.04; cur.mode = pendMode; } }
      else if (alpha < 1) { alpha = Math.min(1, alpha + dt * 2.5); }

      var bass = t.bass || 1, bassA = t.bass_att !== undefined ? t.bass_att : bass;
      var treb = t.treb !== undefined ? t.treb : 1;

      t.q1 = cur.mode; t.q2 = alpha; t.q3 = cur.foldStr; t.q4 = cur.fold;
      t.q5 = cur.zoom + 0.004 * (bassA - 1); t.q6 = cur.rot;
      t.q7 = cur.swirl + (cur.swirl > 0.005 ? 0.03 * (bassA - 1) : 0);
      t.q8 = cur.dx; t.q9 = cur.dy; t.q10 = cur.decay;
      t.q11 = cur.pal; t.q12 = cur.exp * (1 + 0.25 * (bassA - 1));
      t.q13 = bass; t.q14 = alcEnergy(t); t.q15 = 1.0; t.q16 = clamp(0.5 * (bassA - 1) + 0.5, 0, 1);
      t.q17 = (0.10 + 0.07 * (bassA - 1)) * (0.7 + 0.6 * cur.dens);
      t.q18 = bassA; t.q19 = treb; t.q20 = time;
      var th = time * 0.18;
      t.q21 = 0.5 + 0.22 * Math.cos(th); t.q22 = 0.5 + 0.22 * Math.sin(th * 0.83);
      t.q23 = 0.5 + 0.22 * Math.cos(th + Math.PI); t.q24 = 0.5 + 0.22 * Math.sin(th * 0.83 + Math.PI);
      t.q25 = TAU; t.q26 = cur.swirl > 0.03 ? 0.6 * (bassA - 1) : 0;
      t.q27 = cur.px; t.q28 = cur.py; t.q29 = cur.dens; t.q30 = cur.bg;
      return t;
    };
  }

  // ── WARP: feedback transform (fold + camera + 5-tap blur + decay) ───────────────
  // New feedback buffer = previous frame, kaleidoscope-folded then moved by the camera
  // (zoom/rot/swirl/translate about a pivot), lightly blurred (-> trails soften into a glowing
  // FILL, not thin wires) and faded by decay. This is the source of ALL flowing structure: the
  // emitters drawn after warp smear into filaments and the fold multiplies them into n-fold
  // symmetry -> a dense field. GLSL reserved-name rule: no locals named ang/rad/ret/uv/q*.
  var WARP_V4 =
    ALC_KALEIDO_GLSL +
    "shader_body {\n" +
    "  float asp = resolution.x / resolution.y;\n" +
    "  vec2 piv = vec2(q27, q28);\n" +
    "  vec2 pd = uv - piv; pd.x *= asp;\n" +
    "  vec2 fbil = vec2(abs(pd.x), pd.y);\n" +                     // fold 2 = bilateral mirror
    "  vec2 fquad = abs(pd);\n" +                                  // fold 4 = quad X-bowtie
    "  vec2 fmand = alcKaleido(pd, max(q4, 2.0));\n" +             // fold >=6 = radial mandala
    "  vec2 pdf = pd;\n" +
    "  pdf = mix(pdf, fbil,  step(1.5, q4) * step(q4, 2.5));\n" +
    "  pdf = mix(pdf, fquad, step(3.5, q4) * step(q4, 4.5));\n" +
    "  pdf = mix(pdf, fmand, step(5.5, q4));\n" +
    "  pd = mix(pd, pdf, q3);\n" +
    "  float pr = length(pd);\n" +
    "  float pang = q6 + q7 * pr;\n" +
    "  float cs = cos(pang), sn = sin(pang);\n" +
    "  pd = mat2(cs, -sn, sn, cs) * pd;\n" +
    "  pd *= (1.0 + q5);\n" +
    "  pd.x /= asp;\n" +
    "  vec2 suv = piv + pd + vec2(q8, q9);\n" +
    "  vec2 wp = 1.0 / resolution; float br = 1.4;\n" +
    "  vec3 acc = texture2D(sampler_main, suv).rgb * 0.5;\n" +
    "  acc += texture2D(sampler_main, suv + vec2(wp.x * br, 0.0)).rgb * 0.125;\n" +
    "  acc += texture2D(sampler_main, suv - vec2(wp.x * br, 0.0)).rgb * 0.125;\n" +
    "  acc += texture2D(sampler_main, suv + vec2(0.0, wp.y * br)).rgb * 0.125;\n" +
    "  acc += texture2D(sampler_main, suv - vec2(0.0, wp.y * br)).rgb * 0.125;\n" +
    "  ret = acc * q10;\n" +
    "}\n";

  // ── COMP: 4 muted background washes (q30) + recolor the field + bloom + Reinhard tone-map ──
  // The frame is NEVER black: a colored, drifting ground wash is always present (fixes v1/v2's
  // hollow look), with the feedback field's bright lines glowing on top in the complementary
  // element hue. Reinhard tone-map keeps additive cores SOFT (the Alchemy muted rule).
  var COMP_V4 =
    NOISE_GLSL + PAL_GLSL +
    "vec3 dusty(vec3 c, float s){ float l = dot(c, vec3(0.333)); return mix(vec3(l), c, s); }\n" +
    "shader_body {\n" +
    "  float asp = resolution.x / resolution.y;\n" +
    "  vec2 pdc = uv - 0.5; pdc.x *= asp;\n" +
    "  vec3 sharp = texture2D(sampler_main, uv).rgb;\n" +
    "  float lum = max(sharp.r, max(sharp.g, sharp.b));\n" +
    "  vec2 px = 1.0 / resolution;\n" +
    "  vec3 bloom = vec3(0.0);\n" +
    "  for (int i = 0; i < 8; i++) {\n" +
    "    float ba = float(i) / 8.0 * 6.2832; vec2 bd = vec2(cos(ba), sin(ba));\n" +
    "    bloom += max(texture2D(sampler_main, uv + bd * 3.0 * px).rgb - 0.15, 0.0);\n" +
    "    bloom += max(texture2D(sampler_main, uv + bd * 7.0 * px).rgb - 0.15, 0.0);\n" +
    "  }\n" +
    "  float bl = (bloom.r + bloom.g + bloom.b) * 0.05;\n" +
    "  vec3 fg = dusty(pal(q11), 0.78);\n" +                       // element hue
    "  vec3 bg = dusty(pal(q11 + 0.5), 0.55);\n" +                 // complementary ground hue
    "  vec3 warm = dusty(pal(q11 + 0.08), 0.82);\n" +
    "  fg = mix(fg, warm, q16 * 0.4);\n" +                         // shift warmer when loud
    // background wash (q30): 0 fbm-fluid, 1 marble-veins, 2 horizon-bands, 3 flat-blue
    "  vec3 gtone = dusty(pal(q11 + 0.5), 0.5);\n" +              // base complementary ground tone
    "  vec3 ground;\n" +
    "  if (q30 < 0.5) {\n" +
    "    vec2 fq = vec2(fbm(pdc * 1.7 + vec2(time * 0.04, -time * 0.03)), fbm(pdc * 1.7 + vec2(5.2, 1.3) - time * 0.035));\n" +
    "    float fn = fbm(pdc * 1.5 + fq * 1.4);\n" +
    "    ground = dusty(pal(q11 + 0.5 + 0.12 * fn), 0.5) * (0.20 + 0.20 * fn);\n" +
    "  } else if (q30 < 1.5) {\n" +
    "    vec2 mq = pdc * 2.2 + vec2(fbm(pdc * 1.4 + time * 0.04), fbm(pdc * 1.4 + 5.0 - time * 0.03));\n" +
    "    float mf = fbm(mq * 3.0 + time * 0.05);\n" +
    "    float vein = smoothstep(0.10, 0.0, abs(fract(mf * 4.0) - 0.5) - 0.06);\n" +
    "    ground = gtone * 0.18 + dusty(pal(q11 + 0.30), 0.62) * vein * (0.18 + 0.14 * q13);\n" +
    "  } else if (q30 < 2.5) {\n" +
    "    float band = pdc.y * 6.0 + time * 0.12;\n" +
    "    float bandFade = smoothstep(0.0, 0.5, abs(pdc.y));\n" +
    "    ground = mix(gtone, dusty(pal(q11), 0.5), 0.5 + 0.5 * sin(band)) * (0.26 - 0.14 * bandFade);\n" +
    "  } else {\n" +
    "    ground = vec3(0.10, 0.15, 0.24);\n" +
    "  }\n" +
    "  float depth = mix(0.52, 1.0, smoothstep(1.35, 0.1, length(pdc)));\n" +  // jewel-dark edges (never black)
    "  ground = ground * depth * q15 + gtone * 0.05;\n" +                      // constant colored floor
    // BOUNDED line colour: presence-gated (not lum-multiplied) so dense convergence stays a
    // bright COLOURED core, never an unbounded white blob (the Alchemy muted rule).
    "  float pres = smoothstep(0.03, 0.5, lum);\n" +
    "  float hot = smoothstep(0.7, 1.7, lum);\n" +
    "  vec3 lineCol = mix(fg * 1.15, mix(fg, vec3(1.0), 0.4), hot);\n" +
    "  vec3 col = ground + lineCol * pres + fg * bl;\n" +
    "  col *= q12;\n" +
    "  ret = col / (col + vec3(0.64));\n" +
    "}\n";

  P["Alchemy V4: Random"] = (function () {
    var preset = build(
      {
        wave_a: 0, additivewave: 1, decay: 0.95,    // (decay baseVal inert in this build; real fade in WARP_V4)
        zoom: 1, rot: 0, warp: 0, dx: 0, dy: 0, cx: 0.5, cy: 0.5,
        gammaadj: 1.6, darken_center: 0, wrap: 0, echo_alpha: 0
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
