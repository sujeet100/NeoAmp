# NeoAmp — End-user feedback & backlog

Captured 2026-06-20 for a **fresh work session**. This is the prioritized to-do list
coming out of a critical end-user review + a round of screenshot-driven findings across
five skins (Sony Esprit, Winamp Classic, Winamp3/5 Classified, TopazAmp, Bento).

Read `HANDOFF.md` first for architecture. Verify UI with `node tools/render-neoamp.mjs`
(supports `SKIN=<name>`); audio/EQ/viz need a live reload.

---

## ✅ Session status — 2026-06-20 (session 2)

**Implemented + committed this session:**
- **A1 / A2** (contrast-derived key labels, flat pixel LED) — shipped earlier (commit `fdce077`).
- **B2.4 kHz/kbps** — real kHz wired from the offscreen `AudioContext.sampleRate`
  (offscreen → sw → content → UI, carried on each track tick so it can't race the UI build);
  both the procedural NP strip and the skinned wsz box. kbps shows a **dash** (YTM doesn't
  expose stream bitrate) instead of a blank box.
- **B2.1 + B3 launcher / onboarding / shortcuts** — re-enabled the persistent in-page ◢◤
  launcher (+ SPA re-add observer); one-time onboarding card (persisted flag); gear ⚙ →
  **Keyboard shortcuts** overlay.
- **B2.5 accessibility** — `role=button` / `tabindex` / `aria-pressed` / `aria-label` on the
  div controls (synced via observers), global Enter/Space activation, `:focus-visible` rings
  (incl. the EQ faders), `aria-expanded` on menu triggers, library rows playable by keyboard.
  Canvas-skin hit-tests can't carry per-control ARIA — the transport shortcuts cover them.
- **Copy cleanup** — the context menu, Shift+V hint, onboarding, and the ⌘⇧E command now say
  **"Open NeoAmp player"** (dropped the "Toggle … + EQ (capture this tab's audio)" jargon).
  **Shift+V reframed as CLOSE-only**: a page script can't start `tabCapture`, so ⇧V never
  opened the player — we no longer advertise it as a launcher (it closes when running, else
  shows the how-to-open hint).

**Decision reversal — B2.3 REM/SEL: REMOVED, not implemented.** A real REM/SEL was built
(drive YTM's per-row ⋮ → "Remove from queue", click-to-select rows) but it's too fragile:
the queue usually isn't in the DOM until "Up Next" is open, YTM's markup drifts, and an
adversarial review found the menu-button selector could resolve to the *play* button. Per
the user, the playlist is now a clean **read-only mirror** of YTM's queue — the whole footer
button row (REM/SEL **and** the redundant ADD/MISC) was removed, leaving just the item count
+ total time; double-click a row to play. Search lives in the Library window; queue
management stays in YTM.

**Session 3 (2026-06-20) — MULTI-PROVIDER + Spotify** (full detail: `MULTI-PROVIDER-DESIGN.md`).
NeoAmp now runs on **Spotify** too, all selectors **live-verified via `tools/cdp-eval.mjs`**
(headful Chrome + CDP, not guessed): provider-agnostic metadata (MediaSession `world:MAIN`),
transport, volume (offscreen master gain), seek (Spotify's range input — verified 3:21→0:45),
like (stable `aria-checked` → LED), queue mirror (double-click plays via the row's play-button),
capability gating (dislike hidden; LIB focuses Spotify's own search box), GitHub-raw remote
selector-config hot-fix channel (`selectors.json`).

---

## ✅ Session status — 2026-06-20 (session 4)

Big player-UI + provider session. **All committed + pushed to `main`.** Selectors live-verified
via `tools/cdp-eval.mjs` against logged-in YTM + Spotify; UI verified via `tools/render-neoamp.mjs`.

**Features shipped (all providers per the new CLAUDE.md principle 0):**
- **Lyrics window** (`LYR` key) — scrolling, centered, themed, free-floating skinned window.
  Data path: `readLyrics()` handles BOTH shapes — Spotify per-line `[data-testid='lyrics-line']`
  (38 lines verified) and YTM's one `\n`-separated `ytmusic-description-shelf-renderer
  yt-formatted-string.description` block (58 lines verified). **Per-track cached** so it survives
  the provider's pane closing. **Auto-opens** the provider's lyrics pane when the window is shown:
  Spotify clicks the lyrics button; YTM sets the Polymer `tp-yt-paper-tabs.selected` index (a
  synthetic `.click()` does NOT switch paper-tabs — the `.selected` property does). Queue items
  stay in YTM's DOM under the inactive tab, so the mirror is unaffected.
- **Spotify in-app search RESULTS** — `search()` now dispatches to `searchSpotify()`: types into
  Spotify's box (SPA route, no reload — verified), clicks the Songs filter chip, scrapes
  `[data-testid='tracklist-row']` (title `a[href*='/track/']`, artist `a[href*='/artist/']`,
  play `button[aria-label^='Play']`), caches row refs, plays by index. `capabilities.library` on.
- **Spotify queue-disappears-on-close bug FIXED** — `queueRow` scoped to `ul[role='treegrid']
  li[role='row']` (was a bare `li[role='row']` that also matched a stray row, collapsing the
  mirror to 1 wrong item when the panel closed). Closed → no treegrid → cache keeps the mirror.
- **Mute** — speaker key in the NP strip (universal), `M` shortcut, persisted; folds into the
  existing volume relay (gain 0). **Numeric volume + seek position**: procedural readout/tooltip;
  classic `.wsz` skins flash `VOLUME: NN%` in the title line + show the scrub-target time.
- **Windowshade** — double-click any titlebar to collapse to the titlebar; persisted (`shaded`
  flag + expanded height restored on un-shade). Enabled on all windows.
- **NP-strip redesign** — per-skin **themed keys** (derived from the skin's panel colour + accent,
  never flat grey), **hard-edged pixel LEDs** (no bloom), VIS/LIB/LYR fused into a **segmented
  rack** with corner LEDs. Settled on a **1-row strip + a scrolling marquee title** (long names
  scroll instead of clipping — the Winamp way). Lit heart/dislike/mute are flat pixel (no glow).
- **Settings moved off the strip** → opens on **right-click of ANY window** (menu pops at the
  cursor, on top, clickable) AND on **clicking the skin's top-left logo** (the authentic Winamp
  system-menu spot). Gear button removed; "Right-click — settings" added to the shortcuts list.
- **Close-button bug FIXED** — closing VIS/LIB/LYR via the window ✕ now clears its NP-strip toggle
  (unified `syncNpButtons()` reflects all toggles).
- **VIS/LIB/LYR labels** → 8px Silkscreen (native size) + softened tone (were too dark/big).

**Decision reversals:** the **"EQ/capture-active" indicator** (B3) was built then **REMOVED** —
the user found it confusing/redundant (the player only shows while capturing; EQ on/off is in the
EQ window). Raw-**sampling the skin's button sprite** for key colour was tried but **rejected** —
round-knob skins (Nucleo) sample their dark corners to grey, regressing the "looks grey" complaint;
keys are derived from the skin palette instead.

**Not yet confirmed live by the user:** the lyrics auto-open / Spotify search / queue-fix behave
correctly in the actual extension while playing (selectors are CDP-verified; full end-to-end live
play-through pending a user check).

---

## PENDING — prioritized (next sessions)

**✅ DONE in session 4 (was pending):** in-app Spotify search results · lyrics window (both
providers, auto-open) · mute + numeric volume/seek · windowshade. **Dropped:** the "EQ/capture
active" indicator (user rejected as confusing/redundant).

**Multi-provider follow-ups (still pending):**
- **Silence / zero-FFT detector** — toast (not a frozen viz) if a provider's audio doesn't pass
  capture (graceful degrade for future EME providers). *Needs a live-audio session to build/verify.*
- Provider adapter **file-split** (`content.js` `PROVIDERS` → `providers/*.js`); pure refactor.
- More providers: **plain YouTube** (cheap, reuses code), **Bandcamp** (DRM-free).
- **Lyrics v2:** time-synced highlight + auto-scroll (the window already supports `activeLine`;
  the data path currently returns plain lines). YTM/Spotify both expose synced lyrics.

**Player-UI features still wanted:**
- **B2.2** a "this is now your player" moment (NeoAmp's controls overlay the site's own bar).
- **B2.6** silent DOM-scrape failures → a **self-test / health signal** on load.
- **B2.7** perf (FFT relay → AudioWorklet) + multi-tab robustness.
- Real in-app **playlist management** (drag / remove) — descoped; queue mgmt stays in the provider.
- Classic-skin (`wsz.js` canvas) versions of the mute / capture state — procedural + NP-strip
  cover them today; only needed for full sprite-parity in classic mode.

**Notes:** kbps stays dashed (not exposed by YTM/Spotify). The remote-config channel needs the
GitHub repo to be **PUBLIC** to fire (else it silently uses bundled defaults — harmless).
**First thing next session:** have the user play a track on YTM + Spotify and confirm the lyrics
auto-open, in-app search, and queue mirror behave end-to-end in the live extension.

---

## A. Open visual findings (screenshot-driven — do these first)

> **✅ A1 + A2 DONE (and superseded by the session-4 theming pass):** key labels are
> contrast-derived (`--wa-key-fg`), LEDs are flat hard-edged pixel diodes (no bloom), and the
> keys are now fully per-skin themed from the panel palette + a segmented rack. See session 4.

### A1. Button label colour is pulling from the wrong source  ★ high
The VIS/LIB/gear key **labels** use `color: var(--pl-normal)` (the playlist *text*
colour). That:
- goes **low-contrast / invisible** on some skins (e.g. Bento — labels barely readable),
- **mismatches the skin's own button text** (Winamp5's EQ/PL/transport labels are black;
  ours render green).

**Proposed fix:** make the label colour **contrast-derived from the key face**, not the
playlist text. Compute the luminance of the sampled `--wa-btn-face` (in JS, alongside
`buttonFaceColor` in `wsz.js`) and inject a `--wa-key-fg` of near-black on light faces /
near-white on dark faces (a readable, skin-neutral label that's guaranteed visible on
every skin). Keep `--pl-normal` only as a fallback. The skin's real transport buttons are
icon-only (no text), so we can't sample a literal label colour — luminance auto-contrast
is the robust answer. (Same treatment for the gear icon fill + rate-icon "off" tint.)

### A2. The 3D LED looks too modern  ★ high
The current lit LED is a glossy radial **dome + specular highlight + soft 5px outer glow**
(`winamp.css` `.wa-np-tog.on::before`). Against the pixel-art skins it reads slick/modern,
not retro. The skins' own indicators are small **flat** colour bars/squares.

**Proposed fix:** de-modernise it — drop the specular dot and the soft glow; use a **flat,
crisp pixel LED**: a small square filled with `--wa-led-on`, a 1px darker inner edge + 1px
top-left highlight (chunky pixel bevel), and at most a tight 1–2px glow. Keep
`image-rendering: pixelated` vibe. Consider matching the skin's indicator size/shape. Keep
the skin-sampled colour (`--wa-led-on`) — only the *finish* changes (flat, not glossy).

---

## B. End-user review

### B1. Strengths to PRESERVE (don't regress these)
- **Real `.wsz` skins**, fully skin-derived chrome (keys, LEDs, fullscreen, playlist time
  all sample the loaded skin). Strong cohesion — keep extending this principle.
- **Real EQ that shapes what you hear** (tabCapture → offscreen biquads). The differentiator.
- **Faithful window feel:** floating/draggable/magnetic-dock windows + Winamp keys
  (Z/X/C/V/B, space, arrows) + persisted layout/skin/zoom/EQ.
- One-click launch (no share picker); decluttered NP strip + gear menu + zoom-to-fit.

### B2. Could be better (prioritized)
1. **Launch discoverability (#1 problem).** No on-page affordance — the in-page ◢◤ launcher
   is disabled, so a first-timer must know to pin/click the gold-N toolbar icon (hidden by
   default on Arc) or find the right-click menu. New users see nothing. → onboarding + maybe
   re-enable a subtle in-page launcher.
2. **Two competing UIs.** NeoAmp's play/like/seek overlay YTM's own player bar; no clear
   "this is now your player" moment.
3. **Half-wired controls that look finished.** Playlist **REM** ("not yet supported") and
   **SEL** (no handler) do nothing but look like the working ADD/MISC (`winamp.js` ~1160).
   Either implement or remove.
4. **Empty kbps / kHz boxes** render labeled-but-blank on every skin (`wsz.js` draws
   `st.kbps`/`st.khz`, never set). kHz IS available (EQ AudioContext `ctx.sampleRate`); kbps
   is not exposed by YTM. → show real kHz; hide or `—` the kbps.
5. **Accessibility ~absent.** Every control is a `<div>` + click handler — no `role`,
   `tabindex`, focus ring, or ARIA (only `title`); skin buttons are canvas hit-tests.
   Keyboard-only / screen-reader users can't operate it. → `role="button"`, `tabindex`,
   `aria-pressed`, focus styles, key activation.
6. **Silent failure.** DOM-scraping by CSS selectors (shuffle/repeat are "best-effort");
   when YTM changes markup, controls quietly no-op with no user signal.
7. **Single-tab fragility / perf (documented in HANDOFF §6).** Multiple YTM tabs + SW
   eviction mid-capture aren't graceful; FFT relayed offscreen→SW→content→iframe as base64
   JSON ~50fps may be heavy — consider AudioWorklet read / throttle.

### B3. Missing features a user expects
- ✅ **First-run / onboarding** + keyboard-shortcut reference — done (sessions 2 + 4; shortcuts
  now also lists "Right-click — settings").
- ✅ **Mute button** + numeric volume + seek-position — done (session 4).
- **Real playlist management** (reorder / remove / drag-drop) — STILL descoped; read-only mirror.
- ✅ **Lyrics window** (YTM + Spotify, auto-open) — done (session 4).
- ✅ **Windowshade** (double-click titlebar to collapse, all windows) — done (session 4).
- ❌ **"EQ/capture active" indicator** — built then REMOVED (user found it confusing/redundant).
- ✅ (Carry-over) **kHz readout** — done (session 2).

---

## C. Suggested order for the next session
> The session 1–4 plan (A1/A2, kHz, onboarding, a11y, **lyrics, mute, windowshade, Spotify
> search**) is **done**. What's left, roughly prioritized:
1. **Live confirm** the session-4 provider features (lyrics auto-open / Spotify search / queue) by
   actually playing a track on each site — selectors are CDP-verified but not yet end-to-end live.
2. **Silence / zero-FFT detector** (needs a live-audio session) — the last "looks-broken-silently" gap.
3. **Lyrics v2:** time-synced highlight + auto-scroll.
4. Provider adapter **file-split** + **more providers** (plain YouTube, Bandcamp).
5. Bigger: **B2.2** "this is now your player", **B2.7** perf (AudioWorklet) + multi-tab robustness,
   real playlist management.
