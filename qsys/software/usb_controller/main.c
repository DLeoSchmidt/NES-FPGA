// ECE 385 USB Host Shield code + NES-FPGA PC Controller Bridge via JTAG UART
// Based on Circuits-at-home USB Host code 1.x & NES-FPGA by Ian Dailis
// Enhanced to support PC Keyboard/Gamepad input concurrently with USB Host Shield.

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

static BYTE addr = 1; 				// hard-wired USB address
const char* const devclasses[] = { " Uninitialized", " HID Keyboard", " HID Mouse", " Mass storage" };

/* =========================================================================
 * PROTOCOLO DO CONTROLE DE NES & MAPEAMENTO DE TECLAS
 * =========================================================================
 * Máscara de bits unificada (8 bits):
 *   Bit 0: RIGHT   (D-Pad Direita) -> Scancode 0x07 ('D')
 *   Bit 1: LEFT    (D-Pad Esquerda) -> Scancode 0x04 ('A')
 *   Bit 2: DOWN    (D-Pad Baixo)    -> Scancode 0x16 ('S')
 *   Bit 3: UP      (D-Pad Cima)     -> Scancode 0x1A ('W')
 *   Bit 4: START   (Botão Start)    -> Scancode 0x0B ('H')
 *   Bit 5: SELECT  (Botão Select)   -> Scancode 0x0A ('G')
 *   Bit 6: B       (Botão B)        -> Scancode 0x0E ('K')
 *   Bit 7: A       (Botão A)        -> Scancode 0x0F ('L')
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

/* Protocolo JTAG UART: Byte de sincronismo seguido pelo byte da máscara */
#define JTAG_SYNC_HEADER 0x5A

static volatile alt_u8 g_pc_buttons_mask = 0;   // Máscara recebida do PC via JTAG UART
static volatile alt_u8 g_usb_buttons_mask = 0;  // Máscara extraída do teclado USB físico
static alt_u8 g_jtag_state = 0;                // 0 = Aguardando 0x5A, 1 = Aguardando máscara

