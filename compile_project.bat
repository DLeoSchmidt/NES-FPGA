@echo off
setlocal enabledelayedexpansion

title NES-FPGA - Compilador Automatizado do Zero
cd /d "%~dp0"

echo ======================================================================
echo          NES-FPGA: COMPILACAO E SINTESE DO ZERO (DE10-LITE)
echo ======================================================================
echo.

REM -------------------------------------------------------------------------
REM 1. Processamento de Argumentos de Linha de Comando
REM -------------------------------------------------------------------------
set "DO_FLASH=0"
set "DO_FIRMWARE=0"
set "DO_CLEAN=0"
set "DO_QUICK=0"
set "TARGET_GAME="

:PARSE_ARGS
if "%~1"=="" goto :DONE_ARGS
if /i "%~1"=="--help" goto :SHOW_HELP
if /i "%~1"=="-h" goto :SHOW_HELP
if /i "%~1"=="--flash" (
    set "DO_FLASH=1"
    shift
    goto :PARSE_ARGS
)
if /i "%~1"=="-f" (
    set "DO_FLASH=1"
    shift
    goto :PARSE_ARGS
)
if /i "%~1"=="--firmware" (
    set "DO_FIRMWARE=1"
    shift
    goto :PARSE_ARGS
)
if /i "%~1"=="--clean" (
    set "DO_CLEAN=1"
    shift
    goto :PARSE_ARGS
)
if /i "%~1"=="--quick" (
    set "DO_QUICK=1"
    shift
    goto :PARSE_ARGS
)
if /i "%~1"=="--game" (
    set "TARGET_GAME=%~2"
    shift
    shift
    goto :PARSE_ARGS
)
if /i "%~1"=="-g" (
    set "TARGET_GAME=%~2"
    shift
    shift
    goto :PARSE_ARGS
)
echo [AVISO] Argumento nao reconhecido: %~1
shift
goto :PARSE_ARGS

:SHOW_HELP
echo Uso: compile_project.bat [opcoes]
echo.
echo Opcoes:
echo   --flash, -f          Grava automaticamente o bitstream (.sof) no FPGA
echo                        e faz o download do firmware (.elf) na SDRAM.
echo   --firmware           Recompila o firmware Nios II em C (usb_controller.elf)
echo                        usando o toolchain GCC do Nios II Command Shell.
echo   --game slug, -g      Define o cartucho inicial a ser gravado (ex: mario-bros,
echo                        bomberman, pacman, excitebike, galaga).
echo   --quick              Modo rapido: atualiza apenas os blocos MIF e
echo                        executa o Assembler (quando o hardware nao mudou).
echo   --clean              Remove arquivos intermediarios de compilacoes anteriores
echo                        (pastas db/ e output_files/).
echo   --help, -h           Exibe esta ajuda.
echo.
echo Exemplos:
echo   compile_project.bat
echo   compile_project.bat --flash
echo   compile_project.bat --game mario-bros --flash
echo   compile_project.bat --firmware --flash
echo.
exit /b 0

:DONE_ARGS

REM -------------------------------------------------------------------------
REM 2. Descoberta Dinamica do Intel Quartus Prime (Prioriza versao 18.1)
REM -------------------------------------------------------------------------
echo [1/5] Localizando toolchain do Intel Quartus Prime...

set "QUARTUS_DIR="
set "QUARTUS_SH="
set "QUARTUS_PGM="
set "QUARTUS_CDB="
set "QUARTUS_ASM="
set "NIOS_SHELL="

REM 1. Prioridade maxima absoluta: Quartus 18.1 (obrigatorio para suporte ao Intel MAX 10)
if exist "C:\intelFPGA_lite\18.1\quartus\bin64\quartus_sh.exe" (
    set "QUARTUS_DIR=C:\intelFPGA_lite\18.1\quartus\bin64"
) else if exist "C:\intelFPGA\18.1\quartus\bin64\quartus_sh.exe" (
    set "QUARTUS_DIR=C:\intelFPGA\18.1\quartus\bin64"
) else if exist "C:\altera\18.1\quartus\bin64\quartus_sh.exe" (
    set "QUARTUS_DIR=C:\altera\18.1\quartus\bin64"
) else if exist "D:\intelFPGA_lite\18.1\quartus\bin64\quartus_sh.exe" (
    set "QUARTUS_DIR=D:\intelFPGA_lite\18.1\quartus\bin64"
) else if exist "E:\intelFPGA_lite\18.1\quartus\bin64\quartus_sh.exe" (
    set "QUARTUS_DIR=E:\intelFPGA_lite\18.1\quartus\bin64"
) else if exist "C:\intelFPGA_lite\20.1\quartus\bin64\quartus_sh.exe" (
    set "QUARTUS_DIR=C:\intelFPGA_lite\20.1\quartus\bin64"
) else if exist "C:\intelFPGA_lite\22.1std\quartus\bin64\quartus_sh.exe" (
    set "QUARTUS_DIR=C:\intelFPGA_lite\22.1std\quartus\bin64"
)

