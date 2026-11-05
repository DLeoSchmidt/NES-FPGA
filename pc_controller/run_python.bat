@echo off
setlocal
title NES-FPGA Python Hardware Controller

cd /d "%~dp0"

echo ======================================================================
echo          NES-FPGA DUAL CONTROLLER - CONSOLE PYTHON (WIN32 60FPS)
echo ======================================================================

where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERRO] O executavel do Python nao foi localizado no PATH do sistema.
    echo Por favor, instale o Python em: https://www.python.org/
    echo.
    pause
    exit /b 1
)

python nes_controller.py

if %errorlevel% neq 0 (
    echo.
    echo [INFO] O controlador Python foi finalizado com codigo %errorlevel%.
    pause
)
