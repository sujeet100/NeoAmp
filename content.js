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

  var timeBytes = null, freqBytes = null, running = false;
  var trackTimer = 0, lastTrack = null;

  // EQ state — the UI's source of truth. The actual audio graph lives in the OFFSCREEN
  // document (it owns the gesture-gated tabCapture); the content script relays changes
  // there via the service worker and persists them. Flat (all 0, balance 0) = transparent.
  var eqState = { enabled: true, preamp: 0, bands: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], balance: 0 };
  var eqSaveTimer = 0;

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

  // --- EQ helpers -----------------------------------------------------------
  function clamp(x, lo, hi) { return Math.max(lo, Math.min(hi, x)); }
  // relay the live EQ to the offscreen engine (via the service worker) so a fader
  // drag shapes the audio immediately. Harmless if capture isn't running.
  function relayEq() {
    try {
      chrome.runtime.sendMessage({
        target: "sw", type: "relay-eq",
        eq: { bands: eqState.bands.slice(), preamp: eqState.preamp, balance: eqState.balance, enabled: eqState.enabled },
      });
    } catch (_) {}
  }
  function persistEq() {
    clearTimeout(eqSaveTimer);
    eqSaveTimer = setTimeout(function () { try { chrome.storage.local.set({ neoampEq: eqState }); } catch (_) {} }, 400);
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
    relayEq();               // hand the engine the persisted curve
    emit("start");
    sendTrack();
  }
  function onEqStopped() {
    if (!running) return;
    running = false;
    clearInterval(trackTimer); trackTimer = 0;
    timeBytes = freqBytes = null;
    emit("stop");
  }
  // FFT frames arrive base64-packed [time(FFT_SIZE) | freq(FFT_SIZE/2)] because
  // runtime messaging is JSON (typed arrays can't cross). Unpack + fan out to the
  // same "audio" subscribers as before (the viz iframe bridge + the spectrum analyzer).
  function onFft(b64) {
    if (!running || !timeBytes) return;
    var bin; try { bin = atob(b64); } catch (_) { return; }
    if (bin.length !== timeBytes.length + freqBytes.length) return;
    for (var i = 0; i < timeBytes.length; i++) timeBytes[i] = bin.charCodeAt(i) & 255;
    for (var j = 0; j < freqBytes.length; j++) freqBytes[j] = bin.charCodeAt(timeBytes.length + j) & 255;
    frame.time = timeBytes; frame.freq = freqBytes;
    emit("audio", frame);
  }
  // ask the SW to stop capture (stopping needs no gesture, unlike starting)
  function requestStop() { try { chrome.runtime.sendMessage({ target: "sw", type: "stop-capture" }); } catch (_) {} }
  // a page button can't START capture — guide the user to the right-click menu
  function startHint() { toast("To open NeoAmp: click the gold “N” toolbar icon, or right-click the page → “Open NeoAmp player”."); }

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
    return readPressed(qa(["ytmusic-player-bar [aria-label*='Shuffle' i]", "ytmusic-player-bar .shuffle"]));
  }
  function readRepeat() {
    var bar = q("ytmusic-player-bar");
    var mode = bar && (bar.getAttribute("repeat-mode") || bar.getAttribute("repeat_mode") || "");
    if (mode) return !/none|off/i.test(mode);   // NONE / ALL_OFF = off; ALL / ONE = on
    var b = qa(["ytmusic-player-bar [aria-label*='Repeat' i]", "ytmusic-player-bar .repeat"]);
    var p = readPressed(b);
    if (p != null) return p;
    var al = (b && (b.getAttribute("aria-label") || b.getAttribute("title")) || "").toLowerCase();
    if (/off/.test(al)) return false;
    if (/repeat (all|one)|one|all/.test(al)) return true;
    return null;
  }

  function readTrack() {
    var v = q("video") || q("audio");
    var titleEl = q("ytmusic-player-bar .title");
    var bylineEl = q("ytmusic-player-bar .byline");
    var artEl = q("ytmusic-player-bar img.image") || q("ytmusic-player-bar img");
    var by = parseByline(bylineEl && bylineEl.textContent);
    // Prefer the MediaSession snapshot (web standard every major player sets for the OS
    // media controls — provider-agnostic + far more stable than site CSS classes). Fall
    // back to YTM's DOM scrape for fields MediaSession doesn't carry (album/year/plays/
    // likes) and for the brief window before the first snapshot arrives.
    var ms = mediaMeta || {};
    return {
      title: ms.title || clean(titleEl && titleEl.textContent),
      artist: ms.artist || by.artist,
      album: ms.album || by.album,
      year: by.year,
      plays: by.plays,                                 // best-effort; often ""
      likeStatus: readLikeStatus(),
      art: ms.art || (artEl ? artEl.src : ""),
      currentTime: v ? v.currentTime : 0,
      duration: v && isFinite(v.duration) ? v.duration : 0,
      paused: v ? v.paused : (ms.playbackState ? ms.playbackState !== "playing" : true),
      volume: v ? v.volume : 1,
      shuffle: readShuffle(),                          // true | false | null (unknown)
      repeat: readRepeat(),                            // true | false | null (unknown)
    };
  }
  function getTrack() { return lastTrack || readTrack(); }
  function sendTrack() { lastTrack = readTrack(); lastTrack.sampleRate = audioSampleRate; emit("track", lastTrack); }

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
        plays: matchPlays(byline),               // from the byline only (usually absent)
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
    // scan only the metadata flex columns — not the whole row (a title containing
    // "views"/"plays" would otherwise yield a bogus count)
    var cols = r.querySelectorAll(".flex-column, yt-formatted-string.flex-column, .secondary-flex-columns yt-formatted-string");
    for (var i = 0; i < cols.length; i++) { var m = matchPlays(cols[i].textContent); if (m) return m; }
    return "";
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
  // allowNavigate=true permits clicking the Home pivot (SPA-navigating YTM there)
  // when no shelves are on the page — reserved for the explicit HOME button. The
  // auto path (allowNavigate falsy) only scrapes shelves already present, so
  // merely opening the Library never yanks the user off their current page.
  function getHomeShelves(cb, allowNavigate) {
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
    if (!allowNavigate || !goHome()) { cb({ results: [], home: true }); return; }
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
      next: ["ytmusic-player-bar .next-button", "tp-yt-paper-icon-button.next-button", ".next-button"],
      prev: ["ytmusic-player-bar .previous-button", "tp-yt-paper-icon-button.previous-button", ".previous-button"],
      shuffle: ["ytmusic-player-bar .shuffle", "tp-yt-paper-icon-button.shuffle", "[aria-label*='Shuffle' i]"],
      repeat: ["ytmusic-player-bar .repeat", "tp-yt-paper-icon-button.repeat", "[aria-label*='Repeat' i]"],
    },
    "open.spotify.com": {
      id: "spotify",
      // Spotify is an EME player — drive its own DOM buttons (data-testids are stable;
      // aria-label fallbacks add resilience). Direct media-element control is unreliable.
      playPause: ["[data-testid='control-button-playpause']", "button[aria-label='Play']", "button[aria-label='Pause']"],
      next: ["[data-testid='control-button-skip-forward']", "button[aria-label='Next']"],
      prev: ["[data-testid='control-button-skip-back']", "button[aria-label='Previous']"],
      shuffle: ["[data-testid='control-button-shuffle']", "button[aria-label*='shuffle' i]"],
      repeat: ["[data-testid='control-button-repeat']", "button[aria-label*='repeat' i]"],
    },
  };
  function activeProvider() {
    var host = location.hostname;
    for (var k in PROVIDERS) { if (PROVIDERS.hasOwnProperty(k) && (host === k || host.endsWith("." + k))) return PROVIDERS[k]; }
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
    for (var h in DEFAULT_PROVIDERS) PROVIDERS[h] = JSON.parse(JSON.stringify(DEFAULT_PROVIDERS[h]));
    if (cfg && cfg.providers && typeof cfg.providers === "object") {
      Object.keys(cfg.providers).forEach(function (host) {
        var ov = cfg.providers[host]; if (!ov || typeof ov !== "object") return;
        if (!PROVIDERS[host]) PROVIDERS[host] = { id: host };
        Object.keys(ov).forEach(function (key) {
          var arr = ov[key];
          if (Array.isArray(arr) && arr.length && arr.every(function (s) { return typeof s === "string"; })) {
            var defs = PROVIDERS[host][key] || [];
            PROVIDERS[host][key] = arr.concat(defs.filter(function (s) { return arr.indexOf(s) === -1; }));
          }
        });
      });
    }
    PROVIDER = activeProvider() || PROVIDER;   // re-point at the rebuilt active entry
  }
  try {
    chrome.storage.local.get("neoampSelectors", function (r) { applySelectorOverrides(r && r.neoampSelectors); });
    chrome.storage.onChanged.addListener(function (ch, area) { if (area === "local" && ch.neoampSelectors) applySelectorOverrides(ch.neoampSelectors.newValue); });
  } catch (_) {}

  function mediaEl() { return q("video") || q("audio"); }
  function clickSel(list) { var b = list && qa(list); if (b) { b.click(); return true; } return false; }
  function isPaused() {
    var v = mediaEl();
    if (v) return v.paused;
    return mediaMeta.playbackState ? mediaMeta.playbackState !== "playing" : true;
  }
  // Prefer the provider's own play/pause toggle button (reliable on EME players like
  // Spotify); fall back to the media element (YTM, and any site without a button sel).
  function doPlayPause() {
    if (PROVIDER.playPause && clickSel(PROVIDER.playPause)) { setTimeout(sendTrack, 200); return; }
    var v = mediaEl();
    if (v) { v.paused ? v.play() : v.pause(); sendTrack(); }
  }

  var control = {
    playPause: function () { doPlayPause(); },
    play: function () { if (isPaused()) doPlayPause(); },
    pause: function () { if (!isPaused()) doPlayPause(); },
    next: function () { clickSel(PROVIDER.next); },
    prev: function () { clickSel(PROVIDER.prev); },
    stop: function () { if (!isPaused()) doPlayPause(); var v = mediaEl(); if (v) { try { v.currentTime = 0; } catch (_) {} } sendTrack(); },
    seek: function (t) { var v = mediaEl(); if (v && isFinite(t)) { v.currentTime = t; sendTrack(); } },
    // relative seek (keyboard ←/→) — reads the live time so it isn't stale-by-a-tick
    seekBy: function (d) {
      var v = mediaEl();
      if (v && isFinite(v.currentTime)) {
        var dur = isFinite(v.duration) ? v.duration : Infinity;
        v.currentTime = Math.max(0, Math.min(dur, v.currentTime + d)); sendTrack();
      }
    },
    setVolume: function (x) { var v = mediaEl(); if (v) { v.volume = Math.max(0, Math.min(1, x)); } },
    nudgeVolume: function (d) { var v = mediaEl(); if (v) { v.volume = Math.max(0, Math.min(1, v.volume + d)); sendTrack(); } },
    getVolume: function () { var v = mediaEl(); return v ? v.volume : 1; },
    // click the provider's shuffle/repeat button, then re-read shortly after so the UI
    // reflects the ACTUAL resulting state (sites flip it async; like the like/dislike path).
    toggleShuffle: function () { if (clickSel(PROVIDER.shuffle)) setTimeout(sendTrack, 250); },
    toggleRepeat: function () { if (clickSel(PROVIDER.repeat)) setTimeout(sendTrack, 250); },
    // --- equalizer + balance (relayed live to the offscreen audio engine) ---
    getEqState: function () { return { enabled: eqState.enabled, preamp: eqState.preamp, bands: eqState.bands.slice(), balance: eqState.balance }; },
    setEqEnabled: function (on) { eqState.enabled = !!on; relayEq(); persistEq(); },
    setPreamp: function (db) { eqState.preamp = +db || 0; relayEq(); persistEq(); },
    setEqBand: function (i, db) { if (i >= 0 && i < eqState.bands.length) { eqState.bands[i] = +db || 0; relayEq(); persistEq(); } },
    setBalance: function (x) { eqState.balance = clamp(+x || 0, -1, 1); relayEq(); persistEq(); },
    // bulk-apply a preset (all 10 bands + optional preamp/enabled) in one relay
    setEq: function (bands, preamp, enabled) {
      if (bands && bands.length === eqState.bands.length) eqState.bands = bands.map(Number);
      if (typeof preamp === "number") eqState.preamp = preamp;
      if (typeof enabled === "boolean") eqState.enabled = enabled;
      relayEq(); persistEq();
    },
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
      // YTM flips like-status asynchronously — re-read after a tick so the LED
      // reflects the toggle promptly instead of waiting for the 400ms poll.
      if (b) { b.click(); setTimeout(sendTrack, 250); }
    },
    dislike: function () {
      var r = likeRenderer(); if (!r) return;
      var b = r.querySelector("#button-shape-dislike > button") || r.querySelector("#button-shape-dislike button") || r.querySelector("button[aria-label='Dislike']");
      if (b) { b.click(); setTimeout(sendTrack, 250); }
    },
    // play a scraped home-shelf item by its index (refs held in homeItems)
    playHomeItem: function (idx) {
      var it = homeItems[idx]; if (!it || !it._el) return;
      // the cached node goes stale after any SPA navigation (e.g. a search) tore
      // down the home DOM — detect it (a detached node is still truthy) and bail.
      if (!document.contains(it._el)) { toast("Home list changed — press HOME to refresh"); return; }
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

  // restore the saved EQ (Winamp remembers it). Loaded eagerly so start() sees it
  // when building the graph and the UI sees it via getEqState() at build time.
  storage.get("neoampEq", function (e) {
    if (!e || !e.bands || e.bands.length !== eqState.bands.length) return;
    eqState.enabled = e.enabled !== false;
    eqState.preamp = +e.preamp || 0;
    eqState.bands = e.bands.map(Number);
    eqState.balance = clamp(+e.balance || 0, -1, 1);
    relayEq();   // if capture is already live, push the restored curve to the engine
  });

  function toast(msg) {
    var t = document.createElement("div");
    t.className = "ytm-wmp-toast";
    t.textContent = msg;
    document.documentElement.appendChild(t);
    setTimeout(function () { t.parentNode && t.parentNode.removeChild(t); }, 4500);
  }

  // messages from the service worker: lifecycle (raise/hide the player when capture
  // begins/ends), FFT frames (drive the visuals), and status toasts.
  try {
    chrome.runtime.onMessage.addListener(function (msg) {
      if (!msg || msg.target !== "content") return;
      if (msg.type === "lifecycle") { msg.state === "started" ? onEqStarted() : onEqStopped(); }
      else if (msg.type === "fft") onFft(msg.b64);
      else if (msg.type === "audioInfo") audioSampleRate = +msg.sampleRate || 0;
      else if (msg.type === "toast") toast(msg.text);
    });
  } catch (_) {}

  window.NeoAmp = {
    // START needs a gesture the extension owns (the right-click menu); the launcher /
    // Shift+V can only guide to it. STOP works anytime (no gesture needed).
    start: startHint,
    stop: requestStop,
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

  // Tell the SW a fresh page loaded so it clears any stale capture state for this tab.
  // After a refresh the old capture is dead, but the SW may still think it's live — which
  // made starting take TWO clicks (first click stopped the ghost session).
  try { chrome.runtime.sendMessage({ target: "sw", type: "content-loaded" }); } catch (_) {}
})();
