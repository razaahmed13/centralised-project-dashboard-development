#!/usr/bin/env bash
set -euo pipefail

DASHBOARD_URL="${DASHBOARD_URL:-http://localhost:3000}"
EXTENSION_ZIP_URL="${EXTENSION_ZIP_URL:-$DASHBOARD_URL/downloads/neodym-dashboard-extension-local.zip}"
INSTALL_DIR="${INSTALL_DIR:-$HOME/.local/share/neodym-dashboard-extension}"
TMP_ZIP="$(mktemp -t neodym-dashboard-extension.XXXXXX.zip)"

cleanup() {
  rm -f "$TMP_ZIP"
}
trap cleanup EXIT

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

require_cmd curl
require_cmd unzip

echo "Neodym Dashboard Extension local installer"
echo "Dashboard: $DASHBOARD_URL"
echo "Download:  $EXTENSION_ZIP_URL"
echo

echo "Downloading extension package..."
curl -fL "$EXTENSION_ZIP_URL" -o "$TMP_ZIP"

rm -rf "$INSTALL_DIR"
mkdir -p "$INSTALL_DIR"
unzip -q "$TMP_ZIP" -d "$INSTALL_DIR"

echo
echo "Extension unpacked to:"
echo "$INSTALL_DIR"
echo

BROWSER=""
for candidate in google-chrome google-chrome-stable chromium chromium-browser brave-browser microsoft-edge microsoft-edge-stable; do
  if command -v "$candidate" >/dev/null 2>&1; then
    BROWSER="$candidate"
    break
  fi
done

if [[ "${SKIP_BROWSER_OPEN:-0}" == "1" ]]; then
  echo "Skipping browser open because SKIP_BROWSER_OPEN=1."
elif [[ -n "$BROWSER" ]]; then
  echo "Opening extensions page in $BROWSER..."
  "$BROWSER" "chrome://extensions" >/dev/null 2>&1 &
else
  echo "No Chrome/Chromium browser command found automatically."
  echo "Open chrome://extensions manually in Chrome, Edge, Brave, Arc, or another Chromium browser."
fi

echo
echo "Manual browser steps required by browser security:"
echo "1. Enable Developer Mode."
echo "2. Click 'Load unpacked'."
echo "3. Select this folder: $INSTALL_DIR"
echo "4. Pin the extension manually from the browser toolbar puzzle icon."
echo "5. Open the extension popup and set Dashboard URL to: $DASHBOARD_URL"
echo "6. Paste an extension API token generated from Dashboard Settings."
echo
echo "Browsers do not allow shell scripts to silently install or pin extensions for normal users."
