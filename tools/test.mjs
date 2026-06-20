/* NeoAmp test runner — `npm test`.
 *
 * No browser, no framework: this mirrors the validate-before-reload workflow from
 * CLAUDE.md so CI / contributors catch the cheap failures (syntax errors, broken
 * preset builds, throwing frame_eqs) before loading the unpacked extension.
 *
 *   1. `node --check` every source .js / tools .mjs (skips vendor/ minified bundles).
 *   2. Concatenate the preset files into ONE shared global scope (mirrors the
 *      browser's shared <script> scope, where kit.js's top-level vars become the
 *      globals the family files build on), build every preset, and run each
 *      frame_eqs once with a fake audio frame.
 *
 * GLSL shaders CANNOT be validated here (Node has no WebGL) — see CLAUDE.md for the
 * in-browser shader-error hook and the headless ANGLE pre-check.
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createContext, runInContext } from "node:vm";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
let failed = 0;
const fail = (msg) => {
  console.error("  ✗ " + msg);
  failed++;
};

// ---- 1. syntax check -------------------------------------------------------
function jsFilesIn(dir, { recurse = false } = {}) {
  const abs = join(ROOT, dir);
  if (!existsSync(abs)) return [];
  return readdirSync(abs, { withFileTypes: true }).flatMap((e) => {
    if (e.isDirectory()) return recurse ? jsFilesIn(join(dir, e.name), { recurse }) : [];
    return /\.(js|mjs)$/.test(e.name) ? [join(dir, e.name)] : [];
  });
}

// everything we author, minus the vendored minified bundles
const sources = [...jsFilesIn("."), ...jsFilesIn("presets"), ...jsFilesIn("tools")].filter(
  (f) => !f.includes("vendor/")
);

console.log(`\nSyntax-checking ${sources.length} files…`);
for (const f of sources) {
  try {
    execFileSync(process.execPath, ["--check", join(ROOT, f)], { stdio: "pipe" });
  } catch (e) {
    fail(`${f}\n${(e.stderr || e.stdout || e).toString().trim()}`);
  }
}
if (!failed) console.log("  ✓ all files parse");

// ---- 2. build presets + run every frame_eqs -------------------------------
// Same order as viz.html's <script> includes: kit first (defines the shared
// factories), then each family.
const PRESET_ORDER = ["kit", "dance", "alchemy", "ambience", "battery"];
console.log(`\nBuilding presets from ${PRESET_ORDER.join(" + ")}…`);
try {
  const sandbox = {};
  sandbox.window = sandbox;
  sandbox.console = console;
  const ctx = createContext(sandbox);
  const src = PRESET_ORDER.map((n) => readFileSync(join(ROOT, "presets", n + ".js"), "utf8")).join(
    "\n;\n"
  );
  runInContext(src, ctx, { filename: "presets-concat.js" });

  const presets = sandbox.WMP_PRESETS || {};
  const names = Object.keys(presets);
  if (!names.length) fail("WMP_PRESETS is empty after building presets");

  const frame = {
    time: 2,
    frame: 120,
    bass: 1.3,
    bass_att: 1.1,
    mid: 1,
    mid_att: 1,
    treb: 1,
    treb_att: 1,
  };
  let ran = 0;
  for (const name of names) {
    const p = presets[name];
    if (typeof p.frame_eqs === "function") {
      try {
        p.frame_eqs({ ...frame });
        ran++;
      } catch (e) {
        fail(`frame_eqs threw for "${name}": ${e.message}`);
      }
    }
  }
  if (!failed) console.log(`  ✓ built ${names.length} presets, ran ${ran} frame_eqs`);
} catch (e) {
  fail(`preset build failed: ${e.stack || e.message}`);
}

// ---- result ----------------------------------------------------------------
if (failed) {
  console.error(`\n✗ ${failed} check(s) failed\n`);
  process.exit(1);
}
console.log("\n✓ all checks passed\n");
