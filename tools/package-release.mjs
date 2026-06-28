/* Package a Chrome Web Store / GitHub-release zip — `npm run release`.
 *
 * Ships ONLY what the extension needs at runtime. Dev-only files (docs, tools,
 * tests, configs, the repo's own dotfiles, node_modules) are excluded so the
 * uploaded package is lean and contains no source the store reviewer doesn't need.
 * This is trimming, NOT minifying — the shipped JS stays readable (the Web Store
 * bans obfuscation; minification buys nothing for a locally-loaded extension).
 *
 * Output: dist/neoamp-<version>.zip  (version read from manifest.json).
 */
import { readFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(readFileSync(join(ROOT, "manifest.json"), "utf8"));
const version = manifest.version;
const outDir = join(ROOT, "dist");
const zipName = `neoamp-${version}.zip`;
const zipPath = join(outDir, zipName);

// Runtime payload. List files/dirs explicitly (allowlist) rather than excluding —
// safer: a new dev file never leaks into a release by accident.
const INCLUDE = [
  "manifest.json",
  "content.js",
  "sw.js",
  "offscreen.html",
  "offscreen.js",
  "mediasession.js",
  "winamp-core.js",
  "winamp-window-manager.js",
  "winamp-layout-zoom.js",
  "winamp-skins.js",
  "winamp-windows-build.js",
  "winamp-library-lyrics.js",
  "winamp-transport-audio.js",
  "winamp-bootstrap.js",
  "winamp.css",
  "wsz.js",
  "skins.js",
  "overlay.css",
  "viz.html",
  "viz.js",
  "presets",
  "vendor",
  "fonts",
  "icons",
];

mkdirSync(outDir, { recursive: true });
if (existsSync(zipPath)) rmSync(zipPath);

// Verify every include exists before zipping (fail loud on a typo / moved file).
const missing = INCLUDE.filter((p) => !existsSync(join(ROOT, p)));
if (missing.length) {
  console.error("✗ release aborted — missing files:\n  " + missing.join("\n  "));
  process.exit(1);
}

// -x excludes junk that can hide inside included dirs.
const args = ["-r", "-q", zipPath, ...INCLUDE, "-x", "*.DS_Store", "-x", "__MACOSX/*"];
execFileSync("zip", args, { cwd: ROOT, stdio: "inherit" });

const sizeMB = (readFileSync(zipPath).length / 1024 / 1024).toFixed(2);
console.log(`\n✓ packaged dist/${zipName}  (${sizeMB} MB)`);
console.log("  Upload at https://chrome.google.com/webstore/devconsole");
