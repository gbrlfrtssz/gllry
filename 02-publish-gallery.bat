@echo off
setlocal

REM WHAT THIS FILE DOES:
REM 1. Refreshes photo-manifest.js
REM 2. Adds the gallery files to git
REM 3. Creates a commit with date and time
REM 4. Pushes everything to your current GitHub branch
REM
REM WHAT YOU SHOULD DO AFTER THIS:
REM - Wait for GitHub Pages to update
REM - Open your live site and confirm the new photos are online

set "ROOT=%~dp0"
cd /d "%ROOT%"

echo Refreshing photo manifest...
powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%scripts\refresh-photo-manifest.ps1"
if errorlevel 1 (
  echo.
  echo Failed to refresh photo manifest.
  echo Run 01-refresh-photo-manifest.bat by itself if you want to debug locally first.
  pause
  exit /b 1
)

git rev-parse --is-inside-work-tree >nul 2>&1
if errorlevel 1 (
  echo.
  echo This folder is not a git repository yet.
  echo Connect it to GitHub first, then run this file again.
  pause
  exit /b 1
)

echo.
echo Staging gallery updates...
git add assets/photos photo-manifest.js PHOTO-SETUP.md 01-refresh-photo-manifest.bat 02-publish-gallery.bat scripts\refresh-photo-manifest.ps1

git diff --cached --quiet
if not errorlevel 1 goto commit_changes

echo No new gallery changes to publish.
echo Next step:
echo - Add or remove photos if you expected changes
echo - Or just reload the site locally
pause
exit /b 0

:commit_changes
for /f %%I in ('powershell -NoProfile -Command "Get-Date -Format ''yyyy-MM-dd HH:mm:ss''"') do set "STAMP=%%I"
set "MESSAGE=Update gallery %STAMP%"

echo.
echo Creating commit...
git commit -m "%MESSAGE%"
if errorlevel 1 (
  echo.
  echo Commit failed. Check git status and try again.
  pause
  exit /b 1
)

echo.
echo Pushing to remote...
git push
if errorlevel 1 (
  echo.
  echo Push failed. Check your remote, branch, or authentication.
  pause
  exit /b 1
)

echo.
echo Gallery published successfully.
echo Next step:
echo - Wait a moment for GitHub Pages to rebuild
echo - Open the live site and confirm the new photos are online
pause
