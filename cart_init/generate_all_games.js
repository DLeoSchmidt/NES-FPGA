#!/usr/bin/env node
/**
 * NES-FPGA Batch Game Generator (MIF & Metadata)
 * ===============================================
 * Converte automaticamente todos os 57 jogos compatíveis de Mapper 0 (NROM)
 * localizados na pasta 'NES Roms [10785]' em arquivos de inicialização de memória
 * do Intel Quartus (prg.mif e chr.mif), além de gerar metadados estruturados (meta.json)
 * e o catálogo central (catalog.json).
 * 
 * Arquitetura de Memória NES-FPGA:
 * - PRG-ROM (CPU): Profundidade 65536 (64 KB). Offset em 0x8000.
 *   - NROM-128 (16 KB): Mapeado em 0x8000-0xBFFF e espelhado em 0xC000-0xFFFF.
 *   - NROM-256 (32 KB): Mapeado de 0x8000-0xFFFF continuamente.
 * - CHR-ROM (PPU): Profundidade 8192 (8 KB). Mapeado em 0x0000-0x1FFF.
 */

const fs = require('fs');
const path = require('path');

const ROMS_DIR = 'C:/HDL/t4/NES Roms [10785]';
const GAMES_DIR = path.join(__dirname, 'games');

// Mapeamento explícito de ROM para slug amigável e título canônico
const ROM_METADATA_MAP = {
    '10-Yard Fight (U).nes': { slug: '10-yard-fight', title: '10-Yard Fight' },
    '1942 (JU) [!].nes': { slug: '1942', title: '1942' },
    'Balloon Fight (JU) [!].nes': { slug: 'balloon-fight', title: 'Balloon Fight' },
    'Baseball (UE) [!].nes': { slug: 'baseball', title: 'Baseball' },
    'Bomberman (U).nes': { slug: 'bomberman', title: 'Bomberman' },
    'Burger Time (U) [!].nes': { slug: 'burgertime', title: 'BurgerTime' },
    'Chubby Cherub (U).nes': { slug: 'chubby-cherub', title: 'Chubby Cherub' },
    'Clu Clu Land (JU) (GC).nes': { slug: 'clu-clu-land', title: 'Clu Clu Land' },
    'Defender II (U).nes': { slug: 'defender-ii', title: 'Defender II' },
    'Devil World (E) [!].nes': { slug: 'devil-world', title: 'Devil World' },
    'Dig Dug II (U) [!].nes': { slug: 'dig-dug-ii', title: 'Dig Dug II: Trouble in Paradise' },
    'Donkey Kong (JU).nes': { slug: 'donkey-kong', title: 'Donkey Kong' },
    'Donkey Kong 3 (JUE).nes': { slug: 'donkey-kong-3', title: 'Donkey Kong 3' },
    'Donkey Kong Jr. (JU).nes': { slug: 'donkey-kong-jr', title: 'Donkey Kong Jr.' },
    'Donkey Kong Jr. Math (U).nes': { slug: 'donkey-kong-jr-math', title: 'Donkey Kong Jr. Math' },
    'Duck Hunt (JUE) [!].nes': { slug: 'duck-hunt', title: 'Duck Hunt' },
    'Elevator Action (U).nes': { slug: 'elevator-action', title: 'Elevator Action' },
    'Excitebike (JU) [!].nes': { slug: 'excitebike', title: 'Excitebike' },
    'Galaga (U).nes': { slug: 'galaga', title: 'Galaga: Demons of Death' },
    'Game Genie (PD).nes': { slug: 'game-genie', title: 'Game Genie' },
    'Golf (E).nes': { slug: 'golf', title: 'Golf' },
    'Gyromite (JUE).nes': { slug: 'gyromite', title: 'Gyromite' },
    "Hogan's Alley (JU) [!].nes": { slug: 'hogans-alley', title: "Hogan's Alley" },
    'Hydlide (U).nes': { slug: 'hydlide', title: 'Hydlide' },
    'Ice Climber (U) [!].nes': { slug: 'ice-climber', title: 'Ice Climber' },
    'Ice Hockey (U) [!].nes': { slug: 'ice-hockey', title: 'Ice Hockey' },
    'Kung Fu (U) [!].nes': { slug: 'kung-fu', title: 'Kung Fu' },
    'Lode Runner (U).nes': { slug: 'lode-runner', title: 'Lode Runner' },
    'Lunar Pool (U).nes': { slug: 'lunar-pool', title: 'Lunar Pool' },
    'M.U.S.C.L.E. (U).nes': { slug: 'muscle', title: 'M.U.S.C.L.E.: Tag Team Match' },
    'Mach Rider (E) [!].nes': { slug: 'mach-rider', title: 'Mach Rider' },
    'Magmax (U) (Prototype).nes': { slug: 'magmax', title: 'Magmax' },
    'Mario Bros. (JU) [!].nes': { slug: 'mario-bros', title: 'Mario Bros.' },
    'Millipede (U).nes': { slug: 'millipede', title: 'Millipede' },
    'Ms. Pac-Man (U) (Namco).nes': { slug: 'ms-pacman', title: 'Ms. Pac-Man' },
    'Othello (U).nes': { slug: 'othello', title: 'Othello' },
    'Pac-Man (U) (Tengen) [!].nes': { slug: 'pacman', title: 'Pac-Man' },
    'Pinball (E) [!].nes': { slug: 'pinball', title: 'Pinball' },
    'Popeye (JU) (PRG0) [!].nes': { slug: 'popeye', title: 'Popeye' },
    'Raid on Bungeling Bay (U).nes': { slug: 'raid-on-bungeling-bay', title: 'Raid on Bungeling Bay' },
    'Road Fighter (E) [!].nes': { slug: 'road-fighter', title: 'Road Fighter' },
    'Seicross (U).nes': { slug: 'seicross', title: 'Seicross' },
    'Slalom (U).nes': { slug: 'slalom', title: 'Slalom' },
    'Soccer (E) [!].nes': { slug: 'soccer', title: 'Soccer' },
    'Spelunker (U) [!].nes': { slug: 'spelunker', title: 'Spelunker' },
    'Spy Vs Spy (E) [!].nes': { slug: 'spy-vs-spy', title: 'Spy vs. Spy' },
    'Sqoon (U).nes': { slug: 'sqoon', title: 'Sqoon' },
    'Stack Up (Robot Block) (JU).nes': { slug: 'stack-up', title: 'Stack-Up' },
    'Super Mario Bros. (JU) (PRG0) [!].nes': { slug: 'smb', title: 'Super Mario Bros.' },
    'Tag Team Wrestling (U).nes': { slug: 'tag-team-wrestling', title: 'Tag Team Wrestling' },
    'Tennis (JU) [!].nes': { slug: 'tennis', title: 'Tennis' },
    'Urban Champion (JU).nes': { slug: 'urban-champion', title: 'Urban Champion' },
    'Volleyball (U).nes': { slug: 'volleyball', title: 'Volleyball' },
    'Wild Gunman (U) (PRG0) [!].nes': { slug: 'wild-gunman', title: 'Wild Gunman' },
    'Wrecking Crew (JUE).nes': { slug: 'wrecking-crew', title: 'Wrecking Crew' },
    'Xevious (E).nes': { slug: 'xevious', title: 'Xevious' },
    'Xevious (U).nes': { slug: 'xevious-avenger', title: 'Xevious: The Avenger' }
};

