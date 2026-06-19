/* NeoAmp — content script "backend".
 *
 * Runs on music.youtube.com. Responsibilities:
 *   1. Capture the tab's audio (getDisplayMedia) and run an AnalyserNode.
 *   2. Read now-playing metadata + drive playback by poking YTM's own DOM.
 *   3. Expose a small API on window.NeoAmp that the UI layer (winamp.js) builds
 *      on — audio frames, track updates, transport control, storage, lifecycle.
 *
 * The UI (windows, skin) lives in winamp.js; Butterchurn lives in the sandboxed
 * viz.html iframe (it needs unsafe-eval, forbidden in a content script). The
 * analyser here produces both time-domain bytes (for Butterchurn) and frequency
 * bytes (for the main window's spectrum analyzer).
 */
(function () {
  "use strict";
  if (window.__ytmWmpVizLoaded) return;
  window.__ytmWmpVizLoaded = true;

  var FFT_SIZE = 1024; // must equal Butterchurn's fftSize (2 * numSamps=512)

  var audioCtx = null, analyser = null, stream = null;
  var rafId = 0, timeBytes = null, freqBytes = null, running = false;
  var trackTimer = 0, lastTrack = null;

  // --- tiny event bus -------------------------------------------------------
  var listeners = { start: [], stop: [], audio: [], track: [] };
  function on(ev, cb) { (listeners[ev] || (listeners[ev] = [])).push(cb); }
  function off(ev, cb) {
    var a = listeners[ev]; if (!a) return;
    var i = a.indexOf(cb); if (i >= 0) a.splice(i, 1);
  }
  function emit(ev, arg) {
    var a = listeners[ev]; if (!a) return;
    for (var i = 0; i < a.length; i++) { try { a[i](arg); } catch (e) { console.error("[NeoAmp]", ev, e); } }
  }

  // --- capture --------------------------------------------------------------
  async function start() {
    if (running) return;
    var s;
    try {
      s = await navigator.mediaDevices.getDisplayMedia({
        video: true, // required by the API even though we only keep audio
        audio: { suppressLocalAudioPlayback: false },
        preferCurrentTab: true,
        selfBrowserSurface: "include",
      });
    } catch (e) { toast("Capture cancelled"); return; }
    s.getVideoTracks().forEach(function (t) { t.stop(); });
    var at = s.getAudioTracks();
    if (!at.length) {
      toast("No tab audio — re-share and tick “Share tab audio”");
      s.getTracks().forEach(function (t) { t.stop(); });
      return;
    }
    stream = s;
    at[0].addEventListener("ended", stop); // user clicked "Stop sharing"

    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") { try { await audioCtx.resume(); } catch (_) {} }
    var src = audioCtx.createMediaStreamSource(new MediaStream(at));
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = FFT_SIZE;
    analyser.smoothingTimeConstant = 0; // raw time-domain for Butterchurn
    // Boost the analysis signal so visuals react harder (tab audio is often
    // quiet). Analysis branch only — doesn't change what you hear, since
    // getDisplayMedia keeps the tab audible on its own.
    var boost = audioCtx.createGain();
    boost.gain.value = 1.8;
    var sink = audioCtx.createGain();
    sink.gain.value = 0; // pull the graph so the analyser gets samples, silently
    src.connect(boost);
    boost.connect(analyser);
    analyser.connect(sink);
    sink.connect(audioCtx.destination);
    timeBytes = new Uint8Array(analyser.fftSize);
    freqBytes = new Uint8Array(analyser.frequencyBinCount); // fftSize/2 = 512

    running = true;
    pump();
    trackTimer = setInterval(sendTrack, 400);
    emit("start");
  }

  function stop() {
    if (!running && !audioCtx) return;
    running = false;
    cancelAnimationFrame(rafId);
    clearInterval(trackTimer); trackTimer = 0;
    if (stream) stream.getTracks().forEach(function (t) { t.stop(); });
    if (audioCtx) { try { audioCtx.close(); } catch (_) {} }
    audioCtx = analyser = stream = timeBytes = freqBytes = null;
    emit("stop");
  }

  // The analyser produces both arrays each frame; subscribers (the viz iframe
  // bridge + the spectrum analyzer) read what they need.
  var frame = { time: null, freq: null };
  function pump() {
    rafId = requestAnimationFrame(pump);
    if (!analyser) return;
    analyser.getByteTimeDomainData(timeBytes);
    analyser.getByteFrequencyData(freqBytes);
    frame.time = timeBytes; frame.freq = freqBytes;
    emit("audio", frame);
  }

  // --- now-playing + transport ---------------------------------------------
  function q(sel) { return document.querySelector(sel); }
  function qa(sels) { // first matching element across a list of selectors
    for (var i = 0; i < sels.length; i++) { var el = document.querySelector(sels[i]); if (el) return el; }
    return null;
  }
  function clean(s) { return (s || "").replace(/\s+/g, " ").trim(); }

  // A play/view-count string like "1.2M plays" if present in `text`, else "".
  function matchPlays(text) {
    var m = (text || "").match(/([\d.,]+\s*[KMB]?)\s*(plays?|views?)/i);
    return m ? clean(m[0]) : "";
  }
  // byline is "Artist • Album • Year • plays" — segments vary (often just the
  // artist). Split on • and classify each part rather than assuming order.
  function parseByline(text) {
    var parts = (text || "").split("•").map(function (s) { return clean(s); }).filter(Boolean);
    var out = { artist: parts[0] || "", album: "", year: "", plays: "" };
    parts.slice(1).forEach(function (p) {
      if (/^\d{4}$/.test(p)) out.year = p;
      else if (/\b(plays?|views?)\b/i.test(p)) out.plays = p;
      else if (!out.album) out.album = p;             // first non-year/non-plays = album
    });
    return out;
  }
  // The player bar's single like-button renderer holds both thumbs. Read the
  // 3-state status via the `like-status` attribute (th-ch/youtube-music), with
  // an aria-pressed fallback. Anchor on the unambiguous #button-shape-* ids.
  function likeRenderer() {
    return q("ytmusic-player-bar #like-button-renderer") || q("ytmusic-player-bar ytmusic-like-button-renderer");
  }
  function readLikeStatus() {
    var r = likeRenderer();
    if (!r) return "INDIFFERENT";
    var attr = r.getAttribute("like-status");
    if (attr) return attr;                            // "LIKE" | "DISLIKE" | "INDIFFERENT"
    var lb = r.querySelector("#button-shape-like button"), db = r.querySelector("#button-shape-dislike button");
    if (lb && lb.getAttribute("aria-pressed") === "true") return "LIKE";
    if (db && db.getAttribute("aria-pressed") === "true") return "DISLIKE";
    return "INDIFFERENT";
  }

  function readTrack() {
    var v = q("video");
    var titleEl = q("ytmusic-player-bar .title");
    var bylineEl = q("ytmusic-player-bar .byline");
    var artEl = q("ytmusic-player-bar img.image") || q("ytmusic-player-bar img");
    var by = parseByline(bylineEl && bylineEl.textContent);
    return {
      title: clean(titleEl && titleEl.textContent),
      artist: by.artist,
      album: by.album,
      year: by.year,
      plays: by.plays,                                 // best-effort; often ""
      likeStatus: readLikeStatus(),
      art: artEl ? artEl.src : "",
      currentTime: v ? v.currentTime : 0,
      duration: v && isFinite(v.duration) ? v.duration : 0,
      paused: v ? v.paused : true,
      volume: v ? v.volume : 1,
    };
  }
  function getTrack() { return lastTrack || readTrack(); }
  function sendTrack() { lastTrack = readTrack(); emit("track", lastTrack); }

  // The "Up Next" queue, read straight from YTM's DOM. Each row is a
  // <ytmusic-player-queue-item>; the currently-playing one carries [selected].
  function readQueue() {
    var items = document.querySelectorAll("ytmusic-player-queue-item");
    var out = [];
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      var title = clean((it.querySelector(".song-title") || {}).textContent);
      if (!title) continue;
      var byline = clean((it.querySelector(".byline") || {}).textContent);
      var pbs = it.getAttribute("play-button-state") || "";
      var img = it.querySelector("img");
      out.push({
        index: i,
        title: title,
        artist: byline.split("•")[0].trim(),
        duration: clean((it.querySelector(".duration") || {}).textContent),
        plays: matchPlays(it.textContent),       // usually absent in queue rows
        art: img && /^https?:/.test(img.src) ? img.src : "",
        playing: it.hasAttribute("selected") || pbs === "playing" || pbs === "paused",
      });
    }
    return out;
  }

  // --- search (drives YTM's own search box) --------------------------------
  // Verified live: setting the search box value + dispatching Enter navigates
  // to /search as an SPA route (NO full reload), so the audio capture survives
  // and results render in the DOM. We then scrape the rendered rows and play a
  // chosen one by clicking its play-button overlay (the only reliable trigger).
  function triggerSearch(query) {
    var input = q("ytmusic-search-box input#input") || q("ytmusic-search-box input");
    if (!input) return null;
    input.focus();
    try {
      var setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(input), "value").set;
      setter.call(input, query);
    } catch (_) { input.value = query; }
    input.dispatchEvent(new Event("input", { bubbles: true }));
    return input;
  }

  // play count for a result row: scan the flex columns first, then the whole row
  function rowPlays(r) {
    var cols = r.querySelectorAll(".flex-column, yt-formatted-string.flex-column, .secondary-flex-columns yt-formatted-string");
    for (var i = 0; i < cols.length; i++) { var m = matchPlays(cols[i].textContent); if (m) return m; }
    return matchPlays(r.textContent);
  }
  // song vs playlist/album, by the title link's navigation endpoint (not the tag)
  function classifyRow(r) {
    var a = r.querySelector("a.yt-simple-endpoint[href]") || r.querySelector("a[href]");
    var href = a ? (a.getAttribute("href") || "") : "";
    if (/\bwatch\b|[?&]v=/.test(href)) return "song";
    if (/\/playlist\?list=|[?&]list=/.test(href)) return "playlist";
    if (/\/browse\/MPRE/.test(href)) return "album";
    if (/\/browse\/VL/.test(href)) return "playlist";
    return "unknown";
  }

  function scrapeResults() {
    var out = [];
    var card = document.querySelector("ytmusic-card-shelf-renderer");
    if (card) {
      var ctitle = clean((card.querySelector(".title, yt-formatted-string.title, a.yt-simple-endpoint") || {}).textContent);
      // some card layouts have no .title — derive it from the leading text
      // ("Arijit Singh Artist • …" → "Arijit Singh")
      if (!ctitle) ctitle = clean(clean(card.textContent).split(/\s+(?:Artist|Song|Album|Single|EP|Video|Playlist)\b/)[0]).slice(0, 40);
      out.push({
        section: "Top result", title: ctitle,
        subtitle: clean(clean(card.textContent).replace(ctitle, "")).slice(0, 80),
        art: (card.querySelector("img") || {}).src || "", rowIndex: -1,
        play: !!card.querySelector("ytmusic-play-button-renderer"),
        plays: matchPlays(card.textContent), kind: classifyRow(card),
      });
    }
    var rows = document.querySelectorAll("ytmusic-responsive-list-item-renderer");
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      if (r.closest("ytmusic-card-shelf-renderer")) continue; // already covered by the top card
      var sh = r.closest("ytmusic-shelf-renderer");
      var section = sh ? clean((sh.querySelector("h2, .title") || {}).textContent) : "Results";
      // .title is the reliable title across row types (song/album/artist);
      // links[0]/.flex-column[0] are unreliable (often the subtitle).
      var titleEl = r.querySelector("yt-formatted-string.title, .title");
      var title = clean(titleEl && titleEl.textContent) || clean((r.querySelectorAll("a.yt-simple-endpoint")[0] || {}).textContent);
      if (!title) continue;
      var subtitle = clean(clean(r.textContent).replace(title, "")).replace(/^[•\-\s]+/, "").slice(0, 90);
      out.push({
        section: section || "Results", title: title, subtitle: subtitle,
        art: (r.querySelector("img") || {}).src || "", rowIndex: i,
        play: !!r.querySelector("ytmusic-play-button-renderer"),
        plays: rowPlays(r), kind: classifyRow(r),
      });
    }
    return out;
  }

  // --- home shelves ("Quick Picks" / "Listen Again") shown when idle ---------
  // YTM home renders shelves as carousels; we match by title, scrape the cards,
  // and keep the live element refs (homeItems) so playHomeItem can click them.
  var homeItems = [];
  function findShelf(name) {
    var shelves = document.querySelectorAll("ytmusic-carousel-shelf-renderer, ytmusic-shelf-renderer");
    for (var i = 0; i < shelves.length; i++) {
      var hh = shelves[i].querySelector(
        ".title.ytmusic-carousel-shelf-basic-header-renderer, ytmusic-carousel-shelf-basic-header-renderer .title, h2 .title, h2, .title");
      var t = hh ? clean(hh.textContent) : "";
      if (t.toLowerCase().indexOf(name.toLowerCase()) === 0) return shelves[i];
    }
    return null;
  }
  function scrapeShelf(shelf, section) {
    if (!shelf) return [];
    var items = shelf.querySelectorAll("ytmusic-two-row-item-renderer, ytmusic-responsive-list-item-renderer");
    var out = [];
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      var titleEl = it.querySelector("yt-formatted-string.title, .title");
      var title = clean(titleEl && titleEl.textContent);
      if (!title) continue;
      var subEl = it.querySelector("yt-formatted-string.subtitle, .subtitle, .flex-column");
      var img = it.querySelector("img");
      out.push({ section: section, title: title, subtitle: clean(subEl && subEl.textContent),
        art: img && /^https?:/.test(img.src) ? img.src : "", _el: it });
    }
    return out;
  }
  // SPA-navigate to home (never location.href — that reloads + kills capture)
  function goHome() {
    var items = document.querySelectorAll("ytmusic-pivot-bar-item-renderer, ytmusic-pivot-bar-renderer a");
    for (var i = 0; i < items.length; i++) {
      var t = clean((items[i].querySelector(".tab-title, yt-formatted-string") || items[i]).textContent);
      var al = items[i].getAttribute("aria-label") || "";
      if (/^home$/i.test(t) || /home/i.test(al)) { items[i].click(); return true; }
    }
    var logo = document.querySelector("ytmusic-nav-bar a#left-content, a[title='YouTube Music']");
    if (logo) { logo.click(); return true; }
    return false;
  }
  function getHomeShelves(cb) {
    var collect = function () {
      var list = scrapeShelf(findShelf("Quick picks"), "Quick Picks")
        .concat(scrapeShelf(findShelf("Listen again"), "Listen Again"));
      homeItems = list;
      // strip the live el before handing back (winamp.js plays via homeIndex)
      cb({ results: list.map(function (x, i) {
        return { section: x.section, title: x.title, subtitle: x.subtitle, art: x.art, homeIndex: i };
      }), home: true });
    };
    if (document.querySelector("ytmusic-carousel-shelf-renderer, ytmusic-shelf-renderer")) { collect(); return; }
    if (!goHome()) { cb({ results: [], home: true }); return; }
    var tries = 0;
    (function wait() {
      if (document.querySelector("ytmusic-carousel-shelf-renderer, ytmusic-shelf-renderer")) { setTimeout(collect, 400); return; }
      if (++tries > 30) { cb({ results: [], home: true }); return; }
      setTimeout(wait, 250);
    })();
  }

  function search(query, cb) {
    if (!triggerSearch(query)) { cb({ error: "YouTube Music search box not found" }); return; }
    // submit after a tick so autocomplete doesn't swallow the Enter
    setTimeout(function () {
      var input = q("ytmusic-search-box input#input") || q("ytmusic-search-box input");
      if (input) ["keydown", "keypress", "keyup"].forEach(function (t) {
        input.dispatchEvent(new KeyboardEvent(t, { key: "Enter", code: "Enter", keyCode: 13, which: 13, bubbles: true }));
      });
      var tries = 0;
      (function waitForResults() {
        var ready = location.href.indexOf("/search") !== -1 &&
          document.querySelectorAll("ytmusic-responsive-list-item-renderer, ytmusic-card-shelf-renderer").length;
        if (ready) { setTimeout(function () { cb({ results: scrapeResults(), query: query }); }, 650); return; }
        if (++tries > 30) { cb({ error: "search timed out", query: query }); return; }
        setTimeout(waitForResults, 300);
      })();
    }, 350);
  }

  var control = {
    playPause: function () { var v = q("video"); if (v) { v.paused ? v.play() : v.pause(); sendTrack(); } },
    next: function () { var b = qa(["ytmusic-player-bar .next-button", "tp-yt-paper-icon-button.next-button", ".next-button"]); if (b) b.click(); },
    prev: function () { var b = qa(["ytmusic-player-bar .previous-button", "tp-yt-paper-icon-button.previous-button", ".previous-button"]); if (b) b.click(); },
    stop: function () { var v = q("video"); if (v) { v.pause(); try { v.currentTime = 0; } catch (_) {} sendTrack(); } },
    seek: function (t) { var v = q("video"); if (v && isFinite(t)) { v.currentTime = t; sendTrack(); } },
    setVolume: function (x) { var v = q("video"); if (v) { v.volume = Math.max(0, Math.min(1, x)); } },
    getVolume: function () { var v = q("video"); return v ? v.volume : 1; },
    toggleShuffle: function () { var b = qa(["ytmusic-player-bar .shuffle", "tp-yt-paper-icon-button.shuffle", "[aria-label*='Shuffle' i]"]); if (b) b.click(); },
    toggleRepeat: function () { var b = qa(["ytmusic-player-bar .repeat", "tp-yt-paper-icon-button.repeat", "[aria-label*='Repeat' i]"]); if (b) b.click(); },
    playQueueItem: function (i) {
      var items = document.querySelectorAll("ytmusic-player-queue-item");
      var it = items[i];
      if (!it) return;
      // Verified live: only the thumbnail play-button overlay actually starts
      // the row — clicking .song-info / the row / dblclick do nothing.
      var target = it.querySelector("ytmusic-play-button-renderer") ||
        it.querySelector(".thumbnail yt-icon, yt-icon.icon") || it;
      target.click();
    },
    playLibraryItem: function (rowIndex) {
      if (rowIndex < 0) {
        var card = document.querySelector("ytmusic-card-shelf-renderer");
        var cb = card && card.querySelector("ytmusic-play-button-renderer");
        if (cb) cb.click();
        return;
      }
      var rows = document.querySelectorAll("ytmusic-responsive-list-item-renderer");
      var r = rows[rowIndex];
      if (!r) return;
      var b = r.querySelector("ytmusic-play-button-renderer") || r.querySelector(".thumbnail yt-icon, yt-icon.icon");
      if (b) b.click();
    },
    // OPEN a playlist/album result as an SPA route (click its title link — never
    // location.href). Use for collection rows; playLibraryItem still PLAYS them.
    openLibraryItem: function (rowIndex) {
      var r = rowIndex < 0
        ? document.querySelector("ytmusic-card-shelf-renderer")
        : document.querySelectorAll("ytmusic-responsive-list-item-renderer")[rowIndex];
      if (!r) return;
      var link = r.querySelector("a.yt-simple-endpoint.yt-formatted-string")
              || r.querySelector("yt-formatted-string.title a")
              || r.querySelector("a.yt-simple-endpoint[href*='list='], a.yt-simple-endpoint[href*='browse/']");
      if (link) link.click();
    },
    // like/dislike toggle the current track (3-state — clicking when already
    // set returns to neutral). Anchor on the unambiguous #button-shape-* ids.
    like: function () {
      var r = likeRenderer(); if (!r) return;
      var b = r.querySelector("#button-shape-like > button") || r.querySelector("#button-shape-like button") || r.querySelector("button[aria-label='Like']");
      if (b) { b.click(); sendTrack(); }
    },
    dislike: function () {
      var r = likeRenderer(); if (!r) return;
      var b = r.querySelector("#button-shape-dislike > button") || r.querySelector("#button-shape-dislike button") || r.querySelector("button[aria-label='Dislike']");
      if (b) { b.click(); sendTrack(); }
    },
    // play a scraped home-shelf item by its index (refs held in homeItems)
    playHomeItem: function (idx) {
      var it = homeItems[idx]; if (!it || !it._el) return;
      var b = it._el.querySelector("ytmusic-play-button-renderer") || it._el.querySelector(".thumbnail yt-icon, yt-icon.icon");
      if (b) { b.click(); return; }
      var a = it._el.querySelector("a.yt-simple-endpoint[href]"); if (a) a.click();
    },
  };

  // --- storage (chrome.storage, async; the iframe can't use it directly) ----
  var storage = {
    get: function (key, cb) {
      try { chrome.storage.local.get(key, function (r) { cb(r ? r[key] : undefined); }); }
      catch (_) { cb(undefined); }
    },
    set: function (obj) { try { chrome.storage.local.set(obj); } catch (_) {} },
  };

  function toast(msg) {
    var t = document.createElement("div");
    t.className = "ytm-wmp-toast";
    t.textContent = msg;
    document.documentElement.appendChild(t);
    setTimeout(function () { t.parentNode && t.parentNode.removeChild(t); }, 4500);
  }

  window.NeoAmp = {
    start: start,
    stop: stop,
    isRunning: function () { return running; },
    on: on, off: off,
    getTrack: getTrack,
    getQueue: readQueue,
    search: search,
    getHomeShelves: getHomeShelves,
    control: control,
    storage: storage,
    toast: toast,
    FFT_SIZE: FFT_SIZE,
  };
})();
