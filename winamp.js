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

  // Load the bundled fonts with ABSOLUTE extension URLs. A relative url() in a
  // content-script-injected stylesheet (winamp.css) does NOT resolve to the extension —
  // it 404s and the text silently falls back to mono — so the @font-face there never
  // worked live. chrome.runtime.getURL gives the real web-accessible path; this <style>
  // (in the page document) is what actually registers + loads "NeoAmp LCD"/"NeoAmp Pixel".
  (function injectFonts() {
    try {
      var f = function (fam, file) { return '@font-face{font-family:"' + fam + '";src:url("' + chrome.runtime.getURL("fonts/" + file) + '") format("truetype");font-display:swap}'; };
      var st = document.createElement("style");
      st.textContent = f("NeoAmp LCD", "VT323-Regular.ttf") + f("NeoAmp Pixel", "Silkscreen-Bold.ttf");
      (document.head || document.documentElement).appendChild(st);
    } catch (_) {}
  })();

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
  // Global UI zoom. The whole player is fixed-size (the .wsz skin renders at a
  // hardcoded 2x and the CSS is in fixed px), so on a short viewport the docked
  // stack overflows. uiScale CSS-transforms #neoamp-root (origin 0,0) to shrink
  // everything to fit. Because layout math (offsetLeft/innerWidth) lives in the
  // UNSCALED coordinate space, pointer deltas and the viewport bounds are divided
  // by uiScale (see vpW/vpH + the drag/resize handlers) so dragging stays exact.
  var uiScale = 1;
  function vpW() { return window.innerWidth / uiScale; }   // viewport width in layout (pre-transform) px
  function vpH() { return window.innerHeight / uiScale; }
  var root = null, launcher = null;
  var wins = {};                // id -> { el, body, titlebar }
  var vizFrame = null, vizBuilt = false;
  var zTop = 20;
  var els = {};                 // cached main-window refs
  var seeking = false, trackDur = 0;
  var currentSkin = (window.NeoAmpSkins && window.NeoAmpSkins.DEFAULT_ID) || "classic";
  var layout = {};              // id -> {x,y,w,h}

  // real Winamp skins (.wsz) rendered by wsz.js. id -> vendored resource path.
  var CLASSIC_SKINS = [
    { id: "base-2.91", name: "Winamp Classic", file: "vendor/skins/base-2.91.wsz" },
    { id: "topazamp", name: "TopazAmp", file: "vendor/skins/topazamp.wsz" },
    { id: "sony-esprit", name: "Sony Esprit", file: "vendor/skins/sony-esprit.wsz" },
    { id: "nucleo-nlog", name: "Nucleo NLog", file: "vendor/skins/nucleo-nlog.wsz" },
    { id: "winamp3-classified", name: "Winamp3 Classified", file: "vendor/skins/winamp3-classified.wsz" },
    { id: "winamp5-classified", name: "Winamp5 Classified", file: "vendor/skins/winamp5-classified.wsz" },
    { id: "bento-classified", name: "Bento Classified", file: "vendor/skins/bento-classified.wsz" },
  ];
  var classicApi = null;        // mounted Main-window renderer (null = procedural mode)

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

  // a list thumbnail: an <img> with an error fallback to an empty tile, or just
  // an empty tile when there's no/invalid artwork (never a broken-image icon).
  function makeThumb(cls, art) {
    if (!(art && /^https?:\/\//.test(art))) return h("span", { class: cls + " empty" });
    var img = h("img", { class: cls, src: art });
    img.addEventListener("error", function () { img.className = cls + " empty"; img.removeAttribute("src"); });
    return img;
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
    el.setAttribute("role", "group"); el.setAttribute("aria-label", title);   // SR window landmark

    // optional extra titlebar buttons (e.g. fullscreen), then shade, then close.
    // b.html lets a button use a crisp inline-SVG icon instead of a text glyph.
    (opts.titleButtons || []).forEach(function (b) {
      var attrs = { class: "wa-tbtn" + (b.cls ? " " + b.cls : ""), title: b.title };
      if (b.html) attrs.html = b.html; else attrs.text = b.label;
      var btn = h("span", attrs);
      btn.addEventListener("click", function (e) { e.stopPropagation(); b.onClick(); });
      tbtns.appendChild(btn);
    });

    // shade (collapse to just the titlebar) — the button AND a titlebar double-click
    // (the WMP/Winamp idiom). State persists across reloads via saveLayout().
    if (opts.shade !== false) {
      var shadeBtn = h("span", { class: "wa-tbtn", title: "Shade (or double-click titlebar)", text: "▬" });
      shadeBtn.addEventListener("click", function (e) { e.stopPropagation(); setShaded(id); });
      tbtns.appendChild(shadeBtn);
      bar.addEventListener("dblclick", function (e) {
        if (e.target.closest(".wa-tbtn, .wa-skinsel-btn")) return;   // not when toggling a titlebar control
        setShaded(id);
      });
    }
    var closeBtn = h("span", { class: "wa-tbtn wa-close", title: "Close", text: "✕" });
    closeBtn.addEventListener("click", function (e) { e.stopPropagation(); (opts.onClose || function () { el.style.display = "none"; })(); });
    tbtns.appendChild(closeBtn);

    el.addEventListener("mousedown", function () { raise(el); }, true);
    makeDraggable(el, bar);
    root.appendChild(el);
    wins[id] = { el: el, body: body, titlebar: bar };
    raise(el);
    return wins[id];
  }

  // Bring a window to the front. Grabbing the main window (the docked anchor —
  // #wa-main procedurally, #wa-skin in classic mode) raises the WHOLE attached
  // stack together, so the player group never gets split across the viz window's
  // depth (classic Winamp: the main window + its docked sub-windows surface as a
  // unit). Sub-windows grabbed on their own still raise individually.
  function raise(el) {
    Object.keys(wins).forEach(function (k) { wins[k].el.classList.add("inactive"); });
    var group = (el.id === "wa-main" || el.id === "wa-skin")
      ? attachedCluster(el).map(function (m) { return m.el; }).filter(function (g) { return g !== el; })
      : [];
    // group members first (below), then the grabbed window on top + marked active
    group.forEach(function (g) { g.style.zIndex = String(++zTop); g.classList.remove("inactive"); });
    el.style.zIndex = String(++zTop);
    el.classList.remove("inactive");
  }

  // Transient full-viewport overlay shown during a drag/resize. Mouse events
  // over a cross-origin iframe (the viz canvas) never reach our document, which
  // would strand us in drag/resize mode (mouseup is lost). The shield sits on
  // top and captures every move/up so our listeners always fire and release.
  var dragShield = null;
  function shield(on, cursor) {
    if (on) {
      if (!dragShield) dragShield = h("div", { id: "neoamp-shield" });
      dragShield.style.cssText =
        "position:fixed;inset:0;z-index:2147483640;pointer-events:auto;cursor:" + (cursor || "default") + ";";
      // on documentElement (NOT root) so it covers the TRUE viewport — root may be
      // CSS-scaled by uiScale, which would shrink a root-child shield off-coverage.
      document.documentElement.appendChild(dragShield);
    } else if (dragShield && dragShield.parentNode) {
      dragShield.parentNode.removeChild(dragShield);
    }
  }

  // Windows whose edges touch form a docked group that moves together (classic
  // Winamp). BFS from the dragged window over an adjacency test (edges within
  // TOL px AND overlapping on the perpendicular axis). Returns each member with
  // its starting position so the drag handler can shift them all by one delta.
  function attachedCluster(start) {
    var TOL = 9;
    var keys = Object.keys(wins).filter(function (k) { return wins[k].el.style.display !== "none"; });
    var rect = {};
    keys.forEach(function (k) {
      var e = wins[k].el;
      rect[k] = { l: e.offsetLeft, t: e.offsetTop, r: e.offsetLeft + e.offsetWidth, b: e.offsetTop + e.offsetHeight };
    });
    function adjacent(a, b) {
      var ra = rect[a], rb = rect[b];
      var vOv = Math.min(ra.b, rb.b) - Math.max(ra.t, rb.t) > 2;   // share vertical extent
      var hOv = Math.min(ra.r, rb.r) - Math.max(ra.l, rb.l) > 2;   // share horizontal extent
      var touchX = (Math.abs(ra.r - rb.l) <= TOL || Math.abs(ra.l - rb.r) <= TOL) && vOv;
      var touchY = (Math.abs(ra.b - rb.t) <= TOL || Math.abs(ra.t - rb.b) <= TOL) && hOv;
      return touchX || touchY;
    }
    var startK = null;
    keys.forEach(function (k) { if (wins[k].el === start) startK = k; });
    var seen = {}, queue = startK ? [startK] : [];
    if (startK) seen[startK] = 1;
    while (queue.length) {
      var c = queue.shift();
      keys.forEach(function (k) { if (!seen[k] && adjacent(c, k)) { seen[k] = 1; queue.push(k); } });
    }
    return Object.keys(seen).map(function (k) { var e = wins[k].el; return { el: e, sl: e.offsetLeft, st: e.offsetTop }; });
  }

  function makeDraggable(el, handle) {
    var ox = 0, oy = 0, dragging = false, cluster = [], sl0 = 0, st0 = 0;
    handle.addEventListener("mousedown", function (e) {
      if (e.button !== 0 || e.target.closest(".wa-tbtn, .wa-skinsel")) return;
      dragging = true;
      var r = el.getBoundingClientRect();
      ox = e.clientX - r.left; oy = e.clientY - r.top;
      // Winamp's anchor model: only the main window drags the whole docked
      // group; sub-windows (EQ/Viz/Playlist/Library) move on their own. In
      // classic (.wsz) mode the main window is #wa-skin, so it anchors too.
      cluster = (el.id === "wa-main" || el.id === "wa-skin")
        ? attachedCluster(el)
        : [{ el: el, sl: el.offsetLeft, st: el.offsetTop }];
      sl0 = el.offsetLeft; st0 = el.offsetTop; // dragged window's start position
      el.classList.add("dragging");
      shield(true, "move");
      e.preventDefault();
    });
    window.addEventListener("mousemove", function (e) {
      if (!dragging) return;
      // ox/oy are visual (post-transform) offsets; /uiScale maps the cursor back to
      // the window's unscaled layout coordinate so the grab point tracks exactly.
      var pos = snap(el, (e.clientX - ox) / uiScale, (e.clientY - oy) / uiScale, cluster);
      var dx = pos.x - sl0, dy = pos.y - st0;   // apply the same delta to every member
      cluster.forEach(function (m) { m.el.style.left = (m.sl + dx) + "px"; m.el.style.top = (m.st + dy) + "px"; });
    });
    var stop = function () {
      if (!dragging) return;
      dragging = false;
      el.classList.remove("dragging");
      shield(false);
      saveLayout();
    };
    window.addEventListener("mouseup", stop);
    window.addEventListener("blur", stop);
  }

  // Magnetic docking: snap the dragged window's edges to the viewport and to the
  // other windows' edges when within SNAP px (Winamp's signature behavior).
  // Windows in `cluster` (the group moving together) are excluded as snap
  // targets so the group never snaps to itself.
  function snap(el, x, y, cluster) {
    var excl = {};
    (cluster || []).forEach(function (m) { excl[m.el.id] = 1; });
    var w = el.offsetWidth, hgt = el.offsetHeight;
    var vw = vpW(), vh = vpH();   // viewport in layout px (zoom-aware)
    var L = x, T = y, R = x + w, B = y + hgt;
    var cand = [{ l: 0, t: 0, r: vw, b: vh }]; // viewport
    Object.keys(wins).forEach(function (k) {
      if (wins[k].el === el || excl[wins[k].el.id] || wins[k].el.style.display === "none") return;
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

  // lockWidth=true → height-only resize (the playlist keeps the stack width so
  // the Main/EQ/Playlist column stays flush, as in classic Winamp).
  function makeResizable(el, handle, minW, minH, lockWidth) {
    var sx = 0, sy = 0, sw = 0, sh = 0, sizing = false;
    handle.addEventListener("mousedown", function (e) {
      sizing = true; sx = e.clientX; sy = e.clientY;
      sw = el.offsetWidth; sh = el.offsetHeight;
      shield(true, lockWidth ? "ns-resize" : "nwse-resize");
      raise(el);
      e.preventDefault(); e.stopPropagation();
    });
    window.addEventListener("mousemove", function (e) {
      if (!sizing) return;
      // cap so the bottom-right resize handle can't be pushed off-screen (it'd be
      // unreachable to drag back smaller). Keep a 2px margin inside the viewport.
      var maxW = Math.max(minW, vpW() - el.offsetLeft - 2);
      var maxH = Math.max(minH, vpH() - el.offsetTop - 2);
      // pointer deltas are visual px; /uiScale converts to unscaled layout px
      if (!lockWidth) el.style.width = Math.min(maxW, Math.max(minW, sw + (e.clientX - sx) / uiScale)) + "px";
      el.style.height = Math.min(maxH, Math.max(minH, sh + (e.clientY - sy) / uiScale)) + "px";
    });
    var stop = function () { if (!sizing) return; sizing = false; shield(false); saveLayout(); };
    window.addEventListener("mouseup", stop);
    window.addEventListener("blur", stop);
  }

  // Keep every window reachable: cap any window bigger than the viewport, then clamp
  // its position back into view. Without this a window stranded off-screen (after the
  // browser shrinks, or an oversized viz) has its resize handle out of reach.
  function clampWindowsIntoView() {
    if (!root) return;
    var vw = vpW(), vh = vpH();   // layout-space viewport (zoom-aware)
    Object.keys(wins).forEach(function (k) {
      var e = wins[k] && wins[k].el;
      if (!e || e.style.display === "none") return;
      if (e.style.width && e.offsetWidth > vw) e.style.width = vw + "px";    // only resizable windows carry inline w/h
      if (e.style.height && e.offsetHeight > vh) e.style.height = vh + "px";
      var x = Math.max(0, Math.min(vw - e.offsetWidth, e.offsetLeft));
      var y = Math.max(0, Math.min(vh - e.offsetHeight, e.offsetTop));
      if (x !== e.offsetLeft) e.style.left = x + "px";
      if (y !== e.offsetTop) e.style.top = y + "px";
    });
  }
  var clampTimer = 0;
  window.addEventListener("resize", function () { clearTimeout(clampTimer); clampTimer = setTimeout(function () { clampWindowsIntoView(); saveLayout(); }, 150); });

  // ---- global zoom (fit the fixed-size player onto short viewports) ---------
  // transform-origin 0 0 keeps windows anchored near the top-left so they don't
  // drift off-screen as they shrink. clamp afterwards in case shrinking freed room.
  function applyUiScale() {
    if (!root) return;
    root.style.transformOrigin = "0 0";
    root.style.transform = uiScale === 1 ? "" : "scale(" + uiScale + ")";
    clampWindowsIntoView();
  }
  function setUiScale(s) {
    s = Math.max(0.5, Math.min(1, Math.round(s * 20) / 20));   // 50%..100% in 5% steps
    if (s !== uiScale) {
      uiScale = s;
      applyUiScale();
      NA.storage.set({ neoampZoom: uiScale });
    }
    syncZoomBtn();   // refresh the gear readout (after uiScale is updated)
    NA.toast("NeoAmp zoom: " + Math.round(uiScale * 100) + "%   ( - / = / \\ )");
  }
  function syncZoomBtn() {
    if (els.gearZoom) els.gearZoom();   // refresh the gear menu's Zoom readout
  }

  // Visually collapse a window to its titlebar (or expand it) — NO persistence, so
  // applyLayout can reuse it during restore. Resizable windows carry an inline height
  // that would keep the empty body's space, so we stash it on the element + clear it.
  function applyShade(id, shaded) {
    var w = wins[id]; if (!w) return;
    w.body.style.display = shaded ? "none" : "";
    if (shaded) {
      if (w.el.style.height) w.el.dataset.waH = w.el.style.height;   // remember expanded height
      w.el.style.height = "";
    } else if (w.el.dataset.waH) {
      w.el.style.height = w.el.dataset.waH; delete w.el.dataset.waH;   // restore it
    }
    w.el.classList.toggle("wa-shaded", shaded);
  }
  // User-facing shade toggle (button / titlebar double-click). `on` omitted = toggle.
  function setShaded(id, on) {
    var w = wins[id]; if (!w) return;
    var shaded = on === undefined ? !w.el.classList.contains("wa-shaded") : !!on;
    applyShade(id, shaded);
    if (classicApi) dockClassicStack();   // re-flow the docked stack around the new height
    saveLayout();
  }

  // ---- layout persistence --------------------------------------------------
  function saveLayout() {
    Object.keys(wins).forEach(function (k) {
      var e = wins[k].el;
      // when shaded, offsetHeight is just the titlebar — persist the EXPANDED height
      // (stashed on dataset) so unshading after a reload restores the right size.
      var h = (e.classList.contains("wa-shaded") && e.dataset.waH) ? parseInt(e.dataset.waH, 10) : e.offsetHeight;
      layout[k] = { x: e.offsetLeft, y: e.offsetTop, w: e.offsetWidth, h: h,
        hidden: e.style.display === "none", shaded: e.classList.contains("wa-shaded") };
    });
    NA.storage.set({ neoampLayout: layout });
  }
  // wa-pl resizes in height only — its width is locked to --wa-stack-w via CSS,
  // so we never apply an inline width to it (that's what let it drift out of
  // alignment with Main/EQ). wa-viz/wa-lib resize freely in both axes.
  var RESIZABLE_W = { "wa-viz": 1, "wa-lib": 1, "wa-lyrics": 1 };
  var RESIZABLE_H = { "wa-viz": 1, "wa-pl": 1, "wa-lib": 1, "wa-lyrics": 1 };
  function applyLayout() {
    // viz/lib default to the RIGHT of the classic stack (which is 550px wide at
    // x40 → right edge ~590), so they don't float over the docked windows.
    var defaults = {
      "wa-main": { x: 40, y: 70 },
      "wa-eq": { x: 40, y: 250 },
      "wa-viz": { x: 610, y: 70, w: 380, h: 300 },
      "wa-pl": { x: 40, y: 430, h: 220 },
      "wa-lib": { x: 610, y: 386, w: 380, h: 320, hidden: true },
      "wa-lyrics": { x: 1000, y: 70, w: 320, h: 360, hidden: true },
    };
    Object.keys(wins).forEach(function (k) {
      var e = wins[k].el;
      var d = (layout[k]) || defaults[k] || { x: 60, y: 60 };
      e.style.left = (d.x || 40) + "px";
      e.style.top = (d.y || 60) + "px";
      if (d.w && RESIZABLE_W[k]) e.style.width = d.w + "px";
      if (d.h && RESIZABLE_H[k]) e.style.height = d.h + "px";
      e.style.display = d.hidden ? "none" : "";
      // restore the windowshade state (applyShade stashes the just-set expanded height
      // so a later unshade restores it)
      applyShade(k, !!d.shaded);
    });
  }

  // The skin picker appears in two places (procedural main titlebar + classic
  // Now-Playing panel); every instance is registered here so they stay in sync.
  var skinSelectors = [];
  var DEFAULT_WSZ = "wsz:" + CLASSIC_SKINS[0].id;
  var activeSkinValue = DEFAULT_WSZ;        // currently applied skin (for reverting the picker)
  // A native <select> renders the OS dropdown, which breaks the skin illusion.
  // buildSkinSelect() instead returns a beveled button + a custom popup list
  // styled like a classic Winamp menu. The returned DOM node exposes a `.value`
  // getter/setter and a `.populate()` method so selectSkin/refreshSkinOptions/
  // setSkinSelectors keep working against the same array (skinSelectors).
  function buildSkinSelect() {
    var label = h("span", { class: "wa-skinsel-label", text: "Skin" });
    var btn = h("div", { class: "wa-skinsel-btn", title: "Skin" }, [label, h("span", { class: "wa-skinsel-arrow", text: "▾" })]);
    var menu = h("div", { class: "wa-skinsel-menu" });
    var wrap = h("div", { class: "wa-skinsel" }, [btn, menu]);
    var current = "";
    Object.defineProperty(wrap, "value", {
      get: function () { return current; },
      set: function (v) {
        current = v;
        var d = CLASSIC_SKINS.filter(function (s) { return "wsz:" + s.id === v; })[0];
        label.textContent = d ? d.name : "Skin";
      },
    });
    wrap.populate = function () {
      menu.innerHTML = "";
      CLASSIC_SKINS.forEach(function (s) {
        var it = h("div", { class: "wa-skinsel-item", text: s.name + (s.custom ? " ★" : "") });
        it.addEventListener("click", function (e) { e.stopPropagation(); menu.classList.remove("open"); selectSkin("wsz:" + s.id); });
        menu.appendChild(it);
      });
      var load = h("div", { class: "wa-skinsel-item load", text: "＋ Load skin…" });
      load.addEventListener("click", function (e) { e.stopPropagation(); menu.classList.remove("open"); selectSkin("__load__"); });
      menu.appendChild(load);
    };
    btn.addEventListener("mousedown", function (e) { e.stopPropagation(); });   // don't start a window drag
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      var willOpen = !menu.classList.contains("open");
      // close any other open picker, then toggle this one
      skinSelectors.forEach(function (w) { var m = w.querySelector(".wa-skinsel-menu"); if (m) m.classList.remove("open"); });
      if (willOpen) menu.classList.add("open");
    });
    wrap.populate();
    skinSelectors.push(wrap);
    return wrap;
  }
  // click anywhere else closes open skin menus
  document.addEventListener("click", function () {
    skinSelectors.forEach(function (w) { var m = w.querySelector(".wa-skinsel-menu"); if (m) m.classList.remove("open"); });
  });
  function refreshSkinOptions() { skinSelectors.forEach(function (w) { w.populate(); w.value = activeSkinValue; }); }
  function selectSkin(value) {
    if (value === "__load__") { openSkinPicker(); setSkinSelectors(activeSkinValue); return; }
    if (value.indexOf("wsz:") === 0) { enableClassic(value.slice(4)); activeSkinValue = value; }
    else { disableClassic(); applySkin(value); }
    setSkinSelectors(value);
  }
  function setSkinSelectors(value) { skinSelectors.forEach(function (w) { w.value = value; }); }

  // The ⚙ gear: a themed key (matches the other NP keys) that opens one popup with
  // the set-once appearance controls — Background, Zoom, and the Skin list. Registered
  // in skinSelectors so the active-skin highlight + populate() stay in sync with the
  // rest of the app. Reuses the .wa-skinsel-menu open/close plumbing.
  var GEAR_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.14 12.94a7.6 7.6 0 0 0 0-1.88l2-1.56-1.92-3.32-2.39.96a7.3 7.3 0 0 0-1.62-.94l-.36-2.54h-3.84l-.36 2.54c-.58.24-1.12.56-1.62.94l-2.39-.96L2.27 9.5l2 1.56a7.6 7.6 0 0 0 0 1.88l-2 1.56 1.92 3.32 2.39-.96c.5.38 1.04.7 1.62.94l.36 2.54h3.84l.36-2.54c.58-.24 1.12-.56 1.62-.94l2.39.96 1.92-3.32-2-1.56ZM12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7Z"/></svg>';
  // Position the (context-mode) gear wrap at a viewport point — converting to its host's
  // local coords through the UI zoom — then open the menu. Used by right-click + the logo.
  function openGearAt(gear, clientX, clientY) {
    if (!gear || !gear.openMenu) return;
    var host = gear.offsetParent || gear.parentNode; if (!host) return;
    var r = host.getBoundingClientRect(), s = uiScale || 1;
    gear.style.left = Math.max(2, (clientX - r.left) / s) + "px";
    gear.style.top = Math.max(2, (clientY - r.top) / s) + "px";
    gear.style.zIndex = String(++zTop);   // above the window just raised by the right-click
    gear.openMenu();
  }
  function buildGearMenu() {
    var btn = h("div", { class: "wa-np-tog wa-gear-btn", title: "Appearance — background, zoom, skin", html: GEAR_SVG });
    var menu = h("div", { class: "wa-skinsel-menu wa-gear-menu" });
    var wrap = h("div", { class: "wa-skinsel wa-gear" }, [btn, menu]);
    var current = "";

    // Background row: click cycles dark → black → off, shows the current mode
    var bgVal = h("span", { class: "wa-gear-val" });
    var bgRow = h("div", { class: "wa-gear-row wa-gear-click", title: "Page backdrop behind NeoAmp" }, [h("span", { class: "wa-gear-k", text: "Background" }), bgVal]);
    bgRow.addEventListener("click", function (e) { e.stopPropagation(); cycleBackdrop(); });
    var updateBg = function () { bgVal.textContent = bgMode.toUpperCase(); };
    els.gearBg = updateBg;

    // Zoom row: − / readout / + (companion to the - = \ keys)
    var zMinus = h("span", { class: "wa-gear-step", title: "Zoom out ( - )", text: "−" });
    var zPlus = h("span", { class: "wa-gear-step", title: "Zoom in ( = )", text: "+" });
    var zVal = h("span", { class: "wa-gear-val wa-gear-zval" });
    zMinus.addEventListener("click", function (e) { e.stopPropagation(); setUiScale(uiScale - 0.05); });
    zPlus.addEventListener("click", function (e) { e.stopPropagation(); setUiScale(uiScale + 0.05); });
    var zoomCtl = h("span", { class: "wa-gear-zoom" }, [zMinus, zVal, zPlus]);
    var zRow = h("div", { class: "wa-gear-row" }, [h("span", { class: "wa-gear-k", text: "Zoom" }), zoomCtl]);
    var updateZoom = function () { zVal.textContent = Math.round(uiScale * 100) + "%"; };
    els.gearZoom = updateZoom;

    function markActive() {
      [].forEach.call(menu.querySelectorAll(".wa-skinsel-item"), function (it) {
        it.classList.toggle("active", it.dataset && it.dataset.val === current);
      });
    }
    Object.defineProperty(wrap, "value", { get: function () { return current; }, set: function (v) { current = v; markActive(); } });
    wrap.populate = function () {
      menu.innerHTML = "";
      menu.appendChild(bgRow); updateBg();
      menu.appendChild(zRow); updateZoom();
      menu.appendChild(h("div", { class: "wa-gear-head", text: "Skin" }));
      CLASSIC_SKINS.forEach(function (s) {
        var it = h("div", { class: "wa-skinsel-item", text: s.name + (s.custom ? " ★" : "") });
        it.dataset.val = "wsz:" + s.id;
        it.addEventListener("click", function (e) { e.stopPropagation(); menu.classList.remove("open"); selectSkin("wsz:" + s.id); });
        menu.appendChild(it);
      });
      var load = h("div", { class: "wa-skinsel-item load", text: "＋ Load skin…" });
      load.addEventListener("click", function (e) { e.stopPropagation(); menu.classList.remove("open"); selectSkin("__load__"); });
      menu.appendChild(load);
      // keyboard-shortcut reference — the Z/X/C/V/B transport keys are otherwise hidden
      menu.appendChild(h("div", { class: "wa-gear-head", text: "Help" }));
      var keys = h("div", { class: "wa-skinsel-item wa-gear-sc", text: "⌨  Keyboard shortcuts" });
      keys.addEventListener("click", function (e) { e.stopPropagation(); menu.classList.remove("open"); showShortcuts(); });
      menu.appendChild(keys);
      markActive();
    };
    // open/close the menu programmatically (used by the right-click + logo triggers)
    wrap.openMenu = function () {
      skinSelectors.forEach(function (w) { var m = w.querySelector(".wa-skinsel-menu"); if (m) m.classList.remove("open"); });
      updateBg(); updateZoom(); menu.classList.add("open");
    };
    wrap.closeMenu = function () { menu.classList.remove("open"); };
    btn.addEventListener("mousedown", function (e) { e.stopPropagation(); });   // don't start a window drag
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      if (menu.classList.contains("open")) wrap.closeMenu(); else wrap.openMenu();
    });
    wrap.populate();
    skinSelectors.push(wrap);
    return wrap;
  }

  // Keyboard-shortcut reference, opened from the gear menu's Help section. A centered
  // overlay (unscaled, appended to <html> so it's readable regardless of UI zoom).
  // Toggles; closes on the ✕, a backdrop click, or Esc.
  var shortcutsEl = null;
  var SHORTCUTS = [
    ["⇧ V", "Close NeoAmp (open it from the gold N icon)"],
    ["Z", "Previous track"],
    ["X", "Play"],
    ["C", "Pause"],
    ["V", "Stop"],
    ["B", "Next track"],
    ["Space", "Play / pause"],
    ["← / →", "Seek −5s / +5s"],
    ["↑ / ↓", "Volume up / down"],
    ["L", "Library / search"],
    ["−  =  \\", "Zoom out / in / reset"],
    ["⌘ ⇧ E", "Start / stop EQ capture"],
    ["Right-click", "Skins, background, zoom & settings"],
  ];
  function scEsc(e) { if (e.key === "Escape") { e.stopPropagation(); closeShortcuts(); } }
  function closeShortcuts() {
    if (!shortcutsEl) return;
    document.removeEventListener("keydown", scEsc, true);
    shortcutsEl.remove(); shortcutsEl = null;
  }
  function showShortcuts() {
    if (shortcutsEl) { closeShortcuts(); return; }   // toggle off if already open
    var list = h("div", { class: "neoamp-sc-list" }, SHORTCUTS.map(function (r) {
      return h("div", { class: "neoamp-sc-row" }, [
        h("kbd", { class: "neoamp-sc-key", text: r[0] }),
        h("span", { class: "neoamp-sc-desc", text: r[1] }),
      ]);
    }));
    var close = h("button", { class: "neoamp-sc-x", title: "Close", "aria-label": "Close", text: "✕" });
    close.addEventListener("click", closeShortcuts);
    var panel = h("div", { class: "neoamp-sc", role: "dialog", "aria-label": "Keyboard shortcuts" }, [
      h("div", { class: "neoamp-sc-h" }, [h("span", { text: "Keyboard shortcuts" }), close]),
      list,
    ]);
    shortcutsEl = h("div", { class: "neoamp-sc-back" }, [panel]);
    shortcutsEl.addEventListener("click", function (e) { if (e.target === shortcutsEl) closeShortcuts(); });
    document.addEventListener("keydown", scEsc, true);
    document.documentElement.appendChild(shortcutsEl);
  }

  // ---- user-loaded .wsz skins (drag-drop / file picker), persisted -----------
  function bufToB64(buf) {
    var u = new Uint8Array(buf), s = "", CH = 0x8000;
    for (var i = 0; i < u.length; i += CH) s += String.fromCharCode.apply(null, u.subarray(i, i + CH));
    return btoa(s);
  }
  function b64ToBuf(b64) {
    var s = atob(b64), u = new Uint8Array(s.length);
    for (var i = 0; i < s.length; i++) u[i] = s.charCodeAt(i);
    return u.buffer;
  }
  // resolve a skin definition to a decoded skin: vendored file URL, or custom bytes
  function skinSourcePromise(def) {
    return def.b64
      ? window.NeoAmpClassic.loadSkinFromArrayBuffer(b64ToBuf(def.b64))
      : window.NeoAmpClassic.loadSkin(chrome.runtime.getURL(def.file));
  }
  function loadPersistedSkins(done) {
    NA.storage.get("neoampCustomSkins", function (list) {
      (list || []).forEach(function (s) {
        if (!CLASSIC_SKINS.some(function (x) { return x.id === s.id; })) {
          CLASSIC_SKINS.push({ id: s.id, name: s.name, b64: s.b64, custom: true });
        }
      });
      refreshSkinOptions();
      if (done) done();
    });
  }
  function persistCustomSkins() {
    var customs = CLASSIC_SKINS.filter(function (s) { return s.custom; })
      .map(function (s) { return { id: s.id, name: s.name, b64: s.b64 }; });
    NA.storage.set({ neoampCustomSkins: customs });
  }
  var skinFileInput = null;
  function openSkinPicker() {
    if (!skinFileInput) {
      skinFileInput = h("input", { type: "file", accept: ".wsz,.zip", style: "display:none" });
      skinFileInput.addEventListener("change", function () { loadSkinFile(skinFileInput.files[0]); skinFileInput.value = ""; });
      root.appendChild(skinFileInput);
    }
    skinFileInput.click();
  }
  // Validate + register + apply a dropped/picked .wsz file. Persists it so it
  // survives reloads and shows up in the picker (marked ★).
  function loadSkinFile(file) {
    if (!file) return;
    var name = file.name.replace(/\.(wsz|zip)$/i, "") || "Custom Skin";
    file.arrayBuffer().then(function (buf) {
      return window.NeoAmpClassic.loadSkinFromArrayBuffer(buf).then(function (skin) {
        if (!skin.sheets.MAIN) { NA.toast("Not a valid Winamp skin (no MAIN.BMP)"); return; }
        var id = "custom-" + (name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "skin");
        var b64 = bufToB64(buf);
        var existing = CLASSIC_SKINS.filter(function (s) { return s.id === id; })[0];
        if (existing) { existing.b64 = b64; existing.name = name; existing.custom = true; }
        else CLASSIC_SKINS.push({ id: id, name: name, b64: b64, custom: true });
        persistCustomSkins();
        refreshSkinOptions();
        enableClassic(id); activeSkinValue = "wsz:" + id;
        setSkinSelectors(activeSkinValue);
        NA.toast("Loaded skin: " + name);
      });
    }).catch(function (e) { NA.toast("Couldn't load skin: " + (e && e.message || e)); });
  }

  // =========================================================================
  // MAIN WINDOW
  // =========================================================================
  function buildMain() {
    // skin picker gadget in the titlebar (a second copy lives on the Now-Playing
    // panel for classic mode, where this window is hidden — see buildSkinSelect)
    var skinSel = buildSkinSelect();
    skinSel.value = DEFAULT_WSZ;

    var win = makeWindow("wa-main", "NeoAmp", { gadget: skinSel, onClose: function () { NA.stop(); } });
    // the ◢◤ logo doubles as the system-menu / settings opener (Winamp convention)
    var mainLogo = win.titlebar.querySelector(".wa-logo");
    if (mainLogo) {
      mainLogo.classList.add("wa-logo-hot"); mainLogo.title = "Options — skins, background, zoom & settings";
      mainLogo.addEventListener("mousedown", function (e) { e.stopPropagation(); });
      mainLogo.addEventListener("click", function (e) { e.stopPropagation(); openGearAt(els.gearWrap, e.clientX, e.clientY); });
    }

    // left column: clock + album art
    els.clock = h("div", { class: "wa-clock wa-lcd", text: "0:00" });
    var artImg = h("img", { alt: "" });
    artImg.addEventListener("error", function () { if (els.art) els.art.classList.add("empty"); });
    els.art = h("div", { class: "wa-art empty" }, [artImg]);
    els.artImg = artImg;
    var leftCol = h("div", {}, [els.clock, els.art]);

    // right column
    els.marquee = h("div", { class: "wa-marquee-track", text: "NeoAmp ◢◤ — start playback…" });
    var marqueeBox = h("div", { class: "wa-marquee wa-inset" }, [els.marquee]);

    els.analyzer = h("canvas", { class: "wa-analyzer", width: "260", height: "72" });
    var bitline = h("div", { class: "wa-bitline" }, [
      // kbps isn't exposed by YouTube Music → a dash placeholder (not a blank box,
      // which reads as broken). kHz is filled live from the capture's real rate.
      (els.kbps = h("span", { text: "— kbps", title: "Bitrate isn't exposed by YouTube Music" })),
      (els.khz = h("span", { text: "—— kHz" })),
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
    els.bal = h("input", { class: "wa-range wa-bal", type: "range", min: "-100", max: "100", value: "0", title: "Balance" });
    // numeric volume readout (the MUTE button itself lives in the universal NP strip so
    // it's visible on .wsz skins too, where this procedural main window is hidden).
    els.volNum = h("span", { class: "wa-vol-readout wa-lcd", text: "100", title: "Volume" });
    els.vol.addEventListener("input", function () { NA.control.setVolume(+els.vol.value / 100); paintRange(els.vol); syncVolUi(); });
    els.bal.addEventListener("input", function () { NA.control.setBalance(+els.bal.value / 100); paintRange(els.bal); });
    var vols = h("div", { class: "wa-vols" }, [els.vol, els.volNum, els.bal]);

    function tog(label, title, fn) {
      var t = h("div", { class: "wa-tog", title: title, text: label });
      t.addEventListener("click", function () { fn(t); });
      return t;
    }
    els.shuffleTog = tog("SHUF", "Shuffle", function (t) { transportToggleAt = Date.now(); t.classList.toggle("on"); NA.control.toggleShuffle(); });
    els.repeatTog = tog("REP", "Repeat", function (t) { transportToggleAt = Date.now(); t.classList.toggle("on"); NA.control.toggleRepeat(); });
    els.eqTog = tog("EQ", "Toggle equalizer", function (t) { toggleWin("wa-eq", t); });
    els.plTog = tog("PL", "Toggle playlist", function (t) { toggleWin("wa-pl", t); refreshQueue(true); });
    els.visTog = tog("VIS", "Toggle visualization", function (t) { toggleWin("wa-viz", t); });
    els.libTog = tog("LIB", "Library / search", function (t) { toggleLibrary(t); });
    var toggles = h("div", { class: "wa-toggles" }, [els.shuffleTog, els.repeatTog, els.eqTog, els.plTog, els.visTog, els.libTog]);

    var controls = h("div", { class: "wa-controls" }, [transport, vols, toggles]);

    win.body.appendChild(grid);
    win.body.appendChild(controls);

    // floating seek-position tooltip (appended to <body>, not #neoamp-root, so the
    // root's CSS transform/clip can't cut it off). Shows the target time while scrubbing.
    els.seekTip = h("div", { class: "wa-seek-tip" });
    document.body.appendChild(els.seekTip);
    function showSeekTip() {
      var t = trackDur * (+els.seek.value / 1000);
      els.seekTip.textContent = fmt(t);
      var r = els.seek.getBoundingClientRect();
      var pct = (+els.seek.value - +els.seek.min) / ((+els.seek.max - +els.seek.min) || 1);
      els.seekTip.style.left = Math.round(r.left + pct * r.width) + "px";
      els.seekTip.style.top = Math.round(r.top - 6) + "px";
      els.seekTip.classList.add("on");
    }
    // seek interactions
    els.seek.addEventListener("input", function () {
      seeking = true;
      var t = trackDur * (+els.seek.value / 1000);
      els.clock.textContent = fmt(t);
      paintRange(els.seek);
      showSeekTip();
    });
    els.seek.addEventListener("change", function () {
      NA.control.seek(trackDur * (+els.seek.value / 1000));
      seeking = false;
      els.seekTip.classList.remove("on");
    });

    // init volume + balance + slider fills
    els.vol.value = String(Math.round(NA.control.getVolume() * 100));
    if (NA.control.getEqState) els.bal.value = String(Math.round(NA.control.getEqState().balance * 100));
    [els.seek, els.vol, els.bal].forEach(paintRange);
    syncVolUi();
  }

  // keep the volume readout + mute lamp in sync with the live control state (the slider
  // auto-unmutes on raise, the keyboard can mute, etc. — one place reflects all of it).
  function syncVolUi() {
    if (els.volNum) els.volNum.textContent = String(Math.round((NA.control.getVolume ? NA.control.getVolume() : +els.vol.value / 100) * 100));
    if (els.mute && NA.control.isMuted) els.mute.classList.toggle("on", NA.control.isMuted());
  }

  // paint the filled portion of a native range track (it doesn't fill itself)
  function paintRange(input) {
    var min = +input.min, max = +input.max, v = +input.value;
    var pct = max > min ? ((v - min) / (max - min)) * 100 : 0;
    input.style.background =
      "linear-gradient(90deg, var(--wa-accent) " + pct + "%, transparent " + pct + "%), var(--wa-track-bg)";
  }

  // =========================================================================
  // CLASSIC SKIN (.wsz) — real Winamp Main window rendered by wsz.js, shown in
  // a chrome-less host window in place of the procedural #wa-main. Opt-in via
  // the skin picker; selecting a procedural skin switches back.
  // =========================================================================
  var classicWin = null, classicLoading = false, classicEqApi = null, classicSkin = null;
  function enableClassic(id) {
    if (!window.NeoAmpClassic) { NA.toast("Classic skin engine not loaded"); return; }
    var def = null;
    CLASSIC_SKINS.forEach(function (s) { if (s.id === id) def = s; });
    if (!def || classicLoading) return;

    // host window: no procedural chrome — the skin paints its own titlebar.
    if (!classicWin) {
      var el = h("div", { class: "wa-win wa-skinwin inactive", id: "wa-skin" });
      var drag = h("div", { class: "wa-skin-drag" });   // invisible titlebar grab strip
      el.appendChild(drag);
      // top-left LOGO hotspot → settings menu (the authentic Winamp "system menu" spot).
      // Sits above the drag strip; a hover outline gives modern users the affordance.
      var logoHot = h("div", { class: "wa-skin-logo-hot", title: "Options — skins, background, zoom & settings" });
      logoHot.addEventListener("mousedown", function (e) { e.stopPropagation(); });   // don't start a drag
      logoHot.addEventListener("click", function (e) { e.stopPropagation(); openGearAt(els.gearWrap, e.clientX, e.clientY); });
      el.appendChild(logoHot);
      el.addEventListener("mousedown", function () { raise(el); }, true);
      makeDraggable(el, drag);
      root.appendChild(el);
      classicWin = { el: el, body: el, titlebar: drag, drag: drag };
      wins["wa-skin"] = classicWin;
      var d = layout["wa-skin"] || { x: 40, y: 70 };
      el.style.left = (d.x || 40) + "px"; el.style.top = (d.y || 70) + "px";
    }
    ensureNowPlaying();
    classicWin.el.style.display = "";
    // NOTE: the Now-Playing panel is shown later (after its skin frame is applied) so
    // it doesn't flash black/unframed while the .wsz loads.
    raise(classicWin.el);
    // hide BOTH procedural windows the classic skin replaces: the main window
    // (#wa-main → #wa-skin) and the procedural equalizer (#wa-eq → #wa-eq-skin).
    // #wa-eq is shown by default, so on a fresh load it otherwise floats over the
    // Now-Playing panel in classic mode.
    if (wins["wa-main"]) wins["wa-main"].el.style.display = "none";
    if (wins["wa-eq"]) wins["wa-eq"].el.style.display = "none";
    NA.storage.set({ neoampSkin: "wsz:" + id });

    classicLoading = true;
    skinSourcePromise(def).then(function (skin) {
      classicLoading = false;
      classicSkin = skin;
      if (classicApi) classicApi.destroy();
      classicApi = window.NeoAmpClassic.mountMain(classicWin.el, skin, classicHooks());
      classicWin.drag.style.width = classicApi.dragRegion.w + "px";
      classicWin.drag.style.height = classicApi.dragRegion.h + "px";
      mountClassicEq(skin);
      applyFrame(skin);
      if (wins["wa-np"]) wins["wa-np"].el.style.display = "";   // show NP now it's framed (no black flash)
      dockClassicStack();
      var cur = NA.getTrack(); if (cur) pushClassicTrack(cur);
      classicApi.setVolume(NA.control.getVolume());
      classicApi.setToggles(isShown("wa-eq-skin"), isShown("wa-pl"));
      syncNpButtons();
    }).catch(function (e) {
      classicLoading = false;
      console.error("[NeoAmp] .wsz load failed:", e);
      NA.toast("Skin failed to load: " + (e && e.message || e));
      disableClassic();
    });
  }
  function disableClassic() {
    if (classicApi) { classicApi.destroy(); classicApi = null; }
    if (classicEqApi) { classicEqApi.destroy(); classicEqApi = null; }
    if (classicWin) classicWin.el.style.display = "none";
    if (wins["wa-np"]) wins["wa-np"].el.style.display = "none";
    if (wins["wa-eq-skin"]) wins["wa-eq-skin"].el.style.display = "none";
    if (wins["wa-main"]) wins["wa-main"].el.style.display = "";
    if (wins["wa-eq"] && els.eqTog) wins["wa-eq"].el.style.display = els.eqTog.classList.contains("on") ? "" : "none";
    removeFrame();
  }
  // Wrap the DOM windows (Playlist/Library/Viz) in a skin-matching frame: the
  // skin's GEN.BMP if present, else its PLEDIT.BMP (every skin ships PLEDIT, so
  // the frame always matches — no more gold fallback for GEN-less skins).
  // PLEDIT.TXT colors drive the playlist/library list text.
  // Parse "#rgb"/"#rrggbb"/"rgb(r,g,b)" → [r,g,b] (for the key-label contrast calc).
  function parseColor(c) {
    if (!c) return null;
    c = String(c).trim();
    if (c[0] === "#") {
      if (c.length === 4) c = "#" + c[1] + c[1] + c[2] + c[2] + c[3] + c[3];
      if (c.length < 7) return null;
      return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
    }
    var m = c.match(/rgba?\(([^)]+)\)/);
    if (m) { var p = m[1].split(",").map(function (x) { return parseInt(x, 10); }); return [p[0], p[1], p[2]]; }
    return null;
  }
  function mixWhite(rgb, t) { return rgb && [rgb[0] + (255 - rgb[0]) * t, rgb[1] + (255 - rgb[1]) * t, rgb[2] + (255 - rgb[2]) * t]; }

  var GEN_WINDOWS = ["wa-pl", "wa-lib", "wa-viz", "wa-np", "wa-lyrics"];
  var GEN_KEYS = { TL: "tl", GOLD: "gold", TR: "tr", LEND: "lend", CFILL: "cfill", REND: "rend", ML: "ml", MR: "mr", BL: "bl", BR: "br", BFILL: "bfill", CLOSE: "close" };
  var PLF_KEYS = { TL: "tl", TFILL: "tfill", TITLE: "title", TR: "tr", LEFT: "left", RIGHT: "right", BL: "bl", BR: "br", BFILL: "bfill", CLOSE: "close" };
  function applyFrame(skin) {
    removeFrame();
    var gen = window.NeoAmpClassic.genAssets(skin);
    if (gen) {
      Object.keys(GEN_KEYS).forEach(function (k) { root.style.setProperty("--gen-" + GEN_KEYS[k], "url(" + gen[k] + ")"); });
      GEN_WINDOWS.forEach(function (id) { if (wins[id]) wins[id].el.classList.add("wa-genskin"); });
    } else {
      var pf = window.NeoAmpClassic.pleditFrameAssets(skin);
      if (pf) {
        Object.keys(PLF_KEYS).forEach(function (k) { root.style.setProperty("--plf-" + PLF_KEYS[k], "url(" + pf[k] + ")"); });
        GEN_WINDOWS.forEach(function (id) { if (wins[id]) wins[id].el.classList.add("wa-plskin"); });
      }
    }
    // sample the skin's transport-button metal so the DOM keys (VIS/LIB/BG/zoom)
    // match the skin's REAL buttons (play/pause/…) rather than the playlist bg.
    var face = window.NeoAmpClassic.buttonFaceColor(skin);
    if (face) root.style.setProperty("--wa-btn-face", face);
    else root.style.removeProperty("--wa-btn-face");
    // match the skin's own indicator-LED colour (Sony red, etc.) for our VIS/LIB LEDs
    var led = window.NeoAmpClassic.ledColor(skin);
    if (led) root.style.setProperty("--wa-led-on", led);
    else root.style.removeProperty("--wa-led-on");
    var p = window.NeoAmpClassic.parsePledit(skin);
    if (p) {
      if (p.normal) root.style.setProperty("--pl-normal", p.normal);
      if (p.current) root.style.setProperty("--pl-current", p.current);
      if (p.normalbg) root.style.setProperty("--pl-normalbg", p.normalbg);
      if (p.selectedbg) root.style.setProperty("--pl-selectedbg", p.selectedbg);
    }
    // Contrast-safe LABEL colour, computed from the SAME thing the key face is now built
    // from — the skin's panel bg lifted ~50% toward white (matches the CSS --wa-key-base).
    // Near-black text on a light key / near-white on a dark key, so VIS/LIB/gear labels stay
    // readable on every skin. (Falls back to the sampled button metal if no panel colour.)
    var panelRgb = (p && parseColor(p.normalbg)) || parseColor(face) || null;
    var baseRgb = panelRgb ? mixWhite(panelRgb, 0.5) : null;
    if (baseRgb) {
      var L = (0.299 * baseRgb[0] + 0.587 * baseRgb[1] + 0.114 * baseRgb[2]) / 255;
      root.style.setProperty("--wa-key-fg", L > 0.62 ? "#15171d" : "#eef1f8");
    } else root.style.removeProperty("--wa-key-fg");
    // unify width with the 550px (275*2) skin stack (explicit on each framed
    // window so the gold titlebar always spans the full window width)
    root.style.setProperty("--wa-stack-w", "550px");
    if (wins["wa-lib"]) wins["wa-lib"].el.style.width = "550px";
    if (wins["wa-pl"]) wins["wa-pl"].el.style.width = "550px";
  }
  function removeFrame() {
    GEN_WINDOWS.forEach(function (id) { if (wins[id]) { wins[id].el.classList.remove("wa-genskin"); wins[id].el.classList.remove("wa-plskin"); } });
    var s = root.style;
    ["tl", "gold", "tr", "lend", "cfill", "rend", "ml", "mr", "bl", "br", "bfill", "close"].forEach(function (k) { s.removeProperty("--gen-" + k); });
    ["tl", "tfill", "title", "tr", "left", "right", "bl", "br", "bfill", "close"].forEach(function (k) { s.removeProperty("--plf-" + k); });
    ["normal", "current", "normalbg", "selectedbg"].forEach(function (k) { s.removeProperty("--pl-" + k); });
    s.removeProperty("--wa-btn-face");
    s.removeProperty("--wa-led-on");
    s.removeProperty("--wa-key-fg");
    s.removeProperty("--wa-stack-w");
    if (wins["wa-lib"]) wins["wa-lib"].el.style.width = "";
    if (wins["wa-pl"]) wins["wa-pl"].el.style.width = "";
  }
  // skinned EQ window (chrome-less host, like the main window). Hidden until the
  // EQ button is clicked. The procedural #wa-eq stays hidden in classic mode.
  // Curated EQ presets. (Researched: Winamp's stock curves are crude + clipping-prone,
  // so these keep the nostalgic names but use tasteful gains.) Order = low→high (60..16k).
  var EQ_PRESETS = [
    { name: "Flat", bands: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { name: "Bass Boost", bands: [5, 4, 2, 0, 0, 0, 0, 1, 1, 1] },
    { name: "Vocal / Clarity", bands: [0, -2, -3, -1, 0, 3, 3, 1, 0, 0] },
    { name: "Loudness (V-shape)", bands: [7, 4, 1, -2, -3, -2, 1, 4, 5, 6] },
    { name: "Rock", bands: [3, 2, 0, -1, 0, 2, 3, 3, 2, 2] },
    { name: "Pop", bands: [2, 1, 0, 0, 2, 3, 2, 2, 2, 2] },
    { name: "Electronic / Dance", bands: [5, 4, 1, -2, 1, 1, 3, 4, 4, 3] },
    { name: "Hip-Hop", bands: [5, 4, 2, -2, 1, 2, 1, 2, 2, 1] },
    { name: "Classical", bands: [1, 0, -1, 0, 1, 2, 2, 2, 2, 3] },
    { name: "Jazz", bands: [2, 2, 0, 0, 2, 1, 1, 2, 2, 2] },
    { name: "Headphones", bands: [5, 3, 1, 0, 0, 2, 2, 1, 0, -1] },
    { name: "Laptop Speakers", bands: [6, 4, 1, -1, 0, 1, 3, 5, 4, 2] },
    { name: "Podcast / Voice", bands: [-3, 1, 1, 2, 2, 3, 2, 0, 0, -1] },
  ];
  // apply a preset everywhere at once: live audio (relayed), the classic EQ faders,
  // the procedural sliders + curve, and persistence — and turn the EQ on.
  function applyEqPreset(p) {
    NA.control.setEq(p.bands, 0, true);
    if (classicEqApi && classicEqApi.setEq) classicEqApi.setEq(p.bands, 0, true);
    if (els.eqSliders) {
      els.eqSliders.forEach(function (sl, i) { sl.value = String(i === 0 ? 0 : (p.bands[i - 1] || 0)); });
      drawEqCurve();
    }
  }
  // dropdown off the classic EQ window's PRESETS button (toggle on repeat click)
  function showEqPresetsMenu(w) {
    var open = w.el.querySelector(".wa-eqpre-menu");
    if (open) { open.remove(); return; }
    var menu = h("div", { class: "wa-eqpre-menu" });
    menu.style.cssText = "position:absolute; top:62px; right:12px; z-index:10; background:#10142e; border:1px solid #d8b863; border-radius:3px; padding:3px; max-height:200px; overflow:auto; box-shadow:0 4px 14px rgba(0,0,0,.6); font:11px/1.5 'Arial Narrow','Helvetica Neue',Arial,sans-serif;";
    EQ_PRESETS.forEach(function (p) {
      var it = h("div", { text: p.name });
      it.style.cssText = "padding:2px 12px; color:#f0d182; cursor:pointer; white-space:nowrap; border-radius:2px;";
      it.addEventListener("mouseenter", function () { it.style.background = "#2a2f55"; it.style.color = "#fff7dc"; });
      it.addEventListener("mouseleave", function () { it.style.background = ""; it.style.color = "#f0d182"; });
      it.addEventListener("mousedown", function (e) { e.stopPropagation(); });
      it.addEventListener("click", function (e) { e.stopPropagation(); applyEqPreset(p); menu.remove(); });
      menu.appendChild(it);
    });
    w.el.appendChild(menu);
    setTimeout(function () {
      var close = function (ev) { if (!menu.contains(ev.target)) { menu.remove(); document.removeEventListener("mousedown", close, true); } };
      document.addEventListener("mousedown", close, true);
    }, 0);
  }

  function mountClassicEq(skin) {
    var w = wins["wa-eq-skin"];
    if (!w) {
      var el = h("div", { class: "wa-win wa-skinwin inactive", id: "wa-eq-skin" });
      var drag = h("div", { class: "wa-skin-drag" });
      el.appendChild(drag);
      el.addEventListener("mousedown", function () { raise(el); }, true);
      makeDraggable(el, drag);
      el.style.display = "none";
      root.appendChild(el);
      w = wins["wa-eq-skin"] = { el: el, body: el, titlebar: drag, drag: drag };
      // position is set by dockClassicStack() (flush below the Now-Playing panel)
    }
    if (classicEqApi) classicEqApi.destroy();
    classicEqApi = window.NeoAmpClassic.mountEq(w.el, skin, {
      initial: NA.control.getEqState ? NA.control.getEqState() : null,
      onBand: function (i, db) { NA.control.setEqBand(i, db); },
      onPreamp: function (db) { NA.control.setPreamp(db); },
      onEnabled: function (on) { NA.control.setEqEnabled(on); },
      onPresets: function () { showEqPresetsMenu(w); },
      onClose: function () {
        w.el.style.display = "none"; classicApi && classicApi.setToggles(false, isShown("wa-pl"));
      },
    });
    w.drag.style.width = classicEqApi.dragRegion.w + "px";
    w.drag.style.height = classicEqApi.dragRegion.h + "px";
  }
  // "Now Playing" panel — our own info window (Winamp 2 has no art region),
  // docked between Main and EQ, skin-width, with album art + track details.
  // --- backdrop: dim the busy YTM page behind NeoAmp so the player reads cleaner ---
  var BG_MODES = ["dark", "black", "off"];   // default dark; cycle dark → black → off
  var bgMode = "dark";
  function applyBackdrop() {
    var bd = document.getElementById("neoamp-backdrop");
    if (bd) {
      bd.style.background = bgMode === "black" ? "rgba(0,0,0,0.92)" : bgMode === "dark" ? "rgba(0,0,0,0.55)" : "transparent";
      bd.style.display = bgMode === "off" ? "none" : "";
    }
    if (els.gearBg) els.gearBg();   // refresh the gear menu's Background readout
  }
  function ensureBackdrop() {
    if (!root || document.getElementById("neoamp-backdrop")) return;
    var bd = h("div", { id: "neoamp-backdrop" });
    // full-viewport scrim on documentElement (NOT root) so it covers the TRUE
    // viewport even when root is CSS-scaled by uiScale. z sits just under root
    // (root is 2147483600) so it's above the YTM page but below every window.
    // pointer-events:none so it never blocks clicks to YTM or the player.
    bd.style.cssText = "position:fixed; inset:0; z-index:2147483599; pointer-events:none; transition:background .2s ease;";
    document.documentElement.appendChild(bd);
    applyBackdrop();
  }
  function cycleBackdrop() {
    bgMode = BG_MODES[(BG_MODES.indexOf(bgMode) + 1) % BG_MODES.length];
    applyBackdrop();
    NA.storage.set({ neoampBg: bgMode });
  }

  function ensureNowPlaying() {
    if (wins["wa-np"]) return;
    var img = h("img", { class: "wa-np-art", alt: "" });
    // Title is a marquee: a clipping box (.wa-np-title) with an inner track (span) that
    // scrolls when the name overflows — the Winamp way (long titles scroll, never clip).
    els.npTitleTrack = h("span", { class: "wa-np-title-t", text: "—" });
    els.npTitle = h("div", { class: "wa-np-title" }, [els.npTitleTrack]);
    var info = h("div", { class: "wa-np-info" }, [
      els.npTitle,
      (els.npArtist = h("div", { class: "wa-np-artist", text: "" })),
      (els.npAlbum = h("div", { class: "wa-np-album", text: "" })),
    ]);
    // VIS/LIB toggles live here because Winamp's main window has no such buttons
    function npBtn(label, title, id, after) {
      // small beveled button styled like the main window's EQ/PL toggles + an LED
      var b = h("div", { class: "wa-np-tog", title: title, text: label });
      b.addEventListener("mousedown", function (e) { e.stopPropagation(); }); // don't start a drag
      b.addEventListener("click", function (e) {
        e.stopPropagation();
        if (id === "wa-lib") { toggleLibrary(b); if (classicApi) dockClassicStack(); return; }   // library OR site-search
        toggleWin(id);
        b.classList.toggle("on", isShown(id));
        if (classicApi) dockClassicStack();   // re-dock LIB into the stack (no-op for VIS)
        if (after) after();
      });
      els["np" + label] = b;
      return b;
    }
    // like / dislike the current track (the main window has no such control).
    // Crisp inline-SVG icons (heart / thumbs-down) so they stay sharp + monochrome.
    var HEART_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>';
    var THUMBDOWN_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path transform="rotate(180 12 12)" d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/></svg>';
    function rateBtn(svg, title, kind) {
      var b = h("div", { class: "wa-np-tog wa-rate-btn " + (kind === "dislike" ? "wa-dislike" : "wa-like"), title: title, html: svg });
      b.addEventListener("mousedown", function (e) { e.stopPropagation(); });
      b.addEventListener("click", function (e) { e.stopPropagation(); if (NA.control[kind]) NA.control[kind](); });
      els[kind === "dislike" ? "npDislike" : "npLike"] = b;
      return b;
    }
    var rate = h("div", { class: "wa-np-rate" }, [
      rateBtn(HEART_SVG, "Like this track", "like"),
      rateBtn(THUMBDOWN_SVG, "Dislike this track", "dislike"),
    ]);
    // MUTE — universal (the procedural main window is hidden on .wsz skins, so the
    // canonical mute lives here). One SVG carries both states; CSS swaps wave↔✕ via .on.
    var SPEAKER_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true">' +
      '<path d="M3 9v6h4l5 5V4L7 9H3z"/>' +
      '<path class="wa-spk-wave" d="M15.5 8.6a5 5 0 010 6.8" fill="none" stroke="currentColor" stroke-width="2"/>' +
      '<path class="wa-spk-x" d="M16 9.5l5 5m0-5l-5 5" fill="none" stroke="currentColor" stroke-width="2"/></svg>';
    els.mute = h("div", { class: "wa-np-tog wa-np-mute", title: "Mute (M)", html: SPEAKER_SVG });
    els.mute.addEventListener("mousedown", function (e) { e.stopPropagation(); });
    els.mute.addEventListener("click", function (e) { e.stopPropagation(); if (NA.control.setMute) els.mute.classList.toggle("on", NA.control.setMute()); });
    if (NA.control.isMuted && NA.control.isMuted()) els.mute.classList.add("on");
    // Decluttered: the strip keeps only the often-used controls (like/dislike + the
    // VIS/LIB window toggles). The set-once appearance controls — Background, Zoom and
    // Skin — moved behind the ⚙ gear menu so the now-playing bar reads cleanly.
    var toggles = h("div", { class: "wa-np-toggles" }, [
      npBtn("VIS", "Show/hide the visualization window", "wa-viz"),
      npBtn("LIB", "Show/hide the library / search window", "wa-lib", function () { if (isShown("wa-lib")) libBecameVisible(); }),
      npBtn("LYR", "Show/hide the lyrics window", "wa-lyrics", maybeLoadLyrics),
    ]);
    // Settings menu (Background/Zoom/Skin/Shortcuts) is no longer a gear button cluttering
    // the strip — it opens on RIGHT-CLICK of the now-playing bar (and via the skin's logo,
    // wired in the main window), the authentic Winamp pattern. The gear wrap is kept as the
    // menu host (its button hidden via .wa-gear-ctx) so all its populate/positioning works.
    var gear = buildGearMenu();
    gear.classList.add("wa-gear-ctx");
    els.gearWrap = gear;   // the skin logo + the global right-click both open this menu
    root.appendChild(gear); // ROOT-level host so the menu can pop at the cursor over ANY window
    applyBackdrop(); // sync the gear's Background row to the current/persisted mode
    // ONE clean row now that the title scrolls + settings moved to right-click:
    // [♥ 👎]  [🔊]  ❲VIS|LIB|LYR❳
    var btns = h("div", { class: "wa-np-btns" }, [rate, els.mute, toggles]);
    var el = h("div", { class: "wa-win wa-np inactive empty", id: "wa-np" }, [img, info, btns]);
    // Created hidden: the skin frame (--pl-* colors + GEN/PLEDIT sprites) is applied
    // async after the .wsz parses. Showing it before that flashes the dark, unframed
    // fallback background (the "shaded on first load" look). enableClassic() reveals it
    // only after applyFrame() runs.
    el.style.display = "none";
    img.addEventListener("error", function () { el.classList.add("empty"); img.removeAttribute("src"); });
    el.addEventListener("mousedown", function () { raise(el); }, true);
    makeDraggable(el, el);
    root.appendChild(el);
    wins["wa-np"] = { el: el, body: el, titlebar: el, img: img };
    applyCapabilities();   // buttons now exist — hide controls the active provider lacks
  }
  // Dock the classic stack flush, top to bottom: Main → Now-Playing → EQ →
  // Playlist → Library (each shown one sits directly under the previous one).
  function dockClassicStack() {
    var m = classicWin && classicWin.el; if (!m) return;
    var prev = m;
    ["wa-np", "wa-eq-skin", "wa-pl", "wa-lib"].forEach(function (id) {
      var w = wins[id]; if (!w || w.el.style.display === "none") return;
      w.el.style.left = prev.offsetLeft + "px";
      w.el.style.top = (prev.offsetTop + prev.offsetHeight) + "px";
      prev = w.el;
    });
  }
  // Reflect EVERY window's open/closed state onto ALL its toggle buttons — both the
  // NP-strip keys (VIS/LIB/LYR) and the procedural main keys (EQ/PL/VIS/LIB). Closing a
  // window by its own ✕ (hideWin) or any toggle path calls this, so the keys never get
  // stuck lit (the bug: hideWin only cleared the procedural keys, not the NP-strip ones).
  function syncNpButtons() {
    if (els.npVIS) els.npVIS.classList.toggle("on", isShown("wa-viz"));
    if (els.npLIB) els.npLIB.classList.toggle("on", isShown("wa-lib"));
    if (els.npLYR) els.npLYR.classList.toggle("on", isShown("wa-lyrics"));
    if (els.visTog) els.visTog.classList.toggle("on", isShown("wa-viz"));
    if (els.libTog) els.libTog.classList.toggle("on", isShown("wa-lib"));
    if (els.eqTog) els.eqTog.classList.toggle("on", isShown("wa-eq") || isShown("wa-eq-skin"));
    if (els.plTog) els.plTog.classList.toggle("on", isShown("wa-pl"));
  }
  function pushNowPlaying(t) {
    var w = wins["wa-np"]; if (!w) return;
    var hasArt = !!(t.art && /^https?:\/\//.test(t.art));
    if (hasArt) { if (w.img.src !== t.art) w.img.src = t.art; }
    else w.img.removeAttribute("src");
    w.el.classList.toggle("empty", !hasArt);
    if (els.npTitleTrack) runMarquee(els.npTitleTrack, t.title || "—");   // scroll long titles, Winamp-style
    if (els.npArtist) els.npArtist.textContent = t.artist || "";
    // album + year on one line (filtered so it's never a stray " • " when absent)
    if (els.npAlbum) els.npAlbum.textContent = [t.album, t.year].filter(Boolean).join("  •  ");
    if (els.npLike) els.npLike.classList.toggle("on", t.likeStatus === "LIKE");
    if (els.npDislike) els.npDislike.classList.toggle("on", t.likeStatus === "DISLIKE");
  }
  function isShown(id) { return wins[id] && wins[id].el.style.display !== "none"; }
  function classicHooks() {
    return {
      onPrev: function () { NA.control.prev(); },
      onPlay: function () { NA.control.playPause(); },
      onPause: function () { NA.control.playPause(); },
      onStop: function () { NA.control.stop(); },
      onNext: function () { NA.control.next(); },
      onEject: function () { focusYtSearch(); },
      onSeek: function (t) { NA.control.seek(t); },
      onVolume: function (v) { NA.control.setVolume(v); if (els.vol) { els.vol.value = String(Math.round(v * 100)); paintRange(els.vol); } syncVolUi(); },
      balance: NA.control.getEqState ? NA.control.getEqState().balance : 0,
      onBalance: function (x) { NA.control.setBalance(x); if (els.bal) { els.bal.value = String(Math.round(x * 100)); paintRange(els.bal); } },
      onShuffle: function () { transportToggleAt = Date.now(); NA.control.toggleShuffle(); },
      onRepeat: function () { transportToggleAt = Date.now(); NA.control.toggleRepeat(); },
      onToggleEq: function () { toggleWin("wa-eq-skin"); dockClassicStack(); classicApi && classicApi.setToggles(isShown("wa-eq-skin"), isShown("wa-pl")); },
      onTogglePl: function () { toggleWin("wa-pl", els.plTog); refreshQueue(true); dockClassicStack(); classicApi && classicApi.setToggles(isShown("wa-eq-skin"), isShown("wa-pl")); },
      onToggleViz: function () { toggleWin("wa-viz", els.visTog); },
      onClose: function () { NA.stop(); },
    };
  }
  // feed live track state into the rendered main window
  function pushClassicTrack(t) {
    pushNowPlaying(t);
    if (!classicApi) return;
    var patch = {
      elapsed: t.currentTime || 0,
      duration: t.duration || 0,
      title: t.title ? (t.title + (t.artist ? " - " + t.artist : "")) : "NeoAmp",
      stopped: !t.title,
      paused: !!t.paused,
      playing: !t.paused && !!t.title,
      // skinned-skin info boxes: real kHz number, dashed kbps (YTM doesn't expose it)
      khz: t.sampleRate ? String(Math.round(t.sampleRate / 1000)) : "",
      kbps: "--",
    };
    // only set the toggles when YTM's state is actually known (null → keep the
    // optimistic value rather than overwriting it with undefined/false), and not
    // while a just-fired toggle is still settling (don't revert the optimistic flip)
    if (!transportSettling()) {
      if (t.shuffle != null) patch.shuffle = !!t.shuffle;
      if (t.repeat != null) patch.repeat = !!t.repeat;
    }
    if (t.volume != null) patch.volume = t.volume;
    classicApi.update(patch);
  }

  // =========================================================================
  // EQUALIZER WINDOW (cosmetic — sliders move but don't filter audio yet)
  // =========================================================================
  function buildEq() {
    var win = makeWindow("wa-eq", "Equalizer", { onClose: function () { hideWin("wa-eq"); } });
    var es = NA.control.getEqState ? NA.control.getEqState() : { enabled: true, preamp: 0, bands: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] };
    var curve = h("canvas", { class: "wa-eq-curve wa-inset", width: "300", height: "56" });
    var onTog = h("div", { class: "wa-tog" + (es.enabled ? " on" : ""), text: "ON" });
    var autoTog = h("div", { class: "wa-tog", text: "AUTO" });
    onTog.addEventListener("click", function () { onTog.classList.toggle("on"); NA.control.setEqEnabled(onTog.classList.contains("on")); });
    autoTog.addEventListener("click", function () { autoTog.classList.toggle("on"); }); // AUTO (auto-preamp) stays cosmetic
    var top = h("div", { class: "wa-eq-top" }, [onTog, autoTog, curve]);

    var labels = ["PRE", "60", "170", "310", "600", "1K", "3K", "6K", "12K", "14K", "16K"];
    var bands = h("div", { class: "wa-eq-bands" });
    els.eqSliders = [];
    labels.forEach(function (lab, idx) {
      var initVal = idx === 0 ? es.preamp : (es.bands[idx - 1] || 0); // idx 0 = preamp, 1..10 = bands
      var sl = h("input", { class: "wa-vrange", type: "range", min: "-12", max: "12", value: String(initVal) });
      sl.addEventListener("input", function () {
        var v = +sl.value;
        if (idx === 0) NA.control.setPreamp(v); else NA.control.setEqBand(idx - 1, v);
        drawEqCurve();
      });
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
    // crisp fullscreen icon (4 corner brackets) instead of the flaky ⛶ glyph
    var FS_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3h7v2.4H5.4V10H3V3zm11 0h7v7h-2.4V5.4H14V3zM5.4 14H3v7h7v-2.4H5.4V14zm13.2 0H21v7h-7v-2.4h4.6V14z"/></svg>';
    var win = makeWindow("wa-viz", "Visualization", {
      shade: false,
      titleButtons: [{ html: FS_SVG, cls: "wa-fsbtn", title: "Fullscreen (Esc to exit)", onClick: toggleVizFullscreen }],
      onClose: function () { hideWin("wa-viz"); },
    });
    vizFrame = h("iframe", { class: "wa-viz-frame", src: chrome.runtime.getURL("viz.html"), frameborder: "0", allowtransparency: "false", title: "NeoAmp visualizer" });
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
  // PLAYLIST WINDOW (mirrors YTM's "Up Next" queue)
  // =========================================================================
  function buildPlaylist() {
    var win = makeWindow("wa-pl", "Playlist", { onClose: function () { hideWin("wa-pl"); } });
    var list = h("div", { class: "wa-pl-list" });
    // No footer buttons. The playlist is a read-only mirror of YTM's queue: it auto-
    // refreshes when the queue changes, search lives in the Library window, and queue
    // management (add/remove/reorder) stays in YouTube Music itself — driving YTM's
    // queue DOM proved too fragile (it's often not even rendered until "Up Next" is
    // open). The footer just shows the item count + total time.
    els.plCount = h("div", { class: "wa-pl-count", text: "0 items" });
    els.plTime = h("div", { class: "wa-pl-time wa-lcd", text: "0:00 / 0:00" });
    var foot = h("div", { class: "wa-pl-foot" }, [els.plCount, els.plTime]);

    win.body.appendChild(list);
    win.body.appendChild(foot);
    els.plList = list;

    var rs = h("div", { class: "wa-resize wa-resize-v", title: "Resize height" });
    win.el.appendChild(rs);
    makeResizable(win.el, rs, 240, 140, true); // height-only: width is locked to the stack
    refreshQueue(true);
  }

  // Rebuild the row list only when the queue actually changed (signature check),
  // so the 400ms track tick + the slow poll don't thrash the DOM / scroll.
  var plSig = "";
  function refreshQueue(force, _noOpen) {
    if (!els.plList) return;
    var q = NA.getQueue ? NA.getQueue() : [];
    // explicit open → ask the site to open its own queue panel if it's closed (Spotify
    // renders queue rows only when it's open), then re-read once to refresh the mirror.
    // ensureQueueOpen self-gates on rows-present, so this is a no-op when already open;
    // the _noOpen guard prevents a re-open loop. (The cached last-known queue keeps the
    // list visible in between, so it never blanks when the panel is closed.)
    if (force && !_noOpen && NA.control.ensureQueueOpen && NA.control.ensureQueueOpen()) {
      setTimeout(function () { refreshQueue(true, true); }, 700);
    }
    var sig = q.map(function (x) { return (x.playing ? "*" : "") + (x.art ? "a" : "") + x.title; }).join("|");
    if (!force && sig === plSig) return;
    plSig = sig;
    els.plList.innerHTML = "";
    if (!q.length) {
      var caps = (NA.control.getCapabilities && NA.control.getCapabilities()) || {};
      els.plList.appendChild(h("div", { class: "wa-pl-empty", text: caps.queue === false
        ? "Live queue mirroring isn't available on this site — use its own queue. NeoAmp still gives you the EQ + visualizer."
        : "Queue empty — play a track or open Up Next in YouTube Music." }));
    } else {
      q.forEach(function (item) {
        var thumb = makeThumb("wa-pl-thumb", item.art);
        var row = h("div", { class: "wa-pl-row" + (item.playing ? " playing" : "") }, [
          h("span", { class: "wa-pl-n", text: (item.index + 1) + "." }),
          thumb,
          h("span", { class: "wa-pl-t", text: item.title + (item.artist ? " - " + item.artist : "") }),
          item.plays ? h("span", { class: "wa-pl-plays", text: item.plays }) : null,
          h("span", { class: "wa-pl-d", text: item.duration || "" }),
        ]);
        row.title = "Double-click to play";
        row.addEventListener("dblclick", function () {
          NA.control.playQueueItem(item.index);
          setTimeout(function () { refreshQueue(true); }, 450);
        });
        els.plList.appendChild(row);
        if (item.playing) requestAnimationFrame(function () { row.scrollIntoView({ block: "nearest" }); });
      });
    }
    if (els.plCount) els.plCount.textContent = q.length + (q.length === 1 ? " item" : " items");
  }

  // =========================================================================
  // MEDIA LIBRARY WINDOW (search YTM → sectioned results → play)
  // =========================================================================
  function buildLibrary() {
    var win = makeWindow("wa-lib", "Media Library", { onClose: function () { hideWin("wa-lib"); } });
    var input = h("input", { class: "wa-lib-input", type: "text", placeholder: "Search songs, artists, albums…" });
    var go = h("button", { class: "wa-lib-go", text: "GO" });
    var home = h("button", { class: "wa-lib-go wa-lib-home", title: "Quick Picks & Listen Again", text: "HOME" });
    var list = h("div", { class: "wa-lib-list" });
    var status = h("div", { class: "wa-lib-status", text: "Search, or HOME for Quick Picks & Listen Again." });
    home.addEventListener("click", function () { loadHome(true); });
    win.body.appendChild(h("div", { class: "wa-lib-bar" }, [input, go, home]));
    win.body.appendChild(list);
    win.body.appendChild(status);
    els.libInput = input; els.libList = list; els.libStatus = status;

    var run = function () {
      var qy = input.value.trim();
      if (!qy) return;
      status.textContent = "Searching “" + qy + "” …";
      list.innerHTML = "";
      NA.search(qy, renderResults);
    };
    go.addEventListener("click", run);
    // keep keystrokes inside the field (don't let page/global handlers grab them)
    input.addEventListener("keydown", function (e) { e.stopPropagation(); if (e.key === "Enter") run(); });
    input.addEventListener("keyup", function (e) { e.stopPropagation(); });

    var rs = h("div", { class: "wa-resize", title: "Resize" });
    win.el.appendChild(rs);
    makeResizable(win.el, rs, 260, 180);
  }

  // =========================================================================
  // LYRICS WINDOW — scrolling lyrics for the current track (scraped from the
  // provider's own lyrics pane; empty-state when none are available). Free-
  // floating like the viz window (not in the docked 550px stack).
  // =========================================================================
  var lastLyrics;   // latest lyrics object so opening the window mid-track fills it
  // Ask the provider to open its OWN lyrics pane (lyrics are lazy — they only load into the
  // DOM after the user opens the provider's Lyrics tab/view). Self-gating + only while the
  // NeoAmp lyrics window is open, so it never hijacks the provider's UI unprompted.
  function maybeLoadLyrics() { if (isShown("wa-lyrics") && NA.control.ensureLyrics) NA.control.ensureLyrics(); }
  function buildLyrics() {
    var win = makeWindow("wa-lyrics", "Lyrics", { onClose: function () { hideWin("wa-lyrics"); } });
    els.lyricsList = h("div", { class: "wa-lyrics-list wa-inset" });
    els.lyricsStatus = h("div", { class: "wa-lyrics-status", text: "" });
    win.body.appendChild(els.lyricsList);
    win.body.appendChild(els.lyricsStatus);
    var rs = h("div", { class: "wa-resize", title: "Resize" });
    win.el.appendChild(rs);
    makeResizable(win.el, rs, 200, 160);
    renderLyrics(lastLyrics);
  }
  // lyr: { lines:[str], source?:str, isTimeSynced?:bool, activeLine?:int } | null | undefined.
  // undefined = not fetched yet (hint to open the provider's pane); null/empty = none.
  function renderLyrics(lyr) {
    var list = els.lyricsList; if (!list) return;
    var lines = lyr && lyr.lines && lyr.lines.length ? lyr.lines : null;
    list.innerHTML = "";
    if (!lines) {
      list.classList.add("empty");
      list.appendChild(h("div", { class: "wa-lyrics-empty", text: (lyr === undefined)
        ? "♪  Loading lyrics…"
        : "No lyrics available for this track." }));
      els.lyricsStatus.textContent = "";
      return;
    }
    list.classList.remove("empty");
    lines.forEach(function (ln, i) {
      var row = h("div", { class: "wa-lyrics-line", text: ln || " " });
      if (lyr.isTimeSynced && i === lyr.activeLine) row.classList.add("active");
      list.appendChild(row);
    });
    els.lyricsStatus.textContent = lyr.source ? ("source: " + lyr.source) : "";
    // keep the current (synced) line in view
    if (lyr.isTimeSynced && lyr.activeLine != null) {
      var act = list.children[lyr.activeLine];
      if (act && act.scrollIntoView) act.scrollIntoView({ block: "center" });
    }
  }

  function renderResults(res) {
    var list = els.libList;
    if (!list) return;
    list.innerHTML = "";
    if (!res || res.error) { els.libStatus.textContent = res && res.error ? "Search failed: " + res.error : "No response."; return; }
    var items = res.results || [];
    if (!items.length) { els.libStatus.textContent = "No results for “" + res.query + "”."; return; }
    var lastSection = null;
    items.forEach(function (it) {
      if (it.section !== lastSection) {
        lastSection = it.section;
        list.appendChild(h("div", { class: "wa-lib-sec", text: it.section }));
      }
      var thumb = makeThumb("wa-lib-thumb", it.art);
      var isColl = it.kind === "playlist" || it.kind === "album";
      var sub = it.subtitle || "";
      if (it.plays && sub.indexOf(it.plays) < 0) sub += (sub ? "  •  " : "") + it.plays;   // append play count
      var title = h("div", { class: "wa-lib-t" }, [
        isColl ? h("span", { class: "wa-lib-badge", text: it.kind === "album" ? "ALB" : "PL" }) : null,
        h("span", { text: it.title }),
      ]);
      var row = h("div", { class: "wa-lib-row" + (it.rowIndex < 0 ? " top" : "") + (isColl ? " is-collection" : "") }, [
        thumb,
        h("div", { class: "wa-lib-meta" }, [title, h("div", { class: "wa-lib-s", text: sub })]),
      ]);
      if (isColl) {
        // single-click OPENS the playlist/album page; double-click PLAYS it.
        // Debounce the click so a double-click doesn't also fire the open.
        row.title = "Click to open · Double-click to play";
        var clickT = null;
        row.addEventListener("click", function () {
          if (clickT) return;
          clickT = setTimeout(function () { clickT = null; NA.control.openLibraryItem(it.rowIndex); }, 250);
        });
        row.addEventListener("dblclick", function () {
          if (clickT) { clearTimeout(clickT); clickT = null; }
          NA.control.playLibraryItem(it.rowIndex);
          setTimeout(function () { refreshQueue(true); }, 700);
        });
      } else {
        row.title = "Double-click to play";
        row.addEventListener("dblclick", function () {
          NA.control.playLibraryItem(it.rowIndex);
          setTimeout(function () { refreshQueue(true); }, 700);
        });
      }
      list.appendChild(row);
    });
    els.libStatus.textContent = items.length + " results for “" + res.query + "”.";
  }

  // Library "home" view (shown when the search box is empty / nothing playing):
  // the "Quick Picks" and "Listen Again" shelves scraped from YTM's home feed.
  function renderHome(res) {
    var list = els.libList; if (!list) return;
    list.innerHTML = "";
    var items = (res && res.results) || [];
    if (!items.length) {
      els.libStatus.textContent = "Open YouTube Music's home to load Quick Picks & Listen Again.";
      return;
    }
    var lastSection = null;
    items.forEach(function (it) {
      if (it.section !== lastSection) {
        lastSection = it.section;
        list.appendChild(h("div", { class: "wa-lib-sec", text: it.section }));
      }
      var row = h("div", { class: "wa-lib-row" }, [
        makeThumb("wa-lib-thumb", it.art),
        h("div", { class: "wa-lib-meta" }, [
          h("div", { class: "wa-lib-t" }, [h("span", { text: it.title })]),
          h("div", { class: "wa-lib-s", text: it.subtitle || "" }),
        ]),
      ]);
      row.title = "Double-click to play";
      var idx = it.homeIndex;
      row.addEventListener("dblclick", function () {
        NA.control.playHomeItem(idx);
        setTimeout(function () { refreshQueue(true); }, 700);
      });
      list.appendChild(row);
    });
    els.libStatus.textContent = "Home — Quick Picks & Listen Again (double-click to play).";
  }
  // navigate=true lets content.js SPA-jump YTM to its home feed if no shelves are
  // currently loaded (explicit HOME button only); the idle auto-load passes false
  // so merely opening the Library never yanks the user off their page.
  function loadHome(navigate) {
    if (!els.libList) return;
    els.libStatus.textContent = "Loading Quick Picks & Listen Again…";
    NA.getHomeShelves(renderHome, navigate);
  }
  // when the Library is revealed: focus the box, and auto-show the home shelves
  // if it's idle (empty query + nothing playing + nothing listed yet) — without
  // navigating (only scrapes shelves already on the page).
  function libBecameVisible() {
    if (els.libInput) els.libInput.focus();
    var t = NA.getTrack && NA.getTrack();
    if (els.libInput && !els.libInput.value.trim() && (!t || !t.title) && els.libList && !els.libList.childElementCount) {
      loadHome(false);
    }
  }

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
  // reflect YTM's ACTUAL transport state on the procedural toggles + volume
  // slider. null = unknown → leave the current value (never clobber with a guess);
  // skip the volume slider while the user is dragging it (don't fight the drag).
  // a user just toggled SHUF/REP optimistically; suppress reconciliation briefly so
  // the periodic tick can't revert it before YTM's DOM reflects the new state
  var transportToggleAt = 0;
  function transportSettling() { return (Date.now() - transportToggleAt) < 600; }
  function syncTransport(t) {
    if (!transportSettling()) {
      if (t.shuffle != null && els.shuffleTog) els.shuffleTog.classList.toggle("on", !!t.shuffle);
      if (t.repeat != null && els.repeatTog) els.repeatTog.classList.toggle("on", !!t.repeat);
    }
    if (els.vol && t.volume != null && document.activeElement !== els.vol) {
      var vv = String(Math.round(t.volume * 100));
      if (els.vol.value !== vv) { els.vol.value = vv; paintRange(els.vol); }
    }
    syncVolUi();
  }

  function onTrack(t) {
    if (classicApi) pushClassicTrack(t);   // classic skin mirrors the same state
    syncTransport(t);
    if (els.clock && !seeking) els.clock.textContent = fmt(t.currentTime);
    if (els.playBtn) els.playBtn.innerHTML = icon(t.paused ? "play" : "pause");
    trackDur = t.duration || 0;
    var label = t.title ? (t.title + (t.artist ? "  —  " + t.artist : "")) : "NeoAmp ◢◤";
    setMarquee(label);
    // Only show real artwork; clear the src otherwise so the <img> can't render
    // a broken-image icon (YTM sometimes returns a stale/placeholder URL).
    var hasArt = !!(t.art && /^https?:\/\//.test(t.art));
    if (els.artImg) {
      if (hasArt) { if (els.artImg.src !== t.art) els.artImg.src = t.art; }
      else els.artImg.removeAttribute("src");
    }
    if (els.art) els.art.classList.toggle("empty", !hasArt);
    // real sample rate (from the offscreen capture) drives the kHz box; kbps stays dashed
    if (els.khz) els.khz.textContent = t.sampleRate ? Math.round(t.sampleRate / 1000) + " kHz" : "—— kHz";
    if (!seeking && els.seek) {
      var pct = trackDur > 0 ? (t.currentTime / trackDur) * 1000 : 0;
      els.seek.value = String(Math.round(pct));
      paintRange(els.seek);
    }
    if (els.plTime) els.plTime.textContent = fmt(t.currentTime) + " / " + fmt(trackDur);
    if (t.lyrics !== undefined) lastLyrics = t.lyrics;   // undefined = provider didn't supply (keep last)
    if (els.lyricsList) renderLyrics(lastLyrics);
    // new track → re-open the provider's lyrics pane if our Lyrics window is showing
    var tkey = (t.title || "") + "|" + (t.artist || "");
    if (tkey !== lastLyricsTrack) { lastLyricsTrack = tkey; maybeLoadLyrics(); }
    refreshQueue();
  }
  var lastLyricsTrack = "";

  function setMarquee(text) { runMarquee(els.marquee, text); }
  // Generic Winamp-style ticker: scroll an inline track inside its clipping parent, but
  // ONLY when the text overflows (else it sits static). Per-element state on the node.
  function runMarquee(el, text) {
    if (!el) return;
    text = text || "";
    if (el.__mqText === text) return;
    el.__mqText = text;
    if (el.__mqAnim) { el.__mqAnim.cancel(); el.__mqAnim = null; }
    var sep = "      ◆      ";
    el.textContent = text;
    el.style.transform = "translateX(0)";
    requestAnimationFrame(function () {
      var box = el.parentNode;
      if (!box || el.scrollWidth <= box.clientWidth) return;   // fits → no scroll
      el.textContent = text + sep + text;
      var dist = (el.scrollWidth - el.clientWidth) / 2 + measureIn(el, sep);
      var dur = Math.max(6000, dist * 45);
      el.__mqAnim = el.animate(
        [{ transform: "translateX(0)" }, { transform: "translateX(" + -dist + "px)" }],
        { duration: dur, iterations: Infinity, easing: "linear" }
      );
    });
  }
  function measureIn(el, s) {
    var span = h("span", { text: s });
    span.style.cssText = "position:absolute;visibility:hidden;white-space:pre;font:inherit";
    el.appendChild(span); var w = span.offsetWidth; span.remove(); return w;
  }

  function onAudio(frame) {
    postViz({ type: "audio", data: frame.time }); // feed Butterchurn
    drawAnalyzer(frame.freq);
    if (classicApi) classicApi.pushAudio(frame.freq);   // classic skin's in-window analyzer
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
    // chop the bars into stacked LED blocks with dark horizontal gridlines
    g.fillStyle = "rgba(0,0,0,0.82)";
    for (var y = 0; y < H; y += 4) g.fillRect(0, y, W, 2);
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
    syncNpButtons();   // reflect on every toggle key (NP-strip + procedural), not just togEl
    saveLayout();
  }
  function hideWin(id) {
    if (wins[id]) wins[id].el.style.display = "none";
    syncNpButtons();   // clears the lit key on whichever toggles point at this window
    saveLayout();
  }

  function focusYtSearch() {
    if (NA.control.focusSearch && NA.control.focusSearch()) return;   // provider-aware
    NA.toast("Use the music site's own search box");
  }

  // keyboard "L": open the Library/search window (if hidden) and focus its box
  // LIB action: open the in-app library window (YTM), or focus the site's OWN search box
  // on providers without one (Spotify) — so "LIB" is a working search affordance everywhere.
  function toggleLibrary(togBtn) {
    var caps = (NA.control.getCapabilities && NA.control.getCapabilities()) || {};
    if (caps.library === false) {
      if (!(NA.control.focusSearch && NA.control.focusSearch())) NA.toast("Search isn't available on this site.");
      return;
    }
    toggleWin("wa-lib", togBtn);
    if (togBtn) togBtn.classList.toggle("on", isShown("wa-lib"));
    if (isShown("wa-lib")) libBecameVisible();
  }
  function focusLibrary() {
    var caps = (NA.control.getCapabilities && NA.control.getCapabilities()) || {};
    if (caps.library === false) { focusYtSearch(); return; }   // no in-app library → the site's own search
    if (!isShown("wa-lib")) { toggleWin("wa-lib", els.libTog); libBecameVisible(); }
    else if (wins["wa-lib"]) raise(wins["wa-lib"].el);
    if (els.libInput) setTimeout(function () { try { els.libInput.focus(); els.libInput.select(); } catch (_) {} }, 30);
  }

  function buildUI() {
    if (root) return;
    root = h("div", { id: "neoamp-root" });
    document.documentElement.appendChild(root);
    // GLOBAL right-click → settings menu, over ANY NeoAmp window (events bubble up from the
    // pointer-events:auto windows through the root). Text fields + the open menu keep their
    // native behaviour. The menu is a root-level host so it pops at the cursor anywhere.
    root.addEventListener("contextmenu", function (e) {
      if (e.target.closest && e.target.closest("input, textarea, [contenteditable], .wa-skinsel-menu")) return;
      e.preventDefault();
      openGearAt(els.gearWrap, e.clientX, e.clientY);
    });
    ensureBackdrop();
    NA.storage.get("neoampBg", function (m) { if (m && BG_MODES.indexOf(m) >= 0) bgMode = m; applyBackdrop(); });
    buildMain();
    buildEq();
    buildViz();
    buildPlaylist();
    buildLibrary();
    buildLyrics();
    NA.on("track", onTrack);
    NA.on("audio", onAudio);
    // slow poll so queue edits made in YTM while the same track plays show up
    setInterval(function () {
      var w = wins["wa-pl"];
      if (w && w.el.style.display !== "none") refreshQueue();
    }, 1500);
    NA.storage.get("neoampLayout", function (l) { layout = l || {}; applyLayout(); syncToggles(); });
    NA.storage.get("neoampZoom", function (z) { z = parseFloat(z); if (z && z >= 0.5 && z < 1) { uiScale = z; applyUiScale(); } });
    setupSkinDrop();
    // load user-saved skins first so a persisted custom skin id resolves
    loadPersistedSkins(function () {
      NA.storage.get("neoampSkin", function (id) {
        // procedural skins are retired — default to (and coerce legacy ids onto) a .wsz skin
        if (!id || id.indexOf("wsz:") !== 0 || !CLASSIC_SKINS.some(function (s) { return "wsz:" + s.id === id; })) id = DEFAULT_WSZ;
        activeSkinValue = id;
        enableClassic(id.slice(4));
        setSkinSelectors(id);
      });
    });
  }
  // drag a .wsz onto the player to load it (classic, Winamp-style gesture)
  function setupSkinDrop() {
    root.addEventListener("dragover", function (e) {
      if (e.dataTransfer && Array.prototype.some.call(e.dataTransfer.items || [], function (i) { return i.kind === "file"; })) {
        e.preventDefault(); e.dataTransfer.dropEffect = "copy";
      }
    });
    root.addEventListener("drop", function (e) {
      var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (f && /\.(wsz|zip)$/i.test(f.name)) { e.preventDefault(); loadSkinFile(f); }
    });
  }

  // reflect each window's visibility on its main-window toggle
  function syncToggles() {
    var map = { "wa-eq": els.eqTog, "wa-pl": els.plTog, "wa-viz": els.visTog, "wa-lib": els.libTog };
    Object.keys(map).forEach(function (id) {
      if (map[id] && wins[id]) map[id].classList.toggle("on", wins[id].el.style.display !== "none");
    });
  }

  // Hide controls the active provider doesn't support (read from content's capability
  // flags) so e.g. on Spotify the dislike + library/search buttons don't show as dead.
  function applyCapabilities() {
    var caps = (NA.control.getCapabilities && NA.control.getCapabilities()) || {};
    // dislike has no Spotify equivalent → hide it. LIB stays visible everywhere: on
    // providers with no in-app library it focuses the site's own search box (see
    // toggleLibrary), so "LIB" is a working search affordance on every provider.
    if (els.npDislike) els.npDislike.style.display = caps.dislike === false ? "none" : "";
  }
  function showUI() {
    buildUI();
    applyCapabilities();
    root.style.display = "";
    // backdrop lives on documentElement (zoom-immune), so toggle it with the player
    var bd = document.getElementById("neoamp-backdrop"); if (bd) bd.style.visibility = "";
    if (launcher) launcher.style.display = "none";
    var cur = NA.getTrack(); if (cur) onTrack(cur);
    buttonizeAll();   // give the freshly-built chrome button semantics
    // auto-buttonize controls added to dynamic containers later (queue refresh,
    // search/home results, skin-menu re-populate)
    var dyn = [els.libList];
    [].forEach.call(root.querySelectorAll(".wa-skinsel-menu"), function (m) { dyn.push(m); });
    dyn.forEach(function (c) {
      if (c && !c.__a11yObs) { c.__a11yObs = true; new MutationObserver(function () { buttonizeAll(c); }).observe(c, { childList: true }); }
    });
  }
  function hideUI() {
    if (root) root.style.display = "none";
    var bd = document.getElementById("neoamp-backdrop"); if (bd) bd.style.visibility = "hidden";
    if (launcher) launcher.style.display = "";
  }

  // ---- accessibility -------------------------------------------------------
  // Our chrome is built from <div>/<span> "buttons"; give them button semantics so
  // keyboard + screen-reader users can operate them. Native <button>/<input> controls
  // (library GO/HOME, EQ on/off, sliders) are already accessible and left alone. The
  // skinned Main/EQ windows are a single <canvas> with internal hit-tests, which can't
  // carry per-control ARIA — the global transport shortcuts cover those.
  function reflectPressed(el) { el.setAttribute("aria-pressed", el.classList.contains("on") ? "true" : "false"); }
  var A11Y_SEL = ".wa-tog,.wa-np-tog,.wa-tbtn,.wa-pl-btn,.wa-skinsel-btn,.wa-skinsel-item,.wa-gear-click,.wa-gear-step,.wa-lib-row";
  function buttonizeAll(scope) {
    scope = scope || root; if (!scope) return;
    [].forEach.call(scope.querySelectorAll(A11Y_SEL), function (el) {
      if (el.__a11y) return; el.__a11y = true;
      el.setAttribute("role", "button");
      if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "0");
      if (!el.getAttribute("aria-label") && el.title) el.setAttribute("aria-label", el.title);
      if (el.classList.contains("wa-gear-btn") || el.classList.contains("wa-skinsel-btn")) {
        // menu trigger (not a toggle): reflect open/closed via aria-expanded by watching
        // the sibling menu's .open class — catches every open/close path at once.
        el.setAttribute("aria-haspopup", "menu"); el.setAttribute("aria-expanded", "false");
        var menuEl = el.parentNode && el.parentNode.querySelector(".wa-skinsel-menu");
        if (menuEl) {
          var syncExp = function () { el.setAttribute("aria-expanded", menuEl.classList.contains("open") ? "true" : "false"); };
          syncExp();
          new MutationObserver(syncExp).observe(menuEl, { attributes: true, attributeFilter: ["class"] });
        }
      } else if (el.classList.contains("wa-tog") || el.classList.contains("wa-np-tog")) {
        reflectPressed(el);                                         // toggle key (VIS/LIB/EQ/PL/like…)
        new MutationObserver(function () { reflectPressed(el); }).observe(el, { attributes: true, attributeFilter: ["class"] });
      }
    });
  }
  // Enter / Space activate any of our role=button divs (native buttons do this on their
  // own). Capturing so it beats YTM; Space is prevented from scrolling the page.
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Enter" && e.key !== " " && e.key !== "Spacebar") return;
    var el = e.target;
    if (!el || !el.getAttribute || el.getAttribute("role") !== "button") return;
    e.preventDefault(); e.stopPropagation();
    // library rows play on dblclick (plain song rows have no click handler), so keyboard
    // activation must synthesize a dblclick — el.click() alone wouldn't play them.
    if (el.classList.contains("wa-lib-row")) el.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    else el.click();
  }, true);

  // ---- launcher + keyboard -------------------------------------------------
  function ensureLauncher() {
    if (document.getElementById("neoamp-launch")) return;
    // During the real-EQ rebuild this button toggles the EQ capture (relayed to the
    // service worker, which owns the gesture-gated tabCapture). It will fold back into
    // the full player launch once the EQ is integrated.
    launcher = h("button", { id: "neoamp-launch", title: "Open NeoAmp — click the gold ‘N’ toolbar icon, or press ⌘⇧E (Ctrl+Shift+E)", text: "◢◤ NeoAmp" });
    // a webpage button can't start tab-capture (Chrome security) — the gold "N"
    // toolbar icon (or right-click) can. Guide the user there.
    launcher.addEventListener("click", function () { NA.toast("To open NeoAmp: click the gold “N” toolbar icon, or press ⌘⇧E (Ctrl+Shift+E)."); });
    document.documentElement.appendChild(launcher);
  }

  // One-time first-run callout. NeoAmp has no obvious on-page trigger (Chrome forbids a
  // page button from starting tabCapture), so a brand-new user sees nothing — this card
  // explains how to start + the key shortcuts, then never shows again (persisted flag).
  function maybeOnboard() {
    NA.storage.get("neoampOnboarded", function (done) {
      if (done || document.getElementById("neoamp-onboard")) return;
      var card = h("div", { id: "neoamp-onboard" }, [
        h("div", { class: "neoamp-onboard-h", text: "◢◤ NeoAmp is ready" }),
        h("div", { class: "neoamp-onboard-b", html:
          "To open: click the gold <b>N</b> toolbar icon, or press <b>⌘⇧E</b> (Ctrl+Shift+E)." +
          "<br>While running: <b>Z</b> prev · <b>X</b> play · <b>C</b> pause · <b>V</b> stop · <b>B</b> next · <b>Space</b> play/pause." }),
      ]);
      var ok = h("button", { class: "neoamp-onboard-ok", text: "Got it" });
      ok.addEventListener("click", function () { card.remove(); NA.storage.set({ neoampOnboarded: 1 }); });
      card.appendChild(ok);
      document.documentElement.appendChild(card);
    });
  }

  NA.on("start", showUI);
  NA.on("stop", hideUI);

  // Shift+V CLOSES NeoAmp when running. A page script can't START tabCapture (Chrome's
  // gesture rule), so when closed it can't open the player — it just shows the how-to-
  // open hint (startHint). The classic Winamp transport keys (Z X C V B, Space, arrows,
  // L) are active only while NeoAmp is running, so they don't hijack YTM when closed.
  // Guarded against text fields
  // + modifier combos; handled keys preventDefault + stopPropagation so YTM's own
  // shortcut (Space/arrows) doesn't also fire and double-toggle.
  window.addEventListener("keydown", function (e) {
    var tgt = e.target;
    // bail for text fields AND our focusable role=button controls (so Enter/Space/letters
    // activate the focused button instead of firing a transport shortcut)
    if (tgt && (/^(INPUT|TEXTAREA|SELECT)$/.test(tgt.tagName) || tgt.isContentEditable ||
        (tgt.getAttribute && tgt.getAttribute("role") === "button"))) return;
    if (e.shiftKey && (e.key === "V" || e.key === "v")) { e.preventDefault(); NA.isRunning() ? NA.stop() : NA.start(); return; }
    // Shift excluded too (Shift+V handled above); CapsLock letters still work (shiftKey false)
    if (!NA.isRunning() || e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;
    var c = NA.control, handled = true;
    switch (e.key) {
      case "z": case "Z": c.prev(); break;
      case "x": case "X": c.play(); break;
      case "c": case "C": c.pause(); break;
      case "v": case "V": c.stop(); break;          // plain V (Shift+V returned above)
      case "b": case "B": c.next(); break;
      case " ": c.playPause(); break;
      case "ArrowRight": c.seekBy(5); break;
      case "ArrowLeft": c.seekBy(-5); break;
      case "ArrowUp": c.nudgeVolume(0.05); syncVolUi(); break;
      case "ArrowDown": c.nudgeVolume(-0.05); syncVolUi(); break;
      case "m": case "M": if (c.setMute) { c.setMute(); syncVolUi(); } break;
      case "l": case "L": focusLibrary(); break;
      case "-": case "_": setUiScale(uiScale - 0.05); break;   // zoom out (fit a short screen)
      case "=": case "+": setUiScale(uiScale + 0.05); break;   // zoom in
      case "\\": setUiScale(1); break;                          // reset to 100%
      default: handled = false;
    }
    if (handled) { e.preventDefault(); e.stopPropagation(); }
  }, true);

  // In-page ◢◤ launcher: a persistent, subtle bottom-right affordance for discoverability.
  // By Chrome's rules it can't itself START tabCapture (only the toolbar icon / right-click
  // / ⌘⇧E can), so clicking it guides the user there. showUI/hideUI hide it while running.
  ensureLauncher();
  maybeOnboard();

  // DEV auto-launch is OFF during the real-EQ rebuild: the in-page getDisplayMedia
  // capture fights the new tabCapture EQ path (Chrome won't capture one tab twice),
  // so auto-grabbing the audio would block the EQ. It gets folded into the tabCapture
  // launch flow once the EQ is integrated. Re-enable: localStorage.setItem('neoamp_autostart','1')
  try {
    if (localStorage.getItem("neoamp_autostart") === "1") {
      var autoStart = function () {
        document.removeEventListener("pointerdown", autoStart, true);
        document.removeEventListener("keydown", autoStart, true);
        if (!NA.isRunning()) NA.start();
      };
      document.addEventListener("pointerdown", autoStart, true);
      document.addEventListener("keydown", autoStart, true);
    }
  } catch (_) {}

  // YTM is a SPA; re-add the launcher after a client-side navigation wipes it.
  var mo = new MutationObserver(function () {
    if (!document.getElementById("neoamp-launch") && !NA.isRunning()) ensureLauncher();
  });
  mo.observe(document.documentElement, { childList: true });
})();
