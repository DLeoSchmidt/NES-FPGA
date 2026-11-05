/**
 * NES-FPGA Dual Controller Web Client
 * ===================================
 * Gerencia o estado de 2 controles independentes (Player 1 e Player 2).
 * Suporta:
 *   - Remapeamento dinâmico e interativo de teclas (com salvamento no localStorage)
 *   - Atribuição de dispositivos (Teclado, Gamepad 1, Gamepad 2) para cada jogador
 *   - HTML5 Gamepad API para até múltiplos joysticks USB/Bluetooth físicos no PC
 *   - Transmissão WebSocket contínua de [p1_mask, p2_mask] para a bridge Node.js
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

// Mapeamentos Padrão (Factory Defaults)
const DEFAULT_BINDINGS = {
    p1: {
        up: 'KeyW',
        down: 'KeyS',
        left: 'KeyA',
        right: 'KeyD',
        b: 'KeyJ',
        a: 'KeyK',
        select: 'KeyU',
        start: 'KeyI'
    },
    p2: {
        up: 'ArrowUp',
        down: 'ArrowDown',
        left: 'ArrowLeft',
        right: 'ArrowRight',
        b: 'Numpad1',
        a: 'Numpad2',
        select: 'Numpad4',
        start: 'Numpad5'
    }
};

// Carrega preferências do localStorage ou usa padrões
let keyBindings = loadBindings();

function loadBindings() {
    try {
        const saved = localStorage.getItem('nes_dual_bindings');
        if (saved) {
            return JSON.parse(saved);
        }
    } catch {
        // Fallback para padrões
    }
    return JSON.parse(JSON.stringify(DEFAULT_BINDINGS));
}

function saveBindings() {
    try {
        localStorage.setItem('nes_dual_bindings', JSON.stringify(keyBindings));
    } catch {
        // Ignora erros de cota
    }
}

// Estado dos Controles
let p1Mask = 0;
let p2Mask = 0;
let ws = null;
const pressedPhysicalKeys = new Set();
const p1TouchButtons = new Set();
const p2TouchButtons = new Set();

// Elementos da Interface
const ui = {
    indicator: document.getElementById('connection-indicator'),
    status: document.getElementById('connection-status'),
    p1Source: document.getElementById('p1-source'),
    p2Source: document.getElementById('p2-source'),
    gamepadTelemetry: document.getElementById('gamepad-telemetry'),
    modal: document.getElementById('settings-modal'),
    btnOpenSettings: document.getElementById('btn-open-settings'),
    btnCloseModal: document.getElementById('btn-close-modal'),
    btnSaveModal: document.getElementById('btn-save-modal'),
    btnResetDefaults: document.getElementById('btn-reset-defaults'),
    // Elementos do Cartridge Switcher
    selectGame: document.getElementById('select-game'),
    btnSwitchGame: document.getElementById('btn-switch-game'),
    btnFlashGame: document.getElementById('btn-flash-game'),
    switchModal: document.getElementById('switch-modal'),
    modalGameName: document.getElementById('modal-game-name'),
    badgeMapper: document.getElementById('badge-mapper'),
    badgeMirror: document.getElementById('badge-mirror'),
    badgePrg: document.getElementById('badge-prg'),
    badgeChr: document.getElementById('badge-chr'),
    btnCloseSwitchModal: document.getElementById('btn-close-switch-modal'),
    btnOkSwitchModal: document.getElementById('btn-ok-switch-modal')
};

// Mapeamento dos botões virtuais na tela para animação
const visualButtons = {
    p1: {
        up: document.getElementById('p1-btn-up'),
        down: document.getElementById('p1-btn-down'),
        left: document.getElementById('p1-btn-left'),
        right: document.getElementById('p1-btn-right'),
        b: document.getElementById('p1-btn-b'),
        a: document.getElementById('p1-btn-a'),
        select: document.getElementById('p1-btn-select'),
        start: document.getElementById('p1-btn-start')
    },
    p2: {
        up: document.getElementById('p2-btn-up'),
        down: document.getElementById('p2-btn-down'),
        left: document.getElementById('p2-btn-left'),
        right: document.getElementById('p2-btn-right'),
        b: document.getElementById('p2-btn-b'),
        a: document.getElementById('p2-btn-a'),
        select: document.getElementById('p2-btn-select'),
        start: document.getElementById('p2-btn-start')
    }
};

/**
 * Conexão WebSocket
 */
