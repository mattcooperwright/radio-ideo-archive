#!/usr/bin/env bash
# Saves an audio-only copy (.m4a) of each video show next to the original in Drive,
# so the site can play it. The videos themselves are left untouched.
#
# Run it in Google Cloud Shell (https://shell.cloud.google.com), signed in as someone
# who can edit the Radio IDEO folder:
#
#   curl -fsSL https://raw.githubusercontent.com/mattcooperwright/radio-ideo-archive/main/scripts/extract-audio.sh | bash
#
# It is safe to run again: a show whose .m4a already exists in its folder is skipped.

set -uo pipefail

# Drive file ID | folder ID | name for the audio copy
SHOWS=(
  "1J1NKcVgPMF8N1C0FTcW3Higzy07bJs25|1GxcWCPufNzbnGTn_TRMAGUnHGuspCjij|Dec 2022.m4a"
  "12xyRfzWAgoNd5fK3uKrkf8AnR85LAQhX|1GxcWCPufNzbnGTn_TRMAGUnHGuspCjij|Shuffle Mode November.m4a"
  "1xH4z7ODSPEsMBuhpn3a6_UjPeu5Q0ZtS|1Yi0RT4dIlF6RGFIyA-hnBvlo64RPhhha|The Heavy - June 2023.m4a"
  "1Wa5RFrFpqelgBaTVBZzw3H0uTqMOotaA|1Yi0RT4dIlF6RGFIyA-hnBvlo64RPhhha|Shuffle Mode - June 2023.m4a"
  "13Y9Cney7-iqoeizifTPiwjWWn6Vb_N2z|1Yi0RT4dIlF6RGFIyA-hnBvlo64RPhhha|2023-03-17 17-22-04.m4a"
  "1wmb9KEd6U9KwZeEPdpQs9EarRyazRuo3|1NnYf2N2FayEUNqE7Vl3wU58y_WO5SPvi|ShuffleMode - Dedicated to Mitch – 2024-01-23 21-34-26.m4a"
  "1ETezlwR63uy6XZOdic29tyBOzy3idl7v|1NnYf2N2FayEUNqE7Vl3wU58y_WO5SPvi|2024-01-30 21-00-31.m4a"
  "1TqqwXVcKsBkypjmPeUMlGaJgqxWfJdTt|1ahS8Tp4BgXxKHAM82jTEaOqiItVcyr-B|2025-05-09 21-55-48.m4a"
  "1li2YCfRejLcc2N_Qo0KNlliO77hLqWRz|1ahS8Tp4BgXxKHAM82jTEaOqiItVcyr-B|2025-08-28 21-07-28.m4a"
  "1kvRn6fC3DfrdVG3EYzKXMiwUoraQVhiT|1ahS8Tp4BgXxKHAM82jTEaOqiItVcyr-B|2025-09-03 21-12-14.m4a"
  "1dXidDYhg6Mhgv4mYnMR03yveFtxoetFx|1ahS8Tp4BgXxKHAM82jTEaOqiItVcyr-B|2025-10-09 21-29-04.m4a"
  "10MsOrqtmezEq1N4YyAC9S3Qb_THLmf-i|1ahS8Tp4BgXxKHAM82jTEaOqiItVcyr-B|2025-11-20 20-56-36.m4a"
  "1kQpiQ4UL2qfNpeAFrhLZfp-Pin854-tc|1ahS8Tp4BgXxKHAM82jTEaOqiItVcyr-B|2025-12-18 20-48-24.m4a"
  "1Wdn9B7kr2mw9lKMDPWDF-CqXhzx5lqW-|1vuT5hkxX75vXW7EUq250BLLN2XE3IbBN|ShuffleMode – with DJ Internet – 2026-01-20 21-21-50.m4a"
)

API=https://www.googleapis.com/drive/v3
UPLOAD=https://www.googleapis.com/upload/drive/v3

if ! command -v ffmpeg >/dev/null; then
  echo "Installing ffmpeg..."
  sudo apt-get update -qq && sudo apt-get install -y -qq ffmpeg >/dev/null || { echo "Couldn't install ffmpeg."; exit 1; }
fi

token() { gcloud auth print-access-token 2>/dev/null; }

