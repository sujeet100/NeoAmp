// ESLint flat config (v9+). Tuned for this codebase's reality, not a generic app:
// the content-script files (winamp.js, content.js, presets/*.js, …) are ES5-ish
// IIFE/<script> files that SHARE one global scope — kit.js's top-level `var`s are
// the globals the preset families use, NA/NeoAmpSkins/etc. are cross-file globals.
// So we keep eslint's recommended BUG-catchers (dupe keys, unreachable code, etc. —
// genuinely valuable across 150KB+ preset files) but disable `no-undef` (every
// cross-file global would otherwise be a false positive) and downgrade unused-vars
// to a warning. Formatting is Prettier's job, not eslint's.
import js from "@eslint/js";
import globals from "globals";

export default [
  {
    ignores: ["vendor/**", "node_modules/**", "**/*.min.js"],
  },
  js.configs.recommended,
  {
    // Browser / content-script + sandboxed-page files: classic scripts, shared scope.
    files: ["*.js", "presets/**/*.js"],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "script",
      globals: {
        ...globals.browser,
        ...globals.webextensions, // chrome.*
        butterchurn: "readonly",
        butterchurnPresets: "readonly",
      },
    },
    rules: {
      "no-undef": "off",
      "no-unused-vars": ["warn", { args: "none", caughtErrors: "none" }],
      "no-empty": ["warn", { allowEmptyCatch: true }],
      // ES5 `var` is function-scoped, so reusing `var u` across if/else-if branches is
      // a deliberate idiom here, not a bug — keep it visible as a warning, not an error.
      "no-redeclare": "warn",
      // `.hasOwnProperty()` on our own plain object literals is safe here.
      "no-prototype-builtins": "warn",
    },
  },
  {
    // Node tooling: real ES modules.
    files: ["tools/**/*.mjs", "*.mjs"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: { ...globals.node },
    },
    rules: {
      "no-unused-vars": ["warn", { args: "none", caughtErrors: "none" }],
      "no-empty": ["warn", { allowEmptyCatch: true }],
    },
  },
];
