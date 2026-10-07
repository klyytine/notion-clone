@echo off
rem Double-click to open the Notes app in its own window.
start "" powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "%~dp0launcher\launch.ps1"
