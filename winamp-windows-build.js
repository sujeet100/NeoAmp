/* NeoAmp UI — window constructors: Main / EQ / Visualization / Playlist / Library / Now-Playing.
 * Split from the former monolithic winamp.js; loaded as content scripts in a fixed
 * order (see manifest). These files SHARE the content-script global scope (same
 * pattern as presets/kit.js → presets/*.js): every top-level var/function is a global,
 * so cross-file references resolve without imports. See CLAUDE.md.
 */
"use strict";

// =========================================================================
// MAIN WINDOW
// =========================================================================
function buildMain() {
  // skin picker gadget in the titlebar (a second copy lives on the Now-Playing
  // panel for classic mode, where this window is hidden — see buildSkinSelect)
  var skinSel = buildSkinSelect();
  skinSel.value = DEFAULT_WSZ;

  var win = makeWindow("wa-main", "NeoAmp", {
    gadget: skinSel,
    onClose: function () {
      NA.stop();
    },
  });
  // the ◢◤ logo doubles as the system-menu / settings opener (Winamp convention)
  var mainLogo = win.titlebar.querySelector(".wa-logo");
  if (mainLogo) {
    mainLogo.classList.add("wa-logo-hot");
    mainLogo.title = "Options — skins, background, zoom & settings";
    mainLogo.addEventListener("mousedown", function (e) {
      e.stopPropagation();
    });
    mainLogo.addEventListener("click", function (e) {
      e.stopPropagation();
      openGearAt(els.gearWrap, e.clientX, e.clientY);
    });
  }

  // left column: clock + album art
  els.clock = h("div", { class: "wa-clock wa-lcd", text: "0:00" });
  var artImg = h("img", { alt: "" });
  artImg.addEventListener("error", function () {
    if (els.art) els.art.classList.add("empty");
  });
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
    (function () {
      var s = h("span", { class: "on", text: "stereo" });
      return s;
    })(),
  ]);
  var bitbox = h("div", { class: "wa-bitbox" }, [bitline, els.stereo]);
  var midrow = h("div", { class: "wa-midrow" }, [
    h("div", { class: "wa-inset" }, [els.analyzer]),
    h("div", { class: "wa-inset" }, [bitbox]),
  ]);

  els.seek = h("input", {
    class: "wa-range",
    type: "range",
    min: "0",
    max: "1000",
    value: "0",
    title: "Seek",
  });
  var posbar = h("div", { class: "wa-posbar wa-inset" }, [els.seek]);

  var rcol = h("div", { class: "wa-rcol" }, [marqueeBox, midrow, posbar]);

  var grid = h("div", { class: "wa-main-grid" }, [leftCol, rcol]);

  // transport row
  function tbtn(name, title, fn) {
    var b = h("button", { class: "wa-btn", title: title, html: icon(name) });
    b.addEventListener("click", fn);
    return b;
  }
  els.playBtn = tbtn("play", "Play / Pause (Space)", function () {
    NA.control.playPause();
  });
  var transport = h("div", { class: "wa-transport" }, [
    tbtn("prev", "Previous", function () {
      NA.control.prev();
    }),
    els.playBtn,
    tbtn("stop", "Stop", function () {
      NA.control.stop();
    }),
    tbtn("next", "Next", function () {
      NA.control.next();
    }),
    tbtn("eject", "Search YouTube Music", function () {
      focusYtSearch();
    }),
  ]);

  els.vol = h("input", {
    class: "wa-range wa-vol",
    type: "range",
    min: "0",
    max: "100",
    value: "100",
    title: "Volume",
  });
  els.bal = h("input", {
    class: "wa-range wa-bal",
    type: "range",
    min: "-100",
    max: "100",
    value: "0",
    title: "Balance",
  });
  // numeric volume readout (the MUTE button itself lives in the universal NP strip so
  // it's visible on .wsz skins too, where this procedural main window is hidden).
  els.volNum = h("span", { class: "wa-vol-readout wa-lcd", text: "100", title: "Volume" });
  els.vol.addEventListener("input", function () {
    NA.control.setVolume(+els.vol.value / 100);
    paintRange(els.vol);
    syncVolUi();
  });
  els.bal.addEventListener("input", function () {
    NA.control.setBalance(+els.bal.value / 100);
    paintRange(els.bal);
  });
  var vols = h("div", { class: "wa-vols" }, [els.vol, els.volNum, els.bal]);

  function tog(label, title, fn) {
    var t = h("div", { class: "wa-tog", title: title, text: label });
    t.addEventListener("click", function () {
      fn(t);
    });
    return t;
  }
  els.shuffleTog = tog("SHUF", "Shuffle", function (t) {
    transportToggleAt = Date.now();
    t.classList.toggle("on");
    NA.control.toggleShuffle();
  });
  els.repeatTog = tog("REP", "Repeat", function (t) {
    transportToggleAt = Date.now();
    t.classList.toggle("on");
    NA.control.toggleRepeat();
  });
  els.eqTog = tog("EQ", "Toggle equalizer", function (t) {
    toggleWin("wa-eq", t);
  });
  els.plTog = tog("PL", "Toggle playlist", function (t) {
    toggleWin("wa-pl", t);
    refreshQueue(true);
  });
  els.visTog = tog("VIS", "Toggle visualization", function (t) {
    toggleWin("wa-viz", t);
  });
  els.libTog = tog("LIB", "Library / search", function (t) {
    toggleLibrary(t);
  });
  var toggles = h("div", { class: "wa-toggles" }, [
    els.shuffleTog,
    els.repeatTog,
    els.eqTog,
    els.plTog,
    els.visTog,
    els.libTog,
  ]);

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
    var pct = (+els.seek.value - +els.seek.min) / (+els.seek.max - +els.seek.min || 1);
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
  if (NA.control.getEqState)
    els.bal.value = String(Math.round(NA.control.getEqState().balance * 100));
  [els.seek, els.vol, els.bal].forEach(paintRange);
  syncVolUi();
}

