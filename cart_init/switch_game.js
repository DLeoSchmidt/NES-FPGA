#!/usr/bin/env node
/**
 * NES-FPGA Game Switcher CLI
 * ==========================
 * Alterna dinamicamente entre os 57 jogos NROM (Mapper 0) compatíveis copiando os
 * arquivos prg.mif e chr.mif correspondentes para cart_init/, atualizando o estado
 * ativo e orientando o fluxo de atualização de memória no Intel Quartus Prime.
 * 
 * Uso:
 *   node cart_init/switch_game.js                   (Lista todos os jogos disponíveis)
 *   node cart_init/switch_game.js <slug>            (Ativa o jogo indicado pelo slug)
 *   node cart_init/switch_game.js search <termo>    (Filtra jogos pelo termo digitado)
 *   node cart_init/switch_game.js current           (Exibe o jogo atualmente ativo)
 */

const fs = require('fs');
const path = require('path');

const targetDir = __dirname;
const gamesDir = path.join(targetDir, 'games');
const catalogPath = path.join(gamesDir, 'catalog.json');
const activeGamePath = path.join(targetDir, 'active_game.json');

/**
 * Carrega a lista completa de jogos a partir do catálogo central ou lê os subdiretórios.
 */
function loadCatalog() {
    if (fs.existsSync(catalogPath)) {
        try {
            return JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));
        } catch {
            // fallback para leitura de diretórios
        }
    }

    const catalog = [];
    if (!fs.existsSync(gamesDir)) return catalog;

    const entries = fs.readdirSync(gamesDir, { withFileTypes: true });
    for (const ent of entries) {
        if (!ent.isDirectory()) continue;
        const metaFile = path.join(gamesDir, ent.name, 'meta.json');
        if (fs.existsSync(metaFile)) {
            try {
                catalog.push(JSON.parse(fs.readFileSync(metaFile, 'utf-8')));
                continue;
            } catch {}
        }
        catalog.push({
            slug: ent.name,
            title: ent.name,
            mapperType: 'Mapper 0',
            mirroring: 'Desconhecido'
        });
    }
    return catalog.sort((a, b) => a.title.localeCompare(b.title));
}

/**
 * Retorna os metadados do jogo atualmente ativo em cart_init/
 */
function getActiveGame() {
    if (fs.existsSync(activeGamePath)) {
        try {
            return JSON.parse(fs.readFileSync(activeGamePath, 'utf-8'));
        } catch {}
    }
    return null;
}

/**
 * Exibe a tabela formatada dos jogos disponíveis.
 */
function printCatalog(games, activeSlug = '') {
    console.log('='.repeat(78));
    console.log('                    NES-FPGA - CATÁLOGO DE JOGOS                      ');
    console.log('='.repeat(78));
    console.log(` ${'SLUG'.padEnd(22)} | ${'TÍTULO'.padEnd(28)} | ${'TIPO'.padEnd(10)} | ${'ESPELH.'} `);
    console.log('-'.repeat(78));

    for (const g of games) {
        const isCurrent = (g.slug === activeSlug);
        const prefix = isCurrent ? '* ' : '  ';
        const slugStr = (prefix + g.slug).padEnd(22);
        const titleStr = g.title.substring(0, 28).padEnd(28);
        const typeStr = (g.mapperType || 'NROM').padEnd(10);
        const mirrorStr = g.mirroring || '-';
        console.log(` ${slugStr} | ${titleStr} | ${typeStr} | ${mirrorStr}`);
    }

    console.log('='.repeat(78));
    console.log(`Total: ${games.length} jogos disponíveis.`);
    if (activeSlug) {
        console.log(`(*) Jogo atualmente ativo: '${activeSlug}'`);
    }
    console.log('\nComandos rápidos:');
    console.log('  node cart_init/switch_game.js <slug>         -> Ativar jogo');
    console.log('  node cart_init/switch_game.js search <nome>  -> Buscar jogo');
    console.log('='.repeat(78));
}

/**
 * Alterna os arquivos MIF ativos para o jogo solicitado.
 */
