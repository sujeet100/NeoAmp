/* Alchemy V4: Random — ONE seamless self-sequencing preset (single menu entry).
 *
 * REBUILD 2026-06-18 (see docs/alchemy-v4/FINDINGS-AND-REBUILD-PLAN.md). Collapses the former 8
 * shuffle-cycled v4 presets into a SINGLE preset that morphs continuously — no cross-preset
 * crossfade (which read "foggy / like a new preset faded in"). Grafts v2:Random's proven
 * single-preset spine (makePicker director + persistent orbs/tether + per-frame central-motif
 * dispatch) onto v4's vibrant engine (WARP_V4 fold+camera, COMP_V4 fusion-bg+bloom+Reinhard) and
 * v4's clean filled orbs.
 *
 * VENDOR-VERIFIED basis: Butterchurn re-reads samples/additive/usedots/sides/num_inst from each
 * slot's frame_eqs EVERY frame; only `enabled` is fixed at build. So one preset CAN morph geometry
 * continuously — MISTAKES.md §4's "can't hot-swap baseVals" claim was wrong.
 *
 * SEAMLESSNESS comes from THREE independent slow clocks over ONE persistent feedback buffer:
 *   - lookPick  → camera + exposure + fold (slow, long fade)
 *   - bgPick    → background variant (its OWN clock, DECOUPLED from the motif)
 *   - motifPick → central-motif geometry (own clock), swapped under an opacity DIP (q4) so the
 *                 geometry changes invisibly while the orbs + tether + feedback trail persist.
 *
 * Q-VAR MAP (engine vs motif split preserved; two new control vars are read by neither shaders
 * nor kit factories, so they don't collide):
 *   ENGINE (warp/comp): q1 decay · q12 foldN · q13 foldStr · q15 zoom · q16 rot · q17 swirl ·
 *     q18 dx · q19 dy · q20 pivotX · q27 pivotY · q28 tilt · q29 bgVariant · q31 exposure · q32 bass
 *     · q8 shared hue clock (fg + bg)
 *   MOTIF (kit factories): q2,q3 center · q5 size · q6 jag · q7 orbR · q9 spin · q10 twist ·
 *     q11 tier-energy · q14 mesh-flow · q21..q24 orbiter nodes · q25 orb radius · q26 tether amp
 *   CONTROL (our point_eqs only): q30 central-motif mode id · q4 central-motif visibility (dip-swap)
 */
