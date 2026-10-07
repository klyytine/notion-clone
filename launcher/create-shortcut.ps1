# Creates "Notes" shortcuts (with the app icon) on the Desktop and in the Start menu.

$Root = Split-Path -Parent $PSScriptRoot
$Launcher = Join-Path $PSScriptRoot 'launch.ps1'
$Icon = Join-Path $PSScriptRoot 'notes.ico'

$targets = @(
    (Join-Path ([Environment]::GetFolderPath('Desktop')) 'Notes.lnk'),
    (Join-Path ([Environment]::GetFolderPath('Programs')) 'Notes.lnk')
)

$shell = New-Object -ComObject WScript.Shell
foreach ($path in $targets) {
    $shortcut = $shell.CreateShortcut($path)
    $shortcut.TargetPath = "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe"
    $shortcut.Arguments = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$Launcher`""
    $shortcut.WorkingDirectory = $Root
    $shortcut.IconLocation = "$Icon,0"
    $shortcut.WindowStyle = 7  # start minimized, so no console flashes up
    $shortcut.Description = 'Open the Notes app'
    $shortcut.Save()
    Write-Host "Created $path"
}
