# Combate — GENORYX: Genesis

Fluxograma de batalha (formação, alvos, Mana, fusão, Embate): `docs/COMBAT_SYSTEM.md` (ADR 0031). Este arquivo não o substitui.

**Não é um TCG.** Cartas são a interface das habilidades RPG. O deck **não** existe sem Character, criaturas, genes, mutações, equipamento, relíquias, classe e formação.

Motor: ordem absoluta 08 (M4). Visual Phaser é apresentação. **Nada disto entra na M2** (Haven, movimento, Colyseus). Retrato de coleção (arte IA) ≠ sprite de batalha; a primeira versão pode usar o portrait como token (ADR 0015).

Decisão: ADR `0009`. Números em `@nexora/config` (`combat` / `battle`). **Não hardcode** tamanhos de deck, energy ou hand no resolver.

---

## 1. Visão

O jogador leva para a batalha:

- 1 Character
- até 3 Creatures em campo (alvo competitivo: roster 5 → ban 1 → pick 3)
- Equipment e Relics
- Genes e Mutations
- Class
- Formation
- Sinergias da composição e **FusionPool** (typologies; round 5+, não explode a mão)

Esses elementos **geram** o conjunto de cartas. Deck = composição da build.

Party padrão: **1 Character + 3 Creatures**. Todas as três criaturas estão em campo (não “1 ativa / 2 banco” da spec antiga).

Draft competitivo (depois do Alpha casual): **5 no roster → ban 1 → escolhe 3 → formação → deck → batalha.** Cada criatura oferece 10 cartas genéticas; o jogador não usa todas. Idade da criatura limita quais loci entram no pool (GDD §3.1).

Cada criatura contribui: species abilities, genetic abilities, mutation abilities, equipment abilities, passives, ultimate.  
O Character também injeta cartas (pool da classe + equipamento do avatar).

---

## 2. Autoridade

Cliente envia **intenção**, por exemplo:

- `SELECT_DECK` (ids de `CardDefinition` do pool autorizado) — antes da luta
- `SET_FORMATION` (slot → creatureId)
- `PLAY_CARD` + `cardInstanceId` + `targetRef`
- `END_ROUND` / passar
- `FLEE` / `CAPTURE` (PvE, milestones próprias)

Cliente **nunca** decide: draw, disponibilidade da carta, energy, momentum, dano, status, crítico, validade de alvo, RNG, upgrade, efeito de gene, vitória.

Pipeline no servidor:

1. Valida posse e se a carta está na mão e é jogável (custo, alvo, formação).
2. `packages/game-engine`: `reduce(state, action, rng)`.
3. Persiste `Battle` + `BattleLog` (seed + actions).
4. Devolve estado canônico. Phaser anima.

---

## 3. Deck (geração)

1. **Collect:** o servidor monta o *card pool* a partir da build. Base genética: **10 loci expressed por Creature** (ADR 0011) × 3 criaturas = 30 genetic cards, mais Character / equipment / relic.
2. **Modify:** alelos, mutação e gear podem unlock, replace, mudar custo, alvo, elemento, status ou comportamento. Recessivos **não** entram no pool até se expressarem.
3. **Cap do pool:** alvo ~**20–30+** disponíveis (config). O piso genético da party é 30 expressed; o cap do *loadout* é outra chave.
4. **Loadout:** o jogador escolhe ~**16** cartas (`geneticCardConfig.competitiveDeckSize`). Fora do range = recusa. Loadout persistido por personagem (tabela futura); se ausente, deck padrão **determinístico** da build (não RNG no cliente).

Cartas na luta são **instâncias** (id de runtime + `definitionKey` + modificadores já aplicados). Definição continua data-driven.

---

## 4. Hand, round, energy, momentum

Valores **conceituais iniciais** — só config:

| Chave | Alvo inicial |
| --- | --- |
| `startingHand` | 5 |
| `drawPerRound` | 2 |
| `maxHand` | 8 |
| `energyPerRound` | 1 no turno 1; no turno N o lado recebe N, até `maxEnergy` 10 |

Custo / **rank de poder** das cartas: **1 a 10**. Turno 1 só joga rank 1; turnos seguintes abrem ranks maiores. Buffs/debuffs de energy existem no modelo.

**Momentum** (recurso secundário): crítico, counter, kill, combo, cartas específicas. Alimenta ultimates, habilidades de Character e genetic abilities especiais. Na Guerra Mágica (ADR 0030) também paga defesa emergencial no turno inimigo — nunca o lance de abertura. Geração e teto = config.

Presença, pilha LIFO e pesos de tipologia: `docs/COMBAT_ENGINE.md`.

