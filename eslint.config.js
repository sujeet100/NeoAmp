// ESLint flat config — SECURITY-focused (not a style linter; Prettier owns formatting).
// The point is to catch the risk patterns that matter for an MV3 extension that scrapes
// untrusted page DOM and bridges several contexts: HTML-injection sinks, eval, javascript:
// URLs, unsafe regex. Run: `npm run lint`. CI promotes the eval-class rules to hard errors;
// the pervasive (and reviewed) innerHTML-helper pattern is a WARNING so it surfaces without
// blocking — promote `no-unsanitized/*` to "error" once the existing sinks are triaged.
import globals from "globals";
import nounsanitized from "eslint-plugin-no-unsanitized";
import security from "eslint-plugin-security";

// escapeHtml() (winamp-core.js) is our HTML escaper — tell no-unsanitized it sanitizes, so
// `innerHTML = '...' + escapeHtml(x)` is not falsely flagged.
const NO_UNSANITIZED_OPTS = { escape: { methods: ["escapeHtml"] } };

export default [
  { ignores: ["vendor/**", "dist/**", "node_modules/**"] },

  // Browser-extension scripts: content scripts share one global scope (NOT ES modules),
  // so kit.js's top-level vars become globals the family files use — hence sourceType:script
  // and no-undef left off (it would flood on the intentional shared globals).
  {
    files: ["**/*.js"],
    ignores: ["tools/**", "eslint.config.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "script",
      globals: { ...globals.browser, ...globals.webextensions, ...globals.serviceworker },
    },
    plugins: { "no-unsanitized": nounsanitized, security },
    rules: {
      // --- HTML injection sinks (innerHTML / insertAdjacentHTML / document.write) ---
      "no-unsanitized/property": ["warn", NO_UNSANITIZED_OPTS],
      "no-unsanitized/method": ["warn", NO_UNSANITIZED_OPTS],
      // --- code execution: these should NEVER appear -> hard errors ---
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-script-url": "error", // javascript: URLs (href/src injection)
      "security/detect-eval-with-expression": "error",
      // --- regex / misc (warn: surface, don't block) ---
      "security/detect-non-literal-regexp": "warn",
      "security/detect-unsafe-regex": "warn",
    },
  },

  // Node ESM tooling (dev-only: self-render, release packager, test runner).
  {
    files: ["tools/**/*.mjs", "eslint.config.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: { ...globals.node },
    },
    plugins: { security },
    rules: {
      "no-eval": "error",
      "no-implied-eval": "error",
      "security/detect-child-process": "warn", // spawn/exec in the dev tooling
      "security/detect-non-literal-fs-filename": "off", // dev tooling reads dynamic paths by design
    },
  },
];
