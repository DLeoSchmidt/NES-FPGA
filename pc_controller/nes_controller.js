#!/usr/bin/env node
/**
 * NES-FPGA Dual Controller PC Bridge (Node.js Edition & WebSocket Server)
 * ======================================================================
 * Permite controlar 2 jogadores independentes (Player 1 e Player 2) no NES-FPGA.
 * Transmite o frame de 3 bytes [0x5A, mask_p1, mask_p2] via JTAG UART (nios2-terminal)
 * ou via porta Serial RS-232 / DB9.
 * 
 * Servidor Web nativo na porta 8080 para a interface HTML5.
 * Zero dependências externas (100% bibliotecas nativas do Node.js).
 */

const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');
const readline = require('readline');

// Integração com o Switch Game e Automação do Quartus CLI
let switcher = null;
let quartus = null;
try {
    switcher = require('../cart_init/switch_game.js');
} catch (e) {
    console.warn('[AVISO] Módulo switch_game.js não pôde ser carregado:', e.message);
}
try {
    quartus = require('../cart_init/quartus_cli.js');
} catch (e) {
    console.warn('[AVISO] Módulo quartus_cli.js não pôde ser carregado:', e.message);
}

// Constantes de Máscara de Bits (NES)
const BTN_RIGHT  = 1 << 0;
const BTN_LEFT   = 1 << 1;
const BTN_DOWN   = 1 << 2;
const BTN_UP     = 1 << 3;
const BTN_START  = 1 << 4;
const BTN_SELECT = 1 << 5;
const BTN_B      = 1 << 6;
const BTN_A      = 1 << 7;

const SYNC_BYTE  = 0x5A;
const HTTP_PORT  = parseInt(process.env.PORT, 10) || 8080;

/** @type {import('child_process').ChildProcessWithoutNullStreams | null} */
let niosProcess = null;
let currentCableName = null;
let isFpgaConnected = false;
let niosBridgeActive = false;
let isFlashing = false;
let reconnectTimer = null;
let hasFirmwareLoaded = false;

let currentP1Mask = 0;
let currentP2Mask = 0;
const wsClients = new Set();

/**
 * Localiza o executável nios2-terminal nos caminhos de instalação da Altera/Intel,
 * priorizando estritamente as instalações da versão 18.1 (compatíveis com o MAX 10).
 */
function findNiosTerminal() {
    // 1. Caminhos diretos conhecidos da versão 18.1 (prioridade máxima absoluta)
    const priorityPaths = [
        'C:\\intelFPGA_lite\\18.1\\quartus\\bin64\\nios2-terminal.exe',
        'C:\\intelFPGA\\18.1\\quartus\\bin64\\nios2-terminal.exe',
        'C:\\altera\\18.1\\quartus\\bin64\\nios2-terminal.exe',
        'C:\\intelFPGA_lite\\18.1\\nios2eds\\bin\\nios2-terminal.exe',
        'C:\\intelFPGA\\18.1\\nios2eds\\bin\\nios2-terminal.exe',
        'D:\\intelFPGA_lite\\18.1\\quartus\\bin64\\nios2-terminal.exe',
        'D:\\intelFPGA\\18.1\\quartus\\bin64\\nios2-terminal.exe',
        'E:\\intelFPGA_lite\\18.1\\quartus\\bin64\\nios2-terminal.exe'
    ];

    for (const p of priorityPaths) {
        if (fs.existsSync(p)) {
            return p;
        }
    }

    // 2. Raízes expandidas para busca dinâmica profunda
    const defaultRoots = [
        process.env.QUARTUS_ROOTDIR,
        process.env.SOPC_KIT_NIOS2,
        'C:\\intelFPGA_lite\\18.1',
        'C:\\intelFPGA\\18.1',
        'C:\\altera\\18.1',
        'C:\\intelFPGA_lite',
        'C:\\intelFPGA',
        'C:\\intelFPGA_pro',
        'C:\\altera',
        'D:\\intelFPGA_lite\\18.1',
        'D:\\intelFPGA\\18.1',
        'D:\\intelFPGA_lite',
        'D:\\intelFPGA',
        'D:\\altera',
        'E:\\intelFPGA_lite\\18.1',
        'E:\\intelFPGA_lite',
        'E:\\altera'
    ].filter(Boolean);

    const candidates = [];

    for (const root of defaultRoots) {
        if (!fs.existsSync(root)) continue;
        try {
            const findRecursive = (dir, depth = 0) => {
                if (depth > 5) return;
                const entries = fs.readdirSync(dir, { withFileTypes: true });
                for (const entry of entries) {
                    const fullPath = path.join(dir, entry.name);
                    if (entry.isDirectory()) {
                        findRecursive(fullPath, depth + 1);
                    } else if (entry.name.toLowerCase() === 'nios2-terminal.exe' || entry.name.toLowerCase() === 'nios2-terminal') {
                        candidates.push(fullPath);
                    }
                }
            };
            findRecursive(root);
        } catch {
            // Ignora pastas protegidas ou erros de permissão
        }
    }

    if (candidates.length > 0) {
        candidates.sort((a, b) => {
            const a18 = a.includes('18.1') ? 1 : 0;
            const b18 = b.includes('18.1') ? 1 : 0;
            return b18 - a18;
        });
        return candidates[0];
    }

    return 'nios2-terminal';
}

