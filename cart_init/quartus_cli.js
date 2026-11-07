#!/usr/bin/env node
/**
 * NES-FPGA Quartus CLI Automation Driver
 * ======================================
 * Automatiza o pipeline completo de compilação rápida e gravação na FPGA via terminal:
 *   1. Atualização do banco de dados com novos arquivos MIF: `quartus_cdb NES --update_mif`
 *   2. Geração do novo bitstream pelo Assembler:           `quartus_asm NES`
 *   3. Gravação JTAG na placa DE10-Lite (USB-Blaster):     `quartus_pgm -c <cabo> -m JTAG -o "p;output_files/NES.sof"`
 * 
 * Descoberta Dinâmica de Versões:
 *   Escaneia C:\altera, C:\intelFPGA, C:\intelFPGA_lite, C:\intelFPGA_pro e PATH.
 *   Prioriza versões modernas (>= 18.1) compatíveis com a família Intel MAX 10.
 *   Reconhece instalações completas e programadores avulsos (ex: Quartus Programmer 25.1std).
 */

const fs = require('fs');
const path = require('path');
const { spawnSync, execSync } = require('child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const PROJECT_NAME = 'NES';

/**
 * Escaneia o sistema operacional em busca de instalações do Intel/Altera Quartus Prime.
 * 
 * @returns {Array<Object>} Lista de instalações detectadas, ordenadas por prioridade.
 */
function findQuartusInstallations() {
    const searchRoots = [
        'C:\\intelFPGA_lite\\18.1',
        'C:\\intelFPGA\\18.1',
        'C:\\altera\\18.1',
        process.env.QUARTUS_ROOTDIR,
        'C:\\intelFPGA_lite',
        'C:\\intelFPGA',
        'C:\\altera',
        'C:\\intelFPGA_pro',
        'D:\\intelFPGA_lite\\18.1',
        'D:\\intelFPGA\\18.1',
        'D:\\altera\\18.1',
        'D:\\intelFPGA_lite',
        'D:\\intelFPGA',
        'D:\\altera',
        'E:\\intelFPGA_lite\\18.1',
        'E:\\intelFPGA_lite'
    ].filter(Boolean);

    const candidates = [];
    const seenDirs = new Set();

    for (const root of searchRoots) {
        if (!fs.existsSync(root)) continue;

        try {
            // Verifica se a raiz já é uma pasta com bin64
            const checkBinDir = (binDir, label = '') => {
                const norm = path.normalize(binDir).toLowerCase();
                if (seenDirs.has(norm)) return;
                if (!fs.existsSync(binDir)) return;

                const cdbPath = path.join(binDir, 'quartus_cdb.exe');
                const asmPath = path.join(binDir, 'quartus_asm.exe');
                const pgmPath = path.join(binDir, 'quartus_pgm.exe');
                const shPath  = path.join(binDir, 'quartus_sh.exe');

                const hasCompiler = fs.existsSync(cdbPath) && fs.existsSync(asmPath);
                const hasProgrammer = fs.existsSync(pgmPath);

                if (hasCompiler || hasProgrammer) {
                    seenDirs.add(norm);

                    // Tenta extrair versão do caminho
                    const versionMatch = binDir.match(/(\d+\.\d+(?:std|pro)?)/i);
                    const versionStr = versionMatch ? versionMatch[1] : (label || 'Desconhecida');
                    const versionNum = parseFloat(versionStr) || 0;
                    const is18_1 = Math.abs(versionNum - 18.1) < 0.05 || versionStr.startsWith('18.1');

                    candidates.push({
                        version: versionStr,
                        versionNumber: versionNum,
                        is18_1,
                        binDir,
                        hasCompiler,
                        hasProgrammer,
                        cdb: hasCompiler ? cdbPath : null,
                        asm: hasCompiler ? asmPath : null,
                        pgm: hasProgrammer ? pgmPath : null,
                        sh: fs.existsSync(shPath) ? shPath : null,
                        supportsMax10: versionNum >= 15.0
                    });
                }
            };

            // 1. Procura subpastas de versão diretas (ex: C:\altera\13.1, C:\intelFPGA_lite\18.1)
            const stat = fs.statSync(root);
            if (stat.isDirectory()) {
                // Checa direto na própria raiz se já contiver quartus/bin64
                checkBinDir(path.join(root, 'quartus', 'bin64'), path.basename(root));
                checkBinDir(path.join(root, 'quartus', 'bin'), path.basename(root));
                checkBinDir(path.join(root, 'bin64'), path.basename(root));
                checkBinDir(path.join(root, 'bin'), path.basename(root));

                const entries = fs.readdirSync(root, { withFileTypes: true });
                for (const ent of entries) {
                    if (!ent.isDirectory()) continue;
                    const versionFolder = path.join(root, ent.name);

                    // Caminho padrão de instalação completa: <versão>\quartus\bin64
                    checkBinDir(path.join(versionFolder, 'quartus', 'bin64'), ent.name);
                    checkBinDir(path.join(versionFolder, 'quartus', 'bin'), ent.name);

                    // Caminho de Quartus Programmer Standalone: <versão>\qprogrammer\bin64
                    checkBinDir(path.join(versionFolder, 'qprogrammer', 'bin64'), `${ent.name} (Programmer)`);
                    checkBinDir(path.join(versionFolder, 'qprogrammer', 'quartus', 'bin64'), `${ent.name} (Programmer)`);
                }
            }
        } catch {
            // Ignora pastas inacessíveis
        }
    }

    // Ordenação estrita: Quartus 18.1 SEMPRE no topo com prioridade máxima
    candidates.sort((a, b) => {
        // Prioridade 1: Versão 18.1 (testada e validada para MAX 10 deste projeto)
        if (a.is18_1 !== b.is18_1) return a.is18_1 ? -1 : 1;
        // Prioridade 2: Ter compilador completo (cdb + asm)
        if (a.hasCompiler !== b.hasCompiler) return a.hasCompiler ? -1 : 1;
        // Prioridade 3: Suporte comprovado à família MAX 10 (>= 15.0)
        if (a.supportsMax10 !== b.supportsMax10) return a.supportsMax10 ? -1 : 1;
        // Prioridade 4: Versão mais recente
        return b.versionNumber - a.versionNumber;
    });

    return candidates;
}

/**
 * Retorna as melhores ferramentas disponíveis para compilação e para gravação.
 */
function getBestToolchain() {
    const list = findQuartusInstallations();
    const compiler = list.find(inst => inst.hasCompiler && inst.supportsMax10) || list.find(inst => inst.hasCompiler) || null;
    const programmer = list.find(inst => inst.hasProgrammer && inst.supportsMax10) || list.find(inst => inst.hasProgrammer) || null;

    return {
        all: list,
        compiler,
        programmer,
        isFullyAutomated: Boolean(compiler && programmer)
    };
}

/**
 * Lista todos os cabos/hardware JTAG conectados usando o `quartus_pgm -l`.
 * 
 * @param {string} [pgmPath] Caminho do quartus_pgm.exe.
 * @returns {Array<string>} Lista dos nomes dos cabos encontrados (ex: ["USB-Blaster [USB-0]"]).
 */
function listJtagCables(pgmPath) {
    if (!pgmPath) {
        const { programmer } = getBestToolchain();
        pgmPath = programmer ? programmer.pgm : null;
    }
    if (!pgmPath || !fs.existsSync(pgmPath)) return [];

    try {
        const res = spawnSync(pgmPath, ['-l'], { encoding: 'utf-8', timeout: 5000 });
        const output = (res.stdout || '') + (res.stderr || '');
        const cables = [];
        const lines = output.split('\n');

        for (const line of lines) {
            const m = line.match(/^\s*\d+\)\s+(.+?)\s*$/);
            if (m) {
                cables.push(m[1].trim());
            }
        }
        return cables;
    } catch {
        return [];
    }
}

