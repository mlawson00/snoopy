no#!/usr/bin/env bash
set -euo pipefail

display="${OMNIFOCUS_DISPLAY:-:99}"
novnc_port="${OMNIFOCUS_NOVNC_PORT:-6080}"
debug_port="${OMNIFOCUS_DEBUG_PORT:-9222}"
profile_dir="${OMNIFOCUS_PROFILE_DIR:-/workspace/.omnifocus-chrome-profile}"
screen="${OMNIFOCUS_SCREEN:-1440x1000x24}"
novnc_web="${OMNIFOCUS_NOVNC_WEB:-}"

chrome_bin="${CHROME_BIN:-}"
if [[ -z "${chrome_bin}" ]]; then
  for candidate in \
    /usr/bin/chromium \
    /usr/bin/chromium-browser \
    /usr/bin/google-chrome \
    "${XDG_CACHE_HOME:-/home/codex/.cache}"/ms-playwright/chromium-*/chrome-linux*/chrome; do
    if [[ -x "${candidate}" ]]; then
      chrome_bin="${candidate}"
      break
    fi
  done
fi

if [[ -z "${chrome_bin}" ]]; then
  echo "No Chromium/Chrome binary found. Run: npx playwright install chromium" >&2
  exit 1
fi

if [[ -z "${novnc_web}" ]]; then
  for candidate in /usr/share/novnc /usr/share/novnc/app /usr/share/noVNC; do
    if [[ -e "${candidate}/vnc.html" || -e "${candidate}/index.html" ]]; then
      novnc_web="${candidate}"
      break
    fi
  done
fi

if [[ -z "${novnc_web}" ]]; then
  echo "No noVNC web assets found. Rebuild the image so the novnc package is installed." >&2
  exit 1
fi

mkdir -p "${profile_dir}"
find "${profile_dir}" -maxdepth 1 -name 'Singleton*' -delete
find "${profile_dir}" -maxdepth 2 -name 'LOCK' -delete

cleanup() {
  jobs -p | xargs -r kill 2>/dev/null || true
}
trap cleanup EXIT INT TERM

dump_logs() {
  for log in /tmp/omnifocus-{fluxbox,x11vnc,websockify,chrome}.log; do
    if [[ -s "${log}" ]]; then
      echo
      echo "==> ${log}"
      tail -80 "${log}"
    fi
  done
}

Xvfb "${display}" -screen 0 "${screen}" -ac &
sleep 1

DISPLAY="${display}" fluxbox >/tmp/omnifocus-fluxbox.log 2>&1 &
x11vnc -display "${display}" -forever -shared -nopw -listen 0.0.0.0 -rfbport 5900 >/tmp/omnifocus-x11vnc.log 2>&1 &
websockify --web="${novnc_web}" "0.0.0.0:${novnc_port}" localhost:5900 >/tmp/omnifocus-websockify.log 2>&1 &

DISPLAY="${display}" "${chrome_bin}" \
  --no-sandbox \
  --disable-dev-shm-usage \
  --password-store=basic \
  --use-mock-keychain \
  --ozone-platform=x11 \
  --remote-allow-origins='*' \
  --remote-debugging-address=0.0.0.0 \
  --remote-debugging-port="${debug_port}" \
  --window-size=1365,900 \
  --user-data-dir="${profile_dir}" \
  https://web.omnifocus.com/ >/tmp/omnifocus-chrome.log 2>&1 &

echo "OmniFocus browser is starting."
echo "Open: http://localhost:${novnc_port}/vnc.html?autoconnect=1&resize=remote"
echo "Profile: ${profile_dir}"

sleep 2

if ! curl -fsS "http://127.0.0.1:${novnc_port}/vnc.html" >/dev/null; then
  echo "noVNC did not start on port ${novnc_port}." >&2
  dump_logs >&2
  exit 1
fi

if ! curl -fsS "http://127.0.0.1:${debug_port}/json/version" >/dev/null; then
  echo "Chromium did not start DevTools on port ${debug_port}." >&2
  dump_logs >&2
  exit 1
fi

echo "noVNC is ready."
echo "Keep this command running while you log in."

wait || {
  status=$?
  dump_logs >&2
  exit "${status}"
}
