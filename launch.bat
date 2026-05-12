@echo off
title PizzaRadar Sorrentum
setlocal enabledelayedexpansion

echo === PizzaRadar Sorrentum Launcher ===
echo.

if not exist ".env" (
    echo [WARN] File .env non trovato. Copio da .env.example...
    copy .env.example .env >nul
    echo [WARN] Modifica .env e cambia JWT_SECRET, ADMIN_PASSWORD prima del deploy!
    echo.
)

echo Pulizia porte in uso (5173-5175, 3000-3001)...
for %%p in (5173 5174 5175 3000 3001) do (
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%%p "') do (
        taskkill /PID %%a /F >nul 2>&1 && echo   Porta %%p liberata
    )
)

taskkill /IM node.exe /F >nul 2>&1
timeout /t 2 /nobreak >nul

for /f "tokens=2 delims==" %%a in ('findstr /b "PORT=" .env') do set PORT=%%a
if not defined PORT set PORT=3000

if not exist "node_modules" (
    echo Installazione dipendenze...
    call npm install
    if errorlevel 1 (
        echo [ERRORE] npm install fallito
        pause
        exit /b 1
    )
)

echo Avvio backend (Express :3001)...
start "PizzaRadar-Backend" cmd /c "title PizzaRadar Backend && npm run server:dev"
timeout /t 3 /nobreak >nul

echo Avvio frontend (Vite :5173)...
start "PizzaRadar-Frontend" cmd /c "title PizzaRadar Frontend && npm run dev"
timeout /t 2 /nobreak >nul

echo.
echo =============================================
echo   Frontend:  http://localhost:5173
echo   API:       http://localhost:%PORT%/api/...
echo   Health:    http://localhost:%PORT%/health
echo   Admin:     http://localhost:%PORT%/login
echo   Username:  peninsula-ovserver
echo   Password:  PizzaAdmin2024!
echo =============================================
echo.
echo Premi un tasto per fermare i server...
pause >nul

echo.
echo Fermo i server...
taskkill /FI "WINDOWTITLE eq PizzaRadar-Backend*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq PizzaRadar-Frontend*" /F >nul 2>&1
taskkill /IM node.exe /F >nul 2>&1
echo Server fermati.
timeout /t 1 /nobreak >nul