# Cloud Shell's built-in sign-in can't reach Drive, so ask for a sign-in that can.
if ! curl -fsS -o /dev/null -H "Authorization: Bearer $(token)" "$API/about?fields=user"; then
  echo "Signing in with Google Drive access. Follow the link, approve, and paste the code back here."
  gcloud auth login --enable-gdrive-access --brief </dev/tty || { echo "Sign-in failed."; exit 1; }
fi

# Is there already a file with this name in this folder?
exists() {
  local q
  q=$(python3 - "$1" "$2" <<'PY'
import sys
name = sys.argv[1].replace("\\", "\\\\").replace("'", "\\'")
print(f"name = '{name}' and '{sys.argv[2]}' in parents and trashed = false")
PY
)
  curl -fsS -G -H "Authorization: Bearer $(token)" "$API/files" \
    --data-urlencode "q=$q" --data-urlencode "fields=files(id)" \
    --data-urlencode "supportsAllDrives=true" --data-urlencode "includeItemsFromAllDrives=true" |
    python3 -c 'import json,sys; sys.exit(0 if json.load(sys.stdin)["files"] else 1)'
}

# ffmpeg can exit cleanly having written nothing, so check the result has at least a minute of sound.
has_audio() {
  local secs
  secs=$(ffprobe -v error -select_streams a:0 -show_entries format=duration -of csv=p=0 "$1" 2>/dev/null)
  python3 -c 'import sys; sys.exit(0 if float(sys.argv[1] or 0) >= 60 else 1)' "${secs:-0}" 2>/dev/null
}

extract() {
  local id=$1 out=$2 src="$API/files/$1?alt=media&supportsAllDrives=true"
  # Copy the audio track as it is. If it isn't AAC (which .m4a needs), convert it instead.
  ffmpeg -nostdin -hide_banner -loglevel error -stats -y \
    -headers "Authorization: Bearer $(token)"$'\r\n' -i "$src" \
    -map 0:a:0 -vn -c:a copy -movflags +faststart "$out" && has_audio "$out" && return 0
  echo "   copying didn't work, converting to AAC instead"
  ffmpeg -nostdin -hide_banner -loglevel error -stats -y \
    -headers "Authorization: Bearer $(token)"$'\r\n' -i "$src" \
    -map 0:a:0 -vn -c:a aac -b:a 192k -movflags +faststart "$out" && has_audio "$out"
}

upload() {
  local file=$1 name=$2 parent=$3 meta session
  meta=$(python3 -c 'import json,sys; print(json.dumps({"name": sys.argv[1], "parents": [sys.argv[2]], "mimeType": "audio/x-m4a"}))' "$name" "$parent")
  session=$(curl -fsS -D - -o /dev/null -X POST \
    -H "Authorization: Bearer $(token)" -H "Content-Type: application/json; charset=UTF-8" \
    -H "X-Upload-Content-Type: audio/x-m4a" -d "$meta" \
    "$UPLOAD/files?uploadType=resumable&supportsAllDrives=true" | tr -d '\r' | awk 'tolower($1)=="location:" {print $2}')
  [ -n "$session" ] || return 1
  curl -fsS -o /dev/null -X PUT -H "Content-Type: audio/x-m4a" --upload-file "$file" "$session"
}

work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
done_n=0 skipped=0 failed=()

for row in "${SHOWS[@]}"; do
  IFS='|' read -r id parent name <<<"$row"
  echo
  echo "== $name"
  if exists "$name" "$parent"; then
    echo "   already in Drive, skipping"
    skipped=$((skipped + 1))
    continue
  fi
  out="$work/show.m4a"
  if ! extract "$id" "$out"; then
    echo "   couldn't read the audio from this video"
    failed+=("$name")
    continue
  fi
  echo "   $(du -h "$out" | cut -f1) of audio, uploading..."
  if upload "$out" "$name" "$parent"; then
    echo "   done"
    done_n=$((done_n + 1))
  else
    echo "   upload failed"
    failed+=("$name")
  fi
  rm -f "$out"
done

echo
echo "Saved $done_n, skipped $skipped (already there), failed ${#failed[@]}."
for f in "${failed[@]}"; do echo "  failed: $f"; done
echo "New shows appear on the site within ten minutes."
