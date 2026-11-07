#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
NES-FPGA Native JTAG UART Driver Bridge via jtag_atlantic.dll
=============================================================
Comunicação de ultra-baixa latência nativa com a JTAG UART do FPGA.
Elimina completamente a dependência de emuladores de terminal externos (nios2-terminal)
e contorna os problemas de pipes anônimos do Windows.
"""

import sys
import os
import time
import ctypes
from typing import Optional

def find_jtag_atlantic_dll() -> Optional[str]:
    candidates = [
        r"C:\intelFPGA_lite\18.1\quartus\bin64\jtag_atlantic.dll",
        r"C:\intelFPGA\18.1\quartus\bin64\jtag_atlantic.dll",
        r"C:\altera\18.1\quartus\bin64\jtag_atlantic.dll",
        r"D:\intelFPGA_lite\18.1\quartus\bin64\jtag_atlantic.dll"
    ]
    for p in candidates:
        if os.path.isfile(p):
            return p
    return None

class JtagAtlanticNative:
    def __init__(self, cable_name: str = "USB-Blaster [USB-0]"):
        self.cable_name = cable_name
        self.handle = None
        self.dll = None
        self._init_dll()

    def _init_dll(self):
        dll_path = find_jtag_atlantic_dll()
        if not dll_path:
            raise FileNotFoundError("jtag_atlantic.dll não encontrada.")

        self.dll = ctypes.CDLL(dll_path)

        # ?jtagatlantic_open@@YAPEAUJTAGATLANTIC@@PEBDHH0@Z
        self._open = getattr(self.dll, '?jtagatlantic_open@@YAPEAUJTAGATLANTIC@@PEBDHH0@Z')
        self._open.argtypes = [ctypes.c_char_p, ctypes.c_int, ctypes.c_int, ctypes.c_char_p]
        self._open.restype = ctypes.c_void_p

        # ?jtagatlantic_wait_open@@YAHPEAUJTAGATLANTIC@@@Z
        self._wait_open = getattr(self.dll, '?jtagatlantic_wait_open@@YAHPEAUJTAGATLANTIC@@@Z')
        self._wait_open.argtypes = [ctypes.c_void_p]
        self._wait_open.restype = ctypes.c_int

        # ?jtagatlantic_write@@YAHPEAUJTAGATLANTIC@@PEBDI@Z
        self._write = getattr(self.dll, '?jtagatlantic_write@@YAHPEAUJTAGATLANTIC@@PEBDI@Z')
        self._write.argtypes = [ctypes.c_void_p, ctypes.c_char_p, ctypes.c_uint]
        self._write.restype = ctypes.c_int

        # ?jtagatlantic_read@@YAHPEAUJTAGATLANTIC@@PEADI@Z
        self._read = getattr(self.dll, '?jtagatlantic_read@@YAHPEAUJTAGATLANTIC@@PEADI@Z')
        self._read.argtypes = [ctypes.c_void_p, ctypes.c_char_p, ctypes.c_uint]
        self._read.restype = ctypes.c_int

        # ?jtagatlantic_flush@@YAHPEAUJTAGATLANTIC@@@Z
        self._flush = getattr(self.dll, '?jtagatlantic_flush@@YAHPEAUJTAGATLANTIC@@@Z')
        self._flush.argtypes = [ctypes.c_void_p]
        self._flush.restype = ctypes.c_int

        # ?jtagatlantic_close@@YAXPEAUJTAGATLANTIC@@@Z
        self._close = getattr(self.dll, '?jtagatlantic_close@@YAXPEAUJTAGATLANTIC@@@Z')
        self._close.argtypes = [ctypes.c_void_p]
        self._close.restype = None

    def connect(self) -> bool:
        cable_bytes = self.cable_name.encode('utf-8') if self.cable_name else None
        self.handle = self._open(cable_bytes, -1, -1, b"nes_bridge")
        if not self.handle:
            return False
        res = self._wait_open(self.handle)
        return (res == 0)

    def write(self, data: bytes) -> int:
        if not self.handle:
            return 0
        written = self._write(self.handle, data, len(data))
        self._flush(self.handle)
        return written

    def read(self, max_bytes: int = 256) -> bytes:
        if not self.handle:
            return b""
        buf = ctypes.create_string_buffer(max_bytes)
        n = self._read(self.handle, buf, max_bytes - 1)
        if n > 0:
            return buf.raw[:n]
        return b""

    def close(self):
        if self.handle:
            try:
                self._close(self.handle)
            except Exception:
                pass
            self.handle = None

def main():
    cable = sys.argv[1] if len(sys.argv) > 1 else "USB-Blaster [USB-0]"
    try:
        bridge = JtagAtlanticNative(cable)
        if not bridge.connect():
            sys.stderr.write(f"[JTAG_BRIDGE] Falha ao conectar ao cabo '{cable}'.\n")
            sys.stderr.flush()
            sys.exit(1)
        sys.stdout.write(f"[JTAG_BRIDGE_READY] Conectado nativamente a {cable}\n")
        sys.stdout.flush()
    except Exception as e:
        sys.stderr.write(f"[JTAG_BRIDGE_ERROR] {e}\n")
        sys.stderr.flush()
        sys.exit(1)

    try:
        while True:
            line = sys.stdin.readline()
            if not line:
                break
            line_str = line.strip()
            if not line_str:
                continue

            # Se for frame de controle (!0100 ou similar)
            data = (line_str + "\n").encode('ascii')
            bridge.write(data)

            # Opcionalmente drena telemetria
            resp = bridge.read(64)
            if resp:
                sys.stdout.write(f"[NIOS] {resp.decode('ascii', errors='ignore')}\n")
                sys.stdout.flush()
    except KeyboardInterrupt:
        pass
    finally:
        bridge.close()

if __name__ == "__main__":
    main()
