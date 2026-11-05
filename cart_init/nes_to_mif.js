#!/usr/bin/env node
/**
 * NES-to-MIF Direct Converter (Node.js Edition)
 * =============================================
 * Converte arquivos .nes diretamente para prg.mif e chr.mif do Quartus.
 */

const fs = require('fs');
const path = require('path');

function writeMif(filename, data, depth, addressOffset = 0, mirror = false) {
    const lines = [
        'WIDTH=8;',
        `DEPTH=${depth};`,
        '',
        'ADDRESS_RADIX=HEX;',
        'DATA_RADIX=HEX;',
        '',
        'CONTENT BEGIN'
    ];

    if (addressOffset > 0) {
        lines.push(`\t[0000..${(addressOffset - 1).toString(16).toUpperCase().padStart(4, '0')}] : 00;`);
    }

    let addr = addressOffset;
    for (let i = 0; i < data.length; i++) {
        const hexAddr = addr.toString(16).toUpperCase().padStart(4, '0');
        const hexVal = data[i].toString(16).toUpperCase().padStart(2, '0');
        lines.push(`\t${hexAddr} : ${hexVal};`);
        addr++;
    }

    if (mirror && data.length === 16384 && addressOffset === 0x8000) {
        for (let i = 0; i < data.length; i++) {
            const hexAddr = addr.toString(16).toUpperCase().padStart(4, '0');
            const hexVal = data[i].toString(16).toUpperCase().padStart(2, '0');
            lines.push(`\t${hexAddr} : ${hexVal};`);
            addr++;
        }
    }

    if (addr < depth) {
        lines.push(`\t[${addr.toString(16).toUpperCase().padStart(4, '0')}..${(depth - 1).toString(16).toUpperCase().padStart(4, '0')}] : 00;`);
    }

    lines.push('END;\n');
    fs.writeFileSync(filename, lines.join('\n'), 'ascii');
}

function convertNes(nesPath, outDir) {
    if (!fs.existsSync(nesPath)) {
        console.error(`[ERRO] Arquivo ROM não encontrado: ${nesPath}`);
        return false;
    }

    const buf = fs.readFileSync(nesPath);
    if (buf.length < 16 || buf.slice(0, 4).toString('ascii') !== 'NES\x1A') {
        console.error('[ERRO] Arquivo não possui cabeçalho válido iNES.');
        return false;
    }

    const prgBanks = buf[4];
    const chrBanks = buf[5];
    const flags6 = buf[6];
    const flags7 = buf[7];

    const mapper = (flags7 & 0xF0) | (flags6 >> 4);
    const mirroring = (flags6 & 0x01) ? 'Vertical' : 'Horizontal';

    console.log('='.repeat(60));
    console.log('               ANÁLISE DA ROM NES (Node.js)               ');
    console.log('='.repeat(60));
    console.log(` Arquivo:       ${path.basename(nesPath)}`);
    console.log(` PRG ROM:       ${prgBanks} bancos (${prgBanks * 16} KB)`);
    console.log(` CHR ROM:       ${chrBanks} bancos (${chrBanks * 8} KB)`);
    console.log(` Mapper:        ${mapper} (${mapper === 0 ? 'NROM - Suportado!' : 'Não suportado no momento'})`);
    console.log(` Espelhamento:  ${mirroring}`);
    console.log('='.repeat(60));

    let offset = 16;
    if (flags6 & 0x04) offset += 512; // Pula trainer

    const prgSize = prgBanks * 16384;
    const chrSize = chrBanks * 8192;

    const prgData = buf.slice(offset, offset + prgSize);
    offset += prgSize;

    const chrData = chrSize > 0 ? buf.slice(offset, offset + chrSize) : Buffer.alloc(8192);

    fs.mkdirSync(outDir, { recursive: true });
    const prgMifPath = path.join(outDir, 'prg.mif');
    const chrMifPath = path.join(outDir, 'chr.mif');

    if (prgBanks === 1) {
        writeMif(prgMifPath, prgData, 65536, 0x8000, true);
    } else {
        writeMif(prgMifPath, prgData, 65536, 0x8000, false);
    }
    console.log(`[OK] Gerado: ${prgMifPath}`);

    writeMif(chrMifPath, chrData.slice(0, 8192), 8192, 0x0000, false);
    console.log(`[OK] Gerado: ${chrMifPath}`);
    console.log('\n[SUCESSO] ROM convertida e pronta para gravação!');
    return true;
}

const romArg = process.argv[2];
const outArg = process.argv[3] || path.join(__dirname, '..', 'cart_init');

if (!romArg) {
    console.log('Uso: node nes_to_mif.js <caminho_da_rom.nes> [diretório_saída]');
    process.exit(1);
}

convertNes(romArg, outArg);
