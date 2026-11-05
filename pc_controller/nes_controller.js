#!/usr/bin/env node
/**
 * NES-FPGA Dual Controller PC Bridge (Node.js Edition & WebSocket Server)
 * ======================================================================
 * Permite controlar 2 jogadores independentes (Player 1 e Player 2) no NES-FPGA.
 * Transmite o frame de 3 bytes [0x5A, mask_p1, mask_p2] via JTAG UART (nios2-terminal).
 * 
 * Servidor Web nativo na porta 8080 para a interface HTML5.
 * Zero dependências externas (100% bibliotecas padrão do Node.js).
 */

const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
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
const HTTP_PORT  = 8080;

/** @type {import('child_process').ChildProcessWithoutNullStreams | null} */
let niosProcess = null;
let currentP1Mask = 0;
let currentP2Mask = 0;
const wsClients = new Set();

/**
 * Localiza o executável nios2-terminal nos caminhos comuns de instalação da Altera/Intel.
 */
function findNiosTerminal() {
    const defaultRoots = [
        'C:\\altera',
        'C:\\intelFPGA',
        'C:\\intelFPGA_lite',
        process.env.QUARTUS_ROOTDIR || ''
    ];

    for (const root of defaultRoots) {
        if (!root || !fs.existsSync(root)) continue;
        try {
            const findRecursive = (dir, depth = 0) => {
                if (depth > 5) return null;
                const entries = fs.readdirSync(dir, { withFileTypes: true });
                for (const entry of entries) {
                    const fullPath = path.join(dir, entry.name);
                    if (entry.isDirectory()) {
                        const found = findRecursive(fullPath, depth + 1);
                        if (found) return found;
                    } else if (entry.name.toLowerCase() === 'nios2-terminal.exe' || entry.name.toLowerCase() === 'nios2-terminal') {
                        return fullPath;
                    }
                }
                return null;
            };
            const found = findRecursive(root);
            if (found) return found;
        } catch {
            // Ignora pastas protegidas
        }
    }
    return 'nios2-terminal';
}

function initNiosBridge() {
    const cmd = findNiosTerminal();
    console.log(`[BRIDGE] Conectando ao FPGA via: ${cmd}`);

    try {
        niosProcess = spawn(cmd, [], {
            stdio: ['pipe', 'pipe', 'pipe'],
            windowsHide: true
        });

        niosProcess.on('error', (err) => {
            console.warn(`[AVISO] nios2-terminal não pôde ser iniciado (${err.message}).`);
            console.warn(`[AVISO] Servidor ativo em modo de simulação/Web.`);
            niosProcess = null;
        });

        niosProcess.on('exit', (code) => {
            console.log(`[BRIDGE] nios2-terminal finalizado com código ${code}`);
            niosProcess = null;
        });

        console.log(`[BRIDGE] Canal JTAG UART preparado.`);
    } catch (e) {
        console.warn(`[AVISO] Falha ao instanciar nios2-terminal: ${e.message}`);
        niosProcess = null;
    }
}

/**
 * Transmite o frame de 3 bytes [0x5A, mask_p1, mask_p2] para o FPGA.
 */
function sendDualMaskToFPGA(p1, p2) {
    currentP1Mask = p1 & 0xFF;
    currentP2Mask = p2 & 0xFF;

    if (niosProcess && niosProcess.stdin && !niosProcess.stdin.destroyed) {
        const packet = Buffer.from([SYNC_BYTE, currentP1Mask, currentP2Mask]);
        niosProcess.stdin.write(packet);
    }

    // Sincroniza todos os clientes Web conectados
    const statusPayload = JSON.stringify({ type: 'state2', p1: currentP1Mask, p2: currentP2Mask });
    for (const ws of wsClients) {
        sendWsText(ws, statusPayload);
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

const server = http.createServer((req, res) => {
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
            isFullyAutomated: toolchain.isFullyAutomated
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
        const doFlash = parsedUrl.searchParams.get('flash') === '1' || parsedUrl.searchParams.get('flash') === 'true';

        if (!slug) {
            res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ success: false, error: 'Parâmetro slug ausente.' }));
            return;
        }
        try {
            switcher.switchGame(slug, { flash: doFlash });
            const active = switcher.getActiveGame();
            broadcastWsText(JSON.stringify({ type: 'game_changed', active }));
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ success: true, active, flashed: doFlash }));
        } catch (err) {
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

    sendWsText(socket, JSON.stringify({ type: 'state2', p1: currentP1Mask, p2: currentP2Mask }));

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
    console.log(` [WEB] Servidor Web ativo: http://localhost:${HTTP_PORT}`);
    console.log(' [P1 - Teclado Console] WASD (Dir) | K (A) | J (B) | Enter (Start) | U (Sel)');
    console.log(' [P2 - Teclado Console] Setas (Dir) | X (A) | Z (B) | Numpad5 | Numpad4');
    console.log(' [SAIR] Ctrl+C ou ESC');
    console.log('='.repeat(70) + '\n');

    let keyReleaseTimer = null;

    process.stdin.on('keypress', (str, key) => {
        if (!key) return;

        if ((key.ctrl && key.name === 'c') || key.name === 'escape') {
            sendDualMaskToFPGA(0, 0);
            if (niosProcess) niosProcess.kill();
            process.exit(0);
        }

        let p1 = currentP1Mask;
        let p2 = currentP2Mask;

        // Mapeamento P1
        if (key.name === 'w') p1 |= BTN_UP;
        else if (key.name === 's') p1 |= BTN_DOWN;
        else if (key.name === 'a') p1 |= BTN_LEFT;
        else if (key.name === 'd') p1 |= BTN_RIGHT;
        else if (key.name === 'k') p1 |= BTN_A;
        else if (key.name === 'j') p1 |= BTN_B;
        else if (key.name === 'return') p1 |= BTN_START;
        else if (key.name === 'u') p1 |= BTN_SELECT;

        // Mapeamento P2
        if (key.name === 'up') p2 |= BTN_UP;
        else if (key.name === 'down') p2 |= BTN_DOWN;
        else if (key.name === 'left') p2 |= BTN_LEFT;
        else if (key.name === 'right') p2 |= BTN_RIGHT;
        else if (key.name === 'x') p2 |= BTN_A;
        else if (key.name === 'z') p2 |= BTN_B;

        sendDualMaskToFPGA(p1, p2);
        renderConsoleStatus(p1, p2);

        clearTimeout(keyReleaseTimer);
        keyReleaseTimer = setTimeout(() => {
            sendDualMaskToFPGA(0, 0);
            renderConsoleStatus(0, 0);
        }, 120);
    });
}

function renderConsoleStatus(p1, p2) {
    const s = (mask, btn, name) => `${name}:${(mask & btn) ? 'ON ' : 'OFF'}`;
    const txt = `\r[P1: ${s(p1, BTN_UP, 'U')}${s(p1, BTN_DOWN, 'D')}${s(p1, BTN_LEFT, 'L')}${s(p1, BTN_RIGHT, 'R')} | A:${p1&BTN_A?'1':'0'} B:${p1&BTN_B?'1':'0'}] [P2: ${s(p2, BTN_UP, 'U')}${s(p2, BTN_DOWN, 'D')}${s(p2, BTN_LEFT, 'L')}${s(p2, BTN_RIGHT, 'R')} | A:${p2&BTN_A?'1':'0'} B:${p2&BTN_B?'1':'0'}]`;
    process.stdout.write(txt);
}

initNiosBridge();
server.listen(HTTP_PORT, () => {
    setupTerminalKeyboard();
});