// keep the volume readout + mute lamp in sync with the live control state (the slider
// auto-unmutes on raise, the keyboard can mute, etc. — one place reflects all of it).
function syncVolUi() {
  if (els.volNum)
    els.volNum.textContent = String(
      Math.round((NA.control.getVolume ? NA.control.getVolume() : +els.vol.value / 100) * 100)
    );
  if (els.mute && NA.control.isMuted) els.mute.classList.toggle("on", NA.control.isMuted());
}

// paint the filled portion of a native range track (it doesn't fill itself)
function paintRange(input) {
  var min = +input.min,
    max = +input.max,
    v = +input.value;
  var pct = max > min ? ((v - min) / (max - min)) * 100 : 0;
  input.style.background =
    "linear-gradient(90deg, var(--wa-accent) " +
    pct +
    "%, transparent " +
    pct +
    "%), var(--wa-track-bg)";
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
    b.addEventListener("mousedown", function (e) {
      e.stopPropagation();
    }); // don't start a drag
    b.addEventListener("click", function (e) {
      e.stopPropagation();
      if (id === "wa-lib") {
        toggleLibrary(b);
        if (classicApi) dockClassicStack();
        return;
      } // library OR site-search
      toggleWin(id);
      b.classList.toggle("on", isShown(id));
      if (classicApi) dockClassicStack(); // re-dock LIB into the stack (no-op for VIS)
      if (after) after();
    });
    els["np" + label] = b;
    return b;
  }
  // like / dislike the current track (the main window has no such control).
  // Crisp inline-SVG icons (heart / thumbs-down) so they stay sharp + monochrome.
  // Heart carries an amber gradient + LED-scanline PATTERN in <defs>; when liked, the CSS
  // fills the path with url(#likeScan) (a lit amber-LED-display look) instead of a flat colour.
  // Off-state inherits the translucent key-fg from .wa-rate-btn svg (path has no own fill).
  var HEART_SVG =
    '<svg viewBox="0 0 24 24" aria-hidden="true">' +
    "<defs>" +
    '<radialGradient id="likeAmberGrad" cx="50%" cy="34%" r="72%">' +
    '<stop offset="0%" stop-color="#ffe39c"/>' +
    '<stop offset="50%" stop-color="#f4a92f"/>' +
    '<stop offset="100%" stop-color="#bf7011"/>' +
    "</radialGradient>" +
    '<pattern id="likeScan" width="4" height="3.4" patternUnits="userSpaceOnUse">' +
    '<rect width="4" height="3.4" fill="url(#likeAmberGrad)"/>' +
    '<rect width="4" height="1.1" fill="rgba(40,20,0,0.5)"/>' +
    "</pattern>" +
    "</defs>" +
    '<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>' +
    "</svg>";
  var THUMBDOWN_SVG =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path transform="rotate(180 12 12)" d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/></svg>';
  function rateBtn(svg, title, kind) {
    var b = h("div", {
      class: "wa-np-tog wa-rate-btn " + (kind === "dislike" ? "wa-dislike" : "wa-like"),
      title: title,
      html: svg,
    });
    b.addEventListener("mousedown", function (e) {
      e.stopPropagation();
    });
    b.addEventListener("click", function (e) {
      e.stopPropagation();
      if (NA.control[kind]) NA.control[kind]();
    });
    els[kind === "dislike" ? "npDislike" : "npLike"] = b;
    return b;
  }
  var rate = h("div", { class: "wa-np-rate" }, [
    rateBtn(HEART_SVG, "Like this track", "like"),
    rateBtn(THUMBDOWN_SVG, "Dislike this track", "dislike"),
  ]);
  // MUTE — universal (the procedural main window is hidden on .wsz skins, so the
  // canonical mute lives here). One SVG carries both states; CSS swaps wave↔✕ via .on.
  var SPEAKER_SVG =
    '<svg viewBox="0 0 24 24" aria-hidden="true">' +
    '<path d="M3 9v6h4l5 5V4L7 9H3z"/>' +
    '<path class="wa-spk-wave" d="M15.5 8.6a5 5 0 010 6.8" fill="none" stroke="currentColor" stroke-width="2"/>' +
    '<path class="wa-spk-x" d="M16 9.5l5 5m0-5l-5 5" fill="none" stroke="currentColor" stroke-width="2"/></svg>';
  els.mute = h("div", { class: "wa-np-tog wa-np-mute", title: "Mute (M)", html: SPEAKER_SVG });
  els.mute.addEventListener("mousedown", function (e) {
    e.stopPropagation();
  });
  els.mute.addEventListener("click", function (e) {
    e.stopPropagation();
    if (NA.control.setMute) els.mute.classList.toggle("on", NA.control.setMute());
  });
  if (NA.control.isMuted && NA.control.isMuted()) els.mute.classList.add("on");
  // Decluttered: the strip keeps only the often-used controls (like/dislike + the
  // VIS/LIB window toggles). The set-once appearance controls — Background, Zoom and
  // Skin — moved behind the ⚙ gear menu so the now-playing bar reads cleanly.
  var toggles = h("div", { class: "wa-np-toggles" }, [
    npBtn("VIS", "Show/hide the visualization window", "wa-viz"),
    npBtn("LIB", "Show/hide the library / search window", "wa-lib", function () {
      if (isShown("wa-lib")) libBecameVisible();
    }),
    npBtn("LYR", "Show/hide the lyrics window", "wa-lyrics", maybeLoadLyrics),
  ]);
  // Settings menu (Background/Zoom/Skin/Shortcuts) is no longer a gear button cluttering
  // the strip — it opens on RIGHT-CLICK of the now-playing bar (and via the skin's logo,
  // wired in the main window), the authentic Winamp pattern. The gear wrap is kept as the
  // menu host (its button hidden via .wa-gear-ctx) so all its populate/positioning works.
  var gear = buildGearMenu();
  gear.classList.add("wa-gear-ctx");
  els.gearWrap = gear; // the skin logo + the global right-click both open this menu
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
  img.addEventListener("error", function () {
    el.classList.add("empty");
    img.removeAttribute("src");
  });
  el.addEventListener(
    "mousedown",
    function () {
      raise(el);
    },
    true
  );
  makeDraggable(el, el);
  root.appendChild(el);
  wins["wa-np"] = { el: el, body: el, titlebar: el, img: img };
  applyCapabilities(); // buttons now exist — hide controls the active provider lacks
}

