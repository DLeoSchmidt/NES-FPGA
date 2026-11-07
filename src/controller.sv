// =============================================================================
// NES-FPGA Dual Controller Driver (Player 1 & Player 2)
// =============================================================================
// Implementa os shift registers seriais do controle clássico do NES nos endereços
// de memória mapeada I/O $4016 (Player 1) e $4017 (Player 2).
//
// Mapeamento dos bits (Ordem padrão do NES - Leitura de D7 até D0):
//   Bit 7: Botão A
//   Bit 6: Botão B
//   Bit 5: Botão Select
//   Bit 4: Botão Start
//   Bit 3: D-Pad Cima (Up)
//   Bit 2: D-Pad Baixo (Down)
//   Bit 1: D-Pad Esquerda (Left)
//   Bit 0: D-Pad Direita (Right)
// =============================================================================

module controller (
	input  logic        clk,
	input  logic [15:0] addr,
	input  logic [31:0] keycode,
	input  logic        wren,
	output logic [7:0]  dout
);

// Registradores de deslocamento independentes para Player 1 e Player 2
logic [7:0] data1;
logic [7:0] data2;

wire [7:0] p1_din = keycode[7:0];
wire [7:0] p2_din = keycode[15:8];

// Leitura assíncrona/combinacional:
// Garante que o barramento de dados 'databus' da CPU 6502 tenha o dado
// estável e correto IMEDIATAMENTE durante o ciclo de leitura, sem atraso de flip-flop.
assign dout = (addr == 16'h4017) ? {7'h00, data2[7]} : {7'h00, data1[7]};

always_ff @ (posedge clk) begin
	if (addr == 16'h4016 && wren) begin
		// Strobe do NES (escrita em $4016):
		// Recarrega os shift registers com o estado atual dos botões
		data1 <= p1_din;
		data2 <= p2_din;
	end else if (~wren) begin
		if (addr == 16'h4016) begin
			// Leitura serial do Player 1: desloca o registrador e preenche com 1
			data1 <= {data1[6:0], 1'b1};
		end else if (addr == 16'h4017) begin
			// Leitura serial do Player 2: desloca o registrador e preenche com 1
			data2 <= {data2[6:0], 1'b1};
		end
	end
end

endmodule