Draw e energy **no servidor**, com o `RandomService` da batalha.

---

## 5. Tipos de carta

`ATTACK` · `SKILL` · `REACTION` · `ULTIMATE` · `TACTIC` · `GENETIC` · `EQUIPMENT` · `CHARACTER`

Uma `CardDefinition` tem um tipo. Relíquias e genes não precisam ser tipos extras se só modificam effects.

---

## 6. Speed e prioridade

SPD dos genes **continua** (stats + faixas). Conceitos de resolução:

`FAST` · `NORMAL` · `SLOW` · `REACTION`

Ordem: **priority da carta** + faixa + SPD (fórmula exata na M4, com testes). Reactions podem interromper segundo `ReactionRule`. Não chutar a fórmula neste arquivo.

---

## 7. Formação

Slots canônicos V2:

- `FRONT`
- `MIDDLE`
- `BACK`

Slots clássicos V1 (replay / Alpha casual): `FRONT` / `BACK_LEFT` / `BACK_RIGHT`.

Cartas usam `TargetRule` (FRONT_ONLY, ANY_TARGETABLE, BACKLINE, PIERCE_FRONT, AOE_ALL, …). MIDDLE: alvo em rounds pares. BACK: protegido salvo regra específica ou colapso do FRONT.

O **servidor** valida e devolve `validTargets`. Cliente/Unity não calculam.

Detalhe: `docs/COMBAT_MATRIX.md`, `docs/FORMATIONS.md`, ADR 0022.

---

## 8. Elementos e sinergia

Chart elemental da v1 permanece (GDD §5). Gelo sem vantagem explícita → multiplicador 1 até o GDD mudar.

Cartas podem ter `element`, `damageType`, `status`, `synergyTags`. Dual-element suportado (skill e/ou criatura).

**SynergyDefinition** (data-driven), não ifs de FIRE+ELECTRIC no resolver. Composições ativam traits se as tags da party/cartas baterem na definição. Sinergia pode **evoluir** após rounds ou condições.

Canônico de demonstração (GDD §3.1):

| Tags / condição | Sinergia | Efeito exemplo |
| --- | --- | --- |
| BURN + TANK | FORNALHA VIVA (`LIVING_FURNACE`) | `MOLTEN_ARMOR` — Shield; atacantes recebem Burn |
| FORNALHA VIVA + VIDA + RESISTÊNCIA | FORTALEZA VIVA | cartas especializadas (pós-Alpha) |
| FIRE + ELECTRIC | PLASMA | unlock / modify |
| NATURE + WATER | OVERGROWTH | unlock / modify |
| LIGHT + DARK | ECLIPSE | unlock / modify |

O ponto: arquétipos diferentes juntos geram cartas que **não existiam** no kit individual. Jogadores descobrem comps.

---

## 9. Genes → cartas

Genes de **stat** (HP/ATK/…) **não** são o deck. O deck genético são os **10 loci** (ADR 0011).

Cada alelo expressed aponta para uma expressão de carta:

`cardFamily` · `variant` · `element` · `powerExpression` · `energyExpression` · `speedExpression` · `statusExpression` · `targetExpression` · `modifierGenes` · `mutationState`

Não é só `cardId`. Fórmulas ficam para a M4; não hardcode no resolver.

Podem: unlock card, replace card, modify cost, alter target, alter element, add status, change behavior, conditional effects.

Raridade **nunca** garante mais dano. Trade-off / sidegrade / especialização.

Exemplo conceitual — Fireball:

- Gene A: reduz Energy
- Gene B: adiciona Burn
- Gene C: converte parte do dano para Lightning

Breeding altera o **deckbuilding**, não só a ficha numérica. Ver `docs/BREEDING.md`.

**Cópias de carta ≠ poder bruto.** Evolução por cópias muda mecânica (branch de família: Predatory / Infernal / Plasma), nunca `N cópias = +X% dano`. Idade da criatura é outra régua (GDD §3.1 pilar 6).

---

## 10. Mutações

Unlock de famílias de cartas, alteração de cartas existentes, sinergia elemental, passives. Data-driven (`Mutation` + modificadores em CardDefinition), não switch gigante.

---

## 11. Equipment e Relics

Equipment: grant card, modify card, add reaction, change energy, alterar mecânica — além de stats.

**Relic:** build-defining. Quantidade equipada limitada (config; slot Relic do GDD). Regras específicas da build via dados, não hardcoded.

---

## 12. Character e classes

O avatar joga cartas. Classes fornecem **card pools**. Mapeamento conceitual (não implementar classes novas na M2):

