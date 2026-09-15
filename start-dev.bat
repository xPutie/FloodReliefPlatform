@echo off
title Flood Rescue Dev Suite Starter
echo ===================================================
echo   KHOI DONG DONG THOI BACKEND NESTJS & FRONTEND VITE
echo ===================================================
echo.

:: 1. Khoi dong Backend NestJS trong cua so CMD moi
echo [1/2] Dang khoi dong Backend API (NestJS)...
start "Backend API (NestJS)" cmd /k "cd /d %~dp0apps\api && npm run start:dev"

:: 2. Khoi dong Frontend Vite o cua so hien tai hoac cua so moi
echo [2/2] Dang khoi dong Frontend Web App (Vite)...
start "Frontend Web App (Vite)" cmd /k "cd /d %~dp0 && npm run dev"

echo.
echo ===================================================
echo   Da bat ca 2 process song song thanh cong!
echo   - Backend API:  http://localhost:3000
echo   - Frontend App: http://localhost:5173 (hoac cong Vite dang cap)
echo ===================================================
