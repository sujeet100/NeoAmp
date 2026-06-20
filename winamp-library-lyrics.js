/* NeoAmp UI — Library search/home renderers + the Lyrics window content.
 * Split from the former monolithic winamp.js; loaded as content scripts in a fixed
 * order (see manifest). These files SHARE the content-script global scope (same
 * pattern as presets/kit.js → presets/*.js): every top-level var/function is a global,
 * so cross-file references resolve without imports. See CLAUDE.md.
 */
"use strict";

// =========================================================================
// LYRICS WINDOW — scrolling lyrics for the current track (scraped from the
// provider's own lyrics pane; empty-state when none are available). Free-
// floating like the viz window (not in the docked 550px stack).
// =========================================================================
var lastLyrics; // latest lyrics object so opening the window mid-track fills it

// Ask the provider to open its OWN lyrics pane (lyrics are lazy — they only load into the
// DOM after the user opens the provider's Lyrics tab/view). Self-gating + only while the
// NeoAmp lyrics window is open, so it never hijacks the provider's UI unprompted.
function maybeLoadLyrics() {
  if (isShown("wa-lyrics") && NA.control.ensureLyrics) NA.control.ensureLyrics();
}

function buildLyrics() {
  var win = makeWindow("wa-lyrics", "Lyrics", {
    onClose: function () {
      hideWin("wa-lyrics");
    },
  });
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
  var list = els.lyricsList;
  if (!list) return;
  var lines = lyr && lyr.lines && lyr.lines.length ? lyr.lines : null;
  list.innerHTML = "";
  if (!lines) {
    list.classList.add("empty");
    list.appendChild(
      h("div", {
        class: "wa-lyrics-empty",
        text: lyr === undefined ? "♪  Loading lyrics…" : "No lyrics available for this track.",
      })
    );
    els.lyricsStatus.textContent = "";
    return;
  }
  list.classList.remove("empty");
  lines.forEach(function (ln, i) {
    var row = h("div", { class: "wa-lyrics-line", text: ln || " " });
    if (lyr.isTimeSynced && i === lyr.activeLine) row.classList.add("active");
    list.appendChild(row);
  });
  els.lyricsStatus.textContent = lyr.source ? "source: " + lyr.source : "";
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
  if (!res || res.error) {
    els.libStatus.textContent = res && res.error ? "Search failed: " + res.error : "No response.";
    return;
  }
  var items = res.results || [];
  if (!items.length) {
    els.libStatus.textContent = "No results for “" + res.query + "”.";
    return;
  }
  var lastSection = null;
  items.forEach(function (it) {
    if (it.section !== lastSection) {
      lastSection = it.section;
      list.appendChild(h("div", { class: "wa-lib-sec", text: it.section }));
    }
    var thumb = makeThumb("wa-lib-thumb", it.art);
    var isColl = it.kind === "playlist" || it.kind === "album";
    var sub = it.subtitle || "";
    if (it.plays && sub.indexOf(it.plays) < 0) sub += (sub ? "  •  " : "") + it.plays; // append play count
    var title = h("div", { class: "wa-lib-t" }, [
      isColl
        ? h("span", { class: "wa-lib-badge", text: it.kind === "album" ? "ALB" : "PL" })
        : null,
      h("span", { text: it.title }),
    ]);
    var row = h(
      "div",
      {
        class: "wa-lib-row" + (it.rowIndex < 0 ? " top" : "") + (isColl ? " is-collection" : ""),
      },
      [
        thumb,
        h("div", { class: "wa-lib-meta" }, [title, h("div", { class: "wa-lib-s", text: sub })]),
      ]
    );
    if (isColl) {
      // single-click OPENS the playlist/album page; double-click PLAYS it.
      // Debounce the click so a double-click doesn't also fire the open.
      row.title = "Click to open · Double-click to play";
      var clickT = null;
      row.addEventListener("click", function () {
        if (clickT) return;
        clickT = setTimeout(function () {
          clickT = null;
          NA.control.openLibraryItem(it.rowIndex);
        }, 250);
      });
      row.addEventListener("dblclick", function () {
        if (clickT) {
          clearTimeout(clickT);
          clickT = null;
        }
        NA.control.playLibraryItem(it.rowIndex);
        setTimeout(function () {
          refreshQueue(true);
        }, 700);
      });
    } else {
      row.title = "Double-click to play";
      row.addEventListener("dblclick", function () {
        NA.control.playLibraryItem(it.rowIndex);
        setTimeout(function () {
          refreshQueue(true);
        }, 700);
      });
    }
    list.appendChild(row);
  });
  els.libStatus.textContent = items.length + " results for “" + res.query + "”.";
}

// Library "home" view (shown when the search box is empty / nothing playing):
// the "Quick Picks" and "Listen Again" shelves scraped from YTM's home feed.
function renderHome(res) {
  var list = els.libList;
  if (!list) return;
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
      setTimeout(function () {
        refreshQueue(true);
      }, 700);
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
  if (
    els.libInput &&
    !els.libInput.value.trim() &&
    (!t || !t.title) &&
    els.libList &&
    !els.libList.childElementCount
  ) {
    loadHome(false);
  }
}

var lastLyricsTrack = "";

// keyboard "L": open the Library/search window (if hidden) and focus its box
// LIB action: open the in-app library window (YTM), or focus the site's OWN search box
// on providers without one (Spotify) — so "LIB" is a working search affordance everywhere.
function toggleLibrary(togBtn) {
  var caps = (NA.control.getCapabilities && NA.control.getCapabilities()) || {};
  if (caps.library === false) {
    if (!(NA.control.focusSearch && NA.control.focusSearch()))
      NA.toast("Search isn't available on this site.");
    return;
  }
  toggleWin("wa-lib", togBtn);
  if (togBtn) togBtn.classList.toggle("on", isShown("wa-lib"));
  if (isShown("wa-lib")) libBecameVisible();
}

function focusLibrary() {
  var caps = (NA.control.getCapabilities && NA.control.getCapabilities()) || {};
  if (caps.library === false) {
    focusYtSearch();
    return;
  } // no in-app library → the site's own search
  if (!isShown("wa-lib")) {
    toggleWin("wa-lib", els.libTog);
    libBecameVisible();
  } else if (wins["wa-lib"]) raise(wins["wa-lib"].el);
  if (els.libInput)
    setTimeout(function () {
      try {
        els.libInput.focus();
        els.libInput.select();
      } catch (_) {}
    }, 30);
}
