# 10 — Kaleidoscope lattice variants, region-by-region colour floods, and live-geometry mirroring

**Matrix items:** C5 (kaleido lattice variants + region floods, **P1**) · B8 (kaleido mirrors LIVE geometry, **P2**) · **Priority:** P1 (C5 dominates the slice; B8 rides along on the same COMP branch) · **Risk flags:** C5 = (6) _permissive_ — the kaleidoscope is the ONE sanctioned vivid zone (memory `alchemy-measured-color-facts`); B8 = _budget-honesty_ — one uniform COMP fold cannot selectively exempt an emitter. · **Confirmation needed:** YES — two questions:

> **Q1 (C5 vivid).** Pastel today deliberately DESATURATES the kaleido (`ksat` 0.38, alchemy-v7.js L1346, comment "was reading too vivid in pastel"). The measured refs + memory sanction a _vivid red/green_ kaleido as the single muted-rule exception. During a region-flood PEAK (~1–1.5 s), may Pastel spike toward vivid (raise effective `ksat`→~0.8) per D13 "one-vivid-accent", or keep Pastel's kaleido uniformly muted and let only Vivid pop? **Default if no answer: keep Pastel muted; ship the flood mechanism desaturated in Pastel, vivid in Vivid.**
> **Q2 (B8 exception).** The refs show an un-mirrored diagonal tether OVER a 4-fold-mirrored field (h1 S7 113.0). A single uniform COMP fold cannot do "mirror the field, exempt one full-frame line" (see §3 budget note). Acceptable to instead **re-anchor the orbs into the fold window so they become 4-fold "mirrored mini orbs" (matches p0 S4 / p1 S10) and GATE the wide tether off during kaleido**, rather than chase the ref-exact un-mirrored exception? **Default if no answer: yes — re-anchor orbs, gate the tether.**

---

## 1. Reference behaviour (what the original does)

### C5 — at least three lattice geometries + colour arrives as REGION FLOODS

The kaleido is not one look; the refs show a family, all camera-LOCKED, all colour changing IN PLACE (no scroll):

- **Bowtie sine-band lattice** (h0 M5, 17–28.5 s). Mirror-symmetric about BOTH axes. Two horizontal sine-band ribbons (top + bottom, amplitude ~15% frame height, period ≈ frame width) pinch at nodes (x≈0/50/100%), forming **black diamond negatives**. Bands = 2–4 nested stripe outlines 35–70 px thick (blue-violet core / pink border at 22.5 s; green core / tan border at 25.3 s). **Radial filament fans**: dozens of 1–2 px rays converging at the centre pinch, filling the up/down wedges (±50° from vertical). **Colour = ERA FLOODS**: a new colour fills the **centre diamond first, then side wedges, then band cores** — **2–4 region floods/s at peak, each era ~1–1.5 s** (h0 M5 L154-156). Ray-curtain EVENT: 60–80 crisp cream rays burst vertically both ways from the pinch (25.2, 27.0), persist ~1 s, decay into the fan. Exit by **corner-collapse** (28.25), not fade.
- **Aztec quantized bands** (p0 B5, 24.25–31.5 s). Quad-mirrored blocky horizontal band STEPS ("Aztec diamond"), **bold 2-tone palettes snapping every ~0.5–1 s** plus continuous folding-in of old trail content (red puffs fade in ~1 s). No scroll; the palette change happens IN PLACE. Snap sequence measured (p0 S4): magenta/grey(24.25)→gold(25)→chartreuse(26)→green(27)→orange-cream(27.5)→indigo(28.25)→taupe(29)→rose(29.75)→purple(30.25)→**peak MAGENTA**(30.5–31.5). Even at the saturation peak the _motif_ stays grey-blue muted — vivid bg + muted fg, "never neon together."
- **Sine LENS bands + gill combs** (p0 B7, 44.5–58 s). Quad-mirrored **top/bottom nested sinuous arcs** around top-centre / bottom-centre foci — each band 12–25 px soft-edged, 2–5 nested per half, navy/maroon/red/green stacks over ground panels. Inside the lenses live **radial "gill" combs** (pleated-fan ghosts of folded ray-curtains). Ground panels **hue-step every 3–5 s**; bands undulate in place (phase drift ~5%/s, amplitude breath); a **bright midline seam** (specular line, yellow at 54.5).
- **Rainbow wave-band quad-fold** (p1 B1, ≤58.5 s). Sine-undulating **horizontal rainbow ramp** (~8–10 soft stripes, each 6–10% tall) mirrored ×4; the colour change RIDES the band movement (a visible moving front).

