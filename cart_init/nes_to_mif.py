#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
NES-to-MIF Direct Converter for NES-FPGA
========================================
Converte arquivos .nes (ROMs) diretamente para os arquivos de inicializacao
de memoria do Quartus: cart_init/prg.mif e cart_init/chr.mif.

Dispensa completamente a necessidade de gerar hexdump manual no VSCode!
Suporta jogos Mapper 0 (NROM) de 16 KB (NROM-128) e 32 KB (NROM-256).
"""

import sys
import os

def write_mif(filename, data, depth, address_offset=0, mirror=False):
    """Gera um arquivo MIF (Memory Initialization File) do Altera/Intel Quartus."""
    with open(filename, "w", encoding="ascii") as f:
        f.write("WIDTH=8;\n")
        f.write(f"DEPTH={depth};\n\n")
        f.write("ADDRESS_RADIX=HEX;\n")
        f.write("DATA_RADIX=HEX;\n\n")
        f.write("CONTENT BEGIN\n")

        # Inicializa o espaco nao utilizado antes do offset com 00
        if address_offset > 0:
            f.write(f"\t[0000..{address_offset - 1:04X}] : 00;\n")

        # Escreve os bytes de dados
        addr = address_offset
        for b in data:
            f.write(f"\t{addr:04X} : {b:02X};\n")
            addr += 1

        # Espelhamento para NROM-128 (16 KB duplicados em 0x8000..0xBFFF e 0xC000..0xFFFF)
        if mirror and len(data) == 16384 and address_offset == 0x8000:
            for b in data:
                f.write(f"\t{addr:04X} : {b:02X};\n")
                addr += 1

        # Preenche restante com zeros se necessario
        if addr < depth:
            f.write(f"\t[{addr:04X}..{depth - 1:04X}] : 00;\n")

        f.write("END;\n")

def convert_nes(nes_path, out_dir):
    if not os.path.isfile(nes_path):
        print(f"[ERRO] Arquivo ROM nao encontrado: {nes_path}")
        return False

    with open(nes_path, "rb") as f:
        header = f.read(16)
        if len(header) < 16 or header[0:4] != b'NES\x1A':
            print("[ERRO] Arquivo nao possui cabecalho valido iNES ('NES<EOF>').")
            return False

        prg_banks = header[4] # Blocos de 16 KB
        chr_banks = header[5] # Blocos de 8 KB
        flags6 = header[6]
        flags7 = header[7]

        mapper = (flags7 & 0xF0) | (flags6 >> 4)
        mirroring = "Vertical" if (flags6 & 0x01) else "Horizontal"

        print("=" * 60)
        print("          ANALISE DA ROM NES          ")
        print("=" * 60)
        print(f" Arquivo:       {os.path.basename(nes_path)}")
        print(f" PRG ROM:       {prg_banks} bancos ({prg_banks * 16} KB)")
        print(f" CHR ROM:       {chr_banks} bancos ({chr_banks * 8} KB)")
        print(f" Mapper:        {mapper} ({'NROM - Suportado!' if mapper == 0 else 'Nao suportado no momento'})")
        print(f" Espelhamento:  {mirroring}")
        print("=" * 60)

        if mapper != 0:
            print(f"[AVISO] O emulador atual suporta apenas Mapper 0 (NROM). Esta ROM usa Mapper {mapper}.")

        prg_size = prg_banks * 16384
        chr_size = chr_banks * 8192

        # Pula trainer de 512 bytes se existir
        if flags6 & 0x04:
            f.read(512)

        prg_data = f.read(prg_size)
        chr_data = f.read(chr_size) if chr_size > 0 else bytes(8192)

    os.makedirs(out_dir, exist_ok=True)
    prg_mif_path = os.path.join(out_dir, "prg.mif")
    chr_mif_path = os.path.join(out_dir, "chr.mif")

    # Para NROM-128 (16 KB), o espelho cobre 0x8000..0xFFFF
    if prg_banks == 1:
        # Espelha 16 KB tanto em 0x8000 quanto em 0xC000
        write_mif(prg_mif_path, prg_data, depth=65536, address_offset=0x8000, mirror=True)
    else:
        # NROM-256 (32 KB em 0x8000..0xFFFF)
        write_mif(prg_mif_path, prg_data, depth=65536, address_offset=0x8000, mirror=False)

    print(f"[OK] Gerado: {prg_mif_path}")

    # CHR ROM (8 KB em 0x0000..0x1FFF)
    write_mif(chr_mif_path, chr_data[:8192], depth=8192, address_offset=0x0000, mirror=False)
    print(f"[OK] Gerado: {chr_mif_path}")
    print("\n[SUCESSO] ROM convertida e pronta para a FPGA!")
    return True

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python nes_to_mif.py <caminho_da_rom.nes> [diretorio_saida]")
        sys.exit(1)

    rom_path = sys.argv[1]
    output_dir = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(__file__), "..", "cart_init")
    convert_nes(rom_path, output_dir)
