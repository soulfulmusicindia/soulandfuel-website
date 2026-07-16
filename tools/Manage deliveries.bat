@echo off
setlocal
title Manage client delivery links

set "NODE=node"
where node >nul 2>nul || set "NODE=C:\Program Files\nodejs\node.exe"

"%NODE%" "%~dp0manage-deliveries.js" %*

echo.
pause
