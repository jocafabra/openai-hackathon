#!/usr/bin/env bash
set -euo pipefail

artifact_dir="$(cd "$(dirname "$0")" && pwd)"
mkdir -p "$artifact_dir/segments"

scenes=(
  "01-dashboard"
  "02-cadastro"
  "03-viagem"
  "04-carteira"
  "05-estrategia"
  "06-hub"
  "07-oportunidades"
  "08-como-funciona"
)

: > "$artifact_dir/concat.txt"

for index in "${!scenes[@]}"; do
  scene="${scenes[$index]}"
  output_number="$(printf '%02d' "$((index + 1))")"
  segment_file="$artifact_dir/segments/$output_number.mp4"

  ffmpeg -hide_banner -loglevel error -y -framerate 8 \
    -i "$artifact_dir/frames/$scene/%04d.jpg" \
    -vf "scale=1920:1200:flags=lanczos,crop=1920:1080,fps=30" \
    -an -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p \
    -movflags +faststart "$segment_file"

  printf "file '%s'\n" "$segment_file" >> "$artifact_dir/concat.txt"
done

ffmpeg -hide_banner -loglevel error -y -f concat -safe 0 -i "$artifact_dir/concat.txt" \
  -c copy -movflags +faststart "$artifact_dir/MilesAI-demo-v3-sem-audio.mp4"

ffprobe -v error -show_entries format=duration,size -of default=noprint_wrappers=1 \
  "$artifact_dir/MilesAI-demo-v3-sem-audio.mp4"