Common mechanism across all four: a COMP-shader `abs(uv)` fold on both axes + a distance/angle band mask, with colour supplied region-by-region from a stepped palette LUT — NOT a continuous hue sweep.

### B8 — the fold mirrors LIVE geometry, with deliberate exceptions

- **Genuine single-quadrant mirror of live content** (p1 S10, 91–96.5 s): "content is genuinely ONE quadrant mirrored ×4 (live content in one quadrant, replicas exact)"; emitter crisp each frame. p2 2.2 (131.0 s): the quad-fold "turns one urchin into a lace mandala ~200 px", emitter crisp each frame, slowly rotating (<10°/s). p0 S4 lists "4x-mirrored mini orbs" + "corner echoes" as part of the mirrored cast — **the orbs themselves get mirrored** during kaleido.
- **Deliberate UN-mirrored exceptions** (the counterpoint): p1 S10 — yellow hollow ring targets ride the inner end of **TWO arms only** (UL+LR = a _point-symmetric_ pair, NOT 4-fold, full_92.05). h1 S7 (113.0) — the bars field + scribble-moth are 4-fold mirrored, but "**the diagonal tether is NOT mirrored**: thin live-waveform line corner-to-corner with 3–4 violet ring-bead orbs threaded on it." So the original composits an un-mirrored full-frame layer OVER the mirrored field.

---

## 2. Current implementation state

The kaleido lives entirely in `makeComp(PROFILE)` (alchemy-v7.js **L92-230**) — a display-only COMP pass; its output is NOT fed back (catalog §2 "never fed back"; only the WARP+waves buffer feeds back). This is load-bearing for B8 (§3 budget note).

- **The fold** (L100-110): `float m = floor(q29+0.5)` selects the regime. When `m==1`, the trail SAMPLE coordinate is folded: `kc=(uv-0.5)*(1.5+0.4*q13)` (aspect-corrected), `kc=abs(fract(kc*0.5+0.5)*2.0-1.0)` (4-fold mirror → diamonds), `suv=clamp(kc*0.5+0.25,0,1)` → **samples only the central window ≈[0.25,0.75]² and mirror-tiles it across the frame.** At the shipped scale (1.5+0.4·q13, q13≈0.5–0.9) the `fract` barely wraps, so it is essentially a single 4-fold `abs` mirror of the centre.
- **The one lattice look** (L182-194): a checker of diamond cells `cell=step(0.5,fract((suv.x+suv.y)*1.5))` takes a 2-hue DUO `pal(hb+cell*0.45+0.12*suv.x)`, desaturated by `mix(vec3(kl),kcol,ksat)` then `kcol*kcol*kbold`, composited `mix(ground*0.12,kcol,0.9)`. Colour comes from the SHARED continuous hue clock `hb=q8`, which merely runs faster in kaleido (`hueRate=0.2`, L949) — **a continuous clock, not region floods.**
- **Fold gating** (frame(), L989-991): `q12 = bgMode===1?4:1`; `q13 = bgMode===1 ? 0.5+0.4·min(1,bassA-1+0.5·sin(time*0.07)) : 0`. So q13 is a **kaleido-scoped** channel already (0 otherwise) — reusable (see §3).
- **Selection** (L920, L926, L942-944): `BG_BAG` has kaleido (id 1) twice of 15 entries; `bgPick=makePicker(15,7,12,3.0)`; q29 SNAPS at crossfade midpoint (L943), the persistent trail buffer bridging the cut.
- **Live geometry today.** The central MOTIF (waves[0], q2/q3 centre drifts only ±0.12 around 0.5, catalog §1) draws INSIDE the ≈[0.25,0.75] fold window → it IS already captured and 4-fold-mirrored into a mandala (this is what p2 2.2 describes). The ORBS (shapes, wide diagonal orbit, positions can reach 0.16/0.7, catalog §4) draw OUTSIDE the window → during kaleido display they are effectively **cropped out** (not sampled), so they neither mirror nor show. Modes 0/2 already suppress the PULSAR squash when the fold is on (L841). No mechanism exists to (a) pick a different lattice, (b) flood colour by region, or (c) deliberately exempt an element.
- **Profiles** (L1345-1346 Pastel `kbold 0.85 / ksat 0.38`; L1360-1361 Vivid `kbold 1.7 / ksat 1.0`) — the only per-variant knobs; Pastel deliberately mutes the diamonds.

