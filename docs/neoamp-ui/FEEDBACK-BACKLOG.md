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

## PENDING — prioritized (next sessions)

**Multi-provider follow-ups:**
- In-app **Spotify search RESULTS** — today LIB only focuses Spotify's own search box; showing
  results in NeoAmp's library window needs scraping Spotify's search DOM.
- **Silence / zero-FFT detector** — toast (not a frozen viz) if a provider's audio doesn't pass
  capture (graceful degrade for future EME providers).
- Provider adapter **file-split** (`content.js` `PROVIDERS` → `providers/*.js`); pure refactor.
- More providers: **plain YouTube** (cheap, reuses code), **Bandcamp** (DRM-free).

**Player-UI features still wanted (from section B below):**
- **Lyrics window** (B3) — scrolling Winamp-style lyrics pane (both YTM + Spotify have lyrics).
- **Mute button** + numeric volume / seek-position tooltip (B3).
- **Windowshade** (double-click titlebar to collapse) on all windows (B3).
- Clear **"EQ / capture active" indicator** (B3).
- **B2.2** a "this is now your player" moment (NeoAmp's controls overlay the site's own bar).
- **B2.6** silent DOM-scrape failures → a **self-test / health signal** on load.
- **B2.7** perf (FFT relay → AudioWorklet) + multi-tab robustness.
- Real in-app **playlist management** (drag / remove) — descoped; queue mgmt stays in the provider.

**Notes:** kbps stays dashed (not exposed by YTM/Spotify). The remote-config channel needs the
GitHub repo to be **PUBLIC** to fire (else it silently uses bundled defaults — harmless).

---

## A. Open visual findings (screenshot-driven — do these first)

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
- **First-run / onboarding** (one-time toast: "NeoAmp running — ⇧V or click the N icon")
  + an in-UI **keyboard-shortcut reference** (the Z/X/C/V/B keys are undiscoverable).
- **Mute button**; numeric volume + seek-position tooltip.
- **Real playlist management** (reorder / remove / drag-drop) — today it's a read-only
  mirror of YTM's queue with two dead buttons.
- **Lyrics window** (YTM has lyrics; a scrolling Winamp-style lyrics pane fits the nostalgia).
- **Windowshade** (double-click titlebar to collapse) on all windows.
- **Clear "EQ/capture active" indicator** — not always obvious whether the EQ is engaged.
- (Carry-over) **kHz readout** wiring from the EQ AudioContext.

---

## C. Suggested order for the next session
1. A1 (label contrast) + A2 (retro LED) — quick, high visual impact, finishes the theming work.
2. B2.4 kHz/kbps + B2.3 REM/SEL — remove the "looks broken/unfinished" cues.
3. B3 onboarding toast + shortcuts reference + B2.1 launch discoverability.
4. B2.5 accessibility pass (roles/tabindex/aria-pressed/focus).
5. Bigger: lyrics, playlist management, perf/AudioWorklet, multi-tab robustness.