// Gerenciador de Comunicação Serial RS-232 / DB9 (Nativo Windows)
let serialBridgeProcess = null;
let serialPortConfig = null;

// Parseia argumentos CLI: --serial COM1 --baud 115200
for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i].toLowerCase();
    if ((arg === '--serial' || arg === '-s') && process.argv[i + 1]) {
        serialPortConfig = {
            port: process.argv[++i].toUpperCase(),
            baud: 115200
        };
    } else if (arg.startsWith('--serial=')) {
        serialPortConfig = {
            port: arg.split('=')[1].toUpperCase(),
            baud: 115200
        };
    } else if ((arg === '--baud' || arg === '-b') && process.argv[i + 1]) {
        if (serialPortConfig) serialPortConfig.baud = parseInt(process.argv[++i], 10) || 115200;
    }
}

/**
 * Lista as portas seriais COM disponíveis no sistema Windows.
 */
function listAvailableSerialPorts() {
    try {
        const out = execSync('powershell -NoProfile -Command "[System.IO.Ports.SerialPort]::GetPortNames()"', { encoding: 'utf-8', timeout: 3000 });
        return out.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    } catch {
        return [];
    }
}

/**
 * Inicializa a ponte de comunicação Serial RS-232 (conector DB9 / conversor USB-Serial).
 */
function initSerialBridge(portName, baudRate = 115200) {
    if (!portName) return;

    if (serialBridgeProcess) {
        try { serialBridgeProcess.kill(); } catch {}
        serialBridgeProcess = null;
    }

    console.log(`[SERIAL] Inicializando conector Serial DB9 / RS-232 em ${portName} a ${baudRate} bps...`);

    try {
        const psScript = `
            try {
                $p = New-Object System.IO.Ports.SerialPort("${portName}", ${baudRate}, [System.IO.Ports.Parity]::None, 8, [System.IO.Ports.StopBits]::One)
                $p.Handshake = [System.IO.Ports.Handshake]::None
                $p.WriteTimeout = 500
                $p.Open()
                [Console]::Error.WriteLine("[SERIAL_OK]")
                $stream = [Console]::OpenStandardInput()
                $buf = New-Object byte[] 3
                while ($true) {
                    $read = $stream.Read($buf, 0, 3)
                    if ($read -le 0) { break }
                    $p.Write($buf, 0, $read)
                }
            } catch {
                [Console]::Error.WriteLine("[SERIAL_ERR]: " + $_.Exception.Message)
            } finally {
                if ($p -and $p.IsOpen) { $p.Close() }
            }
        `;

        serialBridgeProcess = spawn('powershell', ['-NoProfile', '-Command', psScript], {
            stdio: ['pipe', 'pipe', 'pipe'],
            windowsHide: true
        });

        serialBridgeProcess.stderr.on('data', (d) => {
            const msg = d.toString();
            if (msg.includes('[SERIAL_OK]')) {
                console.log(`[SERIAL] [OK] Conectado com sucesso à porta Serial DB9 (${portName})!`);
                broadcastHardwareStatus();
            } else if (msg.includes('[SERIAL_ERR]')) {
                console.warn(`[SERIAL] Erro na porta serial ${portName}: ${msg.trim()}`);
            }
        });

        serialBridgeProcess.on('exit', () => {
            console.log(`[SERIAL] Ponte serial em ${portName} finalizada.`);
            serialBridgeProcess = null;
            broadcastHardwareStatus();
        });

        serialPortConfig = { port: portName, baud: baudRate };
    } catch (e) {
        console.warn(`[SERIAL] Falha ao iniciar porta serial ${portName}: ${e.message}`);
        serialBridgeProcess = null;
    }
}

