/* Alchemy V4 — a ground-up rebuild of WMP "Alchemy: Random".
 *
 * Plain <script> loaded AFTER presets/kit.js; registers into window.WMP_PRESETS.
 * Uses kit globals: build, WAVE_BASE, ALC_KALEIDO_GLSL, PAL_GLSL, NOISE_GLSL,
 *   ALC_AURORA_GLSL, ALC_FLUID_GLSL, ALC_MARBLE_GLSL, ALC_RADIALBLOOM_GLSL,
 *   ALC_HORIZONBANDS_GLSL, ALC_MOIRE_GLSL, alcEnergy, passthrough.
 *
 * WHY: the real Alchemy is ONE continuous FEEDBACK FIELD — live-waveform emitters injected
 * into a warp/decay loop and KALEIDOSCOPICALLY mirrored, over VIBRANT MULTI-COLOUR-FUSION
 * backgrounds, with a dynamic camera, morphing look every few seconds. "Dance of the Freaky
 * Circles" generalized into a self-driving engine.
 *
 * Director = a strict SHUFFLE BAG: every motif AND every background plays once before any
 * repeats (no "same thing again and again"). 12 emitter modes (full WMP vocabulary) × cameras
 * (face/floor/tunnel/vortex/orbit) × 8 background fields × multi-hue palette.
 *
 * q-var map (frame_eqs -> shaders + wave point_eqs; one meaning each):
 *   q1 mode  q2 alpha  q3 foldStr  q4 foldN  q5 zoom  q6 rot  q7 swirl  q8 dx  q9 dy  q10 decay
 *   q11 palettePhase  q12 exposure  q13 bass  q14 energy  q15 fgSpread  q16 warmMix
 *   q17 reach  q18 bass_att  q19 treb  q20 time  q21..q24 orb A/B  q25 span  q26 vortexTwist
 *   q27 pivotX  q28 pivotY  q29 density  q30 bgVariant  q31 camTilt  q32 orbVis
 */
