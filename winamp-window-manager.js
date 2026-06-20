/* NeoAmp UI — floating-window engine: makeWindow, drag/snap/resize, visibility toggles.
 * Split from the former monolithic winamp.js; loaded as content scripts in a fixed
 * order (see manifest). These files SHARE the content-script global scope (same
 * pattern as presets/kit.js → presets/*.js): every top-level var/function is a global,
 * so cross-file references resolve without imports. See CLAUDE.md.
 */
"use strict";

// =========================================================================
// WINDOW MANAGER
// =========================================================================
function makeWindow(id, title, opts) {
  opts = opts || {};
  var titleSpan = h("span", {
    class: "wa-title",
    html: '<span class="wa-logo">◢◤</span>' + title,
  });
  var tbtns = h("span", { class: "wa-tbtns" });
  // optional left-side gadget (e.g. skin picker on the main window)
  var bar = h("div", { class: "wa-titlebar" }, [titleSpan, opts.gadget || null, tbtns]);
  var body = h("div", { class: "wa-body" });
  var el = h("div", { class: "wa-win inactive", id: id }, [bar, body]);
  el.setAttribute("role", "group");
  el.setAttribute("aria-label", title); // SR window landmark

  // optional extra titlebar buttons (e.g. fullscreen), then shade, then close.
  // b.html lets a button use a crisp inline-SVG icon instead of a text glyph.
  (opts.titleButtons || []).forEach(function (b) {
    var attrs = { class: "wa-tbtn" + (b.cls ? " " + b.cls : ""), title: b.title };
    if (b.html) attrs.html = b.html;
    else attrs.text = b.label;
    var btn = h("span", attrs);
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      b.onClick();
    });
    tbtns.appendChild(btn);
  });

  // shade (collapse to just the titlebar) — the button AND a titlebar double-click
  // (the WMP/Winamp idiom). State persists across reloads via saveLayout().
  if (opts.shade !== false) {
    var shadeBtn = h("span", {
      class: "wa-tbtn",
      title: "Shade (or double-click titlebar)",
      text: "▬",
    });
    shadeBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      setShaded(id);
    });
    tbtns.appendChild(shadeBtn);
    bar.addEventListener("dblclick", function (e) {
      if (e.target.closest(".wa-tbtn, .wa-skinsel-btn")) return; // not when toggling a titlebar control
      setShaded(id);
    });
  }
  var closeBtn = h("span", { class: "wa-tbtn wa-close", title: "Close", text: "✕" });
  closeBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    (
      opts.onClose ||
      function () {
        el.style.display = "none";
      }
    )();
  });
  tbtns.appendChild(closeBtn);

  el.addEventListener(
    "mousedown",
    function () {
      raise(el);
    },
    true
  );
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
  Object.keys(wins).forEach(function (k) {
    wins[k].el.classList.add("inactive");
  });
  var group =
    el.id === "wa-main" || el.id === "wa-skin"
      ? attachedCluster(el)
          .map(function (m) {
            return m.el;
          })
          .filter(function (g) {
            return g !== el;
          })
      : [];
  // group members first (below), then the grabbed window on top + marked active
  group.forEach(function (g) {
    g.style.zIndex = String(++zTop);
    g.classList.remove("inactive");
  });
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
      "position:fixed;inset:0;z-index:2147483640;pointer-events:auto;cursor:" +
      (cursor || "default") +
      ";";
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
  var keys = Object.keys(wins).filter(function (k) {
    return wins[k].el.style.display !== "none";
  });
  var rect = {};
  keys.forEach(function (k) {
    var e = wins[k].el;
    rect[k] = {
      l: e.offsetLeft,
      t: e.offsetTop,
      r: e.offsetLeft + e.offsetWidth,
      b: e.offsetTop + e.offsetHeight,
    };
  });
  function adjacent(a, b) {
    var ra = rect[a],
      rb = rect[b];
    var vOv = Math.min(ra.b, rb.b) - Math.max(ra.t, rb.t) > 2; // share vertical extent
    var hOv = Math.min(ra.r, rb.r) - Math.max(ra.l, rb.l) > 2; // share horizontal extent
    var touchX = (Math.abs(ra.r - rb.l) <= TOL || Math.abs(ra.l - rb.r) <= TOL) && vOv;
    var touchY = (Math.abs(ra.b - rb.t) <= TOL || Math.abs(ra.t - rb.b) <= TOL) && hOv;
    return touchX || touchY;
  }
  var startK = null;
  keys.forEach(function (k) {
    if (wins[k].el === start) startK = k;
  });
  var seen = {},
    queue = startK ? [startK] : [];
  if (startK) seen[startK] = 1;
  while (queue.length) {
    var c = queue.shift();
    keys.forEach(function (k) {
      if (!seen[k] && adjacent(c, k)) {
        seen[k] = 1;
        queue.push(k);
      }
    });
  }
  return Object.keys(seen).map(function (k) {
    var e = wins[k].el;
    return { el: e, sl: e.offsetLeft, st: e.offsetTop };
  });
}

