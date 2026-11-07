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
    btnSwitchMif: document.getElementById('btn-switch-mif') || document.getElementById('btn-switch-game'),
    btnBuildSof: document.getElementById('btn-build-sof'),
    btnFlashGame: document.getElementById('btn-flash-game'),
    switchModal: document.getElementById('switch-modal'),
    modalTitleText: document.getElementById('modal-title-text'),
    modalGameName: document.getElementById('modal-game-name'),
    badgeMapper: document.getElementById('badge-mapper'),
    badgeMirror: document.getElementById('badge-mirror'),
    badgePrg: document.getElementById('badge-prg'),
    badgeChr: document.getElementById('badge-chr'),
    stepStatusMif: document.getElementById('step-status-mif'),
    stepStatusSof: document.getElementById('step-status-sof'),
    stepStatusJtag: document.getElementById('step-status-jtag'),
    modalAlertBox: document.getElementById('modal-alert-box'),
    modalAlertIcon: document.getElementById('modal-alert-icon'),
    modalAlertTitle: document.getElementById('modal-alert-title'),
    modalAlertDesc: document.getElementById('modal-alert-desc'),
    modalManualSteps: document.getElementById('modal-manual-steps'),
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

// Limpa estado se a janela do navegador perder o foco (ex: Alt+Tab)
window.addEventListener('blur', () => {
    pressedPhysicalKeys.clear();
    p1TouchButtons.clear();
    p2TouchButtons.clear();
    broadcastDualMask(0, 0);
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
 * Renderiza dinamicamente o modal de atualização de jogo e pipeline do Quartus.
 * Exibe o status de cada etapa e alertas claros sobre gravação e cabos JTAG.
 */
function renderSwitchModal(result) {
    if (!result || !result.active) return;
    const act = result.active;
    const action = result.action || 'mif';

    if (ui.modalGameName) ui.modalGameName.textContent = act.title;
    if (ui.badgeMapper) ui.badgeMapper.textContent = act.mapperType || 'Mapper 0';
    if (ui.badgeMirror) ui.badgeMirror.textContent = `Espelhamento: ${act.mirroring}`;
    if (ui.badgePrg) ui.badgePrg.textContent = `PRG: ${act.prgSizeKB || 32} KB`;
    if (ui.badgeChr) ui.badgeChr.textContent = `CHR: ${act.chrSizeKB || 8} KB`;

    // Função auxiliar para atualizar badges dos passos
    function setStepBadge(badgeEl, text, type) {
        if (!badgeEl) return;
        badgeEl.textContent = text;
        badgeEl.className = `step-badge badge-${type}`;
    }

    // 1. Arquivos MIF sempre atualizados
    setStepBadge(ui.stepStatusMif, 'Atualizado ✓', 'success');

    // 2. Quartus Assembler (.SOF)
    if (action === 'build' || action === 'flash') {
        if (result.sofGenerated) {
            setStepBadge(ui.stepStatusSof, 'Gerado .SOF ✓', 'success');
        } else {
            setStepBadge(ui.stepStatusSof, 'Falha no Build ✕', 'error');
        }
    } else {
        setStepBadge(ui.stepStatusSof, 'Pendente', 'neutral');
    }

    // 3. Gravação FPGA (JTAG)
    if (action === 'flash') {
        if (result.flashed && result.cableConnected) {
            setStepBadge(ui.stepStatusJtag, 'Gravado ✓', 'success');
        } else if (!result.cableConnected) {
            setStepBadge(ui.stepStatusJtag, 'Sem Cabo ⚠️', 'warning');
        } else {
            setStepBadge(ui.stepStatusJtag, 'Falha JTAG ✕', 'error');
        }
    } else {
        setStepBadge(ui.stepStatusJtag, 'Não Solicitado', 'neutral');
    }

    // Configuração dos Alertas e Mensagens Contextuais
    if (ui.modalAlertBox) {
        ui.modalAlertBox.className = 'modal-alert-box';
    }

    if (action === 'mif') {
        if (ui.modalTitleText) ui.modalTitleText.textContent = 'MIF Atualizado';
        if (ui.modalAlertBox) ui.modalAlertBox.classList.add('alert-info');
        if (ui.modalAlertIcon) ui.modalAlertIcon.textContent = 'ℹ️';
        if (ui.modalAlertTitle) ui.modalAlertTitle.textContent = 'Arquivos MIF prontos em cart_init/';
        if (ui.modalAlertDesc) {
            ui.modalAlertDesc.textContent = `Os dados de PRG/CHR do jogo '${act.title}' foram carregados no diretório do projeto. Para aplicar na FPGA automaticamente, clique em "⚙️ Gerar .SOF" ou "⚡ Gravar na Placa". Se preferir o Quartus Prime GUI, siga o passo a passo abaixo.`;
        }
        if (ui.modalManualSteps) ui.modalManualSteps.style.display = 'block';
    } else if (action === 'build') {
        if (ui.modalTitleText) ui.modalTitleText.textContent = 'Bitstream .SOF Compilado';
        if (ui.modalAlertBox) ui.modalAlertBox.classList.add('alert-success');
        if (ui.modalAlertIcon) ui.modalAlertIcon.textContent = '⚙️';
        if (ui.modalAlertTitle) ui.modalAlertTitle.textContent = 'Bitstream NES.sof gerado com sucesso!';
        if (ui.modalAlertDesc) {
            ui.modalAlertDesc.textContent = `O Assembler do Intel Quartus Prime 18.1 gerou o arquivo 'output_files/NES.sof' atualizado. Para transferir agora mesmo para a placa DE10-Lite, clique no botão "⚡ Gravar na Placa".`;
        }
        if (ui.modalManualSteps) ui.modalManualSteps.style.display = 'none';
    } else if (action === 'flash') {
        if (result.flashed && result.cableConnected) {
            if (ui.modalTitleText) ui.modalTitleText.textContent = 'Gravado com Sucesso no FPGA';
            if (ui.modalAlertBox) ui.modalAlertBox.classList.add('alert-success');
            if (ui.modalAlertIcon) ui.modalAlertIcon.textContent = '⚡';
            if (ui.modalAlertTitle) ui.modalAlertTitle.textContent = 'Placa DE10-Lite atualizada com sucesso!';
            const cableInfo = result.cableName ? `via cabo '${result.cableName}'` : 'via USB-Blaster';
            if (ui.modalAlertDesc) {
                ui.modalAlertDesc.textContent = `O bitstream foi compilado e gravado no FPGA ${cableInfo}. O jogo '${act.title}' já está pronto e em execução no hardware!`;
            }
        } else if (!result.cableConnected) {
            if (ui.modalTitleText) ui.modalTitleText.textContent = 'Bitstream Gerado (Cabo USB Ausente)';
            if (ui.modalAlertBox) ui.modalAlertBox.classList.add('alert-warning');
            if (ui.modalAlertIcon) ui.modalAlertIcon.textContent = '⚠️';
            if (ui.modalAlertTitle) ui.modalAlertTitle.textContent = 'Placa DE10-Lite não detectada na porta USB';
            if (ui.modalAlertDesc) {
                ui.modalAlertDesc.textContent = `O arquivo 'output_files/NES.sof' foi gerado perfeitamente pelo Quartus 18.1, mas nenhum gravador USB-Blaster foi detectado no PC. Conecte o cabo USB da placa DE10-Lite, certifique-se de que a placa está ligada e clique em "⚡ Gravar na Placa".`;
            }
        } else {
            if (ui.modalTitleText) ui.modalTitleText.textContent = 'Aviso de Gravação';
            if (ui.modalAlertBox) ui.modalAlertBox.classList.add('alert-error');
            if (ui.modalAlertIcon) ui.modalAlertIcon.textContent = '❌';
            if (ui.modalAlertTitle) ui.modalAlertTitle.textContent = 'Erro ao transferir para a placa';
            if (ui.modalAlertDesc) {
                ui.modalAlertDesc.textContent = result.message || 'Houve uma falha na execução do quartus_pgm.';
            }
        }
        if (ui.modalManualSteps) ui.modalManualSteps.style.display = 'none';
    }

    if (ui.switchModal) {
        ui.switchModal.classList.remove('hidden');
    }
}

/**
 * Executa uma das 3 ações de cartucho:
 * - 'mif': Copia prg.mif e chr.mif (instantâneo)
 * - 'build': Copia MIFs + roda Assembler gerando .SOF
 * - 'flash': Copia MIFs + Assembler + Grava no FPGA DE10-Lite
 */
async function executeGameAction(action, btnElement, loadingText, defaultText) {
    const slug = ui.selectGame ? ui.selectGame.value : null;
    if (!slug) {
        alert('Por favor, selecione um jogo no menu de cartuchos.');
        return;
    }

    const allBtns = [ui.btnSwitchMif, ui.btnBuildSof, ui.btnFlashGame].filter(Boolean);
    allBtns.forEach(b => b.disabled = true);
    if (btnElement) btnElement.textContent = loadingText;

    try {
        const resp = await fetch(`/api/switch-game?slug=${encodeURIComponent(slug)}&action=${encodeURIComponent(action)}`);
        const result = await resp.json();

        if (result.success) {
            renderSwitchModal(result);
        } else {
            alert('Erro na automação do cartucho: ' + (result.error || 'Falha desconhecida'));
        }
    } catch (err) {
        alert('Erro de comunicação com o servidor: ' + err.message);
    } finally {
        allBtns.forEach(b => b.disabled = false);
        if (btnElement) btnElement.textContent = defaultText;
    }
}

/**
 * Gerenciador do Seletor de Cartuchos e Troca de Jogos
 */
async function setupGameSwitcher() {
    if (!ui.selectGame) return;

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

        // 1. Botão "Trocar MIF" (apenas copia arquivos)
        if (ui.btnSwitchMif) {
            ui.btnSwitchMif.addEventListener('click', () => {
                executeGameAction('mif', ui.btnSwitchMif, 'Trocando...', '📼 Trocar MIF');
            });
        }

        // 2. Botão "Gerar .SOF" (troca MIF + compila com Assembler)
        if (ui.btnBuildSof) {
            ui.btnBuildSof.addEventListener('click', () => {
                executeGameAction('build', ui.btnBuildSof, 'Compilando...', '⚙️ Gerar .SOF');
            });
        }

        // 3. Botão "Gravar na Placa" (troca MIF + compila .SOF + grava no FPGA via JTAG)
        if (ui.btnFlashGame) {
            ui.btnFlashGame.addEventListener('click', () => {
                executeGameAction('flash', ui.btnFlashGame, 'Gravando...', '⚡ Gravar na Placa');
            });
        }

        // Fechamento do modal de instruções e status
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

// Gerenciador de Porta Serial RS-232 / DB9
async function setupSerialManager() {
    const selectPort = document.getElementById('select-serial-port');
    const btnToggle = document.getElementById('btn-toggle-serial');
    if (!selectPort || !btnToggle) return;

    let isSerialConnected = false;

    async function loadPorts() {
        try {
            const resp = await fetch('/api/serial/ports');
            const data = await resp.json();
            const ports = data.ports || [];

            selectPort.innerHTML = '<option value="">JTAG UART (USB-Blaster)</option>';
            for (const p of ports) {
                const opt = document.createElement('option');
                opt.value = p;
                opt.textContent = `Serial DB9: ${p}`;
                if (data.active && data.active.port === p) {
                    opt.selected = true;
                }
                selectPort.appendChild(opt);
            }

            if (data.connected && data.active) {
                isSerialConnected = true;
                btnToggle.textContent = 'Desconectar DB9';
                btnToggle.style.background = '#ef4444';
            } else {
                isSerialConnected = false;
                btnToggle.textContent = 'Conectar DB9';
                btnToggle.style.background = '#3b82f6';
            }
        } catch {
            // Silencioso se backend offline
        }
    }

    btnToggle.addEventListener('click', async () => {
        const chosen = selectPort.value;
        if (!isSerialConnected) {
            if (!chosen) {
                // Se nenhuma porta for selecionada no dropdown, tenta a Web Serial API do navegador se disponível
                if ('serial' in navigator) {
                    try {
                        const port = await navigator.serial.requestPort();
                        await port.open({ baudRate: 115200 });
                        btnToggle.textContent = 'WebSerial Ativa';
                        btnToggle.style.background = '#10b981';
                        alert('Porta Serial conectada com sucesso via Web Serial API!');
                        return;
                    } catch (e) {
                        alert('Falha ao abrir Web Serial: ' + e.message);
                    }
                } else {
                    alert('Selecione uma porta serial COM no menu ao lado para conectar via conector DB9.');
                }
                return;
            }

            try {
                btnToggle.disabled = true;
                const resp = await fetch(`/api/serial/connect?port=${encodeURIComponent(chosen)}&baud=115200`);
                const res = await resp.json();
                if (res.connected) {
                    isSerialConnected = true;
                    btnToggle.textContent = 'Desconectar DB9';
                    btnToggle.style.background = '#ef4444';
                }
            } catch (err) {
                alert('Erro ao conectar porta serial: ' + err.message);
            } finally {
                btnToggle.disabled = false;
            }
        } else {
            try {
                btnToggle.disabled = true;
                await fetch('/api/serial/connect');
                isSerialConnected = false;
                btnToggle.textContent = 'Conectar DB9';
                btnToggle.style.background = '#3b82f6';
            } catch (err) {
                alert('Erro ao desconectar porta serial: ' + err.message);
            } finally {
                btnToggle.disabled = false;
            }
        }
    });

    loadPorts();
}

// Inicialização
setupTouchControls();
setupModal();
setupGameSwitcher();
setupSerialManager();
connectWebSocket();
requestAnimationFrame(updateInputs);
