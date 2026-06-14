/* NeoAmp — real Winamp 2 skin (.wsz) engine.
 *
 * Renders authentic classic-Winamp skins by blitting their bitmap sprites to a
 * <canvas>, instead of faking the look with CSS (that's winamp.css / the
 * "procedural" UI). A .wsz is just a ZIP of .bmp sprite sheets + a few .txt
 * config files; we unzip it in-browser, decode each BMP, and draw the named
 * sprites at the documented main-window coordinates.
 *
 * Why this can run in the content script (unlike Butterchurn): it's pure canvas
 * blitting — no new Function / eval — so YTM's CSP doesn't block it and we keep
 * direct access to the NeoAmp backend (window.NeoAmp).
 *
 * Sprite rectangles and on-window element positions are lifted verbatim from
 * Webamp's open source (skinSprites.ts + css/main-window.css) — the authoritative
 * record of the 1997 skin format — so coordinates are exact, not reverse-guessed.
 *
 * Public surface (window.NeoAmpClassic):
 *   loadSkin(url) -> Promise<Skin>          // unzip + decode a .wsz
 *   mountMain(hostEl, skin, hooks) -> Main   // draw + wire the main window
 *
 * Exposes only the Main window for now; EQ + Playlist windows are follow-ups.
 */
(function () {
  "use strict";

  // =========================================================================
  // ZIP reader (.wsz is a plain ZIP). Raw DEFLATE via the built-in
  // DecompressionStream — no third-party inflate needed.
  // =========================================================================
  function inflateRaw(bytes) {
    var ds = new DecompressionStream("deflate-raw");
    var stream = new Blob([bytes]).stream().pipeThrough(ds);
    return new Response(stream).arrayBuffer().then(function (ab) { return new Uint8Array(ab); });
  }

  // Parse the central directory, then each local header, returning
  // { BASENAME_UPPERCASED: Uint8Array }. Names are upper-cased + path-stripped
  // because skins vary in case and some wrap files in a subfolder.
  function unzip(arrayBuffer) {
    var dv = new DataView(arrayBuffer);
    var u8 = new Uint8Array(arrayBuffer);
    // End Of Central Directory record: scan backwards for its signature.
    var eocd = -1;
    for (var i = u8.length - 22; i >= 0 && i >= u8.length - 22 - 65536; i--) {
      if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    }
    if (eocd < 0) return Promise.reject(new Error("not a zip (no EOCD)"));
    var cdOffset = dv.getUint32(eocd + 16, true);
    var cdCount = dv.getUint16(eocd + 10, true);

    var entries = [];
    var p = cdOffset;
    for (var n = 0; n < cdCount; n++) {
      if (dv.getUint32(p, true) !== 0x02014b50) break;       // central dir header
      var method = dv.getUint16(p + 10, true);
      var compSize = dv.getUint32(p + 20, true);
      var nameLen = dv.getUint16(p + 28, true);
      var extraLen = dv.getUint16(p + 30, true);
      var commentLen = dv.getUint16(p + 32, true);
      var localOff = dv.getUint32(p + 42, true);
      var name = new TextDecoder().decode(u8.subarray(p + 46, p + 46 + nameLen));
      // local file header: recompute data start (its name/extra lengths can differ)
      var lhNameLen = dv.getUint16(localOff + 26, true);
      var lhExtraLen = dv.getUint16(localOff + 28, true);
      var dataStart = localOff + 30 + lhNameLen + lhExtraLen;
      entries.push({
        key: name.split("/").pop().toUpperCase(),
        method: method,
        data: u8.subarray(dataStart, dataStart + compSize),
      });
      p += 46 + nameLen + extraLen + commentLen;
    }

    var out = {};
    return Promise.all(entries.map(function (e) {
      if (!e.key) return Promise.resolve();
      var inflated = e.method === 0 ? Promise.resolve(e.data.slice()) : inflateRaw(e.data);
      return inflated.then(function (bytes) { out[e.key] = bytes; });
    })).then(function () { return out; });
  }

  // Browsers decode BMP natively via createImageBitmap, so no hand-rolled BMP
  // parser. Returns an ImageBitmap we can drawImage() sprite rects out of.
  function decodeBmp(bytes) {
    return createImageBitmap(new Blob([bytes], { type: "image/bmp" }));
  }

  // Crop a sprite rect out of a decoded sheet into a standalone PNG data URL —
  // used to feed GEN.BMP window-frame pieces to CSS as background-image layers
  // (so the browser handles the resizable tiling of the borders).
  function spriteDataURL(bitmap, rect) {
    if (!bitmap) return "";
    var c = document.createElement("canvas");
    c.width = rect[2]; c.height = rect[3];
    var x = c.getContext("2d");
    x.imageSmoothingEnabled = false;
    x.drawImage(bitmap, rect[0], rect[1], rect[2], rect[3], 0, 0, rect[2], rect[3]);
    return c.toDataURL();
  }

  // =========================================================================
  // Sprite rectangles within each sheet (from Webamp skinSprites.ts). Only the
  // sheets the main window needs are listed.
  // =========================================================================
  // Bitmap font: TEXT.BMP is a grid of 5x6 glyphs, 3 rows. Map char -> [row,col].
  var FONT = {
    a:[0,0],b:[0,1],c:[0,2],d:[0,3],e:[0,4],f:[0,5],g:[0,6],h:[0,7],i:[0,8],j:[0,9],
    k:[0,10],l:[0,11],m:[0,12],n:[0,13],o:[0,14],p:[0,15],q:[0,16],r:[0,17],s:[0,18],
    t:[0,19],u:[0,20],v:[0,21],w:[0,22],x:[0,23],y:[0,24],z:[0,25],'"':[0,26],"@":[0,27]," ":[0,30],
    "0":[1,0],"1":[1,1],"2":[1,2],"3":[1,3],"4":[1,4],"5":[1,5],"6":[1,6],"7":[1,7],"8":[1,8],"9":[1,9],
    "…":[1,10],".":[1,11],":":[1,12],"(":[1,13],")":[1,14],"-":[1,15],"'":[1,16],"!":[1,17],
    _:[1,18],"+":[1,19],"\\":[1,20],"/":[1,21],"[":[1,22],"]":[1,23],"^":[1,24],"&":[1,25],
    "%":[1,26],",":[1,27],"=":[1,28],$:[1,29],"#":[1,30],
    "?":[2,3],"*":[2,4],"<":[1,22],">":[1,23],"{":[1,22],"}":[1,23],
  };
  var CHAR_W = 5, CHAR_H = 6;

  // Sheet (uppercased basename without .bmp) -> sprite-name -> [x,y,w,h].
  var SP = {
    CBUTTONS: {
      PREV:[0,0,23,18], PREV_A:[0,18,23,18],
      PLAY:[23,0,23,18], PLAY_A:[23,18,23,18],
      PAUSE:[46,0,23,18], PAUSE_A:[46,18,23,18],
      STOP:[69,0,23,18], STOP_A:[69,18,23,18],
      NEXT:[92,0,23,18], NEXT_A:[92,18,22,18],
      EJECT:[114,0,22,16], EJECT_A:[114,16,22,16],
    },
    TITLEBAR: {
      BAR:[27,15,275,14], BAR_SEL:[27,0,275,14],          // inactive / active
      OPTIONS:[0,0,9,9], OPTIONS_A:[0,9,9,9],
      MINIMIZE:[9,0,9,9], MINIMIZE_A:[9,9,9,9],
      SHADE:[0,18,9,9], SHADE_A:[9,18,9,9],
      CLOSE:[18,0,9,9], CLOSE_A:[18,9,9,9],
    },
    SHUFREP: {
      SHUFFLE:[28,0,47,15], SHUFFLE_D:[28,15,47,15], SHUFFLE_SEL:[28,30,47,15], SHUFFLE_SEL_D:[28,45,47,15],
      REPEAT:[0,0,28,15], REPEAT_D:[0,15,28,15], REPEAT_SEL:[0,30,28,15], REPEAT_SEL_D:[0,45,28,15],
      EQ:[0,61,23,12], EQ_SEL:[0,73,23,12], EQ_D:[46,61,23,12], EQ_D_SEL:[46,73,23,12],
      PL:[23,61,23,12], PL_SEL:[23,73,23,12], PL_D:[69,61,23,12], PL_D_SEL:[69,73,23,12],
    },
    MONOSTER: {
      STEREO:[0,12,29,12], STEREO_SEL:[0,0,29,12],
      MONO:[29,12,27,12], MONO_SEL:[29,0,27,12],
    },
    POSBAR: {
      BG:[0,0,248,10], THUMB:[248,0,29,10], THUMB_A:[278,0,29,10],
    },
    PLAYPAUS: {
      PLAYING:[0,0,9,9], PAUSED:[9,0,9,9], STOPPED:[18,0,9,9],
      NOT_WORKING:[36,0,9,9], WORKING:[39,0,9,9],
    },
    VOLUME: { THUMB:[15,422,14,11], THUMB_A:[0,422,14,11] },   // 28 bg frames: 68x15 each, y=i*15
    BALANCE: { BG_X:9, THUMB:[15,422,14,11], THUMB_A:[0,422,14,11] }, // bg 38x15 frames at x=9, y=i*15
    EQMAIN: {
      BG:[0,0,275,116], TITLE:[0,149,275,14], TITLE_SEL:[0,134,275,14],
      THUMB:[0,164,11,11], THUMB_A:[0,176,11,11],
      CLOSE:[0,116,9,9], CLOSE_A:[0,125,9,9],
      ON:[10,119,26,12], ON_D:[128,119,26,12], ON_SEL:[69,119,26,12], ON_SEL_D:[187,119,26,12],
      AUTO:[36,119,32,12], AUTO_D:[154,119,32,12], AUTO_SEL:[95,119,32,12], AUTO_SEL_D:[213,119,32,12],
      GRAPH_BG:[0,294,113,19], PRESETS:[224,164,44,12], PRESETS_A:[224,176,44,12],
    },
  };

  // EQ window element positions (from equalizer-window.css)
  var EQ_LAYOUT = {
    titlebar: { x: 0, y: 0, w: 275, h: 14 },
    close: { x: 264, y: 3, w: 9, h: 9 },
    shade: { x: 254, y: 3, w: 9, h: 9 },
    on:    { x: 14, y: 18, w: 26, h: 12 },
    auto:  { x: 40, y: 18, w: 32, h: 12 },
    presets: { x: 217, y: 18, w: 44, h: 12 },
    graph: { x: 86, y: 17, w: 113, h: 19 },
    preamp: { x: 21, y: 38 },
    bandX: [78, 96, 114, 132, 150, 168, 186, 204, 222, 240], bandY: 38,
    thumbTop: 38, thumbRange: 51,    // thumb top: 38 (+12dB) .. 89 (-12dB)
  };

  // Where each element sits on the 275x116 main window (from main-window.css).
  var LAYOUT = {
    titlebar: { x: 0, y: 0, w: 275, h: 14 },
    close:    { x: 264, y: 3, w: 9, h: 9 },
    shade:    { x: 254, y: 3, w: 9, h: 9 },
    minimize: { x: 244, y: 3, w: 9, h: 9 },
    options:  { x: 6, y: 3, w: 9, h: 9 },
    playIndicator: { x: 26, y: 28, w: 9, h: 9 },
    timeX: 48, timeY: 26,                 // four digits at 48,60,(colon)78,90
    visualizer: { x: 24, y: 43, w: 76, h: 16 },
    marquee:  { x: 111, y: 24, w: 154, h: 6 },
    kbps:     { x: 111, y: 43 },
    khz:      { x: 156, y: 43 },
    monoster: { x: 212, y: 41 },          // mono at +0 (27w), stereo at +27 (29w)
    volume:   { x: 107, y: 57, w: 68, h: 13 },
    balance:  { x: 177, y: 57, w: 38, h: 13 },
    eqBtn:    { x: 219, y: 58, w: 23, h: 12 },
    plBtn:    { x: 242, y: 58, w: 23, h: 12 },
    position: { x: 16, y: 72, w: 248, h: 10 },
    prev:     { x: 16, y: 88, w: 23, h: 18 },
    play:     { x: 39, y: 88, w: 23, h: 18 },
    pause:    { x: 62, y: 88, w: 23, h: 18 },
    stop:     { x: 85, y: 88, w: 23, h: 18 },
    next:     { x: 108, y: 88, w: 22, h: 18 },
    eject:    { x: 136, y: 89, w: 22, h: 16 },
    shuffle:  { x: 164, y: 89, w: 47, h: 15 },
    repeat:   { x: 210, y: 89, w: 28, h: 15 },
  };

  var MAIN_W = 275, MAIN_H = 116;

  // =========================================================================
  // Skin: decoded sheets + a blit() that draws a named sprite.
  // =========================================================================
  function decodeSkin(files) {
    // Decode whichever sheets are present (skins may omit some).
    var wanted = ["MAIN", "TITLEBAR", "CBUTTONS", "NUMBERS", "NUMS_EX",
      "TEXT", "POSBAR", "VOLUME", "BALANCE", "MONOSTER", "SHUFREP", "PLAYPAUS",
      "EQMAIN", "EQ_EX", "GEN"];
    var sheets = {};
    var jobs = wanted.map(function (name) {
      var bytes = files[name + ".BMP"];
      if (!bytes) return Promise.resolve();
      return decodeBmp(bytes).then(function (bmp) { sheets[name] = bmp; })
        .catch(function () { /* a missing/corrupt sheet just won't draw */ });
    });
    return Promise.all(jobs).then(function () { return { sheets: sheets, files: files }; });
  }
  // Load from raw .wsz bytes (drag-drop / file picker) — no fetch, no CORS.
  function loadSkinFromArrayBuffer(buf) { return unzip(buf).then(decodeSkin); }
  function loadSkin(url) {
    return fetch(url).then(function (r) { return r.arrayBuffer(); }).then(loadSkinFromArrayBuffer);
  }

  // =========================================================================
  // Main window renderer + interaction wiring.
  // =========================================================================
  function mountMain(hostEl, skin, hooks) {
    hooks = hooks || {};
    var scale = hooks.scale || 2;

    var canvas = document.createElement("canvas");
    canvas.width = MAIN_W; canvas.height = MAIN_H;
    canvas.style.width = (MAIN_W * scale) + "px";
    canvas.style.height = (MAIN_H * scale) + "px";
    canvas.style.display = "block";
    canvas.style.imageRendering = "pixelated";
    hostEl.appendChild(canvas);
    var ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;

    // current display state, mutated by update()
    var st = {
      elapsed: 0, duration: 0, title: "NeoAmp", kbps: "", khz: "", stereo: true,
      playing: false, paused: false, shuffle: false, repeat: false, volume: 1, balance: 0,
      pressed: null, eqOn: false, plOn: false, freq: null, marqueeX: 0,
    };

    function sheet(name) { return skin.sheets[name]; }

    // draw a named sprite SP[sheet][key] to (dx,dy)
    function blit(sheetName, key, dx, dy) {
      var img = sheet(sheetName); if (!img) return;
      var s = SP[sheetName][key]; if (!s) return;
      ctx.drawImage(img, s[0], s[1], s[2], s[3], dx, dy, s[2], s[3]);
    }
    function blitRect(sheetName, sx, sy, sw, sh, dx, dy) {
      var img = sheet(sheetName); if (!img) return;
      ctx.drawImage(img, sx, sy, sw, sh, dx, dy, sw, sh);
    }

    // bitmap-font text (clipped to width), lowercased to match FONT map
    function drawText(text, x, y, maxW) {
      var img = sheet("TEXT"); if (!img) return;
      var s = String(text == null ? "" : text).toLowerCase();
      for (var i = 0, dx = x; i < s.length; i++, dx += CHAR_W) {
        if (dx + CHAR_W > x + maxW) break;
        var pos = FONT[s[i]] || FONT[" "];
        ctx.drawImage(img, pos[1] * CHAR_W, pos[0] * CHAR_H, CHAR_W, CHAR_H, dx, y, CHAR_W, CHAR_H);
      }
    }
    // draw every glyph from startX (no per-char clip); caller clips the region
    function drawGlyphs(text, startX, y) {
      var img = sheet("TEXT"); if (!img) return;
      var s = String(text == null ? "" : text).toLowerCase();
      for (var i = 0, dx = startX; i < s.length; i++, dx += CHAR_W) {
        var pos = FONT[s[i]] || FONT[" "];
        ctx.drawImage(img, pos[1] * CHAR_W, pos[0] * CHAR_H, CHAR_W, CHAR_H, dx, y, CHAR_W, CHAR_H);
      }
    }
    // scrolling title marquee (Winamp scrolls only when the text overflows)
    var MARQUEE_SEP = "  ***  ";
    function drawMarquee() {
      var R = LAYOUT.marquee;
      var textW = String(st.title).length * CHAR_W;
      if (textW <= R.w) { drawText(st.title, R.x, R.y, R.w); return; }
      var full = st.title + MARQUEE_SEP;
      var fullW = full.length * CHAR_W;
      var off = ((st.marqueeX % fullW) + fullW) % fullW;
      ctx.save();
      ctx.beginPath(); ctx.rect(R.x, R.y, R.w, R.h); ctx.clip();
      drawGlyphs(full, R.x - off, R.y);
      drawGlyphs(full, R.x - off + fullW, R.y);   // wrap copy for seamless loop
      ctx.restore();
    }
    // brand nameplate over the skin's baked "WINAMP" titlebar text (the text is
    // part of each skin's TITLEBAR.BMP, so we cover it with a small dark plate)
    function drawBrand() {
      var label = "neoamp";                 // lowercased for the FONT map
      var bw = label.length * CHAR_W, pw = bw + 10, ph = 9;
      var px = Math.round((MAIN_W - pw) / 2), py = 3;
      ctx.fillStyle = "rgba(8,8,14,0.92)"; ctx.fillRect(px, py, pw, ph);
      ctx.fillStyle = "rgba(255,255,255,0.14)"; ctx.fillRect(px, py, pw, 1);
      ctx.fillStyle = "rgba(0,0,0,0.55)"; ctx.fillRect(px, py + ph - 1, pw, 1);
      drawText(label, px + 5, py + 2, bw + 2);
    }
    // live spectrum analyzer in the main window's visualizer region
    function drawAnalyzer() {
      if (!st.freq) return;
      var R = LAYOUT.visualizer, n = 19, bw = R.w / n, bins = st.freq.length;
      for (var i = 0; i < n; i++) {
        var f0 = Math.pow(i / n, 1.6), f1 = Math.pow((i + 1) / n, 1.6);
        var a = Math.floor(f0 * bins * 0.5), b = Math.max(a + 1, Math.floor(f1 * bins * 0.5));
        var m = 0; for (var j = a; j < b && j < bins; j++) if (st.freq[j] > m) m = st.freq[j];
        var bh = Math.round((m / 255) * R.h);
        ctx.fillStyle = bh > R.h * 0.8 ? "#ffe000" : "#1fd33a";
        ctx.fillRect(Math.floor(R.x + i * bw), R.y + R.h - bh, Math.max(1, Math.floor(bw) - 1), bh);
      }
    }

    // mm:ss split into the four digit slots (48,60,78,90 @ y=26), 9x13 each
    function drawTime(sec) {
      // some skins ship NUMS_EX instead of NUMBERS (same 9x13 digit grid)
      var num = sheet("NUMBERS") ? "NUMBERS" : (sheet("NUMS_EX") ? "NUMS_EX" : null);
      if (!num || st.stopped) return;
      var t = Math.max(0, Math.floor(sec));
      var mm = Math.floor(t / 60), ss = t % 60;
      var d = [Math.floor(mm / 10), mm % 10, Math.floor(ss / 10), ss % 10];
      var xs = [LAYOUT.timeX, LAYOUT.timeX + 12, LAYOUT.timeX + 30, LAYOUT.timeX + 42];
      for (var i = 0; i < 4; i++) {
        blitRect(num, d[i] * 9, 0, 9, 13, xs[i], LAYOUT.timeY);
      }
    }

    // VOLUME/BALANCE backgrounds are 28 stacked frames (height 15); pick by level
    function drawVolume() {
      var img = sheet("VOLUME"); if (!img) return;
      var idx = Math.round(st.volume * 27);
      blitRect("VOLUME", 0, idx * 15, LAYOUT.volume.w, 13, LAYOUT.volume.x, LAYOUT.volume.y);
      var tx = LAYOUT.volume.x + Math.round(st.volume * (LAYOUT.volume.w - 14));
      blit("VOLUME", st.pressed === "volume" ? "THUMB_A" : "THUMB", tx, LAYOUT.volume.y + 1);
    }
    function drawBalance() {
      var img = sheet("BALANCE"); if (!img) return;
      var idx = Math.round(Math.abs(st.balance) * 27);
      blitRect("BALANCE", SP.BALANCE.BG_X, idx * 15, LAYOUT.balance.w, 13, LAYOUT.balance.x, LAYOUT.balance.y);
      var tx = LAYOUT.balance.x + Math.round(((st.balance + 1) / 2) * (LAYOUT.balance.w - 14));
      blit("BALANCE", st.pressed === "balance" ? "THUMB_A" : "THUMB", tx, LAYOUT.balance.y + 1);
    }

    function drawPosition() {
      if (!sheet("POSBAR")) return;
      blit("POSBAR", "BG", LAYOUT.position.x, LAYOUT.position.y);
      if (st.duration > 0 && !st.stopped) {
        var frac = Math.max(0, Math.min(1, st.elapsed / st.duration));
        var tx = LAYOUT.position.x + Math.round(frac * (LAYOUT.position.w - 29));
        blit("POSBAR", st.pressed === "position" ? "THUMB_A" : "THUMB", tx, LAYOUT.position.y);
      }
    }

    function render() {
      ctx.clearRect(0, 0, MAIN_W, MAIN_H);
      if (sheet("MAIN")) ctx.drawImage(sheet("MAIN"), 0, 0);   // 275x116 background
      // titlebar (active look — we treat the window as focused)
      blit("TITLEBAR", "BAR_SEL", 0, 0);
      drawBrand();      // overlay our brand over the skin's baked "WINAMP" text
      drawAnalyzer();
      // play/pause/stop indicator
      var indKey = st.stopped ? "STOPPED" : (st.paused ? "PAUSED" : "PLAYING");
      blit("PLAYPAUS", indKey, LAYOUT.playIndicator.x, LAYOUT.playIndicator.y);
      drawTime(st.elapsed);
      drawMarquee();
      drawText(st.kbps, LAYOUT.kbps.x, LAYOUT.kbps.y, 15);
      drawText(st.khz, LAYOUT.khz.x, LAYOUT.khz.y, 15);
      // mono (dim) + stereo (lit when stereo)
      blit("MONOSTER", "MONO", LAYOUT.monoster.x, LAYOUT.monoster.y);
      blit("MONOSTER", st.stereo ? "STEREO_SEL" : "STEREO", LAYOUT.monoster.x + 27, LAYOUT.monoster.y);
      drawVolume();
      drawBalance();
      blit("SHUFREP", st.eqOn ? "EQ_SEL" : "EQ", LAYOUT.eqBtn.x, LAYOUT.eqBtn.y);
      blit("SHUFREP", st.plOn ? "PL_SEL" : "PL", LAYOUT.plBtn.x, LAYOUT.plBtn.y);
      drawPosition();
      // transport (pressed frame while held)
      blit("CBUTTONS", st.pressed === "prev" ? "PREV_A" : "PREV", LAYOUT.prev.x, LAYOUT.prev.y);
      blit("CBUTTONS", st.pressed === "play" ? "PLAY_A" : "PLAY", LAYOUT.play.x, LAYOUT.play.y);
      blit("CBUTTONS", st.pressed === "pause" ? "PAUSE_A" : "PAUSE", LAYOUT.pause.x, LAYOUT.pause.y);
      blit("CBUTTONS", st.pressed === "stop" ? "STOP_A" : "STOP", LAYOUT.stop.x, LAYOUT.stop.y);
      blit("CBUTTONS", st.pressed === "next" ? "NEXT_A" : "NEXT", LAYOUT.next.x, LAYOUT.next.y);
      blit("CBUTTONS", st.pressed === "eject" ? "EJECT_A" : "EJECT", LAYOUT.eject.x, LAYOUT.eject.y);
      blit("SHUFREP", st.shuffle ? "SHUFFLE_SEL" : "SHUFFLE", LAYOUT.shuffle.x, LAYOUT.shuffle.y);
      blit("SHUFREP", st.repeat ? "REPEAT_SEL" : "REPEAT", LAYOUT.repeat.x, LAYOUT.repeat.y);
    }

    var raf = 0;
    function scheduleRender() {
      if (raf) return;
      raf = requestAnimationFrame(function () { raf = 0; render(); });
    }

    // ---- interaction: map canvas px -> skin px, hit-test rects ----
    function hit(e, r) {
      var b = canvas.getBoundingClientRect();
      var x = (e.clientX - b.left) / scale, y = (e.clientY - b.top) / scale;
      return x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
    }
    function localX(e) {
      var b = canvas.getBoundingClientRect();
      return (e.clientX - b.left) / scale;
    }

    var BUTTONS = ["prev", "play", "pause", "stop", "next", "eject"];
    canvas.addEventListener("mousedown", function (e) {
      // transport press feedback
      for (var i = 0; i < BUTTONS.length; i++) {
        if (hit(e, LAYOUT[BUTTONS[i]])) { st.pressed = BUTTONS[i]; scheduleRender(); return; }
      }
      // sliders: seek / volume by click position
      if (hit(e, LAYOUT.position) && st.duration > 0) {
        var f = Math.max(0, Math.min(1, (localX(e) - LAYOUT.position.x) / (LAYOUT.position.w - 29)));
        if (hooks.onSeek) hooks.onSeek(f * st.duration);
      } else if (hit(e, LAYOUT.volume)) {
        var v = Math.max(0, Math.min(1, (localX(e) - LAYOUT.volume.x) / (LAYOUT.volume.w - 14)));
        st.volume = v; if (hooks.onVolume) hooks.onVolume(v); scheduleRender();
      }
    });
    canvas.addEventListener("mouseup", function (e) {
      var was = st.pressed; st.pressed = null; scheduleRender();
      if (!was) {
        // non-transport clicks resolved on mouseup
        if (hit(e, LAYOUT.shuffle)) { st.shuffle = !st.shuffle; hooks.onShuffle && hooks.onShuffle(); scheduleRender(); }
        else if (hit(e, LAYOUT.repeat)) { st.repeat = !st.repeat; hooks.onRepeat && hooks.onRepeat(); scheduleRender(); }
        else if (hit(e, LAYOUT.eqBtn)) { hooks.onToggleEq && hooks.onToggleEq(); }
        else if (hit(e, LAYOUT.plBtn)) { hooks.onTogglePl && hooks.onTogglePl(); }
        else if (hit(e, LAYOUT.visualizer)) { hooks.onToggleViz && hooks.onToggleViz(); }
        else if (hit(e, LAYOUT.close)) { hooks.onClose && hooks.onClose(); }
        return;
      }
      if (hit(e, LAYOUT[was])) {     // released over the same button = activate
        if (was === "prev") hooks.onPrev && hooks.onPrev();
        else if (was === "play") hooks.onPlay && hooks.onPlay();
        else if (was === "pause") hooks.onPause && hooks.onPause();
        else if (was === "stop") hooks.onStop && hooks.onStop();
        else if (was === "next") hooks.onNext && hooks.onNext();
        else if (was === "eject") hooks.onEject && hooks.onEject();
      }
    });
    // release press state if the mouse leaves mid-click
    canvas.addEventListener("mouseleave", function () { if (st.pressed && st.pressed.length) { st.pressed = null; scheduleRender(); } });

    render();

    // marquee ticker: advance the scroll only while the title overflows
    var tick = setInterval(function () {
      if (String(st.title).length * CHAR_W > LAYOUT.marquee.w) { st.marqueeX += 1; scheduleRender(); }
    }, 60);

    return {
      el: canvas,
      // titlebar drag region in *display* px — excludes the right-edge title
      // buttons (minimize/shade/close at x>=244) so they stay clickable
      dragRegion: { x: 0, y: 0, w: 244 * scale, h: LAYOUT.titlebar.h * scale },
      update: function (patch) {
        if (patch.title != null && patch.title !== st.title) st.marqueeX = 0; // restart scroll on new track
        Object.assign(st, patch); scheduleRender();
      },
      setVolume: function (v) { st.volume = v; scheduleRender(); },
      setToggles: function (eqOn, plOn) { st.eqOn = eqOn; st.plOn = plOn; scheduleRender(); },
      pushAudio: function (freq) { st.freq = freq; scheduleRender(); },
      destroy: function () { clearInterval(tick); if (raf) cancelAnimationFrame(raf); canvas.remove(); },
    };
  }

  // =========================================================================
  // EQUALIZER window renderer. Cosmetic (like the procedural EQ): the 10 bands
  // + preamp drag vertically and redraw the curve, but don't filter audio yet.
  // =========================================================================
  function mountEq(hostEl, skin, hooks) {
    hooks = hooks || {};
    var scale = hooks.scale || 2;
    var canvas = document.createElement("canvas");
    canvas.width = MAIN_W; canvas.height = MAIN_H;
    canvas.style.width = (MAIN_W * scale) + "px";
    canvas.style.height = (MAIN_H * scale) + "px";
    canvas.style.display = "block"; canvas.style.imageRendering = "pixelated";
    hostEl.appendChild(canvas);
    var ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;

    var bands = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; // 10 band gains, -12..12
    var preamp = 0;
    var on = true, dragBand = -1;

    function img() { return skin.sheets.EQMAIN; }
    function blit(key, dx, dy) {
      var s = SP.EQMAIN[key]; if (!img() || !s) return;
      ctx.drawImage(img(), s[0], s[1], s[2], s[3], dx, dy, s[2], s[3]);
    }
    function thumbY(v) { return EQ_LAYOUT.thumbTop + ((12 - v) / 24) * EQ_LAYOUT.thumbRange; }
    function valFromY(y) { return Math.max(-12, Math.min(12, 12 - ((y - EQ_LAYOUT.thumbTop) / EQ_LAYOUT.thumbRange) * 24)); }
    // band trough: one of 28 colored slider-track frames (15x65, 14-col grid at
    // 13,164 in EQMAIN), chosen by the band value — this is the vertical bar.
    function trough(x, v) {
      if (!img()) return;
      var pct = (v + 12) / 24, num = Math.round(pct * 27);
      var sx = num % 14, sy = Math.floor(num / 14);
      ctx.drawImage(img(), 13 + sx * 15, 164 + sy * 65, 15, 63, x, EQ_LAYOUT.bandY, 15, 63);
    }

    function drawCurve() {
      var g = EQ_LAYOUT.graph;
      ctx.save();
      ctx.beginPath(); ctx.rect(g.x, g.y, g.w, g.h); ctx.clip();
      ctx.strokeStyle = "#7fe96b"; ctx.lineWidth = 1;
      ctx.beginPath();
      for (var i = 0; i < bands.length; i++) {
        var x = g.x + (i / (bands.length - 1)) * g.w;
        var y = g.y + g.h / 2 - (bands[i] / 12) * (g.h / 2 - 1);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
    }
    function render() {
      ctx.clearRect(0, 0, MAIN_W, MAIN_H);
      if (img()) ctx.drawImage(img(), 0, 0, 275, 116, 0, 0, 275, 116);
      blit("TITLE_SEL", 0, 0);
      blit(on ? "ON_SEL" : "ON", EQ_LAYOUT.on.x, EQ_LAYOUT.on.y);
      blit("AUTO", EQ_LAYOUT.auto.x, EQ_LAYOUT.auto.y);
      blit("PRESETS", EQ_LAYOUT.presets.x, EQ_LAYOUT.presets.y);
      blit("GRAPH_BG", EQ_LAYOUT.graph.x, EQ_LAYOUT.graph.y);
      drawCurve();
      // troughs (vertical bars) first, then the metal thumbs on top
      trough(EQ_LAYOUT.preamp.x, preamp);
      for (var i = 0; i < 10; i++) trough(EQ_LAYOUT.bandX[i], bands[i]);
      blit(dragBand === -2 ? "THUMB_A" : "THUMB", EQ_LAYOUT.preamp.x + 2, thumbY(preamp));
      for (var k = 0; k < 10; k++) blit(dragBand === k ? "THUMB_A" : "THUMB", EQ_LAYOUT.bandX[k] + 2, thumbY(bands[k]));
    }
    var raf = 0;
    function sched() { if (!raf) raf = requestAnimationFrame(function () { raf = 0; render(); }); }

    function pos(e) {
      var b = canvas.getBoundingClientRect();
      return { x: (e.clientX - b.left) / scale, y: (e.clientY - b.top) / scale };
    }
    function bandAt(p) {
      if (p.y < EQ_LAYOUT.bandY - 2 || p.y > EQ_LAYOUT.bandY + EQ_LAYOUT.thumbRange + 13) return -1;
      for (var i = 0; i < 10; i++) if (p.x >= EQ_LAYOUT.bandX[i] - 2 && p.x <= EQ_LAYOUT.bandX[i] + 13) return i;
      return -1;
    }
    canvas.addEventListener("mousedown", function (e) {
      var p = pos(e);
      var bi = bandAt(p);
      if (bi >= 0) { dragBand = bi; bands[bi] = valFromY(p.y); sched(); e.preventDefault(); }
    });
    window.addEventListener("mousemove", function (e) {
      if (dragBand < 0) return; bands[dragBand] = valFromY(pos(e).y); sched();
    });
    window.addEventListener("mouseup", function (e) {
      if (dragBand >= 0) { dragBand = -1; sched(); return; }
      var p = pos(e);
      if (p.x >= EQ_LAYOUT.on.x && p.x <= EQ_LAYOUT.on.x + EQ_LAYOUT.on.w && p.y >= EQ_LAYOUT.on.y && p.y <= EQ_LAYOUT.on.y + EQ_LAYOUT.on.h) { on = !on; sched(); }
      else if (p.x >= EQ_LAYOUT.close.x && p.x <= EQ_LAYOUT.close.x + 9 && p.y >= EQ_LAYOUT.close.y && p.y <= EQ_LAYOUT.close.y + 9) { hooks.onClose && hooks.onClose(); }
    });

    render();
    return {
      el: canvas,
      dragRegion: { x: 0, y: 0, w: 244 * scale, h: EQ_LAYOUT.titlebar.h * scale },
      destroy: function () { if (raf) cancelAnimationFrame(raf); canvas.remove(); },
    };
  }

  // =========================================================================
  // GEN.BMP generic-window frame, as CSS background-image layers (the browser
  // tiles them so the framed windows stay resizable). Returns null if the skin
  // omits GEN.BMP. Coordinates from skinSprites.ts (GEN, *_SELECTED variants).
  // =========================================================================
  // Titlebar (top row, selected y=0): gold corners + LR_FILL ridges fill the
  // bar; the title sits on the plain CENTER_FILL plaque flanked by END caps.
  var GEN = {
    TL: [0, 0, 25, 20], LEND: [26, 0, 25, 20], CFILL: [52, 0, 25, 20],
    REND: [78, 0, 25, 20], GOLD: [104, 0, 25, 20], TR: [130, 0, 25, 20],
    ML: [127, 42, 11, 29], MR: [139, 42, 8, 29],
    BL: [0, 42, 125, 14], BR: [0, 57, 125, 14], BFILL: [127, 72, 25, 14],
    CLOSE: [148, 42, 9, 9],
  };
  function genAssets(skin) {
    var g = skin.sheets.GEN; if (!g) return null;
    var u = {};
    Object.keys(GEN).forEach(function (k) { u[k] = spriteDataURL(g, GEN[k]); });
    return u;
  }

  // Parse PLEDIT.TXT (playlist colors) into { normal, current, normalbg, selectedbg }.
  function parsePledit(skin) {
    var bytes = skin.files && skin.files["PLEDIT.TXT"]; if (!bytes) return null;
    var txt = new TextDecoder().decode(bytes);
    var out = {};
    txt.split(/\r?\n/).forEach(function (line) {
      var m = line.split("=");
      if (m.length === 2) out[m[0].trim().toLowerCase()] = m[1].trim();
    });
    var norm = function (c) { return c && c[0] === "#" ? c : (c ? "#" + c : null); };
    return {
      normal: norm(out.normal), current: norm(out.current),
      normalbg: norm(out.normalbg), selectedbg: norm(out.selectedbg),
    };
  }

  window.NeoAmpClassic = {
    loadSkin: loadSkin, loadSkinFromArrayBuffer: loadSkinFromArrayBuffer,
    mountMain: mountMain, mountEq: mountEq,
    genAssets: genAssets, parsePledit: parsePledit, MAIN_W: MAIN_W, MAIN_H: MAIN_H,
  };
})();