| Pool | Papel tático |
| --- | --- |
| DOMADOR | swap, protection, buffs de criatura |
| ARCANISTA | magia, energy, dispel |
| GENETICISTA | ativação de gene, adaptation |
| CAÇADOR | targeting, critical, traps |
| GUARDIÃO | shield, taunt, defense |

A classe persistida hoje é `HUNTER` (M1). Alquimista permanece no GDD; pool de cartas pode vir de classe **e/ou** profissão. Detalhe na M4.

---

## 13. Evolução de cartas

Variantes e **branches**, não só +10% dano.

Ex.: Fireball → Inferno | Plasma | Phoenix Flame.

`upgradePaths[]` na `CardDefinition`. Árvore completa **não** é definida aqui.

---

## 14. NFTs

Cartas **não** são tokens. As 10 genetic cards **não** são 10 NFTs. NFT = Character, Creature, Egg, Equipment, Artifacts, itens apropriados (ADR 0008). O Genesis Certificate da Creature pode listar as 10 expressed.

Cartas = função pura do estado desses assets. Skill Rune NFT = avaliação futura, ADR próprio.

Raridade/preço de NFT **não** determina vitória. Peso competitivo: strategy + composition + genes + deck + decisões.

---

## 15. CardDefinition (data-driven)

**Não** criar uma classe TypeScript por carta.

Campos conceituais: `id`, `key`, `name`, `type`, `cost`, `priority`, `element`, `targetType`, `tags`, `effects[]`, `conditions[]`, `upgradePaths[]`, `animationKey`.

Effects compostos pelo **EffectResolver**. Exemplos de opcodes:

`DAMAGE` `HEAL` `SHIELD` `APPLY_STATUS` `REMOVE_STATUS` `DRAW` `DISCARD` `GAIN_ENERGY` `GAIN_MOMENTUM` `MOVE` `SWAP` `MODIFY_CARD` `SUMMON`

Centenas de cartas = dados + opcodes, não mil arquivos.

---

## 16. Status engine

Data-driven. Exemplos: BURN, POISON, BLEED, SHOCK, FREEZE, SLEEP, SILENCE, BLIND, STUN, FEAR.

Cada status: duration, stacks, triggers, dispellable, source. Números em config.

---

## 17. Combos e reações

Effects reagem a tags/status via **InteractionDefinition** / **ReactionRule**, não if/else espalhado.

Exemplo conceitual: `SHADOW_MARK` + `MOONLIGHT` → `ECLIPSE_MARK`.

---

## 18. Arquétipos

A engine **não deve impedir**: Aggro, Control, Stall, Sustain, Burst, Burn, Poison, Bleed, Critical, Summon, Discard, Energy denial, Combo, Shield, Sacrifice, Speed, Counter.

Não significa implementar todos na M4.

---

## 19. Motor determinístico

```text
BattleState + Action + Seed  →  NewBattleState
```

`Battle.rngSeed` + log de actions = replay. Testes **sem** Phaser, DB ou WebSocket.

Dano (quando um effect `DAMAGE` rodar) continua podendo usar stats, genes, elemento, CRIT, PRECISION — como pipeline interno do opcode, não como “skill slot 2”.

Gelo: `calculateElementMultiplier()` permanece 1 até o GDD §5.

---

## 20. PvE e PvP

**Mesmo engine.**

PvE: wild, trainer, elite, boss, dungeon, world boss, tower. Bosses podem ter cartas e regras exclusivas (dados).

PvP futuro: STANDARD, EQUALIZED, DRAFT, SEASONAL, TOURNAMENT, CUSTOM. High-rank: ban/pick. Matchmaking é outro módulo. Cliente não envia “eu ganhei”.

Captura (M5) continua intenção `CAPTURE`; chance no servidor. Enfraquecer o alvo é estado de batalha, não carta NFT.

---

## 21. IA PvE

Política por espécie/boss (agressiva, controle, etc.) no servidor. Cliente só anima. A IA escolhe `PLAY_CARD` válidos, não dano.

---

## 22. O que a M0 já tem (não reescrever agora)

- `combat.config` legado (team 3 / 1 ativa) — **substituído conceitualmente**; código só na M4.
- `calculateElementMultiplier()` testado.
- Modelos `Battle` / `BattleLog` (seed + eventos). Estender o log para actions de carta na M4, sem migration agora.

## 23. O que não fazer agora

- Battle Engine, EffectResolver, Phaser de combate, salas `battle-pve`
- Migration de `CardDefinition`
- Redesign de classes no Prisma
- Qualquer carta jogável na M2
