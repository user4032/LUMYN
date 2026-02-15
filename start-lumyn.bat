@echo off
REM LUMYN Messenger - Complete Startup Script
REM This script starts MongoDB, Node.js backend, and the Electron app

setlocal enabledelayedexpansion

echo.
echo ===================================
echo   LUMYN Messenger v1.0.0 Launcher
echo ===================================
echo.

REM Check if MongoDB is running
echo [1/3] Checking MongoDB...
tasklist /FI "IMAGENAME eq mongod.exe" 2>NUL | find /I /N "mongod.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo  ✓ MongoDB is already running
) else (
    echo  ✗ Starting MongoDB (requires installation)...
    REM Try to start MongoDB from default installation location
    if exist "C:\Program Files\MongoDB\Server\5.0\bin\mongod.exe" (
        start "" "C:\Program Files\MongoDB\Server\5.0\bin\mongod.exe" --dbpath "%APPDATA%\MongoDB\data"
        timeout /t 3 /nobreak
        echo  ✓ MongoDB started
    ) else if exist "C:\Program Files (x86)\MongoDB\Server\5.0\bin\mongod.exe" (
        start "" "C:\Program Files (x86)\MongoDB\Server\5.0\bin\mongod.exe" --dbpath "%APPDATA%\MongoDB\data"
        timeout /t 3 /nobreak
        echo  ✓ MongoDB started
    ) else (
        echo  ⚠ MongoDB not found. Please install MongoDB from https://www.mongodb.com/try/download/community
        pause
        exit /b 1
    )
)

REM Check if Node.js is running on port 4777
echo.
echo [2/3] Starting LUMYN Backend...
netstat -ano | find ":4777" >NUL
if "%ERRORLEVEL%"=="0" (
    echo  ✓ Backend is already running on port 4777
) else (
    echo  ✓ Starting Node.js server...
    start "" /B cmd /c "cd /d "%~dp0server" && node index.js"
    timeout /t 2 /nobreak
)

REM Start Electron app
echo.
echo [3/3] Launching LUMYN Messenger...
echo.

cd /d "%~dp0"
if exist ".\release\LUMYN Setup 1.0.0.exe" (
    start "" ".\release\LUMYN Setup 1.0.0.exe"
) else if exist "dist\renderer\index.html" (
    start "" npm run dev:electron
) else (
    echo  ✗ LUMYN app not found!
    echo  Please build the app first with: npm run build:win
    pause
    exit /b 1
)

echo.
echo ===================================
echo  ✓ LUMYN is starting...
echo  ✓ Backend: http://localhost:4777
echo  ✓ Frontend: http://localhost:5173
echo ===================================
echo.
echo LUMYN window should open in a moment...
echo This window can be closed safely.
echo.

timeout /t 3 /nobreak
exit /b 0