/**
 * Encerra com segurança a conexão JTAG UART com o FPGA para liberar a porta JTAG.
 */
function stopNiosBridge() {
    if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
    }

    if (niosProcess) {
        const pid = niosProcess.pid;
        try {
            niosProcess.stdin.end();
            niosProcess.kill('SIGKILL');
        } catch {}
        niosProcess = null;

        if (process.platform === 'win32' && pid) {
            try {
                execSync(`taskkill /F /T /PID ${pid}`, { stdio: 'ignore', timeout: 2000 });
            } catch {}
        }
    }

    // Garante que nenhum processo residual do nios2-terminal retenha a DLL jtag_atlantic
    if (process.platform === 'win32') {
        try {
            execSync('taskkill /F /IM nios2-terminal.exe', { stdio: 'ignore', timeout: 2000 });
        } catch {}
    }

    niosBridgeActive = false;
    broadcastHardwareStatus();
}

/**
 * Inicia a ponte de comunicação JTAG UART com o processador Nios II na placa DE10-Lite.
 */
function startNiosBridge() {
    if (isFlashing) return;
    if (niosProcess) return;

    // 1. Detecta se a placa DE10-Lite está conectada via cabo JTAG USB-Blaster
    let cables = [];
    if (quartus) {
        try {
            cables = quartus.listJtagCables();
        } catch (e) {
            console.warn('[BRIDGE] Aviso ao listar cabos JTAG:', e.message);
        }
    }

    if (cables.length === 0) {
        if (isFpgaConnected) {
            console.log('[HARDWARE] [AVISO] Placa DE10-Lite foi desconectada. Modo Simulação ativo.');
        }
        isFpgaConnected = false;
        hasFirmwareLoaded = false;
        currentCableName = null;
        niosBridgeActive = false;
        broadcastHardwareStatus();
        scheduleNiosReconnect(3000);
        return;
    }

    isFpgaConnected = true;
    currentCableName = cables[0];

    // Garante liberação de instâncias anteriores na porta JTAG
    if (process.platform === 'win32') {
        try {
            execSync('taskkill /F /IM nios2-terminal.exe', { stdio: 'ignore', timeout: 2000 });
        } catch {}
    }

    // Auto-carregamento do firmware Nios II na SDRAM volátil (caso ainda não carregado)
    if (!hasFirmwareLoaded && quartus) {
        console.log(`[BRIDGE] Inicializando firmware Nios II na SDRAM via '${currentCableName}'...`);
        try {
            const ok = quartus.downloadNiosFirmware(currentCableName);
            if (ok) {
                hasFirmwareLoaded = true;
                console.log('[BRIDGE] [OK] Firmware Nios II ativo na SDRAM!');
            }
        } catch (e) {
            console.warn('[BRIDGE] Aviso ao inicializar firmware Nios II:', e.message);
        }
    }

    const cmd = findNiosTerminal();
    console.log(`[HARDWARE] Placa Terasic DE10-Lite detectada via cabo '${currentCableName}'.`);
    console.log(`[BRIDGE] Conectando ao Nios II via JTAG UART (-c "${currentCableName}")...`);

    try {
        const args = ['-c', currentCableName, '--quiet'];
        niosProcess = spawn(cmd, args, {
            stdio: ['pipe', 'pipe', 'pipe'],
            windowsHide: true
        });

        niosBridgeActive = true;

        niosProcess.stdout.on('data', (d) => {
            const lines = d.toString().split(/\r?\n/).filter(Boolean);
            for (const line of lines) {
                console.log(`[NIOS] ${line}`);
            }
        });

        niosProcess.stderr.on('data', (d) => {
            const msg = d.toString().trim();
            // Ignora avisos operacionais comuns do nios2-terminal
            if (msg && !msg.includes('INFO:')) {
                console.warn(`[NIOS STDERR] ${msg}`);
            }
        });

        niosProcess.on('error', (err) => {
            console.warn(`[BRIDGE] nios2-terminal reportou erro (${err.message}).`);
            niosProcess = null;
            niosBridgeActive = false;
            broadcastHardwareStatus();
            scheduleNiosReconnect(3000);
        });

        niosProcess.on('exit', (code) => {
            if (!isFlashing) {
                console.log(`[BRIDGE] Conexão JTAG UART encerrada (código ${code}). Agendando reconexão...`);
            }
            niosProcess = null;
            niosBridgeActive = false;
            broadcastHardwareStatus();
            scheduleNiosReconnect(2500);
        });

        console.log(`[BRIDGE] [OK] Ponte JTAG UART ativa com sucesso! Controles e telemetria sincronizados.`);
        broadcastHardwareStatus();

        // Envia estado inicial dos controles para o Nios II
        sendDualMaskToFPGA(currentP1Mask, currentP2Mask);
    } catch (e) {
        console.warn(`[BRIDGE] Falha ao iniciar nios2-terminal: ${e.message}`);
        niosProcess = null;
        niosBridgeActive = false;
        broadcastHardwareStatus();
        scheduleNiosReconnect(3000);
    }
}