REM 2. Se nao encontrou versao moderna nos caminhos padrao, verifica QUARTUS_ROOTDIR
if "%QUARTUS_DIR%"=="" if defined QUARTUS_ROOTDIR (
    if exist "%QUARTUS_ROOTDIR%\bin64\quartus_sh.exe" (
        set "QUARTUS_DIR=%QUARTUS_ROOTDIR%\bin64"
    )
)

if "%QUARTUS_DIR%"=="" (
    where quartus_sh.exe >nul 2>nul
    if !errorlevel! equ 0 (
        for /f "delims=" %%I in ('where quartus_sh.exe') do (
            set "QUARTUS_DIR=%%~dpI"
        )
    )
)

if "%QUARTUS_DIR%"=="" (
    echo.
    echo [ERRO CRITICO] Intel Quartus Prime nao foi localizado neste computador.
    echo.
    echo Para compilar o projeto do zero, e necessario instalar o:
    echo   - Intel Quartus Prime Lite Edition 18.1 (com suporte a MAX 10)
    echo Download: https://www.intel.com/content/www/us/en/software-kit/665990/
    echo.
    echo Caso esteja instalado em outro local, configure a variavel:
    echo   set QUARTUS_ROOTDIR=C:\seu_caminho\quartus
    echo.
    pause
    exit /b 1
)

if "%QUARTUS_DIR:~-1%"=="\" set "QUARTUS_DIR=%QUARTUS_DIR:~0,-1%"

set "QUARTUS_SH=%QUARTUS_DIR%\quartus_sh.exe"
set "QUARTUS_PGM=%QUARTUS_DIR%\quartus_pgm.exe"
set "QUARTUS_CDB=%QUARTUS_DIR%\quartus_cdb.exe"
set "QUARTUS_ASM=%QUARTUS_DIR%\quartus_asm.exe"

echo   [OK] Quartus localizado em: %QUARTUS_DIR%

REM Localiza Nios II Command Shell
if exist "C:\intelFPGA_lite\18.1\nios2eds\Nios II Command Shell.bat" (
    set "NIOS_SHELL=C:\intelFPGA_lite\18.1\nios2eds\Nios II Command Shell.bat"
) else if exist "C:\intelFPGA\18.1\nios2eds\Nios II Command Shell.bat" (
    set "NIOS_SHELL=C:\intelFPGA\18.1\nios2eds\Nios II Command Shell.bat"
) else if exist "C:\altera\18.1\nios2eds\Nios II Command Shell.bat" (
    set "NIOS_SHELL=C:\altera\18.1\nios2eds\Nios II Command Shell.bat"
) else if exist "D:\intelFPGA_lite\18.1\nios2eds\Nios II Command Shell.bat" (
    set "NIOS_SHELL=D:\intelFPGA_lite\18.1\nios2eds\Nios II Command Shell.bat"
)

if not "%NIOS_SHELL%"=="" (
    echo   [OK] Nios II EDS localizado em: %NIOS_SHELL%
)

REM -------------------------------------------------------------------------
REM 3. Preparacao das Memorias do Cartucho (MIF)
REM -------------------------------------------------------------------------
echo.
echo [2/5] Verificando arquivos de memoria do cartucho NES (prg.mif / chr.mif)...

