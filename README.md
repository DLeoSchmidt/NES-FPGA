# NES-FPGA
NES (Nintendo Entertainment System) emulator in SystemVerilog for an Intel/Altera Max10 FPGA on a Terasic DE-10 Lite.

https://en.wikipedia.org/wiki/Nintendo_Entertainment_System

Uses a custom I/O expansion board with a MAX3421E USB controller for keyboard support.

I made everything except for the 6502 CPU core which I took from a previous revision of the MISTer NES (which they adapted from opencores.org), and I adapted some assets provided by my university (VGA display controller, Hex display driver, and the MAX3421E USB controller driver).

![Project Image](https://github.com/iandailis/NES-FPGA/blob/main/docs/IMG_20220826_020011.jpg)
![Project Image](https://github.com/iandailis/NES-FPGA/blob/main/docs/IMG_20220826_021004.jpg)
![Project Image](https://github.com/iandailis/NES-FPGA/blob/main/docs/resources.JPG)

> [!IMPORTANT]
> **Documentação de Compilação e Execução:**
> - 👉 **[COMPILACAO_DO_ZERO.md](COMPILACAO_DO_ZERO.md)**: **Guia Passo a Passo de Compilação do Zero** em qualquer computador novo, tanto via **Terminal (CLI)** quanto via **Interface Gráfica (Quartus Prime GUI + Eclipse)**.
> - 👉 **[`compile_project.bat`](compile_project.bat)** (ou `build_all.bat`): Script de compilação automatizada com detecção inteligente de toolchains (Quartus 18.1 / Nios II), suporte a `--flash`, `--firmware`, `--game <slug>`, `--quick` e `--clean`.
> - 👉 **[BUILD_GUIDE.md](BUILD_GUIDE.md)**: Guia completo de arquitetura do hardware Quartus, firmware Nios II, protocolo JTAG UART e configuração dos controladores Web e Python.

Folders:
- `cart_init/`: Biblioteca com 57 jogos Mapper 0 (NROM) prontos e CLI `switch_game.js` para troca instantânea de ROMs e compilação rápida via terminal.
- `eclipse/`: Workspace do Eclipse SBT para compilação e debug do firmware C do processador Nios II.
- `qsys/`: Projeto do Platform Designer (NIOSIIe.qsys) e código-fonte em C (`qsys/software/usb_controller/main.c`) com suporte a 2 jogadores via JTAG UART.
- `src/`: Descrição de hardware do NES em SystemVerilog (CPU 6502, PPU, RAM, Cartucho, VGA).
- `web_controller/`: Servidor Web + WebSocket com UI interativa para teclado e Gamepads USB/Bluetooth (P1 e P2).
- `pc_controller/`: Controlador de terminal em Python nativo a 60 FPS via Win32 API.

To load a game (optional, by default the emulator loads Super Mario Bros):
1. Download a NES ROM.
2. Create a hex dump of the ROM using VSCode. 
3. Delete the first line with offset information.
4. Place the dump into cart_init/python parsing/dumps and name it [dump_name_no_spaces]_dump.txt
5. Go to cart_init/python parsing and run the python parser with "python parse.py [dump_name_no_spaces]"

This initializes prg.mif and chr.mif, which is used by Quartus to initialize the cartridge roms. Look at the provided dumps to see the expected format for the parser. The iNES header should be the first line of the dump.

To run:
1. Open NES.qpf in Intel Quartus (tested on version 18.1).
2. Compile.
3. Program the FPGA.
5. Launch NIOS-II Build Tools for Eclipse, with working directory eclipse/
6. Mouse over "Run" then press "Run Configurations" then press "Run" 

Once the hex displays or the NIOS-II console is showing the pressed keycodes, you can begin to play!

Controls:
- KEY[0]: CPU Reset
- WASD: Arrow keys
- G: Select
- H: Start
- K: B
- L: A

Issues:
- No vertical scrolling.
- No audio support.
- Sprite 0 hit needs more work, flashing detatched backgrounds break the sync.
- CPU uses too much RAM. The CPU only needs a 2 kB RAM and a 32 kB program ROM, currently it uses a 64kB RAM for everything. 
- Second tile in the line is incorrect when scrolling
- Only supports mapper 0 (NROM) with vertical mirroring, and many other mapper specifics are also unsupported.
- No 8x16 sprite support
- No PPUMASK support
- Display is not centered on screen

Enjoy!
