# 12 — Structured grounds: wallpaper tiling, chevron shear, band fronts/injections, curtain wedges, bars flood, floor-bands, wash dominance

**Matrix items:** C3 (wallpaper tiling) · C4 (chevron shear terrain) · C6 (band-sweep fronts + per-band injection) · C7 (curtain wedges / swaths) · C11 (floor-band / horizon-strip ground) · D3 (bars: static + gold flood + trapped pigment) · D4 (bands: static strata + injections) · D5 (flat-wash dominance in BG_BAG)
**Priority:** P2 (C11 is P3)
**Risk flags:** (4) on **C4 only** — chevron shear is a feedback-_warp_ change of the rejected-rework class and is **owned by doc 01 Step 6** (the shear warp term); this doc supplies only the low-risk COMP counterpart and defers the warp to 01. All other items are COMP-only, zero-slot, individually revertible.
**Confirmation needed:** **YES.**

> **Q1 (D4 / commit 302349c — the load-bearing one).** Commit `302349c` _raised_ the horizontal-bands drift (0.06→0.32) because you said our bands looked too static and you wanted a **visible sweep**. The 480p/1080p refs, however, show the bands' _steady state_ as **undulating-in-place strata that recolour band-by-band**, with a sweep only as an occasional injection _event_ (r0 2.8.2, p0 B7). Which do you want?
> (a) **Keep** today's fast uniform sweep on q29=6 as-is, and add the static/injection behaviour as a **separate new regime** (m==9) — _recommended, reverts nothing_;
> (b) **replace** q29=6's sweep with mostly-static strata + occasional fronts (undoes 302349c);
> (c) keep **both** and let the bag pick between them.
> This doc's plan assumes **(a)** until you say otherwise — Step 6 adds m==9 and never touches q29=6.
>
> **Q2 (C7 / D5 saturation).** Curtain wedges + extra flat washes must stay **Pastel-muted** (measured V~0.2, sat ~0.3–0.5 on a dark ground). Confirm you're OK with the extra washes reading _darker/flatter_ than the wavy-fluid ground they displace (that is the reference; see the D5 "let emitters own the frame" evidence). No confirm needed if you trust the measurement.

---

## 1. Reference behaviour (what the original does)

All grounds below are **COMP display-only** paint — drawn fresh in `makeComp` every frame, never fed back (catalog §2). They are distinct from **trail deposits** (the watercolour feedback buffer written by the motif/orb/tether waves). Where a ground appears to "hold pigment" (D3 trapped pigment, C10 stains) that is the _trail buffer_ showing through a comp mask — see the D3 mechanic below and cross-ref **doc 05** (deposit-holding grounds C10) and **doc 01** (the freeze/low-blur mode that lets deposits live 3–10s). Band widths/speeds are quoted as **% of frame height per second (%h/s)** measured off the cited reports.

### C3 — Wallpaper tiling regime (miniature live-centre replicator) · P2 · 480p

- Evidence: p3 **D-WALL** ("the frame becomes a **14×11 grid of miniature copies of the LIVE central composition**; cells morph in place as the centre changes; the grid does **NOT scroll**; a milky central lens; global hue **SNAPS in <0.25s every ~0.5–1.5s**; outro densifies then drains"). ~17s headline scene.
- Palette: whatever the live centre is, replicated; hue snaps discretely (stepped, not drifting).
- Mechanic: a **sample-coord fold** — `fract(uv*N)` reading a centre window of the _trail buffer_ (like the kaleido fold), zero slot cost. Injection vs sweep: neither — it is a static tiled _mirror_ of the live composition.

### C4 — Chevron / sawtooth shear terrain regime · P2 · 480p · risk (4)

