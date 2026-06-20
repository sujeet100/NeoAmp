# NeoAmp — Multi-Provider & Anti-Fragility Design

Design for (a) supporting music providers beyond YouTube Music and (b) making the
DOM-dependent parts far less fragile. Written 2026-06-20, grounded in a live test
(Spotify) + a verification research pass (sources at the bottom).

## TL;DR — decisions

1. **Yes to multi-provider.** A real EQ + Winamp skins + MilkDrop visualizer over *any*
   web player is something native apps don't offer. The cost is low because **only
   `content.js` is provider-coupled** — the audio path (`tabCapture` → offscreen EQ) and
   the entire UI are already provider-agnostic.
2. **MediaSession is the metadata backbone** (SHIPPED). Read now-playing from the
   web-standard `navigator.mediaSession` instead of per-site CSS classes. Provider-
   agnostic *and* far less fragile. DOM scrape stays as fallback.
3. **Transport stays per-provider** — and that's unavoidable: MediaSession is read-only
   for control. Play/pause/seek go through the media element (generic); next/prev need a
   small per-provider DOM selector (the one genuinely fragile bit, isolated + hot-fixable).
4. **Anti-fragility = stable-first resolver + detection, not 2× CSS.** Layer sources by
   stability (MediaSession → media element → ARIA → CSS) so fallbacks have *different*
   failure modes; detect breakage and surface it; hot-fix selectors via a remote config.
5. **DRM does not block us.** Verified live on Spotify (Widevine) — EQ + viz work. DRM
   protects *video frames*; audio passes through the mixer `tabCapture` samples.

## Why this is cheap: only `content.js` is coupled

```
sw.js + offscreen.js   ── tabCapture → EQ graph → FFT ──  provider-AGNOSTIC (untouched)
winamp.js + wsz.js     ── windows, skins, viz, controls ─  provider-AGNOSTIC (untouched)
content.js             ── scrape track/queue, drive transport ─  the ONLY coupled layer
```

"Support another provider" = "abstract `content.js`," not a rewrite.

## Verified findings (what the design rests on)

| Question | Verdict | Confidence |
| --- | --- | --- |
| Does DRM/EME block `tabCapture` **audio** (Spotify/Apple)? | **No** — DRM blacks out *video frames* (secure compositor); audio routes through the normal mixer. Verified live on Spotify; corroborated by Mozilla Bug 1331763 ("capturing audio from an EME element is fine"). | High (empirical) |
| Can a content script read the page's `navigator.mediaSession`? | Not from the isolated world (separate realm). **`world:"MAIN"` content script + `postMessage` relay** works. Poll (no change event). | High |
| Can we trigger play/pause/next via MediaSession? | **No** — action handlers are invoked *by* the browser only; read-only for control. Transport must use the media element or DOM buttons. | High |
| Remote JSON config from the SW? | Allowed (JSON is *not* remote code). SW fetch needs `host_permissions`, is **not** subject to the page CSP, gets a CORS bypass. Research preferred jsDelivr-pinned-tag; **we chose plain `raw.githubusercontent@main`** — edit+push, ~5-min propagation, no deploy overhead. The 60-req/hr/IP limit is moot at a ~6h fetch cadence, and the storage cache + bundled defaults cover any failure. | High |
| Which providers next? | **plain YouTube** (reuses code), **Spotify** (done), **Apple Music** (heavier SPA), **Bandcamp** (DRM-free, cleanest, niche). SoundCloud/Deezer/Tidal/Amazon = weak/absent MediaSession → more fragile. | Medium |

## Architecture

### 1. Provider adapter (lightweight registry — config + a few hooks)

Resist a heavy strategy/factory framework. A provider is **mostly declarative config +
optional override functions**, picked by `location.hostname`:

```js
// providers/<id>.js  — registered into a registry keyed by host
Provider = {
  id: "youtube-music",
  hostMatch: /(^|\.)music\.youtube\.com$/,
  capabilities: { eq: true, viz: true, metadata: true, transport: true, queue: true, like: true },
  // metadata: base impl reads MediaSession; provider only supplies DOM FALLBACK selectors
  dom: {
    title: ["ytmusic-player-bar .title"],
    byline: ["ytmusic-player-bar .byline"],
    art: ["ytmusic-player-bar img.image", "ytmusic-player-bar img"],
    next: ["ytmusic-player-bar .next-button"],     // transport — the fragile bit
    prev: ["ytmusic-player-bar .previous-button"],
    // …like/shuffle/repeat/queue selectors, all optional
  },
  // optional overrides only where the base impl can't cope
}
```