**Reusable:** the `abs`-mirror fold, the diamond-cell mask, the `pal()`/`ksat`/`kbold` colour path, and q13 as a free kaleido-scoped channel. **Absent:** lattice variants, region floods, an exception mechanism. **Deviating:** colour is a continuous clock (should be region floods); the fold crops the orbs (refs mirror them).

---

## 3. Implementation plan

All steps edit ONLY the `m==1` branch of `makeComp` (L182-194 / the fold L105-110) and the kaleido gating in `frame()` (L989-991). Everything is gated by `bgMode===1`, so any step is revertible by reverting that step's lines; a broken kaleido shader only fails when q29 lands on 1 (startup preset is unaffected). **No new q-vars** are introduced — all 32 are taken; we MULTIPLEX the already-kaleido-scoped **q13** and drive floods from `time` inside the shader (constraint-honest).

> **q-var multiplex (the key move).** q13 is 0 outside kaleido and a fold-scale inside it. Repack it: in `frame()` set `q13 = variant + kscale` where `variant ∈ {0,1,2,3}` (the picked lattice) and `kscale ∈ [0,0.9]` (the breathing scale). In the shader read `float kv = floor(q13);` and `float kscale = fract(q13);`. This carries the lattice selector WITHOUT touching any warp q-var (q17-swirl, q16-roll, q18/19-pan are all still live during kaleido — do NOT steal them; the WARP runs every frame). Region floods need NO channel — they are a pure `time`+`pal()` function in the shader.

### Step 1 — Region-by-region colour FLOODS on the existing diamond lattice (C5 core; smallest shippable slice)

Replace the continuous-clock colouring (L186-192) with a staggered region LUT. Regions from the folded coordinate: centre diamond (near `suv≈0.5`), side wedges, band cores. Each region adopts a stepped hue that arrives on its own delay so colour cascades centre→wedge→band at 2–4 floods/s.

```glsl
// inside m==1 branch, after computing suv/cell. NO local named ang/rad.
float pr2 = length(suv - 0.5);                 // 0 at centre diamond → outward
float region = step(0.14, pr2) + step(0.34, pr2); // 0 centre · 1 wedge · 2 band core
float rate   = 3.0;                            // ~3 floods/s at peak (h0: 2-4/s)
float era    = floor(time * rate - region * 0.5); // stagger each region by ~0.17s
vec3  kcol   = pal(hb + era * 0.14 + cell * 0.45); // stepped hue, not continuous
```

Keep the existing `ksat`/`kbold` desat+bold lines UNCHANGED so Pastel stays muted (Q1 default). Compose with directors: `hb=q8` still carries the global clock (cross-ref **doc 05** — the region flood is a _kaleido-local_ stepping OVER doc 05's global hue clock, not a replacement; leave doc 05's clock owning `q8`). Gate: entirely inside `m==1`. Revert = restore L186-192.