- Evidence: p2 §2.6 (bands with **sawtooth edges, tooth ~40px** at 480p; "big stamp orbs get **chevron-sheared into zigzag ribbons within ~1s of landing** — the terrain = a **sawtooth horizontal shear in the feedback warp**"; chevron totem = tangle trail displaced down with alternating shear). Whole 480p bg family S5 135.5–153.
- **This is fundamentally a feedback-WARP effect** (the trail buffer sheared as f(y)), not a static comp ground. The true mechanic is **doc 01 Step 6's shear warp term** (`suv.x += q12*0.03*triangle(suv.y)`), which ships _dormant_. This doc's C4 slice is only the **COMP counterpart**: a static sawtooth-edged band _ground_ that reads as "chevron terrain" without touching the warp — safe, and it composites with doc 01's shear if/when that lands.

### C6 — Band-sweep FRONTS + band-by-band colour injection · P2 · both · (user-sweep note)

- Evidence: p1 **B4** ("new colour bands **enter from an edge**; band **front descending ~30–40 %h/s**; the colour change **RIDES the movement**"); r0 §2.8.2 ("a lilac wall **DESCENDS over ~1s**; injections flood **band-by-band every 1–2s**; boundaries do **not** scroll continuously — colours **replace within strata** and boundaries reflow, wavy-boundary amp 10–20px"); p1 **S15** (gold backlight floods **DOWN through bar gaps at 25–30 %h/s**).
- Emitter-vs-trail: display-only ground; the "front" is a comp gradient boundary, the recolour is the ground palette stepping — **the trail buffer is untouched**.
- Mechanic vs sweep: the visible moving colour-front is an **EVENT** (every 1–2s), not the perpetual uniform scroll we ship on q29=6.

### C7 — Curtain wedges / soft swath sweeps behind the action · P2 · both

- Evidence: p1 **B5** (huge **soft diagonal teal/magenta wedges** sweeping ~**0.1 frame/s** — "creates depth without camera motion", 79–82); p3 **D-SWATH** (dusty-wine swath sweeps in over **~4s** carrying the scene light transition, leaves rainbow arc bands); h2 §2.19 (valley beam X, re-tint sweeps **ALONG a beam outward from the crossing over ~5s**).
- Palette: two soft analogous tones per wedge; very low spatial frequency (one or two half-planes across the whole frame).
- Mechanic: **comp half-plane gradients**, sweeping _very_ slowly (~10 %frame/s). Injection vs sweep: a slow SWEEP layer that gives depth; not per-band.

### C11 — Floor-band / horizon-strip ground · P3 · 480p+19s

- Evidence: p1 **S4** (dark-teal "sea" silhouette with a **wavy top edge across the bottom of frame**); p1 **S5** (rose-pink floor band ~**18% frame height**, wavy top edge); r0 **bg3** (pink floor band with **left-right STREAMING** red/orange streak pigment, boundary undulating).
- Palette: one muted band colour + a slightly darker/complementary ground above; boundary undulates via low-freq fbm.
- Mechanic: **comp half-plane with an fbm-wavy boundary anchored to the bottom**, zero slot cost. The lateral-STREAMING variant (r0) leans on doc 01's lateral-displacement field (C2) — **defer the streaming to doc 01**; this doc ships only the static floor strip.

### D3 — Bars background: static bars + gold flood + trapped pigment · P2 · both

- Evidence: p1 **B9** ("**9–11 static dark vertical bars**; bars themselves **never scroll** (verified across bursts); a **gold backlight floods DOWNWARD**; old pigment **stays trapped in the gaps** as vertically-smeared colour pills"); p2 §2.9.1 (bars static in x; a bright gold band **sweeps DOWN over the bars in 1.5–2s** ≈ **50–65 %h/s**; "bars under the tangle glow with the motif's colour — the **bar mask modulates deposited paint**"); h1 **B8** (1080p mirrored-cathedral variant, pitch ~2.2% width, hourglass mask).
- Emitter-vs-trail: **the pigment-in-gaps is the TRAIL buffer** shown only _between_ the static bars (bar mask multiplies the trail); the bars + gold flood are comp paint.
- Bar count: **9–12** (we ship 22 — wrong). Motion: **static in x** + a **descending gold flood front** (not a horizontal scroll — we scroll, wrong).

