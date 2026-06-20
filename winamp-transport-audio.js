/* NeoAmp UI — live reactive layer: transport sync, onTrack/onAudio, analyzer, backdrop, a11y.
 * Split from the former monolithic winamp.js; loaded as content scripts in a fixed
 * order (see manifest). These files SHARE the content-script global scope (same
 * pattern as presets/kit.js → presets/*.js): every top-level var/function is a global,
 * so cross-file references resolve without imports. See CLAUDE.md.
 */
"use strict";

// "Now Playing" panel — our own info window (Winamp 2 has no art region),
// docked between Main and EQ, skin-width, with album art + track details.
// --- backdrop: dim the busy YTM page behind NeoAmp so the player reads cleaner ---
var BG_MODES = ["dark", "black", "off"]; // default dark; cycle dark → black → off

var bgMode = "dark";

function applyBackdrop() {
  var bd = document.getElementById("neoamp-backdrop");
  if (bd) {
    bd.style.background =
      bgMode === "black"
        ? "rgba(0,0,0,0.92)"
        : bgMode === "dark"
          ? "rgba(0,0,0,0.55)"
          : "transparent";
    bd.style.display = bgMode === "off" ? "none" : "";
  }
  if (els.gearBg) els.gearBg(); // refresh the gear menu's Background readout
}

function ensureBackdrop() {
  if (!root || document.getElementById("neoamp-backdrop")) return;
  var bd = h("div", { id: "neoamp-backdrop" });
  // full-viewport scrim on documentElement (NOT root) so it covers the TRUE
  // viewport even when root is CSS-scaled by uiScale. z sits just under root
  // (root is 2147483600) so it's above the YTM page but below every window.
  // pointer-events:none so it never blocks clicks to YTM or the player.
  bd.style.cssText =
    "position:fixed; inset:0; z-index:2147483599; pointer-events:none; transition:background .2s ease;";
  document.documentElement.appendChild(bd);
  applyBackdrop();
}

function cycleBackdrop() {
  bgMode = BG_MODES[(BG_MODES.indexOf(bgMode) + 1) % BG_MODES.length];
  applyBackdrop();
  NA.storage.set({ neoampBg: bgMode });
}