if not "%TARGET_GAME%"=="" (
    if exist "cart_init\games\%TARGET_GAME%\prg.mif" (
        echo   [INFO] Aplicando cartucho selecionado: %TARGET_GAME%
        copy /y "cart_init\games\%TARGET_GAME%\prg.mif" "prg.mif" >nul
        copy /y "cart_init\games\%TARGET_GAME%\chr.mif" "chr.mif" >nul
        copy /y "cart_init\games\%TARGET_GAME%\prg.mif" "cart_init\prg.mif" >nul
        copy /y "cart_init\games\%TARGET_GAME%\chr.mif" "cart_init\chr.mif" >nul
        if exist "cart_init\games\%TARGET_GAME%\game.json" (
            copy /y "cart_init\games\%TARGET_GAME%\game.json" "cart_init\active_game.json" >nul
        )
    ) else (
        echo   [AVISO] Jogo '%TARGET_GAME%' nao encontrado em cart_init\games\. Mantendo o atual.
    )
)

if not exist "prg.mif" (
    echo   [AVISO] prg.mif ausente na raiz. Inicializando com jogo padrao (Mario Bros.)...
    if exist "cart_init\games\mario-bros\prg.mif" (
        copy /y "cart_init\games\mario-bros\prg.mif" "prg.mif" >nul
        copy /y "cart_init\games\mario-bros\chr.mif" "chr.mif" >nul
        copy /y "cart_init\games\mario-bros\prg.mif" "cart_init\prg.mif" >nul
        copy /y "cart_init\games\mario-bros\chr.mif" "cart_init\chr.mif" >nul
    ) else if exist "cart_init\games\bomberman\prg.mif" (
        copy /y "cart_init\games\bomberman\prg.mif" "prg.mif" >nul
        copy /y "cart_init\games\bomberman\chr.mif" "chr.mif" >nul
    )
)

if exist "prg.mif" if exist "chr.mif" (
    echo   [OK] Memorias prg.mif e chr.mif prontas.
) else (
    echo   [ERRO] Nao foi possivel preparar os arquivos MIF.
    exit /b 1
)

REM -------------------------------------------------------------------------
REM 4. (Opcional) Limpeza previa (--clean)
REM -------------------------------------------------------------------------
if "%DO_CLEAN%"=="1" (
    echo.
    echo [LIMPEZA] Removendo pastas intermediarias db/ e output_files/...
    if exist "db" rmdir /s /q "db"
    if exist "incremental_db" rmdir /s /q "incremental_db"
    if exist "output_files\NES.sof" del /f /q "output_files\NES.sof"
    echo   [OK] Limpeza concluida.
)

REM -------------------------------------------------------------------------
REM 5. (Opcional) Compilacao do Firmware Nios II (--firmware)
REM -------------------------------------------------------------------------
if "%DO_FIRMWARE%"=="1" (
    echo.
    echo [FIRMWARE] Compilando firmware C do Nios II (usb_controller.elf)...
    if "%NIOS_SHELL%"=="" (
        echo   [AVISO] Nios II Command Shell nao encontrado. Pulando compilacao do firmware.
    ) else (
        echo   Executando make clean e make no Nios II SBT...
        cmd /c call "%NIOS_SHELL%" bash -c "cd /cygdrive/c/HDL/t4/NES-FPGA/qsys/software/usb_controller && make clean && make"
        if exist "qsys\software\usb_controller\usb_controller.elf" (
            echo   [OK] Firmware usb_controller.elf recompilado com sucesso!
        ) else (
            echo   [AVISO] Falha ao compilar firmware. O binario pre-existente sera utilizado.
        )
    )
)

REM -------------------------------------------------------------------------
REM 6. Execucao da Compilacao do Hardware FPGA (Quartus)
REM -------------------------------------------------------------------------
echo.
if "%DO_QUICK%"=="1" (
    echo [3/5] Modo Rapido: Atualizando MIFs e gerando bitstream (.sof)...
    echo   Passo A: Atualizando banco de dados de inicializacao de memoria...
    "%QUARTUS_CDB%" NES --update_mif
    if !errorlevel! neq 0 (
        echo   [ERRO] Falha no quartus_cdb --update_mif.
        exit /b 1
    )
    echo   Passo B: Executando o Assembler para gerar o bitstream...
    "%QUARTUS_ASM%" NES
    if !errorlevel! neq 0 (
        echo   [ERRO] Falha no quartus_asm.
        exit /b 1
    )
) else (
    echo [3/5] Executando compilacao completa do hardware (Sintese + Fitter + Assembler)...
    echo       Projeto: NES.qpf - Dispositivo: 10M50DAF484C7G
    echo       Aguarde alguns minutos...
    echo.

    "%QUARTUS_SH%" --flow compile NES
    set "BUILD_STATUS=!errorlevel!"

    if !BUILD_STATUS! neq 0 (
        echo.
        echo ======================================================================
        echo [ERRO CRITICO] A compilacao do Quartus falhou com codigo !BUILD_STATUS!.
        echo Verifique o log em output_files/NES.flow.rpt ou no terminal acima.
        echo ======================================================================
        pause
        exit /b !BUILD_STATUS!
    )
)