### D4 — Horizontal-bands regime: mostly-static strata + injections · P2 · both · **CONFIRM (Q1)**

- Evidence: r0 §2.8.2 ("boundaries do **not** scroll continuously — colours **replace within strata** and boundaries reflow"; wavy amp 10–20px); p0 **B7** (bands "**undulate in place, no scroll**"; ground panels **hue-step every 3–5s**); p1 **B4** (the sweeping form exists but only as edge-entering **fronts** = C6).
- Steady state = undulating-in-place strata with **stepped per-band recolour** (every 3–5s); the sweep is the occasional _event_ (C6), **not** the state.
- **Reconcile with commit 302349c:** the user asked for the visible sweep — see Q1. Plan assumes we **add** this as new regime m==9 and leave q29=6's sweep alone.

### D5 — Background bag weighting: flat washes should dominate, not wavy-fluid · P2 · both

- Evidence: p1 **B2** (flat wash = "the **dominant REST regime**; truly flat, mid-dark, lets emitters own the frame" — sage/plum across 58.5–62, 76–80, 96.5–101.5); p0 **B4** (three long solid-wash scenes in 60s); p2 §2.9.3 (washes 133.5–135.5 + 147.5–174 ≈ **28.5s ≈ HALF** of the 60s segment — corrected arithmetic; the intervening chevron cascade is a band regime, not wash); h0 **bg4** (12s flat light wash with **STEPPED hue walk 0.75–1.5s apart + 0.5s fades**, 1080p).
- Current dominance is inverted (wavy-fluid 5/15, flat wash 1/15); and the flat wash's hue **drifts continuously** — it should **walk in discrete steps**.

---

## 2. Current implementation state

The 9 regimes in the q29 space (`makeComp`, `presets/alchemy-v7.js`). Dispatch structure matters:

- `m` = `floor(q29+0.5)` (L100). The **kaleido sample-fold** is a top branch at **L106–110** (`if m∈(0.5,1.5)`), applied to `suv` _before_ the trail read.
- The wavy-fluid ground is computed **unconditionally** (L119–129) as the base for m==0/1.
- **Tunnel** is a standalone `if` at **L131–136** (modifies the wavy ground).
- **A single if-else chain** covers m==3..8: **corridor** L140 `if`, then `else if` **bars L145**, **flat-wash L151**, **h-bands L157**, **bullseye L166**, and the **open-ended catch-all `else if (m > 7.5)` caustic at L174** — this catches _every_ m ≥ 8, so **adding any regime ≥ 9 requires first bounding it to `m > 7.5 && m < 8.5`** (verified L174). The kaleido colour overlay is a second top branch at L184–194.

| q29 | name                            | file:line          | matrix verdict                                                                                                                                                   |
| --- | ------------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0   | Wavy-fluid (weight 5, dominant) | L119–129           | **D5: over-weighted** — should not be the dominant rest ground; flat wash should be.                                                                             |
| 1   | Kaleidoscope                    | L106–110, L184–194 | out of cluster (C5 / doc for kaleido). C3 wallpaper reuses this _fold_ pattern.                                                                                  |
| 2   | Radial tunnel                   | L131–136           | out of cluster.                                                                                                                                                  |
| 3   | Corridor                        | L140–142           | out of cluster (doc 01 scene).                                                                                                                                   |
| 4   | Vertical bars                   | L144–149           | **D3: wrong** — 22 bars _scrolling_ at time·0.12, duo pal, **no trail interaction**. Should be 9–12 static bars + descending gold flood + trail trapped in gaps. |
| 5   | Flat wash                       | L150–155           | **D5: right idea, wrong hue motion** — hue **drifts** `sin(time·0.06)`; should **step**. And under-weighted (1/15).                                              |
| 6   | Horizontal bands                | L156–164           | **D4/C6: uniform sweep** −time·0.32 (raised in 302349c per user, L158–159 note). No fronts, no per-band injection, no undulate-in-place. **Do not modify — Q1.** |
| 7   | Bullseye rings                  | L165–169           | out of cluster.                                                                                                                                                  |
| 8   | Caustic bands                   | L170–181           | out of cluster (its catch-all bound must be tightened — see above).                                                                                              |

