@echo off
setlocal
title Make a client delivery link

set "NODE=node"
where node >nul 2>nul || set "NODE=C:\Program Files\nodejs\node.exe"

"%NODE%" "%~dp0make-delivery.js" %*

echo.
pause
