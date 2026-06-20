/* Alchemy family presets — the two flagship self-sequencing 'Random' engines.
 * Plain <script> loaded AFTER presets/kit.js; registers into window.WMP_PRESETS.
 * Uses the shared kit globals (build, circleWave, ALC_PAL, alc* factories, ...).
 * (Split out of the former monolithic presets/alchemy.js — see CLAUDE.md.)
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
    var SCENE_N = 10; // number of distinct scenes in the cycle
    var SCENE_D = 8.0; // seconds per scene
    var SCENE_FADE = 2.0; // crossfade window (last seconds of each scene)

    // Per-scene config — one entry per scene in the catalog (docs/alchemy-reference.md).
    // shape (central motif): 0 rose · 1 none(orbs/bg-led) · 2 spiral · 3 urchin ·
    //   4 lissajous · 5 star-web · 6 spiderweb · 7 crescent · 8 central waveform bolt.
    // cx/cy = central-motif center (off-center on some); orb = circle visibility;
    // rot = rotation speed. The BACKGROUND look + camera + kaleidoscope + darkness
    // for each scene index are hard-coded in the shaders (alScene/kalFor/gzFor/
    // darkFor/camZoom/camRot) — keep all of them indexed 0..9 in sync with this.
    var SCENES = [
      { shape: 3, cx: 0.5, cy: 0.5, orb: 0.15, rot: 0.25 }, // 0 dandelion / urchin burst
      { shape: 1, cx: 0.5, cy: 0.5, orb: 1.0, rot: 0.1 }, // 1 HERO: two orbs + waveform + bloom
      { shape: 2, cx: 0.5, cy: 0.5, orb: 0.15, rot: 0.45 }, // 2 perspective-tunnel spiral starburst
      { shape: 1, cx: 0.5, cy: 0.5, orb: 0.1, rot: 0.1 }, // 3 kaleidoscope lens-bands (bg-led)
      { shape: 8, cx: 0.5, cy: 0.5, orb: 0.1, rot: 0.1 }, // 4 hexagon mesh + central bolt
      { shape: 8, cx: 0.5, cy: 0.5, orb: 0.1, rot: 0.15 }, // 5 smoke plumes + central bolt
      { shape: 1, cx: 0.4, cy: 0.45, orb: 0.7, rot: 0.1 }, // 6 diagonal comet streaks
      { shape: 6, cx: 0.5, cy: 0.5, orb: 0.15, rot: 0.4 }, // 7 rainbow spiderweb
      { shape: 0, cx: 0.5, cy: 0.55, orb: 0.15, rot: 0.3 }, // 8 vertical-comb wallpaper + rosette
      { shape: 7, cx: 0.45, cy: 0.55, orb: 0.3, rot: 0.5 }, // 9 crescent swirl
    ];

    // Soft on/off envelope from a -1..1 sine: 0 for part of the cycle, smoothly
    // ramping to 1 — gives the rings/line their "come and go" behavior.
    function comeGo(s) {
      var x = (0.5 + 0.5 * s - 0.3) / 0.3;
      x = x < 0 ? 0 : x > 1 ? 1 : x;
      return x * x * (3 - 2 * x);
    }

    // Bright, saturated cosine-palette color from a hue phase (0..1). The lines in
    // the original are vivid/glowing (gold/blue/magenta); only the BACKGROUND is
    // muted — so geometry uses this, the wash gets desaturated in the comp.
    function hueBright(h) {
      var r = 0.5 + 0.5 * Math.cos(6.2832 * h);
      var g = 0.5 + 0.5 * Math.cos(6.2832 * (h + 0.33));
      var b = 0.5 + 0.5 * Math.cos(6.2832 * (h + 0.67));
      var l = (r + g + b) / 3,
        s = 0.85; // keep saturation (grey/washed-out otherwise);
      return [
        (r * s + l * (1 - s)) * 0.95,
        (g * s + l * (1 - s)) * 0.95,
        (b * s + l * (1 - s)) * 0.95,
      ]; // the tonemap tames white
    }

    var preset = build(
      {
        // Moderate decay: the roaming orbs leave coil/bead recede trails without
        // the additive build-up blowing the frame to white. The colorful
        // background is drawn procedurally in comp (NOT fed back), so only the
        // additive orbs/line/spokes accumulate here.
        wave_a: 0,
        decay: 0.91,
        gammaadj: 1.3,
        zoom: 1.0,
        rot: 0.0,
        warp: 0.0,
        wrap: 0,
        darken_center: 0.1,
        echo_alpha: 0,
      },
      {
        frame: function (t) {
          var bass = t.bass_att || t.bass || 1;
          var treb = t.treb_att || t.treb || 1;

          // State machine: current scene + smooth crossfade weight to the next.
          var ph = t.time / SCENE_D;
          var cur = Math.floor(ph) % SCENE_N;
          var fr = ph - Math.floor(ph); // 0..1 within the scene
          var fadeFrac = SCENE_FADE / SCENE_D;
          var f = (fr - (1 - fadeFrac)) / fadeFrac; // ramps 0..1 over the fade window
          f = f < 0 ? 0 : f > 1 ? 1 : f;
          f = f * f * (3 - 2 * f); // smoothstep
          var next = (cur + 1) % SCENE_N;
          var sc = SCENES[cur],
            sn = SCENES[next];

          // Two orbs zipping on independent paths — FAST (the original has quick,
          // whippy movement). Wide travel makes the connecting lightning span
          // corner-to-corner, and with high decay the fast motion drags trails
          // across the whole screen (the "multiple lines everywhere" look).
          var tm = t.time;
          t.q1 = 0.5 + 0.34 * Math.sin(tm * 0.55); // orb A center
          t.q2 = 0.5 + 0.3 * Math.cos(tm * 0.47);
          t.q3 = 0.5 + 0.32 * Math.cos(tm * 0.43 + 1.0); // orb B center
          t.q4 = 0.5 + 0.34 * Math.sin(tm * 0.51 + 2.0);
          t.q5 = 0.035 + 0.02 * bass; // ring radius

          // Orbs (circles) show per the scene config — mainly the orbs+lightning
          // scene, faint elsewhere so circles don't dominate.
          var orbAmt = sc.orb * (1 - f) + sn.orb * f;
          t.q20 = orbAmt * (0.5 + 0.5 * comeGo(Math.sin(tm * 0.35))); // orb A
          t.q21 = orbAmt * (0.5 + 0.5 * comeGo(Math.sin(tm * 0.31 + 2.2))); // orb B
          t.q22 = orbAmt * (0.6 + 0.4 * comeGo(Math.sin(tm * 0.27 + 1.5))); // thread
          t.q23 = (tm * 0.05 + 0.16 * cur) % 1; // hue drift + per-scene hue offset

          // Central motif: center lerps cur->next; rotation speed lerps; shape is
          // cur's motif id. A visibility window dips the alpha near scene edges so
          // the shape can swap during the crossfade without a hard pop.
          t.q26 = sc.cx * (1 - f) + sn.cx * f; // central center x
          t.q27 = sc.cy * (1 - f) + sn.cy * f; // central center y
          t.q28 = sc.shape; // central motif id (0..5)
          t.q25 = tm * (sc.rot * (1 - f) + sn.rot * f); // rotation
          var edge = 0.14;
          var vis = Math.min(fr / edge, (1 - fr) / edge);
          vis = vis < 0 ? 0 : vis > 1 ? 1 : vis;
          vis = vis * vis * (3 - 2 * vis); // fade in after scene start, out before end
          t.q24 = vis * (0.6 + 0.4 * comeGo(Math.sin(tm * 0.24 + 0.7))); // central presence

          t.q17 = bass;
          t.q18 = tm;
          t.q29 = (bass + (t.mid || 1) + treb) / 3; // overall loudness (RMS-ish) -> geometry brightness
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
          "vec3 bgLens(vec2 d,float t){ vec2 q=abs(fract(vec2(d.x*3.0, d.y*4.0+sin(d.x*6.0+t)*0.2))-0.5); float eye=smoothstep(0.5,0.2,q.y)*smoothstep(0.5,0.34,q.x); vec3 c=mix(vec3(0.04,0.16,0.14), vec3(0.10,0.42,0.20), eye); c+=vec3(0.5,0.12,0.10)*smoothstep(0.14,0.0,q.y)*0.7; return c; }\n" + // 3 kaleidoscope lens-bands / eye-lattice
          "vec3 bgHex(vec2 d,float t){ vec2 p=d*6.0; float l1=abs(fract(p.x)-0.5), l2=abs(fract(p.x*0.5+p.y*0.866)-0.5), l3=abs(fract(p.x*0.5-p.y*0.866)-0.5); float g=smoothstep(0.06,0.0,min(min(l1,l2),l3)); return vec3(0.05,0.09,0.15) + vec3(0.25,0.5,0.4)*g*0.5; }\n" + // 4 hexagon wireframe mesh (steel-blue)
          "vec3 bgSmoke(vec2 d,float t){ vec2 w=d*2.0 + vec2(fbm(d*1.5+t*0.1), fbm(d*1.5-t*0.1)); float n=fbm(w*2.0); vec3 cyc=mix(vec3(0.45,0.10,0.42), vec3(0.10,0.42,0.20), 0.5+0.5*sin(t*0.05)); return cyc*(0.25+0.7*n); }\n" + // 5 smoke/lava plumes (magenta<->green)
          "vec3 bgComb(vec2 d,float t){ float s=smoothstep(0.46,0.5, abs(fract(d.x*14.0)-0.5)); return mix(vec3(0.05,0.13,0.06), vec3(0.16,0.30,0.12), s); }\n" + // 8 vertical-comb wallpaper (olive)
          "vec3 bgTunnel(vec2 d,float r,float ang,float t){ float rays=smoothstep(0.5,0.0, abs(fract(ang*8.0/3.14159+0.5)-0.5)); vec3 cyc=mix(vec3(0.10,0.5,0.25), vec3(0.45,0.10,0.40), 0.5+0.5*sin(t*0.05)); return vec3(0.03,0.07,0.05) + cyc*rays*smoothstep(1.7,0.1,r); }\n" + // 2 perspective-tunnel rays
          "vec3 bgStrata(vec2 d,float gy,float t){ float band=0.5+0.5*sin(gy*16.0 + sin(t*0.3)); vec3 cool=mix(vec3(0.10,0.30,0.34), vec3(0.42,0.12,0.36), 0.5+0.5*sin(t*0.05)); vec3 c=cool*(0.5+0.4*band); c+=vec3(0.5,0.34,0.10)*exp(-dot(d,d)*6.0); return c; }\n" + // 9 landscape strata + amber clump
          "vec3 alScene(float id, vec2 d, float r, float ang, float gy, float t){\n" +
          "  if(id<0.5) return bleed(vec3(0.10,0.26,0.16), vec3(0.06,0.18,0.12), vec3(0.16,0.10,0.24), d, gy, t);\n" + // 0 dandelion: dark green field
          "  if(id<1.5) return bleed(vec3(0.04,0.05,0.13), vec3(0.07,0.04,0.11), vec3(0.12,0.06,0.16), d, gy, t);\n" + // 1 hero: dark navy free-space
          "  if(id<2.5) return bgTunnel(d, r, ang, t);\n" +
          "  if(id<3.5) return bgLens(d, t);\n" +
          "  if(id<4.5) return bgHex(d, t);\n" +
          "  if(id<5.5) return bgSmoke(d, t);\n" +
          "  if(id<6.5) return bleed(vec3(0.20,0.05,0.06), vec3(0.13,0.04,0.08), vec3(0.10,0.05,0.15), d, gy, t);\n" + // 6 comet: dark maroon
          "  if(id<7.5) return vec3(0.02,0.02,0.045);\n" + // 7 spiderweb: near-black
          "  if(id<8.5) return bgComb(d, t);\n" +
          "  return bgStrata(d, gy, t);\n" + // 9 strata
          "}\n" +
          "float kalFor(float id){ if(id<0.5) return 0.1; if(id<1.5) return 0.0; if(id<2.5) return 0.0; if(id<3.5) return 0.6; if(id<4.5) return 0.3; if(id<5.5) return 0.0; if(id<6.5) return 0.0; if(id<7.5) return 0.3; if(id<8.5) return 0.2; return 0.0; }\n" + // per-scene kaleidoscope (mirror)
          "float gzFor(float id){ if(id<0.5) return 1.4; if(id<1.5) return 1.2; if(id<2.5) return 1.7; if(id<3.5) return 1.3; if(id<4.5) return 1.2; if(id<5.5) return 1.4; if(id<6.5) return 1.3; if(id<7.5) return 1.5; if(id<8.5) return 1.3; return 1.4; }\n" + // per-scene geometry zoom (viewport)
          "float darkFor(float id){ if(id<0.5) return 0.5; if(id<1.5) return 0.35; if(id<2.5) return 0.6; if(id<3.5) return 0.95; if(id<4.5) return 0.85; if(id<5.5) return 0.7; if(id<6.5) return 0.5; if(id<7.5) return 0.4; if(id<8.5) return 0.85; return 0.7; }\n" + // per-scene bg darkness (neon-on-black vs pastel)
          "shader_body {\n" +
          "  vec2 d = uv - 0.5;\n" +
          "  d.x *= resolution.x / resolution.y;\n" +
          "  float r = length(d) * 2.0;\n" +
          "  float pang = atan(d.y, d.x);\n" + // NOT 'ang'/'rad' — Butterchurn predeclares those
          "  float gy = uv.y;\n" +
          "  float D = 8.0;\n" + // == SCENE_D
          "  float ph = time / D;\n" +
          "  float cur = mod(floor(ph), 10.0);\n" + // == SCENE_N
          "  float nxt = mod(cur + 1.0, 10.0);\n" +
          "  float fr = fract(ph);\n" +
          "  float fade = 2.0 / D;\n" + // == SCENE_FADE / SCENE_D
          "  float f = clamp((fr - (1.0 - fade)) / fade, 0.0, 1.0); f = f*f*(3.0-2.0*f);\n" +
          "  vec3 col = mix(alScene(cur, d, r, pang, gy, time), alScene(nxt, d, r, pang, gy, time), f);\n" +
          "  col *= (0.95 + 0.12*bass);\n" +
          "  col *= mix(darkFor(cur), darkFor(nxt), f);\n" + // neon scenes -> near-black bg, pastel stay light
          "  float km = 0.18 + mix(kalFor(cur), kalFor(nxt), f);\n" +
          "  float Z = mix(gzFor(cur), gzFor(nxt), f);\n" +
          "  vec2 zuv = (uv - 0.5) / Z + 0.5;\n" +
          "  float o = 2.5 / resolution.y;\n" + // dilation radius -> THICK lines
          "  vec3 fb = texture2D(sampler_main, zuv).rgb;\n" +
          "  fb = max(fb, texture2D(sampler_main, zuv + vec2(o,0.0)).rgb);\n" +
          "  fb = max(fb, texture2D(sampler_main, zuv - vec2(o,0.0)).rgb);\n" +
          "  fb = max(fb, texture2D(sampler_main, zuv + vec2(0.0,o)).rgb);\n" +
          "  fb = max(fb, texture2D(sampler_main, zuv - vec2(0.0,o)).rgb);\n" +
          "  fb += texture2D(sampler_main, vec2(1.0-zuv.x, zuv.y)).rgb * km;\n" + // mirror fill (kaleidoscope)
          "  fb += texture2D(sampler_main, vec2(zuv.x, 1.0-zuv.y)).rgb * km;\n" +
          "  vec3 glow = texture2D(sampler_blur1, zuv).rgb + texture2D(sampler_blur2, zuv).rgb;\n" +
          "  vec3 outc = col + fb*0.55 + glow*0.45;\n" +
          "  float hw = (abs(cur-1.0)<0.5 ? (1.0-f) : 0.0) + (abs(nxt-1.0)<0.5 ? f : 0.0);\n" + // HERO central bloom
          "  outc += vec3(1.0,0.82,0.55) * exp(-r*r*7.0) * (0.12 + 0.6*bass) * hw;\n" +
          "  ret = outc / (outc + vec3(0.9));\n" + // Reinhard tone-map: keep color, no white-out
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
          "  float zm = mix(camZoom(cur), camZoom(nxt), f);\n" + // per-scene tunnel zoom
          "  float a = mix(camRot(cur), camRot(nxt), f);\n" + // per-scene swirl rotation
          "  vec2 d = uv - 0.5;\n" +
          "  float s = sin(a), c = cos(a);\n" +
          "  vec2 ruv = 0.5 + mat2(c, -s, s, c) * d * zm;\n" +
          "  ret = texture2D(sampler_main, ruv).rgb;\n" +
          "  ret -= 0.008;\n" + // trim trails so beads stay discrete
          "}\n",
      }
    );

    // Build a custom-wave slot with the shared additive/glow look. point is the
    // per-point function; thick lines fix the "too thin" complaint.
    function sceneWave(point) {
      return {
        baseVals: Object.assign({}, WAVE_BASE, {
          enabled: 1,
          samples: 512,
          additive: 1,
          usedots: 0,
          scaling: 1,
          smoothing: 0.1,
          thick: 1,
          a: 1,
        }),
        init_eqs: passthrough,
        frame_eqs: passthrough,
        point_eqs: point,
      };
    }

    // A small, clean ringed orb at center (cxq,cyq), faded by envelope envq. As
    // it roams (high decay) it stamps a string of fading rings = the coil/bead
    // RECEDE trail from the reference frames. col = [r,g,b] glow color.
    function orbWave(cxq, cyq, envq, hoff) {
      var w = sceneWave(function (a) {
        var env = a[envq] || 0;
        var ang = a.sample * 6.2832;
        var rad = (a.q5 || 0.04) + 0.01 * a.value1; // real-waveform ring (subtle, stays circular)
        a.x = (a[cxq] !== undefined ? a[cxq] : 0.4) + rad * Math.cos(ang);
        a.y = (a[cyq] !== undefined ? a[cyq] : 0.5) + rad * Math.sin(ang);
        var c = hueBright((a.q23 || 0) + hoff); // bright per-scene hue (gold/blue/...)
        a.r = c[0];
        a.g = c[1];
        a.b = c[2];
        a.a = env * (0.3 + 0.7 * (a.q29 || 1)); // brightness scales with overall volume (RMS)
        return a;
      });
      w.baseVals.smoothing = 0.85; // round ring, not jagged
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
      var ax = a.q1 !== undefined ? a.q1 : 0.35,
        ay = a.q2 !== undefined ? a.q2 : 0.5;
      var bx = a.q3 !== undefined ? a.q3 : 0.65,
        by = a.q4 !== undefined ? a.q4 : 0.5;
      var s = a.sample;
      var dx = bx - ax,
        dy = by - ay;
      var len = Math.sqrt(dx * dx + dy * dy) || 1;
      var px = -dy / len,
        py = dx / len; // unit perpendicular
      var jag = a.value1 * 0.16 + a.value2 * 0.05; // REAL audio waveform (like Dance) — naturally jagged
      a.x = ax + dx * s + px * jag;
      a.y = ay + dy * s + py * jag;
      var c = hueBright((a.q23 || 0) + 0.04); // same hue family as the orbs
      a.r = c[0];
      a.g = c[1];
      a.b = c[2];
      a.a = w * (0.3 + 0.7 * (a.q29 || 1)); // brightness scales with overall volume (RMS)
      return a;
    });
    preset.waves[2].baseVals.smoothing = 0.0; // jagged, like a real oscilloscope

    // wave[3] — the central "flower urchin": each of the 512 waveform samples
    // shoots a filament outward by its amplitude → a thick spiky star of
    // filaments. Rotates (q25). Bright, complementary to the orbs/thread hue.
    preset.waves[3] = sceneWave(function (a) {
      var cx = a.q26 !== undefined ? a.q26 : 0.5; // per-scene (possibly off-) center
      var cy = a.q27 !== undefined ? a.q27 : 0.5;
      var shape = a.q28 || 0;
      var rot = a.q25 || 0;
      var s = a.sample,
        v = a.value1,
        av = Math.abs(v),
        th = s * 6.2832;
      var alpha = (a.q24 || 0) * 0.8;
      // Per Gemini: the central "puffballs/rings" SCALE with BASS (kick flare,
      // shrink when quiet); the waveform amplitude adds the jagged detail.
      var bscale = 0.5 + 0.7 * (a.q17 || 1);
      if (shape < 0.5) {
        // 0 ROSE / spirograph: a k-petal curve (rotating; bass-scaled, audio-jagged)
        var rr = bscale * 0.34 * (0.6 + 0.4 * av) * Math.cos(4.0 * th + rot);
        a.x = cx + rr * Math.cos(th);
        a.y = cy + rr * Math.sin(th);
      } else if (shape < 1.5) {
        // 1 none (orbs + lightning scene): keep the central slot invisible
        a.x = cx;
        a.y = cy;
        alpha = 0.0;
      } else if (shape < 2.5) {
        // 2 SPIRAL S-arms rotating from center (decay leaves the trails)
        var ARMS = 3.0,
          seg = Math.floor(s * ARMS),
          u = s * ARMS - seg;
        var th2 = u * 2.5 * 6.2832 + seg * (6.2832 / ARMS) + rot;
        var rr2 = bscale * u * 0.4 + 0.04 * v;
        a.x = cx + rr2 * Math.cos(th2);
        a.y = cy + rr2 * Math.sin(th2);
        if (u < 0.02) alpha = 0.0; // hide the jump between arms
      } else if (shape < 3.5) {
        // 3 URCHIN: real-waveform radial filaments; bass flares the whole burst
        var rad = bscale * (0.08 + 0.26 * av),
          ang = th + rot;
        a.x = cx + rad * Math.cos(ang);
        a.y = cy + rad * Math.sin(ang);
      } else if (shape < 4.5) {
        // 4 LISSAJOUS figure (bass-scaled, audio-jittered)
        a.x = cx + bscale * (0.34 + 0.05 * v) * Math.sin(3.0 * th + rot);
        a.y = cy + bscale * (0.32 + 0.05 * v) * Math.sin(2.0 * th);
      } else if (shape < 5.5) {
        // 5 STAR-WEB: star polygon (non-integer angular step) + waveform radius
        var th5 = th * 2.5 + rot,
          rr5 = bscale * 0.32 * (0.7 + 0.3 * av);
        a.x = cx + rr5 * Math.cos(th5);
        a.y = cy + rr5 * Math.sin(th5);
      } else if (shape < 6.5) {
        // 6 SPIDERWEB: many fine radial spokes (dense), bass-flared, rotating
        var SPK = 24.0,
          sp = Math.floor(s * SPK),
          u6 = s * SPK - sp;
        var ang6 = sp * (6.2832 / SPK) + rot;
        var rr6 = bscale * (0.05 + u6 * 0.45) + 0.03 * v;
        a.x = cx + rr6 * Math.cos(ang6);
        a.y = cy + rr6 * Math.sin(ang6);
        if (u6 < 0.02) alpha = 0.0; // hide spoke-to-spoke jumps
      } else if (shape < 7.5) {
        // 7 CRESCENT: a single arc (half sweep); the feedback swirl smears it into
        // the comma/crescent seen in the original.
        var ca = s * 3.1416 + rot,
          rr7 = bscale * 0.34 + 0.04 * v;
        a.x = cx + rr7 * Math.cos(ca);
        a.y = cy + rr7 * Math.sin(ca);
      } else {
        // 8 BOLT: a central vertical waveform line (for the hex-mesh / smoke scenes)
        a.x = cx + (a.value1 * 0.16 + a.value2 * 0.05);
        a.y = 0.08 + s * 0.84;
      }
      var c = hueBright((a.q23 || 0) + 0.5); // complementary to orbs/thread
      a.r = c[0];
      a.g = c[1];
      a.b = c[2];
      a.a = alpha * (0.3 + 0.7 * (a.q29 || 1)); // brightness scales with overall volume (RMS)
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
    function desat(a, s) {
      var l = (a.r + a.g + a.b) / 3;
      a.r = a.r * s + l * (1 - s);
      a.g = a.g * s + l * (1 - s);
      a.b = a.b * s + l * (1 - s);
    }
    function pastel(a) {
      desat(a, 0.66);
    } // dusty but still COLOURFUL
    function palMotif(a, idx) {
      curPal(a, idx);
      pastel(a);
    }
    function palSpec(a, idx) {
      // sample-keyed spectral (multi-colour) for spindle/rays
      var h = (a.q8 || 0) + a.sample * 0.7;
      a.r = 0.5 + 0.5 * Math.cos(6.2832 * h);
      a.g = 0.5 + 0.5 * Math.cos(6.2832 * (h + 0.33));
      a.b = 0.5 + 0.5 * Math.cos(6.2832 * (h + 0.67));
      desat(a, 0.6);
    }
    function comeGo(s) {
      var x = (0.5 + 0.5 * s - 0.3) / 0.3;
      x = x < 0 ? 0 : x > 1 ? 1 : x;
      return x * x * (3 - 2 * x);
    }

    // ── Gemini spatial coupling: rotate a wave point about centre by the shared global angle q13,
    // so the WHOLE foreground (motif + both orbs + tether) sways together with the camera. Same
    // pivot+angle for every wave ⇒ orbs stay joined to the tether. (Hoisted; called from below.)
    function fgRotate(a) {
      var ang = a.q13 || 0;
      if (!ang) return;
      var s = Math.sin(ang),
        c = Math.cos(ang),
        x = a.x - 0.5,
        y = a.y - 0.5;
      a.x = 0.5 + (c * x - s * y);
      a.y = 0.5 + (s * x + c * y);
    }

    // ── Generic stochastic discrete picker (random mode, beat-gated cut, hard-cap +5s).
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
            b = Math.floor(Math.random() * (n - 1));
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

    // ── CENTRAL MOTIF point-functions (kit factories; mandala packs all 12 into one wave).
    var fAnem = alcAnemone(26, palMotif).point_eqs;
    var fTriM = alcTriMandala(9, palMotif).point_eqs;
    var fNgon = alcNgonPacked(ALC_MANDALA_SPECS, 1.4).point_eqs; // all 12 star-polygons in ONE wave
    var fSpin = alcSpindle(palSpec).point_eqs;
    var fBur = alcRadialBurst({}).point_eqs; // built-in spectral (muted below)
    var fStar = alcTriangle(0, 0).point_eqs;
    var fDia = alcDiagonalLine(0.3, 0.62, 0.06).point_eqs;
    var fHor = bgWaveHorizon({ cy: 0.5, amp: 0.16, colorize: palMotif })[0].point_eqs;
    var fFea = alcOrbFeathery(0.5, 0.5, palMotif).point_eqs;
    var fMesh = alcMeshRings(8, 0.0).point_eqs;
    function fRays(a) {
      // packed asterisk of waveform rays (one wave)
      var N = 7,
        seg = Math.floor(a.sample * N),
        u = a.sample * N - seg,
        s = u * 2 - 1;
      var th = (seg / N) * 3.14159 + (a.q9 || 0),
        len = a.q5 || 0.3,
        disp = (a.value1 || 0) * (a.q6 || 0.04);
      a.x = 0.5 + s * len * Math.cos(th) - disp * Math.sin(th);
      a.y = 0.5 + s * len * Math.sin(th) + disp * Math.cos(th);
      palSpec(a, 0);
      if (u < 0.02) a.a = 0;
      return a;
    }
    function fBur2(a) {
      fBur(a);
      desat(a, 0.5);
      return a;
    } // tame the spectral burst (was the neon source)
    var MOTIF_N = 11;
    function centralDraw(a) {
      var m = a.q1 || 0;
      if (m < 0.5) fAnem(a);
      else if (m < 1.5) fTriM(a);
      else if (m < 2.5) fNgon(a);
      else if (m < 3.5) fSpin(a);
      else if (m < 4.5) fBur2(a);
      else if (m < 5.5) fRays(a);
      else if (m < 6.5) fStar(a);
      else if (m < 7.5) fDia(a);
      else if (m < 8.5) fHor(a);
      else if (m < 9.5) fFea(a);
      else fMesh(a);
      a.a = (a.a === undefined ? 0.85 : a.a) * (a.q15 || 0); // motif visibility (+ dip-swap)
      fgRotate(a);
      return a;
    }
    function scaleFor(m) {
      if (m < 0.5) return 0.46;
      if (m < 1.5) return 0.42;
      if (m < 2.5) return 1.0;
      if (m < 3.5) return 0.4;
      if (m < 5.5) return 0.34;
      if (m < 8.5) return 0.36;
      if (m < 9.5) return 0.22;
      return 0.4;
    }

    // ── ORBS — SMALL clean rings that drift SLOWLY (no big smeared loops) and come & go · cycle
    // the kit's clean bullseye-ring factories (alcOrbTarget n=1/2/3) via q16. Real-waveform only.
    // alcOrbiterNode DROPPED: its bright white core blows out under the comp glow+dilation (same
    // reason the prior build dropped it). q7/q25 = radius.
    var orbA_fns = [
      alcOrbTarget("q21", "q22", 1, palMotif).point_eqs,
      alcOrbTarget("q21", "q22", 2, palMotif).point_eqs,
      alcOrbTarget("q21", "q22", 3, palMotif).point_eqs,
    ];
    var orbB_fns = [
      alcOrbTarget("q23", "q24", 1, palMotif).point_eqs,
      alcOrbTarget("q23", "q24", 2, palMotif).point_eqs,
      alcOrbTarget("q23", "q24", 3, palMotif).point_eqs,
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
      { bg: 0, cam: [0.998, 0.004, 0.18, 0.0, 0.004], dark: 1.0 }, // fluid · drift
      { bg: 4, cam: [1.014, 0.002, 0.0, 0.0, 0.0], dark: 0.78 }, // tunnel · plunge
      { bg: 1, cam: [0.995, 0.006, 0.22, 1.0, 0.0], dark: 0.92 }, // marble · kaleido
      { bg: 3, cam: [0.998, 0.009, 0.0, 0.0, 0.009], dark: 1.0 }, // wash · float
      { bg: 9, cam: [0.994, 0.005, 0.18, 0.7, 0.0], dark: 0.86 }, // hex · kaleido
      { bg: 5, cam: [0.999, 0.003, 0.1, 0.0, 0.003], dark: 0.92 }, // comb · drift
      { bg: 0, cam: [0.994, 0.006, 0.3, 0.2, 0.0], dark: 0.95 }, // fluid · gentle vortex (was moiré dot-grid — too digital)
      { bg: 8, cam: [1.003, 0.004, 0.1, 0.0, 0.005], dark: 0.92 }, // strata · drift
      { bg: 10, cam: [1.01, 0.004, 0.0, 0.0, 0.0], dark: 0.74 }, // radial bloom · plunge
      { bg: 2, cam: [0.998, 0.01, 0.0, 0.0, 0.008], dark: 1.0 }, // fluid-gold · roll
      { bg: 7, cam: [0.999, 0.002, 0.0, 0.0, 0.002], dark: 1.0 }, // solidsnap · drift
    ];
    var LOOK_N = LOOKS.length;

    // ── Stochastic drivers — ONE shared macro clock (bg+cam+exposure) + independent slower
    // motif / orb-style / palette clocks (the non-looping "random" feel).
    var lastT = 0,
      huePhase = 0,
      spinAcc = 0,
      marchAcc = 0;
    var beat = alcBeatFlash({ rise: 1.25 });
    var lookPick = makePicker(LOOK_N, 9, 16, 4.0); // LONG fade ⇒ morph, not cut
    var motifPick = makePicker(MOTIF_N, 7, 13, 2.0); // faster ⇒ more motif variety on screen
    var orbStylePick = makePicker(3, 10, 20, 0.8);
    var palPick = makePicker(PALS.length, 16, 32, 4.0);

    var preset = build(
      {
        wave_a: 0,
        decay: 0.9,
        gammaadj: 1.4,
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
          var energy = (bass + mid + treb) / 3,
            bFlash = beat(t.bass || 1, dt);

          // L1 COLOUR — slow energy-coupled hue drift + stochastic palette (long fade).
          huePhase = alcHueClock(huePhase, dt, Math.max(0, energy - 1), 0.01, 0.04);
          t.q8 = huePhase;
          curPal = PALS[palPick(tm, dt).a];

          // L2 MACRO-LOOK — one shared clock crossfades bg + camera + exposure together.
          var lk = lookPick(tm, dt, bFlash > 0.6);
          var A = LOOKS[lk.a],
            B = LOOKS[lk.b],
            k = lk.mix;
          t.q18 = A.bg;
          t.q20 = B.bg;
          t.q27 = k;
          t.q19 = A.dark + (B.dark - A.dark) * k; // per-look exposure (crossfaded)
          var zoom = A.cam[0] + (B.cam[0] - A.cam[0]) * k,
            rot = A.cam[1] + (B.cam[1] - A.cam[1]) * k;
          var twist = A.cam[2] + (B.cam[2] - A.cam[2]) * k,
            kal = A.cam[3] + (B.cam[3] - A.cam[3]) * k,
            drift = A.cam[4] + (B.cam[4] - A.cam[4]) * k;
          if (zoom > 1.0) zoom += 0.02 * Math.max(0, bass - 1);
          else zoom -= 0.006 * Math.max(0, bass - 1);
          rot *= 1 + 0.5 * Math.max(0, mid - 1);
          t.q28 = zoom;
          t.q29 = rot;
          t.q30 = twist;
          t.q31 = kal;
          t.q32 = drift;

          // L3 SPATIAL COUPLING — gentle bounded global foreground sway, shared by all waves.
          t.q13 = 0.16 * Math.sin(tm * 0.05) + 0.08 * Math.sin(tm * 0.13);

          // L4 CENTRAL MOTIF — kit factory, own slower cadence; visibility floor kept up so a
          // motif swap never empties the frame.
          var mo = motifPick(tm, dt, bFlash > 0.6);
          var mCur = mo.mix < 0.5 ? mo.a : mo.b;
          t.q1 = mCur;
          var dd = (mo.mix - 0.5) * 4.0;
          t.q15 = (0.65 + 0.35 * comeGo(Math.sin(tm * 0.2))) * (1 - 0.55 * Math.exp(-dd * dd));
          t.q2 = 0.5;
          t.q3 = 0.5;
          t.q6 = 0.02 + 0.06 * Math.min(treb, 1.5);
          spinAcc += dt * (0.3 + 0.6 * Math.max(0, mid - 1));
          t.q5 = scaleFor(mCur) * (0.85 + 0.25 * Math.max(0, bass - 1));
          t.q11 = Math.max(0, Math.min((energy - 0.6) / 0.9, 1));
          marchAcc += dt * 0.06;
          t.q14 = mCur >= 9.5 ? marchAcc : 0;
          if (mCur >= 3.5 && mCur < 4.5) {
            t.q9 = 0.05 + 0.03 * bass;
            t.q10 = 0.08 + 0.22 * Math.max(0, mid - 1) + 0.12 * bFlash;
          } else if (mCur >= 6.5 && mCur < 7.5) {
            t.q9 = spinAcc;
            t.q10 = 1.0;
          } else {
            t.q9 = spinAcc;
            t.q10 = 0.4 * Math.max(0, bass - 1);
          }

          // L5 ORBS + TETHER — ROAM across the frame (wide sine paths) so the tether spans it;
          // both usually present ⇒ the WMP two-orbs+lightning signature fires often.
          t.q21 = 0.5 + 0.2 * Math.sin(tm * 0.13);
          t.q22 = 0.5 + 0.16 * Math.cos(tm * 0.11);
          t.q23 = 0.5 + 0.2 * Math.cos(tm * 0.1 + 1.4);
          t.q24 = 0.5 + 0.16 * Math.sin(tm * 0.12 + 2.1);
          t.q7 = 0.045 + 0.016 * Math.max(0, bass - 1) + 0.01 * bass; // small clean orb
          t.q25 = t.q7;
          t.q26 = 0.035 + 0.05 * treb; // tether jag amplitude (live waveform)
          t.q16 = orbStylePick(tm, dt).a; // which kit orb factory (random)
          t.q17 = comeGo(Math.sin(tm * 0.085)); // orb A: fully comes & goes (0..1)
          t.q12 = comeGo(Math.sin(tm * 0.073 + 2.0)); // orb B: fully comes & goes
          var both = Math.min(t.q17, t.q12);
          t.q4 = Math.max(0, (both - 0.4) / 0.5); // tether when BOTH orbs present
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
          NOISE_GLSL +
          ALC_FLUID_GLSL +
          ALC_MARBLE_GLSL +
          ALC_WASH_GLSL +
          ALC_MOIRE_GLSL +
          ALC_SOLIDSNAP_GLSL +
          ALC_RADIALBLOOM_GLSL +
          "vec3 hueRot(vec3 col, float a){ vec3 k = vec3(0.57735); float ca = cos(a), sa = sin(a); return col*ca + cross(k,col)*sa + k*dot(k,col)*(1.0-ca); }\n" +
          // V1's PROVEN structured scene-identity backgrounds (they fill the frame):
          "vec3 bgTunnel(vec2 d,float pr,float pa,float t){ float rays=smoothstep(0.5,0.0, abs(fract(pa*8.0/3.14159+0.5)-0.5)); vec3 cyc=mix(vec3(0.10,0.5,0.25), vec3(0.45,0.10,0.40), 0.5+0.5*sin(t*0.05)); return vec3(0.03,0.07,0.05) + cyc*rays*smoothstep(1.7,0.1,pr); }\n" +
          "vec3 bgComb(vec2 d,float t){ float s=smoothstep(0.36,0.5, abs(fract(d.x*9.0)-0.5)); return mix(vec3(0.07,0.10,0.08), vec3(0.11,0.16,0.10), s); }\n" + // SOFT dusty vertical wallpaper (was harsh bright lines)
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
          "  bg += hueRot(vec3(0.05, 0.047, 0.062), q8 * 6.2832 * 0.30) * (0.6 + 0.3 * bass);\n" + // dusty ambient floor — never pure black
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
          "}\n",
      }
    );

    // ── The 4 rendered waves: central kit motif + orb A + orb B + real-waveform tether (+beads).
    preset.waves[0] = {
      baseVals: Object.assign({}, WAVE_BASE, {
        enabled: 1,
        samples: 512,
        additive: 1,
        usedots: 0,
        scaling: 1,
        smoothing: 0.05,
        thick: 1,
        a: 0.85,
      }),
      init_eqs: passthrough,
      frame_eqs: passthrough,
      point_eqs: function (a) {
        return centralDraw(a);
      },
    };
    function orbWave(fns, visVar) {
      return {
        // NON-additive (paints, no white blowout/smear); the comp glow term halos them.
        baseVals: Object.assign({}, WAVE_BASE, {
          enabled: 1,
          samples: 256,
          additive: 0,
          usedots: 0,
          scaling: 1,
          smoothing: 0.1,
          thick: 1,
          a: 0.9,
        }),
        init_eqs: passthrough,
        frame_eqs: passthrough,
        point_eqs: function (a) {
          return orbDispatch(fns, a[visVar] || 0, a);
        },
      };
    }
    preset.waves[1] = orbWave(orbA_fns, "q17"); // orb A (vis q17)
    preset.waves[2] = orbWave(orbB_fns, "q12"); // orb B (vis q12)
    preset.waves[3] = {
      // jagged REAL-waveform tether + bright beads strung on the line
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
        var bead = Math.pow(Math.abs(Math.sin(a.sample * 3.14159 * 4.0)), 8.0); // bright beads at intervals
        a.r += bead * 0.6;
        a.g += bead * 0.6;
        a.b += bead * 0.7;
        a.a = (a.a === undefined ? 0.9 : a.a) * (a.q4 || 0);
        fgRotate(a);
        return a;
      },
    };
    return preset;
  })();
})();
