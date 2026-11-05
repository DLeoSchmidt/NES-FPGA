# Jogos Compatíveis com NES-FPGA (Mapper 0 / NROM)

Lista de jogos extraída diretamente do repositório oficial [NES Directory](https://nesdir.github.io/mapper0.html), filtrada exclusivamente para versões em **Inglês** (priorizando **USA** quando disponível).

> **Critérios de Compatibilidade no Emulador Atual:**
> - **Mapper:** 0 (NROM-128 e NROM-256).
> - **Mirroring:** O emulador atual possui lógica dedicada para **Espelhamento Vertical** (`Vertical Mirroring`). Jogos de tela única ou com espelhamento vertical funcionam de forma 100% nativa.
> - **Tamanho:** PRG-ROM de 16 KB ou 32 KB, CHR-ROM de 8 KB.

## Índice Rápido

| # | Título | Região | Mirroring | PCB Principal | CRC32 | Link |
| :-: | :--- | :-: | :-: | :--- | :-: | :-: |
| 1 | [10-Yard Fight](#10-yard-fight) | USA | **Vertical** | `NES-NROM-256-02` | `3D564757` | [nesdir](https://nesdir.github.io/3D564757_USA.html) |
| 2 | [1942](#1942) | USA | **Vertical** | `NES-NROM-256-03` | `171251E3` | [nesdir](https://nesdir.github.io/171251E3_USA.html) |
| 3 | [Balloon Fight](#balloon-fight) | USA | **Vertical** | `NES-NROM-128-02` | `401349A8` | [nesdir](https://nesdir.github.io/401349A8_USA.html) |
| 4 | [Baseball](#baseball) | USA | **Vertical** | `NES-NROM-128-01` | `AFDCBD24` | [nesdir](https://nesdir.github.io/AFDCBD24_USA.html) |
| 5 | [Bomberman](#bomberman) | USA | **Horizontal** | `NES-NROM-128-04` | `DB9DCF89` | [nesdir](https://nesdir.github.io/DB9DCF89_USA.html) |
| 6 | [BurgerTime](#burgertime) | USA | **Vertical** | `NES-NROM-128-02` | `DAF9D7E3` | [nesdir](https://nesdir.github.io/DAF9D7E3_USA.html) |
| 7 | [Chubby Cherub](#chubby-cherub) | USA | **Horizontal** | `NES-NROM-256-01` | `77833016` | [nesdir](https://nesdir.github.io/77833016_USA.html) |
| 8 | [Clu Clu Land](#clu-clu-land) | USA | **Vertical** | `NES-RROM-128-01` | `48F68D40` | [nesdir](https://nesdir.github.io/48F68D40_USA.html) |
| 9 | [Defender II](#defender-ii) | USA | **Horizontal** | `NES-NROM-128-04` | `A2AF25D0` | [nesdir](https://nesdir.github.io/A2AF25D0_USA.html) |
| 10 | [Devil World](#devil-world) | Europe | **Vertical** | `NES-NROM-128-03` | `0C783F0C` | [nesdir](https://nesdir.github.io/0C783F0C_Europe.html) |
| 11 | [Dig Dug II: Trouble in Paradise](#dig-dug-ii-trouble-in-paradise) | USA | **Horizontal** | `NES-NROM-256-05` | `DBB06A25` | [nesdir](https://nesdir.github.io/DBB06A25_USA.html) |
| 12 | [Donkey Kong](#donkey-kong) | USA | **Vertical** | `NES-NROM-128-01` | `6F97C721` | [nesdir](https://nesdir.github.io/6F97C721_USA.html) |
| 13 | [Donkey Kong 3](#donkey-kong-3) | USA | **Horizontal** | `NES-NROM-128-02` | `B3D74C0D` | [nesdir](https://nesdir.github.io/B3D74C0D_USA.html) |
| 14 | [Donkey Kong Jr.](#donkey-kong-jr-) | USA | **Horizontal** | `NES-NROM-128-01` | `4864C304` | [nesdir](https://nesdir.github.io/4864C304_USA.html) |
| 15 | [Donkey Kong Jr. Math](#donkey-kong-jr-math) | USA | **Horizontal** | `NES-NROM-128-01` | `0504B007` | [nesdir](https://nesdir.github.io/0504B007_USA.html) |
| 16 | [Duck Hunt](#duck-hunt) | USA | **Horizontal** | `NES-NROM-128-02` | `24598791` | [nesdir](https://nesdir.github.io/24598791_USA.html) |
| 17 | [Elevator Action](#elevator-action) | USA | **Vertical** | `NES-NROM-256-03` | `2AC87283` | [nesdir](https://nesdir.github.io/2AC87283_USA.html) |
| 18 | [Excitebike](#excitebike) | USA | **Horizontal** | `NES-NROM-128-02` | `49AEB3A6` | [nesdir](https://nesdir.github.io/49AEB3A6_USA.html) |
| 19 | [Galaga: Demons of Death](#galaga-demons-of-death) | USA | **Vertical** | `NES-NROM-256-04` | `1DB07C0D` | [nesdir](https://nesdir.github.io/1DB07C0D_USA.html) |
| 20 | [Game Genie](#game-genie) | USA | **Vertical** | `CODEMASTERS 9205` | `1A3A22A1` | [nesdir](https://nesdir.github.io/1A3A22A1_USA.html) |
| 21 | [Golf](#golf) | USA | **Vertical** | `NES-NROM-128-01` | `E7D2C49D` | [nesdir](https://nesdir.github.io/E7D2C49D_USA.html) |
| 22 | [Gyromite](#gyromite) | USA | **Horizontal** | `3A` | `023A5A32` | [nesdir](https://nesdir.github.io/023A5A32_USA.html) |
| 23 | [Hogan's Alley](#hogan-s-alley) | USA | **Horizontal** | `NES-NROM-128-01` | `FF24D794` | [nesdir](https://nesdir.github.io/FF24D794_USA.html) |
| 24 | [Hydlide](#hydlide) | USA | **Vertical** | `NES-NROM-256-05` | `77BF8B23` | [nesdir](https://nesdir.github.io/77BF8B23_USA.html) |
| 25 | [Ice Climber](#ice-climber) | USA | **Vertical** | `NES-NROM-128-01` | `FB98D46E` | [nesdir](https://nesdir.github.io/FB98D46E_USA.html) |
| 26 | [Ice Hockey](#ice-hockey) | USA | **Horizontal** | `NES-NROM-256-03` | `AE64CA77` | [nesdir](https://nesdir.github.io/AE64CA77_USA.html) |
| 27 | [Kung Fu](#kung-fu) | USA | **Horizontal** | `NES-NROM-256-01` | `D5C64257` | [nesdir](https://nesdir.github.io/D5C64257_USA.html) |
| 28 | [Lode Runner](#lode-runner) | USA | **Horizontal** | `NES-NROM-128-03` | `AF5676DE` | [nesdir](https://nesdir.github.io/AF5676DE_USA.html) |
| 29 | [Lunar Pool](#lunar-pool) | USA | **Horizontal** | `NES-NROM-128-03` | `988B446D` | [nesdir](https://nesdir.github.io/988B446D_USA.html) |
| 30 | [M.U.S.C.L.E.: Tag Team Match](#m-u-s-c-l-e-tag-team-match) | USA | **Horizontal** | `NES-NROM-128-02` | `8FF31896` | [nesdir](https://nesdir.github.io/8FF31896_USA.html) |
| 31 | [Mach Rider](#mach-rider) | USA | **Horizontal** | `NES-NROM-256-01` | `59977A46` | [nesdir](https://nesdir.github.io/59977A46_USA.html) |
| 32 | [Magmax](#magmax) | USA | **Vertical** | `NES-NROM-256-04` | `81389607` | [nesdir](https://nesdir.github.io/81389607_USA.html) |
| 33 | [Mario Bros.](#mario-bros-) | USA | **Vertical** | `NES-NROM-128-02` | `C4C3949A` | [nesdir](https://nesdir.github.io/C4C3949A_USA.html) |
| 34 | [Millipede](#millipede) | USA | **Horizontal** | `NES-NROM-128-04` | `AE52DECE` | [nesdir](https://nesdir.github.io/AE52DECE_USA.html) |
| 35 | [Ms. Pac-Man](#ms-pac-man) | USA | **Horizontal** | `NES-NROM-256-06` | `B6D2D300` | [nesdir](https://nesdir.github.io/B6D2D300_USA.html) |
| 36 | [Othello](#othello) | USA | **Vertical** | `NES-NROM-256-04` | `699FA085` | [nesdir](https://nesdir.github.io/699FA085_USA.html) |
| 37 | [Pac-Man](#pac-man) | USA | **Vertical** | `NES-NROM-128-06` | `9E4E9CC2` | [nesdir](https://nesdir.github.io/9E4E9CC2_USA.html) |
| 38 | [Pinball](#pinball) | USA | **Vertical** | `2` | `035DC2E9` | [nesdir](https://nesdir.github.io/035DC2E9_USA.html) |
| 39 | [Popeye](#popeye) | USA | **Vertical** | `NES-NROM-128-01` | `70860FCA` | [nesdir](https://nesdir.github.io/70860FCA_USA.html) |
| 40 | [Raid on Bungeling Bay](#raid-on-bungeling-bay) | USA | **Horizontal** | `NES-NROM-128-03` | `D308D52C` | [nesdir](https://nesdir.github.io/D308D52C_USA.html) |
| 41 | [Road Fighter](#road-fighter) | Australia | **Vertical** | `NES-NROM-128-06` | `719571B3` | [nesdir](https://nesdir.github.io/719571B3_Australia.html) |
| 42 | [Seicross](#seicross) | USA | **Horizontal** | `NES-NROM-256-04` | `27AA3933` | [nesdir](https://nesdir.github.io/27AA3933_USA.html) |
| 43 | [Slalom](#slalom) | USA | **Horizontal** | `NES-NROM-256-02` | `86670C93` | [nesdir](https://nesdir.github.io/86670C93_USA.html) |
| 44 | [Soccer](#soccer) | USA | **Horizontal** | `NES-NROM-256-01` | `657F7875` | [nesdir](https://nesdir.github.io/657F7875_USA.html) |
| 45 | [Spelunker](#spelunker) | USA | **Horizontal** | `NES-NROM-256-03` | `99D15A91` | [nesdir](https://nesdir.github.io/99D15A91_USA.html) |
| 46 | [Spy vs. Spy](#spy-vs-spy) | USA | **Horizontal** | `NES-NROM-256-04` | `C4A02712` | [nesdir](https://nesdir.github.io/C4A02712_USA.html) |
| 47 | [Sqoon](#sqoon) | USA | **Horizontal** | `NES-NROM-256-03` | `44F34172` | [nesdir](https://nesdir.github.io/44F34172_USA.html) |
| 48 | [Stack-Up](#stack-up) | USA | **Vertical** | `HVC-NROM-256K-02` | `DF67DAA1` | [nesdir](https://nesdir.github.io/DF67DAA1_USA.html) |
| 49 | [Super Mario Bros.](#super-mario-bros-) | USA | **Horizontal** | `NES-NROM-256-01` | `D445F698` | [nesdir](https://nesdir.github.io/D445F698_USA.html) |
| 50 | [Tag Team Wrestling](#tag-team-wrestling) | USA | **Vertical** | `NES-NROM-256-02` | `BF250AF2` | [nesdir](https://nesdir.github.io/BF250AF2_USA.html) |
| 51 | [Tennis](#tennis) | USA | **Vertical** | `NES-NROM-128-01` | `D4D9E21A` | [nesdir](https://nesdir.github.io/D4D9E21A_USA.html) |
| 52 | [Urban Champion](#urban-champion) | USA | **Horizontal** | `NES-NROM-128-02` | `656D4265` | [nesdir](https://nesdir.github.io/656D4265_USA.html) |
| 53 | [Virus](#virus) | USA | **Vertical** | `NES-NROM-256-02` | `A9068D17` | [nesdir](https://nesdir.github.io/A9068D17_USA.html) |
| 54 | [Volleyball](#volleyball) | USA | **Horizontal** | `NES-NROM-256-02` | `27777635` | [nesdir](https://nesdir.github.io/27777635_USA.html) |
| 55 | [Wild Gunman](#wild-gunman) | USA | **Horizontal** | `NES-NROM-128-01` | `B8B9ACA3` | [nesdir](https://nesdir.github.io/B8B9ACA3_USA.html) |
| 56 | [Wrecking Crew](#wrecking-crew) | USA | **Vertical** | `NES-NROM-256-01` | `9B506A48` | [nesdir](https://nesdir.github.io/9B506A48_USA.html) |
| 57 | [Xevious](#xevious) | Europe | **Vertical** | `NES-NROM-256-05` | `D745D7CB` | [nesdir](https://nesdir.github.io/D745D7CB_Europe.html) |
| 58 | [Xevious: The Avenger](#xevious-the-avenger) | USA | **Vertical** | `NES-NROM-256-04` | `DFD70E27` | [nesdir](https://nesdir.github.io/DFD70E27_USA.html) |

---

## Detalhes Técnicos dos Jogos

### <a id="10-yard-fight"></a>10-Yard Fight (USA)

- **Publisher:** Nintendo
- **Catalog ID:** `NES-TY-USA`
- **Página no NES Directory:** [https://nesdir.github.io/3D564757_USA.html](https://nesdir.github.io/3D564757_USA.html)

#### Revisão de Placa #1: `NES-NROM-256-02`

```yaml
Type: NES-NROM-256
PCB: NES-NROM-256-02
Mapper: 0
CIC Type: 3193A
Mirroring: Vertical
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `3D564757` | `016818BF6BAAF779F4F5C1658880B81D23EA40CA` |
| PRG | NES-TY-0 PRG | 32k | `DF58FC5A` | `7CC69B39ECE2168574599D45AB8452EDD4F5A3A1` |
| CHR | NES-TY-0 CHR | 8k | `2B8336EE` | `6B40A3B7AD6214ABF9C35BCBF89D9C1DA06F47A0` |

#### Revisão de Placa #2: `NES-NROM-256-03`

```yaml
Type: NES-NROM-256
PCB: NES-NROM-256-03
Mapper: 0
CIC Type: 6113
Mirroring: Vertical
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `3D564757` | `016818BF6BAAF779F4F5C1658880B81D23EA40CA` |
| PRG | NES-TY-0 PRG | 32k | `DF58FC5A` | `7CC69B39ECE2168574599D45AB8452EDD4F5A3A1` |
| CHR | NES-TY-0 CHR | 8k | `2B8336EE` | `6B40A3B7AD6214ABF9C35BCBF89D9C1DA06F47A0` |

#### Revisão de Placa #3: `NES-NROM-256-04`

```yaml
Type: NES-NROM-256
PCB: NES-NROM-256-04
Mapper: 0
CIC Type: 6113A
Mirroring: Vertical
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `3D564757` | `016818BF6BAAF779F4F5C1658880B81D23EA40CA` |
| PRG | NES-TY-0 PRG | 32k | `DF58FC5A` | `7CC69B39ECE2168574599D45AB8452EDD4F5A3A1` |
| CHR | NES-TY-0 CHR | 8k | `2B8336EE` | `6B40A3B7AD6214ABF9C35BCBF89D9C1DA06F47A0` |

---

### <a id="1942"></a>1942 (USA)

- **Publisher:** Capcom
- **Catalog ID:** `NES-NF-USA`
- **Página no NES Directory:** [https://nesdir.github.io/171251E3_USA.html](https://nesdir.github.io/171251E3_USA.html)

#### Revisão de Placa #1: `NES-NROM-256-03`

```yaml
Type: NES-NROM-256
PCB: NES-NROM-256-03
Mapper: 0
CIC Type: 3193A
Mirroring: Vertical
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `171251E3` | `7F57EACE7CADA7C36412A50F2299231B304527A8` |
| PRG | CAP-19-0 PRG | 32k | `C4E8C04A` | `D608F769333B13DA9C67F07599E405944893A950` |
| CHR | CAP-19-0 CHR | 8k | `03379B76` | `D2A6CA1CDD8935525F59F1D38806B2296CB12A12` |

#### Revisão de Placa #2: `NES-NROM-256-05`

```yaml
Type: NES-NROM-256
PCB: NES-NROM-256-05
Mapper: 0
CIC Type: 6113B1
Mirroring: Vertical
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `171251E3` | `7F57EACE7CADA7C36412A50F2299231B304527A8` |
| PRG | CAP-19-0 PRG | 32k | `C4E8C04A` | `D608F769333B13DA9C67F07599E405944893A950` |
| CHR | CAP-19-0 CHR | 8k | `03379B76` | `D2A6CA1CDD8935525F59F1D38806B2296CB12A12` |

---

### <a id="balloon-fight"></a>Balloon Fight (USA)

- **Publisher:** Nintendo
- **Catalog ID:** `NES-BF-USA`
- **Página no NES Directory:** [https://nesdir.github.io/401349A8_USA.html](https://nesdir.github.io/401349A8_USA.html)

#### Revisão de Placa #1: `NES-NROM-128-02`

```yaml
Type: NES-NROM-128
PCB: NES-NROM-128-02
Mapper: 0
CIC Type: 3193A
Mirroring: Vertical
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `401349A8` | `57F86E49372AE44DA79F269973E7DB4F443D0B98` |
| PRG | NES-BF-0 PRG | 16k | `BD2E9025` | `6742FA2EA498E5B73DC2024AD3888A64E6B894E4` |
| CHR | HVC-BF-0 CHR | 8k | `C642A1DF` | `E73CD3D4C0BAD8E6F7A1AA6A580F3817A83756A9` |

#### Revisão de Placa #2: `NES-NROM-128-04`

```yaml
Type: NES-NROM-128
PCB: NES-NROM-128-04
Mapper: 0
CIC Type: 6113B1
Mirroring: Vertical
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `401349A8` | `57F86E49372AE44DA79F269973E7DB4F443D0B98` |
| PRG | NES-BF-0 PRG | 16k | `BD2E9025` | `6742FA2EA498E5B73DC2024AD3888A64E6B894E4` |
| CHR | HVC-BF-0 CHR | 8k | `C642A1DF` | `E73CD3D4C0BAD8E6F7A1AA6A580F3817A83756A9` |

---

### <a id="baseball"></a>Baseball (USA)

- **Publisher:** Nintendo
- **Catalog ID:** `NES-BA-USA`
- **Página no NES Directory:** [https://nesdir.github.io/AFDCBD24_USA.html](https://nesdir.github.io/AFDCBD24_USA.html)

#### Revisão de Placa #1: `NES-NROM-128-01`

```yaml
Type: NES-NROM-128
PCB: NES-NROM-128-01
Mapper: 0
CIC Type: 3193
Mirroring: Vertical
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `AFDCBD24` | `1168BCADC228F43B7FD9C66187D5F309131DD847` |
| PRG | NES-BA-0 PRG | 16k | `39D1FA03` | `28D84CFEFA81BBFD3D26E0F70F1B9F53383E54AD` |
| CHR | NES-BA-0 CHR | 8k | `CDE71B82` | `296CCEF8A1FD9209F414CE0C788AB0DC95058242` |

#### Revisão de Placa #2: `NES-NROM-128-02`

```yaml
Type: NES-NROM-128
PCB: NES-NROM-128-02
Mapper: 0
CIC Type: 3193A
Mirroring: Vertical
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `AFDCBD24` | `1168BCADC228F43B7FD9C66187D5F309131DD847` |
| PRG | NES-BA-0 PRG | 16k | `39D1FA03` | `28D84CFEFA81BBFD3D26E0F70F1B9F53383E54AD` |
| CHR | NES-BA-0 CHR | 8k | `CDE71B82` | `296CCEF8A1FD9209F414CE0C788AB0DC95058242` |

#### Revisão de Placa #3: `NES-NROM-128-03`

```yaml
Type: NES-NROM-128
PCB: NES-NROM-128-03
Mapper: 0
CIC Type: 6113
Mirroring: Vertical
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `AFDCBD24` | `1168BCADC228F43B7FD9C66187D5F309131DD847` |
| PRG | NES-BA-0 PRG | 16k | `39D1FA03` | `28D84CFEFA81BBFD3D26E0F70F1B9F53383E54AD` |
| CHR | NES-BA-0 CHR | 8k | `CDE71B82` | `296CCEF8A1FD9209F414CE0C788AB0DC95058242` |

---

### <a id="bomberman"></a>Bomberman (USA)

- **Publisher:** Hudson Soft
- **Catalog ID:** `NES-BM-USA`
- **Página no NES Directory:** [https://nesdir.github.io/DB9DCF89_USA.html](https://nesdir.github.io/DB9DCF89_USA.html)

```yaml
Type: NES-NROM-128
PCB: NES-NROM-128-04
Mapper: 0
CIC Type: 6113B1
Mirroring: Horizontal
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `DB9DCF89` | `D2BF7BD570430902114F1E3393F1FEB8B1C76E4D` |
| PRG | NES-BM-0 PRG | 16k | `A913A222` | `10478E542C2A0632472480B72935DF21EA9EA1F1` |
| CHR | NES-BM-0 CHR | 8k | `1DB14E97` | `ED13E53286EC09393ACCDD19C7C796359FB97AEE` |

---

### <a id="burgertime"></a>BurgerTime (USA)

- **Publisher:** Data East
- **Catalog ID:** `NES-BR-USA`
- **Página no NES Directory:** [https://nesdir.github.io/DAF9D7E3_USA.html](https://nesdir.github.io/DAF9D7E3_USA.html)

#### Revisão de Placa #1: `NES-NROM-128-02`

```yaml
Type: NES-NROM-128
PCB: NES-NROM-128-02
Mapper: 0
CIC Type: 3193A
Mirroring: Vertical
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `DAF9D7E3` | `A1E0C590C038A71CAB862003372F5543395C0896` |
| PRG | NES-BR-0 PRG | 16k | `2B2D47F1` | `A1E87309B0C8199679E3DF167BE7D962FCE28242` |
| CHR | NES-BR-0 CHR | 8k | `6268215D` | `4BDF4A47B37AA9A94562B8620DD52768FFB6940F` |

#### Revisão de Placa #2: `NES-NROM-128-04`

```yaml
Type: NES-NROM-128
PCB: NES-NROM-128-04
Mapper: 0
CIC Type: 6113A
Mirroring: Vertical
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `DAF9D7E3` | `A1E0C590C038A71CAB862003372F5543395C0896` |
| PRG | NES-BR-0 PRG | 16k | `2B2D47F1` | `A1E87309B0C8199679E3DF167BE7D962FCE28242` |
| CHR | NES-BR-0 CHR | 8k | `6268215D` | `4BDF4A47B37AA9A94562B8620DD52768FFB6940F` |

#### Revisão de Placa #3: `NES-NROM-128-06`

```yaml
Type: NES-NROM-128
PCB: NES-NROM-128-06
Mapper: 0
CIC Type: 6113B1
Mirroring: Vertical
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `DAF9D7E3` | `A1E0C590C038A71CAB862003372F5543395C0896` |
| PRG | NES-BR-0 PRG | 16k | `2B2D47F1` | `A1E87309B0C8199679E3DF167BE7D962FCE28242` |
| CHR | NES-BR-0 CHR | 8k | `6268215D` | `4BDF4A47B37AA9A94562B8620DD52768FFB6940F` |

---

### <a id="chubby-cherub"></a>Chubby Cherub (USA)

- **Publisher:** Bandai
- **Catalog ID:** `NES-CB-USA`
- **Página no NES Directory:** [https://nesdir.github.io/77833016_USA.html](https://nesdir.github.io/77833016_USA.html)

```yaml
Type: NES-NROM-256
PCB: NES-NROM-256-01
Mapper: 0
CIC Type: 3193
Mirroring: Horizontal
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `77833016` | `A9CD3C29722050E9F149F24128BB478ADFBB8E7D` |
| PRG | NES-CB-0 PRG | 32k | `CCA983F8` | `8EFC7C62F5FE1170AA2ABA97E01661CEFD38D947` |
| CHR | NES-CB-0 CHR | 8k | `06DAD11C` | `3399233330919FEA6DBE627C2C2ACAE96AEC3B44` |

---

### <a id="clu-clu-land"></a>Clu Clu Land (USA)

- **Publisher:** Nintendo
- **Catalog ID:** `NES-CL-USA`
- **Página no NES Directory:** [https://nesdir.github.io/48F68D40_USA.html](https://nesdir.github.io/48F68D40_USA.html)

```yaml
Type: NES-RROM-128
PCB: NES-RROM-128-01
Mapper: 0
CIC Type: 3193
Mirroring: Vertical
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `48F68D40` | `B04D740D624329826035E9FFCEFA6BEDEBB4A80F` |
| PRG | HVC-CL-0 PRG | 16k | `23A60A62` | `36003DE2A208BF132F1ECBF7AF7EFD9095EF85C8` |
| CHR | HVC-CL-0 CHR | 8k | `A63B8B98` | `8DDF97DCC8E28F2218C4A4C8B3D9D527FA0525FB` |

---

### <a id="defender-ii"></a>Defender II (USA)

- **Publisher:** HAL Laboratory
- **Catalog ID:** `NES-SB-USA`
- **Página no NES Directory:** [https://nesdir.github.io/A2AF25D0_USA.html](https://nesdir.github.io/A2AF25D0_USA.html)

#### Revisão de Placa #1: `NES-NROM-128-04`

```yaml
Type: NES-NROM-128
PCB: NES-NROM-128-04
Mapper: 0
CIC Type: 6113A
Mirroring: Horizontal
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `A2AF25D0` | `7CBD0FBE356FFB45D42F76195A7714C06FA6350A` |
| PRG | NES-SB-0 PRG | 16k | `7BC98E11` | `07D0AF64B8F3092625A800DC4A4B9CE0F844AADF` |
| CHR | NES-SB-0 CHR | 8k | `3A034F6C` | `C722A00B9BB32DD990C2EA3A28B3EF07D614E173` |

#### Revisão de Placa #2: `NES-NROM-128-04`

```yaml
Type: NES-NROM-128
PCB: NES-NROM-128-04
Mapper: 0
CIC Type: 6113B1
Mirroring: Horizontal
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `A2AF25D0` | `7CBD0FBE356FFB45D42F76195A7714C06FA6350A` |
| PRG | NES-SB-0 PRG | 16k | `7BC98E11` | `07D0AF64B8F3092625A800DC4A4B9CE0F844AADF` |
| CHR | NES-SB-0 CHR | 8k | `3A034F6C` | `C722A00B9BB32DD990C2EA3A28B3EF07D614E173` |

---

### <a id="devil-world"></a>Devil World (Europe)

- **Publisher:** Nintendo
- **Catalog ID:** `NES-DD-EEC`
- **Página no NES Directory:** [https://nesdir.github.io/0C783F0C_Europe.html](https://nesdir.github.io/0C783F0C_Europe.html)

```yaml
Type: NES-NROM-128
PCB: NES-NROM-128-03
Mapper: 0
CIC Type: 3195A
Mirroring: Vertical
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `0C783F0C` | `C8EA77EFBF82F12836467CAA9012914AF12A87A3` |
| PRG | PAL-DD-0 PRG | 16k | `60CB6FF6` | `00A7345604A551750A3BCBDC6B25E4B461FFC136` |
| CHR | HVC-DD-0 CHR | 8k | `3A9AA7A1` | `7AF9C7EE2E1DFF8F4260F11CDB2ACEC613313093` |

---

### <a id="dig-dug-ii-trouble-in-paradise"></a>Dig Dug II: Trouble in Paradise (USA)

- **Publisher:** Bandai
- **Catalog ID:** `NES-I2-USA`
- **Página no NES Directory:** [https://nesdir.github.io/DBB06A25_USA.html](https://nesdir.github.io/DBB06A25_USA.html)

```yaml
Type: NES-NROM-256
PCB: NES-NROM-256-05
Mapper: 0
CIC Type: 6113B1
Mirroring: Horizontal
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `DBB06A25` | `6CF59A2D94DEF6C300CFC350C21ABD85F6B59BEF` |
| PRG | NES-I2-0 PRG | 32k | `4C6FAF64` | `0A2C4EFB6B47C8F90E7C0C9EC452CBBC66A99843` |
| CHR | NES-I2-0 CHR | 8k | `6D5CDCEB` | `86D9294B0B65667802F3A3538DB4312C1F10326D` |

---

### <a id="donkey-kong"></a>Donkey Kong (USA)

- **Publisher:** Nintendo
- **Catalog ID:** `NES-DK-USA`
- **Página no NES Directory:** [https://nesdir.github.io/6F97C721_USA.html](https://nesdir.github.io/6F97C721_USA.html)

```yaml
Type: NES-NROM-128
PCB: NES-NROM-128-01
Mapper: 0
CIC Type: 3193
Mirroring: Vertical
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `6F97C721` | `D222DBBA5BD3716BBF62CA91167C6A9D15C60065` |
| PRG | HVC-DK-1 PRG | 16k | `F56A5B10` | `2C4B1D653194DF0996D54D9DE9188B270D0337D9` |
| CHR | HVC-DK-0 CHR | 8k | `A21D7C2E` | `97C16CD6B1F3656428B682A23E6E4248C1CA3607` |

---

### <a id="donkey-kong-3"></a>Donkey Kong 3 (USA)

- **Publisher:** Nintendo
- **Catalog ID:** `NES-DT-USA`
- **Página no NES Directory:** [https://nesdir.github.io/B3D74C0D_USA.html](https://nesdir.github.io/B3D74C0D_USA.html)

#### Revisão de Placa #1: `NES-NROM-128-02`

```yaml
Type: NES-NROM-128
PCB: NES-NROM-128-02
Mapper: 0
CIC Type: 3193A
Mirroring: Horizontal
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `B3D74C0D` | `75E3AB6D075DFC20FA88DC8E420A489ACA94BEF6` |
| PRG | HVC-DT-0 PRG | 16k | `5EF4F30C` | `5B7BA89A601E47EA95EAD2ADFD99DF2ED85BE473` |
| CHR | HVC-DT-0 CHR | 8k | `85D06C57` | `803ADEF82721452704607FBF70027FF792636325` |

#### Revisão de Placa #2: `NES-NROM-128-03`

```yaml
Type: NES-NROM-128
PCB: NES-NROM-128-03
Mapper: 0
CIC Type: 6113
Mirroring: Horizontal
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `B3D74C0D` | `75E3AB6D075DFC20FA88DC8E420A489ACA94BEF6` |
| PRG | HVC-DT-0 PRG | 16k | `5EF4F30C` | `5B7BA89A601E47EA95EAD2ADFD99DF2ED85BE473` |
| CHR | HVC-DT-0 CHR | 8k | `85D06C57` | `803ADEF82721452704607FBF70027FF792636325` |

---

### <a id="donkey-kong-jr-"></a>Donkey Kong Jr. (USA)

- **Publisher:** Nintendo
- **Catalog ID:** `NES-JR-USA`
- **Página no NES Directory:** [https://nesdir.github.io/4864C304_USA.html](https://nesdir.github.io/4864C304_USA.html)

```yaml
Type: NES-NROM-128
PCB: NES-NROM-128-01
Mapper: 0
CIC Type: 3193
Mirroring: Horizontal
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `4864C304` | `5D8CBA2011229DC67CCFF6C99E647238F260E7AF` |
| PRG | HVC-JR-1 PRG | 16k | `CF6C88B6` | `CEFC276E7601D14C6A20E545F334281B7A9FE8DB` |
| CHR | HVC-JR-0 CHR | 8k | `852778AB` | `307F2245CCE164491012F75897EB984AF0C3F456` |

---

### <a id="donkey-kong-jr-math"></a>Donkey Kong Jr. Math (USA)

- **Publisher:** Nintendo
- **Catalog ID:** `NES-CA-USA`
- **Página no NES Directory:** [https://nesdir.github.io/0504B007_USA.html](https://nesdir.github.io/0504B007_USA.html)

#### Revisão de Placa #1: `NES-NROM-128-01`

```yaml
Type: NES-NROM-128
PCB: NES-NROM-128-01
Mapper: 0
CIC Type: 3193
Mirroring: Horizontal
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `0504B007` | `A5030E82D7C38F2D51016D947CB29E6FF788367C` |
| PRG | NES-CA-0 PRG | 16k | `66F11648` | `4E243D05D60EE578A720F6FADD6C3EBDE305605B` |
| CHR | NES-CA-0 CHR | 8k | `73329878` | `4C0C87F38AF851BD605CCD980FB87EF49DFE98C8` |

#### Revisão de Placa #2: `NES-NROM-128-02`

```yaml
Type: NES-NROM-128
PCB: NES-NROM-128-02
Mapper: 0
CIC Type: 3193A
Mirroring: Horizontal
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `0504B007` | `A5030E82D7C38F2D51016D947CB29E6FF788367C` |
| PRG | NES-CA-0 PRG | 16k | `66F11648` | `4E243D05D60EE578A720F6FADD6C3EBDE305605B` |
| CHR | NES-CA-0 CHR | 8k | `73329878` | `4C0C87F38AF851BD605CCD980FB87EF49DFE98C8` |

---

### <a id="duck-hunt"></a>Duck Hunt (USA)

- **Publisher:** Nintendo
- **Catalog ID:** `NES-DH-USA`
- **Página no NES Directory:** [https://nesdir.github.io/24598791_USA.html](https://nesdir.github.io/24598791_USA.html)

#### Revisão de Placa #1: `NES-NROM-128-02`

```yaml
Type: NES-NROM-128
PCB: NES-NROM-128-02
Mapper: 0
CIC Type: 3193A
Mirroring: Horizontal
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `24598791` | `FB853A77E02F1CEAE933DFF762CD0C2F6E0B2E27` |
| PRG | HVC-DH-0 PRG | 16k | `90CA616D` | `B742576317CD6A04CAAC25252D5593844C9A0BB6` |
| CHR | HVC-DH-0 CHR | 8k | `4E049E03` | `FFAD32A3BAB2FB3826BC554B1B9838E837513576` |

#### Revisão de Placa #2: `NES-NROM-128-03`

```yaml
Type: NES-NROM-128
PCB: NES-NROM-128-03
Mapper: 0
CIC Type: 6113
Mirroring: Horizontal
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `24598791` | `FB853A77E02F1CEAE933DFF762CD0C2F6E0B2E27` |
| PRG | HVC-DH-0 PRG | 16k | `90CA616D` | `B742576317CD6A04CAAC25252D5593844C9A0BB6` |
| CHR | HVC-DH-0 CHR | 8k | `4E049E03` | `FFAD32A3BAB2FB3826BC554B1B9838E837513576` |

---

### <a id="elevator-action"></a>Elevator Action (USA)

- **Publisher:** Taito
- **Catalog ID:** `NES-EA-USA`
- **Página no NES Directory:** [https://nesdir.github.io/2AC87283_USA.html](https://nesdir.github.io/2AC87283_USA.html)

#### Revisão de Placa #1: `NES-NROM-256-03`

```yaml
Type: NES-NROM-256
PCB: NES-NROM-256-03
Mapper: 0
CIC Type: 3193A
Mirroring: Vertical
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `2AC87283` | `C9723C2C2722D26DE6712695C104FB139A734500` |
| PRG | NES-EA-0 PRG | 32k | `0F6C01E3` | `39AC457DBEC9B7CCC0F58EF19458A199C3573027` |
| CHR | NES-EA-0 CHR | 8k | `D61F3210` | `E5D7E970F9A47F6F8AE3A267D44B4705452ADB56` |

#### Revisão de Placa #2: `NES-NROM-256-03`

```yaml
Type: NES-NROM-256
PCB: NES-NROM-256-03
Mapper: 0
CIC Type: 6113
Mirroring: Vertical
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `2AC87283` | `C9723C2C2722D26DE6712695C104FB139A734500` |
| PRG | NES-EA-0 PRG | 32k | `0F6C01E3` | `39AC457DBEC9B7CCC0F58EF19458A199C3573027` |
| CHR | NES-EA-0 CHR | 8k | `D61F3210` | `E5D7E970F9A47F6F8AE3A267D44B4705452ADB56` |

#### Revisão de Placa #3: `NES-NROM-256-04`

```yaml
Type: NES-NROM-256
PCB: NES-NROM-256-04
Mapper: 0
CIC Type: 6113A
Mirroring: Vertical
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `2AC87283` | `C9723C2C2722D26DE6712695C104FB139A734500` |
| PRG | NES-EA-0 PRG | 32k | `0F6C01E3` | `39AC457DBEC9B7CCC0F58EF19458A199C3573027` |
| CHR | NES-EA-0 CHR | 8k | `D61F3210` | `E5D7E970F9A47F6F8AE3A267D44B4705452ADB56` |

---

### <a id="excitebike"></a>Excitebike (USA)

- **Publisher:** Nintendo
- **Catalog ID:** `NES-EB-USA`
- **Página no NES Directory:** [https://nesdir.github.io/49AEB3A6_USA.html](https://nesdir.github.io/49AEB3A6_USA.html)

#### Revisão de Placa #1: `NES-NROM-128-02`

```yaml
Type: NES-NROM-128
PCB: NES-NROM-128-02
Mapper: 0
CIC Type: 3193A
Mirroring: Horizontal
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `49AEB3A6` | `BA8D9227A0D02B62EE6CB9E691FA5A5134C303A8` |
| PRG | HVC-EB-0 PRG | 16k | `3A94FA0B` | `6239E91CCEFDC017D233CBAE388C6568A17ED04B` |
| CHR | HVC-EB-0 CHR | 8k | `E5F72401` | `A8BF028E1A62677E48E88CF421BB2A8051EB800C` |

#### Revisão de Placa #2: `NES-NROM-128-03`

```yaml
Type: NES-NROM-128
PCB: NES-NROM-128-03
Mapper: 0
CIC Type: 6113A
Mirroring: Horizontal
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `49AEB3A6` | `BA8D9227A0D02B62EE6CB9E691FA5A5134C303A8` |
| PRG | HVC-EB-0 PRG | 16k | `3A94FA0B` | `6239E91CCEFDC017D233CBAE388C6568A17ED04B` |
| CHR | HVC-EB-0 CHR | 8k | `E5F72401` | `A8BF028E1A62677E48E88CF421BB2A8051EB800C` |

#### Revisão de Placa #3: `NES-NROM-128-04`

```yaml
Type: NES-NROM-128
PCB: NES-NROM-128-04
Mapper: 0
CIC Type: 6113A
Mirroring: Horizontal
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `49AEB3A6` | `BA8D9227A0D02B62EE6CB9E691FA5A5134C303A8` |
| PRG | HVC-EB-0 PRG | 16k | `3A94FA0B` | `6239E91CCEFDC017D233CBAE388C6568A17ED04B` |
| CHR | HVC-EB-0 CHR | 8k | `E5F72401` | `A8BF028E1A62677E48E88CF421BB2A8051EB800C` |

#### Revisão de Placa #4: `NES-NROM-128-04`

```yaml
Type: NES-NROM-128
PCB: NES-NROM-128-04
Mapper: 0
CIC Type: 6113B1
Mirroring: Horizontal
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `49AEB3A6` | `BA8D9227A0D02B62EE6CB9E691FA5A5134C303A8` |
| PRG | HVC-EB-0 PRG | 16k | `3A94FA0B` | `6239E91CCEFDC017D233CBAE388C6568A17ED04B` |
| CHR | HVC-EB-0 CHR | 8k | `E5F72401` | `A8BF028E1A62677E48E88CF421BB2A8051EB800C` |

#### Revisão de Placa #5: `NES-NROM-128-05`

```yaml
Type: NES-NROM-128
PCB: NES-NROM-128-05
Mapper: 0
CIC Type: 6113B1
Mirroring: Horizontal
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `49AEB3A6` | `BA8D9227A0D02B62EE6CB9E691FA5A5134C303A8` |
| PRG | HVC-EB-0 PRG | 16k | `3A94FA0B` | `6239E91CCEFDC017D233CBAE388C6568A17ED04B` |
| CHR | HVC-EB-0 CHR | 8k | `E5F72401` | `A8BF028E1A62677E48E88CF421BB2A8051EB800C` |

---

### <a id="galaga-demons-of-death"></a>Galaga: Demons of Death (USA)

- **Publisher:** Bandai
- **Catalog ID:** `NES-AG-USA`
- **Página no NES Directory:** [https://nesdir.github.io/1DB07C0D_USA.html](https://nesdir.github.io/1DB07C0D_USA.html)

#### Revisão de Placa #1: `NES-NROM-256-04`

```yaml
Type: NES-NROM-256
PCB: NES-NROM-256-04
Mapper: 0
CIC Type: 6113A
Mirroring: Vertical
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `1DB07C0D` | `87E536B900DB2976E6B3BD682A4D7ED88AC19DCD` |
| PRG | NES-AG-0 PRG | 32k | `982189A2` | `DBA952C6F0E848DC65C3B634D907B9F11C98F52A` |
| CHR | NES-AG-0 CHR | 8k | `E2D5964E` | `62B2CD49A6A4C6F1E2B0742DB3B7493E167E9A23` |

#### Revisão de Placa #2: `NES-NROM-256-04`

```yaml
Type: NES-NROM-256
PCB: NES-NROM-256-04
Mapper: 0
CIC Type: 6113B1
Mirroring: Vertical
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `1DB07C0D` | `87E536B900DB2976E6B3BD682A4D7ED88AC19DCD` |
| PRG | NES-AG-0 PRG | 32k | `982189A2` | `DBA952C6F0E848DC65C3B634D907B9F11C98F52A` |
| CHR | NES-AG-0 CHR | 8k | `E2D5964E` | `62B2CD49A6A4C6F1E2B0742DB3B7493E167E9A23` |

---

### <a id="game-genie"></a>Game Genie (USA)

- **Publisher:** Galoob
- **Catalog ID:** `GLB-GG`
- **Página no NES Directory:** [https://nesdir.github.io/1A3A22A1_USA.html](https://nesdir.github.io/1A3A22A1_USA.html)

#### Revisão de Placa #1: `CODEMASTERS 9205`

```yaml
Type: CAMERICA-GAMEGENIE
PCB: CODEMASTERS 9205
Mapper: 0
CIC Type: 
Mirroring: Vertical
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG | GENIE V1.5A | 4k | `1A3A22A1` | `AAA9833C3DE2213F2B0326769B715651FD13FD84` |

#### Revisão de Placa #2: `GG24P01`

```yaml
Type: CAMERICA-GAMEGENIE
PCB: GG24P01
Mapper: 0
CIC Type: 
Mirroring: Vertical
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG | GENIE V1.5 | 4k | `1A3A22A1` | `AAA9833C3DE2213F2B0326769B715651FD13FD84` |

---

### <a id="golf"></a>Golf (USA)

- **Publisher:** Nintendo
- **Catalog ID:** `NES-GF-USA`
- **Página no NES Directory:** [https://nesdir.github.io/E7D2C49D_USA.html](https://nesdir.github.io/E7D2C49D_USA.html)

#### Revisão de Placa #1: `NES-NROM-128-01`

```yaml
Type: NES-NROM-128
PCB: NES-NROM-128-01
Mapper: 0
CIC Type: 3193A
Mirroring: Vertical
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `E7D2C49D` | `D4F52D21EF6C872FFACEA083161DBDA0234924D5` |
| PRG | NES-GF-0 PRG | 16k | `F9622BFA` | `B4E341A91F614BB19C67CC0205B2443591567AEA` |
| CHR | NES-GF-0 CHR | 8k | `FF6FC790` | `40177839B61F375F2AD03B203328683264845B5B` |

#### Revisão de Placa #2: `NES-NROM-128-02`

```yaml
Type: NES-NROM-128
PCB: NES-NROM-128-02
Mapper: 0
CIC Type: 3193A
Mirroring: Vertical
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `E7D2C49D` | `D4F52D21EF6C872FFACEA083161DBDA0234924D5` |
| PRG | NES-GF-0 PRG | 16k | `F9622BFA` | `B4E341A91F614BB19C67CC0205B2443591567AEA` |
| CHR | NES-GF-0 CHR | 8k | `FF6FC790` | `40177839B61F375F2AD03B203328683264845B5B` |

#### Revisão de Placa #3: `NES-NROM-128-03`

```yaml
Type: NES-NROM-128
PCB: NES-NROM-128-03
Mapper: 0
CIC Type: 6113
Mirroring: Vertical
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `E7D2C49D` | `D4F52D21EF6C872FFACEA083161DBDA0234924D5` |
| PRG | NES-GF-0 PRG | 16k | `F9622BFA` | `B4E341A91F614BB19C67CC0205B2443591567AEA` |
| CHR | NES-GF-0 CHR | 8k | `FF6FC790` | `40177839B61F375F2AD03B203328683264845B5B` |

#### Revisão de Placa #4: `NES-NROM-128-04`

```yaml
Type: NES-NROM-128
PCB: NES-NROM-128-04
Mapper: 0
CIC Type: 6113A
Mirroring: Vertical
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `E7D2C49D` | `D4F52D21EF6C872FFACEA083161DBDA0234924D5` |
| PRG | NES-GF-0 PRG | 16k | `F9622BFA` | `B4E341A91F614BB19C67CC0205B2443591567AEA` |
| CHR | NES-GF-0 CHR | 8k | `FF6FC790` | `40177839B61F375F2AD03B203328683264845B5B` |

---

### <a id="gyromite"></a>Gyromite (USA)

- **Publisher:** Nintendo
- **Catalog ID:** `NES-GY-USA`
- **Página no NES Directory:** [https://nesdir.github.io/023A5A32_USA.html](https://nesdir.github.io/023A5A32_USA.html)

#### Revisão de Placa #1: `3A`

```yaml
Type: HVC-NROM-256
PCB: 3A
Mapper: 0
CIC Type: 
Mirroring: Horizontal
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `023A5A32` | `F81B28AF2A2CA7D784CDE8E9DCF90942A9F0D561` |
| PRG | - | 32k | `21B099F3` | `76103ABE07C1CCA6FC4107E35847F4E959F5E5BB` |
| CHR | - | 8k | `D0135A78` | `F69B0EE2DC7DFD701253F3F64F114B3F279AAFC5` |

#### Revisão de Placa #2: `NES-NROM-256-01`

```yaml
Type: NES-NROM-256
PCB: NES-NROM-256-01
Mapper: 0
CIC Type: 3193
Mirroring: Horizontal
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `023A5A32` | `F81B28AF2A2CA7D784CDE8E9DCF90942A9F0D561` |
| PRG | HVC-GY-0 PRG | 32k | `21B099F3` | `76103ABE07C1CCA6FC4107E35847F4E959F5E5BB` |
| CHR | HVC-GY-0 CHR | 8k | `D0135A78` | `F69B0EE2DC7DFD701253F3F64F114B3F279AAFC5` |

#### Revisão de Placa #3: `NES-NROM-256-01`

```yaml
Type: NES-NROM-256
PCB: NES-NROM-256-01
Mapper: 0
CIC Type: 3193A
Mirroring: Horizontal
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `023A5A32` | `F81B28AF2A2CA7D784CDE8E9DCF90942A9F0D561` |
| PRG | HVC-GY-0 PRG | 32k | `21B099F3` | `76103ABE07C1CCA6FC4107E35847F4E959F5E5BB` |
| CHR | HVC-GY-0 CHR | 8k | `D0135A78` | `F69B0EE2DC7DFD701253F3F64F114B3F279AAFC5` |

#### Revisão de Placa #4: `NES-NROM-256-02`

```yaml
Type: NES-NROM-256
PCB: NES-NROM-256-02
Mapper: 0
CIC Type: 3193A
Mirroring: Horizontal
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `023A5A32` | `F81B28AF2A2CA7D784CDE8E9DCF90942A9F0D561` |
| PRG | HVC-GY-0 PRG | 32k | `21B099F3` | `76103ABE07C1CCA6FC4107E35847F4E959F5E5BB` |
| CHR | HVC-GY-0 CHR | 8k | `D0135A78` | `F69B0EE2DC7DFD701253F3F64F114B3F279AAFC5` |

---

### <a id="hogan-s-alley"></a>Hogan's Alley (USA)

- **Publisher:** Nintendo
- **Catalog ID:** `NES-HA-USA`
- **Página no NES Directory:** [https://nesdir.github.io/FF24D794_USA.html](https://nesdir.github.io/FF24D794_USA.html)

#### Revisão de Placa #1: `NES-NROM-128-01`

```yaml
Type: NES-NROM-128
PCB: NES-NROM-128-01
Mapper: 0
CIC Type: 3193
Mirroring: Horizontal
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `FF24D794` | `C200D0BF8914B2116720BF8A29B5521C3CEFA36A` |
| PRG | HVC-HA-0 PRG | 16k | `8963AE6E` | `BCA489ED0FB58E1E99F36C427BC0D7D805B6C61A` |
| CHR | HVC-HA-0 CHR | 8k | `5DF42FC4` | `4FCF23151D9F11C1EF1B1007DD8058F5D5FE9AB8` |

#### Revisão de Placa #2: `NES-NROM-128-03`

```yaml
Type: NES-NROM-128
PCB: NES-NROM-128-03
Mapper: 0
CIC Type: 6113A
Mirroring: Horizontal
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `FF24D794` | `C200D0BF8914B2116720BF8A29B5521C3CEFA36A` |
| PRG | HVC-HA-0 PRG | 16k | `8963AE6E` | `BCA489ED0FB58E1E99F36C427BC0D7D805B6C61A` |
| CHR | HVC-HA-0 CHR | 8k | `5DF42FC4` | `4FCF23151D9F11C1EF1B1007DD8058F5D5FE9AB8` |

#### Revisão de Placa #3: `NES-NROM-128-04`

```yaml
Type: NES-NROM-128
PCB: NES-NROM-128-04
Mapper: 0
CIC Type: 6113B1
Mirroring: Horizontal
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `FF24D794` | `C200D0BF8914B2116720BF8A29B5521C3CEFA36A` |
| PRG | HVC-HA-0 PRG | 16k | `8963AE6E` | `BCA489ED0FB58E1E99F36C427BC0D7D805B6C61A` |
| CHR | HVC-HA-0 CHR | 8k | `5DF42FC4` | `4FCF23151D9F11C1EF1B1007DD8058F5D5FE9AB8` |

---

### <a id="hydlide"></a>Hydlide (USA)

- **Publisher:** FCI
- **Catalog ID:** `NES-HS-USA`
- **Página no NES Directory:** [https://nesdir.github.io/77BF8B23_USA.html](https://nesdir.github.io/77BF8B23_USA.html)

```yaml
Type: NES-NROM-256
PCB: NES-NROM-256-05
Mapper: 0
CIC Type: 6113B1
Mirroring: Vertical
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `77BF8B23` | `68EDB4E9B01F80AD6AF01B75222886F15E868C98` |
| PRG | NES-HS-0 PRG | 32k | `47F77A4C` | `E15475C21F3C8BA8DA893DE7098B90BEDEF557BC` |
| CHR | NES-HS-0 CHR | 8k | `C1F950C6` | `5C928D98348B25EA51271A5313E61C2D91996943` |

---

### <a id="ice-climber"></a>Ice Climber (USA)

- **Publisher:** Nintendo
- **Catalog ID:** `NES-IC-USA`
- **Página no NES Directory:** [https://nesdir.github.io/FB98D46E_USA.html](https://nesdir.github.io/FB98D46E_USA.html)

#### Revisão de Placa #1: `NES-NROM-128-01`

```yaml
Type: NES-NROM-128
PCB: NES-NROM-128-01
Mapper: 0
CIC Type: 3193
Mirroring: Vertical
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `FB98D46E` | `22D57AC6066529D199FCD299159D94820042C7D0` |
| PRG | HVC-IC-0 PRG | 16k | `D548307F` | `E323EBAA2C0BE5B9A31A21743DDFE7F3D1580672` |
| CHR | NES-IC-0 CHR | 8k | `0D58A8B1` | `7AE5F457BB5996A5373C9CF46DB3D296E27EC56A` |

#### Revisão de Placa #2: `NES-NROM-128-02`

```yaml
Type: NES-NROM-128
PCB: NES-NROM-128-02
Mapper: 0
CIC Type: 3193A
Mirroring: Vertical
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `FB98D46E` | `22D57AC6066529D199FCD299159D94820042C7D0` |
| PRG | HVC-IC-0 PRG | 16k | `D548307F` | `E323EBAA2C0BE5B9A31A21743DDFE7F3D1580672` |
| CHR | NES-IC-0 CHR | 8k | `0D58A8B1` | `7AE5F457BB5996A5373C9CF46DB3D296E27EC56A` |

#### Revisão de Placa #3: `NES-NROM-128-03`

```yaml
Type: NES-NROM-128
PCB: NES-NROM-128-03
Mapper: 0
CIC Type: 6113
Mirroring: Vertical
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `FB98D46E` | `22D57AC6066529D199FCD299159D94820042C7D0` |
| PRG | HVC-IC-0 PRG | 16k | `D548307F` | `E323EBAA2C0BE5B9A31A21743DDFE7F3D1580672` |
| CHR | NES-IC-0 CHR | 8k | `0D58A8B1` | `7AE5F457BB5996A5373C9CF46DB3D296E27EC56A` |

---

### <a id="ice-hockey"></a>Ice Hockey (USA)

- **Publisher:** Nintendo
- **Catalog ID:** `NES-HY-USA`
- **Página no NES Directory:** [https://nesdir.github.io/AE64CA77_USA.html](https://nesdir.github.io/AE64CA77_USA.html)

#### Revisão de Placa #1: `NES-NROM-256-03`

```yaml
Type: NES-NROM-256
PCB: NES-NROM-256-03
Mapper: 0
CIC Type: 6113
Mirroring: Horizontal
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `AE64CA77` | `40262A15EE764F676E752C90626A2F61DA370A1A` |
| PRG | NES-HY-0 PRG | 32k | `82DFF13D` | `4EDBF555D319DFE1C2A08DC28F484D4344A228BA` |
| CHR | NES-HY-0 CHR | 8k | `F10FC90A` | `1A2A657267DE1F5BDF284D1B69ED7D4895DFB281` |

#### Revisão de Placa #2: `NES-NROM-256-03`

```yaml
Type: NES-NROM-256
PCB: NES-NROM-256-03
Mapper: 0
CIC Type: 6113A
Mirroring: Horizontal
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `AE64CA77` | `40262A15EE764F676E752C90626A2F61DA370A1A` |
| PRG | NES-HY-0 PRG | 32k | `82DFF13D` | `4EDBF555D319DFE1C2A08DC28F484D4344A228BA` |
| CHR | NES-HY-0 CHR | 8k | `F10FC90A` | `1A2A657267DE1F5BDF284D1B69ED7D4895DFB281` |

#### Revisão de Placa #3: `NES-NROM-256-04`

```yaml
Type: NES-NROM-256
PCB: NES-NROM-256-04
Mapper: 0
CIC Type: 6113A
Mirroring: Horizontal
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `AE64CA77` | `40262A15EE764F676E752C90626A2F61DA370A1A` |
| PRG | NES-HY-0 PRG | 32k | `82DFF13D` | `4EDBF555D319DFE1C2A08DC28F484D4344A228BA` |
| CHR | NES-HY-0 CHR | 8k | `F10FC90A` | `1A2A657267DE1F5BDF284D1B69ED7D4895DFB281` |

---

### <a id="kung-fu"></a>Kung Fu (USA)

- **Publisher:** Nintendo
- **Catalog ID:** `NES-SX-USA`
- **Página no NES Directory:** [https://nesdir.github.io/D5C64257_USA.html](https://nesdir.github.io/D5C64257_USA.html)

#### Revisão de Placa #1: `NES-NROM-256-01`

```yaml
Type: NES-NROM-256
PCB: NES-NROM-256-01
Mapper: 0
CIC Type: 3193
Mirroring: Horizontal
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `D5C64257` | `24A25F9DC3227687239FCA9E7BBB1F1B7664D6DD` |
| PRG | NES-SX-0 PRG | 32k | `0516375E` | `55DC3550C6133F8624EB6CF3D2F145E4313C2FF6` |
| CHR | NES-SX-0 CHR | 8k | `430B49A4` | `7E618DBFF521C3D5EE0F3D8BB01D2E770395A6BC` |

#### Revisão de Placa #2: `NES-NROM-256-02`

```yaml
Type: NES-NROM-256
PCB: NES-NROM-256-02
Mapper: 0
CIC Type: 3193A
Mirroring: Horizontal
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `D5C64257` | `24A25F9DC3227687239FCA9E7BBB1F1B7664D6DD` |
| PRG | NES-SX-0 PRG | 32k | `0516375E` | `55DC3550C6133F8624EB6CF3D2F145E4313C2FF6` |
| CHR | NES-SX-0 CHR | 8k | `430B49A4` | `7E618DBFF521C3D5EE0F3D8BB01D2E770395A6BC` |

#### Revisão de Placa #3: `NES-NROM-256-03`

```yaml
Type: NES-NROM-256
PCB: NES-NROM-256-03
Mapper: 0
CIC Type: 6113
Mirroring: Horizontal
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `D5C64257` | `24A25F9DC3227687239FCA9E7BBB1F1B7664D6DD` |
| PRG | NES-SX-0 PRG | 32k | `0516375E` | `55DC3550C6133F8624EB6CF3D2F145E4313C2FF6` |
| CHR | NES-SX-0 CHR | 8k | `430B49A4` | `7E618DBFF521C3D5EE0F3D8BB01D2E770395A6BC` |

#### Revisão de Placa #4: `NES-NROM-256-04`

```yaml
Type: NES-NROM-256
PCB: NES-NROM-256-04
Mapper: 0
CIC Type: 6113A
Mirroring: Horizontal
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `D5C64257` | `24A25F9DC3227687239FCA9E7BBB1F1B7664D6DD` |
| PRG | NES-SX-0 PRG | 32k | `0516375E` | `55DC3550C6133F8624EB6CF3D2F145E4313C2FF6` |
| CHR | NES-SX-0 CHR | 8k | `430B49A4` | `7E618DBFF521C3D5EE0F3D8BB01D2E770395A6BC` |

---

### <a id="lode-runner"></a>Lode Runner (USA)

- **Publisher:** Brøderbund
- **Catalog ID:** `NES-LO-USA`
- **Página no NES Directory:** [https://nesdir.github.io/AF5676DE_USA.html](https://nesdir.github.io/AF5676DE_USA.html)

#### Revisão de Placa #1: `NES-NROM-128-03`

```yaml
Type: NES-NROM-128
PCB: NES-NROM-128-03
Mapper: 0
CIC Type: 3193A
Mirroring: Horizontal
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `AF5676DE` | `D456FBFFDF41BBBA327D16CD1D776A6BDEDDB586` |
| PRG | NES-LO-0 PRG | 16k | `EC3001C7` | `F7971585E0C46BC5BEC0AF438BEBB25099395637` |
| CHR | NES-LO-0 CHR | 8k | `E8C6C127` | `76B342287D63B91A362F5645DC5894C2DB2CE1A5` |

#### Revisão de Placa #2: `NES-NROM-128-03`

```yaml
Type: NES-NROM-128
PCB: NES-NROM-128-03
Mapper: 0
CIC Type: 6113
Mirroring: Horizontal
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `AF5676DE` | `D456FBFFDF41BBBA327D16CD1D776A6BDEDDB586` |
| PRG | NES-LO-0 PRG | 16k | `EC3001C7` | `F7971585E0C46BC5BEC0AF438BEBB25099395637` |
| CHR | NES-LO-0 CHR | 8k | `E8C6C127` | `76B342287D63B91A362F5645DC5894C2DB2CE1A5` |

---

### <a id="lunar-pool"></a>Lunar Pool (USA)

- **Publisher:** FCI
- **Catalog ID:** `NES-LP-USA`
- **Página no NES Directory:** [https://nesdir.github.io/988B446D_USA.html](https://nesdir.github.io/988B446D_USA.html)

#### Revisão de Placa #1: `NES-NROM-128-03`

```yaml
Type: NES-NROM-128
PCB: NES-NROM-128-03
Mapper: 0
CIC Type: 3193A
Mirroring: Horizontal
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `988B446D` | `260166D22C895DF4F30AC63E4E8D0C3F1C7B1585` |
| PRG | NES-LP-0 PRG | 16k | `9BA20DAD` | `4EAB6D0829030201729D03D480FAB56544CC12DB` |
| CHR | NES-LP-0 CHR | 8k | `A139062A` | `65B9A29D885F9AEF19FBD22E001780523E34B3A6` |

#### Revisão de Placa #2: `NES-NROM-128-03`

```yaml
Type: NES-NROM-128
PCB: NES-NROM-128-03
Mapper: 0
CIC Type: 6113
Mirroring: Horizontal
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `988B446D` | `260166D22C895DF4F30AC63E4E8D0C3F1C7B1585` |
| PRG | NES-LP-0 PRG | 16k | `9BA20DAD` | `4EAB6D0829030201729D03D480FAB56544CC12DB` |
| CHR | NES-LP-0 CHR | 8k | `A139062A` | `65B9A29D885F9AEF19FBD22E001780523E34B3A6` |

#### Revisão de Placa #3: `NES-NROM-128-06`

```yaml
Type: NES-NROM-128
PCB: NES-NROM-128-06
Mapper: 0
CIC Type: 6113B1
Mirroring: Horizontal
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `988B446D` | `260166D22C895DF4F30AC63E4E8D0C3F1C7B1585` |
| PRG | NES-LP-0 PRG | 16k | `9BA20DAD` | `4EAB6D0829030201729D03D480FAB56544CC12DB` |
| CHR | NES-LP-0 CHR | 8k | `A139062A` | `65B9A29D885F9AEF19FBD22E001780523E34B3A6` |

---

### <a id="m-u-s-c-l-e-tag-team-match"></a>M.U.S.C.L.E.: Tag Team Match (USA)

- **Publisher:** Bandai
- **Catalog ID:** `NES-MS-USA`
- **Página no NES Directory:** [https://nesdir.github.io/8FF31896_USA.html](https://nesdir.github.io/8FF31896_USA.html)

```yaml
Type: NES-NROM-128
PCB: NES-NROM-128-02
Mapper: 0
CIC Type: 3193A
Mirroring: Horizontal
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `8FF31896` | `58D464400B8952DA23E79D42E3C9166036ABFA85` |
| PRG | NES-MS-0 PRG | 16k | `092B5371` | `DA7A78B34F14380D4AB2A6A0960ACBDCE98ABA9F` |
| CHR | NES-MS-0 CHR | 8k | `01623DFD` | `06B85574DCF8B35D99AD20B442176DDF7FCA3309` |

---

### <a id="mach-rider"></a>Mach Rider (USA)

- **Publisher:** Nintendo
- **Catalog ID:** `NES-MR-USA`
- **Página no NES Directory:** [https://nesdir.github.io/59977A46_USA.html](https://nesdir.github.io/59977A46_USA.html)

#### Revisão de Placa #1: `NES-NROM-256-01`

```yaml
Type: NES-NROM-256
PCB: NES-NROM-256-01
Mapper: 0
CIC Type: 3193
Mirroring: Horizontal
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `59977A46` | `3959DE9E2F63B34BC992A60DDCC73027F401DC64` |
| PRG | HVC-MR-0 PRG | 32k | `AF2BBCBC` | `79B0886C35137B1F31F86E935574C1816A823851` |
| CHR | HVC-MR-0 CHR | 8k | `33A2B41A` | `671F37BCE742E63250296E62C143F8A82F860B04` |

#### Revisão de Placa #2: `NES-NROM-256-02`

```yaml
Type: NES-NROM-256
PCB: NES-NROM-256-02
Mapper: 0
CIC Type: 3193A
Mirroring: Horizontal
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `59977A46` | `3959DE9E2F63B34BC992A60DDCC73027F401DC64` |
| PRG | HVC-MR-0 PRG | 32k | `AF2BBCBC` | `79B0886C35137B1F31F86E935574C1816A823851` |
| CHR | HVC-MR-0 CHR | 8k | `33A2B41A` | `671F37BCE742E63250296E62C143F8A82F860B04` |

#### Revisão de Placa #3: `NES-NROM-256-05`

```yaml
Type: NES-NROM-256
PCB: NES-NROM-256-05
Mapper: 0
CIC Type: 6113B1
Mirroring: Horizontal
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `59977A46` | `3959DE9E2F63B34BC992A60DDCC73027F401DC64` |
| PRG | HVC-MR-0 PRG | 32k | `AF2BBCBC` | `79B0886C35137B1F31F86E935574C1816A823851` |
| CHR | HVC-MR-0 CHR | 8k | `33A2B41A` | `671F37BCE742E63250296E62C143F8A82F860B04` |

---

### <a id="magmax"></a>Magmax (USA)

- **Publisher:** FCI
- **Catalog ID:** `NES-MM-USA`
- **Página no NES Directory:** [https://nesdir.github.io/81389607_USA.html](https://nesdir.github.io/81389607_USA.html)

#### Revisão de Placa #1: `NES-NROM-256-04`

```yaml
Type: NES-NROM-256
PCB: NES-NROM-256-04
Mapper: 0
CIC Type: 6113A
Mirroring: Vertical
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `81389607` | `30B6F8BFC726EBDD8F9893EBD5928DF2483EDB76` |
| PRG | NES-MM-0 PRG | 32k | `A4625DBC` | `2786EC8770EABC95FD4A0DCE115314545EB6D896` |
| CHR | NES-MM-0 CHR | 8k | `5E762085` | `AB769980E70880871DF8C9858E6D201714C4F9BA` |

#### Revisão de Placa #2: `NES-NROM-256-04`

```yaml
Type: NES-NROM-256
PCB: NES-NROM-256-04
Mapper: 0
CIC Type: 6113B1
Mirroring: Vertical
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `81389607` | `30B6F8BFC726EBDD8F9893EBD5928DF2483EDB76` |
| PRG | NES-MM-0 PRG | 32k | `A4625DBC` | `2786EC8770EABC95FD4A0DCE115314545EB6D896` |
| CHR | NES-MM-0 CHR | 8k | `5E762085` | `AB769980E70880871DF8C9858E6D201714C4F9BA` |

---

### <a id="mario-bros-"></a>Mario Bros. (USA)

- **Publisher:** Nintendo
- **Catalog ID:** `NES-MA-USA`
- **Página no NES Directory:** [https://nesdir.github.io/C4C3949A_USA.html](https://nesdir.github.io/C4C3949A_USA.html)

#### Revisão de Placa #1: `NES-NROM-128-02`

```yaml
Type: NES-NROM-128
PCB: NES-NROM-128-02
Mapper: 0
CIC Type: 3193A
Mirroring: Vertical
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `C4C3949A` | `BF43D93D36D7198E65B9B7C4E41DB108FE43FCBA` |
| PRG | HVC-MA-0 PRG | 16k | `75F6A9F3` | `B6F88F7A2F9A49CC9182A244571730198F1EDC4B` |
| CHR | HVC-MA-0 CHR | 8k | `10F77435` | `A646C3443832ADA84D31A3A8A4B34AEBC17CECD5` |

#### Revisão de Placa #2: `NES-NROM-128-06`

```yaml
Type: NES-NROM-128
PCB: NES-NROM-128-06
Mapper: 0
CIC Type: 6113B1
Mirroring: Vertical
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `C4C3949A` | `BF43D93D36D7198E65B9B7C4E41DB108FE43FCBA` |
| PRG | HVC-MA-0 PRG | 16k | `75F6A9F3` | `B6F88F7A2F9A49CC9182A244571730198F1EDC4B` |
| CHR | HVC-MA-0 CHR | 8k | `10F77435` | `A646C3443832ADA84D31A3A8A4B34AEBC17CECD5` |

---

### <a id="millipede"></a>Millipede (USA)

- **Publisher:** HAL Laboratory
- **Catalog ID:** `NES-ML-USA`
- **Página no NES Directory:** [https://nesdir.github.io/AE52DECE_USA.html](https://nesdir.github.io/AE52DECE_USA.html)

```yaml
Type: NES-NROM-128
PCB: NES-NROM-128-04
Mapper: 0
CIC Type: 6113A
Mirroring: Horizontal
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `AE52DECE` | `E95319304A88D63F832782F4CEC70518568E0672` |
| PRG | NES-ML-0 PRG | 16k | `0AB06C51` | `9E3C659F4D181821C809809E5FC2BA46A066D70A` |
| CHR | NES-ML-0 CHR | 8k | `3D3DAE3F` | `F725BC47095FA0C2AE7BF1A84AEBBB97AF1B30E4` |

---

### <a id="ms-pac-man"></a>Ms. Pac-Man (USA)

- **Publisher:** Namco
- **Catalog ID:** `NES-M9-USA`
- **Página no NES Directory:** [https://nesdir.github.io/B6D2D300_USA.html](https://nesdir.github.io/B6D2D300_USA.html)

```yaml
Type: NES-NROM-256
PCB: NES-NROM-256-06
Mapper: 0
CIC Type: 6113B1
Mirroring: Horizontal
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `B6D2D300` | `F92161296E7CBA0B9A573D00EABF8581914BCA56` |
| PRG | NES-M9-0 PRG | 32k | `2477A571` | `9C2F583D47571B97BEFB64E1E55D6ECC72ECC605` |
| CHR | NES-M9-0 CHR | 8k | `49D90508` | `C8C9B951D0582911563F244920636E806DCCCAFC` |

---

### <a id="othello"></a>Othello (USA)

- **Publisher:** Acclaim
- **Catalog ID:** `NES-OH-USA`
- **Página no NES Directory:** [https://nesdir.github.io/699FA085_USA.html](https://nesdir.github.io/699FA085_USA.html)

```yaml
Type: NES-NROM-256
PCB: NES-NROM-256-04
Mapper: 0
CIC Type: 6113B1
Mirroring: Vertical
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `699FA085` | `27CA5BA9E920C21A6906F57E266A253C39FFADB6` |
| PRG | NES-OH-0 PRG | 32k | `248E7693` | `B41C9D75EA6DCDEB39FB30DBD59F9FD744F43F2F` |
| CHR | NES-OH-0 CHR | 8k | `3361FBF1` | `B5C0FA507E495439C14B841B5B596A2F9B04C7D5` |

---

### <a id="pac-man"></a>Pac-Man (USA)

- **Publisher:** Namco
- **Catalog ID:** `NES-P7-USA`
- **Página no NES Directory:** [https://nesdir.github.io/9E4E9CC2_USA.html](https://nesdir.github.io/9E4E9CC2_USA.html)

```yaml
Type: NES-NROM-128
PCB: NES-NROM-128-06
Mapper: 0
CIC Type: 6113B1
Mirroring: Vertical
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `9E4E9CC2` | `92C3361B9E3B28A51FD30E7845C988A6D576EE65` |
| PRG | NES-P7-0 PRG | 16k | `347D7D34` | `AA1BBA9A243C70EB4E9928B5EFEC9D4877579D08` |
| CHR | NES-P7-0 CHR | 8k | `ED9E2130` | `259B4D580D2FC11D5A61AD85F9FB717489986454` |

---

### <a id="pinball"></a>Pinball (USA)

- **Publisher:** Nintendo
- **Catalog ID:** `NES-PN-USA`
- **Página no NES Directory:** [https://nesdir.github.io/035DC2E9_USA.html](https://nesdir.github.io/035DC2E9_USA.html)

#### Revisão de Placa #1: `2`

```yaml
Type: HVC-NROM-128
PCB: 2
Mapper: 0
CIC Type: 
Mirroring: Vertical
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `035DC2E9` | `BE348431A9C03D1A588A8363C0094B5A0722D9BE` |
| PRG | - | 16k | `91D33E3C` | `607C5954E5C577AC78DB3234987F8FE62F86F068` |
| CHR | - | 8k | `F2A53B3D` | `0D2A521FD984C76CBF9B3CBD47E68C6CE4C6EEAE` |

#### Revisão de Placa #2: `NES-NROM-128-03`

```yaml
Type: NES-NROM-128
PCB: NES-NROM-128-03
Mapper: 0
CIC Type: 6113
Mirroring: Vertical
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `035DC2E9` | `BE348431A9C03D1A588A8363C0094B5A0722D9BE` |
| PRG | HVC-PN-0 PRG | 16k | `91D33E3C` | `607C5954E5C577AC78DB3234987F8FE62F86F068` |
| CHR | HVC-PN-0 CHR | 8k | `F2A53B3D` | `0D2A521FD984C76CBF9B3CBD47E68C6CE4C6EEAE` |

#### Revisão de Placa #3: `NES-NROM-128-04`

```yaml
Type: NES-NROM-128
PCB: NES-NROM-128-04
Mapper: 0
CIC Type: 6113A
Mirroring: Vertical
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `035DC2E9` | `BE348431A9C03D1A588A8363C0094B5A0722D9BE` |
| PRG | HVC-PN-0 PRG | 16k | `91D33E3C` | `607C5954E5C577AC78DB3234987F8FE62F86F068` |
| CHR | HVC-PN-0 CHR | 8k | `F2A53B3D` | `0D2A521FD984C76CBF9B3CBD47E68C6CE4C6EEAE` |

---

### <a id="popeye"></a>Popeye (USA)

- **Publisher:** Nintendo
- **Catalog ID:** `NES-PP-USA`
- **Página no NES Directory:** [https://nesdir.github.io/70860FCA_USA.html](https://nesdir.github.io/70860FCA_USA.html)

#### Revisão de Placa #1: `NES-NROM-128-01`

```yaml
Type: NES-NROM-128
PCB: NES-NROM-128-01
Mapper: 0
CIC Type: 3193
Mirroring: Vertical
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `70860FCA` | `7CE202E72B7942E3F6030EBF220E8BBB695DE9D8` |
| PRG | HVC-PP-1 PRG | 16k | `0FA63A45` | `50C594A6D8DCBEEE2D83BCA8C54C42CF57093ABA` |
| CHR | HVC-PP-0 CHR | 8k | `A5FD8D98` | `09D229404BABB6C89B417AC541BAB80FB06D2BA9` |

#### Revisão de Placa #2: `NES-NROM-128-06`

```yaml
Type: NES-NROM-128
PCB: NES-NROM-128-06
Mapper: 0
CIC Type: 6113B1
Mirroring: Vertical
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `70860FCA` | `7CE202E72B7942E3F6030EBF220E8BBB695DE9D8` |
| PRG | HVC-PP-1 PRG | 16k | `0FA63A45` | `50C594A6D8DCBEEE2D83BCA8C54C42CF57093ABA` |
| CHR | HVC-PP-0 CHR | 8k | `A5FD8D98` | `09D229404BABB6C89B417AC541BAB80FB06D2BA9` |

---

### <a id="raid-on-bungeling-bay"></a>Raid on Bungeling Bay (USA)

- **Publisher:** Brøderbund
- **Catalog ID:** `NES-BU-USA`
- **Página no NES Directory:** [https://nesdir.github.io/D308D52C_USA.html](https://nesdir.github.io/D308D52C_USA.html)

#### Revisão de Placa #1: `NES-NROM-128-03`

```yaml
Type: NES-NROM-128
PCB: NES-NROM-128-03
Mapper: 0
CIC Type: 3193A
Mirroring: Horizontal
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `D308D52C` | `BC526620B6815604E4D955101A58B0B652CB0644` |
| PRG | NES-BU-0 PRG | 16k | `BB673749` | `42F1DD3676BC991E43360AAA9EB11B2D304113D4` |
| CHR | NES-BU-0 CHR | 8k | `F2AB5CD9` | `E1712BE3BD4BA6091DF02FD5343049407AA4ECAA` |

#### Revisão de Placa #2: `NES-NROM-128-03`

```yaml
Type: NES-NROM-128
PCB: NES-NROM-128-03
Mapper: 0
CIC Type: 6113
Mirroring: Horizontal
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `D308D52C` | `BC526620B6815604E4D955101A58B0B652CB0644` |
| PRG | NES-BU-0 PRG | 16k | `BB673749` | `42F1DD3676BC991E43360AAA9EB11B2D304113D4` |
| CHR | NES-BU-0 CHR | 8k | `F2AB5CD9` | `E1712BE3BD4BA6091DF02FD5343049407AA4ECAA` |

---

### <a id="road-fighter"></a>Road Fighter (Australia)

- **Publisher:** Palcom
- **Catalog ID:** `NES-39-AUS`
- **Página no NES Directory:** [https://nesdir.github.io/719571B3_Australia.html](https://nesdir.github.io/719571B3_Australia.html)

```yaml
Type: NES-NROM-128
PCB: NES-NROM-128-06
Mapper: 0
CIC Type: 3197A
Mirroring: Vertical
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `719571B3` | `9B6CD33AEAF2AF04F3DF5981683EEB616FAD6BC0` |
| PRG | PAL-39-0 PRG | 16k | `F51C7D02` | `09970D1CC4A2BD82715CC4243E4F9FA4667C68C5` |
| CHR | PAL-39-0 CHR | 8k | `A148C520` | `DF15751726F27902C3BCDF35CF63D8E85C42BBAD` |

---

### <a id="seicross"></a>Seicross (USA)

- **Publisher:** FCI
- **Catalog ID:** `NES-SE-USA`
- **Página no NES Directory:** [https://nesdir.github.io/27AA3933_USA.html](https://nesdir.github.io/27AA3933_USA.html)

#### Revisão de Placa #1: `NES-NROM-256-04`

```yaml
Type: NES-NROM-256
PCB: NES-NROM-256-04
Mapper: 0
CIC Type: 6113A
Mirroring: Horizontal
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `27AA3933` | `0D8166E5EEEA84524F9711094F5F325A682C4E56` |
| PRG | NES-SE-0 PRG | 32k | `256CFB05` | `A385119CE85DAAAB7AAD7FB823BA0E9FBD2271E2` |
| CHR | NES-SE-0 CHR | 8k | `87BF6288` | `BD9D8D102D90DB21B3F83B0AC9357F3C8B9C1122` |

#### Revisão de Placa #2: `NES-NROM-256-04`

```yaml
Type: NES-NROM-256
PCB: NES-NROM-256-04
Mapper: 0
CIC Type: 6113B1
Mirroring: Horizontal
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `27AA3933` | `0D8166E5EEEA84524F9711094F5F325A682C4E56` |
| PRG | NES-SE-0 PRG | 32k | `256CFB05` | `A385119CE85DAAAB7AAD7FB823BA0E9FBD2271E2` |
| CHR | NES-SE-0 CHR | 8k | `87BF6288` | `BD9D8D102D90DB21B3F83B0AC9357F3C8B9C1122` |

---

### <a id="slalom"></a>Slalom (USA)

- **Publisher:** Nintendo
- **Catalog ID:** `NES-SL-USA`
- **Página no NES Directory:** [https://nesdir.github.io/86670C93_USA.html](https://nesdir.github.io/86670C93_USA.html)

#### Revisão de Placa #1: `NES-NROM-256-02`

```yaml
Type: NES-NROM-256
PCB: NES-NROM-256-02
Mapper: 0
CIC Type: 3193A
Mirroring: Horizontal
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `86670C93` | `17EBB77B5A7258BBB83B5F1B2630067542DD7861` |
| PRG | NES-SL-0 PRG | 32k | `B7F485D8` | `2F67EBDBAB2C072F4EF608E2040E62820BDFD70C` |
| CHR | NES-SL-0 CHR | 8k | `2F836491` | `D6D690A428ADF0360FE3C0301A0080DBCB9B90EB` |

#### Revisão de Placa #2: `NES-NROM-256-03`

```yaml
Type: NES-NROM-256
PCB: NES-NROM-256-03
Mapper: 0
CIC Type: 6113
Mirroring: Horizontal
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `86670C93` | `17EBB77B5A7258BBB83B5F1B2630067542DD7861` |
| PRG | NES-SL-0 PRG | 32k | `B7F485D8` | `2F67EBDBAB2C072F4EF608E2040E62820BDFD70C` |
| CHR | NES-SL-0 CHR | 8k | `2F836491` | `D6D690A428ADF0360FE3C0301A0080DBCB9B90EB` |

---

### <a id="soccer"></a>Soccer (USA)

- **Publisher:** Nintendo
- **Catalog ID:** `NES-SC-USA`
- **Página no NES Directory:** [https://nesdir.github.io/657F7875_USA.html](https://nesdir.github.io/657F7875_USA.html)

#### Revisão de Placa #1: `NES-NROM-256-01`

```yaml
Type: NES-NROM-256
PCB: NES-NROM-256-01
Mapper: 0
CIC Type: 3193
Mirroring: Horizontal
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `657F7875` | `A54E246F1C4E7336ED71AED2656288D943C6E36C` |
| PRG | HVC-SC-0 PRG | 32k | `32E37DCB` | `9D881111634C88218A58E4404848F595824F1C0C` |
| CHR | HVC-SC-0 CHR | 8k | `307B19AB` | `B35EF4C2CF071DB77CEC1B4529B43A20CFCCE172` |

#### Revisão de Placa #2: `NES-NROM-256-02`

```yaml
Type: NES-NROM-256
PCB: NES-NROM-256-02
Mapper: 0
CIC Type: 3193A
Mirroring: Horizontal
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `657F7875` | `A54E246F1C4E7336ED71AED2656288D943C6E36C` |
| PRG | HVC-SC-0 PRG | 32k | `32E37DCB` | `9D881111634C88218A58E4404848F595824F1C0C` |
| CHR | HVC-SC-0 CHR | 8k | `307B19AB` | `B35EF4C2CF071DB77CEC1B4529B43A20CFCCE172` |

---

### <a id="spelunker"></a>Spelunker (USA)

- **Publisher:** Brøderbund
- **Catalog ID:** `NES-SU-USA`
- **Página no NES Directory:** [https://nesdir.github.io/99D15A91_USA.html](https://nesdir.github.io/99D15A91_USA.html)

#### Revisão de Placa #1: `NES-NROM-256-03`

```yaml
Type: NES-NROM-256
PCB: NES-NROM-256-03
Mapper: 0
CIC Type: 3193A
Mirroring: Horizontal
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `99D15A91` | `0BB2C29B35517E08E5DCBA6DB9AAE4B18055A84F` |
| PRG | NES-SU-0 PRG | 32k | `D9976CDD` | `CC4FCAE1103F610A1CD90F57AD2F9B6404DF2D0E` |
| CHR | NES-SU-0 CHR | 8k | `8619B5AA` | `C63A4ABCD87C40915209D3155ECBDBF37C1D649C` |

#### Revisão de Placa #2: `NES-NROM-256-03`

```yaml
Type: NES-NROM-256
PCB: NES-NROM-256-03
Mapper: 0
CIC Type: 6113
Mirroring: Horizontal
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `99D15A91` | `0BB2C29B35517E08E5DCBA6DB9AAE4B18055A84F` |
| PRG | NES-SU-0 PRG | 32k | `D9976CDD` | `CC4FCAE1103F610A1CD90F57AD2F9B6404DF2D0E` |
| CHR | NES-SU-0 CHR | 8k | `8619B5AA` | `C63A4ABCD87C40915209D3155ECBDBF37C1D649C` |

---

### <a id="spy-vs-spy"></a>Spy vs. Spy (USA)

- **Publisher:** Kemco
- **Catalog ID:** `NES-SP-USA`
- **Página no NES Directory:** [https://nesdir.github.io/C4A02712_USA.html](https://nesdir.github.io/C4A02712_USA.html)

```yaml
Type: NES-NROM-256
PCB: NES-NROM-256-04
Mapper: 0
CIC Type: 6113B1
Mirroring: Horizontal
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `C4A02712` | `CCB306A328E6905D72A2E11C9F86A303D51D5A04` |
| PRG | NES-SP-0 PRG | 32k | `C0DD00E0` | `61965019E8D3DE5F9A3D9A6D8392F32F25EDBD21` |
| CHR | NES-SP-0 CHR | 8k | `883790C8` | `AB26714F73AC998B846780CA660257FC5ADC3F3E` |

---

### <a id="sqoon"></a>Sqoon (USA)

- **Publisher:** Irem
- **Catalog ID:** `NES-SQ-USA`
- **Página no NES Directory:** [https://nesdir.github.io/44F34172_USA.html](https://nesdir.github.io/44F34172_USA.html)

```yaml
Type: NES-NROM-256
PCB: NES-NROM-256-03
Mapper: 0
CIC Type: 3193A
Mirroring: Horizontal
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `44F34172` | `D2327AC8751BA04B09E420B6E259BA21B3FFFF81` |
| PRG | NES-SQ-0 PRG | 32k | `1808061A` | `18B0C0B7803EBA7296AE5022B9750EA770225C24` |
| CHR | NES-SQ-0 CHR | 8k | `467148ED` | `69146D42CCDFD62D7412593C8541F7CD32304AEC` |

---

### <a id="stack-up"></a>Stack-Up (USA)

- **Publisher:** Nintendo
- **Catalog ID:** `NES-BL-USA`
- **Página no NES Directory:** [https://nesdir.github.io/DF67DAA1_USA.html](https://nesdir.github.io/DF67DAA1_USA.html)

```yaml
Type: HVC-NROM-256
PCB: HVC-NROM-256K-02
Mapper: 0
CIC Type: 
Mirroring: Vertical
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `DF67DAA1` | `85B0031C86274A5805933C5422F7B8DCFAB75134` |
| PRG | HVC-BL-0 PRG | 32k | `4EE735C1` | `36B6B30F451C3B4A48464BEE9A144C873AE04CC7` |
| CHR | HVC-BL-0 CHR | 8k | `41F4B527` | `49F8DABDA7E8585E6961049C46ED913518CD959E` |

---

### <a id="super-mario-bros-"></a>Super Mario Bros. (USA)

- **Publisher:** Nintendo
- **Catalog ID:** `NES-SM-USA`
- **Página no NES Directory:** [https://nesdir.github.io/D445F698_USA.html](https://nesdir.github.io/D445F698_USA.html)

#### Revisão de Placa #1: `NES-NROM-256-01`

```yaml
Type: NES-NROM-256
PCB: NES-NROM-256-01
Mapper: 0
CIC Type: 3193
Mirroring: Horizontal
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `D445F698` | `FACEE9C577A5262DBE33AC4930BB0B58C8C037F7` |
| PRG | HVC-SM-0 PRG | 32k | `5CF548D3` | `FEFA1097449A3A11EBF8C6199E905996C5DC8FBD` |
| CHR | HVC-SM-0 CHR | 8k | `867B51AD` | `394BADAF0B0BDD0EA279A1BCA89A9D9DDC00B1B5` |

#### Revisão de Placa #2: `NES-NROM-256-02`

```yaml
Type: NES-NROM-256
PCB: NES-NROM-256-02
Mapper: 0
CIC Type: 3193A
Mirroring: Horizontal
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `D445F698` | `FACEE9C577A5262DBE33AC4930BB0B58C8C037F7` |
| PRG | HVC-SM-0 PRG | 32k | `5CF548D3` | `FEFA1097449A3A11EBF8C6199E905996C5DC8FBD` |
| CHR | HVC-SM-0 CHR | 8k | `867B51AD` | `394BADAF0B0BDD0EA279A1BCA89A9D9DDC00B1B5` |

#### Revisão de Placa #3: `NES-NROM-256-03`

```yaml
Type: NES-NROM-256
PCB: NES-NROM-256-03
Mapper: 0
CIC Type: 6113
Mirroring: Horizontal
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `D445F698` | `FACEE9C577A5262DBE33AC4930BB0B58C8C037F7` |
| PRG | HVC-SM-0 PRG | 32k | `5CF548D3` | `FEFA1097449A3A11EBF8C6199E905996C5DC8FBD` |
| CHR | HVC-SM-0 CHR | 8k | `867B51AD` | `394BADAF0B0BDD0EA279A1BCA89A9D9DDC00B1B5` |

#### Revisão de Placa #4: `NES-NROM-256-03`

```yaml
Type: NES-NROM-256
PCB: NES-NROM-256-03
Mapper: 0
CIC Type: 6113
Mirroring: Horizontal
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `D445F698` | `FACEE9C577A5262DBE33AC4930BB0B58C8C037F7` |
| PRG | HVC SM-0 PRG | 32k | `5CF548D3` | `FEFA1097449A3A11EBF8C6199E905996C5DC8FBD` |
| CHR | HVC SM-0 CHR | 8k | `867B51AD` | `394BADAF0B0BDD0EA279A1BCA89A9D9DDC00B1B5` |

#### Revisão de Placa #5: `NES-NROM-256-04`

```yaml
Type: NES-NROM-256
PCB: NES-NROM-256-04
Mapper: 0
CIC Type: 6113B1
Mirroring: Horizontal
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `D445F698` | `FACEE9C577A5262DBE33AC4930BB0B58C8C037F7` |
| PRG | HVC-SM-0 PRG | 32k | `5CF548D3` | `FEFA1097449A3A11EBF8C6199E905996C5DC8FBD` |
| CHR | HVC-SM-0 CHR | 8k | `867B51AD` | `394BADAF0B0BDD0EA279A1BCA89A9D9DDC00B1B5` |

---

### <a id="tag-team-wrestling"></a>Tag Team Wrestling (USA)

- **Publisher:** Data East
- **Catalog ID:** `NES-TT-USA`
- **Página no NES Directory:** [https://nesdir.github.io/BF250AF2_USA.html](https://nesdir.github.io/BF250AF2_USA.html)

#### Revisão de Placa #1: `NES-NROM-256-02`

```yaml
Type: NES-NROM-256
PCB: NES-NROM-256-02
Mapper: 0
CIC Type: 3193A
Mirroring: Vertical
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `BF250AF2` | `CE53F6B645874BD567F6F30D34034B8DD123D549` |
| PRG | NES-TT-0 PRG | 32k | `77DAFD89` | `FCE47DED97E3D58F56C189F04FB5977A6EEC359F` |
| CHR | NES-TT-0 CHR | 8k | `D911390D` | `47985AEC50207FEDC3CEC41EFB6A2318E18EC1EA` |

#### Revisão de Placa #2: `NES-NROM-256-05`

```yaml
Type: NES-NROM-256
PCB: NES-NROM-256-05
Mapper: 0
CIC Type: 6113B1
Mirroring: Vertical
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `BF250AF2` | `CE53F6B645874BD567F6F30D34034B8DD123D549` |
| PRG | NES-TT-0 PRG | 32k | `77DAFD89` | `FCE47DED97E3D58F56C189F04FB5977A6EEC359F` |
| CHR | NES-TT-0 CHR | 8k | `D911390D` | `47985AEC50207FEDC3CEC41EFB6A2318E18EC1EA` |

---

### <a id="tennis"></a>Tennis (USA)

- **Publisher:** Nintendo
- **Catalog ID:** `NES-TE-USA`
- **Página no NES Directory:** [https://nesdir.github.io/D4D9E21A_USA.html](https://nesdir.github.io/D4D9E21A_USA.html)

#### Revisão de Placa #1: `NES-NROM-128-01`

```yaml
Type: NES-NROM-128
PCB: NES-NROM-128-01
Mapper: 0
CIC Type: 3193A
Mirroring: Vertical
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `D4D9E21A` | `DC851C8DD5F7D6B402D1402C4239400A88382A1F` |
| PRG | HVC-TE-0 PRG | 16k | `8B2E3E81` | `E54274C0B0D651458C5459D41872B1F99904D0FB` |
| CHR | HVC-TE-0 CHR | 8k | `3A34C45B` | `2CC26A01C38EAD50503DCCB3EE929BA7A2B6772C` |

#### Revisão de Placa #2: `NES-NROM-128-02`

```yaml
Type: NES-NROM-128
PCB: NES-NROM-128-02
Mapper: 0
CIC Type: 3193A
Mirroring: Vertical
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `D4D9E21A` | `DC851C8DD5F7D6B402D1402C4239400A88382A1F` |
| PRG | HVC-TE-0 PRG | 16k | `8B2E3E81` | `E54274C0B0D651458C5459D41872B1F99904D0FB` |
| CHR | HVC-TE-0 CHR | 8k | `3A34C45B` | `2CC26A01C38EAD50503DCCB3EE929BA7A2B6772C` |

#### Revisão de Placa #3: `NES-NROM-128-03`

```yaml
Type: NES-NROM-128
PCB: NES-NROM-128-03
Mapper: 0
CIC Type: 6113
Mirroring: Vertical
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `D4D9E21A` | `DC851C8DD5F7D6B402D1402C4239400A88382A1F` |
| PRG | HVC-TE-0 PRG | 16k | `8B2E3E81` | `E54274C0B0D651458C5459D41872B1F99904D0FB` |
| CHR | HVC-TE-0 CHR | 8k | `3A34C45B` | `2CC26A01C38EAD50503DCCB3EE929BA7A2B6772C` |

---

### <a id="urban-champion"></a>Urban Champion (USA)

- **Publisher:** Nintendo
- **Catalog ID:** `NES-UC-USA`
- **Página no NES Directory:** [https://nesdir.github.io/656D4265_USA.html](https://nesdir.github.io/656D4265_USA.html)

#### Revisão de Placa #1: `NES-NROM-128-02`

```yaml
Type: NES-NROM-128
PCB: NES-NROM-128-02
Mapper: 0
CIC Type: 3193A
Mirroring: Horizontal
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `656D4265` | `9DF9BB3775E8CCA0214E3765CDC0443EF81636C4` |
| PRG | HVC-UC-0 PRG | 16k | `D31E4238` | `40B31EDA5C83097100F203774E76EFB389EB01D7` |
| CHR | HVC-UC-0 CHR | 8k | `8777CEF2` | `93D763E427BD590D56FACB0750C73D4D900DD3EF` |

#### Revisão de Placa #2: `NES-NROM-128-06`

```yaml
Type: NES-NROM-128
PCB: NES-NROM-128-06
Mapper: 0
CIC Type: 6113B1
Mirroring: Horizontal
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `656D4265` | `9DF9BB3775E8CCA0214E3765CDC0443EF81636C4` |
| PRG | HVC-UC-0 PRG | 16k | `D31E4238` | `40B31EDA5C83097100F203774E76EFB389EB01D7` |
| CHR | HVC-UC-0 CHR | 8k | `8777CEF2` | `93D763E427BD590D56FACB0750C73D4D900DD3EF` |

---

### <a id="virus"></a>Virus (USA)

- **Publisher:** Nintendo
- **Catalog ID:** `NES-VU-USA`
- **Página no NES Directory:** [https://nesdir.github.io/A9068D17_USA.html](https://nesdir.github.io/A9068D17_USA.html)

#### Revisão de Placa #1: `NES-NROM-256-02`

```yaml
Type: NES-NROM-256
PCB: NES-NROM-256-02
Mapper: 0
CIC Type: 3193A
Mirroring: Vertical
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `A9068D17` | `4E95BE231674603BD106443E4AE581C87C00C867` |
| PRG | VIRUS 4 08A8 | 32k | `BEBA9AC6` | `891E252B6AA17CC16B2CB05737149FB1BB592E96` |
| CHR | - | 8k | `1D904031` | `1E39566299BC2BAB2257B52459F71F94394F9F22` |

#### Revisão de Placa #2: `NES-SIEPROM-01`

```yaml
Type: NES-SIEPROM
PCB: NES-SIEPROM-01
Mapper: 1
CIC Type: 6113B1
Mirroring: Dynamic
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `5EDEC8CD` | `BA0429D47E0C0E0E83AFC987CA65ECC0FF809935` |
| PRG | VIRUS 2-2-90 PRG 5039 | 32k | `14F7B86C` | `73C5F8C574E46EAFE8E177B633118DE1BC552B12` |
| CHR | VIRUS 2-2-90 CHR 6581 | 16k | `D06589FE` | `954007D3F38B2135DAC2A2FE655F01142C012325` |

---

### <a id="volleyball"></a>Volleyball (USA)

- **Publisher:** Nintendo
- **Catalog ID:** `NES-VB-USA`
- **Página no NES Directory:** [https://nesdir.github.io/27777635_USA.html](https://nesdir.github.io/27777635_USA.html)

#### Revisão de Placa #1: `NES-NROM-256-02`

```yaml
Type: NES-NROM-256
PCB: NES-NROM-256-02
Mapper: 0
CIC Type: 3193A
Mirroring: Horizontal
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `27777635` | `BF2E3B079771BC20C48BEFBA9F05BF6504C2D6FE` |
| PRG | NES-VB-0 PRG | 32k | `0A2490AF` | `3CC766A7C760EC394EC43A4414718022CF9D99CE` |
| CHR | NES-VB-0 CHR | 8k | `2415DCE2` | `FD89B4A542989A89C2D0467257DCA57518BFA96B` |

#### Revisão de Placa #2: `NES-NROM-256-03`

```yaml
Type: NES-NROM-256
PCB: NES-NROM-256-03
Mapper: 0
CIC Type: 6113
Mirroring: Horizontal
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `27777635` | `BF2E3B079771BC20C48BEFBA9F05BF6504C2D6FE` |
| PRG | NES-VB-0 PRG | 32k | `0A2490AF` | `3CC766A7C760EC394EC43A4414718022CF9D99CE` |
| CHR | NES-VB-0 CHR | 8k | `2415DCE2` | `FD89B4A542989A89C2D0467257DCA57518BFA96B` |

---

### <a id="wild-gunman"></a>Wild Gunman (USA)

- **Publisher:** Nintendo
- **Catalog ID:** `NES-WG-USA`
- **Página no NES Directory:** [https://nesdir.github.io/B8B9ACA3_USA.html](https://nesdir.github.io/B8B9ACA3_USA.html)

#### Revisão de Placa #1: `NES-NROM-128-01`

```yaml
Type: NES-NROM-128
PCB: NES-NROM-128-01
Mapper: 0
CIC Type: 3193
Mirroring: Horizontal
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `B8B9ACA3` | `B038D3C653DAA0E3D671E373A3813C971EE8EC85` |
| PRG | HVC-WG-0 PRG | 16k | `0D3CF705` | `2C6A0D239BF0140830A96A343871FFB207B3095C` |
| CHR | HVC-WG-0 CHR | 8k | `A5E04856` | `9194D89A34F687742216889CBB3E717A9AE81C92` |

#### Revisão de Placa #2: `NES-NROM-128-01`

```yaml
Type: NES-NROM-128
PCB: NES-NROM-128-01
Mapper: 0
CIC Type: 3193
Mirroring: Horizontal
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `5112DC21` | `598958B8253CB1E6319D351B8FC50A169D863472` |
| PRG | HVC-WG-1 PRG | 16k | `389960DB` | `6B38F2C86EF27F653A2BDB9C682AC0BC981C7DB6` |
| CHR | HVC-WG-0 CHR | 8k | `A5E04856` | `9194D89A34F687742216889CBB3E717A9AE81C92` |

#### Revisão de Placa #3: `NES-NROM-128-02`

```yaml
Type: NES-NROM-128
PCB: NES-NROM-128-02
Mapper: 0
CIC Type: 3193A
Mirroring: Horizontal
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `5112DC21` | `598958B8253CB1E6319D351B8FC50A169D863472` |
| PRG | HVC-WG-1 PRG | 16k | `389960DB` | `6B38F2C86EF27F653A2BDB9C682AC0BC981C7DB6` |
| CHR | HVC-WG-0 CHR | 8k | `A5E04856` | `9194D89A34F687742216889CBB3E717A9AE81C92` |

#### Revisão de Placa #4: `NES-NROM-128-04`

```yaml
Type: NES-NROM-128
PCB: NES-NROM-128-04
Mapper: 0
CIC Type: 6113A
Mirroring: Horizontal
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `5112DC21` | `598958B8253CB1E6319D351B8FC50A169D863472` |
| PRG | HVC-WG-1 PRG | 16k | `389960DB` | `6B38F2C86EF27F653A2BDB9C682AC0BC981C7DB6` |
| CHR | HVC-WG-0 CHR | 8k | `A5E04856` | `9194D89A34F687742216889CBB3E717A9AE81C92` |

---

### <a id="wrecking-crew"></a>Wrecking Crew (USA)

- **Publisher:** Nintendo
- **Catalog ID:** `NES-WR-USA`
- **Página no NES Directory:** [https://nesdir.github.io/9B506A48_USA.html](https://nesdir.github.io/9B506A48_USA.html)

#### Revisão de Placa #1: `NES-NROM-256-01`

```yaml
Type: NES-NROM-256
PCB: NES-NROM-256-01
Mapper: 0
CIC Type: 3193
Mirroring: Vertical
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `9B506A48` | `DEE513DAD7223CFC81BCD859D0AAC6746349CB25` |
| PRG | HVC-WR-0 PRG | 32k | `4328B273` | `764D68F05F4A6E43FB26D7E654E237D2B0258FE4` |
| CHR | HVC-WR-0 CHR | 8k | `23F0B9FD` | `C7F2D4F5F555490847654B8458687F94FBA3BD12` |

#### Revisão de Placa #2: `NES-NROM-256-02`

```yaml
Type: NES-NROM-256
PCB: NES-NROM-256-02
Mapper: 0
CIC Type: 3193A
Mirroring: Vertical
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `9B506A48` | `DEE513DAD7223CFC81BCD859D0AAC6746349CB25` |
| PRG | HVC-WR-0 PRG | 32k | `4328B273` | `764D68F05F4A6E43FB26D7E654E237D2B0258FE4` |
| CHR | HVC-WR-0 CHR | 8k | `23F0B9FD` | `C7F2D4F5F555490847654B8458687F94FBA3BD12` |

#### Revisão de Placa #3: `NES-NROM-256-05`

```yaml
Type: NES-NROM-256
PCB: NES-NROM-256-05
Mapper: 0
CIC Type: 6113B1
Mirroring: Vertical
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `9B506A48` | `DEE513DAD7223CFC81BCD859D0AAC6746349CB25` |
| PRG | HVC-WR-0 PRG | 32k | `4328B273` | `764D68F05F4A6E43FB26D7E654E237D2B0258FE4` |
| CHR | HVC-WR-0 CHR | 8k | `23F0B9FD` | `C7F2D4F5F555490847654B8458687F94FBA3BD12` |

---

### <a id="xevious"></a>Xevious (Europe)

- **Publisher:** Bandai
- **Catalog ID:** `NES-XV-EEC`
- **Página no NES Directory:** [https://nesdir.github.io/D745D7CB_Europe.html](https://nesdir.github.io/D745D7CB_Europe.html)

```yaml
Type: NES-NROM-256
PCB: NES-NROM-256-05
Mapper: 0
CIC Type: 3195A
Mirroring: Vertical
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `D745D7CB` | `47548D1BE1470F086DC94D6784AD01C1733D9AAE` |
| PRG | PAL-XV-0 PRG | 32k | `A8104FB2` | `D8BD8C5A11DF5603285990AEF02A26D765389EEC` |
| CHR | NES-XV-0 CHR | 8k | `668B4EE6` | `0500A8D27D9D51169F0D36C437448C84F373FE61` |

---

### <a id="xevious-the-avenger"></a>Xevious: The Avenger (USA)

- **Publisher:** Bandai
- **Catalog ID:** `NES-XV-USA`
- **Página no NES Directory:** [https://nesdir.github.io/DFD70E27_USA.html](https://nesdir.github.io/DFD70E27_USA.html)

```yaml
Type: NES-NROM-256
PCB: NES-NROM-256-04
Mapper: 0
CIC Type: 6113A
Mirroring: Vertical
```

| Type | Name | Size | CRC32 | SHA1 |
| :--- | :--- | :--- | :--- | :--- |
| PRG+CHR | - | - | `DFD70E27` | `E5C335B11989813F30E294D0B30F3C03697F25A0` |
| PRG | NES-XV-0 PRG | 32k | `18D5AF7A` | `9DF099AF132B301DC1C7689DEDA1725F30E46585` |
| CHR | NES-XV-0 CHR | 8k | `668B4EE6` | `0500A8D27D9D51169F0D36C437448C84F373FE61` |

---
