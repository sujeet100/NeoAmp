# WMP Visualizations — Catalog, Popularity & v1 Shipping Plan

Research compiled 2026-06-27 to decide **which Windows Media Player visualizations to ship
in the first version** of the extension. Two web-research passes (cross-checked against the
WMP Visualization Fandom wiki `wmpvis.fandom.com`, Wikipedia, Microsoft Q&A/newsgroups, and
YouTube view/like metrics) plus an inventory of what we've already built.

> **Confidence note:** Collection-level structure and the WMP-11 removals are STRONG (Wikipedia
> + multiple sources). Per-preset *names* come from the fan wiki (transcribed from in-product
> registry codenames) — reliable for labels, but per-preset *colour/motion* descriptions are
> thin in public sources; our own frame-by-frame analysis (see `CLAUDE.md` + memories) is the
> better authority for the actual look. Microsoft no longer hosts the original named list.

---

## 1. The complete WMP built-in catalog — 8 collections, ~75 presets

WMP grouped visualizations into **collections** (families), each with named presets. There
were **8 Microsoft-authored built-in collections** (all by Averett & Associates w/ Microsoft).

### Collections that survive to modern WMP (11 & 12) — the nostalgia core
| Collection | # | Presets | Character |
|---|---|---|---|
| **Bars and Waves** *(since v7)* | 4 | Bars, Scope, Ocean Mist, Fire Storm *(+ removed "Dot Scope")* | The only family driven by real audio analysis (spectrum/amplitude). Bar graph, oscilloscope, flowing/fiery waveforms. |
| **Battery** *(since v8)* | 26 | see below | Watercolour/feedback abstract; a displacement effect (swirl/kaleidoscope/starburst/tunnel/blocks/zoom) + a drawn line/curve layer. Energetic, "Matrix/futuristic". Was the WMP 9–10 **default**. |
| **Alchemy** *(since v9)* | 1 | **"Random"** only | A single **self-sequencing** watercolour visualization — *no named sub-modes*. (Confirms our one-file `alchemy-v7.js` design is product-accurate.) |

### Collections REMOVED in WMP 11 (existed WMP 7–10) — strong "bring it back" nostalgia
| Collection | # | Presets | Character |
|---|---|---|---|
| **Ambience** | 14 | Random, Swirl, Warp, Anon, Falloff, Water, Bubble, Dizzy, Windmill, Niagara, Blender, X Marks the Spot, Down the Drain, Thingus | "Soft and calm." Soft glows + shifting gradients; several flash white when loud; some flow left then switch right at high volume. Meditative. |
| **Plenoptic** | 6 | Smokey Circles, Smokey Lines, Vox, Flame, Fountain, Spyro *(+ Random)* | "MS-Paint look-alike" smoky visualization. |
| **Spikes** | 2 | Spike, Amoeba | Round blobs that stretch/spike outward to the music. |
| **Particle** | 2 | Particle, Rotating Particle | Flat square grid of red/purple/blue/cyan dots. |

### Collection only in WMP 7/7.1/8
| Collection | # | Character |
|---|---|---|
| **Musical Colors** | ~21 | Night Lights, Aurora, Star Power, Electric Green, Soft Fire, Acid Rock, Blue Flame, Electric Rainbow, Neon Highway, Ice Crystals, … "digital heart-monitor" look. |

**Battery's 26 presets** (display name; *registry codename* where it differs):
Randomization, brightsphere, **dance of the freaky circles** *(circledance)*, cominatcha
*(cominatya)*, cottonstar, **dandelionaid**, drinkdeep *(DrowningFlower)*, **eletriarnation**,
event horizon, **hizodge** *(Geeks Kick ASCII)*, **gemstonematrix**, **sepiaswirl** *(GrooveSwirl)*,
illuminator, **i see the truth**, kaleidovision *(kaleidoscope)*, chemicalnova *(khemicalnova)*,
lotus, green is not your enemy *(Nerds Are Cool)*, relatively calm, sleepyspray, smoke or water?,
spider's last moment..., strawberryaid, the world, my tornado is resting *(tornado)*, back to the groove.

**Not built-in (downloadable add-ons, out of scope):** 3D Alchemy (Classic/Kaleidoscope/Monoliths/
Strange World/WM Museum — from the WMP 9 Creativity Pack; *not* the built-in Alchemy), Blazing
Colors, Color Cubes, Eclectic Colors, StarTime, Trilogy I/II/III, Psychedelia, Pulsing Colors, etc.

---

## 2. Popularity & nostalgia — what people actually loved

Ranked by **emotional resonance + recognition** (not technical merit). Evidence strength tagged.

- **Tier 1 — the generic WMP-viz *vibe* (STRONG).** The biggest single nostalgia artifact is a
  generic showcase video (~**744k views, 8.5k likes**), not any named preset. People are nostalgic
  for the **feeling**: "hypnotic / mesmerizing", "digital incense", "lava-lamp-like", *"it felt like
  the computer was feeling the music."* → **The boot/default must nail that soft-glow first impression.**
