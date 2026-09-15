@echo off
title Flood Rescue Project Setup
echo ===================================================
echo   DANG THUC HIEN CAI DAT TOAN BO DU AN (SETUP)
echo ===================================================
echo.

:: 1. Cai dat tat ca dependencies tai Root & Workspaces
echo [1/4] Dang cai dat npm packages cho Root va Apps...
call npm install
if %errorlevel% neq 0 (
    echo [LOI] Khong the cai dat npm packages o Root.
    pause
    exit /b %errorlevel%
)

echo [2/4] Dang cai dat npm packages cho Backend API...
cd /d %~dp0apps\api
call npm install
if %errorlevel% neq 0 (
    echo [LOI] Khong the cai dat npm packages o Backend API.
    pause
    exit /b %errorlevel%
)

:: 3. Generate Prisma Client
echo [3/4] Dang tao Prisma Client database model...
call npx prisma generate
if %errorlevel% neq 0 (
    echo [LOI] Khong the generate Prisma Client.
    pause
    exit /b %errorlevel%
)

:: 4. Build kiem tra du an
echo [4/4] Dang kiem tra build du an...
cd /d %~dp0
call npm run build
if %errorlevel% neq 0 (
    echo [LOI] Kiem tra build that bai.
    pause
    exit /b %errorlevel%
)

echo.
echo ===================================================
echo   CAI DAT HOAN TAT THANH CONG!
echo   Ban co the chay 'start-dev.bat' hoac 'npm run dev'
echo   de khoi dong du an.
echo ===================================================
echo.
pause
