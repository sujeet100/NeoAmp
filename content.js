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

  var timeBytes = null,
    freqBytes = null,
    running = false;
  var trackTimer = 0,
    lastTrack = null;

  // EQ state — the UI's source of truth. The actual audio graph lives in the OFFSCREEN
  // document (it owns the gesture-gated tabCapture); the content script relays changes
  // there via the service worker and persists them. Flat (all 0, balance 0) = transparent.
  var eqState = { enabled: true, preamp: 0, bands: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], balance: 0 };
  var eqSaveTimer = 0;

  // --- tiny event bus -------------------------------------------------------
  var listeners = { start: [], stop: [], audio: [], track: [] };
  function on(ev, cb) {
    (listeners[ev] || (listeners[ev] = [])).push(cb);
  }
  function off(ev, cb) {
    var a = listeners[ev];
    if (!a) return;
    var i = a.indexOf(cb);
    if (i >= 0) a.splice(i, 1);
  }
  function emit(ev, arg) {
    var a = listeners[ev];
    if (!a) return;
    for (var i = 0; i < a.length; i++) {
      try {
        a[i](arg);
      } catch (e) {
        console.error("[NeoAmp]", ev, e);
      }
    }
  }

  // --- EQ helpers -----------------------------------------------------------
  function clamp(x, lo, hi) {
    return Math.max(lo, Math.min(hi, x));
  }
  // relay the live EQ to the offscreen engine (via the service worker) so a fader
  // drag shapes the audio immediately. Harmless if capture isn't running.
  function relayEq() {
    try {
      chrome.runtime.sendMessage({
        target: "sw",
        type: "relay-eq",
        eq: {
          bands: eqState.bands.slice(),
          preamp: eqState.preamp,
          balance: eqState.balance,
          enabled: eqState.enabled,
        },
      });
    } catch (_) {}
  }
  function persistEq() {
    clearTimeout(eqSaveTimer);
    eqSaveTimer = setTimeout(function () {
      try {
        chrome.storage.local.set({ neoampEq: eqState });
      } catch (_) {}
    }, 400);
  }

  // --- audio lifecycle (driven by the service worker + offscreen engine) ----
  // tabCapture must be started by something that "invokes" the extension (the
  // right-click "Open NeoAmp player") — a page button can't (Chrome gesture rule). The
  // SW tells us when capture begins/ends; we raise the player UI + poll the track, and
  // the offscreen streams FFT frames here for the visuals.
  var frame = { time: null, freq: null };
  // Real output sample rate, reported by the offscreen AudioContext at capture start.
  // Carried on each track tick so the UI's kHz readout never races the UI build order.
  var audioSampleRate = 0;

  // Latest now-playing snapshot from the MediaSession bridge (mediasession.js, main world).
  // Provider-agnostic + far more stable than site CSS classes; readTrack prefers it.
  var mediaMeta = {};
  window.addEventListener("message", function (e) {
    if (e.source !== window || !e.data || e.data.__neoamp_ms !== 1) return;
    mediaMeta = e.data.data || {};
  });
  function onEqStarted() {
    if (running) return;
    running = true;
    timeBytes = new Uint8Array(FFT_SIZE);
    freqBytes = new Uint8Array(FFT_SIZE / 2);
    trackTimer = setInterval(sendTrack, 400);
    relayEq(); // hand the engine the persisted curve
    emit("start");
    sendTrack();
  }
  function onEqStopped() {
    if (!running) return;
    running = false;
    clearInterval(trackTimer);
    trackTimer = 0;
    timeBytes = freqBytes = null;
    emit("stop");
  }
  // FFT frames arrive base64-packed [time(FFT_SIZE) | freq(FFT_SIZE/2)] because
  // runtime messaging is JSON (typed arrays can't cross). Unpack + fan out to the
  // same "audio" subscribers as before (the viz iframe bridge + the spectrum analyzer).
  function onFft(b64) {
    if (!running || !timeBytes) return;
    var bin;
    try {
      bin = atob(b64);
    } catch (_) {
      return;
    }
    if (bin.length !== timeBytes.length + freqBytes.length) return;
    for (var i = 0; i < timeBytes.length; i++) timeBytes[i] = bin.charCodeAt(i) & 255;
    for (var j = 0; j < freqBytes.length; j++)
      freqBytes[j] = bin.charCodeAt(timeBytes.length + j) & 255;
    frame.time = timeBytes;
    frame.freq = freqBytes;
    emit("audio", frame);
  }
  // ask the SW to stop capture (stopping needs no gesture, unlike starting)
  function requestStop() {
    try {
      chrome.runtime.sendMessage({ target: "sw", type: "stop-capture" });
    } catch (_) {}
  }
  // a page button can't START capture — guide the user to the right-click menu
  function startHint() {
    toast("To open NeoAmp: click the gold “N” toolbar icon, or press ⌘⇧E (Ctrl+Shift+E).");
  }

  // --- now-playing + transport ---------------------------------------------
  function q(sel) {
    return document.querySelector(sel);
  }
  function qa(sels) {
    // first matching element across a list of selectors
    for (var i = 0; i < sels.length; i++) {
      var el = document.querySelector(sels[i]);
      if (el) return el;
    }
    return null;
  }
  function clean(s) {
    return (s || "").replace(/\s+/g, " ").trim();
  }

  // A play/view-count string like "1.2M plays" if present in `text`, else "".
  function matchPlays(text) {
    var m = (text || "").match(/([\d.,]+\s*[KMB]?)\s*(plays?|views?)/i);
    return m ? clean(m[0]) : "";
  }
  // byline is "Artist • Album • Year • plays" — segments vary (often just the
  // artist). Split on • and classify each part rather than assuming order.
  function parseByline(text) {
    var parts = (text || "")
      .split("•")
      .map(function (s) {
        return clean(s);
      })
      .filter(Boolean);
    var out = { artist: parts[0] || "", album: "", year: "", plays: "" };
    // Order matters: the FIRST non-plays segment is the album, so a 4-digit
    // album title ("1989", "1984") isn't stolen by the year test; a later
    // 19xx/20xx is the year.
    parts.slice(1).forEach(function (p) {
      if (/\b(plays?|views?)\b/i.test(p)) out.plays = p;
      else if (!out.album) out.album = p;
      else if (/^(19|20)\d{2}$/.test(p)) out.year = p;
    });
    return out;
  }
  // The player bar's single like-button renderer holds both thumbs. Read the
  // 3-state status via the `like-status` attribute (th-ch/youtube-music), with
  // an aria-pressed fallback. Anchor on the unambiguous #button-shape-* ids.
  function likeRenderer() {
    return (
      q("ytmusic-player-bar #like-button-renderer") ||
      q("ytmusic-player-bar ytmusic-like-button-renderer")
    );
  }
  function readLikeStatus() {
    if (typeof PROVIDER !== "undefined" && PROVIDER && PROVIDER.like) {
      // binary-save providers (Spotify): "saved" reads as LIKE so the heart lights up
      var sb = qa(PROVIDER.like);
      if (sb) {
        var al = (sb.getAttribute("aria-label") || "").toLowerCase();
        if (
          sb.getAttribute("aria-checked") === "true" ||
          sb.getAttribute("aria-pressed") === "true" ||
          /\bremove\b/.test(al)
        )
          return "LIKE";
      }
      return "INDIFFERENT";
    }
    var r = likeRenderer();
    if (!r) return "INDIFFERENT";
    var attr = r.getAttribute("like-status");
    if (attr) return attr; // "LIKE" | "DISLIKE" | "INDIFFERENT"
    var lb = r.querySelector("#button-shape-like button"),
      db = r.querySelector("#button-shape-dislike button");
    if (lb && lb.getAttribute("aria-pressed") === "true") return "LIKE";
    if (db && db.getAttribute("aria-pressed") === "true") return "DISLIKE";
    return "INDIFFERENT";
  }

  // Read a button's on/off from aria-pressed (the reliable signal), falling back
  // to an "active" class. Returns null when unreadable so callers can leave the
  // UI on its current/optimistic value rather than clobbering it with a guess.
  function readPressed(el) {
    if (!el) return null;
    var ap = el.getAttribute("aria-pressed");
    if (ap === "true") return true;
    if (ap === "false") return false;
    var cl = el.className || "";
    if (/\bactive\b|style-default-active/.test(cl)) return true;
    return null;
  }
  // Shuffle (binary) + Repeat (mapped to binary: any repeat mode = "on").
  // YTM's exact repeat DOM varies by build, so this is best-effort with a null
  // fallback; confirm selectors live if repeat sync looks wrong.
  function readShuffle() {
    return readPressed(
      qa(["ytmusic-player-bar [aria-label*='Shuffle' i]", "ytmusic-player-bar .shuffle"])
    );
  }
  function readRepeat() {
    var bar = q("ytmusic-player-bar");
    var mode = bar && (bar.getAttribute("repeat-mode") || bar.getAttribute("repeat_mode") || "");
    if (mode) return !/none|off/i.test(mode); // NONE / ALL_OFF = off; ALL / ONE = on
    var b = qa(["ytmusic-player-bar [aria-label*='Repeat' i]", "ytmusic-player-bar .repeat"]);
    var p = readPressed(b);
    if (p != null) return p;
    var al = ((b && (b.getAttribute("aria-label") || b.getAttribute("title"))) || "").toLowerCase();
    if (/off/.test(al)) return false;
    if (/repeat (all|one)|one|all/.test(al)) return true;
    return null;
  }

  // Lyrics, scraped from the provider's OWN lyrics pane (the user's licensed view).
  // Per-track cached: the lines only exist in the DOM while the pane is open, so we keep
  // the last-known lyrics for the SAME track when it closes (same fix as the queue mirror),
  // and reset on track change. Returns { lines, source } | null. `key` = title|artist.
  var lyricsCache = { key: "", lyrics: null };
  function readLyrics(key) {
    var lines = [];
    if (PROVIDER.lyricsLine) {
      // per-line elements (Spotify: [data-testid=lyrics-line])
      var nodes = qaAll(PROVIDER.lyricsLine);
      for (var i = 0; i < nodes.length; i++) {
        var t = clean(nodes[i].textContent);
        if (t) lines.push(t);
      }
    } else if (PROVIDER.lyricsText) {
      // one block with \n line breaks (YTM description shelf)
      var el = qa(PROVIDER.lyricsText);
      if (el) {
        lines = (el.textContent || "").split("\n").map(function (s) {
          return s.replace(/\s+$/, "");
        });
        while (lines.length && !lines[0].trim()) lines.shift(); // trim leading blanks
        while (lines.length && !lines[lines.length - 1].trim()) lines.pop(); // trim trailing blanks
      }
    } else return null; // provider has no lyrics wiring
    if (lines.length) {
      lyricsCache = { key: key, lyrics: { lines: lines, source: PROVIDER.id } };
      return lyricsCache.lyrics;
    }
    if (key && lyricsCache.key === key) return lyricsCache.lyrics; // pane closed → keep same-track lyrics
    return null; // different track / never loaded → empty-state
  }
  function readTrack() {
    var v = mediaEl();
    var titleEl = q("ytmusic-player-bar .title");
    var bylineEl = q("ytmusic-player-bar .byline");
    var artEl = q("ytmusic-player-bar img.image") || q("ytmusic-player-bar img");
    var by = parseByline(bylineEl && bylineEl.textContent);
    // Prefer the MediaSession snapshot (web standard every major player sets for the OS
    // media controls — provider-agnostic + far more stable than site CSS classes). Fall
    // back to YTM's DOM scrape for fields MediaSession doesn't carry (album/year/plays/
    // likes) and for the brief window before the first snapshot arrives.
    var ms = mediaMeta || {};
    // per-track position (provider UI first — the media element is a gapless timeline on YTM)
    var pos = readPosition(v);
    var cur = pos.cur,
      dur = pos.dur;
    var title = ms.title || clean(titleEl && titleEl.textContent);
    var artist = ms.artist || by.artist;
    return {
      title: title,
      artist: artist,
      album: ms.album || by.album,
      year: by.year,
      plays: by.plays, // best-effort; often ""
      likeStatus: readLikeStatus(),
      art: ms.art || (artEl ? artEl.src : ""),
      currentTime: cur,
      duration: dur,
      paused: isPaused(), // provider-aware (button on EME sites, else media element)
      volume: playerVolume, // our master-gain volume (provider-agnostic)
      shuffle: readShuffle(), // true | false | null (unknown)
      repeat: readRepeat(), // true | false | null (unknown)
      lyrics: readLyrics(title + "|" + artist), // provider's lyrics pane, per-track cached
    };
  }
  function getTrack() {
    return lastTrack || readTrack();
  }
  function sendTrack() {
    lastTrack = readTrack();
    lastTrack.sampleRate = audioSampleRate;
    emit("track", lastTrack);
  }

  // The "Up Next" queue, read straight from YTM's DOM. Each row is a
  // <ytmusic-player-queue-item>; the currently-playing one carries [selected].
  function readQueue() {
    if (PROVIDER.queueRow) return readQueueGeneric(); // provider-configured queue (e.g. Spotify)
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
        plays: matchPlays(byline), // from the byline only (usually absent)
        art: img && /^https?:/.test(img.src) ? img.src : "",
        playing: it.hasAttribute("selected") || pbs === "playing" || pbs === "paused",
      });
    }
    return out;
  }
  // Provider-configured queue (e.g. Spotify's "Next in queue" rows). The now-playing
  // track isn't in this list (it shows in NeoAmp's now-playing strip), so playing=false.
  // last non-empty provider queue — persists so NeoAmp's mirror doesn't vanish when the
  // site's queue panel is closed (the rows only exist in the DOM while it's open).
  var lastProviderQueue = [];
  function readQueueGeneric() {
    var rows = qaAll(PROVIDER.queueRow),
      out = [];
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      var title = clean(firstTextIn(r, PROVIDER.queueTitle));
      if (!title) continue;
      var img = r.querySelector("img");
      out.push({
        index: i,
        title: title,
        artist: clean(firstTextIn(r, PROVIDER.queueArtist)),
        duration: "",
        plays: "",
        art: img && /^https?:/.test(img.src) ? img.src : "",
        playing: false,
      });
    }
    if (out.length) {
      lastProviderQueue = out;
      return out;
    }
    return lastProviderQueue; // panel closed → keep showing the last-known queue
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
    } catch (_) {
      input.value = query;
    }
    input.dispatchEvent(new Event("input", { bubbles: true }));
    return input;
  }

  // play count for a result row: scan the flex columns first, then the whole row
  function rowPlays(r) {
    // scan only the metadata flex columns — not the whole row (a title containing
    // "views"/"plays" would otherwise yield a bogus count)
    var cols = r.querySelectorAll(
      ".flex-column, yt-formatted-string.flex-column, .secondary-flex-columns yt-formatted-string"
    );
    for (var i = 0; i < cols.length; i++) {
      var m = matchPlays(cols[i].textContent);
      if (m) return m;
    }
    return "";
  }
  // song vs playlist/album, by the title link's navigation endpoint (not the tag)
  function classifyRow(r) {
    var a = r.querySelector("a.yt-simple-endpoint[href]") || r.querySelector("a[href]");
    var href = a ? a.getAttribute("href") || "" : "";
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
      var ctitle = clean(
        (card.querySelector(".title, yt-formatted-string.title, a.yt-simple-endpoint") || {})
          .textContent
      );
      // some card layouts have no .title — derive it from the leading text
      // ("Arijit Singh Artist • …" → "Arijit Singh")
      if (!ctitle)
        ctitle = clean(
          clean(card.textContent).split(/\s+(?:Artist|Song|Album|Single|EP|Video|Playlist)\b/)[0]
        ).slice(0, 40);
      out.push({
        section: "Top result",
        title: ctitle,
        subtitle: clean(clean(card.textContent).replace(ctitle, "")).slice(0, 80),
        art: (card.querySelector("img") || {}).src || "",
        rowIndex: -1,
        play: !!card.querySelector("ytmusic-play-button-renderer"),
        plays: matchPlays(card.textContent),
        kind: classifyRow(card),
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
      var title =
        clean(titleEl && titleEl.textContent) ||
        clean((r.querySelectorAll("a.yt-simple-endpoint")[0] || {}).textContent);
      if (!title) continue;
      var subtitle = clean(clean(r.textContent).replace(title, ""))
        .replace(/^[•\-\s]+/, "")
        .slice(0, 90);
      out.push({
        section: section || "Results",
        title: title,
        subtitle: subtitle,
        art: (r.querySelector("img") || {}).src || "",
        rowIndex: i,
        play: !!r.querySelector("ytmusic-play-button-renderer"),
        plays: rowPlays(r),
        kind: classifyRow(r),
      });
    }
    return out;
  }

  // --- home shelves ("Quick Picks" / "Listen Again") shown when idle ---------
  // YTM home renders shelves as carousels; we match by title, scrape the cards,
  // and keep the live element refs (homeItems) so playHomeItem can click them.
  var homeItems = [];
  function findShelf(name) {
    var shelves = document.querySelectorAll(
      "ytmusic-carousel-shelf-renderer, ytmusic-shelf-renderer"
    );
    for (var i = 0; i < shelves.length; i++) {
      var hh = shelves[i].querySelector(
        ".title.ytmusic-carousel-shelf-basic-header-renderer, ytmusic-carousel-shelf-basic-header-renderer .title, h2 .title, h2, .title"
      );
      var t = hh ? clean(hh.textContent) : "";
      if (t.toLowerCase().indexOf(name.toLowerCase()) === 0) return shelves[i];
    }
    return null;
  }
  function scrapeShelf(shelf, section) {
    if (!shelf) return [];
    var items = shelf.querySelectorAll(
      "ytmusic-two-row-item-renderer, ytmusic-responsive-list-item-renderer"
    );
    var out = [];
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      var titleEl = it.querySelector("yt-formatted-string.title, .title");
      var title = clean(titleEl && titleEl.textContent);
      if (!title) continue;
      var subEl = it.querySelector("yt-formatted-string.subtitle, .subtitle, .flex-column");
      var img = it.querySelector("img");
      out.push({
        section: section,
        title: title,
        subtitle: clean(subEl && subEl.textContent),
        art: img && /^https?:/.test(img.src) ? img.src : "",
        _el: it,
      });
    }
    return out;
  }
  // SPA-navigate to home (never location.href — that reloads + kills capture)
  function goHome() {
    var items = document.querySelectorAll(
      "ytmusic-pivot-bar-item-renderer, ytmusic-pivot-bar-renderer a"
    );
    for (var i = 0; i < items.length; i++) {
      var t = clean(
        (items[i].querySelector(".tab-title, yt-formatted-string") || items[i]).textContent
      );
      var al = items[i].getAttribute("aria-label") || "";
      if (/^home$/i.test(t) || /home/i.test(al)) {
        items[i].click();
        return true;
      }
    }
    var logo = document.querySelector("ytmusic-nav-bar a#left-content, a[title='YouTube Music']");
    if (logo) {
      logo.click();
      return true;
    }
    return false;
  }
  // allowNavigate=true permits clicking the Home pivot (SPA-navigating YTM there)
  // when no shelves are on the page — reserved for the explicit HOME button. The
  // auto path (allowNavigate falsy) only scrapes shelves already present, so
  // merely opening the Library never yanks the user off their current page.
  function getHomeShelves(cb, allowNavigate) {
    var collect = function () {
      var list = scrapeShelf(findShelf("Quick picks"), "Quick Picks").concat(
        scrapeShelf(findShelf("Listen again"), "Listen Again")
      );
      homeItems = list;
      // strip the live el before handing back (winamp.js plays via homeIndex)
      cb({
        results: list.map(function (x, i) {
          return {
            section: x.section,
            title: x.title,
            subtitle: x.subtitle,
            art: x.art,
            homeIndex: i,
          };
        }),
        home: true,
      });
    };
    if (document.querySelector("ytmusic-carousel-shelf-renderer, ytmusic-shelf-renderer")) {
      collect();
      return;
    }
    if (!allowNavigate || !goHome()) {
      cb({ results: [], home: true });
      return;
    }
    var tries = 0;
    (function wait() {
      if (document.querySelector("ytmusic-carousel-shelf-renderer, ytmusic-shelf-renderer")) {
        setTimeout(collect, 400);
        return;
      }
      if (++tries > 30) {
        cb({ results: [], home: true });
        return;
      }
      setTimeout(wait, 250);
    })();
  }

  // Spotify in-app search: type into Spotify's own box (SPA route — keeps capture alive,
  // live-verified no reload), click the "Songs" filter chip for a clean track list, then
  // scrape the rows. Row element refs are cached so playLibraryItem can click play-by-index.
  var spotifyRows = [];
  function scrapeSpotifyResults() {
    var rows = qaAll(PROVIDER.searchResultRow),
      out = [];
    spotifyRows = [];
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      var title = clean(firstTextIn(r, PROVIDER.searchResultTitle));
      if (!title) continue;
      var img = r.querySelector("img");
      spotifyRows.push(r);
      out.push({
        section: "Songs",
        title: title,
        subtitle: clean(firstTextIn(r, PROVIDER.searchResultArtist)),
        art: img && /^https?:/.test(img.src) ? img.src : "",
        rowIndex: spotifyRows.length - 1,
        play: true,
        plays: "",
        kind: "song",
      });
    }
    return out;
  }
  function searchSpotify(query, cb) {
    var input = qa(PROVIDER.searchBox);
    if (!input) {
      cb({ error: "search box not found" });
      return;
    }
    input.focus();
    try {
      Object.getOwnPropertyDescriptor(Object.getPrototypeOf(input), "value").set.call(input, query);
    } catch (_) {
      input.value = query;
    }
    input.dispatchEvent(new Event("input", { bubbles: true }));
    setTimeout(function () {
      ["keydown", "keyup"].forEach(function (t) {
        input.dispatchEvent(
          new KeyboardEvent(t, {
            key: "Enter",
            code: "Enter",
            keyCode: 13,
            which: 13,
            bubbles: true,
          })
        );
      });
      var tries = 0;
      (function waitSearch() {
        if (location.pathname.indexOf("/search/") === 0) {
          // narrow to the Songs sub-view (an <a> chip → SPA, no reload) for a full track list
          if (location.pathname.indexOf("/tracks") < 0) {
            var songs = q("a[href*='/search/'][href$='/tracks']");
            if (songs) songs.click();
          }
          var t2 = 0;
          (function waitRows() {
            if (qaAll(PROVIDER.searchResultRow).length) {
              setTimeout(function () {
                cb({ results: scrapeSpotifyResults(), query: query });
              }, 450);
              return;
            }
            if (++t2 > 28) {
              cb({ results: scrapeSpotifyResults(), query: query });
              return;
            }
            setTimeout(waitRows, 250);
          })();
          return;
        }
        if (++tries > 28) {
          cb({ error: "search timed out", query: query });
          return;
        }
        setTimeout(waitSearch, 250);
      })();
    }, 350);
  }

  function search(query, cb) {
    if (PROVIDER.searchResultRow) {
      searchSpotify(query, cb);
      return;
    } // provider with in-app results (Spotify)
    if (!triggerSearch(query)) {
      cb({ error: "search box not found" });
      return;
    }
    // submit after a tick so autocomplete doesn't swallow the Enter
    setTimeout(function () {
      var input = q("ytmusic-search-box input#input") || q("ytmusic-search-box input");
      if (input)
        ["keydown", "keypress", "keyup"].forEach(function (t) {
          input.dispatchEvent(
            new KeyboardEvent(t, {
              key: "Enter",
              code: "Enter",
              keyCode: 13,
              which: 13,
              bubbles: true,
            })
          );
        });
      var tries = 0;
      (function waitForResults() {
        var ready =
          location.href.indexOf("/search") !== -1 &&
          document.querySelectorAll(
            "ytmusic-responsive-list-item-renderer, ytmusic-card-shelf-renderer"
          ).length;
        if (ready) {
          setTimeout(function () {
            cb({ results: scrapeResults(), query: query });
          }, 650);
          return;
        }
        if (++tries > 30) {
          cb({ error: "search timed out", query: query });
          return;
        }
        setTimeout(waitForResults, 300);
      })();
    }, 350);
  }

  // --- provider abstraction --------------------------------------------------
  // Metadata is already provider-agnostic (MediaSession, above). Only the TRANSPORT
  // controls + shuffle/repeat differ per site, so each provider just supplies selector
  // lists and the control methods click the first that matches. Picked by hostname.
  // (Inline for now; the design doc's providers/*.js split is a later refactor.)
  // play/pause/seek/volume use the media element generically; next/prev/shuffle/repeat
  // have no media-element equivalent, so they're button clicks (the one fragile bit —
  // destined for the remote selector-config hot-fix channel).
  var PROVIDERS = {
    "music.youtube.com": {
      id: "youtube-music",
      // play/pause uses the media element here (works + instant) — no button needed
      next: [
        "ytmusic-player-bar .next-button",
        "tp-yt-paper-icon-button.next-button",
        ".next-button",
      ],
      prev: [
        "ytmusic-player-bar .previous-button",
        "tp-yt-paper-icon-button.previous-button",
        ".previous-button",
      ],
      shuffle: [
        "ytmusic-player-bar .shuffle",
        "tp-yt-paper-icon-button.shuffle",
        "[aria-label*='Shuffle' i]",
      ],
      repeat: [
        "ytmusic-player-bar .repeat",
        "tp-yt-paper-icon-button.repeat",
        "[aria-label*='Repeat' i]",
      ],
      searchBox: ["ytmusic-search-box input#input", "ytmusic-search-box input", "input.search"],
      // YTM plays gaplessly: <video>.currentTime is a continuous cross-track timeline, so read the
      // per-track position from the player bar's "current / duration" text (the progress slider's
      // aria-value* are PERCENTAGES, not seconds). The .time-info element holds e.g. "2:54 / 4:33".
      posBar: ["ytmusic-player-bar .time-info", "ytmusic-player-bar"],
      // lyrics: the Lyrics tab fills a description shelf — ONE element, \n-separated lines
      // (live-verified: 57 newlines, no <br>). Present only while the Lyrics tab is open.
      lyricsTab: ["tp-yt-paper-tab"],
      lyricsText: [
        "ytmusic-description-shelf-renderer yt-formatted-string.description",
        "ytmusic-description-shelf-renderer .description",
      ],
    },
    "open.spotify.com": {
      id: "spotify",
      // In-app search results now work (live-verified selectors below); no dislike. Queue IS mirrored.
      capabilities: { library: true, dislike: false },
      // Spotify is an EME player — drive its own DOM buttons (data-testids are stable;
      // aria-label fallbacks add resilience). Direct media-element control is unreliable.
      playPause: [
        "[data-testid='control-button-playpause']",
        "button[aria-label='Play']",
        "button[aria-label='Pause']",
      ],
      next: ["[data-testid='control-button-skip-forward']", "button[aria-label='Next']"],
      prev: ["[data-testid='control-button-skip-back']", "button[aria-label='Previous']"],
      // shuffle has NO data-testid (live DOM); its aria-label is dynamic ("Enable/Disable Shuffle …")
      shuffle: ["button[aria-label*='shuffle' i]", "[data-testid='control-button-shuffle']"],
      repeat: ["[data-testid='control-button-repeat']", "button[aria-label*='repeat' i]"],
      // single "Add to Liked Songs" (binary) — wired to like(); no dislike
      // Save toggle: its aria-label flips ("Add to Liked Songs" when unsaved ⇄ "Add to
      // playlist" when saved), so we match the STABLE aria-checked state attribute (present
      // in both states, only on this button within the now-playing widget). readLikeStatus
      // reads aria-checked="true" ⇒ saved ⇒ heart lit.
      like: [
        "[data-testid='now-playing-widget'] button[aria-checked]",
        "[data-testid='now-playing-widget'] button[aria-label*='Liked Songs' i]",
      ],
      searchBox: ["[data-testid='search-input']", "input[data-testid='search-input']"],
      // Spotify has no readable media element for us, so read position from its DOM text
      // (lets the seek bar show progress); times are "m:ss" → parsed to seconds. Flat array
      // keys (not a nested object) so they're remotely hot-fixable like every other selector.
      posElapsed: ["[data-testid='playback-position']"],
      posDuration: ["[data-testid='playback-duration']"],
      // Queue (right panel): "Next in queue" rows are <li role="row"> — the Library
      // sidebar uses <div role="row">, so the li scopes us to the queue. Title via the
      // aria-labelledby target (#listrow-title-…), artist via the artist link. Robust
      // role/aria/href anchors only — NEVER Spotify's hashed CSS classes (e.g. q8mQFn…).
      queueOpen: ["[data-testid='control-button-queue']"],
      // Scope to the queue's own treegrids (Now playing + Next up) — a bare li[role='row']
      // also matches a stray row on other pages, so when the panel CLOSED the mirror
      // collapsed to that one wrong row. Live-verified: queue rows are ul[role='treegrid']
      // > li[role='row']; closed → no treegrid → 0 rows → the cache keeps the mirror.
      queueRow: ["ul[role='treegrid'] li[role='row']"],
      queueTitle: ["[id^='listrow-title']"],
      queueArtist: ["a[href*='/artist/']"],
      queuePlay: ["[data-testid='play-button']", "button[aria-label*='play' i]"],
      // seek bar = a React-controlled <input type=range>, value in MS (0..duration_ms)
      seekBar: ["[data-testid='playback-progressbar'] input[type='range']"],
      // in-app search results (live-verified on /search/<q>/tracks): each track is a
      // [data-testid='tracklist-row']; title = the /track/ link, artist = the /artist/
      // link, play = the row's "Play …" button (no testid — aria-label starts "Play").
      searchResultRow: ["[data-testid='tracklist-row']"],
      searchResultTitle: ["a[href*='/track/']"],
      searchResultArtist: ["a[href*='/artist/']"],
      searchResultPlay: ["button[aria-label^='Play' i]", "[data-testid='play-button']"],
      // lyrics pane (opened via the lyrics button): every line is [data-testid='lyrics-line']
      lyricsBtn: ["[data-testid='lyrics-button']"],
      lyricsLine: ["[data-testid='lyrics-line']"],
    },
  };
  function activeProvider() {
    var host = location.hostname;
    for (var k in PROVIDERS) {
      if (PROVIDERS.hasOwnProperty(k) && (host === k || host.endsWith("." + k)))
        return PROVIDERS[k];
    }
    return null;
  }
  var PROVIDER = activeProvider() || { id: "unknown" };

  // Pristine copy of the bundled selectors so remote overrides always merge over the
  // ORIGINALS (idempotent across refreshes), then a remote-config layer: the SW fetches
  // GitHub-hosted selectors (raw.githubusercontent) and caches them in chrome.storage; here we try
  // them BEFORE the bundled defaults (qa = first match wins; defaults kept as fallback),
  // so a broken transport selector can be hot-fixed without an extension release.
  // See docs/neoamp-ui/MULTI-PROVIDER-DESIGN.md.
  var DEFAULT_PROVIDERS = JSON.parse(JSON.stringify(PROVIDERS));
  function applySelectorOverrides(cfg) {
    for (var h in DEFAULT_PROVIDERS)
      PROVIDERS[h] = JSON.parse(JSON.stringify(DEFAULT_PROVIDERS[h]));
    if (cfg && cfg.providers && typeof cfg.providers === "object") {
      Object.keys(cfg.providers).forEach(function (host) {
        var ov = cfg.providers[host];
        if (!ov || typeof ov !== "object") return;
        if (!PROVIDERS[host]) PROVIDERS[host] = { id: host };
        Object.keys(ov).forEach(function (key) {
          var arr = ov[key];
          if (
            Array.isArray(arr) &&
            arr.length &&
            arr.every(function (s) {
              return typeof s === "string";
            })
          ) {
            var defs = PROVIDERS[host][key] || [];
            PROVIDERS[host][key] = arr.concat(
              defs.filter(function (s) {
                return arr.indexOf(s) === -1;
              })
            );
          }
        });
      });
    }
    PROVIDER = activeProvider() || PROVIDER; // re-point at the rebuilt active entry
  }
  try {
    chrome.storage.local.get("neoampSelectors", function (r) {
      applySelectorOverrides(r && r.neoampSelectors);
    });
    chrome.storage.onChanged.addListener(function (ch, area) {
      if (area === "local" && ch.neoampSelectors)
        applySelectorOverrides(ch.neoampSelectors.newValue);
    });
  } catch (_) {}

  function mediaEl() {
    return q("video") || q("audio");
  }
  // Per-track position. YTM plays GAPLESSLY (MSE): its single <video>.currentTime is a CONTINUOUS
  // timeline that does NOT reset between tracks (measured: it climbs 381→382→383… across a track
  // change while the song restarts at 0:00), so the element time is wrong for the per-track clock
  // and seek bar. Read the provider's own UI instead. Order: a combined "cur / dur" text (YTM's
  // player-bar .time-info), then separate elapsed/duration text (Spotify), then the media element
  // (providers whose element exposes a real per-track timeline).
  function readPosition(v) {
    if (PROVIDER.posBar) {
      var el = qa(PROVIDER.posBar);
      var m = el && el.textContent && el.textContent.match(/(\d+):(\d{2})\s*\/\s*(\d+):(\d{2})/);
      if (m) {
        var d = +m[3] * 60 + +m[4];
        if (d > 0) return { cur: +m[1] * 60 + +m[2], dur: d };
      }
    }
    if (PROVIDER.posElapsed || PROVIDER.posDuration) {
      var dd = parseTime(textOf(PROVIDER.posDuration)),
        cc = parseTime(textOf(PROVIDER.posElapsed));
      if (dd > 0) return { cur: cc, dur: dd };
    }
    if (v && isFinite(v.duration) && v.duration > 0)
      return { cur: v.currentTime || 0, dur: v.duration };
    return { cur: 0, dur: 0 };
  }
  function clickSel(list) {
    var b = list && qa(list);
    if (b) {
      b.click();
      return true;
    }
    return false;
  }
  function textOf(list) {
    var el = list && qa(list);
    return el ? clean(el.textContent) : "";
  }
  function qaAll(list) {
    if (!list) return [];
    for (var i = 0; i < list.length; i++) {
      try {
        var n = document.querySelectorAll(list[i]);
        if (n.length) return n;
      } catch (_) {}
    }
    return [];
  }
  function firstTextIn(root, list) {
    if (!list) return "";
    for (var i = 0; i < list.length; i++) {
      var el = root.querySelector(list[i]);
      if (el) return el.textContent;
    }
    return "";
  }
  function firstIn(root, list) {
    if (!list) return null;
    for (var i = 0; i < list.length; i++) {
      var el = root.querySelector(list[i]);
      if (el) return el;
    }
    return null;
  }
  // Set a React-controlled <input> value so the framework's onChange fires (a plain
  // .value assignment is swallowed by React's value tracker). Used for provider seek bars.
  function setRangeValue(input, val) {
    try {
      var d = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value");
      (d && d.set
        ? d.set
        : function (x) {
            input.value = x;
          }
      ).call(input, String(val));
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    } catch (_) {
      try {
        input.value = String(val);
        return true;
      } catch (e) {
        return false;
      }
    }
  }
  // Seek on sites with no controllable media element: drive the provider's range slider,
  // scaling the target seconds to the slider's own max (Spotify's is milliseconds).
  function seekProvider(t) {
    if (!PROVIDER.seekBar) return;
    var inp = qa(PROVIDER.seekBar),
      durSec = parseTime(textOf(PROVIDER.posDuration));
    if (!inp || !(durSec > 0) || !isFinite(t)) return;
    var max = parseFloat(inp.max) || durSec * 1000;
    if (setRangeValue(inp, Math.round(Math.max(0, Math.min(1, t / durSec)) * max))) sendTrack();
  }
  function parseTime(s) {
    // "m:ss" / "h:mm:ss" → seconds
    if (!s) return 0;
    var p = String(s)
      .split(":")
      .map(function (n) {
        return parseInt(n, 10);
      });
    if (p.some(isNaN)) return 0;
    return p.reduce(function (a, n) {
      return a * 60 + n;
    }, 0);
  }
  // Player volume runs on the offscreen master gain (provider-agnostic — works even when a
  // site exposes no controllable media element, e.g. Spotify). Persisted + relayed live.
  var playerVolume = 1;
  var playerMuted = false;
  // Mute is NOT a separate offscreen state — it folds into the SAME master-gain relay:
  // we send 0 when muted, the real volume otherwise. One gain authority, no new message.
  function relayVolume() {
    try {
      chrome.runtime.sendMessage({
        target: "sw",
        type: "relay-volume",
        volume: playerMuted ? 0 : playerVolume,
      });
    } catch (_) {}
  }
  function persistVolume() {
    try {
      chrome.storage.local.set({ neoampVolume: playerVolume });
    } catch (_) {}
  }
  function persistMute() {
    try {
      chrome.storage.local.set({ neoampMute: playerMuted });
    } catch (_) {}
  }
  function isPaused() {
    if (PROVIDER.playPause) {
      // EME providers (Spotify): <video>.paused is unreliable
      var b = qa(PROVIDER.playPause);
      var al = ((b && b.getAttribute("aria-label")) || "").toLowerCase();
      if (/pause/.test(al)) return false; // button labeled "Pause" ⇒ currently playing
      if (/play/.test(al)) return true; // button labeled "Play"  ⇒ currently paused
      return mediaMeta.playbackState ? mediaMeta.playbackState !== "playing" : true;
    }
    var v = mediaEl();
    if (v) return v.paused;
    return mediaMeta.playbackState ? mediaMeta.playbackState !== "playing" : true;
  }
  // Prefer the provider's own play/pause toggle button (reliable on EME players like
  // Spotify); fall back to the media element (YTM, and any site without a button sel).
  function doPlayPause() {
    if (PROVIDER.playPause && clickSel(PROVIDER.playPause)) {
      setTimeout(sendTrack, 200);
      return;
    }
    var v = mediaEl();
    if (v) {
      v.paused ? v.play() : v.pause();
      sendTrack();
    }
  }

  var control = {
    playPause: function () {
      doPlayPause();
    },
    play: function () {
      if (isPaused()) doPlayPause();
    },
    pause: function () {
      if (!isPaused()) doPlayPause();
    },
    next: function () {
      clickSel(PROVIDER.next);
    },
    prev: function () {
      clickSel(PROVIDER.prev);
    },
    stop: function () {
      if (!isPaused()) doPlayPause();
      var v = mediaEl();
      if (v) {
        try {
          // seek to the CURRENT track's start, not absolute 0 (which on YTM's gapless timeline
          // would land in an earlier track). offset = element-time − per-track-time = track start.
          v.currentTime = Math.max(0, (v.currentTime || 0) - readPosition(v).cur);
        } catch (_) {}
      }
      sendTrack();
    },
    // seek to absolute (per-track) seconds: media element when it has a real timeline, else the
    // provider's own seek slider (Spotify — its <video> can't be seeked by us).
    seek: function (t) {
      var v = mediaEl();
      if (v && isFinite(v.duration) && v.duration > 0) {
        if (isFinite(t)) {
          // map the per-track target onto the element's (possibly gapless) timeline: add the
          // track-start offset so seeking to 1:00 lands at 1:00 of THIS track, not the stream.
          var offset = (v.currentTime || 0) - readPosition(v).cur;
          v.currentTime = Math.max(0, offset + t);
          sendTrack();
        }
        return;
      }
      seekProvider(t);
    },
    // relative seek (keyboard ←/→) — reads the live time so it isn't stale-by-a-tick
    seekBy: function (d) {
      var v = mediaEl();
      if (v && isFinite(v.currentTime) && isFinite(v.duration) && v.duration > 0) {
        v.currentTime = Math.max(0, Math.min(v.duration, v.currentTime + d));
        sendTrack();
        return;
      }
      seekProvider(parseTime(textOf(PROVIDER.posElapsed)) + d);
    },
    // volume = the offscreen master gain (provider-agnostic; works on sites with no
    // controllable media element, e.g. Spotify). Relayed live + persisted.
    setVolume: function (x) {
      playerVolume = clamp(+x || 0, 0, 1);
      if (playerVolume > 0) playerMuted = false;
      relayVolume();
      persistVolume();
      persistMute();
    },
    nudgeVolume: function (d) {
      playerVolume = clamp(playerVolume + d, 0, 1);
      if (playerVolume > 0) playerMuted = false;
      relayVolume();
      persistVolume();
      persistMute();
      sendTrack();
    },
    getVolume: function () {
      return playerVolume;
    }, // the REAL volume, so the slider doesn't snap to 0 while muted
    setMute: function (b) {
      playerMuted = b === undefined ? !playerMuted : !!b;
      relayVolume();
      persistMute();
      return playerMuted;
    },
    isMuted: function () {
      return playerMuted;
    },
    getCapabilities: function () {
      return (PROVIDER && PROVIDER.capabilities) || {};
    },
    focusSearch: function () {
      // focus the active site's own search box (provider-aware)
      var s = PROVIDER.searchBox && qa(PROVIDER.searchBox);
      if (s && s.focus) {
        s.focus();
        if (s.scrollIntoView) s.scrollIntoView({ block: "center" });
        return true;
      }
      return false;
    },
    // open the site's own queue panel if the queue DOM isn't rendered yet (e.g. Spotify
    // only mounts its queue rows when its queue panel is open). No-op once rows exist.
    ensureQueueOpen: function () {
      if (!PROVIDER.queueRow || !PROVIDER.queueOpen) return false;
      if (qaAll(PROVIDER.queueRow).length) return false;
      return clickSel(PROVIDER.queueOpen);
    },
    // open the provider's OWN lyrics pane so its lyrics load into the DOM (they're lazy —
    // YTM only populates the description shelf once its Lyrics tab is activated; Spotify
    // only renders lyrics-line nodes once its lyrics view is opened). Self-gating: no-op if
    // lyrics are already present. Called when NeoAmp's Lyrics window opens. On YTM the queue
    // items stay in the DOM under the inactive Up-Next tab (verified), so the mirror is safe.
    ensureLyrics: function () {
      if (PROVIDER.lyricsText) {
        // YTM: activate the Lyrics tab
        if (qa(PROVIDER.lyricsText)) return; // already loaded
        var tabs = qaAll(PROVIDER.lyricsTab);
        for (var i = 0; i < tabs.length; i++) {
          if (!/lyric/i.test(tabs[i].textContent || "")) continue;
          if (tabs[i].getAttribute("aria-selected") === "true") return; // already on Lyrics
          // YTM's tabs are Polymer paper-tabs: a synthetic .click() does NOT switch them.
          // Setting the parent tp-yt-paper-tabs `.selected` index DOES (switches + lazy-loads).
          var parent = tabs[i].parentElement;
          while (parent && !/paper-tabs/i.test(parent.tagName)) parent = parent.parentElement;
          if (parent && "selected" in parent) {
            var sibs = parent.querySelectorAll("tp-yt-paper-tab");
            parent.selected = [].indexOf.call(sibs, tabs[i]);
          } else {
            tabs[i].click();
          } // fallback
          setTimeout(sendTrack, 1200); // let the lazy lyrics render, then push
          return;
        }
        return;
      }
      if (PROVIDER.lyricsLine && PROVIDER.lyricsBtn) {
        // Spotify: open the lyrics view
        if (qaAll(PROVIDER.lyricsLine).length) return; // already open
        if (clickSel(PROVIDER.lyricsBtn)) setTimeout(sendTrack, 800);
      }
    },
    // click the provider's shuffle/repeat button, then re-read shortly after so the UI
    // reflects the ACTUAL resulting state (sites flip it async; like the like/dislike path).
    toggleShuffle: function () {
      if (clickSel(PROVIDER.shuffle)) setTimeout(sendTrack, 250);
    },
    toggleRepeat: function () {
      if (clickSel(PROVIDER.repeat)) setTimeout(sendTrack, 250);
    },
    // --- equalizer + balance (relayed live to the offscreen audio engine) ---
    getEqState: function () {
      return {
        enabled: eqState.enabled,
        preamp: eqState.preamp,
        bands: eqState.bands.slice(),
        balance: eqState.balance,
      };
    },
    setEqEnabled: function (on) {
      eqState.enabled = !!on;
      relayEq();
      persistEq();
    },
    setPreamp: function (db) {
      eqState.preamp = +db || 0;
      relayEq();
      persistEq();
    },
    setEqBand: function (i, db) {
      if (i >= 0 && i < eqState.bands.length) {
        eqState.bands[i] = +db || 0;
        relayEq();
        persistEq();
      }
    },
    setBalance: function (x) {
      eqState.balance = clamp(+x || 0, -1, 1);
      relayEq();
      persistEq();
    },
    // bulk-apply a preset (all 10 bands + optional preamp/enabled) in one relay
    setEq: function (bands, preamp, enabled) {
      if (bands && bands.length === eqState.bands.length) eqState.bands = bands.map(Number);
      if (typeof preamp === "number") eqState.preamp = preamp;
      if (typeof enabled === "boolean") eqState.enabled = enabled;
      relayEq();
      persistEq();
    },
    playQueueItem: function (i) {
      if (PROVIDER.queueRow) {
        // provider-configured queue (Spotify): click the row's own play button
        var play = function () {
          var rows = qaAll(PROVIDER.queueRow),
            r = rows[i];
          if (!r) return false;
          var pb = firstIn(r, PROVIDER.queuePlay);
          if (pb) {
            pb.click();
            return true;
          }
          return false;
        };
        if (play()) return;
        if (control.ensureQueueOpen()) setTimeout(play, 700); // panel closed → open it, then retry
        return;
      }
      var items = document.querySelectorAll("ytmusic-player-queue-item");
      var it = items[i];
      if (!it) return;
      // Verified live: only the thumbnail play-button overlay actually starts
      // the row — clicking .song-info / the row / dblclick do nothing.
      var target =
        it.querySelector("ytmusic-play-button-renderer") ||
        it.querySelector(".thumbnail yt-icon, yt-icon.icon") ||
        it;
      target.click();
    },
    playLibraryItem: function (rowIndex) {
      if (PROVIDER.searchResultRow) {
        // provider with cached result rows (Spotify)
        var sr = spotifyRows[rowIndex];
        if (!sr) return;
        var pb = firstIn(sr, PROVIDER.searchResultPlay);
        if (pb) pb.click();
        return;
      }
      if (rowIndex < 0) {
        var card = document.querySelector("ytmusic-card-shelf-renderer");
        var cb = card && card.querySelector("ytmusic-play-button-renderer");
        if (cb) cb.click();
        return;
      }
      var rows = document.querySelectorAll("ytmusic-responsive-list-item-renderer");
      var r = rows[rowIndex];
      if (!r) return;
      var b =
        r.querySelector("ytmusic-play-button-renderer") ||
        r.querySelector(".thumbnail yt-icon, yt-icon.icon");
      if (b) b.click();
    },
    // OPEN a playlist/album result as an SPA route (click its title link — never
    // location.href). Use for collection rows; playLibraryItem still PLAYS them.
    openLibraryItem: function (rowIndex) {
      var r =
        rowIndex < 0
          ? document.querySelector("ytmusic-card-shelf-renderer")
          : document.querySelectorAll("ytmusic-responsive-list-item-renderer")[rowIndex];
      if (!r) return;
      var link =
        r.querySelector("a.yt-simple-endpoint.yt-formatted-string") ||
        r.querySelector("yt-formatted-string.title a") ||
        r.querySelector(
          "a.yt-simple-endpoint[href*='list='], a.yt-simple-endpoint[href*='browse/']"
        );
      if (link) link.click();
    },
    // like/dislike toggle the current track (3-state — clicking when already
    // set returns to neutral). Anchor on the unambiguous #button-shape-* ids.
    like: function () {
      // binary-save providers (Spotify "Add to Liked Songs") click their own button
      if (PROVIDER.like) {
        if (clickSel(PROVIDER.like)) setTimeout(sendTrack, 300);
        return;
      }
      var r = likeRenderer();
      if (!r) return;
      var b =
        r.querySelector("#button-shape-like > button") ||
        r.querySelector("#button-shape-like button") ||
        r.querySelector("button[aria-label='Like']");
      // YTM flips like-status asynchronously — re-read after a tick so the LED
      // reflects the toggle promptly instead of waiting for the 400ms poll.
      if (b) {
        b.click();
        setTimeout(sendTrack, 250);
      }
    },
    dislike: function () {
      if (PROVIDER.capabilities && PROVIDER.capabilities.dislike === false) return; // no dislike (Spotify)
      var r = likeRenderer();
      if (!r) return;
      var b =
        r.querySelector("#button-shape-dislike > button") ||
        r.querySelector("#button-shape-dislike button") ||
        r.querySelector("button[aria-label='Dislike']");
      if (b) {
        b.click();
        setTimeout(sendTrack, 250);
      }
    },
    // play a scraped home-shelf item by its index (refs held in homeItems)
    playHomeItem: function (idx) {
      var it = homeItems[idx];
      if (!it || !it._el) return;
      // the cached node goes stale after any SPA navigation (e.g. a search) tore
      // down the home DOM — detect it (a detached node is still truthy) and bail.
      if (!document.contains(it._el)) {
        toast("Home list changed — press HOME to refresh");
        return;
      }
      var b =
        it._el.querySelector("ytmusic-play-button-renderer") ||
        it._el.querySelector(".thumbnail yt-icon, yt-icon.icon");
      if (b) {
        b.click();
        return;
      }
      var a = it._el.querySelector("a.yt-simple-endpoint[href]");
      if (a) a.click();
    },
  };

  // --- storage (chrome.storage, async; the iframe can't use it directly) ----
  var storage = {
    get: function (key, cb) {
      try {
        chrome.storage.local.get(key, function (r) {
          cb(r ? r[key] : undefined);
        });
      } catch (_) {
        cb(undefined);
      }
    },
    set: function (obj) {
      try {
        chrome.storage.local.set(obj);
      } catch (_) {}
    },
  };

  // restore the saved EQ (Winamp remembers it). Loaded eagerly so start() sees it
  // when building the graph and the UI sees it via getEqState() at build time.
  storage.get("neoampEq", function (e) {
    if (!e || !e.bands || e.bands.length !== eqState.bands.length) return;
    eqState.enabled = e.enabled !== false;
    eqState.preamp = +e.preamp || 0;
    eqState.bands = e.bands.map(Number);
    eqState.balance = clamp(+e.balance || 0, -1, 1);
    relayEq(); // if capture is already live, push the restored curve to the engine
  });
  storage.get("neoampVolume", function (v) {
    if (typeof v === "number") {
      playerVolume = clamp(v, 0, 1);
      relayVolume();
    }
  });
  storage.get("neoampMute", function (m) {
    if (typeof m === "boolean") {
      playerMuted = m;
      relayVolume();
    }
  });

  function toast(msg) {
    var t = document.createElement("div");
    t.className = "ytm-wmp-toast";
    t.textContent = msg;
    document.documentElement.appendChild(t);
    setTimeout(function () {
      t.parentNode && t.parentNode.removeChild(t);
    }, 4500);
  }

  // messages from the service worker: lifecycle (raise/hide the player when capture
  // begins/ends), FFT frames (drive the visuals), and status toasts.
  try {
    chrome.runtime.onMessage.addListener(function (msg) {
      if (!msg || msg.target !== "content") return;
      if (msg.type === "lifecycle") {
        msg.state === "started" ? onEqStarted() : onEqStopped();
      } else if (msg.type === "fft") onFft(msg.b64);
      else if (msg.type === "audioInfo") audioSampleRate = +msg.sampleRate || 0;
      else if (msg.type === "toast") toast(msg.text);
    });
  } catch (_) {}

  window.NeoAmp = {
    // START needs a gesture the extension owns (the right-click menu); the launcher /
    // Shift+V can only guide to it. STOP works anytime (no gesture needed).
    start: startHint,
    stop: requestStop,
    isRunning: function () {
      return running;
    },
    on: on,
    off: off,
    getTrack: getTrack,
    getQueue: readQueue,
    search: search,
    getHomeShelves: getHomeShelves,
    control: control,
    storage: storage,
    toast: toast,
    FFT_SIZE: FFT_SIZE,
  };

  // Tell the SW a fresh page loaded so it clears any stale capture state for this tab.
  // After a refresh the old capture is dead, but the SW may still think it's live — which
  // made starting take TWO clicks (first click stopped the ghost session).
  try {
    chrome.runtime.sendMessage({ target: "sw", type: "content-loaded" });
  } catch (_) {}
})();
