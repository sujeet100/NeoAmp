# Support

NeoAmp is a free, open-source hobby project, maintained on a best-effort basis. Thanks for
using it! Here's how to get help.

## Found a bug or have a question?

Open an issue: **<https://github.com/sujeet100/NeoAmp/issues>** (search first — it may already
be reported). To help us reproduce it fast, please include:

- **Browser + version** (Chrome / Arc / Edge) and your OS.
- **Which site** you were on — YouTube Music or Spotify.
- **What you did** and **what happened** vs. what you expected.
- **Console logs**, if any — open DevTools (⌥⌘I / Ctrl-Shift-I) and copy lines prefixed
  `[NeoAmp]` (player/EQ) or `[WMP-viz]` (visualizer). For visualizer/shader errors, switch the
  console's context dropdown to the `viz.html` frame.
- A **screenshot or short screen recording** if it's a visual glitch.

## Common things

- **The player or controls stopped working after the site updated its layout.** YouTube Music /
  Spotify occasionally change their markup. NeoAmp reads most state from web standards
  (`navigator.mediaSession`, the media element), so this is rare — but if a transport control
  breaks, please file an issue naming the affected control and we'll ship a fix in the next update.
- **No audio / frozen visuals.** The visualizer and EQ need the tab's audio; make sure you
  started playback and granted capture when prompted.
- **Feature requests** are welcome as issues — note that every player-UI feature must work on
  *all* supported providers.

## Reporting a security vulnerability

**Do not** open a public issue. Report it privately — see **[SECURITY.md](./SECURITY.md)**
(GitHub Security tab → "Report a vulnerability").

## Contributing

Want to fix it yourself or add a visualizer preset? See **[CONTRIBUTING.md](./CONTRIBUTING.md)**.
This project follows the [Contributor Covenant](./CODE_OF_CONDUCT.md).
