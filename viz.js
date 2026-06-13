/* Sandboxed visualizer page. Runs Butterchurn (which needs unsafe-eval, allowed
 * here), receives time-domain audio bytes from the content script via
 * postMessage, and renders via Butterchurn's external `audioLevels` feed. */
(function () {
  "use strict";

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
    { label: "TEST ▶ Cascading Decay Swing",  exact: TEST_PRESET },
    { label: "SepiaSwirl",                    re: /(swirl|spiral|smoke|flow|paint|liquid)/i },
    { label: "My Tornado is Resting",         re: /(vortex|tornado|swirl|spiral|whirl|flow|calm)/i },
    { label: "StrawberryAid",                 re: /(plasma|swirl|spiral|flow|melt|candy|pink)/i },
    { label: "Alchemy: Random",               re: /(fractal|kaleid|mandala|symmet|alchem|geiss)/i, random: true },
  ];

  let viz = null, presets = {}, names = [], idx = 0, rafId = 0;
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
    showBar();
  }
  const step = (d) => loadByIndex(idx + d);
  const randomPreset = () => loadByIndex(Math.floor(Math.random() * names.length));

  function loadFavorite(fav) {
    if (fav.wmp && window.WMP_PRESETS && window.WMP_PRESETS[fav.wmp]) {
      try { viz.loadPreset(window.WMP_PRESETS[fav.wmp], 1.0); }
      catch (e) { fail("wmp preset '" + fav.wmp + "': " + e.message); return; }
      nameEl.textContent = "♪ WMP ✦ " + fav.wmp;
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

  function buildBar() {
    const wrap = document.getElementById("favs");
    FAVORITES.forEach((f) => {
      const b = document.createElement("button");
      b.className = "fav";
      b.textContent = f.label;
      b.addEventListener("click", () => loadFavorite(f));
      wrap.appendChild(b);
    });
    document.getElementById("prev").addEventListener("click", () => step(-1));
    document.getElementById("next").addEventListener("click", () => step(1));
    document.getElementById("rand").addEventListener("click", randomPreset);
    document.getElementById("close").addEventListener("click", () => post({ type: "close" }));
    document.addEventListener("mousemove", showBar);
  }

  function renderLoop() {
    rafId = requestAnimationFrame(renderLoop);
    try { viz.render({ audioLevels: audioLevels }); }
    catch (e) { cancelAnimationFrame(rafId); fail("render: " + e.message); }
  }

  function init() {
    if (!BC || typeof BC.createVisualizer !== "function") { fail("Butterchurn not loaded (createVisualizer missing)"); return; }
    presets = collectPresets();
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
    loadFavorite(FAVORITES[0]);
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
