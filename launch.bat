@echo off
title PizzaRadar Sorrento
setlocal enabledelayedexpansion

echo === PizzaRadar Sorrento Unified Launcher ===
echo.

if not exist ".env" (
    echo [WARN] File .env non trovato. Copio da .env.example...
    copy .env.example .env >nul
    echo [WARN] Modifica .env e cambia JWT_SECRET, ADMIN_PASSWORD prima del deploy!
    echo.
)

echo Pulizia porte in uso...
for %%p in (5173 5174 5175 3000) do (
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%%p "') do (
        taskkill /PID %%a /F >nul 2>&1 && echo   Porta %%p liberata
    )
)

if not exist "node_modules" (
    echo Installazione dipendenze...
    call npm install
)

echo.
echo =============================================
echo   Avvio in corso (una sola finestra)...
echo   CTRL+C per fermare tutto.
echo.
echo   Frontend:  http://localhost:5173
echo   Admin:     http://localhost:5173/login
echo =============================================
echo.

npm run dev:all
