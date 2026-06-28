# NeoAmp — Chrome Web Store listing kit

Everything needed to submit NeoAmp to the Chrome Web Store: copy, permission
justifications, privacy answers, and the visual assets in this folder. Paste the
sections below into the Developer Dashboard fields of the same name.

> **Note on the screenshots:** shots 1–4 are captured **live on YouTube Music** with the
> real player + visualizer running, in the **Winamp 5.5 Classified** skin. The now-playing
> track is a low-profile YouTube upload, shown only to picture the UI in context (no
> commercial cover art is featured). Shot 5 (the skins montage) is a headless render with
> **synthetic audio** and a **fictional track name** ("Neon Tide — Lumin"). If you add a
> **promo video** (optional YouTube link), use copyright-free audio — YouTube Audio Library,
> Pixabay Music, Free Music Archive (CC0), or incompetech (CC-BY). NCS works too but requires
> crediting.

---

## Store listing fields

**Item name** (45 char max)

```
NeoAmp — Music Visualizer
```

**Summary / short description** (132 char max)

```
A Winamp-style player with a real EQ + WMP/MilkDrop music visualizations, overlaid on YouTube Music and Spotify.
```

**Category:** Entertainment (alternative: Fun)
**Language:** English

**Detailed description**

```
NeoAmp brings the late-90s/early-2000s desktop music vibe back to the web: a
floating, skinnable Winamp-style player and full-screen MilkDrop visualizations,
layered right over YouTube Music and Spotify.

◢◤ A REAL player, not a skin
• Draggable, magnetic, windowed UI — main window, playlist, media library, lyrics.
• Real .wsz Winamp skins plus built-in themes (Classic Green, Amber, Ice Blue,
  Champagne Gold, Freaky Magenta) — switch instantly.
• Classic keyboard shortcuts (Z X C V B, space, arrows) and windowshade.

◢◤ A REAL 10-band equalizer
• Not a fake overlay — NeoAmp captures the tab's audio and replays an EQ'd copy,
  so the equalizer actually shapes what you hear. Preamp, presets, per-band gain.

◢◤ The visualizers
• The full Butterchurn / MilkDrop preset library (hundreds of community presets).
• Plus hand-authored recreations of the classic Windows Media Player visualizers —
  the Alchemy, Battery, and Ambience families — driven by your live audio.
• Per-family shuffle that cross-dissolves between scenes.

◢◤ Works across sites
• YouTube Music and Spotify today, with the same player + EQ + visuals on both.

NeoAmp collects no data, shows no ads, and runs entirely in your browser.
```

---

## Privacy & permissions (Dashboard → Privacy practices)

**Single purpose**

```
Overlay a Winamp-style music player, a real equalizer, and music visualizations
on supported streaming sites (YouTube Music, Spotify).
```

**Permission justifications** (one per requested permission)

| Permission     | Justification                                                                                                                                                                                                                                               |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tabCapture`   | Capture the current tab's audio to drive the real equalizer (NeoAmp replays an EQ-processed copy so the EQ shapes what you hear) and to compute the visualizer's audio spectrum. Started only by an explicit user action (toolbar click / menu / shortcut). |
| `offscreen`    | MV3 service workers can't run audio. The captured audio's `AudioContext` + EQ filter graph + playback live in an offscreen document.                                                                                                                        |
| `storage`      | Persist user preferences locally: chosen skin, window layout, EQ settings, volume/mute, zoom. No data leaves the device.                                                                                                                                    |
| `activeTab`    | Act on the tab where the user invoked NeoAmp (raise the player, read now-playing).                                                                                                                                                                          |
| `contextMenus` | Add a right-click "Open NeoAmp player" entry — a reliable user-gesture entry point that `tabCapture` requires (a page button can't carry the gesture).                                                                                                      |
| `alarms`       | Periodically (~6h) refresh the small selector-config file so a site markup change can be hot-fixed without an extension update.                                                                                                                             |

**Host permission justifications**

| Host                                                        | Justification                                                                                                                                                              |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `https://music.youtube.com/*`, `https://open.spotify.com/*` | The supported streaming sites NeoAmp overlays its player/EQ/visualizer on.                                                                                                 |
| `https://raw.githubusercontent.com/*`                       | Fetch a small JSON **config of CSS selectors** (`selectors.json`) so a site DOM change can be hot-fixed without a new release. It is **data, not code** — never evaluated. |

