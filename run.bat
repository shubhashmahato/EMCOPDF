@echo off
title EMCOPDF Offline Local Launcher
echo ===================================================
echo             EMCOPDF Offline Local Launcher
echo ===================================================
echo.
echo [INFO] Modern browsers block PDF engines and Web Workers
echo        when loaded via raw file paths (file:///).
echo.
echo [INFO] To run fully offline with 100%% security support,
echo        we are launching a lightweight server using your
echo        built-in Windows PowerShell (no installation needed!).
echo.
echo [INFO] Starting local server at http://localhost:8000...
echo [INFO] Press Ctrl+C in the window to shut down the server.
echo.

:: Run the native PowerShell HTTP server with bypass policy so it runs seamlessly
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0server.ps1"

pause