BYTE GetDriverandReport() {
	BYTE i;
	BYTE rcode;
	BYTE device = 0xFF;
	BYTE tmpbyte;

	DEV_RECORD* tpl_ptr;
	printf("Reached USB_STATE_RUNNING (0x40)\n");
	for (i = 1; i < USB_NUMDEVICES; i++) {
		tpl_ptr = GetDevtable(i);
		if (tpl_ptr->epinfo != NULL) {
			printf("Device: %d", i);
			printf("%s \n", devclasses[tpl_ptr->devclass]);
			device = tpl_ptr->devclass;
		}
	}
	// Query rate and protocol
	rcode = XferGetIdle(addr, 0, hid_device.interface, 0, &tmpbyte);
	if (rcode) {
		printf("GetIdle Error. Error code: %x \n", rcode);
	} else {
		printf("Update rate: %x \n", tmpbyte);
	}
	printf("Protocol: ");
	rcode = XferGetProto(addr, 0, hid_device.interface, &tmpbyte);
	if (rcode) {
		printf("GetProto Error. Error code %x \n", rcode);
	} else {
		printf("%d \n", tmpbyte);
	}
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

void printSignedHex0(signed char value) {
	BYTE tens = 0;
	BYTE ones = 0;
	WORD pio_val = IORD_ALTERA_AVALON_PIO_DATA(HEX_BASE);
	if (value < 0) {
		setLED(11);
		value = -value;
	} else {
		clearLED(11);
	}
	if (value / 100)
		setLED(13);
	else
		clearLED(13);

	value = value % 100;
	tens = value / 10;
	ones = value % 10;

	pio_val &= 0x00FF;
	pio_val |= (tens << 12);
	pio_val |= (ones << 8);

	IOWR_ALTERA_AVALON_PIO_DATA(HEX_BASE, pio_val);
}

void printSignedHex1(signed char value) {
	BYTE tens = 0;
	BYTE ones = 0;
	DWORD pio_val = IORD_ALTERA_AVALON_PIO_DATA(HEX_BASE);
	if (value < 0) {
		setLED(10);
		value = -value;
	} else {
		clearLED(10);
	}
	if (value / 100)
		setLED(12);
	else
		clearLED(12);

	value = value % 100;
	tens = value / 10;
	ones = value % 10;

	pio_val &= 0xFF00;
	pio_val |= (tens << 4);
	pio_val |= (ones << 0);

	IOWR_ALTERA_AVALON_PIO_DATA(HEX_BASE, pio_val);
}

void setKeycode(alt_u32 keycode)
{
	IOWR_ALTERA_AVALON_PIO_DATA(KEYCODE_BASE, keycode);
}

/* =========================================================================
 * Leitura Não-Bloqueante da FIFO de Recepção da JTAG UART
 * =========================================================================
 * Processa pacotes binários do PC [0x5A, <mask_byte>] sem interromper ou
 * atrasar o processamento do USB Host Shield ou o ciclo de jogo do NES.
 * ========================================================================= */
static void poll_jtag_uart(void) {
	while (1) {
		alt_u32 jtag_data = IORD_ALTERA_AVALON_JTAG_UART_DATA(JTAG_UART_0_BASE);
		if (!(jtag_data & ALTERA_AVALON_JTAG_UART_DATA_RVALID_MSK)) {
			// Não há mais bytes no buffer da JTAG UART
			break;
		}

		alt_u8 rx_byte = (alt_u8)(jtag_data & ALTERA_AVALON_JTAG_UART_DATA_DATA_MSK);

		if (g_jtag_state == 0) {
			if (rx_byte == JTAG_SYNC_HEADER) {
				g_jtag_state = 1;
			}
		} else {
			// Segundo byte: máscara dos botões
			g_pc_buttons_mask = rx_byte;
			g_jtag_state = 0;
		}
	}
}

/* =========================================================================
 * Síntese e Fusão de Entradas (Merge de Teclado Físico + Teclado do PC)
 * =========================================================================
 * Combina os botões do teclado USB físico no shield com os botões do PC.
 * Empacota os scancodes correspondentes nos 4 slots do registrador de 32 bits
 * esperado pelo módulo SystemVerilog 'controller.sv'.
 * ========================================================================= */
static void update_combined_keycode(volatile unsigned int* keycode_pio) {
	alt_u8 combined_mask = g_usb_buttons_mask | g_pc_buttons_mask;
	alt_u32 synthesized_keycode = 0;
	int slot = 0;

	// Preenche os 4 bytes do registrador keycode (keycode[31:24], [23:16], [15:8], [7:0])
	// O módulo controller.sv aceita o scancode em qualquer um dos 4 bytes.
	if ((combined_mask & NES_BTN_A) && slot < 4) {
		synthesized_keycode |= ((alt_u32)HID_CODE_A << (slot * 8));
		slot++;
	}
	if ((combined_mask & NES_BTN_B) && slot < 4) {
		synthesized_keycode |= ((alt_u32)HID_CODE_B << (slot * 8));
		slot++;
	}
	if ((combined_mask & NES_BTN_UP) && slot < 4) {
		synthesized_keycode |= ((alt_u32)HID_CODE_UP << (slot * 8));
		slot++;
	}
	if ((combined_mask & NES_BTN_DOWN) && slot < 4) {
		synthesized_keycode |= ((alt_u32)HID_CODE_DOWN << (slot * 8));
		slot++;
	}
	if ((combined_mask & NES_BTN_LEFT) && slot < 4) {
		synthesized_keycode |= ((alt_u32)HID_CODE_LEFT << (slot * 8));
		slot++;
	}
	if ((combined_mask & NES_BTN_RIGHT) && slot < 4) {
		synthesized_keycode |= ((alt_u32)HID_CODE_RIGHT << (slot * 8));
		slot++;
	}
	if ((combined_mask & NES_BTN_START) && slot < 4) {
		synthesized_keycode |= ((alt_u32)HID_CODE_START << (slot * 8));
		slot++;
	}
	if ((combined_mask & NES_BTN_SELECT) && slot < 4) {
		synthesized_keycode |= ((alt_u32)HID_CODE_SELECT << (slot * 8));
		slot++;
	}

	*keycode_pio = synthesized_keycode;

	// Atualiza os displays de 7 segmentos para debug visual imediato
	printSignedHex0((signed char)(synthesized_keycode & 0xFF));
	printSignedHex1((signed char)((synthesized_keycode >> 8) & 0xFF));
}

int main() {
	volatile unsigned int* keycode_pio = (volatile unsigned int*)KEYCODE_BASE;
	BYTE rcode;
	BOOT_MOUSE_REPORT buf;		// USB mouse report
	BOOT_KBD_REPORT kbdbuf;

	BYTE runningdebugflag = 0;
	BYTE errorflag = 0;
	BYTE device = 0;
	unsigned int loop_counter = 0;

	printf("NES-FPGA Controller Bridge Initializing...\n");
	printf("MAX3421E USB Host + JTAG UART PC Bridge ready.\n");

	// Inicializa o chip USB MAX3421E
	MAX3421E_init();
	USB_init();

	while (1) {
		// 1. Polling da JTAG UART com prioridade máxima (baixa latência para o PC)
		poll_jtag_uart();

		// 2. Tarefas do USB Host Shield (MAX3421E)
		MAX3421E_Task();
		USB_Task();

		if (GetUsbTaskState() == USB_STATE_RUNNING) {
			if (!runningdebugflag) {
				runningdebugflag = 1;
				setLED(9);
				device = GetDriverandReport();
			} else if (device == 1) {
				// Teclado USB físico conectado ao shield
				rcode = kbdPoll(&kbdbuf);
				if (rcode == hrSUCCESS) {
					// Extrai máscara dos botões físicos a partir dos scancodes HID
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
					g_usb_buttons_mask = physical_mask;
				}
			} else if (device == 2) {
				// Mouse USB (preservado do código original)
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
				printf("USB Shield Error/Not Connected (PC Controller remains active)\n");
			}
			g_usb_buttons_mask = 0; // Nenhum botão pressionado no shield ausente
		} else {
			if (runningdebugflag) {
				runningdebugflag = 0;
				MAX3421E_init();
				USB_init();
			}
			errorflag = 0;
			clearLED(9);
			g_usb_buttons_mask = 0;
		}

		// 3. Atualiza o PIO do NES com a união das entradas (PC + Teclado USB)
		update_combined_keycode(keycode_pio);

		// 4. Log periódico não-bloqueante (evita flood no canal serial)
		loop_counter++;
		if (loop_counter % 20000 == 0) {
			// Mantém atividade sem saturar o JTAG UART
		}
	}
	return 0;
}
