/* NeoAmp skin registry — plug-and-play theming.
 *
 * A skin is a plain object: { id, name, vars }. `vars` maps CSS custom-property
 * names (the ones winamp.css consumes, all `--wa-*`) to values. Applying a skin
 * just sets those properties on #neoamp-root — the whole UI re-themes instantly,
 * no markup changes. The "Classic" skin needs no vars because winamp.css's
 * defaults ARE the classic green look; every other skin overrides a subset.
 *
 * TO ADD A SKIN: push another { id, name, vars } object onto NEOAMP_SKINS. Only
 * override the variables you want to change; anything omitted falls back to the
 * classic default. That's the entire contract.
 *
 * Runs in the content-script world (shared globals with content.js / winamp.js).
 */
(function () {
  "use strict";

  var NEOAMP_SKINS = [
    {
      id: "classic",
      name: "Classic Green",
      vars: {}, // CSS defaults are this skin
    },
    {
      id: "amber",
      name: "Amber Monochrome",
      vars: {
        "--wa-title-bg": "linear-gradient(180deg,#6b4a18,#3a2708 55%,#2a1d08)",
        "--wa-title-fg": "#ffcf7a",
        "--wa-logo-fg": "#ffb347",
        "--wa-lcd": "#ffb347",
        "--wa-lcd-glow": "rgba(255,179,71,0.7)",
        "--wa-accent": "#ffb347",
        "--wa-accent-glow": "rgba(255,179,71,0.6)",
        "--wa-bar-lo": "#7a4a00",
        "--wa-bar-hi": "#ffb347",
        "--wa-bar-peak": "#fff0c0",
        "--wa-thumb-bg": "linear-gradient(180deg,#ffd98a,#c47e00 55%,#7a4a00)",
      },
    },
    {
      id: "ice",
      name: "Ice Blue",
      vars: {
        "--wa-win-bg": "linear-gradient(180deg,#2c3850 0%,#1d2738 6%,#161e2c 100%)",
        "--wa-title-bg": "linear-gradient(180deg,#4f8fd8,#1f5aa0 50%,#143f78)",
        "--wa-title-fg": "#e3f1ff",
        "--wa-logo-fg": "#bfe0ff",
        "--wa-fg": "#bcd2e8",
        "--wa-lcd": "#5fd0ff",
        "--wa-lcd-glow": "rgba(95,208,255,0.7)",
        "--wa-accent": "#5fd0ff",
        "--wa-accent-glow": "rgba(95,208,255,0.6)",
        "--wa-bar-lo": "#1f5aa0",
        "--wa-bar-hi": "#5fd0ff",
        "--wa-bar-peak": "#e3f1ff",
        "--wa-thumb-bg": "linear-gradient(180deg,#cfeaff,#4f9fd8 55%,#1f5aa0)",
        "--wa-thumb-border": "#11335c",
      },
    },
    {
      // "Reference Audio Player" style — brushed champagne/gold metal with a
      // LIGHT cream screen + dark bronze readouts (inverts the classic dark-LCD
      // look, proving the skin contract handles light themes too).
      id: "gold",
      name: "Champagne Gold",
      vars: {
        "--wa-win-bg": "linear-gradient(180deg,#f3ecd6 0%,#e2d3ac 50%,#cdbb8e 100%)",
        "--wa-win-border": "#7a6535",
        "--wa-bevel-light": "rgba(255,252,238,0.85)",
        "--wa-bevel-dark": "rgba(120,95,45,0.55)",
        "--wa-win-shadow": "0 8px 26px rgba(60,45,15,0.45)",
        "--wa-title-bg": "linear-gradient(180deg,#fbf5e2 0%,#e7d8b0 50%,#d6c393 100%)",
        "--wa-title-bg-off": "linear-gradient(180deg,#efe9da,#d8cfb8)",
        "--wa-title-fg": "#5a4720",
        "--wa-logo-fg": "#9a7c30",
        "--wa-fg": "#5a4720",
        "--wa-fg-dim": "#8a7547",
        "--wa-lcd": "#4a3814",
        "--wa-lcd-glow": "rgba(120,90,30,0.25)",
        "--wa-inset-bg": "linear-gradient(180deg,#efe6c8,#e3d4a8)",
        "--wa-btn-bg": "linear-gradient(180deg,#f6efd9,#dccba0 55%,#cbb98c)",
        "--wa-btn-active-bg": "linear-gradient(180deg,#c7b27c,#e6d7ad)",
        "--wa-btn-fg": "#5a4720",
        "--wa-accent": "#8a6a1e",
        "--wa-accent-glow": "rgba(180,140,50,0.55)",
        "--wa-track-bg": "linear-gradient(180deg,#d6c79b,#e6dab6)",
        "--wa-thumb-bg": "linear-gradient(180deg,#fff6d6,#d9b558 55%,#9c7724)",
        "--wa-thumb-border": "#6b5320",
        "--wa-analyzer-bg": "#e3d4a8",
        "--wa-bar-lo": "#b59440",
        "--wa-bar-hi": "#6b5320",
        "--wa-bar-peak": "#3f3010",
      },
    },
    {
      id: "magenta",
      name: "Freaky Magenta",
      vars: {
        "--wa-win-bg": "linear-gradient(180deg,#3a2240 0%,#281530 6%,#1d0f24 100%)",
        "--wa-title-bg": "linear-gradient(180deg,#c84fd8,#8a1fa0 50%,#5a1478)",
        "--wa-title-fg": "#ffe3ff",
        "--wa-logo-fg": "#ffbfff",
        "--wa-fg": "#e0bce8",
        "--wa-lcd": "#ff5fe0",
        "--wa-lcd-glow": "rgba(255,95,224,0.7)",
        "--wa-accent": "#ff5fe0",
        "--wa-accent-glow": "rgba(255,95,224,0.6)",
        "--wa-bar-lo": "#8a1fa0",
        "--wa-bar-hi": "#ff5fe0",
        "--wa-bar-peak": "#fff0ff",
        "--wa-thumb-bg": "linear-gradient(180deg,#ffcfff,#d84fc8 55%,#8a1fa0)",
        "--wa-thumb-border": "#4a0f5c",
      },
    },
  ];

  var DEFAULT_ID = "classic";

  function get(id) {
    for (var i = 0; i < NEOAMP_SKINS.length; i++) {
      if (NEOAMP_SKINS[i].id === id) return NEOAMP_SKINS[i];
    }
    return NEOAMP_SKINS[0];
  }

  // Apply a skin to the root element: clear any previously-set --wa-* inline
  // props, then set this skin's overrides. Clearing first means switching from a
  // heavily-overriding skin back to a lighter one restores the CSS defaults.
  function apply(root, id) {
    if (!root) return DEFAULT_ID;
    var skin = get(id);
    var style = root.style;
    for (var k = style.length - 1; k >= 0; k--) {
      var prop = style[k];
      if (prop.indexOf("--wa-") === 0) style.removeProperty(prop);
    }
    Object.keys(skin.vars).forEach(function (name) {
      style.setProperty(name, skin.vars[name]);
    });
    return skin.id;
  }

  window.NEOAMP_SKINS = NEOAMP_SKINS;
  window.NeoAmpSkins = { list: NEOAMP_SKINS, apply: apply, get: get, DEFAULT_ID: DEFAULT_ID };
})();