/**
 * Passo 1: Executa `quartus_cdb NES --update_mif` para injetar os novos MIFs no projeto.
 */
function updateMif(compiler, onLog = console.log) {
    if (!compiler || !compiler.cdb) {
        throw new Error('quartus_cdb não encontrado no sistema. Necessário Quartus Prime (>= 18.1).');
    }

    onLog(`[QUARTUS] Executando Update MIF: ${compiler.cdb} ${PROJECT_NAME} --update_mif`);
    const res = spawnSync(compiler.cdb, [PROJECT_NAME, '--update_mif'], {
        cwd: PROJECT_ROOT,
        encoding: 'utf-8'
    });

    if (res.error) throw res.error;
    if (res.status !== 0) {
        const errOutput = (res.stderr || '') + (res.stdout || '');
        if (errOutput.includes('before running the current Quartus') || errOutput.includes('quartus_map')) {
            throw new Error(`O banco de dados 'db/' ainda não foi sintetizado nesta máquina. Abra o projeto no Quartus e faça a primeira compilação completa (Processing -> Start Compilation).`);
        }
        throw new Error(`Falha no quartus_cdb (Código ${res.status}):\n${errOutput}`);
    }

    onLog('[QUARTUS] [OK] Memórias MIF atualizadas no banco de dados com sucesso.');
    return true;
}

