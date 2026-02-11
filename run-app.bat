@echo off
setlocal

REM Change to the directory of this script
cd /d %~dp0

REM Start backend server in a new window
start "Todo Backend" cmd /k "cd /d %~dp0backend && npm start"

REM Start frontend dev server in a new window
start "Todo Frontend" cmd /k "cd /d %~dp0frontend && npm start"

endlocal
