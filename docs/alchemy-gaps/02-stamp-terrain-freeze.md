# 02 — Stamp accumulation: terrain from dead stamps, freeze & sink, harp swaths, scallop mountains

> **★ LANDED (2026-07-09, 4 commits `85c8f30`→`2d3c057`):** steps 1–4 implemented, one commit per
> step, npm-test + pinned self-renders per step. Sink impulse (B3) · fMountains one-crest rework
> (D11) · harp swath = accessory type 5 w/ `FORCE.swath` pin (A3; live-strand floor 0.18, blur cut
> 0.85 — tuned so the copies stay discrete) · scallop marcher = **motif mode 19** (NOT the in-doc
> 17 — spiro/cocoon landed first; README landing-order rule). **Step 5 re-tint = SKIPPED** per the
> answered README Q2 (never recolour the buffer). **Awaiting the per-step LIVE looks** — step 3
> (accessory layer) needs the closest scrutiny; each commit reverts independently.

**Matrix items:** B3 (P1) · D11 (P2) · A3 (P1) · A10 (P2) · **Priority:** P1 cluster ·
**Risk flags:** (4) on B3/D11/A3 — warp + accessory-layer changes are the rejected-rework class (`9ba675e`): ship ONE step at a time, user-verified live between commits; (1) on A10 — the refs' bead-stack terminals are skipped here (no dots, no filled beads; route later per A4 / doc 07); (6) implicit — frozen deposits live longer, so keep the Reinhard headroom (never raise trail gain or q31). ·
**Confirmation needed:** yes, ONE question, and only for the optional Step 5: *"The 19s clip (r0 2.4) shows the whole terrain re-tinting in place over ~1s, but four other reports agree deposits never retro-change hue (gap-matrix A14 resolution: keep hue-frozen trails). If you want the re-tint, OK to fake it as a fresh overdraw sweep (new-hue ridge stamps re-tracing the pile over ~1s) rather than recolouring the buffer — or skip it entirely?"* Steps 0–4 need no pre-confirmation, only the per-step live look required by risk (4).

**The one mechanism this whole doc implements** (measured, not inferred): the original never draws N strands or N ridge rows. It draws **ONE live 1–2px emitter strand** and lets the feedback buffer accumulate FROZEN copies of it — terrain = stacked dead waveform/tether stamps stepped DOWN 20–40px per generation; harp fans = frozen trail copies of one sweeping pinned strand; mountain-row backgrounds = ~10s of scallop-wave stamps at changing heights. Implement everything below as *1 wave + a feedback field*, never as N drawn strands.

**Dependency:** this doc is the *content* riding on the *engine capability* built by
`docs/alchemy-gaps/01-camera-displacement-engine.md` — specifically its **Step 0** (`__ALC_FORCE` closure-pin hook at the top of `frame()`) and **Step 2** (FREEZE field: `freezeAmt` gated on motif 14 → blur ~off `q28→0.08`, decay `q1→0.974`, pan/roll damped). If doc 01 has not landed yet, land those two steps first (copy their blocks verbatim from doc 01 §3) — nothing here works while the unconditional compounding blur (L63–74) diffuses every stamp within ~1.5s.

---

## 1. Reference behaviour (what the original does)

Pixel sizes below are as reported by the analysts; the 480p reports measure on a ~640×480 frame (so 100px ≈ 21% of frame height ≈ 16% of width), h2 on 1280×720.

### B3 — Terrain genesis: stacked dead emitter copies + live crest over frozen peaks (P1, both refs)

