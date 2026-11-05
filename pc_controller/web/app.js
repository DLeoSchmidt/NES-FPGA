/**
 * NES-FPGA Web Controller Client
 * ==============================
 * Captura eventos de teclado, toques na tela e gamepads USB/Bluetooth
 * e transmite para o servidor bridge Node.js via WebSocket local.
 */

// Constantes de Bits do Controle de NES
const BTN_RIGHT  = 1 << 0;
const BTN_LEFT   = 1 << 1;
const BTN_DOWN   = 1 << 2;
const BTN_UP     = 1 << 3;
const BTN_START  = 1 << 4;
const BTN_SELECT = 1 << 5;
const BTN_B      = 1 << 6;
const BTN_A      = 1 << 7;

// Mapeamento de Teclas do Teclado Físico
const KEY_MAP = {
    'KeyW': BTN_UP,
    'ArrowUp': BTN_UP,
    'KeyS': BTN_DOWN,
    'ArrowDown': BTN_DOWN,
    'KeyA': BTN_LEFT,
    'ArrowLeft': BTN_LEFT,
    'KeyD': BTN_RIGHT,
    'ArrowRight': BTN_RIGHT,
    'KeyK': BTN_A,
    'KeyX': BTN_A,
    'KeyJ': BTN_B,
    'KeyZ': BTN_B,
    'Enter': BTN_START,
    'KeyU': BTN_SELECT,
    'ShiftRight': BTN_SELECT,
    'ShiftLeft': BTN_SELECT
};

// Elementos da Interface
const elements = {
    up: document.getElementById('btn-up'),
    down: document.getElementById('btn-down'),
    left: document.getElementById('btn-left'),
    right: document.getElementById('btn-right'),
    a: document.getElementById('btn-a'),
    b: document.getElementById('btn-b'),
    start: document.getElementById('btn-start'),
    select: document.getElementById('btn-select'),
    indicator: document.getElementById('connection-indicator'),
    status: document.getElementById('connection-status'),
    gamepadInfo: document.getElementById('gamepad-info')
};

let currentMask = 0;
let ws = null;
const activeKeys = new Set();
const activeTouches = new Set();

/**
 * Conexão WebSocket com reconexão automática
 */
function connectWebSocket() {
    const wsUrl = `ws://${window.location.host || 'localhost:8080'}`;
    elements.status.textContent = 'Conectando ao servidor bridge...';

    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
        elements.indicator.className = 'dot connected';
        elements.status.textContent = 'Conectado ao FPGA (JTAG UART ativo)';
    };

    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            if (data.type === 'state' && typeof data.mask === 'number') {
                updateVisualState(data.mask);
            }
        } catch {
            // Ignora
        }
    };

    ws.onclose = () => {
        elements.indicator.className = 'dot disconnected';
        elements.status.textContent = 'Desconectado (Tentando reconectar em 2s...)';
        setTimeout(connectWebSocket, 2000);
    };

    ws.onerror = () => {
        ws.close();
    };
}

/**
 * Envia o estado consolidado da máscara de botões para o FPGA.
 */
function broadcastMask(mask) {
    if (mask === currentMask) return;
    currentMask = mask;
    updateVisualState(currentMask);

    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'mask', mask: currentMask }));
    }
}

/**
 * Atualiza as classes CSS ativas dos botões virtuais na tela.
 */
function updateVisualState(mask) {
    elements.up.classList.toggle('active', (mask & BTN_UP) !== 0);
    elements.down.classList.toggle('active', (mask & BTN_DOWN) !== 0);
    elements.left.classList.toggle('active', (mask & BTN_LEFT) !== 0);
    elements.right.classList.toggle('active', (mask & BTN_RIGHT) !== 0);
    elements.a.classList.toggle('active', (mask & BTN_A) !== 0);
    elements.b.classList.toggle('active', (mask & BTN_B) !== 0);
    elements.start.classList.toggle('active', (mask & BTN_START) !== 0);
    elements.select.classList.toggle('active', (mask & BTN_SELECT) !== 0);
}

/**
 * Recalcula a máscara combinando Teclado + Toque/Mouse + Gamepad
 */
