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

  // Curated hand-authored WMP presets, shown as named groups at the top of the
  // picker. Every *bundled* MilkDrop preset is also listed (A–Z) further down,
  // and user-starred presets get their own "★ Favorites" group above all.
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
  ];

  let viz = null, presets = {}, names = [], idx = 0, rafId = 0;
  let favSelect = null; // the preset dropdown, kept in sync with what's loaded
  const userFavs = new Set(); // preset names the user starred (persisted via content script)
  const latest = new Uint8Array(FFT_SIZE); // last received time-domain bytes
  const audioLevels = { timeByteArray: latest, timeByteArrayL: latest, timeByteArrayR: latest };

  const canvas = document.getElementById("c");
  const nameEl = document.getElementById("name");
  const titleEl = document.getElementById("title");
  const artistEl = document.getElementById("artist");
  const curEl = document.getElementById("cur");
  const durEl = document.getElementById("dur");
  const seekEl = document.getElementById("seek");
  const starEl = document.getElementById("star");
  const playEl = document.getElementById("playpause");
  const bar = document.getElementById("bar");
  let hideTimer, trackDur = 0, seeking = false;

  function showBar() {
    bar.classList.remove("hidden");
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => bar.classList.add("hidden"), 3500);
  }

  // mm:ss for the seek-bar time codes.
  function fmtTime(s) {
    s = Math.max(0, Math.floor(s || 0));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return m + ":" + (r < 10 ? "0" : "") + r;
  }

  // Paint the played portion of the native range track (it doesn't fill itself).
  function setSeekFill(pct) {
    pct = Math.max(0, Math.min(100, pct));
    seekEl.style.background =
      "linear-gradient(90deg, #3f86d6 " + pct + "%, #20364c " + pct + "%)";
  }

  // Now-playing title/artist + playback position pushed from the content script.
  function onTrack(t) {
    const title = (t.title || "").trim();
    const artist = (t.artist || "").trim();
    titleEl.textContent = title ? "♪ " + title : "♪ —";
    artistEl.textContent = artist;
    playEl.textContent = t.paused ? "▶" : "⏸";
    playEl.title = (t.paused ? "Play" : "Pause") + " (P)";
    trackDur = t.duration || 0;
    durEl.textContent = fmtTime(trackDur);
    if (!seeking) {
      curEl.textContent = fmtTime(t.currentTime);
      const pct = trackDur > 0 ? (t.currentTime / trackDur) * 100 : 0;
      seekEl.value = String(Math.round(pct * 10)); // range is 0..1000
      setSeekFill(pct);
    }
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
    nameEl.textContent = key;
    syncSelect(key);
    updateStar();
    showBar();
  }
  function loadByName(name) {
    const i = names.indexOf(name);
    if (i >= 0) loadByIndex(i);
    else console.warn("[WMP-viz] preset not found:", name);
  }
  const step = (d) => loadByIndex(idx + d);
  const randomPreset = () => loadByIndex(Math.floor(Math.random() * names.length));

  // The preset picker is a single compact grouped <select> (so it doesn't cover
  // the visualization). Groups, top to bottom: ★ user favorites, the curated
  // WMP families, then every bundled MilkDrop preset A–Z. Option values are the
  // preset name itself. Rebuilt whenever the favorites set changes.
  function renderOptions() {
    if (!favSelect) return;
    const sel = favSelect;
    sel.innerHTML = "";
    const ph = document.createElement("option");
    ph.value = ""; ph.textContent = "♪ pick a preset…"; ph.disabled = true;
    sel.appendChild(ph);

    const addGroup = (label, entries) => {
      const og = document.createElement("optgroup");
      og.label = label;
      entries.forEach(function (e) {
        if (!presets[e[0]]) return;
        const o = document.createElement("option");
        o.value = e[0];
        o.textContent = e[1];
        og.appendChild(o);
      });
      if (og.children.length) sel.appendChild(og);
    };

    // ★ user favorites first
    const favEntries = Array.from(userFavs).filter((n) => presets[n]).sort()
      .map((n) => [n, "★ " + n]);
    if (favEntries.length) addGroup("★ Favorites", favEntries);

    // curated WMP families
    const wmpSet = window.WMP_PRESETS ? Object.keys(window.WMP_PRESETS) : [];
    const wmpNames = {}; wmpSet.forEach((n) => (wmpNames[n] = true));
    const groups = { Featured: [], Ambience: [], Battery: [] };
    FAVORITES.forEach((f) => {
      const g = /^Ambience/.test(f.label) ? "Ambience" : /^Battery/.test(f.label) ? "Battery" : "Featured";
      groups[g].push([f.wmp, f.label.replace(/\s*✦\s*$/, "")]);
    });
    addGroup("◢◤ WMP — Featured", groups.Featured);
    addGroup("◢◤ WMP — Ambience", groups.Ambience);
    addGroup("◢◤ WMP — Battery", groups.Battery);

    // every other bundled MilkDrop preset, alphabetical
    const milkdrop = names.filter((n) => !wmpNames[n])
      .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
      .map((n) => [n, n]);
    addGroup("MilkDrop presets (A–Z)", milkdrop);

    const cur = names[idx];
    sel.value = cur && presets[cur] ? cur : "";
  }

  function buildBar() {
    const wrap = document.getElementById("favs");
    const sel = document.createElement("select");
    sel.className = "fav-select";
    sel.title = "Pick a visualization";
    wrap.appendChild(sel);
    favSelect = sel;
    renderOptions();
    sel.addEventListener("change", () => { if (sel.value) { loadByName(sel.value); showBar(); } });

    starEl.addEventListener("click", toggleFav);
    playEl.addEventListener("click", () => post({ type: "playpause" }));
    document.getElementById("prev").addEventListener("click", () => step(-1));
    document.getElementById("next").addEventListener("click", () => step(1));
    document.getElementById("rand").addEventListener("click", randomPreset);
    document.getElementById("close").addEventListener("click", () => post({ type: "close" }));
    document.addEventListener("mousemove", showBar);

    // Drag the seek bar → scrub the track. Suspend position updates while the
    // user is dragging so it doesn't fight the incoming time, and commit the
    // seek (to the content script, which owns the <video>) on release.
    seekEl.addEventListener("input", () => {
      seeking = true;
      const time = trackDur * (+seekEl.value / 1000);
      curEl.textContent = fmtTime(time);
      setSeekFill(+seekEl.value / 10);
      showBar();
    });
    seekEl.addEventListener("change", () => {
      post({ type: "seek", time: trackDur * (+seekEl.value / 1000) });
      seeking = false;
    });
  }

  // Reflect the currently-loaded preset in the dropdown.
  function syncSelect(name) {
    if (favSelect) favSelect.value = name && presets[name] ? name : "";
  }

  // Star = mark the *currently loaded* preset as a favorite. Updates the picker's
  // ★ group and persists the set through the content script.
  function updateStar() {
    const on = userFavs.has(names[idx]);
    starEl.textContent = on ? "★" : "☆";
    starEl.classList.toggle("on", on);
    starEl.title = (on ? "Unmark" : "Mark") + " this preset as favorite (F)";
  }
  function toggleFav() {
    const cur = names[idx];
    if (!cur) return;
    if (userFavs.has(cur)) userFavs.delete(cur); else userFavs.add(cur);
    updateStar();
    renderOptions();
    syncSelect(cur);
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
    // the first preset if it's ever renamed/removed).
    loadByName(presets["Alchemy Random"] ? "Alchemy Random" : names[0]);
    renderLoop();
    post({ type: "ready", presets: names.length });
  }

  window.addEventListener("message", (e) => {
    const m = e.data || {};
    if (!m.__wmp) return;
    if (m.type === "audio" && m.data) latest.set(m.data);
    else if (m.type === "track") onTrack(m);
    else if (m.type === "favorites:init") {
      userFavs.clear();
      (m.names || []).forEach((n) => userFavs.add(n));
      renderOptions();
      syncSelect(names[idx]);
      updateStar();
    }
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") post({ type: "close" });
    else if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); step(1); }
    else if (e.key === "ArrowLeft") step(-1);
    else if (e.key === "r" || e.key === "R") randomPreset();
    else if (e.key === "f" || e.key === "F") toggleFav();
    else if (e.key === "p" || e.key === "P") post({ type: "playpause" });
  });

  try { init(); } catch (e) { fail("init: " + (e && e.message ? e.message : e)); }
})();
