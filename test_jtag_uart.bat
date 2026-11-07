@echo off
setlocal enabledelayedexpansion

echo =====================================================================
echo  NES-FPGA: Diagnostico do IP Intel JTAG UART (altera_avalon_jtag_uart)
echo =====================================================================

call "%~dp0pc_controller\test_jtag_uart.bat" %*
