$ErrorActionPreference = 'Stop'

$DashboardUrl = if ($env:DASHBOARD_URL) { $env:DASHBOARD_URL } else { 'https://neodym-centralised-project-dashboard.vercel.app' }
$ExtensionZipUrl = if ($env:EXTENSION_ZIP_URL) { $env:EXTENSION_ZIP_URL } else { "$DashboardUrl/downloads/neodym-dashboard-extension.zip" }
$InstallDir = if ($env:INSTALL_DIR) { $env:INSTALL_DIR } else { Join-Path $HOME 'Downloads\neodym-dashboard-extension' }
$TempZip = Join-Path ([System.IO.Path]::GetTempPath()) ("neodym-dashboard-extension-{0}.zip" -f ([guid]::NewGuid().ToString('N')))

Write-Host ''
Write-Host 'Neodym Dashboard Extension installer'
Write-Host "Dashboard: $DashboardUrl"
Write-Host "Download:  $ExtensionZipUrl"
Write-Host ''

try {
    Write-Host 'Downloading extension package...'
    Invoke-WebRequest -Uri $ExtensionZipUrl -OutFile $TempZip -UseBasicParsing

    if (Test-Path $InstallDir) {
        Remove-Item -LiteralPath $InstallDir -Recurse -Force
    }
    New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
    Expand-Archive -LiteralPath $TempZip -DestinationPath $InstallDir -Force

    Write-Host ''
    Write-Host 'Extension unpacked to:'
    Write-Host $InstallDir
    Write-Host ''
    Write-Host 'Manual browser steps required by browser security:'
    Write-Host '1. Open your preferred Chrome/Chromium/Edge browser profile manually.'
    Write-Host '2. Go to: chrome://extensions or edge://extensions'
    Write-Host '3. Enable Developer Mode.'
    Write-Host "4. Click 'Load unpacked'."
    Write-Host "5. Select this folder: $InstallDir"
    Write-Host '6. Pin the extension manually from the browser toolbar puzzle icon.'
    Write-Host "7. Open the extension popup and set Dashboard URL to: $DashboardUrl"
    Write-Host '8. Paste an extension API token generated from Dashboard Settings.'
    Write-Host ''
    Write-Host 'Note: this installer intentionally does not open the browser automatically, so you can choose the correct browser profile.'
    Write-Host 'Browsers do not allow scripts to silently install or pin extensions for normal users.'
}
finally {
    if (Test-Path $TempZip) {
        Remove-Item -LiteralPath $TempZip -Force
    }
}
