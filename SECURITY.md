# Security policy

## Reporting a vulnerability

Please **do not** open a public issue for security problems. Instead, report
privately via GitHub's **"Report a vulnerability"** (Security → Advisories) on this
repository, or email the maintainer listed in the repo profile.

Include: what you found, how to reproduce it, and the potential impact. We'll
acknowledge within a reasonable time and keep you posted on a fix.

## Scope & threat model

NeoAmp is a client-only MV3 extension. Things worth scrutiny:

- **Message passing** between the content script, service worker, offscreen document,
  and the sandboxed `viz.html` iframe — messages should validate `event.source` /
  `event.origin` / `event.data` before acting.
- **The sandboxed iframe** runs Butterchurn with `unsafe-eval`. Preset equations are
  compiled with `new Function`; presets are bundled (no remote code), but
  contributions that add presets are effectively code and should be reviewed as such.
- **`selectors.json`** is fetched from GitHub raw at runtime. It contains only CSS
  selectors and is used to query the DOM, never `eval`'d. A bundled copy is the
  fallback.
- **No remote code execution paths** — MV3 forbids remote code, and NeoAmp vendors
  all libraries locally. Keep it that way.

## Not in scope

- Issues in third-party dependencies (report upstream: Butterchurn, Webamp).
- The streaming sites themselves (YouTube Music, Spotify).
