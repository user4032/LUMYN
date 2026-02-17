@echo off
echo ================================================
echo   LUMYN Web Messenger - Starting...
echo ================================================
echo.

REM Kill any existing node processes
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo [1/2] Starting Server on port 4777...
start "LUMYN Server" cmd /k "cd /d %~dp0server && node app.js"

timeout /t 3 /nobreak >nul

echo [2/2] Starting Client on http://localhost:5173...
start "LUMYN Client" cmd /k "cd /d %~dp0client && npm run dev"

timeout /t 2 /nobreak >nul

echo.
echo ================================================
echo   LUMYN is starting!
echo ================================================
echo   Server: http://localhost:4777
echo   Client: http://localhost:5173
echo ================================================
echo.
echo Opening browser in 5 seconds...
timeout /t 5 /nobreak >nul
start http://localhost:5173

pause