### Step 2 — Lattice VARIANT selector (C5; the 3 missing geometries)

In `frame()` (L989-991) pick a variant when a fresh kaleido visit begins (reuse the existing bg-mode-change edge; store `alcKV` in closure), then pack into q13:

```js
// frame(), replacing the L991 q13 line (bgMode===1 branch):
if (bgMode === 1) {
  if (prevBg !== 1) alcKV = (Math.random() * 4) | 0; // 0 diamonds ·1 bowtie ·2 lens ·3 rainbow-bands
  var kscale = 0.5 + 0.4 * Math.min(1, bassA - 1 + 0.5 * Math.sin(time * 0.07));
  t.q13 = alcKV + kscale; // integer=variant, fraction=scale
} else {
  t.q13 = 0;
  alcKV = 0;
}
```

In the shader dispatch on `float kv = floor(q13); float kscale = fract(q13);` (feed `kscale` where L107 used `q13`). Add three band-mask branches beside the current diamonds (`kv==0` = today's diamonds, unchanged):

- **kv==1 bowtie** — two horizontal sine ribbons pinching at nodes: `float band = sin(suv.x*6.2831*2.0)*0.15;` build top/bottom ribbon masks around `suv.y=0.25/0.75`, black-diamond negatives where they pinch; fill wedges with radial fan `pow(0.5+0.5*cos(atan(c.y,c.x)*40.0),6.0)` (mirror of the tunnel-spoke trick, L133).
- **kv==2 sine-lens bands** — nested arcs around top/bottom foci: `float d1=length((suv-vec2(0.5,0.18))*vec2(1.0,1.7)); float lens=0.5+0.5*sin(d1*38.0 - time*0.4);` stack 2–5 via `fract`; add a bright midline seam `smoothstep(0.02,0.0,abs(suv.y-0.5))`.
- **kv==3 rainbow wave-bands** — undulating horizontal ramp: `float yb=suv.y + 0.04*sin(suv.x*12.0+time*0.5); vec3 kcol=pal(hb + floor(yb*9.0)*0.11);` (8–10 stripes, front rides `time`).

Each variant still runs the Step-1 flood LUT for its hue (the flood `era` term multiplies into every variant's `pal()` argument). Gate: all inside `m==1`, dispatched by `kv`; revert one variant by deleting its branch. **GLSL gotcha:** name locals `d1`, `yb`, `lens`, `band` — never `ang`/`rad` (they are predeclared in the generated `main()`; a redefinition silently fails to link, per CLAUDE.md).

### Step 3 — B8: mirror the LIVE orbs, gate the exception (frame() only, zero shader cost)

**Budget-honesty note (the crux of B8).** The COMP fold is a coordinate remap applied UNIFORMLY to the single trail buffer at DISPLAY time; the buffer does not record which emitter drew which pixel, and the fold output is not fed back. Consequences:

1. **What it CAN mirror:** any emitter whose strokes land inside the fold source window (≈[0.25,0.75]²) is 4-fold-replicated crisply, THIS frame (the central motif already is — p2 2.2). To mirror the orbs, **draw them into the window.**
2. **What it CANNOT do:** selectively exempt ONE element from the fold, or mirror an emitter that lives in the periphery (it is cropped, not mirrored). A full-frame un-mirrored diagonal OVER a full-frame mirror (h1 S7) is **not reproducible** with one uniform fold — the fold would turn a UL→centre line into an X.

So the honest, cheap slice (Q2 default) is a `frame()` closure change, no shader edit:

```js
if (bgMode === 1) {
  // re-anchor orbs INTO the fold window → 4-fold mini orbs (p0 S4)
  var kx = 0.5,
    ky = 0.5,
    sep = 0.11; // tight, inside [0.25,0.75]
  t.q21 = kx - sep;
  t.q22 = ky - sep;
  t.q23 = kx + sep;
  t.q24 = ky + sep;
  t.q26 *= 0.0; // gate the wide tether off (can't be un-mirrored honestly)
}
```

This yields the ref's "4x-mirrored mini orbs + corner echoes" (p0 S4) and drops the un-reproducible un-mirrored tether. The _point-symmetric-only_ sub-element (ring targets on 2 arms, p1 S10) is likewise not cheaply separable under a uniform fold — **document as a known ceiling**, do not chase it. Composes with directors: the corridor/valley couplings don't fire under bgMode 1, and the rest system still fades accessories. Revert = delete the `if` block.

### Step 4 (OPTIONAL, gated on Q1) — vivid flood PEAK in Pastel

Only if Q1 says yes: let the flood era briefly lift Pastel saturation. In the shader, after the `ksat` mix, add `float peak = fract(time*rate); kcol = mix(kcol, kcol_full, smoothstep(0.0,0.15,peak)*smoothstep(0.6,0.3,peak));` where `kcol_full` is the pre-desat colour — a ~1–1.5 s vivid red/green spike per flood, decaying to muted (the D13 one-vivid-accent + the sanctioned exception). Gate behind a profile knob `P.kfloodpeak` (0 in Pastel default, >0 if confirmed; Vivid already vivid). Revert = set the knob to 0.

---

## 4. Verification recipe

Per-step, before asking for any reload:

```bash
# 1. syntax
for f in presets/*.js viz.js; do node --check "$f" || break; done

# 2. CLAUDE.md concat + frame_eqs smoke (kit→families in ONE global scope; runs every frame_eqs)
node -e 'const fs=require("fs"),vm=require("vm");global.window=global;
  const cat=["kit","dance","alchemy","ambience","battery"].map(f=>fs.readFileSync("presets/"+f+".js","utf8")).join("\n;\n");
  vm.runInThisContext(cat);
  let n=0; for(const [k,p] of Object.entries(window.WMP_PRESETS)){ if(p.frame_eqs) p.frame_eqs({time:2,bass:1.3,bass_att:1.1,mid:1,treb:1,treb_att:1}); n++; }
  console.log("ok", n, "presets");'
```

**Shader steps (1, 2, 4) MUST pass the headless ANGLE pre-check** before a reload (CLAUDE.md "Two ways to see GLSL errors" #2): extract the new `comp` string, wrap it in Butterchurn's generated `main()` with predeclared locals (`vec3 ret; float rad=…; float ang=…;`) so a `ang`/`rad` redefinition WOULD reproduce, then `compileShader`+`linkProgram`+`validateProgram` in webgl/webgl2 via the chrome-devtools MCP and read the info logs. A bare wrap hides the bug — mimic the generated main.

**Self-render acceptance (one concrete check per step)** — `node tools/selfrender.mjs`, pinning the kaleido regime and (per scratchpad `pinrender.mjs`) any flag via `window.__ALC_FORCE` (production no-op, L1136-1140):

- **Step 1:** `__ALC_FORCE={"q29":1}` → capture ~8 s. ACCEPT: colour arrives as discrete region STEPS (centre diamond changes ~0.2 s before wedges/band cores), 2–4 changes/s — NOT a smooth continuous drift. Compare against h0 M5 era-flood cadence.
- **Step 2:** `__ALC_FORCE={"q29":1,"q13":1.7}` (bowtie), `2.7` (lens), `3.7` (rainbow-bands) — pin each. ACCEPT: three visibly DISTINCT lattices (pinching bowtie ribbons w/ black diamond negatives + wedge fans · nested top/bottom lens arcs + midline seam · undulating rainbow horizontal stripes), each still region-flooding.
- **Step 3:** `__ALC_FORCE={"q29":1}` → ACCEPT: the orbs appear as symmetric mirrored mini-orb copies inside the mandala (not cropped away, not a single off-centre disc), and the wide diagonal tether is absent (not drawn as a stray X).
- **Step 4:** `__ALC_FORCE={"q29":1}` on Pastel → ACCEPT: brief (~1 s) red/green saturation spikes at flood peaks, decaying to muted between — never sustained neon.

---

## 5. Risks & rollback

- **(6) muted-rule / vivid exception** — C5 is the ONE sanctioned vivid zone, but Pastel currently mutes it on purpose. Steps 1–3 keep Pastel muted (they touch geometry + colour CADENCE, not saturation); Step 4 (the only saturation change) is gated behind Q1 and a profile knob defaulting OFF. No step can blow highlights to white — the existing Reinhard tone-map + `ksat`/`kbold` path is untouched.
- **budget-honesty (B8)** — the un-mirrored full-frame exception is a hard ceiling of a single uniform fold; §3 documents it and Step 3 substitutes the reproducible ref behaviour (mirrored mini-orbs) rather than faking the impossible one. No shader-slot cost (0 new waves/shapes; all 4+4 stay as catalog §7).
- **Isolation** — every change is inside `if(m==1)` / `if(bgMode===1)`; the startup preset ("Dance") and all other q29 regimes are untouched, so a bad kaleido shader is invisible until q29 lands on 1.

**One commit per step** (git push direct to main, per memory):

1. `alchemy: kaleido colour arrives as region floods (C5)`
2. `alchemy: kaleido lattice variants — bowtie/lens/rainbow-bands (C5, q13-packed)`
3. `alchemy: kaleido mirrors live orbs, gates the un-mirrorable tether (B8)`
4. `alchemy: (opt, confirmed) vivid flood-peak accent in Pastel kaleido (C5/D13)`

Revert any step with `git revert <sha>` — no step depends on a later one (Step 2 dispatches on `kv`, defaulting `kv==0` to today's diamonds; Step 1's flood LUT applies to all variants).

---

## 6. Acceptance criteria (cluster "done" vs the references)

- [ ] During a kaleido visit, colour changes as **discrete region floods** (centre→wedges→band cores, staggered), 2–4/s at peak — NOT a continuous hue drift (C5 vs h0 M5).
- [ ] **≥3 distinct lattice geometries** are reachable across kaleido visits: (a) diamonds (today), (b) bowtie sine-ribbons with black diamond negatives + wedge fans, (c) nested top/bottom lens arcs + bright midline seam, (d — bonus) undulating rainbow horizontal stripes (C5 vs p0 B5/B7, p1 B1).
- [ ] The central MOTIF renders as a **crisp 4-fold-mirrored mandala** and the ORBS render as **mirrored mini-orbs inside the fold window** (not cropped) (B8 vs p2 2.2, p0 S4, p1 S10).
- [ ] The un-mirrorable elements are handled honestly: the wide tether is **absent** during kaleido (not a stray X); the point-symmetric-sub-element look is documented as a known ceiling (B8 budget note).
- [ ] Pastel stays **muted** across all lattices (Q1 default); OR, if Q1 confirms, flood PEAKS spike vivid red/green for ~1 s then decay — never sustained neon (C5 (6) / D13).
- [ ] All 4 custom waves + 4 custom shapes and all 32 q-vars unchanged in count (q13 multiplexed, floods time-driven); no new slots (budget ledger catalog §7 intact).
- [ ] Every kaleido change is inside the `bgMode===1` branch; other regimes and the startup preset render identically.

**Cross-references:** the WARP field / camera engine is owned by **doc 01** (do not add fold logic to the WARP — this fold is a display-only COMP read). The global hue clock (`q8`) and stepped-hue-arrival grammar are owned by **doc 05** — the region floods here are a kaleido-LOCAL stepping layered over doc 05's clock, not a second global clock.
