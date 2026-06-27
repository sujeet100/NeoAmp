// Self-render harness — drive viz.html headlessly via the Chrome DevTools Protocol and screenshot
// it, so we can verify Alchemy presets WITHOUT the user. Pure Node (built-in WebSocket/fetch) +
// cached chrome-headless-shell; no MCP, no puppeteer dependency.
//
// Usage: node tools/selfrender.mjs ["Preset Name"] [shot1,shot2,... seconds]
//   default preset = boot default ("Alchemy V4: Random"); default shots = 3.0,7.0,11.0
// Outputs /tmp/alc-render/shot_<t>s.png + prints the page console (catches [WMP-viz] + shader errors).
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// REPO/OUTDIR/PORT are env-overridable so several renders can run in PARALLEL without
// colliding (e.g. one per git-worktree, each with its own Chrome port + output dir).
const REPO = process.env.REPO || "/Users/sujitk/projects/personal/ytmusic-wmp-visualizer";
// Full Chrome with new-headless has solid software-WebGL (SwiftShader via ANGLE); the standalone
// chrome-headless-shell's WebGL is flaky (returns a null GL context). Default to full Chrome.
const CHROME = process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const HEADLESS = process.env.HEADLESS || "new"; // "new" for full Chrome; "shell" = headless-shell (omit flag)
const PRESET = process.argv[2] || ""; // "" = use viz.js boot default
const SHOTS = (process.argv[3] || "3.0,7.0,11.0").split(",").map(Number);
const OUTDIR = process.env.OUTDIR || "/tmp/alc-render";
const PORT = Number(process.env.PORT) || 9344;
const URL = "file://" + REPO + "/viz.html";

fs.mkdirSync(OUTDIR, { recursive: true });
const udd = fs.mkdtempSync(path.join(os.tmpdir(), "cr-"));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const chrome = spawn(
  CHROME,
  [
    ...(HEADLESS === "new" ? ["--headless=new"] : []),
    "--remote-debugging-port=" + PORT,
    "--user-data-dir=" + udd,
    "--window-size=1280,800",
    "--hide-scrollbars",
    "--mute-audio",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
    "--ignore-gpu-blocklist",
    "--autoplay-policy=no-user-gesture-required",
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
      const r = await fetch(`http://127.0.0.1:${PORT}/json`);
      const list = await r.json();
      const page = list.find((t) => t.type === "page");
      if (page && page.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch (e) {
      /* not up yet */
    }
    await sleep(200);
  }
  throw new Error("Chrome CDP did not come up. stderr:\n" + chromeErr.slice(-1500));
}

function cdpClient(ws) {
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
    if (m.method === "Runtime.consoleAPICalled") {
      logs.push(
        "[" +
          m.params.type +
          "] " +
          m.params.args
            .map((a) => (a.value !== undefined ? a.value : a.description || a.type))
            .join(" ")
      );
    } else if (m.method === "Log.entryAdded") {
      logs.push("[log:" + m.params.entry.level + "] " + m.params.entry.text);
    } else if (m.method === "Runtime.exceptionThrown") {
      const ex = m.params.exceptionDetails;
      logs.push("[EXCEPTION] " + (ex.exception ? ex.exception.description || ex.text : ex.text));
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

(async () => {
  const wsUrl = await wsTargetUrl();
  const ws = new WebSocket(wsUrl);
  await new Promise((res, rej) => {
    ws.addEventListener("open", res);
    ws.addEventListener("error", rej);
  });
  const { send, logs } = cdpClient(ws);

  await send("Runtime.enable");
  await send("Log.enable");
  await send("Page.enable");
  await send("Emulation.setDeviceMetricsOverride", {
    width: 1280,
    height: 800,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await send("Page.navigate", { url: URL });
  await sleep(2500); // let scripts load + init() + first frames

  // Pump synthetic audio (128-centred time-domain waveform: bass+mid+treb sines × a ~2Hz beat).
  const pump = `(function(){
    const N=1024, buf=new Uint8Array(N); let t=0;
    if (window.__pump) clearInterval(window.__pump);
    window.__pump=setInterval(function(){
      t+=1/60;
      const beat=Math.pow(0.5+0.5*Math.sin(t*6.2832*1.7),3.0);
      const amp=46*(0.45+0.85*beat);
      for(let i=0;i<N;i++){ const x=i/N;
        const v=Math.sin(x*6.2832*3.0)*0.55 + Math.sin(x*6.2832*27.0)*0.30 + Math.sin(x*6.2832*130.0)*0.18;
        buf[i]=Math.max(0,Math.min(255,128+v*amp));
      }
      window.postMessage({__wmp:true,type:'audio',data:buf},'*');
    },16);
    return (window.WMP_PRESETS?Object.keys(window.WMP_PRESETS).length:-1);
  })()`;
  const pumpRes = await send("Runtime.evaluate", { expression: pump, returnByValue: true });
  console.log("presets loaded in page:", pumpRes.result && pumpRes.result.value);

  if (PRESET) {
    await send("Runtime.evaluate", {
      expression: `window.postMessage({__wmp:true,type:'preset:load',name:${JSON.stringify(PRESET)}},'*')`,
    });
  }
  // probe: is the WebGL canvas actually non-black? sample a few pixels after a moment.
  await sleep(800);

  const tag = (PRESET || "boot").replace(/[^a-z0-9]+/gi, "_");
  let last = 2.5 + 0.8;
  for (const s of SHOTS) {
    await sleep(Math.max(0, (s - last) * 1000));
    last = s;
    const shot = await send("Page.captureScreenshot", { format: "png" });
    if (shot.result && shot.result.data) {
      const fp = `${OUTDIR}/${tag}_${s}s.png`;
      fs.writeFileSync(fp, Buffer.from(shot.result.data, "base64"));
      console.log("wrote", fp);
    } else {
      console.log("screenshot failed at", s, "s:", JSON.stringify(shot).slice(0, 300));
    }
  }

  // non-black check via getImageData on the canvas
  const probe = await send("Runtime.evaluate", {
    expression: `(function(){const c=document.getElementById('c');if(!c)return'no-canvas';
      try{const gl=c.getContext('webgl2')||c.getContext('webgl');const px=new Uint8Array(4*64);
        gl.readPixels(0,0,8,8,gl.RGBA,gl.UNSIGNED_BYTE,px);let s=0;for(let i=0;i<px.length;i++)s+=px[i];
        return 'canvas '+c.width+'x'+c.height+' lowerleft8x8 sum='+s;}catch(e){return 'probe err '+e.message;}})()`,
    returnByValue: true,
  });
  console.log("canvas probe:", probe.result && probe.result.value);

  console.log("\n=== PAGE CONSOLE (last 40) ===");
  console.log(logs.slice(-40).join("\n") || "(empty)");

  ws.close();
  chrome.kill("SIGKILL");
  try {
    fs.rmSync(udd, { recursive: true, force: true });
  } catch (e) {}
  await sleep(200);
  process.exit(0);
})().catch((e) => {
  console.error("HARNESS ERROR:", e.message);
  chrome.kill("SIGKILL");
  process.exit(1);
});