- **Tier 2 — Battery (STRONG recognition).** Most-catalogued/most-enumerated family, longest block
  (~4 min) in the canonical XP showcase, the WMP 9–10 default. Register: energetic / "Matrix" /
  futuristic / pulsating. *(Not provably #1 favourite, but firmly top-tier.)*
- **Tier 2 — Ambience (STRONG emotional testimony).** The deepest first-person longing
  (*"the only visualization to which I can effectively relax and meditate"*). Calm/meditative
  register — complements Battery. **Removed in WMP 11**, which fuels "I miss it" sentiment.
- **Tier 3 — Alchemy (STRONG recognition, weaker re-watch).** The iconic "default" people *recall*
  ("organic cells under a microscope"), named in nearly every nostalgia article — but standalone
  clips underperform. Recognised > re-watched. *(Already shipped — a sound recognition anchor.)*
- **Tier 4 — defer:** Bars and Waves (universally recognised but treated as the plain default, not
  beloved), Plenoptic, Musical Colors; **Particle / Spikes** = negligible affection.

**Named-favourite presets that recur across sources:**
Battery — strawberryaid, my tornado is resting, kaleidovision, chemicalnova, cominatcha,
dance of the freaky circles, brightsphere, cottonstar, event horizon, lotus. Ambience — **"Random"**
is the one named *with love*. Alchemy — "Random".
**Myth-busting:** "Water is the popular Ambience preset" and "strawberryaid was in an XP TV ad"
are **single-source/unverified Fandom claims** — don't present as fact.

**External validation:** both independent WMP-recreation projects found in the wild chose
**Battery + Ambience + Alchemy** (one also added Bars & Waves / Musical Colors) — converging on
the same family focus as this project.

---

## 3. What we've already built (as of 2026-06-27)

| Family | Built | Status |
|---|---|---|
| **Alchemy** | `Alchemy (Pastel)` (default) + `Alchemy (Vivid)` | ✅ DONE — colour-validated against the 480p reference. |
| **Dance of the Freaky Circles** | Nebula, Nebula Spectrum, Fire | ✅ Nebula is the reference-quality "good" preset. *(Note: "dance of the freaky circles" is actually a **Battery** preset — nice tie-in.)* |
| **Ambience** | Thingus, **Water**, Down the Drain, Snell, Warp, Anon, Falloff, Bubble, Dizzy, Windmill, Niagara, Blender, X Marks the Spot (13) | 🟡 **Water** rebuilt to a polished procedural water surface (2026-06-27). Others vary; some need refinement. **Missing: Random (most loved!), Swirl.** |
| **Battery** | 24 presets | 🟡 Built; some need a refinement pass. **Missing: gemstonematrix.** **Likely duplicate: `sepalvel` ≈ `sepiaswirl` (GrooveSwirl)** — dedupe. |
| **Bars and Waves** | — | ❌ Not built. Universal recognition baseline; technically trivial (real-audio bars + oscilloscope). |

---

## 4. v1 shipping recommendation

**Principle:** curate a **polished core** — don't ship all ~40 presets unrefined. Quality of the
core vibe is what the nostalgia audience actually responds to.

**A. Ship now (polished / validated):**
- Alchemy (Pastel) + (Vivid)
- Ambience Water
- Dance of the Freaky Circles (Nebula)
- Any Battery/Ambience presets already confirmed good on-screen.

**B. Ship after a focused refinement pass (the research-favourite presets):**
- **Battery:** relatively calm, strawberryaid, my tornado is resting, kaleidovision, chemicalnova,
  cominatcha, brightsphere, event horizon, lotus, the world.
- **Ambience:** Warp, Anon, Niagara, Down the Drain, Snell + **ADD "Random"** (most-loved-by-name)
  and **"Swirl"** (missing).

**C. Strongly consider ADDING for recognition (low effort, high recognition):**
- **Bars and Waves** (Bars, Scope, Ocean Mist, Fire Storm) — the universal WMP default; trivial in
  Butterchurn (real spectrum/scope). Currently flagged "out of scope" in CLAUDE.md — worth revisiting.

**D. Defer past v1 (weak affection / niche):**
- Plenoptic, Musical Colors, Particle, Spikes.

**E. Housekeeping before v1:**
- **Dedupe** Battery `sepalvel` vs `sepiaswirl`.
- Make the **boot default** a strong soft-glow first impression (Alchemy Pastel or Ambience Water)
  to land the Tier-1 "vibe" the moment the visualizer opens.
- (Optional/cosmetic) align Battery display-name spellings to registry-canonical, and add
  `gemstonematrix`.

**Bottom line:** v1 = **Alchemy + a curated Battery set + a curated Ambience set (incl. Random)**,
boot on a soft-glow default, optionally + Bars and Waves for instant recognition. That's the
nostalgia core every independent signal converges on.
