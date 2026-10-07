# Opens the Muistipaikka app in its own window.
# Starts the Vite server hidden (if it isn't already running), opens an Edge/Chrome
# app window, and stops the server again when that window is closed.

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

$Root = Split-Path -Parent $PSScriptRoot
$Port = 5173
$Url = "http://localhost:$Port/"
# A dedicated browser profile keeps the window standalone; notes live in this profile's storage.
$ProfileDir = Join-Path $env:LOCALAPPDATA 'NotesApp\window-profile'
# Lets File > Quit inside the app close this window (read by server/fileApi.js).
$PidFile = Join-Path $env:LOCALAPPDATA 'NotesApp\window.pid'
# (The NotesApp folder name is kept from before the rename so existing notes stay where they are.)

# The app's own language setting can't be read before it starts, so error
# messages follow the Windows display language: Finnish or English.
$Finnish = (Get-UICulture).TwoLetterISOLanguageName -eq 'fi'
$Text = if ($Finnish) {
    @{
        NoNode       = 'Node.js ei ole asennettuna. Asenna se osoitteesta https://nodejs.org ja yritä uudelleen.'
        InstallFail  = 'Riippuvuuksien asentaminen epäonnistui. Näet syyn suorittamalla "npm install" projektikansiossa.'
        PortInUse    = "Portti $Port on toisen ohjelman käytössä. Sulje se ja yritä uudelleen."
        ServerFailed = 'Sovelluksen palvelin ei käynnistynyt. Näet virheen suorittamalla "npm run dev" projektikansiossa.'
    }
} else {
    @{
        NoNode       = 'Node.js is not installed. Install it from https://nodejs.org and try again.'
        InstallFail  = 'Installing dependencies failed. Run "npm install" in the project folder to see why.'
        PortInUse    = "Port $Port is already used by another program. Close it and try again."
        ServerFailed = 'The app server did not start. Run "npm run dev" in the project folder to see the error.'
    }
}

Add-Type -AssemblyName System.Windows.Forms
function Show-Error([string]$Message) {
    [System.Windows.Forms.MessageBox]::Show($Message, 'Muistipaikka', 'OK', 'Error') | Out-Null
}

function Test-AppRunning {
    try {
        $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2
        return $response.Content -match '/src/main.jsx'
    } catch {
        return $false
    }
}

function Find-AppBrowser {
    @(
        "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
        "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
        "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
        "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
        "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
    ) | Where-Object { Test-Path $_ } | Select-Object -First 1
}

$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
    Show-Error $Text.NoNode
    exit 1
}

Set-Location $Root

if (-not (Test-Path (Join-Path $Root 'node_modules'))) {
    # First run: install dependencies in a visible window so progress is shown.
    $npm = (Get-Command npm.cmd).Source
    $install = Start-Process -FilePath $npm -ArgumentList 'install' -WorkingDirectory $Root -PassThru -Wait
    if ($install.ExitCode -ne 0) {
        Show-Error $Text.InstallFail
        exit 1
    }
}

$server = $null
if (-not (Test-AppRunning)) {
    if (Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue) {
        Show-Error $Text.PortInUse
        exit 1
    }
    $vite = Join-Path $Root 'node_modules\vite\bin\vite.js'
    $server = Start-Process -FilePath $node.Source `
        -ArgumentList "`"$vite`"", '--port', $Port, '--strictPort' `
        -WorkingDirectory $Root -WindowStyle Hidden -PassThru

    $deadline = (Get-Date).AddSeconds(30)
    while (-not (Test-AppRunning)) {
        if ($server.HasExited -or (Get-Date) -gt $deadline) {
            Show-Error $Text.ServerFailed
            exit 1
        }
        Start-Sleep -Milliseconds 300
    }
}

$browser = Find-AppBrowser
if (-not $browser) {
    # No Edge/Chrome: open a normal tab. We can't tell when it closes, so the server keeps running.
    Start-Process $Url
    exit 0
}

$window = Start-Process -FilePath $browser -PassThru -ArgumentList @(
    "--app=$Url",
    "--user-data-dir=`"$ProfileDir`"",
    '--no-first-run',
    '--window-size=1280,860'
)
if ($server) { Set-Content -Path $PidFile -Value $window.Id -Encoding ascii }
$window.WaitForExit()

# Only stop the server this launcher started; a second launch reuses the running one.
if ($server) { Remove-Item $PidFile -ErrorAction SilentlyContinue }
if ($server -and -not $server.HasExited) {
    Stop-Process -Id $server.Id -Force
}