function connectWebSocket() {
    const wsUrl = `ws://${window.location.host || 'localhost:8080'}`;
    ui.status.textContent = 'Conectando ao FPGA...';

    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
        ui.indicator.className = 'dot connected';
        ui.status.textContent = 'Conectado (Dual Core Ativo)';
    };

    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            if (data.type === 'state2') {
                updateVisual(visualButtons.p1, data.p1 || 0);
                updateVisual(visualButtons.p2, data.p2 || 0);
            } else if (data.type === 'game_changed' && data.active) {
                if (ui.selectGame && data.active.slug) {
                    ui.selectGame.value = data.active.slug;
                }
            }
        } catch {
            // Ignora
        }
    };

    ws.onclose = () => {
        ui.indicator.className = 'dot disconnected';
        ui.status.textContent = 'Desconectado (Reconectando em 2s...)';
        setTimeout(connectWebSocket, 2000);
    };

    ws.onerror = () => {
        ws.close();
    };
}

function broadcastDualMask(mask1, mask2) {
    if (mask1 === p1Mask && mask2 === p2Mask) return;
    p1Mask = mask1;
    p2Mask = mask2;

    updateVisual(visualButtons.p1, p1Mask);
    updateVisual(visualButtons.p2, p2Mask);

    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'mask2', p1: p1Mask, p2: p2Mask }));
    }
}

function updateVisual(btns, mask) {
    btns.up.classList.toggle('active', (mask & BTN_UP) !== 0);
    btns.down.classList.toggle('active', (mask & BTN_DOWN) !== 0);
    btns.left.classList.toggle('active', (mask & BTN_LEFT) !== 0);
    btns.right.classList.toggle('active', (mask & BTN_RIGHT) !== 0);
    btns.b.classList.toggle('active', (mask & BTN_B) !== 0);
    btns.a.classList.toggle('active', (mask & BTN_A) !== 0);
    btns.select.classList.toggle('active', (mask & BTN_SELECT) !== 0);
    btns.start.classList.toggle('active', (mask & BTN_START) !== 0);
}

/**
 * Cálculo das Máscaras a partir do Teclado
 */
function computeKeyboardMask(player) {
    const binds = keyBindings[player];
    let mask = 0;

    if (pressedPhysicalKeys.has(binds.up)) mask |= BTN_UP;
    if (pressedPhysicalKeys.has(binds.down)) mask |= BTN_DOWN;
    if (pressedPhysicalKeys.has(binds.left)) mask |= BTN_LEFT;
    if (pressedPhysicalKeys.has(binds.right)) mask |= BTN_RIGHT;
    if (pressedPhysicalKeys.has(binds.b)) mask |= BTN_B;
    if (pressedPhysicalKeys.has(binds.a)) mask |= BTN_A;
    if (pressedPhysicalKeys.has(binds.select)) mask |= BTN_SELECT;
    if (pressedPhysicalKeys.has(binds.start)) mask |= BTN_START;

    return mask;
}

function computeTouchMask(touchSet) {
    let mask = 0;
    if (touchSet.has('up')) mask |= BTN_UP;
    if (touchSet.has('down')) mask |= BTN_DOWN;
    if (touchSet.has('left')) mask |= BTN_LEFT;
    if (touchSet.has('right')) mask |= BTN_RIGHT;
    if (touchSet.has('b')) mask |= BTN_B;
    if (touchSet.has('a')) mask |= BTN_A;
    if (touchSet.has('select')) mask |= BTN_SELECT;
    if (touchSet.has('start')) mask |= BTN_START;
    return mask;
}

/**
 * Leitura de Gamepad da API HTML5
 */
function readGamepadMask(gpIndex) {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    if (!gamepads || !gamepads[gpIndex]) return 0;
    const gp = gamepads[gpIndex];

    let mask = 0;
    // D-Pad
    if (gp.buttons[12] && gp.buttons[12].pressed) mask |= BTN_UP;
    if (gp.buttons[13] && gp.buttons[13].pressed) mask |= BTN_DOWN;
    if (gp.buttons[14] && gp.buttons[14].pressed) mask |= BTN_LEFT;
    if (gp.buttons[15] && gp.buttons[15].pressed) mask |= BTN_RIGHT;

    // Analógico Esquerdo
    if (gp.axes[1] < -0.4) mask |= BTN_UP;
    if (gp.axes[1] > 0.4)  mask |= BTN_DOWN;
    if (gp.axes[0] < -0.4) mask |= BTN_LEFT;
    if (gp.axes[0] > 0.4)  mask |= BTN_RIGHT;

    // Botões Ação
    if (gp.buttons[0] && gp.buttons[0].pressed) mask |= BTN_A;
    if (gp.buttons[1] && gp.buttons[1].pressed) mask |= BTN_B;
    if (gp.buttons[2] && gp.buttons[2].pressed) mask |= BTN_B; // X alternativo para B

    // Select e Start
    if (gp.buttons[8] && gp.buttons[8].pressed) mask |= BTN_SELECT;
    if (gp.buttons[9] && gp.buttons[9].pressed) mask |= BTN_START;

    return mask;
}