Not present at all: **C3** wallpaper tiling, **C4** chevron terrain, **C7** curtain wedges, **C11** floor-band, **D4/C6** static-strata-with-injections. `BG_BAG` L920 = `[0,0,0,0,0,2,2,1,3,4,5,6,7,8,1]`; `bgPick = makePicker(15, 7, 12, 3.0)` L926; q29 snaps discretely at crossfade mid (L943). GLSL helpers available (kit.js): `fbm`/`vnoise`/`hash21` (NOISE_GLSL L160–165), `pal(h)` (PAL_GLSL L166), `ctr(v,w)` (L167). Closure state block L880–917; frame() writes q29 at L942–944.

---

## 3. Implementation plan

Smallest, individually-revertible slices first. **Hard constraints (all steps):** the ground stays **data-driven via q29** (never hard-code a regime); any new cross-frame state lives in the **closure** (L880–917 block); **Pastel stays muted** (measured V~0.2 dark ground, sat 0.3–0.5 — apply the existing `desat` + `×0.14–0.17` darkening pattern, and let the trail carry the vivid colour); GLSL is one statement per concatenated line with a trailing `\n`; **never declare a local named `ang` or `rad` in `shader_body`** (reserved — redefinition kills the whole program link, see CLAUDE.md).

### Step 0 — precondition: bound the caustic catch-all (no visual change)

Edit L174 `"  else if (m > 7.5) {\n"` → `"  else if (m > 7.5 && m < 8.5) {\n"`. This is required _before_ any regime ≥ 9 exists; on its own it changes nothing (bag never emits ≥9 yet). Commit separately so later reverts don't reopen the catch-all.
_(A debug-pin hook for closure state is unneeded here — q29 is a q-var already forced directly via `window.__ALC_FORCE`; the new closure vars in Steps 3/6 are pinnable by name if doc 01/05 Step 0 landed, else assert visually.)_

### Step 1 — D5: reweight BG_BAG so flat wash dominates (data-only, zero GLSL)

Rebalance L920 so flat-wash (5) ≈ 30–40% and wavy-fluid (0) drops to a co-rest ~15–20%, leaving room for the new regimes added later. Example first cut (tune from screenshots):

```js
var BG_BAG = [5, 5, 5, 5, 0, 0, 0, 6, 4, 1, 1, 2, 7, 8, 3]; // flat-wash dominant rest ground (D5)
```

`bgPick` length is derived (`BG_BAG.length`, L926) so the array can change freely. **Revert:** restore the original 15-tuple.

### Step 2 — D5: flat-wash STEPPED hue walk (small comp + one closure var)

The wash hue should walk in discrete steps (0.75–1.5s apart, h0 bg4), not drift. Two options:

- **In-shader (preferred, no state):** in the m==5 branch (L152) quantise time before the sin phase:

```glsl
float wt = floor(time * 0.8) * 1.25;
```

```glsl
ground = mix(pal(hb + floor(wt*3.0)*0.0), pal(hb + 0.13), 0.5 + 0.5 * sin(wt));
```

(step cadence ~0.8/s; keep the existing `desat 0.5` + `×0.15` darkening lines L153–154 verbatim so it stays Pastel-muted.)

- **Closure (higher fidelity, if the in-shader steps read too regular):** add `washHueStep`, `washHueT0` to the closure; step by a random ±0.08–0.15 every 0.75–1.5s; feed as an _additive_ hue offset only while `bgMode===5`. Prefer the in-shader version first.
  **Revert:** restore L152's original `sin(time*0.06)` line.

### Step 3 — D3: rework vertical bars → static bars + gold flood + trapped pigment (in-place)