**Remote code:** **No.** All libraries (Butterchurn + preset packs) are vendored in the
package. The only network fetch is the read-only `selectors.json` data file above; it is
parsed as JSON and used to pick DOM selectors, never executed.

**Data usage disclosures** (check these in the dashboard)

- Does NOT collect or transmit: personally identifiable info, health, financial, auth,
  personal communications, location, web history, or user activity.
- NeoAmp reads now-playing metadata and the tab's audio **locally** to render the UI and
  visuals; nothing is sent to any server, no analytics, no ads, no third-party sharing.
- Link to privacy policy: `PRIVACY.md` in the repo (host a public URL for submission).

---

## Visual assets (in this folder)

**Screenshots** (`screenshots/`, 1280×800 PNG — Web Store allows up to 5). **Recommended 5**
below: the first three are captured **live on music.youtube.com** in the real **Winamp 5.5
Classified** `.wsz` skin (the strongest leads — real player + real audio-driven visuals); the
last two are labelled montages that show breadth.

1. `01-hero.png` — the full NeoAmp window stack (player · playlist · media library) docked
   beside a live Alchemy radial-burst visualizer, over YouTube Music. **[live]**
2. `02-player-eq.png` — close-up of the main window + the **real 10-band equalizer** with its
   preset menu open (Flat, Bass Boost, Rock, Classical, …). **[live]**
3. `03-viz-flower.png` — the **Alchemy (Pastel)** WMP recreation: the green/magenta anemone
   bloom with glowing orbs and a colour-tether. **[live]**
4. `06-visualizations.png` — labelled montage of six **distinct** visualizers: Alchemy (Pastel)
   kaleidoscope, Dance of the Freaky Circles (fiery rings), Ambience Water (blue lens bloom), Battery
   strawberryaid (red burst), Battery sepiaswirl (sepia gear-rosette), Battery the world (grey spiral).
5. `05-skins.png` — five **real `.wsz` skins** side by side — Winamp Classic, Winamp 5.5
   Classified, Bento, Sony Esprit, Nucleo NLog — plus a "+ any .wsz" (Skin Museum) tile.

**Also in the folder** (swap in to taste): `04-viz-kaleido.png` (a live full-bleed Alchemy
kaleidoscope) and `skins-themes-alt.png` (the built-in colour themes — Classic Green · Amber ·
Ice Blue · Freaky Magenta).

> The real `.wsz` skin files (Classified, Bento, Sony, Nucleo) are the authors' artwork and are
> **not committed** — only the bundled Winamp Classic base skin ships. To regenerate any
> headless render in a given skin, load your own `.wsz` via
> `WSZ_PATH=<repo-relative.wsz> WSZ_NAME="…" node tools/render-neoamp.mjs`. Viz montage frames
> come from `node tools/selfrender.mjs "<Preset Name>"`.

**Promo tiles** (`promo/`):

- `promo-small-440x280.png` — small promo tile.
- `promo-marquee-1400x560.png` — marquee promo tile (optional; for featuring).

**Icon:** `icons/icon128.png` (already in the package; 16/32/48/128 declared in the manifest).

**Alternate skin renders** (chrome-free headless `01-hero` / `02-player` / `03-equalizer` —
hero, full main window + now-playing + playlist, and skinned EQ — swap in for a cleaner framing
than the live shots):

- `screenshots/classified/` — in the **Winamp 5.5 Classified** skin.
- `screenshots/classic/` — the same three in the bundled **Winamp Classic** (base-2.91) skin.

---

## Pre-submission checklist

- [ ] `npm run check` passes (lint + tests).
- [ ] `npm run release` → `dist/neoamp-<version>.zip` (trims dev files; no minification).
- [ ] Bump `version` in `manifest.json` (and `package.json`) for each upload.
- [ ] Host `PRIVACY.md` at a public URL and link it in the listing.
- [ ] Confirm no `console` debug spam (info logs are gated behind a debug flag).
- [ ] If the remote `selectors.json` channel is desired, the GitHub repo must be public
      (otherwise it silently falls back to bundled defaults — harmless).
