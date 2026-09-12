# Batalha — detalhe de implementação (Alpha)

Fonte de regras: `@nexora/game-engine`. Números: `@nexora/config`. Cliente só envia intenção. Combate **não** roda no Colyseus — é HTTP (`POST /battles/:id/actions`).

Visão / fluxograma (alvo, não substitui este arquivo): [`COMBAT.md`](COMBAT.md), [`COMBAT_SYSTEM.md`](COMBAT_SYSTEM.md). Snapshot do produto: [`ESTADO_ATUAL.md`](ESTADO_ATUAL.md). ADRs: `0009`, `0034`–`0038`.

---

## 1. O que é o combate

Não é TCG. Cada criatura nasce com 10 loci G1–G10. As três da formação levam **30 manifestações** para o baralho. A carta é a UI da habilidade genética.

Casual, Ranked, PvE e Lab (quando ligado) usam o **mesmo** `reduceBattle`. Diferenças só em `MatchRules`. Proibido um segundo engine.

```text
cliente PLAY_CARD / QUEUE_CARD / END_TURN / CAPTURE / …
        ↓
apps/api  BattlesService  (auth, posse, orb, persistência)
        ↓
createBattleState / reduceBattle   packages/game-engine
        ↓
Battle.stateJson + BattleLog      Postgres
        ↓
cliente anima o estado canônico
```

---

## 2. Como uma batalha nasce

`createBattleState` (`packages/game-engine/src/battle/create.ts`):

1. Cada lado recebe até **3** criaturas com slot de formação.
2. Stats de combate = base da espécie × multiplicador do gene × nível × estágio de vida (`deriveCombatStats`).
3. Recurso pessoal hidrata da Combat Identity (`combatManifestJson`). Começa no valor de `resetRule.battleStart`.
4. Deck = `buildBattleDeck`: as 10 manifestações **expressed** de cada criatura viva, embaralhadas com `RandomService` da seed da batalha. Recessivo **não** entra.
5. Mão inicial: 5 cartas (`startingHand`), preferindo criaturas vivas.
6. Energia do round 1 = **1**. Momentum 0. Shield 0.

Fórmula de HP (as outras stats usam `0.05` por nível; SPD **não** escala por nível nem estágio):

```text
maxHp = round(baseHp × geneMul(HP) × (1 + (level-1)×0.08) × stageMul)
atk   = round(baseAtk × geneMul(ATK) × (1 + (level-1)×0.05) × stageMul)
```

`stageMul`: BABY 1.00, YOUNG 1.04, ADULT 1.08. Gene F=0.70 … SS=1.70.

PvE: `POST /battles/wild` com `offerId` (EncounterOffer do Colyseus em Verdantis). Party do jogador vs 1 selvagem (as outras slots inimigas podem ser preenchidas pelo serviço; o targeting trata só quem tem HP > 0).

---

## 3. Formação e alvos

Linha canônica: **FRONT → MID → BACKLINE**.

Slots persistidos / UI:

| Slot clássico (Alpha) | Linha |
| --- | --- |
| `FRONT` | Frente |
| `BACK_LEFT` | Meio |
| `BACK_RIGHT` | Retaguarda |

Slots lineares V2 (`MIDDLE`, `BACK`) também mapeiam para a mesma linha (`formation-line.ts`).

**Quem pode ser atingido** (`targeting-resolve.ts`) — o servidor devolve `validTargets`. O cliente não calcula.

| Regra / tag da carta | Alcance |
| --- | --- |
| Ataque normal | Só a linha **exposta** (a mais à frente com vivo) |
| `PIERCE`, `RANGED`, `MOBILITY` | Frente **e** meio |
| `ASSASSIN`, `EXECUTE`, `PREDATOR`, `BACKLINE` | Até a retaguarda |
| `AOE` / `ALL_ENEMIES` | Todos os vivos |
| `SELF` / `ALLY` / `ALL_ALLIES` | Time próprio |
| `TARGET_LOWEST_HP` | Entre os legais, o de menor HP |
| `MARKED_PREY` + status `MARKED` | Pode pular a frente se o marcado estiver atrás |
| `STEALTH` no alvo | Ignorado se existir outro legal sem stealth |
| `TAUNT` no alvo | Obriga o alvo, salvo `IGNORE_TAUNT` |

Se a frente morre: **collapse** — MID vira frente, BACKLINE avança. Cartas da criatura morta saem da mão/deck/fila e vão para `exile`.

---

## 4. Energia, mão, fila