function pushNowPlaying(t) {
  var w = wins["wa-np"];
  if (!w) return;
  var hasArt = !!(t.art && /^https?:\/\//.test(t.art));
  if (hasArt) {
    if (w.img.src !== t.art) w.img.src = t.art;
  } else w.img.removeAttribute("src");
  w.el.classList.toggle("empty", !hasArt);
  if (els.npTitleTrack) runMarquee(els.npTitleTrack, t.title || "—"); // scroll long titles, Winamp-style
  if (els.npArtist) els.npArtist.textContent = t.artist || "";
  // album + year on one line (filtered so it's never a stray " • " when absent)
  if (els.npAlbum) els.npAlbum.textContent = [t.album, t.year].filter(Boolean).join("  •  ");
  if (els.npLike) els.npLike.classList.toggle("on", t.likeStatus === "LIKE");
  if (els.npDislike) els.npDislike.classList.toggle("on", t.likeStatus === "DISLIKE");
}

// =========================================================================
// EQUALIZER WINDOW (cosmetic — sliders move but don't filter audio yet)
// =========================================================================
function buildEq() {
  var win = makeWindow("wa-eq", "Equalizer", {
    onClose: function () {
      hideWin("wa-eq");
    },
  });
  var es = NA.control.getEqState
    ? NA.control.getEqState()
    : { enabled: true, preamp: 0, bands: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] };
  var curve = h("canvas", { class: "wa-eq-curve wa-inset", width: "300", height: "56" });
  var onTog = h("div", { class: "wa-tog" + (es.enabled ? " on" : ""), text: "ON" });
  var autoTog = h("div", { class: "wa-tog", text: "AUTO" });
  onTog.addEventListener("click", function () {
    onTog.classList.toggle("on");
    NA.control.setEqEnabled(onTog.classList.contains("on"));
  });
  autoTog.addEventListener("click", function () {
    autoTog.classList.toggle("on");
  }); // AUTO (auto-preamp) stays cosmetic
  var top = h("div", { class: "wa-eq-top" }, [onTog, autoTog, curve]);

  var labels = ["PRE", "60", "170", "310", "600", "1K", "3K", "6K", "12K", "14K", "16K"];
  var bands = h("div", { class: "wa-eq-bands" });
  els.eqSliders = [];
  labels.forEach(function (lab, idx) {
    var initVal = idx === 0 ? es.preamp : es.bands[idx - 1] || 0; // idx 0 = preamp, 1..10 = bands
    var sl = h("input", {
      class: "wa-vrange",
      type: "range",
      min: "-12",
      max: "12",
      value: String(initVal),
    });
    sl.addEventListener("input", function () {
      var v = +sl.value;
      if (idx === 0) NA.control.setPreamp(v);
      else NA.control.setEqBand(idx - 1, v);
      drawEqCurve();
    });
    els.eqSliders.push(sl);
    bands.appendChild(
      h("div", { class: "wa-eq-band" }, [sl, h("div", { class: "wa-eq-label", text: lab })])
    );
  });
  win.body.appendChild(top);
  win.body.appendChild(bands);
  els.eqCurve = curve;
  drawEqCurve();
}

