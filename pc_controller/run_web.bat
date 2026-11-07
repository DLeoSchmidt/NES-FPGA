@echo off
chcp 65001 >nul
setlocal
title NES-FPGA Web e Node.js Controller

cd /d "%~dp0"

echo ======================================================================
echo          NES-FPGA DUAL CONTROLLER - SERVIDOR WEB E NODE.JS
echo ======================================================================

set "NODE_CMD="
where node >nul 2>nul
if %errorlevel% equ 0 (
    set "NODE_CMD=node"
) else (
    if exist "C:\Program Files\nodejs\node.exe" (
        set "NODE_CMD=C:\Program Files\nodejs\node.exe"
        set "PATH=%PATH%;C:\Program Files\nodejs"
    ) else if exist "C:\Program Files (x86)\nodejs\node.exe" (
        set "NODE_CMD=C:\Program Files (x86)\nodejs\node.exe"
        set "PATH=%PATH%;C:\Program Files (x86)\nodejs"
    ) else if exist "%LOCALAPPDATA%\Programs\node\node.exe" (
        set "NODE_CMD=%LOCALAPPDATA%\Programs\node\node.exe"
        set "PATH=%PATH%;%LOCALAPPDATA%\Programs\node"
    ) else if exist "%APPDATA%\npm\node.exe" (
        set "NODE_CMD=%APPDATA%\npm\node.exe"
        set "PATH=%PATH%;%APPDATA%\npm"
    )
)

if "%NODE_CMD%"=="" (
    echo [ERRO] O executavel do Node.js nao foi localizado no PATH do sistema.
    echo Por favor, instale o Node.js em: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [INFO] Abrindo interface gráfica no navegador padrão (http://localhost:8080)...
start http://localhost:8080

echo [INFO] Iniciando ponte de controle com suporte a FPGA Real e Simulação...
"%NODE_CMD%" nes_controller.js

if %errorlevel% neq 0 (
    echo.
    echo [INFO] O servidor foi finalizado com codigo %errorlevel%.
    pause
)
