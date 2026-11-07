// =============================================================================
// NES-FPGA Dual Controller Driver (Player 1 & Player 2)
// =============================================================================
// Implementa com precisão de ciclo os shift registers seriais do controle
// do NES (chips CMOS 4021) nos endereços I/O $4016 (Player 1) e $4017 (Player 2).
//
// Mapeamento dos bits (Ordem padrão do NES - Leitura sequencial de D7 a D0):
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
	input  logic        clk,        // Clock da CPU 6502 (cpu_clk ~1.79 MHz)
	input  logic [15:0] addr,       // Barramento de endereços da CPU
	input  logic [31:0] keycode,    // Entradas dos controles (P1 em [7:0], P2 em [15:8])
	input  logic        wren,       // Habilitação de escrita (~cpu_read)
	input  logic [7:0]  din,        // Barramento de dados da CPU (cpu_dout)
	output logic [7:0]  dout        // Dado lido pela CPU (controller_dout)
);

// Registradores de deslocamento independentes de 8 bits para cada jogador
logic [7:0] shift_reg1;
logic [7:0] shift_reg2;
logic       strobe;

wire [7:0] p1_din = keycode[7:0];
wire [7:0] p2_din = keycode[15:8];

// =============================================================================
// Saída Combinacional (Assíncrona ao Barramento da CPU)
// =============================================================================
// O barramento de dados do 6502 lê de forma assíncrona dentro do ciclo ativo.
// Ao separar completamente as saídas de $4016 e $4017, eliminamos a interferência
// mútua (race condition) de leituras intercaladas de Player 1 e Player 2.
always_comb begin
	if (addr == 16'h4016) begin
		// Leitura Player 1 ($4016):
		// Enquanto strobe estiver ativo (1), expõe o Botão A continuamente.
		// Quando strobe inativo (0), expõe o bit do topo do shift_reg1.
		dout = strobe ? {7'b0000000, p1_din[7]} : {7'b0000000, shift_reg1[7]};
	end else if (addr == 16'h4017) begin
		// Leitura Player 2 ($4017):
		// Enquanto strobe estiver ativo (1), expõe o Botão A do P2 continuamente.
		// Quando strobe inativo (0), expõe o bit do topo do shift_reg2.
		dout = strobe ? {7'b0000000, p2_din[7]} : {7'b0000000, shift_reg2[7]};
	end else begin
		dout = 8'h00;
	end
end

// =============================================================================
// Lógica Sequencial de Strobe e Shift Registers (Posedge cpu_clk)
// =============================================================================
always_ff @ (posedge clk) begin
	if (addr == 16'h4016 && wren) begin
		// Escrita em $4016 (Strobe dos Controles do NES):
		// O bit 0 do acumulador da CPU controla o modo do chip CMOS 4021:
		//   din[0] == 1 -> Parallel Load ativo (carrega estado instantâneo dos 8 botões)
		//   din[0] == 0 -> Latch/Serial Shift ativo (trava os botões para leitura)
		strobe     <= din[0];
		shift_reg1 <= p1_din;
		shift_reg2 <= p2_din;
	end else if (~wren && ~strobe) begin
		// Modo Leitura Serial (Strobe inativo):
		// Cada leitura desloca EXCLUSIVAMENTE o registrador do respectivo jogador,
		// preenchendo os bits restantes com '1' (padrão de hardware do NES original).
		if (addr == 16'h4016) begin
			shift_reg1 <= {shift_reg1[6:0], 1'b1};
		end else if (addr == 16'h4017) begin
			shift_reg2 <= {shift_reg2[6:0], 1'b1};
		end
	end else if (strobe) begin
		// Enquanto strobe permanecer em nível lógico alto, os dados são continuamente
		// atualizados com o estado físico atual dos botões sem sofrer deslocamento.
		shift_reg1 <= p1_din;
		shift_reg2 <= p2_din;
	end
end

endmodule
