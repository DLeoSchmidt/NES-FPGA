# Guia Definitivo: Compilando e Executando o NES-FPGA do Zero

Este documento contém o guia passo a passo completo para configurar, compilar e executar o emulador **NES-FPGA** em um novo computador do zero, tanto através da **Interface Gráfica (Quartus Prime GUI + Eclipse)** quanto via **Linha de Comando / Terminal (Scripts Automatizados e CLI nativa)**.

---

## Sumário
1. [Visão Geral da Arquitetura](#1-visão-geral-da-arquitetura)
2. [Pré-requisitos e Instalação de Ferramentas](#2-pré-requisitos-e-instalação-de-ferramentas)
   - [2.1 Intel Quartus Prime Lite Edition (v18.1)](#21-intel-quartus-prime-lite-edition-v181)
   - [2.2 Drivers do Altera USB-Blaster](#22-drivers-do-altera-usb-blaster)
   - [2.3 Node.js e Python](#23-nodejs-e-python)
   - [2.4 Hardware Físico Necessário](#24-hardware-físico-necessário)
3. [Método 1: Compilação Automatizada via Script (Recomendado)](#3-método-1-compilação-automatizada-via-script-recomendado)
   - [3.1 O Script `compile_project.bat`](#31-o-script-compile_projectbat)
   - [3.2 Exemplos de Uso](#32-exemplos-de-uso)
4. [Método 2: Compilação Manual via Linha de Comando (CLI)](#4-método-2-compilação-manual-via-linha-de-comando-cli)
   - [4.1 Inicialização das Memórias MIF do Cartucho](#41-inicialização-das-memórias-mif-do-cartucho)
   - [4.2 Geração do Qsys / Platform Designer](#42-geração-do-qsys--platform-designer)
   - [4.3 Compilação do Firmware C do Nios II](#43-compilação-do-firmware-c-do-nios-ii)
   - [4.4 Compilação do Hardware com Quartus CLI](#44-compilação-do-hardware-com-quartus-cli)
   - [4.5 Gravação do Bitstream (.sof) no FPGA](#45-gravação-do-bitstream-sof-no-fpga)
   - [4.6 Carga do Firmware (.elf) na SDRAM](#46-carga-do-firmware-elf-na-sdram)
5. [Método 3: Compilação via Interface Gráfica (Quartus Prime GUI)](#5-método-3-compilação-via-interface-gráfica-quartus-prime-gui)
   - [5.1 Abertura do Projeto no Quartus](#51-abertura-do-projeto-no-quartus)
   - [5.2 Platform Designer (Qsys)](#52-platform-designer-qsys)
   - [5.3 Compilação Completa do Hardware](#53-compilação-completa-do-hardware)
   - [5.4 Gravação pelo Quartus Programmer](#54-gravação-pelo-quartus-programmer)
   - [5.5 Compilação e Carga pelo Nios II SBT for Eclipse](#55-compilação-e-carga-pelo-nios-ii-sbt-for-eclipse)
6. [Entendendo o Fluxo de Memória e Carregamento Volátil](#6-entendendo-o-fluxo-de-memória-e-carregamento-volátil)
7. [Iniciando os Controles e Jogando](#7-iniciando-os-controles-e-jogando)
   - [7.1 Servidor Web Interativo (Teclado + Gamepads)](#71-servidor-web-interativo-teclado--gamepads)
   - [7.2 Controlador Nativo em Python](#72-controlador-nativo-em-python)
   - [7.3 Mapeamento de Teclas e Controles](#73-mapeamento-de-teclas-e-controles)
   - [7.4 Telemetria nos Displays de 7 Segmentos](#74-telemetria-nos-displays-de-7-segmentos)
8. [Troca Rápida de Jogos (Sem Síntese Completa)](#8-troca-rápida-de-jogos-sem-síntese-completa)
9. [Diagnóstico e Solução de Problemas (Troubleshooting)](#9-diagnóstico-e-solução-de-problemas-troubleshooting)

---

## 1. Visão Geral da Arquitetura

O projeto implementa um console Nintendo Entertainment System (NES) funcional na placa **Terasic DE10-Lite** (Intel MAX 10 `10M50DAF484C7G`), integrando:
- **Core do NES em SystemVerilog:** CPU 6502 (adaptada do core MISTer), PPU (geração de vídeo VGA 640x480 @ 60 Hz), memórias RAM internas e mapeador NROM (Mapper 0).
- **Core de Controle Dual-Player via JTAG:** Módulo [`src/controller.sv`](file:///C:/HDL/t4/NES-FPGA/src/controller.sv) com barramentos independentes para Player 1 (`$4016`) e Player 2 (`$4017`).
- **Softcore Nios II/e (Platform Designer / Qsys):** Processador embutido no FPGA responsável por intermediar pacotes serializados recebidos pelo canal **JTAG UART** e direcioná-los aos registradores PIO paralelos dos controles e displays de 7 segmentos.
- **Servidores de Host no PC:** Aplicações em Node.js (Web/Gamepads) ou Python que leem entradas de teclado/joysticks e as enviam diretamente para o FPGA através do driver JTAG (`jtag_atlantic.dll` / `libusb`).

```
+------------------------------------------------------------------------------------+
|                                  COMPUTADOR HOST                                   |
|                                                                                    |
|  [ Navegador Web / Gamepads ]             [ Terminal Python ]                      |
|  run_web_controller.bat                   run_python_controller.bat                 |
|  (Porta 8080 -> WebSockets)               (Win32 GetAsyncKeyState)                 |
|               \                                   /                                |
|                +-----------------+---------------+                                 |
|                                  v                                                 |
|                   [ jtag_atlantic.dll / libusb ]                                   |
|               Ponte de Comunicação USB-Blaster (JTAG UART)                         |
+----------------------------------+-------------------------------------------------+
                                   | Cabo USB Mini-B
+----------------------------------+-------------------------------------------------+
|                              PLACA TERASIC DE10-LITE                               |
|                                  v                                                 |
|  +------------------------------------------------------------------------------+  |
|  | HARDWARE FPGA (MAX 10 - 10M50DAF484C7G)                                      |  |
|  |                                                                              |  |
|  |  [ JTAG UART Core ] <--- Recebe pacotes de controle (0xP1, 0xP2)             |  |
|  |          |                                                                   |  |
|  |          v                                                                   |  |
|  |  [ Softcore Nios II/e ] (Executa usb_controller.elf carregado na SDRAM)      |  |
|  |          |                                                                   |  |
|  |          +---> PIO keycode_export    (Player 1 NES Byte)                     |  |
|  |          +---> PIO p2_keycode_export (Player 2 NES Byte)                     |  |
|  |          +---> PIOs HEX0..HEX5       (Telemetria e Debug)                    |  |
|  |                                                                              |  |
|  |  [ Emulador NES em SystemVerilog ]                                           |  |
|  |    * CPU 6502 (60 Hz clock)                                                  |  |
|  |    * PPU (Paleta RGB -> DAC VGA 4-bit R, G, B)                               |  |
|  |    * Cartridge ROMs (prg.mif e chr.mif)                                      |  |
|  |    * Controller Engine ($4016 P1 e $4017 P2)                                 |  |
|  +------------------------------------------------------------------------------+  |
+------------------------------------------------------------------------------------+
```

---

## 2. Pré-requisitos e Instalação de Ferramentas

### 2.1 Intel Quartus Prime Lite Edition (v18.1)
> [!IMPORTANT]
> **Compatibilidade de Versão:** A família de FPGAs **MAX 10** requer obrigatoriamente o **Intel Quartus Prime 14.0 ou superior**. Versões legadas como o *Quartus II 13.1* **não** suportam o chip `10M50DAF484C7G`.
> A versão padrão recomendada e homologada para este projeto é o **Intel Quartus Prime Lite Edition 18.1**.

1. Faça o download gratuito do **Intel Quartus Prime Lite Edition 18.1** no portal da Intel:
   - Pacote principal do Quartus Lite (inclui Nios II EDS).
   - Pacote de dispositivos **Intel MAX 10 FPGA Device Support** (`max10-18.1.0.625.qdz`).
2. Instale no caminho padrão sugerido:
   ```text
   C:\intelFPGA_lite\18.1
   ```
3. O instalador criará:
   - Quartus Prime 64-bit: `C:\intelFPGA_lite\18.1\quartus\bin64`
   - Nios II EDS: `C:\intelFPGA_lite\18.1\nios2eds`
   - Drivers USB-Blaster: `C:\intelFPGA_lite\18.1\quartus\drivers`

> [!WARNING]
> Se o seu sistema tiver outra versão antiga do Quartus instalada (como a 13.1) configurada na variável de ambiente de sistema `%QUARTUS_ROOTDIR%`, o terminal do Windows pode invocar os binários da versão antiga por padrão.
> O script [`compile_project.bat`](file:///C:/HDL/t4/NES-FPGA/compile_project.bat) deste repositório foi construído para detectar e priorizar explicitamente o caminho da versão `18.1`, evitando esse conflito.

---

### 2.2 Drivers do Altera USB-Blaster
Quando a placa DE10-Lite for conectada pela primeira vez via cabo USB Mini-B:
1. Abra o **Gerenciador de Dispositivos** do Windows (`Win + X -> Gerenciador de Dispositivos`).
2. Localize em *Outros dispositivos* o item com exclamação amarela: **Altera USB-Blaster**.
3. Clique com o botão direito -> **Atualizar driver** -> **Procurar drivers no meu computador**.
4. Aponte a busca para a pasta de drivers do Quartus:
   ```text
   C:\intelFPGA_lite\18.1\quartus\drivers
   ```
5. Marque a opção *Incluir subpastas* e clique em **Avançar**.
6. Após a instalação, o dispositivo aparecerá na seção *Controladores USB* como **Altera USB-Blaster**.

---

### 2.3 Node.js e Python
Para rodar a interface de controle Web, o gerenciador de jogos e o controlador em Python:
- **Node.js (v18.x ou superior):** Baixe em [nodejs.org](https://nodejs.org/). O servidor web e WebSocket (`pc_controller/nes_controller.js`) utiliza exclusivamente bibliotecas nativas do Node.js, sem necessidade de `npm install` ou pacotes externos.
- **Python (v3.10 ou superior):** Baixe em [python.org](https://www.python.org/) (certifique-se de marcar *"Add python.exe to PATH"* durante a instalação) para o controlador nativo Win32 de console.

---

### 2.4 Hardware Físico Necessário
1. Placa **Terasic DE10-Lite** (chip Intel MAX 10 `10M50DAF484C7G`).
2. Cabo **USB Mini-B** conectado à porta USB-Blaster da placa e a uma porta USB 2.0/3.0 do PC.
3. Cabo **VGA padrão de 15 pinos** conectado da saída VGA da DE10-Lite para um monitor ou conversor HDMI (resolução 640x480 @ 60 Hz).
4. *(Opcional)* Controles USB ou Bluetooth (PlayStation, Xbox, 8BitDo ou genéricos) para o servidor Web.

---

## 3. Método 1: Compilação Automatizada via Script (Recomendado)

O repositório inclui um script batch inteligente de nível industrial: [`compile_project.bat`](file:///C:/HDL/t4/NES-FPGA/compile_project.bat) (e o alias [`build_all.bat`](file:///C:/HDL/t4/NES-FPGA/build_all.bat)).

Ele automatiza o fluxo de ponta a ponta:
- Localiza automaticamente o Quartus 18.1 e o ambiente Nios II EDS, mesmo se as variáveis de ambiente do sistema estiverem apontando para versões legadas.
- Verifica e prepara os arquivos de memória do cartucho (`prg.mif` e `chr.mif`).
- Se solicitado, troca o jogo atual por qualquer um dos 57 jogos suportados na pasta `cart_init/`.
- Se solicitado, compila o firmware C do Nios II (`usb_controller.elf`).
- Executa a síntese completa do Quartus (Map -> Fit -> Asm -> Sta) ou modo de síntese rápida (`--quick`).
- Sonda a cadeia JTAG e, se a placa estiver conectada e o usuário passar a flag `--flash`, grava o `.sof` no FPGA e carrega o firmware `.elf` diretamente na SDRAM.

### 3.1 O Script `compile_project.bat`

Para visualizar todas as opções suportadas:
```cmd
compile_project.bat --help
```

Parâmetros disponíveis:
- `--flash`: Após compilar com sucesso, grava o bitstream `output_files/NES.sof` no FPGA via JTAG.
- `--firmware`: Compila o código C do processador Nios II (`qsys/software/usb_controller/main.c`) gerando `usb_controller.elf` antes do build do hardware. Se usado junto com `--flash`, faz o download automático na SDRAM.
- `--game <slug>`: Troca a ROM do jogo antes de compilar (ex: `super_mario_bros`, `pacman`, `bomberman`, `donkey_kong`).
- `--quick`: Modo de compilação rápida de cartucho. Regera a memória sem re-executar Analysis & Synthesis e Place & Route completas (~15 segundos em vez de ~2 minutos).
- `--clean`: Limpa as pastas temporárias `db/` e `incremental_db/` antes de iniciar a compilação.

---

### 3.2 Exemplos de Uso

#### Compilação Completa do Zero (Apenas gerar o `.sof`):
```cmd
compile_project.bat
```

#### Compilação Completa + Gravação no FPGA + Carga do Firmware Nios II:
```cmd
compile_project.bat --flash --firmware
```

#### Trocar de Jogo (Ex: Pac-Man) e Gravar Imediatamente no FPGA:
```cmd
compile_project.bat --game pacman --quick --flash
```

#### Limpeza Total e Recompilação do Zero Absoluto:
```cmd
compile_project.bat --clean --firmware --flash
```

---

## 4. Método 2: Compilação Manual via Linha de Comando (CLI)

Se você preferir rodar cada comando individualmente no terminal ou estiver integrando um pipeline de CI/CD:

### 4.1 Inicialização das Memórias MIF do Cartucho
O emulador inicializa a ROM do jogo a partir de dois arquivos de memória em formato MIF na raiz do projeto:
- `prg.mif`: Código binário do jogo (PRG-ROM de 32 KB para a CPU 6502).
- `chr.mif`: Sprites e padrões gráficos (CHR-ROM de 8 KB para a PPU).

Para copiar os arquivos de um jogo existente para a raiz:
```cmd
node cart_init/switch_game.js super_mario_bros
```
*(Ou copie manualmente um arquivo `.mif` da pasta `cart_init/` renomeando para `prg.mif` e `chr.mif` na raiz).*

---

### 4.2 Geração do Qsys / Platform Designer
Se você alterou a topologia de barramentos no arquivo [`qsys/NIOSIIe.qsys`](file:///C:/HDL/t4/NES-FPGA/qsys/NIOSIIe.qsys):
```cmd
C:\intelFPGA_lite\18.1\quartus\sopc_builder\bin\qsys-generate qsys/NIOSIIe.qsys --synthesis=VERILOG --output-directory=qsys/NIOSIIe
```

---

### 4.3 Compilação do Firmware C do Nios II
O código-fonte do processador Nios II está localizado em [`qsys/software/usb_controller/main.c`](file:///C:/HDL/t4/NES-FPGA/qsys/software/usb_controller/main.c).

1. Abra o shell especial do Nios II:
   ```cmd
   C:\intelFPGA_lite\18.1\nios2eds\Nios II Command Shell.bat
   ```
2. No shell bash (Cygwin):
   ```bash
   cd /cygdrive/c/HDL/t4/NES-FPGA/qsys/software/usb_controller
   make
   ```
3. O arquivo executável compilado será gerado em:
   ```text
   qsys/software/usb_controller/usb_controller.elf
   ```

---

### 4.4 Compilação do Hardware com Quartus CLI
No prompt de comando padrão do Windows (CMD ou PowerShell):

```cmd
set PATH=C:\intelFPGA_lite\18.1\quartus\bin64;%PATH%
quartus_sh --flow compile NES
```

Este comando executa a esteira padrão completa:
1. `quartus_map NES`: Síntese e análise lógica dos arquivos SystemVerilog em [`src/`](file:///C:/HDL/t4/NES-FPGA/src/).
2. `quartus_fit NES`: Posicionamento e roteamento físico dos blocos lógicos (LEs), PLLs e barramentos da placa DE10-Lite.
3. `quartus_asm NES`: Gera o arquivo de configuração de bitstream [`output_files/NES.sof`](file:///C:/HDL/t4/NES-FPGA/output_files/NES.sof).
4. `quartus_sta NES`: Análise de restrições temporais e fechamento de timing para os clocks de 50 MHz e 60 Hz.

---

### 4.5 Gravação do Bitstream (.sof) no FPGA
1. Verifique se a placa DE10-Lite foi detectada na porta JTAG:
   ```cmd
   quartus_pgm -l
   ```
   *Saída esperada: `1) USB-Blaster [USB-0]`*.

2. Grave o bitstream sintetizado:
   ```cmd
   quartus_pgm -m jtag -c 1 -o "p;output_files/NES.sof"
   ```
   *O monitor VGA conectado à placa começará a exibir a tela inicial do jogo ou imagem do emulador.*

---

### 4.6 Carga do Firmware (.elf) na SDRAM
> [!IMPORTANT]
> A gravação do `.sof` configura apenas a malha lógica do FPGA. A SDRAM que contém o código do Nios II fica sem o programa. Para que o controle responda, você **deve** carregar o executável na SDRAM após a gravação:

No **Nios II Command Shell**:
```bash
cd /cygdrive/c/HDL/t4/NES-FPGA/qsys/software/usb_controller
nios2-download -g usb_controller.elf
```

---

## 5. Método 3: Compilação via Interface Gráfica (Quartus Prime GUI)

Para desenvolvedores que preferem inspecionar RTL, Pin Planner, floorplan do chip e acompanhar o progresso graficamente:

### 5.1 Abertura do Projeto no Quartus
1. Abra o **Intel Quartus Prime 18.1 64-Bit**.
2. Vá em **File -> Open Project...**
3. Navegue até o diretório do projeto e selecione o arquivo:
   ```text
   C:\HDL\t4\NES-FPGA\NES.qpf
   ```
4. O painel esquerdo *Project Navigator* listará a entidade de topo `top` e a hierarquia SystemVerilog.

---

### 5.2 Platform Designer (Qsys)
*(Necessário apenas se você adicionou novos periféricos PIO ou alterou barramentos do Nios II)*:
1. No menu superior, vá em **Tools -> Platform Designer**.
2. Abra o arquivo `qsys/NIOSIIe.qsys`.
3. Verifique se não há mensagens de erro em vermelho na aba *System Scripting / Messages*.
4. No canto inferior direito, clique em **Generate HDL...**
5. Deixe a opção de síntese em *Verilog* e clique em **Generate**.
6. Ao concluir (*Generate Completed*), clique em **Close** e feche a janela do Platform Designer.

---

### 5.3 Compilação Completa do Hardware
1. Na janela principal do Quartus, clique no menu **Processing -> Start Compilation** (ou utilize o atalho de teclado **`Ctrl + L`**).
2. O painel *Tasks* à esquerda exibirá o progresso percentual das 4 etapas:
   - Analysis & Synthesis
   - Fitter (Place & Route)
   - Assembler (Generate programming files)
   - TimeQuest Timing Analysis
3. Ao concluir 100% com sucesso (ícones verdes), o bitstream estará pronto em `output_files/NES.sof`.

---

### 5.4 Gravação pelo Quartus Programmer
1. Vá em **Tools -> Programmer**.
2. No canto superior esquerdo, clique no botão **Hardware Setup...**
3. Na lista suspensa *Currently selected hardware*, selecione **USB-Blaster [USB-0]** e clique em **Close**.
4. Se a cadeia JTAG não listar o chip automaticamente, clique em **Auto Detect** e selecione `10M50DA`.
5. Selecione a linha do chip `10M50DAF484`. Se o arquivo `output_files/NES.sof` não estiver selecionado:
   - Clique no botão **Change File...** à esquerda.
   - Navegue até `output_files/` e selecione `NES.sof`.
6. Marque a caixa de seleção na coluna **Program/Configure**.
7. Clique no botão **Start** à esquerda.
8. A barra superior *Progress* chegará a **100% (Successful)**.

---

### 5.5 Compilação e Carga pelo Nios II SBT for Eclipse
1. No menu do Quartus, vá em **Tools -> Nios II Software Build Tools for Eclipse**.
2. Quando solicitado pelo diretório do Workspace, aponte para:
   ```text
   C:\HDL\t4\NES-FPGA\eclipse
   ```
3. Se os projetos ainda não estiverem importados:
   - Vá em **File -> Import... -> General -> Existing Projects into Workspace**.
   - Aponte para a pasta `qsys/software/`.
   - Marque os projetos `usb_controller` e `usb_controller_bsp`.
   - Clique em **Finish**.
4. Compilar o código C:
   - Clique com o botão direito no projeto **`usb_controller`**.
   - Selecione **Build Project**.
5. Fazer o download para a placa:
   - Clique com o botão direito no projeto **`usb_controller`**.
   - Vá em **Run As -> Nios II Hardware**.
   - *(Na aba Target Connection, certifique-se de que o cabo USB-Blaster está detectado)*.
   - Clique em **Run**.
6. O console do Eclipse exibirá a mensagem de confirmação do firmware:
   ```text
   NES Controller Bridge Ready!
   P1 Default: 0x00
   P2 Default: 0x00
   ```

---

## 6. Entendendo o Fluxo de Memória e Carregamento Volátil

É fundamental entender a diferença entre a memória lógica do FPGA e a memória SDRAM:

| Componente | Tipo de Memória | O que armazena | Como é carregado | Persistência |
| :--- | :--- | :--- | :--- | :--- |
| **FPGA Lógica & BRAM** | SRAM Interna (M9K) | CPU 6502, PPU, Registradores de Controle, PRG/CHR ROMs | Via bitstream `.sof` (`quartus_pgm`) | Volátil (reseta ao desligar a placa) |
| **SDRAM Externa (IS42S16320D)** | DRAM Externa (64 MB) | Instruções do processador Nios II (`usb_controller.elf`) | Via canal JTAG (`nios2-download`) | Volátil (perde o código ao gravar novo `.sof` ou desligar) |

> [!NOTE]
> **Por que é obrigatório rodar o `nios2-download` após cada regravação do `.sof`?**
> Toda vez que o Quartus regrava o bitstream `.sof`, o FPGA passa por uma reconfiguração global completa. O controlador de SDRAM é reinicializado e a memória SDRAM perde os ponteiros de execução.
> O script [`compile_project.bat --flash`](file:///C:/HDL/t4/NES-FPGA/compile_project.bat) já faz as duas etapas sequencialmente para você de forma transparente.

---

## 7. Iniciando os Controles e Jogando

Após o FPGA estar programado e o firmware Nios II em execução, inicie uma das interfaces de controle no computador:

### 7.1 Servidor Web Interativo (Teclado + Gamepads)
Ideal para jogar sozinho ou em dupla (Dual Player) com teclado ou joysticks USB/Bluetooth:
1. Dê duplo clique em [`run_web_controller.bat`](file:///C:/HDL/t4/NES-FPGA/run_web_controller.bat) (ou execute no terminal).
2. O servidor iniciará e abrirá automaticamente seu navegador em:
   ```text
   http://localhost:8080
   ```
3. A interface web detecta automaticamente:
   - Digitação pelo teclado do PC.
   - Gamepads conectados via HTML5 Gamepad API (Xbox, PlayStation, etc.).
   - Alternância independente de atribuição de Player 1 e Player 2.

### 7.2 Controlador Nativo em Python
Alternativa em modo texto sem navegador, com polling nativo da Win32 API a 60 FPS:
1. Dê duplo clique em [`run_python_controller.bat`](file:///C:/HDL/t4/NES-FPGA/run_python_controller.bat).
2. Pressione as teclas na janela do terminal para controlar o jogo em tempo real.

---

### 7.3 Mapeamento de Teclas e Controles

O protocolo de controle do emulador NES adota o byte padrão oficial da Nintendo lido serialmente pelos registradores `$4016` (Player 1) e `$4017` (Player 2):

| Botão NES | Bit no Byte | Tecla Padrão Player 1 | Tecla Padrão Player 2 |
| :--- | :---: | :---: | :---: |
| **A** | Bit 7 (`0x80`) | **`L`** | **`X`** (ou Numpad 2) |
| **B** | Bit 6 (`0x40`) | **`K`** | **`Z`** (ou Numpad 1) |
| **Select** | Bit 5 (`0x20`) | **`G`** | **`Numpad 7`** |
| **Start** | Bit 4 (`0x10`) | **`H`** | **`Numpad 9`** |
| **D-Pad Cima** | Bit 3 (`0x08`) | **`W`** | **`Seta Cima`** |
| **D-Pad Baixo** | Bit 2 (`0x04`) | **`S`** | **`Seta Baixo`** |
| **D-Pad Esquerda** | Bit 1 (`0x02`) | **`A`** | **`Seta Esquerda`** |
| **D-Pad Direita** | Bit 0 (`0x01`) | **`D`** | **`Seta Direita`** |

- **Reset Físico da CPU:** Pressione o botão físico **`KEY[0]`** na placa DE10-Lite para resetar o jogo no início de qualquer partida.

---

### 7.4 Telemetria nos Displays de 7 Segmentos

A placa DE10-Lite possui seis displays de 7 segmentos (`HEX5` até `HEX0`) que exibem o diagnóstico da comunicação em tempo real:

```
[ HEX5 ][ HEX4 ]   [ HEX3 ][ HEX2 ]   [ HEX1 ][ HEX0 ]
   TELEMETRIA          PLAYER 2           PLAYER 1
```

- **`HEX1` e `HEX0` (Player 1):** Exibem o byte atual do Player 1 em hexadecimal (`00` a `FF`).
  - Nenhuma tecla pressionada: exibe `00`.
  - Pressionando botão A: exibe `80`.
  - Pressionando botão B: exibe `40`.
  - Pressionando A + B juntos: exibe `C0`.
- **`HEX3` e `HEX2` (Player 2):** Exibem o byte atual do Player 2 em hexadecimal (`00` a `FF`).
- **`HEX5` e `HEX4` (Status do Sistema):**
  - Chave **`SW[0]` para BAIXO (0):** Exibe **`dE`** (*Debug Mode Ativo*).
  - Chave **`SW[0]` para CIMA (1):** Exibe a **contagem contínua de pacotes válidos** recebidos via JTAG (`00` a `FF`), permitindo confirmar se o fluxo de dados entre o PC e o FPGA está ativo.

---

## 8. Troca Rápida de Jogos (Sem Síntese Completa)

O repositório possui uma biblioteca integrada de **57 jogos clássicos de NES** (todos Mapper 0 / NROM) pré-convertidos na pasta `cart_init/`.

Para trocar de jogo em apenas ~15 segundos sem precisar passar pelos longos minutos do Place & Route:
1. Liste os jogos disponíveis:
   ```cmd
   node cart_init/switch_game.js --list
   ```
2. Execute a troca rápida com regravação imediata:
   ```cmd
   compile_project.bat --game pacman --quick --flash
   ```
   *(ou `node cart_init/switch_game.js pacman --quick --flash`)*.

---

## 9. Diagnóstico e Solução de Problemas (Troubleshooting)

### Display exibe `dE0000` constante e os comandos não funcionam
- **Causa 1:** O firmware Nios II (`usb_controller.elf`) não foi carregado na SDRAM após a gravação do `.sof`.
  - **Solução:** Execute `nios2-download -g qsys/software/usb_controller/usb_controller.elf` ou utilize a flag `--firmware --flash` no script `compile_project.bat`.
- **Causa 2:** Outro programa está monopolizando a porta JTAG UART (ex: `nios2-terminal` ou terminal Eclipse aberto).
  - **Solução:** Feche qualquer terminal Nios II ou Eclipse aberto antes de iniciar o servidor Web/Python.

### Erro: `Can't recognize silicon ID for device 1` ou cabo USB-Blaster não encontrado
- **Causa:** Cabo USB frouxo, alimentação desligada ou driver do Windows ausente.
- **Solução:**
  1. Verifique se o LED azul `CONF_DONE` e os LEDs de alimentação da DE10-Lite estão acesos.
  2. No terminal, execute `jtagconfig`. Se o comando travar, mate o serviço em segundo plano:
     ```cmd
     taskkill /f /im jtagd.exe
     ```
  3. Reconecte o cabo USB e teste novamente com `quartus_pgm -l`.

### Conflito com Quartus II 13.1 instalado no sistema
- **Causa:** A variável de ambiente do Windows `%QUARTUS_ROOTDIR%` aponta para `C:\altera\13.1\quartus`, gerando erro de dispositivo MAX 10 desconhecido.
- **Solução:** O script [`compile_project.bat`](file:///C:/HDL/t4/NES-FPGA/compile_project.bat) já trata isso automaticamente priorizando o caminho `C:\intelFPGA_lite\18.1\quartus\bin64`. Se for rodar comandos manuais no terminal, execute antes:
  ```cmd
  set PATH=C:\intelFPGA_lite\18.1\quartus\bin64;%PATH%
  ```

### A tela VGA fica preta ou sem sinal
- **Causa:** CPU 6502 travada ou monitor sem suporte à resolução 640x480 @ 60 Hz.
- **Solução:**
  1. Pressione o botão físico **`KEY[0]`** na placa DE10-Lite para emitir um pulso de reset de hardware na CPU.
  2. Certifique-se de que os arquivos `prg.mif` e `chr.mif` não estão com tamanho zero na raiz do projeto.