/**
 * Agenda tentativa de reconexão automática com a placa DE10-Lite.
 */
function scheduleNiosReconnect(delayMs = 3000) {
    if (isFlashing) return;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        if (!niosProcess && !isFlashing) {
            startNiosBridge();
        }
    }, delayMs);
}

// Watchdog contínuo de status de hardware (a cada 4 segundos)
setInterval(() => {
    if (isFlashing) return;
    if (!quartus) return;

    try {
        const cables = quartus.listJtagCables();
        const hasCable = cables.length > 0;

        if (hasCable !== isFpgaConnected || (hasCable && cables[0] !== currentCableName)) {
            if (hasCable) {
                console.log(`[HARDWARE] Placa DE10-Lite conectada: '${cables[0]}'`);
                currentCableName = cables[0];
                isFpgaConnected = true;
                if (!niosProcess) startNiosBridge();
            } else {
                console.log('[HARDWARE] Placa DE10-Lite desconectada.');
                currentCableName = null;
                isFpgaConnected = false;
                stopNiosBridge();
            }
            broadcastHardwareStatus();
        }
    } catch {
        // Silencioso em caso de erro transitório no quartus_pgm
    }
}, 4000);

/**
 * Transmite o frame de 3 bytes [0x5A, mask_p1, mask_p2] para o FPGA via:
 *   1. Cabo USB-Blaster (JTAG UART via nios2-terminal)
 *   2. Conector Serial DB9 / RS-232 (se configurado)
 *   3. Interface Web (WebSockets RFC 6455)
 */
function sendDualMaskToFPGA(p1, p2) {
    currentP1Mask = p1 & 0xFF;
    currentP2Mask = p2 & 0xFF;

    // Frame ASCII HEX com terminação de linha: imune a filtragem de caracteres de controle de terminal
    const p1Hex = currentP1Mask.toString(16).padStart(2, '0').toUpperCase();
    const p2Hex = currentP2Mask.toString(16).padStart(2, '0').toUpperCase();
    const asciiFrame = `!${p1Hex}${p2Hex}\n`;

    // 1. Envio JTAG UART (USB-Blaster)
    if (niosProcess && niosProcess.stdin && !niosProcess.stdin.destroyed) {
        try {
            niosProcess.stdin.write(asciiFrame);
        } catch {}
    }

    // 2. Envio Serial DB9 (RS-232)
    if (serialBridgeProcess && serialBridgeProcess.stdin && !serialBridgeProcess.stdin.destroyed) {
        try {
            serialBridgeProcess.stdin.write(asciiFrame);
        } catch {}
    }

    // 3. Sincroniza todos os clientes Web conectados
    const statusPayload = JSON.stringify({ type: 'state2', p1: currentP1Mask, p2: currentP2Mask });
    for (const ws of wsClients) {
        sendWsText(ws, statusPayload);
    }
}

/**
 * Envia o status atual do hardware para todos os clientes Web via WebSocket.
 */
function broadcastHardwareStatus() {
    const payload = JSON.stringify({
        type: 'hardware_status',
        fpgaConnected: isFpgaConnected,
        cableName: currentCableName,
        niosActive: Boolean(niosProcess && niosBridgeActive),
        serialConnected: Boolean(serialBridgeProcess),
        serialPort: serialPortConfig ? serialPortConfig.port : null
    });

    for (const ws of wsClients) {
        sendWsText(ws, payload);
    }
}

// Servidor HTTP Estático
const webDir = path.join(__dirname, 'web');
const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.svg': 'image/svg+xml'
};

function broadcastWsText(text) {
    for (const ws of wsClients) {
        sendWsText(ws, text);
    }
}

