// Render the NeoAmp Winamp UI headlessly: static-serve the repo, drive Chrome via
// CDP, load the preview page (mock backend + real CSS/JS + a vendored .wsz),
// screenshot the default stack + library views, and dump console errors.
import { spawn } from "node:child_process";
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const REPO = path.resolve(new URL(".", import.meta.url).pathname, "..");
const CHROME = process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUTDIR = process.env.OUTDIR || "/tmp/neoamp-render";
const CDP_PORT = 9355,
  HTTP_PORT = 9356;
fs.mkdirSync(OUTDIR, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MIME = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".wsz": "application/zip",
  ".ttf": "font/ttf",
  ".png": "image/png",
  ".json": "application/json",
};

const server = http
  .createServer((req, res) => {
    let p = decodeURIComponent(req.url.split("?")[0]);
    const fp = path.join(REPO, p);
    if (!fp.startsWith(REPO)) {
      res.writeHead(403);
      res.end();
      return;
    }
    fs.readFile(fp, (err, buf) => {
      if (err) {
        res.writeHead(404);
        res.end("404 " + p);
        return;
      }
      res.writeHead(200, { "content-type": MIME[path.extname(fp)] || "application/octet-stream" });
      res.end(buf);
    });
  })
  .listen(HTTP_PORT);

const udd = fs.mkdtempSync(path.join(os.tmpdir(), "cr-"));
const chrome = spawn(
  CHROME,
  [
    "--headless=new",
    "--remote-debugging-port=" + CDP_PORT,
    "--user-data-dir=" + udd,
    "--window-size=1200,1200",
    "--hide-scrollbars",
    "--mute-audio",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
    "--ignore-gpu-blocklist",
    "--no-first-run",
    "--no-default-browser-check",
    "about:blank",
  ],
  { stdio: ["ignore", "ignore", "pipe"] }
);
let chromeErr = "";
chrome.stderr.on("data", (d) => {
  chromeErr += d.toString();
});