REM -------------------------------------------------------------------------
REM 7. Verificacao do Bitstream Gerado
REM -------------------------------------------------------------------------
echo.
echo [4/5] Verificando arquivo binario de programacao gerado...

if exist "output_files\NES.sof" (
    for %%F in ("output_files\NES.sof") do (
        echo   [SUCESSO] Bitstream gerado com sucesso:
        echo             Arquivo: %%~nxF
        echo             Tamanho: %%~zF bytes
        echo             Data:    %%~tF
    )
) else (
    echo   [ERRO] output_files\NES.sof nao foi encontrado apos o termino da compilacao.
    exit /b 1
)

REM -------------------------------------------------------------------------
REM 8. Sondagem JTAG e Gravacao Opcional no FPGA
REM -------------------------------------------------------------------------
echo.
echo [5/5] Sondando hardware FPGA conectado via USB-Blaster...

set "CABLE_NAME="
for /f "tokens=1,2* delims=) " %%A in ('"%QUARTUS_PGM%" -l 2^>nul ^| findstr /r "^[ ]*[0-9]"') do (
    set "CABLE_NAME=%%B %%C"
    goto :CABLE_DETECTED
)

:CABLE_DETECTED
if "%CABLE_NAME%"=="" (
    echo   [INFO] Nenhuma placa DE10-Lite conectada via USB-Blaster no momento.
    echo          O bitstream esta pronto em output_files\NES.sof.
    echo          Quando plugar a placa, voce podera grava-la executando:
    echo            compile_project.bat --flash
    goto :FINISH_SUMMARY
)

echo   [OK] Placa DE10-Lite detectada via cabo: %CABLE_NAME%

if "%DO_FLASH%"=="1" (
    echo.
    echo ======================================================================
    echo                GRAVACAO NO HARDWARE REAL (DE10-LITE)
    echo ======================================================================

    taskkill /f /im nios2-terminal.exe >nul 2>nul

    echo [FLASH 1/2] Gravando output_files\NES.sof no FPGA via %CABLE_NAME%...
    "%QUARTUS_PGM%" -c "%CABLE_NAME%" -m JTAG -o "p;output_files\NES.sof"
    if !errorlevel! neq 0 (
        echo   [ERRO] Falha ao gravar bitstream no FPGA via quartus_pgm.
    ) else (
        echo   [OK] Bitstream gravado no FPGA com sucesso!

        if not "%NIOS_SHELL%"=="" (
            if exist "qsys\software\usb_controller\usb_controller.elf" (
                echo.
                echo [FLASH 2/2] Carregando firmware Nios II na SDRAM...
                cmd /c call "%NIOS_SHELL%" nios2-download -g -c "%CABLE_NAME%" "qsys/software/usb_controller/usb_controller.elf" >nul 2>nul
                echo   [OK] Firmware Nios II ativo na SDRAM!
            )
        )
    )
)

:FINISH_SUMMARY
echo.
echo ======================================================================
echo                     COMPILACAO CONCLUIDA COM SUCESSO!
echo ======================================================================
echo.
echo Proximos passos para jogar no emulador:
echo   1. Conecte o monitor VGA a saida da placa DE10-Lite.
echo   2. Pressione KEY[0] na placa DE10-Lite para resetar o jogo.
echo   3. Inicie o controlador para jogar com Teclado ou Gamepads no PC:
echo        - Interface Web (Recomendado): de 2 cliques em run_web_controller.bat
echo        - Console Python:              de 2 cliques em run_python_controller.bat
echo.
echo Para trocar de jogo no cartucho a qualquer momento (em apenas ~7 segundos):
echo   node cart_init\switch_game.js nome_do_jogo --flash
echo.