// feed live track state into the rendered main window
function pushClassicTrack(t) {
  pushNowPlaying(t);
  if (!classicApi) return;
  var patch = {
    elapsed: t.currentTime || 0,
    duration: t.duration || 0,
    title: t.title ? t.title + (t.artist ? " - " + t.artist : "") : "NeoAmp",
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
// live data → UI
// =========================================================================
// reflect YTM's ACTUAL transport state on the procedural toggles + volume
// slider. null = unknown → leave the current value (never clobber with a guess);
// skip the volume slider while the user is dragging it (don't fight the drag).
// a user just toggled SHUF/REP optimistically; suppress reconciliation briefly so
// the periodic tick can't revert it before YTM's DOM reflects the new state
var transportToggleAt = 0;

function transportSettling() {
  return Date.now() - transportToggleAt < 600;
}

function syncTransport(t) {
  if (!transportSettling()) {
    if (t.shuffle != null && els.shuffleTog) els.shuffleTog.classList.toggle("on", !!t.shuffle);
    if (t.repeat != null && els.repeatTog) els.repeatTog.classList.toggle("on", !!t.repeat);
  }
  if (els.vol && t.volume != null && document.activeElement !== els.vol) {
    var vv = String(Math.round(t.volume * 100));
    if (els.vol.value !== vv) {
      els.vol.value = vv;
      paintRange(els.vol);
    }
  }
  syncVolUi();
}

function onTrack(t) {
  if (classicApi) pushClassicTrack(t); // classic skin mirrors the same state
  syncTransport(t);
  if (els.clock && !seeking) els.clock.textContent = fmt(t.currentTime);
  if (els.playBtn) els.playBtn.innerHTML = icon(t.paused ? "play" : "pause");
  trackDur = t.duration || 0;
  var label = t.title ? t.title + (t.artist ? "  —  " + t.artist : "") : "NeoAmp ◢◤";
  setMarquee(label);
  // Only show real artwork; clear the src otherwise so the <img> can't render
  // a broken-image icon (YTM sometimes returns a stale/placeholder URL).
  var hasArt = !!(t.art && /^https?:\/\//.test(t.art));
  if (els.artImg) {
    if (hasArt) {
      if (els.artImg.src !== t.art) els.artImg.src = t.art;
    } else els.artImg.removeAttribute("src");
  }
  if (els.art) els.art.classList.toggle("empty", !hasArt);
  // real sample rate (from the offscreen capture) drives the kHz box; kbps stays dashed
  if (els.khz)
    els.khz.textContent = t.sampleRate ? Math.round(t.sampleRate / 1000) + " kHz" : "—— kHz";
  if (!seeking && els.seek) {
    var pct = trackDur > 0 ? (t.currentTime / trackDur) * 1000 : 0;
    els.seek.value = String(Math.round(pct));
    paintRange(els.seek);
  }
  if (els.plTime) els.plTime.textContent = fmt(t.currentTime) + " / " + fmt(trackDur);
  if (t.lyrics !== undefined) lastLyrics = t.lyrics; // undefined = provider didn't supply (keep last)
  if (els.lyricsList) renderLyrics(lastLyrics);
  // new track → re-open the provider's lyrics pane if our Lyrics window is showing
  var tkey = (t.title || "") + "|" + (t.artist || "");
  if (tkey !== lastLyricsTrack) {
    lastLyricsTrack = tkey;
    maybeLoadLyrics();
  }
  refreshQueue();
}

function onAudio(frame) {
  postViz({ type: "audio", data: frame.time }); // feed Butterchurn
  drawAnalyzer(frame.freq);
  if (classicApi) classicApi.pushAudio(frame.freq); // classic skin's in-window analyzer
}

// classic Winamp-style bar analyzer with falling peak caps
var peaks = null;

function drawAnalyzer(freq) {
  var c = els.analyzer;
  if (!c || !freq) return;
  var g = c.getContext("2d");
  var W = c.width,
    H = c.height,
    N = 19;
  g.clearRect(0, 0, W, H);
  if (!peaks) peaks = new Float32Array(N);
  var lo = cssVar("--wa-bar-lo") || "#16e651";
  var hi = cssVar("--wa-bar-hi") || "#ffe000";
  var pk = cssVar("--wa-bar-peak") || "#ff5050";
  // classic green→yellow→red levels (color by absolute height: tall/loud bars
  // turn yellow then red at their tips, like real Winamp)
  var grad = g.createLinearGradient(0, H, 0, 0);
  grad.addColorStop(0, lo);
  grad.addColorStop(0.45, lo);
  grad.addColorStop(0.72, hi);
  grad.addColorStop(1, pk);
  var bw = W / N;
  // sample frequency bins logarithmically across the lower ~half of the FFT
  var bins = freq.length;
  for (var i = 0; i < N; i++) {
    var f0 = Math.pow(i / N, 1.7),
      f1 = Math.pow((i + 1) / N, 1.7);
    var a = Math.floor(f0 * bins * 0.55),
      b = Math.max(a + 1, Math.floor(f1 * bins * 0.55));
    var m = 0;
    for (var j = a; j < b && j < bins; j++) m = Math.max(m, freq[j]);
    var v = m / 255;
    var bh = v * H;
    g.fillStyle = grad;
    g.fillRect(i * bw + 1, H - bh, bw - 2, bh);
    // peak cap
    if (bh > peaks[i]) peaks[i] = bh;
    else peaks[i] = Math.max(0, peaks[i] - H * 0.012);
    g.fillStyle = pk;
    g.fillRect(i * bw + 1, H - peaks[i] - 2, bw - 2, 2);
  }
  // chop the bars into stacked LED blocks with dark horizontal gridlines
  g.fillStyle = "rgba(0,0,0,0.82)";
  for (var y = 0; y < H; y += 4) g.fillRect(0, y, W, 2);
}

function focusYtSearch() {
  if (NA.control.focusSearch && NA.control.focusSearch()) return; // provider-aware
  NA.toast("Use the music site's own search box");
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

// ---- accessibility -------------------------------------------------------
// Our chrome is built from <div>/<span> "buttons"; give them button semantics so
// keyboard + screen-reader users can operate them. Native <button>/<input> controls
// (library GO/HOME, EQ on/off, sliders) are already accessible and left alone. The
// skinned Main/EQ windows are a single <canvas> with internal hit-tests, which can't
// carry per-control ARIA — the global transport shortcuts cover those.
function reflectPressed(el) {
  el.setAttribute("aria-pressed", el.classList.contains("on") ? "true" : "false");
}

var A11Y_SEL =
  ".wa-tog,.wa-np-tog,.wa-tbtn,.wa-pl-btn,.wa-skinsel-btn,.wa-skinsel-item,.wa-gear-click,.wa-gear-step,.wa-lib-row";

function buttonizeAll(scope) {
  scope = scope || root;
  if (!scope) return;
  [].forEach.call(scope.querySelectorAll(A11Y_SEL), function (el) {
    if (el.__a11y) return;
    el.__a11y = true;
    el.setAttribute("role", "button");
    if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "0");
    if (!el.getAttribute("aria-label") && el.title) el.setAttribute("aria-label", el.title);
    if (el.classList.contains("wa-gear-btn") || el.classList.contains("wa-skinsel-btn")) {
      // menu trigger (not a toggle): reflect open/closed via aria-expanded by watching
      // the sibling menu's .open class — catches every open/close path at once.
      el.setAttribute("aria-haspopup", "menu");
      el.setAttribute("aria-expanded", "false");
      var menuEl = el.parentNode && el.parentNode.querySelector(".wa-skinsel-menu");
      if (menuEl) {
        var syncExp = function () {
          el.setAttribute("aria-expanded", menuEl.classList.contains("open") ? "true" : "false");
        };
        syncExp();
        new MutationObserver(syncExp).observe(menuEl, {
          attributes: true,
          attributeFilter: ["class"],
        });
      }
    } else if (el.classList.contains("wa-tog") || el.classList.contains("wa-np-tog")) {
      reflectPressed(el); // toggle key (VIS/LIB/EQ/PL/like…)
      new MutationObserver(function () {
        reflectPressed(el);
      }).observe(el, { attributes: true, attributeFilter: ["class"] });
    }
  });
}