| Chave | Valor Alpha |
| --- | --- |
| Energia no turno N | `min(10, N)` |
| Mão inicial | 5 |
| Compra por round | 2 |
| Mão máxima | 8 |
| Custo de carta do kit | 1–4 (não é o G#) |
| Momentum | 0–8 (config; não é o recurso pessoal) |

**Action Queue (V1.5):** em vez de resolver na hora, o jogador pode `QUEUE_CARD`. A energia é **reservada**, não gasta. `CONFIRM_TURN` resolve a fila em ordem.

Se uma ação anterior mata o alvo:

- `retargetPolicy` default **`NONE`** → carta volta à mão, reserva solta
- políticas futuras: `NEAREST_VALID`, `SAME_LINE`, `LOWEST_HP_VALID`, `MARKED_VALID`

Outras intenções de fila: `UNQUEUE_CARD`, `REORDER_QUEUE`, `RETARGET_QUEUE`.

`PLAY_CARD` imediato **continua válido** (testes V1). Os dois caminhos passam pelo mesmo pipeline.

---

## 5. Pipeline de uma jogada (`PIPELINE_STEPS`)

Ordem oficial em `packages/game-engine/src/battle/v15/pipeline-steps.ts`:

1. `PLAY_OR_QUEUE` — imediato ou enfileira
2. `VALIDATE_SOURCE` — carta na mão, dono certo
3. `VALIDATE_SOURCE_ALIVE` — criatura fonte com HP > 0
4. `VALIDATE_CARD_OWNERSHIP`
5. `VALIDATE_ENERGY` — energia disponível (já descontada a reserva)
6. `VALIDATE_PERSONAL_RESOURCE` — se a carta exige stacks do recurso daquela criatura
7. `RESOLVE_VALID_TARGETS`
8. `RESERVE_OR_PAY_COST`
9. `POSITION_EFFECTS` — bônus/penalidade da linha (frente tank, retaguarda burst)
10. `PRIMARY_EFFECT` — DAMAGE / HEAL / SHIELD / DRAW / …
11. `DAMAGE_SHIELD_HEAL` — escudo absorve antes do HP; cura/escudo passam por **Battle Pressure**
12. `STATUS_APPLICATION` — registry data-driven
13. `ELEMENTAL_REACTIONS` — chart GDD §5 (Gelo neutro)
14. `GENETIC_REACTIONS` — pares de status viram outro status
15. `PERSONAL_RESOURCE_TRIGGERS` — ganho/gasto/decay
16. `REACTION_WINDOW` — slot de reação do oponente
17. `DEATH_CHECK`
18. `FORMATION_UPDATE` — collapse
19. `GENETIC_CHAIN_CHECK`
20. `RESONANCE_CHECK`
21. `WIN_CONDITION` — um lado sem criaturas vivas
22. `EVENT_LOG` — append no `BattleLog` + replay (`matchSeed` + seq)

RNG só via `RandomService` da batalha (seed persistida). Sem `Math.random`.

---

## 6. Recurso pessoal (por criatura)

Não existe “barra de Calor global”. Cada Combat Identity define:

- como ganha (trigger: dano, status, shield, crítico, fim de turno…)
- teto (`maxStacks`)
- o que consome ao jogar carta / ativar efeito
- decay (fim de turno, após ataque, nenhum)
- risco (ex.: overheat)

Tokens visuais: HEAT, STONE, SPORE, TIDE, SPARK, VOID, ECHO, FROST, FOCUS, RAGE, MOMENTUM, CHARGE, ESSENCE, FEROCITY, GUARD.

O HUD gera o texto **das regras**, não de um glossário. Recusa por recurso insuficiente é authoritative — a carta não sai.

---

## 7. Genetic Chain e Team Resonance

Uma carta declara `produces` / `consumes` / `reactsTo` / `transforms`.

Cadeia só conta se:

- o token que a carta consome foi **produzido pela jogada anterior**, e
- a criatura fonte é **outra** (não a mesma)

Recompensa: **+1 Team Resonance** (0→3). No 3/3 o lado pode gastar em `RESONANCE_ACTION`:

| Ação | Efeito |
| --- | --- |
| `RESONANCE_SHIFT` | Troca posição (creatureId + destSlot) |
| `GENETIC_DRAW` | Compra; pode descartar |
| `RESONANCE_AMPLIFY` | Próxima carta da chain amplificada |

Não é +% de dano genérico. Fusion/Convergence de tipologia (V2, flag off) é outra camada.

---

## 8. Reaction Slot

- 1 carta por lado
- Tipos: `REACTION`, `COUNTER`, `INTERCEPT`
- Custo **pago ao armar** (`ARM_REACTION`)
- Resolve na janela do oponente **ou expira sem reembolso**
- Profundidade máxima de reações encadeadas: **3**
- Prioridade: tipo da carta → INTERCEPT → SPD → posição (frente primeiro)

---

## 9. Status

Registry em `packages/config/src/combat-v15.ts`. Stack modes: `STACK`, `REFRESH`, `UNIQUE`, `BUILDUP`.

| Key | Nome | Notas |
| --- | --- | --- |
| BURN | Queimadura | DoT, até 5 stacks, tick fim de turno |
| POISON | Veneno | DoT |
| BLEED | Sangramento | DoT |
| WET | Molhado | Reage com choque → CONDUCTIVE |
| SHOCK | Choque | |
| FROST | Geada | 3 stacks → FREEZE |
| FREEZE | Congelado | Hard control |
| STUN / SILENCE / HARD_ROOT | CC duro | Resolve corta duração |
| CRACKED | Rachado | + BURN → MAGMA |
| MARKED | Marcado | Bypass / caçada |
| EXPOSED | Exposto | + MARKED → HUNT |
| REGEN / HASTE / FORTIFIED / FOCUS | Buffs | |
| RESOLVE | anti-CC | Ganho automático ao sofrer hard control; corta o próximo |

Hard control aplica `RESOLVE` no alvo (máx. 2). Duração do CC cai para 50% / 25% conforme stacks.

Reações genéticas (exemplos): WET+SHOCK → CONDUCTIVE; BURN+CRACKED → MAGMA; FROST+CRACKED → EXPOSED; MARKED+EXPOSED → HUNT.

---

## 10. Battle Pressure (anti-stall)

A partir do round, cura e escudo perdem eficiência:

| Round | Tier | Cura | Escudo |
| --- | ---: | ---: | ---: |
| 1–11 | 0 | 100% | 100% |
| 12+ | I | 75% | 80% |
| 15+ | II | 50% | 55% |
| 18+ | III | 35% | 35% |

---

## 11. Intenções que o cliente pode mandar

| `action.type` | Papel |
| --- | --- |
| `PLAY_CARD` | Joga na hora (`cardInstanceId`, `targetId?`) |
| `QUEUE_CARD` / `UNQUEUE_CARD` / `REORDER_QUEUE` / `RETARGET_QUEUE` | Fila |
| `CONFIRM_TURN` | Resolve a fila |
| `ARM_REACTION` | Arma o slot |
| `RESONANCE_ACTION` | Gasta 3/3 |
| `END_TURN` | Passa; compra; recarrega energia; decay |
| `CAPTURE` | Só PvE; `orbKey` do inventário |
| `FLEE` | PvE foge; PvP trata como concede |
| `CONCEDE` | Desiste |
| `TIMEOUT` | Ranked: fila válida → auto confirm; senão PASS |
| `SET_FORMATION` | Antes do combate / draft |
| `SELECT_FUSION` / `PLAY_FUSION` / `PLAY_CONVERGENCE` | V2, flag off no Alpha |

Cliente **nunca** manda dano, HP, vitória, draw result, chance de captura.

---

## 12. Captura (dentro da batalha PvE)

`rollCapture` em `packages/game-engine/src/capture/chance.ts`.

```text
missing = 1 - hp/maxHp
raw     = 0.42 × orbPower × (0.35 + missing × 0.9)
chance  = clamp(raw, 0.08, 0.92)
```

| Orb | Poder | GOLD na loja |
| --- | ---: | ---: |
| nexorb | 1.00 | 40 |
| nexorb_plus | 1.35 | 120 |
| nexorb_ultra | 1.80 | 350 |
| nexorb_ancient | 2.40 | 1000 |

Sucesso: consome o orb, cria Creature no jogador (origem WILD), encerra a batalha. Falha: consome o orb, luta continua. Chance nunca vem do cliente.

---

## 13. Recompensas PvE (depois do reduce)

Calculadas no **serviço Nest**, não no body:

- GOLD 12–25 (wild) via ledger `PVE_REWARD`, sujeito ao budget diário 800
- Combat XP da criatura (~28 no Alpha config)
- Maturation XP só para party ativa (família COMMON 2 / UNCOMMON 4 / ELITE 10 / BOSS 25 × participation × diversidade)
- Chance de Genome Catalyst (8% wild)

PvP casual: **0 GOLD**.

---

## 14. Modos (`matchRulesFor`)

| | PVE | CASUAL | RANKED | LAB |
| --- | --- | --- | --- | --- |
| Timer | não | não | 45 s + bank 120 s | — |
| Hints | sim | sim | não | — |
| Draft 5/ban/pick 3 | não | não | sim (API) | sim |
| MMR persistido | não | não | **ainda não** | não |
| Lab modifiers | — | — | — | flag `casualLab: false` |

Ranked: timeout com fila válida faz AUTO CONFIRM; sem fila, PASS. Replay = snapshot + `matchSeed` + ações.

---

## 15. Arquivos

| Peça | Caminho |
| --- | --- |
| Reduce | `packages/game-engine/src/battle/reduce.ts` |
| Create | `packages/game-engine/src/battle/create.ts` |
| V1.5 | `packages/game-engine/src/battle/v15/` |
| Targeting | `packages/game-engine/src/battle/targeting-resolve.ts` |
| Deck | `packages/game-engine/src/cards/deck.ts` |
| Stats | `packages/game-engine/src/stats/derive.ts` |
| Captura | `packages/game-engine/src/capture/chance.ts` |
| HTTP | `apps/api/src/modules/battles/battles.service.ts` |
| Config | `packages/config/src/combat.ts`, `combat-v15.ts` |
