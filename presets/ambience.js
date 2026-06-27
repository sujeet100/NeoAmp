/* Ambience family presets (13) for the WMP visualizer.
 * Plain <script> loaded AFTER presets/kit.js; registers into window.WMP_PRESETS.
 * Uses the shared kit globals (build, circleWave, ALC_PAL, alc* factories, ...).
 */
(function () {
  "use strict";
  var P = (window.WMP_PRESETS = window.WMP_PRESETS || {});

  // ── Ambience Thingus ─────────────────────────────────────────────────────
  // Re-derived frame-by-frame from "YouTube Ambience Thingus 480p.mp4":
  //   • A swirling PINWHEEL of curved spiral arms around ONE strong central eye,
  //     with a jagged near-white oscilloscope BOLT (the live audio waveform,
  //     displaced perpendicular to two crossing lines) riding on top. The arms
  //     are the bolt's fading trail, curled by a single centered feedback SWIRL
  //     (warp: polar rotate + gentle zoom-out). (An earlier build dropped the
  //     swirl fearing "extra vortex eyes", giving a straight 4-arm X — wrong; the
  //     reference clearly swirls around one eye.)
  //   • The whole frame is filled with a single GLOBAL hue that jumps to a RANDOM
  //     new hue every few seconds (crossfaded). Vivid monochrome (NOT amber),
  //     fading to a dark hue when the music drops.
  //   • Bass "breathes" the zoom slightly; the bolt rotates slowly CCW.
  //   NOTE: under SYNTHETIC audio the arms look scratchy/fine; real music has a
  //   smoother waveform → broader, cleaner arms. Tune texture from live feedback.
  P["Ambience Thingus"] = (function () {
    var preset = build(
      {
        wave_a: 0, // primary waveform off; the two custom lines draw the cross
        decay: 0.94, // trails smear into soft arms, but short enough to stay clean
        gammaadj: 1.4,
        zoom: 1.0,
        rot: 0.01,
        warp: 0.02,
        warpscale: 1.2,
        warpanimspeed: 0.4,
        // wrap:0 — wrapping was smearing off-edge pixels back as blocky edge
        // artifacts; clamp instead so the spiral dissipates cleanly into the void.
        cx: 0.5,
        cy: 0.5,
        darken_center: 0,
        wrap: 0,
      },
      {
        frame: function (t) {
          var bass = t.bass_att || t.bass || 1;
          var mid = t.mid_att || t.mid || 1;
          var treb = t.treb_att || t.treb || 1;
          t.q1 = t.time * 0.28; // the CROSS visibly rotates CCW
          t.q5 = 0.72; // half-length (reaches the edges)
          t.q6 = 0.1 + 0.3 * Math.min(0.6 * treb + 0.4 * mid, 2.4); // waveform amplitude (the jaggedness)
          t.q7 = 0.06 + 0.04 * bass; // gentle S-bend depth
          t.q10 = Math.min(0.6 + 0.7 * bass, 1.5); // bolt brightness PULSES with bass
          // The bolt rotates (q1); a single centered SWIRL in the warp curls its fading
          // trail into the pinwheel arms (rot=0 so the spin lives in the warp, not a
          // rigid background spin).
          t.rot = 0.0;
          t.zoom = 1.0 + 0.035 * (bass - 1.0); // beat zoom breathe (back by request)
          t.decay = 0.94; // longer trails so the swirl smears strokes into smooth curved arms
          return t;
        },
        // A single centered SWIRL (polar rotate + gentle zoom-out): each frame the
        // feedback is rotated tangentially and pushed outward, so the bolt's fading
        // trail smears into curved spiral ARMS — the reference pinwheel. (We earlier
        // feared "extra vortex eyes" and dropped the swirl, but the 480p reference
        // clearly has ONE strong swirl eye, so a single centered swirl is correct.)
        warp:
          "shader_body {\n" +
          "vec2 d = uv - 0.5;\n" +
          "float pr = length(d);\n" +
          "float pang = atan(d.y, d.x);\n" +
          "pang += 0.16 * (0.55 + 0.45 * (1.0 - pr));\n" + // swirl stronger near center
          "pr *= 0.992;\n" + // arms spiral slowly outward
          "vec2 w = vec2(0.5) + pr * vec2(cos(pang), sin(pang));\n" +
          "ret = texture2D(sampler_main, w).rgb;\n" +
          "ret -= 0.005;\n" +
          "}\n",
        // THICK lines: dilate the bright feedback by taking the max luminance over
        // a ring of taps (radius in screen pixels), so a thin bolt becomes a fat
        // band. The radius PULSES with the bass (thicker on the beat). Then fill
        // the WHOLE frame with one global hue that jumps to a RANDOM new hue every
        // ~6s (crossfaded); dim feedback keeps the hue, only the fat bolt glows
        // white. Slightly desaturated (vivid, not neon); soft tonemap.
        comp:
          "float h1d(float x){ return fract(sin(x*12.9898)*43758.5453); }\n" +
          "float lc(vec3 c){ return max(c.r, max(c.g, c.b)); }\n" +
          PAL_GLSL +
          "shader_body {\n" +
          "vec3 src = texture2D(sampler_main, uv).rgb;\n" +
          "float R = 4.0 + 8.0 * bass;\n" + // line thickness (px) — thin/crisp; the swirl makes the arms, not dilation
          "vec2 ips = vec2(1.0 / resolution.x, 1.0 / resolution.y);\n" +
          "float lum = lc(src);\n" +
          // ONE ring x 8 directions -> thicken the bolt a little without balling it into blobs.
          "for (int ri = 0; ri < 1; ri++) {\n" +
          "  float rr = R * (ri == 0 ? 1.0 : 0.5);\n" +
          "  vec2 ex = vec2(rr, 0.0) * ips;\n" +
          "  vec2 ey = vec2(0.0, rr) * ips;\n" +
          "  vec2 ed = vec2(rr * 0.7071) * ips;\n" +
          "  lum = max(lum, lc(texture2D(sampler_main, uv + ex).rgb));\n" +
          "  lum = max(lum, lc(texture2D(sampler_main, uv - ex).rgb));\n" +
          "  lum = max(lum, lc(texture2D(sampler_main, uv + ey).rgb));\n" +
          "  lum = max(lum, lc(texture2D(sampler_main, uv - ey).rgb));\n" +
          "  lum = max(lum, lc(texture2D(sampler_main, uv + ed).rgb));\n" +
          "  lum = max(lum, lc(texture2D(sampler_main, uv - ed).rgb));\n" +
          "  lum = max(lum, lc(texture2D(sampler_main, uv + vec2(ed.x, -ed.y)).rgb));\n" +
          "  lum = max(lum, lc(texture2D(sampler_main, uv - vec2(ed.x, -ed.y)).rgb));\n" +
          "}\n" +
          "float seg = time / 6.0;\n" + // new random hue every ~6s
          "float i0 = floor(seg);\n" +
          "float f = smoothstep(0.0, 1.0, fract(seg));\n" +
          "float h = mix(h1d(i0), h1d(i0 + 1.0), f);\n" + // random hue, crossfaded
          "vec3 base = pal(h);\n" +
          "base = pow(base, vec3(1.5));\n" + // deepen (rich, not pastel)
          "float bl = dot(base, vec3(0.333));\n" +
          "base = clamp(bl + (base - bl) * 1.7, 0.0, 1.0);\n" + // boost saturation (kill muddy grays)
          "float fill = (0.12 + 0.20 * bass) + 0.5 * lum;\n" + // DEEP saturated hue field
          "vec3 col = base * fill;\n" +
          "col += vec3(1.0) * smoothstep(0.45, 0.95, lum) * 0.9;\n" + // the fat bolt pops stark WHITE
          "col = col / (col + 0.8);\n" + // gentler tonemap (less washout)
          "ret = col;\n" +
          "}\n",
      }
    );

    // One full lightning line through center at angle (q1 + offset): the live
    // waveform drawn from -len..+len, displaced PERPENDICULAR by the sample
    // (little wander near the centre, more toward the ends). White; the comp
    // tints the rest of the frame. Two of these (0 and 90deg) make the 4-arm X.
    function crossLine(offset, useV2) {
      return {
        baseVals: Object.assign({}, WAVE_BASE, {
          enabled: 1,
          samples: 512,
          additive: 1,
          usedots: 0,
          scaling: 1,
          smoothing: 0.5, // adjacent samples blend -> the bolt reads as a smooth band, not a grille
          a: 1.0,
          thick: 1,
          r: 1.0,
          g: 1.0,
          b: 1.0,
        }),
        init_eqs: passthrough,
        frame_eqs: passthrough,
        point_eqs: function (a) {
          var th = (a.q1 || 0) + offset;
          var ct = Math.cos(th),
            st = Math.sin(th);
          var s = a.sample * 2.0 - 1.0; // -1 .. +1 through centre
          var len = a.q5 || 0.7;
          var amp = a.q6 || 0.12;
          var samp = useV2 ? (a.value2 !== undefined ? a.value2 : a.value1) : a.value1;
          // Overall S-shape: sin(s*PI) is 0 at the centre and bends one way on each
          // half -> a smooth S. The live waveform jaggedness rides on top (also 0
          // at centre so the two lines still cross cleanly).
          var bend = (a.q7 || 0.1) * Math.sin(s * Math.PI);
          var disp = bend + samp * amp * Math.abs(s);
          a.x = 0.5 + s * len * ct - disp * st;
          a.y = 0.5 + s * len * st + disp * ct;
          var w = a.q10 !== undefined ? a.q10 : 1;
          a.r = w;
          a.g = w;
          a.b = w;
          return a;
        },
      };
    }
    preset.waves[0] = crossLine(0, false);
    preset.waves[1] = crossLine(Math.PI * 0.5, true);
    return preset;
  })();

  // ── Ambience Water ────────────────────────────────────────────────────────
  // A lit WATER SURFACE (re-derived from the 480p reference + WMP mechanics). Two STATIC
  // light sources: a central GLARE orb (hot white core) and a HORIZONTAL REFLECTION STREAK
  // (a long stretched lens-flare whose ends BLUR/widen toward the L/R edges). The canvas is
  // distorted by a per-pixel RADIAL ripple. ★ The MUSIC GENERATES RIPPLES: a bass hit DROPS
  // a new ring at the centre that travels slowly OUTWARD (a stone in a pond). It does NOT
  // zoom or flash — the glare, streak and overall brightness are CONSTANT. A gentle ambient
  // ripple is always emitted so the surface lives when quiet. Monochromatic, slow vivid hue
  // cycle; cores stay blown white. ONE procedural comp shader (no custom waves, no feedback)
  // => calm and fully controllable.
  P["Ambience Water"] = (function () {
    // Pure continuous water: the flow is TIME-DRIVEN only (no audio influence on flow speed or
    // amplitude), so the music can never speed up / slow down / throb the flow — it just flows.
    return build(
      {
        wave_a: 0, // nothing drawn to feedback; the comp shader paints everything
        decay: 0.9, // irrelevant (comp ignores the feedback buffer)
        gammaadj: 1.4,
        zoom: 1.0,
        rot: 0.0,
        warp: 0.0,
        cx: 0.5,
        cy: 0.5,
        wrap: 0,
      },
      {
        frame: function (t) {
          return t; // motion is purely time-driven; the music does not affect the flow
        },
        // COMP: the whole water surface, procedurally. fbm (NOISE_GLSL) = liquid irregularity;
        // hueCol() = slow monochromatic hue cycle.
        comp:
          NOISE_GLSL +
          "vec3 hueCol(float h, float s){\n" +
          "  vec3 rb = 0.5 + 0.5 * cos(6.2832 * (h + vec3(0.0, 0.33, 0.67)));\n" +
          "  return mix(vec3(1.0), rb, s);\n" + // s->0 white, s->1 full hue
          "}\n" +
          "shader_body {\n" +
          "vec2 p = uv - 0.5;\n" +
          "p.x *= resolution.x / resolution.y;\n" + // aspect-correct -> circular ripples
          "float pr = length(p);\n" + // radius (NOT 'rad' — reserved builtin)
          "float pang = atan(p.y, p.x);\n" + // angle (NOT 'ang' — reserved builtin)
          "float wob = fbm(vec2(pang * 1.3 + 3.0, pr * 2.0 - time * 0.04)) - 0.5;\n" +
          // ★ CONTINUOUS ripples (fluid, never stuttered): an always-emitting wave train flowing
          // OUTWARD from the centre. Amplitude is CONSTANT -> NO per-beat change, cannot stutter.
          // Intensity (q1) only gently nudges the continuous flow SPEED (a smooth change, no jump).
          "float amp = 0.55;\n" +
          "float ripple = amp * (sin(pr * 15.0 - time * 1.9 + wob) + 0.5 * sin(pr * 26.0 - time * 2.8 - 0.6 * wob));\n" +
          "float fsp = 0.70;\n" + // CONSTANT flow speed -> continuous flow; music never speeds/slows it
          // a slow DOMAIN MORPH so the caustic ridges DANCE/flow like real water (not just slide out)
          "float mph = 0.5 * fbm(vec2(pang * 1.2 + 2.0, time * 0.22));\n" +
          // RADIAL paint-splatter (not concentric): fbm on a CIRCLE (cos,sin)*scale (seamless in
          // angle) shifted outward by radius - flow -> streaks RADIATE from the centre & flow out.
          "float radPhase = pr * 3.5 - time * fsp - 0.6 * ripple + mph;\n" +
          "vec2 nc = vec2(cos(pang) * 2.6 + radPhase, sin(pang) * 2.6 + 0.4 * sin(time * 0.3 + pang));\n" +
          "float c1 = pow(1.0 - abs(2.0 * fbm(nc) - 1.0), 3.0);\n" +
          "vec2 nc2 = vec2(cos(pang) * 5.5 + radPhase * 1.6 + 4.0, sin(pang) * 5.5 + mph);\n" +
          "float c2 = pow(1.0 - abs(2.0 * fbm(nc2) - 1.0), 4.0);\n" +
          "float caustic = max(c1, 0.6 * c2);\n" +
          // LIGHTING: central glare lights the surface (caustics brightest near centre, fading
          // out into a lit pool); a hot white core reflection; the horizontal reflection streak
          // (sharp at the centre, fanning into a WIDER soft decay toward the L/R ends).
          "float lit = exp(-pr * pr * 3.5);\n" +
          "float core = exp(-pr * pr * 42.0);\n" +
          "float streakWob = 0.022 * sin(p.x * 7.0 - time * 1.0 + wob * 2.0) + 0.011 * sin(p.x * 13.0 + time * 0.6);\n" +
          "float yd = p.y + streakWob;\n" +
          "float kY = 1700.0 / (1.0 + 20.0 * abs(p.x));\n" + // sharp centre -> much wider ends
          "float streak = exp(-yd * yd * kY) * (0.45 + 0.55 * exp(-p.x * p.x * 0.6));\n" +
          // COMPOSE: the lit, rippling caustic water surface + hot core + reflection streak.
          "float surf = caustic * lit * 1.9;\n" +
          "float white = surf + core * 1.4 + streak * 1.0;\n" + // the bright (white) parts
          "float lum = white + 0.05;\n" + // + a dim floor so it's never pure black
          // COLOUR: monochromatic, slow vivid hue cycle (~40s); bright caustic ridges + core +
          // streak blow to WHITE (crisp white water highlights), dim surface takes the hue.
          "float hphase = time * 0.025;\n" +
          "vec3 hue = hueCol(hphase, 0.82);\n" +
          "vec3 col = hue * lum;\n" +
          "col = mix(col, vec3(1.0), smoothstep(0.5, 1.1, white));\n" +
          "col = col / (col + 0.5);\n" + // Reinhard tone-map -> soft highlights
          "col *= 1.5;\n" +
          "ret = col;\n" +
          "}\n",
      }
    );
  })();

  // ── Ambience Down the Drain ────────────────────────────────────────────────
  // Yellow caustics spiralling into a dark central hole: zoom-in + rotate.
  P["Ambience Down the Drain"] = build(
    {
      wave_mode: 0,
      wave_smoothing: 0.9,
      wave_scale: 0.5,
      additivewave: 1,
      wave_r: 1.0,
      wave_g: 0.82,
      wave_b: 0.25,
      wave_a: 0.8,
      decay: 0.965,
      gammaadj: 1.9,
      zoom: 0.99,
      rot: 0.1,
      warp: 0.06,
      warpscale: 1.2,
      cx: 0.55,
      cy: 0.5,
      darken_center: 0,
      wrap: 0,
    },
    {
      frame: function (t) {
        var bass = t.bass_att || t.bass || 1;
        var treb = t.treb || 1;
        t.zoom = 0.99 - 0.008 * bass; // gentle inward pull (was collapsing)
        t.rot = 0.08 + 0.06 * Math.sin(t.time * 0.2) + 0.02 * bass;
        t.cx = 0.55 + 0.01 * Math.sin(t.time * 0.3);
        t.decay = 0.965;
        t.wave_g = 0.78 + 0.12 * treb;
        return t;
      },
      warp:
        "shader_body {\n" +
        "vec2 p = uv - vec2(0.55, 0.5);\n" +
        "float a = atan(p.y, p.x);\n" +
        "float r = length(p);\n" +
        "a += 0.10 * (1.0 - r);\n" +
        "vec2 w = vec2(0.55,0.5) + r * vec2(cos(a), sin(a));\n" +
        "ret = texture2D(sampler_main, w).rgb;\n" +
        "ret -= 0.004;\n" +
        "}\n",
      comp:
        AMBER_RAMP +
        "shader_body {\n" +
        "vec3 src = texture2D(sampler_main, uv).rgb;\n" +
        "float v = dot(src, vec3(0.33)) * (1.0 + 0.3*bass);\n" +
        "v = 0.18 + 0.9 * v;\n" + // base so the field stays visible
        "float r = length(uv - vec2(0.55, 0.5));\n" +
        "v *= smoothstep(0.02, 0.11, r);\n" + // smaller drain hole
        "ret = amber_ramp(v);\n" +
        "}\n",
    }
  );

  // ════════════════════════════════════════════════════════════════════════
  // AMBIENCE family (amber/yellow fluid light; Niagara cycles yellow<->teal).
  // Authored batch 2 — built with real audio: built-in circular waveform or
  // circleWave/spokeLine, so the pulsing elements beat with the music.
  // ════════════════════════════════════════════════════════════════════════

  // ── Ambience Snell ──────────────────────────────────────────────────────────
  // Refraction (Snell's law): the live circular waveform bent through a rippling
  // amber "interface"; a warp displaces uv along a travelling lens so straight
  // light bands shimmer and bend with the audio. Fixed amber.
  P["Ambience Snell"] = (function () {
    var preset = build(
      {
        wave_mode: 0,
        wave_smoothing: 0.9,
        wave_scale: 0.5,
        additivewave: 1,
        wave_r: 1.0,
        wave_g: 0.85,
        wave_b: 0.3,
        wave_a: 0.45,
        decay: 0.96,
        gammaadj: 1.8,
        zoom: 1.0,
        rot: 0.0,
        warp: 0.12,
        warpscale: 1.8,
        warpanimspeed: 0.6,
        cx: 0.5,
        cy: 0.5,
        darken_center: 0,
        wrap: 1,
      },
      {
        frame: function (t) {
          var bass = t.bass_att || t.bass || 1;
          var treb = t.treb_att || t.treb || 1;
          t.warp = 0.1 + 0.06 * bass;
          t.warpanimspeed = 0.5 + 0.4 * treb;
          t.zoom = 1.0 + 0.004 * Math.sin(t.time * 0.3);
          t.rot = 0.01 * Math.sin(t.time * 0.2);
          t.decay = 0.96;
          t.wave_a = 0.3 + 0.3 * bass;
          t.wave_g = 0.82 + 0.1 * bass;
          return t;
        },
        warp:
          "shader_body {\n" +
          "vec2 w = uv;\n" +
          "float n = sin(uv.y * 9.0 + time * 0.7) + 0.6 * sin(uv.y * 17.0 - time * 0.5);\n" +
          "float m = cos(uv.x * 7.0 - time * 0.6) + 0.6 * cos(uv.x * 15.0 + time * 0.4);\n" +
          "w.x += 0.016 * n;\n" +
          "w.y += 0.010 * m;\n" +
          "ret = texture2D(sampler_main, w).rgb;\n" +
          "ret -= 0.003;\n" +
          "}\n",
        comp:
          AMBER_RAMP +
          "shader_body {\n" +
          "vec3 src = texture2D(sampler_main, uv).rgb;\n" +
          "float v = dot(src, vec3(0.33));\n" +
          "v = 0.28 + 0.85 * v;\n" +
          "v += 0.07 * sin(uv.y * 12.0 + time * 0.8);\n" +
          "v *= (1.0 + 0.30 * bass);\n" +
          "ret = amber_ramp(v);\n" +
          "}\n",
      }
    );
    return preset;
  })();

  // ── Ambience Warp ───────────────────────────────────────────────────────────
  // A warping amber tunnel: feedback zoomed outward each frame so trails of the
  // live waveform rush from the center as concentric rings, with a slow swirl.
  P["Ambience Warp"] = (function () {
    var preset = build(
      {
        wave_mode: 0,
        wave_smoothing: 0.88,
        wave_scale: 0.55,
        additivewave: 1,
        wave_r: 1.0,
        wave_g: 0.82,
        wave_b: 0.28,
        wave_a: 0.4,
        decay: 0.95,
        gammaadj: 1.9,
        zoom: 1.04,
        rot: 0.02,
        warp: 0.05,
        warpscale: 1.2,
        warpanimspeed: 0.6,
        cx: 0.5,
        cy: 0.5,
        darken_center: 0,
        wrap: 0,
      },
      {
        frame: function (t) {
          var bass = t.bass_att || t.bass || 1;
          var treb = t.treb_att || t.treb || 1;
          t.zoom = 1.04 + 0.06 * bass;
          t.rot = 0.015 + 0.03 * Math.sin(t.time * 0.15);
          t.warp = 0.04 + 0.03 * treb;
          t.decay = 0.95;
          t.wave_a = 0.25 + 0.35 * bass;
          return t;
        },
        warp:
          "shader_body {\n" +
          "vec2 d = uv - 0.5;\n" +
          "float r = length(d);\n" +
          "float a = atan(d.y, d.x) + 0.06 * sin(time * 0.4);\n" +
          "r *= 0.985;\n" +
          "vec2 w = 0.5 + r * vec2(cos(a), sin(a));\n" +
          "ret = texture2D(sampler_main, w).rgb;\n" +
          "ret -= 0.003;\n" +
          "}\n",
        comp:
          AMBER_RAMP +
          "shader_body {\n" +
          "vec2 d = uv - 0.5;\n" +
          "d.x *= resolution.x / resolution.y;\n" +
          "float r = length(d);\n" +
          "vec3 src = texture2D(sampler_main, uv).rgb;\n" +
          "float v = dot(src, vec3(0.33)) * (1.0 + 0.35 * bass);\n" +
          "v += 0.10 * sin(r * 26.0 - time * 2.0);\n" +
          "v *= smoothstep(0.0, 0.12, r);\n" +
          // WMP Warp slowly cycles blue <-> yellow.
          "vec3 warm = amber_ramp(v);\n" +
          "vec3 cool = vec3(0.15, 0.45, 0.95) * v * 1.4;\n" +
          "ret = mix(cool, warm, 0.5 + 0.5*sin(time*0.05));\n" +
          "}\n",
      }
    );
    return preset;
  })();

  // ── Ambience Anon ───────────────────────────────────────────────────────────
  // Anonymous slow-morphing amber cloud: a soft fbm mass that breathes, with a
  // faint waveform heartbeat fed in. Deliberately minimal, very smooth.
  P["Ambience Anon"] = build(
    {
      wave_mode: 0,
      wave_smoothing: 0.95,
      wave_scale: 0.3,
      additivewave: 1,
      wave_r: 1.0,
      wave_g: 0.86,
      wave_b: 0.32,
      wave_a: 0.18,
      decay: 0.97,
      gammaadj: 1.7,
      zoom: 1.0,
      rot: 0.0,
      warp: 0.05,
      warpscale: 1.6,
      warpanimspeed: 0.2,
      cx: 0.5,
      cy: 0.5,
      darken_center: 0,
      wrap: 1,
    },
    {
      frame: function (t) {
        var bass = t.bass_att || t.bass || 1;
        t.warp = 0.04 + 0.03 * bass;
        t.warpanimspeed = 0.18;
        t.zoom = 1.0 + 0.003 * Math.sin(t.time * 0.2);
        t.decay = 0.97;
        t.wave_a = 0.12 + 0.18 * bass;
        t.wave_g = 0.84 + 0.06 * Math.sin(t.time * 0.15);
        return t;
      },
      warp:
        "shader_body {\n" +
        "vec2 w = uv + 0.006 * vec2(sin(uv.y * 5.0 + time * 0.25), cos(uv.x * 5.0 + time * 0.2));\n" +
        "ret = texture2D(sampler_main, w).rgb;\n" +
        "ret -= 0.002;\n" +
        "}\n",
      comp:
        NOISE_GLSL +
        AMBER_RAMP +
        "shader_body {\n" +
        "vec2 p = uv * 2.2;\n" +
        "p += vec2(time * 0.04, -time * 0.03);\n" +
        "float cloud = fbm(p + fbm(p + time * 0.05));\n" +
        "vec3 src = texture2D(sampler_main, uv).rgb;\n" +
        "float v = 0.55 * cloud + 0.55 * dot(src, vec3(0.33));\n" +
        "float d = distance(uv, vec2(0.5));\n" +
        "v *= smoothstep(0.85, 0.15, d);\n" +
        "v *= (1.0 + 0.25 * bass);\n" +
        "ret = amber_ramp(v);\n" +
        "}\n",
    }
  );

  // ── Ambience Falloff ────────────────────────────────────────────────────────
  // Light cascading downward: feedback drifts down each frame so the live waveform
  // leaves amber streaks raining toward the bottom, with a faint sideways sway.
  P["Ambience Falloff"] = build(
    {
      wave_mode: 0,
      wave_smoothing: 0.9,
      wave_scale: 0.5,
      additivewave: 1,
      wave_r: 1.0,
      wave_g: 0.84,
      wave_b: 0.3,
      wave_a: 0.4,
      decay: 0.955,
      gammaadj: 1.85,
      zoom: 1.0,
      rot: 0.0,
      warp: 0.04,
      warpscale: 1.6,
      warpanimspeed: 0.5,
      cx: 0.5,
      cy: 0.3,
      dx: 0.0,
      dy: 0.012,
      darken_center: 0,
      wrap: 1,
    },
    {
      frame: function (t) {
        var bass = t.bass_att || t.bass || 1;
        var treb = t.treb_att || t.treb || 1;
        t.dy = 0.01 + 0.006 * bass;
        t.dx = 0.002 * Math.sin(t.time * 0.4);
        t.warp = 0.04 + 0.03 * treb;
        t.zoom = 1.0;
        t.decay = 0.955;
        t.wave_a = 0.25 + 0.3 * bass;
        t.cy = 0.3 + 0.04 * Math.sin(t.time * 0.2);
        return t;
      },
      warp:
        "shader_body {\n" +
        "vec2 w = uv;\n" +
        "w.y -= 0.010;\n" +
        "w.x += 0.006 * sin(uv.y * 12.0 + time * 1.0);\n" +
        "ret = texture2D(sampler_main, w).rgb;\n" +
        "ret -= 0.003;\n" +
        "}\n",
      comp:
        AMBER_RAMP +
        "shader_body {\n" +
        "vec3 src = texture2D(sampler_main, uv).rgb;\n" +
        "float v = dot(src, vec3(0.33)) * (1.0 + 0.30 * bass);\n" +
        "v = 0.10 + 0.95 * v;\n" +
        "v += 0.05 * sin(uv.x * 30.0 + time * 1.5) * smoothstep(0.0, 0.5, uv.y);\n" +
        "v *= smoothstep(0.0, 0.18, 1.0 - uv.y) + 0.4;\n" +
        "ret = amber_ramp(v);\n" +
        "}\n",
    }
  );

  // ── Ambience Bubble ─────────────────────────────────────────────────────────
  // Round amber bubbles floating up: four soft glowing metaball circles drift and
  // pulse with bass, drawn as live circular waveforms (each a real-audio ring).
  P["Ambience Bubble"] = (function () {
    var preset = build(
      {
        wave_a: 0,
        wave_mode: 0,
        wave_smoothing: 0.9,
        additivewave: 1,
        decay: 0.95,
        gammaadj: 1.9,
        zoom: 1.0,
        rot: 0.0,
        warp: 0.05,
        warpscale: 1.4,
        warpanimspeed: 0.4,
        cx: 0.5,
        cy: 0.5,
        dx: 0.0,
        dy: -0.004,
        darken_center: 0,
        wrap: 1,
      },
      {
        frame: function (t) {
          var bass = t.bass_att || t.bass || 1;
          t.dy = -0.003 - 0.004 * bass;
          t.warp = 0.04 + 0.02 * bass;
          t.zoom = 1.0 + 0.003 * Math.sin(t.time * 0.3);
          t.decay = 0.95;
          t.q1 = 0.3 + 0.1 * Math.sin(t.time * 0.5);
          t.q2 = 0.4 + 0.15 * Math.sin(t.time * 0.27 + 1.0);
          t.q3 = 0.7 + 0.1 * Math.sin(t.time * 0.4 + 2.0);
          t.q4 = 0.55 + 0.18 * Math.sin(t.time * 0.31 + 3.0);
          t.q6 = 0.5 + 0.12 * Math.sin(t.time * 0.43 + 4.0);
          t.q7 = 0.35 + 0.16 * Math.sin(t.time * 0.22 + 5.0);
          t.q8 = 0.6 + 0.1 * Math.sin(t.time * 0.37 + 6.0);
          t.q9 = 0.65 + 0.15 * Math.sin(t.time * 0.29 + 7.0);
          t.q5 = 0.09 + 0.05 * bass;
          return t;
        },
        warp:
          "shader_body {\n" +
          "vec2 w = uv + 0.005 * vec2(sin(uv.y * 6.0 + time * 0.4), cos(uv.x * 6.0 + time * 0.3));\n" +
          "ret = texture2D(sampler_main, w).rgb;\n" +
          "ret -= 0.0025;\n" +
          "}\n",
        comp:
          // WMP Bubble slowly cycles its base hue (observed magenta <-> teal across the video).
          "shader_body {\n" +
          "vec3 src = texture2D(sampler_main, uv).rgb;\n" +
          "float v = dot(src, vec3(0.33)) * (1.0 + 0.30 * bass);\n" +
          "v = 0.04 + 1.05 * v;\n" +
          "vec3 tint = mix(vec3(0.95,0.25,0.85), vec3(0.15,0.85,0.80), 0.5+0.5*sin(time*0.05));\n" +
          "ret = tint * v;\n" +
          "}\n",
      }
    );
    preset.waves[0] = circleWave("q1", "q2");
    preset.waves[1] = circleWave("q3", "q4");
    preset.waves[2] = circleWave("q6", "q7");
    preset.waves[3] = circleWave("q8", "q9");
    preset.waves.forEach(function (w) {
      w.baseVals.r = 1.0;
      w.baseVals.g = 1.0;
      w.baseVals.b = 1.0;
      w.baseVals.a = 0.7;
      w.baseVals.smoothing = 0.5;
    });
    return preset;
  })();

  // ── Ambience Dizzy ──────────────────────────────────────────────────────────
  // Dizzying spiral: fast rotation plus a center-pulling swirl warp; amber glow on
  // black, driven by a real circular waveform whose radius pulses with the bass.
  P["Ambience Dizzy"] = (function () {
    var preset = build(
      {
        wave_a: 0,
        decay: 0.96,
        gammaadj: 1.8,
        zoom: 1.02,
        rot: 0.06,
        warp: 0.1,
        warpscale: 1.4,
        warpanimspeed: 1.2,
        darken_center: 0,
        wrap: 0,
      },
      {
        frame: function (t) {
          var b = t.bass_att || t.bass || 1;
          var tr = t.treb_att || t.treb || 1;
          t.rot = 0.05 + 0.1 * b;
          t.zoom = 1.01 + 0.02 * b;
          t.q1 = 0.5;
          t.q2 = 0.5;
          t.q5 = 0.14 + 0.07 * b + 0.02 * tr;
          return t;
        },
        warp:
          "shader_body {\n" +
          "vec2 d = uv - vec2(0.5);\n" +
          "float a = 0.45 / (length(d) + 0.18);\n" +
          "float s = sin(a + time * 0.6), c = cos(a + time * 0.6);\n" +
          "vec2 sw = vec2(d.x * c - d.y * s, d.x * s + d.y * c);\n" +
          "ret = texture2D(sampler_main, vec2(0.5) + sw * 0.992).rgb;\n" +
          "ret -= 0.003;\n" +
          "}\n",
        comp:
          // WMP Dizzy is a cyan/teal swirl (not the amber Ambience theme).
          "shader_body {\n" +
          "vec3 c = texture2D(sampler_main, uv).rgb;\n" +
          "float v = dot(c, vec3(0.4));\n" +
          "ret = vec3(0.10, 0.82, 0.85) * v * 1.7;\n" +
          "float dd = distance(uv, vec2(0.5));\n" +
          "ret += vec3(0.20, 0.95, 0.90) * exp(-dd * dd * 7.0) * (0.06 + 0.25 * bass);\n" +
          "}\n",
      }
    );
    preset.waves[0] = circleWave("q1", "q2");
    preset.waves[0].baseVals.r = 0.4;
    preset.waves[0].baseVals.g = 0.95;
    preset.waves[0].baseVals.b = 1.0;
    return preset;
  })();

  // ── Ambience Windmill ─────────────────────────────────────────────────────
  // Four real-audio spokes (an 8-armed blade set) rotating about the center over a
  // faint amber radial glow; spin and blade length react to the audio.
  P["Ambience Windmill"] = (function () {
    var preset = build(
      {
        wave_a: 0,
        decay: 0.94,
        gammaadj: 1.8,
        zoom: 1.0,
        rot: 0.0,
        warp: 0.02,
        darken_center: 0,
        wrap: 0,
      },
      {
        frame: function (t) {
          var b = t.bass_att || t.bass || 1;
          t.q1 = t.time * (0.4 + 0.4 * b);
          t.q6 = 0.16 + 0.1 * b;
          return t;
        },
        comp:
          // WMP Windmill is a cyan/teal swirl.
          "shader_body {\n" +
          "vec3 c = texture2D(sampler_main, uv).rgb;\n" +
          "float v = dot(c, vec3(0.45));\n" +
          "ret = vec3(0.12, 0.80, 0.82) * v * 1.7;\n" +
          "float dd = distance(uv, vec2(0.5));\n" +
          "ret += vec3(0.20, 0.92, 0.88) * exp(-dd * dd * 5.0) * (0.10 + 0.30 * bass);\n" +
          "}\n",
      }
    );
    var offs = [0.0, 0.785, 1.571, 2.356];
    for (var i = 0; i < 4; i++) {
      preset.waves[i] = spokeLine(0, 0.5, 0.18, 0.4, 0.95, 1.0);
      (function (off, idx) {
        preset.waves[idx].point_eqs = function (a) {
          var th = (a.q1 || 0) + off;
          var s = a.sample * 2.0 - 1.0;
          var amp = a.q6 || 0.18;
          var ct = Math.cos(th),
            st = Math.sin(th);
          a.x = 0.5 + s * 0.5 * ct - a.value1 * amp * st;
          a.y = 0.5 + s * 0.5 * st + a.value1 * amp * ct;
          return a;
        };
      })(offs[i], i);
    }
    return preset;
  })();

  // ── Ambience Niagara ──────────────────────────────────────────────────────
  // A waterfall: shader streams of light falling downward, color CYCLING
  // yellow<->teal via tintComp; a real circular waveform rides on top for the beat.
  P["Ambience Niagara"] = (function () {
    var preset = build(
      {
        wave_a: 0,
        decay: 0.97,
        gammaadj: 1.7,
        zoom: 1.0,
        dy: 0.012,
        warp: 0.03,
        darken_center: 0,
        wrap: 1,
      },
      {
        frame: function (t) {
          var b = t.bass_att || t.bass || 1;
          var tr = t.treb_att || t.treb || 1;
          t.dy = 0.01 + 0.012 * b;
          t.q1 = 0.5;
          t.q2 = 0.5;
          t.q5 = 0.13 + 0.06 * b + 0.02 * tr;
          return t;
        },
        warp:
          NOISE_GLSL +
          "shader_body {\n" +
          "vec2 w = uv;\n" +
          "w.y += 0.012;\n" +
          "vec3 c = texture2D(sampler_main, w).rgb;\n" +
          "float streams = fbm(vec2(uv.x * 14.0, uv.y * 4.0 - time * 1.5));\n" +
          "streams = smoothstep(0.55, 0.9, streams);\n" +
          "c += vec3(streams) * (0.05 + 0.18 * bass);\n" +
          "ret = c - 0.004;\n" +
          "}\n",
        // WMP Niagara cycles teal/cyan <-> blue (a waterfall, not amber).
        comp: tintComp("vec3(0.10,0.80,0.80)", "vec3(0.10,0.35,0.95)", "0.06", "1.6"),
      }
    );
    preset.waves[0] = circleWave("q1", "q2");
    preset.waves[0].baseVals.r = 0.95;
    preset.waves[0].baseVals.g = 0.95;
    preset.waves[0].baseVals.b = 0.8;
    return preset;
  })();

  // ── Ambience Blender ────────────────────────────────────────────────────────
  // A blender vortex: like Dizzy but more churning — the swirl is perturbed by fbm
  // so everything tumbles as it is blended into the center; amber.
  P["Ambience Blender"] = (function () {
    var preset = build(
      {
        wave_a: 0,
        decay: 0.95,
        gammaadj: 1.8,
        zoom: 1.03,
        rot: 0.04,
        warp: 0.12,
        warpscale: 1.6,
        warpanimspeed: 1.5,
        darken_center: 0,
        wrap: 0,
      },
      {
        frame: function (t) {
          var b = t.bass_att || t.bass || 1;
          var m = t.mid || 1;
          t.zoom = 1.02 + 0.03 * b;
          t.rot = 0.03 + 0.06 * m;
          t.q1 = 0.5;
          t.q2 = 0.5;
          t.q5 = 0.13 + 0.07 * b;
          return t;
        },
        warp:
          NOISE_GLSL +
          "shader_body {\n" +
          "vec2 d = uv - vec2(0.5);\n" +
          "float turb = fbm(d * 6.0 + time * 0.4) - 0.5;\n" +
          "float a = 0.55 / (length(d) + 0.16) + turb * (0.8 + 1.5 * bass);\n" +
          "float s = sin(a + time * 0.5), c = cos(a + time * 0.5);\n" +
          "vec2 sw = vec2(d.x * c - d.y * s, d.x * s + d.y * c);\n" +
          "ret = texture2D(sampler_main, vec2(0.5) + sw * 0.985).rgb;\n" +
          "ret -= 0.004;\n" +
          "}\n",
        comp:
          // WMP Blender cycles blue <-> purple/pink as it churns.
          "shader_body {\n" +
          "vec3 c = texture2D(sampler_main, uv).rgb;\n" +
          "float v = dot(c, vec3(0.42));\n" +
          "vec3 tint = mix(vec3(0.20,0.30,0.95), vec3(0.70,0.25,0.95), 0.5+0.5*sin(time*0.07));\n" +
          "ret = tint * v * 1.7;\n" +
          "float dd = distance(uv, vec2(0.5));\n" +
          "ret += tint * exp(-dd * dd * 9.0) * (0.08 + 0.30 * bass);\n" +
          "}\n",
      }
    );
    preset.waves[0] = circleWave("q1", "q2");
    preset.waves[0].baseVals.r = 0.6;
    preset.waves[0].baseVals.g = 0.6;
    preset.waves[0].baseVals.b = 1.0;
    return preset;
  })();

  // ── Ambience X Marks the Spot ───────────────────────────────────────────────
  // A glowing amber X: two crossed real-audio spokes at +/-45 deg that pulse with
  // the waveform, over a soft center bloom; the X slowly rotates.
  P["Ambience X Marks the Spot"] = (function () {
    var preset = build(
      {
        wave_a: 0,
        decay: 0.95,
        gammaadj: 1.8,
        zoom: 1.0,
        rot: 0.0,
        warp: 0.02,
        darken_center: 0,
        wrap: 0,
      },
      {
        frame: function (t) {
          var b = t.bass_att || t.bass || 1;
          t.q1 = t.time * 0.15;
          t.q6 = 0.14 + 0.1 * b;
          return t;
        },
        comp:
          // WMP X Marks the Spot sits in the magenta/pink family.
          "shader_body {\n" +
          "vec3 c = texture2D(sampler_main, uv).rgb;\n" +
          "float v = dot(c, vec3(0.45));\n" +
          "ret = vec3(0.95, 0.25, 0.70) * v * 1.7;\n" +
          "float dd = distance(uv, vec2(0.5));\n" +
          "ret += vec3(1.0, 0.45, 0.85) * exp(-dd * dd * 6.0) * (0.12 + 0.35 * bass);\n" +
          "}\n",
      }
    );
    var offs = [0.785, -0.785];
    for (var i = 0; i < 2; i++) {
      preset.waves[i] = spokeLine(0, 0.55, 0.16, 1.0, 0.5, 0.85);
      (function (off, idx) {
        preset.waves[idx].point_eqs = function (a) {
          var th = (a.q1 || 0) + off;
          var s = a.sample * 2.0 - 1.0;
          var amp = a.q6 || 0.16;
          var ct = Math.cos(th),
            st = Math.sin(th);
          a.x = 0.5 + s * 0.55 * ct - a.value1 * amp * st;
          a.y = 0.5 + s * 0.55 * st + a.value1 * amp * ct;
          return a;
        };
      })(offs[i], i);
    }
    return preset;
  })();
})();
