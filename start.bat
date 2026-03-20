@echo off
title Triveni Mall Operations - Servers

echo ========================================
echo  Triveni Mall - Starting Servers
echo ========================================

:: Kill anything on port 3200 (frontend)
echo Clearing port 3200...
for /f "tokens=5" %%i in ('netstat -ano 2^>nul ^| findstr " 0.0.0.0:3200 " ^| findstr "LISTENING"') do (
    echo   Killing PID %%i
    taskkill /f /pid %%i >nul 2>&1
)
for /f "tokens=5" %%i in ('netstat -ano 2^>nul ^| findstr " :::3200 " ^| findstr "LISTENING"') do (
    echo   Killing PID %%i
    taskkill /f /pid %%i >nul 2>&1
)

:: Kill anything on port 3201 (backend)
echo Clearing port 3201...
for /f "tokens=5" %%i in ('netstat -ano 2^>nul ^| findstr " 0.0.0.0:3201 " ^| findstr "LISTENING"') do (
    echo   Killing PID %%i
    taskkill /f /pid %%i >nul 2>&1
)
for /f "tokens=5" %%i in ('netstat -ano 2^>nul ^| findstr " :::3201 " ^| findstr "LISTENING"') do (
    echo   Killing PID %%i
    taskkill /f /pid %%i >nul 2>&1
)

timeout /t 2 /nobreak >nul

:: Start Backend on port 3201
echo Starting Backend (port 3201)...
start "Backend :3201" cmd /k "cd /d "%~dp0backend" && node server.js"

timeout /t 4 /nobreak >nul

:: Start Frontend on port 3200
echo Starting Frontend (port 3200)...
start "Frontend :3200" cmd /k "cd /d "%~dp0frontend" && npm start"

echo.
echo ========================================
echo  Localhost  : http://localhost:3200
echo  Network    : http://192.168.11.73:3200
echo ========================================
echo.
echo  Wait 10 seconds then open browser.
echo.
pause
