/* NeoAmp MediaSession bridge — runs in the PAGE's main world (manifest world:"MAIN").
 *
 * Why a separate main-world script: content scripts run in an isolated JS world with
 * their OWN navigator.mediaSession, so they can't see the metadata the page set on the
 * real one. This script lives in the page world, reads navigator.mediaSession, and
 * relays it to the isolated content script via window.postMessage.
 *
 * Why MediaSession at all: every major web player (YouTube Music, Spotify, Apple Music,
 * SoundCloud…) populates navigator.mediaSession.metadata for the OS/lock-screen media
 * controls. It's a web standard the site maintains on purpose — far more stable than
 * internal CSS classes, and identical across providers. So it's both our anti-fragility
 * source and the thing that makes a single metadata reader work on every provider.
 *
 * MediaSession has no "metadata changed" event, so we poll (cheap) and only post on
 * change. Position isn't exposed to readers (setPositionState is write-only), so the
 * content script still reads currentTime/duration from the media element.
 */
(function () {
  "use strict";

  // Pick the largest artwork by declared pixel area (falls back to the first entry).
  function bestArt(artwork) {
    if (!artwork || !artwork.length) return "";
    var best = artwork[0], bestArea = -1;
    for (var i = 0; i < artwork.length; i++) {
      var a = artwork[i], wh = String(a.sizes || "").split("x");
      var area = (parseInt(wh[0], 10) || 0) * (parseInt(wh[1], 10) || 0);
      if (area >= bestArea) { bestArea = area; best = a; }
    }
    return (best && best.src) || "";
  }

  function snapshot() {
    var ms = navigator.mediaSession, m = ms && ms.metadata;
    return {
      title: m ? (m.title || "") : "",
      artist: m ? (m.artist || "") : "",
      album: m ? (m.album || "") : "",
      art: m ? bestArt(m.artwork) : "",
      playbackState: ms ? (ms.playbackState || "none") : "none",
    };
  }

  var last = "";
  function tick() {
    try {
      var s = snapshot();
      var key = [s.title, s.artist, s.album, s.art, s.playbackState].join("");
      if (key === last) return;
      last = key;
      // same-window relay to the isolated content script; the marker namespaces it and
      // the listener verifies event.source === window. (Now-playing isn't sensitive.)
      window.postMessage({ __neoamp_ms: 1, data: s }, "*");
    } catch (_) {}
  }

  setInterval(tick, 500);
  tick();
})();
