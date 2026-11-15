# Guia Rápido de Operação: Cartuchos, SDRAM e Depuração

Referência prática para o dia a dia após o ambiente estar instalado (para instalação e compilação inicial, veja [`COMPILACAO_DO_ZERO.md`](COMPILACAO_DO_ZERO.md)).

---

## 1. Como Converter uma ROM `.nes` Nova para as Memórias do Projeto

O emulador lê o código e os gráficos do jogo diretamente das BRAMs internas inicializadas por [`cart_init/prg.mif`](cart_init/prg.mif) (64 KB) e [`cart_init/chr.mif`](cart_init/chr.mif) (8 KB).

1. **Verifique o formato:** A ROM precisa ser **iNES Mapper 0 (NROM)** — até 32 KB de PRG-ROM (1 ou 2 bancos de 16 KB) e 8 KB de CHR-ROM. Consulte exemplos validados em [`COMPATIBLE_GAMES.md`](COMPATIBLE_GAMES.md).
2. **Converta para `.mif` com o script Node.js:**
   ```bash
   node cart_init/nes_to_mif.js caminho/do/jogo.nes
   ```
   O script lê o cabeçalho de 16 bytes do formato iNES, verifica o Mapper 0, pula *trainer* de 512 bytes se existir, espelha automaticamente bancos PRG de 16 KB para preencher `$8000–$FFFF` (com `$0000–$7FFF` zerados) e grava `prg.mif` e `chr.mif` diretamente em `cart_init/`.
3. **Atualize o bitstream sem resíntese completa** (seção abaixo).

---

## 2. Troca Rápida de Jogos (Sem Recompilar Todo o Hardware)

Quando apenas os arquivos `.mif` mudam, o Quartus **não precisa** refazer síntese nem place-and-route. Basta atualizar os blocos MIF no banco compilado e rodar o Assembler:

### Pela linha de comando:
```bash
# 1. Selecionar um jogo já catalogado em cart_init/games/
node cart_init/switch_game.js pacman

# 2. Aplicar apenas Update MIF + Assembler + Gravar FPGA + Recarregar Nios II
compile_project.bat --quick --flash
```

Ou usando os binários do Quartus diretamente:
```bash
quartus_cdb NES --update_mif
quartus_asm NES
quartus_pgm -c "USB-Blaster [USB-0]" -m JTAG -o "p;output_files/NES.sof"
nios2-download -g -c "USB-Blaster [USB-0]" qsys/software/usb_controller/usb_controller.elf
```

### Pela Interface Web (`http://localhost:8080`):
Selecione o jogo no menu de cartuchos e clique em **Gravar na Placa**: o [`pc_controller/nes_controller.js`](pc_controller/nes_controller.js) pausa a JTAG UART automaticamente, executa as etapas acima e reconecta os controles.

---

## 3. Regra da SDRAM Volátil (Por que o `.elf` precisa ser recarregado)

Em [`qsys/NIOSIIe.qsys`](qsys/NIOSIIe.qsys), os vetores de **Reset** e **Exceção** do Nios II/e apontam para a **SDRAM externa (`0x08000000`)**. Como a SDRAM é volátil e o arquivo `.sof` configura somente a lógica da FPGA:

> Toda vez que você gravar um `.sof` (ou desligar/religar a placa DE10-Lite), **os controles não responderão até que `usb_controller.elf` seja carregado novamente na SDRAM** via `nios2-download -g` (ou pelo botão de reload/gravação na interface Web).

---

## 4. Depuração Direta na Placa (`HEX0..HEX5`, `LEDR`, `SW[0]`)

- **`HEX1–HEX0`:** Byte `keycode[7:0]` (botões do **Player 1**).
- **`HEX3–HEX2`:** Byte `keycode[15:8]` (botões do **Player 2**).
- **`HEX5–HEX4`:**
  - `SW[0] = 0`: exibe **`dE`** (*Debug Enabled*, indicando modo Dual Mask ativo).
  - `SW[0] = 1`: exibe o contador hexadecimal `00–FF` (`keycode[23:16]`) dos pacotes recebidos com sucesso pela JTAG UART — útil para confirmar que o PC está alcançando o Nios II mesmo antes de olhar o jogo.
- **`LEDR[9:0]`:** Espelha `cpu_addr[9:0]` (atividade contínua do barramento de endereços do 6502).
- **`KEY[0]`:** Reset da CPU 6502 (segure pressionado se precisar reiniciar o jogo).

---

## 5. Troubleshooting Rápido

| Sintoma / Erro | Causa Provável | Solução |
| :--- | :--- | :--- |
| `HEX` mostra tudo `00`, jogo roda, mas controles não respondem | O `.elf` não foi carregado na SDRAM após gravar o `.sof` | Execute `nios2-download -g -c "USB-Blaster [USB-0]" qsys/software/usb_controller/usb_controller.elf` ou reinicie o `nes_controller.js`. |
| Erro `-6` na `jtag_atlantic.dll` (`canal ocupado`) | Outro processo (`nios2-terminal`, Eclipse ou outra janela do script) está conectado ao JTAG | Feche qualquer terminal Nios II / Eclipse aberto e execute `python pc_controller/test_jtag_uart.py`. |
| `jtag_atlantic.dll` falha ao carregar no Python | Python 32 bits tentando carregar DLL 64 bits | Instale/use Python **64 bits** compatível com `quartus/bin64/jtag_atlantic.dll`. |
| Tela VGA preta / sem imagem | Monitor não suporta `640x480 @ 60 Hz` ou `KEY[0]` travado | Verifique cabo VGA e teste soltar/pressionar `KEY[0]`. |
| Jogo novo fica com tela corrompida ou trava | ROM usa Mapper diferente de 0 ou depende de Sprite 0 Hit dinâmico | Confira as limitações no [`README.md`](README.md) e teste jogos de [`COMPATIBLE_GAMES.md`](COMPATIBLE_GAMES.md). |
