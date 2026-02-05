@echo off
echo ========================================
echo Restarting Firebase Emulator
echo ========================================
echo.

echo Step 1: Killing any running emulators...
npx firebase emulators:kill
timeout /t 2 /nobreak >nul

echo.
echo Step 2: Clearing emulator cache...
if exist ".firebase" (
    echo Clearing .firebase cache...
    rmdir /s /q ".firebase" 2>nul
)

echo.
echo Step 3: Starting emulators with fresh rules...
echo.
npx firebase emulators:start

pause
