@echo off
REM context_lake/hooks/start-watch.bat
REM Launches Context Lake watch mode in a background window.
REM Captures context every N minutes (default: 2, configurable in config.json)
REM
REM Usage:
REM   start-watch.bat                    (2 min interval)
REM   start-watch.bat 5                  (5 min interval)
REM   start-watch.bat 2 "My Window"      (2 min, custom name)

setlocal

set PROJECT_ROOT=%~dp0..\..
set INTERVAL=%~1
if "%INTERVAL%"=="" set INTERVAL=2

set WINDOW=%~2
if "%WINDOW%"=="" set WINDOW=context-lake-watch

echo [context_lake] Starting watch mode (interval: %INTERVAL% min(s))
echo [context_lake] Window: %WINDOW%
echo [context_lake] PID: %RANDOM%
echo [context_lake] This window will log captures every %INTERVAL% minute(s).
echo [context_lake] Close this window to stop watching.
echo ==========================================

python "%PROJECT_ROOT%\context_lake\capture.py" --watch --interval %INTERVAL% --window "%WINDOW%" --project-root "%PROJECT_ROOT%"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [context_lake] ERROR: Capture failed. Is Python installed?
    pause
)

endlocal
