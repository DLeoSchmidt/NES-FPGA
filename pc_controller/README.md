# NES-FPGA: Dual PC Controller & Web Gamepad (Player 1 & Player 2)

Suporte a **2 controles independentes** para jogos multiplayer no emulador NES rodando no FPGA, utilizando o mesmo cabo USB-Blaster do arquivo `.sof`.

---

## Novidades: Suporte a 2 Jogadores

- **Player 1 ($4016):** Shift register dedicado para o jogador 1.
- **Player 2 ($4017):** Shift register dedicado para o jogador 2.
- **Sem conflito de dados:** Ambos os jogadores podem mover e agir simultaneamente.
- **Interface Web:** 2 gamepads visuais na tela (Player 1 em Vermelho e Player 2 em Azul), modal interativo de remapeamento de teclas e suporte a múltiplos joysticks USB/Bluetooth físicos no PC.

---

## 1. Como Usar a Interface Web (Navegador)

1. No terminal:
   ```bash
   cd C:\HDL\t4\NES-FPGA\pc_controller
   node nes_controller.js
   ```
2. Abra seu navegador em:
   ```
   http://localhost:8080
   ```
3. Na interface:
   - Você verá os dois controles do NES (P1 e P2).
   - Clique em **"⚙️ Configurar Teclas & Controles"** para mudar qualquer tecla: basta clicar no botão da ação e apertar a nova tecla do seu teclado!
   - Defina qual dispositivo controla qual jogador (Teclado, Gamepad 1, Gamepad 2 ou ambos).

---

## 2. Mapeamento de Teclas Padrão no Mesmo Teclado

### Player 1 (Mão Esquerda)
| Botão do NES | Tecla Padrão |
| :--- | :--- |
| **Cima** | `W` |
| **Baixo** | `S` |
| **Esquerda** | `A` |
| **Direita** | `D` |
| **Botão B** | `J` |
| **Botão A** | `K` |
| **Select** | `U` |
| **Start** | `I` |

### Player 2 (Mão Direita)
| Botão do NES | Tecla Padrão |
| :--- | :--- |
| **Cima** | `Seta para Cima (▲)` |
| **Baixo** | `Seta para Baixo (▼)` |
| **Esquerda** | `Seta para a Esquerda (◀)` |
| **Direita** | `Seta para a Direita (▶)` |
| **Botão B** | `Numpad 1` |
| **Botão A** | `Numpad 2` |
| **Select** | `Numpad 4` |
| **Start** | `Numpad 5` |

*(Você pode remapear 100% de qualquer uma dessas teclas pelo painel de configurações na Web).*

---

## 3. Modo Terminal (CLI)

Ao iniciar `node nes_controller.js` ou `py nes_controller.py`, você também pode controlar ambos os jogadores diretamente pelo console, sem abrir o navegador.
