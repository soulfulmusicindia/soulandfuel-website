@echo off
setlocal
title Add a hidden delivery cover

set "NODE=node"
where node >nul 2>nul || set "NODE=C:\Program Files\nodejs\node.exe"

"%NODE%" "%~dp0add-cover.js" %*

echo.
pause
