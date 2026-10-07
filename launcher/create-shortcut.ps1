# Creates "Muistipaikka" shortcuts (with the app icon) on the Desktop and in the Start menu.

$Root = Split-Path -Parent $PSScriptRoot
$Launcher = Join-Path $PSScriptRoot 'launch.ps1'
$Icon = Join-Path $PSScriptRoot 'notes.ico'
$Folders = @([Environment]::GetFolderPath('Desktop'), [Environment]::GetFolderPath('Programs'))

$shell = New-Object -ComObject WScript.Shell

# Remove shortcuts from before the app was renamed, but only ones that start this launcher.
foreach ($folder in $Folders) {
    $old = Join-Path $folder 'Notes.lnk'
    if ((Test-Path $old) -and $shell.CreateShortcut($old).Arguments -like "*$Launcher*") {
        Remove-Item $old
        Write-Host "Removed $old"
    }
}

foreach ($folder in $Folders) {
    $path = Join-Path $folder 'Muistipaikka.lnk'
    $shortcut = $shell.CreateShortcut($path)
    $shortcut.TargetPath = "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe"
    $shortcut.Arguments = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$Launcher`""
    $shortcut.WorkingDirectory = $Root
    $shortcut.IconLocation = "$Icon,0"
    $shortcut.WindowStyle = 7  # start minimized, so no console flashes up
    $shortcut.Description = 'Open Muistipaikka'
    $shortcut.Save()
    Write-Host "Created $path"
}
