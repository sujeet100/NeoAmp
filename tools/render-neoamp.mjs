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
const CDP_PORT = 9355, HTTP_PORT = 9356;
fs.mkdirSync(OUTDIR, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MIME = { ".html":"text/html", ".css":"text/css", ".js":"text/javascript", ".mjs":"text/javascript", ".wsz":"application/zip", ".ttf":"font/ttf", ".png":"image/png", ".json":"application/json" };

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  const fp = path.join(REPO, p);
  if (!fp.startsWith(REPO)) { res.writeHead(403); res.end(); return; }
  fs.readFile(fp, (err, buf) => {
    if (err) { res.writeHead(404); res.end("404 " + p); return; }
    res.writeHead(200, { "content-type": MIME[path.extname(fp)] || "application/octet-stream" });
    res.end(buf);
  });
}).listen(HTTP_PORT);

const udd = fs.mkdtempSync(path.join(os.tmpdir(), "cr-"));
const chrome = spawn(CHROME, [
  "--headless=new", "--remote-debugging-port=" + CDP_PORT, "--user-data-dir=" + udd,
  "--window-size=1200,1200", "--hide-scrollbars", "--mute-audio",
  "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist",
  "--no-first-run", "--no-default-browser-check", "about:blank",
], { stdio: ["ignore", "ignore", "pipe"] });
let chromeErr = ""; chrome.stderr.on("data", (d) => { chromeErr += d.toString(); });

async function wsTargetUrl() {
  for (let i = 0; i < 50; i++) {
    try { const r = await fetch(`http://127.0.0.1:${CDP_PORT}/json`); const list = await r.json();
      const page = list.find((t) => t.type === "page"); if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch (e) {} await sleep(200);
  }
  throw new Error("CDP didn't come up:\n" + chromeErr.slice(-1500));
}
function cdp(ws) {
  let id = 0; const pending = new Map(); const logs = [];
  ws.addEventListener("message", (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); return; }
    if (m.method === "Runtime.consoleAPICalled") logs.push("[" + m.params.type + "] " + m.params.args.map((a) => a.value ?? a.description ?? a.type).join(" "));
    else if (m.method === "Log.entryAdded") logs.push("[log:" + m.params.entry.level + "] " + m.params.entry.text);
    else if (m.method === "Runtime.exceptionThrown") { const ex = m.params.exceptionDetails; logs.push("[EXCEPTION] " + (ex.exception?.description || ex.text)); }
  });
  const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  return { send, logs };
}
async function shot(send, name) {
  const s = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, clip: { x: 0, y: 0, width: 640, height: 1120, scale: 1 } });
  if (s.result?.data) { const fp = `${OUTDIR}/${name}.png`; fs.writeFileSync(fp, Buffer.from(s.result.data, "base64")); console.log("wrote", fp); }
  else console.log("shot failed", name, JSON.stringify(s).slice(0, 200));
}
const evalJs = (send, expr) => send("Runtime.evaluate", { expression: expr, returnByValue: true }).then((r) => r.result?.result?.value);

(async () => {
  const ws = new WebSocket(await wsTargetUrl());
  await new Promise((res, rej) => { ws.addEventListener("open", res); ws.addEventListener("error", rej); });
  const { send, logs } = cdp(ws);
  await send("Runtime.enable"); await send("Log.enable"); await send("Page.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 640, height: 1120, deviceScaleFactor: 2, mobile: false });
  await send("Page.navigate", { url: `http://127.0.0.1:${HTTP_PORT}/tools/neoamp-preview.html` });
  await sleep(3000);

  // sanity: which windows mounted + any obvious layout problems
  const probe = await evalJs(send, `JSON.stringify((function(){
    var out={};
    ["wa-skin","wa-np","wa-pl","wa-lib","wa-eq-skin","wa-viz","neoamp-launch"].forEach(function(id){
      var e=document.getElementById(id); out[id]= e? (e.offsetWidth+"x"+e.offsetHeight+" @"+e.offsetLeft+","+e.offsetTop+(e.style.display==='none'?' HIDDEN':'')) : "MISSING";
    });
    var c=document.querySelector('#wa-skin canvas'); out.mainCanvas=c?(c.width+"x"+c.height+" css "+c.style.width+"x"+c.style.height):"none";
    return out;
  })())`);
  console.log("WINDOW PROBE:", probe);
  await shot(send, "1_default");
  // focused, high-DPI captures to inspect the buttons closely
  async function clipShot(name, c) {
    const s = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, clip: { ...c, scale: 2 } });
    if (s.result?.data) { fs.writeFileSync(`${OUTDIR}/${name}.png`, Buffer.from(s.result.data, "base64")); console.log("wrote", name); }
  }
  await clipShot("np_focus", { x: 38, y: 300, width: 562, height: 103 });   // the whole Now-Playing panel
  await clipShot("eqpl_focus", { x: 470, y: 175, width: 130, height: 24 });  // main-window EQ/PL bitmap buttons

  // open Library (LIB toggle in the NP panel), then run a search, then HOME
  await evalJs(send, `[].slice.call(document.querySelectorAll('.wa-np-tog')).filter(function(b){return /LIB/i.test(b.textContent);}).forEach(function(b){b.click();}); true`);
  await sleep(500); await shot(send, "2_library_open");
  await evalJs(send, `(function(){var i=document.querySelector('.wa-lib-input'); if(i){i.value='tool'; var go=document.querySelector('.wa-lib-go'); if(go) go.click();} return !!i;})()`);
  await sleep(500); await shot(send, "3_search");
  await evalJs(send, `(function(){var h=document.querySelector('.wa-lib-home'); if(h) h.click(); return !!h;})()`);
  await sleep(500); await shot(send, "4_home");

  // measure the NP buttons + skin picker so I can check sizes objectively
  const sizes = await evalJs(send, `JSON.stringify((function(){
    function box(sel){var e=document.querySelector(sel); return e?(Math.round(e.getBoundingClientRect().width)+"x"+Math.round(e.getBoundingClientRect().height)):null;}
    return { visBtn: box('.wa-np-toggles .wa-np-tog'), rateBtn: box('.wa-rate-btn'), skinBtn: box('.wa-np-btns .wa-skinsel-btn'), np: box('#wa-np') };
  })())`);
  console.log("SIZES:", sizes);

  console.log("\n=== PAGE CONSOLE (last 50) ===\n" + (logs.slice(-50).join("\n") || "(empty)"));
  ws.close(); chrome.kill("SIGKILL"); server.close();
  try { fs.rmSync(udd, { recursive: true, force: true }); } catch (e) {}
  await sleep(150); process.exit(0);
})().catch((e) => { console.error("HARNESS ERROR:", e.message); chrome.kill("SIGKILL"); server.close(); process.exit(1); });
