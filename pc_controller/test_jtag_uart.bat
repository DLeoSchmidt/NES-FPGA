@echo off
setlocal enabledelayedexpansion

echo =====================================================================
echo  NES-FPGA: Diagnostico do IP Intel JTAG UART (altera_avalon_jtag_uart)
echo =====================================================================

:: Localiza o executavel do Python
set "PY_CMD="

where py.exe >nul 2>&1
if !errorlevel! equ 0 (
    set "PY_CMD=py.exe"
    goto :RUN_PY
)

where python.exe >nul 2>&1
if !errorlevel! equ 0 (
    set "PY_CMD=python.exe"
    goto :RUN_PY
)

if exist "C:\Python313\python.exe" (
    set "PY_CMD=C:\Python313\python.exe"
    goto :RUN_PY
)
if exist "%LOCALAPPDATA%\Programs\Python\Python313\python.exe" (
    set "PY_CMD=%LOCALAPPDATA%\Programs\Python\Python313\python.exe"
    goto :RUN_PY
)
if exist "C:\Python312\python.exe" (
    set "PY_CMD=C:\Python312\python.exe"
    goto :RUN_PY
)
if exist "%LOCALAPPDATA%\Programs\Python\Python312\python.exe" (
    set "PY_CMD=%LOCALAPPDATA%\Programs\Python\Python312\python.exe"
    goto :RUN_PY
)
if exist "C:\Python311\python.exe" (
    set "PY_CMD=C:\Python311\python.exe"
    goto :RUN_PY
)

echo [ERRO] Python nao foi encontrado no sistema.
echo Por favor, instale o Python ou adicione ao PATH.
pause
exit /b 1

:RUN_PY
cd /d "%~dp0"
echo Utilizando Python: !PY_CMD!
echo.
"!PY_CMD!" test_jtag_uart.py %*
echo.
pause