const server = http.createServer(async (req, res) => {
    // API REST - Lista de Jogos Compatíveis
    if (req.url === '/api/games') {
        if (!switcher) {
            res.writeHead(503, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Módulo de jogos indisponível' }));
            return;
        }
        const catalog = switcher.loadCatalog();
        const active = switcher.getActiveGame();
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ catalog, active }));
        return;
    }

    // API REST - Recarregar Firmware Nios II na SDRAM sob demanda
    if (req.url === '/api/firmware/reload') {
        if (!quartus) {
            res.writeHead(503, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Módulo quartus_cli indisponível' }));
            return;
        }

        try {
            console.log('[API] Solicitação de recarga do firmware Nios II recebida.');
            isFlashing = true;
            stopNiosBridge();

            // Breve intervalo para liberação completa da porta JTAG
            await new Promise(r => setTimeout(r, 400));

            const cables = quartus.listJtagCables();
            if (cables.length === 0) {
                isFlashing = false;
                res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ success: false, error: 'Nenhum cabo USB-Blaster detectado.' }));
                return;
            }

            const ok = quartus.downloadNiosFirmware(cables[0]);
            isFlashing = false;

            setTimeout(() => {
                startNiosBridge();
            }, 800);

            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({
                success: ok,
                cableName: cables[0],
                message: ok ? 'Firmware Nios II reiniciado na SDRAM com sucesso!' : 'Falha ao baixar firmware via nios2-download.'
            }));
        } catch (err) {
            isFlashing = false;
            scheduleNiosReconnect(1000);
            res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ success: false, error: err.message }));
        }
        return;
    }

    // API REST - Portas Seriais DB9 / RS-232 Disponíveis
    if (req.url === '/api/serial/ports') {
        const ports = listAvailableSerialPorts();
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
            ports,
            active: serialPortConfig,
            connected: Boolean(serialBridgeProcess)
        }));
        return;
    }

    // API REST - Conectar/Desconectar Porta Serial DB9
    if (req.url.startsWith('/api/serial/connect')) {
        const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
        const port = parsedUrl.searchParams.get('port');
        const baud = parseInt(parsedUrl.searchParams.get('baud'), 10) || 115200;

        if (port) {
            initSerialBridge(port, baud);
        } else {
            if (serialBridgeProcess) {
                try { serialBridgeProcess.kill(); } catch {}
                serialBridgeProcess = null;
            }
            serialPortConfig = null;
            broadcastHardwareStatus();
        }

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
            success: true,
            active: serialPortConfig,
            connected: Boolean(serialBridgeProcess)
        }));
        return;
    }

    // API REST - Diagnóstico do Quartus Prime e Cabos JTAG
    if (req.url === '/api/quartus/status') {
        if (!quartus) {
            res.writeHead(503, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Módulo quartus_cli indisponível' }));
            return;
        }
        const toolchain = quartus.getBestToolchain();
        const cables = toolchain.programmer ? quartus.listJtagCables(toolchain.programmer.pgm) : [];
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
            compiler: toolchain.compiler ? {
                version: toolchain.compiler.version,
                path: toolchain.compiler.binDir,
                supportsMax10: toolchain.compiler.supportsMax10
            } : null,
            programmer: toolchain.programmer ? {
                version: toolchain.programmer.version,
                path: toolchain.programmer.pgm
            } : null,
            cables,
            isFullyAutomated: toolchain.isFullyAutomated,
            niosBridgeActive: Boolean(niosProcess && niosBridgeActive)
        }));
        return;
    }

    // API REST - Troca Dinâmica de Jogo MIF e Automação Quartus
    if (req.url.startsWith('/api/switch-game')) {
        if (!switcher) {
            res.writeHead(503, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Módulo de jogos indisponível' }));
            return;
        }
        const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
        const slug = parsedUrl.searchParams.get('slug');
        const rawAction = (parsedUrl.searchParams.get('action') || '').toLowerCase().trim();
        const doFlashParam = parsedUrl.searchParams.get('flash') === '1' || parsedUrl.searchParams.get('flash') === 'true';

        let action = 'mif';
        if (rawAction === 'build') {
            action = 'build';
        } else if (rawAction === 'flash' || doFlashParam) {
            action = 'flash';
        } else if (rawAction === 'mif') {
            action = 'mif';
        }

        if (!slug) {
            res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ success: false, error: 'Parâmetro slug ausente.' }));
            return;
        }

        try {
            const doBuild = action === 'build' || action === 'flash';
            const doFlash = action === 'flash';

            // Durante o Flash, a porta JTAG deve ser temporariamente liberada para o quartus_pgm e nios2-download
            if (doFlash) {
                isFlashing = true;
                stopNiosBridge();
                // Aguarda 400ms para liberação das handles no Windows
                await new Promise(r => setTimeout(r, 400));
            }

            const switchRes = switcher.switchGame(slug, { build: doBuild, flash: doFlash });
            const active = switcher.getActiveGame();
            broadcastWsText(JSON.stringify({ type: 'game_changed', active, action }));

            // Consulta se há cabos JTAG USB-Blaster conectados
            let cables = [];
            let cableConnected = false;
            let cableName = null;
            if (quartus) {
                try {
                    cables = quartus.listJtagCables();
                    cableConnected = Array.isArray(cables) && cables.length > 0;
                    cableName = cableConnected ? cables[0] : null;
                } catch (cableErr) {
                    console.warn('[JTAG] Falha ao verificar cabos:', cableErr.message);
                }
            }

            const pipelineInfo = (switchRes && switchRes.pipeline) || {};
            const sofGenerated = doBuild ? (pipelineInfo.sofGenerated !== undefined ? pipelineInfo.sofGenerated : true) : false;
            const flashed = !!pipelineInfo.flashed;
            const elfDownloaded = !!pipelineInfo.elfDownloaded;

            let message = '';
            if (action === 'mif') {
                message = `Arquivos MIF atualizados para '${active.title}'. Para carregar na FPGA, clique em 'Gerar .SOF' ou 'Gravar na Placa'.`;
            } else if (action === 'build') {
                message = `Bitstream NES.sof gerado com sucesso pelo Quartus Assembler! Pronto para gravação na placa DE10-Lite.`;
            } else if (action === 'flash') {
                if (flashed && cableConnected) {
                    if (elfDownloaded) {
                        message = `Bitstream e firmware Nios II gravados com sucesso na placa DE10-Lite via '${cableName}'! O jogo '${active.title}' e os controles estão ativos.`;
                    } else {
                        message = `Bitstream gravado na placa DE10-Lite via '${cableName}'. O jogo '${active.title}' já está rodando.`;
                    }
                } else if (!cableConnected) {
                    message = `Bitstream NES.sof gerado com sucesso, mas a placa DE10-Lite NÃO foi detectada via USB-Blaster. Conecte o cabo USB da placa e clique em 'Gravar na Placa'.`;
                } else {
                    message = `Bitstream compilado, porém houve aviso na gravação JTAG. Verifique a chave de energia e conexão do cabo USB.`;
                }
            }

            // Retoma a ponte JTAG UART após término do flash
            if (doFlash) {
                isFlashing = false;
                setTimeout(() => {
                    startNiosBridge();
                }, 800);
            }

            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({
                success: true,
                action,
                active,
                mifUpdated: true,
                sofGenerated,
                flashed,
                elfDownloaded,
                cableConnected,
                cableName,
                message,
                pipeline: pipelineInfo
            }));
        } catch (err) {
            console.error(`[ERRO API] /api/switch-game: ${err.message}`);
            if (action === 'flash') {
                isFlashing = false;
                scheduleNiosReconnect(1000);
            }
            res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ success: false, error: err.message }));
        }
        return;
    }

    let reqUrl = req.url === '/' ? '/index.html' : req.url;
    const safePath = path.normalize(reqUrl).replace(/^(\.\.[\/\\])+/, '');
    const filePath = path.join(webDir, safePath);

    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Arquivo não encontrado');
            return;
        }
        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
    });
});