function drawEqCurve() {
  var c = els.eqCurve;
  if (!c) return;
  var g = c.getContext("2d");
  var W = c.width,
    H = c.height;
  g.clearRect(0, 0, W, H);
  var vals = els.eqSliders.slice(1).map(function (s) {
    return +s.value;
  }); // skip preamp
  g.strokeStyle = cssVar("--wa-accent") || "#16e651";
  g.lineWidth = 2;
  g.shadowColor = g.strokeStyle;
  g.shadowBlur = 6;
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
  var FS_SVG =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3h7v2.4H5.4V10H3V3zm11 0h7v7h-2.4V5.4H14V3zM5.4 14H3v7h7v-2.4H5.4V14zm13.2 0H21v7h-7v-2.4h4.6V14z"/></svg>';
  var win = makeWindow("wa-viz", "Visualization", {
    shade: false,
    titleButtons: [
      {
        html: FS_SVG,
        cls: "wa-fsbtn",
        title: "Fullscreen (Esc to exit)",
        onClick: toggleVizFullscreen,
      },
    ],
    onClose: function () {
      hideWin("wa-viz");
    },
  });
  vizFrame = h("iframe", {
    class: "wa-viz-frame",
    src: chrome.runtime.getURL("viz.html"),
    frameborder: "0",
    allowtransparency: "false",
    title: "NeoAmp visualizer",
  });
  vizFrame.style.border = "0";
  vizFrame.style.outline = "none";
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

// =========================================================================
// PLAYLIST WINDOW (mirrors YTM's "Up Next" queue)
// =========================================================================
function buildPlaylist() {
  var win = makeWindow("wa-pl", "Playlist", {
    onClose: function () {
      hideWin("wa-pl");
    },
  });
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
    setTimeout(function () {
      refreshQueue(true, true);
    }, 700);
  }
  var sig = q
    .map(function (x) {
      return (x.playing ? "*" : "") + (x.art ? "a" : "") + x.title;
    })
    .join("|");
  if (!force && sig === plSig) return;
  plSig = sig;
  els.plList.innerHTML = "";
  if (!q.length) {
    var caps = (NA.control.getCapabilities && NA.control.getCapabilities()) || {};
    els.plList.appendChild(
      h("div", {
        class: "wa-pl-empty",
        text:
          caps.queue === false
            ? "Live queue mirroring isn't available on this site — use its own queue. NeoAmp still gives you the EQ + visualizer."
            : "Queue empty — play a track or open Up Next in YouTube Music.",
      })
    );
  } else {
    q.forEach(function (item) {
      var thumb = makeThumb("wa-pl-thumb", item.art);
      var row = h("div", { class: "wa-pl-row" + (item.playing ? " playing" : "") }, [
        h("span", { class: "wa-pl-n", text: item.index + 1 + "." }),
        thumb,
        h("span", {
          class: "wa-pl-t",
          text: item.title + (item.artist ? " - " + item.artist : ""),
        }),
        item.plays ? h("span", { class: "wa-pl-plays", text: item.plays }) : null,
        h("span", { class: "wa-pl-d", text: item.duration || "" }),
      ]);
      row.title = "Double-click to play";
      row.addEventListener("dblclick", function () {
        NA.control.playQueueItem(item.index);
        setTimeout(function () {
          refreshQueue(true);
        }, 450);
      });
      els.plList.appendChild(row);
      if (item.playing)
        requestAnimationFrame(function () {
          row.scrollIntoView({ block: "nearest" });
        });
    });
  }
  if (els.plCount) els.plCount.textContent = q.length + (q.length === 1 ? " item" : " items");
}