(function () {
  "use strict";
  var P = (window.WMP_PRESETS = window.WMP_PRESETS || {});

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
    // DILATE the foreground (6-tap max) so thin waveform lines + orb rings read THICKER and defined
    // against the vibrant background (the user's "lines too thin / not defined" note).
    "  vec2 dpx = 1.7 / resolution;\n" +
    "  vec3 sharp = texture2D(sampler_main, uv).rgb;\n" +
    "  sharp = max(sharp, texture2D(sampler_main, uv + vec2(dpx.x, 0.0)).rgb);\n" +
    "  sharp = max(sharp, texture2D(sampler_main, uv - vec2(dpx.x, 0.0)).rgb);\n" +
    "  sharp = max(sharp, texture2D(sampler_main, uv + vec2(0.0, dpx.y)).rgb);\n" +
    "  sharp = max(sharp, texture2D(sampler_main, uv - vec2(0.0, dpx.y)).rgb);\n" +
    "  sharp = max(sharp, texture2D(sampler_main, uv + dpx).rgb);\n" +
    "  sharp = max(sharp, texture2D(sampler_main, uv - dpx).rgb);\n" +
    "  vec2 px = 1.0 / resolution; vec3 bloom = vec3(0.0);\n" +
    "  for (int i = 0; i < 8; i++) {\n" +
    "    float ba = float(i) / 8.0 * 6.2832; vec2 bd = vec2(cos(ba), sin(ba));\n" +
    "    bloom += max(texture2D(sampler_main, uv + bd * 3.0 * px).rgb - 0.2, 0.0);\n" +
    "    bloom += max(texture2D(sampler_main, uv + bd * 7.0 * px).rgb - 0.2, 0.0);\n" +
    "  }\n" +
    "  float bl = (bloom.r + bloom.g + bloom.b) * 0.05;\n" +
    "  float hb = q8; float bb = 0.5 + 0.5 * (q32 - 1.0);\n" +
    "  vec3 cA = dusty(pal(hb), 0.9), cB = dusty(pal(hb + 0.5), 0.85), cC = dusty(pal(hb + 0.28), 0.9);\n" +
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

  // Clean orb as a custom SHAPE: COLOURED translucent fill (hue q8+hueOff, brightens on the beat)
  // with a CONTRAST-hue border (fill hue + 0.5). Bright-ish core -> colour fill -> soft edge.
  // Positioned at (qx,qy); radius q7; visibility from `visVar` (staging: comes & goes).
  function orbCol(h, off) { var x = 6.2832 * (h + off); return 0.5 + 0.5 * Math.cos(x); }
  function orbShape(qx, qy, hueOff, visVar) {
    return {
      baseVals: Object.assign({}, SHAPE_BASE, { enabled: 1, sides: 40, additive: 0, thickoutline: 1 }),
      init_eqs: passthrough,
      frame_eqs: function (s) {
        var vis = visVar ? (s[visVar] !== undefined ? s[visVar] : 1) : 1;
        var cx = s[qx] !== undefined ? s[qx] : 0.5, cy = s[qy] !== undefined ? s[qy] : 0.5;
        var be = Math.max(0, (s.bass_att || 1) - 1);                 // beat energy
        var hf = (s.q8 || 0) + (hueOff || 0), hb = hf + 0.5;         // fill hue, complementary border hue
        var fr = orbCol(hf, 0), fg = orbCol(hf, 0.33), fb = orbCol(hf, 0.67);
        var br = orbCol(hb, 0), bg = orbCol(hb, 0.33), bb = orbCol(hb, 0.67);
        var bri = 0.85 + 0.55 * be;                                  // FILL brightness pulses with bass
        s.x = cx; s.y = cy;
        s.rad = (s.q7 || 0.06) * (1 + 0.40 * be);                    // size pulses with bass
        s.r = Math.min(1, fr * bri); s.g = Math.min(1, fg * bri); s.b = Math.min(1, fb * bri);   // COLOURED core (not washed white)
        s.a = 0.96 * vis;
        s.r2 = fr * 0.85; s.g2 = fg * 0.85; s.b2 = fb * 0.85; s.a2 = 0.30 * vis;               // prominent coloured body (was transparent)
        s.border_r = br * 0.32; s.border_g = bg * 0.32; s.border_b = bb * 0.32; s.border_a = 0.95 * vis;  // DARK contrast-hue rim (thickened by the comp dilation)
        return s;
      }
    };
  }

  // ── in-preset director helpers (ported from v2:Random) ──────────────────────────────────────
  // smooth come-and-go envelope (0..1) from a sine input, with a hold band.
  function comeGo(s) { var x = (0.5 + 0.5 * s - 0.30) / 0.30; x = x < 0 ? 0 : (x > 1 ? 1 : x); return x * x * (3 - 2 * x); }
  // stochastic discrete index cross-fader: dwells minS..maxS, then (on a beat gate, or +5s hard cap)
  // ramps a smoothstep crossfade to a NEW index over `fade` seconds. Returns {a, b, mix}. LONG fade
  // ⇒ morph, not cut. (Math.random is fine here — this is browser preset code, not a workflow.)
  function makePicker(n, minS, maxS, fade) {
    var a = Math.floor(Math.random() * n), b = a, mix = 0, transing = false;
    var start = 0, roll = minS + Math.random() * (maxS - minS), tstart = 0, out = { a: a, b: a, mix: 0 };
    return function (time, dt, gate) {
      if (!transing) {
        var el = time - start;
        if (el >= roll && (gate === undefined || gate || el >= roll + 5)) {
          b = n > 1 ? Math.floor(Math.random() * (n - 1)) : a; if (b >= a) b++;
          tstart = time; transing = true;
        }
      } else {
        var fr = (time - tstart) / fade; mix = fr < 0 ? 0 : (fr > 1 ? 1 : fr); mix = mix * mix * (3 - 2 * mix);
        if (fr >= 1) { a = b; transing = false; mix = 0; start = time; roll = minS + Math.random() * (maxS - minS); }
      }
      out.a = a; out.b = b; out.mix = mix; return out;
    };
  }

  // ── central-motif modes: each = a kit-factory point fn (one wave). Dispatched per-frame by q30. ──
  var fAnem = alcAnemone(24, ALC_PAL.roseGreen).point_eqs;
  var fSpin = alcSpindle(ALC_PAL.redCyan).point_eqs;
  // NOTE: no nested-polygon "mandala" mode. In the original (frames w_sweep f_14/20/26) the mandala
  // is a SMALL central waveform MIRRORED by the kaleidoscope fold into big soft wedges — NOT a thin
  // nested-star-polygon tangle (which is what alcNgonPacked produced). So the fold (look 3/6) builds
  // the mandala from whatever flower motif is active; we shrink the motif under a fold (see frame).
  var fNgon = alcNgon({ sides: 6, aspectX: 1.0, hueOff: 0.0 }).point_eqs;
  var fTri  = alcTriangle(0, 0).point_eqs;
  // BOLT — V1's central "flow" motif (alchemy.js wave[3] shape 8): the live audio waveform drawn as
  // a vertical oscilloscope column; the camera tilt/roll turns it into the flowing diagonal trace.
  function fBolt(a) {
    var cx = a.q2 !== undefined ? a.q2 : 0.5;
    var amp = (a.q6 || 0.06) * 2.2;
    a.x = cx + (a.value1 || 0) * amp + (a.value2 || 0) * amp * 0.3;
    a.y = 0.12 + a.sample * 0.76;
    var h = a.q8 || 0;
    a.r = 0.5 + 0.5 * Math.cos(6.2832 * h); a.g = 0.5 + 0.5 * Math.cos(6.2832 * (h + 0.33)); a.b = 0.5 + 0.5 * Math.cos(6.2832 * (h + 0.67));
    return a;
  }
  // URCHIN — V1's central "flower" motif (alchemy.js wave[3] shape 3): all 512 live-waveform samples
  // form a spiky rosette whose spike LENGTH is the waveform amplitude → a flower that flares with the
  // audio. (This is the flower-like central flow the user remembered, distinct from anemone's fixed spikes.)
  function fUrchin(a) {
    var cx = a.q2 !== undefined ? a.q2 : 0.5, cy = a.q3 !== undefined ? a.q3 : 0.5;
    var sc = (a.q5 || 0.4);
    var rad = sc * (0.20 + 0.65 * Math.abs(a.value1 || 0));
    var ang = (a.sample || 0) * 6.2832 + (a.q9 || 0);
    a.x = cx + rad * Math.cos(ang); a.y = cy + rad * Math.sin(ang);
    var h = a.q8 || 0;
    a.r = 0.5 + 0.5 * Math.cos(6.2832 * h); a.g = 0.5 + 0.5 * Math.cos(6.2832 * (h + 0.33)); a.b = 0.5 + 0.5 * Math.cos(6.2832 * (h + 0.67));
    return a;
  }
  var MODES = [fAnem, fSpin, fNgon, fTri, fBolt, fUrchin];
  // per-mode alpha: dense ADDITIVE bristle modes (spindle) saturate to milky white in the feedback
  // buffer (equilibrium ~ input/(1-decay)), so they get much less alpha than sparse outline modes.
  var MODE_ALPHA = [0.80, 0.42, 0.95, 0.85, 0.85, 0.72];   // anemone·spindle·ngon·triangle·bolt·urchin
  function scaleFor(m) { return m === 0 ? 0.46 : (m === 1 ? 0.40 : 0.5); }
  function centralDraw(a) {
    var m = Math.floor((a.q30 || 0) + 0.5); if (m < 0) m = 0; if (m >= MODES.length) m = MODES.length - 1;
    MODES[m](a);
    a.a = (a.a === undefined ? 0.85 : a.a) * (a.q4 || 0) * MODE_ALPHA[m];   // q4 = visibility dip-swap
    return a;
  }
  var fTether = alcTether("q21", "q22", "q23", "q24", "q26", ALC_PAL.warm).point_eqs;

  // ── LOOKS — each bundles camera + exposure + fold + decay (NOT the motif, NOT the bg: those have
  //    their own independent clocks). Two looks engage the kaleidoscope fold (q12=4 quad / 6 radial).
  //    decay floored to >=0.90 so the persistent feedback trail carries continuity across morphs. ──
  // decay tuned to 0.84–0.92: high enough to keep a continuity trail, low enough that additive
  // bristles DON'T accumulate into a milky white-out. exp kept ~0.8–0.95 (Reinhard does the rest).
  var LOOKS = [
    { decay: 0.88, fold: 1, zoom: 0.000, rot: 0.000, swirl: 0.00, dx: 0, dy: -0.0010, tilt: 0.10, tiltOsc: 0.05, pan: 0.04, px: 0.50, py: 0.50, exp: 0.90 },  // free-space, gentle rise
    { decay: 0.86, fold: 1, zoom: 0.018, rot: 0.004, swirl: 0.00, dx: 0, dy:  0.0000, tilt: 0.30, tiltOsc: 0.03, pan: 0.02, px: 0.50, py: 0.50, exp: 0.92 },  // corridor: forward fly + steep tilt
    { decay: 0.91, fold: 1, zoom: 0.012, rot: 0.016, swirl: 0.07, dx: 0, dy: 0.0000, tilt: 0.05, tiltOsc: 0.04, pan: 0.06, px: 0.46, py: 0.43, exp: 0.88 },  // vortex swirl
    { decay: 0.88, fold: 4, zoom: 0.004, rot: 0.006, swirl: 0.00, dx: 0, dy:  0.0000, tilt: 0.00, tiltOsc: 0.03, pan: 0.02, px: 0.50, py: 0.50, exp: 0.92 },  // QUAD kaleidoscope
    { decay: 0.88, fold: 1, zoom: 0.000, rot: 0.003, swirl: 0.00, dx: 0, dy: -0.0008, tilt: 0.08, tiltOsc: 0.05, pan: 0.05, px: 0.50, py: 0.50, exp: 0.90 },  // anemone free-space
    { decay: 0.87, fold: 1, zoom: 0.008, rot: 0.000, swirl: 0.02, dx: 0, dy:  0.0000, tilt: 0.12, tiltOsc: 0.04, pan: 0.06, px: 0.52, py: 0.48, exp: 0.90 },  // side-angle drift
    { decay: 0.89, fold: 6, zoom: 0.000, rot: 0.010, swirl: 0.00, dx: 0, dy:  0.0000, tilt: 0.06, tiltOsc: 0.04, pan: 0.03, px: 0.50, py: 0.50, exp: 0.92 },  // RADIAL kaleidoscope
    { decay: 0.90, fold: 1, zoom: -0.012, rot: 0.000, swirl: 0.03, dx: 0, dy: -0.0010, tilt: 0.05, tiltOsc: 0.05, pan: 0.03, px: 0.50, py: 0.50, exp: 0.92 }  // burst bloom outward
  ];

  // director state (closure → persists across frames; this is ONE preset, never reloaded)
  var lastT = 0, huePhase = 0;
  var beat = alcBeatFlash({ rise: 1.22 });
  var lookPick  = makePicker(LOOKS.length, 9, 16, 4.0);   // camera/look — slow, long morph
  var bgPick    = makePicker(4, 14, 26, 5.0);             // background variant — own slow clock (decoupled)
  var motifPick = makePicker(MODES.length, 6, 12, 2.0);   // central motif — own clock, dip-swap

  function frame(t) {
    var time = t.time || 0;
    var bass = t.bass || 1, bassA = t.bass_att !== undefined ? t.bass_att : bass;
    var dt = Math.min(0.05, Math.max(0.001, time - lastT)); lastT = time;
    var energy = (typeof alcEnergy === "function") ? alcEnergy(t) : bassA;
    var f = beat(t.bass || 1, dt);   // per-beat flash (fast decay)

    // shared HUE clock (fg + bg) — mostly clock-driven, faster when loud, tiny per-beat warm nudge
    huePhase = alcHueClock(huePhase, dt, Math.max(0, energy - 1), 0.02, 0.05);
    t.q8 = huePhase + 0.04 * f;

    // LOOK — camera + exposure + fold eased between two looks on a slow clock
    var lk = lookPick(time, dt, f > 0.6), A = LOOKS[lk.a], B = LOOKS[lk.b], k = lk.mix;
    function L(key) { return A[key] + (B[key] - A[key]) * k; }
    t.q1 = L("decay");
    var fold = (k < 0.5 ? A.fold : B.fold);                              // fold is discrete (snap at midpoint, hidden by morph)
    t.q12 = fold; t.q13 = fold > 1.5 ? (0.6 + 0.4 * Math.min(1, (bassA - 1) + 0.5 * Math.sin(time * 0.07))) : 0;
    t.q15 = L("zoom") + 0.006 * (bassA - 1) + 0.004 * Math.sin(time * 0.13);          // per-look zoom (no global recede — it smeared bristles into a net)
    t.q16 = L("rot") + 0.055 * Math.sin(time * 0.045);                                // slow camera ROLL (axis rocks ±~3°) → not a locked top-view
    t.q17 = L("swirl") + (L("swirl") ? 0.03 * (bassA - 1) : 0);
    t.q18 = L("dx"); t.q19 = L("dy");
    var pan = L("pan");
    t.q20 = L("px") + pan * Math.cos(time * 0.11);                                    // VP orbits → parallax
    t.q27 = L("py") + pan * Math.sin(time * 0.11);
    t.q28 = L("tilt") * 1.4 + L("tiltOsc") * Math.sin(time * 0.10);                   // stronger 3D plane tilt (side-angle)
    t.q31 = L("exp") * (1 + 0.12 * (bassA - 1) + 0.22 * f);   // gentle beat lift (Reinhard compresses the rest)
    t.q32 = bass;

    // BACKGROUND — its OWN slow clock, decoupled from the motif (the same motif now appears over
    // different backgrounds, like the original). Continuous 0..3 → COMP_V4's q29 variant select.
    var bg = bgPick(time, dt, false);
    t.q29 = bg.a + (bg.b - bg.a) * bg.mix;

    // CENTRAL MOTIF — own clock; geometry swapped under an opacity dip (q4) so it morphs invisibly.
    var mo = motifPick(time, dt, f > 0.6);
    var mCur = mo.mix < 0.5 ? mo.a : mo.b;
    t.q30 = mCur;
    var dd = (mo.mix - 0.5) * 4.0;
    t.q4 = 0.85 * (1 - 0.75 * Math.exp(-dd * dd));                       // dips to ~0.21 at the swap instant

    // MOTIF contract (read by the kit factories)
    t.q2 = 0.5; t.q3 = 0.5;
    t.q5 = scaleFor(mCur) * (0.82 + 0.40 * (bassA - 1) + 0.22 * f);      // breathing + per-beat pop
    if (fold > 1.5) t.q5 *= 0.52;                                        // under a kaleidoscope fold: small center → clean mirrored wedges (orig f_26)
    t.q6 = 0.05;
    t.q9 = time * 0.06;                                                  // slow spin
    t.q10 = 0.4 * Math.max(0, bassA - 1);                               // twist scales with bass
    t.q11 = 0.6 + 0.9 * energy;                                          // ngon tier-density energy gate

    // ORBS + TETHER — wide opposite-corner diagonal (separation ~0.6w, never crossing center).
    // STAGING: orb A is a near-persistent anchor; orb B comes & goes on its own phase → single↔pair;
    // the tether is gated to appear only when BOTH orbs are clearly present → sometimes-tethered.
    t.q25 = 0.60 + 0.40 * comeGo(Math.sin(time * 0.070));                // orb A visibility (0.6..1.0)
    t.q14 = comeGo(Math.sin(time * 0.055 + 1.7));                        // orb B visibility (0..1, staggered)
    var dAng = Math.PI / 4 + 0.2 * Math.sin(time * 0.05);
    t.q21 = 0.5 - 0.30 * Math.cos(dAng);
    t.q22 = 0.5 - 0.28 * Math.sin(dAng);
    t.q23 = 0.5 + 0.30 * Math.cos(dAng);
    t.q24 = 0.5 + 0.28 * Math.sin(dAng);
    t.q7 = (0.060 + 0.020 * Math.max(0, bass - 1)) * (1 + 0.40 * f);     // orb radius (pops on beat)
    t.q26 = 0.06 * (0.5 + 0.7 * bassA);                                 // tether jag amplitude (audio-coupled)
    return t;
  }

  // ── build the single preset: WAVE0 central motif · WAVE1 spindle companion (density) ·
  //    WAVE2 tether · two filled-orb SHAPES. (WAVE3 + SHAPE2/3 left free for later layers.) ──
  var preset = build(BASE, { frame: frame, warp: WARP_V4, comp: COMP_V4 });
  preset.waves[0] = {
    baseVals: Object.assign({}, WAVE_BASE, { enabled: 1, samples: 512, additive: 1, usedots: 0, scaling: 1, smoothing: 0.05, thick: 1, a: 0.62 }),
    init_eqs: passthrough, frame_eqs: passthrough, point_eqs: function (a) { return centralDraw(a); }
  };
  // waves[1] reserved for a future companion/secondary layer — disabled for now (additive bristle
  // companions accumulated into a milky white-out; density will be re-added more carefully later).
  preset.waves[1] = {
    baseVals: Object.assign({}, WAVE_BASE, { enabled: 0 }),
    init_eqs: passthrough, frame_eqs: passthrough, point_eqs: ""
  };
  preset.waves[2] = {   // jagged REAL-waveform tether spanning the two orbs (gated: both present)
    baseVals: Object.assign({}, WAVE_BASE, { enabled: 1, samples: 512, additive: 0, usedots: 0, scaling: 1, smoothing: 0.0, thick: 1, a: 0.9 }),
    init_eqs: passthrough, frame_eqs: passthrough,
    point_eqs: function (a) { fTether(a); var g = Math.max(0, (Math.min(a.q25 || 0, a.q14 || 0) - 0.45) / 0.55); a.a = (a.a === undefined ? 0.9 : a.a) * g; return a; }
  };
  preset.shapes[0] = orbShape("q21", "q22", 0.00, "q25");   // orb A (near-persistent anchor)
  preset.shapes[1] = orbShape("q23", "q24", 0.35, "q14");   // orb B (comes & goes; different hue)

  P["Alchemy V4: Random"] = preset;
})();
