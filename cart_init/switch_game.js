#!/usr/bin/env node
/**
 * NES-FPGA Game Switcher
 * ======================
 * Alterna rapidamente entre os jogos configurados copiando os arquivos
 * prg.mif e chr.mif correspondentes para cart_init/.
 * 
 * Uso:
 *   node cart_init/switch_game.js bomberman
 *   node cart_init/switch_game.js smb
 */

const fs = require('fs');
const path = require('path');

const gameName = (process.argv[2] || '').toLowerCase().trim();
const gamesDir = path.join(__dirname, 'games');
const targetDir = __dirname;

if (!gameName) {
    console.log('='.repeat(55));
    console.log('            NES-FPGA GAME SWITCHER            ');
    console.log('='.repeat(55));
    console.log('Uso: node cart_init/switch_game.js <nome_do_jogo>');
    console.log('\nJogos disponiveis:');
    try {
        const list = fs.readdirSync(gamesDir, { withFileTypes: true });
        for (const item of list) {
            if (item.isDirectory()) {
                console.log(`  - ${item.name}`);
            }
        }
    } catch {
        console.log('  (Nenhum jogo encontrado na pasta games/)');
    }
    console.log('='.repeat(55));
    process.exit(1);
}

const sourceGameDir = path.join(gamesDir, gameName);
const srcPrg = path.join(sourceGameDir, 'prg.mif');
const srcChr = path.join(sourceGameDir, 'chr.mif');

if (!fs.existsSync(srcPrg) || !fs.existsSync(srcChr)) {
    console.error(`[ERRO] O jogo '${gameName}' nao possui prg.mif e chr.mif em: ${sourceGameDir}`);
    process.exit(1);
}

const destPrg = path.join(targetDir, 'prg.mif');
const destChr = path.join(targetDir, 'chr.mif');

try {
    fs.copyFileSync(srcPrg, destPrg);
    fs.copyFileSync(srcChr, destChr);

    console.log('='.repeat(60));
    console.log(`[SUCESSO] Jogo ativo alterado para: '${gameName.toUpperCase()}'!`);
    console.log('='.repeat(60));
    console.log('Proximos passos no Intel Quartus:');
    console.log('  1. Processing -> Update Memory Initialization File');
    console.log('  2. Processing -> Start -> Start Assembler');
    console.log('  3. Gravar o novo arquivo .sof na FPGA via Programmer.');
    console.log('='.repeat(60));
} catch (err) {
    console.error(`[ERRO] Falha ao copiar arquivos: ${err.message}`);
    process.exit(1);
}
