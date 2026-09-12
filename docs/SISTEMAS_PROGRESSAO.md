# Progressão, captura, economia e mundo — detalhe (Alpha)

Complementa [`ESTADO_ATUAL.md`](ESTADO_ATUAL.md). Batalha: [`SISTEMAS_BATALHA.md`](SISTEMAS_BATALHA.md). Breeding: [`SISTEMAS_BREEDING.md`](SISTEMAS_BREEDING.md).

---

## 1. Duas réguas da criatura

**Não misturar.**

| Eixo | Campos | Como sobe | O que destrava |
| --- | --- | --- | --- |
| Combate | `xp`, `level` | Fim de batalha PvE | Level 10 / 20 (junto com maturação) |
| Maturação | `maturationXp` | PvE no World, party ativa | BABY→YOUNG (100), YOUNG→ADULT (350) |

READY_TO_EVOLVE exige **os dois**. Jogador confirma em `POST /creatures/:id/evolve` (Câmara Genesis). Sem auto-evolve. GOLD/NEX não vendem Growth.

Mesmo Creature ID, mesmos genes, mesmo `geneticHash`. Só `lifeStage` (e escala 3D) muda.

Curva Combat XP: base 80, growth 1.12, cap 50. Personagem: base 100, growth 1.15.

### Maturation XP (grant)

Idempotente por `battleId + creatureId`. Só PvE. Só quem estava na party.

```text
gain = familyXp × participation × diversityShare × (discovery? 1.5 : 1)
derrota: × 0.25
```

| Família do encontro | XP base |
| --- | ---: |
| COMMON | 2 |
| UNCOMMON | 4 |
| ELITE | 10 |
| BOSS | 25 |

Participation 0.25–1.0: cartas jogadas, dano, suporte, rounds vivo, presença. KO não zera se participou.

Diversidade no dia, mesma species: primeiras 10 = 100%, 11–20 = 70%, resto = 40% (nunca 0). Primeira vitória da species no bioma: +50%.

---

## 2. Captura (resumo operacional)

Acontece **dentro** do PvE via `CAPTURE` + `orbKey`. Fórmula completa em [`SISTEMAS_BATALHA.md`](SISTEMAS_BATALHA.md) §12.

Criatura capturada: origem WILD, generation 0, fertility 5, 10 loci rolados do pool da espécie (não copia o selvagem 1:1 além da species/level da offer — o engine gera blueprint com a seed da captura). Entra na coleção `PENDING_VISUAL` se arte oficial estiver on.

Quest `first-hunt`: 180 GOLD + 3 NexOrb + 40 XP de personagem.

---

## 3. Economia (o que o código faz)

Ledger obrigatório: `credit` / `debit` com `source` + `referenceId` + saldos before/after. `BigInt`.

| Evento | Source | Valor Alpha |
| --- | --- | --- |
| Register | (saldo inicial, sem linha se 0; hoje **100 000** GOLD de teste) | `starting.gold` |
| `first-spark` | QUEST_REWARD | 300 GOLD + 5 orbs + 1 catalyst |
| `first-hunt` | QUEST_REWARD | 180 GOLD + 3 orbs |
| Win PvE | PVE_REWARD | 12–25 / 40–80 / 120–250 conforme tier |
| PvP casual | — | 0 |
| Shop | SHOP_PURCHASE | preço do catálogo |
| Breed | BREEDING_COST | fórmula 250×(1+0.4×usos) |
| Listar market | MARKET_LISTING_FEE | 1%, mín. 5 |
| Venda market | MARKET_SALE + MARKET_FEE | 95% seller, 5% sink |

Budget diário **800** GOLD nos faucets PVE_REWARD + PVP_REWARD. Tutorial não conta. Depois do cap: corta Gold, mantém XP/drop/captura.

NEX: wallet existe, `enabled: false`. Admin recusa adjust NEX. NEX não vende poder.

Loja: só 4 NexOrbs. `forbiddenShopKeys` bloqueia gene, reroll, mutação, DNA perfeito, growth XP, evolve instantâneo.

Market: só Creature **revelada**. Compra atômica (lock → débito → crédito líquido → sink → troca dono → MarketTransaction). Cancel devolve o listing.

---

## 4. Mundo (Haven / Verdantis)

Colyseus salas `haven` e `verdantis`. Cliente manda intenção de movimento; servidor clampa.

| | Haven | Verdantis |
| --- | --- | --- |
| Encontros | não | sim |
| Portal | → Verdantis | → Haven |
| NPCs | Kael, Lyra, Orin, Theo, Arena, Câmara | — |

Encontro: mob no chão (`verdantisMobSpawns`) **ou** chance 0.14 por passo (cooldown 8 passos). Offer TTL 90 s. Combate HTTP com `offerId`.

Respawn: common 45 s, uncommon 90 s, elite 3 min, boss 10 min.

Posição do personagem: só o game-server grava `mapKey/posX/posY`. Recusar x/y no REST.

Phaser = DEV_WORLD. Unity `/game-unity` = vitrine (sem Colyseus).

---

## 5. Starter e coleção

`POST /creatures/starter`: Pyron, Nympha ou Florune + 2 companions das outras espécies → roster 5. Party de combate = 3.

Cada nascimento (starter, wild, hatch) sela:

- genes F–SS
- 10 loci × 2 alelos
- kit `gxr-kit-v1` / GCE em `expressedJson` / `combatManifestJson`
- `visualGenomeJson` + `chassisSignature` unique

Primeira leitura de criatura legado sela o kit; versão nova do algoritmo **não** reescreve.

Renomear: `PATCH /creatures/:id` (dono, servidor valida).

---

## 6. Quests Alpha

| Key | Trigger | Prêmio |
| --- | --- | --- |
| first-spark | tutorial / `POST /quests/first-spark/complete` | 300 GOLD, 5 orbs, 1 catalyst |
| first-hunt | primeira captura | 180 GOLD, 3 orbs, 40 XP |

Sem daily, dungeon, guild quest.

---

## 7. Auth (necessário para tudo acima)

- Register / login / refresh com rotação / logout / `GET /auth/me`
- Access JWT ~15 min; refresh opaco (hash SHA-256)
- 1 Character por User; classe HUNTER no servidor
- Dívida: JWT sem denylist pós-logout (válido até TTL)

---

## 8. Arquivos

| Sistema | Caminho |
| --- | --- |
| Maturation | `packages/game-engine/src/progress/maturation.ts`, `apps/api/.../maturation.service.ts` |
| Ledger | `apps/api/src/common/ledger.ts` |
| Market | `apps/api/src/modules/market/market.service.ts` |
| Shop / inventário | `apps/api/src/modules/economy/` |
| Mundo | `apps/game-server/src/rooms/world-room.ts`, `packages/config/src/world.ts` |
| Starter | `apps/api/src/modules/creatures/creatures.service.ts` |
