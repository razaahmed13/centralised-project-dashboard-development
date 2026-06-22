#!/usr/bin/env bash
set -euo pipefail

DASHBOARD_URL="${DASHBOARD_URL:-http://localhost:3000}"
EXTENSION_ZIP_URL="${EXTENSION_ZIP_URL:-$DASHBOARD_URL/downloads/neodym-dashboard-extension-local.zip}"
INSTALL_DIR="${INSTALL_DIR:-$HOME/Downloads/neodym-dashboard-extension}"
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

echo "Manual browser steps required by browser security:"
echo "1. Open your preferred Chrome/Chromium profile manually."
echo "2. Go to: chrome://extensions"
echo "3. Enable Developer Mode."
echo "4. Click 'Load unpacked'."
echo "5. Select this folder: $INSTALL_DIR"
echo "6. Pin the extension manually from the browser toolbar puzzle icon."
echo "7. Open the extension popup and set Dashboard URL to: $DASHBOARD_URL"
echo "8. Paste an extension API token generated from Dashboard Settings."
echo
echo "Note: this installer intentionally does not open Chrome automatically, so you can choose the correct browser profile."
echo "Browsers do not allow shell scripts to silently install or pin extensions for normal users."