/**
 * Passo 2: Executa `quartus_asm NES` para recompilar apenas o bitstream `.sof`.
 */
function runAssembler(compiler, onLog = console.log) {
    if (!compiler || !compiler.asm) {
        throw new Error('quartus_asm não encontrado no sistema. Necessário Quartus Prime (>= 18.1).');
    }

    onLog(`[QUARTUS] Executando Assembler: ${compiler.asm} ${PROJECT_NAME}`);
    const res = spawnSync(compiler.asm, [PROJECT_NAME], {
        cwd: PROJECT_ROOT,
        encoding: 'utf-8'
    });

    if (res.error) throw res.error;
    if (res.status !== 0) {
        const errOutput = (res.stderr || '') + (res.stdout || '');
        throw new Error(`Falha no quartus_asm (Código ${res.status}):\n${errOutput}`);
    }

    onLog('[QUARTUS] [OK] Novo bitstream .sof gerado com sucesso em output_files/NES.sof.');
    return true;
}

/**
 * Localiza o script Nios II Command Shell no sistema operacional Windows.
 */
function findNiosCommandShell() {
    const candidates = [
        'C:\\intelFPGA_lite\\18.1\\nios2eds\\Nios II Command Shell.bat',
        'C:\\intelFPGA\\18.1\\nios2eds\\Nios II Command Shell.bat',
        'C:\\altera\\18.1\\nios2eds\\Nios II Command Shell.bat',
        process.env.SOPC_KIT_NIOS2 ? path.join(process.env.SOPC_KIT_NIOS2, 'Nios II Command Shell.bat') : null,
        'D:\\intelFPGA_lite\\18.1\\nios2eds\\Nios II Command Shell.bat',
        'D:\\intelFPGA\\18.1\\nios2eds\\Nios II Command Shell.bat'
    ].filter(Boolean);

    for (const p of candidates) {
        if (fs.existsSync(p)) return p;
    }
    return null;
}

/**
 * Faz o download do firmware compilado (.elf) para o softcore Nios II na SDRAM.
 * Obrigatório após gravar o bitstream .sof, pois a memória SDRAM da placa DE10-Lite é volátil.
 * 
 * @param {string} [cableName] Nome do cabo JTAG detectado (ex: "USB-Blaster [USB-0]").
 * @param {Function} [onLog] Callback de log.
 * @returns {boolean} True se o firmware foi baixado e o Nios II iniciado com sucesso.
 */
function downloadNiosFirmware(cableName = null, onLog = console.log) {
    const elfPath = path.join(PROJECT_ROOT, 'qsys', 'software', 'usb_controller', 'usb_controller.elf');
    if (!fs.existsSync(elfPath)) {
        onLog(`[NIOS II] [AVISO] Firmware '${elfPath}' não encontrado.`);
        return false;
    }

    const niosShell = findNiosCommandShell();
    if (!niosShell) {
        onLog('[NIOS II] [AVISO] Nios II Command Shell.bat não localizado para inicializar a SDRAM.');
        return false;
    }

    const cables = listJtagCables();
    const targetCable = cableName || (cables.length > 0 ? cables[0] : 'USB-Blaster [USB-0]');
    const normalizedElf = elfPath.replace(/\\/g, '/');

    // Libera a porta JTAG garantindo que o nios2-terminal não a mantenha presa
    if (process.platform === 'win32') {
        try {
            spawnSync('taskkill', ['/F', '/IM', 'nios2-terminal.exe'], { stdio: 'ignore', timeout: 2000 });
        } catch {}
    }

    onLog(`[NIOS II] Transferindo '${path.basename(elfPath)}' para a SDRAM via '${targetCable}'...`);
    const psCommand = `& '${niosShell}' nios2-download -g -c '${targetCable}' '${normalizedElf}'`;

    try {
        const res = spawnSync('powershell', ['-NoProfile', '-Command', psCommand], {
            cwd: PROJECT_ROOT,
            encoding: 'utf-8',
            timeout: 25000
        });

        if (res.status === 0) {
            onLog('[NIOS II] [SUCESSO] Firmware Nios II iniciado na SDRAM! Controles e displays de 7 segmentos ativos.');
            return true;
        } else {
            const err = (res.stderr || '') + (res.stdout || '');
            onLog(`[NIOS II] [AVISO] Falha ao baixar .elf no Nios II (Código ${res.status}):\n${err}`);
            return false;
        }
    } catch (e) {
        onLog(`[NIOS II] [ERRO] Exceção ao executar nios2-download: ${e.message}`);
        return false;
    }
}

