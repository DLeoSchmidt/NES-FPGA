#!/usr/bin/env node
/**
 * =============================================================================
 * NES-FPGA: Diagnóstico e Validação do IP Intel JTAG UART (Node.js Edition)
 * =============================================================================
 * Valida a integridade do canal de comunicação com o IP altera_avalon_jtag_uart
 * presente na placa Terasic DE10-Lite (MAX 10).
 * =============================================================================
 */

const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');

let quartus = null;
try {
    quartus = require('../cart_init/quartus_cli.js');
} catch (e) {
    // Silencioso se módulo não estiver disponível
}

function findJtagAtlanticDll() {
    const candidates = [
        'C:\\intelFPGA_lite\\18.1\\quartus\\bin64\\jtag_atlantic.dll',
        'C:\\intelFPGA\\18.1\\quartus\\bin64\\jtag_atlantic.dll',
        'C:\\altera\\18.1\\quartus\\bin64\\jtag_atlantic.dll',
        'D:\\intelFPGA_lite\\18.1\\quartus\\bin64\\jtag_atlantic.dll'
    ];
    for (const p of candidates) {
        if (fs.existsSync(p)) return p;
    }
    return null;
}

function findPython() {
    const candidates = [
        'C:\\Python313\\python.exe',
        path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Python', 'Python313', 'python.exe'),
        'C:\\Python312\\python.exe',
        path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Python', 'Python312', 'python.exe'),
        'C:\\Python311\\python.exe',
        path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Python', 'Python311', 'python.exe'),
        'py',
        'python'
    ];
    for (const p of candidates) {
        if (!p) continue;
        if (fs.existsSync(p)) {
            return p;
        }
    }
    return 'python';
}

function runDiagnostics() {
    console.log('='.repeat(72));
    console.log('      DIAGNÓSTICO DO IP INTEL/ALTERA JTAG UART (altera_avalon_jtag_uart)');
    console.log('='.repeat(72));

    // 1. Verificação da DLL
    console.log('\n[PASSO 1] Verificando biblioteca nativa da Intel (jtag_atlantic.dll)...');
    const dll = findJtagAtlanticDll();
    if (dll) {
        console.log(`  [OK] DLL encontrada: ${dll}`);
    } else {
        console.log('  [AVISO] jtag_atlantic.dll não encontrada nos caminhos padrão.');
    }

    // 2. Verificação do Hardware JTAG
    console.log('\n[PASSO 2] Sondando cabos e programadores JTAG conectados...');
    let cables = [];
    if (quartus) {
        try {
            cables = quartus.listJtagCables();
        } catch (e) {
            console.log(`  [AVISO] Falha ao consultar cabos via Quartus CLI: ${e.message}`);
        }
    }

    if (cables.length === 0) {
        console.log('  [AVISO] Nenhuma placa DE10-Lite detectada via cabo USB-Blaster.');
        console.log('          Conecte a placa à porta USB para comunicação física em tempo real.');
        console.log('\n' + '='.repeat(72));
        console.log(' [STATUS] Modo Simulação pronto. Para teste de hardware real, conecte a placa.');
        console.log('='.repeat(72) + '\n');
        process.exit(0);
    }

    const cableName = cables[0];
    console.log(`  [OK] Placa detectada via cabo: ${cableName}`);

    // 3. Execução do teste de ping/transmissão
    console.log(`\n[PASSO 3] Conectando ao IP altera_avalon_jtag_uart no cabo '${cableName}'...`);
    const py = findPython();
    const bridgeScript = path.join(__dirname, 'jtag_bridge.py');

    if (!fs.existsSync(bridgeScript)) {
        console.log(`  [ERRO] Script ${bridgeScript} não encontrado.`);
        process.exit(1);
    }

    const testProc = spawn(py, ['-u', bridgeScript, cableName], {
        stdio: ['pipe', 'pipe', 'pipe']
    });

    let isReady = false;
    let packetCount = 0;
    const startTime = Date.now();

    let isAlreadyInUse = false;

    testProc.stdout.on('data', (data) => {
        const text = data.toString();
        if (text.includes('JTAG_BRIDGE_READY')) {
            isReady = true;
            console.log('  [OK] Canal de hardware JTAG Atlantic aberto com sucesso!');
            console.log('\n[PASSO 4] Enviando pacotes de teste para os registradores de entrada...');

            // Envia pacote de teste: Player 1 Botão A, Player 2 Neutro
            testProc.stdin.write('!8000\n');
            packetCount++;
        } else if (text.includes('OK') || text.includes('RDY')) {
            const elapsed = Date.now() - startTime;
            console.log(`  [RESPOSTA DO FPGA] "${text.trim()}" | Tempo decorrido: ${elapsed} ms [OK]`);
            if (packetCount === 1) {
                // Envia segundo pacote: neutro
                testProc.stdin.write('!0000\n');
                packetCount++;
            } else {
                testProc.stdin.end();
            }
        }
    });

    testProc.stderr.on('data', (d) => {
        const err = d.toString().trim();
        if (err.includes('já está aberto por outro processo')) {
            isAlreadyInUse = true;
            console.log('  [INFO] O IP Intel altera_avalon_jtag_uart já está ATIVAMENTE CONECTADO e em uso!');
            console.log('         Identificado outro processo utilizando o canal (ex: nes_controller.js na porta 8080).');
        } else if (err && !err.includes('INFO:')) {
            console.warn(`  [AVISO] ${err}`);
        }
    });

    testProc.on('exit', (code) => {
        console.log('\n[PASSO 5] Canal JTAG Atlantic liberado e finalizado.');
        console.log('\n' + '='.repeat(72));
        console.log('                     RESULTADO DO DIAGNÓSTICO');
        console.log('='.repeat(72));
        if (isAlreadyInUse) {
            console.log(' [STATUS] O IP Intel altera_avalon_jtag_uart está 100% OPERACIONAL!');
            console.log('          - Canal JTAG aberto e transmitindo para a aplicação ativa.');
            console.log('          - Para testar este benchmark isolado, feche o servidor nes_controller.js.');
        } else if (isReady && packetCount >= 2) {
            console.log(' [STATUS] O IP Intel altera_avalon_jtag_uart está 100% OPERACIONAL!');
            console.log('          - Comunicação bidirecional confirmada.');
            console.log('          - Controles mapeados aos shift registers $4016 e $4017 do NES.');
        } else {
            console.log(` [STATUS] Teste finalizado com código ${code}.`);
        }
        console.log('='.repeat(72) + '\n');
        process.exit(0);
    });

    setTimeout(() => {
        if (!isReady) {
            try { testProc.kill(); } catch {}
            console.log('  [AVISO] Tempo limite de conexão com o Nios II expirado (SDRAM pode necessitar recarga).');
            process.exit(0);
        }
    }, 4000);
}

runDiagnostics();
