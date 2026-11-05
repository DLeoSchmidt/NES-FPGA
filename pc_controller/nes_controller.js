#!/usr/bin/env node
/**
 * NES-FPGA PC Controller (Node.js Edition & WebSocket Bridge Server)
 * ================================================================
 * Permite controlar o emulador de NES no FPGA de duas formas simultâneas:
 *   1. Diretamente pelo Terminal do Node.js (Raw keyboard events).
 *   2. Como Servidor HTTP/WebSocket local (porta 8080) para a interface Web.
 * 
 * Transmite pacotes binários [0x5A, mask] via JTAG UART (nios2-terminal).
 * 
 * Dependências: ZERO! Utiliza 100% módulos nativos do Node.js (http, crypto, fs, path, child_process).
 */

const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const readline = require('readline');

// Constantes do Protocolo do Controle NES (Máscara de 8 bits)
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
let currentMask = 0;
const wsClients = new Set();

/**
 * Localiza o executável nios2-terminal nos caminhos comuns de instalação da Altera/Intel.
 * @returns {string} Caminho do executável ou comando padrão.
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

/**
 * Inicializa a comunicação com a interface JTAG UART através do nios2-terminal.
 */
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
            console.warn(`[AVISO] O servidor continuará em modo de simulação / monitor de eventos.`);
            niosProcess = null;
        });

        niosProcess.stdout.on('data', (data) => {
            // Repassa logs ou mensagens do Nios II se necessário
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
 * Transmite a máscara de 8 bits do controle NES para o FPGA.
 * @param {number} mask 
 */
function sendMaskToFPGA(mask) {
    currentMask = mask & 0xFF;
    if (niosProcess && niosProcess.stdin && !niosProcess.stdin.destroyed) {
        const packet = Buffer.from([SYNC_BYTE, currentMask]);
        niosProcess.stdin.write(packet);
    }

    // Notifica todos os clientes WebSocket conectados para sincronização visual
    const statusPayload = JSON.stringify({ type: 'state', mask: currentMask });
    for (const ws of wsClients) {
        sendWsText(ws, statusPayload);
    }
}

/**
 * Servidor HTTP para servir a aplicação Web estática (web/index.html, etc.)
 */
const webDir = path.join(__dirname, 'web');

const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
    let reqUrl = req.url === '/' ? '/index.html' : req.url;
    // Sanitização de caminho contra Directory Traversal
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

/**
 * Implementação RFC 6455 de WebSocket Nativo (Zero dependências externas)
 */
server.on('upgrade', (req, socket, head) => {
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
    console.log(`[WS] Novo cliente Web conectado. Total: ${wsClients.size}`);

    // Envia estado atual para o novo cliente
    sendWsText(socket, JSON.stringify({ type: 'state', mask: currentMask }));

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

            if (frameBuffer.length < offset + payloadLen) break; // Frame incompleto

            let payload = frameBuffer.slice(offset, offset + payloadLen);
            frameBuffer = frameBuffer.slice(offset + payloadLen);

            if (isMasked && maskKey) {
                for (let i = 0; i < payload.length; i++) {
                    payload[i] ^= maskKey[i % 4];
                }
            }

            // Tratamento de Opcode
            if (opcode === 0x08) {
                // Close frame
                socket.end();
                break;
            } else if (opcode === 0x01) {
                // Text frame
                const message = payload.toString('utf-8');
                try {
                    const data = JSON.parse(message);
                    if (data.type === 'mask' && typeof data.mask === 'number') {
                        sendMaskToFPGA(data.mask);
                    }
                } catch {
                    // Ignora pacotes JSON inválidos
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

/**
 * Envia um frame de texto WebSocket para o socket especificado.
 * @param {import('net').Socket} socket 
 * @param {string} text 
 */
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
        // Ignora erros de socket fechado
    }
}

/**
 * Mapeamento e Captura de Teclas Interativas no Terminal do Node.js
 */
function setupTerminalKeyboard() {
    readline.emitKeypressEvents(process.stdin);
    if (process.stdin.isTTY) {
        process.stdin.setRawMode(true);
    }

    console.log('\n' + '='.repeat(68));
    console.log('       NES-FPGA CONTROLLER - NODE.JS & WEB BRIDGE SERVER       ');
    console.log('='.repeat(68));
    console.log(` [WEB] Servidor Web ativo: http://localhost:${HTTP_PORT}`);
    console.log(' [TERMINAL] Teclas disponíveis neste console:');
    console.log('   W / S / A / D : Cima / Baixo / Esquerda / Direita');
    console.log('   K / J         : Botão A / Botão B');
    console.log('   Enter / U     : Start / Select');
    console.log('   Ctrl+C ou ESC : Sair');
    console.log('='.repeat(68) + '\n');

    let keyReleaseTimer = null;

    process.stdin.on('keypress', (str, key) => {
        if (!key) return;

        // Saída segura
        if (key.ctrl && key.name === 'c' || key.name === 'escape') {
            sendMaskToFPGA(0);
            if (niosProcess) niosProcess.kill();
            process.exit(0);
        }

        let newMask = currentMask;

        switch (key.name) {
            case 'w': case 'up':    newMask |= BTN_UP; break;
            case 's': case 'down':  newMask |= BTN_DOWN; break;
            case 'a': case 'left':  newMask |= BTN_LEFT; break;
            case 'd': case 'right': newMask |= BTN_RIGHT; break;
            case 'k':               newMask |= BTN_A; break;
            case 'j':               newMask |= BTN_B; break;
            case 'return':          newMask |= BTN_START; break;
            case 'u':               newMask |= BTN_SELECT; break;
        }

        sendMaskToFPGA(newMask);
        renderConsoleStatus(currentMask);

        // Limpa o estado após 120ms se não houver nova repetição de tecla (simula keyup)
        clearTimeout(keyReleaseTimer);
        keyReleaseTimer = setTimeout(() => {
            sendMaskToFPGA(0);
            renderConsoleStatus(0);
        }, 120);
    });
}

function renderConsoleStatus(mask) {
    const s = (btn, name) => `${name}:${(mask & btn) ? 'ON ' : 'OFF'}`;
    const txt = `\r[ ${s(BTN_UP, 'UP')} | ${s(BTN_DOWN, 'DOWN')} | ${s(BTN_LEFT, 'LEFT')} | ${s(BTN_RIGHT, 'RIGHT')} | ${s(BTN_A, 'A')} | ${s(BTN_B, 'B')} | ${s(BTN_START, 'START')} | ${s(BTN_SELECT, 'SELECT')} ]`;
    process.stdout.write(txt);
}

// Iniciação dos Subsistemas
initNiosBridge();
server.listen(HTTP_PORT, () => {
    setupTerminalKeyboard();
});