`content.js` becomes a thin shell: pick the active provider, then delegate. A **base
provider** implements everything generic (MediaSession metadata, media-element transport
+ position); per-provider config/overrides fill the gaps. **Build it for two providers,
not five** — the seam generalizes once it survives a real second provider; don't
speculatively abstract for providers you haven't built.

### 2. Metadata: the layered, stable-first resolver — **SHIPPED (commit 26ab36d)**

Per field, take the first non-null from **most-stable to least**:

1. **MediaSession** (`mediasession.js`, `world:"MAIN"` → `postMessage` → `content.js`):
   title / artist / album / artwork / playbackState. The site maintains this for OS media
   controls, so it's stable *and* identical across providers.
2. **Media element** (`<video>`/`<audio>`): currentTime / duration / paused / volume — a
   DOM *API*, not site classes.
3. **Semantic / ARIA** (`[aria-label]`, `role=`, stable ids, `data-*`): survives restyles.
4. **CSS classes** (provider `dom` config): last resort, and the thing the remote config
   can hot-fix.

This is the same abstraction that enables multi-provider — do it once, get both.

### 3. Transport — the genuinely fragile bit, isolated

MediaSession can't drive playback, so:
- **play / pause / seek** → the media element (`.play()`, `.pause()`, `.currentTime`) —
  generic, low-fragility.
- **next / prev** (and like/shuffle/repeat) → per-provider DOM-button `.click()` from the
  provider `dom` config. This is the one unavoidable fragile surface; keeping it in config
  means it's small, per-provider, and **hot-fixable via the remote config** (§5) without
  an extension release. Capabilities flags let the UI disable controls a provider can't do.

### 4. Audio capture + a silence detector (graceful degradation)

Capture is already provider-agnostic and works on DRM audio. **Add a zero-FFT detector**:
if the FFT is all-zeros for ~N seconds while the page reports "playing," surface a toast
("this site's audio can't be visualized") instead of a silently frozen visualizer. This
gracefully handles any future provider where protected audio does *not* pass capture —
the one residual EME risk the research flagged as "likely fine, must test per service."

### 5. Remote selector config — plain GitHub raw (the hot-fix channel) — **SHIPPED**

Decouples "site changed its DOM" from "user must wait for a store update."

- **Host:** `raw.githubusercontent.com/sujeet100/NeoAmp/main/selectors.json` — the config
  lives in this repo, so maintaining it is just **edit `selectors.json` + commit + push**;
  no deploy/purge/tag step. raw has only a **~5-min cache**, so a push is live almost
  immediately. (We deliberately did NOT use jsDelivr: its `@main` CDN copy lingers ~12h,
  so a fast update would need a purge call = the deploy overhead we're avoiding. raw's
  60-req/hr/IP limit is irrelevant at our ~6h fetch cadence, and the cache + bundled
  defaults below mean a rare failed fetch never matters — so no CDN/fallback is needed.)
- **Fetch from the service worker**, NOT the content script: content-script `fetch` is
  bound by the *page's* CSP (`connect-src`) — YTM would block GitHub; the SW's fetch is
  governed by `host_permissions` instead. Add `https://raw.githubusercontent.com/*` to
  `host_permissions`.
- **Pattern:** bundle a default `selectors.json` in the extension (must work offline); SW
  fetches on install + a `chrome.alarms` interval (hours, not per page load), validates the
  shape + `version`, caches to `chrome.storage.local` with a timestamp; content reads
  merged config (valid-remote-else-bundled). **Never break if the CDN is down.**
- It's **data, not code** → compliant with MV3's remote-code ban.
- **Schema sketch:**
  ```json
  { "version": 3, "providers": {
      "music.youtube.com": { "title": ["…"], "next": ["…"], "…": ["…"] },
      "open.spotify.com":   { "next": ["…"], "prev": ["…"] } } }
  ```

## Fragility strategy (recap)

