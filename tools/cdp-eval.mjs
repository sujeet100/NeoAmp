// Evaluate a JS expression file in a LIVE Chrome tab over CDP — for reading a real,
// logged-in site's DOM so provider selectors are VERIFIED, not guessed. This is how the
// Spotify selectors (like/transport/seek/queue/search) were nailed; reuse it for any new
// provider before shipping selectors.
//
//   1) Launch a headful Chrome you can log into (throwaway profile, own debug port):
//        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
//          --remote-debugging-port=9333 --user-data-dir=/tmp/cdp-profile \
//          --no-first-run --no-default-browser-check "https://open.spotify.com"
//      Log in + set the page state you want to inspect (e.g. play a track, open the queue).
//   2) Write a probe .js whose final expression RETURNS a JSON-serializable value (an
//      IIFE; may be async + return a Promise — it's awaited). Anchor on stable semantics
//      (data-testid / aria / role / id-prefix / href), never hashed CSS classes.
//   3) node tools/cdp-eval.mjs <probe.js>          env: PORT=9333  MATCH=<url substring>
//
// Tip for net-neutral state probes (e.g. like/seek): toggle twice so you observe both
// states and leave the account/playback unchanged.
import fs from "node:fs";
const PORT = process.env.PORT || "9333";
const MATCH = process.env.MATCH || "";
const exprFile = process.argv[2];
if (!exprFile) { console.error("usage: node tools/cdp-eval.mjs <probe.js>   (env PORT, MATCH)"); process.exit(1); }
const expr = fs.readFileSync(exprFile, "utf8");
const list = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json();
const page = list.find((t) => t.type === "page" && t.url.includes(MATCH)) || list.find((t) => t.type === "page");
if (!page) { console.error("No matching page target. Targets:\n" + list.map((t) => t.type + " " + t.url).join("\n")); process.exit(2); }
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.addEventListener("open", res); ws.addEventListener("error", rej); });
let id = 0; const pend = new Map();
ws.addEventListener("message", (ev) => { const m = JSON.parse(ev.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } });
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
await send("Runtime.enable");
const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
if (r.result && r.result.exceptionDetails) console.error("EXCEPTION:", JSON.stringify(r.result.exceptionDetails).slice(0, 600));
console.log(JSON.stringify(r.result?.result?.value ?? r.result, null, 2));
process.exit(0);
