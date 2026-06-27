/* NeoAmp UI — core: backend handle (NA), shared state, base DOM/util helpers, fonts.
 * Split from the former monolithic winamp.js; loaded as content scripts in a fixed
 * order (see manifest). These files SHARE the content-script global scope (same
 * pattern as presets/kit.js → presets/*.js): every top-level var/function is a global,
 * so cross-file references resolve without imports. See CLAUDE.md.
 */
"use strict";

var NA = window.NeoAmp;

if (!NA) console.error("[NeoAmp] backend (content.js) not present");

// Load the bundled fonts with ABSOLUTE extension URLs. A relative url() in a
// content-script-injected stylesheet (winamp.css) does NOT resolve to the extension —
// it 404s and the text silently falls back to mono — so the @font-face there never
// worked live. chrome.runtime.getURL gives the real web-accessible path; this <style>
// (in the page document) is what actually registers + loads "NeoAmp LCD"/"NeoAmp Pixel".
(function injectFonts() {
  try {
    var f = function (fam, file) {
      return (
        '@font-face{font-family:"' +
        fam +
        '";src:url("' +
        chrome.runtime.getURL("fonts/" + file) +
        '") format("truetype");font-display:swap}'
      );
    };
    var st = document.createElement("style");
    st.textContent =
      f("NeoAmp LCD", "VT323-Regular.ttf") + f("NeoAmp Pixel", "Silkscreen-Bold.ttf");
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
    document.fonts.forEach(function (f) {
      if (f.family === "NeoAmp LCD") already = true;
    });
    if (already) return;
    fetch(chrome.runtime.getURL("fonts/VT323-Regular.ttf"))
      .then(function (r) {
        return r.arrayBuffer();
      })
      .then(function (buf) {
        return new FontFace("NeoAmp LCD", buf).load();
      })
      .then(function (ff) {
        document.fonts.add(ff);
      })
      .catch(function (e) {
        console.warn("[NeoAmp] LCD font load failed:", e);
      });
  } catch (e) {
    console.warn("[NeoAmp] LCD font:", e);
  }
})();

var SNAP = 9; // px magnetic-docking threshold

// Global UI zoom. The whole player is fixed-size (the .wsz skin renders at a
// hardcoded 2x and the CSS is in fixed px), so on a short viewport the docked
// stack overflows. uiScale CSS-transforms #neoamp-root (origin 0,0) to shrink
// everything to fit. Because layout math (offsetLeft/innerWidth) lives in the
// UNSCALED coordinate space, pointer deltas and the viewport bounds are divided
// by uiScale (see vpW/vpH + the drag/resize handlers) so dragging stays exact.
var uiScale = 1;

function vpW() {
  return window.innerWidth / uiScale;
} // viewport width in layout (pre-transform) px

function vpH() {
  return window.innerHeight / uiScale;
}

var root = null,
  launcher = null;

var wins = {}; // id -> { el, body, titlebar }

var vizFrame = null,
  vizBuilt = false,
  vizPort = null; // private MessageChannel port to the sandboxed iframe (set on the viz "ready")

var zTop = 20;

var els = {}; // cached main-window refs

var seeking = false,
  trackDur = 0;

var currentSkin = (window.NeoAmpSkins && window.NeoAmpSkins.DEFAULT_ID) || "classic";

var layout = {}; // id -> {x,y,w,h}

// real Winamp skins (.wsz) rendered by wsz.js. id -> vendored resource path.
// We bundle ONLY the default base skin (following Webamp's precedent — it ships one
// base skin and disclaims it; see THIRD-PARTY-NOTICES.md). We deliberately do NOT
// redistribute community skins we have no license for: users get those on demand by
// browsing the Winamp Skin Museum and dropping the .wsz in (＋ Load skin… / drag-drop),
// which is persisted alongside this list as a `custom` entry.
var MUSEUM_URL = "https://skins.webamp.org/";

var CLASSIC_SKINS = [
  { id: "base-2.91", name: "Winamp Classic", file: "vendor/skins/base-2.91.wsz" },
];

var classicApi = null; // mounted Main-window renderer (null = procedural mode)

