// =============================================================================
// NES-FPGA Dual Controller Driver & JTAG UART Bridge (Player 1 + Player 2)
// =============================================================================
// Suporte concorrente a:
//   1. Teclado USB físico via Shield MAX3421E (atribuído ao Player 1).
//   2. PC Controller via JTAG UART (Player 1 e Player 2 independentes).
//
// Protocolo JTAG UART (3 bytes):
//   Byte 0: 0x5A (Sync Header)
//   Byte 1: Máscara 8-bits do Player 1 (A, B, Select, Start, Up, Down, Left, Right)
//   Byte 2: Máscara 8-bits do Player 2 (mesmo formato)
// =============================================================================

#include <stdio.h>
#include "system.h"
#include "altera_avalon_spi.h"
#include "altera_avalon_spi_regs.h"
#include "altera_avalon_pio_regs.h"
#include "altera_avalon_jtag_uart_regs.h"
#include "sys/alt_irq.h"
#include "usb_kb/GenericMacros.h"
#include "usb_kb/GenericTypeDefs.h"
#include "usb_kb/HID.h"
#include "usb_kb/MAX3421E.h"
#include "usb_kb/transfer.h"
#include "usb_kb/usb_ch9.h"
#include "usb_kb/USB.h"

extern HID_DEVICE hid_device;
extern BYTE g_has_max3421e;

static BYTE addr = 1; 				// hard-wired USB address
const char* const devclasses[] = { " Uninitialized", " HID Keyboard", " HID Mouse", " Mass storage" };

/* =========================================================================
 * PROTOCOLO DO CONTROLE DE NES & MAPEAMENTO DE BITS
 * ========================================================================= */
#define NES_BTN_RIGHT   (1 << 0)
#define NES_BTN_LEFT    (1 << 1)
#define NES_BTN_DOWN    (1 << 2)
#define NES_BTN_UP      (1 << 3)
#define NES_BTN_START   (1 << 4)
#define NES_BTN_SELECT  (1 << 5)
#define NES_BTN_B       (1 << 6)
#define NES_BTN_A       (1 << 7)

#define HID_CODE_RIGHT  0x07
#define HID_CODE_LEFT   0x04
#define HID_CODE_DOWN   0x16
#define HID_CODE_UP     0x1A
#define HID_CODE_START  0x0B
#define HID_CODE_SELECT 0x0A
#define HID_CODE_B      0x0E
#define HID_CODE_A      0x0F

#define JTAG_SYNC_HEADER 0x5A
#define ASCII_FRAME_HEADER '!'

static volatile alt_u8 g_pc_p1_mask     = 0;   // Player 1 vindo do PC
static volatile alt_u8 g_pc_p2_mask     = 0;   // Player 2 vindo do PC
static volatile alt_u8 g_usb_p1_mask    = 0;   // Player 1 vindo do Teclado USB físico
static alt_u8 g_jtag_state              = 0;   // 0 = Idle, 1 = Bin P1, 2 = Bin P2, 10-14 = ASCII Hex
static alt_u8 g_hex_nibbles[4]          = {0}; // Buffer para decodificação ASCII hex
static volatile alt_u16 g_rx_packet_cnt = 0;   // Telemetria: contador de pacotes recebidos com sucesso

static inline alt_u8 hex_char_to_nibble(alt_u8 c) {
	if (c >= '0' && c <= '9') return (c - '0');
	if (c >= 'A' && c <= 'F') return (c - 'A' + 10);
	if (c >= 'a' && c <= 'f') return (c - 'a' + 10);
	return 0xFF; // Invalido
}

BYTE GetDriverandReport() {
	BYTE i;
	BYTE rcode;
	BYTE device = 0xFF;
	BYTE tmpbyte;

	DEV_RECORD* tpl_ptr;
	for (i = 1; i < USB_NUMDEVICES; i++) {
		tpl_ptr = GetDevtable(i);
		if (tpl_ptr->epinfo != NULL) {
			device = tpl_ptr->devclass;
		}
	}
	rcode = XferGetIdle(addr, 0, hid_device.interface, 0, &tmpbyte);
	rcode = XferGetProto(addr, 0, hid_device.interface, &tmpbyte);
	return device;
}

