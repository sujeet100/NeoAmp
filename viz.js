/* Sandboxed visualizer page. Runs Butterchurn (which needs unsafe-eval, allowed
 * here), receives time-domain audio bytes from the content script via
 * postMessage, and renders via Butterchurn's external `audioLevels` feed. */
(function () {
  "use strict";

  // --- GLSL compile/link diagnostics ---------------------------------------
  // Butterchurn compiles preset shaders internally and swallows the GL info
  // log, so a bad preset shader only surfaces as the opaque "program not
  // linked" warning. Wrap compileShader/linkProgram on the GL prototypes to
  // print the actual compiler error AND the offending source with line numbers
  // (prefixed [WMP-viz shader]). This is our only window into GLSL errors,
  // which can't be validated in Node. Patches run before any context is made.
  function installShaderDebug() {
    const numbered = (src) =>
      String(src || "").split("\n").map((l, i) => String(i + 1).padStart(3) + "| " + l).join("\n");
    [self.WebGLRenderingContext, self.WebGL2RenderingContext].forEach((Ctx) => {
      if (!Ctx || Ctx.prototype.__wmpShaderDebug) return;
      Ctx.prototype.__wmpShaderDebug = true;
      const srcOf = new WeakMap();
      const _shaderSource = Ctx.prototype.shaderSource;
      Ctx.prototype.shaderSource = function (shader, source) {
        srcOf.set(shader, source);
        return _shaderSource.call(this, shader, source);
      };
      const _compile = Ctx.prototype.compileShader;
      Ctx.prototype.compileShader = function (shader) {
        const r = _compile.call(this, shader);
        if (!this.getShaderParameter(shader, this.COMPILE_STATUS)) {
          console.error("[WMP-viz shader] compile FAILED\n" + this.getShaderInfoLog(shader) +
            "\n--- source ---\n" + numbered(srcOf.get(shader)));
        }
        return r;
      };
      const _link = Ctx.prototype.linkProgram;
      Ctx.prototype.linkProgram = function (program) {
        const r = _link.call(this, program);
        if (!this.getProgramParameter(program, this.LINK_STATUS)) {
          console.error("[WMP-viz shader] link FAILED: " + this.getProgramInfoLog(program));
        }
        return r;
      };
    });
  }
  installShaderDebug();

  const FFT_SIZE = 1024; // matches the content script's analyser
  const post = (m) => { try { parent.postMessage(Object.assign({ __wmp: true }, m), "*"); } catch (_) {} };
  const fail = (msg) => { console.error("[WMP-viz]", msg); post({ type: "error", message: String(msg) }); };

  // --- resolve vendored globals --------------------------------------------
  const BC = (window.butterchurn && (window.butterchurn.default || window.butterchurn)) || null;

  function packPresets(g) {
    if (!g) return {};
    const mod = g.default || g;
    try { if (typeof mod.getPresets === "function") return mod.getPresets() || {}; } catch (_) {}
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

  // TEST_PRESET loads by exact name so you can compare it 1:1 with the same
  // preset on https://butterchurnviz.com (same butterchurn-presets package).
  const TEST_PRESET = "Flexi + Martin - cascading decay swing";

  const FAVORITES = [
    { label: "Dance of the Freaky Circles ✦", wmp: "Dance of the Freaky Circles" },
    { label: "Dance of the Freaky Circles (Classic) ✦", wmp: "Dance of the Freaky Circles (Classic)" },
    { label: "Alchemy Random ✦",              wmp: "Alchemy Random" },
    // Ambience family (amber/yellow fluid light)
    { label: "Ambience Thingus ✦",            wmp: "Ambience Thingus" },
    { label: "Ambience Water ✦",              wmp: "Ambience Water" },
    { label: "Ambience Down the Drain ✦",     wmp: "Ambience Down the Drain" },
    { label: "Ambience Snell ✦",              wmp: "Ambience Snell" },
    { label: "Ambience Warp ✦",               wmp: "Ambience Warp" },
    { label: "Ambience Anon ✦",               wmp: "Ambience Anon" },
    { label: "Ambience Falloff ✦",            wmp: "Ambience Falloff" },
    { label: "Ambience Bubble ✦",             wmp: "Ambience Bubble" },
    { label: "Ambience Dizzy ✦",              wmp: "Ambience Dizzy" },
    { label: "Ambience Windmill ✦",           wmp: "Ambience Windmill" },
    { label: "Ambience Niagara ✦",            wmp: "Ambience Niagara" },
    { label: "Ambience Blender ✦",            wmp: "Ambience Blender" },
    { label: "Ambience X Marks the Spot ✦",   wmp: "Ambience X Marks the Spot" },
    // Battery family (colorful, energetic)
    { label: "Battery relatively calm ✦",     wmp: "Battery relatively calm" },
    { label: "Battery strawberryaid ✦",       wmp: "Battery strawberryaid" },
    { label: "Battery my tornado ✦",          wmp: "Battery my tornado is resting" },
    { label: "Battery brightsphere ✦",        wmp: "Battery brightsphere" },
    { label: "Battery cominatcha ✦",          wmp: "Battery cominatcha" },
    { label: "Battery cottonstar ✦",          wmp: "Battery cottonstar" },
    { label: "Battery dandelion ✦",           wmp: "Battery dandelion" },
    { label: "Battery drinkdeep ✦",           wmp: "Battery drinkdeep" },
    { label: "Battery elektrination ✦",       wmp: "Battery elektrination" },
    { label: "Battery event horizon ✦",       wmp: "Battery event horizon" },
    { label: "Battery hzodge ✦",              wmp: "Battery hzodge" },
    { label: "Battery sepalvel ✦",            wmp: "Battery sepalvel" },
    { label: "Battery illuminator ✦",         wmp: "Battery illuminator" },
    { label: "Battery i learned the truth ✦", wmp: "Battery i learned the truth" },
    { label: "Battery kaleidovision ✦",       wmp: "Battery kaleidovision" },
    { label: "Battery chemicalnova ✦",        wmp: "Battery chemicalnova" },
    { label: "Battery lotus ✦",               wmp: "Battery lotus" },
    { label: "Battery green is not your enemy ✦", wmp: "Battery green is not your enemy" },
    { label: "Battery sleepyspray ✦",         wmp: "Battery sleepyspray" },
    { label: "Battery smoke or water? ✦",     wmp: "Battery smoke or water?" },
    { label: "Battery spider's last moment ✦", wmp: "Battery spider's last moment" },
    { label: "Battery the world ✦",           wmp: "Battery the world" },
    { label: "Battery back to the groove ✦",  wmp: "Battery back to the groove" },
    { label: "TEST ▶ Cascading Decay Swing",  exact: TEST_PRESET },
  ];

  let viz = null, presets = {}, names = [], idx = 0, rafId = 0;
  let favSelect = null; // the preset dropdown, kept in sync with what's loaded
  const favCursor = {};
  const latest = new Uint8Array(FFT_SIZE); // last received time-domain bytes
  const audioLevels = { timeByteArray: latest, timeByteArrayL: latest, timeByteArrayR: latest };

  const canvas = document.getElementById("c");
  const nameEl = document.getElementById("name");
  const bar = document.getElementById("bar");
  let hideTimer;

  function showBar() {
    bar.classList.remove("hidden");
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => bar.classList.add("hidden"), 3500);
  }

  function setSize() {
    // This Butterchurn build does NOT resize the canvas we pass it (the drawing
    // buffer stays at the 300x150 default), so we set it ourselves. We make the
    // buffer = CSS size * dpr, and feed that same pixel size to Butterchurn with
    // pixelRatio:1 — so buffer == render target == output viewport (fills, crisp).
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cw = canvas.clientWidth || window.innerWidth || 1280;
    const ch = canvas.clientHeight || window.innerHeight || 720;
    const bw = Math.max(1, Math.round(cw * dpr));
    const bh = Math.max(1, Math.round(ch * dpr));
    canvas.width = bw;
    canvas.height = bh;
    return { bw: bw, bh: bh };
  }
  function logSize(tag) {
    console.log(
      "[WMP-viz] " + tag,
      "| buffer(canvas.width):", canvas.width + "x" + canvas.height,
      "| css(client):", canvas.clientWidth + "x" + canvas.clientHeight,
      "| innerWindow:", window.innerWidth + "x" + window.innerHeight,
      "| dpr:", window.devicePixelRatio
    );
  }
  function sizeCanvas() {
    if (!viz) return;
    const d = setSize();
    viz.setRendererSize(d.bw, d.bh, { pixelRatio: 1, textureRatio: 1 });
    logSize("resize");
  }

  function loadByIndex(i) {
    if (!names.length) return;
    idx = ((i % names.length) + names.length) % names.length;
    const key = names[idx];
    try { viz.loadPreset(presets[key], 2.0); } catch (e) { fail("loadPreset: " + e.message); return; }
    nameEl.textContent = "♪ " + key;
    syncSelect(key);
    showBar();
  }
  const step = (d) => loadByIndex(idx + d);
  const randomPreset = () => loadByIndex(Math.floor(Math.random() * names.length));

  function loadFavorite(fav) {
    if (fav.wmp && window.WMP_PRESETS && window.WMP_PRESETS[fav.wmp]) {
      try { viz.loadPreset(window.WMP_PRESETS[fav.wmp], 1.0); }
      catch (e) { fail("wmp preset '" + fav.wmp + "': " + e.message); return; }
      nameEl.textContent = "♪ WMP ✦ " + fav.wmp;
      syncSelect(fav.wmp);
      showBar();
      return;
    }
    if (fav.exact) {
      const i = names.indexOf(fav.exact);
      if (i >= 0) { loadByIndex(i); return; }
      console.warn("[WMP-viz] exact preset not found:", fav.exact);
    }
    let m = names.filter((n) => fav.re.test(n));
    if (!m.length) m = names;
    if (fav.random) { loadByIndex(names.indexOf(m[Math.floor(Math.random() * m.length)])); return; }
    // Seed each favorite at a different offset so similar-keyword favorites
    // (e.g. SepiaSwirl vs My Tornado) don't land on the same preset.
    if (favCursor[fav.label] === undefined) favCursor[fav.label] = FAVORITES.indexOf(fav) * 3;
    const c = favCursor[fav.label] % m.length;
    favCursor[fav.label] = c + 1;
    loadByIndex(names.indexOf(m[c]));
  }

  // The favorite picker is a single compact <select> (grouped by family) instead
  // of ~40 buttons, so it doesn't cover the visualization.
  function buildBar() {
    const wrap = document.getElementById("favs");
    const sel = document.createElement("select");
    sel.className = "fav-select";
    sel.title = "Pick a visualization";
    const placeholder = document.createElement("option");
    placeholder.value = "-1";
    placeholder.textContent = "♪ pick a preset…";
    placeholder.disabled = true; placeholder.selected = true;
    sel.appendChild(placeholder);

    const groups = {}, order = [];
    const groupOf = (f) =>
      f.exact ? "Test" :
      /^Ambience/.test(f.label) ? "Ambience" :
      /^Battery/.test(f.label) ? "Battery" : "Featured";
    FAVORITES.forEach((f, i) => {
      const g = groupOf(f);
      if (!groups[g]) { groups[g] = document.createElement("optgroup"); groups[g].label = g; order.push(g); }
      const opt = document.createElement("option");
      opt.value = String(i);
      opt.textContent = f.label.replace(/\s*✦\s*$/, "");
      groups[g].appendChild(opt);
    });
    order.forEach((g) => sel.appendChild(groups[g]));
    sel.addEventListener("change", () => {
      const f = FAVORITES[+sel.value];
      if (f) { loadFavorite(f); showBar(); }
    });
    wrap.appendChild(sel);
    favSelect = sel;

    document.getElementById("prev").addEventListener("click", () => step(-1));
    document.getElementById("next").addEventListener("click", () => step(1));
    document.getElementById("rand").addEventListener("click", randomPreset);
    document.getElementById("close").addEventListener("click", () => post({ type: "close" }));
    document.addEventListener("mousemove", showBar);
  }

  // Reflect the currently-loaded preset in the dropdown (falls back to the
  // placeholder when navigating to a non-favorite via ⏮/⏭/🎲).
  function syncSelect(name) {
    if (!favSelect) return;
    const i = FAVORITES.findIndex((f) => f.wmp === name || f.exact === name);
    favSelect.value = i >= 0 ? String(i) : "-1";
  }

  function renderLoop() {
    rafId = requestAnimationFrame(renderLoop);
    try { viz.render({ audioLevels: audioLevels }); }
    catch (e) { cancelAnimationFrame(rafId); fail("render: " + e.message); }
  }

  function init() {
    if (!BC || typeof BC.createVisualizer !== "function") { fail("Butterchurn not loaded (createVisualizer missing)"); return; }
    presets = collectPresets();
    // Fold our hand-authored WMP presets into the navigable list so ⏮/⏭/🎲 and
    // arrow keys cycle through them too (the favorite buttons still load them
    // directly). WMP presets win on name collisions.
    Object.assign(presets, window.WMP_PRESETS || {});
    names = Object.keys(presets);
    if (!names.length) { fail("No presets found in bundle"); return; }

    // A throwaway AudioContext only to satisfy createVisualizer; we never feed
    // audio into it — frames come from the content script via `audioLevels`.
    let ctx;
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch (e) { fail("AudioContext: " + e.message); return; }

    const d0 = setSize();
    try {
      // Pass the real pixel buffer size with pixelRatio:1 so the render target
      // and output viewport match the buffer we just set on the canvas.
      viz = BC.createVisualizer(ctx, canvas, {
        width: d0.bw,
        height: d0.bh,
        pixelRatio: 1,
        textureRatio: 1,
      });
    } catch (e) { fail("createVisualizer: " + e.message); return; }

    buildBar();
    logSize("after-create");
    window.addEventListener("resize", sizeCanvas);
    // Re-apply on the next couple of frames, once layout has its final size.
    requestAnimationFrame(sizeCanvas);
    setTimeout(sizeCanvas, 400);
    // Default to Alchemy Random while we're actively refining it (fall back to
    // the first favorite if it's ever renamed/removed).
    loadFavorite(FAVORITES.find((f) => f.wmp === "Alchemy Random") || FAVORITES[0]);
    renderLoop();
    post({ type: "ready", presets: names.length });
  }

  window.addEventListener("message", (e) => {
    const m = e.data || {};
    if (!m.__wmp || m.type !== "audio" || !m.data) return;
    latest.set(m.data);
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") post({ type: "close" });
    else if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); step(1); }
    else if (e.key === "ArrowLeft") step(-1);
    else if (e.key === "r" || e.key === "R") randomPreset();
  });

  try { init(); } catch (e) { fail("init: " + (e && e.message ? e.message : e)); }
})();