async function wsTargetUrl() {
  for (let i = 0; i < 50; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${CDP_PORT}/json`);
      const list = await r.json();
      const page = list.find((t) => t.type === "page");
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch (e) {}
    await sleep(200);
  }
  throw new Error("CDP didn't come up:\n" + chromeErr.slice(-1500));
}
function cdp(ws) {
  let id = 0;
  const pending = new Map();
  const logs = [];
  ws.addEventListener("message", (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) {
      pending.get(m.id)(m);
      pending.delete(m.id);
      return;
    }
    if (m.method === "Runtime.consoleAPICalled")
      logs.push(
        "[" +
          m.params.type +
          "] " +
          m.params.args.map((a) => a.value ?? a.description ?? a.type).join(" ")
      );
    else if (m.method === "Log.entryAdded")
      logs.push("[log:" + m.params.entry.level + "] " + m.params.entry.text);
    else if (m.method === "Runtime.exceptionThrown") {
      const ex = m.params.exceptionDetails;
      logs.push("[EXCEPTION] " + (ex.exception?.description || ex.text));
    }
  });
  const send = (method, params = {}) =>
    new Promise((res) => {
      const i = ++id;
      pending.set(i, res);
      ws.send(JSON.stringify({ id: i, method, params }));
    });
  return { send, logs };
}
async function shot(send, name) {
  const s = await send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: true,
    clip: { x: 0, y: 0, width: 640, height: 1120, scale: 1 },
  });
  if (s.result?.data) {
    const fp = `${OUTDIR}/${name}.png`;
    fs.writeFileSync(fp, Buffer.from(s.result.data, "base64"));
    console.log("wrote", fp);
  } else console.log("shot failed", name, JSON.stringify(s).slice(0, 200));
}
const evalJs = (send, expr) =>
  send("Runtime.evaluate", { expression: expr, returnByValue: true }).then(
    (r) => r.result?.result?.value
  );

(async () => {
  const ws = new WebSocket(await wsTargetUrl());
  await new Promise((res, rej) => {
    ws.addEventListener("open", res);
    ws.addEventListener("error", rej);
  });
  const { send, logs } = cdp(ws);
  await send("Runtime.enable");
  await send("Log.enable");
  await send("Page.enable");
  await send("Emulation.setDeviceMetricsOverride", {
    width: 640,
    height: 1120,
    deviceScaleFactor: 2,
    mobile: false,
  });
  await send("Page.navigate", { url: `http://127.0.0.1:${HTTP_PORT}/tools/neoamp-preview.html` });
  await sleep(3000);

  // Optionally load a real .wsz skin (env WSZ_PATH = repo-relative path, served by our HTTP
  // server) via the same code path the file-picker uses, so every shot below renders in it.
  if (process.env.WSZ_PATH) {
    const url = "http://127.0.0.1:" + HTTP_PORT + "/" + process.env.WSZ_PATH.replace(/^\/+/, "");
    const res = await send("Runtime.evaluate", {
      awaitPromise: true,
      returnByValue: true,
      expression: `(async()=>{ try{
        const buf = await (await fetch(${JSON.stringify(url)})).arrayBuffer();
        const skin = await window.NeoAmpClassic.loadSkinFromArrayBuffer(buf);
        if(!skin||!skin.sheets||!skin.sheets.MAIN) return 'NO_MAIN';
        const id='custom-showcase';
        const b64=(typeof bufToB64==='function')?bufToB64(buf):'';
        if(!CLASSIC_SKINS.some(function(s){return s.id===id;})) CLASSIC_SKINS.push({id:id,name:${JSON.stringify(process.env.WSZ_NAME || "Custom Skin")},b64:b64,custom:true});
        if(typeof refreshSkinOptions==='function') refreshSkinOptions();
        enableClassic(id); activeSkinValue='wsz:'+id;
        return 'APPLIED';
      }catch(e){ return 'ERR '+((e&&e.message)||e); } })()`,
    });
    console.log("WSZ LOAD:", res.result && res.result.result && res.result.result.value);
    await sleep(1800); // let the BMP sheets decode + the classic window repaint
  }

  // sanity: which windows mounted + any obvious layout problems
  const probe = await evalJs(
    send,
    `JSON.stringify((function(){
    var out={};
    ["wa-skin","wa-np","wa-pl","wa-lib","wa-eq-skin","wa-viz","neoamp-launch"].forEach(function(id){
      var e=document.getElementById(id); out[id]= e? (e.offsetWidth+"x"+e.offsetHeight+" @"+e.offsetLeft+","+e.offsetTop+(e.style.display==='none'?' HIDDEN':'')) : "MISSING";
    });
    var c=document.querySelector('#wa-skin canvas'); out.mainCanvas=c?(c.width+"x"+c.height+" css "+c.style.width+"x"+c.style.height):"none";
    return out;
  })())`
  );
  console.log("WINDOW PROBE:", probe);
  await shot(send, "1_default");
  // focused, high-DPI captures to inspect the buttons closely
  async function clipShot(name, c) {
    const s = await send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: true,
      clip: { ...c, scale: 2 },
    });
    if (s.result?.data) {
      fs.writeFileSync(`${OUTDIR}/${name}.png`, Buffer.from(s.result.data, "base64"));
      console.log("wrote", name);
    }
  }
  await clipShot("np_focus", { x: 38, y: 300, width: 562, height: 103 }); // the whole Now-Playing panel
  await clipShot("eqpl_focus", { x: 470, y: 175, width: 130, height: 24 }); // main-window EQ/PL bitmap buttons
  await clipShot("viz_titlebar", { x: 606, y: 62, width: 392, height: 56 }); // full viz titlebar (title + buttons)
  const vizTitleInfo = await evalJs(
    send,
    `(function(){var v=document.getElementById('wa-viz'); var t=v&&v.querySelector('.wa-title'); if(!t)return 'no-title'; var cs=getComputedStyle(t); return JSON.stringify({win:v.className, pos:cs.position, left:cs.left, ls:cs.letterSpacing}); })()`
  );
  console.log("VIZ TITLE:", vizTitleInfo);
  // open the NP skin-picker dropdown (raise NP above the playlist first) + capture it
  await evalJs(
    send,
    `(function(){var n=document.getElementById('wa-np'); if(n)n.style.zIndex=9999; var b=document.querySelector('.wa-np-btns .wa-skinsel-btn'); if(b)b.click(); return !!b;})()`
  );
  await sleep(250);
  await clipShot("dropdown", { x: 360, y: 330, width: 280, height: 300 });
  await evalJs(send, `document.body.click(); true`);

  // reveal the classic EQ window (mounted-but-hidden) at a fixed spot + capture its
  // faders — they should sit at the seeded band gains, not flat
  await evalJs(
    send,
    `(function(){var w=document.getElementById('wa-eq-skin'); if(w){w.style.display='';w.style.left='40px';w.style.top='560px';w.style.zIndex=9998;} return !!w;})()`
  );
  await sleep(200);
  await clipShot("eq_window", { x: 38, y: 558, width: 562, height: 240 });
  // click the EQ window's PRESETS button (canvas hit) → capture the presets menu
  await evalJs(
    send,
    `(function(){var c=document.querySelector('#wa-eq-skin canvas'); if(!c)return 0; var r=c.getBoundingClientRect(); ['mousedown','mouseup'].forEach(function(t){window.dispatchEvent(new MouseEvent(t,{clientX:r.left+478,clientY:r.top+48,bubbles:true}));}); return 1;})()`
  );
  await sleep(150);
  await clipShot("eq_presets", { x: 38, y: 558, width: 562, height: 300 });
  await evalJs(
    send,
    `(function(){var w=document.getElementById('wa-eq-skin'); if(w)w.style.display='none'; return true;})()`
  );

  // open Library (LIB toggle in the NP panel), then run a search, then HOME
  await evalJs(
    send,
    `[].slice.call(document.querySelectorAll('.wa-np-tog')).filter(function(b){return /LIB/i.test(b.textContent);}).forEach(function(b){b.click();}); true`
  );
  await sleep(500);
  await shot(send, "2_library_open");
  await evalJs(
    send,
    `(function(){var i=document.querySelector('.wa-lib-input'); if(i){i.value='tool'; var go=document.querySelector('.wa-lib-go'); if(go) go.click();} return !!i;})()`
  );
  await sleep(500);
  await shot(send, "3_search");
  await evalJs(
    send,
    `(function(){var h=document.querySelector('.wa-lib-home'); if(h) h.click(); return !!h;})()`
  );
  await sleep(500);
  await shot(send, "4_home");

  // optional: switch to a named skin (env SKIN="TopazAmp") and screenshot it
  const SKIN = process.env.SKIN;
  if (SKIN) {
    // Switch skin via the real selectSkin() path (SKIN env = skin id like "amber" OR display
    // name like "Amber Monochrome"). The old approach drove the picker DOM (.wa-skinsel-btn /
    // .wa-skinsel-item), whose selectors went stale — it silently rendered the default skin.
    const picked = await evalJs(
      send,
      `(function(){
        var want = ${JSON.stringify(SKIN)};
        var skins = (window.NeoAmpSkins && window.NeoAmpSkins.list) || [];
        var m = skins.filter(function(s){ return s.id === want || new RegExp(want, 'i').test(s.name); })[0];
        if (!m) return 'NOT FOUND';
        if (typeof selectSkin === 'function') { selectSkin(m.id); return m.name; }
        if (window.NeoAmpSkins) { window.NeoAmpSkins.apply(document, m.id); return m.name + ' (apply)'; }
        return 'NO API';
      })()`
    );
    console.log("SKIN SWITCH:", picked);
    await sleep(2800);
    await shot(send, "skin_" + SKIN.replace(/[^a-z0-9]+/gi, "_"));
    const vt = await evalJs(
      send,
      `(function(){var v=document.getElementById('wa-viz'); var t=v&&v.querySelector('.wa-title'); if(!t)return 'no'; var r=t.getBoundingClientRect(), vr=v.getBoundingClientRect(); var cs=getComputedStyle(t); return JSON.stringify({win:v.className, pos:cs.position, left:cs.left, ls:cs.letterSpacing, titleCenterPct: Math.round(((r.left+r.width/2)-vr.left)/vr.width*100), vizW: Math.round(vr.width)}); })()`
    );
    console.log("VIZ TITLE (skin):", vt);
  }

  // measure the NP buttons + skin picker so I can check sizes objectively
  const sizes = await evalJs(
    send,
    `JSON.stringify((function(){
    function box(sel){var e=document.querySelector(sel); return e?(Math.round(e.getBoundingClientRect().width)+"x"+Math.round(e.getBoundingClientRect().height)):null;}
    return { visBtn: box('.wa-np-toggles .wa-np-tog'), rateBtn: box('.wa-rate-btn'), skinBtn: box('.wa-np-btns .wa-skinsel-btn'), np: box('#wa-np') };
  })())`
  );
  console.log("SIZES:", sizes);

  console.log("\n=== PAGE CONSOLE (last 50) ===\n" + (logs.slice(-50).join("\n") || "(empty)"));
  ws.close();
  chrome.kill("SIGKILL");
  server.close();
  try {
    fs.rmSync(udd, { recursive: true, force: true });
  } catch (e) {}
  await sleep(150);
  process.exit(0);
})().catch((e) => {
  console.error("HARNESS ERROR:", e.message);
  chrome.kill("SIGKILL");
  server.close();
  process.exit(1);
});
