/* Custom Butterchurn presets that reproduce specific WMP Battery/Ambience
 * visualizations. These are hand-authored preset objects in Butterchurn's
 * "converted" format (equations are JS functions, shaders are GLSL strings).
 * Exposed as window.WMP_PRESETS for viz.js to load by name.
 *
 * Authored from reference: the user's WMP capture video + reference stills.
 * Iterating toward an exact match — tweak the numbers below per feedback.
 */
(function () {
  "use strict";

  var passthrough = function (a) { return a; };

  // Full default baseVals (mirrors Butterchurn's built-in default preset) so no
  // field is ever missing when the renderer reads the preset.
  var BASE = {
    gammaadj: 2, wave_g: 0.5, mv_x: 12, warpscale: 1, brighten: 0, mv_y: 9,
    wave_scale: 1, echo_alpha: 0, additivewave: 0, sx: 1, sy: 1, warp: 0.01,
    red_blue: 0, wave_mode: 0, wave_brighten: 0, wrap: 0, zoomexp: 1, fshader: 0,
    wave_r: 0.5, echo_zoom: 1, wave_smoothing: 0.75, warpanimspeed: 1, wave_dots: 0,
    wave_x: 0.5, wave_y: 0.5, zoom: 1, solarize: 0, modwavealphabyvolume: 0, dx: 0,
    cx: 0.5, dy: 0, darken_center: 0, cy: 0.5, invert: 0, bmotionvectorson: 0,
    rot: 0, modwavealphaend: 0.95, wave_mystery: -0.2, decay: 0.9, wave_a: 1,
    wave_b: 0.5, rating: 5, modwavealphastart: 0.75, darken: 0, echo_orient: 0,
    ib_r: 0.5, ib_g: 0.5, ib_b: 0.5, ib_a: 0, ib_size: 0, ob_r: 0, ob_g: 0,
    ob_b: 0, ob_a: 0, ob_size: 0.01, mv_dx: 0, mv_dy: 0, mv_a: 0, mv_r: 0.5,
    mv_g: 0.5, mv_b: 0.5, mv_l: 0
  };

  var WAVE_BASE = { a: 1, enabled: 0, b: 1, g: 1, scaling: 1, samples: 512, additive: 0, usedots: 0, spectrum: 0, r: 1, smoothing: 0.5, thick: 0, sep: 0 };
  var SHAPE_BASE = { r2: 0, a: 1, enabled: 0, b: 0, tex_ang: 0, thickoutline: 0, g: 0, textured: 0, g2: 1, tex_zoom: 1, additive: 0, border_a: 0.1, border_b: 1, b2: 0, a2: 0, r: 1, border_g: 1, rad: 0.1, x: 0.5, y: 0.5, ang: 0, sides: 4, border_r: 1 };

  function makeWaves() {
    var w = [];
    for (var i = 0; i < 4; i++) w.push({ baseVals: Object.assign({}, WAVE_BASE), init_eqs: passthrough, frame_eqs: passthrough, point_eqs: "" });
    return w;
  }
  function makeShapes() {
    var s = [];
    for (var i = 0; i < 4; i++) s.push({ baseVals: Object.assign({}, SHAPE_BASE), init_eqs: passthrough, frame_eqs: passthrough });
    return s;
  }

  var WARP_DEFAULT = "shader_body {\nret = texture2D(sampler_main, uv).rgb;\nret -= 0.004;\n}\n";
  var COMP_DEFAULT = "shader_body {\nret = texture2D(sampler_main, uv).rgb;\nret *= hue_shader;\n}\n";

  // Maps 0..1 luminance to the Ambience yellow ramp (black -> amber -> yellow ->
  // white-hot). Prepended to Ambience comp shaders as a GLSL helper function.
  var AMBER_RAMP =
    "vec3 amber_ramp(float v){\n" +
    "  v = clamp(v, 0.0, 1.0);\n" +
    "  vec3 c = mix(vec3(0.03,0.02,0.0), vec3(0.70,0.52,0.04), smoothstep(0.0,0.55,v));\n" +
    "  c = mix(c, vec3(0.98,0.92,0.30), smoothstep(0.45,0.85,v));\n" +
    "  c = mix(c, vec3(1.0,0.99,0.85),  smoothstep(0.85,1.0,v));\n" +
    "  return c;\n" +
    "}\n";

  // Shared GLSL helpers reused across the presets below (same definitions Alchemy
  // uses inline). Prepend the constant(s) before a shader_body to make them
  // callable: hash21/vnoise/fbm (noise), pal (rainbow), ctr (contour line).
  var NOISE_GLSL =
    "float hash21(vec2 p){ p = fract(p*vec2(127.1,311.7)); p += dot(p, p+34.5); return fract(p.x*p.y); }\n" +
    "float vnoise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);\n" +
    "  float a=hash21(i), b=hash21(i+vec2(1.0,0.0)), c=hash21(i+vec2(0.0,1.0)), e=hash21(i+vec2(1.0,1.0));\n" +
    "  return mix(mix(a,b,f.x), mix(c,e,f.x), f.y); }\n" +
    "float fbm(vec2 p){ float s=0.0, m=0.5; for(int i=0;i<4;i++){ s+=m*vnoise(p); p=p*2.0+1.3; m*=0.5; } return s; }\n";
  var PAL_GLSL = "vec3 pal(float h){ return 0.5+0.5*cos(6.2832*(h+vec3(0.0,0.33,0.67))); }\n";
  var CTR_GLSL = "float ctr(float v, float w){ return smoothstep(w, 0.0, abs(fract(v)-0.5)); }\n";

  // Maps the feedback-buffer luminance to a tint (cycling colA<->colB when they
  // differ; pass the same color twice to hold a fixed hue) with a soft,
  // bass-pulsing center bloom. colA/colB/speed/boost are GLSL literal strings.
  function tintComp(colA, colB, speed, boost) {
    return "shader_body {\n" +
      "vec3 c = texture2D(sampler_main, uv).rgb;\n" +
      "float lum = dot(c, vec3(0.33));\n" +
      "float h = 0.5 + 0.5*sin(time*(" + speed + "));\n" +
      "vec3 tint = mix(" + colA + ", " + colB + ", h);\n" +
      "ret = tint * lum * (" + boost + ");\n" +
      "float d = distance(uv, vec2(0.5));\n" +
      "ret += tint * exp(-d*d*8.0) * (0.10 + 0.35*bass);\n" +
      "}\n";
  }

  function build(overrides, opts) {
    opts = opts || {};
    return {
      baseVals: Object.assign({}, BASE, overrides),
      init_eqs: opts.init || passthrough,
      frame_eqs: opts.frame || passthrough,
      pixel_eqs: opts.pixel || passthrough,
      waves: makeWaves(),
      shapes: makeShapes(),
      warp: opts.warp || WARP_DEFAULT,
      comp: opts.comp || COMP_DEFAULT
    };
  }

  // A custom wave that draws the audio waveform as a jagged circle, centered on
  // (a[qx], a[qy]) with radius a.q5 — values fed from the main per-frame eqs.
  // Equations are real FUNCTIONS: for a converted preset (function-based main
  // eqs) Butterchurn calls wave.point_eqs directly and never compiles *_str, so
  // point_eqs MUST be a function (an empty string would be skipped at draw time).
  function circleWave(qx, qy) {
    return {
      baseVals: Object.assign({}, WAVE_BASE, {
        enabled: 1, samples: 512, additive: 1, usedots: 0, scaling: 1,
        smoothing: 0.1, a: 1, r: 0.85, g: 0.13, b: 0.95
      }),
      init_eqs: passthrough,
      frame_eqs: passthrough,
      point_eqs: function (a) {
        var ang = a.sample * 6.2832;
        var rad = (a.q5 || 0.15) + 0.05 * a.value1;
        a.x = (a[qx] || 0.5) + rad * Math.cos(ang);
        a.y = (a[qy] || 0.5) + rad * Math.sin(ang);
        return a;
      }
    };
  }

  // A custom wave that draws the actual audio waveform along a straight LINE
  // through center (q2,q3), rotated by angle q1, displaced perpendicular by the
  // waveform sample. With feedback decay the rotating line leaves arc traces.
  // Color cycles via hue q8. This is the same "real waveform geometry" approach
  // that makes Dance of the Freaky Circles' lines look right.
  function waveLine() {
    return {
      baseVals: Object.assign({}, WAVE_BASE, {
        enabled: 1, samples: 512, additive: 1, usedots: 0, scaling: 1,
        smoothing: 0.04, a: 1, r: 0.7, g: 0.5, b: 1.0
      }),
      init_eqs: passthrough,
      frame_eqs: passthrough,
      point_eqs: function (a) {
        var th = a.q1 || 0.0;
        var s = a.sample * 2.0 - 1.0;             // -1..1 along the line
        var ct = Math.cos(th), st = Math.sin(th);
        var cx = a.q2 !== undefined ? a.q2 : 0.5;
        var cy = a.q3 !== undefined ? a.q3 : 0.5;
        a.x = cx + s * 0.55 * ct - a.value1 * 0.26 * st;
        a.y = cy + s * 0.55 * st + a.value1 * 0.26 * ct;
        var h = a.q8 || 0.0;
        a.r = 0.5 + 0.5 * Math.cos(6.2832 * h);
        a.g = 0.5 + 0.5 * Math.cos(6.2832 * (h + 0.33));
        a.b = 0.5 + 0.5 * Math.cos(6.2832 * (h + 0.67));
        return a;
      }
    };
  }

  // A custom wave drawing the real audio waveform as a straight spoke through
  // center at a FIXED angle, displaced perpendicular by the sample. Use several
  // at different angles for stars / webs / windmills. len = half-length (0..~0.6),
  // amp = waveform displacement, [r,g,b] = color.
  function spokeLine(angle, len, amp, r, g, b) {
    var ct = Math.cos(angle), st = Math.sin(angle);
    return {
      baseVals: Object.assign({}, WAVE_BASE, {
        enabled: 1, samples: 512, additive: 1, usedots: 0, scaling: 1,
        smoothing: 0.04, a: 1, r: r, g: g, b: b
      }),
      init_eqs: passthrough,
      frame_eqs: passthrough,
      point_eqs: function (a) {
        var s = a.sample * 2.0 - 1.0;              // -1..1 along the spoke
        a.x = 0.5 + s * len * ct - a.value1 * amp * st;
        a.y = 0.5 + s * len * st + a.value1 * amp * ct;
        return a;
      }
    };
  }

  var P = {};

  // ── Dance of the Freaky Circles (Bateria: taniec dźwiękowych kółek) ─────────
  // Magenta circular waveform; a second echoed ring fades in and out so you see
  // one ring sometimes and two at others; the background washes slowly between
  // dark and purple (matching the WMP capture); radius pulses with the bass.
  P["Dance of the Freaky Circles"] = (function () {
    var preset = build(
      {
        wave_a: 0,             // primary waveform off; the two custom circles draw it
        decay: 0.92,           // trails leave faint motion arcs as the circles orbit
        gammaadj: 2.0,
        zoom: 1.0,
        warp: 0.04,
        echo_alpha: 0,
        darken_center: 0,
        wrap: 0
      },
      {
        // Two orbit centers (q1,q2)=(q3,q4) on opposite sides of center, plus a
        // bass-pulsing radius (q5). Read by the two circleWave point equations.
        frame: function (t) {
          var bass = t.bass_att || t.bass || 1;
          var th = t.time * 0.6;
          var orbit = 0.13;
          t.q1 = 0.5 + orbit * Math.cos(th);
          t.q2 = 0.5 + orbit * Math.sin(th);
          t.q3 = 0.5 - orbit * Math.cos(th);
          t.q4 = 0.5 - orbit * Math.sin(th);
          t.q5 = 0.12 + 0.06 * bass;     // ring radius pulses with bass
          t.decay = 0.92;
          return t;
        },
        // Mostly black with only a faint, slow purple wash now and then.
        comp:
          "shader_body {\n" +
          "ret = texture2D(sampler_main, uv).rgb;\n" +
          "float bg = 0.04 * (0.5 + 0.5 * sin(time * 0.10));\n" +
          "ret += vec3(bg, bg * 0.10, bg * 1.3);\n" +
          "}\n"
      }
    );
    preset.waves[0] = circleWave("q1", "q2");  // orbiting circle A
    preset.waves[1] = circleWave("q3", "q4");  // orbiting circle B
    return preset;
  })();

  // ── Alchemy Random ─────────────────────────────────────────────────────────
  // WMP11's "Alchemy: Random" is a STATE MACHINE that cycles through several
  // standalone Alchemy themes, crossfading every ~14s. Reproduced from reference
  // frames as a single "mega-preset" with FOUR busy, FULL-FRAME scenes whose
  // backgrounds are rich COLOR GRADIENTS (never black) packed with fine lines,
  // driven by one timed clock (mirrored in the shaders off `time`, since GLSL
  // can't read q-vars). Backgrounds per scene (from the frames):
  //   0 Deep-space fan   — dark blue/purple gradient + a dense radial spoke fan.
  //   1 Perspective bowl — warm amber↔green↔pink mesh dome (radial + concentric).
  //   2 Teal web field   — teal gradient + dense organic web/contour filaments.
  //   3 Color storm      — dramatic red↔blue/purple gradient + a yellow hourglass
  //                        spoke fan + a green central cloud.
  // Persistent foreground motif across ALL scenes (the WMP signature): two SMALL
  // ringed orbs that roam the whole frame and leave coil/bead RECEDE trails (via
  // high decay), joined by a jagged off-center LIGHTNING line, with a central
  // jagged "urchin" waveform. Orbs and the line each fade in/out on independent
  // slow envelopes so they "come and go" and recede separately, never static.
  P["Alchemy Random"] = (function () {
    // Scene clock shared by frame eqs + shaders. Keep D / FADE in sync with the
    // identical constants hard-coded in the GLSL below.
    var SCENE_D = 9.0;       // seconds per scene (faster scene changes)
    var SCENE_FADE = 2.0;    // crossfade window (last seconds of each scene)

    // Soft on/off envelope from a -1..1 sine: 0 for part of the cycle, smoothly
    // ramping to 1 — gives the rings/line their "come and go" behavior.
    function comeGo(s) {
      var x = (0.5 + 0.5 * s - 0.30) / 0.30;
      x = x < 0 ? 0 : (x > 1 ? 1 : x);
      return x * x * (3 - 2 * x);
    }

    // Bright, saturated cosine-palette color from a hue phase (0..1). The lines in
    // the original are vivid/glowing (gold/blue/magenta); only the BACKGROUND is
    // muted — so geometry uses this, the wash gets desaturated in the comp.
    function hueBright(h) {
      return [0.5 + 0.5 * Math.cos(6.2832 * h),
              0.5 + 0.5 * Math.cos(6.2832 * (h + 0.33)),
              0.5 + 0.5 * Math.cos(6.2832 * (h + 0.67))];
    }

    var preset = build(
      {
        // Moderate decay: the roaming orbs leave coil/bead recede trails without
        // the additive build-up blowing the frame to white. The colorful
        // background is drawn procedurally in comp (NOT fed back), so only the
        // additive orbs/line/spokes accumulate here.
        wave_a: 0, decay: 0.93, gammaadj: 1.3, zoom: 1.0, rot: 0.0,
        warp: 0.0, wrap: 0, darken_center: 0, echo_alpha: 0
      },
      {
        frame: function (t) {
          var bass = t.bass_att || t.bass || 1;
          var treb = t.treb_att || t.treb || 1;

          // State machine: current scene + smooth crossfade weight to the next.
          var ph = t.time / SCENE_D;
          var cur = Math.floor(ph) % 4;
          var fr = ph - Math.floor(ph);              // 0..1 within the scene
          var fadeFrac = SCENE_FADE / SCENE_D;
          var f = (fr - (1 - fadeFrac)) / fadeFrac;  // ramps 0..1 over the fade window
          f = f < 0 ? 0 : (f > 1 ? 1 : f);
          f = f * f * (3 - 2 * f);                   // smoothstep
          var next = (cur + 1) % 4;

          // Per-scene foreground weights (alpha gates) — active scene fades to
          // the next so two elements overlap during the transition.
          var w = [0, 0, 0, 0];
          w[cur] = 1 - f;
          w[next] += f;
          t.q11 = w[0]; t.q12 = w[1]; t.q13 = w[2]; t.q14 = w[3];
          t.q9 = cur; t.q10 = f;

          // Two orbs zipping on independent paths — FAST (the original has quick,
          // whippy movement). Wide travel makes the connecting lightning span
          // corner-to-corner, and with high decay the fast motion drags trails
          // across the whole screen (the "multiple lines everywhere" look).
          var tm = t.time;
          t.q1 = 0.5 + 0.34 * Math.sin(tm * 0.55);          // orb A center
          t.q2 = 0.5 + 0.30 * Math.cos(tm * 0.47);
          t.q3 = 0.5 + 0.32 * Math.cos(tm * 0.43 + 1.0);    // orb B center
          t.q4 = 0.5 + 0.34 * Math.sin(tm * 0.51 + 2.0);
          t.q5 = 0.035 + 0.02 * bass;                       // ring radius

          // Presence floors so both orbs + the thread stay mostly visible.
          t.q20 = 0.6 + 0.4 * comeGo(Math.sin(tm * 0.35));         // orb A
          t.q21 = 0.6 + 0.4 * comeGo(Math.sin(tm * 0.31 + 2.2));   // orb B
          t.q22 = 0.6 + 0.4 * comeGo(Math.sin(tm * 0.27 + 1.5));   // thread
          t.q23 = ((tm * 0.05) + 0.25 * cur) % 1;           // hue drift + per-scene hue offset
          t.q24 = 0.6 + 0.4 * comeGo(Math.sin(tm * 0.24 + 0.7));   // urchin presence
          t.q25 = tm * 0.25;                                // urchin rotation (quicker)

          t.q17 = bass;
          t.q18 = tm;
          t.decay = 0.93;
          return t;
        },
        // Background: four SOFT, MUTED PASTEL washes (no hard grids/fans — those
        // read as neon webs; in the real preset ALL the structure is the central
        // urchin + orbs). Each scene is a gentle 2-tone gradient + a faint soft
        // center warmth; they crossfade on the scene clock.
        comp:
          "vec3 sc0(vec2 d,float r,float ang,float gy,float t,float bs){\n" +   // dusty rose / salmon
          "  vec3 c = mix(vec3(0.34,0.17,0.20), vec3(0.42,0.27,0.18), gy);\n" +
          "  c += vec3(0.10,0.05,0.06) * exp(-r*r*1.8);\n" +
          "  return c;\n" +
          "}\n" +
          "vec3 sc1(vec2 d,float r,float ang,float gy,float t,float bs){\n" +   // lavender / periwinkle
          "  vec3 c = mix(vec3(0.22,0.20,0.34), vec3(0.30,0.27,0.42), gy);\n" +
          "  c += vec3(0.06,0.06,0.10) * exp(-r*r*1.8);\n" +
          "  return c;\n" +
          "}\n" +
          "vec3 sc2(vec2 d,float r,float ang,float gy,float t,float bs){\n" +   // sage green
          "  vec3 c = mix(vec3(0.24,0.30,0.22), vec3(0.32,0.38,0.27), gy);\n" +
          "  c += vec3(0.06,0.08,0.05) * exp(-r*r*1.8);\n" +
          "  return c;\n" +
          "}\n" +
          "vec3 sc3(vec2 d,float r,float ang,float gy,float t,float bs){\n" +   // warm tan / beige
          "  vec3 c = mix(vec3(0.36,0.29,0.20), vec3(0.30,0.24,0.17), gy);\n" +
          "  c += vec3(0.08,0.06,0.04) * exp(-r*r*1.8);\n" +
          "  return c;\n" +
          "}\n" +
          "vec3 alScene(float id,vec2 d,float r,float ang,float gy,float t,float bs){\n" +
          "  if(id<0.5) return sc0(d,r,ang,gy,t,bs);\n" +
          "  if(id<1.5) return sc1(d,r,ang,gy,t,bs);\n" +
          "  if(id<2.5) return sc2(d,r,ang,gy,t,bs);\n" +
          "  return sc3(d,r,ang,gy,t,bs);\n" +
          "}\n" +
          "shader_body {\n" +
          "  vec2 d = uv - 0.5;\n" +
          "  d.x *= resolution.x / resolution.y;\n" +
          "  float r = length(d) * 2.0;\n" +
          "  float pang = atan(d.y, d.x);\n" +   // NOT 'ang'/'rad' — Butterchurn predeclares those
          "  float gy = uv.y;\n" +
          "  float D = 9.0;\n" +                           // == SCENE_D
          "  float ph = time / D;\n" +
          "  float cur = mod(floor(ph), 4.0);\n" +
          "  float nxt = mod(cur + 1.0, 4.0);\n" +
          "  float fr = fract(ph);\n" +
          "  float fade = 2.0 / D;\n" +                    // == SCENE_FADE / SCENE_D
          "  float f = clamp((fr - (1.0 - fade)) / fade, 0.0, 1.0); f = f*f*(3.0-2.0*f);\n" +
          "  vec3 col = mix(alScene(cur, d, r, pang, gy, time, bass), alScene(nxt, d, r, pang, gy, time, bass), f);\n" +
          "  float bgl = dot(col, vec3(0.333));\n" +
          "  col = mix(vec3(bgl), col, 0.6) * (0.92 + 0.15*bass);\n" +    // mute the BACKGROUND wash only
          "  float km = 0.50 + 0.25*sin(time*0.03);\n" +                 // mirror-overlay (fills corners + more lines)
          "  vec3 fb = texture2D(sampler_main, uv).rgb;\n" +
          "  fb += texture2D(sampler_main, vec2(1.0-uv.x, uv.y)).rgb * km;\n" +
          "  fb += texture2D(sampler_main, vec2(uv.x, 1.0-uv.y)).rgb * km;\n" +
          "  fb += texture2D(sampler_main, vec2(1.0-uv.x, 1.0-uv.y)).rgb * km * 0.8;\n" +
          "  vec3 glow = texture2D(sampler_blur1, uv).rgb + texture2D(sampler_blur2, uv).rgb;\n" +
          "  glow += texture2D(sampler_blur1, vec2(1.0-uv.x, 1.0-uv.y)).rgb * km;\n" +
          "  ret = col + fb*0.6 + glow*0.45;\n" +                        // colorful glowing geometry over the muted wash
          "}\n",
        // Gentle outward drift + a slow swirl of the feedback (trail) buffer:
        // makes each roaming orb's stamped echoes streak/recede into the coil-and-
        // bead trails seen in the reference, without smearing them into mush.
        warp:
          "shader_body {\n" +
          "  vec2 d = uv - 0.5;\n" +
          "  float a = 0.004 * sin(time * 0.1);\n" +     // very slow swirl
          "  float s = sin(a), c = cos(a);\n" +
          "  vec2 ruv = 0.5 + mat2(c, -s, s, c) * d * 1.0015;\n" + // tiny zoom: local coils, no radial ray-streaks
          "  ret = texture2D(sampler_main, ruv).rgb;\n" +
          "  ret -= 0.008;\n" +                          // trim trails so beads stay discrete
          "}\n"
      }
    );

    // Build a custom-wave slot with the shared additive/glow look. point is the
    // per-point function; thick lines fix the "too thin" complaint.
    function sceneWave(point) {
      return {
        baseVals: Object.assign({}, WAVE_BASE, {
          enabled: 1, samples: 512, additive: 1, usedots: 0, scaling: 1,
          smoothing: 0.1, thick: 1, a: 1
        }),
        init_eqs: passthrough,
        frame_eqs: passthrough,
        point_eqs: point
      };
    }

    // A small, clean ringed orb at center (cxq,cyq), faded by envelope envq. As
    // it roams (high decay) it stamps a string of fading rings = the coil/bead
    // RECEDE trail from the reference frames. col = [r,g,b] glow color.
    function orbWave(cxq, cyq, envq, hoff) {
      var w = sceneWave(function (a) {
        var env = a[envq] || 0;
        var ang = a.sample * 6.2832;
        var rad = (a.q5 || 0.04) + 0.010 * a.value1;          // real-waveform ring (subtle, stays circular)
        a.x = (a[cxq] !== undefined ? a[cxq] : 0.4) + rad * Math.cos(ang);
        a.y = (a[cyq] !== undefined ? a[cyq] : 0.5) + rad * Math.sin(ang);
        var c = hueBright((a.q23 || 0) + hoff);                // bright per-scene hue (gold/blue/...)
        a.r = c[0]; a.g = c[1]; a.b = c[2];
        a.a = env;
        return a;
      });
      w.baseVals.smoothing = 0.85;                             // round ring, not jagged
      return w;
    }
    // wave[0],[1] — the two bright roaming orbs (colored by the per-scene hue).
    preset.waves[0] = orbWave("q1", "q2", "q20", 0.0);
    preset.waves[1] = orbWave("q3", "q4", "q21", 0.08);

    // wave[2] — the THICK JAGGED glowing waveform joining the two orbs: a dense
    // high-freq zig-zag plus the live waveform (an electric oscilloscope line,
    // like the original's gold lightning), colored by the per-scene hue. Off
    // center because the orbs roam; spans the frame when they're far apart.
    preset.waves[2] = sceneWave(function (a) {
      var w = a.q22 || 0;
      var ax = a.q1 !== undefined ? a.q1 : 0.35, ay = a.q2 !== undefined ? a.q2 : 0.5;
      var bx = a.q3 !== undefined ? a.q3 : 0.65, by = a.q4 !== undefined ? a.q4 : 0.5;
      var s = a.sample;
      var dx = bx - ax, dy = by - ay;
      var len = Math.sqrt(dx * dx + dy * dy) || 1;
      var px = -dy / len, py = dx / len;                       // unit perpendicular
      var jag = a.value1 * 0.16 + a.value2 * 0.05;             // REAL audio waveform (like Dance) — naturally jagged
      a.x = ax + dx * s + px * jag;
      a.y = ay + dy * s + py * jag;
      var c = hueBright((a.q23 || 0) + 0.04);                  // same hue family as the orbs
      a.r = c[0]; a.g = c[1]; a.b = c[2];
      a.a = w;
      return a;
    });
    preset.waves[2].baseVals.smoothing = 0.0;                  // jagged, like a real oscilloscope

    // wave[3] — the central "flower urchin": each of the 512 waveform samples
    // shoots a filament outward by its amplitude → a thick spiky star of
    // filaments. Rotates (q25). Bright, complementary to the orbs/thread hue.
    preset.waves[3] = sceneWave(function (a) {
      var ang = a.sample * 6.2832 + (a.q25 || 0);             // rotation
      var spike = Math.abs(a.value1);
      var rad = 0.10 + 0.38 * spike;                          // filaments shoot outward
      a.x = 0.5 + rad * Math.cos(ang);
      a.y = 0.5 + rad * Math.sin(ang);
      var c = hueBright((a.q23 || 0) + 0.5);                  // complementary to orbs/thread
      a.r = c[0]; a.g = c[1]; a.b = c[2];
      a.a = (a.q24 || 0) * 0.8;
      return a;
    });
    preset.waves[3].baseVals.smoothing = 0.0;
    return preset;
  })();

  // ── Ambience Thingus ─────────────────────────────────────────────────────
  // Smooth yellow swirl on black: a smooth circular waveform churned by a warp
  // and long feedback into spiraling liquid light, tinted by the amber ramp.
  P["Ambience Thingus"] = build(
    {
      wave_mode: 0, wave_smoothing: 0.92, wave_scale: 0.6, additivewave: 1,
      wave_r: 1.0, wave_g: 0.85, wave_b: 0.3, wave_a: 0.6,
      decay: 0.96, gammaadj: 1.8,
      zoom: 1.01, rot: 0.06, warp: 0.18, warpscale: 1.4, warpanimspeed: 0.7,
      cx: 0.5, cy: 0.5, darken_center: 0, wrap: 1
    },
    {
      frame: function (t) {
        var bass = t.bass_att || t.bass || 1;
        var treb = t.treb || 1;
        t.rot = 0.04 + 0.05 * Math.sin(t.time * 0.3);
        t.zoom = 1.0 + 0.02 * Math.sin(t.time * 0.5) + 0.01 * bass;
        t.warp = 0.14 + 0.08 * treb;
        t.decay = 0.96;
        t.wave_g = 0.8 + 0.1 * bass;
        return t;
      },
      warp:
        "shader_body {\n" +
        "vec2 w = uv + 0.010 * vec2(sin(uv.y*8.0 + time*0.8), cos(uv.x*8.0 + time*0.6));\n" +
        "ret = texture2D(sampler_main, w).rgb;\n" +
        "ret -= 0.003;\n" +
        "}\n",
      comp:
        AMBER_RAMP +
        "shader_body {\n" +
        "vec3 src = texture2D(sampler_main, uv).rgb;\n" +
        "float v = dot(src, vec3(0.33)) * (1.0 + 0.4*bass);\n" +
        "v += 0.05 * sin(time*0.4);\n" +
        "ret = amber_ramp(v);\n" +
        "}\n"
    }
  );

  // ── Ambience Water ────────────────────────────────────────────────────────
  // Soft yellow pool caustics: layered sine ripples, no rotation, luminous.
  P["Ambience Water"] = build(
    {
      wave_mode: 0, wave_smoothing: 0.95, wave_scale: 0.35, additivewave: 1,
      wave_r: 1.0, wave_g: 0.9, wave_b: 0.35, wave_a: 0.22,
      decay: 0.95, gammaadj: 1.6,
      zoom: 1.0, rot: 0.0, warp: 0.12, warpscale: 2.2, warpanimspeed: 0.5,
      cx: 0.5, cy: 0.5, wrap: 1
    },
    {
      frame: function (t) {
        var bass = t.bass_att || t.bass || 1;
        var treb = t.treb_att || t.treb || 1;
        t.warp = 0.10 + 0.05 * bass;
        t.warpanimspeed = 0.4 + 0.3 * treb;
        t.zoom = 1.0 + 0.005 * Math.sin(t.time * 0.4);
        t.decay = 0.95;
        return t;
      },
      warp:
        "shader_body {\n" +
        "vec2 p = uv - 0.5;\n" +
        "float r = length(p);\n" +
        "vec2 w = uv;\n" +
        "w.x += 0.012 * sin(uv.y*14.0 + time*1.1) + 0.008 * sin(r*22.0 - time*0.9);\n" +
        "w.y += 0.012 * cos(uv.x*14.0 + time*0.9) + 0.008 * cos(r*22.0 - time*0.7);\n" +
        "ret = texture2D(sampler_main, w).rgb;\n" +
        "ret -= 0.002;\n" +
        "}\n",
      comp:
        AMBER_RAMP +
        "shader_body {\n" +
        "vec3 src = texture2D(sampler_main, uv).rgb;\n" +
        "float v = dot(src, vec3(0.33));\n" +
        "v = 0.35 + 0.7 * v;\n" +
        "v += 0.06 * sin(uv.x*10.0 + time*0.8) * sin(uv.y*10.0 - time*0.6);\n" +
        "v *= (1.0 + 0.25*bass);\n" +
        "ret = amber_ramp(v);\n" +
        "}\n"
    }
  );

  // ── Ambience Down the Drain ────────────────────────────────────────────────
  // Yellow caustics spiralling into a dark central hole: zoom-in + rotate.
  P["Ambience Down the Drain"] = build(
    {
      wave_mode: 0, wave_smoothing: 0.9, wave_scale: 0.5, additivewave: 1,
      wave_r: 1.0, wave_g: 0.82, wave_b: 0.25, wave_a: 0.8,
      decay: 0.965, gammaadj: 1.9,
      zoom: 0.99, rot: 0.10, warp: 0.06, warpscale: 1.2,
      cx: 0.55, cy: 0.5, darken_center: 0, wrap: 0
    },
    {
      frame: function (t) {
        var bass = t.bass_att || t.bass || 1;
        var treb = t.treb || 1;
        t.zoom = 0.99 - 0.008 * bass;   // gentle inward pull (was collapsing)
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
        "v = 0.18 + 0.9 * v;\n" +                       // base so the field stays visible
        "float r = length(uv - vec2(0.55, 0.5));\n" +
        "v *= smoothstep(0.02, 0.11, r);\n" +           // smaller drain hole
        "ret = amber_ramp(v);\n" +
        "}\n"
    }
  );

  // ── Battery relatively calm ────────────────────────────────────────────────
  // Soft milky teal swirl that drifts green<->blue; lazy rotation, gentle.
  P["Battery relatively calm"] = (function () {
    var preset = build(
      {
        wave_a: 0, wave_smoothing: 0.9, additivewave: 1, wave_scale: 0.7,
        decay: 0.96, gammaadj: 1.8, zoom: 0.999, rot: 0.012, warp: 0.02,
        cx: 0.5, cy: 0.5, darken_center: 0, wrap: 0
      },
      {
        frame: function (t) {
          var bass = t.bass_att || t.bass || 1;
          t.q1 = 0.5; t.q2 = 0.5;
          t.q5 = 0.30 + 0.04 * bass;
          t.rot = 0.012 + 0.004 * Math.sin(t.time * 0.15);
          t.zoom = 0.999 - 0.0008 * bass;
          t.decay = 0.96;
          return t;
        },
        comp:
          "shader_body {\n" +
          "vec3 c = texture2D(sampler_main, uv).rgb;\n" +
          "float h = 0.5 + 0.5 * sin(time * 0.07);\n" +
          "vec3 tint = mix(vec3(0.30,0.70,0.45), vec3(0.40,0.60,0.85), h);\n" +
          "float lum = dot(c, vec3(0.33));\n" +
          "float r = distance(uv, vec2(0.5));\n" +
          "vec3 base = tint * (0.22 * (1.0 - smoothstep(0.0, 0.8, r)));\n" + // soft teal cloud, always present
          "ret = mix(c, lum * tint * 1.8, 0.6) + base;\n" +
          "}\n"
      }
    );
    preset.waves[0] = circleWave("q1", "q2");
    preset.waves[0].baseVals.smoothing = 0.9;
    preset.waves[0].baseVals.a = 0.8;
    preset.waves[0].baseVals.r = 0.35; preset.waves[0].baseVals.g = 0.7; preset.waves[0].baseVals.b = 0.6;
    return preset;
  })();

  // ── Battery strawberryaid ──────────────────────────────────────────────────
  // Pink/red radial starburst: two jagged rings spiking outward on the bass.
  P["Battery strawberryaid"] = (function () {
    var preset = build(
      {
        wave_a: 0, wave_smoothing: 0.1, additivewave: 1, wave_scale: 1.4,
        decay: 0.93, gammaadj: 2.0, zoom: 1.0, rot: 0.01, warp: 0.05,
        cx: 0.5, cy: 0.5, darken_center: 0, wrap: 0
      },
      {
        frame: function (t) {
          var bass = t.bass_att || t.bass || 1;
          var treb = t.treb || 1;
          t.q1 = 0.5; t.q2 = 0.5; t.q3 = 0.5; t.q4 = 0.5;
          t.q5 = 0.14 + 0.12 * bass;
          t.q6 = 0.26 + 0.16 * bass;
          t.wave_scale = 1.0 + 0.9 * bass + 0.3 * treb;
          t.zoom = 1.0 + 0.02 * bass;
          t.rot = 0.01 + 0.003 * Math.sin(t.time * 0.3);
          t.decay = 0.93;
          return t;
        },
        comp:
          "shader_body {\n" +
          "vec3 c = texture2D(sampler_main, uv).rgb;\n" +
          "float lum = dot(c, vec3(0.4));\n" +
          // strawberryaid slowly cycles its warm hue over time (red <-> pink/berry).
          "vec3 pink = mix(vec3(0.95,0.16,0.22), vec3(0.95,0.30,0.62), 0.5+0.5*sin(time*0.06));\n" +
          "vec3 deep = vec3(0.22, 0.0, 0.06);\n" +
          "ret = deep + pink * lum * (1.6 + 0.8 * bass);\n" +
          "float d = distance(uv, vec2(0.5));\n" +
          "ret += vec3(0.5, 0.1, 0.2) * (0.25 - d) * 1.5;\n" +
          "}\n"
      }
    );
    preset.waves[0] = circleWave("q1", "q2");
    preset.waves[0].baseVals.smoothing = 0.05;
    preset.waves[0].baseVals.r = 0.95; preset.waves[0].baseVals.g = 0.25; preset.waves[0].baseVals.b = 0.45;
    preset.waves[1] = circleWave("q3", "q4");
    preset.waves[1].baseVals.smoothing = 0.05;
    preset.waves[1].baseVals.r = 0.95; preset.waves[1].baseVals.g = 0.35; preset.waves[1].baseVals.b = 0.55;
    preset.waves[1].point_eqs = function (a) {
      var ang = a.sample * 6.2832;
      var rad = (a.q6 || 0.26) + 0.07 * a.value1;
      a.x = 0.5 + rad * Math.cos(ang);
      a.y = 0.5 + rad * Math.sin(ang);
      return a;
    };
    return preset;
  })();

  // ── Battery my tornado is resting ──────────────────────────────────────────
  // Greyscale swirling vortex with a dark eye; smoky trails spiral inward.
  P["Battery my tornado is resting"] = (function () {
    var preset = build(
      {
        wave_a: 0, wave_smoothing: 0.7, additivewave: 1, wave_scale: 0.9,
        decay: 0.97, gammaadj: 1.9, zoom: 0.985, rot: 0.05, warp: 0.12,
        warpscale: 1.5, cx: 0.5, cy: 0.5, darken_center: 1, wrap: 0
      },
      {
        frame: function (t) {
          var bass = t.bass_att || t.bass || 1;
          t.q1 = 0.5 + 0.03 * Math.cos(t.time * 0.2);
          t.q2 = 0.5 + 0.03 * Math.sin(t.time * 0.2);
          t.q5 = 0.22 + 0.05 * bass;
          t.rot = 0.05 + 0.02 * bass;
          t.zoom = 0.985 - 0.006 * bass;
          t.decay = 0.97;
          return t;
        },
        comp:
          "shader_body {\n" +
          "vec3 c = texture2D(sampler_main, uv).rgb;\n" +
          "float lum = dot(c, vec3(0.33));\n" +
          "vec3 grey = vec3(lum) * vec3(1.0, 0.98, 0.95);\n" +
          "ret = mix(c, grey, 0.85);\n" +
          "float d = distance(uv, vec2(0.5));\n" +
          "ret *= smoothstep(0.04, 0.30, d);\n" +
          "}\n",
        warp:
          "shader_body {\n" +
          "vec2 d = uv - vec2(0.5);\n" +
          "float a = 0.25 / (length(d) + 0.15);\n" +
          "vec2 sw = vec2(d.x * cos(a) - d.y * sin(a), d.x * sin(a) + d.y * cos(a));\n" +
          "ret = texture2D(sampler_main, vec2(0.5) + sw).rgb;\n" +
          "ret -= 0.004;\n" +
          "}\n"
      }
    );
    preset.waves[0] = circleWave("q1", "q2");
    preset.waves[0].baseVals.smoothing = 0.6;
    preset.waves[0].baseVals.a = 0.4;
    preset.waves[0].baseVals.r = 0.7; preset.waves[0].baseVals.g = 0.7; preset.waves[0].baseVals.b = 0.7;
    return preset;
  })();

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
        wave_mode: 0, wave_smoothing: 0.9, wave_scale: 0.5, additivewave: 1,
        wave_r: 1.0, wave_g: 0.85, wave_b: 0.3, wave_a: 0.45,
        decay: 0.96, gammaadj: 1.8,
        zoom: 1.0, rot: 0.0, warp: 0.12, warpscale: 1.8, warpanimspeed: 0.6,
        cx: 0.5, cy: 0.5, darken_center: 0, wrap: 1
      },
      {
        frame: function (t) {
          var bass = t.bass_att || t.bass || 1;
          var treb = t.treb_att || t.treb || 1;
          t.warp = 0.10 + 0.06 * bass;
          t.warpanimspeed = 0.5 + 0.4 * treb;
          t.zoom = 1.0 + 0.004 * Math.sin(t.time * 0.3);
          t.rot = 0.01 * Math.sin(t.time * 0.2);
          t.decay = 0.96;
          t.wave_a = 0.30 + 0.30 * bass;
          t.wave_g = 0.82 + 0.10 * bass;
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
          "}\n"
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
        wave_mode: 0, wave_smoothing: 0.88, wave_scale: 0.55, additivewave: 1,
        wave_r: 1.0, wave_g: 0.82, wave_b: 0.28, wave_a: 0.4,
        decay: 0.95, gammaadj: 1.9,
        zoom: 1.04, rot: 0.02, warp: 0.05, warpscale: 1.2, warpanimspeed: 0.6,
        cx: 0.5, cy: 0.5, darken_center: 0, wrap: 0
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
          "}\n"
      }
    );
    return preset;
  })();

  // ── Ambience Anon ───────────────────────────────────────────────────────────
  // Anonymous slow-morphing amber cloud: a soft fbm mass that breathes, with a
  // faint waveform heartbeat fed in. Deliberately minimal, very smooth.
  P["Ambience Anon"] = build(
    {
      wave_mode: 0, wave_smoothing: 0.95, wave_scale: 0.3, additivewave: 1,
      wave_r: 1.0, wave_g: 0.86, wave_b: 0.32, wave_a: 0.18,
      decay: 0.97, gammaadj: 1.7,
      zoom: 1.0, rot: 0.0, warp: 0.05, warpscale: 1.6, warpanimspeed: 0.2,
      cx: 0.5, cy: 0.5, darken_center: 0, wrap: 1
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
        "}\n"
    }
  );

  // ── Ambience Falloff ────────────────────────────────────────────────────────
  // Light cascading downward: feedback drifts down each frame so the live waveform
  // leaves amber streaks raining toward the bottom, with a faint sideways sway.
  P["Ambience Falloff"] = build(
    {
      wave_mode: 0, wave_smoothing: 0.9, wave_scale: 0.5, additivewave: 1,
      wave_r: 1.0, wave_g: 0.84, wave_b: 0.3, wave_a: 0.4,
      decay: 0.955, gammaadj: 1.85,
      zoom: 1.0, rot: 0.0, warp: 0.04, warpscale: 1.6, warpanimspeed: 0.5,
      cx: 0.5, cy: 0.3, dx: 0.0, dy: 0.012, darken_center: 0, wrap: 1
    },
    {
      frame: function (t) {
        var bass = t.bass_att || t.bass || 1;
        var treb = t.treb_att || t.treb || 1;
        t.dy = 0.010 + 0.006 * bass;
        t.dx = 0.002 * Math.sin(t.time * 0.4);
        t.warp = 0.04 + 0.03 * treb;
        t.zoom = 1.0;
        t.decay = 0.955;
        t.wave_a = 0.25 + 0.30 * bass;
        t.cy = 0.30 + 0.04 * Math.sin(t.time * 0.2);
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
        "}\n"
    }
  );

  // ── Ambience Bubble ─────────────────────────────────────────────────────────
  // Round amber bubbles floating up: four soft glowing metaball circles drift and
  // pulse with bass, drawn as live circular waveforms (each a real-audio ring).
  P["Ambience Bubble"] = (function () {
    var preset = build(
      {
        wave_a: 0,
        wave_mode: 0, wave_smoothing: 0.9, additivewave: 1,
        decay: 0.95, gammaadj: 1.9,
        zoom: 1.0, rot: 0.0, warp: 0.05, warpscale: 1.4, warpanimspeed: 0.4,
        cx: 0.5, cy: 0.5, dx: 0.0, dy: -0.004, darken_center: 0, wrap: 1
      },
      {
        frame: function (t) {
          var bass = t.bass_att || t.bass || 1;
          t.dy = -0.003 - 0.004 * bass;
          t.warp = 0.04 + 0.02 * bass;
          t.zoom = 1.0 + 0.003 * Math.sin(t.time * 0.3);
          t.decay = 0.95;
          t.q1 = 0.30 + 0.10 * Math.sin(t.time * 0.50);
          t.q2 = 0.40 + 0.15 * Math.sin(t.time * 0.27 + 1.0);
          t.q3 = 0.70 + 0.10 * Math.sin(t.time * 0.40 + 2.0);
          t.q4 = 0.55 + 0.18 * Math.sin(t.time * 0.31 + 3.0);
          t.q6 = 0.50 + 0.12 * Math.sin(t.time * 0.43 + 4.0);
          t.q7 = 0.35 + 0.16 * Math.sin(t.time * 0.22 + 5.0);
          t.q8 = 0.60 + 0.10 * Math.sin(t.time * 0.37 + 6.0);
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
          "}\n"
      }
    );
    preset.waves[0] = circleWave("q1", "q2");
    preset.waves[1] = circleWave("q3", "q4");
    preset.waves[2] = circleWave("q6", "q7");
    preset.waves[3] = circleWave("q8", "q9");
    preset.waves.forEach(function (w) {
      w.baseVals.r = 1.0; w.baseVals.g = 1.0; w.baseVals.b = 1.0;
      w.baseVals.a = 0.7; w.baseVals.smoothing = 0.5;
    });
    return preset;
  })();

  // ── Ambience Dizzy ──────────────────────────────────────────────────────────
  // Dizzying spiral: fast rotation plus a center-pulling swirl warp; amber glow on
  // black, driven by a real circular waveform whose radius pulses with the bass.
  P["Ambience Dizzy"] = (function () {
    var preset = build(
      {
        wave_a: 0, decay: 0.96, gammaadj: 1.8, zoom: 1.02,
        rot: 0.06, warp: 0.10, warpscale: 1.4, warpanimspeed: 1.2,
        darken_center: 0, wrap: 0
      },
      {
        frame: function (t) {
          var b = t.bass_att || t.bass || 1;
          var tr = t.treb_att || t.treb || 1;
          t.rot = 0.05 + 0.10 * b;
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
          "}\n"
      }
    );
    preset.waves[0] = circleWave("q1", "q2");
    preset.waves[0].baseVals.r = 0.4; preset.waves[0].baseVals.g = 0.95; preset.waves[0].baseVals.b = 1.0;
    return preset;
  })();

  // ── Ambience Windmill ─────────────────────────────────────────────────────
  // Four real-audio spokes (an 8-armed blade set) rotating about the center over a
  // faint amber radial glow; spin and blade length react to the audio.
  P["Ambience Windmill"] = (function () {
    var preset = build(
      {
        wave_a: 0, decay: 0.94, gammaadj: 1.8, zoom: 1.0,
        rot: 0.0, warp: 0.02, darken_center: 0, wrap: 0
      },
      {
        frame: function (t) {
          var b = t.bass_att || t.bass || 1;
          t.q1 = t.time * (0.4 + 0.4 * b);
          t.q6 = 0.16 + 0.10 * b;
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
          "}\n"
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
          var ct = Math.cos(th), st = Math.sin(th);
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
        wave_a: 0, decay: 0.97, gammaadj: 1.7, zoom: 1.0,
        dy: 0.012, warp: 0.03, darken_center: 0, wrap: 1
      },
      {
        frame: function (t) {
          var b = t.bass_att || t.bass || 1;
          var tr = t.treb_att || t.treb || 1;
          t.dy = 0.010 + 0.012 * b;
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
        comp: tintComp("vec3(0.10,0.80,0.80)", "vec3(0.10,0.35,0.95)", "0.06", "1.6")
      }
    );
    preset.waves[0] = circleWave("q1", "q2");
    preset.waves[0].baseVals.r = 0.95;
    preset.waves[0].baseVals.g = 0.95;
    preset.waves[0].baseVals.b = 0.80;
    return preset;
  })();

  // ── Ambience Blender ────────────────────────────────────────────────────────
  // A blender vortex: like Dizzy but more churning — the swirl is perturbed by fbm
  // so everything tumbles as it is blended into the center; amber.
  P["Ambience Blender"] = (function () {
    var preset = build(
      {
        wave_a: 0, decay: 0.95, gammaadj: 1.8, zoom: 1.03,
        rot: 0.04, warp: 0.12, warpscale: 1.6, warpanimspeed: 1.5,
        darken_center: 0, wrap: 0
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
          "}\n"
      }
    );
    preset.waves[0] = circleWave("q1", "q2");
    preset.waves[0].baseVals.r = 0.6; preset.waves[0].baseVals.g = 0.6; preset.waves[0].baseVals.b = 1.0;
    return preset;
  })();

  // ── Ambience X Marks the Spot ───────────────────────────────────────────────
  // A glowing amber X: two crossed real-audio spokes at +/-45 deg that pulse with
  // the waveform, over a soft center bloom; the X slowly rotates.
  P["Ambience X Marks the Spot"] = (function () {
    var preset = build(
      {
        wave_a: 0, decay: 0.95, gammaadj: 1.8, zoom: 1.0,
        rot: 0.0, warp: 0.02, darken_center: 0, wrap: 0
      },
      {
        frame: function (t) {
          var b = t.bass_att || t.bass || 1;
          t.q1 = t.time * 0.15;
          t.q6 = 0.14 + 0.10 * b;
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
          "}\n"
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
          var ct = Math.cos(th), st = Math.sin(th);
          a.x = 0.5 + s * 0.55 * ct - a.value1 * amp * st;
          a.y = 0.5 + s * 0.55 * st + a.value1 * amp * ct;
          return a;
        };
      })(offs[i], i);
    }
    return preset;
  })();

  // ════════════════════════════════════════════════════════════════════════
  // BATTERY family (colorful, energetic, center-focused; mostly fixed hue).
  // Every preset carries a real-audio element (circleWave/spokeLine/waveLine).
  // ════════════════════════════════════════════════════════════════════════

  // ── Battery brightsphere ──────────────────────────────────────────────────
  // A luminous shaded orb (rim-lit, bright core) swelling with bass on near-black,
  // wrapped by a real-audio circular waveform ring. Cool white/cyan-blue.
  P["Battery brightsphere"] = (function () {
    var preset = build(
      {
        wave_a: 0, decay: 0.90, gammaadj: 2.0, zoom: 1.0, warp: 0.02,
        darken_center: 0, wrap: 0, echo_alpha: 0
      },
      {
        frame: function (t) {
          var bass = t.bass_att || t.bass || 1;
          t.q1 = 0.5;
          t.q2 = 0.5;
          t.q5 = 0.20 + 0.08 * bass;
          t.decay = 0.90;
          return t;
        },
        comp:
          "shader_body {\n" +
          "vec3 prev = texture2D(sampler_main, uv).rgb;\n" +
          "vec2 d = uv - vec2(0.5);\n" +
          "d.x *= resolution.x / resolution.y;\n" +
          "float r = length(d);\n" +
          "float rad = 0.26 + 0.07 * bass;\n" +
          "float core = exp(-r*r * 22.0) * (1.0 + 0.6*bass_att);\n" +
          "float rim = smoothstep(rad, rad*0.7, r) * smoothstep(rad*0.45, rad*0.75, r);\n" +
          "float shade = clamp(1.0 - r/rad, 0.0, 1.0);\n" +
          "shade = pow(shade, 1.5);\n" +
          "vec3 sphereCol = vec3(0.45, 0.78, 1.0);\n" +
          "vec3 orb = sphereCol * (shade*0.55 + rim*0.9) + vec3(0.85,0.95,1.0)*core;\n" +
          "ret = prev * 0.55 + orb;\n" +
          "}\n"
      }
    );
    preset.waves[0] = circleWave("q1", "q2");
    preset.waves[0].baseVals.r = 0.7;
    preset.waves[0].baseVals.g = 0.92;
    preset.waves[0].baseVals.b = 1.0;
    preset.waves[0].baseVals.a = 0.9;
    preset.waves[0].baseVals.smoothing = 0.2;
    return preset;
  })();

  // ── Battery cominatcha ──────────────────────────────────────────────────────
  // "Comin' at cha": jagged real-audio rings spawn at center and fly OUTWARD via
  // feedback zoom > 1, aggressive and fast. Electric cyan.
  P["Battery cominatcha"] = (function () {
    var preset = build(
      {
        wave_a: 0, decay: 0.93, gammaadj: 2.1, zoom: 1.07, warp: 0.03,
        darken_center: 0, wrap: 0, echo_alpha: 0
      },
      {
        frame: function (t) {
          var bass = t.bass_att || t.bass || 1;
          var treb = t.treb_att || t.treb || 1;
          t.q1 = 0.5;
          t.q2 = 0.5;
          t.q5 = 0.06 + 0.05 * bass;
          t.zoom = 1.05 + 0.04 * bass;
          t.rot = 0.02 * (treb - 1.0);
          t.decay = 0.93;
          return t;
        },
        comp:
          "shader_body {\n" +
          "vec3 prev = texture2D(sampler_main, uv).rgb;\n" +
          "float lum = dot(prev, vec3(0.33));\n" +
          "vec3 tint = mix(vec3(0.0,0.7,1.0), vec3(0.0,1.0,0.85), lum);\n" +
          "ret = tint * lum * 1.5;\n" +
          "float d = distance(uv, vec2(0.5));\n" +
          "ret += vec3(0.1,0.8,1.0) * exp(-d*d*10.0) * (0.10 + 0.4*bass);\n" +
          "}\n"
      }
    );
    preset.waves[0] = circleWave("q1", "q2");
    preset.waves[0].baseVals.r = 0.2;
    preset.waves[0].baseVals.g = 0.95;
    preset.waves[0].baseVals.b = 1.0;
    preset.waves[0].baseVals.smoothing = 0.05;
    preset.waves[0].point_eqs = function (a) {
      var ang = a.sample * 6.2832;
      var rad = (a.q5 || 0.06) + 0.09 * a.value1;
      a.x = (a.q1 || 0.5) + rad * Math.cos(ang);
      a.y = (a.q2 || 0.5) + rad * Math.sin(ang);
      return a;
    };
    return preset;
  })();

  // ── Battery cottonstar ──────────────────────────────────────────────────────
  // Soft fluffy pastel star: a gentle blurry bloom with feathered edges, slow.
  // Pastel pink/lavender; carries a soft real-audio ring for the beat.
  P["Battery cottonstar"] = (function () {
    var preset = build(
      {
        wave_a: 0, decay: 0.96, gammaadj: 1.9, zoom: 1.005, warp: 0.05, warpscale: 0.8,
        darken_center: 0, wrap: 0, echo_alpha: 0
      },
      {
        frame: function (t) {
          var bass = t.bass_att || t.bass || 1;
          t.q1 = 0.5;
          t.q2 = 0.5;
          t.q5 = 0.16 + 0.05 * bass;
          t.rot = 0.01;
          t.decay = 0.96;
          return t;
        },
        comp:
          "shader_body {\n" +
          "vec3 prev = texture2D(sampler_main, uv).rgb;\n" +
          "vec2 d = uv - vec2(0.5);\n" +
          "d.x *= resolution.x / resolution.y;\n" +
          "float r = length(d);\n" +
          "float ang = atan(d.y, d.x);\n" +
          "float star = 0.5 + 0.5 * cos(ang * 5.0);\n" +
          "float reach = (0.18 + 0.05*bass) * (0.6 + 0.4*star);\n" +
          "float glow = exp(-r*r / (reach*reach + 0.002));\n" +
          "glow = pow(glow, 1.3);\n" +
          // WMP cottonstar cycles white <-> teal over time.
          "vec3 petal = mix(vec3(0.95,1.0,1.0), vec3(0.20,0.88,0.82), 0.5+0.5*sin(time*0.06));\n" +
          "ret = prev * 0.86 + petal * glow * (0.5 + 0.4*bass_att);\n" +
          "}\n"
      }
    );
    preset.waves[0] = circleWave("q1", "q2");
    preset.waves[0].baseVals.r = 0.7;
    preset.waves[0].baseVals.g = 1.0;
    preset.waves[0].baseVals.b = 0.95;
    preset.waves[0].baseVals.a = 0.7;
    preset.waves[0].baseVals.smoothing = 0.4;   // keep the jagged song waveform visible
    return preset;
  })();

  // ── Battery dandelion ─────────────────────────────────────────────────────
  // A dandelion seed-head: 3 real-audio spokes (6 arms) slowly rotating, plus a
  // dotted real-audio seed-ring at the tips. White / pale-yellow on dark.
  P["Battery dandelion"] = (function () {
    var DAND = [1.0, 1.0, 1.0];   // white seeds; the comp owns the cycling hue
    var preset = build(
      {
        wave_a: 0, decay: 0.91, gammaadj: 2.0, zoom: 1.0, warp: 0.01,
        darken_center: 0, wrap: 0, echo_alpha: 0
      },
      {
        frame: function (t) {
          var bass = t.bass_att || t.bass || 1;
          t.q1 = t.time * 0.25;
          t.q2 = 0.5;
          t.q3 = 0.5;
          t.q5 = 0.40 + 0.05 * bass;
          t.decay = 0.91;
          return t;
        },
        comp:
          // WMP dandelion cycles teal <-> magenta over time.
          "shader_body {\n" +
          "vec3 c = texture2D(sampler_main, uv).rgb;\n" +
          "float lum = dot(c, vec3(0.4));\n" +
          "vec3 tint = mix(vec3(0.15,0.90,0.80), vec3(0.95,0.25,0.85), 0.5+0.5*sin(time*0.05));\n" +
          "ret = tint * lum * 1.7;\n" +
          "float d = distance(uv, vec2(0.5));\n" +
          "ret += tint * exp(-d*d*6.0) * 0.08;\n" +
          "}\n"
      }
    );
    // 3 spokes at 0/60/120 deg => a 6-armed seed-head, sharing rotation a.q1.
    var offsets = [0.0, Math.PI / 3, 2 * Math.PI / 3];
    for (var i = 0; i < offsets.length; i++) {
      preset.waves[i] = spokeLine(0, 0.42, 0.05, DAND[0], DAND[1], DAND[2]);
      (function (off, idx) {
        preset.waves[idx].point_eqs = function (a) {
          var th = (a.q1 || 0.0) + off;
          var ct = Math.cos(th), st = Math.sin(th);
          var s = a.sample * 2.0 - 1.0;
          a.x = 0.5 + s * 0.42 * ct - a.value1 * 0.05 * st;
          a.y = 0.5 + s * 0.42 * st + a.value1 * 0.05 * ct;
          return a;
        };
      })(offsets[i], i);
    }
    // Dotted seed-ring near the spoke tips.
    preset.waves[3] = circleWave("q2", "q3");
    preset.waves[3].baseVals.usedots = 1;
    preset.waves[3].baseVals.r = 1.0;
    preset.waves[3].baseVals.g = 1.0;
    preset.waves[3].baseVals.b = 1.0;
    preset.waves[3].baseVals.smoothing = 0.3;
    return preset;
  })();

  // ── Battery drinkdeep ─────────────────────────────────────────────────────
  // A deep liquid well: inward pull (zoom < 1) + swirl draws everything down into a
  // dark center; deep blue/indigo. Real-audio ring ripples on the surface.
  P["Battery drinkdeep"] = (function () {
    var preset = build(
      {
        wave_a: 0, decay: 0.95, gammaadj: 1.9, zoom: 0.97, warp: 0.0,
        darken_center: 1, wrap: 0, echo_alpha: 0
      },
      {
        frame: function (t) {
          var bass = t.bass_att || t.bass || 1;
          t.q1 = 0.5;
          t.q2 = 0.5;
          t.q5 = 0.26 + 0.06 * bass;
          t.zoom = 0.95 - 0.02 * bass;
          t.decay = 0.95;
          return t;
        },
        warp:
          "shader_body {\n" +
          "vec2 d = uv - vec2(0.5);\n" +
          "float a = 0.25 / (length(d) + 0.15);\n" +
          "vec2 sw = vec2(d.x*cos(a)-d.y*sin(a), d.x*sin(a)+d.y*cos(a));\n" +
          "ret = texture2D(sampler_main, vec2(0.5)+sw*0.985).rgb;\n" +
          "ret -= 0.004;\n" +
          "}\n",
        comp:
          "shader_body {\n" +
          "vec3 prev = texture2D(sampler_main, uv).rgb;\n" +
          "float lum = dot(prev, vec3(0.33));\n" +
          "vec3 tint = mix(vec3(0.06,0.10,0.45), vec3(0.15,0.35,0.85), lum);\n" +
          "ret = tint * lum * 1.6;\n" +
          "float d = distance(uv, vec2(0.5));\n" +
          "ret *= smoothstep(0.0, 0.30, d);\n" +
          "ret += vec3(0.1,0.25,0.6) * exp(-d*d*7.0) * (0.05 + 0.15*bass);\n" +
          "}\n"
      }
    );
    preset.waves[0] = circleWave("q1", "q2");
    preset.waves[0].baseVals.r = 0.4;
    preset.waves[0].baseVals.g = 0.6;
    preset.waves[0].baseVals.b = 1.0;
    preset.waves[0].baseVals.a = 0.7;
    preset.waves[0].baseVals.smoothing = 0.5;
    return preset;
  })();

  // ── Battery elektrination ───────────────────────────────────────────────────
  // Electric lightning: several jagged real-audio bolts crossing center, flickering
  // with treble, electric cyan-white on near-black with a faint blue glow.
  P["Battery elektrination"] = (function () {
    var preset = build(
      { wave_a: 0, decay: 0.90, gammaadj: 2.1, zoom: 1.0, warp: 0.02, wrap: 0, darken_center: 1 },
      {
        frame: function (t) {
          var tr = t.treb || 1, ba = t.bass_att || 1;
          t.q1 = t.time * 0.25;
          t.q2 = 0.5;
          t.q3 = 0.5;
          t.q10 = 0.45 + 0.55 * Math.min(tr, 2.0);
          t.warp = 0.02 + 0.05 * (tr - 1);
          t.decay = 0.90;
          t.zoom = 1.0 + 0.01 * (ba - 1);
          return t;
        },
        comp:
          "shader_body {\n" +
          "vec2 w = uv;\n" +
          "ret = texture2D(sampler_main, w).rgb;\n" +
          "vec2 d = uv - vec2(0.5);\n" +
          "d.x *= resolution.x/resolution.y;\n" +
          "float glow = 0.05/(length(d)*8.0 + 0.4);\n" +
          "ret += vec3(0.06, 0.30, 0.12) * glow * (0.6 + 0.5*treb);\n" +   // green electric glow
          "}\n"
      }
    );
    var bolts = 4;
    for (var i = 0; i < bolts; i++) {
      (function (idx) {
        var off = (Math.PI / bolts) * idx;
        var wl = waveLine();
        wl.baseVals.smoothing = 0.02;
        wl.baseVals.r = 0.55; wl.baseVals.g = 1.0; wl.baseVals.b = 0.6; wl.baseVals.a = 0.85;
        wl.baseVals.additive = 1; wl.baseVals.usedots = 0;
        wl.point_eqs = function (a) {
          var ang = (a.q1 || 0) + off;
          var s = (a.sample - 0.5);
          var disp = ((a.value1 || 0.5) - 0.5) * 1.2;
          var c = Math.cos(ang), sn = Math.sin(ang);
          a.x = 0.5 + s * c - disp * sn;
          a.y = 0.5 + s * sn + disp * c;
          var fl = a.q10 || 0.6;
          a.r = 0.55 * fl; a.g = 1.0 * fl; a.b = 0.6 * fl; a.a = 0.85 * fl;
          return a;
        };
        preset.waves[idx] = wl;
      })(i);
    }
    return preset;
  })();

  // ── Battery event horizon ─────────────────────────────────────────────────
  // A black hole: a hot orange/gold accretion ring (real-audio circleWave) orbiting
  // a DARK center, with a lensing swirl pulling light around.
  P["Battery event horizon"] = (function () {
    var preset = build(
      { wave_a: 0, decay: 0.94, gammaadj: 2.0, zoom: 1.0, warp: 0.0, wrap: 0, darken_center: 1 },
      {
        frame: function (t) {
          var ba = t.bass_att || 1;
          t.q1 = 0.5;
          t.q2 = 0.5;
          t.q5 = 0.18 + 0.07 * (ba - 1);
          t.q3 = t.time * 0.4;
          t.decay = 0.94;
          return t;
        },
        comp:
          "shader_body {\n" +
          "vec2 d = uv - vec2(0.5);\n" +
          "float a = 0.30/(length(d)+0.12);\n" +
          "vec2 sw = vec2(d.x*cos(a)-d.y*sin(a), d.x*sin(a)+d.y*cos(a));\n" +
          "ret = texture2D(sampler_main, vec2(0.5)+sw*0.99).rgb;\n" +
          "vec2 dd = uv - vec2(0.5);\n" +
          "dd.x *= resolution.x/resolution.y;\n" +
          "float core = smoothstep(0.0, 0.20, length(dd));\n" +
          "ret *= core;\n" +
          "ret -= 0.004;\n" +
          "}\n"
      }
    );
    preset.waves[0] = circleWave("q1", "q2");
    preset.waves[0].baseVals.r = 1.0;
    preset.waves[0].baseVals.g = 0.55;
    preset.waves[0].baseVals.b = 0.10;
    preset.waves[0].baseVals.a = 0.9;
    preset.waves[0].baseVals.additive = 1;
    preset.waves[0].baseVals.smoothing = 0.5;
    preset.waves[0].point_eqs = function (a) {
      var cx = a.q1 || 0.5, cy = a.q2 || 0.5;
      var ang = a.sample * 6.2831853 + (a.q3 || 0);
      var rad = (a.q5 || 0.18) + 0.10 * ((a.value1 || 0.5) - 0.5);
      a.x = cx + rad * Math.cos(ang);
      a.y = cy + rad * Math.sin(ang);
      var heat = 0.7 + 0.3 * (a.value1 || 0.5);
      a.r = 1.0 * heat; a.g = 0.55 * heat; a.b = 0.10 * heat; a.a = 0.9;
      return a;
    };
    return preset;
  })();

  // ── Battery hzodge ──────────────────────────────────────────────────────────
  // Abstract hodge-podge: turbulent fbm warp churn + a real-audio ring layered on
  // top. One bold fixed hue (magenta/purple) so it reads as energy, not mud.
  P["Battery hzodge"] = (function () {
    var preset = build(
      { wave_a: 0, decay: 0.93, gammaadj: 1.9, zoom: 1.0, warp: 0.06, wrap: 1, darken_center: 1 },
      {
        frame: function (t) {
          var m = t.mid || 1, ba = t.bass_att || 1;
          t.q1 = 0.5;
          t.q2 = 0.5;
          t.q5 = 0.14 + 0.06 * (ba - 1);
          t.warp = 0.06 + 0.05 * (m - 1);
          t.rot = 0.02 * Math.sin(t.time * 0.3);
          t.decay = 0.93;
          return t;
        },
        warp:
          NOISE_GLSL +
          "shader_body {\n" +
          "vec2 w = uv;\n" +
          "vec2 d = w - vec2(0.5);\n" +
          "d.x *= resolution.x/resolution.y;\n" +
          "float n = fbm(d*3.0 + vec2(time*0.15, -time*0.10));\n" +
          "vec2 off = vec2(n - 0.5, fbm(d*3.0 + 7.3) - 0.5) * (0.02 + 0.03*bass);\n" +
          "ret = texture2D(sampler_main, w + off).rgb;\n" +
          "}\n",
        comp:
          "shader_body {\n" +
          "vec2 w = uv;\n" +
          "vec3 c = texture2D(sampler_main, w).rgb;\n" +
          "float l = dot(c, vec3(0.33));\n" +
          // WMP hzodge is a green/teal swirl, not magenta.
          "vec3 grn = vec3(0.18, 0.85, 0.55);\n" +
          "ret = grn * (0.3 + 1.3*l);\n" +
          "vec2 d = uv - vec2(0.5);\n" +
          "d.x *= resolution.x/resolution.y;\n" +
          "ret += vec3(0.04, 0.25, 0.18) * (0.04/(length(d)+0.15)) * (0.5+0.5*bass);\n" +
          "}\n"
      }
    );
    preset.waves[0] = circleWave("q1", "q2");
    preset.waves[0].baseVals.r = 0.35;
    preset.waves[0].baseVals.g = 1.0;
    preset.waves[0].baseVals.b = 0.70;
    preset.waves[0].baseVals.a = 0.85;
    preset.waves[0].baseVals.additive = 1;
    preset.waves[0].baseVals.smoothing = 0.25;
    return preset;
  })();

  // ── Battery sepalvel ──────────────────────────────────────────────────────
  // Petals / velvet: soft layered petal arcs rotating gently, plush velvety look,
  // deep red/crimson. A real-audio ring whose spikes form petal tips.
  P["Battery sepalvel"] = (function () {
    var preset = build(
      { wave_a: 0, decay: 0.95, gammaadj: 1.8, zoom: 0.995, warp: 0.03, wrap: 0, darken_center: 1 },
      {
        frame: function (t) {
          var ba = t.bass_att || 1, m = t.mid || 1;
          t.q1 = 0.5;
          t.q2 = 0.5;
          t.q5 = 0.16 + 0.05 * (ba - 1);
          t.q3 = t.time * 0.18;
          t.rot = 0.01 + 0.01 * Math.sin(t.time * 0.2);
          t.zoom = 0.995;
          t.warp = 0.03 + 0.02 * (m - 1);
          t.decay = 0.95;
          return t;
        },
        comp:
          "shader_body {\n" +
          "vec2 w = uv;\n" +
          "vec3 c = texture2D(sampler_main, w).rgb;\n" +
          "float l = dot(c, vec3(0.33));\n" +
          "vec3 crimson = vec3(0.75, 0.06, 0.16);\n" +
          "vec3 deep = vec3(0.18, 0.0, 0.05);\n" +
          "ret = mix(deep, crimson, l*1.4);\n" +
          "vec2 d = uv - vec2(0.5);\n" +
          "d.x *= resolution.x/resolution.y;\n" +
          "float velvet = 0.05/(length(d)+0.25);\n" +
          "ret += vec3(0.20, 0.0, 0.04) * velvet * (0.6+0.4*bass_att);\n" +
          "}\n"
      }
    );
    preset.waves[0] = circleWave("q1", "q2");
    preset.waves[0].baseVals.r = 0.85;
    preset.waves[0].baseVals.g = 0.10;
    preset.waves[0].baseVals.b = 0.22;
    preset.waves[0].baseVals.a = 0.75;
    preset.waves[0].baseVals.additive = 1;
    preset.waves[0].baseVals.smoothing = 0.4;   // let the song waveform shape the petal tips
    preset.waves[0].point_eqs = function (a) {
      var cx = a.q1 || 0.5, cy = a.q2 || 0.5;
      var ang = a.sample * 6.2831853 + (a.q3 || 0);
      var petal = 0.06 * Math.abs(Math.sin(ang * 3.0));
      var rad = (a.q5 || 0.16) + petal + 0.12 * ((a.value1 || 0.5) - 0.5);
      a.x = cx + rad * Math.cos(ang);
      a.y = cy + rad * Math.sin(ang);
      a.r = 0.85; a.g = 0.10; a.b = 0.22; a.a = 0.75;
      return a;
    };
    return preset;
  })();

  // ── Battery illuminator ─────────────────────────────────────────────────────
  // Radiating light beams: bright real-audio spokes shooting outward from center,
  // god-ray feel, warm white/gold on near-black.
  P["Battery illuminator"] = (function () {
    var preset = build(
      { wave_a: 0, decay: 0.92, gammaadj: 2.1, zoom: 1.02, warp: 0.0, wrap: 0, darken_center: 0 },
      {
        frame: function (t) {
          var ba = t.bass_att || 1;
          t.q1 = t.time * 0.15;
          t.q10 = 0.5 + 0.5 * Math.min(ba, 2.0);
          t.zoom = 1.02 + 0.02 * (ba - 1);
          t.decay = 0.92;
          return t;
        },
        comp:
          "shader_body {\n" +
          "vec2 w = uv;\n" +
          "ret = texture2D(sampler_main, w).rgb;\n" +
          "vec2 d = uv - vec2(0.5);\n" +
          "d.x *= resolution.x/resolution.y;\n" +
          "float bloom = 0.07/(length(d)*6.0 + 0.3);\n" +
          "ret += vec3(0.30, 0.24, 0.10) * bloom * (0.6 + 0.5*bass_att);\n" +
          "}\n"
      }
    );
    var beams = 6;
    for (var i = 0; i < beams; i++) {
      (function (idx) {
        var off = (2 * Math.PI / beams) * idx;
        var sp = spokeLine(0, 0.48, 0.06, 1.0, 0.92, 0.6);
        sp.baseVals.smoothing = 0.4; sp.baseVals.additive = 1; sp.baseVals.usedots = 0;
        sp.point_eqs = function (a) {
          var ang = (a.q1 || 0) + off;
          var s = (a.sample - 0.5) * 2.0;
          var disp = ((a.value1 || 0.5) - 0.5) * 0.5;
          var c = Math.cos(ang), sn = Math.sin(ang);
          a.x = 0.5 + s * 0.48 * c - disp * sn;
          a.y = 0.5 + s * 0.48 * sn + disp * c;
          var br = a.q10 || 0.7;
          var taper = 1.0 - Math.abs(s);
          a.r = 1.0 * br * (0.5 + 0.5 * taper);
          a.g = 0.92 * br * (0.5 + 0.5 * taper);
          a.b = 0.6 * br * (0.5 + 0.5 * taper);
          a.a = 0.8 * br;
          return a;
        };
        preset.waves[idx] = sp;
      })(i);
    }
    return preset;
  })();

  // ── Battery i learned the truth ─────────────────────────────────────────────
  // A revelation: a white/gold core flashes from center on the beat (real-audio
  // ring expanding outward with bass) fading into a deep blue surround.
  P["Battery i learned the truth"] = (function () {
    var preset = build(
      { wave_a: 0, decay: 0.93, gammaadj: 2.0, zoom: 1.0, warp: 0.02, darken_center: 0, wrap: 0 },
      {
        frame: function (t) {
          var bass = t.bass_att || t.bass || 1;
          var treb = t.treb || 1;
          t.q1 = 0.5; t.q2 = 0.5;
          t.q5 = 0.08 + 0.30 * bass;
          t.q6 = 0.04 + 0.06 * treb;
          t.zoom = 1.012 + 0.02 * bass;
          t.decay = 0.93;
          return t;
        },
        comp:
          "shader_body {\n" +
          "vec3 c = texture2D(sampler_main, uv).rgb;\n" +
          "vec2 d = uv - 0.5;\n" +
          "d.x *= resolution.x / resolution.y;\n" +
          "float r = length(d);\n" +
          "float core = exp(-r*r*14.0) * (0.25 + 1.1*bass);\n" +
          "vec3 flash = vec3(1.0, 0.92, 0.65) * core;\n" +
          "vec3 surround = vec3(0.04, 0.10, 0.40) * (0.6 + 0.4*mid);\n" +
          "ret = c + flash + surround * smoothstep(0.0, 0.7, r) * 0.5;\n" +
          "}\n"
      }
    );
    preset.waves[0] = circleWave("q1", "q2");
    preset.waves[0].baseVals.r = 1.0;
    preset.waves[0].baseVals.g = 0.92;
    preset.waves[0].baseVals.b = 0.6;
    preset.waves[0].baseVals.a = 1.0;
    preset.waves[0].baseVals.smoothing = 0.2;
    preset.waves[0].point_eqs = function (a) {
      var ang = a.sample * 6.2832;
      var rad = (a.q5 || 0.15) + (a.q6 || 0.05) * a.value1;
      a.x = 0.5 + rad * Math.cos(ang);
      a.y = 0.5 + rad * Math.sin(ang);
      return a;
    };
    return preset;
  })();

  // ── Battery kaleidovision ───────────────────────────────────────────────────
  // A kaleidoscope: 6-fold mirror symmetry of a churning real-audio waveform field,
  // full RAINBOW (pal) that constantly shifts with time and radius.
  P["Battery kaleidovision"] = (function () {
    var preset = build(
      { wave_a: 0, decay: 0.94, gammaadj: 1.9, zoom: 1.0, warp: 0.03, rot: 0.01, darken_center: 0, wrap: 0 },
      {
        frame: function (t) {
          var bass = t.bass_att || t.bass || 1;
          t.q1 = 0.5 + 0.18 * Math.cos(t.time * 0.7);
          t.q2 = 0.5 + 0.18 * Math.sin(t.time * 0.9);
          t.q5 = 0.14 + 0.07 * bass;
          t.rot = 0.01 + 0.02 * Math.sin(t.time * 0.3);
          t.decay = 0.94;
          return t;
        },
        comp:
          PAL_GLSL +
          "shader_body {\n" +
          "vec2 d = uv - 0.5;\n" +
          "d.x *= resolution.x / resolution.y;\n" +
          "float PI = 3.14159265;\n" +
          "float seg = 2.0*PI/6.0;\n" +
          "float ang = atan(d.y, d.x);\n" +
          "ang = abs(mod(ang, seg) - seg*0.5);\n" +
          "float rad = length(d);\n" +
          "vec2 m = rad * vec2(cos(ang), sin(ang)) + 0.5;\n" +
          "vec3 c = texture2D(sampler_main, m).rgb;\n" +
          "float lum = dot(c, vec3(0.33));\n" +
          // WMP kaleidovision is GREEN-dominant with faint spectral speckle, not full rainbow.
          "vec3 speck = pal(time*0.05 + rad*1.5);\n" +
          "vec3 col = mix(vec3(0.30,1.0,0.40), speck, 0.22);\n" +
          "ret = col * lum * 1.7;\n" +
          "ret += vec3(0.30,1.0,0.40) * exp(-rad*rad*9.0) * (0.10 + 0.35*bass);\n" +
          "}\n"
      }
    );
    preset.waves[0] = circleWave("q1", "q2");
    preset.waves[0].baseVals.r = 1.0;
    preset.waves[0].baseVals.g = 1.0;
    preset.waves[0].baseVals.b = 1.0;
    preset.waves[0].baseVals.smoothing = 0.05;
    return preset;
  })();

  // ── Battery chemicalnova ────────────────────────────────────────────────────
  // An explosive nova: violent radial starburst — real-audio circleWave with BIG
  // spikes scaled hard by bass (low smoothing); toxic green/cyan with a hot core.
  P["Battery chemicalnova"] = (function () {
    var preset = build(
      { wave_a: 0, decay: 0.91, gammaadj: 2.1, zoom: 1.0, warp: 0.05, darken_center: 0, wrap: 0 },
      {
        frame: function (t) {
          var bass = t.bass_att || t.bass || 1;
          var treb = t.treb_att || t.treb || 1;
          t.q1 = 0.5; t.q2 = 0.5;
          t.q5 = 0.07 + 0.04 * treb;
          t.q6 = 0.18 + 0.40 * bass;
          t.zoom = 1.01 + 0.03 * bass;
          t.decay = 0.91;
          return t;
        },
        comp:
          PAL_GLSL +
          "shader_body {\n" +
          "vec3 c = texture2D(sampler_main, uv).rgb;\n" +
          "vec2 d = uv - 0.5;\n" +
          "d.x *= resolution.x / resolution.y;\n" +
          "float r = length(d);\n" +
          "float ang = atan(d.y, d.x);\n" +
          "float lum = dot(c, vec3(0.33));\n" +
          // WMP chemicalnova is a full-spectrum psychedelic burst — hue sweeps by angle+radius.
          "vec3 tint = pal(ang/6.2832 + r*0.6 - time*0.12);\n" +
          "ret = tint * lum * 1.9;\n" +
          "ret += vec3(1.0) * exp(-r*r*22.0) * (0.3 + 1.2*bass);\n" +
          "}\n"
      }
    );
    preset.waves[0] = circleWave("q1", "q2");
    preset.waves[0].baseVals.r = 1.0;
    preset.waves[0].baseVals.g = 1.0;
    preset.waves[0].baseVals.b = 1.0;
    preset.waves[0].baseVals.a = 1.0;
    preset.waves[0].baseVals.smoothing = 0.03;
    preset.waves[0].point_eqs = function (a) {
      var ang = a.sample * 6.2832;
      var rad = (a.q5 || 0.07) + (a.q6 || 0.3) * a.value1;
      a.x = 0.5 + rad * Math.cos(ang);
      a.y = 0.5 + rad * Math.sin(ang);
      return a;
    };
    return preset;
  })();

  // ── Battery lotus ───────────────────────────────────────────────────────────
  // A lotus flower: two concentric layered real-audio petal rings (abs(sin(ang*N))
  // petal modulation) opening; serene pink/white petals with a golden center.
  P["Battery lotus"] = (function () {
    var preset = build(
      { wave_a: 0, decay: 0.95, gammaadj: 1.9, zoom: 1.0, warp: 0.02, darken_center: 0, wrap: 0 },
      {
        frame: function (t) {
          var bass = t.bass_att || t.bass || 1;
          var mid = t.mid || 1;
          t.q1 = 0.5; t.q2 = 0.5;
          t.q5 = 0.10 + 0.05 * bass;
          t.q6 = 0.20 + 0.05 * mid;
          t.q7 = 0.04 + 0.05 * bass;
          t.decay = 0.95;
          return t;
        },
        comp:
          "shader_body {\n" +
          "vec3 c = texture2D(sampler_main, uv).rgb;\n" +
          "vec2 d = uv - 0.5;\n" +
          "d.x *= resolution.x / resolution.y;\n" +
          "float r = length(d);\n" +
          "float lum = dot(c, vec3(0.33));\n" +
          // WMP lotus holds magenta/purple petals with a warm golden center.
          "vec3 petal = vec3(0.80, 0.28, 0.95);\n" +
          "ret = mix(petal, vec3(1.0,0.85,1.0), 0.25) * lum * 1.7;\n" +
          "ret += vec3(1.0, 0.82, 0.4) * exp(-r*r*28.0) * (0.25 + 0.5*bass);\n" +
          "}\n"
      }
    );
    preset.waves[0] = circleWave("q1", "q2");
    preset.waves[0].baseVals.r = 0.85;
    preset.waves[0].baseVals.g = 0.35;
    preset.waves[0].baseVals.b = 1.0;
    preset.waves[0].baseVals.smoothing = 0.3;
    preset.waves[0].point_eqs = function (a) {
      var ang = a.sample * 6.2832;
      var petal = 0.55 + 0.45 * Math.abs(Math.sin(ang * 5.0));
      var rad = ((a.q5 || 0.10) + (a.q7 || 0.05) * a.value1) * petal;
      a.x = 0.5 + rad * Math.cos(ang);
      a.y = 0.5 + rad * Math.sin(ang);
      return a;
    };
    preset.waves[1] = circleWave("q1", "q2");
    preset.waves[1].baseVals.r = 0.95;
    preset.waves[1].baseVals.g = 0.55;
    preset.waves[1].baseVals.b = 1.0;
    preset.waves[1].baseVals.smoothing = 0.3;
    preset.waves[1].point_eqs = function (a) {
      var ang = a.sample * 6.2832 + 0.4;
      var petal = 0.6 + 0.4 * Math.abs(Math.sin(ang * 8.0));
      var rad = ((a.q6 || 0.20) + (a.q7 || 0.05) * a.value1) * petal;
      a.x = 0.5 + rad * Math.cos(ang);
      a.y = 0.5 + rad * Math.sin(ang);
      return a;
    };
    return preset;
  })();

  // ── Battery green is not your enemy ─────────────────────────────────────────
  // Lush, friendly green: a calming organic fbm field, fixed green hue, gentle
  // drift, with a real-audio ring rippling smoothly through it.
  P["Battery green is not your enemy"] = (function () {
    var preset = build(
      { wave_a: 0, decay: 0.95, gammaadj: 1.9, zoom: 1.005, warp: 0.06, rot: 0.005, darken_center: 0, wrap: 1 },
      {
        frame: function (t) {
          var bass = t.bass_att || t.bass || 1;
          t.q1 = 0.5 + 0.05 * Math.cos(t.time * 0.4);
          t.q2 = 0.5 + 0.05 * Math.sin(t.time * 0.35);
          t.q5 = 0.16 + 0.06 * bass;
          t.warp = 0.05 + 0.03 * Math.sin(t.time * 0.2);
          t.decay = 0.95;
          return t;
        },
        comp:
          NOISE_GLSL +
          "shader_body {\n" +
          "vec3 c = texture2D(sampler_main, uv).rgb;\n" +
          "vec2 d = uv - 0.5;\n" +
          "d.x *= resolution.x / resolution.y;\n" +
          "float r = length(d);\n" +
          "float lum = dot(c, vec3(0.33));\n" +
          "float n = fbm(uv*3.0 + time*0.08);\n" +
          "vec3 green = vec3(0.18, 0.85, 0.35);\n" +
          "vec3 leaf = vec3(0.35, 1.0, 0.45);\n" +
          "ret = mix(green, leaf, n) * lum * 1.6;\n" +
          "ret += green * (0.03 + 0.05*n) * (0.5 + 0.5*sin(time*0.15));\n" +
          "ret += leaf * exp(-r*r*7.0) * 0.04*mid;\n" +
          "}\n"
      }
    );
    preset.waves[0] = circleWave("q1", "q2");
    preset.waves[0].baseVals.r = 0.4;
    preset.waves[0].baseVals.g = 1.0;
    preset.waves[0].baseVals.b = 0.5;
    preset.waves[0].baseVals.a = 0.9;
    preset.waves[0].baseVals.smoothing = 0.5;
    return preset;
  })();

  // ── Battery sleepyspray ─────────────────────────────────────────────────────
  // A gentle drifting spray of soft particles floating upward, dreamy and calm;
  // soft cyan/lavender; slow upward feedback drift, a soft real-audio ring.
  P["Battery sleepyspray"] = (function () {
    var preset = build(
      {
        wave_a: 0, decay: 0.95, gammaadj: 1.9, zoom: 1.0, warp: 0.05,
        rot: 0, dy: -0.012, cx: 0.5, cy: 0.5, darken_center: 1, wrap: 0,
        wave_smoothing: 0.6, additivewave: 1
      },
      {
        frame: function (t) {
          var b = t.bass_att || 1, tr = t.treb || 1;
          t.q1 = 0.5;
          t.q2 = 0.5;
          t.q5 = 0.10 + 0.07 * b;
          t.zoom = 1.006 + 0.004 * b;
          t.dy = -0.010 - 0.006 * tr;
          t.warp = 0.05;
          t.decay = 0.95;
          return t;
        },
        comp:
          "shader_body {\n" +
          "vec3 c = texture2D(sampler_main, uv).rgb;\n" +
          "float lum = dot(c, vec3(0.33));\n" +
          "vec3 cyan = vec3(0.45,0.85,1.0);\n" +
          "vec3 lav  = vec3(0.70,0.62,1.0);\n" +
          "float h = 0.5 + 0.5*sin(time*0.12);\n" +
          "vec3 tint = mix(cyan, lav, h);\n" +
          "ret = tint * lum * 1.25;\n" +
          "vec2 d = uv - 0.5; d.x *= resolution.x/resolution.y;\n" +
          "ret += tint * exp(-dot(d,d)*6.0) * (0.06 + 0.18*bass);\n" +
          "}\n"
      }
    );
    preset.waves[0] = circleWave("q1", "q2");
    preset.waves[0].baseVals.r = 0.55;
    preset.waves[0].baseVals.g = 0.85;
    preset.waves[0].baseVals.b = 1.0;
    preset.waves[0].baseVals.a = 0.7;
    preset.waves[0].baseVals.smoothing = 0.5;
    return preset;
  })();

  // ── Battery smoke or water? ─────────────────────────────────────────────────
  // Ambiguous smoky/watery fluid: turbulent fbm warp billowing; blue-grey/teal;
  // a real-audio ring stirs the fluid. Long decay for smoke trails.
  P["Battery smoke or water?"] = (function () {
    var preset = build(
      {
        wave_a: 0, decay: 0.965, gammaadj: 2.0, zoom: 1.0, warp: 0.18,
        rot: 0.01, cx: 0.5, cy: 0.5, darken_center: 0, wrap: 1,
        wave_smoothing: 0.7, additivewave: 1
      },
      {
        frame: function (t) {
          var b = t.bass_att || 1, m = t.mid || 1;
          t.q1 = 0.5;
          t.q2 = 0.5;
          t.q5 = 0.12 + 0.06 * b;
          t.warp = 0.16 + 0.10 * m;
          t.rot = 0.008 + 0.012 * b;
          t.decay = 0.965;
          return t;
        },
        warp:
          NOISE_GLSL +
          "shader_body {\n" +
          "vec2 w = uv;\n" +
          "float n = fbm(w*4.0 + vec2(time*0.08, -time*0.05));\n" +
          "float n2 = fbm(w*7.0 - vec2(time*0.04));\n" +
          "vec2 flow = vec2(n - 0.5, n2 - 0.5) * (0.020 + 0.020*bass);\n" +
          "ret = texture2D(sampler_main, w + flow).rgb;\n" +
          "ret -= 0.003;\n" +
          "}\n",
        comp:
          "shader_body {\n" +
          "vec3 c = texture2D(sampler_main, uv).rgb;\n" +
          "float lum = dot(c, vec3(0.33));\n" +
          // WMP smoke-or-water? is essentially greyscale (white/grey smoke, faint cool tint).
          "vec3 grey = vec3(0.66, 0.70, 0.74);\n" +
          "ret = grey * (0.45 + 1.2*lum);\n" +
          "vec2 d = uv - 0.5; d.x *= resolution.x/resolution.y;\n" +
          "ret += grey * exp(-dot(d,d)*5.0) * (0.05 + 0.18*bass);\n" +
          "}\n"
      }
    );
    preset.waves[0] = circleWave("q1", "q2");
    preset.waves[0].baseVals.r = 0.45;
    preset.waves[0].baseVals.g = 0.72;
    preset.waves[0].baseVals.b = 0.78;
    preset.waves[0].baseVals.a = 0.7;
    preset.waves[0].baseVals.smoothing = 0.4;   // keep the stirring waveform legible
    return preset;
  })();

  // ── Battery spider's last moment ────────────────────────────────────────────
  // A spider web: 3 real-audio radial spokes (6 spans) + 1 real-audio concentric
  // thread ring; thin pale-silver lines on near-black, faintly trembling. Eerie.
  P["Battery spider's last moment"] = (function () {
    var preset = build(
      {
        wave_a: 0, decay: 0.88, gammaadj: 2.1, zoom: 1.0, warp: 0.0,
        rot: 0, cx: 0.5, cy: 0.5, darken_center: 1, wrap: 0,
        additivewave: 1
      },
      {
        frame: function (t) {
          var b = t.bass_att || 1, tr = t.treb_att || 1;
          t.q1 = t.time * 0.05 + 0.01 * Math.sin(t.time * 7.0) * tr;
          t.q2 = 0.5;
          t.q3 = 0.5;
          t.q5 = 0.10 + 0.04 * b;
          t.decay = 0.88;
          return t;
        },
        comp:
          "shader_body {\n" +
          "vec3 c = texture2D(sampler_main, uv).rgb;\n" +
          "ret = c * vec3(0.45,1.0,0.55);\n" +    // WMP spider web threads glow green
          "float bg = 0.015;\n" +
          "ret += vec3(bg*0.4, bg*1.2, bg*0.5);\n" +
          "}\n"
      }
    );
    var offs = [0.0, 1.047, 2.094];
    for (var i = 0; i < offs.length; i++) {
      preset.waves[i] = spokeLine(0, 0.55, 0.04, 0.55, 1.0, 0.6);
      (function (off, idx) {
        preset.waves[idx].point_eqs = function (a) {
          var th = (a.q1 || 0) + off;
          var s = a.sample * 2.0 - 1.0;
          var ct = Math.cos(th), st = Math.sin(th);
          a.x = 0.5 + s * 0.55 * ct - a.value1 * 0.04 * st;
          a.y = 0.5 + s * 0.55 * st + a.value1 * 0.04 * ct;
          return a;
        };
      })(offs[i], i);
    }
    preset.waves[3] = circleWave("q2", "q3");
    preset.waves[3].baseVals.r = 0.5;
    preset.waves[3].baseVals.g = 1.0;
    preset.waves[3].baseVals.b = 0.55;
    preset.waves[3].baseVals.a = 0.6;
    preset.waves[3].baseVals.smoothing = 0.3;
    return preset;
  })();

  // ── Battery the world ───────────────────────────────────────────────────────
  // A rotating globe: a sphere shaded in comp (blue oceans, hints of green) with a
  // real-audio equator ring; rotation via a scrolling longitude pattern. Deep blue.
  P["Battery the world"] = (function () {
    var preset = build(
      {
        wave_a: 0, decay: 0.90, gammaadj: 2.0, zoom: 1.0, warp: 0.0,
        rot: 0, cx: 0.5, cy: 0.5, darken_center: 0, wrap: 0,
        additivewave: 1
      },
      {
        frame: function (t) {
          var b = t.bass_att || 1;
          t.q1 = 0.5;
          t.q2 = 0.5;
          t.q5 = 0.30 + 0.03 * b;
          t.decay = 0.90;
          return t;
        },
        comp:
          NOISE_GLSL +
          "shader_body {\n" +
          "vec3 fb = texture2D(sampler_main, uv).rgb;\n" +
          "vec2 d = uv - 0.5; d.x *= resolution.x/resolution.y;\n" +
          "float r = length(d);\n" +
          "float R = 0.32;\n" +
          "float sphere = smoothstep(R, R-0.02, r);\n" +
          "float z = sqrt(max(R*R - dot(d,d), 0.0)) / R;\n" +
          "float lon = atan(d.x, z) * 1.4 + time*0.25;\n" +
          "float lat = d.y / R;\n" +
          "float land = fbm(vec2(lon*1.2, lat*2.0));\n" +
          "vec3 ocean = vec3(0.06,0.22,0.55);\n" +
          "vec3 deep  = vec3(0.02,0.10,0.35);\n" +
          "vec3 grn   = vec3(0.12,0.45,0.22);\n" +
          "vec3 surf = mix(mix(deep, ocean, smoothstep(0.0,0.6,land)), grn, smoothstep(0.62,0.72,land));\n" +
          "float shade = 0.45 + 0.55*z;\n" +
          "vec3 globe = surf * shade * sphere;\n" +
          "globe += vec3(0.5,0.7,1.0) * pow(z, 4.0) * 0.15 * sphere;\n" +
          "ret = globe + fb * (0.30 + sphere*0.20);\n" +
          "}\n"
      }
    );
    preset.waves[0] = circleWave("q1", "q2");
    preset.waves[0].baseVals.r = 0.55;
    preset.waves[0].baseVals.g = 0.80;
    preset.waves[0].baseVals.b = 1.0;
    preset.waves[0].baseVals.a = 0.7;
    preset.waves[0].baseVals.smoothing = 0.4;
    return preset;
  })();

  // ── Battery back to the groove ──────────────────────────────────────────────
  // Retro oscilloscope groove: a real-audio horizontal scope line (waveLine, q1=0)
  // on a scrolling grid with slow hue drift and scanlines. Funky and rhythmic.
  P["Battery back to the groove"] = (function () {
    var preset = build(
      {
        wave_a: 0, decay: 0.93, gammaadj: 2.0, zoom: 1.0, warp: 0.0,
        rot: 0, cx: 0.5, cy: 0.5, darken_center: 0, wrap: 0,
        additivewave: 1
      },
      {
        frame: function (t) {
          t.q1 = 0;
          t.q2 = 0.5;
          t.q3 = 0.5;
          t.q8 = (t.time * 0.05) % 1;
          t.decay = 0.93;
          return t;
        },
        comp:
          "shader_body {\n" +
          "vec3 fb = texture2D(sampler_main, uv).rgb;\n" +
          "vec2 w = uv;\n" +
          "vec2 g = abs(fract(vec2(w.x*16.0, w.y*12.0 + time*0.15)) - 0.5);\n" +
          "float grid = smoothstep(0.46, 0.5, max(g.x, g.y));\n" +
          "vec3 gridcol = vec3(0.10,0.30,0.18) * grid * (0.5 + 0.5*bass);\n" +
          // WMP back-to-the-groove cycles teal <-> yellow-green over its span.
          "vec3 hue = mix(vec3(0.15,0.85,0.70), vec3(0.70,0.95,0.20), 0.5+0.5*sin(time*0.07));\n" +
          "ret = fb * hue * 1.5 + gridcol;\n" +
          "float scan = 0.92 + 0.08*sin(w.y*resolution.y*0.6);\n" +
          "ret *= scan;\n" +
          "}\n"
      }
    );
    preset.waves[0] = waveLine();
    preset.waves[0].baseVals.a = 0.9;
    preset.waves[0].baseVals.smoothing = 0.02;
    return preset;
  })();

  window.WMP_PRESETS = P;
})();
