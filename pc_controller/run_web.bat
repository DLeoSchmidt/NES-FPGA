@echo off
setlocal
title NES-FPGA Web & Node.js Controller

cd /d "%~dp0"

echo ======================================================================
echo          NES-FPGA DUAL CONTROLLER - SERVIDOR WEB ^& NODE.JS
echo ======================================================================

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERRO] O executavel do Node.js nao foi localizado no PATH do sistema.
    echo Por favor, instale o Node.js em: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [INFO] Iniciando servidor Web na porta 8080...
echo [INFO] Abrindo interface no navegador padrao...
start http://localhost:8080

node nes_controller.js

if %errorlevel% neq 0 (
    echo.
    echo [INFO] O servidor foi finalizado com codigo %errorlevel%.
    pause
)
