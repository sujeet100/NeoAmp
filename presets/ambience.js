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
          t.q1 = t.time * 0.13; // the CROSS rotates CCW (slow -> broad smooth blades, not many thin copies)
          t.q5 = 0.72; // half-length (reaches the edges)
          // Waveform amplitude (the jaggedness). KEPT SMALL and CAPPED: each of the 512
          // samples is its own strand, so a big amplitude fans the bolt into a chaotic
          // dandelion on loud beats (the original keeps a few broad arms). Small + capped
          // -> the strands collapse toward one clean wavy bolt; the swirl makes the arms.
          t.q6 = 0.03 + 0.045 * Math.min(0.5 * treb + 0.5 * mid, 1.2);
          t.q7 = 0.06 + 0.04 * bass; // gentle S-bend depth (the broad arc, not the jaggedness)
          // The WHITE crossing bolt APPEARS on beats and fades between (user: "not visible
          // continuously — disappears and appears on the beat"). Near-0 between beats (just
          // enough to keep feeding the persistent yellow arms), bright on a bass hit.
          t.q10 = 0.45 + 0.55 * bass; // line feeds the persistent yellow arms (the stark WHITE
          // crossing bolt is what appears/disappears — gated by the beat in the comp punch)
          // The bolt rotates (q1); a single centered SWIRL in the warp curls its fading
          // trail into the pinwheel arms (rot=0 so the spin lives in the warp, not a
          // rigid background spin).
          t.rot = 0.0;
          t.zoom = 1.0 + 0.035 * (bass - 1.0); // beat zoom breathe (back by request)
          t.decay = 0.9; // shorter trails -> fewer accumulated strands (less mess on loud beats)
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
          "float R = 2.0 + 3.0 * bass;\n" + // line thickness (px) — thin/crisp; the swirl makes the arms, not dilation
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
          // FIXED vivid yellow <-> lime drift (the reference is a yellow/lime pinwheel, NOT a
          // random rainbow). The colour rides ONLY on the swirled bolt-trail luminance, so the
          // background between the arms stays BLACK (yellow arms on black, like the reference).
          "float ph = 0.5 + 0.5 * sin(time * 0.08);\n" +
          "vec3 base = mix(vec3(1.0, 0.85, 0.05), vec3(0.62, 1.0, 0.08), ph);\n" + // yellow <-> lime-green
          "float fill = pow(lum, 1.7) * 1.5 * (1.0 + 0.4 * bass);\n" + // contrast: gaps -> BLACK, a few broad bright blades
          "vec3 col = base * fill;\n" +
          // the stark WHITE crossing bolt APPEARS on beats and fades between (gated by bass)
          "float beat = smoothstep(1.05, 1.45, bass);\n" +
          "col += vec3(1.0) * smoothstep(0.5, 0.95, lum) * (0.12 + 1.0 * beat);\n" +
          "col = col / (col + 0.7) * 1.15;\n" + // tonemap -> bright yellow arms, bounded
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
          smoothing: 0.75, // strongly blend adjacent samples -> one smooth wavy bolt, not 512 strands
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
  // Re-derived from the reference + user note (window ~178-194): the WMP "2-waveform"
  // mechanism. TWO jagged WHITE audio-waveform lines, PARALLEL to each other, that
  // oscillate APART <-> together (meeting at the centre) and ROTATE continuously about
  // the centre, leaving a colored DIFFUSE trail. Their swept feedback fills a glowing
  // fan-striated DISC that drains inward; the crisp jagged white lines ride the leading
  // edge. Warm colour drifts pink/salmon -> vivid YELLOW, cores white, on PURE BLACK.
  // (Was a procedural anemone + a single circular crackle ring — missed the 2-line
  // rotating/converging mechanism the user flagged.)
  P["Ambience Down the Drain"] = (function () {
    var preset = build(
      {
        wave_a: 0,
        decay: 0.94, // long trail -> the rotating lines sweep a filled, diffuse disc
        gammaadj: 1.6,
        zoom: 1.0,
        rot: 0.0,
        warp: 0.0,
        cx: 0.5,
        cy: 0.5,
        darken_center: 0,
        wrap: 0,
      },
      {
        frame: function (t) {
          var bass = t.bass_att || t.bass || 1;
          var treb = t.treb_att || t.treb || 1;
          t.q1 = t.time * 0.5; // continuous rotation angle of the parallel pair
          t.q3 = 0.1 * (0.5 + 0.5 * Math.sin(t.time * 0.45)); // separation oscillates 0..0.10 (meets at centre)
          t.q5 = 0.5; // line half-length (full diameters -> fill centre-to-edge)
          t.q6 = 0.04 + 0.05 * Math.min(treb, 1.6); // jaggedness amplitude (small, capped)
          return t;
        },
        // Gentle continuous rotation of the trail ONLY (no inward shrink — that carved a
        // dark hole and broke the fan into concentric rings). Diametric lines sweeping +
        // a long trail fill a solid radial-striated fan, bright at the centre.
        warp:
          "shader_body {\n" +
          "vec2 d = uv - 0.5;\n" +
          "float pr = length(d);\n" +
          "float pang = atan(d.y, d.x) + 0.04;\n" + // gentle continuous rotation of the trail
          "vec2 w = vec2(0.5) + pr * vec2(cos(pang), sin(pang));\n" +
          "ret = texture2D(sampler_main, w).rgb - 0.004;\n" +
          "}\n",
        // The swept trail (feedback) is the diffuse YELLOW body; the hottest fresh lines
        // punch WHITE. Warm pink<->yellow drift, tone-mapped, on black.
        comp:
          "shader_body {\n" +
          "vec2 p = uv - 0.5;\n" +
          "p.x *= resolution.x / resolution.y;\n" +
          "vec3 src = texture2D(sampler_main, uv).rgb;\n" +
          "float lum = max(src.r, max(src.g, src.b));\n" +
          "float ph = 0.5 + 0.5 * sin(time * 0.05);\n" + // warm temperature drift
          "vec3 warm = mix(vec3(1.0, 0.62, 0.72), vec3(1.0, 0.92, 0.18), ph);\n" + // pink/salmon <-> vivid yellow
          "vec3 col = warm * lum * 1.35;\n" +
          "col += vec3(1.0) * smoothstep(0.6, 1.0, lum) * 0.7;\n" + // fresh white jagged lines punch through
          "col = col / (col + 0.6) * 1.4;\n" + // tone-map -> glowing, bounded, black outside the disc
          "ret = col;\n" +
          "}\n",
      }
    );
    // Two PARALLEL real-audio waveform lines (white, additive). They run along a rotating
    // axis (q1) and are offset perpendicular by +/- the oscillating separation q3 (so they
    // meet at the centre when q3->0); the live sample adds the jaggedness q6.
    function dRope(k, useV2) {
      return {
        baseVals: Object.assign({}, WAVE_BASE, {
          enabled: 1,
          samples: 512,
          additive: 1,
          usedots: 0,
          scaling: 1,
          smoothing: 0.3,
          a: 0.85,
          thick: 1,
          r: 1.0,
          g: 1.0,
          b: 1.0,
        }),
        init_eqs: passthrough,
        frame_eqs: passthrough,
        point_eqs: function (a) {
          var th = a.q1 || 0;
          var ct = Math.cos(th),
            st = Math.sin(th);
          var s = a.sample * 2.0 - 1.0; // -1 .. +1 along the rotating axis
          var len = a.q5 || 0.46;
          var sep = a.q3 || 0.0;
          var amp = a.q6 || 0.05;
          var samp = useV2 ? (a.value2 !== undefined ? a.value2 : a.value1) : a.value1;
          var perp = k * sep + samp * amp; // perpendicular offset: separation + jaggedness
          a.x = 0.5 + s * len * ct - perp * st;
          a.y = 0.5 + s * len * st + perp * ct;
          a.r = 1.0;
          a.g = 1.0;
          a.b = 1.0;
          return a;
        },
      };
    }
    preset.waves[0] = dRope(1, false);
    preset.waves[1] = dRope(-1, true);
    return preset;
  })();

  // ════════════════════════════════════════════════════════════════════════
  // AMBIENCE family (amber/yellow fluid light; Niagara cycles yellow<->teal).
  // Authored batch 2 — built with real audio: built-in circular waveform or
  // circleWave/spokeLine, so the pulsing elements beat with the music.
  // ════════════════════════════════════════════════════════════════════════

  // ── Ambience Swirl ────────────────────────────────────────────────────────
  // The REAL WMP Ambience "Swirl" (window ~38-46; this slot used to hold the
  // invented "Snell", which does not exist in WMP). Re-derived from the reference:
  //   • A central RADIAL SUNBURST — many fine spokes from a bright centre pinch,
  //     filling a soft-edged OVAL (wider than tall), wrapped in a feathery cloud rim.
  //   • TWO near-white jagged oscilloscope WAVEFORM lines crossing edge-to-edge,
  //     one through the upper third, one through the lower third (the WMP signature).
  //   • Muted DUSTY BLUES: navy field, cornflower/periwinkle spokes, near-white
  //     centre + lines, near-black corners. FIXED blue (no hue cycle).
  //   • Calm/smooth: the spokes slowly rotate/shimmer, the oval gently breathes; the
  //     two lines wiggle with the live audio.
  // The sunburst + oval + cloud rim are PROCEDURAL in the comp; the two lines are
  // custom real-audio waves whose feedback the comp overlays as white.
  P["Ambience Swirl"] = (function () {
    var preset = build(
      {
        wave_a: 0,
        decay: 0.8, // short trail -> crisp oscilloscope lines (redrawn each frame)
        gammaadj: 1.5,
        zoom: 1.0,
        rot: 0.0,
        warp: 0.0,
        cx: 0.5,
        cy: 0.5,
        darken_center: 0,
        wrap: 0,
      },
      {
        frame: function (t) {
          var treb = t.treb_att || t.treb || 1;
          // line amplitude — SMALL and CAPPED so loud beats don't fan the 512 samples
          // into a mess (the original keeps clean wiggly lines).
          t.q6 = 0.035 + 0.03 * Math.min(treb, 1.6);
          t.decay = 0.8;
          return t;
        },
        // The lines are drawn fresh each frame; the warp just fades the feedback fast
        // so they stay crisp with only a hair of trail.
        warp: "shader_body {\nret = texture2D(sampler_main, uv).rgb - 0.04;\n}\n",
        comp:
          NOISE_GLSL +
          "shader_body {\n" +
          "vec2 p = uv - 0.5;\n" +
          "p.x *= resolution.x / resolution.y;\n" + // aspect-correct
          "vec2 po = p; po.y *= 1.35;\n" + // OVAL body: wider than tall
          "float pr = length(po);\n" +
          "float pang = atan(po.y, po.x) + time * 0.14;\n" + // continuous spoke rotation
          "float jit = fbm(vec2(pang * 3.0, time * 0.05));\n" +
          "float spokes = 0.5 + 0.5 * sin(pang * 90.0 + jit * 8.0);\n" + // many fine irregular spokes
          "spokes = pow(spokes, 1.6);\n" +
          // the blue CENTRE slowly GROWS to fill the pane then collapses to a small flower
          // (a big size pulse, ~13s) + a mild bass swell.
          "float grow = 0.5 + 0.5 * sin(time * 0.5);\n" +
          "float fall = exp(-pr * pr * (mix(7.0, 1.7, grow) - 0.6 * bass));\n" + // disc size pulses big<->small
          "float core = exp(-pr * pr * mix(85.0, 16.0, grow));\n" + // bright centre pinch grows too
          "float burst = fall * (0.30 + 0.70 * spokes);\n" +
          "float rim = smoothstep(0.62, 0.32, pr) * (0.22 + 0.25 * fbm(vec2(pang * 2.0, pr * 4.0 - time * 0.1)));\n" + // feathery cloud rim
          "float v = burst + 0.4 * rim;\n" +
          // colour: navy field, cornflower spokes, small white centre pinch (FIXED blue)
          "vec3 navy = vec3(0.04, 0.06, 0.17);\n" +
          "vec3 corn = vec3(0.42, 0.52, 0.88);\n" +
          "vec3 col = navy + corn * v * 1.25;\n" +
          "col = mix(col, vec3(0.90, 0.93, 1.0), smoothstep(0.55, 1.0, core));\n" + // small soft white pinch
          // the two white waveform lines (from the feedback buffer)
          "vec3 src = texture2D(sampler_main, uv).rgb;\n" +
          "float lines = max(src.r, max(src.g, src.b));\n" +
          "col = mix(col, vec3(0.90, 0.94, 1.0), smoothstep(0.30, 0.80, lines));\n" +
          "col *= 1.0 - 0.55 * dot(p, p);\n" + // vignette -> near-black corners
          "col = col / (col + 0.6);\n" + // Reinhard tone-map
          "col *= 1.5;\n" +
          "ret = col;\n" +
          "}\n",
      }
    );
    // Two horizontal real-audio oscilloscope lines (upper + lower third), near-white,
    // additive; vertical displacement = the live waveform sample (small, capped amp).
    function hLine(yc) {
      return {
        baseVals: Object.assign({}, WAVE_BASE, {
          enabled: 1,
          samples: 512,
          additive: 1,
          usedots: 0,
          scaling: 1,
          smoothing: 0.3,
          a: 0.95,
          thick: 1,
          r: 0.92,
          g: 0.95,
          b: 1.0,
        }),
        init_eqs: passthrough,
        frame_eqs: passthrough,
        point_eqs: function (a) {
          var s = a.sample * 2.0 - 1.0; // -1..1 edge to edge
          var amp = a.q6 || 0.05;
          a.x = 0.5 + s * 0.56;
          a.y = yc + a.value1 * amp; // perpendicular displacement = real waveform
          a.r = 0.92;
          a.g = 0.95;
          a.b = 1.0;
          return a;
        },
      };
    }
    preset.waves[0] = hLine(0.3);
    preset.waves[1] = hLine(0.7);
    return preset;
  })();

  // ── Ambience Warp ───────────────────────────────────────────────────────────
  // Re-derived from the reference (window ~46-56): a soft billowing CLOUD/fog field
  // that FILLS the frame, radiating outward from a dark central HOLE the cloud parts
  // around (it gently breathes), with a tiny white-hot speck flaring at the centre.
  // The whole field cycles blue <-> yellow (~18s there-and-back), both extremes
  // genuinely coloured, crossing through a near-neutral grey-green midpoint. Calm,
  // continuous, time-driven billow — NO tunnel rush, NO beat-pulse. Built PROCEDURALLY
  // (domain-warped scrolling fbm) — the old wireframe-waveform tunnel was the wrong
  // model and left the field near-black so the blue half never showed.
  P["Ambience Warp"] = build(
    {
      wave_a: 0,
      decay: 0.9,
      gammaadj: 1.5,
      zoom: 1.0,
      rot: 0.0,
      warp: 0.0,
      cx: 0.5,
      cy: 0.5,
      darken_center: 0,
      wrap: 0,
    },
    {
      frame: function (t) {
        return t; // motion is the time-driven cloud morph in the comp
      },
      comp:
        NOISE_GLSL +
        AMBER_RAMP +
        "shader_body {\n" +
        "vec2 p = uv - 0.5;\n" +
        "p.x *= resolution.x / resolution.y;\n" +
        "float pr = length(p);\n" +
        "float pang = atan(p.y, p.x) + time * 0.15;\n" + // SWIRL: continuous circular rotation
        // concentric SHELLS born at the centre and travelling OUTWARD (the phase moves out
        // with time) + angular cloud lumps riding them = the rippling warp the user described.
        "float lump = fbm(vec2(pang * 2.0, pr * 3.0 - time * 0.2));\n" +
        "float rings = 0.5 + 0.5 * sin(pr * 28.0 - time * 1.6 + lump * 5.0);\n" + // shells emanate OUT
        "rings = pow(rings, 1.4);\n" +
        "float cloud = fbm(vec2(pang * 3.0, pr * 6.0 - time * 0.5));\n" + // caustic texture on the shells
        "float band = mix(rings, cloud, 0.45);\n" +
        // central breathing HOLE the shells part around
        "float holeR = 0.12 + 0.03 * sin(time * 0.4) + 0.04 * bass;\n" +
        "float mask = smoothstep(holeR, holeR + 0.12, pr);\n" + // 0 inside the hole -> dark eye
        "float v = (0.12 + 0.85 * band) * mask * (0.9 + 0.2 * bass);\n" + // lit field; masked floor keeps the hole BLACK
        // blue <-> yellow cycle (~18s), both extremes saturated, grey-green midpoint
        "vec3 warm = amber_ramp(v);\n" +
        "vec3 cool = mix(vec3(0.03, 0.06, 0.20), vec3(0.55, 0.72, 1.0), v);\n" + // indigo -> light blue
        "vec3 col = mix(cool, warm, 0.5 + 0.5 * sin(time * 0.35));\n" +
        "col = col / (col + 0.5) * 1.4;\n" + // Reinhard tone-map
        "ret = col;\n" +
        "}\n",
    }
  );

  // ── Ambience Anon ───────────────────────────────────────────────────────────
  // Re-derived from the reference (window ~57-68): an EDGE-TO-EDGE bright VIVID-yellow
  // cloud field (no black, no vignette — an Ambience exception to "stay muted"), with a
  // centered radial sunflower of thin filament SPOKES and a strong HORIZONTAL crackling
  // lens-flare BEAM through the centre, cores blooming near-white. Calm smooth radial
  // flow. The bright filled cloud + spokes are procedural; the beam is one real-audio
  // horizontal waveform line (its long feedback smear = the lens-flare glow + crackle).
  // (Was a too-dark amber wash with an off-centre drifting ring.)
  P["Ambience Anon"] = (function () {
    var preset = build(
      {
        wave_a: 0,
        decay: 0.9, // moderate trail -> the beam line smears into a soft horizontal glow
        gammaadj: 1.3,
        zoom: 1.0,
        rot: 0.0,
        warp: 0.0,
        cx: 0.5,
        cy: 0.5,
        darken_center: 0,
        wrap: 0,
      },
      {
        frame: function (t) {
          var treb = t.treb_att || t.treb || 1;
          t.q6 = 0.03 + 0.025 * Math.min(treb, 1.6); // beam crackle amplitude (small, capped)
          t.decay = 0.9;
          return t;
        },
        // Fast fade so the horizontal beam line stays a crisp jagged crackle with a soft
        // horizontal smear; the cloud + spokes are painted procedurally in the comp.
        warp: "shader_body {\nret = texture2D(sampler_main, uv).rgb - 0.02;\n}\n",
        comp:
          NOISE_GLSL +
          AMBER_RAMP +
          "shader_body {\n" +
          "vec2 p = uv - 0.5;\n" +
          "p.x *= resolution.x / resolution.y;\n" +
          "float pr = length(p);\n" +
          "float pang = atan(p.y, p.x);\n" +
          // bright billowing yellow cloud base (filled edge-to-edge)
          "vec2 cp = uv * 2.2 + vec2(time * 0.04, -time * 0.03);\n" +
          "float cloud = fbm(cp + fbm(cp + time * 0.05));\n" +
          // centered radial filament spokes, slowly rotating, brightest near centre
          "float spokes = 0.5 + 0.5 * sin((pang + time * 0.05) * 48.0 + 9.0 * fbm(vec2(pang * 3.0, time * 0.05)));\n" +
          "spokes = pow(spokes, 1.8) * exp(-pr * pr * 4.0);\n" + // concentrated near centre, fade out into cloud
          "float v = 0.42 + 0.45 * cloud + 0.32 * spokes;\n" + // bright filled field; cloud billows show through
          "v *= (0.95 + 0.2 * bass);\n" +
          // the horizontal crackle/lens-flare beam (real-audio line in the feedback)
          "vec3 src = texture2D(sampler_main, uv).rgb;\n" +
          "float beam = max(src.r, max(src.g, src.b));\n" +
          "v += 0.5 * beam;\n" +
          "vec3 col = amber_ramp(v);\n" + // black->amber->yellow->white-hot
          "ret = col;\n" +
          "}\n",
      }
    );
    // The horizontal beam = a real-audio waveform line through centre (y=0.5), near-white,
    // additive; small capped vertical displacement so loud beats stay clean.
    preset.waves[0] = {
      baseVals: Object.assign({}, WAVE_BASE, {
        enabled: 1,
        samples: 512,
        additive: 1,
        usedots: 0,
        scaling: 1,
        smoothing: 0.35,
        a: 0.9,
        thick: 1,
        r: 1.0,
        g: 0.98,
        b: 0.85,
      }),
      init_eqs: passthrough,
      frame_eqs: passthrough,
      point_eqs: function (a) {
        var s = a.sample * 2.0 - 1.0;
        var amp = a.q6 || 0.04;
        a.x = 0.5 + s * 0.56;
        a.y = 0.5 + a.value1 * amp;
        a.r = 1.0;
        a.g = 0.98;
        a.b = 0.85;
        return a;
      },
    };
    return preset;
  })();

  // ── Ambience Falloff ────────────────────────────────────────────────────────
  // Re-derived from the reference (window ~69-80): a near-full-frame BRIGHT YELLOW
  // field with a dark 4-fold-symmetric HOURGLASS/bowtie carved out of it — dark
  // concave wedges descending from top-centre and rising from bottom-centre, pinched
  // to a sharp WAIST at dead centre, with two big bright-yellow LOBES bulging left and
  // right. A near-white inner glow rings the waist; a jagged WHITE audio-waveform line
  // runs HORIZONTALLY through it. Vivid saturated yellow (an Ambience exception), quad-
  // mirror symmetric, CALM breathing (the waist gently pulses; no rain/drift/rotation).
  // (Was a dark vertical ring-spine raining downward — wrong model, far too dark.)
  P["Ambience Falloff"] = (function () {
    var preset = build(
      {
        wave_a: 0,
        decay: 0.82, // short trail -> crisp horizontal waveform crackle
        gammaadj: 1.3,
        zoom: 1.0,
        rot: 0.0,
        warp: 0.0,
        cx: 0.5,
        cy: 0.5,
        darken_center: 0,
        wrap: 0,
      },
      {
        frame: function (t) {
          var bass = t.bass_att || t.bass || 1;
          // PULSE: the waveform swing is bass-driven so it visibly crackles WIDER on the
          // beat (was a tiny treble-capped amp that hardly moved — user feedback).
          t.q6 = 0.04 + 0.11 * Math.min(bass, 1.8);
          t.decay = 0.85; // a touch longer trail so the pulsing crackle leaves a soft glow
          return t;
        },
        warp: "shader_body {\nret = texture2D(sampler_main, uv).rgb - 0.03;\n}\n",
        comp:
          NOISE_GLSL +
          AMBER_RAMP +
          "shader_body {\n" +
          "vec2 p = uv - 0.5;\n" +
          "p.x *= resolution.x / resolution.y;\n" +
          "float ax = abs(p.x), ay = abs(p.y);\n" +
          // the bowtie/hourglass: bright LOBES where ax*k > ay (left/right), dark wedges
          // (top/bottom) where ax*k < ay; k breathes so the waist pulses thicker/thinner.
          "float k = 1.45 + 0.12 * sin(time * 0.5) + 0.15 * bass;\n" +
          "float edge = ax * k - ay + 0.9 * ax * ay;\n" + // +curve term -> concave wedges / bulging lobes
          "float bright = smoothstep(-0.04, 0.06, edge);\n" +
          // bright yellow field (soft cloud texture) confined to the lobes
          "vec2 cp = uv * 2.0 + vec2(time * 0.03, -time * 0.025);\n" +
          "float cloud = fbm(cp + fbm(cp + time * 0.04));\n" +
          "float v = (0.55 + 0.4 * cloud) * bright;\n" +
          // near-white inner glow ringing the centre waist (bright horizontal sliver)
          "float waist = exp(-(ay * ay * 42.0 + ax * ax * 5.0));\n" +
          "v += 0.6 * waist;\n" +
          // jagged WHITE horizontal waveform crackle through the waist (from feedback)
          "vec3 src = texture2D(sampler_main, uv).rgb;\n" +
          "float beam = max(src.r, max(src.g, src.b));\n" +
          "v += (0.9 + 0.5 * bass) * beam;\n" + // the pulsing white waveform crackle pops on the beat
          "ret = amber_ramp(v);\n" + // black wedges -> amber lobes -> white-hot waist
          "}\n",
      }
    );
    // The horizontal waveform crackle through the waist: real-audio line at y=0.5,
    // near-white, additive, small capped vertical displacement.
    preset.waves[0] = {
      baseVals: Object.assign({}, WAVE_BASE, {
        enabled: 1,
        samples: 512,
        additive: 1,
        usedots: 0,
        scaling: 1,
        smoothing: 0.3,
        a: 0.9,
        thick: 1,
        r: 1.0,
        g: 0.98,
        b: 0.85,
      }),
      init_eqs: passthrough,
      frame_eqs: passthrough,
      point_eqs: function (a) {
        var s = a.sample * 2.0 - 1.0;
        var amp = a.q6 || 0.04;
        a.x = 0.5 + s * 0.56;
        a.y = 0.5 + a.value1 * amp;
        a.r = 1.0;
        a.g = 0.98;
        a.b = 0.85;
        return a;
      },
    };
    return preset;
  })();

  // ── Ambience Bubble ─────────────────────────────────────────────────────────
  // Re-derived from the reference (window ~99-113): ONE big central glowing filled
  // SPHERE/orb (~75% of the pane, face-on) with a soft bright RIM, an internal RADIAL
  // FLUTING of ~13 soft petals/pleats (citrus cross-section / pleated lampshade), and a
  // small DARK CENTRAL CORE 'eye' that gently opens/closes. Transient horizontal
  // lens-flare WINGS flare off the sides early on. The body is PALE/desaturated and the
  // hue slowly DRIFTS yellow -> pale sage-green -> near-white with MAGENTA rim fringing.
  // CALM breathing — one stationary morphing ball. (Was 4 drifting wireframe rings —
  // the literal "four metaballs" misread, completely wrong.)
  P["Ambience Bubble"] = (function () {
    var preset = build(
      {
        wave_a: 0,
        decay: 0.9,
        gammaadj: 1.4,
        zoom: 1.0,
        rot: 0.0,
        warp: 0.0,
        cx: 0.5,
        cy: 0.5,
        darken_center: 0,
        wrap: 0,
      },
      {
        frame: function (t) {
          var bass = t.bass_att || t.bass || 1;
          var treb = t.treb_att || t.treb || 1;
          // the jagged waveform RING expands CONTINUOUSLY centre->rim (a steady RIPPLE, NOT a
          // beat pulse — user note); a new ripple is reborn at the centre each cycle.
          t.q5 = 0.03 + 0.37 * ((t.time * 0.22) % 1.0);
          t.q6 = 0.015 + 0.03 * Math.min(treb, 1.6); // ring jaggedness
          return t;
        },
        // fade the buffer so the expanding ring leaves a short glow trail (the procedural
        // sphere is recomputed fresh each frame, so it doesn't accumulate).
        warp: "shader_body {\nret = texture2D(sampler_main, uv).rgb * 0.5;\n}\n",
        comp:
          NOISE_GLSL +
          "shader_body {\n" +
          "vec2 p = uv - 0.5;\n" +
          "p.x *= resolution.x / resolution.y;\n" +
          "float pr = length(p);\n" +
          "float pang = atan(p.y, p.x);\n" +
          "float wob = (fbm(vec2(pang * 2.0 + 1.0, time * 0.2)) - 0.5) * 0.045;\n" + // soft organic rim wobble
          "float prw = pr + wob;\n" +
          "float R = 0.40 + 0.025 * bass + 0.015 * sin(time * 0.5);\n" + // breathing radius
          "float disc = smoothstep(R + 0.02, R - 0.04, prw);\n" + // soft-rimmed filled sphere
          "float petals = 0.5 + 0.5 * cos(pang * 13.0 + 0.6 * sin(time * 0.3));\n" + // radial fluting
          "float flute = 0.68 + 0.32 * petals;\n" +
          "float coreR = 0.05 + 0.015 * sin(time * 0.7) + 0.012 * bass;\n" + // breathing core eye
          "float coreMask = smoothstep(coreR, coreR + 0.03, pr);\n" +
          "float rim = smoothstep(R - 0.07, R - 0.01, prw) * smoothstep(R + 0.02, R - 0.03, prw);\n" + // bright rim ring
          "float v = disc * flute * coreMask * 0.9 + rim * 0.6;\n" +
          // transient horizontal lens-flare wings off the sides (slow come-and-go)
          "float flare = exp(-p.y * p.y * 380.0) * smoothstep(R - 0.02, R + 0.16, abs(p.x)) * max(0.0, 0.2 + 0.3 * sin(time * 0.22));\n" +
          "v += flare;\n" +
          // colour: PALE/desaturated body, slow hue drift yellow -> sage -> white-with-magenta
          "float ph = time * 0.05;\n" +
          "vec3 tint = 0.5 + 0.5 * cos(6.2832 * (ph + vec3(0.0, 0.33, 0.67)));\n" +
          "vec3 pale = mix(vec3(1.0), tint, 0.5);\n" + // white-biased -> muted/pale
          "vec3 col = pale * v;\n" +
          "col += vec3(0.5, 0.0, 0.42) * rim * (0.3 + 0.3 * sin(ph * 6.2832));\n" + // magenta rim fringe (phased)
          // continuous concentric RIPPLES emanating centre->rim (pond-like, TIME-driven, NOT
          // beat-synced); many rings born at the centre travel outward and fade at the rim.
          "float rjag = 0.5 * fbm(vec2(pang * 5.0, time * 0.4));\n" + // gentle organic wobble of the rings
          "float rip = 0.5 + 0.5 * sin(pr * 46.0 - time * 5.0 + rjag * 6.0);\n" +
          "rip = pow(rip, 2.5) * smoothstep(0.03, 0.10, pr) * disc;\n" + // within the bubble, fade at the very centre
          "col += vec3(0.92, 0.96, 1.0) * rip * (0.22 + 0.10 * treb);\n" + // milky ripple rings, faint treble shimmer
          // the real-audio jagged ring (feedback) rides the ripples as the leading wavefront,
          // expanding continuously centre->rim; punched white, clipped to inside the disc.
          "vec3 src = texture2D(sampler_main, uv).rgb;\n" +
          "float wave = max(src.r, max(src.g, src.b));\n" +
          "col += vec3(1.0, 0.97, 0.9) * smoothstep(0.4, 0.85, wave) * smoothstep(R + 0.02, R - 0.02, prw) * 0.7;\n" +
          "col = col / (col + 0.5);\n" + // Reinhard tone-map
          "col *= 1.5;\n" +
          "ret = col;\n" +
          "}\n",
      }
    );
    // The radial waveform: a jagged circular ring centred in the bubble whose radius q5
    // pulses outward from the centre to the rim on the beat (aspect-squished x so it reads
    // round on the wide canvas); jaggedness from the live sample (q6). White, additive.
    preset.waves[0] = {
      baseVals: Object.assign({}, WAVE_BASE, {
        enabled: 1,
        samples: 512,
        additive: 1,
        usedots: 0,
        scaling: 1,
        smoothing: 0.2,
        a: 0.9,
        thick: 1,
        r: 1.0,
        g: 0.97,
        b: 0.9,
      }),
      init_eqs: passthrough,
      frame_eqs: passthrough,
      point_eqs: function (a) {
        var ang = a.sample * 6.2832;
        var rad = (a.q5 || 0.1) + (a.value1 || 0) * (a.q6 || 0.03);
        a.x = 0.5 + rad * 0.62 * Math.cos(ang); // 0.62 ~ 1/aspect -> round ring
        a.y = 0.5 + rad * Math.sin(ang);
        a.r = 1.0;
        a.g = 0.97;
        a.b = 0.9;
        return a;
      },
    };
    return preset;
  })();

  // ── Ambience Dizzy ──────────────────────────────────────────────────────────
  // Re-derived from the reference (window ~114-125): a frame-FILLING tumbling cloud/smoke
  // field — soft wispy filament BANDS that curve, fold and swirl ('dizzy') with bright
  // white-cyan edges — overlaid by TWO jagged WHITE audio-waveform 'lightning' lines (an
  // UPPER and a LOWER, spanning the width, the WMP signature the user flagged). The whole
  // field slowly cycles magenta -> sage -> teal -> CYAN. Smooth continuous swirl, mostly
  // time-driven; the two lines re-draw every frame from the live samples. (Earlier version
  // had the cloud swirl + colour cycle but was MISSING the two waveform lines.)
  P["Ambience Dizzy"] = (function () {
    var preset = build(
      {
        wave_a: 0,
        decay: 0.9,
        gammaadj: 2.0,
        zoom: 1.0,
        rot: 0.0,
        warp: 0.0,
        cx: 0.5,
        cy: 0.5,
        darken_center: 0,
        wrap: 0,
      },
      {
        frame: function (t) {
          var tr = t.treb_att || t.treb || 1;
          t.q6 = 0.04 + 0.05 * Math.min(tr, 1.6); // waveform line amplitude (small, capped)
          return t;
        },
        // Hard fade: the procedural cloud (also output) must NOT accumulate, and the two
        // waveform lines (drawn into the buffer) keep only a faint 1-frame glow trail.
        warp: "shader_body {\nret = texture2D(sampler_main, uv).rgb * 0.4;\n}\n",
        comp:
          NOISE_GLSL +
          "shader_body {\n" +
          "vec2 p = uv - 0.5;\n" +
          "p.x *= resolution.x / resolution.y;\n" +
          "float pr = length(p);\n" +
          // SWIRL: rotate the domain by an angle that grows toward the centre + drifts in
          // time, so the bands tumble/fold like a slow vortex.
          // rotation REVERSES direction (CW <-> CCW): a sinusoid in time -> the angular
          // velocity changes sign, so the swirl tumbles one way then the other (user note).
          "float a = 2.4 * sin(time * 0.22) + 1.6 * (0.55 - pr);\n" +
          "mat2 rot = mat2(cos(a), -sin(a), sin(a), cos(a));\n" +
          "vec2 q = rot * p;\n" +
          // horizontal-ish filament bands via scrolling fbm (two octaves)
          "float bands = fbm(vec2(q.x * 3.0 + time * 0.10, q.y * 6.0 - time * 0.15));\n" +
          "float bands2 = fbm(vec2(q.x * 7.0 - time * 0.08, q.y * 11.0 + time * 0.10));\n" +
          "float v = (0.4 + 0.5 * bands + 0.3 * bands2) * (0.95 + 0.15 * bass);\n" +
          // colour CYCLES magenta <-> cyan (~16s) — measured drift over the window; bright
          // filament edges stay near-white in both phases.
          "float ph = 0.5 + 0.5 * sin(time * 0.38);\n" + // 0 = cyan phase, 1 = magenta phase
          "vec3 darkC = mix(vec3(0.05, 0.30, 0.32), vec3(0.20, 0.04, 0.22), ph);\n" + // dark teal <-> dark magenta
          "vec3 litC = mix(vec3(0.55, 0.95, 0.95), vec3(0.95, 0.55, 0.95), ph);\n" + // cyan <-> magenta-pink
          "vec3 col = mix(darkC, litC, smoothstep(0.30, 0.92, v));\n" +
          "col = mix(col, vec3(0.90, 0.96, 1.0), smoothstep(0.82, 1.05, v));\n" + // white filament edges
          // the TWO jagged WHITE waveform lines (read from the feedback buffer) punched on top
          "vec3 src = texture2D(sampler_main, uv).rgb;\n" +
          "float beam = max(src.r, max(src.g, src.b));\n" +
          "col = mix(col, vec3(0.93, 0.98, 1.0), smoothstep(0.55, 0.92, beam));\n" +
          "ret = col;\n" +
          "}\n",
      }
    );
    // Two near-horizontal jagged WHITE audio-waveform lines (upper + lower), each spanning
    // the full width, displaced vertically by the live samples = the lightning lines.
    function dLine(yc, useV2) {
      return {
        baseVals: Object.assign({}, WAVE_BASE, {
          enabled: 1,
          samples: 512,
          additive: 1,
          usedots: 0,
          scaling: 1,
          smoothing: 0.4,
          a: 0.9,
          thick: 1,
          r: 1.0,
          g: 1.0,
          b: 1.0,
        }),
        init_eqs: passthrough,
        frame_eqs: passthrough,
        point_eqs: function (a) {
          var s = a.sample * 2.0 - 1.0; // -1 .. +1 across the pane
          var amp = a.q6 || 0.06;
          var samp = useV2 ? (a.value2 !== undefined ? a.value2 : a.value1) : a.value1;
          a.x = 0.5 + s * 0.92;
          a.y = yc + samp * amp;
          a.r = 1.0;
          a.g = 1.0;
          a.b = 1.0;
          return a;
        },
      };
    }
    preset.waves[0] = dLine(0.34, false); // upper line
    preset.waves[1] = dLine(0.66, true); // lower line
    return preset;
  })();

  // ── Ambience Windmill ─────────────────────────────────────────────────────
  // Re-derived from the reference (window ~126-140): a full-frame flowing CAUSTIC/smoke
  // field — bright white-cyan frothy filament RIDGES (inverted-ridge fbm crests) over a
  // mid-teal body with darker teal troughs, the ridge axis running DIAGONALLY lower-left
  // to upper-right and the whole field churning/translating along that diagonal. NO
  // central object, NO spokes, NO radial structure, NO hot core. FIXED cyan (hue 180),
  // luminous-but-clean. Built procedurally (no custom waves). (Was 4 rotating real-audio
  // spokes + a center bloom — the literal "windmill blades" misread; wrong.)
  // ...with TWO parallel DIAGONAL jagged WHITE waveform lines threaded through it, and the
  // whole field TRAVELLING along the diagonal so it feels like flying through space (user
  // note: it had no waveforms). The lines are carried in the feedback RED channel (the cyan
  // caustic has low red-vs-green, so reading red-minus-green isolates the white lines
  // cleanly); a diagonal advection warp streams their trail = the travel.
  P["Ambience Windmill"] = (function () {
    var preset = build(
      {
        wave_a: 0,
        decay: 0.92,
        gammaadj: 1.6,
        zoom: 1.0,
        rot: 0.0,
        warp: 0.0,
        cx: 0.5,
        cy: 0.5,
        darken_center: 0,
        wrap: 0,
      },
      {
        frame: function (t) {
          var treb = t.treb_att || t.treb || 1;
          t.q3 = 0.13; // perpendicular separation of the 2 parallel lines
          t.q5 = 0.62; // line half-length (spans the diagonal)
          t.q6 = 0.03 + 0.04 * Math.min(treb, 1.6); // jaggedness amplitude
          return t;
        },
        // diagonal advection -> the lines' red trail STREAMS up-right = camera travelling
        // through space; fade red so the trail has finite length (the cyan body is
        // recomputed fresh in the comp, so it never accumulates).
        warp:
          "shader_body {\n" +
          "vec2 w = uv + vec2(-0.005, 0.004);\n" + // sample down-left -> content streams up-right
          "vec3 c = texture2D(sampler_main, w).rgb;\n" +
          "c.r *= 0.82;\n" +
          "ret = c;\n" +
          "}\n",
        comp:
          NOISE_GLSL +
          "shader_body {\n" +
          "vec2 p = uv;\n" +
          "p.x *= resolution.x / resolution.y;\n" +
          // diagonal advection (LL -> UR) + rotate/elongate the domain so ridges run diagonally
          "vec2 flow = vec2(0.06, -0.05) * time;\n" +
          "vec2 q = p * 4.0 + flow;\n" +
          "q = mat2(0.707, -0.707, 0.707, 0.707) * q;\n" + // rotate 45deg
          "q.y *= 0.5;\n" + // elongate features along the diagonal
          "float n = fbm(q + 0.6 * fbm(q * 0.7 - flow * 0.5));\n" + // domain-warped base body
          "float ridge = pow(1.0 - abs(2.0 * fbm(q * 1.6 + n) - 1.0), 3.0);\n" + // frothy inverted-ridge crests
          "float ridge2 = pow(1.0 - abs(2.0 * fbm(q * 3.0 - n * 1.2 + flow) - 1.0), 4.0);\n" +
          "float crest = max(ridge, 0.7 * ridge2);\n" +
          "float body = 0.5 + 0.5 * n;\n" + // higher floor -> luminous, few dark troughs
          "body *= (0.95 + 0.15 * bass);\n" +
          // fixed BRIGHT cyan (measured ~rgb 0.53,0.90,0.90): only mild teal troughs, white crests
          "vec3 col = mix(vec3(0.12, 0.48, 0.50), vec3(0.50, 0.90, 0.92), smoothstep(0.2, 0.85, body));\n" +
          "col = mix(col, vec3(0.82, 0.96, 0.96), smoothstep(0.65, 1.05, crest));\n" + // fewer white crests so the lines dominate
          // the 2 travelling white waveform lines: red-minus-green isolates them from cyan
          "vec3 src = texture2D(sampler_main, uv).rgb;\n" +
          "float beam = max(0.0, src.r - 0.6 * src.g);\n" +
          "col = mix(col, vec3(1.0), smoothstep(0.1, 0.32, beam));\n" + // bold WHITE travelling lines
          "col += vec3(0.8, 1.0, 1.0) * smoothstep(0.18, 0.45, beam) * 0.5;\n" + // line glow halo
          "col = max(col, vec3(0.0));\n" +
          "col = col / (col + 0.7);\n" + // gentler tone-map -> stays bright
          "col *= 1.7;\n" +
          "ret = col;\n" +
          "}\n",
      }
    );
    // Two PARALLEL diagonal (45deg) real-audio waveform lines, offset perpendicular by +/-
    // the separation q3, jaggedness q6. Drawn WHITE (high red) so the comp's red-minus-green
    // test isolates them from the cyan body; the warp advects their trail = the travel.
    function wRope(k, useV2) {
      var ct = 0.707,
        st = 0.707; // 45deg diagonal axis
      return {
        baseVals: Object.assign({}, WAVE_BASE, {
          enabled: 1,
          samples: 512,
          additive: 1,
          usedots: 0,
          scaling: 1,
          smoothing: 0.3,
          a: 1.0,
          thick: 3,
          r: 1.0,
          g: 1.0,
          b: 1.0,
        }),
        init_eqs: passthrough,
        frame_eqs: passthrough,
        point_eqs: function (a) {
          var s = a.sample * 2.0 - 1.0;
          var len = a.q5 || 0.62;
          var sep = a.q3 || 0.12;
          var amp = a.q6 || 0.05;
          var samp = useV2 ? (a.value2 !== undefined ? a.value2 : a.value1) : a.value1;
          var perp = k * sep + samp * amp;
          a.x = 0.5 + s * len * ct - perp * st;
          a.y = 0.5 + s * len * st + perp * ct;
          a.r = 1.0;
          a.g = 1.0;
          a.b = 1.0;
          return a;
        },
      };
    }
    preset.waves[0] = wRope(1, false);
    preset.waves[1] = wRope(-1, true);
    return preset;
  })();

  // ── Ambience Niagara ──────────────────────────────────────────────────────
  // Re-derived from the reference (window ~141-155): a vertical luminous FLUID-COLUMN /
  // fountain-rope on a dark ground. At rest, ONE bright white-cyan turbulent column
  // rises from bottom-centre with faint curved arc-trails fanning up-and-out to the top
  // corners; on energy it SPLITS into TWO mirror vertical ropes of jagged braided
  // filaments. Dusty teal-cyan ground deepening to royal blue (slow teal<->blue drift);
  // only the column cores blow to WHITE. Calm smooth vertical flow. The ropes are real-
  // audio waveforms displaced HORIZONTALLY (jagged braid); a rise+fan feedback warp
  // makes the arc streaklines. (Was a centred circular ring — wrong; no ring in the ref.)
  P["Ambience Niagara"] = (function () {
    var preset = build(
      {
        wave_a: 0,
        decay: 0.87, // shorter trail -> less vertical streaking (was 0.9 -> barcode-y)
        gammaadj: 1.4,
        zoom: 1.0,
        rot: 0.0,
        warp: 0.0,
        cx: 0.5,
        cy: 0.5,
        darken_center: 0,
        wrap: 0,
      },
      {
        frame: function (t) {
          var b = t.bass_att || t.bass || 1;
          var tr = t.treb_att || t.treb || 1;
          // ONE column at rest -> SPLITS into 2-3 ropes on a beat, spreading FURTHER from
          // centre on stronger hits (q1 = separation).
          t.q1 = 0.18 * Math.max(0, b - 1.05);
          // braided jaggedness (small + capped so loud beats stay ropes, not a fan of mush)
          t.q6 = 0.014 + 0.02 * Math.min(0.5 * tr + 0.5 * b, 1.6);
          return t;
        },
        // FOUNTAIN warp: the trail RISES and fans slightly OUTWARD, leaving the curved
        // arc-streaks. Only the RED channel (which carries the white-cyan water — see comp)
        // is subtracted, so trails have a finite length and never wash the field.
        warp:
          "shader_body {\n" +
          "vec2 w = uv;\n" +
          "float dx = uv.x - 0.5;\n" +
          "w.x = 0.5 + dx * 0.992;\n" + // gentle outward fan (strong fan barcoded the columns)
          "w.y += 0.011;\n" + // sample below -> content rises (upward flow)
          "vec3 c = texture2D(sampler_main, w).rgb;\n" +
          "c.r -= 0.016;\n" + // fade the water (red is its carrier) -> streaks of finite length
          "ret = c;\n" +
          "}\n",
        // The water (column + rising arc-trails) is carried entirely in the feedback RED
        // channel: the rope is drawn white (high red), the teal ground has ~zero red, so
        // reading src.r cleanly extracts the water and the ground is recomputed FRESH each
        // frame (never fed back additively) -> it CANNOT accumulate into a grey wash.
        comp:
          "shader_body {\n" +
          "vec2 p = uv;\n" +
          "float dx = p.x - 0.5;\n" +
          // dusty teal -> royal-blue ground (slow drift), a touch lighter toward the bottom
          "vec3 teal = vec3(0.02, 0.46, 0.52);\n" +
          "vec3 blue = vec3(0.05, 0.24, 0.58);\n" +
          "vec3 base = mix(teal, blue, 0.5 + 0.5 * sin(time * 0.06));\n" +
          "vec3 ground = base * (0.40 + 0.22 * p.y);\n" + // MEDIUM teal ground (measured ~0,0.33,0.37), a touch lighter low
          // water = red-channel feedback, widened by two horizontal taps so the rope reads
          // as a fluid column with soft edges rather than a hairline.
          "float beam = texture2D(sampler_main, uv).r;\n" +
          // MILKIER/THICKER columns: a wider soft glow built from several horizontal taps so
          // the rope reads as a thick milky fluid column, not a hairline.
          "beam = max(beam, texture2D(sampler_main, uv + vec2(0.012, 0.0)).r * 0.85);\n" +
          "beam = max(beam, texture2D(sampler_main, uv - vec2(0.012, 0.0)).r * 0.85);\n" +
          "beam = max(beam, texture2D(sampler_main, uv + vec2(0.026, 0.0)).r * 0.6);\n" +
          "beam = max(beam, texture2D(sampler_main, uv - vec2(0.026, 0.0)).r * 0.6);\n" +
          "beam = max(beam, texture2D(sampler_main, uv + vec2(0.042, 0.0)).r * 0.38);\n" +
          "beam = max(beam, texture2D(sampler_main, uv - vec2(0.042, 0.0)).r * 0.38);\n" +
          "vec3 col = ground + beam * vec3(0.82, 0.94, 1.0);\n" + // MILKY white-cyan water over teal ground
          // faint horizontal SIDE-LINES that curve toward the central column and drift slowly
          // down (the side mist streaming toward the waterfall — user note); only at the sides,
          // never on the bright column.
          "float sy = p.y + 0.05 * cos(dx * 4.0) - time * 0.03;\n" + // slight concave curve + slow drift
          "float side = pow(0.5 + 0.5 * sin(sy * 24.0), 7.0);\n" + // thin horizontal lines
          "side *= smoothstep(0.06, 0.34, abs(dx)) * 0.14;\n" + // sides only, faint
          "col += vec3(0.45, 0.82, 0.95) * side;\n" +
          "float lum = max(col.r, max(col.g, col.b));\n" +
          "col = mix(col, vec3(0.95, 0.99, 1.0), smoothstep(0.38, 0.9, lum));\n" + // milky-white column cores (lower threshold)
          "col = col / (col + 0.8) * 1.4;\n" + // Reinhard tone-map
          "ret = col;\n" +
          "}\n",
      }
    );
    // THREE vertical jagged ropes (real-audio waveform): centre + left + right. At rest the
    // separation q1~0 so they overlap into ONE fat column; on a strong beat they spread into
    // 2-3 braided ropes (matches the reference: one faint jet -> tall split braids). Drawn
    // WHITE (the comp carries them in red); displaced horizontally by the live sample.
    function vRope(slot) {
      return {
        baseVals: Object.assign({}, WAVE_BASE, {
          enabled: 1,
          samples: 512,
          additive: 1,
          usedots: 0,
          scaling: 1,
          smoothing: 0.4,
          a: 0.85,
          thick: 2,
          r: 1.0,
          g: 1.0,
          b: 1.0,
        }),
        init_eqs: passthrough,
        frame_eqs: passthrough,
        point_eqs: function (a) {
          var s = a.sample * 2.0 - 1.0; // -1 bottom .. +1 top
          var amp = a.q6 || 0.02;
          var sep = a.q1 || 0.0;
          var v = slot === 2 ? a.value2 : a.value1; // mix value1/value2 so the braids differ
          a.x = 0.5 + slot * sep + v * amp; // slot -1/0/+1 -> left/centre/right
          a.y = 0.5 + s * 0.47; // full-height vertical march
          a.r = 1.0;
          a.g = 1.0;
          a.b = 1.0;
          return a;
        },
      };
    }
    preset.waves[0] = vRope(0);
    preset.waves[1] = vRope(-1);
    preset.waves[2] = vRope(1);
    return preset;
  })();

  // ── Ambience Blender ────────────────────────────────────────────────────────
  // Re-derived from the reference (window ~156-163): a BRIGHT glowing whirlpool of soft
  // swirling caustic bands filling the pane (only the corners vignette dark), with a
  // near-white central bloom, cycling BLUE -> periwinkle/lavender -> MAGENTA/pink over the
  // window. The DOMINANT foreground element is a single jagged WHITE horizontal audio-
  // waveform 'lightning line' spanning the full width through the centre (the WMP signature,
  // like Thingus/Dance). Calm smooth CCW churn. (Was a dark purple drain-tunnel with a thin
  // pink CIRCULAR ring — wrong primary element, too dark, no blue phase, no white line.)
  P["Ambience Blender"] = (function () {
    var preset = build(
      {
        wave_a: 0,
        decay: 0.965, // hold the bright wash (the swirled line-trail forms the whirlpool)
        gammaadj: 1.8,
        zoom: 1.005, // barely outward — was 1.03 which sucked the field into a dark centre
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
          var tr = t.treb_att || t.treb || 1;
          t.zoom = 1.0 + 0.012 * b;
          t.rot = 0.008 + 0.015 * m; // gentle field spin (was 0.03+0.06*m — too fast)
          t.q5 = 0.78; // line half-width (spans the pane)
          t.q6 = 0.1 + 0.1 * Math.min(tr, 1.6); // line jaggedness amplitude
          t.q7 = 0.06; // gentle S-bend so the line isn't ruler-straight
          return t;
        },
        warp:
          NOISE_GLSL +
          "shader_body {\n" +
          "vec2 d = uv - vec2(0.5);\n" +
          "float turb = fbm(d * 6.0 + time * 0.4) - 0.5;\n" +
          // looser swirl eye (0.40/(len+0.22)) + gentler bass turbulence -> organic churn,
          // not a crisp mathematical drain.
          "float a = 0.40 / (length(d) + 0.22) + turb * (0.3 + 0.5 * bass);\n" +
          "float s = sin(a + time * 0.22), c = cos(a + time * 0.22);\n" + // slower swirl (was time*0.5 — too fast)
          "vec2 sw = vec2(d.x * c - d.y * s, d.x * s + d.y * c);\n" +
          "ret = texture2D(sampler_main, vec2(0.5) + sw * 0.99).rgb;\n" +
          "ret -= 0.003;\n" +
          "}\n",
        comp:
          // BRIGHT glowing wash that cycles blue <-> magenta/pink; the white line punches
          // through near-white on top of the hued wash.
          "shader_body {\n" +
          "vec3 c = texture2D(sampler_main, uv).rgb;\n" +
          "float lc = max(c.r, max(c.g, c.b));\n" +
          "float v = 0.18 + 1.0 * dot(c, vec3(0.45));\n" + // lifted floor -> never goes black
          "vec3 tint = mix(vec3(0.18,0.34,0.98), vec3(0.92,0.32,0.88), 0.5+0.5*sin(time*0.07));\n" +
          "vec3 col = tint * v * 1.15;\n" +
          "float dd = distance(uv, vec2(0.5));\n" +
          "col += tint * exp(-dd * dd * 2.2) * 0.30;\n" + // central bloom (trimmed so the centre doesn't wash white)
          // the hot line blows WHITE, kept SELECTIVE (high threshold) so the bright wash
          // itself doesn't go white; thickness comes from the wave's thick=5, not the threshold.
          "col += vec3(1.0) * smoothstep(0.62, 0.95, lc) * 1.6;\n" +
          "ret = col / (col + 0.85) * 1.3;\n" + // tone-map so the bloom stays luminous, not blown
          "}\n",
      }
    );
    // The WMP signature: a single jagged WHITE horizontal audio-waveform line through the
    // centre (Thingus crossLine at angle 0). Drawn white + additive; the comp lets its hot
    // feedback punch through to white while the swirled trail tints into the wash.
    function hLine(useV2) {
      return {
        baseVals: Object.assign({}, WAVE_BASE, {
          enabled: 1,
          samples: 512,
          additive: 1,
          usedots: 0,
          scaling: 1,
          smoothing: 0.6,
          a: 1.0,
          thick: 5,
          r: 1.0,
          g: 1.0,
          b: 1.0,
        }),
        init_eqs: passthrough,
        frame_eqs: passthrough,
        point_eqs: function (a) {
          var s = a.sample * 2.0 - 1.0; // -1 .. +1 across the pane
          var len = a.q5 || 0.78;
          var amp = a.q6 || 0.12;
          var samp = useV2 ? (a.value2 !== undefined ? a.value2 : a.value1) : a.value1;
          var bend = (a.q7 || 0.06) * Math.sin(s * Math.PI);
          // jagged across the FULL width (incl. centre, like the ref) — taper only the
          // extreme ends so the strands don't fly off-pane.
          var taper = s < -0.7 ? (s + 1.0) / 0.3 : s > 0.7 ? (1.0 - s) / 0.3 : 1.0;
          a.x = 0.5 + s * len;
          a.y = 0.5 + bend + samp * amp * taper; // perpendicular (vertical) jaggedness
          a.r = 1.0;
          a.g = 1.0;
          a.b = 1.0;
          return a;
        },
      };
    }
    preset.waves[0] = hLine(false);
    preset.waves[1] = hLine(true); // faint 2nd strand on value2 for thickness
    preset.waves[1].baseVals.a = 0.5;
    return preset;
  })();

  // ── Ambience X Marks the Spot ───────────────────────────────────────────────
  // Re-derived from the reference (window ~168-175): the ENTIRE pane is a vivid magenta/
  // pink plasma field; from a WHITE-HOT central core, thin WHITE lightning bolts radiate
  // outward as a rotating + / X (4 arms), each a crisp jagged arc with a soft pink halo.
  // It BREATHES — sharp crossed white bolts on energy, dissolving to a soft pink cloud with
  // a bright centre at rest. Fixed magenta hue (no cycle). (Was thick magenta waveform
  // ribbons on a near-BLACK vignetted field with a pink — not white — core: too dark, wrong
  // texture, no white bolts.)
  P["Ambience X Marks the Spot"] = (function () {
    var preset = build(
      {
        wave_a: 0,
        decay: 0.92, // crisper arms (less feedback smear into thick ribbons); the comp floor
        gammaadj: 1.8, // keeps the field pink, so a shorter trail doesn't leave black voids
        zoom: 1.0,
        rot: 0.0,
        warp: 0.02,
        darken_center: 0,
        wrap: 0,
      },
      {
        frame: function (t) {
          var b = t.bass_att || t.bass || 1;
          t.q1 = t.time * 0.15; // slow cross rotation (passes through + and X)
          // BREATHING: wide audio range so low energy -> faint thin arms (near-cloud),
          // high energy -> bright reaching bolts.
          t.q6 = 0.03 + 0.12 * b;
          return t;
        },
        comp:
          // Vivid PINK field (filled, never black) with WHITE-HOT bolt cores + centre bloom.
          "shader_body {\n" +
          "vec3 c = texture2D(sampler_main, uv).rgb;\n" +
          "float lc = max(c.r, max(c.g, c.b));\n" +
          "float v = dot(c, vec3(0.45));\n" +
          "float dd = distance(uv, vec2(0.5));\n" +
          "vec3 col = vec3(0.95, 0.25, 0.70) * v * 1.3;\n" + // bolt feedback, tinted pink
          "col += vec3(0.55, 0.11, 0.42) * (0.30 + 0.20 * bass);\n" + // PINK floor -> whole pane pink (lower = more contrast)
          "col += vec3(0.80, 0.24, 0.60) * exp(-dd * dd * 2.2) * 0.32;\n" + // centre-weighted pink cloud
          "col += vec3(1.0, 0.88, 0.97) * exp(-dd * dd * 3.0) * (0.22 + 0.5 * bass);\n" + // WHITE core bloom (beat-pulsed)
          // the white crossing bolts APPEAR on the beat and fade between (user: waveform
          // appears/disappears); the pink field persists so it never goes blank.
          "float beat = smoothstep(1.05, 1.45, bass);\n" +
          "col += vec3(1.0, 0.92, 0.98) * smoothstep(0.5, 0.92, lc) * (0.15 + 1.05 * beat);\n" +
          "ret = col / (col + 0.7) * 1.4;\n" + // tone-map -> bright pink field, bounded (no flat blow-out)
          "}\n",
      }
    );
    // Two crossed real-audio spokes at +/-45 deg (= 4 arms) -> a rotating X. Drawn near-WHITE
    // (the comp's pink tint provides the halo, the white punch keeps the cores white-hot);
    // jagged from the live waveform = the lightning. q6 (audio) drives the bolt reach.
    var offs = [0.785, -0.785];
    for (var i = 0; i < 2; i++) {
      preset.waves[i] = spokeLine(0, 0.55, 0.1, 1.0, 0.85, 0.97);
      // blend adjacent samples -> ONE jagged lightning arc per arm (not 512 strands /
      // a wide oscilloscope ribbon); matches the reference's crisp single bolt.
      preset.waves[i].baseVals.smoothing = 0.55;
      preset.waves[i].baseVals.thick = 3; // a bit thicker (user note)
      (function (off, idx) {
        preset.waves[idx].point_eqs = function (a) {
          var th = (a.q1 || 0) + off;
          var s = a.sample * 2.0 - 1.0;
          var amp = a.q6 || 0.1;
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
