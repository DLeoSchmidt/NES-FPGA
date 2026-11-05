# NES-FPGA: PC Controller & Web Gamepad

Este pacote permite usar o teclado ou controle do computador como controle do emulador de NES rodando na FPGA, utilizando o mesmo cabo USB-Blaster empregado para carregar o arquivo `.sof`.

---

## Como Funciona

A comunicação utiliza o periférico **JTAG UART** já sintetizado no design Qsys da FPGA (`/dev/jtag_uart_0`).
Ao pressionar teclas no PC, os eventos são empacotados em um frame binário de 2 bytes (`0x5A` + máscara de botões) e transmitidos instantaneamente para a CPU Nios II.

> **Coexistência:** As funções originais do shield MAX3421E continuam 100% ativas! Você pode usar tanto o teclado do PC quanto um teclado USB plugado no shield ao mesmo tempo.

---

## 1. Usando a Interface Web (Navegador) & Node.js

Esta é a opção mais moderna e completa. Ela inclui um controle visual do NES na tela do navegador, suporte a teclado e suporte a **Gamepads USB/Bluetooth** (Xbox, PlayStation, 8BitDo, etc.).

### Como rodar:
1. Abra um terminal na pasta `pc_controller`:
   ```bash
   cd C:\HDL\t4\NES-FPGA\pc_controller
   node nes_controller.js
   ```
2. Abra o navegador em:
   ```
   http://localhost:8080
   ```
3. Pronto! O controle virtual responderá imediatamente ao seu teclado e aos cliques na tela.

---

## 2. Usando o Script no Terminal (Node.js CLI)

Ao executar `node nes_controller.js`, você também pode controlar o jogo diretamente pelo próprio terminal onde o script foi iniciado, sem precisar abrir o navegador:
- `W / A / S / D` ou Setas: Direcional
- `K`: Botão A
- `J`: Botão B
- `Enter`: Start
- `U`: Select
- `Ctrl + C`: Sair

---

## 3. Usando o Script Python (Python CLI)

Se preferir rodar em Python:
1. No terminal:
   ```bash
   cd C:\HDL\t4\NES-FPGA\pc_controller
   py nes_controller.py
   # ou: python nes_controller.py
   ```
2. Use o teclado no console com o mesmo mapeamento do NES.

---

## Mapeamento de Teclas

| Botão do NES | Teclas no Teclado |
| :--- | :--- |
| **Cima** | `W` ou `Seta para Cima` |
| **Baixo** | `S` ou `Seta para Baixo` |
| **Esquerda** | `A` ou `Seta para a Esquerda` |
| **Direita** | `D` ou `Seta para a Direita` |
| **Botão A** | `K` ou `X` |
| **Botão B** | `J` ou `Z` |
| **Start** | `Enter` |
| **Select** | `U` ou `Shift` |