void setLED(int LED) {
	IOWR_ALTERA_AVALON_PIO_DATA(LED_BASE,
			(IORD_ALTERA_AVALON_PIO_DATA(LED_BASE) | (0x001 << LED)));
}

void clearLED(int LED) {
	IOWR_ALTERA_AVALON_PIO_DATA(LED_BASE,
			(IORD_ALTERA_AVALON_PIO_DATA(LED_BASE) & ~(0x001 << LED)));
}

/* =========================================================================
 * Transmissão Não-Bloqueante pela JTAG UART (Sem risco de congelamento)
 * ========================================================================= */
static inline void jtag_uart_putc_noblock(char c) {
	if ((IORD_ALTERA_AVALON_JTAG_UART_CONTROL(JTAG_UART_0_BASE) & ALTERA_AVALON_JTAG_UART_CONTROL_WSPACE_MSK) != 0) {
		IOWR_ALTERA_AVALON_JTAG_UART_DATA(JTAG_UART_0_BASE, (alt_u8)c);
	}
}

static void jtag_uart_puts_noblock(const char* s) {
	while (*s) {
		if ((IORD_ALTERA_AVALON_JTAG_UART_CONTROL(JTAG_UART_0_BASE) & ALTERA_AVALON_JTAG_UART_CONTROL_WSPACE_MSK) == 0) {
			break;
		}
		IOWR_ALTERA_AVALON_JTAG_UART_DATA(JTAG_UART_0_BASE, (alt_u8)(*s++));
	}
}

/* =========================================================================
 * Polling Não-Bloqueante da JTAG UART (Recepção Dual Controller P1 + P2)
 * =========================================================================
 * Suporta 3 formatos simultâneos para máxima confiabilidade:
 *   1. Formato ASCII HEX Seguro: "!<P1_HEX2><P2_HEX2>\n" (Ex: "!0100\n")
 *      Imune a qualquer filtragem de caracteres de controle de TTY no Windows/Cygwin.
 *   2. Formato Binário: [0x5A, mask_p1, mask_p2]
 *   3. Caracteres ASCII Interativos: W, A, S, D, K, L, G, H
 * ========================================================================= */
