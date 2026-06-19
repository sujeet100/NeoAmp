/* NeoAmp service worker — owns real-EQ tab-audio capture.
 *
 * Why this exists (it didn't before — the project ran capture in the content
 * script): a *real* equalizer has to shape the audio you HEAR. The only way to do
 * that on YouTube Music's (cross-origin) audio is to capture the tab and replay a
 * processed copy. getDisplayMedia can't (suppressing the tab to mute the original
 * also mutes our own WebAudio output — same tab). chrome.tabCapture mutes the tab
 * and lets us replay an EQ'd copy from a SEPARATE context (the offscreen document),
 * which the tab's muting can't touch.
 *
 * tabCapture.getMediaStreamId() needs a real user gesture in THIS (worker) context,
 * so capture is started by clicking the extension's toolbar icon — a content-script
 * message can't carry the gesture. The streamId is then consumed by the same-origin
 * offscreen document, where the AudioContext + EQ live.
 */

// VERTICAL-SLICE STATUS: proves capture→offscreen→EQ→speakers. Toolbar click starts
// capture with a DRAMATIC test curve so the EQ effect is unmistakable; clicking again
// stops. UI wiring + FFT-to-visualizer come next.

let capturing = false;
let capturedTabId = null;

// surface status as an on-page toast in the captured tab (so neither of us needs a console)
function notify(tabId, text) {
  if (tabId == null) return;
  chrome.tabs.sendMessage(tabId, { target: "content", type: "toast", text }).catch(function () {});
}

async function hasOffscreen() {
  const contexts = await chrome.runtime.getContexts({ contextTypes: ["OFFSCREEN_DOCUMENT"] });
  return contexts.length > 0;
}

async function ensureOffscreen() {
  if (await hasOffscreen()) return;
  await chrome.offscreen.createDocument({
    url: "offscreen.html",
    reasons: ["USER_MEDIA"],
    justification: "Capture this tab's audio to run the equalizer.",
  });
}

// Toggle capture on/off. `tab` must be the tab to capture; both triggers below
// (toolbar click + keyboard command) hand us the active tab WITH a fresh user
// gesture, which getMediaStreamId() requires.
async function toggleCapture(tab) {
  const tabId = tab && tab.id;
  try {
    if (capturing) {
      chrome.runtime.sendMessage({ target: "offscreen", type: "stop" }).catch(() => {});
      lifecycle(capturedTabId, "stopped");
      capturing = false; capturedTabId = null;
      console.log("[NeoAmp sw] capture stopped");
      return;
    }
    if (tabId == null) { console.warn("[NeoAmp sw] no active tab"); return; }
    // grab the streamId FIRST, while the gesture activation is fresh (creating the
    // offscreen doc could otherwise burn the gesture window)
    const streamId = await chrome.tabCapture.getMediaStreamId({ targetTabId: tabId });
    await ensureOffscreen();
    chrome.runtime.sendMessage({ target: "offscreen", type: "start", streamId }).catch(() => {});
    capturing = true; capturedTabId = tabId;
    lifecycle(tabId, "started");   // content raises the player + EQ window
    console.log("[NeoAmp sw] capture started for tab", tabId);
  } catch (e) {
    console.error("[NeoAmp sw] start failed", e);
    notify(tabId, "NeoAmp couldn't start: " + (e && e.message || e));
  }
}

// THREE ways to toggle, whichever reaches the extension with a usable gesture:
//   1. in-page ◢◤ button → content relays a message (target:sw, type:toggle-eq)
//   2. toolbar action icon (if reachable in the browser UI)
//   3. keyboard shortcut (Ctrl/Cmd+Shift+E) — onCommand passes the active tab (Chrome 105+)
chrome.action.onClicked.addListener((tab) => { toggleCapture(tab); });
chrome.commands.onCommand.addListener((command, tab) => {
  if (command === "toggle-eq") toggleCapture(tab);
});

// A right-click context-menu item is a reliable "button" that INVOKES the extension
// (granting activeTab), which tabCapture.getMediaStreamId requires — unlike an in-page
// webpage button. Works in Arc too, where the toolbar icon is hidden. Starting opens
// the NeoAmp player; the EQ is then driven entirely from the player's EQ window.
const YTM = ["https://music.youtube.com/*"];
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({ id: "neoamp-toggle-eq", title: "Toggle NeoAmp player + EQ (capture this tab's audio)", contexts: ["all"], documentUrlPatterns: YTM });
  });
});
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "neoamp-toggle-eq") toggleCapture(tab);
});

// tell the content script capture has begun/ended so it raises/hides the player
function lifecycle(tabId, state) {
  if (tabId == null) return;
  chrome.tabs.sendMessage(tabId, { target: "content", type: "lifecycle", state }).catch(() => {});
}

// relay hub between the content script (player UI) and the offscreen audio engine
chrome.runtime.onMessage.addListener((msg, sender) => {
  if (!msg || msg.target !== "sw") return;
  if (msg.type === "toggle-eq") toggleCapture(sender.tab || null);
  else if (msg.type === "stop-capture") { if (capturing) toggleCapture(null); }
  else if (msg.type === "content-loaded") {
    // the captured tab reloaded → its capture is dead; reset to idle so ONE click
    // restarts cleanly (otherwise the first click just stops the ghost session)
    if (capturing && sender.tab && sender.tab.id === capturedTabId) {
      chrome.runtime.sendMessage({ target: "offscreen", type: "stop" }).catch(() => {});
      capturing = false; capturedTabId = null;
      console.log("[NeoAmp sw] captured tab reloaded — reset to idle");
    }
  }
  else if (msg.type === "relay-eq") {
    // EQ window faders → offscreen graph (live)
    chrome.runtime.sendMessage({ target: "offscreen", type: "setEq", bands: msg.eq.bands, preamp: msg.eq.preamp, balance: msg.eq.balance, enabled: msg.eq.enabled }).catch(() => {});
  }
  else if (msg.type === "fft") {
    // offscreen analyser → content script (drives the visualizer + spectrum)
    if (capturedTabId != null) chrome.tabs.sendMessage(capturedTabId, { target: "content", type: "fft", b64: msg.b64 }).catch(() => {});
  }
  else if (msg.type === "error") {
    console.error("[NeoAmp offscreen]", msg.error);
    notify(capturedTabId, "NeoAmp EQ error: " + msg.error);
  }
});
