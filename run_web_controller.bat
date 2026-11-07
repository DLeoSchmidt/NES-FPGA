@echo off
chcp 65001 >nul
setlocal
title NES-FPGA Web & Node.js Controller

cd /d "%~dp0pc_controller"

echo ======================================================================
echo          NES-FPGA DUAL CONTROLLER - SERVIDOR WEB & NODE.JS
echo ======================================================================

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERRO] O executavel do Node.js nao foi localizado no PATH do sistema.
    echo Por favor, instale o Node.js em: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [INFO] Abrindo interface gráfica no navegador padrão (http://localhost:8080)...
start http://localhost:8080

echo [INFO] Iniciando ponte de controle com suporte a FPGA Real e Simulação...
node nes_controller.js

if %errorlevel% neq 0 (
    echo.
    echo [INFO] O servidor foi finalizado com codigo %errorlevel%.
    pause
)
