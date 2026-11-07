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
        # 1. Caminhos conhecidos de alta prioridade da versao 18.1
        priority_paths = [
            r"C:\intelFPGA_lite\18.1\quartus\bin64\nios2-terminal.exe",
            r"C:\intelFPGA\18.1\quartus\bin64\nios2-terminal.exe",
            r"C:\altera\18.1\quartus\bin64\nios2-terminal.exe",
            r"C:\intelFPGA_lite\18.1\nios2eds\bin\nios2-terminal.exe",
            r"C:\intelFPGA\18.1\nios2eds\bin\nios2-terminal.exe",
            r"D:\intelFPGA_lite\18.1\quartus\bin64\nios2-terminal.exe",
            r"D:\intelFPGA\18.1\quartus\bin64\nios2-terminal.exe",
            r"E:\intelFPGA_lite\18.1\quartus\bin64\nios2-terminal.exe"
        ]
        for p in priority_paths:
            if os.path.isfile(p):
                print(f"[BRIDGE] Executavel prioritario Quartus 18.1 localizado: {p}")
                return p

        # 2. Raizes expandidas para busca dinamica profunda
        search_roots = [
            os.environ.get("QUARTUS_ROOTDIR", ""),
            os.environ.get("SOPC_KIT_NIOS2", ""),
            r"C:\intelFPGA_lite\18.1",
            r"C:\intelFPGA\18.1",
            r"C:\altera\18.1",
            r"C:\intelFPGA_lite",
            r"C:\intelFPGA",
            r"C:\intelFPGA_pro",
            r"C:\altera",
            r"D:\intelFPGA_lite\18.1",
            r"D:\intelFPGA\18.1",
            r"D:\intelFPGA_lite",
            r"D:\intelFPGA",
            r"D:\altera",
            r"E:\intelFPGA_lite\18.1",
            r"E:\intelFPGA_lite"
        ]

        candidates = []
        for root in search_roots:
            if not root or not os.path.isdir(root):
                continue
            for dirpath, _, filenames in os.walk(root):
                for f in filenames:
                    if f.lower() in ("nios2-terminal.exe", "nios2-terminal"):
                        candidates.append(os.path.join(dirpath, f))

        if candidates:
            # Prioriza estritamente os executaveis contendo '18.1'
            candidates.sort(key=lambda x: (1 if "18.1" in x else 0), reverse=True)
            print(f"[BRIDGE] nios2-terminal selecionado via varredura: {candidates[0]}")
            return candidates[0]

        import shutil
        found = shutil.which("nios2-terminal")
        if found:
            return found

        return "nios2-terminal"

    def connect(self) -> bool:
        cmd = [self.terminal_path, "--quiet"]
        try:
            print(f"[BRIDGE] Conectando ao FPGA via JTAG UART: {self.terminal_path}")
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


class SerialDb9Bridge:
    """Ponte de comunicacao via porta Serial RS-232 / conector DB9 / USB-Serial."""
    def __init__(self, port: Optional[str] = None, baudrate: int = 115200):
        self.port = port
        self.baudrate = baudrate
        self.serial_conn = None
        self.connected = False

    def connect(self) -> bool:
        if not self.port:
            return False

        try:
            import serial
            self.serial_conn = serial.Serial(self.port, self.baudrate, timeout=0.1)
            self.connected = True
            print(f"[SERIAL] [OK] Conectado a porta Serial DB9 ({self.port}) a {self.baudrate} bps.")
            return True
        except ImportError:
            print("[SERIAL] [AVISO] Pacote pyserial nao instalado. Para suporte Serial RS-232, execute: pip install pyserial")
            return False
        except Exception as ex:
            print(f"[SERIAL] [AVISO] Falha ao abrir porta serial {self.port}: {ex}")
            return False

    def send_dual_mask(self, p1: int, p2: int) -> bool:
        if not self.connected or not self.serial_conn:
            return False
        try:
            packet = bytes([SYNC_BYTE, p1 & 0xFF, p2 & 0xFF])
            self.serial_conn.write(packet)
            self.serial_conn.flush()
            return True
        except Exception:
            self.connected = False
            return False

    def close(self):
        if self.serial_conn:
            try:
                self.serial_conn.close()
            except Exception:
                pass
            self.serial_conn = None
        self.connected = False