function switchGame(slug) {
    const catalog = loadCatalog();
    const cleanSlug = slug.toLowerCase().trim();

    // 1. Busca exata por slug
    let target = catalog.find(g => g.slug.toLowerCase() === cleanSlug);

    // 2. Se não encontrar exato, tenta correspondência parcial
    if (!target) {
        const candidates = catalog.filter(g => 
            g.slug.toLowerCase().includes(cleanSlug) || 
            g.title.toLowerCase().includes(cleanSlug)
        );

        if (candidates.length === 1) {
            target = candidates[0];
        } else if (candidates.length > 1) {
            console.log(`[AVISO] Múltiplos jogos encontrados para o termo '${cleanSlug}':`);
            for (const c of candidates) {
                console.log(`  - ${c.slug.padEnd(20)} (${c.title})`);
            }
            console.log('\nPor favor, execute especificando o slug exato.');
            process.exit(1);
        }
    }

    if (!target) {
        console.error(`[ERRO] Jogo '${slug}' não encontrado no catálogo.`);
        console.log('Execute `node cart_init/switch_game.js` para visualizar todos os slugs disponíveis.');
        process.exit(1);
    }

    const sourceDir = path.join(gamesDir, target.slug);
    const srcPrg = path.join(sourceDir, 'prg.mif');
    const srcChr = path.join(sourceDir, 'chr.mif');

    if (!fs.existsSync(srcPrg) || !fs.existsSync(srcChr)) {
        console.error(`[ERRO] Arquivos MIF ausentes para o jogo em: ${sourceDir}`);
        process.exit(1);
    }

    const destPrg = path.join(targetDir, 'prg.mif');
    const destChr = path.join(targetDir, 'chr.mif');

    try {
        fs.copyFileSync(srcPrg, destPrg);
        fs.copyFileSync(srcChr, destChr);

        const activeData = {
            ...target,
            activatedAt: new Date().toISOString()
        };
        fs.writeFileSync(activeGamePath, JSON.stringify(activeData, null, 2), 'utf-8');

        console.log('='.repeat(70));
        console.log(`[SUCESSO] JOGO ATIVO ALTERADO PARA: ${target.title.toUpperCase()}`);
        console.log('='.repeat(70));
        console.log(` Slug:              ${target.slug}`);
        console.log(` Arquitetura:       ${target.mapperType || 'Mapper 0'}`);
        console.log(` PRG ROM:           ${target.prgSizeKB || 32} KB`);
        console.log(` CHR ROM:           ${target.chrSizeKB || 8} KB`);
        console.log(` Espelhamento:      ${target.mirroring}`);
        console.log(` Compatibilidade:   ${target.hardwareCompatibility || 'Compatível'}`);
        console.log('='.repeat(70));
        console.log('\nFLUXO RÁPIDO PARA GRAVAR NA FPGA (Sem resintetizar todo o projeto):');
        console.log('  1. No Intel Quartus Prime:');
        console.log('     Processing -> Update Memory Initialization File (Ctrl+Shift+U)');
        console.log('  2. Iniciar o Assembler:');
        console.log('     Processing -> Start -> Start Assembler (Ctrl+L)');
        console.log('  3. Gravar na Placa DE10-Lite:');
        console.log('     Tools -> Programmer -> Start (gravar o arquivo .sof atualizado)');
        console.log('='.repeat(70));
    } catch (err) {
        console.error(`[ERRO] Falha ao alternar arquivos: ${err.message}`);
        process.exit(1);
    }
}

// Tratamento de argumentos CLI
if (require.main === module) {
    const args = process.argv.slice(2);
    const command = (args[0] || '').toLowerCase().trim();

    if (!command) {
        const active = getActiveGame();
        printCatalog(loadCatalog(), active ? active.slug : '');
    } else if (command === 'current') {
        const active = getActiveGame();
        if (active) {
            console.log(`Jogo ativo: ${active.title} [slug: ${active.slug}] (${active.mirroring})`);
        } else {
            console.log('Nenhum jogo registrado em active_game.json.');
        }
    } else if (command === 'search') {
        const query = (args[1] || '').toLowerCase().trim();
        if (!query) {
            console.error('Uso: node cart_init/switch_game.js search <termo>');
            process.exit(1);
        }
        const catalog = loadCatalog();
        const filtered = catalog.filter(g => 
            g.slug.toLowerCase().includes(query) || 
            g.title.toLowerCase().includes(query)
        );
        const active = getActiveGame();
        printCatalog(filtered, active ? active.slug : '');
    } else {
        switchGame(command);
    }
}

module.exports = { loadCatalog, getActiveGame, switchGame };