/**
 * Loop Principal de Entrada (Executado a 60 FPS com requestAnimationFrame)
 */
function updateInputs() {
    let finalP1 = 0;
    let finalP2 = 0;

    const p1Src = ui.p1Source.value;
    const p2Src = ui.p2Source.value;

    // P1
    if (p1Src === 'keyboard' || p1Src === 'both') {
        finalP1 |= computeKeyboardMask('p1');
    }
    if (p1Src === 'gp0' || p1Src === 'both') {
        finalP1 |= readGamepadMask(0);
    } else if (p1Src === 'gp1') {
        finalP1 |= readGamepadMask(1);
    }
    finalP1 |= computeTouchMask(p1TouchButtons);

    // P2
    if (p2Src === 'keyboard' || p2Src === 'both') {
        finalP2 |= computeKeyboardMask('p2');
    }
    if (p2Src === 'gp1' || p2Src === 'both') {
        finalP2 |= readGamepadMask(1);
    } else if (p2Src === 'gp0') {
        finalP2 |= readGamepadMask(0);
    }
    finalP2 |= computeTouchMask(p2TouchButtons);

    broadcastDualMask(finalP1, finalP2);

    // Atualiza telemetria de gamepads
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    const connected = [];
    for (let i = 0; i < gamepads.length; i++) {
        if (gamepads[i]) connected.push(`#${i}: ${gamepads[i].id.substring(0, 24)}...`);
    }
    if (connected.length > 0) {
        ui.gamepadTelemetry.textContent = `🎮 Gamepads Conectados: ${connected.join(' | ')}`;
    } else {
        ui.gamepadTelemetry.textContent = '🎮 Gamepads USB/Bluetooth: Nenhum conectado (plugue e aperte qualquer botão).';
    }

    requestAnimationFrame(updateInputs);
}

/**
 * Interação de Teclado Global
 */
let recordingButton = null;

window.addEventListener('keydown', (e) => {
    // Se o modal estiver no modo de gravação de tecla
    if (recordingButton) {
        e.preventDefault();
        const player = recordingButton.dataset.p;
        const action = recordingButton.dataset.act;

        keyBindings[player][action] = e.code;
        recordingButton.textContent = e.code;
        recordingButton.classList.remove('recording');
        recordingButton = null;
        saveBindings();
        return;
    }

    // Previne rolagem de setas/espaço se a tecla pertencer a um jogador ativo
    const isBoundKey = Object.values(keyBindings.p1).includes(e.code) || Object.values(keyBindings.p2).includes(e.code);
    if (isBoundKey) {
        e.preventDefault();
        pressedPhysicalKeys.add(e.code);
    }
});

window.addEventListener('keyup', (e) => {
    pressedPhysicalKeys.delete(e.code);
});

/**
 * Eventos nos Botões Virtuais (Mouse e Touch)
 */
function setupTouchControls() {
    document.querySelectorAll('[data-btn]').forEach((btn) => {
        const player = btn.dataset.player;
        const btnType = btn.dataset.btn;
        const targetSet = (player === 'p1') ? p1TouchButtons : p2TouchButtons;

        const press = (e) => {
            e.preventDefault();
            targetSet.add(btnType);
        };
        const release = (e) => {
            e.preventDefault();
            targetSet.delete(btnType);
        };

        btn.addEventListener('mousedown', press);
        btn.addEventListener('mouseup', release);
        btn.addEventListener('mouseleave', release);
        btn.addEventListener('touchstart', press, { passive: false });
        btn.addEventListener('touchend', release, { passive: false });
        btn.addEventListener('touchcancel', release, { passive: false });
    });
}

/**
 * Configuração do Modal de Mapeamento
 */
function refreshModalLabels() {
    document.querySelectorAll('.key-binder').forEach((btn) => {
        const p = btn.dataset.p;
        const act = btn.dataset.act;
        btn.textContent = keyBindings[p][act] || 'Não definido';
    });
}

function setupModal() {
    ui.btnOpenSettings.addEventListener('click', () => {
        refreshModalLabels();
        ui.modal.classList.remove('hidden');
    });

    ui.btnCloseModal.addEventListener('click', () => {
        if (recordingButton) {
            recordingButton.classList.remove('recording');
            recordingButton = null;
        }
        ui.modal.classList.add('hidden');
    });

    ui.btnSaveModal.addEventListener('click', () => {
        saveBindings();
        ui.modal.classList.add('hidden');
    });

    ui.btnResetDefaults.addEventListener('click', () => {
        keyBindings = JSON.parse(JSON.stringify(DEFAULT_BINDINGS));
        saveBindings();
        refreshModalLabels();
    });

    // Clique para remapear
    document.querySelectorAll('.key-binder').forEach((btn) => {
        btn.addEventListener('click', () => {
            if (recordingButton) {
                recordingButton.classList.remove('recording');
            }
            recordingButton = btn;
            btn.classList.add('recording');
            btn.textContent = 'Pressione tecla...';
        });
    });
}

