#!/usr/bin/env bash
set -euo pipefail

URL="http://localhost:8000"

# Prevent blanking
xset s off || true
xset -dpms || true
xset s noblank || true

chromium-browser \
  --kiosk \
  --noerrdialogs \
  --disable-infobars \
  --disable-session-crashed-bubble \
  --check-for-update-interval=31536000 \
  "$URL"