/**
 * Passo 3: Grava o arquivo `.sof` na placa DE10-Lite via `quartus_pgm`.
 */
function programFpga(programmer, cableName = null, onLog = console.log, { requireCable = true } = {}) {
    if (!programmer || !programmer.pgm) {
        throw new Error('quartus_pgm não encontrado no sistema.');
    }

    const cables = listJtagCables(programmer.pgm);
    if (cables.length === 0) {
        if (requireCable) {
            throw new Error('Nenhum cabo JTAG / USB-Blaster detectado. Conecte o cabo USB da placa DE10-Lite e certifique-se de que a placa está ligada.');
        } else {
            onLog('\n[AVISO JTAG] Nenhum cabo USB-Blaster detectado no momento.');
            onLog('  -> O bitstream atualizado foi gerado com sucesso em: output_files/NES.sof');
            onLog('  -> Para gravar na placa quando conectar o cabo, execute:');
            onLog('     node cart_init/switch_game.js flash');
            return false;
        }
    }

    const targetCable = cableName || cables[0];
    const sofPath = path.join(PROJECT_ROOT, 'output_files', `${PROJECT_NAME}.sof`);
    const fallbackSof = path.join(PROJECT_ROOT, `${PROJECT_NAME}.sof`);

    let finalSof = fs.existsSync(sofPath) ? sofPath : (fs.existsSync(fallbackSof) ? fallbackSof : null);
    if (!finalSof) {
        throw new Error(`Arquivo .sof não encontrado em '${sofPath}'. Execute o Assembler primeiro.`);
    }

    onLog(`[QUARTUS] Gravando bitstream na FPGA via cabo '${targetCable}'...`);

    // Libera a porta JTAG garantindo que o nios2-terminal não a mantenha presa
    if (process.platform === 'win32') {
        try {
            spawnSync('taskkill', ['/F', '/IM', 'nios2-terminal.exe'], { stdio: 'ignore', timeout: 2000 });
        } catch {}
    }

    const args = ['-c', targetCable, '-m', 'JTAG', '-o', `p;${finalSof}`];
    const res = spawnSync(programmer.pgm, args, {
        cwd: PROJECT_ROOT,
        encoding: 'utf-8'
    });

    if (res.error) throw res.error;
    if (res.status !== 0) {
        const errOutput = (res.stderr || '') + (res.stdout || '');
        throw new Error(`Falha no quartus_pgm (Código ${res.status}):\n${errOutput}`);
    }

    onLog('[QUARTUS] [SUCESSO] Placa DE10-Lite gravada com sucesso! O novo jogo está ativo na FPGA.');
    return true;
}

/**
 * Executa o pipeline automatizado de troca e gravação.
 * Retorna um objeto detalhado com o status de cada etapa do processo.
 */
