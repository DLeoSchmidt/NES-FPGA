#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
NES-FPGA PC Controller (Python Edition)
=======================================
Envia o estado das teclas do teclado do PC para o emulador NES rodando no FPGA
atraves da interface JTAG UART (cabo USB-Blaster de programacao do .sof).

Protocolo de Comunicacao:
  - Byte 0 (Sync): 0x5A
  - Byte 1 (Mascara 8-bits):
      Bit 7: A
      Bit 6: B
      Bit 5: SELECT
      Bit 4: START
      Bit 3: UP
      Bit 2: DOWN
      Bit 1: LEFT
      Bit 0: RIGHT

Mapeamento Padrao de Teclas:
  - D-Pad:  W (Cima), S (Baixo), A (Esquerda), D (Direita)  [ou Setas]
  - Acao:   K (Botao A), J (Botao B)
  - Menu:   Enter (Start), Shift Direito ou U (Select)
  - Sair:   Escape ou Ctrl+C
"""

import sys
import os
import time
import subprocess
import threading
from typing import Optional, Dict

# Mascaras de Bits para o Controle NES
BTN_RIGHT  = 1 << 0
BTN_LEFT   = 1 << 1
BTN_DOWN   = 1 << 2
BTN_UP     = 1 << 3
BTN_START  = 1 << 4
BTN_SELECT = 1 << 5
BTN_B      = 1 << 6
BTN_A      = 1 << 7

SYNC_BYTE = 0x5A

class NiosTerminalBridge:
    """Gerencia o processo nios2-terminal da Intel/Altera para transmissao JTAG UART."""
    
    def __init__(self, terminal_path: Optional[str] = None):
        self.terminal_path = terminal_path or self._find_nios2_terminal()
        self.process: Optional[subprocess.Popen] = None
        self.connected = False

    def _find_nios2_terminal(self) -> str:
        """Localiza o executavel nios2-terminal.exe nos caminhos padroes ou no PATH."""
        # 1. Checa PATH do sistema
        import shutil
        found = shutil.which("nios2-terminal")
        if found:
            return found

        # 2. Caminhos conhecidos de instalacoes Altera / IntelFPGA
        search_roots = [
            r"C:\altera",
            r"C:\intelFPGA",
            r"C:\intelFPGA_lite",
            r"C:\intelFPGA_pro",
            os.environ.get("QUARTUS_ROOTDIR", "")
        ]

        for root in search_roots:
            if not root or not os.path.isdir(root):
                continue
            for dirpath, _, filenames in os.walk(root):
                for f in filenames:
                    if f.lower() in ("nios2-terminal.exe", "nios2-terminal"):
                        return os.path.join(dirpath, f)

        return "nios2-terminal"

    def connect(self) -> bool:
        """Inicia o processo nios2-terminal com pipes stdin/stdout."""
        cmd = [self.terminal_path]
        try:
            print(f"[BRIDGE] Iniciando processo: {self.terminal_path}")
            self.process = subprocess.Popen(
                cmd,
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                bufsize=0
            )
            self.connected = True
            print("[BRIDGE] Conexao com JTAG UART estabelecida com sucesso.")
            return True
        except FileNotFoundError:
            print(f"[ERRO] Executavel '{self.terminal_path}' nao encontrado.")
            print("[DICA] Certifique-se de que o Quartus/Nios II EDS esteja instalado e no PATH.")
            return False
        except Exception as ex:
            print(f"[ERRO] Falha ao iniciar nios2-terminal: {ex}")
            return False

    def send_mask(self, mask: int) -> bool:
        """Transmite o frame de 2 bytes [0x5A, mask] via JTAG UART."""
        if not self.connected or not self.process or not self.process.stdin:
            return False
        try:
            packet = bytes([SYNC_BYTE, mask & 0xFF])
            self.process.stdin.write(packet)
            self.process.stdin.flush()
            return True
        except Exception as ex:
            print(f"[BRIDGE] Erro de envio: {ex}")
            self.connected = False
            return False

    def close(self):
        """Fecha a conexao e encerra o processo."""
        if self.process:
            try:
                self.process.terminate()
            except Exception:
                pass
            self.process = None
        self.connected = False


def run_interactive_controller():
    """Captura teclas do teclado no console e transmite o estado ao FPGA."""
    bridge = NiosTerminalBridge()
    has_bridge = bridge.connect()

    if not has_bridge:
        print("\n[AVISO] Executando em modo simulacao de console (sem nios2-terminal ativo).")

    print("\n" + "=" * 65)
    print("      NES-FPGA CONTROLLER - PYTHON CONSOLE EDITION      ")
    print("=" * 65)
    print(" Controles do NES:")
    print("   [W / S / A / D] -> Cima / Baixo / Esquerda / Direita")
    print("   [K]             -> Botao A")
    print("   [J]             -> Botao B")
    print("   [Enter]         -> Start")
    print("   [U]             -> Select")
    print("   [ESC] ou [Q]    -> Sair")
    print("=" * 65 + "\n")

    current_mask = 0
    running = True

    # Suporte nativo para Windows via msvcrt
    if os.name == 'nt':
        import msvcrt

        # Mapeamento de teclas para Windows console
        KEY_MAP = {
            b'w': (BTN_UP, True),    b'W': (BTN_UP, True),
            b's': (BTN_DOWN, True),  b'S': (BTN_DOWN, True),
            b'a': (BTN_LEFT, True),  b'A': (BTN_LEFT, True),
            b'd': (BTN_RIGHT, True), b'D': (BTN_RIGHT, True),
            b'k': (BTN_A, True),     b'K': (BTN_A, True),
            b'j': (BTN_B, True),     b'J': (BTN_B, True),
            b'\r': (BTN_START, True),# Enter
            b'u': (BTN_SELECT, True),b'U': (BTN_SELECT, True),
        }

        def render_status(mask: int):
            states = [
                f"UP:{'ON ' if mask & BTN_UP else 'OFF'}",
                f"DOWN:{'ON ' if mask & BTN_DOWN else 'OFF'}",
                f"LEFT:{'ON ' if mask & BTN_LEFT else 'OFF'}",
                f"RIGHT:{'ON ' if mask & BTN_RIGHT else 'OFF'}",
                f"A:{'ON ' if mask & BTN_A else 'OFF'}",
                f"B:{'ON ' if mask & BTN_B else 'OFF'}",
                f"START:{'ON ' if mask & BTN_START else 'OFF'}",
                f"SELECT:{'ON ' if mask & BTN_SELECT else 'OFF'}"
            ]
            sys.stdout.write("\r[" + " | ".join(states) + "]")
            sys.stdout.flush()

        # Temporizador para limpar automaticamente botoes acionados por press unico
        last_key_time = time.time()

        try:
            while running:
                if msvcrt.kbhit():
                    ch = msvcrt.getch()
                    if ch in (b'\x1b', b'q', b'Q'): # ESC ou Q
                        break
                    
                    if ch in (b'\x00', b'\xe0'): # Teclas de seta especiais
                        code = msvcrt.getch()
                        arrow_map = {
                            b'H': BTN_UP,
                            b'P': BTN_DOWN,
                            b'K': BTN_LEFT,
                            b'M': BTN_RIGHT
                        }
                        if code in arrow_map:
                            current_mask |= arrow_map[code]
                            last_key_time = time.time()
                    elif ch in KEY_MAP:
                        btn, _ = KEY_MAP[ch]
                        current_mask |= btn
                        last_key_time = time.time()

                    if has_bridge:
                        bridge.send_mask(current_mask)
                    render_status(current_mask)

                # Reset automatico dos botoes se nenhuma tecla for recebida por 120ms
                if current_mask != 0 and (time.time() - last_key_time > 0.12):
                    current_mask = 0
                    if has_bridge:
                        bridge.send_mask(current_mask)
                    render_status(current_mask)

                time.sleep(0.01)

        except KeyboardInterrupt:
            pass
        finally:
            if has_bridge:
                bridge.send_mask(0)
                bridge.close()
            print("\n[INFO] Sessao do controlador encerrada.")

    else:
        print("[INFO] Modo interativo avancado disponivel no Windows/Linux.")


if __name__ == "__main__":
    run_interactive_controller()