// Servidor WebSocket Nativo (RFC 6455)
server.on('upgrade', (req, socket) => {
    if (req.headers['upgrade'] !== 'websocket') {
        socket.destroy();
        return;
    }

    const clientKey = req.headers['sec-websocket-key'];
    const acceptHash = crypto
        .createHash('sha1')
        .update(clientKey + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
        .digest('base64');

    const headers = [
        'HTTP/1.1 101 Switching Protocols',
        'Upgrade: websocket',
        'Connection: Upgrade',
        `Sec-WebSocket-Accept: ${acceptHash}`
    ];

    socket.write(headers.join('\r\n') + '\r\n\r\n');
    wsClients.add(socket);
    console.log(`[WS] Cliente Web conectado. Total: ${wsClients.size}`);

    // Envia estado atual dos controles e do hardware para o novo cliente
    sendWsText(socket, JSON.stringify({ type: 'state2', p1: currentP1Mask, p2: currentP2Mask }));
    sendWsText(socket, JSON.stringify({
        type: 'hardware_status',
        fpgaConnected: isFpgaConnected,
        cableName: currentCableName,
        niosActive: Boolean(niosProcess && niosBridgeActive),
        serialConnected: Boolean(serialBridgeProcess),
        serialPort: serialPortConfig ? serialPortConfig.port : null
    }));

    if (switcher) {
        const activeGame = switcher.getActiveGame();
        if (activeGame) {
            sendWsText(socket, JSON.stringify({ type: 'game_changed', active: activeGame }));
        }
    }

    let frameBuffer = Buffer.alloc(0);

    socket.on('data', (chunk) => {
        frameBuffer = Buffer.concat([frameBuffer, chunk]);

        while (frameBuffer.length >= 2) {
            const firstByte = frameBuffer[0];
            const secondByte = frameBuffer[1];
            const opcode = firstByte & 0x0F;
            const isMasked = (secondByte & 0x80) !== 0;
            let payloadLen = secondByte & 0x7F;
            let offset = 2;

            if (payloadLen === 126) {
                if (frameBuffer.length < 4) break;
                payloadLen = frameBuffer.readUInt16BE(2);
                offset = 4;
            } else if (payloadLen === 127) {
                if (frameBuffer.length < 10) break;
                payloadLen = Number(frameBuffer.readBigUInt64BE(2));
                offset = 10;
            }

            let maskKey = null;
            if (isMasked) {
                if (frameBuffer.length < offset + 4) break;
                maskKey = frameBuffer.slice(offset, offset + 4);
                offset += 4;
            }

            if (frameBuffer.length < offset + payloadLen) break;

            let payload = frameBuffer.slice(offset, offset + payloadLen);
            frameBuffer = frameBuffer.slice(offset + payloadLen);

            if (isMasked && maskKey) {
                for (let i = 0; i < payload.length; i++) {
                    payload[i] ^= maskKey[i % 4];
                }
            }

            if (opcode === 0x08) {
                socket.end();
                break;
            } else if (opcode === 0x01) {
                try {
                    const data = JSON.parse(payload.toString('utf-8'));
                    if (data.type === 'mask2') {
                        sendDualMaskToFPGA(data.p1 || 0, data.p2 || 0);
                    } else if (data.type === 'mask') {
                        sendDualMaskToFPGA(data.mask || 0, currentP2Mask);
                    }
                } catch {
                    // Ignora pacotes corrompidos
                }
            }
        }
    });

    socket.on('close', () => {
        wsClients.delete(socket);
        console.log(`[WS] Cliente desconectado. Restantes: ${wsClients.size}`);
    });

    socket.on('error', () => {
        wsClients.delete(socket);
    });
});

function sendWsText(socket, text) {
    if (socket.destroyed) return;
    const payload = Buffer.from(text, 'utf-8');
    const len = payload.length;
    let header;

    if (len < 126) {
        header = Buffer.from([0x81, len]);
    } else if (len <= 0xFFFF) {
        header = Buffer.alloc(4);
        header[0] = 0x81;
        header[1] = 126;
        header.writeUInt16BE(len, 2);
    } else {
        header = Buffer.alloc(10);
        header[0] = 0x81;
        header[1] = 127;
        header.writeBigUInt64BE(BigInt(len), 2);
    }

    try {
        socket.write(Buffer.concat([header, payload]));
    } catch {
        // Ignora erros de socket
    }
}

/**
 * Terminal Keyboard: suporta Player 1 e Player 2 no mesmo console
 */
function setupTerminalKeyboard() {
    readline.emitKeypressEvents(process.stdin);
    if (process.stdin.isTTY) {
        process.stdin.setRawMode(true);
    }

    console.log('\n' + '='.repeat(70));
    console.log('       NES-FPGA DUAL CONTROLLER - NODE.JS & WEB BRIDGE SERVER       ');
    console.log('='.repeat(70));
    if (isFpgaConnected) {
        console.log(` [STATUS HARDWARE] Placa DE10-Lite CONECTADA (${currentCableName})`);
        console.log(` [MODO OPERACIONAL] FPGA REAL - Controles e Displays de 7 segmentos ativos`);
    } else {
        console.log(' [STATUS HARDWARE] Nenhuma placa DE10-Lite detectada via USB-Blaster');
        console.log(' [MODO OPERACIONAL] SIMULAÇÃO / WEB - Controles virtuais e teclado ativos');
    }
    console.log(` [WEB] Servidor Web ativo: http://localhost:${HTTP_PORT}`);
    console.log(' [P1 - Teclado Console] WASD (Dir) | K (A) | J (B) | Enter (Start) | U (Sel)');
    console.log(' [P2 - Teclado Console] Setas (Dir) | X (A) | Z (B) | Numpad5 | Numpad4');
    if (serialBridgeProcess) {
        console.log(` [SERIAL] Porta DB9 / RS-232 Ativa: ${serialPortConfig.port}`);
    }
    console.log(' [SAIR] Ctrl+C ou ESC');
    console.log('='.repeat(70) + '\n');

    const activeTimers = new Map();

    const triggerKey = (keyId, player, bitMask) => {
        if (player === 'p1') currentP1Mask |= bitMask;
        else currentP2Mask |= bitMask;

        sendDualMaskToFPGA(currentP1Mask, currentP2Mask);
        renderConsoleStatus(currentP1Mask, currentP2Mask);

        if (activeTimers.has(keyId)) {
            clearTimeout(activeTimers.get(keyId));
        }

        // Janela de 450ms: cobre o intervalo do repeat-delay do Windows (250-400ms).
        // Enquanto o usuário segura a tecla, os caracteres repetidos renovam este timer.
        const timer = setTimeout(() => {
            if (player === 'p1') currentP1Mask &= ~bitMask;
            else currentP2Mask &= ~bitMask;
            activeTimers.delete(keyId);
            sendDualMaskToFPGA(currentP1Mask, currentP2Mask);
            renderConsoleStatus(currentP1Mask, currentP2Mask);
        }, 450);

        activeTimers.set(keyId, timer);
    };

    process.stdin.on('keypress', (str, key) => {
        if (!key) return;

        if ((key.ctrl && key.name === 'c') || key.name === 'escape') {
            for (const timer of activeTimers.values()) clearTimeout(timer);
            activeTimers.clear();
            sendDualMaskToFPGA(0, 0);
            stopNiosBridge();
            if (serialBridgeProcess) {
                try { serialBridgeProcess.kill(); } catch {}
            }
            process.exit(0);
        }

        // Mapeamento P1
        if (key.name === 'w') triggerKey('p1_w', 'p1', BTN_UP);
        else if (key.name === 's') triggerKey('p1_s', 'p1', BTN_DOWN);
        else if (key.name === 'a') triggerKey('p1_a', 'p1', BTN_LEFT);
        else if (key.name === 'd') triggerKey('p1_d', 'p1', BTN_RIGHT);
        else if (key.name === 'k') triggerKey('p1_k', 'p1', BTN_A);
        else if (key.name === 'j') triggerKey('p1_j', 'p1', BTN_B);
        else if (key.name === 'return') triggerKey('p1_ret', 'p1', BTN_START);
        else if (key.name === 'u') triggerKey('p1_u', 'p1', BTN_SELECT);

        // Mapeamento P2
        if (key.name === 'up') triggerKey('p2_up', 'p2', BTN_UP);
        else if (key.name === 'down') triggerKey('p2_down', 'p2', BTN_DOWN);
        else if (key.name === 'left') triggerKey('p2_left', 'p2', BTN_LEFT);
        else if (key.name === 'right') triggerKey('p2_right', 'p2', BTN_RIGHT);
        else if (key.name === 'x') triggerKey('p2_x', 'p2', BTN_A);
        else if (key.name === 'z') triggerKey('p2_z', 'p2', BTN_B);
    });
}

function renderConsoleStatus(p1, p2) {
    const s = (mask, btn, name) => `${name}:${(mask & btn) ? 'ON ' : 'OFF'}`;
    const txt = `\r[P1: ${s(p1, BTN_UP, 'U')}${s(p1, BTN_DOWN, 'D')}${s(p1, BTN_LEFT, 'L')}${s(p1, BTN_RIGHT, 'R')} | A:${p1&BTN_A?'1':'0'} B:${p1&BTN_B?'1':'0'}] [P2: ${s(p2, BTN_UP, 'U')}${s(p2, BTN_DOWN, 'D')}${s(p2, BTN_LEFT, 'L')}${s(p2, BTN_RIGHT, 'R')} | A:${p2&BTN_A?'1':'0'} B:${p2&BTN_B?'1':'0'}]`;
    process.stdout.write(txt);
}

// Inicialização da Ponte e Servidor Web
startNiosBridge();

if (serialPortConfig && serialPortConfig.port) {
    initSerialBridge(serialPortConfig.port, serialPortConfig.baud);
}

server.listen(HTTP_PORT, () => {
    setupTerminalKeyboard();
});