- **Stable-first, not redundant-CSS.** Two CSS selectors fail together on a redesign;
  diverse-source layers (MediaSession/media-element/ARIA/CSS) fail independently.
- **Detection > redundancy.** A startup self-test + the silence detector tell you *when*
  a provider broke (kills backlog item B2.6 "silent failure"), which beats a second guess.
- **Hot-fix channel.** Remote config patches selectors between releases.

## Roadmap

**Shipped (Spotify is a fully working 2nd provider, all live-verified via `tools/cdp-eval.mjs`):**
- [x] Audio capture on Spotify — DRM does NOT block tab audio (EQ + viz work).
- [x] MediaSession metadata backbone (`mediasession.js`, `world:"MAIN"` → `readTrack` prefers it).
- [x] Spotify injection (manifest matches / host_permissions / WAR / context menu).
- [x] Transport: play/pause, next, prev, shuffle, repeat — per-provider `PROVIDERS` registry.
- [x] **Volume** via the offscreen master gain (provider-agnostic; works w/o a media element).
- [x] **Seek** on Spotify — drives its `playback-progressbar` `<input type=range>` (React-set,
      ms-scaled); position read from `playback-position/duration` text. Verified 3:21→0:45.
- [x] **Like** → matches the save toggle's stable `aria-checked` (its aria-label flips
      "Add to Liked Songs" ⇄ "Add to playlist"); heart LED reflects saved state.
- [x] **Queue mirror** — Spotify "Next in queue" `li[role=row]` rows; `ensureQueueOpen()`
      opens its panel on demand; double-click plays via the row's `play-button`.
- [x] **Capability gating** — `dislike` hidden on Spotify; **LIB focuses Spotify's own
      search box** (in-app library is YTM-only); no YTM-specific copy leaks.
- [x] **Remote selector config** — `selectors.json` (GitHub raw, ~5-min edit+push), layered
      over bundled defaults; cached in storage. (Repo must be PUBLIC for the channel to fire.)

**Pending (next sessions):**
- [ ] **In-app Spotify search RESULTS** — today LIB only focuses Spotify's own search box;
      showing results inside NeoAmp's library window needs scraping Spotify's search DOM.
- [ ] **Silence / zero-FFT detector** — if a provider's audio ever doesn't pass capture,
      toast instead of a frozen viz (graceful degrade for future EME providers).
- [ ] **Provider adapter FILE-split** — the inline `content.js` `PROVIDERS` registry → a
      `providers/*.js` base + per-provider modules. Pure refactor; low urgency.
- [ ] **Self-test on load** → surface scrape breakage (backlog B2.6).
- [ ] More providers: **plain YouTube** (cheapest, reuses code), **Bandcamp** (DRM-free,
      cleanest). SoundCloud/Deezer/Tidal have weak MediaSession (more fragile).

## References (verification pass, 2026-06-20)

- tabCapture mutes tab audio until reconnected (not DRM): <https://developer.chrome.com/docs/extensions/reference/api/tabCapture>
- `captureStream()` throws on EME (different API; we don't use it): <https://developer.chrome.com/blog/capture-stream>
- Chrome allows capturing **audio** from an EME element (video is the protected surface): <https://bugzilla.mozilla.org/show_bug.cgi?id=1331763>
- DRM = protected video compositor surface; audio routes normally: <https://renderlog.in/blog/drm-screen-capture-jiohotstar/>
- `world:"MAIN"` content scripts + isolated-world separation: <https://developer.chrome.com/docs/extensions/reference/manifest/content-scripts>, <https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts>
- Media Session is read-only for control (action handlers fired by UA): <https://www.w3.org/TR/mediasession/>, <https://web.dev/articles/media-session>
- MV3 remote-code ban excludes JSON/data: <https://developer.chrome.com/docs/extensions/develop/migrate/remote-hosted-code>
- SW cross-origin fetch needs host_permissions, bypasses page CSP/CORS: <https://developer.chrome.com/docs/extensions/develop/concepts/network-requests>
- GitHub unauth rate limit (raw downloads, 60/hr/IP): <https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api>, <https://github.blog/changelog/2025-05-08-updated-rate-limits-for-unauthenticated-requests/>
- jsDelivr caching / purge: <https://github.com/jsdelivr/jsdelivr/issues/18121>, <https://www.jsdelivr.com/tools/purge>
