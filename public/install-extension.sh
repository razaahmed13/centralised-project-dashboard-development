#!/usr/bin/env bash
set -euo pipefail

DASHBOARD_URL="${DASHBOARD_URL:-https://neodym-centralised-project-dashboard.vercel.app}"
EXTENSION_ZIP_URL="${EXTENSION_ZIP_URL:-$DASHBOARD_URL/downloads/neodym-dashboard-extension.zip}"
INSTALL_DIR="${INSTALL_DIR:-$HOME/Downloads/neodym-dashboard-extension}"
TMP_ZIP="$(mktemp -t neodym-dashboard-extension.XXXXXX.zip)"

cleanup() {
  rm -f "$TMP_ZIP"
}
trap cleanup EXIT

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    echo "Install it and rerun this command." >&2
    exit 1
  fi
}

require_cmd curl
require_cmd unzip

printf '\nNeodym Dashboard Extension installer\n'
printf 'Dashboard: %s\n' "$DASHBOARD_URL"
printf 'Download:  %s\n\n' "$EXTENSION_ZIP_URL"

printf 'Downloading extension package...\n'
curl -fL "$EXTENSION_ZIP_URL" -o "$TMP_ZIP"

rm -rf "$INSTALL_DIR"
mkdir -p "$INSTALL_DIR"
unzip -q "$TMP_ZIP" -d "$INSTALL_DIR"

printf '\nExtension unpacked to:\n%s\n\n' "$INSTALL_DIR"

printf 'Manual browser steps required by browser security:\n'
printf '1. Open your preferred Chrome/Chromium browser profile manually.\n'
printf '2. Go to: chrome://extensions\n'
printf '3. Enable Developer Mode.\n'
printf "4. Click 'Load unpacked'.\n"
printf '5. Select this folder: %s\n' "$INSTALL_DIR"
printf '6. Pin the extension manually from the browser toolbar puzzle icon.\n'
printf '7. Open the extension popup and set Dashboard URL to: %s\n' "$DASHBOARD_URL"
printf '8. Paste an extension API token generated from Dashboard Settings.\n\n'
printf 'Note: this installer intentionally does not open Chrome automatically, so you can choose the correct browser profile.\n'
printf 'Browsers do not allow shell scripts to silently install or pin extensions for normal users.\n'