- **p1 S6 (480p, 76–80.5s, "signature scene"):** phase 2 (78.3–80.5) = a **full-width LIVE waveform chord between two milky-white orbs** (17–19% dia, each wrapped in 2 offset gold rings): 1–2px gold core + 2–3 fainter parallel ghost copies; jag amplitude envelope calm at the orb endpoints, up to ~50px (≈10% h) mid-span. **"Old chord copies displace DOWN 20–40px per stamp and get S-warped + blurred into a flame-like gold mountain range filling the lower half. Emitter colour SNAPS gold→green (t≈79.4)→teal (t≈80.1) while the trail pile keeps its old gold — hue ages in place, never retro-tinted."**
- **p1 S14 (480p, 112.6–115.3s, "terrain genesis observed"):** t=112.75 stamp: orange disc orbs at UL and LR + a single cyan-green LIVE chord spanning the ~75% diagonal. **"Within 0.5s the chord's per-stamp copies sag downward into a 4–6 strand draped-rope cascade (each older strand displaced ~30–50px down, darker/softer; staircase steps), building a rope-pile terrain — direct capture of terrain = stacked dead tethers."** Camera static.
- **r0 2.4 (19s colour-accurate clip, 14.8–19.6s):** terrain is **"NOT drawn geometry — an accumulation"**: stacked live waveform bundles (gold, 8+ strands at slight vertical offsets, each reshuffling per frame) are laid along a mid-frame band for ~1s (15.2–16.2); **their ghosts freeze into spiky peak silhouettes; peaks persist ≥3.5s, slowly blurring and recolouring in place (camtest_terrain: NO translation).** Crest lines: 1–2px green/cream **live waveforms tracing ridge tops per frame** (wavetest_crest_16.0: teeth reshuffle each frame **over static peaks**). Whole terrain re-tints mint/teal+orange at ~17.5 (in place, ~1s — the CONFLICTED observation, see Step 5).
- **p2 2.8 (480p, S8 171–174s):** pigment-mountain wedge filled with marbled multi-hue pigment ("all prior deposits"), interior churning, edge static; 2–3 live waveform snakes crawl across it, depositing.
- **p3 D-MTN (480p, 171–175s):** "mountains ARE accumulated waveform trails: 2–3 live jagged ~2px strands trace the ridge; the mass below is their blurred, hue-marbled feedback fill" — main mass ~60% of frame width. **Venetian comb:** ~15–20 evenly spaced (~4–6px pitch) straight thin parallel copies of the ridge line = "the ridge re-stamped per frame while the field displaces perpendicular, with LOW blur → discrete comb."
- **Emitter-vs-trail, explicit:** the emitter (chord/ridge line) is live and pinned; ALL terrain mass is its trail. The downward 20–40px generation gap is a **stamp-synchronized displacement step** of the whole buffer, not continuous scroll — that is how p1's "displace down per stamp" and r0's "peaks do NOT translate" (between stamps / after the emitter stops) are both true.

### D11 — Waveform-mountains mode: accumulation, tilt, pinch envelope (P2, 480p)

- **p2 2.7 (480p, S7 160–171s):** LIVE oscilloscope traces 2–3px, teeth 15–60px (3–12% h), dense sub-teeth, reshuffling EVERY frame. **Composition: a straight chord ("rail") tilted ~35–45°; the waveform is displaced perpendicular to it; the amplitude envelope is pinched at points, producing triangular "peaks."** A strand-fan flag (~10–14 straight 1px gold strands fanning from an apex, angular pitch 4–6°) = **the trail of the pivoting chord**. Trail: stacked older traces blur into puffy ribbon clouds 80–100px wide, hue LAGGING the fresh trace (green fresh over pink/cream old at 168–170). Fresh-trace hue: ~12–15s wheel walk with event snaps (navy SNAP at the 166.5 balloon event).
- r0 2.4 as above (live crest re-jags over static frozen peaks; no translation).

### A3 — Harp swath / pinned-apex strand fan = frozen trail copies (P1, both refs)

