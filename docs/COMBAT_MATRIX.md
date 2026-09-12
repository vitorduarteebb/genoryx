# Combat Matrix V2 — GENORYX

Fatia competitiva V2 já prototipada. O fluxograma de batalha canônico é `docs/COMBAT_SYSTEM.md` (ADR 0031). Onde esta fatia divergir do fluxograma, a reconciliação futura alinha a fatia — não o contrário.

Onde conflitar com formação/targeting clássicos V1, **esta spec vence** para batalhas `rulesVersion = V2` até essa reconciliação.

Motor: server-authoritative, determinístico, data-driven, replayable. Sem LLM no combate. `RandomService` obrigatório.

## Fluxo

```text
ROSTER 5 → BAN 1 → PICK 3 → FORMAÇÃO F/M/B → DECK/MÃO → BATALHA
→ DESCARTE/RECICLAGEM → ROUND 5+ FUSÃO → ROUND 7+ CONVERGÊNCIA
```

Draft: `ROSTER_LOCK` → `BAN_PHASE` → `PICK_PHASE` → `FORMATION_PHASE` → `READY` → `ACTIVE`.
A criatura do banco **não** entra. Sem swap nesta V1 do draft.

## Formação

| Slot | Papel |
| --- | --- |
| FRONT | sempre alvo single-target padrão |
| MIDDLE | protegido em rounds ímpares; alvo em pares |
| BACK | protegido, salvo BACKLINE / PIERCE / AOE / colapso |

FRONT KO: MIDDLE → FRONT, BACK → MIDDLE.  
MIDDLE KO: FRONT e BACK ficam.  
BACK KO: nada.

## Cartas

Deck alvo 16. Mão 5, compra 2, teto 8, energy 3 — config.  
Jogar → discard. Deck vazio → recycle com shuffle do `RandomService`.  
`BattleUsageHistory` **não** some no recycle. Fusion lê o histórico, não o pile.

Cada instância pode guardar `sourceCreatureId`, `geneticPowerId`, `typology`, `element`, `locus`.

## Fusão e Convergência

Party define o que **pode** existir. Cartas jogadas + resonance definem o que **desperta**.

Round 1–4: fusion disabled.  
Round 5: avalia candidatos (máx. 3 doubles). Área própria, não a mão. Custo de energy.  
Round 7+: CONVERGENCE se 3 typologies vivas + usage + resonance + momentum.

KO: typology morta não entra em **novas** oportunidades. Fusão já despertada permanece.

Famílias V1: LIVING_FURNACE, VITAL_ASHES, INCANDESCENT_MARK, LIVING_BASTION, CONTROLLED_REGENERATION, PHOENIX_CYCLE (convergência).

## Flags

`COMBAT_DRAFT_V2` · `FORMATION_LINEAR_V2` · `FUSION_V2` · `CONVERGENCE_V1`  
Default `false`. Alpha casual continua V1 até ativação.

Prova: `/dev/combat-matrix`.

Guerra Mágica (pilha LIFO + fadiga), memória tática de draft e fórmulas de fusão: `docs/COMBAT_ENGINE.md`. Funções em `@nexora/game-engine`. Ainda não ligadas ao `reduceBattle` — intenção entra no reduce; estes módulos calculam.
