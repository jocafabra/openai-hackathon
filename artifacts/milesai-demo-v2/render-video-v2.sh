#!/usr/bin/env bash
set -euo pipefail

artifact_dir="$(cd "$(dirname "$0")" && pwd)"
source_dir="$artifact_dir/../milesai-demo/scenes"
mkdir -p "$artifact_dir/captioned" "$artifact_dir/segments" "$artifact_dir/voice"

scenes=(
  "01-dashboard"
  "02-cadastro"
  "03-carteira"
  "04-estrategia"
  "05-hub-mock"
  "06-oportunidades"
  "07-como-funciona"
)

narration=()
while IFS= read -r line; do
  narration+=("$line")
done < "$artifact_dir/narracao-v2.txt"

captions=(
  $'Imagina receber um pedido de viagem e resolver tudo em um só lugar.\nEsse é o MilesAI.'
  $'O cadastro é rapidinho: contato, rota, datas e orçamento\nentram num fluxo bem guiado.'
  $'Depois, você informa os saldos e o valor do milheiro\nde cada programa.'
  $'O motor coloca dinheiro, pontos e milhas na mesma conta\ne explica qual caminho faz mais sentido.'
  $'No Hub de voos, cada tarifa mostra a fonte e deixa claro\nquando o dado é simulado ou ao vivo.'
  $'Quando aparece uma promoção compatível,\nsó os clientes certos voltam para análise.'
  $'No fim, o agente confere tudo e decide.\nMais clareza, menos abas e nenhuma ação automática.'
)

: > "$artifact_dir/concat.txt"

for index in "${!scenes[@]}"; do
  scene="${scenes[$index]}"
  text="${narration[$index]}"
  caption="${captions[$index]}"
  output_number="$(printf '%02d' "$((index + 1))")"
  voice_file="$artifact_dir/voice/$output_number.aiff"
  caption_file="$artifact_dir/captioned/$scene.jpg"
  segment_file="$artifact_dir/segments/$output_number.mp4"

  say -v 'Flo (Portuguese (Brazil))' -r 176 "$text" -o "$voice_file"
  voice_duration="$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$voice_file")"
  segment_duration="$(awk -v value="$voice_duration" 'BEGIN { printf "%.3f", value + 0.55 }')"
  fade_out="$(awk -v value="$segment_duration" 'BEGIN { printf "%.3f", value - 0.28 }')"
  audio_fade="$(awk -v value="$voice_duration" 'BEGIN { printf "%.3f", value - 0.18 }')"

  magick "$source_dir/$scene.jpg" -resize '1920x1200^' -gravity center -crop 1920x1080+0+0 +repage \
    -fill '#102d27eb' -stroke '#79c8aa66' -strokewidth 2 -draw 'roundrectangle 165,895 1755,1038 24,24' \
    \( -background none -fill white -font '/System/Library/Fonts/Supplemental/Arial Bold.ttf' \
       -pointsize 35 -size 1480x112 -gravity center caption:"$caption" \) \
    -gravity south -geometry +0+50 -composite "$caption_file"

  ffmpeg -hide_banner -loglevel error -y -loop 1 -i "$caption_file" -i "$voice_file" \
    -vf "fade=t=in:st=0:d=0.28,fade=t=out:st=$fade_out:d=0.28" \
    -af "highpass=f=75,lowpass=f=10500,acompressor=threshold=0.16:ratio=1.8:attack=18:release=180,afade=t=out:st=$audio_fade:d=0.18,volume=1.08" \
    -t "$segment_duration" -r 30 -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p \
    -c:a aac -b:a 192k -ar 44100 -ac 1 -movflags +faststart "$segment_file"

  printf "file '%s'\n" "$segment_file" >> "$artifact_dir/concat.txt"
done

ffmpeg -hide_banner -loglevel error -y -f concat -safe 0 -i "$artifact_dir/concat.txt" \
  -c copy -movflags +faststart "$artifact_dir/MilesAI-demo-v2.mp4"

ffprobe -v error -show_entries format=duration,size -of default=noprint_wrappers=1 "$artifact_dir/MilesAI-demo-v2.mp4"
