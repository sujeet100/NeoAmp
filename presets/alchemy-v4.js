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
    "  float pang = q16 + q17 * pr + q17 * 0.10 / (pr * 6.0 + 1.0);\n" + // +center-growing twist (q17-gated) -> inward log-spiral DRAIN (Vortex); zero effect on swirl=0 looks
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
    NOISE_GLSL +
    PAL_GLSL +
    ALC_MOIRE_GLSL +
    "vec3 dusty(vec3 c, float s){ float l = dot(c, vec3(0.333)); return mix(vec3(l), c, s); }\n" +
    "shader_body {\n" +
    "  float asp = resolution.x / resolution.y;\n" +
    "  vec2 pdc = uv - 0.5; pdc.x *= asp; float prad = length(pdc);\n" +
    // DILATE the foreground (6-tap max) so thin waveform lines + orb rings read THICKER and defined
    // against the vibrant background (the user's "lines too thin / not defined" note).
    "  vec2 dpx = 1.7 / resolution;\n" +
    // foreground sample coord — folded across BOTH diagonals about screen centre for the new full
    // DIAGONAL-X kaleidoscope (fold>=8), so the MOTIF mirrors into all 4 wedges (not just the bg).
    "  vec2 kuv = uv;\n" +
    "  if (q12 > 7.5) { vec2 kc = uv - 0.5; kc.x *= asp; vec2 kr = vec2(kc.x + kc.y, kc.y - kc.x) * 0.70711; kr = abs(kr); kc = vec2(kr.x - kr.y, kr.x + kr.y) * 0.70711; kc.x /= asp; kuv = kc + 0.5; }\n" +
    "  vec3 sharp = texture2D(sampler_main, kuv).rgb;\n" +
    "  sharp = max(sharp, texture2D(sampler_main, kuv + vec2(dpx.x, 0.0)).rgb);\n" +
    "  sharp = max(sharp, texture2D(sampler_main, kuv - vec2(dpx.x, 0.0)).rgb);\n" +
    "  sharp = max(sharp, texture2D(sampler_main, kuv + vec2(0.0, dpx.y)).rgb);\n" +
    "  sharp = max(sharp, texture2D(sampler_main, kuv - vec2(0.0, dpx.y)).rgb);\n" +
    "  sharp = max(sharp, texture2D(sampler_main, kuv + dpx).rgb);\n" +
    "  sharp = max(sharp, texture2D(sampler_main, kuv - dpx).rgb);\n" +
    // PRISM / RGB chromatic split — offset the R and B channels of the motif along an axis so it reads
    // as iridescent dispersion. Gated to ribbon (mode 9) + crossed-X (mode 11) via q30 (NOT the green
    // wire-net). Only splits the EXISTING dusty motif colour → no neon, honours the muting rule.
    "  float prismOn = step(8.5, q30) * (1.0 - step(9.5, q30)) + step(10.5, q30);\n" +
    "  if (prismOn > 0.5) {\n" +
    "    vec2 ddir = vec2(0.0032, 0.0024);\n" +
    "    float rr = texture2D(sampler_main, kuv + ddir).r;\n" +
    "    float bb2 = texture2D(sampler_main, kuv - ddir).b;\n" +
    "    sharp = vec3(max(sharp.r, rr), sharp.g, max(sharp.b, bb2));\n" +
    "  }\n" +
    "  vec2 px = 1.0 / resolution; vec3 bloom = vec3(0.0);\n" +
    "  for (int i = 0; i < 8; i++) {\n" +
    "    float ba = float(i) / 8.0 * 6.2832; vec2 bd = vec2(cos(ba), sin(ba));\n" +
    "    bloom += max(texture2D(sampler_main, uv + bd * 3.0 * px).rgb - 0.2, 0.0);\n" +
    "    bloom += max(texture2D(sampler_main, uv + bd * 7.0 * px).rgb - 0.2, 0.0);\n" +
    "  }\n" +
    "  float bl = (bloom.r + bloom.g + bloom.b) * 0.05;\n" +
    "  float hb = q8; float bb = 0.5 + 0.5 * (q32 - 1.0);\n" +
    "  vec3 cA = dusty(pal(hb), 0.9), cB = dusty(pal(hb + 0.5), 0.85), cC = dusty(pal(hb + 0.28), 0.9);\n" +
    // KALEIDOSCOPE = fold the BACKGROUND colour into soft wedges (orig f_26 is soft colour panes, not a
    // thin-line spirograph). When a fold is active (q13>0) mirror pdc before building the ground, so
    // the bg reads as big mirrored colour wedges; the (small) folded motif sits as the mirrored centre.
    "  vec2 fpd = pdc;\n" +
    "  if (q12 > 3.5 && q12 < 4.5) { fpd = abs(pdc); }\n" +
    "  else if (q12 > 5.5) { float fa = atan(pdc.y, pdc.x); float fseg = 6.2832 / max(q12, 2.0); fa = abs(fa - fseg * floor(fa / fseg + 0.5)); fpd = length(pdc) * vec2(cos(fa), sin(fa)); }\n" +
    "  pdc = mix(pdc, fpd, clamp(q13, 0.0, 1.0));\n" +
    // NEW full DIAGONAL-X kaleidoscope (fold>=8): mirror the BACKGROUND across BOTH diagonals about
    // screen centre (rotate -45°, abs, rotate +45°) → 4 triangular wedges like the original (f_18).
    "  if (q12 > 7.5) { vec2 dr = vec2(pdc.x + pdc.y, pdc.y - pdc.x) * 0.70711; dr = abs(dr); pdc = vec2(dr.x - dr.y, dr.x + dr.y) * 0.70711; }\n" +
    "  vec2 w = pdc * 1.3 + vec2(fbm(pdc * 1.1 + vec2(time * 0.04, -time * 0.03)), fbm(pdc * 1.1 + 7.0 - time * 0.035));\n" +
    "  float n1 = fbm(w * 1.3 + time * 0.025), n2 = fbm(w * 2.0 - time * 0.02 + 3.0);\n" +
    "  vec3 ground = mix(cB, cC, smoothstep(0.30, 0.75, n1));\n" +
    "  ground = mix(ground, cA, smoothstep(0.45, 0.85, n2) * 0.45);\n" +
    "  if (q29 < 0.5) { ground = mix(ground, alcMoire(uv, time, bb, cA), 0.45); }\n" + // moiré DOTS (0) — kept
    "  else if (q29 < 1.5) { ground = mix(ground, alcMoireStripes(uv, time, bb, cA), 0.7); }\n" + // moiré vertical STRIPES (1) — NEW (WMP scene F3), mixed stronger so columns read over the fbm ground
    "  else if (q29 < 2.5) { float vein = smoothstep(0.10, 0.0, abs(fract(n1 * 4.0) - 0.5) - 0.06); ground = mix(ground, cC * 1.25, vein * 0.6); }\n" + // marble (2)
    "  else if (q29 < 3.5) { float band = pdc.y * 5.0 + time * 0.10; ground = mix(ground, mix(cB, cA, 0.5 + 0.5 * sin(band)), 0.4); }\n" + // horizon bands (3)
    "  else if (q29 < 4.5) { float rib = 0.5 + 0.5 * sin((pdc.x * 0.83 + pdc.y * 0.56) * 9.0 + time * 0.20); ground = mix(ground, mix(cC, cA, rib), 0.45); }\n" + // ribbon stripes (4)
    "  else if (q29 < 5.5) { ground = mix(ground, mix(cB, cA, fbm(pdc * 2.5 + time * 0.05 + n1)), 0.5); }\n" + // aurora swirl (5)
    // VOID (6) — the near-black finale STAGE. q29 is steered to 5.5..5.9 from frame() ONLY while a wire/
    // X motif is active (modes 10/11), so the wires read as the only light on black (Era-D character).
    // No textured variant; the crush below darkens the whole fbm ground + fold wedges + corner pool.
    "  float voidAmt = smoothstep(5.5, 5.9, q29);\n" +
    // BOLD kaleidoscope wedges — when a fold is active, split the (already-mirrored) field into two
    // distinct LUMINOUS colour panes along the fold axes so it reads as bold colour wedges (orig
    // sweep_08 = a green/mauve bowtie-X), NOT the uniform symmetric blob a low-contrast fbm fold gives.
    // Palette-driven by hb → harmonious + cycles with the music; the textured ground still modulates
    // each pane (luminous, not flat). A soft seam glow marks the visible diagonal X where panes meet.
    "  float foldOn = clamp(q13, 0.0, 1.0); if (q12 > 7.5) foldOn = 1.0;\n" +
    "  if (foldOn > 0.01) {\n" +
    "    float bowtie = smoothstep(-0.04, 0.04, abs(pdc.x) - abs(pdc.y));\n" + // 1 = along-axis wedge, 0 = cross wedge (crisp pane edge)
    "    vec3 paneA = dusty(pal(hb + 0.12), 1.05) * 1.15;\n" +
    "    vec3 paneB = dusty(pal(hb + 0.62), 0.98) * 0.90;\n" + // ~half-turn apart → always COMPLEMENTARY (bold at every hue moment)
    "    vec3 wedge = mix(paneB, paneA, bowtie);\n" +
    "    float seam = smoothstep(0.06, 0.0, abs(abs(pdc.x) - abs(pdc.y)));\n" +
    "    wedge += dusty(pal(hb + 0.37), 0.9) * seam * 0.45;\n" + // luminous seam-X glow
    "    ground = mix(ground, wedge, 0.68 * foldOn);\n" +
    "  }\n" +
    // ASYMMETRIC corner bleed — the original is NEVER flat: a drifting OFF-CENTER colour pool + a
    // warm plume rising from one edge, so colour always bleeds into a corner (not a centred vignette).
    "  vec2 poolC = 0.42 * vec2(cos(time * 0.05 + hb * 6.2832), sin(time * 0.037 + 1.3));\n" +
    "  float pool = exp(-dot(pdc - poolC, pdc - poolC) * 2.2);\n" +
    "  ground = mix(ground, cA * 1.25, pool * 0.45);\n" +
    "  ground += dusty(pal(hb + 0.86), 0.8) * smoothstep(0.55, -0.05, uv.y) * (0.08 + 0.12 * bb);\n" +
    "  ground *= (0.42 + 0.42 * n1 + 0.12 * bb) * mix(0.66, 1.02, smoothstep(1.5, 0.15, prad));\n" + // darker, higher-contrast ground (orig is darker) — saturated motifs POP; still colour-bled, not flat-black
    "  ground *= mix(1.0, 0.05, voidAmt);\n" + // VOID: crush to near-black so wire/X motifs read as the only light (faint corner-pool survives)
    "  vec3 col = ground + sharp * 1.25 + cA * bl;\n" + // kit-coloured motif over the vibrant ground
    // (orb ripples removed — the original's rings are the orb's 3D feedback TRACE/tube-stack, not a drawn
    //  shape; the flat procedural rings read as fake. q11 is unused now.)
    "  col *= q31;\n" +
    // CENTRAL PUPIL / FOCUS (q11 = focus amount, high for anemone/urchin/tunnel modes; q30 = which mode).
    // Drawn FRESH here in COMP — never in the feedback buffer (gotcha §8b) so it can't smear/spiral.
    "  float foc = clamp(q11, 0.0, 1.0);\n" +
    "  if (foc > 0.01) {\n" +
    "    vec2 pe = pdc - vec2(0.10, -0.03);\n" + // slightly off-center pupil (reads for both the 3D eye and the tunnel throat)
    "    float pupil = 1.0 - 0.55 * exp(-dot(pe, pe) * 110.0);\n" +
    "    col *= mix(1.0, pupil, foc);\n" + // dark central pupil
    "    col += cA * exp(-prad * prad * 80.0) * 0.12 * foc;\n" + // warm focus plume at the very center
    "    float isTunnel = (1.0 - step(6.5, q30)) * step(5.5, q30);\n" + // mode 6 (rotline/tunnel) ONLY
    "    col *= mix(1.0, 1.0 - 0.22 * smoothstep(0.0, 1.2, prad), foc * isTunnel);\n" + // tunnel DEPTH: darken toward the edges
    "  }\n" +
    // DE-WASH (measured vs the original: ours was too BRIGHT + UNDER-saturated → washed/pastel). Reinhard
    // compresses highlights toward white and dusty()/bloom average colour out, so after tone-mapping we
    // RE-SATURATE (luminance-preserving) + apply a gentle contrast that deepens darks → saturated elements
    // POP against more near-black, matching the vibrant 1080p reference. Still luminous, not neon/blown-white.
    "  vec3 toned = col / (col + vec3(0.6));\n" +
    "  float tl = dot(toned, vec3(0.299, 0.587, 0.114));\n" +
    "  toned = mix(vec3(tl), toned, 1.22);\n" + // resaturate toward the original's SATMAX (gentler → not neon)
    "  toned = mix(toned * toned, toned, 0.72);\n" + // deepen darks/mids ONLY (x*x ≤ x) → contrast without lifting highlights to blowout
    "  ret = clamp(toned, 0.0, 1.0);\n" +
    "}\n";

  var BASE = {
    wave_a: 0,
    additivewave: 1,
    decay: 0.95,
    zoom: 1,
    rot: 0,
    warp: 0,
    dx: 0,
    dy: 0,
    cx: 0.5,
    cy: 0.5,
    gammaadj: 1.5,
    darken_center: 0,
    wrap: 0,
    echo_alpha: 0,
  };

  // Clean orb as a custom SHAPE: COLOURED translucent fill (hue q8+hueOff, brightens on the beat)
  // with a CONTRAST-hue border (fill hue + 0.5). Bright-ish core -> colour fill -> soft edge.
  // Positioned at (qx,qy); radius q7; visibility from `visVar` (staging: comes & goes).
  function orbCol(h, off) {
    var x = 6.2832 * (h + off);
    return 0.5 + 0.5 * Math.cos(x);
  }
  function orbShape(qx, qy, hueOff, visVar) {
    return {
      baseVals: Object.assign({}, SHAPE_BASE, {
        enabled: 1,
        sides: 40,
        additive: 0,
        thickoutline: 1,
      }),
      init_eqs: passthrough,
      frame_eqs: function (s) {
        var vis = visVar ? (s[visVar] !== undefined ? s[visVar] : 1) : 1;
        var cx = s[qx] !== undefined ? s[qx] : 0.5,
          cy = s[qy] !== undefined ? s[qy] : 0.5;
        var be = Math.max(0, (s.bass_att || 1) - 1); // beat energy
        var hf = (s.q8 || 0) + (hueOff || 0),
          hb = hf + 0.5; // fill hue, complementary border hue
        var fr = orbCol(hf, 0),
          fg = orbCol(hf, 0.33),
          fb = orbCol(hf, 0.67);
        var br = orbCol(hb, 0),
          bg = orbCol(hb, 0.33),
          bb = orbCol(hb, 0.67);
        var bri = 0.85 + 0.55 * be; // FILL brightness pulses with bass
        s.x = cx;
        s.y = cy;
        s.rad = (s.q7 || 0.06) * (1 + 0.4 * be); // size pulses with bass
        s.r = Math.min(1, fr * bri);
        s.g = Math.min(1, fg * bri);
        s.b = Math.min(1, fb * bri); // COLOURED core (not washed white)
        s.a = 0.96 * vis;
        s.r2 = fr * 0.85;
        s.g2 = fg * 0.85;
        s.b2 = fb * 0.85;
        s.a2 = 0.3 * vis; // prominent coloured body (was transparent)
        s.border_r = br * 0.32;
        s.border_g = bg * 0.32;
        s.border_b = bb * 0.32;
        s.border_a = 0.95 * vis; // DARK contrast-hue rim (thickened by the comp dilation)
        return s;
      },
    };
  }

  // GRADIENT-GLOW HALO (NEW, additive) — a soft hot-core→translucent-halo glow co-located with each
  // orb: the WMP "gradient orb" signature. A SEPARATE layer in the free shape slots; the existing
  // flat-fill orbShape is left UNTOUCHED. Additive, so it surrounds the opaque core as a glow without
  // occluding it (no draw-order reshuffle needed). Hue follows the shared q8 clock; halo pushed teal.
  function orbGlow(qx, qy, hueOff, visVar) {
    return {
      baseVals: Object.assign({}, SHAPE_BASE, {
        enabled: 1,
        sides: 40,
        additive: 1,
        thickoutline: 0,
      }),
      init_eqs: passthrough,
      frame_eqs: function (s) {
        var vis = visVar ? (s[visVar] !== undefined ? s[visVar] : 1) : 1;
        var cx = s[qx] !== undefined ? s[qx] : 0.5,
          cy = s[qy] !== undefined ? s[qy] : 0.5;
        var be = Math.max(0, (s.bass_att || 1) - 1);
        var hf = (s.q8 || 0) + (hueOff || 0);
        var gr = orbCol(hf, 0),
          gg = orbCol(hf, 0.33),
          gb = orbCol(hf, 0.67);
        s.x = cx;
        s.y = cy;
        s.rad = (s.q7 || 0.06) * (1.7 + 0.5 * be); // WIDER than the core → a surrounding halo
        s.r = gr * 0.85;
        s.g = gg * 0.85;
        s.b = Math.min(1, gb * 1.5 + 0.15); // push the halo toward teal (orig glow)
        s.a = 0.32 * vis; // bright-ish glow center (additive)
        s.r2 = gr * 0.4;
        s.g2 = gg * 0.4;
        s.b2 = gb * 0.5;
        s.a2 = 0.0; // → fully transparent at the rim = the soft gradient falloff
        return s;
      },
    };
  }

  // ── in-preset director helpers (ported from v2:Random) ──────────────────────────────────────
  // smooth come-and-go envelope (0..1) from a sine input, with a hold band.
  function comeGo(s) {
    var x = (0.5 + 0.5 * s - 0.3) / 0.3;
    x = x < 0 ? 0 : x > 1 ? 1 : x;
    return x * x * (3 - 2 * x);
  }
  // stochastic discrete index cross-fader: dwells minS..maxS, then (on a beat gate, or +5s hard cap)
  // ramps a smoothstep crossfade to a NEW index over `fade` seconds. Returns {a, b, mix}. LONG fade
  // ⇒ morph, not cut. (Math.random is fine here — this is browser preset code, not a workflow.)
  function makePicker(n, minS, maxS, fade) {
    var a = Math.floor(Math.random() * n),
      b = a,
      mix = 0,
      transing = false;
    var start = 0,
      roll = minS + Math.random() * (maxS - minS),
      tstart = 0,
      out = { a: a, b: a, mix: 0 };
    return function (time, dt, gate) {
      if (!transing) {
        var el = time - start;
        if (el >= roll && (gate === undefined || gate || el >= roll + 5)) {
          b = n > 1 ? Math.floor(Math.random() * (n - 1)) : a;
          if (b >= a) b++;
          tstart = time;
          transing = true;
        }
      } else {
        var fr = (time - tstart) / fade;
        mix = fr < 0 ? 0 : fr > 1 ? 1 : fr;
        mix = mix * mix * (3 - 2 * mix);
        if (fr >= 1) {
          a = b;
          transing = false;
          mix = 0;
          start = time;
          roll = minS + Math.random() * (maxS - minS);
        }
      }
      out.a = a;
      out.b = b;
      out.mix = mix;
      return out;
    };
  }

  // ── central-motif modes: each = a kit-factory point fn (one wave). Dispatched per-frame by q30. ──
  var fAnem = alcAnemone(10, ALC_PAL.roseGreen).point_eqs; // 10 arms (was 24) → a cleaner, softer flower, not a dense spirograph lattice (#21)
  var fSpin = alcSpindle(ALC_PAL.redCyan).point_eqs;
  // NOTE: no nested-polygon "mandala" mode. In the original (frames w_sweep f_14/20/26) the mandala
  // is a SMALL central waveform MIRRORED by the kaleidoscope fold into big soft wedges — NOT a thin
  // nested-star-polygon tangle (which is what alcNgonPacked produced). So the fold (look 3/6) builds
  // the mandala from whatever flower motif is active; we shrink the motif under a fold (see frame).
  var fNgon = alcNgon({ sides: 6, aspectX: 1.0, hueOff: 0.0 }).point_eqs;
  var fTri = alcTriangle(0, 0).point_eqs;
  // BOLT — V1's central "flow" motif (alchemy.js wave[3] shape 8): the live audio waveform drawn as
  // a vertical oscilloscope column; the camera tilt/roll turns it into the flowing diagonal trace.
  function fBolt(a) {
    var cx = a.q2 !== undefined ? a.q2 : 0.5;
    var amp = (a.q6 || 0.06) * 2.2;
    a.x = cx + (a.value1 || 0) * amp + (a.value2 || 0) * amp * 0.3;
    a.y = 0.12 + a.sample * 0.76;
    var h = a.q8 || 0;
    a.r = 0.5 + 0.5 * Math.cos(6.2832 * h);
    a.g = 0.5 + 0.5 * Math.cos(6.2832 * (h + 0.33));
    a.b = 0.5 + 0.5 * Math.cos(6.2832 * (h + 0.67));
    return a;
  }
  // URCHIN — V1's central "flower" motif (alchemy.js wave[3] shape 3): all 512 live-waveform samples
  // form a spiky rosette whose spike LENGTH is the waveform amplitude → a flower that flares with the
  // audio. (This is the flower-like central flow the user remembered, distinct from anemone's fixed spikes.)
  function fUrchin(a) {
    var cx = a.q2 !== undefined ? a.q2 : 0.5,
      cy = a.q3 !== undefined ? a.q3 : 0.5;
    var sc = a.q5 || 0.4;
    var rad = sc * (0.2 + 0.65 * Math.abs(a.value1 || 0));
    var ang = (a.sample || 0) * 6.2832 + (a.q9 || 0);
    a.x = cx + rad * Math.cos(ang);
    a.y = cy + rad * Math.sin(ang);
    var h = a.q8 || 0;
    a.r = 0.5 + 0.5 * Math.cos(6.2832 * h);
    a.g = 0.5 + 0.5 * Math.cos(6.2832 * (h + 0.33));
    a.b = 0.5 + 0.5 * Math.cos(6.2832 * (h + 0.67));
    return a;
  }
  // ROTLINE — the original "rotating lines" + line-sweep (frames w_rot ~2:40, w_sweep ~0:40): N live-
  // waveform diameter lines sharing one rotation (q9, sped up), smeared by feedback into a swept fan.
  function fRotLine(a) {
    var N = 3,
      fk = (a.sample || 0) * N,
      seg = Math.floor(fk),
      u = fk - seg,
      s = u * 2 - 1;
    // PARALLEL-MERGED: all 3 copies share ONE rotation angle (no 60° spread) and are offset by a tiny
    // perpendicular GAP → they merge into ONE fat diameter (the v2 Net Tunnel line), not 3 separate
    // spokes. q9 is driven fast + CONSTANT from frame() while the tunnel is engaged (≈3.4 rad/s ×4).
    var th = (a.q9 || 0) * 4.0;
    var len = (a.q5 || 0.4) * 1.45,
      disp = (a.value1 || 0) * (a.q6 || 0.05) * 1.8;
    var off = disp + (seg - 1) * 0.0012; // perpendicular = live-waveform jag + thin thickness gap
    var cx = a.q2 !== undefined ? a.q2 : 0.5,
      cy = a.q3 !== undefined ? a.q3 : 0.5;
    a.x = cx + s * len * Math.cos(th) - off * Math.sin(th);
    a.y = cy + s * len * Math.sin(th) + off * Math.cos(th);
    var h = a.q8 || 0;
    a.r = orbCol(h, 0);
    a.g = orbCol(h, 0.33);
    a.b = orbCol(h, 0.67);
    if (u < 0.02) a.a = 0; // hide the copy-to-copy jump
    // STROBE (tunnel): once engaged (q11>0.5) stamp the spoke ONLY on strobe frames (q10) so discrete
    // spokes accumulate into a fan under the still high-decay camera, instead of a continuous smear.
    if ((a.q11 || 0) > 0.5 && (a.q10 || 0) < 0.5) a.a = 0;
    return a;
  }
  // FOUNTAIN — the v2 radial-burst "fountain": ~48 waveform spokes spraying OUTWARD from the centre
  // (vs the urchin's amplitude-radius ring). Spins (q9) + blooms; pairs with the vortex/burst looks.
  function fFountain(a) {
    var N = 48,
      fk = (a.sample || 0) * N,
      seg = Math.floor(fk),
      u = fk - seg;
    var ang = (seg / N) * 6.2832 + (a.q9 || 0);
    var rad = (a.q5 || 0.4) * (0.1 + 0.9 * u) + (a.value1 || 0) * 0.06 * u; // spoke centre→out, waveform-tipped
    var cx = a.q2 !== undefined ? a.q2 : 0.5,
      cy = a.q3 !== undefined ? a.q3 : 0.5;
    a.x = cx + rad * Math.cos(ang);
    a.y = cy + rad * Math.sin(ang);
    var h = a.q8 || 0;
    a.r = orbCol(h, 0);
    a.g = orbCol(h, 0.33);
    a.b = orbCol(h, 0.67);
    if (u < 0.03) a.a = 0; // hide spoke-to-spoke jump
    return a;
  }
  // WAVEFAN — the big bold horizontal oscilloscope waveform of the 2:40-2:50 scene (orig rot_06..10):
  // the live audio drawn WIDE across centre with tall peaks (a mountain range), a green→yellow→magenta
  // gradient along it. Under the #24 look's downward drift + high decay the trail smears into the fine
  // descending comb-fan; the two big orbs ride near it. Real-waveform (primary-motif rule).
  function fWaveFan(a) {
    var cx = a.q2 !== undefined ? a.q2 : 0.5,
      cy = a.q3 !== undefined ? a.q3 : 0.5;
    var width = (a.q5 || 0.4) * 2.1; // wide horizontal span
    var amp = (a.q6 || 0.05) * 4.8; // tall waveform peaks
    a.x = cx + (a.sample - 0.5) * width;
    a.y = cy + (a.value1 || 0) * amp + (a.value2 || 0) * amp * 0.25;
    var h = (a.q8 || 0) + a.sample * 0.34; // green→yellow→magenta gradient along the wave
    a.r = orbCol(h, 0);
    a.g = orbCol(h, 0.33);
    a.b = orbCol(h, 0.67);
    return a;
  }
  // RIBBON (mode 9) — the iridescent 3D ribbon plane (orig scenes 21-23, 1:55-2:11): a WIDE real-
  // waveform BAND on a STEEP diagonal axis, FULL-RAINBOW along its length (the v2 duotone miss). The
  // ribbon LOOK's diagonal feedback push + high decay smear it into the combed iridescent sheet.
  function fRibbon(a) {
    var cx = a.q2 !== undefined ? a.q2 : 0.5,
      cy = a.q3 !== undefined ? a.q3 : 0.5;
    var ct = Math.cos(0.65),
      st = Math.sin(0.65); // ~37° steep diagonal axis (matches the v2 Ribbon ANGLE)
    var width = (a.q5 || 0.4) * 2.1,
      amp = (a.q6 || 0.05) * 4.2;
    var along = (a.sample - 0.5) * width;
    var disp = (a.value1 || 0) * amp + (a.value2 || 0) * amp * 0.25; // real-waveform jag (primary-motif rule)
    a.x = cx + along * ct - disp * st;
    a.y = cy + along * st + disp * ct;
    var h = (a.q8 || 0) + a.sample * 0.85; // FULL rainbow along the axis: cyan→green→magenta→gold
    a.r = orbCol(h, 0);
    a.g = orbCol(h, 0.33);
    a.b = orbCol(h, 0.67);
    return a;
  }
  // STAR-NET (mode 10) — the face-on straight-line WIRE / spirograph star-net mandala (orig Era-D spine,
  // also A t11/t33, B t79): N long CRISP STRAIGHT diameter lines through center (FIXED length) with only a
  // SMALL perpendicular live-waveform jag → a clean star, NOT a bristly rosette. Reads as a mandala when
  // folded, as a corridor net when the orbiter-row (wave[3]) + a recede look are active. Steered onto the
  // VOID bg from frame() so the wires glow on black. Mild green/teal bias (the original net is green).
  function fStarNet(a) {
    var N = 6,
      fk = (a.sample || 0) * N,
      seg = Math.floor(fk),
      u = fk - seg,
      s = u * 2 - 1;
    var th = seg * (3.14159 / N) + (a.q9 || 0) * 0.5; // 6 arms, slow rotation
    var len = (a.q5 || 0.4) * 1.5;
    var jag = (a.value1 || 0) * (a.q6 || 0.05) * 1.2; // SMALL crisp jag (not a bristle)
    var cx = a.q2 !== undefined ? a.q2 : 0.5,
      cy = a.q3 !== undefined ? a.q3 : 0.5;
    a.x = cx + s * len * Math.cos(th) - jag * Math.sin(th);
    a.y = cy + s * len * Math.sin(th) + jag * Math.cos(th);
    var h = (a.q8 || 0) + 0.2; // green/teal lean
    a.r = orbCol(h, 0);
    a.g = orbCol(h, 0.33);
    a.b = orbCol(h, 0.67);
    if (u < 0.02) a.a = 0; // hide arm-to-arm jump
    return a;
  }
  // CROSSED-X (mode 11) — two iridescent live-waveform BEAMS crossing at ±45° (orig A t38, C t127, D t145/
  // t150). The "Dance two-lines" idea as an X; pairs with the PRISM COMP split + the orbs as beam-tip
  // end-caps, on the VOID bg. Real-waveform jag (primary-motif rule).
  function fCrossX(a) {
    var half = (a.sample || 0) < 0.5 ? 0 : 1,
      u = ((a.sample || 0) - half * 0.5) * 2.0,
      s = u * 2 - 1;
    var ang = half ? 0.7854 : -0.7854; // +45° / -45°
    var ct = Math.cos(ang),
      st = Math.sin(ang);
    var len = (a.q5 || 0.4) * 1.6;
    var jag = (a.value1 || 0) * (a.q6 || 0.05) * 2.2;
    var cx = a.q2 !== undefined ? a.q2 : 0.5,
      cy = a.q3 !== undefined ? a.q3 : 0.5;
    a.x = cx + s * len * ct - jag * st;
    a.y = cy + s * len * st + jag * ct;
    var h = (a.q8 || 0) + a.sample * 0.5; // iridescent gradient (PRISM COMP adds the channel split)
    a.r = orbCol(h, 0);
    a.g = orbCol(h, 0.33);
    a.b = orbCol(h, 0.67);
    if (u < 0.02) a.a = 0; // hide the half-to-half jump
    return a;
  }
  var MODES = [
    fAnem,
    fSpin,
    fNgon,
    fTri,
    fBolt,
    fUrchin,
    fRotLine,
    fFountain,
    fWaveFan,
    fRibbon,
    fStarNet,
    fCrossX,
  ];
  // per-mode alpha: dense ADDITIVE bristle modes (spindle/fountain) saturate to milky white in the
  // feedback buffer (equilibrium ~ input/(1-decay)), so they get much less alpha than outline modes.
  var MODE_ALPHA = [0.62, 0.42, 0.95, 0.85, 0.85, 0.72, 0.68, 0.5, 0.8, 0.55, 0.72, 0.7]; // …·ribbon·STARNET·CROSSX (crisp lines → moderate alpha)
  function scaleFor(m) {
    return m === 0 ? 0.46 : m === 1 ? 0.4 : 0.5;
  }
  function centralDraw(a) {
    var m = Math.floor((a.q30 || 0) + 0.5);
    if (m < 0) m = 0;
    if (m >= MODES.length) m = MODES.length - 1;
    MODES[m](a);
    // PULSAR oblate squash — the anemone/urchin (modes 0/5) read as a TILTED 3D eye, not a flat
    // face-on circle. Vertical squash about center; strength = focus amount (q11). Disabled under a
    // fold (q12>1.5) so the mirrored kaleido wedges stay clean (gotcha §8c).
    if ((m === 0 || m === 5) && (a.q12 || 1) < 1.5) {
      var cyS = a.q3 !== undefined ? a.q3 : 0.5;
      a.y = cyS + (a.y - cyS) * (1.0 - 0.34 * (a.q11 || 0));
    }
    a.a = (a.a === undefined ? 0.85 : a.a) * (a.q4 || 0) * MODE_ALPHA[m]; // q4 = visibility dip-swap
    return a;
  }
  var fTether = alcTether("q21", "q22", "q23", "q24", "q26", ALC_PAL.warm).point_eqs;

  // ── LOOKS — each bundles camera + exposure + fold + decay (NOT the motif, NOT the bg: those have
  //    their own independent clocks). Two looks engage the kaleidoscope fold (q12=4 quad / 6 radial).
  //    decay floored to >=0.90 so the persistent feedback trail carries continuity across morphs. ──
  // decay tuned to 0.84–0.92: high enough to keep a continuity trail, low enough that additive
  // bristles DON'T accumulate into a milky white-out. exp kept ~0.8–0.95 (Reinhard does the rest).
  var LOOKS = [
    {
      decay: 0.88,
      fold: 1,
      zoom: 0.0,
      rot: 0.0,
      swirl: 0.0,
      dx: 0,
      dy: -0.001,
      tilt: 0.1,
      tiltOsc: 0.05,
      pan: 0.04,
      px: 0.5,
      py: 0.5,
      exp: 0.9,
    }, // free-space, gentle rise
    {
      decay: 0.86,
      fold: 1,
      zoom: 0.018,
      rot: 0.004,
      swirl: 0.0,
      dx: 0,
      dy: 0.0,
      tilt: 0.3,
      tiltOsc: 0.03,
      pan: 0.02,
      px: 0.5,
      py: 0.5,
      exp: 0.92,
    }, // corridor: forward fly + steep tilt
    {
      decay: 0.93,
      fold: 1,
      zoom: -0.006,
      rot: 0.022,
      swirl: 0.14,
      dx: 0,
      dy: 0.0,
      tilt: 0.05,
      tiltOsc: 0.04,
      pan: 0.06,
      px: 0.46,
      py: 0.43,
      exp: 0.88,
    }, // vortex DRAIN (inward swirl spiral)
    {
      decay: 0.93,
      fold: 4,
      zoom: 0.004,
      rot: 0.01,
      swirl: 0.0,
      dx: 0,
      dy: 0.0,
      tilt: 0.0,
      tiltOsc: 0.03,
      pan: 0.02,
      px: 0.5,
      py: 0.5,
      exp: 0.92,
    }, // QUAD kaleidoscope (high decay → swept X-fan)
    {
      decay: 0.88,
      fold: 1,
      zoom: 0.0,
      rot: 0.003,
      swirl: 0.0,
      dx: 0,
      dy: -0.0008,
      tilt: 0.08,
      tiltOsc: 0.05,
      pan: 0.05,
      px: 0.5,
      py: 0.5,
      exp: 0.9,
    }, // anemone free-space
    {
      decay: 0.87,
      fold: 1,
      zoom: 0.008,
      rot: 0.0,
      swirl: 0.02,
      dx: 0,
      dy: 0.0,
      tilt: 0.12,
      tiltOsc: 0.04,
      pan: 0.06,
      px: 0.52,
      py: 0.48,
      exp: 0.9,
    }, // side-angle drift
    {
      decay: 0.93,
      fold: 8,
      zoom: 0.0,
      rot: 0.008,
      swirl: 0.0,
      dx: 0,
      dy: 0.0,
      tilt: 0.04,
      tiltOsc: 0.03,
      pan: 0.0,
      px: 0.5,
      py: 0.5,
      exp: 0.92,
    }, // NEW full DIAGONAL-X kaleidoscope (centred; orig 0:29 f_18). Look 3 keeps the quad fold.
    {
      decay: 0.9,
      fold: 1,
      zoom: -0.012,
      rot: 0.0,
      swirl: 0.03,
      dx: 0,
      dy: -0.001,
      tilt: 0.05,
      tiltOsc: 0.05,
      pan: 0.03,
      px: 0.5,
      py: 0.5,
      exp: 0.92,
    }, // burst bloom outward
  ];

  // director state (closure → persists across frames; this is ONE preset, never reloaded)
  var lastT = 0,
    huePhase = 0,
    waveAmt = 0,
    tunnelAmt = 0, // mode 6 active → still high-decay tunnel camera + strobe window
    focusAmt = 0, // modes 0/5/6 active → COMP central pupil + (anemone) oblate squash
    ribAmt = 0, // mode 9 active → diagonal ribbon feedback streak
    netVoid = 0, // modes 10/11 active → near-black VOID stage (wire/X read as the only light)
    lastStrobeT = 0,
    strobeOn = 1;
  var beat = alcBeatFlash({ rise: 1.22 });
  var lookPick = makePicker(LOOKS.length, 9, 16, 4.0); // camera/look — slow, long morph
  var bgPick = makePicker(6, 14, 26, 5.0); // 6 bg variants: moiré-DOTS/moiré-STRIPES/marble/horizon/ribbon/aurora — own slow clock
  var motifPick = makePicker(MODES.length, 6, 12, 2.0); // central motif — own clock, dip-swap

  function frame(t) {
    var time = t.time || 0;
    var bass = t.bass || 1,
      bassA = t.bass_att !== undefined ? t.bass_att : bass;
    var dt = Math.min(0.05, Math.max(0.001, time - lastT));
    lastT = time;
    var energy = typeof alcEnergy === "function" ? alcEnergy(t) : bassA;
    var f = beat(t.bass || 1, dt); // per-beat flash (fast decay)

    // shared HUE clock (fg + bg) — mostly clock-driven, faster when loud, tiny per-beat warm nudge
    huePhase = alcHueClock(huePhase, dt, Math.max(0, energy - 1), 0.02, 0.05);
    t.q8 = huePhase + 0.04 * f;

    // LOOK — camera + exposure + fold eased between two looks on a slow clock
    var lk = lookPick(time, dt, f > 0.6),
      A = LOOKS[lk.a],
      B = LOOKS[lk.b],
      k = lk.mix;
    function L(key) {
      return A[key] + (B[key] - A[key]) * k;
    }
    t.q1 = L("decay");
    var fold = k < 0.5 ? A.fold : B.fold; // fold is discrete (snap at midpoint, hidden by morph)
    t.q12 = fold;
    t.q13 =
      fold > 1.5 && fold < 7.5
        ? 0.6 + 0.4 * Math.min(1, bassA - 1 + 0.5 * Math.sin(time * 0.07))
        : 0; // fold>=8 = the COMP diagonal full-mirror (WARP itself doesn't fold it)
    t.q15 = L("zoom") + 0.006 * (bassA - 1) + 0.004 * Math.sin(time * 0.13); // per-look zoom (no global recede — it smeared bristles into a net)
    t.q16 = L("rot") + 0.055 * Math.sin(time * 0.045); // slow camera ROLL (axis rocks ±~3°) → not a locked top-view
    t.q17 = L("swirl") + (L("swirl") ? 0.03 * (bassA - 1) : 0);
    t.q18 = L("dx");
    t.q19 = L("dy");
    var pan = L("pan");
    t.q20 = L("px") + pan * Math.cos(time * 0.11); // VP orbits → parallax
    t.q27 = L("py") + pan * Math.sin(time * 0.11);
    t.q28 = L("tilt") * 1.4 + L("tiltOsc") * Math.sin(time * 0.1); // stronger 3D plane tilt (side-angle)
    t.q31 = L("exp") * (1 + 0.12 * (bassA - 1) + 0.22 * f); // gentle beat lift (Reinhard compresses the rest)
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
    t.q4 = 0.85 * (1 - 0.75 * Math.exp(-dd * dd)); // dips to ~0.21 at the swap instant
    // #24 SCENE amount — eased toward 1 while the WAVEFAN motif (mode 8) is active, so the 2:40-2:50 look
    // (big clustered orbs + downward comb-fan) BLEEDS in/out rather than cutting.
    waveAmt += ((mCur === 8 ? 1 : 0) - waveAmt) * Math.min(1, dt * 0.8);
    tunnelAmt += ((mCur === 6 ? 1 : 0) - tunnelAmt) * Math.min(1, dt * 0.6);
    focusAmt +=
      ((mCur === 0 || mCur === 5 || mCur === 6 ? 1 : 0) - focusAmt) * Math.min(1, dt * 0.6);
    ribAmt += ((mCur === 9 ? 1 : 0) - ribAmt) * Math.min(1, dt * 0.8);
    netVoid += ((mCur === 10 || mCur === 11 ? 1 : 0) - netVoid) * Math.min(1, dt * 0.5);

    // MOTIF contract (read by the kit factories)
    t.q2 = 0.5;
    t.q3 = 0.5;
    t.q5 = scaleFor(mCur) * (0.82 + 0.4 * (bassA - 1) + 0.22 * f); // breathing + per-beat pop
    if (fold > 1.5 && mCur !== 6 && mCur !== 9 && mCur !== 10 && mCur !== 11) t.q5 *= 0.52; // small mirrored flower under a fold; keep line/ribbon/star-net/X (6/9/10/11) FULL-length
    t.q6 = 0.05;
    t.q9 = time * 0.06; // slow spin
    t.q10 = 0.4 * Math.max(0, bassA - 1); // twist scales with bass

    // ORBS + TETHER — wide opposite-corner diagonal (separation ~0.6w, never crossing center).
    // STAGING: orb A is a near-persistent anchor; orb B comes & goes on its own phase → single↔pair;
    // the tether is gated to appear only when BOTH orbs are clearly present → sometimes-tethered.
    // visibility — non-periodic come-and-go (summed incommensurate sines). BOTH orbs fully disappear
    // now and then (the original has orb-absent moments — w_ripple f_30). Orb A is biased to be
    // present most of the time but DROPS TO 0 periodically; orb B varies more, out of phase with A.
    t.q25 = comeGo(0.3 + 0.6 * Math.sin(time * 0.06 + 0.3) + 0.38 * Math.sin(time * 0.027 + 2.2));
    t.q14 = comeGo(0.6 * Math.sin(time * 0.055 + 1.7) + 0.4 * Math.sin(time * 0.026 + 0.4));
    // PATH — the pair axis rotates through ALL directions (non-uniformly) with breathing separation +
    // independent per-orb wander, so the orbs stop retracing the same fixed diagonal (user note, #19).
    var axis = time * 0.05 + 0.6 * Math.sin(time * 0.017);
    var sep = 0.3 + 0.06 * Math.sin(time * 0.037),
      wob = 0.35 * Math.sin(time * 0.043);
    t.q21 = 0.5 + sep * Math.cos(axis) + 0.045 * Math.sin(time * 0.09);
    t.q22 = 0.5 + sep * Math.sin(axis) + 0.045 * Math.cos(time * 0.081);
    t.q23 = 0.5 - sep * Math.cos(axis + wob) + 0.045 * Math.sin(time * 0.071 + 2.0);
    t.q24 = 0.5 - sep * Math.sin(axis + wob) + 0.045 * Math.cos(time * 0.063 + 1.0);
    t.q7 = (0.06 + 0.02 * Math.max(0, bass - 1)) * (1 + 0.4 * f); // orb radius (pops on beat)
    t.q26 = 0.06 * (0.5 + 0.7 * bassA); // tether jag amplitude (audio-coupled)
    // #24 SCENE morph (eased by waveAmt): BIG orbs clustered centre-left on a slow diagonal + a downward
    // drift so the waveform trail smears into the descending comb-fan; both orbs present (soft spheres).
    if (waveAmt > 0.01) {
      var wa = waveAmt,
        ca = time * 0.03;
      t.q19 -= 0.004 * wa; // downward drift → descending comb
      t.q1 += (0.945 - t.q1) * 0.6 * wa; // a touch more decay for the comb trail
      t.q7 *= 1 + 1.3 * wa; // BIG orbs
      t.q21 += (0.4 + 0.05 * Math.cos(ca) - t.q21) * wa;
      t.q22 += (0.44 + 0.05 * Math.sin(ca) - t.q22) * wa;
      t.q23 += (0.58 + 0.05 * Math.cos(ca + 1.3) - t.q23) * wa;
      t.q24 += (0.56 + 0.05 * Math.sin(ca + 1.3) - t.q24) * wa;
      t.q25 = Math.max(t.q25, wa);
      t.q14 = Math.max(t.q14, wa); // both orbs present
      t.q13 *= 1 - wa; // #24 is NOT folded — fade out any kaleidoscope fold strength
      if (wa > 0.5) t.q12 = 1; // and kill the diagonal-X fold (not q13-gated) once mostly in-scene
      t.q29 += (5.5 - t.q29) * wa; // calm aurora ground (aurora is index 5 now there are 6 bg variants)
    }
    // NET TUNNEL coupling (mode 6): hold the buffer STILL at high decay so the brisk STROBED spokes
    // accumulate into a fan/tunnel (the v2 Net Tunnel mechanism); bias the bg to aurora edge-bleed.
    if (tunnelAmt > 0.01) {
      var ta = tunnelAmt;
      t.q9 = time * 0.06 * (1 - ta) + time * 0.85 * ta; // brisk CONSTANT spin (×4 in fRotLine ≈ 3.4 rad/s, the v2 rate)
      t.q15 += (0.0 - t.q15) * ta; // kill zoom
      t.q16 += (0.0 - t.q16) * ta; // kill roll (else the held spokes spiral — gotcha §8b)
      t.q17 += (0.0 - t.q17) * ta; // kill swirl
      t.q18 += (0.0 - t.q18) * ta;
      t.q19 += (0.0 - t.q19) * ta; // kill translate
      t.q28 += (0.0 - t.q28) * ta; // kill tilt
      t.q13 *= 1 - ta; // no fold strength
      if (ta > 0.5) t.q12 = 1; // no fold geometry (a tunnel is unfolded)
      t.q1 += (0.972 - t.q1) * ta; // raise decay → long hold (safe ONLY because the strobe keeps input sparse)
      t.q29 += (5.5 - t.q29) * ta; // aurora edge-bleed bg
      if (mCur === 6) {
        // strobe ~33/s → discrete spokes (set AFTER the q10 twist assignment above so it wins for mode 6)
        if (time - lastStrobeT >= 0.03) {
          strobeOn = 1;
          lastStrobeT = time;
        } else strobeOn = 0;
        t.q10 = strobeOn;
      }
    }
    // RIBBON coupling (mode 9): diagonal feedback push + high decay → the combed iridescent streak.
    if (ribAmt > 0.01) {
      var ra = ribAmt;
      t.q1 += (0.95 - t.q1) * ra; // longer streak trail
      t.q18 += (-0.0015 - t.q18) * ra; // push down-left ALONG the ~37° ribbon axis
      t.q19 += (-0.0011 - t.q19) * ra;
      t.q15 += (-0.004 - t.q15) * ra; // slight vanishing-point recede
      t.q13 *= 1 - ra; // no fold (a flowing band folds into a spirograph tangle — gotcha §8c)
      if (ra > 0.5) t.q12 = 1;
    }
    // VOID stage (modes 10/11 — wire star-net / crossed-X): steer the bg toward near-black, eased so it
    // fades in/out (q29 5.5..5.9 → COMP voidAmt crush) and the wires read as the only light.
    if (netVoid > 0.01) t.q29 = 5.5 + 0.4 * netVoid;
    t.q11 = focusAmt; // COMP pupil amount + anemone-squash strength (high for modes 0/5/6)
    return t;
  }

  // ── build the single preset: WAVE0 central motif · WAVE1 spindle companion (density) ·
  //    WAVE2 tether · two filled-orb SHAPES. (WAVE3 + SHAPE2/3 left free for later layers.) ──
  var preset = build(BASE, { frame: frame, warp: WARP_V4, comp: COMP_V4 });
  preset.waves[0] = {
    baseVals: Object.assign({}, WAVE_BASE, {
      enabled: 1,
      samples: 512,
      additive: 1,
      usedots: 0,
      scaling: 1,
      smoothing: 0.05,
      thick: 1,
      a: 0.62,
    }),
    init_eqs: passthrough,
    frame_eqs: passthrough,
    point_eqs: function (a) {
      return centralDraw(a);
    },
  };
  // waves[1] = STAR-NET inner lattice — a 2nd straight-line star rotated a half-step + shorter, so the
  // wire-net mode (10) reads as a denser 12-point spirograph lattice. Gated to ~0 alpha on every other
  // mode (read q30) so it never bleeds through unrelated motifs (no-always-on, gotcha §8d).
  preset.waves[1] = {
    baseVals: Object.assign({}, WAVE_BASE, {
      enabled: 1,
      samples: 512,
      additive: 1,
      usedots: 0,
      scaling: 1,
      smoothing: 0.05,
      thick: 1,
      a: 0.5,
    }),
    init_eqs: passthrough,
    frame_eqs: passthrough,
    point_eqs: function (a) {
      if (Math.abs((a.q30 || 0) - 10) > 0.5) {
        a.a = 0;
        return a;
      }
      var N = 6,
        fk = (a.sample || 0) * N,
        seg = Math.floor(fk),
        u = fk - seg,
        s = u * 2 - 1;
      var th = seg * (3.14159 / N) + 3.14159 / (N * 2) + (a.q9 || 0) * 0.5; // half-step offset
      var len = (a.q5 || 0.4) * 0.85,
        jag = (a.value1 || 0) * (a.q6 || 0.05) * 1.0;
      var cx = a.q2 !== undefined ? a.q2 : 0.5,
        cy = a.q3 !== undefined ? a.q3 : 0.5;
      a.x = cx + s * len * Math.cos(th) - jag * Math.sin(th);
      a.y = cy + s * len * Math.sin(th) + jag * Math.cos(th);
      var h = (a.q8 || 0) + 0.2;
      a.r = orbCol(h, 0);
      a.g = orbCol(h, 0.33);
      a.b = orbCol(h, 0.67);
      a.a = u < 0.02 ? 0 : 0.5;
      return a;
    },
  };
  preset.waves[2] = {
    // jagged REAL-waveform tether spanning the two orbs (gated: both present)
    baseVals: Object.assign({}, WAVE_BASE, {
      enabled: 1,
      samples: 512,
      additive: 0,
      usedots: 0,
      scaling: 1,
      smoothing: 0.0,
      thick: 1,
      a: 0.9,
    }),
    init_eqs: passthrough,
    frame_eqs: passthrough,
    point_eqs: function (a) {
      fTether(a);
      var g = Math.max(0, (Math.min(a.q25 || 0, a.q14 || 0) - 0.45) / 0.55); // both orbs present
      var beatG = Math.max(0, Math.min(1, ((a.q32 || 1) - 1.05) / 0.4)); // BEAT gate: flashes on the kick, gone when quiet (orig 0:27-0:39 — not permanent)
      a.a = (a.a === undefined ? 0.9 : a.a) * g * beatG;
      return a;
    },
  };
  // waves[3] = NET-CORRIDOR orbiter ROW — a row of ~8 dots receding from a near-left point toward the
  // WARP vanishing point (q20,q27), fading with depth → the marching-orbiter corridor (orig Era-A intro).
  // Gated to the wire-net mode (10) so a star-net under a recede look reads as the corridor (no new q-var:
  // it shares mode 10 with the net + lattice). Dots-mode; the spare 4th wave slot, 0 shape budget.
  preset.waves[3] = {
    baseVals: Object.assign({}, WAVE_BASE, {
      enabled: 1,
      samples: 64,
      additive: 1,
      usedots: 1,
      scaling: 1,
      smoothing: 0.0,
      thick: 1,
      a: 0.8,
    }),
    init_eqs: passthrough,
    frame_eqs: passthrough,
    point_eqs: function (a) {
      if (Math.abs((a.q30 || 0) - 10) > 0.5) {
        a.a = 0;
        return a;
      }
      var K = 8,
        depth = Math.floor((a.sample || 0) * K) / (K - 1); // 0 near → 1 far (8 dots)
      var vpx = a.q20 !== undefined ? a.q20 : 0.5,
        vpy = a.q27 !== undefined ? a.q27 : 0.5;
      var nearX = 0.15,
        nearY = 0.5;
      a.x = nearX + (vpx - nearX) * depth;
      a.y = nearY + (vpy - nearY) * depth;
      var h = a.q8 || 0;
      a.r = orbCol(h, 0);
      a.g = orbCol(h, 0.33);
      a.b = orbCol(h, 0.67);
      a.a = 0.85 * (1 - depth * 0.65); // fade with depth → corridor recede cue
      return a;
    },
  };
  preset.shapes[0] = orbShape("q21", "q22", 0.0, "q25"); // orb A (near-persistent anchor)
  preset.shapes[1] = orbShape("q23", "q24", 0.35, "q14"); // orb B (comes & goes; different hue)
  preset.shapes[2] = orbGlow("q21", "q22", 0.0, "q25"); // NEW gradient glow-halo for orb A (existing orb UNCHANGED)
  preset.shapes[3] = orbGlow("q23", "q24", 0.35, "q14"); // NEW gradient glow-halo for orb B

  P["Alchemy V4: Random"] = preset;
})();
