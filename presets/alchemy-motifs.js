/* Alchemy family presets — individual motif studies (nets, orbs, mandalas, anemones, spindle, ribbon, moiré, …).
 * Plain <script> loaded AFTER presets/kit.js; registers into window.WMP_PRESETS.
 * Uses the shared kit globals (build, circleWave, ALC_PAL, alc* factories, ...).
 * (Split out of the former monolithic presets/alchemy.js — see CLAUDE.md.)
 */
(function () {
  "use strict";
  var P = (window.WMP_PRESETS = window.WMP_PRESETS || {});

  // ── Alchemy v2: Wireframe Net ────────────────────────────────────────────────
  // Built from the ALCHEMY KIT. The woven net is FRAME FEEDBACK (docs foundation #1): a 2D
  // STAR (two waveform triangles) is redrawn each frame and its feedback TRAIL builds the
  // structure. Two scenes, SAME motifs, different CAMERA — the vocabulary-and-camera idea:
  //   • Wireframe Net  = "top" camera (trace shrinks to center) -> face-on spinning mandala.
  //   • Net Corridor   = "side" camera (trace recedes to a right VP) -> the fish-bone corridor.
  // Both add an orb (fill + bright border) whose feedback trail is the receding row of orbs.
  P["Alchemy v2: Wireframe Net"] = (function () {
    var preset = build(
      alcCamera("top"), // trace shrinks to center -> face-on mandala
      {
        frame: alcNetFrame(function () {
          return [0.5, 0.5];
        }, 0.955),
        comp: ALC_COMP,
      }
    );
    var star = alcStarWaves(2, 0.0); // two waveform triangles -> hexagram
    preset.waves[0] = star[0];
    preset.waves[1] = star[1];
    preset.waves[2] = alcOrbSame(0.0); // mono glow core (ring same hue as fill)
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
    var K = 1.4,
      nearX = 0.14,
      nearYT = 0.26,
      nearYB = 0.54,
      vpx = 0.86,
      vpy = 0.62;

    var preset = build(alcCamera("side"), {
      frame: alcNetFrame(function () {
        return [0.42, 0.5];
      }, 0.95),
      comp: ALC_COMP,
    });

    // Wrap frame_eqs: publish head-orb ring EDGES (not centers) to q21–q24 so the
    // tether wave spans exactly the gap between the two rings without crossing them.
    var baseFrame = preset.frame_eqs;
    preset.frame_eqs = function (t) {
      baseFrame(t);
      var raw = (t.q14 || 0) - Math.floor(t.q14 || 0);
      var proj = 1.0 / (1.0 + K * raw);
      // wobble must match makeOrbTrailShapes exactly (same raw, proj, and q19 time clock)
      var tm = t.q19 !== undefined ? t.q19 : t.time || 0;
      var wob = 0.05 * Math.sin(raw * 6.2832 * 1.3 + tm * 0.8) * proj;
      var orbRad = 0.11 * proj * 0.65; // matches makeOrbTrailShapes s.rad
      t.q21 = (nearX - vpx) * proj + vpx; // head X (both rows same)
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
        enabled: 1,
        samples: 512,
        additive: 1,
        usedots: 0,
        scaling: 1,
        smoothing: 0.04,
        a: 1.0,
      }),
      init_eqs: passthrough,
      frame_eqs: passthrough,
      point_eqs: function (a) {
        var ax = a.q21 || nearX,
          ay = a.q22 || nearYT + 0.07;
        var bx = a.q23 || nearX,
          by = a.q24 || nearYB - 0.07;
        var dx = bx - ax,
          dy = by - ay;
        var len = Math.sqrt(dx * dx + dy * dy) || 0.001;
        var px = -dy / len,
          py = dx / len;
        // ef tapers displacement to 0 at both endpoints — line stays attached to ring edges
        var ef = sm01(Math.min(a.sample * 6, 1.0)) * sm01(Math.min((1.0 - a.sample) * 6, 1.0));
        a.x = ax + a.sample * dx + 0.12 * (a.value1 || 0) * ef * px;
        a.y = ay + a.sample * dy + 0.12 * (a.value1 || 0) * ef * py;
        a.r = 2.8;
        a.g = 2.8;
        a.b = 3.5;
        return a;
      },
    };

    preset.waves[3] = alcOrbDotTrail(2, ALC_PAL.warm); // fine dots under each ring trail
    preset.shapes = makeOrbTrailShapes(8, 2, ALC_PAL.warm);
    return preset;
  })();

  // ── Alchemy v2: Gradient Orbs ────────────────────────────────────────────────
  // Two gradient-blob orbs (hot gold core + cyan halo) orbiting around a centered
  // feathery ring — demonstrates alcOrbGradBlob, alcOrbFeathery, alcOrbDotColumns.
  // Flat camera (near-zero feedback) so all shapes stay crisp.
  P["Alchemy v2: Gradient Orbs"] = (function () {
    var hue = 0,
      lastT = 0;
    var preset = build(alcCamera("flat"), {
      frame: function (t) {
        var bass = t.bass_att || 1,
          mid = t.mid_att || 1;
        var tm = t.time,
          dt = Math.min(0.1, Math.max(0, tm - lastT));
        lastT = tm;
        hue = (hue + dt * (0.018 + 0.04 * ((bass + mid) / 2))) % 1;
        var R = 0.18 + 0.03 * Math.max(0, bass - 1); // tighter orbit — blobs stay on screen
        var omega = 0.3;
        t.q21 = 0.5 + R * Math.cos(omega * tm); // orb A x (shape space)
        t.q22 = 0.5 + R * Math.sin(omega * tm); // orb A y
        t.q23 = 0.5 - R * Math.cos(omega * tm); // orb B x
        t.q24 = 0.5 - R * Math.sin(omega * tm); // orb B y
        t.q5 = 0.04 + 0.01 * Math.max(0, bass - 1); // feathery ring very small — subtle pulse only
        t.q7 = 0.065 + 0.02 * Math.max(0, bass - 1); // orb base radius
        t.q8 = hue;
        t.q9 = tm * 0.25; // feathery ring slow rotation
        return t;
      },
      comp: ALC_COMP,
    });
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
    var hue = 0,
      lastT = 0;
    var COMP =
      "shader_body {\n" +
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
        wave_a: 0,
        decay: 0.93,
        gammaadj: 1.35,
        zoom: 0.997, // slight inward drift — trails compact but not pulled to center
        rot: 0.0,
        warp: 0.0,
        wrap: 0,
        darken_center: 0,
        echo_alpha: 0,
      },
      {
        frame: function (t) {
          var bass = t.bass_att || 1,
            treb = t.treb_att || 1;
          var tm = t.time,
            dt = Math.min(0.1, Math.max(0, tm - lastT));
          lastT = tm;
          hue = (hue + dt * (0.015 + 0.04 * bass)) % 1;

          // Two orbs on opposite ends of a slowly-rotating diagonal axis
          var R = 0.34 + 0.04 * Math.max(0, bass - 1);
          var ang = tm * 0.18; // slow orbital precession
          t.q21 = 0.5 + R * Math.cos(ang); // orb A x
          t.q22 = 0.5 + R * Math.sin(ang); // orb A y
          t.q23 = 0.5 - R * Math.cos(ang); // orb B x (antipodal)
          t.q24 = 0.5 - R * Math.sin(ang); // orb B y
          t.q7 = 0.07 + 0.02 * Math.max(0, bass - 1); // ring radius
          t.q8 = hue;
          t.q26 = 0.04 + 0.05 * Math.max(0, treb - 1); // tether jaggedness (treble-driven)
          return t;
        },
        comp: COMP,
      }
    );

    // waves: bullseye at each orb + waveform tether
    preset.waves[0] = alcOrbTarget("q21", "q22", 2, ALC_PAL.warm); // orb A: 2 concentric rings
    preset.waves[1] = alcOrbTarget("q23", "q24", 2, ALC_PAL.warm); // orb B: 2 concentric rings
    preset.waves[2] = alcTether(
      "q21",
      "q22",
      "q23",
      "q24",
      "q26", // golden waveform tether
      function (a, i) {
        ALC_PAL.warm(a, 0);
        a.r = Math.min(1.5, a.r * 1.4);
        a.g = Math.min(1.5, a.g * 1.3);
      }
    );
    return preset;
  })();

  // ── Alchemy v2: Marble ───────────────────────────────────────────────────────
  // BG4 showcase: the green<->magenta domain-warped "marble / aurora" field (section
  // E-late of the reference) — fbm with bright iso-contour ridges swirling in place,
  // plus the faint static dither (BG10). Two bullseye orbs on a slow antipodal orbit
  // joined by a live-waveform tether sit over it (orbs-over-marble, per the frames).
  // This is a CALM "rest" scene — muted, near-zero feedback so the marble stays crisp.
  P["Alchemy v2: Marble"] = (function () {
    var hue = 0,
      lastT = 0;
    var preset = build(
      {
        wave_a: 0,
        decay: 0.9,
        gammaadj: 1.35,
        zoom: 1.0,
        rot: 0.006, // tiny global swirl; the marble swirl is in-shader
        warp: 0.0,
        wrap: 0,
        darken_center: 0,
        echo_alpha: 0,
      },
      {
        frame: function (t) {
          var bass = t.bass_att || 1,
            mid = t.mid_att || 1,
            treb = t.treb_att || 1;
          var tm = t.time,
            dt = Math.min(0.1, Math.max(0, tm - lastT));
          lastT = tm;
          hue = (hue + dt * (0.015 + 0.03 * ((bass + mid) / 2))) % 1;

          var R = 0.3 + 0.03 * Math.max(0, bass - 1); // slow antipodal orbit
          var ang = tm * 0.16;
          t.q21 = 0.5 + R * Math.cos(ang); // orb A
          t.q22 = 0.5 + R * Math.sin(ang);
          t.q23 = 0.5 - R * Math.cos(ang); // orb B (antipodal)
          t.q24 = 0.5 - R * Math.sin(ang);
          t.q7 = 0.05 + 0.02 * Math.max(0, bass - 1); // bullseye ring radius
          t.q8 = hue;
          t.q26 = 0.03 + 0.05 * Math.max(0, treb - 1); // tether jaggedness (treble)
          return t;
        },
        // BG4 marble + crisp geometry + soft bloom + Reinhard tone-map + BG10 hatch.
        comp:
          NOISE_GLSL +
          ALC_MARBLE_GLSL +
          "shader_body {\n" +
          "vec2 d = uv - 0.5; d.x *= resolution.x / resolution.y;\n" +
          "vec3 bg = alcMarble(d, time, bass, vec3(0.16,0.40,0.27), vec3(0.42,0.24,0.46), vec3(0.45,0.85,0.55));\n" + // green<->magenta + lime veins
          "vec3 sharp = texture2D(sampler_main, uv).rgb;\n" +
          "vec3 glow = (texture2D(sampler_blur1, uv).rgb + texture2D(sampler_blur2, uv).rgb) * 0.5;\n" +
          "vec3 outc = bg + sharp + glow * 0.28;\n" +
          "ret = outc / (outc + vec3(0.80));\n" + // Reinhard: muted, no white-out
          ALC_HATCH +
          "}\n",
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
    var hue = 0,
      lastT = 0,
      lastStamp = 0;
    var preset = build(
      {
        // NOTE: `decay` is IGNORED in this Butterchurn build — the fade is the WARP shader
        // below (a fast multiplicative fade), NOT this value. See WARP_DEFAULT gotcha in CLAUDE.md.
        wave_a: 0,
        gammaadj: 1.5,
        zoom: 1.0,
        rot: 0.0,
        warp: 0.0,
        wrap: 0,
        darken_center: 0,
        echo_alpha: 0,
      },
      {
        frame: function (t) {
          var bass = t.bass_att || 1,
            treb = t.treb_att || 1;
          var tm = t.time,
            dt = Math.min(0.1, Math.max(0, tm - lastT));
          lastT = tm;
          hue = (hue + dt * (0.03 + 0.05 * bass)) % 1; // hue still drifts with music; rotation does NOT
          t.q1 = tm * 3.4; // CONSTANT spin (~0.5 rev/s) — NOT audio-driven, per user
          t.q8 = hue;
          // STROBE: stamp a spoke ~every 0.03s -> denser discrete spokes (still gaps between them).
          if (tm - lastStamp >= 0.03) {
            t.q15 = 1;
            lastStamp = tm;
          } else {
            t.q15 = 0;
          }
          // two antipodal gold orbiters (the "worms"): the fade warp leaves a short bead trail
          // along their slow orbit -> the gold-worm look from the original. Joined by a tether.
          var R = 0.34 + 0.03 * Math.max(0, bass - 1);
          var oa = tm * 0.18;
          t.q21 = 0.5 + R * Math.cos(oa);
          t.q22 = 0.5 + R * Math.sin(oa);
          t.q23 = 0.5 - R * Math.cos(oa);
          t.q24 = 0.5 - R * Math.sin(oa);
          t.q7 = 0.03 + 0.015 * Math.max(0, bass - 1); // orbiter head radius (small)
          t.q26 = 0.03 + 0.05 * Math.max(0, treb - 1); // tether jaggedness (treble)
          return t;
        },
        // FADE is here (decay baseVal does nothing in this build): multiplicative fade in place
        // (no movement — we sample uv directly). 0.91/frame -> a stamped spoke is ~gone in ~0.8s,
        // just UNDER one rotation period (~0.9s) -> the oldest spokes vanish before the line laps
        // back, so a FULL CIRCLE never accumulates (per user). Much faster than the old `ret-=0.004`.
        warp: "shader_body {\nret = texture2D(sampler_main, uv).rgb * 0.91;\n}\n",
        // Composition: aurora color-bleed motif (UNDER) + the line tunnel (sampler_main) + bloom.
        comp:
          NOISE_GLSL +
          PAL_GLSL +
          ALC_AURORA_GLSL +
          "shader_body {\n" +
          "vec2 d = uv - 0.5; d.x *= resolution.x / resolution.y;\n" +
          "float pr = length(d);\n" +
          "vec3 aur = alcAurora(d, time, bass) * smoothstep(0.05, 0.7, pr) * 0.6;\n" + // color bleed, stronger toward edges
          "vec3 g = texture2D(sampler_main, uv).rgb;\n" +
          "vec3 glow = (texture2D(sampler_blur1, uv).rgb + texture2D(sampler_blur2, uv).rgb) * 0.5;\n" +
          "vec3 outc = aur + g + glow * 0.35;\n" +
          "outc += vec3(1.0, 0.55, 0.45) * exp(-pr * pr * 80.0) * 0.15;\n" + // warm center focus
          "vec2 pe = d - vec2(0.12, -0.03);\n" +
          "outc *= 1.0 - 0.55 * exp(-dot(pe,pe) * 120.0);\n" + // off-center dark hole (the teardrop pupil)
          "float vig = smoothstep(1.25, 0.2, pr);\n" +
          "outc = outc * vig;\n" +
          "ret = outc / (outc + vec3(0.85));\n" + // Reinhard tone-map
          "}\n",
      }
    );
    // Compose the reusable BG8 fan motif (rotating diameter-lines). The scene drives q1/q8
    // and supplies the feedback camera above; alcRotLines is the drop-in seed primitive.
    // ONE thick plain (no-waveform) line. Thickness = 3 TIGHT parallel copies (gap 0.0012)
    // that MERGE into a single fat stroke (not 3 separate lines — that earlier bug used 5x the
    // gap). Strobed -> discrete spokes; the warp fade clears them within a rotation (no full circle).
    var lines = alcRotLines(3, {
      parallel: true,
      gap: 0.0012,
      len: 0.7,
      jiggle: 0,
      sat: 0.6,
      alpha: 0.95,
      thick: 1,
      strobeVar: "q15",
    });
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
    var huePhase = 0,
      lastT = 0;
    var preset = build(
      {
        wave_a: 0,
        decay: 0.97,
        gammaadj: 1.35, // long smear -> streaming filaments
        zoom: 1.0,
        rot: 0.0,
        warp: 0.0,
        wrap: 0,
        darken_center: 0, // center is the BRIGHT source (opposite of Vortex's pupil)
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
          huePhase = (huePhase + dt * (0.03 + 0.06 * ((bass + mid + treb) / 3))) % 1;
          t.q8 = huePhase;
          t.q9 = 0.035 + 0.03 * bass; // burst base radius (strands start near center)
          t.q10 = 0.05 + 0.07 * mid; // filament length (waveform amplitude)
          return t;
        },
        // FEEDBACK = the fountain: swirl + bloom OUTWARD. Sampling the previous frame from a
        // coord scaled TOWARD center (sc<1) makes its content expand outward each frame; the
        // rotation curves the streams into a pinwheel. mid speeds the spin; bass spreads faster.
        warp:
          "shader_body {\n" +
          "vec2 c = uv - 0.5;\n" +
          "float tw = 0.022 + 0.030 * mid;\n" + // swirl
          "float sc = 0.972 - 0.012 * bass;\n" + // <1 -> stream OUTWARD; bass widens
          "float s = sin(tw), co = cos(tw);\n" +
          "vec2 sd = vec2(c.x * co - c.y * s, c.x * s + c.y * co) * sc + 0.5;\n" +
          "ret = texture2D(sampler_main, sd).rgb;\n" +
          "ret -= 0.003;\n" + // slow fade -> long fountain trails
          "}\n",
        comp:
          NOISE_GLSL +
          "shader_body {\n" +
          "vec2 d = uv - 0.5; d.x *= resolution.x / resolution.y;\n" +
          "float pr = length(d);\n" +
          "float n = fbm(uv * 2.2 + vec2(time * 0.03, -time * 0.02));\n" +
          "vec3 haze = mix(vec3(0.06, 0.02, 0.09), vec3(0.02, 0.09, 0.10), n);\n" + // dusty purple <-> teal
          "haze *= (1.0 - smoothstep(0.15, 1.0, pr)) * (0.5 + 0.4 * bass);\n" + // soft, fades to edge
          "vec3 g = texture2D(sampler_main, uv).rgb;\n" +
          "vec3 glow = (texture2D(sampler_blur1, uv).rgb + texture2D(sampler_blur2, uv).rgb) * 0.5;\n" +
          "vec3 outc = haze + g + glow * 0.35;\n" +
          "outc += vec3(1.0, 0.85, 0.55) * exp(-pr * pr * 90.0) * (0.25 + 0.5 * bass);\n" + // hot gold nucleus
          "ret = outc / (outc + vec3(0.82));\n" + // Reinhard tone-map
          "}\n",
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
      alcCamera("side"), // fly INTO corridor (zoom>1), VP anchored right
      {
        frame: alcNetFrame(function () {
          return [0.42, 0.5];
        }, 0.95),
        comp: ALC_COMP,
      }
    );
    var ray = alcRayWaves(1, 0.0, 2.6); // ONE long waveform line
    preset.waves[0] = ray[0];
    preset.waves[1] = alcOrbRow(1, 0.0, 0.5, 0.12, 0.5, 0.9, 0.5); // ONE ring orb
    return preset;
  })();

  // ── Alchemy v2: Ray Burst ────────────────────────────────────────────────────
  // Demonstrates the RAY motif: 5 live-waveform lines through the center, rotating around
  // the axis (q9), over the "top" camera so their feedback trail blooms into a spinning
  // asterisk/net burst with an orb core. Same kit, different motif.
  P["Alchemy v2: Ray Burst"] = (function () {
    var preset = build(alcCamera("top"), {
      frame: alcNetFrame(function () {
        return [0.5, 0.5];
      }, 0.955),
      comp: ALC_COMP,
    });
    var rays = alcRayWaves(5, 0.0, 3.0); // 5 rotating waveform lines, LONG (span the screen)
    preset.waves[0] = rays[0];
    preset.waves[1] = rays[1];
    preset.waves[2] = rays[2];
    preset.waves[3] = rays[3];
    preset.waves[4] = rays[4];
    preset.waves[5] = alcOrbWhite(0.0); // orb core, white ring (6 waves total — at the cap)
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
      {
        wave_a: 0,
        gammaadj: 1.3,
        decay: 0.3,
        zoom: 1.0,
        cx: 0.5,
        cy: 0.5,
        dx: 0.0,
        dy: 0.0,
        rot: 0.0,
        warp: 0.0,
        wrap: 0,
        darken_center: 0,
        echo_alpha: 0,
      },
      {
        frame: function (t) {
          var bass = t.bass_att || t.bass || 1,
            treb = t.treb_att || t.treb || 1;
          var bn = Math.max(0, Math.min(bass - 1, 1));
          t.q2 = 0.5;
          t.q3 = 0.5;
          t.q5 = 0.3 + 0.7 * bn; // breathing: collapse when quiet, bloom on bass
          t.q6 = 0.02 + 0.035 * Math.min(treb, 2.0); // edge jaggedness (live waveform) — light, so the 4 edges read
          t.q8 = (t.time * 0.05) % 1; // slow hue drift
          t.q9 = t.time * 0.9; // slow self-rotation (rad)
          return t;
        },
        warp: ALC_CLEAR_WARP,
        comp: ALC_FLATBLUE_COMP,
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
      {
        wave_a: 0,
        gammaadj: 1.3,
        decay: 0.3,
        zoom: 1.0,
        cx: 0.5,
        cy: 0.5,
        dx: 0.0,
        dy: 0.0,
        rot: 0.0,
        warp: 0.0,
        wrap: 0,
        darken_center: 0,
        echo_alpha: 0,
      },
      { frame: alcMandalaFrame(), warp: ALC_CLEAR_WARP, comp: ALC_FLATBLUE_COMP }
    );
    // Diagonal at index 0 (drawn FIRST) so it can't be the silently-dropped last wave; mandala follows.
    // corner-to-corner so its ends stick out BEYOND the net (reads as a separate slash, not a net chord).
    preset.waves[0] = alcDiagonalLine(0.62, 0.85, 0.1, 1.0, 0.85, 0.95); // persistent BOLD jagged pink-white diagonal
    var stack = alcNgonStack(1.7, ALC_MANDALA_SPECS, 3); // 12 polygons packed 3/wave -> 4 waves
    for (var i = 0; i < stack.length; i++) preset.waves[i + 1] = stack[i]; // mandala at indices 1..4 (5 waves total)
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
    { sides: 16, skip: 1, radius: 0.38, dir: 1.0, rotate: 0.0, hueOff: 0.0, tier: 0 },
    { sides: 12, skip: 1, radius: 0.31, dir: -0.9, rotate: 0.13, hueOff: 0.1, tier: 0 },
    { sides: 10, skip: 1, radius: 0.25, dir: 1.1, rotate: 0.25, hueOff: 0.2, tier: 0 },
    // Star overlays at outer/mid radius — crossing chords add depth to the outer ring layer
    { sides: 12, skip: 5, radius: 0.36, dir: 0.7, rotate: 0.08, hueOff: 0.55, tier: 1 },
    { sides: 8, skip: 3, radius: 0.26, dir: -0.6, rotate: 0.0, hueOff: 0.65, tier: 1 },
    { sides: 8, skip: 1, radius: 0.2, dir: -1.0, rotate: 0.0, hueOff: 0.33, tier: 1 },
    // Mid/inner concentric rings
    { sides: 7, skip: 1, radius: 0.15, dir: 1.2, rotate: 0.2, hueOff: 0.44, tier: 1 },
    { sides: 6, skip: 1, radius: 0.11, dir: -0.8, rotate: 0.0, hueOff: 0.7, tier: 2 },
    { sides: 5, skip: 1, radius: 0.08, dir: 0.9, rotate: 0.1, hueOff: 0.8, tier: 2 },
    // Inner star overlays
    { sides: 6, skip: 2, radius: 0.13, dir: -1.1, rotate: 0.05, hueOff: 0.26, tier: 2 },
    { sides: 5, skip: 2, radius: 0.09, dir: 0.8, rotate: 0.0, hueOff: 0.87, tier: 2 },
    // Tiny central anchor — a square/diamond at the center
    { sides: 4, skip: 1, radius: 0.05, dir: -1.0, rotate: 0.0, hueOff: 0.15, tier: 2 },
  ];
  // Comp for the Nested Mandala: flat-blue bg + soft radial core glow (pulsing on bass — the center
  // is the focal point of this scene, not the L/R eyes) + Reinhard tone-map.
  var ALC_NESTED_COMP =
    "shader_body {\n" +
    "vec2 d = uv - 0.5; d.x *= resolution.x / resolution.y;\n" +
    "float pr = length(d);\n" +
    "vec3 g = texture2D(sampler_main, uv).rgb;\n" +
    "vec3 bloom = (texture2D(sampler_blur1, uv).rgb + texture2D(sampler_blur2, uv).rgb) * 0.5;\n" +
    "vec3 bg = vec3(0.08, 0.18, 0.32);\n" + // slightly deeper blue than the spirograph Mandala
    "float core = exp(-pr * pr * 18.0);\n" + // tight gaussian at center
    "vec3 coreCol = vec3(0.18, 0.35, 0.60) * core * (0.5 + 0.8 * bass);\n" + // muted blue-teal core glow, bass-driven
    "vec3 outc = bg + g + bloom * 0.18 + coreCol;\n" +
    "ret = outc / (outc + vec3(0.85));\n" + // Reinhard — muted, never blows to white
    "}\n";

  P["Alchemy v2: Nested Mandala"] = (function () {
    var preset = build(
      {
        wave_a: 0,
        gammaadj: 1.3,
        decay: 0.3,
        zoom: 1.0,
        cx: 0.5,
        cy: 0.5,
        dx: 0.0,
        dy: 0.0,
        rot: 0.0,
        warp: 0.0,
        wrap: 0,
        darken_center: 0,
        echo_alpha: 0,
      },
      { frame: alcMandalaFrame(), warp: ALC_CLEAR_WARP, comp: ALC_NESTED_COMP }
    );
    // 12 specs packed 3/wave -> 4 waves (well under cap). Tier-0 specs are FIRST so wave 0
    // always has the outer ring envelopes (gracefully degrades if the last wave drops).
    var stack = alcNgonStack(1.0, ALC_NESTED_SPECS, 3); // aspectX=1.0 -> circular (rosette not ellipse)
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
    var hue = 0,
      lastT = 0,
      spin = 0;
    // Custom comp: fills the central triangle-hole with a soft dusty-magenta CORE glow (pulses
    // on bass) so the middle isn't black, plus a mild bloom around the colored lines, tone-mapped.
    var ANEMONE_COMP =
      "shader_body {\n" +
      "vec2 d = uv - 0.5; d.x *= resolution.x / resolution.y;\n" +
      "float pr = length(d);\n" +
      "vec3 g = texture2D(sampler_main, uv).rgb;\n" +
      "vec3 bloom = (texture2D(sampler_blur1, uv).rgb + texture2D(sampler_blur2, uv).rgb) * 0.5;\n" +
      "float core = exp(-pr * pr * 16.0);\n" + // soft gaussian, brightest at center
      "vec3 coreCol = vec3(0.55, 0.18, 0.42) * core * (0.75 + 0.55 * bass);\n" + // dusty magenta center fill
      "vec3 outc = g + bloom * 0.12 + coreCol;\n" +
      "ret = outc / (outc + vec3(0.85));\n" + // Reinhard tone-map -> muted, no white-out
      "}\n";
    var preset = build(
      // flat camera, moderate decay (0.5): anemone lines redrawn crisp each frame; the soft
      // radial bleed + the comp core/bloom give the glow.
      Object.assign({}, alcCamera("flat"), { decay: 0.5 }),
      {
        frame: function (t) {
          var bass = t.bass_att || t.bass || 1,
            mid = t.mid_att || t.mid || 1,
            treb = t.treb_att || t.treb || 1;
          var tm = t.time,
            dt = Math.min(0.1, Math.max(0, tm - lastT));
          lastT = tm;
          var bn = Math.max(0, Math.min(bass - 1, 1));
          hue = (hue + dt * (0.02 + 0.04 * bn)) % 1;
          // ROTATION LINKED TO INTENSITY: slow drift when quiet, whips around on the beat.
          spin = spin + dt * (0.5 + 4.0 * bn); // anemone self-spin (bass-driven)
          t.q2 = 0.5;
          t.q3 = 0.5;
          t.q5 = 0.4 + 0.1 * bn; // PULSAR pulse: starburst radius (big -> fills screen)
          t.q6 = 0.02 + 0.04 * Math.min(mid + 0.5 * treb, 2.0); // edge jaggedness (live waveform on the triangle sides)
          t.q8 = hue; // two-tone hue drift
          t.q9 = spin; // rotation
          // vortex: 0 at rest; shears the spikes into a swirl on STRONG bass (>~1.2)
          t.q10 = 0.8 * Math.max(0, Math.min((bass - 1.2) / 0.6, 1));
          return t;
        },
        comp: ANEMONE_COMP,
      }
    );
    preset.waves[0] = alcAnemone(30, ALC_PAL.roseGreen); // 30 overlapping ~24° waveform triangles; green↔magenta palette
    // NOTE: orbiter pair + tether (alcTether / alcOrbiterNode, driven by q21..q26) are DEFERRED —
    // they smeared under feedback on this scene. The kit elements remain for a low-feedback host.
    return preset;
  })();

  // ── Alchemy v2: Anemone (Petals) ─────────────────────────────────────────────
  // Same base-on-a-circle starburst as Anemone, but SMOOTH edges (q6=0), a SLOW spin and a
  // longer color-bleed feedback (decay 0.82) -> the clean overlapping-petal "dahlia" look
  // (crisp twin-tone petals washing color into the background) rather than the frizzy fast one.
  P["Alchemy v2: Anemone (Petals)"] = (function () {
    var hue = 0,
      lastT = 0,
      spin = 0;
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
      Object.assign({}, alcCamera("flat"), { decay: 0.82 }), // long bleed -> petals wash color into the bg
      {
        frame: function (t) {
          var bass = t.bass_att || t.bass || 1;
          var tm = t.time,
            dt = Math.min(0.1, Math.max(0, tm - lastT));
          lastT = tm;
          var bn = Math.max(0, Math.min(bass - 1, 1));
          hue = (hue + dt * (0.02 + 0.04 * bn)) % 1;
          spin = spin + dt * (0.1 + 0.18 * bn); // SLOW spin (clean, coherent petals)
          t.q2 = 0.5;
          t.q3 = 0.5;
          t.q5 = 0.4 + 0.1 * bn; // pulse size on bass
          t.q6 = 0; // SMOOTH edges (no waveform frizz) -> clean petals
          t.q8 = hue;
          t.q9 = spin;
          t.q10 = 0.6 * Math.max(0, Math.min((bass - 1.2) / 0.6, 1));
          return t;
        },
        comp: ANEMONE_COMP,
      }
    );
    // Palette picked from the kit: redCyan (two-tone). Swap to ALC_PAL.mono for a single colour,
    // or ALC_PAL.spread for multicolour — colour is a scene CONFIG, not baked into the motif.
    preset.waves[0] = alcAnemone(30, ALC_PAL.redCyan); // clean overlapping ~24° petals (smooth)
    return preset;
  })();

  // ── Alchemy v2: Anemone (Mandala) ────────────────────────────────────────────
  // The SECOND construction: full EQUILATERAL triangles overlapping at their shared CENTER,
  // each rotated by a small tilt -> a spinning star-polygon mandala with a dark center hole.
  // Same kit feel (flat camera, colored non-additive outlines, waveform-jagged edges, color
  // bleed to bg), different geometry from the base-on-a-circle Anemone.
  P["Alchemy v2: Anemone (Mandala)"] = (function () {
    var hue = 0,
      lastT = 0,
      spin = 0;
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
    var preset = build(Object.assign({}, alcCamera("flat"), { decay: 0.5 }), {
      frame: function (t) {
        var bass = t.bass_att || t.bass || 1,
          mid = t.mid_att || t.mid || 1,
          treb = t.treb_att || t.treb || 1;
        var tm = t.time,
          dt = Math.min(0.1, Math.max(0, tm - lastT));
        lastT = tm;
        var bn = Math.max(0, Math.min(bass - 1, 1));
        hue = (hue + dt * (0.02 + 0.04 * bn)) % 1;
        spin = spin + dt * (0.85 + 1.1 * bn); // FAST rotation
        t.q2 = 0.5;
        t.q3 = 0.5;
        t.q5 = 0.4 + 0.1 * bn; // mandala radius (fills screen)
        t.q6 = 0.03 + 0.05 * Math.min(mid + 0.5 * treb, 2.0); // edge jaggedness (live waveform on the triangle edges)
        t.q8 = hue; // two-tone hue drift
        t.q9 = spin;
        t.q10 = 0.8 * Math.max(0, Math.min((bass - 1.2) / 0.6, 1)); // vortex shear on peaks
        return t;
      },
      comp: ANEMONE_COMP,
    });
    preset.waves[0] = alcTriMandala(9, ALC_PAL.twoTone); // 9 overlapping equilateral triangles, two-tone palette, shared center
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
    var hue = 0,
      lastT = 0,
      spin = 0;
    var SPINDLE_COMP =
      "shader_body {\n" +
      "vec2 d = uv - 0.5; d.x *= resolution.x / resolution.y;\n" +
      "float pr = length(d);\n" +
      "vec3 g = texture2D(sampler_main, uv).rgb;\n" +
      "vec3 bloom = (texture2D(sampler_blur1, uv).rgb + texture2D(sampler_blur2, uv).rgb) * 0.5;\n" +
      "float pupil = smoothstep(0.0, 0.14, pr);\n" + // DARK CENTER pupil (the eye) — deepens at center
      "vec3 bg = vec3(0.06, 0.11, 0.28) * pupil * (0.85 + 0.22 * bass);\n" + // cobalt-blue (pulses with bass)
      "vec3 outc = bg + g + bloom * 0.30;\n" +
      "ret = outc / (outc + vec3(0.85));\n" + // Reinhard — muted, no white-out
      "}\n";
    var preset = build(
      Object.assign({}, alcCamera("flat"), { decay: 0.88 }), // flat + moderate decay: urchin redrawn crisp but soft glow trail
      {
        frame: function (t) {
          var bass = t.bass_att || t.bass || 1,
            mid = t.mid_att || t.mid || 1;
          var tm = t.time,
            dt = Math.min(0.1, Math.max(0, tm - lastT));
          lastT = tm;
          var bn = Math.max(0, Math.min(bass - 1, 1));
          hue = (hue + dt * (0.015 + 0.04 * bn)) % 1;
          spin = spin + dt * (0.5 + 3.0 * bn); // slow spin, whips on the beat
          t.q2 = 0.5;
          t.q3 = 0.5;
          t.q5 = 0.22 + 0.2 * bass; // radius: breathes strongly with bass
          t.q8 = hue; // slow hue (pink→magenta→cyan band)
          t.q9 = spin; // self-rotation
          t.q10 = 0.7 * Math.max(0, Math.min((bass - 1.2) / 0.6, 1)); // vortex on heavy transients
          return t;
        },
        comp: SPINDLE_COMP,
      }
    );
    // Pink↔cyan slow mix: at q8=0 → dusty rose; q8=0.5 → muted cyan (matches ref "pink→cyan").
    // Hardcoded rather than alcPalette because the 3-offset cosine palette has no clean magenta.
    var PAL_ROSE = function (a) {
      var mix = 0.5 + 0.5 * Math.cos(6.2832 * (a.q8 || 0)); // 1 = pink phase, 0 = cyan phase
      a.r = (0.7 * mix + 0.18 * (1 - mix)) * 0.85;
      a.g = (0.28 * mix + 0.6 * (1 - mix)) * 0.85;
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
    var ANGLE = 0.65; // ~37° — lower-left→upper-right (matches ref G2)
    var preset = build(
      {
        wave_a: 0,
        gammaadj: 1.5,
        decay: 0.96,
        zoom: 0.999,
        cx: 0.5,
        cy: 0.5,
        dx: 0.0,
        dy: 0.0,
        rot: 0.0,
        warp: 0.0,
        wrap: 0,
        darken_center: 0,
        echo_alpha: 0,
      },
      {
        frame: function (t) {
          var treb = t.treb_att || t.treb || 1;
          var tm = t.time,
            dt = Math.min(0.1, Math.max(0, tm - lastT));
          lastT = tm;
          t.q10 = 1.0; // diagonal line: full opacity always
          t.q6_wave = 0.14 + 0.1 * Math.min(treb, 1.5); // perpendicular waveform amplitude (ribbon width)
          return t;
        },
        warp: alcRibbonWarp(ANGLE, 0.0015), // slower drift -> band stays centered longer
        comp: alcRibbonComp(ANGLE),
      }
    );
    // Bold gold-white waveform line — the raw element that accumulates into the ribbon.
    // thick:1 + heavy amp so each fresh frame draws a visible wide band; the warp does the rest.
    preset.waves[0] = alcDiagonalLine(ANGLE, 0.82, 0.18, 1.0, 0.9, 0.65);
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
    var lastT = 0,
      spin = 0;

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
      "vec3 barHue = pal_m(time * 0.05 + 0.67);\n" + // +0.67 = green start (cos peak at g offset 0.33)
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
      {
        wave_a: 0,
        gammaadj: 1.3,
        decay: 0.88,
        zoom: 1.0,
        cx: 0.5,
        cy: 0.5,
        rot: 0.0,
        warp: 0.0,
        wrap: 0,
        darken_center: 0,
        echo_alpha: 0,
      },
      {
        frame: function (t) {
          var bass = t.bass_att || t.bass || 1,
            treb = t.treb_att || t.treb || 1;
          var tm = t.time,
            dt = Math.min(0.1, Math.max(0, tm - lastT));
          lastT = tm;
          var bn = Math.max(0, Math.min(bass - 1, 1));
          spin = (spin + dt * (0.5 + 1.5 * bn)) % 6.2832;
          t.q2 = 0.5;
          t.q3 = 0.5;
          t.q5 = 0.1 + 0.1 * bn; // diamond radius — small, pulses on bass
          t.q6 = 0.02 + 0.04 * Math.min(treb, 1.2); // waveform jaggedness (diamond edges + X lines)
          t.q8 = (tm * 0.1) % 1; // slow hue cycling
          t.q9 = spin; // diamond slow spin
          t.q10 = 1.0; // diagonal lines: full opacity
          t.q12 = Math.sin(tm * 0.35); // oscilloscope hue phase (-1..1): magenta→red→green
          return t;
        },
        warp: MOIRE_WARP,
        comp: MOIRE_COMP,
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
        enabled: 1,
        samples: 512,
        additive: 1,
        usedots: 0,
        scaling: 1,
        smoothing: 0.05,
        a: 0.9,
        thick: 1,
      }),
      init_eqs: passthrough,
      frame_eqs: passthrough,
      point_eqs: function (a) {
        var amp = (a.q6 !== undefined ? a.q6 : 0.05) * 2.5; // moderate oscilloscope height
        a.x = a.sample; // 0..1 full width
        a.y = 0.5 + (a.value1 || 0) * amp;
        var ph = a.q12 !== undefined ? a.q12 : 0; // -1..1 hue phase
        a.r = ph > 0 ? 0.8 : 0.8 * (1 + ph); // magenta→red: r stays high; red→green: r drops
        a.g = ph < 0 ? 0.65 * -ph : 0.05; // green phase only
        a.b = ph > 0 ? 0.6 * ph : 0.04; // magenta phase only
        var ll = (a.r + a.g + a.b) / 3,
          sat = 0.75;
        a.r = (a.r * sat + ll * (1 - sat)) * 1.1;
        a.g = (a.g * sat + ll * (1 - sat)) * 1.1;
        a.b = (a.b * sat + ll * (1 - sat)) * 1.1;
        return a;
      },
    };

    // NOTE: no explicit diagonal X waves. The "X feel" comes from the quad-mirrored moiré
    // bars converging at the mirror fold lines — confirmed from the reference frames (1:49-1:52).
    // The explicit diagonal waveform lines only appear prominently LATER in the scene (~1:54+).

    return preset;
  })();
})();