/**
 * Escreve um arquivo de formato MIF (Memory Initialization File) do Altera/Intel Quartus.
 * 
 * @param {string} filename Caminho do arquivo .mif de destino.
 * @param {Buffer} data Buffer de dados binários brutos.
 * @param {number} depth Quantidade total de palavras/endereços na memória.
 * @param {number} addressOffset Endereço inicial de escrita na memória.
 * @param {boolean} mirror Se true, replica o bloco de 16 KB em 0xC000 para NROM-128.
 */
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

    // NROM-128: 16 KB PRG espelhado em 0xC000..0xFFFF
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

/**
 * Converte um arquivo ROM iNES (.nes) individual para o diretório de jogo.
 */
function processRom(romFileName, meta) {
    const romPath = path.join(ROMS_DIR, romFileName);
    if (!fs.existsSync(romPath)) {
        console.error(`[ERRO] ROM não encontrada: ${romPath}`);
        return null;
    }

    const buf = fs.readFileSync(romPath);
    if (buf.length < 16 || buf.slice(0, 4).toString('ascii') !== 'NES\x1A') {
        console.error(`[ERRO] Header iNES inválido: ${romFileName}`);
        return null;
    }

    const prgBanks = buf[4];
    const chrBanks = buf[5];
    const flags6 = buf[6];
    const flags7 = buf[7];

    const mapper = (flags7 & 0xF0) | (flags6 >> 4);
    const mirroring = (flags6 & 0x01) ? 'Vertical' : 'Horizontal';

    let offset = 16;
    if (flags6 & 0x04) offset += 512; // Pula Trainer se presente

    const prgSize = prgBanks * 16384;
    const chrSize = chrBanks * 8192;

    const prgData = buf.slice(offset, offset + prgSize);
    offset += prgSize;

    const chrData = chrSize > 0 ? buf.slice(offset, offset + chrSize) : Buffer.alloc(8192);

    const outGameDir = path.join(GAMES_DIR, meta.slug);
    fs.mkdirSync(outGameDir, { recursive: true });

    const prgMifPath = path.join(outGameDir, 'prg.mif');
    const chrMifPath = path.join(outGameDir, 'chr.mif');
    const metaPath = path.join(outGameDir, 'meta.json');

    // PRG ROM: 1 banco (16 KB) espelha em 0xC000; 2 bancos (32 KB) ocupa 0x8000-0xFFFF
    const isNrom128 = (prgBanks === 1);
    writeMif(prgMifPath, prgData, 65536, 0x8000, isNrom128);
    writeMif(chrMifPath, chrData.slice(0, 8192), 8192, 0x0000, false);

    const gameInfo = {
        slug: meta.slug,
        title: meta.title,
        romFile: romFileName,
        prgBanks,
        prgSizeKB: prgBanks * 16,
        chrBanks,
        chrSizeKB: chrBanks * 8,
        mapper,
        mapperType: isNrom128 ? 'NROM-128' : 'NROM-256',
        mirroring,
        hardwareCompatibility: mirroring === 'Vertical' ? 'Nativo (100% OK)' : 'Compatível (Espelhamento Horizontal)',
        createdAt: new Date().toISOString()
    };

    fs.writeFileSync(metaPath, JSON.stringify(gameInfo, null, 2), 'utf-8');
    return gameInfo;
}