- **p0 M6 (480p, 16.75–23.5s; stills 17.5/19.0; measured at wavetest_21):** a triangular fan of **14–24 parallel gently-wavy strands** (each ~2–3px; waviness wavelength ~50px, amp 4–6px), **apex PINNED at the upper-right terminal orb**, lower ends fanning down-left with **10–20px spacing**; **two interleaved colour families** (gold+indigo at 19s; green+indigo at 17.5/22.5). **MECHANISM (measured): "the parallel strands do NOT re-jag — they are FROZEN TRAIL COPIES of one moving chord; only the newest edge strand is live. The fan = a strand whose free end sweeps while the other end stays pinned, stamping copies."** Decay: older strands blur/dissolve over ~4–6s; **a spent violet fan lingers ~8s while a fresh green fan regenerates on top** (t=22.5).
- **r0 2.2 (0–4s + 8.2–14.6s):** 8–10 near-parallel strands converging to a wandering vertex; spacing 12–25px; strands undulate with ALIGNED phases (wavelength 30–40px, amp 5–8px) — **clocked, not audio** (wavetest_tether_14.2: strands do not reshuffle). Pivot ~15–20°/s; ghost copies trail laterally behind the sweep; **whole-family hue SNAPS** teal→orange→green→gold→red-pink; from ~12.8 **the family THREADS THROUGH the two hollow-ring orb heads — endpoints anchor on the dumbbell rings.**
- **p2 2.5 (480p):** comb-fan curtains: 15–25 parallel 1px lines, pitch 3–5px, wedges converging on a vertex; **the vertex travels, sweeping the curtain across ~40% frame in ~1.5s**; trails become soft moiré ripples.
- **h2 2.11/2.12 (1080p):** net fan-sheets: 40–60 rays per sheet pivoting at a bright knot; spread opens/closes ~1s; **sheets slide 10–15% frame/s and re-tint (cream→gold) as they sweep.** Crimped-string curtains = "the trail of a sweeping crimped string" stamped in rows (ripple period 14–18px).
- **Emitter-vs-trail, explicit:** ONE strand, apex pinned (to an orb), free end sweeping ~10–20°/s, stamping discrete copies; the fan is entirely feedback. Lifetime of a fan: 5–20s (vs our curtain's 1.6s).

### A10 — Marching scallop wave → mountain-row builder (P2, 480p)

- **p0 M2 (480p, 4–6s, still_4.8):** **"ONE waveform line marching diagonally (LL→UR), drawn as big smooth scallops: period 70–90px (~11–14% w), amplitude 80–100px (~17–21% h); crisp mint core 2–3px with bright rim; 3–5 lagging copies hang BELOW it, each displaced ~8–15px down, dimmer/blurrier, with magenta chromatic ghosting between copies."** Terminals: 4–6 bead stacks + ringed orb (~22px) — **skipped in this doc** (risk 1; route via A4/doc 07). Waveform test AMBIGUOUS: teeth are rounded and evenly spaced (heavily smoothed audio or a clock) but "fine detail on the crests does re-arrange per frame" → treat as **high-smoothing audio (wave_smoothing≈0.8 equivalent)**.
- **p0 S2 + B2 (7.5–15.5s):** **"the olive 'mountain rows' bg of S2 is literally the accumulated trail of these zigzag stamps (emitters at different heights over ~10s)"**; stacked soft zigzag trail rows (teeth 40–90px), olive/tan/blue, sagging downward slowly.
- **p0 M2 stereo pair (8–11s, still_9.5):** "bright green zigzag + crimson zigzag drawn adjacent — **likely L/R stereo channels as two hues**."
- **Emitter-vs-trail, explicit:** one scallop line whose arch pattern marches along the diagonal and whose row height changes over ~10s; the mountain-row background is 100% its accumulated trail under a downward-stepping field.

---

## 2. Current implementation state

All refs verified against `presets/alchemy-v7.js` @ HEAD (`4db3368`, file 1374 lines).

- **Feedback engine `WARP_V7` (L43–76):** decay `q1=0.957` (L969), **unconditional** compounding 9-tap blur radius `2.4+2.2·q28` with `q28=0.5` (L63–74, L970), tiny magnify (L973), roll (L974), abrupt-snap pan that never rests (L977–981; note the `−0.0012` q19 bias at L981 is a DOWNWARD stream — the code comment saying "up" is wrong, per doc 01). Under this single always-on program **nothing can hold crisp ≥3s and stamps can never stack discretely** — the core blocker for all four items. Doc 01 Step 2 fixes this for motif 14 (`freezeAmt`).
- **Mountains motif, mode 14 `fMountains` (L743–763):** draws **4 stacked horizontal ridgelines, ALL live every frame** (`ROWS=4`, rowY at L751, ridge `|value1|·q6·3.2` L750/752, hue `q8+row·0.08` L757). No freeze, no tilt, no pinch envelope, no stamp cadence, no per-stamp emitter hue step. It draws the *skeleton* of the look; the *body* (frozen pile + live crest) is absent. Mode table: `MODES` L807–825 (17 entries), `MODE_ALPHA` L827–831 (mode 14 = 0.66), `scaleFor` L832–834, dispatch `centralDraw` L835–847, `MOTIF_BAG` L923–925 (25 entries, one `14`), `motifPick = makePicker(MOTIF_BAG.length, 6, 11, 2.0)` L927 — bag length is derived, so adding a mode is safe.
- **Tether waves[2] (L1266–1287, geometry `fTether` L852–878):** double-stroke live waveform between the orbs; alpha = both-orbs gate (L1281) × max(beat flash `q32` L1282, corridor L1283). **Already a discrete stamp EVENT** — under a sink field it becomes p1-S14 terrain with zero new geometry (Step 1's payoff).
- **Accessory slot waves[1] (dispatch L1180–1264):** director at L1063–1096; roll table L1067 (`none .32 / ray-curtain .20 / bundle .22 / pinwheel .26`); **ray-curtain branch L1225–1245 = 16 DRAWN parallel rays, one-shot sine envelope over 1.6s** (`clife` L1080–1081), pivot 0.8 rad while alive (L1086). This is the wrong mechanism class for A3: N drawn strands, 1.6s life, free-floating pivot (`accLineX/Y` random, L1071–1072), no pinned apex, no frozen copies, one hue family (`q8+0.24`, L1236).
- **No scallop/marching emitter exists** (A10): nothing in `MODES` translates or builds background rows.
- **Directors/state:** closure state block L880–917 (new cross-frame state goes here); beat flash `f` + smoothed `pulse` L937–939; rest breathing L1048–1059 (`restAmt`, `accVis`); corridor coupling L1106–1124; valley L1129–1134; `__ALC_FORCE` q-var hook L1136–1140 (doc 01 Step 0 adds the closure-pin variant at ~L931).
- **Reusable:** the beat flash (stamp trigger), the tether-as-event, `orbCol` palette (L252–254), the accessory director clock (5–11s dwell — right lifetime for A3), the orb anchors `q21/q22` (A3's pinned apex), `value2` (unused today — A10's stereo pair), doc 01's `freezeAmt`.
- **Budget ledger today (catalog §7):** waves[0] motif · waves[1] accessory · waves[2] tether · waves[3] corridor-only · shapes[0..3] orbs+halos, fully committed.

## 3. Implementation plan

**Slot budget (explicit): ZERO new wave or shape slots.** Mode-14 rework and the new scallop mode live on **waves[0]** (motif slot); the harp swath is a new branch of the **waves[1]** accessory dispatch; **waves[2]** tether is untouched in code (it *contributes* terrain via the field); **waves[3]** and all 4 shapes untouched. No dots anywhere (dots render ~2px fixed); A10's bead-stack terminals are explicitly skipped. **Zero new q-vars** — all 32 are taken; every new cross-frame value below is a file-closure var (point fns share the IIFE scope, like `accLine`); the field changes ride the EXISTING shader inputs `q1/q18/q19/q28` written from `frame()`.

New closure state (declare next to `valleyAmt`, L889): `lastMotif = -1, sinkImp = 0, mtTilt = 0, mtPinchPhase = 0, mtStampT = -9, mtStampEnv = 0, mtHueStep = 0, swathAmt = 0, accSwathTick = -9, accSwathFam = 0, accSwathEnv = 0, scRowOff = 0, scRowT = -9`.

### Step 0 — prerequisite (doc 01 Steps 0 + 2)

Land doc 01's `__ALC_FORCE` closure-pin hook (top of `frame()`, ~L931) and its FREEZE field (`freezeAmt` eased on `mCur===14`: `q28→0.08`, `q1→0.974`, `q15→0`, pan ×(1−0.92·freezeAmt), roll ×(1−0.8·freezeAmt); block placed after L987). Skip if already committed. Everything below assumes `freezeAmt` exists.

### Step 1 — terrain SINK impulse (B3's smallest shippable slice: stacked dead tethers for free)

*Target:* `frame()`, immediately after the freeze block; stamp trigger next to the motif-pick block (after L995 where `mCur` is known).
*Change:*

```js
// B3 terrain SINK: each STAMP steps the whole buffer DOWN one generation (p1 S6: copies
// displace down 20-40px per stamp; r0: peaks do NOT translate BETWEEN stamps). The sink is
// a per-stamp decaying impulse, NOT a constant scroll — frozen peaks stay put when quiet.
if (mCur === 14 && f > 0.7 && time - mtStampT > 0.6 && restAmt < 0.5) {
  mtStampT = time;                       // stamp event (Step 2 reuses this for hue + brightness)
  sinkImp = 1;
}
sinkImp += (0 - sinkImp) * Math.min(1, dt * 4); // ~0.25s release
// negative q19 streams the buffer DOWN (the L981 -0.0012 bias is a downward stream — doc 01);
// integrated step ≈ 0.0042·60·0.25 ≈ 0.06 UV ≈ 30px at 480p — the measured 20-40px generation gap.
t.q19 -= 0.0042 * sinkImp * freezeAmt;
```

*Composes:* rides doc-01's freeze (low blur keeps the stepped copies DISCRETE — the p3 venetian comb); the stamp trigger is beat-gated so **rests starve the terrain** (B6-compatible); tune 0.003–0.006 by eye. The existing tether beat flash (L1282) now deposits draped-rope cascades between the orbs during mode-14 dwells — p1 S14 exactly, zero new geometry.
*Gate / revert:* entirely inside `freezeAmt` (motif 14); one-commit revert.
*Note:* p1's "S-warped" copies need doc-01 Step 6's shear term — do NOT build shear here; when that lands, a small shear scaled by `sinkImp` is a one-line follow-up.

### Step 2 — `fMountains` rework: ONE live crest + pinched peaks + tilt + per-stamp emitter hue (D11 + B3 emitter)

*Target:* replace the body of `fMountains` (L743–763); roll/scheduler additions in `frame()`.
*frame() additions* (next to the Step-1 trigger):

```js
if (mCur === 14 && lastMotif !== 14) {          // roll per-dwell identity ON ENTRY
  mtTilt = Math.random() < 0.4 ? 0 : (Math.random() < 0.5 ? 1 : -1) * (0.6 + 0.18 * Math.random()); // 0 or ~±35-45deg (p2 2.7)
  mtPinchPhase = Math.random() * 6.2832;
  mtHueStep = 0;
}
lastMotif = mCur;
// per-stamp emitter hue STEP (p1: emitter snaps gold->green while the pile keeps old gold —
// the pile keeps its hue for free because the trail buffer is hue-frozen)
if (mCur === 14 && mtStampT === time) // just stamped (Step 1 set it this frame)
  mtHueStep += (0.06 + 0.09 * Math.random()) * (Math.random() < 0.5 ? -1 : 1);
mtStampEnv = Math.max(0, 1 - (time - mtStampT) / 0.18); // bright stamp window
```

*Point fn* (ES5, replaces L743–763 — one ridge, two stereo strands, perpendicular displacement on a tiltable rail):

```js
function fMountains(a) {
  var s = a.sample || 0;
  var strand = s < 0.5 ? 0 : 1, u = (s - strand * 0.5) * 2; // 2 strands x 256 samples (stereo, p2 draws bundles)
  var R = a.q5 || 0.4, W = R * 2.4;
  var ct = Math.cos(mtTilt), st = Math.sin(mtTilt);
  var pinch = Math.abs(Math.sin(u * 3.14159 * 3.5 + mtPinchPhase)); // envelope pinched -> triangular peaks (p2 2.7)
  var v = (strand ? a.value2 : a.value1) || 0;                       // REAL waveform (live crest, r0)
  var ridge = Math.abs(v) * (a.q6 || 0.05) * 4.0 * (0.35 + 0.65 * pinch);
  var lx = (u - 0.5) * W, ly = -ridge + strand * 0.005;
  var cx = a.q2 !== undefined ? a.q2 : 0.5, cy = a.q3 !== undefined ? a.q3 : 0.5;
  a.x = cx + lx * ct - ly * st;
  a.y = cy + lx * st + ly * ct;
  var h = (a.q8 || 0) + mtHueStep + strand * 0.07;
  a.r = orbCol(h, 0); a.g = orbCol(h, 0.33); a.b = orbCol(h, 0.67);
  a.a = (u < 0.02 || u > 0.98) ? 0 : (0.4 + 0.6 * mtStampEnv); // dim live crest + bright per-stamp deposits
  return a;
}
```

*Composes:* the pile below the crest is now 100% buffer (Step 0 freeze + Step 1 sink); the crest re-jags per frame over static peaks (r0's wavetest); MODE_ALPHA[14] may need 0.66→~0.75 since one ridge replaces four (check in self-render). The rail is tilt-rolled per dwell; a future follow-up (doc 07 / D15 orb posts) can anchor the rail to the orb pair instead — do not do it now (orbs still snake-orbit).
*Gate / revert:* q30===14 only; single commit.

### Step 3 — A3 harp swath: accessory type 5 (ONE pinned sweeping strand + frozen copies)

*Target:* accessory roll L1067; sweep state L1080–1087; new branch in the waves[1] dispatch (insert before the `accLine === 1` branch at L1225); a mini-freeze block with the other fields.
*Director changes:*

```js
// L1067 -> carve swath (5) from curtain/bundle/pinwheel; none stays 0.32:
accLine = rl < 0.32 ? 0 : rl < 0.44 ? 1 : rl < 0.6 ? 5 : rl < 0.78 ? 2 : 4;
if (accLine === 5 && corridorAmt > 0.1) accLine = 1; // corridor forces its own pan — no swath there
// sweep (with the accLineRot computation): free end sweeps ~15deg/s with a slow wander (r0: 15-20deg/s)
if (accLine === 5) accLineRot = accLineAng + (time - accLinePickT) * 0.26 * (accLineDrift < 0 ? -1 : 1) + 0.15 * Math.sin(time * 0.5);
// stamp TICKS: a discrete copy every ~0.18s, alternating the two colour families (p0: gold+indigo interleaved).
// spacing = sweep 0.26 rad/s x 0.18s x ~0.4 UV strand ≈ 0.019 UV ≈ 10-15px — the measured 10-20px pitch.
if (accLine === 5 && time - accSwathTick > 0.18) { accSwathTick = time; accSwathFam = 1 - accSwathFam; }
accSwathEnv = Math.max(0, 1 - (time - accSwathTick) / 0.07); // ~1-frame bright deposit
// mini-FREEZE while a swath lives — copies must freeze, not diffuse (wavetest_21). Accessory-scoped field change.
swathAmt += ((accLine === 5 ? 1 : 0) - swathAmt) * Math.min(1, dt * 1.2);
if (swathAmt > 0.01) {
  t.q28 *= 1 - 0.7 * swathAmt;                 // low blur -> discrete strands
  t.q1 += (0.968 - t.q1) * 0.5 * swathAmt;     // strands live 4-6s; spent fan lingers ~8s (p0)
  t.q18 *= 1 - 0.6 * swathAmt; t.q19 *= 1 - 0.6 * swathAmt; // damp pan so the fan doesn't shear away
}
```

*waves[1] branch* (ONE strand, apex pinned on orb A — p0: apex pinned at a terminal orb; r0: endpoints anchor on the dumbbell rings):

```js
if (accLine === 5) {
  var uS = a.sample || 0;
  var apx = a.q21 !== undefined ? a.q21 : 0.4, apy = a.q22 !== undefined ? a.q22 : 0.5;
  var LS = 0.42 + 0.1 * Math.sin(accLinePickT * 3.7); // strand length, rolled per pick
  var wav = 0.006 * Math.sin(uS * 31.0 + accLinePickT * 5.0) + (a.value1 || 0) * 0.004; // ~50px clocked waviness + a whisper of live jag
  a.x = apx + Math.cos(accLineRot) * uS * LS - Math.sin(accLineRot) * wav;
  a.y = apy + Math.sin(accLineRot) * uS * LS + Math.cos(accLineRot) * wav;
  var hS = (a.q8 || 0) + (accSwathFam ? 0.05 : 0.42); // TWO interleaved families ~0.4 apart (gold+indigo class)
  var briS = (0.3 + 0.7 * accSwathEnv) * accVis;      // dim live strand; bright only at ticks -> discrete frozen copies
  a.r = orbCol(hS, 0) * briS; a.g = orbCol(hS, 0.33) * briS; a.b = orbCol(hS, 0.67) * briS;
  a.a = (uS < 0.03 ? 0 : 0.5) * accVis;
  return a;
}
```

*Composes:* dwell = the existing accessory clock 5–11s (matches fan life 5–20s; the lingering spent fan comes free from decay); `accVis` fades it in rests; keep the old ray-curtain branch untouched (it remains its own accessory; D10's lighthouse-fan upgrade is a different doc). The apex rides orb A live, so slow orb drift re-aims the fan — r0's wandering vertex.
*Gate / revert:* everything behind `accLine === 5` + `swathAmt`; one commit; reverting restores the exact current table.
*(4) note:* this is the accessory-layer reintroduction the matrix warns about — it MUST land alone and get a live user look before anything else ships.

### Step 4 — A10 scallop marcher: new motif mode 17 building the mountain-row bg

*Target:* new `fScallop` next to `fMountains`; `MODES.push(fScallop)` (L825), `MODE_ALPHA` append `0.6` (L830), `MOTIF_BAG` append one `17` (L924); extend the Step-0/1 gates from `mCur === 14` to `(mCur === 14 || mCur === 17)`; row stepper in `frame()`.
*frame() additions:*

```js
if (mCur === 17 && time - scRowT > 2.8) {  // emitter re-seats at a new height every ~3s
  scRowT = time; scRowOff += 0.09; if (scRowOff > 0.28) scRowOff = -0.18; // ~10s to walk the band (p0 S2)
  sinkImp = 1;                              // each re-seat is a stamp -> lagging copies 8-15px below
}
```

(also let the Step-1 beat trigger fire on `mCur === 17` with the same 0.6s min-spacing.)
*Point fn* (smooth arches per the AMBIGUOUS waveform verdict — clocked arch envelope, amplitude on the smooth beat carrier, plus fine LIVE crest detail; stereo two-hue pair from value1/value2):

```js
function fScallop(a) {
  var s = a.sample || 0;
  var strand = s < 0.5 ? 0 : 1, u = (s - strand * 0.5) * 2; // stereo pair (p0 8-11s: green+crimson = L/R)
  var R = a.q5 || 0.4, W = R * 2.6;
  var tiltS = 0.42, ct = Math.cos(tiltS), st = Math.sin(tiltS); // LL->UR diagonal (~24deg)
  var march = (a.q9 || 0) * 9.0;                                // arches SLIDE along the line (q9=time*0.06)
  var arch = Math.abs(Math.sin(u * 3.14159 * 6.0 - march));     // smooth rounded scallops, ~6 arches (period 70-90px)
  var amp = 0.17 * (0.55 + 0.6 * Math.max(0, (a.q32 || 1) - 1)); // amp 80-100px, riding the SMOOTH pulse
  var live = (strand ? a.value2 : a.value1) || 0;
  var d = -(arch * amp + live * 0.012) - strand * 0.008 + scRowOff;
  var lx = (u - 0.5) * W;
  var cx = a.q2 !== undefined ? a.q2 : 0.5, cy = a.q3 !== undefined ? a.q3 : 0.5;
  a.x = cx + lx * ct - d * st;
  a.y = cy + lx * st + d * ct;
  var h = (a.q8 || 0) + (strand ? 0.45 : 0.0); // measured 2-hue pair (mint core vs crimson partner)
  a.r = orbCol(h, 0); a.g = orbCol(h, 0.33); a.b = orbCol(h, 0.67);
  a.a = (u < 0.02 || u > 0.98) ? 0 : 0.8;
  return a;
}
```

*Composes:* with the freeze+sink extended to mode 17, the ~10s height walk deposits the p0-S2 mountain-row band entirely from trail; NO bead terminals (risk 1 — cross-ref doc 07/A4 for the eventual ring-stack route); the magenta chromatic ghosting between copies is partly free from the blur fringe — do not build extra chromatics here (D8's territory).
*Gate / revert:* q30===17 (own bag entry, weight 1/26); one commit.

### Step 5 — OPTIONAL, needs the user's answer: in-place terrain re-tint as an overdraw era

Only if the user confirms (header question). Implement as fresh strokes, never buffer recolour: on a rare event (once per long mode-14 dwell), for ~1s raise `mtStampEnv` to 1 and sweep `mtPinchPhase` + a fixed new `mtHueStep` while stamping 3–4 generations — the new hue re-traces the pile (h0's "re-tint eras by overdraw"). Keep the step ±0.1 muted. Skip entirely if the user says drop it — four reports vs one say hue-frozen is the norm.

## 4. Verification recipe

Run after EVERY step, before asking for a reload:

```bash
cd /Users/sujitk/projects/personal/ytmusic-wmp-visualizer
node --check presets/alchemy-v7.js
# CLAUDE.md concat/frame_eqs smoke test (kit + families in one scope, run every frame_eqs):
node -e 'const fs=require("fs"),vm=require("vm");global.window=global;
  const cat=["kit","dance","alchemy-v7","ambience","battery"].map(f=>fs.readFileSync("presets/"+f+".js","utf8")).join("\n;\n");
  vm.runInThisContext(cat);
  let n=0; for(const [k,p] of Object.entries(window.WMP_PRESETS)){ if(p.frame_eqs) p.frame_eqs({time:2,bass:1.3,bass_att:1.1,mid:1,treb:1,treb_att:1}); n++; }
  console.log("ok", n, "presets");'
```

(if `presets/alchemy.js` exists instead of `alchemy-v7.js` in the concat list, use the filenames actually in `viz.html` — check the script tags.)

**Self-render:** `node tools/selfrender.mjs "Alchemy (Pastel)" "4,8,12"` → `/tmp/alc-render/shot_*.png` (also surfaces `[WMP-viz shader]` GLSL errors — none expected; this doc's only GLSL-adjacent change is q-var values). **Pinned renders:** use the scratchpad `pinrender.mjs` (if absent, recreate per doc 01 §4: copy `tools/selfrender.mjs`, add `const PIN = process.env.PIN || "";` and inject `window.__ALC_FORCE = JSON.parse(...)` after the pump eval). Pins land after `frame()` computes, so pin the INPUTS: `q30` steers the motif dispatch + the closure gates read `mCur` — for closure behaviour add doc-01-style pins at the top of `frame()`: `__swath` (forces `accLine = 5; accLinePickT = time` once). **Always take shot PAIRS ≥3–4s apart — every check below is about what the trail does BETWEEN shots.**

Acceptance checks (each visible in a screenshot):

1. **Step 1** — `PIN='{"q30":14}' node pinrender.mjs "Alchemy (Pastel)" "5,9"`: below the bright tether/ridge line, **≥2 discrete dimmer parallel copies stepped downward, each gap ≈3–8% of frame height** (not one continuous smear); between the 5s and 9s shots the older copies have NOT moved horizontally; during a quiet stretch (no beat) the copies hold position.
2. **Step 2** — same pin: **ONE crisp ridgeline with 3–4 triangular peaks** (pinched envelope — amplitude visibly dies at 2–3 pinch points), on some runs tilted ~35–45°; below it a pile of ≥3 progressively dimmer ridge generations; after ~8s the live crest's hue visibly differs from the deeper pile's hue (emitter stepped, pile kept the old colour). No flat #FFF region anywhere (Pastel stays muted).
3. **Step 3** — `PIN='{"__swath":1}'`, shots at 3, 6, 6.5s: a fan of **≥6 near-parallel strands converging at orb A** (the apex sits ON the orb), strand pitch ≈1.5–3% of frame width, **alternating two hue families** on adjacent strands; between the 6s and 6.5s shots ONLY the outermost strand's fine shape changed (the inner strands are pixel-identical = frozen); at 6s+dwell-end the spent fan is still faintly visible ≥4s after strands stop appearing.
4. **Step 4** — `PIN='{"q30":17}'`, shots at 4, 12s: one **smooth scalloped line (5–7 rounded arches, arch height ≈15–20% frame height)** running diagonally, drawn as a close two-hue pair (greenish + complementary); by the 12s shot **≥2 lagging rows at different heights** below/behind it forming a soft mountain-row band; arches at 12s are at a different phase along the line than at 4s (marching).
5. **Global (every step)** — a plain unpinned run: rests still empty out (no terrain stamps during rests); ground stays dark; no white pileup after 60s (`node tools/selfrender.mjs "Alchemy (Pastel)" "20,60"`).

## 5. Risks & rollback

- **(4) — the dominant risk.** The camera/accessory rework (`7e93259`) was A/B'd and REJECTED (`9ba675e`, lives on in `presets/alchemy-motion.js`). Steps 1/3 touch exactly that blast radius (a warp-field term; the accessory layer). Mitigation baked in: every field change is scene- or accessory-gated (`freezeAmt`/`swathAmt`), emitters stay pinned, no global regime director, and **each step is ONE commit that the user sees live before the next lands** (memory `dont-over-iterate-speculatively`: one change, verify, check in — do not stack speculative follow-ups if a step reads wrong; revert that commit and stop).
- **What the user rejected before that this touches:** the bead-row/caterpillar accessory ("ugly, unfixable" — removed in `bad7755`); hence A10's bead-stack terminals and any dotted decoration are OUT of this doc. The always-on motion rework — hence no constant scroll: the sink is a per-stamp impulse inside a freeze. Invented elements (dust etc.) — every element here is a measured reference behaviour with quoted evidence.
- **(6) colour:** freeze + sink means deposits live longer → white-accumulation risk. Keep `q1 ≤ 0.974`, blur floor 0.08 (not 0), do NOT touch `trail·1.28` (comp L200) or `q31`; per-stamp hue steps stay ±0.06–0.15; both swath families come from the same muted `orbCol` palette. If milkiness appears live, lower q1 toward 0.968 first.
- **A14 conflict (Step 5 only):** r0's in-place re-tint vs four reports' hue-frozen trails — resolved by the matrix as "keep hue-frozen"; Step 5 is optional, confirmation-gated, and implemented as overdraw (never buffer recolour).
- **Interaction risk:** the swath mini-freeze alters the global feel while any swath lives (~16% of accessory picks). If the user dislikes the periodic "stillness", halve `swathAmt`'s q18/q19 damping before touching the swath geometry.
- **One-commit-per-step plan:**
  1. `alchemy: terrain sink impulse — tether/ridge stamps step down under mountains (B3)`
  2. `alchemy: mountains = one live crest w/ pinched peaks + tilt over the frozen pile (D11)`
  3. `alchemy: harp swath accessory — pinned-apex strand fan from frozen trail copies (A3)`
  4. `alchemy: scallop marcher motif builds the mountain-row bg (A10)`
  5. *(optional, post-confirmation)* `alchemy: terrain re-tint via overdraw era (r0 2.4)`

## 6. Acceptance criteria

The cluster is done when, against the references:

- [ ] Mode 14 reads as **accumulation, not drawing**: a thin live crest re-jags per frame over a static frozen pile; pile shapes persist ≥3.5s crisp and do not translate between stamps (r0 2.4).
- [ ] Terrain generations are **discrete**: parallel dead copies stepped ~20–40px-equivalent (3–8% frame height) apart, oldest lowest, venetian-comb-like at low blur (p1 S6, p3 D-MTN).
- [ ] **Tether flashes during mode-14 dwells leave a draped-rope cascade** between the orb positions (p1 S14) with no new geometry code in waves[2].
- [ ] Emitter hue **steps per stamp while the pile keeps its old hue** — two colour generations visible at once (p1 S6); no retro-recolouring of deposits (unless Step 5 confirmed, and then only as overdraw).
- [ ] Some mode-14 dwells show the **rail tilted ~35–45° with a pinched triangular-peak envelope** (p2 2.7).
- [ ] The harp swath appears as an occasional accessory: **one apex pinned on orb A, ≥6 frozen near-parallel strand copies at ~10–20px pitch, two interleaved hue families, only the newest edge strand live**, fan life 5–11s, spent fan lingering ≥4s under a fresh one (p0 M6 / wavetest_21).
- [ ] The scallop mode shows **one smooth marching two-hue arch line** whose ~10s height walk builds a mountain-row background band purely from trail (p0 M2/S2); no bead terminals.
- [ ] Rests still starve everything (no stamps → terrain stops growing and melts); Pastel stays muted with zero blown-white regions; emitters never translate globally (only the trail steps).
- [ ] Each of steps 1–4 landed as its own commit and got a live user verdict before the next.
