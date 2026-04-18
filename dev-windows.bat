@echo off
setlocal

set "ROOT=%~dp0"
if "%ROOT:~-1%"=="\" set "ROOT=%ROOT:~0,-1%"
set "WEB_DIR=%ROOT%\web"

where bun >nul 2>nul
if errorlevel 1 (
  echo bun was not found in PATH.
  echo Install Bun for Windows or add bun.exe to PATH, then run this script again.
  pause
  exit /b 1
)

where air >nul 2>nul
if errorlevel 1 (
  echo air was not found in PATH.
  echo Install it with:
  echo go install github.com/air-verse/air@latest
  echo.
  echo Then make sure %%USERPROFILE%%\go\bin is in PATH.
  pause
  exit /b 1
)

if not exist "%WEB_DIR%\package.json" (
  echo Could not find the web app at "%WEB_DIR%".
  pause
  exit /b 1
)

echo Starting Fuse API with Air...
start "Fuse API - Air" cmd /k "cd /d ""%ROOT%"" && air"

echo Starting Fuse web app with Bun...
start "Fuse Web - Bun" cmd /k "cd /d ""%WEB_DIR%"" && bun run dev"

echo.
echo Started both dev servers in separate terminal windows.
echo Close those windows or press Ctrl+C inside each one to stop them.
endlocal
