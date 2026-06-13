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
    document.documentElement.appendChild(iframe);

    window.addEventListener("message", onMsg);
    running = true;
    pump();

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

  function onMsg(e) {
    if (!iframe || e.source !== iframe.contentWindow) return;
    const m = e.data || {};
    if (!m.__wmp) return;
    if (m.type === "close") stop();
    else if (m.type === "error") { toast("Visualizer: " + m.message); console.error("[WMP-viz iframe]", m.message); }
    else if (m.type === "ready") console.log("[WMP-viz] iframe ready; presets:", m.presets);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(rafId);
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
