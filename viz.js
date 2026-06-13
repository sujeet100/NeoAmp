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
      return String(src || "").split("\n").map(function (l, i) { return String(i + 1).padStart(3) + "| " + l; }).join("\n");
    };
    [self.WebGLRenderingContext, self.WebGL2RenderingContext].forEach(function (Ctx) {
      if (!Ctx || Ctx.prototype.__wmpShaderDebug) return;
      Ctx.prototype.__wmpShaderDebug = true;
      var srcOf = new WeakMap();
      var _shaderSource = Ctx.prototype.shaderSource;
      Ctx.prototype.shaderSource = function (shader, source) { srcOf.set(shader, source); return _shaderSource.call(this, shader, source); };
      var _compile = Ctx.prototype.compileShader;
      Ctx.prototype.compileShader = function (shader) {
        var r = _compile.call(this, shader);
        if (!this.getShaderParameter(shader, this.COMPILE_STATUS))
          console.error("[WMP-viz shader] compile FAILED\n" + this.getShaderInfoLog(shader) + "\n--- source ---\n" + numbered(srcOf.get(shader)));
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
  var post = function (m) { try { parent.postMessage(Object.assign({ __wmp: true }, m), "*"); } catch (_) {} };
  var fail = function (msg) { console.error("[WMP-viz]", msg); post({ type: "error", message: String(msg) }); };

  var BC = (window.butterchurn && (window.butterchurn.default || window.butterchurn)) || null;

  function packPresets(g) {
    if (!g) return {};
    var mod = g.default || g;
    try { if (typeof mod.getPresets === "function") return mod.getPresets() || {}; } catch (_) {}
    return typeof mod === "object" ? mod : {};
  }
  function collectPresets() {
    return Object.assign({}, packPresets(window.butterchurnPresets), packPresets(window.butterchurnPresetsExtra), packPresets(window.butterchurnPresetsExtra2));
  }

  // Curated hand-authored WMP presets, grouped at the top of the picker.
  var FAVORITES = [
    { label: "Dance of the Freaky Circles", wmp: "Dance of the Freaky Circles" },
    { label: "Dance of the Freaky Circles (Classic)", wmp: "Dance of the Freaky Circles (Classic)" },
    { label: "Alchemy Random", wmp: "Alchemy Random" },
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

  var viz = null, presets = {}, names = [], idx = 0, rafId = 0;
  var presetSel = null;
  var userFavs = new Set();
  var latest = new Uint8Array(FFT_SIZE);
  var audioLevels = { timeByteArray: latest, timeByteArrayL: latest, timeByteArrayR: latest };

  var canvas = document.getElementById("c");
  var starEl = document.getElementById("star");
  var bar = document.getElementById("bar");
  var hideTimer;
  function showBar() { bar.classList.remove("hidden"); clearTimeout(hideTimer); hideTimer = setTimeout(function () { bar.classList.add("hidden"); }, 3500); }

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

  function loadByIndex(i) {
    if (!names.length) return;
    idx = ((i % names.length) + names.length) % names.length;
    var key = names[idx];
    try { viz.loadPreset(presets[key], 2.0); } catch (e) { fail("loadPreset: " + e.message); return; }
    syncSelect(key);
    updateStar();
    showBar();
    post({ type: "preset:changed", name: key });
  }
  function loadByName(name) { var i = names.indexOf(name); if (i >= 0) loadByIndex(i); else console.warn("[WMP-viz] preset not found:", name); }
  var step = function (d) { loadByIndex(idx + d); };
  var randomPreset = function () { loadByIndex(Math.floor(Math.random() * names.length)); };

  function renderOptions() {
    if (!presetSel) return;
    var sel = presetSel;
    sel.innerHTML = "";
    var ph = document.createElement("option");
    ph.value = ""; ph.textContent = "♪ pick a preset…"; ph.disabled = true;
    sel.appendChild(ph);

    var addGroup = function (label, entries) {
      var og = document.createElement("optgroup");
      og.label = label;
      entries.forEach(function (e) {
        if (!presets[e[0]]) return;
        var o = document.createElement("option");
        o.value = e[0]; o.textContent = e[1];
        og.appendChild(o);
      });
      if (og.children.length) sel.appendChild(og);
    };

    var favEntries = Array.from(userFavs).filter(function (n) { return presets[n]; }).sort().map(function (n) { return [n, "★ " + n]; });
    if (favEntries.length) addGroup("★ Favorites", favEntries);

    var wmpSet = window.WMP_PRESETS ? Object.keys(window.WMP_PRESETS) : [];
    var wmpNames = {}; wmpSet.forEach(function (n) { wmpNames[n] = true; });
    var groups = { Featured: [], Ambience: [], Battery: [] };
    FAVORITES.forEach(function (f) {
      var g = /^Ambience/.test(f.label) ? "Ambience" : /^Battery/.test(f.label) ? "Battery" : "Featured";
      groups[g].push([f.wmp, f.label]);
    });
    addGroup("◢◤ WMP — Featured", groups.Featured);
    addGroup("◢◤ WMP — Ambience", groups.Ambience);
    addGroup("◢◤ WMP — Battery", groups.Battery);

    var milkdrop = names.filter(function (n) { return !wmpNames[n]; })
      .sort(function (a, b) { return a.toLowerCase().localeCompare(b.toLowerCase()); })
      .map(function (n) { return [n, n]; });
    addGroup("MilkDrop presets (A–Z)", milkdrop);

    var cur = names[idx];
    sel.value = cur && presets[cur] ? cur : "";
  }

  function buildBar() {
    presetSel = document.getElementById("presetSel");
    renderOptions();
    presetSel.addEventListener("change", function () { if (presetSel.value) { loadByName(presetSel.value); showBar(); } });
    starEl.addEventListener("click", toggleFav);
    document.getElementById("prev").addEventListener("click", function () { step(-1); });
    document.getElementById("next").addEventListener("click", function () { step(1); });
    document.getElementById("rand").addEventListener("click", randomPreset);
    document.addEventListener("mousemove", showBar);
  }

  function syncSelect(name) { if (presetSel) presetSel.value = name && presets[name] ? name : ""; }
  function updateStar() {
    var on = userFavs.has(names[idx]);
    starEl.textContent = on ? "★" : "☆";
    starEl.classList.toggle("on", on);
  }
  function toggleFav() {
    var cur = names[idx]; if (!cur) return;
    if (userFavs.has(cur)) userFavs.delete(cur); else userFavs.add(cur);
    updateStar(); renderOptions(); syncSelect(cur);
    post({ type: "favorites:set", names: Array.from(userFavs) });
    showBar();
  }

  function renderLoop() {
    rafId = requestAnimationFrame(renderLoop);
    try { viz.render({ audioLevels: audioLevels }); }
    catch (e) { cancelAnimationFrame(rafId); fail("render: " + e.message); }
  }

  function init() {
    if (!BC || typeof BC.createVisualizer !== "function") { fail("Butterchurn not loaded (createVisualizer missing)"); return; }
    presets = collectPresets();
    Object.assign(presets, window.WMP_PRESETS || {}); // WMP presets win on collisions
    names = Object.keys(presets);
    if (!names.length) { fail("No presets found in bundle"); return; }

    var ctx;
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch (e) { fail("AudioContext: " + e.message); return; }

    var d0 = setSize();
    try { viz = BC.createVisualizer(ctx, canvas, { width: d0.bw, height: d0.bh, pixelRatio: 1, textureRatio: 1 }); }
    catch (e) { fail("createVisualizer: " + e.message); return; }

    buildBar();
    window.addEventListener("resize", sizeCanvas);
    requestAnimationFrame(sizeCanvas);
    setTimeout(sizeCanvas, 400);
    loadByName(presets["Alchemy Random"] ? "Alchemy Random" : names[0]);
    renderLoop();
    post({ type: "ready", presets: names.length });
  }

  window.addEventListener("message", function (e) {
    var m = e.data || {};
    if (!m.__wmp) return;
    if (m.type === "audio" && m.data) latest.set(m.data);
    else if (m.type === "favorites:init") {
      userFavs.clear();
      (m.names || []).forEach(function (n) { userFavs.add(n); });
      renderOptions(); syncSelect(names[idx]); updateStar();
    } else if (m.type === "resize") sizeCanvas();
    else if (m.type === "preset:load" && m.name) loadByName(m.name);
    else if (m.type === "preset:step") step(m.dir || 1);
    else if (m.type === "preset:random") randomPreset();
  });

  window.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight") step(1);
    else if (e.key === "ArrowLeft") step(-1);
    else if (e.key === "r" || e.key === "R") randomPreset();
    else if (e.key === "f" || e.key === "F") toggleFav();
  });

  try { init(); } catch (e) { fail("init: " + (e && e.message ? e.message : e)); }
})();
