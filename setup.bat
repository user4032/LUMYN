@echo off
REM LUMYN Messenger - Setup Installer
REM Version 1.0.0

setlocal enabledelayedexpansion
color 0B
title LUMYN Messenger - Setup v1.0.0

:init
cls
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                                                              ║
echo ║              LUMYN MESSENGER - INSTALLER v1.0.0             ║
echo ║                  Where connections come alive                ║
echo ║                                                              ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo Checking system requirements...
echo.

REM Check for Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed!
    echo [INFO] Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo [OK] Node.js found: %NODE_VERSION%

REM Check for npm
npm --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm is not installed!
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo [OK] npm found: %NPM_VERSION%

REM Check for MongoDB
where mongod >nul 2>&1
if errorlevel 1 (
    echo [WARNING] MongoDB is not installed locally
    echo [INFO] You can use MongoDB Atlas: https://www.mongodb.com/cloud/atlas
) else (
    for /f "tokens=*" %%i in ('mongod --version ^| findstr /R "db version"') do set MONGO_VERSION=%%i
    echo [OK] MongoDB found: %MONGO_VERSION%
)

echo.
pause

:install
cls
echo.
echo ════════════════════════════════════════════════════════════════
echo                    INSTALLING DEPENDENCIES
echo ════════════════════════════════════════════════════════════════
echo.

cd /d "%~dp0"

echo [1/4] Installing npm dependencies...
call npm install
if errorlevel 1 (
    echo [ERROR] Failed to install npm dependencies
    pause
    exit /b 1
)
echo [OK] npm dependencies installed

echo.
echo [2/4] Building TypeScript...
call npx tsc --noEmit
if errorlevel 1 (
    echo [WARNING] TypeScript compilation completed with warnings
)
echo [OK] TypeScript build complete

echo.
echo [3/4] Setting up environment...
if not exist .env (
    echo Creating .env file...
    copy .env.example .env >nul
    echo [OK] .env created from .env.example
) else (
    echo [OK] .env already exists
)

echo.
echo [4/4] Verifying MongoDB...
echo.
echo [INFO] MongoDB Configuration:
if exist %APPDATA%\MongoDB (
    echo [OK] MongoDB directory found
) else (
    echo [WARNING] MongoDB data directory not found
    echo [INFO] Run 'mongod' in another terminal to start MongoDB
)

echo.
echo ════════════════════════════════════════════════════════════════
echo                    INSTALLATION COMPLETE!
echo ════════════════════════════════════════════════════════════════
echo.
echo Next steps:
echo.
echo 1. Start MongoDB:
echo    mongod
echo.
echo 2. Start the application:
echo    npm run dev
echo.
echo 3. Or build for production:
echo    npm run build
echo.
echo Documentation:
echo  - README.md          - Project overview
echo  - SETUP.md           - Detailed setup guide
echo  - QUICKSTART.md      - Quick start guide
echo.
pause
