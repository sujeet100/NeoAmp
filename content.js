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

  function readTrack() {
    var v = q("video");
    var titleEl = q("ytmusic-player-bar .title");
    var bylineEl = q("ytmusic-player-bar .byline");
    var artEl = q("ytmusic-player-bar img.image") || q("ytmusic-player-bar img");
    // byline is "Artist • Album • Year • plays" — keep just the artist part.
    var artist = clean(bylineEl && bylineEl.textContent).split("•")[0].trim();
    return {
      title: clean(titleEl && titleEl.textContent),
      artist: artist,
      art: artEl ? artEl.src : "",
      currentTime: v ? v.currentTime : 0,
      duration: v && isFinite(v.duration) ? v.duration : 0,
      paused: v ? v.paused : true,
      volume: v ? v.volume : 1,
    };
  }
  function getTrack() { return lastTrack || readTrack(); }
  function sendTrack() { lastTrack = readTrack(); emit("track", lastTrack); }

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
    control: control,
    storage: storage,
    toast: toast,
    FFT_SIZE: FFT_SIZE,
  };
})();
