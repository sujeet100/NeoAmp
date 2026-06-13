/* YT Music — WMP / Winamp Visualizer  (content script)
 *
 * Runs on music.youtube.com. Injects a launcher button; on click it captures
 * the tab's audio (getDisplayMedia), runs an AnalyserNode, and pipes the raw
 * time-domain bytes into a fullscreen *sandboxed* extension iframe that hosts
 * Butterchurn (MilkDrop). The sandbox is required because Butterchurn compiles
 * preset equations with `new Function`, which YouTube Music's CSP forbids in a
 * content script — only a sandboxed extension page may use unsafe-eval in MV3.
 */
(function () {
  "use strict";
  if (window.__ytmWmpVizLoaded) return;
  window.__ytmWmpVizLoaded = true;

  const FFT_SIZE = 1024; // must equal Butterchurn's fftSize (2 * numSamps=512)

  let audioCtx = null, analyser = null, stream = null;
  let iframe = null, rafId = 0, timeBytes = null, running = false;
  let trackTimer = 0;

  function launcher() {
    if (document.getElementById("ytm-wmp-launch")) return;
    const b = document.createElement("button");
    b.id = "ytm-wmp-launch";
    b.textContent = "◢◤ Visualizer";
    b.title = "Start WMP-style visualizer (Shift+V)";
    b.addEventListener("click", start);
    document.documentElement.appendChild(b);
  }

  async function start() {
    if (running) return;
    let s;
    try {
      s = await navigator.mediaDevices.getDisplayMedia({
        video: true, // required by the API even though we only keep audio
        audio: { suppressLocalAudioPlayback: false },
        preferCurrentTab: true,
        selfBrowserSurface: "include",
      });
    } catch (e) {
      toast("Capture cancelled");
      return;
    }
    s.getVideoTracks().forEach((t) => t.stop());
    const at = s.getAudioTracks();
    if (!at.length) {
      toast("No tab audio — re-share and tick “Share tab audio”");
      s.getTracks().forEach((t) => t.stop());
      return;
    }
    stream = s;
    at[0].addEventListener("ended", stop); // user clicked "Stop sharing"

    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") { try { await audioCtx.resume(); } catch (_) {} }
    const src = audioCtx.createMediaStreamSource(new MediaStream(at));
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = FFT_SIZE;
    analyser.smoothingTimeConstant = 0;
    // Boost the *analysis* signal so visuals react harder (tab audio is often
    // quiet). This is on the analysis branch only — it does not change what you
    // hear, since getDisplayMedia keeps the tab audible on its own.
    const boost = audioCtx.createGain();
    boost.gain.value = 1.8;
    // Pull the graph to the destination through a muted gain so the analyser
    // actually receives samples.
    const sink = audioCtx.createGain();
    sink.gain.value = 0;
    src.connect(boost);
    boost.connect(analyser);
    analyser.connect(sink);
    sink.connect(audioCtx.destination);
    timeBytes = new Uint8Array(analyser.fftSize);

    iframe = document.createElement("iframe");
    iframe.id = "ytm-wmp-frame";
    iframe.src = chrome.runtime.getURL("viz.html");
    // Belt-and-suspenders against a focus ring on the iframe (the "yellow
    // border") — set inline too so it applies without an overlay.css reload.
    iframe.style.outline = "none";
    iframe.style.border = "0";
    iframe.setAttribute("frameborder", "0");
    document.documentElement.appendChild(iframe);

    window.addEventListener("message", onMsg);
    running = true;
    pump();
    // Now-playing metadata + playback position update on a slow timer (the audio
    // pump runs every frame; track info only needs ~2 Hz). Drives the title and
    // seek bar in the iframe.
    trackTimer = setInterval(sendTrack, 500);

    const l = document.getElementById("ytm-wmp-launch");
    if (l) l.style.display = "none";
  }

  function pump() {
    rafId = requestAnimationFrame(pump);
    if (!analyser || !iframe || !iframe.contentWindow) return;
    analyser.getByteTimeDomainData(timeBytes);
    // Structured clone copies the bytes each frame; reusing one array is fine.
    iframe.contentWindow.postMessage({ __wmp: true, type: "audio", data: timeBytes }, "*");
  }

  // Read now-playing title/artist + playback position straight from the page.
  // The <video> element is the source of truth for time/duration/seek (YouTube
  // Music plays audio through it); the player bar carries the human-readable
  // title and byline.
  function readTrack() {
    const v = document.querySelector("video");
    const titleEl = document.querySelector("ytmusic-player-bar .title");
    const bylineEl = document.querySelector("ytmusic-player-bar .byline");
    const artEl = document.querySelector("ytmusic-player-bar img.image") ||
      document.querySelector("ytmusic-player-bar img");
    const clean = (s) => (s || "").replace(/\s+/g, " ").trim();
    // The byline is "Artist • Album • Year • plays" — keep just the artist part.
    const artist = clean(bylineEl && bylineEl.textContent).split("•")[0].trim();
    return {
      title: clean(titleEl && titleEl.textContent),
      artist: artist,
      art: artEl ? artEl.src : "",
      currentTime: v ? v.currentTime : 0,
      duration: v && isFinite(v.duration) ? v.duration : 0,
      paused: v ? v.paused : true,
    };
  }

  function sendTrack() {
    if (!iframe || !iframe.contentWindow) return;
    iframe.contentWindow.postMessage(Object.assign({ __wmp: true, type: "track" }, readTrack()), "*");
  }

  // Favorites persist via chrome.storage (the sandboxed iframe is an opaque
  // origin and cannot use storage itself, so it round-trips through here).
  function loadFavs(cb) {
    try { chrome.storage.local.get("neoampFavorites", (r) => cb((r && r.neoampFavorites) || [])); }
    catch (_) { cb([]); }
  }
  function saveFavs(names) {
    try { chrome.storage.local.set({ neoampFavorites: Array.isArray(names) ? names : [] }); } catch (_) {}
  }

  function onMsg(e) {
    if (!iframe || e.source !== iframe.contentWindow) return;
    const m = e.data || {};
    if (!m.__wmp) return;
    if (m.type === "close") stop();
    else if (m.type === "error") { toast("Visualizer: " + m.message); console.error("[WMP-viz iframe]", m.message); }
    else if (m.type === "ready") {
      console.log("[WMP-viz] iframe ready; presets:", m.presets);
      loadFavs((names) =>
        iframe && iframe.contentWindow &&
        iframe.contentWindow.postMessage({ __wmp: true, type: "favorites:init", names: names }, "*"));
      sendTrack();
    } else if (m.type === "seek") {
      const v = document.querySelector("video");
      if (v && isFinite(m.time)) v.currentTime = m.time;
    } else if (m.type === "playpause") {
      const v = document.querySelector("video");
      if (v) { if (v.paused) v.play(); else v.pause(); sendTrack(); }
    } else if (m.type === "favorites:set") {
      saveFavs(m.names);
    }
  }

  function stop() {
    running = false;
    cancelAnimationFrame(rafId);
    clearInterval(trackTimer); trackTimer = 0;
    window.removeEventListener("message", onMsg);
    if (stream) stream.getTracks().forEach((t) => t.stop());
    if (audioCtx) { try { audioCtx.close(); } catch (_) {} }
    if (iframe && iframe.parentNode) iframe.parentNode.removeChild(iframe);
    audioCtx = analyser = stream = iframe = timeBytes = null;
    const l = document.getElementById("ytm-wmp-launch");
    if (l) l.style.display = "";
  }

  function toast(msg) {
    const t = document.createElement("div");
    t.className = "ytm-wmp-toast";
    t.textContent = msg;
    document.documentElement.appendChild(t);
    setTimeout(() => t.parentNode && t.parentNode.removeChild(t), 4500);
  }

  window.addEventListener(
    "keydown",
    (e) => {
      if (e.target && /^(INPUT|TEXTAREA)$/.test(e.target.tagName)) return;
      if (e.shiftKey && (e.key === "V" || e.key === "v")) { e.preventDefault(); running ? stop() : start(); }
    },
    true
  );

  launcher();
  const mo = new MutationObserver(() => {
    if (!document.getElementById("ytm-wmp-launch") && !running) launcher();
  });
  mo.observe(document.documentElement, { childList: true, subtree: false });
})();
