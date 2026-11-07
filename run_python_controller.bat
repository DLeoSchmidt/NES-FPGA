@echo off
chcp 65001 >nul
setlocal
title NES-FPGA Python Hardware Controller

cd /d "%~dp0pc_controller"

echo ======================================================================
echo          NES-FPGA DUAL CONTROLLER - CONSOLE PYTHON (WIN32 60FPS)
echo ======================================================================

set "PYTHON_CMD="
where python >nul 2>nul
if %errorlevel% equ 0 (
    set "PYTHON_CMD=python"
) else (
    if exist "C:\Python313\python.exe" (
        set "PYTHON_CMD=C:\Python313\python.exe"
        set "PATH=%PATH%;C:\Python313"
    ) else if exist "%LOCALAPPDATA%\Programs\Python\Python313\python.exe" (
        set "PYTHON_CMD=%LOCALAPPDATA%\Programs\Python\Python313\python.exe"
        set "PATH=%PATH%;%LOCALAPPDATA%\Programs\Python\Python313"
    ) else if exist "%LOCALAPPDATA%\Programs\Python\Python312\python.exe" (
        set "PYTHON_CMD=%LOCALAPPDATA%\Programs\Python\Python312\python.exe"
        set "PATH=%PATH%;%LOCALAPPDATA%\Programs\Python\Python312"
    ) else if exist "%LOCALAPPDATA%\Programs\Python\Python311\python.exe" (
        set "PYTHON_CMD=%LOCALAPPDATA%\Programs\Python\Python311\python.exe"
        set "PATH=%PATH%;%LOCALAPPDATA%\Programs\Python\Python311"
    ) else if exist "C:\Python312\python.exe" (
        set "PYTHON_CMD=C:\Python312\python.exe"
        set "PATH=%PATH%;C:\Python312"
    ) else if exist "C:\Python311\python.exe" (
        set "PYTHON_CMD=C:\Python311\python.exe"
        set "PATH=%PATH%;C:\Python311"
    )
)

if "%PYTHON_CMD%"=="" (
    echo [ERRO] O executavel do Python nao foi localizado no PATH do sistema.
    echo Por favor, instale o Python em: https://www.python.org/
    echo.
    pause
    exit /b 1
)

echo [INFO] Iniciando ponte de controle Python com amostragem direta de hardware...
"%PYTHON_CMD%" nes_controller.py

if %errorlevel% neq 0 (
    echo.
    echo [INFO] O controlador Python foi finalizado com codigo %errorlevel%.
    pause
)
