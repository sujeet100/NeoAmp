/* Shared kit for the WMP visualizer presets: helpers, GLSL constants, the build()
 * factory, and every reusable element / motif / background / orb factory (alc*).
 * Loaded FIRST (plain <script> in the sandboxed viz.html) so these top-level
 * declarations are shared globals the per-family preset files build on.
 * Split out of the former monolithic wmp-presets.js — see CLAUDE.md.
 */
"use strict";

var passthrough = function (a) {
  return a;
};

// Full default baseVals (mirrors Butterchurn's built-in default preset) so no
// field is ever missing when the renderer reads the preset.
var BASE = {
  gammaadj: 2,
  wave_g: 0.5,
  mv_x: 12,
  warpscale: 1,
  brighten: 0,
  mv_y: 9,
  wave_scale: 1,
  echo_alpha: 0,
  additivewave: 0,
  sx: 1,
  sy: 1,
  warp: 0.01,
  red_blue: 0,
  wave_mode: 0,
  wave_brighten: 0,
  wrap: 0,
  zoomexp: 1,
  fshader: 0,
  wave_r: 0.5,
  echo_zoom: 1,
  wave_smoothing: 0.75,
  warpanimspeed: 1,
  wave_dots: 0,
  wave_x: 0.5,
  wave_y: 0.5,
  zoom: 1,
  solarize: 0,
  modwavealphabyvolume: 0,
  dx: 0,
  cx: 0.5,
  dy: 0,
  darken_center: 0,
  cy: 0.5,
  invert: 0,
  bmotionvectorson: 0,
  rot: 0,
  modwavealphaend: 0.95,
  wave_mystery: -0.2,
  decay: 0.9,
  wave_a: 1,
  wave_b: 0.5,
  rating: 5,
  modwavealphastart: 0.75,
  darken: 0,
  echo_orient: 0,
  ib_r: 0.5,
  ib_g: 0.5,
  ib_b: 0.5,
  ib_a: 0,
  ib_size: 0,
  ob_r: 0,
  ob_g: 0,
  ob_b: 0,
  ob_a: 0,
  ob_size: 0.01,
  mv_dx: 0,
  mv_dy: 0,
  mv_a: 0,
  mv_r: 0.5,
  mv_g: 0.5,
  mv_b: 0.5,
  mv_l: 0,
};

var WAVE_BASE = {
  a: 1,
  enabled: 0,
  b: 1,
  g: 1,
  scaling: 1,
  samples: 512,
  additive: 0,
  usedots: 0,
  spectrum: 0,
  r: 1,
  smoothing: 0.5,
  thick: 0,
  sep: 0,
};
var SHAPE_BASE = {
  r2: 0,
  a: 1,
  enabled: 0,
  b: 0,
  tex_ang: 0,
  thickoutline: 0,
  g: 0,
  textured: 0,
  g2: 1,
  tex_zoom: 1,
  additive: 0,
  border_a: 0.1,
  border_b: 1,
  b2: 0,
  a2: 0,
  r: 1,
  border_g: 1,
  rad: 0.1,
  x: 0.5,
  y: 0.5,
  ang: 0,
  sides: 4,
  border_r: 1,
};

function makeWaves() {
  var w = [];
  for (var i = 0; i < 4; i++)
    w.push({
      baseVals: Object.assign({}, WAVE_BASE),
      init_eqs: passthrough,
      frame_eqs: passthrough,
      point_eqs: "",
    });
  return w;
}
function makeShapes() {
  var s = [];
  for (var i = 0; i < 4; i++)
    s.push({
      baseVals: Object.assign({}, SHAPE_BASE),
      init_eqs: passthrough,
      frame_eqs: passthrough,
    });
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

// Alchemy v2 framework: a COMPLEX, dusty/muted fluid background (domain-warped fbm,
// three low-saturation tones bleeding together — teal/purple/teal-grey), breathing
// with bass. Fixes the "too black / single flat color" gap without going neon.
// Needs NOISE_GLSL (fbm) prepended before the shader_body that calls alcFluid().
var ALC_FLUID_GLSL =
  "vec3 alcFluid(vec2 p, float t, float b, vec3 deep, vec3 mids, vec3 hi){\n" + // 3 scene-config tones
  "  vec2 q = vec2(fbm(p*1.7 + vec2(t*0.04, -t*0.03)), fbm(p*1.7 + vec2(5.2,1.3) - t*0.035));\n" +
  "  float n = fbm(p*1.5 + q*1.4 + vec2(-t*0.02, t*0.025));\n" +
  "  float n2 = fbm(p*2.6 - q*1.1 + t*0.015);\n" +
  "  vec3 c = mix(deep, mids, clamp(n*1.3, 0.0, 1.0));\n" +
  "  c = mix(c, hi, smoothstep(0.55, 0.95, n2));\n" +
  "  return c * (0.55 + 0.5 * b);\n" +
  "}\n";

// Alchemy v2 BG4: green<->magenta "marble / aurora" field — domain-warped fbm with
// bright iso-contour RIDGE lines (the signature texture from section E-late of the
// reference; see docs/alchemy-v2/background-motifs-reference.md). The ridges
// (abs(fract(fbm*k)-0.5) thresholded) are what make it read as marble, not generic
// noise. The field SWIRLS IN PLACE (a slow rotation matrix) — it is NOT a feedback
// zoom. `d` = aspect-corrected centered coord (0 at center); `t` = time; `b` = bass
// (brightens the ridges on beats). Needs NOISE_GLSL (fbm) prepended.
var ALC_MARBLE_GLSL =
  "vec3 alcMarble(vec2 d, float t, float b, vec3 colA, vec3 colB, vec3 vein){\n" +
  "  vec2 q = d + 0.15*vec2(sin(t*0.20), cos(t*0.17));\n" +
  "  float cs = cos(t*0.05), sn = sin(t*0.05);\n" +
  "  q = mat2(cs, -sn, sn, cs) * q;\n" + // slow in-place swirl (NOT feedback-zoom)
  "  float f = fbm(q*3.0 + t*0.05);\n" +
  "  float rdg = abs(fract(f*5.0 + t*0.10) - 0.5);\n" +
  "  float ridge = smoothstep(0.06, 0.0, rdg) * (0.6 + 0.6*b);\n" + // bold bright iso-contour veins (user preferred this)
  "  vec3 base = mix(colA, colB, 0.5+0.5*sin(t*0.06));\n" + // two-tone ground (scene-config)
  "  vec3 c = base*(0.45 + 0.55*f) + ridge*vein;\n" + // veins in scene-config colour
  "  c *= mix(1.0, smoothstep(0.0, 0.45, length(d)), 0.6);\n" + // soft INVERTING vignette (center darker, per frames)
  "  return c;\n" +
  "}\n";

// Alchemy v2 BG10: a barely-visible (~3%) STATIC fine cross-hatch / ordered-dither.
// Adds "tooth" to flat washes — the texture seen even on the reference's plain field
// (NOT animated CRT scanlines; it does not scroll or tear). Splice into a comp
// shader_body AFTER `ret` is set, BEFORE the closing brace. Reads uv/resolution/ret
// only (all valid there); keep the modulation tiny or it reads as noise.
var ALC_HATCH =
  "float hx = step(0.5, fract((uv.x + uv.y) * resolution.y * 0.5));\n" +
  "ret *= mix(0.97, 1.0, hx);\n";

// Alchemy v2 BG (aurora color-bleed) — a vivid domain-warped fbm SPECTRAL field: patchy
// green/yellow/red/purple color washes that drift and bleed (the colour bleeding behind the
// Net Tunnel in the original, section G ~2:15). A SEPARATE reusable motif — composite it UNDER
// other motifs (e.g. the line tunnel) in a comp. Vivid (a documented muting-rule exception).
// `d` = aspect-corrected centered coord; `t` = time; `b` = bass (lifts brightness on beats).
// Needs NOISE_GLSL (fbm) + PAL_GLSL (pal) prepended.
var ALC_AURORA_GLSL =
  "vec3 alcAurora(vec2 d, float t, float b){\n" +
  "  vec2 q = d*1.6 + vec2(fbm(d*1.4 + t*0.05), fbm(d*1.4 + 5.0 - t*0.04));\n" + // domain warp
  "  float n  = fbm(q*1.8 + t*0.03);\n" +
  "  float n2 = fbm(q*2.6 - t*0.025);\n" +
  "  vec3 c = pal(n*1.2 + t*0.04);\n" + // spectral hue driven by the noise
  "  c *= smoothstep(0.25, 0.9, n2);\n" + // PATCHY bleed (not a uniform wash)
  "  return c * (0.5 + 0.5*b);\n" +
  "}\n";

// ── Color-bleed FIELD motifs (catalogued from the whole video; see background-motifs-
// reference.md). Each returns a vec3 color field to composite UNDER geometry in a comp.
// Two axes: these are the FIELD (what colour/pattern); the feedback warp/camera is the
// TRANSFORM (how it bleeds). All need the noted helpers prepended. ─────────────────────

// alcWash (BG3): flat MUTED hue-cycling pastel wash + soft vignette — the calm Alchemy
// backdrop (section C sage->olive, D->E steel-blue). colA/colB = two dusty colours it
// drifts between; `speed` = drift rate. Heavily desaturated so it never goes neon.
var ALC_WASH_GLSL =
  "vec3 alcWash(vec2 d, float t, vec3 colA, vec3 colB, float speed){\n" +
  "  vec3 c = mix(colA, colB, 0.5 + 0.5*sin(t*speed));\n" +
  "  float luma = dot(c, vec3(0.33));\n" +
  "  c = mix(vec3(luma), c, 0.6);\n" + // desaturate -> dusty pastel
  "  c *= 1.0 - 0.28*dot(d,d);\n" + // soft vignette
  "  return c;\n" +
  "}\n";

// alcRadialBloom: a central colour BLOOM radiating from center, hue-cycling magenta<->lime,
// bass-pulsing (the supernova/burst colour field — section I, and D's radial burst). Needs no helper.
var ALC_RADIALBLOOM_GLSL =
  "vec3 alcRadialBloom(vec2 d, float t, float b, vec3 colA, vec3 colB){\n" + // two-tone, scene-config
  "  float r = length(d);\n" +
  "  float bloom = exp(-r*r*(3.0 - 1.5*b));\n" + // tightens/expands with bass
  "  vec3 c = mix(colA, colB, 0.5+0.5*sin(t*0.4));\n" + // e.g. magenta<->lime
  "  c = c*bloom + smoothstep(0.55,0.45,r)*colA*0.3;\n" + // faint outer ring tinted by colA
  "  return c;\n" +
  "}\n";

// alcHorizonBands: horizontal stratified spectral bands pinched to a bright horizon line
// (section A perspective horizon; F prism plane). Muted spectrum, slow vertical drift.
// Needs PAL_GLSL (pal). `d` centered so the horizon sits at d.y=0.
var ALC_HORIZONBANDS_GLSL =
  "vec3 alcHorizonBands(vec2 d, float t, float b){\n" +
  "  float y = d.y*4.0 + t*0.06;\n" +
  "  vec3 c = pal(fract(y));\n" +
  "  float luma = dot(c, vec3(0.33)); c = mix(vec3(luma), c, 0.55);\n" + // desaturate -> dusty bands
  "  c *= exp(-pow(d.y*3.0, 2.0));\n" + // pinch to a bright horizon
  "  return c * (0.6 + 0.4*b);\n" +
  "}\n";

// bgKaleido (BG5) — n-FOLD radial kaleidoscope coordinate FOLD. Returns folded centered
// coords; sample any field/motif at the result to mirror it into an n-fold mandala. (For a
// plain 4-quadrant mirror just use abs(d).) Reusable transform — extracted from the inline
// Kaleidoscope scene so any scene can fold any field. `d` = aspect-corrected centered coord.
var ALC_KALEIDO_GLSL =
  "vec2 alcKaleido(vec2 d, float n){\n" +
  "  float a = atan(d.y, d.x);\n" +
  "  float r = length(d);\n" +
  "  float seg = 6.2832 / n;\n" +
  "  a = abs(a - seg * floor(a / seg + 0.5));\n" + // fold angle into one mirrored wedge
  "  return vec2(cos(a), sin(a)) * r;\n" +
  "}\n";

// bgMoire (BG6) — quad-mirrored MOIRÉ stripe colour field. PRODUCT of two mirrored stripe
// sets (x AND y) -> the diamond/BUTTERFLY interference (fixes the standing moiré TODO; the
// old inline version only had x-stripes). `uv` = raw 0..1 uv; `t` time; `b` bass (pan+bright);
// `barCol` = the lit-bar colour (scene-config). Returns the bar colour to composite.
var ALC_MOIRE_GLSL =
  "vec3 alcMoire(vec2 uv, float t, float b, vec3 barCol){\n" + // barCol = scene-config bar colour
  "  vec2 m = abs(uv - 0.5) + 0.5;\n" + // quad mirror (L/R + T/B) -> butterfly symmetry
  "  float pan = t * 0.15 + b * 0.4;\n" +
  "  float pitch = 20.0 + 5.0 * sin(t * 0.2);\n" +
  "  float bx = 0.5 + 0.5 * cos((m.x * pitch + pan) * 6.2832);\n" +
  "  float by = 0.5 + 0.5 * cos((m.y * pitch * 0.6 - pan) * 6.2832);\n" + // second axis -> butterfly moiré
  "  float bars = pow(bx * by, 2.5);\n" + // product of two mirrored stripe sets
  "  return mix(vec3(0.01,0.03,0.01), barCol * (0.4 + 0.2*b), bars);\n" +
  "}\n" +
  // alcMoireStripes — X-ONLY vertical columns. The WMP moiré scene (F3, 1:48-1:55) is a field of
  // vertical green/olive->magenta STRIPES, NOT the dot lattice the x*y PRODUCT above gives. The L/R
  // abs-mirror keeps the bright "diamond" pinch at the vertical centerline. Kept ALONGSIDE alcMoire
  // (dots) so both are selectable — they are different WMP looks.
  "vec3 alcMoireStripes(vec2 uv, float t, float b, vec3 barCol){\n" +
  "  vec2 m = abs(uv - 0.5) + 0.5;\n" + // L/R mirror -> centerline pinch
  "  float pan = t * 0.15 + b * 0.4;\n" +
  "  float pitch = 20.0 + 5.0 * sin(t * 0.2);\n" +
  "  float bx = 0.5 + 0.5 * cos((m.x * pitch + pan) * 6.2832);\n" +
  "  float bars = pow(bx, 2.5);\n" + // X-only -> genuine vertical columns
  "  return mix(vec3(0.01,0.03,0.01), barCol * (0.4 + 0.2*b), bars);\n" +
  "}\n";

// bgSolidSnap (T2.5) — instant SOLID-COLOUR flip background: returns one of N dusty preset
// colours by index. The scene flips `sel` on a beat/timer (and runs decay≈0 / clear warp) so
// the whole field SNAPS to a new solid colour with no fade — the discrete scene-change events.
var ALC_SOLIDSNAP_GLSL =
  "vec3 alcSolidSnap(float sel){\n" +
  "  float i = mod(floor(sel), 4.0);\n" +
  "  if (i < 0.5) return vec3(0.30, 0.42, 0.28);\n" + // sage green
  "  if (i < 1.5) return vec3(0.16, 0.22, 0.45);\n" + // cobalt blue
  "  if (i < 2.5) return vec3(0.45, 0.20, 0.40);\n" + // mauve
  "  return vec3(0.40, 0.34, 0.14);\n" + // olive gold
  "}\n";

// CB8 (color) — depth/vignette FOG: pull a colour toward a dark jewel-tone `fog` by `depth`
// (0=near/bright, 1=far) and darken toward frame edges. The universal Alchemy background
// depth behavior (never pure black; fog hue tracks the current scene hue at low sat/lightness).
// `d` = aspect-corrected centered coord. Reusable across any field motif.
var ALC_FOG_GLSL =
  "vec3 alcFog(vec3 col, float depth, vec3 fog, vec2 d){\n" +
  "  col = mix(col, fog, clamp(depth, 0.0, 1.0));\n" +
  "  col *= smoothstep(1.25, 0.2, length(d));\n" + // vignette to dark edges
  "  return col;\n" +
  "}\n";

// Maps the feedback-buffer luminance to a tint (cycling colA<->colB when they
// differ; pass the same color twice to hold a fixed hue) with a soft,
// bass-pulsing center bloom. colA/colB/speed/boost are GLSL literal strings.
function tintComp(colA, colB, speed, boost) {
  return (
    "shader_body {\n" +
    "vec3 c = texture2D(sampler_main, uv).rgb;\n" +
    "float lum = dot(c, vec3(0.33));\n" +
    "float h = 0.5 + 0.5*sin(time*(" +
    speed +
    "));\n" +
    "vec3 tint = mix(" +
    colA +
    ", " +
    colB +
    ", h);\n" +
    "ret = tint * lum * (" +
    boost +
    ");\n" +
    "float d = distance(uv, vec2(0.5));\n" +
    "ret += tint * exp(-d*d*8.0) * (0.10 + 0.35*bass);\n" +
    "}\n"
  );
}

// alcChroma (color-bleed TRANSFORM — chromatic aberration, Gemini bleed #5): returns a comp
// snippet that re-samples the feedback buffer with the R/B channels split radially OUTWARD
// (stronger toward the rim) -> trails separate into RGB ghosts / prism fringing at the edges.
// Splice into a comp shader_body where you'd normally do `vec3 g = texture2D(sampler_main,uv)`;
// it SETS the local `g`. `amt` (GLSL literal string) scales the split. Reusable across scenes.
function alcChroma(amt) {
  return (
    "vec2 cad = uv - 0.5;\n" +
    "float caR = length(cad) * (" +
    amt +
    ");\n" +
    "vec2 caDir = cad / (length(cad) + 1e-5);\n" +
    "vec3 g = vec3(\n" +
    "  texture2D(sampler_main, uv + caDir*caR).r,\n" +
    "  texture2D(sampler_main, uv).g,\n" +
    "  texture2D(sampler_main, uv - caDir*caR).b);\n"
  );
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
    comp: opts.comp || COMP_DEFAULT,
  };
}

