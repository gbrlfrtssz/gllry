@echo off
setlocal

REM WHAT THIS FILE DOES:
REM 1. Reads all photos inside each category folder
REM 2. Rebuilds photo-manifest.js
REM 3. Makes the site aware of new or removed local images
REM
REM WHAT YOU SHOULD DO AFTER THIS:
REM - Reload the website locally to see the new random photos
REM - If everything looks right and you want to update GitHub Pages too,
REM   run 02-publish-gallery.bat next

set "ROOT=%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%scripts\refresh-photo-manifest.ps1"

if errorlevel 1 (
  echo.
  echo Failed to refresh photo manifest.
  echo Check if your photo folders and script files still exist.
  pause
  exit /b 1
)

echo.
echo Photo manifest refreshed successfully.
echo Next step:
echo - Reload the local site to preview the changes
echo - Run 02-publish-gallery.bat if you want to send everything to GitHub
pause
