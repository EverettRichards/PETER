#!/usr/bin/env bash
set -euo pipefail

URL="http://localhost:8000"

# Prevent screen blanking (best-effort; ignore if unsupported)
xset s off || true
xset s noblank || true
xset -dpms || true

chromium-browser \
  --kiosk \
  --noerrdialogs \
  --disable-infobars \
  --disable-session-crashed-bubble \
  --autoplay-policy=no-user-gesture-required \
  --check-for-update-interval=31536000 \
  "$URL"
