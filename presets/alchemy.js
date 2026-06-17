/* Alchemy family presets (28) for the WMP visualizer.
 * Plain <script> loaded AFTER presets/kit.js; registers into window.WMP_PRESETS.
 * Uses the shared kit globals (build, circleWave, ALC_PAL, alc* factories, ...).
 */
(function () {
  "use strict";
  var P = (window.WMP_PRESETS = window.WMP_PRESETS || {});


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
    var SCENE_N = 10;        // number of distinct scenes in the cycle
    var SCENE_D = 8.0;       // seconds per scene
    var SCENE_FADE = 2.0;    // crossfade window (last seconds of each scene)

    // Per-scene config — one entry per scene in the catalog (docs/alchemy-reference.md).
    // shape (central motif): 0 rose · 1 none(orbs/bg-led) · 2 spiral · 3 urchin ·
    //   4 lissajous · 5 star-web · 6 spiderweb · 7 crescent · 8 central waveform bolt.
    // cx/cy = central-motif center (off-center on some); orb = circle visibility;
    // rot = rotation speed. The BACKGROUND look + camera + kaleidoscope + darkness
    // for each scene index are hard-coded in the shaders (alScene/kalFor/gzFor/
    // darkFor/camZoom/camRot) — keep all of them indexed 0..9 in sync with this.
    var SCENES = [
      { shape: 3, cx: 0.50, cy: 0.50, orb: 0.15, rot: 0.25 },  // 0 dandelion / urchin burst
      { shape: 1, cx: 0.50, cy: 0.50, orb: 1.00, rot: 0.10 },  // 1 HERO: two orbs + waveform + bloom
      { shape: 2, cx: 0.50, cy: 0.50, orb: 0.15, rot: 0.45 },  // 2 perspective-tunnel spiral starburst
      { shape: 1, cx: 0.50, cy: 0.50, orb: 0.10, rot: 0.10 },  // 3 kaleidoscope lens-bands (bg-led)
      { shape: 8, cx: 0.50, cy: 0.50, orb: 0.10, rot: 0.10 },  // 4 hexagon mesh + central bolt
      { shape: 8, cx: 0.50, cy: 0.50, orb: 0.10, rot: 0.15 },  // 5 smoke plumes + central bolt
      { shape: 1, cx: 0.40, cy: 0.45, orb: 0.70, rot: 0.10 },  // 6 diagonal comet streaks
      { shape: 6, cx: 0.50, cy: 0.50, orb: 0.15, rot: 0.40 },  // 7 rainbow spiderweb
      { shape: 0, cx: 0.50, cy: 0.55, orb: 0.15, rot: 0.30 },  // 8 vertical-comb wallpaper + rosette
      { shape: 7, cx: 0.45, cy: 0.55, orb: 0.30, rot: 0.50 }   // 9 crescent swirl
    ];

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
      var r = 0.5 + 0.5 * Math.cos(6.2832 * h);
      var g = 0.5 + 0.5 * Math.cos(6.2832 * (h + 0.33));
      var b = 0.5 + 0.5 * Math.cos(6.2832 * (h + 0.67));
      var l = (r + g + b) / 3, s = 0.85;                      // keep saturation (grey/washed-out otherwise);
      return [(r * s + l * (1 - s)) * 0.95, (g * s + l * (1 - s)) * 0.95, (b * s + l * (1 - s)) * 0.95];  // the tonemap tames white
    }

    var preset = build(
      {
        // Moderate decay: the roaming orbs leave coil/bead recede trails without
        // the additive build-up blowing the frame to white. The colorful
        // background is drawn procedurally in comp (NOT fed back), so only the
        // additive orbs/line/spokes accumulate here.
        wave_a: 0, decay: 0.91, gammaadj: 1.3, zoom: 1.0, rot: 0.0,
        warp: 0.0, wrap: 0, darken_center: 0.10, echo_alpha: 0
      },
      {
        frame: function (t) {
          var bass = t.bass_att || t.bass || 1;
          var treb = t.treb_att || t.treb || 1;

          // State machine: current scene + smooth crossfade weight to the next.
          var ph = t.time / SCENE_D;
          var cur = Math.floor(ph) % SCENE_N;
          var fr = ph - Math.floor(ph);              // 0..1 within the scene
          var fadeFrac = SCENE_FADE / SCENE_D;
          var f = (fr - (1 - fadeFrac)) / fadeFrac;  // ramps 0..1 over the fade window
          f = f < 0 ? 0 : (f > 1 ? 1 : f);
          f = f * f * (3 - 2 * f);                   // smoothstep
          var next = (cur + 1) % SCENE_N;
          var sc = SCENES[cur], sn = SCENES[next];

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

          // Orbs (circles) show per the scene config — mainly the orbs+lightning
          // scene, faint elsewhere so circles don't dominate.
          var orbAmt = sc.orb * (1 - f) + sn.orb * f;
          t.q20 = orbAmt * (0.5 + 0.5 * comeGo(Math.sin(tm * 0.35)));        // orb A
          t.q21 = orbAmt * (0.5 + 0.5 * comeGo(Math.sin(tm * 0.31 + 2.2)));  // orb B
          t.q22 = orbAmt * (0.6 + 0.4 * comeGo(Math.sin(tm * 0.27 + 1.5)));  // thread
          t.q23 = ((tm * 0.05) + 0.16 * cur) % 1;           // hue drift + per-scene hue offset

          // Central motif: center lerps cur->next; rotation speed lerps; shape is
          // cur's motif id. A visibility window dips the alpha near scene edges so
          // the shape can swap during the crossfade without a hard pop.
          t.q26 = sc.cx * (1 - f) + sn.cx * f;              // central center x
          t.q27 = sc.cy * (1 - f) + sn.cy * f;              // central center y
          t.q28 = sc.shape;                                 // central motif id (0..5)
          t.q25 = tm * (sc.rot * (1 - f) + sn.rot * f);     // rotation
          var edge = 0.14;
          var vis = Math.min(fr / edge, (1 - fr) / edge);
          vis = vis < 0 ? 0 : (vis > 1 ? 1 : vis);
          vis = vis * vis * (3 - 2 * vis);                  // fade in after scene start, out before end
          t.q24 = vis * (0.6 + 0.4 * comeGo(Math.sin(tm * 0.24 + 0.7)));  // central presence

          t.q17 = bass;
          t.q18 = tm;
          t.q29 = (bass + (t.mid || 1) + treb) / 3;          // overall loudness (RMS-ish) -> geometry brightness
          t.decay = 0.91;
          return t;
        },
        // Background: four SOFT, MUTED PASTEL washes (no hard grids/fans — those
        // read as neon webs; in the real preset ALL the structure is the central
        // urchin + orbs). Each scene is a gentle 2-tone gradient + a faint soft
        // center warmth; they crossfade on the scene clock.
        comp:
          NOISE_GLSL +
          // Soft MULTI-COLOR bleed: 3 muted tones blended by low-freq fbm + a
          // gentle vertical gradient, slowly drifting — the original's background
          // has several colors bleeding together (not a flat 2-tone wash). This is
          // color blending, NOT the sharp contour "blobs" from before.
          "vec3 bleed(vec3 a, vec3 b, vec3 cc, vec2 d, float gy, float t){\n" +
          "  float n1 = fbm(d*1.3 + vec2(t*0.05, -t*0.04));\n" +
          "  float n2 = fbm(d*0.9 + vec2(-t*0.03, t*0.05) + 7.0);\n" +
          "  vec3 c = mix(a, b, clamp(gy*0.6 + 0.7*(n1-0.5) + 0.5, 0.0, 1.0));\n" +
          "  c = mix(c, cc, smoothstep(0.30, 0.80, n2));\n" +
          "  return c;\n" +
          "}\n" +
          // Structured per-scene BACKGROUND looks (catalog in docs/alchemy-reference.md).
          "vec3 bgLens(vec2 d,float t){ vec2 q=abs(fract(vec2(d.x*3.0, d.y*4.0+sin(d.x*6.0+t)*0.2))-0.5); float eye=smoothstep(0.5,0.2,q.y)*smoothstep(0.5,0.34,q.x); vec3 c=mix(vec3(0.04,0.16,0.14), vec3(0.10,0.42,0.20), eye); c+=vec3(0.5,0.12,0.10)*smoothstep(0.14,0.0,q.y)*0.7; return c; }\n" +  // 3 kaleidoscope lens-bands / eye-lattice
          "vec3 bgHex(vec2 d,float t){ vec2 p=d*6.0; float l1=abs(fract(p.x)-0.5), l2=abs(fract(p.x*0.5+p.y*0.866)-0.5), l3=abs(fract(p.x*0.5-p.y*0.866)-0.5); float g=smoothstep(0.06,0.0,min(min(l1,l2),l3)); return vec3(0.05,0.09,0.15) + vec3(0.25,0.5,0.4)*g*0.5; }\n" +  // 4 hexagon wireframe mesh (steel-blue)
          "vec3 bgSmoke(vec2 d,float t){ vec2 w=d*2.0 + vec2(fbm(d*1.5+t*0.1), fbm(d*1.5-t*0.1)); float n=fbm(w*2.0); vec3 cyc=mix(vec3(0.45,0.10,0.42), vec3(0.10,0.42,0.20), 0.5+0.5*sin(t*0.05)); return cyc*(0.25+0.7*n); }\n" +  // 5 smoke/lava plumes (magenta<->green)
          "vec3 bgComb(vec2 d,float t){ float s=smoothstep(0.46,0.5, abs(fract(d.x*14.0)-0.5)); return mix(vec3(0.05,0.13,0.06), vec3(0.16,0.30,0.12), s); }\n" +  // 8 vertical-comb wallpaper (olive)
          "vec3 bgTunnel(vec2 d,float r,float ang,float t){ float rays=smoothstep(0.5,0.0, abs(fract(ang*8.0/3.14159+0.5)-0.5)); vec3 cyc=mix(vec3(0.10,0.5,0.25), vec3(0.45,0.10,0.40), 0.5+0.5*sin(t*0.05)); return vec3(0.03,0.07,0.05) + cyc*rays*smoothstep(1.7,0.1,r); }\n" +  // 2 perspective-tunnel rays
          "vec3 bgStrata(vec2 d,float gy,float t){ float band=0.5+0.5*sin(gy*16.0 + sin(t*0.3)); vec3 cool=mix(vec3(0.10,0.30,0.34), vec3(0.42,0.12,0.36), 0.5+0.5*sin(t*0.05)); vec3 c=cool*(0.5+0.4*band); c+=vec3(0.5,0.34,0.10)*exp(-dot(d,d)*6.0); return c; }\n" +  // 9 landscape strata + amber clump
          "vec3 alScene(float id, vec2 d, float r, float ang, float gy, float t){\n" +
          "  if(id<0.5) return bleed(vec3(0.10,0.26,0.16), vec3(0.06,0.18,0.12), vec3(0.16,0.10,0.24), d, gy, t);\n" +  // 0 dandelion: dark green field
          "  if(id<1.5) return bleed(vec3(0.04,0.05,0.13), vec3(0.07,0.04,0.11), vec3(0.12,0.06,0.16), d, gy, t);\n" +  // 1 hero: dark navy free-space
          "  if(id<2.5) return bgTunnel(d, r, ang, t);\n" +
          "  if(id<3.5) return bgLens(d, t);\n" +
          "  if(id<4.5) return bgHex(d, t);\n" +
          "  if(id<5.5) return bgSmoke(d, t);\n" +
          "  if(id<6.5) return bleed(vec3(0.20,0.05,0.06), vec3(0.13,0.04,0.08), vec3(0.10,0.05,0.15), d, gy, t);\n" +  // 6 comet: dark maroon
          "  if(id<7.5) return vec3(0.02,0.02,0.045);\n" +     // 7 spiderweb: near-black
          "  if(id<8.5) return bgComb(d, t);\n" +
          "  return bgStrata(d, gy, t);\n" +                    // 9 strata
          "}\n" +
          "float kalFor(float id){ if(id<0.5) return 0.1; if(id<1.5) return 0.0; if(id<2.5) return 0.0; if(id<3.5) return 0.6; if(id<4.5) return 0.3; if(id<5.5) return 0.0; if(id<6.5) return 0.0; if(id<7.5) return 0.3; if(id<8.5) return 0.2; return 0.0; }\n" +  // per-scene kaleidoscope (mirror)
          "float gzFor(float id){ if(id<0.5) return 1.4; if(id<1.5) return 1.2; if(id<2.5) return 1.7; if(id<3.5) return 1.3; if(id<4.5) return 1.2; if(id<5.5) return 1.4; if(id<6.5) return 1.3; if(id<7.5) return 1.5; if(id<8.5) return 1.3; return 1.4; }\n" +  // per-scene geometry zoom (viewport)
          "float darkFor(float id){ if(id<0.5) return 0.5; if(id<1.5) return 0.35; if(id<2.5) return 0.6; if(id<3.5) return 0.95; if(id<4.5) return 0.85; if(id<5.5) return 0.7; if(id<6.5) return 0.5; if(id<7.5) return 0.4; if(id<8.5) return 0.85; return 0.7; }\n" +  // per-scene bg darkness (neon-on-black vs pastel)
          "shader_body {\n" +
          "  vec2 d = uv - 0.5;\n" +
          "  d.x *= resolution.x / resolution.y;\n" +
          "  float r = length(d) * 2.0;\n" +
          "  float pang = atan(d.y, d.x);\n" +   // NOT 'ang'/'rad' — Butterchurn predeclares those
          "  float gy = uv.y;\n" +
          "  float D = 8.0;\n" +                           // == SCENE_D
          "  float ph = time / D;\n" +
          "  float cur = mod(floor(ph), 10.0);\n" +        // == SCENE_N
          "  float nxt = mod(cur + 1.0, 10.0);\n" +
          "  float fr = fract(ph);\n" +
          "  float fade = 2.0 / D;\n" +                    // == SCENE_FADE / SCENE_D
          "  float f = clamp((fr - (1.0 - fade)) / fade, 0.0, 1.0); f = f*f*(3.0-2.0*f);\n" +
          "  vec3 col = mix(alScene(cur, d, r, pang, gy, time), alScene(nxt, d, r, pang, gy, time), f);\n" +
          "  col *= (0.95 + 0.12*bass);\n" +
          "  col *= mix(darkFor(cur), darkFor(nxt), f);\n" +            // neon scenes -> near-black bg, pastel stay light
          "  float km = 0.18 + mix(kalFor(cur), kalFor(nxt), f);\n" +
          "  float Z = mix(gzFor(cur), gzFor(nxt), f);\n" +
          "  vec2 zuv = (uv - 0.5) / Z + 0.5;\n" +
          "  float o = 2.5 / resolution.y;\n" +                         // dilation radius -> THICK lines
          "  vec3 fb = texture2D(sampler_main, zuv).rgb;\n" +
          "  fb = max(fb, texture2D(sampler_main, zuv + vec2(o,0.0)).rgb);\n" +
          "  fb = max(fb, texture2D(sampler_main, zuv - vec2(o,0.0)).rgb);\n" +
          "  fb = max(fb, texture2D(sampler_main, zuv + vec2(0.0,o)).rgb);\n" +
          "  fb = max(fb, texture2D(sampler_main, zuv - vec2(0.0,o)).rgb);\n" +
          "  fb += texture2D(sampler_main, vec2(1.0-zuv.x, zuv.y)).rgb * km;\n" +   // mirror fill (kaleidoscope)
          "  fb += texture2D(sampler_main, vec2(zuv.x, 1.0-zuv.y)).rgb * km;\n" +
          "  vec3 glow = texture2D(sampler_blur1, zuv).rgb + texture2D(sampler_blur2, zuv).rgb;\n" +
          "  vec3 outc = col + fb*0.55 + glow*0.45;\n" +
          "  float hw = (abs(cur-1.0)<0.5 ? (1.0-f) : 0.0) + (abs(nxt-1.0)<0.5 ? f : 0.0);\n" +  // HERO central bloom
          "  outc += vec3(1.0,0.82,0.55) * exp(-r*r*7.0) * (0.12 + 0.6*bass) * hw;\n" +
          "  ret = outc / (outc + vec3(0.9));\n" +                      // Reinhard tone-map: keep color, no white-out
          "}\n",
        // Gentle outward drift + a slow swirl of the feedback (trail) buffer:
        // makes each roaming orb's stamped echoes streak/recede into the coil-and-
        // bead trails seen in the reference, without smearing them into mush.
        warp:
          // Per-scene CAMERA on the feedback (trail) buffer: tunnel push (zoom>1)
          // for the starburst/swirl scenes, flat for the hero/urchin, rotation for
          // the swirl scenes. Computed from the same scene clock as comp/frame.
          "float camZoom(float id){ if(id<0.5) return 1.0; if(id<1.5) return 1.0; if(id<2.5) return 1.018; if(id<3.5) return 1.0; if(id<4.5) return 1.0; if(id<5.5) return 1.008; if(id<6.5) return 1.002; if(id<7.5) return 1.008; if(id<8.5) return 1.004; return 1.012; }\n" +
          "float camRot(float id){ if(id<0.5) return 0.004; if(id<1.5) return 0.0; if(id<2.5) return 0.016; if(id<3.5) return 0.0; if(id<4.5) return 0.0; if(id<5.5) return 0.002; if(id<6.5) return 0.010; if(id<7.5) return 0.016; if(id<8.5) return 0.0; return 0.022; }\n" +
          "shader_body {\n" +
          "  float D = 8.0; float ph = time / D;\n" +
          "  float cur = mod(floor(ph), 10.0); float nxt = mod(cur + 1.0, 10.0);\n" +
          "  float fr = fract(ph); float fade = 2.0 / D;\n" +
          "  float f = clamp((fr - (1.0 - fade)) / fade, 0.0, 1.0); f = f*f*(3.0-2.0*f);\n" +
          "  float zm = mix(camZoom(cur), camZoom(nxt), f);\n" +   // per-scene tunnel zoom
          "  float a = mix(camRot(cur), camRot(nxt), f);\n" +      // per-scene swirl rotation
          "  vec2 d = uv - 0.5;\n" +
          "  float s = sin(a), c = cos(a);\n" +
          "  vec2 ruv = 0.5 + mat2(c, -s, s, c) * d * zm;\n" +
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
        a.a = env * (0.3 + 0.7 * (a.q29 || 1));                // brightness scales with overall volume (RMS)
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
      a.a = w * (0.3 + 0.7 * (a.q29 || 1));                    // brightness scales with overall volume (RMS)
      return a;
    });
    preset.waves[2].baseVals.smoothing = 0.0;                  // jagged, like a real oscilloscope

    // wave[3] — the central "flower urchin": each of the 512 waveform samples
    // shoots a filament outward by its amplitude → a thick spiky star of
    // filaments. Rotates (q25). Bright, complementary to the orbs/thread hue.
    preset.waves[3] = sceneWave(function (a) {
      var cx = a.q26 !== undefined ? a.q26 : 0.5;             // per-scene (possibly off-) center
      var cy = a.q27 !== undefined ? a.q27 : 0.5;
      var shape = a.q28 || 0;
      var rot = a.q25 || 0;
      var s = a.sample, v = a.value1, av = Math.abs(v), th = s * 6.2832;
      var alpha = (a.q24 || 0) * 0.8;
      // Per Gemini: the central "puffballs/rings" SCALE with BASS (kick flare,
      // shrink when quiet); the waveform amplitude adds the jagged detail.
      var bscale = 0.5 + 0.7 * (a.q17 || 1);
      if (shape < 0.5) {
        // 0 ROSE / spirograph: a k-petal curve (rotating; bass-scaled, audio-jagged)
        var rr = bscale * 0.34 * (0.6 + 0.4 * av) * Math.cos(4.0 * th + rot);
        a.x = cx + rr * Math.cos(th); a.y = cy + rr * Math.sin(th);
      } else if (shape < 1.5) {
        // 1 none (orbs + lightning scene): keep the central slot invisible
        a.x = cx; a.y = cy; alpha = 0.0;
      } else if (shape < 2.5) {
        // 2 SPIRAL S-arms rotating from center (decay leaves the trails)
        var ARMS = 3.0, seg = Math.floor(s * ARMS), u = s * ARMS - seg;
        var th2 = u * 2.5 * 6.2832 + seg * (6.2832 / ARMS) + rot;
        var rr2 = bscale * u * 0.40 + 0.04 * v;
        a.x = cx + rr2 * Math.cos(th2); a.y = cy + rr2 * Math.sin(th2);
        if (u < 0.02) alpha = 0.0;                            // hide the jump between arms
      } else if (shape < 3.5) {
        // 3 URCHIN: real-waveform radial filaments; bass flares the whole burst
        var rad = bscale * (0.08 + 0.26 * av), ang = th + rot;
        a.x = cx + rad * Math.cos(ang); a.y = cy + rad * Math.sin(ang);
      } else if (shape < 4.5) {
        // 4 LISSAJOUS figure (bass-scaled, audio-jittered)
        a.x = cx + bscale * (0.34 + 0.05 * v) * Math.sin(3.0 * th + rot);
        a.y = cy + bscale * (0.32 + 0.05 * v) * Math.sin(2.0 * th);
      } else if (shape < 5.5) {
        // 5 STAR-WEB: star polygon (non-integer angular step) + waveform radius
        var th5 = th * 2.5 + rot, rr5 = bscale * 0.32 * (0.7 + 0.3 * av);
        a.x = cx + rr5 * Math.cos(th5); a.y = cy + rr5 * Math.sin(th5);
      } else if (shape < 6.5) {
        // 6 SPIDERWEB: many fine radial spokes (dense), bass-flared, rotating
        var SPK = 24.0, sp = Math.floor(s * SPK), u6 = s * SPK - sp;
        var ang6 = sp * (6.2832 / SPK) + rot;
        var rr6 = bscale * (0.05 + u6 * 0.45) + 0.03 * v;
        a.x = cx + rr6 * Math.cos(ang6); a.y = cy + rr6 * Math.sin(ang6);
        if (u6 < 0.02) alpha = 0.0;                           // hide spoke-to-spoke jumps
      } else if (shape < 7.5) {
        // 7 CRESCENT: a single arc (half sweep); the feedback swirl smears it into
        // the comma/crescent seen in the original.
        var ca = s * 3.1416 + rot, rr7 = bscale * 0.34 + 0.04 * v;
        a.x = cx + rr7 * Math.cos(ca); a.y = cy + rr7 * Math.sin(ca);
      } else {
        // 8 BOLT: a central vertical waveform line (for the hex-mesh / smoke scenes)
        a.x = cx + (a.value1 * 0.16 + a.value2 * 0.05);
        a.y = 0.08 + s * 0.84;
      }
      var c = hueBright((a.q23 || 0) + 0.5);                  // complementary to orbs/thread
      a.r = c[0]; a.g = c[1]; a.b = c[2];
      a.a = alpha * (0.3 + 0.7 * (a.q29 || 1));               // brightness scales with overall volume (RMS)
      return a;
    });
    preset.waves[3].baseVals.smoothing = 0.0;
    return preset;
  })();


  // ── Alchemy v2: Random ───────────────────────────────────────────────────────
  // ONE-SHOT REBUILD (see docs/alchemy-v2/v2-fix-plan.md). V2 regressed vs V1 because it dropped
  // V1's ORCHESTRATION SPINE; this restores it while keeping the kit's motifs + V2's stochastic
  // (non-looping) selection, and folds in Gemini's "unify the layers / share global state" note.
  //   FIX 1 — ONE shared stochastic MACRO-LOOK clock crossfades background + camera + exposure
  //           TOGETHER (kills the hard-cut slideshow); random order keeps it non-looping.
  //   FIX 2 — STRUCTURED, frame-filling backgrounds (V1's proven tunnel/comb/strata/hex GLSL +
  //           kit fluid/marble/wash/moiré/solidsnap/bloom) so the frame is NEVER empty.
  //   FIX 3 — per-look EXPOSURE (q19) + Reinhard k=0.88 + stronger desaturation: no neon, no
  //           white blow-out (V1's dual palette — soft-but-coloured geometry over MUTED grounds).
  //   FIX 4 — the WMP signature: TWO ROAMING orbs (kit factories, cycled) spanning the frame,
  //           joined by a jagged REAL-WAVEFORM tether (alcTether value1, NOT rand) + beads, on often.
  //   FIX 5 — Gemini spatial coupling: all 4 waves share ONE gentle global rotation (q13) so the
  //           foreground moves WITH the camera (same pivot ⇒ orbs stay joined; bounded sway).
  // Rejected from Gemini (re-introduce known bugs): rand()-lightning (use live samples), global
  // constant forward-zoom (depth is per-look), high-saturation (Alchemy stays muted).
  // 4 waves: [0] central kit motif · [1] orb A · [2] orb B · [3] real-waveform tether + beads.
  P["Alchemy v2: Random"] = (function () {
    // ── COLOUR — stochastic palette, desaturated to dusty pastel (muted-Alchemy rule).
    var PALS = [ALC_PAL.twoTone, ALC_PAL.roseGreen, ALC_PAL.redCyan, ALC_PAL.spread, ALC_PAL.warm];
    var curPal = PALS[0];
    function desat(a, s) { var l = (a.r + a.g + a.b) / 3; a.r = a.r * s + l * (1 - s); a.g = a.g * s + l * (1 - s); a.b = a.b * s + l * (1 - s); }
    function pastel(a) { desat(a, 0.66); }                          // dusty but still COLOURFUL
    function palMotif(a, idx) { curPal(a, idx); pastel(a); }
    function palSpec(a, idx) {                                       // sample-keyed spectral (multi-colour) for spindle/rays
      var h = (a.q8 || 0) + a.sample * 0.7;
      a.r = 0.5 + 0.5 * Math.cos(6.2832 * h); a.g = 0.5 + 0.5 * Math.cos(6.2832 * (h + 0.33)); a.b = 0.5 + 0.5 * Math.cos(6.2832 * (h + 0.67));
      desat(a, 0.6);
    }
    function comeGo(s) { var x = (0.5 + 0.5 * s - 0.30) / 0.30; x = x < 0 ? 0 : (x > 1 ? 1 : x); return x * x * (3 - 2 * x); }

    // ── Gemini spatial coupling: rotate a wave point about centre by the shared global angle q13,
    // so the WHOLE foreground (motif + both orbs + tether) sways together with the camera. Same
    // pivot+angle for every wave ⇒ orbs stay joined to the tether. (Hoisted; called from below.)
    function fgRotate(a) {
      var ang = a.q13 || 0; if (!ang) return;
      var s = Math.sin(ang), c = Math.cos(ang), x = a.x - 0.5, y = a.y - 0.5;
      a.x = 0.5 + (c * x - s * y); a.y = 0.5 + (s * x + c * y);
    }

    // ── Generic stochastic discrete picker (random mode, beat-gated cut, hard-cap +5s).
    function makePicker(n, minS, maxS, fade) {
      var a = Math.floor(Math.random() * n), b = a, mix = 0, transing = false;
      var start = 0, roll = minS + Math.random() * (maxS - minS), tstart = 0, out = { a: a, b: a, mix: 0 };
      return function (time, dt, gate) {
        if (!transing) { var el = time - start; if (el >= roll && (gate === undefined || gate || el >= roll + 5)) { b = Math.floor(Math.random() * (n - 1)); if (b >= a) b++; tstart = time; transing = true; } }
        else { var fr = (time - tstart) / fade; mix = fr < 0 ? 0 : (fr > 1 ? 1 : fr); mix = mix * mix * (3 - 2 * mix); if (fr >= 1) { a = b; transing = false; mix = 0; start = time; roll = minS + Math.random() * (maxS - minS); } }
        out.a = a; out.b = b; out.mix = mix; return out;
      };
    }

    // ── CENTRAL MOTIF point-functions (kit factories; mandala packs all 12 into one wave).
    var fAnem = alcAnemone(26, palMotif).point_eqs;
    var fTriM = alcTriMandala(9, palMotif).point_eqs;
    var fNgon = alcNgonPacked(ALC_MANDALA_SPECS, 1.4).point_eqs;     // all 12 star-polygons in ONE wave
    var fSpin = alcSpindle(palSpec).point_eqs;
    var fBur  = alcRadialBurst({}).point_eqs;                        // built-in spectral (muted below)
    var fStar = alcTriangle(0, 0).point_eqs;
    var fDia  = alcDiagonalLine(0.3, 0.62, 0.06).point_eqs;
    var fHor  = bgWaveHorizon({ cy: 0.5, amp: 0.16, colorize: palMotif })[0].point_eqs;
    var fFea  = alcOrbFeathery(0.5, 0.5, palMotif).point_eqs;
    var fMesh = alcMeshRings(8, 0.0).point_eqs;
    function fRays(a) {                                              // packed asterisk of waveform rays (one wave)
      var N = 7, seg = Math.floor(a.sample * N), u = a.sample * N - seg, s = u * 2 - 1;
      var th = (seg / N) * 3.14159 + (a.q9 || 0), len = (a.q5 || 0.3), disp = (a.value1 || 0) * (a.q6 || 0.04);
      a.x = 0.5 + s * len * Math.cos(th) - disp * Math.sin(th);
      a.y = 0.5 + s * len * Math.sin(th) + disp * Math.cos(th);
      palSpec(a, 0); if (u < 0.02) a.a = 0; return a;
    }
    function fBur2(a) { fBur(a); desat(a, 0.5); return a; }          // tame the spectral burst (was the neon source)
    var MOTIF_N = 11;
    function centralDraw(a) {
      var m = a.q1 || 0;
      if (m < 0.5) fAnem(a); else if (m < 1.5) fTriM(a); else if (m < 2.5) fNgon(a);
      else if (m < 3.5) fSpin(a); else if (m < 4.5) fBur2(a); else if (m < 5.5) fRays(a);
      else if (m < 6.5) fStar(a); else if (m < 7.5) fDia(a); else if (m < 8.5) fHor(a);
      else if (m < 9.5) fFea(a); else fMesh(a);
      a.a = (a.a === undefined ? 0.85 : a.a) * (a.q15 || 0);         // motif visibility (+ dip-swap)
      fgRotate(a);
      return a;
    }
    function scaleFor(m) {
      if (m < 0.5) return 0.46; if (m < 1.5) return 0.42; if (m < 2.5) return 1.00; if (m < 3.5) return 0.40;
      if (m < 5.5) return 0.34; if (m < 8.5) return 0.36; if (m < 9.5) return 0.22; return 0.40;
    }

    // ── ORBS — SMALL clean rings that drift SLOWLY (no big smeared loops) and come & go · cycle
    // the kit's clean bullseye-ring factories (alcOrbTarget n=1/2/3) via q16. Real-waveform only.
    // alcOrbiterNode DROPPED: its bright white core blows out under the comp glow+dilation (same
    // reason the prior build dropped it). q7/q25 = radius.
    var orbA_fns = [
      alcOrbTarget("q21", "q22", 1, palMotif).point_eqs,
      alcOrbTarget("q21", "q22", 2, palMotif).point_eqs,
      alcOrbTarget("q21", "q22", 3, palMotif).point_eqs
    ];
    var orbB_fns = [
      alcOrbTarget("q23", "q24", 1, palMotif).point_eqs,
      alcOrbTarget("q23", "q24", 2, palMotif).point_eqs,
      alcOrbTarget("q23", "q24", 3, palMotif).point_eqs
    ];
    function orbDispatch(fns, vis, a) {
      var st = a.q16 || 0;
      (st < 0.9 ? fns[0] : st < 1.9 ? fns[1] : fns[2])(a);
      a.a = (a.a === undefined ? 0.9 : a.a) * vis;
      fgRotate(a);
      return a;
    }
    var fTether = alcTether("q21", "q22", "q23", "q24", "q26", palMotif).point_eqs;

    // ── MACRO-LOOK table — each look BUNDLES a background field + camera + exposure so ONE picker
    // crossfades them together. cam = [zoom, rot, twist, kaleido, drift]. Depth (zoom>1) is PER-LOOK
    // (NOT global forward-flight). Several engage kaleido; none static.
    var LOOKS = [
      { bg: 0,  cam: [0.998, 0.004, 0.18, 0.0, 0.004], dark: 1.00 },  // fluid · drift
      { bg: 4,  cam: [1.014, 0.002, 0.00, 0.0, 0.000], dark: 0.78 },  // tunnel · plunge
      { bg: 1,  cam: [0.995, 0.006, 0.22, 1.0, 0.000], dark: 0.92 },  // marble · kaleido
      { bg: 3,  cam: [0.998, 0.009, 0.00, 0.0, 0.009], dark: 1.00 },  // wash · float
      { bg: 9,  cam: [0.994, 0.005, 0.18, 0.7, 0.000], dark: 0.86 },  // hex · kaleido
      { bg: 5,  cam: [0.999, 0.003, 0.10, 0.0, 0.003], dark: 0.92 },  // comb · drift
      { bg: 0,  cam: [0.994, 0.006, 0.30, 0.2, 0.000], dark: 0.95 },  // fluid · gentle vortex (was moiré dot-grid — too digital)
      { bg: 8,  cam: [1.003, 0.004, 0.10, 0.0, 0.005], dark: 0.92 },  // strata · drift
      { bg: 10, cam: [1.010, 0.004, 0.00, 0.0, 0.000], dark: 0.74 },  // radial bloom · plunge
      { bg: 2,  cam: [0.998, 0.010, 0.00, 0.0, 0.008], dark: 1.00 },  // fluid-gold · roll
      { bg: 7,  cam: [0.999, 0.002, 0.00, 0.0, 0.002], dark: 1.00 }   // solidsnap · drift
    ];
    var LOOK_N = LOOKS.length;

    // ── Stochastic drivers — ONE shared macro clock (bg+cam+exposure) + independent slower
    // motif / orb-style / palette clocks (the non-looping "random" feel).
    var lastT = 0, huePhase = 0, spinAcc = 0, marchAcc = 0;
    var beat = alcBeatFlash({ rise: 1.25 });
    var lookPick = makePicker(LOOK_N, 9, 16, 4.0);                   // LONG fade ⇒ morph, not cut
    var motifPick = makePicker(MOTIF_N, 7, 13, 2.0);                 // faster ⇒ more motif variety on screen
    var orbStylePick = makePicker(3, 10, 20, 0.8);
    var palPick = makePicker(PALS.length, 16, 32, 4.0);

    var preset = build(
      { wave_a: 0, decay: 0.90, gammaadj: 1.4, zoom: 1.0, rot: 0.0, warp: 0.0, wrap: 0, darken_center: 0.0, echo_alpha: 0 },
      {
        frame: function (t) {
          var bass = t.bass_att || t.bass || 1, mid = t.mid_att || t.mid || 1, treb = t.treb_att || t.treb || 1;
          var tm = t.time, dt = Math.min(0.1, Math.max(0, tm - lastT)); lastT = tm;
          var energy = (bass + mid + treb) / 3, bFlash = beat(t.bass || 1, dt);

          // L1 COLOUR — slow energy-coupled hue drift + stochastic palette (long fade).
          huePhase = alcHueClock(huePhase, dt, Math.max(0, energy - 1), 0.010, 0.04);
          t.q8 = huePhase;
          curPal = PALS[palPick(tm, dt).a];

          // L2 MACRO-LOOK — one shared clock crossfades bg + camera + exposure together.
          var lk = lookPick(tm, dt, bFlash > 0.6);
          var A = LOOKS[lk.a], B = LOOKS[lk.b], k = lk.mix;
          t.q18 = A.bg; t.q20 = B.bg; t.q27 = k;
          t.q19 = A.dark + (B.dark - A.dark) * k;                    // per-look exposure (crossfaded)
          var zoom = A.cam[0] + (B.cam[0] - A.cam[0]) * k, rot = A.cam[1] + (B.cam[1] - A.cam[1]) * k;
          var twist = A.cam[2] + (B.cam[2] - A.cam[2]) * k, kal = A.cam[3] + (B.cam[3] - A.cam[3]) * k, drift = A.cam[4] + (B.cam[4] - A.cam[4]) * k;
          if (zoom > 1.0) zoom += 0.02 * Math.max(0, bass - 1); else zoom -= 0.006 * Math.max(0, bass - 1);
          rot *= (1 + 0.5 * Math.max(0, mid - 1));
          t.q28 = zoom; t.q29 = rot; t.q30 = twist; t.q31 = kal; t.q32 = drift;

          // L3 SPATIAL COUPLING — gentle bounded global foreground sway, shared by all waves.
          t.q13 = 0.16 * Math.sin(tm * 0.05) + 0.08 * Math.sin(tm * 0.13);

          // L4 CENTRAL MOTIF — kit factory, own slower cadence; visibility floor kept up so a
          // motif swap never empties the frame.
          var mo = motifPick(tm, dt, bFlash > 0.6);
          var mCur = mo.mix < 0.5 ? mo.a : mo.b;
          t.q1 = mCur;
          var dd = (mo.mix - 0.5) * 4.0;
          t.q15 = (0.65 + 0.35 * comeGo(Math.sin(tm * 0.20))) * (1 - 0.55 * Math.exp(-dd * dd));
          t.q2 = 0.5; t.q3 = 0.5;
          t.q6 = 0.02 + 0.06 * Math.min(treb, 1.5);
          spinAcc += dt * (0.30 + 0.6 * Math.max(0, mid - 1));
          t.q5 = scaleFor(mCur) * (0.85 + 0.25 * Math.max(0, bass - 1));
          t.q11 = Math.max(0, Math.min((energy - 0.6) / 0.9, 1));
          marchAcc += dt * 0.06;
          t.q14 = (mCur >= 9.5) ? marchAcc : 0;
          if (mCur >= 3.5 && mCur < 4.5) { t.q9 = 0.05 + 0.03 * bass; t.q10 = 0.08 + 0.22 * Math.max(0, mid - 1) + 0.12 * bFlash; }
          else if (mCur >= 6.5 && mCur < 7.5) { t.q9 = spinAcc; t.q10 = 1.0; }
          else { t.q9 = spinAcc; t.q10 = 0.4 * Math.max(0, bass - 1); }

          // L5 ORBS + TETHER — ROAM across the frame (wide sine paths) so the tether spans it;
          // both usually present ⇒ the WMP two-orbs+lightning signature fires often.
          t.q21 = 0.5 + 0.20 * Math.sin(tm * 0.13);
          t.q22 = 0.5 + 0.16 * Math.cos(tm * 0.11);
          t.q23 = 0.5 + 0.20 * Math.cos(tm * 0.10 + 1.4);
          t.q24 = 0.5 + 0.16 * Math.sin(tm * 0.12 + 2.1);
          t.q7 = 0.045 + 0.016 * Math.max(0, bass - 1) + 0.010 * bass; // small clean orb
          t.q25 = t.q7;
          t.q26 = 0.035 + 0.05 * treb;                              // tether jag amplitude (live waveform)
          t.q16 = orbStylePick(tm, dt).a;                           // which kit orb factory (random)
          t.q17 = comeGo(Math.sin(tm * 0.085));                     // orb A: fully comes & goes (0..1)
          t.q12 = comeGo(Math.sin(tm * 0.073 + 2.0));               // orb B: fully comes & goes
          var both = Math.min(t.q17, t.q12);
          t.q4 = Math.max(0, (both - 0.4) / 0.5);                   // tether when BOTH orbs present
          return t;
        },
        // CAMERA warp — gentle polar twist + kaleido FOLD (q31). No constant forward-flight.
        warp:
          "shader_body {\n" +
          "  vec2 c = uv - 0.5;\n" +
          "  float pr = length(c);\n" +
          "  float pa = atan(c.y, c.x);\n" +
          "  float seg = 6.2832 / 4.0;\n" +
          "  float fa = abs(pa - seg * floor(pa / seg + 0.5));\n" +
          "  float ua = mix(pa, fa, clamp(q31, 0.0, 1.0));\n" +
          "  vec2 fc = vec2(cos(ua), sin(ua)) * pr;\n" +
          "  float tw = q30 * (0.025 + 0.04 / (pr * 6.0 + 1.0));\n" +
          "  float ro = q29 + tw;\n" +
          "  float sn = sin(ro), cs = cos(ro);\n" +
          "  vec2 rc = mat2(cs, -sn, sn, cs) * fc * q28;\n" +
          "  vec2 sd = rc + 0.5 + vec2(q32 * sin(time * 0.23), q32 * cos(time * 0.19));\n" +
          "  ret = texture2D(sampler_main, sd).rgb;\n" +
          "  ret -= mix(0.016, 0.010, clamp(q30, 0.0, 1.0));\n" +
          "}\n",
        // BACKGROUND — STRUCTURED frame-filling fields (V1's proven tunnel/comb/strata/hex GLSL +
        // kit fluid/marble/wash/moiré/solidsnap/bloom), crossfaded by the macro clock (q18→q20 by
        // q27), hue-rotated by q8, exposed by per-look darkness q19. THICK lines (4-tap max
        // dilation) + kaleido mirror-fill (q31). Reinhard k=0.88 keeps it dusty (no white-out).
        comp:
          NOISE_GLSL + ALC_FLUID_GLSL + ALC_MARBLE_GLSL + ALC_WASH_GLSL + ALC_MOIRE_GLSL + ALC_SOLIDSNAP_GLSL + ALC_RADIALBLOOM_GLSL +
          "vec3 hueRot(vec3 col, float a){ vec3 k = vec3(0.57735); float ca = cos(a), sa = sin(a); return col*ca + cross(k,col)*sa + k*dot(k,col)*(1.0-ca); }\n" +
          // V1's PROVEN structured scene-identity backgrounds (they fill the frame):
          "vec3 bgTunnel(vec2 d,float pr,float pa,float t){ float rays=smoothstep(0.5,0.0, abs(fract(pa*8.0/3.14159+0.5)-0.5)); vec3 cyc=mix(vec3(0.10,0.5,0.25), vec3(0.45,0.10,0.40), 0.5+0.5*sin(t*0.05)); return vec3(0.03,0.07,0.05) + cyc*rays*smoothstep(1.7,0.1,pr); }\n" +
          "vec3 bgComb(vec2 d,float t){ float s=smoothstep(0.36,0.5, abs(fract(d.x*9.0)-0.5)); return mix(vec3(0.07,0.10,0.08), vec3(0.11,0.16,0.10), s); }\n" +  // SOFT dusty vertical wallpaper (was harsh bright lines)
          "vec3 bgStrata(vec2 d,float gy,float t){ float band=0.5+0.5*sin(gy*16.0 + sin(t*0.3)); vec3 cool=mix(vec3(0.10,0.30,0.34), vec3(0.42,0.12,0.36), 0.5+0.5*sin(t*0.05)); vec3 c=cool*(0.5+0.4*band); c+=vec3(0.5,0.34,0.10)*exp(-dot(d,d)*6.0); return c; }\n" +
          "vec3 bgHex(vec2 d,float t){ vec2 p=d*6.0; float l1=abs(fract(p.x)-0.5), l2=abs(fract(p.x*0.5+p.y*0.866)-0.5), l3=abs(fract(p.x*0.5-p.y*0.866)-0.5); float gg=smoothstep(0.06,0.0,min(min(l1,l2),l3)); return vec3(0.05,0.09,0.15) + vec3(0.25,0.5,0.4)*gg*0.5; }\n" +
          "vec3 bgField(float mode, vec2 d, float pr, float pa, float gy, vec2 uvv, float tt, float b, float sel){\n" +
          "  if(mode<0.5) return alcFluid(uvv, tt, b, vec3(0.10,0.30,0.34), vec3(0.42,0.12,0.36), vec3(0.40,0.34,0.12));\n" +
          "  if(mode<1.5) return alcMarble(d, tt, b, vec3(0.14,0.34,0.18), vec3(0.40,0.12,0.36), vec3(0.7,0.95,0.6));\n" +
          "  if(mode<2.5) return alcFluid(uvv, tt, b, vec3(0.42,0.30,0.10), vec3(0.12,0.22,0.44), vec3(0.42,0.14,0.34));\n" +
          "  if(mode<3.5) return alcWash(d, tt, vec3(0.22,0.42,0.28), vec3(0.20,0.26,0.50), 0.05);\n" +
          "  if(mode<4.5) return bgTunnel(d, pr, pa, tt);\n" +
          "  if(mode<5.5) return bgComb(d, tt);\n" +
          "  if(mode<6.5) return alcMoire(uvv, tt, b, vec3(0.55,0.85,0.7));\n" +
          "  if(mode<7.5) return alcSolidSnap(sel) * 0.92;\n" +
          "  if(mode<8.5) return bgStrata(d, gy, tt);\n" +
          "  if(mode<9.5) return bgHex(d, tt);\n" +
          "  return alcRadialBloom(d, tt, b, vec3(0.42,0.12,0.36), vec3(0.20,0.40,0.18));\n" +
          "}\n" +
          "shader_body {\n" +
          "  vec2 d = uv - 0.5; d.x *= resolution.x / resolution.y;\n" +
          "  float pr = length(d);\n" +
          "  float pa = atan(d.y, d.x);\n" +
          "  float gy = uv.y;\n" +
          "  float pr2 = pr * 2.0;\n" +
          "  float sel = floor(q8 * 4.0);\n" +
          "  vec3 bg = mix(bgField(q18, d, pr2, pa, gy, uv, time, bass, sel), bgField(q20, d, pr2, pa, gy, uv, time, bass, sel), clamp(q27, 0.0, 1.0));\n" +
          "  bg = hueRot(bg, q8 * 6.2832 * 0.30);\n" +
          "  bg *= clamp(q19, 0.3, 1.2);\n" +
          "  bg *= (0.95 + 0.35 * bass);\n" +
          "  bg *= 1.0 - 0.22 * smoothstep(0.55, 1.35, pr);\n" +
          "  bg += hueRot(vec3(0.05, 0.047, 0.062), q8 * 6.2832 * 0.30) * (0.6 + 0.3 * bass);\n" +  // dusty ambient floor — never pure black
          "  float o = 1.8 / resolution.y;\n" +
          "  vec3 g = texture2D(sampler_main, uv).rgb;\n" +
          "  g = max(g, texture2D(sampler_main, uv + vec2(o,0.0)).rgb);\n" +
          "  g = max(g, texture2D(sampler_main, uv - vec2(o,0.0)).rgb);\n" +
          "  g = max(g, texture2D(sampler_main, uv + vec2(0.0,o)).rgb);\n" +
          "  g = max(g, texture2D(sampler_main, uv - vec2(0.0,o)).rgb);\n" +
          "  float km = 0.20 * clamp(q31, 0.0, 1.0);\n" +
          "  g += texture2D(sampler_main, vec2(1.0 - uv.x, uv.y)).rgb * km;\n" +
          "  g += texture2D(sampler_main, vec2(uv.x, 1.0 - uv.y)).rgb * km;\n" +
          "  vec3 glow = (texture2D(sampler_blur1, uv).rgb + texture2D(sampler_blur2, uv).rgb) * 0.5;\n" +
          "  vec3 outc = bg + g * 1.12 + glow * 0.45;\n" +
          "  ret = outc / (outc + vec3(0.88));\n" +
          ALC_HATCH +
          "}\n"
      }
    );

    // ── The 4 rendered waves: central kit motif + orb A + orb B + real-waveform tether (+beads).
    preset.waves[0] = {
      baseVals: Object.assign({}, WAVE_BASE, { enabled: 1, samples: 512, additive: 1, usedots: 0, scaling: 1, smoothing: 0.05, thick: 1, a: 0.85 }),
      init_eqs: passthrough, frame_eqs: passthrough, point_eqs: function (a) { return centralDraw(a); }
    };
    function orbWave(fns, visVar) {
      return {   // NON-additive (paints, no white blowout/smear); the comp glow term halos them.
        baseVals: Object.assign({}, WAVE_BASE, { enabled: 1, samples: 256, additive: 0, usedots: 0, scaling: 1, smoothing: 0.1, thick: 1, a: 0.9 }),
        init_eqs: passthrough, frame_eqs: passthrough,
        point_eqs: function (a) { return orbDispatch(fns, (a[visVar] || 0), a); }
      };
    }
    preset.waves[1] = orbWave(orbA_fns, "q17");                      // orb A (vis q17)
    preset.waves[2] = orbWave(orbB_fns, "q12");                      // orb B (vis q12)
    preset.waves[3] = {   // jagged REAL-waveform tether + bright beads strung on the line
      baseVals: Object.assign({}, WAVE_BASE, { enabled: 1, samples: 512, additive: 0, usedots: 0, scaling: 1, smoothing: 0.0, thick: 1, a: 0.9 }),
      init_eqs: passthrough, frame_eqs: passthrough,
      point_eqs: function (a) {
        fTether(a);
        var bead = Math.pow(Math.abs(Math.sin(a.sample * 3.14159 * 4.0)), 8.0);   // bright beads at intervals
        a.r += bead * 0.6; a.g += bead * 0.6; a.b += bead * 0.7;
        a.a = (a.a === undefined ? 0.9 : a.a) * (a.q4 || 0);
        fgRotate(a);
        return a;
      }
    };
    return preset;
  })();

  // ── Alchemy v2: Orbiters ─────────────────────────────────────────────────────
  // First preset of the Alchemy v2 framework (see docs/alchemy-v2/). A focused,
  // CRISP recreation of the WMP "Orbiters" signature that fixes the gaps the user
  // flagged in the current Alchemy:
  //   • the central "flower" IS the live audio waveform (radial scope), not drawn loops
  //   • the two orbs are joined by ONE thin LIGHTNING line (a single waveLine with a
  //     small, fast, treb-driven zig-zag) — NOT a wide thick fuzzy band
  //   • SMALL bright ringed orbs (white "Saturn" rings); the orb:line ratio favors the line
  //   • crisp thin high-alpha strokes; feedback sits BEHIND the geometry (no blur smear)
  //   • a COMPLEX dusty fbm fluid background (teal<->purple), never flat black
  //   • Reinhard tone-map so additive cores glow without blowing out to white
  // Audio: bass -> orb/flower size + bg breathe; mid -> flower amplitude + hue rate;
  // treb -> lightning amplitude + ring brightness. Hue cycles slowly, energy-coupled.
  // Does NOT touch "Alchemy Random" — this is a separate, additive entry.
  P["Alchemy v2: Orbiters"] = (function () {
    var huePhase = 0, lastT = 0;        // energy-coupled hue accumulator (closure state)

    var preset = build(
      {
        wave_a: 0,            // primary waveform off; the custom waves draw everything
        decay: 0.92,          // short, CRISP trail (dotted orb beads), not a smear
        gammaadj: 1.3,
        zoom: 0.995,          // slight INWARD drift keeps trails compact (1.0 made them sprawl)
        rot: 0.0,
        warp: 0.0,            // no sinusoidal warp -> lines stay clean/sharp
        wrap: 0,              // clamp (no edge-wrap border artifact)
        darken_center: 0.06,  // keep the busy center from over-blooming
        echo_alpha: 0
      },
      {
        frame: function (t) {
          var bass = t.bass_att || t.bass || 1;
          var mid = t.mid_att || t.mid || 1;
          var treb = t.treb_att || t.treb || 1;
          var tm = t.time;

          // energy-coupled hue drift: faster when the music is loud, slow when calm
          var dt = Math.min(0.1, Math.max(0, tm - lastT)); lastT = tm;
          var energy = (bass + mid + treb) / 3;
          huePhase = (huePhase + dt * (0.02 + 0.06 * energy)) % 1;

          // two orbs on opposing elliptical orbits (180 deg apart) -> the single
          // tether between them reads as ONE clean lightning line through center.
          var th = tm * 0.42;
          t.q1 = 0.5 + 0.27 * Math.cos(th);            // orb A center
          t.q2 = 0.5 + 0.20 * Math.sin(th * 1.06);
          t.q3 = 0.5 + 0.27 * Math.cos(th + Math.PI);  // orb B center (opposite)
          t.q4 = 0.5 + 0.20 * Math.sin(th * 1.06 + Math.PI);

          t.q5 = 0.018 + 0.012 * bass;                 // orb core radius (SMALL)
          t.q6 = t.q5 * 2.1 + 0.006;                   // Saturn-ring radius (just outside core)
          t.q7 = 0.012 + 0.045 * treb;                 // lightning displacement (SMALL + fast)
          t.q8 = huePhase;                             // (reserved) shared hue phase

          t.q9 = 0.085 + 0.05 * bass;                  // central flower base radius
          t.q10 = 0.05 + 0.06 * mid;                   // flower waveform amplitude
          t.q11 = (huePhase + 0.45) % 1;               // flower hue (offset from orbs)
          t.q12 = energy;                              // loudness -> bg breathe / brightness
          return t;
        },
        // feedback: recede + trim, NO blur. zoom (baseVal) shrinks old frames inward
        // into a dotted bead trail; the live strokes (drawn after) stay razor-sharp.
        warp:
          "shader_body {\n" +
          "ret = texture2D(sampler_main, uv).rgb;\n" +
          "ret -= 0.006;\n" +
          "}\n",
        // COMPLEX dusty fluid background + crisp additive geometry + Reinhard tone-map.
        comp:
          NOISE_GLSL + ALC_FLUID_GLSL +
          "shader_body {\n" +
          "vec2 d = uv - 0.5; d.x *= resolution.x / resolution.y;\n" +
          "float vig = 1.0 - smoothstep(0.22, 0.95, length(d));\n" +
          "vec3 bg = alcFluid(uv * 2.0, time, bass, vec3(0.012,0.045,0.055), vec3(0.06,0.035,0.11), vec3(0.09,0.15,0.15)) * vig;\n" +  // dark-teal / dusty-purple / teal-grey
          "vec3 sharp = texture2D(sampler_main, uv).rgb;\n" +                 // geometry + recede trails
          "vec3 glow = (texture2D(sampler_blur1, uv).rgb + texture2D(sampler_blur2, uv).rgb) * 0.5;\n" +
          "vec3 outc = bg + sharp + glow * 0.30;\n" +
          "ret = outc / (outc + vec3(0.85));\n" +                            // Reinhard: glow, never white-out
          "}\n"
      }
    );

    // central FLOWER = the live audio waveform as a radial scope (the U3 fix). Each
    // of the 512 samples is a spoke whose radius = base + amp*value1 -> jagged petals.
    function waveFlower() {
      return {
        baseVals: Object.assign({}, WAVE_BASE, {
          enabled: 1, samples: 512, additive: 1, usedots: 0, scaling: 1,
          smoothing: 0.06, a: 0.8, thick: 0
        }),
        init_eqs: passthrough, frame_eqs: passthrough,
        point_eqs: function (a) {
          var ang = a.sample * 6.2832;
          var rad = (a.q9 || 0.1) + (a.q10 || 0.05) * (a.value1 || 0);
          if (rad < 0.02) rad = 0.02;
          a.x = 0.5 + rad * Math.cos(ang);
          a.y = 0.5 + rad * Math.sin(ang);
          var h = a.q11 || 0;                          // dusty (desaturated) hue
          var rr = 0.5 + 0.5 * Math.cos(6.2832 * h);
          var gg = 0.5 + 0.5 * Math.cos(6.2832 * (h + 0.33));
          var bb = 0.5 + 0.5 * Math.cos(6.2832 * (h + 0.67));
          var l = (rr + gg + bb) / 3, s = 0.62;
          a.r = (rr * s + l * (1 - s)) * 0.85;
          a.g = (gg * s + l * (1 - s)) * 0.85;
          a.b = (bb * s + l * (1 - s)) * 0.85;
          return a;
        }
      };
    }

    // SINGLE lightning tether A->B (the U4 fix): one thin line, small fast perpendicular
    // displacement from the live waveform -> a crisp lightning filament, not a fuzzy band.
    function tether() {
      return {
        baseVals: Object.assign({}, WAVE_BASE, {
          enabled: 1, samples: 512, additive: 1, usedots: 0, scaling: 1,
          smoothing: 0.03, a: 0.9, thick: 0, r: 0.62, g: 0.85, b: 1.0
        }),
        init_eqs: passthrough, frame_eqs: passthrough,
        point_eqs: function (a) {
          var ax = a.q1 !== undefined ? a.q1 : 0.4, ay = a.q2 !== undefined ? a.q2 : 0.5;
          var bx = a.q3 !== undefined ? a.q3 : 0.6, by = a.q4 !== undefined ? a.q4 : 0.5;
          var dx = bx - ax, dy = by - ay;
          var len = Math.sqrt(dx * dx + dy * dy) || 1;
          var nx = -dy / len, ny = dx / len;            // unit perpendicular
          var s = a.sample;                              // 0..1 from A to B
          var disp = (a.value1 || 0) * (a.q7 || 0.03);
          a.x = ax + s * dx + nx * disp;
          a.y = ay + s * dy + ny * disp;
          a.r = 0.65; a.g = 0.85; a.b = 1.0;             // electric blue-white lightning
          return a;
        }
      };
    }

    // SMALL orb core: a tiny bright smooth ring that reads as a glowing node under bloom.
    function orbCore(qx, qy) {
      return {
        baseVals: Object.assign({}, WAVE_BASE, {
          enabled: 1, samples: 80, additive: 1, usedots: 0, scaling: 1,
          smoothing: 0.9, a: 0.95, thick: 1, r: 1.0, g: 0.72, b: 0.34
        }),
        init_eqs: passthrough, frame_eqs: passthrough,
        point_eqs: function (a) {
          var r = a.q5 || 0.02;
          var ang = a.sample * 6.2832;
          a.x = (a[qx] || 0.5) + r * Math.cos(ang);
          a.y = (a[qy] || 0.5) + r * Math.sin(ang);
          a.r = 1.0; a.g = 0.72; a.b = 0.34;
          return a;
        }
      };
    }

    // thin near-white "Saturn" ring around each orb (the orb:line ratio detail).
    function orbRing(qx, qy) {
      return {
        baseVals: Object.assign({}, WAVE_BASE, {
          enabled: 1, samples: 96, additive: 1, usedots: 0, scaling: 1,
          smoothing: 0.9, a: 0.5, thick: 0, r: 0.85, g: 0.92, b: 1.0
        }),
        init_eqs: passthrough, frame_eqs: passthrough,
        point_eqs: function (a) {
          var r = a.q6 || 0.05;
          var ang = a.sample * 6.2832;
          a.x = (a[qx] || 0.5) + r * Math.cos(ang);
          a.y = (a[qy] || 0.5) + r * Math.sin(ang);
          a.r = 0.85; a.g = 0.92; a.b = 1.0;
          return a;
        }
      };
    }

    preset.waves[0] = waveFlower();        // central live-waveform flower (back)
    preset.waves[1] = tether();            // single lightning line A<->B
    preset.waves[2] = orbCore("q1", "q2"); // orb A
    preset.waves[3] = orbCore("q3", "q4"); // orb B
    preset.waves[4] = orbRing("q1", "q2"); // orb A Saturn ring
    preset.waves[5] = orbRing("q3", "q4"); // orb B Saturn ring
    return preset;
  })();


  // ── Alchemy v2: Kaleidoscope ─────────────────────────────────────────────────
  // Phase 2 background showcase for the Alchemy v2 framework: the WMP "2D kaleidoscope
  // tunnel" look — a central LIVE-WAVEFORM burst mirrored into a 4-fold kaleidoscope
  // over a COMPLEX, colored lens-arc background (concentric color bands warped by angle,
  // slowly cycling). Vivid is allowed here (the reference kaleidoscope genuinely
  // saturates — the muting rule is relaxed for it), but Reinhard still caps white.
  // Directly answers the "background is too black / should be complex & colored" gap.
  // Audio: bass -> zoom "surge" (tunnel push) + bg brightness; mid -> burst amplitude;
  // treb -> rotation spin. Hue cycles, energy-coupled.
  P["Alchemy v2: Kaleidoscope"] = (function () {
    var huePhase = 0, lastT = 0;
    var preset = build(
      {
        wave_a: 0, decay: 0.95, gammaadj: 1.3, zoom: 1.0, rot: 0.012,
        warp: 0.0, wrap: 0, darken_center: 0.04, echo_alpha: 0
      },
      {
        frame: function (t) {
          var bass = t.bass_att || t.bass || 1;
          var mid = t.mid_att || t.mid || 1;
          var treb = t.treb_att || t.treb || 1;
          var tm = t.time;
          var dt = Math.min(0.1, Math.max(0, tm - lastT)); lastT = tm;
          huePhase = (huePhase + dt * (0.04 + 0.10 * ((bass + mid + treb) / 3))) % 1;
          t.zoom = 1.0 + 0.05 * bass;            // bass "surge" -> tunnel pushes inward
          t.rot = 0.012 + 0.02 * treb;           // slow rotation; treb spins it faster
          t.q9 = 0.10 + 0.05 * bass;             // burst base radius
          t.q10 = 0.10 + 0.10 * mid;             // burst waveform amplitude (dramatic)
          t.q11 = huePhase;                      // burst hue
          return t;
        },
        warp:
          "shader_body {\n" +
          "ret = texture2D(sampler_main, uv).rgb;\n" +
          "ret -= 0.004;\n" +
          "}\n",
        comp:
          PAL_GLSL +
          "shader_body {\n" +
          "vec2 d = uv - 0.5; d.x *= resolution.x / resolution.y;\n" +
          "float pr = length(d);\n" +                  // NOT 'rad' (reserved/predeclared)
          "float pa = atan(d.y, d.x);\n" +             // NOT 'ang' (reserved/predeclared)
          // 4-fold kaleidoscope: additively overlay the geometry mirrored in x, y and both
          "vec3 g = texture2D(sampler_main, uv).rgb;\n" +
          "g += texture2D(sampler_main, vec2(1.0 - uv.x, uv.y)).rgb;\n" +
          "g += texture2D(sampler_main, vec2(uv.x, 1.0 - uv.y)).rgb;\n" +
          "g += texture2D(sampler_main, vec2(1.0 - uv.x, 1.0 - uv.y)).rgb;\n" +
          // COMPLEX colored background: concentric lens-arc bands, petal-warped by angle
          "float bands = 0.5 + 0.5 * sin(pr * 20.0 - time * 1.4 + sin(pa * 6.0) * 1.3);\n" +
          // fade the procedural bands OUT of the center -> dark pupil + the live waveform
          // burst own the middle (no fixed drawn 'flower'); complex color stays outer.
          "float fade = smoothstep(0.04, 0.42, pr);\n" +
          "vec3 bg = pal(pr * 0.7 + time * 0.05) * bands * (0.16 + 0.12 * bass) * fade;\n" +
          "vec3 outc = bg + g * 0.72;\n" +
          "ret = outc / (outc + vec3(0.7));\n" +       // Reinhard (slightly hotter -> vivid)
          "}\n"
      }
    );

    // central live-waveform BURST (radial scope); the comp mirrors it into the kaleidoscope.
    function burst(useSecond) {
      return {
        baseVals: Object.assign({}, WAVE_BASE, {
          enabled: 1, samples: 512, additive: 1, usedots: 0, scaling: 1,
          smoothing: 0.05, a: 0.85, thick: 0
        }),
        init_eqs: passthrough, frame_eqs: passthrough,
        point_eqs: function (a) {
          var ang = a.sample * 6.2832;
          var samp = useSecond ? (a.value2 !== undefined ? a.value2 : a.value1) : a.value1;
          var rad = (a.q9 || 0.1) + (a.q10 || 0.1) * (samp || 0);
          if (rad < 0.02) rad = 0.02;
          a.x = 0.5 + rad * Math.cos(ang);
          a.y = 0.5 + rad * Math.sin(ang);
          var h = (a.q11 || 0) + a.sample * 0.15;       // hue varies slightly around the ring
          a.r = 0.5 + 0.5 * Math.cos(6.2832 * h);
          a.g = 0.5 + 0.5 * Math.cos(6.2832 * (h + 0.33));
          a.b = 0.5 + 0.5 * Math.cos(6.2832 * (h + 0.67));
          return a;
        }
      };
    }
    preset.waves[0] = burst(false);
    preset.waves[1] = burst(true);
    return preset;
  })();


  // ── Alchemy v2: Anemone Pulsar ───────────────────────────────────────────────
  // The emotional center of WMP Alchemy: a dusty rose/magenta furry ANEMONE (a radial
  // live-waveform scope with a dark pupil) that PULSES with the bass, flanked by the two
  // orbiters joined by one thin tether — all on a flat SOLID-COLOR background that SNAPS
  // between muted cobalt / sage / plum (the Alchemy hallmark; a new bg mode for the kit).
  // This is a MUTED scene (the muting rule applies — dusty, tone-mapped, no neon/white).
  // Audio: bass -> anemone pulse + bg brightness; mid -> fur amplitude; treb -> tether zig.
  P["Alchemy v2: Anemone Pulsar"] = (function () {
    var huePhase = 0, lastT = 0;
    var preset = build(
      {
        wave_a: 0, decay: 0.90, gammaadj: 1.3, zoom: 0.997,  // shorter decay -> compact orb beads, less coil
        rot: 0.0, warp: 0.0, wrap: 0, darken_center: 0.05, echo_alpha: 0
      },
      {
        frame: function (t) {
          var bass = t.bass_att || t.bass || 1;
          var mid = t.mid_att || t.mid || 1;
          var treb = t.treb_att || t.treb || 1;
          var tm = t.time;
          var dt = Math.min(0.1, Math.max(0, tm - lastT)); lastT = tm;
          huePhase = (huePhase + dt * (0.015 + 0.05 * ((bass + mid + treb) / 3))) % 1;
          var th = tm * 0.33;                          // slow flanking orbit
          t.q1 = 0.5 + 0.34 * Math.cos(th);            // orb A — CIRCULAR orbit, radius 0.34 so both
          t.q2 = 0.5 + 0.34 * Math.sin(th);            //   orbs sit clearly OUTSIDE the anemone fur
          t.q3 = 0.5 + 0.34 * Math.cos(th + Math.PI);  // orb B (opposite) — not masked, not in a corner
          t.q4 = 0.5 + 0.34 * Math.sin(th + Math.PI);
          t.q5 = 0.016 + 0.012 * bass;                 // orb core radius
          t.q6 = t.q5 * 2.1 + 0.006;                   // Saturn ring
          t.q7 = 0.010 + 0.035 * treb;                 // tether lightning amplitude (small)
          t.q9 = 0.07 + 0.06 * bass;                   // anemone base radius — smaller so the
          t.q10 = 0.04 + 0.05 * mid;                   //   flanking orbs sit OUTSIDE the fur (PULSAR pulse)
          t.q11 = huePhase;                            // hue drift (kept in the rose/magenta band below)
          return t;
        },
        warp:
          "shader_body {\n" +
          "ret = texture2D(sampler_main, uv).rgb;\n" +
          "ret -= 0.005;\n" +
          "}\n",
        // SOLID-COLOR-SNAP background mode: a flat muted color that hard-snaps every few
        // seconds, with a faint fbm wash for life, a vignette, and a dark central pupil.
        comp:
          NOISE_GLSL +
          "shader_body {\n" +
          "vec2 d = uv - 0.5; d.x *= resolution.x / resolution.y;\n" +
          "float pr = length(d);\n" +
          "float idx = mod(floor(time / 6.0), 3.0);\n" +          // snap every 6s
          "vec3 c0 = vec3(0.09, 0.14, 0.30);\n" +                 // dusty cobalt
          "vec3 c1 = vec3(0.10, 0.17, 0.12);\n" +                 // dusty sage
          "vec3 c2 = vec3(0.16, 0.07, 0.18);\n" +                 // dusty plum
          "vec3 solid = idx < 0.5 ? c0 : (idx < 1.5 ? c1 : c2);\n" +
          "float wash = 0.85 + 0.30 * fbm(uv * 2.2 + vec2(time * 0.03, -time * 0.02));\n" +
          "float vig = 1.0 - 0.45 * smoothstep(0.25, 1.1, pr);\n" +
          "float pupil = smoothstep(0.0, 0.16, pr);\n" +          // dark center -> the anemone's eye
          "vec3 bg = solid * wash * vig * pupil * (0.9 + 0.15 * bass);\n" +
          "vec3 g = texture2D(sampler_main, uv).rgb;\n" +
          "vec3 glow = (texture2D(sampler_blur1, uv).rgb + texture2D(sampler_blur2, uv).rgb) * 0.5;\n" +
          "vec3 outc = bg + g + glow * 0.30;\n" +
          "ret = outc / (outc + vec3(0.9));\n" +                  // Reinhard, muted (k=0.9)
          "}\n"
      }
    );

    // the ANEMONE: a radial live-waveform scope, dusty rose/magenta, dark pupil.
    function anemone(useSecond) {
      return {
        baseVals: Object.assign({}, WAVE_BASE, {
          enabled: 1, samples: 512, additive: 1, usedots: 0, scaling: 1,
          smoothing: 0.04, a: 0.7, thick: 0
        }),
        init_eqs: passthrough, frame_eqs: passthrough,
        point_eqs: function (a) {
          var ang = a.sample * 6.2832;
          var samp = useSecond ? (a.value2 !== undefined ? a.value2 : a.value1) : a.value1;
          var rad = (a.q9 || 0.12) + (a.q10 || 0.06) * (samp || 0);
          if (rad < 0.03) rad = 0.03;
          a.x = 0.5 + rad * Math.cos(ang);
          a.y = 0.5 + rad * Math.sin(ang);
          var h = 0.90 + 0.10 * Math.sin(6.2832 * (a.q11 || 0));   // dusty rose <-> magenta band
          var rr = 0.5 + 0.5 * Math.cos(6.2832 * h);
          var gg = 0.5 + 0.5 * Math.cos(6.2832 * (h + 0.33));
          var bb = 0.5 + 0.5 * Math.cos(6.2832 * (h + 0.67));
          var l = (rr + gg + bb) / 3, s = 0.55;
          a.r = (rr * s + l * (1 - s)) * 0.8;
          a.g = (gg * s + l * (1 - s)) * 0.8;
          a.b = (bb * s + l * (1 - s)) * 0.8;
          return a;
        }
      };
    }
    // single thin lightning tether between the flanking orbs (fainter here so it doesn't
    // overpower the anemone).
    function tether() {
      return {
        baseVals: Object.assign({}, WAVE_BASE, {
          enabled: 1, samples: 512, additive: 1, usedots: 0, scaling: 1,
          smoothing: 0.03, a: 0.55, thick: 0, r: 0.62, g: 0.85, b: 1.0
        }),
        init_eqs: passthrough, frame_eqs: passthrough,
        point_eqs: function (a) {
          var ax = a.q1 !== undefined ? a.q1 : 0.4, ay = a.q2 !== undefined ? a.q2 : 0.5;
          var bx = a.q3 !== undefined ? a.q3 : 0.6, by = a.q4 !== undefined ? a.q4 : 0.5;
          var dx = bx - ax, dy = by - ay;
          var len = Math.sqrt(dx * dx + dy * dy) || 1;
          var nx = -dy / len, ny = dx / len;
          var s = a.sample;
          var disp = (a.value1 || 0) * (a.q7 || 0.03);
          a.x = ax + s * dx + nx * disp;
          a.y = ay + s * dy + ny * disp;
          a.r = 0.6; a.g = 0.8; a.b = 1.0;
          return a;
        }
      };
    }
    // cr/cg/cb let each orb be tinted (orb B is tinted distinctly as a diagnostic to
    // confirm it renders; if both show, we'll decide same-color vs distinct).
    function orbCore(qx, qy, cr, cg, cb) {
      return {
        baseVals: Object.assign({}, WAVE_BASE, {
          enabled: 1, samples: 80, additive: 1, usedots: 0, scaling: 1,
          smoothing: 0.9, a: 0.95, thick: 1, r: cr, g: cg, b: cb
        }),
        init_eqs: passthrough, frame_eqs: passthrough,
        point_eqs: function (a) {
          var r = a.q5 || 0.02; var ang = a.sample * 6.2832;
          a.x = (a[qx] || 0.5) + r * Math.cos(ang);
          a.y = (a[qy] || 0.5) + r * Math.sin(ang);
          a.r = cr; a.g = cg; a.b = cb;
          return a;
        }
      };
    }
    function orbRing(qx, qy, cr, cg, cb) {
      return {
        baseVals: Object.assign({}, WAVE_BASE, {
          enabled: 1, samples: 96, additive: 1, usedots: 0, scaling: 1,
          smoothing: 0.9, a: 0.25, thick: 0, r: cr, g: cg, b: cb
        }),
        init_eqs: passthrough, frame_eqs: passthrough,
        point_eqs: function (a) {
          var r = a.q6 || 0.05; var ang = a.sample * 6.2832;
          a.x = (a[qx] || 0.5) + r * Math.cos(ang);
          a.y = (a[qy] || 0.5) + r * Math.sin(ang);
          a.r = cr; a.g = cg; a.b = cb;
          return a;
        }
      };
    }
    // 6-wave layout, identical to the known-good Orbiters preset. NOTE: a 7-wave version
    // (two anemone channels) made the 7th wave (orb B's ring) fail to render — this build
    // only reliably draws ~6 enabled custom waves. Keep orb waves at low indices.
    preset.waves[0] = anemone(false);                         // anemone fur
    preset.waves[1] = tether();                               // thin lightning between the orbs
    preset.waves[2] = orbCore("q1", "q2", 1.0, 0.72, 0.34);   // orb A core (gold)
    preset.waves[3] = orbCore("q3", "q4", 1.0, 0.72, 0.34);   // orb B core (gold — matches A)
    preset.waves[4] = orbRing("q1", "q2", 0.85, 0.92, 1.0);   // orb A ring (white)
    preset.waves[5] = orbRing("q3", "q4", 0.85, 0.92, 1.0);   // orb B ring (white)
    return preset;
  })();


  // ── Alchemy v2: Vortex ───────────────────────────────────────────────────────
  // The WMP "swirling vortex": NOT a drawn pinwheel — the spiral is generated by FEEDBACK.
  // A central live-waveform burst (+ two orbs) is dragged into a spiral galaxy by an inward
  // pull plus a radius-proportional TWIST in the warp shader (twist grows toward the
  // center -> "water down a drain"), leaving a dark central pupil, over a hazy purple/green
  // field. Muted + Reinhard. Audio: bass -> inward pull + burst size; mid -> twist speed;
  // treb -> burst fur. (<=6 custom waves per the build's wave cap.)
  P["Alchemy v2: Vortex"] = (function () {
    var huePhase = 0, lastT = 0;
    var preset = build(
      {
        wave_a: 0, decay: 0.95, gammaadj: 1.3, zoom: 1.0,   // inward pull + twist done in warp
        rot: 0.0, warp: 0.0, wrap: 0, darken_center: 0.10, echo_alpha: 0
      },
      {
        frame: function (t) {
          var bass = t.bass_att || t.bass || 1;
          var mid = t.mid_att || t.mid || 1;
          var treb = t.treb_att || t.treb || 1;
          var tm = t.time;
          var dt = Math.min(0.1, Math.max(0, tm - lastT)); lastT = tm;
          huePhase = (huePhase + dt * (0.02 + 0.05 * ((bass + mid + treb) / 3))) % 1;
          var th = tm * 0.3;                           // orbs being pulled around the vortex (slower)
          t.q1 = 0.5 + 0.30 * Math.cos(th);
          t.q2 = 0.5 + 0.30 * Math.sin(th);
          t.q3 = 0.5 + 0.30 * Math.cos(th + Math.PI);
          t.q4 = 0.5 + 0.30 * Math.sin(th + Math.PI);
          t.q5 = 0.015 + 0.010 * bass;                 // orb core radius (small)
          t.q9 = 0.06 + 0.05 * bass;                   // central burst base radius
          t.q10 = 0.05 + 0.06 * mid;                   // burst fur amplitude
          t.q11 = huePhase;                            // hue (green<->magenta band below)
          return t;
        },
        // FEEDBACK = the vortex: rotate each sample coord by a twist that GROWS toward the
        // center, and pull inward (scale<1). Over frames the live geometry smears into
        // spiral arms. mid speeds the twist; bass deepens the inward pull.
        warp:
          "shader_body {\n" +
          "vec2 c = uv - 0.5;\n" +
          "float pr = length(c);\n" +
          // Halve BOTH twist and inward-pull vs the first tight version: spiral pitch
          // (tightness ~ tw/(1-sc)) is preserved, but spin + inward flow run ~half speed.
          "float tw = 0.035 + 0.035 * mid + 0.09 / (pr * 6.0 + 1.0);\n" +
          "float sc = 0.991 - 0.006 * bass;\n" +
          "float s = sin(tw), co = cos(tw);\n" +
          "vec2 sd = vec2(c.x * co - c.y * s, c.x * s + c.y * co) * sc + 0.5;\n" +
          "ret = texture2D(sampler_main, sd).rgb;\n" +
          "ret -= 0.004;\n" +
          "}\n",
        comp:
          NOISE_GLSL +
          "shader_body {\n" +
          "vec2 d = uv - 0.5; d.x *= resolution.x / resolution.y;\n" +
          "float pr = length(d);\n" +
          "float n = fbm(uv * 2.0 + vec2(time * 0.03, -time * 0.025));\n" +
          "vec3 haze = mix(vec3(0.04, 0.02, 0.07), vec3(0.03, 0.10, 0.06), n);\n" +  // purple <-> green
          "float vig = 1.0 - smoothstep(0.2, 1.0, pr);\n" +
          "haze *= vig * (0.5 + 0.4 * bass);\n" +
          "haze *= smoothstep(0.0, 0.12, pr);\n" +                 // dark central pupil
          "vec3 g = texture2D(sampler_main, uv).rgb;\n" +
          "vec3 glow = (texture2D(sampler_blur1, uv).rgb + texture2D(sampler_blur2, uv).rgb) * 0.5;\n" +
          "vec3 outc = haze + g + glow * 0.35;\n" +
          "ret = outc / (outc + vec3(0.85));\n" +
          "}\n"
      }
    );

    // central live-waveform burst (feeds the vortex); muted green<->magenta.
    function burst(useSecond) {
      return {
        baseVals: Object.assign({}, WAVE_BASE, {
          enabled: 1, samples: 512, additive: 1, usedots: 0, scaling: 1,
          smoothing: 0.05, a: 0.8, thick: 0
        }),
        init_eqs: passthrough, frame_eqs: passthrough,
        point_eqs: function (a) {
          var ang = a.sample * 6.2832;
          var samp = useSecond ? (a.value2 !== undefined ? a.value2 : a.value1) : a.value1;
          var rad = (a.q9 || 0.08) + (a.q10 || 0.05) * (samp || 0);
          if (rad < 0.03) rad = 0.03;
          a.x = 0.5 + rad * Math.cos(ang);
          a.y = 0.5 + rad * Math.sin(ang);
          var h = 0.33 + 0.59 * (0.5 + 0.5 * Math.sin(6.2832 * ((a.q11 || 0) + a.sample * 0.25)));  // green<->magenta
          var rr = 0.5 + 0.5 * Math.cos(6.2832 * h);
          var gg = 0.5 + 0.5 * Math.cos(6.2832 * (h + 0.33));
          var bb = 0.5 + 0.5 * Math.cos(6.2832 * (h + 0.67));
          var l = (rr + gg + bb) / 3, sat = 0.6;
          a.r = (rr * sat + l * (1 - sat)) * 0.8;
          a.g = (gg * sat + l * (1 - sat)) * 0.8;
          a.b = (bb * sat + l * (1 - sat)) * 0.8;
          return a;
        }
      };
    }
    // orb = a small FILLED glow-disc (samples fill a tiny disc, drawn as dots). Big enough
    // (~16px) to survive the warp resampling, so its per-frame feedback stamps merge into a
    // continuous bright spiral STREAK — not a chain of rings (circle orb) and not a faint
    // dotted line (single-point orb).
    function orbCore(qx, qy) {
      return {
        baseVals: Object.assign({}, WAVE_BASE, {
          enabled: 1, samples: 48, additive: 1, usedots: 1, scaling: 1,
          smoothing: 0, a: 1.0, thick: 1, r: 1.0, g: 0.78, b: 0.4
        }),
        init_eqs: passthrough, frame_eqs: passthrough,
        point_eqs: function (a) {
          var fr = a.sample;
          var rr = 0.008 * Math.sqrt(fr);          // fill a small disc (dense center -> glow)
          var ang = fr * 6.2832 * 9.0;             // sunflower spread
          a.x = (a[qx] || 0.5) + rr * Math.cos(ang);
          a.y = (a[qy] || 0.5) + rr * Math.sin(ang);
          a.r = 1.0; a.g = 0.78; a.b = 0.4;
          return a;
        }
      };
    }
    preset.waves[0] = burst(false);          // central waveform burst (channel 1)
    preset.waves[1] = burst(true);           // central waveform burst (channel 2)
    preset.waves[2] = orbCore("q1", "q2");   // orb A (pulled into the spiral)
    preset.waves[3] = orbCore("q3", "q4");   // orb B
    return preset;
  })();


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
    var huePhase = 0, lastT = 0;
    var camPhase = 0;                              // camera = deliberate gesture (LFO ramp)
    var bgSH = makeSH(0, 1, 8, 18, 1.2), motifSH = makeSH(0.3, 1.0, 10, 22, 1.0); // stochastic decoupled layers
    var bgSel = 0, lastSnap = -10;
    var flash = alcBeatFlash();
    var rosePal = alcPalette({ step: 0.5, base: 0.28, sat: 0.75, gain: 1.0 }); // green↔magenta band (brighter fur)

    var preset = build(
      { wave_a: 0, decay: 0.95, gammaadj: 1.3, zoom: 1.0, rot: 0.0, warp: 0.0, wrap: 0, darken_center: 0.0, echo_alpha: 0 },
      {
        frame: function (t) {
          var bass = t.bass_att || t.bass || 1, mid = t.mid_att || t.mid || 1, treb = t.treb_att || t.treb || 1;
          var tm = t.time;
          var dt = Math.min(0.1, Math.max(0, tm - lastT)); lastT = tm;
          var energy = (bass + mid + treb) / 3;
          var f = flash(energy, dt);                 // 0..1 beat flash (discrete events)

          // L1 — COLOUR: slow energy-coupled hue clock (faster only when LOUDER than nominal).
          huePhase = alcHueClock(huePhase, dt, Math.max(0, energy - 1), 0.012, 0.06);
          t.q8 = huePhase;

          // L2 — CAMERA: vortex dive ramps on its OWN ~26s clock, deepened by loudness.
          camPhase += dt / 26;
          var vortexAmt = 0.5 - 0.5 * Math.cos(camPhase * 6.2832);          // smooth 0→1→0
          vortexAmt = Math.min(1, vortexAmt * (0.6 + 0.6 * Math.max(0, energy - 1)));
          t.q12 = vortexAmt;                          // warp twist gate
          t.q13 = vortexAmt;                          // warp inward-suction gate

          // L3 — BACKGROUND: solid↔fluid crossfade on its OWN ~17s clock; solid colour
          // SNAPS to the next dusty tone on a strong beat (≥4s apart) — a discrete event.
          t.q14 = bgSH(tm, dt);                                            // 0=solid↔1=fluid (stochastic sample&hold)
          if (f > 0.6 && (tm - lastSnap) > 4) { bgSel = (bgSel + 1) % 4; lastSnap = tm; }
          t.q15 = bgSel;
          t.q16 = 0.5 + 0.6 * f + 0.2 * Math.max(0, bass - 1);             // bg brightness lifts on beats

          // L4 — MOTIF: orbiter pair fades in/out stochastically (random hold + morph).
          t.q17 = motifSH(tm, dt);                                         // orbiter visibility (stochastic)

          // motif geometry (the anemone fur + the two flanking orbiters on opposing orbits)
          var th = tm * 0.30;
          t.q1 = 0.5 + 0.24 * Math.cos(th);            t.q2 = 0.5 + 0.24 * Math.sin(th); // orbs pulled IN closer
          t.q3 = 0.5 + 0.24 * Math.cos(th + Math.PI);  t.q4 = 0.5 + 0.24 * Math.sin(th + Math.PI);
          t.q5 = 0.018 + 0.014 * bass;                 // orb core radius
          t.q6 = t.q5 * 2.1 + 0.006;                   // Saturn ring radius
          t.q7 = 0.010 + 0.035 * treb;                 // tether lightning amplitude (small)
          t.q9 = 0.11 + 0.10 * bass;                   // anemone base radius (bigger fur, fills the centre)
          t.q10 = 0.06 + 0.07 * mid;                   // anemone fur amplitude (PULSAR pulse)
          return t;
        },
        // CAMERA (L2) lives here: a twist that GROWS toward centre + inward suction, both
        // GATED by q12/q13 (vortexAmt). At rest (q12=0) the warp is identity + a fast fade
        // → crisp anemone; as it engages, the fur smears into spiral arms (slow fade).
        warp:
          "shader_body {\n" +
          "vec2 c = uv - 0.5;\n" +
          "float pr = length(c);\n" +
          "float tw = q12 * (0.05 + 0.05*mid + 0.10/(pr*6.0 + 1.0));\n" +   // twist tightens toward centre
          "float sc = 1.0 - q13 * (0.012 + 0.006*bass);\n" +               // inward suction
          "float sn = sin(tw), cs = cos(tw);\n" +
          "vec2 sd = vec2(c.x*cs - c.y*sn, c.x*sn + c.y*cs) * sc + 0.5;\n" +
          "ret = texture2D(sampler_main, sd).rgb;\n" +
          "ret -= mix(0.022, 0.005, q12);\n" +                             // short tight orb trails when flat, long spiral arms in the vortex
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
          "vec3 sol = si < 0.5 ? vec3(0.10,0.17,0.12) : si < 1.5 ? vec3(0.09,0.14,0.30) : si < 2.5 ? vec3(0.16,0.07,0.18) : vec3(0.18,0.16,0.07);\n" +  // sage / cobalt / plum / olive
          "vec2 fq = vec2(fbm(uv*1.8 + vec2(time*0.04, -time*0.03)), fbm(uv*1.8 + 5.0 - time*0.035));\n" +
          "float n = fbm(uv*1.6 + fq*1.3);\n" +
          "vec3 flu = mix(vec3(0.05,0.03,0.10), vec3(0.04,0.12,0.08), clamp(n*1.3, 0.0, 1.0));\n" +  // purple↔green fluid
          "vec3 bg = mix(sol, flu, clamp(q14, 0.0, 1.0));\n" +
          "float vig = 1.0 - 0.45*smoothstep(0.25, 1.1, pr);\n" +
          "float pupil = smoothstep(0.0, 0.05, pr);\n" +                   // SMALL dark anemone eye (was a huge hole)
          "bg *= vig * pupil * (0.6 + 0.5*q16);\n" +
          "vec3 g = texture2D(sampler_main, uv).rgb;\n" +
          "vec3 glow = (texture2D(sampler_blur1, uv).rgb + texture2D(sampler_blur2, uv).rgb) * 0.5;\n" +
          "vec3 outc = bg + g + glow * 0.30;\n" +
          "ret = outc / (outc + vec3(0.9));\n" +                           // Reinhard, muted (k=0.9)
          "}\n"
      }
    );

    // L4 motif waves — the anemone fur (constant) + a fading orbiter pair joined by a tether.
    // The anemone hue PING-PONGS green↔magenta off the q8 colour clock (a band, not a full
    // wheel sweep — the reference's two-tone behaviour). Orbs/tether fade via q17.
    function anemone() {
      return {
        baseVals: Object.assign({}, WAVE_BASE, { enabled: 1, samples: 512, additive: 1, usedots: 0, scaling: 1, smoothing: 0.04, a: 0.7, thick: 0 }),
        init_eqs: passthrough, frame_eqs: passthrough,
        point_eqs: function (a) {
          var ang = a.sample * 6.2832;
          var rad = (a.q9 || 0.12) + (a.q10 || 0.06) * (a.value1 || 0);
          if (rad < 0.03) rad = 0.03;
          a.x = 0.5 + rad * Math.cos(ang);
          a.y = 0.5 + rad * Math.sin(ang);
          rosePal(a, 0);                              // muted green↔magenta band keyed by a.q8
          return a;
        }
      };
    }
    function tether() {
      return {
        baseVals: Object.assign({}, WAVE_BASE, { enabled: 1, samples: 512, additive: 1, usedots: 0, scaling: 1, smoothing: 0.03, a: 0.55, thick: 0, r: 0.6, g: 0.8, b: 1.0 }),
        init_eqs: passthrough, frame_eqs: passthrough,
        point_eqs: function (a) {
          var ax = a.q1 !== undefined ? a.q1 : 0.4, ay = a.q2 !== undefined ? a.q2 : 0.5;
          var bx = a.q3 !== undefined ? a.q3 : 0.6, by = a.q4 !== undefined ? a.q4 : 0.5;
          var dx = bx - ax, dy = by - ay;
          var len = Math.sqrt(dx * dx + dy * dy) || 1;
          var nx = -dy / len, ny = dx / len;
          var disp = (a.value1 || 0) * (a.q7 || 0.03);
          a.x = ax + a.sample * dx + nx * disp;
          a.y = ay + a.sample * dy + ny * disp;
          var vis = a.q17 === undefined ? 1 : a.q17;  // L4 fade
          a.r = 0.6 * vis; a.g = 0.8 * vis; a.b = 1.0 * vis; a.a = 0.55 * vis;
          return a;
        }
      };
    }
    function orb(qx, qy, isRing) {
      return {
        baseVals: Object.assign({}, WAVE_BASE, { enabled: 1, samples: isRing ? 96 : 80, additive: 1, usedots: 0, scaling: 1, smoothing: 0.9, a: isRing ? 0.25 : 0.95, thick: isRing ? 0 : 1 }),
        init_eqs: passthrough, frame_eqs: passthrough,
        point_eqs: function (a) {
          var r = (isRing ? (a.q6 || 0.05) : (a.q5 || 0.02));
          var ang = a.sample * 6.2832;
          a.x = (a[qx] || 0.5) + r * Math.cos(ang);
          a.y = (a[qy] || 0.5) + r * Math.sin(ang);
          var vis = a.q17 === undefined ? 1 : a.q17;  // L4 fade
          if (isRing) { a.r = 0.85 * vis; a.g = 0.92 * vis; a.b = 1.0 * vis; a.a = 0.25 * vis; }   // white Saturn ring
          else { a.r = 1.0 * vis; a.g = 0.72 * vis; a.b = 0.34 * vis; a.a = 0.95 * vis; }          // gold core
          return a;
        }
      };
    }
    preset.waves[0] = anemone();                 // anemone fur (constant primary)
    preset.waves[1] = tether();                  // lightning tether between the orbs
    preset.waves[2] = orb("q1", "q2", false);    // orb A core (gold)
    preset.waves[3] = orb("q3", "q4", false);    // orb B core (gold)
    preset.waves[4] = orb("q1", "q2", true);     // orb A ring (white)
    preset.waves[5] = orb("q3", "q4", true);     // orb B ring (white)
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
    var lastT = 0, camPhase = 0;                 // camera = deliberate gesture (LFO)
    var hueSH = makeSH(0, 1, 9, 18, 0.5);        // STOCHASTIC scheme hue → palette differs over time
    var bgSH = makeSH(0, 1, 8, 18, 1.2), motifSH = makeSH(0.3, 1.0, 10, 22, 1.0);
    var oax = makeSH(0.18, 0.82, 5, 11, 0.7), oay = makeSH(0.18, 0.82, 5, 11, 0.7), obx = makeSH(0.18, 0.82, 5, 11, 0.7), oby = makeSH(0.18, 0.82, 5, 11, 0.7); // orbs at RANDOM places
    var flash = alcBeatFlash();
    var preset = build(
      { wave_a: 0, decay: 0.95, gammaadj: 1.4, zoom: 1.0, rot: 0.0, warp: 0.0, wrap: 0, darken_center: 0.04, echo_alpha: 0 },
      {
        frame: function (t) {
          var bass = t.bass_att || t.bass || 1, mid = t.mid_att || t.mid || 1, treb = t.treb_att || t.treb || 1;
          var tm = t.time, dt = Math.min(0.1, Math.max(0, tm - lastT)); lastT = tm;
          var energy = (bass + mid + treb) / 3, f = flash(energy, dt);
          t.q8 = (hueSH(tm, dt) + tm * 0.004) % 1;                                // L1 STOCHASTIC scheme hue
          camPhase += dt / 24; t.q12 = 0.5 - 0.5 * Math.cos(camPhase * 6.2832);   // L2 kaleido-fold 0..1
          t.q13 = Math.max(0, bass - 1);                                          // L2 corridor zoom pulse
          t.q14 = bgSH(tm, dt);                                                   // L3 bands↔black (stochastic)
          t.q16 = 0.5 + 0.6 * f + 0.2 * Math.max(0, bass - 1);
          t.q17 = motifSH(tm, dt);                                                // L4 orbiter visibility (stochastic)
          t.q1 = oax(tm, dt); t.q2 = oay(tm, dt);       // orbs wander to RANDOM places (not a fixed orbit)
          t.q3 = obx(tm, dt); t.q4 = oby(tm, dt);
          t.q5 = 0.015 + 0.012 * bass; t.q6 = t.q5 * 2.1 + 0.006; t.q7 = 0.010 + 0.035 * treb;
          t.q9 = tm * 0.10;                            // net spin
          t.q18 = 0.40;                                // net spoke length
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
          NOISE_GLSL + PAL_GLSL +
          "shader_body {\n" +
          "vec2 d = uv - 0.5; d.x *= resolution.x / resolution.y;\n" +
          "float pr = length(d);\n" +
          "float yb = d.y * 4.0 + time * 0.06;\n" +
          "float bb = 0.5 + 0.5 * sin(fract(yb) * 6.2832);\n" +
          "vec3 bands = mix(vec3(1.0, 0.18, 0.18), vec3(0.18, 0.95, 0.35), bb);\n" +   // red↔green bands (no rainbow)
          "bands *= exp(-pow(d.y * 3.0, 2.0));\n" +
          "vec3 bg = bands * clamp(q14, 0.0, 1.0) * (0.5 + 0.5 * q16);\n" +
          "vec3 g = texture2D(sampler_main, uv).rgb;\n" +
          "vec3 glow = (texture2D(sampler_blur1, uv).rgb + texture2D(sampler_blur2, uv).rgb) * 0.5;\n" +
          "vec3 outc = bg + g + glow * 0.35;\n" +
          "ret = outc / (outc + vec3(0.7));\n" +
          "}\n"
      }
    );
    function rays(n) {
      return {
        baseVals: Object.assign({}, WAVE_BASE, { enabled: 1, samples: 512, additive: 1, usedots: 0, scaling: 1, smoothing: 0.05, a: 0.5, thick: 0 }),
        init_eqs: passthrough, frame_eqs: passthrough,
        point_eqs: function (a) {
          var seg = 1 / n, k = Math.floor(a.sample / seg), ff = (a.sample - k * seg) / seg;
          var ang = (k / n) * 6.2832 + (a.q9 || 0);
          var rad = ff * (a.q18 || 0.4);
          var disp = (a.value1 || 0) * 0.05 * ff;       // waveform jag grows outward along each spoke
          a.x = 0.5 + rad * Math.cos(ang) - disp * Math.sin(ang);
          a.y = 0.5 + rad * Math.sin(ang) + disp * Math.cos(ang);
          // RED↔GREEN two-tone (the reference X-tunnel is red/green, NOT a rainbow);
          // parity splits spokes into the two hues, the duo drifts slowly with q8.
          var h = (k % 2 ? 0.0 : 0.65) + 0.05 * Math.sin(6.2832 * (a.q8 || 0));
          a.r = (0.5 + 0.5 * Math.cos(6.2832 * h)) * 0.85;
          a.g = (0.5 + 0.5 * Math.cos(6.2832 * (h + 0.33))) * 0.85;
          a.b = (0.5 + 0.5 * Math.cos(6.2832 * (h + 0.67))) * 0.85;
          return a;
        }
      };
    }
    function orb(qx, qy, isRing) {
      return {
        baseVals: Object.assign({}, WAVE_BASE, { enabled: 1, samples: isRing ? 96 : 80, additive: 1, usedots: 0, scaling: 1, smoothing: 0.9, a: isRing ? 0.25 : 0.95, thick: isRing ? 0 : 1 }),
        init_eqs: passthrough, frame_eqs: passthrough,
        point_eqs: function (a) {
          var r = isRing ? (a.q6 || 0.05) : (a.q5 || 0.02), ang = a.sample * 6.2832;
          a.x = (a[qx] || 0.5) + r * Math.cos(ang); a.y = (a[qy] || 0.5) + r * Math.sin(ang);
          var vis = a.q17 === undefined ? 1 : a.q17;
          if (isRing) { a.r = 0.85 * vis; a.g = 0.92 * vis; a.b = 1.0 * vis; a.a = 0.25 * vis; }
          else { a.r = 1.0 * vis; a.g = 0.85 * vis; a.b = 0.5 * vis; a.a = 0.95 * vis; }
          return a;
        }
      };
    }
    preset.waves[0] = rays(18);                  // the wireframe net of radial waveform spokes
    preset.waves[1] = orb("q1", "q2", false);    // orb A core
    preset.waves[2] = orb("q3", "q4", false);    // orb B core
    preset.waves[3] = orb("q1", "q2", true);     // orb A ring
    preset.waves[4] = orb("q3", "q4", true);     // orb B ring
    return preset;
  })();


  // ── Alchemy v2: Era — Mandala/Fluid ──────────────────────────────────────────
  // Macro era 3 (reference 1:16–2:00): nested counter-rotating star-polygon mandalas with
  // a persistent diagonal waveform line, over a flat-blue backdrop that crossfades to a
  // green↔magenta marbled-fluid field. Crisp lines (cleared feedback → no smear). Decoupled
  // layers: L1 green↔magenta hue (q8) · L2 camera = mandala spin rate (q9, its own clock) ·
  // L3 flat-blue ↔ marble bg crossfade (q14) · L4 diagonal-line + orbiter fade (q17).
  P["Alchemy v2: Era — Mandala/Fluid"] = (function () {
    var huePhase = 0, lastT = 0, spin = 0;       // spin = mandala camera (gesture)
    var bgSH = makeSH(0, 1, 8, 18, 1.2), motifSH = makeSH(0.3, 1.0, 10, 22, 1.1); // stochastic decoupled layers
    var linePal = alcPalette({ base: 0.55, step: 0.10, sat: 0.3, gain: 1.8 }); // near-WHITE crisp lines (pop on any backdrop, like the reference)
    var preset = build(
      { wave_a: 0, decay: 0.5, gammaadj: 1.3, zoom: 1.0, rot: 0.0, warp: 0.0, wrap: 0, darken_center: 0.0, echo_alpha: 0 },
      {
        frame: function (t) {
          var bass = t.bass_att || t.bass || 1, mid = t.mid_att || t.mid || 1, treb = t.treb_att || t.treb || 1;
          var tm = t.time, dt = Math.min(0.1, Math.max(0, tm - lastT)); lastT = tm;
          var energy = (bass + mid + treb) / 3;
          huePhase = alcHueClock(huePhase, dt, Math.max(0, energy - 1), 0.012, 0.05); t.q8 = huePhase; // L1
          spin += dt * (0.15 + 0.25 * Math.max(0, treb - 1)); t.q9 = spin;          // L2 mandala spin (own clock)
          t.q14 = bgSH(tm, dt);                                                       // L3 flat-blue↔marble (stochastic)
          t.q17 = motifSH(tm, dt);                                                    // L4 diagonal + orb visibility (stochastic)
          t.q5 = 0.018 + 0.012 * bass; t.q6 = t.q5 * 2.1 + 0.006;                    // orb radii
          var th = tm * 0.22;
          t.q1 = 0.5 + 0.36 * Math.cos(th);            t.q2 = 0.5 + 0.36 * Math.sin(th);
          t.q3 = 0.5 + 0.36 * Math.cos(th + Math.PI);  t.q4 = 0.5 + 0.36 * Math.sin(th + Math.PI);
          return t;
        },
        warp: ALC_CLEAR_WARP,   // clear each frame → crisp mandala lines (glow comes from the comp bloom)
        comp:
          NOISE_GLSL +
          "shader_body {\n" +
          "vec2 d = uv - 0.5; d.x *= resolution.x / resolution.y;\n" +
          "float pr = length(d);\n" +
          "vec3 flatbg = vec3(0.08, 0.26, 0.60) * (1.0 - 0.45 * pr);\n" +  // RICH saturated blue backdrop (the reference is vivid, NOT muted)
          "vec2 fq = d + 0.15 * vec2(sin(time * 0.2), cos(time * 0.17));\n" +
          "float fv = fbm(fq * 3.0 + time * 0.05);\n" +
          "float rdg = abs(fract(fv * 5.0) - 0.5);\n" +
          "float ridge = smoothstep(0.05, 0.0, rdg);\n" +
          "vec3 marble = mix(vec3(0.06, 0.18, 0.10), vec3(0.26, 0.05, 0.22), 0.5 + 0.5 * sin(time * 0.06)) + ridge * vec3(0.12, 0.42, 0.22);\n" +  // luminous green↔magenta fluid + softer veins (so the white stars read on top)
          "vec3 bg = mix(flatbg, marble, clamp(q14, 0.0, 1.0));\n" +
          "vec3 g = texture2D(sampler_main, uv).rgb;\n" +
          "vec3 glow = (texture2D(sampler_blur1, uv).rgb + texture2D(sampler_blur2, uv).rgb) * 0.5;\n" +
          "vec3 outc = bg + g + glow * 0.30;\n" +
          "ret = outc / (outc + vec3(0.85));\n" +
          "}\n"
      }
    );
    // a crisp {n/step} STAR POLYGON (e.g. pentagram {5/2}) — straight edges between every
    // step-th vertex of n points → the recognizable nested-star mandala. Rotated by q9*dir.
    function starPoly(n, step, R, dir) {
      return {
        baseVals: Object.assign({}, WAVE_BASE, { enabled: 1, samples: 512, additive: 1, usedots: 0, scaling: 1, smoothing: 0.0, a: 1.0, thick: 1 }),
        init_eqs: passthrough, frame_eqs: passthrough,
        point_eqs: function (a) {
          var idx = a.sample * n;                                  // position along the n star edges
          var i0 = Math.floor(idx), fr = idx - i0;
          var phi = (a.q9 || 0) * dir;
          var a0 = ((i0 * step) % n) / n * 6.2832 + phi;           // current star vertex
          var a1 = (((i0 + 1) * step) % n) / n * 6.2832 + phi;     // next (step away)
          var x = Math.cos(a0) + fr * (Math.cos(a1) - Math.cos(a0)); // straight crisp edge between them
          var y = Math.sin(a0) + fr * (Math.sin(a1) - Math.sin(a0));
          a.x = 0.5 + R * x; a.y = 0.5 + R * y;
          linePal(a, n % 2);
          return a;
        }
      };
    }
    function diagonal() {
      return {
        baseVals: Object.assign({}, WAVE_BASE, { enabled: 1, samples: 512, additive: 1, usedots: 0, scaling: 1, smoothing: 0.03, a: 0.85, thick: 1 }),
        init_eqs: passthrough, frame_eqs: passthrough,
        point_eqs: function (a) {
          var s = a.sample, disp = (a.value1 || 0) * 0.08;
          a.x = 0.12 + s * 0.76 - disp * 0.7071; a.y = 0.12 + s * 0.76 + disp * 0.7071;  // SW→NE, perpendicular jag
          var vis = a.q17 === undefined ? 1 : a.q17;
          a.r = 0.95 * vis; a.g = 0.35 * vis; a.b = 0.85 * vis; a.a = 0.6 * vis;          // magenta line
          return a;
        }
      };
    }
    function orb(qx, qy, isRing) {
      return {
        baseVals: Object.assign({}, WAVE_BASE, { enabled: 1, samples: isRing ? 96 : 80, additive: 1, usedots: 0, scaling: 1, smoothing: 0.9, a: isRing ? 0.25 : 0.9, thick: isRing ? 0 : 1 }),
        init_eqs: passthrough, frame_eqs: passthrough,
        point_eqs: function (a) {
          var r = isRing ? (a.q6 || 0.05) : (a.q5 || 0.02), ang = a.sample * 6.2832;
          a.x = (a[qx] || 0.5) + r * Math.cos(ang); a.y = (a[qy] || 0.5) + r * Math.sin(ang);
          var vis = a.q17 === undefined ? 1 : a.q17;
          if (isRing) { a.r = 0.85 * vis; a.g = 0.92 * vis; a.b = 1.0 * vis; a.a = 0.25 * vis; }
          else { a.r = 1.0 * vis; a.g = 0.78 * vis; a.b = 0.42 * vis; a.a = 0.9 * vis; }
          return a;
        }
      };
    }
    preset.waves[0] = starPoly(12, 5, 0.34, 1);  // outer 12/5 star
    preset.waves[1] = starPoly(8, 3, 0.22, -1);  // mid 8/3 star (counter-rotating)
    preset.waves[2] = starPoly(5, 2, 0.12, 1);   // inner pentagram
    preset.waves[3] = diagonal();                // persistent diagonal waveform line
    preset.waves[4] = orb("q1", "q2", false);    // flanking orb A
    preset.waves[5] = orb("q3", "q4", false);    // flanking orb B
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
    var huePhase = 0, lastT = 0, camPhase = 0;   // camera = deliberate gesture (LFO)
    var bgSH = makeSH(0, 1, 8, 18, 1.2), motifSH = makeSH(0.3, 1.0, 10, 22, 1.0); // stochastic decoupled layers
    var flash = alcBeatFlash();
    var preset = build(
      { wave_a: 0, decay: 0.94, gammaadj: 1.5, zoom: 1.0, rot: 0.0, warp: 0.0, wrap: 0, darken_center: 0.10, echo_alpha: 0 },
      {
        frame: function (t) {
          var bass = t.bass_att || t.bass || 1, mid = t.mid_att || t.mid || 1, treb = t.treb_att || t.treb || 1;
          var rawBass = t.bass || 1;
          var tm = t.time, dt = Math.min(0.1, Math.max(0, tm - lastT)); lastT = tm;
          var energy = (bass + mid + treb) / 3, f = flash(energy, dt);
          huePhase = alcHueClock(huePhase, dt, Math.max(0, energy - 1), 0.03, 0.10); t.q8 = huePhase; // L1 vivid
          camPhase += dt / 28; t.q12 = 0.5 - 0.5 * Math.cos(camPhase * 6.2832);       // L2 plunge ramp
          t.q13 = Math.max(0, mid - 1);                                               // L2 swirl
          t.q14 = bgSH(tm, dt);                                                        // L3 dark↔bloom (stochastic)
          t.q17 = motifSH(tm, dt);                                                     // L4 orbiter visibility (stochastic)
          t.q18 = 0.16;                                  // urchin base radius
          t.q19 = 0.18 * Math.max(0, rawBass - 1) + 0.30 * f;  // explosive spoke growth: RAW bass + beat re-bloom
          t.q9 = tm * 0.06;                              // slow urchin spin
          var th = tm * 0.34;
          t.q1 = 0.5 + 0.33 * Math.cos(th);            t.q2 = 0.5 + 0.33 * Math.sin(th);
          t.q3 = 0.5 + 0.33 * Math.cos(th + Math.PI);  t.q4 = 0.5 + 0.33 * Math.sin(th + Math.PI);
          t.q5 = 0.015 + 0.012 * bass; t.q6 = t.q5 * 2.1 + 0.006; t.q7 = 0.010 + 0.035 * treb;
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
          "vec3 outc = bg + g + glow * 0.18;\n" +                            // less bloom (was a white halo)
          "ret = outc / (outc + vec3(1.1));\n" +                            // Reinhard (eased back now the fast fade prevents buildup) → colour returns
          "}\n"
      }
    );
    function urchin() {
      return {
        baseVals: Object.assign({}, WAVE_BASE, { enabled: 1, samples: 512, additive: 1, usedots: 0, scaling: 1, smoothing: 0.02, a: 0.5, thick: 0 }),
        init_eqs: passthrough, frame_eqs: passthrough,
        point_eqs: function (a) {
          var n = 64, seg = 1 / n, k = Math.floor(a.sample / seg), ff = (a.sample - k * seg) / seg;
          var ang = (k / n) * 6.2832 + (a.q9 || 0);
          var rad = ff * ((a.q18 || 0.16) + (a.q19 || 0)) + (a.value1 || 0) * 0.04 * ff;  // RAW-bass spike + waveform fur
          a.x = 0.5 + rad * Math.cos(ang); a.y = 0.5 + rad * Math.sin(ang);
          // GREEN↔MAGENTA two-tone (canonical Alchemy; NOT a rainbow). Parity-split spikes,
          // duo drifts with the q8 clock.
          var h = (k % 2 ? 0.2 : 0.65) + 0.05 * Math.sin(6.2832 * (a.q8 || 0));
          a.r = (0.5 + 0.5 * Math.cos(6.2832 * h)) * 0.5;            // dimmed so additive overlap stays COLOURED, not white
          a.g = (0.5 + 0.5 * Math.cos(6.2832 * (h + 0.33))) * 0.5;
          a.b = (0.5 + 0.5 * Math.cos(6.2832 * (h + 0.67))) * 0.5;
          return a;
        }
      };
    }
    function tether() {
      return {
        baseVals: Object.assign({}, WAVE_BASE, { enabled: 1, samples: 512, additive: 1, usedots: 0, scaling: 1, smoothing: 0.03, a: 0.5, thick: 0 }),
        init_eqs: passthrough, frame_eqs: passthrough,
        point_eqs: function (a) {
          var ax = a.q1 !== undefined ? a.q1 : 0.4, ay = a.q2 !== undefined ? a.q2 : 0.5;
          var bx = a.q3 !== undefined ? a.q3 : 0.6, by = a.q4 !== undefined ? a.q4 : 0.5;
          var dx = bx - ax, dy = by - ay, len = Math.sqrt(dx * dx + dy * dy) || 1;
          var nx = -dy / len, ny = dx / len, disp = (a.value1 || 0) * (a.q7 || 0.03);
          a.x = ax + a.sample * dx + nx * disp; a.y = ay + a.sample * dy + ny * disp;
          var vis = a.q17 === undefined ? 1 : a.q17;
          a.r = 0.7 * vis; a.g = 0.85 * vis; a.b = 1.0 * vis; a.a = 0.5 * vis;
          return a;
        }
      };
    }
    function orb(qx, qy, isRing) {
      return {
        baseVals: Object.assign({}, WAVE_BASE, { enabled: 1, samples: isRing ? 96 : 80, additive: 1, usedots: 0, scaling: 1, smoothing: 0.9, a: isRing ? 0.25 : 0.95, thick: isRing ? 0 : 1 }),
        init_eqs: passthrough, frame_eqs: passthrough,
        point_eqs: function (a) {
          var r = isRing ? (a.q6 || 0.05) : (a.q5 || 0.02), ang = a.sample * 6.2832;
          a.x = (a[qx] || 0.5) + r * Math.cos(ang); a.y = (a[qy] || 0.5) + r * Math.sin(ang);
          var vis = a.q17 === undefined ? 1 : a.q17;
          if (isRing) { a.r = 0.85 * vis; a.g = 0.92 * vis; a.b = 1.0 * vis; a.a = 0.25 * vis; }
          else { a.r = 1.0 * vis; a.g = 0.72 * vis; a.b = 0.34 * vis; a.a = 0.95 * vis; }
          return a;
        }
      };
    }
    preset.waves[0] = urchin();                  // the furry supernova urchin (primary)
    preset.waves[1] = tether();                  // tether between the orbiters
    preset.waves[2] = orb("q1", "q2", false);    // orb A core
    preset.waves[3] = orb("q3", "q4", false);    // orb B core
    preset.waves[4] = orb("q1", "q2", true);     // orb A ring
    preset.waves[5] = orb("q3", "q4", true);     // orb B ring
    return preset;
  })();


  // ── Alchemy v2: Wireframe Net ────────────────────────────────────────────────
  // Built from the ALCHEMY KIT. The woven net is FRAME FEEDBACK (docs foundation #1): a 2D
  // STAR (two waveform triangles) is redrawn each frame and its feedback TRAIL builds the
  // structure. Two scenes, SAME motifs, different CAMERA — the vocabulary-and-camera idea:
  //   • Wireframe Net  = "top" camera (trace shrinks to center) -> face-on spinning mandala.
  //   • Net Corridor   = "side" camera (trace recedes to a right VP) -> the fish-bone corridor.
  // Both add an orb (fill + bright border) whose feedback trail is the receding row of orbs.
  P["Alchemy v2: Wireframe Net"] = (function () {
    var preset = build(
      alcCamera("top"),                                  // trace shrinks to center -> face-on mandala
      { frame: alcNetFrame(function () { return [0.5, 0.5]; }, 0.955), comp: ALC_COMP }
    );
    var star = alcStarWaves(2, 0.0);                     // two waveform triangles -> hexagram
    preset.waves[0] = star[0];
    preset.waves[1] = star[1];
    preset.waves[2] = alcOrbSame(0.0);                   // mono glow core (ring same hue as fill)
    return preset;
  })();


  // ── Alchemy v2: Net Corridor ─────────────────────────────────────────────────
  // Same star + orb motifs as Wireframe Net, but the "side" camera: the head sits near the
  // camera on the LEFT and the feedback marches its trace toward a right-edge VP, so the
  // spinning-star trace reads as the horizontal fish-bone corridor and the orb leaves the
  // receding row of marching orbs (reference @0:09–0:14, side view).
  P["Alchemy v2: Net Corridor"] = (function () {
    // Head orb geometry — must match makeOrbTrailShapes constants so the tether
    // endpoints land exactly on the head rings.
    var K = 1.4, nearX = 0.14, nearYT = 0.26, nearYB = 0.54, vpx = 0.86, vpy = 0.62;

    var preset = build(
      alcCamera("side"),
      { frame: alcNetFrame(function () { return [0.42, 0.50]; }, 0.95), comp: ALC_COMP }
    );

    // Wrap frame_eqs: publish head-orb ring EDGES (not centers) to q21–q24 so the
    // tether wave spans exactly the gap between the two rings without crossing them.
    var baseFrame = preset.frame_eqs;
    preset.frame_eqs = function (t) {
      baseFrame(t);
      var raw = (t.q14 || 0) - Math.floor(t.q14 || 0);
      var proj = 1.0 / (1.0 + K * raw);
      // wobble must match makeOrbTrailShapes exactly (same raw, proj, and q19 time clock)
      var tm = t.q19 !== undefined ? t.q19 : (t.time || 0);
      var wob = 0.05 * Math.sin(raw * 6.2832 * 1.3 + tm * 0.8) * proj;
      var orbRad = 0.11 * proj * 0.65;                    // matches makeOrbTrailShapes s.rad
      t.q21 = (nearX  - vpx) * proj + vpx;               // head X (both rows same)
      t.q22 = (nearYT - vpy) * proj + vpy + wob + orbRad; // bottom edge of top orb (tracks wobble)
      t.q23 = t.q21;
      t.q24 = (nearYB - vpy) * proj + vpy + wob - orbRad; // top edge of bottom orb (tracks wobble)
      return t;
    };

    var star = alcStarWaves(2, 0.0);
    preset.waves[0] = star[0];
    preset.waves[1] = star[1];

    // Tether: single live-waveform line spanning the gap between the two head rings.
    preset.waves[2] = {
      baseVals: Object.assign({}, WAVE_BASE, {
        enabled: 1, samples: 512, additive: 1, usedots: 0, scaling: 1,
        smoothing: 0.04, a: 1.0
      }),
      init_eqs: passthrough,
      frame_eqs: passthrough,
      point_eqs: function (a) {
        var ax = a.q21 || nearX, ay = a.q22 || (nearYT + 0.07);
        var bx = a.q23 || nearX, by = a.q24 || (nearYB - 0.07);
        var dx = bx - ax, dy = by - ay;
        var len = Math.sqrt(dx * dx + dy * dy) || 0.001;
        var px = -dy / len, py = dx / len;
        // ef tapers displacement to 0 at both endpoints — line stays attached to ring edges
        var ef = sm01(Math.min(a.sample * 6, 1.0)) * sm01(Math.min((1.0 - a.sample) * 6, 1.0));
        a.x = ax + a.sample * dx + 0.12 * (a.value1 || 0) * ef * px;
        a.y = ay + a.sample * dy + 0.12 * (a.value1 || 0) * ef * py;
        a.r = 2.8; a.g = 2.8; a.b = 3.5;
        return a;
      }
    };

    preset.waves[3] = alcOrbDotTrail(2, ALC_PAL.warm);  // fine dots under each ring trail
    preset.shapes = makeOrbTrailShapes(8, 2, ALC_PAL.warm);
    return preset;
  })();


  // ── Alchemy v2: Gradient Orbs ────────────────────────────────────────────────
  // Two gradient-blob orbs (hot gold core + cyan halo) orbiting around a centered
  // feathery ring — demonstrates alcOrbGradBlob, alcOrbFeathery, alcOrbDotColumns.
  // Flat camera (near-zero feedback) so all shapes stay crisp.
  P["Alchemy v2: Gradient Orbs"] = (function () {
    var hue = 0, lastT = 0;
    var preset = build(
      alcCamera("flat"),
      { frame: function (t) {
          var bass = t.bass_att || 1, mid = t.mid_att || 1;
          var tm = t.time, dt = Math.min(0.1, Math.max(0, tm - lastT)); lastT = tm;
          hue = (hue + dt * (0.018 + 0.04 * ((bass + mid) / 2))) % 1;
          var R = 0.18 + 0.03 * Math.max(0, bass - 1);   // tighter orbit — blobs stay on screen
          var omega = 0.30;
          t.q21 = 0.5 + R * Math.cos(omega * tm);       // orb A x (shape space)
          t.q22 = 0.5 + R * Math.sin(omega * tm);       // orb A y
          t.q23 = 0.5 - R * Math.cos(omega * tm);       // orb B x
          t.q24 = 0.5 - R * Math.sin(omega * tm);       // orb B y
          t.q5  = 0.04 + 0.01 * Math.max(0, bass - 1); // feathery ring very small — subtle pulse only
          t.q7  = 0.065 + 0.02 * Math.max(0, bass - 1);// orb base radius
          t.q8  = hue;
          t.q9  = tm * 0.25;                             // feathery ring slow rotation
          return t;
        }, comp: ALC_COMP }
    );
    // waves: feathery ring at center (accent only — small radius)
    // alcOrbTarget dropped: it uses wave space while blobs use shape space → misaligned
    preset.waves[0] = alcOrbFeathery(0.5, 0.5, ALC_PAL.spread);
    // shapes: two gradient blob orbs + dot column accents
    var blobA = alcOrbGradBlob("q21", "q22", ALC_PAL.mono);
    var blobB = alcOrbGradBlob("q23", "q24", ALC_PAL.mono);
    preset.shapes = blobA.concat(blobB).concat(alcOrbDotColumns(2, ALC_PAL.twoTone));
    return preset;
  })();


  // ── Alchemy v2: Bullseye Orbiters ───────────────────────────────────────────
  // Reference: screenshot 2026-06-13 at 5.20.10 PM — two bullseye (concentric-ring) orbs
  // on a diagonal axis joined by a dense golden waveform tether; warm purple smear background.
  // alcOrbTarget: 2 concentric rings per orb; alcTether: live audio waveform connection.
  // High decay (0.93) + slight zoom gives the long comet smear trail on the rings.
  P["Alchemy v2: Bullseye Orbiters"] = (function () {
    var hue = 0, lastT = 0;
    var COMP = "shader_body {\n" +
      "  vec2 d = uv - vec2(0.5);\n" +
      "  d.x *= resolution.x / resolution.y;\n" +
      "  float r = length(d);\n" +
      // warm purple/mauve: hue drifts slowly, vignette toward center
      "  vec3 bg = vec3(0.32 + 0.06*sin(time*0.07), 0.10, 0.42 + 0.06*cos(time*0.09));\n" +
      "  bg *= (1.0 - 0.55*r*r);\n" +
      "  vec3 c = texture2D(sampler_main, uv).rgb;\n" +
      // Reinhard tone-map so additive orb rings glow warm not blow white
      "  ret = (c + bg * 0.18) / (c + bg * 0.18 + 0.55);\n" +
      "}\n";

    var preset = build(
      {
        wave_a: 0, decay: 0.93, gammaadj: 1.35,
        zoom: 0.997,            // slight inward drift — trails compact but not pulled to center
        rot: 0.0, warp: 0.0, wrap: 0, darken_center: 0, echo_alpha: 0
      },
      {
        frame: function (t) {
          var bass = t.bass_att || 1, treb = t.treb_att || 1;
          var tm = t.time, dt = Math.min(0.1, Math.max(0, tm - lastT)); lastT = tm;
          hue = (hue + dt * (0.015 + 0.04 * bass)) % 1;

          // Two orbs on opposite ends of a slowly-rotating diagonal axis
          var R = 0.34 + 0.04 * Math.max(0, bass - 1);
          var ang = tm * 0.18;                           // slow orbital precession
          t.q21 = 0.5 + R * Math.cos(ang);              // orb A x
          t.q22 = 0.5 + R * Math.sin(ang);              // orb A y
          t.q23 = 0.5 - R * Math.cos(ang);              // orb B x (antipodal)
          t.q24 = 0.5 - R * Math.sin(ang);              // orb B y
          t.q7  = 0.07 + 0.02 * Math.max(0, bass - 1); // ring radius
          t.q8  = hue;
          t.q26 = 0.04 + 0.05 * Math.max(0, treb - 1); // tether jaggedness (treble-driven)
          return t;
        },
        comp: COMP
      }
    );

    // waves: bullseye at each orb + waveform tether
    preset.waves[0] = alcOrbTarget("q21", "q22", 2, ALC_PAL.warm);   // orb A: 2 concentric rings
    preset.waves[1] = alcOrbTarget("q23", "q24", 2, ALC_PAL.warm);   // orb B: 2 concentric rings
    preset.waves[2] = alcTether("q21", "q22", "q23", "q24", "q26",   // golden waveform tether
      function (a, i) { ALC_PAL.warm(a, 0); a.r = Math.min(1.5, a.r * 1.4); a.g = Math.min(1.5, a.g * 1.3); });
    return preset;
  })();


  // ── Alchemy v2: Marble ───────────────────────────────────────────────────────
  // BG4 showcase: the green<->magenta domain-warped "marble / aurora" field (section
  // E-late of the reference) — fbm with bright iso-contour ridges swirling in place,
  // plus the faint static dither (BG10). Two bullseye orbs on a slow antipodal orbit
  // joined by a live-waveform tether sit over it (orbs-over-marble, per the frames).
  // This is a CALM "rest" scene — muted, near-zero feedback so the marble stays crisp.
  P["Alchemy v2: Marble"] = (function () {
    var hue = 0, lastT = 0;
    var preset = build(
      {
        wave_a: 0, decay: 0.90, gammaadj: 1.35,
        zoom: 1.0, rot: 0.006,        // tiny global swirl; the marble swirl is in-shader
        warp: 0.0, wrap: 0, darken_center: 0, echo_alpha: 0
      },
      {
        frame: function (t) {
          var bass = t.bass_att || 1, mid = t.mid_att || 1, treb = t.treb_att || 1;
          var tm = t.time, dt = Math.min(0.1, Math.max(0, tm - lastT)); lastT = tm;
          hue = (hue + dt * (0.015 + 0.03 * ((bass + mid) / 2))) % 1;

          var R = 0.30 + 0.03 * Math.max(0, bass - 1);  // slow antipodal orbit
          var ang = tm * 0.16;
          t.q21 = 0.5 + R * Math.cos(ang);              // orb A
          t.q22 = 0.5 + R * Math.sin(ang);
          t.q23 = 0.5 - R * Math.cos(ang);              // orb B (antipodal)
          t.q24 = 0.5 - R * Math.sin(ang);
          t.q7  = 0.05 + 0.02 * Math.max(0, bass - 1);  // bullseye ring radius
          t.q8  = hue;
          t.q26 = 0.03 + 0.05 * Math.max(0, treb - 1);  // tether jaggedness (treble)
          return t;
        },
        // BG4 marble + crisp geometry + soft bloom + Reinhard tone-map + BG10 hatch.
        comp:
          NOISE_GLSL + ALC_MARBLE_GLSL +
          "shader_body {\n" +
          "vec2 d = uv - 0.5; d.x *= resolution.x / resolution.y;\n" +
          "vec3 bg = alcMarble(d, time, bass, vec3(0.16,0.40,0.27), vec3(0.42,0.24,0.46), vec3(0.45,0.85,0.55));\n" +  // green<->magenta + lime veins
          "vec3 sharp = texture2D(sampler_main, uv).rgb;\n" +
          "vec3 glow = (texture2D(sampler_blur1, uv).rgb + texture2D(sampler_blur2, uv).rgb) * 0.5;\n" +
          "vec3 outc = bg + sharp + glow * 0.28;\n" +
          "ret = outc / (outc + vec3(0.80));\n" +        // Reinhard: muted, no white-out
          ALC_HATCH +
          "}\n"
      }
    );
    // orbs-over-marble: two bullseye orbs joined by a live-waveform tether (green<->magenta).
    preset.waves[0] = alcOrbTarget("q21", "q22", 2, ALC_PAL.roseGreen);
    preset.waves[1] = alcOrbTarget("q23", "q24", 2, ALC_PAL.roseGreen);
    preset.waves[2] = alcTether("q21", "q22", "q23", "q24", "q26", ALC_PAL.roseGreen);
    return preset;
  })();


  // ── Alchemy v2: Net Tunnel ─────────────────────────────────────────────────────
  // BG8, REBUILT from the user's frames of the original (section G, ~2:16): the net is a
  // dense FAN/SHEAF of hundreds of FINE lines all crossing at center — produced by 1-2
  // diameter-lines through center rotating SLOWLY with a very LONG persistence trail
  // (decay≈0.985), so each frame's line position lingers and the slow sweep accumulates
  // into the fan; lines all pass through center so they pile up there (the focus) and
  // spread to the edges. A gentle inward zoom gives slight depth + the off-center dark
  // pupil. Over the top: the two antipodal gold bullseye ORBITERS joined by a tether
  // (the gold orbs at upper-left / lower-right in the reference). NOT fast spin (=coarse
  // spokes), NOT a drawn shader. Same family as Dance / Waveform Sheet.
  P["Alchemy v2: Net Tunnel"] = (function () {
    var hue = 0, lastT = 0, lastStamp = 0;
    var preset = build(
      {
        // NOTE: `decay` is IGNORED in this Butterchurn build — the fade is the WARP shader
        // below (a fast multiplicative fade), NOT this value. See WARP_DEFAULT gotcha in CLAUDE.md.
        wave_a: 0, gammaadj: 1.5, zoom: 1.0, rot: 0.0, warp: 0.0, wrap: 0, darken_center: 0, echo_alpha: 0
      },
      {
        frame: function (t) {
          var bass = t.bass_att || 1, treb = t.treb_att || 1;
          var tm = t.time, dt = Math.min(0.1, Math.max(0, tm - lastT)); lastT = tm;
          hue = (hue + dt * (0.03 + 0.05 * bass)) % 1;   // hue still drifts with music; rotation does NOT
          t.q1 = tm * 3.4;                               // CONSTANT spin (~0.5 rev/s) — NOT audio-driven, per user
          t.q8 = hue;
          // STROBE: stamp a spoke ~every 0.03s -> denser discrete spokes (still gaps between them).
          if (tm - lastStamp >= 0.03) { t.q15 = 1; lastStamp = tm; } else { t.q15 = 0; }
          // two antipodal gold orbiters (the "worms"): the fade warp leaves a short bead trail
          // along their slow orbit -> the gold-worm look from the original. Joined by a tether.
          var R = 0.34 + 0.03 * Math.max(0, bass - 1);
          var oa = tm * 0.18;
          t.q21 = 0.5 + R * Math.cos(oa); t.q22 = 0.5 + R * Math.sin(oa);
          t.q23 = 0.5 - R * Math.cos(oa); t.q24 = 0.5 - R * Math.sin(oa);
          t.q7  = 0.03 + 0.015 * Math.max(0, bass - 1);  // orbiter head radius (small)
          t.q26 = 0.03 + 0.05 * Math.max(0, treb - 1);   // tether jaggedness (treble)
          return t;
        },
        // FADE is here (decay baseVal does nothing in this build): multiplicative fade in place
        // (no movement — we sample uv directly). 0.91/frame -> a stamped spoke is ~gone in ~0.8s,
        // just UNDER one rotation period (~0.9s) -> the oldest spokes vanish before the line laps
        // back, so a FULL CIRCLE never accumulates (per user). Much faster than the old `ret-=0.004`.
        warp: "shader_body {\nret = texture2D(sampler_main, uv).rgb * 0.91;\n}\n",
        // Composition: aurora color-bleed motif (UNDER) + the line tunnel (sampler_main) + bloom.
        comp:
          NOISE_GLSL + PAL_GLSL + ALC_AURORA_GLSL +
          "shader_body {\n" +
          "vec2 d = uv - 0.5; d.x *= resolution.x / resolution.y;\n" +
          "float pr = length(d);\n" +
          "vec3 aur = alcAurora(d, time, bass) * smoothstep(0.05, 0.7, pr) * 0.6;\n" +  // color bleed, stronger toward edges
          "vec3 g = texture2D(sampler_main, uv).rgb;\n" +
          "vec3 glow = (texture2D(sampler_blur1, uv).rgb + texture2D(sampler_blur2, uv).rgb) * 0.5;\n" +
          "vec3 outc = aur + g + glow * 0.35;\n" +
          "outc += vec3(1.0, 0.55, 0.45) * exp(-pr * pr * 80.0) * 0.15;\n" +   // warm center focus
          "vec2 pe = d - vec2(0.12, -0.03);\n" +
          "outc *= 1.0 - 0.55 * exp(-dot(pe,pe) * 120.0);\n" +                 // off-center dark hole (the teardrop pupil)
          "float vig = smoothstep(1.25, 0.2, pr);\n" +
          "outc = outc * vig;\n" +
          "ret = outc / (outc + vec3(0.85));\n" +                              // Reinhard tone-map
          "}\n"
      }
    );
    // Compose the reusable BG8 fan motif (rotating diameter-lines). The scene drives q1/q8
    // and supplies the feedback camera above; alcRotLines is the drop-in seed primitive.
    // ONE thick plain (no-waveform) line. Thickness = 3 TIGHT parallel copies (gap 0.0012)
    // that MERGE into a single fat stroke (not 3 separate lines — that earlier bug used 5x the
    // gap). Strobed -> discrete spokes; the warp fade clears them within a rotation (no full circle).
    var lines = alcRotLines(3, { parallel: true, gap: 0.0012, len: 0.70, jiggle: 0, sat: 0.6, alpha: 0.95, thick: 1, strobeVar: "q15" });
    preset.waves[0] = lines[0];
    preset.waves[1] = lines[1];
    preset.waves[2] = lines[2];
    // two gold orbiter "worms" + tether (6 waves total = the reliable cap). The fade warp
    // leaves each a short bead trail along its orbit -> the gold worms in the original.
    preset.waves[3] = alcOrbiterNode("q21", "q22", "q7", ALC_PAL.warm);
    preset.waves[4] = alcOrbiterNode("q23", "q24", "q7", ALC_PAL.warm);
    preset.waves[5] = alcTether("q21", "q22", "q23", "q24", "q26", ALC_PAL.warm);
    return preset;
  })();


  // ── Alchemy v2: Fountain ───────────────────────────────────────────────────────
  // BG7 (outward half): the radial filament FOUNTAIN / pinwheel (section D1, 0:58-1:06).
  // A fine live-waveform burst near center is STREAMED OUTWARD + swirled by the feedback
  // warp (sample-scale < 1 blooms content outward; a twist makes the pinwheel), so the
  // spikes smear into hundreds of fine curved filaments radiating from a hot nucleus.
  // Vivid magenta/lime/cyan (a documented muting-rule exception). The INWARD complement
  // (gravitational vortex / supernova collapse) is the existing 'Alchemy v2: Vortex'.
  P["Alchemy v2: Fountain"] = (function () {
    var huePhase = 0, lastT = 0;
    var preset = build(
      {
        wave_a: 0, decay: 0.97, gammaadj: 1.35,   // long smear -> streaming filaments
        zoom: 1.0, rot: 0.0, warp: 0.0, wrap: 0,
        darken_center: 0,                          // center is the BRIGHT source (opposite of Vortex's pupil)
        echo_alpha: 0
      },
      {
        frame: function (t) {
          var bass = t.bass_att || t.bass || 1, mid = t.mid_att || t.mid || 1, treb = t.treb_att || t.treb || 1;
          var tm = t.time, dt = Math.min(0.1, Math.max(0, tm - lastT)); lastT = tm;
          huePhase = (huePhase + dt * (0.03 + 0.06 * ((bass + mid + treb) / 3))) % 1;
          t.q8  = huePhase;
          t.q9  = 0.035 + 0.03 * bass;              // burst base radius (strands start near center)
          t.q10 = 0.05 + 0.07 * mid;                // filament length (waveform amplitude)
          return t;
        },
        // FEEDBACK = the fountain: swirl + bloom OUTWARD. Sampling the previous frame from a
        // coord scaled TOWARD center (sc<1) makes its content expand outward each frame; the
        // rotation curves the streams into a pinwheel. mid speeds the spin; bass spreads faster.
        warp:
          "shader_body {\n" +
          "vec2 c = uv - 0.5;\n" +
          "float tw = 0.022 + 0.030 * mid;\n" +                 // swirl
          "float sc = 0.972 - 0.012 * bass;\n" +                // <1 -> stream OUTWARD; bass widens
          "float s = sin(tw), co = cos(tw);\n" +
          "vec2 sd = vec2(c.x * co - c.y * s, c.x * s + c.y * co) * sc + 0.5;\n" +
          "ret = texture2D(sampler_main, sd).rgb;\n" +
          "ret -= 0.003;\n" +                                   // slow fade -> long fountain trails
          "}\n",
        comp:
          NOISE_GLSL +
          "shader_body {\n" +
          "vec2 d = uv - 0.5; d.x *= resolution.x / resolution.y;\n" +
          "float pr = length(d);\n" +
          "float n = fbm(uv * 2.2 + vec2(time * 0.03, -time * 0.02));\n" +
          "vec3 haze = mix(vec3(0.06, 0.02, 0.09), vec3(0.02, 0.09, 0.10), n);\n" +  // dusty purple <-> teal
          "haze *= (1.0 - smoothstep(0.15, 1.0, pr)) * (0.5 + 0.4 * bass);\n" +       // soft, fades to edge
          "vec3 g = texture2D(sampler_main, uv).rgb;\n" +
          "vec3 glow = (texture2D(sampler_blur1, uv).rgb + texture2D(sampler_blur2, uv).rgb) * 0.5;\n" +
          "vec3 outc = haze + g + glow * 0.35;\n" +
          "outc += vec3(1.0, 0.85, 0.55) * exp(-pr * pr * 90.0) * (0.25 + 0.5 * bass);\n" +  // hot gold nucleus
          "ret = outc / (outc + vec3(0.82));\n" +                // Reinhard tone-map
          "}\n"
      }
    );

    // Compose the reusable radial-burst motif (two decorrelated copies for filament density).
    // The feedback warp above streams these spikes outward into the fountain.
    preset.waves[0] = alcRadialBurst({ useSecond: false, hueOff: 0.0, sat: 1.0 });
    preset.waves[1] = alcRadialBurst({ useSecond: true, hueOff: 0.33, sat: 1.0 });
    return preset;
  })();


  // ── Alchemy v2: Waveform Sheet ───────────────────────────────────────────────
  // The SINGLE-LINE motif: ONE live-waveform line (alcRayWaves with n=1), slowly rotating,
  // over the spindle camera so its feedback trace spreads into a single rippling sheet seen
  // from a side angle (the "single waveform line leaving a trace" look). One line, not a fan.
  P["Alchemy v2: Waveform Sheet"] = (function () {
    var preset = build(
      alcCamera("side"),                                 // fly INTO corridor (zoom>1), VP anchored right
      { frame: alcNetFrame(function () { return [0.42, 0.50]; }, 0.95), comp: ALC_COMP }
    );
    var ray = alcRayWaves(1, 0.0, 2.6);                  // ONE long waveform line
    preset.waves[0] = ray[0];
    preset.waves[1] = alcOrbRow(1, 0.0, 0.5, 0.12, 0.50, 0.90, 0.50);  // ONE ring orb
    return preset;
  })();


  // ── Alchemy v2: Ray Burst ────────────────────────────────────────────────────
  // Demonstrates the RAY motif: 5 live-waveform lines through the center, rotating around
  // the axis (q9), over the "top" camera so their feedback trail blooms into a spinning
  // asterisk/net burst with an orb core. Same kit, different motif.
  P["Alchemy v2: Ray Burst"] = (function () {
    var preset = build(
      alcCamera("top"),
      { frame: alcNetFrame(function () { return [0.5, 0.5]; }, 0.955), comp: ALC_COMP }
    );
    var rays = alcRayWaves(5, 0.0, 3.0);                 // 5 rotating waveform lines, LONG (span the screen)
    preset.waves[0] = rays[0];
    preset.waves[1] = rays[1];
    preset.waves[2] = rays[2];
    preset.waves[3] = rays[3];
    preset.waves[4] = rays[4];
    preset.waves[5] = alcOrbWhite(0.0);                  // orb core, white ring (6 waves total — at the cap)
    return preset;
  })();


  // ── Alchemy v2: N-gon Proof ──────────────────────────────────────────────────
  // STEP 1–2 of the N-gon build (docs/alchemy-v2/ngon-spec.md): prove ONE configurable
  // polygon on screen before scaling to the nested mandala. A single diamond (N=4), stretched
  // horizontally (aspectX 1.7 -> the reference ellipse), slowly spinning, BREATHING with bass
  // (collapses small when quiet, blooms wide when loud), jagged edges from the live waveform,
  // over a FLAT-BLUE background (the muted Alchemy mandala bg) with crisp short-decay feedback.
  P["Alchemy v2: N-gon Proof"] = (function () {
    var preset = build(
      // NEAR-ZERO feedback: draw the polygon CRISP every frame (glow comes from the comp bloom,
      // NOT from feedback). A rotating shape under any real decay smears its echoes into a
      // receding-diamond tunnel (the "feedback = structure" trap, learning #1) — so decay is tiny
      // and zoom is exactly 1.0 (no tunnel) and the center isn't darkened.
      { wave_a: 0, gammaadj: 1.3, decay: 0.30, zoom: 1.0, cx: 0.5, cy: 0.5, dx: 0.0, dy: 0.0, rot: 0.0, warp: 0.0, wrap: 0, darken_center: 0, echo_alpha: 0 },
      {
        frame: function (t) {
          var bass = t.bass_att || t.bass || 1, treb = t.treb_att || t.treb || 1;
          var bn = Math.max(0, Math.min(bass - 1, 1));
          t.q2 = 0.5; t.q3 = 0.5;
          t.q5 = 0.3 + 0.7 * bn;                          // breathing: collapse when quiet, bloom on bass
          t.q6 = 0.02 + 0.035 * Math.min(treb, 2.0);      // edge jaggedness (live waveform) — light, so the 4 edges read
          t.q8 = (t.time * 0.05) % 1;                     // slow hue drift
          t.q9 = t.time * 0.9;                            // slow self-rotation (rad)
          return t;
        },
        warp: ALC_CLEAR_WARP,
        comp: ALC_FLATBLUE_COMP
      }
    );
    preset.waves[0] = alcNgon({ sides: 4, radius: 0.28, aspectX: 1.7, dir: 1, hueOff: 0.0 });
    return preset;
  })();


  // ── Alchemy v2: Mandala ──────────────────────────────────────────────────────
  // STEP 4 of the N-gon build: the nested star-polygon mandala (ref 1:14–1:28). A STACK of 6
  // counter-rotating N-gons (diamond/hexagon/octagon + 5- & 8-point stars + 12-gon) sharing a
  // horizontal-ellipse envelope (aspectX 1.7) over flat blue, drawn crisp each frame. BREATHES
  // with bass (collapses toward nothing on quiet bars, blooms wide on loud) and the edges are
  // jagged by the live waveform. The two bright "eye" nodes at L/R emerge from the stretch.
  // (Step 5 will add the persistent diagonal waveform line — dropping to 5 polygons to stay
  // within the ~6-wave cap.)
  P["Alchemy v2: Mandala"] = (function () {
    var preset = build(
      { wave_a: 0, gammaadj: 1.3, decay: 0.30, zoom: 1.0, cx: 0.5, cy: 0.5, dx: 0.0, dy: 0.0, rot: 0.0, warp: 0.0, wrap: 0, darken_center: 0, echo_alpha: 0 },
      { frame: alcMandalaFrame(), warp: ALC_CLEAR_WARP, comp: ALC_FLATBLUE_COMP }
    );
    // Diagonal at index 0 (drawn FIRST) so it can't be the silently-dropped last wave; mandala follows.
    // corner-to-corner so its ends stick out BEYOND the net (reads as a separate slash, not a net chord).
    preset.waves[0] = alcDiagonalLine(0.62, 0.85, 0.10, 1.0, 0.85, 0.95);  // persistent BOLD jagged pink-white diagonal
    var stack = alcNgonStack(1.7, ALC_MANDALA_SPECS, 3);  // 12 polygons packed 3/wave -> 4 waves
    for (var i = 0; i < stack.length; i++) preset.waves[i + 1] = stack[i];  // mandala at indices 1..4 (5 waves total)
    return preset;
  })();

  // ── Alchemy v2: Nested Mandala ───────────────────────────────────────────────
  // CONCENTRIC nested polygon rings: each ring a convex N-gon (skip=1) at a different radius,
  // stacked from outer (16-gon) to inner (triangle), counter-rotating. Unlike the spirograph
  // Mandala (crossing-chord star-polygons at the same radius), this reads as a TARGET/ROSETTE
  // — each ring's shape is clearly distinct, the center is the focal point (not L/R eye-nodes).
  // A few {N/skip} star overlays add crossing-chord depth within the outer rings. Circular
  // (aspectX=1), centered glow comp.
  var ALC_NESTED_SPECS = [
    // Outer concentric ring envelopes — tier 0, always on, packed into wave 0 first
    { sides: 16, skip: 1, radius: 0.38, dir:  1.0, rotate: 0.00, hueOff: 0.00, tier: 0 },
    { sides: 12, skip: 1, radius: 0.31, dir: -0.9, rotate: 0.13, hueOff: 0.10, tier: 0 },
    { sides: 10, skip: 1, radius: 0.25, dir:  1.1, rotate: 0.25, hueOff: 0.20, tier: 0 },
    // Star overlays at outer/mid radius — crossing chords add depth to the outer ring layer
    { sides: 12, skip: 5, radius: 0.36, dir:  0.7, rotate: 0.08, hueOff: 0.55, tier: 1 },
    { sides: 8,  skip: 3, radius: 0.26, dir: -0.6, rotate: 0.00, hueOff: 0.65, tier: 1 },
    { sides: 8,  skip: 1, radius: 0.20, dir: -1.0, rotate: 0.00, hueOff: 0.33, tier: 1 },
    // Mid/inner concentric rings
    { sides: 7,  skip: 1, radius: 0.15, dir:  1.2, rotate: 0.20, hueOff: 0.44, tier: 1 },
    { sides: 6,  skip: 1, radius: 0.11, dir: -0.8, rotate: 0.00, hueOff: 0.70, tier: 2 },
    { sides: 5,  skip: 1, radius: 0.08, dir:  0.9, rotate: 0.10, hueOff: 0.80, tier: 2 },
    // Inner star overlays
    { sides: 6,  skip: 2, radius: 0.13, dir: -1.1, rotate: 0.05, hueOff: 0.26, tier: 2 },
    { sides: 5,  skip: 2, radius: 0.09, dir:  0.8, rotate: 0.00, hueOff: 0.87, tier: 2 },
    // Tiny central anchor — a square/diamond at the center
    { sides: 4,  skip: 1, radius: 0.05, dir: -1.0, rotate: 0.00, hueOff: 0.15, tier: 2 }
  ];
  // Comp for the Nested Mandala: flat-blue bg + soft radial core glow (pulsing on bass — the center
  // is the focal point of this scene, not the L/R eyes) + Reinhard tone-map.
  var ALC_NESTED_COMP =
    "shader_body {\n" +
    "vec2 d = uv - 0.5; d.x *= resolution.x / resolution.y;\n" +
    "float pr = length(d);\n" +
    "vec3 g = texture2D(sampler_main, uv).rgb;\n" +
    "vec3 bloom = (texture2D(sampler_blur1, uv).rgb + texture2D(sampler_blur2, uv).rgb) * 0.5;\n" +
    "vec3 bg = vec3(0.08, 0.18, 0.32);\n" +              // slightly deeper blue than the spirograph Mandala
    "float core = exp(-pr * pr * 18.0);\n" +             // tight gaussian at center
    "vec3 coreCol = vec3(0.18, 0.35, 0.60) * core * (0.5 + 0.8 * bass);\n" + // muted blue-teal core glow, bass-driven
    "vec3 outc = bg + g + bloom * 0.18 + coreCol;\n" +
    "ret = outc / (outc + vec3(0.85));\n" +              // Reinhard — muted, never blows to white
    "}\n";

  P["Alchemy v2: Nested Mandala"] = (function () {
    var preset = build(
      { wave_a: 0, gammaadj: 1.3, decay: 0.30, zoom: 1.0, cx: 0.5, cy: 0.5, dx: 0.0, dy: 0.0, rot: 0.0, warp: 0.0, wrap: 0, darken_center: 0, echo_alpha: 0 },
      { frame: alcMandalaFrame(), warp: ALC_CLEAR_WARP, comp: ALC_NESTED_COMP }
    );
    // 12 specs packed 3/wave -> 4 waves (well under cap). Tier-0 specs are FIRST so wave 0
    // always has the outer ring envelopes (gracefully degrades if the last wave drops).
    var stack = alcNgonStack(1.0, ALC_NESTED_SPECS, 3);  // aspectX=1.0 -> circular (rosette not ellipse)
    for (var i = 0; i < stack.length; i++) preset.waves[i] = stack[i];
    return preset;
  })();


  // ── Alchemy v2: Anemone ──────────────────────────────────────────────────────
  // A rosette of a FEW (6) rotated COLORED waveform triangles (kit Motif C, corridor technique)
  // on the low-feedback "flat" camera: distinct colored jagged triangle lines, NON-additive so
  // they never blow to white, over a soft COLORED CORE that fills the center (not a black hole)
  // and pulses on bass. PULSES size on bass (q5), spins (q9), shears to a vortex on peaks (q10).
  // Reference @0:52–1:06 (Anemone Pulsar). Composable like the other kit scenes.
  P["Alchemy v2: Anemone"] = (function () {
    var hue = 0, lastT = 0, spin = 0;
    // Custom comp: fills the central triangle-hole with a soft dusty-magenta CORE glow (pulses
    // on bass) so the middle isn't black, plus a mild bloom around the colored lines, tone-mapped.
    var ANEMONE_COMP =
      "shader_body {\n" +
      "vec2 d = uv - 0.5; d.x *= resolution.x / resolution.y;\n" +
      "float pr = length(d);\n" +
      "vec3 g = texture2D(sampler_main, uv).rgb;\n" +
      "vec3 bloom = (texture2D(sampler_blur1, uv).rgb + texture2D(sampler_blur2, uv).rgb) * 0.5;\n" +
      "float core = exp(-pr * pr * 16.0);\n" +                    // soft gaussian, brightest at center
      "vec3 coreCol = vec3(0.55, 0.18, 0.42) * core * (0.75 + 0.55 * bass);\n" + // dusty magenta center fill
      "vec3 outc = g + bloom * 0.12 + coreCol;\n" +
      "ret = outc / (outc + vec3(0.85));\n" +                     // Reinhard tone-map -> muted, no white-out
      "}\n";
    var preset = build(
      // flat camera, moderate decay (0.5): anemone lines redrawn crisp each frame; the soft
      // radial bleed + the comp core/bloom give the glow.
      Object.assign({}, alcCamera("flat"), { decay: 0.5 }),
      {
        frame: function (t) {
          var bass = t.bass_att || t.bass || 1, mid = t.mid_att || t.mid || 1, treb = t.treb_att || t.treb || 1;
          var tm = t.time, dt = Math.min(0.1, Math.max(0, tm - lastT)); lastT = tm;
          var bn = Math.max(0, Math.min(bass - 1, 1));
          hue = (hue + dt * (0.02 + 0.04 * bn)) % 1;
          // ROTATION LINKED TO INTENSITY: slow drift when quiet, whips around on the beat.
          spin = spin + dt * (0.5 + 4.0 * bn);                   // anemone self-spin (bass-driven)
          t.q2 = 0.5; t.q3 = 0.5;
          t.q5 = 0.40 + 0.10 * bn;                               // PULSAR pulse: starburst radius (big -> fills screen)
          t.q6 = 0.02 + 0.04 * Math.min(mid + 0.5 * treb, 2.0);  // edge jaggedness (live waveform on the triangle sides)
          t.q8 = hue;                                            // two-tone hue drift
          t.q9 = spin;                                           // rotation
          // vortex: 0 at rest; shears the spikes into a swirl on STRONG bass (>~1.2)
          t.q10 = 0.8 * Math.max(0, Math.min((bass - 1.2) / 0.6, 1));
          return t;
        },
        comp: ANEMONE_COMP
      }
    );
    preset.waves[0] = alcAnemone(30, ALC_PAL.roseGreen);         // 30 overlapping ~24° waveform triangles; green↔magenta palette
    // NOTE: orbiter pair + tether (alcTether / alcOrbiterNode, driven by q21..q26) are DEFERRED —
    // they smeared under feedback on this scene. The kit elements remain for a low-feedback host.
    return preset;
  })();


  // ── Alchemy v2: Anemone (Petals) ─────────────────────────────────────────────
  // Same base-on-a-circle starburst as Anemone, but SMOOTH edges (q6=0), a SLOW spin and a
  // longer color-bleed feedback (decay 0.82) -> the clean overlapping-petal "dahlia" look
  // (crisp twin-tone petals washing color into the background) rather than the frizzy fast one.
  P["Alchemy v2: Anemone (Petals)"] = (function () {
    var hue = 0, lastT = 0, spin = 0;
    var ANEMONE_COMP =
      "shader_body {\n" +
      "vec2 d = uv - 0.5; d.x *= resolution.x / resolution.y;\n" +
      "float pr = length(d);\n" +
      "vec3 g = texture2D(sampler_main, uv).rgb;\n" +
      "vec3 bloom = (texture2D(sampler_blur1, uv).rgb + texture2D(sampler_blur2, uv).rgb) * 0.5;\n" +
      "float core = exp(-pr * pr * 16.0);\n" +
      "vec3 coreCol = vec3(0.55, 0.18, 0.42) * core * (0.75 + 0.55 * bass);\n" +
      "vec3 outc = g + bloom * 0.16 + coreCol;\n" +
      "ret = outc / (outc + vec3(0.85));\n" +
      "}\n";
    var preset = build(
      Object.assign({}, alcCamera("flat"), { decay: 0.82 }),   // long bleed -> petals wash color into the bg
      {
        frame: function (t) {
          var bass = t.bass_att || t.bass || 1;
          var tm = t.time, dt = Math.min(0.1, Math.max(0, tm - lastT)); lastT = tm;
          var bn = Math.max(0, Math.min(bass - 1, 1));
          hue = (hue + dt * (0.02 + 0.04 * bn)) % 1;
          spin = spin + dt * (0.10 + 0.18 * bn);                 // SLOW spin (clean, coherent petals)
          t.q2 = 0.5; t.q3 = 0.5;
          t.q5 = 0.40 + 0.10 * bn;                               // pulse size on bass
          t.q6 = 0;                                              // SMOOTH edges (no waveform frizz) -> clean petals
          t.q8 = hue;
          t.q9 = spin;
          t.q10 = 0.6 * Math.max(0, Math.min((bass - 1.2) / 0.6, 1));
          return t;
        },
        comp: ANEMONE_COMP
      }
    );
    // Palette picked from the kit: redCyan (two-tone). Swap to ALC_PAL.mono for a single colour,
    // or ALC_PAL.spread for multicolour — colour is a scene CONFIG, not baked into the motif.
    preset.waves[0] = alcAnemone(30, ALC_PAL.redCyan);           // clean overlapping ~24° petals (smooth)
    return preset;
  })();


  // ── Alchemy v2: Anemone (Mandala) ────────────────────────────────────────────
  // The SECOND construction: full EQUILATERAL triangles overlapping at their shared CENTER,
  // each rotated by a small tilt -> a spinning star-polygon mandala with a dark center hole.
  // Same kit feel (flat camera, colored non-additive outlines, waveform-jagged edges, color
  // bleed to bg), different geometry from the base-on-a-circle Anemone.
  P["Alchemy v2: Anemone (Mandala)"] = (function () {
    var hue = 0, lastT = 0, spin = 0;
    var ANEMONE_COMP =
      "shader_body {\n" +
      "vec2 d = uv - 0.5; d.x *= resolution.x / resolution.y;\n" +
      "float pr = length(d);\n" +
      "vec3 g = texture2D(sampler_main, uv).rgb;\n" +
      "vec3 bloom = (texture2D(sampler_blur1, uv).rgb + texture2D(sampler_blur2, uv).rgb) * 0.5;\n" +
      "float core = exp(-pr * pr * 16.0);\n" +
      "vec3 coreCol = vec3(0.30, 0.20, 0.52) * core * (0.75 + 0.55 * bass);\n" + // dusty indigo center
      "vec3 outc = g + bloom * 0.16 + coreCol;\n" +
      "ret = outc / (outc + vec3(0.85));\n" +
      "}\n";
    var preset = build(
      Object.assign({}, alcCamera("flat"), { decay: 0.5 }),
      {
        frame: function (t) {
          var bass = t.bass_att || t.bass || 1, mid = t.mid_att || t.mid || 1, treb = t.treb_att || t.treb || 1;
          var tm = t.time, dt = Math.min(0.1, Math.max(0, tm - lastT)); lastT = tm;
          var bn = Math.max(0, Math.min(bass - 1, 1));
          hue = (hue + dt * (0.02 + 0.04 * bn)) % 1;
          spin = spin + dt * (0.85 + 1.1 * bn);                  // FAST rotation
          t.q2 = 0.5; t.q3 = 0.5;
          t.q5 = 0.40 + 0.10 * bn;                               // mandala radius (fills screen)
          t.q6 = 0.03 + 0.05 * Math.min(mid + 0.5 * treb, 2.0);  // edge jaggedness (live waveform on the triangle edges)
          t.q8 = hue;                                            // two-tone hue drift
          t.q9 = spin;
          t.q10 = 0.8 * Math.max(0, Math.min((bass - 1.2) / 0.6, 1)); // vortex shear on peaks
          return t;
        },
        comp: ANEMONE_COMP
      }
    );
    preset.waves[0] = alcTriMandala(9, ALC_PAL.twoTone);         // 9 overlapping equilateral triangles, two-tone palette, shared center
    return preset;
  })();


  // ── Alchemy v2: Spindle ──────────────────────────────────────────────────────
  // The RING URCHIN / radial pulsar motif (kitified from the Anemone Pulsar's local anemone()):
  // 512 samples sweep the full circle, radius = eye + spike*abs(waveform) → bristles protrude
  // wherever the live audio has energy. On loud bass the spikes bloom long; on a quiet bar the
  // urchin contracts to a small pulsing ring (the dark pupil). q10 vortex shear curves the
  // bristles into a spiral on heavy transients. Distinct from alcAnemone (triangle starburst) —
  // this is a continuous glow ring whose profile IS the waveform mapped radially.
  // Reference: section_C3, 0:52-1:06 (canonical cobalt-blue background, pink→magenta color).
  P["Alchemy v2: Spindle"] = (function () {
    var hue = 0, lastT = 0, spin = 0;
    var SPINDLE_COMP =
      "shader_body {\n" +
      "vec2 d = uv - 0.5; d.x *= resolution.x / resolution.y;\n" +
      "float pr = length(d);\n" +
      "vec3 g = texture2D(sampler_main, uv).rgb;\n" +
      "vec3 bloom = (texture2D(sampler_blur1, uv).rgb + texture2D(sampler_blur2, uv).rgb) * 0.5;\n" +
      "float pupil = smoothstep(0.0, 0.14, pr);\n" +              // DARK CENTER pupil (the eye) — deepens at center
      "vec3 bg = vec3(0.06, 0.11, 0.28) * pupil * (0.85 + 0.22 * bass);\n" + // cobalt-blue (pulses with bass)
      "vec3 outc = bg + g + bloom * 0.30;\n" +
      "ret = outc / (outc + vec3(0.85));\n" +                     // Reinhard — muted, no white-out
      "}\n";
    var preset = build(
      Object.assign({}, alcCamera("flat"), { decay: 0.88 }),      // flat + moderate decay: urchin redrawn crisp but soft glow trail
      {
        frame: function (t) {
          var bass = t.bass_att || t.bass || 1, mid = t.mid_att || t.mid || 1;
          var tm = t.time, dt = Math.min(0.1, Math.max(0, tm - lastT)); lastT = tm;
          var bn = Math.max(0, Math.min(bass - 1, 1));
          hue = (hue + dt * (0.015 + 0.04 * bn)) % 1;
          spin = spin + dt * (0.5 + 3.0 * bn);                    // slow spin, whips on the beat
          t.q2 = 0.5; t.q3 = 0.5;
          t.q5 = 0.22 + 0.20 * bass;                              // radius: breathes strongly with bass
          t.q8 = hue;                                             // slow hue (pink→magenta→cyan band)
          t.q9 = spin;                                            // self-rotation
          t.q10 = 0.7 * Math.max(0, Math.min((bass - 1.2) / 0.6, 1));  // vortex on heavy transients
          return t;
        },
        comp: SPINDLE_COMP
      }
    );
    // Pink↔cyan slow mix: at q8=0 → dusty rose; q8=0.5 → muted cyan (matches ref "pink→cyan").
    // Hardcoded rather than alcPalette because the 3-offset cosine palette has no clean magenta.
    var PAL_ROSE = function (a) {
      var mix = 0.5 + 0.5 * Math.cos(6.2832 * (a.q8 || 0));   // 1 = pink phase, 0 = cyan phase
      a.r = (0.70 * mix + 0.18 * (1 - mix)) * 0.85;
      a.g = (0.28 * mix + 0.60 * (1 - mix)) * 0.85;
      a.b = (0.52 * mix + 0.74 * (1 - mix)) * 0.85;
    };
    preset.waves[0] = alcSpindle(PAL_ROSE);
    return preset;
  })();


  // ── Alchemy v2: Ribbon ───────────────────────────────────────────────────────
  // The 3D iridescent rainbow ribbon plane (ref 1:55–2:11, sections F4 + G1-G2). Implementation:
  // a bold diagonal waveform line (alcDiagonalLine) with heavy perpendicular waveform amplitude;
  // a directional warp that smears each frame ALONG the ribbon axis (lower-left drift) building
  // up the long diagonal rainbow streaks; a comp shader that tints the accumulation with an
  // iridescent rainbow along the axis. The "band width" is the waveform displacement; the
  // "streak length" is the feedback persistence. Near-black backdrop.
  //
  // Kit functions: alcRibbonWarp(angle, push) + alcRibbonComp(angle) — both reusable for any
  // diagonal band scene (e.g. the moiré "X" of two crossing ribbons in section_F3).
  P["Alchemy v2: Ribbon"] = (function () {
    var lastT = 0;
    var ANGLE = 0.65;                                             // ~37° — lower-left→upper-right (matches ref G2)
    var preset = build(
      { wave_a: 0, gammaadj: 1.5, decay: 0.96, zoom: 0.999,
        cx: 0.5, cy: 0.5, dx: 0.0, dy: 0.0, rot: 0.0, warp: 0.0,
        wrap: 0, darken_center: 0, echo_alpha: 0 },
      {
        frame: function (t) {
          var treb = t.treb_att || t.treb || 1;
          var tm = t.time, dt = Math.min(0.1, Math.max(0, tm - lastT)); lastT = tm;
          t.q10 = 1.0;                                           // diagonal line: full opacity always
          t.q6_wave = 0.14 + 0.10 * Math.min(treb, 1.5);        // perpendicular waveform amplitude (ribbon width)
          return t;
        },
        warp: alcRibbonWarp(ANGLE, 0.0015),   // slower drift -> band stays centered longer
        comp: alcRibbonComp(ANGLE)
      }
    );
    // Bold gold-white waveform line — the raw element that accumulates into the ribbon.
    // thick:1 + heavy amp so each fresh frame draws a visible wide band; the warp does the rest.
    preset.waves[0] = alcDiagonalLine(ANGLE, 0.82, 0.18, 1.0, 0.90, 0.65);
    return preset;
  })();


  // ── Alchemy v2: Moiré ────────────────────────────────────────────────────────
  // Scene F3 (ref 1:48–2:00): vertical green/black panning moiré stripes + quad mirror + central
  // horizontal oscilloscope band + diagonal X waveform lines + CENTRAL DIAMOND ANCHOR (the N=4
  // alcNgon pulsing at center, the user's requested element). Reference frames: /tmp/moire_frames/.
  //
  // Architecture: comp shader draws the moiré FRESH every frame (it's not feedback-accumulated);
  // warp just fades wave trails quickly (0.85 per frame). Four waves: diamond (idx 0 — FIRST per
  // last-wave-drop rule), oscilloscope, X line 1, X line 2.
  P["Alchemy v2: Moiré"] = (function () {
    var lastT = 0, spin = 0;

    // COMP: vertical panning moiré stripes, quad-mirrored, hue-cycling green/olive/magenta.
    // `abs(mp.x - 0.5) + 0.5` folds both halves onto [0.5,1.0] → L/R mirror.
    // `abs(mp.y - 0.5) + 0.5` → T/B mirror. Bars drawn fresh each frame — no feedback needed.
    var MOIRE_COMP =
      "vec3 pal_m(float t){\n" +
      "return vec3(0.5)+vec3(0.5)*cos(6.2832*(t+vec3(0.0,0.33,0.67)));}\n" +
      "shader_body {\n" +
      // Bars: L/R mirror via abs(uv.x-0.5)+0.5
      "float mBarX = abs(uv.x - 0.5) + 0.5;\n" +
      "float moirePan = time * 0.15 + bass * 0.4;\n" +
      "float moirePitch = 20.0 + 5.0 * sin(time * 0.2);\n" +
      "float mBars = 0.5 + 0.5 * cos((mBarX * moirePitch + moirePan) * 6.2832);\n" +
      "mBars = pow(mBars, 2.5);\n" +
      "vec3 barHue = pal_m(time * 0.05 + 0.67);\n" +   // +0.67 = green start (cos peak at g offset 0.33)
      "vec3 barCol = mix(vec3(0.01,0.03,0.01), barHue * (0.38 + 0.20 * bass), mBars);\n" +
      // QUAD-MIRROR the WAVES too: sample from the mirrored UV so the oscilloscope band and
      // diamond are reflected L/R + T/B. The T/B mirror of the oscilloscope creates the
      // butterfly/diamond shape at center (positive wiggles appear both above AND below center).
      "vec3 g = texture2D(sampler_main, uv).rgb;\n" +
      "vec3 bloom = (texture2D(sampler_blur1,uv).rgb+texture2D(sampler_blur2,uv).rgb)*0.5;\n" +
      "vec3 outc = barCol + g * 1.8 + bloom * 0.28;\n" +
      "ret = outc / (outc + vec3(0.90));\n" +
      "}\n";

    // WARP: clear each frame — bars are drawn fresh in comp, waves are crisp.
    // The kaleidoscope fold approach (warp-mirror + accumulate) creates ghost artifacts
    // because the bars in comp also get fed back. TODO: proper fix needs bars out of comp.
    var MOIRE_WARP = ALC_CLEAR_WARP;

    var preset = build(
      { wave_a: 0, gammaadj: 1.3, decay: 0.88, zoom: 1.0, cx: 0.5, cy: 0.5,
        rot: 0.0, warp: 0.0, wrap: 0, darken_center: 0, echo_alpha: 0 },
      {
        frame: function (t) {
          var bass = t.bass_att || t.bass || 1, treb = t.treb_att || t.treb || 1;
          var tm = t.time, dt = Math.min(0.1, Math.max(0, tm - lastT)); lastT = tm;
          var bn = Math.max(0, Math.min(bass - 1, 1));
          spin = (spin + dt * (0.5 + 1.5 * bn)) % 6.2832;
          t.q2 = 0.5; t.q3 = 0.5;
          t.q5 = 0.10 + 0.10 * bn;                   // diamond radius — small, pulses on bass
          t.q6 = 0.02 + 0.04 * Math.min(treb, 1.2);  // waveform jaggedness (diamond edges + X lines)
          t.q8 = (tm * 0.10) % 1;                    // slow hue cycling
          t.q9 = spin;                               // diamond slow spin
          t.q10 = 1.0;                               // diagonal lines: full opacity
          t.q12 = Math.sin(tm * 0.35);               // oscilloscope hue phase (-1..1): magenta→red→green
          return t;
        },
        warp: MOIRE_WARP,
        comp: MOIRE_COMP
      }
    );

    // Wave 0 — DIAMOND ANCHOR (alcNgon N=4, centered, small, bass-pulsing). NON-additive so the
    // small spinning shape stays a crisp wireframe (additive would pile into a white glow blob).
    var diamond = alcNgon({ sides: 4, skip: 1, radius: 0.15, aspectX: 1.2, dir: 1, hueOff: 0.0 });
    diamond.baseVals.additive = 0;
    preset.waves[0] = diamond;

    // Wave 1 — horizontal OSCILLOSCOPE BAND: full-width, y = 0.5 + value1*amp. Color cycles
    // magenta (q12=1) → red (q12=0) → green (q12=-1) matching the reference band color sequence.
    preset.waves[1] = {
      baseVals: Object.assign({}, WAVE_BASE, {
        enabled: 1, samples: 512, additive: 1, usedots: 0, scaling: 1,
        smoothing: 0.05, a: 0.9, thick: 1
      }),
      init_eqs: passthrough, frame_eqs: passthrough,
      point_eqs: function (a) {
        var amp = (a.q6 !== undefined ? a.q6 : 0.05) * 2.5;  // moderate oscilloscope height
        a.x = a.sample;                               // 0..1 full width
        a.y = 0.5 + (a.value1 || 0) * amp;
        var ph = (a.q12 !== undefined ? a.q12 : 0);   // -1..1 hue phase
        a.r = ph > 0 ? 0.80 : 0.80 * (1 + ph);       // magenta→red: r stays high; red→green: r drops
        a.g = ph < 0 ? 0.65 * (-ph) : 0.05;          // green phase only
        a.b = ph > 0 ? 0.60 * ph : 0.04;             // magenta phase only
        var ll = (a.r + a.g + a.b) / 3, sat = 0.75;
        a.r = (a.r * sat + ll * (1 - sat)) * 1.1;
        a.g = (a.g * sat + ll * (1 - sat)) * 1.1;
        a.b = (a.b * sat + ll * (1 - sat)) * 1.1;
        return a;
      }
    };

    // NOTE: no explicit diagonal X waves. The "X feel" comes from the quad-mirrored moiré
    // bars converging at the mirror fold lines — confirmed from the reference frames (1:49-1:52).
    // The explicit diagonal waveform lines only appear prominently LATER in the scene (~1:54+).

    return preset;
  })();
})();