// ---- tiny DOM helper -----------------------------------------------------
function h(tag, attrs, kids) {
  var el = document.createElement(tag);
  if (attrs)
    Object.keys(attrs).forEach(function (k) {
      if (k === "class") el.className = attrs[k];
      else if (k === "html") el.innerHTML = attrs[k];
      else if (k === "text") el.textContent = attrs[k];
      else el.setAttribute(k, attrs[k]);
    });
  (kids || []).forEach(function (c) {
    if (c) el.appendChild(c);
  });
  return el;
}

// a list thumbnail: an <img> with an error fallback to an empty tile, or just
// an empty tile when there's no/invalid artwork (never a broken-image icon).
function makeThumb(cls, art) {
  if (!(art && /^https?:\/\//.test(art))) return h("span", { class: cls + " empty" });
  var img = h("img", { class: cls, src: art });
  img.addEventListener("error", function () {
    img.className = cls + " empty";
    img.removeAttribute("src");
  });
  return img;
}

// ---- scalable inline-SVG transport icons --------------------------------
function icon(name) {
  var P = {
    prev: "M6 5v14M8 12l9 7V5z", // (drawn filled below)
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

// ---- user-loaded .wsz skins (drag-drop / file picker), persisted -----------
function bufToB64(buf) {
  var u = new Uint8Array(buf),
    s = "",
    CH = 0x8000;
  for (var i = 0; i < u.length; i += CH)
    s += String.fromCharCode.apply(null, u.subarray(i, i + CH));
  return btoa(s);
}

function b64ToBuf(b64) {
  var s = atob(b64),
    u = new Uint8Array(s.length);
  for (var i = 0; i < s.length; i++) u[i] = s.charCodeAt(i);
  return u.buffer;
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
  if (m) {
    var p = m[1].split(",").map(function (x) {
      return parseInt(x, 10);
    });
    return [p[0], p[1], p[2]];
  }
  return null;
}

function mixWhite(rgb, t) {
  return (
    rgb && [rgb[0] + (255 - rgb[0]) * t, rgb[1] + (255 - rgb[1]) * t, rgb[2] + (255 - rgb[2]) * t]
  );
}

// =========================================================================
// iframe bridge (audio in, presets/favorites round-trip)
// =========================================================================
function postViz(m) {
  var msg = Object.assign({ __wmp: true }, m);
  // Prefer the PRIVATE port once the handshake (on viz "ready") established it — a malicious
  // host-page script can't see/forge that channel. Before the port exists (briefly, pre-ready)
  // fall back to the window post so early messages still arrive.
  if (vizPort) {
    try {
      vizPort.postMessage(msg);
    } catch (_) {}
    return;
  }
  if (!vizFrame || !vizFrame.contentWindow) return;
  try {
    vizFrame.contentWindow.postMessage(msg, "*");
  } catch (_) {}
}

function setMarquee(text) {
  runMarquee(els.marquee, text);
}

// Generic Winamp-style ticker: scroll an inline track inside its clipping parent, but
// ONLY when the text overflows (else it sits static). Per-element state on the node.
function runMarquee(el, text) {
  if (!el) return;
  text = text || "";
  if (el.__mqText === text) return;
  el.__mqText = text;
  if (el.__mqAnim) {
    el.__mqAnim.cancel();
    el.__mqAnim = null;
  }
  var sep = "      ◆      ";
  el.textContent = text;
  el.style.transform = "translateX(0)";
  requestAnimationFrame(function () {
    var box = el.parentNode;
    if (!box || el.scrollWidth <= box.clientWidth) return; // fits → no scroll
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
  el.appendChild(span);
  var w = span.offsetWidth;
  span.remove();
  return w;
}

function cssVar(name) {
  return root ? getComputedStyle(root).getPropertyValue(name).trim() : "";
}

// =========================================================================
// helpers / lifecycle
// =========================================================================
function fmt(s) {
  s = Math.max(0, Math.floor(s || 0));
  var m = Math.floor(s / 60),
    r = s % 60;
  return m + ":" + (r < 10 ? "0" : "") + r;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>]/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c];
  });
}
