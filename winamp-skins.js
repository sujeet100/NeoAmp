/* NeoAmp UI — skin subsystem: pickers, gear menu, shortcuts, .wsz classic mode, EQ presets.
 * Split from the former monolithic winamp.js; loaded as content scripts in a fixed
 * order (see manifest). These files SHARE the content-script global scope (same
 * pattern as presets/kit.js → presets/*.js): every top-level var/function is a global,
 * so cross-file references resolve without imports. See CLAUDE.md.
 */
"use strict";

// The skin picker appears in two places (procedural main titlebar + classic
// Now-Playing panel); every instance is registered here so they stay in sync.
var skinSelectors = [];

var DEFAULT_WSZ = "wsz:" + CLASSIC_SKINS[0].id;

var activeSkinValue = DEFAULT_WSZ; // currently applied skin (for reverting the picker)

// A native <select> renders the OS dropdown, which breaks the skin illusion.
// buildSkinSelect() instead returns a beveled button + a custom popup list
// styled like a classic Winamp menu. The returned DOM node exposes a `.value`
// getter/setter and a `.populate()` method so selectSkin/refreshSkinOptions/
// setSkinSelectors keep working against the same array (skinSelectors).
function buildSkinSelect() {
  var label = h("span", { class: "wa-skinsel-label", text: "Skin" });
  var btn = h("div", { class: "wa-skinsel-btn", title: "Skin" }, [
    label,
    h("span", { class: "wa-skinsel-arrow", text: "▾" }),
  ]);
  var menu = h("div", { class: "wa-skinsel-menu" });
  var wrap = h("div", { class: "wa-skinsel" }, [btn, menu]);
  var current = "";
  Object.defineProperty(wrap, "value", {
    get: function () {
      return current;
    },
    set: function (v) {
      current = v;
      var d = CLASSIC_SKINS.filter(function (s) {
        return "wsz:" + s.id === v;
      })[0];
      label.textContent = d ? d.name : "Skin";
    },
  });
  wrap.populate = function () {
    menu.innerHTML = "";
    CLASSIC_SKINS.forEach(function (s) {
      var it = h("div", { class: "wa-skinsel-item", text: s.name + (s.custom ? " ★" : "") });
      it.addEventListener("click", function (e) {
        e.stopPropagation();
        menu.classList.remove("open");
        selectSkin("wsz:" + s.id);
      });
      menu.appendChild(it);
    });
    var load = h("div", { class: "wa-skinsel-item load", text: "＋ Load skin…" });
    load.addEventListener("click", function (e) {
      e.stopPropagation();
      menu.classList.remove("open");
      selectSkin("__load__");
    });
    menu.appendChild(load);
    var more = h("div", {
      class: "wa-skinsel-item load",
      text: "🎨 Get more skins (Skin Museum) →",
    });
    more.addEventListener("click", function (e) {
      e.stopPropagation();
      menu.classList.remove("open");
      selectSkin("__museum__");
    });
    menu.appendChild(more);
  };
  btn.addEventListener("mousedown", function (e) {
    e.stopPropagation();
  }); // don't start a window drag
  btn.addEventListener("click", function (e) {
    e.stopPropagation();
    var willOpen = !menu.classList.contains("open");
    // close any other open picker, then toggle this one
    skinSelectors.forEach(function (w) {
      var m = w.querySelector(".wa-skinsel-menu");
      if (m) m.classList.remove("open");
    });
    if (willOpen) menu.classList.add("open");
  });
  wrap.populate();
  skinSelectors.push(wrap);
  return wrap;
}

function refreshSkinOptions() {
  skinSelectors.forEach(function (w) {
    w.populate();
    w.value = activeSkinValue;
  });
}

