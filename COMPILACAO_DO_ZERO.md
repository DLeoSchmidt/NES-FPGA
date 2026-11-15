# Compilação e Execução do Zero (Quartus GUI, Terminal e Script)

Passo a passo direto para configurar um computador novo, compilar hardware e software do NES-FPGA e gravar na placa **Terasic DE10-Lite**.

---

## 1. Pré-requisitos

1. **Intel Quartus Prime Lite Edition v18.1** (incluindo suporte à família **MAX 10** e o **Nios II Embedded Design Suite / EDS**).
2. **Driver do Altera USB-Blaster:** Ao plugar a DE10-Lite via USB no Windows pela primeira vez, instale o driver manualmente pelo Gerenciador de Dispositivos apontando para `<Quartus>\quartus\drivers\usb-blaster`.
3. **Node.js (v16+)** e **Python 3 (64 bits recomendado)**: usados pelo gerenciador de jogos, servidor Web e ponte `jtag_atlantic.dll`.

> [!NOTE]
> Use **Python 64 bits** porque a biblioteca `jtag_atlantic.dll` do Quartus em `quartus/bin64/` é 64 bits.

---

## 2. Método 1 — Script Automatizado (`compile_project.bat`)

A maneira mais rápida no Windows é executar [`compile_project.bat`](compile_project.bat) na raiz do projeto:

```bat
:: Compila o hardware completo, escolhe o jogo inicial, grava o .sof e carrega o Nios II na SDRAM
compile_project.bat --game mario-bros --flash

:: Recompila também o firmware C (usb_controller.elf), compila tudo e grava na placa
compile_project.bat --firmware --flash

:: Apenas atualiza o cartucho (.mif -> Assembler) sem resíntese completa e grava na placa
compile_project.bat --game bomberman --quick --flash

:: Limpa arquivos temporários de compilações anteriores (db/, output_files/) e compila do zero
compile_project.bat --clean --flash
```

Opções suportadas: `--game <slug>` (`-g`), `--flash` (`-f`), `--firmware`, `--quick`, `--clean`, `--help` (`-h`).

---

## 3. Método 2 — Linha de Comando Manual (Terminal)

Caso queira executar cada etapa manualmente pela linha de comando (útil para automação ou estudo do fluxo EDA Intel):

### Passo 1: Definir o jogo inicial (`cart_init/prg.mif` e `cart_init/chr.mif`)
```bash
node cart_init/switch_game.js mario-bros
```

### Passo 2: Regenerar o Qsys (apenas se editar `qsys/NIOSIIe.qsys`)
```bash
qsys-generate qsys/NIOSIIe.qsys
```
*(Ou abra `qsys/NIOSIIe.qsys` no Platform Designer e clique em **Generate HDL...**.)*

### Passo 3: Recompilar o firmware do Nios II (apenas se editar `qsys/software/usb_controller/main.c`)
Execute dentro do **Nios II Command Shell**:
```bash
cd qsys/software/usb_controller
make all
```
Isso atualiza [`qsys/software/usb_controller/usb_controller.elf`](qsys/software/usb_controller/usb_controller.elf).

### Passo 4: Compilar o projeto completo do FPGA (Síntese + Fitting + Timing + Bitstream)
```bash
quartus_sh --flow compile NES
```
O bitstream gerado fica em `output_files/NES.sof`.

### Passo 5: Gravar o FPGA (`.sof`) e o Firmware Nios II (`.elf`)
```bash
# 1. Conferir o cabo conectado (ex.: USB-Blaster [USB-0])
quartus_pgm -l

# 2. Gravar o bitstream na FPGA
quartus_pgm -c "USB-Blaster [USB-0]" -m JTAG -o "p;output_files/NES.sof"

# 3. Baixar o firmware C para a SDRAM externa e iniciar a CPU (dentro do Nios II Command Shell)
nios2-download -g -c "USB-Blaster [USB-0]" qsys/software/usb_controller/usb_controller.elf
```

---

## 4. Método 3 — Interface Gráfica (Quartus Prime GUI + Nios II Eclipse)

1. **Abrir o Projeto:** No Intel Quartus Prime 18.1, abra [`NES.qpf`](NES.qpf).
2. **Platform Designer (opcional):** Caso modifique periféricos em *Tools -> Platform Designer*, abra [`qsys/NIOSIIe.qsys`](qsys/NIOSIIe.qsys) e clique em **Generate HDL...**.
3. **Compilar Hardware:** Clique em **Processing -> Start Compilation** (Ctrl+L) para gerar `output_files/NES.sof`.
4. **Gravar Bitstream:** Abra **Tools -> Programmer**, selecione o hardware **USB-Blaster**, adicione `output_files/NES.sof` (marque *Program/Configure*) e clique em **Start**.
5. **Carregar Firmware Nios II:** Abra o **Nios II Software Build Tools for Eclipse** usando o workspace [`eclipse/`](eclipse/), compile o projeto `usb_controller` (*Build Project*) e execute com **Run As -> Nios II Hardware** para gravar o `.elf` na SDRAM.

---

## 5. Rodar os Controles Após Gravar a Placa

Com o monitor conectado na saída VGA da DE10-Lite e o `.sof` + `.elf` carregados:

- **Via Interface Web (Teclado + Gamepads + Troca de Jogos):** execute [`run_web_controller.bat`](run_web_controller.bat) (ou `node pc_controller/nes_controller.js`) e acesse `http://localhost:8080`.
- **Via Console Python:** execute [`run_python_controller.bat`](run_python_controller.bat) (ou `python pc_controller/nes_controller.py`).
- **Reset do console NES na placa:** botão **`KEY[0]`** (ativo em nível baixo, solto mantém rodando).
