/* NeoAmp UI — entry point + all load-time wiring (gated, runs once).
 * Split from the former monolithic winamp.js; loaded as content scripts in a fixed
 * order (see manifest). These files SHARE the content-script global scope (same
 * pattern as presets/kit.js → presets/*.js): every top-level var/function is a global,
 * so cross-file references resolve without imports. See CLAUDE.md.
 */
"use strict";

function buildUI() {
  if (root) return;
  root = h("div", { id: "neoamp-root" });
  document.documentElement.appendChild(root);
  // GLOBAL right-click → settings menu, over ANY NeoAmp window (events bubble up from the
  // pointer-events:auto windows through the root). Text fields + the open menu keep their
  // native behaviour. The menu is a root-level host so it pops at the cursor anywhere.
  root.addEventListener("contextmenu", function (e) {
    if (
      e.target.closest &&
      e.target.closest("input, textarea, [contenteditable], .wa-skinsel-menu")
    )
      return;
    e.preventDefault();
    openGearAt(els.gearWrap, e.clientX, e.clientY);
  });
  ensureBackdrop();
  NA.storage.get("neoampBg", function (m) {
    if (m && BG_MODES.indexOf(m) >= 0) bgMode = m;
    applyBackdrop();
  });
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
  NA.storage.get("neoampLayout", function (l) {
    layout = l || {};
    applyLayout();
    syncToggles();
  });
  NA.storage.get("neoampZoom", function (z) {
    z = parseFloat(z);
    if (z && z >= 0.5 && z < 1) {
      uiScale = z;
      applyUiScale();
    }
  });
  setupSkinDrop();
  // load user-saved skins first so a persisted custom skin id resolves
  loadPersistedSkins(function () {
    NA.storage.get("neoampSkin", function (id) {
      // procedural skins are retired — default to (and coerce legacy ids onto) a .wsz skin
      if (
        !id ||
        id.indexOf("wsz:") !== 0 ||
        !CLASSIC_SKINS.some(function (s) {
          return "wsz:" + s.id === id;
        })
      )
        id = DEFAULT_WSZ;
      activeSkinValue = id;
      enableClassic(id.slice(4));
      setSkinSelectors(id);
    });
  });
}

function showUI() {
  buildUI();
  applyCapabilities();
  root.style.display = "";
  // backdrop lives on documentElement (zoom-immune), so toggle it with the player
  var bd = document.getElementById("neoamp-backdrop");
  if (bd) bd.style.visibility = "";
  if (launcher) launcher.style.display = "none";
  var cur = NA.getTrack();
  if (cur) onTrack(cur);
  buttonizeAll(); // give the freshly-built chrome button semantics
  // auto-buttonize controls added to dynamic containers later (queue refresh,
  // search/home results, skin-menu re-populate)
  var dyn = [els.libList];
  [].forEach.call(root.querySelectorAll(".wa-skinsel-menu"), function (m) {
    dyn.push(m);
  });
  dyn.forEach(function (c) {
    if (c && !c.__a11yObs) {
      c.__a11yObs = true;
      new MutationObserver(function () {
        buttonizeAll(c);
      }).observe(c, { childList: true });
    }
  });
}

function hideUI() {
  if (root) root.style.display = "none";
  var bd = document.getElementById("neoamp-backdrop");
  if (bd) bd.style.visibility = "hidden";
  if (launcher) launcher.style.display = "";
}

// ---- launcher + keyboard -------------------------------------------------
function ensureLauncher() {
  if (document.getElementById("neoamp-launch")) return;
  // During the real-EQ rebuild this button toggles the EQ capture (relayed to the
  // service worker, which owns the gesture-gated tabCapture). It will fold back into
  // the full player launch once the EQ is integrated.
  launcher = h("button", {
    id: "neoamp-launch",
    title: "Open NeoAmp — click the gold ‘N’ toolbar icon, or press ⌘⇧E (Ctrl+Shift+E)",
    text: "◢◤ NeoAmp",
  });
  // a webpage button can't start tab-capture (Chrome security) — the gold "N"
  // toolbar icon (or right-click) can. Guide the user there.
  launcher.addEventListener("click", function () {
    NA.toast("To open NeoAmp: click the gold “N” toolbar icon, or press ⌘⇧E (Ctrl+Shift+E).");
  });
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
      h("div", {
        class: "neoamp-onboard-b",
        html:
          "To open: click the gold <b>N</b> toolbar icon, or press <b>⌘⇧E</b> (Ctrl+Shift+E)." +
          "<br>While running: <b>Z</b> prev · <b>X</b> play · <b>C</b> pause · <b>V</b> stop · <b>B</b> next · <b>Space</b> play/pause.",
      }),
    ]);
    var ok = h("button", { class: "neoamp-onboard-ok", text: "Got it" });
    ok.addEventListener("click", function () {
      card.remove();
      NA.storage.set({ neoampOnboarded: 1 });
    });
    card.appendChild(ok);
    document.documentElement.appendChild(card);
  });
}