function selectSkin(value) {
  if (value === "__load__") {
    openSkinPicker();
    setSkinSelectors(activeSkinValue);
    return;
  }
  // Browse the Winamp Skin Museum in a new tab, then drag the downloaded .wsz onto
  // NeoAmp (or use ＋ Load skin…). We don't hotlink/redistribute museum skins.
  if (value === "__museum__") {
    window.open(MUSEUM_URL, "_blank", "noopener");
    NA.toast("Pick a skin, download the .wsz, then drop it on NeoAmp");
    setSkinSelectors(activeSkinValue);
    return;
  }
  if (value.indexOf("wsz:") === 0) {
    enableClassic(value.slice(4));
    activeSkinValue = value;
  } else {
    disableClassic();
    applySkin(value);
  }
  setSkinSelectors(value);
}

function setSkinSelectors(value) {
  skinSelectors.forEach(function (w) {
    w.value = value;
  });
}

// The ⚙ gear: a themed key (matches the other NP keys) that opens one popup with
// the set-once appearance controls — Background, Zoom, and the Skin list. Registered
// in skinSelectors so the active-skin highlight + populate() stay in sync with the
// rest of the app. Reuses the .wa-skinsel-menu open/close plumbing.
var GEAR_SVG =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.14 12.94a7.6 7.6 0 0 0 0-1.88l2-1.56-1.92-3.32-2.39.96a7.3 7.3 0 0 0-1.62-.94l-.36-2.54h-3.84l-.36 2.54c-.58.24-1.12.56-1.62.94l-2.39-.96L2.27 9.5l2 1.56a7.6 7.6 0 0 0 0 1.88l-2 1.56 1.92 3.32 2.39-.96c.5.38 1.04.7 1.62.94l.36 2.54h3.84l.36-2.54c.58-.24 1.12-.56 1.62-.94l2.39.96 1.92-3.32-2-1.56ZM12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7Z"/></svg>';

// Position the (context-mode) gear wrap at a viewport point — converting to its host's
// local coords through the UI zoom — then open the menu. Used by right-click + the logo.
function openGearAt(gear, clientX, clientY) {
  if (!gear || !gear.openMenu) return;
  var host = gear.offsetParent || gear.parentNode;
  if (!host) return;
  var r = host.getBoundingClientRect(),
    s = uiScale || 1;
  gear.style.left = Math.max(2, (clientX - r.left) / s) + "px";
  gear.style.top = Math.max(2, (clientY - r.top) / s) + "px";
  gear.style.zIndex = String(++zTop); // above the window just raised by the right-click
  gear.openMenu();
}