def run_interactive_controller():
    # Processa argumentos de linha de comando: --serial COMx --baud 115200
    serial_port = None
    serial_baud = 115200

    i = 1
    while i < len(sys.argv):
        arg = sys.argv[i].lower()
        if (arg == "--serial" or arg == "-s") and i + 1 < len(sys.argv):
            serial_port = sys.argv[i + 1].upper()
            i += 1
        elif arg.startswith("--serial="):
            serial_port = arg.split("=")[1].upper()
        elif (arg == "--baud" or arg == "-b") and i + 1 < len(sys.argv):
            try:
                serial_baud = int(sys.argv[i + 1])
            except ValueError:
                pass
            i += 1
        i += 1

    # 1. Ponte JTAG UART (Cabo USB-Blaster)
    bridge = NiosTerminalBridge()
    has_bridge = bridge.connect()

    # 2. Ponte Serial DB9 / RS-232 (se configurada)
    serial_bridge = None
    if serial_port:
        serial_bridge = SerialDb9Bridge(serial_port, serial_baud)
        serial_bridge.connect()

    print("\n" + "=" * 70)
    print("      NES-FPGA DUAL CONTROLLER - PYTHON CONSOLE EDITION      ")
    print("=" * 70)
    print(" Player 1: WASD (Direcional) | K (A) | J (B) | Enter (Start) | U (Select)")
    print(" Player 2: Setas (Direcional) | X (A) | Z (B)")
    if serial_bridge and serial_bridge.connected:
        print(f" Conexao Serial DB9 Ativa: {serial_port} @ {serial_baud} bps")
    print(" Sair: ESC ou Q")
    print("=" * 70 + "\n")

    p1_mask = 0
    p2_mask = 0
    running = True

    if os.name == 'nt':
        import ctypes
        user32 = ctypes.windll.user32

        # Virtual Key Codes (Win32) para leitura de hardware contínua a 60Hz
        # Player 1: WASD + K(A) + J(B) + Enter(Start) + U(Select)
        VK_W = 0x57
        VK_S = 0x53
        VK_A = 0x41
        VK_D = 0x44
        VK_K = 0x4B
        VK_J = 0x4A
        VK_RETURN = 0x0D
        VK_U = 0x55

        # Player 2: Setas + X/Numpad2(A) + Z/Numpad1(B) + Numpad5(Start) + Numpad4(Select)
        VK_UP = 0x26
        VK_DOWN = 0x28
        VK_LEFT = 0x25
        VK_RIGHT = 0x27
        VK_X = 0x58
        VK_Z = 0x5A
        VK_NUMPAD1 = 0x61
        VK_NUMPAD2 = 0x62
        VK_NUMPAD4 = 0x64
        VK_NUMPAD5 = 0x65

        VK_ESCAPE = 0x1B
        VK_Q = 0x51

        def is_key_down(vk: int) -> bool:
            """Retorna True se a tecla física estiver pressionada no hardware."""
            return bool(user32.GetAsyncKeyState(vk) & 0x8000)

        def render_status(p1: int, p2: int):
            def f(mask, btn, name):
                return f"{name}:{'ON ' if mask & btn else 'OFF'}"
            txt = f"\r[P1: {f(p1, BTN_UP, 'U')} {f(p1, BTN_DOWN, 'D')} {f(p1, BTN_LEFT, 'L')} {f(p1, BTN_RIGHT, 'R')} | A:{'1' if p1 & BTN_A else '0'} B:{'1' if p1 & BTN_B else '0'}] [P2: {f(p2, BTN_UP, 'U')} {f(p2, BTN_DOWN, 'D')} {f(p2, BTN_LEFT, 'L')} {f(p2, BTN_RIGHT, 'R')} | A:{'1' if p2 & BTN_A else '0'} B:{'1' if p2 & BTN_B else '0'}]"
            sys.stdout.write(txt)
            sys.stdout.flush()

        last_p1 = -1
        last_p2 = -1

        try:
            while running:
                # Sair se ESC ou Q pressionados
                if is_key_down(VK_ESCAPE) or is_key_down(VK_Q):
                    break

                # Leitura direta do estado físico de cada botão (suporta teclas simultâneas e hold)
                p1 = 0
                if is_key_down(VK_W): p1 |= BTN_UP
                if is_key_down(VK_S): p1 |= BTN_DOWN
                if is_key_down(VK_A): p1 |= BTN_LEFT
                if is_key_down(VK_D): p1 |= BTN_RIGHT
                if is_key_down(VK_K): p1 |= BTN_A
                if is_key_down(VK_J): p1 |= BTN_B
                if is_key_down(VK_RETURN): p1 |= BTN_START
                if is_key_down(VK_U): p1 |= BTN_SELECT

                p2 = 0
                if is_key_down(VK_UP): p2 |= BTN_UP
                if is_key_down(VK_DOWN): p2 |= BTN_DOWN
                if is_key_down(VK_LEFT): p2 |= BTN_LEFT
                if is_key_down(VK_RIGHT): p2 |= BTN_RIGHT
                if is_key_down(VK_X) or is_key_down(VK_NUMPAD2): p2 |= BTN_A
                if is_key_down(VK_Z) or is_key_down(VK_NUMPAD1): p2 |= BTN_B
                if is_key_down(VK_NUMPAD5): p2 |= BTN_START
                if is_key_down(VK_NUMPAD4): p2 |= BTN_SELECT

                # Envia atualização apenas quando houver mudança de estado (taxa de amostragem: ~60-100 Hz)
                if p1 != last_p1 or p2 != last_p2:
                    if has_bridge:
                        bridge.send_dual_mask(p1, p2)
                    if serial_bridge and serial_bridge.connected:
                        serial_bridge.send_dual_mask(p1, p2)
                    render_status(p1, p2)
                    last_p1 = p1
                    last_p2 = p2

                time.sleep(0.016)  # ~60 FPS

        except KeyboardInterrupt:
            pass
        finally:
            if has_bridge:
                bridge.send_dual_mask(0, 0)
                bridge.close()
            if serial_bridge and serial_bridge.connected:
                serial_bridge.send_dual_mask(0, 0)
                serial_bridge.close()
            print("\n[INFO] Sessao finalizada.")
            print("\n[INFO] Sessao finalizada.")


if __name__ == "__main__":
    run_interactive_controller()
