/* NeoAmp offscreen audio engine.
 *
 * Runs in a hidden, same-origin extension document (created by sw.js). This is the
 * ONE place the EQ can actually shape what you hear: it consumes a tabCapture
 * streamId, builds the WebAudio graph, and plays the processed copy to destination.
 * Connecting to destination here is also what keeps the tab audible — tabCapture
 * mutes the tab, and replaying through this (separate) context un-mutes it.
 *
 *   src → preamp → [10 peaking biquads] → balance → master → destination   (audible, EQ'd)
 *
 * EQ state is FLAT by default (transparent). It's updated live by "setEq" messages
 * (from the right-click presets / the EQ window) and persisted in chrome.storage so
 * it survives restarts; the graph re-applies it whenever capture (re)starts.
 */
(function () {
  "use strict";

  var FREQS = [60, 170, 310, 600, 1000, 3000, 6000, 12000, 14000, 16000];
  var Q = 1.0;

  var ctx = null, stream = null, src = null;
  var preampNode = null, filters = [], balanceNode = null, masterNode = null;
  var analyser = null, pumpTimer = 0, packed = null;
  // live EQ state — flat = transparent
  var bands = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], preamp = 0, balance = 0, enabled = true, volume = 1;

  function dbToGain(db) { return Math.pow(10, db / 20); }
  function clamp(x, lo, hi) { return Math.max(lo, Math.min(hi, x)); }

  function reportError(e) {
    try { chrome.runtime.sendMessage({ target: "sw", type: "error", error: String(e && e.stack || e) }); } catch (_) {}
    console.error("[NeoAmp offscreen]", e);
  }

  // restore saved EQ on load (the SW may start capture before the UI ever opens)
  try {
    chrome.storage.local.get(["neoampEq", "neoampVolume"], function (r) {
      var e = r && r.neoampEq;
      if (e && e.bands && e.bands.length === 10) {
        bands = e.bands.map(Number);
        preamp = +e.preamp || 0;
        balance = clamp(+e.balance || 0, -1, 1);
        enabled = e.enabled !== false;
        applyEq();
      }
      if (r && typeof r.neoampVolume === "number") { volume = clamp(r.neoampVolume, 0, 1); applyVolume(); }
    });
  } catch (_) {}

  // push state onto the live nodes (bands + preamp obey the on/off flag; balance is
  // independent). No-op until the graph exists.
  function applyEq() {
    for (var i = 0; i < filters.length; i++) filters[i].gain.value = enabled ? bands[i] : 0;
    if (preampNode) preampNode.gain.value = dbToGain(enabled ? preamp : 0);
    if (balanceNode) balanceNode.pan.value = clamp(balance, -1, 1);
  }
  // master output gain = the player's volume (independent of EQ); provider-agnostic since
  // it shapes our replayed copy, not the tab's own (often uncontrollable) media element.
  function applyVolume() { if (masterNode) masterNode.gain.value = clamp(volume, 0, 1); }

  chrome.runtime.onMessage.addListener(function (msg) {
    if (!msg || msg.target !== "offscreen") return;
    if (msg.type === "start") start(msg.streamId);
    else if (msg.type === "stop") stop();
    else if (msg.type === "setEq") {
      if (msg.bands && msg.bands.length === 10) bands = msg.bands.map(Number);
      if (typeof msg.preamp === "number") preamp = msg.preamp;
      if (typeof msg.balance === "number") balance = clamp(msg.balance, -1, 1);
      if (typeof msg.enabled === "boolean") enabled = msg.enabled;
      applyEq();
    }
    else if (msg.type === "setVolume") {
      if (typeof msg.volume === "number") { volume = clamp(msg.volume, 0, 1); applyVolume(); }
    }
  });

  async function start(streamId) {
    try {
      stop(); // tear down any prior capture
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { mandatory: { chromeMediaSource: "tab", chromeMediaSourceId: streamId } },
        video: false,
      });
      ctx = new AudioContext();
      if (ctx.state === "suspended") { try { await ctx.resume(); } catch (_) {} }
      src = ctx.createMediaStreamSource(stream);

      preampNode = ctx.createGain();
      src.connect(preampNode);
      var node = preampNode;
      filters = FREQS.map(function (f) {
        var bq = ctx.createBiquadFilter();
        bq.type = "peaking"; bq.frequency.value = f; bq.Q.value = Q;
        node.connect(bq); node = bq;
        return bq;
      });

      // analysis tap (post-EQ, pre-balance) → streamed back for the visualizer + spectrum
      analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;            // matches content's FFT_SIZE
      analyser.smoothingTimeConstant = 0; // raw time-domain for Butterchurn
      node.connect(analyser);

      masterNode = ctx.createGain();
      masterNode.gain.value = clamp(volume, 0, 1);   // restore the player's volume
      balanceNode = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      if (balanceNode) { node.connect(balanceNode); balanceNode.connect(masterNode); }
      else { node.connect(masterNode); }
      masterNode.connect(ctx.destination); // audible — keeps the (muted) tab playing, EQ'd

      applyEq(); // apply current bands/preamp/balance to the fresh graph
      startPump();
      // hand the UI the real output sample rate (drives its kHz readout). kbps isn't
      // knowable here — YTM doesn't expose the stream bitrate — so the UI dashes it.
      try { chrome.runtime.sendMessage({ target: "sw", type: "audioInfo", sampleRate: ctx.sampleRate }).catch(function () {}); } catch (_) {}
      console.log("[NeoAmp offscreen] capturing + playing EQ'd audio; ctx", ctx.state);
    } catch (e) { reportError(e); }
  }

  // base64-pack [time(fftSize) | freq(fftSize/2)] each frame and ship to the SW, which
  // relays to the content script (runtime messaging is JSON, so we can't send the raw
  // typed arrays). One ~2 KB string/frame — cheap to (de)serialize.
  function bytesToB64(bytes) {
    var parts = [], CHUNK = 0x8000;
    for (var i = 0; i < bytes.length; i += CHUNK) parts.push(String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK)));
    return btoa(parts.join(""));
  }
  function startPump() {
    var nT = analyser.fftSize, nF = analyser.frequencyBinCount;
    packed = new Uint8Array(nT + nF);
    // requestAnimationFrame does NOT fire in a hidden offscreen document (it never
    // paints), so drive the FFT read off a timer instead (~50 fps).
    if (pumpTimer) clearInterval(pumpTimer);
    pumpTimer = setInterval(function () {
      if (!analyser) return;
      analyser.getByteTimeDomainData(packed.subarray(0, nT));
      analyser.getByteFrequencyData(packed.subarray(nT));
      try { chrome.runtime.sendMessage({ target: "sw", type: "fft", b64: bytesToB64(packed) }).catch(function () {}); } catch (_) {}
    }, 20);
  }

  function stop() {
    if (pumpTimer) { clearInterval(pumpTimer); pumpTimer = 0; }
    try { if (stream) stream.getTracks().forEach(function (t) { t.stop(); }); } catch (_) {}
    try { if (ctx) ctx.close(); } catch (_) {}
    ctx = stream = src = preampNode = balanceNode = masterNode = analyser = null; filters = [];
  }
})();