// Load-time side-effects run ONCE: gated on the dedup flag + backend presence
// (replaces the original top-level early-return guards, illegal at global scope).
if (NA && !window.__neoampUiLoaded) {
  window.__neoampUiLoaded = true;

  window.addEventListener("resize", function () {
    clearTimeout(clampTimer);
    clampTimer = setTimeout(function () {
      clampWindowsIntoView();
      saveLayout();
    }, 150);
  });

  // click anywhere else closes open skin menus
  document.addEventListener("click", function () {
    skinSelectors.forEach(function (w) {
      var m = w.querySelector(".wa-skinsel-menu");
      if (m) m.classList.remove("open");
    });
  });

  document.addEventListener("fullscreenchange", function () {
    var el = wins["wa-viz"] && wins["wa-viz"].el;
    if (el) el.classList.toggle("wa-fs", document.fullscreenElement === el);
    setTimeout(function () {
      postViz({ type: "resize" });
    }, 80);
  });

  window.addEventListener("message", function (e) {
    if (!vizFrame || e.source !== vizFrame.contentWindow) return;
    var m = e.data || {};
    if (!m.__wmp) return;
    if (m.type === "ready") {
      // Establish a PRIVATE command channel to the sandboxed iframe. The 'ready' message is
      // source-verified (e.source === vizFrame.contentWindow above — a page script can't forge
      // that), so this handshake is trustworthy. The transferred port is reachable only by the
      // iframe + us, so a malicious host-page script (which shares our window) can no longer
      // forge visualizer commands via window.postMessage. postViz() switches to vizPort.
      try {
        if (window.MessageChannel && vizFrame && vizFrame.contentWindow) {
          var ch = new MessageChannel();
          vizFrame.contentWindow.postMessage({ __wmp: true, __port: 1 }, "*", [ch.port2]);
          vizPort = ch.port1;
        }
      } catch (_) {
        vizPort = null;
      }
      NA.storage.get("neoampFavorites", function (names) {
        postViz({ type: "favorites:init", names: names || [] });
      });
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

  // Enter / Space activate any of our role=button divs (native buttons do this on their
  // own). Capturing so it beats YTM; Space is prevented from scrolling the page.
  document.addEventListener(
    "keydown",
    function (e) {
      if (e.key !== "Enter" && e.key !== " " && e.key !== "Spacebar") return;
      var el = e.target;
      if (!el || !el.getAttribute || el.getAttribute("role") !== "button") return;
      e.preventDefault();
      e.stopPropagation();
      // library rows play on dblclick (plain song rows have no click handler), so keyboard
      // activation must synthesize a dblclick — el.click() alone wouldn't play them.
      if (el.classList.contains("wa-lib-row"))
        el.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
      else el.click();
    },
    true
  );

  NA.on("start", showUI);

  NA.on("stop", hideUI);

  // Shift+V CLOSES NeoAmp when running. A page script can't START tabCapture (Chrome's
  // gesture rule), so when closed it can't open the player — it just shows the how-to-
  // open hint (startHint). The classic Winamp transport keys (Z X C V B, Space, arrows,
  // L) are active only while NeoAmp is running, so they don't hijack YTM when closed.
  // Guarded against text fields
  // + modifier combos; handled keys preventDefault + stopPropagation so YTM's own
  // shortcut (Space/arrows) doesn't also fire and double-toggle.
  window.addEventListener(
    "keydown",
    function (e) {
      var tgt = e.target;
      // bail for text fields AND our focusable role=button controls (so Enter/Space/letters
      // activate the focused button instead of firing a transport shortcut)
      if (
        tgt &&
        (/^(INPUT|TEXTAREA|SELECT)$/.test(tgt.tagName) ||
          tgt.isContentEditable ||
          (tgt.getAttribute && tgt.getAttribute("role") === "button"))
      )
        return;
      if (e.shiftKey && (e.key === "V" || e.key === "v")) {
        e.preventDefault();
        NA.isRunning() ? NA.stop() : NA.start();
        return;
      }
      // Shift excluded too (Shift+V handled above); CapsLock letters still work (shiftKey false)
      if (!NA.isRunning() || e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;
      var c = NA.control,
        handled = true;
      switch (e.key) {
        case "z":
        case "Z":
          c.prev();
          break;
        case "x":
        case "X":
          c.play();
          break;
        case "c":
        case "C":
          c.pause();
          break;
        case "v":
        case "V":
          c.stop();
          break; // plain V (Shift+V returned above)
        case "b":
        case "B":
          c.next();
          break;
        case " ":
          c.playPause();
          break;
        case "ArrowRight":
          c.seekBy(5);
          break;
        case "ArrowLeft":
          c.seekBy(-5);
          break;
        case "ArrowUp":
          c.nudgeVolume(0.05);
          syncVolUi();
          break;
        case "ArrowDown":
          c.nudgeVolume(-0.05);
          syncVolUi();
          break;
        case "m":
        case "M":
          if (c.setMute) {
            c.setMute();
            syncVolUi();
          }
          break;
        case "l":
        case "L":
          focusLibrary();
          break;
        case "-":
        case "_":
          setUiScale(uiScale - 0.05);
          break; // zoom out (fit a short screen)
        case "=":
        case "+":
          setUiScale(uiScale + 0.05);
          break; // zoom in
        case "\\":
          setUiScale(1);
          break; // reset to 100%
        default:
          handled = false;
      }
      if (handled) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    true
  );

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
}
