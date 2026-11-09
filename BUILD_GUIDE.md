# Guia Completo de Compilação e Execução do NES-FPGA

Este guia documenta detalhadamente todo o processo de desenvolvimento, compilação de hardware, compilação de software/firmware do processador Nios II e execução do emulador NES na placa de desenvolvimento **Terasic DE10-Lite** (Intel MAX 10 `10M50DAF484C7G`).

> [!TIP]
> **Precisa compilar do zero em um computador novo ou executar em 1 clique?**
> - Acesse o **[COMPILACAO_DO_ZERO.md](COMPILACAO_DO_ZERO.md)** para o passo a passo completo desde a instalação das ferramentas até a execução final.
> - Ou execute o script automatizado **[`compile_project.bat`](compile_project.bat)** (ex: `compile_project.bat --flash --firmware`).

---

## Sumário
1. [Visão Geral da Arquitetura](#1-visão-geral-da-arquitetura)
2. [Requisitos de Software e Hardware](#2-requisitos-de-software-e-hardware)
3. [Estrutura de Diretórios](#3-estrutura-de-diretórios)
4. [Método 1: Compilação e Execução via Interface Gráfica (GUI)](#4-método-1-compilação-e-execução-via-interface-gráfica-gui)
   - [4.1 Compilar o Hardware no Intel Quartus Prime](#41-compilar-o-hardware-no-intel-quartus-prime)
   - [4.2 Gravar o Bitstream (.sof) no FPGA](#42-gravar-o-bitstream-sof-no-fpga)
   - [4.3 Compilar o Código C no Nios II SBT for Eclipse](#43-compilar-o-código-c-no-nios-ii-sbt-for-eclipse)
   - [4.4 Fazer o Download e Executar o Firmware (.elf)](#44-fazer-o-download-e-executar-o-firmware-elf)
5. [Método 2: Compilação e Execução via Linha de Comando (CLI)](#5-método-2-compilação-e-execução-via-linha-de-comando-cli)
   - [5.1 Compilar o Firmware C com o Nios II Command Shell](#51-compilar-o-firmware-c-com-o-nios-ii-command-shell)
   - [5.2 Compilar e Gravar o Hardware via Quartus CLI](#52-compilar-e-gravar-o-hardware-via-quartus-cli)
6. [Troca Rápida de Jogos (Sem Recompilação Completa)](#6-troca-rápida-de-jogos-sem-recompilação-completa)
7. [Iniciando os Servidores de Controle (PC / Teclado / Gamepad)](#7-iniciando-os-servidores-de-controle-pc--teclado--gamepad)
8. [Fluxo Resumido de Execução no Dia a Dia](#8-fluxo-resumido-de-execução-no-dia-a-dia)
9. [Diagnóstico e Solução de Problemas (Troubleshooting)](#9-diagnóstico-e-solução-de-problemas-troubleshooting)

---

## 1. Visão Geral da Arquitetura

O sistema é dividido em três camadas integradas:

```
+-----------------------------------------------------------------------------------+
|                                 COMPUTADOR HOST                                   |
|                                                                                   |
|  [ Navegador Web / Gamepads ]            [ Terminal Python ]                      |
|  run_web_controller.bat                  run_python_controller.bat                |
|  (Porta 3000 -> WebSockets)              (Captura Win32 GetAsyncKeyState)        |
|               |                                       |                           |
|               +-------------------+-------------------+                           |
|                                   v                                               |
|                    [ jtag_atlantic.dll / libusb ]                                 |
|                 Ponte de Comunicação USB-Blaster II                               |
+-----------------------------------|-----------------------------------------------+
                                    | Cabo USB Mini-B
+-----------------------------------|-----------------------------------------------+
|                             PLACA TERASIC DE10-LITE                               |
|                                   v                                               |
|  +-----------------------------------------------------------------------------+  |
|  | HARDWARE FPGA (MAX 10 - 10M50DAF484C7G)                                     |  |
|  |                                                                             |  |
|  |  [ JTAG UART Core ] <--- Recebe pacotes de controle (0xP1, 0xP2)            |  |
|  |          |                                                                  |  |
|  |          v                                                                  |  |
|  |  [ Softcore Nios II/e ] (Executa usb_controller.elf carregado na SDRAM)     |  |
|  |          |                                                                  |  |
|  |          +---> PIO keycode_export    (Player 1 NES Byte)                    |  |
|  |          +---> PIO p2_keycode_export (Player 2 NES Byte)                    |  |
|  |                                                                             |  |
|  |  [ Emulador NES em SystemVerilog ]                                          |  |
|  |    * CPU 6502 (Custom MISTer adaptation)                                    |  |
|  |    * PPU (Picture Processing Unit - Paleta e Scanlines)                     |  |
|  |    * Memória de Cartucho: prg.mif (Programa) e chr.mif (Gráficos)           |  |
|  |    * Interface de Shift Register dos Controles (P1 e P2)                    |  |
|  |    * Controlador VGA 640x480 @ 60Hz                                         |  |
|  +-----------------------------------------------------------------------------+  |
|             |                                                                     |
|             +---> Saída VGA DB-15 (Monitor / TV)                                  |
|             +---> Display de 7 Segmentos HEX0-HEX3 (Debug de keycodes)            |
+-----------------------------------------------------------------------------------+
```

### Por que o Nios II precisa ser carregado após o `.sof`?
No design do Platform Designer (`qsys/NIOSIIe.qsys`), o endereço de reset (**Reset Vector**) e o vetor de exceções (**Exception Vector**) do Nios II estão mapeados na **SDRAM externa de 64 MB** da placa DE10-Lite (`0x08000000`). Como a SDRAM é uma memória volátil que perde os dados ao reiniciar o FPGA, **toda vez que o arquivo `.sof` é gravado na placa, o firmware `.elf` deve ser recarregado na SDRAM via JTAG**.

---

## 2. Requisitos de Software e Hardware

### Hardware Necessário:
- 1x Placa de desenvolvimento **Terasic DE10-Lite** (FPGA Intel MAX 10 `10M50DAF484C7G`).
- 1x Cabo USB Mini-B (para programação via USB-Blaster e canal JTAG UART).
- 1x Monitor VGA com cabo VGA macho-macho (resolução recomendada: 640x480 @ 60 Hz).
- (Opcional) Controles USB ou Bluetooth conectados ao computador host.

### Software no Computador:
- **Intel Quartus Prime Lite Edition 18.1**:
  > [!IMPORTANT]
  > O FPGA Intel MAX 10 `10M50DAF484C7G` **não é suportado pelo Quartus 13.1**. O projeto foi sintetizado e validado na versão **Quartus Prime Lite 18.1**, que possui prioridade máxima absoluta no pipeline de scripts automatizados (`cart_init/quartus_cli.js`, `pc_controller/nes_controller.js` e `nes_controller.py`).
- **Nios II Software Build Tools (SBT) / EDS 18.1** (incluído na instalação do Quartus 18.1).
- **Node.js** (versão 18 ou superior) instalado no Windows.
- **Python** (versão 3.8 ou superior) com pacote `pyserial` opcional para suporte a DB9 (`pip install pyserial`).

---

## 3. Estrutura de Diretórios

```
C:\HDL\t4\NES-FPGA\
├── NES.qpf                   <- Arquivo de Projeto do Intel Quartus Prime
├── NES.qsf                   <- Definições de pinagem e parâmetros do FPGA
├── prg.mif / chr.mif         <- Imagens ativas de memória do jogo carregado
├── BUILD_GUIDE.md            <- Este guia de compilação
├── README.md                 <- Visão geral do repositório
│
├── src/                      <- Código Fonte em SystemVerilog do Hardware NES
│   ├── top.sv                <- Módulo Top-Level (integração NES + Nios II + VGA + HEX Debug)
│   ├── nes.sv                <- Core do emulador Nintendo Entertainment System
│   ├── cpu.sv / ppu.sv       <- Processador 6502 e Unidade de Processamento Gráfico
│   ├── ram.sv / cart.sv      <- Memória interna e controladora do cartucho
│   ├── controller.sv         <- Driver de controles (Modo Dual Mask P1/P2)
│   ├── HexDriver.sv          <- Decodificador de 7 segmentos para os displays HEX0-HEX5
│   └── vga_controller.sv     <- Controlador de sincronismo VGA 640x480
│
├── qsys/                     <- Platform Designer (Qsys) e Software Nios II
│   ├── NIOSIIe.qsys          <- Descrição do sistema Nios II (CPU, SDRAM, JTAG UART, PIOs)
│   └── software/
│       ├── usb_controller/       <- Aplicação C do Nios II (main.c de ultra-baixa latência)
│       └── usb_controller_bsp/   <- Board Support Package gerado pelo Qsys
│
├── eclipse/                  <- Workspace do Eclipse SBT pré-configurado
├── cart_init/                <- Biblioteca de ROMs e scripts de chaveamento
│   ├── switch_game.js        <- CLI para listagem, busca e troca rápida de jogos
│   ├── quartus_cli.js        <- Utilitário de auto-detecção priorizando Quartus 18.1
│   └── games/                <- 57 jogos NROM (Mapper 0) compilados (.mif)
│
├── pc_controller/            <- Controladores PC (Node.js Web + Python Console + Serial DB9)
│   ├── nes_controller.js     <- Servidor Web + WebSocket + Ponte JTAG UART + Serial DB9
│   ├── nes_controller.py     <- Console Python nativo Win32 (60 FPS) + Serial DB9
│   └── web/                  <- Interface HTML5 com suporte a Teclado, Gamepads e WebSerial
│
├── run_web_controller.bat    <- Atalho de 1 clique para iniciar o servidor Web
└── run_python_controller.bat <- Atalho de 1 clique para iniciar o controle Python
```

---

## 4. Método 1: Compilação e Execução via Interface Gráfica (GUI)

Este é o fluxo recomendado para uso nos computadores de laboratório da universidade.

### 4.1 Compilar o Hardware no Intel Quartus Prime

1. Inicie o **Intel Quartus Prime Lite** (versão 18.1 ou mais recente).
2. Vá em **File -> Open Project...** e selecione o arquivo:
   `C:\HDL\t4\NES-FPGA\NES.qpf`
3. *(Opcional - apenas se você alterou periféricos no Qsys)*:
   - Vá em **Tools -> Platform Designer** (ou **Qsys**).
   - Abra o arquivo `qsys/NIOSIIe.qsys`.
   - Clique em **Generate HDL...** e confirme em **Generate**. Ao concluir, feche a janela do Platform Designer.
4. Para iniciar a síntese e compilação do hardware:
   - Vá no menu **Processing -> Start Compilation** (ou pressione o atalho **`Ctrl + L`**).
   - O Quartus executará as etapas: *Analysis & Synthesis*, *Fitter (Place & Route)*, *Assembler* e *TimeQuest Timing Analysis*.
   - Ao final (aproximadamente 3 a 5 minutos), você verá a mensagem **Quartus Prime Full Compilation was successful**.
   - O arquivo binário do hardware gerado será:
     `C:\HDL\t4\NES-FPGA\output_files\NES.sof`

---

### 4.2 Gravar o Bitstream (.sof) no FPGA

1. Conecte o cabo USB na porta **USB-Blaster** da placa DE10-Lite e no computador.
2. Certifique-se de que a chave de alimentação da placa está na posição **ON**.
3. No Quartus Prime, abra a ferramenta de gravação:
   - Menu **Tools -> Programmer**.
4. Configure o cabo JTAG:
   - Clique no botão **Hardware Setup...** no canto superior esquerdo.
   - Em *Currently selected hardware*, selecione **USB-Blaster [USB-0]** (ou similar) e clique em **Close**.
5. Adicione o arquivo `.sof`:
   - Se o arquivo `NES.sof` não estiver listado na tabela, clique em **Add File...**.
   - Navegue até `output_files/` e selecione `NES.sof`.
6. Seleção de programação:
   - Marque a caixa de seleção **Program/Configure** na linha do chip `10M50DAF484`.
7. Gravação:
   - Clique no botão **Start**.
   - A barra *Progress* no topo deve atingir **100% (Successful)**.
   - A placa DE10-Lite agora contém o hardware do emulador NES sintetizado.

---

### 4.3 Compilar o Código C no Nios II SBT for Eclipse

Quando você alterar o código C em `qsys/software/usb_controller/main.c`, execute os passos abaixo:

1. No Quartus Prime, abra o Eclipse:
   - Menu **Tools -> Nios II Software Build Tools for Eclipse**.
2. Na janela de seleção de **Workspace Launcher**:
   - Clique em **Browse...** e aponte para a pasta `eclipse/`:
     `C:\HDL\t4\NES-FPGA\eclipse`
   - Clique em **OK**.
3. Se os projetos não aparecerem no painel *Project Explorer* à esquerda:
   - Vá em **File -> Import... -> General -> Existing Projects into Workspace**.
   - Em *Select root directory*, selecione a pasta `qsys/software/`.
   - Marque os projetos `usb_controller` e `usb_controller_bsp`.
   - Clique em **Finish**.
4. Atualizar o BSP (apenas se você modificou o hardware Qsys):
   - Clique com o botão direito no projeto **`usb_controller_bsp`**.
   - Selecione **Nios II -> Generate BSP**.
5. Compilar o programa:
   - Clique com o botão direito no projeto **`usb_controller`**.
   - Selecione **Build Project**.
   - O console inferior exibirá o progresso do GCC (`nios2-elf-gcc`).
   - Ao concluir sem erros, o arquivo binário compilado estará pronto:
     `qsys/software/usb_controller/usb_controller.elf`

---

### 4.4 Fazer o Download e Executar o Firmware (.elf)

Com a placa ligada e o arquivo `.sof` já gravado:

1. No Eclipse, clique com o botão direito no projeto **`usb_controller`**.
2. Vá em **Run As -> Nios II Hardware**.
   *(Se for a primeira vez ou se precisar configurar: vá em **Run -> Run Configurations...**, selecione `Nios II Hardware` -> `New_configuration`)*.
3. Na aba **Target Connection**:
   - Verifique se o cabo USB-Blaster está detectado. Clique em **Refresh Connections** se necessário.
   - Marque a opção **Ignore factored-out components**.
4. Clique em **Run**.
5. O Eclipse fará o download do executável `.elf` diretamente na SDRAM do FPGA e abrirá o painel **Nios II Console**.
6. A mensagem inicial do firmware aparecerá no console:
   ```text
   NES Controller Bridge Ready!
   P1 Default: 0x00
   P2 Default: 0x00
   ```

---

## 5. Método 2: Compilação e Execução via Linha de Comando (CLI)

Para automação rápida, scripts contínuos ou sem necessidade de abrir interfaces pesadas.

### 5.1 Compilar o Firmware C com o Nios II Command Shell

O Nios II Embedded Design Suite (EDS) inclui um ambiente completo baseado em Cygwin/Bash com o toolchain GCC (`nios2-elf-gcc`).

1. Abra o terminal especial do Nios II:
   - Pressione **Win + R**, digite o caminho correspondente à sua instalação e pressione Enter:
     ```cmd
     C:\intelFPGA_lite\18.1\nios2eds\Nios II Command Shell.bat
     ```
     *(ou substitua `18.1` pela versão instalada, ex: `20.1`, `24.1`)*.
2. No shell bash aberto, navegue até a pasta da aplicação:
   ```bash
   cd /cygdrive/c/HDL/t4/NES-FPGA/qsys/software/usb_controller
   ```
3. (Opcional) Se o hardware Qsys foi alterado, regenere o BSP e a aplicação:
   ```bash
   cd ../usb_controller_bsp && ./create-this-bsp && cd ../usb_controller && ./create-this-app
   ```
4. Recompile o executável:
   ```bash
   make clean
   make
   ```
   *Resultado:* `usb_controller.elf` gerado com sucesso.
5. Faça o download para o FPGA e inicialize a execução:
   ```bash
   nios2-download -g usb_controller.elf
   ```
6. (Opcional) Abra o terminal JTAG para monitorar saídas `printf`:
   ```bash
   nios2-terminal
   ```

---

### 5.2 Compilar e Gravar o Hardware via Quartus CLI (Terminal)

Abra um terminal (PowerShell ou CMD) na raiz do projeto (`C:\HDL\t4\NES-FPGA`):

1. **Geração do HDL do Qsys / Platform Designer (`NIOSIIe.qsys`):**
   ```cmd
   & "C:\intelFPGA_lite\18.1\quartus\sopc_builder\bin\qsys-generate.exe" "C:\HDL\t4\NES-FPGA\qsys\NIOSIIe.qsys" --synthesis=VERILOG
   ```

2. **Compilação do Firmware C do Nios II via Nios II Command Shell:**
   ```cmd
   & "C:\intelFPGA_lite\18.1\nios2eds\Nios II Command Shell.bat" bash -c "cd /cygdrive/c/HDL/t4/NES-FPGA/qsys/software/usb_controller && make clean && make"
   ```

3. **Compilação completa do Hardware FPGA (Síntese + Fitter + Assembler + Timing):**
   ```cmd
   & "C:\intelFPGA_lite\18.1\quartus\bin64\quartus_sh.exe" --flow compile "C:\HDL\t4\NES-FPGA\NES"
   ```
   *Ou utilizando o script Node.js integrado:*
   ```cmd
   node cart_init/switch_game.js --build
   ```

4. **Gravação do arquivo `.sof` diretamente na placa:**
   ```cmd
   quartus_pgm -m jtag -c "USB-Blaster" -o "p;output_files/NES.sof"
   ```
   *Ou utilizando o script Node.js integrado:*
   ```cmd
   node cart_init/switch_game.js --flash
   ```

---

## 6. Troca Rápida de Jogos (Sem Recompilação Completa)

> [!TIP]
> A compilação completa do projeto no Quartus leva de **3 a 7 minutos**. Quando você deseja apenas trocar o jogo que está no cartucho, **não é necessário recompilar todo o projeto**. 
> O Quartus permite atualizar apenas os blocos de memória interna (`prg.mif` e `chr.mif`) e rodar apenas o Assembler, levando **menos de 15 segundos**.

### 6.1 Os 3 Modos de Operação (Web e CLI):

O sistema oferece 3 níveis bem definidos de ação para troca de cartuchos:

| Ação | Botão na Web | Comando no Terminal | O que faz por baixo dos panos | Tempo |
|---|---|---|---|---|
| **1. Trocar MIF** | `📼 Trocar MIF` | `node cart_init/switch_game.js <slug>` | Copia `prg.mif` e `chr.mif` para `cart_init/` e raiz. Não roda compilação. | **< 0.1s** |
| **2. Gerar .SOF** | `⚙️ Gerar .SOF` | `node cart_init/switch_game.js <slug> --build` | Copia os MIFs + roda `quartus_cdb --update_mif` + roda `quartus_asm` gerando `output_files/NES.sof`. | **~7s** |
| **3. Gravar FPGA** | `⚡ Gravar na Placa` | `node cart_init/switch_game.js <slug> --flash` | Executa os 3 passos: copia MIFs + compila `.sof` + grava no FPGA via `quartus_pgm`. Caso a placa não esteja conectada, gera o `.sof` e exibe aviso claro de ausência de cabo USB. | **~10s** |

### Via Terminal com 1 Comando (Recomendado):
O sistema possui 57 jogos NROM Mapper 0 catalogados e convertidos. Basta executar:
```bash
node cart_init/switch_game.js <nome_do_jogo> --flash
```
*Exemplos:*
```bash
node cart_init/switch_game.js pacman --flash
node cart_init/switch_game.js donkey-kong --flash
node cart_init/switch_game.js galaga --flash
```
O script automaticamente:
1. Copia o `prg.mif` e `chr.mif` do jogo para a raiz.
2. Executa `quartus_cdb --update_mif NES`.
3. Executa `quartus_asm NES` gerando o novo `output_files/NES.sof`.
4. Executa `quartus_pgm` e programa a placa DE10-Lite instantaneamente (ou avisa se a placa não estiver conectada ao cabo USB).

Para pesquisar jogos disponíveis:
```bash
node cart_init/switch_game.js list
node cart_init/switch_game.js find mario
```

### Via Quartus GUI:
1. Copie o par de arquivos do jogo escolhido (`cart_init/games/<jogo>/prg.mif` e `chr.mif`) para a raiz `NES-FPGA/`.
2. No Quartus Prime: Menu **Processing -> Update Memory Initialization File** (Atalho: **`Ctrl + Shift + U`**).
3. Menu **Processing -> Start -> Start Assembler** (Atalho: **`Ctrl + Shift + L`**).
4. Menu **Tools -> Programmer -> Start**.

---

## 7. Iniciando os Servidores de Controle (PC / Teclado / Gamepad / Serial DB9)

Como a placa DE10-Lite não possui teclado USB nativo sem uma placa de expansão SPI MAX3421E, implementamos duas pontes concorrentes de controle no PC:
1. **Ponte JTAG UART (Cabo USB-Blaster):** Utiliza o mesmo cabo de programação da placa, transmitindo pacotes de 3 bytes `[0x5A, mask_p1, mask_p2]` diretamente para a CPU Nios II.
2. **Ponte Serial DB9 (RS-232 / UART):** Permite enviar os mesmos pacotes através de uma porta serial COM física (ex: conector DB9, shield RS-232 ou conversor USB-Serial) conectada ao computador.

### Opção A: Controlador Web + WebSockets + WebSerial
Ideal para jogar com controles USB (ex: Xbox, DualShock, genéricos NES) ou teclado com interface gráfica e troca de jogos com 1 clique.

1. Dê um duplo clique no script:
   [`run_web_controller.bat`](file:///C:/HDL/t4/NES-FPGA/run_web_controller.bat)
   *(Ou execute `node pc_controller/nes_controller.js` no terminal)*.
2. O script detectará automaticamente o Quartus 18.1 e iniciará o servidor na porta 8080.
3. Abra seu navegador em:
   **`http://localhost:8080`**
4. Recursos disponíveis na interface:
   - **Player 1 (P1):** Teclas `W, A, S, D` (direcionais), `K` (A), `J` (B), `U` (Select), `I` (Start).
   - **Player 2 (P2):** Setas direcionais `↑, ←, ↓, →`, `Num2` (A), `Num1` (B), `Num4` (Select), `Num5` (Start).
   - **Conector Serial DB9 / RS-232:** Menu suspenso no topo com todas as portas COM disponíveis no Windows, botão "Conectar DB9" e suporte nativo à **Web Serial API** do navegador.
   - **Troca de ROMs com 1 clique:** Dropdown com 57 jogos NROM Mapper 0 e botão *⚡ Gravar FPGA*.

Para iniciar o servidor já conectado a uma porta Serial DB9 específica:
```cmd
node pc_controller/nes_controller.js --serial COM1 --baud 115200
```

### Opção B: Controlador Python de Terminal (Ultra Baixa Latência)
Ideal para computadores rápidos sem abrir navegador. Utiliza a API nativa Win32 `GetAsyncKeyState` a 60 FPS estáveis com captura contínua de teclas físicas.

1. Dê um duplo clique no script:
   [`run_python_controller.bat`](file:///C:/HDL/t4/NES-FPGA/run_python_controller.bat)
   *(Ou execute `python pc_controller/nes_controller.py` no terminal)*.
2. Para conectar simultaneamente a uma porta Serial DB9 (RS-232):
   ```cmd
   python pc_controller/nes_controller.py --serial COM1 --baud 115200
   ```
3. Mantenha o terminal em foco ou minimizado e jogue diretamente pelo teclado físico.

---

### 7.1 Modo Debug Ativo nos Displays de 7 Segmentos (HEX0 a HEX5)

Os 6 displays de 7 segmentos da placa DE10-Lite funcionam como monitor em tempo real dos botões do emulador:

```
+------------+------------+------------+------------+------------+------------+
|   HEX 5    |   HEX 4    |   HEX 3    |   HEX 2    |   HEX 1    |   HEX 0    |
+------------+------------+------------+------------+------------+------------+
|    'd'     |    'E'     |   P2 MSB   |   P2 LSB   |   P1 MSB   |   P1 LSB   |
| (Debug On) | (Debug On) |  (Botoes)  |  (D-Pad)   |  (Botoes)  |  (D-Pad)   |
+------------+------------+------------+------------+------------+------------+
```

- **HEX1 e HEX0 (Player 1):** Exibem a máscara hexadecimal de 8 bits do Player 1 (`00` a `FF`):
  - Apertou A: exibe `80` (bit 7)
  - Apertou B: exibe `40` (bit 6)
  - Apertou A + B: exibe `C0`
  - Apertou Start: exibe `10` (bit 4)
  - Apertou D-Pad Cima: exibe `08` (bit 3)
  - Apertou D-Pad Direita: exibe `01` (bit 0)
- **HEX3 e HEX2 (Player 2):** Exibem a máscara hexadecimal do Player 2 (`00` a `FF`).
- **HEX5 e HEX4 (Status / Telemetria):**
  - Chave `SW[0]` em **0 (Down):** Exibem as letras **`dE`** (*Debug Enabled*).
  - Chave `SW[0]` em **1 (Up):** Exibem a contagem hexadecimal contínua de pacotes válidos recebidos pela JTAG UART (`00` a `FF`), confirmando a atividade da comunicação.

---

## 8. Fluxo Resumido de Execução no Dia a Dia

Para começar a jogar rapidamente em uma sessão normal de desenvolvimento:

| Passo | Ação | Como fazer |
| :--- | :--- | :--- |
| **1** | Ligar a placa e conectar cabos | Conectar cabo USB Mini-B no PC e cabo VGA no monitor. Chave em ON. |
| **2** | Gravar o Hardware (se ainda não gravou) | Quartus Programmer -> `Start` com `NES.sof`<br>*(ou `node cart_init/switch_game.js <jogo> --flash`)* |
| **3** | Carregar o Firmware Nios II | No Nios II Command Shell: `nios2-download -g usb_controller.elf`<br>*(ou Eclipse -> Run As -> Nios II Hardware)* |
| **4** | Iniciar o Controle | Duplo clique em [`run_web_controller.bat`](file:///C:/HDL/t4/NES-FPGA/run_web_controller.bat) |
| **5** | Reset do NES | Pressione o botão físico **`KEY[0]`** na placa DE10-Lite para resetar o jogo. |

---

## 9. Diagnóstico e Solução de Problemas (Troubleshooting)

### Erro: `Can't recognize silicon ID for device 1` ou USB-Blaster não encontrado
- **Causa:** O cabo USB está frouxo, o driver do USB-Blaster não foi instalado ou a placa está sem alimentação.
- **Solução:**
  1. Verifique se o LED azul da placa DE10-Lite está aceso.
  2. No Quartus Programmer, clique em **Hardware Setup...** e selecione `USB-Blaster`.
  3. No Gerenciador de Dispositivos do Windows, certifique-se de que não há aviso amarelo em *Altera USB-Blaster*. Caso haja, aponte a atualização do driver para `C:\intelFPGA_lite\<versao>\quartus\drivers`.

### A tela VGA fica preta ou sem sinal
- **Causa:** O NES não inicializou a ROM ou o monitor não suporta o sincronismo de 640x480 @ 60 Hz.
- **Solução:**
  1. Pressione o botão **`KEY[0]`** na placa para reiniciar a CPU 6502 do NES.
  2. Certifique-se de que os arquivos `prg.mif` e `chr.mif` na raiz do projeto não estão vazios ou corrompidos.
  3. Verifique se o bitstream gravado no FPGA é o `NES.sof` correto gerado pela compilação.

### O controle não responde na tela
- **Causa 1:** O firmware `usb_controller.elf` não foi baixado na SDRAM após a gravação do `.sof`.
  - **Solução:** Toda vez que o `.sof` for gravado, você **deve** rodar `nios2-download -g usb_controller.elf` ou *Run As -> Nios II Hardware* no Eclipse.
- **Causa 2:** O cabo JTAG UART está ocupado por outro programa.
  - **Solução:** Feche instâncias do `nios2-terminal` ou consoles do Eclipse antes de abrir o servidor Web ou Python. A porta JTAG UART só aceita uma conexão aberta por vez.

### Erro `nios2-download: cable "USB-Blaster" is not available`
- **Causa:** Conflito de acesso ao driver JTAG.
- **Solução:** No terminal do Windows, mate instâncias órfãs do serviço JTAG executando:
  ```cmd
  jtagconfig
  ```
  Se o comando travar, execute no terminal:
  ```cmd
  taskkill /f /im jtagd.exe
  ```
  E tente rodar o download novamente.

### Quartus acusa dispositivo não suportado (MAX 10)
- **Causa:** Tentativa de compilar o projeto em versões muito antigas do Quartus (como o Quartus II 13.1 Web Edition). A família MAX 10 só foi introduzida a partir da versão 14.0.
- **Solução:** Instale o **Quartus Prime Lite Edition 18.1** ou superior (compatível com MAX 10 `10M50DAF484C7G`).