function main() {
    console.log('='.repeat(65));
    console.log('      NES-FPGA - GERAÇÃO EM LOTE DE JOGOS COMPATÍVEIS      ');
    console.log('='.repeat(65));
    console.log(`Diretório de ROMs: ${ROMS_DIR}`);
    console.log(`Diretório de Saída: ${GAMES_DIR}\n`);

    fs.mkdirSync(GAMES_DIR, { recursive: true });

    const catalog = [];
    let successCount = 0;

    for (const [romFile, meta] of Object.entries(ROM_METADATA_MAP)) {
        process.stdout.write(`Convertendo [${meta.slug.padEnd(20)}] ${meta.title}... `);
        const info = processRom(romFile, meta);
        if (info) {
            catalog.push(info);
            successCount++;
            console.log(`OK (${info.mapperType}, ${info.mirroring})`);
        } else {
            console.log(`FALHOU`);
        }
    }

    // Ordena catálogo por título alfabético
    catalog.sort((a, b) => a.title.localeCompare(b.title));

    // Salva catálogo unificado
    const catalogPath = path.join(GAMES_DIR, 'catalog.json');
    fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2), 'utf-8');

    console.log('\n' + '='.repeat(65));
    console.log(`Sucesso: ${successCount} de ${Object.keys(ROM_METADATA_MAP).length} jogos convertidos!`);
    console.log(`Catálogo consolidado salvo em: ${catalogPath}`);
    console.log('='.repeat(65));
}

if (require.main === module) {
    main();
}

module.exports = { processRom, ROM_METADATA_MAP };
