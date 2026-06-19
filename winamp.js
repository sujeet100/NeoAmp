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

  // real Winamp skins (.wsz) rendered by wsz.js. id -> vendored resource path.
  var CLASSIC_SKINS = [
    { id: "base-2.91", name: "Winamp Classic", file: "vendor/skins/base-2.91.wsz" },
    { id: "sony-esprit", name: "Sony Esprit", file: "vendor/skins/sony-esprit.wsz" },
    { id: "nucleo-nlog", name: "Nucleo NLog", file: "vendor/skins/nucleo-nlog.wsz" },
    { id: "winamp3-classified", name: "Winamp3 Classified", file: "vendor/skins/winamp3-classified.wsz" },
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
      root.appendChild(dragShield);
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
      var pos = snap(el, e.clientX - ox, e.clientY - oy, cluster);
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
    var vw = window.innerWidth, vh = window.innerHeight;
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
      if (!lockWidth) el.style.width = Math.max(minW, sw + (e.clientX - sx)) + "px";
      el.style.height = Math.max(minH, sh + (e.clientY - sy)) + "px";
    });
    var stop = function () { if (!sizing) return; sizing = false; shield(false); saveLayout(); };
    window.addEventListener("mouseup", stop);
    window.addEventListener("blur", stop);
  }

  // ---- layout persistence --------------------------------------------------
  function saveLayout() {
    Object.keys(wins).forEach(function (k) {
      var e = wins[k].el;
      layout[k] = { x: e.offsetLeft, y: e.offsetTop, w: e.offsetWidth, h: e.offsetHeight, hidden: e.style.display === "none" };
    });
    NA.storage.set({ neoampLayout: layout });
  }
  // wa-pl resizes in height only — its width is locked to --wa-stack-w via CSS,
  // so we never apply an inline width to it (that's what let it drift out of
  // alignment with Main/EQ). wa-viz/wa-lib resize freely in both axes.
  var RESIZABLE_W = { "wa-viz": 1, "wa-lib": 1 };
  var RESIZABLE_H = { "wa-viz": 1, "wa-pl": 1, "wa-lib": 1 };
  function applyLayout() {
    var defaults = {
      "wa-main": { x: 40, y: 70 },
      "wa-eq": { x: 40, y: 250 },
      "wa-viz": { x: 514, y: 70, w: 360, h: 280 },
      "wa-pl": { x: 40, y: 430, h: 220 },
      "wa-lib": { x: 514, y: 370, w: 380, h: 300, hidden: true },
    };
    Object.keys(wins).forEach(function (k) {
      var e = wins[k].el;
      var d = (layout[k]) || defaults[k] || { x: 60, y: 60 };
      e.style.left = (d.x || 40) + "px";
      e.style.top = (d.y || 60) + "px";
      if (d.w && RESIZABLE_W[k]) e.style.width = d.w + "px";
      if (d.h && RESIZABLE_H[k]) e.style.height = d.h + "px";
      e.style.display = d.hidden ? "none" : "";
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
    els.plTog = tog("PL", "Toggle playlist", function (t) { toggleWin("wa-pl", t); refreshQueue(true); });
    els.visTog = tog("VIS", "Toggle visualization", function (t) { toggleWin("wa-viz", t); });
    els.libTog = tog("LIB", "Toggle media library / search", function (t) { toggleWin("wa-lib", t); if (isShown("wa-lib")) libBecameVisible(); });
    var toggles = h("div", { class: "wa-toggles" }, [els.shuffleTog, els.repeatTog, els.eqTog, els.plTog, els.visTog, els.libTog]);

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
    if (wins["wa-np"]) wins["wa-np"].el.style.display = "";
    raise(classicWin.el);
    if (wins["wa-main"]) wins["wa-main"].el.style.display = "none";
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
    removeFrame();
  }
  // Wrap the DOM windows (Playlist/Library/Viz) in a skin-matching frame: the
  // skin's GEN.BMP if present, else its PLEDIT.BMP (every skin ships PLEDIT, so
  // the frame always matches — no more gold fallback for GEN-less skins).
  // PLEDIT.TXT colors drive the playlist/library list text.
  var GEN_WINDOWS = ["wa-pl", "wa-lib", "wa-viz", "wa-np"];
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
    var p = window.NeoAmpClassic.parsePledit(skin);
    if (p) {
      if (p.normal) root.style.setProperty("--pl-normal", p.normal);
      if (p.current) root.style.setProperty("--pl-current", p.current);
      if (p.normalbg) root.style.setProperty("--pl-normalbg", p.normalbg);
      if (p.selectedbg) root.style.setProperty("--pl-selectedbg", p.selectedbg);
    }
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
    s.removeProperty("--wa-stack-w");
    if (wins["wa-lib"]) wins["wa-lib"].el.style.width = "";
    if (wins["wa-pl"]) wins["wa-pl"].el.style.width = "";
  }
  // skinned EQ window (chrome-less host, like the main window). Hidden until the
  // EQ button is clicked. The procedural #wa-eq stays hidden in classic mode.
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
    classicEqApi = window.NeoAmpClassic.mountEq(w.el, skin, { onClose: function () {
      w.el.style.display = "none"; classicApi && classicApi.setToggles(false, isShown("wa-pl"));
    } });
    w.drag.style.width = classicEqApi.dragRegion.w + "px";
    w.drag.style.height = classicEqApi.dragRegion.h + "px";
  }
  // "Now Playing" panel — our own info window (Winamp 2 has no art region),
  // docked between Main and EQ, skin-width, with album art + track details.
  function ensureNowPlaying() {
    if (wins["wa-np"]) return;
    var img = h("img", { class: "wa-np-art", alt: "" });
    var info = h("div", { class: "wa-np-info" }, [
      (els.npTitle = h("div", { class: "wa-np-title", text: "—" })),
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
    var npSkinSel = buildSkinSelect();
    npSkinSel.value = "wsz:" + (CLASSIC_SKINS[0] && CLASSIC_SKINS[0].id);
    var toggles = h("div", { class: "wa-np-toggles" }, [
      npBtn("VIS", "Show/hide the visualization window", "wa-viz"),
      npBtn("LIB", "Show/hide the library / search window", "wa-lib", function () { if (isShown("wa-lib")) libBecameVisible(); }),
    ]);
    var btns = h("div", { class: "wa-np-btns" }, [rate, toggles, npSkinSel]);
    var el = h("div", { class: "wa-win wa-np inactive empty", id: "wa-np" }, [img, info, btns]);
    img.addEventListener("error", function () { el.classList.add("empty"); img.removeAttribute("src"); });
    el.addEventListener("mousedown", function () { raise(el); }, true);
    makeDraggable(el, el);
    root.appendChild(el);
    wins["wa-np"] = { el: el, body: el, titlebar: el, img: img };
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
  function syncNpButtons() {
    if (els.npVIS) els.npVIS.classList.toggle("on", isShown("wa-viz"));
    if (els.npLIB) els.npLIB.classList.toggle("on", isShown("wa-lib"));
  }
  function pushNowPlaying(t) {
    var w = wins["wa-np"]; if (!w) return;
    var hasArt = !!(t.art && /^https?:\/\//.test(t.art));
    if (hasArt) { if (w.img.src !== t.art) w.img.src = t.art; }
    else w.img.removeAttribute("src");
    w.el.classList.toggle("empty", !hasArt);
    if (els.npTitle) els.npTitle.textContent = t.title || "—";
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
      onVolume: function (v) { NA.control.setVolume(v); if (els.vol) els.vol.value = String(Math.round(v * 100)); },
      onShuffle: function () { NA.control.toggleShuffle(); },
      onRepeat: function () { NA.control.toggleRepeat(); },
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
    classicApi.update({
      elapsed: t.currentTime || 0,
      duration: t.duration || 0,
      title: t.title ? (t.title + (t.artist ? " - " + t.artist : "")) : "NeoAmp",
      stopped: !t.title,
      paused: !!t.paused,
      playing: !t.paused && !!t.title,
    });
  }

  // =========================================================================
  // EQUALIZER WINDOW (cosmetic — sliders move but don't filter audio yet)
  // =========================================================================
  function buildEq() {
    var win = makeWindow("wa-eq", "Equalizer", { onClose: function () { hideWin("wa-eq"); } });
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
    var win = makeWindow("wa-viz", "Visualization", {
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
  // PLAYLIST WINDOW (mirrors YTM's "Up Next" queue)
  // =========================================================================
  function buildPlaylist() {
    var win = makeWindow("wa-pl", "Playlist", { shade: false, onClose: function () { hideWin("wa-pl"); } });
    var list = h("div", { class: "wa-pl-list" });
    var mk = function (lbl, title, fn) {
      var b = h("div", { class: "wa-pl-btn", title: title, text: lbl });
      if (fn) b.addEventListener("click", fn);
      return b;
    };
    var btns = h("div", { class: "wa-pl-btns" }, [
      mk("ADD", "Add tracks (opens YouTube Music search)", focusYtSearch),
      mk("REM", "Remove — use YTM's queue menu (not yet supported)"),
      mk("SEL", "Select"),
      mk("MISC", "Refresh queue", function () { refreshQueue(true); }),
    ]);
    els.plCount = h("div", { class: "wa-pl-count", text: "0 items" });
    els.plTime = h("div", { class: "wa-pl-time wa-lcd", text: "0:00 / 0:00" });
    var foot = h("div", { class: "wa-pl-foot" }, [btns, els.plCount, els.plTime]);

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
  function refreshQueue(force) {
    if (!els.plList) return;
    var q = NA.getQueue ? NA.getQueue() : [];
    var sig = q.map(function (x) { return (x.playing ? "*" : "") + (x.art ? "a" : "") + x.title; }).join("|");
    if (!force && sig === plSig) return;
    plSig = sig;
    els.plList.innerHTML = "";
    if (!q.length) {
      els.plList.appendChild(h("div", { class: "wa-pl-empty", text: "Queue empty — play a track or open Up Next in YouTube Music." }));
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
    var win = makeWindow("wa-lib", "Media Library", { shade: false, onClose: function () { hideWin("wa-lib"); } });
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
  function onTrack(t) {
    if (classicApi) pushClassicTrack(t);   // classic skin mirrors the same state
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
    if (!seeking && els.seek) {
      var pct = trackDur > 0 ? (t.currentTime / trackDur) * 1000 : 0;
      els.seek.value = String(Math.round(pct));
      paintRange(els.seek);
    }
    if (els.plTime) els.plTime.textContent = fmt(t.currentTime) + " / " + fmt(trackDur);
    refreshQueue();
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
    saveLayout();
  }
  function hideWin(id) {
    if (wins[id]) wins[id].el.style.display = "none";
    if (id === "wa-eq" && els.eqTog) els.eqTog.classList.remove("on");
    if (id === "wa-pl" && els.plTog) els.plTog.classList.remove("on");
    if (id === "wa-viz" && els.visTog) els.visTog.classList.remove("on");
    if (id === "wa-lib" && els.libTog) els.libTog.classList.remove("on");
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
    buildPlaylist();
    buildLibrary();
    NA.on("track", onTrack);
    NA.on("audio", onAudio);
    // slow poll so queue edits made in YTM while the same track plays show up
    setInterval(function () {
      var w = wins["wa-pl"];
      if (w && w.el.style.display !== "none") refreshQueue();
    }, 1500);
    NA.storage.get("neoampLayout", function (l) { layout = l || {}; applyLayout(); syncToggles(); });
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

  // DEV auto-launch: getDisplayMedia needs a user gesture (and a native share-picker
  // dialog that can't be auto-dismissed), so a true click-free launch on page load is
  // impossible. This skips hunting for the button — the FIRST click/keypress anywhere
  // (e.g. clicking to play a track) auto-starts NeoAmp. Default ON; disable in the page
  // console with:  localStorage.setItem('neoamp_autostart','0')
  try {
    if (localStorage.getItem("neoamp_autostart") !== "0") {
      var autoStart = function () {
        document.removeEventListener("pointerdown", autoStart, true);
        document.removeEventListener("keydown", autoStart, true);
        if (!NA.isRunning()) NA.start();
      };
      document.addEventListener("pointerdown", autoStart, true);
      document.addEventListener("keydown", autoStart, true);
    }
  } catch (_) {}

  // YTM is a SPA; re-add the launcher if a navigation wipes it.
  var mo = new MutationObserver(function () {
    if (!document.getElementById("neoamp-launch") && !NA.isRunning()) ensureLauncher();
  });
  mo.observe(document.documentElement, { childList: true });
})();