/**
 * Gerenciador do Seletor de Cartuchos e Troca de Jogos
 */
async function setupGameSwitcher() {
    if (!ui.selectGame || !ui.btnSwitchGame) return;

    try {
        const resp = await fetch('/api/games');
        if (!resp.ok) return;
        const { catalog, active } = await resp.json();

        ui.selectGame.innerHTML = '';

        const groupVertical = document.createElement('optgroup');
        groupVertical.label = 'Espelhamento Vertical (Nativo 100%)';

        const groupHorizontal = document.createElement('optgroup');
        groupHorizontal.label = 'Espelhamento Horizontal';

        for (const game of catalog) {
            const opt = document.createElement('option');
            opt.value = game.slug;
            opt.textContent = `${game.title} (${game.mapperType || 'NROM'})`;
            if (game.mirroring === 'Vertical') {
                groupVertical.appendChild(opt);
            } else {
                groupHorizontal.appendChild(opt);
            }
        }

        ui.selectGame.appendChild(groupVertical);
        ui.selectGame.appendChild(groupHorizontal);

        if (active && active.slug) {
            ui.selectGame.value = active.slug;
        }

        ui.btnSwitchGame.addEventListener('click', async () => {
            const slug = ui.selectGame.value;
            if (!slug) return;

            ui.btnSwitchGame.disabled = true;
            ui.btnSwitchGame.textContent = 'Trocando...';

            try {
                const switchResp = await fetch(`/api/switch-game?slug=${encodeURIComponent(slug)}`);
                const result = await switchResp.json();

                if (result.success && result.active) {
                    const act = result.active;
                    ui.modalGameName.textContent = act.title;
                    ui.badgeMapper.textContent = act.mapperType || 'Mapper 0';
                    ui.badgeMirror.textContent = `Espelhamento: ${act.mirroring}`;
                    ui.badgePrg.textContent = `PRG: ${act.prgSizeKB || 32} KB`;
                    ui.badgeChr.textContent = `CHR: ${act.chrSizeKB || 8} KB`;

                    ui.switchModal.classList.remove('hidden');
                } else {
                    alert('Erro ao trocar jogo: ' + (result.error || 'Falha desconhecida'));
                }
            } catch (err) {
                alert('Erro de rede ao trocar jogo: ' + err.message);
            } finally {
                ui.btnSwitchGame.disabled = false;
                ui.btnSwitchGame.textContent = 'Trocar MIF';
            }
        });

        if (ui.btnFlashGame) {
            ui.btnFlashGame.addEventListener('click', async () => {
                const slug = ui.selectGame.value;
                if (!slug) return;

                ui.btnFlashGame.disabled = true;
                ui.btnFlashGame.textContent = 'Gravando...';

                try {
                    const switchResp = await fetch(`/api/switch-game?slug=${encodeURIComponent(slug)}&flash=1`);
                    const result = await switchResp.json();

                    if (result.success && result.active) {
                        const act = result.active;
                        ui.modalGameName.textContent = act.title;
                        ui.badgeMapper.textContent = act.mapperType || 'Mapper 0';
                        ui.badgeMirror.textContent = `Espelhamento: ${act.mirroring}`;
                        ui.badgePrg.textContent = `PRG: ${act.prgSizeKB || 32} KB`;
                        ui.badgeChr.textContent = `CHR: ${act.chrSizeKB || 8} KB`;

                        ui.switchModal.classList.remove('hidden');
                    } else {
                        alert('Aviso da gravação via terminal: ' + (result.error || 'Falha'));
                    }
                } catch (err) {
                    alert('Erro de rede: ' + err.message);
                } finally {
                    ui.btnFlashGame.disabled = false;
                    ui.btnFlashGame.textContent = '⚡ Gravar FPGA';
                }
            });
        }

        // Fechamento do modal de instruções
        if (ui.btnCloseSwitchModal) {
            ui.btnCloseSwitchModal.addEventListener('click', () => {
                ui.switchModal.classList.add('hidden');
            });
        }
        if (ui.btnOkSwitchModal) {
            ui.btnOkSwitchModal.addEventListener('click', () => {
                ui.switchModal.classList.add('hidden');
            });
        }
    } catch (e) {
        console.warn('Falha ao carregar catálogo de jogos:', e);
    }
}

// Inicialização
setupTouchControls();
setupModal();
setupGameSwitcher();
connectWebSocket();
requestAnimationFrame(updateInputs);
