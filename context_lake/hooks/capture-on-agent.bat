@echo off
REM context_lake/hooks/capture-on-agent.bat
REM Call this after any agent completes to capture context.
REM Usage: capture-on-agent.bat [window_name]
REM
REM Agents should call this as their final step:
REM   python context_lake/capture.py --window "Agent 07a UI - Auth Page"

setlocal

set PROJECT_ROOT=%~dp0..\..
set WINDOW=%1
if "%WINDOW%"=="" set WINDOW=agent-complete

python "%PROJECT_ROOT%\context_lake\capture.py" --window "%WINDOW%" --project-root "%PROJECT_ROOT%"

exit /b %ERRORLEVEL%