function buildGearMenu() {
  var btn = h("div", {
    class: "wa-np-tog wa-gear-btn",
    title: "Appearance — background, zoom, skin",
    html: GEAR_SVG,
  });
  var menu = h("div", { class: "wa-skinsel-menu wa-gear-menu" });
  var wrap = h("div", { class: "wa-skinsel wa-gear" }, [btn, menu]);
  var current = "";

  // Background row: click cycles dark → black → off, shows the current mode
  var bgVal = h("span", { class: "wa-gear-val" });
  var bgRow = h(
    "div",
    { class: "wa-gear-row wa-gear-click", title: "Page backdrop behind NeoAmp" },
    [h("span", { class: "wa-gear-k", text: "Background" }), bgVal]
  );
  bgRow.addEventListener("click", function (e) {
    e.stopPropagation();
    cycleBackdrop();
  });
  var updateBg = function () {
    bgVal.textContent = bgMode.toUpperCase();
  };
  els.gearBg = updateBg;

  // Zoom row: − / readout / + (companion to the - = \ keys)
  var zMinus = h("span", { class: "wa-gear-step", title: "Zoom out ( - )", text: "−" });
  var zPlus = h("span", { class: "wa-gear-step", title: "Zoom in ( = )", text: "+" });
  var zVal = h("span", { class: "wa-gear-val wa-gear-zval" });
  zMinus.addEventListener("click", function (e) {
    e.stopPropagation();
    setUiScale(uiScale - 0.05);
  });
  zPlus.addEventListener("click", function (e) {
    e.stopPropagation();
    setUiScale(uiScale + 0.05);
  });
  var zoomCtl = h("span", { class: "wa-gear-zoom" }, [zMinus, zVal, zPlus]);
  var zRow = h("div", { class: "wa-gear-row" }, [
    h("span", { class: "wa-gear-k", text: "Zoom" }),
    zoomCtl,
  ]);
  var updateZoom = function () {
    zVal.textContent = Math.round(uiScale * 100) + "%";
  };
  els.gearZoom = updateZoom;

  function markActive() {
    [].forEach.call(menu.querySelectorAll(".wa-skinsel-item"), function (it) {
      it.classList.toggle("active", it.dataset && it.dataset.val === current);
    });
  }
  Object.defineProperty(wrap, "value", {
    get: function () {
      return current;
    },
    set: function (v) {
      current = v;
      markActive();
    },
  });
  wrap.populate = function () {
    menu.innerHTML = "";
    menu.appendChild(bgRow);
    updateBg();
    menu.appendChild(zRow);
    updateZoom();
    menu.appendChild(h("div", { class: "wa-gear-head", text: "Skin" }));
    CLASSIC_SKINS.forEach(function (s) {
      var it = h("div", { class: "wa-skinsel-item", text: s.name + (s.custom ? " ★" : "") });
      it.dataset.val = "wsz:" + s.id;
      it.addEventListener("click", function (e) {
        e.stopPropagation();
        menu.classList.remove("open");
        selectSkin("wsz:" + s.id);
      });
      menu.appendChild(it);
    });
    var load = h("div", { class: "wa-skinsel-item load", text: "＋ Load skin…" });
    load.addEventListener("click", function (e) {
      e.stopPropagation();
      menu.classList.remove("open");
      selectSkin("__load__");
    });
    menu.appendChild(load);
    var more = h("div", {
      class: "wa-skinsel-item load",
      text: "🎨 Get more skins (Skin Museum) →",
    });
    more.addEventListener("click", function (e) {
      e.stopPropagation();
      menu.classList.remove("open");
      selectSkin("__museum__");
    });
    menu.appendChild(more);
    // keyboard-shortcut reference — the Z/X/C/V/B transport keys are otherwise hidden
    menu.appendChild(h("div", { class: "wa-gear-head", text: "Help" }));
    var keys = h("div", { class: "wa-skinsel-item wa-gear-sc", text: "⌨  Keyboard shortcuts" });
    keys.addEventListener("click", function (e) {
      e.stopPropagation();
      menu.classList.remove("open");
      showShortcuts();
    });
    menu.appendChild(keys);
    markActive();
  };
  // open/close the menu programmatically (used by the right-click + logo triggers)
  wrap.openMenu = function () {
    skinSelectors.forEach(function (w) {
      var m = w.querySelector(".wa-skinsel-menu");
      if (m) m.classList.remove("open");
    });
    updateBg();
    updateZoom();
    menu.classList.add("open");
  };
  wrap.closeMenu = function () {
    menu.classList.remove("open");
  };
  btn.addEventListener("mousedown", function (e) {
    e.stopPropagation();
  }); // don't start a window drag
  btn.addEventListener("click", function (e) {
    e.stopPropagation();
    if (menu.classList.contains("open")) wrap.closeMenu();
    else wrap.openMenu();
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

function scEsc(e) {
  if (e.key === "Escape") {
    e.stopPropagation();
    closeShortcuts();
  }
}

function closeShortcuts() {
  if (!shortcutsEl) return;
  document.removeEventListener("keydown", scEsc, true);
  shortcutsEl.remove();
  shortcutsEl = null;
}

function showShortcuts() {
  if (shortcutsEl) {
    closeShortcuts();
    return;
  } // toggle off if already open
  var list = h(
    "div",
    { class: "neoamp-sc-list" },
    SHORTCUTS.map(function (r) {
      return h("div", { class: "neoamp-sc-row" }, [
        h("kbd", { class: "neoamp-sc-key", text: r[0] }),
        h("span", { class: "neoamp-sc-desc", text: r[1] }),
      ]);
    })
  );
  var close = h("button", {
    class: "neoamp-sc-x",
    title: "Close",
    "aria-label": "Close",
    text: "✕",
  });
  close.addEventListener("click", closeShortcuts);
  var panel = h("div", { class: "neoamp-sc", role: "dialog", "aria-label": "Keyboard shortcuts" }, [
    h("div", { class: "neoamp-sc-h" }, [h("span", { text: "Keyboard shortcuts" }), close]),
    list,
  ]);
  shortcutsEl = h("div", { class: "neoamp-sc-back" }, [panel]);
  shortcutsEl.addEventListener("click", function (e) {
    if (e.target === shortcutsEl) closeShortcuts();
  });
  document.addEventListener("keydown", scEsc, true);
  document.documentElement.appendChild(shortcutsEl);
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
      if (
        !CLASSIC_SKINS.some(function (x) {
          return x.id === s.id;
        })
      ) {
        CLASSIC_SKINS.push({ id: s.id, name: s.name, b64: s.b64, custom: true });
      }
    });
    refreshSkinOptions();
    if (done) done();
  });
}

