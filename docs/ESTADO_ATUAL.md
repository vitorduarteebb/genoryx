# Estado atual do GENORYX — guia para desenvolvedores

**Leia isto primeiro.** Este arquivo descreve o jogo **como está hoje** no Alpha (`https://alpha.genoryx.com.br`). Não substitui o GDD: o GDD é a visão; este guia é o snapshot jogável.

| Documento | Papel |
| --- | --- |
| **Este arquivo** | O que existe, como funciona, onde está o código, o que ainda não entra |
| [`GAME_DESIGN.md`](GAME_DESIGN.md) | Visão canônica. Muito ainda é alvo, não produto |
| [`ROADMAP.md`](ROADMAP.md) | Milestones, checkboxes, dívida técnica |
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | Princípios de arquitetura (trechos M0/M2 estão defasados; o loop Alpha já passou disso) |
| [`SISTEMAS_BATALHA.md`](SISTEMAS_BATALHA.md) | Combate ponto a ponto: pipeline, alvos, fila, recursos, captura |
| [`SISTEMAS_BREEDING.md`](SISTEMAS_BREEDING.md) | Breeding ponto a ponto: preview, herança, grade, ovo, hatch |
| [`SISTEMAS_PROGRESSAO.md`](SISTEMAS_PROGRESSAO.md) | XP, maturação, economia, mundo, starter |
| [`adr/`](adr/) | Decisão fechada. Não reabrir sem ADR novo |

Marca pública: **GENORYX: Genesis**. Packages internos ainda usam `@nexora/*` (ADR 0012). Nunca chamar o produto de NEXORA, NEXYROM ou grafia próxima.

---

## 0. Como pensar o projeto

O Alpha **não** é o GDD inteiro. A direção (ADR 0013) entregou uma **fatia fina** ponta a ponta:

```text
conta → personagem → starter → Haven → Verdantis → combate → captura
      → coleção → breed → ovo → hatch → market → shop → PvP casual
```

Cada sistema funciona. Nenhum está “completo”. Profundidade (dungeons, guildas, ranked com MMR, Unity conectado, NFT) vem depois, na ordem do GDD §99.

**Regra de ouro:** cliente envia intenção. Servidor calcula e persiste. Proibido aceitar do body/socket: Gold, NEX, XP, damage, loot, drop, capture chance, genes, fertility, MMR, vencedor de PvP. Números em `@nexora/config`. Regras em `@nexora/game-engine`. RNG só via `RandomService`. GOLD só via ledger (`CurrencyTransaction`).

---

## 1. O que está live vs o que não está

### Live no Alpha (jogável)

- Conta, JWT, um personagem por conta
- Mundo Phaser Haven ↔ Verdantis (Colyseus)
- 12 espécies no seed; starter Pyron / Nympha / Florune + 2 companions (roster 5)
- Coleção, party 3, deck 30 (3×10 loci)
- Combate PvE selvagem e PvP casual no **mesmo** `reduceBattle` (HTTP, não sala Colyseus)
- Captura com NexOrb (chance no servidor)
- Breeding com fertilidade 5, GOLD + Genome Catalyst, ovo, hatch, Genesis Reveal
- Evolução BABY → YOUNG → ADULT (Combat XP **e** Maturation XP; jogador confirma na Câmara)
- Loja de orbes, inventário, marketplace de criaturas reveladas
- Chassi 3D montado do DNA na ficha / coleção / lab
- Economy GOLD com ledger; budget diário 800 nos faucets PvE/PvP

### Código existe, mas desligado ou incompleto

| Item | Estado |
| --- | --- |
| Ranked draft 5/ban/pick 3 | API + MatchRules; **MMR não grava** `Ranking` |
| Casual Lab | rotas `/battles/lab/*`; flag `casualLab: false` |
| Combat Matrix V2 / Fusion V2 | flags env off |
| Genetic Power V1 (105/455) | framework + flag `GENETIC_POWER_V1` |
| Gate G1–G6 por idade | `gateCardsByStage: false` (BABY usa G1–G10) |
| Unity World/Battle | `/game-unity` é vitrine; **não** fala com Colyseus |
| Retrato OpenAI 2D | pipeline existe; Alpha costuma `mock`; chassi 3D é o visual canônico |
| NEX | wallet existe, saldo 0, `nex.enabled: false` |

### Não live (schema/GDD só)

Guildas, torres, crafting, profissões, equipamentos, dungeons, world bosses, seasons, NFT/contratos, gasto de NEX, Control Center real, Emberfall/Ashenreach jogável, mobile-first.

---

## 2. Stack e como subir

| App | Porta | Papel hoje |
| --- | --- | --- |
| `apps/web` | 3000 | Next.js + Phaser em `/game` + arena React |
| `apps/api` | 3001 | NestJS — HTTP authoritative (combate, breed, market, economia) |
| `apps/game-server` | 2567 | Colyseus — salas de **mundo** (`haven`, `verdantis`) |
| `apps/admin` | 3002 | Placeholder do Control Center |
| `apps/unity-game` | `/unity-game` | Bundle WebGL do chassi 3D (vitrine) |

Packages: `@nexora/game-engine` (regras puras), `@nexora/config` (números), `@nexora/types` (contratos), `@nexora/database` (Prisma), `@nexora/ui` (primitivos visuais).

