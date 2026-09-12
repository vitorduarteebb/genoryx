# Economia — GENORYX: Genesis

Nenhuma regra econômica vive só no frontend. Ledger é obrigatório.

Números canônicos: `packages/config/src/economy.ts` (`@nexora/config` / subpath `@nexora/config/economy` até o rename ADR 0012). Profiles: `alpha` | `production` (`ECONOMY_PROFILE`).

## 1. Três camadas

| Camada | O que é | Alpha |
| --- | --- | --- |
| **GOLD** | moeda de gameplay, só servidor | ativa, ledger |
| **NEX** | premium / Web3 futura | wallet existe, saldo 0, sem faucet, sem sink, sem ERC-20 |
| **ASSETS** | Character, Creature, Egg, Equipment, Materials, Cosmetics | no banco; chain é ownership assíncrono depois |

GOLD **não** é token. Blockchain **não** é requisito de gameplay.

## 2. Start

Registro: GOLD 0, NEX 0. Sem linha de ledger para zero.

Primeira quest tutorial (`first-spark`), via ledger:

- 300 GOLD (`QUEST_REWARD`)
- 5 NexOrb
- 1 Genome Catalyst

Starter **não** minta GOLD.

## 3. Faucets Alpha (GOLD)

| Fonte | Faixa |
| --- | --- |
| Wild | 12–25 |
| Elite | 40–80 |
| Boss | 120–250 |
| Quest | 50–300 |
| PvP Casual | **0** |
| PvP Competitive | 20 / vitória, sujeito ao budget diário |

`dailyGoldRewardBudget` Alpha = **800**. Depois do cap: cortar Gold, manter XP / material / captura.

Tutorial e quests de história **não** comem o budget de PvE/PvP.

## 4. Genome Catalyst

Material (`genome_catalyst`). Não é currency. Limita expansão populacional.

Fontes: quests, PvE, bosses, events. Pode ser tradable. **Não** vender supply ilimitado no NPC.

## 5. Breeding (sink)

Requer na mesma transação:

- GOLD (servidor)
- 1 Genome Catalyst
- 1 fertility de cada pai

```
cost = 250 * (1 + 0.40 * parentA.breedsUsed + 0.40 * parentB.breedsUsed)
```

Config-driven. Cliente não manda o valor. Falha = rollback (Gold, catalyst, fertility).

Evolução BABY → YOUNG → ADULT **não** cobra Gold (XP/Level).

## 6. Market

| Taxa | Regra | Destino |
| --- | --- | --- |
| Listing | 1%, mínimo 5 GOLD | `SYSTEM_SINK` |
| Sale | 5% | `SYSTEM_SINK` |

Compra atômica: débito buyer, crédito seller líquido, crédito sink, troca de dono, `MarketTransaction`. Erro = rollback. Taxa **não** some sem ledger.

Exemplo 1000 GOLD: listing 10; buyer −1000; seller +950; sink +50 (+ listing 10).

## 7. Shop Alpha

Só orbes. Sem genes, reroll, mutação garantida, DNA perfeito, compra direta de Gold, pay-to-win.

| Item | GOLD |
| --- | --- |
| NexOrb | 40 |
| NexOrb+ | 120 |
| Ultra | 350 |
| Ancient | 1000 |

Source: `SHOP_PURCHASE`.

## 8. Ledger

Toda mutação de GOLD gera `CurrencyTransaction` (`source`, `referenceId`, `balanceBefore`, `balanceAfter`).

Sources: `QUEST_REWARD`, `PVE_REWARD`, `PVP_REWARD`, `BREEDING_COST`, `SHOP_PURCHASE`, `MARKET_LISTING_FEE`, `MARKET_SALE`, `MARKET_FEE`, `CRAFT_COST`, `SYSTEM_GRANT`, `ADMIN_ADJUSTMENT`, `SYSTEM_SINK`.

Wallet + Market + Breeding + Shop = `$transaction` atômica.

Recompensa de faucet: no máximo uma vez por `(userId, source, referenceId)`.

Ajuste admin: `ADMIN_ADJUSTMENT` + `AdminActionLog` com motivo. NEX recusado no Alpha.

## 9. Métricas

`EconomyDailySnapshot` (dia UTC) + dashboard interno `GET /admin/economy/dashboard?window=24h|7d|30d` (Control Center, não público).

Supply: criaturas total / dia, ovos, breeds, capturas, distribuição de fertility restante, catalysts in/out.

## 10. O que esta fatia não faz

- Emissão de NEX / ERC-20
- Compra direta de Gold
- Venda de gene / poder / mutação garantida
- 105 sistemas econômicos
- Chain (gameplay continua no Postgres)
