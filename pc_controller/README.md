# NES-FPGA: PC Controller & Web Bridge (Dual Player 1 & Player 2)

Sistema de controle para 2 jogadores simultâneos no emulador NES-FPGA rodando na placa **Terasic DE10-Lite (Intel MAX 10 FPGA)**, com suporte nativo de ultra-baixa latência ao **IP Intel Altera JTAG UART** e método extra via **Porta Serial DB9 / RS-232**.

---

## 1. Arquitetura do IP Intel JTAG UART (`altera_avalon_jtag_uart`)

O IP **Altera Avalon JTAG UART** é o componente de hardware padrão da Intel FPGA para canal bidirecional serial de dados embutido no barramento JTAG. Ele elimina a necessidade de qualquer conversor USB-Serial, cabos extras ou fiação na placa.

### Diagrama de Fluxo e Interconexão de Hardware

```mermaid
flowchart LR
    subgraph PC["Computador Host (PC)"]
        CLIENT["Interface Web (8080) / Python CLI"]
        DRIVER["Driver Nativo (jtag_atlantic.dll)"]
        CLIENT --> DRIVER
    end

    subgraph CABLE["Interface Física"]
        BLASTER["Cabo USB-Blaster (Cabo padrão da DE10-Lite)"]
        DRIVER --> BLASTER
    end

    subgraph FPGA["Intel MAX 10 FPGA (10M50DAF484C7G)"]
        SLD["SLD JTAG Hub (Silício FPGA)"]
        IP_JTAG["IP altera_avalon_jtag_uart\n(Base: 0x0228 | IRQ 16)"]
        CPU["Nios II Economy Core\n(Firmware na SDRAM)"]
        PIO["Avalon PIO Keycode\n(Base: 0x01c0)"]
        NES_CTRL["Controlador NES (src/controller.sv)\n$4016 (P1) e $4017 (P2)"]

        BLASTER --> SLD
        SLD --> IP_JTAG
        IP_JTAG <-->|Avalon-MM Bus| CPU
        CPU -->|Dual Mask [P1, P2]| PIO
        PIO -->|Wires p1_mask, p2_mask| NES_CTRL
    end
```

### Especificações Técnicas do IP no Projeto:
- **Nome do Componente Qsys:** `jtag_uart_0`
- **Endereço Base Avalon-MM:** `0x00000228`
- **IRQ Associada:** `16` (modo polling prioritário ativo com `RE_MSK` no hardware para evitar interferências da ISR do HAL)
- **Tamanho do Buffer FIFO:** 64 bytes RX / 64 bytes TX
- **Biblioteca Host no PC:** `jtag_atlantic.dll` (distribuída com o Intel Quartus Prime em `quartus/bin64/jtag_atlantic.dll`)

---

## 2. Métodos de Entrada Suportados

| Método de Entrada | Hardware Necessário | Cabos Adicionais? | Taxa / Latência | Seleção na Linha de Comando |
| :--- | :--- | :---: | :---: | :--- |
| **IP Intel JTAG UART** *(Principal)* | Placa DE10-Lite | **Nenhum** (mesmo cabo USB da gravação do .sof) | 60 Hz / < 5 ms RTT | `--method jtag_uart` ou `--jtag` (Padrão) |
| **Porta Serial DB9 / RS-232** *(Método Extra)* | Módulo MAX232 / USB-Serial | Requer ligação nos pinos GPIO | 115200 bps | `--method serial --serial COM3` |
| **Teclado USB Físico** | Shield MAX3421E USB Host | Shield plugado nos conectores Arduino | USB HID 1.1 | Automático via SPI |
| **Simulação Web / Local** | Nenhum | Nenhum | 60 FPS | Ativo quando nenhuma placa é detectada |

---

## 3. Inicialização Rápida

### A. Interface Web Interativa (Recomendado)
Dê dois cliques em [`run_web_controller.bat`](file:///C:/HDL/t4/NES-FPGA/run_web_controller.bat) ou execute no terminal:
```bash
node nes_controller.js --method jtag_uart
```
- Acesse `http://localhost:8080` no navegador.
- O badge no topo indicará: **`IP Intel JTAG UART`** com status da conexão à placa DE10-Lite.
- Permite mapeamento interativo de teclas, controle simultâneo de P1 e P2, e troca instantânea de cartuchos NROM.

### B. Console Python de Baixa Latência (60 FPS)
Dê dois cliques em [`run_python_controller.bat`](file:///C:/HDL/t4/NES-FPGA/run_python_controller.bat) ou execute:
```bash
python nes_controller.py --method jtag_uart
```
- Leitura direta via Win32 `GetAsyncKeyState` contornando filas de teclado do sistema operacional.
- Suporta múltiplos botões mantidos pressionados continuamente (hold).

### C. Teste e Diagnóstico Direto do IP JTAG UART
Para testar isoladamente o IP JTAG UART sem abrir navegador ou console de jogo:
Dê dois cliques em [`test_jtag_uart.bat`](file:///C:/HDL/t4/NES-FPGA/test_jtag_uart.bat) ou execute:
```bash
python test_jtag_uart.py
```
O script realizará 5 passos diagnósticos:
1. Validação da presença da biblioteca `jtag_atlantic.dll`.
2. Sondagem e enumeração dos cabos USB-Blaster via `quartus_pgm -l`.
3. Abertura do canal JTAG Atlantic com handshake de hardware.
4. Envio de pacotes de teste e medição de Round-Trip Time (RTT) em milissegundos.
5. Liberação limpa e fechamento do canal.

---

## 4. Mapeamento Padrão de Teclado (Ambos no Mesmo Teclado)

### Player 1 (Controle Vermelho - $4016)
- **Direcional:** `W` (Cima), `S` (Baixo), `A` (Esquerda), `D` (Direita)
- **Ação:** `K` (Botão A), `J` (Botão B)
- **Sistema:** `Enter` (Start), `U` (Select)

### Player 2 (Controle Azul - $4017)
- **Direcional:** `▲` (Cima), `▼` (Baixo), `◀` (Esquerda), `▶` (Direita)
- **Ação:** `Numpad 2` ou `X` (Botão A), `Numpad 1` ou `Z` (Botão B)
- **Sistema:** `Numpad 5` (Start), `Numpad 4` (Select)

*(Na interface Web, todas as teclas podem ser reconfiguradas livremente no botão "⚙️ Teclas").*

---

## 5. Protocolo de Transmissão

O IP JTAG UART e o driver do Nios II aceitam dois formatos de transmissão de pacotes:

1. **Protocolo ASCII HEX (Recomendado para diagnóstico e bridges):**
   - Formato: `!<P1_HEX><P2_HEX>\n` (ex: `!0100\n` para Direita no Player 1 e Neutro no Player 2).
   - Resposta do FPGA: `OK\n`.

2. **Protocolo Binário de 3 Bytes:**
   - Byte 0: `0x5A` (Sync Header).
   - Byte 1: Máscara de bits do Player 1 (`[A, B, Select, Start, Up, Down, Left, Right]`).
   - Byte 2: Máscara de bits do Player 2 (mesmo formato).
   - Resposta do FPGA: `OK\n`.
