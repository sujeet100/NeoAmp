# Contributing to NeoAmp

Thanks for your interest! NeoAmp is a fan project — contributions of presets,
provider support, skins, and fixes are all welcome. By participating you agree to the
[Code of Conduct](./CODE_OF_CONDUCT.md).

## Ways to contribute

1. **Author / tune visualizer presets** (`presets/*.js`) — the bulk of the work.
2. **Add or fix a streaming provider** (`content.js` `PROVIDERS` registry +
   `selectors.json`).
3. **Add a skin** — a CSS-variable theme in `skins.js` (fully ours, easiest) or a
   `.wsz` skin **that you own or that is freely licensed** (see
   [THIRD-PARTY-NOTICES.md](./THIRD-PARTY-NOTICES.md#bundled-winamp-skins)).
4. **Bug fixes / docs.**

## Project setup

There is **no build step** — NeoAmp is plain JS/CSS loaded directly by the browser.

1. Clone the repo.
2. `chrome://extensions` → enable **Developer mode** → **Load unpacked** → this folder.
3. Open <https://music.youtube.com> or <https://open.spotify.com> and play a track.
4. After editing `manifest.json`, click the extension's **reload (↻)**. After editing
   other JS/CSS, reload the extension **and** the tab.

Read **[`CLAUDE.md`](./CLAUDE.md)** before non-trivial changes — it documents the
load-bearing architecture gotchas (the sandboxed iframe, tab-capture audio path,
canvas sizing) that are easy to break.

## Validate before you open a PR

Presets are isolated, but always run the Node checks from `CLAUDE.md`:

```bash
# syntax-check everything
for f in presets/*.js viz.js content.js; do node --check "$f" || break; done

# structural + runtime check: build every preset and run each frame_eqs
node -e 'const fs=require("fs"),vm=require("vm");global.window=global;
  const cat=["kit","dance","alchemy","ambience","battery"].map(f=>fs.readFileSync("presets/"+f+".js","utf8")).join("\n;\n");
  vm.runInThisContext(cat);
  let n=0; for(const [k,p] of Object.entries(window.WMP_PRESETS)){ if(p.frame_eqs) p.frame_eqs({time:2,bass:1.3,bass_att:1.1,mid:1,treb:1,treb_att:1}); n++; }
  console.log("ok", n, "presets");'
```

GLSL can't be validated by Node — see `CLAUDE.md` for the in-browser shader-error hook
and the headless ANGLE pre-check. For visuals, you can self-render headlessly via
`node tools/selfrender.mjs` (viz) or `node tools/render-neoamp.mjs` (player UI) before
asking a human to eyeball it.

## Pull request guidelines

- **One focused change per PR.** Small commits make `git revert` easy (we've been
  burned by big rewrites — see `CLAUDE.md`).
- **Match the existing style** — `var`/function-based, ES5-ish in `presets/*.js`.
- **Every player-UI feature must work on ALL supported providers** (YouTube Music
  *and* Spotify), or be capability-gated. A feature that only works on one provider is
  not done — see `docs/neoamp-ui/MULTI-PROVIDER-DESIGN.md`.
- **Don't bundle third-party skins/assets you don't have the rights to.**
- Describe what changed and, for visual work, attach a screenshot/GIF.

## Reporting bugs

Open a GitHub issue with: the site (YTM/Spotify), browser + version, what you did,
what you expected, what happened, and any `[WMP-viz]` / `[NeoAmp]` console logs.
