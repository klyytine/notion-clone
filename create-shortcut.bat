@echo off
rem Creates a "Muistipaikka" icon on the Desktop and in the Start menu.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0launcher\create-shortcut.ps1"
pause
