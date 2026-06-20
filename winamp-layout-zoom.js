/* NeoAmp UI — UI zoom, windowshade, and layout/geometry persistence.
 * Split from the former monolithic winamp.js; loaded as content scripts in a fixed
 * order (see manifest). These files SHARE the content-script global scope (same
 * pattern as presets/kit.js → presets/*.js): every top-level var/function is a global,
 * so cross-file references resolve without imports. See CLAUDE.md.
 */
"use strict";

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
  s = Math.max(0.5, Math.min(1, Math.round(s * 20) / 20)); // 50%..100% in 5% steps
  if (s !== uiScale) {
    uiScale = s;
    applyUiScale();
    NA.storage.set({ neoampZoom: uiScale });
  }
  syncZoomBtn(); // refresh the gear readout (after uiScale is updated)
  NA.toast("NeoAmp zoom: " + Math.round(uiScale * 100) + "%   ( - / = / \\ )");
}

function syncZoomBtn() {
  if (els.gearZoom) els.gearZoom(); // refresh the gear menu's Zoom readout
}

// Visually collapse a window to its titlebar (or expand it) — NO persistence, so
// applyLayout can reuse it during restore. Resizable windows carry an inline height
// that would keep the empty body's space, so we stash it on the element + clear it.
function applyShade(id, shaded) {
  var w = wins[id];
  if (!w) return;
  w.body.style.display = shaded ? "none" : "";
  if (shaded) {
    if (w.el.style.height) w.el.dataset.waH = w.el.style.height; // remember expanded height
    w.el.style.height = "";
  } else if (w.el.dataset.waH) {
    w.el.style.height = w.el.dataset.waH;
    delete w.el.dataset.waH; // restore it
  }
  w.el.classList.toggle("wa-shaded", shaded);
}

// User-facing shade toggle (button / titlebar double-click). `on` omitted = toggle.
function setShaded(id, on) {
  var w = wins[id];
  if (!w) return;
  var shaded = on === undefined ? !w.el.classList.contains("wa-shaded") : !!on;
  applyShade(id, shaded);
  if (classicApi) dockClassicStack(); // re-flow the docked stack around the new height
  saveLayout();
}

// ---- layout persistence --------------------------------------------------
function saveLayout() {
  Object.keys(wins).forEach(function (k) {
    var e = wins[k].el;
    // when shaded, offsetHeight is just the titlebar — persist the EXPANDED height
    // (stashed on dataset) so unshading after a reload restores the right size.
    var h =
      e.classList.contains("wa-shaded") && e.dataset.waH
        ? parseInt(e.dataset.waH, 10)
        : e.offsetHeight;
    layout[k] = {
      x: e.offsetLeft,
      y: e.offsetTop,
      w: e.offsetWidth,
      h: h,
      hidden: e.style.display === "none",
      shaded: e.classList.contains("wa-shaded"),
    };
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
    var d = layout[k] || defaults[k] || { x: 60, y: 60 };
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
