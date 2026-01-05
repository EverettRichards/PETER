#!/usr/bin/env bash
set -euo pipefail

URL="http://localhost:8000"

# Best-effort: prevent blanking (depends on display server)
xset s off || true
xset s noblank || true
xset -dpms || true

# Hide cursor after a short idle (nice for a wall display)
if command -v unclutter >/dev/null 2>&1; then
  unclutter -idle 0.5 -root &
fi

for i in $(seq 1 60); do
  if curl -fsS http://localhost:8000/api/health >/dev/null 2>&1; then
    break
  fi
  sleep 0.2
done

chromium-browser \
  --kiosk \
  --noerrdialogs \
  --disable-infobars \
  --disable-session-crashed-bubble \
  --disable-features=TranslateUI \
  --autoplay-policy=no-user-gesture-required \
  --check-for-update-interval=31536000 \
  "$URL"