// A custom wave that draws the audio waveform as a jagged circle, centered on
// (a[qx], a[qy]) with radius a.q5 — values fed from the main per-frame eqs.
// Equations are real FUNCTIONS: for a converted preset (function-based main
// eqs) Butterchurn calls wave.point_eqs directly and never compiles *_str, so
// point_eqs MUST be a function (an empty string would be skipped at draw time).
// colorize (optional) — an ALC_PAL palette to set per-point colour; omit to keep the
// default magenta baseVals colour (back-compat for existing callers).
function circleWave(qx, qy, colorize) {
  return {
    baseVals: Object.assign({}, WAVE_BASE, {
      enabled: 1,
      samples: 512,
      additive: 1,
      usedots: 0,
      scaling: 1,
      smoothing: 0.1,
      a: 1,
      r: 0.85,
      g: 0.13,
      b: 0.95,
    }),
    init_eqs: passthrough,
    frame_eqs: passthrough,
    point_eqs: function (a) {
      var ang = a.sample * 6.2832;
      var rad = (a.q5 || 0.15) + 0.05 * a.value1;
      a.x = (a[qx] || 0.5) + rad * Math.cos(ang);
      a.y = (a[qy] || 0.5) + rad * Math.sin(ang);
      if (colorize) colorize(a, 0);
      return a;
    },
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
      enabled: 1,
      samples: 512,
      additive: 1,
      usedots: 0,
      scaling: 1,
      smoothing: 0.04,
      a: 1,
      r: 0.7,
      g: 0.5,
      b: 1.0,
    }),
    init_eqs: passthrough,
    frame_eqs: passthrough,
    point_eqs: function (a) {
      var th = a.q1 || 0.0;
      var s = a.sample * 2.0 - 1.0; // -1..1 along the line
      var ct = Math.cos(th),
        st = Math.sin(th);
      var cx = a.q2 !== undefined ? a.q2 : 0.5;
      var cy = a.q3 !== undefined ? a.q3 : 0.5;
      a.x = cx + s * 0.55 * ct - a.value1 * 0.26 * st;
      a.y = cy + s * 0.55 * st + a.value1 * 0.26 * ct;
      var h = a.q8 || 0.0;
      a.r = 0.5 + 0.5 * Math.cos(6.2832 * h);
      a.g = 0.5 + 0.5 * Math.cos(6.2832 * (h + 0.33));
      a.b = 0.5 + 0.5 * Math.cos(6.2832 * (h + 0.67));
      return a;
    },
  };
}