function makeDraggable(el, handle) {
  var ox = 0,
    oy = 0,
    dragging = false,
    cluster = [],
    sl0 = 0,
    st0 = 0;
  handle.addEventListener("mousedown", function (e) {
    if (e.button !== 0 || e.target.closest(".wa-tbtn, .wa-skinsel")) return;
    dragging = true;
    var r = el.getBoundingClientRect();
    ox = e.clientX - r.left;
    oy = e.clientY - r.top;
    // Winamp's anchor model: only the main window drags the whole docked
    // group; sub-windows (EQ/Viz/Playlist/Library) move on their own. In
    // classic (.wsz) mode the main window is #wa-skin, so it anchors too.
    cluster =
      el.id === "wa-main" || el.id === "wa-skin"
        ? attachedCluster(el)
        : [{ el: el, sl: el.offsetLeft, st: el.offsetTop }];
    sl0 = el.offsetLeft;
    st0 = el.offsetTop; // dragged window's start position
    el.classList.add("dragging");
    shield(true, "move");
    e.preventDefault();
  });
  window.addEventListener("mousemove", function (e) {
    if (!dragging) return;
    // ox/oy are visual (post-transform) offsets; /uiScale maps the cursor back to
    // the window's unscaled layout coordinate so the grab point tracks exactly.
    var pos = snap(el, (e.clientX - ox) / uiScale, (e.clientY - oy) / uiScale, cluster);
    var dx = pos.x - sl0,
      dy = pos.y - st0; // apply the same delta to every member
    cluster.forEach(function (m) {
      m.el.style.left = m.sl + dx + "px";
      m.el.style.top = m.st + dy + "px";
    });
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
  (cluster || []).forEach(function (m) {
    excl[m.el.id] = 1;
  });
  var w = el.offsetWidth,
    hgt = el.offsetHeight;
  var vw = vpW(),
    vh = vpH(); // viewport in layout px (zoom-aware)
  var L = x,
    T = y,
    R = x + w,
    B = y + hgt;
  var cand = [{ l: 0, t: 0, r: vw, b: vh }]; // viewport
  Object.keys(wins).forEach(function (k) {
    if (wins[k].el === el || excl[wins[k].el.id] || wins[k].el.style.display === "none") return;
    var o = wins[k].el;
    var r = {
      l: o.offsetLeft,
      t: o.offsetTop,
      r: o.offsetLeft + o.offsetWidth,
      b: o.offsetTop + o.offsetHeight,
    };
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
  var sx = 0,
    sy = 0,
    sw = 0,
    sh = 0,
    sizing = false;
  handle.addEventListener("mousedown", function (e) {
    sizing = true;
    sx = e.clientX;
    sy = e.clientY;
    sw = el.offsetWidth;
    sh = el.offsetHeight;
    shield(true, lockWidth ? "ns-resize" : "nwse-resize");
    raise(el);
    e.preventDefault();
    e.stopPropagation();
  });
  window.addEventListener("mousemove", function (e) {
    if (!sizing) return;
    // cap so the bottom-right resize handle can't be pushed off-screen (it'd be
    // unreachable to drag back smaller). Keep a 2px margin inside the viewport.
    var maxW = Math.max(minW, vpW() - el.offsetLeft - 2);
    var maxH = Math.max(minH, vpH() - el.offsetTop - 2);
    // pointer deltas are visual px; /uiScale converts to unscaled layout px
    if (!lockWidth)
      el.style.width = Math.min(maxW, Math.max(minW, sw + (e.clientX - sx) / uiScale)) + "px";
    el.style.height = Math.min(maxH, Math.max(minH, sh + (e.clientY - sy) / uiScale)) + "px";
  });
  var stop = function () {
    if (!sizing) return;
    sizing = false;
    shield(false);
    saveLayout();
  };
  window.addEventListener("mouseup", stop);
  window.addEventListener("blur", stop);
}

// Keep every window reachable: cap any window bigger than the viewport, then clamp
// its position back into view. Without this a window stranded off-screen (after the
// browser shrinks, or an oversized viz) has its resize handle out of reach.
function clampWindowsIntoView() {
  if (!root) return;
  var vw = vpW(),
    vh = vpH(); // layout-space viewport (zoom-aware)
  Object.keys(wins).forEach(function (k) {
    var e = wins[k] && wins[k].el;
    if (!e || e.style.display === "none") return;
    if (e.style.width && e.offsetWidth > vw) e.style.width = vw + "px"; // only resizable windows carry inline w/h
    if (e.style.height && e.offsetHeight > vh) e.style.height = vh + "px";
    var x = Math.max(0, Math.min(vw - e.offsetWidth, e.offsetLeft));
    var y = Math.max(0, Math.min(vh - e.offsetHeight, e.offsetTop));
    if (x !== e.offsetLeft) e.style.left = x + "px";
    if (y !== e.offsetTop) e.style.top = y + "px";
  });
}

var clampTimer = 0;

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

function isShown(id) {
  return wins[id] && wins[id].el.style.display !== "none";
}

function toggleWin(id, togEl) {
  var w = wins[id];
  if (!w) return;
  var hidden = w.el.style.display === "none";
  w.el.style.display = hidden ? "" : "none";
  if (togEl) togEl.classList.toggle("on", hidden);
  if (hidden) raise(w.el);
  syncNpButtons(); // reflect on every toggle key (NP-strip + procedural), not just togEl
  saveLayout();
}

function hideWin(id) {
  if (wins[id]) wins[id].el.style.display = "none";
  syncNpButtons(); // clears the lit key on whichever toggles point at this window
  saveLayout();
}

// reflect each window's visibility on its main-window toggle
function syncToggles() {
  var map = {
    "wa-eq": els.eqTog,
    "wa-pl": els.plTog,
    "wa-viz": els.visTog,
    "wa-lib": els.libTog,
  };
  Object.keys(map).forEach(function (id) {
    if (map[id] && wins[id]) map[id].classList.toggle("on", wins[id].el.style.display !== "none");
  });
}
