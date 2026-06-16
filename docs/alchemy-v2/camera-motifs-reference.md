# Alchemy Camera Motifs — Reference & Kit

Fourth companion (with `orb-`, `background-`, `color-motifs-reference.md`). Covers the
**virtual camera** — the global feedback transform that creates the *illusion* of a
camera (there is no real 3D). A "camera" = `zoom / rot / cx,cy (VP) / dx,dy (pan) /
sx,sy (squash) / warp` driven per-frame, on top of the feedback buffer.

**Method:** 3-subagent camera-angle pass over `YouTube 1080p 60fps Download.mp4`,
cross-checked against Gemini's 5 camera motifs. Audio reactivity inferred (no audio) —
flagged. Engine truth (Gemini, confirmed): every "angle" is a 2D transform; the warp
shader handles FADE (decay baseVal is dead in this build), while `zoom/rot/cx/cy/dx/dy/
sx/sy` drive the warp mesh and DO work with the default warp.

---

## 0. Headline

- **The signature Alchemy camera is the VORTEX-SWIRL** (continuous rotation + inward
  zoom toward a vanishing point) — Gemini's list missed it. Dominant in D and F.
- **Z-plunge** is real and the other workhorse, but its identity here is a **drifting
  off-center vanishing point** (the camera pans while diving) — G-2.
- **Barrel roll** and **handheld jitter** (Gemini #4/#5) are **overstated**: pure 360°
  roll / beat-snap rotation wasn't seen (rotation lives inside the vortex or as a slow
  drift-roll), and the "shake" is actually smooth **pan-drift**, not transient jitter.