// A custom wave drawing the real audio waveform as a straight spoke through
// center at a FIXED angle, displaced perpendicular by the sample. Use several
// at different angles for stars / webs / windmills. len = half-length (0..~0.6),
// amp = waveform displacement, [r,g,b] = color.
function spokeLine(angle, len, amp, r, g, b) {
  var ct = Math.cos(angle),
    st = Math.sin(angle);
  return {
    baseVals: Object.assign({}, WAVE_BASE, {
      enabled: 1,
      samples: 512,
      additive: 1,
      usedots: 0,
      scaling: 1,
      smoothing: 0.04,
      a: 1,
      r: r,
      g: g,
      b: b,
    }),
    init_eqs: passthrough,
    frame_eqs: passthrough,
    point_eqs: function (a) {
      var s = a.sample * 2.0 - 1.0; // -1..1 along the spoke
      a.x = 0.5 + s * len * ct - a.value1 * amp * st;
      a.y = 0.5 + s * len * st + a.value1 * amp * ct;
      return a;
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// ALCHEMY KIT — composable vocabulary for Alchemy v2 scenes.
//
// A scene = a CAMERA (the feedback transform — where the trace recedes to) + one
// or more MOTIFS (2D shapes redrawn each frame whose feedback TRAIL builds the
// structure) + color/tuning. The SAME motif reads as a face-on mandala under the
// "top" camera or a receding corridor net under the "side" camera — only the
// camera changes. This is the WMP Alchemy mechanism (frame feedback, foundation
// #1 in docs/alchemy-v2); see memory wireframe-net-is-crossing-helices.
//
// Motif convention — scenes drive motifs through shared q-vars set in frame_eqs:
//   q2,q3 = head position (where the motif is drawn) | q5 = star radius
//   q6 = waveform edge jaggedness | q7 = orb radius | q8 = hue phase | q9 = self-spin
// ═══════════════════════════════════════════════════════════════════════════

// Glow from ADDITIVE overdraw + soft bloom (NOT motion smear), tone-mapped
// (Reinhard) so colors stay muted and never blow to white. Shared by Alchemy scenes.
var ALC_COMP =
  "shader_body {\n" +
  "vec3 g = texture2D(sampler_main, uv).rgb;\n" +
  "vec3 bloom = (texture2D(sampler_blur1, uv).rgb + texture2D(sampler_blur2, uv).rgb) * 0.5;\n" +
  "vec3 outc = g + bloom * 0.20;\n" +
  "ret = outc / (outc + vec3(0.85));\n" +
  "}\n";

// MANDALA backdrop: flat muted-blue + the crisp wireframe additively on top + soft bloom,
// tone-mapped so it stays muted (the 2D star-polygon mandala scene, ref 1:14–1:28).
var ALC_FLATBLUE_COMP =
  "shader_body {\n" +
  "vec3 g = texture2D(sampler_main, uv).rgb;\n" +
  "vec3 bloom = (texture2D(sampler_blur1, uv).rgb + texture2D(sampler_blur2, uv).rgb) * 0.5;\n" +
  "vec3 bg = vec3(0.10, 0.22, 0.38);\n" + // flat muted blue (the mandala backdrop)
  "vec3 outc = bg + g + bloom * 0.15;\n" +
  "ret = outc / (outc + vec3(0.85));\n" + // Reinhard -> muted, no white-out
  "}\n";

// CRISP feedback: clear the buffer every frame. In THIS build the `decay` base-val has NO
// effect — feedback is the WARP shader, and the default (`ret -= 0.004`) keeps the trail
// nearly forever (the receding-diamond field). Returning black = motifs are redrawn fresh
// each frame; glow still comes from the comp bloom. (learning #1: feedback is for glow, NOT
// structure — the mandala lattice must be drawn explicitly.)
var ALC_CLEAR_WARP = "shader_body {\nret = vec3(0.0);\n}\n";

// CAMERA: the feedback baseVals for a named viewpoint. Spread into build()'s
// overrides. The camera is literally "where does the previous frame shrink toward":
//   top  = toward center  -> face-on spinning mandala (the trace stays centered)
//   side = toward a right-edge VP -> the motif (drawn left) recedes into a corridor
//   orbit= toward center + a steady spin -> swirling galaxy
function alcCamera(kind) {
  // "side": SINGLE-SIDED corridor — NO sx/sy stretch (that is symmetric about center and
  // always tapers both ends). Instead isotropic zoom<1 toward a VP near the RIGHT EDGE
  // (cx≈0.92): the trace RECEDES left→right into that one point. Source is drawn on the LEFT
  // (big near-end), so the corridor opens at the left and converges at the right. One VP only.
  // Corridor: the EXPLICIT orb row carries depth/motion (it marches via q14), so the feedback
  // does NOT need zoom>1 (that runs away to a white-out). zoom=1 + LOW decay (0.6) = crisp
  // short trails only; a tiny leftward dx adds gentle drift. VP for the explicit orbs is the
  // right edge (handled in alcOrbRow), so the corridor reads left->right.
  // Corridor: feedback recedes the NET toward the SAME off-center VP the explicit orbs use
  // (cx 0.86 / cy 0.62, down-right), so net + orbs share one corridor. Moderate decay -> the
  // net gets its trace and the (explicit, redrawn) shape orbs get a slight glow-trail, not a tube.
  if (kind === "side")
    return {
      wave_a: 0,
      gammaadj: 1.2,
      decay: 0.42,
      zoom: 0.95,
      sx: 1.0,
      sy: 1.0,
      cx: 0.86,
      cy: 0.62,
      dx: 0.0,
      rot: 0.0,
      warp: 0.0,
      wrap: 0,
      darken_center: 0,
      echo_alpha: 0,
    };
  if (kind === "orbit")
    return {
      wave_a: 0,
      gammaadj: 1.5,
      decay: 0.93,
      zoom: 0.972,
      cx: 0.5,
      cy: 0.5,
      rot: 0.06,
      warp: 0.0,
      wrap: 0,
      darken_center: 0,
      echo_alpha: 0,
    };
  // "flat": NEAR-ZERO feedback (decay 0.88, zoom 0.998) -> the motif is redrawn crisp each
  // frame with only a faint glow trail, NOT smeared into rings. Right for pulsing centered
  // motifs (anemone, mandala) where the reference is sharp fur, not echoey concentric ghosts.
  if (kind === "flat")
    return {
      wave_a: 0,
      gammaadj: 1.3,
      decay: 0.88,
      zoom: 0.998,
      cx: 0.5,
      cy: 0.5,
      rot: 0.0,
      warp: 0.0,
      wrap: 0,
      darken_center: 0.04,
      echo_alpha: 0,
    };
  // ── NEW camera presets (camera-motifs-reference.md). A per-frame DRIVER (alcCam*) usually
  // animates these; the static baseVals here set the resting pose.
  // "hold": dead-air — no transform, faint glow only (intros/lulls). CAM0.
  if (kind === "hold")
    return {
      wave_a: 0,
      gammaadj: 1.4,
      decay: 0.9,
      zoom: 1.0,
      cx: 0.5,
      cy: 0.5,
      rot: 0.0,
      warp: 0.0,
      wrap: 0,
      darken_center: 0,
      echo_alpha: 0,
    };
  // "plunge": fly INTO the scene — zoom>1 (content blooms outward from the VP). Drive zoom/cx/cy
  // with alcCamPlunge for bass-speed + a drifting vanishing point. CAM1.
  if (kind === "plunge")
    return {
      wave_a: 0,
      gammaadj: 1.5,
      decay: 0.94,
      zoom: 1.015,
      cx: 0.5,
      cy: 0.5,
      rot: 0.0,
      warp: 0.0,
      wrap: 0,
      darken_center: 0,
      echo_alpha: 0,
    };
  // "vortex": spin + inward suction toward the VP. Drive with alcCamVortex (rot + zoom<1). The
  // signature Alchemy camera. CAM3. (A custom warp shader gives the cleanest spiral — see Vortex scene.)
  if (kind === "vortex")
    return {
      wave_a: 0,
      gammaadj: 1.5,
      decay: 0.94,
      zoom: 0.985,
      cx: 0.5,
      cy: 0.5,
      rot: 0.03,
      warp: 0.0,
      wrap: 0,
      darken_center: 0.06,
      echo_alpha: 0,
    };
  // "tiltFloor": pseudo-isometric — vertical squash (sy<sx) + a high horizon (cy) so a drawn
  // floor grid recedes to a horizon band. CAM5. The grid itself is drawn geometry; this is the pose.
  if (kind === "tiltFloor")
    return {
      wave_a: 0,
      gammaadj: 1.4,
      decay: 0.9,
      zoom: 1.0,
      sx: 1.0,
      sy: 0.6,
      cx: 0.5,
      cy: 0.34,
      rot: 0.0,
      warp: 0.0,
      wrap: 0,
      darken_center: 0,
      echo_alpha: 0,
    };
  /* top */ return {
    wave_a: 0,
    gammaadj: 1.5,
    decay: 0.93,
    zoom: 0.955,
    cx: 0.5,
    cy: 0.5,
    rot: 0.0,
    warp: 0.0,
    wrap: 0,
    darken_center: 0,
    echo_alpha: 0,
  };
}

// ── CAMERA DRIVERS (camera-motifs-reference.md) — call in a scene's frame_eqs to ANIMATE the
// camera with audio. Each sets independent feedback fields (zoom vs rot vs dx/dy) so they STACK.
// Work with the default warp (which applies zoom/rot/cx/cy/dx/dy/sx/sy to the warp mesh); scenes
// with a custom uv-sampling warp do their transform in-shader instead. ─────────────────────────

// CAM1 — Z-PLUNGE: fly into the scene. zoom>1 scaled by bass; optional drifting off-center VP.
//   opts.base (rest zoom >1) | opts.gain (bass->speed) | opts.vpDrift (VP wander radius, 0=centered) | opts.vpRate
function alcCamPlunge(t, opts) {
  opts = opts || {};
  var bass = t.bass_att || t.bass || 1;
  t.zoom =
    (opts.base === undefined ? 1.012 : opts.base) +
    (opts.gain === undefined ? 0.05 : opts.gain) * Math.max(0, bass - 1);
  if (opts.vpDrift) {
    var rate = opts.vpRate === undefined ? 0.1 : opts.vpRate;
    t.cx = 0.5 + opts.vpDrift * Math.cos(t.time * rate);
    t.cy = 0.5 + opts.vpDrift * Math.sin(t.time * rate * 1.3);
  }
  return t;
}

// CAM3 — VORTEX: continuous spin + inward suction toward the VP. mid speeds the swirl, bass deepens suction.
//   opts.zoom (rest <1) | opts.spin (rad/frame) | opts.midGain | opts.bassGain
function alcCamVortex(t, opts) {
  opts = opts || {};
  var mid = t.mid_att || t.mid || 1,
    bass = t.bass_att || t.bass || 1;
  t.zoom =
    (opts.zoom === undefined ? 0.985 : opts.zoom) -
    (opts.bassGain === undefined ? 0.01 : opts.bassGain) * Math.max(0, bass - 1);
  t.rot =
    (opts.spin === undefined ? 0.02 : opts.spin) *
    (1 + (opts.midGain === undefined ? 0.6 : opts.midGain) * Math.max(0, mid - 1));
  return t;
}

// CAM4 — ROLL / bank: continuous Z rotation. For the beat-SNAP variant, pass a flash (alcBeatFlash)
// and a snapStep (rad) — the bank jumps by snapStep on a transient.  opts.rate | opts.snapStep
function alcCamRoll(t, opts, flash) {
  opts = opts || {};
  t.rot = opts.rate === undefined ? 0.01 : opts.rate;
  if (opts.snapStep && flash) t.rot += opts.snapStep * flash; // beat-snap kick (decays with flash)
  return t;
}

// CAM6 — FLOAT: smooth low-frequency handheld pan-drift (a gentle glide, NOT a shake).
//   opts.amp (drift radius) | opts.rx/opts.ry (drift rates)
function alcCamFloat(t, opts) {
  opts = opts || {};
  var amp = opts.amp === undefined ? 0.004 : opts.amp;
  t.dx = amp * Math.sin(t.time * (opts.rx === undefined ? 0.23 : opts.rx));
  t.dy = amp * Math.cos(t.time * (opts.ry === undefined ? 0.19 : opts.ry));
  return t;
}

// CAM6 jitter (per Gemini; NOT seen in the clip — use as a rare accent): transient XY shake.
// Pass `flash` from alcBeatFlash so it only fires on a beat, then snaps back to 0.  opts.amt
function alcCamJitter(t, flash, opts) {
  opts = opts || {};
  var amt = (opts.amt === undefined ? 0.012 : opts.amt) * (flash || 0);
  t.dx = (t.dx || 0) + (Math.random() - 0.5) * amt;
  t.dy = (t.dy || 0) + (Math.random() - 0.5) * amt;
  return t;
}

// Muted teal/green family for the net lines (hue h cycles slowly). `warm` (0..1)
// pulls it toward amber/gold (used for orbs). Kept low-saturation per the Alchemy rule.
function alcSetColor(a, h, warm, gain) {
  var rr = 0.5 + 0.5 * Math.cos(6.2832 * (h + 0.5 - 0.3 * warm));
  var gg = 0.5 + 0.5 * Math.cos(6.2832 * (h + 0.4 - 0.1 * warm));
  var bb = 0.5 + 0.5 * Math.cos(6.2832 * (h + 0.3 + 0.1 * warm));
  var l = (rr + gg + bb) / 3,
    sat = 0.78; // saturated -> colored fills (orbs) + multi-color traces
  a.r = (rr * sat + l * (1 - sat)) * gain;
  a.g = (gg * sat + l * (1 - sat)) * gain * (1 - 0.1 * warm);
  a.b = (bb * sat + l * (1 - sat)) * gain * (1 - 0.3 * warm);
}

// ── KIT COLORS ───────────────────────────────────────────────────────────────
// A PALETTE is a function colorize(a, idx) that sets a.r/g/b for element `idx` (triangle /
// spike number), using a.q8 as the slow hue-drift phase. Scenes PICK a palette and pass it to
// a motif, so color is composed at scene-assembly time — NOT hardcoded in the motif. This is
// what makes "single colour vs two colours" a scene CONFIG rather than a motif rewrite.
// alcPalette(spec):
//   base  — base hue (0..1)        step  — per-element hue offset:
//   sat   — saturation (muted <1)            0 = MONO (single colour), 0.5 = DUO (two tones),
//   gain  — brightness                       ~0.04 = multicolour SPREAD
//   cycle — if 0, q8 won't drift the hue (a fixed colour); default 1 (slow cycle)
function alcPalette(spec) {
  spec = spec || {};
  var base = spec.base || 0;
  var step = spec.step === undefined ? 0.5 : spec.step;
  var sat = spec.sat === undefined ? 0.78 : spec.sat;
  var gain = spec.gain === undefined ? 0.9 : spec.gain;
  var cycle = spec.cycle === undefined ? 1 : spec.cycle;
  return function (a, idx) {
    var h = base + (cycle ? a.q8 || 0 : 0) + (idx || 0) * step;
    var rr = 0.5 + 0.5 * Math.cos(6.2832 * h);
    var gg = 0.5 + 0.5 * Math.cos(6.2832 * (h + 0.33));
    var bb = 0.5 + 0.5 * Math.cos(6.2832 * (h + 0.67));
    var l = (rr + gg + bb) / 3;
    a.r = (rr * sat + l * (1 - sat)) * gain;
    a.g = (gg * sat + l * (1 - sat)) * gain;
    a.b = (bb * sat + l * (1 - sat)) * gain;
  };
}
// Named palettes scenes can grab directly off the kit (or build their own with alcPalette).
var ALC_PAL = {
  twoTone: alcPalette({ step: 0.5 }), // two complementary muted tones
  mono: alcPalette({ step: 0.0, sat: 0.72 }), // single drifting hue
  spread: alcPalette({ step: 0.04, sat: 0.82, gain: 1.0 }), // multicolour spread
  roseGreen: alcPalette({ step: 0.5, base: 0.28 }), // green ↔ magenta (the canonical anemone)
  redCyan: alcPalette({ step: 0.5, base: 0.0 }), // red ↔ cyan (the dahlia)
  warm: alcPalette({ base: 0.86, step: 0.04, sat: 0.78, gain: 0.95, cycle: 0 }), // amber/gold (base 0.86 in cosine wheel); row 0=amber, row 1=orange; no hue drift keeps contrast against teal nets
};

// ═══ COLOR BEHAVIOR KIT ═══════════════════════════════════════════════════════════
// SCHEME (which hues) = ALC_PAL above. BEHAVIOR (how they move/react) = these helpers,
// called in a scene's frame_eqs. See docs/alchemy-v2/color-motifs-reference.md.
//   The dominant Alchemy color scheme is COMPLEMENTARY TWO-TONE PING-PONG (green<->magenta /
//   green<->red), NOT a rainbow scroll. Drive ALC_PAL.roseGreen/redCyan with a SLOW alcHueClock
//   for the duo swing; use ALC_PAL.spread + a faster clock for the rainbow phases (A-C, I).

// CB1/CB2 — advance the shared hue accumulator (0..1). Slow base drift + optional energy
// coupling (louder = a little faster). Dedupes the `huePhase += dt*(...)` pattern repeated in
// every scene. base/gain in cycles-per-second-ish units. Returns the new hue.
function alcHueClock(hue, dt, energy, base, gain) {
  base = base === undefined ? 0.02 : base;
  gain = gain === undefined ? 0.05 : gain;
  return (hue + dt * (base + gain * (energy || 0))) % 1;
}

// CB9 — smoothed loudness envelope from the audio bands (for GATING saturation/brightness,
// never hue). Pass the frame `t`; returns ~0..2 (1 = nominal). Cheap per-frame, stateless.
function alcEnergy(t) {
  var b = t.bass_att || t.bass || 1,
    m = t.mid_att || t.mid || 1,
    r = t.treb_att || t.treb || 1;
  return (b + m + r) / 3;
}

// CB10 — beat-flash detector FACTORY. `var flash = alcBeatFlash();` then each frame
// `var f = flash(energy, dt)` returns a 0..1 value that JUMPS to 1 on a transient (energy
// spiking above its running average) and decays fast — multiply brightness by (1+k*f) or
// advance hue by f for the supernova re-bloom / axis flares. NOT a colour inversion.
function alcBeatFlash(opts) {
  opts = opts || {};
  var rise = opts.rise === undefined ? 1.22 : opts.rise; // ratio over running avg = a beat
  var decay = opts.decay === undefined ? 6.0 : opts.decay; // flash decay (per second)
  var avg = 1,
    level = 0;
  return function (energy, dt) {
    avg += (energy - avg) * Math.min(1, (dt || 0.016) * 3.0);
    if (energy > avg * rise) level = 1;
    level = Math.max(0, level - decay * (dt || 0.016));
    return level;
  };
}

// CB11 — STOCHASTIC "sample & hold + lerp" (Gemini's #1): the decoupled-layer idiom that
// beats a periodic LFO. Holds a RANDOM target in [lo,hi], re-rolls a new target every
// [minS,maxS] seconds (or when forceRoll is truthy — e.g. a beat), and exponentially eases
// the live value toward it. This is how Alchemy's layers feel "alive" rather than looping:
// random-pick-then-morph, each layer on its own irregular cadence. `ease` is per-second.
//   var bg = makeSH(0,1, 8,18); ... t.q14 = bg(t.time, dt);
function makeSH(lo, hi, minS, maxS, ease) {
  var val = (lo + hi) / 2,
    target = val,
    next = 0;
  return function (time, dt, forceRoll) {
    if (forceRoll || time >= next) {
      target = lo + Math.random() * (hi - lo);
      next = time + minS + Math.random() * (maxS - minS);
    }
    val += (target - val) * Math.min(1, (ease === undefined ? 1.3 : ease) * (dt || 0.016));
    return val;
  };
}

// MOTIF — one triangle whose 3 edges are the LIVE waveform displaced PERPENDICULAR
// (the jagged wireframe line). Drawn at head (q2,q3), radius q5, self-rotated by q9.
// Use one for a single-triangle scene, or two at 60deg apart for the hexagram star.
// (Kept one-triangle-per-wave: packing both in one wave draws a connector chord.)
function alcTriangle(rotOffset, hueOff) {
  return {
    baseVals: Object.assign({}, WAVE_BASE, {
      enabled: 1,
      samples: 512,
      additive: 1,
      usedots: 0,
      scaling: 1,
      smoothing: 0.1,
      a: 1.0,
      thick: 1, // thick=1 + brighter -> the net lines read clearly
    }),
    init_eqs: passthrough,
    frame_eqs: passthrough,
    point_eqs: function (a) {
      var hx = a.q2 !== undefined ? a.q2 : 0.5,
        hy = a.q3 !== undefined ? a.q3 : 0.5;
      var sz = a.q5 || 0.26,
        amp = a.q6 || 0.05,
        spin = a.q9 || 0;
      var s = a.sample * 3.0;
      var e = Math.floor(s);
      if (e >= 3) e = 2;
      var f = s - e;
      var a0 = rotOffset + spin + e * 2.0944;
      var a1 = rotOffset + spin + (e + 1) * 2.0944;
      var x0 = Math.cos(a0),
        y0 = Math.sin(a0),
        x1 = Math.cos(a1),
        y1 = Math.sin(a1);
      var vx = x0 + (x1 - x0) * f,
        vy = y0 + (y1 - y0) * f;
      var ex = x1 - x0,
        ey = y1 - y0,
        el = Math.hypot(ex, ey) || 1;
      var nx = -ey / el,
        ny = ex / el;
      var disp = (a.value1 || 0) * amp;
      a.x = hx + sz * vx + nx * disp;
      a.y = hy + sz * vy + ny * disp;
      alcSetColor(a, (a.q8 || 0) + hueOff, 0, 1.5);
      return a;
    },
  };
}

// MOTIF — a star of `tris` overlapping triangles (1 = triangle, 2 = Star of David).
// Returns an ARRAY of waves; spread into preset.waves.
function alcStarWaves(tris, hueOff) {
  var arr = [];
  for (var i = 0; i < tris; i++) arr.push(alcTriangle((i * 2.0944) / tris, hueOff + i * 0.4)); // distinct hue per triangle -> multi-color net
  return arr;
}

// MOTIF — N-gon: ONE configurable closed polygon drawn as a waveform wave. Generalizes
// alcTriangle (which is a hardcoded 3-gon). Builds the nested star-polygon MANDALA (ref
// 1:14–1:28) by stacking instances with different `sides` + counter-rotation. See
// docs/alchemy-v2/ngon-spec.md.
//   opts.sides       N (3..16). 3=triangle, 4=diamond, 8=octagon.
//   opts.radius      instance base radius fraction (multiplied by the global breathing scale q5).
//   opts.innerRatio  inner/outer radius ratio. >=1 (default) => regular polygon (N verts);
//                    <1 => N-POINT STAR (2N verts alternating outer/inner; ~0.6 is spiky).
//   opts.aspectX     horizontal stretch of the bounding box (1=circular, ~1.7=ref ellipse).
//                    The stretch is what makes the two bright "eye" nodes EMERGE at the L/R
//                    extremities (low-slope chords pile up additively) — they are not drawn.
//   opts.rotate      static phase offset (rad).
//   opts.dir         counter-rotation direction (+1/-1); spin = q9*dir + rotate.
//   opts.hueOff      hue offset added to the cycling q8.
// Driven by shared q-vars: q2,q3 center | q5 global breathing scale | q6 edge jaggedness
// (live waveform) | q8 hue phase | q9 spin base.
// Shared vertex math: place point `a` on STAR-POLYGON {N/skip} `poly` at parameter `local`
// (0..1 around the closed polyline), stretched by `aspectX`, jittered perpendicular by the
// live waveform. The polyline connects every `skip`-th of N vertices on a circle — skip=1 is a
// convex polygon (the outer envelope), skip>=2 makes long chords that span ACROSS the interior
// and cross through the center (the spirograph knot + the central density of the reference
// mandala). Pick skip coprime to N for one continuous path. Reads q2,q3 (center), q5 (breathing
// scale), q6 (jitter amp), q9 (spin base). Used by alcNgon and alcNgonPacked.
function ngonPoint(a, poly, local, aspectX) {
  var N = poly.sides || 4;
  var skip = poly.skip || 1;
  var scale = a.q5 !== undefined ? a.q5 : 1.0;
  var amp = a.q6 || 0.0;
  var spin = (a.q9 || 0) * (poly.dir === undefined ? 1 : poly.dir) + (poly.rotate || 0);
  var R = (poly.radius === undefined ? 0.3 : poly.radius) * scale;
  var s = local * N; // 0..N across the N chords of the {N/skip} path
  var e = Math.floor(s),
    f = s - e;
  var i0 = (e * skip) % N,
    i1 = ((e + 1) * skip) % N; // connect every skip-th vertex
  var ang0 = spin + (i0 / N) * 6.2832,
    ang1 = spin + (i1 / N) * 6.2832;
  var x0 = Math.cos(ang0) * R,
    y0 = Math.sin(ang0) * R;
  var x1 = Math.cos(ang1) * R,
    y1 = Math.sin(ang1) * R;
  var vx = x0 + (x1 - x0) * f,
    vy = y0 + (y1 - y0) * f;
  var ex = x1 - x0,
    ey = y1 - y0,
    el = Math.hypot(ex, ey) || 1;
  var nx = -ey / el,
    ny = ex / el; // perpendicular -> jagged waveform edges
  var disp = (a.value1 || 0) * amp;
  var cx = a.q2 !== undefined ? a.q2 : 0.5,
    cy = a.q3 !== undefined ? a.q3 : 0.5;
  a.x = cx + (vx + nx * disp) * aspectX; // aspectX stretches X only -> ellipse
  a.y = cy + (vy + ny * disp);
}

function alcNgon(opts) {
  opts = opts || {};
  var aspectX = opts.aspectX === undefined ? 1.0 : opts.aspectX;
  var hueOff = opts.hueOff || 0;
  return {
    baseVals: Object.assign({}, WAVE_BASE, {
      enabled: 1,
      samples: 512,
      additive: 1,
      usedots: 0,
      scaling: 1,
      smoothing: 0.1,
      a: 1.0,
      thick: 1,
    }),
    init_eqs: passthrough,
    frame_eqs: passthrough,
    point_eqs: function (a) {
      ngonPoint(a, opts, a.sample, aspectX);
      alcSetColor(a, (a.q8 || 0) + hueOff, 0, 1.3);
      return a;
    },
  };
}

// ONE wave that packs K polygons by slicing a.sample into K segments (the same trick
// alcTriangle uses to pack 3 edges into one wave). Lets the mandala have 10–12 polygons
// while staying within the ~6-wave cap (memory butterchurn-custom-wave-cap). The straight
// connector chord between packed polygons (and each polygon's closing edge) is BLANKED by
// setting a.a = 0 for the ~2 samples at each segment boundary, so no stray bridge is drawn.
function alcNgonPacked(polys, aspectX) {
  var K = polys.length;
  var seam = (2.0 * K) / 512; // ~2 samples (in per-polygon local units)
  return {
    baseVals: Object.assign({}, WAVE_BASE, {
      enabled: 1,
      samples: 512,
      additive: 1,
      usedots: 0,
      scaling: 1,
      smoothing: 0.1,
      a: 1.0,
      thick: 1,
    }),
    init_eqs: passthrough,
    frame_eqs: passthrough,
    point_eqs: function (a) {
      var gi = a.sample * K;
      var pi = Math.floor(gi);
      if (pi >= K) pi = K - 1;
      var local = gi - pi;
      var poly = polys[pi];
      ngonPoint(a, poly, local, aspectX);
      alcSetColor(a, (a.q8 || 0) + (poly.hueOff || 0), 0, 1.3);
      // EYE-NODE boost: chords crossing the L/R horizontal extremes (y≈center, |x| large) pile
      // up there — brighten them so the two focal "eyes" glow (tone-map keeps it from blowing out).
      var ny = 1 - Math.min(Math.abs(a.y - 0.5) / 0.1, 1);
      var nx = Math.min(Math.max((Math.abs(a.x - 0.5) - 0.18) / 0.22, 0), 1);
      var eye = 1 + 1.3 * ny * nx;
      // DENSITY TIER: tier-0 polygons (envelopes) always show; higher tiers fade in as the
      // energy gate q11 rises -> the lattice densifies on loud/structural passages.
      var tier = poly.tier || 0;
      var vis =
        tier === 0 ? 1 : sm01(((a.q11 === undefined ? 1 : a.q11) - (tier * 0.4 - 0.15)) / 0.3);
      var k = eye * vis;
      a.r *= k;
      a.g *= k;
      a.b *= k;
      a.a = local < seam || local > 1.0 - seam ? 0 : vis; // blank seams -> no bridge chord
      return a;
    },
  };
}

// MOTIF — the nested star-polygon MANDALA: a stack of N-gons with different `sides`, radii and
// counter-rotation, sharing one horizontal-ellipse envelope (aspectX). The overlapping
// low-slope chords at the L/R extremities pile up additively into the two bright "eye" nodes
// (emergent, not drawn). `dir` is a signed SPEED multiplier so layers counter-rotate at
// slightly different rates (the spirograph breathing). 12 polygons packed `perWave` to a wave.
// EVEN-N polygons sit rotate:0 so their angle-0/π vertices pile up at the L/R extremes
// (0.5 ± radius·aspectX, 0.5) → the bright "eye" nodes emerge there. ODD-N star-polygons keep
// small rotate offsets for spirograph variety (they have no clean L/R vertex pair anyway).
// tier: 0 = always on (outer envelopes + one anchor star), 1 = fades in at moderate energy,
// 2 = only on loud/structural passages -> the lattice densifies with the music (N-jump feel).
var ALC_MANDALA_SPECS = [
  { sides: 10, skip: 1, radius: 0.34, dir: 1.0, rotate: 0.0, hueOff: 0.0, tier: 0 }, // decagon — outer envelope
  { sides: 8, skip: 1, radius: 0.32, dir: -0.8, rotate: 0.0, hueOff: 0.12, tier: 0 }, // octagon — envelope
  { sides: 12, skip: 5, radius: 0.34, dir: 1.2, rotate: 0.0, hueOff: 0.24, tier: 0 }, // {12/5} — anchor crossing star
  { sides: 7, skip: 3, radius: 0.33, dir: -0.6, rotate: 0.3, hueOff: 0.4, tier: 1 }, // {7/3} — heptagram
  { sides: 9, skip: 4, radius: 0.34, dir: 0.9, rotate: 0.17, hueOff: 0.55, tier: 1 }, // {9/4} — near-diameter chords
  { sides: 5, skip: 2, radius: 0.32, dir: -1.1, rotate: 0.15, hueOff: 0.7, tier: 1 }, // {5/2} — pentagram
  { sides: 8, skip: 3, radius: 0.33, dir: 0.7, rotate: 0.0, hueOff: 0.05, tier: 1 }, // {8/3} — octagram
  { sides: 9, skip: 2, radius: 0.34, dir: -1.0, rotate: 0.12, hueOff: 0.46, tier: 2 }, // {9/2} — enneagram
  { sides: 10, skip: 3, radius: 0.33, dir: 1.1, rotate: 0.0, hueOff: 0.62, tier: 2 }, // {10/3} — decagram
  { sides: 6, skip: 1, radius: 0.35, dir: -0.5, rotate: 0.0, hueOff: 0.3, tier: 0 }, // hexagon — envelope
  { sides: 16, skip: 7, radius: 0.32, dir: 0.8, rotate: 0.0, hueOff: 0.78, tier: 2 }, // {16/7} — dense rim star
  { sides: 12, skip: 5, radius: 0.35, dir: -0.9, rotate: 0.0, hueOff: 0.18, tier: 2 }, // {12/5} — rotated overlay
];
function alcNgonStack(aspectX, specs, perWave) {
  specs = specs || ALC_MANDALA_SPECS;
  perWave = perWave || 2; // 12 specs / 2 = 6 packed waves (at the cap)
  var waves = [];
  for (var i = 0; i < specs.length; i += perWave) {
    waves.push(alcNgonPacked(specs.slice(i, i + perWave), aspectX));
  }
  return waves;
}

// MOTIF — the persistent DIAGONAL waveform line: a real oscilloscope line locked at a fixed
// angle, displaced perpendicular by the live waveform (the jagged "lightning" slice that
// recurs in the mandala (section_E) and the moiré "X" (section_F)). Its OWN motif so scenes
// compose it (one for the mandala, a crossing pair for the moiré). Opacity reads q10 so a
// scene can fade it INVERSELY to the mandala density — bright when the net collapses, subtle
// when the net is dense (per the reference: something always carries the rhythm).
//   angleRad — line tilt (e.g. 0.30 ≈ 17° off horizontal, bottom-left→top-right)
//   halfLen  — half length along the line (0.6 spans most of the frame)
//   amp      — perpendicular waveform displacement (jaggedness)
//   [r,g,b]  — base color (default pink-white)
function alcDiagonalLine(angleRad, halfLen, amp, r, g, b) {
  var ct = Math.cos(angleRad),
    st = Math.sin(angleRad);
  r = r === undefined ? 1.0 : r;
  g = g === undefined ? 0.72 : g;
  b = b === undefined ? 0.88 : b;
  return {
    baseVals: Object.assign({}, WAVE_BASE, {
      enabled: 1,
      samples: 512,
      additive: 1,
      usedots: 0,
      scaling: 1,
      smoothing: 0.03,
      a: 1.0,
      thick: 1,
    }),
    init_eqs: passthrough,
    frame_eqs: passthrough,
    point_eqs: function (a) {
      var s = a.sample * 2.0 - 1.0; // -1..1 along the line
      var disp = (a.value1 || 0) * amp; // perpendicular waveform -> jagged slice
      a.x = 0.5 + s * halfLen * ct - disp * st;
      a.y = 0.5 + s * halfLen * st + disp * ct;
      var la = a.q10 === undefined ? 1.0 : a.q10; // opacity (scene drives inverse to net density)
      a.r = r * la;
      a.g = g * la;
      a.b = b * la;
      a.a = la;
      return a;
    },
  };
}

// DRIVER — shared per-frame audio-routing for the Mandala (the scene's "behavior" layer, like
// alcNetFrame). Tracks a smoothed energy envelope and emits the q-vars the motifs read:
//   q2,q3 center | q5 breathing scale (COLLAPSES toward ~0 on quiet bars -> the dropout, leaving
//   only the diagonal) | q6 edge jaggedness | q8 hue drift | q9 spin | q10 diagonal opacity
//   (bright when the net collapses) | q11 density gate (rises with energy -> higher polygon tiers
//   fade in, the N-jump densification).
function alcMandalaFrame() {
  var lastT = 0,
    egyS = 1.0,
    q11s = 0.4;
  return function (t) {
    var bass = t.bass_att || t.bass || 1,
      mid = t.mid_att || t.mid || 1,
      treb = t.treb_att || t.treb || 1;
    var tm = t.time,
      dt = Math.min(0.1, Math.max(0, tm - lastT));
    lastT = tm;
    var egy = 0.6 * bass + 0.4 * mid; // overall energy (~0 silent, ~1 baseline, ~1.6 loud)
    egyS += (egy - egyS) * 0.15; // smooth so the collapse/bloom isn't jittery
    var lvl = Math.max(0, Math.min((egyS - 0.5) / 1.0, 1)); // 0..1 -> breathing scale
    var q11 = Math.max(0, Math.min((egyS - 0.6) / 0.9, 1)); // 0..1 -> density gate
    q11s += (q11 - q11s) * 0.08;
    t.q2 = 0.5;
    t.q3 = 0.5;
    t.q5 = 0.06 + 0.62 * lvl; // COLLAPSE to ~0.06 when quiet, bloom to ~0.68 loud
    t.q6 = 0.02 + 0.04 * Math.min(treb, 1.2); // jagged edge displacement (live waveform)
    t.q8 = (tm * 0.04) % 1; // slow hue drift
    t.q9 = tm * 0.5; // slow base spin (rad); per-layer dir scales/flips
    t.q10 = 0.5 + 0.5 * (1 - q11s); // diagonal opacity: full when net collapsed, half when dense
    t.q11 = q11s; // density tier gate
    return t;
  };
}

// KIT — RIBBON warp: each frame, the previous buffer is sampled from a position slightly
// AHEAD along the ribbon axis (uv + axis*push), so content appears to drift DOWN-LEFT (the
// reference's "dx/dy push along the ribbon axis"). The waveform line drawn each frame
// accumulates into a long diagonal streak as older copies pile up drifting away.
//   angle — ribbon axis direction (rad). push — per-frame offset (0.002..0.005).
function alcRibbonWarp(angle, push) {
  push = push || 0.003;
  var rc = Math.cos(angle).toFixed(5),
    rs = Math.sin(angle).toFixed(5);
  return (
    "shader_body {\n" +
    "vec2 puv = uv + vec2(" +
    rc +
    ", " +
    rs +
    ") * " +
    push.toFixed(5) +
    ";\n" +
    "ret = texture2D(sampler_main, puv).rgb * 0.955;\n" + // 0.955 multiplier = ~0.3s half-life @60fps
    "}\n"
  );
}

// KIT — RIBBON comp: dark near-black background + iridescent rainbow tint along the ribbon
// axis (matching the reference's cyan→green→magenta→gold gradient) + bloom + Reinhard.
// `angle` must match the warp angle so the tint aligns with the streak direction.
function alcRibbonComp(angle) {
  var rc = Math.cos(angle).toFixed(5),
    rs = Math.sin(angle).toFixed(5);
  // Magenta/green duotone palette: offsets (0, 0.42, -0.08) make t=0→MAGENTA, t=0.5→GREEN.
  // Standard (0,0.33,0.67) has no magenta at all — R and B peaks are never simultaneous.
  return (
    "vec3 rib_pal(float t){\n" +
    "return vec3(0.55)+vec3(0.45)*cos(6.2832*(t+vec3(0.0,0.42,-0.08)));\n" +
    "}\n" +
    "shader_body {\n" +
    "vec2 d = uv - 0.5; d.x *= resolution.x / resolution.y;\n" +
    "float ribX = d.x * " +
    rc +
    " + d.y * " +
    rs +
    ";\n" +
    "vec3 g = texture2D(sampler_main, uv).rgb;\n" +
    "vec3 bloom = (texture2D(sampler_blur1,uv).rgb+texture2D(sampler_blur2,uv).rgb)*0.5;\n" +
    "vec3 rib_tint = rib_pal(ribX * 1.2 + time * 0.05);\n" + // 1.2 = ~1.5 colors across ribbon; slow drift
    "float rib_lum = dot(g, vec3(0.33));\n" +
    "vec3 rib_col = mix(vec3(rib_lum), rib_tint, 0.70) * max(rib_lum, 0.0);\n" +
    "vec3 bg = vec3(0.02, 0.01, 0.03);\n" +
    "vec3 outc = bg + rib_col * 1.4 + g * 0.5 + bloom * 0.35;\n" +
    "ret = outc / (outc + vec3(0.85));\n" +
    "}\n"
  );
}

// MOTIF — one waveform RAY: a straight line of the live waveform through the head
// (q2,q3) at angle `rayOffset`, self-rotating by q9 (the "waveform lines rotating
// around the center axis"). Half-length q5, perpendicular displacement q6.
function alcRay(rayOffset, hueOff, lenScale) {
  lenScale = lenScale || 1.0;
  return {
    baseVals: Object.assign({}, WAVE_BASE, {
      enabled: 1,
      samples: 512,
      additive: 1,
      usedots: 0,
      scaling: 1,
      smoothing: 0.05,
      a: 1.0,
      thick: 1,
    }),
    init_eqs: passthrough,
    frame_eqs: passthrough,
    point_eqs: function (a) {
      var hx = a.q2 !== undefined ? a.q2 : 0.5,
        hy = a.q3 !== undefined ? a.q3 : 0.5;
      var len = (a.q5 || 0.26) * lenScale,
        amp = a.q6 || 0.05,
        spin = a.q9 || 0;
      var th = rayOffset + spin;
      var ct = Math.cos(th),
        st = Math.sin(th);
      var s = a.sample * 2.0 - 1.0; // -1..1 along the ray (through the head)
      var disp = (a.value1 || 0) * amp;
      a.x = hx + s * len * ct - disp * st;
      a.y = hy + s * len * st + disp * ct;
      alcSetColor(a, (a.q8 || 0) + hueOff, 0, 1.5);
      return a;
    },
  };
}

// MOTIF — `n` waveform rays evenly spaced around the head, rotating together (an
// asterisk of live-waveform lines). Returns an ARRAY of waves.
function alcRayWaves(n, hueOff, lenScale) {
  var arr = [];
  for (var i = 0; i < n; i++) arr.push(alcRay((i * 3.14159) / n, hueOff + i * 0.04, lenScale));
  return arr;
}

// MOTIF (BG8 net tunnel) — `n` DIAMETER-lines through center, all sharing the rotation
// angle q1 (set by the scene's frame_eqs) and evenly spread by π/n. Under a feedback
// TRACE the rotating lines sweep into a dense FAN crossing at center — the mechanism the
// user confirmed from the original (rotating lines + persistence, NOT a drawn shader). The
// scene supplies the rotation (q1), hue (q8) and the feedback camera (decay/zoom); this
// builder is just the seed primitive, so any scene can drop the fan in. Returns an ARRAY.
//   opts.len    half-length of each line (0..~0.7)
//   opts.jiggle live-waveform perpendicular displacement (0 = ruler-straight)
//   opts.sat    colour saturation (low = pale threads)
//   opts.alpha  per-line alpha (modest so the trace accumulates without blowing out)
//   opts.hueOff hue offset added to the cycling q8
function alcRotLines(n, opts) {
  n = n || 2;
  opts = opts || {};
  var len = opts.len === undefined ? 0.7 : opts.len;
  var jig = opts.jiggle === undefined ? 0.04 : opts.jiggle;
  var sat = opts.sat === undefined ? 0.55 : opts.sat;
  var alpha = opts.alpha === undefined ? 0.8 : opts.alpha;
  var hueOff = opts.hueOff || 0;
  var thick = opts.thick === undefined ? 0 : opts.thick; // 1 = fatter butterchurn line
  // parallel mode: the n lines share ONE angle but are offset perpendicular by `gap` -> a
  // single THICK band (vs. the default angular spread of n distinct lines around center).
  var parallel = opts.parallel || false;
  var gap = opts.gap === undefined ? 0.005 : opts.gap;
  // strobe: if set, the line is only STAMPED (visible) on frames where the scene's
  // strobeVar q-var is truthy -> the feedback buffer gets DISCRETE spaced spokes (gaps
  // between them) instead of a continuous swept fan. The scene pulses the q-var on a timer.
  var strobeVar = opts.strobeVar || null;
  var colorize = opts.colorize || null; // optional ALC_PAL palette; falls back to the cosine wheel
  function line(angOff, perpOff) {
    return {
      baseVals: Object.assign({}, WAVE_BASE, {
        enabled: 1,
        samples: 512,
        additive: 1,
        usedots: 0,
        scaling: 1,
        smoothing: 0.06,
        a: alpha,
        thick: thick,
      }),
      init_eqs: passthrough,
      frame_eqs: passthrough,
      point_eqs: function (a) {
        var th = (a.q1 || 0) + angOff;
        var ct = Math.cos(th),
          st = Math.sin(th);
        var s = a.sample * 2.0 - 1.0; // -1..1 along the diameter line
        var off = (a.value1 || 0) * jig + perpOff; // jig=0 -> plain straight line; perpOff = thickness offset
        a.x = 0.5 + s * len * ct - off * st;
        a.y = 0.5 + s * len * st + off * ct;
        if (colorize) {
          colorize(a, 0);
        } else {
          var h = (a.q8 || 0) + hueOff;
          var rr = 0.5 + 0.5 * Math.cos(6.2832 * h);
          var gg = 0.5 + 0.5 * Math.cos(6.2832 * (h + 0.33));
          var bb = 0.5 + 0.5 * Math.cos(6.2832 * (h + 0.67));
          var l = (rr + gg + bb) / 3;
          a.r = rr * sat + l * (1 - sat);
          a.g = gg * sat + l * (1 - sat);
          a.b = bb * sat + l * (1 - sat);
        }
        if (strobeVar) a.a = a[strobeVar] ? alpha : 0.0; // only stamp on strobe frames -> discrete spokes
        return a;
      },
    };
  }
  var arr = [];
  for (var i = 0; i < n; i++) {
    if (parallel)
      arr.push(line(0, (i - (n - 1) / 2) * gap)); // n parallel copies -> thick band
    else arr.push(line((i * Math.PI) / n, 0)); // n distinct lines spread around center
  }
  return arr;
}

// MOTIF (BG7 fountain/vortex) — a fine RADIAL live-waveform burst around center: each
// sample is a spoke whose radius = q9 (base) + q10*sample-value. On its own it's a spiky
// flower; under a feedback warp that streams outward it becomes a fountain pinwheel, or
// under an inward-spiral warp a vortex. The scene supplies q8 (hue), q9/q10 (radius/amp)
// and the feedback camera; this builder is the reusable seed. Returns ONE wave.
//   opts.useSecond use value2 instead of value1 (a second decorrelated copy for density)
//   opts.hueOff    hue offset added to q8
//   opts.sat       saturation (1 = vivid magenta/lime/cyan; lower = dustier)
//   opts.gain      brightness
//   opts.colorize  optional ALC_PAL palette (overrides the built-in spectral-spread coloring)
function alcRadialBurst(opts) {
  opts = opts || {};
  var useSecond = opts.useSecond || false;
  var hueOff = opts.hueOff || 0;
  var sat = opts.sat === undefined ? 1.0 : opts.sat;
  var gain = opts.gain === undefined ? 1.0 : opts.gain;
  var colorize = opts.colorize || null;
  return {
    baseVals: Object.assign({}, WAVE_BASE, {
      enabled: 1,
      samples: 512,
      additive: 1,
      usedots: 0,
      scaling: 1,
      smoothing: 0.04,
      a: 0.85,
      thick: 0,
    }),
    init_eqs: passthrough,
    frame_eqs: passthrough,
    point_eqs: function (a) {
      var ang = a.sample * 6.2832;
      var samp = useSecond ? (a.value2 !== undefined ? a.value2 : a.value1) : a.value1;
      var rad = (a.q9 || 0.04) + (a.q10 || 0.06) * (samp || 0);
      if (rad < 0.02) rad = 0.02;
      a.x = 0.5 + rad * Math.cos(ang);
      a.y = 0.5 + rad * Math.sin(ang);
      if (colorize) {
        colorize(a, 0);
      } else {
        var h = (a.q8 || 0) + hueOff + a.sample * 0.5; // hue varies around the ring
        var rr = 0.5 + 0.5 * Math.cos(6.2832 * h);
        var gg = 0.5 + 0.5 * Math.cos(6.2832 * (h + 0.33));
        var bb = 0.5 + 0.5 * Math.cos(6.2832 * (h + 0.67));
        var l = (rr + gg + bb) / 3;
        a.r = (rr * sat + l * (1 - sat)) * gain;
        a.g = (gg * sat + l * (1 - sat)) * gain;
        a.b = (bb * sat + l * (1 - sat)) * gain;
      }
      return a;
    },
  };
}

// MOTIF (BG9) — REFLECTED-WAVEFORM HORIZON ("waveform on water", section G1): the live audio
// waveform drawn as a near-horizontal line across the screen at horizon `cy`, plus a second
// copy MIRRORED about that horizon (same samples, opposite displacement) -> the on-water
// reflection. Returns an ARRAY of 2 waves. Scene may tilt the horizon via q13. Config:
//   opts.cy horizon y (0..1) | opts.amp waveform amplitude | opts.len half-span across width
//   opts.sat saturation | opts.alpha | opts.hueOff (hue from cycling q8) | opts.colorize (ALC_PAL)
function bgWaveHorizon(opts) {
  opts = opts || {};
  var cy = opts.cy === undefined ? 0.5 : opts.cy;
  var amp = opts.amp === undefined ? 0.12 : opts.amp;
  var len = opts.len === undefined ? 0.95 : opts.len;
  var sat = opts.sat === undefined ? 0.6 : opts.sat;
  var alpha = opts.alpha === undefined ? 0.8 : opts.alpha;
  var hueOff = opts.hueOff || 0;
  var colorize = opts.colorize || null;
  function horizonWave(mirror) {
    return {
      baseVals: Object.assign({}, WAVE_BASE, {
        enabled: 1,
        samples: 512,
        additive: 1,
        usedots: 0,
        scaling: 1,
        smoothing: 0.06,
        a: alpha,
        thick: 0,
      }),
      init_eqs: passthrough,
      frame_eqs: passthrough,
      point_eqs: function (a) {
        var s = a.sample * 2.0 - 1.0; // -1..1 across the width
        var tilt = a.q13 || 0; // optional horizon tilt (scene drives q13)
        var disp = (a.value1 || 0) * amp;
        a.x = 0.5 + s * len;
        a.y = cy + s * len * tilt + (mirror ? -disp : disp); // reflect displacement about horizon
        if (colorize) {
          colorize(a, mirror ? 1 : 0);
        } else {
          var h = (a.q8 || 0) + hueOff;
          var rr = 0.5 + 0.5 * Math.cos(6.2832 * h);
          var gg = 0.5 + 0.5 * Math.cos(6.2832 * (h + 0.33));
          var bb = 0.5 + 0.5 * Math.cos(6.2832 * (h + 0.67));
          var l = (rr + gg + bb) / 3;
          a.r = rr * sat + l * (1 - sat);
          a.g = gg * sat + l * (1 - sat);
          a.b = bb * sat + l * (1 - sat);
        }
        return a;
      },
    };
  }
  return [horizonWave(false), horizonWave(true)];
}

// MOTIF — an orb: a COLOR-FILLED glow disc with a THICK ring border, drawn at head (q2,q3),
// radius q7. Under a camera's feedback it leaves the receding trail of shrinking orbs.
//   fillHueOff   — fill hue offset (added to the cycling q8).
//   borderHueOff — outline hue offset: undefined => bright cool-WHITE ring; a number =>
//                  colored ring at (q8 + borderHueOff). Equal to fillHueOff = same color;
//                  fillHueOff+0.5 = complementary/contrast. (See alcOrb* wrappers below.)
function alcOrb(hueOff, borderHueOff) {
  return {
    baseVals: Object.assign({}, WAVE_BASE, {
      enabled: 1,
      samples: 512,
      additive: 1,
      usedots: 0,
      scaling: 1,
      smoothing: 0.0,
      a: 0.85,
      thick: 1, // thick=1 -> fatter, more visible ring
    }),
    init_eqs: passthrough,
    frame_eqs: passthrough,
    point_eqs: function (a) {
      var hx = a.q2 !== undefined ? a.q2 : 0.5,
        hy = a.q3 !== undefined ? a.q3 : 0.5;
      var rad = a.q7 || 0.05;
      if (a.sample < 0.55) {
        // FILL: dense sqrt-spiral -> solid colored disc
        var f = a.sample / 0.55;
        var rf = rad * Math.sqrt(f),
          af = f * 6.2832 * 14.0;
        a.x = hx + rf * Math.cos(af);
        a.y = hy + rf * Math.sin(af);
        alcSetColor(a, (a.q8 || 0) + hueOff, 0.85, 1.0); // warm amber/gold FILL
      } else {
        // BORDER: THICK ring band, DIFFERENT color
        var fb = (a.sample - 0.55) / 0.45;
        var rb = rad * (0.9 + 0.16 * fb); // spiral across an annulus 0.90..1.06 r = thick ring
        var ab = fb * 6.2832 * 6.0;
        a.x = hx + rb * Math.cos(ab);
        a.y = hy + rb * Math.sin(ab);
        if (borderHueOff !== undefined) {
          // colored outline (tracks the hue cycle)
          alcSetColor(a, (a.q8 || 0) + borderHueOff, 0.2, 2.2);
        } else {
          // default: bright cool-white ring
          a.r = 1.3;
          a.g = 1.55;
          a.b = 2.0;
        }
      }
      return a;
    },
  };
}

// Orb VARIATIONS (pick per scene): white ring, same-color ring, or contrast (complementary).
function alcOrbWhite(hueOff) {
  return alcOrb(hueOff);
} // colored fill + cool-white ring
function alcOrbSame(hueOff) {
  return alcOrb(hueOff, hueOff);
} // ring same hue as fill (mono glow)
function alcOrbContrast(hueOff) {
  return alcOrb(hueOff, hueOff + 0.5);
} // ring complementary hue (e.g. orange fill + blue ring)

function sm01(x) {
  x = x < 0 ? 0 : x > 1 ? 1 : x;
  return x * x * (3 - 2 * x);
}

// MOTIF — an EXPLICIT ROW of `n` distinct orbs receding into a corridor (Gemini's recipe):
// each orb sits at a flowing depth z (wrapping with q14 so the row is infinite) and is
// PERSPECTIVE-PROJECTED to an off-center vanishing point — so orbs bunch + shrink toward the
// VP exactly like real depth, and span the full corridor on frame 1. Drawn directly (NOT a
// feedback trail), so each orb is a crisp disc: colored fill + bright ring, fading into the
// dark at the VP. nearX/nearY = lateral position of the near (camera) end; vpx/vpy = the VP.
function alcOrbRow(n, fillHueOff, ringHueOff, nearX, nearY, vpx, vpy) {
  nearX = nearX === undefined ? 0.12 : nearX;
  nearY = nearY === undefined ? 0.5 : nearY;
  vpx = vpx === undefined ? 0.9 : vpx;
  vpy = vpy === undefined ? 0.5 : vpy;
  var K = 4.0; // perspective strength (FOV)
  return {
    // NON-additive (additive:0): a SOLID colored disc + bright ring just PAINT their color,
    // they can't accumulate to white no matter how bright -> filled colored orb, no blowout.
    baseVals: Object.assign({}, WAVE_BASE, {
      enabled: 1,
      samples: 512,
      additive: 0,
      usedots: 0,
      scaling: 1,
      smoothing: 0.0,
      a: 1.0,
      thick: 1,
    }),
    init_eqs: passthrough,
    frame_eqs: passthrough,
    point_eqs: function (a) {
      var seg = a.sample * n;
      var k = Math.floor(seg);
      if (k >= n) k = n - 1;
      var f = seg - k; // 0..1 within this orb
      var raw = k / n + (a.q14 || 0);
      raw = raw - Math.floor(raw); // flowing depth (wraps -> infinite row)
      var proj = 1.0 / (1.0 + K * raw);
      var jx = (a.value1 || 0) * 0.02;
      var ccx = (nearX + jx - vpx) * proj + vpx;
      var ccy = (nearY - vpy) * proj + vpy;
      var rad = Math.min((a.q7 || 0.1) * proj, 0.08); // bigger cap -> not too thin
      var fade = (1.0 - raw) * sm01(raw / 0.05); // bright near, fade into the dark VP
      var rl, ang;
      if (f < 0.62) {
        // FILL: dense spiral, SOFT gradient core
        var ff = f / 0.62;
        rl = rad * Math.sqrt(ff);
        ang = ff * 6.2832 * 16.0;
        a.r = 0.15;
        a.g = 0.3;
        a.b = 0.85; // deep-blue core (neon-tube look)
        a.a = 0.75 * fade * (1.0 - 0.85 * ff); // bright center -> transparent edge: blends, no harsh blob
      } else {
        // BORDER: bright cyan ring
        var fb = (f - 0.62) / 0.38;
        rl = rad * (0.92 + 0.12 * fb);
        ang = fb * 6.2832 * 3.0;
        a.r = 0.1;
        a.g = 1.0;
        a.b = 1.0; // bright cyan edge
        a.a = 0.9 * fade;
      }
      a.x = ccx + rl * Math.cos(ang);
      a.y = ccy + rl * Math.sin(ang);
      return a;
    },
  };
}

// MOTIF — an EXPLICIT corridor net: `nRings` concentric wavy rings drawn at flowing depths
// and PERSPECTIVE-PROJECTED to the right VP (same math as alcOrbRow), redrawn every frame so
// the mesh is crisp and controllable — NOT a busy feedback smear. The live waveform makes the
// rings wavy; q9 slowly spins them; q14 flows them toward the VP. Ring-to-ring connectors run
// radially -> they double as faint longitudinal corridor wires.
function alcMeshRings(nRings, hueOff) {
  var K = 4.0,
    vpx = 0.9,
    vpy = 0.5,
    nearX = 0.16,
    nearY = 0.5;
  return {
    baseVals: Object.assign({}, WAVE_BASE, {
      enabled: 1,
      samples: 512,
      additive: 1,
      usedots: 0,
      scaling: 1,
      smoothing: 0.25,
      a: 0.6,
      thick: 0,
    }),
    init_eqs: passthrough,
    frame_eqs: passthrough,
    point_eqs: function (a) {
      var s = a.sample * nRings;
      var k = Math.floor(s);
      if (k >= nRings) k = nRings - 1;
      var f = s - k; // 0..1 around this ring
      var raw = (k + 0.5) / nRings + (a.q14 || 0);
      raw = raw - Math.floor(raw); // flowing depth (wraps)
      var proj = 1.0 / (1.0 + K * raw);
      var ccx = (nearX - vpx) * proj + vpx; // ring center recedes to the VP
      var ccy = (nearY - vpy) * proj + vpy;
      var th = f * 6.2832 + (a.q9 || 0) * 0.15; // around the ring (slow spin)
      var jit = (a.value1 || 0) * 0.06; // waveform makes the ring wavy
      var R = ((a.q5 || 0.4) + jit) * proj; // ring radius shrinks with depth
      a.x = ccx + R * Math.cos(th);
      a.y = ccy + R * Math.sin(th);
      var fade = (1.0 - raw) * sm01(raw / 0.05); // bright near, fade into the dark VP
      alcSetColor(a, (a.q8 || 0) + hueOff, 0, 1.2 * fade);
      return a;
    },
  };
}

// MOTIF — the ANEMONE / STARBURST (README Motif C): a STARBURST of thin triangular SPIKES.
// Each spike is a thin triangle whose BASE sits on a small inner CIRCLE (the bases tile the
// circle -> the dark central eye) and whose APEX points OUTWARD, its length set by the LIVE
// waveform so the rim is spiky/jagged (the urchin fur). The wave traces one continuous
// zig-zag: base-left -> apex -> base-right -> next base-left ... so the ONLY connectors run
// along the inner base circle, NEVER between the outer peaks. Each spike a distinct COLOR;
// NON-additive so colors paint cleanly (no white pile-up). Spins (q9), pulses size on bass
// (q5), shears to a vortex on peaks (q10). Face-on ("flat" camera). Drawn at (q2,q3).
//   spikes   — number of tilted copies around the circle (~30). tilt = 2π/spikes; since the
//              base (24°) is WIDER than the tilt (12° at 30), consecutive triangles OVERLAP.
//   colorize — a PALETTE picked from the kit (alcPalette / ALC_PAL.*); sets each triangle's
//              colour by its index. Defaults to the two-tone palette.
function alcAnemone(spikes, colorize) {
  spikes = spikes || 30;
  colorize = colorize || ALC_PAL.twoTone;
  var baseHalf = 0.21; // FIXED ~12° -> base spans ~24° (independent of count)
  return {
    baseVals: Object.assign({}, WAVE_BASE, {
      enabled: 1,
      samples: 512,
      additive: 0,
      usedots: 0,
      scaling: 1,
      smoothing: 0.02,
      a: 0.85,
      thick: 0,
    }),
    init_eqs: passthrough,
    frame_eqs: passthrough,
    point_eqs: function (a) {
      var hx = a.q2 !== undefined ? a.q2 : 0.5,
        hy = a.q3 !== undefined ? a.q3 : 0.5;
      var R = a.q5 || 0.42,
        spin = a.q9 || 0,
        twist = a.q10 || 0,
        jag = a.q6 || 0.03;
      var innerR = R * 0.16; // base circle radius -> the dark central eye
      var tilt = 6.2832 / spikes; // rotation between successive copies (< base -> OVERLAP)
      var seg = a.sample * spikes;
      var k = Math.floor(seg);
      if (k >= spikes) k = spikes - 1;
      var f = seg - k; // 0..1 across THIS triangle
      var baseAng = k * tilt + spin;
      var aL = baseAng - baseHalf,
        aR = baseAng + baseHalf;
      var samp = a.value1 || 0;
      var spikeLen = R * (0.45 + 0.55 * Math.abs(samp)); // waveform sets apex length -> spiky rim (acute triangle)
      // CLOSED triangle (3 edges): base-left -> base-right (the base, on the inner circle) ->
      // apex (out) -> back to base-left. The base edges of all spikes draw the inner circle.
      var ang,
        r,
        onSide = 0;
      if (f < 0.34) {
        // BASE edge (along inner circle)
        var u = f / 0.34;
        ang = aL + (aR - aL) * u;
        r = innerR;
      } else if (f < 0.67) {
        // base-RIGHT -> APEX
        var u = (f - 0.34) / 0.33;
        ang = aR + (baseAng - aR) * u;
        r = innerR + spikeLen * u;
        onSide = 1;
      } else {
        // APEX -> base-LEFT (close the triangle)
        var u = (f - 0.67) / 0.33;
        ang = baseAng + (aL - baseAng) * u;
        r = innerR + spikeLen * (1 - u);
        onSide = 1;
      }
      if (onSide) ang += (samp * jag) / Math.max(r, 0.08); // live waveform makes the slanted EDGES jagged (the "sound wave")
      ang += twist * (r - innerR); // vortex shear: outer parts lean more
      a.x = hx + r * Math.cos(ang);
      a.y = hy + r * Math.sin(ang);
      colorize(a, k); // colour comes from the scene's palette (kit), keyed by spike index
      return a;
    },
  };
}

// MOTIF (variant) — ANEMONE built the OTHER way: full EQUILATERAL triangles centered on the
// SAME point (q2,q3) and overlapping, each rotated by a small tilt -> a star-polygon MANDALA
// with a natural center hole (the edges are chords at the inradius). Edges are jagged by the
// LIVE waveform (q6). NON-additive colored outlines (no white pile-up). Spins (q9), pulses
// size on bass (q5), shears on peaks (q10). The "overlap of equilateral triangles at the
// center" look, distinct from alcAnemone's base-on-a-circle starburst.
//   count    — number of overlapping triangles (~9).
//   colorize — a PALETTE picked from the kit (alcPalette / ALC_PAL.*); keyed by triangle index.
function alcTriMandala(count, colorize) {
  count = count || 9;
  colorize = colorize || ALC_PAL.twoTone;
  return {
    baseVals: Object.assign({}, WAVE_BASE, {
      enabled: 1,
      samples: 512,
      additive: 0,
      usedots: 0,
      scaling: 1,
      smoothing: 0.05,
      a: 0.82,
      thick: 1,
    }),
    init_eqs: passthrough,
    frame_eqs: passthrough,
    point_eqs: function (a) {
      var hx = a.q2 !== undefined ? a.q2 : 0.5,
        hy = a.q3 !== undefined ? a.q3 : 0.5;
      var sz = a.q5 || 0.4,
        amp = a.q6 || 0.04,
        spin = a.q9 || 0,
        twist = a.q10 || 0;
      var seg = a.sample * count;
      var ti = Math.floor(seg);
      if (ti >= count) ti = count - 1;
      var f = seg - ti; // 0..1 around THIS triangle
      var rot = spin + (ti * 6.2832) / count; // each equilateral triangle rotated about the shared center
      // Trace 5 segments: center->c0, c0->c1, c1->c2, c2->c0, c0->center. The two SPOKE
      // segments (center<->c0) are drawn at alpha 0 (invisible) so the connector between
      // triangles is a zero-length center->center hop -> NO chord between outer peaks.
      var sp = 0.05,
        E = (1 - 2 * sp) / 3; // spoke fraction + edge fraction
      var ax,
        ay,
        bx,
        by,
        u,
        isEdge = 0;
      function cxj(j) {
        return Math.cos(rot + j * 2.0944);
      }
      function cyj(j) {
        return Math.sin(rot + j * 2.0944);
      }
      if (f < sp) {
        u = f / sp;
        ax = 0;
        ay = 0;
        bx = cxj(0);
        by = cyj(0);
      } // center -> c0 (spoke)
      else if (f < sp + E) {
        u = (f - sp) / E;
        ax = cxj(0);
        ay = cyj(0);
        bx = cxj(1);
        by = cyj(1);
        isEdge = 1;
      } else if (f < sp + 2 * E) {
        u = (f - sp - E) / E;
        ax = cxj(1);
        ay = cyj(1);
        bx = cxj(2);
        by = cyj(2);
        isEdge = 1;
      } else if (f < sp + 3 * E) {
        u = (f - sp - 2 * E) / E;
        ax = cxj(2);
        ay = cyj(2);
        bx = cxj(0);
        by = cyj(0);
        isEdge = 1;
      } else {
        u = (f - sp - 3 * E) / sp;
        ax = cxj(0);
        ay = cyj(0);
        bx = 0;
        by = 0;
      } // c0 -> center (spoke)
      var vx = ax + (bx - ax) * u,
        vy = ay + (by - ay) * u;
      var px = sz * vx,
        py = sz * vy;
      if (isEdge) {
        // live waveform displaces the edge -> jagged triangle line
        var ex = bx - ax,
          ey = by - ay,
          el = Math.hypot(ex, ey) || 1;
        var disp = (a.value1 || 0) * amp;
        px = sz * vx + (-ey / el) * disp;
        py = sz * vy + (ex / el) * disp;
      }
      var rad = Math.hypot(vx, vy) || 1,
        sh = twist * (rad - 0.5);
      var cs = Math.cos(sh),
        sn = Math.sin(sh);
      a.x = hx + px * cs - py * sn;
      a.y = hy + px * sn + py * cs;
      a.a = isEdge ? 0.85 : 0.0; // spokes invisible -> connectors hidden
      colorize(a, ti); // colour from the scene's palette (kit), keyed by triangle index
      return a;
    },
  };
}

// MOTIF — SPINDLE / radial urchin: 512 samples sweep the full circle (ang = sample*2π); the
// radius at each sample = eye (dark center floor) + spike * abs(value1) → wherever the live
// waveform has energy, a bristle/spike protrudes. With additive mode the spiky ring glows;
// with moderate feedback (default warp, not ALC_CLEAR_WARP) the spikes leave a soft glow trail.
// This is the RING URCHIN geometry (circlewave-based), distinct from alcAnemone's triangle starburst.
// Reference: section_C3 "fine radial filaments" pulsar; r = eye + spike * abs(value1).
//   colorize — an ALC_PAL palette function, keyed by spike index (0=whole element; pass
//              a function that uses a.sample for hue variation over the ring).
// Q-var convention (same as alcAnemone):
//   q2,q3 = center | q5 = overall radius scale (breathing) | q8 = hue phase | q9 = spin
//   q10 = vortex shear (angular offset proportional to how far the bristle protrudes)
function alcSpindle(colorize) {
  colorize = colorize || ALC_PAL.twoTone;
  return {
    baseVals: Object.assign({}, WAVE_BASE, {
      enabled: 1,
      samples: 512,
      additive: 1,
      usedots: 0,
      scaling: 1,
      smoothing: 0.02,
      a: 0.8,
      thick: 1,
    }),
    init_eqs: passthrough,
    frame_eqs: passthrough,
    point_eqs: function (a) {
      var cx = a.q2 !== undefined ? a.q2 : 0.5,
        cy = a.q3 !== undefined ? a.q3 : 0.5;
      var R = a.q5 || 0.35; // radius scale (breathing scale from frame)
      var spin = a.q9 || 0;
      var twist = a.q10 || 0;
      var samp = Math.abs(a.value1 || 0); // abs waveform → bristle length (always +)
      // r = dark eye floor (15% of R, always present) + spike proportional to waveform energy
      var r = R * (0.15 + samp);
      var ang = a.sample * 6.2832 + spin;
      ang += twist * (r - R * 0.15); // vortex: protruding bristles curve into spiral
      a.x = cx + r * Math.cos(ang);
      a.y = cy + r * Math.sin(ang);
      colorize(a, 0);
      return a;
    },
  };
}

// KIT ELEMENT — TETHER: a thin jagged live-waveform line linking two points (the "lightning"
// strung between a flanking ORBITER PAIR, as in the canonical Pulsar). Endpoints are read from
// q-var FIELDS (e.g. "q21","q22" -> node A, "q23","q24" -> node B) that the scene's frame sets;
// `qamp` field is the displacement amplitude. One custom WAVE. colorize optional (kit palette);
// defaults to a cool-white bolt.
function alcTether(qax, qay, qbx, qby, qamp, colorize) {
  qamp = qamp || "q26";
  return {
    baseVals: Object.assign({}, WAVE_BASE, {
      enabled: 1,
      samples: 512,
      additive: 0,
      usedots: 0,
      scaling: 1, // NON-additive -> crisp bolt, no feedback bloom band
      smoothing: 0.03,
      a: 0.9,
      thick: 1,
      r: 0.72,
      g: 0.85,
      b: 1.0,
    }),
    init_eqs: passthrough,
    frame_eqs: passthrough,
    point_eqs: function (a) {
      var ax = a[qax] !== undefined ? a[qax] : 0.4,
        ay = a[qay] !== undefined ? a[qay] : 0.5;
      var bx = a[qbx] !== undefined ? a[qbx] : 0.6,
        by = a[qby] !== undefined ? a[qby] : 0.5;
      var dx = bx - ax,
        dy = by - ay,
        len = Math.hypot(dx, dy) || 1;
      var nx = -dy / len,
        ny = dx / len;
      // window the displacement to ZERO at both ends (sin(0)=sin(π)=0) so the bolt's tips land
      // EXACTLY on the two orbiter nodes (otherwise value1 at the ends floats them off-centre).
      var win = Math.sin(a.sample * 3.14159);
      var disp = (a.value1 || 0) * (a[qamp] || 0.03) * win; // live waveform -> jagged lightning, tied to the nodes
      a.x = ax + a.sample * dx + nx * disp;
      a.y = ay + a.sample * dy + ny * disp;
      if (colorize) colorize(a, 0);
      else {
        a.r = 0.72;
        a.g = 0.85;
        a.b = 1.0;
      }
      return a;
    },
  };
}

// KIT ELEMENT — ORBITER NODE: a glowing ringed disc (a "Saturn" orb) at a q-var position, used
// in flanking PAIRS joined by alcTether. Returns a WAVE — NOT a shape: Butterchurn positions a
// custom WAVE with invAspect ((2x-1)*invAspectx) but a custom SHAPE WITHOUT ((2x-1)), so a
// shape orb and the wave tether at the SAME (qx,qy) land at different screen points and the
// bolt won't touch the orb. As a wave it shares the tether's exact space -> always connected.
// (At node size a spiral-fill disc reads cleanly; the tube problem only bites at large scale.)
// The CENTRE is a bright warm-white (distinct from the trail); the RING takes a kit PALETTE
// keyed by q8, so the ring/halo (and its feedback trail) CYCLE colour. qr = radius field.
function alcOrbiterNode(qx, qy, qr, ringPal) {
  ringPal = ringPal || ALC_PAL.mono; // cycling single hue for the ring/halo
  qr = qr || "q25";
  return {
    baseVals: Object.assign({}, WAVE_BASE, {
      enabled: 1,
      samples: 256,
      additive: 0,
      usedots: 0,
      scaling: 1, // NON-additive -> paints, can't bloom to a white blob
      smoothing: 0.0,
      a: 0.9,
      thick: 1,
    }),
    init_eqs: passthrough,
    frame_eqs: passthrough,
    point_eqs: function (a) {
      var cx = a[qx] !== undefined ? a[qx] : 0.5,
        cy = a[qy] !== undefined ? a[qy] : 0.5;
      var rad = a[qr] || 0.04;
      if (a.sample < 0.62) {
        // FILL: dense sqrt-spiral -> bright white CORE (≠ trail)
        var f = a.sample / 0.62,
          rf = rad * Math.sqrt(f),
          af = f * 6.2832 * 16.0;
        a.x = cx + rf * Math.cos(af);
        a.y = cy + rf * Math.sin(af);
        a.r = 1.0;
        a.g = 0.96;
        a.b = 0.9;
      } else {
        // RING: cycling colour (palette via q8)
        var c = { q8: a.q8 };
        ringPal(c, 0);
        var fb = (a.sample - 0.62) / 0.38,
          rb = rad * (0.96 + 0.12 * fb),
          ab = fb * 6.2832 * 5.0;
        a.x = cx + rb * Math.cos(ab);
        a.y = cy + rb * Math.sin(ab);
        a.r = c.r;
        a.g = c.g;
        a.b = c.b;
      }
      return a;
    },
  };
}

// MOTIF — ONE explicit orb at a flowing depth (q14 + depthOffset), projected to the right VP.
// Each orb is its OWN wave: a dense spiral FILL + thick ring BORDER drawn with usedots:0, so
// it's a clean filled glow disc with NO connecting line to other orbs (the row is several of
// these at staggered depthOffsets). Fill/border colors as in alcOrb. Crisp, not a beam/dots.
function alcOrbAt(depthOffset, fillHueOff, borderHueOff) {
  var K = 4.0,
    vpx = 0.9,
    vpy = 0.5,
    nearX = 0.12,
    nearY = 0.5;
  return {
    baseVals: Object.assign({}, WAVE_BASE, {
      enabled: 1,
      samples: 256,
      additive: 1,
      usedots: 0,
      scaling: 1,
      smoothing: 0.0,
      a: 0.85,
      thick: 1,
    }),
    init_eqs: passthrough,
    frame_eqs: passthrough,
    point_eqs: function (a) {
      var raw = (a.q14 || 0) + depthOffset;
      raw = raw - Math.floor(raw); // this orb's flowing depth
      var proj = 1.0 / (1.0 + K * raw);
      var ccx = (nearX - vpx) * proj + vpx;
      var ccy = (nearY - vpy) * proj + vpy;
      var rad = Math.min((a.q7 || 0.1) * proj, 0.07);
      var fade = (1.0 - raw) * sm01(raw / 0.05);
      var rl, ang, isB;
      if (a.sample < 0.6) {
        // FILL: dense spiral disc
        var ff = a.sample / 0.6;
        rl = rad * Math.sqrt(ff);
        ang = ff * 6.2832 * 14.0;
        isB = false;
      } else {
        // BORDER: thick ring
        var fb = (a.sample - 0.6) / 0.4;
        rl = rad * (0.92 + 0.13 * fb);
        ang = fb * 6.2832 * 4.0;
        isB = true;
      }
      a.x = ccx + rl * Math.cos(ang);
      a.y = ccy + rl * Math.sin(ang);
      if (isB) {
        if (borderHueOff !== undefined) alcSetColor(a, (a.q8 || 0) + borderHueOff, 0.2, 1.6 * fade);
        else {
          a.r = 1.1 * fade;
          a.g = 1.3 * fade;
          a.b = 1.6 * fade;
        }
      } else {
        alcSetColor(a, (a.q8 || 0) + fillHueOff, 0.85, 0.7 * fade);
      }
      return a;
    },
  };
}

// MOTIF (custom SHAPES) — the comet/marching-orb trail done RIGHT: `count` real filled
// circles at flowing depths, projected to the right VP. Each is a native disc with a soft
// gradient core (center opaque -> edge transparent via a2=0, so it glows and blends) + a
// bright ring border, shrinking + fading into the distance. NOT a wave spiral (tube) and NOT
// additive (no white blowout). Returns an ARRAY for preset.shapes. q7 = base radius, q14 = flow.
// makeOrbTrailShapes(count, rows, colorize)
//   count    — total shape count (must be divisible by rows)
//   rows     — 1 or 2 parallel corridor tracks (default 2)
//   colorize — ALC_PAL palette fn for fill/border color (default ALC_PAL.spread)
//
// Each track recedes from the near HEAD toward the VP.  Pairs share depth, so
// at rows=2 the head is always a matched pair (top+bottom) at the same distance.
// q7=base radius, q14=flow, q19=time, q8=hue phase (from alcNetFrame).
function makeOrbTrailShapes(count, rows, colorize) {
  rows = rows || 2;
  colorize = colorize || ALC_PAL.spread;
  // K=1.4: spread orbs evenly rather than bunching at VP.  VP matches alcCamera("side").
  var K = 1.4,
    nearX = 0.14,
    vpx = 0.86,
    vpy = 0.62;
  // Per-row near-Y positions symmetric around the VP y.  rows=1 → single centred track.
  var nearYs = rows === 1 ? [0.42] : [0.26, 0.54]; // top then bottom track (wider separation)
  var perRow = count / rows; // depth steps per track
  var arr = [];
  for (var i = 0; i < count; i++) {
    (function (idx) {
      var row = idx % rows; // which track (0=top, 1=bottom)
      var depth = Math.floor(idx / rows); // depth index within track
      var nearY = nearYs[row];
      arr.push({
        baseVals: Object.assign({}, SHAPE_BASE, {
          enabled: 1,
          sides: 28,
          additive: 0,
          thickoutline: 1,
          textured: 0,
        }),
        init_eqs: passthrough,
        frame_eqs: function (s) {
          var raw = depth / perRow + (s.q14 || 0);
          raw = raw - Math.floor(raw); // 0..1 depth
          var proj = 1.0 / (1.0 + K * raw);
          var tm = s.q19 !== undefined ? s.q19 : s.time || 0;
          var wob = 0.05 * Math.sin(raw * 6.2832 * 1.3 + tm * 0.8) * proj;
          s.x = (nearX - vpx) * proj + vpx;
          s.y = (nearY - vpy) * proj + vpy + wob;
          s.rad = (s.q7 || 0.1) * proj * 0.65; // perspective shrink, no hard cap
          var fade = (1.0 - raw) * sm01(raw / 0.015); // dim far; tiny in-ramp hides recycle
          // apply the scene's palette for this row
          colorize(s, row); // sets s.r, s.g, s.b
          var cr = s.r,
            cg = s.g,
            cb = s.b;
          // head only (raw<0.15) gets a filled disc; trail positions are HOLLOW rings.
          // fillA goes to 1.0 at raw=0 so the head is fully opaque and stands out from the net.
          var fillA = Math.min(1.0, fade) * sm01((0.15 - raw) / 0.15);
          s.a = fillA;
          // bright warm center (r2/g2/b2 > r/g/b) makes the disc glow from inside out
          s.r2 = Math.min(1, cr * 2.2);
          s.g2 = Math.min(1, cg * 1.8);
          s.b2 = Math.min(1, cb * 2.0);
          s.a2 = fillA;
          // border ring: same hue, boosted so it reads as a bright ring outline
          s.border_r = Math.min(1.5, cr * 1.6 + 0.1);
          s.border_g = Math.min(1.5, cg * 1.6 + 0.1);
          s.border_b = Math.min(1.5, cb * 1.6 + 0.1);
          s.border_a = 0.9 * fade;
          return s;
        },
      });
    })(i);
  }
  return arr;
}

// ── Gradient Blob Orb (V17) ─────────────────────────────────────────────────
// Hot white/gold core + semi-transparent cyan/teal outer halo: the "small sun" look.
// Returns [outerShape, innerShape] — outer drawn first so inner sits on top.
// qxVar/qyVar: string q-var names holding the orb's live position ("q21", "q22" etc).
function alcOrbGradBlob(qxVar, qyVar, colorize) {
  colorize = colorize || ALC_PAL.mono;
  function layer(isInner) {
    return {
      baseVals: Object.assign({}, SHAPE_BASE, {
        enabled: 1,
        sides: 40,
        additive: 0,
        thickoutline: 0,
      }),
      init_eqs: passthrough,
      frame_eqs: function (s) {
        var cx = s[qxVar] !== undefined ? s[qxVar] : 0.5;
        var cy = s[qyVar] !== undefined ? s[qyVar] : 0.5;
        var br = (s.q7 || 0.07) * (1 + 0.4 * Math.max(0, (s.bass_att || 1) - 1));
        s.x = cx;
        s.y = cy;
        if (isInner) {
          s.rad = br * 0.55;
          s.r = 1.0;
          s.g = 0.92;
          s.b = 0.55;
          s.a = 0.92;
          s.r2 = 1.0;
          s.g2 = 0.98;
          s.b2 = 0.35;
          s.a2 = 1.0;
          s.border_r = 1.0;
          s.border_g = 0.8;
          s.border_b = 0.2;
          s.border_a = 0.65;
        } else {
          s.rad = br * 1.45;
          colorize(s, 0);
          s.b = Math.min(1, s.b * 1.6 + 0.2); // push toward cyan/teal
          s.a = 0.3;
          s.r2 = s.r * 0.15;
          s.g2 = s.g * 0.2;
          s.b2 = s.b * 0.45;
          s.a2 = 0.08;
          s.border_a = 0;
        }
        return s;
      },
    };
  }
  return [layer(false), layer(true)];
}

// ── Bullseye / Target Orb (V6/V14) ──────────────────────────────────────────
// n concentric rings in a single wave — sample range segmented into n bands.
// Outermost ring gets live waveform jitter for the subtle jagged edge.
function alcOrbTarget(qxVar, qyVar, n, colorize) {
  n = n || 2;
  colorize = colorize || ALC_PAL.mono;
  return {
    baseVals: Object.assign({}, WAVE_BASE, {
      enabled: 1,
      samples: 512,
      additive: 1,
      smoothing: 0.05,
      a: 0.85,
    }),
    init_eqs: passthrough,
    frame_eqs: passthrough,
    point_eqs: function (a) {
      var cx = a[qxVar] !== undefined ? a[qxVar] : 0.5;
      var cy = a[qyVar] !== undefined ? a[qyVar] : 0.5;
      var si = a.sample * n,
        k = Math.min(Math.floor(si), n - 1),
        f = si - k;
      var R = (a.q7 || 0.07) * (0.65 + k * 0.5) + (k === n - 1 ? 0.012 * (a.value1 || 0) : 0);
      a.x = cx + R * Math.cos(f * 6.2832);
      a.y = cy + R * Math.sin(f * 6.2832);
      colorize(a, k);
      if (k === n - 1) a.r = Math.min(1.5, a.r * 1.3 + 0.2); // warm accent on outermost
      return a;
    },
  };
}

// ── Feathery Ring (V12) ──────────────────────────────────────────────────────
// Large centered ring with radial filament spokes driven by live audio waveform.
// Segments: 0..0.5 = inner layer (short spokes), 0.5..1.0 = outer (longer spokes).
// Ring breathes with bass; spokes flutter with value1; slow rotation via q9.
function alcOrbFeathery(cx, cy, colorize) {
  cx = cx !== undefined ? cx : 0.5;
  cy = cy !== undefined ? cy : 0.5;
  colorize = colorize || ALC_PAL.mono;
  return {
    baseVals: Object.assign({}, WAVE_BASE, {
      enabled: 1,
      samples: 512,
      additive: 1,
      smoothing: 0.25,
      a: 0.65,
    }),
    init_eqs: passthrough,
    frame_eqs: passthrough,
    point_eqs: function (a) {
      var R0 = (a.q5 || 0.2) + 0.05 * Math.max(0, (a.bass_att || 1) - 1);
      var isOuter = a.sample >= 0.5;
      var f = isOuter ? (a.sample - 0.5) * 2 : a.sample * 2;
      var th = f * 6.2832 + (a.q9 || 0) * 0.06;
      var spk = (isOuter ? 0.08 : 0.04) * (a.value1 || 0);
      a.x = cx + (R0 + spk) * Math.cos(th);
      a.y = cy + (R0 + spk) * Math.sin(th);
      colorize(a, isOuter ? 1 : 0);
      a.a = isOuter ? 0.5 : 0.72;
      return a;
    },
  };
}

// ── Fine Dotted Trail (V5 sub-element) ───────────────────────────────────────
// Sparse dots marching the same corridor geometry as makeOrbTrailShapes.
// usedots:1 + low sample count (96) = clearly visible individual dots.
// Must share rows/nearYs with makeOrbTrailShapes for the paths to coincide.
function alcOrbDotTrail(rows, colorize) {
  rows = rows || 2;
  colorize = colorize || ALC_PAL.warm;
  var K = 1.4,
    nearX = 0.14,
    vpx = 0.86,
    vpy = 0.62;
  var nearYs = rows === 1 ? [0.42] : [0.26, 0.54];
  return {
    baseVals: Object.assign({}, WAVE_BASE, {
      enabled: 1,
      samples: 96,
      additive: 1,
      usedots: 1,
      smoothing: 0,
      a: 0.55,
    }),
    init_eqs: passthrough,
    frame_eqs: passthrough,
    point_eqs: function (a) {
      var row = rows === 2 && a.sample >= 0.5 ? 1 : 0;
      var t = rows === 2 ? (row === 0 ? a.sample * 2 : (a.sample - 0.5) * 2) : a.sample;
      var nearY = nearYs[row];
      var raw = t + (a.q14 || 0);
      raw = raw - Math.floor(raw);
      var proj = 1.0 / (1.0 + K * raw);
      var tm = a.q19 !== undefined ? a.q19 : a.time || 0;
      var wob = 0.04 * Math.sin(raw * 6.2832 * 1.3 + tm * 0.8) * proj;
      a.x = (nearX - vpx) * proj + vpx;
      a.y = (nearY - vpy) * proj + vpy + wob;
      colorize(a, row);
      var fade = (1.0 - raw) * sm01(raw / 0.02);
      a.r *= 0.65 * fade;
      a.g *= 0.65 * fade;
      a.b *= 0.65 * fade;
      return a;
    },
  };
}

// ── Dot Columns (V10) ────────────────────────────────────────────────────────
// Two vertical columns of hollow ring glyphs marching downward (marching speed
// driven by q19 time clock). Returns countPerCol*2 shapes to concat to preset.shapes.
function alcOrbDotColumns(countPerCol, colorize) {
  countPerCol = countPerCol || 6;
  colorize = colorize || ALC_PAL.twoTone;
  var cols = [0.38, 0.62];
  var shapes = [];
  for (var c = 0; c < 2; c++) {
    for (var i = 0; i < countPerCol; i++) {
      (function (colX, idx, colIdx) {
        shapes.push({
          baseVals: Object.assign({}, SHAPE_BASE, {
            enabled: 1,
            sides: 40,
            additive: 0,
            thickoutline: 1,
          }),
          init_eqs: passthrough,
          frame_eqs: function (s) {
            var tm = s.q19 !== undefined ? s.q19 : s.time || 0;
            var yOff = (idx / countPerCol + tm * 0.05) % 1.0;
            s.x = colX;
            s.y = yOff;
            s.rad = 0.022 + 0.006 * Math.max(0, (s.bass_att || 1) - 1);
            colorize(s, colIdx);
            var fade = sm01(Math.min(yOff / 0.06, 1)) * sm01(Math.min((1 - yOff) / 0.06, 1));
            s.a = 0;
            s.a2 = 0;
            s.border_r = Math.min(1, s.r * 1.5 + 0.1);
            s.border_g = Math.min(1, s.g * 1.5 + 0.1);
            s.border_b = Math.min(1, s.b * 1.5 + 0.1);
            s.border_a = fade * 0.85;
            return s;
          },
        });
      })(cols[c], i, c);
    }
  }
  return shapes;
}

// Shared per-frame driver for net scenes: cycles hue, accumulates the star's
// self-spin, sets the motif q-vars, and breathes zoom on the beat. `headFn(time,
// beat)` returns the [x,y] head position (camera-specific: centered for top,
// left for side). `baseZoom` is the camera's resting feedback zoom.
function alcNetFrame(headFn, baseZoom) {
  var hue = 0,
    lastT = 0,
    spin = 0,
    march = 0;
  return function (t) {
    var bass = t.bass_att || t.bass || 1,
      mid = t.mid_att || t.mid || 1,
      treb = t.treb_att || t.treb || 1;
    var tm = t.time,
      dt = Math.min(0.1, Math.max(0, tm - lastT));
    lastT = tm;
    var bn = Math.max(0, Math.min(bass - 1, 1));
    hue = (hue + dt * (0.02 + 0.05 * ((bass + mid) / 2))) % 1;
    spin = spin + dt * (1.25 + 0.8 * bn); // lively spin (trace kept sparse via short decay)
    march = march + dt * (0.04 + 0.05 * bn); // SLOW orb-row flow -> circles read separately as they crawl
    var hp = headFn(tm, bn);
    t.q2 = hp[0];
    t.q3 = hp[1];
    t.q5 = 0.38 + 0.06 * bn; // star radius (bigger -> fills frame, less blank space)
    t.q6 = 0.03 + 0.11 * Math.min(0.6 * treb + 0.5 * mid, 2.0); // edge jaggedness (live waveform)
    t.q7 = 0.11 + 0.035 * bn; // orb radius (big enough to read as the marching row)
    t.q8 = hue; // hue phase
    t.q9 = spin; // star self-rotation
    t.q14 = march; // orb-row march phase
    t.q19 = tm; // time clock (orb-trail wavy path)
    t.zoom = baseZoom - 0.025 * bn; // beats deepen the dive
    return t;
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// BATTERY KIT — shared vocabulary for the WMP "Battery" family (smoke or water?,
// the world, elektrination, sleepyspray, strawberryaid, relatively calm, sepiaswirl).
//
// Battery DNA (measured + frame-analysed; see memory battery-family-scene-architecture):
// a CENTER-anchored FEEDBACK family — one breathing central figure (burst / vortex /
// anemone) that PULSES (not spawns) over heavy decay trails, with a real-audio WAVEFORM
// thread woven through it, fine treble SPECKLE, a soft corner VIGNETTE, and a dark central
// eye. Colour is MUTED (never neon; always tone-map). Crucially it OPENS in a different hue
// (usually green) for ~2-3s then HOLDS a fixed hue — a one-shot INTRO RAMP, NOT the
// perpetual sin() cycle the old code used.
//
// Additive only (no existing symbol touched). Generic terms (vignette/speckle/glow/kaleido-
// quad) are reusable by any family; smoke-vortex/spray-fountain/intro-ramp are Battery-flavoured.
// ═══════════════════════════════════════════════════════════════════════════

// alcVignette(strength) — soft 4-corner dark vignette. GLSL snippet to splice into a comp
// shader_body AFTER `ret` is set (reads uv/resolution/ret). strength ~0.3 subtle .. 0.85 heavy.
// Braced so its locals never collide. Was previously re-inlined per preset.
function alcVignette(strength) {
  var s = (strength === undefined ? 0.5 : strength).toFixed(3);
  return (
    "{ vec2 vgd = uv - 0.5; vgd.x *= resolution.x/resolution.y;\n" +
    "  ret *= 1.0 - " +
    s +
    " * smoothstep(0.28, 0.95, length(vgd)); }\n"
  );
}

// alcSpeckle(colGlsl, density, cellPx, maskGlsl) — granular treble-driven SPARKLE (metallic
// dust / particulate). GLSL snippet spliced AFTER `ret` in a comp; needs NOISE_GLSL (hash21)
// prepended. colGlsl = vec3 string (dust colour); density 0..~0.3 (higher = more dust); cellPx
// = grain cell size in px (~3 fine .. 6 coarse); maskGlsl (optional) = a float factor to gate
// the dust (e.g. "lum" to sparkle only on bright bands — caller must have defined it). Twinkles
// via floor(time*8). Battery signature (elektrination / the-world / sleepyspray edges).
function alcSpeckle(colGlsl, density, cellPx, maskGlsl) {
  var thr = (1.0 - (density === undefined ? 0.12 : density)).toFixed(3);
  var cp = (cellPx === undefined ? 3.0 : cellPx).toFixed(1);
  return (
    "{ vec2 spc = floor(uv*resolution/" +
    cp +
    ") + floor(time*8.0);\n" +
    "  float spk = step(" +
    thr +
    ", hash21(spc));\n" +
    "  ret += (" +
    colGlsl +
    ") * spk * (0.25 + 0.6*treb) * (" +
    (maskGlsl || "1.0") +
    "); }\n"
  );
}

// alcGlowDisc(coreGlsl, edgeGlsl, radius) — a centered radial GLOW DISC: a tight bright core
// (coreGlsl) + a broad warm halo (edgeGlsl), additive. GLSL snippet spliced AFTER `ret`
// (reads uv/resolution/ret). radius ~0.2..0.5 = halo extent. The soft bloom behind sepiaswirl
// and strawberryaid's white-hot core.
function alcGlowDisc(coreGlsl, edgeGlsl, radius) {
  var R = (radius === undefined ? 0.35 : radius).toFixed(3);
  return (
    "{ vec2 ggd = uv - 0.5; ggd.x *= resolution.x/resolution.y;\n" +
    "  float ggr = length(ggd)/" +
    R +
    ";\n" +
    "  float gcore = exp(-ggr*ggr*6.0);\n" +
    "  float ghalo = exp(-ggr*ggr*1.5);\n" +
    "  ret += (" +
    coreGlsl +
    ") * gcore + (" +
    edgeGlsl +
    ") * ghalo * 0.5; }\n"
  );
}

// ALC_KALEIDOQUAD_GLSL — QUAD (vertical+horizontal bilateral) kaleidoscope fold: reflect across
// BOTH axes, then subdivide each quadrant into `folds` mirrored wedges. Returns folded centered
// coords; sample the feedback/field at the result for a mirror-symmetric frond-star
// (elektrination). Distinct from kit's alcKaleido (single rotational n-fold) — this is the
// bilateral V+H variant the family wants. Prepend before a shader_body that calls alcKaleidoQuad.
var ALC_KALEIDOQUAD_GLSL =
  "vec2 alcKaleidoQuad(vec2 d, float folds){\n" +
  "  d = abs(d);\n" + // reflect across BOTH axes -> the V+H quad mirror
  "  float ka = atan(d.y, d.x);\n" + // 0..PI/2 within one quadrant
  "  float kr = length(d);\n" +
  "  float kseg = 1.5708/folds;\n" + // subdivide the quadrant into `folds` mirrored wedges
  "  ka = abs(ka - kseg*floor(ka/kseg + 0.5));\n" +
  "  return kr*vec2(cos(ka), sin(ka));\n" +
  "}\n";

// alcSmokeVortex(opts) — the greyscale fbm SMOKE-WHIRLPOOL engine shared by the-world,
// smoke-or-water? and my-tornado. Returns {warp, comp} strings to spread into build()'s opts
// (it prepends its own NOISE_GLSL — caller adds nothing). A bright additive source wave drawn
// by the preset is what the vortex smears into smoke. opts:
//   eyeX/eyeY  vortex center (default 0.5/0.5)
//   swirl      rotational strength near the eye (default 0.06; 0 = no swirl)
//   pull       inward feedback factor <1 (default 0.992; 1.0 = pure cartesian stir, no vortex)
//   floor      vec3 dark-floor colour string; tint = vec3 bright-wisp colour string
//   vignette   0..1 corner darkening; speckle 0..~0.2 treble dust
// MONOCHROME luma ramp + treble speckle on bright bands + vignette + Reinhard tone-map.
function alcSmokeVortex(opts) {
  opts = opts || {};
  var ex = (opts.eyeX === undefined ? 0.5 : opts.eyeX).toFixed(3);
  var ey = (opts.eyeY === undefined ? 0.5 : opts.eyeY).toFixed(3);
  var sw = (opts.swirl === undefined ? 0.06 : opts.swirl).toFixed(3);
  var pull = (opts.pull === undefined ? 0.992 : opts.pull).toFixed(4);
  var floorc = opts.floor || "vec3(0.05,0.05,0.06)";
  var tint = opts.tint || "vec3(0.88,0.89,0.92)";
  var vig = opts.vignette === undefined ? 0.5 : opts.vignette;
  var spk = opts.speckle === undefined ? 0.1 : opts.speckle;
  var cloud = (opts.cloud === undefined ? 0.85 : opts.cloud).toFixed(3); // procedural cloud density
  var eye = opts.eye === undefined ? 0 : opts.eye; // dark-eye radius (0 = no eye, e.g. smoke-or-water)
  var toneK = (opts.toneK === undefined ? 0.7 : opts.toneK).toFixed(3); // Reinhard knee
  // carve the dark central eye when requested
  var eyeLine =
    eye > 0
      ? "  lum *= smoothstep(" + (eye * 0.18).toFixed(4) + ", " + eye.toFixed(3) + ", ar);\n"
      : "";
  // optional radius-dependent COUNTER-ROTATION shear: inner core spins one way, outer layer the
  // other (the "vortex shear" of the-world). opts.shear = the boundary radius (0 = uniform swirl).
  var shear = opts.shear === undefined ? 0 : opts.shear;
  // optional concentric RING (radiating band) modulation of the cloud — the satellite-storm shells.
  var rings = opts.rings === undefined ? 0 : opts.rings;
  var ringExpr =
    rings > 0 ? " * (1.0 - " + rings.toFixed(3) + "*(0.5+0.5*sin(ar*26.0 - time*1.6)))" : "";
  // cloud advection: counter-rotating shear (the-world), uniform swirl (vortex), or cartesian drift
  var rotateCloud = opts.rotateCloud === undefined ? true : opts.rotateCloud;
  var cloudLines = !rotateCloud
    ? "  float dens = fbm(dd*4.5 + vec2(time*0.06, -time*0.04))" + ringExpr + ";\n" // cartesian drift, no vortex
    : shear > 0
      ? "  float spin = mix(1.0, -1.0, smoothstep(" +
        (shear - 0.05).toFixed(3) +
        ", " +
        (shear + 0.05).toFixed(3) +
        ", ar));\n" + // inner vs outer COUNTER-rotate
        "  float aa = atan(dd.y, dd.x) + spin*time*0.26;\n" +
        "  vec2 csw = vec2(cos(aa), sin(aa))*ar;\n" +
        "  float dens = fbm(csw*4.5 + time*0.05)" +
        ringExpr +
        ";\n"
      : "  float aa = atan(dd.y, dd.x) + time*0.12 + 0.6/(ar+0.18);\n" +
        "  vec2 csw = vec2(cos(aa), sin(aa))*ar;\n" +
        "  float dens = fbm(csw*4.5 + time*0.05)" +
        ringExpr +
        ";\n";
  var saExpr =
    shear > 0
      ? sw + " * clamp((" + shear.toFixed(3) + " - sr)*7.0, -1.0, 1.0) / (sr + 0.12)"
      : sw + "/(sr + 0.12)";
  return {
    warp:
      NOISE_GLSL +
      "shader_body {\n" +
      "  vec2 ec = vec2(" +
      ex +
      "," +
      ey +
      ");\n" +
      "  vec2 sd = uv - ec;\n" +
      "  float sr = length(sd);\n" +
      "  float sa = " +
      saExpr +
      ";\n" + // swirl stronger near the eye (or counter-rotation shear if opts.shear set)
      "  float cs = cos(sa), sn = sin(sa);\n" +
      "  vec2 rot2 = vec2(sd.x*cs - sd.y*sn, sd.x*sn + sd.y*cs);\n" +
      "  vec2 p = ec + rot2*" +
      pull +
      ";\n" + // slight inward pull toward the eye
      "  float n = fbm(uv*3.0 + vec2(time*0.05, -time*0.04));\n" +
      "  float n2 = fbm(uv*3.0 + 7.3 - time*0.03);\n" +
      "  p += (vec2(n, n2) - 0.5) * (0.018 + 0.03*bass);\n" + // turbulent stir, bass-driven (big billows)
      "  ret = texture2D(sampler_main, p).rgb;\n" +
      "  ret -= 0.0018;\n" + // dissipate (controls trail length in this build)
      "}\n",
    comp:
      NOISE_GLSL +
      "shader_body {\n" +
      "  vec3 c = texture2D(sampler_main, uv).rgb;\n" +
      "  float fb = dot(c, vec3(0.4));\n" + // audio-reactive feedback streaks
      "  vec2 dd = uv - vec2(" +
      ex +
      "," +
      ey +
      ");\n" +
      "  dd.x *= resolution.x/resolution.y;\n" +
      "  float ar = length(dd);\n" +
      cloudLines + // rotating procedural cloud, or cartesian drift if rotateCloud:false
      "  dens = smoothstep(0.30, 0.95, dens);\n" + // bands of cloud vs darker veins
      "  float lum = clamp(dens*" +
      cloud +
      "*(0.7+0.5*bass) + fb*1.3, 0.0, 1.0);\n" +
      eyeLine +
      "  vec3 col = mix(" +
      floorc +
      ", " +
      tint +
      ", lum);\n" +
      "  ret = col;\n" +
      alcSpeckle(tint, spk, 3.0, "lum") +
      alcVignette(vig) +
      "  ret = ret/(ret + vec3(" +
      toneK +
      "));\n" + // Reinhard -> soft, never blown white
      "}\n",
  };
}

// alcSprayFountain(opts) — a directional FAN of fine real-waveform filaments from an anchor.
// A custom-wave factory (one of the 4 wave slots): the 512 samples are splayed across `spread`
// radians around `dir`, each pushed out from (cx,cy) by |value1| for the feathered spray
// (relatively-calm's bottom fountain; any directional burst). opts: cx/cy anchor (default
// 0.5/0.85), dir radians (default -1.5708 = straight up in wave-space), spread (default 1.4),
// reach (default 0.5), r/g/b colour. Real-waveform displacement per the family waveform rule.
function alcSprayFountain(opts) {
  opts = opts || {};
  var cx = opts.cx === undefined ? 0.5 : opts.cx;
  var cy = opts.cy === undefined ? 0.85 : opts.cy;
  var dir = opts.dir === undefined ? -1.5708 : opts.dir;
  var spread = opts.spread === undefined ? 1.4 : opts.spread;
  var reach = opts.reach === undefined ? 0.5 : opts.reach;
  return {
    baseVals: Object.assign({}, WAVE_BASE, {
      enabled: 1,
      samples: 512,
      additive: 1,
      usedots: 0,
      scaling: 1,
      smoothing: 0.06,
      a: 0.85,
      r: opts.r === undefined ? 0.85 : opts.r,
      g: opts.g === undefined ? 0.92 : opts.g,
      b: opts.b === undefined ? 0.95 : opts.b,
    }),
    init_eqs: passthrough,
    frame_eqs: passthrough,
    point_eqs: function (a) {
      var s = a.sample; // 0..1 across the fan
      var ang = dir + (s - 0.5) * spread;
      var v = Math.abs(a.value1 || 0);
      var rad = reach * (0.12 + 0.88 * v); // filaments crawl out from near the anchor
      a.x = cx + rad * Math.cos(ang);
      a.y = cy + rad * Math.sin(ang);
      return a;
    },
  };
}

// alcIntroRamp(durSec) — one-shot 0->1 ramp over the first `durSec` seconds after the preset
// first renders, then HOLDS 1 (captures spawn time lazily on the first frame). The structural
// Battery INTRO trait: blend an intro hue/look toward the settled one by this value, instead of
// the perpetual sin() cycle the old code used. Fires once per page-load; does not re-arm on
// preset re-selection — acceptable for the WMP intro feel.
function alcIntroRamp(durSec) {
  var t0 = -1;
  var dur = durSec === undefined ? 2.5 : durSec;
  return function (t) {
    var now = t && t.time !== undefined ? t.time : 0;
    if (t0 < 0) t0 = now;
    var e = (now - t0) / dur;
    return e >= 1 ? 1 : e < 0 ? 0 : e;
  };
}