function persistCustomSkins() {
  var customs = CLASSIC_SKINS.filter(function (s) {
    return s.custom;
  }).map(function (s) {
    return { id: s.id, name: s.name, b64: s.b64 };
  });
  NA.storage.set({ neoampCustomSkins: customs });
}

var skinFileInput = null;

function openSkinPicker() {
  if (!skinFileInput) {
    skinFileInput = h("input", { type: "file", accept: ".wsz,.zip", style: "display:none" });
    skinFileInput.addEventListener("change", function () {
      loadSkinFile(skinFileInput.files[0]);
      skinFileInput.value = "";
    });
    root.appendChild(skinFileInput);
  }
  skinFileInput.click();
}

// Validate + register + apply a dropped/picked .wsz file. Persists it so it
// survives reloads and shows up in the picker (marked ★).
function loadSkinFile(file) {
  if (!file) return;
  var name = file.name.replace(/\.(wsz|zip)$/i, "") || "Custom Skin";
  file
    .arrayBuffer()
    .then(function (buf) {
      return window.NeoAmpClassic.loadSkinFromArrayBuffer(buf).then(function (skin) {
        if (!skin.sheets.MAIN) {
          NA.toast("Not a valid Winamp skin (no MAIN.BMP)");
          return;
        }
        var id =
          "custom-" +
          (name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "") || "skin");
        var b64 = bufToB64(buf);
        var existing = CLASSIC_SKINS.filter(function (s) {
          return s.id === id;
        })[0];
        if (existing) {
          existing.b64 = b64;
          existing.name = name;
          existing.custom = true;
        } else CLASSIC_SKINS.push({ id: id, name: name, b64: b64, custom: true });
        persistCustomSkins();
        refreshSkinOptions();
        enableClassic(id);
        activeSkinValue = "wsz:" + id;
        setSkinSelectors(activeSkinValue);
        NA.toast("Loaded skin: " + name);
      });
    })
    .catch(function (e) {
      NA.toast("Couldn't load skin: " + ((e && e.message) || e));
    });
}

// =========================================================================
// CLASSIC SKIN (.wsz) — real Winamp Main window rendered by wsz.js, shown in
// a chrome-less host window in place of the procedural #wa-main. Opt-in via
// the skin picker; selecting a procedural skin switches back.
// =========================================================================
var classicWin = null,
  classicLoading = false,
  classicEqApi = null,
  classicSkin = null;

