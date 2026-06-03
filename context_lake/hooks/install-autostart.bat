@echo off
REM context_lake/hooks/install-autostart.bat
REM Run ONCE to set up automatic Context Lake watch on every login.
REM Tries Scheduled Task first, falls back to Startup Folder.
REM
REM To remove: run uninstall-autostart.bat

setlocal enabledelayedexpansion

set PROJECT_ROOT=%~dp0..\..
set VBS_SCRIPT=%PROJECT_ROOT%\context_lake\hooks\start-watch-silent.vbs
set TASK_NAME=ContextLakeWatch

echo ===========================================
echo  Context Lake - Install Auto-Start
echo ===========================================
echo.

REM Resolve full paths
for %%i in ("%VBS_SCRIPT%") do set VBS_ABS=%%~fi
for %%i in ("%PROJECT_ROOT%") do set ROOT_ABS=%%~fi

echo Script: %VBS_ABS%
echo.

if not exist "%VBS_ABS%" (
    echo [ERROR] Script not found: "%VBS_ABS%"
    pause
    exit /b 1
)

REM === Method 1: Scheduled Task ===
echo [*] Trying Scheduled Task (may need admin)...
schtasks /query /tn "%TASK_NAME%" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    schtasks /delete /tn "%TASK_NAME%" /f >nul 2>&1
)

schtasks /create /tn "%TASK_NAME%" /tr "wscript.exe \"%VBS_ABS%\"" /sc onlogon /rl limited /f 2>&1

if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Scheduled Task created.
    echo.
    echo The Context Lake watch will start automatically on your next login.
    echo To verify:  schtasks /query /tn "%TASK_NAME%"
    echo To remove:  uninstall-autostart.bat
    echo.
    pause
    exit /b 0
)

echo [!] Scheduled Task failed. Trying Startup Folder instead...

REM === Method 2: Startup Folder (no admin needed) ===
REM Use PowerShell to create a shortcut in the user's Startup folder
powershell -Command ^
    $wshell = New-Object -ComObject WScript.Shell; ^
    $shortcut = $wshell.CreateShortcut([Environment]::GetFolderPath('Startup') + '\ContextLakeWatch.lnk'); ^
    $shortcut.TargetPath = 'wscript.exe'; ^
    $shortcut.Arguments = '//B //NoLogo "' + '%VBS_ABS%' + '"'; ^
    $shortcut.WorkingDirectory = '%ROOT_ABS%'; ^
    $shortcut.WindowStyle = 7; ^
    $shortcut.Description = 'Context Lake - auto-captures project state every 2 min'; ^
    $shortcut.Save()

if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Added to Startup Folder!
    echo.
    echo The Context Lake watch will start automatically on your next login.
    echo Location: shell:startup
    echo To remove: delete ContextLakeWatch.lnk from Startup folder
) else (
    echo [ERROR] Both methods failed. Manual steps:
    echo   1. Press Win+R, type: shell:startup
    echo   2. Create shortcut to: %VBS_ABS%
)

echo.
pause
endlocal
