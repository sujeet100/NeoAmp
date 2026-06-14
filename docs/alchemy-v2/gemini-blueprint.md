# Gemini "Algorithmic Visualizer Blueprint" (transcribed)

> Faithful transcription of `~/Downloads/Algorithmic Visualizer Blueprint.pdf` (29 pages),
> an AI-generated technical manual for recreating the Alchemy reference clip. It targets a
> **generic OpenGL/WebGL engine** (custom FBO feedback, vertex/geometry shaders, 3D
> meshes, FFT bands) — **NOT** Butterchurn. Read [`reconciliation.md`](reconciliation.md)
> for how each technique maps onto our actual Butterchurn/MilkDrop primitives and where
> this blueprint is factually wrong vs. the frame-by-frame analysis in
> [`README.md`](README.md) / [`sections/`](sections/).

**Project:** Real-time audio-reactive algorithmic visualizer.
**Reference:** "YouTube 1080p 60fps Download.mp4".
**Target architecture (Gemini's assumption):** OpenGL/WebGL, GLSL shaders, framebuffer
feedback loops (MilkDrop / ProjectM architecture).

---

## Global overview & core architecture

### 1. Audio reactivity system (FFT)
Continuous audio → FFT → discrete bands normalized 0.0–1.0:
- **`bass_env`** (20–250 Hz, leaky-integrator smoothed) → scale, zoom, violent camera shakes.
- **`mid_env`** (250 Hz–4 kHz) → geometric complexity, vertex noise, hue-cycling velocity.
- **`treb_env`** (4–20 kHz, trigger-based) → luminance flashes, sharp angular rotations,
  spawning of new geometric entities.
- **`wave_raw`** → raw PCM waveform buffer, plotted directly as Y-displacement in
  oscilloscope motifs.

### 2. The frame-feedback pipeline (crucial)
"Infinite tunnel" / "smearing trail" effects come from an **FBO feedback loop**, not from
drawing thousands of historical lines. Strict per-frame order:
1. Bind `Current_FBO`.
2. Draw `Previous_FBO` onto a full-screen quad, first applying a subtle UV transform
   (e.g. scale ×1.02, rotate 0.01 rad).
3. Apply alpha decay / subtractive blend to prevent white-out:
   `Color_feedback = Color_prev × 0.95 − 0.01`.
4. Render new procedural geometry on top with **additive blending**.
5. Swap `Current_FBO`/`Previous_FBO`; output to screen.

### 3. Coordinate spaces
Vertex shaders fluidly interpolate between **Cartesian (X,Y,Z)** and **Polar/Cylindrical
(r,θ,z)**. Most transitions = lerping vertex positions between a polar and a cartesian
equation over time.

---

## Scene-by-scene (Gemini's 13-scene timeline)

> Gemini's timestamps & scene count differ from the frame analysis — see corrections in
> `reconciliation.md`. Transcribed here as written.

### Scene 1 — The Wavy Grid (0:05–0:12)
- **Bg:** pure black. **Coords:** cartesian grid (2D→3D projected). **Driver:** raw waveform.
- Lattice of line primitives `V[i,j]` (i=cols, j=rows). Vertical lines (constant X) rigid;
  horizontal lines (constant Z) heavily subdivided for high-res waveform displacement.
- `Y_vertex = Y_base + (wave_raw[X_index] × scale_factor)`. Perspective projection for the
  sweep. Cyan ovals = point sprites on a horizontal trajectory, scale ∝ `bass_env`.
- **Color:** vertical lines static saturated red `vec4(1.0,0.0,0.2,0.8)`; horizontal lines
  screen-space gradient yellow(left)→neon green(right); additive blending so intersections glow.
- **Feedback:** very high decay (`Alpha *= 0.70`); no scale/rotation; slight horizontal blur
  on the FBO for soft trails behind the cyan ovals.
```glsl
// Wavy Grid vertex shader (pseudo)
float buffer_val = texture(audio_waveform, vec2(uv.x, 0.5)).r;
float displace = (buffer_val - 0.5) * amplitude;
vec3 pos = aPos;
if (is_horizontal == 1.0) { pos.y += displace; }
pos.x -= time * pan_speed;
pos.x = mod(pos.x + grid_width, grid_width*2.0) - grid_width; // infinite loop
gl_Position = projection * view * vec4(pos, 1.0);
```

### Scene 2 — Symmetrical Wireframe (0:12–0:21)
- **Bg:** black. **Coords:** cylindrical / 3D parametric. **Driver:** mid/bass EQs.
- Two wide funnels joined at narrow ends (hyperboloid), wireframe mesh.
  `X=R(z)cos(θ+time)`, `Y=R(z)sin(θ+time)`, `R(z)=base_radius + a·z²`. Cyan ovals fly a
  helical path `x=r·cos(t), y=r·sin(t)` through the center tube.
- **Audio:** `mid_env` drives the θ twist (wrings the shape); line thickness pulses on `bass_env`.
- **Color:** slowly shifting rainbow gradient mapped from normalized Z-depth via HSV wheel —
  color bands travel down the tunnel.
- **Feedback:** scale ×1.005, rotate 0.002 rad → faint ghostly web in negative space.
```glsl
float compute_radius(float z, float audio_mid){
  float r = sqrt(1.0 + (z*z) * 0.5);     // base hyperbolic curve
  r += sin(z*10.0 + time) * audio_mid * 0.2; // audio-reactive bulge
  return r;
}
```

### Scene 3 — The 2D Kaleidoscope Tunnel (0:21–0:28)
- **Bg:** overwritten. **Coords:** 2D polar, mirrored quadrants. **Driver:** kick / heavy bass.
- Minimal source geometry: a massive "X" + thick curved 2D arcs sweeping quadrants;
  complexity is entirely optical (from the FBO loop).
- `θ_folded = mod(atan(Y,X), π/2)`; arcs drawn where `R_min < R < R_max` (radii sine-modulated).
- **Color:** violent strobe between saturated red/green and deep purple/black; every `bass_env`
  peak inverts the palette.
- **Feedback (the engine):** FBO scaled ×1.05 each frame, alpha decay minimal (`Alpha *= 0.98`);
  bass hit spikes scale to **1.15** → tunnel "surges" forward.
```glsl
float target_scale = 1.02;
if (bass_hit) { target_scale = 1.15; }
current_scale = mix(current_scale, target_scale, 0.1);
mat2 scaleMatrix = mat2(current_scale,0.,0.,current_scale);
vec2 feedback_uv = (uv-0.5)*scaleMatrix + 0.5;
vec4 prev_frame = texture(fbo_back, feedback_uv);
```

### Scene 4 — The Tangled Neural Net (0:28–0:40)
- **Bg:** deep murky purple/black. **Coords:** 3D noise field. **Driver:** high-freq EQs.
- 500–1000 vertices in a bounding sphere; proximity-based line drawing (connect pairs closer
  than `D_max`). Positions driven by 4D simplex noise:
  `Pos = base_pos + simplex3D(base_pos×scale + time) × noise_amplitude`. Global `R_y(θ)`
  tumbles the volume slowly.
- **Audio:** `treb_env` controls `D_max` → hi-hats snap hundreds of lines in/out (electric sparks).
- **Color:** thin additive lines cycling neon green/cyan/violet; flat saturated horizontal jagged
  oscilloscope lines slice through with depth-test disabled.
- **Feedback:** rotate around Z (`R_z(0.01)`) no scale; high alpha retain (`0.90`) → curved smearing
  trails fill the murky background.

### Scene 5 — The Abstract Eye & Background Shifts (0:41–0:46)
- **Bg:** flashing solid hex colors. **Coords:** 2D circular constraint. **Driver:** snare/clap transients.
- Scene-4 vertices interpolate (over 0.5s) onto a circular perimeter radius `R`, retaining chaotic
  noise → jagged vibrating hoop. `P_2D=vec2(P.x,P.y)`; `P_norm=(P_2D/length(P_2D))×R`;
  `R = R_0 + bass_env`.
- **Color:** bright solid backgrounds (muddy brown, solid blue, dark green) → use **alpha/subtractive**
  blending not additive; Eye lines in stark dark/white.
- **Audio:** snare peak-detection (≈1–2 kHz) triggers **hard-snap** background color shifts.
- **Feedback:** completely **disabled** (`Alpha = 0.0`) so solid backgrounds render crisp ("palate cleanse").
```glsl
int color_index = 0;
if (snare_transient_detected()) { color_index = (color_index+1) % 4; }
vec3 bg_colors[4] = vec3[](
  vec3(0.1,0.4,0.2),  // dark green
  vec3(0.4,0.2,0.1),  // muddy brown
  vec3(0.1,0.3,0.6),  // flat blue
  vec3(0.0,0.0,0.0)); // black
gl_FragColor = vec4(bg_colors[color_index], 1.0);
```

### Scene 6 — The Anemone Pulsar (0:47–0:59)
- **Bg:** solid bright cyan/blue. **Coords:** 3D spherical. **Driver:** treble + bass simultaneously.
- Central anemone = hundreds of line pairs from origin to points on a sphere (golden-spiral
  distribution → even spikes). `X=r·sin(φ)cos(θ)`, `Y=r·sin(φ)sin(θ)`, `Z=r·cos(φ)`.
- **Motif A Orbiters:** point particles with thick coronas on elliptical orbits
  `Orbit_Pos=vec3(A·cos(ωt), B·sin(ωt), C·sin(2ωt))`; they sample `wave_raw` and displace
  tangentially → jagged 3D oscilloscope trails.
- **Color:** radial alpha fade (origin α=1 → edge α=0) for the fuzzy core; center cycles fast
  pink/red/white/green on audio intensity.
- **Feedback:** reactivated, slight outward radial blur → bloom + extended orbiter tails.
```glsl
vec3 calculate_orbiter_pos(float time, float audio_sample){
  vec3 base_pos = vec3(cos(time*2.)*5., sin(time*2.)*3., sin(time)*4.);
  vec3 tangent  = normalize(vec3(-sin(time*2.)*10., cos(time*2.)*6., cos(time)*4.));
  vec3 bitangent= cross(tangent, vec3(0.,1.,0.));
  return base_pos + bitangent*audio_sample*2.;
}
```

### Scene 7 — The Swirling Vortex (0:59–1:13)
- **Bg:** fades to deep purple/black. **Coords:** 3D torsional (twist). **Driver:** mid-freq volume.
- Same geometry as Scene 6; a twist deforms it: rotation angle around Z = f(distance from origin).
  `r=length(V.xy)`, `θ'=atan(V.y,V.x)+(twist_factor×r)`, `V'=r·(cos θ', sin θ')`. `twist_factor`
  ramps up over the scene.
- **Audio:** mid bands drive rotational velocity; audio drop unwinds, crescendo tightens the vortex.
- **Color:** inner core bright yellow/white, outer arms deep green/magenta; radially-projected map.
- **Feedback:** FBO zoom-IN (Scale **< 1.0**) + slight rotation → pulls orbiter trails into the
  center → complex interference spirals.
```glsl
float dist = length(aPos.xy);
float twist_angle = dist*0.5*sin(time*0.1)*audio_mid_smooth;
float s=sin(twist_angle), c=cos(twist_angle);
vec2 twisted_xy = vec2(aPos.x*c - aPos.y*s, aPos.x*s + aPos.y*c);
vec3 final_pos = vec3(twisted_xy, aPos.z);
```

### Scene 8 — 2D Geometric Mandalas (1:14–1:28)
- **Bg:** solid flat blue. **Coords:** 2D orthographic. **Driver:** bass (scale) / treble (rotation).
- Dynamically computed regular N-gons; inner shape (e.g. 4-sided diamond) inside outer (e.g. 8-pt star).
  `Angle=(i/N)·2π`, `X=R·cos`, `Y=R·sin`; star = R alternates `R_inner/R_outer`. A signature jagged
  diagonal line slices permanently across.
- **Audio:** N jumps 4→6→8 on structural music changes; inner/outer counter-rotate at treble-driven velocity.
- **Color:** depth-buffer off, opaque hard edges, solid neon (magenta, bright green) over flat blue;
  anti-aliasing critical.
- **Feedback:** mostly disabled / extremely short decay to keep lines crisp; the diagonal line is static
  in position but its waveform displacement is active.
```glsl
int num_points = 8;
float angle_step = (2.0*PI)/float(num_points);
for(int i=0;i<num_points;i++){
  float a = float(i)*angle_step + rotation_offset;
  float rad = (i%2==0) ? radius_outer : radius_inner; // star
  vec2 pos = vec2(cos(a),sin(a))*rad;
  emit_vertex(pos);
}
```

### Scene 9 — Glowing Ring & Fluid Background (1:29–1:44)
- **Bg:** procedural fluid / fBm shader. **Coords:** 3D foreground over 2D background. **Driver:** overall RMS/volume.
- Foreground: 3D torus / torus-knot wireframe (concentric bands around a tubular path):
  `X=r(cos(pθ)+2)cos(qθ)`, `Y=r(cos(pθ)+2)sin(qθ)`, `Z=r·sin(pθ)` (p,q coprime).
- Background fBm: multiple octaves of simplex noise, scaled+rotated, with **domain warping** → smoky.
- **Audio:** background flow/time ∝ RMS volume → louder track boils the fluid harder.
- **Color:** fluid mapped to dark narrow palette (deep purples/blacks); torus intense neon green,
  additive so it casts light onto the fluid.
```glsl
float fbm(vec2 p){ float v=0.,a=0.5; vec2 shift=vec2(100.);
  mat2 rot=mat2(cos(0.5),sin(0.5),-sin(0.5),cos(0.5));
  for(int i=0;i<5;i++){ v+=a*snoise(p); p=rot*p*2.+shift; a*=0.5; } return v; }
void main(){
  vec2 q=vec2(fbm(uv+time*0.1), fbm(uv+vec2(1.)));
  vec2 r=vec2(fbm(uv+1.0*q+time*0.2), fbm(uv+1.0*q-time*0.1));
  float n=fbm(uv + r*audio_volume*2.0);
  gl_FragColor=vec4(vec3(n)*vec3(0.3,0.1,0.5),1.0);
}
```

### Scene 10 — Vertical Bars & Symmetry (1:45–1:55)
- **Bg:** modulo striping (black/green). **Coords:** 2D screen-space modulo. **Driver:** mid-range phase.
- Pure fragment-shader vertical stripes (no geometry): `X_stripes = step(0.5, fract((UV.x + time×velocity)×density))`;
  velocity pans horizontally → Moiré. Foreground: static wireframe diamond (3D octahedron) anchors the eye.
- **Color:** modulo returns 0/1 → multiplex black vs neon green; central diamond magenta.
- **Audio:** stripe `density` ∝ mid envelope; heavy bass micro-stutters the pan velocity (bars snap to beat).
```glsl
float stripe_density = 50.0 + (audio_mid*10.0);
float pan_speed = time*2.0;
float val = fract((uv.x + pan_speed)*stripe_density);
float stripe_mask = step(0.5, val);
vec3 color1=vec3(0.); vec3 color2=vec3(0.,1.,0.4);
gl_FragColor = vec4(mix(color1,color2,stripe_mask),1.0);
```

### Scene 11 — The 3D Ribbon (1:56–2:14)
- **Bg:** black void. **Coords:** highly tessellated 3D plane. **Driver:** bass (Z-displacement).
- Subdivided plane (≈200×200) on X-Z; Y elevation = intersecting sines + scrolling noise:
  `Y=sin(X·f1+time)·cos(Z·f2+time)·amplitude`. Camera orbits Y slowly; central flare in focus;
  Motif-A orbiters weave under/over the ribbon (occlusion + light casting).
- **Color:** Fresnel-like — faces toward camera transparent, grazing faces glow cyan/purple.
- **Feedback:** high → fuzzy bloom of the flare + extended orbiter tails; slight vertical blur softens the plane.
```glsl
float wave_freq_x=2.5, wave_freq_z=1.8, wave_speed=time*1.5;
float height = sin(aPos.x*wave_freq_x + wave_speed) * cos(aPos.z*wave_freq_z - wave_speed);
height *= base_amplitude + (bass_env*3.0);
vec3 final_pos = vec3(aPos.x, height, aPos.z);
gl_Position = projection*view*vec4(final_pos,1.0);
```

### Scene 12 — The Supernova (2:15–2:30)
- **Bg:** black / color-inversion flashes. **Coords:** 3D spherical normal extrusion. **Driver:** max transient volume peaks.
- Icosphere/UV sphere; geometry/vertex shader breaks face-sharing so triangles extrude independently →
  sharp spikes. `V_new = V_base + (Normal × audio_peak × scalar)`. Camera untethered on a chaotic
  Lissajous curve through the spikes.
- **Color:** max saturation oscillating magenta↔lime; heaviest kicks → full **color inversion** (1.0−RGB) for
  one frame → strobe flashes.
- **Audio:** `audio_peak` must be **raw/un-smoothed** (leaky integrator → "breathing"; we want explosive gunshots).
```glsl
vec3 normal = normalize(aPos);
float punch = texture(audio_raw_volume, vec2(0.5,0.5)).r; // raw, un-smoothed
vec3 extruded_pos = aPos + (normal * punch * max_spike_length);
gl_Position = projection*view*vec4(extruded_pos,1.0);
```

### Scene 13 — The Final Eye/Tunnel (2:46–End)
- **Bg:** fluid fBm overlay (Scene-9 shader at ~20% opacity). **Coords:** 2D radial → 3D Z-depth. **Driver:** overall decrescendo.
- Dense radial lines converging at center (2D anemone); camera exponential Z acceleration stretches them into
  long tubes: `Velocity_z = e^(time×0.5)`. Lines fade to white at peak acceleration.
- **Feedback (the washout):** alpha decay intentionally broken — multiplier set to **1.0 or slightly above**,
  FBO scale ×**1.10** → white light compounds infinitely → whole composition washes to pure white over 3–4s as
  a natural fade-out.
```glsl
float fbo_alpha_retain = 0.95;
if (time > sequence_end_time - 5.0) {        // final 5 seconds
  fbo_alpha_retain = mix(0.95, 1.05, (time-(sequence_end_time-5.0))/5.0); // >1 → blowout
}
vec4 previous_frame = texture(fbo_back, scaled_uv);
gl_FragColor = current_frame + (previous_frame * fbo_alpha_retain); // blows to white
```

### Technical summary (Gemini's closing note)
Spend ~80% of effort tuning **frame feedback**. Shapes are mathematically simple; the
trails/webs/depth all come from how the previous frame is scaled, rotated, and blended.
Too heavy → wash to white; too weak → loses the alchemy/MilkDrop fluidity.
