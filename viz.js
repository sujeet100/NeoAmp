/* Sandboxed visualizer page. Runs Butterchurn (needs unsafe-eval, allowed here),
 * receives time-domain audio bytes from the parent (winamp.js) via postMessage,
 * and renders through Butterchurn's external `audioLevels` feed. Now-playing /
 * transport UI lives in the parent's Main window; this page only owns the canvas
 * and a compact preset picker. */
(function () {
  "use strict";

  // --- GLSL compile/link diagnostics ---------------------------------------
  // Butterchurn swallows the GL info log, so a bad preset shader only surfaces
  // as the opaque "program not linked" warning. Wrap compileShader/linkProgram
  // to print the real compiler error + numbered source (prefixed
  // [WMP-viz shader]) — our only window into GLSL errors (can't check in Node).
  function installShaderDebug() {
    var numbered = function (src) {
      return String(src || "")
        .split("\n")
        .map(function (l, i) {
          return String(i + 1).padStart(3) + "| " + l;
        })
        .join("\n");
    };
    [self.WebGLRenderingContext, self.WebGL2RenderingContext].forEach(function (Ctx) {
      if (!Ctx || Ctx.prototype.__wmpShaderDebug) return;
      Ctx.prototype.__wmpShaderDebug = true;
      var srcOf = new WeakMap();
      var _shaderSource = Ctx.prototype.shaderSource;
      Ctx.prototype.shaderSource = function (shader, source) {
        srcOf.set(shader, source);
        return _shaderSource.call(this, shader, source);
      };
      var _compile = Ctx.prototype.compileShader;
      Ctx.prototype.compileShader = function (shader) {
        var r = _compile.call(this, shader);
        if (!this.getShaderParameter(shader, this.COMPILE_STATUS))
          console.error(
            "[WMP-viz shader] compile FAILED\n" +
              this.getShaderInfoLog(shader) +
              "\n--- source ---\n" +
              numbered(srcOf.get(shader))
          );
        return r;
      };
      var _link = Ctx.prototype.linkProgram;
      Ctx.prototype.linkProgram = function (program) {
        var r = _link.call(this, program);
        if (!this.getProgramParameter(program, this.LINK_STATUS))
          console.error("[WMP-viz shader] link FAILED: " + this.getProgramInfoLog(program));
        return r;
      };
    });
  }
  installShaderDebug();

  var FFT_SIZE = 1024; // matches the content script's analyser
  var post = function (m) {
    try {
      parent.postMessage(Object.assign({ __wmp: true }, m), "*");
    } catch (_) {}
  };
  var fail = function (msg) {
    console.error("[WMP-viz]", msg);
    post({ type: "error", message: String(msg) });
  };

  var BC = (window.butterchurn && (window.butterchurn.default || window.butterchurn)) || null;

  function packPresets(g) {
    if (!g) return {};
    var mod = g.default || g;
    try {
      if (typeof mod.getPresets === "function") return mod.getPresets() || {};
    } catch (_) {}
    return typeof mod === "object" ? mod : {};
  }
  function collectPresets() {
    return Object.assign(
      {},
      packPresets(window.butterchurnPresets),
      packPresets(window.butterchurnPresetsExtra),
      packPresets(window.butterchurnPresetsExtra2)
    );
  }

  // Curated hand-authored WMP presets, grouped at the top of the picker.
  var FAVORITES = [
    { label: "Alchemy V7: Random (Vivid)", wmp: "Alchemy V7: Random (Vivid)" }, // punchier 1080p-tuned colour
    { label: "Alchemy V7: Random (Pastel)", wmp: "Alchemy V7: Random (Pastel)" }, // accurate muted/dusty WMP colour (480p)
    { label: "Alchemy V6: Random", wmp: "Alchemy V6: Random" }, // prior rebuild (two-regime bg + parallax + motif-paint) — kept to compare
    { label: "Alchemy V4: Random", wmp: "Alchemy V4: Random" }, // baseline (commit 2dffe4d, pre-watercolor-experiment)
    { label: "Alchemy V5: Random", wmp: "Alchemy V5: Random" }, // EXPERIMENTAL watercolour-trail fork (compare vs V4)
    { label: "Dance of the Freaky Circles (Nebula)", wmp: "Dance of the Freaky Circles (Nebula)" },
    {
      label: "Dance of the Freaky Circles (Nebula Spectrum)",
      wmp: "Dance of the Freaky Circles (Nebula Spectrum)",
    },
    { label: "Dance of the Freaky Circles (Fire)", wmp: "Dance of the Freaky Circles (Fire)" },
    { label: "Alchemy v2: Random", wmp: "Alchemy v2: Random" },
    { label: "Alchemy Random", wmp: "Alchemy Random" },
    { label: "Alchemy v2: Era — Corridor", wmp: "Alchemy v2: Era — Corridor" },
    { label: "Alchemy v2: Era — Anemone/Vortex", wmp: "Alchemy v2: Era — Anemone/Vortex" },
    { label: "Alchemy v2: Era — Mandala/Fluid", wmp: "Alchemy v2: Era — Mandala/Fluid" },
    { label: "Alchemy v2: Era — Supernova", wmp: "Alchemy v2: Era — Supernova" },
    { label: "Alchemy v2: Orbiters", wmp: "Alchemy v2: Orbiters" },
    { label: "Alchemy v2: Kaleidoscope", wmp: "Alchemy v2: Kaleidoscope" },
    { label: "Alchemy v2: Anemone Pulsar", wmp: "Alchemy v2: Anemone Pulsar" },
    { label: "Alchemy v2: Vortex", wmp: "Alchemy v2: Vortex" },
    { label: "Alchemy v2: Wireframe Net", wmp: "Alchemy v2: Wireframe Net" },
    { label: "Alchemy v2: Net Corridor", wmp: "Alchemy v2: Net Corridor" },
    { label: "Alchemy v2: Gradient Orbs", wmp: "Alchemy v2: Gradient Orbs" },
    { label: "Alchemy v2: Bullseye Orbiters", wmp: "Alchemy v2: Bullseye Orbiters" },
    { label: "Alchemy v2: Marble", wmp: "Alchemy v2: Marble" },
    { label: "Alchemy v2: Net Tunnel", wmp: "Alchemy v2: Net Tunnel" },
    { label: "Alchemy v2: Fountain", wmp: "Alchemy v2: Fountain" },
    { label: "Alchemy v2: Waveform Sheet", wmp: "Alchemy v2: Waveform Sheet" },
    { label: "Alchemy v2: Ray Burst", wmp: "Alchemy v2: Ray Burst" },
    { label: "Alchemy v2: N-gon Proof", wmp: "Alchemy v2: N-gon Proof" },
    { label: "Alchemy v2: Mandala", wmp: "Alchemy v2: Mandala" },
    { label: "Alchemy v2: Nested Mandala", wmp: "Alchemy v2: Nested Mandala" },
    { label: "Alchemy v2: Anemone", wmp: "Alchemy v2: Anemone" },
    { label: "Alchemy v2: Anemone (Petals)", wmp: "Alchemy v2: Anemone (Petals)" },
    { label: "Alchemy v2: Anemone (Mandala)", wmp: "Alchemy v2: Anemone (Mandala)" },
    { label: "Alchemy v2: Spindle", wmp: "Alchemy v2: Spindle" },
    { label: "Alchemy v2: Ribbon", wmp: "Alchemy v2: Ribbon" },
    { label: "Alchemy v2: Moiré", wmp: "Alchemy v2: Moiré" },
    { label: "Ambience Thingus", wmp: "Ambience Thingus" },
    { label: "Ambience Water", wmp: "Ambience Water" },
    { label: "Ambience Down the Drain", wmp: "Ambience Down the Drain" },
    { label: "Ambience Snell", wmp: "Ambience Snell" },
    { label: "Ambience Warp", wmp: "Ambience Warp" },
    { label: "Ambience Anon", wmp: "Ambience Anon" },
    { label: "Ambience Falloff", wmp: "Ambience Falloff" },
    { label: "Ambience Bubble", wmp: "Ambience Bubble" },
    { label: "Ambience Dizzy", wmp: "Ambience Dizzy" },
    { label: "Ambience Windmill", wmp: "Ambience Windmill" },
    { label: "Ambience Niagara", wmp: "Ambience Niagara" },
    { label: "Ambience Blender", wmp: "Ambience Blender" },
    { label: "Ambience X Marks the Spot", wmp: "Ambience X Marks the Spot" },
    { label: "Battery relatively calm", wmp: "Battery relatively calm" },
    { label: "Battery strawberryaid", wmp: "Battery strawberryaid" },
    { label: "Battery my tornado", wmp: "Battery my tornado is resting" },
    { label: "Battery brightsphere", wmp: "Battery brightsphere" },
    { label: "Battery cominatcha", wmp: "Battery cominatcha" },
    { label: "Battery cottonstar", wmp: "Battery cottonstar" },
    { label: "Battery dandelion", wmp: "Battery dandelion" },
    { label: "Battery drinkdeep", wmp: "Battery drinkdeep" },
    { label: "Battery elektrination", wmp: "Battery elektrination" },
    { label: "Battery event horizon", wmp: "Battery event horizon" },
    { label: "Battery hzodge", wmp: "Battery hzodge" },
    { label: "Battery sepalvel", wmp: "Battery sepalvel" },
    { label: "Battery illuminator", wmp: "Battery illuminator" },
    { label: "Battery i learned the truth", wmp: "Battery i learned the truth" },
    { label: "Battery kaleidovision", wmp: "Battery kaleidovision" },
    { label: "Battery chemicalnova", wmp: "Battery chemicalnova" },
    { label: "Battery lotus", wmp: "Battery lotus" },
    { label: "Battery green is not your enemy", wmp: "Battery green is not your enemy" },
    { label: "Battery sleepyspray", wmp: "Battery sleepyspray" },
    { label: "Battery smoke or water?", wmp: "Battery smoke or water?" },
    { label: "Battery spider's last moment", wmp: "Battery spider's last moment" },
    { label: "Battery the world", wmp: "Battery the world" },
    { label: "Battery back to the groove", wmp: "Battery back to the groove" },
  ];

  var DIRECTOR_KEY = "__director__"; // sentinel picker value that engages the auto-sequencer
  var viz = null,
    presets = {},
    names = [],
    idx = 0,
    rafId = 0;
  var presetSel = null;
  var userFavs = new Set();
  var latest = new Uint8Array(FFT_SIZE);
  var audioLevels = { timeByteArray: latest, timeByteArrayL: latest, timeByteArrayR: latest };

  var nowMs = function () {
    return window.performance && performance.now ? performance.now() : Date.now();
  };

  // --- The Director — Tier-2 era sequencer (the composition "when-to-change" brain)
  //
  // WMP Alchemy composes visuals as a DECOUPLED STATE MACHINE: color, background,
  // motif and camera evolve on independent clocks, punctuated by rare hard CUTS
  // between "eras" (verified frame-by-frame — see docs/alchemy-v2). The continuous
  // decoupled morphing lives INSIDE each era-preset's frame_eqs (Tier 1:
  // alcHueClock / alcEnergy / alcBeatFlash). This Director owns Tier 2 — the rare
  // cuts: it tracks audio ENERGY (a slow rolling "vibe" + a transient/beat onset)
  // and, on an energy-scaled dwell timer, crossfades to the next era-preset,
  // aligning the cut to a beat when one lands so it feels musical.
  //
  // Energy/beat are derived here from the time-domain bytes we already receive
  // (overall-loudness onset detection, AGC-normalized so pacing works on quiet and
  // loud tracks alike). Future refinement: pass bass-band energy from content.js
  // for kick-aligned cuts. Disabled by default — single-preset screenshot iteration
  // is the normal workflow; press "d" (or postMessage director:toggle) to engage.
  var Director = (function () {
    var cfg = {
      enabled: false,
      dwellCalmMs: 11000, // dwell between cuts when the track is calm
      dwellLoudMs: 6000, // dwell when energetic (shorter → more frequent cuts)
      maxBeatWaitMs: 2500, // once dwell elapses, wait this long for a beat, else cut anyway
      blendCalmS: 3.0, // crossfade length when calm (morphier)
      blendLoudS: 1.6, // crossfade length when energetic (snappier)
      beatSens: 1.45, // onset ratio (energy / local-average) to call a beat
      beatFloor: 0.015, // ignore "beats" below this RMS (treat as silence)
      beatRefractoryMs: 220, // minimum gap between beats
      energyTauMs: 6000, // "vibe" EMA time-constant (macro pacing)
    };

    // audio-derived state
    var energy = 0; // instantaneous RMS of the centered waveform
    var energyNorm = 0; // AGC-normalized energy, 0..1
    var vibe = 0; // slow EMA of energyNorm, 0..1 — the macro pacing signal
    var runningMax = 1e-2; // adaptive gain reference (decays slowly)
    var beat = false; // a transient fired THIS frame
    var beatStrength = 0;
    var lastBeatAt = -1e9;
    var hist = new Float32Array(32),
      histN = 0,
      histI = 0,
      histSum = 0; // ~0.5s onset window

    // sequencer state
    var eras = []; // preset names this Director cycles among
    var bag = []; // shuffle bag of era indices: every era plays once before any repeat
    var lastTickAt = 0,
      dwellElapsed = 0,
      pending = false,
      pendingSince = 0;
    var onSwitch = null,
      curName = null;

    function feed(bytes, now) {
      var n = bytes.length,
        sum = 0,
        i,
        x;
      for (i = 0; i < n; i++) {
        x = (bytes[i] - 128) / 128;
        sum += x * x;
      }
      energy = Math.sqrt(sum / n);

      // adaptive normalization so quiet and loud tracks pace the same way
      runningMax = Math.max(energy, runningMax * 0.999, 1e-4);
      energyNorm = Math.min(1, energy / runningMax);

      // short-window local average for transient/onset detection
      histSum -= hist[histI];
      hist[histI] = energy;
      histSum += energy;
      histI = (histI + 1) % hist.length;
      if (histN < hist.length) histN++;
      var localAvg = histN ? histSum / histN : 0;

      beat = false;
      beatStrength = localAvg > 1e-6 ? energy / localAvg : 0;
      if (
        energy > cfg.beatFloor &&
        beatStrength > cfg.beatSens &&
        now - lastBeatAt > cfg.beatRefractoryMs
      ) {
        beat = true;
        lastBeatAt = now;
      }
    }

    function dwellMs() {
      return cfg.dwellCalmMs + (cfg.dwellLoudMs - cfg.dwellCalmMs) * vibe;
    }
    function blendS() {
      return cfg.blendCalmS + (cfg.blendLoudS - cfg.blendCalmS) * vibe;
    }

    // SHUFFLE BAG: draw eras without replacement so every look plays once before any repeats
    // (no "same thing again and again"). Refill+reshuffle when empty; avoid an immediate repeat
    // across the bag boundary.
    function pickNext() {
      if (!eras.length) return null;
      if (eras.length === 1) return eras[0];
      if (!bag.length) {
        for (var i = 0; i < eras.length; i++) bag.push(i);
        for (var j = bag.length - 1; j > 0; j--) {
          var r = Math.floor(Math.random() * (j + 1));
          var x = bag[j];
          bag[j] = bag[r];
          bag[r] = x;
        }
      }
      var idx = bag.shift();
      if (eras[idx] === curName && bag.length) {
        var idx2 = bag.shift();
        bag.push(idx);
        idx = idx2;
      }
      return eras[idx];
    }

    function tick(now) {
      var dt = lastTickAt ? now - lastTickAt : 0;
      lastTickAt = now;
      // advance the "vibe" envelope every frame (even while disabled, so it's warm when engaged)
      var a = dt > 0 ? Math.min(1, dt / cfg.energyTauMs) : 0;
      vibe += (energyNorm - vibe) * a;
      if (!cfg.enabled || eras.length < 2 || !onSwitch) return;

      dwellElapsed += dt;
      if (!pending && dwellElapsed >= dwellMs()) {
        pending = true;
        pendingSince = now;
      }
      if (pending && (beat || now - pendingSince > cfg.maxBeatWaitMs)) {
        var name = pickNext();
        if (name) onSwitch(name, blendS()); // onSwitch → loadByName → noteLoaded resets the clock
      }
    }

    return {
      feed: feed,
      tick: tick,
      cfg: cfg,
      setEras: function (list) {
        eras = (list || []).slice();
        bag = [];
      },
      setOnSwitch: function (fn) {
        onSwitch = fn;
      },
      // every preset load (manual OR director) resets the dwell clock so a manual
      // pick gets its full dwell before the Director cuts away from it.
      noteLoaded: function (name, now) {
        curName = name;
        dwellElapsed = 0;
        pending = false;
        lastTickAt = now;
      },
      setEnabled: function (on, now) {
        cfg.enabled = !!on;
        dwellElapsed = 0;
        pending = false;
        lastTickAt = now;
      },
      // jump to a fresh era immediately (so engaging the Director gives instant feedback).
      kick: function () {
        if (cfg.enabled && eras.length >= 2 && onSwitch) {
          var n = pickNext();
          if (n) onSwitch(n, blendS());
        }
      },
      isEnabled: function () {
        return cfg.enabled;
      },
      eraCount: function () {
        return eras.length;
      },
      status: function () {
        return {
          enabled: cfg.enabled,
          energy: energy,
          vibe: vibe,
          beat: beat,
          dwellMs: dwellMs(),
          eras: eras.length,
          current: curName,
        };
      },
    };
  })();
  window.Director = Director; // exposed for debugging / a future UI toggle

  var canvas = document.getElementById("c");
  var starEl = document.getElementById("star");
  var bar = document.getElementById("bar");
  var hideTimer;
  function showBar() {
    bar.classList.remove("hidden");
    clearTimeout(hideTimer);
    hideTimer = setTimeout(function () {
      bar.classList.add("hidden");
    }, 3500);
  }

  function setSize() {
    // This Butterchurn build does NOT resize the canvas we pass it (buffer stays
    // at the 300x150 default), so we set it: buffer = CSS size * dpr, and feed
    // that same pixel size to Butterchurn with pixelRatio:1 (buffer == render
    // target == viewport → fills, crisp).
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var cw = canvas.clientWidth || window.innerWidth || 640;
    var ch = canvas.clientHeight || window.innerHeight || 360;
    canvas.width = Math.max(1, Math.round(cw * dpr));
    canvas.height = Math.max(1, Math.round(ch * dpr));
    return { bw: canvas.width, bh: canvas.height };
  }
  function sizeCanvas() {
    if (!viz) return;
    var d = setSize();
    viz.setRendererSize(d.bw, d.bh, { pixelRatio: 1, textureRatio: 1 });
  }

  function loadByIndex(i, blend) {
    if (!names.length) return;
    idx = ((i % names.length) + names.length) % names.length;
    var key = names[idx];
    try {
      viz.loadPreset(presets[key], blend == null ? 2.0 : blend);
    } catch (e) {
      fail("loadPreset: " + e.message);
      return;
    }
    syncSelect(key);
    updateStar();
    showBar();
    Director.noteLoaded(key, nowMs());
    post({ type: "preset:changed", name: key });
  }
  function loadByName(name, blend) {
    var i = names.indexOf(name);
    if (i >= 0) loadByIndex(i, blend);
    else console.warn("[WMP-viz] preset not found:", name);
  }
  // A user picking from the dropdown: the Director sentinel engages auto-sequencing;
  // any real preset takes manual control (and disengages the Director if it was running).
  function userPick(name) {
    if (name === DIRECTOR_KEY) {
      setDirector(true);
      return;
    }
    if (Director.isEnabled()) setDirector(false);
    loadByName(name);
    showBar();
  }
  // manual nav always disengages the Director (the user is taking over)
  var step = function (d) {
    if (Director.isEnabled()) setDirector(false);
    loadByIndex(idx + d);
  };
  var randomPreset = function () {
    if (Director.isEnabled()) setDirector(false);
    loadByIndex(Math.floor(Math.random() * names.length));
  };

  function renderOptions() {
    if (!presetSel) return;
    var sel = presetSel;
    sel.innerHTML = "";
    var ph = document.createElement("option");
    ph.value = "";
    ph.textContent = "♪ pick a preset…";
    ph.disabled = true;
    sel.appendChild(ph);

    // The Director (Tier-2 era sequencer) was RETIRED in favour of "Alchemy v2: Random",
    // a single self-sequencing preset — its cross-preset crossfade read as a foggy
    // slideshow (memory: alchemy-feels-random-principles). The IIFE stays dormant (still
    // togglable via postMessage director:toggle for debugging) but is no longer offered
    // in the picker.

    var addGroup = function (label, entries) {
      var og = document.createElement("optgroup");
      og.label = label;
      entries.forEach(function (e) {
        if (!presets[e[0]]) return;
        var o = document.createElement("option");
        o.value = e[0];
        o.textContent = e[1];
        og.appendChild(o);
      });
      if (og.children.length) sel.appendChild(og);
    };

    var favEntries = Array.from(userFavs)
      .filter(function (n) {
        return presets[n];
      })
      .sort()
      .map(function (n) {
        return [n, "★ " + n];
      });
    if (favEntries.length) addGroup("★ Favorites", favEntries);

    var wmpSet = window.WMP_PRESETS ? Object.keys(window.WMP_PRESETS) : [];
    var wmpNames = {};
    wmpSet.forEach(function (n) {
      wmpNames[n] = true;
    });
    var groups = { Featured: [], Ambience: [], Battery: [] };
    FAVORITES.forEach(function (f) {
      var g = /^Ambience/.test(f.label)
        ? "Ambience"
        : /^Battery/.test(f.label)
          ? "Battery"
          : "Featured";
      groups[g].push([f.wmp, f.label]);
    });
    addGroup("◢◤ WMP — Featured", groups.Featured);
    addGroup("◢◤ WMP — Ambience", groups.Ambience);
    addGroup("◢◤ WMP — Battery", groups.Battery);

    var milkdrop = names
      .filter(function (n) {
        return !wmpNames[n];
      })
      .sort(function (a, b) {
        return a.toLowerCase().localeCompare(b.toLowerCase());
      })
      .map(function (n) {
        return [n, n];
      });
    addGroup("MilkDrop presets (A–Z)", milkdrop);

    var cur = names[idx];
    sel.value = cur && presets[cur] ? cur : "";
  }

  function buildBar() {
    presetSel = document.getElementById("presetSel");
    renderOptions();
    presetSel.addEventListener("change", function () {
      if (presetSel.value) userPick(presetSel.value);
    });
    starEl.addEventListener("click", toggleFav);
    document.getElementById("prev").addEventListener("click", function () {
      step(-1);
    });
    document.getElementById("next").addEventListener("click", function () {
      step(1);
    });
    document.getElementById("rand").addEventListener("click", randomPreset);
    document.addEventListener("mousemove", showBar);
  }

  function syncSelect(name) {
    if (presetSel) presetSel.value = name && presets[name] ? name : "";
  }
  function updateStar() {
    var on = userFavs.has(names[idx]);
    starEl.textContent = on ? "★" : "☆";
    starEl.classList.toggle("on", on);
  }
  function toggleFav() {
    var cur = names[idx];
    if (!cur) return;
    if (userFavs.has(cur)) userFavs.delete(cur);
    else userFavs.add(cur);
    updateStar();
    renderOptions();
    syncSelect(cur);
    post({ type: "favorites:set", names: Array.from(userFavs) });
    showBar();
  }

  function renderLoop() {
    rafId = requestAnimationFrame(renderLoop);
    var now = nowMs();
    Director.feed(latest, now); // read the live audio energy/beat…
    Director.tick(now); // …and (if engaged) advance the era sequencer
    try {
      viz.render({ audioLevels: audioLevels });
    } catch (e) {
      cancelAnimationFrame(rafId);
      fail("render: " + e.message);
    }
  }

  function init() {
    if (!BC || typeof BC.createVisualizer !== "function") {
      fail("Butterchurn not loaded (createVisualizer missing)");
      return;
    }
    presets = collectPresets();
    Object.assign(presets, window.WMP_PRESETS || {}); // WMP presets win on collisions
    names = Object.keys(presets);
    if (!names.length) {
      fail("No presets found in bundle");
      return;
    }

    var ctx;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      fail("AudioContext: " + e.message);
      return;
    }

    var d0 = setSize();
    try {
      viz = BC.createVisualizer(ctx, canvas, {
        width: d0.bw,
        height: d0.bh,
        pixelRatio: 1,
        textureRatio: 1,
      });
    } catch (e) {
      fail("createVisualizer: " + e.message);
      return;
    }

    buildBar();

    // Stand-in era playlist for the Director until the four purpose-built
    // era-presets exist: cycle the strongest existing Alchemy v2 scenes, one per
    // macro era (corridor / anemone-vortex / mandala-fluid / ribbon). Filtered to
    // those actually present; falls back to every Alchemy v2 preset.
    // The four real Tier-1 era-presets (each runs the decoupled state machine internally,
    // one per macro era of the reference timeline). The Director crossfades between THESE.
    var ERA_PLAYLIST = [
      "Alchemy v2: Era — Corridor",
      "Alchemy v2: Era — Anemone/Vortex",
      "Alchemy v2: Era — Mandala/Fluid",
      "Alchemy v2: Era — Supernova",
    ];
    // V4 = the 8 kit-factory scenes (Pulsar/Corridor/Vortex/Mandala/Anemone/Orbiters/Star/Burst),
    // shuffle-cycled by the Director. Fall back to the v2 era playlist if V4 isn't present.
    var v4Scenes = (window.WMP_V4_SCENES || []).filter(function (n) {
      return presets[n];
    });
    var eraList =
      v4Scenes.length >= 2
        ? v4Scenes
        : ERA_PLAYLIST.filter(function (n) {
            return presets[n];
          });
    if (eraList.length < 2)
      eraList = names.filter(function (n) {
        return /^Alchemy v[24]:/.test(n);
      });
    Director.setEras(eraList);
    Director.setOnSwitch(function (name, blend) {
      loadByName(name, blend);
    });

    window.addEventListener("resize", sizeCanvas);
    requestAnimationFrame(sizeCanvas);
    setTimeout(sizeCanvas, 400);
    // Boot straight into the single seamless "Alchemy V4: Random" preset (it self-sequences in
    // frame_eqs — no cross-preset Director crossfade, which read foggy/like-a-new-preset). The
    // Director (viz.js) stays dormant; reachable only via the postMessage debug toggle.
    var bootName = presets["Alchemy V7: Random (Vivid)"]
      ? "Alchemy V7: Random (Vivid)"
      : presets["Alchemy V7: Random"]
        ? "Alchemy V7: Random"
        : presets["Alchemy V6: Random"]
          ? "Alchemy V6: Random"
          : presets["Alchemy V4: Random"]
            ? "Alchemy V4: Random"
            : presets["Alchemy Random"]
              ? "Alchemy Random"
              : names[0];
    loadByName(bootName);
    renderLoop();
    post({ type: "ready", presets: names.length });
  }

  window.addEventListener("message", function (e) {
    var m = e.data || {};
    if (!m.__wmp) return;
    if (m.type === "audio" && m.data) latest.set(m.data);
    else if (m.type === "favorites:init") {
      userFavs.clear();
      (m.names || []).forEach(function (n) {
        userFavs.add(n);
      });
      renderOptions();
      syncSelect(names[idx]);
      updateStar();
    } else if (m.type === "resize") sizeCanvas();
    else if (m.type === "preset:load" && m.name) loadByName(m.name);
    else if (m.type === "preset:step") step(m.dir || 1);
    else if (m.type === "preset:random") randomPreset();
    else if (m.type === "director:toggle") setDirector(!Director.isEnabled());
    else if (m.type === "director:set") setDirector(!!m.enabled);
  });

  function setDirector(on) {
    Director.setEnabled(on, nowMs());
    if (on) Director.kick(); // jump to a fresh era immediately so engaging gives instant feedback
    console.log(
      "[WMP-viz] Director " + (on ? "ON" : "off") + " — sequencing " + Director.eraCount() + " eras"
    );
    post({ type: "director", enabled: Director.isEnabled(), eras: Director.eraCount() });
    showBar();
  }

  window.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight") step(1);
    else if (e.key === "ArrowLeft") step(-1);
    else if (e.key === "r" || e.key === "R") randomPreset();
    else if (e.key === "f" || e.key === "F") toggleFav();
    // "d" Director toggle retired with the Director picker entry — "Alchemy v2: Random"
    // self-sequences. (Director still reachable via postMessage for debugging.)
  });

  try {
    init();
  } catch (e) {
    fail("init: " + (e && e.message ? e.message : e));
  }
})();
