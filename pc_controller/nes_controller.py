#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
NES-FPGA Dual Controller PC Bridge (Python Edition)
===================================================
Envia o estado dos dois controles (Player 1 e Player 2) para o emulador NES
na FPGA atraves da interface JTAG UART (cabo USB-Blaster).

Protocolo:
  - Byte 0 (Sync): 0x5A
  - Byte 1: Mascara 8-bits Player 1 (A, B, Select, Start, Up, Down, Left, Right)
  - Byte 2: Mascara 8-bits Player 2 (mesmo formato)
"""

import sys
import os
import time
import subprocess
from typing import Optional

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
    def __init__(self, terminal_path: Optional[str] = None):
        self.terminal_path = terminal_path or self._find_nios2_terminal()
        self.process: Optional[subprocess.Popen] = None
        self.connected = False

    def _find_nios2_terminal(self) -> str:
        import shutil
        found = shutil.which("nios2-terminal")
        if found:
            return found

        search_roots = [
            r"C:\altera",
            r"C:\intelFPGA",
            r"C:\intelFPGA_lite",
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
        cmd = [self.terminal_path]
        try:
            print(f"[BRIDGE] Conectando ao FPGA via: {self.terminal_path}")
            self.process = subprocess.Popen(
                cmd,
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                bufsize=0
            )
            self.connected = True
            print("[BRIDGE] Canal JTAG UART ativo.")
            return True
        except Exception as ex:
            print(f"[AVISO] nios2-terminal nao iniciado ({ex}). Modo de teste de console ativo.")
            return False

    def send_dual_mask(self, p1: int, p2: int) -> bool:
        if not self.connected or not self.process or not self.process.stdin:
            return False
        try:
            packet = bytes([SYNC_BYTE, p1 & 0xFF, p2 & 0xFF])
            self.process.stdin.write(packet)
            self.process.stdin.flush()
            return True
        except Exception:
            self.connected = False
            return False

    def close(self):
        if self.process:
            try:
                self.process.terminate()
            except Exception:
                pass
            self.process = None
        self.connected = False


def run_interactive_controller():
    bridge = NiosTerminalBridge()
    has_bridge = bridge.connect()

    print("\n" + "=" * 70)
    print("      NES-FPGA DUAL CONTROLLER - PYTHON CONSOLE EDITION      ")
    print("=" * 70)
    print(" Player 1: WASD (Direcional) | K (A) | J (B) | Enter (Start) | U (Select)")
    print(" Player 2: Setas (Direcional) | X (A) | Z (B)")
    print(" Sair: ESC ou Q")
    print("=" * 70 + "\n")

    p1_mask = 0
    p2_mask = 0
    running = True

    if os.name == 'nt':
        import msvcrt

        P1_KEY_MAP = {
            b'w': BTN_UP, b'W': BTN_UP,
            b's': BTN_DOWN, b'S': BTN_DOWN,
            b'a': BTN_LEFT, b'A': BTN_LEFT,
            b'd': BTN_RIGHT, b'D': BTN_RIGHT,
            b'k': BTN_A, b'K': BTN_A,
            b'j': BTN_B, b'J': BTN_B,
            b'\r': BTN_START,
            b'u': BTN_SELECT, b'U': BTN_SELECT
        }

        P2_KEY_MAP = {
            b'x': BTN_A, b'X': BTN_A,
            b'z': BTN_B, b'Z': BTN_B
        }

        def render_status(p1: int, p2: int):
            def f(mask, btn, name):
                return f"{name}:{'ON ' if mask & btn else 'OFF'}"
            txt = f"\r[P1: {f(p1, BTN_UP, 'U')} {f(p1, BTN_DOWN, 'D')} {f(p1, BTN_LEFT, 'L')} {f(p1, BTN_RIGHT, 'R')} | A:{'1' if p1 & BTN_A else '0'} B:{'1' if p1 & BTN_B else '0'}] [P2: {f(p2, BTN_UP, 'U')} {f(p2, BTN_DOWN, 'D')} {f(p2, BTN_LEFT, 'L')} {f(p2, BTN_RIGHT, 'R')} | A:{'1' if p2 & BTN_A else '0'} B:{'1' if p2 & BTN_B else '0'}]"
            sys.stdout.write(txt)
            sys.stdout.flush()

        last_key_time = time.time()

        try:
            while running:
                if msvcrt.kbhit():
                    ch = msvcrt.getch()
                    if ch in (b'\x1b', b'q', b'Q'):
                        break

                    if ch in (b'\x00', b'\xe0'):
                        code = msvcrt.getch()
                        arrow_map = {
                            b'H': BTN_UP,
                            b'P': BTN_DOWN,
                            b'K': BTN_LEFT,
                            b'M': BTN_RIGHT
                        }
                        if code in arrow_map:
                            p2_mask |= arrow_map[code]
                            last_key_time = time.time()
                    elif ch in P1_KEY_MAP:
                        p1_mask |= P1_KEY_MAP[ch]
                        last_key_time = time.time()
                    elif ch in P2_KEY_MAP:
                        p2_mask |= P2_KEY_MAP[ch]
                        last_key_time = time.time()

                    if has_bridge:
                        bridge.send_dual_mask(p1_mask, p2_mask)
                    render_status(p1_mask, p2_mask)

                if (p1_mask != 0 or p2_mask != 0) and (time.time() - last_key_time > 0.12):
                    p1_mask = 0
                    p2_mask = 0
                    if has_bridge:
                        bridge.send_dual_mask(0, 0)
                    render_status(0, 0)

                time.sleep(0.01)

        except KeyboardInterrupt:
            pass
        finally:
            if has_bridge:
                bridge.send_dual_mask(0, 0)
                bridge.close()
            print("\n[INFO] Sessao finalizada.")


if __name__ == "__main__":
    run_interactive_controller()
