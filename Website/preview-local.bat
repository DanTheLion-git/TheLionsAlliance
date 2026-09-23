@echo off
cd /d "%~dp0"

if not exist node_modules (
    echo Installing dependencies, this only happens once...
    call npm install
    if errorlevel 1 (
        echo.
        echo npm install failed. See the error above.
        pause
        exit /b 1
    )
)

echo.
echo Starting local preview - this will open http://localhost:4321 in your browser.
echo Close this window ^(or press Ctrl+C^) to stop the server.
echo.
call npm run dev -- --open

pause
