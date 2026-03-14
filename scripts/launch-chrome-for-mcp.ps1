# Launch Chrome with remote debugging for chrome-devtools-mcp. Tavern URL from .vscode/launch.json
# Prerequisite: SillyTavern (or your tavern) running at http://127.0.0.1:8000/

$TavernUrl = "http://127.0.0.1:8000/"
$DebugPort = 9222

$ChromePaths = @(
    "${env:ProgramFiles}\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
    "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
)

$ChromeExe = $null
foreach ($p in $ChromePaths) {
    if (Test-Path $p) {
        $ChromeExe = $p
        break
    }
}

if (-not $ChromeExe) {
    Write-Host "Chrome not found. Install Chrome or edit Chrome path in this script." -ForegroundColor Red
    exit 1
}

Write-Host "Chrome: $ChromeExe" -ForegroundColor Cyan
Write-Host "Debug port: $DebugPort" -ForegroundColor Cyan
Write-Host "Opening: $TavernUrl" -ForegroundColor Cyan
Write-Host "Keep this Chrome window open; Cursor chrome-devtools-mcp will connect to it." -ForegroundColor Green

& $ChromeExe --remote-debugging-port=$DebugPort $TavernUrl
