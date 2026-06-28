# Security policy

> Like any real project, we don't claim NeoAmp is free of vulnerabilities — we claim a
> _process_: automated scanning on every change, an adversarial review, and a private way
> to report what those miss. As of the last review there are **no known vulnerabilities**.

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
- **No network requests** — NeoAmp makes no outbound requests; all code and assets are
  bundled. Per-provider DOM selectors ship in the `PROVIDERS` registry in `content.js`.
- **No remote code execution paths** — MV3 forbids remote code, and NeoAmp vendors
  all libraries locally. Keep it that way.
- **The sandboxed iframe** receives commands over a **private `MessageChannel`**
  established on a source-verified handshake (the content script shares the host page's
  window, so window-posted commands are otherwise forgeable) — see `viz.js` /
  `winamp-bootstrap.js`.

## Supported versions

Only the latest release (and `main`) is supported; fixes ship in a new release. Older
versions are not patched.

## What we do to find issues

Security checks run in CI on every push / PR (see `.github/workflows/`):

- **CodeQL** — `security-extended` JS analysis incl. DOM-XSS dataflow (`codeql.yml`).
- **ESLint** — `eslint-plugin-no-unsanitized` + `eslint-plugin-security`; `eval`/
  `javascript:`-URL patterns are hard errors (`eslint.config.js`).
- **retire.js** — scans the **vendored** Butterchurn bundle for known-vulnerable
  versions (npm audit can't see vendored files); **Dependabot** + `npm audit` cover dev
  dependencies (`ci.yml`, `.github/dependabot.yml`).
- **gitleaks** — secret scanning; **OpenSSF Scorecard** — supply-chain posture
  (`scorecard.yml`).
- A periodic **adversarial review** of the message bridges, DOM sinks, permissions, and
  the runtime selector-config fetch.

## Not in scope

- Issues in third-party dependencies (report upstream: Butterchurn, Webamp).
- The streaming sites themselves (YouTube Music, Spotify).