static void poll_jtag_uart(void) {
	while (1) {
		alt_u32 jtag_data = IORD_ALTERA_AVALON_JTAG_UART_DATA(JTAG_UART_0_BASE);
		if (!(jtag_data & ALTERA_AVALON_JTAG_UART_DATA_RVALID_MSK)) {
			break;
		}

		alt_u8 rx_byte = (alt_u8)(jtag_data & ALTERA_AVALON_JTAG_UART_DATA_DATA_MSK);

		// Header ASCII '!' (Inicia frame hex de 4 nibbles: !P1_HI P1_LO P2_HI P2_LO)
		if (rx_byte == ASCII_FRAME_HEADER) {
			g_jtag_state = 10;
			continue;
		}

		// Header Binário 0x5A
		if (rx_byte == JTAG_SYNC_HEADER) {
			g_jtag_state = 1;
			continue;
		}

		// Maquina de estados de recepcao
		if (g_jtag_state >= 10 && g_jtag_state <= 13) {
			// Decodificacao do frame ASCII HEX: !<H0><H1><H2><H3>
			alt_u8 nib = hex_char_to_nibble(rx_byte);
			if (nib != 0xFF) {
				g_hex_nibbles[g_jtag_state - 10] = nib;
				g_jtag_state++;
				if (g_jtag_state == 14) {
					// Concluiu os 4 nibbles hexadecimais
					g_pc_p1_mask = (g_hex_nibbles[0] << 4) | g_hex_nibbles[1];
					g_pc_p2_mask = (g_hex_nibbles[2] << 4) | g_hex_nibbles[3];
					g_rx_packet_cnt++;
					g_jtag_state = 0;
					jtag_uart_puts_noblock("OK\n"); // Confirmação ACK
				}
			} else if (rx_byte != '\r' && rx_byte != '\n') {
				// Caractere invalido, reseta maquina de estados
				g_jtag_state = 0;
			}
			continue;
		}

		switch (g_jtag_state) {
			case 1: // Recebendo Máscara Binária do Player 1
				g_pc_p1_mask = rx_byte;
				g_jtag_state = 2;
				break;

			case 2: // Recebendo Máscara Binária do Player 2
				g_pc_p2_mask = rx_byte;
				g_jtag_state = 0;
				g_rx_packet_cnt++;
				jtag_uart_puts_noblock("OK\n");
				break;

			default:
				if (rx_byte == '\r' || rx_byte == '\n') {
					break;
				}
				// Fallback interativo: caracteres ASCII simples via nios2-terminal manual
				if (rx_byte == 'w' || rx_byte == 'W') g_pc_p1_mask ^= NES_BTN_UP;
				else if (rx_byte == 's' || rx_byte == 'S') g_pc_p1_mask ^= NES_BTN_DOWN;
				else if (rx_byte == 'a' || rx_byte == 'A') g_pc_p1_mask ^= NES_BTN_LEFT;
				else if (rx_byte == 'd' || rx_byte == 'D') g_pc_p1_mask ^= NES_BTN_RIGHT;
				else if (rx_byte == 'k' || rx_byte == 'K') g_pc_p1_mask ^= NES_BTN_B;
				else if (rx_byte == 'l' || rx_byte == 'L') g_pc_p1_mask ^= NES_BTN_A;
				else if (rx_byte == 'g' || rx_byte == 'G') g_pc_p1_mask ^= NES_BTN_SELECT;
				else if (rx_byte == 'h' || rx_byte == 'H') g_pc_p1_mask ^= NES_BTN_START;
				else if (rx_byte == ' ' || rx_byte == 'c' || rx_byte == 'C') { g_pc_p1_mask = 0; g_pc_p2_mask = 0; }
				g_jtag_state = 0;
				jtag_uart_puts_noblock("KEY\n");
				break;
		}
	}
}

/* =========================================================================
 * Atualização dos Registradores de Entrada dos Controles (P1 e P2)
 * =========================================================================
 *   keycode[7:0]   -> Player 1 (União de Teclado Físico USB + PC P1)
 *   keycode[15:8]  -> Player 2 (PC P2)
 *   keycode[23:16] -> Telemetria (Contador de pacotes recebidos / Status)
 *   keycode[31:24] -> 0x00 (Obrigatório para ativar modo Dual Mask no controller.sv)
 * ========================================================================= */
static void update_dual_keycodes(volatile unsigned int* keycode_pio) {
	alt_u8 final_p1 = g_usb_p1_mask | g_pc_p1_mask;
	alt_u8 final_p2 = g_pc_p2_mask;
	alt_u8 telemetry = (alt_u8)(g_rx_packet_cnt & 0xFF);

	alt_u32 combined_word = ((alt_u32)telemetry << 16) | ((alt_u32)final_p2 << 8) | (alt_u32)final_p1;

	*keycode_pio = combined_word;
}