function recalculateMask() {
    let mask = 0;
    for (const code of activeKeys) {
        if (KEY_MAP[code]) {
            mask |= KEY_MAP[code];
        }
    }
    for (const btn of activeTouches) {
        if (btn === 'up') mask |= BTN_UP;
        else if (btn === 'down') mask |= BTN_DOWN;
        else if (btn === 'left') mask |= BTN_LEFT;
        else if (btn === 'right') mask |= BTN_RIGHT;
        else if (btn === 'a') mask |= BTN_A;
        else if (btn === 'b') mask |= BTN_B;
        else if (btn === 'start') mask |= BTN_START;
        else if (btn === 'select') mask |= BTN_SELECT;
    }
    return mask;
}

// Listeners de Teclado no Navegador
window.addEventListener('keydown', (e) => {
    if (KEY_MAP[e.code]) {
        e.preventDefault(); // Previne rolagem de página
        activeKeys.add(e.code);
        broadcastMask(recalculateMask());
    }
});

window.addEventListener('keyup', (e) => {
    if (KEY_MAP[e.code]) {
        e.preventDefault();
        activeKeys.delete(e.code);
        broadcastMask(recalculateMask());
    }
});

// Suporte a Mouse e Toque nos Botões Virtuais
const interactiveButtons = document.querySelectorAll('[data-btn]');
interactiveButtons.forEach((btn) => {
    const btnType = btn.getAttribute('data-btn');

    const handlePress = (e) => {
        e.preventDefault();
        activeTouches.add(btnType);
        broadcastMask(recalculateMask());
    };

    const handleRelease = (e) => {
        e.preventDefault();
        activeTouches.delete(btnType);
        broadcastMask(recalculateMask());
    };

    btn.addEventListener('mousedown', handlePress);
    btn.addEventListener('mouseup', handleRelease);
    btn.addEventListener('mouseleave', handleRelease);

    btn.addEventListener('touchstart', handlePress, { passive: false });
    btn.addEventListener('touchend', handleRelease, { passive: false });
    btn.addEventListener('touchcancel', handleRelease, { passive: false });
});

// Suporte à HTML5 Gamepad API (Controle USB/Bluetooth no PC)
let hasGamepad = false;

function pollGamepad() {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    let gpMask = 0;
    let foundGp = false;

    for (const gp of gamepads) {
        if (!gp) continue;
        foundGp = true;

        // D-Pad / Botões direcionais
        if (gp.buttons[12] && gp.buttons[12].pressed) gpMask |= BTN_UP;
        if (gp.buttons[13] && gp.buttons[13].pressed) gpMask |= BTN_DOWN;
        if (gp.buttons[14] && gp.buttons[14].pressed) gpMask |= BTN_LEFT;
        if (gp.buttons[15] && gp.buttons[15].pressed) gpMask |= BTN_RIGHT;

        // Analógico Esquerdo
        if (gp.axes[1] < -0.4) gpMask |= BTN_UP;
        if (gp.axes[1] > 0.4)  gpMask |= BTN_DOWN;
        if (gp.axes[0] < -0.4) gpMask |= BTN_LEFT;
        if (gp.axes[0] > 0.4)  gpMask |= BTN_RIGHT;

        // Botões de Ação (A, B, X, Y)
        if (gp.buttons[0] && gp.buttons[0].pressed) gpMask |= BTN_A; // Xbox A / PS X
        if (gp.buttons[1] && gp.buttons[1].pressed) gpMask |= BTN_B; // Xbox B / PS Circulo
        if (gp.buttons[2] && gp.buttons[2].pressed) gpMask |= BTN_B; // Xbox X / PS Quadrado

        // Select e Start
        if (gp.buttons[8] && gp.buttons[8].pressed) gpMask |= BTN_SELECT;
        if (gp.buttons[9] && gp.buttons[9].pressed) gpMask |= BTN_START;

        elements.gamepadInfo.textContent = `Gamepad Conectado: ${gp.id}`;
        break;
    }

    if (foundGp !== hasGamepad) {
        hasGamepad = foundGp;
        if (!hasGamepad) {
            elements.gamepadInfo.textContent = 'Gamepad USB/Bluetooth: Não detectado (Conecte um controle e pressione qualquer botão)';
        }
    }

    const totalMask = recalculateMask() | gpMask;
    broadcastMask(totalMask);

    requestAnimationFrame(pollGamepad);
}

// Inicialização
connectWebSocket();
requestAnimationFrame(pollGamepad);