function enableClassic(id) {
  if (!window.NeoAmpClassic) {
    NA.toast("Classic skin engine not loaded");
    return;
  }
  var def = null;
  CLASSIC_SKINS.forEach(function (s) {
    if (s.id === id) def = s;
  });
  if (!def || classicLoading) return;

  // host window: no procedural chrome — the skin paints its own titlebar.
  if (!classicWin) {
    var el = h("div", { class: "wa-win wa-skinwin inactive", id: "wa-skin" });
    var drag = h("div", { class: "wa-skin-drag" }); // invisible titlebar grab strip
    el.appendChild(drag);
    // top-left LOGO hotspot → settings menu (the authentic Winamp "system menu" spot).
    // Sits above the drag strip; a hover outline gives modern users the affordance.
    var logoHot = h("div", {
      class: "wa-skin-logo-hot",
      title: "Options — skins, background, zoom & settings",
    });
    logoHot.addEventListener("mousedown", function (e) {
      e.stopPropagation();
    }); // don't start a drag
    logoHot.addEventListener("click", function (e) {
      e.stopPropagation();
      openGearAt(els.gearWrap, e.clientX, e.clientY);
    });
    el.appendChild(logoHot);
    el.addEventListener(
      "mousedown",
      function () {
        raise(el);
      },
      true
    );
    makeDraggable(el, drag);
    root.appendChild(el);
    classicWin = { el: el, body: el, titlebar: drag, drag: drag };
    wins["wa-skin"] = classicWin;
    var d = layout["wa-skin"] || { x: 40, y: 70 };
    el.style.left = (d.x || 40) + "px";
    el.style.top = (d.y || 70) + "px";
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
  skinSourcePromise(def)
    .then(function (skin) {
      classicLoading = false;
      classicSkin = skin;
      if (classicApi) classicApi.destroy();
      classicApi = window.NeoAmpClassic.mountMain(classicWin.el, skin, classicHooks());
      classicWin.drag.style.width = classicApi.dragRegion.w + "px";
      classicWin.drag.style.height = classicApi.dragRegion.h + "px";
      mountClassicEq(skin);
      applyFrame(skin);
      if (wins["wa-np"]) wins["wa-np"].el.style.display = ""; // show NP now it's framed (no black flash)
      dockClassicStack();
      var cur = NA.getTrack();
      if (cur) pushClassicTrack(cur);
      classicApi.setVolume(NA.control.getVolume());
      classicApi.setToggles(isShown("wa-eq-skin"), isShown("wa-pl"));
      syncNpButtons();
    })
    .catch(function (e) {
      classicLoading = false;
      console.error("[NeoAmp] .wsz load failed:", e);
      NA.toast("Skin failed to load: " + ((e && e.message) || e));
      disableClassic();
    });
}

function disableClassic() {
  if (classicApi) {
    classicApi.destroy();
    classicApi = null;
  }
  if (classicEqApi) {
    classicEqApi.destroy();
    classicEqApi = null;
  }
  if (classicWin) classicWin.el.style.display = "none";
  if (wins["wa-np"]) wins["wa-np"].el.style.display = "none";
  if (wins["wa-eq-skin"]) wins["wa-eq-skin"].el.style.display = "none";
  if (wins["wa-main"]) wins["wa-main"].el.style.display = "";
  if (wins["wa-eq"] && els.eqTog)
    wins["wa-eq"].el.style.display = els.eqTog.classList.contains("on") ? "" : "none";
  removeFrame();
}

var GEN_WINDOWS = ["wa-pl", "wa-lib", "wa-viz", "wa-np", "wa-lyrics"];

var GEN_KEYS = {
  TL: "tl",
  GOLD: "gold",
  TR: "tr",
  LEND: "lend",
  CFILL: "cfill",
  REND: "rend",
  ML: "ml",
  MR: "mr",
  BL: "bl",
  BR: "br",
  BFILL: "bfill",
  CLOSE: "close",
};

var PLF_KEYS = {
  TL: "tl",
  TFILL: "tfill",
  TITLE: "title",
  TR: "tr",
  LEFT: "left",
  RIGHT: "right",
  BL: "bl",
  BR: "br",
  BFILL: "bfill",
  CLOSE: "close",
};

function applyFrame(skin) {
  removeFrame();
  var gen = window.NeoAmpClassic.genAssets(skin);
  if (gen) {
    Object.keys(GEN_KEYS).forEach(function (k) {
      root.style.setProperty("--gen-" + GEN_KEYS[k], "url(" + gen[k] + ")");
    });
    GEN_WINDOWS.forEach(function (id) {
      if (wins[id]) wins[id].el.classList.add("wa-genskin");
    });
  } else {
    var pf = window.NeoAmpClassic.pleditFrameAssets(skin);
    if (pf) {
      Object.keys(PLF_KEYS).forEach(function (k) {
        root.style.setProperty("--plf-" + PLF_KEYS[k], "url(" + pf[k] + ")");
      });
      GEN_WINDOWS.forEach(function (id) {
        if (wins[id]) wins[id].el.classList.add("wa-plskin");
      });
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
  GEN_WINDOWS.forEach(function (id) {
    if (wins[id]) {
      wins[id].el.classList.remove("wa-genskin");
      wins[id].el.classList.remove("wa-plskin");
    }
  });
  var s = root.style;
  ["tl", "gold", "tr", "lend", "cfill", "rend", "ml", "mr", "bl", "br", "bfill", "close"].forEach(
    function (k) {
      s.removeProperty("--gen-" + k);
    }
  );
  ["tl", "tfill", "title", "tr", "left", "right", "bl", "br", "bfill", "close"].forEach(
    function (k) {
      s.removeProperty("--plf-" + k);
    }
  );
  ["normal", "current", "normalbg", "selectedbg"].forEach(function (k) {
    s.removeProperty("--pl-" + k);
  });
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
    els.eqSliders.forEach(function (sl, i) {
      sl.value = String(i === 0 ? 0 : p.bands[i - 1] || 0);
    });
    drawEqCurve();
  }
}

// dropdown off the classic EQ window's PRESETS button (toggle on repeat click)
function showEqPresetsMenu(w) {
  var open = w.el.querySelector(".wa-eqpre-menu");
  if (open) {
    open.remove();
    return;
  }
  var menu = h("div", { class: "wa-eqpre-menu" });
  menu.style.cssText =
    "position:absolute; top:62px; right:12px; z-index:10; background:#10142e; border:1px solid #d8b863; border-radius:3px; padding:3px; max-height:200px; overflow:auto; box-shadow:0 4px 14px rgba(0,0,0,.6); font:11px/1.5 'Arial Narrow','Helvetica Neue',Arial,sans-serif;";
  EQ_PRESETS.forEach(function (p) {
    var it = h("div", { text: p.name });
    it.style.cssText =
      "padding:2px 12px; color:#f0d182; cursor:pointer; white-space:nowrap; border-radius:2px;";
    it.addEventListener("mouseenter", function () {
      it.style.background = "#2a2f55";
      it.style.color = "#fff7dc";
    });
    it.addEventListener("mouseleave", function () {
      it.style.background = "";
      it.style.color = "#f0d182";
    });
    it.addEventListener("mousedown", function (e) {
      e.stopPropagation();
    });
    it.addEventListener("click", function (e) {
      e.stopPropagation();
      applyEqPreset(p);
      menu.remove();
    });
    menu.appendChild(it);
  });
  w.el.appendChild(menu);
  setTimeout(function () {
    var close = function (ev) {
      if (!menu.contains(ev.target)) {
        menu.remove();
        document.removeEventListener("mousedown", close, true);
      }
    };
    document.addEventListener("mousedown", close, true);
  }, 0);
}

function mountClassicEq(skin) {
  var w = wins["wa-eq-skin"];
  if (!w) {
    var el = h("div", { class: "wa-win wa-skinwin inactive", id: "wa-eq-skin" });
    var drag = h("div", { class: "wa-skin-drag" });
    el.appendChild(drag);
    el.addEventListener(
      "mousedown",
      function () {
        raise(el);
      },
      true
    );
    makeDraggable(el, drag);
    el.style.display = "none";
    root.appendChild(el);
    w = wins["wa-eq-skin"] = { el: el, body: el, titlebar: drag, drag: drag };
    // position is set by dockClassicStack() (flush below the Now-Playing panel)
  }
  if (classicEqApi) classicEqApi.destroy();
  classicEqApi = window.NeoAmpClassic.mountEq(w.el, skin, {
    initial: NA.control.getEqState ? NA.control.getEqState() : null,
    onBand: function (i, db) {
      NA.control.setEqBand(i, db);
    },
    onPreamp: function (db) {
      NA.control.setPreamp(db);
    },
    onEnabled: function (on) {
      NA.control.setEqEnabled(on);
    },
    onPresets: function () {
      showEqPresetsMenu(w);
    },
    onClose: function () {
      w.el.style.display = "none";
      classicApi && classicApi.setToggles(false, isShown("wa-pl"));
    },
  });
  w.drag.style.width = classicEqApi.dragRegion.w + "px";
  w.drag.style.height = classicEqApi.dragRegion.h + "px";
}

// Dock the classic stack flush, top to bottom: Main → Now-Playing → EQ →
// Playlist → Library (each shown one sits directly under the previous one).
function dockClassicStack() {
  var m = classicWin && classicWin.el;
  if (!m) return;
  var prev = m;
  ["wa-np", "wa-eq-skin", "wa-pl", "wa-lib"].forEach(function (id) {
    var w = wins[id];
    if (!w || w.el.style.display === "none") return;
    w.el.style.left = prev.offsetLeft + "px";
    w.el.style.top = prev.offsetTop + prev.offsetHeight + "px";
    prev = w.el;
  });
}

function classicHooks() {
  return {
    onPrev: function () {
      NA.control.prev();
    },
    onPlay: function () {
      NA.control.playPause();
    },
    onPause: function () {
      NA.control.playPause();
    },
    onStop: function () {
      NA.control.stop();
    },
    onNext: function () {
      NA.control.next();
    },
    onEject: function () {
      focusYtSearch();
    },
    onSeek: function (t) {
      NA.control.seek(t);
    },
    onVolume: function (v) {
      NA.control.setVolume(v);
      if (els.vol) {
        els.vol.value = String(Math.round(v * 100));
        paintRange(els.vol);
      }
      syncVolUi();
    },
    balance: NA.control.getEqState ? NA.control.getEqState().balance : 0,
    onBalance: function (x) {
      NA.control.setBalance(x);
      if (els.bal) {
        els.bal.value = String(Math.round(x * 100));
        paintRange(els.bal);
      }
    },
    onShuffle: function () {
      transportToggleAt = Date.now();
      NA.control.toggleShuffle();
    },
    onRepeat: function () {
      transportToggleAt = Date.now();
      NA.control.toggleRepeat();
    },
    onToggleEq: function () {
      toggleWin("wa-eq-skin");
      dockClassicStack();
      classicApi && classicApi.setToggles(isShown("wa-eq-skin"), isShown("wa-pl"));
    },
    onTogglePl: function () {
      toggleWin("wa-pl", els.plTog);
      refreshQueue(true);
      dockClassicStack();
      classicApi && classicApi.setToggles(isShown("wa-eq-skin"), isShown("wa-pl"));
    },
    onToggleViz: function () {
      toggleWin("wa-viz", els.visTog);
    },
    onClose: function () {
      NA.stop();
    },
  };
}

// =========================================================================
// skins
// =========================================================================
function applySkin(id) {
  if (!window.NeoAmpSkins) return;
  currentSkin = window.NeoAmpSkins.apply(root, id);
  NA.storage.set({ neoampSkin: currentSkin });
}

// drag a .wsz onto the player to load it (classic, Winamp-style gesture)
function setupSkinDrop() {
  root.addEventListener("dragover", function (e) {
    if (
      e.dataTransfer &&
      Array.prototype.some.call(e.dataTransfer.items || [], function (i) {
        return i.kind === "file";
      })
    ) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    }
  });
  root.addEventListener("drop", function (e) {
    var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (f && /\.(wsz|zip)$/i.test(f.name)) {
      e.preventDefault();
      loadSkinFile(f);
    }
  });
}