- **Tilted-horizon floor** (Gemini #3) is real and important — the **finale settle**
  (I-2) and the C "flower on the floor."
- Cameras change by **smooth accel / crossfade**, occasionally a **hard cut** into a
  flat symmetric scene; the piece **settles** into the calm tilted floor (no white-out).

---

## 1. Camera motif catalogue

### CAM0 — Static hold
- **Where:** A intro (0–4s), B→C lull, silence gaps. **Illusion:** none (dead-air).
- **Transform:** no zoom/rot/pan; buffer fades. **Use:** intros/outros/lulls, gated on silence.

### CAM1 — Z-plunge / fly-through  (+ drifting VP)  ⭐
- **Where:** G-2 (~2:10–2:22, signature), E2 dandelion fly-in (~1:25), A axial tunnel (mild).
- **Illusion:** diving INTO the screen toward a vanishing point; foreground streaks past edges.
- **Transform:** `zoom > 1` (content blooms outward from VP). **Off-center VP that DRIFTS**
  (`cx/cy` wander) — the defining trait in G. Slight roll. Streaking particles sell Z-velocity.
- **Audio (inferred):** `zoom` speed ∝ bass; transient → particle spawn. Pullback-before-drop
  = one beat of `zoom<1` then snap to `zoom>1` (E2 shows the compact-then-burst). FLAG.
- **Transitions:** opens from a flat "loaded" net (G-1) into the dive = hyperdrive.
- **Suits:** drops, builds, four-on-the-floor, "enter hyperspace."

### CAM2 — Flat orthographic  (+ optional lateral pan)
- **Where:** A/B kaleidoscope (0:16–0:30), E1 mandala, F3 moiré wall (~1:53), H2 woven wall.
- **Illusion:** flat, depthless blueprint/wallpaper; depth (if any) only from mirror-tiling.
- **Transform:** `zoom ≈ 1`, `rot ≈ 0`, no perspective. Optional `dx` lateral pan (H2 wall slides
  sideways). A faint static `warp` (barrel) is tolerable (F3 stripes bow slightly).
- **Audio (inferred):** the central motif pulses on bass; the *camera* stays put. FLAG.
- **Suits:** kaleidoscope/moiré/mandala, ambient intros/outros, calm sections (let the eye rest).

### CAM3 — Vortex-swirl  ⭐ (Gemini missed)
- **Where:** D1/D3 radial fountain (~1:00–1:10, centered VP), F1 contour whirlpool (off-center VP).
- **Illusion:** the eye of a whirlpool — matter flung from a central pupil while trails spiral.
- **Transform:** continuous `rot` ≠ 0 **+ inward `zoom < 1`** (suction) toward a VP (centered D /
  off-center F1). The combination is the identity — NOT just roll (it sucks in) nor just plunge
  (it spirals). Usually done in a **warp shader** (`sd = rotate(c)*sc+0.5`) — see the Vortex scene.
- **Audio (inferred):** swirl rate ∝ mid; suction depth ∝ bass; rotation can briefly stall on a
  burst (pure-plunge frame). FLAG.
- **Suits:** climaxes, centrifuge/galaxy feel, the fountain/supernova-collapse family.

### CAM4 — Slow orbit / drift-roll  (the "barrel roll", downgraded)
- **Where:** B free-space burst (~0:32–0:40), H1 crossed-spoke star (~2:24).
- **Illusion:** lazily circling a floating object; it tilts/banks slowly.
- **Transform:** small continuous `rot` (partial, NOT full 360°) + `dx/dy` pan drift + directional
  motion-blur (feedback). No inward suction (distinguishes from vortex).
- **Audio (inferred):** rotation tempo-steady (not beat-snapped here); object bristles on treble. FLAG.
- **Suits:** breakdowns, "creature in the void," preventing staleness in repetitive passages.
- **Beat-snap variant (per Gemini, unconfirmed in video):** snap `rot` by 90°/180° on a transient
  (use `alcBeatFlash`) — build it as an option even though the clip shows smooth roll.

### CAM5 — Tilted-horizon floor  (pseudo-isometric)
- **Where:** I-2 finale floor (~2:56–3:06, clearest), C "flower on the floor" (~0:44–0:58, mild),
  H3 onset (~2:43).
- **Illusion:** skimming low over a wireframe terrain toward a horizon; clear ground-vs-sky split.
- **Transform:** **vertical squash** (`sy < sx`, or per-pixel Y-compress) + perspective to a
  **centered horizon VP** (`cy` high so the horizon sits upper-middle); gentle forward creep
  (`zoom≈1` + slow `dy`). The actual floor grid is **drawn geometry** (a projected mesh), not the
  camera — the camera just supplies the squash+horizon. Mirror-symmetric ridges reinforce it.
- **Audio (inferred):** horizon glow / ridge height ∝ bass/mid; forward creep steady. FLAG.
- **Suits:** outros / "landing" after a climax, terrain ambiance, grids & oscilloscope floors.

### CAM6 — Handheld pan-drift  (NOT sharp jitter)
- **Where:** E3 (~1:33), F2 liquid marble (~1:46).
- **Illusion:** camera off its mount, smoothly gliding/banking over a fluid; soft directional blur.
- **Transform:** `dx/dy` low-freq drift + high feedback decay smear; mild `rot` tilt. Smooth, not shaky.
- **Audio (inferred):** drift speed steady; content jitter is the live waveform, not the camera. FLAG.
- **Suits:** transitions/comedowns, liquid/ambient interludes.
- **True jitter (per Gemini, NOT observed):** a transient-gated random `dx/dy` shake (±a few px for
  2–3 frames). Build as an accent option, but the clip uses pan-drift, not jitter — use sparingly.

### CAM7 — Head-on supernova bloom
- **Where:** I-1 finale supernova (~2:46–2:56).
- **Illusion:** a star exploding toward the viewer; dark-eye core, outward filaments.
- **Transform:** **pulsing** `zoom > 1` from a near-centered VP that SNAPS outward on a beat then
  relaxes (not continuous like plunge); minimal rotation; dark central pupil (`darken_center`).
- **Audio (inferred):** the bloom pulse is the standout reactive event — bass → radial zoom-spike
  (use `alcBeatFlash`). FLAG.
- **Suits:** the climax / final drop / song-ending payoff.

---

## 2. Reconciliation with Gemini's 5

| Gemini camera | Verdict |
|---|---|
| 1. Infinite Z-plunge (zoom>1, bass→speed, pullback) | **CONFIRMED** (CAM1) — add the **drifting VP** (its real identity in G). |
| 2. Flat orthographic | **CONFIRMED** (CAM2) — strong; for kaleidoscope/moiré/ambient. |
| 3. Tilted-horizon isometric | **CONFIRMED** (CAM5) — the finale floor; mild in C. |
| 4. Barrel roll | **DOWNGRADE** (CAM4) — no full/ beat-snap roll observed; only slow drift-roll, and rotation mostly lives inside the **vortex**. |
| 5. Handheld jitter | **REFRAME** (CAM6) — it's smooth **pan-drift**, not transient shake. Keep jitter as a rare accent. |
| — (missing) | **VORTEX-SWIRL (CAM3)** — the signature camera Gemini omitted (rot + inward zoom). |

---

## 3. Kit (in `wmp-presets.js`)

**Static presets** — `alcCamera(kind)` returns feedback baseVals. Kinds:
`top` / `side` / `orbit` / `flat` (existing) + **`hold` / `plunge` / `vortex` / `tiltFloor`** (new).

**Per-frame drivers** — call in `frame_eqs` to animate the camera with audio:
| Driver | Sets | Motif |
|---|---|---|
| `alcCamPlunge(t, opts)` | `zoom = base + gain*bass`; optional drifting `cx/cy` VP | CAM1 |
| `alcCamVortex(t, opts)` | inward `zoom<1` + continuous `rot` (mid-scaled) | CAM3 |
| `alcCamRoll(t, opts)` | continuous `rot` bank (+ optional beat-snap via `alcBeatFlash`) | CAM4 |
| `alcCamFloat(t, opts)` | smooth low-freq `dx/dy` drift | CAM6 |
| `alcCamJitter(t, flash, opts)` | transient `dx/dy` shake (pass `alcBeatFlash` output) | CAM6 jitter accent |

`tiltFloor` (CAM5) is mostly a static preset (`sy` squash + `cy` horizon); the floor grid
itself is drawn geometry. `supernova` (CAM7) = `alcCamPlunge` driven by `alcBeatFlash` (pulse,
not continuous) + `darken_center`. CAM2 flat = `alcCamera("flat")` + optional `t.dx` pan.

**Compose:** scene picks a static `alcCamera(kind)` baseVals, then (optionally) calls one
driver per frame. Drivers set independent fields (`zoom` vs `rot` vs `dx/dy`) so they stack.

> **Engine caveat:** scenes using a CUSTOM warp that samples `uv` directly (Vortex/Fountain/
> Net Tunnel) do their transform in-shader and may bypass the baseVal `zoom/rot`. For those,
> the camera lives in the warp shader; the drivers above target the **default-warp** scenes.

---

*Source: 3-subagent camera-angle frame analysis of `YouTube 1080p 60fps Download.mp4`
(9 sections) + Gemini's 5-camera-motif notes, cross-checked. 2026-06-16.*
