# Alchemy V4 — MISTAKES & LEARNINGS (read this BEFORE touching V4)

Handoff doc. The Alchemy visualizer has been rebuilt several times (v1 → v2 → v4) and a lot of
effort was burned repeating the same mistakes. This file is the antidote. **Read it first.**

---

## 0. CURRENT STATE (where the last session left off)

- **V4 = `presets/alchemy-v4.js` is now ONE seamless self-sequencing preset** `P["Alchemy V4: Random"]`
  (single menu entry). The earlier 8-shuffle-cycled-presets design was **collapsed** because the
  cross-preset crossfade read "foggy / like a new preset faded in" (the user's #1 complaint). The user
  reaction to the rebuild + the round of fixes was **very positive** ("looks much better", "orbs look
  gorgeous"). **This single-preset architecture is CONFIRMED RIGHT — do not go back to multi-preset.**
- **Architecture** (see `alchemy-v4.js` header + §8 below): an in-preset director (`makePicker` spine
  ported from v2:Random) drives THREE independent slow clocks over ONE persistent feedback buffer —
  **lookPick** (camera/exposure/fold), **bgPick** (background, decoupled), **motifPick** (central
  geometry, swapped under an opacity dip `q4`). Central motif = a per-frame dispatch (`q30`) over
  inline/kit point-fns (anemone/spindle/ngon/triangle/bolt/urchin/rotline/fountain). Orbs = filled
  SHAPES (come-and-go, varied path), tether = a wave, ripples = a COMP-shader effect. Engine = v4's
  `WARP_V4` (fold + camera) + `COMP_V4` (fusion bg + asymmetric bleed + dilation + Reinhard).
- **q-var map** (in the file header): engine reads `q1/q12–q20/q27–q32` + `q8` hue; motifs read
  `q2–q11/q14/q21–q26`; control `q30` (motif mode) + `q4` (motif visibility) + `q11` (ripple phase)
  are read by neither shaders nor kit factories. Only `enabled` is build-fixed (see §4 correction).
- **The `viz.js` cross-preset Director is retired for v4** (boots straight into the single preset).
- v1 (`presets/alchemy.js` "Alchemy Random") and v2 ("Alchemy v2: …") remain **untouched**.
- **Open follow-ups** (tracked as tasks): kaleidoscope shows only one quarter + add a DIAGONAL (X)
  fold; reconsider the dense daisy-spirograph under fold; build/refine the 2:40-2:50 + 0:39-0:45
  scenes; make the tether beat-synced (flash on the kick, not permanent). See `FINDINGS-AND-REBUILD-PLAN.md`.

---

## 1. THE BIG META-MISTAKE (the one that cost the most)

**Thrashing: reacting to each piece of rapid feedback with a fresh full rewrite, and over-correcting
into the opposite extreme.** Colours went muted → muddy → flat-single-tone → neon pastel-rainbow →
(finally) dusty-harmonious. Each rewrite fixed the last complaint and introduced a new one. ~20
rounds, little convergence, user frustration.

**How to avoid it next time:**
- **Verify with the self-render harness (§5) BEFORE showing the user.** Most thrash came from shipping
  blind and getting a "no" on something I could have seen myself.
- **Make small targeted changes, not full rewrites,** once the architecture is right (it is now).
- **Don't over-correct.** "Too muted" does NOT mean "go neon rainbow." Aim for the middle the
  reference actually shows.
- When feedback feels contradictory across rounds, **stop and re-derive the target from the reference
  + ask one focused question** rather than ping-ponging. (Doing this once — confirming "rebuild on real
  kit factories" — is what finally unstuck it.)

---

## 2. HISTORICAL MISTAKES (v1 / v2 — from CLAUDE.md + docs)

1. **v2 decomposed the image wrong:** discrete motifs on flat backgrounds, switched by a director →
   **hollow, repetitive, scenes-too-long, muddy.** The real Alchemy is a dense, layered, continuously
   morphing field.
2. **Over-applying the "muted colours" rule → dull/muddy brown.** The original is muted **but
   LUMINOUS and genuinely colourful** (especially the 720p reference). "Muted" = *not blown to
   white, not neon* — NOT *low-saturation/dull*.
3. **Shipped ONE variant when the kit has many** (e.g. one orb style out of 18).
4. **Re-derived inline versions of kit factories** instead of calling the real ones.

---

## 3. THIS SESSION'S MISTAKES (the valuable, specific part)

Each is **Mistake → Correction**. These are the concrete don'ts.

- **M1 — Hand-coded/"ported" motif geometry instead of the REAL kit factories.** My `polyEdge`,
  `radialAt`, comb-net etc. produced scribbles, woven-cloth nets, ugly shapes ("motifs are fucked
  up"). → **Use the actual kit factories** (alcAnemone, alcSpindle, alcNgon(Stack), alcStarWaves,
  alcMeshRings, alcOrbiterNode, alcTether, alcOrb*). They're tuned and beautiful. Don't reimplement.

- **M2 — Reduced the vocabulary** to ~6–12 "mechanisms," collapsing variety. User: *"don't reduce the
  number of motifs… there could be variations of each, be elaborate."* → **Keep the FULL vocabulary;
  variations of a motif are separate looks.** See `CATALOG.md` (40+ motifs, 33 backgrounds).

- **M3 — Backgrounds oscillated between WRONG extremes:** near-black flat → flat single-tone wash →
  neon pastel RAINBOW. User wanted **vibrant MULTI-COLOUR FUSION** (2–3 *harmonious dusty* colours
  bleeding together, like the original's colour bleed) — NOT single-colour AND NOT full rainbow. →
  **Dusty harmonious anchor pairs** (teal/amber, sage/rose, gold/violet…) fused via fbm; saturated
  but not neon. Use `alcAurora`/`alcFluid`/`alcMarble` kit fields + a moiré variant.

- **M4 — Ugly orbs (repeated complaint).** Drew them as (a) comp gaussian blobs = blurry/faded, and
  (b) `alcOrbiterNode` whose 16-turn white sqrt-spiral fill got smeared by feedback into big white
  cones — "spiral, too big, no colour fill, out of focus." → **Clean FILLED COLOUR orbs as SHAPES**
  (bright core → colour halo → colour ring), small, low roam + low decay so they don't smear into
  cones. (Implemented as `orbShape()` in alchemy-v4.js.)

- **M5 — Single motif per scene** (a lone central element). User: *"where are the secondary elements —
  orbs, tethers, lines?"* → **LAYER every scene:** central motif + tether + two orbs + accent line.
  The original is dense and layered.

- **M6 — Static "top-view" camera** (only centred zoom/rot/swirl) → felt 2D, no depth. User: *"camera
  is static, no movement, no feeling of space."* → **Dynamic 3D camera:** perspective tilt
  (floor/tunnel recede) + continuous forward fly-zoom + orbit pan + tilt oscillation. The original has
  strong depth/space.

- **M7 — Abrupt whole-scene swaps.** User: *"scenes should bleed seamlessly — one motif appears, the
  rest change, continuous motion."* → Long crossfades + **orbs/tether persist across scenes** (the
  central motif morphs while the field continues) + continuous bg/camera (don't reset per scene).

- **M8 — Corridor was smooth spiraling CIRCLES** (`alcMeshRings`) → looked ugly. User: *"the corridor
  needs to be waveform — triangle, 2 triangles, or n-geo."* → **Corridor = n-gon/triangle WAVEFORM**
  receding under a tunnel camera (alcNgon + forward fly-zoom).

- **M9 — Didn't use the self-render harness early enough** → asked the user to screenshot every tiny
  change, wasting many rounds. → **Build/keep the harness (§5) and self-verify first.**

- **M10 — Over-trusted the stale "muted" memory against the user's direct, repeated feedback and the
  higher-quality 720p reference.** The `validate-dont-reflexively-agree` rule cuts both ways: validate
  against the **best** reference (the 720p clip is vibrant) and the user's current eyes, not stale notes.

---

## 4. WHAT ACTUALLY WORKS (the converged approach — keep doing this)

- **Use the REAL kit factories** for motifs (don't reimplement geometry).
- **⚠️ CORRECTION (2026-06-18, vendor-verified): the "multi-preset" rationale below is WRONG.** A
  decode of `vendor/butterchurn.min.js` proves Butterchurn re-reads `samples/scaling/spectrum/
  smoothing/usedots/additive/thick` (waves) and `sides/additive/textured/thickoutline/num_inst`
  (shapes) from each slot's **`frame_eqs` return EVERY FRAME** — only `enabled` is fixed at build.
  So a SINGLE preset CAN morph per-slot geometry, blend mode, polygon sides and instancing
  continuously (`P["Alchemy v2: Random"]` already does). The user now requires ONE seamless preset
  (single menu entry); the cross-preset Director crossfade is what reads "foggy/muddy" (viz.js:320).
  **See `docs/alchemy-v4/FINDINGS-AND-REBUILD-PLAN.md` for the verified single-preset architecture.**
  ~~Multi-preset, not one mega-preset.~~ (superseded) — Each "look" was a separate preset with FIXED
  kit-factory waves; the Director crossfaded between them. (The claim "a single preset can't hot-swap
  per-wave baseVals each frame" is false — only `enabled` is build-fixed.)
- **Engine q-var split** (critical, avoids collisions): motifs read q2–q11/q14/q21–q26; engine
  (warp/comp) reads q1/q12–q32.
- **Every scene LAYERED:** central motif (waves) + tether (wave) + clean orbs (SHAPES) + accent.
- **Vibrant harmonious multi-colour-fusion backgrounds** (dusty anchor pairs, not rainbow, not flat).
- **Dynamic camera** (perspective tilt + forward fly + orbit pan) for a sense of 3D space.
- **Director shuffle-bag** (every scene once before any repeat) + long crossfade for seamless bleed.
- **Reinhard tone-map** in comp keeps additive cores soft (no white blow-out). Kit factories
  **self-colour** via ALC_PAL (driven by q8 hue); the comp should NOT recolour the foreground —
  just composite it over the vibrant bg + bloom + tone-map.

---

## 5. THE SELF-RENDER HARNESS (verify without the user — USE THIS)

**✅ IMPLEMENTED (2026-06-18): `tools/selfrender.mjs`** — a pure-Node CDP harness (built-in
`WebSocket`/`fetch`, no MCP, no puppeteer). Run `node tools/selfrender.mjs ["Preset Name"] [t1,t2,...]`
→ launches **full Chrome via `--headless=new --use-angle=swiftshader --enable-unsafe-swiftshader`**
(the standalone `chrome-headless-shell` gives a NULL WebGL context — use full Chrome), loads
`viz.html` over `file://`, pumps synthetic audio via `postMessage`, writes `/tmp/alc-render/*.png`,
and prints the page console (catches `[WMP-viz]` + the shader-compile hook). Read the PNGs to self-verify.
The chrome-devtools MCP is NOT required.

The original manual recipe (still valid if you have the MCP):
We cannot see the live extension render, but we CAN drive `viz.html` headlessly and screenshot it:
1. chrome-devtools MCP → `navigate_page` to `file:///…/ytmusic-wmp-visualizer/viz.html`; `resize_page`
   1280×720.
2. `evaluate_script`: install a `setInterval` that posts synthetic audio every ~16ms:
   `window.postMessage({ __wmp:true, type:"audio", data:<Uint8Array(1024)> }, "*")` where the array is
   a 128-centred time-domain waveform of a few sines (bass≈3, mid≈27, treb≈130 cycles) × a beat
   envelope. Then `postMessage({__wmp:true,type:"director:set",enabled:false})` and
   `{type:"preset:load",name:"Alchemy V4: …"}` to target a specific scene.
3. `take_screenshot`. Wait + screenshot again to catch the director cycling / motion.

GLSL can't compile in Node → also **ANGLE-precheck** shaders: extract `preset.warp`/`preset.comp`,
wrap each in a Butterchurn-style `main()` (predeclare `vec3 ret; vec2 uv; float rad; float ang;` +
`uniform float q1..q32` + the samplers), `compileShader`+`linkProgram` in a real webgl context, read
the logs. (Reserved-name rule: never declare locals `ang`/`rad`/`ret`/`uv`/`q*` in a shader_body.)

Node validation each round: `node --check` every preset file + the concat-in-one-scope build that runs
every `frame_eqs` and the enabled waves' `point_eqs` / shapes' `frame_eqs`.

---

## 6. REFERENCE ASSETS

- **Original:** `~/Downloads/Alchemy Random Media Player 480p.mp4` (228s).
- **BEST reference (vibrant, dense, 720p):** `~/Downloads/YouTube 1080p 60fps Download.mp4` (186s).
  Match its vibrancy. The **1:05 scene** = a vortex-swirl carrying an orb+tether comet with a gold arm
  over a teal/lavender ground — still to nail (add a dedicated vortex+orbs+tether scene).
- **v2 capture (what failed):** `~/Desktop/v2 implementation.mov`.
- **Analysis docs:** `docs/alchemy-v4/SPEC.md` (6 base mechanisms, knob space, pacing) and
  `CATALOG.md` (exhaustive 40+ motifs + 33 backgrounds, each mapped to a kit factory).
- Scratch frame montages lived under `/tmp/v4/` (re-extract with ffmpeg as needed).

---

## 7. OPEN / NEXT STEPS (per the user's last feedback)

1. **Render-test `27c29aa`** in the harness (orbs clean & colour-filled? scenes layered? corridor a
   waveform n-gon tunnel? camera feels 3D?). Fix what's off with small edits, not rewrites.
2. **Seamless bleed:** consider longer crossfade / element-level persistence so looks morph rather
   than cut.
3. **Add more of the CATALOG** into the rotation (the user wants the full vocabulary, elaborately):
   more orb variants, ribbon, dot-grid/wallpaper, perspective-floor, dahlia, etc.
4. **Add the 1:05 vortex+orbs+tether comet scene.**
5. Keep colours **vibrant-but-harmonious** (dusty anchor pairs), never neon-rainbow or flat single-tone.

---

## 8. SESSION 2026-06-18 — THE SUCCESSFUL REBUILD (what worked; read to avoid the old rabbit holes)

This session converged FAST (no thrash) where earlier ones burned ~20 rounds. The difference was a
tight **edit → validate → self-render → commit** loop and small targeted changes. Keep doing this.

### The working cadence (THIS is why it went well — don't deviate)
1. **Self-render every change with `tools/selfrender.mjs`** (pure-Node CDP harness, no MCP — see §5).
   `node tools/selfrender.mjs ["Preset"] ["t1,t2,..."]` → reads `/tmp/alc-render/*.png` + the page
   console. This ENDED the screenshot-loop with the user — verify yourself first. To verify a feature
   that only fires under specific conditions (a fold, a beat, an orb-gone moment), **temporarily force
   the q-var** (e.g. `t.q12=4;t.q13=0.85`), render, then remove the `// __DEBUG__` line.
2. **Small targeted edits, ONE concern at a time. Commit after each verified change** (the user asked
   for this explicitly; small commits = trivial revert). Don't batch many changes blind.
3. **Node-validate before every render**: `node --check` + the concat+frame_eqs harness (catches
   missing refs / throwing eqs / q-var collisions). GLSL only fails at runtime → the harness console
   + the in-browser shader hook surface it.

### Architecture that worked (the answer to "make it ONE seamless preset")
- ONE persistent preset; morph by mutating q-vars in `frame_eqs`, NEVER `loadPreset` (preset swaps =
  Butterchurn's two-program crossfade = the "foggy / new preset" feel). Vendor-verified: **only
  `enabled` is build-fixed** — samples/additive/sides/usedots/num_inst are per-frame (§4 correction).
- Independent slow clocks (look / bg / motif) over one buffer = "endlessly varied, never loops, reads
  as one preset." Motif geometry swaps under an **opacity dip** (q4), not a vertex blend.
- Persistent secondary layer (orbs + tether) bridges motif changes; bg decoupled on its own clock.

### NEW GOTCHAS discovered this session (each cost a round — avoid next time)
- **Additive bristle density → milky white-out.** Dense additive radial motifs (spindle, fountain)
  accumulate in the feedback buffer to equilibrium ≈ input/(1−decay) → saturates to white. Fix:
  **per-mode alpha** (dense modes get ~0.4–0.5) + keep decay ≤ ~0.93. (Hit this twice.)
- **Anything PERSISTENT in the feedback buffer gets rotated by the camera roll/swirl → SPIRAL.** The
  always-on ripple smeared into an ugly permanent spiral. Fix: do transient/secondary effects
  (ripples) **in the COMP shader, drawn FRESH each frame** (never a feedback wave) so they can't
  rotate/accumulate. Gate them intermittent + OFF during swirl scenes + fast-fade.
- **Radial (6-fold) fold on a dense flower → off-brand thin-line spirograph.** The original
  kaleidoscope (w_sweep f_22/24/26) is **QUAD (4-fold) soft COLOUR wedges** (fold the *background
  colour*, not just thin motif lines) + a *small* mirrored centre. Use quad; shrink the motif under a
  fold. (Open: it's still only one quarter on screen + needs a DIAGONAL/X fold — tracked.)
- **Don't leave an orb always-on.** A permanently-visible orb reads weird. Orbs must fully come-and-go
  (the original has orb-absent moments) on out-of-phase clocks so they're never all gone at once; and
  their path must vary (rotate the pair axis through all directions, not a fixed diagonal).
- **The waveform/lines read too thin against vibrant bg** → add a max-DILATION pass in COMP (thickens
  every foreground line + orb ring). Cheap, big payoff.
- **Backgrounds must never be flat** → asymmetric OFF-CENTER colour pool + one-edge plume (not a
  centred vignette); decouple the bg clock from the motif so the same motif appears over many grounds.

### Original-video facts re-confirmed this session (see FINDINGS-AND-REBUILD-PLAN.md for the full set)
- Kaleidoscope = soft QUAD colour wedges + small mirrored centre; the dominant element is folded
  *colour*, not lines. The original also uses a DIAGONAL/X fold (≈0:20–0:30).
- Orbs: vary count (0 / single / pair / cluster), positions, and paths; appear at varied spots, not a
  fixed diagonal. The connecting lightning/tether appears WITH the beat and disappears (≈0:27–0:39) —
  it is NOT permanently on.
- Ripples (≈2:46): wavy (never perfect circles) concentric rings, defined (not blur), recolour with
  the pulse, shed on the beat.