```bash
copy .env.example .env
npm install
docker compose up -d          # Postgres 5432 + Redis 6379
npm run db:migrate
npm run db:seed
npm run dev
```

Antes de fechar trabalho: `npm run test`, `lint`, `typecheck`, `build`. Banco só com Prisma Migrate.

Produção Alpha: VPS `85.31.60.84`, Nginx TLS, `docs/DEPLOYMENT.md`. UI que o jogador vê deve ser publicada no fim da tarefa (`deploy/scripts/vps-pack.ps1` + remoto). Docs/ADR sem impacto no Alpha não precisam de deploy.

---

## 3. Loop do jogador (passo a passo)

```text
/register → /login → /create-character → /game/starter
    → /game (Haven)
    → portal → Verdantis (encontros)
    → /game/battle/[id]  (PvE)
    → captura → /game/creatures
    → /game/party  /  /game/deck
    → /game/breeding → ovo → hatch → /game/genesis (Reveal)
    → /game/chamber (evoluir)
    → /game/shop  /  /game/market  /  /game/inventory
    → NPC Arena → /game/arena  (PvP casual)
```

### 3.1 Conta

- `POST /auth/register` · `POST /auth/login` · `POST /auth/refresh` (rotação) · `POST /auth/logout` · `GET /auth/me`
- Senha Argon2id. Access JWT ~15 min (`typ=access`). Refresh opaco; hash SHA-256 no banco. Reuso de refresh revogado mata a sessão.
- No registro: wallets GOLD e NEX. **Alpha dá 100 000 GOLD** (`economyProfiles.alpha.starting.gold`) para testar sinks. NEX = 0.
- Dívida: access JWT sem denylist — após logout o token segue válido até o TTL.

### 3.2 Personagem

- Um por conta (`Character.userId` unique). Nome único normalizado.
- Cliente manda só `name`. Classe no servidor: **HUNTER**. Enum existe (GUARDIAN, ARCANIST, TAMER…) mas **não há escolha de classe** no fluxo Alpha.
- Aparência: `PATCH /characters/me/appearance` + página `/game/appearance`. Cosmético. Não altera dano, captura, genes nem MMR.
- Posição (`mapKey`, `posX`, `posY`) só o **game-server** persiste. Recusar `x/y` no body HTTP.

### 3.3 Starter

- Página `/game/starter`. `POST /creatures/starter`.
- Escolha: **Pyron** (fogo), **Nympha** (água) ou **Florune** (natureza).
- Servidor entrega o starter + 2 companions das outras espécies (`alphaConfig.starterCompanions`) até roster **5**.
- Cada criatura nasce com 10 loci × 2 alelos, genes de atributo, Visual DNA / chassi, e kit G1–G10 selado (`expressedJson`). Cliente **não** gera genes.

---

## 4. Mundo

Renderer jogável: **Phaser 3** em `/game` (1280×720). Phaser = **DEV_WORLD** (ADR 0027): bloco colorido, HUD de jogo, não o visual final. Unity é a fundação estética (HavenSlice); flag `WORLD_RENDERER` default `web`.

### Mapas playable

| Mapa | Sala Colyseus | O que tem |
| --- | --- | --- |
| **Haven** | `haven` | Cidade inicial. Sem encontros. NPCs stub. Portal para Verdantis |
| **Verdantis** | `verdantis` | Floresta. Mobs no chão + chance de encontro por passo. Portal de volta |

Emberfall/Ashenreach existem no seed de spawn — **sem sala, sem mapa jogável**.

Movimento: cliente manda intenção; servidor clampa colisão, bounds, velocidade (`worldConfig.maxSpeed` 180). Tick 20 Hz. Persistência com throttle 3 s.

### NPCs em Haven (`packages/config/src/world.ts`)

| Key | Nome | Papel no Alpha |
| --- | --- | --- |
| `professor_kael` | Kael | Tutorial / primeira captura |
| `breeder_lyra` | Lyra | Abre breeding / Genesis Lab |
| `blacksmith_orin` | Orin | Forja — diálogo stub (crafting **não** existe) |
| `merchant_theo` | Theo | Loja de NexOrbs |
| `arena_master` | Mestre da Arena | Fila PvP casual |
| `genesis_chamber` | Câmara Genesis | Confirmar evolução de estágio |

Diálogo é stub. Deep-link de UI (shop, breed, arena, chamber) é o que importa.

### Encontros (só Verdantis)

Dois caminhos:

1. **Mob no chão** (`verdantisMobSpawns`) — Florune, Nympha, Noctyr, Terranox (common / uncommon / elite / boss placeholder). Aggro PASSIVE / DEFENSIVE / AGGRESSIVE. Respawn 45 s – 10 min conforme família.
2. **Passos** — chance `0.14` por passo, cooldown 8 passos, offer TTL 90 s.

Colyseus cria `EncounterOffer` no Postgres. Combate **não** roda na sala. Cliente chama `POST /battles/wild` com `offerId`. Haven não spawna.

Landmarks de Verdantis (referência de zona, não quest): Haven Gate, Forest Path, Crystal Clearing, Ancient Ruin, River, Terranox Territory, Elite Clearing, portal do próximo bioma (ainda não leva a outro mapa).