function runPipeline({ switchMif = true, doUpdateMif = true, doAsm = true, doFlash = true, slug = null, onLog = console.log } = {}) {
    const toolchain = getBestToolchain();
    const result = {
        success: false,
        mifUpdated: false,
        sofGenerated: false,
        flashed: false,
        cableConnected: false,
        cableName: null,
        error: null,
        warning: null
    };

    onLog('='.repeat(70));
    onLog('             NES-FPGA - PIPELINE AUTOMATIZADO QUARTUS               ');
    onLog('='.repeat(70));

    // 1. Alterna os arquivos MIF
    if (slug) {
        const switcher = require('./switch_game.js');
        onLog(`[PASSO 1/4] Alternando arquivos MIF para o jogo: '${slug}'...`);
        switcher.switchGame(slug);
        result.mifUpdated = true;
    }

    // 2. Atualiza MIF no banco de dados do Quartus
    if (doUpdateMif) {
        if (!toolchain.compiler) {
            onLog('\n[AVISO] Compilador Quartus Prime (>= 18.1) não detectado nesta máquina.');
            onLog('  -> No PC do laboratório (ou com Quartus 18.1/24.1 instalado), este passo é 100% automático.');
            onLog('  -> Alternativa manual: No Quartus, pressione Ctrl+Shift+U.');
            result.warning = 'Compilador Quartus Prime não localizado.';
            return result;
        }
        onLog('\n[PASSO 2/4] Atualizando inicialização de memória no banco de dados...');
        updateMif(toolchain.compiler, onLog);
        result.mifUpdated = true;
    }

    // 3. Executa o Assembler
    if (doAsm) {
        if (!toolchain.compiler) {
            onLog('\n[AVISO] Quartus Assembler não disponível sem a instalação do compilador.');
            onLog('  -> Alternativa manual: No Quartus, pressione Ctrl+L.');
            result.warning = 'Compilador Quartus Prime não localizado.';
            return result;
        }
        onLog('\n[PASSO 3/4] Recompilando bitstream (quartus_asm)...');
        runAssembler(toolchain.compiler, onLog);
        result.sofGenerated = true;
    }

    // 4. Grava na placa via Programmer (tolerante à ausência de cabo JTAG)
    if (doFlash) {
        if (!toolchain.programmer) {
            onLog('\n[AVISO] Nenhum programador (quartus_pgm) encontrado.');
            result.warning = 'Gravador quartus_pgm não localizado.';
            return result;
        }
        const cables = listJtagCables(toolchain.programmer.pgm);
        result.cableConnected = cables.length > 0;
        result.cableName = cables[0] || null;

        onLog('\n[PASSO 4/4] Gravando bitstream .sof na FPGA DE10-Lite...');
        const flashSuccess = programFpga(toolchain.programmer, null, onLog, { requireCable: false });
        result.flashed = !!flashSuccess;
        if (flashSuccess) {
            onLog('\n[PASSO EXTRA] Inicializando softcore Nios II na SDRAM com usb_controller.elf...');
            const niosOk = downloadNiosFirmware(result.cableName, onLog);
            result.elfDownloaded = !!niosOk;
        } else if (!result.cableConnected) {
            result.warning = 'Bitstream NES.sof gerado com sucesso, mas nenhum cabo USB-Blaster foi detectado.';
        }
    }

    onLog('='.repeat(70));
    onLog('[CONCLUÍDO] Pipeline executado com êxito!');
    onLog('='.repeat(70));
    result.success = true;
    return result;
}

// Execução direta via CLI para diagnóstico
if (require.main === module) {
    const { all, compiler, programmer } = getBestToolchain();

    console.log('='.repeat(70));
    console.log('            DIAGNÓSTICO DO INTEL QUARTUS NO SISTEMA                ');
    console.log('='.repeat(70));

    if (all.length === 0) {
        console.log('Nenhuma instalação do Altera/Intel Quartus foi localizada nos caminhos padrão.');
    } else {
        console.log('Instalações localizadas:');
        for (const inst of all) {
            const tags = [];
            if (inst.hasCompiler) tags.push('Compilador');
            if (inst.hasProgrammer) tags.push('Programmer');
            if (inst.supportsMax10) tags.push('Suporta MAX 10');
            console.log(`  - Versão: ${inst.version.padEnd(20)} [${tags.join(', ')}]`);
            console.log(`    Diretório: ${inst.binDir}`);
        }
    }

    console.log('\nFerramenta de Compilação Selecionada:');
    if (compiler) {
        console.log(`  Versão: ${compiler.version} (CDB: ${path.basename(compiler.cdb)}, ASM: ${path.basename(compiler.asm)})`);
        if (!compiler.supportsMax10) {
            console.log('  [ALERTA] Esta versão (< 15.0) não possui suporte nativo à família MAX 10 do DE10-Lite.');
        }
    } else {
        console.log('  Nenhum compilador com suporte MAX 10 detectado nesta máquina.');
    }

    console.log('\nFerramenta de Gravação (Programmer) Selecionada:');
    if (programmer) {
        console.log(`  Versão: ${programmer.version} (${programmer.pgm})`);
        const cables = listJtagCables(programmer.pgm);
        console.log(`  Cabos JTAG Detectados: ${cables.length > 0 ? cables.join(', ') : 'Nenhum cabo conectado no momento.'}`);
    } else {
        console.log('  Nenhum gravador JTAG detectado.');
    }
    console.log('='.repeat(70));
}

module.exports = {
    findQuartusInstallations,
    getBestToolchain,
    listJtagCables,
    updateMif,
    runAssembler,
    programFpga,
    findNiosCommandShell,
    downloadNiosFirmware,
    runPipeline
};