int main() {
	volatile unsigned int* keycode_pio = (volatile unsigned int*)KEYCODE_BASE;
	BYTE rcode;
	BOOT_MOUSE_REPORT buf;		// USB mouse report
	BOOT_KBD_REPORT kbdbuf;

	BYTE runningdebugflag = 0;
	BYTE errorflag = 0;
	BYTE device = 0;

	// 1. Desabilita interrupcao e desregistra handler da JTAG UART para garantir leitura direta sem interferencia do HAL
	alt_irq_register(JTAG_UART_0_IRQ, NULL, NULL);
	// Mantem RE = 1 para que o host JTAG Atlantic saiba que o buffer esta pronto para receber dados
	IOWR_ALTERA_AVALON_JTAG_UART_CONTROL(JTAG_UART_0_BASE, ALTERA_AVALON_JTAG_UART_CONTROL_RE_MSK);

	// 2. Limpa quaisquer bytes residuais no FIFO da JTAG UART
	while (IORD_ALTERA_AVALON_JTAG_UART_DATA(JTAG_UART_0_BASE) & ALTERA_AVALON_JTAG_UART_DATA_RVALID_MSK);

	// 3. Inicializa os 32 bits de keycode zerados (Modo Dual Mask)
	*keycode_pio = 0x00000000;

	// Sinaliza inicialização do firmware de forma 100% não-bloqueante
	jtag_uart_putc_noblock('R');
	jtag_uart_putc_noblock('D');
	jtag_uart_putc_noblock('Y');
	jtag_uart_putc_noblock('\n');

	// 4. Inicializa o chip USB MAX3421E com verificacao previa de presenca fisica
	MAX3421E_init();
	if (g_has_max3421e) {
		USB_init();
	}

	while (1) {
		// 1. Polling prioritário de ultra-alta frequência da JTAG UART (Sem interrupções/delays)
		poll_jtag_uart();

		// 2. Tarefas do USB Host Shield (Executadas SOMENTE se o hardware MAX3421E existir)
		if (g_has_max3421e) {
			MAX3421E_Task();
			USB_Task();

			if (GetUsbTaskState() == USB_STATE_RUNNING) {
				if (!runningdebugflag) {
					runningdebugflag = 1;
					setLED(9);
					device = GetDriverandReport();
				} else if (device == 1) {
					// Teclado USB físico conectado ao shield (Player 1)
					rcode = kbdPoll(&kbdbuf);
					if (rcode == hrSUCCESS) {
						alt_u8 physical_mask = 0;
						for (int i = 0; i < 6; i++) {
							BYTE kc = kbdbuf.keycode[i];
							if (kc == HID_CODE_UP) physical_mask |= NES_BTN_UP;
							else if (kc == HID_CODE_DOWN) physical_mask |= NES_BTN_DOWN;
							else if (kc == HID_CODE_LEFT) physical_mask |= NES_BTN_LEFT;
							else if (kc == HID_CODE_RIGHT) physical_mask |= NES_BTN_RIGHT;
							else if (kc == HID_CODE_A) physical_mask |= NES_BTN_A;
							else if (kc == HID_CODE_B) physical_mask |= NES_BTN_B;
							else if (kc == HID_CODE_START) physical_mask |= NES_BTN_START;
							else if (kc == HID_CODE_SELECT) physical_mask |= NES_BTN_SELECT;
						}
						g_usb_p1_mask = physical_mask;
					}
				} else if (device == 2) {
					// Mouse USB preservado
					rcode = mousePoll(&buf);
					if (rcode == hrSUCCESS) {
						if (buf.button & 0x04) setLED(2); else clearLED(2);
						if (buf.button & 0x02) setLED(1); else clearLED(1);
						if (buf.button & 0x01) setLED(0); else clearLED(0);
					}
				}
			} else if (GetUsbTaskState() == USB_STATE_ERROR) {
				if (!errorflag) {
					errorflag = 1;
					clearLED(9);
				}
				g_usb_p1_mask = 0;
			} else {
				if (runningdebugflag) {
					runningdebugflag = 0;
					MAX3421E_init();
					USB_init();
				}
				errorflag = 0;
				clearLED(9);
				g_usb_p1_mask = 0;
			}
		}

		// 3. Atualiza os registradores dos 2 controles no hardware do NES a cada iteracao
		update_dual_keycodes(keycode_pio);
	}
	return 0;
}