---

## 5. Criaturas — o coração do jogo

Uma criatura **não** é “Pyron modelo 02”. É um fenótipo congelado no nascimento: Genome → Expression → Combat Identity → kit G1–G10. Duas da mesma espécie podem ser excelentes, medianas ou estranhas. Breeding recombina tudo.

### 5.1 Espécies (seed)

12 espécies. Starters marcados.

| Elemento | Espécie | Starter | Body plan (visual) | Head |
| --- | --- | --- | --- | --- |
| Fogo | **Pyron** | sim | QUADRUPED | DRACONIC |
| Fogo | Drakor | | QUADRUPED | DRACONIC |
| Água | **Nympha** | sim | AMPHIBIAN | SERPENT |
| Água | Aqualis | | ABYSSAL | SERPENT |
| Natureza | **Florune** | sim | BIPED | EXOTIC |
| Terra | Terranox | | GOLEM | BEAST |
| Terra | Grumak | | GOLEM | BEAST |
| Elétrico | Voltaris | | AVIAN | EXOTIC |
| Elétrico | Sparkyn | | INSECTOID_BIPED | EXOTIC |
| Gelo | Cryon | | FLOATING | EXOTIC |
| Sombrio | Noctyr | | SERPENT_WYRM | SERPENT |
| Luz | Lumera | | HUMANOID_BEAST | DRACONIC |

Elemento Arcano existe na tabela de vantagem; nenhuma espécie seed é ARCANE ainda.

### 5.2 Elementos

Vantagem v1 (`packages/config/src/elements.ts`):

- Água > Fogo > Natureza > Terra > Elétrico > Água
- Luz > Sombrio > Arcano > Luz
- **Gelo não tem vantagem** (neutro até o GDD decidir). Não inventar no código.

Multiplicadores: forte **1.25**, fraco **0.8**, neutro **1**.

### 5.3 Genes de atributo

Cada criatura persiste ranks **F E D C B A S SS** em:

HP, ATK, DEF, MAG, RES, SPD, CRIT, EVASION (EVA), STATUS, mais refinamento CRIT_DAMAGE e PRECISION.

Multiplicadores de combate (placeholders de balance — ROADMAP aberto):

| Rank | Mult. | Crit chance |
| --- | ---: | ---: |
| F | 0.70 | 2% |
| E | 0.80 | 3% |
| D | 0.90 | 4% |
| C | 1.00 | 5% |
| B | 1.10 | 7% |
| A | 1.25 | 10% |
| S | 1.45 | 14% |
| SS | 1.70 | 18% |

Crit damage base **1.5×**. Nenhuma parte física sozinha define a criatura: o fenótipo é soma com tetos de config (caps por peça ainda são TODO).

### 5.4 Dez loci de cartas (DNA, não TCG)

Toda Creature nasce com **exatamente 10 Genetic Card loci**. Cada locus tem alelo **expressed** (carta na batalha) e **recessive** (escondido; pode aparecer no filho). Persistido em `creature_loci`. ADR 0011.

| Locus | Papel | Kit V1 (custo energia, função típica) |
| --- | --- | --- |
| G1 | BASIC_ATTACK | 1 — ATTACK |
| G2 | SECONDARY_ATTACK | 1 — MOBILITY / ATTACK |
| G3 | ELEMENTAL | 2 — ATTACK / DOT / AOE |
| G4 | DEFENSE | 2 — SHIELD / DEFENSE |
| G5 | UTILITY | 1 — UTILITY / BUFF |
| G6 | CONTROL | 2 — CONTROL / DEBUFF |
| G7 | REACTION | 2 — COUNTER |
| G8 | SYNERGY | 2 — SUPPORT / SUSTAIN / HEAL |
| G9 | SIGNATURE | 3 — ATTACK / CONTROL / EXECUTE |
| G10 | ULTIMATE | 4 — AOE / EXECUTE / SUSTAIN |

O kit jogável **não** é “4 skills fixas”. O servidor deriva G1–G10 do DNA (`gxr-kit-v1` / GCE `gxr-gce-v1`), sela em `expressedJson` na primeira leitura e **não reescreve** versão antiga. Combate usa a ficha `resolved`, não o catálogo fino. `GET /creatures/:id/card-kit`.

