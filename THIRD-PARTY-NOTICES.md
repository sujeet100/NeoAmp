# Third-party notices

NeoAmp bundles and builds on third-party work. This file lists everything we ship
that isn't our own code, its author, and its license. NeoAmp's own code is MIT (see
[LICENSE](./LICENSE)); the components below retain their own licenses.

If you redistribute NeoAmp (including publishing to the Chrome Web Store), you are
responsible for complying with each of these.

---

## Code

### Butterchurn — MIT
- **What:** WebGL MilkDrop visualizer engine + preset packs.
- **Files:** `vendor/butterchurn.min.js`, `vendor/butterchurnPresets.min.js`,
  `vendor/butterchurnPresetsExtra.min.js`, `vendor/butterchurnPresetsExtra2.min.js`
- **Author:** Jordan Berg ([@jberg](https://github.com/jberg)) and contributors.
- **Source / license:** <https://github.com/jberg/butterchurn> (MIT).
- **Action item:** add a copy of Butterchurn's `LICENSE` next to the vendored files
  (e.g. `vendor/butterchurn-LICENSE.txt`) — MIT requires the copyright notice to
  travel with the code.

### Webamp (derived) — MIT
- **What:** `wsz.js` reproduces the sprite geometry and rendering approach for
  classic Winamp `.wsz` skins. The sprite rectangles and main-window layout are
  derived from Webamp's `skinSprites.ts` and `css/main-window.css` (see the header
  comment in `wsz.js`).
- **Author:** Jordan Eldredge ([@captbaritone](https://github.com/captbaritone))
  and contributors.
- **Source / license:** <https://github.com/captbaritone/webamp> (MIT).
- **Action item:** because this is *derived* code, keep Webamp's copyright +
  attribution in the `wsz.js` header (already present) and consider adding Webamp's
  MIT text to this file.

---

## Fonts (SIL Open Font License 1.1)

- **VT323** by Peter Hull — `fonts/VT323-Regular.ttf`, license `fonts/OFL.txt`.
- **Silkscreen** by Jason Kottke — `fonts/Silkscreen-Bold.ttf`, license
  `fonts/Silkscreen-OFL.txt`.

Both are redistributable under the OFL; the license files are already bundled.

---

## Winamp skins  <a id="bundled-winamp-skins"></a>

NeoAmp bundles **exactly one** Winamp skin — the default base skin — and loads any
others **on demand** without redistributing them.

### `vendor/skins/base-2.91.wsz` (bundled default)

This is the default/base Winamp skin (Nullsoft / Winamp artwork). It is **not**
covered by NeoAmp's MIT license. We bundle it for the same reason — and on the same
basis — that [Webamp](https://github.com/captbaritone/webamp) bundles it: it's the one
skin the player needs to render an authentic look out of the box, and Webamp's own
README discloses (rather than licenses) it — *"the Winamp name, interface … are
property of Nullsoft,"* with only the **code** under MIT. NeoAmp takes the same
posture: the base skin is Nullsoft/Winamp artwork shipped as the functional default,
not relicensed by us; NeoAmp's own branding ("NeoAmp" title plate) is overlaid on it
so the product is clearly identified as NeoAmp, not Winamp.

### Other skins — loaded at runtime, never redistributed

NeoAmp does **not** ship any community/third-party skins. The "🎨 Get more skins"
menu item opens the [Winamp Skin Museum](https://skins.webamp.org/) in a new tab;
the user downloads a `.wsz` and drops it on NeoAmp (or uses "＋ Load skin…"), which
stores it **locally** in their own profile. This mirrors the Museum's own model
(*viewing/loading*, not *redistributing*) and keeps this repository free of skin
artwork we have no license to redistribute.

> **Why not auto-fetch from the Museum?** It was considered. The Museum's endpoints
> aren't hotlinkable from an extension (the per-md5 download URL redirect-loops; the
> CDN returns 403), it's keyed by exact md5 (our copies may not match), and silently
> hammering a hobby CDN is poor etiquette. User-mediated download + drag-drop is the
> robust, courteous path. (See the project history / `README.md`.)

This is why classic skins were historically shared freely yet still carry each
author's own (often unstated) copyright — so NeoAmp loads them but does not ship them.

---

## Inspiration (no code reused)

- **MilkDrop** by Ryan Geiss — preset format & visual lineage.
- **Winamp** (Nullsoft / Llama Group) — player UI & `.wsz` format.
- **Windows Media Player** (Microsoft) — the Alchemy / Battery / Ambience
  visualizers we recreate as Butterchurn presets, from observation of the originals.

*Winamp, Nullsoft, Windows Media Player, MilkDrop, YouTube Music, and Spotify are
trademarks of their respective owners. NeoAmp is an unaffiliated fan project and
reproduces only the visual character of these tools, not their proprietary code.*
