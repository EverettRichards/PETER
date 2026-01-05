#!/usr/bin/env bash
set -euo pipefail

URL="http://localhost:8000"

# Must run inside the graphical session (Wayland/X11).
# If you run from SSH, these env vars are usually missing.
if [[ -z "${WAYLAND_DISPLAY:-}" && -z "${DISPLAY:-}" ]]; then
  echo "No GUI display detected (WAYLAND_DISPLAY/DISPLAY not set)."
  echo "Run this from the Pi desktop session, or rely on Wayfire autostart."
  exit 1
fi

# Wait for backend (prevents race condition)
for i in $(seq 1 200); do
  if curl -fsS http://localhost:8000/api/health >/dev/null 2>&1; then
    break
  fi
  sleep 0.2
done

exec chromium-browser \
  --kiosk \
  --noerrdialogs \
  --disable-infobars \
  --disable-session-crashed-bubble \
  --disable-features=TranslateUI \
  --autoplay-policy=no-user-gesture-required \
  --check-for-update-interval=31536000 \
  --disk-cache-dir=/dev/null \
  "$URL"