Custo de carta no kit: **1–4** energia (desacoplado do “rank” G#).

### 5.5 Idade e duas réguas de progressão

Estágios: `EGG → BABY → YOUNG → ADULT`. É o **mesmo indivíduo** (mesmo ID, geneticHash, pais). Evoluir **não** rerolla genes.

| Transição | Combat level | Maturation XP |
| --- | ---: | ---: |
| BABY → YOUNG | ≥ 10 | ≥ 100 |
| YOUNG → ADULT | ≥ 20 | ≥ 350 |

Stats derivados ganham multiplicador pequeno: BABY 1.00, YOUNG 1.04, ADULT 1.08. Não é +50% de dano.

**Combat XP / Level** (`Creature.xp`, `level`) ≠ **Maturation XP** (`maturationXp`). BABY não amadurece parado: precisa estar na party ativa de PvE no World. Grant idempotente por `battleId + creatureId`.

Maturation por família de encontro: COMMON 2, UNCOMMON 4, ELITE 10, BOSS 25. Participation 0.25–1.0 (cartas, dano, suporte, vivo). Derrota paga 25%. Repetir a mesma species no dia reduz (100% / 70% / 40%). Primeira vitória da species no bioma: bônus 1.5×. GOLD/NEX **não** vendem Growth.

Quando level **e** maturation batem: estado `READY_TO_EVOLVE`. Jogador confirma na **Câmara Genesis** (`POST /creatures/:id/evolve`). Sem confirmação automática.

Alvo de design: BABY usa G1–G6, YOUNG G1–G8, ADULT G1–G10 (G9/G10 só adulto). **No Alpha o gate está desligado** — senão o plantel BABY perderia G7–G10.

Nível máximo de criatura: 50. Curva XP: base 80, growth 1.12 (`xpConfig`). Personagem: base 100, growth 1.15.

Renomear: `PATCH /creatures/:id`, só o dono, servidor valida o nome.

### 5.6 Visual — o que o jogador vê

**Canônico no Alpha: chassi 3D modular** (ADR 0029 / 0032 / 0033).

- Contrato: `GENORYX_CORE_CHASSIS_V1` + rig `GENORYX_CORE_RIG` (21 bones).
- Servidor fecha `visualGenomeJson` + `chassisSignature` **unique**. Duas criaturas vivas não compartilham a mesma assinatura.
- Peças (IDs nunca renomear sem migration): 4 heads, 5 eyes, horns (5 + NONE), 5 limbs, 5 tails, backs (5 + NONE), 5 cores, 6 patterns, auras.
- Cores: body / accent / emissive de catálogo. Paleta avivada; o compositor **não inventa** cor fora da lista.
- Cliente **não** escolhe fenótipo. Unity/WebGL só monta o que o servidor mandou.
- Idade = escala no mesmo rig (Baby / Juvenile / Adult), não modelo novo.
- Anatomia: cabeças e tamanhos de olho deformam a malha (ADR 0033).

Persistido de verdade como colunas próprias hoje: BODY + HEAD (expresso/recessivo). EYES, HORNS, membros, cauda, pattern, back, aura ainda saem do Visual DNA (espécie + seed + body/head) — TODO de schema.

Camada 2D (retrato OpenAI, ADR 0015): job `CreatureVisualAsset`. IA **nunca** escolhe genes. Recessivos não vão no prompt. Genesis Reveal: hatch → `PENDING_VISUAL` → `READY_TO_REVEAL` → `REVEALED`. Reveal não altera DNA. No Alpha o retrato é opcional; a coleção pinta o chassi.

Arte de carta (`CardArtAsset`, ADR 0018/0023): por definição+variant **ou** creature-specific. A IA desenha o efeito; o frontend põe moldura, custo, G#, texto. Recessivo oculto não mostra arte. Balancear dano **não** regenera imagem.

Ficha (`/game/creatures/[id]`): presentation-first. Hero = modelo 3D READY; retrato 2D nos cards. Abas alvo: Overview, Genetics, Cards, Lineage, History, NFT (NFT ainda placeholder).

### 5.7 Combat Identity e recurso pessoal

No nascimento o Genetic Combat Engine (ADR 0035) congela um snapshot (`combatManifestJson`): expressão, `birthSeed`, identidade de combate, G1–G10, budget, reações, novelty. Versão nova do algoritmo **não** reescreve criatura antiga.

**Recurso pessoal** (ADR 0036) não é uma barra global. Nasce da identidade daquela criatura: como ganha, teto, o que destrava, o que consome, o que arrisca. Duas com “Calor” podem jogar diferente.

Tokens visuais (ícone + texto gerado das **regras**, sem glossário hardcoded): HEAT (Calor), STONE (Rocha), SPORE (Esporo), TIDE (Maré), SPARK (Faísca), VOID (Vazio), ECHO (Eco), FROST (Geada), FOCUS (Foco), RAGE (Fúria), MOMENTUM (Impulso), CHARGE (Carga), ESSENCE (Essência), FEROCITY (Ferocidade), GUARD (Guarda).

Status de campo (camada aparte): Burn, Wet, Shock, Poison, Cracked, Marked, Frost, Focus, Exposed, etc. Recusa de jogada por recurso insuficiente é **authoritative**.

### 5.8 Party e deck fora de batalha

- Party: **3** criaturas (`PUT /party`). Roster do jogador: 5 no starter.
- Deck de batalha: as 10 manifestações expressed de cada uma das 3 = **30 cartas**. Sem recortar para 16, sem cartas genéricas de preenchimento (ADR 0037).
- Mão: começa 5, compra 2 por round, máximo 8.

---

## 6. Combate

**Não é TCG.** Cartas são a UI das habilidades da build genética.

Transporte: **HTTP**. `POST /battles/wild`, `GET /battles/:id`, `POST /battles/:id/actions`. Cliente manda `PLAY_CARD` / `CAPTURE` / etc. Phaser/React **só apresentam**. Não existe sala Colyseus `battle-pve` no Alpha.

Motor único: `packages/game-engine/src/battle/reduce.ts` + `v15/`. Casual, Ranked, PvE e Lab (quando ligado) recebem `MatchRules`. Proibido `CasualBattleEngine` ou `if (casual)` no reduce (ADR 0038).

### 6.1 Peças em campo

Alvo de design: 1 personagem + 3 criaturas. No Alpha casual/PvE o personagem **não** injeta cartas de equipamento (equipamento não existe). As 3 criaturas estão em formação.

### 6.2 Formação e targeting

Linha **FRONT → MID → BACKLINE**.

Slots legados na UI: `FRONT` / `BACK_LEFT` (≈ MID) / `BACK_RIGHT` (≈ BACKLINE). Formação linear `MIDDLE`/`BACK` também é aceita.

- Frente sempre exposta.
- Meio e retaguarda protegidos enquanto houver aliado à frente.
- Bypass só com tag genética (Assassin, Pierce, AoE) — servidor manda `validTargets`.
- Morte na frente: **collapse** (MID vira frente, BACKLINE avança).

### 6.3 Energia, mão, turno

- Energia do round = número do turno, clamp 1–10 (`energyForRound`).
- Momentum existe no config (0–8); não é o recurso pessoal da criatura.
- Action Queue (V1.5): reserva energia; se ação anterior invalidar o alvo, devolve carta e libera reserva. `retargetPolicy` default `NONE`.
- Reaction Slot: 1 carta, custo pago ao armar; resolve ou expira **sem** reembolso. Profundidade máxima 3.
- Genetic Chain: só com conexão `produces / reactsTo / consumes` entre criaturas **diferentes**. Recompensa = Team Resonance 0–3, **não** +% dano genérico.
- Battle Pressure (anti-stall): rounds 12 / 15 / 18 cortam eficiência de cura e escudo.
- Status + Resolve anti-CC em config (`STUN`, `FREEZE`, `HARD_ROOT`, `SILENCE`).

Pipeline oficial do reduce: validar → reservar/pagar → posição → efeito → status → reações → recursos → reaction window → morte → collapse → chain → resonance → vitória → log.

### 6.4 Modos (`MatchRules`)

| Modo | Timer | Hints | Draft | MMR | Lab mods |
| --- | --- | --- | --- | --- | --- |
| PVE | não | sim | não | não | — |
| CASUAL | não | sim | não | não | — |
| RANKED | 45 s + bank 120 s | não | 5 / ban 1 / pick 3 | flag on, **persistência off** | — |
| LAB | — | — | sim | não | desligado |

PvP: `POST /pvp/queue` com `CASUAL | RANKED`. Draft: `POST /battles/:id/draft`. UI arena: `/game/arena`. PvP casual **não** paga GOLD.

Replay/reconnect: snapshot + `matchSeed` + ações (fundação). Log em `BattleLog`.

### 6.5 O que o combate ainda não é

- Ban/pick no PvE
- Sinergia evolutiva FORNALHA VIVA → FORTALEZA VIVA (catálogo 105/455)
- Guerra Mágica / pilha LIFO ADR 0030 ligada no reduce
- Trainer NPC rico, dungeon, raid
- Cartas de personagem / equipment / relic
- Arena Unity oficial (flag `BATTLE_RENDERER` = `web`; POC em `/dev/unity-battle`)

UI da arena: widescreen, inimigo à esquerda / jogador à direita, modos Ranked / Casual / Adventure na chrome. Engine intacto.

---

## 7. Captura

Fluxo: enfraquecer no PvE → ação `CAPTURE` com um orb do inventário.

Orbes (`captureConfig`):

| Key | Poder | Preço loja (GOLD) |
| --- | ---: | ---: |
| nexorb | 1.00 | 40 |
| nexorb_plus | 1.35 | 120 |
| nexorb_ultra | 1.80 | 350 |
| nexorb_ancient | 2.40 | 1000 |

Chance no servidor: base 0.42, clamp 8%–92%. Fatores: HP do alvo, poder do orb, raridade/nível (engine `rollCapture`). Cliente pode mostrar barra; **nunca** persiste a % que ele calculou.

Tutorial de captura: quest `first-hunt` — 180 GOLD + 3 orbs + 40 XP personagem.

---

## 8. Breeding (núcleo)

Dois pais do **mesmo** personagem → ovo único → incubação → filhote cujo DNA deriva dos pais. Trade-breed (pais de contas diferentes) é futuro.

Cliente manda só `parentAId` e `parentBId`. `POST /breeding/preview` (não revela o filho) e `POST /breeding`.

### Validações

- Posse, `fertility > 0`, nenhum `LOCKED` (listing / combate / outro breed)
- GOLD da fórmula + 1 Genome Catalyst na mesma transação
- Falha = rollback (Gold, catalyst, fertility)

### Fertilidade

Máximo **5/5**. Cada cruzamento: −1 em cada pai. Em 0, não reproduz mais. Impede inflação infinita. Pais **não** ficam locked durante a incubação.

### Custo (servidor, `economy.ts`)

```
cost = 250 * (1 + 0.40 * parentA.breedsUsed + 0.40 * parentB.breedsUsed)
```

Primeiro cruzamento (0 usos cada) = 250 GOLD. Ignore `breedingConfig.costsGoldByPriorBreeds` (2000…) — é legado; o Alpha usa a fórmula da economy.

Unlock de breeding no Alpha: level 1 + `bypassBreedingQuest: true`. Evolução de estágio **não** cobra Gold.

### O que o filho herda

- Stats: sorteio A ou B + drift ±1 rank (chance 8%), clamp F–SS
- 10 loci: alelos expressed+recessive dos dois pais, dominância, expressão recessiva (~20%), recombinação, mutação
- Aparência / chassi derivado do novo DNA
- Elemento; chance de dual-element / mutação (Alpha mutation 8% em `alphaConfig`; breedingConfig lista 3% + bônus surge — conferir a função `calculateBreeding` como fonte)
- Linhagem: `father_id`, `mother_id`, `breeder_id`, `generation`, `birth_date`
- GeneticPower (quando a flag V1 está on): 1/3 pai, 1/3 mãe, 1/3 novo

Mesmo `rngSeed` + mesmos pais = mesmo filho. Só `RandomService`.

### GenesisGrade vs CrossPotential

- **CrossPotential**: faixa no preview (LOW → UNKNOWN). Não é o filho.
- **GenesisGrade**: complexidade da recombinação **depois** do commit (COMMON, REFINED, RARE, EXCEPTIONAL, GENESIS). **Não é força de combate.** Define tempo de incubação.

Incubação Alpha: **0 minutos** em todos os grades (loop testável). Produção (config, não ligado): 30 min / 1 h / 3 h / 8 h / 18 h. Cliente só lê `hatchesAt`. NEX não zera incubação.

Ovo tem arte própria (`EggVisualAsset`) e cascos 3D (incubar / rachar / eclodir). OpenAI não escolhe genes. Falha de imagem **não** cancela o breed.

Hatch: `POST /eggs/:id/hatch` → criatura `PENDING_VISUAL` → Reveal na UI Genesis. DNA já está fechado.

UI: `/game/breeding`, `/game/genesis`, `/game/genesis/[id]`.

---

## 9. Economia

Três camadas: **GOLD** (gameplay, ledger), **NEX** (premium futura, inativa), **ASSETS** (Character, Creature, Egg, itens no Postgres).

GOLD **não** é token. Blockchain **não** entra no hot path. NEX **não** vende poder (dano, genes, captura, win).

Toda mutação de saldo: `credit` / `debit` com `source`, `referenceId`, `balanceBefore`, `balanceAfter` na mesma transação. Saldos `BigInt`. Float é bug. Nunca `balance = balance + n`.

### Fontes e sinks Alpha

| Fonte / sink | Valor |
| --- | --- |
| Start (register) | 100 000 GOLD (faucet de teste) |
| Quest `first-spark` | 300 GOLD + 5 NexOrb + 1 Catalyst |
| Quest `first-hunt` | 180 GOLD + 3 orbs + 40 XP |
| PvE WILD | 12–25 GOLD |
| PvE ELITE | 40–80 |
| PvE BOSS | 120–250 |
| PvP casual | **0** GOLD |
| PvP competitive (config) | 20 / vitória, se MMR existisse |
| Shop orbes | 40 / 120 / 350 / 1000 |
| Breeding | fórmula §8 |
| Market listing | 1% (mín. 5 GOLD) → SYSTEM_SINK |
| Market sale | 5% → SYSTEM_SINK |

Budget diário de faucet PvE/PvP: **800 GOLD**. Depois do cap: corta Gold, mantém XP / material / captura. Tutorial **não** come esse budget.

Genome Catalyst (`genome_catalyst`) é **item**, não currency. Drop PvE (8% wild / 25% elite / 60% boss) + tutorial. Obrigatório no breed (1). Loja **não** vende catalyst ilimitado.

Loja **proibida** de vender: gene, reroll, mutação garantida, DNA perfeito, Growth/Maturation XP, evolve instantâneo, Gold direto.

Inventário: `GET /inventory`. Shop: `GET /shop`, `POST /shop/buy`.

Boost interno de QA: `POST /internal/alpha-test-boost` (não é feature de jogador).

---

## 10. Marketplace

Nome de produto: Nexus Market. Rota `/game/market`.

Hoje lista só **Creature revelada**. Não lista ovo, item, DNA solto nem as 10 cartas como anúncios separados.

Fluxo atômico da compra:

1. Lock do ativo
2. Débito do comprador (preço cheio)
3. Crédito do vendedor (líquido)
4. Crédito da taxa no sink
5. Troca de dono
6. `MarketTransaction`

Erro = rollback. Taxa não some sem ledger. Exemplo 1000 GOLD: listing 10; buyer −1000; seller +950; sink +50 (+ listing).

APIs: `GET /market`, `GET /market/history`, `POST /market/listings`, `POST /listings/:id/buy`, `POST /listings/:id/cancel`. Unlock level Alpha = 1.

---

## 11. Quests Alpha

| Key | O que faz |
| --- | --- |
| `first-spark` | Tutorial inicial: 300 GOLD + 5 orbs + 1 catalyst |
| `first-hunt` | Primeira captura |

Não há árvore de história, daily, guild quest nem dungeon. Schema `Quest` / `QuestProgress` existe para essas duas.

---

## 12. PvP

Casual live: fila, match, mesmo `reduceBattle`, sem GOLD, sem ranking.

Ranked: regras de draft (squad 5 → ban simultâneo → pick 3), timer 45 s + bank 120 s, ranks visuais BRONZE…GENESIS e faixas MMR **no config**. O service **ainda não persiste** MMR em `Ranking`. Não tratar a UI Ranked como ladder real.

Lab competitivo (`/game/lab`): existe para testar draft/chassi; modifiers off.

---

## 13. Unity e o que não é o jogo conectado

| Rota | O que é |
| --- | --- |
| `/game` | Jogo. Phaser + Colyseus + HTTP |
| `/game-unity` | Vitrine do chassi 3D. Bridges `genoryxWorldIntent` / `genoryxBattleIntent` **sem** Colyseus |
| `/dev/unity-battle` | POC de arena |
| `/dev/creature-visual` | Prova do compositor 3D |
| `/dev/card-art-proof` | Prova de arte de carta |
| `/dev/combat-matrix` | Prova Matrix V2 |
| `/dev/genetic-powers` | Prova Genetic Power |

Rebuild do WebGL é **manual** (Unity Editor + `GENORYX/Build/WebGL` + pack). CI não abre o Editor. Bundle publicado pode divergir do repo.

Personagem 3D (ADR 0028) está **em curso**: Creator + peças Meshy. `/game/appearance` não deve fingir 3D completo.

---

## 14. Rotas web (jogador)

**Conta:** `/` · `/register` · `/login` · `/create-character`

**Jogo:**

| Rota | Função |
| --- | --- |
| `/game` | Mundo Phaser |
| `/game/starter` | Escolha Pyron / Nympha / Florune |
| `/game/creatures` · `/game/creatures/[id]` | Coleção e ficha |
| `/game/party` · `/game/deck` | Formação e preview do kit |
| `/game/battle` · `/game/battle/[id]` | Combate |
| `/game/arena` | Fila PvP |
| `/game/lab` · `/game/lab/[id]` | Lab (desligado como produto) |
| `/game/breeding` | Cruzar pais |
| `/game/genesis` · `/game/genesis/[id]` | Ovos e Reveal |
| `/game/chamber` · `/game/evolution/[id]` | Evolução de estágio |
| `/game/shop` · `/game/inventory` · `/game/market` | Economia |
| `/game/appearance` | Visual do tamer |
| `/game-unity` | Vitrine Unity |

---

## 15. APIs HTTP que o jogo usa

Prefixo de produção: `/api/`. Auth Bearer (access JWT), salvo health e auth públicas.

| Área | Métodos |
| --- | --- |
| Auth | `POST /auth/register` `login` `refresh` `logout` · `GET /auth/me` `status` |
| Personagem | `POST /characters` · `GET /characters/me` · `PATCH /characters/me/appearance` |
| Mundo | `GET /world/presentation` (catálogo; posição **não**) |
| Criaturas | `POST /creatures/starter` · `GET /creatures` · `GET/PATCH /creatures/:id` · `GET .../card-kit` · `GET/PUT /party` · `GET /deck` |
| Evolução / Reveal | `GET .../evolution-queue` `genesis-queue` · `POST .../reveal` `evolve` |
| Combate | `POST /battles/wild` · `GET /battles/:id` · `POST /battles/:id/actions` · `POST /battles/:id/draft` |
| PvP | `POST /pvp/queue` `leave` · `GET /pvp/status` |
| Breeding | `POST /breeding/preview` `breeding` · `GET /eggs` `breeding/history` · `POST /eggs/:id/hatch` |
| Economia | `GET /inventory` `shop` · `POST /shop/buy` |
| Market | `GET /` `history` · `POST /listings` · `POST /listings/:id/buy` `cancel` |
| Quests | `GET /quests` · `POST /quests/first-spark/complete` `first-hunt` |
| Health | `GET /health` (postgres + redis) |

Colyseus: join `haven` / `verdantis` com o mesmo access JWT. Sem token ou sem personagem = recusa.

---

## 16. Onde abrir o código

| Assunto | Arquivos |
| --- | --- |
| Números | `packages/config/src/alpha.ts`, `economy.ts`, `combat.ts`, `combat-v15.ts`, `world.ts`, `world-encounters.ts`, `capture.ts`, `incubation.ts`, `life-stage.ts`, `maturation.ts`, `chassis.ts`, `card-kit.ts` |
| Regras | `packages/game-engine/src/battle/reduce.ts`, `battle/v15/`, `genetic-combat/`, `cards/kit.ts`, `breeding/` |
| HTTP | `apps/api/src/modules/battles/`, `creatures/`, `breeding/`, `market/`, `economy/`, `common/ledger.ts` |
| Mundo | `apps/game-server/src/rooms/world-room.ts` |
| UI mundo | `apps/web/src/game/` |
| UI jogo | `apps/web/src/app/game/**` |
| Banco | `packages/database/prisma/schema.prisma`, `seed.ts` |
| 3D criatura | `apps/unity-game/Assets/GENORYX/Scripts/Creature` |
| Deploy | `docs/DEPLOYMENT.md`, `deploy/scripts/` |

Contratos compartilhados: `packages/types` (`GENETIC_CARD_LOCI`, elementos, grades, protocol de mundo).

---

## 17. Modelos Prisma que o Alpha usa de verdade

**Identidade:** User, Profile, Session, RefreshToken, Character  

**Mundo:** GameMap, MapSpawn, Npc, EncounterOffer  

**Criaturas:** CreatureSpecies, Creature, CreatureLocus, CreatureTrait, CreatureAncestry, PartySlot, CreatureVisualAsset, CreatureModelAsset, CardArtAsset, MaturationEvent  

**Combate:** Battle, BattleParticipant, BattleLog, PvpMatch  

**Breeding:** BreedingSession, Egg, EggVisualAsset  

**Economia:** Wallet, CurrencyTransaction, ItemTemplate, Item, InventorySlot, MarketListing, MarketTransaction  

**Quests:** Quest, QuestProgress  

Schema presente **sem produto:** Guild, GuildMember, CharacterProfession, CraftRecipe, Equipment, CreatureEquipment, SkillTemplate, CreatureSkill, FusionDiscovery, WorldEvent, Ranking (tabela existe; MMR ranked não grava).

---

## 18. Princípios ao implementar

1. Um sistema pequeno por vez. Ordem absoluta: GDD §99. TODO crítico sem linha no ROADMAP não existe.
2. Cliente = intenção. Engine puro, testável sem I/O. Sem `Math.random` em combate, captura, breed, loot, visualSeed.
3. Números só em `@nexora/config`. Sem drop rate hardcoded no Nest.
4. Ledger em toda mutação GOLD/NEX. Admin (grant, ban, drop edit) gera `AdminActionLog` com motivo.
5. Migration Prisma; sem `db push` em produção. Sem schema solto no app.
6. Arquivo enorme → quebrar. Domínio ≠ infraestrutura. Engine não importa Prisma, Nest, Redis, React, OpenAI.
7. IA não escolhe genes. Arte é apresentação. DNA só muda por engine (breed, mutação de nascimento).
8. Mudança de arquitetura → ADR em `docs/adr/`.
9. UI deve parecer jogo, não SaaS. Phaser continua DEV_WORLD; não fazer art pass de tilemap.
10. Gameplay de criatura **não** entra no mundo Haven (Haven é cidade). Encontro é em Verdantis.

Antes da fatia: objetivo, arquivos, banco, APIs, riscos. Depois: test / lint / typecheck / build. Se o jogador vê a mudança no Alpha, publicar.

---

## 19. Mapa dos 7 pilares — fatia vs visão

Canônico no GDD §3.1 e ADR 0014. O Alpha prova o fio, não o mapa.

| Pilar | No Alpha hoje | Visão |
| --- | --- | --- |
| 1 Combate | Party 3, deck 30, formação F/M/B, V1.5 no reduce, PvE + casual | Roster 5, ban/pick, sinergias que **criam** cartas, fusion 105/455 |
| 2 Genética física | BODY+HEAD persistidos; resto derivado; chassi 3D live | Todas as camadas persistidas; Meshy peça a peça |
| 3 Status físicos | Ranks F–SS, caps ainda fracos | Soma com tetos por parte; sem aberração +90% ATK |
| 4 Cartas | 10 loci × 2 alelos; kit do DNA | Gate por idade; branch mecânico por cópias (não +% dano) |
| 5 Breeding | Loop fino, incubação 0 min, fertilidade 5 | Tempos de produção, mutações condicionais, trade-breed |
| 6 Progressão | Combat XP + Maturation XP + Câmara | Gate de cartas por estágio ligado; Young/Adult arte contínua |
| 7 Metagame | — | Torre de Poder (Lord of Floor) + Torre de Guilda |

---

## 20. Leitura recomendada por tarefa

| Vai mexer em… | Leia |
| --- | --- |
| Qualquer gameplay | Este arquivo + GDD §3.1 + ROADMAP |
| Combate | `SISTEMAS_BATALHA.md`, depois `COMBAT.md` / `COMBAT_SYSTEM.md`, ADR 0034–0038 |
| Breeding | `SISTEMAS_BREEDING.md`, depois `BREEDING.md`, ADR 0022 |
| Economia / market / XP | `SISTEMAS_PROGRESSAO.md`, `ECONOMY.md`, ADR 0024 |
| Criatura visual / 3D | `CREATURE_3D.md`, `ART_BIBLE.md`, ADR 0029/0032/0033 |
| Evolução / idade | `CREATURE_EVOLUTION.md`, ADR 0025 |
| Mundo / Unity | `VISUAL_DESIGN.md`, `UNITY_GAME.md`, ADR 0026/0027 |
| Auth | `SECURITY.md`, ADR 0005/0007 |
| NFT (não agora) | `WEB3.md`, ADR 0008 |
| Deploy | `DEPLOYMENT.md` |

ADRs 0001–0006 (monorepo, server-authoritative, Prisma, Colyseus, engine puro) continuam válidos. Não viole.

---

*Snapshot alinhado ao Alpha de setembro de 2026. Quando o produto mudar de forma material, atualize este arquivo no mesmo PR — senão o próximo desenvolvedor lê o GDD e implementa o futuro no lugar do presente.*