Rework the m==4 branch (L145–149). Not the user-protected sweep (that's m==6). Three sub-changes, each a line:

- **Static, 9–12 bars:** drop the `+ time*0.12` scroll and the count 22:

```glsl
float bars = pow(0.5 + 0.5 * cos(uv.x * 10.0 * 6.2832), 1.3);
```

- **Descending gold flood front:** a soft bright band sweeping down at ~50–60 %h/s (period ~1.8s):

```glsl
float flood = smoothstep(0.35, 0.0, abs(fract(uv.y + time * 0.55) - 0.5));
```

```glsl
ground = mix(pal(hb + 0.5), pal(hb + 0.04), bars) * (0.06 + 0.14 * bars);
```

```glsl
ground += pal(hb + 0.12) * flood * (0.10 + 0.10 * bars) * 0.6;
```

- **Trapped pigment (trail shown only in the gaps):** the trail is read once at L113 before the branches; add a bar mask that suppresses trail _on_ the bars. Simplest: after the ground branches, before the composite (L200), multiply the trail by a mask that is 1 in the gaps and dim on the bars **only when m==4**:

```glsl
float barGap = (m > 3.5 && m < 4.5) ? (0.35 + 0.65 * (1.0 - bars)) : 1.0;
```

```glsl
trail *= barGap;
```

(insert the `trail *= barGap;` immediately before L200's `vec3 col = ...`; `bars` must be hoisted to function scope or recomputed — recompute cheaply inside the guard to avoid scope churn.) Keep Pastel dark (`×0.06–0.20`). **Revert:** restore L145–149 and remove the two trail lines.

### Step 4 — C7: new regime m==10 curtain wedges (comp half-plane, zero slot)

Add after Step 0's bounded caustic branch:

```glsl
else if (m > 9.5 && m < 10.5) {
```

```glsl
float w = dot(uv - 0.5, vec2(0.7, 0.7)) + sin(time * 0.06) * 0.25;
```

```glsl
vec3 wedge = mix(pal(hb + 0.08), pal(hb + 0.42), smoothstep(-0.25, 0.25, w));
```

```glsl
float gl = dot(wedge, vec3(0.333)); ground = mix(vec3(gl), wedge, 0.45) * 0.16;
```

```glsl
}
```

(one diagonal soft boundary sweeping at ~0.06/s ≈ 10 %frame/s per p1 B5; muted via desat 0.45 + ×0.16). Add `10` to `BG_BAG`. **Revert:** delete the branch + the bag entry.

### Step 5 — C11: new regime m==11 floor-band / horizon strip (comp half-plane + fbm boundary)

```glsl
else if (m > 10.5 && m < 11.5) {
```

```glsl
float edge = 0.18 + 0.06 * fbm(vec2(uv.x * 3.0 + time * 0.05, 1.7));
```

```glsl
float floorMask = smoothstep(edge + 0.02, edge - 0.02, uv.y);
```

```glsl
vec3 floorCol = pal(hb + 0.5) * 0.20, skyCol = pal(hb + 0.06) * 0.10;
```

```glsl
ground = mix(skyCol, floorCol, floorMask);
```

```glsl
}
```

(bottom band ~18% height with a low-freq wavy top edge, per p1 S4/S5; boundary undulates via `fbm`; muted.) Add `11` to `BG_BAG`. The lateral-STREAMING variant (r0 bg3) is **deferred to doc 01** (C2 lateral displacement). **Revert:** delete branch + bag entry.

### Step 6 — D4/C6: new regime m==9 static strata + injection front (**CONFIRM Q1 first**)

Only after Q1 lands as option (a). Add regime m==9 = undulating-in-place strata with per-band stepped recolour + an occasional descending injection front. **Step 6a (in-shader, no state — ship this first):**

```glsl
else if (m > 8.5 && m < 9.5) {
```

```glsl
float yb = uv.y * 5.0 + sin(uv.x * 2.0 + time * 0.1) * 0.12;
```

```glsl
float band = floor(yb);
```

```glsl
float stepc = floor(time / 4.0);
```

```glsl
float bh = hb + hash21(vec2(band, stepc)) * 0.3;
```

```glsl
float front = smoothstep(0.30, 0.0, abs(fract(uv.y + time * 0.35) - 0.5));
```

```glsl
vec3 bc = pal(bh);
```

```glsl
float gl = dot(bc, vec3(0.333)); ground = mix(vec3(gl), bc, 0.6) * (0.14 + 0.10 * front);
```

```glsl
}
```

(strata **undulate in place** — no `-time` scroll; per-band hue **steps** every ~4s via `floor(time/4)`; the injection front descends at ~35 %h/s and _brightens_ the band it passes, per r0 §2.8.2 / p1 B4; muted ×0.14.) Add `9` to `BG_BAG`.
**Step 6b (closure-state event cadence — fidelity upgrade if 6a reads too metronomic):** add `injT0=-9`, `injActive=false`, `injFrontY` to the closure; fire an injection every 1–2s with jitter, ease `injFrontY` down over ~1s, and drive the front via a regime-multiplexed q-var (reuse **q13**, which is 0 outside kaleido — same pattern as L990–991). **⚠ q13 contention:** doc 01 Step 7 also repurposes q13 (radial ripple, non-kaleido). Coordinate: gate doc 01's ripple `q13` read to exclude `m==9`, or route the injection front through a different channel. Flag this if both docs land. **Revert:** delete branch + bag entry (+ closure vars for 6b).

### Step 7 — C3: new regime m==12 wallpaper tiling (sample-coord fold, zero slot)

Mirror the kaleido fold pattern. Add a **suv fold** branch near L110 (before the trail read):

```glsl
if (m > 11.5 && m < 12.5) {
```

```glsl
vec2 wc = (uv - 0.5) * 6.0; wc.x *= asp;
```

```glsl
wc = fract(wc) - 0.5; wc.x /= asp;
```

```glsl
suv = clamp(wc * 0.25 + 0.5, 0.0, 1.0);
```

```glsl
}
```

(a 6×6 grid of miniature copies of the live centre window — p3 D-WALL's ~14×11 scaled down for legibility; the grid does not scroll.) No ground overlay needed (the tiled trail _is_ the image); optionally dim the base ground `×0.1` under m==12. The **hue SNAPS** (<0.25s every 0.5–1.5s) come from a small closure add mirroring the existing beat hue-snap (L959–962) but time-gated — reuse the `lastHueSnapT` limiter or add `wallSnapT0`, applied only while `bgMode===12`. Add `12` to `BG_BAG`. **Revert:** delete the fold branch + bag entry + hue-snap add.

### Step 8 — C4: chevron terrain COMP ground (defer the warp to doc 01) · risk (4)

The faithful chevron shear is doc 01 Step 6's warp term (ships dormant; frees q12). Do **not** duplicate it. This doc's optional slice is a **static sawtooth-edged band ground** as a new regime m==13, giving the chevron _look_ with zero warp risk:

```glsl
else if (m > 12.5 && m < 13.5) {
```

```glsl
float tooth = abs(fract(uv.x * 8.0) * 2.0 - 1.0) * 0.06;
```

```glsl
float yb = uv.y * 5.0 + tooth;
```

```glsl
vec3 bc = mix(pal(hb), pal(hb + 0.3), 0.5 + 0.5 * sin(yb * 3.14159));
```

```glsl
float gl = dot(bc, vec3(0.333)); ground = mix(vec3(gl), bc, 0.62) * 0.14;
```

```glsl
}
```

Land this **only after** doc 01 Step 6's shear warp exists, so the comp ground and the sheared trail reinforce. Add `13` to `BG_BAG`. **Revert:** delete branch + bag entry.

---

## 4. Verification recipe

Per CLAUDE.md, in order, for every step:

1. **Syntax:** `for f in presets/*.js; do node --check "$f" || break; done` (or `npm test`).
2. **Concat smoke test** (mirrors the browser's shared global scope; builds every preset + runs each `frame_eqs` — catches missing kit refs / throwing eqs):
   ```bash
   node -e 'const fs=require("fs"),vm=require("vm");global.window=global;
     const cat=["kit","dance","alchemy-v7","ambience","battery"].map(f=>fs.readFileSync("presets/"+f+".js","utf8")).join("\n;\n");
     vm.runInThisContext(cat);
     let n=0; for(const [k,p] of Object.entries(window.WMP_PRESETS)){ if(p.frame_eqs) p.frame_eqs({time:2,bass:1.3,bass_att:1.1,mid:1,treb:1,treb_att:1}); n++; }
     console.log("ok", n, "presets");'
   ```
   (adjust the family list to the actual files present; alchemy-v7 must be included.)
3. **Headless ANGLE shader pre-check (mandatory for every step that edits GLSL — Steps 2–8).** GLSL cannot compile in Node; extract the `makeComp` string, wrap it as a standalone fragment, and compile+link through ANGLE via the chrome-devtools MCP. **Crucially mimic Butterchurn's generated `main()`**: start the body with the predeclared locals (`vec3 ret; float rad=…; float ang=…; vec2 uv=…; float time=…; float q1..q32=…;`) — a bare wrap hides the reserved-name redefinition bug. `createProgram`+`linkProgram`+`validateProgram` in both `webgl`/`webgl2` and read `getShaderInfoLog`/`getProgramInfoLog`. Confirms the new `else if` chain + fold branches link before any reload. (In-browser fallback: the `[WMP-viz shader]` compileShader hook in viz.js prints numbered driver errors in the viz.html frame console.)
4. **Self-render, pinning q29 per regime** via `window.__ALC_FORCE` (see the scratchpad `pinrender.mjs` pattern; q29 pins directly, closure vars pin by underscore-key if doc 01/05 Step 0 landed):
   ```bash
   ALC_FORCE='{"q29":5}'  node tools/selfrender.mjs   # Step 1/2 flat wash — hue must STEP, not drift
   ALC_FORCE='{"q29":4}'  node tools/selfrender.mjs   # Step 3 bars — ~10 static bars, gold flood descends, pigment only in gaps
   ALC_FORCE='{"q29":10}' node tools/selfrender.mjs   # Step 4 curtain wedge — one soft diagonal, barely moving
   ALC_FORCE='{"q29":11}' node tools/selfrender.mjs   # Step 5 floor band — bottom ~18% strip, wavy top edge
   ALC_FORCE='{"q29":9}'  node tools/selfrender.mjs   # Step 6 strata — undulate in place, band hues step, front sweeps down
   ALC_FORCE='{"q29":12}' node tools/selfrender.mjs   # Step 7 wallpaper — grid of live-centre copies, hue snaps
   ALC_FORCE='{"q29":13}' node tools/selfrender.mjs   # Step 8 chevron ground — sawtooth band edges
   ```
   (grab a few frames a second apart to confirm the intended motion/steps; verify Pastel stays dark/muted — spot-measure with `ffmpeg -i frame.png -vf "crop=iw*0.6:ih*0.55:iw*0.2:ih*0.18,signalstats,metadata=print" -f null -` → YAVG ~60–110, SATMAX ~32–68, per alc-colors-were-washed-out).
5. **One screenshot-visible acceptance check per step** (see §6) before committing.

---

## 5. Risks & rollback

- **Risk flag (4) — C4 (Step 8) only.** The chevron _shear_ is a feedback-warp change of the class the user rejected wholesale (the motion rework → `alchemy-motion.js`). **Mitigation:** this doc never touches the warp — the warp shear is doc 01 Step 6 (ships dormant). Step 8 here is a COMP-only static ground; land it last and only after doc 01's warp exists.
- **D4 / commit 302349c tension (the load-bearing reconciliation).** `302349c` raised q29=6's band drift to 0.32 _at the user's request_ (catalog L158–159 note; memory: user asked for sweeping bands). The refs want mostly-static strata. **Do not silently revert 302349c.** Plan default (Q1 option a): add the static/injection behaviour as a **new** regime m==9 and leave q29=6 untouched — so both the user's sweep and the reference behaviour coexist and the bag picks between them. Only implement Q1 (b) (slow/replace the sweep) if the user explicitly chooses it.
- **Catch-all regression (Step 0).** If Step 0 is reverted while a regime ≥ 9 remains in the bag, those regimes fall into the caustic branch (wrong ground, not a crash). Keep Step 0 as its own commit and never revert it while ≥9 regimes exist.
- **q13 contention (Step 6b).** Shared with doc 01 Step 7's ripple; coordinate the gate (see Step 6b). Low-probability collision but flagged.
- **Pastel wash-out (D3/D4/D5/C7).** Extra bright grounds risk the neon-white trap. Mitigation: keep every new ground on the `desat + ×0.14–0.17 + let-the-trail-carry-colour` pattern; verify YAVG/SATMAX with the ffmpeg probe in §4.5. Never lift highlights.
- **Rollback plan:** **one commit per step**, each self-contained and revertible with `git revert`. Suggested messages:
  - `alchemy: bound caustic bg branch (m<8.5) — precondition for new grounds`
  - `alchemy(D5): reweight BG_BAG — flat wash dominant rest ground`
  - `alchemy(D5): flat-wash hue WALKS in steps, not continuous drift`
  - `alchemy(D3): bars static + descending gold flood + trail trapped in gaps`
  - `alchemy(C7): curtain-wedge bg regime (q29=10)`
  - `alchemy(C11): floor-band / horizon-strip bg regime (q29=11)`
  - `alchemy(D4/C6): static-strata + injection-front bg regime (q29=9)` _(gated on Q1=a)_
  - `alchemy(C3): wallpaper-tiling bg regime (q29=12)`
  - `alchemy(C4): chevron sawtooth-band ground (q29=13)` _(after doc 01 shear warp)_

---

## 6. Acceptance criteria

Observable outcomes vs the references (one per step):

- **D5 weighting (Step 1):** over a ~2-min self-render, flat-wash/wavy-fluid time share is _inverted_ from today — flat wash is the most-seen rest ground (~1/3), wavy-fluid a co-rest, matching p2's ≈half-runtime washes.
- **D5 stepped hue (Step 2):** the flat wash's colour changes in _discrete jumps_ (~0.75–1.5s apart) with brief fades, not a smooth continuous drift (h0 bg4).
- **D3 bars (Step 3):** **9–12** bars, **static in x** (no horizontal scroll across frames); a **gold band sweeps downward** in ~1.5–2s; motif/tether pigment appears **only in the gaps between bars**, dim on the bars themselves (p1 B9, p2 §2.9.1). Pastel stays dark.
- **C7 wedges (Step 4):** one/two **huge soft diagonal wedges** creep across at ~10 %frame/s — depth without any camera move; no hard edges (p1 B5).
- **C11 floor-band (Step 5):** a **bottom strip ~18% of frame height** with a **low-freq wavy top edge** that undulates; distinct from full-frame bands (p1 S4/S5).
- **D4/C6 strata (Step 6):** bands **undulate in place** (boundaries reflow, do NOT scroll uniformly); individual bands **recolour in steps** every ~3–5s; an **injection front descends band-by-band** as an occasional event (r0 §2.8.2, p0 B7) — and q29=6's user-requested sweep is **unchanged**.
- **C3 wallpaper (Step 7):** the frame becomes a **grid of miniature copies of the live centre**; the grid does **not scroll**; the global hue **SNAPS** every ~0.5–1.5s (p3 D-WALL).
- **C4 chevron (Step 8):** bands carry **sawtooth (chevron) edges**; combined with doc 01's shear warp, landing stamp-trails read as **zigzag ribbons** (p2 §2.6).
- **Global:** every new ground is data-driven via q29 (pinnable by `window.__ALC_FORCE`); Pastel measures YAVG ~60–110 / SATMAX ~32–68 (never neon-white); no GLSL link warnings in the viz.html console.
