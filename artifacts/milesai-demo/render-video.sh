#!/usr/bin/env bash
set -euo pipefail

artifact_dir="$(cd "$(dirname "$0")" && pwd)"
mkdir -p "$artifact_dir/segments"
mkdir -p "$artifact_dir/captioned"

scenes=(
  "01-dashboard"
  "02-cadastro"
  "03-carteira"
  "04-estrategia"
  "05-hub-mock"
  "06-oportunidades"
  "07-como-funciona"
)
durations=(7.5 7.5 7.5 8.5 8.5 7.5 9.0)
captions=(
  "Cockpit de decisão para agentes de viagem"
  "Cadastro guiado: contato, rota, datas e orçamento"
  "Carteira com saldos, fontes e preço do milheiro"
  "Dinheiro, pontos e milhas comparados na mesma conta"
  "Hub com dados mock ou live sempre identificados"
  "Promoções recalculam somente os clientes compatíveis"
  "Transparência, conferência e decisão humana"
)

for index in "${!scenes[@]}"; do
  scene="${scenes[$index]}"
  duration="${durations[$index]}"
  output_number="$(printf '%02d' "$((index + 1))")"
  fade_out="$(awk -v value="$duration" 'BEGIN { printf "%.2f", value - 0.35 }')"
  magick "$artifact_dir/scenes/$scene.jpg" -resize '1920x1200^' -gravity center -crop 1920x1080+0+0 +repage \
    -fill '#173a33e6' -stroke none -draw 'roundrectangle 205,930 1715,1035 22,22' \
    -font '/System/Library/Fonts/Supplemental/Arial Bold.ttf' -pointsize 39 -fill white \
    -gravity south -annotate +0+57 "${captions[$index]}" "$artifact_dir/captioned/$scene.jpg"
  ffmpeg -hide_banner -loglevel error -y -loop 1 -i "$artifact_dir/captioned/$scene.jpg" \
    -vf "fade=t=in:st=0:d=0.35,fade=t=out:st=$fade_out:d=0.35" \
    -t "$duration" -r 30 -an -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p \
    "$artifact_dir/segments/$output_number.mp4"
done

ffmpeg -hide_banner -loglevel error -y -f concat -safe 0 -i "$artifact_dir/concat.txt" -c copy "$artifact_dir/base.mp4"

ffmpeg -hide_banner -loglevel error -y -i "$artifact_dir/base.mp4" -i "$artifact_dir/narracao.aiff" \
  -filter_complex "[1:a]apad=pad_dur=56,volume=1.05[audio]" \
  -map 0:v -map "[audio]" -t 56 -c:v libx264 -preset medium -crf 19 -pix_fmt yuv420p \
  -c:a aac -b:a 192k -movflags +faststart "$artifact_dir/MilesAI-demo-56s.mp4"

ffprobe -v error -show_entries format=duration,size -of default=noprint_wrappers=1 "$artifact_dir/MilesAI-demo-56s.mp4"
