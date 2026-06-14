# Keyframe regeneration recipe

PNG keyframes are **not committed** (kept the repo lean). Regenerate them anytime from the
source videos with the commands below — the analysis docs cite frames by these names/times.

## Reference clip — `~/Downloads/YouTube 1080p 60fps Download.mp4` (186s, 1280×720)

```bash
V="$HOME/Downloads/YouTube 1080p 60fps Download.mp4"
out=docs/alchemy-v2/keyframes; mkdir -p "$out"
# name : timestamp(s)
while read name t; do ffmpeg -nostdin -loglevel error -ss "$t" -i "$V" -frames:v 1 "$out/$name.png"; done <<'EOF'
s01_light_tunnel 7
s02_wireframe_net 11
s03_orbiters_black 15
s04_kaleido_diamonds 20
s05_redgreen_X_tunnel 24
s06_wireframe_net_3d 33
s07_central_rosette 44
s08_green_eye_anemone 49
s09_anemone_pulsar_blue 55
s10_swirling_vortex 65
s11_mandala_blue 79
s12_glowing_ring_fluid 92
s13_oscilloscope_bars 105
s14_moire_stripes 112
s15_3d_ribbon_orbiters 127
s16_waveform_terrain 155
s17_supernova 172
s18_final_corridor 182
EOF
```

Full 2fps frame set (used for the frame-by-frame `sections/`):
```bash
mkdir -p /tmp/alchemy_frames
ffmpeg -nostdin -loglevel error -i "$V" -vf "fps=2,scale=640:360" /tmp/alchemy_frames/f_%04d.png
# f_NNNN.png → time = (NNNN-1)*0.5 s
```

## Implementation clip — `~/Desktop/alchemy my implementation.mov` (39.5s, 4096×2304)

```bash
V="$HOME/Desktop/alchemy my implementation.mov"
out=docs/alchemy-v2/impl-keyframes; mkdir -p "$out"
while read name t; do ffmpeg -nostdin -loglevel error -ss "$t" -i "$V" -frames:v 1 -vf "scale=1280:720" "$out/$name.png"; done <<'EOF'
i01_green_anemone 3
i02_magenta_anemone 10
i03_anemone_diagonal 15
i04_orbiter_trails 19
i05_ring_eye 23
i06_ring_eye_diagonal 29
i07_vortex_spiral 34
i08_green_pinwheel 38
EOF
# full set: ffmpeg -i "$V" -vf "fps=2,scale=640:360" /tmp/impl_frames/g_%04d.png  (g_NNNN → (NNNN-1)*0.5 s)
```
