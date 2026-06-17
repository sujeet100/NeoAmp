# Alchemy v2: Random — session handoff (2026-06-17)

Self-contained state for resuming `P["Alchemy v2: Random"]` in a fresh session. Read this +
CLAUDE.md + the memory `alchemy-random-v2-rebuild-plan` before touching code.

## What this preset is
ONE Butterchurn preset = V1's *approach* (stochastic, non-choreographed, continuous feedback bleed)
populated **entirely from the v2 kit** by stochastic polymorphic dispatch. It lives in
`wmp-presets.js` right after the UNTOUCHED v1 `P["Alchemy Random"]`. It is the default preset
(viz.js `DEFAULT_PRESET`), top of the FAVORITES list. The Director is retired.

## THE governing principle (in CLAUDE.md — do not violate)
When drawing any element, **stochastically pick among ALL the kit's variants of that element** —
CALL the kit factory functions; never hardcode one variant and never re-derive an inline version of
something that already exists as a factory. This was violated repeatedly (shipped one orb style /
inline ring-disc shapes) and is the #1 source of rejected rounds.

## HARD constraint (verified in vendor/butterchurn.min.js)
Butterchurn renders only **4 custom waves** (`customWaveforms=c.range(4)`) **+ 4 custom shapes**
(`customShapes=c.range(4)`). waves[4+] are silently dropped (that's why early orbs on waves[4]/[5]
never appeared). **Do NOT patch the vendor** (tried `range(8)`, reverted — fragile across upgrades;
user rejected). Work in-budget: 4 waves + 4 shapes; shapes are instanceable up to 1024×; sample-pack
multiple elements into one wave (e.g. mandala = `alcNgonPacked` all 12 in one wave); or draw
procedurally in the comp GLSL. `drawCustomWaveform`/`drawCustomShape` guard missing slots (no crash);
shape `frame_eqs` runs as a FUNCTION with q-vars merged in (sides 3..100, num_inst 1..1024).

## Current architecture (4 waves)
- **wave[0]** = central polymorphic motif (`centralDraw`), 11 modes via kit factories: 0 alcAnemone ·
  1 alcTriMandala · 2 alcNgonPacked(all 12, nested mandala) · 3 alcSpindle · 4 alcRadialBurst ·
  5 packed rays (fRays) · 6 alcTriangle · 7 alcDiagonalLine · 8 bgWaveHorizon[0] · 9 alcOrbFeathery ·
  10 alcMeshRings (corridor). `q1`=mode (dip-swap), `q15`=visibility, `scaleFor(mode)` sets `q5`.
- **wave[1]/[2]** = orb A / orb B. Dispatch `orbDispatch` over `alcOrbTarget` n=1/2/3 (clean rings),
  chosen by `q16`. SMALL (`q25`/`q7`≈0.04), NON-additive, pastel. `alcOrbiterNode` was DROPPED — its
  16-turn spiral smears into an ugly white "yarn coil" under Random's camera (it only looks good in
  Net Tunnel, whose warp is fade-only). Presence is random+independent (oaShow/obShow → none/single/
  pair); orb A vis `q17`, orb B vis `q12`. Positions `q21..q24` (A left, B right, makeSH random).
- **wave[3]** = tether (`alcTether`), thick, shown only when BOTH orbs present + gate (`q4`).
- **shapes[0..3]** = unused (the headroom for filled/gradient orbs — task #4).
- COLOUR: `huePhase` (alcHueClock) → `q8`; stochastic palette `palPick` over ALC_PAL (no mono);
  `pastel()` desaturates geometry to ~28% (dusty but colourful). `palSpec` (sample-keyed) for
  spindle/rays so they're multi-colour.
- CAMERA (warp): `camPick` lerps CAMS tuple [zoom,rot,twist,kal,drift] → q28..q32. Vortex kept GENTLE
  (strong twist swallowed the frame). None static.
- BACKGROUND (comp): `bgField` = 8 kit fields (alcFluid×3 dusty trios / alcMarble×2 / alcWash /
  alcMoire / alcSolidSnap), crossfaded by bgPick (q18/q20/q27), hue-rotated by q8. **Brightened to
  match the original video** (round 3): `bg*=(1.0+0.5*bass)`, rich colours 0.10–0.42, no dark fog,
  Reinhard k=0.7. 4-tap max **dilation** = thick lines (v1 character). NO rainbow/pal fields (user
  disliked them).

## Open issues / next steps (priority order)
1. **"Not seeing ALL motifs/backgrounds"** (user's last note). They ARE wired + render; it's
   PACING/COVERAGE. Speed the pickers for dev (or add a debug key to force-step modes), confirm each
   of the 11 motif modes + 8 bg fields looks FULL (diagonal/horizon are 1 thin line → look empty;
   beef them up), then set final dwell. Consider: don't let the same mode repeat back-to-back.
2. **Filled orb "sometimes"** (user asked) → via the 4 SHAPE slots: `alcOrbGradBlob("q21","q22",pal)`
   (returns 2 shapes) + same for B = 4 shapes. Gate by an orb-style value + presence. Task #4.
3. **Net Tunnel scene** (user "did not see it") → a rotating-spoke fan / receding tunnel as a motif
   mode (alcRotLines diameter spokes + fast fade), like `P["Alchemy v2: Net Tunnel"]`.
4. Tune bg colour trios from `/tmp/alc_montage.png` (montage of the reference video).

## Validate before every reload
```
node --check wmp-presets.js && node --check viz.js
node -e 'global.window=global; require("./wmp-presets.js");
  for (const [n,p] of Object.entries(window.WMP_PRESETS)) p.frame_eqs({time:2,bass:1.3,bass_att:1.1,mid:1,treb:1,treb_att:1});
  console.log("ok");'
```
GLSL only checkable live (viz.html frame console, `[WMP-viz shader]`). Reserved-name trap: never
declare `ang/rad/ret/uv/hue_shader/q1..q32` as locals in shader_body (use pang/pr/etc).

## Reference assets
- `~/Downloads/Alchemy Random Media Player 480p.mp4` (228s, all-Alchemy — the bg-colour source).
- `/tmp/alc_montage.png` (24-frame montage; re-extract: `ffmpeg -i "$V" -vf "fps=1/9,scale=300:-1,tile=6x4" -frames:v 1 /tmp/alc_montage.png`).
- Backups of the working file at each splice: `/tmp/wmp-presets.bak{,2,3}.js`; vendor backup `/tmp/butterchurn.min.bak.js`.

## Git
On `main`. 3 files modified, UNCOMMITTED: `CLAUDE.md`, `viz.js`, `wmp-presets.js`. Vendor reverted
(no diff). Recommend committing the session's work at resume (or now if asked).
