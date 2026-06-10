@echo off
REM context_lake/hooks/uninstall-autostart.bat
REM Removes Context Lake auto-start (both Scheduled Task and Startup Folder).

set TASK_NAME=ContextLakeWatch
set STARTUP_LNK=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\ContextLakeWatch.lnk

echo Removing Scheduled Task...
schtasks /delete /tn "%TASK_NAME%" /f >nul 2>&1
if %ERRORLEVEL% EQU 0 ( echo [OK] Task removed ) else ( echo [INFO] No task found )

echo Removing Startup Folder shortcut...
if exist "%STARTUP_LNK%" (
    del "%STARTUP_LNK%" >nul 2>&1
    echo [OK] Shortcut removed
) else (
    echo [INFO] No shortcut found
)

echo.
echo Done.
pause
