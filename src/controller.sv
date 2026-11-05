// =============================================================================
// NES-FPGA Dual Controller Driver (Player 1 & Player 2)
// =============================================================================
// Implementa os shift registers seriais do controle clássico do NES nos endereços
// de memória mapeada I/O $4016 (Player 1) e $4017 (Player 2).
//
// Mapeamento dos bits (Ordem padrão do NES - Leitura MSB para LSB):
//   Bit 7: Botão A
//   Bit 6: Botão B
//   Bit 5: Botão Select
//   Bit 4: Botão Start
//   Bit 3: D-Pad Cima (Up)
//   Bit 2: D-Pad Baixo (Down)
//   Bit 1: D-Pad Esquerda (Left)
//   Bit 0: D-Pad Direita (Right)
//
// Entrada 'keycode' (32 bits):
//   - Modo Dual Mask (Padrão):
//       keycode[7:0]   -> Máscara de 8 bits do Player 1
//       keycode[15:8]  -> Máscara de 8 bits do Player 2
//       keycode[31:16] -> Telemetria / Reservado (0x0000)
//   - Modo Legado USB HID:
//       Se keycode[31:24] != 0, mantém decodificação dos scancodes USB originais.
// =============================================================================

module controller (
	input logic clk,
	input logic [15:0] addr,
	input logic [31:0] keycode,
	input logic wren,
	output logic [7:0] dout
);

// Shift registers independentes para Player 1 e Player 2
logic [7:0] data1;
logic [7:0] data2;

logic [7:0] p1_din;
logic [7:0] p2_din;

// Decodificação das entradas (Dual Mask vs Scancodes Legados)
always_comb begin
	if (keycode[31:24] != 8'h00) begin
		// Modo Legado de Scancodes USB HID
		p1_din = 8'h00;
		if (keycode[31:24] == 8'h1A || keycode[23:16] == 8'h1A || keycode[15:8] == 8'h1A || keycode[7:0] == 8'h1A)
			p1_din[3] = 1'b1; /* W --> UP */
		if (keycode[31:24] == 8'h16 || keycode[23:16] == 8'h16 || keycode[15:8] == 8'h16 || keycode[7:0] == 8'h16)
			p1_din[2] = 1'b1; /* S --> DOWN */
		if (keycode[31:24] == 8'h04 || keycode[23:16] == 8'h04 || keycode[15:8] == 8'h04 || keycode[7:0] == 8'h04)
			p1_din[1] = 1'b1; /* A --> LEFT */
		if (keycode[31:24] == 8'h07 || keycode[23:16] == 8'h07 || keycode[15:8] == 8'h07 || keycode[7:0] == 8'h07)
			p1_din[0] = 1'b1; /* D --> RIGHT */
		if (keycode[31:24] == 8'h0F || keycode[23:16] == 8'h0F || keycode[15:8] == 8'h0F || keycode[7:0] == 8'h0F)
			p1_din[7] = 1'b1; /* L --> A */
		if (keycode[31:24] == 8'h0E || keycode[23:16] == 8'h0E || keycode[15:8] == 8'h0E || keycode[7:0] == 8'h0E)
			p1_din[6] = 1'b1; /* K --> B */
		if (keycode[31:24] == 8'h0A || keycode[23:16] == 8'h0A || keycode[15:8] == 8'h0A || keycode[7:0] == 8'h0A)
			p1_din[5] = 1'b1; /* G --> SELECT */
		if (keycode[31:24] == 8'h0B || keycode[23:16] == 8'h0B || keycode[15:8] == 8'h0B || keycode[7:0] == 8'h0B)
			p1_din[4] = 1'b1; /* H --> START */

		p2_din = 8'h00; // No modo legado, P2 desativado
	end else begin
		// Modo Dual Mask de Alta Performance (P1 e P2 independentes)
		p1_din = keycode[7:0];
		p2_din = keycode[15:8];
	end
end

// Lógica de Leitura e Escrita dos Controles (Strobe e Shift Registers)
always_ff @ (posedge clk) begin
	if (addr == 16'h4016 || addr == 16'h4017) begin
		if (wren) begin
			// Strobe do NES: recarrega os shift registers de ambos os controles
			// e coloca o primeiro bit (Botão A = bit 7) disponível no barramento.
			data1 <= p1_din << 1;
			data2 <= p2_din << 1;
			if (addr == 16'h4017)
				dout <= {7'h00, p2_din[7]};
			else
				dout <= {7'h00, p1_din[7]};
		end else begin
			// Leitura Serial (Strobe inativo): desloca 1 bit a cada leitura
			if (addr == 16'h4016) begin
				// Player 1
				dout  <= {7'h00, data1[7]};
				data1 <= data1 << 1;
			end else if (addr == 16'h4017) begin
				// Player 2
				dout  <= {7'h00, data2[7]};
				data2 <= data2 << 1;
			end
		end
	end
end

endmodule
