/* NeoAmp — UI layer (Winamp-style windowed player).
 *
 * Builds the floating windows (Main / EQ / Visualization) as plain DOM over the
 * live YouTube Music page, themed entirely by CSS variables (see winamp.css +
 * skins.js). Talks to the capture/playback backend through window.NeoAmp and to
 * Butterchurn through the sandboxed viz.html iframe via postMessage.
 *
 * Pieces: a small window manager (drag, edge-snap, raise, resize, persist),
 * inline-SVG transport icons (scalable, no bitmaps), a canvas spectrum analyzer
 * fed by the analyser's frequency bytes, a scrolling title marquee, and a skin
 * picker that swaps CSS-variable bundles at runtime.
 */
(function () {
  "use strict";
  if (window.__neoampUiLoaded) return;
  window.__neoampUiLoaded = true;

  var NA = window.NeoAmp;
  if (!NA) { console.error("[NeoAmp] backend (content.js) not present"); return; }

  // Load the bundled VT323 LCD font via the FontFace API. A CSS @font-face
  // url() inside a content-script-injected stylesheet gets blocked by YTM's
  // font-src CSP (which is why the LCD looked like plain monospace). Fetching
  // the bytes from our own web-accessible resource and registering the family
  // on document.fonts bypasses that — the page CSP can't block our own bytes.
  (function loadLcdFont() {
    try {
      if (!document.fonts || typeof FontFace === "undefined") return;
      var already = false;
      document.fonts.forEach(function (f) { if (f.family === "NeoAmp LCD") already = true; });
      if (already) return;
      fetch(chrome.runtime.getURL("fonts/VT323-Regular.ttf"))
        .then(function (r) { return r.arrayBuffer(); })
        .then(function (buf) { return new FontFace("NeoAmp LCD", buf).load(); })
        .then(function (ff) { document.fonts.add(ff); })
        .catch(function (e) { console.warn("[NeoAmp] LCD font load failed:", e); });
    } catch (e) { console.warn("[NeoAmp] LCD font:", e); }
  })();

  var SNAP = 9;                 // px magnetic-docking threshold
  var root = null, launcher = null;
  var wins = {};                // id -> { el, body, titlebar }
  var vizFrame = null, vizBuilt = false;
  var zTop = 20;
  var els = {};                 // cached main-window refs
  var seeking = false, trackDur = 0;
  var currentSkin = (window.NeoAmpSkins && window.NeoAmpSkins.DEFAULT_ID) || "classic";
  var layout = {};              // id -> {x,y,w,h}

  // ---- tiny DOM helper -----------------------------------------------------
  function h(tag, attrs, kids) {
    var el = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === "class") el.className = attrs[k];
      else if (k === "html") el.innerHTML = attrs[k];
      else if (k === "text") el.textContent = attrs[k];
      else el.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { if (c) el.appendChild(c); });
    return el;
  }

  // ---- scalable inline-SVG transport icons --------------------------------
  function icon(name) {
    var P = {
      prev: "M6 5v14M8 12l9 7V5z",                 // (drawn filled below)
      play: "M8 5v14l11-7z",
      pause: "M7 5h3v14H7zM14 5h3v14h-3z",
      stop: "M6 6h12v12H6z",
      next: "M18 5v14M16 12L7 5v14z",
      eject: "M5 16h14L12 7zM5 18h14v2H5z",
    };
    // Use filled paths via a single <path>; for prev/next we want solid blocks.
    var d = {
      prev: "M7 5h2.2v14H7zM18 5L9.4 12 18 19z",
      play: "M8 5v14l11-7z",
      pause: "M7 5h3.4v14H7zM13.6 5H17v14h-3.4z",
      stop: "M6 6h12v12H6z",
      next: "M14.8 5H17v14h-2.2zM6 5l8.6 7L6 19z",
      eject: "M12 6l7 9H5zM5 17h14v2.4H5z",
    }[name];
    var s = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + d + '"/></svg>';
    void P;
    return s;
  }

  // =========================================================================
  // WINDOW MANAGER
  // =========================================================================
  function makeWindow(id, title, opts) {
    opts = opts || {};
    var titleSpan = h("span", { class: "wa-title", html: '<span class="wa-logo">◢◤</span>' + title });
    var tbtns = h("span", { class: "wa-tbtns" });
    // optional left-side gadget (e.g. skin picker on the main window)
    var bar = h("div", { class: "wa-titlebar" }, [titleSpan, opts.gadget || null, tbtns]);
    var body = h("div", { class: "wa-body" });
    var el = h("div", { class: "wa-win inactive", id: id }, [bar, body]);

    // optional extra titlebar buttons (e.g. fullscreen), then shade, then close
    (opts.titleButtons || []).forEach(function (b) {
      var btn = h("span", { class: "wa-tbtn", title: b.title, text: b.label });
      btn.addEventListener("click", function (e) { e.stopPropagation(); b.onClick(); });
      tbtns.appendChild(btn);
    });

    // shade (collapse to titlebar) + close buttons
    if (opts.shade !== false) {
      var shadeBtn = h("span", { class: "wa-tbtn", title: "Shade", text: "▬" });
      shadeBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        body.style.display = body.style.display === "none" ? "" : "none";
      });
      tbtns.appendChild(shadeBtn);
    }
    var closeBtn = h("span", { class: "wa-tbtn", title: "Close", text: "✕" });
    closeBtn.addEventListener("click", function (e) { e.stopPropagation(); (opts.onClose || function () { el.style.display = "none"; })(); });
    tbtns.appendChild(closeBtn);

    el.addEventListener("mousedown", function () { raise(el); }, true);
    makeDraggable(el, bar);
    root.appendChild(el);
    wins[id] = { el: el, body: body, titlebar: bar };
    raise(el);
    return wins[id];
  }

  function raise(el) {
    Object.keys(wins).forEach(function (k) { wins[k].el.classList.add("inactive"); });
    el.classList.remove("inactive");
    el.style.zIndex = String(++zTop);
  }

  function makeDraggable(el, handle) {
    var ox = 0, oy = 0, dragging = false;
    handle.addEventListener("mousedown", function (e) {
      if (e.button !== 0 || e.target.closest(".wa-tbtn, .wa-skinsel")) return;
      dragging = true;
      var r = el.getBoundingClientRect();
      ox = e.clientX - r.left; oy = e.clientY - r.top;
      el.classList.add("dragging");
      e.preventDefault();
    });
    document.addEventListener("mousemove", function (e) {
      if (!dragging) return;
      var x = e.clientX - ox, y = e.clientY - oy;
      var pos = snap(el, x, y);
      el.style.left = pos.x + "px"; el.style.top = pos.y + "px";
    });
    document.addEventListener("mouseup", function () {
      if (!dragging) return;
      dragging = false;
      el.classList.remove("dragging");
      saveLayout();
    });
  }

  // Magnetic docking: snap the dragged window's edges to the viewport and to the
  // other windows' edges when within SNAP px (Winamp's signature behavior).
  function snap(el, x, y) {
    var w = el.offsetWidth, hgt = el.offsetHeight;
    var vw = window.innerWidth, vh = window.innerHeight;
    var L = x, T = y, R = x + w, B = y + hgt;
    var cand = [{ l: 0, t: 0, r: vw, b: vh }]; // viewport
    Object.keys(wins).forEach(function (k) {
      if (wins[k].el === el) return;
      var o = wins[k].el; var r = { l: o.offsetLeft, t: o.offsetTop, r: o.offsetLeft + o.offsetWidth, b: o.offsetTop + o.offsetHeight };
      cand.push(r);
    });
    cand.forEach(function (r) {
      // horizontal: align left/right edges or butt against neighbour
      if (Math.abs(L - r.l) <= SNAP) x = r.l;
      else if (Math.abs(R - r.r) <= SNAP) x = r.r - w;
      else if (Math.abs(L - r.r) <= SNAP) x = r.r;
      else if (Math.abs(R - r.l) <= SNAP) x = r.l - w;
      // vertical
      if (Math.abs(T - r.t) <= SNAP) y = r.t;
      else if (Math.abs(B - r.b) <= SNAP) y = r.b - hgt;
      else if (Math.abs(T - r.b) <= SNAP) y = r.b;
      else if (Math.abs(B - r.t) <= SNAP) y = r.t - hgt;
    });
    x = Math.max(0, Math.min(vw - w, x));
    y = Math.max(0, Math.min(vh - hgt, y));
    return { x: x, y: y };
  }

  function makeResizable(el, handle, minW, minH) {
    var sx = 0, sy = 0, sw = 0, sh = 0, sizing = false;
    handle.addEventListener("mousedown", function (e) {
      sizing = true; sx = e.clientX; sy = e.clientY;
      sw = el.offsetWidth; sh = el.offsetHeight;
      e.preventDefault(); e.stopPropagation();
    });
    document.addEventListener("mousemove", function (e) {
      if (!sizing) return;
      el.style.width = Math.max(minW, sw + (e.clientX - sx)) + "px";
      el.style.height = Math.max(minH, sh + (e.clientY - sy)) + "px";
    });
    document.addEventListener("mouseup", function () { if (sizing) { sizing = false; saveLayout(); } });
  }

  // ---- layout persistence --------------------------------------------------
  function saveLayout() {
    Object.keys(wins).forEach(function (k) {
      var e = wins[k].el;
      layout[k] = { x: e.offsetLeft, y: e.offsetTop, w: e.offsetWidth, h: e.offsetHeight, hidden: e.style.display === "none" };
    });
    NA.storage.set({ neoampLayout: layout });
  }
  function applyLayout() {
    var defaults = { "wa-main": { x: 40, y: 70 }, "wa-eq": { x: 40, y: 250 }, "wa-viz": { x: 480, y: 70, w: 360, h: 280 } };
    Object.keys(wins).forEach(function (k) {
      var e = wins[k].el;
      var d = (layout[k]) || defaults[k] || { x: 60, y: 60 };
      e.style.left = (d.x || 40) + "px";
      e.style.top = (d.y || 60) + "px";
      if (d.w && k === "wa-viz") { e.style.width = d.w + "px"; e.style.height = d.h + "px"; }
      if (d.hidden) e.style.display = "none";
    });
  }

  // =========================================================================
  // MAIN WINDOW
  // =========================================================================
  function buildMain() {
    // skin picker gadget in the titlebar
    var skinSel = h("select", { class: "wa-skinsel", title: "Skin" });
    (window.NeoAmpSkins ? window.NeoAmpSkins.list : []).forEach(function (s) {
      var o = h("option", { value: s.id, text: s.name });
      skinSel.appendChild(o);
    });
    skinSel.value = currentSkin;
    skinSel.addEventListener("change", function () { applySkin(skinSel.value); });
    skinSel.addEventListener("mousedown", function (e) { e.stopPropagation(); });

    var win = makeWindow("wa-main", "NeoAmp", { gadget: skinSel, onClose: function () { NA.stop(); } });

    // left column: clock + album art
    els.clock = h("div", { class: "wa-clock wa-lcd", text: "0:00" });
    var artImg = h("img", { alt: "" });
    els.art = h("div", { class: "wa-art empty" }, [artImg]);
    els.artImg = artImg;
    var leftCol = h("div", {}, [els.clock, els.art]);

    // right column
    els.marquee = h("div", { class: "wa-marquee-track", text: "NeoAmp ◢◤ — start playback…" });
    var marqueeBox = h("div", { class: "wa-marquee wa-inset" }, [els.marquee]);

    els.analyzer = h("canvas", { class: "wa-analyzer", width: "260", height: "72" });
    var bitline = h("div", { class: "wa-bitline" }, [
      (els.kbps = h("span", { text: "—— kbps" })),
      (els.khz = h("span", { text: "44 kHz" })),
    ]);
    els.stereo = h("div", { class: "wa-stereo" }, [
      h("span", { text: "mono" }),
      (function () { var s = h("span", { class: "on", text: "stereo" }); return s; })(),
    ]);
    var bitbox = h("div", { class: "wa-bitbox" }, [bitline, els.stereo]);
    var midrow = h("div", { class: "wa-midrow" }, [h("div", { class: "wa-inset" }, [els.analyzer]), h("div", { class: "wa-inset" }, [bitbox])]);

    els.seek = h("input", { class: "wa-range", type: "range", min: "0", max: "1000", value: "0", title: "Seek" });
    var posbar = h("div", { class: "wa-posbar wa-inset" }, [els.seek]);

    var rcol = h("div", { class: "wa-rcol" }, [marqueeBox, midrow, posbar]);

    var grid = h("div", { class: "wa-main-grid" }, [leftCol, rcol]);

    // transport row
    function tbtn(name, title, fn) {
      var b = h("button", { class: "wa-btn", title: title, html: icon(name) });
      b.addEventListener("click", fn);
      return b;
    }
    els.playBtn = tbtn("play", "Play / Pause (Space)", function () { NA.control.playPause(); });
    var transport = h("div", { class: "wa-transport" }, [
      tbtn("prev", "Previous", function () { NA.control.prev(); }),
      els.playBtn,
      tbtn("stop", "Stop", function () { NA.control.stop(); }),
      tbtn("next", "Next", function () { NA.control.next(); }),
      tbtn("eject", "Search YouTube Music", function () { focusYtSearch(); }),
    ]);

    els.vol = h("input", { class: "wa-range wa-vol", type: "range", min: "0", max: "100", value: "100", title: "Volume" });
    els.bal = h("input", { class: "wa-range wa-bal", type: "range", min: "-100", max: "100", value: "0", title: "Balance (cosmetic)" });
    els.vol.addEventListener("input", function () { NA.control.setVolume(+els.vol.value / 100); paintRange(els.vol); });
    els.bal.addEventListener("input", function () { paintRange(els.bal); });
    var vols = h("div", { class: "wa-vols" }, [els.vol, els.bal]);

    function tog(label, title, fn) {
      var t = h("div", { class: "wa-tog", title: title, text: label });
      t.addEventListener("click", function () { fn(t); });
      return t;
    }
    els.shuffleTog = tog("SHUF", "Shuffle", function (t) { t.classList.toggle("on"); NA.control.toggleShuffle(); });
    els.repeatTog = tog("REP", "Repeat", function (t) { t.classList.toggle("on"); NA.control.toggleRepeat(); });
    els.eqTog = tog("EQ", "Toggle equalizer", function (t) { toggleWin("wa-eq", t); });
    els.visTog = tog("VIS", "Toggle visualization", function (t) { toggleWin("wa-viz", t); });
    var toggles = h("div", { class: "wa-toggles" }, [els.shuffleTog, els.repeatTog, els.eqTog, els.visTog]);

    var controls = h("div", { class: "wa-controls" }, [transport, vols, toggles]);

    win.body.appendChild(grid);
    win.body.appendChild(controls);

    // seek interactions
    els.seek.addEventListener("input", function () {
      seeking = true;
      var t = trackDur * (+els.seek.value / 1000);
      els.clock.textContent = fmt(t);
      paintRange(els.seek);
    });
    els.seek.addEventListener("change", function () {
      NA.control.seek(trackDur * (+els.seek.value / 1000));
      seeking = false;
    });

    // init volume + slider fills
    els.vol.value = String(Math.round(NA.control.getVolume() * 100));
    [els.seek, els.vol, els.bal].forEach(paintRange);
  }

  // paint the filled portion of a native range track (it doesn't fill itself)
  function paintRange(input) {
    var min = +input.min, max = +input.max, v = +input.value;
    var pct = max > min ? ((v - min) / (max - min)) * 100 : 0;
    input.style.background =
      "linear-gradient(90deg, var(--wa-accent) " + pct + "%, transparent " + pct + "%), var(--wa-track-bg)";
  }

  // =========================================================================
  // EQUALIZER WINDOW (cosmetic — sliders move but don't filter audio yet)
  // =========================================================================
  function buildEq() {
    var win = makeWindow("wa-eq", "NeoAmp Equalizer", { onClose: function () { hideWin("wa-eq"); } });
    var curve = h("canvas", { class: "wa-eq-curve wa-inset", width: "300", height: "56" });
    var onTog = h("div", { class: "wa-tog on", text: "ON" });
    var autoTog = h("div", { class: "wa-tog", text: "AUTO" });
    onTog.addEventListener("click", function () { onTog.classList.toggle("on"); });
    autoTog.addEventListener("click", function () { autoTog.classList.toggle("on"); });
    var top = h("div", { class: "wa-eq-top" }, [onTog, autoTog, curve]);

    var labels = ["PRE", "60", "170", "310", "600", "1K", "3K", "6K", "12K", "14K", "16K"];
    var bands = h("div", { class: "wa-eq-bands" });
    els.eqSliders = [];
    labels.forEach(function (lab) {
      var sl = h("input", { class: "wa-vrange", type: "range", min: "-12", max: "12", value: "0" });
      sl.addEventListener("input", function () { drawEqCurve(); });
      els.eqSliders.push(sl);
      bands.appendChild(h("div", { class: "wa-eq-band" }, [sl, h("div", { class: "wa-eq-label", text: lab })]));
    });
    win.body.appendChild(top);
    win.body.appendChild(bands);
    els.eqCurve = curve;
    drawEqCurve();
  }

  function drawEqCurve() {
    var c = els.eqCurve; if (!c) return;
    var g = c.getContext("2d");
    var W = c.width, H = c.height;
    g.clearRect(0, 0, W, H);
    var vals = els.eqSliders.slice(1).map(function (s) { return +s.value; }); // skip preamp
    g.strokeStyle = cssVar("--wa-accent") || "#16e651";
    g.lineWidth = 2; g.shadowColor = g.strokeStyle; g.shadowBlur = 6;
    g.beginPath();
    for (var i = 0; i < vals.length; i++) {
      var x = (i / (vals.length - 1)) * W;
      var y = H / 2 - (vals[i] / 12) * (H / 2 - 3);
      i === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
    }
    g.stroke();
  }

  // =========================================================================
  // VISUALIZATION WINDOW (Butterchurn iframe in the body)
  // =========================================================================
  function buildViz() {
    var win = makeWindow("wa-viz", "NeoAmp Visualization", {
      shade: false,
      titleButtons: [{ label: "⛶", title: "Fullscreen (Esc to exit)", onClick: toggleVizFullscreen }],
      onClose: function () { hideWin("wa-viz"); },
    });
    vizFrame = h("iframe", { class: "wa-viz-frame", src: chrome.runtime.getURL("viz.html"), frameborder: "0", allowtransparency: "false" });
    vizFrame.style.border = "0"; vizFrame.style.outline = "none";
    win.body.appendChild(vizFrame);
    var rs = h("div", { class: "wa-resize", title: "Resize" });
    win.el.appendChild(rs);
    makeResizable(win.el, rs, 200, 150);
    vizBuilt = true;
  }

  // Fullscreen the whole viz window (CSS hides its chrome so the canvas goes
  // edge-to-edge); Esc exits. Requesting on the window <div> avoids sandboxed-
  // iframe fullscreen-permission quirks. The iframe resizes with its element, so
  // viz.js's resize handler reflows the canvas (nudged for good measure).
  function toggleVizFullscreen() {
    var el = wins["wa-viz"] && wins["wa-viz"].el;
    if (!el) return;
    if (document.fullscreenElement === el) {
      (document.exitFullscreen || document.webkitExitFullscreen || function () {}).call(document);
    } else {
      (el.requestFullscreen || el.webkitRequestFullscreen || function () {}).call(el);
      raise(el);
    }
  }
  document.addEventListener("fullscreenchange", function () {
    var el = wins["wa-viz"] && wins["wa-viz"].el;
    if (el) el.classList.toggle("wa-fs", document.fullscreenElement === el);
    setTimeout(function () { postViz({ type: "resize" }); }, 80);
  });

  // =========================================================================
  // iframe bridge (audio in, presets/favorites round-trip)
  // =========================================================================
  function postViz(m) {
    if (!vizFrame || !vizFrame.contentWindow) return;
    try { vizFrame.contentWindow.postMessage(Object.assign({ __wmp: true }, m), "*"); } catch (_) {}
  }
  window.addEventListener("message", function (e) {
    if (!vizFrame || e.source !== vizFrame.contentWindow) return;
    var m = e.data || {};
    if (!m.__wmp) return;
    if (m.type === "ready") {
      NA.storage.get("neoampFavorites", function (names) { postViz({ type: "favorites:init", names: names || [] }); });
    } else if (m.type === "favorites:set") {
      NA.storage.set({ neoampFavorites: m.names || [] });
    } else if (m.type === "error") {
      NA.toast("Visualizer: " + m.message);
      console.error("[NeoAmp viz]", m.message);
    } else if (m.type === "preset:changed" && wins["wa-viz"]) {
      var t = wins["wa-viz"].titlebar.querySelector(".wa-title");
      if (t && m.name) t.innerHTML = '<span class="wa-logo">◢◤</span>' + escapeHtml(m.name);
    }
  });

  // =========================================================================
  // live data → UI
  // =========================================================================
  function onTrack(t) {
    if (els.clock && !seeking) els.clock.textContent = fmt(t.currentTime);
    if (els.playBtn) els.playBtn.innerHTML = icon(t.paused ? "play" : "pause");
    trackDur = t.duration || 0;
    var label = t.title ? (t.title + (t.artist ? "  —  " + t.artist : "")) : "NeoAmp ◢◤";
    setMarquee(label);
    if (els.artImg && t.art && els.artImg.src !== t.art) els.artImg.src = t.art;
    if (els.art) els.art.classList.toggle("empty", !t.art);
    if (!seeking && els.seek) {
      var pct = trackDur > 0 ? (t.currentTime / trackDur) * 1000 : 0;
      els.seek.value = String(Math.round(pct));
      paintRange(els.seek);
    }
  }

  var marqueeAnim = null, lastMarquee = "";
  function setMarquee(text) {
    if (text === lastMarquee) return;
    lastMarquee = text;
    if (marqueeAnim) { marqueeAnim.cancel(); marqueeAnim = null; }
    var sep = "      ◆      ";
    els.marquee.textContent = text;
    els.marquee.style.transform = "translateX(0)";
    // animate only if it overflows; scroll one full text+sep width then loop
    requestAnimationFrame(function () {
      var box = els.marquee.parentNode;
      if (els.marquee.scrollWidth <= box.clientWidth) return;
      els.marquee.textContent = text + sep + text;
      var dist = (els.marquee.scrollWidth - els.marquee.clientWidth) / 2 + measure(sep);
      var dur = Math.max(6000, dist * 45);
      marqueeAnim = els.marquee.animate(
        [{ transform: "translateX(0)" }, { transform: "translateX(" + -dist + "px)" }],
        { duration: dur, iterations: Infinity, easing: "linear" }
      );
    });
  }
  function measure(s) {
    var span = h("span", { text: s });
    span.style.cssText = "position:absolute;visibility:hidden;white-space:pre;font:inherit";
    els.marquee.appendChild(span); var w = span.offsetWidth; span.remove(); return w;
  }

  function onAudio(frame) {
    postViz({ type: "audio", data: frame.time }); // feed Butterchurn
    drawAnalyzer(frame.freq);
  }

  // classic Winamp-style bar analyzer with falling peak caps
  var peaks = null;
  function drawAnalyzer(freq) {
    var c = els.analyzer; if (!c || !freq) return;
    var g = c.getContext("2d");
    var W = c.width, H = c.height, N = 19;
    g.clearRect(0, 0, W, H);
    if (!peaks) peaks = new Float32Array(N);
    var lo = cssVar("--wa-bar-lo") || "#16e651";
    var hi = cssVar("--wa-bar-hi") || "#ffe000";
    var pk = cssVar("--wa-bar-peak") || "#ff5050";
    // classic green→yellow→red levels (color by absolute height: tall/loud bars
    // turn yellow then red at their tips, like real Winamp)
    var grad = g.createLinearGradient(0, H, 0, 0);
    grad.addColorStop(0, lo); grad.addColorStop(0.45, lo);
    grad.addColorStop(0.72, hi); grad.addColorStop(1, pk);
    var bw = W / N;
    // sample frequency bins logarithmically across the lower ~half of the FFT
    var bins = freq.length;
    for (var i = 0; i < N; i++) {
      var f0 = Math.pow(i / N, 1.7), f1 = Math.pow((i + 1) / N, 1.7);
      var a = Math.floor(f0 * bins * 0.55), b = Math.max(a + 1, Math.floor(f1 * bins * 0.55));
      var m = 0; for (var j = a; j < b && j < bins; j++) m = Math.max(m, freq[j]);
      var v = m / 255;
      var bh = v * H;
      g.fillStyle = grad;
      g.fillRect(i * bw + 1, H - bh, bw - 2, bh);
      // peak cap
      if (bh > peaks[i]) peaks[i] = bh; else peaks[i] = Math.max(0, peaks[i] - H * 0.012);
      g.fillStyle = pk;
      g.fillRect(i * bw + 1, H - peaks[i] - 2, bw - 2, 2);
    }
  }

  // =========================================================================
  // skins
  // =========================================================================
  function applySkin(id) {
    if (!window.NeoAmpSkins) return;
    currentSkin = window.NeoAmpSkins.apply(root, id);
    NA.storage.set({ neoampSkin: currentSkin });
  }
  function cssVar(name) {
    return root ? getComputedStyle(root).getPropertyValue(name).trim() : "";
  }

  // =========================================================================
  // helpers / lifecycle
  // =========================================================================
  function fmt(s) {
    s = Math.max(0, Math.floor(s || 0));
    var m = Math.floor(s / 60), r = s % 60;
    return m + ":" + (r < 10 ? "0" : "") + r;
  }
  function escapeHtml(s) { return String(s).replace(/[&<>]/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]; }); }

  function toggleWin(id, togEl) {
    var w = wins[id]; if (!w) return;
    var hidden = w.el.style.display === "none";
    w.el.style.display = hidden ? "" : "none";
    if (togEl) togEl.classList.toggle("on", hidden);
    if (hidden) raise(w.el);
    saveLayout();
  }
  function hideWin(id) {
    if (wins[id]) wins[id].el.style.display = "none";
    if (id === "wa-eq" && els.eqTog) els.eqTog.classList.remove("on");
    if (id === "wa-viz" && els.visTog) els.visTog.classList.remove("on");
    saveLayout();
  }

  function focusYtSearch() {
    var s = document.querySelector("ytmusic-search-box input, input.search, ytmusic-search-box");
    if (s && s.focus) { s.focus(); s.scrollIntoView({ block: "center" }); }
    else NA.toast("Use YouTube Music's own search box");
  }

  function buildUI() {
    if (root) return;
    root = h("div", { id: "neoamp-root" });
    document.documentElement.appendChild(root);
    buildMain();
    buildEq();
    buildViz();
    // reflect EQ/VIS toggle initial state
    if (els.eqTog) els.eqTog.classList.add("on");
    if (els.visTog) els.visTog.classList.add("on");
    NA.on("track", onTrack);
    NA.on("audio", onAudio);
    NA.storage.get("neoampSkin", function (id) { if (id) { currentSkin = id; applySkin(id); var ss = root.querySelector(".wa-skinsel"); if (ss) ss.value = id; } });
    NA.storage.get("neoampLayout", function (l) { layout = l || {}; applyLayout(); });
  }

  function showUI() {
    buildUI();
    root.style.display = "";
    if (launcher) launcher.style.display = "none";
    var cur = NA.getTrack(); if (cur) onTrack(cur);
  }
  function hideUI() {
    if (root) root.style.display = "none";
    if (launcher) launcher.style.display = "";
  }

  // ---- launcher + keyboard -------------------------------------------------
  function ensureLauncher() {
    if (document.getElementById("neoamp-launch")) return;
    launcher = h("button", { id: "neoamp-launch", title: "Launch NeoAmp (Shift+V)", text: "◢◤ NeoAmp" });
    launcher.addEventListener("click", function () { NA.start(); });
    document.documentElement.appendChild(launcher);
  }

  NA.on("start", showUI);
  NA.on("stop", hideUI);

  window.addEventListener("keydown", function (e) {
    if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    if (e.shiftKey && (e.key === "V" || e.key === "v")) { e.preventDefault(); NA.isRunning() ? NA.stop() : NA.start(); }
  }, true);

  ensureLauncher();
  // YTM is a SPA; re-add the launcher if a navigation wipes it.
  var mo = new MutationObserver(function () {
    if (!document.getElementById("neoamp-launch") && !NA.isRunning()) ensureLauncher();
  });
  mo.observe(document.documentElement, { childList: true });
})();