// =========================================================================
// MEDIA LIBRARY WINDOW (search YTM → sectioned results → play)
// =========================================================================
function buildLibrary() {
  var win = makeWindow("wa-lib", "Media Library", {
    onClose: function () {
      hideWin("wa-lib");
    },
  });
  var input = h("input", {
    class: "wa-lib-input",
    type: "text",
    placeholder: "Search songs, artists, albums…",
  });
  var go = h("button", { class: "wa-lib-go", text: "GO" });
  var home = h("button", {
    class: "wa-lib-go wa-lib-home",
    title: "Quick Picks & Listen Again",
    text: "HOME",
  });
  var list = h("div", { class: "wa-lib-list" });
  var status = h("div", {
    class: "wa-lib-status",
    text: "Search, or HOME for Quick Picks & Listen Again.",
  });
  home.addEventListener("click", function () {
    loadHome(true);
  });
  win.body.appendChild(h("div", { class: "wa-lib-bar" }, [input, go, home]));
  win.body.appendChild(list);
  win.body.appendChild(status);
  els.libInput = input;
  els.libList = list;
  els.libStatus = status;

  var run = function () {
    var qy = input.value.trim();
    if (!qy) return;
    status.textContent = "Searching “" + qy + "” …";
    list.innerHTML = "";
    NA.search(qy, renderResults);
  };
  go.addEventListener("click", run);
  // keep keystrokes inside the field (don't let page/global handlers grab them)
  input.addEventListener("keydown", function (e) {
    e.stopPropagation();
    if (e.key === "Enter") run();
  });
  input.addEventListener("keyup", function (e) {
    e.stopPropagation();
  });

  var rs = h("div", { class: "wa-resize", title: "Resize" });
  win.el.appendChild(rs);
  makeResizable(win.el, rs, 260, 180);
}