(function () {
  "use strict";
  var P = (window.WMP_PRESETS = window.WMP_PRESETS || {});

  var TAU = 6.28318530718;
  function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }

  // ── emitter geometry helpers (set a.x/a.y in 0..1 wave space; displacement = live waveform) ──
  function spokeBurst(a, cx, cy, span, startAng, baseR, ampR, N) {  // dandelion / rosette fan
    var k = Math.floor(a.sample * N), sIn = a.sample * N - k;
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
  function combV(a, N, x0, x1, amp, ch) {
    var k = Math.floor(a.sample * N), sIn = a.sample * N - k;
    var v = ch === 2 ? (a.value2 || 0) : (a.value1 || 0);
    a.x = x0 + (x1 - x0) * ((k + 0.5) / N) + amp * v; a.y = sIn;
  }
  function combH(a, N, y0, y1, amp, ch) {
    var k = Math.floor(a.sample * N), sIn = a.sample * N - k;
    var v = ch === 2 ? (a.value2 || 0) : (a.value1 || 0);
    a.y = y0 + (y1 - y0) * ((k + 0.5) / N) + amp * v; a.x = sIn;
  }
  function polyEdge(a, cx, cy, R, N, skip, spin, ampR, aspectX, samp) {  // n-gon / star edge
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
  function meshAt(a, nRings, baseR, ampJit, depthFlow, spin, vpx, vpy, nearX, nearY) {  // perspective rings -> VP
    var s = a.sample * nRings, k = Math.floor(s), f = s - k;
    var raw = ((k + 0.5) / nRings + depthFlow) % 1.0; if (raw < 0) raw += 1;
    var proj = 1 / (1 + 4.0 * raw);
    var ccx = (nearX - vpx) * proj + vpx, ccy = (nearY - vpy) * proj + vpy;
    var th = f * TAU + spin * 0.15, rr = (baseR + ampJit * (a.value1 || 0)) * proj;
    a.x = ccx + rr * Math.cos(th); a.y = ccy + rr * Math.sin(th);
    return raw;
  }
  function radialAt(a, cx, cy, eyeR, spike, spin, twist, half, ch) {  // urchin / anemone fur
    var v = ch === 2 ? (a.value2 || 0) : (a.value1 || 0);
    var rr = eyeR + spike * Math.abs(v); if (rr < 0.02) rr = 0.02;
    var ang = a.sample * (half ? Math.PI : TAU) + spin + twist * (rr - eyeR);
    a.x = cx + rr * Math.cos(ang); a.y = cy + rr * Math.sin(ang);
  }
  function offscreen(a) { a.x = -2; a.y = -2; }

  // nested-polygon mandala: 3 polys per slot {sides, skip, radius}. skip kept <=2 (no scribble).
  var MANDALA_SPECS = [
    [{ s: 12, k: 1, r: 0.34 }, { s: 7, k: 2, r: 0.30 }, { s: 9, k: 1, r: 0.26 }],
    [{ s: 5, k: 2, r: 0.32 }, { s: 6, k: 1, r: 0.22 }, { s: 10, k: 1, r: 0.28 }],
    [{ s: 8, k: 1, r: 0.24 }, { s: 6, k: 1, r: 0.18 }, { s: 4, k: 1, r: 0.14 }],
    [{ s: 5, k: 1, r: 0.12 }, { s: 3, k: 1, r: 0.10 }, { s: 8, k: 2, r: 0.20 }]
  ];

  // ONE reconfigurable wave = slot `slot` of the 4-emitter bank. point_eqs branches on a.q1 (mode).
  // Orbs are drawn as filled discs in the COMP (clean, no feedback coil) — the wave slots draw the
  // tether/filament/structure only. Colours are near-white intensity; the comp recolours by hue.
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
        var reach = a.q17 || 0.16;
        var dens = a.q29 === undefined ? 0.7 : a.q29;
        var t = a.q20 || 0;
        var bassA = a.q18 === undefined ? 1 : a.q18;
        var ax = a.q21 === undefined ? 0.30 : a.q21, ay = a.q22 === undefined ? 0.30 : a.q22;
        var bx = a.q23 === undefined ? 0.70 : a.q23, by = a.q24 === undefined ? 0.70 : a.q24;
        var mx = (ax + bx) * 0.5, my = (ay + by) * 0.5;
        var inten = 0.7, fade = 1, c, s2, thi, L, spin, sp;

        if (mode === 1) {                                       // ORBS + TETHER (orbs drawn in comp)
          if (slot === 0) { tether(a, ax, ay, bx, by, 0.22, 1); inten = 0.85; }
          else if (slot === 1) { tether(a, ax, ay, bx, by, 0.16, 2); inten = 0.6; }
          else { offscreen(a); inten = 0; }
        } else if (mode === 2) {                                // DANDELION burst (+ comp orbs on rim)
          if (slot === 0) { spokeBurst(a, mx, my, a.q25 || TAU, 0, reach * 1.5, reach * 1.1, Math.round(40 + 60 * dens)); inten = 0.72; }
          else if (slot === 1) { spokeBurst(a, mx, my, a.q25 || TAU, 0.05, reach * 1.2, reach * 0.9, Math.round(40 + 60 * dens)); inten = 0.5; }
          else if (slot === 2) { tether(a, ax, ay, bx, by, 0.14, 1); inten = 0.5; }
          else { offscreen(a); inten = 0; }
        } else if (mode === 3) {                                // NET cross-hatch (+inward zoom = corridor)
          if (slot === 0) { combV(a, 9, 0.06, 0.94, 0.05, 1); inten = 0.62; }
          else if (slot === 1) { combV(a, 9, 0.10, 0.90, 0.05, 2); inten = 0.62; }
          else if (slot === 2) { combH(a, 7, 0.10, 0.90, 0.05, 1); inten = 0.56; }
          else { combH(a, 7, 0.06, 0.94, 0.05, 2); inten = 0.56; }
        } else if (mode === 4) {                                // RINGS = bullseye comp-orbs + tether
          if (slot === 0) { tether(a, ax, ay, bx, by, 0.20, 1); inten = 0.8; }
          else { offscreen(a); inten = 0; }
        } else if (mode === 5) {                                // WIREFRAME NET-STAR (hexagram)
          spin = t * 1.0;
          if (slot === 0) { polyEdge(a, 0.5, 0.5, reach * 2.4, 3, 1, spin, reach * 0.8, 1.0); inten = 0.75; }
          else if (slot === 1) { polyEdge(a, 0.5, 0.5, reach * 2.4, 3, 1, spin + Math.PI / 3, reach * 0.8, 1.0); inten = 0.75; }
          else if (slot === 2) { polyEdge(a, 0.5, 0.5, reach * 1.6, 6, 1, -spin * 0.6, reach * 0.6, 1.0); inten = 0.6; }
          else { offscreen(a); inten = 0; }
        } else if (mode === 6) {                                // ANEMONE / URCHIN (furry iris)
          spin = 0.5 * t + 4 * (bassA - 1);
          var tw = a.q26 || 0;
          if (slot === 0) { radialAt(a, 0.5, 0.5, reach * 0.20, reach * 2.8, spin, tw, false, 1); inten = 0.85; }
          else if (slot === 1) { radialAt(a, 0.5, 0.5, reach * 0.20, reach * 2.8, spin + 0.07, tw, false, 2); inten = 0.7; }
          else if (slot === 2) { radialAt(a, 0.5, 0.5, reach * 0.20, reach * 2.0, spin + 0.14, tw, false, 1); inten = 0.5; }
          else { offscreen(a); inten = 0; }
        } else if (mode === 7) {                                // RAY BURST (rotating waveform asterisk)
          spin = t * (1.0 + 0.6 * (bassA - 1));
          if (slot < 4) {
            thi = spin + slot * (Math.PI / 4); L = reach * 3.2; c = Math.cos(thi); s2 = Math.sin(thi);
            tether(a, 0.5 - L * c, 0.5 - L * s2, 0.5 + L * c, 0.5 + L * s2, reach * 0.45, slot % 2 === 0 ? 1 : 2); inten = 0.7;
          }
        } else if (mode === 8) {                                // FOUNTAIN (outward radial pinwheel)
          if (slot === 0) { radialAt(a, 0.5, 0.5, reach * 0.3, reach * 1.4, t * 0.5, 0, false, 1); inten = 0.8; }
          else if (slot === 1) { radialAt(a, 0.5, 0.5, reach * 0.3, reach * 1.4, t * 0.535, 0, false, 2); inten = 0.7; }
          else if (slot === 2) { radialAt(a, 0.5, 0.5, reach * 0.3, reach * 1.1, t * 0.57, 0, false, 1); inten = 0.5; }
          else { offscreen(a); inten = 0; }
        } else if (mode === 9) {                                // RIBBON (drifting waveform streak)
          if (slot === 0) { tether(a, 0.12, 0.84, 0.88, 0.16, 0.07, 1); inten = 0.8; }
          else if (slot === 1) { tether(a, 0.10, 0.90, 0.90, 0.10, 0.05, 2); inten = 0.6; }
          else if (slot === 2) { tether(a, 0.14, 0.78, 0.86, 0.22, 0.05, 1); inten = 0.45; }
          else { offscreen(a); inten = 0; }
        } else if (mode === 10) {                               // MANDALA STACK (crisp nested n-gon)
          var specs = MANDALA_SPECS[slot];
          var gi = a.sample * 3, pi = Math.floor(gi); if (pi > 2) pi = 2;
          var local = gi - pi;
          sp = specs[pi];
          var dir = pi % 2 === 0 ? 1 : -1;
          polyEdge(a, 0.5, 0.5, sp.r * (0.5 + 0.5 * dens), sp.s, sp.k, t * 0.4 * dir, reach * 0.3, 1.0, local);
          fade = (local < 0.02 || local > 0.98) ? 0 : 1;
          inten = 0.72;
        } else if (mode === 11) {                               // CORRIDOR MESH (perspective rings -> VP)
          var df = (t * 0.05) % 1;
          if (slot === 0) { fade = 1 - meshAt(a, 7, 0.42, 0.06, df, t, 0.90, 0.50, 0.16, 0.50); inten = 0.72; }
          else if (slot === 1) { fade = 1 - meshAt(a, 7, 0.56, 0.06, (df + 0.5) % 1, t, 0.90, 0.50, 0.22, 0.50); inten = 0.6; }
          else if (slot === 2) { tether(a, ax, ay, 0.86, 0.58, 0.06, 1); inten = 0.7; }
          else { offscreen(a); inten = 0; }
        } else {                                                // mode 0 = FLOWER (big rosette + bar; fold8 = mandala)
          if (slot === 0) { spokeBurst(a, 0.5, 0.5, TAU, t * 0.05, reach * 1.6, reach * 1.1, Math.round(22 + 22 * dens)); inten = 0.72; }
          else if (slot === 1) { spokeBurst(a, 0.5, 0.5, TAU, t * 0.05 + 0.08, reach * 1.2, reach * 0.85, Math.round(22 + 22 * dens)); inten = 0.5; }
          else if (slot === 2) { a.x = 0.12 + 0.76 * a.sample; a.y = 0.5 + 0.05 * (a.value2 || 0); inten = 0.7; }
          else { var th2 = a.sample * TAU; a.x = 0.5 + (a.value1 || 0) * 0.06; a.y = 0.5 + (a.value2 || 0) * 0.06; a.x = 0.5 + reach * 0.4 * Math.cos(th2); a.y = 0.5 + reach * 0.4 * Math.sin(th2); inten = 0.4; }
        }

        var v2 = inten * alpha * fade;
        a.r = v2; a.g = v2; a.b = v2;
        return a;
      }
    };
  }

  // ── the macro-director: a SHUFFLE BAG (every mechanism + every background once before repeat) ──
  // Each mechanism = {motif mode, fold, camera, bg, palette bias, motion}. cam kinds add real
  // 3D-ish camera variety: face / floor (perspective recede) / tunnel (dive) / vortex / orbit (pan).
  var MECHS = [
    { m: 1,  fold: 1, cam: 'orbit',  zoom: -0.003, rot: 0,     swirl: 0,    decay: 0.90, exp: 1.0,  dens: 0.6,  px: 0.5,  py: 0.5,  pal: 0.50 },
    { m: 2,  fold: 2, cam: 'face',   zoom: -0.003, rot: 0,     swirl: 0,    decay: 0.94, exp: 1.1,  dens: 0.85, px: 0.5,  py: 0.5,  pal: 0.33 },
    { m: 0,  fold: 4, cam: 'vortex', zoom: -0.012, rot: -0.03, swirl: 0.03, decay: 0.955,exp: 1.1,  dens: 0.9,  px: 0.5,  py: 0.5,  pal: 0.83 },
    { m: 0,  fold: 8, cam: 'orbit',  zoom: 0.006,  rot: 0.010, swirl: 0.02, decay: 0.96, exp: 1.1,  dens: 0.85, px: 0.5,  py: 0.5,  pal: 0.16 },
    { m: 0,  fold: 4, cam: 'tunnel', zoom: 0.028,  rot: 0,     swirl: 0.01, decay: 0.955,exp: 1.0,  dens: 0.75, px: 0.5,  py: 0.5,  pal: 0.62 },
    { m: 4,  fold: 1, cam: 'orbit',  zoom: 0,      rot: 0,     swirl: 0,    decay: 0.90, exp: 1.0,  dens: 0.6,  px: 0.5,  py: 0.5,  pal: 0.06 },
    { m: 4,  fold: 4, cam: 'tunnel', zoom: 0.024,  rot: 0,     swirl: 0.01, decay: 0.95, exp: 1.0,  dens: 0.65, px: 0.5,  py: 0.5,  pal: 0.42 },
    { m: 3,  fold: 1, cam: 'tunnel', zoom: 0.030,  rot: 0,     swirl: 0,    decay: 0.95, exp: 1.05, dens: 0.8,  px: 0.5,  py: 0.5,  pal: 0.50 },
    { m: 3,  fold: 4, cam: 'tunnel', zoom: 0.020,  rot: 0.010, swirl: 0,    decay: 0.95, exp: 1.1,  dens: 0.85, px: 0.86, py: 0.62, pal: 0.00 },
    { m: 5,  fold: 1, cam: 'orbit',  zoom: 0.004,  rot: 0,     swirl: 0,    decay: 0.92, exp: 1.0,  dens: 0.6,  px: 0.5,  py: 0.5,  pal: 0.30 },
    { m: 6,  fold: 1, cam: 'face',   zoom: 0,      rot: 0,     swirl: 0,    decay: 0.74, exp: 1.0,  dens: 0.6,  px: 0.5,  py: 0.5,  pal: 0.83 },
    { m: 7,  fold: 6, cam: 'vortex', zoom: 0.006,  rot: 0.006, swirl: 0,    decay: 0.93, exp: 1.1,  dens: 0.55, px: 0.5,  py: 0.5,  pal: 0.55 },
    { m: 8,  fold: 1, cam: 'floor',  zoom: -0.014, rot: 0,     swirl: 0.04, decay: 0.965,exp: 1.1,  dens: 0.7,  px: 0.5,  py: 0.5,  pal: 0.12 },
    { m: 9,  fold: 1, cam: 'floor',  zoom: 0,      rot: 0,     swirl: 0,    decay: 0.95, exp: 1.0,  dens: 0.5,  px: 0.5,  py: 0.5,  pal: 0.70 },
    { m: 10, fold: 1, cam: 'face',   zoom: 0,      rot: 0,     swirl: 0,    decay: 0.34, exp: 1.1,  dens: 0.85, px: 0.5,  py: 0.5,  pal: 0.45 },
    { m: 11, fold: 1, cam: 'tunnel', zoom: 0.010,  rot: 0,     swirl: 0,    decay: 0.46, exp: 1.0,  dens: 0.7,  px: 0.86, py: 0.62, pal: 0.55 },
    { m: 1,  fold: 2, cam: 'vortex', zoom: 0.004,  rot: 0,     swirl: 0.03, decay: 0.93, exp: 1.05, dens: 0.6,  px: 0.5,  py: 0.5,  pal: 0.88 },
    { m: 2,  fold: 4, cam: 'vortex', zoom: 0.018,  rot: 0,     swirl: 0.05, decay: 0.96, exp: 1.1,  dens: 0.9,  px: 0.5,  py: 0.5,  pal: 0.38 },
    { m: 6,  fold: 1, cam: 'vortex', zoom: 0.018,  rot: 0.018, swirl: 0.09, decay: 0.965,exp: 1.0,  dens: 0.6,  px: 0.45, py: 0.40, pal: 0.50 }
  ];
  function orbVisFor(m) { return (m === 1 || m === 4) ? 1.0 : (m === 2 || m === 5 || m === 11 ? 0.7 : 0.0); }
  function spreadFor(m) { return (m === 0 || m === 2 || m === 6 || m === 7 || m === 8 || m === 10 || m === 11) ? 0.85 : 0.45; }
  var NBG = 8;

  function makeDirector() {
    var cur = { zoom: 0, rot: 0, swirl: 0, dx: 0, dy: 0, decay: 0.9, exp: 1.0, dens: 0.6,
                fold: 1, foldStr: 0, px: 0.5, py: 0.5, pal: 0.5, mode: 1, tilt: 0, pan: 0, orbVis: 1, spread: 0.5 };
    var tgt = Object.assign({}, cur);
    var alpha = 1, pendMode = cur.mode, curBg = 0;
    var sceneStart = 0, dwell = 7, ease = 0.5, lastTime = 0;
    var mechBag = [], mechI = 999, bgBag = [], bgI = 999;

    function shuffle(arr) { for (var i = arr.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var x = arr[i]; arr[i] = arr[j]; arr[j] = x; } return arr; }
    function nextMech() {
      if (mechI >= mechBag.length) { mechBag = shuffle(MECHS.map(function (_, i) { return i; })); mechI = 0; }
      return mechBag[mechI++];
    }
    function nextBg() {
      if (bgI >= bgBag.length) { bgBag = shuffle(Array.apply(null, { length: NBG }).map(function (_, i) { return i; })); bgI = 0; }
      return bgBag[bgI++];
    }
    function rollDwell() { var r = Math.random(); if (r < 0.7) return 5 + Math.random() * 3; if (r < 0.88) return 3.5 + Math.random() * 1.5; return 11 + Math.random() * 5; }
    function jit(v, f) { return v * (1 + (Math.random() * 2 - 1) * f) + (Math.random() * 2 - 1) * f * 0.003; }

    function pickScene(time) {
      var M = MECHS[nextMech()];
      tgt.zoom = jit(M.zoom, 0.18); tgt.rot = jit(M.rot, 0.15); tgt.swirl = clamp(jit(M.swirl, 0.2), 0, 0.13);
      tgt.decay = clamp(M.decay, 0.30, 0.975); tgt.exp = M.exp; tgt.dens = clamp(jit(M.dens, 0.12), 0.35, 1);
      tgt.fold = M.fold; tgt.foldStr = M.fold > 1.5 ? 1 : 0; tgt.px = M.px; tgt.py = M.py;
      tgt.pal = M.pal + (Math.random() * 0.06 - 0.03); tgt.orbVis = orbVisFor(M.m); tgt.spread = spreadFor(M.m);
      // camera kind -> tilt / pan / extra zoom / scroll
      tgt.tilt = 0; tgt.pan = 0; tgt.dx = 0; tgt.dy = 0;
      if (M.cam === 'floor') { tgt.tilt = 0.55; tgt.dy = 0.005; }
      else if (M.cam === 'tunnel') { tgt.tilt = 0.30; tgt.zoom += 0.010; }
      else if (M.cam === 'orbit') { tgt.tilt = 0.16; tgt.pan = 0.05; tgt.rot += 0.005; }
      pendMode = M.m; curBg = nextBg();
      ease = Math.random() < 0.25 ? (1 / 0.5) : (1 / 2.0);
      sceneStart = time; dwell = rollDwell();
    }

    return function (t) {
      var time = t.time || 0;
      var dt = clamp(time - lastTime, 0, 0.1); lastTime = time;
      if (sceneStart === 0) { sceneStart = time; pickScene(time); }
      if (time - sceneStart >= dwell) pickScene(time);

      var k = clamp(dt * ease, 0, 1);
      cur.zoom += (tgt.zoom - cur.zoom) * k; cur.rot += (tgt.rot - cur.rot) * k;
      cur.swirl += (tgt.swirl - cur.swirl) * k; cur.dx += (tgt.dx - cur.dx) * k; cur.dy += (tgt.dy - cur.dy) * k;
      cur.decay += (tgt.decay - cur.decay) * k; cur.exp += (tgt.exp - cur.exp) * k; cur.dens += (tgt.dens - cur.dens) * k;
      cur.foldStr += (tgt.foldStr - cur.foldStr) * clamp(dt / 1.5, 0, 1); cur.fold = tgt.fold;
      cur.px += (tgt.px - cur.px) * k; cur.py += (tgt.py - cur.py) * k;
      cur.tilt += (tgt.tilt - cur.tilt) * clamp(dt * 0.6, 0, 1); cur.pan += (tgt.pan - cur.pan) * k;
      cur.orbVis += (tgt.orbVis - cur.orbVis) * clamp(dt * 1.2, 0, 1); cur.spread += (tgt.spread - cur.spread) * k;
      cur.pal += (tgt.pal - cur.pal) * clamp(dt * 0.4, 0, 1) + dt * 0.015;

      if (cur.mode !== pendMode) { alpha -= dt * 4.0; if (alpha <= 0.04) { alpha = 0.04; cur.mode = pendMode; } }
      else if (alpha < 1) { alpha = Math.min(1, alpha + dt * 2.5); }

      var bass = t.bass || 1, bassA = t.bass_att !== undefined ? t.bass_att : bass;
      var treb = t.treb !== undefined ? t.treb : 1;

      t.q1 = cur.mode; t.q2 = alpha; t.q3 = cur.foldStr; t.q4 = cur.fold;
      // always-on gentle camera life so nothing is ever fully static
      t.q5 = cur.zoom + 0.004 * (bassA - 1) + 0.0025 * Math.sin(time * 0.17);
      t.q6 = cur.rot + 0.003 * Math.sin(time * 0.11);
      t.q7 = cur.swirl + (cur.swirl > 0.005 ? 0.03 * (bassA - 1) : 0);
      // orbit camera pans the pivot in a slow circle
      t.q27 = cur.px + cur.pan * Math.cos(time * 0.13);
      t.q28 = cur.py + cur.pan * Math.sin(time * 0.13);
      t.q8 = cur.dx; t.q9 = cur.dy; t.q10 = cur.decay; t.q31 = cur.tilt;
      t.q11 = cur.pal; t.q12 = cur.exp * (1 + 0.25 * (bassA - 1));
      t.q13 = bass; t.q14 = alcEnergy(t); t.q15 = cur.spread; t.q16 = clamp(0.5 * (bassA - 1) + 0.5, 0, 1);
      t.q17 = (0.18 + 0.06 * (bassA - 1)) * (0.85 + 0.4 * cur.dens);
      t.q18 = bassA; t.q19 = treb; t.q20 = time;
      var th = time * 0.16;
      t.q21 = 0.5 + 0.30 * Math.cos(th); t.q22 = 0.5 + 0.26 * Math.sin(th * 0.83);
      t.q23 = 0.5 + 0.30 * Math.cos(th + Math.PI); t.q24 = 0.5 + 0.26 * Math.sin(th * 0.83 + Math.PI);
      t.q25 = TAU; t.q26 = cur.swirl > 0.03 ? 0.6 * (bassA - 1) : 0;
      t.q29 = cur.dens; t.q30 = curBg; t.q32 = cur.orbVis;
      return t;
    };
  }

  // ── WARP: fold + camera (perspective tilt + zoom/rot/swirl/translate about a pivot) + blur + decay ──
  var WARP_V4 =
    ALC_KALEIDO_GLSL +
    "shader_body {\n" +
    "  float asp = resolution.x / resolution.y;\n" +
    "  vec2 piv = vec2(q27, q28);\n" +
    "  vec2 pd = uv - piv; pd.x *= asp;\n" +
    "  vec2 fbil = vec2(abs(pd.x), pd.y);\n" +
    "  vec2 fquad = abs(pd);\n" +
    "  vec2 fmand = alcKaleido(pd, max(q4, 2.0));\n" +
    "  vec2 pdf = pd;\n" +
    "  pdf = mix(pdf, fbil,  step(1.5, q4) * step(q4, 2.5));\n" +
    "  pdf = mix(pdf, fquad, step(3.5, q4) * step(q4, 4.5));\n" +
    "  pdf = mix(pdf, fmand, step(5.5, q4));\n" +
    "  pd = mix(pd, pdf, q3);\n" +
    "  pd /= max(1.0 + q31 * pd.y, 0.25);\n" +                     // perspective tilt (floor/tunnel recede)
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

  // ── COMP: VIBRANT MULTI-COLOUR-FUSION background (8 fields, shuffled) + multi-hue foreground
  //    + filled colour orbs + bloom + Reinhard tone-map. The frame is a rich colour field, never
  //    a flat single-tone wash. ─────────────────────────────────────────────────────────────────
  var COMP_V4 =
    NOISE_GLSL + PAL_GLSL +
    ALC_AURORA_GLSL + ALC_FLUID_GLSL + ALC_MARBLE_GLSL + ALC_RADIALBLOOM_GLSL + ALC_HORIZONBANDS_GLSL + ALC_MOIRE_GLSL +
    "vec3 dusty(vec3 c, float s){ float l = dot(c, vec3(0.333)); return mix(vec3(l), c, s); }\n" +
    // 3-hue fbm FUSION: three distinct hues bleed across the frame -> the original's multi-colour wash
    "vec3 fusion(vec2 d, float t, float ph){\n" +
    "  vec2 w = d * 1.3 + vec2(fbm(d * 1.1 + t * 0.05), fbm(d * 1.1 + 7.0 - t * 0.04));\n" +
    "  float n1 = fbm(w * 1.3 + t * 0.03);\n" +
    "  float n2 = fbm(w * 2.0 - t * 0.025 + 3.0);\n" +
    "  float n3 = fbm(w * 0.8 + t * 0.02 + 9.0);\n" +
    "  vec3 c = pal(ph + 0.30 * n1);\n" +
    "  c = mix(c, pal(ph + 0.33 + 0.30 * n2), smoothstep(0.30, 0.72, n2));\n" +
    "  c = mix(c, pal(ph + 0.66 + 0.30 * n3), smoothstep(0.40, 0.82, n3));\n" +
    "  return c * (0.45 + 0.55 * n1);\n" +
    "}\n" +
    "shader_body {\n" +
    "  float asp = resolution.x / resolution.y;\n" +
    "  vec2 pdc = uv - 0.5; pdc.x *= asp;\n" +
    "  float prad = length(pdc), pang = atan(pdc.y, pdc.x);\n" +
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
    "  float bb = 0.5 + 0.5 * (q13 - 1.0);\n" +
    "  vec3 cA = pal(q11), cB = pal(q11 + 0.5), cC = pal(q11 + 0.28);\n" +
    // BACKGROUND: 8 vibrant multi-hue fields, picked by the bg shuffle-bag (q30)
    "  vec3 ground;\n" +
    "  if (q30 < 0.5) ground = fusion(pdc, time, q11);\n" +
    "  else if (q30 < 1.5) ground = alcAurora(pdc, time, bb);\n" +
    "  else if (q30 < 2.5) ground = alcFluid(pdc, time, bb, cB * 0.6, cA, cC) * 1.1;\n" +
    "  else if (q30 < 3.5) ground = alcMarble(pdc, time, bb, cB, cA, cC * 1.3);\n" +
    "  else if (q30 < 4.5) ground = alcRadialBloom(pdc, time, bb, cA, cB) * 1.2;\n" +
    "  else if (q30 < 5.5) ground = alcHorizonBands(pdc, time, bb) * 1.15;\n" +
    "  else if (q30 < 6.5) ground = alcMoire(uv, time, bb, cA) + fusion(pdc, time, q11 + 0.3) * 0.4;\n" +
    "  else ground = fusion(pdc, time * 0.7, q11 + 0.4);\n" +
    "  ground *= (0.55 + 0.5 * bb) * mix(0.6, 1.0, smoothstep(1.45, 0.1, prad));\n" +   // bright, soft vignette (never black)
    // FOREGROUND: hue varies by angle + radius -> MULTI-COLOUR filaments (not one flat tone)
    "  float fgh = q11 + q15 * (0.18 * sin(pang * 3.0 + time * 0.2) + 0.13 * prad + 0.10 * sharp.g);\n" +
    "  vec3 fg = dusty(pal(fgh), 0.9);\n" +
    "  float pres = smoothstep(0.03, 0.5, lum);\n" +
    "  float hot = smoothstep(0.8, 1.8, lum);\n" +
    "  vec3 lineCol = mix(fg * 1.2, mix(fg, vec3(1.0), 0.4), hot);\n" +
    "  vec3 col = ground + lineCol * pres + fg * bl;\n" +
    // FILLED COLOUR ORBS (the WMP signature), drawn crisp here -> no feedback coil. Gated by q32.
    "  vec2 oA = vec2((q21 - 0.5) * asp, q22 - 0.5), oB = vec2((q23 - 0.5) * asp, q24 - 0.5);\n" +
    "  float oR = 0.05 + 0.025 * (q13 - 1.0);\n" +
    "  vec3 ocA = dusty(pal(q11 + 0.12), 0.95), ocB = dusty(pal(q11 + 0.62), 0.95);\n" +
    "  float dA = length(pdc - oA), dB = length(pdc - oB);\n" +
    "  vec3 orbs = ocA * (smoothstep(oR, 0.0, dA) + 0.6 * exp(-dA * dA / (oR * oR * 3.0)));\n" +
    "  orbs += ocB * (smoothstep(oR, 0.0, dB) + 0.6 * exp(-dB * dB / (oR * oR * 3.0)));\n" +
    "  col += orbs * q32 * (0.8 + 0.5 * (q13 - 1.0));\n" +
    "  col *= q12;\n" +
    "  ret = col / (col + vec3(0.62));\n" +
    "}\n";

  P["Alchemy V4: Random"] = (function () {
    var preset = build(
      {
        wave_a: 0, additivewave: 1, decay: 0.95,
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
